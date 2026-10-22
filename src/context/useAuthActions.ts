import type { UserCredential } from 'firebase/auth';
import {
  signInWithEmailAndPassword,
  signInWithPopup,
  signInWithRedirect,
  signOut,
} from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import type { UserProfile, UserRole } from '../types/attendance';
import { auth, db, googleProvider } from '../lib/firebase';
import { PLATFORM_OWNER_EMAILS } from './attendanceContextSupport';
import { setApiTenantOverride } from '../lib/api';
import { localCache } from '../utils/localCache';

export type CredentialSignInResult = {
  success: boolean;
  user?: UserProfile;
  error?: string;
  isFirebase?: boolean;
};

interface UseAuthActionsParams {
  tenantId: string;
  setTenantId?: (tenantId: string) => void;
  allUsers: UserProfile[];
  currentUserRole: UserRole;
  setUserRole: (role: UserRole) => void;
}

export function useAuthActions({
  tenantId,
  setTenantId,
  allUsers,
  setUserRole,
}: UseAuthActionsParams) {
  const signInWithGoogle = async (useRedirect = false): Promise<UserCredential | undefined> => {
    try {
      if (useRedirect) {
        await signInWithRedirect(auth, googleProvider);
        return undefined;
      }
      return await signInWithPopup(auth, googleProvider);
    } catch (error: any) {
      console.error('Google Sign-In Error:', error);
      if (error?.code === 'auth/popup-blocked') {
        console.warn('Popup blocked by browser, falling back to signInWithRedirect...');
        await signInWithRedirect(auth, googleProvider);
        return undefined;
      }
      throw error;
    }
  };

  const signOutGoogle = async () => {
    try {
      await signOut(auth);
    } catch (error) {
      console.error('Sign Out Error:', error);
      throw error;
    }
  };

  const signInWithCredentials = async (
    targetEmail: string,
    pass: string
  ): Promise<{ success: boolean; user?: UserProfile; error?: string; isFirebase?: boolean }> => {
    const trimmed = targetEmail.trim().toLowerCase();

    // 1. Attempt Firebase Authentication (Email/Password)
    try {
      const userCred = await signInWithEmailAndPassword(auth, trimmed, pass);
      const fUser = userCred.user;

      // 1. Platform Owner Check:
      // The platform owner is the ONLY role that can log into any school with their credentials.
      let isOwner = PLATFORM_OWNER_EMAILS.includes(trimmed);

      if (!isOwner) {
        try {
          const ownerDoc = await getDoc(doc(db, 'admins', fUser.uid));
          if (ownerDoc?.exists?.() && (ownerDoc.data() as any)?.role === 'super_admin') {
            isOwner = true;
          }
        } catch {
          // ignore read error
        }
      }

      if (!isOwner) {
        const localMatch = allUsers.find((u) => u.email.toLowerCase() === trimmed);
        if (localMatch?.role === 'super_admin') {
          isOwner = true;
        }
      }

      if (isOwner) {
        const ownerProfile: UserProfile = {
          id: fUser.uid,
          tenantId: tenantId || 'platform',
          name: fUser.displayName || 'مالك المنصة (Platform Owner)',
          role: 'super_admin',
          phone: fUser.phoneNumber || '',
          email: fUser.email || trimmed,
          status: 'active',
        };
        setUserRole('super_admin');
        return { success: true, user: ownerProfile, isFirebase: true };
      }

      // 2. Non-Owner Roles (Manager/Admin, Registrar, Teacher, Parent):
      // The login user/password determines the school.
      let userTenantId: string | undefined;
      let userRole: UserRole | undefined;
      let userStatus: 'active' | 'inactive' = 'active';
      let userName = fUser.displayName || fUser.email?.split('@')[0] || 'مستخدم معتمد';
      let userPhone = fUser.phoneNumber || '';

      // Check Firestore users collection
      try {
        const userDoc = await getDoc(doc(db, 'users', fUser.uid));
        if (userDoc?.exists?.()) {
          const data = userDoc.data() as any;
          userTenantId = data.tenantId;
          userRole = data.role as UserRole;
          userStatus = data.status === 'inactive' ? 'inactive' : 'active';
          if (data.name) userName = data.name;
          if (data.phone) userPhone = data.phone;
        }
      } catch (err) {
        console.warn('[AUTH] Could not read user profile from Firestore:', err);
      }

      // Check local user registry if not fully resolved from Firestore
      if (!userTenantId) {
        const localMatch = allUsers.find((u) => u.email.toLowerCase() === trimmed);
        if (localMatch) {
          userTenantId = localMatch.tenantId;
          userRole = userRole || localMatch.role;
          userStatus = localMatch.status === 'inactive' ? 'inactive' : 'active';
          userName = localMatch.name || userName;
          userPhone = localMatch.phone || userPhone;
        }
      }

      // Account status check
      if (userStatus === 'inactive') {
        return {
          success: false,
          error: 'تم تعطيل هذا الحساب مؤقتاً من قبل إدارة المدرسة.',
        };
      }

      // Never inherit the tenant of whoever used this browser before. A
      // non-owner account without an explicit school assignment must fail
      // closed; the server will reject its writes, and its UI must not render
      // another school's shell in the meantime.
      if (!userTenantId) {
        return {
          success: false,
          error: 'تعذر تحديد المدرسة المرتبطة بهذا الحساب. راجع إدارة المنصة.',
        };
      }

      const finalTenantId = userTenantId;
      const finalRole = userRole || 'parent';

      // The login user/password determines the school: switch session to assigned school
      if (userTenantId && userTenantId !== 'platform') {
        if (setTenantId) {
          setTenantId(userTenantId);
        }
        setApiTenantOverride(userTenantId);
        if (typeof localStorage !== 'undefined') {
          try {
            localStorage.setItem('school_dev_selected_tenant', userTenantId);
          } catch {}
        }
        if (typeof localCache !== 'undefined') {
          try {
            localCache.setItem('school_current_tenant_id', userTenantId);
          } catch {}
        }
      }

      if (finalRole) {
        setUserRole(finalRole);
        if (typeof localStorage !== 'undefined') {
          try {
            localStorage.setItem('school_current_user_role', finalRole);
          } catch {}
        }
      }

      const userProfile: UserProfile = {
        id: fUser.uid,
        tenantId: finalTenantId,
        name: userName,
        role: finalRole,
        phone: userPhone,
        email: fUser.email || trimmed,
        status: userStatus,
      };

      return { success: true, user: userProfile, isFirebase: true };
    } catch (firebaseErr: any) {
      console.warn('[AUTH] Firebase sign-in failed:', firebaseErr.code);
      const isWrongPass = firebaseErr.code === 'auth/wrong-password' || firebaseErr.code === 'auth/invalid-credential';
      return {
        success: false,
        error: isWrongPass
          ? 'كلمة المرور غير صحيحة.'
          : 'تعذر تسجيل الدخول. تحقق من بيانات الحساب أو تواصل مع إدارة المدرسة.',
      };
    }
  };
  return { signInWithGoogle, signOutGoogle, signInWithCredentials };
}

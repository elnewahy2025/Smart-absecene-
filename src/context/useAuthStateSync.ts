import { useEffect } from 'react';
import { getRedirectResult, onAuthStateChanged, signOut } from 'firebase/auth';
import type { User as FirebaseUser } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import { auth, db, handleFirestoreError, OperationType } from '../lib/firebase';
import type { UserProfile, UserRole } from '../types/attendance';
import { PLATFORM_OWNER_EMAILS } from './attendanceContextSupport';
import { resolveEffectiveTenant } from '../utils/accountAccess';

interface AuthStateSyncDeps {
  requestedTenantId: string | null;
  allUsers: UserProfile[];
  currentUserRole: UserRole;
  tenantId: string;
  setTenantId: (id: string) => void;
  setUserRole: (role: UserRole) => void;
  setAuthenticatedPhone: (phone: string) => void;
  setAllUsers: React.Dispatch<React.SetStateAction<UserProfile[]>>;
  setFirebaseUser: (user: FirebaseUser | null) => void;
}

/**
 * Mirrors Firebase Auth state into the provider: redirect results, platform-owner
 * detection, role/tenant claims and the server-provisioned profile document.
 */
export function useAuthStateSync({
  requestedTenantId,
  allUsers,
  currentUserRole,
  tenantId,
  setTenantId,
  setUserRole,
  setAuthenticatedPhone,
  setAllUsers,
  setFirebaseUser,
}: AuthStateSyncDeps) {
  // Listen to Firebase Auth redirect results (for production deployments like Vercel & mobile browsers)
  useEffect(() => {
    getRedirectResult(auth)
      .then((result) => {
        if (result?.user) {
          setFirebaseUser(result.user);
        }
      })
      .catch((err) => {
        console.warn('[AUTH] getRedirectResult check:', err);
      });
  }, []);

  // Listen to Firebase Auth state and synchronize user role & tenant from Firestore
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setFirebaseUser(user);
      if (user) {
        const userEmail = (user.email || '').toLowerCase();

        // Honour the explicit ?tenant= selection for the platform owner only.
        // School accounts are always pinned to their own tenant: a link asking
        // for another school is ignored instead of ending the session, so
        // opening other schools (in other tabs, browsers, or devices) can never
        // sign out or disturb the session that is already running here.
        const applyAccountTenant = (role: UserRole, accountTenantId?: string) => {
          const effective = resolveEffectiveTenant(role, accountTenantId, requestedTenantId);
          if (!effective) {
            // An unassigned school account must not inherit whatever tenant was
            // last selected in this browser. End the session instead of
            // rendering a school shell the account does not own.
            console.warn('[AUTH] Account has no tenant assignment; ending the session.');
            void signOut(auth).catch(() => {});
            return false;
          }
          setTenantId(effective);
          return true;
        };

        // 1. If user is the Platform Owner
        if (PLATFORM_OWNER_EMAILS.includes(userEmail)) {
          setUserRole('super_admin');
          applyAccountTenant('super_admin');
          return;
        }

        // 1b. Fall back to the Admin SDK-managed owner document so a missing
        // VITE owner-email entry cannot lock the platform owner out.
        try {
          const ownerSnap = await getDoc(doc(db, 'admins', user.uid));
          if (ownerSnap.exists() && (ownerSnap.data() as any)?.role === 'super_admin') {
            setUserRole('super_admin');
            applyAccountTenant('super_admin');
            return;
          }
        } catch (ownerErr) {
          console.warn('[AUTH] Could not read the platform-owner document:', ownerErr);
        }

        // 2. Check local user registry for known seeded users / roles
        const matchedLocalUser = allUsers.find((u) => u.email.toLowerCase() === userEmail);

        if (matchedLocalUser) {
          if (matchedLocalUser.role) {
            setUserRole(matchedLocalUser.role);
          }
          applyAccountTenant(matchedLocalUser.role || currentUserRole, matchedLocalUser.tenantId);
          return;
        }

        const userProfileRef = doc(db, 'users', user.uid);
        try {
          const userSnap = await getDoc(userProfileRef);
          if (userSnap.exists()) {
            const data = userSnap.data();
            // Profiles are server-provisioned and always carry an explicit
            // status. A missing/non-active status means this is a legacy or
            // unprovisioned account and must not receive tenant data.
            if (data.status !== 'active') {
              console.warn('[AUTH] Inactive or unprovisioned profile; ending the session.');
              await signOut(auth).catch(() => {});
              return;
            }
            if (data.role) {
              setUserRole(data.role as UserRole);
            }
            applyAccountTenant((data.role as UserRole) || currentUserRole, data.tenantId);
            setAuthenticatedPhone(data.phone || '');
            setAllUsers((prev) => {
              const profile = {
                ...data,
                id: user.uid,
                userId: user.uid,
                tenantId: data.tenantId || tenantId,
                name: data.name || user.displayName || 'مستخدم معتمد',
                email: data.email || user.email || '',
                role: (data.role as UserRole) || 'parent',
                phone: data.phone || '',
                status: data.status,
              } as UserProfile;
              const map = new Map(prev.map((item) => [item.id, item]));
              map.set(profile.id, profile);
              return Array.from(map.values());
            });
          } else {
            // Accounts are provisioned by staff through the server (Admin SDK).
            // Never invent a trusted profile here: a self-created phone/email
            // could otherwise unlock another family's records.
            console.warn('[AUTH] No provisioned profile for this account; ending the session.');
            await signOut(auth).catch(() => {});
          }
        } catch (err) {
          handleFirestoreError(err, OperationType.WRITE, `users/${user.uid}`);
        }
      }
    });

    return () => unsubscribe();
  }, [requestedTenantId]);
}

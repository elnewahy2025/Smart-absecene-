import type { AuditLog, UserProfile, UserRole } from '../types/attendance';
import { localCache } from '../utils/localCache';
import { authenticatedFetch } from '../lib/api';
import type { UserAccountResult } from './attendanceContextSupport';

interface UseUserManagementParams {
  tenantId: string;
  currentUser: UserProfile;
  currentUserRole: UserRole;
  allUsers: UserProfile[];
  setAllUsers: React.Dispatch<React.SetStateAction<UserProfile[]>>;
  addAuditLog: (entry: Omit<AuditLog, 'id' | 'tenantId' | 'timestamp'>) => void;
}

export function useUserManagement({
  tenantId,
  currentUser,
  currentUserRole,
  allUsers,
  setAllUsers,
  addAuditLog,
}: UseUserManagementParams) {
  const createUser = async (userData: Omit<UserProfile, 'id' | 'tenantId'>): Promise<UserAccountResult> => {
    if (!userData.email || !userData.email.includes('@')) {
      return { success: false, message: 'البريد الإلكتروني مطلوب لإنشاء حساب دخول صالح.' };
    }

    let serverUser: UserProfile | null = null;
    let temporaryPassword: string | undefined;

    try {
      const response = await authenticatedFetch('/api/users', {
        method: 'POST',
        body: JSON.stringify({
          name: userData.name,
          email: userData.email,
          phone: userData.phone,
          role: userData.role,
          jobTitle: userData.jobTitle,
          status: userData.status || 'active',
          assignedClasses: userData.assignedClasses,
          assignedSubjects: userData.assignedSubjects,
          tenantId,
        }),
      });

      const payload = await response.json().catch(() => null);
      if (!response.ok || !payload?.success) {
        return {
          success: false,
          message: payload?.error || 'تعذّر إنشاء حساب الدخول على الخادم. تحقق من البيانات وحاول مجدداً.',
        };
      }

      temporaryPassword = payload.temporaryPassword;
      serverUser = payload.user as UserProfile;
    } catch (err) {
      console.warn('[USERS] Server account creation unavailable:', err);
      return {
        success: false,
        message: 'تعذّر الاتصال بالخادم لإنشاء حساب الدخول. لا يتم إنشاء حسابات محلية غير موثوقة.',
      };
    }

    if (!serverUser) {
      return { success: false, message: 'تعذّر إنشاء حساب الدخول على الخادم.' };
    }

    const newUser: UserProfile = {
      ...userData,
      ...serverUser,
      id: serverUser.id,
      tenantId,
      status: userData.status || 'active',
      createdAt: serverUser.createdAt || new Date().toISOString(),
    };

    setAllUsers((prev) => {
      const updated = [...prev, newUser];
      if (typeof localCache !== 'undefined') {
        localCache.setItem('school_users', JSON.stringify(updated));
      }
      return updated;
    });

    addAuditLog({
      action: 'create',
      entityType: 'settings',
      entityId: newUser.id,
      performerId: currentUser.id,
      performerRole: currentUserRole,
      performerName: currentUser.name,
      details: `تم إنشاء حساب مستخدم جديد (${userData.name}) بدور [${userData.role}] وتعيين الصلاحيات`,
      detailsEn: `A new user account (${userData.name}) was created with the role [${userData.role}] and permissions were assigned`,
    });

    return {
      success: true,
      message: temporaryPassword
        ? `تم إنشاء الحساب. كلمة المرور المؤقتة: ${temporaryPassword}`
        : 'تم إنشاء حساب المستخدم بنجاح.',
      user: newUser,
      temporaryPassword,
    };
  };

  const updateUser = async (userId: string, updates: Partial<UserProfile>): Promise<UserAccountResult> => {
    let serverError: string | null = null;

    try {
      const response = await authenticatedFetch(`/api/users/${encodeURIComponent(userId)}`, {
        method: 'PATCH',
        body: JSON.stringify({
          name: updates.name,
          phone: updates.phone,
          role: updates.role,
          jobTitle: updates.jobTitle,
          status: updates.status,
          assignedClasses: updates.assignedClasses,
          assignedSubjects: updates.assignedSubjects,
        }),
      });

      const payload = await response.json().catch(() => null);
      if (!response.ok || !payload?.success) {
        // A missing server account is expected for locally created demo users.
        if (response.status !== 404) {
          serverError = payload?.error || 'تعذّر تحديث حساب الدخول على الخادم.';
        }
      }
    } catch (err) {
      console.warn('[USERS] Server account update unavailable, updating local profile only:', err);
    }

    setAllUsers((prev) => {
      const updated = prev.map((u) => (u.id === userId && u.tenantId === tenantId ? { ...u, ...updates } : u));
      if (typeof localCache !== 'undefined') {
        localCache.setItem('school_users', JSON.stringify(updated));
      }
      return updated;
    });

    addAuditLog({
      action: 'update',
      entityType: 'settings',
      entityId: userId,
      performerId: currentUser.id,
      performerRole: currentUserRole,
      performerName: currentUser.name,
      details: `تم تعديل بيانات المستخدم وصلاحياته (${updates.name || userId})`,
      detailsEn: `User data and permissions were updated (${updates.name || userId})`,
    });

    if (serverError) {
      return { success: false, message: serverError };
    }
    return { success: true, message: 'تم تحديث بيانات المستخدم بنجاح.' };
  };

  const deleteUser = async (userId: string): Promise<{ success: boolean; message: string }> => {
    const target = allUsers.find((u) => u.id === userId && u.tenantId === tenantId);
    if (!target) {
      return { success: false, message: 'المستخدم غير موجود' };
    }
    if (target.role === 'super_admin' || target.id === 'user-owner') {
      return { success: false, message: 'حساب مالك المنصة محمي تماماً ولا يمكن حذفه.' };
    }
    if (target.id === currentUser.id) {
      return { success: false, message: 'لا يمكنك حذف حسابك الشخصي النشط حالياً' };
    }

    try {
      const response = await authenticatedFetch(`/api/users/${encodeURIComponent(userId)}`, {
        method: 'DELETE',
      });
      const payload = await response.json().catch(() => null);
      if (!response.ok && response.status !== 404) {
        return { success: false, message: payload?.error || 'تعذّر حذف حساب الدخول على الخادم.' };
      }
    } catch (err) {
      console.warn('[USERS] Server account deletion unavailable, removing local profile only:', err);
    }

    setAllUsers((prev) => {
      const updated = prev.filter((u) => u.id !== userId);
      if (typeof localCache !== 'undefined') {
        localCache.setItem('school_users', JSON.stringify(updated));
      }
      return updated;
    });

    addAuditLog({
      action: 'delete',
      entityType: 'settings',
      entityId: userId,
      performerId: currentUser.id,
      performerRole: currentUserRole,
      performerName: currentUser.name,
      details: `تم حذف حساب المستخدم (${target.name}) [${target.role}] من المدرسة`,
      detailsEn: `User account (${target.name}) [${target.role}] was deleted from the school`,
    });

    return { success: true, message: 'تم حذف حساب المستخدم بنجاح' };
  };

  return { createUser, updateUser, deleteUser };
}

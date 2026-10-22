import type {
  AuditLog,
  SchoolProvisionInput,
  SchoolSettings,
  TenantSchoolProfile,
  UserProfile,
} from '../types/attendance';
import type { TenantDomainConfig } from '../config/tenantRegistry';
import { getActiveTenantRegistry } from '../config/tenantRegistry';
import { getDefaultSchoolProfile } from '../config/tenantSettings';
import { getDefaultSchoolSettings } from '../config/defaultSettings';
import { localCache } from '../utils/localCache';
import { authenticatedFetch } from '../lib/api';

export interface SchoolProvisionResult {
  success: boolean;
  message: string;
  tenantId: string;
  principalEmail?: string;
  temporaryPassword?: string;
}

interface UseTenantProvisioningParams {
  tenantId: string;
  currentUser: UserProfile;
  dynamicTenants: TenantDomainConfig[];
  setDynamicTenants: React.Dispatch<React.SetStateAction<TenantDomainConfig[]>>;
  setSchoolProfilesMap: React.Dispatch<React.SetStateAction<Record<string, TenantSchoolProfile>>>;
  setSettingsMap: React.Dispatch<React.SetStateAction<Record<string, SchoolSettings>>>;
  setAllUsers: React.Dispatch<React.SetStateAction<UserProfile[]>>;
  addAuditLog: (entry: Omit<AuditLog, 'id' | 'tenantId' | 'timestamp'>) => void;
}

export function useTenantProvisioning({
  tenantId,
  currentUser,
  dynamicTenants,
  setDynamicTenants,
  setSchoolProfilesMap,
  setSettingsMap,
  setAllUsers,
  addAuditLog,
}: UseTenantProvisioningParams) {
  const provisionNewSchool = async (
    input: SchoolProvisionInput
  ): Promise<SchoolProvisionResult> => {
    try {
      const trimmedId = input.id.trim();
      const trimmedSubdomain = input.subdomain.trim().toLowerCase();

      // Check for conflict
      const activeRegistry = getActiveTenantRegistry();
      if (activeRegistry[trimmedId]) {
        return {
          success: false,
          message: `معرّف المدرسة (${trimmedId}) مسجل مسبقاً في المنصة.`,
          tenantId: trimmedId,
        };
      }
      const existingSubdomains = Object.values(activeRegistry).map((c) => c.subdomain.toLowerCase());
      if (existingSubdomains.includes(trimmedSubdomain)) {
        return {
          success: false,
          message: `النطاق الفرعي (${trimmedSubdomain}) محجوز مسبقاً لمدرسة أخرى.`,
          tenantId: trimmedId,
        };
      }

      // 1. Create TenantDomainConfig
      const newDomainConfig: TenantDomainConfig = {
        tenantId: trimmedId,
        subdomain: trimmedSubdomain,
        customDomains: input.customDomains && input.customDomains.length > 0
          ? input.customDomains
          : [
              `portal.${trimmedSubdomain}.edu`,
              `attendance.${trimmedSubdomain}-school.edu.sa`,
              `${trimmedSubdomain}.smartschool.com`,
              `${trimmedSubdomain}.localhost`,
            ],
        nameAr: input.nameAr.trim(),
        nameEn: input.nameEn.trim(),
        code: input.code.trim().toUpperCase(),
        cityAr: input.cityAr.trim(),
        cityEn: input.cityEn.trim(),
        academicYear: input.academicYear.trim(),
        currentTerm: 'الفصل الدراسي الأول',
        schoolType: input.schoolType,
        primaryColor: input.primaryColor || '#059669',
        logoText: input.logoText.trim() || input.nameAr.trim().charAt(0) || 'م',
        isActive: true,
      };

      // 2. Persist dynamic tenant
      const updatedDynamic = [...dynamicTenants.filter((d) => d.tenantId !== trimmedId), newDomainConfig];
      setDynamicTenants(updatedDynamic);
      if (typeof localCache !== 'undefined') {
        localCache.setItem('school_dynamic_tenants', JSON.stringify(updatedDynamic));
      }

      // 3. Create TenantSchoolProfile
      const defaultProfile = getDefaultSchoolProfile(trimmedId);
      const chosenCountry = input.countryAr?.trim() || defaultProfile.address?.country || 'المملكة العربية السعودية';
      const chosenDialCode = input.countryCallingCode?.trim() || defaultProfile.countryCallingCode || '+966';

      const newProfile: TenantSchoolProfile = {
        ...defaultProfile,
        tenantId: trimmedId,
        schoolName: input.nameAr.trim(),
        schoolCode: input.code.trim().toUpperCase(),
        genderType: input.schoolType,
        officialEmail: input.principalEmail.trim().toLowerCase(),
        countryCallingCode: chosenDialCode,
        generalPhone: input.principalPhone?.trim() || `${chosenDialCode}500000000`,
        websiteUrl: `https://${trimmedSubdomain}.smartschool.com`,
        address: {
          ...defaultProfile.address,
          country: chosenCountry,
          countryCallingCode: chosenDialCode,
          city: input.cityAr.trim(),
          district: 'حي النرجس',
          streetAddress: 'طريق الملك فهد',
        },
        leadership: {
          ...defaultProfile.leadership,
          principalName: input.principalName.trim(),
          principalEmail: input.principalEmail.trim().toLowerCase(),
          principalPhone: input.principalPhone?.trim() || `${chosenDialCode}500000000`,
        },
        academicYear: {
          ...defaultProfile.academicYear,
          hijriYear: input.academicYear.trim(),
        },
      };

      setSchoolProfilesMap((prev) => {
        const next = { ...prev, [trimmedId]: newProfile };
        if (typeof localCache !== 'undefined') {
          localCache.setItem('tenant_school_profiles', JSON.stringify(next));
        }
        return next;
      });

      // 4. Create default SchoolSettings
      setSettingsMap((prev) => {
        const next = {
          ...prev,
          [trimmedId]: {
            ...getDefaultSchoolSettings(tenantId),
            schoolName: input.nameAr.trim(),
          },
        };
        if (typeof localCache !== 'undefined') {
          localCache.setItem('school_settings', JSON.stringify(next));
        }
        return next;
      });

      // 5. Persist to the server (Firestore) and create the principal's login so
      //    the school is reachable from any device/subdomain immediately.
      let temporaryPassword: string | undefined;
      let principalCreationWarning: string | null = null;
      try {
        const response = await authenticatedFetch('/api/tenants/provision', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            ...newDomainConfig,
            principal: {
              name: input.principalName.trim(),
              email: input.principalEmail.trim().toLowerCase(),
              phone: input.principalPhone?.trim() || '',
              password: input.principalPassword,
            },
            schoolProfile: newProfile,
            settings: {
              ...getDefaultSchoolSettings(tenantId),
              schoolName: input.nameAr.trim(),
            },
          }),
        });

        const payload = await response.json().catch(() => null);
        if (!response.ok || !payload?.success) {
          return {
            success: false,
            message: payload?.error || 'فشل حفظ بيانات المدرسة على الخادم. تحقق من الصلاحيات وحاول مجدداً.',
            tenantId: trimmedId,
          };
        }
        temporaryPassword = payload.principal?.temporaryPassword;
      } catch (syncErr: any) {
        console.warn('Could not sync dynamic tenant to server:', syncErr);
        principalCreationWarning = syncErr?.message || 'تعذّر الاتصال بخادم الحسابات';
      }

      // 6. Create Principal user profile
      const principalUser: UserProfile = {
        id: `user-admin-${trimmedId}`,
        tenantId: trimmedId,
        name: input.principalName.trim(),
        role: 'admin',
        email: input.principalEmail.trim().toLowerCase(),
        phone: input.principalPhone?.trim() || '',
        jobTitle: 'مدير المدرسة (School Principal)',
        status: 'active',
      };

      setAllUsers((prev) => {
        const filtered = prev.filter((u) => u.email.toLowerCase() !== principalUser.email.toLowerCase());
        const next = [...filtered, principalUser];
        if (typeof localCache !== 'undefined') {
          localCache.setItem('school_users', JSON.stringify(next));
        }
        return next;
      });

      // 7. Record in Audit Log
      addAuditLog({
        entityType: 'settings',
        entityId: trimmedId,
        action: 'create',
        performerId: currentUser.id,
        performerName: currentUser.name,
        performerRole: currentUser.role,
        details: `تأسيس مدرسة جديدة بالمنصة: ${input.nameAr} (${input.code}) بنطاق فرعي (${trimmedSubdomain}). تم إنشاء حساب المدير: ${input.principalEmail}`,
        detailsEn: `Establishing a new school on the platform: ${input.nameAr} (${input.code}) with subdomain (${trimmedSubdomain}). Principal account created: ${input.principalEmail}`,
      });

      const accessUrl =
        typeof window !== 'undefined' ? `${window.location.origin}/?tenant=${trimmedId}` : `/?tenant=${trimmedId}`;
      const loginLines = temporaryPassword
        ? `\nرابط الدخول: ${accessUrl}\nالبريد: ${input.principalEmail.trim().toLowerCase()}\nكلمة المرور المؤقتة: ${temporaryPassword}`
        : principalCreationWarning
        ? `\nتنبيه: ${principalCreationWarning}. أنشئ حساب المدير من صفحة إدارة المستخدمين.`
        : '';

      return {
        success: true,
        message: `تم تأسيس مدرسة (${input.nameAr}) بنجاح وتفعيل النطاق وحساب المدير.${loginLines}`,
        tenantId: trimmedId,
        principalEmail: input.principalEmail.trim().toLowerCase(),
        temporaryPassword,
      };
    } catch (err: any) {
      console.error('Failed to provision school:', err);
      return {
        success: false,
        message: `فشل تأسيس المدرسة: ${err?.message || 'خطأ غير متوقع'}`,
        tenantId: input.id,
      };
    }
  };
  return { provisionNewSchool };
}

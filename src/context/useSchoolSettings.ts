import type {
  AuditLog,
  SchoolMessagingGatewayConfig,
  SchoolSettings,
  TenantSchoolProfile,
  UserProfile,
} from '../types/attendance';
import { getDefaultSchoolProfile } from '../config/tenantSettings';
import { getDefaultSchoolSettings } from '../config/defaultSettings';
import { localCache } from '../utils/localCache';
import { authenticatedFetch } from '../lib/api';

interface UseSchoolSettingsParams {
  tenantId: string;
  currentUser: UserProfile;
  isSuperAdmin: boolean;
  canManageSettings: boolean;
  settings: SchoolSettings;
  schoolProfile: TenantSchoolProfile;
  setSettingsMap: React.Dispatch<React.SetStateAction<Record<string, SchoolSettings>>>;
  setSchoolProfilesMap: React.Dispatch<React.SetStateAction<Record<string, TenantSchoolProfile>>>;
  addAuditLog: (entry: Omit<AuditLog, 'id' | 'tenantId' | 'timestamp'>) => void;
}

export function useSchoolSettings({
  tenantId,
  currentUser,
  isSuperAdmin,
  canManageSettings,
  settings,
  schoolProfile,
  setSettingsMap,
  setSchoolProfilesMap,
  addAuditLog,
}: UseSchoolSettingsParams) {
  const updateSettings = (newSettings: Partial<SchoolSettings>) => {
    if (!canManageSettings) {
      console.warn('Unauthorized: Only school administrators can update school settings.');
      return;
    }
    setSettingsMap((prev) => {
      const updated = {
        ...prev,
        [tenantId]: {
          ...prev[tenantId],
          ...newSettings,
        },
      };
      if (typeof localCache !== 'undefined') {
        localCache.setItem('school_settings', JSON.stringify(updated));
      }
      return updated;
    });

    addAuditLog({
      entityType: 'settings',
      entityId: `settings-${tenantId}`,
      action: 'update',
      performerId: currentUser.id,
      performerName: currentUser.name,
      performerRole: currentUser.role,
      details: 'تحديث قواعد وإعدادات المدرسة (حدود الغياب والتأخر وإشعارات الرسائل).',
      detailsEn: 'Updating school rules and settings (absence and late thresholds and message notifications).',
    });
  };

  const updateSchoolProfile = async (newProfile: Partial<TenantSchoolProfile>): Promise<void> => {
    if (!canManageSettings) {
      console.warn('Unauthorized: Only school administrators can update the school profile.');
      return;
    }
    setSchoolProfilesMap((prev) => {
      const current = prev[tenantId] || getDefaultSchoolProfile(tenantId);
      const updated: TenantSchoolProfile = {
        ...current,
        ...newProfile,
        countryCallingCode:
          newProfile.countryCallingCode ||
          newProfile.address?.countryCallingCode ||
          current.countryCallingCode ||
          current.address?.countryCallingCode ||
          '+966',
        address: {
          ...current.address,
          ...(newProfile.address || {}),
          countryCallingCode:
            newProfile.address?.countryCallingCode ||
            newProfile.countryCallingCode ||
            current.address?.countryCallingCode ||
            current.countryCallingCode ||
            '+966',
        },
        leadership: {
          ...current.leadership,
          ...(newProfile.leadership || {}),
        },
        academicYear: {
          ...current.academicYear,
          ...(newProfile.academicYear || {}),
        },
        timetablePeriods: newProfile.timetablePeriods || current.timetablePeriods,
        educationalGrades: newProfile.educationalGrades || current.educationalGrades,
        classes: newProfile.classes || current.classes,
        subjects: newProfile.subjects || current.subjects,
        assemblyPoints: newProfile.assemblyPoints || current.assemblyPoints,
        messagingGateway: isSuperAdmin
          ? (newProfile.messagingGateway || current.messagingGateway)
          : current.messagingGateway,
      };
      if (typeof localCache !== 'undefined') {
        localCache.setItem(
          'tenant_school_profiles',
          JSON.stringify({
            ...prev,
            [tenantId]: updated,
          })
        );
      }
      return {
        ...prev,
        [tenantId]: updated,
      };
    });

    addAuditLog({
      entityType: 'settings',
      entityId: `school-profile-${tenantId}`,
      action: 'update',
      performerId: currentUser.id,
      performerName: currentUser.name,
      performerRole: currentUser.role,
      details: 'تحديث بيانات المدرسة الرسمية، القيادة المدرسية، التقويم الدراسي، ونقاط التجمع للطوارئ.',
      detailsEn: 'Updating official school data, school leadership, academic calendar, and emergency assembly points.',
    });
  };

  const updateMessagingGateway = async (
    config: Partial<SchoolMessagingGatewayConfig>
  ): Promise<{ success: boolean; message: string }> => {
    if (!isSuperAdmin) {
      const errorMsg = 'عذراً، صلاحية ضبط وتعديل بوابات الرسائل والواتساب محصورة بمالك المنصة (The Owner) فقط.';
      console.warn(errorMsg);
      return { success: false, message: errorMsg };
    }

    const currentGw =
      schoolProfile.messagingGateway ||
      settings.messagingGateway || {
        whatsappPhoneNumber: '',
        whatsappServiceMode: 'web_direct',
        smsProvider: 'taqnyat',
        smsSenderId: '',
        enableWhatsAppNotifications: false,
        enableSmsNotifications: false,
      };

    const updatedGateway: SchoolMessagingGatewayConfig = {
      ...currentGw,
      ...config,
      lastConfiguredByRole: 'super_admin',
      lastConfiguredByEmail: currentUser?.email,
      lastConfiguredAt: new Date().toISOString(),
    };

    try {
      const response = await authenticatedFetch('/api/settings/messaging-gateway', {
        method: 'PUT',
        body: JSON.stringify(updatedGateway),
      });
      const payload = await response.json().catch(() => null);
      if (!response.ok || !payload?.success) {
        return {
          success: false,
          message: payload?.error || 'تعذر حفظ بيانات بوابة المراسلة. يرجى المحاولة مرة أخرى.',
        };
      }

      const savedGateway = (payload.gateway || updatedGateway) as SchoolMessagingGatewayConfig;

      // 1. Update in SchoolProfilesMap
      setSchoolProfilesMap((prev) => {
        const current = prev[tenantId] || getDefaultSchoolProfile(tenantId);
        const updatedProfile = {
          ...current,
          messagingGateway: savedGateway,
        };
        if (typeof localCache !== 'undefined') {
          localCache.setItem(
            'tenant_school_profiles',
            JSON.stringify({
              ...prev,
              [tenantId]: updatedProfile,
            })
          );
        }
        return {
          ...prev,
          [tenantId]: updatedProfile,
        };
      });

      // 2. Update in SettingsMap
      setSettingsMap((prev) => {
        const current = prev[tenantId] || getDefaultSchoolSettings(tenantId);
        const updatedSettings = {
          ...current,
          messagingGateway: savedGateway,
        };
        if (typeof localCache !== 'undefined') {
          localCache.setItem(
            'school_settings',
            JSON.stringify({
              ...prev,
              [tenantId]: updatedSettings,
            })
          );
        }
        return {
          ...prev,
          [tenantId]: updatedSettings,
        };
      });

      // 3. Log audit event
      addAuditLog({
        entityType: 'settings',
        entityId: `gateway-${tenantId}`,
        action: 'update',
        performerId: currentUser.id,
        performerName: currentUser.name,
        performerRole: currentUser.role,
        details: `تحديث بيانات وبوابات المراسلة والواتساب (رقم الواتساب: ${savedGateway.whatsappPhoneNumber}، وضع الخدمة: ${savedGateway.whatsappServiceMode}، مزود SMS: ${savedGateway.smsProvider}) بواسطة مالك المنصة.`,
        detailsEn: `Updating messaging and WhatsApp gateway data (WhatsApp number: ${savedGateway.whatsappPhoneNumber}, service mode: ${savedGateway.whatsappServiceMode}, SMS provider: ${savedGateway.smsProvider}) by the platform owner.`,
      });

      return {
        success: true,
        message: 'تم حفظ وتفعيل بوابات المراسلة والواتساب للمدرسة بنجاح من قبل مالك المنصة.',
      };
    } catch (err) {
      console.warn('[SETTINGS] Could not save messaging gateway:', err);
      return {
        success: false,
        message: 'تعذر الاتصال بالخادم لحفظ بيانات بوابة المراسلة.',
      };
    }
  };
  return { updateSettings, updateSchoolProfile, updateMessagingGateway };
}

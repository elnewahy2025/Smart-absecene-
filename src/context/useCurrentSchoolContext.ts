import { useMemo } from 'react';
import type { User as FirebaseUser } from 'firebase/auth';
import type {
  SchoolMessagingGatewayConfig,
  SchoolSettings,
  Tenant,
  TenantSchoolProfile,
  UserProfile,
  UserRole,
} from '../types/attendance';
import type { TenantDomainConfig } from '../config/tenantRegistry';
import { TENANT_REGISTRY, getActiveTenantRegistry } from '../config/tenantRegistry';
import { getDefaultSchoolProfile } from '../config/tenantSettings';
import { getDefaultSchoolSettings } from '../config/defaultSettings';
import { DEFAULT_OFFICIAL_HOLIDAYS, DEFAULT_WEEKEND_DAYS } from '../utils/holidayUtils';
import { PLATFORM_OWNER_EMAILS, REGISTRY_TENANTS } from './attendanceContextSupport';

interface CurrentSchoolContextDeps {
  tenants: Tenant[];
  tenantId: string;
  schoolProfilesMap: Record<string, TenantSchoolProfile>;
  settingsMap: Record<string, SchoolSettings>;
  allUsers: UserProfile[];
  currentUserRole: UserRole;
  firebaseUser: FirebaseUser | null;
  authenticatedPhone: string;
}

/**
 * Resolves the active school: profile overrides, tenant metadata, effective
 * settings and the signed-in profile (with the platform-owner stealth fallback).
 */
export function useCurrentSchoolContext({
  tenants,
  tenantId,
  schoolProfilesMap,
  settingsMap,
  allUsers,
  currentUserRole,
  firebaseUser,
  authenticatedPhone,
}: CurrentSchoolContextDeps) {
  const schoolProfile: TenantSchoolProfile =
    schoolProfilesMap[tenantId] || getDefaultSchoolProfile(tenantId);

  const baseTenant = tenants.find((t) => t.id === tenantId) || tenants[0] || REGISTRY_TENANTS[0];
  const currentTenant: Tenant = {
    ...baseTenant,
    name: schoolProfile.schoolName || baseTenant.name,
    code: schoolProfile.schoolCode || baseTenant.code,
    city: schoolProfile.address?.city || baseTenant.city,
    academicYear: schoolProfile.academicYear?.hijriYear || baseTenant.academicYear,
    schoolType: schoolProfile.genderType || baseTenant.schoolType,
    schoolProfile,
  };
  const activeRegistry = getActiveTenantRegistry();
  const tenantDomainConfig: TenantDomainConfig = activeRegistry[tenantId] || TENANT_REGISTRY[tenantId];

  // Platform Owner Stealth & God-Mode RBAC Check
  const isSuperAdmin = currentUserRole === 'super_admin';

  const currentUser: UserProfile =
    (isSuperAdmin
      ? allUsers.find((u) => u.role === 'super_admin') || {
          id: 'user-owner',
          tenantId: 'platform',
          name: firebaseUser?.displayName || '',
          role: 'super_admin',
          phone: authenticatedPhone || '',
          email: PLATFORM_OWNER_EMAILS[0] || '',
          status: 'active',
        }
      : allUsers.find((u) => u.id === firebaseUser?.uid) ||
        allUsers.find((u) => u.email.toLowerCase() === (firebaseUser?.email || '').toLowerCase()) ||
        allUsers.find((u) => u.tenantId === tenantId && u.role === currentUserRole)) || {
      id: firebaseUser?.uid || `user-${currentUserRole}-${tenantId}`,
      tenantId: tenantId,
      name: firebaseUser?.displayName || '',
      role: currentUserRole,
      phone: authenticatedPhone || '',
      email: firebaseUser?.email || '',
      assignedClasses: currentUserRole === 'teacher' ? [] : undefined,
    };

  const settings = settingsMap[tenantId] || getDefaultSchoolSettings(tenantId);

  const weekendDays = settings.weekendDays || schoolProfile.weekendDays || DEFAULT_WEEKEND_DAYS;
  const officialHolidays = settings.officialHolidays || schoolProfile.officialHolidays || DEFAULT_OFFICIAL_HOLIDAYS;

  const messagingGateway: SchoolMessagingGatewayConfig = useMemo(() => {
    return (
      schoolProfile.messagingGateway ||
      settings.messagingGateway || {
        whatsappPhoneNumber: '',
        whatsappServiceMode: 'web_direct',
        smsProvider: 'taqnyat',
        smsSenderId: '',
        enableWhatsAppNotifications: false,
        enableSmsNotifications: false,
        lastConfiguredByRole: 'super_admin',
        lastConfiguredByEmail: currentUser?.email || '',
        lastConfiguredAt: '',
      }
    );
  }, [schoolProfile.messagingGateway, settings.messagingGateway]);

  return {
    isSuperAdmin,
    currentUser,
    schoolProfile,
    currentTenant,
    tenantDomainConfig,
    settings,
    weekendDays,
    officialHolidays,
    messagingGateway,
  };
}

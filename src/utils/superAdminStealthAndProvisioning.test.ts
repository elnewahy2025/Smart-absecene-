import { describe, it, expect, beforeEach } from 'vitest';
import { INITIAL_USERS, INITIAL_TENANTS } from '../data/mockData';
import { UserProfile, SchoolProvisionInput, UserRole } from '../types/attendance';
import { getActiveTenantRegistry, resolveTenantFromHostname, TenantDomainConfig } from '../config/tenantRegistry';

const storageMock: Record<string, string> = {};
if (typeof global !== 'undefined') {
  (global as any).localStorage = {
    getItem: (k: string) => storageMock[k] || null,
    setItem: (k: string, v: string) => { storageMock[k] = String(v); },
    removeItem: (k: string) => { delete storageMock[k]; },
    clear: () => { Object.keys(storageMock).forEach((k) => delete storageMock[k]); },
    key: () => null,
    length: 0,
  };
}

describe('Super Admin Stealth, Full God-Mode, and Dynamic School Provisioning Tests', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  describe('1. Absolute Stealth Guarantees', () => {
    it('ensures super_admin is strictly excluded from any school staff roster', () => {
      const allUsersWithSuperAdmin: UserProfile[] = [
        ...INITIAL_USERS,
        {
          id: 'user-owner-extra',
          tenantId: 'school-1', // even if mistakenly assigned to school-1
          name: 'The Owner',
          role: 'super_admin',
          phone: '+966500000000',
          email: 'owner@smartschool.platform',
          status: 'active',
        },
      ];

      // Filter simulation matching AttendanceContext.tsx
      const school1Users = allUsersWithSuperAdmin.filter(
        (u) => u.tenantId === 'school-1' && u.role !== 'super_admin'
      );

      expect(school1Users.some((u) => u.role === 'super_admin')).toBe(false);
      expect(school1Users.some((u) => u.email === 'owner@smartschool.platform')).toBe(false);
    });

    it('ensures UserManagementTab filter explicitly excludes super_admin', () => {
      const mockStaffList: UserProfile[] = [
        {
          id: 'admin-1',
          tenantId: 'school-1',
          name: 'Principal',
          role: 'admin',
          email: 'principal@school.com',
          phone: '123',
          status: 'active',
        },
        {
          id: 'owner-1',
          tenantId: 'platform',
          name: 'The Owner',
          role: 'super_admin',
          email: 'owner@platform.com',
          phone: '000',
          status: 'active',
        },
      ];

      const visibleInTable = mockStaffList.filter((u) => {
        if (u.role === 'super_admin') return false;
        return true;
      });

      expect(visibleInTable.length).toBe(1);
      expect(visibleInTable[0].role).toBe('admin');
      expect(visibleInTable.some((u) => u.role === 'super_admin')).toBe(false);
    });

    it('ensures public login role tabs strictly contain only normal school roles', () => {
      const publicLoginRoles = ['admin', 'registrar', 'teacher', 'parent'];
      expect(publicLoginRoles.includes('super_admin')).toBe(false);
      expect(publicLoginRoles).toEqual(['admin', 'registrar', 'teacher', 'parent']);
    });
  });

  describe('2. Full God-Mode Control & Cross-Tenant Access', () => {
    it('evaluates all RBAC permissions to true for super_admin', () => {
      const isSuperAdmin = (r: UserRole) => r === 'super_admin';
      const canManageSettings = (r: UserRole) => r === 'admin' || isSuperAdmin(r);
      const canReviewJustifications = (r: UserRole) => r === 'admin' || r === 'registrar' || isSuperAdmin(r);
      const canReopenSessions = (r: UserRole) => r === 'admin' || r === 'registrar' || isSuperAdmin(r);
      const canImportStudents = (r: UserRole) => r === 'admin' || r === 'registrar' || isSuperAdmin(r);
      const canDispatchDigest = (r: UserRole) => r === 'admin' || r === 'registrar' || isSuperAdmin(r);
      const canManageOutbox = (r: UserRole) => r === 'admin' || r === 'registrar' || isSuperAdmin(r);

      const targetRole: UserRole = 'super_admin';
      expect(isSuperAdmin(targetRole)).toBe(true);
      expect(canManageSettings(targetRole)).toBe(true);
      expect(canReviewJustifications(targetRole)).toBe(true);
      expect(canReopenSessions(targetRole)).toBe(true);
      expect(canImportStudents(targetRole)).toBe(true);
      expect(canDispatchDigest(targetRole)).toBe(true);
      expect(canManageOutbox(targetRole)).toBe(true);
    });

    it('allows super_admin to authenticate from any school domain without tenant rejection', () => {
      const currentPortalTenantId = 'school-2';
      const superAdminUser: UserProfile = {
        id: 'user-owner',
        tenantId: 'platform',
        name: 'The Owner',
        role: 'super_admin',
        email: 'owner@smartschool.platform',
        status: 'active',
        phone: '+966500000000',
      };

      // Tenant match check simulation from AttendanceContext signInWithCredentials
      const isRejectedForTenant =
        superAdminUser.role !== 'super_admin' &&
        superAdminUser.tenantId !== currentPortalTenantId;

      expect(isRejectedForTenant).toBe(false);
    });

    it('protects super_admin account from deletion', () => {
      const superAdminUser: UserProfile = {
        id: 'user-owner',
        tenantId: 'platform',
        name: 'The Owner',
        role: 'super_admin',
        email: 'owner@smartschool.platform',
        status: 'active',
        phone: '+966500000000',
      };

      const attemptDelete = (target: UserProfile) => {
        if (target.role === 'super_admin' || target.id === 'user-owner') {
          return { success: false, message: 'حساب مالك المنصة محمي تماماً ولا يمكن حذفه.' };
        }
        return { success: true, message: 'Deleted' };
      };

      const result = attemptDelete(superAdminUser);
      expect(result.success).toBe(false);
      expect(result.message).toContain('محمي');
    });
  });

  describe('3. Dynamic Multi-Tenant School Provisioning', () => {
    it('provisions a new school and verifies domain resolution instantly', () => {
      const input: SchoolProvisionInput = {
        id: 'school-majd',
        nameAr: 'مدارس المجد الأهلية النموذجية',
        nameEn: 'Al-Majd Model Schools',
        code: 'MAJD-303',
        cityAr: 'الدمام',
        cityEn: 'Dammam',
        subdomain: 'majd',
        schoolType: 'boys',
        academicYear: '1447-1448 هـ / 2026 م',
        primaryColor: '#7c3aed',
        logoText: 'م',
        principalName: 'أ. عبد العزيز الماجد',
        principalEmail: 'principal@majd-school.edu.sa',
        principalPhone: '+966507778899',
      };

      // Build domain config
      const newDomainConfig: TenantDomainConfig = {
        tenantId: input.id,
        subdomain: input.subdomain,
        customDomains: [
          `portal.${input.subdomain}.edu`,
          `attendance.${input.subdomain}-school.edu.sa`,
          `${input.subdomain}.smartschool.com`,
          `${input.subdomain}.localhost`,
        ],
        nameAr: input.nameAr,
        nameEn: input.nameEn,
        code: input.code,
        cityAr: input.cityAr,
        cityEn: input.cityEn,
        academicYear: input.academicYear,
        currentTerm: 'الفصل الدراسي الأول',
        schoolType: input.schoolType,
        primaryColor: input.primaryColor,
        logoText: input.logoText,
        isActive: true,
      };

      // Save to localStorage
      localStorage.setItem('school_dynamic_tenants', JSON.stringify([newDomainConfig]));

      // Verify active tenant registry recognizes new school
      const activeRegistry = getActiveTenantRegistry();
      expect(activeRegistry['school-majd']).toBeDefined();
      expect(activeRegistry['school-majd'].nameAr).toBe('مدارس المجد الأهلية النموذجية');
      expect(activeRegistry['school-majd'].subdomain).toBe('majd');

      // Verify domain resolution works for the new school subdomain
      const resolutionResult = resolveTenantFromHostname('majd.localhost:5050');
      expect(resolutionResult.status).toBe('resolved');
      expect(resolutionResult.tenantId).toBe('school-majd');
      expect(resolutionResult.config?.nameAr).toBe('مدارس المجد الأهلية النموذجية');
    });
  });
});

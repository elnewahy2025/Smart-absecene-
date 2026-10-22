import { describe, it, expect, vi } from 'vitest';
import { useAuthActions } from '../context/useAuthActions';
import type { UserProfile, UserRole } from '../types/attendance';
import { canSwitchSchool, canAccessPlatformOwner, resolveEffectiveTenant } from '../utils/accountAccess';

vi.mock('../lib/firebase', () => ({
  auth: { currentUser: null },
  db: {},
  googleProvider: {},
}));

vi.mock('firebase/auth', () => ({
  signInWithEmailAndPassword: vi.fn(),
  signInWithPopup: vi.fn(),
  signInWithRedirect: vi.fn(),
  signOut: vi.fn(),
}));

vi.mock('firebase/firestore', () => ({
  doc: vi.fn((_db, collection, id) => ({ collection, id })),
  getDoc: vi.fn(),
}));

import { signInWithEmailAndPassword } from 'firebase/auth';
import { getDoc } from 'firebase/firestore';

describe('Role & Multi-School Isolation Rules', () => {
  const mockAllUsers: UserProfile[] = [
    {
      id: 'manager-school-1',
      tenantId: 'school-1',
      name: 'أ. عبد الله (مدير الأندلس)',
      role: 'admin',
      email: 'manager.andalus@school.sa',
      phone: '+966501111111',
      status: 'active',
    },
    {
      id: 'manager-school-2',
      tenantId: 'school-2',
      name: 'أ. خالد (مدير الفرسان)',
      role: 'admin',
      email: 'manager.fursan@school.sa',
      phone: '+966502222222',
      status: 'active',
    },
    {
      id: 'teacher-school-1',
      tenantId: 'school-1',
      name: 'أ. فهد (معلم)',
      role: 'teacher',
      email: 'teacher.andalus@school.sa',
      phone: '+966503333333',
      status: 'active',
    },
    {
      id: 'the-owner',
      tenantId: 'platform',
      name: 'مالك المنصة',
      role: 'super_admin',
      email: 'owner@platform.sa',
      phone: '+966500000000',
      status: 'active',
    },
  ];

  it('1. Credentials determine the school for School Manager (admin) without choosing a school on login', async () => {
    const setTenantId = vi.fn();
    const setUserRole = vi.fn();

    vi.mocked(signInWithEmailAndPassword).mockResolvedValueOnce({
      user: {
        uid: 'manager-school-2',
        email: 'manager.fursan@school.sa',
        displayName: 'أ. خالد',
        phoneNumber: null,
      },
    } as any);

    vi.mocked(getDoc).mockResolvedValueOnce({
      exists: () => false,
    } as any);

    const { signInWithCredentials } = useAuthActions({
      tenantId: 'school-1', // Login screen initially loaded on school-1
      setTenantId,
      allUsers: mockAllUsers,
      currentUserRole: 'parent',
      setUserRole,
    });

    // Logging in with manager of school-2
    const result = await signInWithCredentials('manager.fursan@school.sa', 'secret123');

    expect(result.success).toBe(true);
    expect(result.user?.tenantId).toBe('school-2');
    expect(result.user?.role).toBe('admin');

    // Crucial: The session must automatically switch to school-2 based on credentials
    expect(setTenantId).toHaveBeenCalledWith('school-2');
    expect(setUserRole).toHaveBeenCalledWith('admin');
  });

  it('2. The Platform Owner (super_admin) is the ONLY role that can log in to ANY school', async () => {
    const setTenantId = vi.fn();
    const setUserRole = vi.fn();

    vi.mocked(signInWithEmailAndPassword).mockResolvedValueOnce({
      user: {
        uid: 'the-owner',
        email: 'owner@platform.sa',
        displayName: 'The Owner',
        phoneNumber: null,
      },
    } as any);

    vi.mocked(getDoc).mockResolvedValueOnce({
      exists: () => true,
      data: () => ({ role: 'super_admin' }),
    } as any);

    const { signInWithCredentials } = useAuthActions({
      tenantId: 'school-1',
      setTenantId,
      allUsers: mockAllUsers,
      currentUserRole: 'parent',
      setUserRole,
    });

    const result = await signInWithCredentials('owner@platform.sa', 'ownerpass');

    expect(result.success).toBe(true);
    expect(result.user?.role).toBe('super_admin');
    expect(setUserRole).toHaveBeenCalledWith('super_admin');
  });

  it('2b. Non-owner without an assigned school fails closed instead of inheriting the session tenant', async () => {
    const setTenantId = vi.fn();
    const setUserRole = vi.fn();

    vi.mocked(signInWithEmailAndPassword).mockResolvedValueOnce({
      user: {
        uid: 'unassigned-user',
        email: 'unassigned@school.sa',
        displayName: 'Unassigned',
        phoneNumber: null,
      },
    } as any);

    vi.mocked(getDoc)
      .mockResolvedValueOnce({ exists: () => false } as any)
      .mockResolvedValueOnce({
        exists: () => true,
        data: () => ({ role: 'teacher', status: 'active', name: 'Unassigned' }),
      } as any);

    const { signInWithCredentials } = useAuthActions({
      tenantId: 'school-1',
      setTenantId,
      allUsers: [],
      currentUserRole: 'parent',
      setUserRole,
    });

    const result = await signInWithCredentials('unassigned@school.sa', 'secret123');

    expect(result.success).toBe(false);
    expect(setTenantId).not.toHaveBeenCalled();
    expect(setUserRole).not.toHaveBeenCalled();
  });

  it('3. School switching capability ("🧪 تجربة:") is strictly restricted to Platform Owner (super_admin)', () => {
    // Manager / Admin must NOT have the right to test all schools
    expect(canSwitchSchool('admin')).toBe(false);

    // Other staff & parents must NOT have the right to test all schools
    expect(canSwitchSchool('registrar')).toBe(false);
    expect(canSwitchSchool('teacher')).toBe(false);
    expect(canSwitchSchool('parent')).toBe(false);

    // ONLY the owner has this right
    expect(canSwitchSchool('super_admin')).toBe(true);
  });

  it('4. Non-owner cannot override school via URL parameters (pinned to their own school)', () => {
    // Manager of school-1 attempts ?tenant=school-2 in URL
    const managerTenant = resolveEffectiveTenant('admin', 'school-1', 'school-2');
    expect(managerTenant).toBe('school-1'); // Overriding is DENIED, stays pinned to school-1

    // Teacher of school-1 attempts ?tenant=school-2 in URL
    const teacherTenant = resolveEffectiveTenant('teacher', 'school-1', 'school-2');
    expect(teacherTenant).toBe('school-1');

    // Parent of school-1 attempts ?tenant=school-2 in URL
    const parentTenant = resolveEffectiveTenant('parent', 'school-1', 'school-2');
    expect(parentTenant).toBe('school-1');

    // ONLY the Platform Owner can switch schools via URL / requestedTenantId
    const ownerTenant = resolveEffectiveTenant('super_admin', 'platform', 'school-2');
    expect(ownerTenant).toBe('school-2');
  });

  it('4b. An unassigned school account fails closed instead of inheriting a default tenant', () => {
    expect(resolveEffectiveTenant('admin', undefined, 'school-2')).toBe('');
    expect(resolveEffectiveTenant('teacher', 'platform', 'school-1')).toBe('');
    expect(resolveEffectiveTenant('parent', '', 'school-1')).toBe('');
  });

  it('5. PlatformOwnerModal is strictly accessible ONLY to super_admin', () => {
    expect(canAccessPlatformOwner(false, 'admin')).toBe(false);
    expect(canAccessPlatformOwner(false, 'registrar')).toBe(false);
    expect(canAccessPlatformOwner(false, 'teacher')).toBe(false);
    expect(canAccessPlatformOwner(false, 'parent')).toBe(false);
    expect(canAccessPlatformOwner(true, 'super_admin')).toBe(true);
  });
});


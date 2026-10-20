import { describe, expect, it } from 'vitest';
import {
  guardianMatchesForUser,
  userProvisioningState,
  type StudentGuardianRecord,
  type UserProvisioningRecord,
} from './userProvisioningAudit';

const students: StudentGuardianRecord[] = [
  {
    id: 'student-1',
    tenantId: 'school-1',
    guardianPhone: '+966500000001',
    guardianEmail: 'Parent@Example.com',
  },
  {
    id: 'student-2',
    tenantId: 'school-2',
    guardianPhone: '+966500000002',
    guardianEmail: 'other@example.com',
  },
];

const legacyUser: UserProvisioningRecord = {
  id: 'legacy-1',
  tenantId: 'school-1',
  role: 'parent',
  phone: '+966500000001',
  email: 'parent@example.com',
};

describe('userProvisioningState', () => {
  it('treats active profiles as provisioned', () => {
    expect(userProvisioningState({ id: 'u1', status: 'active' })).toBe('provisioned');
  });

  it('keeps inactive profiles distinct from unprovisioned ones', () => {
    expect(userProvisioningState({ id: 'u1', status: 'inactive' })).toBe('inactive');
  });

  it('treats missing or unknown status as unprovisioned', () => {
    expect(userProvisioningState({ id: 'u1' })).toBe('unprovisioned');
    expect(userProvisioningState({ id: 'u1', status: 'pending' })).toBe('unprovisioned');
    expect(userProvisioningState({ id: 'u1', status: null })).toBe('unprovisioned');
  });
});

describe('guardianMatchesForUser', () => {
  it('finds students matched by phone in the same tenant', () => {
    expect(guardianMatchesForUser(legacyUser, students).map((student) => student.id)).toEqual([
      'student-1',
    ]);
  });

  it('matches email case-insensitively', () => {
    const emailOnly = { ...legacyUser, phone: '' };
    expect(guardianMatchesForUser(emailOnly, students).map((student) => student.id)).toEqual([
      'student-1',
    ]);
  });

  it('never matches students in another tenant', () => {
    const crossTenant = { ...legacyUser, tenantId: 'school-2', phone: '+966500000001' };
    expect(guardianMatchesForUser(crossTenant, students)).toEqual([]);
  });

  it('never matches empty guardian fields', () => {
    const empty = { ...legacyUser, phone: '', email: '' };
    expect(guardianMatchesForUser(empty, students)).toEqual([]);

    const emptyStudentGuardians: StudentGuardianRecord[] = [
      { id: 'student-3', tenantId: 'school-1', guardianPhone: '', guardianEmail: '' },
    ];
    const onlyPhone = { ...legacyUser, email: '' };
    expect(guardianMatchesForUser(onlyPhone, emptyStudentGuardians)).toEqual([]);
  });

  it('does not flag active or inactive profiles', () => {
    expect(guardianMatchesForUser({ ...legacyUser, status: 'active' }, students)).toEqual([]);
    expect(guardianMatchesForUser({ ...legacyUser, status: 'inactive' }, students)).toEqual([]);
  });
});

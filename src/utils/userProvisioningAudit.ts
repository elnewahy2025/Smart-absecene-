export type UserProvisioningState = 'provisioned' | 'inactive' | 'unprovisioned';

export interface UserProvisioningRecord {
  id: string;
  status?: unknown;
  role?: unknown;
  tenantId?: unknown;
  email?: unknown;
  phone?: unknown;
  name?: unknown;
}

export interface StudentGuardianRecord {
  id: string;
  tenantId?: unknown;
  guardianPhone?: unknown;
  guardianEmail?: unknown;
}

export function userProvisioningState(user: UserProvisioningRecord): UserProvisioningState {
  if (user.status === 'active') return 'provisioned';
  if (user.status === 'inactive') return 'inactive';
  return 'unprovisioned';
}

export function guardianMatchesForUser(
  user: UserProvisioningRecord,
  students: StudentGuardianRecord[]
): StudentGuardianRecord[] {
  if (userProvisioningState(user) !== 'unprovisioned') return [];

  const phone = typeof user.phone === 'string' ? user.phone.trim() : '';
  const email = typeof user.email === 'string' ? user.email.trim().toLowerCase() : '';
  if (!phone && !email) return [];

  return students.filter((student) => {
    if (student.tenantId !== user.tenantId) return false;
    const studentPhone = typeof student.guardianPhone === 'string' ? student.guardianPhone.trim() : '';
    const studentEmail =
      typeof student.guardianEmail === 'string' ? student.guardianEmail.trim().toLowerCase() : '';
    return (phone !== '' && studentPhone === phone) || (email !== '' && studentEmail === email);
  });
}

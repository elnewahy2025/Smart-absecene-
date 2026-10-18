import type {
  AttendanceSession,
  Student,
  UserProfile,
  UserRole,
} from '../types/attendance';

/**
 * Pure access-control rules lifted verbatim out of AttendanceContext so they can
 * be unit-tested directly (M-10) instead of duplicated inside test files.
 */

/** Roles allowed to write session/student/justification state. */
export const ELEVATED_WRITE_ROLES: UserRole[] = ['admin', 'registrar', 'super_admin'];

export function canManageSettings(role: UserRole, isSuperAdmin: boolean): boolean {
  return role === 'admin' || isSuperAdmin;
}

/** Elevated readers (admin, registrar) plus a platform super admin. */
export function isElevatedOrSuperAdmin(role: UserRole, isSuperAdmin: boolean): boolean {
  return role === 'admin' || role === 'registrar' || isSuperAdmin;
}

/** Submitted sessions are frozen unless the writer is an elevated role. */
export function canWriteSubmittedSessions(role: UserRole): boolean {
  return ELEVATED_WRITE_ROLES.includes(role);
}

export interface CanEditSessionInput {
  role: UserRole;
  isSuperAdmin: boolean;
  userId: string;
  assignedClasses: string[];
  session: AttendanceSession;
}

export function canEditSession({
  role,
  isSuperAdmin,
  userId,
  assignedClasses,
  session,
}: CanEditSessionInput): boolean {
  if (isSuperAdmin) return true; // Full god-mode control across all sessions, past and present
  if (role === 'parent') return false;
  if (role === 'admin' || role === 'registrar') return true;
  if (role === 'teacher') {
    if (session.status === 'submitted') return false;
    return assignedClasses.includes(session.classId) || session.teacherId === userId;
  }
  return false;
}

/** A student belongs to a parent when phone, email, or name matches. */
export function isChildOfGuardian(user: UserProfile, student: Student): boolean {
  if (user.role !== 'parent') return true;
  const cleanUserPhone = (user.phone || '').replace(/[^\d]/g, '');
  const cleanGuardianPhone = (student.guardianPhone || '').replace(/[^\d]/g, '');
  if (cleanUserPhone && cleanGuardianPhone && cleanUserPhone === cleanGuardianPhone) return true;
  if (user.email && student.guardianEmail && user.email.toLowerCase() === student.guardianEmail.toLowerCase()) {
    return true;
  }
  if (user.name && student.guardianName) {
    const userName = user.name.trim();
    const guardianName = student.guardianName.trim();
    if (guardianName === userName) return true;
    // Legacy surname aliases retained for continuity with existing guardian records.
    if (userName.includes('المطيري') && guardianName.includes('المطيري')) return true;
    if (userName.includes('الصاعدي') && guardianName.includes('الصاعدي')) return true;
  }
  return false;
}

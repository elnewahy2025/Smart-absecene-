import { describe, expect, it } from 'vitest';
import type { AttendanceSession, Student, UserProfile, UserRole } from '../types/attendance';
import {
  canEditSession,
  canManageSettings,
  canWriteSubmittedSessions,
  isChildOfGuardian,
  isElevatedOrSuperAdmin,
} from './attendanceAccess';

function makeSession(overrides: Partial<AttendanceSession> = {}): AttendanceSession {
  return {
    id: 'sess-1',
    tenantId: 'school-1',
    classId: 'class-10a',
    teacherId: 'teacher-1',
    status: 'draft',
    ...overrides,
  } as AttendanceSession;
}

function makeUser(overrides: Partial<UserProfile> = {}): UserProfile {
  return {
    id: 'u-1',
    tenantId: 'school-1',
    role: 'teacher',
    name: 'Teacher',
    email: 't@example.com',
    phone: '',
    status: 'active',
    ...overrides,
  } as UserProfile;
}

describe('attendanceAccess role helpers', () => {
  it('canManageSettings: admin or super admin only', () => {
    expect(canManageSettings('admin', false)).toBe(true);
    expect(canManageSettings('teacher', false)).toBe(false);
    expect(canManageSettings('teacher', true)).toBe(true);
    expect(canManageSettings('parent', false)).toBe(false);
  });

  it('isElevatedOrSuperAdmin: admin, registrar or super admin', () => {
    expect(isElevatedOrSuperAdmin('admin', false)).toBe(true);
    expect(isElevatedOrSuperAdmin('registrar', false)).toBe(true);
    expect(isElevatedOrSuperAdmin('teacher', false)).toBe(false);
    expect(isElevatedOrSuperAdmin('teacher', true)).toBe(true);
    expect(isElevatedOrSuperAdmin('parent', false)).toBe(false);
  });

  it('canWriteSubmittedSessions: admin, registrar, super_admin', () => {
    expect(canWriteSubmittedSessions('admin')).toBe(true);
    expect(canWriteSubmittedSessions('registrar')).toBe(true);
    expect(canWriteSubmittedSessions('super_admin')).toBe(true);
    expect(canWriteSubmittedSessions('teacher')).toBe(false);
    expect(canWriteSubmittedSessions('parent')).toBe(false);
  });
});

describe('canEditSession', () => {
  const session = makeSession();

  it('grants the super admin god-mode control regardless of state', () => {
    expect(
      canEditSession({
        role: 'teacher',
        isSuperAdmin: true,
        userId: 'nobody',
        assignedClasses: [],
        session: makeSession({ status: 'submitted' }),
      })
    ).toBe(true);
  });

  it('denies parents', () => {
    expect(
      canEditSession({ role: 'parent', isSuperAdmin: false, userId: 'u', assignedClasses: [], session })
    ).toBe(false);
  });

  it('allows admin and registrar everywhere', () => {
    expect(
      canEditSession({ role: 'admin', isSuperAdmin: false, userId: 'u', assignedClasses: [], session: makeSession({ status: 'submitted' }) })
    ).toBe(true);
    expect(
      canEditSession({ role: 'registrar', isSuperAdmin: false, userId: 'u', assignedClasses: [], session })
    ).toBe(true);
  });

  it('blocks teachers from submitted sessions', () => {
    expect(
      canEditSession({
        role: 'teacher',
        isSuperAdmin: false,
        userId: 'teacher-1',
        assignedClasses: ['class-10a'],
        session: makeSession({ status: 'submitted' }),
      })
    ).toBe(false);
  });

  it('allows teachers for their own class or session', () => {
    expect(
      canEditSession({ role: 'teacher', isSuperAdmin: false, userId: 'x', assignedClasses: ['class-10a'], session })
    ).toBe(true);
    expect(
      canEditSession({ role: 'teacher', isSuperAdmin: false, userId: 'teacher-1', assignedClasses: [], session })
    ).toBe(true);
  });

  it('blocks teachers for unrelated classes', () => {
    expect(
      canEditSession({ role: 'teacher', isSuperAdmin: false, userId: 'x', assignedClasses: ['class-9z'], session })
    ).toBe(false);
  });

  it('denies unknown roles', () => {
    expect(
      canEditSession({ role: 'auditor' as UserRole, isSuperAdmin: false, userId: 'x', assignedClasses: [], session })
    ).toBe(false);
  });
});

describe('isChildOfGuardian', () => {
  const student = {
    id: 'st-1',
    guardianPhone: '+966 50 999 0011',
    guardianEmail: 'Parent@Example.sa',
    guardianName: 'محمد المطيري',
  } as Student;

  it('lets non-parent roles see any student', () => {
    expect(isChildOfGuardian(makeUser({ role: 'admin' }), student)).toBe(true);
  });

  it('matches on phone regardless of formatting', () => {
    expect(isChildOfGuardian(makeUser({ role: 'parent', phone: '+966509990011' }), student)).toBe(true);
  });

  it('matches on email case-insensitively', () => {
    expect(
      isChildOfGuardian(makeUser({ role: 'parent', phone: '', email: 'parent@example.sa' }), student)
    ).toBe(true);
  });

  it('rejects unrelated parents', () => {
    expect(
      isChildOfGuardian(
        makeUser({ role: 'parent', phone: '+966500000000', email: 'other@example.com', name: 'أحمد' }),
        student
      )
    ).toBe(false);
  });
});

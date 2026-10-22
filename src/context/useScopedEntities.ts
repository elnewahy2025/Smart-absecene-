import { buildParentSessions } from './attendanceContextSupport';
import { isChildOfGuardian as isChildOfGuardianRule } from '../utils/attendanceAccess';
import type {
  AttendanceSession,
  AuditLog,
  Justification,
  NotificationOutboxItem,
  Student,
  StudentAttendanceRecord,
  StudentBehaviourIncident,
  UserProfile,
  UserRole,
} from '../types/attendance';

interface ScopedEntitiesDeps {
  allStudents: Student[];
  allSessions: AttendanceSession[];
  allJustifications: Justification[];
  allNotifications: NotificationOutboxItem[];
  allAuditLogs: AuditLog[];
  allBehaviourIncidents: StudentBehaviourIncident[];
  parentAttendanceRecords: StudentAttendanceRecord[];
  allUsers: UserProfile[];
  tenantId: string;
  currentUserRole: UserRole;
  currentUser: UserProfile;
}

/**
 * Tenant-scoped entity views with parent/child privacy isolation: a parent only
 * ever sees their own children's students, sessions, justifications, notices and
 * behaviour incidents, and never sees audit logs.
 */
export function useScopedEntities({
  allStudents,
  allSessions,
  allJustifications,
  allNotifications,
  allAuditLogs,
  allBehaviourIncidents,
  parentAttendanceRecords,
  allUsers,
  tenantId,
  currentUserRole,
  currentUser,
}: ScopedEntitiesDeps) {
  const isChildOfGuardian = (student: Student, user: UserProfile): boolean =>
    isChildOfGuardianRule(user, student);

  // Student IDs belonging strictly to current parent
  const parentChildIds = currentUserRole === 'parent'
    ? allStudents
        .filter((s) => s.tenantId === tenantId && isChildOfGuardian(s, currentUser))
        .map((s) => s.id)
    : [];

  // Data filtered strictly by tenantId AND Parent-Child Privacy Isolation
  // A parent must NEVER see or know any other students, ONLY their child/children.
  const students = currentUserRole === 'parent'
    ? allStudents.filter((s) => s.tenantId === tenantId && parentChildIds.includes(s.id))
    : allStudents.filter((s) => s.tenantId === tenantId);

  const sessions = currentUserRole === 'parent'
    ? buildParentSessions(parentAttendanceRecords)
    : allSessions.filter((s) => s.tenantId === tenantId);

  const justifications = currentUserRole === 'parent'
    ? allJustifications.filter((j) => j.tenantId === tenantId && parentChildIds.includes(j.studentId))
    : allJustifications.filter((j) => j.tenantId === tenantId);

  const notifications = currentUserRole === 'parent'
    ? allNotifications.filter((n) =>
        n.tenantId === tenantId &&
        (parentChildIds.includes(n.studentId) ||
         ((currentUser.phone || '') && n.recipientPhone.replace(/[^\d]/g, '') === currentUser.phone.replace(/[^\d]/g, '')))
      )
    : allNotifications.filter((n) => n.tenantId === tenantId);

  const auditLogs = currentUserRole === 'parent' ? [] : allAuditLogs.filter((a) => a.tenantId === tenantId);

  // Scoped users for current school (Stealth: super_admin NEVER appears in school staff lists)
  const users = allUsers.filter((u) => u.tenantId === tenantId && u.role !== 'super_admin');

  const behaviourIncidents = currentUserRole === 'parent'
    ? allBehaviourIncidents.filter((b) => b.tenantId === tenantId && parentChildIds.includes(b.studentId))
    : allBehaviourIncidents.filter((b) => b.tenantId === tenantId);

  return {
    parentChildIds,
    students,
    sessions,
    justifications,
    notifications,
    auditLogs,
    users,
    behaviourIncidents,
  };
}

import {
  canEditSession as canEditSessionRule,
  canManageSettings as canManageSettingsRule,
  isElevatedOrSuperAdmin,
} from '../utils/attendanceAccess';
import { isSchoolOffDay } from '../utils/holidayUtils';
import type { OffDayCheckResult } from '../utils/holidayUtils';
import type { AttendanceSession, OfficialHoliday, UserProfile, UserRole } from '../types/attendance';

interface AccessFlagsDeps {
  currentUserRole: UserRole;
  isSuperAdmin: boolean;
  currentUser: UserProfile;
  weekendDays: number[];
  officialHolidays: OfficialHoliday[];
}

/** Role-derived permissions and calendar helpers for the active account. */
export function useAccessFlags({
  currentUserRole,
  isSuperAdmin,
  currentUser,
  weekendDays,
  officialHolidays,
}: AccessFlagsDeps) {
  const isOffDay = (dateStr: string): OffDayCheckResult =>
    isSchoolOffDay(dateStr, weekendDays, officialHolidays);

  // RBAC Permission Booleans (Super Admin has FULL permissions everywhere)
  const canManageSettings = canManageSettingsRule(currentUserRole, isSuperAdmin);
  const canReviewJustifications = isElevatedOrSuperAdmin(currentUserRole, isSuperAdmin);
  const canReopenSessions = isElevatedOrSuperAdmin(currentUserRole, isSuperAdmin);
  const canImportStudents = isElevatedOrSuperAdmin(currentUserRole, isSuperAdmin);
  const canDispatchDigest = isElevatedOrSuperAdmin(currentUserRole, isSuperAdmin);
  const canManageOutbox = isElevatedOrSuperAdmin(currentUserRole, isSuperAdmin);

  const canEditSession = (sess: AttendanceSession): boolean =>
    canEditSessionRule({
      role: currentUserRole,
      isSuperAdmin,
      userId: currentUser.id,
      assignedClasses: currentUser.assignedClasses || ['class-1a', 'class-1b'],
      session: sess,
    });

  return {
    isOffDay,
    canManageSettings,
    canReviewJustifications,
    canReopenSessions,
    canImportStudents,
    canDispatchDigest,
    canManageOutbox,
    canEditSession,
  };
}

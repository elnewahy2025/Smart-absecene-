import type {
  AttendanceSession,
  AuditLog,
  Justification,
  NotificationOutboxItem,
  Student,
  StudentBehaviourIncident,
  UserProfile,
} from '../types/attendance';

/**
 * Runtime starts empty. Real records come from Firestore; demo records are
 * seeded by scripts/seed-emulator.mjs or the test fixtures in data/mockData.
 *
 * Keeping these arrays here (rather than in mockData) stops the app bundle from
 * pulling in the demo student PII that used to initialise the state.
 */
export const INITIAL_USERS: UserProfile[] = [];
export const INITIAL_STUDENTS: Student[] = [];
export const INITIAL_SESSIONS: AttendanceSession[] = [];
export const INITIAL_JUSTIFICATIONS: Justification[] = [];
export const INITIAL_NOTIFICATIONS: NotificationOutboxItem[] = [];
export const INITIAL_AUDIT_LOGS: AuditLog[] = [];
export const INITIAL_BEHAVIOUR_INCIDENTS: StudentBehaviourIncident[] = [];

import { localCache } from '../utils/localCache';
import {
  INITIAL_USERS,
  INITIAL_STUDENTS,
  INITIAL_SESSIONS,
  INITIAL_JUSTIFICATIONS,
  INITIAL_NOTIFICATIONS,
  INITIAL_AUDIT_LOGS,
  INITIAL_BEHAVIOUR_INCIDENTS,
} from '../data/initialState';
import type {
  AttendanceSession,
  AuditLog,
  Justification,
  NotificationOutboxItem,
  SchoolSettings,
  Student,
  StudentBehaviourIncident,
  TenantSchoolProfile,
  UserProfile,
} from '../types/attendance';

/**
 * Lazy state initializers: hydrate from localCache, migrate legacy dates and
 * merge in any baseline records added since the cache was written.
 */

export function loadUsers(): UserProfile[] {
  const saved = localCache.getItem('school_users');
  if (!saved) return INITIAL_USERS;
  try {
    const parsed: UserProfile[] = JSON.parse(saved);
    const existingIds = new Set(parsed.map((u) => u.id));
    const missing = INITIAL_USERS.filter((u) => !existingIds.has(u.id));
    return [...parsed, ...missing];
  } catch {
    return INITIAL_USERS;
  }
}

export function loadStudents(): Student[] {
  const saved = localCache.getItem('school_students');
  if (!saved) return INITIAL_STUDENTS;
  try {
    const parsed: Student[] = JSON.parse(saved);
    const existingIds = new Set(parsed.map((s) => s.id));
    const missing = INITIAL_STUDENTS.filter((s) => !existingIds.has(s.id));
    return [...parsed, ...missing];
  } catch {
    return INITIAL_STUDENTS;
  }
}

export function loadSessions(): AttendanceSession[] {
  const saved = localCache.getItem('school_sessions');
  if (!saved) return INITIAL_SESSIONS;
  try {
    const parsed: AttendanceSession[] = JSON.parse(saved);
    // Migrate any legacy weekend mock dates to actual school week days
    const normalized = parsed.map((s) => {
      if (s.date === '2026-10-09') return { ...s, date: '2026-10-11' };
      if (s.date === '2026-10-10') return { ...s, date: '2026-10-12' };
      return s;
    });
    // Ensure any newly added baseline sessions are present
    const existingIds = new Set(normalized.map((s) => s.id));
    const missing = INITIAL_SESSIONS.filter((s) => !existingIds.has(s.id));
    const merged = [...normalized, ...missing];
    if (typeof localCache !== 'undefined') {
      localCache.setItem('school_sessions', JSON.stringify(merged));
    }
    return merged;
  } catch {
    return INITIAL_SESSIONS;
  }
}

export function loadJustifications(): Justification[] {
  const saved = localCache.getItem('school_justifications');
  if (!saved) return INITIAL_JUSTIFICATIONS;
  try {
    const parsed: Justification[] = JSON.parse(saved);
    const normalized = parsed.map((j) => {
      if (j.absenceDate === '2026-10-10') return { ...j, absenceDate: '2026-10-12' };
      return j;
    });
    const existingIds = new Set(normalized.map((j) => j.id));
    const missing = INITIAL_JUSTIFICATIONS.filter((j) => !existingIds.has(j.id));
    const merged = [...normalized, ...missing];
    if (typeof localCache !== 'undefined') {
      localCache.setItem('school_justifications', JSON.stringify(merged));
    }
    return merged;
  } catch {
    return INITIAL_JUSTIFICATIONS;
  }
}

export function loadNotifications(): NotificationOutboxItem[] {
  const saved = localCache.getItem('school_notifications');
  if (!saved) return INITIAL_NOTIFICATIONS;
  try {
    const parsed: NotificationOutboxItem[] = JSON.parse(saved);
    const normalized = parsed.map((n) => {
      if (n.absenceDate === '2026-10-10') return { ...n, absenceDate: '2026-10-12' };
      return n;
    });
    const existingIds = new Set(normalized.map((n) => n.id));
    const missing = INITIAL_NOTIFICATIONS.filter((n) => !existingIds.has(n.id));
    const merged = [...normalized, ...missing];
    if (typeof localCache !== 'undefined') {
      localCache.setItem('school_notifications', JSON.stringify(merged));
    }
    return merged;
  } catch {
    return INITIAL_NOTIFICATIONS;
  }
}

export function loadAuditLogs(): AuditLog[] {
  const saved = localCache.getItem('school_audit_logs');
  return saved ? JSON.parse(saved) : INITIAL_AUDIT_LOGS;
}

export function loadBehaviourIncidents(): StudentBehaviourIncident[] {
  const saved = localCache.getItem('school_behaviour_incidents');
  if (!saved) return INITIAL_BEHAVIOUR_INCIDENTS;
  try {
    const parsed: StudentBehaviourIncident[] = JSON.parse(saved);
    const existingIds = new Set(parsed.map((b) => b.id));
    const missing = INITIAL_BEHAVIOUR_INCIDENTS.filter((b) => !existingIds.has(b.id));
    return [...parsed, ...missing];
  } catch {
    return INITIAL_BEHAVIOUR_INCIDENTS;
  }
}

export function loadSettingsMap(): Record<string, SchoolSettings> {
  const saved = localCache.getItem('school_settings');
  return saved ? JSON.parse(saved) : {};
}

export function loadSchoolProfilesMap(): Record<string, TenantSchoolProfile> {
  try {
    const saved = localCache.getItem('tenant_school_profiles');
    if (saved) {
      return JSON.parse(saved);
    }
  } catch (e) {
    console.error('Failed to parse cached tenant_school_profiles', e);
  }
  return {};
}

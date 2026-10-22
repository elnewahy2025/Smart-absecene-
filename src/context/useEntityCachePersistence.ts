import { useEffect } from 'react';
import { localCache } from '../utils/localCache';
import type {
  AttendanceSession,
  AuditLog,
  Justification,
  NotificationOutboxItem,
  SchoolSettings,
  Student,
  TenantSchoolProfile,
} from '../types/attendance';

interface EntityCacheDeps {
  allStudents: Student[];
  allSessions: AttendanceSession[];
  allJustifications: Justification[];
  allNotifications: NotificationOutboxItem[];
  allAuditLogs: AuditLog[];
  settingsMap: Record<string, SchoolSettings>;
  schoolProfilesMap: Record<string, TenantSchoolProfile>;
}

/** Mirrors every in-memory collection into localCache so reloads start warm. */
export function useEntityCachePersistence({
  allStudents,
  allSessions,
  allJustifications,
  allNotifications,
  allAuditLogs,
  settingsMap,
  schoolProfilesMap,
}: EntityCacheDeps) {
  useEffect(() => {
    localCache.setItem('school_students', JSON.stringify(allStudents));
  }, [allStudents]);

  useEffect(() => {
    localCache.setItem('school_sessions', JSON.stringify(allSessions));
  }, [allSessions]);

  useEffect(() => {
    localCache.setItem('school_justifications', JSON.stringify(allJustifications));
  }, [allJustifications]);

  useEffect(() => {
    localCache.setItem('school_notifications', JSON.stringify(allNotifications));
  }, [allNotifications]);

  useEffect(() => {
    localCache.setItem('school_audit_logs', JSON.stringify(allAuditLogs));
  }, [allAuditLogs]);

  useEffect(() => {
    localCache.setItem('school_settings', JSON.stringify(settingsMap));
  }, [settingsMap]);

  useEffect(() => {
    localCache.setItem('tenant_school_profiles', JSON.stringify(schoolProfilesMap));
  }, [schoolProfilesMap]);
}

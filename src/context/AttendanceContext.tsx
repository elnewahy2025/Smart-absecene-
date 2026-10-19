import React, { createContext, useContext, useState, useEffect, useMemo, useCallback, useRef } from 'react';
import {
  Tenant,
  UserProfile,
  Student,
  StudentEnrollmentStatus,
  AttendanceSession,
  AttendanceRecord,
  StudentAttendanceRecord,
  AttendanceStatus,
  Justification,
  NotificationOutboxItem,
  AuditLog,
  SchoolSettings,
  UserRole,
  DailyDigestAnomaly,
  DailyDigestHighRiskStudent,
  DailyDigestPendingExcuse,
  DailyEmailDigestItem,
  DailyEmailDigestConfig,
  TenantSchoolProfile,
  StudentBehaviourIncident,
  SchoolClassSummary,
  SchoolEnrollmentStats,
  OfficialHoliday,
  HolidayType,
  SchoolProvisionInput,
  SchoolMessagingGatewayConfig,
} from '../types/attendance';
import {
  isSchoolOffDay,
  OffDayCheckResult,
  DEFAULT_WEEKEND_DAYS,
  DEFAULT_OFFICIAL_HOLIDAYS,
} from '../utils/holidayUtils';
import { getDefaultSchoolProfile } from '../config/tenantSettings';
import { getDefaultSchoolSettings } from '../config/defaultSettings';
import { computeDailyDigestData, generateHtmlEmailTemplate } from '../utils/digestEngine';
import {
  INITIAL_USERS,
  INITIAL_STUDENTS,
  INITIAL_SESSIONS,
  INITIAL_JUSTIFICATIONS,
  INITIAL_NOTIFICATIONS,
  INITIAL_AUDIT_LOGS,
  INITIAL_BEHAVIOUR_INCIDENTS,
} from '../data/initialState';
import { localCache } from '../utils/localCache';
import {
  canManageSettings as canManageSettingsRule,
  canWriteSubmittedSessions,
  isElevatedOrSuperAdmin,
  canEditSession as canEditSessionRule,
  isChildOfGuardian as isChildOfGuardianRule,
} from '../utils/attendanceAccess';
const REGISTRY_TENANTS: Tenant[] = Object.values(TENANT_REGISTRY).map((config) => ({
  id: config.tenantId,
  name: config.nameAr,
  code: config.code,
  city: config.cityAr,
  academicYear: config.academicYear,
  currentTerm: config.currentTerm,
  schoolType: config.schoolType,
}));

import {
  TENANT_REGISTRY,
  TenantDomainConfig,
  resolveTenantFromHostname,
  getActiveTenantRegistry,
} from '../config/tenantRegistry';

import {
  auth,
  db,
  googleProvider,
  handleFirestoreError,
  OperationType,
} from '../lib/firebase';
import { authenticatedFetch, setApiTenantOverride } from '../lib/api';
import { evaluateSubscription, normalizeSubscription } from '../config/subscription';
import type { SubscriptionEvaluation, TenantSubscription } from '../config/subscription';

const PLATFORM_OWNER_EMAILS = ((import.meta as any).env?.VITE_PLATFORM_OWNER_EMAILS || '')
  .split(',')
  .map((value: string) => value.trim().toLowerCase())
  .filter(Boolean);
import {
  signInWithPopup,
  signInWithRedirect,
  getRedirectResult,
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  User as FirebaseUser,
  UserCredential,
} from 'firebase/auth';
import {
  doc,
  setDoc,
  collection,
  getDoc,
  onSnapshot,
  query,
  where,
  getDocs,
  updateDoc,
  deleteDoc,
} from 'firebase/firestore';

const toFirestoreData = <T,>(value: T): T => JSON.parse(JSON.stringify(value));

const buildParentSessions = (records: StudentAttendanceRecord[]): AttendanceSession[] => {
  const bySession = new Map<string, AttendanceSession>();

  for (const record of records) {
    let session = bySession.get(record.sessionId);
    if (!session) {
      session = {
        id: record.sessionId,
        tenantId: record.tenantId,
        date: record.date,
        sessionType: record.sessionType,
        periodNumber: record.periodNumber,
        subject: record.subject,
        classId: record.classId,
        className: record.className,
        grade: '',
        teacherId: '',
        teacherName: record.teacherName || '',
        status: 'submitted',
        totalStudents: 0,
        presentCount: 0,
        absentCount: 0,
        lateCount: 0,
        excusedCount: 0,
        records: [],
      };
      bySession.set(record.sessionId, session);
    }

    session.records.push({
      id: record.id,
      sessionId: record.sessionId,
      studentId: record.studentId,
      status: record.status,
      minutesLate: record.minutesLate,
      note: record.note,
      updatedAt: record.updatedAt,
      updatedBy: '',
    });
  }

  return Array.from(bySession.values()).map((session) => ({
    ...session,
    totalStudents: session.records.length,
    presentCount: session.records.filter((item) => item.status === 'present').length,
    absentCount: session.records.filter((item) => item.status === 'absent').length,
    lateCount: session.records.filter((item) => item.status === 'late').length,
    excusedCount: session.records.filter((item) =>
      ['excused_absence', 'excused_leave', 'under_review'].includes(item.status)
    ).length,
  }));
};

interface UserAccountResult {
  success: boolean;
  message: string;
  user?: UserProfile;
  /** Present when the server created (or reset) a login and generated the password. */
  temporaryPassword?: string;
}

interface AttendanceContextType {
  // Firebase Auth
  firebaseUser: FirebaseUser | null;
  signInWithGoogle: (useRedirect?: boolean) => Promise<UserCredential | undefined>;
  signOutGoogle: () => Promise<void>;
  signInWithCredentials: (
    email: string,
    pass: string
  ) => Promise<{ success: boolean; user?: UserProfile; error?: string; isFirebase?: boolean }>;

  // Tenant & Role
  currentTenant: Tenant;
  tenantDomainConfig?: TenantDomainConfig;
  /** Owner-managed subscription policy for the current school (null until loaded). */
  tenantSubscription: TenantSubscription | null;
  /** Time-aware access decision derived from the stored subscription. */
  subscriptionAccess: SubscriptionEvaluation;
  refreshSubscription: () => Promise<void>;
  tenants: Tenant[];
  setTenantId: (id: string) => void;
  currentUser: UserProfile;
  setUserRole: (role: UserRole) => void;
  lang: 'ar' | 'en';
  setLang: (lang: 'ar' | 'en') => void;

  // RBAC Permission Checks
  isSuperAdmin: boolean;
  canManageSettings: boolean;
  canReviewJustifications: boolean;
  canReopenSessions: boolean;
  canImportStudents: boolean;
  canDispatchDigest: boolean;
  canManageOutbox: boolean;
  canEditSession: (session: AttendanceSession) => boolean;

  // Platform Owner / Multi-Tenant School Provisioning
  provisionNewSchool: (input: SchoolProvisionInput) => Promise<{
    success: boolean;
    message: string;
    tenantId: string;
    principalEmail?: string;
    temporaryPassword?: string;
  }>;
  refreshDynamicTenants: () => Promise<void>;

  // Data scoped to currentTenant
  users: UserProfile[];
  students: Student[];
  sessions: AttendanceSession[];
  justifications: Justification[];
  notifications: NotificationOutboxItem[];
  auditLogs: AuditLog[];
  settings: SchoolSettings;

  // User & RBAC Management
  createUser: (user: Omit<UserProfile, 'id' | 'tenantId'>) => Promise<UserAccountResult>;
  updateUser: (userId: string, updates: Partial<UserProfile>) => Promise<UserAccountResult>;
  deleteUser: (userId: string) => Promise<{ success: boolean; message: string }>;

  // Actions
  updateRecord: (
    sessionId: string,
    studentId: string,
    status: AttendanceStatus,
    minutesLate?: number,
    note?: string
  ) => void;
  setAllPresentInDraft: (sessionId: string) => void;
  quickMarkGroupAsPresent: (sessionId: string, studentIds?: string[]) => { updatedCount: number; message: string };
  submitSession: (sessionId: string) => { success: boolean; message: string };
  reopenSession: (sessionId: string, reason: string) => { success: boolean; message: string };
  createNewSession: (
    sessionType: 'daily' | 'period',
    periodNumber: number,
    subject: string,
    className: string,
    classId: string,
    grade: string
  ) => AttendanceSession;
  
  // Justifications
  createJustification: (
    studentId: string,
    absenceDate: string,
    reasonType: 'medical' | 'family' | 'travel' | 'other',
    guardianExplanation: string,
    attachment?: { name: string; mime: string; base64: string },
    aiAnalysis?: any
  ) => Promise<Justification>;
  reviewJustification: (
    justificationId: string,
    status: 'approved' | 'rejected',
    notes: string
  ) => void;
  updateJustificationAnalysis: (
    justificationId: string,
    aiAnalysis: any
  ) => void;

  // Notifications
  retryNotification: (id: string) => Promise<boolean>;
  retryAllFailedNotifications: () => void;
  sendCustomParentNotification: (params: {
    studentIds: string[];
    messageText: string;
    channel: 'SMS' | 'WhatsApp';
    category?: 'absence' | 'late' | 'warning' | 'broadcast' | 'excuse_approved';
    absenceDate?: string;
  }) => number;
  sendChronicWarningNotification: (studentId: string, warningTier: number) => boolean;
  sendAllChronicWarningNotifications: (tierThreshold?: number) => number;

  // Audit
  addAuditLog: (entry: Omit<AuditLog, 'id' | 'tenantId' | 'timestamp'>) => void;

  // Student Enrollment & Lifecycle
  addStudent: (student: Omit<Student, 'id' | 'tenantId' | 'attendanceRate' | 'totalAbsences' | 'totalLates'>) => Student;
  updateStudent: (studentId: string, updates: Partial<Student>) => void;
  transferStudent: (studentId: string, details: { destinationSchool: string; reason?: string }) => void;
  restoreStudent: (studentId: string) => void;
  deleteStudent: (studentId: string) => { success: boolean; message: string };
  importStudents: (newStudents: Partial<Student>[]) => { imported: number; duplicates: number };

  // School & Class Analytics
  classesStats: SchoolClassSummary[];
  schoolEnrollmentStats: SchoolEnrollmentStats;

  // Settings & Messaging Gateways (Owner Guarded)
  updateSettings: (newSettings: Partial<SchoolSettings>) => void;
  schoolProfile: TenantSchoolProfile;
  updateSchoolProfile: (newProfile: Partial<TenantSchoolProfile>) => Promise<void>;
  messagingGateway: SchoolMessagingGatewayConfig;
  updateMessagingGateway: (config: Partial<SchoolMessagingGatewayConfig>) => { success: boolean; message: string };
  isOffDay: (dateStr: string) => OffDayCheckResult;
  weekendDays: number[];
  officialHolidays: OfficialHoliday[];

  // Student Behaviour Tracking
  behaviourIncidents: StudentBehaviourIncident[];
  addBehaviourIncident: (incident: Omit<StudentBehaviourIncident, 'id' | 'tenantId'>) => StudentBehaviourIncident;

  // Daily Email Digest
  digestConfig: DailyEmailDigestConfig;
  digestHistory: DailyEmailDigestItem[];
  updateDigestConfig: (cfg: Partial<DailyEmailDigestConfig>) => void;
  generateCurrentDigest: (customConfig?: Partial<DailyEmailDigestConfig>) => Promise<DailyEmailDigestItem>;
  dispatchDailyDigest: (digestId?: string, targetRecipients?: string[]) => Promise<{ success: boolean; message: string; digestItem: DailyEmailDigestItem }>;
}

const AttendanceContext = createContext<AttendanceContextType | undefined>(undefined);

export const AttendanceProvider: React.FC<{ children: React.ReactNode; initialTenantId?: string }> = ({
  children,
  initialTenantId,
}) => {
  const [tenantId, setTenantIdState] = useState<string>(() => {
    if (initialTenantId) return initialTenantId;
    if (typeof window !== 'undefined') {
      const res = resolveTenantFromHostname(window.location.hostname, window.location.search);
      if (res.status === 'resolved' && res.tenantId) {
        return res.tenantId;
      }
    }
    return (typeof localCache !== 'undefined' && localCache.getItem('school_current_tenant_id')) || 'school-1';
  });
  const [authenticatedPhone, setAuthenticatedPhone] = useState('');

  // Tell the API client which school this session belongs to. The server still
  // authorises every call from the account's own claims, so this only routes
  // the request to the right tenant.
  useEffect(() => {
    setApiTenantOverride(tenantId);
  }, [tenantId]);

  const [currentUserRole, setCurrentUserRoleState] = useState<UserRole>(() => {
    return ((typeof localCache !== 'undefined' && localCache.getItem('school_current_user_role')) as UserRole) || 'parent';
  });
  const [lang, setLang] = useState<'ar' | 'en'>('ar');
  const [firebaseUser, setFirebaseUser] = useState<FirebaseUser | null>(null);

  const setTenantId = (id: string) => {
    setTenantIdState(id);
    if (typeof localCache !== 'undefined') {
      localCache.setItem('school_current_tenant_id', id);
    }
  };

  const setUserRole = (role: UserRole) => {
    setCurrentUserRoleState(role);
    if (typeof localCache !== 'undefined') {
      localCache.setItem('school_current_user_role', role);
    }
  };

  const [dynamicTenants, setDynamicTenants] = useState<TenantDomainConfig[]>(() => {
    if (typeof localCache !== 'undefined') {
      try {
        const saved = localCache.getItem('school_dynamic_tenants');
        if (saved) return JSON.parse(saved);
      } catch (e) {
        console.warn('Error reading dynamic tenants:', e);
      }
    }
    return [];
  });

  const [tenantSubscription, setTenantSubscription] = useState<TenantSubscription | null>(null);

  const refreshSubscription = useCallback(async () => {
    try {
      const res = await fetch(`/api/tenant/resolve?tenant=${encodeURIComponent(tenantId)}`, {
        cache: 'no-store',
      });
      if (!res.ok) return;
      const data = await res.json();
      if (data && data.status === 'resolved' && data.config) {
        setTenantSubscription(normalizeSubscription((data.config as any)?.subscription));
      }
    } catch (err) {
      console.warn('Could not load tenant subscription:', err);
    }
  }, [tenantId]);

  useEffect(() => {
    void refreshSubscription();
    // The owner can suspend a school from another session; re-check when the tab
    // regains focus and periodically so the gate appears without a hard reload.
    const refreshWhenVisible = () => {
      if (document.visibilityState === 'visible') void refreshSubscription();
    };
    window.addEventListener('focus', refreshWhenVisible);
    document.addEventListener('visibilitychange', refreshWhenVisible);
    const interval = window.setInterval(refreshWhenVisible, 60000);
    return () => {
      window.removeEventListener('focus', refreshWhenVisible);
      document.removeEventListener('visibilitychange', refreshWhenVisible);
      window.clearInterval(interval);
    };
  }, [refreshSubscription]);

  const subscriptionAccess = useMemo(
    () => evaluateSubscription(tenantSubscription),
    [tenantSubscription]
  );

  const syncTenantsWithServer = useCallback(async () => {
    try {
      const res = await fetch('/api/tenants');
      if (res.ok) {
        const data = await res.json();
        if (data.success && Array.isArray(data.tenants)) {
          setDynamicTenants((prev) => {
            const map = new Map<string, TenantDomainConfig>();
            for (const t of data.tenants) {
              if (t && t.tenantId) map.set(t.tenantId, t);
            }
            for (const t of prev) {
              if (t && t.tenantId && !map.has(t.tenantId)) map.set(t.tenantId, t);
            }
            const merged = Array.from(map.values());
            if (typeof localCache !== 'undefined') {
              localCache.setItem('school_dynamic_tenants', JSON.stringify(merged));
            }
            return merged;
          });
        }
      }
    } catch (err) {
      console.warn('Could not sync dynamic tenants from server:', err);
    }
  }, []);

  useEffect(() => {
    syncTenantsWithServer();
  }, [syncTenantsWithServer]);

  const tenants: Tenant[] = useMemo(() => {
    const list: Tenant[] = [...REGISTRY_TENANTS];
    for (const dt of dynamicTenants) {
      if (!list.some((t) => t.id === dt.tenantId)) {
        list.push({
          id: dt.tenantId,
          name: dt.nameAr,
          code: dt.code,
          city: dt.cityAr,
          academicYear: dt.academicYear,
          currentTerm: dt.currentTerm,
          schoolType: dt.schoolType,
        });
      }
    }
    return list;
  }, [dynamicTenants]);

  const [allUsers, setAllUsers] = useState<UserProfile[]>(() => {
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
  });

  const [allStudents, setAllStudents] = useState<Student[]>(() => {
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
  });

  const sessionHashesRef = useRef<Record<string, string>>({});
  const sessionsHydratedRef = useRef(false);
  const sessionsSeededRef = useRef(false);
  const sessionsRef = useRef<AttendanceSession[]>([]);

  const [allSessions, setAllSessions] = useState<AttendanceSession[]>(() => {
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
  });

  sessionsRef.current = allSessions;
  const [parentAttendanceRecords, setParentAttendanceRecords] = useState<StudentAttendanceRecord[]>([]);

  const [allJustifications, setAllJustifications] = useState<Justification[]>(() => {
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
  });

  const [allNotifications, setAllNotifications] = useState<NotificationOutboxItem[]>(() => {
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
  });

  const [allAuditLogs, setAllAuditLogs] = useState<AuditLog[]>(() => {
    const saved = localCache.getItem('school_audit_logs');
    return saved ? JSON.parse(saved) : INITIAL_AUDIT_LOGS;
  });

  const [allBehaviourIncidents, setAllBehaviourIncidents] = useState<StudentBehaviourIncident[]>(() => {
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
  });

  const [settingsMap, setSettingsMap] = useState<Record<string, SchoolSettings>>(() => {
    const saved = localCache.getItem('school_settings');
    return saved ? JSON.parse(saved) : {};
  });

  const [schoolProfilesMap, setSchoolProfilesMap] = useState<Record<string, TenantSchoolProfile>>(() => {
    try {
      const saved = localCache.getItem('tenant_school_profiles');
      if (saved) {
        return JSON.parse(saved);
      }
    } catch (e) {
      console.error('Failed to parse cached tenant_school_profiles', e);
    }
    return {};
  });

  const DEFAULT_DIGEST_CONFIG: DailyEmailDigestConfig = {
    enabled: true,
    scheduledTime: '06:45',
    daysOfWeek: [0, 1, 2, 3, 4],
    recipients: [],
    includeAnomalies: true,
    includePendingJustifications: true,
    includeHighRiskStudents: true,
    includeGeminiBriefing: true,
    chronicAbsenceThreshold: 5,
    consecutiveAbsenceDaysThreshold: 2,
    anomalySpikePercentage: 25,
    notifyViaWhatsAppToo: true,
    principalPhone: '',
  };

  const [digestConfig, setDigestConfig] = useState<DailyEmailDigestConfig>(() => {
    const saved = localCache.getItem('school_digest_config');
    return saved ? JSON.parse(saved) : DEFAULT_DIGEST_CONFIG;
  });

  const [digestHistory, setDigestHistory] = useState<DailyEmailDigestItem[]>(() => {
    const saved = localCache.getItem('school_digest_history');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch {
        return [];
      }
    }
    return [];
  });

  useEffect(() => {
    localCache.setItem('school_digest_config', JSON.stringify(digestConfig));
  }, [digestConfig]);

  useEffect(() => {
    localCache.setItem('school_digest_history', JSON.stringify(digestHistory));
  }, [digestHistory]);

  // Listen to Firebase Auth redirect results (for production deployments like Vercel & mobile browsers)
  useEffect(() => {
    getRedirectResult(auth)
      .then((result) => {
        if (result?.user) {
          setFirebaseUser(result.user);
        }
      })
      .catch((err) => {
        console.warn('[AUTH] getRedirectResult check:', err);
      });
  }, []);

  // Listen to Firebase Auth state and synchronize user role & tenant from Firestore
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setFirebaseUser(user);
      if (user) {
        const userEmail = (user.email || '').toLowerCase();

        // 1. If user is the Platform Owner
        if (PLATFORM_OWNER_EMAILS.includes(userEmail)) {
          setUserRole('super_admin');
          return;
        }

        // 2. Check local user registry for known seeded users / roles
        const matchedLocalUser = allUsers.find((u) => u.email.toLowerCase() === userEmail);

        if (matchedLocalUser) {
          if (matchedLocalUser.role) {
            setUserRole(matchedLocalUser.role);
          }
          if (matchedLocalUser.tenantId && matchedLocalUser.tenantId !== 'platform') {
            setTenantId(matchedLocalUser.tenantId);
          }
          return;
        }

        const userProfileRef = doc(db, 'users', user.uid);
        try {
          const userSnap = await getDoc(userProfileRef);
          if (userSnap.exists()) {
            const data = userSnap.data();
            if (data.tenantId) {
              setTenantId(data.tenantId);
            }
            if (data.role) {
              setUserRole(data.role as UserRole);
            }
            setAuthenticatedPhone(data.phone || '');
            setAllUsers((prev) => {
              const profile = {
                ...data,
                id: user.uid,
                userId: user.uid,
                tenantId: data.tenantId || tenantId,
                name: data.name || user.displayName || 'مستخدم معتمد',
                email: data.email || user.email || '',
                role: (data.role as UserRole) || 'parent',
                phone: data.phone || '',
                status: data.status || 'active',
              } as UserProfile;
              const map = new Map(prev.map((item) => [item.id, item]));
              map.set(profile.id, profile);
              return Array.from(map.values());
            });
          } else {
            // New user registration profile initialization
            await setDoc(userProfileRef, {
              userId: user.uid,
              tenantId: tenantId,
              name: user.displayName || 'مستخدم معتمد',
              email: user.email || '',
              role: currentUserRole,
              phone: user.phoneNumber || '',
              assignedClasses: currentUserRole === 'teacher' ? ['class-1a', 'class-1b'] : [],
              createdAt: new Date().toISOString(),
            }, { merge: true });
          }
        } catch (err) {
          handleFirestoreError(err, OperationType.WRITE, `users/${user.uid}`);
        }
      }
    });

    return () => unsubscribe();
  }, []);

  // Sync all entities from Firestore in real-time when authenticated
  useEffect(() => {
    if (!firebaseUser) return;

    const isParentUser = currentUserRole === 'parent';
    const parentProfile = isParentUser
      ? allUsers.find((user) => user.email.toLowerCase() === (firebaseUser.email || '').toLowerCase())
      : undefined;
    const parentPhone = authenticatedPhone || parentProfile?.phone;

    // 1. Students sync
    const qStudents = parentPhone
      ? query(collection(db, 'students'), where('tenantId', '==', tenantId), where('guardianPhone', '==', parentPhone))
      : query(collection(db, 'students'), where('tenantId', '==', tenantId));
    const unsubStudents = onSnapshot(
      qStudents,
      (snapshot) => {
        if (!snapshot.empty) {
          const remoteStudents: Student[] = [];
          snapshot.forEach((docSnap) => {
            const data = docSnap.data();
            remoteStudents.push({
              id: docSnap.id,
              tenantId: data.tenantId || tenantId,
              studentNumber: data.studentNumber || '',
              nationalId: data.nationalId || '',
              fullName: data.fullName || '',
              grade: data.grade || 'الصف العاشر',
              className: data.className || '',
              classId: data.classId || 'class-1a',
              guardianName: data.guardianName || 'ولي أمر معتمد',
              guardianPhone: data.guardianPhone || '',
              guardianRelationship: data.guardianRelationship || '',
              bloodType: data.bloodType || '',
              totalAbsences: data.totalAbsences || 0,
              totalLates: data.totalLates || 0,
              attendanceRate: data.attendanceRate || 100,
            });
          });
          if (remoteStudents.length > 0) {
            setAllStudents((prev) => {
              const map = new Map<string, Student>();
              prev.forEach((s) => map.set(s.id, s));
              remoteStudents.forEach((s) => map.set(s.id, s));
              return Array.from(map.values());
            });
          }
        }
      },
      (error) => {
        handleFirestoreError(error, OperationType.GET, 'students');
      }
    );

    // 2. Attendance Sessions sync
    const qSessions = query(collection(db, 'attendance_sessions'), where('tenantId', '==', tenantId));
    const unsubSessions =
      currentUserRole === 'parent'
        ? () => {}
        : onSnapshot(
      qSessions,
      (snapshot) => {
        if (!snapshot.empty) {
          const remoteSessions: AttendanceSession[] = [];
          snapshot.forEach((docSnap) => {
            const data = docSnap.data() as AttendanceSession;
            remoteSessions.push({ ...data, id: docSnap.id });
            sessionHashesRef.current[docSnap.id] = JSON.stringify({ ...data, id: docSnap.id });
          });
          if (remoteSessions.length > 0) {
            setAllSessions((prev) => {
              const map = new Map<string, AttendanceSession>();
              prev.forEach((s) => map.set(s.id, s));
              remoteSessions.forEach((s) => map.set(s.id, s));
              return Array.from(map.values());
            });
          }
        }
        sessionsHydratedRef.current = true;
        if (!sessionsSeededRef.current) {
          for (const session of sessionsRef.current) {
            sessionHashesRef.current[session.id] = JSON.stringify(session);
          }
          sessionsSeededRef.current = true;
        }
      },
      (error) => {
        sessionsHydratedRef.current = true;
        if (!sessionsSeededRef.current) {
          for (const session of sessionsRef.current) {
            sessionHashesRef.current[session.id] = JSON.stringify(session);
          }
          sessionsSeededRef.current = true;
        }
        handleFirestoreError(error, OperationType.GET, 'attendance_sessions');
      }
    );

    // 3. Justifications sync
    const qJustifications = parentPhone
      ? query(collection(db, 'justifications'), where('tenantId', '==', tenantId), where('guardianPhone', '==', parentPhone))
      : query(collection(db, 'justifications'), where('tenantId', '==', tenantId));
    const unsubJustifications = onSnapshot(
      qJustifications,
      (snapshot) => {
        if (!snapshot.empty) {
          const remoteJustifications: Justification[] = [];
          snapshot.forEach((docSnap) => {
            const data = docSnap.data() as Justification;
            remoteJustifications.push({ ...data, id: docSnap.id });
          });
          if (remoteJustifications.length > 0) {
            setAllJustifications((prev) => {
              const map = new Map<string, Justification>();
              prev.forEach((j) => map.set(j.id, j));
              remoteJustifications.forEach((j) => map.set(j.id, j));
              return Array.from(map.values());
            });
          }
        }
      },
      (error) => {
        handleFirestoreError(error, OperationType.GET, 'justifications');
      }
    );

    // 4. Notification outbox sync
    const qNotifications = parentPhone
      ? query(collection(db, 'notification_outbox'), where('tenantId', '==', tenantId), where('recipientPhone', '==', parentPhone))
      : query(collection(db, 'notification_outbox'), where('tenantId', '==', tenantId));
    const unsubNotifications = onSnapshot(
      qNotifications,
      (snapshot) => {
        if (!snapshot.empty) {
          const remoteNotifications: NotificationOutboxItem[] = [];
          snapshot.forEach((docSnap) => {
            const data = docSnap.data() as NotificationOutboxItem;
            remoteNotifications.push({ ...data, id: docSnap.id });
          });
          if (remoteNotifications.length > 0) {
            setAllNotifications((prev) => {
              const map = new Map<string, NotificationOutboxItem>();
              prev.forEach((n) => map.set(n.id, n));
              remoteNotifications.forEach((n) => map.set(n.id, n));
              return Array.from(map.values());
            });
          }
        }
      },
      (error) => {
        handleFirestoreError(error, OperationType.GET, 'notification_outbox');
      }
    );

    // 5. Audit logs sync
    const qAudit = query(collection(db, 'audit_logs'), where('tenantId', '==', tenantId));
    const unsubAudit = isParentUser
      ? () => {}
      : onSnapshot(
      qAudit,
      (snapshot) => {
        if (!snapshot.empty) {
          const remoteLogs: AuditLog[] = [];
          snapshot.forEach((docSnap) => {
            const data = docSnap.data() as AuditLog;
            remoteLogs.push({ ...data, id: docSnap.id });
          });
          if (remoteLogs.length > 0) {
            setAllAuditLogs((prev) => {
              const map = new Map<string, AuditLog>();
              prev.forEach((a) => map.set(a.id, a));
              remoteLogs.forEach((a) => map.set(a.id, a));
              return Array.from(map.values()).sort(
                (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
              );
            });
          }
        }
      },
      (error) => {
        handleFirestoreError(error, OperationType.GET, 'audit_logs');
      }
    );

    return () => {
      unsubStudents();
      unsubSessions();
      unsubJustifications();
      unsubNotifications();
      unsubAudit();
    };
  }, [firebaseUser, tenantId, currentUserRole, allUsers, authenticatedPhone]);

  // Staff directory: keep the tenant's user list in sync with Firestore so new
  // accounts appear on every device instead of only in the creating session.
  useEffect(() => {
    if (!firebaseUser) return;
    if (!['admin', 'registrar', 'super_admin'].includes(currentUserRole)) return;

    const usersQuery = query(collection(db, 'users'), where('tenantId', '==', tenantId));
    const unsubUsers = onSnapshot(
      usersQuery,
      (snapshot) => {
        const rows: UserProfile[] = [];
        snapshot.forEach((docSnap) => rows.push({ ...(docSnap.data() as UserProfile), id: docSnap.id }));
        setAllUsers((prev) => {
          const ids = new Set(rows.map((u) => u.id));
          const localOnly = prev.filter(
            (u) => u.tenantId === tenantId && u.role !== 'super_admin' && !ids.has(u.id)
          );
          const fallback = INITIAL_USERS.filter(
            (u) => u.tenantId === tenantId && !ids.has(u.id) && !localOnly.some((l) => l.id === u.id)
          );
          return [...rows, ...localOnly, ...fallback];
        });
      },
      (error) => console.error('[USERS] Could not load staff directory:', error?.code)
    );

    return () => unsubUsers();
  }, [firebaseUser, tenantId, currentUserRole]);

  const signInWithGoogle = async (useRedirect = false): Promise<UserCredential | undefined> => {
    try {
      if (useRedirect) {
        await signInWithRedirect(auth, googleProvider);
        return undefined;
      }
      return await signInWithPopup(auth, googleProvider);
    } catch (error: any) {
      console.error('Google Sign-In Error:', error);
      if (error?.code === 'auth/popup-blocked') {
        console.warn('Popup blocked by browser, falling back to signInWithRedirect...');
        await signInWithRedirect(auth, googleProvider);
        return undefined;
      }
      throw error;
    }
  };

  const signOutGoogle = async () => {
    try {
      await signOut(auth);
    } catch (error) {
      console.error('Sign Out Error:', error);
      throw error;
    }
  };

  const signInWithCredentials = async (
    targetEmail: string,
    pass: string
  ): Promise<{ success: boolean; user?: UserProfile; error?: string; isFirebase?: boolean }> => {
    const trimmed = targetEmail.trim().toLowerCase();

    // 1. Attempt Firebase Authentication (Email/Password)
    try {
      const userCred = await signInWithEmailAndPassword(auth, trimmed, pass);
      const fUser = userCred.user;

      const localMatch = allUsers.find((u) => u.email.toLowerCase() === trimmed);
      const userProfile: UserProfile = localMatch || {
        id: fUser.uid,
        tenantId,
        name: fUser.displayName || fUser.email?.split('@')[0] || 'مستخدم معتمد',
        role: currentUserRole,
        phone: fUser.phoneNumber || '',
        email: fUser.email || trimmed,
        status: 'active',
      };

      if (userProfile.role !== 'super_admin' && userProfile.tenantId && userProfile.tenantId !== tenantId) {
        return {
          success: false,
          error: `تم رفض الدخول: هذا الحساب مسجل لمدرسة أخرى (${userProfile.tenantId}). لا تملك صلاحية الوصول إلى بوابة المدرسة الحالية.`,
        };
      }

      if (userProfile.status === 'inactive') {
        return {
          success: false,
          error: 'تم تعطيل هذا الحساب مؤقتاً من قبل إدارة المدرسة.',
        };
      }

      if (userProfile.role) {
        setUserRole(userProfile.role);
      }

      return { success: true, user: userProfile, isFirebase: true };
    } catch (firebaseErr: any) {
      console.warn('[AUTH] Firebase sign-in failed:', firebaseErr.code);
      const isWrongPass = firebaseErr.code === 'auth/wrong-password' || firebaseErr.code === 'auth/invalid-credential';
      return {
        success: false,
        error: isWrongPass
          ? 'كلمة المرور غير صحيحة.'
          : 'تعذر تسجيل الدخول. تحقق من بيانات الحساب أو تواصل مع إدارة المدرسة.',
      };
    }
  };

  // Save changes to localCache
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

  // Current tenant and school profile
  const schoolProfile: TenantSchoolProfile =
    schoolProfilesMap[tenantId] || getDefaultSchoolProfile(tenantId);

  const baseTenant = tenants.find((t) => t.id === tenantId) || tenants[0] || REGISTRY_TENANTS[0];
  const currentTenant: Tenant = {
    ...baseTenant,
    name: schoolProfile.schoolName || baseTenant.name,
    code: schoolProfile.schoolCode || baseTenant.code,
    city: schoolProfile.address?.city || baseTenant.city,
    academicYear: schoolProfile.academicYear?.hijriYear || baseTenant.academicYear,
    schoolType: schoolProfile.genderType || baseTenant.schoolType,
    schoolProfile,
  };
  const activeRegistry = getActiveTenantRegistry();
  const tenantDomainConfig = activeRegistry[tenantId] || TENANT_REGISTRY[tenantId];

  // Platform Owner Stealth & God-Mode RBAC Check
  const isSuperAdmin = currentUserRole === 'super_admin';

  const currentUser: UserProfile =
    (isSuperAdmin
      ? allUsers.find((u) => u.role === 'super_admin') || {
          id: 'user-owner',
          tenantId: 'platform',
          name: firebaseUser?.displayName || '',
          role: 'super_admin',
          phone: authenticatedPhone || '',
          email: PLATFORM_OWNER_EMAILS[0] || '',
          status: 'active',
        }
      : allUsers.find((u) => u.id === firebaseUser?.uid) ||
        allUsers.find((u) => u.email.toLowerCase() === (firebaseUser?.email || '').toLowerCase()) ||
        allUsers.find((u) => u.tenantId === tenantId && u.role === currentUserRole)) || {
      id: firebaseUser?.uid || `user-${currentUserRole}-${tenantId}`,
      tenantId: tenantId,
      name: firebaseUser?.displayName || '',
      role: currentUserRole,
      phone: authenticatedPhone || '',
      email: firebaseUser?.email || '',
      assignedClasses: currentUserRole === 'teacher' ? [] : undefined,
    };

  const settings = settingsMap[tenantId] || getDefaultSchoolSettings(tenantId);
  const weekendDays = settings.weekendDays || schoolProfile.weekendDays || DEFAULT_WEEKEND_DAYS;
  const officialHolidays = settings.officialHolidays || schoolProfile.officialHolidays || DEFAULT_OFFICIAL_HOLIDAYS;

  const messagingGateway: SchoolMessagingGatewayConfig = useMemo(() => {
    return (
      schoolProfile.messagingGateway ||
      settings.messagingGateway || {
        whatsappPhoneNumber: '',
        whatsappServiceMode: 'web_direct',
        smsProvider: 'taqnyat',
        smsSenderId: '',
        enableWhatsAppNotifications: false,
        enableSmsNotifications: false,
        lastConfiguredByRole: 'super_admin',
        lastConfiguredByEmail: currentUser?.email || '',
        lastConfiguredAt: '',
      }
    );
  }, [schoolProfile.messagingGateway, settings.messagingGateway]);

  const isOffDay = (dateStr: string): OffDayCheckResult => {
    return isSchoolOffDay(dateStr, weekendDays, officialHolidays);
  };

  // RBAC Permission Booleans (Super Admin has FULL permissions everywhere)
  const canManageSettings = canManageSettingsRule(currentUserRole, isSuperAdmin);
  // Parents read per-student mirrors, never the raw session documents.
  useEffect(() => {
    if (!firebaseUser || currentUserRole !== 'parent') {
      setParentAttendanceRecords([]);
      return;
    }
    const phone = authenticatedPhone || currentUser?.phone;
    if (!phone) return;

    const recordsQuery = query(
      collection(db, 'attendance_records'),
      where('tenantId', '==', tenantId),
      where('guardianPhone', '==', phone)
    );
    const unsubscribe = onSnapshot(
      recordsQuery,
      (snapshot) => {
        const rows: StudentAttendanceRecord[] = [];
        snapshot.forEach((docSnap) => {
          rows.push({ ...(docSnap.data() as StudentAttendanceRecord), id: docSnap.id });
        });
        setParentAttendanceRecords(rows.filter((row) => row.tenantId === tenantId));
      },
      (error) => console.error('[PARENT] Could not load attendance records:', error?.code)
    );

    return () => unsubscribe();
  }, [firebaseUser, currentUserRole, currentUser?.phone, tenantId, authenticatedPhone]);

  // Seed hashes at hydration so existing local/demo sessions are not bulk-uploaded;
  // only sessions changed after hydration are written.
  useEffect(() => {
    if (!sessionsHydratedRef.current || sessionsSeededRef.current) return;
    for (const session of allSessions) {
      sessionHashesRef.current[session.id] = JSON.stringify(session);
    }
    sessionsSeededRef.current = true;
  }, [allSessions]);

  useEffect(() => {
    if (!firebaseUser || !sessionsHydratedRef.current) return;
    if (!['admin', 'registrar', 'teacher', 'super_admin'].includes(currentUserRole)) return;

    const timer = setTimeout(() => {
      const canWriteSubmitted = canWriteSubmittedSessions(currentUserRole);
      for (const session of allSessions.filter((item) => item.tenantId === tenantId)) {
        const hash = JSON.stringify(session);
        if (sessionHashesRef.current[session.id] === hash) continue;

        if (session.status === 'submitted' && !canWriteSubmitted) {
          sessionHashesRef.current[session.id] = hash;
          continue;
        }

        sessionHashesRef.current[session.id] = hash;
        void setDoc(doc(db, 'attendance_sessions', session.id), toFirestoreData(session), { merge: true }).catch((error) =>
          console.error('[SESSIONS] Could not persist session:', error)
        );
        for (const record of session.records) {
          const student = allStudents.find((item) => item.id === record.studentId);
          if (!student?.guardianPhone) continue;

          const recordId = `${session.id}_${record.studentId}`;
          void setDoc(
            doc(db, 'attendance_records', recordId),
            toFirestoreData({
              id: recordId,
              tenantId: session.tenantId,
              sessionId: session.id,
              studentId: record.studentId,
              guardianPhone: student.guardianPhone,
              date: session.date,
              sessionType: session.sessionType,
              periodNumber: session.periodNumber,
              subject: session.subject,
              classId: session.classId,
              className: session.className,
              teacherName: session.teacherName,
              status: record.status,
              minutesLate: record.minutesLate,
              note: record.note,
              updatedAt: record.updatedAt || new Date().toISOString(),
            }),
            { merge: true }
          ).catch((error) => console.error('[SESSIONS] Could not persist attendance record:', error));
        }
      }
    }, 1200);

    return () => clearTimeout(timer);
  }, [allSessions, allStudents, firebaseUser, tenantId, currentUserRole]);
  // --- Settings persistence (Firestore is the source of truth; localCache is only a cache) ---
  const settingsHydratedRef = useRef(false);
  const lastSettingsHashRef = useRef('');

  useEffect(() => {
    if (!firebaseUser) {
      settingsHydratedRef.current = false;
      return;
    }

    const settingsRef = doc(db, 'settings', tenantId);
    const unsubscribe = onSnapshot(
      settingsRef,
      (snapshot) => {
        if (snapshot.exists()) {
          const data = snapshot.data() as any;
          if (data?.settings) {
            setSettingsMap((prev) => {
              const current = prev[tenantId] || getDefaultSchoolSettings(tenantId);
              return {
                ...prev,
                [tenantId]: {
                  ...current,
                  ...data.settings,
                  messagingGateway: current.messagingGateway,
                },
              };
            });
          }
          if (data?.schoolProfile) {
            setSchoolProfilesMap((prev) => {
              const current = prev[tenantId] || getDefaultSchoolProfile(tenantId);
              return {
                ...prev,
                [tenantId]: {
                  ...current,
                  ...data.schoolProfile,
                  messagingGateway: current.messagingGateway,
                },
              };
            });
          }
        }
        settingsHydratedRef.current = true;
      },
      (error) => {
        console.error('[SETTINGS] Could not load shared settings:', error);
        settingsHydratedRef.current = true;
      }
    );

    return () => unsubscribe();
  }, [firebaseUser, tenantId]);

  // Gateway credentials live in an admin-only document, never in the tenant-readable settings.
  useEffect(() => {
    if (!firebaseUser || !canManageSettings) return;

    const privateRef = doc(db, 'settings_private', tenantId);
    const unsubscribe = onSnapshot(
      privateRef,
      (snapshot) => {
        if (!snapshot.exists()) return;
        const gateway = (snapshot.data() as any)?.messagingGateway;
        if (!gateway) return;

        setSettingsMap((prev) => ({
          ...prev,
          [tenantId]: {
            ...(prev[tenantId] || getDefaultSchoolSettings(tenantId)),
            messagingGateway: gateway,
          },
        }));
        setSchoolProfilesMap((prev) => ({
          ...prev,
          [tenantId]: {
            ...(prev[tenantId] || getDefaultSchoolProfile(tenantId)),
            messagingGateway: gateway,
          },
        }));
      },
      (error) => console.error('[SETTINGS] Could not load messaging gateway:', error)
    );

    return () => unsubscribe();
  }, [firebaseUser, tenantId, canManageSettings]);

  useEffect(() => {
    if (!firebaseUser || !canManageSettings || !settingsHydratedRef.current) return;

    const timer = setTimeout(() => {
      const currentSettings =
        settingsMap[tenantId] || getDefaultSchoolSettings(tenantId);
      const currentProfile = schoolProfilesMap[tenantId] || getDefaultSchoolProfile(tenantId);
      const { messagingGateway: gatewayFromSettings, ...settingsForStore } = currentSettings;
      const { messagingGateway: gatewayFromProfile, ...profileForStore } = currentProfile;
      const gateway = gatewayFromSettings || gatewayFromProfile;
      const timestamp = new Date().toISOString();
      const payload = {
        settings: settingsForStore,
        schoolProfile: profileForStore,
        updatedAt: timestamp,
        updatedBy: firebaseUser.uid,
      };
      const hash = JSON.stringify(payload);
      if (hash === lastSettingsHashRef.current) return;
      lastSettingsHashRef.current = hash;

      void setDoc(doc(db, 'settings', tenantId), payload, { merge: true }).catch((error) =>
        console.error('[SETTINGS] Could not persist shared settings:', error)
      );

      if (gateway) {
        void setDoc(
          doc(db, 'settings_private', tenantId),
          { messagingGateway: gateway, updatedAt: timestamp, updatedBy: firebaseUser.uid },
          { merge: true }
        ).catch((error) => console.error('[SETTINGS] Could not persist messaging gateway:', error));
      }
    }, 1200);

    return () => clearTimeout(timer);
  }, [settingsMap, schoolProfilesMap, tenantId, firebaseUser, canManageSettings]);
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

  // Helper to determine if a student record belongs to the authenticated parent
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

  // Dynamic School & Class Analytics
  const classesStats: SchoolClassSummary[] = useMemo(() => {
    const tenantStudents = allStudents.filter((s) => s.tenantId === tenantId);
    const tenantTeachers = allUsers.filter((u) => u.tenantId === tenantId && u.role === 'teacher');
    const classMap = new Map<string, Student[]>();

    tenantStudents.forEach((student) => {
      const cls = student.className?.trim() || 'غير محدد';
      if (!classMap.has(cls)) {
        classMap.set(cls, []);
      }
      classMap.get(cls)!.push(student);
    });

    // Also union any configured classes from schoolProfile that might not have students yet
    const configuredClasses = schoolProfile.classes || [];
    configuredClasses.forEach((cfg) => {
      if (!classMap.has(cfg.name)) {
        classMap.set(cfg.name, []);
      }
    });

    return Array.from(classMap.entries()).map(([className, stList]) => {
      const activeStudentsList = stList.filter((s) => s.enrollmentStatus !== 'transferred');
      const transferredStudentsList = stList.filter((s) => s.enrollmentStatus === 'transferred');
      const cfgClass = configuredClasses.find((c) => c.name === className);
      const grade = cfgClass?.grade || stList[0]?.grade || 'المرحلة الدراسية';
      const classId = cfgClass?.id || stList[0]?.classId || `class-${className.replace(/[^a-zA-Z0-9]/g, '')}`;

      const avgRate = activeStudentsList.length > 0
        ? Math.round(activeStudentsList.reduce((acc, s) => acc + (s.attendanceRate || 100), 0) / activeStudentsList.length)
        : 100;

      const assignedTeachersCount = tenantTeachers.filter((t) =>
        t.assignedClasses && t.assignedClasses.includes(className)
      ).length;

      return {
        className,
        grade,
        classId,
        totalStudents: stList.length,
        activeStudents: activeStudentsList.length,
        transferredStudents: transferredStudentsList.length,
        attendanceRate: avgRate,
        assignedTeachersCount,
      };
    }).sort((a, b) => a.className.localeCompare(b.className, 'ar'));
  }, [allStudents, allUsers, tenantId, schoolProfile.classes]);

  const schoolEnrollmentStats: SchoolEnrollmentStats = useMemo(() => {
    const tenantStudents = allStudents.filter((s) => s.tenantId === tenantId);
    const active = tenantStudents.filter((s) => s.enrollmentStatus !== 'transferred');
    const transferred = tenantStudents.filter((s) => s.enrollmentStatus === 'transferred');
    const uniqueClasses = new Set(active.map((s) => s.className)).size;
    const avgSize = uniqueClasses > 0 ? Math.round(active.length / uniqueClasses) : 0;
    const avgRate = active.length > 0
      ? Math.round(active.reduce((acc, s) => acc + (s.attendanceRate || 100), 0) / active.length)
      : 100;

    return {
      totalStudentsCount: tenantStudents.length,
      activeStudentsCount: active.length,
      transferredStudentsCount: transferred.length,
      totalClassesCount: uniqueClasses,
      averageClassSize: avgSize,
      schoolAttendanceRate: avgRate,
    };
  }, [allStudents, tenantId]);

  const createUser = async (userData: Omit<UserProfile, 'id' | 'tenantId'>): Promise<UserAccountResult> => {
    if (!userData.email || !userData.email.includes('@')) {
      return { success: false, message: 'البريد الإلكتروني مطلوب لإنشاء حساب دخول صالح.' };
    }

    let serverUser: UserProfile | null = null;
    let temporaryPassword: string | undefined;

    try {
      const response = await authenticatedFetch('/api/users', {
        method: 'POST',
        body: JSON.stringify({
          name: userData.name,
          email: userData.email,
          phone: userData.phone,
          role: userData.role,
          jobTitle: userData.jobTitle,
          status: userData.status || 'active',
          assignedClasses: userData.assignedClasses,
          assignedSubjects: userData.assignedSubjects,
          tenantId,
        }),
      });

      const payload = await response.json().catch(() => null);
      if (!response.ok || !payload?.success) {
        return {
          success: false,
          message: payload?.error || 'تعذّر إنشاء حساب الدخول على الخادم. تحقق من البيانات وحاول مجدداً.',
        };
      }

      temporaryPassword = payload.temporaryPassword;
      serverUser = payload.user as UserProfile;
    } catch (err) {
      console.warn('[USERS] Server account creation unavailable, falling back to local profile:', err);
    }

    const id = serverUser?.id || `user-${userData.role}-${Date.now().toString().slice(-4)}`;
    const newUser: UserProfile = {
      ...userData,
      ...(serverUser || {}),
      id,
      tenantId,
      status: userData.status || 'active',
      createdAt: serverUser?.createdAt || new Date().toISOString(),
    };

    setAllUsers((prev) => {
      const updated = [...prev, newUser];
      if (typeof localCache !== 'undefined') {
        localCache.setItem('school_users', JSON.stringify(updated));
      }
      return updated;
    });

    if (!serverUser && firebaseUser) {
      setDoc(
        doc(db, 'users', id),
        {
          userId: id,
          tenantId,
          name: newUser.name,
          email: newUser.email,
          role: newUser.role,
          phone: newUser.phone,
          jobTitle: newUser.jobTitle || '',
          assignedClasses: newUser.assignedClasses || [],
          assignedSubjects: newUser.assignedSubjects || [],
          status: newUser.status,
          createdAt: newUser.createdAt,
        },
        { merge: true }
      ).catch((err) => console.warn('[FIRESTORE] User doc sync failed:', err));
    }

    addAuditLog({
      action: 'create',
      entityType: 'settings',
      entityId: id,
      performerId: currentUser.id,
      performerRole: currentUserRole,
      performerName: currentUser.name,
      details: `تم إنشاء حساب مستخدم جديد (${userData.name}) بدور [${userData.role}] وتعيين الصلاحيات`,
      detailsEn: `A new user account (${userData.name}) was created with the role [${userData.role}] and permissions were assigned`,
    });

    return {
      success: true,
      message: temporaryPassword
        ? `تم إنشاء الحساب. كلمة المرور المؤقتة: ${temporaryPassword}`
        : 'تم إنشاء حساب المستخدم بنجاح.',
      user: newUser,
      temporaryPassword,
    };
  };

  const updateUser = async (userId: string, updates: Partial<UserProfile>): Promise<UserAccountResult> => {
    let serverError: string | null = null;

    try {
      const response = await authenticatedFetch(`/api/users/${encodeURIComponent(userId)}`, {
        method: 'PATCH',
        body: JSON.stringify({
          name: updates.name,
          phone: updates.phone,
          role: updates.role,
          jobTitle: updates.jobTitle,
          status: updates.status,
          assignedClasses: updates.assignedClasses,
          assignedSubjects: updates.assignedSubjects,
        }),
      });

      const payload = await response.json().catch(() => null);
      if (!response.ok || !payload?.success) {
        // A missing server account is expected for locally created demo users.
        if (response.status !== 404) {
          serverError = payload?.error || 'تعذّر تحديث حساب الدخول على الخادم.';
        }
      }
    } catch (err) {
      console.warn('[USERS] Server account update unavailable, updating local profile only:', err);
    }

    setAllUsers((prev) => {
      const updated = prev.map((u) => (u.id === userId && u.tenantId === tenantId ? { ...u, ...updates } : u));
      if (typeof localCache !== 'undefined') {
        localCache.setItem('school_users', JSON.stringify(updated));
      }
      return updated;
    });

    addAuditLog({
      action: 'update',
      entityType: 'settings',
      entityId: userId,
      performerId: currentUser.id,
      performerRole: currentUserRole,
      performerName: currentUser.name,
      details: `تم تعديل بيانات المستخدم وصلاحياته (${updates.name || userId})`,
      detailsEn: `User data and permissions were updated (${updates.name || userId})`,
    });

    if (serverError) {
      return { success: false, message: serverError };
    }
    return { success: true, message: 'تم تحديث بيانات المستخدم بنجاح.' };
  };

  const deleteUser = async (userId: string): Promise<{ success: boolean; message: string }> => {
    const target = allUsers.find((u) => u.id === userId && u.tenantId === tenantId);
    if (!target) {
      return { success: false, message: 'المستخدم غير موجود' };
    }
    if (target.role === 'super_admin' || target.id === 'user-owner') {
      return { success: false, message: 'حساب مالك المنصة محمي تماماً ولا يمكن حذفه.' };
    }
    if (target.id === currentUser.id) {
      return { success: false, message: 'لا يمكنك حذف حسابك الشخصي النشط حالياً' };
    }

    try {
      const response = await authenticatedFetch(`/api/users/${encodeURIComponent(userId)}`, {
        method: 'DELETE',
      });
      const payload = await response.json().catch(() => null);
      if (!response.ok && response.status !== 404) {
        return { success: false, message: payload?.error || 'تعذّر حذف حساب الدخول على الخادم.' };
      }
    } catch (err) {
      console.warn('[USERS] Server account deletion unavailable, removing local profile only:', err);
    }

    setAllUsers((prev) => {
      const updated = prev.filter((u) => u.id !== userId);
      if (typeof localCache !== 'undefined') {
        localCache.setItem('school_users', JSON.stringify(updated));
      }
      return updated;
    });

    addAuditLog({
      action: 'delete',
      entityType: 'settings',
      entityId: userId,
      performerId: currentUser.id,
      performerRole: currentUserRole,
      performerName: currentUser.name,
      details: `تم حذف حساب المستخدم (${target.name}) [${target.role}] من المدرسة`,
      detailsEn: `User account (${target.name}) [${target.role}] was deleted from the school`,
    });

    return { success: true, message: 'تم حذف حساب المستخدم بنجاح' };
  };

  const behaviourIncidents = currentUserRole === 'parent'
    ? allBehaviourIncidents.filter((b) => b.tenantId === tenantId && parentChildIds.includes(b.studentId))
    : allBehaviourIncidents.filter((b) => b.tenantId === tenantId);

  const addBehaviourIncident = (incident: Omit<StudentBehaviourIncident, 'id' | 'tenantId'>): StudentBehaviourIncident => {
    const id = `beh-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
    const newIncident: StudentBehaviourIncident = {
      ...incident,
      id,
      tenantId,
    };

    setAllBehaviourIncidents((prev) => {
      const updated = [newIncident, ...prev];
      if (typeof localCache !== 'undefined') {
        localCache.setItem('school_behaviour_incidents', JSON.stringify(updated));
      }
      return updated;
    });

    addAuditLog({
      action: 'create',
      entityType: 'student',
      entityId: id,
      performerId: currentUser.id,
      performerRole: currentUserRole,
      performerName: currentUser.name,
      details: `تم تدوين واقعة سلوكية (${incident.type === 'positive' ? 'إيجابية' : 'مخالفة'}): ${incident.title} للطالب ${incident.studentName}`,
      detailsEn: `A behaviour incident was recorded (${incident.type === 'positive' ? 'Positive' : 'Violation'}): ${incident.title} for student ${incident.studentName}`,
    });

    return newIncident;
  };

  const addAuditLog = (entry: Omit<AuditLog, 'id' | 'tenantId' | 'timestamp'>) => {
    const logId = `audit-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
    const newLog: AuditLog = {
      ...entry,
      id: logId,
      tenantId: tenantId,
      timestamp: new Date().toISOString(),
    };
    setAllAuditLogs((prev) => [newLog, ...prev]);

    // Persist to Firestore as append-only document
    if (firebaseUser) {
      setDoc(doc(db, 'audit_logs', logId), {
        ...newLog,
      }).catch((err) => {
        handleFirestoreError(err, OperationType.WRITE, `audit_logs/${logId}`);
      });
    }
  };

  const updateRecord = (
    sessionId: string,
    studentId: string,
    status: AttendanceStatus,
    minutesLate?: number,
    note?: string
  ) => {
    const targetSession = allSessions.find((s) => s.id === sessionId);
    if (!targetSession || !canEditSession(targetSession)) {
      console.warn('Unauthorized: User does not have permission to edit this attendance record.');
      return;
    }
    setAllSessions((prev) =>
      prev.map((sess) => {
        if (sess.id !== sessionId) return sess;
        const updatedRecords = sess.records.map((rec) => {
          if (rec.studentId !== studentId) return rec;
          return {
            ...rec,
            status,
            minutesLate: status === 'late' ? minutesLate ?? rec.minutesLate ?? 10 : undefined,
            note: note !== undefined ? note : rec.note,
            updatedAt: new Date().toISOString(),
            updatedBy: currentUser.name,
          };
        });

        // Recalculate summary counts
        const presentCount = updatedRecords.filter((r) => r.status === 'present').length;
        const absentCount = updatedRecords.filter(
          (r) => r.status === 'absent' || r.status === 'rejected_excuse'
        ).length;
        const lateCount = updatedRecords.filter((r) => r.status === 'late').length;
        const excusedCount = updatedRecords.filter(
          (r) =>
            r.status === 'excused_absence' ||
            r.status === 'excused_leave' ||
            r.status === 'under_review'
        ).length;

        return {
          ...sess,
          records: updatedRecords,
          presentCount,
          absentCount,
          lateCount,
          excusedCount,
        };
      })
    );
  };

  const setAllPresentInDraft = (sessionId: string) => {
    const targetSession = allSessions.find((s) => s.id === sessionId);
    if (!targetSession || !canEditSession(targetSession)) {
      console.warn('Unauthorized: User cannot edit this session.');
      return;
    }
    setAllSessions((prev) =>
      prev.map((sess) => {
        if (sess.id !== sessionId) return sess;
        const updatedRecords = sess.records.map((r) => ({
          ...r,
          status: 'present' as AttendanceStatus,
          minutesLate: undefined,
          updatedAt: new Date().toISOString(),
          updatedBy: currentUser.name,
        }));
        return {
          ...sess,
          records: updatedRecords,
          presentCount: updatedRecords.length,
          absentCount: 0,
          lateCount: 0,
          excusedCount: 0,
        };
      })
    );
  };

  const quickMarkGroupAsPresent = (sessionId: string, studentIds?: string[]) => {
    const targetSession = allSessions.find((s) => s.id === sessionId);
    if (!targetSession || !canEditSession(targetSession)) {
      return { updatedCount: 0, message: 'غير مصرح لك بتعديل هذا الكشف وفق صلاحياتك الحالية.' };
    }
    let affectedCount = 0;
    setAllSessions((prev) =>
      prev.map((sess) => {
        if (sess.id !== sessionId) return sess;
        const targetIdsSet = studentIds && studentIds.length > 0 ? new Set(studentIds) : null;
        const updatedRecords = sess.records.map((r) => {
          if (!targetIdsSet || targetIdsSet.has(r.studentId)) {
            affectedCount++;
            return {
              ...r,
              status: 'present' as AttendanceStatus,
              minutesLate: undefined,
              updatedAt: new Date().toISOString(),
              updatedBy: currentUser.name,
            };
          }
          return r;
        });

        const presentCount = updatedRecords.filter((r) => r.status === 'present').length;
        const absentCount = updatedRecords.filter(
          (r) => r.status === 'absent' || r.status === 'rejected_excuse'
        ).length;
        const lateCount = updatedRecords.filter((r) => r.status === 'late').length;
        const excusedCount = updatedRecords.filter(
          (r) =>
            r.status === 'excused_absence' ||
            r.status === 'excused_leave' ||
            r.status === 'under_review'
        ).length;

        return {
          ...sess,
          records: updatedRecords,
          presentCount,
          absentCount,
          lateCount,
          excusedCount,
        };
      })
    );

    addAuditLog({
      entityType: 'session',
      entityId: sessionId,
      action: 'update',
      performerId: currentUser.id,
      performerName: currentUser.name,
      performerRole: currentUser.role,
      details:
        studentIds && studentIds.length > 0
          ? `التحضير السريع (Quick Mark): تم تعيين ${studentIds.length} طالب كمجموعة إلى حالة 'حاضر' افتراضياً.`
          : `التحضير السريع (Quick Mark): تم تعيين جميع طلاب الكشف كـ 'حاضر' لتسريع الرصد وحصر الغياب يدوياً.`,
      detailsEn:
        studentIds && studentIds.length > 0
          ? `Quick Mark: ${studentIds.length} students were assigned to the 'Present' status as a group by default.`
          : `Quick Mark: All students in the roster were set to 'Present' to speed up marking and limit absences to manual entry.`,
    });

    return {
      updatedCount: affectedCount,
      message:
        studentIds && studentIds.length > 0
          ? `تم تطبيق التحضير السريع على ${studentIds.length} طالب بنجاح.`
          : `تم تعيين كامل الفصل حاضر افتراضياً بنجاح. يمكنك الآن تعديل الغائبين فقط لتوفير الوقت.`,
    };
  };

  const submitSession = (sessionId: string) => {
    const targetSession = sessions.find((s) => s.id === sessionId);
    if (!targetSession) {
      return { success: false, message: 'الكشف غير موجود' };
    }
    if (!canEditSession(targetSession)) {
      return { success: false, message: 'غير مصرح لك باعتماد هذا الكشف وفق قواعد الصلاحيات (RBAC).' };
    }

    const now = new Date().toISOString();
    const newNotifications: NotificationOutboxItem[] = [];

    // Process absent & late students for Outbox pattern
    targetSession.records.forEach((rec) => {
      if (rec.status === 'absent' || rec.status === 'late') {
        const student = students.find((s) => s.id === rec.studentId);
        if (student) {
          const isAbsent = rec.status === 'absent';
          const defaultAbsentTpl = settings.absenceMessageTemplate || 'المكرم ولي أمر الطالب ({student_name}): نفيدكم بتسجيل غياب نجلكم عن ({subject}) بتاريخ {date}. يرجى تقديم العذر عبر الرابط المدرسي.';
          const defaultLateTpl = settings.lateMessageTemplate || 'المكرم ولي أمر الطالب ({student_name}): تم تسجيل تأخر نجلكم ({minutes} دقيقة) عن دوام اليوم بتاريخ {date}.';

          const msg = isAbsent
            ? defaultAbsentTpl
                .replace('{student_name}', student.fullName)
                .replace('{subject}', targetSession.subject || 'الدوام اليومي')
                .replace('{date}', targetSession.date)
            : defaultLateTpl
                .replace('{student_name}', student.fullName)
                .replace('{minutes}', String(rec.minutesLate || 10))
                .replace('{date}', targetSession.date);

          const ch: 'SMS' | 'WhatsApp' = settings.preferredChannel === 'WhatsApp' ? 'WhatsApp' : 'SMS';

          newNotifications.push({
            id: `notif-${Date.now()}-${student.id}`,
            tenantId: tenantId,
            recipientPhone: student.guardianPhone,
            recipientName: student.guardianName,
            studentId: student.id,
            studentName: student.fullName,
            absenceDate: targetSession.date,
            sessionTitle: `${targetSession.subject || 'حضور عام'} - ${targetSession.className}`,
            statusType: rec.status,
            category: isAbsent ? 'absence' : 'late',
            messageText: msg,
            channel: ch,
            status: 'pending',
            retryCount: 0,
            createdAt: now,
          });
        }
      }
    });

    // Update Session
    setAllSessions((prev) =>
      prev.map((s) =>
        s.id === sessionId
          ? {
              ...s,
              status: 'submitted',
              submittedAt: now,
              submittedBy: currentUser.name,
            }
          : s
      )
    );

    // Queue notifications if any
    if (newNotifications.length > 0) {
      setAllNotifications((prev) => [...newNotifications, ...prev]);
    }

    // Add audit log entry
    addAuditLog({
      entityType: 'session',
      entityId: sessionId,
      action: 'submit',
      performerId: currentUser.id,
      performerName: currentUser.name,
      performerRole: currentUser.role,
      details: `تم اعتماد وإرسال كشف الحضور (${targetSession.subject || 'حضور يومي'}) للصف ${targetSession.className} وتوليد ${newNotifications.length} إشعار ولي أمر تلقائي.`,
      detailsEn: `The attendance sheet (${targetSession.subject || 'Daily Attendance'}) for class ${targetSession.className} was approved and submitted, and ${newNotifications.length} automatic guardian notifications were generated.`,
    });

    return {
      success: true,
      message: `تم اعتماد الكشف بنجاح وإرسال ${newNotifications.length} إشعار لولي الأمر عبر المنظومة.`,
    };
  };

  const reopenSession = (sessionId: string, reason: string) => {
    if (!canReopenSessions) {
      return { success: false, message: 'صلاحية إعادة فتح الكشف محصورة بمدير المدرسة ومسجل شؤون الطلاب فقط.' };
    }
    if (!reason || reason.trim().length < 5) {
      return { success: false, message: 'يلزم كتابة سبب رسمي واضح لإعادة فتح الكشف وفق لوائح التدقيق.' };
    }

    const targetSession = sessions.find((s) => s.id === sessionId);
    if (!targetSession) return { success: false, message: 'الكشف غير موجود' };

    const now = new Date().toISOString();

    setAllSessions((prev) =>
      prev.map((s) =>
        s.id === sessionId
          ? {
              ...s,
              status: 'reopened',
              reopenedAt: now,
              reopenedBy: currentUser.name,
              reopenedReason: reason,
            }
          : s
      )
    );

    addAuditLog({
      entityType: 'session',
      entityId: sessionId,
      action: 'reopen',
      performerId: currentUser.id,
      performerName: currentUser.name,
      performerRole: currentUser.role,
      details: `إعادة فتح كشف معتمد (${targetSession.className} - ${targetSession.subject || 'حضور يومي'}). سبب الإعادة: "${reason}"`,
      detailsEn: `Reopening an approved attendance sheet (${targetSession.className} - ${targetSession.subject || 'Daily Attendance'}). Reopening reason: "${reason}"`,
      previousValue: 'معتمد (Submitted)',
      newValue: 'مُعاد فتحه (Reopened)',
    });

    return { success: true, message: 'تم فتح الكشف للتعديل وتوثيق السبب في سجل التدقيق.' };
  };

  const createNewSession = (
    sessionType: 'daily' | 'period',
    periodNumber: number,
    subject: string,
    className: string,
    classId: string,
    grade: string
  ): AttendanceSession => {
    const classStudents = students.filter(
      (s) => (s.classId === classId || s.className === className) && s.enrollmentStatus !== 'transferred'
    );
    const today = new Date().toISOString().split('T')[0];

    const records: AttendanceRecord[] = classStudents.map((s, idx) => ({
      id: `rec-new-${Date.now()}-${idx}`,
      sessionId: `sess-${Date.now()}`,
      studentId: s.id,
      status: 'present', // Visual convenience in UI, status is 'draft'
      updatedAt: new Date().toISOString(),
      updatedBy: currentUser.name,
    }));

    const newSession: AttendanceSession = {
      id: `sess-${Date.now()}`,
      tenantId: tenantId,
      date: today,
      sessionType,
      periodNumber: sessionType === 'period' ? periodNumber : undefined,
      subject: sessionType === 'period' ? subject : 'كشف الحضور الصباحي اليومي',
      classId,
      className,
      grade,
      teacherId: firebaseUser?.uid || currentUser.id,
      teacherName: currentUser.name,
      status: 'draft',
      totalStudents: records.length,
      presentCount: records.length,
      absentCount: 0,
      lateCount: 0,
      excusedCount: 0,
      records,
    };

    setAllSessions((prev) => [newSession, ...prev]);

    addAuditLog({
      entityType: 'session',
      entityId: newSession.id,
      action: 'create',
      performerId: currentUser.id,
      performerName: currentUser.name,
      performerRole: currentUser.role,
      details: `إنشاء كشف جديد (مسودة): ${newSession.subject} للصف ${className}`,
      detailsEn: `Creating a new attendance sheet (draft): ${newSession.subject} for class ${className}`,
    });

    return newSession;
  };

  const createJustification = async (
    studentId: string,
    absenceDate: string,
    reasonType: 'medical' | 'family' | 'travel' | 'other',
    guardianExplanation: string,
    attachment?: { name: string; mime: string; base64: string },
    aiAnalysis?: any
  ): Promise<Justification> => {
    if (currentUserRole === 'parent' && !parentChildIds.includes(studentId)) {
      throw new Error('Unauthorized: Parents can only submit excuses for their own children.');
    }

    // Strict compliance check with Settings page academic calendar & off-days
    const terms = schoolProfile.academicYear?.terms || [];
    const termStarts = terms.map((t) => t.startDate).filter(Boolean).sort();
    const termEnds = terms.map((t) => t.endDate).filter(Boolean).sort();
    const yearStart = termStarts[0] || '2026-09-01';
    const yearEnd = termEnds[termEnds.length - 1] || '2027-06-24';

    if (absenceDate < yearStart || absenceDate > yearEnd) {
      throw new Error(`تاريخ الغياب (${absenceDate}) يقع خارج حدود العام الدراسي المعتمد (${yearStart} إلى ${yearEnd}) في صفحة الإعدادات.`);
    }

    const offCheck = isOffDay(absenceDate);
    if (offCheck.isOff) {
      throw new Error(`تاريخ الغياب (${absenceDate}) يوافق ${offCheck.reason} المعتمد في صفحة الإعدادات. لا يمكن تسجيل غياب في يوم إجازة رسمية.`);
    }

    const student = allStudents.find((s) => s.id === studentId);
    const newJust: Justification = {
      id: `just-${Date.now()}`,
      tenantId: tenantId,
      studentId,
      studentName: student?.fullName || 'طالب',
      guardianPhone: student?.guardianPhone || currentUser?.phone || '',
      className: student?.className || 'الفصل',
      absenceDate,
      reasonType,
      guardianExplanation,
      attachmentName: attachment?.name,
      attachmentMime: attachment?.mime,
      attachmentUrl: attachment?.base64,
      status: 'pending',
      aiAnalysis,
      submittedAt: new Date().toISOString(),
    };

    setAllJustifications((prev) => [newJust, ...prev]);

    // Persist justification to Firestore
    if (firebaseUser) {
      setDoc(doc(db, 'justifications', newJust.id), {
        tenantId: newJust.tenantId,
        studentId: newJust.studentId,
        studentName: newJust.studentName,
        guardianPhone: newJust.guardianPhone || null,
        className: newJust.className,
        absenceDate: newJust.absenceDate,
        reasonType: newJust.reasonType,
        guardianExplanation: newJust.guardianExplanation,
        status: newJust.status,
        attachmentName: newJust.attachmentName || null,
        attachmentMime: newJust.attachmentMime || null,
        attachmentUrl: newJust.attachmentUrl || null,
        aiAnalysis: newJust.aiAnalysis || null,
        submittedAt: newJust.submittedAt || null,
      }).catch((err) => {
        handleFirestoreError(err, OperationType.WRITE, `justifications/${newJust.id}`);
      });
    }

    // Also update student attendance record if a session exists for that date
    setAllSessions((prev) =>
      prev.map((sess) => {
        if (sess.date === absenceDate) {
          const recs = sess.records.map((r) => {
            if (r.studentId === studentId && (r.status === 'absent' || r.status === 'present')) {
              return { ...r, status: 'under_review' as AttendanceStatus, justificationId: newJust.id };
            }
            return r;
          });
          const updatedSess = { ...sess, records: recs };
          if (firebaseUser) {
            setDoc(doc(db, 'attendance_sessions', updatedSess.id), updatedSess, { merge: true }).catch((err) => {
              handleFirestoreError(err, OperationType.UPDATE, `attendance_sessions/${updatedSess.id}`);
            });
          }
          return updatedSess;
        }
        return sess;
      })
    );

    addAuditLog({
      entityType: 'justification',
      entityId: newJust.id,
      action: 'create',
      performerId: currentUser.id,
      performerName: currentUser.name,
      performerRole: currentUser.role,
      details: `تقديم عذر غياب جديد للطالب ${student?.fullName} بتاريخ ${absenceDate}`,
      detailsEn: `Submitting a new absence excuse for student ${student?.fullName} dated ${absenceDate}`,
    });

    return newJust;
  };

  const reviewJustification = (
    justificationId: string,
    status: 'approved' | 'rejected',
    notes: string
  ) => {
    if (!canReviewJustifications) {
      console.warn('Unauthorized: Only administrators and registrars can review justifications.');
      return;
    }
    const just = justifications.find((j) => j.id === justificationId);
    if (!just) return;

    const now = new Date().toISOString();

    setAllJustifications((prev) =>
      prev.map((j) =>
        j.id === justificationId
          ? {
              ...j,
              status,
              reviewerNotes: notes,
              reviewedBy: currentUser.name,
              reviewedAt: now,
            }
          : j
      )
    );

    // Persist the decision so it survives a reload and syncs across devices.
    if (firebaseUser) {
      void setDoc(
        doc(db, 'justifications', justificationId),
        toFirestoreData({
          tenantId: just.tenantId || tenantId,
          status,
          reviewerNotes: notes,
          reviewedBy: currentUser.name,
          reviewedAt: now,
          updatedAt: now,
        }),
        { merge: true }
      ).catch((error) => console.error('[JUSTIFICATIONS] Could not persist review decision:', error));
    }

    // Update affected attendance records
    setAllSessions((prev) =>
      prev.map((sess) => {
        if (sess.date === just.absenceDate) {
          const updatedRecs = sess.records.map((rec) => {
            if (rec.studentId === just.studentId) {
              return {
                ...rec,
                status: (status === 'approved' ? 'excused_absence' : 'rejected_excuse') as AttendanceStatus,
                note: `قرار اللجنة: ${status === 'approved' ? 'عذر معتمد' : 'عذر مرفوض'} - ${notes}`,
                updatedAt: now,
                updatedBy: currentUser.name,
              };
            }
            return rec;
          });
          return { ...sess, records: updatedRecs };
        }
        return sess;
      })
    );

    addAuditLog({
      entityType: 'justification',
      entityId: justificationId,
      action: 'update',
      performerId: currentUser.id,
      performerName: currentUser.name,
      performerRole: currentUser.role,
      details: `اعتماد قرار العذر للطالب ${just.studentName}: ${status === 'approved' ? 'موافقة وقبول العذر' : 'رفض العذر'}. ملاحظات: ${notes}`,
      detailsEn: `Excuse decision for student ${just.studentName}: ${status === 'approved' ? 'Excuse approved and accepted' : 'Excuse rejected'}. Notes: ${notes}`,
      previousValue: 'قيد المراجعة',
      newValue: status === 'approved' ? 'معتمد' : 'مرفوض',
    });

    // Notify parent if excuse approved and enabled
    if (status === 'approved' && settings.notifyOnExcuseApproved) {
      const student = students.find((s) => s.id === just.studentId);
      if (student) {
        const approvalNotif: NotificationOutboxItem = {
          id: `notif-appr-${Date.now()}-${just.id}`,
          tenantId: tenantId,
          recipientPhone: student.guardianPhone,
          recipientName: student.guardianName,
          studentId: student.id,
          studentName: student.fullName,
          absenceDate: just.absenceDate,
          sessionTitle: 'اعتماد عذر طبي',
          statusType: 'excused_absence',
          category: 'excuse_approved',
          messageText: `المكرم ولي أمر الطالب (${student.fullName}): تم قبول واعتماد العذر الطبي المقدم لغياب نجلكم بتاريخ ${just.absenceDate} رسمياً من قبل إدارة المدرسة.`,
          channel: settings.preferredChannel === 'WhatsApp' ? 'WhatsApp' : 'SMS',
          status: 'pending',
          retryCount: 0,
          createdAt: now,
        };
        setAllNotifications((prev) => [approvalNotif, ...prev]);
        if (firebaseUser) {
          setDoc(doc(db, 'notification_outbox', approvalNotif.id), {
            tenantId: approvalNotif.tenantId,
            recipientPhone: approvalNotif.recipientPhone,
            recipientName: approvalNotif.recipientName,
            studentName: approvalNotif.studentName,
            absenceDate: approvalNotif.absenceDate,
            messageText: approvalNotif.messageText,
            channel: approvalNotif.channel,
            status: approvalNotif.status,
            retryCount: approvalNotif.retryCount,
          }).catch((err) => {
            handleFirestoreError(err, OperationType.WRITE, `notification_outbox/${approvalNotif.id}`);
          });
        }
      }
    }
  };

  const updateJustificationAnalysis = (justificationId: string, aiAnalysis: any) => {
    setAllJustifications((prev) =>
      prev.map((j) => (j.id === justificationId ? { ...j, aiAnalysis } : j))
    );
  };

  const retryNotification = async (id: string): Promise<boolean> => {
    const target = allNotifications.find((n) => n.id === id);
    if (!target) return false;

    if (!canManageOutbox) {
      console.warn('Unauthorized: Notification dispatch requires administrator or registrar privileges.');
      return false;
    }

    try {
      const res = await authenticatedFetch('/api/notifications/dispatch', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tenantId,
          channel: target.channel,
          notifications: [target],
        }),
      });

      const resJson = res.ok ? await res.json() : null;
      if (!res.ok || !resJson) {
        const reason = resJson?.error || 'No messaging gateway is configured for this school.';
        setAllNotifications((prev) => {
          const updated = prev.map((n) =>
            n.id === id
              ? { ...n, status: 'failed' as const, retryCount: n.retryCount + 1, errorReason: reason }
              : n
          );
          if (typeof localCache !== 'undefined') {
            localCache.setItem('school_notifications', JSON.stringify(updated));
          }
          return updated;
        });
        return false;
      }

      const outcome = (resJson?.results?.find((r: any) => r.id === id) || resJson?.receipts?.[0] || null) as any;

      if (!outcome || outcome.status === 'manual') {
        // Nothing was transmitted (e.g. WhatsApp Web direct mode); the item stays queued.
        setAllNotifications((prev) => {
          const updated = prev.map((n) =>
            n.id === id
              ? { ...n, status: 'pending' as const, retryCount: n.retryCount + 1, errorReason: outcome?.errorReason }
              : n
          );
          if (typeof localCache !== 'undefined') {
            localCache.setItem('school_notifications', JSON.stringify(updated));
          }
          return updated;
        });
        return false;
      }

      if (outcome.status === 'failed') {
        setAllNotifications((prev) => {
          const updated = prev.map((n) =>
            n.id === id
              ? {
                  ...n,
                  status: 'failed' as const,
                  retryCount: n.retryCount + 1,
                  errorReason: outcome.errorReason || 'Gateway rejected the message.',
                }
              : n
          );
          if (typeof localCache !== 'undefined') {
            localCache.setItem('school_notifications', JSON.stringify(updated));
          }
          return updated;
        });
        return false;
      }

      const receipt = resJson?.receipts?.find((r: any) => r.id === id) || outcome;

      setAllNotifications((prev) => {
        const updated = prev.map((n) =>
          n.id === id
            ? {
                ...n,
                status: 'sent' as const,
                retryCount: n.retryCount + 1,
                sentAt: receipt?.sentAt || new Date().toISOString(),
                gatewayReceiptId: receipt?.gatewayReceiptId,
                gatewayProvider: receipt?.gatewayProvider,
                errorReason: undefined,
              }
            : n
        );
        if (typeof localCache !== 'undefined') {
          localCache.setItem('school_notifications', JSON.stringify(updated));
        }
        return updated;
      });

      addAuditLog({
        entityType: 'settings',
        entityId: target.id,
        action: 'update',
        performerId: currentUser.id,
        performerName: currentUser.name,
        performerRole: currentUser.role,
        details: `إعادة إرسال إشعار ولي الأمر عبر (${target.channel}) للطالب (${target.studentName}) - رقم الإيصال: ${receipt?.gatewayReceiptId || 'بدون إيصال'}.`,
        detailsEn: `Resending the guardian notification via (${target.channel}) for student (${target.studentName}) - Receipt number: ${receipt?.gatewayReceiptId || 'No receipt'}.`,
      });

      return true;
    } catch (err: any) {
      const reason = err?.message || 'Network error while dispatching the notification.';
      console.error('Notification retry failed:', err);
      setAllNotifications((prev) => {
        const updated = prev.map((n) =>
          n.id === id
            ? { ...n, status: 'failed' as const, retryCount: n.retryCount + 1, errorReason: reason }
            : n
        );
        if (typeof localCache !== 'undefined') {
          localCache.setItem('school_notifications', JSON.stringify(updated));
        }
        return updated;
      });
      return false;
    }
  };

  const retryAllFailedNotifications = async () => {
    if (!canManageOutbox) {
      console.warn('Unauthorized: Notification dispatch requires administrator or registrar privileges.');
      return;
    }

    const failedItems = allNotifications.filter((n) => n.tenantId === tenantId && n.status === 'failed');
    if (failedItems.length === 0) return;

    try {
      const res = await authenticatedFetch('/api/notifications/dispatch', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tenantId,
          notifications: failedItems,
        }),
      });

      const resJson = res.ok ? await res.json() : null;

      if (!res.ok || !resJson) {
        console.warn('Bulk notification retry aborted:', resJson?.error || `HTTP ${res.status}`);
        return;
      }

      const receiptMap = new Map<string, any>();
      if (Array.isArray(resJson?.receipts)) {
        for (const r of resJson.receipts) receiptMap.set(r.id, r);
      }
      const resultMap = new Map<string, any>();
      if (Array.isArray(resJson?.results)) {
        for (const r of resJson.results) resultMap.set(r.id, r);
      }

      const sentCount = failedItems.filter((n) => resultMap.get(n.id)?.status === 'sent').length;

      setAllNotifications((prev) => {
        const updated = prev.map((n) => {
          if (n.tenantId !== tenantId || n.status !== 'failed') return n;
          const outcome = resultMap.get(n.id) as any;
          if (!outcome || outcome.status === 'manual') {
            return { ...n, status: 'pending' as const, retryCount: n.retryCount + 1, errorReason: outcome?.errorReason };
          }
          if (outcome.status === 'failed') {
            return {
              ...n,
              status: 'failed' as const,
              retryCount: n.retryCount + 1,
              errorReason: outcome.errorReason || 'Gateway rejected the message.',
            };
          }
          const receipt = receiptMap.get(n.id) || outcome;
          return {
            ...n,
            status: 'sent' as const,
            retryCount: n.retryCount + 1,
            sentAt: receipt?.sentAt || new Date().toISOString(),
            gatewayReceiptId: receipt?.gatewayReceiptId,
            gatewayProvider: receipt?.gatewayProvider,
            errorReason: undefined,
          };
        });
        if (typeof localCache !== 'undefined') {
          localCache.setItem('school_notifications', JSON.stringify(updated));
        }
        return updated;
      });

      addAuditLog({
        entityType: 'settings',
        entityId: `bulk-retry-${tenantId}`,
        action: 'update',
        performerId: currentUser.id,
        performerName: currentUser.name,
        performerRole: currentUser.role,
        details: `إعادة محاولة إرسال الإشعارات المتعثرة (${failedItems.length} إشعار): تم إرسال ${sentCount} بنجاح عبر بوابة المشغل.`,
        detailsEn: `Retrying failed notifications (${failedItems.length} notifications): ${sentCount} sent successfully via the operator gateway.`,
      });
    } catch (err) {
      console.error('Bulk notification retry failed:', err);
    }
  };

  const sendCustomParentNotification = (params: {
    studentIds: string[];
    messageText: string;
    channel: 'SMS' | 'WhatsApp';
    category?: 'absence' | 'late' | 'warning' | 'broadcast' | 'excuse_approved';
    absenceDate?: string;
  }): number => {
    if (!canManageOutbox) {
      console.warn('Unauthorized: Notification dispatch requires administrator or registrar privileges.');
      return 0;
    }

    const now = new Date().toISOString();
    const newItems: NotificationOutboxItem[] = [];

    params.studentIds.forEach((sid) => {
      const std = students.find((s) => s.id === sid);
      if (std) {
        // Dynamic templated token replacements
        const formattedMsg = params.messageText
          .replace(/\{student_name\}/g, std.fullName)
          .replace(/\{guardian_name\}/g, std.guardianName)
          .replace(/\{class_name\}/g, std.className)
          .replace(/\{absences_count\}/g, String(std.totalAbsences || 0))
          .replace(/\{school_name\}/g, currentTenant.name);

        const isAbsenceNotice = params.category === 'absence' || params.category === 'warning';
        const sessionTitle =
          params.category === 'absence'
            ? 'تذكير غياب مدرسي'
            : params.category === 'warning'
            ? 'إنذار غياب رسمي'
            : params.category === 'late'
            ? 'تنبيه تأخر صباحي'
            : params.category === 'broadcast'
            ? 'تعميم مدرسي عام'
            : 'إشعار مخصص';

        const item: NotificationOutboxItem = {
          id: `notif-cust-${Date.now()}-${Math.floor(Math.random() * 1000)}-${std.id}`,
          tenantId,
          recipientPhone: std.guardianPhone,
          recipientName: std.guardianName,
          studentId: std.id,
          studentName: std.fullName,
          absenceDate: params.absenceDate || new Date().toISOString().split('T')[0],
          sessionTitle,
          statusType: isAbsenceNotice ? 'absent' : params.category === 'late' ? 'late' : 'present',
          category: params.category || 'broadcast',
          messageText: formattedMsg,
          channel: params.channel,
          status: 'pending',
          retryCount: 0,
          createdAt: now,
        };
        newItems.push(item);
      }
    });

    if (newItems.length > 0) {
      setAllNotifications((prev) => [...newItems, ...prev]);

      // Fire asynchronous backend gateway dispatch
      authenticatedFetch('/api/notifications/dispatch', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tenantId,
          channel: params.channel,
          notifications: newItems,
        }),
      })
        .then((res) => (res.ok ? res.json() : null))
        .then((data) => {
          const newIds = new Set(newItems.map((item) => item.id));
          if (!data) {
            setAllNotifications((prev) =>
              prev.map((item) =>
                newIds.has(item.id)
                  ? { ...item, status: 'failed' as const, errorReason: 'No messaging gateway is configured for this school.' }
                  : item
              )
            );
            return;
          }

          const receiptMap = new Map<string, any>();
          if (Array.isArray(data?.receipts)) {
            data.receipts.forEach((r: any) => receiptMap.set(r.id, r));
          }
          const resultMap = new Map<string, any>();
          if (Array.isArray(data?.results)) {
            data.results.forEach((r: any) => resultMap.set(r.id, r));
          }

          setAllNotifications((prev) =>
            prev.map((item) => {
              if (!newIds.has(item.id)) return item;
              const outcome = resultMap.get(item.id) as any;
              if (!outcome || outcome.status === 'manual') {
                return { ...item, status: 'pending' as const, errorReason: outcome?.errorReason };
              }
              if (outcome.status === 'failed') {
                return {
                  ...item,
                  status: 'failed' as const,
                  errorReason: outcome.errorReason || 'Gateway rejected the message.',
                };
              }
              const receipt = receiptMap.get(item.id) || outcome;
              return {
                ...item,
                status: 'sent' as const,
                gatewayReceiptId: receipt?.gatewayReceiptId,
                gatewayProvider: receipt?.gatewayProvider,
                sentAt: receipt?.sentAt || new Date().toISOString(),
                errorReason: undefined,
              };
            })
          );
        })
        .catch((err) => {
          console.error('Backend notification dispatch failed:', err);
          const newIds = new Set(newItems.map((item) => item.id));
          setAllNotifications((prev) =>
            prev.map((item) =>
              newIds.has(item.id)
                ? { ...item, status: 'failed' as const, errorReason: 'Network error while contacting the messaging gateway.' }
                : item
            )
          );
        });

      if (firebaseUser) {
        newItems.forEach((n) => {
          setDoc(doc(db, 'notification_outbox', n.id), {
            tenantId: n.tenantId,
            recipientPhone: n.recipientPhone,
            recipientName: n.recipientName,
            studentName: n.studentName,
            absenceDate: n.absenceDate,
            messageText: n.messageText,
            channel: n.channel,
            status: n.status,
            retryCount: n.retryCount,
            gatewayReceiptId: n.gatewayReceiptId,
            gatewayProvider: n.gatewayProvider,
          }).catch((err) => {
            handleFirestoreError(err, OperationType.WRITE, `notification_outbox/${n.id}`);
          });
        });
      }

      addAuditLog({
        entityType: 'settings',
        entityId: `broadcast-${Date.now()}`,
        action: 'create',
        performerId: currentUser.id,
        performerName: currentUser.name,
        performerRole: currentUser.role,
        details: `إرسال وبث رسائل مخصصة لأولياء الأمور: تم إدراج ${newItems.length} رسالة في الطابور عبر (${params.channel}).`,
        detailsEn: `Sending and broadcasting custom messages to guardians: ${newItems.length} messages were queued via (${params.channel}).`,
      });
    }

    return newItems.length;
  };

  const sendChronicWarningNotification = (studentId: string, warningTier: number): boolean => {
    const std = students.find((s) => s.id === studentId);
    if (!std) return false;

    const tierLabels: Record<number, string> = {
      1: 'الإنذار الأكاديمي الأول (3 أيام غياب)',
      2: 'الإنذار الأكاديمي الثاني واستدعاء ولي الأمر (5 أيام غياب)',
      3: 'إشعار حرمان وتوجيه وزاري (7+ أيام غياب)',
    };

    const tierLabel = tierLabels[warningTier] || `إنذار غياب رسمي (${std.totalAbsences} أيام)`;
    const now = new Date().toISOString();
    const today = now.split('T')[0];

    const template = settings.warningMessageTemplate || 'إشعار رسمي: المكرم ولي أمر الطالب ({student_name})، نظراً لتجاوز أيام الغياب غير المبررة الحد المسموح، نأمل مراجعة إدارة المدرسة عاجلاً.';
    const message = template
      .replace('{student_name}', std.fullName)
      .concat(` [المستوى: ${tierLabel}]`);

    const warningItem: NotificationOutboxItem = {
      id: `notif-warn-${Date.now()}-${std.id}`,
      tenantId,
      recipientPhone: std.guardianPhone,
      recipientName: std.guardianName,
      studentId: std.id,
      studentName: std.fullName,
      absenceDate: today,
      sessionTitle: tierLabel,
      statusType: 'absent',
      category: 'warning',
      messageText: message,
      channel: settings.preferredChannel === 'WhatsApp' ? 'WhatsApp' : 'SMS',
      status: 'pending',
      retryCount: 0,
      createdAt: now,
    };

    setAllNotifications((prev) => [warningItem, ...prev]);

    if (firebaseUser) {
      setDoc(doc(db, 'notification_outbox', warningItem.id), {
        tenantId: warningItem.tenantId,
        recipientPhone: warningItem.recipientPhone,
        recipientName: warningItem.recipientName,
        studentName: warningItem.studentName,
        absenceDate: warningItem.absenceDate,
        messageText: warningItem.messageText,
        channel: warningItem.channel,
        status: warningItem.status,
        retryCount: warningItem.retryCount,
      }).catch((err) => {
        handleFirestoreError(err, OperationType.WRITE, `notification_outbox/${warningItem.id}`);
      });
    }

    addAuditLog({
      entityType: 'student',
      entityId: std.id,
      action: 'create',
      performerId: currentUser.id,
      performerName: currentUser.name,
      performerRole: currentUser.role,
      details: `إرسال إنذار غياب تراكمي لولي أمر الطالب ${std.fullName}: ${tierLabel}.`,
      detailsEn: `Sending a cumulative absence warning to the guardian of student ${std.fullName}: ${tierLabel}.`,
    });

    return true;
  };

  const sendAllChronicWarningNotifications = (tierThreshold = 3): number => {
    const eligibleStudents = students.filter((s) => s.totalAbsences >= tierThreshold);
    let sent = 0;
    eligibleStudents.forEach((s) => {
      const tier = s.totalAbsences >= 7 ? 3 : s.totalAbsences >= 5 ? 2 : 1;
      if (sendChronicWarningNotification(s.id, tier)) {
        sent++;
      }
    });
    return sent;
  };

  const persistStudent = (student: Student) => {
    if (!firebaseUser) return;
    void setDoc(doc(db, 'students', student.id), toFirestoreData(student), { merge: true }).catch((error) =>
      console.error('[STUDENTS] Could not persist student:', error)
    );
  };

  const persistStudentPatch = (studentId: string, updates: Partial<Student>) => {
    if (!firebaseUser) return;
    void setDoc(doc(db, 'students', studentId), toFirestoreData(updates), { merge: true }).catch((error) =>
      console.error('[STUDENTS] Could not update student:', error)
    );
  };
  const importStudents = (newStudentsList: Partial<Student>[]) => {
    if (!canImportStudents) {
      console.warn('Unauthorized: Student import requires administrator or registrar privileges.');
      return { imported: 0, duplicates: 0 };
    }
    let imported = 0;
    let duplicates = 0;

    const existingNatIds = new Set(students.map((s) => s.nationalId));
    const existingStdNums = new Set(students.map((s) => s.studentNumber));

    const approvedClasses = (schoolProfile?.classes || []).map((c) => ({
      name: c.name.trim(),
      normalized: c.name.replace(/\s+/g, '').toLowerCase(),
      grade: c.grade.trim(),
      id: c.id,
    }));

    const additions: Student[] = [];

    newStudentsList.forEach((raw, i) => {
      const nationalId = raw.nationalId?.trim() || `1099${Date.now() + i}`;
      const studentNumber = raw.studentNumber?.trim() || `2026${Date.now() + i}`;

      if (existingNatIds.has(nationalId) || existingStdNums.has(studentNumber)) {
        duplicates++;
        return;
      }

      const rawClass = (raw.className || '').trim();
      const normalizedClass = rawClass.replace(/\s+/g, '').toLowerCase();
      const matchedClass = approvedClasses.find(
        (c) => c.normalized === normalizedClass || c.name === rawClass
      );

      // Enforce strict Settings compliance: reject students with classes not in Settings
      if (!matchedClass && approvedClasses.length > 0) {
        duplicates++;
        return;
      }

      existingNatIds.add(nationalId);
      existingStdNums.add(studentNumber);

      additions.push({
        id: `std-imp-${Date.now()}-${i}`,
        tenantId: tenantId,
        studentNumber,
        nationalId,
        fullName: raw.fullName?.trim() || `طالب جديد ${i + 1}`,
        grade: matchedClass ? matchedClass.grade : (raw.grade?.trim() || 'الصف العاشر'),
        className: matchedClass ? matchedClass.name : (rawClass || '10 / أ'),
        classId: matchedClass ? matchedClass.id : (raw.classId?.trim() || 'class-1a'),
        guardianName: raw.guardianName?.trim() || 'ولي أمر معتمد',
        guardianPhone: raw.guardianPhone?.trim() || '',
        guardianRelationship: raw.guardianRelationship || '',
        bloodType: raw.bloodType || '',
        totalAbsences: 0,
        totalLates: 0,
        attendanceRate: 100,
      });
      imported++;
    });

    if (additions.length > 0) {
      setAllStudents((prev) => [...prev, ...additions]);
      additions.forEach(persistStudent);
      addAuditLog({
        entityType: 'student',
        entityId: `bulk-import-${Date.now()}`,
        action: 'create',
        performerId: currentUser.id,
        performerName: currentUser.name,
        performerRole: currentUser.role,
        details: `استيراد معتمد لقائمة الطلاب: نجح استيراد ${imported} طالب جديد، وتم استبعاد ${duplicates} سجل مكرر لمنع ازدواجية البيانات.`,
        detailsEn: `Approved student list import: ${imported} new students imported successfully, and ${duplicates} duplicate records were excluded to prevent data duplication.`,
      });
    }

    return { imported, duplicates };
  };

  const addStudent = (
    studentData: Omit<Student, 'id' | 'tenantId' | 'attendanceRate' | 'totalAbsences' | 'totalLates'>
  ): Student => {
    const id = `std-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
    const newStudent: Student = {
      ...studentData,
      id,
      tenantId,
      totalAbsences: 0,
      totalLates: 0,
      attendanceRate: 100,
      enrollmentStatus: studentData.enrollmentStatus || 'active',
    };

    setAllStudents((prev) => {
      const updated = [newStudent, ...prev];
      if (typeof localCache !== 'undefined') {
        localCache.setItem('school_students', JSON.stringify(updated));
      }
      return updated;
    });

    persistStudent(newStudent);

    addAuditLog({
      action: 'create',
      entityType: 'student',
      entityId: id,
      performerId: currentUser.id,
      performerRole: currentUserRole,
      performerName: currentUser.name,
      details: `إضافة قيد طالب جديد (${newStudent.fullName} - فصل ${newStudent.className}) بدون الحاجة لإعادة رفع القوائم.`,
      detailsEn: `Adding a new student record (${newStudent.fullName} - Class ${newStudent.className}) without needing to re-upload the lists.`,
    });

    return newStudent;
  };

  const updateStudent = (studentId: string, updates: Partial<Student>) => {
    persistStudentPatch(studentId, updates);
    setAllStudents((prev) => {
      const updated = prev.map((s) =>
        s.id === studentId && s.tenantId === tenantId ? { ...s, ...updates } : s
      );
      if (typeof localCache !== 'undefined') {
        localCache.setItem('school_students', JSON.stringify(updated));
      }
      return updated;
    });

    addAuditLog({
      action: 'update',
      entityType: 'student',
      entityId: studentId,
      performerId: currentUser.id,
      performerRole: currentUserRole,
      performerName: currentUser.name,
      details: `تحديث بيانات الطالب (${updates.fullName || studentId}) في السجل المدرسي`,
      detailsEn: `Updating student data (${updates.fullName || studentId}) in the school record`,
    });
  };

  const transferStudent = (
    studentId: string,
    details: { destinationSchool: string; reason?: string }
  ) => {
    const target = allStudents.find((s) => s.id === studentId && s.tenantId === tenantId);
    if (!target) return;
    persistStudentPatch(studentId, {
      enrollmentStatus: 'transferred',
      transferredAt: new Date().toISOString(),
      destinationSchool: details.destinationSchool,
      transferReason: details.reason || 'نقل رسمي إلى مدرسة أخرى',
    });

    const now = new Date().toISOString();
    setAllStudents((prev) => {
      const updated = prev.map((s) =>
        s.id === studentId && s.tenantId === tenantId
          ? {
              ...s,
              enrollmentStatus: 'transferred' as StudentEnrollmentStatus,
              transferredAt: now,
              destinationSchool: details.destinationSchool,
              transferReason: details.reason || 'نقل رسمي إلى مدرسة أخرى',
            }
          : s
      );
      if (typeof localCache !== 'undefined') {
        localCache.setItem('school_students', JSON.stringify(updated));
      }
      return updated;
    });

    addAuditLog({
      action: 'update',
      entityType: 'student',
      entityId: studentId,
      performerId: currentUser.id,
      performerRole: currentUserRole,
      performerName: currentUser.name,
      details: `نقل رسمي للطالب (${target.fullName}) إلى (${details.destinationSchool}). تم إخفاء الطالب من كشوف الحضور اليومية مع حفظ بياناته في أرشيف النقل.`,
      detailsEn: `Official transfer of student (${target.fullName}) to (${details.destinationSchool}). The student was hidden from daily attendance sheets while their data was preserved in the transfer archive.`,
    });
  };

  const restoreStudent = (studentId: string) => {
    const target = allStudents.find((s) => s.id === studentId && s.tenantId === tenantId);
    if (!target) return;
    persistStudentPatch(studentId, {
      enrollmentStatus: 'active',
      transferredAt: undefined,
      destinationSchool: undefined,
      transferReason: undefined,
    });

    setAllStudents((prev) => {
      const updated = prev.map((s) =>
        s.id === studentId && s.tenantId === tenantId
          ? {
              ...s,
              enrollmentStatus: 'active' as StudentEnrollmentStatus,
              transferredAt: undefined,
              destinationSchool: undefined,
              transferReason: undefined,
            }
          : s
      );
      if (typeof localCache !== 'undefined') {
        localCache.setItem('school_students', JSON.stringify(updated));
      }
      return updated;
    });

    addAuditLog({
      action: 'update',
      entityType: 'student',
      entityId: studentId,
      performerId: currentUser.id,
      performerRole: currentUserRole,
      performerName: currentUser.name,
      details: `إلغاء إجراء النقل واستعادة قيد الطالب (${target.fullName}) إلى مقاعد الدراسة النشطة.`,
      detailsEn: `Cancelling the transfer and restoring student (${target.fullName}) to active enrollment.`,
    });
  };

  const deleteStudent = (studentId: string): { success: boolean; message: string } => {
    const target = allStudents.find((s) => s.id === studentId && s.tenantId === tenantId);
    if (!target) {
      return { success: false, message: 'الطالب غير موجود' };
    }

    if (firebaseUser) {
      void deleteDoc(doc(db, 'students', studentId)).catch((error) =>
        console.error('[STUDENTS] Could not delete student:', error)
      );
    }

    setAllStudents((prev) => {
      const updated = prev.filter((s) => s.id !== studentId);
      if (typeof localCache !== 'undefined') {
        localCache.setItem('school_students', JSON.stringify(updated));
      }
      return updated;
    });

    addAuditLog({
      action: 'delete',
      entityType: 'student',
      entityId: studentId,
      performerId: currentUser.id,
      performerRole: currentUserRole,
      performerName: currentUser.name,
      details: `حذف نهائي لسجل الطالب (${target.fullName} - سجل مدني ${target.nationalId}) من المدرسة.`,
      detailsEn: `Permanent deletion of the student record (${target.fullName} - Civil ID ${target.nationalId}) from the school.`,
    });

    return { success: true, message: 'تم حذف سجل الطالب نهائياً' };
  };

  const updateSettings = (newSettings: Partial<SchoolSettings>) => {
    if (!canManageSettings) {
      console.warn('Unauthorized: Only school administrators can update school settings.');
      return;
    }
    setSettingsMap((prev) => {
      const updated = {
        ...prev,
        [tenantId]: {
          ...prev[tenantId],
          ...newSettings,
        },
      };
      if (typeof localCache !== 'undefined') {
        localCache.setItem('school_settings', JSON.stringify(updated));
      }
      return updated;
    });

    addAuditLog({
      entityType: 'settings',
      entityId: `settings-${tenantId}`,
      action: 'update',
      performerId: currentUser.id,
      performerName: currentUser.name,
      performerRole: currentUser.role,
      details: 'تحديث قواعد وإعدادات المدرسة (حدود الغياب والتأخر وإشعارات الرسائل).',
      detailsEn: 'Updating school rules and settings (absence and late thresholds and message notifications).',
    });
  };

  const updateSchoolProfile = async (newProfile: Partial<TenantSchoolProfile>): Promise<void> => {
    if (!canManageSettings) {
      console.warn('Unauthorized: Only school administrators can update the school profile.');
      return;
    }
    setSchoolProfilesMap((prev) => {
      const current = prev[tenantId] || getDefaultSchoolProfile(tenantId);
      const updated: TenantSchoolProfile = {
        ...current,
        ...newProfile,
        countryCallingCode:
          newProfile.countryCallingCode ||
          newProfile.address?.countryCallingCode ||
          current.countryCallingCode ||
          current.address?.countryCallingCode ||
          '+966',
        address: {
          ...current.address,
          ...(newProfile.address || {}),
          countryCallingCode:
            newProfile.address?.countryCallingCode ||
            newProfile.countryCallingCode ||
            current.address?.countryCallingCode ||
            current.countryCallingCode ||
            '+966',
        },
        leadership: {
          ...current.leadership,
          ...(newProfile.leadership || {}),
        },
        academicYear: {
          ...current.academicYear,
          ...(newProfile.academicYear || {}),
        },
        timetablePeriods: newProfile.timetablePeriods || current.timetablePeriods,
        educationalGrades: newProfile.educationalGrades || current.educationalGrades,
        classes: newProfile.classes || current.classes,
        subjects: newProfile.subjects || current.subjects,
        assemblyPoints: newProfile.assemblyPoints || current.assemblyPoints,
        messagingGateway: isSuperAdmin
          ? (newProfile.messagingGateway || current.messagingGateway)
          : current.messagingGateway,
      };
      if (typeof localCache !== 'undefined') {
        localCache.setItem(
          'tenant_school_profiles',
          JSON.stringify({
            ...prev,
            [tenantId]: updated,
          })
        );
      }
      return {
        ...prev,
        [tenantId]: updated,
      };
    });

    addAuditLog({
      entityType: 'settings',
      entityId: `school-profile-${tenantId}`,
      action: 'update',
      performerId: currentUser.id,
      performerName: currentUser.name,
      performerRole: currentUser.role,
      details: 'تحديث بيانات المدرسة الرسمية، القيادة المدرسية، التقويم الدراسي، ونقاط التجمع للطوارئ.',
      detailsEn: 'Updating official school data, school leadership, academic calendar, and emergency assembly points.',
    });
  };

  const updateMessagingGateway = (
    config: Partial<SchoolMessagingGatewayConfig>
  ): { success: boolean; message: string } => {
    if (!isSuperAdmin) {
      const errorMsg = 'عذراً، صلاحية ضبط وتعديل بوابات الرسائل والواتساب محصورة بمالك المنصة (The Owner) فقط.';
      console.warn(errorMsg);
      return { success: false, message: errorMsg };
    }

    const currentGw =
      schoolProfile.messagingGateway ||
      settings.messagingGateway || {
        whatsappPhoneNumber: '',
        whatsappServiceMode: 'web_direct',
        smsProvider: 'taqnyat',
        smsSenderId: '',
        enableWhatsAppNotifications: false,
        enableSmsNotifications: false,
      };

    const updatedGateway: SchoolMessagingGatewayConfig = {
      ...currentGw,
      ...config,
      lastConfiguredByRole: 'super_admin',
      lastConfiguredByEmail: currentUser?.email,
      lastConfiguredAt: new Date().toISOString(),
    };

    // 1. Update in SchoolProfilesMap
    setSchoolProfilesMap((prev) => {
      const current = prev[tenantId] || getDefaultSchoolProfile(tenantId);
      const updatedProfile = {
        ...current,
        messagingGateway: updatedGateway,
      };
      if (typeof localCache !== 'undefined') {
        localCache.setItem(
          'tenant_school_profiles',
          JSON.stringify({
            ...prev,
            [tenantId]: updatedProfile,
          })
        );
      }
      return {
        ...prev,
        [tenantId]: updatedProfile,
      };
    });

    // 2. Update in SettingsMap
    setSettingsMap((prev) => {
      const current = prev[tenantId] || getDefaultSchoolSettings(tenantId);
      const updatedSettings = {
        ...current,
        messagingGateway: updatedGateway,
      };
      if (typeof localCache !== 'undefined') {
        localCache.setItem(
          'school_settings',
          JSON.stringify({
            ...prev,
            [tenantId]: updatedSettings,
          })
        );
      }
      return {
        ...prev,
        [tenantId]: updatedSettings,
      };
    });

    // 3. Log audit event
    addAuditLog({
      entityType: 'settings',
      entityId: `gateway-${tenantId}`,
      action: 'update',
      performerId: currentUser.id,
      performerName: currentUser.name,
      performerRole: currentUser.role,
      details: `تحديث بيانات وبوابات المراسلة والواتساب (رقم الواتساب: ${updatedGateway.whatsappPhoneNumber}، وضع الخدمة: ${updatedGateway.whatsappServiceMode}، مزود SMS: ${updatedGateway.smsProvider}) بواسطة مالك المنصة.`,
      detailsEn: `Updating messaging and WhatsApp gateway data (WhatsApp number: ${updatedGateway.whatsappPhoneNumber}, service mode: ${updatedGateway.whatsappServiceMode}, SMS provider: ${updatedGateway.smsProvider}) by the platform owner.`,
    });

    return {
      success: true,
      message: 'تم حفظ وتفعيل بوابات المراسلة والواتساب للمدرسة بنجاح من قبل مالك المنصة.',
    };
  };

  const updateDigestConfig = (cfg: Partial<DailyEmailDigestConfig>) => {
    setDigestConfig((prev) => {
      const updated = { ...prev, ...cfg };
      addAuditLog({
        entityType: 'settings',
        entityId: `digest-config-${tenantId}`,
        action: 'update',
        performerId: currentUser.id,
        performerName: currentUser.name,
        performerRole: currentUser.role,
        details: `تحديث إعدادات النشرة الصباحية اليومية (وقت الإرسال: ${updated.scheduledTime} ص، حالة التفعيل: ${updated.enabled ? 'مفعلة' : 'معطلة'}، عدد المستلمين: ${updated.recipients.length}).`,
        detailsEn: `Updating daily morning digest settings (send time: ${updated.scheduledTime} AM, activation status: ${updated.enabled ? 'Enabled' : 'Disabled'}, number of recipients: ${updated.recipients.length}).`,
      });
      return updated;
    });
  };

  const generateCurrentDigest = async (
    customConfig?: Partial<DailyEmailDigestConfig>
  ): Promise<DailyEmailDigestItem> => {
    const effectiveConfig = { ...digestConfig, ...(customConfig || {}) };
    const baseData = computeDailyDigestData({
      tenantId,
      tenantName: currentTenant.name,
      students,
      sessions,
      justifications,
      config: effectiveConfig,
    });

    let geminiBriefing: any = undefined;
    if (effectiveConfig.includeGeminiBriefing) {
      try {
        const res = await authenticatedFetch('/api/daily-digest/generate-briefing', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            tenantName: currentTenant.name,
            date: baseData.date,
            overallAttendanceRate: baseData.overallAttendanceRate,
            totalStudents: baseData.totalStudents,
            anomalies: baseData.anomalies,
            pendingJustificationsCount: baseData.pendingJustificationsCount,
            pendingIrregularCount: baseData.pendingJustifications.filter(
              (j) => j.aiRiskLevel === 'high' || j.aiVerificationStatus === 'irregular'
            ).length,
            highRiskStudents: baseData.highRiskStudents,
          }),
        });
        if (res.ok) {
          const json = await res.json();
          if (json.briefing) {
            geminiBriefing = json.briefing;
          }
        }
      } catch (err) {
        console.warn('Gemini briefing generation fallback:', err);
      }
    }

    // When the AI briefing is requested but unavailable, the digest is sent with
    // the real attendance data only — no fabricated briefing is injected.

    const digestItem: DailyEmailDigestItem = {
      ...baseData,
      id: `digest-${Date.now()}`,
      dispatchedAt: new Date().toISOString(),
      status: 'scheduled',
      geminiBriefing,
    };

    digestItem.htmlContent = generateHtmlEmailTemplate(digestItem, currentTenant.name);
    return digestItem;
  };

  const dispatchDailyDigest = async (
    digestId?: string,
    targetRecipients?: string[]
  ): Promise<{ success: boolean; message: string; digestItem: DailyEmailDigestItem }> => {
    if (!canDispatchDigest) {
      throw new Error('Unauthorized: Daily digest dispatch requires administrator or registrar privileges.');
    }
    // Generate fresh digest
    const digest = await generateCurrentDigest();
    const effectiveRecipients = targetRecipients && targetRecipients.length > 0 ? targetRecipients : digest.recipients;

    try {
      const res = await authenticatedFetch('/api/daily-digest/dispatch', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          recipients: effectiveRecipients,
          subject: digest.subject,
          htmlContent: digest.htmlContent,
          scheduledTime: digest.scheduledTime,
          digestId: digest.id,
        }),
      });

      const resJson = res.ok ? await res.json() : null;

      if (!res.ok || !resJson) {
        const reason = resJson?.error || `The email transport rejected the daily digest (HTTP ${res.status}).`;
        const failedDigest: DailyEmailDigestItem = {
          ...digest,
          status: 'failed',
          dispatchedAt: new Date().toISOString(),
          recipients: effectiveRecipients,
        };
        setDigestHistory((prev) => [failedDigest, ...prev.slice(0, 49)]);
        addAuditLog({
          entityType: 'settings',
          entityId: failedDigest.id,
          action: 'submit',
          performerId: currentUser.id,
          performerName: currentUser.name,
          performerRole: currentUser.role,
          details: `فشل إرسال النشرة الصباحية اليومية إلى قيادات المدرسة (${effectiveRecipients.length} مستلم): ${reason}`,
          detailsEn: `Failed to send the daily morning digest to school leadership (${effectiveRecipients.length} recipients): ${reason}`,
        });
        return { success: false, message: reason, digestItem: failedDigest };
      }

      const dispatchedDigest: DailyEmailDigestItem = {
        ...digest,
        status: 'delivered',
        dispatchedAt: resJson.dispatchedAt || new Date().toISOString(),
        recipients: effectiveRecipients,
      };

      setDigestHistory((prev) => [dispatchedDigest, ...prev.slice(0, 49)]);
      setDigestConfig((prev) => ({
        ...prev,
        lastDispatchedAt: dispatchedDigest.dispatchedAt,
        lastDigestId: dispatchedDigest.id,
      }));

      addAuditLog({
        entityType: 'settings',
        entityId: dispatchedDigest.id,
        action: 'submit',
        performerId: currentUser.id,
        performerName: currentUser.name,
        performerRole: currentUser.role,
        details: `إرسال النشرة الصباحية اليومية إلى قيادات المدرسة (${effectiveRecipients.length} مستلم) متضمنة ${digest.anomaliesCount} شذوذات و${digest.pendingJustificationsCount} أعذار معلقة و${digest.highRiskStudentsCount} طلاب في النطاق الحرج.`,
        detailsEn: `Sending the daily morning digest to school leadership (${effectiveRecipients.length} recipients) including ${digest.anomaliesCount} anomalies, ${digest.pendingJustificationsCount} pending excuses, and ${digest.highRiskStudentsCount} students in the critical range.`,
      });

      return {
        success: true,
        message: resJson.message || `تم إرسال النشرة الصباحية بنجاح إلى ${effectiveRecipients.length} من قيادات المدرسة.`,
        digestItem: dispatchedDigest,
      };
    } catch (err: any) {
      const reason = err?.message || 'Network error while dispatching the daily digest.';
      console.error('Failed to dispatch digest:', err);
      const failedDigest: DailyEmailDigestItem = {
        ...digest,
        status: 'failed',
        dispatchedAt: new Date().toISOString(),
        recipients: effectiveRecipients,
      };
      setDigestHistory((prev) => [failedDigest, ...prev.slice(0, 49)]);

      addAuditLog({
        entityType: 'settings',
        entityId: failedDigest.id,
        action: 'submit',
        performerId: currentUser.id,
        performerName: currentUser.name,
        performerRole: currentUser.role,
        details: `فشل إرسال النشرة الصباحية اليومية إلى قيادات المدرسة (${effectiveRecipients.length} مستلم): ${reason}`,
        detailsEn: `Failed to send the daily morning digest to school leadership (${effectiveRecipients.length} recipients): ${reason}`,
      });

      return {
        success: false,
        message: `فشل إرسال النشرة الصباحية: ${reason}`,
        digestItem: failedDigest,
      };
    }
  };

  const provisionNewSchool = async (
    input: SchoolProvisionInput
  ): Promise<{
    success: boolean;
    message: string;
    tenantId: string;
    principalEmail?: string;
    temporaryPassword?: string;
  }> => {
    try {
      const trimmedId = input.id.trim();
      const trimmedSubdomain = input.subdomain.trim().toLowerCase();

      // Check for conflict
      const activeRegistry = getActiveTenantRegistry();
      if (activeRegistry[trimmedId]) {
        return {
          success: false,
          message: `معرّف المدرسة (${trimmedId}) مسجل مسبقاً في المنصة.`,
          tenantId: trimmedId,
        };
      }
      const existingSubdomains = Object.values(activeRegistry).map((c) => c.subdomain.toLowerCase());
      if (existingSubdomains.includes(trimmedSubdomain)) {
        return {
          success: false,
          message: `النطاق الفرعي (${trimmedSubdomain}) محجوز مسبقاً لمدرسة أخرى.`,
          tenantId: trimmedId,
        };
      }

      // 1. Create TenantDomainConfig
      const newDomainConfig: TenantDomainConfig = {
        tenantId: trimmedId,
        subdomain: trimmedSubdomain,
        customDomains: input.customDomains && input.customDomains.length > 0
          ? input.customDomains
          : [
              `portal.${trimmedSubdomain}.edu`,
              `attendance.${trimmedSubdomain}-school.edu.sa`,
              `${trimmedSubdomain}.smartschool.com`,
              `${trimmedSubdomain}.localhost`,
            ],
        nameAr: input.nameAr.trim(),
        nameEn: input.nameEn.trim(),
        code: input.code.trim().toUpperCase(),
        cityAr: input.cityAr.trim(),
        cityEn: input.cityEn.trim(),
        academicYear: input.academicYear.trim(),
        currentTerm: 'الفصل الدراسي الأول',
        schoolType: input.schoolType,
        primaryColor: input.primaryColor || '#059669',
        logoText: input.logoText.trim() || input.nameAr.trim().charAt(0) || 'م',
        isActive: true,
      };

      // 2. Persist dynamic tenant
      const updatedDynamic = [...dynamicTenants.filter((d) => d.tenantId !== trimmedId), newDomainConfig];
      setDynamicTenants(updatedDynamic);
      if (typeof localCache !== 'undefined') {
        localCache.setItem('school_dynamic_tenants', JSON.stringify(updatedDynamic));
      }

      // 3. Create TenantSchoolProfile
      const defaultProfile = getDefaultSchoolProfile(trimmedId);
      const chosenCountry = input.countryAr?.trim() || defaultProfile.address?.country || 'المملكة العربية السعودية';
      const chosenDialCode = input.countryCallingCode?.trim() || defaultProfile.countryCallingCode || '+966';

      const newProfile: TenantSchoolProfile = {
        ...defaultProfile,
        tenantId: trimmedId,
        schoolName: input.nameAr.trim(),
        schoolCode: input.code.trim().toUpperCase(),
        genderType: input.schoolType,
        officialEmail: input.principalEmail.trim().toLowerCase(),
        countryCallingCode: chosenDialCode,
        generalPhone: input.principalPhone?.trim() || `${chosenDialCode}500000000`,
        websiteUrl: `https://${trimmedSubdomain}.smartschool.com`,
        address: {
          ...defaultProfile.address,
          country: chosenCountry,
          countryCallingCode: chosenDialCode,
          city: input.cityAr.trim(),
          district: 'حي النرجس',
          streetAddress: 'طريق الملك فهد',
        },
        leadership: {
          ...defaultProfile.leadership,
          principalName: input.principalName.trim(),
          principalEmail: input.principalEmail.trim().toLowerCase(),
          principalPhone: input.principalPhone?.trim() || `${chosenDialCode}500000000`,
        },
        academicYear: {
          ...defaultProfile.academicYear,
          hijriYear: input.academicYear.trim(),
        },
      };

      setSchoolProfilesMap((prev) => {
        const next = { ...prev, [trimmedId]: newProfile };
        if (typeof localCache !== 'undefined') {
          localCache.setItem('tenant_school_profiles', JSON.stringify(next));
        }
        return next;
      });

      // 4. Create default SchoolSettings
      setSettingsMap((prev) => {
        const next = {
          ...prev,
          [trimmedId]: {
            ...getDefaultSchoolSettings(tenantId),
            schoolName: input.nameAr.trim(),
          },
        };
        if (typeof localCache !== 'undefined') {
          localCache.setItem('school_settings', JSON.stringify(next));
        }
        return next;
      });

      // 5. Persist to the server (Firestore) and create the principal's login so
      //    the school is reachable from any device/subdomain immediately.
      let temporaryPassword: string | undefined;
      let principalCreationWarning: string | null = null;
      try {
        const response = await authenticatedFetch('/api/tenants/provision', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            ...newDomainConfig,
            principal: {
              name: input.principalName.trim(),
              email: input.principalEmail.trim().toLowerCase(),
              phone: input.principalPhone?.trim() || '',
              password: input.principalPassword,
            },
            schoolProfile: newProfile,
            settings: {
              ...getDefaultSchoolSettings(tenantId),
              schoolName: input.nameAr.trim(),
            },
          }),
        });

        const payload = await response.json().catch(() => null);
        if (!response.ok || !payload?.success) {
          return {
            success: false,
            message: payload?.error || 'فشل حفظ بيانات المدرسة على الخادم. تحقق من الصلاحيات وحاول مجدداً.',
            tenantId: trimmedId,
          };
        }
        temporaryPassword = payload.principal?.temporaryPassword;
      } catch (syncErr: any) {
        console.warn('Could not sync dynamic tenant to server:', syncErr);
        principalCreationWarning = syncErr?.message || 'تعذّر الاتصال بخادم الحسابات';
      }

      // 6. Create Principal user profile
      const principalUser: UserProfile = {
        id: `user-admin-${trimmedId}`,
        tenantId: trimmedId,
        name: input.principalName.trim(),
        role: 'admin',
        email: input.principalEmail.trim().toLowerCase(),
        phone: input.principalPhone?.trim() || '',
        jobTitle: 'مدير المدرسة (School Principal)',
        status: 'active',
      };

      setAllUsers((prev) => {
        const filtered = prev.filter((u) => u.email.toLowerCase() !== principalUser.email.toLowerCase());
        const next = [...filtered, principalUser];
        if (typeof localCache !== 'undefined') {
          localCache.setItem('school_users', JSON.stringify(next));
        }
        return next;
      });

      // 7. Record in Audit Log
      addAuditLog({
        entityType: 'settings',
        entityId: trimmedId,
        action: 'create',
        performerId: currentUser.id,
        performerName: currentUser.name,
        performerRole: currentUser.role,
        details: `تأسيس مدرسة جديدة بالمنصة: ${input.nameAr} (${input.code}) بنطاق فرعي (${trimmedSubdomain}). تم إنشاء حساب المدير: ${input.principalEmail}`,
        detailsEn: `Establishing a new school on the platform: ${input.nameAr} (${input.code}) with subdomain (${trimmedSubdomain}). Principal account created: ${input.principalEmail}`,
      });

      const accessUrl =
        typeof window !== 'undefined' ? `${window.location.origin}/?tenant=${trimmedId}` : `/?tenant=${trimmedId}`;
      const loginLines = temporaryPassword
        ? `\nرابط الدخول: ${accessUrl}\nالبريد: ${input.principalEmail.trim().toLowerCase()}\nكلمة المرور المؤقتة: ${temporaryPassword}`
        : principalCreationWarning
        ? `\nتنبيه: ${principalCreationWarning}. أنشئ حساب المدير من صفحة إدارة المستخدمين.`
        : '';

      return {
        success: true,
        message: `تم تأسيس مدرسة (${input.nameAr}) بنجاح وتفعيل النطاق وحساب المدير.${loginLines}`,
        tenantId: trimmedId,
        principalEmail: input.principalEmail.trim().toLowerCase(),
        temporaryPassword,
      };
    } catch (err: any) {
      console.error('Failed to provision school:', err);
      return {
        success: false,
        message: `فشل تأسيس المدرسة: ${err?.message || 'خطأ غير متوقع'}`,
        tenantId: input.id,
      };
    }
  };

  return (
    <AttendanceContext.Provider
      value={{
        firebaseUser,
        signInWithGoogle,
        signOutGoogle,
        signInWithCredentials,
        currentTenant,
        tenantDomainConfig,
        tenantSubscription,
        subscriptionAccess,
        refreshSubscription,
        tenants,
        setTenantId,
        currentUser,
        setUserRole,
        lang,
        setLang,
        isSuperAdmin,
        canManageSettings,
        canReviewJustifications,
        canReopenSessions,
        canImportStudents,
        canDispatchDigest,
        canManageOutbox,
        canEditSession,
        provisionNewSchool,
        refreshDynamicTenants: syncTenantsWithServer,
        users,
        createUser,
        updateUser,
        deleteUser,
        students,
        sessions,
        justifications,
        notifications,
        auditLogs,
        settings,
        updateRecord,
        setAllPresentInDraft,
        quickMarkGroupAsPresent,
        submitSession,
        reopenSession,
        createNewSession,
        createJustification,
        reviewJustification,
        updateJustificationAnalysis,
        retryNotification,
        retryAllFailedNotifications,
        sendCustomParentNotification,
        sendChronicWarningNotification,
        sendAllChronicWarningNotifications,
        addAuditLog,
        addStudent,
        updateStudent,
        transferStudent,
        restoreStudent,
        deleteStudent,
        importStudents,
        classesStats,
        schoolEnrollmentStats,
        updateSettings,
        schoolProfile,
        updateSchoolProfile,
        messagingGateway,
        updateMessagingGateway,
        isOffDay,
        weekendDays,
        officialHolidays,
        behaviourIncidents,
        addBehaviourIncident,
        digestConfig,
        digestHistory,
        updateDigestConfig,
        generateCurrentDigest,
        dispatchDailyDigest,
      }}
    >
      {children}
    </AttendanceContext.Provider>
  );
};

export const useAttendance = () => {
  const context = useContext(AttendanceContext);
  if (!context) {
    throw new Error('useAttendance must be used within an AttendanceProvider');
  }
  return context;
};

import type {
  Tenant,
  UserProfile,
  Student,
  AttendanceSession,
  StudentAttendanceRecord,
  AttendanceStatus,
  Justification,
  NotificationOutboxItem,
  AuditLog,
  SchoolSettings,
  UserRole,
  DailyEmailDigestItem,
  DailyEmailDigestConfig,
  TenantSchoolProfile,
  StudentBehaviourIncident,
  SchoolClassSummary,
  SchoolEnrollmentStats,
  OfficialHoliday,
  SchoolProvisionInput,
  SchoolMessagingGatewayConfig,
} from '../types/attendance';
import type { OffDayCheckResult } from '../utils/holidayUtils';
import { TENANT_REGISTRY, TenantDomainConfig } from '../config/tenantRegistry';
import type { User as FirebaseUser, UserCredential } from 'firebase/auth';
import type { SubscriptionEvaluation, TenantSubscription } from '../config/subscription';

export const REGISTRY_TENANTS: Tenant[] = Object.values(TENANT_REGISTRY).map((config) => ({
  id: config.tenantId,
  name: config.nameAr,
  code: config.code,
  city: config.cityAr,
  academicYear: config.academicYear,
  currentTerm: config.currentTerm,
  schoolType: config.schoolType,
}));

export const PLATFORM_OWNER_EMAILS = ((import.meta as any).env?.VITE_PLATFORM_OWNER_EMAILS || '')
  .split(',')
  .map((value: string) => value.trim().toLowerCase())
  .filter(Boolean);

export const toFirestoreData = <T,>(value: T): T => JSON.parse(JSON.stringify(value));

export const buildParentSessions = (records: StudentAttendanceRecord[]): AttendanceSession[] => {
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

export interface UserAccountResult {
  success: boolean;
  message: string;
  user?: UserProfile;
  /** Present when the server created (or reset) a login and generated the password. */
  temporaryPassword?: string;
}

export interface AttendanceContextType {
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
  addStudent: (student: Omit<Student, 'id' | 'tenantId' | 'attendanceRate' | 'totalAbsences' | 'totalLates'>) => Promise<Student>;
  updateStudent: (studentId: string, updates: Partial<Student>) => void;
  transferStudent: (studentId: string, details: { destinationSchool: string; reason?: string }) => Promise<{ success: boolean; message: string }>;
  restoreStudent: (studentId: string) => Promise<{ success: boolean; message: string }>;
  deleteStudent: (studentId: string) => Promise<{ success: boolean; message: string }>;
  importStudents: (newStudents: Partial<Student>[]) => Promise<{ imported: number; duplicates: number }>;

  // School & Class Analytics
  classesStats: SchoolClassSummary[];
  schoolEnrollmentStats: SchoolEnrollmentStats;

  // Settings & Messaging Gateways (Owner Guarded)
  updateSettings: (newSettings: Partial<SchoolSettings>) => void;
  schoolProfile: TenantSchoolProfile;
  updateSchoolProfile: (newProfile: Partial<TenantSchoolProfile>) => Promise<void>;
  messagingGateway: SchoolMessagingGatewayConfig;
  updateMessagingGateway: (config: Partial<SchoolMessagingGatewayConfig>) => Promise<{ success: boolean; message: string }>;
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

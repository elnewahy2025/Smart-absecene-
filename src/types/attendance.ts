export type AttendanceStatus =
  | 'present'
  | 'absent'
  | 'late'
  | 'excused_leave'
  | 'excused_absence'
  | 'under_review'
  | 'rejected_excuse';

export type UserRole = 'super_admin' | 'admin' | 'registrar' | 'teacher' | 'parent';

export interface SchoolProvisionInput {
  id: string; // Unique school identifier (e.g. 'school-3' or 'al-majd')
  nameAr: string;
  nameEn: string;
  code: string; // e.g. 'MAJD-301'
  cityAr: string;
  cityEn: string;
  subdomain: string; // e.g. 'majd' -> majd.smartschool.com
  customDomains?: string[];
  schoolType: 'boys' | 'girls' | 'mixed';
  academicYear: string;
  countryAr?: string; // e.g. 'المملكة العربية السعودية' or 'جمهورية مصر العربية'
  countryCallingCode?: string; // e.g. '+966' or '+20'
  primaryColor: string;
  logoText: string;
  principalName: string;
  principalEmail: string;
  principalPhone?: string;
}

export interface Tenant {
  id: string;
  name: string;
  code: string;
  city: string;
  academicYear: string;
  currentTerm: string;
  schoolType: 'boys' | 'girls' | 'mixed';
  schoolProfile?: TenantSchoolProfile;
}

export interface UserProfile {
  id: string;
  tenantId: string;
  name: string;
  role: UserRole;
  phone: string;
  email: string;
  avatar?: string;
  assignedClasses?: string[];
  assignedSubjects?: string[];
  nationalId?: string;
  jobTitle?: string;
  status?: 'active' | 'inactive';
  lastLogin?: string;
  createdAt?: string;
}

export type StudentEnrollmentStatus = 'active' | 'transferred' | 'graduated' | 'suspended';

export interface Student {
  id: string;
  tenantId: string;
  studentNumber: string;
  nationalId: string;
  fullName: string;
  grade: string;
  className: string;
  classId: string;
  guardianName: string;
  guardianPhone: string;
  guardianRelationship: string;
  guardianEmail?: string;
  birthDate?: string;
  bloodType?: string;
  medicalConditions?: string;
  emergencyContact?: string;
  totalAbsences: number;
  totalLates: number;
  attendanceRate: number;
  enrollmentStatus?: StudentEnrollmentStatus;
  transferredAt?: string;
  transferReason?: string;
  destinationSchool?: string;
}

export interface SchoolClassSummary {
  className: string;
  grade: string;
  classId: string;
  totalStudents: number;
  activeStudents: number;
  transferredStudents: number;
  attendanceRate: number;
  assignedTeachersCount: number;
}

export interface SchoolEnrollmentStats {
  totalStudentsCount: number;
  activeStudentsCount: number;
  transferredStudentsCount: number;
  totalClassesCount: number;
  averageClassSize: number;
  schoolAttendanceRate: number;
}

export interface AttendanceRecord {
  id: string;
  sessionId: string;
  studentId: string;
  status: AttendanceStatus;
  minutesLate?: number;
  note?: string;
  departureTime?: string;
  justificationId?: string;
  updatedAt: string;
  updatedBy: string;
}

export interface AttendanceSession {
  id: string;
  tenantId: string;
  date: string; // YYYY-MM-DD
  sessionType: 'daily' | 'period';
  periodNumber?: number; // 1-7
  subject?: string;
  classId: string;
  className: string;
  grade: string;
  teacherId: string;
  teacherName: string;
  status: 'draft' | 'submitted' | 'reopened';
  totalStudents: number;
  presentCount: number;
  absentCount: number;
  lateCount: number;
  excusedCount: number;
  submittedAt?: string;
  submittedBy?: string;
  reopenedAt?: string;
  reopenedBy?: string;
  reopenedReason?: string;
  records: AttendanceRecord[];
}

export interface StudentAttendanceRecord {
  id: string;
  tenantId: string;
  sessionId: string;
  studentId: string;
  guardianPhone: string;
  date: string;
  sessionType: 'daily' | 'period';
  periodNumber?: number;
  subject?: string;
  classId: string;
  className: string;
  teacherName?: string;
  status: AttendanceStatus;
  minutesLate?: number;
  note?: string;
  updatedAt: string;
}
export interface Justification {
  id: string;
  tenantId: string;
  studentId: string;
  guardianPhone?: string;
  studentName: string;
  className: string;
  absenceDate: string;
  endDate?: string;
  reasonType: 'medical' | 'family' | 'travel' | 'other';
  guardianExplanation: string;
  attachmentUrl?: string;
  attachmentMime?: string;
  attachmentName?: string;
  status: 'pending' | 'approved' | 'rejected';
  aiAnalysis?: {
    documentType?: string;
    studentName?: string;
    issuerName?: string;
    physicianName?: string;
    reportDate?: string;
    datesCovered?: string;
    durationDays?: string | number;
    reasonOrDiagnosis?: string;
    hasOfficialStampOrSignature?: boolean;
    confidenceScore?: string;
    verificationStatus?: 'verified' | 'warning' | 'irregular';
    overallRiskLevel?: 'low' | 'medium' | 'high';
    integrityScore?: number;
    recommendedDecision?: string;
    decisionRationale?: string;
    notesAndRecommendations?: string;
    extractedSummary?: string;
    checklist?: {
      [key: string]: {
        passed: boolean;
        details: string;
      };
    };
    irregularities?: Array<{
      type: string;
      severity: 'high' | 'medium' | 'low';
      titleAr: string;
      titleEn?: string;
      descriptionAr: string;
      suggestedAction?: string;
    }>;
  };
  submittedAt: string;
  reviewedBy?: string;
  reviewedAt?: string;
  reviewerNotes?: string;
}

export interface NotificationOutboxItem {
  id: string;
  tenantId: string;
  recipientPhone: string;
  recipientName: string;
  studentId: string;
  guardianPhone?: string;
  studentName: string;
  absenceDate: string;
  sessionTitle: string;
  statusType: AttendanceStatus;
  category?: 'absence' | 'late' | 'warning' | 'broadcast' | 'excuse_approved';
  messageText: string;
  channel: 'SMS' | 'WhatsApp';
  status: 'pending' | 'sent' | 'failed';
  retryCount: number;
  errorReason?: string;
  createdAt: string;
  sentAt?: string;
  gatewayReceiptId?: string;
  gatewayProvider?: string;
}

export interface AuditLog {
  id: string;
  tenantId: string;
  entityType: 'session' | 'record' | 'justification' | 'student' | 'settings';
  entityId: string;
  action: 'create' | 'update' | 'submit' | 'reopen' | 'delete' | 'export';
  performerId: string;
  performerName: string;
  performerRole: UserRole;
  details: string;
  previousValue?: string;
  newValue?: string;
  timestamp: string;
}

export interface SchoolSettings {
  attendanceMode: 'daily' | 'period' | 'both';
  allowDraftSave: boolean;
  lateThresholdMinutes: number;
  chronicAbsenceLimit: number;
  sendSmsOnAbsent: boolean;
  sendSmsOnLate: boolean;
  requireExcuseAttachment: boolean;
  allowParentSubmissions: boolean;
  emergencyAssemblyPoints: string[];
  preferredChannel?: 'SMS' | 'WhatsApp' | 'both';
  absenceMessageTemplate?: string;
  lateMessageTemplate?: string;
  warningMessageTemplate?: string;
  notifyOnExcuseApproved?: boolean;
  weekendDays?: number[]; // Days when school is closed (0=Sun, 1=Mon, ..., 5=Fri, 6=Sat). Default: [5, 6]
  officialHolidays?: OfficialHoliday[];
  messagingGateway?: SchoolMessagingGatewayConfig;
}

export type WhatsAppServiceMode = 'web_direct' | 'cloud_api';
export type SmsGatewayProvider = 'taqnyat' | 'unifonic' | 'twilio' | 'msegat';
export type EmailGatewayProvider = 'smtp' | 'resend' | 'sendgrid';

export interface SchoolMessagingGatewayConfig {
  // WhatsApp Configuration
  whatsappPhoneNumber: string; // The official school mobile/WhatsApp number (used for sending and receiving WhatsApp messages)
  whatsappServiceMode: WhatsAppServiceMode; // 'web_direct' (WhatsApp Web / App wa.me direct - default, zero cost) or 'cloud_api'
  whatsappBusinessAccountId?: string;
  whatsappPhoneNumberId?: string;
  whatsappApiToken?: string;
  
  // SMS Gateway Configuration
  smsProvider: SmsGatewayProvider; // Taqnyat, Unifonic, Twilio or Msegat
  smsSenderId: string; // Approved sender name, e.g. "SMARTSCHOOL" or school name
  smsApiKey?: string;
  smsApiSecret?: string;
  smsSenderPhone?: string; // dedicated phone number for SMS sending if provider requires phone number

  // Email Transport Configuration (used by the daily executive digest)
  emailEnabled?: boolean;
  emailProvider?: EmailGatewayProvider; // 'smtp' | 'resend' | 'sendgrid'
  smtpHost?: string;
  smtpPort?: number;
  smtpSecure?: boolean;
  smtpUser?: string;
  smtpPass?: string;
  fromEmail?: string;
  fromName?: string;
  emailApiKey?: string;
  
  // General & Audit
  enableWhatsAppNotifications: boolean;
  enableSmsNotifications: boolean;
  lastConfiguredByRole?: UserRole; // Must be 'super_admin'
  lastConfiguredByEmail?: string;
  lastConfiguredAt?: string;
}

export type HolidayType = 'national' | 'religious' | 'extended_weekend' | 'official' | 'emergency';

export interface OfficialHoliday {
  id: string;
  nameAr: string;
  nameEn?: string;
  startDate: string; // YYYY-MM-DD
  endDate: string;   // YYYY-MM-DD
  type: HolidayType;
  notes?: string;
}

export interface DailyDigestAnomaly {
  id: string;
  type: 'class_spike' | 'consecutive_absence' | 'unsubmitted_session' | 'pattern_discrepancy' | 'dow_anomaly';
  severity: 'critical' | 'warning' | 'info';
  titleAr: string;
  titleEn: string;
  descriptionAr: string;
  metric: string;
  targetName: string;
  suggestedActionAr: string;
}

export interface DailyDigestHighRiskStudent {
  id: string;
  name: string;
  grade: string;
  className: string;
  totalAbsences: number;
  totalLates: number;
  attendanceRate: number;
  riskTier: 'tier_8_plus' | 'tier_5_plus' | 'tier_3_plus';
  guardianName: string;
  guardianPhone: string;
  primaryConcernAr: string;
  actionRequiredAr: string;
}

export interface DailyDigestPendingExcuse {
  id: string;
  studentName: string;
  className: string;
  absenceDate: string;
  reasonType: string;
  aiVerificationStatus?: 'verified' | 'warning' | 'irregular';
  aiRiskLevel?: 'low' | 'medium' | 'high';
  integrityScore?: number;
  flagsAr: string[];
  actionRequiredAr: string;
}

export interface DailyEmailDigestItem {
  id: string;
  tenantId: string;
  date: string;
  dispatchedAt: string;
  scheduledTime: string;
  recipients: string[];
  subject: string;
  status: 'delivered' | 'failed' | 'scheduled';
  overallAttendanceRate: number;
  totalStudents: number;
  anomaliesCount: number;
  pendingJustificationsCount: number;
  highRiskStudentsCount: number;
  anomalies: DailyDigestAnomaly[];
  highRiskStudents: DailyDigestHighRiskStudent[];
  pendingJustifications: DailyDigestPendingExcuse[];
  geminiBriefing?: {
    headline?: string;
    executiveSummary: string;
    urgencyLevel: 'normal' | 'elevated' | 'critical';
    keyPriorities: string[];
    counselorDirectives: string[];
  };
  htmlContent?: string;
}

export interface DailyEmailDigestConfig {
  enabled: boolean;
  scheduledTime: string; // e.g. "06:45"
  daysOfWeek: number[]; // [0, 1, 2, 3, 4] for Sunday to Thursday
  recipients: string[];
  includeAnomalies: boolean;
  includePendingJustifications: boolean;
  includeHighRiskStudents: boolean;
  includeGeminiBriefing: boolean;
  chronicAbsenceThreshold: number;
  consecutiveAbsenceDaysThreshold: number;
  anomalySpikePercentage: number;
  notifyViaWhatsAppToo: boolean;
  principalPhone?: string;
  lastDispatchedAt?: string;
  lastDigestId?: string;
}

export interface AcademicTerm {
  id: string; // e.g. "term-1", "term-2", "term-3"
  nameAr: string; // e.g. "الفصل الدراسي الأول"
  nameEn: string; // e.g. "Term 1"
  startDate: string; // YYYY-MM-DD
  endDate: string; // YYYY-MM-DD
  isActive: boolean;
}

export interface AcademicYearConfig {
  code: string; // e.g. "1446-1447"
  hijriYear: string; // e.g. "1446-1447 هـ"
  gregorianYear: string; // e.g. "2024-2025"
  terms: AcademicTerm[];
}

export interface SchoolClassConfig {
  id: string; // e.g. "class-1"
  name: string; // e.g. "10 / أ"
  grade: string; // e.g. "الصف العاشر"
  room?: string; // e.g. "قاعة 101"
  capacity?: number; // e.g. 35
}

export interface SchoolSubjectConfig {
  id: string; // e.g. "subj-1"
  name: string; // e.g. "الرياضيات"
  code?: string; // e.g. "MATH-101"
  department?: string; // e.g. "قسم الرياضيات"
}

export interface TimetablePeriod {
  id: string;
  periodNumber: number; // 0 for morning assembly, 1-7 for class periods
  nameAr: string; // e.g. "الاصطفاف الصباحي", "الحصة الأولى"
  startTime: string; // e.g. "07:00"
  endTime: string; // e.g. "07:45"
  type: 'assembly' | 'lesson' | 'recess' | 'prayer';
}

export interface AssemblyPointConfig {
  id: string;
  name: string; // e.g. "نقطة تجمع أ (الساحة الرئيسية)"
  zone: string; // e.g. "Zone A"
  capacity: number;
  assignedGrades: string[];
}

export interface SchoolLeadershipProfile {
  principalName: string;
  principalPhone: string;
  principalEmail?: string;
  // Two Vice Principals (Saudi MOE standard: Student Affairs + Academic Affairs)
  vicePrincipalStudentAffairsName: string;
  vicePrincipalStudentAffairsPhone: string;
  vicePrincipalAcademicAffairsName: string;
  vicePrincipalAcademicAffairsPhone: string;
  // Social Worker / Guidance Counselor
  socialWorkerName: string;
  socialWorkerPhone: string;
  socialWorkerEmail?: string;
}

export interface SchoolAddressProfile {
  country: string; // e.g. "المملكة العربية السعودية"
  countryCallingCode?: string; // e.g. "+966"
  region: string; // e.g. "منطقة الرياض"
  city: string; // e.g. "الرياض"
  district: string; // e.g. "حي الأندلس"
  streetAddress: string; // e.g. "شارع خالد بن الوليد"
  postalCode?: string; // e.g. "13214"
  buildingNumber?: string;
}

export interface TenantSchoolProfile {
  tenantId: string;
  // Identity
  schoolName: string;
  schoolCode: string;
  ministryHeaderAr: string; // e.g. "المملكة العربية السعودية - وزارة التعليم"
  directorateAr: string; // e.g. "الإدارة العامة للتعليم بمنطقة الرياض"
  officeAr: string; // e.g. "مكتب تعليم الروضة"
  stageAr: string; // e.g. "المرحلة الثانوية"
  genderType: 'boys' | 'girls' | 'mixed';
  logoUrl?: string;
  stampUrl?: string;
  // Contact & Location
  address: SchoolAddressProfile;
  countryCallingCode?: string; // e.g. "+966", "+20", "+971"
  generalPhone: string;
  emergencyHotline: string;
  officialEmail: string;
  websiteUrl?: string;
  // Leadership & Personnel
  leadership: SchoolLeadershipProfile;
  // Academic Calendar & Periods
  academicYear: AcademicYearConfig;
  timetablePeriods: TimetablePeriod[];
  // School Classes, Sections & Subjects
  educationalGrades?: string[]; // e.g. ["الصف السادس", "الصف السابع", "الصف العاشر"]
  classes?: SchoolClassConfig[];
  subjects?: SchoolSubjectConfig[];
  // Safety & Assembly
  assemblyPoints: AssemblyPointConfig[];
  // Thresholds & Operational Policy
  chronicAbsenceDaysThreshold: number;
  unexcusedWarningThreshold: number;
  officialReportFooterNote: string;
  // Official Holidays & Weekends
  weekendDays?: number[];
  officialHolidays?: OfficialHoliday[];
  // Messaging Gateway & WhatsApp Configuration (Protected: Platform Owner Only)
  messagingGateway?: SchoolMessagingGatewayConfig;
}

export type BehaviourType = 'positive' | 'infraction';
export type BehaviourSeverity = 'minor' | 'moderate' | 'major';

export interface StudentBehaviourIncident {
  id: string;
  tenantId: string;
  studentId: string;
  guardianPhone?: string;
  studentName: string;
  className: string;
  date: string;
  time?: string;
  type: BehaviourType;
  category: string; // e.g., 'academic_excellence', 'teamwork', 'disruption', 'unexcused_tardiness'
  title: string;
  description: string;
  severity: BehaviourSeverity;
  points: number; // e.g. +5 for positive, -3 for infraction
  actionTaken?: string;
  recordedBy: string;
  guardianNotified: boolean;
}

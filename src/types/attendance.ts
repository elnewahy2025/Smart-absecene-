export type AttendanceStatus =
  | 'present'
  | 'absent'
  | 'late'
  | 'excused_leave'
  | 'excused_absence'
  | 'under_review'
  | 'rejected_excuse';

export type UserRole = 'admin' | 'registrar' | 'teacher' | 'parent';

export interface Tenant {
  id: string;
  name: string;
  code: string;
  city: string;
  academicYear: string;
  currentTerm: string;
  schoolType: 'boys' | 'girls' | 'mixed';
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
}

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
  birthDate?: string;
  bloodType?: string;
  medicalConditions?: string;
  emergencyContact?: string;
  totalAbsences: number;
  totalLates: number;
  attendanceRate: number;
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

export interface Justification {
  id: string;
  tenantId: string;
  studentId: string;
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
    datesCovered?: string;
    durationDays?: string | number;
    reasonOrDiagnosis?: string;
    hasOfficialStampOrSignature?: boolean;
    confidenceScore?: string;
    recommendedDecision?: string;
    notesAndRecommendations?: string;
    extractedSummary?: string;
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
  studentName: string;
  absenceDate: string;
  sessionTitle: string;
  statusType: AttendanceStatus;
  messageText: string;
  channel: 'SMS' | 'WhatsApp';
  status: 'pending' | 'sent' | 'failed';
  retryCount: number;
  errorReason?: string;
  createdAt: string;
  sentAt?: string;
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
}

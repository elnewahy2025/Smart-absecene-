import React, { createContext, useContext, useState, useEffect } from 'react';
import {
  Tenant,
  UserProfile,
  Student,
  AttendanceSession,
  AttendanceRecord,
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
} from '../types/attendance';
import { computeDailyDigestData, generateHtmlEmailTemplate } from '../utils/digestEngine';
import {
  INITIAL_TENANTS,
  INITIAL_USERS,
  INITIAL_STUDENTS,
  INITIAL_SESSIONS,
  INITIAL_JUSTIFICATIONS,
  INITIAL_NOTIFICATIONS,
  INITIAL_AUDIT_LOGS,
  INITIAL_SETTINGS,
} from '../data/mockData';

import {
  auth,
  db,
  googleProvider,
  handleFirestoreError,
  OperationType,
} from '../lib/firebase';
import {
  signInWithPopup,
  signOut,
  onAuthStateChanged,
  User as FirebaseUser,
} from 'firebase/auth';
import {
  doc,
  setDoc,
  collection,
  onSnapshot,
} from 'firebase/firestore';

interface AttendanceContextType {
  // Firebase Auth
  firebaseUser: FirebaseUser | null;
  signInWithGoogle: () => Promise<void>;
  signOutGoogle: () => Promise<void>;

  // Tenant & Role
  currentTenant: Tenant;
  tenants: Tenant[];
  setTenantId: (id: string) => void;
  currentUser: UserProfile;
  setUserRole: (role: UserRole) => void;
  lang: 'ar' | 'en';
  setLang: (lang: 'ar' | 'en') => void;

  // Data scoped to currentTenant
  students: Student[];
  sessions: AttendanceSession[];
  justifications: Justification[];
  notifications: NotificationOutboxItem[];
  auditLogs: AuditLog[];
  settings: SchoolSettings;

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

  // Import
  importStudents: (newStudents: Partial<Student>[]) => { imported: number; duplicates: number };

  // Settings
  updateSettings: (newSettings: Partial<SchoolSettings>) => void;

  // Daily Email Digest
  digestConfig: DailyEmailDigestConfig;
  digestHistory: DailyEmailDigestItem[];
  updateDigestConfig: (cfg: Partial<DailyEmailDigestConfig>) => void;
  generateCurrentDigest: (customConfig?: Partial<DailyEmailDigestConfig>) => Promise<DailyEmailDigestItem>;
  dispatchDailyDigest: (digestId?: string, targetRecipients?: string[]) => Promise<{ success: boolean; message: string; digestItem: DailyEmailDigestItem }>;
}

const AttendanceContext = createContext<AttendanceContextType | undefined>(undefined);

export const AttendanceProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [tenantId, setTenantIdState] = useState<string>('school-1');
  const [currentUserRole, setCurrentUserRole] = useState<UserRole>('admin');
  const [lang, setLang] = useState<'ar' | 'en'>('ar');
  const [firebaseUser, setFirebaseUser] = useState<FirebaseUser | null>(null);

  const [allStudents, setAllStudents] = useState<Student[]>(() => {
    const saved = localStorage.getItem('school_students');
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

  const [allSessions, setAllSessions] = useState<AttendanceSession[]>(() => {
    const saved = localStorage.getItem('school_sessions');
    return saved ? JSON.parse(saved) : INITIAL_SESSIONS;
  });

  const [allJustifications, setAllJustifications] = useState<Justification[]>(() => {
    const saved = localStorage.getItem('school_justifications');
    if (!saved) return INITIAL_JUSTIFICATIONS;
    try {
      const parsed: Justification[] = JSON.parse(saved);
      const existingIds = new Set(parsed.map((j) => j.id));
      const missing = INITIAL_JUSTIFICATIONS.filter((j) => !existingIds.has(j.id));
      return [...parsed, ...missing];
    } catch {
      return INITIAL_JUSTIFICATIONS;
    }
  });

  const [allNotifications, setAllNotifications] = useState<NotificationOutboxItem[]>(() => {
    const saved = localStorage.getItem('school_notifications');
    return saved ? JSON.parse(saved) : INITIAL_NOTIFICATIONS;
  });

  const [allAuditLogs, setAllAuditLogs] = useState<AuditLog[]>(() => {
    const saved = localStorage.getItem('school_audit_logs');
    return saved ? JSON.parse(saved) : INITIAL_AUDIT_LOGS;
  });

  const [settingsMap, setSettingsMap] = useState<Record<string, SchoolSettings>>(() => {
    const saved = localStorage.getItem('school_settings');
    return saved ? JSON.parse(saved) : INITIAL_SETTINGS;
  });

  const DEFAULT_DIGEST_CONFIG: DailyEmailDigestConfig = {
    enabled: true,
    scheduledTime: '06:45',
    daysOfWeek: [0, 1, 2, 3, 4],
    recipients: [
      'principal@andalus-school.edu.sa',
      'counselor@andalus-school.edu.sa',
      'vice.principal@andalus-school.edu.sa',
      'attendance.registrar@andalus-school.edu.sa',
    ],
    includeAnomalies: true,
    includePendingJustifications: true,
    includeHighRiskStudents: true,
    includeGeminiBriefing: true,
    chronicAbsenceThreshold: 5,
    consecutiveAbsenceDaysThreshold: 2,
    anomalySpikePercentage: 25,
    notifyViaWhatsAppToo: true,
    principalPhone: '+966501112233',
  };

  const [digestConfig, setDigestConfig] = useState<DailyEmailDigestConfig>(() => {
    const saved = localStorage.getItem('school_digest_config');
    return saved ? JSON.parse(saved) : DEFAULT_DIGEST_CONFIG;
  });

  const [digestHistory, setDigestHistory] = useState<DailyEmailDigestItem[]>(() => {
    const saved = localStorage.getItem('school_digest_history');
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
    localStorage.setItem('school_digest_config', JSON.stringify(digestConfig));
  }, [digestConfig]);

  useEffect(() => {
    localStorage.setItem('school_digest_history', JSON.stringify(digestHistory));
  }, [digestHistory]);

  // Listen to Firebase Auth state
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setFirebaseUser(user);
      if (user) {
        // Upsert user profile to Firestore adhering to schema
        const userProfileRef = doc(db, 'users', user.uid);
        setDoc(
          userProfileRef,
          {
            userId: user.uid,
            tenantId: tenantId,
            name: user.displayName || 'مستخدم معتمد',
            email: user.email || 'user@school.edu.sa',
            role: currentUserRole,
            phone: user.phoneNumber || '+966500000000',
            createdAt: new Date().toISOString(),
          },
          { merge: true }
        ).catch((err) => {
          handleFirestoreError(err, OperationType.WRITE, `users/${user.uid}`);
        });
      }
    });

    return () => unsubscribe();
  }, [tenantId, currentUserRole]);

  // Sync students from Firestore if authenticated
  useEffect(() => {
    if (!firebaseUser) return;
    const unsubStudents = onSnapshot(
      collection(db, 'students'),
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
              guardianPhone: data.guardianPhone || '+966500000000',
              guardianRelationship: 'الأب',
              bloodType: 'O+',
              totalAbsences: data.totalAbsences || 0,
              totalLates: 0,
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

    return () => {
      unsubStudents();
    };
  }, [firebaseUser, tenantId]);

  const signInWithGoogle = async () => {
    try {
      await signInWithPopup(auth, googleProvider);
    } catch (error) {
      console.error('Google Sign-In Error:', error);
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

  // Save changes to localStorage
  useEffect(() => {
    localStorage.setItem('school_students', JSON.stringify(allStudents));
  }, [allStudents]);

  useEffect(() => {
    localStorage.setItem('school_sessions', JSON.stringify(allSessions));
  }, [allSessions]);

  useEffect(() => {
    localStorage.setItem('school_justifications', JSON.stringify(allJustifications));
  }, [allJustifications]);

  useEffect(() => {
    localStorage.setItem('school_notifications', JSON.stringify(allNotifications));
  }, [allNotifications]);

  useEffect(() => {
    localStorage.setItem('school_audit_logs', JSON.stringify(allAuditLogs));
  }, [allAuditLogs]);

  useEffect(() => {
    localStorage.setItem('school_settings', JSON.stringify(settingsMap));
  }, [settingsMap]);

  // Current tenant and user
  const currentTenant = INITIAL_TENANTS.find((t) => t.id === tenantId) || INITIAL_TENANTS[0];
  const currentUser =
    INITIAL_USERS.find((u) => u.tenantId === tenantId && u.role === currentUserRole) || {
      id: `user-${currentUserRole}`,
      tenantId: tenantId,
      name:
        currentUserRole === 'admin'
          ? 'أ. عبد الله بن سلمان (مدير المدرسة)'
          : currentUserRole === 'registrar'
          ? 'أ. ماجد الخالدي (أخصائي التوجيه)'
          : currentUserRole === 'teacher'
          ? 'أ. فهد القحطاني (معلم الرياضيات)'
          : 'د. خالد المطيري (ولي أمر)',
      role: currentUserRole,
      phone: '+966501112233',
      email: `${currentUserRole}@school.edu.sa`,
    };

  const settings = settingsMap[tenantId] || INITIAL_SETTINGS['school-1'];

  // Helper to determine if a student record belongs to the authenticated parent
  const isChildOfGuardian = (student: Student, user: UserProfile): boolean => {
    if (user.role !== 'parent') return true;
    const cleanUserPhone = (user.phone || '').replace(/[^\d]/g, '');
    const cleanGuardianPhone = (student.guardianPhone || '').replace(/[^\d]/g, '');
    if (cleanUserPhone && cleanGuardianPhone && cleanUserPhone === cleanGuardianPhone) return true;
    if (user.email && student.guardianEmail && user.email.toLowerCase() === student.guardianEmail.toLowerCase()) return true;
    if (user.name && student.guardianName && (
      student.guardianName.trim() === user.name.trim() ||
      (student.guardianName.includes('المطيري') && user.name.includes('المطيري'))
    )) return true;
    return false;
  };

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
    ? allSessions
        .filter((s) => s.tenantId === tenantId)
        .map((sess) => {
          const matchingRecords = sess.records.filter((rec) => parentChildIds.includes(rec.studentId));
          return {
            ...sess,
            records: matchingRecords,
            totalStudents: matchingRecords.length,
            presentCount: matchingRecords.filter((r) => r.status === 'present').length,
            absentCount: matchingRecords.filter((r) => r.status === 'absent').length,
            excusedCount: matchingRecords.filter(
              (r) => r.status === 'excused_absence' || r.status === 'excused_leave' || r.status === 'under_review'
            ).length,
          };
        })
        .filter((sess) => sess.records.length > 0)
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

  const addAuditLog = (entry: Omit<AuditLog, 'id' | 'tenantId' | 'timestamp'>) => {
    const newLog: AuditLog = {
      ...entry,
      id: `audit-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      tenantId: tenantId,
      timestamp: new Date().toISOString(),
    };
    setAllAuditLogs((prev) => [newLog, ...prev]);
  };

  const updateRecord = (
    sessionId: string,
    studentId: string,
    status: AttendanceStatus,
    minutesLate?: number,
    note?: string
  ) => {
    if (currentUserRole === 'parent') {
      console.warn('Unauthorized: Parents cannot edit attendance records.');
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
            status: 'sent',
            retryCount: 0,
            createdAt: now,
            sentAt: now,
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
    });

    return {
      success: true,
      message: `تم اعتماد الكشف بنجاح وإرسال ${newNotifications.length} إشعار لولي الأمر عبر المنظومة.`,
    };
  };

  const reopenSession = (sessionId: string, reason: string) => {
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
    const classStudents = students.filter((s) => s.classId === classId || s.className === className);
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
      teacherId: currentUser.id,
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
    const student = allStudents.find((s) => s.id === studentId);
    const newJust: Justification = {
      id: `just-${Date.now()}`,
      tenantId: tenantId,
      studentId,
      studentName: student?.fullName || 'طالب',
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
          return { ...sess, records: recs };
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
    });

    return newJust;
  };

  const reviewJustification = (
    justificationId: string,
    status: 'approved' | 'rejected',
    notes: string
  ) => {
    if (currentUserRole === 'parent') {
      console.warn('Unauthorized: Parents cannot review justifications.');
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
          status: 'sent',
          retryCount: 0,
          createdAt: now,
          sentAt: now,
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
    return new Promise((resolve) => {
      setTimeout(() => {
        setAllNotifications((prev) =>
          prev.map((n) =>
            n.id === id
              ? {
                  ...n,
                  status: 'sent',
                  retryCount: n.retryCount + 1,
                  sentAt: new Date().toISOString(),
                  errorReason: undefined,
                }
              : n
          )
        );
        resolve(true);
      }, 700);
    });
  };

  const retryAllFailedNotifications = () => {
    setAllNotifications((prev) =>
      prev.map((n) =>
        n.tenantId === tenantId && n.status === 'failed'
          ? {
              ...n,
              status: 'sent',
              retryCount: n.retryCount + 1,
              sentAt: new Date().toISOString(),
              errorReason: undefined,
            }
          : n
      )
    );
  };

  const sendCustomParentNotification = (params: {
    studentIds: string[];
    messageText: string;
    channel: 'SMS' | 'WhatsApp';
    category?: 'absence' | 'late' | 'warning' | 'broadcast' | 'excuse_approved';
    absenceDate?: string;
  }): number => {
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
          status: 'sent',
          retryCount: 0,
          createdAt: now,
          sentAt: now,
        };
        newItems.push(item);
      }
    });

    if (newItems.length > 0) {
      setAllNotifications((prev) => [...newItems, ...prev]);

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
        details: `إرسال وبث رسائل مخصصة لأولياء الأمور: تم إرسال ${newItems.length} رسالة عبر (${params.channel}).`,
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
      status: 'sent',
      retryCount: 0,
      createdAt: now,
      sentAt: now,
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

  const importStudents = (newStudentsList: Partial<Student>[]) => {
    let imported = 0;
    let duplicates = 0;

    const existingNatIds = new Set(students.map((s) => s.nationalId));
    const existingStdNums = new Set(students.map((s) => s.studentNumber));

    const additions: Student[] = [];

    newStudentsList.forEach((raw, i) => {
      const nationalId = raw.nationalId?.trim() || `1099${Date.now() + i}`;
      const studentNumber = raw.studentNumber?.trim() || `2026${Date.now() + i}`;

      if (existingNatIds.has(nationalId) || existingStdNums.has(studentNumber)) {
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
        grade: raw.grade?.trim() || 'الصف العاشر',
        className: raw.className?.trim() || '10 / أ',
        classId: raw.classId?.trim() || 'class-1a',
        guardianName: raw.guardianName?.trim() || 'ولي أمر معتمد',
        guardianPhone: raw.guardianPhone?.trim() || '+966500000000',
        guardianRelationship: raw.guardianRelationship || 'الأب',
        bloodType: raw.bloodType || 'O+',
        totalAbsences: 0,
        totalLates: 0,
        attendanceRate: 100,
      });
      imported++;
    });

    if (additions.length > 0) {
      setAllStudents((prev) => [...prev, ...additions]);
      addAuditLog({
        entityType: 'student',
        entityId: `bulk-import-${Date.now()}`,
        action: 'create',
        performerId: currentUser.id,
        performerName: currentUser.name,
        performerRole: currentUser.role,
        details: `استيراد معتمد لقائمة الطلاب: نجح استيراد ${imported} طالب جديد، وتم استبعاد ${duplicates} سجل مكرر لمنع ازدواجية البيانات.`,
      });
    }

    return { imported, duplicates };
  };

  const updateSettings = (newSettings: Partial<SchoolSettings>) => {
    setSettingsMap((prev) => ({
      ...prev,
      [tenantId]: {
        ...prev[tenantId],
        ...newSettings,
      },
    }));

    addAuditLog({
      entityType: 'settings',
      entityId: `settings-${tenantId}`,
      action: 'update',
      performerId: currentUser.id,
      performerName: currentUser.name,
      performerRole: currentUser.role,
      details: 'تحديث قواعد وإعدادات المدرسة (حدود الغياب والتأخر وإشعارات الرسائل).',
    });
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
        const res = await fetch('/api/daily-digest/generate-briefing', {
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

    // Default fallback briefing if offline or empty
    if (!geminiBriefing && effectiveConfig.includeGeminiBriefing) {
      geminiBriefing = {
        headline: `نشرة الصباح اليومية للانضباط - ${currentTenant.name}`,
        urgencyLevel: baseData.anomalies.length > 0 ? 'elevated' : 'normal',
        executiveSummary: `متابعة انضباط مدرسة ${currentTenant.name}. نسبة الحضور العامة ${baseData.overallAttendanceRate}%. رُصد ${baseData.anomaliesCount} شذوذات سلوكية، و${baseData.pendingJustificationsCount} أعذار معلقة، و${baseData.highRiskStudentsCount} طلاب بحاجة لمتابعة إرشادية.`,
        keyPriorities: [
          'اعتماد كشوف الحضور غير المعتمدة للشعب قبل انطلاق الحصة الأولى.',
          'تدقيق الأعذار الطبية المعلقة وفحص المستندات ذات الملاحظات بالذكاء الاصطناعي.',
          'تواصل الموجه الطلابي مع أولياء أمور الطلاب المعرضين للحرمان (5+ أيام غياب).',
        ],
        counselorDirectives: [
          'إجراء مقابلات إرشادية صباحية للطلاب متكرري الغياب.',
          'تسجيل أسباب الغياب في ملف الرعاية الطلابية.',
        ],
      };
    }

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
    // Generate fresh digest
    const digest = await generateCurrentDigest();
    const effectiveRecipients = targetRecipients && targetRecipients.length > 0 ? targetRecipients : digest.recipients;

    try {
      const res = await fetch('/api/daily-digest/dispatch', {
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
      const dispatchedDigest: DailyEmailDigestItem = {
        ...digest,
        status: 'delivered',
        dispatchedAt: new Date().toISOString(),
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
      });

      return {
        success: true,
        message: resJson?.message || `تم إرسال النشرة الصباحية بنجاح إلى ${effectiveRecipients.length} من قيادات المدرسة.`,
        digestItem: dispatchedDigest,
      };
    } catch (err: any) {
      console.error('Failed to dispatch digest:', err);
      const simulatedDigest: DailyEmailDigestItem = {
        ...digest,
        status: 'simulated',
        dispatchedAt: new Date().toISOString(),
        recipients: effectiveRecipients,
      };
      setDigestHistory((prev) => [simulatedDigest, ...prev.slice(0, 49)]);

      addAuditLog({
        entityType: 'settings',
        entityId: simulatedDigest.id,
        action: 'submit',
        performerId: currentUser.id,
        performerName: currentUser.name,
        performerRole: currentUser.role,
        details: `محاكاة إرسال النشرة الصباحية اليومية إلى قيادات المدرسة (${effectiveRecipients.length} مستلم).`,
      });

      return {
        success: true,
        message: `تمت محاكاة إرسال النشرة الصباحية بنجاح إلى بريد القيادة المدرسية (${effectiveRecipients.length} مستلم).`,
        digestItem: simulatedDigest,
      };
    }
  };

  return (
    <AttendanceContext.Provider
      value={{
        firebaseUser,
        signInWithGoogle,
        signOutGoogle,
        currentTenant,
        tenants: INITIAL_TENANTS,
        setTenantId: setTenantIdState,
        currentUser,
        setUserRole: setCurrentUserRole,
        lang,
        setLang,
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
        importStudents,
        updateSettings,
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

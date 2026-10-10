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
} from '../types/attendance';
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

interface AttendanceContextType {
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

  // Notifications
  retryNotification: (id: string) => Promise<boolean>;
  retryAllFailedNotifications: () => void;

  // Audit
  addAuditLog: (entry: Omit<AuditLog, 'id' | 'tenantId' | 'timestamp'>) => void;

  // Import
  importStudents: (newStudents: Partial<Student>[]) => { imported: number; duplicates: number };

  // Settings
  updateSettings: (newSettings: Partial<SchoolSettings>) => void;
}

const AttendanceContext = createContext<AttendanceContextType | undefined>(undefined);

export const AttendanceProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [tenantId, setTenantIdState] = useState<string>('school-1');
  const [currentUserRole, setCurrentUserRole] = useState<UserRole>('admin');
  const [lang, setLang] = useState<'ar' | 'en'>('ar');

  const [allStudents, setAllStudents] = useState<Student[]>(() => {
    const saved = localStorage.getItem('school_students');
    return saved ? JSON.parse(saved) : INITIAL_STUDENTS;
  });

  const [allSessions, setAllSessions] = useState<AttendanceSession[]>(() => {
    const saved = localStorage.getItem('school_sessions');
    return saved ? JSON.parse(saved) : INITIAL_SESSIONS;
  });

  const [allJustifications, setAllJustifications] = useState<Justification[]>(() => {
    const saved = localStorage.getItem('school_justifications');
    return saved ? JSON.parse(saved) : INITIAL_JUSTIFICATIONS;
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

  // Data filtered strictly by tenantId (Multi-tenancy isolation enforcement)
  const students = allStudents.filter((s) => s.tenantId === tenantId);
  const sessions = allSessions.filter((s) => s.tenantId === tenantId);
  const justifications = allJustifications.filter((j) => j.tenantId === tenantId);
  const notifications = allNotifications.filter((n) => n.tenantId === tenantId);
  const auditLogs = allAuditLogs.filter((a) => a.tenantId === tenantId);

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
          const msg = isAbsent
            ? `المكرم ولي أمر الطالب (${student.fullName}): نفيدكم بتسجيل غياب نجلكم عن (${targetSession.subject || 'الدوام اليومي'}) بتاريخ ${targetSession.date}. يرجى تقديم العذر عبر الرابط المدرسي.`
            : `المكرم ولي أمر الطالب (${student.fullName}): تم تسجيل تأخر نجلكم (${rec.minutesLate || 10} دقيقة) عن (${targetSession.subject || 'الدوام اليومي'}) بتاريخ ${targetSession.date}.`;

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
            messageText: msg,
            channel: 'SMS',
            status: 'sent', // Simulate fast transmission
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
    const student = students.find((s) => s.id === studentId);
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

  return (
    <AttendanceContext.Provider
      value={{
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
        submitSession,
        reopenSession,
        createNewSession,
        createJustification,
        reviewJustification,
        retryNotification,
        retryAllFailedNotifications,
        addAuditLog,
        importStudents,
        updateSettings,
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

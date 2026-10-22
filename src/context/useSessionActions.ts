import type {
  AttendanceRecord,
  AttendanceSession,
  AttendanceStatus,
  AuditLog,
  NotificationOutboxItem,
  SchoolSettings,
  Student,
  UserProfile,
} from '../types/attendance';
import type { User as FirebaseUser } from 'firebase/auth';

interface UseSessionActionsParams {
  tenantId: string;
  firebaseUser: FirebaseUser | null;
  currentUser: UserProfile;
  canEditSession: (session: AttendanceSession) => boolean;
  canReopenSessions: boolean;
  allSessions: AttendanceSession[];
  sessions: AttendanceSession[];
  setAllSessions: React.Dispatch<React.SetStateAction<AttendanceSession[]>>;
  students: Student[];
  settings: SchoolSettings;
  setAllNotifications: React.Dispatch<React.SetStateAction<NotificationOutboxItem[]>>;
  addAuditLog: (entry: Omit<AuditLog, 'id' | 'tenantId' | 'timestamp'>) => void;
}

export function useSessionActions({
  tenantId,
  firebaseUser,
  currentUser,
  canEditSession,
  canReopenSessions,
  allSessions,
  sessions,
  setAllSessions,
  students,
  settings,
  setAllNotifications,
  addAuditLog,
}: UseSessionActionsParams) {
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
        const updatedRecords = (sess.records || []).map((rec) => {
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
        const updatedRecords = (sess.records || []).map((r) => ({
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
        const updatedRecords = (sess.records || []).map((r) => {
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
    (targetSession.records || []).forEach((rec) => {
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
  return {
    updateRecord,
    setAllPresentInDraft,
    quickMarkGroupAsPresent,
    submitSession,
    reopenSession,
    createNewSession,
  };
}

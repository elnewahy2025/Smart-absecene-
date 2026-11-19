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
import { doc, setDoc } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { toFirestoreData } from './attendanceContextSupport';
import { createAttendanceRecords, getAttendanceRoster } from '../utils/attendanceRoster';
import { computeStudentMetricsFromSessions, recountSession } from '../utils/attendanceMath';

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
  setAllStudents: React.Dispatch<React.SetStateAction<Student[]>>;
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
  setAllStudents,
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
        return recountSession({
          ...sess,
          records: updatedRecords,
        });
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
        return recountSession({
          ...sess,
          records: updatedRecords,
        });
      })
    );
  };

  const quickMarkGroupAsPresent = (sessionId: string, studentIds?: string[]) => {
    const targetSession = allSessions.find((s) => s.id === sessionId);
    if (!targetSession || !canEditSession(targetSession)) {
      return { updatedCount: 0, message: 'لا تملك صلاحية التعديل على هذا الكشف أو المستخدم غير مصرح له بتعديل هذا الكشف.' };
    }
    const targetIdsSet = studentIds && studentIds.length > 0 ? new Set(studentIds) : null;
    const affectedCount = targetIdsSet
      ? (targetSession.records || []).filter((r) => targetIdsSet.has(r.studentId)).length
      : (targetSession.records || []).length;

    setAllSessions((prev) =>
      prev.map((sess) => {
        if (sess.id !== sessionId) return sess;
        const updatedRecords = (sess.records || []).map((r) => {
          if (!targetIdsSet || targetIdsSet.has(r.studentId)) {
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

        return recountSession({
          ...sess,
          records: updatedRecords,
        });
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
          ? `تمييز جماعي (Quick Mark): تم تعيين ${studentIds.length} طالب إلى الحالة 'حاضر' افتراضيًا.`
          : `تمييز جماعي (Quick Mark): تم تعيين جميع الطلاب في الكشف 'حاضر' لتسريع التحديد وتقليل الغياب إلى الإدخال اليدوي.`,
      detailsEn:
        studentIds && studentIds.length > 0
          ? `Quick Mark: ${studentIds.length} students were assigned to the 'Present' status as a group by default.`
          : `Quick Mark: All students in the roster were set to 'Present' to speed up marking and limit absences to manual entry.`,
    });

    return {
      updatedCount: affectedCount,
      message:
        studentIds && studentIds.length > 0
          ? `تم تمييز ${studentIds.length} طالب باعتبارهم حاضرون بنجاح.`
          : `تم تمييز جميع الطلاب في الكشف باعتبارهم حاضرون. تم حفظ الدفعة بنجاح.`,
    };
  };

  const submitSession = (sessionId: string) => {
    const targetSession = sessions.find((s) => s.id === sessionId);
    if (!targetSession) {
      return { success: false, message: 'تعذر العثور على الكشف.' };
    }
    if (!canEditSession(targetSession)) {
      return { success: false, message: 'لا تملك صلاحية اعتماد وتقديم الكشف (RBAC).' };
    }

    const now = new Date().toISOString();
    const newNotifications: NotificationOutboxItem[] = [];

    // Process absent & late students for Outbox pattern
    (targetSession.records || []).forEach((rec) => {
      if (rec.status === 'absent' || rec.status === 'late') {
        const student = students.find((s) => s.id === rec.studentId);
        if (student) {
          const isAbsent = rec.status === 'absent';
          const defaultAbsentTpl = settings.absenceMessageTemplate || 'عزيزي ولي الأمر ({{student_name}}): نود إبلاغكم بغياب الطالب في مادة ({{subject}}) بتاريخ {{date}}. يرجى التواصل معنا بخصوص الغياب.';
          const defaultLateTpl = settings.lateMessageTemplate || 'عزيزي ولي الأمر ({{student_name}}): نود إبلاغكم بتأخر الطالب ({{minutes}} دقيقة) في مادة ({{subject}}) بتاريخ {{date}}.';

          const msg = isAbsent
            ? defaultAbsentTpl
                .replace('{student_name}', student.fullName)
                .replace('{subject}', targetSession.subject || 'حضور يومي')
                .replace('{date}', targetSession.date)
            : defaultLateTpl
                .replace('{student_name}', student.fullName)
                .replace('{minutes}', String(rec.minutesLate || 10))
                .replace('{date}', targetSession.date);

          const ch: 'SMS' | 'WhatsApp' = settings.preferredChannel === 'WhatsApp' ? 'WhatsApp' : 'SMS';

          newNotifications.push({
            id: `notify-${Date.now()}-${student.id}`,
            tenantId: tenantId,
            recipientPhone: student.guardianPhone,
            recipientName: student.guardianName,
            studentId: student.id,
            studentName: student.fullName,
            absenceDate: targetSession.date,
            sessionTitle: `${targetSession.subject || 'حضور يومي'} - ${targetSession.className}`,
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
    const updatedSessions = allSessions.map((s) =>
      s.id === sessionId
        ? {
            ...s,
            status: 'submitted' as const,
            submittedAt: now,
            submittedBy: currentUser.name,
          }
        : s
    );
    setAllSessions(updatedSessions);

    // Recalculate student attendance metrics from all submitted sessions in this tenant
    const submittedTenantSessions = updatedSessions.filter(
      (s) => s.tenantId === tenantId && s.status === 'submitted'
    );
    const affectedStudentIds = new Set(targetSession.records.map((r) => r.studentId));
    const computedMetrics = computeStudentMetricsFromSessions(
      submittedTenantSessions,
      affectedStudentIds
    );

    if (computedMetrics.size > 0) {
      setAllStudents((prev) =>
        prev.map((s) => {
          const metrics = computedMetrics.get(s.id);
          return metrics ? { ...s, ...metrics } : s;
        })
      );

      // Firestore rules only allow admin/registrar (and the platform owner) to
      // update students/{id}. Teacher submissions still refresh these metrics:
      // they are re-derived from the submitted attendance_sessions on every load
      // (useScopedEntities / useSchoolAnalytics), so no write is attempted here.
      if (firebaseUser && ['admin', 'registrar', 'super_admin'].includes(currentUser.role)) {
        computedMetrics.forEach((metrics, studentId) => {
          void setDoc(doc(db, 'students', studentId), metrics, { merge: true }).catch((error) =>
            console.error('[SESSIONS] Could not update student attendance metrics:', error)
          );
        });
      }
    }

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
      details: `اعتماد كشف الحضور (مادة: ${targetSession.subject || 'حضور يومي'}) للصف ${targetSession.className} وإنشاء ${newNotifications.length} إشعارات ولي الأمر.`,
      detailsEn: `The attendance sheet (${targetSession.subject || 'Daily Attendance'}) for class ${targetSession.className} was approved and submitted, and ${newNotifications.length} automatic guardian notifications were generated.`,
    });

    return {
      success: true,
      message: `تم اعتماد وتقديم الكشف بنجاح وإنشاء ${newNotifications.length} إشعار للغائبين والمتأخرين.`,
    };
  };

  const reopenSession = (sessionId: string, reason: string) => {
    if (!canReopenSessions) {
      return { success: false, message: 'لا تملك صلاحية إعادة فتح الكشف المعتمد (مدير أو مسجل فقط).' };
    }
    if (!reason || reason.trim().length < 5) {
      return { success: false, message: 'يجب إدخال سبب إعادة الفتح بوضوح (5 أحرف على الأقل).' };
    }

    const targetSession = sessions.find((s) => s.id === sessionId);
    if (!targetSession) return { success: false, message: 'تعذر العثور على الكشف.' };

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
    const classStudents = getAttendanceRoster(students, className, classId);
    const today = new Date().toISOString().split('T')[0];
    const sessionId = `sess-${Date.now()}`;
    const records: AttendanceRecord[] = createAttendanceRecords(
      sessionId,
      classStudents,
      currentUser.name,
      new Date().toISOString()
    );

    const newSession: AttendanceSession = {
      id: sessionId,
      tenantId,
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

    if (firebaseUser) {
      void setDoc(doc(db, 'attendance_sessions', newSession.id), toFirestoreData(newSession), { merge: true }).catch(
        (error) => console.error('[SESSIONS] Could not persist newly created session:', error)
      );
    }

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

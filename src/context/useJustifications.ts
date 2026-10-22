import type { User as FirebaseUser } from 'firebase/auth';
import { db, handleFirestoreError, OperationType } from '../lib/firebase';
import { doc, setDoc } from 'firebase/firestore';
import type {
  AttendanceSession,
  AttendanceStatus,
  AuditLog,
  Justification,
  NotificationOutboxItem,
  SchoolSettings,
  Student,
  TenantSchoolProfile,
  UserProfile,
  UserRole,
} from '../types/attendance';
import { toFirestoreData } from './attendanceContextSupport';

interface UseJustificationsParams {
  tenantId: string;
  firebaseUser: FirebaseUser | null;
  currentUser: UserProfile;
  currentUserRole: UserRole;
  parentChildIds: string[];
  canReviewJustifications: boolean;
  schoolProfile: TenantSchoolProfile;
  isOffDay: (date: string) => { isOff: boolean; reason?: string };
  allStudents: Student[];
  students: Student[];
  justifications: Justification[];
  settings: SchoolSettings;
  setAllJustifications: React.Dispatch<React.SetStateAction<Justification[]>>;
  setAllSessions: React.Dispatch<React.SetStateAction<AttendanceSession[]>>;
  setAllNotifications: React.Dispatch<React.SetStateAction<NotificationOutboxItem[]>>;
  addAuditLog: (entry: Omit<AuditLog, 'id' | 'tenantId' | 'timestamp'>) => void;
}

export function useJustifications({
  tenantId,
  firebaseUser,
  currentUser,
  currentUserRole,
  parentChildIds,
  canReviewJustifications,
  schoolProfile,
  isOffDay,
  allStudents,
  students,
  justifications,
  settings,
  setAllJustifications,
  setAllSessions,
  setAllNotifications,
  addAuditLog,
}: UseJustificationsParams) {
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
  return { createJustification, reviewJustification, updateJustificationAnalysis };
}

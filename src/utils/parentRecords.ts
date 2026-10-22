import type {
  AttendanceSession,
  AttendanceStatus,
  Justification,
  NotificationOutboxItem,
  Student,
  StudentBehaviourIncident,
} from '../types/attendance';

export interface ParentSessionRecord {
  sessionId: string;
  date: string;
  subject?: string;
  sessionType: 'daily' | 'period';
  periodNumber?: number;
  className: string;
  status: string;
  minutesLate?: number;
  note?: string;
  teacherName?: string;
  justification?: Justification;
}

export type ParentRecordItem = {
  id: string;
  date: string;
  time?: string;
  type: 'absence' | 'late' | 'infraction' | 'positive' | 'justification' | 'notification';
  title: string;
  subtitle?: string;
  statusBadge: {
    label: string;
    variant: 'danger' | 'warning' | 'success' | 'info' | 'neutral';
  };
  details: string;
  notes?: string;
  actionRequired?: boolean;
  rawRecord:
    | { type: 'absence_late'; data: ParentSessionRecord }
    | { type: 'infraction'; data: StudentBehaviourIncident }
    | { type: 'justification'; data: Justification }
    | { type: 'notification'; data: NotificationOutboxItem };
};

export type ParentRecordTab =
  | 'all'
  | 'absences'
  | 'infractions'
  | 'justifications'
  | 'messages';

export type ParentRecordStatusFilter = 'all' | 'unexcused' | 'excused' | 'late';

export interface ParentRecordsInput {
  student: Student;
  sessions: AttendanceSession[];
  justifications: Justification[];
  incidents: StudentBehaviourIncident[];
  notifications: NotificationOutboxItem[];
}

export interface ParentRecordsData {
  sessionRecords: ParentSessionRecord[];
  incidents: StudentBehaviourIncident[];
  infractionsOnly: StudentBehaviourIncident[];
  justifications: Justification[];
  notifications: NotificationOutboxItem[];
  items: ParentRecordItem[];
}

// Helper: Arabic Day name from YYYY-MM-DD
export const getArabicDayName = (dateStr: string): string => {
  try {
    const d = new Date(dateStr + 'T00:00:00');
    return d.toLocaleDateString('ar-SA', { weekday: 'long' });
  } catch {
    return '';
  }
};

/** Builds every record collection shown on the parent portal records table. */
export function buildParentRecords(input: ParentRecordsInput): ParentRecordsData {
  const { student, sessions, justifications, incidents, notifications } = input;

  // 1. Process Absence & Late Records for this student
  const sessionRecords: ParentSessionRecord[] = (() => {
    const list: {
      sessionId: string;
      date: string;
      subject?: string;
      sessionType: 'daily' | 'period';
      periodNumber?: number;
      className: string;
      status: AttendanceStatus | string;
      minutesLate?: number;
      note?: string;
      teacherName?: string;
      justification?: Justification;
    }[] = [];

    sessions.forEach((sess) => {
      const records = Array.isArray(sess.records) ? sess.records : [];
      const rec = records.find((r) => r && r.studentId === student.id);
      if (rec && (rec.status === 'absent' || rec.status === 'late' || rec.status === 'excused_absence')) {
        const linkedJust = justifications.find((j) => j.absenceDate === sess.date);
        list.push({
          sessionId: sess.id,
          date: sess.date,
          subject: sess.subject,
          sessionType: sess.sessionType,
          periodNumber: sess.periodNumber,
          className: sess.className,
          status: rec.status,
          minutesLate: rec.minutesLate,
          note: rec.note,
          teacherName: sess.teacherName,
          justification: linkedJust,
        });
      }
    });

    return list.sort((a, b) => b.date.localeCompare(a.date));
  })();

  const studentAbsenceAndLateRecords = sessionRecords;

  // 2. Process Infractions & Positive Conduct for this student
  const studentIncidents = (() => {
    return incidents
      .filter((inc) => inc.studentId === student.id)
      .sort((a, b) => b.date.localeCompare(a.date));
  })();

  const studentInfractionsOnly = (() => {
    return studentIncidents.filter((inc) => inc.type === 'infraction');
  })();

  // 3. Process Justifications for this student
  const studentJustifications = (() => {
    return justifications
      .filter((j) => j.studentId === student.id)
      .sort((a, b) => b.absenceDate.localeCompare(a.absenceDate));
  })();

  // 4. Process Notifications for this student / guardian
  const studentNotifications = (() => {
    return notifications
      .filter(
        (n) => n.studentId === student.id || n.recipientPhone === student.guardianPhone
      )
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  })();

  // 5. Build Unified Master Records List
  const items = (() => {
    const items: ParentRecordItem[] = [];

    // Add Absences and Lates
    studentAbsenceAndLateRecords.forEach((item) => {
      const isAbsent = item.status === 'absent';
      const isLate = item.status === 'late';
      const isExcused = item.status === 'excused_absence';

      items.push({
        id: `att-${item.sessionId}-${item.date}`,
        date: item.date,
        type: isLate ? 'late' : 'absence',
        title: isAbsent
          ? 'غياب عن الدوام المدرسي'
          : isLate
          ? `تأخر صباحي (${item.minutesLate || 15} دقيقة)`
          : 'غياب بعذر معتمد',
        subtitle: item.subject
          ? `مادة ${item.subject} (الحصة ${item.periodNumber || 1})`
          : item.sessionType === 'daily'
          ? 'حضور يومي شامل'
          : `الحصة ${item.periodNumber || 1}`,
        statusBadge: isAbsent
          ? item.justification
            ? item.justification.status === 'approved'
              ? { label: 'عذر معتمد ✅', variant: 'success' }
              : item.justification.status === 'rejected'
              ? { label: 'عذر مرفوض ❌', variant: 'danger' }
              : { label: 'عذر قيد المراجعة ⏳', variant: 'warning' }
            : { label: 'بدون عذر ❌', variant: 'danger' }
          : isLate
          ? { label: `متأخر ${item.minutesLate || 15} د`, variant: 'warning' }
          : { label: 'عذر معتمد ✅', variant: 'success' },
        details: item.note || 'تم الرصد الآلي في كشف التحضير المعتمد',
        notes: item.teacherName ? `المعلم: ${item.teacherName}` : undefined,
        actionRequired: isAbsent && !item.justification,
        rawRecord: { type: 'absence_late', data: item },
      });
    });

    // Add Infractions & Behaviour
    studentIncidents.forEach((inc) => {
      const isInfraction = inc.type === 'infraction';
      items.push({
        id: `inc-${inc.id}`,
        date: inc.date,
        time: inc.time,
        type: isInfraction ? 'infraction' : 'positive',
        title: inc.title,
        subtitle: isInfraction
          ? inc.severity === 'major'
            ? 'مخالفة جسيمة (درجة 3)'
            : inc.severity === 'moderate'
            ? 'مخالفة متوسطة (درجة 2)'
            : 'مخالفة بسيطة (درجة 1)'
          : 'سلوك إيجابي وتميز (+)',
        statusBadge: isInfraction
          ? { label: `${inc.points} نقطة`, variant: 'danger' }
          : { label: `+${inc.points} نقطة`, variant: 'success' },
        details: inc.description,
        notes: inc.actionTaken ? `الإجراء: ${inc.actionTaken}` : undefined,
        rawRecord: { type: 'infraction', data: inc },
      });
    });

    // Add Justifications
    studentJustifications.forEach((just) => {
      items.push({
        id: `just-${just.id}`,
        date: just.absenceDate,
        type: 'justification',
        title:
          just.reasonType === 'medical'
            ? 'عذر وتقرير طبي'
            : just.reasonType === 'family'
            ? 'عذر أسري'
            : 'عذر سفر / آخر',
        subtitle: just.attachmentName || 'طلب تبرير غياب',
        statusBadge:
          just.status === 'approved'
            ? { label: 'معتمد ومقبول ✅', variant: 'success' }
            : just.status === 'rejected'
            ? { label: 'مرفوض ❌', variant: 'danger' }
            : { label: 'قيد التدقيق ⏳', variant: 'warning' },
        details: just.guardianExplanation,
        notes: just.reviewedBy ? `المعتمد: ${just.reviewedBy}` : undefined,
        rawRecord: { type: 'justification', data: just },
      });
    });

    // Add Notifications
    studentNotifications.forEach((notif) => {
      items.push({
        id: `notif-${notif.id}`,
        date: notif.absenceDate || (notif.createdAt ? String(notif.createdAt).slice(0, 10) : new Date().toISOString().slice(0, 10)),
        time: notif.createdAt
          ? new Date(notif.createdAt).toLocaleTimeString('ar-SA', {
              hour: '2-digit',
              minute: '2-digit',
            })
          : '--:--',
        type: 'notification',
        title:
          notif.category === 'warning'
            ? 'إنذار أكاديمي رسمي'
            : notif.statusType === 'absent'
            ? 'إشعار غياب فوري'
            : notif.statusType === 'late'
            ? 'تنبيه تأخر صباحي'
            : notif.category === 'excuse_approved'
            ? 'اعتماد عذر رسمي'
            : 'تعميم وإشعار مدرسي',
        subtitle: `${notif.channel === 'WhatsApp' ? 'واتساب WhatsApp' : 'رسالة نصية SMS'} (${notif.recipientPhone})`,
        statusBadge: { label: 'تم التسليم ✅', variant: 'info' },
        details: notif.messageText,
        rawRecord: { type: 'notification', data: notif },
      });
    });

    return items.sort((a, b) => b.date.localeCompare(a.date));
  })();

  return {
    sessionRecords,
    incidents: studentIncidents,
    infractionsOnly: studentInfractionsOnly,
    justifications: studentJustifications,
    notifications: studentNotifications,
    items,
  };
}

export interface ParentRecordFilters {
  tab: ParentRecordTab;
  query: string;
  statusFilter: ParentRecordStatusFilter;
}

/** Applies the tab, free-text search and status filters to the unified list. */
export function filterParentRecords(
  unifiedRecords: ParentRecordItem[],
  filters: ParentRecordFilters
): ParentRecordItem[] {
  const { tab: activeTab, query: searchQuery, statusFilter } = filters;

    let result = unifiedRecords;

    if (activeTab === 'absences') {
      result = result.filter((r) => r.type === 'absence' || r.type === 'late');
    } else if (activeTab === 'infractions') {
      result = result.filter((r) => r.type === 'infraction');
    } else if (activeTab === 'justifications') {
      result = result.filter((r) => r.type === 'justification');
    } else if (activeTab === 'messages') {
      result = result.filter((r) => r.type === 'notification');
    }

    if (searchQuery.trim()) {
      const q = searchQuery.trim().toLowerCase();
      result = result.filter(
        (r) =>
          r.title.toLowerCase().includes(q) ||
          r.details.toLowerCase().includes(q) ||
          r.date.includes(q) ||
          (r.subtitle && r.subtitle.toLowerCase().includes(q)) ||
          (r.notes && r.notes.toLowerCase().includes(q))
      );
    }

    if (statusFilter !== 'all' && (activeTab === 'all' || activeTab === 'absences')) {
      if (statusFilter === 'unexcused') {
        result = result.filter(
          (r) => r.type === 'absence' && r.statusBadge.variant === 'danger'
        );
      } else if (statusFilter === 'excused') {
        result = result.filter(
          (r) =>
            (r.type === 'absence' && r.statusBadge.variant === 'success') ||
            r.type === 'justification'
        );
      } else if (statusFilter === 'late') {
        result = result.filter((r) => r.type === 'late');
      }
    }

    return result;
}

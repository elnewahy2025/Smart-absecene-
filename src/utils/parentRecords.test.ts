import { describe, expect, it } from 'vitest';
import type {
  AttendanceSession,
  Justification,
  NotificationOutboxItem,
  Student,
  StudentBehaviourIncident,
} from '../types/attendance';
import {
  buildParentRecords,
  filterParentRecords,
  getArabicDayName,
  type ParentRecordItem,
} from './parentRecords';

const student = {
  id: 'std-1',
  tenantId: 'school-1',
  studentNumber: '20260001',
  nationalId: '3000000001',
  fullName: 'سعد الحربي',
  grade: 'الصف العاشر',
  className: '10 / أ',
  classId: 'class-10a',
  guardianName: 'أحمد الحربي',
  guardianPhone: '+966500000001',
  guardianRelationship: 'father',
  totalAbsences: 0,
  totalLates: 0,
  attendanceRate: 100,
} as Student;

function makeSession(
  id: string,
  date: string,
  status: string,
  overrides: Partial<AttendanceSession> = {}
): AttendanceSession {
  return {
    id,
    tenantId: 'school-1',
    date,
    sessionType: 'daily',
    classId: 'class-10a',
    className: '10 / أ',
    grade: 'الصف العاشر',
    teacherId: 't1',
    teacherName: 'أ. خالد',
    status: 'submitted',
    totalStudents: 1,
    presentCount: 0,
    absentCount: 0,
    lateCount: 0,
    excusedCount: 0,
    records: [
      {
        id: `${id}-rec`,
        sessionId: id,
        studentId: 'std-1',
        status: status as AttendanceSession['records'][0]['status'],
        minutesLate: status === 'late' ? 12 : undefined,
        note: status === 'late' ? 'تأخر 12 دقيقة' : undefined,
        updatedAt: '2026-01-01T00:00:00.000Z',
        updatedBy: 't1',
      },
    ],
    ...overrides,
  } as AttendanceSession;
}

function makeJustification(overrides: Partial<Justification> = {}): Justification {
  return {
    id: 'just-1',
    tenantId: 'school-1',
    studentId: 'std-1',
    studentName: 'سعد الحربي',
    className: '10 / أ',
    absenceDate: '2026-01-05',
    reasonType: 'medical',
    guardianExplanation: 'تقرير طبي',
    status: 'approved',
    ...overrides,
  } as Justification;
}

function makeIncident(overrides: Partial<StudentBehaviourIncident> = {}): StudentBehaviourIncident {
  return {
    id: 'inc-1',
    tenantId: 'school-1',
    studentId: 'std-1',
    studentName: 'سعد الحربي',
    className: '10 / أ',
    date: '2026-01-06',
    time: '09:15',
    type: 'infraction',
    category: 'disruption',
    title: 'مقاطعة الحصة',
    description: 'تحدث أثناء الشرح',
    severity: 'major',
    points: -3,
    actionTaken: 'إشعار ولي الأمر',
    recordedBy: 't1',
    guardianNotified: true,
    ...overrides,
  } as StudentBehaviourIncident;
}

function makeNotification(overrides: Partial<NotificationOutboxItem> = {}): NotificationOutboxItem {
  return {
    id: 'notif-1',
    tenantId: 'school-1',
    recipientPhone: '+966500000001',
    recipientName: 'أحمد الحربي',
    studentId: 'std-1',
    guardianPhone: '+966500000001',
    studentName: 'سعد الحربي',
    absenceDate: '2026-01-07',
    sessionTitle: 'حضور يومي',
    statusType: 'absent',
    category: 'absence',
    messageText: 'تم تسجيل غياب الطالب',
    channel: 'WhatsApp',
    status: 'sent',
    retryCount: 0,
    createdAt: '2026-01-07T06:30:00.000Z',
    ...overrides,
  } as NotificationOutboxItem;
}

function build(overrides: Partial<Parameters<typeof buildParentRecords>[0]> = {}) {
  return buildParentRecords({
    student,
    sessions: [],
    justifications: [],
    incidents: [],
    notifications: [],
    ...overrides,
  });
}

describe('getArabicDayName', () => {
  it('returns the Arabic weekday for a date', () => {
    expect(getArabicDayName('2026-01-02')).toBe('الجمعة');
  });
});

describe('buildParentRecords', () => {
  it('collects only absence, late and excused sessions for this student', () => {
    const data = build({
      sessions: [
        makeSession('s1', '2026-01-05', 'absent'),
        makeSession('s2', '2026-01-04', 'late', { subject: 'رياضيات', periodNumber: 3 }),
        makeSession('s3', '2026-01-03', 'excused_absence'),
        makeSession('s4', '2026-01-02', 'present'),
      ],
    });

    expect(data.sessionRecords.map((r) => r.sessionId)).toEqual(['s1', 's2', 's3']);
    expect(data.sessionRecords[1]).toMatchObject({ subject: 'رياضيات', periodNumber: 3 });
  });

  it('links a justification to the absence of the same date', () => {
    const justification = makeJustification({ id: 'just-linked', absenceDate: '2026-01-05' });
    const data = build({
      sessions: [makeSession('s1', '2026-01-05', 'absent')],
      justifications: [justification],
    });

    expect(data.sessionRecords[0].justification?.id).toBe('just-linked');
  });

  it('builds absence badges from the linked justification status', () => {
    const data = build({
      sessions: [
        makeSession('s-approved', '2026-01-05', 'absent'),
        makeSession('s-rejected', '2026-01-04', 'absent'),
        makeSession('s-pending', '2026-01-03', 'absent'),
        makeSession('s-none', '2026-01-02', 'absent'),
      ],
      justifications: [
        makeJustification({ id: 'j1', absenceDate: '2026-01-05', status: 'approved' }),
        makeJustification({ id: 'j2', absenceDate: '2026-01-04', status: 'rejected' }),
        makeJustification({ id: 'j3', absenceDate: '2026-01-03', status: 'pending' }),
      ],
    });

    const byId = Object.fromEntries(data.items.map((i) => [i.id, i]));
    expect(byId['att-s-approved-2026-01-05'].statusBadge).toEqual({
      label: 'عذر معتمد ✅',
      variant: 'success',
    });
    expect(byId['att-s-rejected-2026-01-04'].statusBadge.variant).toBe('danger');
    expect(byId['att-s-rejected-2026-01-04'].statusBadge.label).toContain('عذر مرفوض');
    expect(byId['att-s-pending-2026-01-03'].statusBadge.variant).toBe('warning');
    expect(byId['att-s-none-2026-01-02'].statusBadge).toEqual({
      label: 'بدون عذر ❌',
      variant: 'danger',
    });
    expect(byId['att-s-none-2026-01-02'].actionRequired).toBe(true);
  });

  it('renders late records with minutes, subtitle and teacher note', () => {
    const data = build({
      sessions: [makeSession('s-late', '2026-01-04', 'late', { subject: 'علوم', periodNumber: 2 })],
    });

    const item = data.items[0];
    expect(item.type).toBe('late');
    expect(item.title).toBe('تأخر صباحي (12 دقيقة)');
    expect(item.subtitle).toBe('مادة علوم (الحصة 2)');
    expect(item.statusBadge).toEqual({ label: 'متأخر 12 د', variant: 'warning' });
    expect(item.notes).toBe('المعلم: أ. خالد');
  });

  it('separates infractions from positive conduct and labels severity', () => {
    const data = build({
      incidents: [
        makeIncident({ id: 'inc-major', date: '2026-01-06', severity: 'major' }),
        makeIncident({
          id: 'inc-moderate',
          date: '2026-01-05',
          severity: 'moderate',
          points: -2,
        }),
        makeIncident({
          id: 'inc-positive',
          date: '2026-01-04',
          type: 'positive',
          severity: 'minor',
          points: 3,
          title: 'مساعدة الزملاء',
          actionTaken: undefined,
        }),
        makeIncident({ id: 'inc-other', studentId: 'std-2' }),
      ],
    });

    expect(data.incidents).toHaveLength(3);
    expect(data.infractionsOnly).toHaveLength(2);

    const byId = Object.fromEntries(data.items.map((i) => [i.id, i]));
    expect(byId['inc-inc-major'].subtitle).toBe('مخالفة جسيمة (درجة 3)');
    expect(byId['inc-inc-moderate'].subtitle).toBe('مخالفة متوسطة (درجة 2)');
    expect(byId['inc-inc-positive']).toMatchObject({
      type: 'positive',
      subtitle: 'سلوك إيجابي وتميز (+)',
      statusBadge: { label: '+3 نقطة', variant: 'success' },
    });
  });

  it('labels justification reason types and review status', () => {
    const data = build({
      justifications: [
        makeJustification({ id: 'j-med', absenceDate: '2026-01-05', reasonType: 'medical' }),
        makeJustification({
          id: 'j-fam',
          absenceDate: '2026-01-04',
          reasonType: 'family',
          status: 'pending',
        }),
        makeJustification({
          id: 'j-travel',
          absenceDate: '2026-01-03',
          reasonType: 'travel',
          status: 'rejected',
          reviewedBy: 'المدير',
        }),
      ],
    });

    const byId = Object.fromEntries(data.items.map((i) => [i.id, i]));
    expect(byId['just-j-med'].title).toBe('عذر وتقرير طبي');
    expect(byId['just-j-fam'].title).toBe('عذر أسري');
    expect(byId['just-j-fam'].statusBadge.variant).toBe('warning');
    expect(byId['just-j-travel'].title).toBe('عذر سفر / آخر');
    expect(byId['just-j-travel'].statusBadge.variant).toBe('danger');
    expect(byId['just-j-travel'].notes).toBe('المعتمد: المدير');
  });

  it('labels notifications by category, status and channel', () => {
    const data = build({
      notifications: [
        makeNotification({ id: 'n-warning', absenceDate: '2026-01-07', category: 'warning' }),
        makeNotification({ id: 'n-absent', absenceDate: '2026-01-06', statusType: 'absent', category: 'absence' }),
        makeNotification({ id: 'n-late', absenceDate: '2026-01-05', statusType: 'late', category: 'late' }),
        makeNotification({ id: 'n-excuse', absenceDate: '2026-01-04', category: 'excuse_approved', statusType: 'present' }),
        makeNotification({ id: 'n-broadcast', absenceDate: '2026-01-03', category: 'broadcast', statusType: 'present' }),
        makeNotification({
          id: 'n-unrelated',
          studentId: 'std-2',
          recipientPhone: '+966500000002',
          guardianPhone: '+966500000002',
        }),
      ],
    });

    const byId = Object.fromEntries(data.items.map((i) => [i.id, i]));
    expect(byId['notif-n-warning'].title).toBe('إنذار أكاديمي رسمي');
    expect(byId['notif-n-absent'].title).toBe('إشعار غياب فوري');
    expect(byId['notif-n-late'].title).toBe('تنبيه تأخر صباحي');
    expect(byId['notif-n-excuse'].title).toBe('اعتماد عذر رسمي');
    expect(byId['notif-n-broadcast'].title).toBe('تعميم وإشعار مدرسي');
    expect(byId['notif-n-absent'].subtitle).toContain('واتساب WhatsApp');
    expect(byId['notif-n-absent'].statusBadge).toEqual({ label: 'تم التسليم ✅', variant: 'info' });
    expect(data.notifications).toHaveLength(5);
  });

  it('matches notifications by the guardian phone too', () => {
    const data = build({
      notifications: [
        makeNotification({ id: 'n-phone', studentId: 'std-9', guardianPhone: student.guardianPhone }),
      ],
    });

    expect(data.notifications).toHaveLength(1);
  });

  it('sorts the unified list by date descending', () => {
    const data = build({
      sessions: [makeSession('s1', '2026-01-01', 'absent'), makeSession('s2', '2026-01-03', 'absent')],
      incidents: [makeIncident({ id: 'inc-1', date: '2026-01-02' })],
    });

    expect(data.items.map((i) => i.date)).toEqual(['2026-01-03', '2026-01-02', '2026-01-01']);
  });
});

describe('filterParentRecords', () => {
  const records: ParentRecordItem[] = [
    {
      id: 'a',
      date: '2026-01-05',
      type: 'absence',
      title: 'غياب عن الدوام المدرسي',
      subtitle: 'حضور يومي شامل',
      statusBadge: { label: 'بدون عذر ❌', variant: 'danger' },
      details: 'تم الرصد الآلي',
      rawRecord: { type: 'infraction', data: {} as StudentBehaviourIncident },
    },
    {
      id: 'b',
      date: '2026-01-04',
      type: 'late',
      title: 'تأخر صباحي (12 دقيقة)',
      statusBadge: { label: 'متأخر 12 د', variant: 'warning' },
      details: 'تأخر 12 دقيقة',
      rawRecord: { type: 'infraction', data: {} as StudentBehaviourIncident },
    },
    {
      id: 'c',
      date: '2026-01-03',
      type: 'infraction',
      title: 'مقاطعة الحصة',
      statusBadge: { label: '-3 نقطة', variant: 'danger' },
      details: 'تحدث أثناء الشرح',
      rawRecord: { type: 'infraction', data: {} as StudentBehaviourIncident },
    },
    {
      id: 'd',
      date: '2026-01-02',
      type: 'justification',
      title: 'عذر وتقرير طبي',
      statusBadge: { label: 'معتمد ومقبول ✅', variant: 'success' },
      details: 'تقرير طبي',
      rawRecord: { type: 'infraction', data: {} as StudentBehaviourIncident },
    },
    {
      id: 'e',
      date: '2026-01-01',
      type: 'notification',
      title: 'إشعار غياب فوري',
      statusBadge: { label: 'تم التسليم ✅', variant: 'info' },
      details: 'تم تسجيل غياب الطالب',
      rawRecord: { type: 'infraction', data: {} as StudentBehaviourIncident },
    },
  ];

  const ids = (filters: Parameters<typeof filterParentRecords>[1]) =>
    filterParentRecords(records, filters).map((r) => r.id);

  it('filters by tab', () => {
    expect(ids({ tab: 'absences', query: '', statusFilter: 'all' })).toEqual(['a', 'b']);
    expect(ids({ tab: 'infractions', query: '', statusFilter: 'all' })).toEqual(['c']);
    expect(ids({ tab: 'justifications', query: '', statusFilter: 'all' })).toEqual(['d']);
    expect(ids({ tab: 'messages', query: '', statusFilter: 'all' })).toEqual(['e']);
  });

  it('searches across title, details, date, subtitle and notes', () => {
    expect(ids({ tab: 'all', query: 'مقاطعة', statusFilter: 'all' })).toEqual(['c']);
    expect(ids({ tab: 'all', query: '2026-01-05', statusFilter: 'all' })).toEqual(['a']);
    expect(ids({ tab: 'all', query: 'حضور يومي', statusFilter: 'all' })).toEqual(['a']);
    expect(ids({ tab: 'all', query: 'تقرير طبي', statusFilter: 'all' })).toEqual(['d']);
    expect(ids({ tab: 'all', query: 'لا شيء', statusFilter: 'all' })).toEqual([]);
  });

  it('applies status filters only on the all and absences tabs', () => {
    expect(ids({ tab: 'all', query: '', statusFilter: 'unexcused' })).toEqual(['a']);
    expect(ids({ tab: 'all', query: '', statusFilter: 'excused' })).toEqual(['d']);
    expect(ids({ tab: 'absences', query: '', statusFilter: 'excused' })).toEqual([]);
    expect(ids({ tab: 'absences', query: '', statusFilter: 'late' })).toEqual(['b']);
    expect(ids({ tab: 'infractions', query: '', statusFilter: 'late' })).toEqual(['c']);
  });

  it('ignores blank search queries', () => {
    expect(ids({ tab: 'all', query: '   ', statusFilter: 'all' })).toHaveLength(5);
  });
});

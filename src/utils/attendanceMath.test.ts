import { describe, expect, it } from 'vitest';
import type { AttendanceRecord, AttendanceSession, Student } from '../types/attendance';
import {
  attendedRate,
  attendedRateRounded,
  clampPercent,
  computeStudentMetricsFromSessions,
  dailyFirstRank,
  isActiveStudent,
  latestPeriodRank,
  localDateKey,
  matchesAbsenceScope,
  matchesStatusFilter,
  meanOrNull,
  pickOneRecordPerStudent,
  selectReportStudents,
  rateOrNull,
  recountSession,
  summarizeRecords,
} from './attendanceMath';
import { buildGradeAbsencePatterns } from './gradeAbsencePatterns';

const ALL_STATUSES = [
  'present',
  'absent',
  'late',
  'excused_leave',
  'excused_absence',
  'under_review',
  'rejected_excuse',
] as const;

const makeRecord = (id: string, status: AttendanceRecord['status']): AttendanceRecord => ({
  id: `rec-${id}`,
  sessionId: 'sess-1',
  studentId: `std-${id}`,
  status,
  updatedAt: '2026-11-19T08:00:00Z',
  updatedBy: 'tester',
});

describe('attendanceMath', () => {
  it('enforces null-for-missing rate contracts and clamps percentages', () => {
    expect(rateOrNull(95)).toBe(95);
    expect(rateOrNull(0)).toBe(0);
    expect(rateOrNull(undefined)).toBeNull();
    expect(rateOrNull(null)).toBeNull();
    expect(rateOrNull(Number.NaN)).toBeNull();

    expect(meanOrNull([])).toBeNull();
    expect(meanOrNull([null, undefined, Number.NaN])).toBeNull();
    expect(meanOrNull([100, undefined, 80, null])).toBe(90);

    expect(clampPercent(-25)).toBe(0);
    expect(clampPercent(150)).toBe(100);
    expect(clampPercent(62)).toBe(62);
    expect(clampPercent(Number.NaN)).toBe(0);
  });

  it('maintains KPI card count / drill-down filter parity across all 7 statuses', () => {
    const records: AttendanceRecord[] = ALL_STATUSES.map((status, i) => makeRecord(String(i), status));
    const totals = summarizeRecords(records);

    expect(totals.total).toBe(7);
    expect(totals.present).toBe(records.filter((r) => matchesStatusFilter(r.status, 'present')).length);
    expect(totals.absentTotal).toBe(records.filter((r) => matchesStatusFilter(r.status, 'absent')).length);
    expect(totals.late).toBe(records.filter((r) => matchesStatusFilter(r.status, 'late')).length);
    expect(totals.excusedTotal).toBe(
      records.filter((r) => matchesStatusFilter(r.status, 'excused_absence')).length
    );

    // Specifically verify rejected_excuse stays visible under Absent and excused_leave/under_review under Excused
    expect(totals.absentTotal).toBe(2); // absent + rejected_excuse
    expect(totals.excusedTotal).toBe(3); // excused_absence + excused_leave + under_review
  });

  it('computes canonical attended rate across present, late, excused_leave, excused_absence, rejected_excuse and under_review', () => {
    const records: AttendanceRecord[] = [
      makeRecord('1', 'present'),
      makeRecord('2', 'late'),
      makeRecord('3', 'excused_leave'),
      makeRecord('4', 'excused_absence'),
      makeRecord('5', 'rejected_excuse'),
      makeRecord('6', 'under_review'),
    ];
    const totals = summarizeRecords(records);
    expect(totals.attendedTotal).toBe(3); // present + late + excused_leave
    expect(attendedRate(totals)).toBe(50);
    expect(attendedRateRounded(totals)).toBe(50);
    expect(attendedRate(summarizeRecords([]))).toBeNull();
  });

  it('recounts session counters from records including totalStudents', () => {
    const recounted = recountSession({
      id: 's1',
      totalStudents: 99,
      presentCount: 99,
      absentCount: 99,
      lateCount: 99,
      excusedCount: 99,
      records: [
        makeRecord('1', 'present'),
        makeRecord('2', 'absent'),
        makeRecord('3', 'rejected_excuse'),
        makeRecord('4', 'late'),
        makeRecord('5', 'under_review'),
      ],
    });

    expect(recounted.totalStudents).toBe(5);
    expect(recounted.presentCount).toBe(1);
    expect(recounted.absentCount).toBe(2);
    expect(recounted.lateCount).toBe(1);
    expect(recounted.excusedCount).toBe(1);
  });

  it('derives student metrics across submitted sessions with same-day deduplication', () => {
    const sessions: AttendanceSession[] = [
      {
        id: 'sess-draft',
        tenantId: 't1',
        date: '2026-11-01',
        sessionType: 'daily',
        classId: 'c1',
        className: '10/A',
        grade: '10',
        teacherId: 'teacher-1',
        teacherName: 'T',
        status: 'draft',
        totalStudents: 1,
        presentCount: 0,
        absentCount: 1,
        lateCount: 0,
        excusedCount: 0,
        records: [makeRecord('s1', 'absent')].map((r) => ({ ...r, studentId: 'std-1' })),
      },
      {
        id: 'sess-day-1',
        tenantId: 't1',
        date: '2026-11-02',
        sessionType: 'daily',
        classId: 'c1',
        className: '10/A',
        grade: '10',
        teacherId: 'teacher-1',
        teacherName: 'T',
        status: 'submitted',
        totalStudents: 1,
        presentCount: 0,
        absentCount: 1,
        lateCount: 0,
        excusedCount: 0,
        records: [{ ...makeRecord('1', 'absent'), studentId: 'std-1' }],
      },
      {
        id: 'sess-day-2',
        tenantId: 't1',
        date: '2026-11-03',
        sessionType: 'daily',
        classId: 'c1',
        className: '10/A',
        grade: '10',
        teacherId: 'teacher-1',
        teacherName: 'T',
        status: 'submitted',
        totalStudents: 1,
        presentCount: 0,
        absentCount: 0,
        lateCount: 1,
        excusedCount: 0,
        records: [{ ...makeRecord('2', 'late'), studentId: 'std-1' }],
      },
    ];

    const metrics = computeStudentMetricsFromSessions(sessions).get('std-1');
    expect(metrics).toEqual({
      totalAbsences: 1,
      totalLates: 1,
      attendanceRate: 50,
    });
  });

  it('prevents NaN in buildGradeAbsencePatterns when attendanceRate is undefined', () => {
    const students = [
      {
        id: 'std-1',
        tenantId: 't1',
        grade: 'الصف العاشر',
        className: '10/أ',
        totalAbsences: undefined as unknown as number,
        totalLates: 0,
        attendanceRate: undefined as unknown as number,
      } as Student,
    ];

    const [row] = buildGradeAbsencePatterns(students, [], 'ar');
    expect(Number.isNaN(row.averageAttendanceRate)).toBe(false);
    expect(row.averageAttendanceRate).toBe(0);
    expect(row.totalAbsenceDays).toBe(0);
    expect(isActiveStudent(students[0])).toBe(true);
  });

  it('keeps local-noon normalized YYYY-MM-DD dates on the exact month and day', () => {
    const raw = '2026-11-01';
    const d = new Date(`${raw}T12:00:00`);
    expect(d.getFullYear()).toBe(2026);
    expect(d.getMonth()).toBe(10); // November (0-indexed)
    expect(d.getDate()).toBe(1);
  });

  it('treats under_review as an absent day in computeStudentMetricsFromSessions', () => {
    const sessions: AttendanceSession[] = [
      {
        id: 'sess-review',
        tenantId: 't1',
        date: '2026-11-04',
        sessionType: 'daily',
        classId: 'c1',
        className: '10/A',
        grade: '10',
        teacherId: 'teacher-1',
        teacherName: 'T',
        status: 'submitted',
        totalStudents: 1,
        presentCount: 0,
        absentCount: 0,
        lateCount: 0,
        excusedCount: 1,
        records: [{ ...makeRecord('1', 'under_review'), studentId: 'std-1' }],
      },
    ];

    const metrics = computeStudentMetricsFromSessions(sessions).get('std-1');
    expect(metrics).toEqual({
      totalAbsences: 1,
      totalLates: 0,
      attendanceRate: 0,
    });
  });

  it('reports a null rate for students with no submitted records, never a fabricated 100', () => {
    const metrics = computeStudentMetricsFromSessions([], new Set(['std-unknown']));
    expect(metrics.get('std-unknown')).toEqual({
      totalAbsences: 0,
      totalLates: 0,
      attendanceRate: null,
    });
  });

  it('deduplicates student records across daily and period sessions according to rank', () => {
    const sessions: AttendanceSession[] = [
      {
        id: 'daily',
        tenantId: 't1',
        date: '2026-11-05',
        sessionType: 'daily',
        classId: 'c1',
        className: '10/A',
        grade: '10',
        teacherId: 'teacher-1',
        teacherName: 'T',
        status: 'submitted',
        totalStudents: 2,
        presentCount: 1,
        absentCount: 1,
        lateCount: 0,
        excusedCount: 0,
        records: [
          { ...makeRecord('1', 'present'), studentId: 'std-1' },
          { ...makeRecord('2', 'absent'), studentId: 'std-tr' },
        ],
      },
      {
        id: 'p3',
        tenantId: 't1',
        date: '2026-11-05',
        sessionType: 'period',
        periodNumber: 3,
        classId: 'c1',
        className: '10/A',
        grade: '10',
        teacherId: 'teacher-1',
        teacherName: 'T',
        status: 'submitted',
        totalStudents: 1,
        presentCount: 0,
        absentCount: 0,
        lateCount: 0,
        excusedCount: 1,
        records: [{ ...makeRecord('3', 'excused_leave'), studentId: 'std-1' }],
      },
    ];

    const excluded = new Set(['std-tr']);
    const dailyPreferred = pickOneRecordPerStudent(sessions, dailyFirstRank, excluded);
    expect(dailyPreferred).toHaveLength(1);
    expect(dailyPreferred[0].status).toBe('present');

    const latestPreferred = pickOneRecordPerStudent(sessions, latestPeriodRank, excluded);
    expect(latestPreferred).toHaveLength(1);
    expect(latestPreferred[0].status).toBe('excused_leave');
  });

  it('uses the local calendar day for localDateKey (no UTC day shift)', () => {
    // Constructed from local components: in UTC+3 this is 2026-01-04T21:30Z.
    // toISOString().slice(0, 10) would wrongly return "2026-01-04".
    expect(localDateKey(new Date(2026, 0, 5, 0, 30))).toBe('2026-01-05');
    expect(localDateKey(new Date(2026, 10, 19, 23, 59))).toBe('2026-11-19');
  });

  it('period-only schools treat the latest period of the day as the daily record', () => {
    const period = (id: string, periodNumber: number, status: AttendanceRecord['status']) =>
      ({
        id,
        tenantId: 't1',
        date: '2026-11-05',
        sessionType: 'period',
        periodNumber,
        classId: 'c1',
        className: '10/A',
        grade: '10',
        teacherId: 't1',
        teacherName: 'T',
        status: 'submitted',
        totalStudents: 1,
        records: [{ ...makeRecord(id, status), studentId: 'std-1' }],
      }) as AttendanceSession;

    const picked = pickOneRecordPerStudent(
      [period('p7', 7, 'present'), period('p1', 1, 'absent')],
      dailyFirstRank
    );
    expect(picked).toHaveLength(1);
    expect(picked[0].status).toBe('present'); // documented policy: latest period wins
  });

  it('selectReportStudents applies active, class and absence-tier scope in one place', () => {
    const students = [
      { id: 'a', className: '1/A', totalAbsences: 0, enrollmentStatus: 'active' },
      { id: 'b', className: '1/A', totalAbsences: 3, enrollmentStatus: 'active' },
      { id: 'c', className: '1/A', totalAbsences: 5, enrollmentStatus: 'active' },
      { id: 'd', className: '1/A', totalAbsences: 8, enrollmentStatus: 'active' },
      { id: 'e', className: '1/A', totalAbsences: 9, enrollmentStatus: 'transferred' },
      { id: 'f', className: '2/B', totalAbsences: 9, enrollmentStatus: 'active' },
    ] as Array<Pick<Student, 'id' | 'className' | 'totalAbsences' | 'enrollmentStatus'>>;

    const ids = (reportType: Parameters<typeof selectReportStudents>[1]['reportType'], className?: string) =>
      selectReportStudents(students, { reportType, className }).map((s) => s.id);

    expect(ids('full')).toEqual(['a', 'b', 'c', 'd', 'f']);
    expect(ids('chronic_only')).toEqual(['b', 'c', 'd', 'f']);
    expect(ids('tier2_warning')).toEqual(['c']);
    expect(ids('tier3_critical')).toEqual(['d', 'f']);
    expect(ids('full', '2/B')).toEqual(['f']);
    expect(matchesAbsenceScope(5, 'tier2_warning')).toBe(true);
    expect(matchesAbsenceScope(8, 'tier2_warning')).toBe(false);
  });
});

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
  matchesStatusFilter,
  meanOrNull,
  pickOneRecordPerStudent,
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
});

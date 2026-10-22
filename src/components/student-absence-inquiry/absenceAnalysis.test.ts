import { describe, expect, it } from 'vitest';
import { buildStudentAbsenceAnalysis as buildCanonical } from '../../utils/studentAbsenceAnalysis';
import { buildStudentAbsenceAnalysis as buildBridge } from './absenceAnalysis';
import { getArabicDayName } from './dateRange';

const student = {
  id: 's1',
  name: 'Student One',
  className: '10A',
  tenantId: 'school-1',
  status: 'active',
  attendanceRate: 88,
  totalAbsences: 3,
  totalLates: 1,
} as any;

const baseParams = {
  activeDateRange: { start: '2026-09-01', end: '2026-10-31', label: 'Term' },
  academicYearBounds: { start: '2026-08-01', end: '2027-06-30' },
  horizonType: 'term' as const,
  selectedMonth: '2026-10',
  selectedTermId: 'term-1',
  customDateValidation: { isValid: true, error: null },
  isAr: false,
};

const sessions = [
  {
    id: 'sess-1',
    tenantId: 'school-1',
    date: '2026-09-07',
    status: 'submitted',
    sessionType: 'daily',
    className: '10A',
    subject: 'Math',
    teacherName: 'Teacher',
    records: [{ studentId: 's1', status: 'absent', note: 'No show' }],
  },
  {
    id: 'sess-2',
    tenantId: 'school-1',
    date: '2026-09-08',
    status: 'submitted',
    sessionType: 'period',
    periodNumber: 2,
    className: '10A',
    subject: 'Science',
    teacherName: 'Teacher',
    records: [{ studentId: 's1', status: 'late', minutesLate: 10 }],
  },
  {
    id: 'sess-3',
    tenantId: 'school-1',
    date: '2026-09-09',
    status: 'submitted',
    sessionType: 'daily',
    className: '10A',
    subject: 'Arabic',
    teacherName: 'Teacher',
    records: [{ studentId: 's1', status: 'present' }],
  },
] as any;

describe('absence-analysis bridge', () => {
  it('returns the canonical counts and records for the same session data', () => {
    const canonical = buildCanonical({
      ...baseParams,
      student,
      sessions,
      justifications: [],
      getArabicDayName,
      getSchoolDaysInRange: () => [],
    });

    const bridged = buildBridge({
      ...baseParams,
      currentStudent: student,
      sessions,
      justifications: [],
      schoolProfile: null,
    });

    expect(bridged).not.toBeNull();
    expect(bridged!.totalRecordedDaysCount).toBe(canonical!.totalRecordedDaysCount);
    expect(bridged!.presentDaysCount).toBe(canonical!.presentDaysCount);
    expect(bridged!.absentDaysCount).toBe(canonical!.absentDaysCount);
    expect(bridged!.lateDaysCount).toBe(canonical!.lateDaysCount);
    expect(bridged!.totalMinutesLate).toBe(canonical!.totalMinutesLate);
    expect(bridged!.attendanceRate).toBe(canonical!.attendanceRate);
    expect(bridged!.records).toEqual(canonical!.records);
  });

  it('does not fabricate records when no submitted sessions have matching records', () => {
    const emptySessions = [
      {
        id: 'sess-9',
        tenantId: 'school-1',
        date: '2026-09-10',
        status: 'draft',
        sessionType: 'daily',
        className: '10A',
        records: [{ studentId: 's1', status: 'absent' }],
      },
    ] as any;

    const bridged = buildBridge({
      ...baseParams,
      currentStudent: student,
      sessions: emptySessions,
      justifications: [],
      schoolProfile: null,
    });

    expect(bridged!.records).toEqual([]);
    expect(bridged!.absentDaysCount).toBe(0);
    expect(bridged!.lateDaysCount).toBe(0);
    expect(bridged!.attendanceRate).toBe(100);
  });

  it('returns null without a current student', () => {
    const bridged = buildBridge({
      ...baseParams,
      currentStudent: null,
      sessions,
      justifications: [],
      schoolProfile: null,
    });
    expect(bridged).toBeNull();
  });
});

// @vitest-environment jsdom
import { describe, expect, it } from 'vitest';
import { renderHook } from '@testing-library/react';
import type {
  AttendanceSession,
  SchoolClassSummary,
  SchoolEnrollmentStats,
  Student,
} from '../types/attendance';
import { useExecutiveDashboardAnalytics } from './useExecutiveDashboardAnalytics';

const todayStr = new Date().toISOString().split('T')[0];

const makeStudent = (id: string, overrides: Partial<Student> = {}): Student =>
  ({
    id,
    tenantId: 'school-1',
    studentNumber: id,
    nationalId: id,
    fullName: `Student ${id}`,
    grade: 'الصف العاشر',
    className: '10/أ',
    classId: 'c-10a',
    guardianName: 'Guardian',
    guardianPhone: '0500000000',
    guardianRelationship: 'father',
    totalAbsences: 0,
    totalLates: 0,
    attendanceRate: 100,
    enrollmentStatus: 'active',
    ...overrides,
  }) as Student;

const makeEnrollmentStats = (
  overrides: Partial<SchoolEnrollmentStats> = {}
): SchoolEnrollmentStats => ({
  totalStudentsCount: 0,
  activeStudentsCount: 0,
  transferredStudentsCount: 0,
  totalClassesCount: 0,
  averageClassSize: 0,
  schoolAttendanceRate: 0,
  ...overrides,
});

describe('useExecutiveDashboardAnalytics', () => {
  it('deduplicates multi-session students, preserves unexcusedCount, separates excusedLeave, and computes onCampusCount', () => {
    const students: Student[] = [
      makeStudent('s1'),
      makeStudent('s2'),
      makeStudent('s3'),
      makeStudent('s4'),
      makeStudent('s5'),
      makeStudent('s6'),
      makeStudent('s7'),
      makeStudent('s-tr', { enrollmentStatus: 'transferred' }),
    ];

    const dailySession: AttendanceSession = {
      id: 'sess-daily',
      tenantId: 'school-1',
      date: todayStr,
      sessionType: 'daily',
      classId: 'c-10a',
      className: '10/أ',
      grade: 'الصف العاشر',
      teacherId: 't1',
      teacherName: 'Teacher',
      status: 'submitted',
      totalStudents: 8,
      presentCount: 1,
      absentCount: 2,
      lateCount: 1,
      excusedCount: 3,
      records: [
        { id: 'r1', sessionId: 'sess-daily', studentId: 's1', status: 'present', updatedAt: '', updatedBy: '' },
        { id: 'r2', sessionId: 'sess-daily', studentId: 's2', status: 'late', updatedAt: '', updatedBy: '' },
        { id: 'r3', sessionId: 'sess-daily', studentId: 's3', status: 'excused_leave', updatedAt: '', updatedBy: '' },
        { id: 'r4', sessionId: 'sess-daily', studentId: 's4', status: 'excused_absence', updatedAt: '', updatedBy: '' },
        { id: 'r5', sessionId: 'sess-daily', studentId: 's5', status: 'absent', updatedAt: '', updatedBy: '' },
        { id: 'r6', sessionId: 'sess-daily', studentId: 's6', status: 'rejected_excuse', updatedAt: '', updatedBy: '' },
        { id: 'r7', sessionId: 'sess-daily', studentId: 's7', status: 'under_review', updatedAt: '', updatedBy: '' },
        { id: 'r8', sessionId: 'sess-daily', studentId: 's-tr', status: 'absent', updatedAt: '', updatedBy: '' },
      ],
    };

    // Period 2 overlapping s1..s3: s1 still present, s2 left early (excused_leave in latest period)
    const periodSession: AttendanceSession = {
      id: 'sess-p2',
      tenantId: 'school-1',
      date: todayStr,
      sessionType: 'period',
      periodNumber: 2,
      classId: 'c-10a',
      className: '10/أ',
      grade: 'الصف العاشر',
      teacherId: 't1',
      teacherName: 'Teacher',
      status: 'submitted',
      totalStudents: 3,
      presentCount: 1,
      absentCount: 0,
      lateCount: 0,
      excusedCount: 2,
      records: [
        { id: 'p1', sessionId: 'sess-p2', studentId: 's1', status: 'present', updatedAt: '', updatedBy: '' },
        { id: 'p2', sessionId: 'sess-p2', studentId: 's2', status: 'excused_leave', updatedAt: '', updatedBy: '' },
        { id: 'p3', sessionId: 'sess-p2', studentId: 's3', status: 'excused_leave', updatedAt: '', updatedBy: '' },
      ],
    };

    const { result } = renderHook(() =>
      useExecutiveDashboardAnalytics({
        sessions: [dailySession, periodSession],
        students,
        justifications: [],
        classesStats: [],
        schoolEnrollmentStats: makeEnrollmentStats({ activeStudentsCount: 7 }),
        isAr: false,
      })
    );

    const { todayMetrics, onCampusCount } = result.current;
    // Daily session wins over period for todayMetrics -> 7 active students counted once
    expect(todayMetrics.hasSubmittedData).toBe(true);
    expect(todayMetrics.presentCount).toBe(3); // s1 present + s2 late + s3 excused_leave
    expect(todayMetrics.unexcusedCount).toBe(2); // s5 absent + s6 rejected_excuse (not reduced by excusedCount)
    expect(todayMetrics.excusedCount).toBe(1); // s4 excused_absence only
    expect(todayMetrics.excusedLeaveCount).toBe(1); // s3 excused_leave
    expect(todayMetrics.absentCount).toBe(4); // absent(1) + rejected_excuse(1) + excused_absence(1) + under_review(1)
    expect(todayMetrics.lateCount).toBe(1); // s2
    expect(todayMetrics.attendanceRate).toBe(43); // round(3 / 7 * 100)

    // For onCampusCount, latestPeriodRank lets period 2 override daily -> s2 left early -> only s1 present
    expect(onCampusCount).toBe(1);
  });

  it('returns historical average without synthetic headcount and null onCampusCount when no sessions exist today', () => {
    const students = [
      makeStudent('s1', { attendanceRate: 90 }),
      makeStudent('s2', { attendanceRate: 100 }),
    ];

    const { result } = renderHook(() =>
      useExecutiveDashboardAnalytics({
        sessions: [],
        students,
        justifications: [],
        classesStats: [],
        schoolEnrollmentStats: makeEnrollmentStats({ activeStudentsCount: 2, schoolAttendanceRate: 95 }),
        isAr: false,
      })
    );

    expect(result.current.todayMetrics.hasSubmittedData).toBe(false);
    expect(result.current.todayMetrics.attendanceRate).toBe(95);
    expect(result.current.todayMetrics.presentCount).toBe(0);
    expect(result.current.onCampusCount).toBeNull();

    const emptyHook = renderHook(() =>
      useExecutiveDashboardAnalytics({
        sessions: [],
        students: [],
        justifications: [],
        classesStats: [],
        schoolEnrollmentStats: makeEnrollmentStats(),
        isAr: false,
      })
    );

    expect(emptyHook.result.current.todayMetrics.attendanceRate).toBeNull();
    expect(emptyHook.result.current.onCampusCount).toBeNull();
  });

  it('excludes empty configured classes from classesByAbsence and gradeComparisonData', () => {
    const classesStats: SchoolClassSummary[] = [
      {
        className: '10/أ',
        grade: 'الصف العاشر',
        classId: 'c1',
        totalStudents: 10,
        activeStudents: 10,
        transferredStudents: 0,
        attendanceRate: 96,
        assignedTeachersCount: 1,
      },
      {
        className: '10/ب',
        grade: 'الصف العاشر',
        classId: 'c2',
        totalStudents: 0,
        activeStudents: 0,
        transferredStudents: 0,
        attendanceRate: 0,
        assignedTeachersCount: 0,
      },
    ];

    const { result } = renderHook(() =>
      useExecutiveDashboardAnalytics({
        sessions: [],
        students: [makeStudent('s1')],
        justifications: [],
        classesStats,
        schoolEnrollmentStats: makeEnrollmentStats({ activeStudentsCount: 1 }),
        isAr: false,
      })
    );

    expect(result.current.classesByAbsence.map((c) => c.className)).toEqual(['10/أ']);
    expect(result.current.gradeComparisonData).toEqual([
      {
        gradeName: 'العاشر',
        attendanceRate: 96,
        absenceRate: 4,
        studentCount: 10,
      },
    ]);
  });
});

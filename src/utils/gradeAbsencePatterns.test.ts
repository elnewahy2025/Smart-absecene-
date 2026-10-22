import { describe, expect, it } from 'vitest';
import type { Justification, Student } from '../types/attendance';
import {
  buildGradeAbsencePatterns,
  summarizeGradeAbsencePatterns,
} from './gradeAbsencePatterns';

function makeStudent(overrides: Partial<Student> = {}): Student {
  return {
    id: 'std-1',
    tenantId: 'school-1',
    fullName: 'Student One',
    grade: 'الصف العاشر',
    className: '10-A',
    totalAbsences: 0,
    totalLates: 0,
    attendanceRate: 100,
    ...overrides,
  } as Student;
}

function makeJustification(overrides: Partial<Justification> = {}): Justification {
  return {
    id: 'just-1',
    tenantId: 'school-1',
    studentId: 'std-1',
    status: 'pending',
    ...overrides,
  } as Justification;
}

describe('buildGradeAbsencePatterns', () => {
  it('groups students by grade and aggregates totals and averages', () => {
    const students = [
      makeStudent({ id: 'a', grade: 'الصف العاشر', totalAbsences: 2, totalLates: 1, attendanceRate: 96 }),
      makeStudent({ id: 'b', grade: 'الصف العاشر', totalAbsences: 4, totalLates: 3, attendanceRate: 90 }),
      makeStudent({ id: 'c', grade: 'الصف الحادي عشر', totalAbsences: 1, totalLates: 0, attendanceRate: 99 }),
    ];

    const result = buildGradeAbsencePatterns(students, [], 'en');
    const tenth = result.find((g) => g.gradeName === 'الصف العاشر')!;

    expect(result).toHaveLength(2);
    expect(tenth.studentCount).toBe(2);
    expect(tenth.totalAbsenceDays).toBe(6);
    expect(tenth.totalLates).toBe(4);
    expect(tenth.avgAbsencesPerStudent).toBe(3);
    expect(tenth.averageAttendanceRate).toBe(93);
    expect(tenth.classesCount).toBe(1);
  });

  it('derives the chronic and risk tiers from absence days', () => {
    const students = [
      makeStudent({ id: 'n', grade: 'G', totalAbsences: 1, attendanceRate: 99 }),
      makeStudent({ id: 't1', grade: 'G', totalAbsences: 3, attendanceRate: 96 }),
      makeStudent({ id: 't2', grade: 'G', totalAbsences: 6, attendanceRate: 93 }),
      makeStudent({ id: 't3', grade: 'G', totalAbsences: 9, attendanceRate: 85 }),
    ];

    const [grade] = buildGradeAbsencePatterns(students, [], 'en');

    expect(grade.normalCount).toBe(1);
    expect(grade.tier1AlertCount).toBe(1);
    expect(grade.tier2WarningCount).toBe(1);
    expect(grade.tier3CriticalCount).toBe(1);
    expect(grade.chronicCount).toBe(2);
    expect(grade.chronicRate).toBe(50);
    expect(grade.riskLevel).toBe('high');
  });

  it('uses approved and pending justifications for the documentation rate', () => {
    const students = [
      makeStudent({ id: 'a', grade: 'G', totalAbsences: 4 }),
      makeStudent({ id: 'b', grade: 'G', totalAbsences: 4 }),
    ];
    const justifications = [
      makeJustification({ id: 'j1', studentId: 'a', status: 'approved' }),
      makeJustification({ id: 'j2', studentId: 'b', status: 'pending' }),
      makeJustification({ id: 'j3', studentId: 'b', status: 'rejected' }),
    ];

    const [grade] = buildGradeAbsencePatterns(students, justifications, 'en');

    expect(grade.excusedCount).toBe(1);
    expect(grade.pendingCount).toBe(1);
    expect(grade.unexcusedCount).toBe(7);
    expect(grade.documentationRate).toBe(25);
  });

  it('caps the documentation rate at 100 percent', () => {
    const students = [makeStudent({ id: 'a', grade: 'G', totalAbsences: 1 })];
    const justifications = [
      makeJustification({ id: 'j1', studentId: 'a', status: 'approved' }),
      makeJustification({ id: 'j2', studentId: 'a', status: 'pending' }),
    ];

    const [grade] = buildGradeAbsencePatterns(students, justifications, 'en');
    expect(grade.documentationRate).toBe(100);
  });

  it('falls back to a localized label when the grade is missing', () => {
    const students = [makeStudent({ id: 'a', grade: undefined, className: '' })];

    expect(buildGradeAbsencePatterns(students, [], 'ar')[0].gradeName).toBe('المرحلة غير محددة');
    expect(buildGradeAbsencePatterns(students, [], 'en')[0].gradeName).toBe('Unspecified');
  });

  it('sorts grades in school order rather than alphabetically', () => {
    const students = [
      makeStudent({ id: 'a', grade: 'الصف الثاني عشر' }),
      makeStudent({ id: 'b', grade: 'الصف السابع' }),
      makeStudent({ id: 'c', grade: 'الصف العاشر' }),
    ];

    const names = buildGradeAbsencePatterns(students, [], 'ar').map((g) => g.gradeName);
    expect(names).toEqual(['الصف السابع', 'الصف العاشر', 'الصف الثاني عشر']);
  });

  it('returns an empty array when there are no students', () => {
    expect(buildGradeAbsencePatterns([], [], 'en')).toEqual([]);
  });
});

describe('summarizeGradeAbsencePatterns', () => {
  it('picks the best and most vulnerable grades and computes the gap', () => {
    const students = [
      makeStudent({ id: 'a', grade: 'G1', totalAbsences: 0, attendanceRate: 100 }),
      makeStudent({ id: 'b', grade: 'G2', totalAbsences: 10, attendanceRate: 80 }),
    ];

    const gradeData = buildGradeAbsencePatterns(students, [], 'en');
    const summary = summarizeGradeAbsencePatterns(gradeData);

    expect(summary.bestGrade?.gradeName).toBe('G1');
    expect(summary.mostVulnerableGrade?.gradeName).toBe('G2');
    expect(summary.attendanceGap).toBe(20);
    expect(summary.overallDocRate).toBe(0);
  });

  it('returns neutral defaults for a single grade', () => {
    const students = [makeStudent({ id: 'a', grade: 'G1', totalAbsences: 2, attendanceRate: 95 })];

    const summary = summarizeGradeAbsencePatterns(buildGradeAbsencePatterns(students, [], 'en'));

    expect(summary.attendanceGap).toBe(0);
    expect(summary.bestGrade?.gradeName).toBe('G1');
    expect(summary.mostVulnerableGrade?.gradeName).toBe('G1');
    expect(summary.overallDocRate).toBe(0);
  });

  it('returns null grades and a 100 percent documentation rate for no data', () => {
    const summary = summarizeGradeAbsencePatterns([]);

    expect(summary).toEqual({
      bestGrade: null,
      mostVulnerableGrade: null,
      attendanceGap: 0,
      overallDocRate: 100,
    });
  });
});

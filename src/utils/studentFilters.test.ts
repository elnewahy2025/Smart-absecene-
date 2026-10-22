import { describe, expect, it } from 'vitest';
import type { Student } from '../types/attendance';
import {
  countActiveStudents,
  countInterventionStudents,
  DEFAULT_GRADE_FALLBACK,
  filterStudents,
  isInterventionStudent,
  resolveConfiguredGrades,
} from './studentFilters';

const student = (overrides: Partial<Student> = {}): Student => ({
  id: 's1',
  tenantId: 'school-1',
  studentNumber: '1001',
  nationalId: '1234567890',
  fullName: 'Ahmed Ali',
  grade: 'Grade 10',
  className: '10/A',
  classId: 'c1',
  guardianName: 'Ali',
  guardianPhone: '0555000000',
  guardianRelationship: 'father',
  totalAbsences: 0,
  totalLates: 0,
  attendanceRate: 100,
  ...overrides,
});

const criteria = (overrides: Partial<Parameters<typeof filterStudents>[1]> = {}) => ({
  statusFilter: 'active' as const,
  interventionOnly: false,
  warningThreshold: 3,
  selectedGrade: 'all',
  selectedClass: 'all',
  searchQuery: '',
  ...overrides,
});

describe('isInterventionStudent', () => {
  it('flags low attendance or absences at the threshold', () => {
    expect(isInterventionStudent(student({ attendanceRate: 89.9 }), 3)).toBe(true);
    expect(isInterventionStudent(student({ totalAbsences: 3 }), 3)).toBe(true);
    expect(isInterventionStudent(student({ attendanceRate: 90, totalAbsences: 2 }), 3)).toBe(false);
  });
});

describe('countActiveStudents / countInterventionStudents', () => {
  const roster = [
    student({ id: 'a' }),
    student({ id: 'b', attendanceRate: 80 }),
    student({ id: 'c', enrollmentStatus: 'transferred', attendanceRate: 50 }),
  ];

  it('excludes transferred students from the active count', () => {
    expect(countActiveStudents(roster)).toBe(2);
  });

  it('counts only active intervention students', () => {
    expect(countInterventionStudents(roster, 3)).toBe(1);
  });
});

describe('resolveConfiguredGrades', () => {
  it('prefers the configured educational grades', () => {
    expect(resolveConfiguredGrades(['G1', 'G2'], [{ grade: 'X' }])).toEqual(['G1', 'G2']);
  });

  it('falls back to unique grades from class stats', () => {
    expect(resolveConfiguredGrades(undefined, [{ grade: 'G1' }, { grade: 'G1' }, { grade: 'G3' }])).toEqual([
      'G1',
      'G3',
    ]);
  });

  it('falls back to the built-in grade list', () => {
    expect(resolveConfiguredGrades([], [])).toEqual(DEFAULT_GRADE_FALLBACK);
    expect(resolveConfiguredGrades(undefined, [{ grade: '' }])).toEqual(DEFAULT_GRADE_FALLBACK);
  });
});

describe('filterStudents', () => {
  const roster = [
    student({ id: 'a', grade: 'G1', className: '1/A' }),
    student({ id: 'b', fullName: 'Sara Omar', grade: 'G2', className: '2/B', attendanceRate: 85, totalAbsences: 4 }),
    student({ id: 'c', fullName: 'Khalid Nasser', enrollmentStatus: 'transferred', destinationSchool: 'Al Noor School' }),
  ];

  it('hides transferred students in the active view and vice versa', () => {
    expect(filterStudents(roster, criteria()).map((s) => s.id)).toEqual(['a', 'b']);
    expect(filterStudents(roster, criteria({ statusFilter: 'transferred' })).map((s) => s.id)).toEqual(['c']);
    expect(filterStudents(roster, criteria({ statusFilter: 'all' }))).toHaveLength(3);
  });

  it('filters by grade and class', () => {
    expect(filterStudents(roster, criteria({ selectedGrade: 'G2' })).map((s) => s.id)).toEqual(['b']);
    expect(filterStudents(roster, criteria({ selectedClass: '1/A' })).map((s) => s.id)).toEqual(['a']);
  });

  it('keeps only intervention students when requested', () => {
    expect(filterStudents(roster, criteria({ interventionOnly: true })).map((s) => s.id)).toEqual(['b']);
    expect(filterStudents(roster, criteria({ interventionOnly: true, warningThreshold: 5 })).map((s) => s.id)).toEqual(
      ['b']
    );
  });

  it('searches name, national id, student number, guardian phone and destination school', () => {
    expect(filterStudents(roster, criteria({ searchQuery: 'ahmed' })).map((s) => s.id)).toEqual(['a']);
    expect(filterStudents(roster, criteria({ searchQuery: '1234567890' }))).toHaveLength(2);
    expect(filterStudents(roster, criteria({ searchQuery: '0555' }))).toHaveLength(2);
    expect(
      filterStudents(roster, criteria({ statusFilter: 'all', searchQuery: 'noor' })).map((s) => s.id)
    ).toEqual(['c']);
  });

  it('applies all filters together', () => {
    expect(
      filterStudents(roster, criteria({ selectedGrade: 'G1', searchQuery: 'ahmed' })).map((s) => s.id)
    ).toEqual(['a']);
    expect(filterStudents(roster, criteria({ selectedGrade: 'G1', selectedClass: '2/B' }))).toEqual([]);
  });
});

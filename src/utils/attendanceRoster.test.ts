import { describe, expect, it } from 'vitest';
import type { Student } from '../types/attendance';
import { createAttendanceRecords, getAttendanceRoster } from './attendanceRoster';

const student = (overrides: Partial<Student> = {}): Student => ({
  id: 'student-1',
  tenantId: 'school-1',
  studentNumber: '1001',
  nationalId: 'N-1001',
  fullName: 'Student One',
  grade: 'Grade 10',
  className: '10 / A',
  classId: 'class-a',
  guardianName: 'Guardian',
  guardianPhone: '',
  guardianRelationship: 'Parent',
  totalAbsences: 0,
  totalLates: 0,
  attendanceRate: 100,
  ...overrides,
});

describe('getAttendanceRoster', () => {
  it('excludes transferred students even when the class matches', () => {
    const roster = getAttendanceRoster(
      [student(), student({ id: 'transferred', enrollmentStatus: 'transferred' })],
      '10 / A',
      'class-a'
    );

    expect(roster.map((entry) => entry.id)).toEqual(['student-1']);
  });

  it('matches real class IDs and never falls back to a different class name', () => {
    const roster = getAttendanceRoster(
      [
        student({ id: 'correct', classId: 'class-a', className: '10 / A' }),
        student({ id: 'wrong-id', classId: 'class-b', className: '10 / A' }),
      ],
      '10 / A',
      'class-a'
    );

    expect(roster.map((entry) => entry.id)).toEqual(['correct']);
  });

  it('uses an exact class-name match only for legacy students without a class ID', () => {
    const roster = getAttendanceRoster(
      [
        student({ id: 'legacy-match', classId: '' }),
        student({ id: 'legacy-other', classId: '', className: '10 / B' }),
      ],
      '10 / A',
      'class-a'
    );

    expect(roster.map((entry) => entry.id)).toEqual(['legacy-match']);
  });
});

describe('createAttendanceRecords', () => {
  it('uses the same session ID for every attendance record', () => {
    const records = createAttendanceRecords(
      'session-123',
      [student(), student({ id: 'student-2' })],
      'Teacher',
      '2026-11-19T10:00:00.000Z'
    );

    expect(records).toHaveLength(2);
    expect(records.every((record) => record.sessionId === 'session-123')).toBe(true);
    expect(records.map((record) => record.id)).toEqual([
      'session-123-record-student-1',
      'session-123-record-student-2',
    ]);
  });
});

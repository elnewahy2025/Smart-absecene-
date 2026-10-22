import { describe, expect, it } from 'vitest';
import type { AttendanceSession, Student } from '../types/attendance';
import {
  getSessionClassStudents,
  getUnscannedStudents,
  matchStudentByManualCode,
  matchStudentByPayload,
} from './qrStudentMatch';

const student = (overrides: Partial<Student> = {}): Student => ({
  id: 's1',
  tenantId: 'school-1',
  studentNumber: '1001',
  nationalId: '1234567890',
  fullName: 'Ahmed Ali',
  grade: 'Grade 1',
  className: '1/A',
  classId: 'c1',
  guardianName: 'Ali',
  guardianPhone: '0555000000',
  guardianRelationship: 'father',
  totalAbsences: 0,
  totalLates: 0,
  attendanceRate: 100,
  ...overrides,
});

const students = [
  student(),
  student({ id: 's2', studentNumber: '1002', nationalId: '999', fullName: 'Sara Omar', className: '2/B', classId: 'c2' }),
  student({ id: 's3', studentNumber: '1003', nationalId: '888', fullName: 'Khalid Nasser', className: '3/C', classId: 'c3' }),
];

const session = (overrides: Partial<AttendanceSession> = {}): AttendanceSession =>
  ({
    id: 'sess-1',
    className: '1/A',
    classId: 'c1',
    records: [],
    ...overrides,
  }) as AttendanceSession;

describe('matchStudentByPayload', () => {
  it('ignores empty payloads', () => {
    expect(matchStudentByPayload('', students)).toBeNull();
    expect(matchStudentByPayload('   ', students)).toBeNull();
  });

  it('resolves JSON payloads by studentId', () => {
    expect(matchStudentByPayload('{"studentId":"s2"}', students)?.id).toBe('s2');
  });

  it('resolves JSON payloads by studentNumber and nationalId', () => {
    expect(matchStudentByPayload('{"studentNumber":"1003"}', students)?.id).toBe('s3');
    expect(matchStudentByPayload('{"nationalId":"1234567890"}', students)?.id).toBe('s1');
  });

  it('falls back to plain-text matching for unknown JSON targets', () => {
    expect(matchStudentByPayload('{"studentId":"missing"}', students)).toBeNull();
    expect(matchStudentByPayload('{"studentId":"missing","studentNumber":"1002"}', students)).toBeNull();
    expect(matchStudentByPayload('{"studentNumber":"1002"}', students)?.id).toBe('s2');
  });

  it('matches trimmed plain codes by number, national id, internal id', () => {
    expect(matchStudentByPayload('  1001  ', students)?.id).toBe('s1');
    expect(matchStudentByPayload('888', students)?.id).toBe('s3');
    expect(matchStudentByPayload('s2', students)?.id).toBe('s2');
  });

  it('matches a full name case-insensitively but only exactly', () => {
    expect(matchStudentByPayload('sara omar', students)?.id).toBe('s2');
    expect(matchStudentByPayload('Sara', students)).toBeNull();
  });

  it('does not throw on null JSON', () => {
    expect(matchStudentByPayload('null', students)).toBeNull();
  });
});

describe('matchStudentByManualCode', () => {
  it('returns null for blank input', () => {
    expect(matchStudentByManualCode('   ', students)).toBeNull();
  });

  it('matches partial names (includes), unlike QR payloads', () => {
    expect(matchStudentByManualCode('khalid', students)?.id).toBe('s3');
    expect(matchStudentByManualCode('Omar', students)?.id).toBe('s2');
  });

  it('matches identifiers exactly', () => {
    expect(matchStudentByManualCode('1003', students)?.id).toBe('s3');
    expect(matchStudentByManualCode('s1', students)?.id).toBe('s1');
    expect(matchStudentByManualCode('100', students)).toBeNull();
  });
});

describe('getSessionClassStudents', () => {
  it('returns everyone when there is no active session', () => {
    expect(getSessionClassStudents(students, undefined)).toHaveLength(3);
  });

  it('matches by class name or class id', () => {
    expect(getSessionClassStudents(students, session({ className: '2/B', classId: 'x' })).map((s) => s.id)).toEqual(['s2']);
    expect(getSessionClassStudents(students, session({ className: 'none', classId: 'c1' })).map((s) => s.id)).toEqual(['s1']);
  });
});

describe('getUnscannedStudents', () => {
  it('keeps students without a record and excludes present ones', () => {
    const classStudents = students;
    const s = session({
      records: [
        { id: 'r1', sessionId: 'sess-1', studentId: 's1', status: 'present', updatedAt: '', updatedBy: '' },
        { id: 'r2', sessionId: 'sess-1', studentId: 's2', status: 'late', updatedAt: '', updatedBy: '' },
      ],
    });
    expect(getUnscannedStudents(classStudents, s).map((x) => x.id)).toEqual(['s2', 's3']);
  });

  it('treats every student as unscanned without a session', () => {
    expect(getUnscannedStudents(students, undefined)).toHaveLength(3);
  });
});

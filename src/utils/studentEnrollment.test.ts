import { describe, expect, it } from 'vitest';
import {
  isActiveStudentRecord,
  normalizeStudentCreateInput,
} from './studentEnrollment';

const validInput = {
  fullName: '  Student One  ',
  studentNumber: ' S-100 ',
  nationalId: '1234567890',
  className: ' 10 / A ',
  classId: 'class-1a',
  grade: 'Grade 10',
  guardianName: 'Guardian',
  guardianPhone: '+966500000000',
  guardianRelationship: 'Father',
  bloodType: 'O+',
};

describe('normalizeStudentCreateInput', () => {
  it('trims text and always creates an active record', () => {
    const result = normalizeStudentCreateInput(validInput);
    expect(result.ok).toBe(true);
    if (!result.ok) return;

    expect(result.value.fullName).toBe('Student One');
    expect(result.value.studentNumber).toBe('S-100');
    expect(result.value.className).toBe('10 / A');
    expect(result.value.enrollmentStatus).toBe('active');
  });

  it('requires the identity fields used by the admin UI', () => {
    for (const field of ['fullName', 'studentNumber', 'nationalId', 'className']) {
      const result = normalizeStudentCreateInput({ ...validInput, [field]: '   ' });
      expect(result.ok).toBe(false);
      if (!result.ok) expect(result.error).toContain(field);
    }
  });

  it('rejects non-object payloads', () => {
    expect(normalizeStudentCreateInput(null).ok).toBe(false);
    expect(normalizeStudentCreateInput('student').ok).toBe(false);
    expect(normalizeStudentCreateInput([]).ok).toBe(false);
  });

  it('bounds long text instead of persisting unbounded values', () => {
    const result = normalizeStudentCreateInput({
      ...validInput,
      fullName: 'x'.repeat(200),
      studentNumber: 'y'.repeat(100),
      className: 'z'.repeat(100),
      guardianName: 'g'.repeat(200),
    });
    expect(result.ok).toBe(true);
    if (!result.ok) return;

    expect(result.value.fullName).toHaveLength(120);
    expect(result.value.studentNumber).toHaveLength(30);
    expect(result.value.className).toHaveLength(30);
    expect(result.value.guardianName).toHaveLength(120);
  });

  it('omits optional empty fields and keeps provided optional fields', () => {
    const result = normalizeStudentCreateInput({
      ...validInput,
      guardianEmail: ' ',
      birthDate: '',
      medicalConditions: ' Asthma ',
      emergencyContact: ' +966500000001 ',
    });
    expect(result.ok).toBe(true);
    if (!result.ok) return;

    expect(result.value.guardianEmail).toBeUndefined();
    expect(result.value.birthDate).toBeUndefined();
    expect(result.value.medicalConditions).toBe('Asthma');
    expect(result.value.emergencyContact).toBe('+966500000001');
  });
});

describe('isActiveStudentRecord', () => {
  it('counts legacy, active, graduated, and suspended records as active', () => {
    expect(isActiveStudentRecord({})).toBe(true);
    expect(isActiveStudentRecord({ enrollmentStatus: 'active' })).toBe(true);
    expect(isActiveStudentRecord({ enrollmentStatus: 'graduated' })).toBe(true);
    expect(isActiveStudentRecord({ enrollmentStatus: 'suspended' })).toBe(true);
  });

  it('excludes transferred records and non-objects', () => {
    expect(isActiveStudentRecord({ enrollmentStatus: 'transferred' })).toBe(false);
    expect(isActiveStudentRecord(null)).toBe(false);
    expect(isActiveStudentRecord('transferred')).toBe(false);
  });
});

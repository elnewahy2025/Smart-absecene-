import type { Student } from '../types/attendance';

export type StudentCreateFields = Omit<
  Student,
  'id' | 'tenantId' | 'attendanceRate' | 'totalAbsences' | 'totalLates'
>;

export type StudentNormalizationResult =
  | { ok: true; value: StudentCreateFields }
  | { ok: false; error: string };

const text = (value: unknown, maxLength: number): string =>
  typeof value === 'string' ? value.trim().slice(0, maxLength) : '';

/**
 * Normalizes and validates the client-supplied payload for a new student.
 * The server, not the browser, is the authority for these bounds.
 */
export function normalizeStudentCreateInput(input: unknown): StudentNormalizationResult {
  const raw = input && typeof input === 'object' ? (input as Record<string, unknown>) : {};

  const fullName = text(raw.fullName, 120);
  const studentNumber = text(raw.studentNumber, 30);
  const nationalId = text(raw.nationalId, 30);
  const className = text(raw.className, 30);
  const classId = text(raw.classId, 128);
  const grade = text(raw.grade, 60);

  if (!fullName) return { ok: false, error: 'fullName is required.' };
  if (!studentNumber) return { ok: false, error: 'studentNumber is required.' };
  if (!nationalId) return { ok: false, error: 'nationalId is required.' };
  if (!className) return { ok: false, error: 'className is required.' };

  const value: StudentCreateFields = {
    fullName,
    studentNumber,
    nationalId,
    className,
    classId,
    grade,
    guardianName: text(raw.guardianName, 120),
    guardianPhone: text(raw.guardianPhone, 30),
    guardianRelationship: text(raw.guardianRelationship, 40),
    bloodType: text(raw.bloodType, 10),
    enrollmentStatus: 'active',
  };

  const guardianEmail = text(raw.guardianEmail, 120);
  if (guardianEmail) value.guardianEmail = guardianEmail;

  const birthDate = text(raw.birthDate, 30);
  if (birthDate) value.birthDate = birthDate;

  const medicalConditions = text(raw.medicalConditions, 500);
  if (medicalConditions) value.medicalConditions = medicalConditions;

  const emergencyContact = text(raw.emergencyContact, 120);
  if (emergencyContact) value.emergencyContact = emergencyContact;

  return { ok: true, value };
}

/**
 * Mirrors the client's enrollment semantics: transferred records are archived,
 * while active/graduated/suspended (and legacy records without a status) count
 * against the school's student seat limit.
 */
export function isActiveStudentRecord(record: unknown): boolean {
  if (!record || typeof record !== 'object') return false;
  return (record as Record<string, unknown>).enrollmentStatus !== 'transferred';
}

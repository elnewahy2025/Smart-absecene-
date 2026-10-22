import type { AttendanceSession, Student } from '../types/attendance';

export function matchStudentByPayload(raw: string, students: Student[]): Student | null {
  if (!raw || !raw.trim()) return null;
  try {
    const data = JSON.parse(raw);
    const targetId = data.studentId || data.studentNumber || data.nationalId;
    const found = students.find(
      (s) => s.id === targetId || s.studentNumber === targetId || s.nationalId === targetId
    );
    if (found) return found;
  } catch {
    // plain text fallback
  }

  const trimmed = raw.trim();
  return (
    students.find(
      (s) =>
        s.studentNumber === trimmed ||
        s.nationalId === trimmed ||
        s.id === trimmed ||
        s.fullName.toLowerCase() === trimmed.toLowerCase()
    ) || null
  );
}

export function matchStudentByManualCode(code: string, students: Student[]): Student | null {
  const trimmed = code.trim();
  if (!trimmed) return null;
  return (
    students.find(
      (s) =>
        s.studentNumber === trimmed ||
        s.nationalId === trimmed ||
        s.id === trimmed ||
        s.fullName.toLowerCase().includes(trimmed.toLowerCase())
    ) || null
  );
}

export function getSessionClassStudents(
  students: Student[],
  session?: AttendanceSession
): Student[] {
  return students.filter(
    (s) => !session || s.className === session.className || s.classId === session.classId
  );
}

export function getUnscannedStudents(
  classStudents: Student[],
  session?: AttendanceSession
): Student[] {
  return classStudents.filter((std) => {
    const rec = session?.records?.find((r) => r.studentId === std.id);
    return rec?.status !== 'present';
  });
}

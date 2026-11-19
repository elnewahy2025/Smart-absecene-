import type { AttendanceRecord, Student } from '../types/attendance';

/**
 * Builds the roster for one class without allowing a shared/placeholder class ID
 * to pull students in from another class. Students with a real class ID must
 * match that ID; legacy students without one may fall back to an exact class name.
 */
export function getAttendanceRoster(
  students: Student[],
  className: string,
  classId: string
): Student[] {
  const targetClassName = className.trim();
  const targetClassId = classId.trim();

  return students.filter((student) => {
    if (student.enrollmentStatus === 'transferred') return false;

    const studentClassId = student.classId?.trim() || '';
    if (studentClassId) {
      return Boolean(targetClassId) && studentClassId === targetClassId;
    }

    return Boolean(targetClassName) && student.className.trim() === targetClassName;
  });
}

export function createAttendanceRecords(
  sessionId: string,
  students: Student[],
  updatedBy: string,
  updatedAt: string
): AttendanceRecord[] {
  return students.map((student) => ({
    id: `${sessionId}-record-${student.id}`,
    sessionId,
    studentId: student.id,
    status: 'present',
    updatedAt,
    updatedBy,
  }));
}

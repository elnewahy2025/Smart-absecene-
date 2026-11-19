import type { Student } from '../types/attendance';
import { rateOrNull } from './attendanceMath';

export const DEFAULT_GRADE_FALLBACK = ['الصف العاشر', 'الصف الحادي عشر', 'الصف الثاني عشر'];

export function isInterventionStudent(student: Student, warningThreshold: number): boolean {
  const rate = rateOrNull(student.attendanceRate);
  return (rate !== null && rate < 90) || student.totalAbsences >= warningThreshold;
}

export function countActiveStudents(students: Student[]): number {
  return students.filter((s) => s.enrollmentStatus !== 'transferred').length;
}

export function countInterventionStudents(students: Student[], warningThreshold: number): number {
  return students.filter(
    (s) => s.enrollmentStatus !== 'transferred' && isInterventionStudent(s, warningThreshold)
  ).length;
}

export function resolveConfiguredGrades(
  educationalGrades: string[] | undefined,
  classesStats: Array<{ grade: string }>
): string[] {
  if (educationalGrades && educationalGrades.length > 0) {
    return educationalGrades;
  }
  const fromStats = Array.from(new Set(classesStats.map((c) => c.grade).filter(Boolean)));
  return fromStats.length > 0 ? fromStats : DEFAULT_GRADE_FALLBACK;
}

export interface StudentFilterCriteria {
  statusFilter: 'active' | 'transferred' | 'all';
  interventionOnly: boolean;
  warningThreshold: number;
  selectedGrade: string;
  selectedClass: string;
  searchQuery: string;
}

export function filterStudents(students: Student[], criteria: StudentFilterCriteria): Student[] {
  const { statusFilter, interventionOnly, warningThreshold, selectedGrade, selectedClass, searchQuery } =
    criteria;
  return students.filter((s) => {
    if (statusFilter === 'active' && s.enrollmentStatus === 'transferred') return false;
    if (statusFilter === 'transferred' && s.enrollmentStatus !== 'transferred') return false;
    if (interventionOnly && !isInterventionStudent(s, warningThreshold)) return false;
    if (selectedGrade !== 'all' && s.grade !== selectedGrade) return false;
    if (selectedClass !== 'all' && s.className !== selectedClass) return false;
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      return (
        s.fullName.toLowerCase().includes(q) ||
        s.nationalId.includes(q) ||
        s.studentNumber.includes(q) ||
        s.guardianPhone.includes(q) ||
        (s.destinationSchool && s.destinationSchool.toLowerCase().includes(q))
      );
    }
    return true;
  });
}

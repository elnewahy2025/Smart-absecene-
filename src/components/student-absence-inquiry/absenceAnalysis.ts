import type {
  AttendanceSession,
  Justification,
  Student,
  StudentBehaviourIncident,
  TenantSchoolProfile,
} from '../../types/attendance';
import { getArabicDayName, getSchoolDaysInRange } from './dateRange';
import type {
  CustomDateValidation,
  DateRange,
  HorizonType,
  StudentAbsenceAnalysis,
} from './types';
import { buildStudentAbsenceAnalysis as canonicalBuildAnalysis } from '../../utils/studentAbsenceAnalysis';

/**
 * Unified absence analysis bridge delegating directly to canonical buildStudentAbsenceAnalysis.
 * Eliminates logic duplication while maintaining strict backward compatibility.
 */
export function buildStudentAbsenceAnalysis(params: {
  currentStudent: Student | null;
  sessions: AttendanceSession[];
  justifications: Justification[];
  activeDateRange: DateRange;
  academicYearBounds: { start: string; end: string };
  horizonType: HorizonType;
  selectedMonth: string;
  selectedTermId: string;
  customDateValidation: CustomDateValidation;
  schoolProfile?: TenantSchoolProfile | null;
  isAr: boolean;
}): StudentAbsenceAnalysis | null {
  const result = canonicalBuildAnalysis({
    student: params.currentStudent,
    sessions: params.sessions,
    justifications: params.justifications,
    activeDateRange: params.activeDateRange,
    academicYearBounds: params.academicYearBounds,
    horizonType: params.horizonType,
    selectedMonth: params.selectedMonth,
    selectedTermId: params.selectedTermId,
    customDateValidation: params.customDateValidation,
    isAr: params.isAr,
    getArabicDayName,
    getSchoolDaysInRange: (start, end) =>
      getSchoolDaysInRange(
        start,
        end,
        params.academicYearBounds,
        params.schoolProfile?.weekendDays,
        params.schoolProfile?.officialHolidays
      ),
  });

  return result as StudentAbsenceAnalysis | null;
}

export function filterStudentViolations(params: {
  currentStudent: Student | null;
  behaviourIncidents: StudentBehaviourIncident[];
  activeDateRange: DateRange;
  academicYearBounds: { start: string; end: string };
  horizonType: HorizonType;
  customDateValidation: CustomDateValidation;
}): StudentBehaviourIncident[] {
  const {
    currentStudent,
    behaviourIncidents,
    activeDateRange,
    academicYearBounds,
    horizonType,
    customDateValidation,
  } = params;
  if (!currentStudent) return [];
  if (horizonType === 'custom' && !customDateValidation.isValid) return [];

  return behaviourIncidents
    .filter((b) => {
      if (b.studentId !== currentStudent.id) return false;
      // Filter by date range and strictly respect academic year bounds from Settings
      if (!b.date) return false;
      if (b.date < activeDateRange.start || b.date > activeDateRange.end) return false;
      if (b.date < academicYearBounds.start || b.date > academicYearBounds.end) return false;
      return true;
    })
    .sort((a, b) => (b.date || '').localeCompare(a.date || ''));
}

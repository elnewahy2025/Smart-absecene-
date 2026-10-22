import type { Justification, Student } from '../types/attendance';

export type ChartMetricView = 'excuses_breakdown' | 'risk_distribution' | 'averages_and_rates';

export interface GradeAnalysisItem {
  gradeName: string;
  shortGrade: string;
  studentCount: number;
  totalAbsenceDays: number;
  avgAbsencesPerStudent: number;
  averageAttendanceRate: number;
  totalLates: number;
  // Justification breakdown
  excusedCount: number;
  unexcusedCount: number;
  pendingCount: number;
  documentationRate: number;
  // Risk tiers
  normalCount: number;
  tier1AlertCount: number; // 3-4 days
  tier2WarningCount: number; // 5-7 days
  tier3CriticalCount: number; // 8+ days
  chronicCount: number; // 5+ days
  chronicRate: number; // %
  // Risk label
  riskLevel: 'low' | 'moderate' | 'high';
  // Top classes
  classesCount: number;
}

/** Aggregates per-grade absence, excuse and risk metrics used by the patterns section. */
export function buildGradeAbsencePatterns(
  students: Student[],
  justifications: Justification[],
  lang: 'ar' | 'en'
): GradeAnalysisItem[] {
    const map: Record<string, {
      students: Student[];
      classes: Set<string>;
    }> = {};

    students.forEach((s) => {
      const g = s.grade || (lang === 'ar' ? 'المرحلة غير محددة' : 'Unspecified');
      if (!map[g]) {
        map[g] = { students: [], classes: new Set() };
      }
      map[g].students.push(s);
      if (s.className) map[g].classes.add(s.className);
    });

    const items: GradeAnalysisItem[] = Object.keys(map).map((gradeName) => {
      const gStudents = map[gradeName].students;
      const count = gStudents.length;
      const totalAbsenceDays = gStudents.reduce((sum, s) => sum + s.totalAbsences, 0);
      const totalLates = gStudents.reduce((sum, s) => sum + s.totalLates, 0);
      const avgRate =
        count > 0
          ? parseFloat(
              (gStudents.reduce((sum, s) => sum + s.attendanceRate, 0) / count).toFixed(1)
            )
          : 100;
      const avgAbs = count > 0 ? parseFloat((totalAbsenceDays / count).toFixed(1)) : 0;

      // Risk stratifications
      const normalCount = gStudents.filter((s) => s.totalAbsences < 3).length;
      const tier1AlertCount = gStudents.filter((s) => s.totalAbsences >= 3 && s.totalAbsences < 5).length;
      const tier2WarningCount = gStudents.filter((s) => s.totalAbsences >= 5 && s.totalAbsences < 8).length;
      const tier3CriticalCount = gStudents.filter((s) => s.totalAbsences >= 8).length;
      const chronicCount = tier2WarningCount + tier3CriticalCount;
      const chronicRate = count > 0 ? parseFloat(((chronicCount / count) * 100).toFixed(1)) : 0;

      // Calculate excuses from justifications
      const studentIdSet = new Set(gStudents.map((s) => s.id));
      const gradeJustifications = justifications.filter((j) => studentIdSet.has(j.studentId));
      const approvedExcuses = gradeJustifications.filter((j) => j.status === 'approved').length;
      const pendingExcuses = gradeJustifications.filter((j) => j.status === 'pending').length;

      // Unexcused is total absences minus approved excuses
      const unexcusedCount = Math.max(0, totalAbsenceDays - approvedExcuses);
      const documentationRate =
        totalAbsenceDays > 0
          ? Math.min(100, Math.round(((approvedExcuses + pendingExcuses) / totalAbsenceDays) * 100))
          : 100;

      let riskLevel: 'low' | 'moderate' | 'high' = 'low';
      if (tier3CriticalCount > 0 || chronicRate >= 20 || avgRate < 90) {
        riskLevel = 'high';
      } else if (chronicRate >= 10 || tier2WarningCount > 0 || avgRate < 94) {
        riskLevel = 'moderate';
      }

      // Short label for chart x-axis
      let shortGrade = gradeName
        .replace('الصف ', '')
        .replace('Grade ', '');

      return {
        gradeName,
        shortGrade,
        studentCount: count,
        totalAbsenceDays,
        avgAbsencesPerStudent: avgAbs,
        averageAttendanceRate: avgRate,
        totalLates,
        excusedCount: approvedExcuses,
        unexcusedCount,
        pendingCount: pendingExcuses,
        documentationRate,
        normalCount,
        tier1AlertCount,
        tier2WarningCount,
        tier3CriticalCount,
        chronicCount,
        chronicRate,
        riskLevel,
        classesCount: map[gradeName].classes.size,
      };
    });

    // Natural sort by grade order if known (10, 11, 12, etc.)
    return items.sort((a, b) => {
      const order = ['السابع', 'الثامن', 'التاسع', 'العاشر', 'الحادي عشر', 'الثاني عشر'];
      const idxA = order.findIndex((o) => a.gradeName.includes(o));
      const idxB = order.findIndex((o) => b.gradeName.includes(o));
      if (idxA !== -1 && idxB !== -1) return idxA - idxB;
      return a.gradeName.localeCompare(b.gradeName);
    });
}

export interface GradeAbsenceInsights {
  bestGrade: GradeAnalysisItem | null;
  mostVulnerableGrade: GradeAnalysisItem | null;
  attendanceGap: number;
  overallDocRate: number;
}

/** High-level insight cards derived from the per-grade aggregation. */
export function summarizeGradeAbsencePatterns(gradeData: GradeAnalysisItem[]): GradeAbsenceInsights {
  const bestGrade =
    gradeData.length === 0
      ? null
      : [...gradeData].sort((a, b) => b.averageAttendanceRate - a.averageAttendanceRate)[0];

  const mostVulnerableGrade =
    gradeData.length === 0 ? null : [...gradeData].sort((a, b) => b.chronicRate - a.chronicRate)[0];

  let attendanceGap = 0;
  if (gradeData.length >= 2) {
    const rates = gradeData.map((g) => g.averageAttendanceRate);
    attendanceGap = parseFloat((Math.max(...rates) - Math.min(...rates)).toFixed(1));
  }

  const totalAbs = gradeData.reduce((sum, g) => sum + g.totalAbsenceDays, 0);
  const totalExcused = gradeData.reduce((sum, g) => sum + g.excusedCount + g.pendingCount, 0);
  const overallDocRate =
    totalAbs === 0 ? 100 : Math.min(100, Math.round((totalExcused / totalAbs) * 100));

  return { bestGrade, mostVulnerableGrade, attendanceGap, overallDocRate };
}

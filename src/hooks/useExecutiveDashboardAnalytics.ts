import { useMemo } from 'react';
import {
  AttendanceSession,
  Justification,
  SchoolClassSummary,
  SchoolEnrollmentStats,
  Student,
  TenantSchoolProfile,
} from '../types/attendance';

export interface UseExecutiveDashboardAnalyticsParams {
  sessions: AttendanceSession[];
  students: Student[];
  justifications: Justification[];
  classesStats: SchoolClassSummary[];
  schoolEnrollmentStats: SchoolEnrollmentStats;
  schoolProfile?: TenantSchoolProfile;
  isAr: boolean;
}

export function useExecutiveDashboardAnalytics({
  sessions,
  students,
  justifications,
  classesStats,
  schoolEnrollmentStats,
  schoolProfile,
  isAr,
}: UseExecutiveDashboardAnalyticsParams) {
const todayStr = useMemo(() => new Date().toISOString().split('T')[0], []);

// 1. Session statistics for today
const todaySessions = useMemo(() => sessions.filter((s) => s.date === todayStr), [sessions, todayStr]);
const submittedTodaySessions = useMemo(
  () => todaySessions.filter((s) => s.status === 'submitted'),
  [todaySessions]
);

// 2. Headcounts & attendance breakdown for today
const activeStudents = useMemo(
  () => students.filter((s) => !s.enrollmentStatus || s.enrollmentStatus === 'active'),
  [students]
);

const todayMetrics = useMemo(() => {
  if (submittedTodaySessions.length > 0) {
    const present = submittedTodaySessions.reduce((acc, s) => acc + (s.presentCount || 0), 0);
    const absent = submittedTodaySessions.reduce((acc, s) => acc + (s.absentCount || 0), 0);
    const late = submittedTodaySessions.reduce((acc, s) => acc + (s.lateCount || 0), 0);
    const excused = submittedTodaySessions.reduce((acc, s) => acc + (s.excusedCount || 0), 0);
    const total = present + absent + late;
    const rate = total > 0 ? Math.round((present / total) * 100) : schoolEnrollmentStats?.schoolAttendanceRate ?? 95;
    const unexcused = Math.max(0, absent - excused);

    return {
      presentCount: present,
      absentCount: absent,
      excusedCount: excused,
      unexcusedCount: unexcused,
      lateCount: late,
      attendanceRate: rate,
      hasSubmittedData: true,
    };
  }

  // Baseline fallback from enrollment stats
  const avgRate = schoolEnrollmentStats?.schoolAttendanceRate ?? 95;
  const estimatedPresent = Math.round((activeStudents.length * avgRate) / 100);
  const estimatedAbsent = Math.max(0, activeStudents.length - estimatedPresent);
  const approvedExcusesToday = justifications.filter(
    (j) => j.status === 'approved' && j.absenceDate === todayStr
  ).length;

  return {
    presentCount: estimatedPresent,
    absentCount: estimatedAbsent,
    excusedCount: approvedExcusesToday,
    unexcusedCount: Math.max(0, estimatedAbsent - approvedExcusesToday),
    lateCount: 0,
    attendanceRate: avgRate,
    hasSubmittedData: false,
  };
}, [submittedTodaySessions, schoolEnrollmentStats, activeStudents, justifications, todayStr]);

// 3. Data completeness (فصول معتمدة vs فصول لم تسجل بعد)
const totalClassesCount = classesStats.length;
const recordedClassesSet = useMemo(
  () => new Set(submittedTodaySessions.map((s) => s.className)),
  [submittedTodaySessions]
);
const recordedClassesCount = recordedClassesSet.size;
const unrecordedClassesCount = Math.max(0, totalClassesCount - recordedClassesCount);

// 4. Classes ranked by highest absence rate (Bottom performers needing attention)
const classesByAbsence = useMemo(() => {
  return [...classesStats]
    .map((c) => ({
      ...c,
      absenceRate: Math.max(0, 100 - c.attendanceRate),
    }))
    .sort((a, b) => b.absenceRate - a.absenceRate)
    .slice(0, 5);
}, [classesStats]);

// 5. High-Risk Student Count bound strictly to school settings (unexcusedWarningThreshold)
const warningLimit = schoolProfile?.unexcusedWarningThreshold ?? 3;
const atRiskStudents = useMemo(() => {
  return students
    .filter((s) => (!s.enrollmentStatus || s.enrollmentStatus === 'active') && s.totalAbsences >= warningLimit)
    .sort((a, b) => b.totalAbsences - a.totalAbsences);
}, [students, warningLimit]);

// 6. Pending justifications requiring administrative review
const pendingJustifications = useMemo(() => {
  return justifications.filter((j) => j.status === 'pending');
}, [justifications]);

// 7. Headcount estimate on campus
const onCampusCount = useMemo(() => {
  if (submittedTodaySessions.length === 0) return todayMetrics.presentCount;
  const latest = submittedTodaySessions[submittedTodaySessions.length - 1];
  const presentRecords = (latest.presentCount || 0) + (latest.lateCount || 0);
  return presentRecords > 0 ? presentRecords : todayMetrics.presentCount;
}, [submittedTodaySessions, todayMetrics]);

// 8. Visual Chart 1: Absence Reasons & Excuses Decomposition (Donut Chart)
const absenceDecompositionData = useMemo(() => {
  // Medical excuses
  const medicalCount = justifications.filter(
    (j) => j.status === 'approved' && j.reasonType === 'medical'
  ).length;
  // Family excuses
  const familyCount = justifications.filter(
    (j) => j.status === 'approved' && j.reasonType === 'family'
  ).length;
  // Other approved excuses
  const otherExcusedCount = justifications.filter(
    (j) => j.status === 'approved' && j.reasonType !== 'medical' && j.reasonType !== 'family'
  ).length;
  // Total approved
  const totalApproved = medicalCount + familyCount + otherExcusedCount;
  // Total school unexcused absences
  const totalAbsencesRecorded = students.reduce((acc, s) => acc + (s.totalAbsences || 0), 0);
  const unexcusedCount = Math.max(0, totalAbsencesRecorded - totalApproved);

  const items = [
    { name: isAr ? 'بدون عذر (مخالفة)' : 'Unexcused', value: unexcusedCount, color: '#f43f5e' },
    { name: isAr ? 'عذر طبي معتمد' : 'Medical', value: medicalCount, color: '#3b82f6' },
    { name: isAr ? 'عذر أسري معتمد' : 'Family', value: familyCount, color: '#10b981' },
    { name: isAr ? 'أعذار أخرى' : 'Other', value: otherExcusedCount, color: '#f59e0b' },
  ];
  return items.filter((item) => item.value > 0);
}, [justifications, students, isAr]);

// 9. Visual Chart 2: Grade Absence Comparison (Bar Chart - Real Database Derivation)
const gradeComparisonData = useMemo(() => {
  // Group classesStats by Grade
  const gradeMap: Record<string, { totalStudents: number; totalAbsenceWeight: number; count: number }> = {};
  classesStats.forEach((c) => {
    const gName = c.grade || (isAr ? 'الصف العام' : 'General');
    if (!gradeMap[gName]) {
      gradeMap[gName] = { totalStudents: 0, totalAbsenceWeight: 0, count: 0 };
    }
    const absenceRate = Math.max(0, 100 - c.attendanceRate);
    gradeMap[gName].totalStudents += c.activeStudents || 1;
    gradeMap[gName].totalAbsenceWeight += absenceRate;
    gradeMap[gName].count += 1;
  });

  return Object.entries(gradeMap).map(([gradeName, data]) => {
    const avgAbsence = Math.round(data.totalAbsenceWeight / Math.max(1, data.count));
    const avgAttendance = 100 - avgAbsence;
    return {
      gradeName: gradeName.replace('الصف ', ''),
      attendanceRate: avgAttendance,
      absenceRate: avgAbsence,
      studentCount: data.totalStudents,
    };
  });
}, [classesStats, isAr]);

// 10. Visual Chart 3: Day-of-Week Absence Pattern (Bar Chart - Real Session History)
const weekdayAbsenceData = useMemo(() => {
  // School weekdays: Sunday (0) to Thursday (4) in Saudi/Arab academic calendar
  const daysMeta = [
    { dayIndex: 0, nameAr: 'الأحد', nameEn: 'Sun' },
    { dayIndex: 1, nameAr: 'الإثنين', nameEn: 'Mon' },
    { dayIndex: 2, nameAr: 'الثلاثاء', nameEn: 'Tue' },
    { dayIndex: 3, nameAr: 'الأربعاء', nameEn: 'Wed' },
    { dayIndex: 4, nameAr: 'الخميس', nameEn: 'Thu' },
  ];

  const validSessions = sessions.filter((s) => s.status === 'submitted' && s.date);

  return daysMeta.map((dm) => {
    // Find submitted sessions on this weekday
    const matched = validSessions.filter((s) => {
      const parts = s.date.slice(0, 10).split('-').map(Number);
      const day = new Date(parts[0], parts[1] - 1, parts[2]).getDay();
      return day === dm.dayIndex;
    });

    let avgAbsenceRate = 0;
    if (matched.length > 0) {
      const totalAbs = matched.reduce((acc, s) => acc + (s.absentCount || 0), 0);
      const totalStud = matched.reduce((acc, s) => acc + (s.totalStudents || 1), 0);
      avgAbsenceRate = totalStud > 0 ? Math.round((totalAbs / totalStud) * 100) : 0;
    }

    return {
      day: isAr ? dm.nameAr : dm.nameEn,
      absenceRate: avgAbsenceRate,
      attendanceRate: 100 - avgAbsenceRate,
      isWeekendBorder: dm.dayIndex === 0 || dm.dayIndex === 4,
    };
  });
}, [sessions, isAr]);

// Formatted date string
const formattedDate = useMemo(() => {
  const d = new Date();
  return d.toLocaleDateString(isAr ? 'ar-SA' : 'en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
}, [isAr]);

  return {
    todayStr,
    todaySessions,
    submittedTodaySessions,
    activeStudents,
    todayMetrics,
    totalClassesCount,
    recordedClassesSet,
    recordedClassesCount,
    unrecordedClassesCount,
    classesByAbsence,
    warningLimit,
    atRiskStudents,
    pendingJustifications,
    onCampusCount,
    absenceDecompositionData,
    gradeComparisonData,
    weekdayAbsenceData,
    formattedDate,
  };
}

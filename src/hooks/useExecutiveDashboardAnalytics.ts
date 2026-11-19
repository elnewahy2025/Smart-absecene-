import { useMemo } from 'react';
import {
  AttendanceSession,
  Justification,
  SchoolClassSummary,
  SchoolEnrollmentStats,
  Student,
  TenantSchoolProfile,
} from '../types/attendance';
import {
  attendedRateRounded,
  dailyFirstRank,
  isActiveStudent,
  latestPeriodRank,
  meanOrNull,
  pickOneRecordPerStudent,
  rateOrNull,
  summarizeRecords,
} from '../utils/attendanceMath';

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
  () => students.filter((s) => isActiveStudent(s)),
  [students]
);

const transferredStudentIds = useMemo(
  () => new Set(students.filter((s) => s.enrollmentStatus === 'transferred').map((s) => s.id)),
  [students]
);

const todayMetrics = useMemo(() => {
  if (submittedTodaySessions.length > 0) {
    const hasAnyRecords = submittedTodaySessions.some((s) => s.records && s.records.length > 0);
    if (hasAnyRecords) {
      const dailyRecords = pickOneRecordPerStudent(
        submittedTodaySessions,
        dailyFirstRank,
        transferredStudentIds
      );
      const totals = summarizeRecords(dailyRecords);

      return {
        presentCount: totals.attendedTotal,
        absentCount: totals.absentTotal + totals.excusedAbsence + totals.underReview,
        excusedCount: totals.excusedAbsence,
        excusedLeaveCount: totals.excusedLeave,
        unexcusedCount: totals.absentTotal,
        lateCount: totals.late,
        attendanceRate: attendedRateRounded(totals),
        hasSubmittedData: true,
      };
    }

    let sPresent = 0;
    let sAbsent = 0;
    let sLate = 0;
    let sExcused = 0;
    for (const s of submittedTodaySessions) {
      sPresent += s.presentCount || 0;
      sAbsent += s.absentCount || 0;
      sLate += s.lateCount || 0;
      sExcused += s.excusedCount || 0;
    }
    const attended = sPresent + sLate;
    const total = sPresent + sAbsent + sLate + sExcused;
    const rate = total > 0 ? Math.round((attended / total) * 100) : null;

    return {
      presentCount: attended,
      absentCount: sAbsent,
      excusedCount: sExcused,
      excusedLeaveCount: 0,
      unexcusedCount: sAbsent,
      lateCount: sLate,
      attendanceRate: rate,
      hasSubmittedData: true,
    };
  }

  // Baseline fallback from enrollment stats (never fabricates a synthetic daily headcount)
  const mean = activeStudents.length > 0
    ? meanOrNull(activeStudents.map((s) => rateOrNull(s.attendanceRate)))
    : null;
  const approvedExcusesToday = justifications.filter(
    (j) => j.status === 'approved' && j.absenceDate === todayStr
  ).length;

  return {
    presentCount: 0,
    absentCount: 0,
    excusedCount: approvedExcusesToday,
    excusedLeaveCount: 0,
    unexcusedCount: 0,
    lateCount: 0,
    attendanceRate: mean !== null ? Math.round(mean) : null,
    hasSubmittedData: false,
  };
}, [submittedTodaySessions, transferredStudentIds, activeStudents, justifications, todayStr]);

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
    .filter((c) => c.activeStudents > 0)
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
    .filter((s) => isActiveStudent(s) && s.totalAbsences >= warningLimit)
    .sort((a, b) => b.totalAbsences - a.totalAbsences);
}, [students, warningLimit]);

// 6. Pending justifications requiring administrative review
const pendingJustifications = useMemo(() => {
  return justifications.filter((j) => j.status === 'pending');
}, [justifications]);

// 7. Headcount estimate on campus
const onCampusCount = useMemo<number | null>(() => {
  if (submittedTodaySessions.length === 0) return null;
  const hasAnyRecords = submittedTodaySessions.some((s) => s.records && s.records.length > 0);
  if (hasAnyRecords) {
    const latestRecords = pickOneRecordPerStudent(
      submittedTodaySessions,
      latestPeriodRank,
      transferredStudentIds
    );
    return latestRecords.filter((r) => r.status === 'present' || r.status === 'late').length;
  }
  const latestByClass = new Map<string, AttendanceSession>();
  for (const s of submittedTodaySessions) {
    latestByClass.set(s.className, s);
  }
  let count = 0;
  latestByClass.forEach((s) => {
    count += (s.presentCount || 0) + (s.lateCount || 0);
  });
  return count;
}, [submittedTodaySessions, transferredStudentIds]);

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
  // Total active school unexcused absences
  const totalAbsencesRecorded = activeStudents.reduce((acc, s) => acc + (s.totalAbsences || 0), 0);
  const unexcusedCount = Math.max(0, totalAbsencesRecorded - totalApproved);

  const items = [
    { name: isAr ? 'بدون عذر (مخالفة)' : 'Unexcused', value: unexcusedCount, color: '#f43f5e' },
    { name: isAr ? 'عذر طبي معتمد' : 'Medical', value: medicalCount, color: '#3b82f6' },
    { name: isAr ? 'عذر أسري معتمد' : 'Family', value: familyCount, color: '#10b981' },
    { name: isAr ? 'أعذار أخرى' : 'Other', value: otherExcusedCount, color: '#f59e0b' },
  ];
  return items.filter((item) => item.value > 0);
}, [justifications, activeStudents, isAr]);

// 9. Visual Chart 2: Grade Absence Comparison (Bar Chart - Real Database Derivation)
const gradeComparisonData = useMemo(() => {
  // Group non-empty classesStats by Grade weighted by activeStudents
  const gradeMap: Record<string, { totalStudents: number; weightedAbsence: number }> = {};
  classesStats.forEach((c) => {
    if (c.activeStudents <= 0) return;
    const gName = c.grade || (isAr ? 'الصف العام' : 'General');
    if (!gradeMap[gName]) {
      gradeMap[gName] = { totalStudents: 0, weightedAbsence: 0 };
    }
    const absenceRate = Math.max(0, 100 - c.attendanceRate);
    gradeMap[gName].totalStudents += c.activeStudents;
    gradeMap[gName].weightedAbsence += absenceRate * c.activeStudents;
  });

  return Object.entries(gradeMap).map(([gradeName, data]) => {
    const avgAbsence = data.totalStudents > 0 ? Math.round(data.weightedAbsence / data.totalStudents) : 0;
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
      const totalStud = matched.reduce((acc, s) => acc + (s.records?.length || s.totalStudents || 0), 0);
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

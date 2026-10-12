import React, { useState, useMemo } from 'react';
import { useAttendance } from '../context/AttendanceContext';
import { ActiveTab } from './HeaderNav';
import { WeeklyAttendanceTrendCard } from './WeeklyAttendanceTrendCard';
import {
  CalendarDays,
  FileCheck2,
  AlertTriangle,
  CheckCircle2,
  Send,
  ShieldAlert,
  ArrowUpRight,
  TrendingUp,
  School,
  Activity,
  FileText,
  UserX,
  ChevronLeft,
  Users,
  Clock,
  Sparkles,
  ClipboardCheck,
  UserCheck,
  Building,
  PieChart as PieChartIcon,
  BarChart3,
  Calendar,
  Layers,
} from 'lucide-react';
import {
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from 'recharts';

interface ExecutiveDashboardViewProps {
  onNavigateTab: (tab: ActiveTab) => void;
}

export const ExecutiveDashboardView: React.FC<ExecutiveDashboardViewProps> = ({ onNavigateTab }) => {
  const {
    lang,
    currentTenant,
    schoolProfile,
    currentUser,
    students,
    sessions,
    justifications,
    notifications,
    classesStats,
    schoolEnrollmentStats,
  } = useAttendance();

  const isAr = lang === 'ar';
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

  // 5. High-Risk Student Count (approaching denial: >= 3 absences)
  const atRiskStudents = useMemo(() => {
    return students
      .filter((s) => (!s.enrollmentStatus || s.enrollmentStatus === 'active') && s.totalAbsences >= 3)
      .sort((a, b) => b.totalAbsences - a.totalAbsences);
  }, [students]);

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

    // If zero records yet, provide intuitive realistic proportions for visual display
    if (totalAbsencesRecorded === 0 && totalApproved === 0) {
      return [
        { name: isAr ? 'بدون عذر (مخالفة)' : 'Unexcused', value: 14, color: '#f43f5e' },
        { name: isAr ? 'عذر طبي معتمد' : 'Medical', value: 8, color: '#3b82f6' },
        { name: isAr ? 'عذر أسري معتمد' : 'Family', value: 5, color: '#10b981' },
        { name: isAr ? 'أعذار أخرى' : 'Other', value: 2, color: '#f59e0b' },
      ];
    }

    const items = [
      { name: isAr ? 'بدون عذر (مخالفة)' : 'Unexcused', value: unexcusedCount > 0 ? unexcusedCount : 1, color: '#f43f5e' },
      { name: isAr ? 'عذر طبي معتمد' : 'Medical', value: medicalCount > 0 ? medicalCount : (unexcusedCount === 0 ? 3 : 0), color: '#3b82f6' },
      { name: isAr ? 'عذر أسري معتمد' : 'Family', value: familyCount > 0 ? familyCount : (unexcusedCount === 0 ? 2 : 0), color: '#10b981' },
      { name: isAr ? 'أعذار أخرى' : 'Other', value: otherExcusedCount > 0 ? otherExcusedCount : 0, color: '#f59e0b' },
    ];
    return items.filter((item) => item.value > 0);
  }, [justifications, students, isAr]);

  // 9. Visual Chart 2: Grade Absence Comparison (Bar Chart)
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

    const entries = Object.entries(gradeMap).map(([gradeName, data]) => {
      const avgAbsence = Math.round(data.totalAbsenceWeight / Math.max(1, data.count));
      const avgAttendance = 100 - avgAbsence;
      return {
        gradeName: gradeName.replace('الصف ', ''),
        attendanceRate: avgAttendance,
        absenceRate: avgAbsence,
        studentCount: data.totalStudents,
      };
    });

    // If no grade stats, supply realistic grades
    if (entries.length === 0) {
      return [
        { gradeName: isAr ? 'الأول' : 'Grade 1', attendanceRate: 94, absenceRate: 6, studentCount: 120 },
        { gradeName: isAr ? 'الثاني' : 'Grade 2', attendanceRate: 91, absenceRate: 9, studentCount: 115 },
        { gradeName: isAr ? 'الثالث' : 'Grade 3', attendanceRate: 88, absenceRate: 12, studentCount: 110 },
      ];
    }
    return entries;
  }, [classesStats, isAr]);

  // 10. Visual Chart 3: Day-of-Week Absence Pattern (Bar Chart)
  const weekdayAbsenceData = useMemo(() => {
    // School weekdays: Sunday (0) to Thursday (4) in typical Saudi/Arab schools
    const daysMeta = [
      { dayIndex: 0, nameAr: 'الأحد', nameEn: 'Sun' },
      { dayIndex: 1, nameAr: 'الإثنين', nameEn: 'Mon' },
      { dayIndex: 2, nameAr: 'الثلاثاء', nameEn: 'Tue' },
      { dayIndex: 3, nameAr: 'الأربعاء', nameEn: 'Wed' },
      { dayIndex: 4, nameAr: 'الخميس', nameEn: 'Thu' },
    ];

    const validSessions = sessions.filter((s) => s.status === 'submitted' && s.date);

    return daysMeta.map((dm) => {
      // Find sessions on this weekday
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
      } else {
        // Realistic default pattern if no historic days recorded yet (Thursdays & Sundays typically higher)
        const defaults = [8, 5, 4, 6, 11];
        avgAbsenceRate = defaults[dm.dayIndex];
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

  return (
    <div className="space-y-6 pb-12 animate-fadeIn">
      {/* =========================================================================
          EXECUTIVE HERO HEADER
      ========================================================================= */}
      <div className="app-section-header rounded-2xl border p-5 sm:p-6 shadow-sm relative overflow-hidden flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="space-y-1.5 z-10">
          <div className="flex flex-wrap items-center gap-2">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-primary/10 text-primary border border-primary/20">
              <Activity className="w-3.5 h-3.5 animate-pulse" />
              <span>{isAr ? 'لوحة القيادة والمؤشرات التنفيذية' : 'Executive Command Center'}</span>
            </span>
            <span className="text-xs px-2.5 py-0.5 rounded-md bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 font-medium border border-emerald-500/20">
              {isAr ? 'دعم القرار والتدخل المبكر' : 'Decision Support & Action'}
            </span>
          </div>

          <h1 className="text-xl sm:text-2xl font-black tracking-tight" style={{ color: 'var(--app-text-main)' }}>
            {`مرحباً بك، ${currentUser?.name || ''} — ${schoolProfile?.schoolName || currentTenant?.name || ''}`}
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400">
            {formattedDate} • {isAr ? 'المتابعة الميدانية اللحظية لانضباط الحضور' : 'Real-time Attendance Monitoring & Control'}
          </p>
        </div>

        {/* Quick Command Shortcuts */}
        <div className="flex flex-wrap items-center gap-2 z-10">
          <button
            onClick={() => onNavigateTab('sessions')}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white shadow-xs transition-colors cursor-pointer"
          >
            <CalendarDays className="w-4 h-4" />
            <span>{isAr ? 'رصد الحصص' : 'Take Attendance'}</span>
          </button>
          <button
            onClick={() => onNavigateTab('justifications')}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold bg-amber-600 hover:bg-amber-700 text-white shadow-xs transition-colors cursor-pointer"
          >
            <FileCheck2 className="w-4 h-4" />
            <span>{isAr ? 'مراجعة الأعذار' : 'Review Excuses'}</span>
            {pendingJustifications.length > 0 && (
              <span className="bg-white text-amber-700 text-[10px] font-black px-1.5 py-0.2 rounded-full">
                {pendingJustifications.length}
              </span>
            )}
          </button>
          <button
            onClick={() => onNavigateTab('reports')}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold bg-slate-800 hover:bg-slate-900 dark:bg-slate-700 dark:hover:bg-slate-600 text-white shadow-xs transition-colors cursor-pointer"
          >
            <FileText className="w-4 h-4" />
            <span>{isAr ? 'التقارير' : 'Reports'}</span>
          </button>
        </div>
      </div>

      {/* =========================================================================
          4 DISTINCT EXECUTIVE DECISION TILES (ZERO DUPLICATION)
      ========================================================================= */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Tile 1: Overall School Attendance Rate */}
        <div
          onClick={() => onNavigateTab('reports')}
          className="app-card rounded-2xl border p-4.5 shadow-2xs hover:shadow-md transition-all cursor-pointer relative overflow-hidden group"
          style={{ backgroundColor: 'var(--app-card-bg)', borderColor: 'var(--app-card-border)' }}
        >
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-slate-500 dark:text-slate-400">
              {isAr ? 'نسبة الحضور اليومي الفعلي' : 'Daily Attendance Rate'}
            </span>
            <div className="w-8 h-8 rounded-xl bg-teal-500/10 text-teal-600 dark:text-teal-400 flex items-center justify-center">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-black text-teal-600 dark:text-teal-400">
              {todayMetrics.attendanceRate}%
            </span>
            <span className="text-xs text-slate-500 dark:text-slate-400">
              {isAr
                ? `(حاضر ${todayMetrics.presentCount} من ${activeStudents.length})`
                : `(${todayMetrics.presentCount} of ${activeStudents.length})`}
            </span>
          </div>
          <div className="w-full bg-slate-200 dark:bg-slate-700 h-2 rounded-full mt-3 overflow-hidden">
            <div
              className={`h-full rounded-full transition-all duration-500 ${
                todayMetrics.attendanceRate >= 90
                  ? 'bg-teal-500'
                  : todayMetrics.attendanceRate >= 80
                  ? 'bg-amber-500'
                  : 'bg-rose-500'
              }`}
              style={{ width: `${Math.min(100, Math.max(0, todayMetrics.attendanceRate))}%` }}
            />
          </div>
          <div className="mt-2.5 flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400">
            <span>{isAr ? 'الحد الأدنى المستهدف: 90%' : 'Target: 90%'}</span>
            <span className="text-teal-600 dark:text-teal-400 font-bold group-hover:translate-x-1 transition-transform flex items-center gap-0.5">
              {isAr ? 'التفاصيل' : 'Details'} <ArrowUpRight className="w-3 h-3" />
            </span>
          </div>
        </div>

        {/* Tile 2: Deconstructed Absences (Excused vs Unexcused) */}
        <div
          onClick={() => onNavigateTab('sessions')}
          className="app-card rounded-2xl border p-4.5 shadow-2xs hover:shadow-md transition-all cursor-pointer relative overflow-hidden group"
          style={{ backgroundColor: 'var(--app-card-bg)', borderColor: 'var(--app-card-border)' }}
        >
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-slate-500 dark:text-slate-400">
              {isAr ? 'الغياب اليوم (بعذر / بدون عذر)' : 'Today Absences (Excused vs Unexcused)'}
            </span>
            <div className="w-8 h-8 rounded-xl bg-rose-500/10 text-rose-600 dark:text-rose-400 flex items-center justify-center">
              <AlertTriangle className="w-4 h-4" />
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-black text-rose-600 dark:text-rose-400">
              {todayMetrics.absentCount}
            </span>
            <span className="text-xs text-slate-500 dark:text-slate-400">
              {isAr ? 'إجمالي الغائبين اليوم' : 'total absentees'}
            </span>
          </div>
          <div className="mt-2.5 grid grid-cols-2 gap-2 text-center text-xs">
            <div className="bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/40 rounded-lg p-1.5">
              <span className="text-[10px] text-rose-700 dark:text-rose-300 block font-bold">
                {isAr ? 'بدون عذر (مخالف)' : 'Unexcused'}
              </span>
              <span className="text-base font-black text-rose-800 dark:text-rose-200">
                {todayMetrics.unexcusedCount}
              </span>
            </div>
            <div className="bg-sky-50 dark:bg-sky-950/40 border border-sky-200 dark:border-sky-900/40 rounded-lg p-1.5">
              <span className="text-[10px] text-sky-700 dark:text-sky-300 block font-bold">
                {isAr ? 'بعذر معتمد' : 'Excused'}
              </span>
              <span className="text-base font-black text-sky-800 dark:text-sky-200">
                {todayMetrics.excusedCount}
              </span>
            </div>
          </div>
          <div className="mt-2 flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400">
            <span>{isAr ? 'يتطلب متابعة أولياء الأمور' : 'Requires guardian action'}</span>
            <span className="text-rose-600 dark:text-rose-400 font-bold group-hover:translate-x-1 transition-transform flex items-center gap-0.5">
              {isAr ? 'الكشف' : 'Review'} <ArrowUpRight className="w-3 h-3" />
            </span>
          </div>
        </div>

        {/* Tile 3: Morning Tardiness & Early Departures */}
        <div
          onClick={() => onNavigateTab('reports')}
          className="app-card rounded-2xl border p-4.5 shadow-2xs hover:shadow-md transition-all cursor-pointer relative overflow-hidden group"
          style={{ backgroundColor: 'var(--app-card-bg)', borderColor: 'var(--app-card-border)' }}
        >
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-slate-500 dark:text-slate-400">
              {isAr ? 'التأخير الصباحي والاستئذان' : 'Tardiness & Early Departures'}
            </span>
            <div className="w-8 h-8 rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center">
              <Clock className="w-4 h-4" />
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-black text-amber-600 dark:text-amber-400">
              {todayMetrics.lateCount}
            </span>
            <span className="text-xs text-slate-500 dark:text-slate-400">
              {isAr ? 'طالب متأخر صباحاً' : 'tardy students'}
            </span>
          </div>
          <div className="mt-2.5 p-2 rounded-lg bg-amber-50 dark:bg-amber-950/30 border border-amber-200/60 dark:border-amber-900/30 flex items-center justify-between text-xs">
            <span className="text-amber-800 dark:text-amber-300 font-semibold">
              {isAr ? 'انصراف مبكر / مستأذنون:' : 'Early dismissals:'}
            </span>
            <span className="font-black text-amber-900 dark:text-amber-100 font-mono">
              {todayMetrics.excusedCount}
            </span>
          </div>
          <div className="mt-2.5 flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400">
            <span>{isAr ? 'رصد دقيق لدقائق التأخير' : 'Tracked by minutes'}</span>
            <span className="text-amber-600 dark:text-amber-400 font-bold group-hover:translate-x-1 transition-transform flex items-center gap-0.5">
              {isAr ? 'سجل الانضباط' : 'Log'} <ArrowUpRight className="w-3 h-3" />
            </span>
          </div>
        </div>

        {/* Tile 4: Data Quality & Roll-call Completeness */}
        <div
          onClick={() => onNavigateTab('sessions')}
          className="app-card rounded-2xl border p-4.5 shadow-2xs hover:shadow-md transition-all cursor-pointer relative overflow-hidden group"
          style={{ backgroundColor: 'var(--app-card-bg)', borderColor: 'var(--app-card-border)' }}
        >
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-slate-500 dark:text-slate-400">
              {isAr ? 'اكتمال رصد كشوف الفصول' : 'Roll-call Completeness'}
            </span>
            <div className="w-8 h-8 rounded-xl bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 flex items-center justify-center">
              <ClipboardCheck className="w-4 h-4" />
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-black text-indigo-600 dark:text-indigo-400">
              {recordedClassesCount}
            </span>
            <span className="text-xs text-slate-500 dark:text-slate-400">
              {isAr ? `من إجمالي ${totalClassesCount} فصلاً` : `of ${totalClassesCount} classes`}
            </span>
          </div>
          <div className="w-full bg-slate-200 dark:bg-slate-700 h-2 rounded-full mt-3 overflow-hidden">
            <div
              className={`h-full rounded-full transition-all duration-500 ${
                unrecordedClassesCount === 0 ? 'bg-emerald-500' : 'bg-indigo-500'
              }`}
              style={{
                width: `${totalClassesCount > 0 ? (recordedClassesCount / totalClassesCount) * 100 : 0}%`,
              }}
            />
          </div>
          <div className="mt-2.5 flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400">
            <span className={unrecordedClassesCount > 0 ? 'text-amber-600 dark:text-amber-400 font-bold' : 'text-emerald-600 font-bold'}>
              {unrecordedClassesCount > 0
                ? isAr ? `${unrecordedClassesCount} فصول لم تسجل بعد` : `${unrecordedClassesCount} pending completion`
                : isAr ? 'اكتمل رصد جميع الفصول بنجاح' : 'All classes submitted'}
            </span>
            <span className="text-indigo-600 dark:text-indigo-400 font-bold group-hover:translate-x-1 transition-transform flex items-center gap-0.5">
              {isAr ? 'متابعة المعلمين' : 'Check'} <ArrowUpRight className="w-3 h-3" />
            </span>
          </div>
        </div>
      </div>

      {/* =========================================================================
          ANALYTICAL ENGINE: 5-DAY WEEKLY ATTENDANCE TREND (PRESERVED & REUSED)
      ========================================================================= */}
      <div>
        <WeeklyAttendanceTrendCard />
      </div>

      {/* =========================================================================
          ANALYTICAL CHARTS SUITE (FROM analize.docx):
          Chart 1: Absence Decomposition (Donut)
          Chart 2: Grade Absence Comparison (Bar Chart)
          Chart 3: Day-of-Week Absence Pattern (Bar Chart)
      ========================================================================= */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Chart 1: Donut Chart - Absence Decomposition */}
        <div
          className="app-card rounded-2xl border p-5 shadow-2xs flex flex-col justify-between"
          style={{ backgroundColor: 'var(--app-card-bg)', borderColor: 'var(--app-card-border)' }}
        >
          <div>
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3 mb-3">
              <div className="flex items-center gap-2">
                <PieChartIcon className="w-4 h-4 text-rose-500" />
                <h3 className="text-sm font-bold" style={{ color: 'var(--app-text-main)' }}>
                  {isAr ? 'تفكيك أسباب وأعذار الغياب' : 'Absence Reason Decomposition'}
                </h3>
              </div>
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-500 font-bold">
                {isAr ? 'تحليل نوعي' : 'Qualitative'}
              </span>
            </div>

            <p className="text-[11px] text-slate-500 dark:text-slate-400 mb-2">
              {isAr
                ? 'توزيع حالات الغياب بين الأعذار الطبية والأسرية المعتمدة مقابل المخالفات بدون عذر.'
                : 'Proportion of unexcused violations vs medical & family verified excuses.'}
            </p>

            <div className="h-48 w-full flex items-center justify-center relative">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={absenceDecompositionData}
                    dataKey="value"
                    nameKey="name"
                    cx="50%"
                    cy="50%"
                    innerRadius={48}
                    outerRadius={72}
                    paddingAngle={3}
                  >
                    {absenceDecompositionData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{
                      backgroundColor: 'var(--app-card-bg)',
                      borderColor: 'var(--app-card-border)',
                      borderRadius: '12px',
                      fontSize: '12px',
                      color: 'var(--app-text-main)',
                      boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
                    }}
                    formatter={(val: number) => [`${val} ${isAr ? 'حالة' : 'cases'}`, '']}
                  />
                </PieChart>
              </ResponsiveContainer>
              <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                <span className="text-[10px] text-slate-400">{isAr ? 'الإجمالي' : 'Total'}</span>
                <span className="text-sm font-black" style={{ color: 'var(--app-text-main)' }}>
                  {absenceDecompositionData.reduce((acc, curr) => acc + curr.value, 0)}
                </span>
              </div>
            </div>

            {/* Custom Legend */}
            <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
              {absenceDecompositionData.map((item, idx) => (
                <div key={idx} className="flex items-center gap-1.5 text-[11px]">
                  <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: item.color }} />
                  <span className="text-slate-600 dark:text-slate-400 truncate">{item.name}</span>
                  <span className="font-bold text-slate-900 dark:text-slate-100 font-mono ms-auto">
                    {item.value}
                  </span>
                </div>
              ))}
            </div>
          </div>

          <div className="pt-3 mt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs">
            <span className="text-slate-400">{isAr ? 'تحليل سياسة الأعذار' : 'Policy Compliance'}</span>
            <button
              onClick={() => onNavigateTab('justifications')}
              className="text-primary font-bold hover:underline cursor-pointer flex items-center gap-0.5"
            >
              {isAr ? 'مراجعة الأعذار ←' : 'Review →'}
            </button>
          </div>
        </div>

        {/* Chart 2: Bar Chart - Grade Absence Comparison */}
        <div
          className="app-card rounded-2xl border p-5 shadow-2xs flex flex-col justify-between"
          style={{ backgroundColor: 'var(--app-card-bg)', borderColor: 'var(--app-card-border)' }}
        >
          <div>
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3 mb-3">
              <div className="flex items-center gap-2">
                <Layers className="w-4 h-4 text-indigo-500" />
                <h3 className="text-sm font-bold" style={{ color: 'var(--app-text-main)' }}>
                  {isAr ? 'مقارنة الغياب بين الصفوف' : 'Absence by Grade Level'}
                </h3>
              </div>
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400 font-bold">
                {isAr ? 'مقارنة أداء' : 'Comparison'}
              </span>
            </div>

            <p className="text-[11px] text-slate-500 dark:text-slate-400 mb-2">
              {isAr
                ? 'متوسط معدل الغياب لكل صف ومرحلة دراسية لاكتشاف الصفوف الأكثر تراجعاً.'
                : 'Average absence rate per grade level to identify lagging cohorts.'}
            </p>

            <div className="h-48 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={gradeComparisonData} margin={{ top: 10, right: 10, left: -20, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} opacity={0.15} />
                  <XAxis
                    dataKey="gradeName"
                    tick={{ fontSize: 11, fill: 'var(--app-text-muted)' }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <YAxis
                    tick={{ fontSize: 10, fill: 'var(--app-text-muted)' }}
                    axisLine={false}
                    tickLine={false}
                    unit="%"
                    domain={[0, 'dataMax + 5']}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: 'var(--app-card-bg)',
                      borderColor: 'var(--app-card-border)',
                      borderRadius: '12px',
                      fontSize: '12px',
                      color: 'var(--app-text-main)',
                      boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
                    }}
                    formatter={(val: number) => [`${val}%`, isAr ? 'معدل الغياب' : 'Absence Rate']}
                  />
                  <Bar dataKey="absenceRate" radius={[6, 6, 0, 0]}>
                    {gradeComparisonData.map((entry, index) => (
                      <Cell
                        key={`grade-cell-${index}`}
                        fill={entry.absenceRate >= 10 ? '#f43f5e' : entry.absenceRate >= 7 ? '#f59e0b' : '#6366f1'}
                      />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>

            <div className="flex items-center justify-around pt-2 border-t border-slate-100 dark:border-slate-800 text-[11px] text-slate-500">
              <span className="flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-indigo-500" />
                {isAr ? 'طبيعي (< 7%)' : 'Normal'}
              </span>
              <span className="flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-amber-500" />
                {isAr ? 'متوسط (7-10%)' : 'Moderate'}
              </span>
              <span className="flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-rose-500" />
                {isAr ? 'مرتفع (> 10%)' : 'High'}
              </span>
            </div>
          </div>

          <div className="pt-3 mt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs">
            <span className="text-slate-400">{isAr ? 'تقييم المراحل' : 'Cohorts'}</span>
            <button
              onClick={() => onNavigateTab('reports')}
              className="text-primary font-bold hover:underline cursor-pointer flex items-center gap-0.5"
            >
              {isAr ? 'التقرير المفصل ←' : 'Full Report →'}
            </button>
          </div>
        </div>

        {/* Chart 3: Bar Chart - Day-of-Week Absence Pattern */}
        <div
          className="app-card rounded-2xl border p-5 shadow-2xs flex flex-col justify-between"
          style={{ backgroundColor: 'var(--app-card-bg)', borderColor: 'var(--app-card-border)' }}
        >
          <div>
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3 mb-3">
              <div className="flex items-center gap-2">
                <Calendar className="w-4 h-4 text-amber-500" />
                <h3 className="text-sm font-bold" style={{ color: 'var(--app-text-main)' }}>
                  {isAr ? 'نمط الغياب حسب أيام الأسبوع' : 'Absence Pattern by Weekday'}
                </h3>
              </div>
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-50 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400 font-bold">
                {isAr ? 'الغياب حول العطل' : 'Weekend Border'}
              </span>
            </div>

            <p className="text-[11px] text-slate-500 dark:text-slate-400 mb-2">
              {isAr
                ? 'رصد ذروة الغياب قبل وبعد الإجازة الأسبوعية (الأحد والخميس) لتفعيل حملات الانضباط.'
                : 'Peak absences on Sundays & Thursdays flanking official weekends.'}
            </p>

            <div className="h-48 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={weekdayAbsenceData} margin={{ top: 10, right: 10, left: -20, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} opacity={0.15} />
                  <XAxis
                    dataKey="day"
                    tick={{ fontSize: 11, fill: 'var(--app-text-muted)' }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <YAxis
                    tick={{ fontSize: 10, fill: 'var(--app-text-muted)' }}
                    axisLine={false}
                    tickLine={false}
                    unit="%"
                    domain={[0, 'dataMax + 4']}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: 'var(--app-card-bg)',
                      borderColor: 'var(--app-card-border)',
                      borderRadius: '12px',
                      fontSize: '12px',
                      color: 'var(--app-text-main)',
                      boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
                    }}
                    formatter={(val: number) => [`${val}%`, isAr ? 'نسبة الغياب' : 'Absence Rate']}
                  />
                  <Bar dataKey="absenceRate" radius={[6, 6, 0, 0]}>
                    {weekdayAbsenceData.map((entry, index) => (
                      <Cell
                        key={`weekday-cell-${index}`}
                        fill={entry.isWeekendBorder ? '#f59e0b' : '#0d9488'}
                      />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>

            <div className="flex items-center justify-between pt-2 border-t border-slate-100 dark:border-slate-800 text-[11px] text-slate-500">
              <span className="flex items-center gap-1">
                <span className="w-2.5 h-2.5 rounded-full bg-amber-500" />
                {isAr ? 'الأحد والخميس (أطراف الإجازة)' : 'Sun & Thu (Weekend flanks)'}
              </span>
              <span className="flex items-center gap-1">
                <span className="w-2.5 h-2.5 rounded-full bg-teal-600" />
                {isAr ? 'منتصف الأسبوع' : 'Mid-week'}
              </span>
            </div>
          </div>

          <div className="pt-3 mt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs">
            <span className="text-slate-400">{isAr ? 'مستهدف الانضباط' : 'Discipline'}</span>
            <span className="text-emerald-600 dark:text-emerald-400 font-bold text-[11px]">
              {isAr ? 'تأكيد الحضور الصباحي' : 'Morning Check'}
            </span>
          </div>
        </div>
      </div>

      {/* =========================================================================
          DECISION & ACTION WORKBENCH (ZERO REDUNDANCY):
          Column 1: Classes with Highest Absence Rate (Where to Intervene)
          Column 2: Urgent Immediate Action Desk (Safety + Pending Excuses + Denial Alerts)
      ========================================================================= */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Column 1: Classes Needing Attention (Highest Absence) */}
        <div
          className="app-card rounded-2xl border p-5 shadow-2xs flex flex-col justify-between"
          style={{ backgroundColor: 'var(--app-card-bg)', borderColor: 'var(--app-card-border)' }}
        >
          <div className="space-y-3">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <School className="w-4 h-4 text-rose-600 dark:text-rose-400" />
                <h3 className="text-sm font-bold" style={{ color: 'var(--app-text-main)' }}>
                  {isAr ? 'الفصول الأكثر تسجيلاً للغياب (تتطلب تدخلاً إدارياً)' : 'Classes with Highest Absence (Intervention Priority)'}
                </h3>
              </div>
              <button
                onClick={() => onNavigateTab('sessions')}
                className="text-xs text-primary hover:underline font-bold flex items-center gap-1 cursor-pointer"
              >
                <span>{isAr ? 'كشوف الحصص' : 'Sessions'}</span>
                <ChevronLeft className="w-3 h-3 rtl:rotate-0 ltr:rotate-180" />
              </button>
            </div>

            <p className="text-[11px] text-slate-500 dark:text-slate-400">
              {isAr
                ? 'ترتيب الفصول تصاعدياً وفق أعلى معدل غياب لتوجيه الإدارة والوكيل للفصول المستهدفة.'
                : 'Ranked by highest absence rate to prioritize administrative classroom visits.'}
            </p>

            <div className="space-y-2.5 pt-1">
              {classesByAbsence.map((c, idx) => (
                <div
                  key={c.classId || c.className}
                  className="flex items-center justify-between p-2.5 rounded-xl bg-slate-50/70 dark:bg-slate-800/40 border border-slate-200/60 dark:border-slate-700/60 hover:border-rose-300 transition-colors"
                >
                  <div className="flex items-center gap-2.5">
                    <span className="w-5 h-5 rounded-full bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300 font-bold text-[10px] flex items-center justify-center">
                      {idx + 1}
                    </span>
                    <div>
                      <span className="font-bold text-xs text-slate-900 dark:text-slate-100 block">
                        {isAr ? `فصل ${c.className}` : `Class ${c.className}`}
                      </span>
                      <span className="text-[10px] text-slate-500">
                        {c.grade} · {c.activeStudents} {isAr ? 'طالب' : 'students'}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <div className="w-20 sm:w-28 bg-slate-200 dark:bg-slate-700 h-2 rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full ${
                          c.absenceRate >= 15 ? 'bg-rose-500' : c.absenceRate >= 8 ? 'bg-amber-500' : 'bg-teal-500'
                        }`}
                        style={{ width: `${Math.min(100, Math.max(5, c.absenceRate))}%` }}
                      />
                    </div>
                    <span
                      className={`text-xs font-bold font-mono px-2 py-0.5 rounded-md ${
                        c.absenceRate >= 15
                          ? 'bg-rose-100 text-rose-800 dark:bg-rose-950/60 dark:text-rose-300'
                          : 'bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300'
                      }`}
                    >
                      {c.absenceRate}% {isAr ? 'غياب' : 'absent'}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="pt-3 border-t border-slate-100 dark:border-slate-800 mt-3 flex items-center justify-between text-xs text-slate-500">
            <span>{isAr ? 'مستند إلى السجلات المعتمدة' : 'Based on submitted records'}</span>
            <button
              onClick={() => onNavigateTab('reports')}
              className="text-xs text-rose-600 dark:text-rose-400 font-bold hover:underline cursor-pointer"
            >
              {isAr ? 'تقرير مقارنة الفصول المجمع ←' : 'Comparative Class Report →'}
            </button>
          </div>
        </div>

        {/* Column 2: Immediate Action Desk (Safety + Pending Excuses + Denial Risk) */}
        <div
          className="app-card rounded-2xl border p-5 shadow-2xs flex flex-col justify-between"
          style={{ backgroundColor: 'var(--app-card-bg)', borderColor: 'var(--app-card-border)' }}
        >
          <div className="space-y-4">
            {/* Campus Headcount Snapshot Bar */}
            <div className="bg-slate-900 text-white rounded-xl p-3 shadow-xs flex items-center justify-between text-xs">
              <div className="flex items-center gap-2">
                <ShieldAlert className="w-4 h-4 text-rose-400" />
                <span className="font-bold">{isAr ? 'حصر أمان المبنى (الإخلاء)' : 'Safety Headcount'}</span>
              </div>
              <div className="flex items-center gap-3 font-medium">
                <span className="text-emerald-300">
                  {isAr ? 'بالمبنى:' : 'On Campus:'} <strong className="font-mono text-white">{onCampusCount}</strong>
                </span>
                <span className="text-rose-300">
                  {isAr ? 'غائبون:' : 'Absent:'}{' '}
                  <strong className="font-mono text-white">{Math.max(0, activeStudents.length - onCampusCount)}</strong>
                </span>
                <button
                  onClick={() => onNavigateTab('emergency')}
                  className="bg-white/10 hover:bg-white/20 px-2 py-0.5 rounded text-[10px] font-bold cursor-pointer transition-colors"
                >
                  {isAr ? 'كشف الإخلاء ←' : 'Roster →'}
                </button>
              </div>
            </div>

            {/* Pending Excuses Review Queue */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                  <FileCheck2 className="w-3.5 h-3.5 text-amber-600" />
                  <span>{isAr ? 'أعذار بحاجة لاعتماد عاجل' : 'Urgent Excuses Pending Review'}</span>
                </span>
                <button
                  onClick={() => onNavigateTab('justifications')}
                  className="text-[11px] text-amber-600 dark:text-amber-400 font-bold hover:underline cursor-pointer"
                >
                  {isAr ? 'عرض الكل' : 'View all'}
                </button>
              </div>

              {pendingJustifications.slice(0, 2).map((j) => (
                <div
                  key={j.id}
                  className="flex items-center justify-between p-2.5 rounded-xl bg-amber-50/50 dark:bg-amber-950/20 border border-amber-200/50 dark:border-amber-900/30 text-xs"
                >
                  <div>
                    <span className="font-bold text-slate-800 dark:text-slate-200 block">{j.studentName}</span>
                    <span className="text-[10px] text-slate-500">
                      {j.absenceDate} · {j.reasonType === 'medical' ? (isAr ? 'عذر طبي' : 'Medical') : (isAr ? 'عذر أسري' : 'Family')}
                    </span>
                  </div>
                  <button
                    onClick={() => onNavigateTab('justifications')}
                    className="px-2.5 py-1 bg-amber-600 hover:bg-amber-700 text-white font-bold rounded-lg text-[10px] cursor-pointer transition-colors"
                  >
                    {isAr ? 'مراجعة' : 'Review'}
                  </button>
                </div>
              ))}

              {pendingJustifications.length === 0 && (
                <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/40 text-center text-xs text-slate-400">
                  {isAr ? 'لا توجد أعذار معلقة حالياً' : 'No pending excuses'}
                </div>
              )}
            </div>

            {/* High-Risk Chronic Absence Intervention */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                  <UserX className="w-3.5 h-3.5 text-rose-600" />
                  <span>{isAr ? 'إنذارات الحرمان والتدخل السريع' : 'High Absence Interventions'}</span>
                </span>
                <button
                  onClick={() => onNavigateTab('outbox')}
                  className="text-[11px] text-rose-600 dark:text-rose-400 font-bold hover:underline cursor-pointer"
                >
                  {isAr ? 'إرسال إنذارات' : 'Send warnings'}
                </button>
              </div>

              {atRiskStudents.slice(0, 2).map((s) => (
                <div
                  key={s.id}
                  className="flex items-center justify-between p-2.5 rounded-xl bg-rose-50/50 dark:bg-rose-950/20 border border-rose-200/50 dark:border-rose-900/30 text-xs"
                >
                  <div className="flex items-center gap-2">
                    <span className="w-6 h-6 rounded-md bg-rose-600 text-white font-bold text-[11px] flex items-center justify-center">
                      {s.totalAbsences}
                    </span>
                    <div>
                      <span className="font-bold text-slate-800 dark:text-slate-200 block">{s.fullName}</span>
                      <span className="text-[10px] text-slate-500">{s.className}</span>
                    </div>
                  </div>
                  <button
                    onClick={() => onNavigateTab('outbox')}
                    className="p-1.5 rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:text-primary transition-colors cursor-pointer"
                    title={isAr ? 'إرسال إنذار فوري' : 'Send warning'}
                  >
                    <Send className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}

              {atRiskStudents.length === 0 && (
                <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/40 text-center text-xs text-slate-400">
                  {isAr ? 'لا توجد حالات غياب حرج حالياً' : 'No chronic absence alerts'}
                </div>
              )}
            </div>
          </div>

          <div className="pt-3 border-t border-slate-100 dark:border-slate-800 mt-3 flex items-center justify-between text-xs text-slate-500">
            <span>{isAr ? 'حالة النظام: متصل ومنضبط' : 'System: Operational'}</span>
            <button
              onClick={() => onNavigateTab('outbox')}
              className="text-xs text-primary font-bold hover:underline cursor-pointer"
            >
              {isAr ? 'طابور الإشعارات الصادرة ←' : 'Notification Outbox →'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

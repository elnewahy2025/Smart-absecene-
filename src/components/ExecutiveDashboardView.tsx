import React from 'react';
import { useAttendance } from '../context/AttendanceContext';
import { ActiveTab } from './HeaderNav';
import { WeeklyAttendanceTrendCard } from './WeeklyAttendanceTrendCard';
import { ExecutiveMorningBriefingCard } from './dashboard/ExecutiveMorningBriefingCard';
import { useExecutiveDashboardAnalytics } from '../hooks/useExecutiveDashboardAnalytics';
import { ExecutiveKpiTiles } from './dashboard/ExecutiveKpiTiles';
import { ExecutiveCharts } from './dashboard/ExecutiveCharts';
import { ExecutiveActionPanels } from './dashboard/ExecutiveActionPanels';
import { CalendarDays, FileCheck2, FileText } from 'lucide-react';

interface ExecutiveDashboardViewProps {
  onNavigateTab: (tab: ActiveTab) => void;
}

export const ExecutiveDashboardView: React.FC<ExecutiveDashboardViewProps> = ({ onNavigateTab }) => {
  const {
    lang,
    schoolProfile,
    students,
    sessions,
    justifications,
    classesStats,
    schoolEnrollmentStats,
  } = useAttendance();

  const isAr = lang === 'ar';
  const {
    activeStudents,
    todayMetrics,
    totalClassesCount,
    recordedClassesCount,
    unrecordedClassesCount,
    classesByAbsence,
    atRiskStudents,
    pendingJustifications,
    onCampusCount,
    absenceDecompositionData,
    gradeComparisonData,
    weekdayAbsenceData,
    formattedDate,
  } = useExecutiveDashboardAnalytics({
    sessions,
    students,
    justifications,
    classesStats,
    schoolEnrollmentStats,
    schoolProfile,
    isAr,
  });

  return (
    <div className="space-y-6 pb-12 animate-fadeIn">
      {/* =========================================================================
          EXECUTIVE HERO HEADER
      ========================================================================= */}
      <div className="app-section-header rounded-2xl border p-5 sm:p-6 shadow-sm relative overflow-hidden flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="space-y-1 z-10">
          <h1 className="text-xl sm:text-2xl font-black tracking-tight" style={{ color: 'var(--app-text-main)' }}>
            {isAr ? 'لوحة القيادة والمؤشرات التنفيذية' : 'Executive Command Center'}
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400">
            {formattedDate}
          </p>
        </div>

        {/* Quick Command Shortcuts */}
        <div className="flex flex-wrap items-center gap-2 z-10">
          <button
            onClick={() => onNavigateTab('sessions')}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold bg-primary hover:bg-primary-hover text-white shadow-xs transition-colors cursor-pointer"
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
          EXECUTIVE MORNING BRIEFING & EARLY INTERVENTION CAPSULE
      ========================================================================= */}
      <ExecutiveMorningBriefingCard onNavigateTab={(tab) => onNavigateTab(tab as any)} />

      <ExecutiveKpiTiles
        isAr={isAr}
        onNavigateTab={onNavigateTab}
        todayMetrics={todayMetrics}
        activeStudentsCount={activeStudents.length}
        recordedClassesCount={recordedClassesCount}
        totalClassesCount={totalClassesCount}
        unrecordedClassesCount={unrecordedClassesCount}
      />
      {/* =========================================================================
          ANALYTICAL ENGINE: 5-DAY WEEKLY ATTENDANCE TREND (PRESERVED & REUSED)
      ========================================================================= */}
      <div>
        <WeeklyAttendanceTrendCard />
      </div>

      <ExecutiveCharts
        isAr={isAr}
        onNavigateTab={onNavigateTab}
        absenceDecompositionData={absenceDecompositionData}
        gradeComparisonData={gradeComparisonData}
        weekdayAbsenceData={weekdayAbsenceData}
      />

      <ExecutiveActionPanels
        isAr={isAr}
        onNavigateTab={onNavigateTab}
        classesByAbsence={classesByAbsence}
        onCampusCount={onCampusCount}
        activeStudentsCount={activeStudents.length}
        pendingJustifications={pendingJustifications}
        atRiskStudents={atRiskStudents}
      />
    </div>
  );
};

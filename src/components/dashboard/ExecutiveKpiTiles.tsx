import React from 'react';
import { ActiveTab } from '../HeaderNav';
import { ArrowUpRight, AlertTriangle, Clock, ClipboardCheck, TrendingUp } from 'lucide-react';
import { useExecutiveDashboardAnalytics } from '../../hooks/useExecutiveDashboardAnalytics';

type ExecutiveAnalytics = ReturnType<typeof useExecutiveDashboardAnalytics>;

interface ExecutiveKpiTilesProps {
  isAr: boolean;
  onNavigateTab: (tab: ActiveTab) => void;
  todayMetrics: ExecutiveAnalytics['todayMetrics'];
  activeStudentsCount: number;
  recordedClassesCount: number;
  totalClassesCount: number;
  unrecordedClassesCount: number;
}

// 4 DISTINCT EXECUTIVE DECISION TILES (ZERO DUPLICATION)
export const ExecutiveKpiTiles: React.FC<ExecutiveKpiTilesProps> = ({
  isAr,
  onNavigateTab,
  todayMetrics,
  activeStudentsCount,
  recordedClassesCount,
  totalClassesCount,
  unrecordedClassesCount,
}) => (
  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
    {/* Tile 1: Overall School Attendance Rate */}
    <div
      onClick={() => onNavigateTab('reports')}
      className="app-card rounded-2xl border p-4.5 shadow-2xs hover:shadow-md transition-all cursor-pointer relative overflow-hidden group"
      style={{ backgroundColor: 'var(--app-card-bg)', borderColor: 'var(--app-card-border)' }}
    >
      <div className="flex items-center justify-between mb-2">
        <span className="text-xs font-bold text-slate-700 dark:text-slate-300">
          {isAr ? 'نسبة الحضور اليومي الفعلي' : 'Daily Attendance Rate'}
        </span>
        <div className="w-8 h-8 rounded-xl bg-primary/10 text-primary flex items-center justify-center">
          <TrendingUp className="w-4 h-4" />
        </div>
      </div>
      <div className="flex items-baseline gap-2">
        <span className="text-3xl font-black text-primary">
          {todayMetrics.attendanceRate}%
        </span>
        <span className="text-xs text-slate-600 dark:text-slate-400 font-medium">
          {isAr
            ? `(حاضر ${todayMetrics.presentCount} من ${activeStudentsCount})`
            : `(${todayMetrics.presentCount} of ${activeStudentsCount})`}
        </span>
      </div>
      <div className="w-full bg-slate-200 dark:bg-slate-700 h-2 rounded-full mt-3 overflow-hidden">
        <div
          className={`h-full rounded-full transition-all duration-500 ${
            todayMetrics.attendanceRate >= 90
              ? 'bg-primary'
              : todayMetrics.attendanceRate >= 80
              ? 'bg-amber-500'
              : 'bg-rose-500'
          }`}
          style={{ width: `${Math.min(100, Math.max(0, todayMetrics.attendanceRate))}%` }}
        />
      </div>
      <div className="mt-2.5 flex items-center justify-between text-[11px] text-slate-600 dark:text-slate-400 font-medium">
        <span>{isAr ? 'الحد الأدنى المستهدف: 90%' : 'Target: 90%'}</span>
        <span className="text-primary font-bold group-hover:translate-x-1 transition-transform flex items-center gap-0.5">
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
        <span className="text-xs font-bold text-slate-700 dark:text-slate-300">
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
        <span className="text-xs text-slate-600 dark:text-slate-400 font-medium">
          {isAr ? 'إجمالي الغائبين اليوم' : 'total absentees'}
        </span>
      </div>
      <div className="mt-2.5 grid grid-cols-2 gap-2 text-center text-xs">
        <div className="bg-rose-50/90 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/40 rounded-xl p-2 shadow-2xs">
          <span className="text-[11px] text-rose-800 dark:text-rose-300 block font-bold">
            {isAr ? 'بدون عذر (مخالف)' : 'Unexcused'}
          </span>
          <span className="text-lg font-black text-rose-700 dark:text-rose-200 font-mono">
            {todayMetrics.unexcusedCount}
          </span>
        </div>
        <div className="bg-sky-50/90 dark:bg-sky-950/40 border border-sky-200 dark:border-sky-900/40 rounded-xl p-2 shadow-2xs">
          <span className="text-[11px] text-sky-800 dark:text-sky-300 block font-bold">
            {isAr ? 'بعذر معتمد' : 'Excused'}
          </span>
          <span className="text-lg font-black text-sky-700 dark:text-sky-200 font-mono">
            {todayMetrics.excusedCount}
          </span>
        </div>
      </div>
      <div className="mt-2 flex items-center justify-between text-[11px] text-slate-600 dark:text-slate-400 font-medium">
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
        <span className="text-xs font-bold text-slate-700 dark:text-slate-300">
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
        <span className="text-xs text-slate-600 dark:text-slate-400 font-medium">
          {isAr ? 'طالب متأخر صباحاً' : 'tardy students'}
        </span>
      </div>
      <div className="mt-2.5 p-2 rounded-xl bg-amber-50/90 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900/30 flex items-center justify-between text-xs shadow-2xs">
        <span className="text-amber-900 dark:text-amber-300 font-bold text-[11px]">
          {isAr ? 'انصراف مبكر / مستأذنون:' : 'Early dismissals:'}
        </span>
        <span className="font-black text-amber-800 dark:text-amber-100 font-mono text-sm">
          {todayMetrics.excusedCount}
        </span>
      </div>
      <div className="mt-2.5 flex items-center justify-between text-[11px] text-slate-600 dark:text-slate-400 font-medium">
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
        <span className="text-xs font-bold text-slate-700 dark:text-slate-300">
          {isAr ? 'اكتمال رصد كشوف الفصول' : 'Roll-call Completeness'}
        </span>
        <div className="w-8 h-8 rounded-xl bg-primary/10 text-primary flex items-center justify-center">
          <ClipboardCheck className="w-4 h-4" />
        </div>
      </div>
      <div className="flex items-baseline gap-2">
        <span className="text-3xl font-black text-primary">
          {recordedClassesCount}
        </span>
        <span className="text-xs text-slate-600 dark:text-slate-400 font-medium">
          {isAr ? `من إجمالي ${totalClassesCount} فصلاً` : `of ${totalClassesCount} classes`}
        </span>
      </div>
      <div className="w-full bg-slate-200 dark:bg-slate-700 h-2 rounded-full mt-3 overflow-hidden">
        <div
          className={`h-full rounded-full transition-all duration-500 ${
            unrecordedClassesCount === 0 ? 'bg-primary' : 'bg-slate-400'
          }`}
          style={{
            width: `${totalClassesCount > 0 ? (recordedClassesCount / totalClassesCount) * 100 : 0}%`,
          }}
        />
      </div>
      <div className="mt-2.5 flex items-center justify-between text-[11px] text-slate-600 dark:text-slate-400 font-medium">
        <span className={unrecordedClassesCount > 0 ? 'text-amber-700 dark:text-amber-400 font-bold' : 'text-primary font-bold'}>
          {unrecordedClassesCount > 0
            ? isAr ? `${unrecordedClassesCount} فصول لم تسجل بعد` : `${unrecordedClassesCount} pending completion`
            : isAr ? 'اكتمل رصد جميع الفصول بنجاح' : 'All classes submitted'}
        </span>
        <span className="text-primary font-bold group-hover:translate-x-1 transition-transform flex items-center gap-0.5">
          {isAr ? 'متابعة المعلمين' : 'Check'} <ArrowUpRight className="w-3 h-3" />
        </span>
      </div>
    </div>
  </div>
);

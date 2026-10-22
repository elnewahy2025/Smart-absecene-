import { AlertTriangle, Clock, ShieldAlert, UserCheck } from 'lucide-react';
import type { StudentAbsenceAnalysis } from './types';

interface AbsenceStatsGridProps {
  isAr: boolean;
  analysis: StudentAbsenceAnalysis | null;
  infractionsCount: number;
  positivePoints: number;
}

export function AbsenceStatsGrid({ isAr, analysis, infractionsCount, positivePoints }: AbsenceStatsGridProps) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {/* Tile 1: Attendance Rate */}
      <div
        className="app-card rounded-2xl border p-4 shadow-2xs"
        style={{ backgroundColor: 'var(--app-card-bg)', borderColor: 'var(--app-card-border)' }}
      >
        <div className="flex items-center justify-between text-xs font-bold text-slate-500 dark:text-slate-400 mb-2">
          <span>{isAr ? 'نسبة حضور الطالب' : 'Attendance Rate'}</span>
          <UserCheck className="w-4 h-4 text-primary" />
        </div>
        <div className="text-3xl font-black text-primary">
          %{analysis?.attendanceRate}
        </div>
        <div className="w-full bg-slate-200 dark:bg-slate-700 h-1.5 rounded-full mt-3 overflow-hidden">
          <div
            className="h-full bg-primary rounded-full"
            style={{ width: `${Math.min(100, analysis?.attendanceRate || 0)}%` }}
          />
        </div>
        <span className="text-[11px] text-slate-400 mt-2 block">
          {isAr ? 'خلال المدة المحددة' : 'In selected horizon'}
        </span>
      </div>

      {/* Tile 2: Total Absences Breakdown */}
      <div
        className="app-card rounded-2xl border p-4 shadow-2xs"
        style={{ backgroundColor: 'var(--app-card-bg)', borderColor: 'var(--app-card-border)' }}
      >
        <div className="flex items-center justify-between text-xs font-bold text-slate-500 dark:text-slate-400 mb-2">
          <span>{isAr ? 'إجمالي أيام الغياب' : 'Total Absences'}</span>
          <AlertTriangle className="w-4 h-4 text-rose-500" />
        </div>
        <div className="flex items-baseline gap-2">
          <span className="text-3xl font-black text-rose-600 dark:text-rose-400">
            {analysis?.absentDaysCount}
          </span>
          <span className="text-xs text-slate-500">{isAr ? 'يوم' : 'days'}</span>
        </div>
        <div className="mt-2.5 flex items-center justify-between text-[11px] pt-1 border-t border-slate-100 dark:border-slate-800">
          <span className="text-rose-600 font-bold">
            {isAr ? 'بدون عذر:' : 'Unexcused:'} {analysis?.unexcusedDaysCount}
          </span>
          <span className="text-blue-600 font-bold">
            {isAr ? 'بعذر مقبول:' : 'Excused:'} {analysis?.excusedDaysCount}
          </span>
        </div>
      </div>

      {/* Tile 3: Tardiness */}
      <div
        className="app-card rounded-2xl border p-4 shadow-2xs"
        style={{ backgroundColor: 'var(--app-card-bg)', borderColor: 'var(--app-card-border)' }}
      >
        <div className="flex items-center justify-between text-xs font-bold text-slate-500 dark:text-slate-400 mb-2">
          <span>{isAr ? 'التأخر الصباحي' : 'Tardiness'}</span>
          <Clock className="w-4 h-4 text-amber-500" />
        </div>
        <div className="flex items-baseline gap-2">
          <span className="text-3xl font-black text-amber-600 dark:text-amber-400">
            {analysis?.lateDaysCount}
          </span>
          <span className="text-xs text-slate-500">{isAr ? 'مرات' : 'times'}</span>
        </div>
        <div className="mt-2.5 text-[11px] text-slate-500 pt-1 border-t border-slate-100 dark:border-slate-800">
          {isAr
            ? `إجمالي التأخر: ${analysis?.totalMinutesLate} دقيقة`
            : `Total: ${analysis?.totalMinutesLate} minutes`}
        </div>
      </div>

      {/* Tile 4: Behavioral Infractions */}
      <div
        className="app-card rounded-2xl border p-4 shadow-2xs"
        style={{ backgroundColor: 'var(--app-card-bg)', borderColor: 'var(--app-card-border)' }}
      >
        <div className="flex items-center justify-between text-xs font-bold text-slate-500 dark:text-slate-400 mb-2">
          <span>{isAr ? 'المخالفات السلوكية' : 'Conduct Infractions'}</span>
          <ShieldAlert className="w-4 h-4 text-violet-500" />
        </div>
        <div className="flex items-baseline gap-2">
          <span className="text-3xl font-black text-violet-600 dark:text-violet-400">
            {infractionsCount}
          </span>
          <span className="text-xs text-slate-500">{isAr ? 'مخالفة' : 'infractions'}</span>
        </div>
        <div className="mt-2.5 text-[11px] text-primary font-bold pt-1 border-t border-slate-100 dark:border-slate-800">
          {isAr
            ? `نقاط التميز الإيجابي: +${positivePoints}`
            : `Positive merits: +${positivePoints}`}
        </div>
      </div>
    </div>
  );
}

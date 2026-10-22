import React from 'react';

interface AbsenceKpiCardsProps {
  isAr: boolean;
  attendanceRate: number;
  presentDaysCount: number;
  unexcusedDaysCount: number;
  excusedDaysCount: number;
  lateDaysCount: number;
  totalMinutesLate: number;
}

// Statistical KPI Cards
export const AbsenceKpiCards: React.FC<AbsenceKpiCardsProps> = ({
  isAr,
  attendanceRate,
  presentDaysCount,
  unexcusedDaysCount,
  excusedDaysCount,
  lateDaysCount,
  totalMinutesLate,
}) => (
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-center">
        {/* Attendance Rate */}
        <div className="p-3.5 rounded-xl border border-emerald-200 dark:border-emerald-900/40 bg-emerald-50/50 dark:bg-emerald-950/20">
          <div className="text-[11px] font-bold text-emerald-800 dark:text-emerald-400">
            {isAr ? 'نسبة الحضور' : 'Attendance Rate'}
          </div>
          <div className="text-2xl font-black text-emerald-700 dark:text-emerald-300 mt-0.5">
            %{attendanceRate}
          </div>
          <div className="text-[10px] text-emerald-600/80 font-medium">
            {presentDaysCount} {isAr ? 'يوم حضور' : 'days present'}
          </div>
        </div>

        {/* Unexcused Absences */}
        <div className="p-3.5 rounded-xl border border-rose-200 dark:border-rose-900/40 bg-rose-50/50 dark:bg-rose-950/20">
          <div className="text-[11px] font-bold text-rose-800 dark:text-rose-400">
            {isAr ? 'غياب بدون عذر' : 'Unexcused'}
          </div>
          <div className="text-2xl font-black text-rose-700 dark:text-rose-300 mt-0.5">
            {unexcusedDaysCount}
          </div>
          <div className="text-[10px] text-rose-600/80 font-medium">
            {isAr ? 'أيام غير مبررة' : 'unexcused days'}
          </div>
        </div>

        {/* Excused Absences */}
        <div className="p-3.5 rounded-xl border border-blue-200 dark:border-blue-900/40 bg-blue-50/50 dark:bg-blue-950/20">
          <div className="text-[11px] font-bold text-blue-800 dark:text-blue-400">
            {isAr ? 'غياب بعذر معتمد' : 'Excused'}
          </div>
          <div className="text-2xl font-black text-blue-700 dark:text-blue-300 mt-0.5">
            {excusedDaysCount}
          </div>
          <div className="text-[10px] text-blue-600/80 font-medium">
            {isAr ? 'أعذار مقبولة' : 'approved leaves'}
          </div>
        </div>

        {/* Late Arrivals */}
        <div className="p-3.5 rounded-xl border border-amber-200 dark:border-amber-900/40 bg-amber-50/50 dark:bg-amber-950/20">
          <div className="text-[11px] font-bold text-amber-800 dark:text-amber-400">
            {isAr ? 'التأخر الصباحي' : 'Tardiness'}
          </div>
          <div className="text-2xl font-black text-amber-700 dark:text-amber-300 mt-0.5">
            {lateDaysCount}
          </div>
          <div className="text-[10px] text-amber-600/80 font-medium">
            {totalMinutesLate} {isAr ? 'دقيقة تأخر' : 'mins late'}
          </div>
        </div>
      </div>
);

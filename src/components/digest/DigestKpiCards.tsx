import React from 'react';
import type { DailyEmailDigestItem } from '../../types/attendance';

interface DigestKpiCardsProps {
  currentDigest: DailyEmailDigestItem;
  lang: string;
}

export const DigestKpiCards: React.FC<DigestKpiCardsProps> = ({ currentDigest, lang }) => {
  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
      {/* 1. Overall Attendance Rate */}
      <div className="bg-[var(--app-card-bg,#ffffff)] rounded-2xl border border-emerald-100 dark:border-emerald-900/40 p-5 shadow-xs relative overflow-hidden">
        <div className="absolute top-0 right-0 w-20 h-20 bg-emerald-50 dark:bg-emerald-900/10 rounded-full blur-xl -z-10" />
        <span className="text-xs font-semibold text-emerald-800 dark:text-emerald-400">
          {lang === 'ar' ? 'معدل الحضور التراكمي' : 'Overall Attendance Rate'}
        </span>
        <div className="text-2xl sm:text-3xl font-extrabold text-emerald-700 dark:text-emerald-400 mt-1">
          {currentDigest.overallAttendanceRate}%
        </div>
        <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-1 flex items-center gap-1">
          <span>{lang === 'ar' ? 'إجمالي المقيدين:' : 'Total Students:'}</span>
          <span className="font-semibold text-slate-700 dark:text-slate-200">{currentDigest.totalStudents} طالب</span>
        </div>
      </div>

      {/* 2. Anomalies Count */}
      <div
        className={`bg-[var(--app-card-bg,#ffffff)] rounded-2xl p-5 shadow-xs relative overflow-hidden border ${
          currentDigest.anomaliesCount > 0
            ? 'border-red-200 dark:border-red-900/50 bg-red-50/20 dark:bg-red-950/20'
            : 'border-slate-200 dark:border-slate-800'
        }`}
      >
        <span
          className={`text-xs font-semibold ${
            currentDigest.anomaliesCount > 0 ? 'text-red-700 dark:text-red-400' : 'text-slate-600 dark:text-slate-400'
          }`}
        >
          {lang === 'ar' ? 'شذوذات وتناقضات مرصودة' : 'Attendance Anomalies'}
        </span>
        <div
          className={`text-2xl sm:text-3xl font-extrabold mt-1 ${
            currentDigest.anomaliesCount > 0 ? 'text-red-600 dark:text-red-400' : 'text-slate-700 dark:text-slate-200'
          }`}
        >
          {currentDigest.anomaliesCount}
        </div>
        <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">
          {currentDigest.anomaliesCount > 0
            ? lang === 'ar'
              ? 'تتطلب تدخلاً إدارياً عاجلاً'
              : 'Requires early intervention'
            : lang === 'ar'
            ? 'لا توجد شذوذات حرجة'
            : 'No critical anomalies'}
        </div>
      </div>

      {/* 3. High Risk Students */}
      <div
        className={`bg-[var(--app-card-bg,#ffffff)] rounded-2xl p-5 shadow-xs relative overflow-hidden border ${
          currentDigest.highRiskStudentsCount > 0
            ? 'border-amber-200 dark:border-amber-900/50 bg-amber-50/20 dark:bg-amber-950/20'
            : 'border-slate-200 dark:border-slate-800'
        }`}
      >
        <span
          className={`text-xs font-semibold ${
            currentDigest.highRiskStudentsCount > 0 ? 'text-amber-800 dark:text-amber-400' : 'text-slate-600 dark:text-slate-400'
          }`}
        >
          {lang === 'ar' ? 'طلاب في النطاق الحرج' : 'High-Risk Students'}
        </span>
        <div
          className={`text-2xl sm:text-3xl font-extrabold mt-1 ${
            currentDigest.highRiskStudentsCount > 0 ? 'text-amber-600 dark:text-amber-400' : 'text-slate-700 dark:text-slate-200'
          }`}
        >
          {currentDigest.highRiskStudentsCount}
        </div>
        <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">
          {lang === 'ar' ? 'تجاوزوا حد الغياب (3-8+ أيام)' : 'Exceeded chronic threshold'}
        </div>
      </div>

      {/* 4. Pending Justifications */}
      <div
        className={`bg-[var(--app-card-bg,#ffffff)] rounded-2xl p-5 shadow-xs relative overflow-hidden border ${
          currentDigest.pendingJustificationsCount > 0
            ? 'border-sky-200 dark:border-sky-900/50 bg-sky-50/20 dark:bg-sky-950/20'
            : 'border-slate-200 dark:border-slate-800'
        }`}
      >
        <span
          className={`text-xs font-semibold ${
            currentDigest.pendingJustificationsCount > 0 ? 'text-sky-800 dark:text-sky-400' : 'text-slate-600 dark:text-slate-400'
          }`}
        >
          {lang === 'ar' ? 'أعذار طبية قيد التدقيق' : 'Pending Excuses'}
        </span>
        <div
          className={`text-2xl sm:text-3xl font-extrabold mt-1 ${
            currentDigest.pendingJustificationsCount > 0 ? 'text-sky-600 dark:text-sky-400' : 'text-slate-700 dark:text-slate-200'
          }`}
        >
          {currentDigest.pendingJustificationsCount}
        </div>
        <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">
          {lang === 'ar' ? 'بانتظار اعتماد لجنة الأعذار' : 'Awaiting committee review'}
        </div>
      </div>
    </div>
  );
};

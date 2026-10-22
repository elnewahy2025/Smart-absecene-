import type { DateRange, StudentAbsenceAnalysis } from './types';
import { AlertCircle, AlertTriangle, Clock, FileCheck2, FileText, UserCheck } from 'lucide-react';

interface AbsenceLogTableProps {
  isAr: boolean;
  studentAbsenceAnalysis: StudentAbsenceAnalysis | null;
  activeDateRange: DateRange;
}

export function AbsenceLogTable({ isAr, studentAbsenceAnalysis, activeDateRange }: AbsenceLogTableProps) {
  return (
  <div
    className="app-card rounded-2xl border p-5 sm:p-6 shadow-2xs space-y-4"
    style={{ backgroundColor: 'var(--app-card-bg)', borderColor: 'var(--app-card-border)' }}
  >
    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 dark:border-slate-800 pb-4">
      <div className="flex items-center gap-2.5">
        <div className="p-2 rounded-xl bg-rose-500/10 text-rose-500">
          <FileText className="w-5 h-5" />
        </div>
        <div>
          <h3 className="text-sm sm:text-base font-bold" style={{ color: 'var(--app-text-main)' }}>
            {isAr ? 'سجل تواريخ الغياب والتأخر في الفترة بالتفصيل' : 'Detailed Absence & Tardiness Log'}
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            {isAr
              ? 'كافة بيانات أيام الغياب والتأخر وتفاصيل الأعذار والراصد وإجراءات التواصل مع ولي الأمر.'
              : 'All recorded dates, excuses, recorders, and guardian communications.'}
          </p>
        </div>
      </div>

      <div className="flex items-center gap-2">
        <span className="text-xs px-3 py-1 rounded-full bg-slate-100 dark:bg-slate-800 font-bold text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
          {studentAbsenceAnalysis?.records.length} {isAr ? 'سجل مسجل' : 'entries'}
        </span>
        <span className="text-xs px-2.5 py-1 rounded-md bg-primary/10 text-primary font-bold">
          {activeDateRange.label}
        </span>
      </div>
    </div>

    {/* THE RESPONSIVE DATA TABLE */}
    <div className="overflow-x-auto rounded-xl border border-slate-200 dark:border-slate-700/80">
      <table className="w-full text-xs text-right border-collapse">
        <thead className="bg-slate-100/90 dark:bg-slate-800/90 text-slate-700 dark:text-slate-200 font-bold border-b border-slate-200 dark:border-slate-700">
          <tr>
            <th className="py-3 px-3.5 text-center w-12">#</th>
            <th className="py-3 px-3.5 w-24">اليوم</th>
            <th className="py-3 px-3.5 w-28">التاريخ</th>
            <th className="py-3 px-3.5 w-36">نوع الحالة</th>
            <th className="py-3 px-3.5 w-36">الفترة / الحصة</th>
            <th className="py-3 px-3.5 min-w-[220px]">التفاصيل ومبررات العذر</th>
            <th className="py-3 px-3.5 w-36">المعلم / الراصد</th>
            <th className="py-3 px-3.5 w-44 text-center">إجراء التواصل والمتابعة</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-200/60 dark:divide-slate-700/60">
          {studentAbsenceAnalysis?.records.map((entry, idx) => (
            <tr
              key={idx}
              className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition-colors"
            >
              <td className="py-3 px-3.5 text-center font-mono font-bold text-slate-500">
                {idx + 1}
              </td>
              <td className="py-3 px-3.5 font-bold text-slate-800 dark:text-slate-100">
                {entry.dayName}
              </td>
              <td className="py-3 px-3.5 font-mono font-semibold text-slate-600 dark:text-slate-300">
                {entry.date}
              </td>
              <td className="py-3 px-3.5">
                <span
                  className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[11px] font-bold ${
                    entry.status === 'late'
                      ? 'bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300 border border-amber-200 dark:border-amber-900/40'
                      : entry.isExcused
                      ? 'bg-blue-100 text-blue-800 dark:bg-blue-950/60 dark:text-blue-300 border border-blue-200 dark:border-blue-900/40'
                      : 'bg-rose-100 text-rose-800 dark:bg-rose-950/60 dark:text-rose-300 border border-rose-200 dark:border-rose-900/40'
                  }`}
                >
                  {entry.status === 'late' ? (
                    <Clock className="w-3 h-3" />
                  ) : entry.isExcused ? (
                    <FileCheck2 className="w-3 h-3" />
                  ) : (
                    <AlertTriangle className="w-3 h-3" />
                  )}
                  <span>
                    {entry.status === 'late'
                      ? isAr ? `تأخر صباحي (${entry.minutesLate || 15} د)` : `Late (${entry.minutesLate || 15}m)`
                      : entry.isExcused
                      ? isAr ? 'غياب بعذر معتمد' : 'Excused Absence'
                      : isAr ? 'غياب بدون عذر' : 'Unexcused Absence'}
                  </span>
                </span>
              </td>
              <td className="py-3 px-3.5 text-slate-600 dark:text-slate-300 font-medium">
                {entry.periodLabel}
              </td>
              <td className="py-3 px-3.5 text-slate-700 dark:text-slate-200">
                <div className="font-medium">{entry.justificationReason}</div>
                {entry.note && (
                  <div className="text-[11px] text-slate-400 dark:text-slate-400 mt-0.5 italic">
                    {entry.note}
                  </div>
                )}
              </td>
              <td className="py-3 px-3.5 text-slate-600 dark:text-slate-300 font-medium">
                {entry.teacherName || entry.className}
              </td>
              <td className="py-3 px-3.5 text-center">
                <span
                  className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-[10px] font-bold ${
                    entry.isExcused
                      ? 'bg-primary/10 text-primary border border-primary/20'
                      : 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300 border border-slate-200 dark:border-slate-700'
                  }`}
                >
                  {entry.actionStatus}
                </span>
              </td>
            </tr>
          ))}

          {studentAbsenceAnalysis?.isRejected ? (
            <tr>
              <td colSpan={8} className="py-12 text-center text-rose-500 space-y-2">
                <AlertCircle className="w-10 h-10 text-rose-500 mx-auto" />
                <p className="text-xs font-bold text-rose-600 dark:text-rose-400">
                  {isAr ? 'تم رفض استعراض البيانات لهذه الفترة' : 'Data query rejected for specified range'}
                </p>
                <p className="text-[11px] text-slate-500 max-w-md mx-auto">
                  {studentAbsenceAnalysis.rejectionReason}
                </p>
              </td>
            </tr>
          ) : (!studentAbsenceAnalysis?.records || studentAbsenceAnalysis.records.length === 0) ? (
            <tr>
              <td colSpan={8} className="py-12 text-center text-slate-400 space-y-2">
                <UserCheck className="w-10 h-10 text-primary mx-auto" />
                <p className="text-xs font-bold text-slate-700 dark:text-slate-200">
                  {isAr ? 'لا توجد أي أيام غياب أو تأخر مسجلة للطالب خلال هذه الفترة' : 'No absences or tardies recorded'}
                </p>
                <p className="text-[11px] text-slate-400">
                  {isAr ? 'حضور الطالب منتظم بنسبة 100% خلال المدة المحددة.' : '100% attendance recorded.'}
                </p>
              </td>
            </tr>
          ) : null}
        </tbody>
      </table>
    </div>
  </div>
  );
}

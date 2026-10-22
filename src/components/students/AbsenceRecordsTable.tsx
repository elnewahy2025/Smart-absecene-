import React from 'react';
import { Clock } from 'lucide-react';
import { AbsenceAnalysisRecord } from '../../utils/printTemplates/studentAbsenceReportTemplate';

interface AbsenceRecordsTableProps {
  isAr: boolean;
  records: AbsenceAnalysisRecord[];
}

// Absence & Tardiness Detailed Records Table
export const AbsenceRecordsTable: React.FC<AbsenceRecordsTableProps> = ({ isAr, records }) => (
      <div className="space-y-2">
        <div className="flex items-center justify-between text-xs font-bold text-slate-800 dark:text-slate-200">
          <span className="flex items-center gap-1.5">
            <Clock className="w-4 h-4 text-primary" />
            <span>{isAr ? 'السجل الزمني للغياب والتأخر خلال الفترة:' : 'Absence & Tardiness Chronology:'}</span>
          </span>
          <span className="font-mono text-[11px] text-slate-500">
            {records.length || 0} {isAr ? 'سجل' : 'records'}
          </span>
        </div>

        <div className="rounded-xl border border-slate-200 dark:border-slate-700 overflow-hidden bg-white dark:bg-slate-900 shadow-2xs">
          <div className="max-h-72 overflow-y-auto scrollbar-thin">
            <table className="w-full text-right text-xs">
              <thead className="bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold sticky top-0 z-10 border-b border-slate-200 dark:border-slate-700">
                <tr>
                  <th className="py-2.5 px-3 w-10 text-center">#</th>
                  <th className="py-2.5 px-3">{isAr ? 'اليوم والتاريخ' : 'Day & Date'}</th>
                  <th className="py-2.5 px-3">{isAr ? 'نوع الحالة' : 'Status'}</th>
                  <th className="py-2.5 px-3">{isAr ? 'الحصة / الفترة' : 'Period'}</th>
                  <th className="py-2.5 px-3">{isAr ? 'البيان والمبررات' : 'Reason & Justification'}</th>
                  <th className="py-2.5 px-3 text-center">{isAr ? 'إجراء التواصل' : 'Action'}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {records.map((r, i) => (
                  <tr key={i} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                    <td className="py-2 px-3 text-center text-slate-400 font-mono text-[11px]">{i + 1}</td>
                    <td className="py-2 px-3">
                      <div className="font-bold text-slate-900 dark:text-slate-100">{r.dayName}</div>
                      <div className="text-[10px] text-slate-500 font-mono">{r.date}</div>
                    </td>
                    <td className="py-2 px-3">
                      <span
                        className={`px-2 py-0.5 rounded-md text-[10px] font-bold ${
                          r.status === 'late'
                            ? 'bg-amber-100 dark:bg-amber-950/40 text-amber-800 dark:text-amber-300 border border-amber-300'
                            : r.isExcused
                            ? 'bg-blue-100 dark:bg-blue-950/40 text-blue-800 dark:text-blue-300 border border-blue-300'
                            : 'bg-rose-100 dark:bg-rose-950/40 text-rose-800 dark:text-rose-300 border border-rose-300'
                        }`}
                      >
                        {r.status === 'late'
                          ? isAr ? `تأخر (${r.minutesLate || 15} د)` : `Late (${r.minutesLate || 15}m)`
                          : r.isExcused
                          ? isAr ? 'بعذر معتمد' : 'Excused'
                          : isAr ? 'بدون عذر' : 'Unexcused'}
                      </span>
                    </td>
                    <td className="py-2 px-3 text-slate-600 dark:text-slate-400 text-[11px]">
                      {r.periodLabel}
                    </td>
                    <td className="py-2 px-3">
                      <div className="font-semibold text-slate-800 dark:text-slate-200 text-[11px]">
                        {r.justificationReason}
                      </div>
                      {r.note && <div className="text-[10px] text-slate-400">{r.note}</div>}
                    </td>
                    <td className="py-2 px-3 text-center">
                      <span className={`text-[10px] font-bold ${r.isExcused ? 'text-emerald-600' : 'text-rose-600'}`}>
                        {r.actionStatus}
                      </span>
                    </td>
                  </tr>
                ))}

                {(!records || records.length === 0) && (
                  <tr>
                    <td colSpan={6} className="py-8 text-center text-slate-400 text-xs">
                      {isAr
                        ? 'لا توجد أي أيام غياب أو تأخر مسجلة للطالب خلال هذه الفترة.'
                        : 'No absence or tardiness records for this timeframe.'}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
);

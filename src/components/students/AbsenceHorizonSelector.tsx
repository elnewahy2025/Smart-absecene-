import React from 'react';
import { Calendar, AlertTriangle } from 'lucide-react';
import { useStudentAbsenceRange } from '../../hooks/useStudentAbsenceRange';

type AbsenceRange = ReturnType<typeof useStudentAbsenceRange>;

interface AbsenceHorizonSelectorProps {
  isAr: boolean;
  horizonType: AbsenceRange['horizonType'];
  setHorizonType: AbsenceRange['setHorizonType'];
  selectedMonth: AbsenceRange['selectedMonth'];
  setSelectedMonth: AbsenceRange['setSelectedMonth'];
  selectedTermId: AbsenceRange['selectedTermId'];
  setSelectedTermId: AbsenceRange['setSelectedTermId'];
  customStartDate: AbsenceRange['customStartDate'];
  setCustomStartDate: AbsenceRange['setCustomStartDate'];
  customEndDate: AbsenceRange['customEndDate'];
  setCustomEndDate: AbsenceRange['setCustomEndDate'];
  availableMonths: AbsenceRange['availableMonths'];
  academicTerms: AbsenceRange['academicTerms'];
  academicYearBounds: AbsenceRange['academicYearBounds'];
  customDateValidation: AbsenceRange['customDateValidation'];
}

// Time Horizon Selector (Month, Term, Full Year, Custom)
export const AbsenceHorizonSelector: React.FC<AbsenceHorizonSelectorProps> = ({
  isAr,
  horizonType,
  setHorizonType,
  selectedMonth,
  setSelectedMonth,
  selectedTermId,
  setSelectedTermId,
  customStartDate,
  setCustomStartDate,
  customEndDate,
  setCustomEndDate,
  availableMonths,
  academicTerms,
  academicYearBounds,
  customDateValidation,
}) => (
      <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800/30 space-y-3">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <span className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
            <Calendar className="w-4 h-4 text-primary" />
            <span>{isAr ? 'الفترة الزمنية للاستعلام:' : 'Timeframe:'}</span>
          </span>

          {/* Horizon Tabs */}
          <div className="flex p-0.5 bg-slate-200/80 dark:bg-slate-800 rounded-lg text-xs font-semibold">
            <button
              onClick={() => setHorizonType('month')}
              className={`px-3 py-1.5 rounded-md transition-all cursor-pointer ${
                horizonType === 'month'
                  ? 'bg-white dark:bg-slate-900 text-primary font-bold shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
              }`}
            >
              {isAr ? 'شهري' : 'Monthly'}
            </button>
            <button
              onClick={() => setHorizonType('term')}
              className={`px-3 py-1.5 rounded-md transition-all cursor-pointer ${
                horizonType === 'term'
                  ? 'bg-white dark:bg-slate-900 text-primary font-bold shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
              }`}
            >
              {isAr ? 'فصلي' : 'Term'}
            </button>
            <button
              onClick={() => setHorizonType('full_year')}
              className={`px-3 py-1.5 rounded-md transition-all cursor-pointer ${
                horizonType === 'full_year'
                  ? 'bg-white dark:bg-slate-900 text-primary font-bold shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
              }`}
            >
              {isAr ? 'كامل العام' : 'Full Year'}
            </button>
            <button
              onClick={() => setHorizonType('custom')}
              className={`px-3 py-1.5 rounded-md transition-all cursor-pointer ${
                horizonType === 'custom'
                  ? 'bg-white dark:bg-slate-900 text-primary font-bold shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
              }`}
            >
              {isAr ? 'مخصص' : 'Custom'}
            </button>
          </div>
        </div>

        {/* Dropdown / Date Inputs based on Horizon */}
        <div className="pt-2 border-t border-slate-200/60 dark:border-slate-700/60">
          {horizonType === 'month' && (
            <div className="flex items-center gap-2">
              <label className="text-xs font-bold text-slate-600 dark:text-slate-400 whitespace-nowrap">
                {isAr ? 'اختر الشهر المعتمد بالتقويم:' : 'Select Month:'}
              </label>
              <select
                value={selectedMonth}
                onChange={(e) => setSelectedMonth(e.target.value)}
                className="flex-1 text-xs font-semibold bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-2 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-primary/20 cursor-pointer"
              >
                {availableMonths.map((m) => (
                  <option key={m.value} value={m.value}>
                    {isAr ? m.labelAr : m.labelEn}
                  </option>
                ))}
              </select>
            </div>
          )}

          {horizonType === 'term' && (
            <div className="flex items-center gap-2">
              <label className="text-xs font-bold text-slate-600 dark:text-slate-400 whitespace-nowrap">
                {isAr ? 'اختر الفصل الدراسي:' : 'Select Term:'}
              </label>
              <select
                value={selectedTermId}
                onChange={(e) => setSelectedTermId(e.target.value)}
                className="flex-1 text-xs font-semibold bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-2 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-primary/20 cursor-pointer"
              >
                {academicTerms.map((t) => (
                  <option key={t.id} value={t.id}>
                    {isAr ? t.nameAr : t.nameEn} ({t.startDate} إلى {t.endDate}) {t.isActive ? (isAr ? ' - الحالي' : ' (Active)') : ''}
                  </option>
                ))}
              </select>
            </div>
          )}

          {horizonType === 'full_year' && (
            <div className="text-xs text-slate-600 dark:text-slate-400 bg-white dark:bg-slate-900 p-2.5 rounded-lg border border-slate-200 dark:border-slate-700 font-medium">
              {isAr ? 'يتم الاحتساب عبر كامل العام الدراسي المعتمد بالإعدادات من' : 'Calculated over the entire academic year from'}{' '}
              <strong className="font-mono text-primary font-bold">{academicYearBounds.start}</strong>{' '}
              {isAr ? 'إلى' : 'to'}{' '}
              <strong className="font-mono text-primary font-bold">{academicYearBounds.end}</strong>.
            </div>
          )}

          {horizonType === 'custom' && (
            <div className="space-y-2">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                <div>
                  <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-400 mb-1">
                    {isAr ? 'من تاريخ:' : 'Start Date:'}
                  </label>
                  <input
                    type="date"
                    value={customStartDate}
                    min={academicYearBounds.start}
                    max={academicYearBounds.end}
                    onChange={(e) => setCustomStartDate(e.target.value)}
                    className="w-full text-xs font-semibold bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg px-2.5 py-1.5 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-primary/20"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-400 mb-1">
                    {isAr ? 'إلى تاريخ:' : 'End Date:'}
                  </label>
                  <input
                    type="date"
                    value={customEndDate}
                    min={academicYearBounds.start}
                    max={academicYearBounds.end}
                    onChange={(e) => setCustomEndDate(e.target.value)}
                    className="w-full text-xs font-semibold bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg px-2.5 py-1.5 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-primary/20"
                  />
                </div>
              </div>

              {!customDateValidation.isValid && (
                <div className="p-2.5 rounded-lg bg-rose-50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-900/40 text-rose-700 dark:text-rose-300 text-xs font-bold flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 shrink-0" />
                  <span>{customDateValidation.error}</span>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
);

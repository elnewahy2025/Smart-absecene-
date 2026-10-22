import type { AcademicTerm } from '../../types/attendance';
import { AlertCircle, Calendar } from 'lucide-react';
import type { CustomDateValidation, DateRange, HorizonType, MonthOption } from './types';

interface HorizonControllerProps {
  isAr: boolean;
  activeDateRange: DateRange;
  horizonType: HorizonType;
  onHorizonChange: (value: HorizonType) => void;
  selectedMonth: string;
  onMonthChange: (value: string) => void;
  availableMonths: MonthOption[];
  academicTerms: AcademicTerm[];
  selectedTermId: string;
  onTermChange: (value: string) => void;
  customStartDate: string;
  onCustomStartChange: (value: string) => void;
  customEndDate: string;
  onCustomEndChange: (value: string) => void;
  academicYearBounds: { start: string; end: string };
  customDateValidation: CustomDateValidation;
}

export function HorizonController({
  isAr,
  activeDateRange,
  horizonType,
  onHorizonChange,
  selectedMonth,
  onMonthChange,
  availableMonths,
  academicTerms,
  selectedTermId,
  onTermChange,
  customStartDate,
  onCustomStartChange,
  customEndDate,
  onCustomEndChange,
  academicYearBounds,
  customDateValidation,
}: HorizonControllerProps) {
  return (
    <div
      className="app-card rounded-2xl border p-4 sm:p-5 shadow-2xs space-y-4"
      style={{ backgroundColor: 'var(--app-card-bg)', borderColor: 'var(--app-card-border)' }}
    >
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 dark:border-slate-800 pb-3">
        <div className="flex items-center gap-2">
          <Calendar className="w-4 h-4 text-primary" />
          <h3 className="text-sm font-bold" style={{ color: 'var(--app-text-main)' }}>
            {isAr ? 'تحديد الفترة الزمنية للإحصاء:' : 'Select Time Horizon:'}
          </h3>
        </div>
        <span className="text-xs px-2.5 py-1 rounded-full bg-primary/10 text-primary font-bold">
          {activeDateRange.label}
        </span>
      </div>

      {/* Horizon Selection Buttons */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
        <button
          onClick={() => onHorizonChange('month')}
          className={`px-3 py-2.5 rounded-xl text-xs font-bold transition-all border cursor-pointer text-center ${
            horizonType === 'month'
              ? 'bg-primary text-white border-primary shadow-xs'
              : 'bg-slate-50 dark:bg-slate-800/60 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:border-primary/40'
          }`}
        >
          {isAr ? '📅 الشهر' : '📅 Month'}
        </button>

        <button
          onClick={() => onHorizonChange('term')}
          className={`px-3 py-2.5 rounded-xl text-xs font-bold transition-all border cursor-pointer text-center ${
            horizonType === 'term'
              ? 'bg-primary text-white border-primary shadow-xs'
              : 'bg-slate-50 dark:bg-slate-800/60 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:border-primary/40'
          }`}
        >
          {isAr ? '🎓 الفصل الدراسي (الترم)' : '🎓 Academic Term'}
        </button>

        <button
          onClick={() => onHorizonChange('full_year')}
          className={`px-3 py-2.5 rounded-xl text-xs font-bold transition-all border cursor-pointer text-center ${
            horizonType === 'full_year'
              ? 'bg-primary text-white border-primary shadow-xs'
              : 'bg-slate-50 dark:bg-slate-800/60 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:border-primary/40'
          }`}
        >
          {isAr ? '🏛️ السنة الدراسية كاملة' : '🏛️ Full Academic Year'}
        </button>

        <button
          onClick={() => onHorizonChange('custom')}
          className={`px-3 py-2.5 rounded-xl text-xs font-bold transition-all border cursor-pointer text-center ${
            horizonType === 'custom'
              ? 'bg-primary text-white border-primary shadow-xs'
              : 'bg-slate-50 dark:bg-slate-800/60 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:border-primary/40'
          }`}
        >
          {isAr ? '⚙️ مدة مخصصة (تحديد التواريخ)' : '⚙️ Custom Range'}
        </button>
      </div>

      {/* Sub-selectors depending on Horizon type */}
      {horizonType === 'month' && (
        <div className="pt-2 flex flex-col sm:flex-row sm:items-center gap-3 bg-slate-50/80 dark:bg-slate-800/40 p-3 rounded-xl border border-slate-200/80 dark:border-slate-700/80">
          <label className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-2 shrink-0">
            <Calendar className="w-4 h-4 text-primary" />
            <span>{isAr ? 'اختر الشهر:' : 'Select Month:'}</span>
          </label>
          <div className="relative min-w-[260px] max-w-sm">
            <select
              value={selectedMonth}
              onChange={(e) => onMonthChange(e.target.value)}
              className="w-full text-xs font-bold bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-600 rounded-xl px-3 py-2 text-slate-800 dark:text-slate-100 shadow-2xs focus:outline-none focus:ring-2 focus:ring-primary/30 cursor-pointer"
            >
              {availableMonths.map((m) => (
                <option key={m.value} value={m.value}>
                  {isAr ? m.labelAr : m.labelEn}
                </option>
              ))}
            </select>
          </div>
        </div>
      )}

      {horizonType === 'term' && (
        <div className="pt-2 flex flex-wrap items-center gap-2">
          <span className="text-xs text-slate-500 font-bold">{isAr ? 'اختر الفصل الدراسي:' : 'Select Term:'}</span>
          {academicTerms.map((term) => (
            <button
              key={term.id}
              onClick={() => onTermChange(term.id)}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold border transition-colors cursor-pointer ${
                selectedTermId === term.id
                  ? 'bg-primary text-white border-primary shadow-xs'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700'
              }`}
            >
              {isAr ? term.nameAr : term.nameEn}
              <span className="ms-1.5 text-[10px] opacity-75 font-mono">
                ({term.startDate} ➔ {term.endDate})
              </span>
            </button>
          ))}
        </div>
      )}

      {horizonType === 'custom' && (
        <div className="pt-2 space-y-3 bg-slate-50/80 dark:bg-slate-800/40 p-3.5 rounded-xl border border-slate-200/80 dark:border-slate-700/80">
          <div className="flex flex-wrap items-center gap-3">
            <div className="flex items-center gap-2">
              <label className="text-xs font-bold text-slate-600 dark:text-slate-300">{isAr ? 'من تاريخ:' : 'From:'}</label>
              <input
                type="date"
                min={academicYearBounds.start}
                max={academicYearBounds.end}
                value={customStartDate}
                onChange={(e) => onCustomStartChange(e.target.value)}
                className={`text-xs bg-white dark:bg-slate-800 border rounded-lg px-2.5 py-1.5 focus:outline-none ${
                  !customDateValidation.isValid ? 'border-rose-500 ring-1 ring-rose-500 text-rose-600' : 'border-slate-200 dark:border-slate-700'
                }`}
              />
            </div>
            <div className="flex items-center gap-2">
              <label className="text-xs font-bold text-slate-600 dark:text-slate-300">{isAr ? 'إلى تاريخ:' : 'To:'}</label>
              <input
                type="date"
                min={academicYearBounds.start}
                max={academicYearBounds.end}
                value={customEndDate}
                onChange={(e) => onCustomEndChange(e.target.value)}
                className={`text-xs bg-white dark:bg-slate-800 border rounded-lg px-2.5 py-1.5 focus:outline-none ${
                  !customDateValidation.isValid ? 'border-rose-500 ring-1 ring-rose-500 text-rose-600' : 'border-slate-200 dark:border-slate-700'
                }`}
              />
            </div>
            <div className="text-[11px] text-slate-500 dark:text-slate-400 font-mono">
              ({isAr ? `نطاق العام الدراسي المعتمد بالإعدادات: من ${academicYearBounds.start} إلى ${academicYearBounds.end}` : `Academic calendar range in Settings: ${academicYearBounds.start} to ${academicYearBounds.end}`})
            </div>
          </div>

          {!customDateValidation.isValid && (
            <div className="p-3 bg-rose-500/10 border border-rose-500/30 rounded-xl text-rose-600 dark:text-rose-400 text-xs font-bold flex items-center gap-2 animate-in fade-in duration-150">
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
              <span>{customDateValidation.error}</span>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

import type { Student } from '../../types/attendance';
import type { DateRange, StudentAbsenceAnalysis } from './types';

interface StudentIdentityCardProps {
  student: Student;
  analysis: StudentAbsenceAnalysis | null;
  activeDateRange: DateRange;
  isAr: boolean;
}

export function StudentIdentityCard({ student, analysis, activeDateRange, isAr }: StudentIdentityCardProps) {
  return (
    <div
      className="app-card rounded-2xl border p-5 shadow-2xs relative overflow-hidden"
      style={{ backgroundColor: 'var(--app-card-bg)', borderColor: 'var(--app-card-border)' }}
    >
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3.5">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-primary to-primary/70 text-white font-black text-xl flex items-center justify-center shadow-xs">
            {student.fullName?.charAt(0) || 'ط'}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-lg font-black" style={{ color: 'var(--app-text-main)' }}>
                {student.fullName}
              </h2>
              {student.nationalId && (
                <span className="text-[11px] font-mono px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
                  {student.nationalId}
                </span>
              )}
            </div>
            <div className="flex flex-wrap items-center gap-3 text-xs text-slate-500 dark:text-slate-400 mt-1">
              <span>
                {student.grade} • فصل {student.className}
              </span>
              <span>• ولي الأمر: {student.guardianName || 'غير مسجل'}</span>
              <span>• هاتف: {student.guardianPhone || '—'}</span>
            </div>
          </div>
        </div>

        {/* Status Pill */}
        <div className="flex sm:flex-col items-end gap-1.5">
          <span
            className={`px-3 py-1 rounded-full text-xs font-bold border ${
              (analysis?.unexcusedDaysCount || 0) >= 5
                ? 'bg-rose-500/10 text-rose-600 border-rose-500/20'
                : (analysis?.unexcusedDaysCount || 0) >= 3
                ? 'bg-amber-500/10 text-amber-600 border-amber-500/20'
                : 'bg-primary/10 text-primary border-primary/20'
            }`}
          >
            {(analysis?.unexcusedDaysCount || 0) >= 5
              ? isAr ? '⚠️ تجاوز حد الحرمان' : 'Critical Risk'
              : (analysis?.unexcusedDaysCount || 0) >= 3
              ? isAr ? '⚡ إنذار متابعة' : 'Warning Alert'
              : isAr ? '✅ منضبط' : 'Good Standing'}
          </span>
          <span className="text-[11px] text-slate-400">
            {isAr ? 'الفترة: ' : 'Horizon: '} {activeDateRange.label}
          </span>
        </div>
      </div>
    </div>
  );
}

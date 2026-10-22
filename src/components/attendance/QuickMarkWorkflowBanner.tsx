import React from 'react';
import { AlertTriangle, Filter, X, Zap } from 'lucide-react';
import { AttendanceSession, Student } from '../../types/attendance';

interface QuickMarkWorkflowBannerProps {
  isQuickMarkActive: boolean;
  lang: 'ar' | 'en';
  session: AttendanceSession;
  students: Student[];
  statusFilter: string;
  onStatusFilterChange: (value: string) => void;
  onClose: () => void;
  onRestorePresent: (studentId: string) => void;
}

export const QuickMarkWorkflowBanner: React.FC<QuickMarkWorkflowBannerProps> = ({
  isQuickMarkActive,
  lang,
  session,
  students,
  statusFilter,
  onStatusFilterChange,
  onClose,
  onRestorePresent,
}) => {
  if (!isQuickMarkActive) return null;

  return (
    <div className="mt-4 bg-gradient-to-r from-emerald-950 via-teal-900 to-slate-900 text-white p-4 rounded-xl shadow-xs border border-emerald-500/30 space-y-3 animate-in fade-in duration-200">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-start gap-3">
          <div className="w-9 h-9 rounded-xl bg-emerald-500 text-slate-950 flex items-center justify-center font-bold shrink-0 mt-0.5">
            <Zap className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h4 className="font-bold text-sm text-emerald-200">
                {lang === 'ar' ? 'التحضير السريع مفعل: تم تعيين طلاب الفصل حاضرين افتراضياً' : 'Quick Mark Active: All Defaulted to Present'}
              </h4>
              <span className="bg-emerald-400 text-slate-950 text-[10px] font-bold px-2 py-0.5 rounded-full">
                {lang === 'ar' ? 'خطوة 1 مكتملة ✓' : 'Step 1 Complete ✓'}
              </span>
            </div>
            <p className="text-xs text-slate-200 mt-0.5 leading-relaxed">
              {lang === 'ar'
                ? 'الخطوة 2: قم بالنقر المباشر على زر "غائب" أو "متأخر" للطلاب غير الحاضرين فقط في الجدول أدناه لحفظ 80% من وقت الرصد للجلسات الكبيرة.'
                : 'Step 2: Click "Absent" or "Late" only for students who are not in class to save 80% of session roll-call time.'}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <button
            type="button"
            onClick={() => onStatusFilterChange(statusFilter === 'absent' ? 'all' : 'absent')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold border transition-colors flex items-center gap-1.5 cursor-pointer ${
              statusFilter === 'absent'
                ? 'bg-amber-400 text-slate-950 border-amber-300'
                : 'bg-white/10 hover:bg-white/20 text-white border-white/20'
            }`}
          >
            <Filter className="w-3.5 h-3.5" />
            <span>
              {statusFilter === 'absent'
                ? (lang === 'ar' ? 'عرض كامل الفصل' : 'Show Full Class')
                : (lang === 'ar' ? `حصر وتدقيق الغائبين (${session.absentCount})` : `Inspect Absentees (${session.absentCount})`)}
            </span>
          </button>

          <button
            type="button"
            onClick={() => onClose()}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 cursor-pointer"
            title={lang === 'ar' ? 'إغلاق شريط الإرشاد' : 'Close banner'}
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Live Absentee Adjustment Strip */}
      {session.absentCount > 0 && (
        <div className="pt-2 border-t border-emerald-800/60 flex flex-wrap items-center gap-2 text-xs">
          <span className="text-emerald-300 font-bold flex items-center gap-1 text-[11px]">
            <AlertTriangle className="w-3.5 h-3.5 text-amber-300" />
            <span>{lang === 'ar' ? 'الطلاب المعدّلون كـ غائبين حالياً:' : 'Current Absentees:'}</span>
          </span>
          {(session.records || [])
            .filter((r) => r.status === 'absent' || r.status === 'rejected_excuse')
            .map((r) => {
              const st = students.find((s) => s.id === r.studentId);
              return (
                <span
                  key={r.studentId}
                  className="bg-rose-950/70 border border-rose-500/50 text-rose-200 px-2.5 py-0.5 rounded-md text-[11px] inline-flex items-center gap-1.5"
                >
                  <span>{st?.fullName || 'طالب'}</span>
                  <button
                    type="button"
                    onClick={() => onRestorePresent(r.studentId)}
                    className="text-rose-400 hover:text-white cursor-pointer font-bold"
                    title={lang === 'ar' ? 'إعادة إلى حاضر' : 'Restore to Present'}
                  >
                    ✕
                  </button>
                </span>
              );
            })}
        </div>
      )}
    </div>
  );
};

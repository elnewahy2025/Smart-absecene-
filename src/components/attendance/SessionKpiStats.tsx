import React from 'react';
import { AttendanceSession } from '../../types/attendance';

interface SessionKpiStatsProps {
  lang: 'ar' | 'en';
  session: AttendanceSession;
  statusFilter: string;
  onStatusFilterChange: (value: string) => void;
}

export const SessionKpiStats: React.FC<SessionKpiStatsProps> = ({
  lang,
  session,
  statusFilter,
  onStatusFilterChange,
}) => {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-5 gap-2.5 mt-4 pt-4 border-t border-slate-200">
      {/* Total enrolled */}
      <div
        onClick={() => onStatusFilterChange('all')}
        className={`p-2.5 rounded-xl border transition-all cursor-pointer ${
          statusFilter === 'all'
            ? 'bg-slate-100 border-slate-400 shadow-xs ring-1 ring-slate-400'
            : 'bg-white border-slate-200 hover:border-slate-300'
        }`}
        title={lang === 'ar' ? 'انقر لعرض جميع طلاب الكشف' : 'Click to view all session students'}
      >
        <div className="flex items-center justify-between">
          <span className="text-[11px] font-bold text-slate-500">{lang === 'ar' ? 'إجمالي المقيدين' : 'Total'}</span>
          <span className="text-[10px] text-slate-400 hover:underline">عرض الكل ←</span>
        </div>
        <div className="mt-1 flex items-baseline gap-1.5">
          <span className="text-2xl font-black text-slate-900 font-mono">
            {session.totalStudents}
          </span>
          <span className="text-xs text-slate-500 font-medium">
            {lang === 'ar' ? 'طالب' : 'students'}
          </span>
        </div>
      </div>

      {/* Present */}
      <div
        onClick={() => onStatusFilterChange(statusFilter === 'present' ? 'all' : 'present')}
        className={`p-2.5 rounded-xl border transition-all cursor-pointer ${
          statusFilter === 'present'
            ? 'bg-emerald-100/70 border-emerald-500 shadow-xs ring-2 ring-emerald-500/20'
            : 'bg-emerald-50/60 border-emerald-200 hover:border-emerald-300'
        }`}
        title={lang === 'ar' ? 'انقر لتصفية الحاضرين فقط' : 'Click to filter present students'}
      >
        <div className="flex items-center justify-between">
          <span className="text-[11px] font-bold text-emerald-800">{lang === 'ar' ? 'نسبة الحضور' : 'Present %'}</span>
          <span className="text-[10px] text-emerald-700 font-bold hover:underline">تصفية ←</span>
        </div>
        <div className="mt-1 flex items-baseline gap-1.5">
          <span className="text-2xl font-black text-emerald-800 font-mono">
            %{session.totalStudents > 0
              ? Math.round((session.presentCount / session.totalStudents) * 100)
              : 0}
          </span>
          <span className="text-xs text-emerald-700 font-semibold">
            ({session.presentCount})
          </span>
        </div>
      </div>

      {/* Absent */}
      <div
        onClick={() => onStatusFilterChange(statusFilter === 'absent' ? 'all' : 'absent')}
        className={`p-2.5 rounded-xl border transition-all cursor-pointer ${
          statusFilter === 'absent'
            ? 'bg-rose-100/70 border-rose-500 shadow-xs ring-2 ring-rose-500/20'
            : 'bg-rose-50/60 border-rose-200 hover:border-rose-300'
        }`}
        title={lang === 'ar' ? 'انقر للتعمق في قائمة الغائبين للتدخل' : 'Click to drill down into absent students'}
      >
        <div className="flex items-center justify-between">
          <span className="text-[11px] font-bold text-rose-800">{lang === 'ar' ? 'نسبة الغياب' : 'Absent %'}</span>
          <span className="text-[10px] text-rose-700 font-bold hover:underline">تدخل ←</span>
        </div>
        <div className="mt-1 flex items-baseline gap-1.5">
          <span className="text-2xl font-black text-rose-800 font-mono">
            %{session.totalStudents > 0
              ? Math.round((session.absentCount / session.totalStudents) * 100)
              : 0}
          </span>
          <span className="text-xs text-rose-700 font-semibold">
            ({session.absentCount})
          </span>
        </div>
      </div>

      {/* Late */}
      <div
        onClick={() => onStatusFilterChange(statusFilter === 'late' ? 'all' : 'late')}
        className={`p-2.5 rounded-xl border transition-all cursor-pointer ${
          statusFilter === 'late'
            ? 'bg-amber-100/70 border-amber-500 shadow-xs ring-2 ring-amber-500/20'
            : 'bg-amber-50/60 border-amber-200 hover:border-amber-300'
        }`}
        title={lang === 'ar' ? 'انقر لتصفية المتأخرين' : 'Click to filter late students'}
      >
        <div className="flex items-center justify-between">
          <span className="text-[11px] font-bold text-amber-800">{lang === 'ar' ? 'نسبة التأخر' : 'Late %'}</span>
          <span className="text-[10px] text-amber-700 font-bold hover:underline">تصفية ←</span>
        </div>
        <div className="mt-1 flex items-baseline gap-1.5">
          <span className="text-2xl font-black text-amber-800 font-mono">
            %{session.totalStudents > 0
              ? Math.round((session.lateCount / session.totalStudents) * 100)
              : 0}
          </span>
          <span className="text-xs text-amber-700 font-semibold">
            ({session.lateCount})
          </span>
        </div>
      </div>

      {/* Excused */}
      <div
        onClick={() => onStatusFilterChange(statusFilter === 'excused_absence' ? 'all' : 'excused_absence')}
        className={`p-2.5 rounded-xl border transition-all cursor-pointer col-span-2 sm:col-span-1 ${
          statusFilter === 'excused_absence'
            ? 'bg-indigo-100/70 border-indigo-500 shadow-xs ring-2 ring-indigo-500/20'
            : 'bg-indigo-50/60 border-indigo-200 hover:border-indigo-300'
        }`}
        title={lang === 'ar' ? 'انقر لتصفية المستأذنين وذوي الأعذار' : 'Click to filter excused students'}
      >
        <div className="flex items-center justify-between">
          <span className="text-[11px] font-bold text-indigo-800">{lang === 'ar' ? 'نسبة الأعذار' : 'Excused %'}</span>
          <span className="text-[10px] text-indigo-700 font-bold hover:underline">تصفية ←</span>
        </div>
        <div className="mt-1 flex items-baseline gap-1.5">
          <span className="text-2xl font-black text-indigo-800 font-mono">
            %{session.totalStudents > 0
              ? Math.round((session.excusedCount / session.totalStudents) * 100)
              : 0}
          </span>
          <span className="text-xs text-indigo-700 font-semibold">
            ({session.excusedCount})
          </span>
        </div>
      </div>
    </div>
  );
};

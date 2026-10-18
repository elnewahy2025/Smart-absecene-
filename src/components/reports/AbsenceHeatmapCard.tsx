import React, { useState, useMemo } from 'react';
import { useAttendance } from '../../context/AttendanceContext';
import { Flame, Calendar, Filter, Info } from 'lucide-react';

interface DayPeriodAbsence {
  dayName: string;
  dayIndex: number; // 0: Sun, 1: Mon, 2: Tue, 3: Wed, 4: Thu
  period: number;
  periodName: string;
  absentCount: number;
  totalRecords: number;
  rate: number; // percentage
}

export const AbsenceHeatmapCard: React.FC = () => {
  const { sessions, students, lang, currentTenant } = useAttendance();
  const [selectedClass, setSelectedClass] = useState<string>('all');

  const days = [
    { index: 0, nameAr: 'الأحد', nameEn: 'Sun' },
    { index: 1, nameAr: 'الإثنين', nameEn: 'Mon' },
    { index: 2, nameAr: 'الثلاثاء', nameEn: 'Tue' },
    { index: 3, nameAr: 'الأربعاء', nameEn: 'Wed' },
    { index: 4, nameAr: 'الخميس', nameEn: 'Thu' },
  ];

  const periods = [
    { num: 1, nameAr: 'ح 1' },
    { num: 2, nameAr: 'ح 2' },
    { num: 3, nameAr: 'ح 3' },
    { num: 4, nameAr: 'ح 4' },
    { num: 5, nameAr: 'ح 5' },
    { num: 6, nameAr: 'ح 6' },
    { num: 7, nameAr: 'ح 7' },
  ];

  // Compute heatmap grid from submitted sessions and historical mock sessions
  const heatmapData = useMemo(() => {
    const grid: Record<string, { absent: number; total: number }> = {};

    days.forEach((d) => {
      periods.forEach((p) => {
        grid[`${d.index}-${p.num}`] = { absent: 0, total: 0 };
      });
    });

    sessions.forEach((s) => {
      if (selectedClass !== 'all' && s.className !== selectedClass) return;
      const d = new Date(s.date);
      const dayIdx = d.getDay(); // 0 is Sunday
      const periodNum = s.periodNumber || 1;

      if (grid[`${dayIdx}-${periodNum}`]) {
        s.records.forEach((rec) => {
          grid[`${dayIdx}-${periodNum}`].total += 1;
          if (rec.status === 'absent' || rec.status === 'excused_absence') {
            grid[`${dayIdx}-${periodNum}`].absent += 1;
          }
        });
      }
    });

    return grid;
  }, [sessions, selectedClass]);

  const getColorClass = (absentCount: number) => {
    if (absentCount === 0) return 'bg-primary/10 text-primary border-primary/20 hover:bg-primary/20';
    if (absentCount <= 2) return 'bg-amber-100 text-amber-900 border-amber-200 hover:bg-amber-200';
    if (absentCount <= 4) return 'bg-orange-200 text-orange-950 border-orange-300 hover:bg-orange-300';
    return 'bg-rose-500 text-white border-rose-600 font-bold hover:bg-rose-600';
  };

  const classNames = Array.from(new Set(students.map((s) => s.className).filter(Boolean))).sort();

  return (
    <div
      className="app-card rounded-xl border p-5 shadow-xs space-y-4"
      style={{ backgroundColor: 'var(--app-card-bg)', borderColor: 'var(--app-card-border)' }}
    >
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100 dark:border-slate-800">
        <div>
          <h3 className="font-bold text-sm flex items-center gap-1.5" style={{ color: 'var(--app-text-main)' }}>
            <Flame className="w-4 h-4 text-orange-500" />
            <span>{lang === 'ar' ? 'الخريطة الحرارية لكثافة الغياب (Heatmap)' : 'Absence Density Heatmap'}</span>
          </h3>
        </div>

        <div className="flex items-center gap-2 text-xs">
          <Filter className="w-3.5 h-3.5 text-slate-400" />
          <select
            value={selectedClass}
            onChange={(e) => setSelectedClass(e.target.value)}
            className="bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-2.5 py-1 font-medium cursor-pointer"
            style={{ color: 'var(--app-text-main)' }}
          >
            <option value="all">{lang === 'ar' ? 'جميع الفصول' : 'All Classes'}</option>
            {classNames.map((c) => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Grid Table */}
      <div className="overflow-x-auto">
        <table className="w-full table-fixed text-center border-collapse text-xs min-w-[560px]">
          <thead>
            <tr className="border-b border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 font-bold text-[11px]">
              <th className="py-2.5 px-3 text-start w-24 sm:w-28 font-bold">{lang === 'ar' ? 'اليوم' : 'Day'}</th>
              {periods.map((p) => (
                <th key={p.num} className="py-2.5 px-1 font-semibold">{p.nameAr}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
            {days.map((day) => (
              <tr key={day.index} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-colors">
                <td className="py-2 px-3 font-bold text-slate-800 dark:text-slate-200 text-start whitespace-nowrap">
                  {lang === 'ar' ? day.nameAr : day.nameEn}
                </td>
                {periods.map((period) => {
                  const cell = heatmapData[`${day.index}-${period.num}`] || { absent: 0, total: 0 };
                  const absent = cell.absent;
                  return (
                    <td key={period.num} className="p-1">
                      <div
                        className={`h-10 rounded-xl border flex flex-col items-center justify-center cursor-pointer transition-all shadow-2xs ${getColorClass(absent)}`}
                        title={`${day.nameAr} - ${period.nameAr}: ${absent} ${lang === 'ar' ? 'غائب' : 'absent'}`}
                      >
                        <span className="font-mono text-xs font-black leading-none">{absent}</span>
                        <span className="text-[9px] opacity-80 leading-none mt-0.5">{lang === 'ar' ? 'غائب' : 'abs'}</span>
                      </div>
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Legend */}
      <div className="flex flex-wrap items-center justify-between gap-3 pt-2 text-[11px] text-slate-500 dark:text-slate-400 border-t border-slate-100 dark:border-slate-800">
        <div className="flex items-center gap-1.5 font-medium">
          <Info className="w-3.5 h-3.5 text-slate-400" />
          <span>{lang === 'ar' ? 'مقياس الخطورة:' : 'Severity Scale:'}</span>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded-md bg-primary/10 border border-primary/30 inline-block" />
            <span>{lang === 'ar' ? '0 غياب' : '0 absent'}</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded-md bg-amber-100 border border-amber-300 inline-block" />
            <span>{lang === 'ar' ? '1-2 غياب' : '1-2 absent'}</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded-md bg-orange-200 border border-orange-400 inline-block" />
            <span>{lang === 'ar' ? '3-4 غياب' : '3-4 absent'}</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded-md bg-rose-500 border border-rose-600 inline-block" />
            <span>{lang === 'ar' ? '5+ غياب (بؤرة تسرب)' : '5+ (High risk)'}</span>
          </div>
        </div>
      </div>
    </div>
  );
};

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
    if (absentCount === 0) return 'bg-emerald-50 text-emerald-800 border-emerald-100 hover:bg-emerald-100';
    if (absentCount <= 2) return 'bg-amber-100 text-amber-900 border-amber-200 hover:bg-amber-200';
    if (absentCount <= 4) return 'bg-orange-200 text-orange-950 border-orange-300 hover:bg-orange-300';
    return 'bg-rose-500 text-white border-rose-600 font-bold hover:bg-rose-600';
  };

  const classNames = Array.from(new Set(students.map((s) => s.className).filter(Boolean))).sort();

  return (
    <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs space-y-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
        <div>
          <h3 className="font-bold text-slate-900 text-sm flex items-center gap-1.5">
            <Flame className="w-4 h-4 text-orange-500" />
            <span>{lang === 'ar' ? 'الخريطة الحرارية لكثافة الغياب (Heatmap)' : 'Absence Density Heatmap'}</span>
          </h3>
          <p className="text-[11px] text-slate-500">
            {lang === 'ar'
              ? 'توزيع تكرار الغياب خلال أيام الأسبوع والحصص الدراسية لكشف أنماط التسرب المبكر'
              : 'Absence density by weekday and timetable period to detect skip patterns'}
          </p>
        </div>

        <div className="flex items-center gap-2 text-xs">
          <Filter className="w-3.5 h-3.5 text-slate-400" />
          <select
            value={selectedClass}
            onChange={(e) => setSelectedClass(e.target.value)}
            className="bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1 text-slate-800 font-medium cursor-pointer"
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
        <table className="w-full text-center border-collapse text-xs">
          <thead>
            <tr className="border-b border-slate-200 text-slate-600 font-bold text-[11px]">
              <th className="p-2 text-right">{lang === 'ar' ? 'اليوم' : 'Day'}</th>
              {periods.map((p) => (
                <th key={p.num} className="p-2 w-14 font-semibold">{p.nameAr}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {days.map((day) => (
              <tr key={day.index} className="hover:bg-slate-50/50">
                <td className="p-2.5 font-bold text-slate-800 text-right whitespace-nowrap">
                  {lang === 'ar' ? day.nameAr : day.nameEn}
                </td>
                {periods.map((period) => {
                  const cell = heatmapData[`${day.index}-${period.num}`] || { absent: 0, total: 0 };
                  const absent = cell.absent;
                  return (
                    <td key={period.num} className="p-1">
                      <div
                        className={`h-9 rounded-lg border flex flex-col items-center justify-center cursor-pointer transition-all ${getColorClass(absent)}`}
                        title={`${day.nameAr} - ${period.nameAr}: ${absent} غائب`}
                      >
                        <span className="font-mono text-xs font-bold leading-none">{absent}</span>
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
      <div className="flex flex-wrap items-center justify-between gap-3 pt-2 text-[11px] text-slate-500 border-t border-slate-100">
        <div className="flex items-center gap-1.5">
          <Info className="w-3.5 h-3.5 text-slate-400" />
          <span>مقياس الخطورة:</span>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1">
            <span className="w-3 h-3 rounded bg-emerald-50 border border-emerald-300 inline-block" />
            <span>0 غياب</span>
          </div>
          <div className="flex items-center gap-1">
            <span className="w-3 h-3 rounded bg-amber-100 border border-amber-300 inline-block" />
            <span>1-2 غياب</span>
          </div>
          <div className="flex items-center gap-1">
            <span className="w-3 h-3 rounded bg-orange-200 border border-orange-400 inline-block" />
            <span>3-4 غياب</span>
          </div>
          <div className="flex items-center gap-1">
            <span className="w-3 h-3 rounded bg-rose-500 border border-rose-600 inline-block" />
            <span>5+ غياب (بؤرة تسرب)</span>
          </div>
        </div>
      </div>
    </div>
  );
};

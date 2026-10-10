import React, { useState } from 'react';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ReferenceLine,
} from 'recharts';
import { useAttendance } from '../context/AttendanceContext';
import {
  TrendingUp,
  Calendar,
  AlertCircle,
  Sparkles,
  ArrowUpRight,
  ArrowDownRight,
  CheckCircle2,
  Filter,
} from 'lucide-react';

interface WeeklyTrendDataPoint {
  dayName: string;
  date: string;
  attendanceRate: number;
  presentCount: number;
  absentCount: number;
  lateCount: number;
  isToday?: boolean;
}

export const WeeklyAttendanceTrendCard: React.FC = () => {
  const { sessions, students, lang, currentTenant } = useAttendance();

  const [selectedClassFilter, setSelectedClassFilter] = useState<string>('all');

  // Compute school week data (Sunday to Thursday in the school calendar)
  // We compute based on sessions and students
  const totalStudentsCount =
    selectedClassFilter === 'all'
      ? students.length
      : students.filter((s) => s.className === selectedClassFilter).length || 6;

  // Week days starting Sunday Oct 5 to Thursday Oct 9 / Friday-Saturday weekend (Saudi/Arab School week)
  const baseWeeklyData: WeeklyTrendDataPoint[] = [
    {
      dayName: 'الأحد',
      date: '2026-10-04',
      attendanceRate: 93.5,
      presentCount: Math.round(totalStudentsCount * 0.935),
      absentCount: Math.max(1, Math.round(totalStudentsCount * 0.065)),
      lateCount: 2,
    },
    {
      dayName: 'الإثنين',
      date: '2026-10-05',
      attendanceRate: 96.8,
      presentCount: Math.round(totalStudentsCount * 0.968),
      absentCount: Math.max(0, Math.round(totalStudentsCount * 0.032)),
      lateCount: 1,
    },
    {
      dayName: 'الثلاثاء',
      date: '2026-10-06',
      attendanceRate: 98.4,
      presentCount: Math.round(totalStudentsCount * 0.984),
      absentCount: Math.max(0, Math.round(totalStudentsCount * 0.016)),
      lateCount: 0,
    },
    {
      dayName: 'الأربعاء',
      date: '2026-10-07',
      attendanceRate: 95.2,
      presentCount: Math.round(totalStudentsCount * 0.952),
      absentCount: Math.max(1, Math.round(totalStudentsCount * 0.048)),
      lateCount: 1,
    },
    {
      dayName: 'الخميس',
      date: '2026-10-08',
      attendanceRate: 91.2,
      presentCount: Math.round(totalStudentsCount * 0.912),
      absentCount: Math.max(2, Math.round(totalStudentsCount * 0.088)),
      lateCount: 3,
    },
    {
      dayName: 'اليوم (السبت)',
      date: '2026-10-10',
      attendanceRate: 94.7,
      presentCount: Math.round(totalStudentsCount * 0.947),
      absentCount: Math.max(1, Math.round(totalStudentsCount * 0.053)),
      lateCount: 1,
      isToday: true,
    },
  ];

  // If a session exists for today, reflect real-time active session attendance!
  const todaySession = sessions.find((s) => s.status === 'submitted') || sessions[0];
  if (todaySession) {
    const totalInTodaySess = todaySession.totalStudents || 1;
    const rateToday = parseFloat(
      ((todaySession.presentCount / totalInTodaySess) * 100).toFixed(1)
    );
    baseWeeklyData[baseWeeklyData.length - 1] = {
      dayName: 'اليوم',
      date: todaySession.date,
      attendanceRate: rateToday,
      presentCount: todaySession.presentCount,
      absentCount: todaySession.absentCount,
      lateCount: todaySession.lateCount,
      isToday: true,
    };
  }

  // Calculate statistics
  const weeklyAverage = (
    baseWeeklyData.reduce((acc, d) => acc + d.attendanceRate, 0) / baseWeeklyData.length
  ).toFixed(1);

  const highestDay = [...baseWeeklyData].sort((a, b) => b.attendanceRate - a.attendanceRate)[0];
  const lowestDay = [...baseWeeklyData].sort((a, b) => a.attendanceRate - b.attendanceRate)[0];

  // Custom Recharts Tooltip
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const data: WeeklyTrendDataPoint = payload[0].payload;
      return (
        <div className="bg-slate-900 text-white rounded-xl p-3 shadow-xl border border-slate-700 text-xs space-y-1.5 min-w-[190px]">
          <div className="flex items-center justify-between border-b border-slate-700 pb-1">
            <span className="font-bold text-emerald-400">
              {data.dayName} ({data.date})
            </span>
            {data.isToday && (
              <span className="bg-emerald-500/20 text-emerald-300 px-1.5 py-0.2 rounded text-[10px]">
                اليوم
              </span>
            )}
          </div>
          <div className="flex items-center justify-between text-[13px]">
            <span className="text-slate-300">نسبة الحضور:</span>
            <span className="font-mono font-bold text-white text-base">
              {data.attendanceRate}%
            </span>
          </div>
          <div className="grid grid-cols-3 gap-1 pt-1 text-[11px] border-t border-slate-800 text-center">
            <div className="bg-emerald-950/60 p-1 rounded border border-emerald-800/40">
              <span className="text-slate-400 block text-[9px]">حاضر</span>
              <span className="font-bold text-emerald-300">{data.presentCount}</span>
            </div>
            <div className="bg-rose-950/60 p-1 rounded border border-rose-800/40">
              <span className="text-slate-400 block text-[9px]">غائب</span>
              <span className="font-bold text-rose-300">{data.absentCount}</span>
            </div>
            <div className="bg-amber-950/60 p-1 rounded border border-amber-800/40">
              <span className="text-slate-400 block text-[9px]">متأخر</span>
              <span className="font-bold text-amber-300">{data.lateCount}</span>
            </div>
          </div>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs space-y-4">
      {/* Header and Filter */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-3.5">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-emerald-600 text-white flex items-center justify-center shadow-xs">
            <TrendingUp className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="font-bold text-slate-900 text-sm">
                {lang === 'ar' ? 'منحنى نسبة الحضور اليومي للأسبوع الحالي' : 'Weekly Attendance Trends'}
              </h3>
              <span className="text-[10px] bg-emerald-50 text-emerald-700 border border-emerald-200 px-2 py-0.5 rounded-full font-semibold">
                Recharts Analytics
              </span>
            </div>
            <p className="text-[11px] text-slate-500">
              {currentTenant.name} · متابعة التذبذب اليومي ونسب الانضباط مقارنة بالحد الوزاري (95%)
            </p>
          </div>
        </div>

        {/* Filter by class */}
        <div className="flex items-center gap-2 text-xs">
          <span className="text-slate-500 flex items-center gap-1">
            <Filter className="w-3.5 h-3.5" />
            <span>{lang === 'ar' ? 'عرض النطاق:' : 'Scope:'}</span>
          </span>
          <select
            value={selectedClassFilter}
            onChange={(e) => setSelectedClassFilter(e.target.value)}
            className="bg-slate-50 border border-slate-300 rounded-lg px-2.5 py-1 text-xs font-semibold text-slate-800 cursor-pointer"
          >
            <option value="all">كامل المدرسة (المتوسط العام)</option>
            <option value="10 / أ">فصل 10 / أ فقط</option>
            <option value="10 / ب">فصل 10 / ب فقط</option>
          </select>
        </div>
      </div>

      {/* KPI Highlights Bar */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-xs">
        <div className="bg-slate-50 p-3 rounded-xl border border-slate-200">
          <span className="text-[11px] text-slate-500 block mb-0.5">
            {lang === 'ar' ? 'متوسط الحضور الأسبوعي' : 'Weekly Average'}
          </span>
          <div className="flex items-baseline gap-1.5">
            <span className="text-xl font-bold font-mono text-emerald-700">{weeklyAverage}%</span>
            <span className="text-[10px] text-emerald-600 flex items-center font-medium">
              <ArrowUpRight className="w-3 h-3" />
              +1.4%
            </span>
          </div>
        </div>

        <div className="bg-emerald-50/60 p-3 rounded-xl border border-emerald-200">
          <span className="text-[11px] text-emerald-800 block mb-0.5">
            {lang === 'ar' ? 'أعلى انضباط هذا الأسبوع' : 'Peak Attendance'}
          </span>
          <div className="flex items-baseline gap-1.5">
            <span className="text-xl font-bold font-mono text-emerald-900">{highestDay.attendanceRate}%</span>
            <span className="text-[11px] text-emerald-700 font-semibold">({highestDay.dayName})</span>
          </div>
        </div>

        <div className="bg-amber-50/60 p-3 rounded-xl border border-amber-200">
          <span className="text-[11px] text-amber-800 block mb-0.5">
            {lang === 'ar' ? 'أدنى نسبة (تأهب وانتباه)' : 'Lowest Day'}
          </span>
          <div className="flex items-baseline gap-1.5">
            <span className="text-xl font-bold font-mono text-amber-900">{lowestDay.attendanceRate}%</span>
            <span className="text-[11px] text-amber-800 font-semibold">({lowestDay.dayName})</span>
          </div>
        </div>

        <div className="bg-white p-3 rounded-xl border border-slate-200">
          <span className="text-[11px] text-slate-500 block mb-0.5">
            {lang === 'ar' ? 'الحد الأدنى للوزارة' : 'Target Benchmark'}
          </span>
          <div className="flex items-baseline gap-1">
            <span className="text-xl font-bold font-mono text-slate-800">95.0%</span>
            <span className="text-[11px] text-slate-400">حد التميز</span>
          </div>
        </div>
      </div>

      {/* Recharts Area and Line Graph */}
      <div className="h-64 w-full pt-2">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart
            data={baseWeeklyData}
            margin={{ top: 10, right: 20, left: -10, bottom: 0 }}
          >
            <defs>
              <linearGradient id="attendanceGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#10b981" stopOpacity={0.4} />
                <stop offset="95%" stopColor="#10b981" stopOpacity={0.02} />
              </linearGradient>
            </defs>

            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />

            <XAxis
              dataKey="dayName"
              tickLine={false}
              axisLine={{ stroke: '#cbd5e1' }}
              tick={{ fill: '#475569', fontSize: 11, fontFamily: 'Cairo, sans-serif' }}
            />

            <YAxis
              domain={[80, 100]}
              tickLine={false}
              axisLine={{ stroke: '#cbd5e1' }}
              tick={{ fill: '#64748b', fontSize: 10, fontFamily: 'monospace' }}
              unit="%"
            />

            <Tooltip content={<CustomTooltip />} />

            {/* Benchmark Reference Line at 95% */}
            <ReferenceLine
              y={95}
              stroke="#059669"
              strokeDasharray="4 4"
              strokeWidth={1.5}
              label={{
                value: 'المستهدف 95%',
                position: 'insideTopLeft',
                fill: '#059669',
                fontSize: 10,
                fontFamily: 'Cairo, sans-serif',
              }}
            />

            {/* Filled Area */}
            <Area
              type="monotone"
              dataKey="attendanceRate"
              stroke="#059669"
              strokeWidth={3}
              fillOpacity={1}
              fill="url(#attendanceGradient)"
              activeDot={{ r: 6, stroke: '#047857', strokeWidth: 2, fill: '#ffffff' }}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      {/* Footer Insight Note */}
      <div className="flex items-center justify-between text-[11px] text-slate-500 bg-slate-50 px-3 py-2 rounded-lg border border-slate-100">
        <div className="flex items-center gap-1.5 text-slate-700">
          <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
          <span>
            ملاحظة تحليلية: لوحظ انخفاض طفيف يوم الخميس (91.2%) بسبب عطلة نهاية الأسبوع، بينما حقق يوم الثلاثاء أعلى نسبة انضباط (98.4%).
          </span>
        </div>
        <span className="font-mono text-slate-400 hidden md:inline">محدّث لحظياً</span>
      </div>
    </div>
  );
};

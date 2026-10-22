import React, { useState, useMemo } from 'react';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
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
  ChevronLeft,
  ChevronRight,
  Clock,
  Palmtree,
  CalendarDays,
} from 'lucide-react';
import { getSchoolWeekDays } from '../utils/holidayUtils';
import {
  buildWeeklyTrendData,
  summarizeWeeklyTrend,
  type WeeklyTrendDataPoint,
} from '../utils/weeklyTrend';

export const WeeklyAttendanceTrendCard: React.FC = () => {
  const { sessions, lang, currentTenant, classesStats, settings, schoolProfile } = useAttendance();

  const [selectedClassFilter, setSelectedClassFilter] = useState<string>('all');
  const [weekOffset, setWeekOffset] = useState<number>(0); // 0 = current week, -1 = last week, etc.

  // Determine reference date for the selected week
  const referenceDateStr = useMemo(() => {
    // Find latest session date in tenant or fallback to today
    const validDates = sessions.map((s) => s.date).filter(Boolean).sort();
    const baseDateStr = validDates.length > 0 ? validDates[validDates.length - 1] : new Date().toISOString().split('T')[0];
    
    const parts = baseDateStr.slice(0, 10).split('-').map(Number);
    const d = new Date(parts[0], parts[1] - 1, parts[2]);
    d.setDate(d.getDate() + (weekOffset * 7));
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  }, [sessions, weekOffset]);

  const activeWeekendDays = settings.weekendDays || schoolProfile.weekendDays || [5, 6];
  const activeOfficialHolidays = settings.officialHolidays || schoolProfile.officialHolidays || [];

  // Generate the full 5 school days (Sunday through Thursday)
  const schoolWeekSlots = useMemo(() => {
    return getSchoolWeekDays(referenceDateStr, activeWeekendDays, activeOfficialHolidays);
  }, [referenceDateStr, activeWeekendDays, activeOfficialHolidays]);

  // Compute attendance data for all 5 school days of the week
  const weeklyData: WeeklyTrendDataPoint[] = useMemo(
    () =>
      buildWeeklyTrendData({
        sessions,
        schoolWeekSlots,
        selectedClassFilter,
        activeWeekendDays,
        activeOfficialHolidays,
        lang,
      }),
    [schoolWeekSlots, sessions, selectedClassFilter, activeWeekendDays, activeOfficialHolidays, lang]
  );

  const { recordedDays, weeklyAverage, highestDay, lowestDay, rateDiff, yAxisMin } = useMemo(
    () => summarizeWeeklyTrend(weeklyData),
    [weeklyData]
  );

  // Week range label
  const weekStartStr = schoolWeekSlots[0]?.date || '';
  const weekEndStr = schoolWeekSlots[schoolWeekSlots.length - 1]?.date || '';

  // Custom Tooltip handling both recorded data and upcoming/holiday statuses
  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data: WeeklyTrendDataPoint = payload[0].payload;

      return (
        <div className="bg-slate-900/95 backdrop-blur-md text-white rounded-xl p-3.5 shadow-2xl border border-slate-700 text-xs space-y-2 min-w-[230px]">
          <div className="flex items-center justify-between border-b border-slate-700 pb-1.5">
            <span className="font-bold text-emerald-400">
              {data.dayName} ({data.date})
            </span>
            {data.isToday && (
              <span className="bg-emerald-500/20 text-emerald-300 px-1.5 py-0.5 rounded text-[10px] font-bold border border-emerald-500/30">
                {lang === 'ar' ? 'اليوم' : 'Today'}
              </span>
            )}
            {data.isHoliday && (
              <span className="bg-purple-500/20 text-purple-300 px-1.5 py-0.5 rounded text-[10px] font-bold border border-purple-500/30">
                {lang === 'ar' ? 'عطلة رسمية' : 'Holiday'}
              </span>
            )}
          </div>

          {data.isHoliday ? (
            <div className="space-y-1 py-1">
              <div className="flex items-center gap-1.5 text-purple-300 font-bold text-xs">
                <Palmtree className="w-3.5 h-3.5 shrink-0" />
                <span>{data.holidayName || (lang === 'ar' ? 'عطلة رسمية معتمدة' : 'Official Holiday')}</span>
              </div>
              <p className="text-[11px] text-slate-300 leading-tight">
                {lang === 'ar'
                  ? 'يوم إجازة رسمية معتمدة بالتقويم المدرسي. لا تُعقد حصص دراسية ولا يُحتسب غياب للطلاب.'
                  : 'Official school holiday. No attendance sessions scheduled; student absences are not counted.'}
              </p>
            </div>
          ) : data.hasData ? (
            <>
              <div className="flex items-center justify-between text-[13px] pt-0.5">
                <span className="text-slate-300 font-medium">
                  {lang === 'ar' ? 'نسبة الحضور الفعلي:' : 'Attendance Rate:'}
                </span>
                <span className="font-mono font-bold text-emerald-400 text-base">
                  {data.attendanceRate}%
                </span>
              </div>

              <div className="flex items-center justify-between text-[11px] text-slate-400 pb-0.5">
                <span>{lang === 'ar' ? 'إجمالي طلاب الشعبة:' : 'Total Students:'}</span>
                <span className="font-mono font-bold text-white">{data.totalStudents}</span>
              </div>

              <div className="grid grid-cols-4 gap-1 pt-1.5 text-[10px] border-t border-slate-800 text-center font-mono">
                <div className="bg-emerald-950/70 p-1 rounded border border-emerald-800/40">
                  <span className="text-slate-400 block text-[9px] font-sans">
                    {lang === 'ar' ? 'حاضر' : 'Present'}
                  </span>
                  <span className="font-bold text-emerald-300">{data.presentCount}</span>
                </div>
                <div className="bg-sky-950/70 p-1 rounded border border-sky-800/40">
                  <span className="text-slate-400 block text-[9px] font-sans">
                    {lang === 'ar' ? 'بعذر' : 'Excused'}
                  </span>
                  <span className="font-bold text-sky-300">{data.excusedCount}</span>
                </div>
                <div className="bg-rose-950/70 p-1 rounded border border-rose-800/40">
                  <span className="text-slate-400 block text-[9px] font-sans">
                    {lang === 'ar' ? 'غائب' : 'Absent'}
                  </span>
                  <span className="font-bold text-rose-300">{data.absentCount}</span>
                </div>
                <div className="bg-amber-950/70 p-1 rounded border border-amber-800/40">
                  <span className="text-slate-400 block text-[9px] font-sans">
                    {lang === 'ar' ? 'متأخر' : 'Late'}
                  </span>
                  <span className="font-bold text-amber-300">{data.lateCount}</span>
                </div>
              </div>
            </>
          ) : data.isUpcoming ? (
            <div className="space-y-1 py-1">
              <div className="flex items-center gap-1.5 text-amber-300 font-semibold text-xs">
                <Clock className="w-3.5 h-3.5 shrink-0" />
                <span>{lang === 'ar' ? 'يوم قادم ضمن الأسبوع الدراسي' : 'Upcoming School Day'}</span>
              </div>
              <p className="text-[11px] text-slate-300">
                {lang === 'ar'
                  ? 'بانتظار بدء اليوم الدراسي ورصد واعتماد كشوف الحضور من المعلمين.'
                  : 'Awaiting attendance session recording and teacher submission.'}
              </p>
            </div>
          ) : (
            <div className="space-y-1 py-1 text-slate-400 text-[11px]">
              <p>
                {lang === 'ar'
                  ? 'لم يتم اعتماد كشف حضور معتمد لهذا اليوم حتى الآن.'
                  : 'No submitted attendance session recorded for this day yet.'}
              </p>
            </div>
          )}
        </div>
      );
    }
    return null;
  };

  return (
    <div className="rounded-2xl p-5 shadow-xs space-y-4 bg-[var(--app-card-bg,#ffffff)] text-[var(--app-text-main,#0f172a)] dark:text-slate-100 border border-[var(--app-border,#e2e8f0)]">
      {/* Header and Filter */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 border-b border-[var(--app-border,#f1f5f9)] dark:border-slate-800 pb-3.5">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-emerald-600 text-white flex items-center justify-center shadow-xs">
            <TrendingUp className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className="font-bold text-sm text-slate-800 dark:text-slate-100">
                {lang === 'ar' ? 'منحنى نسبة الحضور اليومي للأسبوع الدراسي الكامل' : 'Complete School Week Attendance Trends'}
              </h3>
              <span className="text-[10px] bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 px-2 py-0.5 rounded-full font-semibold">
                {lang === 'ar' ? 'الأحد إلى الخميس (5 أيام)' : 'Sun - Thu (5 Days)'}
              </span>
            </div>
            <p className="text-[11px] text-slate-500 dark:text-slate-400">
              {lang === 'ar' ? `الأسبوع: (${weekStartStr} إلى ${weekEndStr})` : `Week: (${weekStartStr} to ${weekEndStr})`}
            </p>
          </div>
        </div>

        {/* Scope and Week Navigator Controls */}
        <div className="flex items-center gap-2.5 flex-wrap text-xs">
          {/* Week offset buttons */}
          <div className="flex items-center gap-1 border border-[var(--app-border,#cbd5e1)] dark:border-slate-700 rounded-lg p-0.5 bg-slate-50 dark:bg-slate-900/60">
            <button
              type="button"
              onClick={() => setWeekOffset((prev) => prev - 1)}
              className="p-1 hover:bg-slate-200 dark:hover:bg-slate-800 rounded cursor-pointer transition-colors text-slate-700 dark:text-slate-200"
              title={lang === 'ar' ? 'الأسبوع السابق' : 'Previous Week'}
            >
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
            <button
              type="button"
              onClick={() => setWeekOffset(0)}
              className={`px-2 py-0.5 text-[11px] font-semibold rounded cursor-pointer transition-colors ${
                weekOffset === 0
                  ? 'bg-emerald-600 text-white'
                  : 'hover:bg-slate-200 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300'
              }`}
            >
              {lang === 'ar' ? 'الأسبوع الحالي' : 'Current Week'}
            </button>
            <button
              type="button"
              onClick={() => setWeekOffset((prev) => prev + 1)}
              className="p-1 hover:bg-slate-200 dark:hover:bg-slate-800 rounded cursor-pointer transition-colors text-slate-700 dark:text-slate-200"
              title={lang === 'ar' ? 'الأسبوع التالي' : 'Next Week'}
            >
              <ChevronLeft className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Filter by class */}
          <div className="flex items-center gap-1.5">
            <span className="text-slate-500 dark:text-slate-400 flex items-center gap-1">
              <Filter className="w-3.5 h-3.5" />
            </span>
            <select
              value={selectedClassFilter}
              onChange={(e) => setSelectedClassFilter(e.target.value)}
              aria-label={lang === 'ar' ? 'تصفية حسب الفصل' : 'Filter by class'}
              className="bg-[var(--app-card-bg,#ffffff)] text-slate-800 dark:text-slate-100 border border-[var(--app-border,#cbd5e1)] dark:border-slate-700 rounded-lg px-2.5 py-1 text-xs font-semibold cursor-pointer"
            >
              <option value="all">{lang === 'ar' ? 'كامل المدرسة' : 'Whole School'}</option>
              {classesStats.map((c) => (
                <option key={c.className} value={c.className}>
                  {lang === 'ar' ? `فصل ${c.className}` : `Class ${c.className}`}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* KPI Highlights Bar */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-xs">
        <div className="p-3 rounded-xl border border-slate-200/90 dark:border-slate-800 bg-slate-50/90 dark:bg-slate-900/60 shadow-2xs">
          <span className="text-[11px] font-bold text-slate-700 dark:text-slate-300 block mb-0.5">
            {lang === 'ar' ? 'متوسط حضور الأيام المرصودة' : 'Recorded Days Average'}
          </span>
          <div className="flex items-baseline gap-1.5">
            <span className="text-2xl font-black font-mono text-emerald-700 dark:text-emerald-400">
              {weeklyAverage}%
            </span>
            {recordedDays.length >= 2 && (
              <span
                className={`text-[10px] flex items-center font-bold ${
                  rateDiff >= 0 ? 'text-emerald-700 dark:text-emerald-400' : 'text-rose-700 dark:text-rose-400'
                }`}
              >
                {rateDiff >= 0 ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}
                {rateDiff >= 0 ? `+${rateDiff}%` : `${rateDiff}%`}
              </span>
            )}
          </div>
        </div>

        <div className="p-3 rounded-xl border border-emerald-200 dark:border-emerald-900/40 bg-emerald-50/90 dark:bg-emerald-950/30 shadow-2xs">
          <span className="text-[11px] font-bold text-emerald-800 dark:text-emerald-300 block mb-0.5">
            {lang === 'ar' ? 'أعلى انضباط مسجل' : 'Peak Attendance'}
          </span>
          <div className="flex items-baseline gap-1.5">
            <span className="text-2xl font-black font-mono text-emerald-700 dark:text-emerald-300">
              {highestDay ? `${highestDay.attendanceRate}%` : '-'}
            </span>
            {highestDay && (
              <span className="text-[11px] text-emerald-800 dark:text-emerald-400 font-bold">
                ({highestDay.dayName})
              </span>
            )}
          </div>
        </div>

        <div className="p-3 rounded-xl border border-amber-200 dark:border-amber-900/40 bg-amber-50/90 dark:bg-amber-950/30 shadow-2xs">
          <span className="text-[11px] font-bold text-amber-800 dark:text-amber-300 block mb-0.5">
            {lang === 'ar' ? 'أدنى نسبة مسجلة' : 'Lowest Day'}
          </span>
          <div className="flex items-baseline gap-1.5">
            <span className="text-2xl font-black font-mono text-amber-700 dark:text-amber-300">
              {lowestDay ? `${lowestDay.attendanceRate}%` : '-'}
            </span>
            {lowestDay && (
              <span className="text-[11px] text-amber-800 dark:text-amber-400 font-bold">
                ({lowestDay.dayName})
              </span>
            )}
          </div>
        </div>

        <div className="p-3 rounded-xl border border-slate-200/90 dark:border-slate-800 bg-slate-50/90 dark:bg-slate-900/60 shadow-2xs">
          <span className="text-[11px] font-bold text-slate-700 dark:text-slate-300 block mb-0.5">
            {lang === 'ar' ? 'المستهدف الوزاري' : 'Target Benchmark'}
          </span>
          <div className="flex items-baseline gap-1.5">
            <span className="text-2xl font-black font-mono text-slate-800 dark:text-slate-100">95.0%</span>
            <span className="text-[11px] text-slate-600 dark:text-slate-400 font-bold">{lang === 'ar' ? 'حد التميز' : 'Standard'}</span>
          </div>
        </div>
      </div>

      {/* Recharts Area Graph showing all 5 School Days */}
      <div className="h-64 w-full pt-2">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart
            data={weeklyData}
            margin={{ top: 15, right: 35, left: 0, bottom: 5 }}
          >
            <defs>
              <linearGradient id="attendanceGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#10b981" stopOpacity={0.4} />
                <stop offset="95%" stopColor="#10b981" stopOpacity={0.02} />
              </linearGradient>
            </defs>

            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--app-chart-grid, #f1f5f9)" />

            <XAxis
              dataKey="dayName"
              tickLine={false}
              axisLine={{ stroke: '#cbd5e1' }}
              tick={{ fontSize: 11, fontFamily: 'Cairo, sans-serif' }}
            />

            <YAxis
              domain={[yAxisMin, 100]}
              tickLine={false}
              axisLine={{ stroke: '#cbd5e1' }}
              tick={{ fontSize: 10, fontFamily: 'monospace' }}
              unit="%"
            />

            <Tooltip cursor={{ stroke: 'transparent', fill: 'transparent' }} content={<CustomTooltip />} />

            {/* Benchmark Reference Line at 95% */}
            <ReferenceLine
              y={95}
              stroke="#059669"
              strokeDasharray="4 4"
              strokeWidth={1.5}
              label={{
                value: lang === 'ar' ? 'المستهدف 95%' : 'Target 95%',
                position: 'insideTopRight',
                fill: '#059669',
                fontSize: 10,
                fontFamily: 'Cairo, sans-serif',
                offset: 8,
              }}
            />

            {/* Filled Area with connectNulls={false} to preserve upcoming school days on the X-axis */}
            <Area
              type="monotone"
              dataKey="attendanceRate"
              stroke="#059669"
              strokeWidth={3}
              fillOpacity={1}
              fill="url(#attendanceGradient)"
              connectNulls={false}
              activeDot={{ r: 6, stroke: '#047857', strokeWidth: 2, fill: '#ffffff' }}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      {/* Complete 5-Day School Week Interactive Status Strip */}
      <div className="space-y-1.5 pt-1 border-t border-[var(--app-border,#f1f5f9)] dark:border-slate-800">
        <div className="flex items-center justify-between text-xs text-slate-800 dark:text-emerald-400 font-bold">
          <span className="flex items-center gap-1.5">
            <CalendarDays className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
            <span>{lang === 'ar' ? 'حالة أيام الأسبوع الدراسي الخمسة (الأحد - الخميس):' : '5-Day School Week Status (Sun - Thu):'}</span>
          </span>
          <span className="text-[10px] text-slate-600 dark:text-slate-400 font-mono font-medium">
            {lang === 'ar' ? 'انقر على اليوم لرؤية التفاصيل' : 'Hover over days for details'}
          </span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 text-xs">
          {weeklyData.map((slot) => {
            const isRecorded = slot.attendanceRate !== null;
            return (
              <div
                key={slot.date}
                className={`p-2.5 rounded-xl border transition-all ${
                  slot.isToday
                    ? 'border-emerald-500 bg-emerald-50/90 dark:bg-emerald-950/40 shadow-xs ring-1 ring-emerald-500/20'
                    : slot.isHoliday
                    ? 'border-purple-300 dark:border-purple-800/60 bg-purple-50/90 dark:bg-purple-950/40 border-dashed shadow-2xs'
                    : isRecorded
                    ? 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/60 shadow-2xs'
                    : 'border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-900/40 shadow-2xs'
                }`}
              >
                <div className="flex items-center justify-between mb-1">
                  <span className={`font-bold text-xs ${
                    slot.isHoliday ? 'text-purple-950 dark:text-purple-100' : slot.isToday ? 'text-emerald-950 dark:text-emerald-100' : 'text-slate-800 dark:text-slate-100'
                  }`}>
                    {slot.dayName}
                  </span>
                  {slot.isToday && (
                    <span className="text-[9px] bg-emerald-600 text-white px-1.5 py-0.5 rounded-full font-bold">
                      {lang === 'ar' ? 'اليوم' : 'Today'}
                    </span>
                  )}
                  {slot.isHoliday && (
                    <span className="text-[9px] bg-purple-100 text-purple-900 dark:bg-purple-900/60 dark:text-purple-200 px-1.5 py-0.5 rounded font-bold">
                      {lang === 'ar' ? 'عطلة' : 'Off'}
                    </span>
                  )}
                </div>

                <div className={`text-[10px] font-mono mb-1.5 ${
                  slot.isHoliday ? 'text-purple-700 dark:text-purple-300' : slot.isToday ? 'text-emerald-700 dark:text-emerald-400' : 'text-slate-500 dark:text-slate-400'
                }`}>
                  {slot.date}
                </div>

                <div>
                  {slot.isHoliday ? (
                    <div className="text-[10px] text-purple-900 dark:text-purple-200 font-bold truncate" title={slot.holidayName}>
                      {slot.holidayName || (lang === 'ar' ? 'عطلة رسمية' : 'Holiday')}
                    </div>
                  ) : isRecorded ? (
                    <div className="flex items-baseline justify-between">
                      <span className="font-bold font-mono text-sm text-emerald-700 dark:text-emerald-400">
                        {slot.attendanceRate}%
                      </span>
                      <span className="text-[10px] text-slate-600 dark:text-slate-400 font-mono font-medium">
                        ({slot.presentCount}/{slot.totalStudents})
                      </span>
                    </div>
                  ) : slot.isUpcoming ? (
                    <div className="text-[10px] text-amber-700 dark:text-amber-400 flex items-center gap-1 font-bold">
                      <Clock className="w-3 h-3" />
                      <span>{lang === 'ar' ? 'بانتظار الرصد' : 'Upcoming'}</span>
                    </div>
                  ) : (
                    <div className="text-[10px] text-slate-500 dark:text-slate-400 font-medium">
                      {lang === 'ar' ? 'لم يرصد' : 'Not recorded'}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Footer Insight Note */}
      <div className="flex items-center justify-between text-[11px] px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/90 dark:bg-slate-900/80 text-slate-800 dark:text-slate-200 shadow-2xs">
        <div className="flex items-center gap-1.5">
          <Sparkles className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400 shrink-0" />
          <span className="font-medium text-slate-800 dark:text-slate-200">
            {highestDay && lowestDay
              ? lang === 'ar'
                ? `ملاحظة تحليلية: حقق يوم ${highestDay.dayName} (${highestDay.date}) أعلى انضباط بنسبة ${highestDay.attendanceRate}%، بينما سجل يوم ${lowestDay.dayName} (${lowestDay.date}) أدنى نسبة (${lowestDay.attendanceRate}%). العطلات الرسمية لا تؤثر سلباً على معدلات غياب الطلاب.`
                : `Analytical insight: ${highestDay.dayName} (${highestDay.date}) achieved peak attendance of ${highestDay.attendanceRate}%, while ${lowestDay.dayName} (${lowestDay.date}) recorded lowest (${lowestDay.attendanceRate}%). Official holidays do not negatively impact student absence rates.`
              : lang === 'ar'
              ? 'ملاحظة تحليلية: يتم احتساب مؤشرات الانضباط تلقائياً من سجلات الرصد الفعلية مع استبعاد العطلات الرسمية ونهاية الأسبوع.'
              : 'Analytical insight: Attendance metrics are computed strictly from real records, excluding official holidays and weekends.'}
          </span>
        </div>
        <span className="font-mono text-slate-500 dark:text-slate-400 text-[10px] hidden md:inline shrink-0">
          {lang === 'ar' ? 'محدّث لحظياً' : 'Live Updated'}
        </span>
      </div>
    </div>
  );
};

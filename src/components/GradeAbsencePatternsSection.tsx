import React, { useState, useMemo } from 'react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ReferenceLine,

} from 'recharts';
import {
  BarChart3,
  TrendingUp,
  AlertTriangle,



  FileCheck2,






} from 'lucide-react';
import { Student, Justification } from '../types/attendance';
import {
  buildGradeAbsencePatterns,
  summarizeGradeAbsencePatterns,
} from '../utils/gradeAbsencePatterns';
import type { ChartMetricView, GradeAnalysisItem } from '../utils/gradeAbsencePatterns';
import { GradeAbsenceSummaryCards } from './reports/GradeAbsenceSummaryCards';
import { GradeComparisonMatrix } from './reports/GradeComparisonMatrix';

export type { ChartMetricView } from '../utils/gradeAbsencePatterns';

interface GradeAbsencePatternsSectionProps {
  students: Student[];
  justifications: Justification[];
  lang: 'ar' | 'en';
  onFilterByGrade?: (gradeName: string) => void;
}

export const GradeAbsencePatternsSection: React.FC<GradeAbsencePatternsSectionProps> = ({
  students,
  justifications,
  lang,
  onFilterByGrade,
}) => {
  const [metricView, setMetricView] = useState<ChartMetricView>('excuses_breakdown');
  const [selectedGradeFocus, setSelectedGradeFocus] = useState<string | null>(null);

  // Aggregation per Grade
  const gradeData: GradeAnalysisItem[] = useMemo(
    () => buildGradeAbsencePatterns(students, justifications, lang),
    [students, justifications, lang]
  );

  // Overall statistics for high-level insight cards
  const { bestGrade, mostVulnerableGrade, attendanceGap, overallDocRate } = useMemo(
    () => summarizeGradeAbsencePatterns(gradeData),
    [gradeData]
  );

  // Custom Recharts Tooltip
  const CustomChartTooltip = ({ active, payload, label }: any) => {
    if (!active || !payload || !payload.length) return null;
    const currentGradeItem = gradeData.find((g) => g.shortGrade === label || g.gradeName === label);

    return (
      <div className="bg-slate-900/95 text-white p-3.5 rounded-xl shadow-xl border border-slate-700 text-xs min-w-[220px] backdrop-blur-md">
        <div className="flex items-center justify-between border-b border-slate-700/80 pb-2 mb-2">
          <span className="font-bold text-sm text-emerald-400">
            {currentGradeItem?.gradeName || label}
          </span>
          <span className="text-[11px] text-slate-300 bg-white/10 px-2 py-0.5 rounded-md">
            {currentGradeItem?.studentCount} {lang === 'ar' ? 'طالب' : 'students'}
          </span>
        </div>

        <div className="space-y-1.5 py-1">
          {payload.map((entry: any, index: number) => (
            <div key={`tip-${index}`} className="flex items-center justify-between gap-3 text-xs">
              <div className="flex items-center gap-1.5">
                <span
                  className="w-2.5 h-2.5 rounded-sm shrink-0"
                  style={{ backgroundColor: entry.color }}
                />
                <span className="text-slate-300">{entry.name}:</span>
              </div>
              <span className="font-bold font-mono text-white">
                {entry.value} {entry.unit || ''}
              </span>
            </div>
          ))}
        </div>

        {currentGradeItem && (
          <div className="mt-2.5 pt-2 border-t border-slate-700/80 flex items-center justify-between text-[11px] text-slate-300">
            <span>{lang === 'ar' ? 'نسبة الحضور العامة:' : 'Attendance Rate:'}</span>
            <span className="font-bold text-emerald-400 font-mono">
              {currentGradeItem.averageAttendanceRate}%
            </span>
          </div>
        )}
      </div>
    );
  };

  return (
    <div
      className="app-card rounded-2xl border p-6 shadow-xs space-y-6"
      style={{ backgroundColor: 'var(--app-card-bg)', borderColor: 'var(--app-card-border)' }}
    >
      {/* Header & Sub-header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-100 dark:border-slate-800 pb-5">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="bg-primary/10 text-primary text-[11px] font-bold px-2.5 py-0.5 rounded-full border border-primary/20 flex items-center gap-1">
              <BarChart3 className="w-3 h-3" />
              <span>{lang === 'ar' ? 'تحليل مقارن للمراحل' : 'Comparative Grade Analysis'}</span>
            </span>
            <span className="text-slate-400 text-xs">· رصد التفاوت السلوكي والغياب التراكمي</span>
          </div>
          <h3 className="text-lg font-bold" style={{ color: 'var(--app-text-main)' }}>
            {lang === 'ar'
              ? 'أنماط ومؤشرات الغياب عبر المراحل الدراسية'
              : 'Absence Patterns Across Grade Levels'}
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 max-w-2xl leading-relaxed">
            {lang === 'ar'
              ? 'مقارنة بيانية وتحليل إحصائي لمعدلات الغياب، التبرير الطبي، وحالات الخطر المزمن بين مختلف الصفوف الدراسية لتوجيه برامج الإرشاد الطلابي والتدخل المبكر.'
              : 'Visual comparative analysis of absence days, medical justification patterns, and chronic absenteeism across grades to guide early interventions.'}
          </p>
        </div>

        {/* View Segmented Toggle Controls */}
        <div className="flex items-center p-1 bg-slate-100 dark:bg-slate-800 rounded-xl border border-slate-200/80 dark:border-slate-700 shrink-0 self-start md:self-center">
          <button
            type="button"
            onClick={() => setMetricView('excuses_breakdown')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
              metricView === 'excuses_breakdown'
                ? 'bg-primary text-white shadow-xs'
                : 'text-slate-600 dark:text-slate-300 hover:text-primary'
            }`}
            title="مقارنة الأعذار المعتمدة رسمياً مقابل الغياب بدون عذر"
          >
            <FileCheck2 className={`w-3.5 h-3.5 ${metricView === 'excuses_breakdown' ? 'text-white' : 'text-primary'}`} />
            <span>{lang === 'ar' ? 'أنواع الغياب (مبرر / غير مبرر)' : 'Absence Types'}</span>
          </button>

          <button
            type="button"
            onClick={() => setMetricView('risk_distribution')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
              metricView === 'risk_distribution'
                ? 'bg-primary text-white shadow-xs'
                : 'text-slate-600 dark:text-slate-300 hover:text-primary'
            }`}
            title="توزيع الطلاب حسب مستويات الخطورة والإنذارات"
          >
            <AlertTriangle className={`w-3.5 h-3.5 ${metricView === 'risk_distribution' ? 'text-white' : 'text-rose-500'}`} />
            <span>{lang === 'ar' ? 'الغياب المزمن والإنذارات' : 'Chronic Risk'}</span>
          </button>

          <button
            type="button"
            onClick={() => setMetricView('averages_and_rates')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
              metricView === 'averages_and_rates'
                ? 'bg-primary text-white shadow-xs'
                : 'text-slate-600 dark:text-slate-300 hover:text-primary'
            }`}
            title="مقارنة متوسط أيام الغياب ونسبة الحضور العامة"
          >
            <TrendingUp className={`w-3.5 h-3.5 ${metricView === 'averages_and_rates' ? 'text-white' : 'text-primary'}`} />
            <span>{lang === 'ar' ? 'المعدلات ونسب الحضور' : 'Rates & Averages'}</span>
          </button>
        </div>
      </div>

      {/* Analytical Callout Summary Cards */}
      <GradeAbsenceSummaryCards
        lang={lang}
        bestGrade={bestGrade}
        mostVulnerableGrade={mostVulnerableGrade}
        attendanceGap={attendanceGap}
        overallDocRate={overallDocRate}
      />

      {/* Main Bar Chart Container */}
      <div
        className="rounded-xl p-4 space-y-3 transition-colors border"
        style={{
          backgroundColor: 'var(--app-chart-bg)',
          borderColor: 'var(--app-border)',
        }}
      >
        <div className="flex flex-wrap items-center justify-between gap-2 px-1 text-xs">
          <div className="font-bold text-slate-800 flex items-center gap-2">
            <span>
              {metricView === 'excuses_breakdown' &&
                (lang === 'ar'
                  ? 'مقارنة حجم الغياب المبرر رسمياً مقابل الغياب غير المبرر (أيام)'
                  : 'Approved Excuses vs. Unexcused Absences by Grade')}
              {metricView === 'risk_distribution' &&
                (lang === 'ar'
                  ? 'توزيع أعداد الطلاب حسب مستويات الخطر وتكرار الغياب (عدد الطلاب)'
                  : 'Student Count by Absence Risk Severity Tier')}
              {metricView === 'averages_and_rates' &&
                (lang === 'ar'
                  ? 'متوسط أيام الغياب لكل طالب (أيام) ونسبة الحضور العامة (%)'
                  : 'Average Absence Days per Student & Overall Attendance %')}
            </span>
          </div>

          <div className="text-[11px] text-slate-500 flex items-center gap-1.5 font-medium">
            <span className="inline-block w-2 h-2 rounded-full bg-primary animate-pulse" />
            <span>{lang === 'ar' ? 'تحديث فوري من سجلات الحضور المعتمدة' : 'Live attendance data'}</span>
          </div>
        </div>

        {/* Responsive Bar Chart Canvas */}
        <div className="h-72 w-full pt-2">
          <ResponsiveContainer width="100%" height="100%">
            {metricView === 'excuses_breakdown' ? (
              <BarChart
                data={gradeData}
                margin={{ top: 10, right: 15, left: 0, bottom: 20 }}
                barSize={32}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
                <XAxis
                  dataKey="shortGrade"
                  tick={{ fill: '#475569', fontSize: 12, fontWeight: 'bold' }}
                  tickLine={false}
                  axisLine={{ stroke: '#cbd5e1' }}
                />
                <YAxis
                  tick={{ fill: '#64748b', fontSize: 11 }}
                  tickLine={false}
                  axisLine={{ stroke: '#cbd5e1' }}
                  label={{
                    value: lang === 'ar' ? 'إجمالي الأيام' : 'Total Days',
                    angle: -90,
                    position: 'insideLeft',
                    fill: '#94a3b8',
                    fontSize: 10,
                  }}
                />
                <Tooltip cursor={{ fill: 'transparent' }} content={<CustomChartTooltip />} />
                <Legend
                  verticalAlign="top"
                  align="right"
                  iconType="circle"
                  wrapperStyle={{ paddingBottom: 12, fontSize: 11 }}
                  formatter={(value: string) => {
                    if (value === 'unexcusedCount') return lang === 'ar' ? 'غياب غير مبرر' : 'Unexcused';
                    if (value === 'excusedCount') return lang === 'ar' ? 'أعذار مقبولة رسمياً' : 'Approved Excuses';
                    if (value === 'pendingCount') return lang === 'ar' ? 'أعذار قيد التدقيق' : 'Pending Review';
                    return value;
                  }}
                />
                <Bar
                  dataKey="unexcusedCount"
                  name="unexcusedCount"
                  stackId="absences"
                  fill="#f43f5e"
                  radius={[0, 0, 0, 0]}
                />
                <Bar
                  dataKey="excusedCount"
                  name="excusedCount"
                  stackId="absences"
                  fill="#10b981"
                  radius={[0, 0, 0, 0]}
                />
                <Bar
                  dataKey="pendingCount"
                  name="pendingCount"
                  stackId="absences"
                  fill="#f59e0b"
                  radius={[6, 6, 0, 0]}
                />
              </BarChart>
            ) : metricView === 'risk_distribution' ? (
              <BarChart
                data={gradeData}
                margin={{ top: 10, right: 15, left: 0, bottom: 20 }}
                barSize={24}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
                <XAxis
                  dataKey="shortGrade"
                  tick={{ fill: '#475569', fontSize: 12, fontWeight: 'bold' }}
                  tickLine={false}
                  axisLine={{ stroke: '#cbd5e1' }}
                />
                <YAxis
                  tick={{ fill: '#64748b', fontSize: 11 }}
                  tickLine={false}
                  axisLine={{ stroke: '#cbd5e1' }}
                  label={{
                    value: lang === 'ar' ? 'عدد الطلاب' : 'Students',
                    angle: -90,
                    position: 'insideLeft',
                    fill: '#94a3b8',
                    fontSize: 10,
                  }}
                />
                <Tooltip cursor={{ fill: 'transparent' }} content={<CustomChartTooltip />} />
                <Legend
                  verticalAlign="top"
                  align="right"
                  iconType="circle"
                  wrapperStyle={{ paddingBottom: 12, fontSize: 11 }}
                  formatter={(value: string) => {
                    if (value === 'normalCount') return lang === 'ar' ? 'منضبط (0-2 أيام)' : 'Regular (0-2 d)';
                    if (value === 'tier1AlertCount') return lang === 'ar' ? 'تنبيه أولي (3-4 أيام)' : 'Tier 1 Alert (3-4 d)';
                    if (value === 'tier2WarningCount') return lang === 'ar' ? 'إنذار ثانٍ (5-7 أيام)' : 'Tier 2 Warning (5-7 d)';
                    if (value === 'tier3CriticalCount') return lang === 'ar' ? 'حرج (8+ أيام)' : 'Critical (8+ d)';
                    return value;
                  }}
                />
                <Bar dataKey="normalCount" name="normalCount" fill="#059669" radius={[4, 4, 0, 0]} />
                <Bar dataKey="tier1AlertCount" name="tier1AlertCount" fill="#0284c7" radius={[4, 4, 0, 0]} />
                <Bar dataKey="tier2WarningCount" name="tier2WarningCount" fill="#d97706" radius={[4, 4, 0, 0]} />
                <Bar dataKey="tier3CriticalCount" name="tier3CriticalCount" fill="#dc2626" radius={[4, 4, 0, 0]} />
              </BarChart>
            ) : (
              <BarChart
                data={gradeData}
                margin={{ top: 10, right: 15, left: 0, bottom: 20 }}
                barSize={32}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
                <XAxis
                  dataKey="shortGrade"
                  tick={{ fill: '#475569', fontSize: 12, fontWeight: 'bold' }}
                  tickLine={false}
                  axisLine={{ stroke: '#cbd5e1' }}
                />
                <YAxis
                  yAxisId="left"
                  tick={{ fill: '#64748b', fontSize: 11 }}
                  tickLine={false}
                  axisLine={{ stroke: '#cbd5e1' }}
                  label={{
                    value: lang === 'ar' ? 'متوسط الغياب (يوم/طالب)' : 'Avg Days',
                    angle: -90,
                    position: 'insideLeft',
                    fill: '#94a3b8',
                    fontSize: 10,
                  }}
                />
                <YAxis
                  yAxisId="right"
                  orientation="right"
                  domain={[70, 100]}
                  tick={{ fill: '#64748b', fontSize: 11 }}
                  tickLine={false}
                  axisLine={{ stroke: '#cbd5e1' }}
                  label={{
                    value: lang === 'ar' ? 'نسبة الحضور %' : 'Attendance %',
                    angle: 90,
                    position: 'insideRight',
                    fill: '#94a3b8',
                    fontSize: 10,
                  }}
                />
                <Tooltip cursor={{ fill: 'transparent' }} content={<CustomChartTooltip />} />
                <Legend
                  verticalAlign="top"
                  align="right"
                  iconType="circle"
                  wrapperStyle={{ paddingBottom: 12, fontSize: 11 }}
                  formatter={(value: string) => {
                    if (value === 'avgAbsencesPerStudent')
                      return lang === 'ar' ? 'متوسط أيام الغياب للطالب' : 'Avg Absence Days';
                    if (value === 'averageAttendanceRate')
                      return lang === 'ar' ? 'نسبة الحضور العامة %' : 'Attendance Rate %';
                    return value;
                  }}
                />
                <ReferenceLine
                  yAxisId="right"
                  y={95}
                  stroke="#10b981"
                  strokeDasharray="4 4"
                  strokeWidth={2}
                  label={{
                    value: lang === 'ar' ? 'المستهدف الوزاري 95%' : 'Target 95%',
                    fill: '#059669',
                    fontSize: 10,
                    position: 'top',
                  }}
                />
                <Bar
                  yAxisId="left"
                  dataKey="avgAbsencesPerStudent"
                  name="avgAbsencesPerStudent"
                  fill="#6366f1"
                  radius={[4, 4, 0, 0]}
                />
                <Bar
                  yAxisId="right"
                  dataKey="averageAttendanceRate"
                  name="averageAttendanceRate"
                  fill="#10b981"
                  radius={[4, 4, 0, 0]}
                />
              </BarChart>
            )}
          </ResponsiveContainer>
        </div>
      </div>

      {/* Comparative Grade Matrix Table */}
      <GradeComparisonMatrix
        lang={lang}
        gradeData={gradeData}
        selectedGradeFocus={selectedGradeFocus}
        setSelectedGradeFocus={setSelectedGradeFocus}
        onFilterByGrade={onFilterByGrade}
      />
    </div>
  );
};

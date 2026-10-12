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
  Cell,
} from 'recharts';
import {
  BarChart3,
  TrendingUp,
  AlertTriangle,
  Award,
  Layers,
  Activity,
  FileCheck2,
  Clock,
  Sparkles,
  HelpCircle,
  ArrowUpRight,
  ShieldCheck,
  Filter,
} from 'lucide-react';
import { Student, Justification } from '../types/attendance';

interface GradeAbsencePatternsSectionProps {
  students: Student[];
  justifications: Justification[];
  lang: 'ar' | 'en';
  onFilterByGrade?: (gradeName: string) => void;
}

export type ChartMetricView = 'excuses_breakdown' | 'risk_distribution' | 'averages_and_rates';

interface GradeAnalysisItem {
  gradeName: string;
  shortGrade: string;
  studentCount: number;
  totalAbsenceDays: number;
  avgAbsencesPerStudent: number;
  averageAttendanceRate: number;
  totalLates: number;
  // Justification breakdown
  excusedCount: number;
  unexcusedCount: number;
  pendingCount: number;
  documentationRate: number;
  // Risk tiers
  normalCount: number;
  tier1AlertCount: number; // 3-4 days
  tier2WarningCount: number; // 5-7 days
  tier3CriticalCount: number; // 8+ days
  chronicCount: number; // 5+ days
  chronicRate: number; // %
  // Risk label
  riskLevel: 'low' | 'moderate' | 'high';
  // Top classes
  classesCount: number;
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
  const gradeData: GradeAnalysisItem[] = useMemo(() => {
    const map: Record<string, {
      students: Student[];
      classes: Set<string>;
    }> = {};

    students.forEach((s) => {
      const g = s.grade || (lang === 'ar' ? 'المرحلة غير محددة' : 'Unspecified');
      if (!map[g]) {
        map[g] = { students: [], classes: new Set() };
      }
      map[g].students.push(s);
      if (s.className) map[g].classes.add(s.className);
    });

    const items: GradeAnalysisItem[] = Object.keys(map).map((gradeName) => {
      const gStudents = map[gradeName].students;
      const count = gStudents.length;
      const totalAbsenceDays = gStudents.reduce((sum, s) => sum + s.totalAbsences, 0);
      const totalLates = gStudents.reduce((sum, s) => sum + s.totalLates, 0);
      const avgRate =
        count > 0
          ? parseFloat(
              (gStudents.reduce((sum, s) => sum + s.attendanceRate, 0) / count).toFixed(1)
            )
          : 100;
      const avgAbs = count > 0 ? parseFloat((totalAbsenceDays / count).toFixed(1)) : 0;

      // Risk stratifications
      const normalCount = gStudents.filter((s) => s.totalAbsences < 3).length;
      const tier1AlertCount = gStudents.filter((s) => s.totalAbsences >= 3 && s.totalAbsences < 5).length;
      const tier2WarningCount = gStudents.filter((s) => s.totalAbsences >= 5 && s.totalAbsences < 8).length;
      const tier3CriticalCount = gStudents.filter((s) => s.totalAbsences >= 8).length;
      const chronicCount = tier2WarningCount + tier3CriticalCount;
      const chronicRate = count > 0 ? parseFloat(((chronicCount / count) * 100).toFixed(1)) : 0;

      // Calculate excuses from justifications
      const studentIdSet = new Set(gStudents.map((s) => s.id));
      const gradeJustifications = justifications.filter((j) => studentIdSet.has(j.studentId));
      const approvedExcuses = gradeJustifications.filter((j) => j.status === 'approved').length;
      const pendingExcuses = gradeJustifications.filter((j) => j.status === 'pending').length;

      // Unexcused is total absences minus approved excuses
      const unexcusedCount = Math.max(0, totalAbsenceDays - approvedExcuses);
      const documentationRate =
        totalAbsenceDays > 0
          ? Math.min(100, Math.round(((approvedExcuses + pendingExcuses) / totalAbsenceDays) * 100))
          : 100;

      let riskLevel: 'low' | 'moderate' | 'high' = 'low';
      if (tier3CriticalCount > 0 || chronicRate >= 20 || avgRate < 90) {
        riskLevel = 'high';
      } else if (chronicRate >= 10 || tier2WarningCount > 0 || avgRate < 94) {
        riskLevel = 'moderate';
      }

      // Short label for chart x-axis
      let shortGrade = gradeName
        .replace('الصف ', '')
        .replace('Grade ', '');

      return {
        gradeName,
        shortGrade,
        studentCount: count,
        totalAbsenceDays,
        avgAbsencesPerStudent: avgAbs,
        averageAttendanceRate: avgRate,
        totalLates,
        excusedCount: approvedExcuses,
        unexcusedCount,
        pendingCount: pendingExcuses,
        documentationRate,
        normalCount,
        tier1AlertCount,
        tier2WarningCount,
        tier3CriticalCount,
        chronicCount,
        chronicRate,
        riskLevel,
        classesCount: map[gradeName].classes.size,
      };
    });

    // Natural sort by grade order if known (10, 11, 12, etc.)
    return items.sort((a, b) => {
      const order = ['السابع', 'الثامن', 'التاسع', 'العاشر', 'الحادي عشر', 'الثاني عشر'];
      const idxA = order.findIndex((o) => a.gradeName.includes(o));
      const idxB = order.findIndex((o) => b.gradeName.includes(o));
      if (idxA !== -1 && idxB !== -1) return idxA - idxB;
      return a.gradeName.localeCompare(b.gradeName);
    });
  }, [students, justifications, lang]);

  // Overall statistics for high-level insight cards
  const bestGrade = useMemo(() => {
    if (gradeData.length === 0) return null;
    return [...gradeData].sort((a, b) => b.averageAttendanceRate - a.averageAttendanceRate)[0];
  }, [gradeData]);

  const mostVulnerableGrade = useMemo(() => {
    if (gradeData.length === 0) return null;
    return [...gradeData].sort((a, b) => b.chronicRate - a.chronicRate)[0];
  }, [gradeData]);

  const attendanceGap = useMemo(() => {
    if (gradeData.length < 2) return 0;
    const rates = gradeData.map((g) => g.averageAttendanceRate);
    const max = Math.max(...rates);
    const min = Math.min(...rates);
    return parseFloat((max - min).toFixed(1));
  }, [gradeData]);

  const overallDocRate = useMemo(() => {
    const totalAbs = gradeData.reduce((sum, g) => sum + g.totalAbsenceDays, 0);
    const totalExcused = gradeData.reduce((sum, g) => sum + g.excusedCount + g.pendingCount, 0);
    if (totalAbs === 0) return 100;
    return Math.min(100, Math.round((totalExcused / totalAbs) * 100));
  }, [gradeData]);

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
    <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-6">
      {/* Header & Sub-header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-100 pb-5">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="bg-indigo-50 text-indigo-700 text-[11px] font-bold px-2.5 py-0.5 rounded-full border border-indigo-200 flex items-center gap-1">
              <BarChart3 className="w-3 h-3" />
              <span>{lang === 'ar' ? 'تحليل مقارن للمراحل' : 'Comparative Grade Analysis'}</span>
            </span>
            <span className="text-slate-400 text-xs">· رصد التفاوت السلوكي والغياب التراكمي</span>
          </div>
          <h3 className="text-lg font-bold text-slate-900">
            {lang === 'ar'
              ? 'أنماط ومؤشرات الغياب عبر المراحل الدراسية'
              : 'Absence Patterns Across Grade Levels'}
          </h3>
          <p className="text-xs text-slate-500 max-w-2xl leading-relaxed">
            {lang === 'ar'
              ? 'مقارنة بيانية وتحليل إحصائي لمعدلات الغياب، التبرير الطبي، وحالات الخطر المزمن بين مختلف الصفوف الدراسية لتوجيه برامج الإرشاد الطلابي والتدخل المبكر.'
              : 'Visual comparative analysis of absence days, medical justification patterns, and chronic absenteeism across grades to guide early interventions.'}
          </p>
        </div>

        {/* View Segmented Toggle Controls */}
        <div className="flex items-center p-1 bg-slate-100 rounded-xl border border-slate-200/80 shrink-0 self-start md:self-center">
          <button
            type="button"
            onClick={() => setMetricView('excuses_breakdown')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
              metricView === 'excuses_breakdown'
                ? 'bg-white text-slate-900 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
            title="مقارنة الأعذار المعتمدة رسمياً مقابل الغياب بدون عذر"
          >
            <FileCheck2 className="w-3.5 h-3.5 text-emerald-600" />
            <span>{lang === 'ar' ? 'أنواع الغياب (مبرر / غير مبرر)' : 'Absence Types'}</span>
          </button>

          <button
            type="button"
            onClick={() => setMetricView('risk_distribution')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
              metricView === 'risk_distribution'
                ? 'bg-white text-slate-900 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
            title="توزيع الطلاب حسب مستويات الخطورة والإنذارات"
          >
            <AlertTriangle className="w-3.5 h-3.5 text-rose-500" />
            <span>{lang === 'ar' ? 'الغياب المزمن والإنذارات' : 'Chronic Risk'}</span>
          </button>

          <button
            type="button"
            onClick={() => setMetricView('averages_and_rates')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
              metricView === 'averages_and_rates'
                ? 'bg-white text-slate-900 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
            title="مقارنة متوسط أيام الغياب ونسبة الحضور العامة"
          >
            <TrendingUp className="w-3.5 h-3.5 text-indigo-600" />
            <span>{lang === 'ar' ? 'المعدلات ونسب الحضور' : 'Rates & Averages'}</span>
          </button>
        </div>
      </div>

      {/* Analytical Callout Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
        {/* Most Disciplined Grade */}
        <div className="bg-emerald-500/10 border border-emerald-500/30 rounded-xl p-3.5 flex items-start gap-3 transition-colors">
          <div className="w-9 h-9 rounded-lg bg-emerald-500 text-white flex items-center justify-center shrink-0 shadow-xs">
            <Award className="w-5 h-5" />
          </div>
          <div className="space-y-0.5">
            <span className="text-[11px] font-bold text-emerald-600 dark:text-emerald-400">
              {lang === 'ar' ? 'المرحلة الأكثر انضباطاً' : 'Most Disciplined Grade'}
            </span>
            <div className="text-sm font-extrabold text-slate-900 dark:text-white">
              {bestGrade ? bestGrade.gradeName : '—'}
            </div>
            <div className="text-[11px] text-emerald-600 dark:text-emerald-400 font-semibold">
              {bestGrade ? `${bestGrade.averageAttendanceRate}% حضور عام` : ''}
            </div>
          </div>
        </div>

        {/* Most Vulnerable / Chronic Risk Grade */}
        <div className="bg-rose-500/10 border border-rose-500/30 rounded-xl p-3.5 flex items-start gap-3 transition-colors">
          <div className="w-9 h-9 rounded-lg bg-rose-500 text-white flex items-center justify-center shrink-0 shadow-xs">
            <AlertTriangle className="w-5 h-5" />
          </div>
          <div className="space-y-0.5">
            <span className="text-[11px] font-bold text-rose-600 dark:text-rose-400">
              {lang === 'ar' ? 'الأعلى في مؤشر الخطر' : 'Highest Vulnerability'}
            </span>
            <div className="text-sm font-extrabold text-slate-900 dark:text-white">
              {mostVulnerableGrade ? mostVulnerableGrade.gradeName : '—'}
            </div>
            <div className="text-[11px] text-rose-600 dark:text-rose-400 font-semibold">
              {mostVulnerableGrade
                ? `${mostVulnerableGrade.chronicCount} طلاب (${mostVulnerableGrade.chronicRate}% خطورة)`
                : ''}
            </div>
          </div>
        </div>

        {/* Excuses Documentation Rate */}
        <div className="bg-blue-500/10 border border-blue-500/30 rounded-xl p-3.5 flex items-start gap-3 transition-colors">
          <div className="w-9 h-9 rounded-lg bg-blue-600 text-white flex items-center justify-center shrink-0 shadow-xs">
            <ShieldCheck className="w-5 h-5" />
          </div>
          <div className="space-y-0.5">
            <span className="text-[11px] font-bold text-blue-600 dark:text-blue-400">
              {lang === 'ar' ? 'نسبة توثيق الأعذار' : 'Excuse Doc. Compliance'}
            </span>
            <div className="text-sm font-extrabold text-slate-900 dark:text-white">
              {overallDocRate}% {lang === 'ar' ? 'أعذار موثقة' : 'Documented'}
            </div>
            <div className="text-[11px] text-blue-600 dark:text-blue-400 font-semibold">
              {lang === 'ar' ? 'تحت التدقيق الإداري' : 'Under admin review'}
            </div>
          </div>
        </div>

        {/* Performance Disparity Gap */}
        <div className="bg-indigo-500/10 border border-indigo-500/30 rounded-xl p-3.5 flex items-start gap-3 transition-colors">
          <div className="w-9 h-9 rounded-lg bg-indigo-600 text-white flex items-center justify-center shrink-0 shadow-xs">
            <Activity className="w-5 h-5" />
          </div>
          <div className="space-y-0.5">
            <span className="text-[11px] font-bold text-indigo-600 dark:text-indigo-400">
              {lang === 'ar' ? 'فجوة التباين بين المراحل' : 'Grade Disparity Spread'}
            </span>
            <div className="text-sm font-extrabold text-slate-900 dark:text-white">
              {attendanceGap}% {lang === 'ar' ? 'فارق الانضباط' : 'Gap Spread'}
            </div>
            <div className="text-[11px] text-indigo-600 dark:text-indigo-400 font-semibold">
              {attendanceGap <= 5
                ? (lang === 'ar' ? 'تقارب إيجابي متوازن' : 'Balanced consistency')
                : (lang === 'ar' ? 'تفاوت ملحوظ يستدعي تدخلاً' : 'Notable variance')}
            </div>
          </div>
        </div>
      </div>

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
            <span className="inline-block w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
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
                <Tooltip content={<CustomChartTooltip />} />
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
                <Tooltip content={<CustomChartTooltip />} />
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
                <Tooltip content={<CustomChartTooltip />} />
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
      <div className="space-y-3">
        <div className="flex items-center justify-between text-xs">
          <h4 className="font-bold text-slate-800 flex items-center gap-2">
            <Layers className="w-4 h-4 text-slate-500" />
            <span>{lang === 'ar' ? 'مصفوفة التحليل الإحصائي التفصيلي حسب المرحلة' : 'Detailed Grade Breakdown Matrix'}</span>
          </h4>
          <span className="text-slate-400">
            {gradeData.length} {lang === 'ar' ? 'مراحل دراسية مقيدة' : 'grade levels monitored'}
          </span>
        </div>

        <div className="overflow-x-auto rounded-xl border border-slate-200">
          <table className="w-full text-right text-xs">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-bold">
              <tr>
                <th className="py-3 px-4">{lang === 'ar' ? 'المرحلة الدراسية' : 'Grade Level'}</th>
                <th className="py-3 px-3 text-center">{lang === 'ar' ? 'الطلاب' : 'Students'}</th>
                <th className="py-3 px-3 text-center">{lang === 'ar' ? 'إجمالي الغياب' : 'Total Days'}</th>
                <th className="py-3 px-3 text-center">{lang === 'ar' ? 'متوسط الغياب/طالب' : 'Avg / Student'}</th>
                <th className="py-3 px-4">{lang === 'ar' ? 'نمط التبرير (مبرر / غير مبرر)' : 'Justification Breakdown'}</th>
                <th className="py-3 px-3 text-center">{lang === 'ar' ? 'حالات الخطر المزمن' : 'Chronic Cases'}</th>
                <th className="py-3 px-4">{lang === 'ar' ? 'نسبة الحضور العامة' : 'Attendance Rate'}</th>
                <th className="py-3 px-3 text-center">{lang === 'ar' ? 'الحالة الإجرائية' : 'Action Status'}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-800">
              {gradeData.map((item) => {
                const isSelected = selectedGradeFocus === item.gradeName;
                const justifiedPercent =
                  item.totalAbsenceDays > 0
                    ? Math.round((item.excusedCount / item.totalAbsenceDays) * 100)
                    : 100;

                return (
                  <tr
                    key={item.gradeName}
                    onClick={() => {
                      setSelectedGradeFocus(isSelected ? null : item.gradeName);
                      if (onFilterByGrade) onFilterByGrade(item.gradeName);
                    }}
                    className={`transition-colors cursor-pointer hover:bg-slate-50/80 ${
                      isSelected ? 'bg-indigo-50/60 font-semibold' : ''
                    }`}
                  >
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-slate-900">{item.gradeName}</span>
                        <span className="text-[10px] text-slate-400 bg-slate-100 px-1.5 py-0.5 rounded">
                          {item.classesCount} {lang === 'ar' ? 'فصول' : 'classes'}
                        </span>
                      </div>
                    </td>

                    <td className="py-3 px-3 text-center font-mono font-bold text-slate-700">
                      {item.studentCount}
                    </td>

                    <td className="py-3 px-3 text-center font-mono font-bold text-slate-900">
                      {item.totalAbsenceDays} {lang === 'ar' ? 'يوم' : 'd'}
                    </td>

                    <td className="py-3 px-3 text-center font-mono font-bold">
                      <span
                        className={`inline-block px-2 py-0.5 rounded text-[11px] ${
                          item.avgAbsencesPerStudent <= 2
                            ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                            : item.avgAbsencesPerStudent <= 4
                            ? 'bg-amber-50 text-amber-800 border border-amber-200'
                            : 'bg-rose-50 text-rose-800 border border-rose-200 font-extrabold'
                        }`}
                      >
                        {item.avgAbsencesPerStudent} {lang === 'ar' ? 'يوم' : 'd'}
                      </span>
                    </td>

                    <td className="py-3 px-4 min-w-[170px]">
                      <div className="space-y-1">
                        <div className="flex items-center justify-between text-[11px]">
                          <span className="text-emerald-700 font-semibold">
                            {item.excusedCount} {lang === 'ar' ? 'مبرر' : 'excused'}
                          </span>
                          <span className="text-rose-700 font-semibold">
                            {item.unexcusedCount} {lang === 'ar' ? 'غير مبرر' : 'unexcused'}
                          </span>
                        </div>
                        {/* Split progress bar */}
                        <div className="w-full bg-rose-100 rounded-full h-2 overflow-hidden flex">
                          <div
                            className="bg-emerald-500 h-full transition-all"
                            style={{ width: `${justifiedPercent}%` }}
                            title={`مبرر: ${justifiedPercent}%`}
                          />
                          <div
                            className="bg-rose-500 h-full transition-all"
                            style={{ width: `${100 - justifiedPercent}%` }}
                            title={`غير مبرر: ${100 - justifiedPercent}%`}
                          />
                        </div>
                      </div>
                    </td>

                    <td className="py-3 px-3 text-center">
                      <div className="flex flex-col items-center justify-center">
                        <span
                          className={`font-mono font-bold text-xs ${
                            item.chronicCount > 0 ? 'text-rose-700' : 'text-slate-400'
                          }`}
                        >
                          {item.chronicCount} {lang === 'ar' ? 'طالب' : 'students'}
                        </span>
                        {item.tier3CriticalCount > 0 && (
                          <span className="text-[10px] text-rose-600 font-bold">
                            ({item.tier3CriticalCount} {lang === 'ar' ? 'حرج 8+' : 'critical'})
                          </span>
                        )}
                      </div>
                    </td>

                    <td className="py-3 px-4 min-w-[140px]">
                      <div className="space-y-1">
                        <div className="flex items-center justify-between text-[11px] font-mono font-bold">
                          <span
                            className={
                              item.averageAttendanceRate >= 95
                                ? 'text-emerald-700'
                                : item.averageAttendanceRate >= 90
                                ? 'text-amber-700'
                                : 'text-rose-700'
                            }
                          >
                            {item.averageAttendanceRate}%
                          </span>
                          <span className="text-[10px] text-slate-400 font-normal">
                            {item.averageAttendanceRate >= 95
                              ? (lang === 'ar' ? 'منضبط ممتاز' : 'Target met')
                              : (lang === 'ar' ? 'أقل من المستهدف' : 'Below target')}
                          </span>
                        </div>
                        <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
                          <div
                            className={`h-full rounded-full transition-all ${
                              item.averageAttendanceRate >= 95
                                ? 'bg-emerald-500'
                                : item.averageAttendanceRate >= 90
                                ? 'bg-amber-500'
                                : 'bg-rose-500'
                            }`}
                            style={{ width: `${Math.min(100, Math.max(10, item.averageAttendanceRate))}%` }}
                          />
                        </div>
                      </div>
                    </td>

                    <td className="py-3 px-3 text-center">
                      <span
                        className={`inline-block px-2.5 py-1 rounded-full text-[10px] font-bold ${
                          item.riskLevel === 'low'
                            ? 'bg-emerald-100 text-emerald-800'
                            : item.riskLevel === 'moderate'
                            ? 'bg-amber-100 text-amber-800'
                            : 'bg-rose-100 text-rose-800 animate-pulse'
                        }`}
                      >
                        {item.riskLevel === 'low'
                          ? (lang === 'ar' ? 'مستقر / متابعة اعتيادية' : 'Stable')
                          : item.riskLevel === 'moderate'
                          ? (lang === 'ar' ? 'توجيه خطة وقائية' : 'Preventive')
                          : (lang === 'ar' ? 'تدخل وإشعار عاجل' : 'Urgent Intervention')}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Analytical Guidance Note */}
        <div className="p-3 bg-slate-50 rounded-xl border border-slate-200/80 text-[11px] text-slate-600 flex items-start gap-2.5">
          <Sparkles className="w-4 h-4 text-indigo-600 shrink-0 mt-0.5" />
          <div className="leading-relaxed">
            <span className="font-bold text-slate-900">
              {lang === 'ar' ? 'توصية استرشادية لمدير المدرسة والمرشد الطلابي: ' : 'Administrative Guidance: '}
            </span>
            {lang === 'ar'
              ? 'تُظهر المقارنة أن الصفوف ذات النسبة المرتفعة من الغياب غير المبرر تحتاج إلى تفعيل التحفيز الصباحي والتواصل المباشر مع أولياء الأمور قبل اكتمال نصاب الإنذار الثاني (5 أيام). يمكن الضغط على أي مرحلة في الجدول أعلاه لتركيز العرض.'
              : 'Grades with elevated unexcused absence ratios should trigger immediate counselor check-ins and SMS alerts before crossing the 5-day warning threshold.'}
          </div>
        </div>
      </div>
    </div>
  );
};

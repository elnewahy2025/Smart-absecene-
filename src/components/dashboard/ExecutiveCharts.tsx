import React from 'react';
import { ActiveTab } from '../HeaderNav';
import { Calendar, CheckCircle2, Layers, PieChart as PieChartIcon } from 'lucide-react';
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { useExecutiveDashboardAnalytics } from '../../hooks/useExecutiveDashboardAnalytics';

type ExecutiveAnalytics = ReturnType<typeof useExecutiveDashboardAnalytics>;

interface ExecutiveChartsProps {
  isAr: boolean;
  onNavigateTab: (tab: ActiveTab) => void;
  absenceDecompositionData: ExecutiveAnalytics['absenceDecompositionData'];
  gradeComparisonData: ExecutiveAnalytics['gradeComparisonData'];
  weekdayAbsenceData: ExecutiveAnalytics['weekdayAbsenceData'];
}

// ANALYTICAL CHARTS SUITE (FROM analize.docx):
// Chart 1: Absence Decomposition (Donut)
// Chart 2: Grade Absence Comparison (Bar Chart)
// Chart 3: Day-of-Week Absence Pattern (Bar Chart)
export const ExecutiveCharts: React.FC<ExecutiveChartsProps> = ({
  isAr,
  onNavigateTab,
  absenceDecompositionData,
  gradeComparisonData,
  weekdayAbsenceData,
}) => (
  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
    {/* Chart 1: Donut Chart - Absence Decomposition */}
    <div
      className="app-card rounded-2xl border p-5 shadow-2xs flex flex-col justify-between"
      style={{ backgroundColor: 'var(--app-card-bg)', borderColor: 'var(--app-card-border)' }}
    >
      <div>
        <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3 mb-3">
          <div className="flex items-center gap-2">
            <PieChartIcon className="w-4 h-4 text-rose-500" />
            <h3 className="text-sm font-bold" style={{ color: 'var(--app-text-main)' }}>
              {isAr ? 'تفكيك أسباب وأعذار الغياب' : 'Absence Reason Decomposition'}
            </h3>
          </div>
        </div>

        {absenceDecompositionData.length === 0 ? (
          <div className="h-48 w-full flex flex-col items-center justify-center text-center p-4">
            <CheckCircle2 className="w-8 h-8 text-emerald-500 mb-2" />
            <span className="text-xs font-bold text-slate-700 dark:text-slate-300">
              {isAr ? 'لا توجد حالات غياب مسجلة' : 'No absences recorded'}
            </span>
            <span className="text-[11px] text-slate-400 mt-1">
              {isAr ? 'جميع الطلاب في حالة انتظام وانضباط تام' : 'All students currently present'}
            </span>
          </div>
        ) : (
          <>
            <div className="h-48 w-full flex items-center justify-center relative">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={absenceDecompositionData}
                    dataKey="value"
                    nameKey="name"
                    cx="50%"
                    cy="50%"
                    innerRadius={48}
                    outerRadius={72}
                    paddingAngle={3}
                  >
                    {absenceDecompositionData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip
                    cursor={{ fill: 'transparent' }}
                    contentStyle={{
                      backgroundColor: 'var(--app-card-bg)',
                      borderColor: 'var(--app-card-border)',
                      borderRadius: '12px',
                      fontSize: '12px',
                      color: 'var(--app-text-main)',
                      boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
                    }}
                    formatter={(val: number) => [`${val} ${isAr ? 'حالة' : 'cases'}`, '']}
                  />
                </PieChart>
              </ResponsiveContainer>
              <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                <span className="text-[10px] text-slate-400">{isAr ? 'الإجمالي' : 'Total'}</span>
                <span className="text-sm font-black" style={{ color: 'var(--app-text-main)' }}>
                  {absenceDecompositionData.reduce((acc, curr) => acc + curr.value, 0)}
                </span>
              </div>
            </div>

            {/* Custom Legend */}
            <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
              {absenceDecompositionData.map((item, idx) => (
                <div key={idx} className="flex items-center gap-1.5 text-[11px]">
                  <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: item.color }} />
                  <span className="text-slate-600 dark:text-slate-400 truncate">{item.name}</span>
                  <span className="font-bold text-slate-900 dark:text-slate-100 font-mono ms-auto">
                    {item.value}
                  </span>
                </div>
              ))}
            </div>
          </>
        )}
      </div>

      <div className="pt-3 mt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs">
        <span className="text-slate-400">{isAr ? 'تحليل سياسة الأعذار' : 'Policy Compliance'}</span>
        <button
          onClick={() => onNavigateTab('justifications')}
          className="text-primary font-bold hover:underline cursor-pointer flex items-center gap-0.5"
        >
          {isAr ? 'مراجعة الأعذار ←' : 'Review →'}
        </button>
      </div>
    </div>

    {/* Chart 2: Bar Chart - Grade Absence Comparison */}
    <div
      className="app-card rounded-2xl border p-5 shadow-2xs flex flex-col justify-between"
      style={{ backgroundColor: 'var(--app-card-bg)', borderColor: 'var(--app-card-border)' }}
    >
      <div>
        <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3 mb-3">
          <div className="flex items-center gap-2">
            <Layers className="w-4 h-4 text-primary" />
            <h3 className="text-sm font-bold" style={{ color: 'var(--app-text-main)' }}>
              {isAr ? 'مقارنة الغياب بين الصفوف' : 'Absence by Grade Level'}
            </h3>
          </div>
        </div>

        <div className="h-48 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={gradeComparisonData} margin={{ top: 10, right: 10, left: -20, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} opacity={0.15} />
              <XAxis
                dataKey="gradeName"
                tick={{ fontSize: 11, fill: 'var(--app-text-muted)' }}
                axisLine={false}
                tickLine={false}
              />
              <YAxis
                tick={{ fontSize: 10, fill: 'var(--app-text-muted)' }}
                axisLine={false}
                tickLine={false}
                unit="%"
                domain={[0, 'dataMax + 5']}
              />
              <Tooltip
                cursor={{ fill: 'transparent' }}
                contentStyle={{
                  backgroundColor: 'var(--app-card-bg)',
                  borderColor: 'var(--app-card-border)',
                  borderRadius: '12px',
                  fontSize: '12px',
                  color: 'var(--app-text-main)',
                  boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
                }}
                formatter={(val: number) => [`${val}%`, isAr ? 'معدل الغياب' : 'Absence Rate']}
              />
              <Bar dataKey="absenceRate" radius={[6, 6, 0, 0]}>
                {gradeComparisonData.map((entry, index) => (
                  <Cell
                    key={`grade-cell-${index}`}
                    fill={entry.absenceRate >= 10 ? '#f43f5e' : entry.absenceRate >= 7 ? '#f59e0b' : 'var(--app-primary)'}
                  />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="flex items-center justify-around pt-2 border-t border-slate-100 dark:border-slate-800 text-[11px] text-slate-500">
          <span className="flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-primary" />
            {isAr ? 'طبيعي (< 7%)' : 'Normal'}
          </span>
          <span className="flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-amber-500" />
            {isAr ? 'متوسط (7-10%)' : 'Moderate'}
          </span>
          <span className="flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-rose-500" />
            {isAr ? 'مرتفع (> 10%)' : 'High'}
          </span>
        </div>
      </div>

      <div className="pt-3 mt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs">
        <span className="text-slate-400">{isAr ? 'تقييم المراحل' : 'Cohorts'}</span>
        <button
          onClick={() => onNavigateTab('reports')}
          className="text-primary font-bold hover:underline cursor-pointer flex items-center gap-0.5"
        >
          {isAr ? 'التقرير المفصل ←' : 'Full Report →'}
        </button>
      </div>
    </div>

    {/* Chart 3: Bar Chart - Day-of-Week Absence Pattern */}
    <div
      className="app-card rounded-2xl border p-5 shadow-2xs flex flex-col justify-between"
      style={{ backgroundColor: 'var(--app-card-bg)', borderColor: 'var(--app-card-border)' }}
    >
      <div>
        <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3 mb-3">
          <div className="flex items-center gap-2">
            <Calendar className="w-4 h-4 text-amber-500" />
            <h3 className="text-sm font-bold" style={{ color: 'var(--app-text-main)' }}>
              {isAr ? 'نمط الغياب حسب أيام الأسبوع' : 'Absence Pattern by Weekday'}
            </h3>
          </div>
        </div>

        <div className="h-48 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={weekdayAbsenceData} margin={{ top: 10, right: 10, left: -20, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} opacity={0.15} />
              <XAxis
                dataKey="day"
                tick={{ fontSize: 11, fill: 'var(--app-text-muted)' }}
                axisLine={false}
                tickLine={false}
              />
              <YAxis
                tick={{ fontSize: 10, fill: 'var(--app-text-muted)' }}
                axisLine={false}
                tickLine={false}
                unit="%"
                domain={[0, 'dataMax + 4']}
              />
              <Tooltip
                cursor={{ fill: 'transparent' }}
                contentStyle={{
                  backgroundColor: 'var(--app-card-bg)',
                  borderColor: 'var(--app-card-border)',
                  borderRadius: '12px',
                  fontSize: '12px',
                  color: 'var(--app-text-main)',
                  boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
                }}
                formatter={(val: number) => [`${val}%`, isAr ? 'نسبة الغياب' : 'Absence Rate']}
              />
              <Bar dataKey="absenceRate" radius={[6, 6, 0, 0]}>
                {weekdayAbsenceData.map((entry, index) => (
                  <Cell
                    key={`weekday-cell-${index}`}
                    fill={entry.isWeekendBorder ? '#f59e0b' : 'var(--app-primary)'}
                  />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="flex items-center justify-between pt-2 border-t border-slate-100 dark:border-slate-800 text-[11px] text-slate-500">
          <span className="flex items-center gap-1">
            <span className="w-2.5 h-2.5 rounded-full bg-amber-500" />
            {isAr ? 'الأحد والخميس (أطراف الإجازة)' : 'Sun & Thu (Weekend flanks)'}
          </span>
          <span className="flex items-center gap-1">
            <span className="w-2.5 h-2.5 rounded-full bg-primary" />
            {isAr ? 'منتصف الأسبوع' : 'Mid-week'}
          </span>
        </div>
      </div>

      <div className="pt-3 mt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs">
        <span className="text-slate-400">{isAr ? 'مستهدف الانضباط' : 'Discipline'}</span>
        <span className="text-primary font-bold text-[11px]">
          {isAr ? 'تأكيد الحضور الصباحي' : 'Morning Check'}
        </span>
      </div>
    </div>
  </div>
);

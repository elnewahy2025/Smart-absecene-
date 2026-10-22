import React from 'react';
import { Layers, Sparkles } from 'lucide-react';
import type { GradeAnalysisItem } from '../../utils/gradeAbsencePatterns';

interface GradeComparisonMatrixProps {
  lang: 'ar' | 'en';
  gradeData: GradeAnalysisItem[];
  selectedGradeFocus: string | null;
  setSelectedGradeFocus: React.Dispatch<React.SetStateAction<string | null>>;
  onFilterByGrade?: (gradeName: string) => void;
}

// Comparative grade matrix table with the administrative guidance note.
export const GradeComparisonMatrix: React.FC<GradeComparisonMatrixProps> = ({
  lang,
  gradeData,
  selectedGradeFocus,
  setSelectedGradeFocus,
  onFilterByGrade,
}) => (
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
);

import React from 'react';
import { Activity, AlertTriangle, Award, ShieldCheck } from 'lucide-react';
import type { GradeAnalysisItem } from '../../utils/gradeAbsencePatterns';

interface GradeAbsenceSummaryCardsProps {
  lang: 'ar' | 'en';
  bestGrade: GradeAnalysisItem | null;
  mostVulnerableGrade: GradeAnalysisItem | null;
  attendanceGap: number;
  overallDocRate: number;
}

export const GradeAbsenceSummaryCards: React.FC<GradeAbsenceSummaryCardsProps> = ({
  lang,
  bestGrade,
  mostVulnerableGrade,
  attendanceGap,
  overallDocRate,
}) => (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
        {/* Most Disciplined Grade */}
        <div className="bg-primary/10 border border-primary/30 rounded-xl p-3.5 flex items-start gap-3 transition-colors">
          <div className="w-9 h-9 rounded-lg bg-primary text-white flex items-center justify-center shrink-0 shadow-xs">
            <Award className="w-5 h-5" />
          </div>
          <div className="space-y-0.5">
            <span className="text-[11px] font-bold text-primary">
              {lang === 'ar' ? 'المرحلة الأكثر انضباطاً' : 'Most Disciplined Grade'}
            </span>
            <div className="text-sm font-extrabold text-slate-900 dark:text-white">
              {bestGrade ? bestGrade.gradeName : '—'}
            </div>
            <div className="text-[11px] text-primary font-semibold">
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
);

import React from 'react';
import { ArrowRight, Phone, Users } from 'lucide-react';
import type { DailyEmailDigestItem } from '../../types/attendance';

interface DigestHighRiskSectionProps {
  currentDigest: DailyEmailDigestItem;
  lang: string;
  onNavigateToTab?: (tab: string) => void;
}

export const DigestHighRiskSection: React.FC<DigestHighRiskSectionProps> = ({ currentDigest, lang, onNavigateToTab }) => {
  return (
    <div className="bg-[var(--app-card-bg,#ffffff)] rounded-2xl border border-[var(--app-border,#e2e8f0)] p-6 shadow-xs space-y-4 text-slate-800 dark:text-slate-100">
      <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-amber-100 dark:bg-amber-950/50 text-amber-700 dark:text-amber-400 flex items-center justify-center font-bold">
            <Users className="w-4 h-4" />
          </div>
          <div>
            <h2 className="text-sm font-bold text-slate-900 dark:text-slate-100">
              {lang === 'ar'
                ? `ثالثاً: الطلاب الأكثر عرضة لخطر الحرمان والإنذارات (${currentDigest.highRiskStudentsCount})`
                : `3. High-Risk Students Approaching Denial Threshold (${currentDigest.highRiskStudentsCount})`}
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              {lang === 'ar'
                ? 'قائمة الحالات الحرجة الموجهة للموجه الطلابي للتدخل الإرشادي الفوري صباح اليوم'
                : 'Targeted students for immediate morning counseling and guardian follow-up.'}
            </p>
          </div>
        </div>

        {onNavigateToTab && (
          <button
            onClick={() => onNavigateToTab('reports')}
            className="text-xs font-bold text-emerald-600 hover:text-emerald-800 dark:text-emerald-400 dark:hover:text-emerald-300 flex items-center gap-1 cursor-pointer"
          >
            <span>{lang === 'ar' ? 'تقرير الحرمان المفصل' : 'Full Chronic Report'}</span>
            <ArrowRight className="w-3 h-3 rotate-180" />
          </button>
        )}
      </div>

      {currentDigest.highRiskStudents.length > 0 ? (
        <div className="overflow-x-auto border border-slate-200 dark:border-slate-800 rounded-xl">
          <table className="w-full text-right text-xs">
            <thead className="bg-slate-50 dark:bg-slate-800/90 text-slate-700 dark:text-slate-200 font-semibold border-b border-slate-200 dark:border-slate-700">
              <tr>
                <th className="py-2.5 px-3">اسم الطالب</th>
                <th className="py-2.5 px-3">الصف</th>
                <th className="py-2.5 px-3">أيام الغياب</th>
                <th className="py-2.5 px-3">نسبة الحضور</th>
                <th className="py-2.5 px-3">مستوى الخطر والإنذار</th>
                <th className="py-2.5 px-3">ولي الأمر والتواصل</th>
                <th className="py-2.5 px-3">الإجراء الفوري</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {currentDigest.highRiskStudents.map((s) => (
                <tr
                  key={s.id}
                  className={
                    s.riskTier === 'tier_8_plus'
                      ? 'bg-red-50/40 dark:bg-red-950/20 hover:bg-red-50/70 dark:hover:bg-red-950/40 transition-colors'
                      : 'hover:bg-slate-50/70 dark:hover:bg-slate-800/50 transition-colors'
                  }
                >
                  <td className="py-2.5 px-3 font-bold text-slate-900 dark:text-slate-100">{s.name}</td>
                  <td className="py-2.5 px-3 text-slate-600 dark:text-slate-400">{s.className}</td>
                  <td className="py-2.5 px-3 font-extrabold text-xs">
                    <span
                      className={
                        s.totalAbsences >= 8
                          ? 'text-red-700 dark:text-red-400'
                          : s.totalAbsences >= 5
                          ? 'text-amber-700 dark:text-amber-400'
                          : 'text-slate-800 dark:text-slate-200'
                      }
                    >
                      {s.totalAbsences} يوم
                    </span>
                  </td>
                  <td className="py-2.5 px-3 font-bold text-emerald-700 dark:text-emerald-400">{s.attendanceRate}%</td>
                  <td className="py-2.5 px-3">
                    {s.riskTier === 'tier_8_plus' ? (
                      <span className="bg-red-600 text-white font-bold text-[10px] px-2 py-0.5 rounded-full">
                        إنذار نهائي 3 (حرمان)
                      </span>
                    ) : s.riskTier === 'tier_5_plus' ? (
                      <span className="bg-amber-500 text-slate-950 font-bold text-[10px] px-2 py-0.5 rounded-full">
                        إنذار ثان (5-7 أيام)
                      </span>
                    ) : (
                      <span className="bg-blue-100 dark:bg-blue-950/60 text-blue-800 dark:text-blue-300 font-bold text-[10px] px-2 py-0.5 rounded-full">
                        تنبيه أولي
                      </span>
                    )}
                  </td>
                  <td className="py-2.5 px-3 text-slate-700 dark:text-slate-300">
                    <div className="font-semibold">{s.guardianName}</div>
                    <div className="flex items-center gap-1.5 mt-0.5">
                      <a
                        href={`tel:${s.guardianPhone}`}
                        className="text-[11px] font-mono text-sky-700 dark:text-sky-400 hover:underline flex items-center gap-1"
                      >
                        <Phone className="w-3 h-3" />
                        <span dir="ltr">{s.guardianPhone}</span>
                      </a>
                    </div>
                  </td>
                  <td className="py-2.5 px-3 text-slate-800 dark:text-slate-200">{s.actionRequiredAr}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="p-8 text-center bg-slate-50 dark:bg-slate-900/50 rounded-xl text-slate-500 dark:text-slate-400 text-xs">
          {lang === 'ar'
            ? '✅ لا يوجد طلاب في الشريحة الحرجة حالياً.'
            : 'No students currently in the chronic risk threshold.'}
        </div>
      )}
    </div>
  );
};

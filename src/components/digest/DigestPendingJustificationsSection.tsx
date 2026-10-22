import React from 'react';
import { ArrowRight, Check, FileCheck2, ShieldAlert } from 'lucide-react';
import type { DailyEmailDigestItem } from '../../types/attendance';

interface DigestPendingJustificationsSectionProps {
  currentDigest: DailyEmailDigestItem;
  lang: string;
  onNavigateToTab?: (tab: string) => void;
}

export const DigestPendingJustificationsSection: React.FC<DigestPendingJustificationsSectionProps> = ({ currentDigest, lang, onNavigateToTab }) => {
  return (
    <div className="bg-[var(--app-card-bg,#ffffff)] rounded-2xl border border-[var(--app-border,#e2e8f0)] p-6 shadow-xs space-y-4 text-slate-800 dark:text-slate-100">
      <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-sky-100 dark:bg-sky-950/50 text-sky-700 dark:text-sky-400 flex items-center justify-center font-bold">
            <FileCheck2 className="w-4 h-4" />
          </div>
          <div>
            <h2 className="text-sm font-bold text-slate-900 dark:text-slate-100">
              {lang === 'ar'
                ? `ثانياً: طلبات الأعذار الطبية المعلقة بانتظار الاعتماد (${currentDigest.pendingJustificationsCount})`
                : `2. Pending Medical Excuses Awaiting Review (${currentDigest.pendingJustificationsCount})`}
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              {lang === 'ar'
                ? 'مفحوصة بواسطة أداة التحقق الجنائي للذكاء الاصطناعي لرصد التناقضات والأختام'
                : 'Pre-verified by Gemini AI for document tampering, signature, and name mismatch.'}
            </p>
          </div>
        </div>

        {onNavigateToTab && (
          <button
            onClick={() => onNavigateToTab('justifications')}
            className="text-xs font-bold text-sky-600 hover:text-sky-800 dark:text-sky-400 dark:hover:text-sky-300 flex items-center gap-1 cursor-pointer"
          >
            <span>{lang === 'ar' ? 'الانتقال للتدقيق' : 'Go to Reviews'}</span>
            <ArrowRight className="w-3 h-3 rotate-180" />
          </button>
        )}
      </div>

      {currentDigest.pendingJustifications.length > 0 ? (
        <div className="overflow-x-auto border border-slate-200 dark:border-slate-800 rounded-xl">
          <table className="w-full text-right text-xs">
            <thead className="bg-slate-50 dark:bg-slate-800/90 text-slate-700 dark:text-slate-200 font-semibold border-b border-slate-200 dark:border-slate-700">
              <tr>
                <th className="py-2.5 px-3">الطالب</th>
                <th className="py-2.5 px-3">الصف</th>
                <th className="py-2.5 px-3">تاريخ الغياب</th>
                <th className="py-2.5 px-3">النوع</th>
                <th className="py-2.5 px-3">فحص الذكاء الاصطناعي</th>
                <th className="py-2.5 px-3">درجة الأمانة</th>
                <th className="py-2.5 px-3">الإجراء المطلوب</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {currentDigest.pendingJustifications.map((j) => (
                <tr key={j.id} className="hover:bg-slate-50/70 dark:hover:bg-slate-800/50 transition-colors">
                  <td className="py-2.5 px-3 font-bold text-slate-900 dark:text-slate-100">{j.studentName}</td>
                  <td className="py-2.5 px-3 text-slate-600 dark:text-slate-400">{j.className}</td>
                  <td className="py-2.5 px-3 text-slate-600 dark:text-slate-400">{j.absenceDate}</td>
                  <td className="py-2.5 px-3 text-slate-600 dark:text-slate-400">{j.reasonType}</td>
                  <td className="py-2.5 px-3">
                    {j.aiRiskLevel === 'high' || j.aiVerificationStatus === 'irregular' ? (
                      <span className="inline-flex items-center gap-1 bg-red-100 dark:bg-red-950/60 text-red-800 dark:text-red-300 px-2 py-0.5 rounded text-[11px] font-bold">
                        <ShieldAlert className="w-3 h-3 text-red-600 dark:text-red-400" />
                        <span>مشبوه / تناقض</span>
                      </span>
                    ) : j.aiRiskLevel === 'medium' ? (
                      <span className="inline-flex items-center gap-1 bg-amber-100 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300 px-2 py-0.5 rounded text-[11px] font-bold">
                        <span>تنبيه فحص</span>
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 px-2 py-0.5 rounded text-[11px] font-bold">
                        <Check className="w-3 h-3 text-emerald-600 dark:text-emerald-400" />
                        <span>سليم ومطابق</span>
                      </span>
                    )}
                  </td>
                  <td className="py-2.5 px-3 font-mono font-bold">
                    {j.integrityScore ? (
                      <span
                        className={
                          j.integrityScore >= 80
                            ? 'text-emerald-700 dark:text-emerald-400'
                            : j.integrityScore >= 50
                            ? 'text-amber-700 dark:text-amber-400'
                            : 'text-red-700 dark:text-red-400'
                        }
                      >
                        {j.integrityScore}%
                      </span>
                    ) : (
                      '—'
                    )}
                  </td>
                  <td className="py-2.5 px-3 font-medium text-slate-800 dark:text-slate-200">{j.actionRequiredAr}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="p-8 text-center bg-slate-50 dark:bg-slate-900/50 rounded-xl text-slate-500 dark:text-slate-400 text-xs">
          {lang === 'ar'
            ? '✅ لا توجد طلبات أعذار معلقة بانتظار الاعتماد.'
            : 'No pending medical excuse submissions.'}
        </div>
      )}
    </div>
  );
};

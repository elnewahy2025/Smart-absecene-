import React from 'react';
import { AlertTriangle, ExternalLink } from 'lucide-react';
import type { DailyEmailDigestItem } from '../../types/attendance';

interface DigestAnomaliesSectionProps {
  currentDigest: DailyEmailDigestItem;
  lang: string;
  onNavigateToTab?: (tab: string) => void;
}

export const DigestAnomaliesSection: React.FC<DigestAnomaliesSectionProps> = ({ currentDigest, lang, onNavigateToTab }) => {
  return (
    <div className="bg-[var(--app-card-bg,#ffffff)] rounded-2xl border border-[var(--app-border,#e2e8f0)] p-6 shadow-xs space-y-4 text-slate-800 dark:text-slate-100">
      <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-red-100 dark:bg-red-950/50 text-red-700 dark:text-red-400 flex items-center justify-center font-bold">
            <AlertTriangle className="w-4 h-4" />
          </div>
          <div>
            <h2 className="text-sm font-bold text-slate-900 dark:text-slate-100">
              {lang === 'ar'
                ? `أولاً: شذوذات وتناقضات الحضور المرصودة (${currentDigest.anomaliesCount})`
                : `1. Attendance Anomalies Detected (${currentDigest.anomaliesCount})`}
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              {lang === 'ar'
                ? 'شعب تشهد ارتفاعاً غير مبرر، غيابات متتالية دون عذر، وكشوف حضور معلقة لم تُعتمد'
                : 'Spikes in absence rates, consecutive unexcused days, and unsubmitted sessions.'}
            </p>
          </div>
        </div>
      </div>

      {currentDigest.anomalies.length > 0 ? (
        <div className="space-y-3">
          {currentDigest.anomalies.map((anom) => (
            <div
              key={anom.id}
              className={`p-4 rounded-xl border transition-all ${
                anom.severity === 'critical'
                  ? 'bg-red-50/60 dark:bg-red-950/30 border-red-200 dark:border-red-900/60'
                  : anom.severity === 'warning'
                  ? 'bg-amber-50/60 dark:bg-amber-950/30 border-amber-200 dark:border-amber-900/60'
                  : 'bg-emerald-50/60 dark:bg-emerald-950/30 border-emerald-200 dark:border-emerald-900/60'
              }`}
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-2">
                <div className="flex items-center gap-2">
                  <span
                    className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                      anom.severity === 'critical'
                        ? 'bg-red-600 text-white'
                        : anom.severity === 'warning'
                        ? 'bg-amber-600 text-white'
                        : 'bg-emerald-600 text-white'
                    }`}
                  >
                    {anom.severity === 'critical'
                      ? lang === 'ar'
                        ? 'شذوذ حرج'
                        : 'Critical'
                      : anom.severity === 'warning'
                      ? lang === 'ar'
                        ? 'تنبيه شذوذ'
                        : 'Warning'
                      : 'Info'}
                  </span>
                  <span className="font-bold text-xs sm:text-sm text-slate-900 dark:text-slate-100">{anom.titleAr}</span>
                </div>
                <span className="bg-white/90 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-200 text-xs font-mono font-bold px-2.5 py-0.5 rounded-md self-start sm:self-auto">
                  {anom.metric}
                </span>
              </div>

              <p className="text-xs text-slate-700 dark:text-slate-300 leading-relaxed mb-2.5">{anom.descriptionAr}</p>

              <div className="bg-white dark:bg-slate-900/80 rounded-lg p-2.5 border border-slate-200/80 dark:border-slate-800 text-xs text-slate-600 dark:text-slate-300 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div className="flex items-center gap-1.5">
                  <span className="font-bold text-slate-900 dark:text-slate-100">
                    {lang === 'ar' ? 'الإجراء الإداري المقترح:' : 'Suggested Action:'}
                  </span>
                  <span>{anom.suggestedActionAr}</span>
                </div>

                {anom.type === 'unsubmitted_session' && onNavigateToTab && (
                  <button
                    onClick={() => onNavigateToTab('sessions')}
                    className="text-xs font-bold text-emerald-700 hover:text-emerald-900 dark:text-emerald-400 dark:hover:text-emerald-300 flex items-center gap-1 self-end sm:self-auto cursor-pointer"
                  >
                    <span>{lang === 'ar' ? 'فتح الكشوف للاعتماد' : 'Open Sessions'}</span>
                    <ExternalLink className="w-3 h-3" />
                  </button>
                )}

                {anom.type === 'pattern_discrepancy' && onNavigateToTab && (
                  <button
                    onClick={() => onNavigateToTab('justifications')}
                    className="text-xs font-bold text-sky-700 hover:text-sky-900 dark:text-sky-400 dark:hover:text-sky-300 flex items-center gap-1 self-end sm:self-auto cursor-pointer"
                  >
                    <span>{lang === 'ar' ? 'تدقيق الأعذار' : 'Audit Excuses'}</span>
                    <ExternalLink className="w-3 h-3" />
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="p-8 text-center bg-slate-50 dark:bg-slate-900/50 rounded-xl text-slate-500 dark:text-slate-400 text-xs">
          {lang === 'ar'
            ? '✅ لا توجد شذوذات سلوكية أو غيابات غير اعتيادية مسجلة هذا الصباح.'
            : 'No behavioral or attendance anomalies registered this morning.'}
        </div>
      )}
    </div>
  );
};

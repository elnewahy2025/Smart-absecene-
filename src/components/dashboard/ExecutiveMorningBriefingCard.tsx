import React, { useState, useEffect } from 'react';
import { useAttendance } from '../../context/AttendanceContext';
import { DailyEmailDigestItem } from '../../types/attendance';
import { DigestSettingsModal } from '../digest/DigestSettingsModal';
import {
  Sparkles,
  Send,
  Settings,
  RefreshCw,
  AlertTriangle,
  Clock,
  CheckCircle2,
  Users,
  FileCheck2,
  ChevronRight,
  ShieldAlert,
  Loader2,
} from 'lucide-react';

interface ExecutiveMorningBriefingCardProps {
  onNavigateTab?: (tab: string) => void;
}

export const ExecutiveMorningBriefingCard: React.FC<ExecutiveMorningBriefingCardProps> = ({
  onNavigateTab,
}) => {
  const {
    currentTenant,
    lang,
    digestConfig,
    generateCurrentDigest,
    dispatchDailyDigest,
    students,
    sessions,
    justifications,
  } = useAttendance();

  const isAr = lang === 'ar';

  const [currentDigest, setCurrentDigest] = useState<DailyEmailDigestItem | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [hasRequested, setHasRequested] = useState<boolean>(false);
  const [dispatching, setDispatching] = useState<boolean>(false);
  const [toastMsg, setToastMsg] = useState<string | null>(null);
  const [isSettingsOpen, setIsSettingsOpen] = useState<boolean>(false);

  const loadDigest = async () => {
    setLoading(true);
    try {
      const digest = await generateCurrentDigest();
      setCurrentDigest(digest);
    } catch (err) {
      console.error('Error generating digest in Executive Briefing:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSendNow = async () => {
    setDispatching(true);
    try {
      const result = await dispatchDailyDigest();
      setToastMsg(result.message);
      if (result.digestItem) {
        setCurrentDigest(result.digestItem);
      }
      setTimeout(() => setToastMsg(null), 4000);
    } catch (err: any) {
      console.error(err);
      setToastMsg(isAr ? 'حدث خطأ أثناء إرسال النشرة.' : 'Failed to send digest.');
      setTimeout(() => setToastMsg(null), 4000);
    } finally {
      setDispatching(false);
    }
  };

  // Extract top 3 critical items across anomalies, high risk students, and pending excuses
  const topCriticalItems = React.useMemo(() => {
    if (!currentDigest) return [];
    const items: Array<{
      id: string;
      type: 'anomaly' | 'high_risk' | 'excuse';
      badge: string;
      badgeColor: string;
      title: string;
      description: string;
      actionText: string;
      actionTab: string;
    }> = [];

    // 1. Critical Anomalies
    currentDigest.anomalies.slice(0, 2).forEach((anom) => {
      items.push({
        id: anom.id,
        type: 'anomaly',
        badge: anom.severity === 'critical' ? (isAr ? 'خلل حرج' : 'Critical') : (isAr ? 'تنبيه شذوذ' : 'Anomaly'),
        badgeColor: anom.severity === 'critical' ? 'bg-rose-600 text-white' : 'bg-amber-600 text-white',
        title: anom.titleAr,
        description: anom.descriptionAr,
        actionText: isAr ? 'معالجة الشذوذ' : 'Resolve',
        actionTab: anom.type === 'unsubmitted_session' ? 'sessions' : 'reports',
      });
    });

    // 2. High Risk Students
    currentDigest.highRiskStudents.slice(0, 2).forEach((student) => {
      items.push({
        id: student.id,
        type: 'high_risk',
        badge: isAr ? `حرمان (${student.totalAbsences} أيام)` : `Risk (${student.totalAbsences}d)`,
        badgeColor: 'bg-rose-500/20 text-rose-700 dark:text-rose-300 border border-rose-500/30',
        title: student.name,
        description: student.actionRequiredAr || student.primaryConcernAr,
        actionText: isAr ? 'ملف الطالب' : 'Student',
        actionTab: 'students',
      });
    });

    // 3. Pending Excuses
    currentDigest.pendingJustifications.slice(0, 1).forEach((excuse) => {
      items.push({
        id: excuse.id,
        type: 'excuse',
        badge: isAr ? 'عذر معلق' : 'Pending',
        badgeColor: 'bg-blue-500/20 text-blue-700 dark:text-blue-300 border border-blue-500/30',
        title: `${isAr ? 'عذر طبي:' : 'Medical:'} ${excuse.studentName}`,
        description: excuse.actionRequiredAr || excuse.reasonType,
        actionText: isAr ? 'مراجعة العذر' : 'Review',
        actionTab: 'justifications',
      });
    });

    return items.slice(0, 3);
  }, [currentDigest, isAr]);

  return (
    <div
      className="app-card rounded-2xl border p-5 sm:p-6 shadow-sm relative overflow-hidden space-y-4"
      style={{
        backgroundColor: 'var(--app-card-bg)',
        borderColor: 'var(--app-card-border)',
      }}
    >
      {/* Toast */}
      {toastMsg && (
        <div className="fixed bottom-6 end-6 z-50 bg-primary text-white text-xs font-bold px-4 py-3 rounded-xl shadow-lg flex items-center gap-2 animate-bounce">
          <CheckCircle2 className="w-4 h-4" />
          <span>{toastMsg}</span>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-200/80 dark:border-slate-800">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-primary/10 text-primary flex items-center justify-center shadow-xs">
            <Sparkles className="w-5 h-5 text-primary" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-sm sm:text-base font-black text-slate-900 dark:text-slate-100">
                {isAr ? 'الموجز الصباحي والتحليل الاستباقي (Gemini AI Daily Digest)' : 'Morning AI Executive Digest'}
              </h3>
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 font-bold">
                {digestConfig.enabled ? (isAr ? 'الإرسال التلقائي نشط' : 'Active') : (isAr ? 'إرسال يدوي' : 'Manual')}
              </span>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2">
          {!hasRequested ? (
            <button
              onClick={() => {
                setHasRequested(true);
                loadDigest();
              }}
              disabled={loading}
              className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-bold bg-primary hover:bg-primary-hover text-white shadow-xs transition-colors cursor-pointer"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>{isAr ? 'بدء التحليل الاستباقي (عند الطلب)' : 'Run Morning Analysis'}</span>
            </button>
          ) : (
            <>
              <button
                onClick={handleSendNow}
                disabled={dispatching || loading}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold bg-primary hover:bg-primary-hover text-white shadow-xs transition-colors cursor-pointer disabled:opacity-50"
                title={isAr ? 'إرسال النشرة الصباحية الآن لبريد إدارة المدرسة' : 'Send Digest Now'}
              >
                {dispatching ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    <span>{isAr ? 'جارٍ الإرسال...' : 'Sending...'}</span>
                  </>
                ) : (
                  <>
                    <Send className="w-3.5 h-3.5" />
                    <span>{isAr ? 'إرسال النشرة' : 'Dispatch Now'}</span>
                  </>
                )}
              </button>

              <button
                onClick={loadDigest}
                disabled={loading}
                className="p-1.5 rounded-lg text-slate-500 hover:text-slate-900 dark:hover:text-slate-100 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer border border-slate-200 dark:border-slate-700"
                title={isAr ? 'تحديث التحليل' : 'Refresh'}
              >
                <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
              </button>
            </>
          )}

          <button
            onClick={() => setIsSettingsOpen(true)}
            className="p-1.5 rounded-lg text-slate-500 hover:text-slate-900 dark:hover:text-slate-100 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer border border-slate-200 dark:border-slate-700"
            title={isAr ? 'ضبط توقيت ومستلمي النشرة' : 'Digest Settings'}
          >
            <Settings className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* AI Synthesis Summary & Insights (Rendered only on demand) */}
      {!hasRequested ? null : loading ? (
        <div className="py-6 flex items-center justify-center gap-2 text-xs text-slate-400">
          <Loader2 className="w-4 h-4 animate-spin text-primary" />
          <span>{isAr ? 'جارٍ توليد التحليل الصباحي الاستباقي...' : 'Synthesizing morning digest...'}</span>
        </div>
      ) : (
        <>
          <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200/70 dark:border-slate-700/70 text-xs leading-relaxed text-slate-700 dark:text-slate-300">
            <div className="flex items-start gap-2">
              <Sparkles className="w-4 h-4 text-primary shrink-0 mt-0.5" />
              <div>
                <span className="font-bold text-slate-900 dark:text-slate-100 block mb-0.5">
                  {isAr ? 'الخلاصة التنفيذية للمساعد الذكي:' : 'Executive AI Summary:'}
                </span>
                <p>
                  {currentDigest?.geminiBriefing?.executiveSummary ||
                    (isAr
                      ? 'الوضع العام لانضباط المدرسة مستقر اليوم، يوصى بالتركيز على الشعب التي سجلت ارتفاعاً طفيفاً في الغياب ومتابعة الأعذار الطبية المعلقة.'
                      : 'School attendance is performing normally. Pay attention to class anomalies and pending medical justifications.')}
                </p>
              </div>
            </div>
          </div>

          {/* Top 3 Critical Items Grid */}
          {topCriticalItems.length > 0 && (
            <div className="space-y-2">
              <div className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                <AlertTriangle className="w-3.5 h-3.5 text-rose-500" />
                <span>{isAr ? 'أبرز الحالات الحرجة المستوجبة لتدخل الإدارة اليوم:' : 'Top Critical Items Requiring Administrative Intervention:'}</span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                {topCriticalItems.map((item) => (
                  <div
                    key={item.id}
                    className="p-3 rounded-xl border border-slate-200 dark:border-slate-700/80 bg-white dark:bg-slate-900 shadow-2xs flex flex-col justify-between gap-2"
                  >
                    <div className="space-y-1">
                      <div className="flex items-center justify-between">
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md ${item.badgeColor}`}>
                          {item.badge}
                        </span>
                      </div>
                      <h4 className="font-bold text-xs text-slate-900 dark:text-slate-100 line-clamp-1">
                        {item.title}
                      </h4>
                      <p className="text-[11px] text-slate-500 dark:text-slate-400 line-clamp-2">
                        {item.description}
                      </p>
                    </div>

                    {onNavigateTab && (
                      <button
                        onClick={() => onNavigateTab(item.actionTab)}
                        className="self-end text-[11px] font-bold text-primary hover:underline flex items-center gap-0.5 cursor-pointer mt-1"
                      >
                        <span>{item.actionText}</span>
                        <ChevronRight className="w-3 h-3 rtl:rotate-180" />
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </>
      )}

      {/* Settings Modal */}
      <DigestSettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
      />
    </div>
  );
};

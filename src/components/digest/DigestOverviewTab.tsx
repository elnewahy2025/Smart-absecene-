import React from 'react';
import { DailyEmailDigestItem, Tenant } from '../../types/attendance';
import {
  RefreshCw,
  Sparkles,
  AlertTriangle,
  FileCheck2,
  Users,
  ShieldAlert,
  ArrowRight,
  ExternalLink,
  Phone,
  Check,
  Shield,
  AlertCircle,
} from 'lucide-react';

interface DigestOverviewTabProps {
  currentDigest: DailyEmailDigestItem | null;
  loading: boolean;
  currentTenant: Tenant;
  lang: string;
  onNavigateToTab?: (tab: string) => void;
}

export const DigestOverviewTab: React.FC<DigestOverviewTabProps> = ({
  currentDigest,
  loading,
  currentTenant,
  lang,
  onNavigateToTab,
}) => {
  if (loading) {
    return (
      <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center space-y-3">
        <RefreshCw className="w-8 h-8 text-emerald-600 animate-spin mx-auto" />
        <p className="text-sm font-semibold text-slate-700">
          {lang === 'ar'
            ? 'جارٍ فحص سجلات الحضور ورصد الشذوذات واستدعاء الذكاء الاصطناعي...'
            : 'Analyzing attendance anomalies and synthesizing Gemini morning briefing...'}
        </p>
      </div>
    );
  }

  if (!currentDigest) return null;

  return (
    <div className="space-y-6">
      {/* 4 Executive KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {/* 1. Overall Attendance Rate */}
        <div className="bg-[var(--app-card-bg,#ffffff)] rounded-2xl border border-emerald-100 dark:border-emerald-900/40 p-5 shadow-xs relative overflow-hidden">
          <div className="absolute top-0 right-0 w-20 h-20 bg-emerald-50 dark:bg-emerald-900/10 rounded-full blur-xl -z-10" />
          <span className="text-xs font-semibold text-emerald-800 dark:text-emerald-400">
            {lang === 'ar' ? 'معدل الحضور التراكمي' : 'Overall Attendance Rate'}
          </span>
          <div className="text-2xl sm:text-3xl font-extrabold text-emerald-700 dark:text-emerald-400 mt-1">
            {currentDigest.overallAttendanceRate}%
          </div>
          <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-1 flex items-center gap-1">
            <span>{lang === 'ar' ? 'إجمالي المقيدين:' : 'Total Students:'}</span>
            <span className="font-semibold text-slate-700 dark:text-slate-200">{currentDigest.totalStudents} طالب</span>
          </div>
        </div>

        {/* 2. Anomalies Count */}
        <div
          className={`bg-[var(--app-card-bg,#ffffff)] rounded-2xl p-5 shadow-xs relative overflow-hidden border ${
            currentDigest.anomaliesCount > 0
              ? 'border-red-200 dark:border-red-900/50 bg-red-50/20 dark:bg-red-950/20'
              : 'border-slate-200 dark:border-slate-800'
          }`}
        >
          <span
            className={`text-xs font-semibold ${
              currentDigest.anomaliesCount > 0 ? 'text-red-700 dark:text-red-400' : 'text-slate-600 dark:text-slate-400'
            }`}
          >
            {lang === 'ar' ? 'شذوذات وتناقضات مرصودة' : 'Attendance Anomalies'}
          </span>
          <div
            className={`text-2xl sm:text-3xl font-extrabold mt-1 ${
              currentDigest.anomaliesCount > 0 ? 'text-red-600 dark:text-red-400' : 'text-slate-700 dark:text-slate-200'
            }`}
          >
            {currentDigest.anomaliesCount}
          </div>
          <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">
            {currentDigest.anomaliesCount > 0
              ? lang === 'ar'
                ? 'تتطلب تدخلاً إدارياً عاجلاً'
                : 'Requires early intervention'
              : lang === 'ar'
              ? 'لا توجد شذوذات حرجة'
              : 'No critical anomalies'}
          </div>
        </div>

        {/* 3. High Risk Students */}
        <div
          className={`bg-[var(--app-card-bg,#ffffff)] rounded-2xl p-5 shadow-xs relative overflow-hidden border ${
            currentDigest.highRiskStudentsCount > 0
              ? 'border-amber-200 dark:border-amber-900/50 bg-amber-50/20 dark:bg-amber-950/20'
              : 'border-slate-200 dark:border-slate-800'
          }`}
        >
          <span
            className={`text-xs font-semibold ${
              currentDigest.highRiskStudentsCount > 0 ? 'text-amber-800 dark:text-amber-400' : 'text-slate-600 dark:text-slate-400'
            }`}
          >
            {lang === 'ar' ? 'طلاب في النطاق الحرج' : 'High-Risk Students'}
          </span>
          <div
            className={`text-2xl sm:text-3xl font-extrabold mt-1 ${
              currentDigest.highRiskStudentsCount > 0 ? 'text-amber-600 dark:text-amber-400' : 'text-slate-700 dark:text-slate-200'
            }`}
          >
            {currentDigest.highRiskStudentsCount}
          </div>
          <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">
            {lang === 'ar' ? 'تجاوزوا حد الغياب (3-8+ أيام)' : 'Exceeded chronic threshold'}
          </div>
        </div>

        {/* 4. Pending Justifications */}
        <div
          className={`bg-[var(--app-card-bg,#ffffff)] rounded-2xl p-5 shadow-xs relative overflow-hidden border ${
            currentDigest.pendingJustificationsCount > 0
              ? 'border-sky-200 dark:border-sky-900/50 bg-sky-50/20 dark:bg-sky-950/20'
              : 'border-slate-200 dark:border-slate-800'
          }`}
        >
          <span
            className={`text-xs font-semibold ${
              currentDigest.pendingJustificationsCount > 0 ? 'text-sky-800 dark:text-sky-400' : 'text-slate-600 dark:text-slate-400'
            }`}
          >
            {lang === 'ar' ? 'أعذار طبية قيد التدقيق' : 'Pending Excuses'}
          </span>
          <div
            className={`text-2xl sm:text-3xl font-extrabold mt-1 ${
              currentDigest.pendingJustificationsCount > 0 ? 'text-sky-600 dark:text-sky-400' : 'text-slate-700 dark:text-slate-200'
            }`}
          >
            {currentDigest.pendingJustificationsCount}
          </div>
          <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">
            {lang === 'ar' ? 'بانتظار اعتماد لجنة الأعذار' : 'Awaiting committee review'}
          </div>
        </div>
      </div>

      {/* Gemini AI Executive Morning Briefing Box */}
      {currentDigest.geminiBriefing && (
        <div className="bg-gradient-to-br from-emerald-900 to-slate-900 rounded-2xl p-6 text-white shadow-md relative overflow-hidden">
          <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-emerald-800/80">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-emerald-500/20 border border-emerald-400/40 flex items-center justify-center text-emerald-300">
                <Sparkles className="w-4 h-4" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="font-bold text-sm text-emerald-200">
                    {currentDigest.geminiBriefing.headline ||
                      (lang === 'ar'
                        ? 'موجز القيادة الصباحي (Gemini Executive Synthesis)'
                        : 'Gemini Morning Briefing')}
                  </h3>
                  <span
                    className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                      currentDigest.geminiBriefing.urgencyLevel === 'critical'
                        ? 'bg-red-500 text-white'
                        : currentDigest.geminiBriefing.urgencyLevel === 'elevated'
                        ? 'bg-amber-500 text-slate-950 font-black'
                        : 'bg-emerald-500 text-white'
                    }`}
                  >
                    {currentDigest.geminiBriefing.urgencyLevel === 'critical'
                      ? lang === 'ar'
                        ? 'مستوى حرج'
                        : 'Critical'
                      : currentDigest.geminiBriefing.urgencyLevel === 'elevated'
                      ? lang === 'ar'
                        ? 'مستوى مرتفع'
                        : 'Elevated'
                      : lang === 'ar'
                      ? 'مستوى اعتيادي'
                      : 'Normal'}
                  </span>
                </div>
                <p className="text-[11px] text-slate-300">
                  {lang === 'ar'
                    ? `نُسقت خصيصاً لقيادة مدرسة ${currentTenant.name} لصبيحة يوم ${currentDigest.date}`
                    : `Prepared for ${currentTenant.name} leadership`}
                </p>
              </div>
            </div>

            <div className="text-[11px] bg-white/10 px-3 py-1 rounded-full text-emerald-200 border border-white/10">
              ⚡ {lang === 'ar' ? 'توجيهات العمل قبل الحصة الأولى (07:45 ص)' : 'Pre-Bell Directives'}
            </div>
          </div>

          {/* Summary Text */}
          <p className="text-xs sm:text-sm text-slate-200 mt-4 leading-relaxed font-medium">
            {currentDigest.geminiBriefing.executiveSummary}
          </p>

          {/* Key Priorities Grid */}
          <div className="mt-5 grid grid-cols-1 md:grid-cols-2 gap-3">
            <div className="bg-white/10 backdrop-blur-xs rounded-xl p-3.5 border border-white/10 space-y-2">
              <div className="text-xs font-bold text-emerald-300 flex items-center gap-1.5">
                <AlertCircle className="w-3.5 h-3.5" />
                <span>
                  {lang === 'ar'
                    ? 'إجراءات الإدارة ذات الأولوية القصوى:'
                    : 'Immediate Administration Priorities:'}
                </span>
              </div>
              <ul className="space-y-1.5 text-xs text-slate-200 pr-4 list-disc">
                {currentDigest.geminiBriefing.keyPriorities.map((item, idx) => (
                  <li key={idx} className="leading-snug">
                    {item}
                  </li>
                ))}
              </ul>
            </div>

            <div className="bg-white/10 backdrop-blur-xs rounded-xl p-3.5 border border-white/10 space-y-2">
              <div className="text-xs font-bold text-amber-300 flex items-center gap-1.5">
                <Shield className="w-3.5 h-3.5" />
                <span>
                  {lang === 'ar'
                    ? 'توجيهات المتابعة للموجه الطلابي:'
                    : 'Student Counselor Directives:'}
                </span>
              </div>
              <ul className="space-y-1.5 text-xs text-slate-200 pr-4 list-disc">
                {currentDigest.geminiBriefing.counselorDirectives.map((item, idx) => (
                  <li key={idx} className="leading-snug">
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      )}

      {/* Section 1: Anomalies */}
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

      {/* Section 2: Pending Justifications */}
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

      {/* Section 3: High Risk Students */}
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
    </div>
  );
};

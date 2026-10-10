import React, { useState, useEffect } from 'react';
import { useAttendance } from '../context/AttendanceContext';
import { DailyEmailDigestItem } from '../types/attendance';
import {
  Mail,
  Clock,
  Sparkles,
  AlertTriangle,
  CheckCircle2,
  Send,
  Users,
  FileCheck2,
  Calendar,
  Settings,
  History,
  Eye,
  RefreshCw,
  Phone,
  MessageSquare,
  ShieldAlert,
  ArrowRight,
  ExternalLink,
  ChevronDown,
  Copy,
  Check,
  Smartphone,
  Monitor,
  Flame,
  Plus,
  Trash2,
  Shield,
  FileText,
  AlertCircle,
  BellRing,
} from 'lucide-react';

interface DailyEmailDigestViewProps {
  onNavigateToTab?: (tab: string) => void;
}

export const DailyEmailDigestView: React.FC<DailyEmailDigestViewProps> = ({ onNavigateToTab }) => {
  const {
    currentTenant,
    lang,
    digestConfig,
    digestHistory,
    updateDigestConfig,
    generateCurrentDigest,
    dispatchDailyDigest,
    students,
    sessions,
    justifications,
  } = useAttendance();

  const [activeSubTab, setActiveSubTab] = useState<'overview' | 'email_preview' | 'settings' | 'history'>('overview');
  const [currentDigest, setCurrentDigest] = useState<DailyEmailDigestItem | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [dispatching, setDispatching] = useState<boolean>(false);
  const [dispatchSuccessMsg, setDispatchSuccessMsg] = useState<string | null>(null);
  const [previewDevice, setPreviewDevice] = useState<'desktop' | 'mobile'>('desktop');
  const [copiedHtml, setCopiedHtml] = useState<boolean>(false);
  const [selectedHistoryItem, setSelectedHistoryItem] = useState<DailyEmailDigestItem | null>(null);

  // Settings form local state
  const [formConfig, setFormConfig] = useState(digestConfig);
  const [newRecipientEmail, setNewRecipientEmail] = useState('');
  const [configSuccessMsg, setConfigSuccessMsg] = useState<string | null>(null);

  // Load / generate current digest on mount or when tenant changes
  const loadDigest = async () => {
    setLoading(true);
    try {
      const digest = await generateCurrentDigest();
      setCurrentDigest(digest);
    } catch (err) {
      console.error('Error generating digest:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDigest();
  }, [currentTenant.id, students.length, sessions.length, justifications.length]);

  const handleSendDigestNow = async () => {
    setDispatching(true);
    try {
      const result = await dispatchDailyDigest();
      setDispatchSuccessMsg(result.message);
      if (result.digestItem) {
        setCurrentDigest(result.digestItem);
      }
      setTimeout(() => setDispatchSuccessMsg(null), 5000);
    } catch (err: any) {
      console.error(err);
    } finally {
      setDispatching(false);
    }
  };

  const handleCopyHtml = () => {
    if (!currentDigest?.htmlContent) return;
    navigator.clipboard.writeText(currentDigest.htmlContent);
    setCopiedHtml(true);
    setTimeout(() => setCopiedHtml(false), 2500);
  };

  const handleAddRecipient = (e: React.FormEvent) => {
    e.preventDefault();
    const email = newRecipientEmail.trim().toLowerCase();
    if (!email || !email.includes('@')) return;
    if (formConfig.recipients.includes(email)) return;

    setFormConfig((prev) => ({
      ...prev,
      recipients: [...prev.recipients, email],
    }));
    setNewRecipientEmail('');
  };

  const handleRemoveRecipient = (email: string) => {
    setFormConfig((prev) => ({
      ...prev,
      recipients: prev.recipients.filter((r) => r !== email),
    }));
  };

  const handleSaveSettings = (e: React.FormEvent) => {
    e.preventDefault();
    updateDigestConfig(formConfig);
    setConfigSuccessMsg('تم حفظ وتحديث إعدادات النشرة الصباحية وجدولة الإرسال بنجاح.');
    setTimeout(() => setConfigSuccessMsg(null), 4000);
  };

  return (
    <div className="space-y-6">
      {/* Top Banner & Title */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex flex-wrap items-center gap-2">
              <span className="flex items-center gap-1 bg-emerald-100 text-emerald-800 text-xs px-2.5 py-1 rounded-full font-bold">
                <Clock className="w-3.5 h-3.5" />
                <span>
                  {lang === 'ar'
                    ? `إرسال آلي استباقي في ${digestConfig.scheduledTime} ص`
                    : `Automated Dispatch at ${digestConfig.scheduledTime} AM`}
                </span>
              </span>
              <span className="bg-slate-100 text-slate-700 text-xs px-2.5 py-1 rounded-full font-medium">
                {lang === 'ar' ? 'قبل انطلاق الطابور والحصة الأولى' : 'Before School Assembly'}
              </span>
              {digestConfig.enabled ? (
                <span className="bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs px-2 py-0.5 rounded-md font-semibold flex items-center gap-1">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                  {lang === 'ar' ? 'الجدولة نشطة' : 'Scheduler Active'}
                </span>
              ) : (
                <span className="bg-slate-100 text-slate-500 text-xs px-2 py-0.5 rounded-md font-semibold">
                  {lang === 'ar' ? 'الجدولة متوقفة' : 'Scheduler Paused'}
                </span>
              )}
            </div>

            <h1 className="text-xl sm:text-2xl font-bold text-slate-900 flex items-center gap-2 pt-1">
              <Mail className="w-6 h-6 text-emerald-600" />
              <span>
                {lang === 'ar'
                  ? 'النشرة الصباحية اليومية لقيادة المدرسة (Daily Morning Digest)'
                  : 'Daily Executive Morning Digest'}
              </span>
            </h1>

            <p className="text-xs sm:text-sm text-slate-600 max-w-3xl leading-relaxed">
              {lang === 'ar'
                ? 'ملخص تنفيذي مدعوم بالذكاء الاصطناعي يصل يومياً لبريد مدير المدرسة والوكيل والموجه الطلابي في الصباح الباكر، يرصد شذوذات الحضور المفاجئة، طلبات الأعذار المعلقة وتدقيقها الجنائي، والطلاب المعرضين لخطر الحرمان والإنذارات الرسمية.'
                : 'Automated morning email briefing delivered to school leaders before school starts, summarizing attendance anomalies, pending medical excuse reviews, and high-risk chronic absentee students.'}
            </p>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-wrap items-center gap-2 self-start lg:self-center">
            <button
              disabled={loading}
              onClick={loadDigest}
              className="flex items-center gap-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 px-3.5 py-2 rounded-xl text-xs font-semibold transition-colors cursor-pointer disabled:opacity-50"
              title={lang === 'ar' ? 'إعادة فحص الشذوذات بالذكاء الاصطناعي' : 'Recompute digest anomalies'}
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin text-emerald-600' : ''}`} />
              <span>{lang === 'ar' ? 'تحديث البيانات' : 'Refresh'}</span>
            </button>

            <button
              disabled={dispatching || loading}
              onClick={handleSendDigestNow}
              className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 rounded-xl text-xs font-bold shadow-sm hover:shadow-md transition-all cursor-pointer disabled:opacity-50"
            >
              <Send className="w-4 h-4" />
              <span>
                {dispatching
                  ? lang === 'ar'
                    ? 'جارٍ إرسال النشرة...'
                    : 'Dispatching...'
                  : lang === 'ar'
                  ? 'إرسال النشرة الصباحية الآن'
                  : 'Send Digest Now'}
              </span>
            </button>
          </div>
        </div>

        {/* Success Alerts */}
        {dispatchSuccessMsg && (
          <div className="mt-4 bg-emerald-50 border border-emerald-200 text-emerald-900 px-4 py-3 rounded-xl text-xs flex items-center justify-between gap-3 animate-fade-in">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <span className="font-semibold">{dispatchSuccessMsg}</span>
            </div>
            <button
              onClick={() => setActiveSubTab('history')}
              className="underline text-emerald-800 text-[11px] font-bold cursor-pointer"
            >
              {lang === 'ar' ? 'عرض في سجل الإرسال' : 'View in History'}
            </button>
          </div>
        )}

        {configSuccessMsg && (
          <div className="mt-4 bg-emerald-50 border border-emerald-200 text-emerald-900 px-4 py-3 rounded-xl text-xs flex items-center gap-2 animate-fade-in">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span className="font-semibold">{configSuccessMsg}</span>
          </div>
        )}
      </div>

      {/* Navigation Sub-Tabs */}
      <div className="flex flex-wrap items-center gap-2 border-b border-slate-200 pb-2">
        <button
          onClick={() => setActiveSubTab('overview')}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer ${
            activeSubTab === 'overview'
              ? 'bg-slate-900 text-white shadow-xs'
              : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
          }`}
        >
          <Sparkles className="w-4 h-4 text-emerald-400" />
          <span>{lang === 'ar' ? 'نشرة اليوم وموجز القيادة' : "Today's Briefing"}</span>
          {currentDigest && currentDigest.anomaliesCount > 0 && (
            <span className="bg-red-500 text-white text-[10px] px-1.5 py-0.2 rounded-full font-bold">
              {currentDigest.anomaliesCount}
            </span>
          )}
        </button>

        <button
          onClick={() => setActiveSubTab('email_preview')}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer ${
            activeSubTab === 'email_preview'
              ? 'bg-slate-900 text-white shadow-xs'
              : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
          }`}
        >
          <Eye className="w-4 h-4 text-sky-400" />
          <span>{lang === 'ar' ? 'معاينة البريد الإلكتروني الفعلي' : 'Live Email Preview'}</span>
        </button>

        <button
          onClick={() => setActiveSubTab('settings')}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer ${
            activeSubTab === 'settings'
              ? 'bg-slate-900 text-white shadow-xs'
              : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
          }`}
        >
          <Settings className="w-4 h-4 text-amber-400" />
          <span>{lang === 'ar' ? 'إعدادات الجدولة والمستلمين' : 'Scheduler & Recipients'}</span>
          <span className="text-[10px] bg-slate-200 text-slate-700 px-1.5 py-0.2 rounded font-mono">
            {digestConfig.recipients.length}
          </span>
        </button>

        <button
          onClick={() => setActiveSubTab('history')}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer ${
            activeSubTab === 'history'
              ? 'bg-slate-900 text-white shadow-xs'
              : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
          }`}
        >
          <History className="w-4 h-4 text-indigo-400" />
          <span>{lang === 'ar' ? 'سجل النشرات المرسلة' : 'Dispatch History'}</span>
          <span className="text-[10px] bg-slate-200 text-slate-700 px-1.5 py-0.2 rounded font-mono">
            {digestHistory.length}
          </span>
        </button>
      </div>

      {/* SUB-TAB 1: LIVE DIGEST & EXECUTIVE BRIEFING */}
      {activeSubTab === 'overview' && (
        <div className="space-y-6">
          {loading ? (
            <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center space-y-3">
              <RefreshCw className="w-8 h-8 text-emerald-600 animate-spin mx-auto" />
              <p className="text-sm font-semibold text-slate-700">
                {lang === 'ar'
                  ? 'جارٍ فحص سجلات الحضور ورصد الشذوذات واستدعاء الذكاء الاصطناعي...'
                  : 'Analyzing attendance anomalies and synthesizing Gemini morning briefing...'}
              </p>
            </div>
          ) : currentDigest ? (
            <>
              {/* 4 Executive KPI Cards */}
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                {/* 1. Overall Attendance Rate */}
                <div className="bg-white rounded-2xl border border-emerald-100 p-5 shadow-xs relative overflow-hidden">
                  <div className="absolute top-0 right-0 w-20 h-20 bg-emerald-50 rounded-full blur-xl -z-10" />
                  <span className="text-xs font-semibold text-emerald-800">
                    {lang === 'ar' ? 'معدل الحضور التراكمي' : 'Overall Attendance Rate'}
                  </span>
                  <div className="text-2xl sm:text-3xl font-extrabold text-emerald-700 mt-1">
                    {currentDigest.overallAttendanceRate}%
                  </div>
                  <div className="text-[11px] text-slate-500 mt-1 flex items-center gap-1">
                    <span>{lang === 'ar' ? 'إجمالي المقيدين:' : 'Total Students:'}</span>
                    <span className="font-semibold text-slate-700">{currentDigest.totalStudents} طالب</span>
                  </div>
                </div>

                {/* 2. Anomalies Count */}
                <div
                  className={`bg-white rounded-2xl p-5 shadow-xs relative overflow-hidden border ${
                    currentDigest.anomaliesCount > 0 ? 'border-red-200 bg-red-50/20' : 'border-slate-200'
                  }`}
                >
                  <span
                    className={`text-xs font-semibold ${
                      currentDigest.anomaliesCount > 0 ? 'text-red-700' : 'text-slate-600'
                    }`}
                  >
                    {lang === 'ar' ? 'شذوذات وتناقضات مرصودة' : 'Attendance Anomalies'}
                  </span>
                  <div
                    className={`text-2xl sm:text-3xl font-extrabold mt-1 ${
                      currentDigest.anomaliesCount > 0 ? 'text-red-600' : 'text-slate-700'
                    }`}
                  >
                    {currentDigest.anomaliesCount}
                  </div>
                  <div className="text-[11px] text-slate-500 mt-1">
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
                  className={`bg-white rounded-2xl p-5 shadow-xs relative overflow-hidden border ${
                    currentDigest.highRiskStudentsCount > 0 ? 'border-amber-200 bg-amber-50/20' : 'border-slate-200'
                  }`}
                >
                  <span
                    className={`text-xs font-semibold ${
                      currentDigest.highRiskStudentsCount > 0 ? 'text-amber-800' : 'text-slate-600'
                    }`}
                  >
                    {lang === 'ar' ? 'طلاب في النطاق الحرج' : 'High-Risk Students'}
                  </span>
                  <div
                    className={`text-2xl sm:text-3xl font-extrabold mt-1 ${
                      currentDigest.highRiskStudentsCount > 0 ? 'text-amber-600' : 'text-slate-700'
                    }`}
                  >
                    {currentDigest.highRiskStudentsCount}
                  </div>
                  <div className="text-[11px] text-slate-500 mt-1">
                    {lang === 'ar' ? 'تجاوزوا حد الغياب (3-8+ أيام)' : 'Exceeded chronic threshold'}
                  </div>
                </div>

                {/* 4. Pending Justifications */}
                <div
                  className={`bg-white rounded-2xl p-5 shadow-xs relative overflow-hidden border ${
                    currentDigest.pendingJustificationsCount > 0 ? 'border-sky-200 bg-sky-50/20' : 'border-slate-200'
                  }`}
                >
                  <span
                    className={`text-xs font-semibold ${
                      currentDigest.pendingJustificationsCount > 0 ? 'text-sky-800' : 'text-slate-600'
                    }`}
                  >
                    {lang === 'ar' ? 'أعذار طبية قيد التدقيق' : 'Pending Excuses'}
                  </span>
                  <div
                    className={`text-2xl sm:text-3xl font-extrabold mt-1 ${
                      currentDigest.pendingJustificationsCount > 0 ? 'text-sky-600' : 'text-slate-700'
                    }`}
                  >
                    {currentDigest.pendingJustificationsCount}
                  </div>
                  <div className="text-[11px] text-slate-500 mt-1">
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
              <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-4">
                <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                  <div className="flex items-center gap-2">
                    <div className="w-7 h-7 rounded-lg bg-red-100 text-red-700 flex items-center justify-center font-bold">
                      <AlertTriangle className="w-4 h-4" />
                    </div>
                    <div>
                      <h2 className="text-sm font-bold text-slate-900">
                        {lang === 'ar'
                          ? `أولاً: شذوذات وتناقضات الحضور المرصودة (${currentDigest.anomaliesCount})`
                          : `1. Attendance Anomalies Detected (${currentDigest.anomaliesCount})`}
                      </h2>
                      <p className="text-xs text-slate-500">
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
                            ? 'bg-red-50/60 border-red-200'
                            : anom.severity === 'warning'
                            ? 'bg-amber-50/60 border-amber-200'
                            : 'bg-emerald-50/60 border-emerald-200'
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
                            <span className="font-bold text-xs sm:text-sm text-slate-900">{anom.titleAr}</span>
                          </div>
                          <span className="bg-white/90 border border-slate-200 text-slate-800 text-xs font-mono font-bold px-2.5 py-0.5 rounded-md self-start sm:self-auto">
                            {anom.metric}
                          </span>
                        </div>

                        <p className="text-xs text-slate-700 leading-relaxed mb-2.5">{anom.descriptionAr}</p>

                        <div className="bg-white rounded-lg p-2.5 border border-slate-200/80 text-xs text-slate-600 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                          <div className="flex items-center gap-1.5">
                            <span className="font-bold text-slate-900">
                              {lang === 'ar' ? 'الإجراء الإداري المقترح:' : 'Suggested Action:'}
                            </span>
                            <span>{anom.suggestedActionAr}</span>
                          </div>

                          {anom.type === 'unsubmitted_session' && onNavigateToTab && (
                            <button
                              onClick={() => onNavigateToTab('sessions')}
                              className="text-xs font-bold text-emerald-700 hover:text-emerald-900 flex items-center gap-1 self-end sm:self-auto"
                            >
                              <span>{lang === 'ar' ? 'فتح الكشوف للاعتماد' : 'Open Sessions'}</span>
                              <ExternalLink className="w-3 h-3" />
                            </button>
                          )}

                          {anom.type === 'pattern_discrepancy' && onNavigateToTab && (
                            <button
                              onClick={() => onNavigateToTab('justifications')}
                              className="text-xs font-bold text-sky-700 hover:text-sky-900 flex items-center gap-1 self-end sm:self-auto"
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
                  <div className="p-8 text-center bg-slate-50 rounded-xl text-slate-500 text-xs">
                    {lang === 'ar'
                      ? '✅ لا توجد شذوذات سلوكية أو غيابات غير اعتيادية مسجلة هذا الصباح.'
                      : 'No behavioral or attendance anomalies registered this morning.'}
                  </div>
                )}
              </div>

              {/* Section 2: Pending Justifications */}
              <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-4">
                <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                  <div className="flex items-center gap-2">
                    <div className="w-7 h-7 rounded-lg bg-sky-100 text-sky-700 flex items-center justify-center font-bold">
                      <FileCheck2 className="w-4 h-4" />
                    </div>
                    <div>
                      <h2 className="text-sm font-bold text-slate-900">
                        {lang === 'ar'
                          ? `ثانياً: طلبات الأعذار الطبية المعلقة بانتظار الاعتماد (${currentDigest.pendingJustificationsCount})`
                          : `2. Pending Medical Excuses Awaiting Review (${currentDigest.pendingJustificationsCount})`}
                      </h2>
                      <p className="text-xs text-slate-500">
                        {lang === 'ar'
                          ? 'مفحوصة بواسطة أداة التحقق الجنائي للذكاء الاصطناعي لرصد التناقضات والأختام'
                          : 'Pre-verified by Gemini AI for document tampering, signature, and name mismatch.'}
                      </p>
                    </div>
                  </div>

                  {onNavigateToTab && (
                    <button
                      onClick={() => onNavigateToTab('justifications')}
                      className="text-xs font-bold text-sky-600 hover:text-sky-800 flex items-center gap-1 cursor-pointer"
                    >
                      <span>{lang === 'ar' ? 'الانتقال للتدقيق' : 'Go to Reviews'}</span>
                      <ArrowRight className="w-3 h-3 rotate-180" />
                    </button>
                  )}
                </div>

                {currentDigest.pendingJustifications.length > 0 ? (
                  <div className="overflow-x-auto">
                    <table className="w-full text-right text-xs">
                      <thead className="bg-slate-50 text-slate-700 font-semibold border-b border-slate-200">
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
                      <tbody className="divide-y divide-slate-100">
                        {currentDigest.pendingJustifications.map((j) => (
                          <tr key={j.id} className="hover:bg-slate-50/70">
                            <td className="py-2.5 px-3 font-bold text-slate-900">{j.studentName}</td>
                            <td className="py-2.5 px-3 text-slate-600">{j.className}</td>
                            <td className="py-2.5 px-3 text-slate-600">{j.absenceDate}</td>
                            <td className="py-2.5 px-3 text-slate-600">{j.reasonType}</td>
                            <td className="py-2.5 px-3">
                              {j.aiRiskLevel === 'high' || j.aiVerificationStatus === 'irregular' ? (
                                <span className="inline-flex items-center gap-1 bg-red-100 text-red-800 px-2 py-0.5 rounded text-[11px] font-bold">
                                  <ShieldAlert className="w-3 h-3 text-red-600" />
                                  <span>مشبوه / تناقض</span>
                                </span>
                              ) : j.aiRiskLevel === 'medium' ? (
                                <span className="inline-flex items-center gap-1 bg-amber-100 text-amber-800 px-2 py-0.5 rounded text-[11px] font-bold">
                                  <span>تنبيه فحص</span>
                                </span>
                              ) : (
                                <span className="inline-flex items-center gap-1 bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded text-[11px] font-bold">
                                  <Check className="w-3 h-3 text-emerald-600" />
                                  <span>سليم ومطابق</span>
                                </span>
                              )}
                            </td>
                            <td className="py-2.5 px-3 font-mono font-bold">
                              {j.integrityScore ? (
                                <span
                                  className={
                                    j.integrityScore >= 80
                                      ? 'text-emerald-700'
                                      : j.integrityScore >= 50
                                      ? 'text-amber-700'
                                      : 'text-red-700'
                                  }
                                >
                                  {j.integrityScore}%
                                </span>
                              ) : (
                                '—'
                              )}
                            </td>
                            <td className="py-2.5 px-3 font-medium text-slate-800">{j.actionRequiredAr}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <div className="p-8 text-center bg-slate-50 rounded-xl text-slate-500 text-xs">
                    {lang === 'ar'
                      ? '✅ لا توجد طلبات أعذار معلقة بانتظار الاعتماد.'
                      : 'No pending medical excuse submissions.'}
                  </div>
                )}
              </div>

              {/* Section 3: High Risk Students */}
              <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-4">
                <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                  <div className="flex items-center gap-2">
                    <div className="w-7 h-7 rounded-lg bg-amber-100 text-amber-700 flex items-center justify-center font-bold">
                      <Users className="w-4 h-4" />
                    </div>
                    <div>
                      <h2 className="text-sm font-bold text-slate-900">
                        {lang === 'ar'
                          ? `ثالثاً: الطلاب الأكثر عرضة لخطر الحرمان والإنذارات (${currentDigest.highRiskStudentsCount})`
                          : `3. High-Risk Students Approaching Denial Threshold (${currentDigest.highRiskStudentsCount})`}
                      </h2>
                      <p className="text-xs text-slate-500">
                        {lang === 'ar'
                          ? 'قائمة الحالات الحرجة الموجهة للموجه الطلابي للتدخل الإرشادي الفوري صباح اليوم'
                          : 'Targeted students for immediate morning counseling and guardian follow-up.'}
                      </p>
                    </div>
                  </div>

                  {onNavigateToTab && (
                    <button
                      onClick={() => onNavigateToTab('reports')}
                      className="text-xs font-bold text-emerald-600 hover:text-emerald-800 flex items-center gap-1 cursor-pointer"
                    >
                      <span>{lang === 'ar' ? 'تقرير الحرمان المفصل' : 'Full Chronic Report'}</span>
                      <ArrowRight className="w-3 h-3 rotate-180" />
                    </button>
                  )}
                </div>

                {currentDigest.highRiskStudents.length > 0 ? (
                  <div className="overflow-x-auto">
                    <table className="w-full text-right text-xs">
                      <thead className="bg-slate-50 text-slate-700 font-semibold border-b border-slate-200">
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
                      <tbody className="divide-y divide-slate-100">
                        {currentDigest.highRiskStudents.map((s) => (
                          <tr
                            key={s.id}
                            className={s.riskTier === 'tier_8_plus' ? 'bg-red-50/40 hover:bg-red-50/70' : 'hover:bg-slate-50/70'}
                          >
                            <td className="py-2.5 px-3 font-bold text-slate-900">{s.name}</td>
                            <td className="py-2.5 px-3 text-slate-600">{s.className}</td>
                            <td className="py-2.5 px-3 font-extrabold text-xs">
                              <span
                                className={
                                  s.totalAbsences >= 8
                                    ? 'text-red-700'
                                    : s.totalAbsences >= 5
                                    ? 'text-amber-700'
                                    : 'text-slate-800'
                                }
                              >
                                {s.totalAbsences} يوم
                              </span>
                            </td>
                            <td className="py-2.5 px-3 font-bold text-emerald-700">{s.attendanceRate}%</td>
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
                                <span className="bg-blue-100 text-blue-800 font-bold text-[10px] px-2 py-0.5 rounded-full">
                                  تنبيه أولي
                                </span>
                              )}
                            </td>
                            <td className="py-2.5 px-3 text-slate-700">
                              <div className="font-semibold">{s.guardianName}</div>
                              <div className="flex items-center gap-1.5 mt-0.5">
                                <a
                                  href={`tel:${s.guardianPhone}`}
                                  className="text-[11px] font-mono text-sky-700 hover:underline flex items-center gap-1"
                                >
                                  <Phone className="w-3 h-3" />
                                  <span dir="ltr">{s.guardianPhone}</span>
                                </a>
                              </div>
                            </td>
                            <td className="py-2.5 px-3 text-slate-800">{s.actionRequiredAr}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <div className="p-8 text-center bg-slate-50 rounded-xl text-slate-500 text-xs">
                    {lang === 'ar'
                      ? '✅ لا يوجد طلاب في الشريحة الحرجة حالياً.'
                      : 'No students currently in the chronic risk threshold.'}
                  </div>
                )}
              </div>
            </>
          ) : null}
        </div>
      )}

      {/* SUB-TAB 2: EMAIL PREVIEW */}
      {activeSubTab === 'email_preview' && (
        <div className="space-y-4">
          <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-xs flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-slate-700">
                {lang === 'ar' ? 'عرض الجهاز للمعاينة:' : 'Preview Device:'}
              </span>
              <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-lg">
                <button
                  onClick={() => setPreviewDevice('desktop')}
                  className={`flex items-center gap-1 px-3 py-1 rounded-md text-xs font-semibold cursor-pointer ${
                    previewDevice === 'desktop'
                      ? 'bg-white text-slate-900 shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  <Monitor className="w-3.5 h-3.5" />
                  <span>سطح المكتب (Outlook/Gmail)</span>
                </button>
                <button
                  onClick={() => setPreviewDevice('mobile')}
                  className={`flex items-center gap-1 px-3 py-1 rounded-md text-xs font-semibold cursor-pointer ${
                    previewDevice === 'mobile'
                      ? 'bg-white text-slate-900 shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  <Smartphone className="w-3.5 h-3.5" />
                  <span>الهاتف المحمول</span>
                </button>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={handleCopyHtml}
                className="flex items-center gap-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 px-3 py-1.5 rounded-lg text-xs font-semibold cursor-pointer"
              >
                {copiedHtml ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copiedHtml ? 'تم نسخ كود HTML' : 'نسخ كود البريد (HTML)'}</span>
              </button>

              <button
                disabled={dispatching}
                onClick={handleSendDigestNow}
                className="flex items-center gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white px-3.5 py-1.5 rounded-lg text-xs font-bold cursor-pointer disabled:opacity-50"
              >
                <Send className="w-3.5 h-3.5" />
                <span>إرسال تجريبي الآن</span>
              </button>
            </div>
          </div>

          {/* Simulated Email Client Container */}
          <div className="bg-slate-200 p-4 sm:p-6 rounded-2xl border border-slate-300 flex justify-center">
            <div
              className={`bg-white rounded-xl shadow-lg border border-slate-300 overflow-hidden transition-all duration-300 ${
                previewDevice === 'desktop' ? 'w-full max-w-4xl' : 'w-full max-w-sm'
              }`}
            >
              {/* Email Client Header Toolbar */}
              <div className="bg-slate-100 border-b border-slate-200 px-4 py-3 space-y-2 text-xs">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-slate-500 font-mono text-[11px]">
                    <span className="w-3 h-3 rounded-full bg-red-400 inline-block" />
                    <span className="w-3 h-3 rounded-full bg-amber-400 inline-block" />
                    <span className="w-3 h-3 rounded-full bg-emerald-400 inline-block" />
                    <span className="mr-2">تطبيق البريد الإلكتروني الرسمي لنظام مدرستي حضور</span>
                  </div>
                  <span className="text-slate-400 text-[10px]">⏰ صادر في 06:45 صباحاً</span>
                </div>

                <div className="bg-white rounded-lg p-2.5 border border-slate-200 space-y-1.5">
                  <div className="flex items-center gap-2 text-slate-600">
                    <span className="font-bold text-slate-800 w-16">من:</span>
                    <span>نظام مدرستي حضور &lt;attendance-digest@andalus.edu.sa&gt;</span>
                  </div>
                  <div className="flex items-start gap-2 text-slate-600">
                    <span className="font-bold text-slate-800 w-16 shrink-0">إلى:</span>
                    <span className="text-[11px] text-slate-700">
                      {currentDigest?.recipients.join('، ') || digestConfig.recipients.join('، ')}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 text-slate-600">
                    <span className="font-bold text-slate-800 w-16">الموضوع:</span>
                    <span className="font-bold text-slate-900">{currentDigest?.subject}</span>
                  </div>
                </div>
              </div>

              {/* Rendered HTML Body */}
              <div className="p-4 sm:p-6 bg-white overflow-y-auto max-h-[750px]">
                {currentDigest?.htmlContent ? (
                  <div
                    dangerouslySetInnerHTML={{ __html: currentDigest.htmlContent }}
                    className="email-render-container"
                  />
                ) : (
                  <div className="p-8 text-center text-slate-500 text-xs">لا يوجد محتوى للمعاينة حالياً.</div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* SUB-TAB 3: SCHEDULER & RECIPIENTS SETTINGS */}
      {activeSubTab === 'settings' && (
        <form onSubmit={handleSaveSettings} className="space-y-6">
          <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-6">
            <div>
              <h2 className="text-base font-bold text-slate-900">
                {lang === 'ar' ? 'إعدادات الجدولة التلقائية وقنوات التنبيه' : 'Automated Scheduler Settings'}
              </h2>
              <p className="text-xs text-slate-500 mt-1">
                {lang === 'ar'
                  ? 'ضبط مواعيد التوليد التلقائي ومستلمي النشرة من قيادات المدرسة وحدود كشف الشذوذات'
                  : 'Configure dispatch schedule, recipients list, and anomaly detection thresholds.'}
              </p>
            </div>

            {/* Toggle Active */}
            <div className="flex items-center justify-between p-4 bg-slate-50 rounded-xl border border-slate-200">
              <div className="space-y-0.5">
                <span className="font-bold text-xs text-slate-900">
                  {lang === 'ar' ? 'تفعيل الإرسال اليومي التلقائي قبل الدوام' : 'Enable Automated Daily Dispatch'}
                </span>
                <p className="text-xs text-slate-500">
                  {lang === 'ar'
                    ? 'إرسال النشرة الصباحية آلياً في الموعد المحدد لكافة المستلمين المعتمدين.'
                    : 'Dispatches morning digest email automatically before the school bell.'}
                </p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={formConfig.enabled}
                  onChange={(e) => setFormConfig({ ...formConfig, enabled: e.target.checked })}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-slate-200 peer-focus:outline-hidden rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-600"></div>
              </label>
            </div>

            {/* Schedule Time Picker & Days */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  {lang === 'ar' ? 'وقت الإرسال الصباحي المعتمد' : 'Scheduled Delivery Time'}
                </label>
                <select
                  value={formConfig.scheduledTime}
                  onChange={(e) => setFormConfig({ ...formConfig, scheduledTime: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 text-xs font-medium focus:ring-2 focus:ring-emerald-500 cursor-pointer"
                >
                  <option value="06:15">06:15 ص (مبكر جداً - للمدارس النائية)</option>
                  <option value="06:30">06:30 ص</option>
                  <option value="06:45">06:45 ص (الموصى به - قبل انطلاق الطابور بـ 45 دقيقة)</option>
                  <option value="07:00">07:00 ص</option>
                  <option value="07:15">07:15 ص (قبل الحصة الأولى مباشرة)</option>
                </select>
                <p className="text-[11px] text-slate-400 mt-1">
                  يضمن وصول البيانات لإدارة المدرسة قبل توافد الطلاب والطابور الصباحي.
                </p>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  {lang === 'ar' ? 'أيام العمل الأسبوعية (الإرسال النشط)' : 'Active School Days'}
                </label>
                <div className="p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-medium text-slate-700">
                  الأحد، الإثنين، الثلاثاء، الأربعاء، الخميس (أسبوع الدراسة الوزاري)
                </div>
                <p className="text-[11px] text-slate-400 mt-1">تتوقف النشرة آلياً يومي الجمعة والسبت والإجازات الرسمية.</p>
              </div>
            </div>

            {/* Recipients List Manager */}
            <div className="space-y-3 pt-2 border-t border-slate-100">
              <label className="block text-xs font-bold text-slate-800">
                {lang === 'ar'
                  ? 'قائمة المستلمين المعتمدين (قيادات المدرسة والمشرفين)'
                  : 'Authorized Administrator Recipients'}
              </label>

              {/* Add Recipient */}
              <div className="flex gap-2">
                <input
                  type="email"
                  value={newRecipientEmail}
                  onChange={(e) => setNewRecipientEmail(e.target.value)}
                  placeholder="name@andalus-school.edu.sa"
                  className="flex-1 bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 text-xs focus:ring-2 focus:ring-emerald-500"
                />
                <button
                  type="button"
                  onClick={handleAddRecipient}
                  className="flex items-center gap-1 bg-slate-900 hover:bg-slate-800 text-white px-4 py-2 rounded-lg text-xs font-bold cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>{lang === 'ar' ? 'إضافة مستلم' : 'Add'}</span>
                </button>
              </div>

              {/* List */}
              <div className="space-y-2">
                {formConfig.recipients.map((email) => (
                  <div
                    key={email}
                    className="flex items-center justify-between p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-xs"
                  >
                    <div className="flex items-center gap-2">
                      <Mail className="w-3.5 h-3.5 text-slate-500" />
                      <span className="font-semibold text-slate-800">{email}</span>
                      {email.includes('principal') && (
                        <span className="bg-emerald-100 text-emerald-800 text-[10px] px-2 py-0.2 rounded font-bold">
                          مدير المدرسة
                        </span>
                      )}
                      {email.includes('counselor') && (
                        <span className="bg-sky-100 text-sky-800 text-[10px] px-2 py-0.2 rounded font-bold">
                          الموجه الطلابي
                        </span>
                      )}
                    </div>
                    {formConfig.recipients.length > 1 && (
                      <button
                        type="button"
                        onClick={() => handleRemoveRecipient(email)}
                        className="text-red-500 hover:text-red-700 p-1 cursor-pointer"
                        title="حذف"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Detection Thresholds */}
            <div className="space-y-3 pt-2 border-t border-slate-100">
              <h3 className="text-xs font-bold text-slate-800">
                {lang === 'ar' ? 'معايير وحساسية رصد الشذوذات والغياب المتكرر' : 'Anomaly Sensitivity & Thresholds'}
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="bg-slate-50 p-3 rounded-lg border border-slate-200 space-y-1">
                  <span className="text-[11px] font-semibold text-slate-600">حد الغياب الحرج (أيام)</span>
                  <input
                    type="number"
                    min="3"
                    max="10"
                    value={formConfig.chronicAbsenceThreshold}
                    onChange={(e) =>
                      setFormConfig({ ...formConfig, chronicAbsenceThreshold: parseInt(e.target.value) || 5 })
                    }
                    className="w-full bg-white border border-slate-300 rounded px-2 py-1 text-xs font-bold"
                  />
                  <p className="text-[10px] text-slate-400">إدراج الطالب ضمن القائمة الحرجة للنشرة</p>
                </div>

                <div className="bg-slate-50 p-3 rounded-lg border border-slate-200 space-y-1">
                  <span className="text-[11px] font-semibold text-slate-600">حد الغياب المتتالي (أيام)</span>
                  <input
                    type="number"
                    min="1"
                    max="5"
                    value={formConfig.consecutiveAbsenceDaysThreshold}
                    onChange={(e) =>
                      setFormConfig({
                        ...formConfig,
                        consecutiveAbsenceDaysThreshold: parseInt(e.target.value) || 2,
                      })
                    }
                    className="w-full bg-white border border-slate-300 rounded px-2 py-1 text-xs font-bold"
                  />
                  <p className="text-[10px] text-slate-400">تنبيه الغياب المتوالي دون إشعار</p>
                </div>

                <div className="bg-slate-50 p-3 rounded-lg border border-slate-200 space-y-1">
                  <span className="text-[11px] font-semibold text-slate-600">نسبة قفزة غياب الشعبة (%)</span>
                  <input
                    type="number"
                    min="10"
                    max="50"
                    value={formConfig.anomalySpikePercentage}
                    onChange={(e) =>
                      setFormConfig({ ...formConfig, anomalySpikePercentage: parseInt(e.target.value) || 25 })
                    }
                    className="w-full bg-white border border-slate-300 rounded px-2 py-1 text-xs font-bold"
                  />
                  <p className="text-[10px] text-slate-400">رصد شذوذ الشعبة إذا تجاوزت النسبة</p>
                </div>
              </div>
            </div>

            {/* Additional Features Toggle */}
            <div className="space-y-3 pt-2 border-t border-slate-100">
              <div className="flex items-center justify-between">
                <div>
                  <span className="font-bold text-xs text-slate-800">
                    تضمين التحليل التنفيذي للذكاء الاصطناعي (Gemini Briefing)
                  </span>
                  <p className="text-[11px] text-slate-500">
                    صياغة موجز تنفيذي يحدد الأولويات الثلاث العاجلة قبل الحصة الأولى.
                  </p>
                </div>
                <input
                  type="checkbox"
                  checked={formConfig.includeGeminiBriefing}
                  onChange={(e) => setFormConfig({ ...formConfig, includeGeminiBriefing: e.target.checked })}
                  className="w-4 h-4 text-emerald-600 rounded cursor-pointer"
                />
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <span className="font-bold text-xs text-slate-800">
                    إرسال إشعار SMS/WhatsApp ملخص لهاتف مدير المدرسة
                  </span>
                  <p className="text-[11px] text-slate-500">
                    إشعار سريع بالرقم المباشر لمدير المدرسة يحتوي رابط النشرة الصباحية.
                  </p>
                </div>
                <input
                  type="checkbox"
                  checked={formConfig.notifyViaWhatsAppToo}
                  onChange={(e) => setFormConfig({ ...formConfig, notifyViaWhatsAppToo: e.target.checked })}
                  className="w-4 h-4 text-emerald-600 rounded cursor-pointer"
                />
              </div>
            </div>

            <div className="pt-4 border-t border-slate-100 flex justify-end">
              <button
                type="submit"
                className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs px-6 py-2.5 rounded-xl shadow-xs transition-colors cursor-pointer"
              >
                {lang === 'ar' ? 'حفظ وتطبيق إعدادات النشرة' : 'Save Scheduler Settings'}
              </button>
            </div>
          </div>
        </form>
      )}

      {/* SUB-TAB 4: DISPATCH HISTORY */}
      {activeSubTab === 'history' && (
        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div>
              <h2 className="text-base font-bold text-slate-900">
                {lang === 'ar' ? 'سجل النشرات الصباحية المرسلة' : 'Daily Digest Dispatch Log'}
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                {lang === 'ar'
                  ? 'أرشيف كامل لكافة النشرات والتقارير الصباحية المرسلة لقيادات المدرسة مع إحصائيات التسليم'
                  : 'Historical audit log of all delivered morning digest briefings.'}
              </p>
            </div>
            <span className="text-xs font-mono bg-slate-100 text-slate-700 px-2.5 py-1 rounded-md">
              {digestHistory.length} نشرة مرسلة
            </span>
          </div>

          {digestHistory.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full text-right text-xs">
                <thead className="bg-slate-50 text-slate-700 font-semibold border-b border-slate-200">
                  <tr>
                    <th className="py-3 px-3">التاريخ والوقت</th>
                    <th className="py-3 px-3">الموضوع</th>
                    <th className="py-3 px-3">المستلمون</th>
                    <th className="py-3 px-3">الشذوذات</th>
                    <th className="py-3 px-3">الأعذار المعلقة</th>
                    <th className="py-3 px-3">الحالات الحرجة</th>
                    <th className="py-3 px-3">الحالة</th>
                    <th className="py-3 px-3 text-center">الإجراء</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {digestHistory.map((item) => (
                    <tr key={item.id} className="hover:bg-slate-50/70">
                      <td className="py-3 px-3">
                        <div className="font-bold text-slate-900">{item.date}</div>
                        <div className="text-[11px] text-slate-400 font-mono">
                          {new Date(item.dispatchedAt).toLocaleTimeString('ar-SA', {
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </div>
                      </td>
                      <td className="py-3 px-3 max-w-xs truncate font-medium text-slate-800">{item.subject}</td>
                      <td className="py-3 px-3 text-slate-600">
                        <span className="font-semibold text-slate-900">{item.recipients.length} قيادي</span>
                      </td>
                      <td className="py-3 px-3 font-bold text-red-600">{item.anomaliesCount}</td>
                      <td className="py-3 px-3 font-bold text-sky-600">{item.pendingJustificationsCount}</td>
                      <td className="py-3 px-3 font-bold text-amber-600">{item.highRiskStudentsCount}</td>
                      <td className="py-3 px-3">
                        <span className="bg-emerald-100 text-emerald-800 font-bold text-[10px] px-2 py-0.5 rounded-full inline-flex items-center gap-1">
                          <Check className="w-3 h-3 text-emerald-600" />
                          <span>{item.status === 'delivered' ? 'تم التسليم' : 'محاكاة ناجحة'}</span>
                        </span>
                      </td>
                      <td className="py-3 px-3 text-center">
                        <button
                          onClick={() => setSelectedHistoryItem(item)}
                          className="bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-xs px-2.5 py-1 rounded-md transition-colors cursor-pointer"
                        >
                          عرض
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="p-8 text-center bg-slate-50 rounded-xl text-slate-500 text-xs">
              لم يتم إرسال أي نشرات بعد. يمكنك النقر على &quot;إرسال النشرة الصباحية الآن&quot; لتسجيل أول عملية إرسال.
            </div>
          )}
        </div>
      )}

      {/* History Item Modal */}
      {selectedHistoryItem && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-3xl w-full max-h-[85vh] flex flex-col shadow-2xl overflow-hidden">
            <div className="px-6 py-4 bg-slate-900 text-white flex items-center justify-between">
              <div>
                <h3 className="font-bold text-sm">أرشيف النشرة الصباحية - {selectedHistoryItem.date}</h3>
                <p className="text-xs text-slate-300">أُرسلت إلى: {selectedHistoryItem.recipients.join('، ')}</p>
              </div>
              <button
                onClick={() => setSelectedHistoryItem(null)}
                className="text-slate-400 hover:text-white text-lg font-bold p-1 cursor-pointer"
              >
                ✕
              </button>
            </div>
            <div className="p-6 overflow-y-auto flex-1">
              {selectedHistoryItem.htmlContent ? (
                <div
                  dangerouslySetInnerHTML={{ __html: selectedHistoryItem.htmlContent }}
                  className="email-render-container"
                />
              ) : (
                <div className="text-xs text-slate-500">لا يتوفر كود البريد لهذه النشرة.</div>
              )}
            </div>
            <div className="p-4 bg-slate-50 border-t border-slate-200 flex justify-end">
              <button
                onClick={() => setSelectedHistoryItem(null)}
                className="bg-slate-800 text-white text-xs font-bold px-4 py-2 rounded-lg cursor-pointer"
              >
                إغلاق
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

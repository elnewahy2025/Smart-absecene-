import React, { useState, useEffect } from 'react';
import { useAttendance } from '../context/AttendanceContext';
import { DailyEmailDigestItem } from '../types/attendance';
import {
  Mail,
  Clock,
  Sparkles,
  CheckCircle2,
  Send,
  Settings,
  History,
  Eye,
  RefreshCw,
} from 'lucide-react';
import { DigestOverviewTab } from './digest/DigestOverviewTab';
import { DigestEmailPreviewTab } from './digest/DigestEmailPreviewTab';
import { DigestSchedulerSettingsTab } from './digest/DigestSchedulerSettingsTab';
import { DigestHistoryTab } from './digest/DigestHistoryTab';

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
        <DigestOverviewTab
          currentDigest={currentDigest}
          loading={loading}
          currentTenant={currentTenant}
          lang={lang}
          onNavigateToTab={onNavigateToTab}
        />
      )}

      {/* SUB-TAB 2: EMAIL PREVIEW */}
      {activeSubTab === 'email_preview' && (
        <DigestEmailPreviewTab
          currentDigest={currentDigest}
          digestConfig={digestConfig}
          dispatching={dispatching}
          previewDevice={previewDevice}
          copiedHtml={copiedHtml}
          onSetPreviewDevice={setPreviewDevice}
          onCopyHtml={handleCopyHtml}
          onSendDigestNow={handleSendDigestNow}
          lang={lang}
        />
      )}

      {/* SUB-TAB 3: SCHEDULER & RECIPIENTS SETTINGS */}
      {activeSubTab === 'settings' && (
        <DigestSchedulerSettingsTab
          formConfig={formConfig}
          newRecipientEmail={newRecipientEmail}
          onFormConfigChange={setFormConfig}
          onNewRecipientEmailChange={setNewRecipientEmail}
          onAddRecipient={handleAddRecipient}
          onRemoveRecipient={handleRemoveRecipient}
          onSaveSettings={handleSaveSettings}
          lang={lang}
        />
      )}

      {/* SUB-TAB 4: DISPATCH HISTORY */}
      {activeSubTab === 'history' && (
        <DigestHistoryTab
          digestHistory={digestHistory}
          selectedHistoryItem={selectedHistoryItem}
          onSelectHistoryItem={setSelectedHistoryItem}
          lang={lang}
        />
      )}
    </div>
  );
};

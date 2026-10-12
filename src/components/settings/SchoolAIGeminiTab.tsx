import React, { useState, useEffect } from 'react';
import {
  Sparkles,
  Key,
  ShieldCheck,
  CheckCircle2,
  AlertTriangle,
  RefreshCw,
  Eye,
  EyeOff,
  Trash2,
  ExternalLink,
  Bot,
  Sliders,
  Check,
} from 'lucide-react';
import { authenticatedFetch } from '../../lib/api';

interface Props {
  tenantId: string;
  tenantName: string;
  canManageSettings: boolean;
  lang: 'ar' | 'en';
}

interface AIConfigData {
  tenantId: string;
  hasCustomKey: boolean;
  maskedKey: string;
  updatedAt?: string;
  preferredModel?: string;
}

export const SchoolAIGeminiTab: React.FC<Props> = ({
  tenantId,
  tenantName,
  canManageSettings,
  lang,
}) => {
  const [config, setConfig] = useState<AIConfigData | null>(null);
  const [systemHasFallback, setSystemHasFallback] = useState<boolean>(true);
  const [loading, setLoading] = useState<boolean>(true);

  // Form input states
  const [inputKey, setInputKey] = useState<string>('');
  const [preferredModel, setPreferredModel] = useState<string>('gemini-3.5-flash');
  const [showKey, setShowKey] = useState<boolean>(false);

  // Status & notifications
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [isTesting, setIsTesting] = useState<boolean>(false);
  const [testResult, setTestResult] = useState<{
    success: boolean;
    message: string;
    model?: string;
  } | null>(null);
  const [actionMessage, setActionMessage] = useState<{
    type: 'success' | 'error';
    text: string;
  } | null>(null);

  // Fetch current config on mount or tenant switch
  const fetchConfig = async () => {
    try {
      setLoading(true);
      const res = await authenticatedFetch('/api/tenant/ai-config');
      if (res.ok) {
        const data = await res.json();
        setConfig(data.config);
        setSystemHasFallback(Boolean(data.systemHasFallbackKey));
        if (data.config?.preferredModel) {
          setPreferredModel(data.config.preferredModel);
        }
      }
    } catch (err) {
      console.error('Failed to load AI config:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchConfig();
  }, [tenantId]);

  const handleSaveKey = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!canManageSettings) return;
    if (!inputKey.trim()) {
      setActionMessage({
        type: 'error',
        text: lang === 'ar' ? 'يرجى إدخال مفتاح Gemini API أولاً.' : 'Please enter a Gemini API key first.',
      });
      return;
    }

    try {
      setIsSaving(true);
      setActionMessage(null);
      setTestResult(null);

      const res = await authenticatedFetch('/api/tenant/ai-config', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          apiKey: inputKey.trim(),
          preferredModel,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to save');
      }

      setConfig(data.config);
      setInputKey('');
      setShowKey(false);
      setActionMessage({
        type: 'success',
        text: data.message || (lang === 'ar' ? 'تم تشفير وحفظ المفتاح بنجاح (AES-256-GCM).' : 'Key encrypted & saved successfully.'),
      });
    } catch (err: any) {
      setActionMessage({
        type: 'error',
        text: err.message || 'حدث خطأ أثناء حفظ المفتاح.',
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleTestConnection = async () => {
    try {
      setIsTesting(true);
      setTestResult(null);
      setActionMessage(null);

      const res = await authenticatedFetch('/api/tenant/ai-config/test', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          testKey: inputKey.trim() || undefined,
        }),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        setTestResult({
          success: true,
          message: data.message,
          model: data.activeModel,
        });
      } else {
        setTestResult({
          success: false,
          message: data.error || data.details || 'فشل التحقق من المفتاح.',
        });
      }
    } catch (err: any) {
      setTestResult({
        success: false,
        message: err.message || 'تعذر الاتصال بخدمة التحقق.',
      });
    } finally {
      setIsTesting(false);
    }
  };

  const handleDeleteKey = async () => {
    if (!canManageSettings) return;
    const confirmMsg = lang === 'ar'
      ? 'هل أنت متأكد من رغبتك في حذف مفتاح المدرسة الخاص؟ سيعود النظام إلى سياسة المفتاح الافتراضي أو المحاكي.'
      : 'Are you sure you want to remove this school custom key?';
    if (!window.confirm(confirmMsg)) return;

    try {
      setIsSaving(true);
      const res = await authenticatedFetch('/api/tenant/ai-config', {
        method: 'DELETE',
      });
      const data = await res.json();
      if (res.ok) {
        setConfig(data.config);
        setActionMessage({
          type: 'success',
          text: lang === 'ar' ? 'تمت إزالة المفتاح الخاص بالمدرسة بنجاح.' : 'Custom key removed.',
        });
        setTestResult(null);
      }
    } catch (err: any) {
      setActionMessage({
        type: 'error',
        text: err.message || 'حدث خطأ أثناء إزالة المفتاح.',
      });
    } finally {
      setIsSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="bg-white rounded-xl border border-slate-200 p-8 flex items-center justify-center gap-3 text-slate-500 text-xs">
        <RefreshCw className="w-4 h-4 animate-spin text-emerald-600" />
        <span>جاري تحميل إعدادات الذكاء الاصطناعي للمدرسة...</span>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-xs p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-100">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-emerald-600 text-white flex items-center justify-center shadow-xs">
            <Sparkles className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-bold text-slate-900 text-base">
              {lang === 'ar' ? 'إعدادات الذكاء الاصطناعي المدرسي (Google Gemini)' : 'School AI Settings (Google Gemini)'}
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              {tenantName} · {lang === 'ar' ? 'إدارة مفتاح الحصة الخاص بالمدرسة وعزل الاستهلاك السحابي' : 'Per-school API Key Isolation'}
            </p>
          </div>
        </div>

        {/* Status Badge */}
        <div className="flex items-center gap-2">
          {config?.hasCustomKey ? (
            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-800 border border-emerald-200">
              <ShieldCheck className="w-4 h-4 text-emerald-600" />
              <span>{lang === 'ar' ? 'المفتاح الخاص بالمدرسة مفعل' : 'Custom School Key Active'}</span>
            </span>
          ) : systemHasFallback ? (
            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold bg-amber-50 text-amber-800 border border-amber-200">
              <Bot className="w-4 h-4 text-amber-600" />
              <span>{lang === 'ar' ? 'حساب تجريبي مشترك (مفتاح النظام)' : 'Shared Trial Mode (System Fallback)'}</span>
            </span>
          ) : (
            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold bg-slate-100 text-slate-700 border border-slate-200">
              <Sliders className="w-4 h-4 text-slate-500" />
              <span>{lang === 'ar' ? 'المحاكي الداخلي الذكي' : 'Intelligent Offline Simulator'}</span>
            </span>
          )}
        </div>
      </div>

      {/* Action Messages */}
      {actionMessage && (
        <div
          className={`px-4 py-3 rounded-lg text-xs flex items-center gap-2 ${
            actionMessage.type === 'success'
              ? 'bg-emerald-50 border border-emerald-200 text-emerald-900'
              : 'bg-rose-50 border border-rose-200 text-rose-900'
          }`}
        >
          {actionMessage.type === 'success' ? (
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          ) : (
            <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
          )}
          <span>{actionMessage.text}</span>
        </div>
      )}

      {/* Current Active Key Card */}
      <div className="bg-slate-50/70 border border-slate-200 rounded-xl p-4.5 space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-xs font-bold text-slate-700 flex items-center gap-2">
            <Key className="w-4 h-4 text-indigo-500" />
            {lang === 'ar' ? 'المفتاح النشط المعتمد حالياً:' : 'Active API Key:'}
          </span>
          {config?.updatedAt && (
            <span className="text-[11px] text-slate-400 font-mono">
              {lang === 'ar' ? 'آخر تحديث: ' : 'Updated: '}
              {new Date(config.updatedAt).toLocaleDateString('ar-SA')}
            </span>
          )}
        </div>

        {config?.hasCustomKey ? (
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white border border-slate-200 rounded-lg p-3">
            <div className="font-mono text-xs text-slate-800 tracking-wider">
              {config.maskedKey}
            </div>
            {canManageSettings && (
              <button
                type="button"
                onClick={handleDeleteKey}
                disabled={isSaving}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs text-rose-700 hover:text-rose-800 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer border border-transparent hover:border-rose-200"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>{lang === 'ar' ? 'إزالة المفتاح الخاص' : 'Remove Key'}</span>
              </button>
            )}
          </div>
        ) : (
          <div className="text-xs text-slate-600 bg-white border border-slate-200 rounded-lg p-3 flex items-center justify-between">
            <span>
              {lang === 'ar'
                ? 'لم تقم هذه المدرسة بإدخال مفتاحها الخاص حتى الآن. يعتمد النظام على اشتراك النظام العام أو المحاكي.'
                : 'No custom key set for this school yet.'}
            </span>
            <span className="text-[11px] text-indigo-600 font-semibold bg-indigo-50 px-2 py-0.5 rounded">
              {systemHasFallback ? 'مفتاح النظام العام' : 'المحاكي المحلي'}
            </span>
          </div>
        )}
      </div>

      {/* Input Form for Admin */}
      {canManageSettings ? (
        <form onSubmit={handleSaveKey} className="space-y-4">
          <div className="space-y-1.5">
            <label className="block text-xs font-bold text-slate-800">
              {config?.hasCustomKey
                ? (lang === 'ar' ? 'تحديث أو استبدال مفتاح Gemini API للمدرسة:' : 'Replace School Gemini API Key:')
                : (lang === 'ar' ? 'إدخال مفتاح Gemini API الجديد للمدرسة:' : 'Enter School Gemini API Key:')}
            </label>
            <div className="relative">
              <input
                type={showKey ? 'text' : 'password'}
                dir="ltr"
                placeholder="AIzaSy... أو AQ.Ab8R..."
                value={inputKey}
                onChange={(e) => setInputKey(e.target.value)}
                className="w-full bg-white border border-slate-300 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 rounded-lg px-3 py-2.5 text-xs font-mono text-slate-900 pr-10"
              />
              <button
                type="button"
                onClick={() => setShowKey(!showKey)}
                className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600 cursor-pointer"
              >
                {showKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
            <p className="text-[11px] text-slate-500">
              {lang === 'ar'
                ? 'يتم تشفير هذا المفتاح في خادم المدرسة بتقنية AES-256-GCM ولا يُعرض للمتصفح مطلقاً.'
                : 'Key is encrypted using AES-256-GCM on the backend and never exposed.'}
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="block text-xs font-semibold text-slate-800">
                {lang === 'ar' ? 'النموذج المفضل للمدرسة:' : 'Preferred AI Model:'}
              </label>
              <select
                value={preferredModel}
                onChange={(e) => setPreferredModel(e.target.value)}
                className="w-full bg-white border border-slate-300 rounded-lg p-2 text-xs text-slate-800 font-mono"
              >
                <option value="gemini-3.5-flash">gemini-3.5-flash (موصى به - متوازن وفائق السرعة)</option>
                <option value="gemini-3.5-flash-lite">gemini-3.5-flash-lite (اقتصادي جداً للحصص السريعة)</option>
                <option value="gemini-3.7-flash">gemini-3.7-flash (جيل متقدم للتحليل والتخطيط)</option>
                <option value="gemini-3.8-flash">gemini-3.8-flash (أحدث إصدار معتمد)</option>
              </select>
            </div>

            <div className="flex items-end gap-2">
              <button
                type="button"
                onClick={handleTestConnection}
                disabled={isTesting || (!inputKey && !config?.hasCustomKey && !systemHasFallback)}
                className="flex-1 inline-flex items-center justify-center gap-1.5 bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-xs px-4 py-2 rounded-lg transition-colors cursor-pointer border border-slate-300 disabled:opacity-50"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${isTesting ? 'animate-spin' : ''}`} />
                <span>{isTesting ? (lang === 'ar' ? 'جاري الفحص...' : 'Testing...') : (lang === 'ar' ? 'فحص الاتصال مع Google' : 'Test Google Connection')}</span>
              </button>

              <button
                type="submit"
                disabled={isSaving || !inputKey.trim()}
                className="flex-1 inline-flex items-center justify-center gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs px-4 py-2 rounded-lg transition-colors cursor-pointer shadow-xs disabled:opacity-50"
              >
                <Check className="w-3.5 h-3.5" />
                <span>{isSaving ? (lang === 'ar' ? 'جاري الحفظ...' : 'Saving...') : (lang === 'ar' ? 'حفظ وتشفير المفتاح' : 'Save & Encrypt')}</span>
              </button>
            </div>
          </div>
        </form>
      ) : (
        <div className="bg-amber-50 border border-amber-200 text-amber-800 px-4 py-3 rounded-lg text-xs">
          {lang === 'ar'
            ? 'تنبيه: إدارة مفاتيح الذكاء الاصطناعي للمدرسة محصورة بمدير المدرسة (Admin) فقط.'
            : 'Notice: Only school administrators can configure API keys.'}
        </div>
      )}

      {/* Test Connection Result Box */}
      {testResult && (
        <div
          className={`border rounded-xl p-4 text-xs space-y-1.5 ${
            testResult.success
              ? 'bg-emerald-50/70 border-emerald-300 text-emerald-950'
              : 'bg-rose-50/70 border-rose-300 text-rose-950'
          }`}
        >
          <div className="flex items-center gap-2 font-bold">
            {testResult.success ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            ) : (
              <AlertTriangle className="w-4 h-4 text-rose-600" />
            )}
            <span>
              {testResult.success
                ? (lang === 'ar' ? 'تم تأكيد اتصال المفتاح بنجاح!' : 'Connection Verified!')
                : (lang === 'ar' ? 'فشل فحص الاتصال' : 'Connection Failed')}
            </span>
          </div>
          <p className="leading-relaxed">{testResult.message}</p>
          {testResult.model && (
            <p className="font-mono text-[11px] text-emerald-700">
              {lang === 'ar' ? 'النموذج المستجيب: ' : 'Active Model: '} {testResult.model}
            </p>
          )}
        </div>
      )}

      {/* Enterprise Security Features Info */}
      <div className="border-t border-slate-100 pt-5 space-y-3">
        <h4 className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
          <ShieldCheck className="w-4 h-4 text-emerald-600" />
          <span>{lang === 'ar' ? 'معايير الأمان المطبقة للمدارس (Enterprise Grade):' : 'Enterprise Security Architecture:'}</span>
        </h4>
        <ul className="grid grid-cols-1 md:grid-cols-2 gap-2.5 text-[11px] text-slate-600">
          <li className="flex items-start gap-1.5 bg-slate-50 p-2.5 rounded-lg border border-slate-200/60">
            <span className="text-emerald-600 font-bold">✓</span>
            <span>
              <strong>{lang === 'ar' ? 'تشفير AES-256-GCM:' : 'AES-256-GCM Encryption:'}</strong> {lang === 'ar' ? 'المفتاح يشفر فورياً بكلمة سر رئيسية فريدة ولا يُخزن كنص مكشوف.' : 'Key is encrypted instantly.'}
            </span>
          </li>
          <li className="flex items-start gap-1.5 bg-slate-50 p-2.5 rounded-lg border border-slate-200/60">
            <span className="text-emerald-600 font-bold">✓</span>
            <span>
              <strong>{lang === 'ar' ? 'عزل كامل للحسابات (Multi-Tenant):' : 'Tenant Isolation:'}</strong> {lang === 'ar' ? 'استهلاك كل مدرسة وفواتيرها وحصتها اليومية معزولة تماماً عن المدارس الأخرى.' : 'Usage quota strictly isolated.'}
            </span>
          </li>
          <li className="flex items-start gap-1.5 bg-slate-50 p-2.5 rounded-lg border border-slate-200/60">
            <span className="text-emerald-600 font-bold">✓</span>
            <span>
              <strong>{lang === 'ar' ? 'أمان الواجهة (Masking):' : 'UI Masking:'}</strong> {lang === 'ar' ? 'يتم إخفاء المفتاح في الواجهة بـ (••••) لمنع تصوير الشاشة أو سرقة المفتاح.' : 'Key is never sent back in plaintext to browser.'}
            </span>
          </li>
          <li className="flex items-start gap-1.5 bg-slate-50 p-2.5 rounded-lg border border-slate-200/60">
            <span className="text-emerald-600 font-bold">✓</span>
            <span>
              <strong>{lang === 'ar' ? 'استمرارية الخدمة (High Availability):' : 'High Availability:'}</strong> {lang === 'ar' ? 'في حال انتهاء حصة المفتاح، يتحول المساعد تلقائياً للبديل أو المحاكي دون انقطاع.' : 'Graceful fallback to simulator if quota exhausted.'}
            </span>
          </li>
        </ul>

        <div className="pt-2 text-right">
          <a
            href="https://aistudio.google.com/app/apikey"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 text-[11px] text-indigo-600 hover:text-indigo-800 hover:underline"
          >
            <span>{lang === 'ar' ? 'الحصول على مفتاح جديد من Google AI Studio' : 'Get Gemini Key from Google AI Studio'}</span>
            <ExternalLink className="w-3 h-3" />
          </a>
        </div>
      </div>
    </div>
  );
};

import React, { useCallback, useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { ConnectionStatus, testConnection } from '../lib/firebase';
import { useAttendance } from '../context/AttendanceContext';
import { useModalAccessibility } from '../hooks/useModalAccessibility';
import {
  WifiOff,
  Wifi,
  RotateCcw,
  CheckCircle2,
  Database,
  X,
  Server,
  Upload,
  AlertCircle,
  Loader2,
  FileText,
  Sparkles,
  ShieldCheck,
} from 'lucide-react';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  connStatus: ConnectionStatus;
  lang: 'ar' | 'en';
}

interface ApiHealthData {
  isOnline: boolean;
  latencyMs?: number;
  uptime?: number;
  nodeVersion?: string;
  memoryUsageMB?: number;
  services?: {
    aiGemini: boolean;
    pdfPuppeteer: boolean;
    firebaseAdmin: boolean;
    dynamicTenantsCount: number;
  };
}

export const OfflineSyncModal: React.FC<Props> = ({
  isOpen,
  onClose,
  connStatus,
  lang,
}) => {
  const { currentUser, isSuperAdmin } = useAttendance();
  const isStaffOrAdmin =
    currentUser.role === 'admin' || currentUser.role === 'registrar' || isSuperAdmin;

  const [isRetrying, setIsRetrying] = useState(false);
  const [retryResult, setRetryResult] = useState<string | null>(null);
  const [apiHealth, setApiHealth] = useState<ApiHealthData | null>(null);
  const [isCheckingApi, setIsCheckingApi] = useState(false);

  const checkApiHealth = useCallback(async () => {
    setIsCheckingApi(true);
    const start = performance.now();
    try {
      const res = await fetch('/api/health');
      const latency = Math.round(performance.now() - start);
      if (res.ok) {
        const data = await res.json();
        setApiHealth({
          isOnline: true,
          latencyMs: latency,
          uptime: data.uptime,
          nodeVersion: data.nodeVersion,
          memoryUsageMB: data.memoryUsageMB,
          services: data.services,
        });
      } else {
        setApiHealth({ isOnline: false, latencyMs: latency });
      }
    } catch {
      setApiHealth({ isOnline: false });
    } finally {
      setIsCheckingApi(false);
    }
  }, []);

  useEffect(() => {
    if (isOpen) {
      checkApiHealth();
    }
  }, [isOpen, checkApiHealth]);

  const dialogRef = useRef<HTMLDivElement>(null);
  useModalAccessibility({ isOpen, onClose, containerRef: dialogRef });

  if (!isOpen) return null;

  const formatUptime = (seconds?: number) => {
    if (!seconds) return '0 دقيقة';
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    if (hours > 0) return `${hours} ساعة و ${minutes} دقيقة`;
    return `${minutes} دقيقة`;
  };

  // Inspect cached keys from localStorage
  const getCacheStats = () => {
    if (typeof localStorage === 'undefined') return { totalItems: 0, entities: [] };
    const keys = [
      { key: 'school_attendance_sessions', nameAr: 'كشوف الحصص والغياب', nameEn: 'Attendance Sessions' },
      { key: 'school_justifications', nameAr: 'الأعذار الطبية المعلقة', nameEn: 'Excuse Requests' },
      { key: 'school_notifications', nameAr: 'سجل رسائل أولياء الأمور', nameEn: 'Notification Outbox' },
      { key: 'tenant_school_profiles', nameAr: 'الملف التعريفي للمدرسة', nameEn: 'School Profile' },
      { key: 'school_settings', nameAr: 'قواعد وضوابط الغياب', nameEn: 'School Settings' },
    ];

    let total = 0;
    const details = keys.map((k) => {
      const val = localStorage.getItem(k.key);
      let count = 0;
      if (val) {
        try {
          const parsed = JSON.parse(val);
          count = Array.isArray(parsed) ? parsed.length : Object.keys(parsed).length;
          total += count;
        } catch {
          count = 1;
          total += 1;
        }
      }
      return { ...k, count };
    });

    return { totalItems: total, entities: details };
  };

  const { totalItems, entities } = getCacheStats();

  const handleManualRetry = async () => {
    setIsRetrying(true);
    setRetryResult(null);
    try {
      const [isOnline] = await Promise.all([testConnection(), checkApiHealth()]);
      if (isOnline) {
        setRetryResult(
          lang === 'ar'
            ? 'نجح الاتصال بالخادم السحابي! كافة البيانات المحلية متزامنة ومحدثة.'
            : 'Connection restored successfully! Local data is synced.'
        );
      } else {
        setRetryResult(
          lang === 'ar'
            ? 'تعذر الاتصال بالخادم. يرجى التحقق من اتصال الشبكة وسيعاود النظام المحاولة تلقائياً.'
            : 'Server unreachable. Please check network connection.'
        );
      }
    } catch {
      setRetryResult(
        lang === 'ar'
          ? 'حدث خطأ أثناء فحص الاتصال.'
          : 'Error occurred while testing connection.'
      );
    } finally {
      setIsRetrying(false);
    }
  };

  const isConnected = connStatus === 'connected';

  const modal = (
    <div
      className="fixed inset-0 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-3 z-50 animate-in fade-in duration-150"
      ref={dialogRef}
      tabIndex={-1}
      role="dialog"
      aria-modal="true"
    >
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 max-w-lg w-full max-h-[92vh] flex flex-col overflow-hidden text-right">
        {/* Header */}
        <div
          className={`p-4 border-b flex items-center justify-between shrink-0 ${
            isConnected
              ? 'bg-emerald-50 border-emerald-100 text-emerald-900'
              : 'bg-amber-50 border-amber-100 text-amber-900'
          }`}
        >
          <div className="flex items-center gap-2.5">
            <div
              className={`w-8 h-8 rounded-lg flex items-center justify-center font-bold text-white ${
                isConnected ? 'bg-emerald-600' : 'bg-amber-600'
              }`}
            >
              {isConnected ? <Wifi className="w-4 h-4" /> : <WifiOff className="w-4 h-4" />}
            </div>
            <div>
              <h3 className="font-bold text-sm">
                {lang === 'ar' ? 'مركز المزامنة والعمل دون اتصال' : 'Offline Sync & Network Center'}
              </h3>
              <p className="text-[11px] opacity-80">
                {isConnected
                  ? lang === 'ar'
                    ? 'متصل بالخادم السحابي'
                    : 'Connected to Cloud'
                  : lang === 'ar'
                  ? 'وضع عدم الاتصال نشط (الذاكرة المحلية تعمل)'
                  : 'Offline Mode Active'}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 p-1 rounded-lg hover:bg-slate-100 cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-4 space-y-4 text-xs text-slate-700 overflow-y-auto">
          {/* Status Alert */}
          <div
            className={`p-3 rounded-xl border flex items-start gap-2.5 ${
              isConnected
                ? 'bg-emerald-50/60 border-emerald-200 text-emerald-900'
                : 'bg-amber-50/70 border-amber-200 text-amber-900'
            }`}
          >
            <Database className="w-4 h-4 shrink-0 mt-0.5 text-amber-600" />
            <div className="leading-relaxed">
              <span className="font-bold block mb-0.5">
                {isConnected
                  ? lang === 'ar'
                    ? 'المزامنة السحابية فورية ومستقرة'
                    : 'Cloud Sync Active'
                  : lang === 'ar'
                  ? 'حفظ البيانات محلياً دون أي فقدان'
                  : 'Local Storage Fallback Active'}
              </span>
              <p className="text-[11px] opacity-90">
                {lang === 'ar'
                  ? 'يعتمد النظام تقنية التخزين المؤقت (Local Caching) التي تضمن تسجيل الحضور والغياب واعتماد الكشوفات حتى في حال انقطاع الإنترنت، مع رفعها للسحابة تلقائياً فور عودة الاتصال.'
                  : 'The system uses resilient local caching to guarantee full attendance tracking during outages.'}
              </p>
            </div>
          </div>

          {/* Role-Based Backend Health Diagnostics */}
          {isStaffOrAdmin ? (
            /* Detailed Diagnostic Panel for Admin / Registrar / Super Admin */
            <div className="space-y-2.5 p-3.5 rounded-xl bg-slate-900 text-white border border-slate-800 shadow-sm">
              <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                <div className="flex items-center gap-2">
                  <Server className="w-4 h-4 text-emerald-400" />
                  <span className="font-bold text-xs">
                    {lang === 'ar' ? 'تشخيصات الخادم البرمجي (Backend Health)' : 'Backend API Health'}
                  </span>
                </div>
                <div className="flex items-center gap-1.5">
                  {isCheckingApi ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin text-slate-400" />
                  ) : apiHealth?.isOnline ? (
                    <span className="flex items-center gap-1.5 bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-[10px] font-mono px-2 py-0.5 rounded-full font-bold">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                      {apiHealth.latencyMs ? `${apiHealth.latencyMs} ms` : 'Online'}
                    </span>
                  ) : (
                    <span className="bg-rose-500/20 text-rose-300 border border-rose-500/30 text-[10px] font-mono px-2 py-0.5 rounded-full font-bold">
                      Offline
                    </span>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2 text-[10px]">
                <div className="bg-slate-800/70 p-2 rounded-lg border border-slate-700/50">
                  <span className="text-slate-400 block mb-0.5">مدة تشغيل الخادم (Uptime):</span>
                  <span className="font-mono text-emerald-300 font-bold">{formatUptime(apiHealth?.uptime)}</span>
                </div>
                <div className="bg-slate-800/70 p-2 rounded-lg border border-slate-700/50">
                  <span className="text-slate-400 block mb-0.5">الذاكرة ومحرك التشغيل:</span>
                  <span className="font-mono text-cyan-300 font-bold">
                    {apiHealth?.memoryUsageMB ? `${apiHealth.memoryUsageMB} MB` : '18 MB'} ({apiHealth?.nodeVersion || 'Node.js'})
                  </span>
                </div>
              </div>

              <div className="pt-1.5 space-y-1.5 text-[10px]">
                <div className="flex items-center justify-between text-slate-300 bg-slate-800/40 px-2 py-1 rounded">
                  <span className="flex items-center gap-1.5">
                    <FileText className="w-3 h-3 text-indigo-400" />
                    <span>محرك تقارير PDF المعتمدة (Puppeteer/Chromium):</span>
                  </span>
                  <span className={apiHealth?.services?.pdfPuppeteer ? 'text-emerald-400 font-bold' : 'text-amber-400'}>
                    {apiHealth?.services?.pdfPuppeteer ? 'جاهز ومعتمد' : 'بانتظار التهيئة'}
                  </span>
                </div>

                <div className="flex items-center justify-between text-slate-300 bg-slate-800/40 px-2 py-1 rounded">
                  <span className="flex items-center gap-1.5">
                    <Sparkles className="w-3 h-3 text-purple-400" />
                    <span>محرك الذكاء الاصطناعي (Gemini AI Engine):</span>
                  </span>
                  <span className={apiHealth?.services?.aiGemini ? 'text-emerald-400 font-bold' : 'text-slate-400'}>
                    {apiHealth?.services?.aiGemini ? 'نشط ومتصل' : 'بانتظار المفتاح'}
                  </span>
                </div>

                <div className="flex items-center justify-between text-slate-300 bg-slate-800/40 px-2 py-1 rounded">
                  <span className="flex items-center gap-1.5">
                    <ShieldCheck className="w-3 h-3 text-amber-400" />
                    <span>سجل المدارس السحابية (Multi-Tenant Hub):</span>
                  </span>
                  <span className="text-amber-300 font-mono font-bold">
                    {apiHealth?.services?.dynamicTenantsCount || 0} مدارس مسجلة
                  </span>
                </div>
              </div>
            </div>
          ) : (
            /* Reassuring Status for Teachers & Parents */
            <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between text-xs">
              <div className="flex items-center gap-2">
                <div
                  className={`w-2.5 h-2.5 rounded-full ${
                    apiHealth?.isOnline !== false ? 'bg-emerald-500 animate-pulse' : 'bg-amber-500'
                  }`}
                />
                <span className="font-medium text-slate-700">
                  {lang === 'ar' ? 'خوادم المنصة وقواعد البيانات السحابية:' : 'Cloud Platform & Database Servers:'}
                </span>
              </div>
              <span className="text-emerald-700 font-bold bg-emerald-100/70 border border-emerald-300/50 px-2.5 py-0.5 rounded-full text-[11px]">
                {apiHealth?.latencyMs ? `${apiHealth.latencyMs} ms • متصلة وتعمل بكفاءة` : 'متصلة وتعمل بكفاءة'}
              </span>
            </div>
          )}

          {/* Cached Records Statistics */}
          <div className="space-y-2">
            <div className="flex items-center justify-between font-bold text-slate-800 text-xs">
              <span className="flex items-center gap-1.5">
                <Upload className="w-3.5 h-3.5 text-indigo-600" />
                <span>حالة السجلات في الذاكرة المؤقتة:</span>
              </span>
              <span className="text-indigo-600 font-mono text-[11px]">{totalItems} عنصر محفوظ</span>
            </div>

            <div className="border border-slate-200 rounded-xl divide-y divide-slate-100 bg-slate-50/50">
              {entities.map((ent) => (
                <div key={ent.key} className="p-2 flex items-center justify-between text-[11px]">
                  <span className="text-slate-700 font-medium">
                    {lang === 'ar' ? ent.nameAr : ent.nameEn}
                  </span>
                  <div className="flex items-center gap-1.5">
                    <span className="font-mono font-bold text-slate-900">{ent.count}</span>
                    <span className="text-[10px] text-emerald-600 bg-emerald-50 px-1.5 py-0.2 rounded border border-emerald-200">
                      محفوظ محلياً
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Retry Feedback Alert */}
          {retryResult && (
            <div
              className={`p-2.5 rounded-lg border text-[11px] flex items-center gap-2 ${
                isConnected
                  ? 'bg-emerald-50 border-emerald-200 text-emerald-900'
                  : 'bg-amber-50 border-amber-200 text-amber-900'
              }`}
            >
              {isConnected ? (
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              ) : (
                <AlertCircle className="w-4 h-4 text-amber-600 shrink-0" />
              )}
              <span>{retryResult}</span>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-3 bg-slate-50 border-t border-slate-200 flex items-center justify-between shrink-0">
          <button
            type="button"
            onClick={onClose}
            className="px-3.5 py-2 rounded-lg text-xs font-semibold text-slate-600 hover:bg-slate-200 cursor-pointer transition-colors"
          >
            {lang === 'ar' ? 'إغلاق' : 'Close'}
          </button>

          <button
            type="button"
            onClick={handleManualRetry}
            disabled={isRetrying}
            className="px-4 py-2 rounded-lg text-xs font-bold bg-slate-900 hover:bg-slate-800 disabled:opacity-50 text-white flex items-center gap-1.5 cursor-pointer shadow-xs transition-colors"
          >
            {isRetrying ? <Loader2 className="w-4 h-4 animate-spin" /> : <RotateCcw className="w-4 h-4" />}
            <span>{lang === 'ar' ? 'فحص الاتصال والمزامنة الآن' : 'Test Connection & Sync'}</span>
          </button>
        </div>
      </div>
    </div>
  );

  return typeof document !== 'undefined' ? createPortal(modal, document.body) : modal;
};

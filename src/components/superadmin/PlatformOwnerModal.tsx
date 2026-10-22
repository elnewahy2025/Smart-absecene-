import React, { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { useModalAccessibility } from '../../hooks/useModalAccessibility';
import {
  ShieldAlert,
  Building2,
  PlusCircle,
  CheckCircle2,
  X,
  ArrowRightLeft,
  Users,
  GraduationCap,
  RotateCcw,
  CreditCard,
  CalendarClock,
  StopCircle,
  PlayCircle,
  BadgeCheck,
  Loader2,
} from 'lucide-react';
import { useAttendance } from '../../context/AttendanceContext';
import { authenticatedFetch } from '../../lib/api';
import { SchoolProvisionForm } from './SchoolProvisionForm';

interface Props {
  isOpen: boolean;
  onClose: () => void;
}

interface SubscriptionSummary {
  plan?: string;
  billingCycle?: 'monthly' | 'annual';
  effectiveStatus: 'active' | 'grace' | 'suspended' | 'expired';
  accessEnabled: boolean;
  gracePeriodDays?: number;
  currentPeriodEnd?: string | null;
  daysRemaining?: number | null;
  graceDaysRemaining?: number | null;
}

const PRESET_COLORS = [
  { name: 'Emerald (الأندلس)', value: '#059669' },
  { name: 'Royal Blue (الفلاح)', value: '#2563eb' },
  { name: 'Purple (الريادة)', value: '#7c3aed' },
  { name: 'Amber (التميز)', value: '#d97706' },
  { name: 'Rose (الفرسان)', value: '#e11d48' },
  { name: 'Indigo (النخبة)', value: '#4f46e5' },
  { name: 'Teal (المستقبل)', value: '#0d9488' },
  { name: 'Slate (الدولية)', value: '#475569' },
];

export const PlatformOwnerModal: React.FC<Props> = ({ isOpen, onClose }) => {
  const {
    tenants,
    currentTenant,
    setTenantId,
    provisionNewSchool,
    refreshDynamicTenants,
    students,
    users,
    lang,
    refreshSubscription,
    isSuperAdmin,
  } = useAttendance();

  const [activeTab, setActiveTab] = useState<'list' | 'provision'>('list');
  const [loading, setLoading] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Per-school subscription summaries (public projection from /api/tenants).
  const [subscriptions, setSubscriptions] = useState<Record<string, SubscriptionSummary>>({});
  const [busySubscription, setBusySubscription] = useState<string | null>(null);


  const dialogRef = useRef<HTMLDivElement>(null);
  useModalAccessibility({ isOpen, onClose, containerRef: dialogRef });

  useEffect(() => {
    if (!isOpen || !isSuperAdmin) return;
    let cancelled = false;
    (async () => {
      try {
        const res = await authenticatedFetch('/api/tenants/subscriptions');
        if (!res.ok) return;
        const data = await res.json();
        if (cancelled || !data?.success || !data.subscriptions) return;
        setSubscriptions(data.subscriptions);
      } catch (err) {
        console.warn('Could not load school subscriptions:', err);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [isOpen, isSuperAdmin]);

  if (!isOpen || !isSuperAdmin) return null;


  const handleSyncWithServer = async () => {
    setIsSyncing(true);
    try {
      await refreshDynamicTenants();
      setSuccessMessage('تمت مزامنة المدارس والبيانات السحابية من الخادم بنجاح.');
      setTimeout(() => setSuccessMessage(null), 3500);
    } catch (e: any) {
      setErrorMessage('تعذر الاتصال بالخادم لمزامنة المدارس.');
      setTimeout(() => setErrorMessage(null), 3500);
    } finally {
      setIsSyncing(false);
    }
  };

  const handleSubscriptionAction = async (
    tenantId: string,
    action: 'suspend' | 'reactivate' | 'renew'
  ) => {
    setBusySubscription(tenantId);
    setErrorMessage(null);
    setSuccessMessage(null);
    try {
      const body: Record<string, unknown> = {};
      if (action === 'renew') {
        body.cycle = subscriptions[tenantId]?.billingCycle || 'annual';
      }
      const res = await authenticatedFetch(
        `/api/tenants/${encodeURIComponent(tenantId)}/subscription/${action}`,
        { method: 'POST', body: JSON.stringify(body) }
      );
      const data = await res.json();
      if (!res.ok || !data?.success) {
        throw new Error(data?.error || 'Subscription action failed.');
      }
      if (data.summary) {
        setSubscriptions((prev) => ({ ...prev, [tenantId]: data.summary }));
      }
      // If the action targeted the currently open school, re-evaluate the gate
      // immediately so the banner/suspended screen updates without a reload.
      void refreshSubscription();
      const label =
        action === 'renew'
          ? 'تم تجديد اشتراك المدرسة بنجاح.'
          : action === 'suspend'
            ? 'تم إيقاف اشتراك المدرسة. سيُحجب الوصول فوراً.'
            : 'تمت إعادة تنشيط اشتراك المدرسة.';
      setSuccessMessage(label);
      setTimeout(() => setSuccessMessage(null), 3500);
    } catch (err: any) {
      setErrorMessage(err?.message || 'تعذر تنفيذ إجراء الاشتراك.');
      setTimeout(() => setErrorMessage(null), 4500);
    } finally {
      setBusySubscription(null);
    }
  };

  return createPortal(
    <div ref={dialogRef} tabIndex={-1} role="dialog" aria-modal="true" aria-label="Platform owner console" className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-fade-in font-['Cairo',sans-serif]">
      <div
        className="bg-slate-900 border border-amber-500/40 rounded-2xl shadow-2xl max-w-3xl w-full max-h-[92vh] flex flex-col overflow-hidden text-slate-100"
        dir="rtl"
      >
        {/* Header */}
        <div className="p-4 sm:p-5 bg-gradient-to-r from-slate-900 via-amber-950/40 to-slate-900 border-b border-amber-500/30 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500/20 border border-amber-500/50 flex items-center justify-center text-amber-400 shadow-md">
              <ShieldAlert className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-extrabold text-white text-base sm:text-lg">
                  مركز إدارة المنصة وتأسيس المدارس
                </h3>
                <span className="bg-amber-500/20 text-amber-300 border border-amber-500/40 text-[10px] font-mono px-2 py-0.5 rounded-full font-bold">
                  The Owner • Super Admin
                </span>
              </div>
              <p className="text-xs text-slate-400">
                صلاحيات المطور والجهة المالكة • تأسيس المدارس فورياً وعزل متعدد المدارس السحابي
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="flex items-center border-b border-slate-800 bg-slate-900/60 px-5 pt-2 gap-2 text-xs font-bold">
          <button
            onClick={() => setActiveTab('list')}
            className={`pb-2.5 px-3 border-b-2 flex items-center gap-1.5 transition-colors cursor-pointer ${
              activeTab === 'list'
                ? 'border-amber-500 text-amber-400'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Building2 className="w-4 h-4" />
            <span>المدارس المشغلة على المنصة ({tenants.length})</span>
          </button>
          <button
            onClick={() => setActiveTab('provision')}
            className={`pb-2.5 px-3 border-b-2 flex items-center gap-1.5 transition-colors cursor-pointer ${
              activeTab === 'provision'
                ? 'border-amber-500 text-amber-400'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <PlusCircle className="w-4 h-4" />
            <span>تأسيس مدرسة جديدة (بدون كتابة كود)</span>
          </button>

          <button
            type="button"
            onClick={handleSyncWithServer}
            disabled={isSyncing}
            className="ms-auto pb-2 px-2.5 text-xs text-amber-400 hover:text-amber-300 flex items-center gap-1.5 transition-colors cursor-pointer disabled:opacity-50"
            title="مزامنة المدارس المسجلة ديناميكياً من الخادم المركزي"
          >
            <RotateCcw className={`w-3.5 h-3.5 ${isSyncing ? 'animate-spin' : ''}`} />
            <span>{isSyncing ? 'جارٍ التحديث...' : 'تحديث من الخادم'}</span>
          </button>
        </div>

        {/* Alerts */}
        {successMessage && (
          <div className="mx-5 mt-4 p-3 bg-emerald-950/80 border border-emerald-800/80 rounded-xl text-xs text-emerald-200 flex items-start gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
            <span className="whitespace-pre-line leading-relaxed break-words">{successMessage}</span>
          </div>
        )}
        {errorMessage && (
          <div className="mx-5 mt-4 p-3 bg-red-950/80 border border-red-800/80 rounded-xl text-xs text-red-200 flex items-center gap-2">
            <X className="w-4 h-4 text-red-400 shrink-0" />
            <span>{errorMessage}</span>
          </div>
        )}

        {/* Body Content */}
        <div className="p-5 overflow-y-auto space-y-4 flex-1">
          {activeTab === 'list' ? (
            <div className="space-y-3">
              <div className="text-xs text-slate-400">
                بصفتك مالك المنصة (The Owner)، يمكنك التبديل والتحكم المباشر في أي مدرسة مشغلة على النظام فورياً:
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {tenants.map((t) => {
                  const isCurrent = t.id === currentTenant.id;
                  const tenantStudentsCount = students.filter((s) => s.tenantId === t.id).length;
                  const tenantStaffCount = users.filter((u) => u.tenantId === t.id && u.role !== 'super_admin').length;
                  const sub = subscriptions[t.id];
                  const status = sub?.effectiveStatus || 'active';
                  const isSuspended = status === 'suspended';
                  const isBusy = busySubscription === t.id;
                  const statusLabel =
                    status === 'suspended'
                      ? 'موقوف'
                      : status === 'expired'
                        ? 'منتهي'
                        : status === 'grace'
                          ? 'فترة سماح'
                          : 'نشط';
                  const statusClass =
                    status === 'active'
                      ? 'bg-emerald-500/15 text-emerald-300 border-emerald-500/40'
                      : status === 'grace'
                        ? 'bg-amber-500/15 text-amber-300 border-amber-500/40'
                        : 'bg-rose-500/15 text-rose-300 border-rose-500/40';

                  return (
                    <div
                      key={t.id}
                      className={`p-4 rounded-xl border transition-all ${
                        isCurrent
                          ? 'bg-slate-800/90 border-amber-500/80 shadow-md ring-1 ring-amber-500/50'
                          : 'bg-slate-900/60 border-slate-800 hover:border-slate-700'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-2 mb-2">
                        <div className="flex items-center gap-2">
                          <div
                            className="w-8 h-8 rounded-lg flex items-center justify-center font-bold text-white shadow-xs"
                            style={{ backgroundColor: (t.schoolProfile as any)?.branding?.primaryColor || '#059669' }}
                          >
                            {t.code ? t.code.charAt(0) : t.name.charAt(0)}
                          </div>
                          <div>
                            <h4 className="font-bold text-white text-xs">{t.name}</h4>
                            <span className="text-[10px] text-slate-400 font-mono">
                              {t.code} • {t.city}
                            </span>
                          </div>
                        </div>
                        {isCurrent && (
                          <span className="bg-amber-500/20 text-amber-300 border border-amber-500/40 text-[9px] px-1.5 py-0.5 rounded font-mono">
                            المدرسة النشطة
                          </span>
                        )}
                      </div>

                      <div className="grid grid-cols-2 gap-2 text-[11px] text-slate-400 my-2 pt-2 border-t border-slate-800">
                        <div className="flex items-center gap-1.5">
                          <GraduationCap className="w-3.5 h-3.5 text-emerald-400" />
                          <span>الطلاب: {tenantStudentsCount}</span>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <Users className="w-3.5 h-3.5 text-blue-400" />
                          <span>الكادر: {tenantStaffCount}</span>
                        </div>
                      </div>

                      {/* Subscription & renewal controls */}
                      <div className="mt-2 pt-2 border-t border-slate-800 space-y-2">
                        <div className="flex items-center justify-between text-[11px]">
                          <span className="flex items-center gap-1.5 text-slate-400">
                            <CreditCard className="w-3.5 h-3.5 text-amber-400" />
                            <span>الاشتراك:</span>
                            <span className={`px-1.5 py-0.5 rounded border text-[10px] font-bold ${statusClass}`}>
                              {statusLabel}
                            </span>
                          </span>
                          {sub?.currentPeriodEnd && (
                            <span className="text-[10px] text-slate-500 font-mono flex items-center gap-1">
                              <CalendarClock className="w-3 h-3" />
                              {String(sub.currentPeriodEnd).slice(0, 10)}
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-1.5">
                          <button
                            type="button"
                            disabled={isBusy}
                            onClick={() => handleSubscriptionAction(t.id, 'renew')}
                            className="flex-1 px-2 py-1 rounded-lg bg-emerald-500/15 hover:bg-emerald-500/25 border border-emerald-500/40 text-emerald-300 text-[11px] font-bold flex items-center justify-center gap-1 transition-colors cursor-pointer disabled:opacity-50"
                          >
                            {isBusy ? <Loader2 className="w-3 h-3 animate-spin" /> : <BadgeCheck className="w-3 h-3" />}
                            <span>تجديد</span>
                          </button>
                          {isSuspended ? (
                            <button
                              type="button"
                              disabled={isBusy}
                              onClick={() => handleSubscriptionAction(t.id, 'reactivate')}
                              className="flex-1 px-2 py-1 rounded-lg bg-blue-500/15 hover:bg-blue-500/25 border border-blue-500/40 text-blue-300 text-[11px] font-bold flex items-center justify-center gap-1 transition-colors cursor-pointer disabled:opacity-50"
                            >
                              <PlayCircle className="w-3 h-3" />
                              <span>إعادة تنشيط</span>
                            </button>
                          ) : (
                            <button
                              type="button"
                              disabled={isBusy}
                              onClick={() => handleSubscriptionAction(t.id, 'suspend')}
                              className="flex-1 px-2 py-1 rounded-lg bg-rose-500/15 hover:bg-rose-500/25 border border-rose-500/40 text-rose-300 text-[11px] font-bold flex items-center justify-center gap-1 transition-colors cursor-pointer disabled:opacity-50"
                            >
                              <StopCircle className="w-3 h-3" />
                              <span>إيقاف</span>
                            </button>
                          )}
                        </div>
                      </div>

                      <div className="mt-3 flex items-center justify-between pt-2 border-t border-slate-800/80">
                        <span className="text-[10px] text-slate-500 font-mono">ID: {t.id}</span>
                        {!isCurrent ? (
                          <button
                            type="button"
                            onClick={() => {
                              setTenantId(t.id);
                              setSuccessMessage(`تم التبديل بنجاح إلى بوابة: ${t.name}`);
                            }}
                            className="px-2.5 py-1 rounded-lg bg-amber-500/20 hover:bg-amber-500/30 border border-amber-500/40 text-amber-300 text-xs font-bold flex items-center gap-1 transition-colors cursor-pointer"
                          >
                            <ArrowRightLeft className="w-3 h-3" />
                            <span>التحكم في هذه المدرسة</span>
                          </button>
                        ) : (
                          <span className="text-xs text-emerald-400 font-semibold flex items-center gap-1">
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            <span>مفعلة حالياً</span>
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ) : (
            <SchoolProvisionForm
              onProvision={async (input) => {
                setErrorMessage(null);
                setSuccessMessage(null);
                return provisionNewSchool(input);
              }}
              onProvisioned={(message) => {
                setSuccessMessage(message);
                setActiveTab('list');
              }}
              onError={setErrorMessage}
              onCancel={() => setActiveTab('list')}
            />
          )}
        </div>

        {/* Footer */}
        <div className="p-3 bg-slate-950 border-t border-slate-800/80 text-[11px] text-slate-500 flex items-center justify-between">
          <span>نظام العزل السحابي الصارم (Zero-Trust Multi-Tenancy Architecture)</span>
          <span className="font-mono text-amber-500/80">Owner Role: Authorized</span>
        </div>
      </div>
    </div>,
    document.body
  );
};

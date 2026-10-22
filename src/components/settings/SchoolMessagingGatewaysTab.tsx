import React, { useState } from 'react';
import type { SchoolMessagingGatewayConfig } from '../../types/attendance';
import { ShieldAlert, ShieldCheck, CheckCircle2, Lock, Save } from 'lucide-react';
import { EmailGatewaySection } from './EmailGatewaySection';
import { WhatsAppGatewaySection } from './WhatsAppGatewaySection';
import { SmsGatewaySection } from './SmsGatewaySection';
import { MessagingGatewayAuditFooter } from './MessagingGatewayAuditFooter';
import { useAttendance } from '../../context/AttendanceContext';

interface Props {
  gatewayConfig: SchoolMessagingGatewayConfig;
  onSave: (config: Partial<SchoolMessagingGatewayConfig>) => Promise<{ success: boolean; message: string }>;
  isSuperAdmin: boolean;
  schoolName: string;
  defaultCallingCode?: string;
}

export const SchoolMessagingGatewaysTab: React.FC<Props> = ({
  gatewayConfig,
  onSave,
  isSuperAdmin,
  schoolName,
  defaultCallingCode = '+966',
}) => {
  const { lang } = useAttendance();
  const [form, setForm] = useState<SchoolMessagingGatewayConfig>(gatewayConfig);
  const [saveStatus, setSaveStatus] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Keep state synced if prop changes
  React.useEffect(() => {
    setForm(gatewayConfig);
  }, [gatewayConfig]);

  const handleFieldChange = <K extends keyof SchoolMessagingGatewayConfig>(
    field: K,
    value: SchoolMessagingGatewayConfig[K]
  ) => {
    if (!isSuperAdmin) return;
    setForm((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isSuperAdmin) {
      setSaveStatus({
        type: 'error',
        text: lang === 'ar'
          ? 'عذراً، صلاحية تعديل وحفظ بوابات المراسلة وبيانات الواتساب وSMS محصورة بمالك المنصة (The Owner) فقط.'
          : 'Sorry, permission to edit and save messaging gateways and WhatsApp/SMS data is restricted to the platform owner (The Owner) only.',
      });
      return;
    }

    const res = await onSave(form);
    setSaveStatus({
      type: res.success ? 'success' : 'error',
      text: res.message,
    });

    if (res.success) {
      setTimeout(() => setSaveStatus(null), 4000);
    }
  };

  return (
    <div className="space-y-6 text-xs font-['Cairo',sans-serif]">
      {/* RBAC Top Banner */}
      {!isSuperAdmin ? (
        <div className="bg-amber-50 dark:bg-amber-950/40 border border-amber-300 dark:border-amber-700/60 p-4 rounded-xl flex items-start gap-3">
          <div className="p-2 bg-amber-100 dark:bg-amber-900/60 text-amber-700 dark:text-amber-300 rounded-lg shrink-0">
            <Lock className="w-5 h-5" />
          </div>
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="font-bold text-amber-900 dark:text-amber-200 text-sm">
                {lang === 'ar' ? 'صلاحية خاصة ومحصورة بمالك المنصة (The Owner Only)' : 'Special permission restricted to the platform owner (The Owner Only)'}
              </span>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-200 dark:bg-amber-800 text-amber-900 dark:text-amber-100">
                {lang === 'ar' ? 'وضع القراءة فقط' : 'Read-only mode'}
              </span>
            </div>
            <p className="text-amber-800 dark:text-amber-300 leading-relaxed text-xs">
              {lang === 'ar' ? (
                <>بيانات الربط مع بوابات الرسائل النصية القصيرة (SMS Gateway) ورقم هاتف الواتساب المعتمد للمراسلة وكلمات المرور البرمجية محمية ولا يمكن تعديلها إلا من قبل حساب <strong>مالك المنصة (The Owner / super_admin)</strong> حرصاً على سرية الاعتمادات والأمان المؤسسي.</>
              ) : (
                <>The integration data for SMS gateways, the approved WhatsApp messaging phone number, and API passwords are protected and can only be edited by the <strong>platform owner (The Owner / super_admin)</strong> account to preserve credential confidentiality and institutional security.</>
              )}
            </p>
          </div>
        </div>
      ) : (
        <div className="bg-linear-to-r from-emerald-50 via-teal-50 to-indigo-50 dark:from-emerald-950/40 dark:via-teal-950/40 dark:to-indigo-950/40 border border-emerald-300 dark:border-emerald-700/60 p-4 rounded-xl flex items-center justify-between gap-3 shadow-2xs">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-emerald-600 text-white rounded-xl shadow-xs">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-bold text-slate-900 dark:text-white text-sm">
                  {lang === 'ar' ? 'وضع التحكم الكامل لمالك المنصة (The Owner Control)' : 'Full control mode for the platform owner (The Owner Control)'}
                </span>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-600 text-white">
                  {lang === 'ar' ? 'مصرح بالتعديل والحفظ' : 'Authorized to edit and save'}
                </span>
              </div>
              <p className="text-slate-600 dark:text-slate-300 text-xs mt-0.5">
                {lang === 'ar'
                  ? `يمكنك كمالك للمنصة إدخال وتعديل أرقام الواتساب وبوابات الـ SMS المعتمدة لمدرسة (${schoolName}).`
                  : `As the platform owner, you can enter and edit the WhatsApp numbers and approved SMS gateways for (${schoolName}) school.`}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={handleSubmit}
            className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white font-bold px-4 py-2 rounded-lg transition-all cursor-pointer shadow-xs shrink-0"
          >
            <Save className="w-4 h-4" />
            <span>{lang === 'ar' ? 'حفظ الإعدادات' : 'Save settings'}</span>
          </button>
        </div>
      )}

      {saveStatus && (
        <div
          className={`p-3.5 rounded-lg flex items-center gap-2 text-xs font-semibold ${
            saveStatus.type === 'success'
              ? 'bg-emerald-50 text-emerald-900 border border-emerald-300 dark:bg-emerald-950/50 dark:text-emerald-200 dark:border-emerald-800'
              : 'bg-rose-50 text-rose-900 border border-rose-300 dark:bg-rose-950/50 dark:text-rose-200 dark:border-rose-800'
          }`}
        >
          {saveStatus.type === 'success' ? (
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          ) : (
            <ShieldAlert className="w-4 h-4 text-rose-600 shrink-0" />
          )}
          <span>{saveStatus.text}</span>
        </div>
      )}

      <WhatsAppGatewaySection
        form={form}
        lang={lang}
        isSuperAdmin={isSuperAdmin}
        schoolName={schoolName}
        defaultCallingCode={defaultCallingCode}
        handleFieldChange={handleFieldChange}
      />

      <SmsGatewaySection
        form={form}
        lang={lang}
        isSuperAdmin={isSuperAdmin}
        handleFieldChange={handleFieldChange}
      />

      <EmailGatewaySection
        form={form}
        handleFieldChange={handleFieldChange}
        lang={lang}
        isSuperAdmin={isSuperAdmin}
        schoolName={schoolName}
      />

      <MessagingGatewayAuditFooter
        gatewayConfig={gatewayConfig}
        lang={lang}
        isSuperAdmin={isSuperAdmin}
        onSubmit={handleSubmit}
      />
    </div>
  );
};

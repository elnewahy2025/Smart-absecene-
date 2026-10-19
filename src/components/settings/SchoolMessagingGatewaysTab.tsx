import React, { useState } from 'react';
import {
  SchoolMessagingGatewayConfig,
  WhatsAppServiceMode,
  SmsGatewayProvider,
  EmailGatewayProvider,
} from '../../types/attendance';
import {
  MessageSquare,
  Phone,
  Shield,
  ShieldAlert,
  ShieldCheck,
  CheckCircle2,
  Lock,
  Send,
  ExternalLink,
  Eye,
  EyeOff,
  Save,
  Key,
  Globe,
  Radio,
  Sparkles,
  Mail,
} from 'lucide-react';
import {
  formatWhatsAppInternationalPhone,
  buildWhatsAppWebUrl,
  openWhatsAppDirect,
} from '../../utils/whatsappUtils';
import { useAttendance } from '../../context/AttendanceContext';

interface Props {
  gatewayConfig: SchoolMessagingGatewayConfig;
  onSave: (config: Partial<SchoolMessagingGatewayConfig>) => { success: boolean; message: string };
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
  const [showApiKey, setShowApiKey] = useState(false);
  const [showApiSecret, setShowApiSecret] = useState(false);
  const [showToken, setShowToken] = useState(false);
  const [showEmailApiKey, setShowEmailApiKey] = useState(false);
  const [showSmtpPass, setShowSmtpPass] = useState(false);
  const [saveStatus, setSaveStatus] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [testPhoneNumber, setTestPhoneNumber] = useState('');

  // Keep state synced if prop changes
  React.useEffect(() => {
    setForm(gatewayConfig);
  }, [gatewayConfig]);

  const cleanCountryCode = defaultCallingCode.replace(/[^\d]/g, '') || '966';

  const internationalFormatted = formatWhatsAppInternationalPhone(
    form.whatsappPhoneNumber,
    cleanCountryCode
  );

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

  const handleSubmit = (e: React.FormEvent) => {
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

    const res = onSave(form);
    setSaveStatus({
      type: res.success ? 'success' : 'error',
      text: res.message,
    });

    if (res.success) {
      setTimeout(() => setSaveStatus(null), 4000);
    }
  };

  const handleTestWhatsAppWeb = () => {
    const targetPhone = testPhoneNumber.trim() || form.whatsappPhoneNumber || '0501234567';
    const testMessage = lang === 'ar'
      ? `السلام عليكم ورحمة الله، هذه رسالة تجريبية من بوابة واتساب لمدرسة ${schoolName} عبر نظام الحضور والغياب الذكي.`
      : `Peace be upon you and the mercy of Allah. This is a test message from the WhatsApp gateway for ${schoolName} school via the smart attendance system.`;
    openWhatsAppDirect(targetPhone, testMessage, cleanCountryCode);
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

      {/* SECTION 1: WHATSAPP CONFIGURATION */}
      <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-5 space-y-4 shadow-2xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-emerald-100 dark:bg-emerald-900/60 text-emerald-700 dark:text-emerald-300 rounded-lg">
              <MessageSquare className="w-5 h-5" />
            </div>
            <div>
              <h4 className="font-bold text-slate-900 dark:text-slate-100 text-sm">
                {lang === 'ar' ? 'بوابة وخدمة الواتساب المباشرة (WhatsApp Direct & Web)' : 'Direct WhatsApp gateway and service (WhatsApp Direct & Web)'}
              </h4>
              <p className="text-slate-500 dark:text-slate-400 text-[11px]">
                {lang === 'ar' ? 'رقم هاتف الواتساب المعتمد للمراسلة وربط أولياء الأمور بالمدرسة مجاناً' : 'The approved WhatsApp phone number for messaging and connecting parents with the school for free'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-[11px] font-semibold text-slate-600 dark:text-slate-300">
              {lang === 'ar' ? 'تفعيل إشعارات الواتساب:' : 'Enable WhatsApp notifications:'}
            </span>
            <input
              type="checkbox"
              disabled={!isSuperAdmin}
              checked={form.enableWhatsAppNotifications}
              onChange={(e) => handleFieldChange('enableWhatsAppNotifications', e.target.checked)}
              className="w-4 h-4 accent-emerald-600 rounded cursor-pointer disabled:opacity-50"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* WhatsApp Dedicated Phone Number */}
          <div>
            <label className="font-semibold text-slate-700 dark:text-slate-300 block mb-1 flex items-center justify-between">
              <span>{lang === 'ar' ? 'رقم هاتف الواتساب المعتمد للمراسلة:' : 'Approved WhatsApp messaging phone number:'}</span>
              <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-mono" dir="ltr">
                {lang === 'ar' ? 'كود الدولة:' : 'Country code:'} {defaultCallingCode}
              </span>
            </label>
            <div className="relative flex items-center">
              <span className="absolute right-3 font-mono text-xs text-slate-400 dark:text-slate-500 select-none" dir="ltr">
                {defaultCallingCode}
              </span>
              <input
                type="text"
                disabled={!isSuperAdmin}
                value={form.whatsappPhoneNumber || ''}
                onChange={(e) => handleFieldChange('whatsappPhoneNumber', e.target.value)}
                placeholder="0501234567"
                className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg p-2.5 pr-14 font-mono text-slate-900 dark:text-slate-100 focus:bg-white dark:focus:bg-slate-800 focus:border-emerald-500 disabled:opacity-60 disabled:cursor-not-allowed"
              />
            </div>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">
              {lang === 'ar' ? 'الرقم المخصص لتواصل المدرسة بالواتساب مع أولياء الأمور (يستخدم عند فتح محادثات الواتساب المباشرة).' : 'The dedicated number for the school\'s WhatsApp communication with parents (used when opening direct WhatsApp conversations).'}
            </p>
            {form.whatsappPhoneNumber && (
              <div className="mt-1.5 flex items-center gap-1.5 text-[10px] text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/50 px-2 py-1 rounded">
                <Sparkles className="w-3 h-3 shrink-0" />
                <span>{lang === 'ar' ? 'الصيغة الدولية المعتمدة لروابط واتساب:' : 'Approved international format for WhatsApp links:'}</span>
                <span className="font-mono font-bold" dir="ltr">+{internationalFormatted}</span>
              </div>
            )}
          </div>

          {/* WhatsApp Service Mode */}
          <div>
            <label className="font-semibold text-slate-700 dark:text-slate-300 block mb-1">
              {lang === 'ar' ? 'وضع خدمة الواتساب للمدرسة:' : 'School WhatsApp service mode:'}
            </label>
            <div className="space-y-2 mt-1">
              <label
                className={`flex items-start gap-2.5 p-2.5 rounded-lg border cursor-pointer transition-all ${
                  form.whatsappServiceMode === 'web_direct'
                    ? 'border-emerald-500 bg-emerald-50/60 dark:bg-emerald-950/40 dark:border-emerald-600'
                    : 'border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800/50'
                } ${!isSuperAdmin ? 'opacity-70 cursor-not-allowed' : ''}`}
              >
                <input
                  type="radio"
                  name="whatsappServiceMode"
                  disabled={!isSuperAdmin}
                  value="web_direct"
                  checked={form.whatsappServiceMode === 'web_direct'}
                  onChange={() => handleFieldChange('whatsappServiceMode', 'web_direct')}
                  className="mt-0.5 accent-emerald-600"
                />
                <div>
                  <div className="font-bold text-slate-900 dark:text-slate-100 flex items-center gap-1.5">
                    <span>{lang === 'ar' ? 'إرسال مباشر عبر واتساب ويب / التطبيق (WhatsApp Web / App)' : 'Direct sending via WhatsApp Web / App (WhatsApp Web / App)'}</span>
                    <span className="text-[10px] bg-emerald-600 text-white px-1.5 py-0.2 rounded font-semibold">
                      {lang === 'ar' ? 'مجاني ومفعّل' : 'Free and enabled'}
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-600 dark:text-slate-400 mt-0.5">
                    {lang === 'ar' ? 'فتح محادثة واتساب مشفرة مباشرة بنقرة واحدة مع ولي الأمر ومضمون الرسالة جاهز دون أي تكلفة اشتراك مزود.' : 'Open an encrypted WhatsApp conversation directly in one click with the parent, with the message content ready at no provider subscription cost.'}
                  </p>
                </div>
              </label>

              <label
                className={`flex items-start gap-2.5 p-2.5 rounded-lg border cursor-pointer transition-all ${
                  form.whatsappServiceMode === 'cloud_api'
                    ? 'border-emerald-500 bg-emerald-50/60 dark:bg-emerald-950/40 dark:border-emerald-600'
                    : 'border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800/50'
                } ${!isSuperAdmin ? 'opacity-70 cursor-not-allowed' : ''}`}
              >
                <input
                  type="radio"
                  name="whatsappServiceMode"
                  disabled={!isSuperAdmin}
                  value="cloud_api"
                  checked={form.whatsappServiceMode === 'cloud_api'}
                  onChange={() => handleFieldChange('whatsappServiceMode', 'cloud_api')}
                  className="mt-0.5 accent-emerald-600"
                />
                <div>
                  <div className="font-bold text-slate-900 dark:text-slate-100 flex items-center gap-1.5">
                    <span>{lang === 'ar' ? 'الربط البرمجي السحابي المباشر (WhatsApp Cloud API - Meta)' : 'Direct cloud API integration (WhatsApp Cloud API - Meta)'}</span>
                    <span className="text-[10px] bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300 px-1.5 py-0.2 rounded">
                      {lang === 'ar' ? 'اختياري للمنشآت' : 'Optional for organizations'}
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-600 dark:text-slate-400 mt-0.5">
                    {lang === 'ar' ? 'إرسال خلفي مؤتمت بالكامل عبر حساب Meta Business الموثق برمجياً.' : 'Fully automated background sending via a programmatically verified Meta Business account.'}
                  </p>
                </div>
              </label>
            </div>
          </div>
        </div>

        {/* WhatsApp Cloud API Optional Credentials (Visible when cloud_api selected) */}
        {form.whatsappServiceMode === 'cloud_api' && (
          <div className="mt-3 p-3 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200 dark:border-slate-700 space-y-3">
            <h5 className="font-bold text-slate-800 dark:text-slate-200 flex items-center gap-2">
              <Key className="w-4 h-4 text-emerald-500" />
              <span>{lang === 'ar' ? 'بيانات ربط WhatsApp Cloud API (Meta Developers)' : 'WhatsApp Cloud API integration data (Meta Developers)'}</span>
            </h5>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <div>
                <label className="font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                  Business Account ID:
                </label>
                <input
                  type="text"
                  disabled={!isSuperAdmin}
                  value={form.whatsappBusinessAccountId || ''}
                  onChange={(e) => handleFieldChange('whatsappBusinessAccountId', e.target.value)}
                  placeholder="e.g. 10928374659102"
                  className="w-full bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg p-2 font-mono text-slate-900 dark:text-slate-100 disabled:opacity-60"
                />
              </div>

              <div>
                <label className="font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                  Phone Number ID:
                </label>
                <input
                  type="text"
                  disabled={!isSuperAdmin}
                  value={form.whatsappPhoneNumberId || ''}
                  onChange={(e) => handleFieldChange('whatsappPhoneNumberId', e.target.value)}
                  placeholder="e.g. 1049283746501"
                  className="w-full bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg p-2 font-mono text-slate-900 dark:text-slate-100 disabled:opacity-60"
                />
              </div>

              <div>
                <label className="font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                  Permanent System Access Token:
                </label>
                <div className="relative flex items-center">
                  <input
                    type={showToken ? 'text' : 'password'}
                    disabled={!isSuperAdmin}
                    value={form.whatsappApiToken || ''}
                    onChange={(e) => handleFieldChange('whatsappApiToken', e.target.value)}
                    placeholder="EAABw..."
                    className="w-full bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg p-2 pl-9 font-mono text-slate-900 dark:text-slate-100 disabled:opacity-60"
                  />
                  <button
                    type="button"
                    onClick={() => setShowToken(!showToken)}
                    className="absolute left-2 text-slate-400 hover:text-slate-600 cursor-pointer"
                  >
                    {showToken ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Quick WhatsApp Web Live Tester */}
        <div className="pt-2 border-t border-slate-100 dark:border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-2 w-full sm:w-auto">
            <input
              type="text"
              value={testPhoneNumber}
              onChange={(e) => setTestPhoneNumber(e.target.value)}
              placeholder={lang === 'ar' ? 'أدخل رقم ولي أمر للتجربة (مثال: 050xxxxxxx)' : 'Enter a parent number to test (e.g. 050xxxxxxx)'}
              className="bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg p-2 font-mono text-xs w-full sm:w-64"
            />
            <button
              type="button"
              onClick={handleTestWhatsAppWeb}
              className="flex items-center gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold px-3 py-2 rounded-lg cursor-pointer transition-colors shadow-2xs shrink-0"
            >
              <ExternalLink className="w-3.5 h-3.5" />
              <span>{lang === 'ar' ? 'تجربة فتح واتساب ويب' : 'Test opening WhatsApp Web'}</span>
            </button>
          </div>
          <span className="text-[11px] text-slate-500 dark:text-slate-400">
            {lang === 'ar' ? 'ملاحظة: يمكنك إرسال الرسائل مباشرة لجميع الطلاب من صفحة صندوق الإشعارات أو ملف الطالب.' : 'Note: You can send messages directly to all students from the notifications inbox page or the student profile.'}
          </span>
        </div>
      </div>

      {/* SECTION 2: SMS GATEWAY CONFIGURATION */}
      <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-5 space-y-4 shadow-2xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-indigo-100 dark:bg-indigo-900/60 text-indigo-700 dark:text-indigo-300 rounded-lg">
              <Phone className="w-5 h-5" />
            </div>
            <div>
              <h4 className="font-bold text-slate-900 dark:text-slate-100 text-sm">
                {lang === 'ar' ? 'بوابة الرسائل النصية القصيرة (SMS Gateway Service)' : 'Short message service gateway (SMS Gateway Service)'}
              </h4>
              <p className="text-slate-500 dark:text-slate-400 text-[11px]">
                {lang === 'ar' ? 'ربط مزود خدمة الرسائل النصية المعتمد لإرسال إشعارات الغياب والتأخر الرسمية' : 'Connect the approved SMS service provider to send official absence and tardiness notifications'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-[11px] font-semibold text-slate-600 dark:text-slate-300">
              {lang === 'ar' ? 'تفعيل إرسال الرسائل النصية (SMS):' : 'Enable sending SMS messages:'}
            </span>
            <input
              type="checkbox"
              disabled={!isSuperAdmin}
              checked={form.enableSmsNotifications}
              onChange={(e) => handleFieldChange('enableSmsNotifications', e.target.checked)}
              className="w-4 h-4 accent-indigo-600 rounded cursor-pointer disabled:opacity-50"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* SMS Provider */}
          <div>
            <label className="font-semibold text-slate-700 dark:text-slate-300 block mb-1">
              {lang === 'ar' ? 'مزود خدمة الـ SMS المعتمد:' : 'Approved SMS service provider:'}
            </label>
            <select
              disabled={!isSuperAdmin}
              value={form.smsProvider}
              onChange={(e) => handleFieldChange('smsProvider', e.target.value as SmsGatewayProvider)}
              className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg p-2.5 text-slate-900 dark:text-slate-100 focus:bg-white dark:focus:bg-slate-800 focus:border-indigo-500 disabled:opacity-60 disabled:cursor-not-allowed"
            >
              <option value="taqnyat">{lang === 'ar' ? 'تقنيات (Taqnyat - بوابة سعودية معتمدة)' : 'Taqnyat (Taqnyat - approved Saudi gateway)'}</option>
              <option value="unifonic">{lang === 'ar' ? 'يونيفونك (Unifonic - معتمد)' : 'Unifonic (Unifonic - approved)'}</option>
              <option value="msegat">{lang === 'ar' ? 'مسجات (Msegat - بوابة سعودية)' : 'Msegat (Msegat - Saudi gateway)'}</option>
              <option value="twilio">{lang === 'ar' ? 'تويليو (Twilio - مزود دولي)' : 'Twilio (Twilio - international provider)'}</option>
            </select>
          </div>

          {/* SMS Sender ID */}
          <div>
            <label className="font-semibold text-slate-700 dark:text-slate-300 block mb-1">
              {lang === 'ar' ? 'اسم المرسل المعتمد (Sender ID):' : 'Approved sender name (Sender ID):'}
            </label>
            <input
              type="text"
              disabled={!isSuperAdmin}
              value={form.smsSenderId || ''}
              onChange={(e) => handleFieldChange('smsSenderId', e.target.value)}
              placeholder={lang === 'ar' ? 'e.g. AL-MAJD أو SMARTSCHOOL' : 'e.g. AL-MAJD or SMARTSCHOOL'}
              className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg p-2.5 font-mono text-slate-900 dark:text-slate-100 focus:bg-white dark:focus:bg-slate-800 focus:border-indigo-500 disabled:opacity-60 disabled:cursor-not-allowed"
            />
            <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-0.5">
              {lang === 'ar' ? 'اسم المرسل المسجل والمطابق لترخيص هيئة الاتصالات والفضاء والتقنية.' : 'The registered sender name matching the Communications, Space and Technology Commission license.'}
            </p>
          </div>

          {/* SMS API Key / Token */}
          <div>
            <label className="font-semibold text-slate-700 dark:text-slate-300 block mb-1">
              {lang === 'ar' ? 'مفتاح الواجهة البرمجية (API Key):' : 'API key (API Key):'}
            </label>
            <div className="relative flex items-center">
              <input
                type={showApiKey ? 'text' : 'password'}
                disabled={!isSuperAdmin}
                value={form.smsApiKey || ''}
                onChange={(e) => handleFieldChange('smsApiKey', e.target.value)}
                placeholder={lang === 'ar' ? 'أدخل مفتاح الـ API...' : 'Enter the API key...'}
                className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg p-2.5 pl-9 font-mono text-slate-900 dark:text-slate-100 focus:bg-white dark:focus:bg-slate-800 focus:border-indigo-500 disabled:opacity-60 disabled:cursor-not-allowed"
              />
              <button
                type="button"
                onClick={() => setShowApiKey(!showApiKey)}
                className="absolute left-2.5 text-slate-400 hover:text-slate-600 cursor-pointer"
              >
                {showApiKey ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
              </button>
            </div>
          </div>

          {/* SMS API Secret */}
          <div>
            <label className="font-semibold text-slate-700 dark:text-slate-300 block mb-1">
              {lang === 'ar' ? 'الرمز السري (API Secret / Password):' : 'API secret (API Secret / Password):'}
            </label>
            <div className="relative flex items-center">
              <input
                type={showApiSecret ? 'text' : 'password'}
                disabled={!isSuperAdmin}
                value={form.smsApiSecret || ''}
                onChange={(e) => handleFieldChange('smsApiSecret', e.target.value)}
                placeholder={lang === 'ar' ? 'أدخل الرمز السري...' : 'Enter the API secret...'}
                className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg p-2.5 pl-9 font-mono text-slate-900 dark:text-slate-100 focus:bg-white dark:focus:bg-slate-800 focus:border-indigo-500 disabled:opacity-60 disabled:cursor-not-allowed"
              />
              <button
                type="button"
                onClick={() => setShowApiSecret(!showApiSecret)}
                className="absolute left-2.5 text-slate-400 hover:text-slate-600 cursor-pointer"
              >
                {showApiSecret ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* SECTION 3: EMAIL TRANSPORT (used by the daily executive digest) */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-2">
            <div className="p-1.5 bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-300 rounded-lg">
              <Mail className="w-4 h-4" />
            </div>
            <div>
              <h4 className="font-bold text-slate-800 dark:text-slate-100 text-sm">
                {lang === 'ar' ? 'البريد الإلكتروني (النشرة الصباحية اليومية)' : 'Email (daily morning digest)'}
              </h4>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">
                {lang === 'ar' ? 'يُستخدم لإرسال موجز الإدارة الصباحي إلى قيادات المدرسة عبر البريد.' : 'Used to send the morning management digest to school leadership via email.'}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-[11px] font-semibold text-slate-600 dark:text-slate-300">
              {lang === 'ar' ? 'تفعيل البريد الإلكتروني:' : 'Enable email:'}
            </span>
            <input
              type="checkbox"
              disabled={!isSuperAdmin}
              checked={Boolean(form.emailEnabled)}
              onChange={(e) => handleFieldChange('emailEnabled', e.target.checked)}
              className="w-4 h-4 accent-indigo-600 rounded cursor-pointer disabled:opacity-50"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Email Provider */}
          <div>
            <label className="font-semibold text-slate-700 dark:text-slate-300 block mb-1">
              {lang === 'ar' ? 'مزود البريد الإلكتروني:' : 'Email provider:'}
            </label>
            <select
              disabled={!isSuperAdmin}
              value={form.emailProvider || 'smtp'}
              onChange={(e) => handleFieldChange('emailProvider', e.target.value as EmailGatewayProvider)}
              className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg p-2.5 text-slate-900 dark:text-slate-100 focus:bg-white dark:focus:bg-slate-800 focus:border-indigo-500 disabled:opacity-60 disabled:cursor-not-allowed"
            >
              <option value="smtp">{lang === 'ar' ? 'SMTP (خادم بريد المدرسة)' : 'SMTP (school mail server)'}</option>
              <option value="resend">{lang === 'ar' ? 'Resend (واجهة برمجية)' : 'Resend (API)'}</option>
              <option value="sendgrid">{lang === 'ar' ? 'SendGrid (واجهة برمجية)' : 'SendGrid (API)'}</option>
            </select>
          </div>

          {/* From Email */}
          <div>
            <label className="font-semibold text-slate-700 dark:text-slate-300 block mb-1">
              {lang === 'ar' ? 'عنوان المرسل (From Email):' : 'Sender address (From Email):'}
            </label>
            <input
              type="email"
              disabled={!isSuperAdmin}
              value={form.fromEmail || ''}
              onChange={(e) => handleFieldChange('fromEmail', e.target.value)}
              placeholder="no-reply@school.sa"
              className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg p-2.5 font-mono text-slate-900 dark:text-slate-100 focus:bg-white dark:focus:bg-slate-800 focus:border-indigo-500 disabled:opacity-60 disabled:cursor-not-allowed"
            />
          </div>

          {/* From Name */}
          <div>
            <label className="font-semibold text-slate-700 dark:text-slate-300 block mb-1">
              {lang === 'ar' ? 'اسم المرسل (From Name):' : 'Sender name (From Name):'}
            </label>
            <input
              type="text"
              disabled={!isSuperAdmin}
              value={form.fromName || ''}
              onChange={(e) => handleFieldChange('fromName', e.target.value)}
              placeholder={schoolName}
              className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg p-2.5 text-slate-900 dark:text-slate-100 focus:bg-white dark:focus:bg-slate-800 focus:border-indigo-500 disabled:opacity-60 disabled:cursor-not-allowed"
            />
          </div>
        </div>

        {(form.emailProvider || 'smtp') === 'smtp' ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div>
              <label className="font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                {lang === 'ar' ? 'خادم SMTP (Host):' : 'SMTP server (Host):'}
              </label>
              <input
                type="text"
                disabled={!isSuperAdmin}
                value={form.smtpHost || ''}
                onChange={(e) => handleFieldChange('smtpHost', e.target.value)}
                placeholder="smtp.school.sa"
                className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg p-2.5 font-mono text-slate-900 dark:text-slate-100 focus:bg-white dark:focus:bg-slate-800 focus:border-indigo-500 disabled:opacity-60 disabled:cursor-not-allowed"
              />
            </div>
            <div>
              <label className="font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                {lang === 'ar' ? 'المنفذ (Port):' : 'Port (Port):'}
              </label>
              <input
                type="number"
                disabled={!isSuperAdmin}
                value={form.smtpPort ?? 587}
                onChange={(e) => handleFieldChange('smtpPort', Number(e.target.value))}
                className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg p-2.5 font-mono text-slate-900 dark:text-slate-100 focus:bg-white dark:focus:bg-slate-800 focus:border-indigo-500 disabled:opacity-60 disabled:cursor-not-allowed"
              />
            </div>
            <div className="flex items-end gap-2">
              <label className="flex items-center gap-2 text-[11px] font-semibold text-slate-700 dark:text-slate-300 cursor-pointer">
                <input
                  type="checkbox"
                  disabled={!isSuperAdmin}
                  checked={Boolean(form.smtpSecure)}
                  onChange={(e) => handleFieldChange('smtpSecure', e.target.checked)}
                  className="w-4 h-4 accent-indigo-600 rounded cursor-pointer disabled:opacity-50"
                />
                {lang === 'ar' ? 'اتصال آمن (TLS/SSL)' : 'Secure connection (TLS/SSL)'}
              </label>
            </div>
            <div>
              <label className="font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                {lang === 'ar' ? 'اسم المستخدم (SMTP User):' : 'Username (SMTP User):'}
              </label>
              <input
                type="text"
                disabled={!isSuperAdmin}
                value={form.smtpUser || ''}
                onChange={(e) => handleFieldChange('smtpUser', e.target.value)}
                placeholder="no-reply@school.sa"
                className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg p-2.5 font-mono text-slate-900 dark:text-slate-100 focus:bg-white dark:focus:bg-slate-800 focus:border-indigo-500 disabled:opacity-60 disabled:cursor-not-allowed"
              />
            </div>
            <div className="lg:col-span-2">
              <label className="font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                {lang === 'ar' ? 'كلمة مرور SMTP:' : 'SMTP password:'}
              </label>
              <div className="relative flex items-center">
                <input
                  type={showSmtpPass ? 'text' : 'password'}
                  disabled={!isSuperAdmin}
                  value={form.smtpPass || ''}
                  onChange={(e) => handleFieldChange('smtpPass', e.target.value)}
                  placeholder="••••••••"
                  className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg p-2.5 pl-9 font-mono text-slate-900 dark:text-slate-100 focus:bg-white dark:focus:bg-slate-800 focus:border-indigo-500 disabled:opacity-60 disabled:cursor-not-allowed"
                />
                <button
                  type="button"
                  onClick={() => setShowSmtpPass(!showSmtpPass)}
                  className="absolute left-2.5 text-slate-400 hover:text-slate-600 cursor-pointer"
                >
                  {showSmtpPass ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                </button>
              </div>
            </div>
          </div>
        ) : (
          <div className="max-w-md">
            <label className="font-semibold text-slate-700 dark:text-slate-300 block mb-1">
              {lang === 'ar' ? 'مفتاح الواجهة البرمجية (Email API Key):' : 'API key (Email API Key):'}
            </label>
            <div className="relative flex items-center">
              <input
                type={showEmailApiKey ? 'text' : 'password'}
                disabled={!isSuperAdmin}
                value={form.emailApiKey || ''}
                onChange={(e) => handleFieldChange('emailApiKey', e.target.value)}
                placeholder={lang === 'ar' ? 'أدخل مفتاح الـ API...' : 'Enter the API key...'}
                className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg p-2.5 pl-9 font-mono text-slate-900 dark:text-slate-100 focus:bg-white dark:focus:bg-slate-800 focus:border-indigo-500 disabled:opacity-60 disabled:cursor-not-allowed"
              />
              <button
                type="button"
                onClick={() => setShowEmailApiKey(!showEmailApiKey)}
                className="absolute left-2.5 text-slate-400 hover:text-slate-600 cursor-pointer"
              >
                {showEmailApiKey ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
              </button>
            </div>
          </div>
        )}
      </div>

      {/* SECTION 4: AUDIT & LAST MODIFIED FOOTER */}
      <div className="bg-slate-50 dark:bg-slate-800/40 p-3 rounded-lg border border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-[11px] text-slate-500 dark:text-slate-400">
        <div className="flex items-center gap-2">
          <Shield className="w-4 h-4 text-emerald-500 shrink-0" />
          <span>
            {lang === 'ar' ? 'سجل التوثيق: تم الضبط الأخير بواسطة ' : 'Audit log: last configured by '}
            <strong className="text-slate-700 dark:text-slate-300">
              {gatewayConfig.lastConfiguredByRole === 'super_admin'
                ? (lang === 'ar' ? 'مالك المنصة (The Owner)' : 'Platform owner (The Owner)')
                : (lang === 'ar' ? 'مسؤول النظام' : 'System administrator')}
            </strong>
            {gatewayConfig.lastConfiguredByEmail && ` (${gatewayConfig.lastConfiguredByEmail})`}
            {gatewayConfig.lastConfiguredAt && (
              <span className="font-mono mr-1">
                {lang === 'ar' ? 'بتاريخ:' : 'on:'} {new Date(gatewayConfig.lastConfiguredAt).toLocaleString(lang === 'ar' ? 'ar-SA' : 'en-US')}
              </span>
            )}
          </span>
        </div>

        {isSuperAdmin && (
          <button
            type="button"
            onClick={handleSubmit}
            className="flex items-center gap-1.5 bg-slate-900 hover:bg-slate-800 dark:bg-emerald-600 dark:hover:bg-emerald-700 text-white font-bold px-3 py-1.5 rounded-md cursor-pointer transition-colors shadow-2xs self-end sm:self-auto"
          >
            <Save className="w-3.5 h-3.5" />
            <span>{lang === 'ar' ? 'حفظ واعتماد التغييرات' : 'Save and apply changes'}</span>
          </button>
        )}
      </div>
    </div>
  );
};

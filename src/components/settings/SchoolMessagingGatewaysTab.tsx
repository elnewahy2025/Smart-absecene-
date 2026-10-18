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
        text: 'عذراً، صلاحية تعديل وحفظ بوابات المراسلة وبيانات الواتساب وSMS محصورة بمالك المنصة (The Owner) فقط.',
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
    const testMessage = `السلام عليكم ورحمة الله، هذه رسالة تجريبية من بوابة واتساب لمدرسة ${schoolName} عبر نظام الحضور والغياب الذكي.`;
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
                صلاحية خاصة ومحصورة بمالك المنصة (The Owner Only)
              </span>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-200 dark:bg-amber-800 text-amber-900 dark:text-amber-100">
                وضع القراءة فقط
              </span>
            </div>
            <p className="text-amber-800 dark:text-amber-300 leading-relaxed text-xs">
              بيانات الربط مع بوابات الرسائل النصية القصيرة (SMS Gateway) ورقم هاتف الواتساب المعتمد للمراسلة وكلمات المرور البرمجية محمية ولا يمكن تعديلها إلا من قبل حساب <strong>مالك المنصة (The Owner / super_admin)</strong> حرصاً على سرية الاعتمادات والأمان المؤسسي.
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
                  وضع التحكم الكامل لمالك المنصة (The Owner Control)
                </span>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-600 text-white">
                  مصرح بالتعديل والحفظ
                </span>
              </div>
              <p className="text-slate-600 dark:text-slate-300 text-xs mt-0.5">
                يمكنك كمالك للمنصة إدخال وتعديل أرقام الواتساب وبوابات الـ SMS المعتمدة لمدرسة ({schoolName}).
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={handleSubmit}
            className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white font-bold px-4 py-2 rounded-lg transition-all cursor-pointer shadow-xs shrink-0"
          >
            <Save className="w-4 h-4" />
            <span>حفظ الإعدادات</span>
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
                بوابة وخدمة الواتساب المباشرة (WhatsApp Direct & Web)
              </h4>
              <p className="text-slate-500 dark:text-slate-400 text-[11px]">
                رقم هاتف الواتساب المعتمد للمراسلة وربط أولياء الأمور بالمدرسة مجاناً
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-[11px] font-semibold text-slate-600 dark:text-slate-300">
              تفعيل إشعارات الواتساب:
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
              <span>رقم هاتف الواتساب المعتمد للمراسلة:</span>
              <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-mono" dir="ltr">
                كود الدولة: {defaultCallingCode}
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
              الرقم المخصص لتواصل المدرسة بالواتساب مع أولياء الأمور (يستخدم عند فتح محادثات الواتساب المباشرة).
            </p>
            {form.whatsappPhoneNumber && (
              <div className="mt-1.5 flex items-center gap-1.5 text-[10px] text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/50 px-2 py-1 rounded">
                <Sparkles className="w-3 h-3 shrink-0" />
                <span>الصيغة الدولية المعتمدة لروابط واتساب:</span>
                <span className="font-mono font-bold" dir="ltr">+{internationalFormatted}</span>
              </div>
            )}
          </div>

          {/* WhatsApp Service Mode */}
          <div>
            <label className="font-semibold text-slate-700 dark:text-slate-300 block mb-1">
              وضع خدمة الواتساب للمدرسة:
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
                    <span>إرسال مباشر عبر واتساب ويب / التطبيق (WhatsApp Web / App)</span>
                    <span className="text-[10px] bg-emerald-600 text-white px-1.5 py-0.2 rounded font-semibold">
                      مجاني ومفعّل
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-600 dark:text-slate-400 mt-0.5">
                    فتح محادثة واتساب مشفرة مباشرة بنقرة واحدة مع ولي الأمر ومضمون الرسالة جاهز دون أي تكلفة اشتراك مزود.
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
                    <span>الربط البرمجي السحابي المباشر (WhatsApp Cloud API - Meta)</span>
                    <span className="text-[10px] bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300 px-1.5 py-0.2 rounded">
                      اختياري للمنشآت
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-600 dark:text-slate-400 mt-0.5">
                    إرسال خلفي مؤتمت بالكامل عبر حساب Meta Business الموثق برمجياً.
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
              <span>بيانات ربط WhatsApp Cloud API (Meta Developers)</span>
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
              placeholder="أدخل رقم ولي أمر للتجربة (مثال: 050xxxxxxx)"
              className="bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg p-2 font-mono text-xs w-full sm:w-64"
            />
            <button
              type="button"
              onClick={handleTestWhatsAppWeb}
              className="flex items-center gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold px-3 py-2 rounded-lg cursor-pointer transition-colors shadow-2xs shrink-0"
            >
              <ExternalLink className="w-3.5 h-3.5" />
              <span>تجربة فتح واتساب ويب</span>
            </button>
          </div>
          <span className="text-[11px] text-slate-500 dark:text-slate-400">
            ملاحظة: يمكنك إرسال الرسائل مباشرة لجميع الطلاب من صفحة صندوق الإشعارات أو ملف الطالب.
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
                بوابة الرسائل النصية القصيرة (SMS Gateway Service)
              </h4>
              <p className="text-slate-500 dark:text-slate-400 text-[11px]">
                ربط مزود خدمة الرسائل النصية المعتمد لإرسال إشعارات الغياب والتأخر الرسمية
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-[11px] font-semibold text-slate-600 dark:text-slate-300">
              تفعيل إرسال الرسائل النصية (SMS):
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
              مزود خدمة الـ SMS المعتمد:
            </label>
            <select
              disabled={!isSuperAdmin}
              value={form.smsProvider}
              onChange={(e) => handleFieldChange('smsProvider', e.target.value as SmsGatewayProvider)}
              className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg p-2.5 text-slate-900 dark:text-slate-100 focus:bg-white dark:focus:bg-slate-800 focus:border-indigo-500 disabled:opacity-60 disabled:cursor-not-allowed"
            >
              <option value="taqnyat">تقنيات (Taqnyat - بوابة سعودية معتمدة)</option>
              <option value="unifonic">يونيفونك (Unifonic - معتمد)</option>
              <option value="msegat">مسجات (Msegat - بوابة سعودية)</option>
              <option value="twilio">تويليو (Twilio - مزود دولي)</option>
            </select>
          </div>

          {/* SMS Sender ID */}
          <div>
            <label className="font-semibold text-slate-700 dark:text-slate-300 block mb-1">
              اسم المرسل المعتمد (Sender ID):
            </label>
            <input
              type="text"
              disabled={!isSuperAdmin}
              value={form.smsSenderId || ''}
              onChange={(e) => handleFieldChange('smsSenderId', e.target.value)}
              placeholder="e.g. AL-MAJD أو SMARTSCHOOL"
              className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg p-2.5 font-mono text-slate-900 dark:text-slate-100 focus:bg-white dark:focus:bg-slate-800 focus:border-indigo-500 disabled:opacity-60 disabled:cursor-not-allowed"
            />
            <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-0.5">
              اسم المرسل المسجل والمطابق لترخيص هيئة الاتصالات والفضاء والتقنية.
            </p>
          </div>

          {/* SMS API Key / Token */}
          <div>
            <label className="font-semibold text-slate-700 dark:text-slate-300 block mb-1">
              مفتاح الواجهة البرمجية (API Key):
            </label>
            <div className="relative flex items-center">
              <input
                type={showApiKey ? 'text' : 'password'}
                disabled={!isSuperAdmin}
                value={form.smsApiKey || ''}
                onChange={(e) => handleFieldChange('smsApiKey', e.target.value)}
                placeholder="أدخل مفتاح الـ API..."
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
              الرمز السري (API Secret / Password):
            </label>
            <div className="relative flex items-center">
              <input
                type={showApiSecret ? 'text' : 'password'}
                disabled={!isSuperAdmin}
                value={form.smsApiSecret || ''}
                onChange={(e) => handleFieldChange('smsApiSecret', e.target.value)}
                placeholder="أدخل الرمز السري..."
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
                البريد الإلكتروني (النشرة الصباحية اليومية)
              </h4>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">
                يُستخدم لإرسال موجز الإدارة الصباحي إلى قيادات المدرسة عبر البريد.
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-[11px] font-semibold text-slate-600 dark:text-slate-300">
              تفعيل البريد الإلكتروني:
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
              مزود البريد الإلكتروني:
            </label>
            <select
              disabled={!isSuperAdmin}
              value={form.emailProvider || 'smtp'}
              onChange={(e) => handleFieldChange('emailProvider', e.target.value as EmailGatewayProvider)}
              className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg p-2.5 text-slate-900 dark:text-slate-100 focus:bg-white dark:focus:bg-slate-800 focus:border-indigo-500 disabled:opacity-60 disabled:cursor-not-allowed"
            >
              <option value="smtp">SMTP (خادم بريد المدرسة)</option>
              <option value="resend">Resend (واجهة برمجية)</option>
              <option value="sendgrid">SendGrid (واجهة برمجية)</option>
            </select>
          </div>

          {/* From Email */}
          <div>
            <label className="font-semibold text-slate-700 dark:text-slate-300 block mb-1">
              عنوان المرسل (From Email):
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
              اسم المرسل (From Name):
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
                خادم SMTP (Host):
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
                المنفذ (Port):
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
                اتصال آمن (TLS/SSL)
              </label>
            </div>
            <div>
              <label className="font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                اسم المستخدم (SMTP User):
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
                كلمة مرور SMTP:
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
              مفتاح الواجهة البرمجية (Email API Key):
            </label>
            <div className="relative flex items-center">
              <input
                type={showEmailApiKey ? 'text' : 'password'}
                disabled={!isSuperAdmin}
                value={form.emailApiKey || ''}
                onChange={(e) => handleFieldChange('emailApiKey', e.target.value)}
                placeholder="أدخل مفتاح الـ API..."
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
            سجل التوثيق: تم الضبط الأخير بواسطة{' '}
            <strong className="text-slate-700 dark:text-slate-300">
              {gatewayConfig.lastConfiguredByRole === 'super_admin' ? 'مالك المنصة (The Owner)' : 'مسؤول النظام'}
            </strong>
            {gatewayConfig.lastConfiguredByEmail && ` (${gatewayConfig.lastConfiguredByEmail})`}
            {gatewayConfig.lastConfiguredAt && (
              <span className="font-mono mr-1">
                بتاريخ: {new Date(gatewayConfig.lastConfiguredAt).toLocaleString('ar-SA')}
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
            <span>حفظ واعتماد التغييرات</span>
          </button>
        )}
      </div>
    </div>
  );
};

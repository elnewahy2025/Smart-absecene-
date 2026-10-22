import React, { useState } from 'react';
import { MessageSquare, Key, Eye, EyeOff, Sparkles, ExternalLink } from 'lucide-react';
import type { SchoolMessagingGatewayConfig } from '../../types/attendance';
import {
  formatWhatsAppInternationalPhone,
  openWhatsAppDirect,
} from '../../utils/whatsappUtils';

interface WhatsAppGatewaySectionProps {
  form: SchoolMessagingGatewayConfig;
  lang: string;
  isSuperAdmin: boolean;
  schoolName: string;
  defaultCallingCode: string;
  handleFieldChange: <K extends keyof SchoolMessagingGatewayConfig>(
    field: K,
    value: SchoolMessagingGatewayConfig[K]
  ) => void;
}

export const WhatsAppGatewaySection: React.FC<WhatsAppGatewaySectionProps> = ({
  form,
  lang,
  isSuperAdmin,
  schoolName,
  defaultCallingCode,
  handleFieldChange,
}) => {
  const [showToken, setShowToken] = useState(false);
  const [testPhoneNumber, setTestPhoneNumber] = useState('');

  const cleanCountryCode = defaultCallingCode.replace(/[^\d]/g, '') || '966';

  const internationalFormatted = formatWhatsAppInternationalPhone(
    form.whatsappPhoneNumber,
    cleanCountryCode
  );

  const handleTestWhatsAppWeb = () => {
    const targetPhone = testPhoneNumber.trim() || form.whatsappPhoneNumber || '0501234567';
    const testMessage = lang === 'ar'
      ? `السلام عليكم ورحمة الله، هذه رسالة تجريبية من بوابة واتساب لمدرسة ${schoolName} عبر نظام الحضور والغياب الذكي.`
      : `Peace be upon you and the mercy of Allah. This is a test message from the WhatsApp gateway for ${schoolName} school via the smart attendance system.`;
    openWhatsAppDirect(targetPhone, testMessage, cleanCountryCode);
  };

  return (
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
  );
};

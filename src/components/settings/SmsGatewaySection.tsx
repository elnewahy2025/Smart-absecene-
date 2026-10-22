import React, { useState } from 'react';
import { Phone, Eye, EyeOff } from 'lucide-react';
import type { SchoolMessagingGatewayConfig, SmsGatewayProvider } from '../../types/attendance';

interface SmsGatewaySectionProps {
  form: SchoolMessagingGatewayConfig;
  lang: string;
  isSuperAdmin: boolean;
  handleFieldChange: <K extends keyof SchoolMessagingGatewayConfig>(
    field: K,
    value: SchoolMessagingGatewayConfig[K]
  ) => void;
}

export const SmsGatewaySection: React.FC<SmsGatewaySectionProps> = ({
  form,
  lang,
  isSuperAdmin,
  handleFieldChange,
}) => {
  const [showApiKey, setShowApiKey] = useState(false);
  const [showApiSecret, setShowApiSecret] = useState(false);

  return (
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
  );
};

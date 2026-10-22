import React, { useState } from 'react';
import { Eye, EyeOff, Mail } from 'lucide-react';
import type { EmailGatewayProvider, SchoolMessagingGatewayConfig } from '../../types/attendance';

interface EmailGatewaySectionProps {
  form: SchoolMessagingGatewayConfig;
  handleFieldChange: <K extends keyof SchoolMessagingGatewayConfig>(
    field: K,
    value: SchoolMessagingGatewayConfig[K]
  ) => void;
  lang: 'ar' | 'en';
  isSuperAdmin: boolean;
  schoolName: string;
}

// SECTION 3: EMAIL TRANSPORT (used by the daily executive digest)
export const EmailGatewaySection: React.FC<EmailGatewaySectionProps> = ({
  form,
  handleFieldChange,
  lang,
  isSuperAdmin,
  schoolName,
}) => {
  const [showSmtpPass, setShowSmtpPass] = useState(false);
  const [showEmailApiKey, setShowEmailApiKey] = useState(false);

  return (
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
  );
};

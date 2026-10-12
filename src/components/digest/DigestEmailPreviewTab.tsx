import React from 'react';
import { DailyEmailDigestItem, DailyEmailDigestConfig } from '../../types/attendance';
import {
  Monitor,
  Smartphone,
  Copy,
  Check,
  Send,
} from 'lucide-react';

interface DigestEmailPreviewTabProps {
  currentDigest: DailyEmailDigestItem | null;
  digestConfig: DailyEmailDigestConfig;
  dispatching: boolean;
  previewDevice: 'desktop' | 'mobile';
  copiedHtml: boolean;
  onSetPreviewDevice: (device: 'desktop' | 'mobile') => void;
  onCopyHtml: () => void;
  onSendDigestNow: () => void;
  lang: string;
}

export const DigestEmailPreviewTab: React.FC<DigestEmailPreviewTabProps> = ({
  currentDigest,
  digestConfig,
  dispatching,
  previewDevice,
  copiedHtml,
  onSetPreviewDevice,
  onCopyHtml,
  onSendDigestNow,
  lang,
}) => {
  return (
    <div className="space-y-4">
      <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-xs flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <span className="text-xs font-bold text-slate-700">
            {lang === 'ar' ? 'عرض الجهاز للمعاينة:' : 'Preview Device:'}
          </span>
          <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-lg">
            <button
              onClick={() => onSetPreviewDevice('desktop')}
              className={`flex items-center gap-1 px-3 py-1 rounded-md text-xs font-semibold cursor-pointer ${
                previewDevice === 'desktop'
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Monitor className="w-3.5 h-3.5" />
              <span>{lang === 'ar' ? 'سطح المكتب (Outlook/Gmail)' : 'Desktop'}</span>
            </button>
            <button
              onClick={() => onSetPreviewDevice('mobile')}
              className={`flex items-center gap-1 px-3 py-1 rounded-md text-xs font-semibold cursor-pointer ${
                previewDevice === 'mobile'
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Smartphone className="w-3.5 h-3.5" />
              <span>{lang === 'ar' ? 'الهاتف المحمول' : 'Mobile'}</span>
            </button>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={onCopyHtml}
            className="flex items-center gap-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 px-3 py-1.5 rounded-lg text-xs font-semibold cursor-pointer transition-colors"
          >
            {copiedHtml ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
            <span>
              {copiedHtml
                ? lang === 'ar'
                  ? 'تم نسخ كود HTML'
                  : 'HTML Copied'
                : lang === 'ar'
                ? 'نسخ كود البريد (HTML)'
                : 'Copy HTML'}
            </span>
          </button>

          <button
            disabled={dispatching}
            onClick={onSendDigestNow}
            className="flex items-center gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white px-3.5 py-1.5 rounded-lg text-xs font-bold cursor-pointer transition-colors disabled:opacity-50"
          >
            <Send className="w-3.5 h-3.5" />
            <span>
              {dispatching
                ? lang === 'ar'
                  ? 'جارٍ الإرسال...'
                  : 'Sending...'
                : lang === 'ar'
                ? 'إرسال تجريبي الآن'
                : 'Send Test Now'}
            </span>
          </button>
        </div>
      </div>

      {/* Simulated Email Client Container */}
      <div className="bg-slate-200 p-4 sm:p-6 rounded-2xl border border-slate-300 flex justify-center">
        <div
          className={`bg-white rounded-xl shadow-lg border border-slate-300 overflow-hidden transition-all duration-300 ${
            previewDevice === 'desktop' ? 'w-full max-w-4xl' : 'w-full max-w-sm'
          }`}
        >
          {/* Email Client Header Toolbar */}
          <div className="bg-slate-100 border-b border-slate-200 px-4 py-3 space-y-2 text-xs">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-slate-500 font-mono text-[11px]">
                <span className="w-3 h-3 rounded-full bg-red-400 inline-block" />
                <span className="w-3 h-3 rounded-full bg-amber-400 inline-block" />
                <span className="w-3 h-3 rounded-full bg-emerald-400 inline-block" />
                <span className="mr-2">
                  {lang === 'ar'
                    ? 'تطبيق البريد الإلكتروني الرسمي لنظام مدرستي حضور'
                    : 'Smart Attendance Official Email Client'}
                </span>
              </div>
              <span className="text-slate-400 text-[10px]">
                {lang === 'ar' ? '⏰ صادر في 06:45 صباحاً' : '⏰ Sent at 06:45 AM'}
              </span>
            </div>

            <div className="bg-white rounded-lg p-2.5 border border-slate-200 space-y-1.5">
              <div className="flex items-center gap-2 text-slate-600">
                <span className="font-bold text-slate-800 w-16">{lang === 'ar' ? 'من:' : 'From:'}</span>
                <span>نظام مدرستي حضور &lt;attendance-digest@andalus.edu.sa&gt;</span>
              </div>
              <div className="flex items-start gap-2 text-slate-600">
                <span className="font-bold text-slate-800 w-16 shrink-0">{lang === 'ar' ? 'إلى:' : 'To:'}</span>
                <span className="text-[11px] text-slate-700">
                  {currentDigest?.recipients.join('، ') || digestConfig.recipients.join('، ')}
                </span>
              </div>
              <div className="flex items-center gap-2 text-slate-600">
                <span className="font-bold text-slate-800 w-16">{lang === 'ar' ? 'الموضوع:' : 'Subject:'}</span>
                <span className="font-bold text-slate-900">{currentDigest?.subject}</span>
              </div>
            </div>
          </div>

          {/* Rendered HTML Body */}
          <div className="p-4 sm:p-6 bg-white overflow-y-auto max-h-[750px]">
            {currentDigest?.htmlContent ? (
              <div
                dangerouslySetInnerHTML={{ __html: currentDigest.htmlContent }}
                className="email-render-container"
              />
            ) : (
              <div className="p-8 text-center text-slate-500 text-xs">
                {lang === 'ar' ? 'لا يوجد محتوى للمعاينة حالياً.' : 'No email content to preview.'}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

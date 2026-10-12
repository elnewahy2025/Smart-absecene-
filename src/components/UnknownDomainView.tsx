import React from 'react';
import { AlertTriangle, Globe, ArrowRight, ShieldAlert } from 'lucide-react';

interface UnknownDomainViewProps {
  hostname: string;
  reason?: 'unknown_domain' | 'inactive_tenant';
}

export const UnknownDomainView: React.FC<UnknownDomainViewProps> = ({
  hostname,
  reason = 'unknown_domain',
}) => {
  const isInactive = reason === 'inactive_tenant';

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 flex items-center justify-center p-4 font-['Cairo',sans-serif]" dir="rtl">
      <div className="max-w-md w-full bg-slate-800/90 border border-slate-700/80 rounded-2xl p-8 shadow-2xl text-center backdrop-blur-md">
        <div className="w-16 h-16 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-amber-400 mx-auto flex items-center justify-center mb-6 shadow-inner">
          {isInactive ? <ShieldAlert className="w-8 h-8" /> : <AlertTriangle className="w-8 h-8" />}
        </div>

        <h1 className="text-xl font-bold text-white mb-2">
          {isInactive ? 'المدرسة غير نشطة حالياً' : 'النطاق غير مسجل في النظام'}
        </h1>
        <p className="text-sm text-slate-400 mb-6">
          {isInactive
            ? 'تم إيقاف اشتراك أو تفعيل هذه المنشأة التعليمية مؤقتاً. يرجى التواصل مع إدارة النظام.'
            : 'لم نتمكن من العثور على مدرسة مرتبطة بهذا النطاق أو العنوان الإلكتروني.'}
        </p>

        <div className="bg-slate-950/70 border border-slate-800 rounded-xl p-3.5 mb-6 text-xs text-slate-300 font-mono flex items-center justify-center gap-2" dir="ltr">
          <Globe className="w-4 h-4 text-slate-500" />
          <span className="font-semibold text-amber-300 truncate max-w-[280px]">{hostname}</span>
        </div>

        <div className="border-t border-slate-700/60 pt-6 flex flex-col gap-3">
          <a
            href="/"
            onClick={(e) => {
              // If on a subdomain, redirect to localhost root or apex domain
              if (window.location.port) {
                window.location.href = `http://localhost:${window.location.port}`;
                e.preventDefault();
              }
            }}
            className="w-full inline-flex items-center justify-center gap-2 bg-emerald-600 hover:bg-emerald-500 text-white font-semibold py-2.5 px-4 rounded-xl text-sm transition-colors shadow-md cursor-pointer"
          >
            <span>الانتقال إلى البوابة الرئيسية للمنصة</span>
            <ArrowRight className="w-4 h-4 rotate-180" />
          </a>

          <p className="text-[11px] text-slate-500 mt-2">
            إذا كنت مديراً لهذه المدرسة، يرجى التحقق من إعدادات الـ DNS أو ربط النطاق المخصص في لوحة التحكم المركزية.
          </p>
        </div>
      </div>
    </div>
  );
};

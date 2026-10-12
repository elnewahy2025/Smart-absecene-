import React from 'react';
import { TENANT_REGISTRY } from '../config/tenantRegistry';
import { Building2, ExternalLink, ShieldCheck, Sparkles, MapPin, Calendar } from 'lucide-react';

interface PlatformRootViewProps {
  onSelectLocalDevTenant?: (tenantId: string) => void;
}

export const PlatformRootView: React.FC<PlatformRootViewProps> = ({ onSelectLocalDevTenant }) => {
  const isLocalDev = typeof window !== 'undefined' && (
    window.location.hostname === 'localhost' ||
    window.location.hostname === '127.0.0.1'
  );
  const port = typeof window !== 'undefined' && window.location.port ? `:${window.location.port}` : '';

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-['Cairo',sans-serif]" dir="rtl">
      {/* Platform Header */}
      <header className="border-b border-slate-800 bg-slate-900/60 backdrop-blur-md sticky top-0 z-30">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-linear-to-br from-emerald-500 to-teal-700 text-white flex items-center justify-center font-black text-xl shadow-lg shadow-emerald-900/30">
              ح
            </div>
            <div>
              <div className="font-bold text-white text-base leading-tight">منصة مدرستي حضور المركزية</div>
              <div className="text-xs text-slate-400">بوابة الدخول الموحدة للمدارس الشريكة</div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 px-3 py-1 rounded-full flex items-center gap-1.5 font-medium">
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>نطاقات مخصصة معزولة</span>
            </span>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <main className="flex-1 max-w-6xl w-full mx-auto px-4 sm:px-6 py-12 flex flex-col items-center">
        <div className="text-center max-w-2xl mb-12">
          <div className="inline-flex items-center gap-2 bg-slate-800/80 border border-slate-700 px-3.5 py-1.5 rounded-full text-xs text-emerald-400 font-semibold mb-4">
            <Sparkles className="w-3.5 h-3.5" />
            <span>نظام الحضور الذكي متعدد المدارس (Multi-Tenant Architecture)</span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight mb-4">
            اختر مدرستك للانتقال إلى بوابتها الرقمية
          </h1>
          <p className="text-slate-400 text-sm sm:text-base leading-relaxed">
            وفق معايير الأمن السيبراني وعزل البيانات، تملك كل منشأة تعليمية نطاقاً خاصاً بها
            يضمن حماية السجلات وحصر الصلاحيات داخل المؤسسة.
          </p>
        </div>

        {/* Registered Schools Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 w-full max-w-4xl">
          {Object.values(TENANT_REGISTRY).map((tenant) => {
            const devUrl = `http://${tenant.subdomain}.localhost${port}`;
            const prodUrl = `https://${tenant.subdomain}.smartschool.com`;
            const customUrl = tenant.customDomains[0] ? `https://${tenant.customDomains[0]}` : null;
            const targetUrl = isLocalDev ? devUrl : prodUrl;

            return (
              <div
                key={tenant.tenantId}
                className="bg-slate-900 border border-slate-800 hover:border-slate-700 rounded-2xl p-6 transition-all duration-200 hover:shadow-xl hover:shadow-emerald-950/20 flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-start justify-between gap-4 mb-4">
                    <div
                      className="w-12 h-12 rounded-xl flex items-center justify-center font-bold text-xl text-white shadow-md"
                      style={{ backgroundColor: tenant.primaryColor }}
                    >
                      {tenant.logoText}
                    </div>
                    <span className="text-[11px] font-mono bg-slate-800 border border-slate-700 text-slate-300 px-2.5 py-0.5 rounded-md">
                      {tenant.code}
                    </span>
                  </div>

                  <h2 className="text-lg font-bold text-white mb-2">{tenant.nameAr}</h2>
                  <p className="text-xs text-slate-400 mb-4">{tenant.nameEn}</p>

                  <div className="space-y-2 text-xs text-slate-300 border-t border-slate-800/80 pt-4 mb-6">
                    <div className="flex items-center gap-2">
                      <MapPin className="w-3.5 h-3.5 text-slate-500" />
                      <span>{tenant.cityAr} - المملكة العربية السعودية</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Calendar className="w-3.5 h-3.5 text-slate-500" />
                      <span>{tenant.academicYear} · {tenant.currentTerm}</span>
                    </div>
                  </div>
                </div>

                <div className="space-y-2.5 pt-2">
                  <a
                    href={targetUrl}
                    className="w-full inline-flex items-center justify-center gap-2 bg-emerald-600 hover:bg-emerald-500 text-white font-semibold py-2.5 px-4 rounded-xl text-xs transition-colors shadow-sm cursor-pointer"
                  >
                    <span>الدخول لبوابة المدرسة</span>
                    <ExternalLink className="w-3.5 h-3.5" />
                  </a>

                  {isLocalDev && onSelectLocalDevTenant && (
                    <button
                      onClick={() => onSelectLocalDevTenant(tenant.tenantId)}
                      className="w-full text-center text-slate-400 hover:text-white bg-slate-800/60 hover:bg-slate-800 border border-slate-700/60 py-2 rounded-xl text-xs font-medium transition-colors cursor-pointer"
                    >
                      معاينة في الوضع المحلي على نفس المنفذ ({tenant.tenantId})
                    </button>
                  )}

                  {customUrl && (
                    <div className="text-[11px] text-slate-500 font-mono text-center truncate pt-1" dir="ltr">
                      Custom: {tenant.customDomains[0]}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-900 py-6 text-xs text-slate-500 text-center">
        منصة مدرستي حضور © 2026 · نظام التحضير الذكي الشامل والتحقق من هوية النطاقات
      </footer>
    </div>
  );
};

import React, { useState } from 'react';
import { UserProfile } from '../types/attendance';
import { useAttendance } from '../context/AttendanceContext';
import {
  Lock,
  Mail,
  Building2,
  AlertCircle,
  LogIn,
} from 'lucide-react';

import {
  isLocalDevelopmentHost,
  getDevTestTenants,
  switchDevTestTenant,
  resolveTenantFromHostname,
} from '../config/tenantRegistry';

interface LoginPageProps {
  onLoginSuccess: (user: UserProfile) => void;
}

export const LoginPage: React.FC<LoginPageProps> = ({ onLoginSuccess }) => {
  const { currentTenant, tenantDomainConfig, signInWithCredentials } = useAttendance();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [authLoading, setAuthLoading] = useState(false);

  const host = typeof window !== 'undefined' ? window.location.hostname : '';
  const search = typeof window !== 'undefined' ? window.location.search : '';
  const isDevHost = isLocalDevelopmentHost(host);
  const devTenants = isDevHost ? getDevTestTenants() : [];

  // The login screen always reflects the school requested by the address bar
  // (?tenant=... / ?school=... or the hostname), never a previous session.
  const resolution = resolveTenantFromHostname(host, search);
  const addressBarConfig = resolution.status === 'resolved' ? resolution.config : undefined;
  const activeConfig = addressBarConfig || tenantDomainConfig;
  const displayTenant = addressBarConfig
    ? {
        id: addressBarConfig.tenantId,
        name: addressBarConfig.nameAr,
        code: addressBarConfig.code,
        city: addressBarConfig.cityAr,
        academicYear: addressBarConfig.academicYear,
      }
    : currentTenant;

  // Perform Login using Firebase Credentials with Hybrid Fallback
  const handleAuthenticate = async (targetEmail: string, targetPass: string) => {
    setErrorMsg(null);
    setAuthLoading(true);
    try {
      const result = await signInWithCredentials(targetEmail, targetPass);
      if (result.success && result.user) {
        onLoginSuccess(result.user);
      } else {
        setErrorMsg(result.error || 'اسم المستخدم أو كلمة المرور غير صحيحة.');
      }
    } catch (err: any) {
      setErrorMsg(err?.message || 'حدث خطأ أثناء محاولة تسجيل الدخول.');
    } finally {
      setAuthLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 flex flex-col justify-center py-12 sm:px-6 lg:px-8 font-['Cairo',sans-serif]" dir="rtl">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        {/* School Branding - Locked to Hostname */}
        <div className="text-center">
          <div
            className="w-16 h-16 rounded-2xl mx-auto flex items-center justify-center font-black text-2xl text-white shadow-xl mb-4"
            style={{ backgroundColor: activeConfig?.primaryColor || '#059669' }}
          >
            {activeConfig?.logoText || displayTenant.name.charAt(0)}
          </div>
          <h2 className="text-2xl font-extrabold text-white tracking-tight">
            {displayTenant.name}
          </h2>
          <div className="mt-1 flex items-center justify-center gap-2 text-xs text-slate-400">
            <span>{displayTenant.city}</span>
            <span>·</span>
            <span className="font-mono text-emerald-400">{displayTenant.code}</span>
            <span>·</span>
            <span>{displayTenant.academicYear}</span>
          </div>
        </div>

        {/* Security Notice: Automatic Domain Resolution Badge */}
        <div className="mt-4 mx-4 sm:mx-0 bg-slate-800/80 border border-slate-700/80 rounded-xl px-3.5 py-2 flex items-center justify-between text-xs text-slate-300">
          <div className="flex items-center gap-2">
            <Building2 className="w-4 h-4 text-emerald-400" />
            <span>بوابة معزولة ومخصصة للمدرسة</span>
          </div>
          <span className="bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-[10px] px-2 py-0.5 rounded font-mono">
            {displayTenant.id}
          </span>
        </div>
      </div>

      {/* [TESTING / DEV ONLY - TO BE REMOVED/DISABLED IN PRODUCTION] Mobile & Local LAN School Switcher */}
      {isDevHost && (
        <div className="mt-4 sm:mx-auto sm:w-full sm:max-w-md px-4 sm:px-0">
          <div className="bg-amber-950/40 border border-amber-500/40 rounded-2xl p-3.5 backdrop-blur-md shadow-lg text-amber-200">
            <div className="flex items-center justify-between gap-2 mb-2">
              <span className="font-bold text-xs flex items-center gap-1.5 text-amber-300">
                <span>🧪</span>
                <span>بيئة التجربة والاختبار المحلي (Dev Testing Only)</span>
              </span>
              <span className="text-[10px] bg-amber-500/20 text-amber-300 font-mono px-2 py-0.5 rounded border border-amber-500/30">
                LAN Wi-Fi
              </span>
            </div>

            <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2">
              <div className="flex items-center gap-2 flex-1">
                <label className="text-[11px] text-slate-300 shrink-0 font-medium">المدرسة:</label>
                <select
                  value={currentTenant.id}
                  onChange={(e) => switchDevTestTenant(e.target.value)}
                  className="bg-slate-900 border border-amber-500/40 rounded-xl px-2.5 py-1.5 text-white text-xs font-semibold focus:outline-hidden focus:ring-1 focus:ring-amber-500 w-full cursor-pointer"
                >
                  {devTenants.map((t) => (
                    <option key={t.tenantId} value={t.tenantId}>
                      {t.nameAr} ({t.subdomain})
                    </option>
                  ))}
                </select>
              </div>
            </div>
            <p className="text-[10px] text-amber-400/80 mt-2 leading-relaxed">
              * مخصص للتجربة واختبار الموبايل فقط، ويتم حذفه تلقائياً عند النشر السحابي الفعلي.
            </p>
          </div>
        </div>
      )}

      <div className="mt-4 sm:mx-auto sm:w-full sm:max-w-md px-4 sm:px-0">
        <div className="bg-slate-800/90 border border-slate-700/90 py-8 px-6 sm:px-10 shadow-2xl rounded-2xl backdrop-blur-md">
          {/* Error Message Alert */}
          {errorMsg && (
            <div className="mb-4 bg-red-950/80 border border-red-800/80 rounded-xl p-3 text-xs text-red-200 flex items-start gap-2.5 animate-shake">
              <AlertCircle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* Form */}
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleAuthenticate(email, password);
            }}
            className="space-y-4"
            autoComplete="off"
          >
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">
                البريد الإلكتروني المعتمد
              </label>
              <div className="relative rounded-xl shadow-xs">
                <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none text-slate-400">
                  <Mail className="w-4 h-4" />
                </div>
                <input
                  type="email"
                  required
                  autoComplete="off"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder={`user@${activeConfig?.subdomain || 'school'}.edu.sa`}
                  className="block w-full pr-10 pl-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-hidden focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">
                كلمة المرور
              </label>
              <div className="relative rounded-xl shadow-xs">
                <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none text-slate-400">
                  <Lock className="w-4 h-4" />
                </div>
                <input
                  type="password"
                  required
                  autoComplete="new-password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="block w-full pr-10 pl-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-hidden focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={authLoading}
              className="w-full flex items-center justify-center gap-2 py-2.5 px-4 border border-transparent rounded-xl shadow-md text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-500 focus:outline-hidden focus:ring-2 focus:ring-offset-2 focus:ring-emerald-500 transition-all cursor-pointer disabled:opacity-50"
            >
              {authLoading ? (
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <LogIn className="w-4 h-4" />
              )}
              <span>{authLoading ? 'جاري التحقق...' : 'تسجيل الدخول إلى البوابة'}</span>
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

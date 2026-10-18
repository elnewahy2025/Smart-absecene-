import React, { useState } from 'react';
import { UserRole, UserProfile } from '../types/attendance';
import { useAttendance } from '../context/AttendanceContext';
import {
  ShieldCheck,
  Lock,
  Mail,
  UserCheck,
  Building2,
  AlertCircle,
  GraduationCap,
  Users2,
  Flame,
  LogIn,
} from 'lucide-react';

import {
  isLocalDevelopmentHost,
  getDevTestTenants,
  switchDevTestTenant,
} from '../config/tenantRegistry';

interface LoginPageProps {
  onLoginSuccess: (user: UserProfile) => void;
}

export const LoginPage: React.FC<LoginPageProps> = ({ onLoginSuccess }) => {
  const { currentTenant, tenantDomainConfig, signInWithGoogle, signInWithCredentials, users } = useAttendance();
  const [selectedRole, setSelectedRole] = useState<UserRole>('admin');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [authLoading, setAuthLoading] = useState(false);
  const platformOwnerEmail = ((import.meta as any).env?.VITE_PLATFORM_OWNER_EMAIL || '').toLowerCase();

  // [TESTING / DEV ONLY - TO BE REMOVED/DISABLED IN PRODUCTION]
  const host = typeof window !== 'undefined' ? window.location.hostname : '';
  const isDevHost = isLocalDevelopmentHost(host);
  const devTenants = isDevHost ? getDevTestTenants() : [];

  // Filter valid users belonging STRICTLY to currentTenant (includes dynamically created staff from Settings)
  const tenantUsers = (users || []).filter((u) => u.tenantId === currentTenant.id);

  const roleLabels: Record<UserRole, { ar: string; en: string; descAr: string; icon: any }> = {
    super_admin: {
      ar: 'مالك المنصة',
      en: 'Platform Owner',
      descAr: 'صلاحيات الإشراف الشاملة وتأسيس المدارس على مستوى المنصة السحابية',
      icon: <ShieldCheck className="w-4 h-4 text-amber-500" />,
    },
    admin: {
      ar: 'مدير النظام',
      en: 'System Admin',
      descAr: 'صلاحيات إدارية كاملة، إعدادات السياسات والنشرات الصباحية',
      icon: <ShieldCheck className="w-4 h-4 text-emerald-600" />,
    },
    registrar: {
      ar: 'شؤون الطلاب',
      en: 'Student Registrar',
      descAr: 'إدارة الطلاب، اعتماد الأعذار، وإعادة فتح الجلسات',
      icon: <Users2 className="w-4 h-4 text-blue-600" />,
    },
    teacher: {
      ar: 'معلم الفصل',
      en: 'Teacher',
      descAr: 'تحضير الفصول المسندة ورصد الحضور اليومي والحصص',
      icon: <GraduationCap className="w-4 h-4 text-indigo-600" />,
    },
    parent: {
      ar: 'ولي أمر',
      en: 'Parent / Guardian',
      descAr: 'متابعة سجل غياب الأبناء وتقديم الأعذار الطبية',
      icon: <UserCheck className="w-4 h-4 text-amber-600" />,
    },
  };

  const handleRoleSelect = (role: UserRole) => {
    setSelectedRole(role);
    setErrorMsg(null);
  };

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
            style={{ backgroundColor: tenantDomainConfig?.primaryColor || '#059669' }}
          >
            {tenantDomainConfig?.logoText || currentTenant.name.charAt(0)}
          </div>
          <h2 className="text-2xl font-extrabold text-white tracking-tight">
            {currentTenant.name}
          </h2>
          <div className="mt-1 flex items-center justify-center gap-2 text-xs text-slate-400">
            <span>{currentTenant.city}</span>
            <span>·</span>
            <span className="font-mono text-emerald-400">{currentTenant.code}</span>
            <span>·</span>
            <span>{currentTenant.academicYear}</span>
          </div>
        </div>

        {/* Security Notice: Automatic Domain Resolution Badge */}
        <div className="mt-4 mx-4 sm:mx-0 bg-slate-800/80 border border-slate-700/80 rounded-xl px-3.5 py-2 flex items-center justify-between text-xs text-slate-300">
          <div className="flex items-center gap-2">
            <Building2 className="w-4 h-4 text-emerald-400" />
            <span>بوابة معزولة ومخصصة للمدرسة</span>
          </div>
          <span className="bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-[10px] px-2 py-0.5 rounded font-mono">
            {currentTenant.id}
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

              {/* Quick 1-tap fill for Platform Owner on Mobile */}
              <button
                type="button"
                onClick={() => {
                  if (!platformOwnerEmail) return;
                  setEmail(platformOwnerEmail);
                  setSelectedRole('super_admin');
                }}
                className="text-[11px] bg-amber-600/30 hover:bg-amber-600/50 text-amber-200 border border-amber-500/40 px-3 py-1.5 rounded-xl font-bold transition-colors cursor-pointer text-center shrink-0"
                title="تعبئة بيانات مالك المنصة لتسريع التجربة على الموبايل"
              >
                👑 مالك المنصة (Owner)
              </button>
            </div>
            <p className="text-[10px] text-amber-400/80 mt-2 leading-relaxed">
              * مخصص للتجربة واختبار الموبايل فقط، ويتم حذفه تلقائياً عند النشر السحابي الفعلي.
            </p>
          </div>
        </div>
      )}

      <div className="mt-4 sm:mx-auto sm:w-full sm:max-w-md px-4 sm:px-0">
        <div className="bg-slate-800/90 border border-slate-700/90 py-8 px-6 sm:px-10 shadow-2xl rounded-2xl backdrop-blur-md">
          {/* Role Tabs */}
          <div className="mb-6">
            <label className="block text-xs font-semibold text-slate-300 mb-2">
              اختر دورك لتسجيل الدخول:
            </label>
            <div className="grid grid-cols-2 gap-2">
              {((isDevHost ? ['admin', 'registrar', 'teacher', 'parent', 'super_admin'] : ['admin', 'registrar', 'teacher', 'parent']) as UserRole[]).map((r) => {
                const isSelected = selectedRole === r;
                const isSpanFull = r === 'super_admin';
                return (
                  <button
                    key={r}
                    type="button"
                    onClick={() => handleRoleSelect(r)}
                    className={`flex items-center gap-2 p-2.5 rounded-xl border text-xs font-semibold transition-all cursor-pointer text-right ${
                      isSpanFull ? 'col-span-2' : ''
                    } ${
                      isSelected
                        ? 'bg-slate-700/90 border-emerald-500 text-white shadow-sm ring-1 ring-emerald-500'
                        : 'bg-slate-900/50 border-slate-700/70 text-slate-400 hover:text-white hover:border-slate-600'
                    }`}
                  >
                    <div className="p-1 rounded-lg bg-slate-800 shrink-0">
                      {roleLabels[r].icon}
                    </div>
                    <div className="truncate">
                      <div className="leading-tight">{roleLabels[r].ar}</div>
                      <div className="text-[10px] text-slate-400 font-normal truncate">{roleLabels[r].en}</div>
                    </div>
                  </button>
                );
              })}
            </div>
            <p className="text-[11px] text-slate-400 mt-2 px-1">
              {roleLabels[selectedRole].descAr}
            </p>
          </div>

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
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder={`user@${currentTenant.id === 'school-1' ? 'andalus' : 'falah'}-school.edu.sa`}
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

          {/* Google / Firebase SSO Option */}
          <div className="relative my-4">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-slate-700/80" />
            </div>
            <div className="relative flex justify-center text-[11px]">
              <span className="bg-slate-800 px-2 text-slate-400">أو عبر الحساب السحابي المعتمد</span>
            </div>
          </div>

          <button
            type="button"
            disabled={authLoading}
            onClick={async () => {
              setAuthLoading(true);
              setErrorMsg(null);
              try {
                const cred = await signInWithGoogle();
                if (cred?.user) {
                  const googleEmail = cred.user.email?.toLowerCase();

                  // Check if Platform Owner
                  if (platformOwnerEmail && googleEmail === platformOwnerEmail) {
                    const ownerUser: UserProfile = {
                      id: cred.user.uid,
                      tenantId: 'platform',
                      name: cred.user.displayName || '',
                      role: 'super_admin' as UserRole,
                      phone: cred.user.phoneNumber || '',
                      email: platformOwnerEmail,
                      status: 'active',
                    };
                    onLoginSuccess(ownerUser);
                    return;
                  }

                  const matchedUser =
                    tenantUsers.find((u) => u.email.toLowerCase() === googleEmail) ||
                    tenantUsers.find((u) => u.role === selectedRole) ||
                    tenantUsers[0] ||
                    ({
                      id: cred.user.uid,
                      tenantId: currentTenant.id,
                      name: cred.user.displayName || cred.user.email?.split('@')[0] || 'مستخدم معتمد',
                      role: selectedRole,
                      phone: cred.user.phoneNumber || '+966500000000',
                      email: cred.user.email || '',
                      status: 'active',
                    } as UserProfile);

                  onLoginSuccess(matchedUser);
                }
              } catch (err: any) {
                const code = err?.code || '';
                const currentHost = typeof window !== 'undefined' ? window.location.hostname : 'localhost';
                if (code === 'auth/unauthorized-domain') {
                  setErrorMsg(
                    `تم رفض النطاق (${currentHost}): يرجى إضافة هذا النطاق السحابي إلى قائمة النطاقات المصرح بها في كونسول Firebase (Authentication > Settings > Authorized domains).`
                  );
                } else if (code === 'auth/popup-blocked') {
                  setErrorMsg('المتصفح قام بحظر النافذة المنبثقة. جاري التحويل إلى تسجيل الدخول السحابي عبر إعادة التوجيه...');
                  try {
                    await signInWithGoogle(true);
                  } catch (redirectErr: any) {
                    setErrorMsg('تعذر الدخول السحابي: ' + (redirectErr?.message || 'يرجى المحاولة مجدداً'));
                  }
                } else if (code === 'auth/popup-closed-by-user') {
                  setErrorMsg('تم إغلاق نافذة الدخول قبل اختيار حساب Google. يمكنك المحاولة مرة أخرى.');
                } else if (code === 'auth/operation-not-allowed') {
                  setErrorMsg('مزود Google غير مفعّل في كونسول Firebase (Authentication > Sign-in method > Google).');
                } else {
                  setErrorMsg(
                    `تعذر الدخول السحابي (${code || 'خطأ غير معروف'}): ${err?.message || 'يرجى مراجعة إعدادات Firebase Console.'}`
                  );
                }
              } finally {
                setAuthLoading(false);
              }
            }}
            className="w-full flex items-center justify-center gap-2 py-2.5 px-4 border border-slate-700/90 rounded-xl bg-slate-900/60 hover:bg-slate-900 text-xs font-semibold text-slate-200 hover:text-white hover:border-slate-600 transition-colors cursor-pointer disabled:opacity-50"
          >
            <Flame className="w-4 h-4 text-amber-500" />
            <span>الدخول الموحد بحساب Google / Firebase السحابي</span>
          </button>
        </div>
      </div>
    </div>
  );
};

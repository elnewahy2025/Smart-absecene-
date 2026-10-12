import React, { useState } from 'react';
import { UserRole, UserProfile } from '../types/attendance';
import { useAttendance } from '../context/AttendanceContext';
import { INITIAL_USERS } from '../data/mockData';
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
  CheckCircle2,
  LogIn,
} from 'lucide-react';

interface LoginPageProps {
  onLoginSuccess: (user: UserProfile) => void;
}

export const LoginPage: React.FC<LoginPageProps> = ({ onLoginSuccess }) => {
  const { currentTenant, tenantDomainConfig, lang, signInWithGoogle, firebaseUser } = useAttendance();
  const [selectedRole, setSelectedRole] = useState<UserRole>('admin');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('password123');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [authLoading, setAuthLoading] = useState(false);

  // Filter valid mock users belonging STRICTLY to currentTenant
  const tenantUsers = INITIAL_USERS.filter((u) => u.tenantId === currentTenant.id);

  const roleLabels: Record<UserRole, { ar: string; en: string; descAr: string; icon: any }> = {
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
    const userForRole = tenantUsers.find((u) => u.role === role);
    if (userForRole) {
      setEmail(userForRole.email);
    }
  };

  // Perform Login with strict Tenant Membership Verification
  const handleAuthenticate = (targetEmail: string) => {
    setErrorMsg(null);
    const trimmed = targetEmail.trim().toLowerCase();

    // Check if user exists in the system
    const systemUser = INITIAL_USERS.find((u) => u.email.toLowerCase() === trimmed);

    if (!systemUser) {
      setErrorMsg('اسم المستخدم أو كلمة المرور غير صحيحة.');
      return;
    }

    // STRICT MULTI-TENANT VERIFICATION: User MUST belong to this resolved school!
    if (systemUser.tenantId !== currentTenant.id) {
      setErrorMsg(
        `تم رفض الدخول: هذا الحساب مسجل لمدرسة أخرى (${systemUser.tenantId}). لا تملك صلاحية الوصول إلى بوابة ${currentTenant.name}.`
      );
      return;
    }

    onLoginSuccess(systemUser);
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

      <div className="mt-6 sm:mx-auto sm:w-full sm:max-w-md px-4 sm:px-0">
        <div className="bg-slate-800/90 border border-slate-700/90 py-8 px-6 sm:px-10 shadow-2xl rounded-2xl backdrop-blur-md">
          {/* Role Tabs */}
          <div className="mb-6">
            <label className="block text-xs font-semibold text-slate-300 mb-2">
              اختر دورك لتسجيل الدخول:
            </label>
            <div className="grid grid-cols-2 gap-2">
              {(['admin', 'registrar', 'teacher', 'parent'] as UserRole[]).map((r) => {
                const isSelected = selectedRole === r;
                return (
                  <button
                    key={r}
                    type="button"
                    onClick={() => handleRoleSelect(r)}
                    className={`flex items-center gap-2 p-2.5 rounded-xl border text-xs font-semibold transition-all cursor-pointer text-right ${
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
              handleAuthenticate(email);
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
              className="w-full flex items-center justify-center gap-2 py-2.5 px-4 border border-transparent rounded-xl shadow-md text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-500 focus:outline-hidden focus:ring-2 focus:ring-offset-2 focus:ring-emerald-500 transition-all cursor-pointer"
            >
              <LogIn className="w-4 h-4" />
              <span>تسجيل الدخول إلى البوابة</span>
            </button>
          </form>

          {/* Quick Demo Credentials for Current School */}
          <div className="mt-6 border-t border-slate-700/80 pt-5">
            <div className="flex items-center justify-between text-xs text-slate-400 mb-2.5">
              <span className="font-semibold text-slate-300">تسجيل دخول سريع معتمد (تجريبي):</span>
              <span className="text-[10px] text-emerald-400 font-mono">نقرة واحدة</span>
            </div>
            <div className="grid grid-cols-2 gap-2">
              {tenantUsers.map((u) => (
                <button
                  key={u.id}
                  type="button"
                  onClick={() => {
                    setSelectedRole(u.role);
                    setEmail(u.email);
                    handleAuthenticate(u.email);
                  }}
                  className="p-2 rounded-xl bg-slate-900/60 hover:bg-slate-900 border border-slate-700/70 hover:border-emerald-500 text-right transition-colors cursor-pointer"
                >
                  <div className="flex items-center justify-between gap-1 mb-1">
                    <span className="text-[11px] font-bold text-white truncate">{u.name}</span>
                    <span className="text-[9px] bg-slate-800 text-slate-300 px-1 py-0.2 rounded font-mono">
                      {u.role}
                    </span>
                  </div>
                  <div className="text-[10px] text-slate-400 truncate font-mono" dir="ltr">
                    {u.email}
                  </div>
                </button>
              ))}
            </div>

            {/* Test Cross-Tenant Rejection */}
            <div className="mt-4 pt-3 border-t border-slate-700/60">
              <button
                type="button"
                onClick={() => {
                  const otherTenantId = currentTenant.id === 'school-1' ? 'school-2' : 'school-1';
                  const foreignUser = INITIAL_USERS.find((u) => u.tenantId === otherTenantId);
                  if (foreignUser) {
                    setEmail(foreignUser.email);
                    handleAuthenticate(foreignUser.email);
                  }
                }}
                className="w-full text-center text-[11px] text-amber-400/90 hover:text-amber-300 bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/30 py-1.5 px-3 rounded-lg transition-colors cursor-pointer"
              >
                اختبار محاولة دخول بحساب من مدرسة أخرى (فحص الحظر 403)
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

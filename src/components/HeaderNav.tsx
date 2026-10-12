import React, { useState } from 'react';
import { useAttendance } from '../context/AttendanceContext';
import { UserRole } from '../types/attendance';
import {
  Menu,
  Languages,
  LogOut,
  Flame,
  UserCheck,
  CalendarDays,
  Mail,
  ShieldAlert,
  Users2,
  FileCheck2,
  Send,
  BarChart3,
  Settings2,
  MessageSquare,
  Bell,
  PanelLeft,
  LayoutDashboard,
} from 'lucide-react';
import { ThemeSwitcherDropdown } from './ThemeSwitcherDropdown';

export type ActiveTab =
  | 'dashboard'
  | 'sessions'
  | 'justifications'
  | 'digest'
  | 'chatbot'
  | 'emergency'
  | 'outbox'
  | 'reports'
  | 'students'
  | 'student_inquiry'
  | 'settings'
  | 'parent_portal';

interface HeaderNavProps {
  activeTab: ActiveTab;
  setActiveTab: (tab: ActiveTab) => void;
  onSignOut?: () => void;
  onToggleSidebarMobile?: () => void;
  isSidebarCollapsed?: boolean;
  onToggleSidebarCollapse?: () => void;
}

export const HeaderNav: React.FC<HeaderNavProps> = ({
  activeTab,
  setActiveTab,
  onSignOut,
  onToggleSidebarMobile,
  isSidebarCollapsed,
  onToggleSidebarCollapse,
}) => {
  const {
    currentTenant,
    tenantDomainConfig,
    currentUser,
    lang,
    setLang,
    firebaseUser,
    signInWithGoogle,
    signOutGoogle,
  } = useAttendance();

  const [authLoading, setAuthLoading] = useState(false);

  const getPageTitle = (tab: ActiveTab): { ar: string; en: string; icon: React.ReactNode } => {
    switch (tab) {
      case 'dashboard':
        return { ar: 'لوحة القيادة والمؤشرات التنفيذية', en: 'Executive Dashboard', icon: <LayoutDashboard className="w-5 h-5 text-emerald-600" /> };
      case 'sessions':
        return { ar: 'كشوف الحضور والغياب اليومية', en: 'Daily Attendance Sessions', icon: <CalendarDays className="w-5 h-5 text-emerald-600" /> };
      case 'digest':
        return { ar: 'نشرة الصباح الاستباقية والرادار الذكي', en: 'Morning Daily Digest', icon: <Mail className="w-5 h-5 text-teal-600" /> };
      case 'emergency':
        return { ar: 'كشف الطوارئ والإخلاء ونقاط التجمع', en: 'Emergency Evacuation Roster', icon: <ShieldAlert className="w-5 h-5 text-rose-600" /> };
      case 'students':
        return { ar: 'إدارة واستيراد الطلاب والشعب', en: 'Students & Roster Registry', icon: <Users2 className="w-5 h-5 text-indigo-600" /> };
      case 'student_inquiry':
        return { ar: 'استعلام ومتابعة غياب طالب', en: 'Student Absence Inquiry', icon: <UserCheck className="w-5 h-5 text-indigo-600" /> };
      case 'justifications':
        return { ar: 'تدقيق وتحليل الأعذار بالذكاء الاصطناعي', en: 'Excuses & AI Analysis', icon: <FileCheck2 className="w-5 h-5 text-amber-600" /> };
      case 'outbox':
        return { ar: 'طابور الإشعارات والرسائل النصية والواتساب', en: 'Notification Outbox', icon: <Send className="w-5 h-5 text-sky-600" /> };
      case 'reports':
        return { ar: 'مركز التقارير والتحفيز والطباعة المجمعة', en: 'Reports & Batch Print', icon: <BarChart3 className="w-5 h-5 text-violet-600" /> };
      case 'settings':
        return { ar: 'سجل التدقيق وسياسات المنشأة والصلاحيات', en: 'Audit & School Settings', icon: <Settings2 className="w-5 h-5 text-slate-700" /> };
      case 'chatbot':
        return { ar: 'المساعد المدرسي الذكي (Gemini Assistant)', en: 'Gemini Assistant', icon: <MessageSquare className="w-5 h-5 text-purple-600" /> };
      case 'parent_portal':
        return { ar: 'بوابة ولي الأمر وإشعارات الأبناء', en: 'Parent Portal & Alerts', icon: <Bell className="w-5 h-5 text-amber-500" /> };
      default:
        return { ar: 'لوحة القيادة والمؤشرات التنفيذية', en: 'Executive Dashboard', icon: <LayoutDashboard className="w-5 h-5 text-emerald-600" /> };
    }
  };

  const currentTitle = getPageTitle(activeTab);

  return (
    <header className="sticky top-0 z-30 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border-b border-slate-200 dark:border-slate-800 shadow-2xs text-[var(--app-text-main,#0f172a)] dark:text-slate-100">
      <div className="max-w-full px-4 sm:px-6 py-2.5 flex items-center justify-between gap-3 text-xs">
        {/* Left / Right (in RTL): Menu Trigger + Breadcrumb Page Header */}
        <div className="flex items-center gap-3">
          {/* Mobile Sidebar Trigger */}
          <button
            onClick={onToggleSidebarMobile}
            className="lg:hidden p-2 text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
            title={lang === 'ar' ? 'فتح القائمة الجانبية' : 'Open Sidebar'}
          >
            <Menu className="w-5 h-5" />
          </button>

          {/* Desktop Toggle Sidebar Button */}
          {onToggleSidebarCollapse && (
            <button
              onClick={onToggleSidebarCollapse}
              className="hidden lg:flex p-1.5 text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg cursor-pointer transition-colors"
              title={isSidebarCollapsed ? (lang === 'ar' ? 'توسيع القائمة' : 'Expand') : (lang === 'ar' ? 'طي القائمة' : 'Collapse')}
            >
              <PanelLeft className="w-4 h-4" />
            </button>
          )}

          {/* Active Page Title & Indicator */}
          <div className="flex items-center gap-2">
            <span className="p-1.5 rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
              {currentTitle.icon}
            </span>
            <div>
              <h1 className="font-bold text-slate-900 dark:text-slate-100 text-sm leading-tight">
                {lang === 'ar' ? currentTitle.ar : currentTitle.en}
              </h1>
              <p className="text-[10px] text-slate-400 leading-none">
                {currentTenant.name} · {currentTenant.academicYear} ({currentTenant.currentTerm})
              </p>
            </div>
          </div>
        </div>

        {/* Right / Left (in RTL): Actions, User Role Badge, Lang & Logout */}
        <div className="flex items-center gap-2">
          {/* Active User Identity & Authenticated Role Badge (Fixed from login) */}
          <div className="flex items-center gap-2 bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 px-2.5 py-1 rounded-lg">
            <UserCheck className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400 shrink-0" />
            <div className="flex items-center gap-1.5">
              <span className="font-semibold text-slate-800 dark:text-slate-100 text-xs truncate max-w-[140px] hidden sm:inline" title={currentUser.name}>
                {currentUser.name}
              </span>
              <span
                className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                  currentUser.role === 'admin'
                    ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800'
                    : currentUser.role === 'registrar'
                    ? 'bg-blue-100 text-blue-800 dark:bg-blue-950/60 dark:text-blue-300 border border-blue-300 dark:border-blue-800'
                    : currentUser.role === 'teacher'
                    ? 'bg-indigo-100 text-indigo-800 dark:bg-indigo-950/60 dark:text-indigo-300 border border-indigo-300 dark:border-indigo-800'
                    : 'bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300 border border-amber-300 dark:border-amber-800'
                }`}
                title={lang === 'ar' ? 'الصفة / الدور المعتمد من تسجيل الدخول' : 'Authenticated Role from Login'}
              >
                {currentUser.role === 'admin'
                  ? (lang === 'ar' ? 'مدير المدرسة (Admin)' : 'Admin')
                  : currentUser.role === 'registrar'
                  ? (lang === 'ar' ? 'شؤون الطلاب (Registrar)' : 'Registrar')
                  : currentUser.role === 'teacher'
                  ? (lang === 'ar' ? 'معلم الفصل (Teacher)' : 'Teacher')
                  : (lang === 'ar' ? 'ولي أمر (Parent)' : 'Parent')}
              </span>
            </div>
          </div>

          {/* Theme & Dark Mode Switcher */}
          <ThemeSwitcherDropdown lang={lang} />

          {/* Language Toggle */}
          <button
            onClick={() => setLang(lang === 'ar' ? 'en' : 'ar')}
            className="flex items-center gap-1 text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 px-2.5 py-1 rounded-lg text-xs font-semibold cursor-pointer"
            title="تبديل اللغة / Toggle Language"
          >
            <Languages className="w-3.5 h-3.5" />
            <span>{lang === 'ar' ? 'EN' : 'عربي'}</span>
          </button>

          {/* Sign Out Button */}
          {onSignOut && (
            <button
              onClick={onSignOut}
              className="flex items-center gap-1 text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-950/50 border border-red-200 dark:border-red-900/60 px-2 py-1 rounded-lg text-xs font-semibold cursor-pointer transition-colors"
              title={lang === 'ar' ? 'تسجيل الخروج من البوابة' : 'Sign out from school portal'}
            >
              <LogOut className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">{lang === 'ar' ? 'خروج' : 'Sign out'}</span>
            </button>
          )}

          {/* Firebase Authentication Status */}
          {firebaseUser ? (
            <div className="hidden md:flex items-center gap-1.5 bg-emerald-50 border border-emerald-200 px-2 py-1 rounded-lg text-emerald-900 text-[11px]">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <span className="font-semibold max-w-[100px] truncate" title={firebaseUser.email || ''}>
                {firebaseUser.displayName || firebaseUser.email}
              </span>
              <button
                onClick={async () => {
                  try {
                    await signOutGoogle();
                  } catch (e) {
                    console.error(e);
                  }
                }}
                className="text-emerald-700 hover:text-red-600 p-0.5 cursor-pointer"
                title={lang === 'ar' ? 'تسجيل الخروج السحابي' : 'Sign out'}
              >
                <LogOut className="w-3 h-3" />
              </button>
            </div>
          ) : (
            <button
              disabled={authLoading}
              onClick={async () => {
                setAuthLoading(true);
                try {
                  await signInWithGoogle();
                } catch (e) {
                  console.error(e);
                } finally {
                  setAuthLoading(false);
                }
              }}
              className="hidden md:flex items-center gap-1 bg-amber-500 hover:bg-amber-600 text-white font-semibold px-2 py-1 rounded-lg text-[11px] shadow-2xs transition-colors cursor-pointer disabled:opacity-50"
              title={lang === 'ar' ? 'تسجيل الدخول عبر Google ومزامنة Firebase' : 'Sign in with Google'}
            >
              <Flame className="w-3.5 h-3.5" />
              <span>Firebase</span>
            </button>
          )}
        </div>
      </div>
    </header>
  );
};

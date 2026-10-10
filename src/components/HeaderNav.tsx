import React, { useState } from 'react';
import { useAttendance } from '../context/AttendanceContext';
import { UserRole } from '../types/attendance';
import {
  CalendarDays,
  FileCheck2,
  BotMessageSquare,
  ShieldAlert,
  Send,
  BarChart3,
  Users2,
  Settings2,
  Building2,
  UserCheck,
  Menu,
  X,
  Languages,
} from 'lucide-react';

export type ActiveTab =
  | 'sessions'
  | 'justifications'
  | 'chatbot'
  | 'emergency'
  | 'outbox'
  | 'reports'
  | 'students'
  | 'settings';

interface HeaderNavProps {
  activeTab: ActiveTab;
  setActiveTab: (tab: ActiveTab) => void;
}

export const HeaderNav: React.FC<HeaderNavProps> = ({ activeTab, setActiveTab }) => {
  const {
    currentTenant,
    tenants,
    setTenantId,
    currentUser,
    setUserRole,
    lang,
    setLang,
    notifications,
    justifications,
  } = useAttendance();

  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const pendingJustificationsCount = justifications.filter((j) => j.status === 'pending').length;
  const failedNotificationsCount = notifications.filter((n) => n.status === 'failed').length;

  const roleLabels: Record<UserRole, { ar: string; en: string }> = {
    admin: { ar: 'مدير المدرسة', en: 'Principal (Admin)' },
    registrar: { ar: 'شؤون الطلبة والتوجيه', en: 'Counselor / Registrar' },
    teacher: { ar: 'معلم المادة', en: 'Teacher' },
    parent: { ar: 'ولي أمر', en: 'Parent' },
  };

  const navItems: { id: ActiveTab; labelAr: string; labelEn: string; icon: React.ReactNode; badge?: number }[] = [
    {
      id: 'sessions',
      labelAr: 'كشوف الحضور والغياب',
      labelEn: 'Attendance Sessions',
      icon: <CalendarDays className="w-4 h-4" />,
    },
    {
      id: 'justifications',
      labelAr: 'تدقيق وتحليل الأعذار',
      labelEn: 'Excuses & AI Analysis',
      icon: <FileCheck2 className="w-4 h-4" />,
      badge: pendingJustificationsCount > 0 ? pendingJustificationsCount : undefined,
    },
    {
      id: 'chatbot',
      labelAr: 'المساعد المدرسي الذكي',
      labelEn: 'Gemini Assistant',
      icon: <BotMessageSquare className="w-4 h-4" />,
    },
    {
      id: 'emergency',
      labelAr: 'كشف الطوارئ والإخلاء',
      labelEn: 'Emergency Roster',
      icon: <ShieldAlert className="w-4 h-4" />,
    },
    {
      id: 'outbox',
      labelAr: 'طابور الإشعارات والرسائل',
      labelEn: 'Notification Outbox',
      icon: <Send className="w-4 h-4" />,
      badge: failedNotificationsCount > 0 ? failedNotificationsCount : undefined,
    },
    {
      id: 'reports',
      labelAr: 'التقارير والتحليلات',
      labelEn: 'Reports & Analytics',
      icon: <BarChart3 className="w-4 h-4" />,
    },
    {
      id: 'students',
      labelAr: 'إدارة واستيراد الطلاب',
      labelEn: 'Students & 2-Stage Import',
      icon: <Users2 className="w-4 h-4" />,
    },
    {
      id: 'settings',
      labelAr: 'سجل التدقيق والإعدادات',
      labelEn: 'Audit & Settings',
      icon: <Settings2 className="w-4 h-4" />,
    },
  ];

  return (
    <header className="sticky top-0 z-40 bg-white border-b border-slate-200 shadow-xs">
      {/* Top Banner: Tenant Selector + Role Switcher + Lang */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-2.5 border-b border-slate-100 flex flex-wrap items-center justify-between gap-3 text-xs">
        {/* School / Tenant Selection */}
        <div className="flex items-center gap-2">
          <Building2 className="w-4 h-4 text-emerald-600" />
          <span className="font-semibold text-slate-700">
            {lang === 'ar' ? 'المدرسة النشطة:' : 'Active School:'}
          </span>
          <select
            value={currentTenant.id}
            onChange={(e) => setTenantId(e.target.value)}
            className="bg-slate-50 border border-slate-300 text-slate-800 rounded-md px-2.5 py-1 font-medium focus:outline-hidden focus:ring-2 focus:ring-emerald-500 cursor-pointer text-xs"
          >
            {tenants.map((t) => (
              <option key={t.id} value={t.id}>
                {t.name} ({t.city})
              </option>
            ))}
          </select>
          <span className="text-slate-400 hidden sm:inline">|</span>
          <span className="text-slate-500 hidden sm:inline">
            {currentTenant.academicYear} - {currentTenant.currentTerm}
          </span>
        </div>

        {/* User Role Switcher & Language */}
        <div className="flex items-center gap-2 ml-auto">
          <div className="flex items-center gap-1.5 bg-slate-100 p-1 rounded-lg">
            <UserCheck className="w-3.5 h-3.5 text-slate-500 mr-1" />
            <span className="text-slate-500 text-[11px] font-medium hidden md:inline">
              {lang === 'ar' ? 'معاينة بدور:' : 'Preview as:'}
            </span>
            {(['admin', 'registrar', 'teacher', 'parent'] as UserRole[]).map((r) => {
              const active = currentUser.role === r;
              return (
                <button
                  key={r}
                  onClick={() => setUserRole(r)}
                  className={`px-2 py-0.5 rounded text-[11px] font-medium transition-colors ${
                    active
                      ? 'bg-white text-slate-900 shadow-xs font-semibold'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  {lang === 'ar' ? roleLabels[r].ar : roleLabels[r].en}
                </button>
              );
            })}
          </div>

          {/* Lang toggle */}
          <button
            onClick={() => setLang(lang === 'ar' ? 'en' : 'ar')}
            className="flex items-center gap-1 text-slate-600 hover:text-slate-900 bg-slate-50 border border-slate-200 px-2 py-1 rounded-md text-xs font-medium cursor-pointer"
            title="تبديل اللغة / Toggle Language"
          >
            <Languages className="w-3.5 h-3.5" />
            <span>{lang === 'ar' ? 'English' : 'عربي'}</span>
          </button>
        </div>
      </div>

      {/* Main Bar: Brand + Navigation Links */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-between h-14">
        {/* Brand */}
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-emerald-600 text-white flex items-center justify-center font-bold text-lg shadow-sm">
            ح
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-bold text-slate-900 text-base leading-tight">
                {lang === 'ar' ? 'مدرستي حضور' : 'Smart Attendance'}
              </span>
              <span className="text-[10px] bg-emerald-50 text-emerald-700 border border-emerald-200 px-1.5 py-0.2 rounded font-semibold">
                PRO 2026
              </span>
            </div>
            <p className="text-[11px] text-slate-500 leading-none">
              {lang === 'ar' ? 'نظام الحضور والغياب المدرسي الذكي' : 'Integrated Attendance Engine & AI Excuses'}
            </p>
          </div>
        </div>

        {/* Desktop Navigation */}
        <nav className="hidden lg:flex items-center gap-1">
          {navItems.map((item) => {
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className={`flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-medium transition-colors cursor-pointer relative ${
                  isActive
                    ? 'bg-slate-900 text-white shadow-xs'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                }`}
              >
                {item.icon}
                <span>{lang === 'ar' ? item.labelAr : item.labelEn}</span>
                {item.badge !== undefined && (
                  <span
                    className={`text-[10px] px-1.5 py-0.2 rounded-full font-bold leading-none ${
                      isActive ? 'bg-emerald-400 text-slate-950' : 'bg-red-500 text-white'
                    }`}
                  >
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}
        </nav>

        {/* Mobile menu trigger */}
        <div className="lg:hidden flex items-center">
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="p-2 text-slate-600 hover:text-slate-900 rounded-lg hover:bg-slate-100"
          >
            {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* Mobile Drawer */}
      {mobileMenuOpen && (
        <div className="lg:hidden border-t border-slate-200 bg-white px-4 pt-2 pb-4 space-y-1 shadow-lg">
          {navItems.map((item) => {
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => {
                  setActiveTab(item.id);
                  setMobileMenuOpen(false);
                }}
                className={`w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                  isActive ? 'bg-slate-900 text-white font-semibold' : 'text-slate-700 hover:bg-slate-100'
                }`}
              >
                <div className="flex items-center gap-2.5">
                  {item.icon}
                  <span>{lang === 'ar' ? item.labelAr : item.labelEn}</span>
                </div>
                {item.badge !== undefined && (
                  <span className="text-xs bg-red-500 text-white px-2 py-0.5 rounded-full font-bold">
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      )}
    </header>
  );
};

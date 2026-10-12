import React, { useState } from 'react';
import { useAttendance } from '../context/AttendanceContext';
import { UserRole } from '../types/attendance';
import { ActiveTab } from './HeaderNav';
import {
  CalendarDays,
  FileCheck2,
  MessageSquare,
  ShieldAlert,
  Send,
  BarChart3,
  Users2,
  Settings2,
  Mail,
  ChevronDown,
  ChevronRight,
  ChevronLeft,
  PanelLeftClose,
  PanelLeftOpen,
  Sparkles,
  School,
  Bell,
  LayoutDashboard,
} from 'lucide-react';

interface SubNavItem {
  id: ActiveTab;
  labelAr: string;
  labelEn: string;
  icon: React.ReactNode;
  badge?: number;
}

interface NavSection {
  id: string;
  titleAr: string;
  titleEn: string;
  icon: React.ReactNode;
  items: SubNavItem[];
}

interface AppSidebarProps {
  activeTab: ActiveTab;
  setActiveTab: (tab: ActiveTab) => void;
  isCollapsed: boolean;
  setIsCollapsed: (collapsed: boolean) => void;
  mobileOpen: boolean;
  setMobileOpen: (open: boolean) => void;
}

export const AppSidebar: React.FC<AppSidebarProps> = ({
  activeTab,
  setActiveTab,
  isCollapsed,
  setIsCollapsed,
  mobileOpen,
  setMobileOpen,
}) => {
  const { currentUser, lang, notifications, justifications, currentTenant, tenantDomainConfig } = useAttendance();

  const isAr = lang === 'ar';
  const isParent = currentUser.role === 'parent';
  const isTeacher = currentUser.role === 'teacher';

  const pendingJustificationsCount = justifications.filter((j) => j.status === 'pending').length;
  const failedNotificationsCount = notifications.filter((n) => n.status === 'failed').length;

  // Track expanded/collapsed state of accordion sections
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({
    operations: true,
    students: true,
    communications: true,
    reports: true,
    admin: true,
  });

  const toggleSection = (sectionId: string) => {
    if (isCollapsed) {
      setIsCollapsed(false);
      setExpandedSections((prev) => ({ ...prev, [sectionId]: true }));
      return;
    }
    setExpandedSections((prev) => ({ ...prev, [sectionId]: !prev[sectionId] }));
  };

  const sections: NavSection[] = [
    {
      id: 'operations',
      titleAr: 'العمليات والحضور',
      titleEn: 'Daily Operations',
      icon: <CalendarDays className="w-4 h-4 text-emerald-600" />,
      items: [
        {
          id: 'dashboard',
          labelAr: 'لوحة القيادة والمؤشرات التنفيذية',
          labelEn: 'Executive Dashboard',
          icon: <LayoutDashboard className="w-4 h-4 text-emerald-600" />,
        },
        {
          id: 'sessions',
          labelAr: 'كشوف الحضور والغياب اليومية',
          labelEn: 'Attendance Sessions',
          icon: <CalendarDays className="w-4 h-4 text-emerald-600" />,
        },
        {
          id: 'digest',
          labelAr: 'نشرة الصباح الاستباقية',
          labelEn: 'Morning Daily Digest',
          icon: <Mail className="w-4 h-4 text-teal-600" />,
        },
        {
          id: 'emergency',
          labelAr: 'كشف الطوارئ ونقاط الإخلاء',
          labelEn: 'Emergency Roster',
          icon: <ShieldAlert className="w-4 h-4 text-rose-600" />,
        },
      ],
    },
    {
      id: 'students',
      titleAr: 'شؤون الطلاب والشعب',
      titleEn: 'Students & Classes',
      icon: <Users2 className="w-4 h-4 text-indigo-600" />,
      items: [
        {
          id: 'students',
          labelAr: 'سجلات واستيراد الطلاب',
          labelEn: 'Students Registry & Import',
          icon: <Users2 className="w-4 h-4 text-indigo-600" />,
        },
      ],
    },
    {
      id: 'communications',
      titleAr: 'الأعذار والمراسلات',
      titleEn: 'Excuses & Communications',
      icon: <FileCheck2 className="w-4 h-4 text-amber-600" />,
      items: [
        {
          id: 'justifications',
          labelAr: isParent ? 'أعذار واستئذان الأبناء' : isTeacher ? 'أعذار طلاب الفصول' : 'تدقيق وتحليل الأعذار الذكي',
          labelEn: isParent ? 'Child Excuses' : isTeacher ? 'Class Excuses' : 'Excuses & AI Analysis',
          icon: <FileCheck2 className="w-4 h-4 text-amber-600" />,
          badge: pendingJustificationsCount > 0 ? pendingJustificationsCount : undefined,
        },
        {
          id: 'outbox',
          labelAr: 'طابور الإشعارات والمراسلات',
          labelEn: 'Notification Outbox',
          icon: <Send className="w-4 h-4 text-sky-600" />,
          badge: failedNotificationsCount > 0 ? failedNotificationsCount : undefined,
        },
      ],
    },
    {
      id: 'reports',
      titleAr: 'التقارير والتحليلات',
      titleEn: 'Reports & Analytics',
      icon: <BarChart3 className="w-4 h-4 text-violet-600" />,
      items: [
        {
          id: 'reports',
          labelAr: 'مركز التقارير والطباعة المجمعة',
          labelEn: 'Reports & Batch Print',
          icon: <BarChart3 className="w-4 h-4 text-violet-600" />,
        },
      ],
    },
    {
      id: 'admin',
      titleAr: 'الإدارة والإعدادات',
      titleEn: 'Administration',
      icon: <Settings2 className="w-4 h-4 text-slate-700" />,
      items: [
        {
          id: 'settings',
          labelAr: 'سجل التدقيق وسياسات المنشأة',
          labelEn: 'Audit & School Settings',
          icon: <Settings2 className="w-4 h-4 text-slate-700" />,
        },
      ],
    },
  ];

  // Role filtering
  const visibleSections = sections
    .map((sec) => {
      if (isParent) {
        return {
          ...sec,
          items: sec.items.filter((i) => i.id === 'justifications'),
        };
      }
      if (isTeacher) {
        return {
          ...sec,
          items: sec.items.filter((i) =>
            ['dashboard', 'sessions', 'emergency', 'justifications', 'reports'].includes(i.id)
          ),
        };
      }
      return sec;
    })
    .filter((sec) => sec.items.length > 0);

  const handleSelect = (id: ActiveTab) => {
    setActiveTab(id);
    setMobileOpen(false);
  };

  return (
    <>
      {/* Mobile Backdrop */}
      {mobileOpen && (
        <div
          onClick={() => setMobileOpen(false)}
          className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs z-40 lg:hidden"
        />
      )}

      {/* Main Sidebar Element */}
      <aside
        id="app-sidebar-element"
        style={{
          backgroundColor: 'var(--app-sidebar-bg)',
          borderColor: 'var(--app-border)',
          color: 'var(--app-text-main)',
        }}
        className={`fixed top-0 bottom-0 z-50 shadow-sm transition-all duration-300 flex flex-col ${
          isAr ? 'right-0 border-l' : 'left-0 border-r'
        } ${
          isCollapsed ? 'w-16' : 'w-64'
        } ${
          mobileOpen
            ? 'translate-x-0'
            : isAr
            ? 'translate-x-full lg:translate-x-0'
            : '-translate-x-full lg:translate-x-0'
        }`}
      >
        {/* Sidebar Header: School Logo & Name + Collapse Toggle */}
        <div
          className="h-16 flex items-center justify-between px-3 border-b"
          style={{ borderColor: 'var(--app-border-subtle)' }}
        >
          <div className="flex items-center gap-2.5 overflow-hidden">
            <div
              className="w-9 h-9 rounded-xl text-white flex items-center justify-center font-bold text-sm shadow-xs shrink-0"
              style={{ backgroundColor: tenantDomainConfig?.primaryColor || '#059669' }}
            >
              {tenantDomainConfig?.logoText || currentTenant.name.charAt(0)}
            </div>
            {!isCollapsed && (
              <div className="min-w-0">
                <div className="font-bold text-slate-900 text-xs truncate leading-tight">
                  {currentTenant.name}
                </div>
                <div className="text-[10px] text-slate-500 font-mono truncate flex items-center gap-1">
                  <span>{currentTenant.code}</span>
                  <span>·</span>
                  <span>{currentTenant.academicYear}</span>
                </div>
              </div>
            )}
          </div>

          {/* Desktop Collapse / Expand Toggle */}
          <button
            onClick={() => setIsCollapsed(!isCollapsed)}
            className="hidden lg:flex p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 cursor-pointer transition-colors"
            title={isCollapsed ? (isAr ? 'توسيع القائمة' : 'Expand sidebar') : (isAr ? 'طي القائمة' : 'Collapse sidebar')}
          >
            {isCollapsed ? (
              isAr ? <PanelLeftOpen className="w-4 h-4 rotate-180" /> : <PanelLeftOpen className="w-4 h-4" />
            ) : (
              isAr ? <PanelLeftClose className="w-4 h-4 rotate-180" /> : <PanelLeftClose className="w-4 h-4" />
            )}
          </button>
        </div>

        {/* Sidebar Navigation Links (Tree View) */}
        <div className="flex-1 overflow-y-auto py-3 px-2 space-y-4">
          {/* Parent Portal Direct Link for Parents */}
          {isParent && (
            <div className="space-y-1">
              <button
                onClick={() => handleSelect('parent_portal')}
                className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  activeTab === 'parent_portal'
                    ? 'bg-amber-500 text-white shadow-xs'
                    : 'text-slate-700 hover:bg-slate-100'
                }`}
                title={isAr ? 'بوابة ولي الأمر' : 'Parent Portal'}
              >
                <Bell className="w-4 h-4 shrink-0" />
                {!isCollapsed && <span>{isAr ? 'بوابة ولي الأمر' : 'Parent Portal'}</span>}
              </button>
            </div>
          )}

          {/* Workflow Sections */}
          {visibleSections.map((sec) => {
            const isExpanded = expandedSections[sec.id] !== false;
            const hasActiveChild = sec.items.some((i) => i.id === activeTab);

            return (
              <div key={sec.id} className="space-y-1">
                {/* Section Header */}
                {!isCollapsed ? (
                  <button
                    onClick={() => toggleSection(sec.id)}
                    className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg text-slate-400 hover:text-slate-800 hover:bg-slate-50 transition-colors text-[11px] font-bold cursor-pointer uppercase tracking-wider`}
                  >
                    <div className="flex items-center gap-1.5 truncate">
                      {sec.icon}
                      <span>{isAr ? sec.titleAr : sec.titleEn}</span>
                    </div>
                    {isExpanded ? (
                      <ChevronDown className="w-3.5 h-3.5 shrink-0 text-slate-400" />
                    ) : isAr ? (
                      <ChevronLeft className="w-3.5 h-3.5 shrink-0 text-slate-400" />
                    ) : (
                      <ChevronRight className="w-3.5 h-3.5 shrink-0 text-slate-400" />
                    )}
                  </button>
                ) : (
                  <div className="w-full border-t border-slate-100 my-2 pt-1" />
                )}

                {/* Section Items */}
                {(isExpanded || isCollapsed) && (
                  <div className={`space-y-0.5 ${!isCollapsed ? (isAr ? 'pr-2' : 'pl-2') : ''}`}>
                    {sec.items.map((item) => {
                      const isActive = activeTab === item.id;
                      return (
                        <button
                          key={item.id}
                          onClick={() => handleSelect(item.id)}
                          className={`w-full flex items-center gap-2.5 px-2.5 py-2 rounded-xl text-xs font-semibold transition-all cursor-pointer relative ${
                            isActive
                              ? 'bg-slate-900 text-white shadow-2xs font-bold'
                              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                          } ${isCollapsed ? 'justify-center' : 'justify-between'}`}
                          title={isAr ? item.labelAr : item.labelEn}
                        >
                          <div className="flex items-center gap-2 min-w-0">
                            <span className="shrink-0">{item.icon}</span>
                            {!isCollapsed && (
                              <span className="truncate">{isAr ? item.labelAr : item.labelEn}</span>
                            )}
                          </div>
                          {item.badge !== undefined && (
                            <span
                              className={`text-[10px] font-bold px-1.5 py-0.2 rounded-full leading-none shrink-0 ${
                                isActive ? 'bg-emerald-400 text-slate-950' : 'bg-red-500 text-white'
                              } ${isCollapsed ? 'absolute -top-1 -right-1' : ''}`}
                            >
                              {item.badge}
                            </span>
                          )}
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}

          {/* AI Assistant Special Link */}
          <div className="pt-2 border-t border-slate-100">
            <button
              onClick={() => handleSelect('chatbot')}
              className={`w-full flex items-center gap-2.5 px-2.5 py-2 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                activeTab === 'chatbot'
                  ? 'bg-purple-900 text-white shadow-xs font-bold'
                  : 'text-purple-700 hover:bg-purple-50'
              } ${isCollapsed ? 'justify-center' : 'justify-between'}`}
              title={isAr ? 'المساعد الذكي (Gemini)' : 'Gemini Assistant'}
            >
              <div className="flex items-center gap-2">
                <MessageSquare className="w-4 h-4 text-purple-600 shrink-0" />
                {!isCollapsed && (
                  <span>{isAr ? 'المساعد الذكي (Gemini)' : 'Gemini Assistant'}</span>
                )}
              </div>
              {!isCollapsed && <Sparkles className="w-3 h-3 text-purple-400 shrink-0" />}
            </button>
          </div>
        </div>

        {/* Sidebar Footer */}
        <div
          className="p-3 border-t transition-colors"
          style={{
            backgroundColor: 'var(--app-sidebar-hover)',
            borderColor: 'var(--app-border-subtle)',
          }}
        >
          {!isCollapsed ? (
            <div className="flex items-center justify-between text-[11px]">
              <span className="font-semibold" style={{ color: 'var(--app-text-main)' }}>
                مدرستي حضور
              </span>
              <span
                className="font-mono font-bold"
                style={{ color: 'var(--app-primary)' }}
              >
                v2.4.0
              </span>
            </div>
          ) : (
            <div
              className="flex justify-center text-[10px] font-mono font-bold"
              style={{ color: 'var(--app-primary)' }}
            >
              PRO
            </div>
          )}
        </div>
      </aside>
    </>
  );
};

import React, { useState, useEffect } from 'react';
import { ThemeProvider } from './context/ThemeContext';
import { AttendanceProvider, useAttendance } from './context/AttendanceContext';
import { HeaderNav, ActiveTab } from './components/HeaderNav';
import { AppSidebar } from './components/AppSidebar';
import { AttendanceSessionsView } from './components/AttendanceSessionsView';
import { JustificationsView } from './components/JustificationsView';
import { GeminiChatbotView } from './components/GeminiChatbotView';
import { EmergencyRosterView } from './components/EmergencyRosterView';
import { NotificationOutboxView } from './components/NotificationOutboxView';
import { ReportsView } from './components/ReportsView';
import { StudentManagementView } from './components/StudentManagementView';
import { AuditSettingsView } from './components/AuditSettingsView';
import { ParentPortalView } from './components/ParentPortalView';
import { DailyEmailDigestView } from './components/DailyEmailDigestView';
import { ExecutiveDashboardView } from './components/ExecutiveDashboardView';
import { UnknownDomainView } from './components/UnknownDomainView';
import { LoginPage } from './components/LoginPage';
import { resolveTenantFromHostname } from './config/tenantRegistry';

import { subscribeConnectionStatus, ConnectionStatus } from './lib/firebase';
import { WifiOff, Database, RefreshCw } from 'lucide-react';
import { OfflineSyncModal } from './components/OfflineSyncModal';

const MainAppContent: React.FC = () => {
  const { lang, currentTenant, currentUser, setUserRole } = useAttendance();
  const isParent = currentUser.role === 'parent';
  const isTeacher = currentUser.role === 'teacher';
  const [activeTab, setActiveTab] = useState<ActiveTab>(isParent ? 'parent_portal' : 'dashboard');
  const [connStatus, setConnStatus] = useState<ConnectionStatus>('connected');
  const [isSyncModalOpen, setIsSyncModalOpen] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(() => {
    return typeof localStorage !== 'undefined' && localStorage.getItem('school_user_authenticated') === 'true';
  });

  const handleSignOut = () => {
    if (typeof localStorage !== 'undefined') {
      localStorage.removeItem('school_user_authenticated');
    }
    setIsAuthenticated(false);
  };

  const handleLoginSuccess = (userProfile: any) => {
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem('school_user_authenticated', 'true');
    }
    setUserRole(userProfile.role);
    if (userProfile.role === 'parent') {
      setActiveTab('parent_portal');
    } else {
      setActiveTab('dashboard');
    }
    setIsAuthenticated(true);
  };

  useEffect(() => {
    const unsub = subscribeConnectionStatus((s) => setConnStatus(s));
    return () => unsub();
  }, []);

  // Set document dir & lang attribute when language toggles
  useEffect(() => {
    document.documentElement.lang = lang;
    document.documentElement.dir = lang === 'ar' ? 'rtl' : 'ltr';
  }, [lang]);

  // Strict RBAC: Guard unauthorized views based on role
  useEffect(() => {
    if (isParent && activeTab !== 'parent_portal' && activeTab !== 'justifications' && activeTab !== 'chatbot') {
      setActiveTab('parent_portal');
    } else if (isTeacher && !['dashboard', 'sessions', 'justifications', 'chatbot', 'emergency', 'reports'].includes(activeTab)) {
      setActiveTab('dashboard');
    }
  }, [isParent, isTeacher, activeTab]);

  // If not authenticated, render the school-specific LoginPage
  if (!isAuthenticated) {
    return <LoginPage onLoginSuccess={handleLoginSuccess} />;
  }

  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [sidebarMobileOpen, setSidebarMobileOpen] = useState(false);

  const isAr = lang === 'ar';

  return (
    <div id="app-root-container" className="min-h-screen flex font-['Cairo',sans-serif] transition-colors duration-200">
      {/* Offline Sync Center Modal */}
      <OfflineSyncModal
        isOpen={isSyncModalOpen}
        onClose={() => setIsSyncModalOpen(false)}
        connStatus={connStatus}
        lang={lang}
      />

      {/* App Sidebar (Tree structured, expandable/collapsible) */}
      <AppSidebar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        isCollapsed={isSidebarCollapsed}
        setIsCollapsed={setIsSidebarCollapsed}
        mobileOpen={sidebarMobileOpen}
        setMobileOpen={setSidebarMobileOpen}
      />

      {/* Main App Canvas (offset dynamically by sidebar width) */}
      <div
        className={`flex-1 flex flex-col min-h-screen transition-all duration-300 w-full ${
          isAr
            ? isSidebarCollapsed
              ? 'lg:mr-16'
              : 'lg:mr-64'
            : isSidebarCollapsed
            ? 'lg:ml-16'
            : 'lg:ml-64'
        }`}
      >
        {/* Offline Warning Banner */}
        {connStatus === 'offline' && (
          <div
            onClick={() => setIsSyncModalOpen(true)}
            className="bg-amber-600 hover:bg-amber-700 transition-colors cursor-pointer text-white text-xs font-semibold px-4 py-2 flex items-center justify-between shadow-xs select-none"
          >
            <div className="flex items-center gap-2">
              <WifiOff className="w-4 h-4 animate-pulse" />
              <span>
                {lang === 'ar'
                  ? 'تنبيه: أنت تعمل في وضع عدم الاتصال (Offline) - انقر هنا لعرض سجلات المزامنة المحلية وفحص الاتصال.'
                  : 'Notice: Working in offline mode. Click to view local sync cache and retry.'}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <span className="bg-amber-700/80 hover:bg-amber-800 px-2.5 py-0.5 rounded text-[11px] font-mono flex items-center gap-1">
                <RefreshCw className="w-3 h-3" />
                <span>{lang === 'ar' ? 'فحص المزامنة' : 'Sync Center'}</span>
              </span>
            </div>
          </div>
        )}

        {/* Top Header & Contextual Bar */}
        <HeaderNav
          activeTab={activeTab}
          setActiveTab={setActiveTab}
          onSignOut={handleSignOut}
          onToggleSidebarMobile={() => setSidebarMobileOpen(true)}
          isSidebarCollapsed={isSidebarCollapsed}
          onToggleSidebarCollapse={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
        />

        {/* Main Content Viewport */}
        <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
          {isParent ? (
            <>
              {activeTab === 'parent_portal' && (
                <ParentPortalView onOpenExcuseForm={() => setActiveTab('justifications')} />
              )}
              {activeTab === 'justifications' && <JustificationsView />}
              {activeTab === 'chatbot' && <GeminiChatbotView />}
            </>
          ) : (
            <>
              {activeTab === 'dashboard' && (
                <ExecutiveDashboardView onNavigateTab={(tab) => setActiveTab(tab)} />
              )}
              {activeTab === 'sessions' && <AttendanceSessionsView />}
              {activeTab === 'justifications' && <JustificationsView />}
              {activeTab === 'digest' && (
                <DailyEmailDigestView onNavigateToTab={(tab) => setActiveTab(tab as ActiveTab)} />
              )}
              {activeTab === 'chatbot' && <GeminiChatbotView />}
              {activeTab === 'emergency' && <EmergencyRosterView />}
              {activeTab === 'outbox' && <NotificationOutboxView />}
              {activeTab === 'reports' && <ReportsView />}
              {activeTab === 'students' && <StudentManagementView />}
              {activeTab === 'settings' && <AuditSettingsView />}
              {activeTab === 'parent_portal' && (
                <ParentPortalView onOpenExcuseForm={() => setActiveTab('justifications')} />
              )}
            </>
          )}
        </main>

        {/* Footer */}
        <footer className="bg-white border-t border-slate-200 mt-auto py-5 text-xs text-slate-500">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-3 text-center sm:text-right">
            <div>
              <span className="font-bold text-slate-800">{currentTenant.name}</span>
              <span className="mx-2">·</span>
              <span>نظام الحضور والغياب المدرسي الذكي والتدقيق الإلزامي</span>
            </div>
            <div className="flex items-center gap-4 text-slate-400">
              <span>مدعوم بنماذج Google Gemini للذكاء الاصطناعي</span>
              <span>·</span>
              <span>الإصدار 2.4.0 (2026)</span>
            </div>
          </div>
        </footer>
      </div>
    </div>
  );
};

export default function App() {
  const hostname = typeof window !== 'undefined' ? window.location.hostname : '';
  const resolution = resolveTenantFromHostname(hostname);

  if (resolution.status === 'unknown_domain') {
    return <UnknownDomainView hostname={resolution.normalizedHostname} reason="unknown_domain" />;
  }

  if (resolution.status === 'inactive_tenant') {
    return <UnknownDomainView hostname={resolution.normalizedHostname} reason="inactive_tenant" />;
  }

  const activeTenantId = resolution.tenantId || 'school-1';

  return (
    <ThemeProvider>
      <AttendanceProvider initialTenantId={activeTenantId}>
        <MainAppContent />
      </AttendanceProvider>
    </ThemeProvider>
  );
}

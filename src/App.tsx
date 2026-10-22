import React, { useState, useEffect, Suspense, lazy } from 'react';
import { ThemeProvider } from './context/ThemeContext';
import { AttendanceProvider, useAttendance } from './context/AttendanceContext';
import { HeaderNav, ActiveTab } from './components/HeaderNav';
import { AppSidebar } from './components/AppSidebar';
import { UnknownDomainView } from './components/UnknownDomainView';
import { LoginPage } from './components/LoginPage';
import { ErrorBoundary } from './components/ErrorBoundary';
import { SubscriptionBanner, SubscriptionSuspendedView } from './components/SubscriptionGate';
import { resolveTenantFromHostname, TenantResolutionResult } from './config/tenantRegistry';

import { subscribeConnectionStatus, ConnectionStatus } from './lib/firebase';
import { WifiOff, Database, RefreshCw } from 'lucide-react';
import { OfflineSyncModal } from './components/OfflineSyncModal';

// Code-Splitting: Lazy load views on-demand to reduce initial bundle size by >80%
const ExecutiveDashboardView = lazy(() =>
  import('./components/ExecutiveDashboardView').then((m) => ({ default: m.ExecutiveDashboardView }))
);
const AttendanceSessionsView = lazy(() =>
  import('./components/AttendanceSessionsView').then((m) => ({ default: m.AttendanceSessionsView }))
);
const StudentManagementView = lazy(() =>
  import('./components/StudentManagementView').then((m) => ({ default: m.StudentManagementView }))
);
const CommunicationsView = lazy(() =>
  import('./components/communications/CommunicationsView').then((m) => ({ default: m.CommunicationsView }))
);
const ReportsView = lazy(() =>
  import('./components/ReportsView').then((m) => ({ default: m.ReportsView }))
);
const AuditSettingsView = lazy(() =>
  import('./components/AuditSettingsView').then((m) => ({ default: m.AuditSettingsView }))
);
const GeminiChatbotView = lazy(() =>
  import('./components/GeminiChatbotView').then((m) => ({ default: m.GeminiChatbotView }))
);
const ParentPortalView = lazy(() =>
  import('./components/ParentPortalView').then((m) => ({ default: m.ParentPortalView }))
);

// Backward-compatible fallback views
const DailyEmailDigestView = lazy(() =>
  import('./components/DailyEmailDigestView').then((m) => ({ default: m.DailyEmailDigestView }))
);
const EmergencyRosterView = lazy(() =>
  import('./components/EmergencyRosterView').then((m) => ({ default: m.EmergencyRosterView }))
);

const ViewLoadingFallback: React.FC = () => (
  <div className="flex flex-col items-center justify-center min-h-[380px] py-16 space-y-3">
    <div className="w-9 h-9 border-3 border-primary/20 border-t-primary rounded-full animate-spin" />
    <span className="text-xs font-semibold text-slate-500 animate-pulse">جاري تحميل البيانات...</span>
  </div>
);

const MainAppContent: React.FC = () => {
  const { lang, currentTenant, currentUser, setUserRole, firebaseUser, signOutGoogle, subscriptionAccess } = useAttendance();
  const isParent = currentUser.role === 'parent';
  const isTeacher = currentUser.role === 'teacher';
  const isRegistrar = currentUser.role === 'registrar';
  const [activeTab, setActiveTab] = useState<ActiveTab>(
    isParent ? 'parent_portal' : isTeacher ? 'sessions' : 'dashboard'
  );
  const [connStatus, setConnStatus] = useState<ConnectionStatus>('connected');
  const [isSyncModalOpen, setIsSyncModalOpen] = useState(false);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [sidebarMobileOpen, setSidebarMobileOpen] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(() => {
    return typeof localStorage !== 'undefined' && localStorage.getItem('school_user_authenticated') === 'true';
  });

  // Automatically authenticate if returning from a cloud redirect or if a persistent Firebase session exists
  useEffect(() => {
    if (firebaseUser) {
      if (typeof localStorage !== 'undefined') {
        localStorage.setItem('school_user_authenticated', 'true');
      }
      const userEmail = (firebaseUser.email || '').toLowerCase();
      const ownerEmails = ((import.meta as any).env?.VITE_PLATFORM_OWNER_EMAILS || '')
        .split(',')
        .map((value: string) => value.trim().toLowerCase())
        .filter(Boolean);
      if (ownerEmails.includes(userEmail)) {
        setUserRole('super_admin');
      }
      setIsAuthenticated(true);
    }
  }, [firebaseUser]);

  const handleSignOut = () => {
    if (typeof localStorage !== 'undefined') {
      localStorage.removeItem('school_user_authenticated');
    }
    if (firebaseUser) {
      signOutGoogle().catch((err) => console.error('Sign out error:', err));
    }
    setIsAuthenticated(false);
  };

  const handleLoginSuccess = (userProfile: any) => {
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem('school_user_authenticated', 'true');
      if (userProfile?.role) {
        localStorage.setItem('school_current_user_role', userProfile.role);
      }
    }
    setUserRole(userProfile.role);
    if (userProfile.role === 'parent') {
      setActiveTab('parent_portal');
    } else if (userProfile.role === 'teacher') {
      setActiveTab('sessions');
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
    if (isParent) {
      if (
        activeTab !== 'parent_portal' &&
        activeTab !== 'justifications' &&
        activeTab !== 'communications'
      ) {
        setActiveTab('parent_portal');
      }
    } else if (isTeacher) {
      // Teachers are limited to the daily attendance sheets.
      if (activeTab !== 'sessions') {
        setActiveTab('sessions');
      }
    } else if (isRegistrar) {
      // Registrars never see the audit log & institution policies screen.
      if (activeTab === 'settings') {
        setActiveTab('dashboard');
      }
    }
  }, [isParent, isTeacher, isRegistrar, activeTab]);

  // If not authenticated, render the school-specific LoginPage
  if (!isAuthenticated) {
    return <LoginPage onLoginSuccess={handleLoginSuccess} />;
  }

  // Subscription hard gate. The platform owner bypasses so they can always
  // sign in and renew any school (enforcement also lives server-side + rules).
  if (!subscriptionAccess.accessEnabled && currentUser.role !== 'super_admin') {
    return (
      <SubscriptionSuspendedView
        access={subscriptionAccess}
        lang={lang}
        schoolName={currentTenant.name}
        onSignOut={handleSignOut}
      />
    );
  }

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

        {/* Subscription renewal / grace banner */}
        <SubscriptionBanner access={subscriptionAccess} lang={lang} />

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
          <ErrorBoundary>
            <Suspense fallback={<ViewLoadingFallback />}>
              {isParent ? (
                <>
                  {activeTab === 'parent_portal' && (
                    <ParentPortalView onOpenExcuseForm={() => setActiveTab('communications')} />
                  )}
                  {(activeTab === 'justifications' || activeTab === 'communications') && (
                    <CommunicationsView initialTab="justifications" />
                  )}
                </>
              ) : (
                <>
                  {activeTab === 'dashboard' && (
                    <ExecutiveDashboardView onNavigateTab={(tab) => setActiveTab(tab)} />
                  )}
                  {activeTab === 'sessions' && <AttendanceSessionsView />}
                  {activeTab === 'students' && <StudentManagementView />}
                  {activeTab === 'communications' && (
                    <CommunicationsView initialTab="justifications" />
                  )}
                  {activeTab === 'reports' && <ReportsView />}
                  {activeTab === 'settings' && <AuditSettingsView />}
                  {activeTab === 'chatbot' && <GeminiChatbotView />}

                  {/* Backward-Compatible Tab Aliases */}
                  {activeTab === 'justifications' && (
                    <CommunicationsView initialTab="justifications" />
                  )}
                  {activeTab === 'outbox' && (
                    <CommunicationsView initialTab="outbox" />
                  )}
                  {activeTab === 'digest' && (
                    <DailyEmailDigestView onNavigateToTab={(tab) => setActiveTab(tab as ActiveTab)} />
                  )}
                  {activeTab === 'emergency' && (
                    <AttendanceSessionsView initialOpenEmergencyModal={true} />
                  )}
                  {activeTab === 'student_inquiry' && (
                    <StudentManagementView />
                  )}
                  {activeTab === 'parent_portal' && (
                    <ParentPortalView onOpenExcuseForm={() => setActiveTab('communications')} />
                  )}
                </>
              )}
            </Suspense>
          </ErrorBoundary>
        </main>

        {/* Footer */}
        <footer className="bg-white border-t border-slate-200 mt-auto py-5 text-xs text-slate-500">
          <div className={`max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-3 text-center ${lang === 'ar' ? 'sm:text-right' : 'sm:text-left'}`}>
            <div>
              <span className="font-bold text-slate-800">{currentTenant.name}</span>
              <span className="mx-2">·</span>
              <span>{lang === 'ar' ? 'نظام الحضور والغياب المدرسي الذكي والتدقيق الإلزامي' : 'Smart school attendance & absence system with mandatory auditing'}</span>
            </div>
            <div className="flex items-center gap-4 text-slate-600">
              <span>{lang === 'ar' ? 'مدعوم بنماذج Google Gemini للذكاء الاصطناعي' : 'Powered by Google Gemini AI models'}</span>
              <span>·</span>
              <span>{lang === 'ar' ? 'الإصدار 2.4.0 (2026)' : 'Version 2.4.0 (2026)'}</span>
            </div>
          </div>
        </footer>
      </div>
    </div>
  );
};

export default function App() {
  const hostname = typeof window !== 'undefined' ? window.location.hostname : '';
  const search = typeof window !== 'undefined' ? window.location.search : '';
  const [resolution, setResolution] = useState<TenantResolutionResult>(() =>
    resolveTenantFromHostname(hostname, search)
  );
  const [isResolving, setIsResolving] = useState<boolean>(false);

  useEffect(() => {
    // If unknown on this origin, check with server in case this is a newly provisioned school
    if (resolution.status === 'unknown_domain' && typeof window !== 'undefined') {
      setIsResolving(true);
      fetch('/api/tenant/resolve')
        .then((res) => res.json())
        .then((serverRes: TenantResolutionResult) => {
          if (serverRes && serverRes.status === 'resolved') {
            setResolution(serverRes);
          }
        })
        .catch((err) => console.warn('Could not resolve tenant from server:', err))
        .finally(() => setIsResolving(false));
    }
  }, [hostname]);

  if (isResolving) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center">
        <div className="w-8 h-8 border-3 border-emerald-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (resolution.status === 'unknown_domain') {
    return <UnknownDomainView hostname={resolution.normalizedHostname} reason="unknown_domain" />;
  }

  if (resolution.status === 'inactive_tenant') {
    return <UnknownDomainView hostname={resolution.normalizedHostname} reason="inactive_tenant" />;
  }

  const activeTenantId =
    resolution.tenantId || ((import.meta as any).env?.VITE_DEFAULT_TENANT_ID || '');

  return (
    <ErrorBoundary>
      <ThemeProvider>
        <AttendanceProvider initialTenantId={activeTenantId}>
          <MainAppContent />
        </AttendanceProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

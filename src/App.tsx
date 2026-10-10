import React, { useState, useEffect } from 'react';
import { AttendanceProvider, useAttendance } from './context/AttendanceContext';
import { HeaderNav, ActiveTab } from './components/HeaderNav';
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

const MainAppContent: React.FC = () => {
  const { lang, currentTenant, currentUser } = useAttendance();
  const isParent = currentUser.role === 'parent';
  const [activeTab, setActiveTab] = useState<ActiveTab>(isParent ? 'parent_portal' : 'sessions');

  // Set document dir & lang attribute when language toggles
  useEffect(() => {
    document.documentElement.lang = lang;
    document.documentElement.dir = lang === 'ar' ? 'rtl' : 'ltr';
  }, [lang]);

  // Strict RBAC: Parents must NEVER access administrative views
  useEffect(() => {
    if (isParent && activeTab !== 'parent_portal' && activeTab !== 'justifications' && activeTab !== 'chatbot') {
      setActiveTab('parent_portal');
    }
  }, [isParent, activeTab]);

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col font-['Cairo',sans-serif]">
      {/* Top Header & Navigation */}
      <HeaderNav activeTab={activeTab} setActiveTab={setActiveTab} />

      {/* Main Container */}
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
  );
};

export default function App() {
  return (
    <AttendanceProvider>
      <MainAppContent />
    </AttendanceProvider>
  );
}

import React, { useState, useEffect } from 'react';
import { useAttendance } from '../../context/AttendanceContext';
import { JustificationsView } from '../JustificationsView';
import { NotificationOutboxView } from '../NotificationOutboxView';
import {
  FileCheck2,
  MessageSquare,
  Send,
  AlertTriangle,
  Clock,
  Sparkles,
  ShieldCheck,
} from 'lucide-react';

interface CommunicationsViewProps {
  initialTab?: 'justifications' | 'outbox';
}

export const CommunicationsView: React.FC<CommunicationsViewProps> = ({
  initialTab = 'justifications',
}) => {
  const { justifications, notifications, lang, currentUser } = useAttendance();
  const isAr = lang === 'ar';

  const canManageOutbox = currentUser.role === 'admin' || currentUser.role === 'registrar' || currentUser.role === 'super_admin';

  const [activeTab, setActiveTab] = useState<'justifications' | 'outbox'>(
    canManageOutbox && initialTab === 'outbox' ? 'outbox' : 'justifications'
  );

  useEffect(() => {
    if (initialTab) {
      if (initialTab === 'outbox' && canManageOutbox) {
        setActiveTab('outbox');
      } else {
        setActiveTab('justifications');
      }
    }
  }, [initialTab, canManageOutbox]);

  const pendingJustificationsCount = justifications.filter((j) => j.status === 'pending').length;
  const failedNotificationsCount = notifications.filter((n) => n.status === 'failed').length;

  return (
    <div className="space-y-6 pb-12 animate-fadeIn">
      {/* =========================================================================
          COMMUNICATIONS HUB HEADER & UNIFIED SUB-TABS STRIP
      ========================================================================= */}
      <div className="app-section-header rounded-2xl border p-5 sm:p-6 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="space-y-1">
          <h1 className="text-xl sm:text-2xl font-black" style={{ color: 'var(--app-text-main)' }}>
            {isAr ? 'مركز الأعذار والتواصل المدرسي' : 'Communications & Excuses Hub'}
          </h1>
        </div>

        {/* 2 Unified Sub-Tabs Switcher */}
        <div className="flex p-1 bg-slate-100 dark:bg-slate-800/80 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-bold shrink-0">
          <button
            onClick={() => setActiveTab('justifications')}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-all cursor-pointer ${
              activeTab === 'justifications'
                ? 'bg-white dark:bg-slate-900 text-primary shadow-xs font-black'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100'
            }`}
          >
            <FileCheck2 className="w-4 h-4" />
            <span>{isAr ? 'تدقيق الأعذار الطبية' : 'Medical Justifications'}</span>
            {pendingJustificationsCount > 0 && (
              <span className="bg-amber-500 text-white text-[10px] px-1.5 py-0.2 rounded-full font-bold">
                {pendingJustificationsCount}
              </span>
            )}
          </button>

          {canManageOutbox && (
            <button
              onClick={() => setActiveTab('outbox')}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-all cursor-pointer ${
                activeTab === 'outbox'
                  ? 'bg-white dark:bg-slate-900 text-primary shadow-xs font-black'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100'
              }`}
            >
              <Send className="w-4 h-4" />
              <span>{isAr ? 'طابور الرسائل والإشعارات' : 'Notification Outbox'}</span>
              {failedNotificationsCount > 0 && (
                <span className="bg-rose-500 text-white text-[10px] px-1.5 py-0.2 rounded-full font-bold">
                  {failedNotificationsCount}
                </span>
              )}
            </button>
          )}
        </div>
      </div>

      {/* =========================================================================
          ACTIVE VIEW CONTENT
      ========================================================================= */}
      {activeTab === 'justifications' ? (
        <JustificationsView />
      ) : (
        <NotificationOutboxView />
      )}
    </div>
  );
};

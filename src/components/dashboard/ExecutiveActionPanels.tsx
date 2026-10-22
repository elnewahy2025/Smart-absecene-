import React from 'react';
import { ActiveTab } from '../HeaderNav';
import { ChevronLeft, FileCheck2, School, Send, ShieldAlert, UserX } from 'lucide-react';
import { useExecutiveDashboardAnalytics } from '../../hooks/useExecutiveDashboardAnalytics';

type ExecutiveAnalytics = ReturnType<typeof useExecutiveDashboardAnalytics>;

interface ExecutiveActionPanelsProps {
  isAr: boolean;
  onNavigateTab: (tab: ActiveTab) => void;
  classesByAbsence: ExecutiveAnalytics['classesByAbsence'];
  onCampusCount: number;
  activeStudentsCount: number;
  pendingJustifications: ExecutiveAnalytics['pendingJustifications'];
  atRiskStudents: ExecutiveAnalytics['atRiskStudents'];
}

// DECISION & ACTION WORKBENCH (ZERO REDUNDANCY):
// Column 1: Classes with Highest Absence Rate (Where to Intervene)
// Column 2: Urgent Immediate Action Desk (Safety + Pending Excuses + Denial Alerts)
export const ExecutiveActionPanels: React.FC<ExecutiveActionPanelsProps> = ({
  isAr,
  onNavigateTab,
  classesByAbsence,
  onCampusCount,
  activeStudentsCount,
  pendingJustifications,
  atRiskStudents,
}) => (
  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
    {/* Column 1: Classes Needing Attention (Highest Absence) */}
    <div
      className="app-card rounded-2xl border p-5 shadow-2xs flex flex-col justify-between"
      style={{ backgroundColor: 'var(--app-card-bg)', borderColor: 'var(--app-card-border)' }}
    >
      <div className="space-y-3">
        <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
          <div className="flex items-center gap-2">
            <School className="w-4 h-4 text-rose-600 dark:text-rose-400" />
            <h3 className="text-sm font-bold" style={{ color: 'var(--app-text-main)' }}>
              {isAr ? 'الفصول الأكثر تسجيلاً للغياب (تتطلب تدخلاً إدارياً)' : 'Classes with Highest Absence (Intervention Priority)'}
            </h3>
          </div>
          <button
            onClick={() => onNavigateTab('sessions')}
            className="text-xs text-primary hover:underline font-bold flex items-center gap-1 cursor-pointer"
          >
            <span>{isAr ? 'كشوف الحصص' : 'Sessions'}</span>
            <ChevronLeft className="w-3 h-3 rtl:rotate-0 ltr:rotate-180" />
          </button>
        </div>

        <div className="space-y-2.5 pt-1">
          {classesByAbsence.map((c, idx) => (
            <div
              key={c.classId || c.className}
              className="flex items-center justify-between p-2.5 rounded-xl bg-slate-50/70 dark:bg-slate-800/40 border border-slate-200/60 dark:border-slate-700/60 hover:border-rose-300 transition-colors"
            >
              <div className="flex items-center gap-2.5">
                <span className="w-5 h-5 rounded-full bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300 font-bold text-[10px] flex items-center justify-center">
                  {idx + 1}
                </span>
                <div>
                  <span className="font-bold text-xs text-slate-900 dark:text-slate-100 block">
                    {isAr ? `فصل ${c.className}` : `Class ${c.className}`}
                  </span>
                  <span className="text-[10px] text-slate-500">
                    {c.grade} · {c.activeStudents} {isAr ? 'طالب' : 'students'}
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <div className="w-20 sm:w-28 bg-slate-200 dark:bg-slate-700 h-2 rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full ${
                      c.absenceRate >= 15 ? 'bg-rose-500' : c.absenceRate >= 8 ? 'bg-amber-500' : 'bg-primary'
                    }`}
                    style={{ width: `${Math.min(100, Math.max(5, c.absenceRate))}%` }}
                  />
                </div>
                <span
                  className={`text-xs font-bold font-mono px-2 py-0.5 rounded-md ${
                    c.absenceRate >= 15
                      ? 'bg-rose-100 text-rose-800 dark:bg-rose-950/60 dark:text-rose-300'
                      : 'bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300'
                  }`}
                >
                  {c.absenceRate}% {isAr ? 'غياب' : 'absent'}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="pt-3 border-t border-slate-100 dark:border-slate-800 mt-3 flex items-center justify-between text-xs text-slate-500">
        <span>{isAr ? 'مستند إلى السجلات المعتمدة' : 'Based on submitted records'}</span>
        <button
          onClick={() => onNavigateTab('reports')}
          className="text-xs text-rose-600 dark:text-rose-400 font-bold hover:underline cursor-pointer"
        >
          {isAr ? 'تقرير مقارنة الفصول المجمع ←' : 'Comparative Class Report →'}
        </button>
      </div>
    </div>

    {/* Column 2: Immediate Action Desk (Safety + Pending Excuses + Denial Risk) */}
    <div
      className="app-card rounded-2xl border p-5 shadow-2xs flex flex-col justify-between"
      style={{ backgroundColor: 'var(--app-card-bg)', borderColor: 'var(--app-card-border)' }}
    >
      <div className="space-y-4">
        {/* Campus Headcount Snapshot Bar */}
        <div className="bg-slate-900 text-white rounded-xl p-3 shadow-xs flex items-center justify-between text-xs">
          <div className="flex items-center gap-2">
            <ShieldAlert className="w-4 h-4 text-rose-400" />
            <span className="font-bold">{isAr ? 'حصر أمان المبنى (الإخلاء)' : 'Safety Headcount'}</span>
          </div>
          <div className="flex items-center gap-3 font-medium">
            <span className="text-emerald-300">
              {isAr ? 'بالمبنى:' : 'On Campus:'} <strong className="font-mono text-white">{onCampusCount}</strong>
            </span>
            <span className="text-rose-300">
              {isAr ? 'غائبون:' : 'Absent:'}{' '}
              <strong className="font-mono text-white">{Math.max(0, activeStudentsCount - onCampusCount)}</strong>
            </span>
            <button
              onClick={() => onNavigateTab('emergency')}
              className="bg-white/10 hover:bg-white/20 px-2 py-0.5 rounded text-[10px] font-bold cursor-pointer transition-colors"
            >
              {isAr ? 'كشف الإخلاء ←' : 'Roster →'}
            </button>
          </div>
        </div>

        {/* Pending Excuses Review Queue */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
              <FileCheck2 className="w-3.5 h-3.5 text-amber-600" />
              <span>{isAr ? 'أعذار بحاجة لاعتماد عاجل' : 'Urgent Excuses Pending Review'}</span>
            </span>
            <button
              onClick={() => onNavigateTab('justifications')}
              className="text-[11px] text-amber-600 dark:text-amber-400 font-bold hover:underline cursor-pointer"
            >
              {isAr ? 'عرض الكل' : 'View all'}
            </button>
          </div>

          {pendingJustifications.slice(0, 2).map((j) => (
            <div
              key={j.id}
              className="flex items-center justify-between p-2.5 rounded-xl bg-amber-50/50 dark:bg-amber-950/20 border border-amber-200/50 dark:border-amber-900/30 text-xs"
            >
              <div>
                <span className="font-bold text-slate-800 dark:text-slate-200 block">{j.studentName}</span>
                <span className="text-[10px] text-slate-500">
                  {j.absenceDate} · {j.reasonType === 'medical' ? (isAr ? 'عذر طبي' : 'Medical') : (isAr ? 'عذر أسري' : 'Family')}
                </span>
              </div>
              <button
                onClick={() => onNavigateTab('justifications')}
                className="px-2.5 py-1 bg-amber-600 hover:bg-amber-700 text-white font-bold rounded-lg text-[10px] cursor-pointer transition-colors"
              >
                {isAr ? 'مراجعة' : 'Review'}
              </button>
            </div>
          ))}

          {pendingJustifications.length === 0 && (
            <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/40 text-center text-xs text-slate-400">
              {isAr ? 'لا توجد أعذار معلقة حالياً' : 'No pending excuses'}
            </div>
          )}
        </div>

        {/* High-Risk Chronic Absence Intervention */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
              <UserX className="w-3.5 h-3.5 text-rose-600" />
              <span>{isAr ? 'إنذارات الحرمان والتدخل السريع' : 'High Absence Interventions'}</span>
            </span>
            <button
              onClick={() => onNavigateTab('outbox')}
              className="text-[11px] text-rose-600 dark:text-rose-400 font-bold hover:underline cursor-pointer"
            >
              {isAr ? 'إرسال إنذارات' : 'Send warnings'}
            </button>
          </div>

          {atRiskStudents.slice(0, 2).map((s) => (
            <div
              key={s.id}
              className="flex items-center justify-between p-2.5 rounded-xl bg-rose-50/50 dark:bg-rose-950/20 border border-rose-200/50 dark:border-rose-900/30 text-xs"
            >
              <div className="flex items-center gap-2">
                <span className="w-6 h-6 rounded-md bg-rose-600 text-white font-bold text-[11px] flex items-center justify-center">
                  {s.totalAbsences}
                </span>
                <div>
                  <span className="font-bold text-slate-800 dark:text-slate-200 block">{s.fullName}</span>
                  <span className="text-[10px] text-slate-500">{s.className}</span>
                </div>
              </div>
              <button
                onClick={() => onNavigateTab('outbox')}
                className="p-1.5 rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:text-primary transition-colors cursor-pointer"
                title={isAr ? 'إرسال إنذار فوري' : 'Send warning'}
              >
                <Send className="w-3.5 h-3.5" />
              </button>
            </div>
          ))}

          {atRiskStudents.length === 0 && (
            <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/40 text-center text-xs text-slate-400">
              {isAr ? 'لا توجد حالات غياب حرج حالياً' : 'No chronic absence alerts'}
            </div>
          )}
        </div>
      </div>

      <div className="pt-3 border-t border-slate-100 dark:border-slate-800 mt-3 flex items-center justify-between text-xs text-slate-500">
        <span>{isAr ? 'حالة النظام: متصل ومنضبط' : 'System: Operational'}</span>
        <button
          onClick={() => onNavigateTab('outbox')}
          className="text-xs text-primary font-bold hover:underline cursor-pointer"
        >
          {isAr ? 'طابور الإشعارات الصادرة ←' : 'Notification Outbox →'}
        </button>
      </div>
    </div>
  </div>
);

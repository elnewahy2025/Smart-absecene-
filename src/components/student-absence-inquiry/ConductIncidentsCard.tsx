import type { StudentBehaviourIncident } from '../../types/attendance';
import { Award, ShieldAlert } from 'lucide-react';

interface ConductIncidentsCardProps {
  isAr: boolean;
  infractionsList: StudentBehaviourIncident[];
  positivePointsList: StudentBehaviourIncident[];
}

export function ConductIncidentsCard({ isAr, infractionsList, positivePointsList }: ConductIncidentsCardProps) {
  return (
  <div
    className="app-card rounded-2xl border p-5 sm:p-6 shadow-2xs space-y-4"
    style={{ backgroundColor: 'var(--app-card-bg)', borderColor: 'var(--app-card-border)' }}
  >
    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 dark:border-slate-800 pb-4">
      <div className="flex items-center gap-2.5">
        <div className="p-2 rounded-xl bg-violet-500/10 text-violet-500">
          <ShieldAlert className="w-5 h-5" />
        </div>
        <div>
          <h3 className="text-sm sm:text-base font-bold" style={{ color: 'var(--app-text-main)' }}>
            {isAr ? 'سجل المخالفات والتصرفات السلوكية' : 'Conduct Infractions & Violations'}
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            {isAr
              ? 'المخالفات المرصودة وفق لائحة السلوك والمواظبة المدرسية والإجراءات المتخذة.'
              : 'Logged behavioral incidents and disciplinary actions.'}
          </p>
        </div>
      </div>

      <div className="flex items-center gap-2">
        <span className="text-xs px-3 py-1 rounded-full bg-slate-100 dark:bg-slate-800 font-bold text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
          {infractionsList.length} {isAr ? 'مخالفة' : 'infractions'}
        </span>
        {positivePointsList.length > 0 && (
          <span className="text-xs px-2.5 py-1 rounded-full bg-primary/10 text-primary border border-primary/20 font-bold">
            ✨ +{positivePointsList.reduce((acc, p) => acc + (p.points || 0), 0)} {isAr ? 'نقاط تميز' : 'merits'}
          </span>
        )}
      </div>
    </div>

    <div className="space-y-2.5">
      {infractionsList.map((incident) => (
        <div
          key={incident.id}
          className="p-3.5 rounded-xl bg-rose-50/50 dark:bg-rose-950/20 border border-rose-200/50 dark:border-rose-900/30 text-xs space-y-2"
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="px-2 py-0.5 rounded bg-rose-600 text-white font-bold text-[10px]">
                {incident.severity === 'major'
                  ? isAr ? 'مخالفة جسيمة' : 'Major'
                  : incident.severity === 'moderate'
                  ? isAr ? 'مخالفة متوسطة' : 'Moderate'
                  : isAr ? 'مخالفة بسيطة' : 'Minor'}
              </span>
              <span className="font-bold text-slate-900 dark:text-slate-100 text-xs sm:text-sm">
                {incident.title}
              </span>
            </div>
            <span className="font-mono text-xs text-slate-500 font-bold">{incident.date}</span>
          </div>

          {incident.description && (
            <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
              {incident.description}
            </p>
          )}

          <div className="flex items-center justify-between text-[11px] text-slate-500 pt-1.5 border-t border-rose-100 dark:border-rose-900/40">
            <span className="font-semibold text-rose-800 dark:text-rose-300">
              {isAr ? 'الإجراء المتخذ: ' : 'Action: '} {incident.actionTaken || (isAr ? 'قيد المتابعة من المرشد' : 'Pending')}
            </span>
            <span>
              {isAr ? 'الراصد: ' : 'By: '} {incident.recordedBy}
            </span>
          </div>
        </div>
      ))}

      {infractionsList.length === 0 && (
        <div className="p-8 text-center text-slate-400 space-y-1 rounded-xl bg-slate-50/50 dark:bg-slate-800/30 border border-dashed border-slate-200 dark:border-slate-700">
          <Award className="w-8 h-8 text-primary mx-auto" />
          <p className="text-xs font-bold text-slate-600 dark:text-slate-300">
            {isAr ? 'سجل السلوك نظيف تماماً!' : 'Clean Conduct Record!'}
          </p>
          <p className="text-[11px] text-slate-400">
            {isAr
              ? 'لم تسجل أي مخالفات سلوكية على الطالب خلال هذه الفترة.'
              : 'No infractions recorded for this student in the chosen timeframe.'}
          </p>
        </div>
      )}
    </div>
  </div>
  );
}

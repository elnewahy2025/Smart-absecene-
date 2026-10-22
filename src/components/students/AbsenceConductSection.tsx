import React from 'react';
import { Award, CheckCircle2 } from 'lucide-react';
import { StudentBehaviourIncident } from '../../types/attendance';

interface AbsenceConductSectionProps {
  isAr: boolean;
  infractions: StudentBehaviourIncident[];
  positiveCount: number;
}

// Conduct & Behaviour Section
export const AbsenceConductSection: React.FC<AbsenceConductSectionProps> = ({
  isAr,
  infractions,
  positiveCount,
}) => (
      <div className="space-y-2">
        <div className="flex items-center justify-between text-xs font-bold text-slate-800 dark:text-slate-200">
          <span className="flex items-center gap-1.5">
            <Award className="w-4 h-4 text-indigo-600" />
            <span>{isAr ? 'سجل السلوك والمخالفات في الفترة:' : 'Conduct & Behavior:'}</span>
          </span>
          <span className="font-mono text-[11px] text-slate-500">
            {infractions.length} {isAr ? 'مخالفات' : 'infractions'} | {positiveCount} {isAr ? 'نقاط إيجابية' : 'positive'}
          </span>
        </div>

        {infractions.length > 0 ? (
          <div className="space-y-2">
            {infractions.map((incident) => (
              <div
                key={incident.id}
                className="p-3 rounded-xl bg-rose-50/50 dark:bg-rose-950/20 border border-rose-200/50 dark:border-rose-900/30 text-xs space-y-1.5"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="px-1.5 py-0.5 rounded bg-rose-600 text-white font-bold text-[10px]">
                      {incident.severity === 'major'
                        ? isAr ? 'جسيمة' : 'Major'
                        : incident.severity === 'moderate'
                        ? isAr ? 'متوسطة' : 'Moderate'
                        : isAr ? 'بسيطة' : 'Minor'}
                    </span>
                    <span className="font-bold text-slate-900 dark:text-slate-100">
                      {incident.title}
                    </span>
                  </div>
                  <span className="font-mono text-[11px] text-slate-500 font-bold">{incident.date}</span>
                </div>
                {incident.description && (
                  <p className="text-[11px] text-slate-600 dark:text-slate-300">
                    {incident.description}
                  </p>
                )}
                <div className="flex items-center justify-between text-[10px] text-slate-500 pt-1 border-t border-rose-100 dark:border-rose-900/30">
                  <span>{isAr ? 'الإجراء: ' : 'Action: '} {incident.actionTaken || 'قيد المتابعة'}</span>
                  <span>{isAr ? 'الراصد: ' : 'By: '} {incident.recordedBy}</span>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="p-4 text-center rounded-xl bg-slate-50/60 dark:bg-slate-800/30 border border-dashed border-slate-200 dark:border-slate-700 text-xs text-slate-500 flex items-center justify-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>{isAr ? 'سجل السلوك نظيف تماماً في هذه الفترة — لا توجد مخالفات مسجلة.' : 'Clean conduct record in this timeframe.'}</span>
          </div>
        )}
      </div>
);

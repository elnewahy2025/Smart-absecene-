import React from 'react';
import { Sparkles, AlertCircle, Shield } from 'lucide-react';
import type { DailyEmailDigestItem, Tenant } from '../../types/attendance';

interface DigestBriefingBoxProps {
  currentDigest: DailyEmailDigestItem;
  currentTenant: Tenant;
  lang: string;
}

export const DigestBriefingBox: React.FC<DigestBriefingBoxProps> = ({ currentDigest, currentTenant, lang }) => {
  const briefing = currentDigest.geminiBriefing;
  if (!briefing) return null;

  return (
      <div className="bg-gradient-to-br from-emerald-900 to-slate-900 rounded-2xl p-6 text-white shadow-md relative overflow-hidden">
        <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-emerald-800/80">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-emerald-500/20 border border-emerald-400/40 flex items-center justify-center text-emerald-300">
              <Sparkles className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-bold text-sm text-emerald-200">
                  {briefing.headline ||
                    (lang === 'ar'
                      ? 'موجز القيادة الصباحي (Gemini Executive Synthesis)'
                      : 'Gemini Morning Briefing')}
                </h3>
                <span
                  className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                    briefing.urgencyLevel === 'critical'
                      ? 'bg-red-500 text-white'
                      : briefing.urgencyLevel === 'elevated'
                      ? 'bg-amber-500 text-slate-950 font-black'
                      : 'bg-emerald-500 text-white'
                  }`}
                >
                  {briefing.urgencyLevel === 'critical'
                    ? lang === 'ar'
                      ? 'مستوى حرج'
                      : 'Critical'
                    : briefing.urgencyLevel === 'elevated'
                    ? lang === 'ar'
                      ? 'مستوى مرتفع'
                      : 'Elevated'
                    : lang === 'ar'
                    ? 'مستوى اعتيادي'
                    : 'Normal'}
                </span>
              </div>
              <p className="text-[11px] text-slate-300">
                {lang === 'ar'
                  ? `نُسقت خصيصاً لقيادة مدرسة ${currentTenant.name} لصبيحة يوم ${currentDigest.date}`
                  : `Prepared for ${currentTenant.name} leadership`}
              </p>
            </div>
          </div>

          <div className="text-[11px] bg-white/10 px-3 py-1 rounded-full text-emerald-200 border border-white/10">
            ⚡ {lang === 'ar' ? 'توجيهات العمل قبل الحصة الأولى (07:45 ص)' : 'Pre-Bell Directives'}
          </div>
        </div>

        {/* Summary Text */}
        <p className="text-xs sm:text-sm text-slate-200 mt-4 leading-relaxed font-medium">
          {briefing.executiveSummary}
        </p>

        {/* Key Priorities Grid */}
        <div className="mt-5 grid grid-cols-1 md:grid-cols-2 gap-3">
          <div className="bg-white/10 backdrop-blur-xs rounded-xl p-3.5 border border-white/10 space-y-2">
            <div className="text-xs font-bold text-emerald-300 flex items-center gap-1.5">
              <AlertCircle className="w-3.5 h-3.5" />
              <span>
                {lang === 'ar'
                  ? 'إجراءات الإدارة ذات الأولوية القصوى:'
                  : 'Immediate Administration Priorities:'}
              </span>
            </div>
            <ul className="space-y-1.5 text-xs text-slate-200 pr-4 list-disc">
              {briefing.keyPriorities.map((item, idx) => (
                <li key={idx} className="leading-snug">
                  {item}
                </li>
              ))}
            </ul>
          </div>

          <div className="bg-white/10 backdrop-blur-xs rounded-xl p-3.5 border border-white/10 space-y-2">
            <div className="text-xs font-bold text-amber-300 flex items-center gap-1.5">
              <Shield className="w-3.5 h-3.5" />
              <span>
                {lang === 'ar'
                  ? 'توجيهات المتابعة للموجه الطلابي:'
                  : 'Student Counselor Directives:'}
              </span>
            </div>
            <ul className="space-y-1.5 text-xs text-slate-200 pr-4 list-disc">
              {briefing.counselorDirectives.map((item, idx) => (
                <li key={idx} className="leading-snug">
                  {item}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
  );
};

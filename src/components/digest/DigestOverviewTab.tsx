import React from 'react';
import { DailyEmailDigestItem, Tenant } from '../../types/attendance';
import { RefreshCw } from 'lucide-react';
import { DigestKpiCards } from './DigestKpiCards';
import { DigestBriefingBox } from './DigestBriefingBox';
import { DigestAnomaliesSection } from './DigestAnomaliesSection';
import { DigestPendingJustificationsSection } from './DigestPendingJustificationsSection';
import { DigestHighRiskSection } from './DigestHighRiskSection';

interface DigestOverviewTabProps {
  currentDigest: DailyEmailDigestItem | null;
  loading: boolean;
  currentTenant: Tenant;
  lang: string;
  onNavigateToTab?: (tab: string) => void;
}

export const DigestOverviewTab: React.FC<DigestOverviewTabProps> = ({
  currentDigest,
  loading,
  currentTenant,
  lang,
  onNavigateToTab,
}) => {
  if (loading) {
    return (
      <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center space-y-3">
        <RefreshCw className="w-8 h-8 text-emerald-600 animate-spin mx-auto" />
        <p className="text-sm font-semibold text-slate-700">
          {lang === 'ar'
            ? 'جارٍ فحص سجلات الحضور ورصد الشذوذات واستدعاء الذكاء الاصطناعي...'
            : 'Analyzing attendance anomalies and synthesizing Gemini morning briefing...'}
        </p>
      </div>
    );
  }

  if (!currentDigest) return null;

  return (
    <div className="space-y-6">
      <DigestKpiCards currentDigest={currentDigest} lang={lang} />

      <DigestBriefingBox currentDigest={currentDigest} currentTenant={currentTenant} lang={lang} />

      <DigestAnomaliesSection
        currentDigest={currentDigest}
        lang={lang}
        onNavigateToTab={onNavigateToTab}
      />

      <DigestPendingJustificationsSection
        currentDigest={currentDigest}
        lang={lang}
        onNavigateToTab={onNavigateToTab}
      />

      <DigestHighRiskSection
        currentDigest={currentDigest}
        lang={lang}
        onNavigateToTab={onNavigateToTab}
      />
    </div>
  );
};

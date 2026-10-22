import { useEffect, useState } from 'react';
import type {
  AttendanceSession,
  AuditLog,
  DailyEmailDigestConfig,
  DailyEmailDigestItem,
  Justification,
  Student,
  UserProfile,
} from '../types/attendance';
import { localCache } from '../utils/localCache';
import { computeDailyDigestData, generateHtmlEmailTemplate } from '../utils/digestEngine';
import { authenticatedFetch } from '../lib/api';

const DEFAULT_DIGEST_CONFIG: DailyEmailDigestConfig = {
  enabled: true,
  scheduledTime: '06:45',
  daysOfWeek: [0, 1, 2, 3, 4],
  recipients: [],
  includeAnomalies: true,
  includePendingJustifications: true,
  includeHighRiskStudents: true,
  includeGeminiBriefing: true,
  chronicAbsenceThreshold: 5,
  consecutiveAbsenceDaysThreshold: 2,
  anomalySpikePercentage: 25,
  notifyViaWhatsAppToo: true,
  principalPhone: '',
};

interface UseDailyDigestParams {
  tenantId: string;
  tenantName: string;
  currentUser: UserProfile;
  students: Student[];
  sessions: AttendanceSession[];
  justifications: Justification[];
  canDispatchDigest: boolean;
  addAuditLog: (entry: Omit<AuditLog, 'id' | 'tenantId' | 'timestamp'>) => void;
}

export function useDailyDigest({
  tenantId,
  tenantName,
  currentUser,
  students,
  sessions,
  justifications,
  canDispatchDigest,
  addAuditLog,
}: UseDailyDigestParams) {
  const [digestConfig, setDigestConfig] = useState<DailyEmailDigestConfig>(() => {
    const saved = localCache.getItem('school_digest_config');
    return saved ? JSON.parse(saved) : DEFAULT_DIGEST_CONFIG;
  });

  const [digestHistory, setDigestHistory] = useState<DailyEmailDigestItem[]>(() => {
    const saved = localCache.getItem('school_digest_history');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch {
        return [];
      }
    }
    return [];
  });

  useEffect(() => {
    localCache.setItem('school_digest_config', JSON.stringify(digestConfig));
  }, [digestConfig]);

  useEffect(() => {
    localCache.setItem('school_digest_history', JSON.stringify(digestHistory));
  }, [digestHistory]);

  const updateDigestConfig = (cfg: Partial<DailyEmailDigestConfig>) => {
    setDigestConfig((prev) => {
      const updated = { ...prev, ...cfg };
      addAuditLog({
        entityType: 'settings',
        entityId: `digest-config-${tenantId}`,
        action: 'update',
        performerId: currentUser.id,
        performerName: currentUser.name,
        performerRole: currentUser.role,
        details: `تحديث إعدادات النشرة الصباحية اليومية (وقت الإرسال: ${updated.scheduledTime} ص، حالة التفعيل: ${updated.enabled ? 'مفعلة' : 'معطلة'}، عدد المستلمين: ${updated.recipients.length}).`,
        detailsEn: `Updating daily morning digest settings (send time: ${updated.scheduledTime} AM, activation status: ${updated.enabled ? 'Enabled' : 'Disabled'}, number of recipients: ${updated.recipients.length}).`,
      });
      return updated;
    });
  };

  const generateCurrentDigest = async (
    customConfig?: Partial<DailyEmailDigestConfig>
  ): Promise<DailyEmailDigestItem> => {
    const effectiveConfig = { ...digestConfig, ...(customConfig || {}) };
    const baseData = computeDailyDigestData({
      tenantId,
      tenantName,
      students,
      sessions,
      justifications,
      config: effectiveConfig,
    });

    let geminiBriefing: any = undefined;
    if (effectiveConfig.includeGeminiBriefing) {
      try {
        const res = await authenticatedFetch('/api/daily-digest/generate-briefing', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            tenantName,
            date: baseData.date,
            overallAttendanceRate: baseData.overallAttendanceRate,
            totalStudents: baseData.totalStudents,
            anomalies: baseData.anomalies,
            pendingJustificationsCount: baseData.pendingJustificationsCount,
            pendingIrregularCount: baseData.pendingJustifications.filter(
              (j) => j.aiRiskLevel === 'high' || j.aiVerificationStatus === 'irregular'
            ).length,
            highRiskStudents: baseData.highRiskStudents,
          }),
        });
        if (res.ok) {
          const json = await res.json();
          if (json.briefing) {
            geminiBriefing = json.briefing;
          }
        }
      } catch (err) {
        console.warn('Gemini briefing generation fallback:', err);
      }
    }

    // When the AI briefing is requested but unavailable, the digest is sent with
    // the real attendance data only — no fabricated briefing is injected.

    const digestItem: DailyEmailDigestItem = {
      ...baseData,
      id: `digest-${Date.now()}`,
      dispatchedAt: new Date().toISOString(),
      status: 'scheduled',
      geminiBriefing,
    };

    digestItem.htmlContent = generateHtmlEmailTemplate(digestItem, tenantName);
    return digestItem;
  };

  const dispatchDailyDigest = async (
    digestId?: string,
    targetRecipients?: string[]
  ): Promise<{ success: boolean; message: string; digestItem: DailyEmailDigestItem }> => {
    if (!canDispatchDigest) {
      throw new Error('Unauthorized: Daily digest dispatch requires administrator or registrar privileges.');
    }
    // Generate fresh digest
    const digest = await generateCurrentDigest();
    const effectiveRecipients = targetRecipients && targetRecipients.length > 0 ? targetRecipients : digest.recipients;

    try {
      const res = await authenticatedFetch('/api/daily-digest/dispatch', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          recipients: effectiveRecipients,
          subject: digest.subject,
          htmlContent: digest.htmlContent,
          scheduledTime: digest.scheduledTime,
          digestId: digest.id,
        }),
      });

      const resJson = res.ok ? await res.json() : null;

      if (!res.ok || !resJson) {
        const reason = resJson?.error || `The email transport rejected the daily digest (HTTP ${res.status}).`;
        const failedDigest: DailyEmailDigestItem = {
          ...digest,
          status: 'failed',
          dispatchedAt: new Date().toISOString(),
          recipients: effectiveRecipients,
        };
        setDigestHistory((prev) => [failedDigest, ...prev.slice(0, 49)]);
        addAuditLog({
          entityType: 'settings',
          entityId: failedDigest.id,
          action: 'submit',
          performerId: currentUser.id,
          performerName: currentUser.name,
          performerRole: currentUser.role,
          details: `فشل إرسال النشرة الصباحية اليومية إلى قيادات المدرسة (${effectiveRecipients.length} مستلم): ${reason}`,
          detailsEn: `Failed to send the daily morning digest to school leadership (${effectiveRecipients.length} recipients): ${reason}`,
        });
        return { success: false, message: reason, digestItem: failedDigest };
      }

      const dispatchedDigest: DailyEmailDigestItem = {
        ...digest,
        status: 'delivered',
        dispatchedAt: resJson.dispatchedAt || new Date().toISOString(),
        recipients: effectiveRecipients,
      };

      setDigestHistory((prev) => [dispatchedDigest, ...prev.slice(0, 49)]);
      setDigestConfig((prev) => ({
        ...prev,
        lastDispatchedAt: dispatchedDigest.dispatchedAt,
        lastDigestId: dispatchedDigest.id,
      }));

      addAuditLog({
        entityType: 'settings',
        entityId: dispatchedDigest.id,
        action: 'submit',
        performerId: currentUser.id,
        performerName: currentUser.name,
        performerRole: currentUser.role,
        details: `إرسال النشرة الصباحية اليومية إلى قيادات المدرسة (${effectiveRecipients.length} مستلم) متضمنة ${digest.anomaliesCount} شذوذات و${digest.pendingJustificationsCount} أعذار معلقة و${digest.highRiskStudentsCount} طلاب في النطاق الحرج.`,
        detailsEn: `Sending the daily morning digest to school leadership (${effectiveRecipients.length} recipients) including ${digest.anomaliesCount} anomalies, ${digest.pendingJustificationsCount} pending excuses, and ${digest.highRiskStudentsCount} students in the critical range.`,
      });

      return {
        success: true,
        message: resJson.message || `تم إرسال النشرة الصباحية بنجاح إلى ${effectiveRecipients.length} من قيادات المدرسة.`,
        digestItem: dispatchedDigest,
      };
    } catch (err: any) {
      const reason = err?.message || 'Network error while dispatching the daily digest.';
      console.error('Failed to dispatch digest:', err);
      const failedDigest: DailyEmailDigestItem = {
        ...digest,
        status: 'failed',
        dispatchedAt: new Date().toISOString(),
        recipients: effectiveRecipients,
      };
      setDigestHistory((prev) => [failedDigest, ...prev.slice(0, 49)]);

      addAuditLog({
        entityType: 'settings',
        entityId: failedDigest.id,
        action: 'submit',
        performerId: currentUser.id,
        performerName: currentUser.name,
        performerRole: currentUser.role,
        details: `فشل إرسال النشرة الصباحية اليومية إلى قيادات المدرسة (${effectiveRecipients.length} مستلم): ${reason}`,
        detailsEn: `Failed to send the daily morning digest to school leadership (${effectiveRecipients.length} recipients): ${reason}`,
      });

      return {
        success: false,
        message: `فشل إرسال النشرة الصباحية: ${reason}`,
        digestItem: failedDigest,
      };
    }
  };

  return {
    digestConfig,
    digestHistory,
    updateDigestConfig,
    generateCurrentDigest,
    dispatchDailyDigest,
  };
}

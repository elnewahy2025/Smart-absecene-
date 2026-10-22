// @vitest-environment jsdom
import React from 'react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import type {
  DailyDigestAnomaly,
  DailyDigestHighRiskStudent,
  DailyDigestPendingExcuse,
  DailyEmailDigestItem,
} from '../../types/attendance';
import { DigestAnomaliesSection } from './DigestAnomaliesSection';
import { DigestPendingJustificationsSection } from './DigestPendingJustificationsSection';
import { DigestHighRiskSection } from './DigestHighRiskSection';

afterEach(cleanup);

const anomaly = (overrides: Partial<DailyDigestAnomaly> = {}): DailyDigestAnomaly => ({
  id: 'a1',
  type: 'class_spike',
  severity: 'critical',
  titleAr: 'ارتفاع الغياب في 10/أ',
  titleEn: 'Absence spike in 10/A',
  descriptionAr: 'ارتفع الغياب إلى 30%',
  metric: '30%',
  targetName: '10/أ',
  suggestedActionAr: 'التواصل مع أولياء الأمور',
  ...overrides,
});

const excuse = (overrides: Partial<DailyDigestPendingExcuse> = {}): DailyDigestPendingExcuse => ({
  id: 'j1',
  studentName: 'أحمد علي',
  className: '10/أ',
  absenceDate: '2026-10-20',
  reasonType: 'medical',
  aiVerificationStatus: 'verified',
  aiRiskLevel: 'low',
  integrityScore: 92,
  flagsAr: [],
  actionRequiredAr: 'اعتماد العذر',
  ...overrides,
});

const highRisk = (overrides: Partial<DailyDigestHighRiskStudent> = {}): DailyDigestHighRiskStudent => ({
  id: 's1',
  name: 'سارة محمد',
  grade: '10',
  className: '10/ب',
  totalAbsences: 9,
  totalLates: 2,
  attendanceRate: 72,
  riskTier: 'tier_8_plus',
  guardianName: 'محمد',
  guardianPhone: '0555000000',
  primaryConcernAr: 'غياب متكرر',
  actionRequiredAr: 'استدعاء ولي الأمر',
  ...overrides,
});

const digest = (overrides: Partial<DailyEmailDigestItem> = {}): DailyEmailDigestItem => ({
  id: 'd1',
  tenantId: 't1',
  date: '2026-10-21',
  dispatchedAt: '2026-10-21T06:45:00.000Z',
  scheduledTime: '06:45',
  recipients: [],
  subject: 'Digest',
  status: 'delivered',
  overallAttendanceRate: 94.2,
  totalStudents: 120,
  anomaliesCount: 1,
  pendingJustificationsCount: 1,
  highRiskStudentsCount: 1,
  anomalies: [anomaly()],
  highRiskStudents: [highRisk()],
  pendingJustifications: [excuse()],
  ...overrides,
});

describe('DigestAnomaliesSection', () => {
  it('renders the anomaly rows with severity, metric and action', () => {
    render(<DigestAnomaliesSection currentDigest={digest()} lang="ar" />);
    expect(screen.getByText('أولاً: شذوذات وتناقضات الحضور المرصودة (1)')).toBeTruthy();
    expect(screen.getByText('ارتفاع الغياب في 10/أ')).toBeTruthy();
    expect(screen.getByText('شذوذ حرج')).toBeTruthy();
    expect(screen.getByText('30%')).toBeTruthy();
    expect(screen.getByText('ارتفع الغياب إلى 30%')).toBeTruthy();
    expect(screen.getByText('التواصل مع أولياء الأمور')).toBeTruthy();
  });

  it('maps warning and info severities', () => {
    const { rerender } = render(
      <DigestAnomaliesSection currentDigest={digest({ anomalies: [anomaly({ severity: 'warning' })] })} lang="ar" />
    );
    expect(screen.getByText('تنبيه شذوذ')).toBeTruthy();
    rerender(
      <DigestAnomaliesSection currentDigest={digest({ anomalies: [anomaly({ severity: 'info' })] })} lang="ar" />
    );
    expect(screen.getByText('Info')).toBeTruthy();
  });

  it('offers deep links only for navigable anomaly types', () => {
    const onNavigateToTab = vi.fn();
    const { rerender } = render(
      <DigestAnomaliesSection
        currentDigest={digest({ anomalies: [anomaly({ type: 'unsubmitted_session' })] })}
        lang="ar"
        onNavigateToTab={onNavigateToTab}
      />
    );
    fireEvent.click(screen.getByText('فتح الكشوف للاعتماد'));
    expect(onNavigateToTab).toHaveBeenCalledWith('sessions');

    rerender(
      <DigestAnomaliesSection
        currentDigest={digest({ anomalies: [anomaly({ type: 'pattern_discrepancy' })] })}
        lang="ar"
        onNavigateToTab={onNavigateToTab}
      />
    );
    fireEvent.click(screen.getByText('تدقيق الأعذار'));
    expect(onNavigateToTab).toHaveBeenCalledWith('justifications');

    rerender(
      <DigestAnomaliesSection
        currentDigest={digest({ anomalies: [anomaly({ type: 'unsubmitted_session' })] })}
        lang="ar"
      />
    );
    expect(screen.queryByText('فتح الكشوف للاعتماد')).toBeNull();
  });

  it('shows the all-clear empty state', () => {
    render(<DigestAnomaliesSection currentDigest={digest({ anomalies: [] })} lang="ar" />);
    expect(screen.getByText('✅ لا توجد شذوذات سلوكية أو غيابات غير اعتيادية مسجلة هذا الصباح.')).toBeTruthy();
  });
});

describe('DigestPendingJustificationsSection', () => {
  it('renders excuse rows with integrity and AI verdicts', () => {
    render(<DigestPendingJustificationsSection currentDigest={digest()} lang="ar" />);
    expect(screen.getByText('ثانياً: طلبات الأعذار الطبية المعلقة بانتظار الاعتماد (1)')).toBeTruthy();
    expect(screen.getByText('أحمد علي')).toBeTruthy();
    expect(screen.getByText('10/أ')).toBeTruthy();
    expect(screen.getByText('2026-10-20')).toBeTruthy();
    expect(screen.getByText('medical')).toBeTruthy();
    expect(screen.getByText('سليم ومطابق')).toBeTruthy();
    expect(screen.getByText('92%')).toBeTruthy();
    expect(screen.getByText('اعتماد العذر')).toBeTruthy();
  });

  it('flags suspicious and warning verdicts and handles missing scores', () => {
    const { rerender } = render(
      <DigestPendingJustificationsSection
        currentDigest={digest({ pendingJustifications: [excuse({ aiRiskLevel: 'high', integrityScore: 20 })] })}
        lang="ar"
      />
    );
    expect(screen.getByText('مشبوه / تناقض')).toBeTruthy();
    expect(screen.getByText('20%')).toBeTruthy();

    rerender(
      <DigestPendingJustificationsSection
        currentDigest={digest({
          pendingJustifications: [excuse({ aiRiskLevel: 'medium', aiVerificationStatus: 'warning', integrityScore: undefined })],
        })}
        lang="ar"
      />
    );
    expect(screen.getByText('تنبيه فحص')).toBeTruthy();
    expect(screen.getByText('—')).toBeTruthy();
  });

  it('navigates to the audit tab and renders the empty state', () => {
    const onNavigateToTab = vi.fn();
    const { rerender } = render(
      <DigestPendingJustificationsSection currentDigest={digest()} lang="ar" onNavigateToTab={onNavigateToTab} />
    );
    fireEvent.click(screen.getByText('الانتقال للتدقيق'));
    expect(onNavigateToTab).toHaveBeenCalledWith('justifications');

    rerender(<DigestPendingJustificationsSection currentDigest={digest({ pendingJustifications: [] })} lang="ar" />);
    expect(screen.getByText('✅ لا توجد طلبات أعذار معلقة بانتظار الاعتماد.')).toBeTruthy();
  });
});

describe('DigestHighRiskSection', () => {
  it('renders the chronic-risk rows with tier, absences and contact link', () => {
    render(<DigestHighRiskSection currentDigest={digest()} lang="ar" />);
    expect(screen.getByText('ثالثاً: الطلاب الأكثر عرضة لخطر الحرمان والإنذارات (1)')).toBeTruthy();
    expect(screen.getByText('سارة محمد')).toBeTruthy();
    expect(screen.getByText('10/ب')).toBeTruthy();
    expect(screen.getByText('9 يوم')).toBeTruthy();
    expect(screen.getByText('72%')).toBeTruthy();
    expect(screen.getByText('إنذار نهائي 3 (حرمان)')).toBeTruthy();
    expect(screen.getByText('محمد')).toBeTruthy();
    expect(screen.getByText('استدعاء ولي الأمر')).toBeTruthy();
    expect(screen.getByText('0555000000').closest('a')?.getAttribute('href')).toBe('tel:0555000000');
  });

  it('maps the other risk tiers', () => {
    const { rerender } = render(
      <DigestHighRiskSection currentDigest={digest({ highRiskStudents: [highRisk({ riskTier: 'tier_5_plus', totalAbsences: 6 })] })} lang="ar" />
    );
    expect(screen.getByText('إنذار ثان (5-7 أيام)')).toBeTruthy();
    rerender(
      <DigestHighRiskSection currentDigest={digest({ highRiskStudents: [highRisk({ riskTier: 'tier_3_plus', totalAbsences: 3 })] })} lang="ar" />
    );
    expect(screen.getByText('تنبيه أولي')).toBeTruthy();
  });

  it('navigates to the chronic report and renders the empty state', () => {
    const onNavigateToTab = vi.fn();
    const { rerender } = render(
      <DigestHighRiskSection currentDigest={digest()} lang="ar" onNavigateToTab={onNavigateToTab} />
    );
    fireEvent.click(screen.getByText('تقرير الحرمان المفصل'));
    expect(onNavigateToTab).toHaveBeenCalledWith('reports');

    rerender(<DigestHighRiskSection currentDigest={digest({ highRiskStudents: [] })} lang="ar" />);
    expect(screen.getByText('✅ لا يوجد طلاب في الشريحة الحرجة حالياً.')).toBeTruthy();
  });
});

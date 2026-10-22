// @vitest-environment jsdom
import React from 'react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { cleanup, render, screen } from '@testing-library/react';
import type { DailyEmailDigestItem, Tenant } from '../../types/attendance';
import { DigestOverviewTab } from './DigestOverviewTab';

afterEach(cleanup);

const tenant = { id: 't1', name: 'مدرسة النور' } as unknown as Tenant;

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
  anomaliesCount: 0,
  pendingJustificationsCount: 0,
  highRiskStudentsCount: 0,
  anomalies: [],
  highRiskStudents: [],
  pendingJustifications: [],
  ...overrides,
});

describe('DigestOverviewTab', () => {
  it('shows the analysing state while loading', () => {
    render(<DigestOverviewTab currentDigest={null} loading currentTenant={tenant} lang="ar" />);
    expect(screen.getByText('جارٍ فحص سجلات الحضور ورصد الشذوذات واستدعاء الذكاء الاصطناعي...')).toBeTruthy();
  });

  it('renders nothing without a digest', () => {
    const { container } = render(
      <DigestOverviewTab currentDigest={null} loading={false} currentTenant={tenant} lang="ar" />
    );
    expect(container.innerHTML).toBe('');
  });

  it('composes the KPI cards and the three briefing sections', () => {
    render(
      <DigestOverviewTab
        currentDigest={digest({
          anomaliesCount: 2,
          pendingJustificationsCount: 1,
          highRiskStudentsCount: 3,
        })}
        loading={false}
        currentTenant={tenant}
        lang="ar"
        onNavigateToTab={vi.fn()}
      />
    );
    expect(screen.getByText('معدل الحضور التراكمي')).toBeTruthy();
    expect(screen.getByText('أولاً: شذوذات وتناقضات الحضور المرصودة (2)')).toBeTruthy();
    expect(screen.getByText('ثانياً: طلبات الأعذار الطبية المعلقة بانتظار الاعتماد (1)')).toBeTruthy();
    expect(screen.getByText('ثالثاً: الطلاب الأكثر عرضة لخطر الحرمان والإنذارات (3)')).toBeTruthy();
  });

  it('forwards navigation to the extracted sections', () => {
    const onNavigateToTab = vi.fn();
    render(
      <DigestOverviewTab
        currentDigest={digest()}
        loading={false}
        currentTenant={tenant}
        lang="ar"
        onNavigateToTab={onNavigateToTab}
      />
    );
    screen.getByText('تقرير الحرمان المفصل').click();
    expect(onNavigateToTab).toHaveBeenCalledWith('reports');
  });
});

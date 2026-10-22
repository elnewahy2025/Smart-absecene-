// @vitest-environment jsdom
import React from 'react';
import { afterEach, describe, expect, it } from 'vitest';
import { cleanup, render, screen } from '@testing-library/react';
import type { DailyEmailDigestItem, Tenant } from '../../types/attendance';
import { DigestBriefingBox } from './DigestBriefingBox';

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
  geminiBriefing: {
    headline: 'موجز صباحي',
    executiveSummary: 'هناك ارتفاع ملحوظ في الغياب بالصف العاشر.',
    urgencyLevel: 'normal',
    keyPriorities: ['متابعة الصف العاشر', 'اعتماد الكشوف'],
    counselorDirectives: ['التواصل مع أولياء الأمور'],
  },
  ...overrides,
});

describe('DigestBriefingBox', () => {
  it('renders nothing without a briefing', () => {
    const { container } = render(<DigestBriefingBox currentDigest={digest({ geminiBriefing: undefined })} currentTenant={tenant} lang="ar" />);
    expect(container.innerHTML).toBe('');
  });

  it('renders the headline, summary and both directive lists', () => {
    render(<DigestBriefingBox currentDigest={digest()} currentTenant={tenant} lang="ar" />);
    expect(screen.getByText('موجز صباحي')).toBeTruthy();
    expect(screen.getByText('هناك ارتفاع ملحوظ في الغياب بالصف العاشر.')).toBeTruthy();
    expect(screen.getByText('إجراءات الإدارة ذات الأولوية القصوى:')).toBeTruthy();
    expect(screen.getByText('توجيهات المتابعة للموجه الطلابي:')).toBeTruthy();
    expect(screen.getByText('متابعة الصف العاشر')).toBeTruthy();
    expect(screen.getByText('اعتماد الكشوف')).toBeTruthy();
    expect(screen.getByText('التواصل مع أولياء الأمور')).toBeTruthy();
    expect(screen.getByText('مستوى اعتيادي')).toBeTruthy();
    expect(screen.getByText(/مدرسة النور/)).toBeTruthy();
  });

  it('falls back to the default headline', () => {
    render(
      <DigestBriefingBox
        currentDigest={digest({ geminiBriefing: { ...digest().geminiBriefing!, headline: undefined } })}
        currentTenant={tenant}
        lang="ar"
      />
    );
    expect(screen.getByText('موجز القيادة الصباحي (Gemini Executive Synthesis)')).toBeTruthy();
  });

  it('maps urgency levels', () => {
    const { rerender } = render(
      <DigestBriefingBox
        currentDigest={digest({ geminiBriefing: { ...digest().geminiBriefing!, urgencyLevel: 'critical' } })}
        currentTenant={tenant}
        lang="ar"
      />
    );
    expect(screen.getByText('مستوى حرج')).toBeTruthy();
    rerender(
      <DigestBriefingBox
        currentDigest={digest({ geminiBriefing: { ...digest().geminiBriefing!, urgencyLevel: 'elevated' } })}
        currentTenant={tenant}
        lang="ar"
      />
    );
    expect(screen.getByText('مستوى مرتفع')).toBeTruthy();
  });

  it('renders English copy', () => {
    render(
      <DigestBriefingBox
        currentDigest={digest({ geminiBriefing: { ...digest().geminiBriefing!, headline: undefined, urgencyLevel: 'critical' } })}
        currentTenant={tenant}
        lang="en"
      />
    );
    expect(screen.getByText('Gemini Morning Briefing')).toBeTruthy();
    expect(screen.getByText('Critical')).toBeTruthy();
    expect(document.body.textContent).toContain('Pre-Bell Directives');
    expect(screen.getByText('Immediate Administration Priorities:')).toBeTruthy();
    expect(screen.getByText('Student Counselor Directives:')).toBeTruthy();
  });
});

// @vitest-environment jsdom
import React from 'react';
import { afterEach, describe, expect, it } from 'vitest';
import { cleanup, render, screen } from '@testing-library/react';
import type { DailyEmailDigestItem } from '../../types/attendance';
import { DigestKpiCards } from './DigestKpiCards';

afterEach(cleanup);

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

describe('DigestKpiCards', () => {
  it('renders the four executive metrics', () => {
    render(<DigestKpiCards currentDigest={digest()} lang="ar" />);
    expect(screen.getByText('معدل الحضور التراكمي')).toBeTruthy();
    expect(screen.getByText('94.2%')).toBeTruthy();
    expect(screen.getByText('120 طالب')).toBeTruthy();
    expect(screen.getByText('شذوذات وتناقضات مرصودة')).toBeTruthy();
    expect(screen.getByText('طلاب في النطاق الحرج')).toBeTruthy();
    expect(screen.getByText('أعذار طبية قيد التدقيق')).toBeTruthy();
  });

  it('shows calm copy when there are no anomalies and urgent copy when there are', () => {
    const { rerender } = render(<DigestKpiCards currentDigest={digest()} lang="ar" />);
    expect(screen.getByText('لا توجد شذوذات حرجة')).toBeTruthy();
    rerender(<DigestKpiCards currentDigest={digest({ anomaliesCount: 3 })} lang="ar" />);
    expect(screen.getByText('3')).toBeTruthy();
    expect(screen.getByText('تتطلب تدخلاً إدارياً عاجلاً')).toBeTruthy();
  });

  it('renders English labels', () => {
    render(<DigestKpiCards currentDigest={digest({ anomaliesCount: 2, highRiskStudentsCount: 4 })} lang="en" />);
    expect(screen.getByText('Overall Attendance Rate')).toBeTruthy();
    expect(screen.getByText('Total Students:')).toBeTruthy();
    expect(screen.getByText('Attendance Anomalies')).toBeTruthy();
    expect(screen.getByText('Requires early intervention')).toBeTruthy();
    expect(screen.getByText('High-Risk Students')).toBeTruthy();
    expect(screen.getByText('Exceeded chronic threshold')).toBeTruthy();
    expect(screen.getByText('Pending Excuses')).toBeTruthy();
    expect(screen.getByText('Awaiting committee review')).toBeTruthy();
  });
});

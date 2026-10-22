// @vitest-environment jsdom
import React from 'react';
import { afterEach, describe, expect, it } from 'vitest';
import { cleanup, render, screen } from '@testing-library/react';
import type { NotificationOutboxItem } from '../../types/attendance';
import { NotificationRecordDetails } from './NotificationRecordDetails';

afterEach(cleanup);

const notification = (overrides: Partial<NotificationOutboxItem> = {}): NotificationOutboxItem => ({
  id: 'n1',
  tenantId: 'school-1',
  recipientPhone: '0555000000',
  recipientName: 'علي محمد',
  studentId: 's1',
  studentName: 'أحمد علي',
  absenceDate: '2026-01-05',
  sessionTitle: 'الحصة الأولى',
  statusType: 'absent',
  category: 'absence',
  messageText: 'نفيدكم بغياب ابنكم اليوم',
  channel: 'WhatsApp',
  status: 'sent',
  retryCount: 0,
  createdAt: '2026-01-05T06:30:00.000Z',
  ...overrides,
});

const renderDetails = (overrides: Partial<NotificationOutboxItem> = {}) =>
  render(<NotificationRecordDetails data={notification(overrides)} />);

const formatSentAt = (iso: string) =>
  new Date(iso).toLocaleString('ar-SA', { dateStyle: 'medium', timeStyle: 'short' });

describe('NotificationRecordDetails', () => {
  it('renders the message, recipient and delivery metadata', () => {
    renderDetails();
    expect(screen.getByText('نفيدكم بغياب ابنكم اليوم')).toBeTruthy();
    expect(screen.getByText('علي محمد')).toBeTruthy();
    expect(screen.getByText('0555000000')).toBeTruthy();
    expect(screen.getByText('2026-01-05')).toBeTruthy();
    expect(screen.getByText(formatSentAt('2026-01-05T06:30:00.000Z'))).toBeTruthy();
    expect(screen.getByText('تم التسليم بنجاح')).toBeTruthy();
  });

  it('maps the notification category badges', () => {
    const { rerender } = renderDetails();
    expect(screen.getByText('إشعار غياب فوري')).toBeTruthy();
    rerender(<NotificationRecordDetails data={notification({ category: 'warning' })} />);
    expect(screen.getByText('إنذار أكاديمي رسمي')).toBeTruthy();
    rerender(<NotificationRecordDetails data={notification({ statusType: 'late', category: 'late' })} />);
    expect(screen.getByText('تنبيه تأخر صباحي')).toBeTruthy();
    rerender(<NotificationRecordDetails data={notification({ statusType: 'present', category: 'excuse_approved' })} />);
    expect(screen.getByText('اعتماد عذر طبي')).toBeTruthy();
    rerender(<NotificationRecordDetails data={notification({ statusType: 'present', category: 'broadcast' })} />);
    expect(screen.getByText('تعميم مدرسي')).toBeTruthy();
  });

  it('distinguishes WhatsApp from SMS delivery', () => {
    const { rerender } = renderDetails();
    expect(screen.getByText('واتساب')).toBeTruthy();
    rerender(<NotificationRecordDetails data={notification({ channel: 'SMS' })} />);
    expect(screen.getByText('رسالة نصية SMS')).toBeTruthy();
  });
});

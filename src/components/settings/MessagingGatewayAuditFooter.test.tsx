// @vitest-environment jsdom
import React from 'react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import type { SchoolMessagingGatewayConfig } from '../../types/attendance';
import { MessagingGatewayAuditFooter } from './MessagingGatewayAuditFooter';

afterEach(cleanup);

const config = (overrides: Partial<SchoolMessagingGatewayConfig> = {}): SchoolMessagingGatewayConfig =>
  ({
    whatsappPhoneNumber: '0501234567',
    whatsappServiceMode: 'web_direct',
    smsProvider: 'taqnyat',
    smsSenderId: 'SMARTSCHOOL',
    enableWhatsAppNotifications: true,
    enableSmsNotifications: true,
    lastConfiguredByRole: 'super_admin',
    lastConfiguredByEmail: 'owner@school.sa',
    lastConfiguredAt: '2026-10-20T09:30:00.000Z',
    ...overrides,
  }) as SchoolMessagingGatewayConfig;

describe('MessagingGatewayAuditFooter', () => {
  it('renders the audit trail for the platform owner', () => {
    render(<MessagingGatewayAuditFooter gatewayConfig={config()} lang="ar" isSuperAdmin onSubmit={vi.fn()} />);
    const text = document.body.textContent || '';
    expect(text).toContain('سجل التوثيق: تم الضبط الأخير بواسطة');
    expect(text).toContain('مالك المنصة (The Owner)');
    expect(text).toContain('(owner@school.sa)');
    expect(text).toContain(new Date('2026-10-20T09:30:00.000Z').toLocaleString('ar-SA'));
  });

  it('labels other roles as system administrators', () => {
    render(
      <MessagingGatewayAuditFooter
        gatewayConfig={config({ lastConfiguredByRole: 'admin', lastConfiguredByEmail: undefined, lastConfiguredAt: undefined })}
        lang="ar"
        isSuperAdmin={false}
        onSubmit={vi.fn()}
      />
    );
    expect(screen.getByText('مسؤول النظام')).toBeTruthy();
    expect(screen.queryByText(/بتاريخ:/)).toBeNull();
    expect(screen.queryByText('حفظ واعتماد التغييرات')).toBeNull();
  });

  it('invokes the save handler from the admin footer button', () => {
    const onSubmit = vi.fn();
    render(<MessagingGatewayAuditFooter gatewayConfig={config()} lang="ar" isSuperAdmin onSubmit={onSubmit} />);
    fireEvent.click(screen.getByText('حفظ واعتماد التغييرات'));
    expect(onSubmit).toHaveBeenCalledTimes(1);
  });

  it('renders English copy and owner role', () => {
    render(
      <MessagingGatewayAuditFooter gatewayConfig={config()} lang="en" isSuperAdmin onSubmit={vi.fn()} />
    );
    expect(document.body.textContent).toContain('Audit log: last configured by');
    expect(document.body.textContent).toContain('Platform owner (The Owner)');
    expect(screen.getByText('Save and apply changes')).toBeTruthy();
  });
});

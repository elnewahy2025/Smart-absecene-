// @vitest-environment jsdom
import React from 'react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import type { SchoolMessagingGatewayConfig } from '../../types/attendance';
import { SmsGatewaySection } from './SmsGatewaySection';

afterEach(cleanup);

function makeForm(overrides: Partial<SchoolMessagingGatewayConfig> = {}): SchoolMessagingGatewayConfig {
  return {
    whatsappPhoneNumber: '0501234567',
    whatsappServiceMode: 'web_direct',
    smsProvider: 'taqnyat',
    smsSenderId: 'SMARTSCHOOL',
    smsApiKey: 'key-123',
    smsApiSecret: 'secret-456',
    enableWhatsAppNotifications: false,
    enableSmsNotifications: true,
    ...overrides,
  } as SchoolMessagingGatewayConfig;
}

function renderSection(overrides: Partial<React.ComponentProps<typeof SmsGatewaySection>> = {}) {
  const props = {
    form: makeForm(),
    handleFieldChange: vi.fn(),
    lang: 'ar' as const,
    isSuperAdmin: true,
    ...overrides,
  };
  return { ...render(<SmsGatewaySection {...props} />), props };
}

describe('SmsGatewaySection', () => {
  it('renders the persisted SMS settings', () => {
    renderSection();
    expect((screen.getByRole('combobox') as HTMLSelectElement).value).toBe('taqnyat');
    expect((screen.getByPlaceholderText('e.g. AL-MAJD أو SMARTSCHOOL') as HTMLInputElement).value).toBe(
      'SMARTSCHOOL'
    );
    expect((screen.getByPlaceholderText('أدخل مفتاح الـ API...') as HTMLInputElement).value).toBe('key-123');
    expect((screen.getByPlaceholderText('أدخل الرمز السري...') as HTMLInputElement).value).toBe('secret-456');
    expect((screen.getByRole('checkbox') as HTMLInputElement).checked).toBe(true);
  });

  it('offers all four providers', () => {
    renderSection();
    const options = Array.from((screen.getByRole('combobox') as HTMLSelectElement).options).map((o) => o.value);
    expect(options).toEqual(['taqnyat', 'unifonic', 'msegat', 'twilio']);
  });

  it('emits provider, sender id and notification changes', () => {
    const { props } = renderSection();
    fireEvent.change(screen.getByRole('combobox'), { target: { value: 'twilio' } });
    expect(props.handleFieldChange).toHaveBeenCalledWith('smsProvider', 'twilio');

    fireEvent.change(screen.getByPlaceholderText('e.g. AL-MAJD أو SMARTSCHOOL'), {
      target: { value: 'AL-MAJD' },
    });
    expect(props.handleFieldChange).toHaveBeenCalledWith('smsSenderId', 'AL-MAJD');

    fireEvent.click(screen.getByRole('checkbox'));
    expect(props.handleFieldChange).toHaveBeenCalledWith('enableSmsNotifications', false);
  });

  it('toggles the API key and secret visibility independently', () => {
    renderSection();
    const key = screen.getByPlaceholderText('أدخل مفتاح الـ API...') as HTMLInputElement;
    const secret = screen.getByPlaceholderText('أدخل الرمز السري...') as HTMLInputElement;
    expect(key.type).toBe('password');
    expect(secret.type).toBe('password');

    fireEvent.click(key.parentElement!.querySelector('button')!);
    expect((screen.getByPlaceholderText('أدخل مفتاح الـ API...') as HTMLInputElement).type).toBe('text');
    expect((screen.getByPlaceholderText('أدخل الرمز السري...') as HTMLInputElement).type).toBe('password');

    fireEvent.click(secret.parentElement!.querySelector('button')!);
    expect((screen.getByPlaceholderText('أدخل الرمز السري...') as HTMLInputElement).type).toBe('text');
  });

  it('edits the credentials', () => {
    const { props } = renderSection();
    fireEvent.change(screen.getByPlaceholderText('أدخل مفتاح الـ API...'), { target: { value: 'new-key' } });
    expect(props.handleFieldChange).toHaveBeenCalledWith('smsApiKey', 'new-key');
    fireEvent.change(screen.getByPlaceholderText('أدخل الرمز السري...'), { target: { value: 'new-secret' } });
    expect(props.handleFieldChange).toHaveBeenCalledWith('smsApiSecret', 'new-secret');
  });

  it('locks every control for non-owner accounts', () => {
    renderSection({ isSuperAdmin: false });
    expect((screen.getByRole('combobox') as HTMLSelectElement).disabled).toBe(true);
    expect((screen.getByPlaceholderText('e.g. AL-MAJD أو SMARTSCHOOL') as HTMLInputElement).disabled).toBe(true);
    expect((screen.getByPlaceholderText('أدخل مفتاح الـ API...') as HTMLInputElement).disabled).toBe(true);
    expect((screen.getByPlaceholderText('أدخل الرمز السري...') as HTMLInputElement).disabled).toBe(true);
    expect((screen.getByRole('checkbox') as HTMLInputElement).disabled).toBe(true);
  });

  it('renders English copy and provider labels', () => {
    renderSection({ lang: 'en' });
    expect(screen.getByText('Enable sending SMS messages:')).toBeTruthy();
    expect(screen.getByText('Approved SMS service provider:')).toBeTruthy();
    expect(screen.getByText('Approved sender name (Sender ID):')).toBeTruthy();
    expect(
      Array.from((screen.getByRole('combobox') as HTMLSelectElement).options).map((o) => o.textContent)
    ).toContain('Taqnyat (Taqnyat - approved Saudi gateway)');
  });
});

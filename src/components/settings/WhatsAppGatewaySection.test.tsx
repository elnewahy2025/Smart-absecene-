// @vitest-environment jsdom
import React from 'react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import type { SchoolMessagingGatewayConfig } from '../../types/attendance';
import { openWhatsAppDirect } from '../../utils/whatsappUtils';
import { WhatsAppGatewaySection } from './WhatsAppGatewaySection';

vi.mock('../../utils/whatsappUtils', async (importOriginal) => {
  const actual = await importOriginal<typeof import('../../utils/whatsappUtils')>();
  return { ...actual, openWhatsAppDirect: vi.fn() };
});

afterEach(cleanup);

function makeForm(overrides: Partial<SchoolMessagingGatewayConfig> = {}): SchoolMessagingGatewayConfig {
  return {
    whatsappPhoneNumber: '0501234567',
    whatsappServiceMode: 'web_direct',
    smsProvider: 'taqnyat',
    smsSenderId: 'SMARTSCHOOL',
    enableWhatsAppNotifications: true,
    enableSmsNotifications: false,
    ...overrides,
  } as SchoolMessagingGatewayConfig;
}

function renderSection(overrides: Partial<React.ComponentProps<typeof WhatsAppGatewaySection>> = {}) {
  const props = {
    form: makeForm(),
    handleFieldChange: vi.fn(),
    lang: 'ar' as const,
    isSuperAdmin: true,
    schoolName: 'مدرسة المجد',
    defaultCallingCode: '+966',
    ...overrides,
  };
  return { ...render(<WhatsAppGatewaySection {...props} />), props };
}

const phoneInput = () => screen.getByPlaceholderText('0501234567') as HTMLInputElement;
const radios = () => screen.getAllByRole('radio') as HTMLInputElement[];

describe('WhatsAppGatewaySection', () => {
  it('renders the persisted number and the international format preview', () => {
    renderSection();
    expect(phoneInput().value).toBe('0501234567');
    expect(screen.getByText('+966501234567')).toBeTruthy();
    expect((screen.getByRole('checkbox') as HTMLInputElement).checked).toBe(true);
  });

  it('hides the format preview for an empty number', () => {
    renderSection({ form: makeForm({ whatsappPhoneNumber: '' }) });
    expect(screen.queryByText(/\+966501234567/)).toBeNull();
  });

  it('emits field changes for the number and the notification toggle', () => {
    const { props } = renderSection();
    fireEvent.change(phoneInput(), { target: { value: '0555999888' } });
    expect(props.handleFieldChange).toHaveBeenCalledWith('whatsappPhoneNumber', '0555999888');
    fireEvent.click(screen.getByRole('checkbox'));
    expect(props.handleFieldChange).toHaveBeenCalledWith('enableWhatsAppNotifications', false);
  });

  it('emits the selected service mode', () => {
    const { props } = renderSection();
    expect(radios()[0].checked).toBe(true);
    fireEvent.click(radios()[1]);
    expect(props.handleFieldChange).toHaveBeenCalledWith('whatsappServiceMode', 'cloud_api');
  });

  it('shows the Cloud API credentials only in cloud_api mode', () => {
    const { rerender, props } = renderSection();
    expect(screen.queryByText('Business Account ID:')).toBeNull();

    rerender(<WhatsAppGatewaySection {...props} form={makeForm({ whatsappServiceMode: 'cloud_api' })} />);
    expect(screen.getByText('Business Account ID:')).toBeTruthy();
    expect(screen.getByText('Phone Number ID:')).toBeTruthy();
    expect(screen.getByText('Permanent System Access Token:')).toBeTruthy();
    expect(radios()[1].checked).toBe(true);
  });

  it('edits the Cloud API credentials and toggles token visibility', () => {
    const { props } = renderSection({ form: makeForm({ whatsappServiceMode: 'cloud_api' }) });
    fireEvent.change(screen.getByPlaceholderText('e.g. 10928374659102'), { target: { value: '1092' } });
    expect(props.handleFieldChange).toHaveBeenCalledWith('whatsappBusinessAccountId', '1092');
    fireEvent.change(screen.getByPlaceholderText('e.g. 1049283746501'), { target: { value: '1049' } });
    expect(props.handleFieldChange).toHaveBeenCalledWith('whatsappPhoneNumberId', '1049');

    const token = screen.getByPlaceholderText('EAABw...') as HTMLInputElement;
    expect(token.type).toBe('password');
    fireEvent.change(token, { target: { value: 'EAABtoken' } });
    expect(props.handleFieldChange).toHaveBeenCalledWith('whatsappApiToken', 'EAABtoken');

    fireEvent.click(token.parentElement!.querySelector('button')!);
    expect((screen.getByPlaceholderText('EAABw...') as HTMLInputElement).type).toBe('text');
  });

  it('opens a test WhatsApp conversation for the entered parent number', () => {
    renderSection();
    fireEvent.change(screen.getByPlaceholderText('أدخل رقم ولي أمر للتجربة (مثال: 050xxxxxxx)'), {
      target: { value: '0555111222' },
    });
    fireEvent.click(screen.getByText('تجربة فتح واتساب ويب'));
    expect(openWhatsAppDirect).toHaveBeenCalledWith(
      '0555111222',
      expect.stringContaining('مدرسة المجد'),
      '966'
    );
  });

  it('falls back to the saved school number for the test message', () => {
    renderSection();
    fireEvent.click(screen.getByText('تجربة فتح واتساب ويب'));
    expect(openWhatsAppDirect).toHaveBeenCalledWith(expect.stringContaining('0501234567'), expect.any(String), '966');
  });

  it('locks every control for non-owner accounts', () => {
    renderSection({ isSuperAdmin: false });
    expect(phoneInput().disabled).toBe(true);
    expect((screen.getByRole('checkbox') as HTMLInputElement).disabled).toBe(true);
    expect(radios().every((r) => r.disabled)).toBe(true);
  });

  it('renders English copy', () => {
    renderSection({ lang: 'en' });
    expect(screen.getByText('Enable WhatsApp notifications:')).toBeTruthy();
    expect(screen.getByText('School WhatsApp service mode:')).toBeTruthy();
    expect(screen.getByText('Test opening WhatsApp Web')).toBeTruthy();
  });
});

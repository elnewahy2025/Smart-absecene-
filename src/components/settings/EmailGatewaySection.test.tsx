// @vitest-environment jsdom
import React from 'react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import type { SchoolMessagingGatewayConfig } from '../../types/attendance';
import { EmailGatewaySection } from './EmailGatewaySection';

afterEach(cleanup);

function makeForm(overrides: Partial<SchoolMessagingGatewayConfig> = {}): SchoolMessagingGatewayConfig {
  return {
    emailEnabled: true,
    emailProvider: 'smtp',
    fromEmail: 'no-reply@school.sa',
    fromName: 'مدرسة المجد',
    smtpHost: 'smtp.school.sa',
    smtpPort: 587,
    smtpSecure: true,
    smtpUser: 'mailer@school.sa',
    smtpPass: 'secret',
    emailApiKey: '',
    ...overrides,
  } as SchoolMessagingGatewayConfig;
}

function renderSection(overrides: Partial<React.ComponentProps<typeof EmailGatewaySection>> = {}) {
  const props = {
    form: makeForm(),
    handleFieldChange: vi.fn(),
    lang: 'ar' as const,
    isSuperAdmin: true,
    schoolName: 'مدرسة المجد',
    ...overrides,
  };
  return { ...render(<EmailGatewaySection {...props} />), props };
}

const checkboxes = () => screen.getAllByRole('checkbox') as HTMLInputElement[];

describe('EmailGatewaySection', () => {
  it('renders the persisted email settings', () => {
    renderSection();

    expect((screen.getByRole('combobox') as HTMLSelectElement).value).toBe('smtp');
    expect((screen.getAllByPlaceholderText('no-reply@school.sa')[0] as HTMLInputElement).value).toBe(
      'no-reply@school.sa'
    );
    expect((screen.getByPlaceholderText('مدرسة المجد') as HTMLInputElement).value).toBe('مدرسة المجد');
    expect((screen.getByPlaceholderText('smtp.school.sa') as HTMLInputElement).value).toBe(
      'smtp.school.sa'
    );
    expect(checkboxes()[0].checked).toBe(true);
    expect(checkboxes()[1].checked).toBe(true);
  });

  it('toggles email enabled', () => {
    const { props } = renderSection();

    fireEvent.click(checkboxes()[0]);

    expect(props.handleFieldChange).toHaveBeenCalledWith('emailEnabled', false);
  });

  it('emits provider changes', () => {
    const { props } = renderSection();

    fireEvent.change(screen.getByRole('combobox'), { target: { value: 'resend' } });

    expect(props.handleFieldChange).toHaveBeenCalledWith('emailProvider', 'resend');
  });

  it('emits sender and SMTP field changes', () => {
    const { props } = renderSection();

    fireEvent.change(screen.getAllByPlaceholderText('no-reply@school.sa')[0], {
      target: { value: 'digest@school.sa' },
    });
    fireEvent.change(screen.getByPlaceholderText('مدرسة المجد'), { target: { value: 'اسم جديد' } });
    fireEvent.change(document.querySelector('input[type="number"]') as HTMLInputElement, {
      target: { value: '465' },
    });
    fireEvent.click(checkboxes()[1]);

    expect(props.handleFieldChange).toHaveBeenCalledWith('fromEmail', 'digest@school.sa');
    expect(props.handleFieldChange).toHaveBeenCalledWith('fromName', 'اسم جديد');
    expect(props.handleFieldChange).toHaveBeenCalledWith('smtpPort', 465);
    expect(props.handleFieldChange).toHaveBeenCalledWith('smtpSecure', false);
  });

  it('shows the SMTP password masked and reveals it on demand', () => {
    renderSection();

    const password = screen.getByPlaceholderText('••••••••') as HTMLInputElement;
    expect(password.type).toBe('password');

    fireEvent.click(screen.getByRole('button'));

    expect((screen.getByPlaceholderText('••••••••') as HTMLInputElement).type).toBe('text');
  });

  it('renders API credentials instead of SMTP fields for API providers', () => {
    renderSection({ form: makeForm({ emailProvider: 'sendgrid', emailApiKey: 'key-123' }) });

    expect(screen.queryByPlaceholderText('smtp.school.sa')).toBeNull();
    expect((screen.getByPlaceholderText('أدخل مفتاح الـ API...') as HTMLInputElement).value).toBe(
      'key-123'
    );
  });

  it('reveals the API key on demand', () => {
    renderSection({ form: makeForm({ emailProvider: 'resend', emailApiKey: 'key-123' }) });

    const apiKey = () => screen.getByPlaceholderText('أدخل مفتاح الـ API...') as HTMLInputElement;
    expect(apiKey().type).toBe('password');

    fireEvent.click(screen.getByRole('button'));

    expect(apiKey().type).toBe('text');
  });

  it('disables every control for non-owner users', () => {
    renderSection({ isSuperAdmin: false });

    expect((screen.getByRole('combobox') as HTMLSelectElement).disabled).toBe(true);
    expect(checkboxes().every((c) => c.disabled)).toBe(true);
    expect(
      Array.from(document.querySelectorAll('input:not([type="checkbox"])')).every(
        (el) => (el as HTMLInputElement).disabled
      )
    ).toBe(true);
  });

  it('uses the English copy when lang is en', () => {
    renderSection({ lang: 'en' });

    expect(screen.getByText('Email (daily morning digest)')).toBeTruthy();
    expect(screen.getByText('Email provider:')).toBeTruthy();
  });
});

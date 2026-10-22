// @vitest-environment jsdom
import React from 'react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import type { SchoolProvisionInput } from '../../types/attendance';
import { SchoolProvisionForm } from './SchoolProvisionForm';

afterEach(cleanup);

const NAME_AR = 'مثال: مدرسة المجد الثانوية الأهلية';
const CODE = 'MAJD-303';
const SUBDOMAIN = 'majd';
const SCHOOL_ID = 'school-majd';
const PRINCIPAL_EMAIL = 'principal@majd-school.edu.sa';
const COUNTRY = 'المملكة العربية السعودية / مصر / الإمارات...';
const CITY = 'الرياض / مكة / الدمام / القاهرة';

function renderForm(overrides: Partial<React.ComponentProps<typeof SchoolProvisionForm>> = {}) {
  const defaults = {
    onProvision: vi.fn(async (_input: SchoolProvisionInput) => ({ success: true, message: 'created' })),
    onProvisioned: vi.fn(),
    onError: vi.fn(),
    onCancel: vi.fn(),
  };
  const utils = render(<SchoolProvisionForm {...defaults} {...overrides} />);
  const form = utils.container.querySelector('form') as HTMLFormElement;
  const props = {
    onProvision: (overrides.onProvision as unknown as typeof defaults.onProvision) ?? defaults.onProvision,
    onProvisioned: (overrides.onProvisioned as unknown as typeof defaults.onProvisioned) ?? defaults.onProvisioned,
    onError: (overrides.onError as unknown as typeof defaults.onError) ?? defaults.onError,
    onCancel: (overrides.onCancel as unknown as typeof defaults.onCancel) ?? defaults.onCancel,
  };
  return { ...utils, form, props };
}

function submit(form: HTMLFormElement) {
  fireEvent.submit(form);
}

describe('SchoolProvisionForm', () => {
  it('derives the logo letter from the Arabic school name', () => {
    renderForm();
    const input = screen.getByPlaceholderText(NAME_AR) as HTMLInputElement;

    fireEvent.change(input, { target: { value: 'مدرسة المجد' } });

    expect(input.value).toBe('مدرسة المجد');
  });

  it('sanitizes the subdomain and auto-fills the school id and principal email', () => {
    renderForm();

    fireEvent.change(screen.getByPlaceholderText(SUBDOMAIN), {
      target: { value: '  Al-Majd 99! ' },
    });

    expect((screen.getByPlaceholderText(SUBDOMAIN) as HTMLInputElement).value).toBe('al-majd99');
    expect((screen.getByPlaceholderText(SCHOOL_ID) as HTMLInputElement).value).toBe('school-al-majd99');
    expect((screen.getByPlaceholderText(PRINCIPAL_EMAIL) as HTMLInputElement).value).toBe(
      'principal@al-majd99-school.edu.sa'
    );
  });

  it('updates the calling code and phone when the country changes', () => {
    renderForm();
    const country = screen.getByPlaceholderText(COUNTRY) as HTMLInputElement;

    fireEvent.change(country, { target: { value: 'جمهورية مصر العربية' } });

    expect((screen.getByPlaceholderText('+966') as HTMLInputElement).value).toBe('+20');
    expect((screen.getByDisplayValue('+20500000000') as HTMLInputElement).value).toBe('+20500000000');
  });

  it('submits a normalized payload with defaults for optional fields', async () => {
    const { form, props } = renderForm();

    fireEvent.change(screen.getByPlaceholderText(NAME_AR), { target: { value: '  مدرسة المجد  ' } });
    fireEvent.change(screen.getByPlaceholderText(CODE), { target: { value: ' majd-303 ' } });
    fireEvent.change(screen.getByPlaceholderText(CITY), { target: { value: 'جدة' } });

    submit(form);

    await waitFor(() => expect(props.onProvision).toHaveBeenCalledTimes(1));
    expect(props.onProvision.mock.calls[0][0]).toMatchObject({
      nameAr: 'مدرسة المجد',
      nameEn: 'مدرسة المجد',
      code: 'MAJD-303',
      cityAr: 'جدة',
      cityEn: 'Riyadh',
      countryAr: 'المملكة العربية السعودية',
      countryCallingCode: '+966',
      logoText: 'م',
      schoolType: 'boys',
      primaryColor: '#7c3aed',
    });
    expect(props.onProvisioned).toHaveBeenCalledWith('created');
    expect(props.onError).not.toHaveBeenCalled();
  });

  it('resets the identity fields after a successful provision', async () => {
    const { form, props } = renderForm();

    fireEvent.change(screen.getByPlaceholderText(NAME_AR), { target: { value: 'مدرسة المجد' } });
    fireEvent.change(screen.getByPlaceholderText(SUBDOMAIN), { target: { value: 'majd' } });
    submit(form);

    await waitFor(() => expect(props.onProvisioned).toHaveBeenCalled());

    expect((screen.getByPlaceholderText(NAME_AR) as HTMLInputElement).value).toBe('');
    expect((screen.getByPlaceholderText(SUBDOMAIN) as HTMLInputElement).value).toBe('');
    expect((screen.getByPlaceholderText(SCHOOL_ID) as HTMLInputElement).value).toBe('');
    expect((screen.getByPlaceholderText(PRINCIPAL_EMAIL) as HTMLInputElement).value).toBe('');
  });

  it('reports a failure result without resetting the form', async () => {
    const { form, props } = renderForm({
      onProvision: vi.fn(async () => ({ success: false, message: 'school exists' })),
    });

    fireEvent.change(screen.getByPlaceholderText(NAME_AR), { target: { value: 'مدرسة المجد' } });
    submit(form);

    await waitFor(() => expect(props.onError).toHaveBeenCalledWith('school exists'));
    expect(props.onProvisioned).not.toHaveBeenCalled();
    expect((screen.getByPlaceholderText(NAME_AR) as HTMLInputElement).value).toBe('مدرسة المجد');
  });

  it('reports thrown errors and re-enables the submit button', async () => {
    const { form, props } = renderForm({
      onProvision: vi.fn(async () => {
        throw new Error('network down');
      }),
    });

    submit(form);

    await waitFor(() => expect(props.onError).toHaveBeenCalledWith('network down'));
    const submitButton = screen.getByRole('button', { name: /تأسيس وتشغيل المدرسة/ });
    expect((submitButton as HTMLButtonElement).disabled).toBe(false);
  });

  it('disables the submit button while the provision request is pending', async () => {
    let resolve!: (value: { success: boolean; message: string }) => void;
    const onProvision = vi.fn(
      () => new Promise<{ success: boolean; message: string }>((r) => { resolve = r; })
    );
    const { form } = renderForm({ onProvision });

    submit(form);

    const submitButton = screen.getByRole('button', { name: /تأسيس وتشغيل المدرسة/ });
    expect((submitButton as HTMLButtonElement).disabled).toBe(true);

    resolve({ success: true, message: 'created' });
    await waitFor(() => expect((submitButton as HTMLButtonElement).disabled).toBe(false));
  });

  it('cancels through the parent callback', () => {
    const { props } = renderForm();

    fireEvent.click(screen.getByRole('button', { name: 'إلغاء' }));

    expect(props.onCancel).toHaveBeenCalledTimes(1);
  });
});

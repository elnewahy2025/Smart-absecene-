// @vitest-environment jsdom
import React from 'react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import type { SchoolSettings } from '../../types/attendance';

vi.mock('./HolidaysAndWeekendsCard', () => ({
  HolidaysAndWeekendsCard: ({ onChange }: { onChange: (u: object) => void }) => (
    <button type="button" data-testid="holidays-stub" onClick={() => onChange({ weekendDays: [5, 6] })}>
      holidays
    </button>
  ),
}));

import { SchoolPolicySettingsForm } from './SchoolPolicySettingsForm';

afterEach(cleanup);

function makeSettings(overrides: Partial<SchoolSettings> = {}): SchoolSettings {
  return {
    attendanceMode: 'both',
    lateThresholdMinutes: 10,
    chronicAbsenceLimit: 5,
    preferredChannel: 'both',
    absenceMessageTemplate: '',
    lateMessageTemplate: '',
    warningMessageTemplate: '',
    sendSmsOnAbsent: true,
    sendSmsOnLate: false,
    notifyOnExcuseApproved: true,
    requireExcuseAttachment: false,
    weekendDays: [5, 6],
    officialHolidays: [],
    ...overrides,
  } as SchoolSettings;
}

function renderForm(overrides: Partial<React.ComponentProps<typeof SchoolPolicySettingsForm>> = {}) {
  const props = {
    formSettings: makeSettings(),
    setFormSettings: vi.fn(),
    onSubmit: vi.fn((e: React.FormEvent) => e.preventDefault()),
    lang: 'ar' as const,
    canManageSettings: true,
    schoolProfile: undefined,
    isSuperAdmin: false,
    ...overrides,
  };
  const utils = render(<SchoolPolicySettingsForm {...props} />);
  return { ...utils, props };
}

const comboboxes = () => screen.getAllByRole('combobox') as HTMLSelectElement[];
const numberInputs = () =>
  Array.from(document.querySelectorAll('input[type="number"]')) as HTMLInputElement[];
const textareas = () => screen.getAllByRole('textbox') as HTMLTextAreaElement[];
const checkboxes = () => screen.getAllByRole('checkbox') as HTMLInputElement[];

describe('SchoolPolicySettingsForm', () => {
  it('renders the persisted policy values', () => {
    renderForm({
      formSettings: makeSettings({
        attendanceMode: 'daily',
        lateThresholdMinutes: 15,
        chronicAbsenceLimit: 7,
        preferredChannel: 'SMS',
        sendSmsOnLate: true,
      }),
    });

    expect(comboboxes()[0].value).toBe('daily');
    expect(comboboxes()[1].value).toBe('SMS');
    expect(numberInputs()[0].value).toBe('15');
    expect(numberInputs()[1].value).toBe('7');
    expect(checkboxes()[0].checked).toBe(true);
    expect(checkboxes()[1].checked).toBe(true);
  });

  it('emits the merged settings when the attendance mode changes', () => {
    const { props } = renderForm();

    fireEvent.change(comboboxes()[0], { target: { value: 'period' } });

    expect(props.setFormSettings).toHaveBeenCalledWith(
      expect.objectContaining({ attendanceMode: 'period', lateThresholdMinutes: 10 })
    );
  });

  it('falls back to safe numbers for empty or invalid numeric fields', () => {
    const { props } = renderForm();

    fireEvent.change(numberInputs()[0], { target: { value: '' } });
    fireEvent.change(numberInputs()[1], { target: { value: '' } });

    expect(props.setFormSettings).toHaveBeenNthCalledWith(
      1,
      expect.objectContaining({ lateThresholdMinutes: 0 })
    );
    expect(props.setFormSettings).toHaveBeenNthCalledWith(
      2,
      expect.objectContaining({ chronicAbsenceLimit: 5 })
    );
  });

  it('defaults the notification channel to both when unset', () => {
    renderForm({ formSettings: makeSettings({ preferredChannel: undefined }) });

    expect(comboboxes()[1].value).toBe('both');
  });

  it('shows the localized template fallbacks and emits edits', () => {
    const { props } = renderForm();

    expect(textareas()[0].value).toContain('المكرم ولي أمر الطالب');
    expect(textareas()[1].value).toContain('تم تسجيل تأخر نجلكم');
    expect(textareas()[2].value).toContain('إشعار رسمي');

    fireEvent.change(textareas()[0], { target: { value: 'نص مخصص' } });

    expect(props.setFormSettings).toHaveBeenCalledWith(
      expect.objectContaining({ absenceMessageTemplate: 'نص مخصص' })
    );
  });

  it('prefers a stored template over the fallback', () => {
    renderForm({
      formSettings: makeSettings({
        absenceMessageTemplate: 'قالب محفوظ',
        lateMessageTemplate: 'قالب التأخر',
        warningMessageTemplate: 'قالب الإنذار',
      }),
    });

    expect(textareas()[0].value).toBe('قالب محفوظ');
    expect(textareas()[1].value).toBe('قالب التأخر');
    expect(textareas()[2].value).toBe('قالب الإنذار');
  });

  it('toggles the notification checkboxes', () => {
    const { props } = renderForm();

    fireEvent.click(checkboxes()[0]);
    fireEvent.click(checkboxes()[3]);

    expect(props.setFormSettings).toHaveBeenNthCalledWith(
      1,
      expect.objectContaining({ sendSmsOnAbsent: false })
    );
    expect(props.setFormSettings).toHaveBeenNthCalledWith(
      2,
      expect.objectContaining({ requireExcuseAttachment: true })
    );
  });

  it('treats a missing excuse-notification flag as enabled', () => {
    renderForm({ formSettings: makeSettings({ notifyOnExcuseApproved: undefined }) });

    expect(checkboxes()[2].checked).toBe(true);
  });

  it('merges weekend updates coming from the holidays card', () => {
    const { props } = renderForm();

    fireEvent.click(screen.getByTestId('holidays-stub'));

    expect(props.setFormSettings).toHaveBeenCalledWith(
      expect.objectContaining({ weekendDays: [5, 6] })
    );
  });

  it('submits through the parent handler', () => {
    const { props, container } = renderForm();

    fireEvent.submit(container.querySelector('form') as HTMLFormElement);

    expect(props.onSubmit).toHaveBeenCalledTimes(1);
  });

  it('hides the save button and shows a read-only notice without permission', () => {
    renderForm({ canManageSettings: false });

    expect(screen.queryByRole('button', { name: /حفظ وتطبيق القواعد المدرسية/ })).toBeNull();
    expect(screen.getByText(/عرض الإعدادات للقراءة فقط/)).toBeTruthy();
  });
});

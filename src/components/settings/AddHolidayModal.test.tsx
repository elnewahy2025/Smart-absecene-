// @vitest-environment jsdom
import React from 'react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { AddHolidayModal } from './AddHolidayModal';

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
});

const today = new Date().toISOString().split('T')[0];

const setup = (overrides: Partial<React.ComponentProps<typeof AddHolidayModal>> = {}) => {
  const onClose = vi.fn();
  const onSave = vi.fn().mockResolvedValue(undefined);
  render(
    <AddHolidayModal
      lang="ar"
      isSaving={false}
      onClose={onClose}
      onSave={onSave}
      {...overrides}
    />
  );
  return { onClose, onSave };
};

const nameInput = () => screen.getByPlaceholderText(/إجازة منتصف العام|Mid-year school vacation/);
const nameEnInput = () => screen.getByPlaceholderText(/Mid-term Vacation/);
const dateInputs = () => document.querySelectorAll('input[type="date"]');
const startInput = () => dateInputs()[0] as HTMLInputElement;
const endInput = () => dateInputs()[1] as HTMLInputElement;
const notesInput = () => screen.getByPlaceholderText(/التعميم الوزاري|ministerial circular/);
const saveButton = () => screen.getByRole('button', { name: /حفظ واعتماد العطلة|Save and approve holiday/ });

describe('AddHolidayModal', () => {
  it('starts with empty name and today for both dates', () => {
    setup();
    expect((nameInput() as HTMLInputElement).value).toBe('');
    expect(startInput().value).toBe(today);
    expect(endInput().value).toBe(today);
  });

  it('shows an Arabic error and does not save when the name is missing', async () => {
    const { onSave, onClose } = setup();
    fireEvent.click(saveButton());
    expect(await screen.findByText('يرجى إدخال اسم العطلة أو المناسبة الرسمية.')).toBeTruthy();
    expect(onSave).not.toHaveBeenCalled();
    expect(onClose).not.toHaveBeenCalled();
  });

  it('treats a whitespace-only name as missing', async () => {
    const { onSave } = setup();
    fireEvent.change(nameInput(), { target: { value: '   ' } });
    fireEvent.click(saveButton());
    expect(await screen.findByText('يرجى إدخال اسم العطلة أو المناسبة الرسمية.')).toBeTruthy();
    expect(onSave).not.toHaveBeenCalled();
  });

  it('rejects an end date before the start date', async () => {
    const { onSave } = setup();
    fireEvent.change(nameInput(), { target: { value: 'عطلة' } });
    fireEvent.change(startInput(), { target: { value: '2026-03-10' } });
    fireEvent.change(endInput(), { target: { value: '2026-03-01' } });
    fireEvent.click(saveButton());
    expect(await screen.findByText('تاريخ نهاية الإجازة لا يمكن أن يكون قبل تاريخ البداية.')).toBeTruthy();
    expect(onSave).not.toHaveBeenCalled();
  });

  it('normalises the holiday, closes first and hands it to onSave', async () => {
    const { onSave, onClose } = setup();
    fireEvent.change(nameInput(), { target: { value: '  يوم التأسيس  ' } });
    fireEvent.change(startInput(), { target: { value: '2026-02-22' } });
    fireEvent.change(endInput(), { target: { value: '' } });
    fireEvent.change(notesInput(), { target: { value: '   ' } });
    fireEvent.click(saveButton());

    await waitFor(() => expect(onSave).toHaveBeenCalledTimes(1));
    expect(onClose).toHaveBeenCalledTimes(1);

    const created = onSave.mock.calls[0][0];
    expect(created.id).toMatch(/^hol-\d+$/);
    expect(created.nameAr).toBe('يوم التأسيس');
    expect(created.nameEn).toBeUndefined();
    expect(created.startDate).toBe('2026-02-22');
    expect(created.endDate).toBe('2026-02-22');
    expect(created.type).toBe('official');
    expect(created.notes).toBeUndefined();
  });

  it('keeps an explicit English name, type and notes', async () => {
    const { onSave } = setup();
    fireEvent.change(nameInput(), { target: { value: 'عيد الفطر' } });
    fireEvent.change(nameEnInput(), { target: { value: ' Eid al-Fitr ' } });
    fireEvent.change(screen.getByRole('combobox'), { target: { value: 'religious' } });
    fireEvent.change(notesInput(), { target: { value: 'قرار وزاري 12' } });
    fireEvent.click(saveButton());

    await waitFor(() => expect(onSave).toHaveBeenCalledTimes(1));
    const created = onSave.mock.calls[0][0];
    expect(created.nameEn).toBe('Eid al-Fitr');
    expect(created.type).toBe('religious');
    expect(created.notes).toBe('قرار وزاري 12');
  });

  it('moves the end date forward when the start date passes it', () => {
    setup();
    fireEvent.change(endInput(), { target: { value: '2026-05-10' } });
    expect(endInput().value).toBe('2026-05-10');

    fireEvent.change(startInput(), { target: { value: '2026-05-12' } });
    expect(startInput().value).toBe('2026-05-12');
    expect(endInput().value).toBe('2026-05-12');
  });

  it('does not touch the end date when the start date stays before it', () => {
    setup();
    fireEvent.change(endInput(), { target: { value: '2026-05-10' } });
    fireEvent.change(startInput(), { target: { value: '2026-05-01' } });
    expect(endInput().value).toBe('2026-05-10');
  });

  it('disables saving and shows progress while a save is in flight', () => {
    setup({ isSaving: true });
    const btn = screen.getByRole('button', { name: /جارٍ الحفظ/ }) as HTMLButtonElement;
    expect(btn.disabled).toBe(true);
  });

  it('renders English copy when lang is en', async () => {
    const { onSave } = setup({ lang: 'en' });
    expect(screen.getByText('Add a new holiday / official occasion for the school')).toBeTruthy();
    fireEvent.click(screen.getByRole('button', { name: /Save and approve holiday/ }));
    expect(await screen.findByText('Please enter the name of the holiday or official occasion.')).toBeTruthy();
    expect(onSave).not.toHaveBeenCalled();
  });

  it('closes via the header ✕ without saving', () => {
    const { onClose, onSave } = setup();
    fireEvent.click(screen.getByRole('button', { name: '✕' }));
    expect(onClose).toHaveBeenCalledTimes(1);
    expect(onSave).not.toHaveBeenCalled();
  });
});

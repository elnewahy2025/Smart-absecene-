// @vitest-environment jsdom
import React from 'react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { act, cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import type { SchoolMessagingGatewayConfig } from '../../types/attendance';
import { SchoolMessagingGatewaysTab } from './SchoolMessagingGatewaysTab';

vi.mock('../../context/AttendanceContext', () => ({
  useAttendance: () => ({ lang: 'ar' }),
}));

afterEach(cleanup);

const config = (overrides: Partial<SchoolMessagingGatewayConfig> = {}): SchoolMessagingGatewayConfig =>
  ({
    whatsappPhoneNumber: '0501234567',
    whatsappServiceMode: 'web_direct',
    smsProvider: 'taqnyat',
    smsSenderId: 'SMARTSCHOOL',
    enableWhatsAppNotifications: true,
    enableSmsNotifications: true,
    emailEnabled: false,
    ...overrides,
  }) as SchoolMessagingGatewayConfig;

const renderTab = (overrides: Partial<React.ComponentProps<typeof SchoolMessagingGatewaysTab>> = {}) => {
  const onSave = vi.fn().mockResolvedValue({ success: true, message: 'تم حفظ البوابات بنجاح' });
  const props = {
    gatewayConfig: config(),
    onSave,
    isSuperAdmin: true,
    schoolName: 'مدرسة المجد',
    defaultCallingCode: '+966',
    ...overrides,
  };
  return { ...render(<SchoolMessagingGatewaysTab {...props} />), props, onSave };
};

describe('SchoolMessagingGatewaysTab', () => {
  it('shows the read-only banner and hides the save button for non-owners', () => {
    renderTab({ isSuperAdmin: false });
    expect(screen.getByText('صلاحية خاصة ومحصورة بمالك المنصة (The Owner Only)')).toBeTruthy();
    expect(screen.getByText('وضع القراءة فقط')).toBeTruthy();
    expect(screen.queryByText('حفظ الإعدادات')).toBeNull();
    expect(screen.queryByText('حفظ واعتماد التغييرات')).toBeNull();
    expect((screen.getByPlaceholderText('0501234567') as HTMLInputElement).disabled).toBe(true);
  });

  it('shows the full-control banner for the owner', () => {
    renderTab();
    expect(screen.getByText('وضع التحكم الكامل لمالك المنصة (The Owner Control)')).toBeTruthy();
    expect(screen.getByText('مصرح بالتعديل والحفظ')).toBeTruthy();
    expect(screen.getByText('حفظ الإعدادات')).toBeTruthy();
  });

  it('saves the current form and shows the success message', async () => {
    const { onSave } = renderTab();
    await act(async () => {
      fireEvent.click(screen.getByText('حفظ الإعدادات'));
    });
    expect(onSave).toHaveBeenCalledWith(expect.objectContaining({ whatsappPhoneNumber: '0501234567' }));
    await waitFor(() => expect(screen.getByText('تم حفظ البوابات بنجاح')).toBeTruthy());
  });

  it('keeps failure messages visible', async () => {
    vi.useFakeTimers();
    const onSave = vi.fn().mockResolvedValue({ success: false, message: 'تعذر الحفظ' });
    render(<SchoolMessagingGatewaysTab gatewayConfig={config()} onSave={onSave} isSuperAdmin schoolName="مدرسة المجد" />);

    await act(async () => {
      fireEvent.click(screen.getByText('حفظ الإعدادات'));
      await Promise.resolve();
    });
    expect(screen.getByText('تعذر الحفظ')).toBeTruthy();

    act(() => {
      vi.advanceTimersByTime(5000);
    });
    expect(screen.getByText('تعذر الحفظ')).toBeTruthy();
    vi.useRealTimers();
  });

  it('auto-dismisses the success message after four seconds', async () => {
    vi.useFakeTimers();
    const onSave = vi.fn().mockResolvedValue({ success: true, message: 'تم الحفظ' });
    render(<SchoolMessagingGatewaysTab gatewayConfig={config()} onSave={onSave} isSuperAdmin schoolName="مدرسة المجد" />);

    await act(async () => {
      fireEvent.click(screen.getByText('حفظ الإعدادات'));
      await Promise.resolve();
    });
    expect(screen.getByText('تم الحفظ')).toBeTruthy();

    act(() => {
      vi.advanceTimersByTime(4000);
    });
    expect(screen.queryByText('تم الحفظ')).toBeNull();
    vi.useRealTimers();
  });

  it('re-syncs the form when the gateway config prop changes', () => {
    const { rerender, props } = renderTab();
    rerender(<SchoolMessagingGatewaysTab {...props} gatewayConfig={config({ whatsappPhoneNumber: '0555999888' })} />);
    expect((screen.getByPlaceholderText('0501234567') as HTMLInputElement).value).toBe('0555999888');
  });

  it('renders all four gateway sections', () => {
    renderTab();
    expect(screen.getByText('بوابة وخدمة الواتساب المباشرة (WhatsApp Direct & Web)')).toBeTruthy();
    expect(screen.getByText('بوابة الرسائل النصية القصيرة (SMS Gateway Service)')).toBeTruthy();
    expect(document.body.textContent).toContain('سجل التوثيق: تم الضبط الأخير بواسطة');
  });
});

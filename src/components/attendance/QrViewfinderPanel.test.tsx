// @vitest-environment jsdom
import React from 'react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { QrViewfinderPanel } from './QrViewfinderPanel';

afterEach(cleanup);

const clickable = () => ({ current: { click: vi.fn() } });

const setup = (overrides: Partial<React.ComponentProps<typeof QrViewfinderPanel>> = {}) => {
  const cameraInputRef = clickable();
  const fileUploadInputRef = clickable();
  const onManualCodeChange = vi.fn();
  const onManualSubmit = vi.fn((e: React.FormEvent) => e.preventDefault());
  const videoRef = { current: null };
  render(
    <QrViewfinderPanel
      lang="ar"
      cameraActive={false}
      cameraError={null}
      isProcessingPhoto={false}
      videoRef={videoRef as unknown as React.RefObject<HTMLVideoElement>}
      cameraInputRef={cameraInputRef as unknown as React.RefObject<HTMLInputElement>}
      fileUploadInputRef={fileUploadInputRef as unknown as React.RefObject<HTMLInputElement>}
      manualCodeInput=""
      onManualCodeChange={onManualCodeChange}
      onManualSubmit={onManualSubmit}
      {...overrides}
    />
  );
  return { cameraInputRef, fileUploadInputRef, onManualCodeChange, onManualSubmit, videoRef };
};

describe('QrViewfinderPanel', () => {
  it('shows the inactive camera prompt with the default hint', () => {
    setup();
    expect(screen.getByText('مسح رمز QR بكاميرا الهاتف')).toBeTruthy();
    expect(screen.getByText('انقر على الزر الأخضر أدناه لفتح كاميرا الجوال مباشرة ومسح بطاقة الطالب.')).toBeTruthy();
    expect(screen.getByText('فتح كاميرا الهاتف والتقاط الرمز')).toBeTruthy();
  });

  it('prefers the camera error message over the hint', () => {
    setup({ cameraError: 'تعذر الوصول إلى الكاميرا' });
    expect(screen.getByText('تعذر الوصول إلى الكاميرا')).toBeTruthy();
    expect(screen.queryByText(/انقر على الزر الأخضر/)).toBeNull();
  });

  it('hides the inactive prompt and shows the video while the camera runs', () => {
    const { videoRef } = setup({ cameraActive: true });
    expect(screen.queryByText('مسح رمز QR بكاميرا الهاتف')).toBeNull();
    const video = document.querySelector('video') as HTMLVideoElement;
    expect(video).toBeTruthy();
    expect(video.className).toContain('block');
    expect(videoRef.current).toBe(video);
  });

  it('shows the decoding state and disables the capture buttons', () => {
    setup({ isProcessingPhoto: true });
    expect(screen.getByText('جارٍ قراءة الرمز...')).toBeTruthy();
    const buttons = screen.getAllByRole('button');
    expect(buttons.every((b) => (b as HTMLButtonElement).disabled)).toBe(true);
  });

  it('opens the native camera input', () => {
    const { cameraInputRef } = setup();
    fireEvent.click(screen.getByText('كاميرا الهاتف (فوري)'));
    expect(cameraInputRef.current.click).toHaveBeenCalledTimes(1);
  });

  it('opens the upload input', () => {
    const { fileUploadInputRef } = setup();
    fireEvent.click(screen.getByText('اختيار صورة بطاقة'));
    expect(fileUploadInputRef.current.click).toHaveBeenCalledTimes(1);
  });

  it('reports manual code changes and submits the form', () => {
    const { onManualCodeChange, onManualSubmit } = setup({ manualCodeInput: '1001' });
    const input = screen.getByPlaceholderText('أدخل رقم الطالب أو امسح بالباركود...') as HTMLInputElement;
    expect(input.value).toBe('1001');
    fireEvent.change(input, { target: { value: '1002' } });
    expect(onManualCodeChange).toHaveBeenCalledWith('1002');
    fireEvent.click(screen.getByText('تأكيد'));
    expect(onManualSubmit).toHaveBeenCalledTimes(1);
  });

  it('disables submit for an empty manual code', () => {
    setup({ manualCodeInput: '   ' });
    expect((screen.getByText('تأكيد') as HTMLButtonElement).disabled).toBe(true);
  });

  it('renders English copy when lang is en', () => {
    setup({ lang: 'en', manualCodeInput: '1001' });
    expect(screen.getByText('Scan QR via Phone Camera')).toBeTruthy();
    expect(screen.getByText('Open Phone Camera & Scan')).toBeTruthy();
    expect(screen.getByText('Snap with Camera')).toBeTruthy();
    expect(screen.getByText('Upload QR Image')).toBeTruthy();
    expect(screen.getByText('Check-In')).toBeTruthy();
  });
});

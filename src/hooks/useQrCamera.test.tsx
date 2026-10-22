// @vitest-environment jsdom
import React from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { act, cleanup, render, screen, waitFor } from '@testing-library/react';
import { useQrCamera } from './useQrCamera';

const stream = () =>
  ({ getTracks: () => [{ stop: vi.fn() }] }) as unknown as MediaStream;

const Probe = ({ lang = 'ar', onDecoded = vi.fn() }: { lang?: 'ar' | 'en'; onDecoded?: (raw: string) => void }) => {
  const camera = useQrCamera({ lang, onDecoded });
  return (
    <div>
      <video data-testid="video" ref={camera.videoRef} />
      <input data-testid="camera-input" ref={camera.cameraInputRef} type="file" />
      <span data-testid="active">{String(camera.cameraActive)}</span>
      <span data-testid="error">{camera.cameraError || ''}</span>
      <span data-testid="processing">{String(camera.isProcessingPhoto)}</span>
    </div>
  );
};

const setMediaDevices = (value: unknown) =>
  Object.defineProperty(navigator, 'mediaDevices', { value, configurable: true });

beforeEach(() => {
  vi.spyOn(HTMLMediaElement.prototype, 'play').mockResolvedValue(undefined);
});

afterEach(() => {
  cleanup();
  vi.useRealTimers();
  vi.restoreAllMocks();
  delete (window as any).BarcodeDetector;
});

describe('useQrCamera', () => {
  it('starts the environment camera and exposes the stream to the video element', async () => {
    const getUserMedia = vi.fn().mockResolvedValue(stream());
    setMediaDevices({ getUserMedia });

    render(<Probe />);

    await waitFor(() => expect(screen.getByTestId('active').textContent).toBe('true'));
    expect(getUserMedia).toHaveBeenCalledWith({ video: { facingMode: 'environment' } });
    expect(screen.getByTestId('error').textContent).toBe('');
  });

  it('stops every track when the component unmounts', async () => {
    const stop = vi.fn();
    setMediaDevices({ getUserMedia: vi.fn().mockResolvedValue({ getTracks: () => [{ stop }] }) });

    const { unmount } = render(<Probe />);
    await waitFor(() => expect(screen.getByTestId('active').textContent).toBe('true'));
    unmount();
    expect(stop).toHaveBeenCalledTimes(1);
  });

  it('explains the HTTPS requirement when media devices are unavailable', async () => {
    setMediaDevices(undefined);
    render(<Probe />);
    await waitFor(() => expect(screen.getByTestId('error').textContent).toContain('HTTPS'));
    expect(screen.getByTestId('active').textContent).toBe('false');
  });

  it('reports a denied permission', async () => {
    const err = Object.assign(new Error('denied'), { name: 'NotAllowedError' });
    setMediaDevices({ getUserMedia: vi.fn().mockRejectedValue(err) });
    render(<Probe />);
    await waitFor(() => expect(screen.getByTestId('error').textContent).toContain('إذن الوصول للكاميرا'));
  });

  it('falls back to a generic message and localises errors', async () => {
    setMediaDevices({ getUserMedia: vi.fn().mockRejectedValue(new Error('boom')) });
    const { unmount } = render(<Probe lang="ar" />);
    await waitFor(() => expect(screen.getByTestId('error').textContent).toContain('الفيديو المباشر'));

    unmount();
    render(<Probe lang="en" />);
    await waitFor(() => expect(screen.getByTestId('error').textContent).toContain('Live video unavailable'));
  });

  it('decodes QR codes through BarcodeDetector on an interval', async () => {
    vi.useFakeTimers();
    setMediaDevices({ getUserMedia: vi.fn().mockResolvedValue(stream()) });

    const detect = vi.fn().mockResolvedValue([{ rawValue: 'STU-1' }]);
    (window as any).BarcodeDetector = class {
      detect = detect;
    };

    const onDecoded = vi.fn();
    render(<Probe onDecoded={onDecoded} />);

    await act(async () => {
      await Promise.resolve();
    });
    const video = screen.getByTestId('video');
    Object.defineProperty(video, 'readyState', { value: 2, configurable: true });

    await act(async () => {
      vi.advanceTimersByTime(400);
      await Promise.resolve();
      await Promise.resolve();
    });

    expect(onDecoded).toHaveBeenCalledWith('STU-1');
  });

  it('propagates the latest decoder callback without restarting the interval', async () => {
    vi.useFakeTimers();
    setMediaDevices({ getUserMedia: vi.fn().mockResolvedValue(stream()) });

    const detect = vi.fn().mockResolvedValue([{ rawValue: 'STU-2' }]);
    (window as any).BarcodeDetector = class {
      detect = detect;
    };

    const first = vi.fn();
    const second = vi.fn();
    const { rerender } = render(<Probe onDecoded={first} />);
    await act(async () => {
      await Promise.resolve();
    });
    const video = screen.getByTestId('video');
    Object.defineProperty(video, 'readyState', { value: 2, configurable: true });

    rerender(<Probe onDecoded={second} />);
    await act(async () => {
      vi.advanceTimersByTime(400);
      await Promise.resolve();
      await Promise.resolve();
    });

    expect(second).toHaveBeenCalledWith('STU-2');
    expect(first).not.toHaveBeenCalled();
  });

  it('keeps state idle when a photo input change carries no file', () => {
    setMediaDevices({ getUserMedia: vi.fn().mockResolvedValue(stream()) });
    const { container } = render(<Probe />);
    const input = container.querySelector('input[type="file"]') as HTMLInputElement;
    act(() => {
      input.dispatchEvent(new Event('change', { bubbles: true }));
    });
    expect(screen.getByTestId('processing').textContent).toBe('false');
  });
});

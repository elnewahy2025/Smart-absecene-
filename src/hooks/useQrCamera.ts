import { useEffect, useRef, useState } from 'react';
import type { ChangeEvent } from 'react';
import jsQR from 'jsqr';

export interface UseQrCameraOptions {
  lang: 'ar' | 'en';
  onDecoded: (raw: string) => void;
}

export function useQrCamera({ lang, onDecoded }: UseQrCameraOptions) {
  const [cameraActive, setCameraActive] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [isProcessingPhoto, setIsProcessingPhoto] = useState(false);

  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);
  const fileUploadInputRef = useRef<HTMLInputElement>(null);
  const offscreenCanvasRef = useRef<HTMLCanvasElement | null>(null);

  const onDecodedRef = useRef(onDecoded);
  useEffect(() => {
    onDecodedRef.current = onDecoded;
  });

  const isSecure = typeof window !== 'undefined' && (window.isSecureContext || window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1');

  useEffect(() => {
    let mounted = true;
    async function startCamera() {
      try {
        if (!navigator.mediaDevices?.getUserMedia) {
          throw new Error('SECURE_CONTEXT_REQUIRED');
        }
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: 'environment' },
        });
        if (mounted) {
          streamRef.current = stream;
          if (videoRef.current) {
            videoRef.current.srcObject = stream;
            try {
              await videoRef.current.play();
            } catch (playErr) {
              console.warn('Video playback warning:', playErr);
            }
          }
          setCameraActive(true);
          setCameraError(null);
        }
      } catch (err: any) {
        if (mounted) {
          console.warn('Live camera stream not available:', err);
          if (err.message === 'SECURE_CONTEXT_REQUIRED' || !isSecure) {
            setCameraError(
              lang === 'ar'
                ? 'تشترط متصفحات الهواتف اتصال مشفر (HTTPS) لتشغيل الفيديو الحي المباشر. استخدم زر "التقاط بالكاميرا" أدناه للالتقاط المباشر بضغطة واحدة.'
                : 'Mobile browsers require HTTPS for continuous live video over Wi-Fi. Use the "Take Photo / Scan" button below for instant phone camera scanning.'
            );
          } else if (err.name === 'NotAllowedError') {
            setCameraError(
              lang === 'ar'
                ? 'يرجى منح إذن الوصول للكاميرا لاستخدام الماسح المباشر.'
                : 'Please grant camera permissions to use live scanning.'
            );
          } else {
            setCameraError(
              lang === 'ar'
                ? 'تعذر بدء الفيديو المباشر. يمكنك استخدام زر كاميرا الهاتف الفوري أو البحث السريع أدناه.'
                : 'Live video unavailable. Use phone camera snap or fast search below.'
            );
          }
          setCameraActive(false);
        }
      }
    }

    startCamera();

    return () => {
      mounted = false;
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => track.stop());
      }
    };
  }, [isSecure, lang]);

  useEffect(() => {
    let intervalId: any = null;
    let detector: any = null;

    if (cameraActive && videoRef.current) {
      if ('BarcodeDetector' in window) {
        try {
          detector = new (window as any).BarcodeDetector({ formats: ['qr_code', 'code_128', 'ean_13'] });
        } catch {
          detector = null;
        }
      }

      intervalId = setInterval(async () => {
        if (!videoRef.current || videoRef.current.readyState < 2) return;

        // Try BarcodeDetector first
        if (detector) {
          try {
            const barcodes = await detector.detect(videoRef.current);
            if (barcodes && barcodes.length > 0) {
              onDecodedRef.current(barcodes[0].rawValue);
              return;
            }
          } catch {
            // fallback to jsQR
          }
        }

        // Fallback: draw frame onto offscreen canvas and decode via jsQR
        try {
          if (!offscreenCanvasRef.current) {
            offscreenCanvasRef.current = document.createElement('canvas');
          }
          const canvas = offscreenCanvasRef.current;
          const vw = videoRef.current.videoWidth || 320;
          const vh = videoRef.current.videoHeight || 240;
          if (vw > 0 && vh > 0) {
            canvas.width = vw;
            canvas.height = vh;
            const ctx = canvas.getContext('2d');
            if (ctx) {
              ctx.drawImage(videoRef.current, 0, 0, vw, vh);
              const imageData = ctx.getImageData(0, 0, vw, vh);
              const code = jsQR(imageData.data, imageData.width, imageData.height);
              if (code && code.data) {
                onDecodedRef.current(code.data);
              }
            }
          }
        } catch {
          // Frame read skipped
        }
      }, 400);
    }

    return () => {
      if (intervalId) clearInterval(intervalId);
    };
  }, [cameraActive]);

  const handlePhotoCapture = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsProcessingPhoto(true);
    const reader = new FileReader();
    reader.onload = (fileEvent) => {
      const img = new Image();
      img.onload = () => {
        try {
          const canvas = document.createElement('canvas');
          let width = img.width;
          let height = img.height;
          // Scale down if photo is huge to ensure fast decoding
          const maxDim = 1200;
          if (width > maxDim || height > maxDim) {
            if (width > height) {
              height = Math.round((height * maxDim) / width);
              width = maxDim;
            } else {
              width = Math.round((width * maxDim) / height);
              height = maxDim;
            }
          }
          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');
          if (!ctx) {
            setIsProcessingPhoto(false);
            return;
          }
          ctx.drawImage(img, 0, 0, width, height);
          const imageData = ctx.getImageData(0, 0, width, height);
          const code = jsQR(imageData.data, imageData.width, imageData.height, {
            inversionAttempts: 'attemptBoth',
          });
          setIsProcessingPhoto(false);
          if (code && code.data) {
            onDecodedRef.current(code.data);
          } else {
            alert(
              lang === 'ar'
                ? 'لم يتم العثور على رمز QR واضح في الصورة الملتقطة. يرجى إعادة توجيه الكاميرا نحو البطاقة بوضوح.'
                : 'No clear QR code found in the image. Please take a clearer photo of the student card.'
            );
          }
        } catch (procErr) {
          console.error('Image QR decoding error:', procErr);
          setIsProcessingPhoto(false);
        }
      };
      img.src = fileEvent.target?.result as string;
    };
    reader.readAsDataURL(file);
    e.target.value = '';
  };

  return {
    videoRef,
    streamRef,
    cameraInputRef,
    fileUploadInputRef,
    offscreenCanvasRef,
    cameraActive,
    cameraError,
    isProcessingPhoto,
    handlePhotoCapture,
  };
}

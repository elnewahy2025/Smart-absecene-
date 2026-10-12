import React, { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import jsQR from 'jsqr';
import { useAttendance } from '../context/AttendanceContext';
import { Student } from '../types/attendance';
import {
  Scan,
  Camera,
  CheckCircle2,
  X,
  Volume2,
  VolumeX,
  Clock,
  Upload,
  RefreshCw,
  AlertTriangle,
  Info,
} from 'lucide-react';

interface QRScannerModalProps {
  onClose: () => void;
  targetSessionId?: string;
}

// Synthesize pleasant attendance chime with Web Audio API (no external asset needed)
function playAttendanceChime() {
  try {
    const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioContextClass) return;
    const ctx = new AudioContextClass();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'sine';
    // Success two-tone chime (587.33Hz D5 -> 880Hz A5)
    osc.frequency.setValueAtTime(587.33, ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(880, ctx.currentTime + 0.12);

    gain.gain.setValueAtTime(0.2, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.35);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start();
    osc.stop(ctx.currentTime + 0.35);
  } catch (e) {
    console.warn('Audio playback error', e);
  }
}

export const QRScannerModal: React.FC<QRScannerModalProps> = ({
  onClose,
  targetSessionId,
}) => {
  const { students, sessions, updateRecord, addAuditLog, lang, currentUser } = useAttendance();

  const [activeSessionId, setActiveSessionId] = useState<string>(
    targetSessionId || sessions[0]?.id || ''
  );
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [cameraActive, setCameraActive] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [isProcessingPhoto, setIsProcessingPhoto] = useState(false);
  const [recentScans, setRecentScans] = useState<Array<{ student: Student; time: string }>>([]);
  const [lastScannedStudent, setLastScannedStudent] = useState<Student | null>(null);
  const [manualCodeInput, setManualCodeInput] = useState('');

  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);
  const fileUploadInputRef = useRef<HTMLInputElement>(null);
  const offscreenCanvasRef = useRef<HTMLCanvasElement | null>(null);

  const activeSession = sessions.find((s) => s.id === activeSessionId) || sessions[0];
  const isSecure = typeof window !== 'undefined' && (window.isSecureContext || window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1');

  // Camera setup for live video
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

  const handleRawScannedString = (raw: string) => {
    if (!raw || !raw.trim()) return;
    try {
      const data = JSON.parse(raw);
      const targetId = data.studentId || data.studentNumber || data.nationalId;
      const found = students.find(
        (s) => s.id === targetId || s.studentNumber === targetId || s.nationalId === targetId
      );
      if (found) {
        handleProcessScan(found);
        return;
      }
    } catch {
      // plain text fallback
    }

    const found = students.find(
      (s) =>
        s.studentNumber === raw.trim() ||
        s.nationalId === raw.trim() ||
        s.id === raw.trim() ||
        s.fullName.toLowerCase() === raw.trim().toLowerCase()
    );
    if (found) {
      handleProcessScan(found);
    } else {
      alert(
        lang === 'ar'
          ? `تم مسح الرمز: "${raw}" لكن لم يتم العثور على طالب مطابق بقائمة المدرسة.`
          : `Scanned code "${raw}", but no matching student found.`
      );
    }
  };

  // Video stream QR decoding loop with BarcodeDetector or fallback jsQR
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
              handleRawScannedString(barcodes[0].rawValue);
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
                handleRawScannedString(code.data);
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
  }, [cameraActive, activeSessionId, students]);

  // Handle native phone camera snapshot or photo upload
  const handlePhotoCapture = (e: React.ChangeEvent<HTMLInputElement>) => {
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
            handleRawScannedString(code.data);
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

  const handleProcessScan = (student: Student) => {
    if (!activeSession) return;

    if (soundEnabled) {
      playAttendanceChime();
    }

    // Mark as present in the active session
    updateRecord(activeSession.id, student.id, 'present');

    setLastScannedStudent(student);
    const nowTime = new Date().toLocaleTimeString('ar-SA', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
    setRecentScans((prev) => [{ student, time: nowTime }, ...prev.filter((s) => s.student.id !== student.id)]);

    addAuditLog({
      entityType: 'record',
      entityId: `${activeSession.id}-${student.id}`,
      action: 'update',
      performerId: currentUser?.id || 'system',
      performerName: currentUser?.name || 'النظام',
      performerRole: currentUser?.role || 'admin',
      details: `تسجيل حضور بدون لمس عبر مسح الباركود / QR للطالب (${student.fullName}) في كشف (${activeSession.subject || 'حضور اليوم'}).`,
      previousValue: 'غير مؤكد',
      newValue: 'حاضر (Present)',
    });
  };

  const handleManualScanSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!manualCodeInput.trim()) return;

    const found = students.find(
      (s) =>
        s.studentNumber === manualCodeInput.trim() ||
        s.nationalId === manualCodeInput.trim() ||
        s.id === manualCodeInput.trim() ||
        s.fullName.toLowerCase().includes(manualCodeInput.trim().toLowerCase())
    );

    if (found) {
      handleProcessScan(found);
      setManualCodeInput('');
    } else {
      alert(`لم يتم العثور على طالب بالرقم أو الرمز: "${manualCodeInput}"`);
    }
  };

  const currentClassStudents = students.filter(
    (s) => !activeSession || s.className === activeSession.className || s.classId === activeSession.classId
  );

  const modalContent = (
    <div
      className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-xs flex items-center justify-center p-2 sm:p-4 overflow-y-auto w-screen h-screen"
      style={{ margin: 0, padding: '0.75rem', left: 0, top: 0, right: 0, bottom: 0 }}
      role="dialog"
      aria-modal="true"
    >
      <div className="bg-white rounded-2xl shadow-2xl max-w-lg md:max-w-3xl w-full p-3.5 sm:p-5 space-y-3.5 max-h-[94dvh] overflow-y-auto my-auto border border-slate-200">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-emerald-600 text-white flex items-center justify-center shadow-xs shrink-0">
              <Scan className="w-5 h-5 animate-pulse" />
            </div>
            <div>
              <h3 className="font-bold text-slate-900 text-sm sm:text-base leading-tight">
                {lang === 'ar' ? 'قارئ الحضور الذكي بالـ QR' : 'Touchless QR Attendance Scanner'}
              </h3>
              <p className="text-[11px] text-slate-500">
                {lang === 'ar'
                  ? 'رصد فوري لحضور الطلاب بالكاميرا أو مسح البطاقات'
                  : 'Fast optical attendance check-in for classroom or gate'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1.5 sm:gap-2">
            <button
              onClick={() => setSoundEnabled(!soundEnabled)}
              className={`p-1.5 sm:p-2 rounded-lg border transition-colors cursor-pointer text-xs flex items-center gap-1 ${
                soundEnabled
                  ? 'bg-emerald-50 border-emerald-300 text-emerald-800'
                  : 'bg-slate-100 border-slate-300 text-slate-500'
              }`}
              title="صوت التأكيد"
            >
              {soundEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
            </button>

            <button
              onClick={onClose}
              className="text-slate-400 hover:text-slate-600 p-1.5 rounded-lg hover:bg-slate-100 cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Active Session Picker */}
        <div className="bg-slate-50 border border-slate-200 rounded-xl p-2.5 sm:p-3 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 text-xs">
          <div className="flex flex-col sm:flex-row sm:items-center gap-1.5 sm:gap-2 w-full sm:w-auto">
            <span className="font-semibold text-slate-700 shrink-0">
              {lang === 'ar' ? 'الكشف المستهدف:' : 'Target Session:'}
            </span>
            <select
              value={activeSessionId}
              onChange={(e) => setActiveSessionId(e.target.value)}
              className="bg-white border border-slate-300 rounded-lg px-2.5 py-1.5 font-bold text-slate-900 focus:ring-2 focus:ring-emerald-500 cursor-pointer text-xs w-full sm:w-auto"
            >
              {sessions.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.className} · {s.subject || 'حضور يومي'} ({s.date})
                </option>
              ))}
            </select>
          </div>

          <div className="text-emerald-800 font-semibold bg-emerald-100/70 border border-emerald-300 px-2.5 py-1 rounded-md text-center sm:text-right shrink-0">
            حاضرون بالكشف: {activeSession?.presentCount || 0} / {activeSession?.totalStudents || 0}
          </div>
        </div>

        {/* Last scanned success banner */}
        {lastScannedStudent && (
          <div className="bg-emerald-50 border border-emerald-300 rounded-xl p-2.5 sm:p-3 text-xs text-emerald-900 flex items-center justify-between shadow-xs animate-in fade-in">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
              <div>
                <span className="font-bold text-xs sm:text-sm block">
                  تم تسجيل الحضور: {lastScannedStudent.fullName}
                </span>
                <span className="text-[10px] sm:text-[11px] text-emerald-700 font-mono">
                  رقم: {lastScannedStudent.studentNumber} · الفصل: {lastScannedStudent.className}
                </span>
              </div>
            </div>
            <span className="bg-emerald-600 text-white font-bold px-2 py-0.5 rounded text-[10px] shrink-0">
              حاضر (Present)
            </span>
          </div>
        )}

        {/* Hidden Camera File Inputs for Native Phone Camera Capture & Upload */}
        <input
          ref={cameraInputRef}
          type="file"
          accept="image/*"
          capture="environment"
          onChange={handlePhotoCapture}
          className="hidden"
        />
        <input
          ref={fileUploadInputRef}
          type="file"
          accept="image/*"
          onChange={handlePhotoCapture}
          className="hidden"
        />

        {/* Main Grid: Viewfinder vs Quick Roster */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-3.5">
          {/* Viewfinder & Phone Camera Column */}
          <div className="md:col-span-7 space-y-3">
            {/* Viewfinder Screen */}
            <div className="relative rounded-2xl overflow-hidden bg-slate-950 aspect-video sm:aspect-4/3 flex items-center justify-center border-2 border-slate-800 shadow-inner">
              {/* Live video */}
              <video
                ref={videoRef}
                playsInline
                muted
                className={`w-full h-full object-cover ${cameraActive ? 'block' : 'hidden'}`}
              />

              {/* Viewfinder Target Overlay */}
              {cameraActive && (
                <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
                  <div className="w-44 h-44 sm:w-52 sm:h-52 border-2 border-emerald-400 rounded-2xl relative">
                    <div className="absolute -top-1 -left-1 w-5 h-5 border-t-4 border-l-4 border-emerald-400 rounded-tl-md" />
                    <div className="absolute -top-1 -right-1 w-5 h-5 border-t-4 border-r-4 border-emerald-400 rounded-tr-md" />
                    <div className="absolute -bottom-1 -left-1 w-5 h-5 border-b-4 border-l-4 border-emerald-400 rounded-bl-md" />
                    <div className="absolute -bottom-1 -right-1 w-5 h-5 border-b-4 border-r-4 border-emerald-400 rounded-br-md" />
                    <div className="w-full h-0.5 bg-emerald-400 shadow-[0_0_8px_#34d399] absolute top-1/2 -translate-y-1/2 animate-pulse" />
                  </div>
                </div>
              )}

              {/* Inactive Camera State / Mobile HTTP Fallback Display */}
              {!cameraActive && (
                <div className="p-4 text-center text-slate-300 text-xs space-y-2 z-10 max-w-sm">
                  <Camera className="w-9 h-9 text-emerald-400 mx-auto" />
                  <p className="font-bold text-white text-xs sm:text-sm">
                    {lang === 'ar' ? 'مسح رمز QR بكاميرا الهاتف' : 'Scan QR via Phone Camera'}
                  </p>
                  <p className="text-[11px] text-slate-400 leading-relaxed">
                    {cameraError || (lang === 'ar' ? 'انقر على الزر الأخضر أدناه لفتح كاميرا الجوال مباشرة ومسح بطاقة الطالب.' : 'Tap the green button below to launch your phone camera.')}
                  </p>

                  <button
                    type="button"
                    onClick={() => cameraInputRef.current?.click()}
                    disabled={isProcessingPhoto}
                    className="w-full py-2.5 px-4 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white font-bold rounded-xl shadow-lg transition-all flex items-center justify-center gap-2 cursor-pointer mt-1"
                  >
                    {isProcessingPhoto ? (
                      <>
                        <RefreshCw className="w-4 h-4 animate-spin" />
                        <span>{lang === 'ar' ? 'جارٍ قراءة الرمز...' : 'Decoding QR Code...'}</span>
                      </>
                    ) : (
                      <>
                        <Camera className="w-4 h-4" />
                        <span>{lang === 'ar' ? 'فتح كاميرا الهاتف والتقاط الرمز' : 'Open Phone Camera & Scan'}</span>
                      </>
                    )}
                  </button>
                </div>
              )}
            </div>

            {/* Quick Action Buttons for Camera Snap & Upload */}
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => cameraInputRef.current?.click()}
                disabled={isProcessingPhoto}
                className="py-2 px-3 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl transition-colors flex items-center justify-center gap-1.5 cursor-pointer shadow-xs"
              >
                <Camera className="w-3.5 h-3.5 shrink-0" />
                <span className="truncate">{lang === 'ar' ? 'كاميرا الهاتف (فوري)' : 'Snap with Camera'}</span>
              </button>

              <button
                type="button"
                onClick={() => fileUploadInputRef.current?.click()}
                disabled={isProcessingPhoto}
                className="py-2 px-3 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs rounded-xl border border-slate-300 transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <Upload className="w-3.5 h-3.5 shrink-0" />
                <span className="truncate">{lang === 'ar' ? 'اختيار صورة بطاقة' : 'Upload QR Image'}</span>
              </button>
            </div>

            {/* Manual Code / Hardware Barcode Input */}
            <form onSubmit={handleManualScanSubmit} className="flex items-center gap-1.5">
              <input
                type="text"
                placeholder={lang === 'ar' ? 'أدخل رقم الطالب أو امسح بالباركود...' : 'Scan / Enter Student ID...'}
                value={manualCodeInput}
                onChange={(e) => setManualCodeInput(e.target.value)}
                className="flex-1 bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs text-slate-900 focus:ring-2 focus:ring-emerald-500 focus:outline-hidden font-mono"
              />
              <button
                type="submit"
                disabled={!manualCodeInput.trim()}
                className="bg-slate-900 hover:bg-slate-800 disabled:opacity-50 text-white font-semibold text-xs px-3.5 py-2 rounded-xl transition-colors cursor-pointer shrink-0"
              >
                {lang === 'ar' ? 'تأكيد' : 'Check-In'}
              </button>
            </form>
          </div>

          {/* Quick Roster & Scans Feed Column */}
          <div className="md:col-span-5 space-y-3">
            {/* Quick One-Click Check-In Buttons for class students */}
            <div className="bg-slate-50 border border-slate-200 rounded-xl p-3 space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="font-bold text-slate-800">
                  {lang === 'ar' ? 'مسح سريع لطلاب الفصل:' : 'One-Click Fast Scan:'}
                </span>
                <span className="text-[11px] text-slate-500 font-mono">
                  {currentClassStudents.length} طلاب
                </span>
              </div>

              <div className="max-h-36 sm:max-h-40 overflow-y-auto space-y-1 text-xs">
                {currentClassStudents.map((std) => {
                  const isPresentInSession = activeSession?.records?.find(
                    (r) => r.studentId === std.id && r.status === 'present'
                  );
                  return (
                    <button
                      key={std.id}
                      onClick={() => handleProcessScan(std)}
                      className={`w-full flex items-center justify-between p-2 rounded-lg border text-right transition-colors cursor-pointer text-xs ${
                        isPresentInSession
                          ? 'bg-emerald-50 border-emerald-300 text-emerald-900 font-semibold'
                          : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-100'
                      }`}
                    >
                      <div className="truncate">
                        <span className="font-bold">{std.fullName}</span>
                        <span className="text-[10px] text-slate-400 mr-1.5 font-mono">({std.studentNumber})</span>
                      </div>
                      {isPresentInSession ? (
                        <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                      ) : (
                        <span className="text-[10px] text-slate-400 shrink-0">مسح</span>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Live Scanned Feed */}
            <div className="bg-white border border-slate-200 rounded-xl p-3 space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="font-bold text-slate-800 flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5 text-slate-500" />
                  <span>{lang === 'ar' ? 'سجل الطلاب المرصودين بهذه الجلسة:' : 'Live Scanned Feed:'}</span>
                </span>
                <span className="text-[11px] text-emerald-700 font-bold font-mono">
                  {recentScans.length}
                </span>
              </div>

              {recentScans.length === 0 ? (
                <div className="text-center py-3 text-xs text-slate-400">
                  {lang === 'ar' ? 'بانتظار مسح بطاقات الطلاب...' : 'Waiting for student QR scans...'}
                </div>
              ) : (
                <div className="max-h-28 sm:max-h-36 overflow-y-auto space-y-1.5 text-xs">
                  {recentScans.map((item, i) => (
                    <div
                      key={i}
                      className="flex items-center justify-between p-1.5 sm:p-2 rounded-lg bg-emerald-50/60 border border-emerald-200 text-emerald-950"
                    >
                      <div className="truncate">
                        <div className="font-bold truncate">{item.student.fullName}</div>
                        <div className="text-[10px] text-emerald-700">{item.student.className}</div>
                      </div>
                      <span className="font-mono text-[10px] text-emerald-800 bg-white px-1.5 py-0.5 rounded border border-emerald-200 shrink-0">
                        {item.time}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="pt-2 border-t border-slate-100 flex items-center justify-end">
          <button
            onClick={onClose}
            className="px-5 py-2 text-xs bg-slate-900 hover:bg-slate-800 text-white font-semibold rounded-lg cursor-pointer"
          >
            {lang === 'ar' ? 'إغلاق الماسح' : 'Close Scanner'}
          </button>
        </div>
      </div>
    </div>
  );

  return typeof document !== 'undefined'
    ? createPortal(modalContent, document.body)
    : modalContent;
};


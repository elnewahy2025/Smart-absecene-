import React, { useEffect, useRef, useState } from 'react';
import { useModalAccessibility } from '../hooks/useModalAccessibility';
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
  RotateCcw,
  Sparkles,
  Check,
  UserCheck,
  UserX,
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

// Synthesize distinct low alert tone for duplicate scan detection
function playDuplicateWarningTone() {
  try {
    const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioContextClass) return;
    const ctx = new AudioContextClass();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(240, ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(180, ctx.currentTime + 0.22);

    gain.gain.setValueAtTime(0.18, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.3);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start();
    osc.stop(ctx.currentTime + 0.3);
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
  const dialogRef = useRef<HTMLDivElement>(null);
  useModalAccessibility({ isOpen: true, onClose, containerRef: dialogRef });

  // 3-Condition QR Attendance Mode states
  const [qrModeActive, setQrModeActive] = useState(false);
  const [scannedTimestamps, setScannedTimestamps] = useState<Record<string, string>>({});
  const [duplicateWarning, setDuplicateWarning] = useState<{ student: Student; time: string } | null>(null);
  const [isStartConfirmOpen, setIsStartConfirmOpen] = useState(false);
  const [isFinalizeModalOpen, setIsFinalizeModalOpen] = useState(false);
  const [unscannedSettings, setUnscannedSettings] = useState<
    Record<string, { status: 'absent' | 'late'; minutesLate: number }>
  >({});

  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);
  const fileUploadInputRef = useRef<HTMLInputElement>(null);
  const offscreenCanvasRef = useRef<HTMLCanvasElement | null>(null);

  const activeSession = sessions.find((s) => s.id === activeSessionId) || sessions[0];
  const isSecure = typeof window !== 'undefined' && (window.isSecureContext || window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1');

  // Auto-dismiss duplicate warning banner after 6 seconds
  useEffect(() => {
    if (!duplicateWarning) return;
    const timer = setTimeout(() => {
      setDuplicateWarning(null);
    }, 6000);
    return () => clearTimeout(timer);
  }, [duplicateWarning]);

  // Reset QR scan session state when target session changes
  useEffect(() => {
    setQrModeActive(false);
    setScannedTimestamps({});
    setDuplicateWarning(null);
    setLastScannedStudent(null);
  }, [activeSessionId]);

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

    // Condition 3: Prevent duplicate check-in if student is already present in this session
    const currentRec = activeSession.records.find((r) => r.studentId === student.id);
    const existingTimestamp = scannedTimestamps[student.id];
    const isAlreadyPresent = currentRec?.status === 'present';

    if (isAlreadyPresent || existingTimestamp) {
      const recordedTime =
        existingTimestamp ||
        currentRec?.note?.match(/\d{1,2}:\d{2}(:\d{2})?/)?.[0] ||
        (lang === 'ar' ? 'سابقاً في هذه الجلسة' : 'earlier in this session');

      if (soundEnabled) {
        playDuplicateWarningTone();
      }

      setDuplicateWarning({
        student,
        time: recordedTime,
      });

      // Clear last scanned student so the duplicate warning banner is prominent
      setLastScannedStudent(null);
      return;
    }

    // Normal valid scan
    setDuplicateWarning(null);

    const nowTime = new Date().toLocaleTimeString('ar-SA', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    });

    // Store exact scan timestamp
    setScannedTimestamps((prev) => ({ ...prev, [student.id]: nowTime }));

    // Mark as present in the active session with scan time recorded in note
    updateRecord(
      activeSession.id,
      student.id,
      'present',
      undefined,
      lang === 'ar' ? `حضور عبر مسح الـ QR في تمام ${nowTime}` : `QR Scan Check-In at ${nowTime}`
    );

    if (soundEnabled) {
      playAttendanceChime();
    }

    setLastScannedStudent(student);
    setRecentScans((prev) => [{ student, time: nowTime }, ...prev.filter((s) => s.student.id !== student.id)]);

    addAuditLog({
      entityType: 'record',
      entityId: `${activeSession.id}-${student.id}`,
      action: 'update',
      performerId: currentUser?.id || 'system',
      performerName: currentUser?.name || 'النظام',
      performerRole: currentUser?.role || 'admin',
      details: `تسجيل حضور بدون لمس عبر مسح الباركود / QR للطالب (${student.fullName}) في كشف (${activeSession.subject || 'حضور اليوم'}) في تمام الساعة ${nowTime}.`,
      previousValue: qrModeActive ? 'بانتظار مسح الـ QR' : 'غير مؤكد',
      newValue: `حاضر (${nowTime})`,
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

  const [sessionBanner, setSessionBanner] = useState<string | null>(null);

  // Condition 1: Reset roster only after explicit teacher confirmation
  const handleConfirmStartQRMode = () => {
    if (!activeSession) return;

    activeSession.records.forEach((rec) => {
      updateRecord(
        activeSession.id,
        rec.studentId,
        'absent',
        undefined,
        lang === 'ar' ? 'بانتظار مسح الـ QR - جلسة نشطة' : 'Pending QR Scan - Active Session'
      );
    });

    setQrModeActive(true);
    setScannedTimestamps({});
    setRecentScans([]);
    setLastScannedStudent(null);
    setDuplicateWarning(null);
    setIsStartConfirmOpen(false);

    addAuditLog({
      entityType: 'session',
      entityId: activeSession.id,
      action: 'update',
      performerId: currentUser?.id || 'system',
      performerName: currentUser?.name || 'المعلم',
      performerRole: currentUser?.role || 'admin',
      details: `بدء وضع مسح الـ QR الذكي لكشف (${activeSession.subject || 'حضور اليوم'} - ${activeSession.className}). تعيين حالة الطلاب إلى «بانتظار مسح الـ QR» وتأجيل اعتماد الغياب حتى اكتمال الجلسة.`,
      previousValue: 'حاضر للكل',
      newValue: 'بانتظار مسح الـ QR (جلسة نشطة)',
    });

    setSessionBanner(
      lang === 'ar'
        ? `⚡ تم تفعيل وضع مسح الـ QR بنجاح لفصل (${activeSession.className}): الكشف في حالة «بانتظار تسجيل الحضور». وجّه الكاميرا لبطاقة كل طالب.`
        : `QR Check-In mode activated for (${activeSession.className}). Waiting for student card scans.`
    );
    setTimeout(() => setSessionBanner(null), 6000);
  };

  // Condition 2: Open finalize review modal to inspect unscanned students and flag late arrivals
  const handleOpenFinalizeModal = () => {
    if (!activeSession) return;
    const initialMap: Record<string, { status: 'absent' | 'late'; minutesLate: number }> = {};
    currentClassStudents.forEach((std) => {
      const rec = activeSession.records.find((r) => r.studentId === std.id);
      if (rec?.status !== 'present') {
        initialMap[std.id] = { status: 'absent', minutesLate: 15 };
      }
    });
    setUnscannedSettings(initialMap);
    setIsFinalizeModalOpen(true);
  };

  const handleToggleUnscannedStatus = (studentId: string, status: 'absent' | 'late') => {
    setUnscannedSettings((prev) => ({
      ...prev,
      [studentId]: {
        status,
        minutesLate: prev[studentId]?.minutesLate || 15,
      },
    }));
  };

  const handleChangeUnscannedMinutes = (studentId: string, minutesLate: number) => {
    setUnscannedSettings((prev) => ({
      ...prev,
      [studentId]: {
        status: prev[studentId]?.status || 'late',
        minutesLate,
      },
    }));
  };

  // Condition 2: Commit final absences and late records after teacher review
  const handleFinalizeQRSession = () => {
    if (!activeSession) return;

    let absentCount = 0;
    let lateCount = 0;

    currentClassStudents.forEach((std) => {
      const rec = activeSession.records.find((r) => r.studentId === std.id);
      if (rec?.status !== 'present') {
        const setting = unscannedSettings[std.id] || { status: 'absent', minutesLate: 15 };
        if (setting.status === 'late') {
          lateCount++;
          updateRecord(
            activeSession.id,
            std.id,
            'late',
            setting.minutesLate,
            lang === 'ar'
              ? `حضور متأخر (${setting.minutesLate} دقيقة) - تم اعتماده عند إنهاء جلسة الـ QR`
              : `Late check-in (${setting.minutesLate}m) recorded at QR session finalization`
          );
        } else {
          absentCount++;
          updateRecord(
            activeSession.id,
            std.id,
            'absent',
            undefined,
            lang === 'ar'
              ? 'غائب - لم يحضر جلسة مسح الـ QR'
              : 'Absent - Did not check in during QR session'
          );
        }
      }
    });

    const presentScannedCount = activeSession.records.filter((r) => r.status === 'present').length;

    setQrModeActive(false);
    setIsFinalizeModalOpen(false);

    addAuditLog({
      entityType: 'session',
      entityId: activeSession.id,
      action: 'update',
      performerId: currentUser?.id || 'system',
      performerName: currentUser?.name || 'المعلم',
      performerRole: currentUser?.role || 'admin',
      details: `إنهاء جلسة مسح الـ QR واعتماد الكشف النهائي لفصل (${activeSession.className}): تم اعتماد ${presentScannedCount} حاضر، و ${lateCount} متأخر، و ${absentCount} غائب.`,
      previousValue: 'جلسة QR نشطة',
      newValue: 'كشف معتمد نهائياً',
    });

    setSessionBanner(
      lang === 'ar'
        ? `✅ تم إنهاء جلسة مسح الـ QR واعتماد كشف الحضور والغياب النهائي بنجاح لفصل (${activeSession.className}).`
        : `QR session finalized and absences committed for (${activeSession.className}).`
    );
    setTimeout(() => setSessionBanner(null), 6000);
  };

  // Manual Mode Switch: Reset all students present
  const handleSetAllPresent = () => {
    if (!activeSession) return;
    activeSession.records.forEach((rec) => {
      updateRecord(activeSession.id, rec.studentId, 'present');
    });

    setQrModeActive(false);
    setScannedTimestamps({});
    setDuplicateWarning(null);

    addAuditLog({
      entityType: 'session',
      entityId: activeSession.id,
      action: 'update',
      performerId: currentUser?.id || 'system',
      performerName: currentUser?.name || 'المعلم',
      performerRole: currentUser?.role || 'admin',
      details: `إعادة تعيين كامل الفصل (${activeSession.className}) كـ حاضر افتراضياً (التحضير اليدوي).`,
      previousValue: 'وضع QR / غائب',
      newValue: 'التحضير اليدوي (حاضر للكل)',
    });

    setSessionBanner(
      lang === 'ar'
        ? `✅ تم تعيين جميع طلاب الفصل كـ 'حاضر' افتراضياً (التحضير اليدوي النشط).`
        : `All students marked Present (Manual Attendance Mode Active).`
    );
    setTimeout(() => setSessionBanner(null), 4000);
  };

  const currentClassStudents = students.filter(
    (s) => !activeSession || s.className === activeSession.className || s.classId === activeSession.classId
  );

  const unscannedStudents = currentClassStudents.filter((std) => {
    const rec = activeSession?.records?.find((r) => r.studentId === std.id);
    return rec?.status !== 'present';
  });

  const modalContent = (
    <div
      className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-xs flex items-center justify-center p-2 sm:p-4 overflow-y-auto w-screen h-screen"
        style={{ margin: 0, padding: '0.75rem', left: 0, top: 0, right: 0, bottom: 0 }}
        ref={dialogRef}
        tabIndex={-1}
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

          <div className="text-emerald-800 dark:text-emerald-300 font-semibold bg-emerald-100/70 dark:bg-emerald-950/40 border border-emerald-300 dark:border-emerald-700 px-2.5 py-1 rounded-md text-center sm:text-right shrink-0">
            حاضرون بالكشف: {activeSession?.presentCount || 0} / {activeSession?.totalStudents || 0}
          </div>
        </div>

        {/* Smart QR Attendance Mode Banner & Controls */}
        {!qrModeActive ? (
          <div className="p-3 bg-slate-50 dark:bg-slate-800/70 border border-slate-200 dark:border-slate-700/80 rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 text-xs shadow-2xs">
            <div className="flex items-start sm:items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 flex items-center justify-center shrink-0">
                <CheckCircle2 className="w-4 h-4" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-bold text-slate-900 dark:text-white block text-xs">
                    {lang === 'ar' ? 'وضع التحضير اليدوي (نشط افتراضياً)' : 'Manual Attendance Mode (Default)'}
                  </span>
                  <span className="bg-emerald-100 dark:bg-emerald-900/40 text-emerald-800 dark:text-emerald-300 px-2 py-0.5 rounded text-[10px] font-bold border border-emerald-300 dark:border-emerald-700">
                    {lang === 'ar' ? 'الكل حاضر' : 'All Present'}
                  </span>
                </div>
                <span className="text-[11px] text-slate-500 dark:text-slate-400 leading-tight block mt-0.5">
                  {lang === 'ar'
                    ? 'جميع طلاب الفصل حاضرون تلقائياً. لبدء التحضير بالـ QR وتصفير الكشف مع تحذير المعلم، اضغط زر التفعيل.'
                    : 'All students marked present by default. Switch to QR Mode to reset roster for optical scanning.'}
                </span>
              </div>
            </div>

            <div className="flex items-center gap-2 shrink-0 self-end sm:self-center">
              <button
                type="button"
                onClick={() => setIsStartConfirmOpen(true)}
                className="px-3.5 py-2 bg-amber-600 hover:bg-amber-700 text-white font-bold rounded-xl shadow-xs transition-colors flex items-center gap-1.5 cursor-pointer text-xs"
                title={lang === 'ar' ? 'تفعيل وضع مسح الـ QR مع تحذير واضح' : 'Switch to QR Check-In Mode'}
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>{lang === 'ar' ? 'تفعيل وضع مسح الـ QR' : 'Switch to QR Mode'}</span>
              </button>
            </div>
          </div>
        ) : (
          <div className="p-3 bg-gradient-to-r from-amber-50 to-emerald-50 dark:from-amber-950/40 dark:to-emerald-950/40 border-2 border-amber-300 dark:border-amber-700 rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 text-xs shadow-xs animate-in fade-in">
            <div className="flex items-start sm:items-center gap-2.5">
              <span className="relative flex h-3 w-3 shrink-0 mt-1 sm:mt-0">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-3 w-3 bg-red-500"></span>
              </span>
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-bold text-amber-950 dark:text-amber-200 block text-xs">
                    {lang === 'ar' ? '🔴 جلسة مسح الـ QR نشطة حالياً' : '🔴 QR Scan Session Active'}
                  </span>
                  <span className="bg-amber-200/90 dark:bg-amber-900/60 text-amber-900 dark:text-amber-200 px-2 py-0.5 rounded text-[10px] font-bold border border-amber-300 dark:border-amber-600">
                    {lang === 'ar' ? `بانتظار المسح: ${unscannedStudents.length}` : `Pending: ${unscannedStudents.length}`}
                  </span>
                </div>
                <span className="text-[11px] text-amber-800 dark:text-amber-300/90 leading-tight block mt-0.5">
                  {lang === 'ar'
                    ? 'الطلاب غير الممسوحين في حالة «بانتظار تسجيل الحضور». لن يُعتمد الغياب النهائي إلا بعد إنهاء الجلسة ومراجعة المتأخرين.'
                    : 'Unscanned students remain Pending. Final absences deferred until session completion.'}
                </span>
              </div>
            </div>

            <div className="flex items-center gap-2 shrink-0 self-end sm:self-center">
              <button
                type="button"
                onClick={handleOpenFinalizeModal}
                className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl shadow-xs transition-colors flex items-center gap-1.5 cursor-pointer text-xs"
                title={lang === 'ar' ? 'إنهاء جلسة المسح، مراجعة المتأخرين، واعتماد الغياب النهائي' : 'End session, review late arrivals, and finalize absences'}
              >
                <UserCheck className="w-3.5 h-3.5" />
                <span>{lang === 'ar' ? `إنهاء الجلسة واعتماد الغياب (${unscannedStudents.length})` : 'Finalize QR Session'}</span>
              </button>

              <button
                type="button"
                onClick={handleSetAllPresent}
                className="px-2.5 py-2 bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 border border-slate-300 dark:border-slate-700 font-semibold rounded-xl transition-colors flex items-center gap-1 cursor-pointer text-xs"
                title={lang === 'ar' ? 'إلغاء وضع الـ QR والعودة للتحضير اليدوي' : 'Return to manual attendance'}
              >
                <RotateCcw className="w-3.5 h-3.5 text-slate-500" />
                <span>{lang === 'ar' ? 'التحضير اليدوي' : 'Manual Mode'}</span>
              </button>
            </div>
          </div>
        )}

        {/* Condition 3: Duplicate Scan Warning Alert */}
        {duplicateWarning && (
          <div className="p-3 bg-amber-100 dark:bg-amber-950/80 border-2 border-amber-400 dark:border-amber-600 rounded-xl text-xs text-amber-950 dark:text-amber-100 flex items-center justify-between shadow-md animate-in fade-in slide-in-from-top-1">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-amber-500 text-white flex items-center justify-center shrink-0 shadow-xs">
                <AlertTriangle className="w-5 h-5" />
              </div>
              <div>
                <span className="font-bold text-xs sm:text-sm block">
                  {lang === 'ar' ? '⚠️ تنبيه تكرار: تم مسح رمز الطالب مسبقاً!' : '⚠️ Duplicate Scan: Student Already Checked In!'}
                </span>
                <span className="text-[11px] text-amber-900 dark:text-amber-200 leading-snug">
                  {lang === 'ar' ? (
                    <>
                      الطالب <strong>{duplicateWarning.student.fullName}</strong> مسجل حضور بالفعل في تمام الساعة:{' '}
                      <strong className="font-mono bg-white dark:bg-slate-800 px-1.5 py-0.5 rounded border border-amber-300 dark:border-amber-700 text-amber-900 dark:text-amber-200">
                        {duplicateWarning.time}
                      </strong>
                      . تم منع التكرار للحفاظ على دقة السجل وعدم ازدواجية الرصد.
                    </>
                  ) : (
                    `Student ${duplicateWarning.student.fullName} is already checked in at ${duplicateWarning.time}. Duplicate scan prevented.`
                  )}
                </span>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setDuplicateWarning(null)}
              className="text-amber-800 dark:text-amber-300 hover:text-amber-950 dark:hover:text-amber-100 p-1 cursor-pointer shrink-0"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* Reset Confirmation Banner */}
        {sessionBanner && (
          <div className="p-2.5 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-300 dark:border-emerald-700 text-emerald-900 dark:text-emerald-200 rounded-xl text-xs font-bold flex items-center justify-between shadow-xs animate-in fade-in">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
              <span>{sessionBanner}</span>
            </div>
            <button
              type="button"
              onClick={() => setSessionBanner(null)}
              className="text-emerald-700 dark:text-emerald-300 hover:text-emerald-950 p-0.5 cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* Last scanned success banner with exact scan timestamp */}
        {lastScannedStudent && !duplicateWarning && (
          <div className="bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-300 dark:border-emerald-700 rounded-xl p-2.5 sm:p-3 text-xs text-emerald-900 dark:text-emerald-200 flex items-center justify-between shadow-xs animate-in fade-in">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-5 h-5 text-emerald-600 dark:text-emerald-400 shrink-0" />
              <div>
                <span className="font-bold text-xs sm:text-sm block">
                  تم تسجيل الحضور: {lastScannedStudent.fullName}
                </span>
                <span className="text-[10px] sm:text-[11px] text-emerald-700 dark:text-emerald-300 font-mono">
                  رقم: {lastScannedStudent.studentNumber} · الفصل: {lastScannedStudent.className}
                  {scannedTimestamps[lastScannedStudent.id] && ` · وقت الحضور: ${scannedTimestamps[lastScannedStudent.id]}`}
                </span>
              </div>
            </div>
            <span className="bg-emerald-600 text-white font-bold px-2.5 py-1 rounded-md text-[10px] shrink-0">
              حاضر ✔
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
                  const scanTime = scannedTimestamps[std.id];
                  return (
                    <button
                      key={std.id}
                      onClick={() => handleProcessScan(std)}
                      className={`w-full flex items-center justify-between p-2 rounded-lg border text-right transition-colors cursor-pointer text-xs ${
                        isPresentInSession
                          ? 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-300 dark:border-emerald-700 text-emerald-900 dark:text-emerald-200 font-semibold'
                          : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700'
                      }`}
                    >
                      <div className="truncate">
                        <span className="font-bold">{std.fullName}</span>
                        <span className="text-[10px] text-slate-400 dark:text-slate-500 mr-1.5 font-mono">({std.studentNumber})</span>
                      </div>
                      {isPresentInSession ? (
                        <div className="flex items-center gap-1 text-emerald-600 dark:text-emerald-400 font-bold text-[10px] shrink-0">
                          <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
                          <span>{lang === 'ar' ? `حاضر ${scanTime ? `(${scanTime})` : '✔'}` : `Present ${scanTime || '✔'}`}</span>
                        </div>
                      ) : (
                        <span
                          className={`text-[10px] px-2 py-0.5 rounded border shrink-0 font-medium ${
                            qrModeActive
                              ? 'text-amber-800 dark:text-amber-300 bg-amber-50 dark:bg-amber-950/40 border-amber-200 dark:border-amber-800'
                              : 'text-slate-600 dark:text-slate-400 bg-slate-100 dark:bg-slate-800 border-slate-300 dark:border-slate-700'
                          }`}
                        >
                          {qrModeActive
                            ? (lang === 'ar' ? '⏳ بانتظار مسح الـ QR' : '⏳ Pending')
                            : (lang === 'ar' ? 'غائب (يدوي)' : 'Absent')}
                        </span>
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

        {/* Condition 1 Modal: Start QR Check-In Mode Confirmation */}
        {isStartConfirmOpen && (
          <div
            className="fixed inset-0 z-60 bg-black/60 backdrop-blur-xs flex items-center justify-center p-3 animate-in fade-in"
            role="dialog"
            aria-modal="true"
          >
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl max-w-md w-full p-4 sm:p-5 space-y-4 animate-in zoom-in-95">
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-xl bg-amber-500/15 border border-amber-500/30 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0">
                  <AlertTriangle className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="font-bold text-slate-900 dark:text-white text-sm sm:text-base">
                    {lang === 'ar' ? 'تأكيد تفعيل وضع مسح الـ QR' : 'Confirm QR Check-In Mode'}
                  </h4>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                    {activeSession?.className} · {activeSession?.subject || (lang === 'ar' ? 'حضور اليوم' : 'Daily Attendance')}
                  </p>
                </div>
              </div>

              <div className="p-3.5 bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800/80 rounded-xl text-xs space-y-2.5 text-amber-950 dark:text-amber-200">
                <div className="font-bold flex items-center gap-1.5 text-amber-900 dark:text-amber-100">
                  <Info className="w-4 h-4 text-amber-600 shrink-0" />
                  <span>{lang === 'ar' ? 'تحذير هام للمعلم قبل البدء:' : 'Important Notice Before Starting:'}</span>
                </div>
                <ul className="list-disc list-inside space-y-1.5 text-[11px] leading-relaxed text-amber-900 dark:text-amber-300">
                  <li>
                    {lang === 'ar'
                      ? 'سيتم تصفير كشف هذا الفصل مؤقتاً ووضع جميع الطلاب في حالة «بانتظار تسجيل الحضور».'
                      : 'The roster will be reset temporarily to "Pending Check-In" for all students.'}
                  </li>
                  <li>
                    {lang === 'ar'
                      ? 'كل طالب يتم مسح بطاقته سيتحول فوراً إلى «حاضر» مع تسجيل وقت الحضور بالثانية ومنع تكرار مسحه.'
                      : 'Each scanned student will instantly become Present with exact timestamp; duplicate scans are prevented.'}
                  </li>
                  <li>
                    {lang === 'ar'
                      ? 'لن يتم اعتماد الغياب النهائي إلا بعد إنهاء جلسة المسح بقرارك، لتتمكن من مراجعة المتأخرين وتفادي تسجيلهم كغائبين.'
                      : 'Final absences will NOT be committed until you end the scan session, allowing late arrivals to be reviewed.'}
                  </li>
                </ul>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsStartConfirmOpen(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors cursor-pointer"
                >
                  {lang === 'ar' ? 'إلغاء والعودة' : 'Cancel'}
                </button>
                <button
                  type="button"
                  onClick={handleConfirmStartQRMode}
                  className="px-4 py-2 text-xs font-bold bg-amber-600 hover:bg-amber-500 text-white rounded-xl shadow-md transition-colors cursor-pointer flex items-center gap-1.5"
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>{lang === 'ar' ? 'تأكيد وبدء مسح الـ QR' : 'Confirm & Start Scan'}</span>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Condition 2 Modal: Finalize QR Session & Absence Review */}
        {isFinalizeModalOpen && (
          <div
            className="fixed inset-0 z-60 bg-black/60 backdrop-blur-xs flex items-center justify-center p-2 sm:p-4 animate-in fade-in overflow-y-auto"
            role="dialog"
            aria-modal="true"
          >
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl max-w-lg w-full p-4 sm:p-5 space-y-4 my-auto max-h-[92dvh] overflow-y-auto animate-in zoom-in-95">
              <div className="flex items-start justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
                <div className="flex items-center gap-2.5">
                  <div className="w-9 h-9 rounded-xl bg-emerald-600 text-white flex items-center justify-center shadow-xs shrink-0">
                    <UserCheck className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="font-bold text-slate-900 dark:text-white text-sm sm:text-base leading-tight">
                      {lang === 'ar' ? 'إنهاء جلسة المسح واعتماد الغياب النهائي' : 'Finalize Session & Commit Absences'}
                    </h4>
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                      {lang === 'ar' ? `فصل: ${activeSession?.className} · مراجعة الطلاب غير الممسوحين` : `Class: ${activeSession?.className}`}
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setIsFinalizeModalOpen(false)}
                  className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-1.5 rounded-lg cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Stats summary cards */}
              <div className="grid grid-cols-3 gap-2 text-center text-xs">
                <div className="p-2.5 bg-slate-50 dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700">
                  <div className="text-[10px] text-slate-500 dark:text-slate-400">{lang === 'ar' ? 'إجمالي الفصل' : 'Total'}</div>
                  <div className="text-base font-bold text-slate-900 dark:text-white font-mono">{currentClassStudents.length}</div>
                </div>
                <div className="p-2.5 bg-emerald-50 dark:bg-emerald-950/40 rounded-xl border border-emerald-200 dark:border-emerald-800">
                  <div className="text-[10px] text-emerald-700 dark:text-emerald-300">{lang === 'ar' ? 'حاضرون بالمسح' : 'Scanned'}</div>
                  <div className="text-base font-bold text-emerald-800 dark:text-emerald-200 font-mono">
                    {currentClassStudents.length - unscannedStudents.length}
                  </div>
                </div>
                <div className="p-2.5 bg-amber-50 dark:bg-amber-950/40 rounded-xl border border-amber-200 dark:border-amber-800">
                  <div className="text-[10px] text-amber-700 dark:text-amber-300">{lang === 'ar' ? 'لم يمسحوا (متبقين)' : 'Unscanned'}</div>
                  <div className="text-base font-bold text-amber-800 dark:text-amber-200 font-mono">
                    {unscannedStudents.length}
                  </div>
                </div>
              </div>

              {/* Unscanned Students Review List */}
              <div className="space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-bold text-slate-800 dark:text-slate-200">
                    {lang === 'ar' ? 'الطلاب غير الممسوحين (تحديد المتأخرين قبل الاعتماد):' : 'Unscanned Students (Flag late arrivals):'}
                  </span>
                  <span className="text-[11px] text-slate-500 font-mono">
                    {unscannedStudents.length} {lang === 'ar' ? 'طالب' : 'students'}
                  </span>
                </div>

                {unscannedStudents.length === 0 ? (
                  <div className="p-4 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 rounded-xl text-center text-xs text-emerald-900 dark:text-emerald-200 space-y-1">
                    <CheckCircle2 className="w-6 h-6 text-emerald-600 mx-auto" />
                    <p className="font-bold">{lang === 'ar' ? 'مكتمل بنسبة 100%!' : '100% Complete!'}</p>
                    <p className="text-[11px] text-emerald-700 dark:text-emerald-300">
                      {lang === 'ar' ? 'جميع طلاب الفصل حاضرون وتم مسح بطاقاتهم بالكامل.' : 'All students checked in successfully.'}
                    </p>
                  </div>
                ) : (
                  <div className="max-h-52 overflow-y-auto space-y-1.5 border border-slate-200 dark:border-slate-800 rounded-xl p-2 bg-slate-50/50 dark:bg-slate-900/50">
                    {unscannedStudents.map((std) => {
                      const currentSetting = unscannedSettings[std.id] || { status: 'absent', minutesLate: 15 };
                      const isLate = currentSetting.status === 'late';
                      return (
                        <div
                          key={std.id}
                          className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 p-2 rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs"
                        >
                          <div className="truncate">
                            <span className="font-bold text-slate-900 dark:text-white block sm:inline">{std.fullName}</span>
                            <span className="text-[10px] text-slate-400 sm:mr-1.5 font-mono">({std.studentNumber})</span>
                          </div>

                          <div className="flex items-center gap-1.5 self-end sm:self-center shrink-0">
                            {/* Status Toggle Buttons */}
                            <div className="inline-flex rounded-lg border border-slate-200 dark:border-slate-700 p-0.5 bg-slate-100 dark:bg-slate-900">
                              <button
                                type="button"
                                onClick={() => handleToggleUnscannedStatus(std.id, 'absent')}
                                className={`px-2 py-1 rounded text-[11px] font-semibold transition-colors cursor-pointer ${
                                  !isLate
                                    ? 'bg-rose-600 text-white shadow-xs'
                                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
                                }`}
                              >
                                {lang === 'ar' ? 'غائب' : 'Absent'}
                              </button>
                              <button
                                type="button"
                                onClick={() => handleToggleUnscannedStatus(std.id, 'late')}
                                className={`px-2 py-1 rounded text-[11px] font-semibold transition-colors cursor-pointer flex items-center gap-1 ${
                                  isLate
                                    ? 'bg-amber-600 text-white shadow-xs'
                                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
                                }`}
                              >
                                <Clock className="w-3 h-3" />
                                <span>{lang === 'ar' ? 'متأخر' : 'Late'}</span>
                              </button>
                            </div>

                            {/* Minutes selector if late */}
                            {isLate && (
                              <select
                                value={currentSetting.minutesLate}
                                onChange={(e) => handleChangeUnscannedMinutes(std.id, Number(e.target.value))}
                                className="bg-amber-50 dark:bg-amber-950/60 border border-amber-300 dark:border-amber-700 rounded-md px-1.5 py-1 text-[10px] font-bold text-amber-900 dark:text-amber-200 cursor-pointer"
                                title={lang === 'ar' ? 'دقائق التأخير' : 'Minutes Late'}
                              >
                                <option value={5}>5 د</option>
                                <option value={10}>10 د</option>
                                <option value={15}>15 د</option>
                                <option value={20}>20 د</option>
                                <option value={30}>30 د</option>
                                <option value={45}>45 د</option>
                              </select>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              <div className="flex flex-col sm:flex-row items-center justify-between gap-2 pt-3 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsFinalizeModalOpen(false)}
                  className="w-full sm:w-auto px-4 py-2 text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors cursor-pointer text-center"
                >
                  {lang === 'ar' ? 'العودة للمسح (متابعة استقبال الطلاب)' : 'Return to Scanning'}
                </button>

                <button
                  type="button"
                  onClick={handleFinalizeQRSession}
                  className="w-full sm:w-auto px-4 py-2 text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl shadow-md transition-colors cursor-pointer flex items-center justify-center gap-1.5"
                >
                  <Check className="w-4 h-4" />
                  <span>{lang === 'ar' ? 'اعتماد الغياب النهائي وإنهاء الجلسة' : 'Commit & Finalize Attendance'}</span>
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );

  return typeof document !== 'undefined'
    ? createPortal(modalContent, document.body)
    : modalContent;
};


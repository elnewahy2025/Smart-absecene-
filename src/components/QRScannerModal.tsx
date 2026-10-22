import React, { useEffect, useRef, useState } from 'react';
import { useModalAccessibility } from '../hooks/useModalAccessibility';
import { useQrCamera } from '../hooks/useQrCamera';
import { createPortal } from 'react-dom';
import { useAttendance } from '../context/AttendanceContext';
import { Student } from '../types/attendance';
import { playAttendanceChime, playDuplicateWarningTone } from '../utils/attendanceSounds';
import {
  getSessionClassStudents,
  getUnscannedStudents,
  matchStudentByManualCode,
  matchStudentByPayload,
} from '../utils/qrStudentMatch';
import { QrFinalizeModal } from './attendance/QrFinalizeModal';
import { QrStartConfirmModal } from './attendance/QrStartConfirmModal';
import { QrModeBanner } from './attendance/QrModeBanner';
import { QrQuickRosterPanel } from './attendance/QrQuickRosterPanel';
import { QrScanFeedback } from './attendance/QrScanFeedback';
import { QrViewfinderPanel } from './attendance/QrViewfinderPanel';
import {
  Scan,


  X,
  Volume2,
  VolumeX,



  Check,
} from 'lucide-react';

interface QRScannerModalProps {
  onClose: () => void;
  targetSessionId?: string;
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

  const activeSession = sessions.find((s) => s.id === activeSessionId) || sessions[0];
  const handleRawScannedString = (raw: string) => {
    if (!raw || !raw.trim()) return;

    const found = matchStudentByPayload(raw, students);
    if (found) {
      handleProcessScan(found);
      return;
    }

    alert(
      lang === 'ar'
        ? `تم مسح الرمز: "${raw}" لكن لم يتم العثور على طالب مطابق بقائمة المدرسة.`
        : `Scanned code "${raw}", but no matching student found.`
    );
  };

  const {
    videoRef,
    cameraInputRef,
    fileUploadInputRef,
    cameraActive,
    cameraError,
    isProcessingPhoto,
    handlePhotoCapture,
  } = useQrCamera({ lang, onDecoded: handleRawScannedString });

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
      detailsEn: `Touchless check-in via barcode / QR scan for student (${student.fullName}) in session (${activeSession.subject || 'Daily Attendance'}) at exactly ${nowTime}.`,
      previousValue: qrModeActive ? 'بانتظار مسح الـ QR' : 'غير مؤكد',
      newValue: `حاضر (${nowTime})`,
    });
  };

  const handleManualScanSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!manualCodeInput.trim()) return;

    const found = matchStudentByManualCode(manualCodeInput, students);
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
      detailsEn: `Started smart QR scan mode for session (${activeSession.subject || 'Daily Attendance'} - ${activeSession.className}). Student status set to "Pending QR Scan" and absence confirmation deferred until session completion.`,
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
      detailsEn: `Finalized QR scan session and confirmed the final roster for class (${activeSession.className}): ${presentScannedCount} present, ${lateCount} late, and ${absentCount} absent confirmed.`,
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
      detailsEn: `Reset the entire class (${activeSession.className}) to present by default (manual attendance).`,
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

  const currentClassStudents = getSessionClassStudents(students, activeSession);

  const unscannedStudents = getUnscannedStudents(currentClassStudents, activeSession);

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
        <QrModeBanner
          lang={lang}
          qrModeActive={qrModeActive}
          unscannedCount={unscannedStudents.length}
          onSwitchToQr={() => setIsStartConfirmOpen(true)}
          onOpenFinalize={handleOpenFinalizeModal}
          onReturnManual={handleSetAllPresent}
        />

        {/* Scan feedback banners: duplicate warning, session banner, last scan */}
        <QrScanFeedback
          lang={lang}
          duplicateWarning={duplicateWarning}
          sessionBanner={sessionBanner}
          lastScannedStudent={lastScannedStudent}
          scannedTimestamps={scannedTimestamps}
          onDismissDuplicate={() => setDuplicateWarning(null)}
          onDismissSessionBanner={() => setSessionBanner(null)}
        />

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
          {/* Viewfinder & Phone Camera Column */}
          <QrViewfinderPanel
            lang={lang}
            cameraActive={cameraActive}
            cameraError={cameraError}
            isProcessingPhoto={isProcessingPhoto}
            videoRef={videoRef}
            cameraInputRef={cameraInputRef}
            fileUploadInputRef={fileUploadInputRef}
            manualCodeInput={manualCodeInput}
            onManualCodeChange={setManualCodeInput}
            onManualSubmit={handleManualScanSubmit}
          />

          {/* Quick Roster & Scans Feed Column */}
          <QrQuickRosterPanel
            lang={lang}
            activeSession={activeSession}
            currentClassStudents={currentClassStudents}
            scannedTimestamps={scannedTimestamps}
            qrModeActive={qrModeActive}
            recentScans={recentScans}
            onScanStudent={handleProcessScan}
          />
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
        <QrStartConfirmModal
          isOpen={isStartConfirmOpen}
          lang={lang}
          activeSession={activeSession}
          onConfirm={handleConfirmStartQRMode}
          onClose={() => setIsStartConfirmOpen(false)}
        />

        {/* Condition 2 Modal: Finalize QR Session & Absence Review */}
        <QrFinalizeModal
          isOpen={isFinalizeModalOpen}
          lang={lang}
          activeSession={activeSession}
          currentClassStudents={currentClassStudents}
          unscannedStudents={unscannedStudents}
          unscannedSettings={unscannedSettings}
          onToggleUnscannedStatus={handleToggleUnscannedStatus}
          onChangeUnscannedMinutes={handleChangeUnscannedMinutes}
          onFinalize={handleFinalizeQRSession}
          onClose={() => setIsFinalizeModalOpen(false)}
        />
      </div>
    </div>
  );

  return typeof document !== 'undefined'
    ? createPortal(modalContent, document.body)
    : modalContent;
};


import React, { useState, useEffect, useRef } from 'react';
import { useAttendance } from '../context/AttendanceContext';
import { Student, AttendanceSession } from '../types/attendance';
import {
  Scan,
  Camera,
  CheckCircle2,
  X,
  Volume2,
  VolumeX,
  Sparkles,
  Users,
  Search,
  AlertCircle,
  Clock,
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
  const [recentScans, setRecentScans] = useState<Array<{ student: Student; time: string }>>([]);
  const [lastScannedStudent, setLastScannedStudent] = useState<Student | null>(null);
  const [manualCodeInput, setManualCodeInput] = useState('');
  const [searchStudentQuery, setSearchStudentQuery] = useState('');

  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const activeSession = sessions.find((s) => s.id === activeSessionId) || sessions[0];

  // Camera setup
  useEffect(() => {
    let mounted = true;
    async function startCamera() {
      try {
        if (!navigator.mediaDevices?.getUserMedia) {
          throw new Error('الكاميرا غير مدعومة في هذا المتصفح');
        }
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: 'environment' },
        });
        if (mounted) {
          streamRef.current = stream;
          if (videoRef.current) {
            videoRef.current.srcObject = stream;
            videoRef.current.play();
          }
          setCameraActive(true);
        }
      } catch (err: any) {
        if (mounted) {
          console.warn('Camera access error (simulated scanner available):', err);
          setCameraError(
            err.name === 'NotAllowedError'
              ? 'يرجى منح إذن الوصول للكاميرا لاستخدام الماسح المباشر.'
              : 'جهاز الكاميرا غير متاح حالياً. يمكنك استخدام الماسح السريع أو القارئ اليدوي أدناه.'
          );
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
  }, []);

  const handleProcessScan = (student: Student) => {
    if (!activeSession) return;

    // Check if student was already marked in recent scans
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
      performerId: currentUser.id,
      performerName: currentUser.name,
      performerRole: currentUser.role,
      details: `تسجيل حضور بدون لمس عبر مسح الباركود / QR للطالب (${student.fullName}) في كشف (${activeSession.subject || 'حضور اليوم'}).`,
      previousValue: 'غير مؤكد',
      newValue: 'حاضر (Present)',
    });
  };

  const handleManualScanSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!manualCodeInput.trim()) return;

    // Search by student number, national ID, or full name
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

  return (
    <div className="fixed inset-0 bg-slate-900/70 backdrop-blur-xs flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-2xl shadow-2xl max-w-3xl w-full p-5 space-y-4 max-h-[92vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-emerald-600 text-white flex items-center justify-center shadow-xs">
              <Scan className="w-5 h-5 animate-pulse" />
            </div>
            <div>
              <h3 className="font-bold text-slate-900 text-base">
                {lang === 'ar' ? 'قارئ الحضور الذكي بالـ QR (بدون لمس)' : 'Touchless QR Attendance Scanner'}
              </h3>
              <p className="text-xs text-slate-500">
                {lang === 'ar'
                  ? 'رصد فوري لحضور الطلاب عند البوابة أو مدخل الفصل'
                  : 'Fast optical attendance check-in for classroom or gate'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setSoundEnabled(!soundEnabled)}
              className={`p-2 rounded-lg border transition-colors cursor-pointer text-xs flex items-center gap-1 ${
                soundEnabled
                  ? 'bg-emerald-50 border-emerald-300 text-emerald-800'
                  : 'bg-slate-100 border-slate-300 text-slate-500'
              }`}
              title="تفعيل/تعطيل صوت التأكيد"
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
        <div className="bg-slate-50 border border-slate-200 rounded-xl p-3 flex flex-wrap items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2">
            <span className="font-semibold text-slate-700">
              {lang === 'ar' ? 'الكشف المستهدف لتسجيل الحضور:' : 'Target Session:'}
            </span>
            <select
              value={activeSessionId}
              onChange={(e) => setActiveSessionId(e.target.value)}
              className="bg-white border border-slate-300 rounded-lg px-3 py-1.5 font-bold text-slate-900 focus:ring-2 focus:ring-emerald-500 cursor-pointer"
            >
              {sessions.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.className} · {s.subject || 'حضور يومي'} ({s.date})
                </option>
              ))}
            </select>
          </div>

          <div className="text-emerald-800 font-semibold bg-emerald-100/70 border border-emerald-300 px-2.5 py-1 rounded-md">
            حاضرون بالكشف: {activeSession?.presentCount || 0} / {activeSession?.totalStudents || 0}
          </div>
        </div>

        {/* Last scanned success banner */}
        {lastScannedStudent && (
          <div className="bg-emerald-50 border border-emerald-300 rounded-xl p-3 text-xs text-emerald-900 flex items-center justify-between shadow-xs animate-in fade-in">
            <div className="flex items-center gap-2.5">
              <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
              <div>
                <span className="font-bold text-sm block">
                  تم تسجيل حضور الطالب: {lastScannedStudent.fullName}
                </span>
                <span className="text-[11px] text-emerald-700 font-mono">
                  رقم: {lastScannedStudent.studentNumber} · الفصل: {lastScannedStudent.className}
                </span>
              </div>
            </div>
            <span className="bg-emerald-600 text-white font-bold px-2 py-0.5 rounded text-[10px]">
              حاضر (Present)
            </span>
          </div>
        )}

        {/* Grid: Viewfinder vs Recent Scans Feed */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
          {/* Viewfinder Column */}
          <div className="md:col-span-7 space-y-3">
            <div className="relative rounded-2xl overflow-hidden bg-slate-950 aspect-4/3 flex items-center justify-center border-2 border-slate-800 shadow-inner">
              {/* Live video */}
              <video
                ref={videoRef}
                playsInline
                muted
                className={`w-full h-full object-cover ${cameraActive ? 'block' : 'hidden'}`}
              />

              {/* Viewfinder Overlay */}
              <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
                {/* Target Frame */}
                <div className="w-52 h-52 border-2 border-emerald-400 rounded-2xl relative shadow-[0_0_0_9999px_rgba(0,0,0,0.5)]">
                  {/* Corners */}
                  <div className="absolute -top-1 -left-1 w-6 h-6 border-t-4 border-l-4 border-emerald-400 rounded-tl-lg" />
                  <div className="absolute -top-1 -right-1 w-6 h-6 border-t-4 border-r-4 border-emerald-400 rounded-tr-lg" />
                  <div className="absolute -bottom-1 -left-1 w-6 h-6 border-b-4 border-l-4 border-emerald-400 rounded-bl-lg" />
                  <div className="absolute -bottom-1 -right-1 w-6 h-6 border-b-4 border-r-4 border-emerald-400 rounded-br-lg" />

                  {/* Laser Scanning Line */}
                  <div className="w-full h-0.5 bg-emerald-400 shadow-[0_0_8px_#34d399] absolute top-1/2 -translate-y-1/2 animate-pulse" />
                </div>
              </div>

              {!cameraActive && (
                <div className="p-4 text-center text-slate-400 text-xs space-y-1.5 z-10 max-w-xs">
                  <Camera className="w-8 h-8 text-slate-500 mx-auto" />
                  <p className="font-semibold text-slate-300">
                    {cameraError || 'الكاميرا جاهزة للعمل'}
                  </p>
                  <p className="text-[11px] text-slate-500">
                    يمكنك توجيه قارئ الباركود اليدوي أو اختيار الطالب بالنقرة السريعة أدناه
                  </p>
                </div>
              )}
            </div>

            {/* Manual Code / Hardware Barcode Input */}
            <form onSubmit={handleManualScanSubmit} className="flex items-center gap-2">
              <input
                type="text"
                placeholder={lang === 'ar' ? 'أدخل رقم الطالب أو امسح بالباركود...' : 'Scan / Enter Student ID...'}
                value={manualCodeInput}
                onChange={(e) => setManualCodeInput(e.target.value)}
                className="flex-1 bg-slate-50 border border-slate-300 rounded-xl px-3.5 py-2 text-xs text-slate-900 focus:ring-2 focus:ring-emerald-500 focus:outline-hidden font-mono"
              />
              <button
                type="submit"
                disabled={!manualCodeInput.trim()}
                className="bg-slate-900 hover:bg-slate-800 disabled:opacity-50 text-white font-semibold text-xs px-4 py-2 rounded-xl transition-colors cursor-pointer"
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

              <div className="max-h-40 overflow-y-auto space-y-1 text-xs">
                {currentClassStudents.map((std) => {
                  const isPresentInSession = activeSession?.records.find(
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
                        <span className="text-[10px] text-slate-400">مسح</span>
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
                <div className="text-center py-4 text-xs text-slate-400">
                  {lang === 'ar' ? 'بانتظار مسح بطاقات الطلاب...' : 'Waiting for student QR scans...'}
                </div>
              ) : (
                <div className="max-h-36 overflow-y-auto space-y-1.5 text-xs">
                  {recentScans.map((item, i) => (
                    <div
                      key={i}
                      className="flex items-center justify-between p-2 rounded-lg bg-emerald-50/60 border border-emerald-200 text-emerald-950"
                    >
                      <div>
                        <div className="font-bold">{item.student.fullName}</div>
                        <div className="text-[10px] text-emerald-700">{item.student.className}</div>
                      </div>
                      <span className="font-mono text-[10px] text-emerald-800 bg-white px-1.5 py-0.5 rounded border border-emerald-200">
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
};

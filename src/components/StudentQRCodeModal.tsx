import React, { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import QRCode from 'qrcode';
import { Student } from '../types/attendance';
import { useAttendance } from '../context/AttendanceContext';
import {
  QrCode,
  Download,
  Printer,
  X,
  Building,
  CheckCircle2,
  Share2,
  Scan,
} from 'lucide-react';
import { downloadNativePdfFromHtml, printNativePdfFromHtml } from '../utils/pdfExport';

interface StudentQRCodeModalProps {
  student: Student;
  onClose: () => void;
  onScanInSession?: (student: Student) => void;
}

export const StudentQRCodeModal: React.FC<StudentQRCodeModalProps> = ({
  student,
  onClose,
  onScanInSession,
}) => {
  const { currentTenant, schoolProfile, lang } = useAttendance();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const cardRef = useRef<HTMLDivElement>(null);
  const [qrDataUrl, setQrDataUrl] = useState<string>('');

  const schoolId = currentTenant?.id || 'school-1';
  const schoolCode = schoolProfile?.schoolCode || currentTenant?.code || 'ANDALUS-101';
  const schoolName = schoolProfile?.schoolName || currentTenant?.name || 'مدرستي';
  const academicYear = schoolProfile?.academicYear?.hijriYear || currentTenant?.academicYear || '1446-1447 هـ';

  // Structured QR payload that can be parsed by scanners
  const qrPayload = JSON.stringify({
    app: 'SMART_ATTENDANCE',
    schoolId,
    schoolCode,
    studentId: student?.id,
    studentNumber: student?.studentNumber,
    nationalId: student?.nationalId,
    fullName: student?.fullName,
    className: student?.className,
    grade: student?.grade,
  });

  useEffect(() => {
    let isMounted = true;

    async function generateQR() {
      try {
        const url = await QRCode.toDataURL(qrPayload, {
          width: 200,
          margin: 1,
          color: {
            dark: '#0f172a',
            light: '#ffffff',
          },
          errorCorrectionLevel: 'M',
        });
        if (isMounted) {
          setQrDataUrl(url);
        }
      } catch (err) {
        console.error('Error generating QR data URL:', err);
      }

      if (canvasRef.current) {
        try {
          QRCode.toCanvas(
            canvasRef.current,
            qrPayload,
            {
              width: 200,
              margin: 1,
              color: {
                dark: '#0f172a',
                light: '#ffffff',
              },
              errorCorrectionLevel: 'M',
            },
            (error) => {
              if (error) console.error('Error rendering QR to canvas:', error);
            }
          );
        } catch (e) {
          console.error('QRCode.toCanvas exception:', e);
        }
      }
    }

    generateQR();

    return () => {
      isMounted = false;
    };
  }, [qrPayload]);

  // Download high-resolution PNG card
  const handleDownloadCard = () => {
    const canvas = document.createElement('canvas');
    canvas.width = 600;
    canvas.height = 900;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Background gradient
    const grad = ctx.createLinearGradient(0, 0, 0, 900);
    grad.addColorStop(0, '#064e3b');
    grad.addColorStop(0.25, '#047857');
    grad.addColorStop(0.26, '#ffffff');
    grad.addColorStop(1, '#f8fafc');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, 600, 900);

    // Decorative borders
    ctx.strokeStyle = '#047857';
    ctx.lineWidth = 6;
    ctx.strokeRect(15, 15, 570, 870);

    // Header text
    ctx.fillStyle = '#ffffff';
    ctx.textAlign = 'center';
    ctx.font = 'bold 26px Cairo, sans-serif';
    ctx.fillText(schoolName, 300, 70);

    ctx.font = '16px Cairo, sans-serif';
    ctx.fillStyle = '#a7f3d0';
    ctx.fillText('بطاقة الحضور والانضباط المدرسي الذكية', 300, 110);
    ctx.fillText(`${academicYear} · ${student.grade || ''}`, 300, 140);

    // Student Info Section
    ctx.fillStyle = '#0f172a';
    ctx.font = 'bold 28px Cairo, sans-serif';
    ctx.fillText(student.fullName, 300, 270);

    ctx.fillStyle = '#047857';
    ctx.font = 'bold 20px Cairo, sans-serif';
    ctx.fillText(`الفصل: ${student.className}`, 300, 310);

    ctx.fillStyle = '#475569';
    ctx.font = '16px Cairo, sans-serif';
    ctx.fillText(`الرقم المدرسي: ${student.studentNumber} | السجل المدني: ${student.nationalId}`, 300, 345);

    // Draw QR Code onto canvas
    if (canvasRef.current) {
      ctx.drawImage(canvasRef.current, 175, 400, 250, 250);
    }

    // Border around QR
    ctx.strokeStyle = '#cbd5e1';
    ctx.lineWidth = 2;
    ctx.strokeRect(170, 395, 260, 260);

    // Instruction Footer
    ctx.fillStyle = '#0f172a';
    ctx.font = 'bold 18px Cairo, sans-serif';
    ctx.fillText('امسح الباركود عند بوابة الدخول أو بداية الحصة', 300, 710);

    ctx.fillStyle = '#64748b';
    ctx.font = '15px Cairo, sans-serif';
    ctx.fillText(`ولي الأمر: ${student.guardianName} (${student.guardianPhone})`, 300, 760);
    ctx.fillText(`فصيلة الدم: ${student.bloodType || 'O+'}`, 300, 795);

    ctx.fillStyle = '#94a3b8';
    ctx.font = '13px Cairo, sans-serif';
    ctx.fillText('نظام مدرستي حضور الذكي · معتمد رسمياً', 300, 850);

    // Trigger download
    const link = document.createElement('a');
    link.download = `بطاقة_حضور_${student.fullName.replace(/\s+/g, '_')}_${student.studentNumber}.png`;
    link.href = canvas.toDataURL('image/png');
    link.click();
  };

  const handleDownloadVectorPdf = async () => {
    if (cardRef.current) {
      const html = cardRef.current.innerHTML;
      const title = `بطاقة حضور QR - ${student.fullName} (${student.studentNumber})`;
      const filename = `بطاقة_حضور_${student.fullName.replace(/\s+/g, '_')}_${student.studentNumber}.pdf`;
      await downloadNativePdfFromHtml({
        htmlContent: `<div style="direction:rtl; text-align:center; font-family:'Cairo', sans-serif; max-width:400px; margin:0 auto; padding:20px;">${html}</div>`,
        title,
        filename,
      });
    }
  };

  const handlePrint = () => {
    if (cardRef.current) {
      const html = cardRef.current.innerHTML;
      const title = `بطاقة حضور QR - ${student.fullName} (${student.studentNumber})`;
      printNativePdfFromHtml({
        htmlContent: `<div style="direction:rtl; text-align:center; font-family:'Cairo', sans-serif; max-width:400px; margin:0 auto; padding:20px;">${html}</div>`,
        title,
      });
    }
  };

  const modalContent = (
    <div
      className="fixed inset-0 bg-slate-900/70 backdrop-blur-xs flex items-center justify-center p-2 sm:p-4 z-50 overflow-y-auto w-screen h-screen print:p-0 print:bg-white print:static print:block"
      style={{ margin: 0, padding: '0.75rem', left: 0, top: 0, right: 0, bottom: 0 }}
      role="dialog"
      aria-modal="true"
    >
      <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-4 sm:p-6 space-y-4 max-h-[94dvh] overflow-y-auto my-auto print:shadow-none print:p-0 print:border-none print:max-w-none border border-slate-200">
        {/* Modal Header */}
        <div className="flex items-center justify-between border-b border-slate-100 pb-3 print:hidden modal-controls-header">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-emerald-600 text-white flex items-center justify-center">
              <QrCode className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-bold text-slate-900 text-base">
                {lang === 'ar' ? 'بطاقة الحضور السريع بالـ QR' : 'Touchless QR Attendance Card'}
              </h3>
              <p className="text-[11px] text-slate-500">
                {student.fullName} ({student.className})
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 p-1 rounded-lg hover:bg-slate-100 cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Printable Card Preview */}
        <div
          ref={cardRef}
          className="border-2 border-emerald-600 rounded-xl overflow-hidden shadow-md bg-white text-center print:border-emerald-600"
        >
          {/* Top Banner */}
          <div className="bg-gradient-to-r from-emerald-800 to-emerald-700 text-white p-3.5 space-y-1">
            <div className="flex items-center justify-center gap-1.5 text-xs text-emerald-200">
              <Building className="w-3.5 h-3.5" />
              <span>{schoolName}</span>
            </div>
            <h4 className="font-bold text-sm tracking-wide">
              {lang === 'ar' ? 'بطاقة الحضور والانضباط المدرسي' : 'Student Attendance ID Badge'}
            </h4>
            <span className="text-[10px] text-emerald-100/90 block">
              {academicYear} · {student.grade || ''}
            </span>
          </div>

          {/* Student Info & QR */}
          <div className="p-4 space-y-3">
            <div>
              <h5 className="font-bold text-slate-900 text-base">{student.fullName}</h5>
              <div className="flex items-center justify-center gap-2 text-xs font-semibold text-emerald-700 mt-0.5">
                <span>الفصل: {student.className}</span>
                <span>·</span>
                <span className="font-mono">رقم الطالب: {student.studentNumber}</span>
              </div>
              <div className="text-[11px] font-mono text-slate-500 mt-0.5">
                السجل المدني: {student.nationalId}
              </div>
            </div>

            {/* QR Code Container */}
            <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 inline-block mx-auto shadow-2xs">
              {qrDataUrl && (
                <img src={qrDataUrl} alt="QR Code" className="w-44 h-44 mx-auto block" />
              )}
              <canvas ref={canvasRef} className={qrDataUrl ? 'hidden' : 'mx-auto block'} />
              <div className="text-[10px] text-slate-500 font-medium mt-1">
                {lang === 'ar' ? 'مسح سريع لتسجيل الحضور بدون لمس' : 'Scan for touchless check-in'}
              </div>
            </div>

            {/* Emergency & Details Footer */}
            <div className="border-t border-slate-100 pt-2.5 grid grid-cols-2 gap-2 text-[11px] text-slate-600">
              <div>
                <span className="text-slate-400 block text-[10px]">ولي الأمر:</span>
                <span className="font-semibold">{student.guardianName}</span>
              </div>
              <div>
                <span className="text-slate-400 block text-[10px]">هاتف الطوارئ:</span>
                <span className="font-mono font-semibold" dir="ltr">{student.guardianPhone}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Action Controls */}
        <div className="space-y-2 pt-1 text-xs print:hidden">
          <div className="grid grid-cols-3 gap-2">
            <button
              onClick={handleDownloadVectorPdf}
              className="flex items-center justify-center gap-1 bg-emerald-700 hover:bg-emerald-800 text-white font-semibold py-2.5 px-2 rounded-lg transition-colors cursor-pointer shadow-xs text-[11px]"
              title="تنزيل كملف PDF رسمي عالي الدقة"
            >
              <Download className="w-3.5 h-3.5" />
              <span>{lang === 'ar' ? 'تنزيل PDF أصلي' : 'Vector PDF'}</span>
            </button>

            <button
              onClick={handleDownloadCard}
              className="flex items-center justify-center gap-1 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold py-2.5 px-2 rounded-lg transition-colors cursor-pointer shadow-xs text-[11px]"
            >
              <Download className="w-3.5 h-3.5" />
              <span>{lang === 'ar' ? 'صورة (PNG)' : 'PNG'}</span>
            </button>

            <button
              onClick={handlePrint}
              className="flex items-center justify-center gap-1 bg-slate-900 hover:bg-slate-800 text-white font-semibold py-2.5 px-2 rounded-lg transition-colors cursor-pointer shadow-xs text-[11px]"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>{lang === 'ar' ? 'طباعة مباشرة' : 'Print'}</span>
            </button>
          </div>

          {onScanInSession && (
            <button
              onClick={() => {
                onScanInSession(student);
                onClose();
              }}
              className="w-full flex items-center justify-center gap-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-300 font-bold py-2 px-3 rounded-lg transition-colors cursor-pointer"
            >
              <Scan className="w-4 h-4 text-emerald-600" />
              <span>{lang === 'ar' ? 'تسجيل حضور هذا الطالب فوراً (محاكاة المسح)' : 'Simulate Scan Now'}</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );

  return typeof document !== 'undefined'
    ? createPortal(modalContent, document.body)
    : modalContent;
};

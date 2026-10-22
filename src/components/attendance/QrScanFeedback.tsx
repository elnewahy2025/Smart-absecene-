import React from 'react';
import { AlertTriangle, CheckCircle2, X } from 'lucide-react';
import type { Student } from '../../types/attendance';

interface QrScanFeedbackProps {
  lang: 'ar' | 'en';
  duplicateWarning: { student: Student; time: string } | null;
  sessionBanner: string | null;
  lastScannedStudent: Student | null;
  scannedTimestamps: Record<string, string>;
  onDismissDuplicate: () => void;
  onDismissSessionBanner: () => void;
}

export const QrScanFeedback: React.FC<QrScanFeedbackProps> = ({
  lang,
  duplicateWarning,
  sessionBanner,
  lastScannedStudent,
  scannedTimestamps,
  onDismissDuplicate,
  onDismissSessionBanner,
}) => (
  <>
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
        onClick={onDismissDuplicate}
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
        onClick={onDismissSessionBanner}
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
  </>
);

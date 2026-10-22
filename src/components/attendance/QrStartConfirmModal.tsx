import React from 'react';
import { AlertTriangle, Info, Sparkles } from 'lucide-react';
import { AttendanceSession } from '../../types/attendance';

interface QrStartConfirmModalProps {
  isOpen: boolean;
  lang: 'ar' | 'en';
  activeSession?: AttendanceSession;
  onConfirm: () => void;
  onClose: () => void;
}

export const QrStartConfirmModal: React.FC<QrStartConfirmModalProps> = ({
  isOpen,
  lang,
  activeSession,
  onConfirm,
  onClose,
}) => {
  if (!isOpen) return null;

  return (
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
          onClick={() => onClose()}
          className="px-4 py-2 text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors cursor-pointer"
        >
          {lang === 'ar' ? 'إلغاء والعودة' : 'Cancel'}
        </button>
        <button
          type="button"
          onClick={onConfirm}
          className="px-4 py-2 text-xs font-bold bg-amber-600 hover:bg-amber-500 text-white rounded-xl shadow-md transition-colors cursor-pointer flex items-center gap-1.5"
        >
          <Sparkles className="w-3.5 h-3.5" />
          <span>{lang === 'ar' ? 'تأكيد وبدء مسح الـ QR' : 'Confirm & Start Scan'}</span>
        </button>
      </div>
    </div>
  </div>
  );
};

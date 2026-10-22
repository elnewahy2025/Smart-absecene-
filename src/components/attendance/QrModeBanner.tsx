import React from 'react';
import { CheckCircle2, RotateCcw, Sparkles, UserCheck } from 'lucide-react';

interface QrModeBannerProps {
  lang: 'ar' | 'en';
  qrModeActive: boolean;
  unscannedCount: number;
  onSwitchToQr: () => void;
  onOpenFinalize: () => void;
  onReturnManual: () => void;
}

export const QrModeBanner: React.FC<QrModeBannerProps> = ({
  lang,
  qrModeActive,
  unscannedCount,
  onSwitchToQr,
  onOpenFinalize,
  onReturnManual,
}) => {
  return (
    !qrModeActive ? (
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
            onClick={() => onSwitchToQr()}
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
                {lang === 'ar' ? `بانتظار المسح: ${unscannedCount}` : `Pending: ${unscannedCount}`}
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
            onClick={onOpenFinalize}
            className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl shadow-xs transition-colors flex items-center gap-1.5 cursor-pointer text-xs"
            title={lang === 'ar' ? 'إنهاء جلسة المسح، مراجعة المتأخرين، واعتماد الغياب النهائي' : 'End session, review late arrivals, and finalize absences'}
          >
            <UserCheck className="w-3.5 h-3.5" />
            <span>{lang === 'ar' ? `إنهاء الجلسة واعتماد الغياب (${unscannedCount})` : 'Finalize QR Session'}</span>
          </button>
    
          <button
            type="button"
            onClick={onReturnManual}
            className="px-2.5 py-2 bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 border border-slate-300 dark:border-slate-700 font-semibold rounded-xl transition-colors flex items-center gap-1 cursor-pointer text-xs"
            title={lang === 'ar' ? 'إلغاء وضع الـ QR والعودة للتحضير اليدوي' : 'Return to manual attendance'}
          >
            <RotateCcw className="w-3.5 h-3.5 text-slate-500" />
            <span>{lang === 'ar' ? 'التحضير اليدوي' : 'Manual Mode'}</span>
          </button>
        </div>
      </div>
    )
  );
};

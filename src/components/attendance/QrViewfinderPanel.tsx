import React from 'react';
import { Camera, RefreshCw, Upload } from 'lucide-react';

interface QrViewfinderPanelProps {
  lang: 'ar' | 'en';
  cameraActive: boolean;
  cameraError: string | null;
  isProcessingPhoto: boolean;
  videoRef: React.RefObject<HTMLVideoElement>;
  cameraInputRef: React.RefObject<HTMLInputElement>;
  fileUploadInputRef: React.RefObject<HTMLInputElement>;
  manualCodeInput: string;
  onManualCodeChange: (value: string) => void;
  onManualSubmit: (e: React.FormEvent) => void;
}

export const QrViewfinderPanel: React.FC<QrViewfinderPanelProps> = ({
  lang,
  cameraActive,
  cameraError,
  isProcessingPhoto,
  videoRef,
  cameraInputRef,
  fileUploadInputRef,
  manualCodeInput,
  onManualCodeChange,
  onManualSubmit,
}) => (
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
      <form onSubmit={onManualSubmit} className="flex items-center gap-1.5">
        <input
          type="text"
          placeholder={lang === 'ar' ? 'أدخل رقم الطالب أو امسح بالباركود...' : 'Scan / Enter Student ID...'}
          value={manualCodeInput}
          onChange={(e) => onManualCodeChange(e.target.value)}
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
);

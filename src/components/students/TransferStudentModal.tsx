import React, { useRef, useState } from 'react';
import { Student } from '../../types/attendance';
import { ArrowRightLeft, X, AlertCircle, Check } from 'lucide-react';
import { useModalAccessibility } from '../../hooks/useModalAccessibility';

interface TransferStudentModalProps {
  isOpen: boolean;
  student: Student | null;
  onClose: () => void;
  onConfirmTransfer: (studentId: string, details: { destinationSchool: string; reason?: string }) => Promise<{ success: boolean; message: string }>;
  lang: 'ar' | 'en';
}

export const TransferStudentModal: React.FC<TransferStudentModalProps> = ({
  isOpen,
  student,
  onClose,
  onConfirmTransfer,
  lang,
}) => {
  const isAr = lang === 'ar';
  const [destinationSchool, setDestinationSchool] = useState('');
  const [reason, setReason] = useState('انتقال سكن ولي الأمر إلى حي/مدينة أخرى');
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const dialogRef = useRef<HTMLDivElement>(null);
  useModalAccessibility({ isOpen, onClose, containerRef: dialogRef });

  if (!isOpen || !student) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmitting) return;
    if (!destinationSchool.trim()) {
      setError(isAr ? 'يرجى إدخال اسم المدرسة المنقول إليها الطالب' : 'Please provide destination school name');
      return;
    }

    setError(null);
    setIsSubmitting(true);
    try {
      const result = await onConfirmTransfer(student.id, {
        destinationSchool: destinationSchool.trim(),
        reason: reason.trim(),
      });
      if (!result.success) {
        setError(result.message);
        return;
      }
      onClose();
    } catch (submitError) {
      setError(
        submitError instanceof Error
          ? submitError.message
          : isAr
            ? 'تعذّر نقل الطالب. حاول مجدداً.'
            : 'Could not transfer the student. Please try again.'
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div ref={dialogRef} tabIndex={-1} role="dialog" aria-modal="true" aria-label="Transfer student" className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-xl border border-slate-100">
        <div className="flex items-center justify-between pb-4 border-b border-slate-100">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-amber-50 text-amber-600">
              <ArrowRightLeft className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-slate-900 text-base">
                {isAr ? 'نقل طالب إلى مدرسة أخرى' : 'Transfer Student Out'}
              </h3>
              <p className="text-xs text-slate-500">
                {isAr ? 'إجراء رسمي لنقل قيد الطالب إلى مدرسة جديدة' : 'Official student transfer procedure'}
              </p>
            </div>
          </div>
          <button onClick={onClose} className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Selected Student Information Banner */}
        <div className="my-4 p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-1">
          <div className="font-bold text-slate-900 text-xs">{student.fullName}</div>
          <div className="flex items-center gap-3 text-[11px] text-slate-500 font-mono">
            <span>{isAr ? 'السجل المدني:' : 'National ID:'} {student.nationalId}</span>
            <span>·</span>
            <span>{isAr ? 'الفصل:' : 'Class:'} {student.className}</span>
          </div>
        </div>

        {/* Warning Notice about Hiding from Daily Attendance */}
        <div className="p-3 bg-amber-50 border border-amber-200/80 rounded-xl text-amber-800 text-xs flex items-start gap-2">
          <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-amber-600" />
          <p className="leading-relaxed">
            {isAr
              ? 'سيتم إخفاء هذا الطالب تلقائياً من كشوف الحضور الصباحية والحصص اليومية، ويبقى في أرشيف المنقولين حتى يتم حذفه نهائياً أو استعادته.'
              : 'This student will be hidden from daily attendance roll-calls, and will remain in the transferred archive until deleted permanently.'}
          </p>
        </div>

        {error && (
          <div className="mt-3 p-2.5 bg-red-50 border border-red-200 text-red-700 text-xs rounded-xl font-medium">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="mt-4 space-y-3.5 text-xs">
          <div className="space-y-1">
            <label className="font-semibold text-slate-700">
              {isAr ? 'اسم المدرسة المنقول إليها *' : 'Destination School Name *'}
            </label>
            <input
              type="text"
              required
              value={destinationSchool}
              onChange={(e) => setDestinationSchool(e.target.value)}
              placeholder={isAr ? 'مثال: ثانوية الملك فهد، مدارس الرواد الأهلية...' : 'e.g. King Fahd High School'}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-800 focus:bg-white focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 transition-all text-xs"
            />
          </div>

          <div className="space-y-1">
            <label className="font-semibold text-slate-700">
              {isAr ? 'سبب النقل' : 'Transfer Reason'}
            </label>
            <select
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-800 text-xs focus:bg-white"
            >
              <option value="انتقال سكن ولي الأمر إلى حي/مدينة أخرى">{isAr ? 'انتقال سكن ولي الأمر' : 'Relocation'}</option>
              <option value="نقل عمل ولي الأمر أو ابتعاث">{isAr ? 'نقل عمل ولي الأمر أو ابتعاث' : 'Guardian Work Transfer'}</option>
              <option value="التحاق بمدارس موهبة / مسار تخصصي">{isAr ? 'التحاق بمدارس موهبة أو مسار متخصص' : 'Specialized / Gifted School'}</option>
              <option value="رغبة الأسرة بطلب رسمي">{isAr ? 'رغبة الأسرة بطلب رسمي' : 'Family Request'}</option>
            </select>
          </div>

          <div className="flex items-center justify-end gap-2.5 pt-4 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border border-slate-200 text-slate-600 rounded-xl hover:bg-slate-50 font-medium text-xs cursor-pointer"
            >
              {isAr ? 'إلغاء' : 'Cancel'}
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-5 py-2 bg-amber-600 hover:bg-amber-700 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-xl font-bold text-xs shadow-sm flex items-center gap-1.5 cursor-pointer"
            >
              <Check className="w-3.5 h-3.5" />
              <span>
                {isSubmitting
                  ? isAr
                    ? 'جارٍ النقل...'
                    : 'Transferring...'
                  : isAr
                    ? 'تأكيد النقل وإخفاء الطالب'
                    : 'Confirm Transfer'}
              </span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

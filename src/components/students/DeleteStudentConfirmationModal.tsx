import React, { useRef } from 'react';
import { Student } from '../../types/attendance';
import { Trash2, AlertTriangle, X } from 'lucide-react';
import { useModalAccessibility } from '../../hooks/useModalAccessibility';

interface DeleteStudentConfirmationModalProps {
  isOpen: boolean;
  student: Student | null;
  onClose: () => void;
  onConfirmDelete: (studentId: string) => void;
  lang: 'ar' | 'en';
}

export const DeleteStudentConfirmationModal: React.FC<DeleteStudentConfirmationModalProps> = ({
  isOpen,
  student,
  onClose,
  onConfirmDelete,
  lang,
}) => {
  const isAr = lang === 'ar';
  const dialogRef = useRef<HTMLDivElement>(null);
  useModalAccessibility({ isOpen, onClose, containerRef: dialogRef });
  if (!isOpen || !student) return null;

  return (
    <div ref={dialogRef} tabIndex={-1} role="dialog" aria-modal="true" aria-label="Confirm student deletion" className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl max-w-sm w-full p-6 shadow-xl border border-slate-100">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-red-50 text-red-600">
              <Trash2 className="w-5 h-5" />
            </div>
            <h3 className="font-bold text-slate-900 text-sm">
              {isAr ? 'تأكيد الحذف النهائي للسجل' : 'Confirm Permanent Deletion'}
            </h3>
          </div>
          <button onClick={onClose} className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="my-4 space-y-3">
          <div className="p-3 bg-red-50/70 border border-red-200/80 rounded-xl text-xs text-red-900 flex items-start gap-2.5">
            <AlertTriangle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
            <div className="space-y-1">
              <p className="font-bold">{isAr ? 'تحذير: هذا الإجراء نهائي وغير قابل للتراجع!' : 'Warning: This action is permanent!'}</p>
              <p className="text-[11px] text-red-700 leading-relaxed">
                {isAr
                  ? `سيتم حذف سجل الطالب (${student.fullName}) ذو السجل المدني (${student.nationalId}) وجميع بيانات قيده من قاعدة البيانات المدرسية.`
                  : `Student record (${student.fullName}) will be permanently wiped.`}
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100 text-xs">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 border border-slate-200 text-slate-600 rounded-xl hover:bg-slate-50 font-medium cursor-pointer"
          >
            {isAr ? 'إلغاء' : 'Cancel'}
          </button>
          <button
            type="button"
            onClick={() => {
              onConfirmDelete(student.id);
              onClose();
            }}
            className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-xl font-bold shadow-sm flex items-center gap-1.5 cursor-pointer"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>{isAr ? 'نعم، حذف نهائي' : 'Yes, Delete'}</span>
          </button>
        </div>
      </div>
    </div>
  );
};

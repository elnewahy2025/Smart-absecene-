import React, { useRef } from 'react';
import { createPortal } from 'react-dom';
import { Student, AttendanceStatus } from '../../types/attendance';
import { AlertTriangle, CheckCircle2, X } from 'lucide-react';
import { useModalAccessibility } from '../../hooks/useModalAccessibility';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  targetStatus: AttendanceStatus;
  selectedStudents: Student[];
  sessionTitle: string;
  lang: 'ar' | 'en';
}

export const BulkEditConfirmationModal: React.FC<Props> = ({
  isOpen,
  onClose,
  onConfirm,
  targetStatus,
  selectedStudents,
  sessionTitle,
  lang,
}) => {
  const dialogRef = useRef<HTMLDivElement>(null);
  useModalAccessibility({ isOpen, onClose, containerRef: dialogRef });
  if (!isOpen) return null;

  const isAbsentAction = targetStatus === 'absent';
  const count = selectedStudents.length;

  const statusLabel =
    targetStatus === 'absent'
      ? (lang === 'ar' ? 'غائب' : 'Absent')
      : targetStatus === 'present'
      ? (lang === 'ar' ? 'حاضر' : 'Present')
      : (lang === 'ar' ? 'متأخر' : 'Late');

  const content = (
    <div
      className="fixed inset-0 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-3 z-50 animate-in fade-in duration-150"
      ref={dialogRef}
      tabIndex={-1}
      role="dialog"
      aria-modal="true"
    >
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 max-w-md w-full overflow-hidden text-right">
        {/* Header */}
        <div className={`p-4 border-b flex items-center justify-between ${
          isAbsentAction ? 'bg-rose-50 border-rose-100 text-rose-900' : 'bg-emerald-50 border-emerald-100 text-emerald-900'
        }`}>
          <div className="flex items-center gap-2">
            <div className={`w-8 h-8 rounded-lg flex items-center justify-center font-bold text-white ${
              isAbsentAction ? 'bg-rose-600' : 'bg-emerald-600'
            }`}>
              <AlertTriangle className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-bold text-sm">
                {lang === 'ar' ? 'تأكيد التعديل الجماعي لحالة الحضور' : 'Confirm Bulk Status Update'}
              </h3>
              <p className="text-[11px] opacity-80">
                {sessionTitle}
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

        {/* Body */}
        <div className="p-4 space-y-3 text-xs text-slate-700">
          <p className="leading-relaxed">
            {lang === 'ar' ? (
              <>
                أنت على وشك تعيين حالة <strong>{count}</strong> طالب/طلاب دفعة واحدة كـ{' '}
                <span className={`font-bold px-1.5 py-0.5 rounded ${
                  isAbsentAction ? 'bg-rose-100 text-rose-800' : 'bg-emerald-100 text-emerald-800'
                }`}>
                  {statusLabel}
                </span>
                . هل أنت متأكد من المتابعة وتطبيق هذا الإجراء؟
              </>
            ) : (
              <>
                You are about to bulk mark <strong>{count}</strong> students as{' '}
                <span className={`font-bold px-1.5 py-0.5 rounded ${
                  isAbsentAction ? 'bg-rose-100 text-rose-800' : 'bg-emerald-100 text-emerald-800'
                }`}>
                  {statusLabel}
                </span>
                . Are you sure you want to proceed?
              </>
            )}
          </p>

          {/* Student preview list */}
          <div className="border border-slate-200 rounded-xl bg-slate-50/70 p-2.5 max-h-44 overflow-y-auto space-y-1.5">
            <div className="flex items-center justify-between text-[11px] font-bold text-slate-500 pb-1 border-b border-slate-200">
              <span>قائمة الطلاب المحددين ({count}):</span>
              <span>رقم الطالب</span>
            </div>
            {selectedStudents.map((s, idx) => (
              <div key={s.id} className="flex items-center justify-between text-slate-800 hover:bg-slate-100/70 px-1.5 py-1 rounded">
                <span className="font-medium truncate max-w-[220px]">
                  {idx + 1}. {s.fullName}
                </span>
                <span className="font-mono text-slate-500 text-[10px]">{s.studentNumber}</span>
              </div>
            ))}
          </div>

          {isAbsentAction && (
            <div className="bg-amber-50 border border-amber-200 rounded-lg p-2.5 text-amber-800 text-[11px] flex items-start gap-1.5">
              <AlertTriangle className="w-3.5 h-3.5 text-amber-600 shrink-0 mt-0.5" />
              <span>
                {lang === 'ar'
                  ? 'ملاحظة: سيتم احتساب هذا الغياب ضمن سجل المواظبة اليومي ورصده في نظام الإنذارات وإشعارات أولياء الأمور عند اعتماد الكشف.'
                  : 'Notice: This absence will be recorded in attendance records and trigger warnings upon submission.'}
              </span>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-3 bg-slate-50 border-t border-slate-200 flex items-center justify-end gap-2">
          <button
            type="button"
            onClick={onClose}
            className="px-3.5 py-2 rounded-lg text-xs font-semibold text-slate-600 hover:bg-slate-200 cursor-pointer transition-colors"
          >
            {lang === 'ar' ? 'إلغاء التعديل' : 'Cancel'}
          </button>
          <button
            type="button"
            onClick={onConfirm}
            className={`px-4 py-2 rounded-lg text-xs font-bold text-white flex items-center gap-1.5 cursor-pointer shadow-xs transition-colors ${
              isAbsentAction
                ? 'bg-rose-600 hover:bg-rose-700'
                : 'bg-emerald-600 hover:bg-emerald-700'
            }`}
          >
            <CheckCircle2 className="w-4 h-4" />
            <span>
              {lang === 'ar' ? `تأكيد تعيين (${count}) كـ ${statusLabel}` : `Confirm (${count}) as ${statusLabel}`}
            </span>
          </button>
        </div>
      </div>
    </div>
  );

  return typeof document !== 'undefined' ? createPortal(content, document.body) : content;
};

import React from 'react';
import { Calendar, FileCheck2 } from 'lucide-react';
import type { AbsenceLateRecordData } from './parentRecordDetailTypes';

interface AbsenceLateRecordDetailsProps {
  data: AbsenceLateRecordData;
  studentId?: string;
  onClose: () => void;
  onOpenExcuseForm?: (studentId: string, date: string) => void;
}

export const AbsenceLateRecordDetails: React.FC<AbsenceLateRecordDetailsProps> = ({data, studentId, onClose, onOpenExcuseForm}) => {
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        <div className="bg-slate-50 p-3 rounded-xl border border-slate-100">
          <span className="text-[11px] text-slate-500 block mb-1">تاريخ اليوم</span>
          <span className="font-bold text-slate-800 flex items-center gap-1.5">
            <Calendar className="w-3.5 h-3.5 text-slate-400" />
            {data.date}
          </span>
        </div>
        <div className="bg-slate-50 p-3 rounded-xl border border-slate-100">
          <span className="text-[11px] text-slate-500 block mb-1">الحصة / المادة</span>
          <span className="font-bold text-slate-800">
            {data.subject ||
              (data.sessionType === 'daily'
                ? 'حضور يومي شامل'
                : `الحصة ${data.periodNumber || 1}`)}
          </span>
        </div>
        <div className="bg-slate-50 p-3 rounded-xl border border-slate-100">
          <span className="text-[11px] text-slate-500 block mb-1">الفصل الدراسي</span>
          <span className="font-bold text-slate-800">{data.className}</span>
        </div>
      </div>

      <div className="bg-slate-50 p-4 rounded-xl border border-slate-100 space-y-2">
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold text-slate-700">حالة القيد المسجلة:</span>
          <span
            className={`px-3 py-1 rounded-full text-xs font-bold ${
              data.status === 'absent'
                ? 'bg-rose-100 text-rose-800'
                : data.status === 'late'
                ? 'bg-amber-100 text-amber-800'
                : data.status === 'excused_absence'
                ? 'bg-teal-100 text-teal-800'
                : 'bg-emerald-100 text-emerald-800'
            }`}
          >
            {data.status === 'absent'
              ? 'غياب غير مبرر'
              : data.status === 'late'
              ? `تأخر (${data.minutesLate || 15} دقيقة)`
              : data.status === 'excused_absence'
              ? 'غياب بعذر رسمي مقبول'
              : 'حاضر'}
          </span>
        </div>
        {data.note && (
          <div className="mt-2 text-xs bg-white p-3 rounded-lg border border-slate-200 text-slate-700 leading-relaxed">
            <span className="font-semibold text-slate-900 block mb-0.5">
              ملاحظة المعلم / الراصد:
            </span>
            {data.note}
          </div>
        )}
      </div>

      {/* Linked Justification info or action */}
      {data.justification ? (
        <div className="bg-teal-50/70 border border-teal-200 rounded-xl p-4 space-y-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <FileCheck2 className="w-4 h-4 text-teal-600" />
              <span className="font-bold text-teal-950 text-xs">
                تم تقديم عذر لهذا الغياب
              </span>
            </div>
            <span
              className={`text-xs px-2.5 py-0.5 rounded-full font-bold ${
                data.justification.status === 'approved'
                  ? 'bg-emerald-100 text-emerald-800'
                  : data.justification.status === 'rejected'
                  ? 'bg-rose-100 text-rose-800'
                  : 'bg-amber-100 text-amber-800'
              }`}
            >
              {data.justification.status === 'approved'
                ? 'معتمد ✅'
                : data.justification.status === 'rejected'
                ? 'مرفوض ❌'
                : 'قيد المراجعة ⏳'}
            </span>
          </div>
          <p className="text-xs text-teal-900 leading-relaxed">
            {data.justification.guardianExplanation}
          </p>
        </div>
      ) : (
        data.status === 'absent' && (
          <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="space-y-0.5">
              <span className="font-bold text-amber-900 text-xs block">
                لم يتم تقديم عذر طبي بعد لهذا الغياب
              </span>
              <p className="text-[11px] text-amber-800">
                يمكنكم رفع التقرير الطبي أو تبرير الغياب لتقوم إدارة المدرسة بمراجعته واعتماده.
              </p>
            </div>
            {onOpenExcuseForm && (
              <button
                onClick={() => {
                  onClose();
                  onOpenExcuseForm(studentId || '', data.date);
                }}
                className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs px-4 py-2 rounded-lg transition-colors shrink-0 shadow-xs cursor-pointer flex items-center justify-center gap-1.5"
              >
                <FileCheck2 className="w-4 h-4" />
                <span>تقديم عذر الآن</span>
              </button>
            )}
          </div>
        )
      )}
    </div>
  );
};

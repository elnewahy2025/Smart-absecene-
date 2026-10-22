import React from 'react';
import { Calendar, Clock, Sparkles } from 'lucide-react';
import type { JustificationRecordData } from './parentRecordDetailTypes';

interface JustificationRecordDetailsProps {
  data: JustificationRecordData;
}

export const JustificationRecordDetails: React.FC<JustificationRecordDetailsProps> = ({data}) => {
  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2 p-3 bg-slate-50 rounded-xl border border-slate-100">
        <div>
          <span className="text-[11px] text-slate-500 block mb-0.5">نوع العذر والتبرير</span>
          <h4 className="font-bold text-slate-900 text-sm">
            {data.reasonType === 'medical'
              ? 'تقرير / إجازة طبية مرضية'
              : data.reasonType === 'family'
              ? 'ظرف أسري طارئ'
              : data.reasonType === 'travel'
              ? 'سفر واضطرار'
              : 'عذر آخر'}
          </h4>
        </div>
        <span
          className={`px-3 py-1 rounded-full text-xs font-bold ${
            data.status === 'approved'
              ? 'bg-emerald-100 text-emerald-800 border border-emerald-200'
              : data.status === 'rejected'
              ? 'bg-rose-100 text-rose-800 border border-rose-200'
              : 'bg-amber-100 text-amber-800 border border-amber-200'
          }`}
        >
          {data.status === 'approved'
            ? 'معتمد ومقبول رسمياً ✅'
            : data.status === 'rejected'
            ? 'عذر مرفوض ❌'
            : 'قيد المراجعة والتدقيق ⏳'}
        </span>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        <div className="bg-slate-50 p-3 rounded-xl border border-slate-100">
          <span className="text-[11px] text-slate-500 block mb-1">تاريخ الغياب</span>
          <span className="font-bold text-slate-800 flex items-center gap-1.5">
            <Calendar className="w-3.5 h-3.5 text-slate-400" />
            {data.absenceDate}
          </span>
        </div>
        <div className="bg-slate-50 p-3 rounded-xl border border-slate-100">
          <span className="text-[11px] text-slate-500 block mb-1">تاريخ التقديم</span>
          <span className="font-bold text-slate-800 flex items-center gap-1.5">
            <Clock className="w-3.5 h-3.5 text-slate-400" />
            {new Date(data.submittedAt).toLocaleDateString('ar-SA')}
          </span>
        </div>
        <div className="bg-slate-50 p-3 rounded-xl border border-slate-100">
          <span className="text-[11px] text-slate-500 block mb-1">المرفق المسجل</span>
          <span className="font-bold text-slate-800 truncate block">
            {data.attachmentName || 'لا يوجد ملف مرفق'}
          </span>
        </div>
      </div>

      <div className="bg-white p-4 rounded-xl border border-slate-200 space-y-1.5">
        <span className="font-bold text-xs text-slate-900 block">شرح وتوضيح ولي الأمر:</span>
        <p className="text-slate-700 leading-relaxed text-xs sm:text-sm">
          {data.guardianExplanation}
        </p>
      </div>

      {/* AI Analysis Summary if present */}
      {data.aiAnalysis && (
        <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 space-y-3">
          <div className="flex items-center justify-between border-b border-slate-200/60 pb-2">
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-emerald-600" />
              <span className="font-bold text-xs text-slate-900">
                نتيجة تدقيق الذكاء الاصطناعي (Gemini Medical Audit)
              </span>
            </div>
            {data.aiAnalysis.integrityScore && (
              <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800">
                الموثوقية: {data.aiAnalysis.integrityScore}%
              </span>
            )}
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
            {data.aiAnalysis.issuerName && (
              <div>
                <span className="text-slate-500 block text-[11px]">الجهة المصدرة:</span>
                <span className="font-semibold text-slate-800">
                  {data.aiAnalysis.issuerName}
                </span>
              </div>
            )}
            {data.aiAnalysis.physicianName && (
              <div>
                <span className="text-slate-500 block text-[11px]">الطبيب الممارس:</span>
                <span className="font-semibold text-slate-800">
                  {data.aiAnalysis.physicianName}
                </span>
              </div>
            )}
            {data.aiAnalysis.reasonOrDiagnosis && (
              <div className="sm:col-span-2">
                <span className="text-slate-500 block text-[11px]">التشخيص / الراحة:</span>
                <span className="font-semibold text-slate-800">
                  {data.aiAnalysis.reasonOrDiagnosis}
                </span>
              </div>
            )}
          </div>
        </div>
      )}

      {/* School Reviewer info */}
      {data.reviewedBy && (
        <div className="bg-emerald-50/70 border border-emerald-200 rounded-xl p-3.5 space-y-1 text-xs">
          <div className="flex items-center justify-between font-semibold text-emerald-950">
            <span>المعتمد: {data.reviewedBy}</span>
            <span>
              {data.reviewedAt &&
                new Date(data.reviewedAt).toLocaleDateString('ar-SA')}
            </span>
          </div>
          {data.reviewerNotes && (
            <p className="text-emerald-900 leading-relaxed pt-1">
              {data.reviewerNotes}
            </p>
          )}
        </div>
      )}
    </div>
  );
};

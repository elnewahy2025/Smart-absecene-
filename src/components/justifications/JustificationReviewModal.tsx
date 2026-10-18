import React, { useRef } from 'react';
import { Justification } from '../../types/attendance';
import {
  ShieldCheck,
  Sparkles,
  RotateCcw,
  Loader2,
  AlertCircle,
  FileText,
  Image as ImageIcon,
  ShieldAlert,
  FileWarning,
  CheckCircle,
  XCircle,
} from 'lucide-react';
import { useModalAccessibility } from '../../hooks/useModalAccessibility';

export interface JustificationReviewModalProps {
  justification: Justification;
  isParent: boolean;
  canReviewJustifications: boolean;
  currentUserRole: string;
  lang: 'ar' | 'en';
  reviewerNotes: string;
  setReviewerNotes: (notes: string) => void;
  isReanalyzing: boolean;
  reanalysisError: string | null;
  onClose: () => void;
  onReanalyzeWithAI: (just: Justification) => void;
  onApprove: (id: string) => void;
  onReject: (id: string) => void;
}

export const JustificationReviewModal: React.FC<JustificationReviewModalProps> = ({
  justification,
  isParent,
  canReviewJustifications,
  currentUserRole,
  lang,
  reviewerNotes,
  setReviewerNotes,
  isReanalyzing,
  reanalysisError,
  onClose,
  onReanalyzeWithAI,
  onApprove,
  onReject,
}) => {
  const dialogRef = useRef<HTMLDivElement>(null);
  useModalAccessibility({ isOpen: true, onClose, containerRef: dialogRef });
  return (
    <div ref={dialogRef} tabIndex={-1} role="dialog" aria-modal="true" aria-label="Justification review" className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-5 z-50 overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full p-5 sm:p-6 space-y-4 max-h-[92vh] flex flex-col animate-in fade-in zoom-in-95 duration-150">
        {/* Modal Header */}
        <div className="flex items-center justify-between border-b border-slate-200 pb-3 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-slate-900 text-white flex items-center justify-center shrink-0">
              <ShieldCheck className="w-5 h-5 text-emerald-400" />
            </div>
            <div>
              <h3 className="font-bold text-slate-900 text-base">
                {isParent
                  ? lang === 'ar'
                    ? 'تفاصيل عذر الغياب وقرار الاعتماد المدرسي'
                    : 'Excuse Details & School Decision'
                  : lang === 'ar'
                  ? 'أداة التحقق الذكي واتخاذ قرار عذر الغياب'
                  : 'AI Verification & Excuse Review Decision'}
              </h3>
              <div className="flex items-center gap-2 text-xs text-slate-500 mt-0.5">
                <span>
                  الطالب: <strong className="text-slate-800">{justification.studentName}</strong>
                </span>
                <span>•</span>
                <span>الفصل: {justification.className}</span>
                <span>•</span>
                <span>
                  تاريخ الغياب:{' '}
                  <strong className="font-mono text-slate-800">{justification.absenceDate}</strong>
                </span>
              </div>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 p-1.5 rounded-lg cursor-pointer"
          >
            ✕
          </button>
        </div>

        {/* Modal Body (Scrollable) */}
        <div className="overflow-y-auto space-y-4 pr-1 flex-1">
          {/* Deep AI Verification Action Toolbar */}
          {!isParent && (
            <div className="bg-gradient-to-r from-emerald-900 to-teal-900 text-white rounded-xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-xs">
              <div className="flex items-center gap-2.5">
                <Sparkles className="w-5 h-5 text-emerald-300 shrink-0" />
                <div>
                  <h4 className="font-bold text-xs sm:text-sm">
                    {lang === 'ar'
                      ? 'أداة التدقيق الجنائي الذكي للمستندات (Gemini Verification Tool)'
                      : 'Gemini Document Fraud & Consistency Engine'}
                  </h4>
                  <p className="text-[11px] text-emerald-200 leading-relaxed">
                    {lang === 'ar'
                      ? 'يقوم النموذج بفحص صورة التقرير الطبي، مطابقة اسم الطالب وتاريخ الغياب، والتحقق من الأختام والتلاعب الرقمي.'
                      : 'Deep inspection of document image against student records, absence dates, and official seals.'}
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => onReanalyzeWithAI(justification)}
                disabled={isReanalyzing}
                className="flex items-center justify-center gap-1.5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold px-4 py-2 rounded-lg text-xs transition-all cursor-pointer shadow-xs shrink-0 disabled:opacity-50"
              >
                {isReanalyzing ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    <span>{lang === 'ar' ? 'جارٍ التحقق العميق...' : 'Analyzing...'}</span>
                  </>
                ) : (
                  <>
                    <RotateCcw className="w-3.5 h-3.5" />
                    <span>
                      {justification.aiAnalysis
                        ? lang === 'ar'
                          ? 'إعادة فحص المستند بالذكاء الاصطناعي'
                          : 'Re-verify with Gemini'
                        : lang === 'ar'
                        ? 'تشغيل أداة التحقق الذكية الآن'
                        : 'Run AI Verification'}
                    </span>
                  </>
                )}
              </button>
            </div>
          )}

          {reanalysisError && (
            <div className="bg-rose-50 border border-rose-300 text-rose-800 p-3 rounded-lg text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{reanalysisError}</span>
            </div>
          )}

          {/* Grid: Document Image Preview + AI Verification Report */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
            {/* Document Preview (Left) */}
            <div className="lg:col-span-5 bg-slate-50 border border-slate-200 rounded-xl p-3.5 space-y-2 flex flex-col">
              <div className="flex items-center justify-between text-xs font-semibold text-slate-700">
                <span className="flex items-center gap-1.5">
                  <FileText className="w-4 h-4 text-slate-600" />
                  <span>{lang === 'ar' ? 'صورة المستند الطبي المرفق:' : 'Document Image:'}</span>
                </span>
                <span className="text-[10px] text-slate-500 font-mono">
                  {justification.attachmentName || 'medical_report.jpg'}
                </span>
              </div>

              <div className="border border-slate-300 rounded-lg overflow-hidden bg-white flex-1 min-h-[220px] max-h-[380px] flex items-center justify-center">
                {justification.attachmentUrl ? (
                  <img
                    src={justification.attachmentUrl}
                    alt="Medical Excuse Attachment"
                    className="w-full h-full object-contain max-h-[360px]"
                  />
                ) : (
                  <div className="text-center p-6 text-slate-400 space-y-2">
                    <ImageIcon className="w-10 h-10 mx-auto text-slate-300" />
                    <span className="text-xs block">
                      {lang === 'ar' ? 'معاينة المستند الطبي المرفق' : 'Medical Report Preview'}
                    </span>
                    {!isParent && (
                      <button
                        type="button"
                        onClick={() => onReanalyzeWithAI(justification)}
                        className="text-[11px] text-emerald-700 font-bold underline cursor-pointer"
                      >
                        {lang === 'ar' ? 'تحميل العينة وتفعيل الفاحص الذكي' : 'Load sample & run verification'}
                      </button>
                    )}
                  </div>
                )}
              </div>

              <div className="bg-white border border-slate-200 rounded-lg p-2.5 text-xs text-slate-700 space-y-1">
                <span className="font-bold text-slate-900 block">
                  {lang === 'ar' ? 'شرح وبيان ولي الأمر:' : 'Parent Statement:'}
                </span>
                <p className="leading-relaxed">{justification.guardianExplanation}</p>
              </div>
            </div>

            {/* AI Verification Report & Decision Details (Right) */}
            <div className="lg:col-span-7 space-y-3.5">
              {justification.aiAnalysis ? (
                <div className="space-y-3 text-xs">
                  {/* Integrity & Verdict Header */}
                  <div
                    className={`p-3.5 rounded-xl border flex items-center justify-between ${
                      justification.aiAnalysis.verificationStatus === 'irregular' ||
                      (justification.aiAnalysis.irregularities &&
                        justification.aiAnalysis.irregularities.length > 0)
                        ? 'bg-rose-50 border-rose-300 text-rose-950'
                        : justification.aiAnalysis.verificationStatus === 'verified'
                        ? 'bg-emerald-50 border-emerald-300 text-emerald-950'
                        : 'bg-amber-50 border-amber-300 text-amber-950'
                    }`}
                  >
                    <div>
                      <span className="text-[10px] font-semibold opacity-75 block">
                        {lang === 'ar' ? 'نتيجة التدقيق وتوصية الذكاء الاصطناعي:' : 'Verification Verdict:'}
                      </span>
                      <strong className="text-sm font-bold flex items-center gap-1.5 mt-0.5">
                        {justification.aiAnalysis.verificationStatus === 'irregular' ||
                        (justification.aiAnalysis.irregularities &&
                          justification.aiAnalysis.irregularities.length > 0) ? (
                          <>
                            <ShieldAlert className="w-4 h-4 text-rose-600" />
                            <span>
                              {justification.aiAnalysis.recommendedDecision || 'رفض العذر (رصد تناقض)'}
                            </span>
                          </>
                        ) : (
                          <>
                            <ShieldCheck className="w-4 h-4 text-emerald-600" />
                            <span>
                              {justification.aiAnalysis.recommendedDecision || 'قبول العذر (مطابق للشروط)'}
                            </span>
                          </>
                        )}
                      </strong>
                    </div>

                    <div className="text-left font-mono">
                      <span className="text-[10px] opacity-75 block">
                        {lang === 'ar' ? 'مؤشر الأصالة:' : 'Integrity Score:'}
                      </span>
                      <span className="text-sm font-bold">
                        {justification.aiAnalysis.integrityScore
                          ? `${justification.aiAnalysis.integrityScore}%`
                          : justification.aiAnalysis.confidenceScore || '---'}
                      </span>
                    </div>
                  </div>

                  {/* Flagged Irregularities Container */}
                  {justification.aiAnalysis.irregularities &&
                    justification.aiAnalysis.irregularities.length > 0 && (
                      <div className="bg-rose-50 border border-rose-300 rounded-xl p-3.5 space-y-2">
                        <div className="flex items-center gap-1.5 text-rose-900 font-bold text-xs">
                          <FileWarning className="w-4 h-4 text-rose-600 shrink-0" />
                          <span>
                            {lang === 'ar'
                              ? `التناقضات والمخالفات المرصودة في المستند (${justification.aiAnalysis.irregularities.length}):`
                              : `Flagged Inconsistencies (${justification.aiAnalysis.irregularities.length}):`}
                          </span>
                        </div>
                        <div className="space-y-2">
                          {justification.aiAnalysis.irregularities.map((irreg, i) => (
                            <div
                              key={i}
                              className="bg-white p-2.5 rounded-lg border border-rose-200 text-xs space-y-1 shadow-2xs"
                            >
                              <div className="flex items-center justify-between">
                                <strong className="text-rose-900 font-bold flex items-center gap-1">
                                  <span>• {irreg.titleAr}</span>
                                </strong>
                                <span
                                  className={`text-[9px] px-1.5 py-0.2 rounded font-bold ${
                                    irreg.severity === 'high' ? 'bg-rose-600 text-white' : 'bg-amber-100 text-amber-800'
                                  }`}
                                >
                                  {irreg.severity === 'high' ? 'حرج' : 'متوسط'}
                                </span>
                              </div>
                              <p className="text-slate-700 text-[11px] leading-relaxed">{irreg.descriptionAr}</p>
                              {irreg.suggestedAction && (
                                <div className="text-[10px] text-slate-500 pt-0.5">
                                  <strong>الإجراء المقترح:</strong> {irreg.suggestedAction}
                                </div>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                  {/* 6-Point Verification Checklist */}
                  {justification.aiAnalysis.checklist && (
                    <div className="bg-slate-50 border border-slate-200 rounded-xl p-3 space-y-2 text-xs">
                      <span className="font-bold text-slate-800 block text-[11px]">
                        {lang === 'ar'
                          ? 'معايير التدقيق الستة (Verification Checklist):'
                          : '6-Point Verification Checklist:'}
                      </span>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[11px]">
                        {[
                          { key: 'nameMatch', labelAr: 'مطابقة اسم الطالب' },
                          { key: 'dateMatch', labelAr: 'تغطية تاريخ الغياب' },
                          { key: 'stampPresent', labelAr: 'الختم والتوقيع الرسمي' },
                          { key: 'noTamperingDetected', labelAr: 'سلامة التعديل الرقمي' },
                          { key: 'accreditedFacility', labelAr: 'اعتماد المنشأة' },
                          { key: 'durationReasonable', labelAr: 'منطقية فترة الإجازة' },
                        ].map((item) => {
                          const check = justification.aiAnalysis?.checklist?.[item.key];
                          const passed = check?.passed ?? true;
                          return (
                            <div
                              key={item.key}
                              className={`p-2 rounded-lg border flex items-start gap-1.5 ${
                                passed
                                  ? 'bg-emerald-50/70 border-emerald-200 text-emerald-950'
                                  : 'bg-rose-50/80 border-rose-300 text-rose-950'
                              }`}
                            >
                              {passed ? (
                                <CheckCircle className="w-3.5 h-3.5 text-emerald-600 shrink-0 mt-0.5" />
                              ) : (
                                <XCircle className="w-3.5 h-3.5 text-rose-600 shrink-0 mt-0.5" />
                              )}
                              <div>
                                <span className="font-bold block">{item.labelAr}</span>
                                {check?.details && (
                                  <span className="text-[10px] opacity-80 line-clamp-1">{check.details}</span>
                                )}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {/* Document Details Breakdown */}
                  <div className="bg-slate-50 border border-slate-200 rounded-lg p-3 space-y-1.5 text-xs text-slate-700">
                    <div className="flex justify-between">
                      <span className="text-slate-500">{lang === 'ar' ? 'نوع المستند:' : 'Doc Type:'}</span>
                      <strong className="text-slate-900">{justification.aiAnalysis.documentType || '---'}</strong>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500">{lang === 'ar' ? 'الجهة المصدرة:' : 'Issuer:'}</span>
                      <strong className="text-slate-900">{justification.aiAnalysis.issuerName || '---'}</strong>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500">{lang === 'ar' ? 'اسم الطبيب:' : 'Physician:'}</span>
                      <strong className="text-slate-900">{justification.aiAnalysis.physicianName || '---'}</strong>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500">{lang === 'ar' ? 'فترة الإجازة والمدة:' : 'Leave Dates:'}</span>
                      <strong className="text-slate-900">
                        {justification.aiAnalysis.datesCovered || '---'} ({justification.aiAnalysis.durationDays || 'يوم'})
                      </strong>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500">{lang === 'ar' ? 'التشخيص الطبي:' : 'Diagnosis:'}</span>
                      <strong className="text-slate-900">{justification.aiAnalysis.reasonOrDiagnosis || '---'}</strong>
                    </div>
                  </div>

                  {/* Auto Apply Recommendation helper for committee */}
                  {!isParent && justification.aiAnalysis.decisionRationale && (
                    <div className="flex items-center justify-between bg-slate-100 p-2.5 rounded-lg text-[11px]">
                      <span className="text-slate-600">
                        <strong>{lang === 'ar' ? 'تسبيب القرار المقترح:' : 'Suggested Rationale:'}</strong>{' '}
                        {justification.aiAnalysis.decisionRationale}
                      </span>
                      <button
                        type="button"
                        onClick={() =>
                          setReviewerNotes(justification.aiAnalysis?.decisionRationale || '')
                        }
                        className="text-emerald-700 hover:text-emerald-900 font-bold shrink-0 underline mr-2 cursor-pointer"
                      >
                        {lang === 'ar' ? 'إدراج في الملاحظات' : 'Apply to Notes'}
                      </button>
                    </div>
                  )}
                </div>
              ) : (
                <div className="bg-slate-50 border border-slate-200 rounded-xl p-8 text-center text-xs text-slate-500 space-y-2">
                  <Sparkles className="w-8 h-8 text-slate-300 mx-auto" />
                  <p>
                    {lang === 'ar'
                      ? 'لم يتم تشغيل أداة التحقق الذكية لهذا المستند بعد. اضغط الزر الأخضر أعلاه لتشغيل فحص Gemini وكشف التناقضات فوراً.'
                      : 'AI verification has not been run on this document yet. Click the button above to inspect.'}
                  </p>
                </div>
              )}

              {/* Review Decision Notes Input (For Staff) or Status (For Parent) */}
              {isParent ? (
                <div className="bg-slate-50 border border-slate-200 rounded-xl p-3.5 space-y-1 text-xs">
                  <span className="font-semibold text-slate-700 block">
                    {lang === 'ar' ? 'قرار وملاحظات إدارة المدرسة:' : 'School Remarks & Decision:'}
                  </span>
                  <p className="text-slate-800 text-xs">
                    {justification.reviewerNotes ||
                      (justification.status === 'pending'
                        ? lang === 'ar'
                          ? 'العذر قيد المراجعة والمطابقة من قبل قسم شؤون الطلاب.'
                          : 'Pending review by school administration.'
                        : lang === 'ar'
                        ? 'تم اعتماد القرار رسمياً.'
                        : 'Decision recorded.')}
                  </p>
                </div>
              ) : (
                <div className="space-y-1.5 pt-1">
                  <label className="block font-bold text-slate-800 text-xs">
                    {lang === 'ar' ? 'ملاحظة وقرار لجنة الحضور المدرسية:' : 'Committee Decision Notes:'}
                  </label>
                  <input
                    type="text"
                    value={reviewerNotes}
                    onChange={(e) => setReviewerNotes(e.target.value)}
                    placeholder={
                      lang === 'ar'
                        ? 'اكتب سبب القبول أو الرفض استناداً لنتائج التدقيق...'
                        : 'State reason for approval or rejection...'
                    }
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl p-2.5 text-xs text-slate-800 focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Modal Actions */}
        <div className="pt-3 border-t border-slate-200 flex items-center justify-between shrink-0">
          <div className="text-xs text-slate-500">
            {justification.reviewedBy ? (
              <span>
                {lang === 'ar' ? 'المعتمد:' : 'Reviewed by:'} {justification.reviewedBy}
              </span>
            ) : (
              <span>{lang === 'ar' ? 'الحالة: قيد التدقيق' : 'Status: In Review'}</span>
            )}
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs border border-slate-200 text-slate-600 rounded-lg hover:bg-slate-50 cursor-pointer"
            >
              {lang === 'ar' ? 'إغلاق' : 'Close'}
            </button>

            {canReviewJustifications ? (
              <>
                <button
                  type="button"
                  onClick={() => onReject(justification.id)}
                  className="px-4 py-2 text-xs bg-rose-600 hover:bg-rose-700 text-white rounded-lg font-bold cursor-pointer transition-colors shadow-xs"
                >
                  {lang === 'ar' ? 'رفض العذر (حسم الغياب)' : 'Reject Excuse'}
                </button>
                <button
                  type="button"
                  onClick={() => onApprove(justification.id)}
                  className="px-5 py-2 text-xs bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-bold cursor-pointer transition-colors shadow-xs"
                >
                  {lang === 'ar' ? 'قبول واعتماد العذر رسمياً' : 'Approve & Excuse Absence'}
                </button>
              </>
            ) : (
              currentUserRole === 'teacher' && (
                <span className="text-[11px] text-slate-500 bg-slate-100 px-3 py-1.5 rounded-md font-medium">
                  {lang === 'ar'
                    ? 'ملاحظة: صلاحية اعتماد ورفض الأعذار الطبية محصورة بإدارة المدرسة ولجنة التوجيه الطلابي.'
                    : 'Notice: Approval and rejection are restricted to school administration.'}
                </span>
              )
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

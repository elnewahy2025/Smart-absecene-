import React from 'react';
import { Student } from '../../types/attendance';
import {
  UploadCloud,
  Sparkles,
  ShieldCheck,
  Send,
  Loader2,
  Image as ImageIcon,
  AlertTriangle,
  CheckCircle2,
  ShieldAlert,
  FileWarning,
  CheckCircle,
  XCircle,
  AlertCircle,
} from 'lucide-react';

export interface JustificationSubmitFormProps {
  students: Student[];
  isParent: boolean;
  lang: 'ar' | 'en';
  selectedStudentId: string;
  setSelectedStudentId: (id: string) => void;
  absenceDate: string;
  setAbsenceDate: (date: string) => void;
  reasonType: 'medical' | 'family' | 'travel' | 'other';
  setReasonType: (type: 'medical' | 'family' | 'travel' | 'other') => void;
  guardianExplanation: string;
  setGuardianExplanation: (exp: string) => void;
  uploadedFileName: string;
  uploadedImageBase64: string | null;
  onFileUpload: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onLoadSampleMedicalNote: () => void;
  onLoadSampleIrregularNote: () => void;
  onAnalyzeWithAI: () => void;
  isAnalyzing: boolean;
  aiAnalysisResult: any;
  analysisError: string | null;
  isSubmitting: boolean;
  onSubmit: (e: React.FormEvent) => void;
}

export const JustificationSubmitForm: React.FC<JustificationSubmitFormProps> = ({
  students,
  isParent,
  lang,
  selectedStudentId,
  setSelectedStudentId,
  absenceDate,
  setAbsenceDate,
  reasonType,
  setReasonType,
  guardianExplanation,
  setGuardianExplanation,
  uploadedFileName,
  uploadedImageBase64,
  onFileUpload,
  onLoadSampleMedicalNote,
  onLoadSampleIrregularNote,
  onAnalyzeWithAI,
  isAnalyzing,
  aiAnalysisResult,
  analysisError,
  isSubmitting,
  onSubmit,
}) => {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
      {/* Form Side */}
      <div className="lg:col-span-7 bg-white rounded-xl border border-slate-200 p-5 shadow-xs space-y-4">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div>
            <h3 className="font-bold text-slate-900 text-base">
              {isParent
                ? lang === 'ar'
                  ? 'تقديم عذر غياب رسمي للابن/الابنة'
                  : 'Submit Official Child Excuse'
                : lang === 'ar'
                ? 'تسجيل عذر غياب طالب وفحص المستند بالذكاء الاصطناعي'
                : 'Submit Student Excuse with AI Verification'}
            </h3>
            <p className="text-xs text-slate-500">
              {lang === 'ar'
                ? 'يقوم محرك Gemini بفحص صورة التقرير وتدقيق التواريخ والأختام ورصد أي تناقضات قبل الاعتماد'
                : 'Gemini analyzes the document, cross-checks dates, and flags irregularities'}
            </p>
          </div>
        </div>

        <form onSubmit={onSubmit} className="space-y-4 text-xs">
          {/* Student Selector */}
          <div>
            <label className="block text-slate-700 font-semibold mb-1">
              {lang === 'ar' ? 'الطالب المعني بالعذر:' : 'Target Student:'}
            </label>
            <select
              value={selectedStudentId}
              onChange={(e) => setSelectedStudentId(e.target.value)}
              className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2.5 text-xs text-slate-800 font-medium focus:ring-2 focus:ring-emerald-500 cursor-pointer"
            >
              {students.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.fullName} ({s.className}) - ولي الأمر: {s.guardianName}
                </option>
              ))}
            </select>
          </div>

          {/* Date & Reason Type */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-slate-700 font-semibold mb-1">
                {lang === 'ar' ? 'تاريخ الغياب المطلوب تبريره:' : 'Absence Date:'}
              </label>
              <input
                type="date"
                required
                value={absenceDate}
                onChange={(e) => setAbsenceDate(e.target.value)}
                className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2.5 text-xs text-slate-800 focus:ring-2 focus:ring-emerald-500"
              />
            </div>

            <div>
              <label className="block text-slate-700 font-semibold mb-1">
                {lang === 'ar' ? 'تصنيف العذر:' : 'Reason Category:'}
              </label>
              <select
                value={reasonType}
                onChange={(e) => setReasonType(e.target.value as any)}
                className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2.5 text-xs text-slate-800 font-medium cursor-pointer"
              >
                <option value="medical">{lang === 'ar' ? 'عذر طبي / إجازة مرضية' : 'Medical Note'}</option>
                <option value="family">{lang === 'ar' ? 'ظرف أسري قاهر' : 'Family Emergency'}</option>
                <option value="travel">{lang === 'ar' ? 'سفر ضروري' : 'Travel'}</option>
                <option value="other">{lang === 'ar' ? 'أخرى' : 'Other'}</option>
              </select>
            </div>
          </div>

          {/* Upload Document & Interactive Demo Helpers */}
          <div>
            <label className="block text-slate-700 font-semibold mb-1">
              {lang === 'ar' ? 'إرفاق التقرير الطبي أو المستند:' : 'Attach Medical Document:'}
            </label>
            <div className="border-2 border-dashed border-slate-300 rounded-xl p-4 text-center bg-slate-50 hover:bg-slate-100/70 transition-colors space-y-3">
              <input
                type="file"
                accept="image/*,application/pdf"
                id="medical-file-input"
                className="hidden"
                onChange={onFileUpload}
              />
              <label
                htmlFor="medical-file-input"
                className="cursor-pointer inline-flex flex-col items-center gap-1.5"
              >
                <UploadCloud className="w-7 h-7 text-emerald-600" />
                <span className="font-bold text-slate-800 text-xs">
                  {uploadedFileName ||
                    (lang === 'ar' ? 'انقر لرفع صورة التقرير الطبي (JPG, PNG)' : 'Click to upload medical image')}
                </span>
                <span className="text-[10px] text-slate-500">
                  {lang === 'ar'
                    ? 'أو استخدم الأزرار التجريبية السريعة أدناه لاختبار فحص الذكاء الاصطناعي'
                    : 'or load a test sample below'}
                </span>
              </label>

              {/* Test Sample Helpers: Legitimate vs Irregular */}
              <div className="pt-2 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-center gap-2">
                <button
                  type="button"
                  onClick={onLoadSampleMedicalNote}
                  className="w-full sm:w-auto text-[11px] text-emerald-800 font-bold inline-flex items-center justify-center gap-1.5 bg-emerald-100 hover:bg-emerald-200 border border-emerald-300 px-3 py-1.5 rounded-lg cursor-pointer transition-colors"
                >
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                  <span>{lang === 'ar' ? '✓ إدراج تقرير طبي معتمد وسليم للاختبار' : 'Insert Valid Medical Report'}</span>
                </button>

                <button
                  type="button"
                  onClick={onLoadSampleIrregularNote}
                  className="w-full sm:w-auto text-[11px] text-rose-900 font-bold inline-flex items-center justify-center gap-1.5 bg-rose-100 hover:bg-rose-200 border border-rose-300 px-3 py-1.5 rounded-lg cursor-pointer transition-colors"
                >
                  <AlertTriangle className="w-3.5 h-3.5 text-rose-600" />
                  <span>{lang === 'ar' ? '⚠️ إدراج تقرير به تناقضات وتلاعب للاختبار' : 'Insert Irregular / Discrepant Report'}</span>
                </button>
              </div>
            </div>
          </div>

          {/* Trigger AI Verification Button */}
          {uploadedImageBase64 && (
            <div className="bg-emerald-50 border border-emerald-200 p-3 rounded-xl flex items-center justify-between gap-3">
              <div className="flex items-center gap-2 text-emerald-950 font-bold text-xs">
                <Sparkles className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>
                  {lang === 'ar'
                    ? 'المستند جاهز للفحص والتدقيق الآلي'
                    : 'Document ready for AI verification'}
                </span>
              </div>
              <button
                type="button"
                onClick={onAnalyzeWithAI}
                disabled={isAnalyzing}
                className="flex items-center gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold px-4 py-2 rounded-lg text-xs shadow-xs cursor-pointer transition-all disabled:opacity-50"
              >
                {isAnalyzing ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    <span>{lang === 'ar' ? 'جارٍ التحقق ورصد التناقضات...' : 'Verifying with Gemini...'}</span>
                  </>
                ) : (
                  <>
                    <ShieldCheck className="w-3.5 h-3.5" />
                    <span>{lang === 'ar' ? 'فحص وتدقيق المستند بواسطة Gemini' : 'Verify with Gemini'}</span>
                  </>
                )}
              </button>
            </div>
          )}

          {/* Guardian Explanation */}
          <div>
            <label className="block text-slate-700 font-semibold mb-1">
              {lang === 'ar' ? 'بيان وتفاصيل العذر:' : 'Explanation:'}
            </label>
            <textarea
              rows={3}
              required
              value={guardianExplanation}
              onChange={(e) => setGuardianExplanation(e.target.value)}
              placeholder={
                lang === 'ar'
                  ? 'اكتب شرحًا لحالة الطالب وسبب الغياب...'
                  : 'Provide details about the student absence...'
              }
              className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2.5 text-xs text-slate-800 focus:ring-2 focus:ring-emerald-500 focus:outline-hidden"
            />
          </div>

          {/* Submit Button */}
          <div className="pt-2 flex items-center justify-end">
            <button
              type="submit"
              disabled={isSubmitting || !guardianExplanation}
              className="flex items-center gap-2 bg-slate-900 hover:bg-slate-800 disabled:opacity-50 text-white font-semibold text-xs px-6 py-2.5 rounded-lg transition-colors cursor-pointer shadow-xs"
            >
              <Send className="w-4 h-4" />
              <span>{lang === 'ar' ? 'إرسال طلب العذر إلى إدارة المدرسة' : 'Submit Excuse'}</span>
            </button>
          </div>
        </form>
      </div>

      {/* AI Verification Results Panel (Submit Side) */}
      <div className="lg:col-span-5 space-y-4">
        <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-emerald-100 text-emerald-800 flex items-center justify-center">
                <Sparkles className="w-4 h-4" />
              </div>
              <div>
                <h4 className="font-bold text-slate-900 text-sm">
                  {lang === 'ar' ? 'أداة التحقق الذكي ورصد التناقضات' : 'AI Verification & Irregularities Tool'}
                </h4>
                <span className="text-[10px] text-slate-500 font-medium">
                  {lang === 'ar' ? 'مدعوم بنموذج Gemini Multimodal' : 'Powered by Gemini Multimodal'}
                </span>
              </div>
            </div>
          </div>

          {isAnalyzing && (
            <div className="py-12 text-center space-y-3">
              <Loader2 className="w-8 h-8 text-emerald-600 animate-spin mx-auto" />
              <p className="text-xs text-slate-700 font-semibold">
                {lang === 'ar'
                  ? 'جارٍ قراءة التقرير، مطابقة اسم الطالب وتاريخ الغياب، والتحقق من الأختام وعلامات التعديل...'
                  : 'Cross-checking student name, absence dates, seals, and signs of alteration...'}
              </p>
            </div>
          )}

          {analysisError && (
            <div className="bg-rose-50 border border-rose-200 text-rose-800 p-3 rounded-lg text-xs space-y-1">
              <div className="flex items-center gap-1.5 font-bold">
                <AlertCircle className="w-4 h-4" />
                <span>{lang === 'ar' ? 'ملاحظة فحص المستند' : 'Notice'}</span>
              </div>
              <p>{analysisError}</p>
            </div>
          )}

          {!isAnalyzing && !aiAnalysisResult && !analysisError && (
            <div className="py-12 text-center text-xs text-slate-500 space-y-3">
              <ImageIcon className="w-10 h-10 text-slate-300 mx-auto" />
              <p className="leading-relaxed">
                {lang === 'ar'
                  ? 'اختر صورة التقرير الطبي أو استخدم أزرار النماذج التجريبية، ثم اضغط "فحص وتدقيق المستند" لعرض تقرير التحقق الجنائي وكشف التناقضات بدقة.'
                  : 'Upload medical image and click "Verify with Gemini" to run irregularity checks.'}
              </p>
            </div>
          )}

          {/* Render AI Verification Report if Available */}
          {aiAnalysisResult && (
            <div className="space-y-4">
              {/* Status Banner */}
              <div
                className={`p-3.5 rounded-xl border flex items-center justify-between ${
                  aiAnalysisResult.verificationStatus === 'irregular' ||
                  (aiAnalysisResult.irregularities && aiAnalysisResult.irregularities.length > 0)
                    ? 'bg-rose-50 border-rose-300 text-rose-950'
                    : aiAnalysisResult.verificationStatus === 'verified'
                    ? 'bg-emerald-50 border-emerald-300 text-emerald-950'
                    : 'bg-amber-50 border-amber-300 text-amber-950'
                }`}
              >
                <div>
                  <span className="text-[10px] font-semibold opacity-75 block">
                    {lang === 'ar' ? 'نتيجة التحقق والتوصية:' : 'AI Verdict:'}
                  </span>
                  <strong className="text-sm font-bold flex items-center gap-1.5 mt-0.5">
                    {aiAnalysisResult.verificationStatus === 'irregular' ||
                    (aiAnalysisResult.irregularities && aiAnalysisResult.irregularities.length > 0) ? (
                      <>
                        <ShieldAlert className="w-4 h-4 text-rose-600" />
                        <span>
                          {aiAnalysisResult.recommendedDecision ||
                            (lang === 'ar' ? 'رفض العذر (تم رصد تناقض)' : 'Reject Excuse')}
                        </span>
                      </>
                    ) : (
                      <>
                        <ShieldCheck className="w-4 h-4 text-emerald-600" />
                        <span>
                          {aiAnalysisResult.recommendedDecision ||
                            (lang === 'ar' ? 'قبول العذر (مستند موثوق)' : 'Approve Excuse')}
                        </span>
                      </>
                    )}
                  </strong>
                </div>

                <div className="text-left font-mono">
                  <span className="text-[10px] opacity-75 block">{lang === 'ar' ? 'مؤشر الأصالة:' : 'Integrity:'}</span>
                  <span className="text-sm font-bold">
                    {aiAnalysisResult.integrityScore
                      ? `${aiAnalysisResult.integrityScore}%`
                      : aiAnalysisResult.confidenceScore || '---'}
                  </span>
                </div>
              </div>

              {/* Flagged Irregularities Container */}
              {aiAnalysisResult.irregularities && aiAnalysisResult.irregularities.length > 0 && (
                <div className="bg-rose-50 border border-rose-300 rounded-xl p-3.5 space-y-2">
                  <div className="flex items-center gap-1.5 text-rose-900 font-bold text-xs">
                    <FileWarning className="w-4 h-4 text-rose-600 shrink-0" />
                    <span>
                      {lang === 'ar'
                        ? `تم رصد (${aiAnalysisResult.irregularities.length}) تناقضات في المستند:`
                        : `Flagged (${aiAnalysisResult.irregularities.length}) Discrepancies:`}
                    </span>
                  </div>
                  <div className="space-y-2">
                    {aiAnalysisResult.irregularities.map((irreg: any, i: number) => (
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
                            <strong>الإجراء:</strong> {irreg.suggestedAction}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* 6-Point Checklist */}
              {aiAnalysisResult.checklist && (
                <div className="bg-slate-50 border border-slate-200 rounded-xl p-3 space-y-2 text-xs">
                  <span className="font-bold text-slate-800 block text-[11px]">
                    {lang === 'ar' ? 'قائمة التحقق من معايير الاعتماد:' : '6-Point Verification Checklist:'}
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
                      const check = aiAnalysisResult.checklist[item.key];
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

              {/* Extracted Metadata Summary */}
              <div className="bg-slate-50 border border-slate-200 rounded-lg p-3 space-y-1.5 text-xs text-slate-700">
                <div className="flex justify-between">
                  <span className="text-slate-500">{lang === 'ar' ? 'الجهة المصدرة:' : 'Issuer:'}</span>
                  <strong className="text-slate-900">{aiAnalysisResult.issuerName || '---'}</strong>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">{lang === 'ar' ? 'اسم الطبيب:' : 'Physician:'}</span>
                  <strong className="text-slate-900">{aiAnalysisResult.physicianName || '---'}</strong>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">{lang === 'ar' ? 'فترة الإجازة الموصى بها:' : 'Leave Dates:'}</span>
                  <strong className="text-slate-900">
                    {aiAnalysisResult.datesCovered || '---'} ({aiAnalysisResult.durationDays || 'يوم'})
                  </strong>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">{lang === 'ar' ? 'التشخيص الطبي:' : 'Diagnosis:'}</span>
                  <strong className="text-slate-900">{aiAnalysisResult.reasonOrDiagnosis || '---'}</strong>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

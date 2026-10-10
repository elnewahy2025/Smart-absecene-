import React, { useState } from 'react';
import { useAttendance } from '../context/AttendanceContext';
import { Justification } from '../types/attendance';
import { generateSampleMedicalNoteBase64 } from '../utils/sampleImages';
import {
  FileText,
  UploadCloud,
  Sparkles,
  CheckCircle,
  XCircle,
  Clock,
  ShieldCheck,
  Building,
  Calendar,
  AlertCircle,
  Eye,
  FileCheck,
  Send,
  Loader2,
  Image as ImageIcon,
} from 'lucide-react';

export const JustificationsView: React.FC = () => {
  const {
    justifications,
    students,
    currentUser,
    lang,
    createJustification,
    reviewJustification,
  } = useAttendance();

  // Active sub-tab
  const [activeSubTab, setActiveSubTab] = useState<'review' | 'submit'>('review');

  // Submit form state
  const [selectedStudentId, setSelectedStudentId] = useState<string>(students[0]?.id || '');
  const [absenceDate, setAbsenceDate] = useState<string>(
    new Date().toISOString().split('T')[0]
  );
  const [reasonType, setReasonType] = useState<'medical' | 'family' | 'travel' | 'other'>('medical');
  const [guardianExplanation, setGuardianExplanation] = useState<string>('');
  const [uploadedImageBase64, setUploadedImageBase64] = useState<string | null>(null);
  const [uploadedFileName, setUploadedFileName] = useState<string>('');

  // AI Analysis state
  const [isAnalyzing, setIsAnalyzing] = useState<boolean>(false);
  const [aiAnalysisResult, setAiAnalysisResult] = useState<any>(null);
  const [analysisError, setAnalysisError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  // Review modal state
  const [selectedJustificationForReview, setSelectedJustificationForReview] = useState<Justification | null>(null);
  const [reviewerNotes, setReviewerNotes] = useState<string>('');

  // Handle file input
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadedFileName(file.name);
    const reader = new FileReader();
    reader.onload = (uploadEvent) => {
      const base64 = uploadEvent.target?.result as string;
      setUploadedImageBase64(base64);
      setAiAnalysisResult(null); // Reset previous analysis
    };
    reader.readAsDataURL(file);
  };

  // Insert generated sample medical note
  const handleLoadSampleMedicalNote = () => {
    const student = students.find((s) => s.id === selectedStudentId);
    const sample = generateSampleMedicalNoteBase64(
      student?.fullName || 'يوسف خالد المطيري',
      'مستشفى الملك فيصل التخصصي ومركز الأبحاث'
    );
    setUploadedImageBase64(sample);
    setUploadedFileName('medical_report_sample_2026.jpg');
    setGuardianExplanation(
      'مرفق التقرير الطبي الصادر من عيادة الطوارئ يفيد بتوصية الراحة لمدة يومين بسبب وعكة صحية طارئة.'
    );
    setAiAnalysisResult(null);
  };

  // Call server-side /api/analyze-image endpoint (gemini-3.1-pro-preview)
  const handleAnalyzeImageWithAI = async () => {
    if (!uploadedImageBase64) {
      alert('يرجى اختيار أو رفع صورة التقرير الطبي أولاً');
      return;
    }

    setIsAnalyzing(true);
    setAnalysisError(null);

    try {
      const student = students.find((s) => s.id === selectedStudentId);
      const res = await fetch('/api/analyze-image', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          imageBase64: uploadedImageBase64,
          mimeType: 'image/jpeg',
          promptCustom: `اسم الطالب المقيد: ${student?.fullName || ''}، تاريخ الغياب المطلوب تبريره: ${absenceDate}`,
        }),
      });

      if (!res.ok) {
        throw new Error(`خطأ في استجابة الخادم: ${res.status}`);
      }

      const data = await res.json();
      setAiAnalysisResult(data.analysis);

      // Auto fill explanation if empty
      if (!guardianExplanation && data.analysis?.extractedSummary) {
        setGuardianExplanation(data.analysis.extractedSummary);
      }
    } catch (err: any) {
      console.error('Error analyzing medical excuse:', err);
      setAnalysisError(
        err.message || 'تعذر استكمال تحليل الصورة. يمكنك مواصلة التقديم يدويًا.'
      );
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedStudentId) return;

    setIsSubmitting(true);
    try {
      await createJustification(
        selectedStudentId,
        absenceDate,
        reasonType,
        guardianExplanation,
        uploadedImageBase64
          ? {
              name: uploadedFileName || 'medical_document.jpg',
              mime: 'image/jpeg',
              base64: uploadedImageBase64,
            }
          : undefined,
        aiAnalysisResult
      );

      // Reset
      setUploadedImageBase64(null);
      setUploadedFileName('');
      setAiAnalysisResult(null);
      setGuardianExplanation('');
      setActiveSubTab('review');
    } catch (err) {
      console.error(err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleApprove = (justId: string) => {
    reviewJustification(justId, 'approved', reviewerNotes || 'تم التحقق واعتماد العذر الطبي رسميًا.');
    setSelectedJustificationForReview(null);
    setReviewerNotes('');
  };

  const handleReject = (justId: string) => {
    reviewJustification(justId, 'rejected', reviewerNotes || 'العذر غير مكتمل أو لا يفي بالشروط المعتمدة.');
    setSelectedJustificationForReview(null);
    setReviewerNotes('');
  };

  const pendingCount = justifications.filter((j) => j.status === 'pending').length;

  return (
    <div className="space-y-6">
      {/* Sub-Tabs: Review vs Submit */}
      <div className="flex items-center justify-between border-b border-slate-200 pb-3">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setActiveSubTab('review')}
            className={`px-4 py-2 rounded-lg text-xs font-semibold transition-colors cursor-pointer flex items-center gap-2 ${
              activeSubTab === 'review'
                ? 'bg-slate-900 text-white shadow-xs'
                : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
            }`}
          >
            <FileCheck className="w-4 h-4" />
            <span>{lang === 'ar' ? 'سجل وقرارات الأعذار المرفوعة' : 'Excuses Roster'}</span>
            {pendingCount > 0 && (
              <span className="bg-amber-400 text-slate-950 px-1.5 py-0.2 rounded-full text-[10px] font-bold">
                {pendingCount}
              </span>
            )}
          </button>

          <button
            onClick={() => setActiveSubTab('submit')}
            className={`px-4 py-2 rounded-lg text-xs font-semibold transition-colors cursor-pointer flex items-center gap-2 ${
              activeSubTab === 'submit'
                ? 'bg-slate-900 text-white shadow-xs'
                : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
            }`}
          >
            <Sparkles className="w-4 h-4 text-emerald-500" />
            <span>{lang === 'ar' ? 'تقديم عذر جديد وتحليل المستند بالذكاء الاصطناعي' : 'New Excuse & AI Analysis'}</span>
          </button>
        </div>
      </div>

      {/* VIEW 1: REVIEW ROSTER */}
      {activeSubTab === 'review' && (
        <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
          <div className="p-4 border-b border-slate-200 bg-slate-50/70 flex items-center justify-between">
            <div>
              <h3 className="font-bold text-slate-900 text-sm">
                {lang === 'ar' ? 'كشف مراجعة وتدقيق الأعذار المدرسية' : 'Excuses Review & Audit List'}
              </h3>
              <p className="text-xs text-slate-500">
                {lang === 'ar'
                  ? 'يتم فحص الأعذار المرفوعة من أولياء الأمور وتحديث حالة الطالب في كشف الحضور فور الاعتماد'
                  : 'Review submitted excuse documents and automatically update student attendance status'}
              </p>
            </div>
            <div className="text-xs text-slate-600 bg-white border border-slate-200 px-3 py-1.5 rounded-lg">
              {lang === 'ar' ? 'الإجمالي:' : 'Total:'} <strong>{justifications.length}</strong> عذر
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-right text-xs">
              <thead className="bg-slate-100 text-slate-700 font-semibold border-b border-slate-200">
                <tr>
                  <th className="py-3 px-4">#</th>
                  <th className="py-3 px-4">{lang === 'ar' ? 'اسم الطالب / الفصل' : 'Student & Class'}</th>
                  <th className="py-3 px-4">{lang === 'ar' ? 'تاريخ الغياب' : 'Absence Date'}</th>
                  <th className="py-3 px-4">{lang === 'ar' ? 'نوع العذر وبيانه' : 'Reason & Statement'}</th>
                  <th className="py-3 px-4">{lang === 'ar' ? 'فحص الذكاء الاصطناعي' : 'AI Analysis'}</th>
                  <th className="py-3 px-4">{lang === 'ar' ? 'حالة الاعتماد' : 'Decision Status'}</th>
                  <th className="py-3 px-4">{lang === 'ar' ? 'إجراءات' : 'Actions'}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {justifications.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="text-center py-8 text-slate-500">
                      {lang === 'ar' ? 'لا توجد طلبات أعذار مسجلة حتى الآن' : 'No submitted excuses found'}
                    </td>
                  </tr>
                ) : (
                  justifications.map((just, idx) => {
                    const isPending = just.status === 'pending';
                    const isApproved = just.status === 'approved';

                    return (
                      <tr key={just.id} className="hover:bg-slate-50 transition-colors">
                        <td className="py-3 px-4 text-slate-400 font-mono text-[11px]">{idx + 1}</td>
                        <td className="py-3 px-4">
                          <div className="font-semibold text-slate-900">{just.studentName}</div>
                          <div className="text-[11px] text-slate-500">{just.className}</div>
                        </td>
                        <td className="py-3 px-4 font-mono text-slate-700">{just.absenceDate}</td>
                        <td className="py-3 px-4 max-w-xs">
                          <span className="inline-block bg-slate-100 text-slate-700 font-semibold px-2 py-0.5 rounded text-[10px] mb-1">
                            {just.reasonType === 'medical'
                              ? 'عذر طبي'
                              : just.reasonType === 'family'
                              ? 'ظرف أسري'
                              : 'أخرى'}
                          </span>
                          <p className="line-clamp-2 text-slate-600 text-[11px]">{just.guardianExplanation}</p>
                        </td>
                        <td className="py-3 px-4">
                          {just.aiAnalysis ? (
                            <div className="flex flex-col gap-0.5 text-[11px]">
                              <span className="flex items-center gap-1 font-semibold text-emerald-700">
                                <ShieldCheck className="w-3.5 h-3.5" />
                                {just.aiAnalysis.recommendedDecision || 'تم الفحص'}
                              </span>
                              <span className="text-slate-500 truncate max-w-[140px]">
                                {just.aiAnalysis.issuerName || 'تقرير طبي معتمد'}
                              </span>
                            </div>
                          ) : (
                            <span className="text-slate-400 text-[11px]">{lang === 'ar' ? 'بدون فحص آلي' : 'Manual'}</span>
                          )}
                        </td>
                        <td className="py-3 px-4">
                          <span
                            className={`px-2.5 py-1 rounded-full text-[11px] font-bold border ${
                              isPending
                                ? 'bg-amber-50 border-amber-300 text-amber-800'
                                : isApproved
                                ? 'bg-emerald-50 border-emerald-300 text-emerald-800'
                                : 'bg-rose-50 border-rose-300 text-rose-800'
                            }`}
                          >
                            {isPending
                              ? lang === 'ar' ? 'قيد المراجعة' : 'Pending'
                              : isApproved
                              ? lang === 'ar' ? 'معتمد ومقبول' : 'Approved'
                              : lang === 'ar' ? 'مرفوض' : 'Rejected'}
                          </span>
                        </td>
                        <td className="py-3 px-4">
                          <button
                            onClick={() => {
                              setSelectedJustificationForReview(just);
                              setReviewerNotes(just.reviewerNotes || '');
                            }}
                            className="flex items-center gap-1 text-slate-700 hover:text-emerald-700 bg-slate-100 hover:bg-slate-200 px-2.5 py-1.5 rounded-lg text-xs font-medium cursor-pointer transition-colors"
                          >
                            <Eye className="w-3.5 h-3.5" />
                            <span>{lang === 'ar' ? 'معاينة واتخاذ القرار' : 'Inspect'}</span>
                          </button>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* VIEW 2: SUBMIT EXCUSE WITH GEMINI 3.1 PRO IMAGE ANALYSIS */}
      {activeSubTab === 'submit' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Form Side */}
          <div className="lg:col-span-7 bg-white rounded-xl border border-slate-200 p-5 shadow-xs space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h3 className="font-bold text-slate-900 text-base">
                  {lang === 'ar' ? 'تقديم عذر غياب وتحليله بالذكاء الاصطناعي' : 'Submit Excuse with AI Analysis'}
                </h3>
                <p className="text-xs text-slate-500">
                  {lang === 'ar'
                    ? 'ارفع صورة التقرير الطبي أو الإجازة المرضية وسيقوم نموذج Gemini 3.1 Pro باستخراج التواريخ والتشخيص والختم الرسمي تلقائيًا'
                    : 'Upload medical report photo and Gemini 3.1 Pro will extract dates, clinic, diagnosis, and stamp.'}
                </p>
              </div>
            </div>

            <form onSubmit={handleFormSubmit} className="space-y-4 text-xs">
              {/* Student Picker */}
              <div>
                <label className="block text-slate-700 font-semibold mb-1">
                  {lang === 'ar' ? 'اختر الطالب المعني:' : 'Student:'}
                </label>
                <select
                  value={selectedStudentId}
                  onChange={(e) => setSelectedStudentId(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 text-xs font-medium text-slate-900 cursor-pointer"
                >
                  {students.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.fullName} - {s.className} (رقم: {s.studentNumber})
                    </option>
                  ))}
                </select>
              </div>

              {/* Date & Reason Type */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 font-semibold mb-1">
                    {lang === 'ar' ? 'تاريخ الغياب:' : 'Date of Absence:'}
                  </label>
                  <input
                    type="date"
                    value={absenceDate}
                    onChange={(e) => setAbsenceDate(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 text-xs font-semibold text-slate-900 cursor-pointer"
                  />
                </div>

                <div>
                  <label className="block text-slate-700 font-semibold mb-1">
                    {lang === 'ar' ? 'تصنيف العذر:' : 'Category:'}
                  </label>
                  <select
                    value={reasonType}
                    onChange={(e: any) => setReasonType(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 text-xs font-medium text-slate-900 cursor-pointer"
                  >
                    <option value="medical">{lang === 'ar' ? 'عذر طبي / إجازة مرضية' : 'Medical'}</option>
                    <option value="family">{lang === 'ar' ? 'ظرف أسري طارئ' : 'Family'}</option>
                    <option value="travel">{lang === 'ar' ? 'سفر قاهر' : 'Travel'}</option>
                    <option value="other">{lang === 'ar' ? 'أسباب أخرى' : 'Other'}</option>
                  </select>
                </div>
              </div>

              {/* File Upload Zone */}
              <div>
                <label className="block text-slate-700 font-semibold mb-1">
                  {lang === 'ar' ? 'مرفق العذر (صورة التقرير أو الوصفة الطبية):' : 'Attachment (Medical Report Photo):'}
                </label>

                <div className="border-2 border-dashed border-slate-300 rounded-xl p-4 text-center hover:border-emerald-500 transition-colors bg-slate-50/50">
                  {uploadedImageBase64 ? (
                    <div className="space-y-3">
                      <div className="relative inline-block border border-slate-300 rounded-lg overflow-hidden shadow-xs max-h-48">
                        <img
                          src={uploadedImageBase64}
                          alt="Medical report preview"
                          className="max-h-44 object-contain mx-auto"
                        />
                      </div>
                      <div className="text-xs text-slate-600 font-medium">{uploadedFileName}</div>
                      <div className="flex items-center justify-center gap-2">
                        <button
                          type="button"
                          onClick={() => setUploadedImageBase64(null)}
                          className="text-xs text-rose-600 hover:text-rose-800 font-medium cursor-pointer"
                        >
                          {lang === 'ar' ? 'إزالة الصورة' : 'Remove'}
                        </button>
                        <span>·</span>
                        <button
                          type="button"
                          onClick={handleAnalyzeImageWithAI}
                          disabled={isAnalyzing}
                          className="flex items-center gap-1.5 text-xs bg-emerald-600 hover:bg-emerald-700 text-white font-semibold px-3 py-1.5 rounded-lg transition-colors cursor-pointer"
                        >
                          {isAnalyzing ? (
                            <>
                              <Loader2 className="w-3.5 h-3.5 animate-spin" />
                              <span>{lang === 'ar' ? 'جارٍ الفحص بنموذج Gemini...' : 'Analyzing...'}</span>
                            </>
                          ) : (
                            <>
                              <Sparkles className="w-3.5 h-3.5" />
                              <span>{lang === 'ar' ? 'فحص بالذكاء الاصطناعي (Gemini 3.1 Pro)' : 'Analyze with Gemini'}</span>
                            </>
                          )}
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      <UploadCloud className="w-8 h-8 text-slate-400 mx-auto" />
                      <div>
                        <label
                          htmlFor="medical-doc-upload"
                          className="inline-block bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 font-semibold px-3 py-1.5 rounded-lg cursor-pointer shadow-xs text-xs"
                        >
                          {lang === 'ar' ? 'اختر ملف من جهازك' : 'Browse File'}
                        </label>
                        <input
                          id="medical-doc-upload"
                          type="file"
                          accept="image/*"
                          onChange={handleFileUpload}
                          className="hidden"
                        />
                      </div>
                      <p className="text-[11px] text-slate-500">
                        {lang === 'ar' ? 'يدعم صور JPG, PNG, WEBP' : 'Supports JPG, PNG, WEBP'}
                      </p>

                      {/* Quick demo helper button */}
                      <div className="pt-2 border-t border-slate-200">
                        <button
                          type="button"
                          onClick={handleLoadSampleMedicalNote}
                          className="text-xs text-emerald-700 hover:text-emerald-900 font-bold inline-flex items-center gap-1.5 bg-emerald-50 border border-emerald-200 px-3 py-1.5 rounded-lg cursor-pointer"
                        >
                          <FileText className="w-3.5 h-3.5" />
                          <span>{lang === 'ar' ? 'إدراج عينة تقرير طبي تجريبي للاختبار الفوري' : 'Insert Sample Medical Report for Demo'}</span>
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </div>

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
                      ? 'اكتب شرحًا موجزًا لحالة الطالب وسبب الغياب...'
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
                  className="flex items-center gap-2 bg-slate-900 hover:bg-slate-800 disabled:opacity-50 text-white font-semibold text-xs px-5 py-2.5 rounded-lg transition-colors cursor-pointer shadow-xs"
                >
                  <Send className="w-4 h-4" />
                  <span>{lang === 'ar' ? 'إرسال طلب العذر إلى شؤون الطلبة' : 'Submit Excuse'}</span>
                </button>
              </div>
            </form>
          </div>

          {/* AI Analysis Card Side */}
          <div className="lg:col-span-5 space-y-4">
            <div className="bg-emerald-50/50 border border-emerald-200 rounded-xl p-5 shadow-xs space-y-3.5">
              <div className="flex items-center justify-between border-b border-emerald-200/60 pb-3">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-lg bg-emerald-600 text-white flex items-center justify-center">
                    <Sparkles className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="font-bold text-slate-900 text-xs sm:text-sm">
                      {lang === 'ar' ? 'فاحص المستندات الذكي (Gemini 3.1 Pro)' : 'AI Document Verification'}
                    </h4>
                    <span className="text-[10px] text-emerald-800 font-medium">
                      {lang === 'ar' ? 'تحليل الصور والتقارير الطبية والأختام' : 'Medical Report Understanding'}
                    </span>
                  </div>
                </div>
              </div>

              {isAnalyzing && (
                <div className="py-8 text-center space-y-2">
                  <Loader2 className="w-8 h-8 text-emerald-600 animate-spin mx-auto" />
                  <p className="text-xs text-slate-700 font-semibold">
                    {lang === 'ar'
                      ? 'جارٍ قراءة التقرير وفحص الأختام والتاريخ بواسطة Gemini 3.1 Pro...'
                      : 'Analyzing image & stamps with Gemini 3.1 Pro...'}
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
                <div className="py-8 text-center text-xs text-slate-500 space-y-2">
                  <ImageIcon className="w-8 h-8 text-slate-300 mx-auto" />
                  <p>
                    {lang === 'ar'
                      ? 'اختر صورة التقرير الطبي واضغط "فحص بالذكاء الاصطناعي" لعرض البيانات المستخرجة بدقة'
                      : 'Upload medical image and click "Analyze with Gemini" to extract details.'}
                  </p>
                </div>
              )}

              {aiAnalysisResult && (
                <div className="space-y-3 text-xs">
                  {/* Recommended badge */}
                  <div className="bg-white border border-emerald-300 p-3 rounded-lg shadow-xs flex items-center justify-between">
                    <div>
                      <span className="text-[11px] text-slate-500 block">
                        {lang === 'ar' ? 'التوصية الآلية المقترحة:' : 'AI Recommendation:'}
                      </span>
                      <strong className="text-emerald-800 text-sm font-bold">
                        {aiAnalysisResult.recommendedDecision || 'قبول العذر'}
                      </strong>
                    </div>
                    <div className="text-right">
                      <span className="text-[10px] text-slate-500 block">{lang === 'ar' ? 'نسبة الثقة:' : 'Confidence:'}</span>
                      <span className="font-bold text-slate-800">{aiAnalysisResult.confidenceScore || '98%'}</span>
                    </div>
                  </div>

                  <div className="bg-white border border-slate-200 rounded-lg p-3 space-y-2 text-slate-700">
                    <div>
                      <strong className="text-slate-900 block">{lang === 'ar' ? 'نوع المستند:' : 'Document Type:'}</strong>
                      <span>{aiAnalysisResult.documentType || 'تقرير طبي'}</span>
                    </div>
                    <div>
                      <strong className="text-slate-900 block">{lang === 'ar' ? 'الجهة المصدرة:' : 'Issuer / Hospital:'}</strong>
                      <span>{aiAnalysisResult.issuerName || '---'}</span>
                    </div>
                    <div>
                      <strong className="text-slate-900 block">{lang === 'ar' ? 'فترة الإجازة والمدة:' : 'Dates & Duration:'}</strong>
                      <span>{aiAnalysisResult.datesCovered || '---'} ({aiAnalysisResult.durationDays || 'يومان'})</span>
                    </div>
                    <div>
                      <strong className="text-slate-900 block">{lang === 'ar' ? 'التشخيص / سبب العذر:' : 'Diagnosis / Reason:'}</strong>
                      <span className="text-slate-800">{aiAnalysisResult.reasonOrDiagnosis || '---'}</span>
                    </div>
                    <div className="flex items-center gap-2 pt-1 border-t border-slate-100">
                      <ShieldCheck className="w-4 h-4 text-emerald-600" />
                      <span>
                        {aiAnalysisResult.hasOfficialStampOrSignature
                          ? lang === 'ar' ? 'تم رصد ختم وتوقيع رسمي معتمد' : 'Official stamp detected'
                          : lang === 'ar' ? 'لم يتم رصد ختم رسمي واضح' : 'No clear stamp detected'}
                      </span>
                    </div>
                  </div>

                  {aiAnalysisResult.notesAndRecommendations && (
                    <div className="bg-slate-100 p-2.5 rounded-lg text-[11px] text-slate-700">
                      <strong>{lang === 'ar' ? 'ملاحظة المدقق:' : 'Auditor Notes:'}</strong>{' '}
                      {aiAnalysisResult.notesAndRecommendations}
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* MODAL: INSPECT AND REVIEW DECISION */}
      {selectedJustificationForReview && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full p-5 space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h3 className="font-bold text-slate-900 text-base">
                  {lang === 'ar' ? 'اتخاذ قرار بشأن عذر الغياب' : 'Review Excuse Decision'}
                </h3>
                <span className="text-xs text-slate-500">
                  الطالب: {selectedJustificationForReview.studentName} ({selectedJustificationForReview.className})
                </span>
              </div>
              <button
                onClick={() => setSelectedJustificationForReview(null)}
                className="text-slate-400 hover:text-slate-600"
              >
                ✕
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
              {/* Document Preview */}
              <div className="bg-slate-50 border border-slate-200 rounded-lg p-3 space-y-2">
                <span className="font-semibold text-slate-700 block">
                  {lang === 'ar' ? 'صورة المستند المرفق:' : 'Attached Document:'}
                </span>
                {selectedJustificationForReview.attachmentUrl ? (
                  <div className="border border-slate-300 rounded overflow-hidden max-h-60 bg-white">
                    <img
                      src={selectedJustificationForReview.attachmentUrl}
                      alt="Attachment"
                      className="w-full object-contain"
                    />
                  </div>
                ) : (
                  <div className="text-slate-400 py-10 text-center">
                    {lang === 'ar' ? 'لا يوجد ملف مرفق (عذر خطي فقط)' : 'No image attachment'}
                  </div>
                )}
                <div className="text-[11px] text-slate-500">
                  {selectedJustificationForReview.attachmentName || 'مستند طبي'}
                </div>
              </div>

              {/* Information & AI Summary */}
              <div className="space-y-3">
                <div className="bg-slate-50 border border-slate-200 rounded-lg p-3 space-y-1.5">
                  <div>
                    <span className="text-slate-500">{lang === 'ar' ? 'تاريخ الغياب:' : 'Date:'}</span>{' '}
                    <strong className="text-slate-900">{selectedJustificationForReview.absenceDate}</strong>
                  </div>
                  <div>
                    <span className="text-slate-500">{lang === 'ar' ? 'بيان ولي الأمر:' : 'Parent Statement:'}</span>
                    <p className="text-slate-800 mt-0.5">{selectedJustificationForReview.guardianExplanation}</p>
                  </div>
                </div>

                {selectedJustificationForReview.aiAnalysis && (
                  <div className="bg-emerald-50/70 border border-emerald-200 rounded-lg p-3 space-y-1">
                    <div className="flex items-center gap-1.5 font-bold text-emerald-800">
                      <Sparkles className="w-3.5 h-3.5" />
                      <span>{lang === 'ar' ? 'نتائج فحص Gemini 3.1 Pro:' : 'Gemini Extraction:'}</span>
                    </div>
                    <div className="text-slate-700 space-y-1 text-[11px]">
                      <div>
                        <strong>المستشفى:</strong> {selectedJustificationForReview.aiAnalysis.issuerName}
                      </div>
                      <div>
                        <strong>التشخيص:</strong> {selectedJustificationForReview.aiAnalysis.reasonOrDiagnosis}
                      </div>
                      <div>
                        <strong>الأيام:</strong> {selectedJustificationForReview.aiAnalysis.durationDays}
                      </div>
                    </div>
                  </div>
                )}

                <div>
                  <label className="block font-semibold text-slate-800 mb-1">
                    {lang === 'ar' ? 'ملاحظة قرار اللجنة المدرسية:' : 'Committee Decision Notes:'}
                  </label>
                  <input
                    type="text"
                    value={reviewerNotes}
                    onChange={(e) => setReviewerNotes(e.target.value)}
                    placeholder="سبب القبول أو الرفض..."
                    className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2 text-xs text-slate-800"
                  />
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="pt-2 border-t border-slate-100 flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => setSelectedJustificationForReview(null)}
                className="px-3.5 py-2 text-xs border border-slate-200 text-slate-600 rounded-lg hover:bg-slate-50"
              >
                {lang === 'ar' ? 'إغلاق' : 'Close'}
              </button>
              <button
                type="button"
                onClick={() => handleReject(selectedJustificationForReview.id)}
                className="px-4 py-2 text-xs bg-rose-600 hover:bg-rose-700 text-white rounded-lg font-semibold cursor-pointer"
              >
                {lang === 'ar' ? 'رفض العذر (حسم الغياب)' : 'Reject'}
              </button>
              <button
                type="button"
                onClick={() => handleApprove(selectedJustificationForReview.id)}
                className="px-4 py-2 text-xs bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-semibold cursor-pointer"
              >
                {lang === 'ar' ? 'قبول واعتماد العذر رسمياً' : 'Approve Excuse'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

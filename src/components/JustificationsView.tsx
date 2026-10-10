import React, { useState } from 'react';
import { useAttendance } from '../context/AttendanceContext';
import { Justification } from '../types/attendance';
import {
  generateSampleMedicalNoteBase64,
  generateSampleIrregularMedicalNoteBase64,
} from '../utils/sampleImages';
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
  AlertTriangle,
  CheckCircle2,
  ShieldAlert,
  Search,
  Filter,
  Check,
  RotateCcw,
  ExternalLink,
  ChevronRight,
  UserCheck,
  BadgeAlert,
  Sliders,
  FileWarning,
} from 'lucide-react';

export const JustificationsView: React.FC = () => {
  const {
    justifications,
    students,
    currentUser,
    lang,
    createJustification,
    reviewJustification,
    updateJustificationAnalysis,
  } = useAttendance();

  const isParent = currentUser.role === 'parent';

  // Active sub-tab
  const [activeSubTab, setActiveSubTab] = useState<'review' | 'submit'>('review');

  // Review List Filters
  const [statusFilter, setStatusFilter] = useState<'all' | 'pending' | 'approved' | 'rejected' | 'irregularities'>('all');
  const [searchQuery, setSearchQuery] = useState('');

  // Submit form state
  const [selectedStudentId, setSelectedStudentId] = useState<string>(students[0]?.id || '');
  const [absenceDate, setAbsenceDate] = useState<string>(
    new Date().toISOString().split('T')[0]
  );
  const [reasonType, setReasonType] = useState<'medical' | 'family' | 'travel' | 'other'>('medical');
  const [guardianExplanation, setGuardianExplanation] = useState<string>('');
  const [uploadedImageBase64, setUploadedImageBase64] = useState<string | null>(null);
  const [uploadedFileName, setUploadedFileName] = useState<string>('');

  // AI Verification state in Submit Form
  const [isAnalyzing, setIsAnalyzing] = useState<boolean>(false);
  const [aiAnalysisResult, setAiAnalysisResult] = useState<any>(null);
  const [analysisError, setAnalysisError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  // Review modal state
  const [selectedJustificationForReview, setSelectedJustificationForReview] = useState<Justification | null>(null);
  const [reviewerNotes, setReviewerNotes] = useState<string>('');
  const [isReanalyzing, setIsReanalyzing] = useState<boolean>(false);
  const [reanalysisError, setReanalysisError] = useState<string | null>(null);

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
      setAnalysisError(null);
    };
    reader.readAsDataURL(file);
  };

  // Insert generated legitimate sample medical note
  const handleLoadSampleMedicalNote = () => {
    const student = students.find((s) => s.id === selectedStudentId);
    const sample = generateSampleMedicalNoteBase64(
      student?.fullName || 'يوسف بن خالد المطيري',
      'مستشفى الملك فيصل التخصصي ومركز الأبحاث'
    );
    setUploadedImageBase64(sample);
    setUploadedFileName('medical_report_legitimate_2026.jpg');
    setGuardianExplanation(
      'مرفق تقرير إجازة مرضية رسمي ومعتمد من طوارئ مستشفى الملك فيصل التخصصي يفيد بالراحة لمدة يومين.'
    );
    setAiAnalysisResult(null);
    setAnalysisError(null);
  };

  // Insert generated irregular sample medical note with intentional discrepancies
  const handleLoadSampleIrregularNote = () => {
    const sample = generateSampleIrregularMedicalNoteBase64(
      'عبدالله بن فهد الدوسري', // Discrepant name
      '2024-03-12' // Outdated date
    );
    setUploadedImageBase64(sample);
    setUploadedFileName('medical_note_inconsistent_sample.jpg');
    setGuardianExplanation(
      'مرفق تقرير استشارة طبية أولية للمطابقة والتدقيق.'
    );
    setAiAnalysisResult(null);
    setAnalysisError(null);
  };

  // Call server-side /api/analyze-image endpoint (Gemini with irregularity checking)
  const handleAnalyzeImageWithAI = async () => {
    if (!uploadedImageBase64) {
      alert(lang === 'ar' ? 'يرجى اختيار أو رفع صورة التقرير الطبي أولاً' : 'Please upload medical image first');
      return;
    }

    setIsAnalyzing(true);
    setAnalysisError(null);

    const student = students.find((s) => s.id === selectedStudentId);

    try {
      const res = await fetch('/api/analyze-image', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          imageBase64: uploadedImageBase64,
          mimeType: 'image/jpeg',
          expectedStudentName: student?.fullName || '',
          expectedAbsenceDate: absenceDate,
          studentGrade: student?.grade || '',
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
        err.message || 'تعذر استكمال فحص الصورة بالذكاء الاصطناعي. يمكنك مواصلة التقديم يدويًا.'
      );
    } finally {
      setIsAnalyzing(false);
    }
  };

  // Trigger Gemini Deep Verification on an existing justification in Review Modal
  const handleReanalyzeJustificationWithAI = async (just: Justification) => {
    setIsReanalyzing(true);
    setReanalysisError(null);

    try {
      // Use existing image or generate a standard canvas sample if only a filename was stored
      let base64ToScan = just.attachmentUrl;
      if (!base64ToScan) {
        // Synthesize image based on justification properties
        if (just.id === 'just-003') {
          base64ToScan = generateSampleIrregularMedicalNoteBase64('عبدالله بن فهد الدوسري', '2024-03-12');
        } else {
          base64ToScan = generateSampleMedicalNoteBase64(just.studentName, 'مستشفى الملك فيصل التخصصي');
        }
      }

      const student = students.find((s) => s.id === just.studentId);

      const res = await fetch('/api/analyze-image', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          imageBase64: base64ToScan,
          mimeType: just.attachmentMime || 'image/jpeg',
          expectedStudentName: just.studentName,
          expectedAbsenceDate: just.absenceDate,
          studentGrade: student?.grade || just.className,
          promptCustom: `تدقيق رسمي لعذر الطالب: ${just.studentName}، تاريخ الغياب: ${just.absenceDate}`,
        }),
      });

      if (!res.ok) {
        throw new Error(`خطأ في استجابة الخادم: ${res.status}`);
      }

      const data = await res.json();
      const newAnalysis = data.analysis;

      // Update both Context state and modal local state
      updateJustificationAnalysis(just.id, newAnalysis);
      setSelectedJustificationForReview({
        ...just,
        attachmentUrl: base64ToScan,
        aiAnalysis: newAnalysis,
      });

      // Suggest reviewer note if rationale provided
      if (newAnalysis?.decisionRationale && !reviewerNotes) {
        setReviewerNotes(newAnalysis.decisionRationale);
      }
    } catch (err: any) {
      console.error('Error re-analyzing justification:', err);
      setReanalysisError(err.message || 'فشل تشغيل أداة التحقق الذكية للمستند.');
    } finally {
      setIsReanalyzing(false);
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
    reviewJustification(justId, 'approved', reviewerNotes || 'تم التحقق واعتماد العذر الطبي رسمياً.');
    setSelectedJustificationForReview(null);
    setReviewerNotes('');
  };

  const handleReject = (justId: string) => {
    reviewJustification(justId, 'rejected', reviewerNotes || 'العذر غير مطابق أو لا يفي بالشروط المعتمدة.');
    setSelectedJustificationForReview(null);
    setReviewerNotes('');
  };

  // Filtered Justifications in review list
  const filteredJustifications = justifications.filter((j) => {
    if (statusFilter === 'pending' && j.status !== 'pending') return false;
    if (statusFilter === 'approved' && j.status !== 'approved') return false;
    if (statusFilter === 'rejected' && j.status !== 'rejected') return false;
    if (statusFilter === 'irregularities') {
      const hasIrreg =
        j.aiAnalysis?.verificationStatus === 'irregular' ||
        (j.aiAnalysis?.irregularities && j.aiAnalysis.irregularities.length > 0) ||
        j.aiAnalysis?.overallRiskLevel === 'high';
      if (!hasIrreg) return false;
    }

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchStudent = j.studentName.toLowerCase().includes(q);
      const matchClass = j.className.toLowerCase().includes(q);
      const matchExp = j.guardianExplanation.toLowerCase().includes(q);
      const matchIssuer = (j.aiAnalysis?.issuerName || '').toLowerCase().includes(q);
      if (!matchStudent && !matchClass && !matchExp && !matchIssuer) return false;
    }

    return true;
  });

  const pendingCount = justifications.filter((j) => j.status === 'pending').length;
  const irregularCount = justifications.filter(
    (j) =>
      j.aiAnalysis?.verificationStatus === 'irregular' ||
      (j.aiAnalysis?.irregularities && j.aiAnalysis.irregularities.length > 0) ||
      j.aiAnalysis?.overallRiskLevel === 'high'
  ).length;

  return (
    <div className="space-y-6">
      {/* Sub-Tabs: Review vs Submit */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-slate-200 pb-3 gap-3">
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
            <span>
              {isParent
                ? lang === 'ar'
                  ? 'أعذار ومتابعة أبنائي'
                  : 'My Children Excuses'
                : lang === 'ar'
                ? 'كشف تدقيق وقرارات الأعذار'
                : 'Excuses Roster & Audit'}
            </span>
            {pendingCount > 0 && (
              <span className="bg-amber-400 text-slate-950 px-1.5 py-0.2 rounded-full text-[10px] font-bold">
                {pendingCount}
              </span>
            )}
            {!isParent && irregularCount > 0 && (
              <span className="bg-rose-500 text-white px-1.5 py-0.2 rounded-full text-[10px] font-bold flex items-center gap-0.5">
                <ShieldAlert className="w-2.5 h-2.5" />
                <span>{irregularCount}</span>
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
            <span>
              {isParent
                ? lang === 'ar'
                  ? 'تقديم عذر جديد لابني/ابنتي'
                  : 'Submit Child Excuse'
                : lang === 'ar'
                ? 'تقديم عذر جديد وفحص المستند بالذكاء الاصطناعي'
                : 'New Excuse & AI Verification'}
            </span>
          </button>
        </div>

        {/* Feature Banner Badge */}
        <div className="flex items-center gap-2 bg-emerald-50 border border-emerald-200 text-emerald-900 px-3 py-1.5 rounded-lg text-xs">
          <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
          <span className="font-semibold text-[11px]">
            {lang === 'ar'
              ? 'نظام التحقق الجنائي الذكي (Gemini Vision Verification)'
              : 'AI Document Verification & Anti-Fraud Engine'}
          </span>
        </div>
      </div>

      {/* ======================================================== */}
      {/* VIEW 1: REVIEW ROSTER & AUDIT */}
      {/* ======================================================== */}
      {activeSubTab === 'review' && (
        <div className="space-y-4">
          {/* Quick AI Irregularities Alert Card (For School Staff) */}
          {!isParent && irregularCount > 0 && (
            <div className="bg-rose-50 border border-rose-300 rounded-xl p-4 text-rose-950 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-xs">
              <div className="flex items-start gap-3">
                <div className="w-9 h-9 rounded-lg bg-rose-600 text-white flex items-center justify-center shrink-0">
                  <ShieldAlert className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="font-bold text-xs sm:text-sm text-rose-900 flex items-center gap-1.5">
                    <span>{lang === 'ar' ? 'تنبيه تدقيق: تم رصد تناقضات وشبهات في بعض المستندات المرفوعة' : 'Audit Notice: Irregularities Flagged in Excuse Documents'}</span>
                    <span className="bg-rose-200 text-rose-900 px-2 py-0.2 rounded-full text-[10px] font-bold">
                      {irregularCount} {lang === 'ar' ? 'أعذار مشبوهة' : 'flagged'}
                    </span>
                  </h4>
                  <p className="text-xs text-rose-800 leading-relaxed mt-0.5">
                    {lang === 'ar'
                      ? 'رصد محرك الذكاء الاصطناعي عدم تطابق في أسماء الطلاب أو تواريخ التقارير أو غياب الأختام الرسمية المعتمدة. يرجى معاينة الحالات واتخاذ القرار الإداري.'
                      : 'AI detected discrepancies in student names, examination dates, or missing official seals.'}
                  </p>
                </div>
              </div>

              <button
                onClick={() => setStatusFilter('irregularities')}
                className="bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold px-4 py-2 rounded-lg cursor-pointer transition-colors shrink-0 flex items-center gap-1.5"
              >
                <Filter className="w-3.5 h-3.5" />
                <span>{lang === 'ar' ? 'عرض المستندات المشبوهة فقط' : 'View Flagged Only'}</span>
              </button>
            </div>
          )}

          {/* Roster Container */}
          <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
            <div className="p-4 border-b border-slate-200 bg-slate-50/70 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h3 className="font-bold text-slate-900 text-sm">
                  {isParent
                    ? lang === 'ar'
                      ? 'سجل وقرارات أعذار أبنائي'
                      : 'My Children Excuses Tracker'
                    : lang === 'ar'
                    ? 'كشف مراجعة وتدقيق الأعذار المدرسية'
                    : 'Excuses Review & Audit List'}
                </h3>
                <p className="text-xs text-slate-500">
                  {isParent
                    ? lang === 'ar'
                      ? 'متابعة حالة الاعتماد الرسمية وملاحظات المدرسة للأعذار المرفوعة لأبنائكم'
                      : 'Track review decisions and school notes for submitted excuses'
                    : lang === 'ar'
                    ? 'فحص الوثائق بالذكاء الاصطناعي لكشف التزوير وتحديث حالة الطالب في كشف الحضور فور الاعتماد'
                    : 'Analyze documents with Gemini to flag inconsistencies and update attendance'}
                </p>
              </div>

              {/* Filters Strip */}
              <div className="flex items-center gap-2 flex-wrap">
                <div className="flex items-center gap-1 bg-white border border-slate-200 rounded-lg p-1 text-xs">
                  {[
                    { id: 'all', label: lang === 'ar' ? 'الكل' : 'All', count: justifications.length },
                    { id: 'pending', label: lang === 'ar' ? 'قيد المراجعة' : 'Pending', count: pendingCount },
                    { id: 'approved', label: lang === 'ar' ? 'معتمد' : 'Approved' },
                    { id: 'rejected', label: lang === 'ar' ? 'مرفوض' : 'Rejected' },
                    ...(!isParent && irregularCount > 0
                      ? [{ id: 'irregularities', label: lang === 'ar' ? '⚠️ تنبيهات واشتباهات' : 'Flagged', count: irregularCount }]
                      : []),
                  ].map((tab) => (
                    <button
                      key={tab.id}
                      onClick={() => setStatusFilter(tab.id as any)}
                      className={`py-1 px-2.5 rounded-md font-semibold text-[11px] transition-colors cursor-pointer flex items-center gap-1 ${
                        statusFilter === tab.id
                          ? tab.id === 'irregularities'
                            ? 'bg-rose-600 text-white font-bold'
                            : 'bg-slate-900 text-white font-bold'
                          : 'text-slate-600 hover:bg-slate-100'
                      }`}
                    >
                      <span>{tab.label}</span>
                      {tab.count !== undefined && (
                        <span className="text-[10px] opacity-80 font-mono">({tab.count})</span>
                      )}
                    </button>
                  ))}
                </div>

                <div className="relative w-48">
                  <Search className="w-3 h-3 text-slate-400 absolute right-2.5 top-2.5" />
                  <input
                    type="text"
                    placeholder={lang === 'ar' ? 'بحث بالطالب أو المستشفى...' : 'Search...'}
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full bg-white border border-slate-200 rounded-lg pr-7 pl-2 py-1.5 text-xs focus:ring-1 focus:ring-emerald-500"
                  />
                </div>
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
                    <th className="py-3 px-4">{lang === 'ar' ? 'فحص الذكاء الاصطناعي (Gemini)' : 'AI Verification Status'}</th>
                    <th className="py-3 px-4">{lang === 'ar' ? 'حالة الاعتماد' : 'Decision Status'}</th>
                    <th className="py-3 px-4">{lang === 'ar' ? 'إجراءات' : 'Actions'}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredJustifications.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="text-center py-10 text-slate-500">
                        <FileText className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                        <span>{lang === 'ar' ? 'لا توجد طلبات أعذار مطابقة للفلاتر' : 'No matching excuse requests found'}</span>
                      </td>
                    </tr>
                  ) : (
                    filteredJustifications.map((just, idx) => {
                      const isPending = just.status === 'pending';
                      const isApproved = just.status === 'approved';
                      const isRejected = just.status === 'rejected';

                      const analysis = just.aiAnalysis;
                      const isIrregular =
                        analysis?.verificationStatus === 'irregular' ||
                        (analysis?.irregularities && analysis.irregularities.length > 0) ||
                        analysis?.overallRiskLevel === 'high';
                      const isVerified = analysis?.verificationStatus === 'verified' && !isIrregular;

                      return (
                        <tr
                          key={just.id}
                          className={`hover:bg-slate-50 transition-colors ${
                            isIrregular ? 'bg-rose-50/30' : ''
                          }`}
                        >
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

                          {/* AI Verification Tool Result Column */}
                          <td className="py-3 px-4">
                            {analysis ? (
                              <div className="flex flex-col gap-1 text-[11px]">
                                {isIrregular ? (
                                  <div className="space-y-0.5">
                                    <span className="inline-flex items-center gap-1 bg-rose-100 border border-rose-300 text-rose-900 font-bold px-2 py-0.5 rounded-md text-[10px]">
                                      <ShieldAlert className="w-3 h-3 text-rose-600 shrink-0" />
                                      <span>
                                        {lang === 'ar' ? '⚠️ رصد تناقض أو اشتباه' : 'Irregularities Flagged'}
                                      </span>
                                    </span>
                                    {analysis.irregularities && analysis.irregularities[0] && (
                                      <div className="text-[10px] text-rose-700 truncate max-w-[170px]" title={analysis.irregularities[0].titleAr}>
                                        • {analysis.irregularities[0].titleAr}
                                      </div>
                                    )}
                                  </div>
                                ) : isVerified ? (
                                  <div className="space-y-0.5">
                                    <span className="inline-flex items-center gap-1 bg-emerald-100 border border-emerald-300 text-emerald-900 font-bold px-2 py-0.5 rounded-md text-[10px]">
                                      <ShieldCheck className="w-3 h-3 text-emerald-600 shrink-0" />
                                      <span>
                                        {lang === 'ar' ? '✓ موثوق ومطابق' : 'Verified - Low Risk'}
                                      </span>
                                      {analysis.integrityScore && (
                                        <span className="font-mono text-[9px] text-emerald-700">({analysis.integrityScore}%)</span>
                                      )}
                                    </span>
                                    <span className="text-slate-500 truncate max-w-[170px] block text-[10px]">
                                      {analysis.issuerName || 'منشأة معتمدة'}
                                    </span>
                                  </div>
                                ) : (
                                  <div className="space-y-0.5">
                                    <span className="inline-flex items-center gap-1 bg-amber-100 border border-amber-300 text-amber-900 font-semibold px-2 py-0.5 rounded-md text-[10px]">
                                      <AlertCircle className="w-3 h-3 text-amber-600 shrink-0" />
                                      <span>{analysis.recommendedDecision || 'يتطلب مراجعة'}</span>
                                    </span>
                                  </div>
                                )}
                              </div>
                            ) : (
                              <span className="text-slate-400 text-[11px] flex items-center gap-1">
                                <Sparkles className="w-3 h-3" />
                                <span>{lang === 'ar' ? 'غير مفحوص آلياً' : 'Manual'}</span>
                              </span>
                            )}
                          </td>

                          {/* Decision Status Column */}
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

                          {/* Action Column */}
                          <td className="py-3 px-4">
                            <button
                              onClick={() => {
                                setSelectedJustificationForReview(just);
                                setReviewerNotes(just.reviewerNotes || '');
                                setReanalysisError(null);
                              }}
                              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold cursor-pointer transition-colors ${
                                isIrregular
                                  ? 'bg-rose-600 hover:bg-rose-700 text-white shadow-xs'
                                  : 'bg-slate-100 hover:bg-slate-200 text-slate-800'
                              }`}
                            >
                              <Eye className="w-3.5 h-3.5" />
                              <span>
                                {isParent
                                  ? lang === 'ar' ? 'عرض التفاصيل' : 'View Details'
                                  : isIrregular
                                  ? lang === 'ar' ? 'معاينة التناقضات' : 'Inspect Irregularities'
                                  : lang === 'ar' ? 'معاينة وفحص' : 'Inspect & Decide'}
                              </span>
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
        </div>
      )}

      {/* ======================================================== */}
      {/* VIEW 2: SUBMIT EXCUSE WITH GEMINI 3.8 AI VERIFICATION */}
      {/* ======================================================== */}
      {activeSubTab === 'submit' && (
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

            <form onSubmit={handleFormSubmit} className="space-y-4 text-xs">
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
                    accept="image/*"
                    id="medical-file-input"
                    className="hidden"
                    onChange={handleFileUpload}
                  />
                  <label
                    htmlFor="medical-file-input"
                    className="cursor-pointer inline-flex flex-col items-center gap-1.5"
                  >
                    <UploadCloud className="w-7 h-7 text-emerald-600" />
                    <span className="font-bold text-slate-800 text-xs">
                      {uploadedFileName || (lang === 'ar' ? 'انقر لرفع صورة التقرير الطبي (JPG, PNG)' : 'Click to upload medical image')}
                    </span>
                    <span className="text-[10px] text-slate-500">
                      {lang === 'ar' ? 'أو استخدم الأزرار التجريبية السريعة أدناه لاختبار فحص الذكاء الاصطناعي' : 'or load a test sample below'}
                    </span>
                  </label>

                  {/* Test Sample Helpers: Legitimate vs Irregular */}
                  <div className="pt-2 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-center gap-2">
                    <button
                      type="button"
                      onClick={handleLoadSampleMedicalNote}
                      className="w-full sm:w-auto text-[11px] text-emerald-800 font-bold inline-flex items-center justify-center gap-1.5 bg-emerald-100 hover:bg-emerald-200 border border-emerald-300 px-3 py-1.5 rounded-lg cursor-pointer transition-colors"
                    >
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                      <span>{lang === 'ar' ? '✓ إدراج تقرير طبي معتمد وسليم للاختبار' : 'Insert Valid Medical Report'}</span>
                    </button>

                    <button
                      type="button"
                      onClick={handleLoadSampleIrregularNote}
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
                    onClick={handleAnalyzeImageWithAI}
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
                            <span>{aiAnalysisResult.recommendedDecision || (lang === 'ar' ? 'رفض العذر (تم رصد تناقض)' : 'Reject Excuse')}</span>
                          </>
                        ) : (
                          <>
                            <ShieldCheck className="w-4 h-4 text-emerald-600" />
                            <span>{aiAnalysisResult.recommendedDecision || (lang === 'ar' ? 'قبول العذر (مستند موثوق)' : 'Approve Excuse')}</span>
                          </>
                        )}
                      </strong>
                    </div>

                    <div className="text-left font-mono">
                      <span className="text-[10px] opacity-75 block">{lang === 'ar' ? 'مؤشر الأصالة:' : 'Integrity:'}</span>
                      <span className="text-sm font-bold">
                        {aiAnalysisResult.integrityScore ? `${aiAnalysisResult.integrityScore}%` : (aiAnalysisResult.confidenceScore || '---')}
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
                                  irreg.severity === 'high'
                                    ? 'bg-rose-600 text-white'
                                    : 'bg-amber-100 text-amber-800'
                                }`}
                              >
                                {irreg.severity === 'high' ? 'حرج' : 'متوسط'}
                              </span>
                            </div>
                            <p className="text-slate-700 text-[11px] leading-relaxed">
                              {irreg.descriptionAr}
                            </p>
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
                                  <span className="text-[10px] opacity-80 line-clamp-1">
                                    {check.details}
                                  </span>
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
      )}

      {/* ======================================================== */}
      {/* MODAL: INSPECT, AI VERIFY, AND REVIEW DECISION */}
      {/* ======================================================== */}
      {selectedJustificationForReview && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-5 z-50 overflow-y-auto">
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
                    <span>الطالب: <strong className="text-slate-800">{selectedJustificationForReview.studentName}</strong></span>
                    <span>•</span>
                    <span>الفصل: {selectedJustificationForReview.className}</span>
                    <span>•</span>
                    <span>تاريخ الغياب: <strong className="font-mono text-slate-800">{selectedJustificationForReview.absenceDate}</strong></span>
                  </div>
                </div>
              </div>
              <button
                onClick={() => setSelectedJustificationForReview(null)}
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
                    onClick={() => handleReanalyzeJustificationWithAI(selectedJustificationForReview)}
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
                          {selectedJustificationForReview.aiAnalysis
                            ? (lang === 'ar' ? 'إعادة فحص المستند بالذكاء الاصطناعي' : 'Re-verify with Gemini')
                            : (lang === 'ar' ? 'تشغيل أداة التحقق الذكية الآن' : 'Run AI Verification')}
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
                      {selectedJustificationForReview.attachmentName || 'medical_report.jpg'}
                    </span>
                  </div>

                  <div className="border border-slate-300 rounded-lg overflow-hidden bg-white flex-1 min-h-[220px] max-h-[380px] flex items-center justify-center">
                    {selectedJustificationForReview.attachmentUrl ? (
                      <img
                        src={selectedJustificationForReview.attachmentUrl}
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
                            onClick={() => handleReanalyzeJustificationWithAI(selectedJustificationForReview)}
                            className="text-[11px] text-emerald-700 font-bold underline cursor-pointer"
                          >
                            {lang === 'ar' ? 'تحميل العينة وتفعيل الفاحص الذكي' : 'Load sample & run verification'}
                          </button>
                        )}
                      </div>
                    )}
                  </div>

                  <div className="bg-white border border-slate-200 rounded-lg p-2.5 text-xs text-slate-700 space-y-1">
                    <span className="font-bold text-slate-900 block">{lang === 'ar' ? 'شرح وبيان ولي الأمر:' : 'Parent Statement:'}</span>
                    <p className="leading-relaxed">{selectedJustificationForReview.guardianExplanation}</p>
                  </div>
                </div>

                {/* AI Verification Report & Decision Details (Right) */}
                <div className="lg:col-span-7 space-y-3.5">
                  {selectedJustificationForReview.aiAnalysis ? (
                    <div className="space-y-3 text-xs">
                      {/* Integrity & Verdict Header */}
                      <div
                        className={`p-3.5 rounded-xl border flex items-center justify-between ${
                          selectedJustificationForReview.aiAnalysis.verificationStatus === 'irregular' ||
                          (selectedJustificationForReview.aiAnalysis.irregularities &&
                            selectedJustificationForReview.aiAnalysis.irregularities.length > 0)
                            ? 'bg-rose-50 border-rose-300 text-rose-950'
                            : selectedJustificationForReview.aiAnalysis.verificationStatus === 'verified'
                            ? 'bg-emerald-50 border-emerald-300 text-emerald-950'
                            : 'bg-amber-50 border-amber-300 text-amber-950'
                        }`}
                      >
                        <div>
                          <span className="text-[10px] font-semibold opacity-75 block">
                            {lang === 'ar' ? 'نتيجة التدقيق وتوصية الذكاء الاصطناعي:' : 'Verification Verdict:'}
                          </span>
                          <strong className="text-sm font-bold flex items-center gap-1.5 mt-0.5">
                            {selectedJustificationForReview.aiAnalysis.verificationStatus === 'irregular' ||
                            (selectedJustificationForReview.aiAnalysis.irregularities &&
                              selectedJustificationForReview.aiAnalysis.irregularities.length > 0) ? (
                              <>
                                <ShieldAlert className="w-4 h-4 text-rose-600" />
                                <span>{selectedJustificationForReview.aiAnalysis.recommendedDecision || 'رفض العذر (رصد تناقض)'}</span>
                              </>
                            ) : (
                              <>
                                <ShieldCheck className="w-4 h-4 text-emerald-600" />
                                <span>{selectedJustificationForReview.aiAnalysis.recommendedDecision || 'قبول العذر (مطابق للشروط)'}</span>
                              </>
                            )}
                          </strong>
                        </div>

                        <div className="text-left font-mono">
                          <span className="text-[10px] opacity-75 block">{lang === 'ar' ? 'مؤشر الأصالة:' : 'Integrity Score:'}</span>
                          <span className="text-sm font-bold">
                            {selectedJustificationForReview.aiAnalysis.integrityScore
                              ? `${selectedJustificationForReview.aiAnalysis.integrityScore}%`
                              : (selectedJustificationForReview.aiAnalysis.confidenceScore || '---')}
                          </span>
                        </div>
                      </div>

                      {/* Flagged Irregularities Container */}
                      {selectedJustificationForReview.aiAnalysis.irregularities &&
                        selectedJustificationForReview.aiAnalysis.irregularities.length > 0 && (
                          <div className="bg-rose-50 border border-rose-300 rounded-xl p-3.5 space-y-2">
                            <div className="flex items-center gap-1.5 text-rose-900 font-bold text-xs">
                              <FileWarning className="w-4 h-4 text-rose-600 shrink-0" />
                              <span>
                                {lang === 'ar'
                                  ? `التناقضات والمخالفات المرصودة في المستند (${selectedJustificationForReview.aiAnalysis.irregularities.length}):`
                                  : `Flagged Inconsistencies (${selectedJustificationForReview.aiAnalysis.irregularities.length}):`}
                              </span>
                            </div>
                            <div className="space-y-2">
                              {selectedJustificationForReview.aiAnalysis.irregularities.map((irreg, i) => (
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
                                        irreg.severity === 'high'
                                          ? 'bg-rose-600 text-white'
                                          : 'bg-amber-100 text-amber-800'
                                      }`}
                                    >
                                      {irreg.severity === 'high' ? 'حرج' : 'متوسط'}
                                    </span>
                                  </div>
                                  <p className="text-slate-700 text-[11px] leading-relaxed">
                                    {irreg.descriptionAr}
                                  </p>
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
                      {selectedJustificationForReview.aiAnalysis.checklist && (
                        <div className="bg-slate-50 border border-slate-200 rounded-xl p-3 space-y-2 text-xs">
                          <span className="font-bold text-slate-800 block text-[11px]">
                            {lang === 'ar' ? 'معايير التدقيق الستة (Verification Checklist):' : '6-Point Verification Checklist:'}
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
                              const check = selectedJustificationForReview.aiAnalysis?.checklist?.[item.key];
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
                                      <span className="text-[10px] opacity-80 line-clamp-1">
                                        {check.details}
                                      </span>
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
                          <strong className="text-slate-900">{selectedJustificationForReview.aiAnalysis.documentType || '---'}</strong>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-slate-500">{lang === 'ar' ? 'الجهة المصدرة:' : 'Issuer:'}</span>
                          <strong className="text-slate-900">{selectedJustificationForReview.aiAnalysis.issuerName || '---'}</strong>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-slate-500">{lang === 'ar' ? 'اسم الطبيب:' : 'Physician:'}</span>
                          <strong className="text-slate-900">{selectedJustificationForReview.aiAnalysis.physicianName || '---'}</strong>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-slate-500">{lang === 'ar' ? 'فترة الإجازة والمدة:' : 'Leave Dates:'}</span>
                          <strong className="text-slate-900">
                            {selectedJustificationForReview.aiAnalysis.datesCovered || '---'} ({selectedJustificationForReview.aiAnalysis.durationDays || 'يوم'})
                          </strong>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-slate-500">{lang === 'ar' ? 'التشخيص الطبي:' : 'Diagnosis:'}</span>
                          <strong className="text-slate-900">{selectedJustificationForReview.aiAnalysis.reasonOrDiagnosis || '---'}</strong>
                        </div>
                      </div>

                      {/* Auto Apply Recommendation helper for committee */}
                      {!isParent && selectedJustificationForReview.aiAnalysis.decisionRationale && (
                        <div className="flex items-center justify-between bg-slate-100 p-2.5 rounded-lg text-[11px]">
                          <span className="text-slate-600">
                            <strong>{lang === 'ar' ? 'تسبيب القرار المقترح:' : 'Suggested Rationale:'}</strong>{' '}
                            {selectedJustificationForReview.aiAnalysis.decisionRationale}
                          </span>
                          <button
                            type="button"
                            onClick={() =>
                              setReviewerNotes(
                                selectedJustificationForReview.aiAnalysis?.decisionRationale || ''
                              )
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
                        {selectedJustificationForReview.reviewerNotes ||
                          (selectedJustificationForReview.status === 'pending'
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
                {selectedJustificationForReview.reviewedBy ? (
                  <span>
                    {lang === 'ar' ? 'المعتمد:' : 'Reviewed by:'} {selectedJustificationForReview.reviewedBy}
                  </span>
                ) : (
                  <span>{lang === 'ar' ? 'الحالة: قيد التدقيق' : 'Status: In Review'}</span>
                )}
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setSelectedJustificationForReview(null)}
                  className="px-4 py-2 text-xs border border-slate-200 text-slate-600 rounded-lg hover:bg-slate-50 cursor-pointer"
                >
                  {lang === 'ar' ? 'إغلاق' : 'Close'}
                </button>

                {!isParent && (
                  <>
                    <button
                      type="button"
                      onClick={() => handleReject(selectedJustificationForReview.id)}
                      className="px-4 py-2 text-xs bg-rose-600 hover:bg-rose-700 text-white rounded-lg font-bold cursor-pointer transition-colors shadow-xs"
                    >
                      {lang === 'ar' ? 'رفض العذر (حسم الغياب)' : 'Reject Excuse'}
                    </button>
                    <button
                      type="button"
                      onClick={() => handleApprove(selectedJustificationForReview.id)}
                      className="px-5 py-2 text-xs bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-bold cursor-pointer transition-colors shadow-xs"
                    >
                      {lang === 'ar' ? 'قبول واعتماد العذر رسمياً' : 'Approve & Excuse Absence'}
                    </button>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

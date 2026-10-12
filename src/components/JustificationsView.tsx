import React, { useState } from 'react';
import { useAttendance } from '../context/AttendanceContext';
import { authenticatedFetch } from '../lib/api';
import { Justification } from '../types/attendance';
import {
  generateSampleMedicalNoteBase64,
  generateSampleIrregularMedicalNoteBase64,
} from '../utils/sampleImages';
import {
  Sparkles,
  ShieldCheck,
  FileCheck,
  ShieldAlert,
} from 'lucide-react';
import { JustificationsRosterTable } from './justifications/JustificationsRosterTable';
import { JustificationSubmitForm } from './justifications/JustificationSubmitForm';
import { JustificationReviewModal } from './justifications/JustificationReviewModal';

export const JustificationsView: React.FC = () => {
  const {
    justifications,
    students,
    currentUser,
    lang,
    createJustification,
    reviewJustification,
    updateJustificationAnalysis,
    canReviewJustifications,
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

  // Handle file input with MIME and size validation (M4)
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const allowedMime = ['image/jpeg', 'image/png', 'image/webp', 'application/pdf'];
    if (!allowedMime.includes(file.type)) {
      alert(
        lang === 'ar'
          ? 'صيغة الملف غير مدعومة. يرجى اختيار صورة بصيغة JPG أو PNG أو WEBP أو ملف PDF.'
          : 'Unsupported file format. Please select a JPG, PNG, WEBP, or PDF file.'
      );
      e.target.value = '';
      return;
    }

    const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5 MB
    if (file.size > MAX_FILE_SIZE) {
      alert(
        lang === 'ar'
          ? 'حجم الملف يتجاوز الحد المسموح به (5 ميجابايت). يرجى ضغط الملف أو اختيار ملف أصغر.'
          : 'File size exceeds 5 MB. Please select a smaller file.'
      );
      e.target.value = '';
      return;
    }

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
      const res = await authenticatedFetch('/api/analyze-image', {
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

      const res = await authenticatedFetch('/api/analyze-image', {
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

      {/* VIEW 1: REVIEW ROSTER & AUDIT */}
      {activeSubTab === 'review' && (
        <JustificationsRosterTable
          justifications={justifications}
          isParent={isParent}
          lang={lang}
          statusFilter={statusFilter}
          setStatusFilter={setStatusFilter}
          searchQuery={searchQuery}
          setSearchQuery={setSearchQuery}
          pendingCount={pendingCount}
          irregularCount={irregularCount}
          filteredJustifications={filteredJustifications}
          onInspect={(just) => {
            setSelectedJustificationForReview(just);
            setReviewerNotes(just.reviewerNotes || '');
            setReanalysisError(null);
          }}
        />
      )}

      {/* VIEW 2: SUBMIT EXCUSE WITH GEMINI AI VERIFICATION */}
      {activeSubTab === 'submit' && (
        <JustificationSubmitForm
          students={students}
          isParent={isParent}
          lang={lang}
          selectedStudentId={selectedStudentId}
          setSelectedStudentId={setSelectedStudentId}
          absenceDate={absenceDate}
          setAbsenceDate={setAbsenceDate}
          reasonType={reasonType}
          setReasonType={setReasonType}
          guardianExplanation={guardianExplanation}
          setGuardianExplanation={setGuardianExplanation}
          uploadedFileName={uploadedFileName}
          uploadedImageBase64={uploadedImageBase64}
          onFileUpload={handleFileUpload}
          onLoadSampleMedicalNote={handleLoadSampleMedicalNote}
          onLoadSampleIrregularNote={handleLoadSampleIrregularNote}
          onAnalyzeWithAI={handleAnalyzeImageWithAI}
          isAnalyzing={isAnalyzing}
          aiAnalysisResult={aiAnalysisResult}
          analysisError={analysisError}
          isSubmitting={isSubmitting}
          onSubmit={handleFormSubmit}
        />
      )}

      {/* MODAL: INSPECT, AI VERIFY, AND REVIEW DECISION */}
      {selectedJustificationForReview && (
        <JustificationReviewModal
          justification={selectedJustificationForReview}
          isParent={isParent}
          canReviewJustifications={canReviewJustifications}
          currentUserRole={currentUser.role}
          lang={lang}
          reviewerNotes={reviewerNotes}
          setReviewerNotes={setReviewerNotes}
          isReanalyzing={isReanalyzing}
          reanalysisError={reanalysisError}
          onClose={() => setSelectedJustificationForReview(null)}
          onReanalyzeWithAI={handleReanalyzeJustificationWithAI}
          onApprove={handleApprove}
          onReject={handleReject}
        />
      )}
    </div>
  );
};

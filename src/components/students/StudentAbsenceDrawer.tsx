import React, { useState, useMemo, useEffect } from 'react';
import ReactDOM from 'react-dom';
import { useAttendance } from '../../context/AttendanceContext';
import { Student } from '../../types/attendance';
import { downloadNativePdfFromHtml, printNativePdfFromHtml } from '../../utils/pdfExport';
import { generateStudentAbsenceReportHtml } from '../../utils/printTemplates/studentAbsenceReportTemplate';
import {
  X,
  Printer,
  FileText,
  Send,
  Loader2,
  School,
  UserCheck,
  MessageSquare,
} from 'lucide-react';
import { openWhatsAppDirect } from '../../utils/whatsappUtils';
import { useStudentAbsenceRange } from '../../hooks/useStudentAbsenceRange';
import { AbsenceHorizonSelector } from './AbsenceHorizonSelector';
import { AbsenceKpiCards } from './AbsenceKpiCards';
import { AbsenceRecordsTable } from './AbsenceRecordsTable';
import { AbsenceConductSection } from './AbsenceConductSection';
import { buildStudentAbsenceAnalysis } from '../../utils/studentAbsenceAnalysis';

interface StudentAbsenceDrawerProps {
  student: Student | null;
  isOpen: boolean;
  onClose: () => void;
}

export const StudentAbsenceDrawer: React.FC<StudentAbsenceDrawerProps> = ({
  student,
  isOpen,
  onClose,
}) => {
  const {
    sessions,
    justifications,
    behaviourIncidents,
    schoolProfile,
    lang,
    sendChronicWarningNotification,
  } = useAttendance();

  const isAr = lang === 'ar';

  // Toast feedback
  const [toastMsg, setToastMsg] = useState<string | null>(null);
  const [isGeneratingPdf, setIsGeneratingPdf] = useState<boolean>(false);

  // Close on Escape key
  // Horizon / Date Range filter state (see useStudentAbsenceRange)
  const {
    horizonType,
    setHorizonType,
    selectedMonth,
    setSelectedMonth,
    selectedTermId,
    setSelectedTermId,
    customStartDate,
    setCustomStartDate,
    customEndDate,
    setCustomEndDate,
    academicTerms,
    academicYearBounds,
    availableMonths,
    customDateValidation,
    activeDateRange,
    getArabicDayName,
    getSchoolDaysInRange,
  } = useStudentAbsenceRange({ schoolProfile, isAr });

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  // Student Attendance Records Analysis
  const studentAbsenceAnalysis = useMemo(
    () =>
      buildStudentAbsenceAnalysis({
        student,
        sessions,
        justifications,
        horizonType,
        selectedMonth,
        selectedTermId,
        activeDateRange,
        academicYearBounds,
        customDateValidation,
        isAr,
        getArabicDayName,
        getSchoolDaysInRange,
      }),
    [student, sessions, activeDateRange, academicYearBounds, justifications, horizonType, selectedMonth, selectedTermId, customDateValidation, schoolProfile, isAr]
  );

  // Student Behaviour Violations & Positive Rewards
  const studentViolations = useMemo(() => {
    if (!student) return [];
    if (horizonType === 'custom' && !customDateValidation.isValid) return [];

    return behaviourIncidents
      .filter((b) => {
        if (b.studentId !== student.id) return false;
        if (!b.date) return false;
        if (b.date < activeDateRange.start || b.date > activeDateRange.end) return false;
        if (b.date < academicYearBounds.start || b.date > academicYearBounds.end) return false;
        return true;
      })
      .sort((a, b) => (b.date || '').localeCompare(a.date || ''));
  }, [student, behaviourIncidents, activeDateRange, academicYearBounds, horizonType, customDateValidation]);

  const infractionsList = useMemo(() => studentViolations.filter((v) => v.type === 'infraction'), [studentViolations]);
  const positivePointsList = useMemo(() => studentViolations.filter((v) => v.type === 'positive'), [studentViolations]);

  // Actions
  const handleSendWarning = () => {
    if (!student) return;
    const tier = (studentAbsenceAnalysis?.unexcusedDaysCount || student.totalAbsences) >= 8 ? 3 : (studentAbsenceAnalysis?.unexcusedDaysCount || student.totalAbsences) >= 5 ? 2 : 1;
    sendChronicWarningNotification(student.id, tier);
    setToastMsg(
      isAr
        ? `تم إرسال إشعار الانضباط لولي أمر الطالب (${student.fullName}) بنجاح.`
        : `Discipline notification sent to guardian of ${student.fullName}.`
    );
    setTimeout(() => setToastMsg(null), 4000);
  };

  const handleWhatsAppContact = () => {
    if (!student || !student.guardianPhone) return;
    const message = isAr
      ? `السلام عليكم ورحمة الله، المكرم ولي أمر الطالب (${student.fullName}): نود التواصل معكم بخصوص سجل المواظبة والغياب بمدرسة (${schoolProfile?.schoolName || 'المدرسة'}). نسبة الحضور الحالية: ${studentAbsenceAnalysis?.attendanceRate ?? student.attendanceRate}%، إجمالي أيام الغياب: ${studentAbsenceAnalysis?.unexcusedDaysCount ?? student.totalAbsences} يوم. يرجى متابعة السجل وتقديم الأعذار المعتمدة عبر المنصة.`
      : `Dear Guardian of ${student.fullName}: Following up on attendance records at ${schoolProfile?.schoolName || 'School'}. Current attendance: ${studentAbsenceAnalysis?.attendanceRate ?? student.attendanceRate}%.`;
    openWhatsAppDirect(
      student.guardianPhone,
      message,
      schoolProfile?.countryCallingCode || schoolProfile?.address?.countryCallingCode || '+966'
    );
  };

  const handleDownloadPdf = async () => {
    if (!student || !studentAbsenceAnalysis) return;

    try {
      setIsGeneratingPdf(true);
      const html = generateStudentAbsenceReportHtml({
        student,
        schoolProfile,
        activeDateRange,
        analysis: {
          attendanceRate: studentAbsenceAnalysis.attendanceRate,
          unexcusedDaysCount: studentAbsenceAnalysis.unexcusedDaysCount,
          excusedDaysCount: studentAbsenceAnalysis.excusedDaysCount,
          lateDaysCount: studentAbsenceAnalysis.lateDaysCount,
          records: studentAbsenceAnalysis.records,
        },
        infractions: infractionsList,
      });

      const reportTitle = `${student.fullName} - ${activeDateRange.label} - تقرير الغياب والانضباط`;
      const filename = `تقرير_${student.fullName.replace(/\s+/g, '_')}_${activeDateRange.start}_${activeDateRange.end}.pdf`;

      await downloadNativePdfFromHtml({
        htmlContent: html,
        title: reportTitle,
        filename,
      });
      setToastMsg(isAr ? 'تم تحميل ملف PDF بنجاح!' : 'PDF downloaded successfully!');
      setTimeout(() => setToastMsg(null), 3000);
    } catch (err) {
      console.error(err);
      window.print();
    } finally {
      setIsGeneratingPdf(false);
    }
  };

  const handlePrint = () => {
    if (!student || !studentAbsenceAnalysis) {
      window.print();
      return;
    }
    const html = generateStudentAbsenceReportHtml({
      student,
      schoolProfile,
      activeDateRange,
      analysis: {
        attendanceRate: studentAbsenceAnalysis.attendanceRate,
        unexcusedDaysCount: studentAbsenceAnalysis.unexcusedDaysCount,
        excusedDaysCount: studentAbsenceAnalysis.excusedDaysCount,
        lateDaysCount: studentAbsenceAnalysis.lateDaysCount,
        records: studentAbsenceAnalysis.records,
      },
      infractions: infractionsList,
    });
    const reportTitle = `${student.fullName} - تقرير الحضور والغياب`;
    printNativePdfFromHtml({
      htmlContent: html,
      title: reportTitle,
    });
  };

  if (!isOpen || !student) return null;

  return ReactDOM.createPortal(
    <div className="fixed inset-0 z-50 flex justify-end animate-fadeIn">
      {/* Toast Feedback */}
      {toastMsg && (
        <div className="fixed bottom-6 end-6 z-60 bg-primary text-white text-xs font-bold px-4 py-3 rounded-xl shadow-lg flex items-center gap-2 animate-bounce">
          <UserCheck className="w-4 h-4" />
          <span>{toastMsg}</span>
        </div>
      )}

      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs transition-opacity"
        onClick={onClose}
      />

      {/* Slide-over Container */}
      <div
        className="relative w-full max-w-3xl h-full shadow-2xl flex flex-col z-10 overflow-hidden border-s animate-slideInRight"
        style={{
          backgroundColor: 'var(--app-card-bg)',
          borderColor: 'var(--app-card-border)',
        }}
      >
        {/* Drawer Header */}
        <div className="p-5 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between gap-4 bg-slate-50/80 dark:bg-slate-900/80 backdrop-blur-md shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-primary/10 text-primary flex items-center justify-center font-bold text-base shadow-xs">
              {student.fullName?.charAt(0) || 'ط'}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base sm:text-lg font-black text-slate-900 dark:text-slate-100">
                  {student.fullName}
                </h2>
                <span className="text-xs px-2 py-0.5 rounded-md bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold">
                  {student.grade || '—'} • {student.className}
                </span>
              </div>
              <p className="text-xs text-slate-500 font-mono mt-0.5">
                {isAr ? 'الهوية:' : 'ID:'} {student.nationalId || '—'} | {isAr ? 'رقم القيد:' : 'No:'} {student.studentNumber}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              className="p-2 rounded-xl text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-200/50 dark:hover:bg-slate-800 transition-colors cursor-pointer"
              title={isAr ? 'إغلاق' : 'Close'}
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Scrollable Content Body */}
        <div className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-5 scrollbar-thin">
          {/* Action Buttons Bar */}
          <div className="flex flex-wrap items-center justify-between gap-2.5 p-3 rounded-xl bg-slate-100/70 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700">
            <div className="text-xs font-bold text-slate-700 dark:text-slate-300">
              {isAr ? 'إجراءات السجل الرسمي والطباعة:' : 'Official Record Actions:'}
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <button
                onClick={handleDownloadPdf}
                disabled={isGeneratingPdf}
                className="flex items-center gap-1.5 bg-primary hover:bg-primary-hover text-white font-bold text-xs px-3.5 py-2 rounded-lg transition-colors cursor-pointer shadow-xs disabled:opacity-50"
                title="توليد وتنزيل ملف PDF أصلي معتمد"
              >
                {isGeneratingPdf ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    <span>{isAr ? 'جارٍ الإنشاء...' : 'Generating...'}</span>
                  </>
                ) : (
                  <>
                    <FileText className="w-3.5 h-3.5" />
                    <span>{isAr ? 'تنزيل PDF معتمد' : 'Download PDF'}</span>
                  </>
                )}
              </button>

              <button
                onClick={handlePrint}
                className="flex items-center gap-1.5 bg-slate-800 hover:bg-slate-900 dark:bg-slate-700 dark:hover:bg-slate-600 text-white font-bold text-xs px-3.5 py-2 rounded-lg transition-colors cursor-pointer shadow-xs"
                title="طباعة مباشرة"
              >
                <Printer className="w-3.5 h-3.5" />
                <span>{isAr ? 'طباعة' : 'Print'}</span>
              </button>

              <button
                onClick={handleSendWarning}
                className="flex items-center gap-1.5 bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs px-3 py-2 rounded-lg cursor-pointer transition-colors shadow-xs"
                title="إرسال إنذار لولي الأمر"
              >
                <Send className="w-3.5 h-3.5" />
                <span>{isAr ? 'إرسال إنذار' : 'Send Warning'}</span>
              </button>

              {student.guardianPhone && (
                <button
                  type="button"
                  onClick={handleWhatsAppContact}
                  className="flex items-center gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs px-3.5 py-2 rounded-lg cursor-pointer transition-colors shadow-xs"
                  title="فتح محادثة واتساب ويب مباشرة مع ولي الأمر"
                >
                  <MessageSquare className="w-3.5 h-3.5" />
                  <span>{isAr ? 'واتساب ويب لولي الأمر' : 'WhatsApp Guardian'}</span>
                </button>
              )}
            </div>
          </div>

          <AbsenceHorizonSelector
            isAr={isAr}
            horizonType={horizonType}
            setHorizonType={setHorizonType}
            selectedMonth={selectedMonth}
            setSelectedMonth={setSelectedMonth}
            selectedTermId={selectedTermId}
            setSelectedTermId={setSelectedTermId}
            customStartDate={customStartDate}
            setCustomStartDate={setCustomStartDate}
            customEndDate={customEndDate}
            setCustomEndDate={setCustomEndDate}
            availableMonths={availableMonths}
            academicTerms={academicTerms}
            academicYearBounds={academicYearBounds}
            customDateValidation={customDateValidation}
          />
          <AbsenceKpiCards
            isAr={isAr}
            attendanceRate={studentAbsenceAnalysis?.attendanceRate || 100}
            presentDaysCount={studentAbsenceAnalysis?.presentDaysCount || 0}
            unexcusedDaysCount={studentAbsenceAnalysis?.unexcusedDaysCount || 0}
            excusedDaysCount={studentAbsenceAnalysis?.excusedDaysCount || 0}
            lateDaysCount={studentAbsenceAnalysis?.lateDaysCount || 0}
            totalMinutesLate={studentAbsenceAnalysis?.totalMinutesLate || 0}
          />
          <AbsenceRecordsTable isAr={isAr} records={studentAbsenceAnalysis?.records || []} />
          <AbsenceConductSection
            isAr={isAr}
            infractions={infractionsList}
            positiveCount={positivePointsList.length}
          />
        </div>
      </div>
    </div>,
    document.body
  );
};

import React, { useState, useMemo } from 'react';
import { useAttendance } from '../context/AttendanceContext';
import { downloadNativePdfFromHtml, printNativePdfFromHtml } from '../utils/pdfExport';
import { generateStudentAbsenceReportHtml } from '../utils/printTemplates/studentAbsenceReportTemplate';
import { UserCheck } from 'lucide-react';
import {
  buildAvailableMonths,
  resolveAcademicTerms,
  resolveAcademicYearBounds,
  resolveActiveDateRange,
  validateCustomDateRange,
} from './student-absence-inquiry/dateRange';
import { buildStudentAbsenceAnalysis, filterStudentViolations } from './student-absence-inquiry/absenceAnalysis';
import { AbsenceReportHeader } from './student-absence-inquiry/AbsenceReportHeader';
import { StudentSelectorCard } from './student-absence-inquiry/StudentSelectorCard';
import { HorizonController } from './student-absence-inquiry/HorizonController';
import { StudentIdentityCard } from './student-absence-inquiry/StudentIdentityCard';
import { AbsenceStatsGrid } from './student-absence-inquiry/AbsenceStatsGrid';
import { AbsenceLogTable } from './student-absence-inquiry/AbsenceLogTable';
import { ConductIncidentsCard } from './student-absence-inquiry/ConductIncidentsCard';
import { EmptyStudentState } from './student-absence-inquiry/EmptyStudentState';

export const StudentAbsenceInquiryView: React.FC = () => {
  const {
    students,
    sessions,
    justifications,
    behaviourIncidents,
    schoolProfile,
    lang,
    sendChronicWarningNotification,
  } = useAttendance();

  const isAr = lang === 'ar';

  // 1. Filtering & Selection state
  const [selectedGrade, setSelectedGrade] = useState<string>('all');
  const [selectedClass, setSelectedClass] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedStudentId, setSelectedStudentId] = useState<string | null>(null);

  // 2. Horizon / Date Range filter state
  // Horizon types: 'month' | 'term' | 'full_year' | 'custom'
  const [horizonType, setHorizonType] = useState<'month' | 'term' | 'full_year' | 'custom'>('month');
  const [selectedMonth, setSelectedMonth] = useState<string>('2026-10'); // YYYY-MM
  const [selectedTermId, setSelectedTermId] = useState<string>('term-1');
  const [customStartDate, setCustomStartDate] = useState<string>('2026-09-01');
  const [customEndDate, setCustomEndDate] = useState<string>(() => new Date().toISOString().split('T')[0]);

  // Toast feedback
  const [toastMsg, setToastMsg] = useState<string | null>(null);
  const [isGeneratingPdf, setIsGeneratingPdf] = useState<boolean>(false);

  // Academic calendar ranges are derived from the Settings page.
  const academicTerms = useMemo(() => resolveAcademicTerms(schoolProfile), [schoolProfile]);
  const academicYearBounds = useMemo(() => resolveAcademicYearBounds(academicTerms), [academicTerms]);
  const availableMonths = useMemo(() => buildAvailableMonths(academicYearBounds), [academicYearBounds]);

  // Sync selectedMonth if current selection is invalid or outside settings range (e.g. Month 8)
  React.useEffect(() => {
    if (availableMonths.length > 0) {
      const exists = availableMonths.some((m) => m.value === selectedMonth);
      if (!exists) {
        const todayYm = new Date().toISOString().slice(0, 7);
        const match = availableMonths.find((m) => m.value === todayYm);
        setSelectedMonth(match ? match.value : availableMonths[0].value);
      }
    }
  }, [availableMonths, selectedMonth]);

  // Strict Custom Dates validation against settings
  const customDateValidation = useMemo(
    () =>
      validateCustomDateRange({
        horizonType,
        customStartDate,
        customEndDate,
        academicYearBounds,
        isAr,
      }),
    [horizonType, customStartDate, customEndDate, academicYearBounds, isAr]
  );

  // Set default active term if not selected
  React.useEffect(() => {
    if (!selectedTermId && academicTerms.length > 0) {
      const active = academicTerms.find((t) => t.isActive) || academicTerms[0];
      setSelectedTermId(active.id);
    }
  }, [academicTerms, selectedTermId]);

  // Unique list of grades
  const gradesList = useMemo(() => {
    const grades = new Set<string>();
    students.forEach((s) => {
      if (s.grade) grades.add(s.grade);
    });
    return Array.from(grades);
  }, [students]);

  // Unique list of classes filtered by selected grade
  const classesList = useMemo(() => {
    const classes = new Set<string>();
    students.forEach((s) => {
      if (selectedGrade === 'all' || s.grade === selectedGrade) {
        if (s.className) classes.add(s.className);
      }
    });
    return Array.from(classes);
  }, [students, selectedGrade]);

  // Filtered students list for selection
  const filteredStudents = useMemo(() => {
    return students.filter((s) => {
      // Exclude transferred if any
      if (s.enrollmentStatus === 'transferred') return false;

      // Grade filter
      if (selectedGrade !== 'all' && s.grade !== selectedGrade) return false;

      // Class filter
      if (selectedClass !== 'all' && s.className !== selectedClass) return false;

      // Search Query (Name, ID, National ID)
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const matchesName = s.fullName?.toLowerCase().includes(q);
        const matchesId = s.id?.toLowerCase().includes(q);
        const matchesNat = s.nationalId?.toLowerCase().includes(q);
        const matchesClass = s.className?.toLowerCase().includes(q);
        if (!matchesName && !matchesId && !matchesNat && !matchesClass) return false;
      }

      return true;
    });
  }, [students, selectedGrade, selectedClass, searchQuery]);

  // Currently selected student object
  const currentStudent = useMemo(() => {
    if (!selectedStudentId) return null;
    return students.find((s) => s.id === selectedStudentId) || null;
  }, [students, selectedStudentId]);

  // Compute Active Date Range strictly based on horizonType & Settings Calendar
  const activeDateRange = useMemo(
    () =>
      resolveActiveDateRange({
        horizonType,
        selectedMonth,
        selectedTermId,
        customStartDate,
        customEndDate,
        academicTerms,
        academicYearBounds,
        availableMonths,
        customDateValidation,
        schoolProfile,
        isAr,
      }),
    [
      horizonType,
      selectedMonth,
      selectedTermId,
      customStartDate,
      customEndDate,
      academicTerms,
      academicYearBounds,
      availableMonths,
      customDateValidation,
      schoolProfile,
      isAr,
    ]
  );

  // Extract Student's attendance and behaviour strictly within the selected range.
  const studentAbsenceAnalysis = useMemo(
    () =>
      buildStudentAbsenceAnalysis({
        currentStudent,
        sessions,
        justifications,
        activeDateRange,
        academicYearBounds,
        horizonType,
        selectedMonth,
        selectedTermId,
        customDateValidation,
        schoolProfile,
        isAr,
      }),
    [
      currentStudent,
      sessions,
      activeDateRange,
      academicYearBounds,
      justifications,
      horizonType,
      selectedMonth,
      selectedTermId,
      customDateValidation,
      schoolProfile,
      isAr,
    ]
  );

  const studentViolations = useMemo(
    () =>
      filterStudentViolations({
        currentStudent,
        behaviourIncidents,
        activeDateRange,
        academicYearBounds,
        horizonType,
        customDateValidation,
      }),
    [currentStudent, behaviourIncidents, activeDateRange, academicYearBounds, horizonType, customDateValidation]
  );

  // Separate positive rewards vs negative infractions
  const infractionsList = useMemo(() => studentViolations.filter((v) => v.type === 'infraction'), [studentViolations]);
  const positivePointsList = useMemo(() => studentViolations.filter((v) => v.type === 'positive'), [studentViolations]);

  // Handle Send Warning Action
  const handleSendWarning = () => {
    if (!currentStudent) return;
    const tier = (studentAbsenceAnalysis?.unexcusedDaysCount || currentStudent.totalAbsences) >= 8 ? 3 : (studentAbsenceAnalysis?.unexcusedDaysCount || currentStudent.totalAbsences) >= 5 ? 2 : 1;
    sendChronicWarningNotification(currentStudent.id, tier);
    setToastMsg(
      isAr
        ? `تم إرسال إشعار الانضباط لولي أمر الطالب (${currentStudent.fullName}) بنجاح.`
        : `Discipline notification sent to guardian of ${currentStudent.fullName}.`
    );
    setTimeout(() => setToastMsg(null), 4000);
  };

  // Handle Download Vector PDF
  const handleDownloadPdf = async () => {
    if (!currentStudent || !studentAbsenceAnalysis) {
      window.print();
      return;
    }

    try {
      setIsGeneratingPdf(true);
      const html = generateStudentAbsenceReportHtml({
        student: currentStudent,
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

      const reportTitle = `${currentStudent.fullName} - ${activeDateRange.label} - تقرير الغياب والانضباط`;
      const filename = `تقرير_${currentStudent.fullName.replace(/\s+/g, '_')}_${activeDateRange.start}_${activeDateRange.end}.pdf`;

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

  // Handle Direct Print Action
  const handlePrint = () => {
    if (!currentStudent || !studentAbsenceAnalysis) {
      window.print();
      return;
    }
    const html = generateStudentAbsenceReportHtml({
      student: currentStudent,
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
    const reportTitle = `${currentStudent?.fullName || ''} - تقرير الحضور والغياب`;
    printNativePdfFromHtml({
      htmlContent: html,
      title: reportTitle,
    });
  };

  return (
    <div className="space-y-6 pb-16 animate-fadeIn">
      {/* Toast alert */}
      {toastMsg && (
        <div className="fixed bottom-6 end-6 z-50 bg-primary text-white text-xs font-bold px-4 py-3 rounded-xl shadow-lg flex items-center gap-2 animate-bounce">
          <UserCheck className="w-4 h-4" />
          <span>{toastMsg}</span>
        </div>
      )}

      <AbsenceReportHeader
        currentStudent={currentStudent}
        isAr={isAr}
        isGeneratingPdf={isGeneratingPdf}
        onDownloadPdf={handleDownloadPdf}
        onPrint={handlePrint}
        onSendWarning={handleSendWarning}
      />

      <StudentSelectorCard
        isAr={isAr}
        gradesList={gradesList}
        classesList={classesList}
        filteredStudents={filteredStudents}
        selectedGrade={selectedGrade}
        selectedClass={selectedClass}
        searchQuery={searchQuery}
        selectedStudentId={selectedStudentId}
        onGradeChange={(value) => {
          setSelectedGrade(value);
          setSelectedClass('all');
        }}
        onClassChange={setSelectedClass}
        onSearchChange={setSearchQuery}
        onSelectStudent={setSelectedStudentId}
        onClearSelection={() => setSelectedStudentId(null)}
      />

      {currentStudent && (
        <div className="space-y-6">
          <HorizonController
            isAr={isAr}
            activeDateRange={activeDateRange}
            horizonType={horizonType}
            onHorizonChange={setHorizonType}
            selectedMonth={selectedMonth}
            onMonthChange={setSelectedMonth}
            availableMonths={availableMonths}
            academicTerms={academicTerms}
            selectedTermId={selectedTermId}
            onTermChange={setSelectedTermId}
            customStartDate={customStartDate}
            onCustomStartChange={setCustomStartDate}
            customEndDate={customEndDate}
            onCustomEndChange={setCustomEndDate}
            academicYearBounds={academicYearBounds}
            customDateValidation={customDateValidation}
          />

          <StudentIdentityCard
            student={currentStudent}
            analysis={studentAbsenceAnalysis}
            activeDateRange={activeDateRange}
            isAr={isAr}
          />

          <AbsenceStatsGrid
            isAr={isAr}
            analysis={studentAbsenceAnalysis}
            infractionsCount={infractionsList.length}
            positivePoints={positivePointsList.reduce((acc, p) => acc + (p.points || 0), 0)}
          />

          <AbsenceLogTable
            isAr={isAr}
            studentAbsenceAnalysis={studentAbsenceAnalysis}
            activeDateRange={activeDateRange}
          />

          <ConductIncidentsCard
            isAr={isAr}
            infractionsList={infractionsList}
            positivePointsList={positivePointsList}
          />
        </div>
      )}

      {!currentStudent && <EmptyStudentState isAr={isAr} />}
    </div>
  );
};

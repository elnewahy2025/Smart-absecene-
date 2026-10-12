import React, { useState, useMemo, useRef } from 'react';
import { useAttendance } from '../context/AttendanceContext';
import { Student, StudentBehaviourIncident, AttendanceRecord, Justification } from '../types/attendance';
import { downloadNativePdfFromHtml, printNativePdfFromHtml } from '../utils/pdfExport';
import {
  UserCheck,
  Filter,
  Search,
  Calendar,
  AlertTriangle,
  FileCheck2,
  Clock,
  Printer,
  ShieldAlert,
  ChevronDown,
  ChevronLeft,
  X,
  Send,
  Download,
  Award,
  Layers,
  GraduationCap,
  School,
  FileText,
  AlertCircle,
  HelpCircle,
  UserX,
  Loader2,
} from 'lucide-react';

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
  // Horizon types: 'current_month' | 'term' | 'full_year' | 'custom'
  const [horizonType, setHorizonType] = useState<'current_month' | 'term' | 'full_year' | 'custom'>('current_month');
  const [selectedTermId, setSelectedTermId] = useState<string>('');
  const [customStartDate, setCustomStartDate] = useState<string>(() => {
    const d = new Date();
    d.setDate(d.getDate() - 30);
    return d.toISOString().split('T')[0];
  });
  const [customEndDate, setCustomEndDate] = useState<string>(() => new Date().toISOString().split('T')[0]);

  // Toast feedback
  const [toastMsg, setToastMsg] = useState<string | null>(null);
  const [isGeneratingPdf, setIsGeneratingPdf] = useState<boolean>(false);
  const printAreaRef = useRef<HTMLDivElement>(null);

  // Available Terms from Academic Profile
  const academicTerms = useMemo(() => {
    return schoolProfile?.academicYear?.terms || [
      { id: 'term-1', nameAr: 'الفصل الدراسي الأول', nameEn: 'Term 1', startDate: '2026-08-18', endDate: '2026-11-07', isActive: false },
      { id: 'term-2', nameAr: 'الفصل الدراسي الثاني', nameEn: 'Term 2', startDate: '2026-11-17', endDate: '2027-02-20', isActive: true },
      { id: 'term-3', nameAr: 'الفصل الدراسي الثالث', nameEn: 'Term 3', startDate: '2027-03-02', endDate: '2027-06-10', isActive: false },
    ];
  }, [schoolProfile]);

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

  // Compute Active Date Range based on horizonType
  const activeDateRange = useMemo(() => {
    const today = new Date();
    const todayStr = today.toISOString().split('T')[0];

    if (horizonType === 'current_month') {
      const y = today.getFullYear();
      const m = String(today.getMonth() + 1).padStart(2, '0');
      const start = `${y}-${m}-01`;
      return { start, end: todayStr, label: isAr ? `الشهر الحالي (${m}/${y})` : `Current Month (${m}/${y})` };
    }

    if (horizonType === 'term') {
      const term = academicTerms.find((t) => t.id === selectedTermId) || academicTerms[0];
      return {
        start: term?.startDate || '2026-08-01',
        end: term?.endDate || todayStr,
        label: isAr ? (term?.nameAr || 'الفصل الدراسي') : (term?.nameEn || 'Term'),
      };
    }

    if (horizonType === 'full_year') {
      const yearStart = schoolProfile?.academicYear?.terms?.[0]?.startDate || `${today.getFullYear()}-01-01`;
      return {
        start: yearStart,
        end: todayStr,
        label: isAr ? 'العام الدراسي بالكامل' : 'Full Academic Year',
      };
    }

    // Custom
    return {
      start: customStartDate,
      end: customEndDate,
      label: isAr ? `من ${customStartDate} إلى ${customEndDate}` : `From ${customStartDate} to ${customEndDate}`,
    };
  }, [horizonType, selectedTermId, customStartDate, customEndDate, academicTerms, schoolProfile, isAr]);

  // Extract Student's Attendance Records within the Selected Date Range
  const studentAbsenceAnalysis = useMemo(() => {
    if (!currentStudent) return null;

    // Filter submitted sessions within the date range
    const sessionsInRange = sessions.filter((s) => {
      if (s.status !== 'submitted') return false;
      if (!s.date) return false;
      return s.date >= activeDateRange.start && s.date <= activeDateRange.end;
    });

    const relevantAbsenceEntries: Array<{
      date: string;
      sessionType: 'daily' | 'period';
      periodNumber?: number;
      subject?: string;
      className: string;
      teacherName: string;
      status: 'absent' | 'late' | 'excused';
      minutesLate?: number;
      isExcused: boolean;
      justificationReason?: string;
      note?: string;
    }> = [];

    let totalRecordedDaysCount = 0;
    let presentDaysCount = 0;
    let absentDaysCount = 0;
    let lateDaysCount = 0;
    let excusedDaysCount = 0;
    let unexcusedDaysCount = 0;
    let totalMinutesLate = 0;

    sessionsInRange.forEach((session) => {
      const record = session.records?.find((r) => r.studentId === currentStudent.id);
      if (record) {
        totalRecordedDaysCount += 1;

        if (record.status === 'present') {
          presentDaysCount += 1;
        } else if (record.status === 'late') {
          lateDaysCount += 1;
          totalMinutesLate += record.minutesLate || 0;
          relevantAbsenceEntries.push({
            date: session.date,
            sessionType: session.sessionType,
            periodNumber: session.periodNumber,
            subject: session.subject,
            className: session.className,
            teacherName: session.teacherName,
            status: 'late',
            minutesLate: record.minutesLate,
            isExcused: false,
            note: record.note,
          });
        } else if (record.status === 'excused_leave' || record.status === 'excused_absence') {
          excusedDaysCount += 1;
          absentDaysCount += 1;
          // check justifications for details
          const excuse = justifications.find(
            (j) => j.studentId === currentStudent.id && j.absenceDate === session.date && j.status === 'approved'
          );
          relevantAbsenceEntries.push({
            date: session.date,
            sessionType: session.sessionType,
            periodNumber: session.periodNumber,
            subject: session.subject,
            className: session.className,
            teacherName: session.teacherName,
            status: 'excused',
            isExcused: true,
            justificationReason: excuse ? excuse.guardianExplanation || excuse.reasonType : isAr ? 'عذر مقبول' : 'Excused',
            note: record.note,
          });
        } else if (record.status === 'absent' || record.status === 'under_review' || record.status === 'rejected_excuse') {
          absentDaysCount += 1;
          // check if there was an approved justification
          const excuse = justifications.find(
            (j) => j.studentId === currentStudent.id && j.absenceDate === session.date && j.status === 'approved'
          );
          const isExc = Boolean(excuse);
          if (isExc) {
            excusedDaysCount += 1;
          } else {
            unexcusedDaysCount += 1;
          }

          relevantAbsenceEntries.push({
            date: session.date,
            sessionType: session.sessionType,
            periodNumber: session.periodNumber,
            subject: session.subject,
            className: session.className,
            teacherName: session.teacherName,
            status: isExc ? 'excused' : 'absent',
            isExcused: isExc,
            justificationReason: excuse ? excuse.guardianExplanation || excuse.reasonType : undefined,
            note: record.note,
          });
        }
      }
    });

    // Fallback if no specific sessions exist in mock range but student has global counters
    if (totalRecordedDaysCount === 0) {
      // Estimated metrics based on student profile
      const approxAbsences = currentStudent.totalAbsences || 0;
      const approxExcused = Math.min(approxAbsences, justifications.filter((j) => j.studentId === currentStudent.id && j.status === 'approved').length);
      const approxUnexcused = Math.max(0, approxAbsences - approxExcused);
      const approxLate = currentStudent.totalLates || 0;

      return {
        totalRecordedDaysCount: approxAbsences > 0 ? approxAbsences + 20 : 25,
        presentDaysCount: 25,
        absentDaysCount: approxAbsences,
        lateDaysCount: approxLate,
        excusedDaysCount: approxExcused,
        unexcusedDaysCount: approxUnexcused,
        totalMinutesLate: approxLate * 15,
        attendanceRate: currentStudent.attendanceRate || 92,
        records: [],
      };
    }

    const calculatedAttendanceRate =
      totalRecordedDaysCount > 0
        ? Math.round(((presentDaysCount + lateDaysCount) / totalRecordedDaysCount) * 100)
        : currentStudent.attendanceRate || 100;

    return {
      totalRecordedDaysCount,
      presentDaysCount,
      absentDaysCount,
      lateDaysCount,
      excusedDaysCount,
      unexcusedDaysCount,
      totalMinutesLate,
      attendanceRate: calculatedAttendanceRate,
      records: relevantAbsenceEntries.sort((a, b) => b.date.localeCompare(a.date)),
    };
  }, [currentStudent, sessions, activeDateRange, justifications, isAr]);

  // Extract Student's Behavioral Infractions / Violations within the Date Range
  const studentViolations = useMemo(() => {
    if (!currentStudent) return [];

    return behaviourIncidents
      .filter((b) => {
        if (b.studentId !== currentStudent.id) return false;
        // Filter by date range
        if (b.date && (b.date < activeDateRange.start || b.date > activeDateRange.end)) {
          return false;
        }
        return true;
      })
      .sort((a, b) => (b.date || '').localeCompare(a.date || ''));
  }, [currentStudent, behaviourIncidents, activeDateRange]);

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
    if (!currentStudent || !printAreaRef.current) {
      window.print();
      return;
    }

    try {
      setIsGeneratingPdf(true);
      const html = printAreaRef.current.innerHTML;
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
    if (printAreaRef.current) {
      const html = printAreaRef.current.innerHTML;
      const reportTitle = `${currentStudent?.fullName || ''} - تقرير الحضور والغياب`;
      printNativePdfFromHtml({
        htmlContent: html,
        title: reportTitle,
      });
    } else {
      window.print();
    }
  };

  return (
    <div className="space-y-6 pb-16 animate-fadeIn">
      {/* Toast alert */}
      {toastMsg && (
        <div className="fixed bottom-6 end-6 z-50 bg-emerald-600 text-white text-xs font-bold px-4 py-3 rounded-xl shadow-lg flex items-center gap-2 animate-bounce">
          <UserCheck className="w-4 h-4" />
          <span>{toastMsg}</span>
        </div>
      )}

      {/* =========================================================================
          PAGE HEADER
      ========================================================================= */}
      <div className="app-section-header rounded-2xl border p-5 sm:p-6 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-primary/10 text-primary border border-primary/20">
              <Search className="w-3.5 h-3.5" />
              <span>{isAr ? 'استعلام ومتابعة غياب طالب' : 'Student Absence & Violations'}</span>
            </span>
            <span className="text-xs px-2.5 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 font-medium">
              {isAr ? 'فترات مرنة ومخالفات السلوك' : 'Flexible Timeframes & Behavior'}
            </span>
          </div>
          <h1 className="text-xl sm:text-2xl font-black" style={{ color: 'var(--app-text-main)' }}>
            {isAr ? 'سجل غياب وانضباط الطالب' : 'Student Attendance & Conduct Record'}
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400">
            {isAr
              ? 'احصاء فوري ودقيق لمرات الغياب والتأخر والمخالفات السلوكية خلال أي فترة زمنية محددة.'
              : 'Detailed breakdown of absences, tardiness, and conduct violations across custom horizons.'}
          </p>
        </div>

        {currentStudent && (
          <div className="flex flex-wrap items-center gap-2.5">
            <button
              onClick={handleDownloadPdf}
              disabled={isGeneratingPdf}
              className="flex items-center justify-center gap-2 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs px-5 py-2.5 rounded-xl transition-colors cursor-pointer shadow-sm disabled:opacity-50"
              title="توليد وتنزيل ملف PDF أصلي حقيقي ذو نصوص قابلة للتحديد (Vector PDF)"
            >
              {isGeneratingPdf ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin text-slate-950" />
                  <span>{isAr ? 'جارٍ إنشاء مستند PDF...' : 'Generating PDF...'}</span>
                </>
              ) : (
                <>
                  <FileText className="w-4 h-4 text-slate-950" />
                  <span>{isAr ? 'تنزيل مستند PDF رسمي معتمد' : 'Download Official PDF Report'}</span>
                </>
              )}
            </button>

            <button
              onClick={handlePrint}
              className="flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs px-5 py-2.5 rounded-xl transition-colors cursor-pointer shadow-sm"
              title="طباعة مباشرة للمستند الرسمي عبر إطار معزول"
            >
              <Printer className="w-4 h-4 text-white" />
              <span>{isAr ? 'طباعة مباشرة للمستند' : 'Print Document'}</span>
            </button>

            <button
              onClick={handleSendWarning}
              className="flex items-center justify-center gap-2 bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs px-4 py-2.5 rounded-xl cursor-pointer transition-colors shadow-sm"
              title="إرسال إنذار فوري لولي الأمر"
            >
              <Send className="w-4 h-4" />
              <span>{isAr ? 'إرسال إنذار فوري' : 'Send Warning'}</span>
            </button>
          </div>
        )}
      </div>

      {/* =========================================================================
          FILTER & SELECTION BAR (GRADE -> CLASS -> INSTANT SEARCH)
      ========================================================================= */}
      <div
        className="app-card rounded-2xl border p-4 shadow-2xs space-y-4"
        style={{ backgroundColor: 'var(--app-card-bg)', borderColor: 'var(--app-card-border)' }}
      >
        <div className="flex items-center gap-2 text-xs font-bold text-slate-700 dark:text-slate-300">
          <Filter className="w-4 h-4 text-primary" />
          <span>{isAr ? 'تحديد واختيار الطالب:' : 'Select Student:'}</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {/* Select Grade */}
          <div>
            <label className="block text-[11px] font-bold text-slate-500 dark:text-slate-400 mb-1">
              {isAr ? '1. اختر الصف الدراسي:' : '1. Grade:'}
            </label>
            <div className="relative">
              <select
                value={selectedGrade}
                onChange={(e) => {
                  setSelectedGrade(e.target.value);
                  setSelectedClass('all');
                }}
                className="w-full text-xs font-medium bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-primary/20"
                style={{ color: 'var(--app-text-main)' }}
              >
                <option value="all">{isAr ? 'جميع الصفوف الدراسية' : 'All Grades'}</option>
                {gradesList.map((g) => (
                  <option key={g} value={g}>
                    {g}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Select Class */}
          <div>
            <label className="block text-[11px] font-bold text-slate-500 dark:text-slate-400 mb-1">
              {isAr ? '2. اختر الفصل / الشعبة:' : '2. Class / Section:'}
            </label>
            <div className="relative">
              <select
                value={selectedClass}
                onChange={(e) => setSelectedClass(e.target.value)}
                className="w-full text-xs font-medium bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-primary/20"
                style={{ color: 'var(--app-text-main)' }}
              >
                <option value="all">{isAr ? 'جميع الفصول والشعب' : 'All Classes'}</option>
                {classesList.map((c) => (
                  <option key={c} value={c}>
                    {isAr ? `فصل ${c}` : `Class ${c}`}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Instant Search Box */}
          <div>
            <label className="block text-[11px] font-bold text-slate-500 dark:text-slate-400 mb-1">
              {isAr ? '3. أو ابحث مباشرة بالاسم أو الهوية:' : '3. Or Search by Name / ID:'}
            </label>
            <div className="relative">
              <Search className="w-4 h-4 text-slate-400 absolute start-3 top-2.5" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder={isAr ? 'اكتب اسم الطالب أو رقم الهوية...' : 'Type student name or ID...'}
                className="w-full text-xs bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl ps-9 pe-8 py-2.5 focus:outline-none focus:ring-2 focus:ring-primary/20"
                style={{ color: 'var(--app-text-main)' }}
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute end-2.5 top-2.5 text-slate-400 hover:text-slate-600"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Student Selector Structured Table */}
        <div className="pt-2 border-t border-slate-100 dark:border-slate-800">
          <div className="flex items-center justify-between mb-2 text-xs">
            <span className="font-bold text-slate-700 dark:text-slate-300">
              {isAr
                ? `قائمة الطلاب (${filteredStudents.length} طالب) — انقر على أي طالب لعرض ملفه:`
                : `Student Roster (${filteredStudents.length} students) — Click any row to view record:`}
            </span>
            {selectedStudentId && (
              <button
                onClick={() => setSelectedStudentId(null)}
                className="text-primary hover:underline text-[11px] font-bold cursor-pointer"
              >
                {isAr ? 'إلغاء التحديد' : 'Clear selection'}
              </button>
            )}
          </div>

          <div className="rounded-xl border border-slate-200 dark:border-slate-700 overflow-hidden">
            <div className="max-h-64 overflow-y-auto scrollbar-thin">
              <table className="w-full text-xs text-start">
                <thead className="bg-slate-100/80 dark:bg-slate-800/80 text-slate-600 dark:text-slate-400 font-bold sticky top-0 z-10 border-b border-slate-200 dark:border-slate-700">
                  <tr>
                    <th className="py-2.5 px-3 text-start w-10">#</th>
                    <th className="py-2.5 px-3 text-start">{isAr ? 'اسم الطالب' : 'Student Name'}</th>
                    <th className="py-2.5 px-3 text-start">{isAr ? 'الصف / الفصل' : 'Grade & Class'}</th>
                    <th className="py-2.5 px-3 text-center">{isAr ? 'الهوية الوطنية' : 'National ID'}</th>
                    <th className="py-2.5 px-3 text-center">{isAr ? 'نسبة الحضور' : 'Rate'}</th>
                    <th className="py-2.5 px-3 text-center">{isAr ? 'إجمالي الغياب' : 'Absences'}</th>
                    <th className="py-2.5 px-3 text-center w-24">{isAr ? 'الحالة' : 'Status'}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {filteredStudents.map((s, idx) => {
                    const isSelected = s.id === selectedStudentId;
                    return (
                      <tr
                        key={s.id}
                        onClick={() => setSelectedStudentId(s.id)}
                        className={`transition-colors cursor-pointer ${
                          isSelected
                            ? 'bg-primary/10 dark:bg-primary/20 font-bold'
                            : 'hover:bg-slate-50 dark:hover:bg-slate-800/50'
                        }`}
                      >
                        <td className="py-2.5 px-3 text-slate-400 font-mono text-[11px]">
                          {idx + 1}
                        </td>
                        <td className="py-2.5 px-3">
                          <div className="flex items-center gap-2">
                            <div
                              className={`w-6 h-6 rounded-full flex items-center justify-center font-bold text-[10px] shrink-0 ${
                                isSelected
                                  ? 'bg-primary text-white'
                                  : 'bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300'
                              }`}
                            >
                              {s.fullName?.charAt(0) || 'ط'}
                            </div>
                            <span className="font-bold text-slate-900 dark:text-slate-100">
                              {s.fullName}
                            </span>
                          </div>
                        </td>
                        <td className="py-2.5 px-3 text-slate-600 dark:text-slate-400">
                          {s.grade} • فصل {s.className}
                        </td>
                        <td className="py-2.5 px-3 text-center font-mono text-slate-500 text-[11px]">
                          {s.nationalId || '—'}
                        </td>
                        <td className="py-2.5 px-3 text-center font-mono font-bold">
                          <span
                            className={
                              (s.attendanceRate || 100) >= 90
                                ? 'text-teal-600 dark:text-teal-400'
                                : (s.attendanceRate || 100) >= 80
                                ? 'text-amber-600 dark:text-amber-400'
                                : 'text-rose-600 dark:text-rose-400'
                            }
                          >
                            %{s.attendanceRate || 100}
                          </span>
                        </td>
                        <td className="py-2.5 px-3 text-center font-mono font-bold text-slate-700 dark:text-slate-300">
                          {s.totalAbsences || 0} {isAr ? 'يوم' : 'd'}
                        </td>
                        <td className="py-2.5 px-3 text-center">
                          {isSelected ? (
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-primary text-white">
                              {isAr ? 'محدد حالياً' : 'Selected'}
                            </span>
                          ) : (s.totalAbsences || 0) >= 5 ? (
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-500/10 text-rose-600 border border-rose-500/20">
                              {isAr ? 'حرج' : 'Critical'}
                            </span>
                          ) : (s.totalAbsences || 0) >= 3 ? (
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/10 text-amber-600 border border-amber-500/20">
                              {isAr ? 'إنذار' : 'Warning'}
                            </span>
                          ) : (
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-medium bg-emerald-500/10 text-emerald-600">
                              {isAr ? 'منضبط' : 'Good'}
                            </span>
                          )}
                        </td>
                      </tr>
                    );
                  })}

                  {filteredStudents.length === 0 && (
                    <tr>
                      <td colSpan={7} className="py-8 text-center text-slate-400 text-xs">
                        {isAr ? 'لا يوجد طلاب مطابقون لشروط البحث المحددة.' : 'No students found matching your criteria.'}
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>

      {/* =========================================================================
          IF STUDENT SELECTED: DISPLAY HORIZON CONTROLLER & COMPLETE PROFILE
      ========================================================================= */}
      {currentStudent && (
        <div className="space-y-6">
          {/* HORIZON CONTROLLER CARD */}
          <div
            className="app-card rounded-2xl border p-4 sm:p-5 shadow-2xs space-y-4"
            style={{ backgroundColor: 'var(--app-card-bg)', borderColor: 'var(--app-card-border)' }}
          >
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 dark:border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <Calendar className="w-4 h-4 text-primary" />
                <h3 className="text-sm font-bold" style={{ color: 'var(--app-text-main)' }}>
                  {isAr ? 'تحديد الفترة الزمنية للإحصاء:' : 'Select Time Horizon:'}
                </h3>
              </div>
              <span className="text-xs px-2.5 py-1 rounded-full bg-primary/10 text-primary font-bold">
                {activeDateRange.label}
              </span>
            </div>

            {/* Horizon Selection Buttons */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
              <button
                onClick={() => setHorizonType('current_month')}
                className={`px-3 py-2.5 rounded-xl text-xs font-bold transition-all border cursor-pointer text-center ${
                  horizonType === 'current_month'
                    ? 'bg-primary text-white border-primary shadow-xs'
                    : 'bg-slate-50 dark:bg-slate-800/60 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:border-primary/40'
                }`}
              >
                {isAr ? '📅 الشهر الحالي' : '📅 Current Month'}
              </button>

              <button
                onClick={() => setHorizonType('term')}
                className={`px-3 py-2.5 rounded-xl text-xs font-bold transition-all border cursor-pointer text-center ${
                  horizonType === 'term'
                    ? 'bg-primary text-white border-primary shadow-xs'
                    : 'bg-slate-50 dark:bg-slate-800/60 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:border-primary/40'
                }`}
              >
                {isAr ? '🎓 الفصل الدراسي (الترم)' : '🎓 Academic Term'}
              </button>

              <button
                onClick={() => setHorizonType('full_year')}
                className={`px-3 py-2.5 rounded-xl text-xs font-bold transition-all border cursor-pointer text-center ${
                  horizonType === 'full_year'
                    ? 'bg-primary text-white border-primary shadow-xs'
                    : 'bg-slate-50 dark:bg-slate-800/60 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:border-primary/40'
                }`}
              >
                {isAr ? '🏛️ السنة الدراسية كاملة' : '🏛️ Full Academic Year'}
              </button>

              <button
                onClick={() => setHorizonType('custom')}
                className={`px-3 py-2.5 rounded-xl text-xs font-bold transition-all border cursor-pointer text-center ${
                  horizonType === 'custom'
                    ? 'bg-primary text-white border-primary shadow-xs'
                    : 'bg-slate-50 dark:bg-slate-800/60 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:border-primary/40'
                }`}
              >
                {isAr ? '⚙️ مدة مخصصة (تحديد التواريخ)' : '⚙️ Custom Range'}
              </button>
            </div>

            {/* Sub-selectors depending on Horizon type */}
            {horizonType === 'term' && (
              <div className="pt-2 flex flex-wrap items-center gap-2">
                <span className="text-xs text-slate-500 font-bold">{isAr ? 'اختر الفصل الدراسي:' : 'Select Term:'}</span>
                {academicTerms.map((term) => (
                  <button
                    key={term.id}
                    onClick={() => setSelectedTermId(term.id)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold border transition-colors cursor-pointer ${
                      selectedTermId === term.id
                        ? 'bg-indigo-600 text-white border-indigo-600'
                        : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700'
                    }`}
                  >
                    {isAr ? term.nameAr : term.nameEn}
                    <span className="ms-1.5 text-[10px] opacity-75 font-mono">
                      ({term.startDate} ➔ {term.endDate})
                    </span>
                  </button>
                ))}
              </div>
            )}

            {horizonType === 'custom' && (
              <div className="pt-2 flex flex-wrap items-center gap-3 bg-slate-50/80 dark:bg-slate-800/40 p-3 rounded-xl border border-slate-200/80 dark:border-slate-700/80">
                <div className="flex items-center gap-2">
                  <label className="text-xs font-bold text-slate-600 dark:text-slate-300">{isAr ? 'من تاريخ:' : 'From:'}</label>
                  <input
                    type="date"
                    value={customStartDate}
                    onChange={(e) => setCustomStartDate(e.target.value)}
                    className="text-xs bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-2.5 py-1.5 focus:outline-none"
                  />
                </div>
                <div className="flex items-center gap-2">
                  <label className="text-xs font-bold text-slate-600 dark:text-slate-300">{isAr ? 'إلى تاريخ:' : 'To:'}</label>
                  <input
                    type="date"
                    value={customEndDate}
                    onChange={(e) => setCustomEndDate(e.target.value)}
                    className="text-xs bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-2.5 py-1.5 focus:outline-none"
                  />
                </div>
              </div>
            )}
          </div>

          {/* STUDENT HERO IDENTITY CARD */}
          <div
            className="app-card rounded-2xl border p-5 shadow-2xs relative overflow-hidden"
            style={{ backgroundColor: 'var(--app-card-bg)', borderColor: 'var(--app-card-border)' }}
          >
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="flex items-center gap-3.5">
                <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-primary to-primary/70 text-white font-black text-xl flex items-center justify-center shadow-xs">
                  {currentStudent.fullName?.charAt(0) || 'ط'}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h2 className="text-lg font-black" style={{ color: 'var(--app-text-main)' }}>
                      {currentStudent.fullName}
                    </h2>
                    {currentStudent.nationalId && (
                      <span className="text-[11px] font-mono px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
                        {currentStudent.nationalId}
                      </span>
                    )}
                  </div>
                  <div className="flex flex-wrap items-center gap-3 text-xs text-slate-500 dark:text-slate-400 mt-1">
                    <span>
                      {currentStudent.grade} • فصل {currentStudent.className}
                    </span>
                    <span>• ولي الأمر: {currentStudent.guardianName || 'غير مسجل'}</span>
                    <span>• هاتف: {currentStudent.guardianPhone || '—'}</span>
                  </div>
                </div>
              </div>

              {/* Status Pill */}
              <div className="flex sm:flex-col items-end gap-1.5">
                <span
                  className={`px-3 py-1 rounded-full text-xs font-bold border ${
                    (studentAbsenceAnalysis?.unexcusedDaysCount || 0) >= 5
                      ? 'bg-rose-500/10 text-rose-600 border-rose-500/20'
                      : (studentAbsenceAnalysis?.unexcusedDaysCount || 0) >= 3
                      ? 'bg-amber-500/10 text-amber-600 border-amber-500/20'
                      : 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20'
                  }`}
                >
                  {(studentAbsenceAnalysis?.unexcusedDaysCount || 0) >= 5
                    ? isAr ? '⚠️ تجاوز حد الحرمان' : 'Critical Risk'
                    : (studentAbsenceAnalysis?.unexcusedDaysCount || 0) >= 3
                    ? isAr ? '⚡ إنذار متابعة' : 'Warning Alert'
                    : isAr ? '✅ منضبط' : 'Good Standing'}
                </span>
                <span className="text-[11px] text-slate-400">
                  {isAr ? 'الفترة: ' : 'Horizon: '} {activeDateRange.label}
                </span>
              </div>
            </div>
          </div>

          {/* 4 STATISTICAL TILES FOR THE SELECTED PERIOD */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Tile 1: Attendance Rate */}
            <div
              className="app-card rounded-2xl border p-4 shadow-2xs"
              style={{ backgroundColor: 'var(--app-card-bg)', borderColor: 'var(--app-card-border)' }}
            >
              <div className="flex items-center justify-between text-xs font-bold text-slate-500 dark:text-slate-400 mb-2">
                <span>{isAr ? 'نسبة حضور الطالب' : 'Attendance Rate'}</span>
                <UserCheck className="w-4 h-4 text-teal-600" />
              </div>
              <div className="text-3xl font-black text-teal-600 dark:text-teal-400">
                %{studentAbsenceAnalysis?.attendanceRate}
              </div>
              <div className="w-full bg-slate-200 dark:bg-slate-700 h-1.5 rounded-full mt-3 overflow-hidden">
                <div
                  className="h-full bg-teal-500 rounded-full"
                  style={{ width: `${Math.min(100, studentAbsenceAnalysis?.attendanceRate || 0)}%` }}
                />
              </div>
              <span className="text-[11px] text-slate-400 mt-2 block">
                {isAr ? 'خلال المدة المحددة' : 'In selected horizon'}
              </span>
            </div>

            {/* Tile 2: Total Absences Breakdown */}
            <div
              className="app-card rounded-2xl border p-4 shadow-2xs"
              style={{ backgroundColor: 'var(--app-card-bg)', borderColor: 'var(--app-card-border)' }}
            >
              <div className="flex items-center justify-between text-xs font-bold text-slate-500 dark:text-slate-400 mb-2">
                <span>{isAr ? 'إجمالي أيام الغياب' : 'Total Absences'}</span>
                <AlertTriangle className="w-4 h-4 text-rose-500" />
              </div>
              <div className="flex items-baseline gap-2">
                <span className="text-3xl font-black text-rose-600 dark:text-rose-400">
                  {studentAbsenceAnalysis?.absentDaysCount}
                </span>
                <span className="text-xs text-slate-500">{isAr ? 'يوم' : 'days'}</span>
              </div>
              <div className="mt-2.5 flex items-center justify-between text-[11px] pt-1 border-t border-slate-100 dark:border-slate-800">
                <span className="text-rose-600 font-bold">
                  {isAr ? 'بدون عذر:' : 'Unexcused:'} {studentAbsenceAnalysis?.unexcusedDaysCount}
                </span>
                <span className="text-blue-600 font-bold">
                  {isAr ? 'بعذر مقبول:' : 'Excused:'} {studentAbsenceAnalysis?.excusedDaysCount}
                </span>
              </div>
            </div>

            {/* Tile 3: Tardiness */}
            <div
              className="app-card rounded-2xl border p-4 shadow-2xs"
              style={{ backgroundColor: 'var(--app-card-bg)', borderColor: 'var(--app-card-border)' }}
            >
              <div className="flex items-center justify-between text-xs font-bold text-slate-500 dark:text-slate-400 mb-2">
                <span>{isAr ? 'التأخر الصباحي' : 'Tardiness'}</span>
                <Clock className="w-4 h-4 text-amber-500" />
              </div>
              <div className="flex items-baseline gap-2">
                <span className="text-3xl font-black text-amber-600 dark:text-amber-400">
                  {studentAbsenceAnalysis?.lateDaysCount}
                </span>
                <span className="text-xs text-slate-500">{isAr ? 'مرات' : 'times'}</span>
              </div>
              <div className="mt-2.5 text-[11px] text-slate-500 pt-1 border-t border-slate-100 dark:border-slate-800">
                {isAr
                  ? `إجمالي التأخر: ${studentAbsenceAnalysis?.totalMinutesLate} دقيقة`
                  : `Total: ${studentAbsenceAnalysis?.totalMinutesLate} minutes`}
              </div>
            </div>

            {/* Tile 4: Behavioral Infractions */}
            <div
              className="app-card rounded-2xl border p-4 shadow-2xs"
              style={{ backgroundColor: 'var(--app-card-bg)', borderColor: 'var(--app-card-border)' }}
            >
              <div className="flex items-center justify-between text-xs font-bold text-slate-500 dark:text-slate-400 mb-2">
                <span>{isAr ? 'المخالفات السلوكية' : 'Conduct Infractions'}</span>
                <ShieldAlert className="w-4 h-4 text-violet-500" />
              </div>
              <div className="flex items-baseline gap-2">
                <span className="text-3xl font-black text-violet-600 dark:text-violet-400">
                  {infractionsList.length}
                </span>
                <span className="text-xs text-slate-500">{isAr ? 'مخالفة' : 'infractions'}</span>
              </div>
              <div className="mt-2.5 text-[11px] text-emerald-600 font-bold pt-1 border-t border-slate-100 dark:border-slate-800">
                {isAr
                  ? `نقاط التميز الإيجابي: +${positivePointsList.reduce((acc, p) => acc + (p.points || 0), 0)}`
                  : `Positive merits: +${positivePointsList.reduce((acc, p) => acc + (p.points || 0), 0)}`}
              </div>
            </div>
          </div>

          {/* TWO PARALLEL SECTIONS: ABSENCE TIMELINE & CONDUCT VIOLATIONS */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* SECTION 1: DETAILED ABSENCE LOG FOR THE PERIOD */}
            <div
              className="app-card rounded-2xl border p-5 shadow-2xs flex flex-col justify-between"
              style={{ backgroundColor: 'var(--app-card-bg)', borderColor: 'var(--app-card-border)' }}
            >
              <div className="space-y-3">
                <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
                  <div className="flex items-center gap-2">
                    <FileText className="w-4 h-4 text-rose-500" />
                    <h3 className="text-sm font-bold" style={{ color: 'var(--app-text-main)' }}>
                      {isAr ? 'سجل تواريخ الغياب والتأخر في هذه الفترة' : 'Absence & Late Dates Log'}
                    </h3>
                  </div>
                  <span className="text-xs px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 font-bold text-slate-600 dark:text-slate-300">
                    {studentAbsenceAnalysis?.records.length} {isAr ? 'سجل' : 'entries'}
                  </span>
                </div>

                <div className="space-y-2 max-h-96 overflow-y-auto scrollbar-thin pe-1">
                  {studentAbsenceAnalysis?.records.map((entry, idx) => (
                    <div
                      key={idx}
                      className="p-3 rounded-xl bg-slate-50/70 dark:bg-slate-800/40 border border-slate-200/60 dark:border-slate-700/60 flex items-start justify-between gap-3 text-xs"
                    >
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span
                            className={`px-2 py-0.5 rounded-md font-bold text-[10px] ${
                              entry.status === 'late'
                                ? 'bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300'
                                : entry.isExcused
                                ? 'bg-blue-100 text-blue-800 dark:bg-blue-950/60 dark:text-blue-300'
                                : 'bg-rose-100 text-rose-800 dark:bg-rose-950/60 dark:text-rose-300'
                            }`}
                          >
                            {entry.status === 'late'
                              ? isAr ? `تأخر (${entry.minutesLate} دقيقة)` : `Late (${entry.minutesLate}m)`
                              : entry.isExcused
                              ? isAr ? 'غياب بعذر معتمد' : 'Excused Absence'
                              : isAr ? 'غياب بدون عذر' : 'Unexcused Absence'}
                          </span>
                          <span className="font-mono text-slate-500 font-semibold">{entry.date}</span>
                        </div>
                        {entry.justificationReason && (
                          <p className="text-[11px] text-slate-600 dark:text-slate-300">
                            <strong>{isAr ? 'سبب العذر: ' : 'Excuse: '}</strong>
                            {entry.justificationReason}
                          </p>
                        )}
                        {entry.note && (
                          <p className="text-[11px] text-slate-500 italic">
                            {isAr ? 'ملاحظة المعلم: ' : 'Note: '} {entry.note}
                          </p>
                        )}
                      </div>
                      <span className="text-[10px] text-slate-400 font-medium whitespace-nowrap">
                        {entry.teacherName || entry.className}
                      </span>
                    </div>
                  ))}

                  {studentAbsenceAnalysis?.records.length === 0 && (
                    <div className="p-8 text-center text-slate-400 space-y-1">
                      <UserCheck className="w-8 h-8 text-emerald-500 mx-auto" />
                      <p className="text-xs font-bold text-slate-600 dark:text-slate-300">
                        {isAr ? 'لا توجد أي سجلات غياب أو تأخر في هذه الفترة' : 'No absences or tardies in this period'}
                      </p>
                      <p className="text-[11px] text-slate-400">
                        {isAr ? 'حضور الطالب منتظم بنسبة 100% خلال المدة المحددة.' : '100% attendance recorded.'}
                      </p>
                    </div>
                  )}
                </div>
              </div>

              <div className="pt-3 border-t border-slate-100 dark:border-slate-800 mt-3 text-xs text-slate-400 flex items-center justify-between">
                <span>{isAr ? 'التحديث: لحظي ومباشر' : 'Live synced'}</span>
                <span>{activeDateRange.label}</span>
              </div>
            </div>

            {/* SECTION 2: CONDUCT VIOLATIONS & INFRACTIONS */}
            <div
              className="app-card rounded-2xl border p-5 shadow-2xs flex flex-col justify-between"
              style={{ backgroundColor: 'var(--app-card-bg)', borderColor: 'var(--app-card-border)' }}
            >
              <div className="space-y-3">
                <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
                  <div className="flex items-center gap-2">
                    <ShieldAlert className="w-4 h-4 text-violet-500" />
                    <h3 className="text-sm font-bold" style={{ color: 'var(--app-text-main)' }}>
                      {isAr ? 'سجل المخالفات والتصرفات السلوكية' : 'Conduct Infractions & Violations'}
                    </h3>
                  </div>
                  <span className="text-xs px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 font-bold text-slate-600 dark:text-slate-300">
                    {infractionsList.length} {isAr ? 'مخالفة' : 'infractions'}
                  </span>
                </div>

                <div className="space-y-2.5 max-h-96 overflow-y-auto scrollbar-thin pe-1">
                  {infractionsList.map((incident) => (
                    <div
                      key={incident.id}
                      className="p-3 rounded-xl bg-rose-50/50 dark:bg-rose-950/20 border border-rose-200/50 dark:border-rose-900/30 text-xs space-y-1.5"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className="px-2 py-0.5 rounded bg-rose-600 text-white font-bold text-[10px]">
                            {incident.severity === 'major'
                              ? isAr ? 'مخالفة جسيمة' : 'Major'
                              : incident.severity === 'moderate'
                              ? isAr ? 'مخالفة متوسطة' : 'Moderate'
                              : isAr ? 'مخالفة بسيطة' : 'Minor'}
                          </span>
                          <span className="font-bold text-slate-900 dark:text-slate-100">{incident.title}</span>
                        </div>
                        <span className="font-mono text-[10px] text-slate-500">{incident.date}</span>
                      </div>

                      {incident.description && (
                        <p className="text-[11px] text-slate-600 dark:text-slate-300">{incident.description}</p>
                      )}

                      <div className="flex items-center justify-between text-[10px] text-slate-500 pt-1 border-t border-rose-100 dark:border-rose-900/40">
                        <span>
                          {isAr ? 'الإجراء: ' : 'Action: '} {incident.actionTaken || (isAr ? 'قيد المتابعة' : 'Pending')}
                        </span>
                        <span>
                          {isAr ? 'بواسطة: ' : 'By: '} {incident.recordedBy}
                        </span>
                      </div>
                    </div>
                  ))}

                  {infractionsList.length === 0 && (
                    <div className="p-8 text-center text-slate-400 space-y-1">
                      <Award className="w-8 h-8 text-emerald-500 mx-auto" />
                      <p className="text-xs font-bold text-slate-600 dark:text-slate-300">
                        {isAr ? 'سجل السلوك نظيف تماماً!' : 'Clean Conduct Record!'}
                      </p>
                      <p className="text-[11px] text-slate-400">
                        {isAr
                          ? 'لم تسجل أي مخالفات سلوكية على الطالب خلال هذه الفترة.'
                          : 'No infractions recorded for this student in the chosen timeframe.'}
                      </p>
                    </div>
                  )}
                </div>
              </div>

              <div className="pt-3 border-t border-slate-100 dark:border-slate-800 mt-3 text-xs text-slate-400 flex items-center justify-between">
                <span>{isAr ? 'لائحة السلوك والمواظبة المدرسية' : 'School Conduct Policy'}</span>
                {positivePointsList.length > 0 && (
                  <span className="text-emerald-600 font-bold">
                    {isAr
                      ? `✨ لديه ${positivePointsList.length} بطاقات شكر وتقدير`
                      : `✨ Has ${positivePointsList.length} merits`}
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* =========================================================================
          EMPTY STATE WHEN NO STUDENT IS SELECTED
      ========================================================================= */}
      {!currentStudent && (
        <div
          className="app-card rounded-2xl border p-12 text-center shadow-2xs space-y-3"
          style={{ backgroundColor: 'var(--app-card-bg)', borderColor: 'var(--app-card-border)' }}
        >
          <div className="w-16 h-16 rounded-3xl bg-primary/10 text-primary flex items-center justify-center mx-auto shadow-xs">
            <Search className="w-8 h-8" />
          </div>
          <h3 className="text-base font-bold" style={{ color: 'var(--app-text-main)' }}>
            {isAr ? 'الرجاء اختيار أو البحث عن طالب لعرض ملف الغياب' : 'Please select or search for a student'}
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 max-w-md mx-auto">
            {isAr
              ? 'اختر الصف ثم الفصل من الأعلى، أو اكتب اسم الطالب في مربع البحث لاحتساب مرات الغياب والتأخر والمخالفات في أي مدة تريدها.'
              : 'Select grade and class above, or type in search box to view absence counts, tardiness, and conduct violations for any chosen horizon.'}
          </p>
        </div>
      )}
      {/* =========================================================================
          OFFICIAL PRINTABLE CANVAS (FOR VECTOR PDF & DIRECT PRINT)
      ========================================================================= */}
      {currentStudent && (
        <div style={{ display: 'none' }}>
          <div
            ref={printAreaRef}
            className="p-8 bg-white text-slate-900 space-y-6 font-sans"
            style={{ width: '800px', backgroundColor: '#ffffff', color: '#0f172a', direction: 'rtl', fontFamily: 'Cairo, Tahoma, sans-serif' }}
          >
            {/* Ministry & School Official Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', borderBottom: '2px solid #0f172a', paddingBottom: '16px' }}>
              <div style={{ textAlign: 'right', fontSize: '12px', lineHeight: '1.6' }}>
                <div style={{ fontWeight: 'bold', fontSize: '14px' }}>
                  {schoolProfile?.ministryHeaderAr || 'المملكة العربية السعودية\nوزارة التعليم'}
                </div>
                <div style={{ fontWeight: '600' }}>{schoolProfile?.schoolName || 'المدرسة'}</div>
                <div style={{ color: '#64748b' }}>كود المنشأة: {schoolProfile?.schoolCode || '—'}</div>
                {schoolProfile?.directorateAr && <div style={{ color: '#64748b' }}>{schoolProfile.directorateAr}</div>}
              </div>

              <div style={{ textAlign: 'center', lineHeight: '1.4' }}>
                <div style={{ fontWeight: '900', fontSize: '18px', color: '#0f172a' }}>تقرير سجل غياب وانضباط الطالب</div>
                <div style={{ fontSize: '13px', color: '#047857', fontWeight: 'bold' }}>
                  {activeDateRange.label}
                </div>
                <div style={{ fontSize: '11px', color: '#64748b', marginTop: '4px' }}>
                  تاريخ استخراج التقرير: {new Date().toLocaleDateString('ar-SA')}
                </div>
              </div>

              <div style={{ textAlign: 'left', fontSize: '11px', lineHeight: '1.6', direction: 'ltr' }}>
                <div>العام: {schoolProfile?.academicYear?.hijriYear || '1446-1447 هـ'}</div>
                <div>الفصل: {currentStudent.className}</div>
                <div>الصف: {currentStudent.grade}</div>
              </div>
            </div>

            {/* Student Identity Card Box */}
            <div style={{ border: '1px solid #cbd5e1', borderRadius: '8px', padding: '12px 16px', backgroundColor: '#f8fafc', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <span style={{ fontSize: '11px', color: '#64748b' }}>اسم الطالب: </span>
                <strong style={{ fontSize: '15px', color: '#0f172a' }}>{currentStudent.fullName}</strong>
                <span style={{ margin: '0 8px', color: '#cbd5e1' }}>|</span>
                <span style={{ fontSize: '11px', color: '#64748b' }}>رقم السجل المدني: </span>
                <strong style={{ fontSize: '13px', fontFamily: 'monospace' }}>{currentStudent.nationalId || '—'}</strong>
              </div>
              <div>
                <span style={{ fontSize: '11px', color: '#64748b' }}>ولي الأمر: </span>
                <strong style={{ fontSize: '12px' }}>{currentStudent.guardianName || '—'}</strong>
                <span style={{ margin: '0 8px', color: '#cbd5e1' }}>|</span>
                <span style={{ fontSize: '11px', color: '#64748b' }}>الهاتف: </span>
                <strong style={{ fontSize: '12px', fontFamily: 'monospace' }}>{currentStudent.guardianPhone || '—'}</strong>
              </div>
            </div>

            {/* Executive Statistical Summary Grid */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '12px', textAlign: 'center' }}>
              <div style={{ border: '1px solid #cbd5e1', borderRadius: '8px', padding: '10px', backgroundColor: '#f0fdf4' }}>
                <div style={{ fontSize: '11px', color: '#166534', fontWeight: 'bold' }}>نسبة الحضور</div>
                <div style={{ fontSize: '20px', fontWeight: '900', color: '#15803d' }}>%{studentAbsenceAnalysis?.attendanceRate}</div>
              </div>
              <div style={{ border: '1px solid #cbd5e1', borderRadius: '8px', padding: '10px', backgroundColor: '#fef2f2' }}>
                <div style={{ fontSize: '11px', color: '#991b1b', fontWeight: 'bold' }}>إجمالي الغياب (بدون عذر)</div>
                <div style={{ fontSize: '20px', fontWeight: '900', color: '#b91c1c' }}>{studentAbsenceAnalysis?.unexcusedDaysCount} يوم</div>
              </div>
              <div style={{ border: '1px solid #cbd5e1', borderRadius: '8px', padding: '10px', backgroundColor: '#eff6ff' }}>
                <div style={{ fontSize: '11px', color: '#1e40af', fontWeight: 'bold' }}>غياب بعذر معتمد</div>
                <div style={{ fontSize: '20px', fontWeight: '900', color: '#1d4ed8' }}>{studentAbsenceAnalysis?.excusedDaysCount} يوم</div>
              </div>
              <div style={{ border: '1px solid #cbd5e1', borderRadius: '8px', padding: '10px', backgroundColor: '#fffbeb' }}>
                <div style={{ fontSize: '11px', color: '#92400e', fontWeight: 'bold' }}>مرات التأخر الصباحي</div>
                <div style={{ fontSize: '20px', fontWeight: '900', color: '#b45309' }}>{studentAbsenceAnalysis?.lateDaysCount} مرات</div>
              </div>
            </div>

            {/* Absence Dates Table */}
            <div style={{ marginTop: '16px' }}>
              <div style={{ fontWeight: 'bold', fontSize: '13px', marginBottom: '8px', borderBottom: '1px solid #e2e8f0', paddingBottom: '4px' }}>
                سجل تواريخ الغياب والتأخر في الفترة:
              </div>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '11px', textAlign: 'right' }}>
                <thead>
                  <tr style={{ backgroundColor: '#f1f5f9', borderBottom: '2px solid #cbd5e1' }}>
                    <th style={{ padding: '8px', border: '1px solid #cbd5e1', width: '30px', textAlign: 'center' }}>#</th>
                    <th style={{ padding: '8px', border: '1px solid #cbd5e1', width: '100px' }}>التاريخ</th>
                    <th style={{ padding: '8px', border: '1px solid #cbd5e1', width: '120px' }}>نوع الحالة</th>
                    <th style={{ padding: '8px', border: '1px solid #cbd5e1' }}>التفاصيل وملاحظات العذر</th>
                    <th style={{ padding: '8px', border: '1px solid #cbd5e1', width: '120px' }}>المعلم / الراصد</th>
                  </tr>
                </thead>
                <tbody>
                  {studentAbsenceAnalysis?.records.map((r, i) => (
                    <tr key={i} style={{ borderBottom: '1px solid #e2e8f0' }}>
                      <td style={{ padding: '6px', border: '1px solid #cbd5e1', textAlign: 'center', fontFamily: 'monospace' }}>{i + 1}</td>
                      <td style={{ padding: '6px', border: '1px solid #cbd5e1', fontFamily: 'monospace', fontWeight: 'bold' }}>{r.date}</td>
                      <td style={{ padding: '6px', border: '1px solid #cbd5e1' }}>
                        {r.status === 'late' ? `تأخر (${r.minutesLate} دقيقة)` : r.isExcused ? 'غياب بعذر معتمد' : 'غياب بدون عذر'}
                      </td>
                      <td style={{ padding: '6px', border: '1px solid #cbd5e1' }}>
                        {r.justificationReason || r.note || '—'}
                      </td>
                      <td style={{ padding: '6px', border: '1px solid #cbd5e1' }}>{r.teacherName || r.className}</td>
                    </tr>
                  ))}
                  {(!studentAbsenceAnalysis?.records || studentAbsenceAnalysis.records.length === 0) && (
                    <tr>
                      <td colSpan={5} style={{ padding: '16px', textAlign: 'center', color: '#64748b' }}>
                        لا توجد أي أيام غياب أو تأخر مسجلة للطالب خلال هذه الفترة.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            {/* Conduct Violations Section if any */}
            {infractionsList.length > 0 && (
              <div style={{ marginTop: '16px' }}>
                <div style={{ fontWeight: 'bold', fontSize: '13px', marginBottom: '8px', borderBottom: '1px solid #e2e8f0', paddingBottom: '4px', color: '#991b1b' }}>
                  المخالفات السلوكية المسجلة في الفترة:
                </div>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '11px', textAlign: 'right' }}>
                  <thead>
                    <tr style={{ backgroundColor: '#fef2f2', borderBottom: '2px solid #fecaca' }}>
                      <th style={{ padding: '6px', border: '1px solid #fecaca', width: '30px', textAlign: 'center' }}>#</th>
                      <th style={{ padding: '6px', border: '1px solid #fecaca', width: '90px' }}>التاريخ</th>
                      <th style={{ padding: '6px', border: '1px solid #fecaca', width: '100px' }}>الدرجة</th>
                      <th style={{ padding: '6px', border: '1px solid #fecaca' }}>وصف المخالفة</th>
                      <th style={{ padding: '6px', border: '1px solid #fecaca', width: '120px' }}>الإجراء المتخذ</th>
                    </tr>
                  </thead>
                  <tbody>
                    {infractionsList.map((inf, i) => (
                      <tr key={inf.id} style={{ borderBottom: '1px solid #fecaca' }}>
                        <td style={{ padding: '6px', border: '1px solid #fecaca', textAlign: 'center' }}>{i + 1}</td>
                        <td style={{ padding: '6px', border: '1px solid #fecaca', fontFamily: 'monospace' }}>{inf.date}</td>
                        <td style={{ padding: '6px', border: '1px solid #fecaca', fontWeight: 'bold', color: '#b91c1c' }}>
                          {inf.severity === 'major' ? 'جسيمة' : inf.severity === 'moderate' ? 'متوسطة' : 'بسيطة'}
                        </td>
                        <td style={{ padding: '6px', border: '1px solid #fecaca' }}>{inf.title} - {inf.description}</td>
                        <td style={{ padding: '6px', border: '1px solid #fecaca' }}>{inf.actionTaken || 'متابعة المرشد'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {/* Official Signatures & Stamp Footer */}
            <div style={{ marginTop: '32px', paddingTop: '16px', borderTop: '2px solid #0f172a', display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '12px', textAlign: 'center' }}>
              <div style={{ width: '200px' }}>
                <div style={{ fontWeight: 'bold', marginBottom: '32px' }}>المرشد الطلابي / الوكيل</div>
                <div style={{ borderTop: '1px dashed #94a3b8', paddingTop: '4px', color: '#64748b' }}>التوقيع: .....................</div>
              </div>

              <div style={{ width: '150px' }}>
                <div style={{ border: '2px dashed #94a3b8', borderRadius: '50%', width: '90px', height: '90px', margin: '0 auto', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#94a3b8', fontSize: '10px' }}>
                  ختم المدرسة
                </div>
              </div>

              <div style={{ width: '200px' }}>
                <div style={{ fontWeight: 'bold', marginBottom: '32px' }}>مدير المدرسة</div>
                <div style={{ borderTop: '1px dashed #94a3b8', paddingTop: '4px', color: '#64748b' }}>
                  {schoolProfile?.leadership?.principalName || 'التوقيع والاعتماد'}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

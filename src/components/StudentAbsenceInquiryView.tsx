import React, { useState, useMemo } from 'react';
import { useAttendance } from '../context/AttendanceContext';
import { Student, StudentBehaviourIncident, AttendanceRecord, Justification } from '../types/attendance';
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

  // Handle Print Action
  const handlePrint = () => {
    window.print();
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
          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 border border-slate-300 dark:border-slate-700 cursor-pointer transition-colors"
            >
              <Printer className="w-4 h-4" />
              <span>{isAr ? 'طباعة تقرير الطالب' : 'Print Report'}</span>
            </button>
            <button
              onClick={handleSendWarning}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold bg-rose-600 hover:bg-rose-700 text-white cursor-pointer transition-colors shadow-xs"
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

        {/* Student Selector Quick Strip */}
        <div className="pt-2 border-t border-slate-100 dark:border-slate-800">
          <div className="flex items-center justify-between mb-2 text-xs">
            <span className="text-slate-500 dark:text-slate-400">
              {isAr
                ? `الطلاب المطابقون (${filteredStudents.length} طالب):`
                : `Matched Students (${filteredStudents.length}):`}
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

          <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-thin">
            {filteredStudents.slice(0, 15).map((s) => {
              const isSelected = s.id === selectedStudentId;
              return (
                <button
                  key={s.id}
                  onClick={() => setSelectedStudentId(s.id)}
                  className={`px-3 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-all border shrink-0 cursor-pointer flex items-center gap-2 ${
                    isSelected
                      ? 'bg-primary text-white border-primary shadow-xs scale-102'
                      : 'bg-slate-50 dark:bg-slate-800/60 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:border-primary/50'
                  }`}
                >
                  <div
                    className={`w-6 h-6 rounded-full flex items-center justify-center font-bold text-[10px] ${
                      isSelected ? 'bg-white/20 text-white' : 'bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300'
                    }`}
                  >
                    {s.fullName?.charAt(0) || 'ط'}
                  </div>
                  <div className="text-start">
                    <span className="block font-bold leading-tight">{s.fullName}</span>
                    <span className="text-[10px] opacity-75 font-mono">{s.className}</span>
                  </div>
                  {s.totalAbsences >= 5 && (
                    <span className="w-2 h-2 rounded-full bg-rose-500 animate-pulse" title="غياب حرج" />
                  )}
                </button>
              );
            })}

            {filteredStudents.length === 0 && (
              <div className="w-full text-center py-4 text-xs text-slate-400">
                {isAr ? 'لا يوجد طلاب مطابقون لشروط البحث المحددة.' : 'No students matching the criteria.'}
              </div>
            )}

            {filteredStudents.length > 15 && (
              <div className="text-[11px] text-slate-400 flex items-center px-2 shrink-0">
                {isAr ? `+ ${filteredStudents.length - 15} طالب آخر (استخدم البحث للتحديد)` : `+ more`}
              </div>
            )}
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
    </div>
  );
};

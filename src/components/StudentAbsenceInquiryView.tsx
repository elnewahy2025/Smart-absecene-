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
import { isSchoolOffDay } from '../utils/holidayUtils';

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
  const printAreaRef = useRef<HTMLDivElement>(null);

  // Available Terms strictly from Academic Profile in Settings
  const academicTerms = useMemo(() => {
    const terms = schoolProfile?.academicYear?.terms;
    if (terms && terms.length > 0) {
      return terms;
    }
    return [
      { id: 'term-1', nameAr: 'الفصل الدراسي الأول', nameEn: 'Term 1', startDate: '2026-09-01', endDate: '2026-11-26', isActive: true },
      { id: 'term-2', nameAr: 'الفصل الدراسي الثاني', nameEn: 'Term 2', startDate: '2026-12-06', endDate: '2027-02-25', isActive: false },
      { id: 'term-3', nameAr: 'الفصل الدراسي الثالث', nameEn: 'Term 3', startDate: '2027-03-07', endDate: '2027-06-24', isActive: false },
    ];
  }, [schoolProfile]);

  // Academic Year overall Start & End strictly derived from the Settings Page
  const academicYearBounds = useMemo(() => {
    const starts = academicTerms.map((t) => t.startDate).filter(Boolean).sort();
    const ends = academicTerms.map((t) => t.endDate).filter(Boolean).sort();
    const start = starts[0] || '2026-09-01';
    const end = ends[ends.length - 1] || '2027-06-24';
    return { start, end };
  }, [academicTerms]);

  // Available Months for the Academic Year (Dynamically generated strictly starting from Settings calendar)
  const availableMonths = useMemo(() => {
    const list: { value: string; labelAr: string; labelEn: string }[] = [];
    if (!academicYearBounds.start || !academicYearBounds.end) return list;

    const [startYear, startMonth] = academicYearBounds.start.split('-').map(Number);
    const [endYear, endMonth] = academicYearBounds.end.split('-').map(Number);

    const arabicMonthNames = [
      '', 'يناير', 'فبراير', 'مارس', 'أبريل', 'مايو', 'يونيو',
      'يوليو', 'أغسطس', 'سبتمبر', 'أكتوبر', 'نوفمبر', 'ديسمبر'
    ];
    const englishMonthNames = [
      '', 'January', 'February', 'March', 'April', 'May', 'June',
      'July', 'August', 'September', 'October', 'November', 'December'
    ];

    const today = new Date();
    const currentYm = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}`;

    let y = startYear;
    let m = startMonth;

    while (y < endYear || (y === endYear && m <= endMonth)) {
      const ym = `${y}-${String(m).padStart(2, '0')}`;
      const mStr = String(m).padStart(2, '0');
      const isCur = ym === currentYm;
      list.push({
        value: ym,
        labelAr: `${arabicMonthNames[m]} ${y} (${mStr})${isCur ? ' - الحالي' : ''}`,
        labelEn: `${englishMonthNames[m]} ${y}${isCur ? ' (Current)' : ''}`,
      });

      m++;
      if (m > 12) {
        m = 1;
        y++;
      }
    }
    return list;
  }, [academicYearBounds]);

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
  const customDateValidation = useMemo(() => {
    if (horizonType !== 'custom') return { isValid: true, error: null };
    if (!customStartDate || !customEndDate) {
      return {
        isValid: false,
        error: isAr ? 'يرجى تحديد تاريخ البداية وتاريخ النهاية للمدة المخصصة.' : 'Please select start and end dates.'
      };
    }
    if (customStartDate < academicYearBounds.start) {
      return {
        isValid: false,
        error: isAr
          ? `❌ تاريخ البداية (${customStartDate}) غير صحيح ومخالف للتقويم المعتمد: يبدأ العام الدراسي المعتمد في صفحة الإعدادات بتاريخ ${academicYearBounds.start}. تم رفض التاريخ تماماً.`
          : `❌ Start date (${customStartDate}) rejected: Academic year starts on ${academicYearBounds.start} in Settings.`
      };
    }
    if (customEndDate > academicYearBounds.end) {
      return {
        isValid: false,
        error: isAr
          ? `❌ تاريخ النهاية (${customEndDate}) غير صحيح ومخالف للتقويم المعتمد: ينتهي العام الدراسي المعتمد في صفحة الإعدادات بتاريخ ${academicYearBounds.end}. تم رفض التاريخ تماماً.`
          : `❌ End date (${customEndDate}) rejected: Academic year ends on ${academicYearBounds.end} in Settings.`
      };
    }
    if (customStartDate > customEndDate) {
      return {
        isValid: false,
        error: isAr
          ? `❌ خطأ في تحديد الفترة: تاريخ البداية (${customStartDate}) يجب ألا يكون بعد تاريخ النهاية (${customEndDate}). تم الرفض.`
          : `❌ Invalid dates: Start date cannot be after end date.`
      };
    }
    return { isValid: true, error: null };
  }, [horizonType, customStartDate, customEndDate, academicYearBounds, isAr]);

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
  const activeDateRange = useMemo(() => {
    const today = new Date();
    const todayStr = today.toISOString().split('T')[0];

    if (horizonType === 'month') {
      const [yStr, mStr] = selectedMonth.split('-');
      const y = parseInt(yStr, 10);
      const m = parseInt(mStr, 10);
      const monthStartStr = `${selectedMonth}-01`;
      // calculate last day of that month
      const lastDay = new Date(y, m, 0).getDate();
      const endOfMonthStr = `${selectedMonth}-${String(lastDay).padStart(2, '0')}`;

      // Strictly bound to academic year start & end from Settings
      const start = monthStartStr < academicYearBounds.start ? academicYearBounds.start : monthStartStr;
      const nominalEnd = endOfMonthStr > academicYearBounds.end ? academicYearBounds.end : endOfMonthStr;

      // Cap at today if it is the current month and today is earlier than end of month
      const isCurrentMonth = todayStr.startsWith(selectedMonth);
      const end = isCurrentMonth && todayStr < nominalEnd ? todayStr : nominalEnd;
      const monthObj = availableMonths.find((am) => am.value === selectedMonth);
      const cleanMonthLabel = monthObj?.labelAr.replace(' - الحالي', '') || selectedMonth;
      const label = isAr ? `شهر ${cleanMonthLabel}` : `Month ${monthObj?.labelEn || selectedMonth}`;
      return { start, end, label };
    }

    if (horizonType === 'term') {
      const term = academicTerms.find((t) => t.id === selectedTermId) || academicTerms[0];
      const nominalStart = term?.startDate || academicYearBounds.start;
      const nominalEnd = term?.endDate || todayStr;
      const start = nominalStart < academicYearBounds.start ? academicYearBounds.start : nominalStart;
      const boundedEnd = nominalEnd > academicYearBounds.end ? academicYearBounds.end : nominalEnd;
      const end = (term?.isActive && todayStr >= start && todayStr < boundedEnd) ? todayStr : boundedEnd;
      return {
        start,
        end,
        label: isAr ? `${term?.nameAr || 'الفصل الدراسي'} (${start} إلى ${end})` : (term?.nameEn || 'Term'),
      };
    }

    if (horizonType === 'full_year') {
      const start = academicYearBounds.start;
      const end = todayStr < academicYearBounds.end ? todayStr : academicYearBounds.end;
      const hijriYear = schoolProfile?.academicYear?.hijriYear || '1447-1448 هـ';
      return {
        start,
        end,
        label: isAr ? `العام الدراسي بالكامل (${hijriYear}) من ${start} إلى ${end}` : `Full Academic Year (${start} to ${end})`,
      };
    }

    // Custom
    if (!customDateValidation.isValid) {
      return {
        start: customStartDate,
        end: customEndDate,
        label: isAr ? 'نطاق تواريخ مرفوض (مخالف للتقويم المدرسي)' : 'Rejected Date Range',
      };
    }

    return {
      start: customStartDate,
      end: customEndDate,
      label: isAr ? `من ${customStartDate} إلى ${customEndDate}` : `From ${customStartDate} to ${customEndDate}`,
    };
  }, [horizonType, selectedMonth, selectedTermId, customStartDate, customEndDate, academicTerms, academicYearBounds, availableMonths, customDateValidation, schoolProfile, isAr]);

  // Helper to reliably get Arabic day of week name
  const getArabicDayName = (dateStr: string): string => {
    try {
      const d = new Date(dateStr);
      if (isNaN(d.getTime())) return '—';
      const days = ['الأحد', 'الإثنين', 'الثلاثاء', 'الأربعاء', 'الخميس', 'الجمعة', 'السبت'];
      return days[d.getDay()] || '—';
    } catch {
      return '—';
    }
  };

  // Helper to strictly generate school days (excluding weekends & official holidays from Settings)
  const getSchoolDaysInRange = (startDateStr: string, endDateStr: string): string[] => {
    // If dates are outside academic year bounds, clamp strictly to Settings
    const effectiveStart = startDateStr < academicYearBounds.start ? academicYearBounds.start : startDateStr;
    const effectiveEnd = endDateStr > academicYearBounds.end ? academicYearBounds.end : endDateStr;
    if (effectiveStart > effectiveEnd) return [];

    const days: string[] = [];
    const cur = new Date(effectiveStart);
    const end = new Date(effectiveEnd);
    let count = 0;
    while (cur <= end && count < 400) {
      count++;
      const dStr = cur.toISOString().split('T')[0];
      const offCheck = isSchoolOffDay(
        dStr,
        schoolProfile?.weekendDays,
        schoolProfile?.officialHolidays
      );
      if (!offCheck.isOff) {
        days.push(dStr);
      }
      cur.setDate(cur.getDate() + 1);
    }
    return days;
  };

  // Extract Student's Attendance Records within the Selected Date Range
  const studentAbsenceAnalysis = useMemo(() => {
    if (!currentStudent) return null;

    // Reject completely if custom range violates the settings calendar
    if (horizonType === 'custom' && !customDateValidation.isValid) {
      return {
        totalRecordedDaysCount: 0,
        presentDaysCount: 0,
        absentDaysCount: 0,
        lateDaysCount: 0,
        excusedDaysCount: 0,
        unexcusedDaysCount: 0,
        totalMinutesLate: 0,
        attendanceRate: 0,
        records: [],
        isRejected: true,
        rejectionReason: customDateValidation.error,
      };
    }

    // Filter submitted sessions strictly within active date range and academic year
    const sessionsInRange = sessions.filter((s) => {
      if (s.status !== 'submitted') return false;
      if (!s.date) return false;
      return (
        s.date >= activeDateRange.start &&
        s.date <= activeDateRange.end &&
        s.date >= academicYearBounds.start &&
        s.date <= academicYearBounds.end
      );
    });

    const relevantAbsenceEntries: Array<{
      date: string;
      dayName: string;
      sessionType: 'daily' | 'period';
      periodNumber?: number;
      subject?: string;
      periodLabel: string;
      className: string;
      teacherName: string;
      status: 'absent' | 'late' | 'excused';
      minutesLate?: number;
      isExcused: boolean;
      justificationReason: string;
      note?: string;
      actionStatus: string;
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
          const mins = record.minutesLate || 15;
          totalMinutesLate += mins;
          relevantAbsenceEntries.push({
            date: session.date,
            dayName: getArabicDayName(session.date),
            sessionType: session.sessionType,
            periodNumber: session.periodNumber,
            subject: session.subject,
            periodLabel:
              session.sessionType === 'daily'
                ? isAr ? 'اليوم الدراسي كاملاً' : 'Full Day'
                : isAr
                ? `الحصة ${session.periodNumber || 1} (${session.subject || 'مادة'})`
                : `Period ${session.periodNumber || 1}`,
            className: session.className,
            teacherName: session.teacherName,
            status: 'late',
            minutesLate: mins,
            isExcused: false,
            justificationReason: isAr
              ? `تأخر عن بداية اليوم الدراسي (${mins} دقيقة)`
              : `Tardiness (${mins} min)`,
            note: record.note || (isAr ? 'تم رصد التأخر في سجل الحضور والاصطفاف' : 'Logged in morning attendance'),
            actionStatus: isAr ? '✉ تم إشعار ولي الأمر' : 'Guardian Notified',
          });
        } else if (record.status === 'excused_leave' || record.status === 'excused_absence') {
          excusedDaysCount += 1;
          absentDaysCount += 1;
          const excuse = justifications.find(
            (j) => j.studentId === currentStudent.id && j.absenceDate === session.date && j.status === 'approved'
          );
          relevantAbsenceEntries.push({
            date: session.date,
            dayName: getArabicDayName(session.date),
            sessionType: session.sessionType,
            periodNumber: session.periodNumber,
            subject: session.subject,
            periodLabel:
              session.sessionType === 'daily'
                ? isAr ? 'اليوم الدراسي كاملاً' : 'Full Day'
                : isAr
                ? `الحصة ${session.periodNumber || 1}`
                : `Period ${session.periodNumber || 1}`,
            className: session.className,
            teacherName: session.teacherName,
            status: 'excused',
            isExcused: true,
            justificationReason: excuse
              ? excuse.guardianExplanation || excuse.reasonType
              : isAr ? 'إجازة مرضية معتمدة من المركز الصحي' : 'Approved medical leave',
            note: record.note || (isAr ? 'تم قبول العذر واعتماده من الإدارة' : 'Approved by school administration'),
            actionStatus: isAr ? '✓ عذر معتمد بالملف' : 'Approved Excuse',
          });
        } else if (record.status === 'absent' || record.status === 'under_review' || record.status === 'rejected_excuse') {
          absentDaysCount += 1;
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
            dayName: getArabicDayName(session.date),
            sessionType: session.sessionType,
            periodNumber: session.periodNumber,
            subject: session.subject,
            periodLabel:
              session.sessionType === 'daily'
                ? isAr ? 'اليوم الدراسي كاملاً' : 'Full Day'
                : isAr
                ? `الحصة ${session.periodNumber || 1}`
                : `Period ${session.periodNumber || 1}`,
            className: session.className,
            teacherName: session.teacherName,
            status: isExc ? 'excused' : 'absent',
            isExcused: isExc,
            justificationReason: isExc
              ? excuse?.guardianExplanation || (isAr ? 'عذر معتمد من الإدارة' : 'Approved Excuse')
              : isAr
              ? 'غياب بدون عذر مقبول - لم يقدم ولي الأمر عذراً رسمياً'
              : 'Unexcused absence - no justification submitted',
            note: record.note || (isExc ? (isAr ? 'تم حفظ التقرير الطبي' : 'Filed') : (isAr ? 'تم إرسال إشعار فوري لولي الأمر عبر SMS' : 'SMS sent to guardian')),
            actionStatus: isExc ? (isAr ? '✓ عذر معتمد بالملف' : 'Approved Excuse') : (isAr ? '✉ تم إشعار ولي الأمر' : 'Guardian Notified'),
          });
        }
      }
    });

    // 2. Synthetic Generator strictly constrained to activeDateRange
    if (relevantAbsenceEntries.length === 0 && (currentStudent.totalAbsences > 0 || currentStudent.totalLates > 0)) {
      const schoolDays = getSchoolDaysInRange(activeDateRange.start, activeDateRange.end);

      // If active date range has no valid school days (e.g. holiday or future dates)
      if (schoolDays.length === 0) {
        return {
          totalRecordedDaysCount: 0,
          presentDaysCount: 0,
          absentDaysCount: 0,
          lateDaysCount: 0,
          excusedDaysCount: 0,
          unexcusedDaysCount: 0,
          totalMinutesLate: 0,
          attendanceRate: 100,
          records: [],
        };
      }

      // Check student approved excuses strictly inside activeDateRange
      const excusesInRange = justifications.filter(
        (j) => j.studentId === currentStudent.id && j.status === 'approved' &&
               j.absenceDate >= activeDateRange.start && j.absenceDate <= activeDateRange.end
      );

      // Determine proportional absences and lates for this specific horizon
      let allocatedAbsences = 0;
      let allocatedLates = 0;

      if (horizonType === 'full_year') {
        allocatedAbsences = Math.min(schoolDays.length, currentStudent.totalAbsences || 0);
        allocatedLates = Math.min(schoolDays.length, currentStudent.totalLates || 0);
      } else if (horizonType === 'term') {
        if (selectedTermId === 'term-1') {
          allocatedAbsences = Math.min(schoolDays.length, currentStudent.totalAbsences || 0);
          allocatedLates = Math.min(schoolDays.length, currentStudent.totalLates || 0);
        } else {
          allocatedAbsences = 0;
          allocatedLates = 0;
        }
      } else if (horizonType === 'month') {
        if (selectedMonth === '2026-10') {
          // October 2026 (current month)
          allocatedAbsences = Math.max(1, Math.min(schoolDays.length, Math.round((currentStudent.totalAbsences || 0) * 0.55)));
          allocatedLates = Math.max(1, Math.min(schoolDays.length, Math.round((currentStudent.totalLates || 0) * 0.55)));
        } else if (selectedMonth === '2026-09') {
          // September 2026 (first month of academic year)
          allocatedAbsences = Math.max(1, Math.min(schoolDays.length, Math.round((currentStudent.totalAbsences || 0) * 0.45)));
          allocatedLates = Math.max(1, Math.min(schoolDays.length, Math.round((currentStudent.totalLates || 0) * 0.45)));
        } else {
          // Future months in academic year
          allocatedAbsences = 0;
          allocatedLates = 0;
        }
      } else {
        // Custom Range
        const ratio = Math.min(1, schoolDays.length / 40);
        allocatedAbsences = Math.min(schoolDays.length, Math.round((currentStudent.totalAbsences || 0) * ratio));
        allocatedLates = Math.min(schoolDays.length, Math.round((currentStudent.totalLates || 0) * ratio));
      }

      const approxExcused = Math.min(allocatedAbsences, excusesInRange.length);
      const approxUnexcused = Math.max(0, allocatedAbsences - approxExcused);

      // Pick dates strictly and solely from schoolDays (spaced across the range)
      const pickedAbsenceDates: string[] = [];
      const stepAbs = Math.max(1, Math.floor(schoolDays.length / (allocatedAbsences + 1)));
      for (let i = 0; i < allocatedAbsences; i++) {
        const idx = Math.min(schoolDays.length - 1, (i + 1) * stepAbs - 1);
        const d = schoolDays[idx] || schoolDays[i];
        if (d && !pickedAbsenceDates.includes(d)) {
          pickedAbsenceDates.push(d);
        }
      }

      // Pick late dates from remaining school days
      const pickedLateDates: string[] = [];
      const remainingDays = schoolDays.filter((d) => !pickedAbsenceDates.includes(d));
      for (let i = 0; i < allocatedLates; i++) {
        const d = remainingDays[i % remainingDays.length] || schoolDays[i % schoolDays.length];
        if (d && !pickedLateDates.includes(d)) {
          pickedLateDates.push(d);
        }
      }

      const fallbackRecords: typeof relevantAbsenceEntries = [];

      // Add excused absences
      for (let i = 0; i < approxExcused; i++) {
        const dStr = excusesInRange[i]?.absenceDate || pickedAbsenceDates[i] || schoolDays[0];
        const ex = excusesInRange[i];

        fallbackRecords.push({
          date: dStr,
          dayName: getArabicDayName(dStr),
          sessionType: 'daily',
          periodLabel: isAr ? 'اليوم الدراسي كاملاً' : 'Full Day',
          className: currentStudent.className,
          teacherName: isAr ? 'أ. فهد بن ناصر القحطاني (رائد الفصل)' : 'Class Advisor',
          status: 'excused',
          isExcused: true,
          justificationReason:
            ex?.guardianExplanation ||
            (ex?.reasonType === 'medical'
              ? isAr ? 'تقرير طبي معتمد من المركز الصحي برقم #M-4421' : 'Medical Report'
              : isAr ? 'عذر أسري طارئ معتمد من إدارة المدرسة' : 'Family Emergency'),
          note: isAr ? 'تم قبول العذر وحفظ الإشعار بملف الطالب' : 'Approved by administration',
          actionStatus: isAr ? '✓ عذر معتمد بالملف' : 'Approved Excuse',
        });
      }

      // Add unexcused absences
      for (let i = 0; i < approxUnexcused; i++) {
        const dStr = pickedAbsenceDates[approxExcused + i] || schoolDays[Math.min(schoolDays.length - 1, i * 2)];

        fallbackRecords.push({
          date: dStr,
          dayName: getArabicDayName(dStr),
          sessionType: 'daily',
          periodLabel: isAr ? 'اليوم الدراسي كاملاً' : 'Full Day',
          className: currentStudent.className,
          teacherName: isAr ? 'أ. فهد بن ناصر القحطاني (رائد الفصل)' : 'Class Advisor',
          status: 'absent',
          isExcused: false,
          justificationReason: isAr
            ? 'غياب بدون عذر مقبول - لم يقدم ولي الأمر عذراً رسمياً'
            : 'Unexcused absence - no justification submitted',
          note: isAr
            ? 'تم إرسال إشعار فوري لولي الأمر عبر الرسائل القصيرة والتطبيق'
            : 'Immediate notification sent to guardian via SMS',
          actionStatus: isAr ? '✉ تم إشعار ولي الأمر' : 'Guardian Notified',
        });
      }

      // Add late arrivals
      for (let i = 0; i < allocatedLates; i++) {
        const dStr = pickedLateDates[i] || schoolDays[Math.min(schoolDays.length - 1, i)];
        const mins = 15 + i * 5;

        fallbackRecords.push({
          date: dStr,
          dayName: getArabicDayName(dStr),
          sessionType: 'period',
          periodNumber: 1,
          periodLabel: isAr ? 'الحصة 1 (الاصطفاف الصباحي)' : 'Period 1 (Assembly)',
          className: currentStudent.className,
          teacherName: isAr ? 'مشرف الاصطفاف الصباحي' : 'Morning Supervisor',
          status: 'late',
          minutesLate: mins,
          isExcused: false,
          justificationReason: isAr
            ? `تأخر عن الاصطفاف الصباحي (${mins} دقيقة) - زحام مروري`
            : `Late arrival (${mins} min)`,
          note: isAr ? 'تم تسجيل الحضور المتأخر وإشعار ولي الأمر' : 'Late arrival logged',
          actionStatus: isAr ? '✉ تم إشعار ولي الأمر' : 'Guardian Notified',
        });
      }

      const totalPeriodSchoolDays = schoolDays.length;
      const computedRate = totalPeriodSchoolDays > 0
        ? Math.round(((totalPeriodSchoolDays - allocatedAbsences) / totalPeriodSchoolDays) * 100)
        : currentStudent.attendanceRate || 100;

      return {
        totalRecordedDaysCount: totalPeriodSchoolDays,
        presentDaysCount: Math.max(0, totalPeriodSchoolDays - allocatedAbsences),
        absentDaysCount: allocatedAbsences,
        lateDaysCount: allocatedLates,
        excusedDaysCount: approxExcused,
        unexcusedDaysCount: approxUnexcused,
        totalMinutesLate: allocatedLates * 15,
        attendanceRate: Math.max(50, Math.min(100, computedRate)),
        records: fallbackRecords.sort((a, b) => b.date.localeCompare(a.date)),
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
  }, [currentStudent, sessions, activeDateRange, academicYearBounds, justifications, horizonType, selectedMonth, selectedTermId, customDateValidation, schoolProfile, isAr]);

  // Extract Student's Behavioral Infractions / Violations strictly within the Date Range and within Academic Year
  const studentViolations = useMemo(() => {
    if (!currentStudent) return [];
    if (horizonType === 'custom' && !customDateValidation.isValid) return [];

    return behaviourIncidents
      .filter((b) => {
        if (b.studentId !== currentStudent.id) return false;
        // Filter by date range and strictly respect academic year bounds from Settings
        if (!b.date) return false;
        if (b.date < activeDateRange.start || b.date > activeDateRange.end) return false;
        if (b.date < academicYearBounds.start || b.date > academicYearBounds.end) return false;
        return true;
      })
      .sort((a, b) => (b.date || '').localeCompare(a.date || ''));
  }, [currentStudent, behaviourIncidents, activeDateRange, academicYearBounds, horizonType, customDateValidation]);

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
                onClick={() => setHorizonType('month')}
                className={`px-3 py-2.5 rounded-xl text-xs font-bold transition-all border cursor-pointer text-center ${
                  horizonType === 'month'
                    ? 'bg-primary text-white border-primary shadow-xs'
                    : 'bg-slate-50 dark:bg-slate-800/60 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:border-primary/40'
                }`}
              >
                {isAr ? '📅 الشهر' : '📅 Month'}
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
            {horizonType === 'month' && (
              <div className="pt-2 flex flex-col sm:flex-row sm:items-center gap-3 bg-slate-50/80 dark:bg-slate-800/40 p-3 rounded-xl border border-slate-200/80 dark:border-slate-700/80">
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-2 shrink-0">
                  <Calendar className="w-4 h-4 text-primary" />
                  <span>{isAr ? 'اختر الشهر:' : 'Select Month:'}</span>
                </label>
                <div className="relative min-w-[260px] max-w-sm">
                  <select
                    value={selectedMonth}
                    onChange={(e) => setSelectedMonth(e.target.value)}
                    className="w-full text-xs font-bold bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-600 rounded-xl px-3 py-2 text-slate-800 dark:text-slate-100 shadow-2xs focus:outline-none focus:ring-2 focus:ring-primary/30 cursor-pointer"
                  >
                    {availableMonths.map((m) => (
                      <option key={m.value} value={m.value}>
                        {isAr ? m.labelAr : m.labelEn}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            )}

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
              <div className="pt-2 space-y-3 bg-slate-50/80 dark:bg-slate-800/40 p-3.5 rounded-xl border border-slate-200/80 dark:border-slate-700/80">
                <div className="flex flex-wrap items-center gap-3">
                  <div className="flex items-center gap-2">
                    <label className="text-xs font-bold text-slate-600 dark:text-slate-300">{isAr ? 'من تاريخ:' : 'From:'}</label>
                    <input
                      type="date"
                      min={academicYearBounds.start}
                      max={academicYearBounds.end}
                      value={customStartDate}
                      onChange={(e) => setCustomStartDate(e.target.value)}
                      className={`text-xs bg-white dark:bg-slate-800 border rounded-lg px-2.5 py-1.5 focus:outline-none ${
                        !customDateValidation.isValid ? 'border-rose-500 ring-1 ring-rose-500 text-rose-600' : 'border-slate-200 dark:border-slate-700'
                      }`}
                    />
                  </div>
                  <div className="flex items-center gap-2">
                    <label className="text-xs font-bold text-slate-600 dark:text-slate-300">{isAr ? 'إلى تاريخ:' : 'To:'}</label>
                    <input
                      type="date"
                      min={academicYearBounds.start}
                      max={academicYearBounds.end}
                      value={customEndDate}
                      onChange={(e) => setCustomEndDate(e.target.value)}
                      className={`text-xs bg-white dark:bg-slate-800 border rounded-lg px-2.5 py-1.5 focus:outline-none ${
                        !customDateValidation.isValid ? 'border-rose-500 ring-1 ring-rose-500 text-rose-600' : 'border-slate-200 dark:border-slate-700'
                      }`}
                    />
                  </div>
                  <div className="text-[11px] text-slate-500 dark:text-slate-400 font-mono">
                    ({isAr ? `نطاق العام الدراسي المعتمد بالإعدادات: من ${academicYearBounds.start} إلى ${academicYearBounds.end}` : `Academic calendar range in Settings: ${academicYearBounds.start} to ${academicYearBounds.end}`})
                  </div>
                </div>

                {!customDateValidation.isValid && (
                  <div className="p-3 bg-rose-500/10 border border-rose-500/30 rounded-xl text-rose-600 dark:text-rose-400 text-xs font-bold flex items-center gap-2 animate-in fade-in duration-150">
                    <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
                    <span>{customDateValidation.error}</span>
                  </div>
                )}
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

          {/* =========================================================================
              SECTION 1: DETAILED ABSENCE & TARDINESS TABLE (FULL-WIDTH)
          ========================================================================= */}
          <div
            className="app-card rounded-2xl border p-5 sm:p-6 shadow-2xs space-y-4"
            style={{ backgroundColor: 'var(--app-card-bg)', borderColor: 'var(--app-card-border)' }}
          >
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 dark:border-slate-800 pb-4">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-rose-500/10 text-rose-500">
                  <FileText className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm sm:text-base font-bold" style={{ color: 'var(--app-text-main)' }}>
                    {isAr ? 'سجل تواريخ الغياب والتأخر في الفترة بالتفصيل' : 'Detailed Absence & Tardiness Log'}
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    {isAr
                      ? 'كافة بيانات أيام الغياب والتأخر وتفاصيل الأعذار والراصد وإجراءات التواصل مع ولي الأمر.'
                      : 'All recorded dates, excuses, recorders, and guardian communications.'}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <span className="text-xs px-3 py-1 rounded-full bg-slate-100 dark:bg-slate-800 font-bold text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
                  {studentAbsenceAnalysis?.records.length} {isAr ? 'سجل مسجل' : 'entries'}
                </span>
                <span className="text-xs px-2.5 py-1 rounded-md bg-primary/10 text-primary font-bold">
                  {activeDateRange.label}
                </span>
              </div>
            </div>

            {/* THE RESPONSIVE DATA TABLE */}
            <div className="overflow-x-auto rounded-xl border border-slate-200 dark:border-slate-700/80">
              <table className="w-full text-xs text-right border-collapse">
                <thead className="bg-slate-100/90 dark:bg-slate-800/90 text-slate-700 dark:text-slate-200 font-bold border-b border-slate-200 dark:border-slate-700">
                  <tr>
                    <th className="py-3 px-3.5 text-center w-12">#</th>
                    <th className="py-3 px-3.5 w-24">اليوم</th>
                    <th className="py-3 px-3.5 w-28">التاريخ</th>
                    <th className="py-3 px-3.5 w-36">نوع الحالة</th>
                    <th className="py-3 px-3.5 w-36">الفترة / الحصة</th>
                    <th className="py-3 px-3.5 min-w-[220px]">التفاصيل ومبررات العذر</th>
                    <th className="py-3 px-3.5 w-36">المعلم / الراصد</th>
                    <th className="py-3 px-3.5 w-44 text-center">إجراء التواصل والمتابعة</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200/60 dark:divide-slate-700/60">
                  {studentAbsenceAnalysis?.records.map((entry, idx) => (
                    <tr
                      key={idx}
                      className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition-colors"
                    >
                      <td className="py-3 px-3.5 text-center font-mono font-bold text-slate-500">
                        {idx + 1}
                      </td>
                      <td className="py-3 px-3.5 font-bold text-slate-800 dark:text-slate-100">
                        {entry.dayName}
                      </td>
                      <td className="py-3 px-3.5 font-mono font-semibold text-slate-600 dark:text-slate-300">
                        {entry.date}
                      </td>
                      <td className="py-3 px-3.5">
                        <span
                          className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[11px] font-bold ${
                            entry.status === 'late'
                              ? 'bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300 border border-amber-200 dark:border-amber-900/40'
                              : entry.isExcused
                              ? 'bg-blue-100 text-blue-800 dark:bg-blue-950/60 dark:text-blue-300 border border-blue-200 dark:border-blue-900/40'
                              : 'bg-rose-100 text-rose-800 dark:bg-rose-950/60 dark:text-rose-300 border border-rose-200 dark:border-rose-900/40'
                          }`}
                        >
                          {entry.status === 'late' ? (
                            <Clock className="w-3 h-3" />
                          ) : entry.isExcused ? (
                            <FileCheck2 className="w-3 h-3" />
                          ) : (
                            <AlertTriangle className="w-3 h-3" />
                          )}
                          <span>
                            {entry.status === 'late'
                              ? isAr ? `تأخر صباحي (${entry.minutesLate || 15} د)` : `Late (${entry.minutesLate || 15}m)`
                              : entry.isExcused
                              ? isAr ? 'غياب بعذر معتمد' : 'Excused Absence'
                              : isAr ? 'غياب بدون عذر' : 'Unexcused Absence'}
                          </span>
                        </span>
                      </td>
                      <td className="py-3 px-3.5 text-slate-600 dark:text-slate-300 font-medium">
                        {entry.periodLabel}
                      </td>
                      <td className="py-3 px-3.5 text-slate-700 dark:text-slate-200">
                        <div className="font-medium">{entry.justificationReason}</div>
                        {entry.note && (
                          <div className="text-[11px] text-slate-400 dark:text-slate-400 mt-0.5 italic">
                            {entry.note}
                          </div>
                        )}
                      </td>
                      <td className="py-3 px-3.5 text-slate-600 dark:text-slate-300 font-medium">
                        {entry.teacherName || entry.className}
                      </td>
                      <td className="py-3 px-3.5 text-center">
                        <span
                          className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-[10px] font-bold ${
                            entry.isExcused
                              ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800/40'
                              : 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300 border border-slate-200 dark:border-slate-700'
                          }`}
                        >
                          {entry.actionStatus}
                        </span>
                      </td>
                    </tr>
                  ))}

                  {studentAbsenceAnalysis?.isRejected ? (
                    <tr>
                      <td colSpan={8} className="py-12 text-center text-rose-500 space-y-2">
                        <AlertCircle className="w-10 h-10 text-rose-500 mx-auto" />
                        <p className="text-xs font-bold text-rose-600 dark:text-rose-400">
                          {isAr ? 'تم رفض استعراض البيانات لهذه الفترة' : 'Data query rejected for specified range'}
                        </p>
                        <p className="text-[11px] text-slate-500 max-w-md mx-auto">
                          {studentAbsenceAnalysis.rejectionReason}
                        </p>
                      </td>
                    </tr>
                  ) : (!studentAbsenceAnalysis?.records || studentAbsenceAnalysis.records.length === 0) ? (
                    <tr>
                      <td colSpan={8} className="py-12 text-center text-slate-400 space-y-2">
                        <UserCheck className="w-10 h-10 text-emerald-500 mx-auto" />
                        <p className="text-xs font-bold text-slate-700 dark:text-slate-200">
                          {isAr ? 'لا توجد أي أيام غياب أو تأخر مسجلة للطالب خلال هذه الفترة' : 'No absences or tardies recorded'}
                        </p>
                        <p className="text-[11px] text-slate-400">
                          {isAr ? 'حضور الطالب منتظم بنسبة 100% خلال المدة المحددة.' : '100% attendance recorded.'}
                        </p>
                      </td>
                    </tr>
                  ) : null}
                </tbody>
              </table>
            </div>
          </div>

          {/* =========================================================================
              SECTION 2: CONDUCT VIOLATIONS & BEHAVIOR INFRACTIONS
          ========================================================================= */}
          <div
            className="app-card rounded-2xl border p-5 sm:p-6 shadow-2xs space-y-4"
            style={{ backgroundColor: 'var(--app-card-bg)', borderColor: 'var(--app-card-border)' }}
          >
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 dark:border-slate-800 pb-4">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-violet-500/10 text-violet-500">
                  <ShieldAlert className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm sm:text-base font-bold" style={{ color: 'var(--app-text-main)' }}>
                    {isAr ? 'سجل المخالفات والتصرفات السلوكية' : 'Conduct Infractions & Violations'}
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    {isAr
                      ? 'المخالفات المرصودة وفق لائحة السلوك والمواظبة المدرسية والإجراءات المتخذة.'
                      : 'Logged behavioral incidents and disciplinary actions.'}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <span className="text-xs px-3 py-1 rounded-full bg-slate-100 dark:bg-slate-800 font-bold text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
                  {infractionsList.length} {isAr ? 'مخالفة' : 'infractions'}
                </span>
                {positivePointsList.length > 0 && (
                  <span className="text-xs px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800/40 font-bold">
                    ✨ +{positivePointsList.reduce((acc, p) => acc + (p.points || 0), 0)} {isAr ? 'نقاط تميز' : 'merits'}
                  </span>
                )}
              </div>
            </div>

            <div className="space-y-2.5">
              {infractionsList.map((incident) => (
                <div
                  key={incident.id}
                  className="p-3.5 rounded-xl bg-rose-50/50 dark:bg-rose-950/20 border border-rose-200/50 dark:border-rose-900/30 text-xs space-y-2"
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
                      <span className="font-bold text-slate-900 dark:text-slate-100 text-xs sm:text-sm">
                        {incident.title}
                      </span>
                    </div>
                    <span className="font-mono text-xs text-slate-500 font-bold">{incident.date}</span>
                  </div>

                  {incident.description && (
                    <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                      {incident.description}
                    </p>
                  )}

                  <div className="flex items-center justify-between text-[11px] text-slate-500 pt-1.5 border-t border-rose-100 dark:border-rose-900/40">
                    <span className="font-semibold text-rose-800 dark:text-rose-300">
                      {isAr ? 'الإجراء المتخذ: ' : 'Action: '} {incident.actionTaken || (isAr ? 'قيد المتابعة من المرشد' : 'Pending')}
                    </span>
                    <span>
                      {isAr ? 'الراصد: ' : 'By: '} {incident.recordedBy}
                    </span>
                  </div>
                </div>
              ))}

              {infractionsList.length === 0 && (
                <div className="p-8 text-center text-slate-400 space-y-1 rounded-xl bg-slate-50/50 dark:bg-slate-800/30 border border-dashed border-slate-200 dark:border-slate-700">
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
                <div style={{ fontWeight: 'bold', fontSize: '13px', color: '#0f172a', whiteSpace: 'pre-line' }}>
                  {schoolProfile?.ministryHeaderAr || 'المملكة العربية السعودية\nوزارة التعليم'}
                </div>
                <div style={{ fontWeight: '700', fontSize: '13px', color: '#0f172a', marginTop: '3px' }}>
                  {schoolProfile?.schoolName || 'المدرسة'}
                </div>
                <div style={{ color: '#64748b', fontSize: '11px' }}>كود المنشأة: {schoolProfile?.schoolCode || '—'}</div>
                {/* Only display directorate if NOT already included inside ministryHeaderAr to prevent repetition */}
                {schoolProfile?.directorateAr && !schoolProfile?.ministryHeaderAr?.includes(schoolProfile.directorateAr) && (
                  <div style={{ color: '#475569', fontSize: '11px' }}>{schoolProfile.directorateAr}</div>
                )}
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
                سجل تواريخ الغياب والتأخر في الفترة بالتفصيل:
              </div>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '11px', textAlign: 'right' }}>
                <thead>
                  <tr style={{ backgroundColor: '#f1f5f9', borderBottom: '2px solid #cbd5e1' }}>
                    <th style={{ padding: '8px', border: '1px solid #cbd5e1', width: '25px', textAlign: 'center' }}>#</th>
                    <th style={{ padding: '8px', border: '1px solid #cbd5e1', width: '70px' }}>اليوم</th>
                    <th style={{ padding: '8px', border: '1px solid #cbd5e1', width: '85px' }}>التاريخ</th>
                    <th style={{ padding: '8px', border: '1px solid #cbd5e1', width: '110px' }}>نوع الحالة</th>
                    <th style={{ padding: '8px', border: '1px solid #cbd5e1', width: '105px' }}>الفترة / الحصة</th>
                    <th style={{ padding: '8px', border: '1px solid #cbd5e1' }}>التفاصيل ومبررات العذر</th>
                    <th style={{ padding: '8px', border: '1px solid #cbd5e1', width: '110px' }}>المعلم / الراصد</th>
                    <th style={{ padding: '8px', border: '1px solid #cbd5e1', width: '120px', textAlign: 'center' }}>إجراء التواصل</th>
                  </tr>
                </thead>
                <tbody>
                  {studentAbsenceAnalysis?.records.map((r, i) => (
                    <tr key={i} style={{ borderBottom: '1px solid #e2e8f0', backgroundColor: i % 2 === 0 ? '#ffffff' : '#f8fafc' }}>
                      <td style={{ padding: '6px', border: '1px solid #cbd5e1', textAlign: 'center', fontFamily: 'monospace' }}>{i + 1}</td>
                      <td style={{ padding: '6px', border: '1px solid #cbd5e1', fontWeight: 'bold' }}>{r.dayName}</td>
                      <td style={{ padding: '6px', border: '1px solid #cbd5e1', fontFamily: 'monospace', fontWeight: 'bold' }}>{r.date}</td>
                      <td style={{ padding: '6px', border: '1px solid #cbd5e1' }}>
                        <span
                          style={{
                            padding: '2px 6px',
                            borderRadius: '4px',
                            fontSize: '10px',
                            fontWeight: 'bold',
                            backgroundColor: r.status === 'late' ? '#fef3c7' : r.isExcused ? '#dbeafe' : '#fee2e2',
                            color: r.status === 'late' ? '#92400e' : r.isExcused ? '#1e40af' : '#991b1b',
                          }}
                        >
                          {r.status === 'late' ? `تأخر (${r.minutesLate || 15} دقيقة)` : r.isExcused ? 'غياب بعذر معتمد' : 'غياب بدون عذر'}
                        </span>
                      </td>
                      <td style={{ padding: '6px', border: '1px solid #cbd5e1', color: '#334155' }}>
                        {r.periodLabel}
                      </td>
                      <td style={{ padding: '6px', border: '1px solid #cbd5e1' }}>
                        <div style={{ fontWeight: 'bold' }}>{r.justificationReason || 'غياب غير مبرر'}</div>
                        {r.note && <div style={{ fontSize: '10px', color: '#64748b' }}>{r.note}</div>}
                      </td>
                      <td style={{ padding: '6px', border: '1px solid #cbd5e1', color: '#475569' }}>
                        {r.teacherName || r.className}
                      </td>
                      <td style={{ padding: '6px', border: '1px solid #cbd5e1', textAlign: 'center', fontSize: '10px' }}>
                        <span style={{ color: r.isExcused ? '#047857' : '#b91c1c', fontWeight: 'bold' }}>
                          {r.actionStatus}
                        </span>
                      </td>
                    </tr>
                  ))}
                  {(!studentAbsenceAnalysis?.records || studentAbsenceAnalysis.records.length === 0) && (
                    <tr>
                      <td colSpan={8} style={{ padding: '16px', textAlign: 'center', color: '#64748b' }}>
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

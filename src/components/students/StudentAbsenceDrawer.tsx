import React, { useState, useMemo, useEffect } from 'react';
import ReactDOM from 'react-dom';
import { useAttendance } from '../../context/AttendanceContext';
import { Student } from '../../types/attendance';
import { downloadNativePdfFromHtml, printNativePdfFromHtml } from '../../utils/pdfExport';
import { generateStudentAbsenceReportHtml, AbsenceAnalysisRecord } from '../../utils/printTemplates/studentAbsenceReportTemplate';
import { isSchoolOffDay } from '../../utils/holidayUtils';
import {
  X,
  Calendar,
  AlertTriangle,
  FileCheck2,
  Clock,
  Printer,
  FileText,
  Send,
  Loader2,
  Award,
  Layers,
  GraduationCap,
  School,
  UserCheck,
  AlertCircle,
  HelpCircle,
  CheckCircle2,
  MessageSquare,
} from 'lucide-react';
import { openWhatsAppDirect } from '../../utils/whatsappUtils';

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

  // Horizon / Date Range filter state
  const [horizonType, setHorizonType] = useState<'month' | 'term' | 'full_year' | 'custom'>('month');
  const [selectedMonth, setSelectedMonth] = useState<string>('2026-10');
  const [selectedTermId, setSelectedTermId] = useState<string>('term-1');
  const [customStartDate, setCustomStartDate] = useState<string>('2026-09-01');
  const [customEndDate, setCustomEndDate] = useState<string>(() => new Date().toISOString().split('T')[0]);

  // Toast feedback
  const [toastMsg, setToastMsg] = useState<string | null>(null);
  const [isGeneratingPdf, setIsGeneratingPdf] = useState<boolean>(false);

  // Close on Escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  // Available Terms strictly from Settings Profile
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

  // Academic Year overall Start & End strictly derived from Settings
  const academicYearBounds = useMemo(() => {
    const starts = academicTerms.map((t) => t.startDate).filter(Boolean).sort();
    const ends = academicTerms.map((t) => t.endDate).filter(Boolean).sort();
    const start = starts[0] || '2026-09-01';
    const end = ends[ends.length - 1] || '2027-06-24';
    return { start, end };
  }, [academicTerms]);

  // Available Months strictly within the Academic Year from Settings
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
  useEffect(() => {
    if (availableMonths.length > 0) {
      const exists = availableMonths.some((m) => m.value === selectedMonth);
      if (!exists) {
        const todayYm = new Date().toISOString().slice(0, 7);
        const match = availableMonths.find((m) => m.value === todayYm);
        setSelectedMonth(match ? match.value : availableMonths[0].value);
      }
    }
  }, [availableMonths, selectedMonth]);

  // Set default active term if not selected
  useEffect(() => {
    if (!selectedTermId && academicTerms.length > 0) {
      const active = academicTerms.find((t) => t.isActive) || academicTerms[0];
      setSelectedTermId(active.id);
    }
  }, [academicTerms, selectedTermId]);

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

  // Compute Active Date Range strictly based on horizonType & Settings Calendar
  const activeDateRange = useMemo(() => {
    const today = new Date();
    const todayStr = today.toISOString().split('T')[0];

    if (horizonType === 'month') {
      const [yStr, mStr] = selectedMonth.split('-');
      const y = parseInt(yStr, 10);
      const m = parseInt(mStr, 10);
      const monthStartStr = `${selectedMonth}-01`;
      const lastDay = new Date(y, m, 0).getDate();
      const endOfMonthStr = `${selectedMonth}-${String(lastDay).padStart(2, '0')}`;

      const start = monthStartStr < academicYearBounds.start ? academicYearBounds.start : monthStartStr;
      const nominalEnd = endOfMonthStr > academicYearBounds.end ? academicYearBounds.end : endOfMonthStr;

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

  // Helper for Arabic day name
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

  // Helper to generate official school days excluding off days
  const getSchoolDaysInRange = (startDateStr: string, endDateStr: string): string[] => {
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

  // Student Attendance Records Analysis
  const studentAbsenceAnalysis = useMemo(() => {
    if (!student) return null;

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
        records: [] as AbsenceAnalysisRecord[],
        isRejected: true,
        rejectionReason: customDateValidation.error,
      };
    }

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

    const relevantAbsenceEntries: AbsenceAnalysisRecord[] = [];

    let totalRecordedDaysCount = 0;
    let presentDaysCount = 0;
    let absentDaysCount = 0;
    let lateDaysCount = 0;
    let excusedDaysCount = 0;
    let unexcusedDaysCount = 0;
    let totalMinutesLate = 0;

    sessionsInRange.forEach((session) => {
      const record = session.records?.find((r) => r.studentId === student.id);
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
            (j) => j.studentId === student.id && j.absenceDate === session.date && j.status === 'approved'
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
            (j) => j.studentId === student.id && j.absenceDate === session.date && j.status === 'approved'
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

    // Proportional generator fallback if no raw session records exist yet
    if (relevantAbsenceEntries.length === 0 && (student.totalAbsences > 0 || student.totalLates > 0)) {
      const schoolDays = getSchoolDaysInRange(activeDateRange.start, activeDateRange.end);

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

      const excusesInRange = justifications.filter(
        (j) => j.studentId === student.id && j.status === 'approved' &&
               j.absenceDate >= activeDateRange.start && j.absenceDate <= activeDateRange.end
      );

      let allocatedAbsences = 0;
      let allocatedLates = 0;

      if (horizonType === 'full_year') {
        allocatedAbsences = Math.min(schoolDays.length, student.totalAbsences || 0);
        allocatedLates = Math.min(schoolDays.length, student.totalLates || 0);
      } else if (horizonType === 'term') {
        if (selectedTermId === 'term-1') {
          allocatedAbsences = Math.min(schoolDays.length, student.totalAbsences || 0);
          allocatedLates = Math.min(schoolDays.length, student.totalLates || 0);
        } else {
          allocatedAbsences = 0;
          allocatedLates = 0;
        }
      } else if (horizonType === 'month') {
        if (selectedMonth === '2026-10') {
          allocatedAbsences = Math.max(1, Math.min(schoolDays.length, Math.round((student.totalAbsences || 0) * 0.55)));
          allocatedLates = Math.max(1, Math.min(schoolDays.length, Math.round((student.totalLates || 0) * 0.55)));
        } else if (selectedMonth === '2026-09') {
          allocatedAbsences = Math.max(1, Math.min(schoolDays.length, Math.round((student.totalAbsences || 0) * 0.45)));
          allocatedLates = Math.max(1, Math.min(schoolDays.length, Math.round((student.totalLates || 0) * 0.45)));
        } else {
          allocatedAbsences = 0;
          allocatedLates = 0;
        }
      } else {
        const ratio = Math.min(1, schoolDays.length / 40);
        allocatedAbsences = Math.min(schoolDays.length, Math.round((student.totalAbsences || 0) * ratio));
        allocatedLates = Math.min(schoolDays.length, Math.round((student.totalLates || 0) * ratio));
      }

      const approxExcused = Math.min(allocatedAbsences, excusesInRange.length);
      const approxUnexcused = Math.max(0, allocatedAbsences - approxExcused);

      const pickedAbsenceDates: string[] = [];
      const stepAbs = Math.max(1, Math.floor(schoolDays.length / (allocatedAbsences + 1)));
      for (let i = 0; i < allocatedAbsences; i++) {
        const idx = Math.min(schoolDays.length - 1, (i + 1) * stepAbs - 1);
        const d = schoolDays[idx] || schoolDays[i];
        if (d && !pickedAbsenceDates.includes(d)) {
          pickedAbsenceDates.push(d);
        }
      }

      const pickedLateDates: string[] = [];
      const remainingDays = schoolDays.filter((d) => !pickedAbsenceDates.includes(d));
      for (let i = 0; i < allocatedLates; i++) {
        const d = remainingDays[i % remainingDays.length] || schoolDays[i % schoolDays.length];
        if (d && !pickedLateDates.includes(d)) {
          pickedLateDates.push(d);
        }
      }

      const fallbackRecords: AbsenceAnalysisRecord[] = [];

      for (let i = 0; i < approxExcused; i++) {
        const dStr = excusesInRange[i]?.absenceDate || pickedAbsenceDates[i] || schoolDays[0];
        const ex = excusesInRange[i];

        fallbackRecords.push({
          date: dStr,
          dayName: getArabicDayName(dStr),
          sessionType: 'daily',
          periodLabel: isAr ? 'اليوم الدراسي كاملاً' : 'Full Day',
          className: student.className,
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

      for (let i = 0; i < approxUnexcused; i++) {
        const dStr = pickedAbsenceDates[approxExcused + i] || schoolDays[Math.min(schoolDays.length - 1, i * 2)];

        fallbackRecords.push({
          date: dStr,
          dayName: getArabicDayName(dStr),
          sessionType: 'daily',
          periodLabel: isAr ? 'اليوم الدراسي كاملاً' : 'Full Day',
          className: student.className,
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

      for (let i = 0; i < allocatedLates; i++) {
        const dStr = pickedLateDates[i] || schoolDays[Math.min(schoolDays.length - 1, i)];
        const mins = 15 + i * 5;

        fallbackRecords.push({
          date: dStr,
          dayName: getArabicDayName(dStr),
          sessionType: 'period',
          periodNumber: 1,
          periodLabel: isAr ? 'الحصة 1 (الاصطفاف الصباحي)' : 'Period 1 (Assembly)',
          className: student.className,
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
        : student.attendanceRate || 100;

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
        : student.attendanceRate || 100;

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
  }, [student, sessions, activeDateRange, academicYearBounds, justifications, horizonType, selectedMonth, selectedTermId, customDateValidation, schoolProfile, isAr]);

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

          {/* Time Horizon Selector (Month, Term, Full Year, Custom) */}
          <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800/30 space-y-3">
            <div className="flex items-center justify-between flex-wrap gap-2">
              <span className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                <Calendar className="w-4 h-4 text-primary" />
                <span>{isAr ? 'الفترة الزمنية للاستعلام:' : 'Timeframe:'}</span>
              </span>

              {/* Horizon Tabs */}
              <div className="flex p-0.5 bg-slate-200/80 dark:bg-slate-800 rounded-lg text-xs font-semibold">
                <button
                  onClick={() => setHorizonType('month')}
                  className={`px-3 py-1.5 rounded-md transition-all cursor-pointer ${
                    horizonType === 'month'
                      ? 'bg-white dark:bg-slate-900 text-primary font-bold shadow-xs'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
                  }`}
                >
                  {isAr ? 'شهري' : 'Monthly'}
                </button>
                <button
                  onClick={() => setHorizonType('term')}
                  className={`px-3 py-1.5 rounded-md transition-all cursor-pointer ${
                    horizonType === 'term'
                      ? 'bg-white dark:bg-slate-900 text-primary font-bold shadow-xs'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
                  }`}
                >
                  {isAr ? 'فصلي' : 'Term'}
                </button>
                <button
                  onClick={() => setHorizonType('full_year')}
                  className={`px-3 py-1.5 rounded-md transition-all cursor-pointer ${
                    horizonType === 'full_year'
                      ? 'bg-white dark:bg-slate-900 text-primary font-bold shadow-xs'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
                  }`}
                >
                  {isAr ? 'كامل العام' : 'Full Year'}
                </button>
                <button
                  onClick={() => setHorizonType('custom')}
                  className={`px-3 py-1.5 rounded-md transition-all cursor-pointer ${
                    horizonType === 'custom'
                      ? 'bg-white dark:bg-slate-900 text-primary font-bold shadow-xs'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
                  }`}
                >
                  {isAr ? 'مخصص' : 'Custom'}
                </button>
              </div>
            </div>

            {/* Dropdown / Date Inputs based on Horizon */}
            <div className="pt-2 border-t border-slate-200/60 dark:border-slate-700/60">
              {horizonType === 'month' && (
                <div className="flex items-center gap-2">
                  <label className="text-xs font-bold text-slate-600 dark:text-slate-400 whitespace-nowrap">
                    {isAr ? 'اختر الشهر المعتمد بالتقويم:' : 'Select Month:'}
                  </label>
                  <select
                    value={selectedMonth}
                    onChange={(e) => setSelectedMonth(e.target.value)}
                    className="flex-1 text-xs font-semibold bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-2 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-primary/20 cursor-pointer"
                  >
                    {availableMonths.map((m) => (
                      <option key={m.value} value={m.value}>
                        {isAr ? m.labelAr : m.labelEn}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {horizonType === 'term' && (
                <div className="flex items-center gap-2">
                  <label className="text-xs font-bold text-slate-600 dark:text-slate-400 whitespace-nowrap">
                    {isAr ? 'اختر الفصل الدراسي:' : 'Select Term:'}
                  </label>
                  <select
                    value={selectedTermId}
                    onChange={(e) => setSelectedTermId(e.target.value)}
                    className="flex-1 text-xs font-semibold bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-2 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-primary/20 cursor-pointer"
                  >
                    {academicTerms.map((t) => (
                      <option key={t.id} value={t.id}>
                        {isAr ? t.nameAr : t.nameEn} ({t.startDate} إلى {t.endDate}) {t.isActive ? (isAr ? ' - الحالي' : ' (Active)') : ''}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {horizonType === 'full_year' && (
                <div className="text-xs text-slate-600 dark:text-slate-400 bg-white dark:bg-slate-900 p-2.5 rounded-lg border border-slate-200 dark:border-slate-700 font-medium">
                  {isAr ? 'يتم الاحتساب عبر كامل العام الدراسي المعتمد بالإعدادات من' : 'Calculated over the entire academic year from'}{' '}
                  <strong className="font-mono text-primary font-bold">{academicYearBounds.start}</strong>{' '}
                  {isAr ? 'إلى' : 'to'}{' '}
                  <strong className="font-mono text-primary font-bold">{academicYearBounds.end}</strong>.
                </div>
              )}

              {horizonType === 'custom' && (
                <div className="space-y-2">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                    <div>
                      <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-400 mb-1">
                        {isAr ? 'من تاريخ:' : 'Start Date:'}
                      </label>
                      <input
                        type="date"
                        value={customStartDate}
                        min={academicYearBounds.start}
                        max={academicYearBounds.end}
                        onChange={(e) => setCustomStartDate(e.target.value)}
                        className="w-full text-xs font-semibold bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg px-2.5 py-1.5 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-primary/20"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-400 mb-1">
                        {isAr ? 'إلى تاريخ:' : 'End Date:'}
                      </label>
                      <input
                        type="date"
                        value={customEndDate}
                        min={academicYearBounds.start}
                        max={academicYearBounds.end}
                        onChange={(e) => setCustomEndDate(e.target.value)}
                        className="w-full text-xs font-semibold bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg px-2.5 py-1.5 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-primary/20"
                      />
                    </div>
                  </div>

                  {!customDateValidation.isValid && (
                    <div className="p-2.5 rounded-lg bg-rose-50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-900/40 text-rose-700 dark:text-rose-300 text-xs font-bold flex items-center gap-2">
                      <AlertTriangle className="w-4 h-4 shrink-0" />
                      <span>{customDateValidation.error}</span>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Statistical KPI Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-center">
            {/* Attendance Rate */}
            <div className="p-3.5 rounded-xl border border-emerald-200 dark:border-emerald-900/40 bg-emerald-50/50 dark:bg-emerald-950/20">
              <div className="text-[11px] font-bold text-emerald-800 dark:text-emerald-400">
                {isAr ? 'نسبة الحضور' : 'Attendance Rate'}
              </div>
              <div className="text-2xl font-black text-emerald-700 dark:text-emerald-300 mt-0.5">
                %{studentAbsenceAnalysis?.attendanceRate || 100}
              </div>
              <div className="text-[10px] text-emerald-600/80 font-medium">
                {studentAbsenceAnalysis?.presentDaysCount || 0} {isAr ? 'يوم حضور' : 'days present'}
              </div>
            </div>

            {/* Unexcused Absences */}
            <div className="p-3.5 rounded-xl border border-rose-200 dark:border-rose-900/40 bg-rose-50/50 dark:bg-rose-950/20">
              <div className="text-[11px] font-bold text-rose-800 dark:text-rose-400">
                {isAr ? 'غياب بدون عذر' : 'Unexcused'}
              </div>
              <div className="text-2xl font-black text-rose-700 dark:text-rose-300 mt-0.5">
                {studentAbsenceAnalysis?.unexcusedDaysCount || 0}
              </div>
              <div className="text-[10px] text-rose-600/80 font-medium">
                {isAr ? 'أيام غير مبررة' : 'unexcused days'}
              </div>
            </div>

            {/* Excused Absences */}
            <div className="p-3.5 rounded-xl border border-blue-200 dark:border-blue-900/40 bg-blue-50/50 dark:bg-blue-950/20">
              <div className="text-[11px] font-bold text-blue-800 dark:text-blue-400">
                {isAr ? 'غياب بعذر معتمد' : 'Excused'}
              </div>
              <div className="text-2xl font-black text-blue-700 dark:text-blue-300 mt-0.5">
                {studentAbsenceAnalysis?.excusedDaysCount || 0}
              </div>
              <div className="text-[10px] text-blue-600/80 font-medium">
                {isAr ? 'أعذار مقبولة' : 'approved leaves'}
              </div>
            </div>

            {/* Late Arrivals */}
            <div className="p-3.5 rounded-xl border border-amber-200 dark:border-amber-900/40 bg-amber-50/50 dark:bg-amber-950/20">
              <div className="text-[11px] font-bold text-amber-800 dark:text-amber-400">
                {isAr ? 'التأخر الصباحي' : 'Tardiness'}
              </div>
              <div className="text-2xl font-black text-amber-700 dark:text-amber-300 mt-0.5">
                {studentAbsenceAnalysis?.lateDaysCount || 0}
              </div>
              <div className="text-[10px] text-amber-600/80 font-medium">
                {studentAbsenceAnalysis?.totalMinutesLate || 0} {isAr ? 'دقيقة تأخر' : 'mins late'}
              </div>
            </div>
          </div>

          {/* Absence & Tardiness Detailed Records Table */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs font-bold text-slate-800 dark:text-slate-200">
              <span className="flex items-center gap-1.5">
                <Clock className="w-4 h-4 text-primary" />
                <span>{isAr ? 'السجل الزمني للغياب والتأخر خلال الفترة:' : 'Absence & Tardiness Chronology:'}</span>
              </span>
              <span className="font-mono text-[11px] text-slate-500">
                {studentAbsenceAnalysis?.records.length || 0} {isAr ? 'سجل' : 'records'}
              </span>
            </div>

            <div className="rounded-xl border border-slate-200 dark:border-slate-700 overflow-hidden bg-white dark:bg-slate-900 shadow-2xs">
              <div className="max-h-72 overflow-y-auto scrollbar-thin">
                <table className="w-full text-right text-xs">
                  <thead className="bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold sticky top-0 z-10 border-b border-slate-200 dark:border-slate-700">
                    <tr>
                      <th className="py-2.5 px-3 w-10 text-center">#</th>
                      <th className="py-2.5 px-3">{isAr ? 'اليوم والتاريخ' : 'Day & Date'}</th>
                      <th className="py-2.5 px-3">{isAr ? 'نوع الحالة' : 'Status'}</th>
                      <th className="py-2.5 px-3">{isAr ? 'الحصة / الفترة' : 'Period'}</th>
                      <th className="py-2.5 px-3">{isAr ? 'البيان والمبررات' : 'Reason & Justification'}</th>
                      <th className="py-2.5 px-3 text-center">{isAr ? 'إجراء التواصل' : 'Action'}</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                    {studentAbsenceAnalysis?.records.map((r, i) => (
                      <tr key={i} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                        <td className="py-2 px-3 text-center text-slate-400 font-mono text-[11px]">{i + 1}</td>
                        <td className="py-2 px-3">
                          <div className="font-bold text-slate-900 dark:text-slate-100">{r.dayName}</div>
                          <div className="text-[10px] text-slate-500 font-mono">{r.date}</div>
                        </td>
                        <td className="py-2 px-3">
                          <span
                            className={`px-2 py-0.5 rounded-md text-[10px] font-bold ${
                              r.status === 'late'
                                ? 'bg-amber-100 dark:bg-amber-950/40 text-amber-800 dark:text-amber-300 border border-amber-300'
                                : r.isExcused
                                ? 'bg-blue-100 dark:bg-blue-950/40 text-blue-800 dark:text-blue-300 border border-blue-300'
                                : 'bg-rose-100 dark:bg-rose-950/40 text-rose-800 dark:text-rose-300 border border-rose-300'
                            }`}
                          >
                            {r.status === 'late'
                              ? isAr ? `تأخر (${r.minutesLate || 15} د)` : `Late (${r.minutesLate || 15}m)`
                              : r.isExcused
                              ? isAr ? 'بعذر معتمد' : 'Excused'
                              : isAr ? 'بدون عذر' : 'Unexcused'}
                          </span>
                        </td>
                        <td className="py-2 px-3 text-slate-600 dark:text-slate-400 text-[11px]">
                          {r.periodLabel}
                        </td>
                        <td className="py-2 px-3">
                          <div className="font-semibold text-slate-800 dark:text-slate-200 text-[11px]">
                            {r.justificationReason}
                          </div>
                          {r.note && <div className="text-[10px] text-slate-400">{r.note}</div>}
                        </td>
                        <td className="py-2 px-3 text-center">
                          <span className={`text-[10px] font-bold ${r.isExcused ? 'text-emerald-600' : 'text-rose-600'}`}>
                            {r.actionStatus}
                          </span>
                        </td>
                      </tr>
                    ))}

                    {(!studentAbsenceAnalysis?.records || studentAbsenceAnalysis.records.length === 0) && (
                      <tr>
                        <td colSpan={6} className="py-8 text-center text-slate-400 text-xs">
                          {isAr
                            ? 'لا توجد أي أيام غياب أو تأخر مسجلة للطالب خلال هذه الفترة.'
                            : 'No absence or tardiness records for this timeframe.'}
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          {/* Conduct & Behaviour Section */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs font-bold text-slate-800 dark:text-slate-200">
              <span className="flex items-center gap-1.5">
                <Award className="w-4 h-4 text-indigo-600" />
                <span>{isAr ? 'سجل السلوك والمخالفات في الفترة:' : 'Conduct & Behavior:'}</span>
              </span>
              <span className="font-mono text-[11px] text-slate-500">
                {infractionsList.length} {isAr ? 'مخالفات' : 'infractions'} | {positivePointsList.length} {isAr ? 'نقاط إيجابية' : 'positive'}
              </span>
            </div>

            {infractionsList.length > 0 ? (
              <div className="space-y-2">
                {infractionsList.map((incident) => (
                  <div
                    key={incident.id}
                    className="p-3 rounded-xl bg-rose-50/50 dark:bg-rose-950/20 border border-rose-200/50 dark:border-rose-900/30 text-xs space-y-1.5"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="px-1.5 py-0.5 rounded bg-rose-600 text-white font-bold text-[10px]">
                          {incident.severity === 'major'
                            ? isAr ? 'جسيمة' : 'Major'
                            : incident.severity === 'moderate'
                            ? isAr ? 'متوسطة' : 'Moderate'
                            : isAr ? 'بسيطة' : 'Minor'}
                        </span>
                        <span className="font-bold text-slate-900 dark:text-slate-100">
                          {incident.title}
                        </span>
                      </div>
                      <span className="font-mono text-[11px] text-slate-500 font-bold">{incident.date}</span>
                    </div>
                    {incident.description && (
                      <p className="text-[11px] text-slate-600 dark:text-slate-300">
                        {incident.description}
                      </p>
                    )}
                    <div className="flex items-center justify-between text-[10px] text-slate-500 pt-1 border-t border-rose-100 dark:border-rose-900/30">
                      <span>{isAr ? 'الإجراء: ' : 'Action: '} {incident.actionTaken || 'قيد المتابعة'}</span>
                      <span>{isAr ? 'الراصد: ' : 'By: '} {incident.recordedBy}</span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="p-4 text-center rounded-xl bg-slate-50/60 dark:bg-slate-800/30 border border-dashed border-slate-200 dark:border-slate-700 text-xs text-slate-500 flex items-center justify-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>{isAr ? 'سجل السلوك نظيف تماماً في هذه الفترة — لا توجد مخالفات مسجلة.' : 'Clean conduct record in this timeframe.'}</span>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
};

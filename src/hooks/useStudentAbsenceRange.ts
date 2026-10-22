import { useEffect, useMemo, useState } from 'react';
import { TenantSchoolProfile } from '../types/attendance';
import { isSchoolOffDay } from '../utils/holidayUtils';

export interface UseStudentAbsenceRangeParams {
  schoolProfile?: TenantSchoolProfile;
  isAr: boolean;
}

export function useStudentAbsenceRange({ schoolProfile, isAr }: UseStudentAbsenceRangeParams) {
  // Horizon / Date Range filter state
  const [horizonType, setHorizonType] = useState<'month' | 'term' | 'full_year' | 'custom'>('month');
  const [selectedMonth, setSelectedMonth] = useState<string>('2026-10');
  const [selectedTermId, setSelectedTermId] = useState<string>('term-1');
  const [customStartDate, setCustomStartDate] = useState<string>('2026-09-01');
  const [customEndDate, setCustomEndDate] = useState<string>(() => new Date().toISOString().split('T')[0]);

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

  return {
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
  };
}

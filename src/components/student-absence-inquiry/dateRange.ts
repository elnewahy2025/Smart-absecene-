import type { AcademicTerm, TenantSchoolProfile } from '../../types/attendance';
import { isSchoolOffDay } from '../../utils/holidayUtils';
import type { CustomDateValidation, DateRange, HorizonType, MonthOption } from './types';

const FALLBACK_ACADEMIC_TERMS: AcademicTerm[] = [
  {
    id: 'term-1',
    nameAr: 'الفصل الدراسي الأول',
    nameEn: 'Term 1',
    startDate: '2026-09-01',
    endDate: '2026-11-26',
    isActive: true,
  },
  {
    id: 'term-2',
    nameAr: 'الفصل الدراسي الثاني',
    nameEn: 'Term 2',
    startDate: '2026-12-06',
    endDate: '2027-02-25',
    isActive: false,
  },
  {
    id: 'term-3',
    nameAr: 'الفصل الدراسي الثالث',
    nameEn: 'Term 3',
    startDate: '2027-03-07',
    endDate: '2027-06-24',
    isActive: false,
  },
];

export function resolveAcademicTerms(schoolProfile?: TenantSchoolProfile | null): AcademicTerm[] {
  const terms = schoolProfile?.academicYear?.terms;
  if (terms && terms.length > 0) {
    return terms;
  }
  return FALLBACK_ACADEMIC_TERMS.map((term) => ({ ...term }));
}

export function resolveAcademicYearBounds(academicTerms: AcademicTerm[]): { start: string; end: string } {
  const starts = academicTerms.map((term) => term.startDate).filter(Boolean).sort();
  const ends = academicTerms.map((term) => term.endDate).filter(Boolean).sort();
  const start = starts[0] || '2026-09-01';
  const end = ends[ends.length - 1] || '2027-06-24';
  return { start, end };
}

export function buildAvailableMonths(
  academicYearBounds: { start: string; end: string },
  today: Date = new Date()
): MonthOption[] {
  const list: MonthOption[] = [];
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

  const currentYm = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}`;

  let year = startYear;
  let month = startMonth;

  while (year < endYear || (year === endYear && month <= endMonth)) {
    const ym = `${year}-${String(month).padStart(2, '0')}`;
    const monthString = String(month).padStart(2, '0');
    const isCurrent = ym === currentYm;
    list.push({
      value: ym,
      labelAr: `${arabicMonthNames[month]} ${year} (${monthString})${isCurrent ? ' - الحالي' : ''}`,
      labelEn: `${englishMonthNames[month]} ${year}${isCurrent ? ' (Current)' : ''}`,
    });

    month++;
    if (month > 12) {
      month = 1;
      year++;
    }
  }
  return list;
}

export function validateCustomDateRange(params: {
  horizonType: HorizonType;
  customStartDate: string;
  customEndDate: string;
  academicYearBounds: { start: string; end: string };
  isAr: boolean;
}): CustomDateValidation {
  const { horizonType, customStartDate, customEndDate, academicYearBounds, isAr } = params;
  if (horizonType !== 'custom') return { isValid: true, error: null };
  if (!customStartDate || !customEndDate) {
    return {
      isValid: false,
      error: isAr ? 'يرجى تحديد تاريخ البداية وتاريخ النهاية للمدة المخصصة.' : 'Please select start and end dates.',
    };
  }
  if (customStartDate < academicYearBounds.start) {
    return {
      isValid: false,
      error: isAr
        ? `❌ تاريخ البداية (${customStartDate}) غير صحيح ومخالف للتقويم المعتمد: يبدأ العام الدراسي المعتمد في صفحة الإعدادات بتاريخ ${academicYearBounds.start}. تم رفض التاريخ تماماً.`
        : `❌ Start date (${customStartDate}) rejected: Academic year starts on ${academicYearBounds.start} in Settings.`,
    };
  }
  if (customEndDate > academicYearBounds.end) {
    return {
      isValid: false,
      error: isAr
        ? `❌ تاريخ النهاية (${customEndDate}) غير صحيح ومخالف للتقويم المعتمد: ينتهي العام الدراسي المعتمد في صفحة الإعدادات بتاريخ ${academicYearBounds.end}. تم رفض التاريخ تماماً.`
        : `❌ End date (${customEndDate}) rejected: Academic year ends on ${academicYearBounds.end} in Settings.`,
    };
  }
  if (customStartDate > customEndDate) {
    return {
      isValid: false,
      error: isAr
        ? `❌ خطأ في تحديد الفترة: تاريخ البداية (${customStartDate}) يجب ألا يكون بعد تاريخ النهاية (${customEndDate}). تم الرفض.`
        : '❌ Invalid dates: Start date cannot be after end date.',
    };
  }
  return { isValid: true, error: null };
}

export function resolveActiveDateRange(params: {
  horizonType: HorizonType;
  selectedMonth: string;
  selectedTermId: string;
  customStartDate: string;
  customEndDate: string;
  academicTerms: AcademicTerm[];
  academicYearBounds: { start: string; end: string };
  availableMonths: MonthOption[];
  customDateValidation: CustomDateValidation;
  schoolProfile?: TenantSchoolProfile | null;
  isAr: boolean;
  today?: Date;
}): DateRange {
  const {
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
  } = params;
  const today = params.today ?? new Date();
  const todayStr = today.toISOString().split('T')[0];

  if (horizonType === 'month') {
    const [yearString, monthString] = selectedMonth.split('-');
    const year = parseInt(yearString, 10);
    const month = parseInt(monthString, 10);
    const monthStartStr = `${selectedMonth}-01`;
    const lastDay = new Date(year, month, 0).getDate();
    const endOfMonthStr = `${selectedMonth}-${String(lastDay).padStart(2, '0')}`;

    const start = monthStartStr < academicYearBounds.start ? academicYearBounds.start : monthStartStr;
    const nominalEnd = endOfMonthStr > academicYearBounds.end ? academicYearBounds.end : endOfMonthStr;
    const isCurrentMonth = todayStr.startsWith(selectedMonth);
    const end = isCurrentMonth && todayStr < nominalEnd ? todayStr : nominalEnd;
    const monthObject = availableMonths.find((entry) => entry.value === selectedMonth);
    const cleanMonthLabel = monthObject?.labelAr.replace(' - الحالي', '') || selectedMonth;
    const label = isAr ? `شهر ${cleanMonthLabel}` : `Month ${monthObject?.labelEn || selectedMonth}`;
    return { start, end, label };
  }

  if (horizonType === 'term') {
    const term = academicTerms.find((entry) => entry.id === selectedTermId) || academicTerms[0];
    const nominalStart = term?.startDate || academicYearBounds.start;
    const nominalEnd = term?.endDate || todayStr;
    const start = nominalStart < academicYearBounds.start ? academicYearBounds.start : nominalStart;
    const boundedEnd = nominalEnd > academicYearBounds.end ? academicYearBounds.end : nominalEnd;
    const end = term?.isActive && todayStr >= start && todayStr < boundedEnd ? todayStr : boundedEnd;
    return {
      start,
      end,
      label: isAr ? `${term?.nameAr || 'الفصل الدراسي'} (${start} إلى ${end})` : term?.nameEn || 'Term',
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
}

export function getArabicDayName(dateStr: string): string {
  try {
    const date = new Date(dateStr);
    if (isNaN(date.getTime())) return '—';
    const days = ['الأحد', 'الإثنين', 'الثلاثاء', 'الأربعاء', 'الخميس', 'الجمعة', 'السبت'];
    return days[date.getDay()] || '—';
  } catch {
    return '—';
  }
}

export function getSchoolDaysInRange(
  startDateStr: string,
  endDateStr: string,
  academicYearBounds: { start: string; end: string },
  weekendDays?: number[],
  officialHolidays?: TenantSchoolProfile['officialHolidays']
): string[] {
  const effectiveStart = startDateStr < academicYearBounds.start ? academicYearBounds.start : startDateStr;
  const effectiveEnd = endDateStr > academicYearBounds.end ? academicYearBounds.end : endDateStr;
  if (effectiveStart > effectiveEnd) return [];

  const days: string[] = [];
  const current = new Date(effectiveStart);
  const end = new Date(effectiveEnd);
  let count = 0;
  while (current <= end && count < 400) {
    count++;
    const dateString = current.toISOString().split('T')[0];
    const offCheck = isSchoolOffDay(dateString, weekendDays, officialHolidays);
    if (!offCheck.isOff) {
      days.push(dateString);
    }
    current.setDate(current.getDate() + 1);
  }
  return days;
}

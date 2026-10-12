import { OfficialHoliday, HolidayType } from '../types/attendance';

export const DEFAULT_WEEKEND_DAYS: number[] = [5, 6]; // Friday (5) & Saturday (6)

export const DEFAULT_OFFICIAL_HOLIDAYS: OfficialHoliday[] = [
  {
    id: 'hol-saudi-national-day',
    nameAr: 'اليوم الوطني للمملكة العربية السعودية (94)',
    nameEn: 'Saudi National Day 94',
    startDate: '2026-09-23',
    endDate: '2026-09-23',
    type: 'national',
    notes: 'إجازة رسمية لكافة المدارس والجامعات والقطاعات الحكومية والخاصة بالمملكة.',
  },
  {
    id: 'hol-extended-weekend-1',
    nameAr: 'إجازة نهاية أسبوع مطولة (الفصل الأول)',
    nameEn: 'Extended Weekend 1',
    startDate: '2026-10-14',
    endDate: '2026-10-15',
    type: 'extended_weekend',
    notes: 'عطلة نهاية أسبوع مطولة معتمدة بالتقويم الدراسي لوزارة التعليم.',
  },
  {
    id: 'hol-saudi-founding-day',
    nameAr: 'يوم التأسيس السعودي',
    nameEn: 'Saudi Founding Day',
    startDate: '2027-02-22',
    endDate: '2027-02-22',
    type: 'national',
    notes: 'إجازة رسمية لذكرى تأسيس الدولة السعودية.',
  },
  {
    id: 'hol-eid-fitr',
    nameAr: 'إجازة عيد الفطر المبارك',
    nameEn: 'Eid Al-Fitr Holiday',
    startDate: '2027-03-18',
    endDate: '2027-04-03',
    type: 'religious',
    notes: 'إجازة عيد الفطر المبارك لجميع المدارس ومنسوبيها.',
  },
  {
    id: 'hol-extended-weekend-2',
    nameAr: 'إجازة نهاية أسبوع مطولة (الفصل الثاني)',
    nameEn: 'Extended Weekend 2',
    startDate: '2027-05-02',
    endDate: '2027-05-03',
    type: 'extended_weekend',
    notes: 'عطلة نهاية أسبوع مطولة لتعزيز الانضباط وتجديد النشاط المدرسي.',
  },
  {
    id: 'hol-eid-adha',
    nameAr: 'إجازة عيد الأضحى المبارك',
    nameEn: 'Eid Al-Adha Holiday',
    startDate: '2027-05-25',
    endDate: '2027-06-05',
    type: 'religious',
    notes: 'إجازة عيد الأضحى المبارك وموسم الحج.',
  },
];

export interface OffDayCheckResult {
  isOff: boolean;
  reason?: string;
  holidayName?: string;
  type?: 'weekend' | 'holiday';
  holiday?: OfficialHoliday;
}

const ARABIC_DAY_NAMES = [
  'الأحد',
  'الإثنين',
  'الثلاثاء',
  'الأربعاء',
  'الخميس',
  'الجمعة',
  'السبت',
];

const ENGLISH_DAY_NAMES = [
  'Sunday',
  'Monday',
  'Tuesday',
  'Wednesday',
  'Thursday',
  'Friday',
  'Saturday',
];

/**
 * Checks whether a given date is an official school off-day (either a weekly weekend or official holiday).
 */
export const isSchoolOffDay = (
  dateStr: string,
  weekendDays: number[] = DEFAULT_WEEKEND_DAYS,
  officialHolidays: OfficialHoliday[] = DEFAULT_OFFICIAL_HOLIDAYS
): OffDayCheckResult => {
  if (!dateStr) return { isOff: false };

  // Parse YYYY-MM-DD safely
  const cleanDate = dateStr.slice(0, 10);
  const parts = cleanDate.split('-').map(Number);
  if (parts.length !== 3 || parts.some(isNaN)) return { isOff: false };

  // Note: month is 0-indexed in JS Date
  const d = new Date(parts[0], parts[1] - 1, parts[2]);
  if (isNaN(d.getTime())) return { isOff: false };

  const dayOfWeek = d.getDay(); // 0=Sunday, ..., 5=Friday, 6=Saturday

  // 1. Check Weekend Days
  const effectiveWeekends = weekendDays && weekendDays.length > 0 ? weekendDays : DEFAULT_WEEKEND_DAYS;
  if (effectiveWeekends.includes(dayOfWeek)) {
    const dayName = ARABIC_DAY_NAMES[dayOfWeek];
    return {
      isOff: true,
      type: 'weekend',
      reason: `عطلة نهاية الأسبوع الرسمية (${dayName})`,
    };
  }

  // 2. Check Official Holidays
  const holidays = officialHolidays && officialHolidays.length > 0 ? officialHolidays : DEFAULT_OFFICIAL_HOLIDAYS;
  const matched = holidays.find((h) => {
    const start = h.startDate.slice(0, 10);
    const end = (h.endDate || h.startDate).slice(0, 10);
    return cleanDate >= start && cleanDate <= end;
  });

  if (matched) {
    return {
      isOff: true,
      type: 'holiday',
      holidayName: matched.nameAr,
      reason: `عطلة رسمية: ${matched.nameAr}`,
      holiday: matched,
    };
  }

  return { isOff: false };
};

/**
 * Computes the 5 official school days for the school week containing the given reference date.
 * Typically Sunday through Thursday (0 to 4) when Friday (5) & Saturday (6) are weekends.
 */
export interface SchoolDaySlot {
  date: string; // YYYY-MM-DD
  dayOfWeek: number; // 0 to 6
  dayNameAr: string;
  dayNameEn: string;
  isWeekend: boolean;
  isHoliday: boolean;
  holidayName?: string;
  isOffDay: boolean;
  offDayReason?: string;
  isToday: boolean;
  isPastOrToday: boolean;
}

export const getSchoolWeekDays = (
  referenceDateInput: string | Date = new Date(),
  weekendDays: number[] = DEFAULT_WEEKEND_DAYS,
  officialHolidays: OfficialHoliday[] = DEFAULT_OFFICIAL_HOLIDAYS
): SchoolDaySlot[] => {
  let refDate: Date;
  if (typeof referenceDateInput === 'string') {
    const parts = referenceDateInput.slice(0, 10).split('-').map(Number);
    refDate = new Date(parts[0], parts[1] - 1, parts[2]);
  } else {
    refDate = new Date(referenceDateInput.getFullYear(), referenceDateInput.getMonth(), referenceDateInput.getDate());
  }

  const today = new Date();
  const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;

  // Find Sunday of the current week (day 0)
  const dayOfWeek = refDate.getDay(); // 0 is Sunday
  const sunday = new Date(refDate);
  sunday.setDate(refDate.getDate() - dayOfWeek);

  const effectiveWeekends = weekendDays && weekendDays.length > 0 ? weekendDays : DEFAULT_WEEKEND_DAYS;

  // Generate 7 days of the week, filter for standard school days (non-weekends)
  const weekDays: SchoolDaySlot[] = [];
  for (let i = 0; i < 7; i++) {
    const d = new Date(sunday);
    d.setDate(sunday.getDate() + i);

    const dOfWeek = d.getDay();
    // Only include official school days (i.e. exclude weekend days)
    if (effectiveWeekends.includes(dOfWeek)) {
      continue;
    }

    const dateStr = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
    const offCheck = isSchoolOffDay(dateStr, effectiveWeekends, officialHolidays);

    weekDays.push({
      date: dateStr,
      dayOfWeek: dOfWeek,
      dayNameAr: ARABIC_DAY_NAMES[dOfWeek],
      dayNameEn: ENGLISH_DAY_NAMES[dOfWeek],
      isWeekend: false,
      isHoliday: offCheck.type === 'holiday',
      holidayName: offCheck.holidayName,
      isOffDay: offCheck.isOff,
      offDayReason: offCheck.reason,
      isToday: dateStr === todayStr,
      isPastOrToday: dateStr <= todayStr,
    });
  }

  return weekDays;
};

/**
 * Counts the active school days between two dates, excluding weekends and official holidays.
 */
export const countActiveSchoolDays = (
  startDateStr: string,
  endDateStr: string,
  weekendDays: number[] = DEFAULT_WEEKEND_DAYS,
  officialHolidays: OfficialHoliday[] = DEFAULT_OFFICIAL_HOLIDAYS
): number => {
  const startParts = startDateStr.slice(0, 10).split('-').map(Number);
  const endParts = endDateStr.slice(0, 10).split('-').map(Number);

  const curr = new Date(startParts[0], startParts[1] - 1, startParts[2]);
  const end = new Date(endParts[0], endParts[1] - 1, endParts[2]);

  let count = 0;
  while (curr <= end) {
    const dateStr = `${curr.getFullYear()}-${String(curr.getMonth() + 1).padStart(2, '0')}-${String(curr.getDate()).padStart(2, '0')}`;
    const check = isSchoolOffDay(dateStr, weekendDays, officialHolidays);
    if (!check.isOff) {
      count++;
    }
    curr.setDate(curr.getDate() + 1);
  }

  return count;
};

export const getHolidayTypeLabel = (type: HolidayType, lang: 'ar' | 'en' = 'ar'): string => {
  switch (type) {
    case 'national':
      return lang === 'ar' ? 'مناسبة وطنية رسمية' : 'National Holiday';
    case 'religious':
      return lang === 'ar' ? 'عطلة دينية (أعياد)' : 'Religious Holiday';
    case 'extended_weekend':
      return lang === 'ar' ? 'نهاية أسبوع مطولة' : 'Extended Weekend';
    case 'emergency':
      return lang === 'ar' ? 'تعليق طارئ (طقس/أخرى)' : 'Emergency Suspension';
    case 'official':
    default:
      return lang === 'ar' ? 'عطلة رسمية' : 'Official Holiday';
  }
};

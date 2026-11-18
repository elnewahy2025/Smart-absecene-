import type { TimetablePeriod, TimetableScheduleConfig } from '../types/attendance';

const LESSON_ORDINAL_NAMES_AR: Record<number, string> = {
  1: 'الحصة الأولى',
  2: 'الحصة الثانية',
  3: 'الحصة الثالثة',
  4: 'الحصة الرابعة',
  5: 'الحصة الخامسة',
  6: 'الحصة السادسة',
  7: 'الحصة السابعة',
  8: 'الحصة الثامنة',
  9: 'الحصة التاسعة',
  10: 'الحصة العاشرة',
};

export const KUWAIT_EDUCATIONAL_STAGES = [
  'رياض الأطفال',
  'المرحلة الابتدائية',
  'المرحلة المتوسطة',
  'المرحلة الثانوية',
  'المرحلة الثانوية - نظام المقررات (المسارات)',
  'مدارس الموهوبين',
] as const;

export const DEFAULT_TIMETABLE_CONFIG: TimetableScheduleConfig = {
  assemblyStartTime: '07:30',
  assemblyDurationMinutes: 15,
  assemblyNameAr: 'لقاء الصباح',
  lessonCount: 7,
  lessonDurationMinutes: 45,
  betweenLessonsMinutes: 5,
  firstRecessDurationMinutes: 30,
  firstRecessAfterLesson: 3,
  secondRecessDurationMinutes: 15,
  secondRecessAfterLesson: 5,
  secondRecessType: 'recess',
  secondRecessNameAr: 'الفرصة الثانية',
};

export interface TimetablePreset {
  id: string;
  labelAr: string;
  labelEn: string;
  stageKeywords?: string[];
  config?: TimetableScheduleConfig;
  /** Used for non-uniform schedules such as Kindergarten. */
  fixedPeriods?: TimetablePeriod[];
}

export const TIMETABLE_PRESETS: TimetablePreset[] = [
  {
    id: 'custom-default',
    labelAr: 'الجدول القياسي (45 د + طابور 7:30 + الفرصة الأولى 30 د / الثانية 15 د)',
    labelEn: 'Standard (45m + Assembly 07:30 + 1st Break 30m / 2nd Break 15m)',
    config: DEFAULT_TIMETABLE_CONFIG,
  },
  {
    id: 'kuwait-primary',
    labelAr: 'الكويت - المرحلة الابتدائية (40 د | 07:15 – 1:25)',
    labelEn: 'Kuwait - Primary (40m | 07:15 – 13:25)',
    stageKeywords: ['ابتدائي', 'الابتدائية', 'primary'],
    config: {
      assemblyStartTime: '07:15',
      assemblyDurationMinutes: 15,
      assemblyNameAr: 'لقاء الصباح',
      lessonCount: 7,
      lessonDurationMinutes: 40,
      betweenLessonsMinutes: 5,
      firstRecessDurationMinutes: 30,
      firstRecessAfterLesson: 2,
      secondRecessDurationMinutes: 25,
      secondRecessAfterLesson: 5,
      secondRecessType: 'prayer',
      secondRecessNameAr: 'فرصة الصلاة',
    },
  },
  {
    id: 'kuwait-intermediate',
    labelAr: 'الكويت - المرحلة المتوسطة (45 د | 07:30 – 1:40)',
    labelEn: 'Kuwait - Intermediate (45m | 07:30 – 13:40)',
    stageKeywords: ['متوسط', 'المتوسطة', 'intermediate'],
    config: {
      assemblyStartTime: '07:30',
      assemblyDurationMinutes: 10,
      assemblyNameAr: 'لقاء الصباح',
      lessonCount: 7,
      lessonDurationMinutes: 45,
      betweenLessonsMinutes: 5,
      firstRecessDurationMinutes: 15,
      firstRecessAfterLesson: 2,
      secondRecessDurationMinutes: 10,
      secondRecessAfterLesson: 5,
      secondRecessType: 'prayer',
      secondRecessNameAr: 'فرصة الصلاة',
    },
  },
  {
    id: 'kuwait-secondary-tracks',
    labelAr: 'الكويت - الثانوية / المقررات والمسارات (45 د | 07:30 – 2:15)',
    labelEn: 'Kuwait - Secondary Tracks (45m | 07:30 – 14:15)',
    stageKeywords: ['مقررات', 'مسارات', 'tracks'],
    config: {
      assemblyStartTime: '07:30',
      assemblyDurationMinutes: 10,
      assemblyNameAr: 'لقاء الصباح',
      lessonCount: 7,
      lessonDurationMinutes: 45,
      betweenLessonsMinutes: 10,
      firstRecessDurationMinutes: 25,
      firstRecessAfterLesson: 3,
      secondRecessDurationMinutes: 15,
      secondRecessAfterLesson: 5,
      secondRecessType: 'prayer',
      secondRecessNameAr: 'فرصة الصلاة',
    },
  },
  {
    id: 'kuwait-secondary',
    labelAr: 'الكويت - المرحلة الثانوية والموهوبين (45 د | 07:45 – 1:55)',
    labelEn: 'Kuwait - Secondary & Gifted (45m | 07:45 – 13:55)',
    stageKeywords: ['ثانوي', 'الثانوية', 'موهوبين', 'الموهوبين', 'secondary', 'gifted'],
    config: {
      assemblyStartTime: '07:45',
      assemblyDurationMinutes: 10,
      assemblyNameAr: 'لقاء الصباح',
      lessonCount: 7,
      lessonDurationMinutes: 45,
      betweenLessonsMinutes: 5,
      firstRecessDurationMinutes: 15,
      firstRecessAfterLesson: 3,
      secondRecessDurationMinutes: 10,
      secondRecessAfterLesson: 5,
      secondRecessType: 'prayer',
      secondRecessNameAr: 'فرصة الصلاة',
    },
  },
  {
    id: 'kuwait-kg',
    labelAr: 'الكويت - رياض الأطفال (07:15 – 12:05)',
    labelEn: 'Kuwait - Kindergarten (07:15 – 12:05)',
    stageKeywords: ['رياض', 'أطفال', 'kindergarten', 'kg'],
    fixedPeriods: [
      { id: 'kg-0', periodNumber: 0, nameAr: 'استقبال الأطفال', startTime: '07:15', endTime: '07:35', type: 'assembly' },
      { id: 'kg-1', periodNumber: 1, nameAr: 'النشاط الصباحي', startTime: '07:35', endTime: '08:05', type: 'assembly' },
      { id: 'kg-2', periodNumber: 2, nameAr: 'الفترة الأولى (العمل الجماعي)', startTime: '08:05', endTime: '08:25', type: 'lesson' },
      { id: 'kg-3', periodNumber: 3, nameAr: 'غسل الأيدي', startTime: '08:25', endTime: '08:35', type: 'recess' },
      { id: 'kg-4', periodNumber: 4, nameAr: 'الفطور', startTime: '08:35', endTime: '08:55', type: 'recess' },
      { id: 'kg-5', periodNumber: 5, nameAr: 'غسل الأيدي والأسنان', startTime: '08:55', endTime: '09:10', type: 'recess' },
      { id: 'kg-6', periodNumber: 6, nameAr: 'الفرصة', startTime: '09:10', endTime: '09:55', type: 'recess' },
      { id: 'kg-7', periodNumber: 7, nameAr: 'الفترة الثانية (العمل بالأركان)', startTime: '09:55', endTime: '10:50', type: 'lesson' },
      { id: 'kg-8', periodNumber: 8, nameAr: 'وجبة خفيفة', startTime: '10:50', endTime: '11:00', type: 'recess' },
      { id: 'kg-9', periodNumber: 9, nameAr: 'الفترة الثالثة (الأنشطة اللاصفية والهادئة)', startTime: '11:00', endTime: '11:40', type: 'lesson' },
      { id: 'kg-10', periodNumber: 10, nameAr: 'الفترة الرابعة (الانصراف)', startTime: '11:40', endTime: '12:05', type: 'lesson' },
    ],
  },
];

/** Matches a school stage string (e.g. `profile.stageAr`) to a Kuwait MOE timetable preset. */
export function matchTimetablePresetForStage(stageAr?: string): TimetablePreset | undefined {
  const normalized = (stageAr || '').trim().toLowerCase();
  if (!normalized) return undefined;
  return TIMETABLE_PRESETS.find((preset) =>
    preset.stageKeywords?.some((kw) => normalized.includes(kw.toLowerCase()))
  );
}

/**
 * Parses an "HH:MM" 24-hour string into total minutes since midnight.
 * Falls back to 07:30 (450 minutes) if invalid.
 */
export function parseTimeToMinutes(timeStr: string): number {
  const match = /^(\d{1,2}):(\d{2})$/.exec((timeStr || '').trim());
  if (!match) return 7 * 60 + 30;
  const hours = Math.min(23, Math.max(0, Number(match[1])));
  const minutes = Math.min(59, Math.max(0, Number(match[2])));
  return hours * 60 + minutes;
}

/** Formats total minutes since midnight as zero-padded "HH:MM" (24-hour). */
export function formatMinutesToTime(totalMinutes: number): string {
  const normalized = ((Math.round(totalMinutes) % 1440) + 1440) % 1440;
  const hours = Math.floor(normalized / 60);
  const minutes = normalized % 60;
  return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`;
}

/** Returns duration in minutes between two "HH:MM" strings. */
export function getPeriodDurationMinutes(startTime: string, endTime: string): number {
  const start = parseTimeToMinutes(startTime);
  const end = parseTimeToMinutes(endTime);
  return end >= start ? end - start : 1440 - start + end;
}

const clampNonNeg = (value: number, fallback: number): number =>
  Number.isFinite(value) && value >= 0 ? Math.round(value) : fallback;

/**
 * Generates a full daily timetable from configurable durations.
 * - Assembly runs from `assemblyStartTime` for `assemblyDurationMinutes`.
 * - Lesson 1 starts immediately when assembly ends.
 * - Consecutive lessons are separated by `betweenLessonsMinutes`.
 * - Recess/Prayer blocks start immediately after the preceding lesson and
 *   the next lesson starts immediately when the recess/prayer ends.
 */
export function generateTimetablePeriods(config: TimetableScheduleConfig): TimetablePeriod[] {
  const assemblyDuration = clampNonNeg(config.assemblyDurationMinutes, 15);
  const lessonCount = Math.max(1, Math.min(12, clampNonNeg(config.lessonCount, 7)));
  const lessonDuration = Math.max(1, clampNonNeg(config.lessonDurationMinutes, 45));
  const betweenLessons = clampNonNeg(config.betweenLessonsMinutes, 5);
  const firstRecessDuration = clampNonNeg(config.firstRecessDurationMinutes, 30);
  const secondRecessDuration = clampNonNeg(config.secondRecessDurationMinutes, 15);

  const periods: TimetablePeriod[] = [];
  let cursor = parseTimeToMinutes(config.assemblyStartTime);

  if (assemblyDuration > 0) {
    const start = formatMinutesToTime(cursor);
    cursor += assemblyDuration;
    periods.push({
      id: 'p-assembly',
      periodNumber: 0,
      nameAr: config.assemblyNameAr || 'لقاء الصباح',
      startTime: start,
      endTime: formatMinutesToTime(cursor),
      type: 'assembly',
    });
  }

  for (let i = 1; i <= lessonCount; i++) {
    const start = formatMinutesToTime(cursor);
    cursor += lessonDuration;
    periods.push({
      id: `p-lesson-${i}`,
      periodNumber: i,
      nameAr: LESSON_ORDINAL_NAMES_AR[i] || `الحصة ${i}`,
      startTime: start,
      endTime: formatMinutesToTime(cursor),
      type: 'lesson',
    });

    const hasFirstRecess = firstRecessDuration > 0 && config.firstRecessAfterLesson === i;
    const hasSecondRecess =
      secondRecessDuration > 0 &&
      config.secondRecessAfterLesson === i &&
      !hasFirstRecess;

    if (hasFirstRecess) {
      const rStart = formatMinutesToTime(cursor);
      cursor += firstRecessDuration;
      periods.push({
        id: 'p-recess-1',
        periodNumber: i,
        nameAr: 'الفرصة الأولى',
        startTime: rStart,
        endTime: formatMinutesToTime(cursor),
        type: 'recess',
      });
    } else if (hasSecondRecess) {
      const rStart = formatMinutesToTime(cursor);
      cursor += secondRecessDuration;
      periods.push({
        id: 'p-recess-2',
        periodNumber: i,
        nameAr: config.secondRecessNameAr || 'الفرصة الثانية',
        startTime: rStart,
        endTime: formatMinutesToTime(cursor),
        type: config.secondRecessType || 'recess',
      });
    } else if (i < lessonCount) {
      cursor += betweenLessons;
    }
  }

  return periods;
}

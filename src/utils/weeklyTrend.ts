import type { AttendanceSession } from '../types/attendance';
import { isSchoolOffDay, type SchoolDaySlot } from './holidayUtils';
import type { OfficialHoliday } from '../types/attendance';

export interface WeeklyTrendDataPoint {
  dayName: string;
  dayNameEn: string;
  date: string;
  attendanceRate: number | null;
  presentCount: number;
  absentCount: number;
  lateCount: number;
  excusedCount: number;
  totalStudents: number;
  isToday?: boolean;
  isPast?: boolean;
  isUpcoming?: boolean;
  isHoliday?: boolean;
  holidayName?: string;
  offDayReason?: string;
  hasData: boolean;
}

export interface WeeklyTrendInput {
  sessions: AttendanceSession[];
  schoolWeekSlots: SchoolDaySlot[];
  selectedClassFilter: string;
  activeWeekendDays: number[];
  activeOfficialHolidays: OfficialHoliday[];
  lang: 'ar' | 'en';
}

export function buildWeeklyTrendData({
  sessions,
  schoolWeekSlots,
  selectedClassFilter,
  activeWeekendDays,
  activeOfficialHolidays,
  lang,
}: WeeklyTrendInput): WeeklyTrendDataPoint[] {
  const validSessions = sessions.filter((s) => {
    if (s.status !== 'submitted') return false;
    if (selectedClassFilter !== 'all' && s.className !== selectedClassFilter) return false;
    // Do not count sessions recorded on configured weekends
    const check = isSchoolOffDay(s.date, activeWeekendDays, activeOfficialHolidays);
    if (check.type === 'weekend') return false;
    return true;
  });

  // Map sessions by date
  const dateMap: Record<
    string,
    { presentCount: number; absentCount: number; lateCount: number; excusedCount: number; totalStudents: number }
  > = {};

  validSessions.forEach((s) => {
    if (!dateMap[s.date]) {
      dateMap[s.date] = { presentCount: 0, absentCount: 0, lateCount: 0, excusedCount: 0, totalStudents: 0 };
    }
    dateMap[s.date].presentCount += s.presentCount;
    dateMap[s.date].absentCount += s.absentCount;
    dateMap[s.date].lateCount += s.lateCount;
    dateMap[s.date].excusedCount += s.excusedCount || 0;
    dateMap[s.date].totalStudents += s.totalStudents;
  });

  const todayStr = new Date().toISOString().split('T')[0];

  return schoolWeekSlots.map((slot) => {
    const item = dateMap[slot.date];
    const hasData = !!item && item.totalStudents > 0;
    const rate = hasData ? parseFloat(((item.presentCount / item.totalStudents) * 100).toFixed(1)) : null;

    return {
      dayName: lang === 'ar' ? slot.dayNameAr : slot.dayNameEn,
      dayNameEn: slot.dayNameEn,
      date: slot.date,
      attendanceRate: rate,
      presentCount: item?.presentCount || 0,
      absentCount: item?.absentCount || 0,
      lateCount: item?.lateCount || 0,
      excusedCount: item?.excusedCount || 0,
      totalStudents: item?.totalStudents || 0,
      isToday: slot.date === todayStr,
      isPast: slot.date < todayStr,
      isUpcoming: slot.date > todayStr,
      isHoliday: slot.isHoliday,
      holidayName: slot.holidayName,
      offDayReason: slot.offDayReason,
      hasData,
    };
  });
}

export interface WeeklyTrendSummary {
  recordedDays: WeeklyTrendDataPoint[];
  weeklyAverage: string;
  highestDay: WeeklyTrendDataPoint | null;
  lowestDay: WeeklyTrendDataPoint | null;
  rateDiff: number;
  minRate: number;
  yAxisMin: number;
}

export function summarizeWeeklyTrend(weeklyData: WeeklyTrendDataPoint[]): WeeklyTrendSummary {
  // Days with real recorded data
  const recordedDays = weeklyData.filter((d) => d.attendanceRate !== null);

  const weeklyAverage =
    recordedDays.length > 0
      ? (recordedDays.reduce((acc, d) => acc + (d.attendanceRate || 0), 0) / recordedDays.length).toFixed(1)
      : '0.0';

  const highestDay =
    recordedDays.length > 0
      ? [...recordedDays].sort((a, b) => (b.attendanceRate || 0) - (a.attendanceRate || 0))[0]
      : null;

  const lowestDay =
    recordedDays.length > 0
      ? [...recordedDays].sort((a, b) => (a.attendanceRate || 0) - (b.attendanceRate || 0))[0]
      : null;

  // Rate difference between the last two recorded school days
  const rateDiff =
    recordedDays.length >= 2
      ? parseFloat(
          (
            (recordedDays[recordedDays.length - 1].attendanceRate || 0) -
            (recordedDays[recordedDays.length - 2].attendanceRate || 0)
          ).toFixed(1)
        )
      : 0;

  // Dynamic Y-axis min
  const minRate =
    recordedDays.length > 0 ? Math.min(...recordedDays.map((d) => d.attendanceRate || 100)) : 80;
  const yAxisMin = Math.max(0, Math.floor((minRate - 10) / 10) * 10);

  return { recordedDays, weeklyAverage, highestDay, lowestDay, rateDiff, minRate, yAxisMin };
}

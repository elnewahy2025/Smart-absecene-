import { describe, expect, it } from 'vitest';
import type { AttendanceSession } from '../types/attendance';
import type { SchoolDaySlot } from './holidayUtils';
import { buildWeeklyTrendData, summarizeWeeklyTrend, type WeeklyTrendDataPoint } from './weeklyTrend';

const session = (overrides: Partial<AttendanceSession> = {}): AttendanceSession =>
  ({
    id: 'sess-1',
    tenantId: 'school-1',
    date: '2020-01-05',
    className: '10/A',
    status: 'submitted',
    presentCount: 18,
    absentCount: 2,
    lateCount: 1,
    excusedCount: 0,
    totalStudents: 20,
    ...overrides,
  }) as AttendanceSession;

const slot = (date: string, overrides: Partial<SchoolDaySlot> = {}): SchoolDaySlot => ({
  date,
  dayOfWeek: new Date(date).getDay(),
  dayNameAr: 'الأحد',
  dayNameEn: 'Sunday',
  isWeekend: false,
  isHoliday: false,
  isOffDay: false,
  isToday: false,
  isPastOrToday: true,
  ...overrides,
});

const baseInput = (overrides: Partial<Parameters<typeof buildWeeklyTrendData>[0]> = {}) => ({
  sessions: [] as AttendanceSession[],
  schoolWeekSlots: [slot('2020-01-05'), slot('2020-01-06')],
  selectedClassFilter: 'all',
  activeWeekendDays: [5, 6],
  activeOfficialHolidays: [],
  lang: 'ar' as const,
  ...overrides,
});

describe('buildWeeklyTrendData', () => {
  it('aggregates submitted sessions per date and rounds the rate to one decimal', () => {
    const data = buildWeeklyTrendData(
      baseInput({
        sessions: [
          session({ presentCount: 7, totalStudents: 8, absentCount: 1 }),
          session({ id: 'sess-2', presentCount: 1, totalStudents: 3, absentCount: 2, lateCount: 0 }),
        ],
      })
    );
    expect(data[0].presentCount).toBe(8);
    expect(data[0].totalStudents).toBe(11);
    expect(data[0].attendanceRate).toBe(72.7);
    expect(data[0].hasData).toBe(true);
    expect(data[1].attendanceRate).toBeNull();
    expect(data[1].hasData).toBe(false);
    expect(data[1].presentCount).toBe(0);
  });

  it('only counts submitted sessions of the selected class', () => {
    const data = buildWeeklyTrendData(
      baseInput({
        sessions: [
          session({ status: 'draft' }),
          session({ id: 's2', className: '11/B' }),
          session({ id: 's3', totalStudents: 10, presentCount: 10 }),
        ],
      })
    );
    expect(data[0].totalStudents).toBe(30);

    const filtered = buildWeeklyTrendData(
      baseInput({
        selectedClassFilter: '11/B',
        sessions: [session(), session({ id: 's2', className: '11/B', totalStudents: 5, presentCount: 4 })],
      })
    );
    expect(filtered[0].totalStudents).toBe(5);
    expect(filtered[0].attendanceRate).toBe(80);
  });

  it('skips sessions recorded on configured weekends', () => {
    const data = buildWeeklyTrendData(
      baseInput({
        schoolWeekSlots: [slot('2020-01-10')],
        sessions: [session({ date: '2020-01-10' })],
      })
    );
    expect(data[0].hasData).toBe(false);
  });

  it('carries holiday metadata and localises the day name', () => {
    const slots = [
      slot('2020-01-05', { isHoliday: true, holidayName: 'عيد', offDayReason: 'عطلة رسمية: عيد' }),
      slot('2020-01-06'),
    ];
    const ar = buildWeeklyTrendData(baseInput({ schoolWeekSlots: slots }));
    const en = buildWeeklyTrendData(baseInput({ schoolWeekSlots: slots, lang: 'en' }));
    expect(ar[0].dayName).toBe('الأحد');
    expect(en[0].dayName).toBe('Sunday');
    expect(ar[0].isHoliday).toBe(true);
    expect(ar[0].holidayName).toBe('عيد');
    expect(ar[0].offDayReason).toBe('عطلة رسمية: عيد');
  });

  it('flags past and upcoming days relative to today', () => {
    const data = buildWeeklyTrendData(
      baseInput({ schoolWeekSlots: [slot('2020-01-05'), slot('2099-01-05')] })
    );
    expect(data[0].isPast).toBe(true);
    expect(data[0].isUpcoming).toBe(false);
    expect(data[1].isPast).toBe(false);
    expect(data[1].isUpcoming).toBe(true);
  });
});

const point = (date: string, rate: number | null): WeeklyTrendDataPoint => ({
  dayName: date,
  dayNameEn: date,
  date,
  attendanceRate: rate,
  presentCount: 0,
  absentCount: 0,
  lateCount: 0,
  excusedCount: 0,
  totalStudents: 0,
  hasData: rate !== null,
});

describe('summarizeWeeklyTrend', () => {
  it('handles a week without recorded days', () => {
    const summary = summarizeWeeklyTrend([point('a', null), point('b', null)]);
    expect(summary.recordedDays).toHaveLength(0);
    expect(summary.weeklyAverage).toBe('0.0');
    expect(summary.highestDay).toBeNull();
    expect(summary.lowestDay).toBeNull();
    expect(summary.rateDiff).toBe(0);
    expect(summary.minRate).toBe(80);
    expect(summary.yAxisMin).toBe(70);
  });

  it('averages recorded days and finds the extremes', () => {
    const summary = summarizeWeeklyTrend([point('a', 90), point('b', null), point('c', 80), point('d', 100)]);
    expect(summary.weeklyAverage).toBe('90.0');
    expect(summary.highestDay?.date).toBe('d');
    expect(summary.lowestDay?.date).toBe('c');
    expect(summary.recordedDays).toHaveLength(3);
  });

  it('compares the two most recent recorded days in chronological order', () => {
    const summary = summarizeWeeklyTrend([point('a', 95), point('b', 80), point('c', 88)]);
    expect(summary.rateDiff).toBe(8);
    expect(summarizeWeeklyTrend([point('a', 88)]).rateDiff).toBe(0);
    expect(summarizeWeeklyTrend([point('a', 88), point('b', 88)]).rateDiff).toBe(0);
  });

  it('derives a padded y-axis minimum clamped at zero', () => {
    expect(summarizeWeeklyTrend([point('a', 92)]).yAxisMin).toBe(80);
    expect(summarizeWeeklyTrend([point('a', 85)]).yAxisMin).toBe(70);
    expect(summarizeWeeklyTrend([point('a', 5)]).yAxisMin).toBe(0);
    expect(summarizeWeeklyTrend([point('a', 100)]).yAxisMin).toBe(90);
  });
});

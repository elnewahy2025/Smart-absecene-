import { describe, it, expect } from 'vitest';
import {
  DEFAULT_TIMETABLE_CONFIG,
  TIMETABLE_PRESETS,
  generateTimetablePeriods,
  getPeriodDurationMinutes,
} from './timetableCalculator';

describe('timetableCalculator', () => {
  it('generates the default 45-minute schedule starting with assembly 07:30-07:45', () => {
    const periods = generateTimetablePeriods(DEFAULT_TIMETABLE_CONFIG);
    const assembly = periods.find((p) => p.type === 'assembly');
    const lessons = periods.filter((p) => p.type === 'lesson');
    const recesses = periods.filter((p) => p.type === 'recess');

    expect(assembly?.startTime).toBe('07:30');
    expect(assembly?.endTime).toBe('07:45');

    // Lesson 1 starts immediately at 07:45 for 45 min
    expect(lessons[0].startTime).toBe('07:45');
    expect(lessons[0].endTime).toBe('08:30');

    // Lesson 2 starts after a 5-minute break at 08:35
    expect(lessons[1].startTime).toBe('08:35');
    expect(lessons[1].endTime).toBe('09:20');

    // First recess (30m) and second recess (15m)
    expect(recesses).toHaveLength(2);
    expect(getPeriodDurationMinutes(recesses[0].startTime, recesses[0].endTime)).toBe(30);
    expect(getPeriodDurationMinutes(recesses[1].startTime, recesses[1].endTime)).toBe(15);
    expect(lessons).toHaveLength(7);
  });

  it('recalculates all lessons when lessonDurationMinutes changes', () => {
    const periods = generateTimetablePeriods({
      ...DEFAULT_TIMETABLE_CONFIG,
      lessonDurationMinutes: 40,
    });
    const lessons = periods.filter((p) => p.type === 'lesson');
    expect(lessons[0]).toMatchObject({ startTime: '07:45', endTime: '08:25' });
    expect(lessons[1]).toMatchObject({ startTime: '08:30', endTime: '09:10' });
    expect(lessons[2]).toMatchObject({ startTime: '09:15', endTime: '09:55' });
  });

  it('matches Kuwait MOE Primary schedule (07:15 - 13:25)', () => {
    const preset = TIMETABLE_PRESETS.find((p) => p.id === 'kuwait-primary')!;
    const periods = generateTimetablePeriods(preset.config!);
    expect(periods[0]).toMatchObject({ startTime: '07:15', endTime: '07:30' });
    expect(periods[periods.length - 1]).toMatchObject({ startTime: '12:45', endTime: '13:25' });
  });

  it('matches Kuwait MOE Intermediate schedule (07:30 - 13:40)', () => {
    const preset = TIMETABLE_PRESETS.find((p) => p.id === 'kuwait-intermediate')!;
    const periods = generateTimetablePeriods(preset.config!);
    expect(periods[0]).toMatchObject({ startTime: '07:30', endTime: '07:40' });
    expect(periods[periods.length - 1]).toMatchObject({ startTime: '12:55', endTime: '13:40' });
  });

  it('matches Kuwait MOE Secondary Tracks schedule (07:30 - 14:15)', () => {
    const preset = TIMETABLE_PRESETS.find((p) => p.id === 'kuwait-secondary-tracks')!;
    const periods = generateTimetablePeriods(preset.config!);
    expect(periods[0]).toMatchObject({ startTime: '07:30', endTime: '07:40' });
    expect(periods[periods.length - 1]).toMatchObject({ startTime: '13:30', endTime: '14:15' });
  });

  it('matches Kuwait MOE Secondary & Gifted schedule (07:45 - 13:55)', () => {
    const preset = TIMETABLE_PRESETS.find((p) => p.id === 'kuwait-secondary')!;
    const periods = generateTimetablePeriods(preset.config!);
    expect(periods[0]).toMatchObject({ startTime: '07:45', endTime: '07:55' });
    expect(periods[periods.length - 1]).toMatchObject({ startTime: '13:10', endTime: '13:55' });
  });
});

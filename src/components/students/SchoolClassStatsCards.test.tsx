// @vitest-environment jsdom
import React from 'react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { cleanup, render, screen, within } from '@testing-library/react';
import type { SchoolClassSummary, SchoolEnrollmentStats } from '../../types/attendance';
import { SchoolClassStatsCards } from './SchoolClassStatsCards';

afterEach(cleanup);

const enrollmentStats = (
  overrides: Partial<SchoolEnrollmentStats> = {}
): SchoolEnrollmentStats => ({
  totalStudentsCount: 1,
  activeStudentsCount: 1,
  transferredStudentsCount: 0,
  totalClassesCount: 1,
  averageClassSize: 1,
  schoolAttendanceRate: null,
  ...overrides,
});

const classSummary = (
  overrides: Partial<SchoolClassSummary> = {}
): SchoolClassSummary => ({
  className: '10/أ',
  grade: 'الصف العاشر',
  classId: 'c1',
  totalStudents: 1,
  activeStudents: 1,
  transferredStudents: 0,
  attendanceRate: null,
  assignedTeachersCount: 0,
  ...overrides,
});

const setup = (
  overrides: Partial<React.ComponentProps<typeof SchoolClassStatsCards>> = {}
) => {
  render(
    <SchoolClassStatsCards
      enrollmentStats={enrollmentStats()}
      classesStats={[classSummary()]}
      selectedClass="all"
      onSelectClass={vi.fn()}
      statusFilter="active"
      onStatusFilterChange={vi.fn()}
      onSelectGradeFilter={vi.fn()}
      lang="en"
      {...overrides}
    />
  );
};

describe('SchoolClassStatsCards', () => {
  it('shows an unknown school rate as a neutral dash, never as a number', () => {
    setup();
    const card = screen.getByText('Overall Attendance').closest('div.cursor-pointer') as HTMLElement;
    expect(within(card).getByText('—').className).toContain('text-slate-400');
    expect(within(card).getByText('No data')).toBeTruthy();
    expect(within(card).queryByText(/%null|%0|%100/)).toBeNull();
  });

  it('excludes unknown-rate classes from the weighted grade average', () => {
    setup({
      classesStats: [
        classSummary({ className: '10/أ', attendanceRate: 80, activeStudents: 1 }),
        classSummary({ className: '10/ب', attendanceRate: null, activeStudents: 9 }),
      ],
    });
    const gradeCard = screen
      .getByText('الصف العاشر')
      .closest('div.cursor-pointer') as HTMLElement;
    expect(within(gradeCard).getByText('%80')).toBeTruthy();
    expect(screen.queryByText(/NaN/)).toBeNull();
  });

  it('labels a class with students but no known rate as No data, not Empty', () => {
    setup();
    const card = screen.getByTitle('Click to filter students in 10/أ');
    expect(within(card).getByText('—').className).toContain('text-slate-400');
    expect(within(card).getByText('No data')).toBeTruthy();
    expect(within(card).queryByText('Empty')).toBeNull();
  });
});

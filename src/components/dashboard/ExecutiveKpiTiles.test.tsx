// @vitest-environment jsdom
import React from 'react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { cleanup, render, screen } from '@testing-library/react';
import type { useExecutiveDashboardAnalytics } from '../../hooks/useExecutiveDashboardAnalytics';
import { ExecutiveKpiTiles } from './ExecutiveKpiTiles';

afterEach(cleanup);

type TodayMetrics = ReturnType<typeof useExecutiveDashboardAnalytics>['todayMetrics'];

const emptyMetrics: TodayMetrics = {
  presentCount: 0,
  attendedCount: 0,
  recordedCount: 0,
  absentCount: 0,
  excusedCount: 0,
  excusedLeaveCount: null,
  underReviewCount: 0,
  unexcusedCount: 0,
  lateCount: 0,
  attendanceRate: null,
  hasSubmittedData: false,
};

const setup = (
  dataReady: boolean,
  todayMetrics: TodayMetrics = emptyMetrics,
  activeStudentsCount = 0
) =>
  render(
    <ExecutiveKpiTiles
      isAr={false}
      onNavigateTab={vi.fn()}
      todayMetrics={todayMetrics}
      activeStudentsCount={activeStudentsCount}
      recordedClassesCount={0}
      totalClassesCount={0}
      unrecordedClassesCount={0}
      dataReady={dataReady}
    />
  );

describe('ExecutiveKpiTiles empty-data rendering', () => {
  it('never flashes 100% while Firestore snapshots are still loading', () => {
    setup(false);
    expect(screen.getAllByText('—').length).toBeGreaterThan(0);
    expect(screen.getByText(/Loading/)).toBeTruthy();
    expect(screen.queryByText('100%')).toBeNull();
  });

  it('renders — (not 0% or 100%) once loaded with no sessions and no students', () => {
    setup(true);
    expect(screen.getAllByText('—').length).toBeGreaterThan(0);
    expect(screen.getByText(/No data/)).toBeTruthy();
    expect(screen.queryByText('100%')).toBeNull();
    expect(screen.queryByText('0%')).toBeNull();
  });
});

describe('ExecutiveKpiTiles submitted-data semantics', () => {
  const submitted: TodayMetrics = {
    presentCount: 1,
    attendedCount: 3,
    recordedCount: 7,
    absentCount: 4,
    excusedCount: 1,
    excusedLeaveCount: 1,
    underReviewCount: 1,
    unexcusedCount: 2,
    lateCount: 1,
    attendanceRate: 43,
    hasSubmittedData: true,
  };

  it('labels the numerator "attended of recorded", not "present of enrolled"', () => {
    setup(true, submitted, 7);
    expect(screen.getByText(/attended 3 of 7 recorded/)).toBeTruthy();
    expect(screen.getByText('43%')).toBeTruthy();
  });

  it('reconciles the total absentees with the three status chips', () => {
    setup(true, submitted, 7);
    expect(screen.getByText('4')).toBeTruthy(); // total absentees
    expect(screen.getByText('2')).toBeTruthy(); // unexcused
    // excused + under review + early dismissals each render a 1
    expect(screen.getAllByText('1').length).toBeGreaterThanOrEqual(3);
  });
});

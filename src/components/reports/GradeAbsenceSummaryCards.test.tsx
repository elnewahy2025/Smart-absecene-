// @vitest-environment jsdom
import React from 'react';
import { afterEach, describe, expect, it } from 'vitest';
import { cleanup, render, screen } from '@testing-library/react';
import type { GradeAnalysisItem } from '../../utils/gradeAbsencePatterns';
import { GradeAbsenceSummaryCards } from './GradeAbsenceSummaryCards';

afterEach(cleanup);

const grade = (overrides: Partial<GradeAnalysisItem> = {}): GradeAnalysisItem => ({
  gradeName: 'الصف الأول',
  shortGrade: '1',
  studentCount: 40,
  totalAbsenceDays: 20,
  avgAbsencesPerStudent: 0.5,
  averageAttendanceRate: 97.5,
  totalLates: 3,
  excusedCount: 10,
  unexcusedCount: 10,
  pendingCount: 0,
  documentationRate: 50,
  normalCount: 35,
  tier1AlertCount: 3,
  tier2WarningCount: 1,
  tier3CriticalCount: 1,
  chronicCount: 2,
  chronicRate: 5,
  riskLevel: 'low',
  classesCount: 2,
  ...overrides,
});

const setup = (overrides: Partial<React.ComponentProps<typeof GradeAbsenceSummaryCards>> = {}) =>
  render(
    <GradeAbsenceSummaryCards
      lang="ar"
      bestGrade={grade()}
      mostVulnerableGrade={grade({ gradeName: 'الصف الثالث', chronicCount: 7, chronicRate: 17.5 })}
      attendanceGap={4.2}
      overallDocRate={63}
      {...overrides}
    />
  );

describe('GradeAbsenceSummaryCards', () => {
  it('shows the most disciplined grade and its attendance rate', () => {
    setup();
    expect(screen.getByText('المرحلة الأكثر انضباطاً')).toBeTruthy();
    expect(screen.getByText('الصف الأول')).toBeTruthy();
    expect(screen.getByText('97.5% حضور عام')).toBeTruthy();
  });

  it('shows the vulnerable grade with chronic count and rate', () => {
    setup();
    expect(screen.getByText('الأعلى في مؤشر الخطر')).toBeTruthy();
    expect(screen.getByText('الصف الثالث')).toBeTruthy();
    expect(screen.getByText('7 طلاب (17.5% خطورة)')).toBeTruthy();
  });

  it('shows the documentation rate', () => {
    setup();
    expect(screen.getByText('63% أعذار موثقة')).toBeTruthy();
    expect(screen.getByText('تحت التدقيق الإداري')).toBeTruthy();
  });

  it('describes a small gap as balanced', () => {
    setup({ attendanceGap: 4.2 });
    expect(screen.getByText('4.2% فارق الانضباط')).toBeTruthy();
    expect(screen.getByText('تقارب إيجابي متوازن')).toBeTruthy();
  });

  it('flags a wide gap at 5 or above', () => {
    setup({ attendanceGap: 5.1 });
    expect(screen.getByText('5.1% فارق الانضباط')).toBeTruthy();
    expect(screen.getByText('تفاوت ملحوظ يستدعي تدخلاً')).toBeTruthy();
  });

  it('falls back to dashes when there are no grades', () => {
    setup({ bestGrade: null, mostVulnerableGrade: null });
    expect(screen.getAllByText('—')).toHaveLength(2);
    expect(screen.queryByText(/حضور عام/)).toBeNull();
    expect(screen.queryByText(/خطورة/)).toBeNull();
  });

  it('renders English copy when lang is en', () => {
    setup({ lang: 'en' });
    expect(screen.getByText('Most Disciplined Grade')).toBeTruthy();
    expect(screen.getByText('Highest Vulnerability')).toBeTruthy();
    expect(screen.getByText('Excuse Doc. Compliance')).toBeTruthy();
    expect(screen.getByText('63% Documented')).toBeTruthy();
    expect(screen.getByText('Balanced consistency')).toBeTruthy();
    expect(screen.getByText('Grade Disparity Spread')).toBeTruthy();
  });
});

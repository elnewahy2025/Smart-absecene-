// @vitest-environment jsdom
import React from 'react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import type { GradeAnalysisItem } from '../../utils/gradeAbsencePatterns';
import { GradeComparisonMatrix } from './GradeComparisonMatrix';

afterEach(cleanup);

const grade = (overrides: Partial<GradeAnalysisItem> = {}): GradeAnalysisItem => ({
  gradeName: 'الصف الأول',
  shortGrade: '1',
  studentCount: 40,
  totalAbsenceDays: 10,
  avgAbsencesPerStudent: 1.2,
  averageAttendanceRate: 96,
  totalLates: 2,
  excusedCount: 8,
  unexcusedCount: 2,
  pendingCount: 0,
  documentationRate: 80,
  normalCount: 38,
  tier1AlertCount: 2,
  tier2WarningCount: 0,
  tier3CriticalCount: 0,
  chronicCount: 0,
  chronicRate: 0,
  riskLevel: 'low',
  classesCount: 2,
  ...overrides,
});

const grades: GradeAnalysisItem[] = [
  grade(),
  grade({
    gradeName: 'الصف الثاني',
    studentCount: 30,
    totalAbsenceDays: 100,
    avgAbsencesPerStudent: 3,
    averageAttendanceRate: 91,
    excusedCount: 25,
    unexcusedCount: 75,
    chronicCount: 4,
    tier3CriticalCount: 1,
    riskLevel: 'moderate',
    classesCount: 3,
  }),
  grade({
    gradeName: 'الصف الثالث',
    studentCount: 20,
    totalAbsenceDays: 0,
    avgAbsencesPerStudent: 6,
    averageAttendanceRate: 80,
    excusedCount: 0,
    unexcusedCount: 0,
    chronicCount: 6,
    tier3CriticalCount: 3,
    riskLevel: 'high',
    classesCount: 1,
  }),
];

const setup = (overrides: Partial<React.ComponentProps<typeof GradeComparisonMatrix>> = {}) => {
  const onFilterByGrade = vi.fn();
  const setSelectedGradeFocus = vi.fn();
  render(
    <GradeComparisonMatrix
      lang="ar"
      gradeData={grades}
      selectedGradeFocus={null}
      setSelectedGradeFocus={setSelectedGradeFocus}
      onFilterByGrade={onFilterByGrade}
      {...overrides}
    />
  );
  return { onFilterByGrade, setSelectedGradeFocus };
};

describe('GradeComparisonMatrix', () => {
  it('renders the header count and column titles', () => {
    setup();
    expect(screen.getByText('مصفوفة التحليل الإحصائي التفصيلي حسب المرحلة')).toBeTruthy();
    expect(screen.getByText('3 مراحل دراسية مقيدة')).toBeTruthy();
    expect(screen.getByText('المرحلة الدراسية')).toBeTruthy();
    expect(screen.getByText('نمط التبرير (مبرر / غير مبرر)')).toBeTruthy();
    expect(screen.getByText('الحالة الإجرائية')).toBeTruthy();
  });

  it('renders one row per grade with counts and totals', () => {
    setup();
    expect(screen.getByText('الصف الأول')).toBeTruthy();
    expect(screen.getByText('الصف الثاني')).toBeTruthy();
    expect(screen.getByText('الصف الثالث')).toBeTruthy();
    expect(screen.getByText('2 فصول')).toBeTruthy();
    expect(screen.getByText('3 فصول')).toBeTruthy();
    expect(screen.getByText('10 يوم')).toBeTruthy();
    expect(screen.getByText('100 يوم')).toBeTruthy();
  });

  it('colour-codes the average absences badge per tier', () => {
    setup();
    const low = screen.getByText('1.2 يوم');
    const moderate = screen.getByText('3 يوم');
    const high = screen.getByText('6 يوم');
    expect(low.className).toContain('bg-emerald-50');
    expect(moderate.className).toContain('bg-amber-50');
    expect(high.className).toContain('bg-rose-50');
  });

  it('splits the justification bar by excused percentage', () => {
    setup();
    expect(screen.getByText('8 مبرر')).toBeTruthy();
    expect(screen.getByText('2 غير مبرر')).toBeTruthy();
    const excusedBar = screen.getByTitle('مبرر: 80%');
    const unexcusedBar = screen.getByTitle('غير مبرر: 20%');
    expect(excusedBar.style.width).toBe('80%');
    expect(unexcusedBar.style.width).toBe('20%');
  });

  it('treats a grade with no absence days as fully justified', () => {
    setup();
    expect(screen.getByTitle('مبرر: 100%')).toBeTruthy();
    expect(screen.getByTitle('غير مبرر: 0%')).toBeTruthy();
  });

  it('shows chronic counts, critical badges and attendance labels', () => {
    setup();
    expect(screen.getByText('4 طالب')).toBeTruthy();
    expect(screen.getByText('(1 حرج 8+)')).toBeTruthy();
    expect(screen.getByText('96%')).toBeTruthy();
    expect(screen.getByText('منضبط ممتاز')).toBeTruthy();
    expect(screen.getAllByText('أقل من المستهدف')).toHaveLength(2);
  });

  it('renders the risk level labels', () => {
    setup();
    expect(screen.getByText('مستقر / متابعة اعتيادية')).toBeTruthy();
    expect(screen.getByText('توجيه خطة وقائية')).toBeTruthy();
    expect(screen.getByText('تدخل وإشعار عاجل')).toBeTruthy();
  });

  it('filters by grade and focuses the row on click', () => {
    const { onFilterByGrade, setSelectedGradeFocus } = setup();
    fireEvent.click(screen.getByText('الصف الثاني'));
    expect(setSelectedGradeFocus).toHaveBeenCalledWith('الصف الثاني');
    expect(onFilterByGrade).toHaveBeenCalledWith('الصف الثاني');
  });

  it('clears the focus when the selected grade is clicked again', () => {
    const { setSelectedGradeFocus } = setup({ selectedGradeFocus: 'الصف الثاني' });
    fireEvent.click(screen.getByText('الصف الثاني'));
    expect(setSelectedGradeFocus).toHaveBeenCalledWith(null);
  });

  it('highlights the selected row', () => {
    setup({ selectedGradeFocus: 'الصف الثاني' });
    const row = screen.getByText('الصف الثاني').closest('tr');
    expect(row?.className).toContain('bg-indigo-50/60');
    expect(row?.className).toContain('font-semibold');
  });

  it('always renders the administrative guidance note', () => {
    setup();
    expect(screen.getByText(/توصية استرشادية لمدير المدرسة والمرشد الطلابي/)).toBeTruthy();
    expect(screen.getByText(/قبل اكتمال نصاب الإنذار الثاني/)).toBeTruthy();
  });

  it('renders English labels when lang is en', () => {
    setup({ lang: 'en' });
    expect(screen.getByText('Grade Level')).toBeTruthy();
    expect(screen.getByText('Students')).toBeTruthy();
    expect(screen.getByText('3 grade levels monitored')).toBeTruthy();
    expect(screen.getByText('Stable')).toBeTruthy();
    expect(screen.getByText('Preventive')).toBeTruthy();
    expect(screen.getByText('Urgent Intervention')).toBeTruthy();
    expect(screen.getByText('Target met')).toBeTruthy();
  });
});

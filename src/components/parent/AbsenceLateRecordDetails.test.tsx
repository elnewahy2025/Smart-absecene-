// @vitest-environment jsdom
import React from 'react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import type { Justification } from '../../types/attendance';
import type { AbsenceLateRecordData } from './parentRecordDetailTypes';
import { AbsenceLateRecordDetails } from './AbsenceLateRecordDetails';

afterEach(cleanup);

const data = (overrides: Partial<AbsenceLateRecordData> = {}): AbsenceLateRecordData => ({
  sessionId: 'sess-1',
  date: '2026-01-05',
  sessionType: 'daily',
  className: '10/A',
  status: 'absent',
  ...overrides,
});

const justification = (overrides: Partial<Justification> = {}): Justification => ({
  id: 'j1',
  tenantId: 'school-1',
  studentId: 's1',
  studentName: 'أحمد علي',
  className: '10/A',
  absenceDate: '2026-01-05',
  reasonType: 'medical',
  guardianExplanation: 'تقرير طبي رسمي',
  status: 'approved',
  submittedAt: '2026-01-06T08:00:00.000Z',
  reviewedBy: 'المدير',
  reviewedAt: '2026-01-07T08:00:00.000Z',
  ...overrides,
});

const renderDetails = (overrides: Partial<React.ComponentProps<typeof AbsenceLateRecordDetails>> = {}) =>
  render(
    <AbsenceLateRecordDetails data={data()} studentId="s1" onClose={vi.fn()} {...overrides} />
  );

describe('AbsenceLateRecordDetails', () => {
  it('renders the session summary and the daily fallback label', () => {
    renderDetails({ data: data({ className: '10/A' }) });
    expect(screen.getByText('2026-01-05')).toBeTruthy();
    expect(screen.getByText('حضور يومي شامل')).toBeTruthy();
    expect(screen.getByText('10/A')).toBeTruthy();
    expect(screen.getByText('غياب غير مبرر')).toBeTruthy();
  });

  it('prefers the subject and the period number when available', () => {
    const { rerender } = renderDetails({ data: data({ subject: 'الرياضيات' }) });
    expect(screen.getByText('الرياضيات')).toBeTruthy();
    rerender(<AbsenceLateRecordDetails data={data({ sessionType: 'period', periodNumber: 2 })} onClose={vi.fn()} />);
    expect(screen.getByText('الحصة 2')).toBeTruthy();
  });

  it('describes late and excused statuses', () => {
    const { rerender } = renderDetails({ data: data({ status: 'late', minutesLate: 12 }) });
    expect(screen.getByText('تأخر (12 دقيقة)')).toBeTruthy();
    rerender(<AbsenceLateRecordDetails data={data({ status: 'late' })} onClose={vi.fn()} />);
    expect(screen.getByText('تأخر (15 دقيقة)')).toBeTruthy();
    rerender(<AbsenceLateRecordDetails data={data({ status: 'excused_absence' })} onClose={vi.fn()} />);
    expect(screen.getByText('غياب بعذر رسمي مقبول')).toBeTruthy();
    rerender(<AbsenceLateRecordDetails data={data({ status: 'present' })} onClose={vi.fn()} />);
    expect(screen.getByText('حاضر')).toBeTruthy();
  });

  it('shows the teacher note only when present', () => {
    const { rerender } = renderDetails({ data: data({ note: 'بدون عذر' }) });
    expect(screen.getByText('ملاحظة المعلم / الراصد:')).toBeTruthy();
    expect(screen.getByText('بدون عذر')).toBeTruthy();
    rerender(<AbsenceLateRecordDetails data={data()} onClose={vi.fn()} />);
    expect(screen.queryByText('ملاحظة المعلم / الراصد:')).toBeNull();
  });

  it('shows the linked justification summary with its status', () => {
    const { rerender } = renderDetails({ data: data({ justification: justification() }) });
    expect(screen.getByText('تم تقديم عذر لهذا الغياب')).toBeTruthy();
    expect(screen.getByText('معتمد ✅')).toBeTruthy();
    expect(screen.getByText('تقرير طبي رسمي')).toBeTruthy();

    rerender(
      <AbsenceLateRecordDetails data={data({ justification: justification({ status: 'rejected' }) })} onClose={vi.fn()} />
    );
    expect(screen.getByText('مرفوض ❌')).toBeTruthy();

    rerender(
      <AbsenceLateRecordDetails data={data({ justification: justification({ status: 'pending' }) })} onClose={vi.fn()} />
    );
    expect(screen.getByText('قيد المراجعة ⏳')).toBeTruthy();
  });

  it('offers the excuse CTA for unexcused absences and closes before navigating', () => {
    const onClose = vi.fn();
    const onOpenExcuseForm = vi.fn();
    renderDetails({ onClose, onOpenExcuseForm });
    expect(screen.getByText('لم يتم تقديم عذر طبي بعد لهذا الغياب')).toBeTruthy();
    fireEvent.click(screen.getByText('تقديم عذر الآن'));
    expect(onClose).toHaveBeenCalledTimes(1);
    expect(onOpenExcuseForm).toHaveBeenCalledWith('s1', '2026-01-05');
    expect(onClose.mock.invocationCallOrder[0]).toBeLessThan(onOpenExcuseForm.mock.invocationCallOrder[0]);
  });

  it('hides the excuse CTA without a handler, for excused statuses, or when a justification exists', () => {
    const { rerender } = renderDetails();
    expect(screen.queryByText('تقديم عذر الآن')).toBeNull();

    rerender(
      <AbsenceLateRecordDetails
        data={data({ status: 'excused_absence' })}
        onClose={vi.fn()}
        onOpenExcuseForm={vi.fn()}
      />
    );
    expect(screen.queryByText('تقديم عذر الآن')).toBeNull();

    rerender(
      <AbsenceLateRecordDetails data={data({ justification: justification() })} onClose={vi.fn()} onOpenExcuseForm={vi.fn()} />
    );
    expect(screen.queryByText('تقديم عذر الآن')).toBeNull();
  });
});

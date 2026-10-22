// @vitest-environment jsdom
import React from 'react';
import { afterEach, describe, expect, it } from 'vitest';
import { cleanup, render, screen } from '@testing-library/react';
import type { Justification } from '../../types/attendance';
import { JustificationRecordDetails } from './JustificationRecordDetails';

afterEach(cleanup);

const justification = (overrides: Partial<Justification> = {}): Justification => ({
  id: 'j1',
  tenantId: 'school-1',
  studentId: 's1',
  studentName: 'أحمد علي',
  className: '10/A',
  absenceDate: '2026-01-05',
  reasonType: 'medical',
  guardianExplanation: 'تقرير طبي رسمي',
  attachmentName: 'report.pdf',
  status: 'pending',
  submittedAt: '2026-01-06T08:00:00.000Z',
  ...overrides,
});

const renderDetails = (overrides: Partial<Justification> = {}) =>
  render(<JustificationRecordDetails data={justification(overrides)} />);

const formatDate = (iso: string) => new Date(iso).toLocaleDateString('ar-SA');

describe('JustificationRecordDetails', () => {
  it('renders the submission metadata', () => {
    renderDetails();
    expect(screen.getByText('2026-01-05')).toBeTruthy();
    expect(screen.getByText(formatDate('2026-01-06T08:00:00.000Z'))).toBeTruthy();
    expect(screen.getByText('report.pdf')).toBeTruthy();
    expect(screen.getByText('تقرير طبي رسمي')).toBeTruthy();
  });

  it('falls back when no attachment is stored', () => {
    renderDetails({ attachmentName: undefined });
    expect(screen.getByText('لا يوجد ملف مرفق')).toBeTruthy();
  });

  it('maps every reason type to its label', () => {
    const { rerender } = renderDetails();
    expect(screen.getByText('تقرير / إجازة طبية مرضية')).toBeTruthy();
    rerender(<JustificationRecordDetails data={justification({ reasonType: 'family' })} />);
    expect(screen.getByText('ظرف أسري طارئ')).toBeTruthy();
    rerender(<JustificationRecordDetails data={justification({ reasonType: 'travel' })} />);
    expect(screen.getByText('سفر واضطرار')).toBeTruthy();
    rerender(<JustificationRecordDetails data={justification({ reasonType: 'other' })} />);
    expect(screen.getByText('عذر آخر')).toBeTruthy();
  });

  it('maps every review status', () => {
    const { rerender } = renderDetails();
    expect(screen.getByText('قيد المراجعة والتدقيق ⏳')).toBeTruthy();
    rerender(<JustificationRecordDetails data={justification({ status: 'approved' })} />);
    expect(screen.getByText('معتمد ومقبول رسمياً ✅')).toBeTruthy();
    rerender(<JustificationRecordDetails data={justification({ status: 'rejected' })} />);
    expect(screen.getByText('عذر مرفوض ❌')).toBeTruthy();
  });

  it('renders the AI audit when present', () => {
    renderDetails({
      aiAnalysis: {
        issuerName: 'مستشفى الملك فهد',
        physicianName: 'د. سعيد',
        reasonOrDiagnosis: 'إنفلونزا',
        integrityScore: 88,
      },
    });
    expect(screen.getByText('نتيجة تدقيق الذكاء الاصطناعي (Gemini Medical Audit)')).toBeTruthy();
    expect(screen.getByText('الموثوقية: 88%')).toBeTruthy();
    expect(screen.getByText('مستشفى الملك فهد')).toBeTruthy();
    expect(screen.getByText('د. سعيد')).toBeTruthy();
    expect(screen.getByText('إنفلونزا')).toBeTruthy();
  });

  it('omits unknown AI fields and the whole block without analysis', () => {
    const { rerender } = renderDetails({ aiAnalysis: { integrityScore: 70 } });
    expect(screen.queryByText('الجهة المصدرة:')).toBeNull();
    expect(screen.queryByText('الطبيب الممارس:')).toBeNull();
    expect(screen.queryByText('التشخيص / الراحة:')).toBeNull();

    rerender(<JustificationRecordDetails data={justification()} />);
    expect(screen.queryByText('نتيجة تدقيق الذكاء الاصطناعي (Gemini Medical Audit)')).toBeNull();
  });

  it('renders the reviewer block with notes and date', () => {
    renderDetails({
      status: 'approved',
      reviewedBy: 'المدير',
      reviewedAt: '2026-01-07T08:00:00.000Z',
      reviewerNotes: 'تم التحقق من التقرير',
    });
    expect(screen.getByText('المعتمد: المدير')).toBeTruthy();
    expect(screen.getByText(formatDate('2026-01-07T08:00:00.000Z'))).toBeTruthy();
    expect(screen.getByText('تم التحقق من التقرير')).toBeTruthy();
  });

  it('omits the reviewer block when unreviewed', () => {
    renderDetails();
    expect(screen.queryByText(/^المعتمد:/)).toBeNull();
  });
});

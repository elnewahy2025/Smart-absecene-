// @vitest-environment jsdom
import React from 'react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import type { Student } from '../../types/attendance';
import { QrScanFeedback } from './QrScanFeedback';

afterEach(cleanup);

const student = (overrides: Partial<Student> = {}): Student => ({
  id: 's1',
  tenantId: 'school-1',
  studentNumber: '1001',
  nationalId: '1234567890',
  fullName: 'أحمد علي',
  grade: 'الأول',
  className: '1/أ',
  classId: 'c1',
  guardianName: 'علي',
  guardianPhone: '0555000000',
  guardianRelationship: 'أب',
  totalAbsences: 0,
  totalLates: 0,
  attendanceRate: 100,
  ...overrides,
});

const setup = (overrides: Partial<React.ComponentProps<typeof QrScanFeedback>> = {}) => {
  const onDismissDuplicate = vi.fn();
  const onDismissSessionBanner = vi.fn();
  const view = render(
    <QrScanFeedback
      lang="ar"
      duplicateWarning={null}
      sessionBanner={null}
      lastScannedStudent={null}
      scannedTimestamps={{}}
      onDismissDuplicate={onDismissDuplicate}
      onDismissSessionBanner={onDismissSessionBanner}
      {...overrides}
    />
  );
  return { view, onDismissDuplicate, onDismissSessionBanner };
};

describe('QrScanFeedback', () => {
  it('renders nothing when there is no feedback', () => {
    const { view } = setup();
    expect(view.container.textContent).toBe('');
  });

  it('shows the duplicate warning with student name and time', () => {
    setup({ duplicateWarning: { student: student(), time: '08:15:30' } });
    expect(screen.getByText('⚠️ تنبيه تكرار: تم مسح رمز الطالب مسبقاً!')).toBeTruthy();
    expect(screen.getByText('أحمد علي')).toBeTruthy();
    expect(screen.getByText('08:15:30')).toBeTruthy();
    expect(screen.getByText(/تم منع التكرار للحفاظ على دقة السجل/)).toBeTruthy();
  });

  it('dismisses the duplicate warning', () => {
    const { onDismissDuplicate } = setup({ duplicateWarning: { student: student(), time: '08:15' } });
    const dismissButtons = screen.getAllByRole('button');
    fireEvent.click(dismissButtons[dismissButtons.length - 1]);
    expect(onDismissDuplicate).toHaveBeenCalledTimes(1);
  });

  it('renders the duplicate warning in English', () => {
    setup({ lang: 'en', duplicateWarning: { student: student(), time: '08:15' } });
    expect(screen.getByText('⚠️ Duplicate Scan: Student Already Checked In!')).toBeTruthy();
    expect(screen.getByText('Student أحمد علي is already checked in at 08:15. Duplicate scan prevented.')).toBeTruthy();
  });

  it('shows and dismisses the session banner', () => {
    const { onDismissSessionBanner } = setup({ sessionBanner: 'تم تصفير الكشف بنجاح' });
    expect(screen.getByText('تم تصفير الكشف بنجاح')).toBeTruthy();
    fireEvent.click(screen.getByRole('button'));
    expect(onDismissSessionBanner).toHaveBeenCalledTimes(1);
  });

  it('shows the last scanned student with number, class, timestamp and badge', () => {
    setup({
      lastScannedStudent: student(),
      scannedTimestamps: { s1: '08:20:05' },
    });
    expect(screen.getByText('تم تسجيل الحضور: أحمد علي')).toBeTruthy();
    expect(screen.getByText('رقم: 1001 · الفصل: 1/أ · وقت الحضور: 08:20:05')).toBeTruthy();
    expect(screen.getByText('حاضر ✔')).toBeTruthy();
  });

  it('omits the timestamp when the student has none', () => {
    setup({ lastScannedStudent: student() });
    expect(screen.getByText('رقم: 1001 · الفصل: 1/أ')).toBeTruthy();
  });

  it('hides the last scan banner while a duplicate warning is shown', () => {
    setup({ lastScannedStudent: student(), duplicateWarning: { student: student(), time: '08:00' } });
    expect(screen.queryByText(/تم تسجيل الحضور/)).toBeNull();
  });
});

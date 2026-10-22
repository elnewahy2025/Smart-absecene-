// @vitest-environment jsdom
import React from 'react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import type { AttendanceSession, Student } from '../../types/attendance';
import { QrQuickRosterPanel } from './QrQuickRosterPanel';

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

const session = (records: AttendanceSession['records'] = []): AttendanceSession =>
  ({ id: 'sess-1', className: '1/أ', classId: 'c1', subject: 'رياضيات', records } as AttendanceSession);

const record = (studentId: string, status: 'present' | 'late' | 'absent') =>
  ({ id: `r-${studentId}`, sessionId: 'sess-1', studentId, status, updatedAt: '', updatedBy: '' }) as AttendanceSession['records'][number];

const setup = (overrides: Partial<React.ComponentProps<typeof QrQuickRosterPanel>> = {}) => {
  const onScanStudent = vi.fn();
  render(
    <QrQuickRosterPanel
      lang="ar"
      activeSession={session()}
      currentClassStudents={[student(), student({ id: 's2', studentNumber: '1002', fullName: 'سارة عمر' })]}
      scannedTimestamps={{}}
      qrModeActive={false}
      recentScans={[]}
      onScanStudent={onScanStudent}
      {...overrides}
    />
  );
  return { onScanStudent };
};

describe('QrQuickRosterPanel', () => {
  it('lists the class roster with the student count', () => {
    setup();
    expect(screen.getByText('مسح سريع لطلاب الفصل:')).toBeTruthy();
    expect(screen.getByText('2 طلاب')).toBeTruthy();
    expect(screen.getByText('أحمد علي')).toBeTruthy();
    expect(screen.getByText('سارة عمر')).toBeTruthy();
    expect(screen.getByText('(1001)')).toBeTruthy();
  });

  it('shows present students with their scan timestamp', () => {
    setup({
      activeSession: session([record('s1', 'present')]),
      scannedTimestamps: { s1: '08:15:30' },
    });
    expect(screen.getByText('حاضر (08:15:30)')).toBeTruthy();
    expect(screen.getByText('غائب (يدوي)')).toBeTruthy();
  });

  it('falls back to a check mark when a present student has no timestamp', () => {
    setup({ activeSession: session([record('s1', 'present')]) });
    expect(screen.getByText('حاضر ✔')).toBeTruthy();
  });

  it('shows the pending badge for unscanned students in QR mode', () => {
    setup({ qrModeActive: true, activeSession: session([record('s1', 'present')]) });
    expect(screen.getByText('⏳ بانتظار مسح الـ QR')).toBeTruthy();
  });

  it('treats late records as not yet present', () => {
    setup({
      activeSession: session([record('s1', 'late')]),
      scannedTimestamps: { s1: '09:00:00' },
    });
    expect(screen.getAllByText('غائب (يدوي)')).toHaveLength(2);
    expect(screen.queryByText(/^حاضر/)).toBeNull();
  });

  it('reports the clicked student to onScanStudent', () => {
    const { onScanStudent } = setup();
    fireEvent.click(screen.getByText('سارة عمر'));
    expect(onScanStudent).toHaveBeenCalledTimes(1);
    expect(onScanStudent.mock.calls[0][0].id).toBe('s2');
  });

  it('shows the empty feed hint and the scanned count', () => {
    setup();
    expect(screen.getByText('سجل الطلاب المرصودين بهذه الجلسة:')).toBeTruthy();
    expect(screen.getByText('بانتظار مسح بطاقات الطلاب...')).toBeTruthy();
  });

  it('renders recent scans with class and time', () => {
    setup({
      recentScans: [
        { student: student({ id: 's2', fullName: 'سارة عمر', className: '2/ب' }), time: '08:20:05' },
        { student: student(), time: '08:18:00' },
      ],
    });
    expect(screen.getAllByText('سارة عمر')).toHaveLength(2);
    expect(screen.getAllByText('2/ب')).toHaveLength(1);
    expect(screen.getByText('08:20:05')).toBeTruthy();
    expect(screen.getByText('08:18:00')).toBeTruthy();
    expect(screen.getByText('2')).toBeTruthy();
  });

  it('renders English copy when lang is en', () => {
    setup({ lang: 'en', qrModeActive: true });
    expect(screen.getByText('One-Click Fast Scan:')).toBeTruthy();
    expect(screen.getAllByText('⏳ Pending')).toHaveLength(2);
    expect(screen.getByText('Live Scanned Feed:')).toBeTruthy();
    expect(screen.getByText('Waiting for student QR scans...')).toBeTruthy();
  });
});

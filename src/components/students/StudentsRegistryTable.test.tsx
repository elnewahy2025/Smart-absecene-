// @vitest-environment jsdom
import React from 'react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import type { Student, StudentBehaviourIncident } from '../../types/attendance';
import { StudentsRegistryTable } from './StudentsRegistryTable';

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
  bloodType: 'O+',
  totalAbsences: 1,
  totalLates: 0,
  attendanceRate: 96,
  ...overrides,
});

const incident = (studentId: string, points: number): StudentBehaviourIncident =>
  ({
    id: `inc-${studentId}-${points}`,
    tenantId: 'school-1',
    studentId,
    studentName: 'أحمد علي',
    className: '1/أ',
    date: '2026-10-01',
    type: 'positive',
    category: 'teamwork',
    title: 'Teamwork',
    description: '',
    severity: 'minor',
    points,
    recordedBy: 'teacher',
    guardianNotified: false,
  }) as StudentBehaviourIncident;

const setup = (overrides: Partial<React.ComponentProps<typeof StudentsRegistryTable>> = {}) => {
  const handlers = {
    onOpenAbsence: vi.fn(),
    onOpenBehaviour: vi.fn(),
    onOpenQR: vi.fn(),
    onRestore: vi.fn(),
    onTransfer: vi.fn(),
    onDelete: vi.fn(),
  };
  render(
    <StudentsRegistryTable
      lang="ar"
      students={[student()]}
      behaviourIncidents={[]}
      canDeleteStudents
      {...handlers}
      {...overrides}
    />
  );
  return handlers;
};

describe('StudentsRegistryTable', () => {
  it('shows the empty state when no students match', () => {
    setup({ students: [] });
    expect(screen.getByText('لا يوجد طلاب مطابقين للتصفية')).toBeTruthy();
  });

  it('renders the student row with contact and blood type', () => {
    setup();
    expect(screen.getByText('أحمد علي')).toBeTruthy();
    expect(screen.getByText('1001')).toBeTruthy();
    expect(screen.getByText('1234567890')).toBeTruthy();
    expect(screen.getByText('1/أ')).toBeTruthy();
    expect(screen.getByText('علي')).toBeTruthy();
    expect(screen.getByText('0555000000')).toBeTruthy();
    expect(screen.getByText('O+')).toBeTruthy();
    expect(screen.getByText('%96')).toBeTruthy();
  });

  it('marks transferred students and shows the destination school', () => {
    setup({
      students: [student({ enrollmentStatus: 'transferred', destinationSchool: 'مدرسة النور' })],
      behaviourIncidents: [],
    });
    expect(screen.getByText('منقول')).toBeTruthy();
    expect(screen.getByText('← مدرسة النور')).toBeTruthy();
  });

  it('colour-codes attendance and flags intervention tiers', () => {
    setup({
      students: [
        student({ id: 'a', attendanceRate: 96 }),
        student({ id: 'b', fullName: 'سارة', attendanceRate: 88 }),
        student({ id: 'c', fullName: 'خالد', attendanceRate: 80, totalAbsences: 6 }),
      ],
    });
    expect(screen.getByText('%96').className).toContain('bg-emerald-50');
    expect(screen.getByText('%88').className).toContain('bg-amber-50');
    expect(screen.getByText('%80').className).toContain('bg-rose-50');
    expect(screen.getByText('⚡ إنذار متابعة')).toBeTruthy();
    expect(screen.getByText('⚠️ بحاجة لتدخل عاجل')).toBeTruthy();
  });

  it('summarises behaviour points for the student', () => {
    setup({ behaviourIncidents: [incident('s1', 5), incident('s1', -2)] });
    expect(screen.getByText('+3 (2)')).toBeTruthy();
  });

  it('falls back to the behaviour label without incidents', () => {
    setup();
    expect(screen.getByText('سجل السلوك')).toBeTruthy();
  });

  it('opens the absence, behaviour and QR modals', () => {
    const h = setup();
    fireEvent.click(screen.getByText('أحمد علي'));
    expect(h.onOpenAbsence).toHaveBeenCalledWith(expect.objectContaining({ id: 's1' }));
    fireEvent.click(screen.getByText('سجل السلوك'));
    expect(h.onOpenBehaviour).toHaveBeenCalledTimes(1);
    fireEvent.click(screen.getByText('رمز الـ QR'));
    expect(h.onOpenQR).toHaveBeenCalledTimes(1);
  });

  it('offers transfer, inquiry and delete for active students', () => {
    const h = setup({ canDeleteStudents: true });
    fireEvent.click(screen.getByText('نقل لمدرسة'));
    expect(h.onTransfer).toHaveBeenCalledTimes(1);
    fireEvent.click(screen.getByText('استعلام'));
    expect(h.onOpenAbsence).toHaveBeenCalledTimes(1);
    fireEvent.click(screen.getByTitle('حذف سجل الطالب نهائياً'));
    expect(h.onDelete).toHaveBeenCalledTimes(1);
  });

  it('hides delete for non-admin users but keeps transfer', () => {
    setup({ canDeleteStudents: false });
    expect(screen.queryByTitle('حذف سجل الطالب نهائياً')).toBeNull();
    expect(screen.getByText('نقل لمدرسة')).toBeTruthy();
  });

  it('offers restore and admin delete for transferred students', () => {
    const h = setup({
      students: [student({ enrollmentStatus: 'transferred' })],
      canDeleteStudents: true,
    });
    fireEvent.click(screen.getByText('استعادة'));
    expect(h.onRestore).toHaveBeenCalledWith('s1');
    fireEvent.click(screen.getByTitle('حذف نهائي لسجل الطالب'));
    expect(h.onDelete).toHaveBeenCalledTimes(1);
    expect(screen.queryByText('نقل لمدرسة')).toBeNull();
  });

  it('hides the transferred delete button without admin rights', () => {
    setup({ students: [student({ enrollmentStatus: 'transferred' })], canDeleteStudents: false });
    expect(screen.queryByTitle('حذف نهائي لسجل الطالب')).toBeNull();
  });

  it('renders English labels when lang is en', () => {
    setup({
      lang: 'en',
      students: [student({ fullName: 'Ahmed Ali', enrollmentStatus: 'transferred' })],
    });
    expect(screen.getByText('Student Name')).toBeTruthy();
    expect(screen.getByText('Actions')).toBeTruthy();
    expect(screen.getByText('Transferred')).toBeTruthy();
    expect(screen.getByText('Restore')).toBeTruthy();
    expect(screen.getByText('Delete')).toBeTruthy();
  });
});

// @vitest-environment jsdom
import React from 'react';
import { afterEach, describe, expect, it } from 'vitest';
import { cleanup, render, screen } from '@testing-library/react';
import type { StudentBehaviourIncident } from '../../types/attendance';
import { BehaviourRecordDetails } from './BehaviourRecordDetails';

afterEach(cleanup);

const incident = (overrides: Partial<StudentBehaviourIncident> = {}): StudentBehaviourIncident => ({
  id: 'inc-1',
  tenantId: 'school-1',
  studentId: 's1',
  studentName: 'أحمد علي',
  className: '10/A',
  date: '2026-01-05',
  time: '09:30',
  type: 'infraction',
  category: 'disruption',
  title: 'مقاطعة الحصة',
  description: 'تحدث أثناء شرح المعلم',
  severity: 'moderate',
  points: -3,
  recordedBy: 'الأستاذ خالد',
  guardianNotified: false,
  ...overrides,
});

const renderDetails = (overrides: Partial<StudentBehaviourIncident> = {}) =>
  render(<BehaviourRecordDetails data={incident(overrides)} />);

describe('BehaviourRecordDetails', () => {
  it('renders the incident heading, description and reporter', () => {
    renderDetails();
    expect(screen.getByText('عنوان الواقعة')).toBeTruthy();
    expect(screen.getByText('مقاطعة الحصة')).toBeTruthy();
    expect(screen.getByText('2026-01-05')).toBeTruthy();
    expect(screen.getByText('09:30')).toBeTruthy();
    expect(screen.getByText('الأستاذ خالد')).toBeTruthy();
    expect(screen.getByText('تحدث أثناء شرح المعلم')).toBeTruthy();
  });

  it('falls back to a morning time label', () => {
    renderDetails({ time: undefined });
    expect(screen.getByText('صباحاً')).toBeTruthy();
  });

  it('labels positive records with their points', () => {
    renderDetails({ type: 'positive', points: 5, title: 'مبادرة صفية' });
    expect(screen.getByText('سلوك إيجابي متميز (+)')).toBeTruthy();
    expect(screen.getByText('+5 نقطة')).toBeTruthy();
  });

  it('labels negative points without a plus sign', () => {
    renderDetails();
    expect(screen.getByText('-3 نقطة')).toBeTruthy();
    expect(screen.queryByText('0 نقطة')).toBeNull();
  });

  it('describes all three infraction severities', () => {
    const { rerender } = render(<BehaviourRecordDetails data={incident({ severity: 'major' })} />);
    expect(screen.getByText('مخالفة جسيمة (درجة ثالثة)')).toBeTruthy();
    rerender(<BehaviourRecordDetails data={incident({ severity: 'moderate' })} />);
    expect(screen.getByText('مخالفة متوسطة (درجة ثانية)')).toBeTruthy();
    rerender(<BehaviourRecordDetails data={incident({ severity: 'minor' })} />);
    expect(screen.getByText('مخالفة بسيطة (درجة أولى)')).toBeTruthy();
  });

  it('shows the administrative action when recorded', () => {
    const { rerender } = renderDetails({ actionTaken: 'استدعاء ولي الأمر' });
    expect(screen.getByText('الإجراء الإداري / التربوي المتخذ:')).toBeTruthy();
    expect(screen.getByText('استدعاء ولي الأمر')).toBeTruthy();
    rerender(<BehaviourRecordDetails data={incident()} />);
    expect(screen.queryByText('الإجراء الإداري / التربوي المتخذ:')).toBeNull();
  });

  it('reports the guardian notification state', () => {
    const { rerender } = renderDetails({ guardianNotified: true });
    expect(screen.getByText('تم إرسال إشعار رسمي لولي الأمر')).toBeTruthy();
    rerender(<BehaviourRecordDetails data={incident({ guardianNotified: false })} />);
    expect(screen.getByText('لم يُرسل إشعار خارجي')).toBeTruthy();
  });
});

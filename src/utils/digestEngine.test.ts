import { describe, it, expect } from 'vitest';
import { computeDailyDigestData, generateHtmlEmailTemplate } from './digestEngine';
import { Student, AttendanceSession, Justification, DailyEmailDigestConfig } from '../types/attendance';

describe('digestEngine', () => {
  const dummyConfig: DailyEmailDigestConfig = {
    enabled: true,
    scheduledTime: '06:45',
    daysOfWeek: [0, 1, 2, 3, 4],
    recipients: ['admin@school.sa'],
    includeAnomalies: true,
    includePendingJustifications: true,
    includeHighRiskStudents: true,
    includeGeminiBriefing: true,
    chronicAbsenceThreshold: 5,
    consecutiveAbsenceDaysThreshold: 2,
    anomalySpikePercentage: 25,
    notifyViaWhatsAppToo: true,
    principalPhone: '+966501112233',
  };

  const sampleStudents: Student[] = [
    {
      id: 'student-1',
      tenantId: 'school-1',
      studentNumber: 'ST-101',
      nationalId: '1000000001',
      fullName: 'أحمد بن خالد',
      grade: 'الصف العاشر',
      className: '10-أ',
      classId: 'c1',
      guardianName: 'خالد',
      guardianPhone: '+966500000001',
      guardianRelationship: 'أب',
      totalAbsences: 6,
      totalLates: 1,
      attendanceRate: 88,
    },
    {
      id: 'student-2',
      tenantId: 'school-1',
      studentNumber: 'ST-102',
      nationalId: '1000000002',
      fullName: 'سعيد بن علي',
      grade: 'الصف العاشر',
      className: '10-أ',
      classId: 'c1',
      guardianName: 'علي',
      guardianPhone: '+966500000002',
      guardianRelationship: 'أب',
      totalAbsences: 1,
      totalLates: 0,
      attendanceRate: 98,
    },
  ];

  it('computes overall attendance rate correctly', () => {
    const data = computeDailyDigestData({
      tenantId: 'school-1',
      tenantName: 'مدرسة التجربة',
      students: sampleStudents,
      sessions: [],
      justifications: [],
      config: dummyConfig,
      dateStr: '2026-10-11',
    });

    expect(data.totalStudents).toBe(2);
    expect(data.overallAttendanceRate).toBe(93); // (88 + 98) / 2 = 93.0
  });

  it('identifies high risk students exceeding chronic absence threshold', () => {
    const data = computeDailyDigestData({
      tenantId: 'school-1',
      tenantName: 'مدرسة التجربة',
      students: sampleStudents,
      sessions: [],
      justifications: [],
      config: dummyConfig,
      dateStr: '2026-10-11',
    });

    expect(data.highRiskStudents.length).toBeGreaterThanOrEqual(1);
    const criticalStudent = data.highRiskStudents.find((s) => s.id === 'student-1');
    expect(criticalStudent).toBeDefined();
    expect(criticalStudent?.totalAbsences).toBe(6);
    expect(criticalStudent?.name).toBe('أحمد بن خالد');
  });

  it('generates email HTML template with school name and headline', () => {
    const data = computeDailyDigestData({
      tenantId: 'school-1',
      tenantName: 'مدرسة الأندلس',
      students: sampleStudents,
      sessions: [],
      justifications: [],
      config: dummyConfig,
      dateStr: '2026-10-11',
    });

    const fullDigest = {
      ...data,
      id: 'digest-test',
      dispatchedAt: '2026-10-11T06:45:00Z',
      status: 'scheduled' as const,
    };

    const html = generateHtmlEmailTemplate(fullDigest, 'مدرسة الأندلس');
    expect(html).toContain('مدرسة الأندلس');
    expect(html).toContain('<!DOCTYPE html>');
  });
});

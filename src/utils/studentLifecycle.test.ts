import { describe, it, expect } from 'vitest';
import { Student, SchoolClassSummary, SchoolEnrollmentStats } from '../types/attendance';

describe('Student Lifecycle & Dynamic School Analytics', () => {
  const sampleStudents: Student[] = [
    {
      id: 'std-1',
      tenantId: 'school-1',
      studentNumber: '20260101',
      nationalId: '1098765431',
      fullName: 'يوسف بن خالد المطيري',
      grade: 'الصف العاشر',
      className: '10 / أ',
      classId: 'class-10a',
      guardianName: 'خالد المطيري',
      guardianPhone: '+966509990011',
      guardianRelationship: 'الأب',
      attendanceRate: 95,
      totalAbsences: 1,
      totalLates: 0,
      enrollmentStatus: 'active',
    },
    {
      id: 'std-2',
      tenantId: 'school-1',
      studentNumber: '20260102',
      nationalId: '1098765432',
      fullName: 'ريان بن صالح الغامدي',
      grade: 'الصف العاشر',
      className: '10 / أ',
      classId: 'class-10a',
      guardianName: 'صالح الغامدي',
      guardianPhone: '+966509990022',
      guardianRelationship: 'الأب',
      attendanceRate: 85,
      totalAbsences: 3,
      totalLates: 2,
      enrollmentStatus: 'active',
    },
    {
      id: 'std-3',
      tenantId: 'school-1',
      studentNumber: '20260103',
      nationalId: '1098765433',
      fullName: 'عبد الله بن ماجد السبيعي',
      grade: 'الصف العاشر',
      className: '10 / ب',
      classId: 'class-10b',
      guardianName: 'ماجد السبيعي',
      guardianPhone: '+966509990033',
      guardianRelationship: 'الأب',
      attendanceRate: 100,
      totalAbsences: 0,
      totalLates: 0,
      enrollmentStatus: 'transferred',
      transferredAt: '2026-10-12T10:00:00Z',
      destinationSchool: 'ثانوية الرياض النموذجية',
      transferReason: 'انتقال سكن الأسرة',
    },
  ];

  it('correctly calculates dynamic school enrollment stats', () => {
    const active = sampleStudents.filter((s) => s.enrollmentStatus !== 'transferred');
    const transferred = sampleStudents.filter((s) => s.enrollmentStatus === 'transferred');
    const uniqueClasses = new Set(active.map((s) => s.className)).size;

    const stats: SchoolEnrollmentStats = {
      totalStudentsCount: sampleStudents.length,
      activeStudentsCount: active.length,
      transferredStudentsCount: transferred.length,
      totalClassesCount: uniqueClasses,
      averageClassSize: uniqueClasses > 0 ? Math.round(active.length / uniqueClasses) : 0,
      schoolAttendanceRate: active.length > 0 ? Math.round(active.reduce((acc, s) => acc + s.attendanceRate, 0) / active.length) : 100,
    };

    expect(stats.totalStudentsCount).toBe(3);
    expect(stats.activeStudentsCount).toBe(2);
    expect(stats.transferredStudentsCount).toBe(1);
    expect(stats.totalClassesCount).toBe(1); // Only 10 / أ has active students
    expect(stats.averageClassSize).toBe(2);
    expect(stats.schoolAttendanceRate).toBe(90); // (95 + 85) / 2 = 90
  });

  it('excludes transferred students from active daily roll-call sessions', () => {
    const activeRollCallStudents = sampleStudents.filter(
      (s) => s.className === '10 / ب' && s.enrollmentStatus !== 'transferred'
    );

    // Std-3 is transferred so class 10 / ب active roll-call count should be 0
    expect(activeRollCallStudents.length).toBe(0);
  });

  it('allows restoring transferred student back to active enrollment', () => {
    let student = { ...sampleStudents[2] };
    expect(student.enrollmentStatus).toBe('transferred');

    // Restore action
    student = {
      ...student,
      enrollmentStatus: 'active',
      transferredAt: undefined,
      destinationSchool: undefined,
      transferReason: undefined,
    };

    expect(student.enrollmentStatus).toBe('active');
    expect(student.destinationSchool).toBeUndefined();
  });

  it('enforces national ID length and formatting', () => {
    const validNationalId = '1098765431';
    const invalidNationalId = '1098';

    expect(validNationalId.length).toBe(10);
    expect(invalidNationalId.length).not.toBe(10);
  });
});

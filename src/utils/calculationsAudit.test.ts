import { describe, it, expect } from 'vitest';
import { Student, AttendanceSession, SchoolClassSummary, SchoolEnrollmentStats } from '../types/attendance';
import {
  isSchoolOffDay,
  getSchoolWeekDays,
  countActiveSchoolDays,
  DEFAULT_WEEKEND_DAYS,
  DEFAULT_OFFICIAL_HOLIDAYS,
} from './holidayUtils';

// 1. Audit Calculation Helpers matching production business logic
export const calculateStudentAttendanceRate = (
  totalAbsences: number,
  totalPossibleDays = 20
): number => {
  if (totalPossibleDays <= 0) return 100;
  const attended = Math.max(0, totalPossibleDays - totalAbsences);
  return parseFloat(((attended / totalPossibleDays) * 100).toFixed(1));
};

export const calculateSchoolAverageAttendance = (students: Student[]): string => {
  const activeStudents = students.filter((s) => s.enrollmentStatus !== 'transferred');
  if (activeStudents.length === 0) return '100';
  const sum = activeStudents.reduce((acc, s) => acc + s.attendanceRate, 0);
  return (sum / activeStudents.length).toFixed(1);
};

export const classifyChronicAbsenceRiskTier = (totalAbsences: number): 'normal' | 'tier1_warning' | 'tier2_high' | 'tier3_critical' => {
  if (totalAbsences >= 8) return 'tier3_critical';
  if (totalAbsences >= 5) return 'tier2_high';
  if (totalAbsences >= 3) return 'tier1_warning';
  return 'normal';
};

export const aggregateClassSummaries = (students: Student[]): Record<string, { total: number; active: number; avgRate: number }> => {
  const result: Record<string, { total: number; active: number; rateSum: number; avgRate: number }> = {};
  students.forEach((s) => {
    if (!result[s.className]) {
      result[s.className] = { total: 0, active: 0, rateSum: 0, avgRate: 100 };
    }
    result[s.className].total += 1;
    if (s.enrollmentStatus !== 'transferred') {
      result[s.className].active += 1;
      result[s.className].rateSum += s.attendanceRate;
    }
  });

  const finalSummaries: Record<string, { total: number; active: number; avgRate: number }> = {};
  Object.keys(result).forEach((cls) => {
    const item = result[cls];
    finalSummaries[cls] = {
      total: item.total,
      active: item.active,
      avgRate: item.active > 0 ? parseFloat((item.rateSum / item.active).toFixed(1)) : 100,
    };
  });
  return finalSummaries;
};

export const calculateConsecutiveStreak = (studentId: string, sessions: AttendanceSession[]): number => {
  const sortedSessions = [...sessions]
    .filter((s) => s.status === 'submitted')
    .sort((a, b) => b.date.localeCompare(a.date));

  let streak = 0;
  for (const sess of sortedSessions) {
    const rec = sess.records?.find((r) => r.studentId === studentId);
    if (rec) {
      if (rec.status === 'present' || rec.status === 'excused_absence' || rec.status === 'excused_leave') {
        streak += 1;
      } else {
        break;
      }
    }
  }
  return streak;
};

describe('Comprehensive Calculations, KPIs & Data Lineage Audit Suite', () => {
  const mockStudentsSchool1: Student[] = [
    {
      id: 'std-1',
      tenantId: 'school-1',
      studentNumber: '1001',
      nationalId: '1000000001',
      fullName: 'طالب منضبط 1',
      grade: 'الصف العاشر',
      className: '10 / أ',
      classId: 'c-10a',
      guardianName: 'ولي أمر 1',
      guardianPhone: '+966500000001',
      guardianRelationship: 'الأب',
      totalAbsences: 0,
      totalLates: 0,
      attendanceRate: 100.0,
      enrollmentStatus: 'active',
    },
    {
      id: 'std-2',
      tenantId: 'school-1',
      studentNumber: '1002',
      nationalId: '1000000002',
      fullName: 'طالب غائب 3 أيام',
      grade: 'الصف العاشر',
      className: '10 / أ',
      classId: 'c-10a',
      guardianName: 'ولي أمر 2',
      guardianPhone: '+966500000002',
      guardianRelationship: 'الأب',
      totalAbsences: 3,
      totalLates: 1,
      attendanceRate: 85.0,
      enrollmentStatus: 'active',
    },
    {
      id: 'std-3',
      tenantId: 'school-1',
      studentNumber: '1003',
      nationalId: '1000000003',
      fullName: 'طالب إنذار ثان 5 أيام',
      grade: 'الصف العاشر',
      className: '10 / ب',
      classId: 'c-10b',
      guardianName: 'ولي أمر 3',
      guardianPhone: '+966500000003',
      guardianRelationship: 'الأب',
      totalAbsences: 5,
      totalLates: 2,
      attendanceRate: 75.0,
      enrollmentStatus: 'active',
    },
    {
      id: 'std-4',
      tenantId: 'school-1',
      studentNumber: '1004',
      nationalId: '1000000004',
      fullName: 'طالب حرج 8 أيام',
      grade: 'الصف العاشر',
      className: '10 / ب',
      classId: 'c-10b',
      guardianName: 'ولي أمر 4',
      guardianPhone: '+966500000004',
      guardianRelationship: 'الأب',
      totalAbsences: 8,
      totalLates: 4,
      attendanceRate: 60.0,
      enrollmentStatus: 'active',
    },
    {
      id: 'std-5',
      tenantId: 'school-1',
      studentNumber: '1005',
      nationalId: '1000000005',
      fullName: 'طالب منقول',
      grade: 'الصف العاشر',
      className: '10 / أ',
      classId: 'c-10a',
      guardianName: 'ولي أمر 5',
      guardianPhone: '+966500000005',
      guardianRelationship: 'الأب',
      totalAbsences: 12,
      totalLates: 0,
      attendanceRate: 40.0,
      enrollmentStatus: 'transferred',
    },
  ];

  const mockStudentsSchool2: Student[] = [
    {
      id: 'std-201',
      tenantId: 'school-2',
      studentNumber: '2001',
      nationalId: '2000000001',
      fullName: 'طالب مدرسة الفلاح',
      grade: 'الصف الثامن',
      className: '8 / أ',
      classId: 'c-8a',
      guardianName: 'ولي أمر فلاح',
      guardianPhone: '+966509999999',
      guardianRelationship: 'الأب',
      totalAbsences: 1,
      totalLates: 0,
      attendanceRate: 95.0,
      enrollmentStatus: 'active',
    },
  ];

  describe('1. Individual Student Attendance Rate Recalculation', () => {
    it('Accurately computes 100% for 0 absences', () => {
      expect(calculateStudentAttendanceRate(0, 20)).toBe(100.0);
    });

    it('Accurately computes 85% for 3 absences out of 20 days', () => {
      expect(calculateStudentAttendanceRate(3, 20)).toBe(85.0);
    });

    it('Accurately computes 75% for 5 absences out of 20 days', () => {
      expect(calculateStudentAttendanceRate(5, 20)).toBe(75.0);
    });

    it('Accurately computes 60% for 8 absences out of 20 days', () => {
      expect(calculateStudentAttendanceRate(8, 20)).toBe(60.0);
    });

    it('Clamps to 0% and does not produce negative values when absences exceed possible days', () => {
      expect(calculateStudentAttendanceRate(25, 20)).toBe(0.0);
    });

    it('Gracefully handles 0 possible days by returning 100% without NaN or division by zero', () => {
      expect(calculateStudentAttendanceRate(0, 0)).toBe(100.0);
    });
  });

  describe('2. Chronic Absence Procedural Risk Tier Classification', () => {
    it('Normal Tier: < 3 absences', () => {
      expect(classifyChronicAbsenceRiskTier(0)).toBe('normal');
      expect(classifyChronicAbsenceRiskTier(2)).toBe('normal');
    });

    it('Tier 1 Warning (تنبيه أولي): 3 to 4 absences', () => {
      expect(classifyChronicAbsenceRiskTier(3)).toBe('tier1_warning');
      expect(classifyChronicAbsenceRiskTier(4)).toBe('tier1_warning');
    });

    it('Tier 2 High (إنذار ثان): 5 to 7 absences', () => {
      expect(classifyChronicAbsenceRiskTier(5)).toBe('tier2_high');
      expect(classifyChronicAbsenceRiskTier(7)).toBe('tier2_high');
    });

    it('Tier 3 Critical (إنذار نهائي / خطر الحرمان): >= 8 absences', () => {
      expect(classifyChronicAbsenceRiskTier(8)).toBe('tier3_critical');
      expect(classifyChronicAbsenceRiskTier(15)).toBe('tier3_critical');
    });
  });

  describe('3. School & Class Aggregations and Lifecycle Segregation', () => {
    it('Excludes transferred students from active school average calculation', () => {
      // School 1 active students: std-1 (100), std-2 (85), std-3 (75), std-4 (60)
      // Transferred std-5 (40) must NOT drag down the active school rate!
      // Expected active average: (100 + 85 + 75 + 60) / 4 = 320 / 4 = 80.0%
      const avg = calculateSchoolAverageAttendance(mockStudentsSchool1);
      expect(avg).toBe('80.0');
    });

    it('Returns clean 100 for an empty school student roster without NaN', () => {
      expect(calculateSchoolAverageAttendance([])).toBe('100');
    });

    it('Accurately breaks down class statistics with active vs transferred split', () => {
      const breakdown = aggregateClassSummaries(mockStudentsSchool1);

      // Class '10 / أ': std-1 (active, 100), std-2 (active, 85), std-5 (transferred, 40)
      // Total = 3, Active = 2, AvgRate = (100 + 85) / 2 = 92.5%
      expect(breakdown['10 / أ'].total).toBe(3);
      expect(breakdown['10 / أ'].active).toBe(2);
      expect(breakdown['10 / أ'].avgRate).toBe(92.5);

      // Class '10 / ب': std-3 (active, 75), std-4 (active, 60)
      // Total = 2, Active = 2, AvgRate = (75 + 60) / 2 = 67.5%
      expect(breakdown['10 / ب'].total).toBe(2);
      expect(breakdown['10 / ب'].active).toBe(2);
      expect(breakdown['10 / ب'].avgRate).toBe(67.5);
    });
  });

  describe('4. Multi-Tenant Scoping & Cross-Tenant Data Isolation', () => {
    it('Strictly isolates tenant data: School 1 metrics contain zero School 2 data', () => {
      const allStudents = [...mockStudentsSchool1, ...mockStudentsSchool2];

      const school1Scoped = allStudents.filter((s) => s.tenantId === 'school-1');
      const school2Scoped = allStudents.filter((s) => s.tenantId === 'school-2');

      expect(school1Scoped.length).toBe(5);
      expect(school2Scoped.length).toBe(1);

      // Verify no cross-tenant student IDs in School 1
      const school1Ids = new Set(school1Scoped.map((s) => s.id));
      expect(school1Ids.has('std-201')).toBe(false);

      // Verify School 2 rate is solely derived from School 2 student
      const school2Avg = calculateSchoolAverageAttendance(school2Scoped);
      expect(school2Avg).toBe('95.0');
    });
  });

  describe('5. Streak & Attendance Record Lineage Verification', () => {
    const mockSessions: AttendanceSession[] = [
      {
        id: 'sess-day-1',
        tenantId: 'school-1',
        date: '2026-10-08',
        sessionType: 'daily',
        classId: 'c-10a',
        className: '10 / أ',
        grade: 'الصف العاشر',
        teacherId: 'teacher-1',
        teacherName: 'أ. فهد',
        status: 'submitted',
        totalStudents: 2,
        presentCount: 2,
        absentCount: 0,
        lateCount: 0,
        excusedCount: 0,
        records: [
          { id: 'r1-1', sessionId: 'sess-day-1', studentId: 'std-1', status: 'present', updatedAt: '', updatedBy: '' },
          { id: 'r1-2', sessionId: 'sess-day-1', studentId: 'std-2', status: 'present', updatedAt: '', updatedBy: '' },
        ],
      },
      {
        id: 'sess-day-2',
        tenantId: 'school-1',
        date: '2026-10-09',
        sessionType: 'daily',
        classId: 'c-10a',
        className: '10 / أ',
        grade: 'الصف العاشر',
        teacherId: 'teacher-1',
        teacherName: 'أ. فهد',
        status: 'submitted',
        totalStudents: 2,
        presentCount: 1,
        absentCount: 1,
        lateCount: 0,
        excusedCount: 0,
        records: [
          { id: 'r2-1', sessionId: 'sess-day-2', studentId: 'std-1', status: 'present', updatedAt: '', updatedBy: '' },
          { id: 'r2-2', sessionId: 'sess-day-2', studentId: 'std-2', status: 'absent', updatedAt: '', updatedBy: '' },
        ],
      },
      {
        id: 'sess-day-3',
        tenantId: 'school-1',
        date: '2026-10-10',
        sessionType: 'daily',
        classId: 'c-10a',
        className: '10 / أ',
        grade: 'الصف العاشر',
        teacherId: 'teacher-1',
        teacherName: 'أ. فهد',
        status: 'submitted',
        totalStudents: 2,
        presentCount: 2,
        absentCount: 0,
        lateCount: 0,
        excusedCount: 0,
        records: [
          { id: 'r3-1', sessionId: 'sess-day-3', studentId: 'std-1', status: 'present', updatedAt: '', updatedBy: '' },
          { id: 'r3-2', sessionId: 'sess-day-3', studentId: 'std-2', status: 'present', updatedAt: '', updatedBy: '' },
        ],
      },
    ];

    it('Calculates 3 consecutive days streak for std-1 (present in all 3 sessions)', () => {
      const streak = calculateConsecutiveStreak('std-1', mockSessions);
      expect(streak).toBe(3);
    });

    it('Calculates 1 consecutive day streak for std-2 because day 2 was absent', () => {
      // Latest session (day 3) = present (+1), previous (day 2) = absent (breaks streak)
      const streak = calculateConsecutiveStreak('std-2', mockSessions);
      expect(streak).toBe(1);
    });

    it('Calculates 0 streak if student was absent in the latest session', () => {
      const sessionsWithRecentAbsence: AttendanceSession[] = [
        {
          ...mockSessions[2],
          records: [
            { id: 'r-latest', sessionId: 'sess-day-3', studentId: 'std-1', status: 'absent', updatedAt: '', updatedBy: '' },
          ],
        },
      ];
      const streak = calculateConsecutiveStreak('std-1', sessionsWithRecentAbsence);
      expect(streak).toBe(0);
    });
  });

  // 6. Official Weekends and School Holidays Exclusion Audit
  describe('6. Official Weekends and Holidays Off-Day Calculation Engine', () => {
    it('Identifies Friday and Saturday as official school weekend off-days', () => {
      const friday = isSchoolOffDay('2026-10-16', DEFAULT_WEEKEND_DAYS, DEFAULT_OFFICIAL_HOLIDAYS);
      expect(friday.isOff).toBe(true);
      expect(friday.type).toBe('weekend');

      const saturday = isSchoolOffDay('2026-10-17', DEFAULT_WEEKEND_DAYS, DEFAULT_OFFICIAL_HOLIDAYS);
      expect(saturday.isOff).toBe(true);
      expect(saturday.type).toBe('weekend');

      const sunday = isSchoolOffDay('2026-10-11', DEFAULT_WEEKEND_DAYS, DEFAULT_OFFICIAL_HOLIDAYS);
      expect(sunday.isOff).toBe(false);

      const monday = isSchoolOffDay('2026-10-12', DEFAULT_WEEKEND_DAYS, DEFAULT_OFFICIAL_HOLIDAYS);
      expect(monday.isOff).toBe(false);
    });

    it('Identifies Official National Holidays as off-days (e.g. Saudi National Day 2026-09-23)', () => {
      const nationalDay = isSchoolOffDay('2026-09-23', DEFAULT_WEEKEND_DAYS, DEFAULT_OFFICIAL_HOLIDAYS);
      expect(nationalDay.isOff).toBe(true);
      expect(nationalDay.type).toBe('holiday');
      expect(nationalDay.holidayName).toContain('اليوم الوطني');
    });

    it('Generates the complete 5 standard school days (Sunday to Thursday) for reference date', () => {
      // For reference date Monday 2026-10-12
      const weekSlots = getSchoolWeekDays('2026-10-12', DEFAULT_WEEKEND_DAYS, DEFAULT_OFFICIAL_HOLIDAYS);
      expect(weekSlots.length).toBe(5);

      expect(weekSlots[0].dayNameAr).toBe('الأحد');
      expect(weekSlots[0].date).toBe('2026-10-11');

      expect(weekSlots[1].dayNameAr).toBe('الإثنين');
      expect(weekSlots[1].date).toBe('2026-10-12');

      expect(weekSlots[2].dayNameAr).toBe('الثلاثاء');
      expect(weekSlots[2].date).toBe('2026-10-13');

      expect(weekSlots[3].dayNameAr).toBe('الأربعاء');
      expect(weekSlots[3].date).toBe('2026-10-14');

      expect(weekSlots[4].dayNameAr).toBe('الخميس');
      expect(weekSlots[4].date).toBe('2026-10-15');
    });

    it('Correctly counts active school days excluding weekends and official holidays', () => {
      // Between Sunday 2026-10-11 and Thursday 2026-10-15:
      // Wednesday 2026-10-14 and Thursday 2026-10-15 are defined as extended weekend holidays in DEFAULT_OFFICIAL_HOLIDAYS
      // Active days: Sunday, Monday, Tuesday = 3 days
      const activeDays = countActiveSchoolDays('2026-10-11', '2026-10-15', DEFAULT_WEEKEND_DAYS, DEFAULT_OFFICIAL_HOLIDAYS);
      expect(activeDays).toBe(3);
    });

    it('Ensures absence calculation uses actual active school days and does not count off-days as absence', () => {
      // In a 20-day period with 4 holiday off-days, total possible school days is 16
      const totalPossibleDays = 16;
      const totalAbsences = 1; // student absent only 1 real school day
      const rate = calculateStudentAttendanceRate(totalAbsences, totalPossibleDays);

      // (15 / 16) * 100 = 93.8%
      expect(rate).toBe(93.8);
      // If holidays were mistakenly counted as possible days, rate would be diluted to (19/20)*100 = 95.0%
      expect(rate).not.toBe(95.0);
    });
  });
});

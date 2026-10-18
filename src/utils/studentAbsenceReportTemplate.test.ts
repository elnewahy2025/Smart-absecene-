import { describe, it, expect } from 'vitest';
import { generateStudentAbsenceReportHtml, StudentAbsenceReportParams } from './printTemplates/studentAbsenceReportTemplate';
import { Student, TenantSchoolProfile } from '../types/attendance';

describe('studentAbsenceReportTemplate', () => {
  const mockStudent: Student = {
    id: 'std-test-101',
    tenantId: 'tenant-1',
    classId: 'class-1',
    fullName: 'تركي بن عبد العزيز الشمري',
    studentNumber: '2026101',
    nationalId: '1098765432',
    grade: 'الصف العاشر',
    className: '10 / أ',
    guardianName: 'عبد العزيز الشمري',
    guardianPhone: '+966501112233',
    guardianRelationship: 'father',
    attendanceRate: 92,
    totalAbsences: 3,
    totalLates: 2,
    enrollmentStatus: 'active',
  };

  const mockProfile: TenantSchoolProfile = {
    tenantId: 'tenant-1',
    schoolName: 'ثانوية الرياض المتطورة النموذجية',
    schoolCode: 'SCH-RYD-9988',
    directorateAr: 'الإدارة العامة للتعليم بمنطقة الرياض',
    ministryHeaderAr: 'المملكة العربية السعودية\nوزارة التعليم\nالإدارة العامة للتعليم بالرياض',
    officeAr: 'مكتب الروضة',
    stageAr: 'ثانوي',
    genderType: 'boys',
    address: {
      country: 'السعودية',
      region: 'الرياض',
      city: 'الرياض',
      district: 'الروضة',
      streetAddress: 'طريق خريص',
    },
    generalPhone: '0112345678',
    emergencyHotline: '998',
    officialEmail: 'info@school.edu.sa',
    academicYear: {
      code: '1447-1448',
      hijriYear: '1447-1448 هـ',
      gregorianYear: '2026-2027',
      terms: [
        { id: 'term-1', nameAr: 'الفصل الأول', nameEn: 'Term 1', startDate: '2026-09-01', endDate: '2026-11-26', isActive: true },
      ],
    },
    timetablePeriods: [],
    assemblyPoints: [],
    chronicAbsenceDaysThreshold: 5,
    unexcusedWarningThreshold: 3,
    officialReportFooterNote: 'وثيقة رسمية',
    leadership: {
      principalName: 'د. خالد بن فهد السديري',
      principalPhone: '0500000001',
      vicePrincipalStudentAffairsName: 'أ. فهد بن ناصر القحطاني',
      vicePrincipalStudentAffairsPhone: '0500000002',
      vicePrincipalAcademicAffairsName: 'أ. سعد العتيبي',
      vicePrincipalAcademicAffairsPhone: '0500000003',
      socialWorkerName: 'أ. عمر بن صالح العمري',
      socialWorkerPhone: '0500000004',
    },
  };

  it('dynamically derives school identity, leadership, and dates from TenantSchoolProfile without hardcoding', () => {
    const params: StudentAbsenceReportParams = {
      student: mockStudent,
      schoolProfile: mockProfile,
      activeDateRange: {
        label: 'شهر أكتوبر 2026',
        start: '2026-10-01',
        end: '2026-10-31',
      },
      analysis: {
        attendanceRate: 92,
        unexcusedDaysCount: 2,
        excusedDaysCount: 1,
        lateDaysCount: 2,
        records: [
          {
            date: '2026-10-05',
            dayName: 'الإثنين',
            periodLabel: 'اليوم الدراسي كاملاً',
            status: 'absent',
            isExcused: false,
            justificationReason: 'غياب بدون عذر',
            actionStatus: '✉ تم إشعار ولي الأمر',
          },
          {
            date: '2026-10-12',
            dayName: 'الإثنين',
            periodLabel: 'اليوم الدراسي كاملاً',
            status: 'excused',
            isExcused: true,
            justificationReason: 'تقرير طبي معتمد',
            actionStatus: '✓ عذر معتمد بالملف',
          },
        ],
      },
    };

    const html = generateStudentAbsenceReportHtml(params);

    // Dynamic school profile assertions
    expect(html).toContain('ثانوية الرياض المتطورة النموذجية');
    expect(html).toContain('SCH-RYD-9988');
    expect(html).toContain('1447-1448 هـ');
    expect(html).toContain('د. خالد بن فهد السديري');
    expect(html).toContain('أ. عمر بن صالح العمري');

    // Dynamic student info assertions
    expect(html).toContain('تركي بن عبد العزيز الشمري');
    expect(html).toContain('1098765432');
    expect(html).toContain('10 / أ');

    // Statistics assertions
    expect(html).toContain('%92');
    expect(html).toContain('2 يوم'); // unexcused
    expect(html).toContain('1 يوم'); // excused
    expect(html).toContain('2 مرات'); // late

    // Record rows assertions
    expect(html).toContain('2026-10-05');
    expect(html).toContain('2026-10-12');
    expect(html).toContain('تقرير طبي معتمد');
  });

  it('handles empty records cleanly with a friendly official empty notice', () => {
    const params: StudentAbsenceReportParams = {
      student: mockStudent,
      schoolProfile: mockProfile,
      activeDateRange: {
        label: 'شهر سبتمبر 2026',
        start: '2026-09-01',
        end: '2026-09-30',
      },
      analysis: {
        attendanceRate: 100,
        unexcusedDaysCount: 0,
        excusedDaysCount: 0,
        lateDaysCount: 0,
        records: [],
      },
    };

    const html = generateStudentAbsenceReportHtml(params);
    expect(html).toContain('لا توجد أي أيام غياب أو تأخر مسجلة للطالب خلال هذه الفترة');
    expect(html).toContain('%100');
  });
});

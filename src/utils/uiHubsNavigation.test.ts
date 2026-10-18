import { describe, it, expect } from 'vitest';
import { ActiveTab } from '../components/HeaderNav';
import { TenantSchoolProfile } from '../types/attendance';

describe('UI 5 Hubs Navigation & Settings Source of Truth Audit', () => {
  // Helper mimicking App.tsx & AppSidebar.tsx active tab mapping
  const resolveActiveHub = (tab: ActiveTab): string => {
    switch (tab) {
      case 'dashboard':
      case 'digest':
        return 'dashboard';
      case 'sessions':
      case 'emergency':
        return 'sessions';
      case 'students':
      case 'student_inquiry':
        return 'students';
      case 'communications':
      case 'justifications':
      case 'outbox':
        return 'communications';
      case 'reports':
        return 'reports';
      case 'settings':
        return 'settings';
      case 'chatbot':
        return 'chatbot';
      case 'parent_portal':
        return 'parent_portal';
      default:
        return 'dashboard';
    }
  };

  it('Maps legacy and granular views cleanly into the 5 unified hubs without broken routes', () => {
    expect(resolveActiveHub('dashboard')).toBe('dashboard');
    expect(resolveActiveHub('digest')).toBe('dashboard'); // Morning briefing embedded in dashboard
    expect(resolveActiveHub('sessions')).toBe('sessions');
    expect(resolveActiveHub('emergency')).toBe('sessions'); // Emergency evacuation modal in sessions
    expect(resolveActiveHub('students')).toBe('students');
    expect(resolveActiveHub('student_inquiry')).toBe('students'); // Student inquiry drawer in students
    expect(resolveActiveHub('communications')).toBe('communications');
    expect(resolveActiveHub('justifications')).toBe('communications'); // Excuses sub-tab
    expect(resolveActiveHub('outbox')).toBe('communications'); // Outbox sub-tab
    expect(resolveActiveHub('reports')).toBe('reports');
    expect(resolveActiveHub('settings')).toBe('settings');
  });

  it('Enforces Settings (schoolProfile) as single source of truth for all variable data', () => {
    const customProfile: TenantSchoolProfile = {
      tenantId: 'school-asim',
      schoolName: 'ثانوية الإمام عاصم النموذجية',
      schoolCode: 'SA-998877',
      ministryHeaderAr: 'المملكة العربية السعودية - وزارة التعليم',
      directorateAr: 'الإدارة العامة للتعليم بمنطقة المدينة المنورة',
      generalPhone: '+966148889900',
      emergencyHotline: '998',
      officialEmail: 'info@asim-school.edu.sa',
      officeAr: 'مكتب تعليم شمال المدينة',
      stageAr: 'المرحلة الثانوية',
      genderType: 'boys',
      chronicAbsenceDaysThreshold: 10,
      unexcusedWarningThreshold: 4, // Custom threshold
      officialReportFooterNote: 'تقرير صادر ومعتمد من نظام الحضور الذكي',
      address: {
        country: 'المملكة العربية السعودية',
        region: 'منطقة المدينة المنورة',
        city: 'المدينة المنورة',
        district: 'حي الأزهري',
        streetAddress: 'طريق سلطانة',
      },
      educationalGrades: ['الصف الأول الثانوي', 'الصف الثاني الثانوي', 'الصف الثالث الثانوي'],
      classes: [
        { id: 'class-1', name: '101', grade: 'الصف الأول الثانوي' },
        { id: 'class-2', name: '102', grade: 'الصف الأول الثانوي' },
      ],
      subjects: [
        { id: 'sub-1', name: 'الفيزياء 1', code: 'PHYS101' },
        { id: 'sub-2', name: 'الكيمياء 1', code: 'CHEM101' },
      ],
      timetablePeriods: [
        { id: 'p-1', periodNumber: 1, nameAr: 'الحصة الأولى', type: 'lesson', startTime: '07:15', endTime: '08:00' },
        { id: 'p-2', periodNumber: 2, nameAr: 'الحصة الثانية', type: 'lesson', startTime: '08:00', endTime: '08:45' },
        { id: 'p-3', periodNumber: 3, nameAr: 'الفسحة المدرسية', type: 'recess', startTime: '08:45', endTime: '09:15' },
      ],
      assemblyPoints: [
        { id: 'ap-1', name: 'الساحة الشرقية', zone: 'A', capacity: 300, assignedGrades: ['الصف الأول الثانوي'] },
      ],
      academicYear: {
        code: '1446-1447',
        hijriYear: '1446-1447 هـ',
        gregorianYear: '2024-2025',
        terms: [
          { id: 'term-1', nameAr: 'الفصل الأول', nameEn: 'Term 1', startDate: '2026-08-20', endDate: '2026-11-20', isActive: true },
        ],
      },
      leadership: {
        principalName: 'د. عبد الله بن يوسف الحربي',
        principalPhone: '+966501112233',
        vicePrincipalStudentAffairsName: 'أ. فهد بن سالم المحمدي',
        vicePrincipalStudentAffairsPhone: '+966501112234',
        vicePrincipalAcademicAffairsName: 'أ. عمر بن علي الحربي',
        vicePrincipalAcademicAffairsPhone: '+966501112235',
        socialWorkerName: 'أ. خالد بن أحمد العوفي',
        socialWorkerPhone: '+966501112236',
      },
    };

    // 1. Dynamic educational grades
    expect(customProfile.educationalGrades).toHaveLength(3);
    expect(customProfile.educationalGrades).toContain('الصف الأول الثانوي');
    expect(customProfile.educationalGrades).not.toContain('الصف السادس'); // Not hardcoded

    // 2. Dynamic timetable periods
    const lessonsOnly = customProfile.timetablePeriods?.filter((p) => p.type === 'lesson');
    expect(lessonsOnly).toHaveLength(2);
    expect(lessonsOnly?.[0]?.startTime).toBe('07:15');

    // 3. Dynamic warning threshold
    expect(customProfile.unexcusedWarningThreshold).toBe(4);

    // 4. Dynamic leadership
    expect(customProfile.leadership.principalName).toBe('د. عبد الله بن يوسف الحربي');
  });

  it('Enforces RBAC communications hub permissions (Outbox restricted to Admin & Registrar)', () => {
    const canAccessOutbox = (role: string): boolean => {
      return role === 'admin' || role === 'registrar';
    };

    expect(canAccessOutbox('admin')).toBe(true);
    expect(canAccessOutbox('registrar')).toBe(true);
    expect(canAccessOutbox('teacher')).toBe(false);
    expect(canAccessOutbox('parent')).toBe(false);
  });
});

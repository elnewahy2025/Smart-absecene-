import type { Tenant } from '../../types/attendance';

export const INITIAL_TENANTS: Tenant[] = [
  {
    id: 'school-1',
    name: 'مدرسة الأندلس الثانوية النموذجية',
    code: 'ANDALUS-101',
    city: 'الرياض',
    academicYear: '1447-1448 هـ / 2026 م',
    currentTerm: 'الفصل الدراسي الأول',
    schoolType: 'boys',
  },
  {
    id: 'school-2',
    name: 'مدرسة الفلاح المتوسطة الحديثة',
    code: 'FALAH-202',
    city: 'جدة',
    academicYear: '1447-1448 هـ / 2026 م',
    currentTerm: 'الفصل الدراسي الأول',
    schoolType: 'boys',
  },
  {
    id: 'school-majd',
    name: 'مدارس المجد الأهلية النموذجية',
    code: 'MAJD-301',
    city: 'الرياض',
    academicYear: '1447-1448 هـ / 2026 م',
    currentTerm: 'الفصل الدراسي الأول',
    schoolType: 'boys',
  },
];

import { describe, it, expect } from 'vitest';
import { AcademicTerm, TenantSchoolProfile } from '../types/attendance';
import { DEFAULT_TENANT_PROFILES } from '../config/tenantSettings';

describe('Academic Calendar & Terms Persistence Logic', () => {
  it('updates term dates and retains name and active status', () => {
    const initialTerms: AcademicTerm[] = [
      { id: 'term-1', nameAr: 'الفصل الدراسي الأول', nameEn: 'Term 1', startDate: '2024-08-18', endDate: '2024-11-07', isActive: true },
      { id: 'term-2', nameAr: 'الفصل الدراسي الثاني', nameEn: 'Term 2', startDate: '2024-11-17', endDate: '2025-02-20', isActive: false },
    ];

    const updated = initialTerms.map((t) =>
      t.id === 'term-1'
        ? { ...t, startDate: '2024-08-25', endDate: '2024-11-14' }
        : t
    );

    expect(updated[0].startDate).toBe('2024-08-25');
    expect(updated[0].endDate).toBe('2024-11-14');
    expect(updated[0].nameAr).toBe('الفصل الدراسي الأول');
    expect(updated[0].isActive).toBe(true);
    expect(updated[1].startDate).toBe('2024-11-17');
  });

  it('correctly sets active term and deactivates others', () => {
    const terms: AcademicTerm[] = [
      { id: 'term-1', nameAr: 'الفصل الأول', nameEn: 'Term 1', startDate: '2024-08-18', endDate: '2024-11-07', isActive: true },
      { id: 'term-2', nameAr: 'الفصل الثاني', nameEn: 'Term 2', startDate: '2024-11-17', endDate: '2025-02-20', isActive: false },
      { id: 'term-3', nameAr: 'الفصل الثالث', nameEn: 'Term 3', startDate: '2025-03-02', endDate: '2025-06-26', isActive: false },
    ];

    const switched = terms.map((t) => ({
      ...t,
      isActive: t.id === 'term-2',
    }));

    expect(switched.find((t) => t.id === 'term-2')?.isActive).toBe(true);
    expect(switched.filter((t) => t.isActive).length).toBe(1);
    expect(switched.find((t) => t.id === 'term-1')?.isActive).toBe(false);
  });

  it('merges new profile updates into existing TenantSchoolProfile without data loss', () => {
    const baseProfile: TenantSchoolProfile = DEFAULT_TENANT_PROFILES['school-1'];
    expect(baseProfile).toBeDefined();

    const partialUpdate: Partial<TenantSchoolProfile> = {
      academicYear: {
        ...baseProfile.academicYear,
        terms: [
          { id: 'term-1', nameAr: 'الفصل الدراسي الأول المحدث', nameEn: 'Term 1', startDate: '2024-08-20', endDate: '2024-11-10', isActive: true },
        ],
      },
    };

    const merged: TenantSchoolProfile = {
      ...baseProfile,
      ...partialUpdate,
      academicYear: {
        ...baseProfile.academicYear,
        ...(partialUpdate.academicYear || {}),
      },
    };

    expect(merged.academicYear.terms[0].nameAr).toBe('الفصل الدراسي الأول المحدث');
    expect(merged.schoolName).toBe(baseProfile.schoolName);
    expect(merged.schoolCode).toBe(baseProfile.schoolCode);
    expect(merged.leadership.principalName).toBe(baseProfile.leadership.principalName);
  });
});

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

  it('manages educational grade levels (adding, editing, removing) and links to classes', () => {
    const baseProfile: TenantSchoolProfile = DEFAULT_TENANT_PROFILES['school-1'];
    const currentGrades = baseProfile.educationalGrades || ['الصف العاشر'];

    // 1. Add new grades e.g. "الصف السادس", "الصف السابع"
    const newGradesToAdd = ['الصف السادس', 'الصف السابع'];
    const updatedGrades = [...currentGrades];
    newGradesToAdd.forEach((g) => {
      if (!updatedGrades.includes(g)) updatedGrades.push(g);
    });

    expect(updatedGrades).toContain('الصف السادس');
    expect(updatedGrades).toContain('الصف السابع');

    // 2. Assign a new class to "الصف السادس"
    const newClass = {
      id: 'class-6a',
      name: '6 / أ',
      grade: 'الصف السادس',
      room: 'قاعة 101',
      capacity: 30,
    };

    expect(updatedGrades).toContain(newClass.grade);

    // 3. Edit grade name
    const editedGrades = updatedGrades.map((g) => (g === 'الصف السادس' ? 'الصف السادس الابتدائي' : g));
    expect(editedGrades).toContain('الصف السادس الابتدائي');
    expect(editedGrades).not.toContain('الصف السادس');

    // 4. Remove grade
    const afterRemoval = editedGrades.filter((g) => g !== 'الصف السابع');
    expect(afterRemoval).not.toContain('الصف السابع');
  });

  it('manages daily timetable periods (assembly, lesson, recess, prayer)', () => {
    const baseProfile: TenantSchoolProfile = DEFAULT_TENANT_PROFILES['school-1'];
    const periods = baseProfile.timetablePeriods || [];

    expect(periods.length).toBeGreaterThan(0);
    const lessonPeriods = periods.filter((p) => p.type === 'lesson');
    expect(lessonPeriods.length).toBeGreaterThanOrEqual(5);

    // Add new period
    const newPeriod = {
      id: 'p-extra',
      periodNumber: periods.length,
      nameAr: 'حصة إثرائية',
      startTime: '13:15',
      endTime: '14:00',
      type: 'lesson' as const,
    };
    const updatedPeriods = [...periods, newPeriod];
    expect(updatedPeriods.length).toBe(periods.length + 1);

    // Update times
    const modified = updatedPeriods.map((p) =>
      p.id === 'p-extra' ? { ...p, startTime: '13:20', endTime: '14:05' } : p
    );
    expect(modified.find((p) => p.id === 'p-extra')?.startTime).toBe('13:20');

    // Delete period
    const filtered = modified.filter((p) => p.id !== 'p-extra');
    expect(filtered.length).toBe(periods.length);
  });
});

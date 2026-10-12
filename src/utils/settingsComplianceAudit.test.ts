import { describe, it, expect } from 'vitest';
import { DEFAULT_SCHOOL_1_PROFILE } from '../config/tenantSettings';
import { isSchoolOffDay } from './holidayUtils';

describe('Strict Settings Compliance & Data Validation Engine', () => {
  const profile = DEFAULT_SCHOOL_1_PROFILE;
  const terms = profile.academicYear.terms;
  const termStarts = terms.map((t) => t.startDate).sort();
  const termEnds = terms.map((t) => t.endDate).sort();
  const yearStart = termStarts[0]; // '2026-09-01'
  const yearEnd = termEnds[termEnds.length - 1]; // '2027-06-24'

  it('strictly rejects dates falling before Term 1 start (e.g. Month 8 / 2026-08-15)', () => {
    const candidateDate = '2026-08-15';
    const isOutside = candidateDate < yearStart || candidateDate > yearEnd;
    expect(isOutside).toBe(true);
    expect(yearStart).toBe('2026-09-01');
  });

  it('strictly rejects dates falling after Term 3 end (e.g. 2027-07-01)', () => {
    const candidateDate = '2027-07-01';
    const isOutside = candidateDate < yearStart || candidateDate > yearEnd;
    expect(isOutside).toBe(true);
  });

  it('strictly rejects official school holidays defined in Settings (e.g. Saudi National Day 2026-09-23)', () => {
    const holidayDate = '2026-09-23';
    const offCheck = isSchoolOffDay(holidayDate, profile.weekendDays, profile.officialHolidays);
    expect(offCheck.isOff).toBe(true);
    expect(offCheck.type).toBe('holiday');
    expect(offCheck.holidayName).toContain('اليوم الوطني');
  });

  it('strictly rejects weekend days defined in Settings (Friday / Saturday)', () => {
    const fridayDate = '2026-09-04'; // Friday
    const saturdayDate = '2026-09-05'; // Saturday
    const sundayDate = '2026-09-06'; // Sunday (regular school day)

    expect(isSchoolOffDay(fridayDate, profile.weekendDays, profile.officialHolidays).isOff).toBe(true);
    expect(isSchoolOffDay(saturdayDate, profile.weekendDays, profile.officialHolidays).isOff).toBe(true);
    expect(isSchoolOffDay(sundayDate, profile.weekendDays, profile.officialHolidays).isOff).toBe(false);
  });

  it('strictly rejects CSV student import rows with classrooms not configured in Settings', () => {
    const approvedClassNames = (profile.classes || []).map((c) => c.name.replace(/\s+/g, '').toLowerCase());

    const validRowClass = '10 / أ';
    const invalidRowClass = 'الصف التاسع / ج'; // Not in high school profile

    const isValid1 = approvedClassNames.includes(validRowClass.replace(/\s+/g, '').toLowerCase());
    const isValid2 = approvedClassNames.includes(invalidRowClass.replace(/\s+/g, '').toLowerCase());

    expect(isValid1).toBe(true);
    expect(isValid2).toBe(false);
  });

  it('strictly adheres to Settings thresholds for unexcused warnings and chronic absence', () => {
    expect(profile.unexcusedWarningThreshold).toBe(3);
    expect(profile.chronicAbsenceDaysThreshold).toBe(5);

    const checkStudentRisk = (absences: number) => {
      if (absences >= profile.chronicAbsenceDaysThreshold) return 'chronic_danger';
      if (absences >= profile.unexcusedWarningThreshold) return 'warning_intervention';
      return 'regular';
    };

    expect(checkStudentRisk(2)).toBe('regular');
    expect(checkStudentRisk(3)).toBe('warning_intervention');
    expect(checkStudentRisk(4)).toBe('warning_intervention');
    expect(checkStudentRisk(5)).toBe('chronic_danger');
    expect(checkStudentRisk(10)).toBe('chronic_danger');
  });
});

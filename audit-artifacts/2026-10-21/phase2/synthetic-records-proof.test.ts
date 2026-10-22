import { describe, expect, it } from 'vitest';
import { buildStudentAbsenceAnalysis } from '../../../src/utils/studentAbsenceAnalysis';

describe('corrected behaviour: zero synthetic records', () => {
  it('does not fabricate absence/late records when no session records exist', () => {
    const student: any = {
      id: 's1',
      className: '10A',
      totalAbsences: 3,
      totalLates: 1,
      attendanceRate: 90,
    };

    const result = buildStudentAbsenceAnalysis({
      student,
      sessions: [],
      justifications: [],
      horizonType: 'full_year',
      selectedMonth: '2026-10',
      selectedTermId: 'term-1',
      activeDateRange: { start: '2026-09-01', end: '2026-10-31', label: 'range' },
      academicYearBounds: { start: '2026-08-01', end: '2027-06-30' },
      customDateValidation: { isValid: true, error: null },
      isAr: false,
      getArabicDayName: () => 'Sunday',
      getSchoolDaysInRange: () => [
        '2026-09-06',
        '2026-09-07',
        '2026-09-08',
        '2026-09-09',
        '2026-09-10',
        '2026-09-13',
        '2026-09-14',
        '2026-09-15',
      ],
    } as any);

    expect(result).not.toBeNull();
    expect(result!.records.length).toBe(0);
    expect(result!.absentDaysCount).toBe(0);
    expect(result!.lateDaysCount).toBe(0);
  });
});

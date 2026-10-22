import { describe, expect, it } from 'vitest';
import type { SchoolClassSummary, Student, TenantSchoolProfile } from '../types/attendance';
import {
  buildStudentImportErrorReport,
  buildStudentImportTemplate,
  parseCsvLine,
  validateStudentImportRows,
} from './studentImport';

function makeStudent(overrides: Partial<Student> = {}): Student {
  return {
    id: 'std-1',
    tenantId: 'school-1',
    studentNumber: '20260001',
    nationalId: '3000000001',
    fullName: 'طالب موجود',
    grade: 'الصف العاشر',
    className: '10 / أ',
    classId: 'class-10a',
    guardianName: 'ولي الأمر',
    guardianPhone: '+966500000001',
    guardianRelationship: 'father',
    totalAbsences: 0,
    totalLates: 0,
    attendanceRate: 100,
    ...overrides,
  } as Student;
}

const schoolProfile = {
  classes: [
    { id: 'c1', name: '10 / أ', grade: 'الصف العاشر' },
    { id: 'c2', name: '10 / ب', grade: 'الصف العاشر' },
  ],
} as unknown as TenantSchoolProfile;

const classesStats: SchoolClassSummary[] = [
  {
    className: '10 / أ',
    grade: 'الصف العاشر',
    classId: 'class-10a',
    totalStudents: 0,
    activeStudents: 0,
    transferredStudents: 0,
    attendanceRate: 0,
    assignedTeachersCount: 0,
  },
];

const HEADER = 'الرقم المدرسي,السجل المدني,اسم الطالب,المرحلة,الفصل,ولي الأمر,الهاتف,فصيلة الدم';

function validate(csv: string, students: Student[] = []) {
  return validateStudentImportRows(csv, { students, schoolProfile, classesStats });
}

describe('parseCsvLine', () => {
  it('splits comma separated values and trims them', () => {
    expect(parseCsvLine(' a , b ,c ')).toEqual(['a', 'b', 'c']);
  });

  it('keeps commas inside quoted fields', () => {
    expect(parseCsvLine('"مدرسة المجد, القسم الثانوي",ب')).toEqual([
      'مدرسة المجد, القسم الثانوي',
      'ب',
    ]);
  });

  it('supports semicolon delimited lines', () => {
    expect(parseCsvLine('a;b;c')).toEqual(['a', 'b', 'c']);
  });

  it('does not treat semicolons as delimiters when commas are present', () => {
    expect(parseCsvLine('a;b,c')).toEqual(['a;b', 'c']);
  });
});

describe('buildStudentImportTemplate', () => {
  it('builds a BOM prefixed CSV with one row per configured class', () => {
    const csv = buildStudentImportTemplate(schoolProfile);

    expect(csv.startsWith('\uFEFF')).toBe(true);
    expect(csv).toContain(HEADER);
    expect(csv).toContain('الصف العاشر,10 / أ');
    expect(csv).toContain('الصف العاشر,10 / ب');
    expect(csv.trim().split('\n')).toHaveLength(3);
  });

  it('falls back to a default class when no classes are configured', () => {
    const csv = buildStudentImportTemplate({} as TenantSchoolProfile);

    expect(csv).toContain('الصف العاشر,10 / أ');
    expect(csv.trim().split('\n')).toHaveLength(2);
  });
});

describe('validateStudentImportRows', () => {
  it('parses a valid row and numbers it after the header', () => {
    const rows = validate(`${HEADER}\n20260009,3000000009,سعد الحربي,الصف العاشر,10 / أ,أحمد,+966500000009,O+`);

    expect(rows).toHaveLength(1);
    expect(rows[0]).toMatchObject({
      rowNumber: 2,
      fullName: 'سعد الحربي',
      nationalId: '3000000009',
      studentNumber: '20260009',
      grade: 'الصف العاشر',
      className: '10 / أ',
      guardianName: 'أحمد',
      guardianPhone: '+966500000009',
      bloodType: 'O+',
      isValid: true,
    });
    expect(rows[0].errorReason).toBeUndefined();
  });

  it('numbers rows from 1 when the file has no header', () => {
    const rows = validate('20260009,3000000009,سعد الحربي,الصف العاشر,10 / أ,أحمد,+966500000009,O+');

    expect(rows[0].rowNumber).toBe(1);
    expect(rows[0].isValid).toBe(true);
  });

  it('maps reordered header columns by name', () => {
    const csv = [
      'اسم الطالب,الفصل,المرحلة,السجل المدني,الرقم المدرسي,ولي الأمر,الهاتف,فصيلة الدم',
      'سعد الحربي,10 / أ,الصف العاشر,3000000009,20260009,أحمد,+966500000009,O+',
    ].join('\n');

    const [row] = validate(csv);
    expect(row).toMatchObject({
      fullName: 'سعد الحربي',
      className: '10 / أ',
      grade: 'الصف العاشر',
      nationalId: '3000000009',
      studentNumber: '20260009',
    });
    expect(row.isValid).toBe(true);
  });

  it('parses semicolon delimited files', () => {
    const [row] = validate('20260009;3000000009;سعد الحربي;الصف العاشر;10 / أ;أحمد;+966500000009;O+');

    expect(row.isValid).toBe(true);
    expect(row.fullName).toBe('سعد الحربي');
  });

  it('falls back to the first class stats for missing grade and class', () => {
    const [row] = validate(',3000000009,سعد الحربي');

    expect(row.grade).toBe('الصف العاشر');
    expect(row.className).toBe('10 / أ');
    expect(row.isValid).toBe(true);
  });

  it('rejects rows without a student name', () => {
    const [row] = validate('20260009,3000000009,,الصف العاشر,10 / أ,أحمد,+966500000009,O+');

    expect(row.isValid).toBe(false);
    expect(row.errorReason).toBe('اسم الطالب مفقود أو فارغ');
  });

  it('rejects rows without a national id and student number', () => {
    const [row] = validate(',,سعد الحربي,الصف العاشر,10 / أ,أحمد,+966500000009,O+');

    expect(row.isValid).toBe(false);
    expect(row.errorReason).toBe('السجل المدني والرقم المدرسي كلاهما مفقود');
  });

  it('rejects national ids already registered in the school', () => {
    const [row] = validate(
      '20260009,3000000001,سعد الحربي,الصف العاشر,10 / أ,أحمد,+966500000009,O+',
      [makeStudent()]
    );

    expect(row.isValid).toBe(false);
    expect(row.errorReason).toContain('مسجل مسبقاً بالمدرسة');
  });

  it('rejects student numbers already registered in the school', () => {
    const [row] = validate(
      '20260001,3000000009,سعد الحربي,الصف العاشر,10 / أ,أحمد,+966500000009,O+',
      [makeStudent()]
    );

    expect(row.isValid).toBe(false);
    expect(row.errorReason).toContain('الرقم المدرسي (20260001) مسجل مسبقاً');
  });

  it('rejects duplicates inside the same file', () => {
    const csv = [
      HEADER,
      '20260009,3000000009,سعد الحربي,الصف العاشر,10 / أ,أحمد,+966500000009,O+',
      '20260010,3000000009,خالد,الصف العاشر,10 / أ,أحمد,+966500000010,O+',
    ].join('\n');

    const rows = validate(csv);
    expect(rows[0].isValid).toBe(true);
    expect(rows[1].isValid).toBe(false);
    expect(rows[1].errorReason).toBe('سجل مكرر أكثر من مرة داخل نفس الملف المرفوع');
  });

  it('rejects classes that are not configured in the school settings', () => {
    const [row] = validate('20260009,3000000009,سعد الحربي,الصف العاشر,10 / ج,أحمد,+966500000009,O+');

    expect(row.isValid).toBe(false);
    expect(row.errorReason).toContain('مخالف لصفحة الإعدادات');
    expect(row.errorReason).toContain('10 / ج');
  });

  it('rejects grades that conflict with the configured class grade', () => {
    const [row] = validate('20260009,3000000009,سعد الحربي,الصف الحادي عشر,10 / أ,أحمد,+966500000009,O+');

    expect(row.isValid).toBe(false);
    expect(row.errorReason).toContain('تخالف المرحلة المعتمدة للفصل');
  });

  it('ignores blank lines and single column lines', () => {
    const csv = [HEADER, '', '20260009,3000000009,سعد الحربي,الصف العاشر,10 / أ,أحمد,+966500000009,O+', 'فقط'].join('\n');

    expect(validate(csv)).toHaveLength(1);
  });
});

describe('buildStudentImportErrorReport', () => {
  it('returns an empty string when every row is valid', () => {
    const rows = validate(`${HEADER}\n20260009,3000000009,سعد الحربي,الصف العاشر,10 / أ,أحمد,+966500000009,O+`);

    expect(buildStudentImportErrorReport(rows)).toBe('');
  });

  it('builds a BOM prefixed report with quoted rejected rows', () => {
    const rows = validate(`${HEADER}\n20260009,3000000009,,الصف العاشر,10 / أ,أحمد,+966500000009,O+`);
    const report = buildStudentImportErrorReport(rows);

    expect(report.startsWith('\uFEFF')).toBe(true);
    expect(report).toContain('رقم الصف في الملف,اسم الطالب,السجل المدني,الرقم المدرسي,سبب الاستبعاد والخطأ');
    expect(report).toContain('2,"","3000000009","20260009","اسم الطالب مفقود أو فارغ"');
  });
});

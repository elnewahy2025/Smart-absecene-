import type { SchoolClassSummary, Student, TenantSchoolProfile } from '../types/attendance';

export const SAMPLE_IMPORT_TEXT = `الرقم المدرسي,السجل المدني,اسم الطالب,المرحلة,الفصل,ولي الأمر,الهاتف,فصيلة الدم
20260001,3000000001,فيصل بن منصور الحربي,الصف العاشر,10 / أ,منصور الحربي,+966500000001,O+
20260002,3000000002,بدر بن عبد الله الرشيد,الصف العاشر,10 / أ,عبد الله الرشيد,+966500000002,A+
20260003,3000000003,يوسف بن خالد المطيري,الصف العاشر,10 / أ,خالد المطيري,+966500000003,O+
20260004,,سعود بن نايف الشمري,الصف العاشر,10 / ب,نايف الشمري,+966500000004,B+
20260005,3000000005,تركي بن فهد السبيعي,الصف العاشر,10 / ب,فهد السبيعي,+966500000005,AB+
20260006,3000000002,مشعل بن إبراهيم التميمي,الصف العاشر,10 / ب,إبراهيم التميمي,+966500000006,A-`;

export interface ParsedImportRow {
  rowNumber: number;
  fullName: string;
  nationalId: string;
  studentNumber: string;
  grade: string;
  className: string;
  guardianName: string;
  guardianPhone: string;
  bloodType?: string;
  isValid: boolean;
  errorReason?: string;
}

/** Builds the official CSV template (with BOM) from the configured school classes. */
export function buildStudentImportTemplate(schoolProfile: TenantSchoolProfile | undefined): string {
  const configuredClasses = schoolProfile?.classes && schoolProfile.classes.length > 0
    ? schoolProfile.classes
    : [{ name: '10 / أ', grade: 'الصف العاشر' }];

  const templateRows = configuredClasses.map((cls, idx) =>
    `2026030${idx + 1},109811122${idx + 1},طالب تجريبي ${idx + 1},${cls.grade},${cls.name},ولي أمر الطالب ${idx + 1},+96650111223${idx},O+`
  ).join('\n');

  const csvContent =
    '\uFEFF' +
    `الرقم المدرسي,السجل المدني,اسم الطالب,المرحلة,الفصل,ولي الأمر,الهاتف,فصيلة الدم\n${templateRows}`;
  return csvContent;
}

  export const parseCsvLine = (line: string): string[] => {
    const result: string[] = [];
    let current = '';
    let inQuotes = false;

    // Support both comma and semicolon delimiters
    const delimiter = line.includes(';') && !line.includes(',') ? ';' : ',';

    for (let i = 0; i < line.length; i++) {
      const char = line[i];
      if (char === '"') {
        inQuotes = !inQuotes;
      } else if (char === delimiter && !inQuotes) {
        result.push(current.trim().replace(/^"|"$/g, ''));
        current = '';
      } else {
        current += char;
      }
    }
    result.push(current.trim().replace(/^"|"$/g, ''));
    return result;
  };

/** Validates CSV rows against existing students and the configured school classes. */
export function validateStudentImportRows(
  rawCsvText: string,
  context: {
    students: Student[];
    schoolProfile?: TenantSchoolProfile;
    classesStats: SchoolClassSummary[];
  }
): ParsedImportRow[] {
  const { students, schoolProfile, classesStats } = context;
    const lines = rawCsvText.trim().split(/\r?\n/).filter((l) => l.trim().length > 0);
    const rowsToValidate: ParsedImportRow[] = [];

    // Existing IDs for duplicate check in current school
    const existingNatIds = new Set(students.map((s) => s.nationalId));
    const existingStdNums = new Set(students.map((s) => s.studentNumber));
    const seenInThisFile = new Set<string>();

    let headerIndex = -1;
    let colIndices = {
      studentNumber: 0,
      nationalId: 1,
      fullName: 2,
      grade: 3,
      className: 4,
      guardianName: 5,
      guardianPhone: 6,
      bloodType: 7,
    };

    // Detect headers if present
    if (lines.length > 0) {
      const firstLineParts = parseCsvLine(lines[0]);
      const isHeader = firstLineParts.some(
        (p) =>
          p.includes('اسم') ||
          p.includes('Name') ||
          p.includes('الرقم') ||
          p.includes('Number') ||
          p.includes('السجل') ||
          p.includes('ID')
      );

      if (isHeader) {
        headerIndex = 0;
        // Dynamically map column positions
        firstLineParts.forEach((p, idx) => {
          const clean = p.toLowerCase();
          if (clean.includes('مدرسي') || clean.includes('رقم مدرسي') || clean.includes('student no') || clean.includes('student_number')) colIndices.studentNumber = idx;
          else if (clean.includes('سجل') || clean.includes('national') || clean.includes('id')) colIndices.nationalId = idx;
          else if (clean.includes('اسم') || clean.includes('name')) colIndices.fullName = idx;
          else if (clean.includes('مرحلة') || clean.includes('grade')) colIndices.grade = idx;
          else if (clean.includes('فصل') || clean.includes('class') || clean.includes('section')) colIndices.className = idx;
          else if (clean.includes('ولي') || clean.includes('guardian') || clean.includes('parent')) colIndices.guardianName = idx;
          else if (clean.includes('هاتف') || clean.includes('جوال') || clean.includes('phone')) colIndices.guardianPhone = idx;
          else if (clean.includes('دم') || clean.includes('blood')) colIndices.bloodType = idx;
        });
      }
    }

    const dataLines = headerIndex === 0 ? lines.slice(1) : lines;

    const approvedClasses = (schoolProfile?.classes || []).map((c) => ({
      name: c.name.trim(),
      normalized: c.name.replace(/\s+/g, '').toLowerCase(),
      grade: c.grade.trim(),
      id: c.id,
    }));

    dataLines.forEach((line, index) => {
      const parts = parseCsvLine(line);
      if (parts.length < 2) return;

      const studentNumber = parts[colIndices.studentNumber] || '';
      const nationalId = parts[colIndices.nationalId] || '';
      const fullName = parts[colIndices.fullName] || '';
      const grade = parts[colIndices.grade] || classesStats[0]?.grade || 'المرحلة الدراسية';
      const className = parts[colIndices.className] || classesStats[0]?.className || 'غير محدد';
      const guardianName = parts[colIndices.guardianName] || 'ولي أمر الطالب';
      const guardianPhone = parts[colIndices.guardianPhone] || '';
      const bloodType = parts[colIndices.bloodType] || '';

      const normalizedClass = className.replace(/\s+/g, '').toLowerCase();
      const matchedConfiguredClass = approvedClasses.find(
        (c) => c.normalized === normalizedClass || c.name === className.trim()
      );

      let isValid = true;
      let errorReason: string | undefined = undefined;

      if (!fullName) {
        isValid = false;
        errorReason = 'اسم الطالب مفقود أو فارغ';
      } else if (!nationalId && !studentNumber) {
        isValid = false;
        errorReason = 'السجل المدني والرقم المدرسي كلاهما مفقود';
      } else if (nationalId && existingNatIds.has(nationalId)) {
        isValid = false;
        errorReason = `السجل المدني (${nationalId}) مسجل مسبقاً بالمدرسة (مكرر)`;
      } else if (studentNumber && existingStdNums.has(studentNumber)) {
        isValid = false;
        errorReason = `الرقم المدرسي (${studentNumber}) مسجل مسبقاً بالمدرسة (مكرر)`;
      } else if ((nationalId && seenInThisFile.has(nationalId)) || (studentNumber && seenInThisFile.has(studentNumber))) {
        isValid = false;
        errorReason = 'سجل مكرر أكثر من مرة داخل نفس الملف المرفوع';
      } else if (!matchedConfiguredClass) {
        isValid = false;
        errorReason = `مخالف لصفحة الإعدادات: الفصل الدراسي (${className}) غير مسجل في فصول المدرسة المعتمدة`;
      } else if (grade && grade !== 'المرحلة الدراسية' && matchedConfiguredClass.grade !== grade.trim()) {
        isValid = false;
        errorReason = `مخالف لصفحة الإعدادات: المرحلة (${grade}) تخالف المرحلة المعتمدة للفصل في الإعدادات (${matchedConfiguredClass.grade})`;
      }

      if (nationalId) seenInThisFile.add(nationalId);
      if (studentNumber) seenInThisFile.add(studentNumber);

      rowsToValidate.push({
        rowNumber: index + (headerIndex === 0 ? 2 : 1),
        fullName,
        nationalId,
        studentNumber,
        grade,
        className,
        guardianName,
        guardianPhone,
        bloodType,
        isValid,
        errorReason,
      });
    });

  return rowsToValidate;
}

/** Builds the CSV error report (with BOM) for the rejected rows. */
export function buildStudentImportErrorReport(validatedRows: ParsedImportRow[]): string {
  const errorRows = validatedRows.filter((r) => !r.isValid);
  if (errorRows.length === 0) return '';

    const headers = ['رقم الصف في الملف', 'اسم الطالب', 'السجل المدني', 'الرقم المدرسي', 'سبب الاستبعاد والخطأ'];
    const rows = errorRows.map((r) => [
      r.rowNumber,
      `"${r.fullName}"`,
      `"${r.nationalId}"`,
      `"${r.studentNumber}"`,
      `"${r.errorReason}"`,
    ]);

    const csvContent = '\uFEFF' + [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
  return csvContent;
}

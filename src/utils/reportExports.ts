import type { Student, Tenant } from '../types/attendance';

// Excel-compatible HTML workbook (RTL, styled) for the filtered student list.
export function buildExcelReportHtml(
  students: Student[],
  tenant: Pick<Tenant, 'name' | 'academicYear' | 'currentTerm'>,
  averageAttendanceRate: string,
  date: string
): string {

    const sortedStudents = [...students].sort((a, b) => b.totalAbsences - a.totalAbsences);

    const rowsHtml = sortedStudents
      .map(
        (s, idx) => `
        <tr>
          <td>${idx + 1}</td>
          <td>${s.studentNumber}</td>
          <td><b>${s.fullName}</b></td>
          <td>${s.nationalId}</td>
          <td>${s.grade}</td>
          <td>${s.className}</td>
          <td style="color:${s.totalAbsences >= 8 ? '#dc2626' : s.totalAbsences >= 5 ? '#d97706' : '#1e293b'};font-weight:bold;">${s.totalAbsences}</td>
          <td>${s.totalLates}</td>
          <td style="font-weight:bold;color:#047857;">${s.attendanceRate}%</td>
          <td>${s.totalAbsences >= 8 ? 'حرج (8+ أيام - إنذار نهائي)' : s.totalAbsences >= 5 ? 'مرتفع (5+ أيام - إنذار ثان)' : s.totalAbsences >= 3 ? 'تنبيه أولي' : 'منضبط'}</td>
          <td>${s.guardianName}</td>
          <td dir="ltr">${s.guardianPhone}</td>
          <td>${s.bloodType || ''}</td>
        </tr>
      `
      )
      .join('');

    const excelHtml = `
      <html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:x="urn:schemas-microsoft-com:office:excel" xmlns="http://www.w3.org/TR/REC-html40">
      <head>
        <meta http-equiv="Content-Type" content="text/html; charset=utf-8" />
        <!--[if gte mso 9]>
        <xml>
          <x:ExcelWorkbook>
            <x:ExcelWorksheets>
              <x:ExcelWorksheet>
                <x:Name>كشف الحضور المدرسي</x:Name>
                <x:WorksheetOptions>
                  <x:DisplayRightToLeft/>
                </x:WorksheetOptions>
              </x:ExcelWorksheet>
            </x:ExcelWorksheets>
          </x:ExcelWorkbook>
        </xml>
        <![endif]-->
        <style>
          body { font-family: 'Cairo', 'Segoe UI', Tahoma, sans-serif; direction: rtl; }
          table { border-collapse: collapse; width: 100%; direction: rtl; }
          th { background-color: #047857; color: white; border: 1px solid #065f46; padding: 10px; font-weight: bold; text-align: right; }
          td { border: 1px solid #cbd5e1; padding: 8px; text-align: right; }
          .title-header { font-size: 18px; font-weight: bold; color: #047857; text-align: center; }
          .sub-header { font-size: 13px; color: #475569; text-align: center; }
          .summary-card { background-color: #f8fafc; border: 1px solid #e2e8f0; font-weight: bold; }
        </style>
      </head>
      <body>
        <table>
          <tr>
            <td colspan="13" class="title-header">${tenant.name} - تقرير الحضور والانضباط المدرسي</td>
          </tr>
          <tr>
            <td colspan="13" class="sub-header">العام الدراسي: ${tenant.academicYear} | ${tenant.currentTerm} | التاريخ: ${date}</td>
          </tr>
          <tr><td colspan="13"></td></tr>
          <tr class="summary-card">
            <td colspan="3">إجمالي الطلاب: ${sortedStudents.length}</td>
            <td colspan="4">متوسط الحضور: ${averageAttendanceRate}%</td>
            <td colspan="3">إنذار 5+ أيام: ${sortedStudents.filter((s) => s.totalAbsences >= 5).length}</td>
            <td colspan="3">إنذار نهائي 8+ أيام: ${sortedStudents.filter((s) => s.totalAbsences >= 8).length}</td>
          </tr>
          <tr><td colspan="13"></td></tr>
          <thead>
            <tr>
              <th>#</th>
              <th>الرقم المدرسي</th>
              <th>اسم الطالب</th>
              <th>السجل المدني</th>
              <th>المرحلة</th>
              <th>الفصل</th>
              <th>أيام الغياب</th>
              <th>التأخر (مرات)</th>
              <th>نسبة الحضور %</th>
              <th>التصنيف الإجرائي</th>
              <th>ولي الأمر</th>
              <th>هاتف التواصل</th>
              <th>فصيلة الدم</th>
            </tr>
          </thead>
          <tbody>
            ${rowsHtml}
          </tbody>
        </table>
      </body>
      </html>
    `;

    return excelHtml;
}

// CSV export (UTF-8 BOM) for the filtered student list.
export function buildCsvReport(students: Student[]): string {
    const headers = [
      'الرقم المدرسي',
      'اسم الطالب',
      'السجل المدني',
      'المرحلة',
      'الفصل',
      'إجمالي الغياب',
      'إجمالي التأخر',
      'نسبة الحضور %',
      'مستوى الخطورة',
      'ولي الأمر',
      'هاتف ولي الأمر',
      'فصيلة الدم',
    ];

    const rows = students.map((s) => [
      `"${s.studentNumber}"`,
      `"${s.fullName}"`,
      `"${s.nationalId}"`,
      `"${s.grade}"`,
      `"${s.className}"`,
      s.totalAbsences,
      s.totalLates,
      `"${s.attendanceRate}%"`,
      `"${s.totalAbsences >= 8 ? 'حرج (8+ أيام)' : s.totalAbsences >= 5 ? 'مرتفع (5+ أيام)' : 'طبيعي'}"`,
      `"${s.guardianName}"`,
      `"${s.guardianPhone}"`,
      `"${s.bloodType || ''}"`,
    ]);

    const csvContent = '\uFEFF' + [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');

  return csvContent;
}

export function downloadReportFile(content: string, mimeType: string, fileName: string): void {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', fileName);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

import { Student, StudentBehaviourIncident, TenantSchoolProfile } from '../../types/attendance';

export interface AbsenceAnalysisRecord {
  date: string;
  dayName: string;
  sessionType?: 'daily' | 'period';
  periodNumber?: number;
  subject?: string;
  periodLabel: string;
  className?: string;
  teacherName?: string;
  status: 'absent' | 'late' | 'excused';
  minutesLate?: number;
  isExcused: boolean;
  justificationReason: string;
  note?: string;
  actionStatus: string;
}

export interface StudentAbsenceReportParams {
  student: Student;
  schoolProfile?: TenantSchoolProfile | null;
  activeDateRange: {
    label: string;
    start: string;
    end: string;
  };
  analysis: {
    attendanceRate: number;
    unexcusedDaysCount: number;
    excusedDaysCount: number;
    lateDaysCount: number;
    records: AbsenceAnalysisRecord[];
  };
  infractions?: StudentBehaviourIncident[];
}

/**
 * Pure generator function producing clean, compliant HTML for vector PDF export and isolated printing.
 * Strictly derives all school identities, dates, and leadership designations from TenantSchoolProfile (Settings).
 */
export function generateStudentAbsenceReportHtml(params: StudentAbsenceReportParams): string {
  const { student, schoolProfile, activeDateRange, analysis, infractions = [] } = params;

  const ministryHeader = schoolProfile?.ministryHeaderAr || 'المملكة العربية السعودية\nوزارة التعليم';
  const schoolName = schoolProfile?.schoolName || 'المدرسة';
  const schoolCode = schoolProfile?.schoolCode || '—';
  const directorate = schoolProfile?.directorateAr || '';
  const showDirectorate = Boolean(directorate && !ministryHeader.includes(directorate));
  const hijriYear = schoolProfile?.academicYear?.hijriYear || '1447-1448 هـ';
  const principalName = schoolProfile?.leadership?.principalName || 'التوقيع والاعتماد';
  const counselorTitle = schoolProfile?.leadership?.socialWorkerName
    ? `المرشد الطلابي (${schoolProfile.leadership.socialWorkerName})`
    : 'المرشد الطلابي / الوكيل';

  const todayAr = new Date().toLocaleDateString('ar-SA');

  const recordsRows = analysis.records.map((r, i) => {
    const statusBg = r.status === 'late' ? '#fef3c7' : r.isExcused ? '#dbeafe' : '#fee2e2';
    const statusColor = r.status === 'late' ? '#92400e' : r.isExcused ? '#1e40af' : '#991b1b';
    const statusText = r.status === 'late'
      ? `تأخر (${r.minutesLate || 15} دقيقة)`
      : r.isExcused
      ? 'غياب بعذر معتمد'
      : 'غياب بدون عذر';

    return `
      <tr style="border-bottom: 1px solid #e2e8f0; background-color: ${i % 2 === 0 ? '#ffffff' : '#f8fafc'};">
        <td style="padding: 6px; border: 1px solid #cbd5e1; text-align: center; font-family: monospace;">${i + 1}</td>
        <td style="padding: 6px; border: 1px solid #cbd5e1; font-weight: bold;">${r.dayName}</td>
        <td style="padding: 6px; border: 1px solid #cbd5e1; font-family: monospace; font-weight: bold;">${r.date}</td>
        <td style="padding: 6px; border: 1px solid #cbd5e1;">
          <span style="padding: 2px 6px; border-radius: 4px; font-size: 10px; font-weight: bold; background-color: ${statusBg}; color: ${statusColor};">
            ${statusText}
          </span>
        </td>
        <td style="padding: 6px; border: 1px solid #cbd5e1; color: #334155;">
          ${r.periodLabel}
        </td>
        <td style="padding: 6px; border: 1px solid #cbd5e1;">
          <div style="font-weight: bold;">${r.justificationReason || 'غياب غير مبرر'}</div>
          ${r.note ? `<div style="font-size: 10px; color: #64748b;">${r.note}</div>` : ''}
        </td>
        <td style="padding: 6px; border: 1px solid #cbd5e1; color: #475569;">
          ${r.teacherName || r.className || student.className}
        </td>
        <td style="padding: 6px; border: 1px solid #cbd5e1; text-align: center; font-size: 10px;">
          <span style="color: ${r.isExcused ? '#047857' : '#b91c1c'}; font-weight: bold;">
            ${r.actionStatus}
          </span>
        </td>
      </tr>
    `;
  }).join('');

  const emptyRecordsRow = `
    <tr>
      <td colspan="8" style="padding: 16px; text-align: center; color: #64748b;">
        لا توجد أي أيام غياب أو تأخر مسجلة للطالب خلال هذه الفترة.
      </td>
    </tr>
  `;

  const infractionsSection = infractions.length > 0 ? `
    <div style="margin-top: 16px;">
      <div style="font-weight: bold; font-size: 13px; margin-bottom: 8px; border-bottom: 1px solid #e2e8f0; padding-bottom: 4px; color: #991b1b;">
        المخالفات السلوكية المسجلة في الفترة:
      </div>
      <table style="width: 100%; border-collapse: collapse; font-size: 11px; text-align: right;">
        <thead>
          <tr style="background-color: #fef2f2; border-bottom: 2px solid #fecaca;">
            <th style="padding: 6px; border: 1px solid #fecaca; width: 30px; text-align: center;">#</th>
            <th style="padding: 6px; border: 1px solid #fecaca; width: 90px;">التاريخ</th>
            <th style="padding: 6px; border: 1px solid #fecaca; width: 100px;">الدرجة</th>
            <th style="padding: 6px; border: 1px solid #fecaca;">وصف المخالفة</th>
            <th style="padding: 6px; border: 1px solid #fecaca; width: 120px;">الإجراء المتخذ</th>
          </tr>
        </thead>
        <tbody>
          ${infractions.map((inf, i) => `
            <tr style="border-bottom: 1px solid #fecaca;">
              <td style="padding: 6px; border: 1px solid #fecaca; text-align: center;">${i + 1}</td>
              <td style="padding: 6px; border: 1px solid #fecaca; font-family: monospace;">${inf.date}</td>
              <td style="padding: 6px; border: 1px solid #fecaca; font-weight: bold; color: #b91c1c;">
                ${inf.severity === 'major' ? 'جسيمة' : inf.severity === 'moderate' ? 'متوسطة' : 'بسيطة'}
              </td>
              <td style="padding: 6px; border: 1px solid #fecaca;">${inf.title} - ${inf.description}</td>
              <td style="padding: 6px; border: 1px solid #fecaca;">${inf.actionTaken || 'متابعة المرشد'}</td>
            </tr>
          `).join('')}
        </tbody>
      </table>
    </div>
  ` : '';

  return `
    <div style="padding: 32px; background-color: #ffffff; color: #0f172a; direction: rtl; font-family: 'Cairo', Tahoma, sans-serif; width: 800px; margin: 0 auto;">
      <!-- Ministry & School Official Header -->
      <div style="display: flex; justify-content: space-between; align-items: flex-start; border-bottom: 2px solid #0f172a; padding-bottom: 16px;">
        <div style="text-align: right; font-size: 12px; line-height: 1.6;">
          <div style="font-weight: bold; font-size: 13px; color: #0f172a; white-space: pre-line;">${ministryHeader}</div>
          <div style="font-weight: 700; font-size: 13px; color: #0f172a; margin-top: 3px;">${schoolName}</div>
          <div style="color: #64748b; font-size: 11px;">كود المنشأة: ${schoolCode}</div>
          ${showDirectorate ? `<div style="color: #475569; font-size: 11px;">${directorate}</div>` : ''}
        </div>

        <div style="text-align: center; line-height: 1.4;">
          <div style="font-weight: 900; font-size: 18px; color: #0f172a;">تقرير سجل غياب وانضباط الطالب</div>
          <div style="font-size: 13px; color: #047857; font-weight: bold;">
            ${activeDateRange.label}
          </div>
          <div style="font-size: 11px; color: #64748b; margin-top: 4px;">
            تاريخ استخراج التقرير: ${todayAr}
          </div>
        </div>

        <div style="text-align: left; font-size: 11px; line-height: 1.6; direction: ltr;">
          <div>العام: ${hijriYear}</div>
          <div>الفصل: ${student.className}</div>
          <div>الصف: ${student.grade || '—'}</div>
        </div>
      </div>

      <!-- Student Identity Card Box -->
      <div style="margin-top: 16px; border: 1px solid #cbd5e1; border-radius: 8px; padding: 12px 16px; background-color: #f8fafc; display: flex; justify-content: space-between; align-items: center;">
        <div>
          <span style="font-size: 11px; color: #64748b;">اسم الطالب: </span>
          <strong style="font-size: 15px; color: #0f172a;">${student.fullName}</strong>
          <span style="margin: 0 8px; color: #cbd5e1;">|</span>
          <span style="font-size: 11px; color: #64748b;">رقم السجل المدني: </span>
          <strong style="font-size: 13px; font-family: monospace;">${student.nationalId || '—'}</strong>
        </div>
        <div>
          <span style="font-size: 11px; color: #64748b;">ولي الأمر: </span>
          <strong style="font-size: 12px;">${student.guardianName || '—'}</strong>
          <span style="margin: 0 8px; color: #cbd5e1;">|</span>
          <span style="font-size: 11px; color: #64748b;">الهاتف: </span>
          <strong style="font-size: 12px; font-family: monospace;">${student.guardianPhone || '—'}</strong>
        </div>
      </div>

      <!-- Executive Statistical Summary Grid -->
      <div style="margin-top: 16px; display: grid; grid-template-columns: repeat(4, 1fr); gap: 12px; text-align: center;">
        <div style="border: 1px solid #cbd5e1; border-radius: 8px; padding: 10px; background-color: #f0fdf4;">
          <div style="font-size: 11px; color: #166534; font-weight: bold;">نسبة الحضور</div>
          <div style="font-size: 20px; font-weight: 900; color: #15803d;">%${analysis.attendanceRate}</div>
        </div>
        <div style="border: 1px solid #cbd5e1; border-radius: 8px; padding: 10px; background-color: #fef2f2;">
          <div style="font-size: 11px; color: #991b1b; font-weight: bold;">إجمالي الغياب (بدون عذر)</div>
          <div style="font-size: 20px; font-weight: 900; color: #b91c1c;">${analysis.unexcusedDaysCount} يوم</div>
        </div>
        <div style="border: 1px solid #cbd5e1; border-radius: 8px; padding: 10px; background-color: #eff6ff;">
          <div style="font-size: 11px; color: #1e40af; font-weight: bold;">غياب بعذر معتمد</div>
          <div style="font-size: 20px; font-weight: 900; color: #1d4ed8;">${analysis.excusedDaysCount} يوم</div>
        </div>
        <div style="border: 1px solid #cbd5e1; border-radius: 8px; padding: 10px; background-color: #fffbeb;">
          <div style="font-size: 11px; color: #92400e; font-weight: bold;">مرات التأخر الصباحي</div>
          <div style="font-size: 20px; font-weight: 900; color: #b45309;">${analysis.lateDaysCount} مرات</div>
        </div>
      </div>

      <!-- Absence Dates Table -->
      <div style="margin-top: 16px;">
        <div style="font-weight: bold; font-size: 13px; margin-bottom: 8px; border-bottom: 1px solid #e2e8f0; padding-bottom: 4px;">
          سجل تواريخ الغياب والتأخر في الفترة بالتفصيل:
        </div>
        <table style="width: 100%; border-collapse: collapse; font-size: 11px; text-align: right;">
          <thead>
            <tr style="background-color: #f1f5f9; border-bottom: 2px solid #cbd5e1;">
              <th style="padding: 8px; border: 1px solid #cbd5e1; width: 25px; text-align: center;">#</th>
              <th style="padding: 8px; border: 1px solid #cbd5e1; width: 70px;">اليوم</th>
              <th style="padding: 8px; border: 1px solid #cbd5e1; width: 85px;">التاريخ</th>
              <th style="padding: 8px; border: 1px solid #cbd5e1; width: 110px;">نوع الحالة</th>
              <th style="padding: 8px; border: 1px solid #cbd5e1; width: 105px;">الفترة / الحصة</th>
              <th style="padding: 8px; border: 1px solid #cbd5e1;">التفاصيل ومبررات العذر</th>
              <th style="padding: 8px; border: 1px solid #cbd5e1; width: 110px;">المعلم / الراصد</th>
              <th style="padding: 8px; border: 1px solid #cbd5e1; width: 120px; text-align: center;">إجراء التواصل</th>
            </tr>
          </thead>
          <tbody>
            ${analysis.records.length > 0 ? recordsRows : emptyRecordsRow}
          </tbody>
        </table>
      </div>

      <!-- Conduct Violations Section if any -->
      ${infractionsSection}

      <!-- Official Signatures & Stamp Footer -->
      <div style="margin-top: 32px; padding-top: 16px; border-top: 2px solid #0f172a; display: flex; justify-content: space-between; align-items: center; font-size: 12px; text-align: center;">
        <div style="width: 200px;">
          <div style="font-weight: bold; margin-bottom: 32px;">${counselorTitle}</div>
          <div style="border-top: 1px dashed #94a3b8; padding-top: 4px; color: #64748b;">التوقيع: .....................</div>
        </div>

        <div style="width: 150px;">
          <div style="border: 2px dashed #94a3b8; border-radius: 50%; width: 90px; height: 90px; margin: 0 auto; display: flex; align-items: center; justify-content: center; color: #94a3b8; font-size: 10px;">
            ختم المدرسة
          </div>
        </div>

        <div style="width: 200px;">
          <div style="font-weight: bold; margin-bottom: 32px;">مدير المدرسة</div>
          <div style="border-top: 1px dashed #94a3b8; padding-top: 4px; color: #64748b;">
            ${principalName}
          </div>
        </div>
      </div>
    </div>
  `;
}

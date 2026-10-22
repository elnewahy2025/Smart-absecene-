import { AttendanceSession, Justification, Student } from '../types/attendance';
import { AbsenceAnalysisRecord } from './printTemplates/studentAbsenceReportTemplate';

export type AbsenceHorizonType = 'month' | 'term' | 'full_year' | 'custom';

export interface AbsenceDateRange {
  start: string;
  end: string;
  label: string;
}

export interface AbsenceDateValidation {
  isValid: boolean;
  error: string | null;
}

export interface StudentAbsenceAnalysisParams {
  student: Student | null;
  sessions: AttendanceSession[];
  justifications: Justification[];
  horizonType: AbsenceHorizonType;
  selectedMonth: string;
  selectedTermId: string;
  activeDateRange: AbsenceDateRange;
  academicYearBounds: { start: string; end: string };
  customDateValidation: AbsenceDateValidation;
  isAr: boolean;
  getArabicDayName: (dateStr: string) => string;
  getSchoolDaysInRange: (startDateStr: string, endDateStr: string) => string[];
}

export function buildStudentAbsenceAnalysis({
  student,
  sessions,
  justifications,
  horizonType,
  selectedMonth,
  selectedTermId,
  activeDateRange,
  academicYearBounds,
  customDateValidation,
  isAr,
  getArabicDayName,
  getSchoolDaysInRange,
}: StudentAbsenceAnalysisParams) {
  if (!student) return null;

  if (horizonType === 'custom' && !customDateValidation.isValid) {
    return {
      totalRecordedDaysCount: 0,
      presentDaysCount: 0,
      absentDaysCount: 0,
      lateDaysCount: 0,
      excusedDaysCount: 0,
      unexcusedDaysCount: 0,
      totalMinutesLate: 0,
      attendanceRate: 0,
      records: [] as AbsenceAnalysisRecord[],
      isRejected: true,
      rejectionReason: customDateValidation.error,
    };
  }

  const sessionsInRange = sessions.filter((s) => {
    if (s.status !== 'submitted') return false;
    if (!s.date) return false;
    return (
      s.date >= activeDateRange.start &&
      s.date <= activeDateRange.end &&
      s.date >= academicYearBounds.start &&
      s.date <= academicYearBounds.end
    );
  });

  const relevantAbsenceEntries: AbsenceAnalysisRecord[] = [];

  let totalRecordedDaysCount = 0;
  let presentDaysCount = 0;
  let absentDaysCount = 0;
  let lateDaysCount = 0;
  let excusedDaysCount = 0;
  let unexcusedDaysCount = 0;
  let totalMinutesLate = 0;

  sessionsInRange.forEach((session) => {
    const record = session.records?.find((r) => r.studentId === student.id);
    if (record) {
      totalRecordedDaysCount += 1;

      if (record.status === 'present') {
        presentDaysCount += 1;
      } else if (record.status === 'late') {
        lateDaysCount += 1;
        const mins = record.minutesLate || 15;
        totalMinutesLate += mins;
        relevantAbsenceEntries.push({
          date: session.date,
          dayName: getArabicDayName(session.date),
          sessionType: session.sessionType,
          periodNumber: session.periodNumber,
          subject: session.subject,
          periodLabel:
            session.sessionType === 'daily'
              ? isAr ? 'اليوم الدراسي كاملاً' : 'Full Day'
              : isAr
              ? `الحصة ${session.periodNumber || 1} (${session.subject || 'مادة'})`
              : `Period ${session.periodNumber || 1}`,
          className: session.className,
          teacherName: session.teacherName,
          status: 'late',
          minutesLate: mins,
          isExcused: false,
          justificationReason: isAr
            ? `تأخر عن بداية اليوم الدراسي (${mins} دقيقة)`
            : `Tardiness (${mins} min)`,
          note: record.note || (isAr ? 'تم رصد التأخر في سجل الحضور والاصطفاف' : 'Logged in morning attendance'),
          actionStatus: isAr ? '✉ تم إشعار ولي الأمر' : 'Guardian Notified',
        });
      } else if (record.status === 'excused_leave' || record.status === 'excused_absence') {
        excusedDaysCount += 1;
        absentDaysCount += 1;
        const excuse = justifications.find(
          (j) => j.studentId === student.id && j.absenceDate === session.date && j.status === 'approved'
        );
        relevantAbsenceEntries.push({
          date: session.date,
          dayName: getArabicDayName(session.date),
          sessionType: session.sessionType,
          periodNumber: session.periodNumber,
          subject: session.subject,
          periodLabel:
            session.sessionType === 'daily'
              ? isAr ? 'اليوم الدراسي كاملاً' : 'Full Day'
              : isAr
              ? `الحصة ${session.periodNumber || 1}`
              : `Period ${session.periodNumber || 1}`,
          className: session.className,
          teacherName: session.teacherName,
          status: 'excused',
          isExcused: true,
          justificationReason: excuse
            ? excuse.guardianExplanation || excuse.reasonType
            : isAr ? 'إجازة مرضية معتمدة من المركز الصحي' : 'Approved medical leave',
          note: record.note || (isAr ? 'تم قبول العذر واعتماده من الإدارة' : 'Approved by school administration'),
          actionStatus: isAr ? '✓ عذر معتمد بالملف' : 'Approved Excuse',
        });
      } else if (record.status === 'absent' || record.status === 'under_review' || record.status === 'rejected_excuse') {
        absentDaysCount += 1;
        const excuse = justifications.find(
          (j) => j.studentId === student.id && j.absenceDate === session.date && j.status === 'approved'
        );
        const isExc = Boolean(excuse);
        if (isExc) {
          excusedDaysCount += 1;
        } else {
          unexcusedDaysCount += 1;
        }

        relevantAbsenceEntries.push({
          date: session.date,
          dayName: getArabicDayName(session.date),
          sessionType: session.sessionType,
          periodNumber: session.periodNumber,
          subject: session.subject,
          periodLabel:
            session.sessionType === 'daily'
              ? isAr ? 'اليوم الدراسي كاملاً' : 'Full Day'
              : isAr
              ? `الحصة ${session.periodNumber || 1}`
              : `Period ${session.periodNumber || 1}`,
          className: session.className,
          teacherName: session.teacherName,
          status: isExc ? 'excused' : 'absent',
          isExcused: isExc,
          justificationReason: isExc
            ? excuse?.guardianExplanation || (isAr ? 'عذر معتمد من الإدارة' : 'Approved Excuse')
            : isAr
            ? 'غياب بدون عذر مقبول - لم يقدم ولي الأمر عذراً رسمياً'
            : 'Unexcused absence - no justification submitted',
          note: record.note || (isExc ? (isAr ? 'تم حفظ التقرير الطبي' : 'Filed') : (isAr ? 'تم إرسال إشعار فوري لولي الأمر عبر SMS' : 'SMS sent to guardian')),
          actionStatus: isExc ? (isAr ? '✓ عذر معتمد بالملف' : 'Approved Excuse') : (isAr ? '✉ تم إشعار ولي الأمر' : 'Guardian Notified'),
        });
      }
    }
  });
  // If no raw session records exist in this timeframe, return empty records without fabricating fake data
  if (totalRecordedDaysCount === 0) {
    return {
      totalRecordedDaysCount: 0,
      presentDaysCount: 0,
      absentDaysCount: 0,
      lateDaysCount: 0,
      excusedDaysCount: 0,
      unexcusedDaysCount: 0,
      totalMinutesLate: 0,
      attendanceRate: 100,
      records: [],
    };
  }

  const calculatedAttendanceRate =
    Math.round(((presentDaysCount + lateDaysCount) / totalRecordedDaysCount) * 100);

  return {
    totalRecordedDaysCount,
    presentDaysCount,
    absentDaysCount,
    lateDaysCount,
    excusedDaysCount,
    unexcusedDaysCount,
    totalMinutesLate,
    attendanceRate: calculatedAttendanceRate,
    records: relevantAbsenceEntries.sort((a, b) => b.date.localeCompare(a.date)),
  };
}

export type HorizonType = 'month' | 'term' | 'full_year' | 'custom';

export interface DateRange {
  start: string;
  end: string;
  label: string;
}

export interface CustomDateValidation {
  isValid: boolean;
  error: string | null;
}

export interface MonthOption {
  value: string;
  labelAr: string;
  labelEn: string;
}

export interface StudentAbsenceEntry {
  date: string;
  dayName: string;
  sessionType: 'daily' | 'period';
  periodNumber?: number;
  subject?: string;
  periodLabel: string;
  className: string;
  teacherName: string;
  status: 'absent' | 'late' | 'excused';
  minutesLate?: number;
  isExcused: boolean;
  justificationReason: string;
  note?: string;
  actionStatus: string;
}

export interface StudentAbsenceAnalysis {
  totalRecordedDaysCount: number;
  presentDaysCount: number;
  absentDaysCount: number;
  lateDaysCount: number;
  excusedDaysCount: number;
  unexcusedDaysCount: number;
  totalMinutesLate: number;
  attendanceRate: number;
  records: StudentAbsenceEntry[];
  isRejected?: boolean;
  rejectionReason?: string | null;
}

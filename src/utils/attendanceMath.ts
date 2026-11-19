import type {
  AttendanceRecord,
  AttendanceSession,
  AttendanceStatus,
  Student,
} from '../types/attendance';

/** Returns a finite numeric rate or `null` when missing/invalid (never defaults to 100). */
export function rateOrNull(v: unknown): number | null {
  return typeof v === 'number' && Number.isFinite(v) ? v : null;
}

/** Arithmetic mean of finite numeric values, or `null` when none exist. */
export function meanOrNull(values: Array<number | null | undefined>): number | null {
  const nums = values.filter((v): v is number => typeof v === 'number' && Number.isFinite(v));
  return nums.length > 0 ? nums.reduce((acc, n) => acc + n, 0) / nums.length : null;
}

/** Clamps a percentage value to the closed [0, 100] range. */
export function clampPercent(v: number): number {
  if (!Number.isFinite(v)) return 0;
  return Math.min(100, Math.max(0, v));
}

export interface AttendanceTotals {
  present: number;
  late: number;
  excusedLeave: number;
  excusedAbsence: number;
  rejected: number;
  underReview: number;
  absent: number;
  /** `absent + rejected` (matches session absentCount KPI). */
  absentTotal: number;
  /** `excusedAbsence + excusedLeave + underReview` (matches session excusedCount KPI). */
  excusedTotal: number;
  /** `present + late + excusedLeave` (canonical attended numerator). */
  attendedTotal: number;
  total: number;
}

/** Partitions all 7 `AttendanceStatus` values cleanly as the single source of truth. */
export function summarizeRecords(
  records: ReadonlyArray<Pick<AttendanceRecord, 'status'>> = []
): AttendanceTotals {
  let present = 0;
  let late = 0;
  let excusedLeave = 0;
  let excusedAbsence = 0;
  let rejected = 0;
  let underReview = 0;
  let absent = 0;

  for (const r of records) {
    switch (r.status) {
      case 'present':
        present += 1;
        break;
      case 'late':
        late += 1;
        break;
      case 'excused_leave':
        excusedLeave += 1;
        break;
      case 'excused_absence':
        excusedAbsence += 1;
        break;
      case 'rejected_excuse':
        rejected += 1;
        break;
      case 'under_review':
        underReview += 1;
        break;
      case 'absent':
      default:
        absent += 1;
        break;
    }
  }

  return {
    present,
    late,
    excusedLeave,
    excusedAbsence,
    rejected,
    underReview,
    absent,
    absentTotal: absent + rejected,
    excusedTotal: excusedAbsence + excusedLeave + underReview,
    attendedTotal: present + late + excusedLeave,
    total: records.length,
  };
}

/** Canonical attended rate (1 decimal place), or `null` when total is 0. */
export function attendedRate(totals: AttendanceTotals): number | null {
  return totals.total > 0
    ? parseFloat(((totals.attendedTotal / totals.total) * 100).toFixed(1))
    : null;
}

/** Canonical rounded attended rate (integer 0–100), or `null` when total is 0. */
export function attendedRateRounded(totals: AttendanceTotals): number | null {
  return totals.total > 0
    ? Math.round((totals.attendedTotal / totals.total) * 100)
    : null;
}

/** Recomputes session summary counters strictly from its `records` array. */
export function recountSession<
  T extends {
    records?: AttendanceRecord[];
    totalStudents?: number;
    presentCount?: number;
    absentCount?: number;
    lateCount?: number;
    excusedCount?: number;
  },
>(session: T): T {
  const totals = summarizeRecords(session.records || []);
  return {
    ...session,
    totalStudents: totals.total,
    presentCount: totals.present,
    absentCount: totals.absentTotal,
    lateCount: totals.late,
    excusedCount: totals.excusedTotal,
  };
}

/** Shared KPI & roster filter predicate keeping Absent and Excused card drill-downs consistent. */
export function matchesStatusFilter(status: AttendanceStatus, filter: string): boolean {
  if (filter === 'all') return true;
  if (filter === 'present') return status === 'present';
  if (filter === 'absent') return status === 'absent' || status === 'rejected_excuse';
  if (filter === 'late') return status === 'late';
  if (filter === 'excused_absence' || filter === 'excused') {
    return (
      status === 'excused_absence' ||
      status === 'excused_leave' ||
      status === 'under_review'
    );
  }
  return status === filter;
}

/** Canonical active-student check matching the executive dashboard. */
export function isActiveStudent(
  student: Pick<Student, 'enrollmentStatus'>
): boolean {
  return !student.enrollmentStatus || student.enrollmentStatus === 'active';
}

export interface DerivedStudentMetrics {
  totalAbsences: number;
  totalLates: number;
  attendanceRate: number;
}

/**
 * Derives per-student metrics from submitted sessions using distinct-date absence
 * deduplication (`attended` = `present | late | excused_leave`; `absent` = `absent | excused_absence | rejected_excuse`).
 */
export function computeStudentMetricsFromSessions(
  sessions: ReadonlyArray<AttendanceSession>,
  targetStudentIds?: ReadonlySet<string>
): Map<string, DerivedStudentMetrics> {
  const submitted = sessions.filter((s) => s.status === 'submitted');
  const studentAcc = new Map<
    string,
    {
      absentDates: Set<string>;
      attendedDates: Set<string>;
      totalLates: number;
      totalRecords: number;
      attendedRecords: number;
    }
  >();

  for (const sess of submitted) {
    for (const rec of sess.records || []) {
      if (targetStudentIds && !targetStudentIds.has(rec.studentId)) continue;
      let acc = studentAcc.get(rec.studentId);
      if (!acc) {
        acc = {
          absentDates: new Set<string>(),
          attendedDates: new Set<string>(),
          totalLates: 0,
          totalRecords: 0,
          attendedRecords: 0,
        };
        studentAcc.set(rec.studentId, acc);
      }

      acc.totalRecords += 1;
      if (
        rec.status === 'present' ||
        rec.status === 'late' ||
        rec.status === 'excused_leave'
      ) {
        acc.attendedRecords += 1;
        acc.attendedDates.add(sess.date);
        if (rec.status === 'late') acc.totalLates += 1;
      } else if (
        rec.status === 'absent' ||
        rec.status === 'excused_absence' ||
        rec.status === 'rejected_excuse'
      ) {
        acc.absentDates.add(sess.date);
      }
    }
  }

  const result = new Map<string, DerivedStudentMetrics>();
  studentAcc.forEach((acc, studentId) => {
    let totalAbsences = 0;
    acc.absentDates.forEach((date) => {
      if (!acc.attendedDates.has(date)) totalAbsences += 1;
    });
    const attendanceRate =
      acc.totalRecords > 0
        ? parseFloat(((acc.attendedRecords / acc.totalRecords) * 100).toFixed(1))
        : 100;
    result.set(studentId, {
      totalAbsences,
      totalLates: acc.totalLates,
      attendanceRate,
    });
  });

  if (targetStudentIds) {
    targetStudentIds.forEach((studentId) => {
      if (!result.has(studentId)) {
        result.set(studentId, { totalAbsences: 0, totalLates: 0, attendanceRate: 100 });
      }
    });
  }

  return result;
}

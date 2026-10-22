import type {
  AttendanceStatus,
  Justification,
  NotificationOutboxItem,
  StudentBehaviourIncident,
} from '../../types/attendance';

export type AbsenceLateRecordData = {
  sessionId: string;
  date: string;
  subject?: string;
  sessionType: 'daily' | 'period';
  periodNumber?: number;
  className: string;
  status: AttendanceStatus | string;
  minutesLate?: number;
  note?: string;
  teacherName?: string;
  justification?: Justification;
};

export type InfractionRecordData = StudentBehaviourIncident;
export type JustificationRecordData = Justification;
export type NotificationRecordData = NotificationOutboxItem;

export type SelectedRecordType =
  | { type: 'absence_late'; data: AbsenceLateRecordData }
  | { type: 'infraction'; data: InfractionRecordData }
  | { type: 'justification'; data: JustificationRecordData }
  | { type: 'notification'; data: NotificationRecordData };

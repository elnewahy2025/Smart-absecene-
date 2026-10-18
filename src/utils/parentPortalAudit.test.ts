import { describe, it, expect } from 'vitest';
import {
  Student,
  AttendanceSession,
  Justification,
  StudentBehaviourIncident,
  NotificationOutboxItem,
} from '../types/attendance';

describe('Parent Portal Records & Detailed Table Logic', () => {
  const mockStudent: Student = {
    id: 'std-101',
    tenantId: 'school-1',
    studentNumber: '20260101',
    nationalId: '1098765431',
    fullName: 'يوسف بن خالد المطيري',
    grade: 'الصف العاشر',
    className: '10 / أ',
    classId: 'class-1a',
    guardianName: 'د. خالد بن سعود المطيري',
    guardianPhone: '+966509990011',
    guardianRelationship: 'الأب',
    totalAbsences: 3,
    totalLates: 1,
    attendanceRate: 94.2,
  };

  const mockSessions: AttendanceSession[] = [
    {
      id: 'sess-1',
      tenantId: 'school-1',
      date: '2026-10-12',
      sessionType: 'period',
      periodNumber: 1,
      subject: 'الرياضيات',
      classId: 'class-1a',
      className: '10 / أ',
      grade: 'الصف العاشر',
      teacherId: 'user-t1',
      teacherName: 'أ. سلمان الدوسري',
      status: 'submitted',
      totalStudents: 1,
      presentCount: 0,
      absentCount: 1,
      lateCount: 0,
      excusedCount: 0,
      records: [
        {
          id: 'rec-1',
          sessionId: 'sess-1',
          studentId: 'std-101',
          status: 'absent',
          note: 'غياب غير مبرر',
          updatedAt: '2026-10-12T07:45:00Z',
          updatedBy: 'أ. سلمان الدوسري',
        },
      ],
    },
    {
      id: 'sess-2',
      tenantId: 'school-1',
      date: '2026-10-07',
      sessionType: 'period',
      periodNumber: 2,
      subject: 'العلوم',
      classId: 'class-1a',
      className: '10 / أ',
      grade: 'الصف العاشر',
      teacherId: 'user-t2',
      teacherName: 'أ. عمر الشهري',
      status: 'submitted',
      totalStudents: 1,
      presentCount: 0,
      absentCount: 0,
      lateCount: 1,
      excusedCount: 0,
      records: [
        {
          id: 'rec-2',
          sessionId: 'sess-2',
          studentId: 'std-101',
          status: 'late',
          minutesLate: 15,
          note: 'تأخر 15 دقيقة',
          updatedAt: '2026-10-07T09:30:00Z',
          updatedBy: 'أ. عمر الشهري',
        },
      ],
    },
  ];

  const mockJustifications: Justification[] = [
    {
      id: 'just-1',
      tenantId: 'school-1',
      studentId: 'std-101',
      studentName: 'يوسف بن خالد المطيري',
      className: '10 / أ',
      absenceDate: '2026-10-06',
      reasonType: 'medical',
      guardianExplanation: 'مراجعة عيادة الأسنان',
      status: 'approved',
      submittedAt: '2026-10-06T08:30:00Z',
      reviewedBy: 'أ. ماجد الخالدي',
    },
  ];

  const mockIncidents: StudentBehaviourIncident[] = [
    {
      id: 'beh-1',
      tenantId: 'school-1',
      studentId: 'std-101',
      studentName: 'يوسف بن خالد المطيري',
      className: '10 / أ',
      date: '2026-10-07',
      time: '09:30',
      type: 'infraction',
      category: 'unexcused_tardiness',
      title: 'مخالفة تأخر عن الحصة',
      description: 'دخول الحصة بعد بدايتها بـ 15 دقيقة',
      severity: 'minor',
      points: -2,
      recordedBy: 'أ. عمر الشهري',
      guardianNotified: true,
    },
    {
      id: 'beh-2',
      tenantId: 'school-1',
      studentId: 'std-101',
      studentName: 'يوسف بن خالد المطيري',
      className: '10 / أ',
      date: '2026-10-11',
      time: '10:00',
      type: 'positive',
      category: 'teamwork',
      title: 'المشاركة الإيجابية',
      description: 'مبادرة متميزة في معمل العلوم',
      severity: 'minor',
      points: 5,
      recordedBy: 'أ. عمر الشهري',
      guardianNotified: true,
    },
  ];

  const mockNotifications: NotificationOutboxItem[] = [
    {
      id: 'notif-1',
      tenantId: 'school-1',
      recipientPhone: '+966509990011',
      recipientName: 'د. خالد بن سعود المطيري',
      studentId: 'std-101',
      studentName: 'يوسف بن خالد المطيري',
      absenceDate: '2026-10-12',
      sessionTitle: 'كشف الحضور',
      statusType: 'absent',
      messageText: 'تم تسجيل غياب نجلكم',
      channel: 'SMS',
      status: 'sent',
      retryCount: 0,
      createdAt: '2026-10-12T07:46:00Z',
    },
  ];

  it('correctly aggregates absence and tardiness records for the active child', () => {
    const studentRecords: any[] = [];
    mockSessions.forEach((sess) => {
      const rec = sess.records.find((r) => r.studentId === mockStudent.id);
      if (rec && (rec.status === 'absent' || rec.status === 'late')) {
        studentRecords.push({ ...rec, date: sess.date });
      }
    });

    expect(studentRecords).toHaveLength(2);
    expect(studentRecords[0].status).toBe('absent');
    expect(studentRecords[1].status).toBe('late');
  });

  it('filters infractions and conduct incidents strictly for the active child', () => {
    const childIncidents = mockIncidents.filter((i) => i.studentId === mockStudent.id);
    const infractions = childIncidents.filter((i) => i.type === 'infraction');
    const positive = childIncidents.filter((i) => i.type === 'positive');

    expect(childIncidents).toHaveLength(2);
    expect(infractions).toHaveLength(1);
    expect(positive).toHaveLength(1);
    expect(infractions[0].points).toBe(-2);
  });

  it('matches justifications to student absence records', () => {
    const childJustifications = mockJustifications.filter((j) => j.studentId === mockStudent.id);
    expect(childJustifications).toHaveLength(1);
    expect(childJustifications[0].absenceDate).toBe('2026-10-06');
    expect(childJustifications[0].status).toBe('approved');
  });

  it('filters notifications strictly directed to the child or guardian phone', () => {
    const childNotifs = mockNotifications.filter(
      (n) => n.studentId === mockStudent.id || n.recipientPhone === mockStudent.guardianPhone
    );
    expect(childNotifs).toHaveLength(1);
    expect(childNotifs[0].messageText).toContain('تم تسجيل غياب نجلكم');
  });
});

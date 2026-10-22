import { useEffect } from 'react';
import { doc, setDoc } from 'firebase/firestore';
import type { User as FirebaseUser } from 'firebase/auth';
import { db } from '../lib/firebase';
import { canWriteSubmittedSessions } from '../utils/attendanceAccess';
import { toFirestoreData } from './attendanceContextSupport';
import type { AttendanceSession, Student, UserRole } from '../types/attendance';

interface SessionPersistenceDeps {
  firebaseUser: FirebaseUser | null;
  tenantId: string;
  currentUserRole: UserRole;
  allSessions: AttendanceSession[];
  allStudents: Student[];
  sessionHashesRef: React.MutableRefObject<Record<string, string>>;
  sessionsHydratedRef: React.MutableRefObject<boolean>;
  sessionsSeededRef: React.MutableRefObject<boolean>;
}

/**
 * Persists changed sessions (and their per-student attendance mirrors) to Firestore.
 * Hashes are seeded at hydration so existing local/demo sessions are not bulk-uploaded;
 * only sessions changed after hydration are written.
 */
export function useSessionPersistence({
  firebaseUser,
  tenantId,
  currentUserRole,
  allSessions,
  allStudents,
  sessionHashesRef,
  sessionsHydratedRef,
  sessionsSeededRef,
}: SessionPersistenceDeps) {
  useEffect(() => {
    if (!sessionsHydratedRef.current || sessionsSeededRef.current) return;
    for (const session of allSessions) {
      sessionHashesRef.current[session.id] = JSON.stringify(session);
    }
    sessionsSeededRef.current = true;
  }, [allSessions]);

  useEffect(() => {
    if (!firebaseUser || !sessionsHydratedRef.current) return;
    if (!['admin', 'registrar', 'teacher', 'super_admin'].includes(currentUserRole)) return;

    const timer = setTimeout(() => {
      const canWriteSubmitted = canWriteSubmittedSessions(currentUserRole);
      for (const session of allSessions.filter((item) => item.tenantId === tenantId)) {
        const hash = JSON.stringify(session);
        if (sessionHashesRef.current[session.id] === hash) continue;

        if (session.status === 'submitted' && !canWriteSubmitted) {
          sessionHashesRef.current[session.id] = hash;
          continue;
        }

        sessionHashesRef.current[session.id] = hash;
        void setDoc(doc(db, 'attendance_sessions', session.id), toFirestoreData(session), { merge: true }).catch((error) =>
          console.error('[SESSIONS] Could not persist session:', error)
        );
        for (const record of session.records) {
          const student = allStudents.find((item) => item.id === record.studentId);
          if (!student?.guardianPhone) continue;

          const recordId = `${session.id}_${record.studentId}`;
          void setDoc(
            doc(db, 'attendance_records', recordId),
            toFirestoreData({
              id: recordId,
              tenantId: session.tenantId,
              sessionId: session.id,
              studentId: record.studentId,
              guardianPhone: student.guardianPhone,
              date: session.date,
              sessionType: session.sessionType,
              periodNumber: session.periodNumber,
              subject: session.subject,
              classId: session.classId,
              className: session.className,
              teacherName: session.teacherName,
              status: record.status,
              minutesLate: record.minutesLate,
              note: record.note,
              updatedAt: record.updatedAt || new Date().toISOString(),
            }),
            { merge: true }
          ).catch((error) => console.error('[SESSIONS] Could not persist attendance record:', error));
        }
      }
    }, 1200);

    return () => clearTimeout(timer);
  }, [allSessions, allStudents, firebaseUser, tenantId, currentUserRole]);
}

import { useEffect } from 'react';
import type { MutableRefObject, Dispatch, SetStateAction } from 'react';
import type { User as FirebaseUser } from 'firebase/auth';
import { collection, onSnapshot, query, where } from 'firebase/firestore';
import type {
  AttendanceSession,
  AuditLog,
  Justification,
  NotificationOutboxItem,
  Student,
  UserProfile,
  UserRole,
} from '../types/attendance';
import { db, handleFirestoreError, OperationType } from '../lib/firebase';
import { INITIAL_USERS } from '../data/initialState';

interface UseFirestoreDataSyncParams {
  firebaseUser: FirebaseUser | null;
  tenantId: string;
  currentUserRole: UserRole;
  authenticatedPhone: string;
  allUsers: UserProfile[];
  setAllUsers: Dispatch<SetStateAction<UserProfile[]>>;
  setAllStudents: Dispatch<SetStateAction<Student[]>>;
  setAllSessions: Dispatch<SetStateAction<AttendanceSession[]>>;
  setAllJustifications: Dispatch<SetStateAction<Justification[]>>;
  setAllNotifications: Dispatch<SetStateAction<NotificationOutboxItem[]>>;
  setAllAuditLogs: Dispatch<SetStateAction<AuditLog[]>>;
  sessionHashesRef: MutableRefObject<Record<string, string>>;
  sessionsHydratedRef: MutableRefObject<boolean>;
  sessionsSeededRef: MutableRefObject<boolean>;
  sessionsRef: MutableRefObject<AttendanceSession[]>;
}

export function useFirestoreDataSync({
  firebaseUser,
  tenantId,
  currentUserRole,
  authenticatedPhone,
  allUsers,
  setAllUsers,
  setAllStudents,
  setAllSessions,
  setAllJustifications,
  setAllNotifications,
  setAllAuditLogs,
  sessionHashesRef,
  sessionsHydratedRef,
  sessionsSeededRef,
  sessionsRef,
}: UseFirestoreDataSyncParams) {
  // Sync all entities from Firestore in real-time when authenticated
  useEffect(() => {
    if (!firebaseUser || !tenantId || tenantId.trim() === '') return;

    const isParentUser = currentUserRole === 'parent';
    const parentProfile = isParentUser
      ? allUsers.find((user) => user.email.toLowerCase() === (firebaseUser.email || '').toLowerCase())
      : undefined;
    const parentPhone = authenticatedPhone || parentProfile?.phone;

    // Authorization barrier: parents must only query records matching their own guardian phone.
    // If the phone has not resolved yet, defer query attachment until the next render cycle.
    if (isParentUser && !parentPhone) {
      return;
    }

    // 1. Students sync
    const qStudents = isParentUser
      ? query(collection(db, 'students'), where('tenantId', '==', tenantId), where('guardianPhone', '==', parentPhone))
      : query(collection(db, 'students'), where('tenantId', '==', tenantId));
    const unsubStudents = onSnapshot(
      qStudents,
      (snapshot) => {
        if (!snapshot.empty) {
          const remoteStudents: Student[] = [];
          snapshot.forEach((docSnap) => {
            const data = docSnap.data();
            remoteStudents.push({
              id: docSnap.id,
              tenantId: data.tenantId || tenantId,
              studentNumber: data.studentNumber || '',
              nationalId: data.nationalId || '',
              fullName: data.fullName || '',
              grade: data.grade || 'الصف العاشر',
              className: data.className || '',
              classId: data.classId || 'class-1a',
              guardianName: data.guardianName || 'ولي أمر معتمد',
              guardianPhone: data.guardianPhone || '',
              guardianRelationship: data.guardianRelationship || '',
              bloodType: data.bloodType || '',
              totalAbsences: data.totalAbsences || 0,
              totalLates: data.totalLates || 0,
              attendanceRate: data.attendanceRate || 100,
            });
          });
          if (remoteStudents.length > 0) {
            setAllStudents((prev) => {
              const map = new Map<string, Student>();
              prev.forEach((s) => map.set(s.id, s));
              remoteStudents.forEach((s) => map.set(s.id, s));
              return Array.from(map.values());
            });
          }
        }
      },
      (error) => {
        handleFirestoreError(error, OperationType.GET, 'students');
      }
    );

    // 2. Attendance Sessions sync
    const qSessions = query(collection(db, 'attendance_sessions'), where('tenantId', '==', tenantId));
    const unsubSessions =
      currentUserRole === 'parent'
        ? () => {}
        : onSnapshot(
      qSessions,
      (snapshot) => {
        if (!snapshot.empty) {
          const remoteSessions: AttendanceSession[] = [];
          snapshot.forEach((docSnap) => {
            const data = docSnap.data() as AttendanceSession;
            remoteSessions.push({ ...data, id: docSnap.id });
            sessionHashesRef.current[docSnap.id] = JSON.stringify({ ...data, id: docSnap.id });
          });
          if (remoteSessions.length > 0) {
            setAllSessions((prev) => {
              const map = new Map<string, AttendanceSession>();
              prev.forEach((s) => map.set(s.id, s));
              remoteSessions.forEach((s) => map.set(s.id, s));
              return Array.from(map.values());
            });
          }
        }
        sessionsHydratedRef.current = true;
        if (!sessionsSeededRef.current) {
          for (const session of sessionsRef.current) {
            sessionHashesRef.current[session.id] = JSON.stringify(session);
          }
          sessionsSeededRef.current = true;
        }
      },
      (error) => {
        sessionsHydratedRef.current = true;
        if (!sessionsSeededRef.current) {
          for (const session of sessionsRef.current) {
            sessionHashesRef.current[session.id] = JSON.stringify(session);
          }
          sessionsSeededRef.current = true;
        }
        handleFirestoreError(error, OperationType.GET, 'attendance_sessions');
      }
    );

    // 3. Justifications sync
    const qJustifications = isParentUser
      ? query(collection(db, 'justifications'), where('tenantId', '==', tenantId), where('guardianPhone', '==', parentPhone))
      : query(collection(db, 'justifications'), where('tenantId', '==', tenantId));
    const unsubJustifications = onSnapshot(
      qJustifications,
      (snapshot) => {
        if (!snapshot.empty) {
          const remoteJustifications: Justification[] = [];
          snapshot.forEach((docSnap) => {
            const data = docSnap.data() as Justification;
            remoteJustifications.push({ ...data, id: docSnap.id });
          });
          if (remoteJustifications.length > 0) {
            setAllJustifications((prev) => {
              const map = new Map<string, Justification>();
              prev.forEach((j) => map.set(j.id, j));
              remoteJustifications.forEach((j) => map.set(j.id, j));
              return Array.from(map.values());
            });
          }
        }
      },
      (error) => {
        handleFirestoreError(error, OperationType.GET, 'justifications');
      }
    );

    // 4. Notification outbox sync
    const qNotifications = isParentUser
      ? query(collection(db, 'notification_outbox'), where('tenantId', '==', tenantId), where('recipientPhone', '==', parentPhone))
      : query(collection(db, 'notification_outbox'), where('tenantId', '==', tenantId));
    const unsubNotifications = onSnapshot(
      qNotifications,
      (snapshot) => {
        if (!snapshot.empty) {
          const remoteNotifications: NotificationOutboxItem[] = [];
          snapshot.forEach((docSnap) => {
            const data = docSnap.data() as NotificationOutboxItem;
            remoteNotifications.push({ ...data, id: docSnap.id });
          });
          if (remoteNotifications.length > 0) {
            setAllNotifications((prev) => {
              const map = new Map<string, NotificationOutboxItem>();
              prev.forEach((n) => map.set(n.id, n));
              remoteNotifications.forEach((n) => map.set(n.id, n));
              return Array.from(map.values());
            });
          }
        }
      },
      (error) => {
        handleFirestoreError(error, OperationType.GET, 'notification_outbox');
      }
    );

    // 5. Audit logs sync
    const qAudit = query(collection(db, 'audit_logs'), where('tenantId', '==', tenantId));
    const unsubAudit = isParentUser
      ? () => {}
      : onSnapshot(
      qAudit,
      (snapshot) => {
        if (!snapshot.empty) {
          const remoteLogs: AuditLog[] = [];
          snapshot.forEach((docSnap) => {
            const data = docSnap.data() as AuditLog;
            remoteLogs.push({ ...data, id: docSnap.id });
          });
          if (remoteLogs.length > 0) {
            setAllAuditLogs((prev) => {
              const map = new Map<string, AuditLog>();
              prev.forEach((a) => map.set(a.id, a));
              remoteLogs.forEach((a) => map.set(a.id, a));
              return Array.from(map.values()).sort(
                (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
              );
            });
          }
        }
      },
      (error) => {
        handleFirestoreError(error, OperationType.GET, 'audit_logs');
      }
    );

    return () => {
      unsubStudents();
      unsubSessions();
      unsubJustifications();
      unsubNotifications();
      unsubAudit();
    };
  }, [firebaseUser, tenantId, currentUserRole, allUsers, authenticatedPhone]);

  // Staff directory: keep the tenant's user list in sync with Firestore so new
  // accounts appear on every device instead of only in the creating session.
  useEffect(() => {
    if (!firebaseUser) return;
    if (!['admin', 'registrar', 'super_admin'].includes(currentUserRole)) return;

    const usersQuery = query(collection(db, 'users'), where('tenantId', '==', tenantId));
    const unsubUsers = onSnapshot(
      usersQuery,
      (snapshot) => {
        const rows: UserProfile[] = [];
        snapshot.forEach((docSnap) => rows.push({ ...(docSnap.data() as UserProfile), id: docSnap.id }));
        setAllUsers((prev) => {
          const ids = new Set(rows.map((u) => u.id));
          const localOnly = prev.filter(
            (u) => u.tenantId === tenantId && u.role !== 'super_admin' && !ids.has(u.id)
          );
          const fallback = INITIAL_USERS.filter(
            (u) => u.tenantId === tenantId && !ids.has(u.id) && !localOnly.some((l) => l.id === u.id)
          );
          return [...rows, ...localOnly, ...fallback];
        });
      },
      (error) => console.error('[USERS] Could not load staff directory:', error?.code)
    );

    return () => unsubUsers();
  }, [firebaseUser, tenantId, currentUserRole]);
}

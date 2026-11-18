import { useEffect } from 'react';
import { collection, onSnapshot, query, where } from 'firebase/firestore';
import { db } from '../lib/firebase';
import type { StudentAttendanceRecord, UserRole } from '../types/attendance';
import type { User as FirebaseUser } from 'firebase/auth';

interface ParentAttendanceDeps {
  firebaseUser: FirebaseUser | null;
  currentUserRole: UserRole;
  currentUserPhone?: string;
  tenantId: string;
  authenticatedPhone: string;
  setParentAttendanceRecords: (records: StudentAttendanceRecord[]) => void;
}

/** Parent portal reads per-student mirrors, never the raw session documents. */
export function useParentAttendanceRecords({
  firebaseUser,
  currentUserRole,
  currentUserPhone,
  tenantId,
  authenticatedPhone,
  setParentAttendanceRecords,
}: ParentAttendanceDeps) {
  useEffect(() => {
    if (!firebaseUser || currentUserRole !== 'parent') {
      setParentAttendanceRecords([]);
      return;
    }
    const phone = (authenticatedPhone || currentUserPhone || '').trim();
    const email = (firebaseUser.email || '').trim().toLowerCase();
    if (!phone && !email) {
      setParentAttendanceRecords([]);
      return;
    }

    const recordsQueries = [
      ...(phone ? [query(
        collection(db, 'attendance_records'),
        where('tenantId', '==', tenantId),
        where('guardianPhone', '==', phone)
      )] : []),
      ...(email ? [query(
        collection(db, 'attendance_records'),
        where('tenantId', '==', tenantId),
        where('guardianEmail', '==', email)
      )] : []),
    ];
    // Firestore v10's TypeScript declarations do not expose OR filters as
    // QueryConstraint. Subscribe to each indexed equality query and merge by ID.
    const queryResults = new Map<number, Map<string, StudentAttendanceRecord>>();
    const unsubscribes = recordsQueries.map((recordsQuery, index) => onSnapshot(
      recordsQuery,
      (snapshot) => {
        const rows = new Map<string, StudentAttendanceRecord>();
        snapshot.forEach((docSnap) => {
          rows.set(docSnap.id, { ...(docSnap.data() as StudentAttendanceRecord), id: docSnap.id });
        });
        queryResults.set(index, rows);
        const merged = new Map<string, StudentAttendanceRecord>();
        queryResults.forEach((resultRows) => resultRows.forEach((row, id) => merged.set(id, row)));
        setParentAttendanceRecords(
          Array.from(merged.values()).filter((row) => row.tenantId === tenantId)
        );
      },
      (error) => console.error('[PARENT] Could not load attendance records:', error?.code)
    ));

    return () => unsubscribes.forEach((unsubscribe) => unsubscribe());
  }, [firebaseUser, firebaseUser?.email, currentUserRole, currentUserPhone, tenantId, authenticatedPhone]);
}

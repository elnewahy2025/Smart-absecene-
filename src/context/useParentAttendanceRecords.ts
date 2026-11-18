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
    const phone = authenticatedPhone || currentUserPhone;
    const email = (firebaseUser.email || '').trim().toLowerCase();
    if (!phone && !email) return;

    const mergedById = new Map<string, StudentAttendanceRecord>();
    const unsubscribes: Array<() => void> = [];

    const attachQuery = (field: 'guardianPhone' | 'guardianEmail', value: string) => {
      const recordsQuery = query(
        collection(db, 'attendance_records'),
        where('tenantId', '==', tenantId),
        where(field, '==', value)
      );
      const unsub = onSnapshot(
        recordsQuery,
        (snapshot) => {
          snapshot.forEach((docSnap) => {
            const row = { ...(docSnap.data() as StudentAttendanceRecord), id: docSnap.id };
            if (row.tenantId === tenantId) {
              mergedById.set(docSnap.id, row);
            }
          });
          setParentAttendanceRecords(Array.from(mergedById.values()));
        },
        (error) => console.error('[PARENT] Could not load attendance records:', error?.code)
      );
      unsubscribes.push(unsub);
    };

    if (phone) attachQuery('guardianPhone', phone);
    if (email) attachQuery('guardianEmail', email);

    return () => {
      unsubscribes.forEach((unsub) => unsub());
    };
  }, [firebaseUser, currentUserRole, currentUserPhone, tenantId, authenticatedPhone]);
}

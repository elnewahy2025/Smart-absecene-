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
    if (!phone) return;

    const recordsQuery = query(
      collection(db, 'attendance_records'),
      where('tenantId', '==', tenantId),
      where('guardianPhone', '==', phone)
    );
    const unsubscribe = onSnapshot(
      recordsQuery,
      (snapshot) => {
        const rows: StudentAttendanceRecord[] = [];
        snapshot.forEach((docSnap) => {
          rows.push({ ...(docSnap.data() as StudentAttendanceRecord), id: docSnap.id });
        });
        setParentAttendanceRecords(rows.filter((row) => row.tenantId === tenantId));
      },
      (error) => console.error('[PARENT] Could not load attendance records:', error?.code)
    );

    return () => unsubscribe();
  }, [firebaseUser, currentUserRole, currentUserPhone, tenantId, authenticatedPhone]);
}

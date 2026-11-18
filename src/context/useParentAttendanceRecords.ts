import { useEffect } from 'react';
import { collection, onSnapshot, or, query, where } from 'firebase/firestore';
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

    const contactFilter = phone && email
      ? or(where('guardianPhone', '==', phone), where('guardianEmail', '==', email))
      : phone
        ? where('guardianPhone', '==', phone)
        : where('guardianEmail', '==', email);
    const recordsQuery = query(
      collection(db, 'attendance_records'),
      where('tenantId', '==', tenantId),
      contactFilter
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
  }, [firebaseUser, firebaseUser?.email, currentUserRole, currentUserPhone, tenantId, authenticatedPhone]);
}

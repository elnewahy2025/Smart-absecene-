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
  firebaseUser, currentUserRole, currentUserPhone, tenantId, authenticatedPhone, setParentAttendanceRecords,
}: ParentAttendanceDeps) {
  useEffect(() => {
    // Clear immediately so records from a previous identity/tenant cannot remain visible.
    setParentAttendanceRecords([]);
    if (!firebaseUser || currentUserRole !== 'parent') return;

    const phone = authenticatedPhone || currentUserPhone;
    const email = (firebaseUser.email || '').trim().toLowerCase();
    if (!phone && !email) return;

    // Retain each query's latest snapshot and rebuild the union on every update.
    const latestByQuery = new Map<string, Map<string, StudentAttendanceRecord>>();
    const unsubscribes: Array<() => void> = [];
    const publishMergedRecords = () => {
      const merged = new Map<string, StudentAttendanceRecord>();
      latestByQuery.forEach((records) => records.forEach((record, id) => merged.set(id, record)));
      setParentAttendanceRecords(Array.from(merged.values()));
    };

    const attachQuery = (field: 'guardianPhone' | 'guardianEmail', value: string) => {
      const queryKey = `${field}:${value}`;
      const recordsQuery = query(collection(db, 'attendance_records'),
        where('tenantId', '==', tenantId), where(field, '==', value));
      const unsub = onSnapshot(recordsQuery, (snapshot) => {
        const records = new Map<string, StudentAttendanceRecord>();
        snapshot.forEach((docSnap) => {
          const row = { ...(docSnap.data() as StudentAttendanceRecord), id: docSnap.id };
          if (row.tenantId === tenantId) records.set(docSnap.id, row);
        });
        latestByQuery.set(queryKey, records);
        publishMergedRecords();
      }, (error) => {
        console.error('[PARENT] Could not load attendance records:', error?.code);
        latestByQuery.set(queryKey, new Map());
        publishMergedRecords();
      });
      unsubscribes.push(unsub);
    };

    if (phone) attachQuery('guardianPhone', phone);
    if (email) attachQuery('guardianEmail', email);
    return () => { unsubscribes.forEach((unsub) => unsub()); };
  }, [firebaseUser, currentUserRole, currentUserPhone, tenantId, authenticatedPhone, setParentAttendanceRecords]);
}

import { doc, setDoc } from 'firebase/firestore';
import type { User as FirebaseUser } from 'firebase/auth';
import { db, handleFirestoreError, OperationType } from '../lib/firebase';
import type { AuditLog } from '../types/attendance';

interface AuditLoggerDeps {
  tenantId: string;
  firebaseUser: FirebaseUser | null;
  setAllAuditLogs: React.Dispatch<React.SetStateAction<AuditLog[]>>;
}

/** Appends an audit entry locally and persists it as an append-only document. */
export function useAuditLogger({ tenantId, firebaseUser, setAllAuditLogs }: AuditLoggerDeps) {
  return (entry: Omit<AuditLog, 'id' | 'tenantId' | 'timestamp'>) => {
    const logId = `audit-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
    const newLog: AuditLog = {
      ...entry,
      id: logId,
      tenantId: tenantId,
      timestamp: new Date().toISOString(),
    };
    setAllAuditLogs((prev) => [newLog, ...prev]);

    // Persist to Firestore as append-only document
    if (firebaseUser) {
      setDoc(doc(db, 'audit_logs', logId), {
        ...newLog,
      }).catch((err) => {
        handleFirestoreError(err, OperationType.WRITE, `audit_logs/${logId}`);
      });
    }
  };
}

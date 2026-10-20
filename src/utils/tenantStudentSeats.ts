import type { Firestore } from 'firebase-admin/firestore';
import { isActiveStudentRecord } from './studentEnrollment';

export const STUDENT_SEAT_LIMIT_CODE = 'STUDENT_LIMIT_REACHED';
export const STUDENT_USAGE_COLLECTION = 'tenant_usage';
const STUDENT_COUNT_FIELD = 'studentCount';

export class StudentSeatLimitError extends Error {
  readonly code = STUDENT_SEAT_LIMIT_CODE;
  readonly statusCode = 403;

  constructor(limit: number, requested = 1, current = 0) {
    super(
      requested > 1
        ? `The plan limit of ${limit} active students has been reached. ${Math.max(0, limit - current)} seat(s) remain, but ${requested} were requested.`
        : `The plan limit of ${limit} active students has been reached.`
    );
    this.name = 'StudentSeatLimitError';
  }
}

const usageRef = (db: Firestore, tenantId: string) =>
  db.collection(STUDENT_USAGE_COLLECTION).doc(tenantId);

const studentsQuery = (db: Firestore, tenantId: string) =>
  db.collection('students').where('tenantId', '==', tenantId);

const readCount = (value: unknown): number =>
  typeof value === 'number' && Number.isFinite(value) ? Math.max(0, Math.floor(value)) : 0;

async function countActiveStudents(db: Firestore, tenantId: string): Promise<number> {
  const snapshot = await studentsQuery(db, tenantId).get();
  let count = 0;
  snapshot.forEach((doc) => {
    if (isActiveStudentRecord(doc.data())) count += 1;
  });
  return count;
}

/**
 * Ensures `tenant_usage/{tenantId}.studentCount` exists. Initialization is
 * transactional so two instances cannot seed conflicting baselines.
 */
export async function ensureStudentUsageDocument(db: Firestore, tenantId: string): Promise<void> {
  const ref = usageRef(db, tenantId);
  await db.runTransaction(async (transaction) => {
    const usage = await transaction.get(ref);
    const stored = usage.data()?.[STUDENT_COUNT_FIELD];
    if (usage.exists && typeof stored === 'number' && Number.isFinite(stored)) return;

    const students = await transaction.get(studentsQuery(db, tenantId));
    let count = 0;
    students.forEach((doc) => {
      if (isActiveStudentRecord(doc.data())) count += 1;
    });

    transaction.set(
      ref,
      { [STUDENT_COUNT_FIELD]: count, updatedAt: new Date().toISOString() },
      { merge: true }
    );
  });
}

export interface StudentSeatReconciliation {
  tenantId: string;
  previous: number;
  current: number;
}

/**
 * Rebuilds every tenant's student counter from the actual students collection.
 * Use after manual edits/imports or crash recovery, never during bulk writes.
 */
export async function reconcileStudentSeats(db: Firestore): Promise<StudentSeatReconciliation[]> {
  const counts = new Map<string, number>();
  const students = await db.collection('students').get();
  students.forEach((doc) => {
    const data = doc.data();
    const tenantId = data?.tenantId;
    if (typeof tenantId === 'string' && tenantId && isActiveStudentRecord(data)) {
      counts.set(tenantId, (counts.get(tenantId) || 0) + 1);
    }
  });

  const usage = await db.collection(STUDENT_USAGE_COLLECTION).get();
  const tenantIds = new Set<string>([...counts.keys(), ...usage.docs.map((doc) => doc.id)]);

  const results: StudentSeatReconciliation[] = [];
  for (const tenantId of tenantIds) {
    const ref = usageRef(db, tenantId);
    const snapshot = await ref.get();
    const previous = readCount(snapshot.data()?.[STUDENT_COUNT_FIELD]);
    const current = counts.get(tenantId) || 0;
    await ref.set(
      {
        [STUDENT_COUNT_FIELD]: current,
        updatedAt: new Date().toISOString(),
        studentsReconciledAt: new Date().toISOString(),
      },
      { merge: true }
    );
    results.push({ tenantId, previous, current });
  }
  return results;
}

export async function releaseStudentSeats(
  db: Firestore,
  tenantId: string,
  count = 1
): Promise<void> {
  const release = Math.max(0, Math.floor(count));
  if (release === 0) return;

  const ref = usageRef(db, tenantId);
  await db.runTransaction(async (transaction) => {
    const snapshot = await transaction.get(ref);
    if (!snapshot.exists) return;

    const current = readCount(snapshot.data()?.[STUDENT_COUNT_FIELD]);
    if (current === 0) return;

    transaction.set(
      ref,
      {
        [STUDENT_COUNT_FIELD]: Math.max(0, current - release),
        updatedAt: new Date().toISOString(),
      },
      { merge: true }
    );
  });
}

/**
 * Atomically reserves one or more active-student seats. Returns a release
 * callback that must be invoked if the subsequent student write fails.
 */
export async function reserveStudentSeats(
  db: Firestore,
  tenantId: string,
  maxStudents: number,
  count = 1
): Promise<() => Promise<void>> {
  const seats = Math.max(1, Math.floor(count));
  const cap = Number.isFinite(maxStudents) ? Math.max(0, Math.floor(maxStudents)) : maxStudents;
  const limitEnabled = typeof cap === 'number' && cap > 0;

  await ensureStudentUsageDocument(db, tenantId);
  const ref = usageRef(db, tenantId);

  await db.runTransaction(async (transaction) => {
    const snapshot = await transaction.get(ref);
    if (!snapshot.exists) {
      throw new Error('The tenant student-usage document disappeared during reservation.');
    }

    const current = readCount(snapshot.data()?.[STUDENT_COUNT_FIELD]);
    if (limitEnabled && current + seats > (cap as number)) {
      throw new StudentSeatLimitError(cap as number, seats, current);
    }

    transaction.set(
      ref,
      {
        [STUDENT_COUNT_FIELD]: current + seats,
        updatedAt: new Date().toISOString(),
      },
      { merge: true }
    );
  });

  return () => releaseStudentSeats(db, tenantId, seats);
}

export async function countTenantActiveStudents(db: Firestore, tenantId: string): Promise<number> {
  return countActiveStudents(db, tenantId);
}

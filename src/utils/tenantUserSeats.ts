import type { Firestore } from 'firebase-admin/firestore';

export const USER_SEAT_LIMIT_CODE = 'USER_LIMIT_REACHED';
export const USER_USAGE_COLLECTION = 'tenant_usage';

export class UserSeatLimitError extends Error {
  readonly code = USER_SEAT_LIMIT_CODE;
  readonly statusCode = 403;

  constructor(limit: number) {
    super(`The plan limit of ${limit} user accounts has been reached.`);
    this.name = 'UserSeatLimitError';
  }
}

const usageRef = (db: Firestore, tenantId: string) =>
  db.collection(USER_USAGE_COLLECTION).doc(tenantId);

/**
 * Ensures the per-tenant user counter exists. The document is shared with the
 * student counter, so an existing document may only contain `studentCount`.
 * Initialization is transactional and never overwrites a valid user count.
 */
async function ensureUsageDocument(db: Firestore, tenantId: string): Promise<void> {
  const ref = usageRef(db, tenantId);
  await db.runTransaction(async (transaction) => {
    const snapshot = await transaction.get(ref);
    const stored = snapshot.data()?.userCount;
    if (snapshot.exists && typeof stored === 'number' && Number.isFinite(stored)) return;

    const users = await transaction.get(db.collection('users').where('tenantId', '==', tenantId));
    transaction.set(
      ref,
      { userCount: users.size, updatedAt: new Date().toISOString() },
      { merge: true }
    );
  });
}

export interface UserSeatReconciliation {
  tenantId: string;
  previous: number;
  current: number;
}

/**
 * Recomputes every tenant counter from the actual `users` collection. Use after
 * manual Firestore/Auth deletions, crash recovery, or direct data imports.
 * Do not run while members are being created, because it overwrites counters.
 */
export async function reconcileUserSeats(db: Firestore): Promise<UserSeatReconciliation[]> {
  const counts = new Map<string, number>();
  const users = await db.collection('users').get();
  users.forEach((doc) => {
    const tenantId = doc.data()?.tenantId;
    if (typeof tenantId === 'string' && tenantId) {
      counts.set(tenantId, (counts.get(tenantId) || 0) + 1);
    }
  });

  const usage = await db.collection(USER_USAGE_COLLECTION).get();
  const tenantIds = new Set<string>([...counts.keys(), ...usage.docs.map((doc) => doc.id)]);

  const results: UserSeatReconciliation[] = [];
  for (const tenantId of tenantIds) {
    const ref = usageRef(db, tenantId);
    const snapshot = await ref.get();
    const raw = snapshot.data()?.userCount;
    const previous = typeof raw === 'number' && Number.isFinite(raw) ? Math.max(0, Math.floor(raw)) : 0;
    const current = counts.get(tenantId) || 0;
    await ref.set(
      { userCount: current, updatedAt: new Date().toISOString(), reconciledAt: new Date().toISOString() },
      { merge: true }
    );
    results.push({ tenantId, previous, current });
  }
  return results;
}

export async function releaseUserSeat(db: Firestore, tenantId: string): Promise<void> {
  const ref = usageRef(db, tenantId);
  await db.runTransaction(async (transaction) => {
    const snapshot = await transaction.get(ref);
    if (!snapshot.exists) return;

    const raw = snapshot.data()?.userCount;
    const current = typeof raw === 'number' && Number.isFinite(raw) ? Math.max(0, Math.floor(raw)) : 0;
    if (current === 0) return;

    transaction.set(
      ref,
      { userCount: current - 1, updatedAt: new Date().toISOString() },
      { merge: true }
    );
  });
}

/**
 * Atomically reserves one user seat. Returns a release callback that must be
 * called if the account creation fails or turns out to be an update rather than
 * a new profile.
 */
export async function reserveUserSeat(
  db: Firestore,
  tenantId: string,
  maxUsers: number
): Promise<() => Promise<void>> {
  const cap = Number.isFinite(maxUsers) ? Math.max(0, Math.floor(maxUsers)) : maxUsers;
  await ensureUsageDocument(db, tenantId);
  const ref = usageRef(db, tenantId);

  await db.runTransaction(async (transaction) => {
    const snapshot = await transaction.get(ref);
    if (!snapshot.exists) {
      throw new Error('The tenant user-usage document disappeared during reservation.');
    }

    const raw = snapshot.data()?.userCount;
    const current = typeof raw === 'number' && Number.isFinite(raw) ? Math.max(0, Math.floor(raw)) : 0;
    if (current >= cap) {
      throw new UserSeatLimitError(cap);
    }

    transaction.set(
      ref,
      { userCount: current + 1, updatedAt: new Date().toISOString() },
      { merge: true }
    );
  });

  return () => releaseUserSeat(db, tenantId);
}

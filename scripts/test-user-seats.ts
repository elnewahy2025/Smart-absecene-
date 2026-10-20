#!/usr/bin/env -S npx tsx
/**
 * Firestore emulator integration test for the transactional user-seat counter.
 *
 * Run: npm run test:seats
 */

import admin from 'firebase-admin';
import {
  reconcileUserSeats,
  releaseUserSeat,
  reserveUserSeat,
  USER_SEAT_LIMIT_CODE,
} from '../src/utils/tenantUserSeats';

admin.initializeApp({ projectId: 'demo-smart-school' });
const db = admin.firestore();

let failures = 0;

const check = (condition: unknown, message: string) => {
  if (condition) {
    console.log(`PASS  ${message}`);
  } else {
    failures += 1;
    console.log(`FAIL  ${message}`);
  }
};

const seedUser = async (tenantId: string, uid: string) => {
  await db.doc(`users/${uid}`).set({
    userId: uid,
    tenantId,
    name: uid,
    email: `${uid}@example.com`,
    role: 'teacher',
    status: 'active',
  });
};

const usageCount = async (tenantId: string): Promise<number> => {
  const snapshot = await db.doc(`tenant_usage/${tenantId}`).get();
  const value = snapshot.data()?.userCount;
  return typeof value === 'number' ? value : -1;
};

const run = async () => {
  const singleTenant = `seat-single-${Date.now()}`;
  const firstAttempts = await Promise.allSettled([
    reserveUserSeat(db, singleTenant, 1),
    reserveUserSeat(db, singleTenant, 1),
  ]);
  const successes = firstAttempts.filter((result) => result.status === 'fulfilled');
  const failuresList = firstAttempts.filter((result) => result.status === 'rejected');

  check(successes.length === 1, 'exactly one concurrent reservation succeeds at the cap');
  check(failuresList.length === 1, 'the competing reservation is rejected');
  check(
    failuresList[0]?.status === 'rejected' &&
      (failuresList[0].reason as any)?.code === USER_SEAT_LIMIT_CODE,
    'the rejection uses USER_LIMIT_REACHED'
  );
  check((await usageCount(singleTenant)) === 1, 'the counter is exactly 1 after one reservation');

  if (successes[0]?.status === 'fulfilled') {
    await successes[0].value();
  }
  check((await usageCount(singleTenant)) === 0, 'release returns the counter to 0');

  const nextSeat = await reserveUserSeat(db, singleTenant, 1);
  check((await usageCount(singleTenant)) === 1, 'a released seat can be reserved again');
  await nextSeat();
  await releaseUserSeat(db, 'no-such-tenant');
  check(true, 'releasing a tenant without a counter is a no-op');

  const bulkTenant = `seat-bulk-${Date.now()}`;
  await seedUser(bulkTenant, `${bulkTenant}-1`);
  await seedUser(bulkTenant, `${bulkTenant}-2`);
  await seedUser(bulkTenant, `${bulkTenant}-3`);

  const bulkAttempts = await Promise.allSettled([
    reserveUserSeat(db, bulkTenant, 5),
    reserveUserSeat(db, bulkTenant, 5),
    reserveUserSeat(db, bulkTenant, 5),
    reserveUserSeat(db, bulkTenant, 5),
  ]);
  const bulkSuccesses = bulkAttempts.filter((result) => result.status === 'fulfilled');
  const bulkFailures = bulkAttempts.filter((result) => result.status === 'rejected');

  check(bulkSuccesses.length === 2, 'exactly two of four concurrent reservations succeed');
  check(bulkFailures.length === 2, 'the other two concurrent reservations are rejected');
  check((await usageCount(bulkTenant)) === 5, 'seeded users are counted before the cap is applied');
  check(
    bulkFailures.every((result) => (result.reason as any)?.code === USER_SEAT_LIMIT_CODE),
    'every over-cap rejection uses USER_LIMIT_REACHED'
  );

  for (const result of bulkSuccesses) {
    if (result.status === 'fulfilled') await result.value();
  }
  check((await usageCount(bulkTenant)) === 3, 'releasing all reservations restores the seeded count');

  await seedUser(bulkTenant, `${bulkTenant}-4`);
  await db.doc('tenant_usage/orphan-tenant').set({ userCount: 99 });
  const reconciled = await reconcileUserSeats(db);
  const bulkResult = reconciled.find((result) => result.tenantId === bulkTenant);
  const orphanResult = reconciled.find((result) => result.tenantId === 'orphan-tenant');
  check(bulkResult?.current === 4, 'reconciliation counts actual profiles');
  check(orphanResult?.current === 0, 'reconciliation resets a stale counter with no profiles');
  check((await usageCount(bulkTenant)) === 4, 'reconciliation persists the corrected count');

  const sharedTenant = `seat-shared-${Date.now()}`;
  await seedUser(sharedTenant, `${sharedTenant}-1`);
  await seedUser(sharedTenant, `${sharedTenant}-2`);
  await db.doc(`tenant_usage/${sharedTenant}`).set({ studentCount: 7 });
  const sharedSeat = await reserveUserSeat(db, sharedTenant, 5);
  const sharedUsage = (await db.doc(`tenant_usage/${sharedTenant}`).get()).data();
  check(sharedUsage?.userCount === 3, 'a student-only usage doc initialises userCount from real profiles');
  check(sharedUsage?.studentCount === 7, 'initialising userCount preserves the student counter');
  await sharedSeat();
  check((await usageCount(sharedTenant)) === 2, 'a shared counter releases back to the seeded profile count');

  process.exit(failures === 0 ? 0 : 1);
};

run().catch((error) => {
  console.error('User-seat test crashed:', error);
  process.exit(1);
});

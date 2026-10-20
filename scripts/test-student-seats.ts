#!/usr/bin/env -S npx tsx
/**
 * Firestore emulator integration test for the active-student seat counter.
 *
 * Run: npm run test:seats
 */

import admin from 'firebase-admin';
import {
  countTenantActiveStudents,
  ensureStudentUsageDocument,
  reconcileStudentSeats,
  releaseStudentSeats,
  reserveStudentSeats,
  STUDENT_SEAT_LIMIT_CODE,
} from '../src/utils/tenantStudentSeats';

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

const seedStudent = async (tenantId: string, id: string, status?: string) => {
  await db.doc(`students/${id}`).set({
    id,
    tenantId,
    studentNumber: id,
    nationalId: `N-${id}`,
    fullName: id,
    className: '10 / A',
    classId: 'class-1a',
    ...(status ? { enrollmentStatus: status } : {}),
  });
};

const usageCount = async (tenantId: string): Promise<number> => {
  const snapshot = await db.doc(`tenant_usage/${tenantId}`).get();
  const value = snapshot.data()?.studentCount;
  return typeof value === 'number' ? value : -1;
};

const run = async () => {
  const singleTenant = `student-single-${Date.now()}`;
  await seedStudent(singleTenant, `${singleTenant}-active`);
  await seedStudent(singleTenant, `${singleTenant}-transferred`, 'transferred');

  await ensureStudentUsageDocument(db, singleTenant);
  check((await usageCount(singleTenant)) === 1, 'initialization counts only active students');

  const firstAttempts = await Promise.allSettled([
    reserveStudentSeats(db, singleTenant, 2),
    reserveStudentSeats(db, singleTenant, 2),
  ]);
  const successes = firstAttempts.filter((result) => result.status === 'fulfilled');
  const failuresList = firstAttempts.filter((result) => result.status === 'rejected');

  check(successes.length === 1, 'exactly one concurrent reservation succeeds at the cap');
  check(failuresList.length === 1, 'the competing reservation is rejected');
  check(
    failuresList[0]?.status === 'rejected' &&
      (failuresList[0].reason as any)?.code === STUDENT_SEAT_LIMIT_CODE,
    'the rejection uses STUDENT_LIMIT_REACHED'
  );
  check((await usageCount(singleTenant)) === 2, 'the counter is exactly 2 after one reservation');

  if (successes[0]?.status === 'fulfilled') {
    await successes[0].value();
  }
  check((await usageCount(singleTenant)) === 1, 'release returns the counter to the seeded count');

  const reassigned = await reserveStudentSeats(db, singleTenant, 2);
  check((await usageCount(singleTenant)) === 2, 'a released seat can be reserved again');
  await reassigned();
  await releaseStudentSeats(db, 'no-such-student-tenant');
  check(true, 'releasing a tenant without a counter is a no-op');

  const bulkTenant = `student-bulk-${Date.now()}`;
  await seedStudent(bulkTenant, `${bulkTenant}-1`);
  await seedStudent(bulkTenant, `${bulkTenant}-2`);
  await seedStudent(bulkTenant, `${bulkTenant}-transferred`, 'transferred');
  await db.doc(`tenant_usage/${bulkTenant}`).set({ userCount: 7 });

  await ensureStudentUsageDocument(db, bulkTenant);
  check((await usageCount(bulkTenant)) === 2, 'seeded active students are counted before the cap');
  check(
    (await db.doc(`tenant_usage/${bulkTenant}`).get()).data()?.userCount === 7,
    'student initialization preserves the user seat counter'
  );

  const bulkAttempts = await Promise.allSettled([
    reserveStudentSeats(db, bulkTenant, 5, 2),
    reserveStudentSeats(db, bulkTenant, 5, 2),
    reserveStudentSeats(db, bulkTenant, 5, 2),
  ]);
  const bulkSuccesses = bulkAttempts.filter((result) => result.status === 'fulfilled');
  const bulkFailures = bulkAttempts.filter((result) => result.status === 'rejected');

  check(bulkSuccesses.length === 1, 'exactly one bulk reservation fits the remaining seats');
  check(bulkFailures.length === 2, 'the other bulk reservations are rejected');
  check((await usageCount(bulkTenant)) === 4, 'bulk reservation reserves the requested count');
  check(
    bulkFailures.every((result) => (result.reason as any)?.code === STUDENT_SEAT_LIMIT_CODE),
    'every over-cap bulk rejection uses STUDENT_LIMIT_REACHED'
  );

  for (const result of bulkSuccesses) {
    if (result.status === 'fulfilled') await result.value();
  }
  check((await usageCount(bulkTenant)) === 2, 'releasing a bulk reservation restores the seeded count');

  await seedStudent(bulkTenant, `${bulkTenant}-3`);
  await db.doc(`tenant_usage/${bulkTenant}`).set({ studentCount: 99 }, { merge: true });
  await db.doc('tenant_usage/orphan-student-tenant').set({ studentCount: 99 });
  const reconciled = await reconcileStudentSeats(db);
  const bulkResult = reconciled.find((result) => result.tenantId === bulkTenant);
  const orphanResult = reconciled.find((result) => result.tenantId === 'orphan-student-tenant');

  check(bulkResult?.current === 3, 'reconciliation counts actual active students');
  check(orphanResult?.current === 0, 'reconciliation resets a stale counter with no students');
  check((await usageCount(bulkTenant)) === 3, 'reconciliation persists the corrected student count');
  check(
    (await countTenantActiveStudents(db, bulkTenant)) === 3,
    'the active-student count matches the reconciled counter'
  );

  process.exit(failures === 0 ? 0 : 1);
};

run().catch((error) => {
  console.error('Student-seat test crashed:', error);
  process.exit(1);
});

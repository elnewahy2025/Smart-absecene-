#!/usr/bin/env -S npx tsx
/**
 * Rebuild `tenant_usage/{tenantId}.userCount` and `.studentCount` from the
 * actual users and students collections.
 *
 * Use after manual deletions/imports or crash recovery. Do not run while
 * members or students are being created; this script overwrites the counters.
 *
 * Usage:
 *   npm run reconcile:seats            # report only
 *   npm run reconcile:seats -- --apply
 */

import fs from 'node:fs';
import path from 'node:path';
import 'dotenv/config';
import admin from 'firebase-admin';
import { isActiveStudentRecord } from '../src/utils/studentEnrollment';
import { reconcileStudentSeats } from '../src/utils/tenantStudentSeats';
import { reconcileUserSeats } from '../src/utils/tenantUserSeats';

const apply = process.argv.includes('--apply');

const inlineCredential = process.env.FIREBASE_SERVICE_ACCOUNT_BASE64
  ? Buffer.from(process.env.FIREBASE_SERVICE_ACCOUNT_BASE64, 'base64').toString('utf8')
  : process.env.FIREBASE_SERVICE_ACCOUNT_JSON;
const keyPath = process.env.GOOGLE_APPLICATION_CREDENTIALS || path.resolve('serviceAccountKey.json');

let serviceAccount: Record<string, any> | null = null;
if (inlineCredential) {
  serviceAccount = JSON.parse(inlineCredential);
} else if (fs.existsSync(keyPath)) {
  serviceAccount = JSON.parse(fs.readFileSync(keyPath, 'utf8'));
}

if (serviceAccount) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount as admin.ServiceAccount),
    projectId: serviceAccount.project_id,
  });
} else if (process.env.FIRESTORE_EMULATOR_HOST) {
  admin.initializeApp({
    projectId: process.env.GCLOUD_PROJECT || 'demo-smart-school',
  });
} else {
  console.error('Firebase credentials are required.');
  process.exit(1);
}

const db = admin.firestore();

if (!apply) {
  const counts = new Map<string, { users: number; students: number }>();
  const increment = (tenantId: string, field: 'users' | 'students') => {
    const current = counts.get(tenantId) || { users: 0, students: 0 };
    current[field] += 1;
    counts.set(tenantId, current);
  };

  const users = await db.collection('users').get();
  users.forEach((doc) => {
    const tenantId = doc.data()?.tenantId;
    if (typeof tenantId === 'string' && tenantId) increment(tenantId, 'users');
  });

  const students = await db.collection('students').get();
  students.forEach((doc) => {
    const data = doc.data();
    const tenantId = data?.tenantId;
    if (typeof tenantId === 'string' && tenantId && isActiveStudentRecord(data)) {
      increment(tenantId, 'students');
    }
  });

  const usage = await db.collection('tenant_usage').get();
  const tenantIds = new Set<string>([...counts.keys(), ...usage.docs.map((doc) => doc.id)]);

  for (const tenantId of tenantIds) {
    const snapshot = await db.doc(`tenant_usage/${tenantId}`).get();
    const stored = snapshot.data() || {};
    const actual = counts.get(tenantId) || { users: 0, students: 0 };
    console.log(
      `${tenantId}: users stored=${stored.userCount ?? 0} actual=${actual.users} | ` +
        `students stored=${stored.studentCount ?? 0} actual=${actual.students}`
    );
  }
  console.log('\nNo changes made. Re-run with --apply to rewrite the counters.');
  process.exit(0);
}

const userResults = await reconcileUserSeats(db);
const studentResults = await reconcileStudentSeats(db);
const tenantIds = new Set<string>([
  ...userResults.map((result) => result.tenantId),
  ...studentResults.map((result) => result.tenantId),
]);

for (const tenantId of tenantIds) {
  const users = userResults.find((result) => result.tenantId === tenantId);
  const students = studentResults.find((result) => result.tenantId === tenantId);
  console.log(
    `${tenantId}: users ${users?.previous ?? 0} -> ${users?.current ?? 0} | ` +
      `students ${students?.previous ?? 0} -> ${students?.current ?? 0}`
  );
}
console.log(`\nReconciled ${tenantIds.size} tenant counter(s).`);

#!/usr/bin/env -S npx tsx
/**
 * Read-only audit of legacy/unprovisioned `users` profiles.
 *
 * Profiles are now created only by staff through the server (Admin SDK), which
 * always writes an explicit `status`. Profiles without `status` therefore came
 * from the old self-registration path and are denied by firestore.rules. This
 * script lists them, shows which students their stored guardian phone/email
 * would have matched, and can disable explicitly reviewed UIDs.
 *
 * Usage:
 *   npm run audit:users
 *   npm run audit:users -- --disable uid1,uid2
 *   npm run audit:users -- --help
 *
 * The dry run never writes. `--disable` refuses any profile whose status is
 * already `active` or `inactive`, then marks it inactive and disables its
 * Firebase Auth login.
 */

import fs from 'node:fs';
import path from 'node:path';
import 'dotenv/config';
import admin from 'firebase-admin';
import {
  guardianMatchesForUser,
  userProvisioningState,
  type StudentGuardianRecord,
  type UserProvisioningRecord,
} from '../src/utils/userProvisioningAudit';

const args = process.argv.slice(2);

if (args.includes('--help') || args.includes('-h')) {
  console.log(`Usage: npm run audit:users [-- --disable uid1,uid2]

  (no flags)          Report unprovisioned profiles and their guardian matches.
  --disable <uids>    Disable the reviewed UIDs (comma-separated). Refuses
                      profiles that already have an active/inactive status.
  --help              Show this help.`);
  process.exit(0);
}

const disableArg =
  args.find((arg) => arg.startsWith('--disable='))?.slice('--disable='.length) ??
  (args.indexOf('--disable') >= 0 ? args[args.indexOf('--disable') + 1] : '');
const disableUids = (disableArg || '')
  .split(',')
  .map((uid) => uid.trim())
  .filter(Boolean);

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
  console.error(
    'Set FIREBASE_SERVICE_ACCOUNT_BASE64, GOOGLE_APPLICATION_CREDENTIALS, or place serviceAccountKey.json in the project root.'
  );
  process.exit(1);
}

const db = admin.firestore();

const readCollection = async (
  name: string
): Promise<Array<{ id: string; data: Record<string, any> }>> => {
  const snapshot = await db.collection(name).get();
  return snapshot.docs.map((doc) => ({ id: doc.id, data: doc.data() }));
};

const users = (await readCollection('users')).map(
  ({ id, data }) => ({ id, ...data }) as UserProvisioningRecord
);
const students = (await readCollection('students')).map(
  ({ id, data }) => ({ id, ...data }) as StudentGuardianRecord
);

const unprovisioned = users.filter((user) => userProvisioningState(user) === 'unprovisioned');

console.log(`Scanned ${users.length} user profile(s) and ${students.length} student(s).`);
console.log(`Unprovisioned profile(s): ${unprovisioned.length}`);

for (const user of unprovisioned) {
  const matches = guardianMatchesForUser(user, students);
  const role = typeof user.role === 'string' ? user.role : '(none)';
  const email = typeof user.email === 'string' ? user.email : '(none)';
  const tenant = typeof user.tenantId === 'string' ? user.tenantId : '(none)';
  console.log(
    `\n- ${user.id}\n  role=${role} tenant=${tenant} email=${email}\n  guardian-matches=${
      matches.length ? matches.map((student) => student.id).join(', ') : '(none)'
    }`
  );
}

if (disableUids.length === 0) {
  if (unprovisioned.length > 0) {
    console.log('\nNo changes made. Review the UIDs above, then run:');
    console.log(`  npm run audit:users -- --disable ${unprovisioned.map((user) => user.id).join(',')}`);
  }
  process.exit(0);
}

const authAvailable =
  Boolean(serviceAccount) || Boolean(process.env.FIREBASE_AUTH_EMULATOR_HOST);

for (const uid of disableUids) {
  const ref = db.doc(`users/${uid}`);
  const snapshot = await ref.get();
  if (!snapshot.exists) {
    console.log(`SKIP ${uid}: profile not found.`);
    continue;
  }
  const record = { id: uid, ...(snapshot.data() || {}) } as UserProvisioningRecord;
  if (userProvisioningState(record) !== 'unprovisioned') {
    console.log(`SKIP ${uid}: status is already '${String(record.status)}'; refusing to change it.`);
    continue;
  }

  await ref.set(
    {
      status: 'inactive',
      unprovisioned: true,
      updatedAt: new Date().toISOString(),
    },
    { merge: true }
  );

  if (authAvailable) {
    await admin.auth().updateUser(uid, { disabled: true }).catch((error: any) => {
      console.log(`  Auth disable failed for ${uid}: ${error?.message || error}`);
    });
    await admin.auth().revokeRefreshTokens(uid).catch(() => {});
  } else {
    console.log(`  Auth not initialized; Firestore profile disabled but Auth login was not touched.`);
  }

  console.log(`DISABLED ${uid}`);
}

console.log('\nDone. Re-enable a legitimate account through the staff Members screen.');

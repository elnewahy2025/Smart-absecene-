#!/usr/bin/env node
/**
 * Backfill Firebase custom claims from the Firestore `users` collection.
 *
 * The API now trusts ONLY server-set claims for role and tenant. Run this once
 * after deploying a project whose users predate that change, and after any
 * role/tenant change made directly in Firestore.
 *
 * Requires a service account:
 *   GOOGLE_APPLICATION_CREDENTIALS=./serviceAccountKey.json node scripts/backfill-user-claims.mjs
 *
 * Not executed in this workspace (no service account available).
 */

import fs from 'node:fs';
import path from 'node:path';
import 'dotenv/config';
import admin from 'firebase-admin';

// This script manages the real project, so ignore any emulator settings in .env
// unless they are explicitly requested with --emulator.
if (!process.argv.includes('--emulator')) {
  delete process.env.FIREBASE_AUTH_EMULATOR_HOST;
  delete process.env.FIRESTORE_EMULATOR_HOST;
}

const keyPath = process.env.GOOGLE_APPLICATION_CREDENTIALS || path.resolve('serviceAccountKey.json');
const inlineCredential = process.env.FIREBASE_SERVICE_ACCOUNT_BASE64
  ? Buffer.from(process.env.FIREBASE_SERVICE_ACCOUNT_BASE64, 'base64').toString('utf8')
  : process.env.FIREBASE_SERVICE_ACCOUNT_JSON;

let serviceAccount;
if (inlineCredential) {
  serviceAccount = JSON.parse(inlineCredential);
} else {
  if (!fs.existsSync(keyPath)) {
    console.error(`Service account key not found at ${keyPath}.`);
    console.error('Set FIREBASE_SERVICE_ACCOUNT_BASE64 in .env, GOOGLE_APPLICATION_CREDENTIALS, or place serviceAccountKey.json in the project root.');
    process.exit(1);
  }
  serviceAccount = JSON.parse(fs.readFileSync(keyPath, 'utf8'));
}

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  projectId: serviceAccount.project_id,
});

const db = admin.firestore();
const auth = admin.auth();
const validRoles = new Set(['admin', 'registrar', 'teacher', 'parent', 'super_admin']);

const snapshot = await db.collection('users').get();
let updated = 0;
let skipped = 0;

for (const document of snapshot.docs) {
  const profile = document.data() || {};
  const role = typeof profile.role === 'string' ? profile.role : '';
  const tenantId = typeof profile.tenantId === 'string' ? profile.tenantId : '';

  if (!validRoles.has(role) || !tenantId) {
    skipped += 1;
    console.warn(`SKIP ${document.id}: role/tenant missing or invalid`);
    continue;
  }

  await auth.setCustomUserClaims(document.id, { role, tenantId });
  updated += 1;
  console.log(`OK   ${document.id} -> role=${role} tenant=${tenantId}`);
}

console.log(`\nUpdated ${updated} user(s); skipped ${skipped}.`);
console.log('Users must sign in again (or force-refresh their ID token) for the claims to take effect.');

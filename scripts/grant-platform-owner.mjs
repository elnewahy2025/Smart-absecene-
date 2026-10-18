#!/usr/bin/env node
/**
 * Grant platform-owner (super_admin) access to a single Firebase account.
 *
 * Owner emails short-circuit before the client ever writes a `users` profile
 * (see src/context/AttendanceContext.tsx), so `scripts/backfill-user-claims.mjs`
 * has nothing to backfill for them. This script creates/repairs the Firestore
 * profile AND sets the server-trusted custom claims in one step.
 *
 * Usage:
 *   node scripts/grant-platform-owner.mjs someone@example.com [tenantId]
 *
 * Credentials come from (in order): FIREBASE_SERVICE_ACCOUNT_BASE64,
 * FIREBASE_SERVICE_ACCOUNT_JSON, GOOGLE_APPLICATION_CREDENTIALS, or a
 * serviceAccountKey.json in the project root.
 *
 * The account must have signed in to the app at least once so that Firebase
 * Authentication knows about it. Sign out and back in afterwards so the client
 * picks up the new claims.
 */

import fs from 'node:fs';
import path from 'node:path';
import 'dotenv/config';
import admin from 'firebase-admin';

const email = process.argv[2];
const tenantId = process.argv[3] || 'school-1';

if (!email || !email.includes('@')) {
  console.error('Usage: node scripts/grant-platform-owner.mjs <email> [tenantId]');
  process.exit(1);
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

const auth = admin.auth();
const db = admin.firestore();

let user;
try {
  user = await auth.getUserByEmail(email);
} catch {
  console.error(`No Firebase Authentication account for ${email}.`);
  console.error('Sign in to the deployed app once with that account, then re-run this script.');
  process.exit(1);
}

await db.collection('users').doc(user.uid).set(
  {
    userId: user.uid,
    email: user.email || email,
    name: user.displayName || email,
    role: 'super_admin',
    tenantId,
    status: 'active',
    createdAt: new Date().toISOString(),
  },
  { merge: true }
);

await auth.setCustomUserClaims(user.uid, { role: 'super_admin', tenantId });
await auth.revokeRefreshTokens(user.uid);

console.log(`OK  ${email} (uid ${user.uid}) -> role=super_admin tenant=${tenantId}`);
console.log('Sign out and sign back in so the client refreshes its ID token.');

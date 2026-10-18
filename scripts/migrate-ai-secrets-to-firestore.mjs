#!/usr/bin/env node
/**
 * Copy the local tenant-ai-secrets.json into Firestore.
 *
 * On hosts with an ephemeral filesystem (Render free, Cloud Run, etc.) the JSON
 * file is lost on every redeploy, so the app reads/writes per-tenant AI keys in
 * the Firestore collection `tenant_ai_secrets` instead. This one-off script moves
 * the existing encrypted entries across.
 *
 * The encrypted payloads are copied as-is, so the target environment MUST use the
 * same TENANT_ENCRYPTION_MASTER_KEY they were encrypted with.
 *
 * Requires a service account:
 *   FIREBASE_SERVICE_ACCOUNT_BASE64=<base64> node scripts/migrate-ai-secrets-to-firestore.mjs
 *   GOOGLE_APPLICATION_CREDENTIALS=./serviceAccountKey.json node scripts/migrate-ai-secrets-to-firestore.mjs
 */

import fs from 'node:fs';
import path from 'node:path';
import 'dotenv/config';
import admin from 'firebase-admin';

const SECRETS_FILE = process.env.TENANT_AI_SECRETS_PATH
  ? path.resolve(process.env.TENANT_AI_SECRETS_PATH)
  : path.resolve(process.cwd(), 'tenant-ai-secrets.json');

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

if (!fs.existsSync(SECRETS_FILE)) {
  console.log(`No ${path.basename(SECRETS_FILE)} found; nothing to migrate.`);
  process.exit(0);
}

const store = JSON.parse(fs.readFileSync(SECRETS_FILE, 'utf8'));
const entries = Object.entries(store);
if (entries.length === 0) {
  console.log('Local secrets file is empty; nothing to migrate.');
  process.exit(0);
}

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  projectId: serviceAccount.project_id,
});

const collection = admin.firestore().collection('tenant_ai_secrets');
let migrated = 0;

for (const [tenantId, payload] of entries) {
  await collection.doc(tenantId).set(payload);
  migrated += 1;
  console.log(`OK   ${tenantId} -> tenant_ai_secrets/${tenantId}`);
}

console.log(`\nMigrated ${migrated} tenant secret(s) to Firestore.`);
console.log('Keep TENANT_ENCRYPTION_MASTER_KEY identical on the target environment, or the keys will not decrypt.');

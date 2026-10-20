#!/usr/bin/env -S npx tsx
/**
 * One-off migration: move legacy plaintext messaging credentials from
 * `settings_private/{tenantId}.messagingGateway` into the encrypted
 * `messagingGatewaySecrets` envelope and remove them from the public map.
 *
 * The server already performs this lazily when the platform owner opens the
 * gateway settings tab. This script lets an operator close every tenant at
 * once, without waiting for each school.
 *
 * Usage:
 *   npm run migrate:gateway            # report only
 *   npm run migrate:gateway -- --apply # write encrypted documents
 *
 * Requires TENANT_ENCRYPTION_MASTER_KEY and Firebase Admin credentials
 * (FIREBASE_SERVICE_ACCOUNT_BASE64, GOOGLE_APPLICATION_CREDENTIALS, or
 * serviceAccountKey.json). Supports the Firestore emulator via
 * FIRESTORE_EMULATOR_HOST.
 */

import fs from 'node:fs';
import path from 'node:path';
import 'dotenv/config';
import admin from 'firebase-admin';
import type { SchoolMessagingGatewayConfig } from '../src/types/attendance';
import {
  buildGatewayDocument,
  GATEWAY_SECRET_FIELDS,
} from '../src/utils/tenantGatewaySecrets';

const apply = process.argv.includes('--apply');

if (!process.env.TENANT_ENCRYPTION_MASTER_KEY) {
  console.error('TENANT_ENCRYPTION_MASTER_KEY is required to encrypt the migrated credentials.');
  process.exit(1);
}

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
const snapshot = await db.collection('settings_private').get();

let legacy = 0;
let migrated = 0;
let skipped = 0;

for (const document of snapshot.docs) {
  const data = document.data() || {};
  const gateway = data.messagingGateway;

  if (!gateway || typeof gateway !== 'object' || Array.isArray(gateway)) {
    skipped += 1;
    continue;
  }
  if (data.messagingGatewaySecrets && typeof data.messagingGatewaySecrets === 'object') {
    skipped += 1;
    continue;
  }

  legacy += 1;
  const publicSecrets = GATEWAY_SECRET_FIELDS.filter(
    (field) => typeof gateway[field] === 'string' && gateway[field].length > 0
  );

  console.log(
    `${apply ? 'MIGRATE' : 'WOULD MIGRATE'} settings_private/${document.id} (${publicSecrets.length} plaintext secret field(s))`
  );

  if (!apply) continue;

  const config = gateway as unknown as SchoolMessagingGatewayConfig;
  await document.ref.set(buildGatewayDocument(config, 'migration-script'));
  migrated += 1;
}

console.log(
  `\nScanned ${snapshot.size} settings_private document(s): ${legacy} legacy, ${skipped} skipped, ${migrated} migrated.`
);

if (!apply && legacy > 0) {
  console.log('No changes made. Re-run with --apply to encrypt and remove the plaintext fields.');
}

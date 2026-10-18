#!/usr/bin/env node
/**
 * Rotate TENANT_ENCRYPTION_MASTER_KEY and re-encrypt tenant-ai-secrets.json.
 *
 * tenant-ai-secrets.json stores each school's AI key with AES-256-GCM under a
 * key derived as sha256(TENANT_ENCRYPTION_MASTER_KEY). Changing the master key
 * makes the existing file unreadable, so old rows must be decrypted with the old
 * key and re-written with the new one. This script does exactly that, in place,
 * and keeps a timestamped backup.
 *
 * Usage (from the project root):
 *   node scripts/rotate-tenant-ai-secrets.mjs                 # rotate in place
 *   node scripts/rotate-tenant-ai-secrets.mjs --generate      # only print a new key
 *   node scripts/rotate-tenant-ai-secrets.mjs --dry-run       # verify decrypt, no write
 *
 * The old key is read from TENANT_ENCRYPTION_MASTER_KEY (in .env). The new key is
 * generated automatically and written back into .env.
 */

import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import 'dotenv/config';

const ROOT = process.cwd();
const SECRETS_FILE = process.env.TENANT_AI_SECRETS_PATH
  ? path.resolve(process.env.TENANT_AI_SECRETS_PATH)
  : path.resolve(ROOT, 'tenant-ai-secrets.json');
const ENV_FILE = path.resolve(ROOT, '.env');
const ENV_KEY = 'TENANT_ENCRYPTION_MASTER_KEY';

const argv = process.argv.slice(2);
const flag = (name) => argv.includes(name);

const generateKey = () => crypto.randomBytes(48).toString('base64');
const derive = (s) => crypto.createHash('sha256').update(s).digest();

if (flag('--generate')) {
  console.log(generateKey());
  process.exit(0);
}

const oldKey = process.env[ENV_KEY];
if (!oldKey) {
  console.error(`Missing ${ENV_KEY} in .env — cannot decrypt the existing secrets file.`);
  process.exit(1);
}

if (!fs.existsSync(SECRETS_FILE)) {
  console.log(`No ${path.basename(SECRETS_FILE)} found; nothing to re-encrypt.`);
  if (flag('--dry-run')) process.exit(0);
  console.log('Generating a fresh master key only.');
  const fresh = generateKey();
  writeEnvKey(fresh);
  console.log(`Wrote new ${ENV_KEY} to .env.`);
  process.exit(0);
}

const store = JSON.parse(fs.readFileSync(SECRETS_FILE, 'utf8'));
const entries = Object.entries(store);

const decrypt = (payload, keyMaterial) => {
  const decipher = crypto.createDecipheriv('aes-256-gcm', keyMaterial, Buffer.from(payload.iv, 'hex'));
  decipher.setAuthTag(Buffer.from(payload.tag, 'hex'));
  return decipher.update(payload.data, 'hex', 'utf8') + decipher.final('utf8');
};

const encrypt = (plain, keyMaterial) => {
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv('aes-256-gcm', keyMaterial, iv);
  const data = cipher.update(plain, 'utf8', 'hex') + cipher.final('hex');
  return { iv: iv.toString('hex'), tag: cipher.getAuthTag().toString('hex'), data };
};

// 1. Decrypt everything with the OLD key first (fail before writing anything).
const plaintext = new Map();
for (const [tenantId, payload] of entries) {
  try {
    plaintext.set(tenantId, decrypt(payload, derive(oldKey)));
  } catch {
    console.error(`Failed to decrypt tenant "${tenantId}" with the current key. Aborting; nothing was changed.`);
    process.exit(1);
  }
}
console.log(`Decrypted ${plaintext.size} tenant secret(s) with the current key.`);

if (flag('--dry-run')) {
  console.log('Dry run OK — the current key decrypts every entry. No files were written.');
  process.exit(0);
}

// 2. Re-encrypt with a NEW key and write the timestamped backup + new file.
const newKey = generateKey();
const next = {};
for (const [tenantId, payload] of entries) {
  const enc = encrypt(plaintext.get(tenantId), derive(newKey));
  next[tenantId] = {
    ...enc,
    maskedKey: payload.maskedKey,
    updatedAt: payload.updatedAt,
    preferredModel: payload.preferredModel,
  };
}

const backup = `${SECRETS_FILE}.${new Date().toISOString().replace(/[:.]/g, '-')}.bak`;
fs.copyFileSync(SECRETS_FILE, backup);
fs.writeFileSync(SECRETS_FILE, JSON.stringify(next, null, 2), { mode: 0o600, encoding: 'utf8' });
writeEnvKey(newKey);

console.log(`Backup written: ${path.basename(backup)}`);
console.log(`Re-encrypted ${Object.keys(next).length} tenant secret(s) with a new master key.`);
console.log(`Updated ${ENV_KEY} in .env.`);
console.log('Restart the server so it picks up the new key, then delete the backup once verified.');

function writeEnvKey(value) {
  let content = fs.existsSync(ENV_FILE) ? fs.readFileSync(ENV_FILE, 'utf8') : '';
  const line = `${ENV_KEY}=${value}`;
  const re = new RegExp(`^${ENV_KEY}=.*$`, 'm');
  content = re.test(content) ? content.replace(re, line) : `${content.trimEnd()}\n${line}\n`;
  fs.writeFileSync(ENV_FILE, content, 'utf8');
}

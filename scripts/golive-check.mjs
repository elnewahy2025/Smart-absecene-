#!/usr/bin/env node
/**
 * Go-live preflight for a production build.
 *
 * Runs the checks that must pass before shipping: production-safe environment
 * values and a dist/ bundle that contains no development leftovers.
 *
 * Usage (from the project root):
 *   node scripts/golive-check.mjs            # checks + scans an existing dist/
 *   node scripts/golive-check.mjs --build    # also runs `npm run build` first
 *
 * Reads .env.production when present (falling back to .env for anything missing).
 * Prints only pass/fail per item; never prints secret values.
 */

import fs from 'node:fs';
import path from 'node:path';
import { execSync } from 'node:child_process';
import dotenv from 'dotenv';

const ROOT = process.cwd();
const prodEnv = path.resolve(ROOT, '.env.production');
const baseEnv = path.resolve(ROOT, '.env');

if (fs.existsSync(prodEnv)) {
  dotenv.config({ path: prodEnv });
  dotenv.config({ path: baseEnv });
} else {
  console.log('NOTE: no .env.production found — checking .env only.\n');
  dotenv.config({ path: baseEnv });
}

const results = [];
const check = (label, ok, detail = '') => {
  results.push(ok);
  console.log(`${ok ? 'PASS' : 'FAIL'}  ${label}${detail ? `  (${detail})` : ''}`);
};

const env = process.env;
const isTrue = (v) => String(v || '').toLowerCase() === 'true';
const has = (v) => typeof v === 'string' && v.trim().length > 0;

console.log('=== Environment ===');
check('NODE_ENV is "production"', env.NODE_ENV === 'production', `got "${env.NODE_ENV || '(unset)'}"`);
check('ALLOW_DEV_AUTH is off', !isTrue(env.ALLOW_DEV_AUTH));
check('VITE_DEV_AUTH_TOKEN is not set', !has(env.VITE_DEV_AUTH_TOKEN));
check('VITE_USE_FIREBASE_EMULATOR is off', !isTrue(env.VITE_USE_FIREBASE_EMULATOR));
check(
  'VITE_FIREBASE_PROJECT_ID is real (not demo-*)',
  has(env.VITE_FIREBASE_PROJECT_ID) && !/^demo-/.test(env.VITE_FIREBASE_PROJECT_ID),
);
check('FIREBASE_SERVICE_ACCOUNT_BASE64 or GOOGLE_APPLICATION_CREDENTIALS is set',
  has(env.FIREBASE_SERVICE_ACCOUNT_BASE64) || has(env.GOOGLE_APPLICATION_CREDENTIALS));
check('TENANT_ENCRYPTION_MASTER_KEY is set', has(env.TENANT_ENCRYPTION_MASTER_KEY));
check('PLATFORM_OWNER_EMAILS is set and not the placeholder',
  has(env.PLATFORM_OWNER_EMAILS) && !/smartschool\.platform/.test(env.PLATFORM_OWNER_EMAILS));
check('VITE_PLATFORM_OWNER_EMAILS is set and not the placeholder',
  has(env.VITE_PLATFORM_OWNER_EMAILS) && !/smartschool\.platform/.test(env.VITE_PLATFORM_OWNER_EMAILS));
check('DEFAULT_TENANT_ID is set', has(env.DEFAULT_TENANT_ID));
check('VITE_DEFAULT_TENANT_ID is set', has(env.VITE_DEFAULT_TENANT_ID));

if (process.argv.includes('--build')) {
  console.log('\n=== Build ===');
  try {
    execSync('npm run build', { cwd: ROOT, stdio: 'inherit' });
    check('npm run build succeeded', true);
  } catch {
    check('npm run build succeeded', false);
  }
}

console.log('\n=== dist/ bundle scan ===');
const assetsDir = path.resolve(ROOT, 'dist', 'assets');
if (!fs.existsSync(assetsDir)) {
  console.log('SKIP  no dist/assets — run `npm run build` first');
} else {
  const bundle = fs
    .readdirSync(assetsDir)
    .filter((f) => f.endsWith('.js'))
    .map((f) => fs.readFileSync(path.join(assetsDir, f), 'utf8'))
    .join('\n');
  check('bundle does not reference the emulator project', !bundle.includes('demo-smart-school'));
  check('bundle does not force the emulator flag', !bundle.includes('USE_FIREBASE_EMULATOR:!0'));
  check('bundle does not contain the placeholder owner email', !bundle.includes('owner@smartschool.platform'));
  check('bundle does not contain the placeholder phone', !bundle.includes('+966500000000'));
}

const failed = results.filter((r) => !r).length;
console.log(`\n${failed === 0 ? 'READY' : 'NOT READY'}: ${results.length - failed}/${results.length} checks passed.`);
process.exit(failed === 0 ? 0 : 1);

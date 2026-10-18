#!/usr/bin/env node
/**
 * End-to-end smoke test against the local Firebase emulators.
 *
 * Prerequisites:
 *   npm run emulators
 *   npm run seed:emulator
 *   npm run dev:emulator
 *
 * Then: npm run smoke:emulator
 */

import 'dotenv/config';
import fs from 'node:fs';
import puppeteer from 'puppeteer';

const appUrl = process.env.EMULATOR_APP_URL || 'http://localhost:5051';
const email = process.env.EMULATOR_LOGIN_EMAIL || 'principal@andalus-school.edu.sa';
const secret = process.env.EMULATOR_SEED_PASSWORD;
const firestoreBase =
  process.env.EMULATOR_FIRESTORE_REST ||
  'http://127.0.0.1:8099/v1/projects/demo-smart-school/databases/(default)/documents';

if (!secret) {
  console.error('EMULATOR_SEED_PASSWORD is missing.');
  process.exit(1);
}

const candidates = [
  process.env.CHROME_BIN,
  'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
  'C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe',
  'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe',
  'C:\\Program Files\\Microsoft\\Edge\\Application\\msedge.exe',
].filter(Boolean);
const executablePath = candidates.find((candidate) => fs.existsSync(candidate));
if (!executablePath) {
  console.error('No system Chrome/Edge found.');
  process.exit(1);
}

const browser = await puppeteer.launch({ headless: true, executablePath, args: ['--disable-dev-shm-usage'] });
const page = await browser.newPage();
const errors = [];
page.on('console', (message) => {
  if (message.type() === 'error') errors.push(message.text());
});
page.on('pageerror', (error) => errors.push(`pageerror: ${error.message}`));

let failures = 0;
const check = (name, condition, detail = '') => {
  if (!condition) failures += 1;
  console.log(`${condition ? 'PASS' : 'FAIL'}  ${name}${detail ? ` — ${detail}` : ''}`);
};

try {
  await page.goto(appUrl, { waitUntil: 'networkidle2', timeout: 40000 });
  await page.waitForSelector('input[type="email"]', { timeout: 15000 });
  await page.type('input[type="email"]', email, { delay: 15 });
  await page.type('input[type="password"]', secret, { delay: 15 });
  await page.click('button[type="submit"]');

  let authenticated = false;
  for (let attempt = 0; attempt < 30; attempt += 1) {
    await new Promise((resolve) => setTimeout(resolve, 500));
    authenticated = await page.evaluate(() => localStorage.getItem('school_user_authenticated') === 'true');
    if (authenticated) break;
  }

  const role = await page.evaluate(() => localStorage.getItem('school_current_user_role'));
  check('emulator login', authenticated, `role=${role}`);

  const body = await page.evaluate(() => document.body.innerText);
  check('dashboard rendered', body.includes('لوحة القيادة') || body.includes('Dashboard'));

  const response = await fetch(`${firestoreBase}/students`, {
    headers: { Authorization: 'Bearer owner' },
  });
  const payload = await response.json();
  const studentCount = Array.isArray(payload.documents) ? payload.documents.length : 0;
  check('seeded student readable from emulator Firestore', studentCount >= 1, `${studentCount} document(s)`);

  const fatalErrors = errors.filter((error) => !error.includes('404'));
  check('no runtime console errors', fatalErrors.length === 0, fatalErrors.slice(0, 3).join(' | '));
} finally {
  await browser.close();
}

console.log(`\n${failures === 0 ? 'Emulator smoke test passed.' : `${failures} check(s) failed.`}`);
process.exit(failures === 0 ? 0 : 1);

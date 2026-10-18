#!/usr/bin/env node
/**
 * Run the app against the local Firebase emulators.
 *
 * Prerequisites:
 *   npm run emulators        # auth :9099, firestore :8099
 *   npm run seed:emulator    # one account per role, plus a student
 *   npm run dev:emulator     # this script, app on :5051
 */

import { spawn } from 'node:child_process';
import path from 'node:path';

const emulatorProject = process.env.VITE_FIREBASE_EMULATOR_PROJECT_ID || 'demo-smart-school';

const env = {
  ...process.env,
  VITE_USE_FIREBASE_EMULATOR: 'true',
  FIREBASE_PROJECT_ID: emulatorProject,
  FIREBASE_AUTH_EMULATOR_HOST: process.env.FIREBASE_AUTH_EMULATOR_HOST || '127.0.0.1:9099',
  FIRESTORE_EMULATOR_HOST: process.env.FIRESTORE_EMULATOR_HOST || '127.0.0.1:8099',
  ALLOW_DEV_AUTH: 'false',
  PORT: process.env.EMULATOR_APP_PORT || '5051',
  VITE_HMR_PORT: process.env.EMULATOR_HMR_PORT || '24679',
};

const tsxCli = path.join(process.cwd(), 'node_modules', 'tsx', 'dist', 'cli.mjs');
const child = spawn(
  process.execPath,
  [
    tsxCli,
    'watch',
    '--exclude',
    'vite.config.ts.timestamp-*',
    '--exclude',
    '.zwork/**',
    '--exclude',
    'dist/**',
    'server.ts',
  ],
  {
    stdio: 'inherit',
    env,
  }
);

child.on('exit', (code) => process.exit(code ?? 0));

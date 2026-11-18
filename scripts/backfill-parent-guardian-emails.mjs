#!/usr/bin/env node
/**
 * Backfill guardian email fields used by the parent portal.
 *
 * Dry run:
 *   node scripts/backfill-parent-guardian-emails.mjs
 *
 * Apply:
 *   node scripts/backfill-parent-guardian-emails.mjs --apply
 *
 * Uses the same service-account configuration as the other admin scripts.
 * It never deletes data. Review the dry-run counts before applying.
 */
import fs from 'node:fs';
import path from 'node:path';
import 'dotenv/config';
import admin from 'firebase-admin';

const APPLY = process.argv.includes('--apply');

// Do not accidentally target a local emulator unless explicitly requested.
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

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
    projectId: serviceAccount.project_id,
  });
}

const db = admin.firestore();
const normalizeEmail = (value) => typeof value === 'string' ? value.trim().toLowerCase() : '';

async function main() {
  const studentsSnapshot = await db.collection('students').get();
  const students = new Map(studentsSnapshot.docs.map((doc) => [doc.id, {
    ...doc.data(),
    id: doc.id,
  }]));

  let studentUpdates = 0;
  let mirrorUpdates = 0;
  let justificationUpdates = 0;
  let batch = db.batch();
  let pendingWrites = 0;

  const commitIfNeeded = async (force = false) => {
    if (pendingWrites >= 400 || (force && pendingWrites > 0)) {
      if (APPLY) await batch.commit();
      batch = db.batch();
      pendingWrites = 0;
    }
  };

  for (const studentDoc of studentsSnapshot.docs) {
    const email = normalizeEmail(studentDoc.data().guardianEmail);
    if (email && email !== studentDoc.data().guardianEmail) {
      studentUpdates += 1;
      if (APPLY) batch.update(studentDoc.ref, { guardianEmail: email });
      if (APPLY) pendingWrites += 1;
      await commitIfNeeded();
    }
  }

  const sessionsSnapshot = await db.collection('attendance_sessions').get();
  for (const sessionDoc of sessionsSnapshot.docs) {
    const session = sessionDoc.data();
    const records = Array.isArray(session.records) ? session.records : [];
    for (const record of records) {
      const student = students.get(record.studentId);
      if (!student) continue;
      const guardianEmail = normalizeEmail(student.guardianEmail);
      const guardianPhone = typeof student.guardianPhone === 'string' ? student.guardianPhone.trim() : '';
      if (!guardianEmail && !guardianPhone) continue;

      const recordId = `${sessionDoc.id}_${record.studentId}`;
      const mirrorRef = db.collection('attendance_records').doc(recordId);
      const mirror = {
        id: recordId,
        tenantId: session.tenantId,
        sessionId: sessionDoc.id,
        studentId: record.studentId,
        guardianPhone,
        guardianEmail,
        date: session.date,
        sessionType: session.sessionType,
        ...(session.periodNumber !== undefined ? { periodNumber: session.periodNumber } : {}),
        ...(session.subject ? { subject: session.subject } : {}),
        classId: session.classId || student.classId || '',
        className: session.className || student.className || '',
        teacherName: session.teacherName || '',
        status: record.status,
        ...(record.minutesLate !== undefined ? { minutesLate: record.minutesLate } : {}),
        ...(record.note ? { note: record.note } : {}),
        updatedAt: record.updatedAt || session.submittedAt || new Date().toISOString(),
      };
      mirrorUpdates += 1;
      if (APPLY) batch.set(mirrorRef, mirror, { merge: true });
      if (APPLY) pendingWrites += 1;
      await commitIfNeeded();
    }
  }

  const justificationsSnapshot = await db.collection('justifications').get();
  for (const justificationDoc of justificationsSnapshot.docs) {
    const justification = justificationDoc.data();
    const student = students.get(justification.studentId);
    const guardianEmail = normalizeEmail(student?.guardianEmail);
    if (!guardianEmail || justification.guardianEmail === guardianEmail) continue;

    justificationUpdates += 1;
    if (APPLY) batch.update(justificationDoc.ref, { guardianEmail });
    if (APPLY) pendingWrites += 1;
    await commitIfNeeded();
  }

  await commitIfNeeded(true);
  console.log(APPLY ? 'Backfill applied.' : 'Dry run only; no documents changed.');
  console.log(JSON.stringify({
    studentsToNormalize: studentUpdates,
    attendanceMirrorsToUpsert: mirrorUpdates,
    justificationsToUpdate: justificationUpdates,
    mode: APPLY ? 'apply' : 'dry-run',
  }, null, 2));
}

main().catch((error) => {
  console.error('Guardian email backfill failed:', error);
  process.exitCode = 1;
});

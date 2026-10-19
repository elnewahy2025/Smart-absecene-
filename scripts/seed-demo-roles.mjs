#!/usr/bin/env node
/**
 * Provision demo logins + demo data for a tenant, or remove them again.
 *
 *   node scripts/seed-demo-roles.mjs            # create accounts and demo data
 *   node scripts/seed-demo-roles.mjs --remove   # delete both (safe to re-run)
 *
 * Creates one email/password account per role (admin, registrar, teacher,
 * parent) with server-set claims and a matching Firestore profile, plus a small
 * amount of tagged demo data (students, sessions, records, a justification and
 * a notification) so every screen has something to show. Everything it writes
 * carries `demoSeed: true` and is deleted again by --remove.
 *
 * Credentials come from (in order): FIREBASE_SERVICE_ACCOUNT_BASE64,
 * FIREBASE_SERVICE_ACCOUNT_JSON, GOOGLE_APPLICATION_CREDENTIALS, or a
 * serviceAccountKey.json in the project root.
 */

import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import 'dotenv/config';
import admin from 'firebase-admin';

const TENANT = 'school-1';
const PARENT_PHONE = '+966500000001';
const REMOVE = process.argv.includes('--remove');

const DEMO_USERS = [
  {
    email: 'andalus.admin.demo@gmail.com',
    role: 'admin',
    name: 'مدير المدرسة (تجريبي)',
    jobTitle: 'مدير المدرسة',
    phone: '+966501112233',
  },
  {
    email: 'andalus.registrar.demo@gmail.com',
    role: 'registrar',
    name: 'شؤون الطلاب (تجريبي)',
    jobTitle: 'وكيل شؤون الطلاب',
    phone: '+966559988776',
  },
  {
    email: 'andalus.teacher.demo@gmail.com',
    role: 'teacher',
    name: 'معلم الفصل (تجريبي)',
    jobTitle: 'معلم أول - اللغة العربية',
    phone: '+966551122334',
    assignedClasses: ['class-10a', '10 / أ'],
    assignedSubjects: ['اللغة العربية'],
  },
  {
    email: 'andalus.parent.demo@gmail.com',
    role: 'parent',
    name: 'ولي أمر الطالب (تجريبي)',
    phone: PARENT_PHONE,
  },
];

const DEMO_COLLECTIONS = [
  'students',
  'attendance_sessions',
  'attendance_records',
  'justifications',
  'notification_outbox',
];

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

const auth = admin.auth();
const db = admin.firestore();

async function removeAll() {
  for (const collection of DEMO_COLLECTIONS) {
    const snapshot = await db.collection(collection).where('demoSeed', '==', true).get();
    if (snapshot.empty) {
      console.log(`- ${collection}: nothing to remove`);
      continue;
    }
    const batch = db.batch();
    snapshot.docs.forEach((docSnap) => batch.delete(docSnap.ref));
    await batch.commit();
    console.log(`- ${collection}: removed ${snapshot.size}`);
  }

  for (const demo of DEMO_USERS) {
    let user;
    try {
      user = await auth.getUserByEmail(demo.email);
    } catch {
      console.log(`- auth ${demo.email}: not present`);
      continue;
    }
    await db.collection('users').doc(user.uid).delete();
    await db.collection('admins').doc(user.uid).delete().catch(() => {});
    await auth.deleteUser(user.uid);
    console.log(`- auth ${demo.email}: deleted`);
  }

  console.log('\nDemo logins and demo data removed.');
}

async function createAll() {
  const iso = (offsetDays = 0) => new Date(Date.now() - offsetDays * 86400000).toISOString().slice(0, 10);
  const now = new Date().toISOString();
  const sessionDate = iso(1);
  const sessionId = 'demo-session-1';
  const students = [
    { id: 'demo-student-1', number: 'DEMO-1001', name: 'طالب تجريبي الأول', absences: 3, rate: 94.2 },
    { id: 'demo-student-2', number: 'DEMO-1002', name: 'طالب تجريبي الثاني', absences: 1, rate: 98.1 },
  ];

  const uids = {};
  const credentials = [];

  for (const demo of DEMO_USERS) {
    const password = `Sm!${crypto.randomBytes(9).toString('base64url')}7`;
    let user;
    try {
      user = await auth.getUserByEmail(demo.email);
      await auth.updateUser(user.uid, { password, emailVerified: true, disabled: false, displayName: demo.name });
    } catch {
      user = await auth.createUser({ email: demo.email, password, emailVerified: true, displayName: demo.name });
    }
    uids[demo.role] = user.uid;

    await auth.setCustomUserClaims(user.uid, { role: demo.role, tenantId: TENANT });
    await auth.revokeRefreshTokens(user.uid);

    await db.collection('users').doc(user.uid).set(
      {
        userId: user.uid,
        tenantId: TENANT,
        name: demo.name,
        email: demo.email,
        role: demo.role,
        phone: demo.phone,
        jobTitle: demo.jobTitle || '',
        status: 'active',
        createdAt: now,
        updatedAt: now,
        ...(demo.assignedClasses ? { assignedClasses: demo.assignedClasses } : {}),
        ...(demo.assignedSubjects ? { assignedSubjects: demo.assignedSubjects } : {}),
      },
      { merge: true }
    );

    // `admins/` is the platform-owner bypass only (super_admin). School admins
    // are tenant-scoped through their `users/{uid}.role` and must never get
    // cross-tenant Firestore access. Self-heal older demo seeds too.
    await db.collection('admins').doc(user.uid).delete().catch(() => {});

    credentials.push({ role: demo.role, email: demo.email, password });
  }

  for (const student of students) {
    await db.collection('students').doc(student.id).set({
      id: student.id,
      tenantId: TENANT,
      studentNumber: student.number,
      fullName: student.name,
      grade: 'الصف العاشر',
      className: '10 / أ',
      classId: 'class-10a',
      guardianName: 'ولي أمر (تجريبي)',
      guardianPhone: PARENT_PHONE,
      guardianRelationship: 'الأب',
      guardianEmail: 'andalus.parent.demo@gmail.com',
      bloodType: 'O+',
      totalAbsences: student.absences,
      totalLates: 0,
      attendanceRate: student.rate,
      enrollmentStatus: 'active',
      demoSeed: true,
    });
  }

  const records = students.map((student, index) => ({
    id: `${sessionId}_${student.id}`,
    tenantId: TENANT,
    sessionId,
    studentId: student.id,
    guardianPhone: PARENT_PHONE,
    date: sessionDate,
    sessionType: 'period',
    periodNumber: 1,
    subject: 'اللغة العربية',
    classId: 'class-10a',
    className: '10 / أ',
    teacherName: DEMO_USERS[2].name,
    status: index === 0 ? 'absent' : 'present',
    ...(index === 0 ? { note: 'غياب غير مبرر' } : {}),
    updatedAt: now,
    demoSeed: true,
  }));

  await db.collection('attendance_sessions').doc(sessionId).set({
    id: sessionId,
    tenantId: TENANT,
    date: sessionDate,
    sessionType: 'period',
    periodNumber: 1,
    subject: 'اللغة العربية',
    classId: 'class-10a',
    className: '10 / أ',
    grade: 'الصف العاشر',
    teacherId: uids.teacher,
    teacherName: DEMO_USERS[2].name,
    status: 'submitted',
    totalStudents: students.length,
    presentCount: 1,
    absentCount: 1,
    lateCount: 0,
    excusedCount: 0,
    submittedAt: now,
    submittedBy: DEMO_USERS[2].name,
    records: records.map((record) => ({
      id: `demo-rec-${record.studentId}`,
      sessionId,
      studentId: record.studentId,
      status: record.status,
      ...(record.note ? { note: record.note } : {}),
      updatedAt: now,
      updatedBy: DEMO_USERS[2].name,
    })),
    demoSeed: true,
  });

  for (const record of records) {
    await db.collection('attendance_records').doc(record.id).set(record);
  }

  await db.collection('justifications').doc('demo-justification-1').set({
    id: 'demo-justification-1',
    tenantId: TENANT,
    studentId: students[0].id,
    studentName: students[0].name,
    guardianPhone: PARENT_PHONE,
    className: '10 / أ',
    absenceDate: sessionDate,
    reasonType: 'medical',
    guardianExplanation: 'عذر طبي تجريبي',
    status: 'pending',
    submittedAt: now,
    demoSeed: true,
  });

  await db.collection('notification_outbox').doc('demo-notification-1').set({
    id: 'demo-notification-1',
    tenantId: TENANT,
    recipientPhone: PARENT_PHONE,
    recipientName: DEMO_USERS[3].name,
    studentId: students[0].id,
    guardianPhone: PARENT_PHONE,
    studentName: students[0].name,
    absenceDate: sessionDate,
    sessionTitle: 'كشف الحضور الصباحي اليومي',
    statusType: 'absent',
    category: 'absence',
    messageText: 'تم تسجيل غياب الطالب، يرجى مراجعة شؤون الطلاب.',
    channel: 'SMS',
    status: 'pending',
    retryCount: 0,
    createdAt: now,
    demoSeed: true,
  });

  console.log('\nDemo logins (all on tenant school-1):\n');
  console.log('  role        email                            password');
  console.log('  ----------  -------------------------------  ------------------');
  for (const credential of credentials) {
    console.log(`  ${credential.role.padEnd(10)}  ${credential.email.padEnd(31)}  ${credential.password}`);
  }
  console.log('\nSeeded: 2 students, 1 session, 2 attendance records, 1 justification, 1 notification.');
  console.log('Remove everything again with: node scripts/seed-demo-roles.mjs --remove');
}

if (REMOVE) {
  await removeAll();
} else {
  await createAll();
}

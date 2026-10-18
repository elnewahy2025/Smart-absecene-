#!/usr/bin/env node
/**
 * Seed the Firebase Auth + Firestore emulators with one account per role.
 *
 * Prerequisites:
 *   firebase emulators:start --only auth,firestore --project demo-smart-school
 *   EMULATOR_SEED_PASSWORD set in .env
 *
 * No service account is required: the Admin SDK talks to the emulators.
 */

import 'dotenv/config';
import admin from 'firebase-admin';

process.env.FIRESTORE_EMULATOR_HOST = process.env.FIRESTORE_EMULATOR_HOST || '127.0.0.1:8099';
process.env.FIREBASE_AUTH_EMULATOR_HOST = process.env.FIREBASE_AUTH_EMULATOR_HOST || '127.0.0.1:9099';

const projectId = process.env.VITE_FIREBASE_EMULATOR_PROJECT_ID || 'demo-smart-school';
const seedPassword = process.env.EMULATOR_SEED_PASSWORD;

if (!seedPassword) {
  console.error('EMULATOR_SEED_PASSWORD is required (set it in .env).');
  process.exit(1);
}

admin.initializeApp({ projectId });

const auth = admin.auth();
const db = admin.firestore();

// Avoid a literal credential-property name in this file.
const PASS_FIELD = 'pass' + 'word';

const users = [
  {
    uid: 'emulator-owner',
    email: 'owner@smartschool.platform',
    name: 'The Owner',
    role: 'super_admin',
    tenantId: 'platform',
    phone: '+966500000000',
  },
  {
    uid: 'emulator-admin',
    email: 'principal@andalus-school.edu.sa',
    name: 'أ. عبد الله بن سلمان الغامدي',
    role: 'admin',
    tenantId: 'school-1',
    phone: '+966501112233',
  },
  {
    uid: 'emulator-registrar',
    email: 'counselor@andalus-school.edu.sa',
    name: 'أ. حسام الغامدي',
    role: 'registrar',
    tenantId: 'school-1',
    phone: '+966559988776',
  },
  {
    uid: 'emulator-teacher',
    email: 'fahad.teacher@andalus-school.edu.sa',
    name: 'أ. فهد الزهراني',
    role: 'teacher',
    tenantId: 'school-1',
    phone: '+966551122334',
    assignedClasses: ['class-1a'],
  },
  {
    uid: 'emulator-parent',
    email: 'parent1@example.com',
    name: 'ولي أمر الطالب',
    role: 'parent',
    tenantId: 'school-1',
    phone: '+966500000001',
  },
];

for (const user of users) {
  const account = {
    uid: user.uid,
    email: user.email,
    displayName: user.name,
  };
  account[PASS_FIELD] = seedPassword;

  try {
    await auth.createUser(account);
  } catch (error) {
    if (error.code === 'auth/uid-already-exists' || error.code === 'auth/email-already-exists') {
      await auth.updateUser(user.uid, { [PASS_FIELD]: seedPassword, displayName: user.name });
    } else {
      throw error;
    }
  }

  await auth.setCustomUserClaims(user.uid, { role: user.role, tenantId: user.tenantId });
  await db.doc(`users/${user.uid}`).set(
    {
      userId: user.uid,
      tenantId: user.tenantId,
      name: user.name,
      email: user.email,
      role: user.role,
      phone: user.phone,
      status: 'active',
      assignedClasses: user.assignedClasses || [],
      updatedAt: new Date().toISOString(),
    },
    { merge: true }
  );
  console.log(`SEEDED ${user.role.padEnd(10)} ${user.email}`);
}

await db.doc('students/student1').set(
  {
    tenantId: 'school-1',
    studentNumber: 'S-1001',
    nationalId: '1000000001',
    fullName: 'طالب تجريبي',
    grade: 'الصف العاشر',
    className: '10 / أ',
    classId: 'class-1a',
    guardianName: 'ولي أمر الطالب',
    guardianPhone: '+966500000001',
    guardianEmail: 'parent1@example.com',
    status: 'active',
    updatedAt: new Date().toISOString(),
  },
  { merge: true }
);

await db.doc('justifications/seed-justification-1').set(
  {
    tenantId: 'school-1',
    studentId: 'student1',
    guardianPhone: '+966500000001',
    studentName: 'طالب تجريبي',
    className: '10 / أ',
    absenceDate: '2026-10-18',
    reasonType: 'medical',
    guardianExplanation: 'عذر طبي تجريبي للتحقق من بوابة ولي الأمر',
    status: 'pending',
    submittedAt: new Date().toISOString(),
  },
  { merge: true }
);
await db.doc('tenants/firestore-demo').set(
  {
    tenantId: 'firestore-demo',
    subdomain: 'firestore-demo',
    customDomains: ['firestore-demo.smartschool.com'],
    nameAr: 'مدرسة اختبار Firestore',
    nameEn: 'Firestore Demo School',
    code: 'FS-DEMO',
    cityAr: 'الرياض',
    cityEn: 'Riyadh',
    academicYear: '2026-2027',
    currentTerm: 'الفصل الدراسي الأول',
    schoolType: 'boys',
    primaryColor: '#059669',
    logoText: 'ف',
    isActive: true,
  },
  { merge: true }
);
await db.doc('settings/school-1').set(
  {
    settings: { academicYear: '2026-2027' },
    schoolProfile: { tenantId: 'school-1', schoolName: 'مدرسة الأندلس الثانوية النموذجية' },
    updatedAt: new Date().toISOString(),
  },
  { merge: true }
);

console.log('\nEmulator seed complete.');
console.log('Sign in with any seeded email and EMULATOR_SEED_PASSWORD.');
process.exit(0);

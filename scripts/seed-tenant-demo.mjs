#!/usr/bin/env node
/**
 * Provision (or inspect/remove) demo logins + demo data for secondary schools
 * that have no accounts yet, so every role can be exercised there.
 *
 *   node scripts/seed-tenant-demo.mjs --inspect
 *   node scripts/seed-tenant-demo.mjs --all
 *   node scripts/seed-tenant-demo.mjs --tenant=school-2
 *   node scripts/seed-tenant-demo.mjs --tenant=school-2,school-majd
 *   node scripts/seed-tenant-demo.mjs --all --remove
 *
 * For each tenant it creates one email/password account per role (admin,
 * registrar, teacher, parent) with server-set claims and a matching Firestore
 * profile, plus a small amount of tagged demo data (students, one submitted
 * session, per-student attendance records, a justification and a notification).
 * Everything it writes carries `demoSeed: true` and `demoSeedTenant: <tenant>`
 * and is deleted again by --remove. Tenant documents are only created when
 * missing; existing schools, subscriptions and branding are never overwritten.
 *
 * Credentials come from (in order): FIREBASE_SERVICE_ACCOUNT_BASE64,
 * FIREBASE_SERVICE_ACCOUNT_JSON, GOOGLE_APPLICATION_CREDENTIALS, or a
 * serviceAccountKey.json in the project root. Pass --emulator to target the
 * local emulator suite instead of the live project.
 */

import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import 'dotenv/config';
import admin from 'firebase-admin';

const ARGS = process.argv.slice(2);
const hasFlag = (flag) => ARGS.includes(flag);
const getArg = (name) => {
  const prefix = `--${name}=`;
  const found = ARGS.find((arg) => arg.startsWith(prefix));
  return found ? found.slice(prefix.length) : null;
};

const USE_EMULATOR = hasFlag('--emulator');
const REMOVE = hasFlag('--remove');
const INSPECT = hasFlag('--inspect');

// This script manages the real project, so ignore any emulator settings in .env
// unless they are explicitly requested with --emulator.
if (!USE_EMULATOR) {
  delete process.env.FIREBASE_AUTH_EMULATOR_HOST;
  delete process.env.FIRESTORE_EMULATOR_HOST;
}

const TENANT_PROFILES = {
  'school-2': {
    subdomain: 'falah',
    nameAr: 'مدرسة الفلاح المتوسطة الحديثة',
    nameEn: 'Al-Falah Modern Intermediate School',
    code: 'FALAH-202',
    cityAr: 'جدة',
    cityEn: 'Jeddah',
    schoolType: 'boys',
    primaryColor: '#2563eb',
    logoText: 'ف',
    parentPhone: '+966500000101',
    demoDomain: 'demo.schools.example',
  },
  'school-majd': {
    subdomain: 'majd',
    nameAr: 'مدارس المجد الأهلية النموذجية',
    nameEn: 'Al-Majd Private Schools',
    code: 'MAJD-303',
    cityAr: 'الرياض',
    cityEn: 'Riyadh',
    schoolType: 'mixed',
    primaryColor: '#7c3aed',
    logoText: 'م',
    parentPhone: '+966500000201',
    demoDomain: 'demo.schools.example',
  },
};

const ALL_TENANTS = Object.keys(TENANT_PROFILES);
const ROLE_TITLES = {
  admin: { name: 'مدير المدرسة (تجريبي)', jobTitle: 'مدير المدرسة' },
  registrar: { name: 'شؤون الطلاب (تجريبي)', jobTitle: 'وكيل شؤون الطلاب' },
  teacher: { name: 'معلم الفصل (تجريبي)', jobTitle: 'معلم أول - اللغة العربية' },
  parent: { name: 'ولي أمر الطالب (تجريبي)', jobTitle: '' },
};

// ---------------------------------------------------------------- credentials
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
    console.error('Set FIREBASE_SERVICE_ACCOUNT_BASE64, GOOGLE_APPLICATION_CREDENTIALS, or place serviceAccountKey.json in the project root.');
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

// ---------------------------------------------------------------- helpers
const tenantEmails = (tenantId) => {
  const slug = tenantId.replace(/[^a-z0-9]/gi, '');
  const domain = TENANT_PROFILES[tenantId]?.demoDomain || 'demo.schools.example';
  return {
    admin: `${slug}.admin@${domain}`,
    registrar: `${slug}.registrar@${domain}`,
    teacher: `${slug}.teacher@${domain}`,
    parent: `${slug}.parent@${domain}`,
  };
};

const demoStudentIds = (tenantId) => [`${tenantId}-demo-student-1`, `${tenantId}-demo-student-2`];
const demoSessionId = (tenantId) => `${tenantId}-demo-session-1`;
const demoNotificationId = (tenantId) => `${tenantId}-demo-notification-1`;
const demoJustificationId = (tenantId) => `${tenantId}-demo-justification-1`;

const defaultSubscription = () => ({
  plan: 'legacy',
  status: 'active',
  billingCycle: 'annual',
  currentPeriodStart: null,
  currentPeriodEnd: null,
  gracePeriodDays: 7,
  autoRenew: true,
  manuallySuspended: false,
  limits: {},
});

const knownTenants = () => {
  const explicit = getArg('tenant');
  if (hasFlag('--all')) return ALL_TENANTS;
  if (explicit) {
    return explicit
      .split(',')
      .map((value) => value.trim())
      .filter(Boolean)
      .filter((value) => {
        if (ALL_TENANTS.includes(value)) return true;
        console.warn(`Unknown tenant "${value}" (known: ${ALL_TENANTS.join(', ')}). Skipping.`);
        return false;
      });
  }
  return [];
};

const countQuery = async (collection, tenantId) => {
  const snapshot = await db.collection(collection).where('tenantId', '==', tenantId).get();
  return snapshot.size;
};

// ---------------------------------------------------------------- inspect
async function inspectTenants(tenantIds) {
  for (const tenantId of tenantIds) {
    const tenantDoc = await db.collection('tenants').doc(tenantId).get();
    const usersSnap = await db.collection('users').where('tenantId', '==', tenantId).get();
    const roles = {};
    usersSnap.forEach((docSnap) => {
      const role = docSnap.data()?.role || 'unknown';
      roles[role] = (roles[role] || 0) + 1;
    });

    console.log(`\n=== ${tenantId} ===`);
    if (!tenantDoc.exists) {
      console.log('  tenant doc: MISSING (will be created on seed)');
    } else {
      const data = tenantDoc.data() || {};
      console.log(`  tenant doc: ${data.nameAr || data.nameEn || '(unnamed)'} | active=${data.isActive !== false}`);
      console.log(`  subscription: ${data.subscription?.status || 'none'} / plan=${data.subscription?.plan || '-'}`);
      console.log(`  subdomain: ${data.subdomain || '-'} | domains: ${(data.customDomains || []).join(', ') || '-'}`);
    }
    console.log(`  users: ${usersSnap.size} ${JSON.stringify(roles)}`);
    for (const collection of ['students', 'attendance_sessions', 'attendance_records', 'justifications', 'notification_outbox']) {
      console.log(`  ${collection}: ${await countQuery(collection, tenantId)}`);
    }

    const emails = tenantEmails(tenantId);
    for (const [role, email] of Object.entries(emails)) {
      try {
        const account = await auth.getUserByEmail(email);
        console.log(`  auth ${role.padEnd(9)} ${email} -> ${account.uid}${account.disabled ? ' (disabled)' : ''}`);
      } catch {
        console.log(`  auth ${role.padEnd(9)} ${email} -> not present`);
      }
    }
  }
}

// ---------------------------------------------------------------- remove
async function removeTenants(tenantIds) {
  for (const tenantId of tenantIds) {
    console.log(`\n=== removing ${tenantId} demo data ===`);
    for (const collection of ['students', 'attendance_sessions', 'attendance_records', 'justifications', 'notification_outbox']) {
      const snapshot = await db
        .collection(collection)
        .where('demoSeedTenant', '==', tenantId)
        .get();
      if (snapshot.empty) {
        console.log(`- ${collection}: nothing to remove`);
        continue;
      }
      const batch = db.batch();
      snapshot.docs.forEach((docSnap) => batch.delete(docSnap.ref));
      await batch.commit();
      console.log(`- ${collection}: removed ${snapshot.size}`);
    }

    const emails = tenantEmails(tenantId);
    for (const email of Object.values(emails)) {
      let user;
      try {
        user = await auth.getUserByEmail(email);
      } catch {
        console.log(`- auth ${email}: not present`);
        continue;
      }
      await db.collection('users').doc(user.uid).delete().catch(() => {});
      await db.collection('admins').doc(user.uid).delete().catch(() => {});
      await auth.deleteUser(user.uid);
      console.log(`- auth ${email}: deleted`);
    }
  }
  console.log('\nDemo logins and demo data removed.');
}

// ---------------------------------------------------------------- create
async function seedTenant(tenantId) {
  const profile = TENANT_PROFILES[tenantId];
  if (!profile) {
    console.error(`Unknown tenant "${tenantId}".`);
    return [];
  }

  const now = new Date().toISOString();
  const sessionDate = new Date(Date.now() - 86400000).toISOString().slice(0, 10);
  const sessionId = demoSessionId(tenantId);
  const classId = `class-${profile.subdomain}-10a`;
  const className = '10 / أ';
  const grade = 'الصف العاشر';
  const emails = tenantEmails(tenantId);

  console.log(`\n=== seeding ${tenantId} (${profile.nameEn}) ===`);

  // 1. Tenant document (create only when missing).
  const tenantRef = db.collection('tenants').doc(tenantId);
  const tenantDoc = await tenantRef.get();
  if (!tenantDoc.exists) {
    await tenantRef.set(
      {
        tenantId,
        subdomain: profile.subdomain,
        customDomains: [`${profile.subdomain}.localhost`],
        nameAr: profile.nameAr,
        nameEn: profile.nameEn,
        code: profile.code,
        cityAr: profile.cityAr,
        cityEn: profile.cityEn,
        academicYear: '1447-1448 هـ / 2026 م',
        currentTerm: 'الفصل الدراسي الأول',
        schoolType: profile.schoolType,
        primaryColor: profile.primaryColor,
        logoText: profile.logoText,
        isActive: true,
        subscription: defaultSubscription(),
        demoSeed: true,
        demoSeedTenant: tenantId,
        createdAt: now,
        updatedAt: now,
      },
      { merge: true }
    );
    console.log('- tenant doc: created');
  } else {
    console.log('- tenant doc: already present, left untouched');
  }

  // 2. Role accounts + profiles.
  const uids = {};
  const credentials = [];
  for (const role of ['admin', 'registrar', 'teacher', 'parent']) {
    const email = emails[role];
    const password = `Sm!${crypto.randomBytes(9).toString('base64url')}7`;
    let user;
    try {
      user = await auth.getUserByEmail(email);
      await auth.updateUser(user.uid, { password, emailVerified: true, disabled: false, displayName: ROLE_TITLES[role].name });
    } catch {
      user = await auth.createUser({ email, password, emailVerified: true, displayName: ROLE_TITLES[role].name });
    }
    uids[role] = user.uid;

    await auth.setCustomUserClaims(user.uid, { role, tenantId });
    await auth.revokeRefreshTokens(user.uid);

    await db.collection('users').doc(user.uid).set(
      {
        userId: user.uid,
        tenantId,
        name: ROLE_TITLES[role].name,
        email,
        role,
        phone: role === 'parent' ? profile.parentPhone : `+9665${String(crypto.randomInt(10_000_000, 99_999_999))}`,
        jobTitle: ROLE_TITLES[role].jobTitle,
        status: 'active',
        demoSeed: true,
        demoSeedTenant: tenantId,
        createdAt: now,
        updatedAt: now,
        ...(role === 'teacher' ? { assignedClasses: [classId, className], assignedSubjects: ['اللغة العربية'] } : {}),
      },
      { merge: true }
    );

    // `admins/` is the platform-owner bypass only (super_admin).
    await db.collection('admins').doc(user.uid).delete().catch(() => {});
    credentials.push({ role, email, password });
  }

  // 3. Students.
  const students = [
    { id: demoStudentIds(tenantId)[0], number: `${profile.code.split('-')[0]}-1001`, name: 'طالب تجريبي الأول', absences: 3, rate: 94.2 },
    { id: demoStudentIds(tenantId)[1], number: `${profile.code.split('-')[0]}-1002`, name: 'طالب تجريبي الثاني', absences: 1, rate: 98.1 },
  ];
  for (const student of students) {
    await db.collection('students').doc(student.id).set({
      id: student.id,
      tenantId,
      studentNumber: student.number,
      fullName: student.name,
      grade,
      className,
      classId,
      guardianName: ROLE_TITLES.parent.name,
      guardianPhone: profile.parentPhone,
      guardianRelationship: 'الأب',
      guardianEmail: emails.parent,
      bloodType: 'O+',
      totalAbsences: student.absences,
      totalLates: 0,
      attendanceRate: student.rate,
      enrollmentStatus: 'active',
      demoSeed: true,
      demoSeedTenant: tenantId,
    });
  }

  // 4. Session + per-student records.
  const records = students.map((student, index) => ({
    id: `${sessionId}_${student.id}`,
    tenantId,
    sessionId,
    studentId: student.id,
    guardianPhone: profile.parentPhone,
    date: sessionDate,
    sessionType: 'period',
    periodNumber: 1,
    subject: 'اللغة العربية',
    classId,
    className,
    teacherName: ROLE_TITLES.teacher.name,
    status: index === 0 ? 'absent' : 'present',
    ...(index === 0 ? { note: 'غياب غير مبرر' } : {}),
    updatedAt: now,
    demoSeed: true,
    demoSeedTenant: tenantId,
  }));

  await db.collection('attendance_sessions').doc(sessionId).set({
    id: sessionId,
    tenantId,
    date: sessionDate,
    sessionType: 'period',
    periodNumber: 1,
    subject: 'اللغة العربية',
    classId,
    className,
    grade,
    teacherId: uids.teacher,
    teacherName: ROLE_TITLES.teacher.name,
    status: 'submitted',
    totalStudents: students.length,
    presentCount: 1,
    absentCount: 1,
    lateCount: 0,
    excusedCount: 0,
    submittedAt: now,
    submittedBy: ROLE_TITLES.teacher.name,
    records: records.map((record) => ({
      id: `${sessionId}-rec-${record.studentId}`,
      sessionId,
      studentId: record.studentId,
      status: record.status,
      ...(record.note ? { note: record.note } : {}),
      updatedAt: now,
      updatedBy: ROLE_TITLES.teacher.name,
    })),
    demoSeed: true,
    demoSeedTenant: tenantId,
  });

  for (const record of records) {
    await db.collection('attendance_records').doc(record.id).set(record);
  }

  // 5. Justification + notification.
  await db.collection('justifications').doc(demoJustificationId(tenantId)).set({
    id: demoJustificationId(tenantId),
    tenantId,
    studentId: students[0].id,
    studentName: students[0].name,
    guardianPhone: profile.parentPhone,
    className,
    absenceDate: sessionDate,
    reasonType: 'medical',
    guardianExplanation: 'عذر طبي تجريبي',
    status: 'pending',
    submittedAt: now,
    demoSeed: true,
    demoSeedTenant: tenantId,
  });

  await db.collection('notification_outbox').doc(demoNotificationId(tenantId)).set({
    id: demoNotificationId(tenantId),
    tenantId,
    recipientPhone: profile.parentPhone,
    recipientName: ROLE_TITLES.parent.name,
    studentId: students[0].id,
    guardianPhone: profile.parentPhone,
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
    demoSeedTenant: tenantId,
  });

  console.log(`- accounts: ${credentials.length}, students: ${students.length}, sessions: 1, records: ${records.length}, justifications: 1, notifications: 1`);
  return credentials.map((credential) => ({ tenantId, ...credential }));
}

// ---------------------------------------------------------------- main
const tenantIds = knownTenants();

if (REMOVE) {
  if (tenantIds.length === 0) {
    console.error('Specify a tenant: --tenant=school-2 or --all.');
    process.exit(1);
  }
  await removeTenants(tenantIds);
} else if (INSPECT) {
  await inspectTenants(tenantIds.length ? tenantIds : ALL_TENANTS);
} else {
  if (tenantIds.length === 0) {
    console.error('Specify a tenant: --tenant=school-2, --tenant=school-2,school-majd, or --all.');
    console.error('Use --inspect to report current state first.');
    process.exit(1);
  }

  const allCredentials = [];
  for (const tenantId of tenantIds) {
    allCredentials.push(...(await seedTenant(tenantId)));
  }

  console.log('\nDemo logins created:\n');
  console.log('  tenant        role        email                                 password');
  console.log('  ------------  ----------  ------------------------------------  ------------------');
  for (const credential of allCredentials) {
    console.log(
      `  ${credential.tenantId.padEnd(12)}  ${credential.role.padEnd(10)}  ${credential.email.padEnd(36)}  ${credential.password}`
    );
  }
  console.log('\nRemove again with: node scripts/seed-tenant-demo.mjs --all --remove');
}

#!/usr/bin/env node
/**
 * Firestore rules tests against the local emulator.
 *
 * Run: npm run test:rules
 * Requires Java (the Firestore emulator is a JVM process).
 *
 * H-1 (parent attendance scope) and H-4 (settings read exposure) are not
 * asserted here yet: both need a data-model change, tracked in PROGRESS.md.
 */

import fs from 'node:fs';
import {
  initializeTestEnvironment,
  assertFails,
  assertSucceeds,
} from '@firebase/rules-unit-testing';
import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  query,
  setDoc,
  updateDoc,
  where,
} from 'firebase/firestore';

const testEnv = await initializeTestEnvironment({
  projectId: 'demo-smart-school',
  firestore: {
    host: '127.0.0.1',
    port: 8099,
    rules: fs.readFileSync('firestore.rules', 'utf8'),
  },
});

await testEnv.clearFirestore();

await testEnv.withSecurityRulesDisabled(async (context) => {
  const db = context.firestore();

  await setDoc(doc(db, 'users', 'parent1'), {
    userId: 'parent1',
    tenantId: 'school-1',
    name: 'Parent One',
    email: 'p1@example.com',
    role: 'parent',
    phone: '+966500000001',
    status: 'active',
  });
  await setDoc(doc(db, 'users', 'parent2'), {
    userId: 'parent2',
    tenantId: 'school-1',
    name: 'Parent Two',
    email: 'p2@example.com',
    role: 'parent',
    phone: '+966500000002',
    status: 'active',
  });
  await setDoc(doc(db, 'users', 'teacher1'), {
    userId: 'teacher1',
    tenantId: 'school-1',
    name: 'Teacher One',
    email: 't1@example.com',
    role: 'teacher',
    phone: '+966500000010',
    assignedClasses: ['class-1a'],
    status: 'active',
  });
  await setDoc(doc(db, 'users', 'admin1'), {
    userId: 'admin1',
    tenantId: 'school-1',
    name: 'Admin One',
    email: 'a1@example.com',
    role: 'admin',
    phone: '+966500000020',
    status: 'active',
  });
  await setDoc(doc(db, 'users', 'registrar1'), {
    userId: 'registrar1',
    tenantId: 'school-1',
    name: 'Registrar One',
    email: 'r1@example.com',
    role: 'registrar',
    phone: '+966500000021',
    status: 'active',
  });

  // Second school: proves cross-tenant isolation and subscription enforcement.
  await setDoc(doc(db, 'users', 'admin2'), {
    userId: 'admin2',
    tenantId: 'school-2',
    name: 'Admin Two',
    email: 'a2@example.com',
    role: 'admin',
    phone: '+966500000040',
    status: 'active',
  });
  await setDoc(doc(db, 'users', 'teacher2'), {
    userId: 'teacher2',
    tenantId: 'school-2',
    name: 'Teacher Two',
    email: 't2@example.com',
    role: 'teacher',
    phone: '+966500000041',
    assignedClasses: ['class-2a'],
    status: 'active',
  });
  await setDoc(doc(db, 'users', 'parent3'), {
    userId: 'parent3',
    tenantId: 'school-2',
    name: 'Parent Three',
    email: 'p3@example.com',
    role: 'parent',
    phone: '+966500000003',
    status: 'active',
  });
  // Platform owner bypass is the `admins/{uid}` document with role super_admin.
  await setDoc(doc(db, 'admins', 'owner1'), {
    email: 'owner1@example.com',
    role: 'super_admin',
  });

  await setDoc(doc(db, 'students', 'student1'), {
    studentNumber: 'S1',
    fullName: 'Child One',
    className: '10 / أ',
    classId: 'class-1a',
    tenantId: 'school-1',
    guardianPhone: '+966500000001',
    guardianEmail: 'p1@example.com',
  });
  await setDoc(doc(db, 'students', 'student2'), {
    studentNumber: 'S2',
    fullName: 'Child Two',
    className: '10 / ب',
    classId: 'class-1b',
    tenantId: 'school-1',
    guardianPhone: '+966500000002',
    guardianEmail: 'p2@example.com',
  });

  await setDoc(doc(db, 'attendance_sessions', 'draft1'), {
    tenantId: 'school-1',
    date: '2026-10-10',
    sessionType: 'daily',
    classId: 'class-1a',
    className: '10 / أ',
    teacherId: 'teacher1',
    status: 'draft',
    totalStudents: 1,
    presentCount: 1,
  });
  await setDoc(doc(db, 'attendance_sessions', 'submitted1'), {
    tenantId: 'school-1',
    date: '2026-10-09',
    sessionType: 'daily',
    classId: 'class-1a',
    className: '10 / أ',
    teacherId: 'teacher1',
    status: 'submitted',
    totalStudents: 1,
    presentCount: 1,
  });

  await setDoc(doc(db, 'settings', 'school-1'), {
    settings: { academicYear: '2026-2027' },
    schoolProfile: { schoolName: 'Test School' },
  });

  await setDoc(doc(db, 'tenants', 'school-1'), {
    tenantId: 'school-1',
    subdomain: 'andalus',
    customDomains: ['andalus.localhost'],
    nameAr: 'Test School',
    nameEn: 'Test School',
    isActive: true,
  });

  await setDoc(doc(db, 'settings_private', 'school-1'), {
    messagingGateway: { smsProvider: 'taqnyat', senderId: 'test-only' },
  });

  await setDoc(doc(db, 'audit_logs', 'audit1'), {
    tenantId: 'school-1',
    entityType: 'attendance',
    action: 'UPDATE',
    performerName: 'Admin One',
    details: 'seed entry',
    timestamp: '2026-10-10T08:00:00.000Z',
  });

  // --- Second school fixtures -------------------------------------------------
  await setDoc(doc(db, 'students', 'student3'), {
    studentNumber: 'S3',
    fullName: 'Child Three',
    className: '11 / أ',
    classId: 'class-2a',
    tenantId: 'school-2',
    guardianPhone: '+966500000003',
    guardianEmail: 'p3@example.com',
  });
  await setDoc(doc(db, 'tenants', 'school-2'), {
    tenantId: 'school-2',
    subdomain: 'falah',
    customDomains: ['falah.localhost'],
    nameAr: 'Test School Two',
    nameEn: 'Test School Two',
    isActive: true,
    subscription: {
      status: 'active',
      manuallySuspended: false,
      accessUntilMs: 0,
    },
  });
  await setDoc(doc(db, 'settings', 'school-2'), {
    settings: { academicYear: '2026-2027' },
  });

  await setDoc(doc(db, 'attendance_records', 'record1'), {
    tenantId: 'school-1',
    sessionId: 'draft1',
    studentId: 'student1',
    guardianPhone: '+966500000001',
    date: '2026-10-10',
    sessionType: 'daily',
    classId: 'class-1a',
    className: '10 / أ',
    status: 'present',
    updatedAt: '2026-10-10T08:00:00.000Z',
  });
  await setDoc(doc(db, 'attendance_records', 'record2'), {
    tenantId: 'school-1',
    sessionId: 'draft1',
    studentId: 'student2',
    guardianPhone: '+966500000002',
    date: '2026-10-10',
    sessionType: 'daily',
    classId: 'class-1b',
    className: '10 / ب',
    status: 'present',
    updatedAt: '2026-10-10T08:00:00.000Z',
  });

  // school-2 mirrors, split across two classes to prove teacher class scope.
  await setDoc(doc(db, 'attendance_records', 'record4'), {
    tenantId: 'school-2',
    sessionId: 'draft2',
    studentId: 'student3',
    guardianPhone: '+966500000003',
    date: '2026-10-10',
    sessionType: 'daily',
    classId: 'class-2a',
    className: '11 / أ',
    status: 'present',
    updatedAt: '2026-10-10T08:00:00.000Z',
  });
  await setDoc(doc(db, 'attendance_records', 'record5'), {
    tenantId: 'school-2',
    sessionId: 'draft2',
    studentId: 'student4',
    guardianPhone: '+966500000004',
    date: '2026-10-10',
    sessionType: 'daily',
    classId: 'class-2b',
    className: '11 / ب',
    status: 'present',
    updatedAt: '2026-10-10T08:00:00.000Z',
  });

  await setDoc(doc(db, 'notification_outbox', 'notif1'), {
    tenantId: 'school-1',
    recipientPhone: '+966500000001',
    messageText: 'Test notification',
    channel: 'SMS',
    status: 'sent',
  });
  await setDoc(doc(db, 'notification_outbox', 'notif2'), {
    tenantId: 'school-1',
    recipientPhone: '+966500000002',
    messageText: 'Other notification',
    channel: 'SMS',
    status: 'sent',
  });

  await setDoc(doc(db, 'justifications', 'just1'), {
    tenantId: 'school-1',
    studentId: 'student1',
    guardianPhone: '+966500000001',
    studentName: 'Child One',
    className: '10 / أ',
    absenceDate: '2026-10-10',
    reasonType: 'medical',
    guardianExplanation: 'Test excuse',
    status: 'pending',
  });
  await setDoc(doc(db, 'justifications', 'just2'), {
    tenantId: 'school-1',
    studentId: 'student2',
    guardianPhone: '+966500000002',
    studentName: 'Child Two',
    className: '10 / ب',
    absenceDate: '2026-10-10',
    reasonType: 'medical',
    guardianExplanation: 'Other excuse',
    status: 'pending',
  });
});

const parentDb = testEnv.authenticatedContext('parent1').firestore();
const teacherDb = testEnv.authenticatedContext('teacher1').firestore();
const adminDb = testEnv.authenticatedContext('admin1').firestore();
const registrarDb = testEnv.authenticatedContext('registrar1').firestore();
const admin2Db = testEnv.authenticatedContext('admin2').firestore();
const teacher2Db = testEnv.authenticatedContext('teacher2').firestore();
const parent3Db = testEnv.authenticatedContext('parent3').firestore();
const ownerDb = testEnv.authenticatedContext('owner1').firestore();

let failures = 0;

async function expectAllowed(name, operation) {
  try {
    await assertSucceeds(operation);
    console.log(`PASS  ${name}`);
  } catch (error) {
    failures += 1;
    console.log(`FAIL  ${name} — ${error.message}`);
  }
}

async function expectDenied(name, operation) {
  try {
    await assertFails(operation);
    console.log(`PASS  ${name}`);
  } catch (error) {
    failures += 1;
    console.log(`FAIL  ${name} — ${error.message}`);
  }
}

// Existing guardian/student boundary (should already hold).
await expectAllowed('parent reads own child', getDoc(doc(parentDb, 'students', 'student1')));
await expectDenied('parent cannot read another child', getDoc(doc(parentDb, 'students', 'student2')));

// H-2: approval is staff-only.
await expectDenied('parent cannot self-approve an excuse', addDoc(collection(parentDb, 'justifications'), {
  tenantId: 'school-1',
  studentId: 'student1',
  absenceDate: '2026-10-10',
  reasonType: 'medical',
  guardianExplanation: 'Clinic note attached.',
  status: 'approved',
}));

await expectAllowed('parent can submit a pending excuse', addDoc(collection(parentDb, 'justifications'), {
  tenantId: 'school-1',
  studentId: 'student1',
  absenceDate: '2026-10-11',
  reasonType: 'medical',
  guardianExplanation: 'Clinic note attached.',
  status: 'pending',
}));

// H-3: audit entries are staff-only.
await expectDenied('parent cannot append an audit entry', addDoc(collection(parentDb, 'audit_logs'), {
  tenantId: 'school-1',
  entityType: 'attendance',
  action: 'UPDATE',
  performerName: 'Parent One',
  details: 'forged entry',
  timestamp: new Date().toISOString(),
}));

await expectAllowed('teacher can append an audit entry', addDoc(collection(teacherDb, 'audit_logs'), {
  tenantId: 'school-1',
  entityType: 'attendance',
  action: 'UPDATE',
  performerName: 'Teacher One',
  details: 'submitted roll call',
  timestamp: new Date().toISOString(),
}));

// H-5: verified contact fields are immutable for self-service updates.
await expectDenied('parent cannot change their own phone', updateDoc(doc(parentDb, 'users', 'parent1'), {
  phone: '+966500000099',
}));

await expectAllowed('parent can update their own name', updateDoc(doc(parentDb, 'users', 'parent1'), {
  name: 'Parent One Updated',
}));

// Session locking still holds.
await expectAllowed('teacher can edit a draft session', updateDoc(doc(teacherDb, 'attendance_sessions', 'draft1'), {
  presentCount: 0,
}));

await expectDenied('teacher cannot edit a submitted session', updateDoc(doc(teacherDb, 'attendance_sessions', 'submitted1'), {
  presentCount: 0,
}));

// H-1: parents see per-student mirrors only, never raw sessions.
await expectDenied('parent cannot read raw attendance sessions', getDoc(doc(parentDb, 'attendance_sessions', 'draft1')));
await expectAllowed('parent reads own child attendance record', getDoc(doc(parentDb, 'attendance_records', 'record1')));
await expectDenied('parent cannot read another child attendance record', getDoc(doc(parentDb, 'attendance_records', 'record2')));
await expectAllowed('teacher reads attendance records', getDoc(doc(teacherDb, 'attendance_records', 'record1')));
await expectAllowed('teacher can write an attendance record', setDoc(doc(teacherDb, 'attendance_records', 'record3'), {
  tenantId: 'school-1',
  sessionId: 'draft1',
  studentId: 'student1',
  guardianPhone: '+966500000001',
  date: '2026-10-10',
  sessionType: 'daily',
  classId: 'class-1a',
  className: '10 / أ',
  status: 'late',
  updatedAt: '2026-10-10T08:00:00.000Z',
}, { merge: true }));

await expectAllowed('parent reads own notification', getDoc(doc(parentDb, 'notification_outbox', 'notif1')));
await expectDenied('parent cannot read another parent notification', getDoc(doc(parentDb, 'notification_outbox', 'notif2')));

await expectAllowed('parent reads own child justification', getDoc(doc(parentDb, 'justifications', 'just1')));
await expectDenied('parent cannot read another child justification', getDoc(doc(parentDb, 'justifications', 'just2')));

await expectAllowed('tenant registry is publicly readable', getDoc(doc(testEnv.unauthenticatedContext().firestore(), 'tenants', 'school-1')));
await expectDenied('parent cannot write tenant registry', setDoc(doc(parentDb, 'tenants', 'school-1'), { nameAr: 'hijacked' }, { merge: true }));

// Self-signup may only create a parent profile.
const newParentDb = testEnv.authenticatedContext('newparent').firestore();
const attackerDb = testEnv.authenticatedContext('attacker').firestore();

await expectAllowed('new user can self-register as parent', setDoc(doc(newParentDb, 'users', 'newparent'), {
  userId: 'newparent',
  tenantId: 'school-1',
  name: 'New Parent',
  email: 'new@example.com',
  role: 'parent',
  phone: '+966500000030',
  status: 'active',
}));

await expectDenied('new user cannot self-register as registrar', setDoc(doc(attackerDb, 'users', 'attacker'), {
  userId: 'attacker',
  tenantId: 'school-1',
  name: 'Attacker',
  email: 'attacker@example.com',
  role: 'registrar',
  phone: '+966500000031',
  status: 'active',
}));

// Settings are tenant-readable; gateway credentials are admin-only.
await expectAllowed('parent can read shared settings', getDoc(doc(parentDb, 'settings', 'school-1')));
await expectDenied('parent cannot read private gateway settings', getDoc(doc(parentDb, 'settings_private', 'school-1')));
await expectAllowed('admin can read private gateway settings', getDoc(doc(adminDb, 'settings_private', 'school-1')));
await expectAllowed('admin can write private gateway settings', setDoc(doc(adminDb, 'settings_private', 'school-1'), {
  messagingGateway: { smsProvider: 'taqnyat', senderId: 'SCHOOL' },
}, { merge: true }));

// --- Cross-tenant isolation (school-1 roles must never touch school-2) ------
const school2Student = {
  studentNumber: 'X2',
  fullName: 'Cross Tenant',
  className: '11 / ب',
  tenantId: 'school-2',
};

await expectDenied('school-1 admin cannot read school-2 students', getDoc(doc(adminDb, 'students', 'student3')));
await expectDenied('school-1 admin cannot write school-2 students', setDoc(doc(adminDb, 'students', 'crosswrite'), school2Student));
await expectDenied('school-1 registrar cannot write school-2 students', setDoc(doc(registrarDb, 'students', 'crosswrite2'), school2Student));
await expectDenied('school-2 teacher cannot read school-1 data', getDoc(doc(teacher2Db, 'students', 'student1')));
await expectDenied('school-2 parent cannot read school-1 child', getDoc(doc(parent3Db, 'students', 'student1')));
await expectAllowed('school-2 teacher reads own school', getDoc(doc(teacher2Db, 'students', 'student3')));
await expectAllowed('school-2 parent reads own child', getDoc(doc(parent3Db, 'students', 'student3')));

// --- User directory is tenant-scoped (global collection, per-school reads) ---
await expectDenied('school-1 admin cannot read a school-2 user', getDoc(doc(adminDb, 'users', 'parent3')));
await expectDenied('school-1 registrar cannot read a school-2 user', getDoc(doc(registrarDb, 'users', 'parent3')));
await expectAllowed('school-1 admin can read a same-school user', getDoc(doc(adminDb, 'users', 'teacher1')));
await expectDenied('school-1 admin cannot list school-2 users', getDocs(query(collection(adminDb, 'users'), where('tenantId', '==', 'school-2'))));
await expectAllowed('school-1 admin can list same-school users', getDocs(query(collection(adminDb, 'users'), where('tenantId', '==', 'school-1'))));
await expectAllowed('platform owner can read any user', getDoc(doc(ownerDb, 'users', 'parent3')));

// --- Teacher writes to per-student mirrors stay inside assigned classes ------
await expectDenied('teacher cannot write a record for another class', updateDoc(doc(teacher2Db, 'attendance_records', 'record5'), { status: 'absent' }));
await expectAllowed('teacher can write a record for their own class', updateDoc(doc(teacher2Db, 'attendance_records', 'record4'), { status: 'late' }));
await expectAllowed('admin can write any school record', updateDoc(doc(admin2Db, 'attendance_records', 'record5'), { status: 'absent' }));

// --- Parents may only file excuses for their own children --------------------
await expectDenied('parent cannot submit an excuse for another child', addDoc(collection(parentDb, 'justifications'), {
  tenantId: 'school-1',
  studentId: 'student2',
  absenceDate: '2026-10-12',
  reasonType: 'medical',
  guardianExplanation: 'Not my child.',
  status: 'pending',
}));

// --- Platform owner bypass uses admins/{uid} with role super_admin ----------
await expectAllowed('platform owner reads any school', getDoc(doc(ownerDb, 'students', 'student3')));
await expectAllowed('platform owner writes any school', setDoc(doc(ownerDb, 'students', 'ownerwrite'), school2Student));
await expectDenied('tenant admin is not a platform owner', getDoc(doc(adminDb, 'admins', 'owner1')));

// --- Registrar role ---------------------------------------------------------
const registrarStudent = {
  studentNumber: 'R1',
  fullName: 'Registrar Created',
  className: '10 / ج',
  tenantId: 'school-1',
};
await expectAllowed('registrar can create students', setDoc(doc(registrarDb, 'students', 'registrar-student'), registrarStudent));
await expectAllowed('registrar can update students', updateDoc(doc(registrarDb, 'students', 'registrar-student'), { fullName: 'Registrar Updated' }));
await expectDenied('registrar cannot delete students', deleteDoc(doc(registrarDb, 'students', 'registrar-student')));
await expectDenied('registrar cannot read private settings', getDoc(doc(registrarDb, 'settings_private', 'school-1')));
await expectAllowed('registrar can read audit logs', getDoc(doc(registrarDb, 'audit_logs', 'audit1')));
await expectDenied('registrar cannot write tenant registry', setDoc(doc(registrarDb, 'tenants', 'school-1'), { nameEn: 'hijacked' }, { merge: true }));

// --- Tenant admin deletion is tenant-scoped, never cross-tenant -------------
await expectAllowed('school admin can delete in own school', deleteDoc(doc(adminDb, 'students', 'registrar-student')));
await expectDenied('school admin cannot delete in another school', deleteDoc(doc(adminDb, 'students', 'student3')));

// --- Subscription enforcement per school ------------------------------------
async function setSchool2Subscription(subscription) {
  await testEnv.withSecurityRulesDisabled(async (context) => {
    await setDoc(doc(context.firestore(), 'tenants', 'school-2'), { subscription }, { merge: true });
  });
}

await setSchool2Subscription({ status: 'suspended', manuallySuspended: true, accessUntilMs: 0 });
await expectDenied('suspended school: teacher blocked', getDoc(doc(teacher2Db, 'students', 'student3')));
await expectDenied('suspended school: parent blocked', getDoc(doc(parent3Db, 'students', 'student3')));
await expectDenied('suspended school: admin blocked', getDoc(doc(admin2Db, 'students', 'student3')));
await expectAllowed('suspended school: platform owner bypasses', getDoc(doc(ownerDb, 'students', 'student3')));
await expectAllowed('suspended school: other school unaffected', getDoc(doc(teacherDb, 'students', 'student1')));

await setSchool2Subscription({ status: 'active', manuallySuspended: false, accessUntilMs: Date.now() - 60_000 });
await expectDenied('expired access boundary: teacher blocked', getDoc(doc(teacher2Db, 'students', 'student3')));

await setSchool2Subscription({ status: 'active', manuallySuspended: false, accessUntilMs: Date.now() + 60_000 });
await expectAllowed('future access boundary: teacher allowed', getDoc(doc(teacher2Db, 'students', 'student3')));

await setSchool2Subscription({ status: 'active', manuallySuspended: false, accessUntilMs: 0 });
await expectAllowed('reactivated school: teacher allowed', getDoc(doc(teacher2Db, 'students', 'student3')));

await testEnv.cleanup();

console.log(`\n${failures === 0 ? 'All rules tests passed.' : `${failures} rules test(s) failed.`}`);
process.exit(failures === 0 ? 0 : 1);


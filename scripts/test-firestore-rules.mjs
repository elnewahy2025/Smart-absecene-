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
  doc,
  getDoc,
  setDoc,
  updateDoc,
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

await testEnv.cleanup();

console.log(`\n${failures === 0 ? 'All rules tests passed.' : `${failures} rules test(s) failed.`}`);
process.exit(failures === 0 ? 0 : 1);


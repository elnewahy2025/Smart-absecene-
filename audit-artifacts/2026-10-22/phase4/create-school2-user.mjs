import 'dotenv/config';
import admin from 'firebase-admin';

const projectId = process.env.GCLOUD_PROJECT || 'demo-smart-school';
admin.initializeApp({ projectId });
const auth = admin.auth();
const db = admin.firestore();
const password = process.env.EMULATOR_SEED_PASSWORD;

const uid = 'emulator-school2-teacher';
const email = 'teacher2@falah-school.edu.sa';
const profile = {
  userId: uid,
  tenantId: 'school-2',
  name: 'School Two Teacher',
  email,
  phone: '+966500000002',
  role: 'teacher',
  status: 'active',
};

try {
  await auth.createUser({ uid, email, password, displayName: profile.name, emailVerified: true });
} catch (error) {
  if (error.code !== 'auth/uid-already-exists' && error.code !== 'auth/email-already-exists') throw error;
  await auth.updateUser(uid, { password, displayName: profile.name });
}
await auth.setCustomUserClaims(uid, { role: 'teacher', tenantId: 'school-2' });
await db.doc(`users/${uid}`).set(profile, { merge: true });
console.log(JSON.stringify({ uid, email, tenantId: 'school-2', role: 'teacher' }));

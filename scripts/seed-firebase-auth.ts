import 'dotenv/config';
import { initializeApp } from 'firebase/app';
import {
  getAuth,
  createUserWithEmailAndPassword,
  updateProfile,
  signInWithEmailAndPassword,
} from 'firebase/auth';
import { INITIAL_USERS } from '../src/data/mockData';

const firebaseConfig = {
  projectId: process.env.VITE_FIREBASE_PROJECT_ID,
  appId: process.env.VITE_FIREBASE_APP_ID,
  apiKey: process.env.VITE_FIREBASE_API_KEY,
  authDomain: process.env.VITE_FIREBASE_AUTH_DOMAIN,
  firestoreDatabaseId: process.env.VITE_FIREBASE_FIRESTORE_DATABASE_ID,
  storageBucket: process.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);

async function seedFirebaseAuthUsers() {
  console.log(`\n======================================================`);
  console.log(`Connecting to Firebase Project: ${firebaseConfig.projectId}`);
  console.log(`Seeding School Users into Firebase Authentication...`);
  console.log(`======================================================\n`);

  for (const user of INITIAL_USERS) {
    const defaultPassword = process.env.SEED_DEFAULT_PASSWORD;
    if (!defaultPassword) {
      throw new Error('SEED_DEFAULT_PASSWORD is required to seed Firebase accounts.');
    }
    try {
      // 1. Try creating user
      const userCred = await createUserWithEmailAndPassword(auth, user.email, defaultPassword);
      if (userCred.user) {
        await updateProfile(userCred.user, { displayName: user.name });
        console.log(`[CREATED] ✅ ${user.role.padEnd(9)}: ${user.email} (${user.name})`);
      }
    } catch (err: any) {
      if (err.code === 'auth/email-already-in-use') {
        console.log(`[EXISTS]  ℹ️ ${user.role.padEnd(9)}: ${user.email} (already in Firebase)`);
      } else if (err.code === 'auth/operation-not-allowed') {
        console.error(
          `\n[ACTION REQUIRED] ❌ Email/Password provider is not yet enabled in Firebase Console.`
        );
        console.error(
          `Please visit: https://console.firebase.google.com/project/${firebaseConfig.projectId}/authentication/providers`
        );
        console.error(`Enable "Email/Password" and run this script again.\n`);
        process.exit(1);
      } else {
        console.error(`[ERROR]   ❌ ${user.email}:`, err.code, err.message);
      }
    }
  }

  console.log(`\n======================================================`);
  console.log(`Firebase Authentication Seeding Finished.`);
  console.log(`======================================================\n`);
  process.exit(0);
}

seedFirebaseAuthUsers().catch((err) => {
  console.error('Fatal seeding error:', err);
  process.exit(1);
});

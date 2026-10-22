import fs from 'fs';
import path from 'path';
import admin from 'firebase-admin';

export interface FirebaseAdminStatus {
  initialized: boolean;
  keyLoaded: boolean;
  ready: boolean;
}

/**
 * Initialize the Firebase Admin SDK if credentials exist or a default project is set.
 * Returns the readiness flags used by the API and by the runtime bootstrap.
 */
export function initializeFirebaseAdmin({ baseDir }: { baseDir: string }): FirebaseAdminStatus {
  let initialized = false;
  let keyLoaded = false;
  // True only when an explicit credential (inline or service-account file) was loaded,
  // i.e. token verification can actually succeed. A project id alone can initialise the
  // SDK but cannot verify ID tokens, so it must never be reported as ready.
  let ready = false;

  try {
    const serviceAccountPath = process.env.GOOGLE_APPLICATION_CREDENTIALS || path.resolve(baseDir, 'serviceAccountKey.json');
    const projectId = process.env.FIREBASE_PROJECT_ID || process.env.VITE_FIREBASE_PROJECT_ID;
    const inlineCredential = process.env.FIREBASE_SERVICE_ACCOUNT_BASE64
      ? Buffer.from(process.env.FIREBASE_SERVICE_ACCOUNT_BASE64, 'base64').toString('utf8')
      : process.env.FIREBASE_SERVICE_ACCOUNT_JSON;

    let inlineServiceAccount: any = null;
    if (inlineCredential) {
      try {
        inlineServiceAccount = JSON.parse(inlineCredential);
        console.log('[AUTH] Firebase Admin credential loaded from environment.');
      } catch (parseError: any) {
        console.warn('[AUTH] FIREBASE_SERVICE_ACCOUNT_* is not valid JSON:', parseError?.message);
      }
    }

    if (inlineServiceAccount) {
      admin.initializeApp({
        credential: admin.credential.cert(inlineServiceAccount),
        projectId: inlineServiceAccount.project_id || projectId,
      });
      initialized = true;
      keyLoaded = true;
      ready = true;
      console.log('[AUTH] Firebase Admin initialized from environment credential.');
    } else if (fs.existsSync(serviceAccountPath)) {
      const serviceAccount = JSON.parse(fs.readFileSync(serviceAccountPath, 'utf8'));
      admin.initializeApp({
        credential: admin.credential.cert(serviceAccount),
        projectId: serviceAccount.project_id || projectId,
      });
      initialized = true;
      keyLoaded = true;
      ready = true;
      console.log('[AUTH] Firebase Admin initialized with service account key.');
    } else if (projectId) {
      admin.initializeApp({
        projectId,
      });
      initialized = true;
      if (process.env.FIREBASE_AUTH_EMULATOR_HOST) {
        ready = true;
        console.log(
          `[AUTH] Firebase Admin initialized for emulator (${process.env.FIREBASE_AUTH_EMULATOR_HOST}); ready for token verification.`
        );
      } else {
        console.warn(
          `[AUTH] Firebase Admin initialized with project ID only (${projectId}); no credential was loaded, so ID-token verification will fail. Set FIREBASE_SERVICE_ACCOUNT_BASE64 or GOOGLE_APPLICATION_CREDENTIALS.`
        );
      }
    } else {
      console.warn('[AUTH] Firebase Admin SDK not initialized: No serviceAccountKey.json or FIREBASE_PROJECT_ID found.');
    }
  } catch (adminErr: any) {
    console.warn('[AUTH] Warning initializing Firebase Admin:', adminErr?.message || adminErr);
  }

  return { initialized, keyLoaded, ready };
}

export { admin };

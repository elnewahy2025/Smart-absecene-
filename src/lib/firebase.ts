import { initializeApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider, connectAuthEmulator } from 'firebase/auth';
import { getFirestore, doc, getDocFromServer, connectFirestoreEmulator } from 'firebase/firestore';

const env = (import.meta as any).env || {};

const useEmulator = String(env.VITE_USE_FIREBASE_EMULATOR || '').toLowerCase() === 'true';
const emulatorProjectId = env.VITE_FIREBASE_EMULATOR_PROJECT_ID || 'demo-smart-school';

const firebaseConfig = {
  projectId: useEmulator
    ? emulatorProjectId
    : env.VITE_FIREBASE_PROJECT_ID || 'demo-project-id',
  appId: env.VITE_FIREBASE_APP_ID || '1:000000000000:web:0000000000000000000000',
  apiKey: env.VITE_FIREBASE_API_KEY || 'demo-firebase-api-key',
  authDomain: env.VITE_FIREBASE_AUTH_DOMAIN || 'demo-project-id.firebaseapp.com',
  firestoreDatabaseId: useEmulator
    ? '(default)'
    : env.VITE_FIREBASE_FIRESTORE_DATABASE_ID || '(default)',
  storageBucket: env.VITE_FIREBASE_STORAGE_BUCKET || 'demo-project-id.firebasestorage.app',
  messagingSenderId: env.VITE_FIREBASE_MESSAGING_SENDER_ID || '000000000000',
  measurementId: env.VITE_FIREBASE_MEASUREMENT_ID || '',
  oAuthClientId: env.VITE_FIREBASE_OAUTH_CLIENT_ID || '',
  recaptchaSiteKey: env.VITE_FIREBASE_RECAPTCHA_SITE_KEY || '',
};

const app = initializeApp(firebaseConfig as any);
export const db = getFirestore(app, firebaseConfig.firestoreDatabaseId);
export const auth = getAuth(app);

if (useEmulator && !(globalThis as any).__SMART_SCHOOL_EMULATORS__) {
  connectAuthEmulator(
    auth,
    env.VITE_FIREBASE_AUTH_EMULATOR_URL || 'http://127.0.0.1:9099',
    { disableWarnings: true }
  );
  connectFirestoreEmulator(
    db,
    env.VITE_FIREBASE_FIRESTORE_EMULATOR_HOST || '127.0.0.1',
    Number(env.VITE_FIREBASE_FIRESTORE_EMULATOR_PORT || 8099)
  );
  (globalThis as any).__SMART_SCHOOL_EMULATORS__ = true;
}
export const googleProvider = new GoogleAuthProvider();

export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

export interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
    isAnonymous?: boolean | null;
    tenantId?: string | null;
    providerInfo?: {
      providerId?: string | null;
      email?: string | null;
    }[];
  };
}

export function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null) {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
      isAnonymous: auth.currentUser?.isAnonymous,
      tenantId: auth.currentUser?.tenantId,
      providerInfo:
        auth.currentUser?.providerData?.map((provider) => ({
          providerId: provider.providerId,
          email: provider.email,
        })) || [],
    },
    operationType,
    path,
  };
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

export type ConnectionStatus = 'connected' | 'offline' | 'error';
let currentStatus: ConnectionStatus = 'connected';
const statusListeners: ((status: ConnectionStatus) => void)[] = [];

export function subscribeConnectionStatus(listener: (status: ConnectionStatus) => void) {
  statusListeners.push(listener);
  listener(currentStatus);
  return () => {
    const idx = statusListeners.indexOf(listener);
    if (idx !== -1) statusListeners.splice(idx, 1);
  };
}

export function getConnectionStatus(): ConnectionStatus {
  return currentStatus;
}

export async function testConnection(): Promise<boolean> {
  // If the browser itself is offline, report offline immediately
  if (typeof navigator !== 'undefined' && !navigator.onLine) {
    currentStatus = 'offline';
    statusListeners.forEach((fn) => fn(currentStatus));
    return false;
  }

  try {
    await getDocFromServer(doc(db, 'test', 'connection'));
    console.log('Firebase connection verified successfully.');
    currentStatus = 'connected';
    statusListeners.forEach((fn) => fn(currentStatus));
    return true;
  } catch (error) {
    // Check if error specifically indicates network unavailability
    const errMsg = error instanceof Error ? error.message.toLowerCase() : String(error).toLowerCase();
    const isNetworkOffline =
      errMsg.includes('the client is offline') ||
      errMsg.includes('unavailable') ||
      errMsg.includes('network') ||
      errMsg.includes('failed to fetch');

    if (isNetworkOffline && (typeof navigator !== 'undefined' && !navigator.onLine)) {
      currentStatus = 'offline';
    } else {
      // If client is online and Firestore returned a permission-denied or not-found,
      // it means network is active and database is reachable.
      currentStatus = 'connected';
    }
    statusListeners.forEach((fn) => fn(currentStatus));
    return currentStatus === 'connected';
  }
}

// Check on boot and network status changes
if (typeof window !== 'undefined') {
  window.addEventListener('online', () => testConnection());
  window.addEventListener('offline', () => {
    currentStatus = 'offline';
    statusListeners.forEach((fn) => fn(currentStatus));
  });
}

testConnection();


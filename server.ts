// Must be the first import: ES module imports are evaluated before any other
// statement, so modules that read process.env at load time (server/genaiClient)
// would otherwise see an empty environment.
import 'dotenv/config';
import express from 'express';
import './server/types';
import path from 'path';
import { fileURLToPath, pathToFileURL } from 'url';
import admin from 'firebase-admin';
import { geminiKey } from './server/aiRoutes';
import { createSubscriptionEnforcement } from './server/subscriptionEnforcement';
import { createAuthMiddleware } from './server/authMiddleware';
import { applyRequestHardening, getRequestHostname } from './server/requestHardening';
import { initializeFirebaseAdmin } from './server/firebaseAdmin';
import { createTenantDocsSync } from './server/tenantDocs';
import { createServerBootstrap } from './server/bootstrap';
import { registerApiRoutes } from './server/apiRoutes';
import {
  getActiveTenantRegistry,
  resolveTenantFromHostname,
} from './src/config/tenantRegistry';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const IS_PRODUCTION = process.env.NODE_ENV === 'production';
// Vercel sets VERCEL=1 for serverless deployments: no system Chromium, read-only FS.
const IS_VERCEL = Boolean(process.env.VERCEL);
const PORT = process.env.PORT ? parseInt(process.env.PORT) : 5050;
const SHARED_AUTH_VALUE = process.env.APP_AUTH_TOKEN || '';
const ALLOW_DEV_AUTH = process.env.ALLOW_DEV_AUTH === 'true' && process.env.NODE_ENV !== 'production';
const DEV_AUTH_ROLE = process.env.DEV_AUTH_ROLE || 'teacher';
const DEV_AUTH_TENANT = process.env.DEV_AUTH_TENANT || '';
const DEFAULT_TENANT_ID = process.env.DEFAULT_TENANT_ID || '';
const TENANT_ID_PATTERN = /^[a-z0-9][a-z0-9-]{2,31}$/;

// Limit pre-auth payload parsing to 256kb to prevent memory exhaustion DoS attacks,
// granting the 10mb exception only to image analysis.
app.use((req, res, next) => {
  const limit = req.path === '/api/analyze-image' ? '10mb' : '256kb';
  express.json({ limit })(req, res, next);
});
applyRequestHardening(app, { isProduction: IS_PRODUCTION });

const {
  initialized: firebaseAdminInitialized,
  keyLoaded: adminKeyLoaded,
  ready: firebaseAdminReady,
} = initializeFirebaseAdmin({ baseDir: __dirname });

const { refreshTenantDocs, refreshDynamicTenants, resetTenantDocsCache, invalidateDynamicTenants } =
  createTenantDocsSync({
    isFirebaseAdminReady: () => firebaseAdminReady,
    baseDir: __dirname,
  });

// Extract and resolve tenant from incoming Host / X-Forwarded-Host headers.
// An explicit ?tenant= selection is honoured (it can only ever narrow the
// request to the caller's own tenant: requireTenant still rejects any account
// whose claims belong to a different school).
const getRequestHostTenant = (req: express.Request) => {
  refreshDynamicTenants();
  void refreshTenantDocs();
  const host = getRequestHostname(req);
  const query = typeof req.originalUrl === 'string' ? req.originalUrl : '';
  return resolveTenantFromHostname(host, query);
};

const auth = createAuthMiddleware({
  isFirebaseAdminReady: () => firebaseAdminReady,
  requestHostTenant: (req) => getRequestHostTenant(req),
  sharedAuthValue: SHARED_AUTH_VALUE,
  allowDevAuth: ALLOW_DEV_AUTH,
  devAuthRole: DEV_AUTH_ROLE,
  devAuthTenant: DEV_AUTH_TENANT,
});

const sanitizeText = (value: unknown, fallback = ''): string => {
  if (typeof value !== 'string') return fallback;
  return value.trim().slice(0, 4000);
};

registerApiRoutes({
  app,
  baseDir: __dirname,
  isVercel: IS_VERCEL,
  isFirebaseAdminReady: () => firebaseAdminReady,
  firebaseAdminInitialized,
  adminKeyLoaded,
  geminiKey,
  sharedAuthValue: SHARED_AUTH_VALUE,
  auth,
  enforcement: createSubscriptionEnforcement({
    isFirebaseAdminReady: () => firebaseAdminReady,
    getFirestore: () => admin.firestore(),
    getTenantRegistry: () => getActiveTenantRegistry(),
    resetTenantDocsCache,
    refreshTenantDocs,
    isPlatformOwner: auth.isPlatformOwner,
    defaultTenantId: DEFAULT_TENANT_ID,
  }),
  tenantSync: { refreshTenantDocs, refreshDynamicTenants, invalidateDynamicTenants },
  tenantIdPattern: TENANT_ID_PATTERN,
  defaultTenantId: DEFAULT_TENANT_ID,
  sanitizeText,
});

const { startServer, prepareRuntime } = createServerBootstrap({
  app,
  port: PORT,
  baseDir: __dirname,
  isProduction: IS_PRODUCTION,
  hasSharedAuthValue: Boolean(SHARED_AUTH_VALUE),
  isFirebaseAdminReady: () => firebaseAdminReady,
  getFirestore: () => admin.firestore(),
});

// Only auto-start when executed directly (`node server.js` / `tsx server.ts`).
// Importing this module (e.g. from integration tests) must not bind a port.
const isDirectRun = (() => {
  try {
    return !!process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href;
  } catch {
    return false;
  }
})();

if (isDirectRun) {
  startServer().catch((err) => {
    console.error('Failed to start server:', err);
  });
}

export { app, startServer, prepareRuntime };

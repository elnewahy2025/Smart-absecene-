import express from 'express';
import path from 'path';
import admin from 'firebase-admin';
import { attachTenantSecretsStore, type EncryptedPayload } from '../src/utils/tenantAISecrets';

interface ServerBootstrapDeps {
  app: express.Express;
  port: number;
  baseDir: string;
  isProduction: boolean;
  hasSharedAuthValue: boolean;
  isFirebaseAdminReady: () => boolean;
  getFirestore: () => admin.firestore.Firestore;
}

export function createServerBootstrap({
  app,
  port,
  baseDir,
  isProduction,
  hasSharedAuthValue,
  isFirebaseAdminReady,
  getFirestore,
}: ServerBootstrapDeps) {
  function serveStaticBundle() {
    app.use(express.static(path.resolve(baseDir, 'dist')));
    app.get('*', (req, res) => {
      res.sendFile(path.resolve(baseDir, 'dist/index.html'));
    });
  }

  // Persist per-tenant AI keys in Firestore so they survive redeploys on hosts
  // with an ephemeral filesystem. Safe no-op when Firebase Admin is unavailable.
  async function hydrateTenantSecrets(): Promise<void> {
    if (!isFirebaseAdminReady()) {
      console.warn('[SECURITY] Firebase Admin not ready; tenant AI secrets use the local file only.');
      return;
    }
    const collection = getFirestore().collection('tenant_ai_secrets');
    await attachTenantSecretsStore({
      loadAll: async () => {
        const snapshot = await collection.get();
        const out: Record<string, EncryptedPayload> = {};
        snapshot.forEach((doc) => {
          out[doc.id] = doc.data() as EncryptedPayload;
        });
        return out;
      },
      put: async (tenantId, payload: EncryptedPayload) => {
        await collection.doc(tenantId).set(payload);
      },
      remove: async (tenantId) => {
        await collection.doc(tenantId).delete();
      },
    });
  }

  // One-time runtime bootstrap shared by the standalone server and the serverless
  // entry point (Vercel): wire the Firestore-backed tenant secret store. Idempotent,
  // so cold starts and the long-running server can both call it safely.
  let runtimeReady: Promise<void> | null = null;
  function prepareRuntime(): Promise<void> {
    if (!runtimeReady) {
      runtimeReady = hydrateTenantSecrets().catch((error: unknown) => {
        const msg = error instanceof Error ? error.message : String(error);
        console.warn('[BOOT] Tenant secret hydration failed; using local file fallback:', msg);
      });
    }
    return runtimeReady;
  }

  async function startServer() {
    if (isProduction) {
      serveStaticBundle();
    } else {
      try {
        const { createServer: createViteServer } = await import('vite');
        const vite = await createViteServer({
          server: {
            middlewareMode: true,
            watch: {
              ignored: ['**/*.docx', '**/*.vsdx', '**/*.xlsx', '**/*.pptx', '**/~$*', '**/*.pdf', '**/*.png', '**/*.jpg', '**/*.tmp', '**/*.log', '**/.git/**', '**/scratch/**'],
            },
          },
          appType: 'spa',
        });
        app.use(vite.middlewares);
      } catch (err) {
        console.warn('Vite dev middleware unavailable; serving the static build from dist/ instead. Build the client with `npm run build` if dist/ is missing.', err instanceof Error ? err.message : err);
        serveStaticBundle();
      }
    }

    await prepareRuntime();

    app.listen(port, '0.0.0.0', () => {
      console.log(`Smart School Attendance Server running on http://0.0.0.0:${port}`);
      if (!hasSharedAuthValue) {
        console.warn('Security warning: no shared bearer value is configured. Set APP_AUTH_TOKEN for local development only.');
      }
    });
  }
  return { startServer, prepareRuntime };
}

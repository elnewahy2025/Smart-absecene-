import fs from 'fs';
import path from 'path';
import admin from 'firebase-admin';
import {
  setRuntimeDynamicTenants,
  setRuntimeTenantDocs,
} from '../src/config/tenantRegistry';
import type { TenantDomainConfig } from '../src/config/tenantRegistry';

interface TenantDocsSyncDeps {
  isFirebaseAdminReady: () => boolean;
  baseDir: string;
}

export function createTenantDocsSync({ isFirebaseAdminReady, baseDir }: TenantDocsSyncDeps) {
  const getDynamicTenantsPath = () =>
    process.env.DYNAMIC_TENANTS_PATH || path.resolve(baseDir, 'src/config/dynamicTenants.json');

  let dynamicTenantsMtime = 0;

  // Applies tenants written to disk after module load, so provisioning takes effect
  // without a restart. Cheap: one stat() per request, re-read only on mtime change.
  let tenantDocsCache: TenantDomainConfig[] = [];
  let tenantDocsLoadedAt = 0;
  let tenantDocsFailedAt = 0;
  let tenantDocsLoading = false;
  const REFRESH_TTL_MS = 30_000;
  const FAILURE_BACKOFF_MS = 30_000;
  const FIRESTORE_FETCH_TIMEOUT_MS = 3_000;

  // Firestore is the tenant source of truth; the static registry is only a bootstrap fallback.
  async function refreshTenantDocs(force = false): Promise<void> {
    if (!isFirebaseAdminReady() || tenantDocsLoading) return;
    const now = Date.now();
    if (!force && now - tenantDocsLoadedAt < REFRESH_TTL_MS) return;
    if (now - tenantDocsFailedAt < FAILURE_BACKOFF_MS) return;

    tenantDocsLoading = true;
    let timeoutId: ReturnType<typeof setTimeout> | undefined;
    try {
      const snapshot = await Promise.race([
        admin.firestore().collection('tenants').get(),
        new Promise<never>((_, reject) => {
          timeoutId = setTimeout(() => reject(new Error('Firestore tenant registry timeout')), FIRESTORE_FETCH_TIMEOUT_MS);
        }),
      ]);
      tenantDocsCache = snapshot.docs.map((doc) => ({
        ...(doc.data() as Partial<TenantDomainConfig>),
        tenantId: doc.id,
      })) as TenantDomainConfig[];
      setRuntimeTenantDocs(tenantDocsCache);
      tenantDocsLoadedAt = Date.now();
      tenantDocsFailedAt = 0;
    } catch (error: unknown) {
      tenantDocsFailedAt = Date.now();
      const msg = error instanceof Error ? error.message : String(error);
      console.warn('[TENANTS] Could not load Firestore tenant registry (serving cached/static fallback):', msg);
    } finally {
      if (timeoutId) clearTimeout(timeoutId);
      tenantDocsLoading = false;
    }
  }

  function refreshDynamicTenants(): void {
    const dynamicPath = getDynamicTenantsPath();
    try {
      const mtime = fs.statSync(dynamicPath).mtimeMs;
      if (mtime === dynamicTenantsMtime) return;
      const parsed = JSON.parse(fs.readFileSync(dynamicPath, 'utf8'));
      setRuntimeDynamicTenants(Array.isArray(parsed) ? parsed : []);
      dynamicTenantsMtime = mtime;
    } catch {
      // Keep the last known registry if the file is missing or unreadable.
    }
  }

  function resetTenantDocsCache(): void {
    tenantDocsLoadedAt = 0;
    tenantDocsFailedAt = 0;
  }

  function invalidateDynamicTenants(): void {
    dynamicTenantsMtime = 0;
    refreshDynamicTenants();
  }

  return {
    refreshTenantDocs,
    refreshDynamicTenants,
    resetTenantDocsCache,
    invalidateDynamicTenants,
  };
}

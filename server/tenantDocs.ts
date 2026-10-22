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
  let tenantDocsLoading = false;

  // Firestore is the tenant source of truth; the static registry is only a bootstrap fallback.
  async function refreshTenantDocs(force = false): Promise<void> {
    if (!isFirebaseAdminReady() || tenantDocsLoading) return;
    if (!force && Date.now() - tenantDocsLoadedAt < 30000) return;

    tenantDocsLoading = true;
    try {
      const snapshot = await admin.firestore().collection('tenants').get();
      tenantDocsCache = snapshot.docs.map((doc) => ({
        ...(doc.data() as Partial<TenantDomainConfig>),
        tenantId: doc.id,
      })) as TenantDomainConfig[];
      setRuntimeTenantDocs(tenantDocsCache);
      tenantDocsLoadedAt = Date.now();
    } catch (error: unknown) {
      const msg = error instanceof Error ? error.message : String(error);
      console.warn('[TENANTS] Could not load Firestore tenant registry:', msg);
    } finally {
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

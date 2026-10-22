import fs from 'node:fs';
import admin from 'firebase-admin';
import type { Express, Request, RequestHandler } from 'express';
import type { TenantDomainConfig } from '../src/config/tenantRegistry';
import type {
  TenantResolution,
  ManagedAccountInput,
  ManagedAccountOptions,
  ManagedAccountResult,
} from './types';
import {
  defaultSubscription,
  evaluateSubscription,
  normalizeSubscription,
} from '../src/config/subscription';

interface TenantRegistryRouteDeps {
  app: Express;
  requirePlatformOwner: RequestHandler;
  isFirebaseAdminReady: () => boolean;
  emailPattern: RegExp;
  refreshDynamicTenants: () => void;
  refreshTenantDocs: (force?: boolean) => Promise<void>;
  getRequestHostname: (req: Request) => string;
  resolveTenantFromHostname: (host: string, originalUrl: string) => TenantResolution;
  getActiveTenantRegistry: () => Record<string, TenantDomainConfig>;
  upsertManagedAccount: (input: ManagedAccountInput, options?: ManagedAccountOptions) => Promise<ManagedAccountResult>;
  resolveDynamicTenantsPath: () => string;
  invalidateDynamicTenants: () => void;
}

export function registerTenantRegistryRoutes({
  app,
  requirePlatformOwner,
  isFirebaseAdminReady,
  emailPattern,
  refreshDynamicTenants,
  refreshTenantDocs,
  getRequestHostname,
  resolveTenantFromHostname,
  getActiveTenantRegistry,
  upsertManagedAccount,
  resolveDynamicTenantsPath,
  invalidateDynamicTenants,
}: TenantRegistryRouteDeps) {
  app.get('/api/tenant/resolve', async (req, res) => {
    refreshDynamicTenants();
    await refreshTenantDocs();
    const host = getRequestHostname(req);
    const resolution = resolveTenantFromHostname(host, req.originalUrl);
    res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate');
    res.json(resolution);
  });

  app.get('/api/tenants', async (req, res) => {
    try {
      await refreshTenantDocs();
      // Merge static + dynamic(JSON) + Firestore so every school — including the
      // statically configured school-1/school-2 — is listed with complete fields.
      const mergedTenants = Object.values(getActiveTenantRegistry());

      const publicTenants = mergedTenants.map((tenant: TenantDomainConfig) => ({
        tenantId: typeof tenant?.tenantId === 'string' ? tenant.tenantId : '',
        subdomain: typeof tenant?.subdomain === 'string' ? tenant.subdomain : '',
        customDomains: Array.isArray(tenant?.customDomains)
          ? tenant.customDomains.filter((domain: unknown): domain is string => typeof domain === 'string').slice(0, 10)
          : [],
        nameAr: typeof tenant?.nameAr === 'string' ? tenant.nameAr.slice(0, 120) : '',
        nameEn: typeof tenant?.nameEn === 'string' ? tenant.nameEn.slice(0, 120) : '',
        logoText: typeof tenant?.logoText === 'string' ? tenant.logoText.slice(0, 8) : '',
        primaryColor: typeof tenant?.primaryColor === 'string' ? tenant.primaryColor : '',
        isActive: tenant?.isActive !== false,
      }));

      res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate');
      res.json({ success: true, count: publicTenants.length, tenants: publicTenants });
    } catch (err: unknown) {
      console.error('[TENANTS-LIST-ERROR]', err);
      res.status(500).json({ success: false, error: 'Failed to read the tenant registry.' });
    }
  });

  // Protected platform-owner endpoint for tenant subscriptions
  app.get('/api/tenants/subscriptions', requirePlatformOwner, async (req, res) => {
    try {
      await refreshTenantDocs();
      const mergedTenants = Object.values(getActiveTenantRegistry());
      const map: Record<string, unknown> = {};
      for (const tenant of mergedTenants) {
        if (tenant?.tenantId) {
          const normalized = normalizeSubscription(tenant?.subscription);
          const evaluation = evaluateSubscription(normalized);
          map[tenant.tenantId] = {
            plan: normalized.plan,
            billingCycle: normalized.billingCycle,
            effectiveStatus: evaluation.effectiveStatus,
            accessEnabled: evaluation.accessEnabled,
            gracePeriodDays: normalized.gracePeriodDays,
            currentPeriodEnd: evaluation.periodEnd,
            daysRemaining: evaluation.daysRemaining,
            graceDaysRemaining: evaluation.graceDaysRemaining,
          };
        }
      }
      res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate');
      res.json({ success: true, count: Object.keys(map).length, subscriptions: map });
    } catch (err: unknown) {
      console.error('[TENANTS-SUBSCRIPTIONS-ERROR]', err);
      res.status(500).json({ success: false, error: 'Failed to read subscriptions.' });
    }
  });

  app.post('/api/tenants/provision', requirePlatformOwner, async (req, res) => {
    try {
      const payload = req.body;
      const slugPattern = /^[a-z0-9][a-z0-9-]{2,31}$/;
      const hostPattern = /^(?=.{1,253}$)([a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?\.)+[a-z]{2,}$/i;

      if (!payload || typeof payload !== 'object') {
        return res.status(400).json({ success: false, error: 'Invalid tenant config payload' });
      }

      const tenantId = typeof payload.tenantId === 'string' ? payload.tenantId.trim().toLowerCase() : '';
      const subdomain = typeof payload.subdomain === 'string' ? payload.subdomain.trim().toLowerCase() : '';
      const nameAr = typeof payload.nameAr === 'string' ? payload.nameAr.trim().slice(0, 120) : '';

      if (!slugPattern.test(tenantId) || !slugPattern.test(subdomain) || !nameAr) {
        return res.status(400).json({
          success: false,
          error: 'tenantId and subdomain must be 3-32 lowercase letters, digits or hyphens; nameAr is required.',
        });
      }

      const customDomains = Array.isArray(payload.customDomains)
        ? payload.customDomains
            .filter((domain: unknown): domain is string => typeof domain === 'string' && hostPattern.test(domain))
            .map((domain: string) => domain.toLowerCase())
            .slice(0, 10)
        : [];

      // Validate the principal up-front so a bad email never leaves a half-built school.
      const principalInput = payload.principal && typeof payload.principal === 'object' ? payload.principal : null;
      const principalEmail =
        principalInput && typeof principalInput.email === 'string' ? principalInput.email.trim().toLowerCase() : '';
      if (principalInput && !emailPattern.test(principalEmail)) {
        return res.status(400).json({ success: false, error: 'principal.email must be a valid email address.' });
      }

      let sanitizedWithPrincipal: { uid: string; email: string; temporaryPassword: string } | null = null;

      // Re-provisioning an existing school must never silently reset its
      // subscription (and thus un-suspend it) or flip it back to active.
      let existingTenant: Record<string, unknown> | null = null;
      if (isFirebaseAdminReady()) {
        try {
          const existingSnap = await admin.firestore().doc(`tenants/${tenantId}`).get();
          if (existingSnap.exists) existingTenant = (existingSnap.data() as Record<string, unknown>) || null;
        } catch (error: unknown) {
          const msg = error instanceof Error ? error.message : String(error);
          console.warn('[TENANTS] Could not read the existing tenant document:', msg);
        }
      }
      const subscriptionForTenant =
        (existingTenant?.subscription as typeof defaultSubscription extends () => infer R ? R : never) ||
        defaultSubscription();
      const isActiveForTenant =
        typeof payload.isActive === 'boolean'
          ? payload.isActive
          : existingTenant
          ? existingTenant.isActive !== false
          : true;

      const sanitized = {
        tenantId,
        subdomain,
        customDomains,
        nameAr,
        nameEn: typeof payload.nameEn === 'string' ? payload.nameEn.trim().slice(0, 120) : '',
        code: typeof payload.code === 'string' ? payload.code.trim().slice(0, 30) : '',
        cityAr: typeof payload.cityAr === 'string' ? payload.cityAr.trim().slice(0, 80) : '',
        cityEn: typeof payload.cityEn === 'string' ? payload.cityEn.trim().slice(0, 80) : '',
        academicYear: typeof payload.academicYear === 'string' ? payload.academicYear.trim().slice(0, 40) : '',
        currentTerm: typeof payload.currentTerm === 'string' ? payload.currentTerm.trim().slice(0, 60) : '',
        schoolType: typeof payload.schoolType === 'string' ? payload.schoolType.trim().slice(0, 20) : 'mixed',
        primaryColor: /^#[0-9a-fA-F]{6}$/.test(String(payload.primaryColor)) ? String(payload.primaryColor) : '#059669',
        logoText: typeof payload.logoText === 'string' ? payload.logoText.slice(0, 8) : '',
        isActive: isActiveForTenant,
        subscription: subscriptionForTenant,
      };

      const dynamicPath = resolveDynamicTenantsPath();
      let dynamicList: TenantDomainConfig[] = [];
      if (fs.existsSync(dynamicPath)) {
        try {
          dynamicList = JSON.parse(fs.readFileSync(dynamicPath, 'utf8'));
        } catch (err) {
          console.warn('[TENANTS] Could not read local tenant mirror:', err);
        }
      }

      const updated = [...dynamicList.filter((d) => d.tenantId !== sanitized.tenantId), sanitized as TenantDomainConfig];
      try {
        fs.writeFileSync(dynamicPath, JSON.stringify(updated, null, 2), 'utf8');
        invalidateDynamicTenants();
      } catch (writeError: unknown) {
        // Serverless hosts expose a read-only filesystem. Firestore is the durable
        // tenant registry there, so the local JSON mirror is best-effort only.
        const msg = writeError instanceof Error ? writeError.message : String(writeError);
        console.warn('[TENANTS] Local registry mirror is not writable; relying on Firestore only.', msg);
      }
      if (isFirebaseAdminReady()) {
        try {
          await admin.firestore().doc(`tenants/${sanitized.tenantId}`).set(sanitized, { merge: true });
          await refreshTenantDocs(true);
        } catch (error: unknown) {
          const msg = error instanceof Error ? error.message : String(error);
          console.warn('[TENANTS] Could not persist the Firestore tenant document:', msg);
        }
      }

      // Persist the initial school profile + settings so the new tenant renders the
      // same on every device, not only the browser that created it.
      if (isFirebaseAdminReady() && (payload.schoolProfile || payload.settings)) {
        try {
          await admin.firestore().doc(`settings/${sanitized.tenantId}`).set(
            {
              ...(payload.settings && typeof payload.settings === 'object' ? { settings: payload.settings } : {}),
              ...(payload.schoolProfile && typeof payload.schoolProfile === 'object'
                ? { schoolProfile: payload.schoolProfile }
                : {}),
              updatedAt: new Date().toISOString(),
              updatedBy: req.user?.uid || 'platform-owner',
            },
            { merge: true }
          );
        } catch (error: unknown) {
          const msg = error instanceof Error ? error.message : String(error);
          console.warn('[TENANTS] Could not persist the initial school profile:', msg);
        }
      }

      // Create the principal's login so the school is usable the moment it exists.
      if (principalInput) {
        try {
          const account = await upsertManagedAccount(
            {
              tenantId: sanitized.tenantId,
              email: principalEmail,
              name:
                typeof principalInput.name === 'string' && principalInput.name.trim()
                  ? principalInput.name.trim().slice(0, 120)
                  : principalEmail,
              role: 'admin',
              phone: typeof principalInput.phone === 'string' ? principalInput.phone.trim().slice(0, 30) : '',
              jobTitle: 'مدير المدرسة (School Principal)',
              password: typeof principalInput.password === 'string' ? principalInput.password : undefined,
            },
            { allowExisting: true, resetPassword: true }
          );
          sanitizedWithPrincipal = { uid: account.uid, email: principalEmail, temporaryPassword: account.password };
        } catch (error: unknown) {
          const errObj = error as { statusCode?: number; message?: string };
          const msg = errObj?.message || String(error);
          console.error('[TENANTS] Could not create the principal account:', msg);
          const status = typeof errObj?.statusCode === 'number' ? errObj.statusCode : 502;
          return res.status(status).json({
            success: false,
            error: `المدرسة سُجلت، لكن إنشاء حساب المدير فشل: ${msg}`,
            tenant: sanitized,
          });
        }
      }

      console.log(`[TENANTS] Provisioned '${sanitized.tenantId}' by ${req.user?.email || 'unknown'}`);
      res.json({
        success: true,
        tenant: sanitized,
        ...(sanitizedWithPrincipal ? { principal: sanitizedWithPrincipal } : {}),
      });
    } catch (err: unknown) {
      console.error('[TENANTS-PROVISION-ERROR]', err);
      res.status(500).json({ success: false, error: 'Failed to persist the tenant configuration.' });
    }
  });

}

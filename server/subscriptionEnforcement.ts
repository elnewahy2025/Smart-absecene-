import express from 'express';
import type admin from 'firebase-admin';
import { isPublicRoute } from '../src/utils/routeAuth';
import {
  defaultSubscription,
  evaluateSubscription,
  normalizeSubscription,
} from '../src/config/subscription';
import type { TenantSubscription } from '../src/config/subscription';
import type { TenantDomainConfig } from '../src/config/tenantRegistry';
import type { AuthenticatedUser } from './types';

type Firestore = admin.firestore.Firestore;

interface SubscriptionEnforcementDeps {
  isFirebaseAdminReady: () => boolean;
  getFirestore: () => Firestore;
  getTenantRegistry: () => Record<string, TenantDomainConfig>;
  resetTenantDocsCache: () => void;
  refreshTenantDocs: (force?: boolean) => Promise<void>;
  isPlatformOwner: (user: AuthenticatedUser | undefined) => boolean;
  defaultTenantId: string;
}

export function createSubscriptionEnforcement({
  isFirebaseAdminReady,
  getFirestore,
  getTenantRegistry,
  resetTenantDocsCache,
  refreshTenantDocs,
  isPlatformOwner,
  defaultTenantId,
}: SubscriptionEnforcementDeps) {
// Short-lived per-tenant cache so enforcement costs at most one Firestore read
// per tenant per TTL window instead of one read per request.
const TENANT_SUB_CACHE = new Map<string, { sub: TenantSubscription; at: number }>();
const TENANT_SUB_TTL_MS = 15000;
const TENANT_ID_PATTERN = /^[a-z0-9][a-z0-9-]{2,31}$/;

// School staff operate strictly inside their claim tenant. The platform owner
// may act on another school by passing its tenantId (body) or tenant query.
const resolveTargetTenantId = (req: express.Request, fallback = defaultTenantId): string => {
  const user = req.user;
  const requested =
    typeof req.body?.tenantId === 'string'
      ? req.body.tenantId.trim().toLowerCase()
      : typeof req.query?.tenantId === 'string'
      ? req.query.tenantId.trim().toLowerCase()
      : typeof req.query?.tenant === 'string'
      ? String(req.query.tenant).trim().toLowerCase()
      : '';
  if (isPlatformOwner(user) && requested && TENANT_ID_PATTERN.test(requested)) {
    return requested;
  }
  return (user?.tenantId || req.hostTenant?.tenantId || fallback || '').toLowerCase();
};

function setTenantSubscriptionCache(tenantId: string, sub: TenantSubscription): void {
  TENANT_SUB_CACHE.set(tenantId, { sub, at: Date.now() });
}

async function loadTenantSubscription(tenantId: string): Promise<TenantSubscription> {
  const cached = TENANT_SUB_CACHE.get(tenantId);
  if (cached && Date.now() - cached.at < TENANT_SUB_TTL_MS) return cached.sub;
  if (!isFirebaseAdminReady()) return defaultSubscription();
  try {
    const snapshot = await getFirestore().doc(`tenants/${tenantId}`).get();
    const sub = normalizeSubscription(snapshot.exists ? (snapshot.data() as { subscription?: unknown })?.subscription : undefined);
    setTenantSubscriptionCache(tenantId, sub);
    return sub;
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : String(error);
    console.warn(`[SUBSCRIPTION:${tenantId}] Could not load subscription:`, msg);
    return cached ? cached.sub : defaultSubscription();
  }
}

async function writeSubscriptionAudit(
  tenantId: string,
  actor: { uid?: string; email?: string } | undefined,
  entry: { action: string; details: string; detailsEn: string }
): Promise<void> {
  if (!isFirebaseAdminReady()) return;
  try {
    const id = getFirestore().collection('audit_logs').doc().id;
    await getFirestore().doc(`audit_logs/${id}`).set({
      id,
      tenantId,
      entityType: 'subscription',
      action: entry.action,
      details: entry.details,
      detailsEn: entry.detailsEn,
      performerName: actor?.email || 'platform-owner',
      performerId: actor?.uid || '',
      timestamp: new Date().toISOString(),
    });
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : String(error);
    console.warn(`[SUBSCRIPTION:${tenantId}] Could not write audit entry:`, msg);
  }
}

// Firestore rejects `undefined` anywhere in a document. Normalizers can leave
// optional keys present but undefined, so strip them recursively before writing.
function stripUndefinedDeep<T>(value: T): T {
  if (Array.isArray(value)) {
    return value.map((item) => stripUndefinedDeep(item)) as unknown as T;
  }
  if (value && typeof value === 'object' && Object.getPrototypeOf(value) === Object.prototype) {
    const clean: Record<string, unknown> = {};
    for (const [key, item] of Object.entries(value as Record<string, unknown>)) {
      if (item !== undefined) clean[key] = stripUndefinedDeep(item);
    }
    return clean as T;
  }
  return value;
}

async function persistTenantSubscription(
  tenantId: string,
  subscription: TenantSubscription,
  actor: { uid?: string; email?: string } | undefined,
  audit: { action: string; details: string; detailsEn: string }
): Promise<void> {
  if (!isFirebaseAdminReady()) {
    throw new Error('Firebase Admin is not configured on this server.');
  }
  // Static tenants (school-1/school-2) may not have a Firestore document yet.
  // Seed it from the registry first so the durable document is complete; writing
  // only `{ subscription }` would otherwise leave a partial record behind.
  const docRef = getFirestore().doc(`tenants/${tenantId}`);
  const existing = await docRef.get();
  if (!existing.exists) {
    const config = getTenantRegistry()[tenantId];
    if (config) {
      const seed: Record<string, unknown> = { ...config };
      delete seed.subscription;
      await docRef.set(stripUndefinedDeep({ ...seed, tenantId, subscription }), { merge: true });
    } else {
      await docRef.set(stripUndefinedDeep({ tenantId, subscription }), { merge: true });
    }
  } else {
    await docRef.set(stripUndefinedDeep({ subscription }), { merge: true });
  }
  setTenantSubscriptionCache(tenantId, subscription);
  // Force the registry overlay to re-read so /api/tenant/resolve reflects the change.
  resetTenantDocsCache();
  void refreshTenantDocs(true);
  await writeSubscriptionAudit(tenantId, actor, audit);
}

// Authoritative, real-time gate. Platform owners bypass so the owner can always
// sign in and manage every school; existing schools with no subscription doc are
// grandfathered as active.
const requireActiveSubscription = async (
  req: express.Request,
  res: express.Response,
  next: express.NextFunction
) => {
  const route = (req.path || '').toLowerCase();
  if (isPublicRoute(route)) return next();

  const user = req.user;
  if (!user || isPlatformOwner(user)) return next();

  const tenantId = typeof user.tenantId === 'string' ? user.tenantId : '';
  if (!tenantId) return next();

  const evaluation = evaluateSubscription(await loadTenantSubscription(tenantId));
  if (evaluation.accessEnabled) return next();

  const suspended = evaluation.effectiveStatus === 'suspended';
  return res.status(402).json({
    error: suspended
      ? 'تم إيقاف اشتراك هذه المدرسة. يرجى التواصل مع الجهة المالكة للمنصة.'
      : 'انتهى اشتراك هذه المدرسة. يرجى التواصل مع الجهة المالكة للمنصة.',
    code: suspended ? 'SUBSCRIPTION_SUSPENDED' : 'SUBSCRIPTION_EXPIRED',
    subscription: evaluation,
  });
};
  return {
    resolveTargetTenantId,
    loadTenantSubscription,
    persistTenantSubscription,
    stripUndefinedDeep,
    requireActiveSubscription,
  };
}

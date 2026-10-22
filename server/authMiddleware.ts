import express from 'express';
import './types';
import crypto from 'crypto';
import admin from 'firebase-admin';
import {
  accountUpsertDenial,
  isPlatformOwnerClaim,
} from '../src/utils/accountAccess';
import { isPublicRoute } from '../src/utils/routeAuth';

const auth = () => admin.auth();
const firestore = () => admin.firestore();

export const VALID_ROLES = new Set(['admin', 'registrar', 'teacher', 'parent', 'super_admin']);
export const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

interface AuthMiddlewareDeps {
  isFirebaseAdminReady: () => boolean;
  requestHostTenant: (req: express.Request) => any;
  sharedAuthValue: string;
  allowDevAuth: boolean;
  devAuthRole: string;
  devAuthTenant: string;
}

export function createAuthMiddleware({
  isFirebaseAdminReady,
  requestHostTenant,
  sharedAuthValue,
  allowDevAuth,
  devAuthRole,
  devAuthTenant,
}: AuthMiddlewareDeps) {
// Resolve identity from verified, server-set claims only.
// Never from request headers: those are client-controlled.

const generateTemporaryPassword = (): string => `Sm!${crypto.randomBytes(9).toString('base64url')}7`;

const accountOperationError = (message: string, statusCode: number) =>
  Object.assign(new Error(message), { statusCode });

/**
 * Create or refresh a login for a tenant member: Firebase Auth account,
 * server-set claims, and the Firestore profile keyed by the auth UID (which is
 * what firestore.rules and the API both read).
 *
 * Firebase Auth email addresses are global. This function therefore refuses to
 * touch an existing login unless the caller explicitly opts in, the login does
 * not belong to the platform owner, and the profile tenant matches the target.
 */
const upsertManagedAccount = async (
  input: {
    tenantId: string;
    email: string;
    name?: string;
    role: string;
    phone?: string;
    jobTitle?: string;
    status?: string;
    assignedClasses?: string[];
    assignedSubjects?: string[];
    password?: string;
  },
  options: { allowExisting?: boolean; resetPassword?: boolean } = {}
): Promise<{ uid: string; password: string; created: boolean }> => {
  if (!isFirebaseAdminReady()) {
    throw new Error('Firebase Admin is not configured on this server.');
  }

  const temporaryPassword =
    input.password && input.password.length >= 8 ? input.password : generateTemporaryPassword();
  const status = input.status === 'inactive' ? 'inactive' : 'active';
  const resetPassword = options.resetPassword === true;

  let user: any = null;
  let created = false;
  let existingProfile: Record<string, any> | null = null;

  try {
    user = await auth().getUserByEmail(input.email);
  } catch (lookupError: any) {
    if (lookupError?.code !== 'auth/user-not-found') throw lookupError;
  }

  if (user) {
    const [profileSnap, adminSnap] = await Promise.all([
      firestore().doc(`users/${user.uid}`).get(),
      firestore().doc(`admins/${user.uid}`).get(),
    ]);
    existingProfile = profileSnap.exists ? (profileSnap.data() as Record<string, any>) : null;

    const denial = accountUpsertDenial(
      { exists: true, profile: existingProfile, isPlatformAdminDoc: adminSnap.exists },
      input.tenantId,
      options.allowExisting === true
    );
    if (denial) {
      throw accountOperationError(denial, denial.includes('protected') ? 403 : 409);
    }

    const authUpdates: Record<string, any> = {
      emailVerified: true,
      disabled: status === 'inactive',
      ...(input.name ? { displayName: input.name } : {}),
    };
    if (resetPassword) authUpdates.password = temporaryPassword;
    await auth().updateUser(user.uid, authUpdates);

    const roleOrTenantChanged =
      !existingProfile ||
      existingProfile.role !== input.role ||
      existingProfile.tenantId !== input.tenantId;
    if (resetPassword || roleOrTenantChanged) {
      await auth().revokeRefreshTokens(user.uid).catch(() => {});
    }
  } else {
    user = await auth().createUser({
      email: input.email,
      password: temporaryPassword,
      emailVerified: true,
      ...(input.name ? { displayName: input.name } : {}),
    });
    created = true;
  }

  try {
    await auth().setCustomUserClaims(user.uid, { role: input.role, tenantId: input.tenantId });

    const timestamp = new Date().toISOString();
    const profile: Record<string, any> = {
      userId: user.uid,
      tenantId: input.tenantId,
      name: input.name || input.email,
      email: input.email,
      role: input.role,
      phone: input.phone || '',
      jobTitle: input.jobTitle || '',
      status,
      updatedAt: timestamp,
    };
    if (created) profile.createdAt = timestamp;
    if (Array.isArray(input.assignedClasses)) profile.assignedClasses = input.assignedClasses;
    if (Array.isArray(input.assignedSubjects)) profile.assignedSubjects = input.assignedSubjects;

    await firestore().doc(`users/${user.uid}`).set(profile, { merge: true });
  } catch (error) {
    // Do not leave an Auth account without a Firestore profile (which would
    // also leak a reserved seat) when a brand-new account fails mid-provision.
    if (created) await auth().deleteUser(user.uid).catch(() => {});
    throw error;
  }

  return {
    uid: user.uid,
    password: created || resetPassword ? temporaryPassword : '',
    created,
  };
};

const findAuthUserByEmail = async (email: string): Promise<any | null> => {
  try {
    return await auth().getUserByEmail(email);
  } catch (error: any) {
    if (error?.code === 'auth/user-not-found') return null;
    throw error;
  }
};

// The owner is identified by the Admin-SDK-set claim only. The previous email
// fallback meant that anyone who could recreate/reset the owner's login could
// inherit owner privileges; claims are the single source of truth server-side.
const isPlatformOwner = (user: any): boolean => isPlatformOwnerClaim(user);

const resolveServerIdentity = (
  decoded: any
): { role: string; tenantId: string } | null => {
  // Claims are set only by the Admin SDK. The Firestore profile is intentionally
  // NOT trusted here: even though client-side profile creation is now limited to
  // the platform owner, the profile document is not an authorization source.
  const claimRole = typeof decoded?.role === 'string' ? decoded.role : '';
  const claimTenant = typeof decoded?.tenantId === 'string' ? decoded.tenantId : '';
  if (VALID_ROLES.has(claimRole) && claimTenant) {
    return { role: claimRole, tenantId: claimTenant };
  }
  return null;
};

const authenticateRequest = async (req: express.Request, res: express.Response, next: express.NextFunction) => {
  const route = (req.path || '').toLowerCase();

  // Allow static assets, SPA pages, Vite HMR, and health checks freely
  if (isPublicRoute(route)) {
    return next();
  }

  // Domain-level verification: Block requests from unknown or inactive tenant domains
  const hostResolution = requestHostTenant(req);
  if (hostResolution.status === 'unknown_domain') {
    return res.status(404).json({
      error: `Unknown or unconfigured school domain: ${hostResolution.normalizedHostname}`,
      code: 'UNKNOWN_TENANT_DOMAIN',
    });
  }
  if (hostResolution.status === 'inactive_tenant') {
    return res.status(403).json({
      error: `School institution is currently inactive: ${hostResolution.normalizedHostname}`,
      code: 'INACTIVE_TENANT_DOMAIN',
    });
  }

  req.hostTenant = hostResolution;

  const authHeader = req.get('authorization') || '';
  const bearerValue = authHeader.startsWith('Bearer ') ? authHeader.slice(7).trim() : null;

  if (!bearerValue) {
    return res.status(401).json({ error: 'Unauthorized: bearer credential is required.' });
  }

  // Explicit local development credential. Disabled in production, and the role
  // and tenant come from the environment, never from client headers.
  if (allowDevAuth && sharedAuthValue && bearerValue === sharedAuthValue) {
    const devRole = VALID_ROLES.has(devAuthRole) ? devAuthRole : 'teacher';
    req.user = {
      uid: 'dev-user',
      email: 'dev@school.local',
      role: devRole,
      tenantId:
        devAuthTenant ||
        (hostResolution.status === 'resolved' ? hostResolution.tenantId : 'school-1'),
    };
    return next();
  }

  if (!isFirebaseAdminReady()) {
    return res.status(503).json({
      error: 'Authentication is not configured on this server.',
      code: 'AUTH_NOT_CONFIGURED',
    });
  }

  try {
    // checkRevoked=true makes disabled accounts and role changes take effect
    // immediately instead of waiting for the ID token to expire.
    const decoded = await auth().verifyIdToken(bearerValue, true);
    const identity = resolveServerIdentity(decoded);

    if (!identity) {
      return res.status(403).json({
        error: 'No role claim is assigned to this account. Run the claims backfill (scripts/backfill-user-claims.mjs).',
        code: 'NO_ROLE_ASSIGNED',
      });
    }

    req.user = {
      ...decoded,
      role: identity.role,
      tenantId: identity.tenantId,
    };
    return next();
  } catch (verifyError: any) {
    console.warn('[AUTH] Credential verification failed:', verifyError?.code || verifyError?.message);
    return res.status(401).json({
      error: 'Unauthorized: invalid or expired credential.',
      code: 'INVALID_CREDENTIAL',
    });
  }
};

// RBAC middleware. `super_admin` is the only implicit pass; `admin` must be listed explicitly.
const requireRole = (allowedRoles: string[]) => {
  return (req: express.Request, res: express.Response, next: express.NextFunction) => {
    const user = req.user;
    if (!user) {
      return res.status(401).json({ error: 'Unauthorized: authentication required.' });
    }
    if (user.role === 'super_admin' || allowedRoles.includes(user.role)) {
      return next();
    }
    return res.status(403).json({
      error: `Forbidden: role '${user.role}' lacks required permissions. Allowed roles: [${allowedRoles.join(', ')}]`,
    });
  };
};

const requirePlatformOwner = (req: express.Request, res: express.Response, next: express.NextFunction) => {
  const user = req.user;
  if (!user) {
    return res.status(401).json({ error: 'Unauthorized: authentication required.' });
  }
  if (!isPlatformOwner(user)) {
    return res.status(403).json({
      error: 'Forbidden: platform owner privileges are required.',
      code: 'PLATFORM_OWNER_REQUIRED',
    });
  }
  return next();
};

// Multi-Tenant Middleware: Validate domain and tenant isolation
const requireTenant = (req: express.Request, res: express.Response, next: express.NextFunction) => {
  const user = req.user;
  const hostTenant = req.hostTenant;

  // 1. Enforce that if request came via a specific school domain, user must belong to that school
  if (hostTenant && hostTenant.status === 'resolved' && user) {
    if (!isPlatformOwner(user) && user.tenantId !== hostTenant.tenantId) {
      return res.status(403).json({
        error: `Forbidden: cross-tenant access denied. Your account belongs to '${user.tenantId}' but the request was made on '${hostTenant.config?.nameAr || hostTenant.tenantId}' domain.`,
        code: 'TENANT_DOMAIN_MISMATCH',
      });
    }
  }

  // 2. Enforce target payload tenantId matches user tenant (platform owners excepted)
  const targetTenantId = req.body?.tenantId || req.query?.tenantId;
  if (targetTenantId && user?.tenantId && !isPlatformOwner(user)) {
    if (targetTenantId !== user.tenantId) {
      return res.status(403).json({
        error: `Forbidden: multi-tenant violation. Tenant '${user.tenantId}' cannot perform actions for tenant '${targetTenantId}'.`,
      });
    }
  }
  next();
};
  return {
    VALID_ROLES,
    EMAIL_PATTERN,
    generateTemporaryPassword,
    accountOperationError,
    upsertManagedAccount,
    findAuthUserByEmail,
    isPlatformOwner,
    resolveServerIdentity,
    authenticateRequest,
    requireRole,
    requirePlatformOwner,
    requireTenant,
  };
}

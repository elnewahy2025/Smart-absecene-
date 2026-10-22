import express from 'express';
import path from 'path';
import { registerPdfReportRoutes, getSystemChromePath } from './pdfReportRoutes';
import { registerHealthRoutes } from './healthRoutes';
import { registerTenantRegistryRoutes } from './tenantRegistryRoutes';
import { registerAiRoutes } from './aiRoutes';
import { registerSubscriptionRoutes } from './subscriptionRoutes';
import { registerUserAccountRoutes } from './userAccountRoutes';
import { registerStudentEnrollmentRoutes } from './studentEnrollmentRoutes';
import type { createAuthMiddleware } from './authMiddleware';
import type { createSubscriptionEnforcement } from './subscriptionEnforcement';
import {
  apiGeneralLimiter,
  apiHealthLimiter,
  chatLimiter,
  analyzeImageLimiter,
  dailyDigestLimiter,
  notificationDispatchLimiter,
} from './rateLimiters';
import { getActiveTenantRegistry, resolveTenantFromHostname } from '../src/config/tenantRegistry';
import { getRequestHostname } from './requestHardening';
import { accountPatchDenial, accountRoleChangeDenial } from '../src/utils/accountAccess';

type AuthMiddleware = ReturnType<typeof createAuthMiddleware>;
type SubscriptionEnforcement = ReturnType<typeof createSubscriptionEnforcement>;

interface TenantSync {
  refreshTenantDocs: (force?: boolean) => Promise<void>;
  refreshDynamicTenants: () => void;
  invalidateDynamicTenants: () => void;
}

interface ApiRoutesDeps {
  app: express.Express;
  baseDir: string;
  isVercel: boolean;
  isFirebaseAdminReady: () => boolean;
  firebaseAdminInitialized: boolean;
  adminKeyLoaded: boolean;
  geminiKey: string;
  sharedAuthValue: string;
  auth: AuthMiddleware;
  enforcement: SubscriptionEnforcement;
  tenantSync: TenantSync;
  tenantIdPattern: RegExp;
  defaultTenantId: string;
  sanitizeText: (value: unknown, fallback?: string) => string;
}

/**
 * Mounts every API route in the order the middleware chain expects:
 * PDF (self-authenticated) → rate limits → global auth/tenant/subscription
 * guards → health → tenant, AI, subscription, account and enrollment routes.
 */
export function registerApiRoutes({
  app,
  baseDir,
  isVercel,
  isFirebaseAdminReady,
  firebaseAdminInitialized,
  adminKeyLoaded,
  geminiKey,
  sharedAuthValue,
  auth,
  enforcement,
  tenantSync,
  tenantIdPattern,
  defaultTenantId,
  sanitizeText,
}: ApiRoutesDeps) {
  const {
    VALID_ROLES,
    EMAIL_PATTERN,
    upsertManagedAccount,
    findAuthUserByEmail,
    isPlatformOwner,
    authenticateRequest,
    requireRole,
    requirePlatformOwner,
    requireTenant,
  } = auth;
  const {
    resolveTargetTenantId,
    loadTenantSubscription,
    persistTenantSubscription,
    stripUndefinedDeep,
    requireActiveSubscription,
  } = enforcement;
  const { refreshTenantDocs, refreshDynamicTenants, invalidateDynamicTenants } = tenantSync;

  registerPdfReportRoutes({ app, authenticateRequest, requireRole, requireTenant });

  app.use('/api', apiGeneralLimiter);
  app.use('/api/health', apiHealthLimiter);
  app.use('/api/chat', chatLimiter);
  app.use('/api/analyze-image', analyzeImageLimiter);
  app.use('/api/daily-digest', dailyDigestLimiter);
  app.use('/api/notifications', notificationDispatchLimiter);
  app.use(authenticateRequest);
  app.use(requireTenant);
  app.use(requireActiveSubscription);

  registerHealthRoutes({
    app,
    baseDir,
    isVercel,
    hasGeminiKey: Boolean(geminiKey),
    isFirebaseAdminReady,
    firebaseAdminInitialized,
    adminKeyLoaded,
    hasSharedAuthValue: Boolean(sharedAuthValue),
    getChromePath: getSystemChromePath,
  });

  // --- Tenant registry: resolution, listing, provisioning (platform owner) ------
  registerTenantRegistryRoutes({
    app,
    requirePlatformOwner,
    isFirebaseAdminReady,
    emailPattern: EMAIL_PATTERN,
    refreshDynamicTenants,
    refreshTenantDocs,
    getRequestHostname,
    resolveTenantFromHostname,
    getActiveTenantRegistry,
    upsertManagedAccount,
    resolveDynamicTenantsPath: () =>
      process.env.DYNAMIC_TENANTS_PATH || path.resolve(baseDir, 'src/config/dynamicTenants.json'),
    invalidateDynamicTenants,
  });

  // --- AI, notifications, messaging gateway & holiday search routes ------------
  registerAiRoutes({
    app,
    requireRole,
    requireTenant,
    requirePlatformOwner,
    resolveTargetTenantId,
    sanitizeText,
    isPlatformOwner,
    tenantIdPattern,
    defaultTenantId,
    isFirebaseAdminReady,
  });

  // --- Tenant subscription & renewal control (platform owner only) -------------
  registerSubscriptionRoutes({
    app,
    requirePlatformOwner,
    tenantIdPattern,
    loadTenantSubscription,
    persistTenantSubscription,
  });

  // --- Tenant member accounts (create real logins for staff) -------------------
  registerUserAccountRoutes({
    app,
    isFirebaseAdminReady,
    requireRole,
    isPlatformOwner,
    emailPattern: EMAIL_PATTERN,
    tenantIdPattern,
    validRoles: VALID_ROLES,
    loadTenantSubscription,
    findAuthUserByEmail,
    upsertManagedAccount,
    accountPatchDenial,
    accountRoleChangeDenial,
  });

  // --- Student enrollment (server-authoritative seat enforcement) --------------
  registerStudentEnrollmentRoutes({
    app,
    isFirebaseAdminReady,
    requireRole,
    resolveTargetTenantId,
    tenantIdPattern,
    isPlatformOwner,
    loadTenantSubscription,
    stripUndefinedDeep,
    sanitizeText,
  });
}

import type { Express, Request, RequestHandler } from 'express';
import { registerAiChatRoutes } from './aiChatRoutes';
import { registerAiDigestRoutes } from './aiDigestRoutes';
import { registerAiTenantSettingsRoutes } from './aiTenantSettingsRoutes';
import { geminiKey } from './genaiClient';

export { geminiKey };

interface AiRouteDeps {
  app: Express;
  requireRole: (allowedRoles: string[]) => RequestHandler;
  requireTenant: RequestHandler;
  requirePlatformOwner: RequestHandler;
  resolveTargetTenantId: (req: Request, fallback?: string) => string;
  sanitizeText: (value: unknown, fallback?: string) => string;
  isPlatformOwner: (user: any) => boolean;
  tenantIdPattern: RegExp;
  defaultTenantId: string;
  isFirebaseAdminReady: () => boolean;
}

export function registerAiRoutes({
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
}: AiRouteDeps) {
  // 1. Multi-turn chat + 2. Image analysis endpoints
  registerAiChatRoutes({ app, requireRole, requireTenant, resolveTargetTenantId, sanitizeText });

  // 3. Daily digest briefing + 4. Daily digest dispatch endpoints
  registerAiDigestRoutes({
    app,
    requireRole,
    requireTenant,
    resolveTargetTenantId,
    sanitizeText,
    isPlatformOwner,
    tenantIdPattern,
    defaultTenantId,
    isFirebaseAdminReady,
  });

  // 5. Tenant AI configuration, messaging gateway credentials, holiday search
  registerAiTenantSettingsRoutes({
    app,
    requireRole,
    requireTenant,
    requirePlatformOwner,
    resolveTargetTenantId,
    tenantIdPattern,
    defaultTenantId,
    isFirebaseAdminReady,
  });
}

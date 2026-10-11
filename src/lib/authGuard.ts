import type { Request, Response, NextFunction } from 'express';

export type AppRole = 'admin' | 'registrar' | 'teacher' | 'parent';

export interface AuthContext {
  uid: string;
  email?: string;
  role?: AppRole;
  tenantId?: string;
}

export const getAuthContext = (req: Request): AuthContext | null => {
  const authHeader = req.get('authorization') || '';
  const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7).trim() : null;

  if (!token) return null;

  const decoded = token.split('.')[1];
  if (!decoded) return null;

  try {
    const parsed = JSON.parse(Buffer.from(decoded, 'base64').toString('utf8'));
    return {
      uid: String(parsed.uid || parsed.sub || 'unknown-user'),
      email: typeof parsed.email === 'string' ? parsed.email : undefined,
      role: (parsed.role as AppRole) || undefined,
      tenantId: typeof parsed.tenantId === 'string' ? parsed.tenantId : undefined,
    };
  } catch {
    return null;
  }
};

export const requireAuth = (req: Request, res: Response, next: NextFunction) => {
  const authContext = getAuthContext(req);
  if (!authContext) {
    return res.status(401).json({ error: 'Unauthorized: missing or invalid bearer token.' });
  }
  (req as any).auth = authContext;
  next();
};

export const requireRole = (allowedRoles: AppRole[]) => {
  return (req: Request, res: Response, next: NextFunction) => {
    const authContext = getAuthContext(req);
    if (!authContext || !authContext.role) {
      return res.status(401).json({ error: 'Unauthorized: role not present.' });
    }

    if (!allowedRoles.includes(authContext.role as AppRole)) {
      return res.status(403).json({ error: 'Forbidden: role does not have access to this resource.' });
    }

    (req as any).auth = authContext;
    next();
  };
};

export const requireTenantAccess = (req: Request, res: Response, next: NextFunction) => {
  const authContext = getAuthContext(req);
  if (!authContext || !authContext.tenantId) {
    return res.status(401).json({ error: 'Unauthorized: tenant context missing.' });
  }

  const reqTenantId = (req.params.tenantId || req.body?.tenantId || req.query?.tenantId) as string | undefined;
  if (reqTenantId && reqTenantId !== authContext.tenantId) {
    return res.status(403).json({ error: 'Forbidden: tenant mismatch.' });
  }

  (req as any).auth = authContext;
  next();
};

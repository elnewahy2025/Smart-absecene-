import { describe, expect, it, vi } from 'vitest';
import admin from 'firebase-admin';
import { createAuthMiddleware } from './authMiddleware';

type Middleware = (req: any, res: any, next: any) => any;

function makeRes() {
  const res: any = { statusCode: 200, body: undefined };
  res.status = vi.fn((code: number) => {
    res.statusCode = code;
    return res;
  });
  res.json = vi.fn((body: unknown) => {
    res.body = body;
    return res;
  });
  return res;
}

function makeReq(overrides: Record<string, any> = {}) {
  const headers: Record<string, string> = overrides.headers || {};
  return {
    path: '/api/students',
    body: {},
    query: {},
    ...overrides,
    get: (name: string) => headers[name.toLowerCase()],
  } as any;
}

async function invoke(middleware: Middleware, req: any) {
  const res = makeRes();
  const next = vi.fn();
  await middleware(req, res, next);
  return { res, next };
}

function createMiddleware(overrides: Record<string, any> = {}) {
  return createAuthMiddleware({
    isFirebaseAdminReady: () => false,
    requestHostTenant: () => ({ status: 'unknown_domain', normalizedHostname: 'unknown.test' }),
    sharedAuthValue: 'dev-token',
    allowDevAuth: true,
    devAuthRole: 'admin',
    devAuthTenant: 'school-a',
    ...overrides,
  });
}

describe('authenticateRequest', () => {
  it('lets non-API static routes through without a credential', async () => {
    const auth = createMiddleware();
    const { res, next } = await invoke(auth.authenticateRequest, makeReq({ path: '/' }));
    expect(next).toHaveBeenCalledOnce();
    expect(res.status).not.toHaveBeenCalled();
  });

  it('lets allowlisted public API routes through', async () => {
    const auth = createMiddleware();
    const { next } = await invoke(auth.authenticateRequest, makeReq({ path: '/API/HEALTH' }));
    expect(next).toHaveBeenCalledOnce();
  });

  it('rejects unknown tenant domains before checking credentials', async () => {
    const auth = createMiddleware();
    const { res } = await invoke(auth.authenticateRequest, makeReq());
    expect(res.statusCode).toBe(404);
    expect(res.body.code).toBe('UNKNOWN_TENANT_DOMAIN');
  });

  it('rejects inactive tenant domains with 403', async () => {
    const auth = createMiddleware({
      requestHostTenant: () => ({ status: 'inactive_tenant', normalizedHostname: 'paused.test' }),
    });
    const { res } = await invoke(auth.authenticateRequest, makeReq());
    expect(res.statusCode).toBe(403);
    expect(res.body.code).toBe('INACTIVE_TENANT_DOMAIN');
  });

  it('requires a bearer credential on protected routes', async () => {
    const auth = createMiddleware({
      requestHostTenant: () => ({ status: 'resolved', tenantId: 'school-a' }),
    });
    const { res } = await invoke(auth.authenticateRequest, makeReq());
    expect(res.statusCode).toBe(401);
  });

  it('accepts the configured dev credential and uses the env role/tenant', async () => {
    const auth = createMiddleware({
      requestHostTenant: () => ({ status: 'resolved', tenantId: 'school-a' }),
    });
    const req = makeReq({ headers: { authorization: 'Bearer dev-token' } });
    const { res, next } = await invoke(auth.authenticateRequest, req);
    expect(next).toHaveBeenCalledOnce();
    expect(res.status).not.toHaveBeenCalled();
    expect(req.user).toMatchObject({ role: 'admin', tenantId: 'school-a' });
  });

  it('falls back to the host tenant when DEV_AUTH_TENANT is empty', async () => {
    const auth = createMiddleware({
      devAuthTenant: '',
      requestHostTenant: () => ({ status: 'resolved', tenantId: 'school-host' }),
    });
    const req = makeReq({ headers: { authorization: 'Bearer dev-token' } });
    await invoke(auth.authenticateRequest, req);
    expect(req.user.tenantId).toBe('school-host');
  });

  it('returns 503 when Firebase Admin is unavailable and dev auth is off', async () => {
    const auth = createMiddleware({
      allowDevAuth: false,
      requestHostTenant: () => ({ status: 'resolved', tenantId: 'school-a' }),
    });
    const { res } = await invoke(
      auth.authenticateRequest,
      makeReq({ headers: { authorization: 'Bearer some-token' } })
    );
    expect(res.statusCode).toBe(503);
    expect(res.body.code).toBe('AUTH_NOT_CONFIGURED');
  });

  it('verifies Firebase ID tokens and trusts only claim role/tenant', async () => {
    const verifyIdToken = vi.fn().mockResolvedValue({
      uid: 'u1',
      role: 'teacher',
      tenantId: 'school-a',
      email: 't@example.com',
    });
    const authSpy = vi
      .spyOn(admin, 'auth')
      .mockReturnValue({ verifyIdToken } as any);
    const auth = createMiddleware({
      isFirebaseAdminReady: () => true,
      requestHostTenant: () => ({ status: 'resolved', tenantId: 'school-a' }),
    });
    const req = makeReq({ headers: { authorization: 'Bearer id-token' } });
    const { next } = await invoke(auth.authenticateRequest, req);
    expect(verifyIdToken).toHaveBeenCalledWith('id-token', true);
    expect(next).toHaveBeenCalledOnce();
    expect(req.user).toMatchObject({ uid: 'u1', role: 'teacher', tenantId: 'school-a' });
    authSpy.mockRestore();
  });

  it('rejects ID tokens without role/tenant claims', async () => {
    const authSpy = vi
      .spyOn(admin, 'auth')
      .mockReturnValue({ verifyIdToken: vi.fn().mockResolvedValue({ uid: 'u2' }) } as any);
    const auth = createMiddleware({
      isFirebaseAdminReady: () => true,
      requestHostTenant: () => ({ status: 'resolved', tenantId: 'school-a' }),
    });
    const { res } = await invoke(
      auth.authenticateRequest,
      makeReq({ headers: { authorization: 'Bearer id-token' } })
    );
    expect(res.statusCode).toBe(403);
    expect(res.body.code).toBe('NO_ROLE_ASSIGNED');
    authSpy.mockRestore();
  });

  it('returns 401 when token verification fails', async () => {
    const authSpy = vi
      .spyOn(admin, 'auth')
      .mockReturnValue({ verifyIdToken: vi.fn().mockRejectedValue({ code: 'auth/id-token-expired' }) } as any);
    const auth = createMiddleware({
      isFirebaseAdminReady: () => true,
      requestHostTenant: () => ({ status: 'resolved', tenantId: 'school-a' }),
    });
    const { res } = await invoke(
      auth.authenticateRequest,
      makeReq({ headers: { authorization: 'Bearer id-token' } })
    );
    expect(res.statusCode).toBe(401);
    expect(res.body.code).toBe('INVALID_CREDENTIAL');
    authSpy.mockRestore();
  });
});

describe('requireRole', () => {
  const auth = createMiddleware();

  it('returns 401 without an authenticated user', () => {
    const { res } = invokeSync(auth.requireRole(['admin']), makeReq());
    expect(res.statusCode).toBe(401);
  });

  it('allows an explicitly listed role', () => {
    const req = makeReq({ user: { role: 'registrar' } });
    const { next } = invokeSync(auth.requireRole(['admin', 'registrar']), req);
    expect(next).toHaveBeenCalledOnce();
  });

  it('allows super_admin implicitly', () => {
    const req = makeReq({ user: { role: 'super_admin' } });
    const { next } = invokeSync(auth.requireRole(['admin']), req);
    expect(next).toHaveBeenCalledOnce();
  });

  it('denies an unlisted role with 403', () => {
    const req = makeReq({ user: { role: 'teacher' } });
    const { res } = invokeSync(auth.requireRole(['admin']), req);
    expect(res.statusCode).toBe(403);
  });
});

describe('requirePlatformOwner', () => {
  const auth = createMiddleware();

  it('requires an authenticated user', () => {
    const { res } = invokeSync(auth.requirePlatformOwner, makeReq());
    expect(res.statusCode).toBe(401);
  });

  it('accepts a super_admin claim', () => {
    const { next } = invokeSync(auth.requirePlatformOwner, makeReq({ user: { role: 'super_admin' } }));
    expect(next).toHaveBeenCalledOnce();
  });

  it('rejects a school admin', () => {
    const { res } = invokeSync(auth.requirePlatformOwner, makeReq({ user: { role: 'admin' } }));
    expect(res.statusCode).toBe(403);
    expect(res.body.code).toBe('PLATFORM_OWNER_REQUIRED');
  });
});

describe('requireTenant', () => {
  const auth = createMiddleware();

  it('rejects a user whose claim tenant differs from the resolved host tenant', () => {
    const req = makeReq({
      user: { role: 'admin', tenantId: 'school-a' },
      hostTenant: { status: 'resolved', tenantId: 'school-b', config: { nameAr: 'B' } },
    });
    const { res } = invokeSync(auth.requireTenant, req);
    expect(res.statusCode).toBe(403);
    expect(res.body.code).toBe('TENANT_DOMAIN_MISMATCH');
  });

  it('allows a platform owner to cross tenant domains', () => {
    const req = makeReq({
      user: { role: 'super_admin', tenantId: 'platform' },
      hostTenant: { status: 'resolved', tenantId: 'school-b' },
    });
    const { next } = invokeSync(auth.requireTenant, req);
    expect(next).toHaveBeenCalledOnce();
  });

  it('rejects a payload tenantId that does not match the user tenant', () => {
    const req = makeReq({ user: { role: 'admin', tenantId: 'school-a' }, body: { tenantId: 'school-b' } });
    const { res } = invokeSync(auth.requireTenant, req);
    expect(res.statusCode).toBe(403);
  });

  it('rejects a query tenantId that does not match the user tenant', () => {
    const req = makeReq({ user: { role: 'teacher', tenantId: 'school-a' }, query: { tenantId: 'school-b' } });
    const { res } = invokeSync(auth.requireTenant, req);
    expect(res.statusCode).toBe(403);
  });

  it('allows matching tenants and owners with a target tenant', () => {
    const match = makeReq({ user: { role: 'teacher', tenantId: 'school-a' }, body: { tenantId: 'school-a' } });
    expect(invokeSync(auth.requireTenant, match).next).toHaveBeenCalledOnce();

    const owner = makeReq({ user: { role: 'super_admin', tenantId: 'platform' }, body: { tenantId: 'school-b' } });
    expect(invokeSync(auth.requireTenant, owner).next).toHaveBeenCalledOnce();
  });
});

function invokeSync(middleware: Middleware, req: any) {
  const res = makeRes();
  const next = vi.fn();
  middleware(req, res, next);
  return { res, next };
}

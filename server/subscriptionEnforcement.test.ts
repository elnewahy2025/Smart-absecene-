import { describe, expect, it, vi } from 'vitest';
import { createSubscriptionEnforcement } from './subscriptionEnforcement';

function createEnforcement(overrides: Record<string, any> = {}) {
  return createSubscriptionEnforcement({
    isFirebaseAdminReady: () => false,
    getFirestore: () => {
      throw new Error('Firestore is not expected in this test.');
    },
    getTenantRegistry: () => ({}),
    resetTenantDocsCache: vi.fn(),
    refreshTenantDocs: vi.fn().mockResolvedValue(undefined),
    isPlatformOwner: (user: any) => user?.role === 'super_admin',
    defaultTenantId: 'school-default',
    ...overrides,
  });
}

function makeReq(overrides: Record<string, any> = {}) {
  return { path: '/api/students', body: {}, query: {}, ...overrides } as any;
}

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

describe('resolveTargetTenantId', () => {
  it('ignores a school admin payload tenantId and uses the claim tenant', () => {
    const enforcement = createEnforcement();
    const req = makeReq({ user: { role: 'admin', tenantId: 'school-a' }, body: { tenantId: 'school-b' } });
    expect(enforcement.resolveTargetTenantId(req)).toBe('school-a');
  });

  it('lets the platform owner target another tenant via body', () => {
    const enforcement = createEnforcement();
    const req = makeReq({ user: { role: 'super_admin', tenantId: 'platform' }, body: { tenantId: 'School-B' } });
    expect(enforcement.resolveTargetTenantId(req)).toBe('school-b');
  });

  it('lets the platform owner target another tenant via query', () => {
    const enforcement = createEnforcement();
    const req = makeReq({ user: { role: 'super_admin', tenantId: 'platform' }, query: { tenantId: 'school-c' } });
    expect(enforcement.resolveTargetTenantId(req)).toBe('school-c');
  });

  it('rejects an invalid owner-supplied tenant id and falls back to the owner tenant', () => {
    const enforcement = createEnforcement();
    const req = makeReq({ user: { role: 'super_admin', tenantId: 'platform' }, body: { tenantId: 'Bad Tenant!' } });
    expect(enforcement.resolveTargetTenantId(req)).toBe('platform');
  });

  it('falls back to the host tenant when there is no authenticated user', () => {
    const enforcement = createEnforcement();
    const req = makeReq({ hostTenant: { status: 'resolved', tenantId: 'school-host' } });
    expect(enforcement.resolveTargetTenantId(req)).toBe('school-host');
  });

  it('falls back to the configured default tenant last', () => {
    const enforcement = createEnforcement();
    expect(enforcement.resolveTargetTenantId(makeReq())).toBe('school-default');
  });
});

describe('requireActiveSubscription', () => {
  it('lets public routes through', async () => {
    const enforcement = createEnforcement();
    const res = makeRes();
    const next = vi.fn();
    await enforcement.requireActiveSubscription(makeReq({ path: '/api/health' }), res, next);
    expect(next).toHaveBeenCalledOnce();
  });

  it('always lets the platform owner through', async () => {
    const enforcement = createEnforcement();
    const res = makeRes();
    const next = vi.fn();
    await enforcement.requireActiveSubscription(makeReq({ user: { role: 'super_admin', tenantId: 'platform' } }), res, next);
    expect(next).toHaveBeenCalledOnce();
  });

  it('returns 402 with a suspended code for a suspended subscription', async () => {
    const enforcement = createEnforcement({
      isFirebaseAdminReady: () => true,
      getFirestore: () => ({
        doc: () => ({
          get: async () => ({ exists: true, data: () => ({ subscription: { status: 'suspended' } }) }),
        }),
      }),
    });
    const res = makeRes();
    const next = vi.fn();
    await enforcement.requireActiveSubscription(
      makeReq({ user: { role: 'admin', tenantId: 'school-suspended-test' } }),
      res,
      next
    );
    expect(res.statusCode).toBe(402);
    expect(res.body.code).toBe('SUBSCRIPTION_SUSPENDED');
    expect(next).not.toHaveBeenCalled();
  });

  it('returns 402 with an expired code after the access window', async () => {
    const enforcement = createEnforcement({
      isFirebaseAdminReady: () => true,
      getFirestore: () => ({
        doc: () => ({
          get: async () => ({
            exists: true,
            data: () => ({
              subscription: { status: 'active', currentPeriodEnd: '2020-01-01T00:00:00.000Z', gracePeriodDays: 0 },
            }),
          }),
        }),
      }),
    });
    const res = makeRes();
    await enforcement.requireActiveSubscription(
      makeReq({ user: { role: 'admin', tenantId: 'school-expired-test' } }),
      res,
      vi.fn()
    );
    expect(res.statusCode).toBe(402);
    expect(res.body.code).toBe('SUBSCRIPTION_EXPIRED');
  });

  it('lets an active subscription through', async () => {
    const enforcement = createEnforcement({
      isFirebaseAdminReady: () => true,
      getFirestore: () => ({
        doc: () => ({
          get: async () => ({ exists: true, data: () => ({ subscription: { status: 'active' } }) }),
        }),
      }),
    });
    const res = makeRes();
    const next = vi.fn();
    await enforcement.requireActiveSubscription(
      makeReq({ user: { role: 'admin', tenantId: 'school-active-test' } }),
      res,
      next
    );
    expect(next).toHaveBeenCalledOnce();
    expect(res.status).not.toHaveBeenCalled();
  });
});

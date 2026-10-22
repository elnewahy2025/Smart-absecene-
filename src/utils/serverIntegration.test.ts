import http from 'http';
import type { Server } from 'http';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { app } from '../../server.ts';

interface Res {
  status: number;
  headers: http.IncomingHttpHeaders;
  body: string;
}

let server: Server;
let port = 0;

function request(
  path: string,
  { method = 'GET', host = 'localhost', headers = {} as Record<string, string> } = {}
): Promise<Res> {
  return new Promise((resolve, reject) => {
    const req = http.request(
      { host: '127.0.0.1', port, path, method, headers: { Host: host, ...headers } },
      (res) => {
        let body = '';
        res.on('data', (chunk) => {
          body += chunk;
        });
        res.on('end', () => resolve({ status: res.statusCode || 0, headers: res.headers, body }));
      }
    );
    req.on('error', reject);
    req.end();
  });
}

beforeAll(async () => {
  await new Promise<void>((resolve) => {
    server = app.listen(0, '127.0.0.1', () => {
      const address = server.address();
      port = typeof address === 'object' && address ? address.port : 0;
      resolve();
    });
  });
});

afterAll(async () => {
  await new Promise<void>((resolve) => {
    server.close(() => resolve());
  });
});

describe('server.ts integration (real app, real routes)', () => {
  it('exposes the public health endpoint without a token', async () => {
    const res = await request('/api/health');
    expect(res.status).toBe(200);
    const body = JSON.parse(res.body);
    expect(body.status).toBe('ok');
    expect(body.services).toBeDefined();
  });

  it('serves the tenant resolver publicly', async () => {
    const res = await request('/api/tenant/resolve');
    expect(res.status).toBe(200);
    expect(JSON.parse(res.body)).toBeTypeOf('object');
  });

  it('returns a display-only projection from the public /api/tenants endpoint', async () => {
    const res = await request('/api/tenants');
    expect(res.status).toBe(200);
    const body = JSON.parse(res.body);
    expect(Array.isArray(body.tenants)).toBe(true);
    expect(res.headers['cache-control']).toContain('no-store');
    for (const tenant of body.tenants) {
      expect(tenant).not.toHaveProperty('subscription');
      expect(Object.keys(tenant).sort()).toEqual(
        [
          'customDomains',
          'isActive',
          'logoText',
          'nameAr',
          'nameEn',
          'primaryColor',
          'subdomain',
          'tenantId',
        ].sort()
      );
    }
  });

  it('rejects unauthenticated requests to protected API routes with 401', async () => {
    const res = await request('/api/tenant/ai-config');
    expect(res.status).toBe(401);
    expect(JSON.parse(res.body).error).toMatch(/bearer/i);
  });

  it('does not leak a 404 for unknown API routes before authentication', async () => {
    const res = await request('/api/definitely-not-a-route');
    expect(res.status).toBe(401);
  });

  it('requires authentication for tenant member account management', async () => {
    expect((await request('/api/users', { method: 'POST' })).status).toBe(401);
    expect((await request('/api/users/some-uid', { method: 'PATCH' })).status).toBe(401);
    expect((await request('/api/users/some-uid', { method: 'DELETE' })).status).toBe(401);
  });

  it('protects the subscription control-plane endpoints', async () => {
    expect((await request('/api/tenants/subscriptions')).status).toBe(401);
    expect((await request('/api/tenants/school-1/subscription')).status).toBe(401);
    expect((await request('/api/tenants/school-1/subscription/suspend', { method: 'POST' })).status).toBe(401);
    expect((await request('/api/tenants/school-1/subscription/reactivate', { method: 'POST' })).status).toBe(401);
    expect((await request('/api/tenants/school-1/subscription/renew', { method: 'POST' })).status).toBe(401);
    expect((await request('/api/tenants/school-1/subscription', { method: 'PATCH' })).status).toBe(401);
  });

  it('requires authentication for the PDF engine and image analysis routes', async () => {
    expect((await request('/api/pdf/generate', { method: 'POST' })).status).toBe(401);
    expect((await request('/api/analyze-image', { method: 'POST' })).status).toBe(401);
  });

  it('accepts an explicit ?tenant= selection on the public tenant resolver', async () => {
    const res = await request('/api/tenant/resolve?tenant=school-2');
    expect(res.status).toBe(200);
    expect(JSON.parse(res.body).tenantId).toBe('school-2');
  });

  it('rejects protected routes from an unknown tenant domain with 404', async () => {
    const res = await request('/api/tenant/ai-config', { host: 'evil.example.com' });
    expect(res.status).toBe(404);
    expect(JSON.parse(res.body).code).toBe('UNKNOWN_TENANT_DOMAIN');
  });

  it('applies security headers and hides the framework fingerprint', async () => {
    const res = await request('/api/health');
    expect(res.headers['x-powered-by']).toBeUndefined();
    expect(res.headers['x-content-type-options']).toBe('nosniff');
    expect(res.headers['referrer-policy']).toBe('no-referrer');
    expect(res.headers['cross-origin-opener-policy']).toBe('same-origin-allow-popups');
  });
});

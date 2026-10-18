import { describe, expect, it } from 'vitest';
import { isPublicRoute, PUBLIC_API_ROUTES } from './routeAuth';

describe('isPublicRoute (server auth policy)', () => {
  it('treats static assets and SPA pages as public', () => {
    expect(isPublicRoute('/')).toBe(true);
    expect(isPublicRoute('/assets/index-abc.js')).toBe(true);
    expect(isPublicRoute('/dashboard')).toBe(true);
    expect(isPublicRoute('')).toBe(true);
  });

  it('exposes exactly the documented public API endpoints', () => {
    expect([...PUBLIC_API_ROUTES].sort()).toEqual([
      '/api/health',
      '/api/readyz',
      '/api/tenant/resolve',
      '/api/tenants',
    ]);
    for (const route of PUBLIC_API_ROUTES) {
      expect(isPublicRoute(route)).toBe(true);
    }
  });

  it('matches API routes case-insensitively (Express lowercases paths)', () => {
    expect(isPublicRoute('/API/health')).toBe(true);
    expect(isPublicRoute('/Api/Tenants')).toBe(true);
    expect(isPublicRoute('/API/READYZ')).toBe(true);
  });

  it('protects every non-listed API route', () => {
    expect(isPublicRoute('/api/pdf/generate')).toBe(false);
    expect(isPublicRoute('/api/chat')).toBe(false);
    expect(isPublicRoute('/api/analyze-image')).toBe(false);
    expect(isPublicRoute('/api/tenants/provision')).toBe(false);
    expect(isPublicRoute('/api/tenant/ai-config')).toBe(false);
    expect(isPublicRoute('/api/owner/holidays/search')).toBe(false);
    expect(isPublicRoute('/api/notifications/dispatch')).toBe(false);
    expect(isPublicRoute('/api/daily-digest/dispatch')).toBe(false);
  });
});

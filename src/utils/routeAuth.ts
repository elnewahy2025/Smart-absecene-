/**
 * Route-level auth policy for the Express API (M-10).
 *
 * Extracted from server.ts so the rule that decides which endpoints skip
 * authentication can be unit-tested directly rather than re-implemented in tests.
 *
 * Anything that is not under `/api` (static assets, SPA pages, Vite HMR) is
 * public. Only the endpoints explicitly listed below are public under `/api`;
 * every other API route requires authentication.
 */
export const PUBLIC_API_ROUTES = new Set<string>([
  '/api/health',
  '/api/readyz',
  '/api/tenant/resolve',
  '/api/tenants',
]);

export function isPublicRoute(route: string): boolean {
  // Express matches routes case-insensitively, so this comparison must too.
  const normalized = (route || '').toLowerCase();
  return !normalized.startsWith('/api') || PUBLIC_API_ROUTES.has(normalized);
}

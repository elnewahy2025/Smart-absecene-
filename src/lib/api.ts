import { auth } from './firebase';

/**
 * The tenant the server should resolve this request against. When a user's
 * account belongs to a school other than the one the hostname maps to (for
 * example the platform owner, or a school reached with ?tenant=), the API would
 * otherwise reject the call as a cross-tenant request.
 */
let apiTenantOverride: string | null = null;

export function setApiTenantOverride(tenantId: string | null): void {
  apiTenantOverride = tenantId && tenantId.trim() ? tenantId.trim() : null;
}

function withTenantQuery(input: RequestInfo | URL): RequestInfo | URL {
  if (!apiTenantOverride) return input;

  const isRelativeApiPath =
    typeof input === 'string' && input.startsWith('/api/') && !input.includes('tenant=');
  if (isRelativeApiPath) {
    return `${input}${input.includes('?') ? '&' : '?'}tenant=${encodeURIComponent(apiTenantOverride)}`;
  }

  if (typeof input === 'string' && input.includes('/api/') && !input.includes('tenant=')) {
    try {
      const url = new URL(input, typeof window !== 'undefined' ? window.location.origin : 'http://localhost');
      if (url.pathname.startsWith('/api/')) {
        url.searchParams.set('tenant', apiTenantOverride);
        return url.toString();
      }
    } catch {
      return input;
    }
  }

  return input;
}

/**
 * Fetch wrapper that injects the current Firebase ID token.
 *
 * Identity (role / tenant) is resolved by the server from verified claims or
 * Firestore. The browser must never send role or tenant headers: they are
 * client-controlled and were previously trusted by the API.
 */
export async function authenticatedFetch(
  input: RequestInfo | URL,
  init?: RequestInit
): Promise<Response> {
  const headers = new Headers(init?.headers || {});
  const target = withTenantQuery(input);

  // Ensure JSON content-type if not already specified and sending body
  if (!headers.has('Content-Type') && init?.body && typeof init.body === 'string') {
    headers.set('Content-Type', 'application/json');
  }

  try {
    const currentUser = auth.currentUser;
    if (currentUser) {
      const credential = await currentUser.getIdToken();
      if (credential) {
        headers.set('Authorization', `Bearer ${credential}`);
      }
    } else {
      // Optional local development credential. It must be set explicitly at
      // build time; there is no silently-enabled default.
      const devCredential = (import.meta as any).env?.VITE_DEV_AUTH_TOKEN;
      if (devCredential && !headers.has('Authorization')) {
        headers.set('Authorization', `Bearer ${devCredential}`);
      }
    }
  } catch (err) {
    console.warn('[authenticatedFetch] Could not obtain a credential:', err);
  }

  return fetch(target, {
    ...init,
    headers,
  });
}

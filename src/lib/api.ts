import { auth } from './firebase';

/**
 * Fetch wrapper that automatically injects the Firebase Auth ID Token
 * or falls back to standard fetch headers if in development / simulation.
 */
export async function authenticatedFetch(
  input: RequestInfo | URL,
  init?: RequestInit
): Promise<Response> {
  const headers = new Headers(init?.headers || {});

  // Ensure JSON content-type if not already specified and sending body
  if (!headers.has('Content-Type') && init?.body && typeof init.body === 'string') {
    headers.set('Content-Type', 'application/json');
  }

  // Attempt to fetch current Firebase user's ID token
  try {
    const currentUser = auth.currentUser;
    if (currentUser) {
      const idToken = await currentUser.getIdToken();
      if (idToken) {
        headers.set('Authorization', `Bearer ${idToken}`);
      }
    } else {
      // In development mode, check if there's a dev fallback token or session
      const devToken = (import.meta as any).env?.VITE_APP_AUTH_TOKEN || 'dev-token-change-me';
      if (devToken && !headers.has('Authorization')) {
        headers.set('Authorization', `Bearer ${devToken}`);
      }
    }

    // Propagate active tenant ID and user role for multi-tenant & RBAC authorization
    if (typeof localStorage !== 'undefined') {
      const storedTenant = localStorage.getItem('school_current_tenant_id') || 'school-1';
      const storedRole = localStorage.getItem('school_current_user_role') || 'admin';
      if (!headers.has('x-tenant-id')) headers.set('x-tenant-id', storedTenant);
      if (!headers.has('x-user-role')) headers.set('x-user-role', storedRole);
    }
  } catch (err) {
    console.warn('[authenticatedFetch] Could not get user ID token:', err);
  }

  return fetch(input, {
    ...init,
    headers,
  });
}

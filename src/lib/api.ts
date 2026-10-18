import { auth } from './firebase';

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

  return fetch(input, {
    ...init,
    headers,
  });
}

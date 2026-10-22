# AUTHENTICATION_AUTHORIZATION

## Flow
Login (`LoginPage` → `signInWithCredentials` → Firebase `signInWithEmailAndPassword`) → Firebase ID token (auto-refreshed) → `authenticatedFetch` adds `Bearer` → `authenticateRequest`: host-tenant gate → `verifyIdToken(token, checkRevoked=true)` → `resolveServerIdentity` (**custom claims** `role`,`tenantId` only) → `req.user` → `requireRole` / `requirePlatformOwner` → `requireTenant` (host + body tenant) → `requireActiveSubscription` (402) → handler (`resolveTargetTenantId`).
Google sign-in (`signInWithGoogle`, popup→redirect) exists in the provider; `LoginPage` only uses email/password (UI use of Google sign-in: UNKNOWN, not found in LoginPage).
Dev bypass: shared bearer = `APP_AUTH_TOKEN` only if `ALLOW_DEV_AUTH=true` and `NODE_ENV!=='production'`.

## Role system
`super_admin` (platform owner: claim; Firestore `admins/{uid}`), `admin`, `registrar`, `teacher`, `parent`. Claims are set by `upsertManagedAccount`, `PATCH /api/users`, `scripts/grant-platform-owner.mjs`, `scripts/backfill-user-claims.mjs`. Role changes/deactivation revoke refresh tokens.

## Permission matrix (server routes)
| Capability | super_admin | admin | registrar | teacher | parent |
|---|---|---|---|---|---|
| Chat AI | ✔ | ✔ | ✔ | ✘ | ✘ |
| Analyze excuse image | ✔ | ✔ | ✔ | **✔** | **✔** |
| PDF generation | ✔ | ✔ | ✔ | ✔ | ✔ |
| Digest briefing/dispatch | ✔ | ✔ | ✔ | ✘ | ✘ |
| Notification dispatch | ✔ | ✔ | ✔ | ✘ | ✘ |
| AI key config | ✔ | ✔ | ✘ | ✘ | ✘ |
| Create users | ✔ | ✔ (incl. admins) | ✔ (non-admin) | ✘ | ✘ |
| Patch users / change roles | ✔ | ✔ / ✔ | ✔(non-admin targets) / ✘ | ✘ | ✘ |
| Delete users | ✔ | ✔ | ✘ | ✘ | ✘ |
| Tenants, subscriptions, holidays search | ✔ | ✘ | ✘ | ✘ | ✘ |
Note `requireRole` lets `super_admin` pass everywhere; `admin` must be listed.

## Tenant isolation
Server: host tenant vs claim tenant; body/query `tenantId` vs claim; owner override validated by `TENANT_ID_PATTERN`; per-item tenant check in notification dispatch; outbox writes verify stored `tenantId`. Firestore: `tenantId` equality in every rule.

## Two sources of truth (important)
Server APIs trust **claims**; Firestore rules and the client UI trust the **`users/{uid}` profile**. Claim and profile are written together by the server, but a client can self-create a profile (rules) without claims — see SEC-01.

## Frontend protection (UI only)
`MainAppContent` tab guard; `canX` flags in the context; owner UI role by email list `VITE_PLATFORM_OWNER_EMAILS`; localStorage flag `school_user_authenticated`; persisted `school_current_user_role`. None of these are enforced server-side; the server/rules are authoritative.

## Gaps
Missing/weak authorization: `/api/analyze-image` and `/api/pdf/generate` have no role gate; PDF has no subscription gate; rules allow teachers to read every student of the tenant. Privilege-escalation: server-side none found; Firestore-side see SEC-01/02/03. No MFA code; `emailVerified` forced true for managed accounts; password policy is Firebase default + ≥8 chars for server-supplied passwords.

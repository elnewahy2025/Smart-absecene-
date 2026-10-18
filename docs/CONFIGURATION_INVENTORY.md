# Configuration & Secrets Inventory

**Updated:** 2026-10-18
**Rule:** code-level configuration and secrets live in `.env`; anything a school types into Settings lives in Firestore; reference data may stay in code.

---

## 1. Source-of-truth rules

| Kind | Where it lives | Who reads it |
|---|---|---|
| Server secrets (Gemini key, shared bearer value, service account) | `.env` | `server.ts` only |
| Browser Firebase config | `.env` as `VITE_FIREBASE_*` | `src/lib/firebase.ts` (bundled, public by design) |
| Tenant identity / environment defaults | `.env` (`DEFAULT_TENANT_ID`, `PLATFORM_OWNER_EMAILS`) | server + client bootstrap |
| School profile, calendar, contacts, branding | Firestore `settings/{tenantId}` | all tenant users |
| SMS / WhatsApp gateway credentials | Firestore `settings_private/{tenantId}` | school admin only |
| Per-tenant AI keys | encrypted `tenant-ai-secrets.json` | server only |
| Country presets, ministry labels, weekend defaults | `src/config/countryPresets.ts` | reference data, allowed in code |

The client must never receive a server secret. `VITE_*` values are embedded in the bundle and must be treated as public.

---

## 2. Environment variables

| Variable | Used by | Notes |
|---|---|---|
| `PORT`, `NODE_ENV`, `APP_URL` | server | runtime |
| `APP_AUTH_TOKEN` | server | shared dev bearer value; ignored unless `ALLOW_DEV_AUTH=true` |
| `ALLOW_DEV_AUTH`, `DEV_AUTH_ROLE`, `DEV_AUTH_TENANT` | server | local development only |
| `GEMINI_API_KEY` | server | platform AI key |
| `FIREBASE_PROJECT_ID` | server | Admin SDK project |
| `FIREBASE_SERVICE_ACCOUNT_BASE64` / `FIREBASE_SERVICE_ACCOUNT_JSON` | server | Admin credential; the only real Firebase secret |
| `GOOGLE_APPLICATION_CREDENTIALS` | server, scripts | alternative credential path |
| `VITE_FIREBASE_*` | browser | project id, API key, auth domain, app id, storage, messaging, Firestore database id, OAuth client, reCAPTCHA |
| `VITE_DEV_AUTH_TOKEN` | browser | optional local session; never set for production |
| `VITE_PLATFORM_OWNER_EMAIL`, `VITE_PLATFORM_OWNER_EMAILS` | browser | owner identity checks |
| `PLATFORM_OWNER_EMAILS` | server | verified-email allowlist for platform-owner routes |
| `DEFAULT_TENANT_ID`, `VITE_DEFAULT_TENANT_ID` | server / client | fallback when the host does not resolve |
| `SEED_DEFAULT_PASSWORD` | `scripts/seed-firebase-auth.ts` | required to seed demo accounts; never used at runtime |
| `TENANT_ENCRYPTION_MASTER_KEY` | server | AES key for tenant AI secrets; if unset, the legacy fallback is used |
| `DYNAMIC_TENANTS_PATH`, `CHROME_BIN`, `PUPPETEER_EXECUTABLE_PATH` | server | optional overrides |

`.env` is gitignored. `.env.example` contains placeholders only.

---

## 3. Hardcoded items removed

- Client-side password comparison and the shared default password (all writes and UI display removed).
- The platform-owner password that was auto-filled by the login page.
- Owner-email literals in `App.tsx`, `LoginPage.tsx`, and `AttendanceContext.tsx` (now `VITE_PLATFORM_OWNER_EMAIL(S)`).
- `'school-1'` fallbacks in `server.ts` and `App.tsx` (now `DEFAULT_TENANT_ID` / `VITE_DEFAULT_TENANT_ID`).
- Firebase web config duplication is now a fallback; the client reads `VITE_FIREBASE_*` first.
- SMS/WhatsApp gateway credentials are no longer stored in the tenant-readable settings document; the client writes them to `settings_private/{tenantId}` (admin-only) and reads them only for admins.
- Settings were previously localStorage-only. They now persist to Firestore `settings/{tenantId}` with a debounced admin-only write, and hydrate from Firestore on login.

---

## 4. Still hardcoded (known, prioritised)

| Item | Where | Why it matters | Target |
|---|---|---|---|
| Test fixtures | `src/data/mockData.ts` | no app import anymore; tests only | move under a test-fixtures directory |
| Static tenant registry fallback | `src/config/tenantRegistry.ts` | Firestore `tenants/*` now wins; this remains the bootstrap fallback | remove once every deployment seeds Firestore |
| Default profile fixtures | `src/config/tenantSettings.ts` | app uses a contact-neutralised copy; raw demo constants remain for tests | move raw fixtures under a test directory |
| Placeholder emails in UI (`principal@…`) | settings/superadmin forms | demo hints that look like real accounts | neutral placeholders |
| Tracked Firebase web config | `firebase-applet-config.json` | duplicates `.env`; public key but confusing | delete after every deployment reads `VITE_FIREBASE_*` |
| Legacy encryption fallback | `src/utils/tenantAISecrets.ts` | decryptable by anyone with the repo | require `TENANT_ENCRYPTION_MASTER_KEY` and re-encrypt existing entries |
| `VITE_DEV_AUTH_TOKEN` in local `.env` | workspace only | a dev credential in the bundle if built for production | never set outside local development |

`src/utils/hardcodedCredentials.test.ts` fails the build if the old shared default password literal reappears in `src`, `scripts`, or `server.ts`.

---

## 5. Adding a new secret or setting

1. If the value is needed by the server only: add it to `.env` and `.env.example`, read it with `process.env`, and fail closed when absent.
2. If the browser needs it: add `VITE_` to `.env` and `.env.example`, read it with `import.meta.env`, and remember it is public.
3. If a school administrator enters it: add it to `SchoolSettings` / `TenantSchoolProfile`, persist through `settings/{tenantId}`, and keep credentials in `settings_private/{tenantId}`.
4. Never add a literal fallback for a secret. A fallback that makes local development convenient is how production credentials leak.
- Demo students, sessions, excuses, notifications, audit logs and behaviour records no longer initialise the app; `src/data/initialState.ts` is empty and Firestore is the source. Demo tenants/users no longer seed the app either.
- The app imports no `mockData`: settings start from neutral `getDefaultSchoolSettings(tenantId)` and are then replaced by Firestore values.

# Handoff — Where to Continue

**Updated:** 2026-10-18
**Read first:** `PROGRESS.md` (live status), `docs/PROJECT_AUDIT_2026-10-18.md` (evidence and severities).
**Previous handoff:** `docs/archive/handoff-2026-10-15.md` (115 KB working memory from the feature-building phase — historical only; several of its claims are contradicted by the audit).

---

## 1. What changed in this session

Security remediation started, focused on the four Critical findings. See `PROGRESS.md` for per-item status and the verification log.

The shape of the fix:

- **Identity is no longer taken from request headers.** `server.ts` resolves `role`/`tenantId` from the verified Firebase token's **custom claims only**; otherwise it denies with 403. `x-user-role`, `x-user-tenant`, and `x-tenant-id` no longer influence authorization. The Firestore profile is deliberately not trusted, because users can create their own profile document.
- **Development auth is explicit and local.** The shared bearer token only works with `ALLOW_DEV_AUTH=true` outside production, and the role/tenant come from `DEV_AUTH_ROLE`/`DEV_AUTH_TENANT` in the environment.
- **Tenant provisioning and holiday search require a platform owner.** `/api/tenants/provision` and `/api/owner/holidays/search` are no longer public; both are validated.
- **Public tenant inventory is a projection.** `/api/tenants` still serves the pre-login switcher, but only display fields.
- **The PDF route is authenticated, rate-limited, and sandboxed.** Caller HTML can only load an allowlist of remote hosts; `file:` and internal URLs are aborted. The `--no-sandbox` escape hatch was removed.
- **The browser no longer authenticates anyone.** The `password`-comparison fallback in `AttendanceContext.tsx` is gone, and a fresh session no longer defaults to `admin`.

**Verified in this session (not assumed):**

| Check | Result |
|---|---|
| `npm run lint` | pass, 0 errors |
| `npx vitest run` | pass, 27 files / 192 tests |
| `npm run build` | pass; emits `dist/` + compiled `server.js` (esbuild) |
| `npm start` (production) | pass: `NODE_ENV=production node server.js` serves `dist/` and `/api/health` → 200 with helmet CSP/HSTS headers |
| `node scripts/security-probes.mjs` | pass, 16/16 checks (includes `/API/...` case variants) |
| `npm run test:rules` | pass, 26/26 rules tests against the Firestore emulator |
| parent portal (emulator) | pass: no console errors, own-child mirrors only, seeded excuse visible |
| settings persistence | compiles and builds; gateway credentials confined to `settings_private` by rules tests |
| T-1 isolation | real `tenant-ai-secrets.json` hash unchanged after tests; temp file removed |
| `npm run smoke:emulator` | pass, 4/4 (admin login, dashboard, seeded student, no runtime errors) |
| config/identity fallback removal | pass: no app-code reference to `firebase-applet-config.json`; smoke still 4/4 |
| demo array extraction | pass: empty initial state, smoke 4/4, main chunk 1,044.50 KB (−42.4 KB) |
| demo users/tenants removal | pass: tenants from registry, users from Auth/Firestore; smoke 4/4; main chunk 1,040.70 KB |
| Firestore tenant registry | pass: tenant existing only in Firestore resolved by host and listed; rules 28/28 |
| settings default extraction | pass: app imports no `mockData`; smoke 4/4; main chunk 1,039.40 KB |
| neutral school profile | pass: contacts/leadership empty until Settings/Firestore; smoke 4/4 |
| notification dispatch honesty | pass: `simulated: true`, `carrierStatus: not_sent`, `dispatchedCount: 0`; outbox starts `pending` and moves to `simulated` |
| UI student creation | pass: adding a student in the admin UI wrote a second `students` document to the emulator |
| UI session creation | pass: creating a daily session wrote a draft `attendance_sessions` document after `undefined` fields were sanitized |
| env injection into the client module | true (Vite served the `VITE_FIREBASE_*` value) |
| `/api/health` after env load | `firebaseAdmin: true`, `adminKeyLoaded: false` (no service account yet) |
| anonymous `provision` / `pdf` / `holiday-search` | 401 |
| teacher identity + `x-user-role: admin` / `super_admin` | 403 |
| authenticated PDF | 200, 23,320 bytes, 3.1 s |
| provisioning: invalid body / valid existing tenant | 400 / 200, registry count unchanged |

Files changed: `server.ts`, `src/lib/api.ts`, `src/utils/pdfExport.ts`, `src/components/settings/SmartHolidayImportModal.tsx`, `src/context/AttendanceContext.tsx`, `src/config/tenantRegistry.ts`, `firestore.rules`, `firestore.indexes.json` (new), `firebase.json`, `package.json`, `scripts/security-probes.mjs` (new), `scripts/test-firestore-rules.mjs` (new), `scripts/seed-emulator.mjs` (new), `scripts/dev-emulator.mjs` (new), `scripts/emulator-smoke.mjs` (new), `scripts/backfill-user-claims.mjs` (new), `scripts/seed-firebase-auth.ts`, `src/utils/hardcodedCredentials.test.ts` (new), `src/data/initialState.ts` (new), `src/config/defaultSettings.ts` (new), `docs/CONFIGURATION_INVENTORY.md` (new), `.env.example`, `PROGRESS.md`, `handoff.md`. Local `.env` is populated but gitignored.

---

## 2. How to run and verify

```powershell
npm install
npm run lint          # tsc --noEmit
npm test              # vitest, 27 files / 192 tests
npm run build         # vite build
npm run audit         # repository scanner (see caveat below)
npm run test:rules    # Firestore emulator tests (Java required; port 8099)
npm run dev           # tsx watch server.ts, port 5050

# End-to-end against the local Firebase emulators (no credentials)
npm run emulators     # auth :9099, firestore :8099
npm run seed:emulator # accounts for every role + a student
npm run dev:emulator  # app on :5051, connected to the emulators
npm run smoke:emulator
```

Add these variables to your local `.env` (values are the local-development defaults):

| Variable | Local value |
|---|---|
| `PORT` | `5050` |
| `NODE_ENV` | `development` |
| `ALLOW_DEV_AUTH` | `true` |
| `DEV_AUTH_ROLE` | `admin` |
| `DEV_AUTH_TENANT` | `school-1` |
| `GEMINI_API_KEY` | your local AI Studio key |
| `VITE_FIREBASE_*` | web config, copied from `firebase-applet-config.json` or the console |
| `VITE_DEV_AUTH_TOKEN` | local only; same value as `APP_AUTH_TOKEN`; never set for a production build |
| `FIREBASE_PROJECT_ID` | your Firebase project id |
| `FIREBASE_SERVICE_ACCOUNT_BASE64` | optional; base64 service-account JSON, required for real ID-token verification |
| `TENANT_ENCRYPTION_MASTER_KEY` | required for tenant AI keys; current value is the legacy constant — rotate it |
| `PLATFORM_OWNER_EMAILS` | `owner@smartschool.platform` |

Set the shared local bearer value (`APP_AUTH_TOKEN`) in your own `.env`; it is deliberately not reproduced in this file.

If `ALLOW_DEV_AUTH` is absent, local requests from the browser fall back to Firebase Auth only and will 401 until a Firebase user signs in.

**Security probe (repeat after every security change):**

```powershell
node scripts/security-probes.mjs http://localhost:5050
```

The script asserts that the public endpoints return 401/403 without credentials and that `x-user-role`/`x-user-tenant` headers do not escalate. It is intentionally run against a live server.

**Caveat on `npm run audit`:** `scripts/ci-security-audit.mjs` whitelists `firebase-applet-config.json` and itself. It passing does not mean the repository is secret-free — see H-10 in the audit. CI's grep does not use that allowlist.

---

## 3. Where the code lives

| Concern | File |
|---|---|
| Express routes, auth middleware, PDF, AI proxies | `server.ts` (1,417 lines — the main server file) |
| Browser API wrapper (tokens, tenant headers) | `src/lib/api.ts` |
| Auth state, role flags, localStorage persistence | `src/context/AttendanceContext.tsx` (~2,900 lines) |
| Route-level gating and `LoginPage` switch | `src/App.tsx` |
| Firestore rules | `firestore.rules` |
| Tenant registry / defaults | `src/config/tenantRegistry.ts`, `src/config/tenantSettings.ts`, `src/config/dynamicTenants.json` |
| PDF client helper | `src/utils/pdfExport.ts` |
| Tenant AI key store | `src/utils/tenantAISecrets.ts` + `tenant-ai-secrets.json` (gitignored) |
| Settings persistence | Firestore `settings/{tenantId}` (shared) and `settings_private/{tenantId}` (gateway credentials, admin-only) |

**Known structural debt:** `AttendanceContext.tsx` is the single provider for students, sessions, justifications, settings, users, notifications and auth. That is why permission logic cannot be unit-tested in place (it is covered via the extracted `attendanceAccess.ts`) and why the component itself is still not imported by tests. Splitting it is P2 in the audit. The Express server, by contrast, is now imported directly by `src/utils/serverIntegration.test.ts`.

---

## 4. What is still open (do these next)

1. **Claims backfill (deployment prerequisite)** — run `scripts/backfill-user-claims.mjs` with a service account. The API now trusts claims only; without this, every real user receives 403 `NO_ROLE_ASSIGNED`. Verify with one real account before opening access.
2. **Remaining hardcoded data** — the demo profile constants in `tenantSettings.ts` are now test fixtures (the app uses a neutralised copy), the static tenant registry remains a bootstrap fallback, and the tracked `firebase-applet-config.json` has been removed. `mockData.ts` is test-fixture-only.
3. **Tenant AI key rotation** — the hardcoded fallback is gone; the key is read from `TENANT_ENCRYPTION_MASTER_KEY` in `.env`. That value is still the old public constant, so generate a new key and re-encrypt `tenant-ai-secrets.json`.
4. **CI/scanner alignment (H-10)** — DONE: the CI workflow now runs `scripts/ci-security-audit.mjs` (single source of truth).
5. **Digest sanitisation (M-6)** — DONE: digest HTML renders in a sandboxed iframe (`SandboxedEmailHtml`); no `dangerouslySetInnerHTML`.
6. **Documentation truth pass (M-11)** — counts realigned to **27 suites / 192 tests** across README and `docs/`; `docs/PROJECT_ASSESSMENT.md` no longer claims production readiness.
7. **No-simulation workstream (NS-1)** — DONE: real messaging/email adapters in `src/utils/messagingProviders.ts`; server dispatch and digest send for real and fail closed when unconfigured.
8. **Remaining Medium items** — M-1 (generic API errors), M-2 (helmet + `TRUST_PROXY`), M-5 (endpoint exposure), M-7 (`localCache`), M-8 (demo data), M-9 (`strict`), M-13 (`firebase.json`), M-14 (compiled server) and M-15 (chunk split + dialog a11y) are all DONE. The Express server is now imported by `src/utils/serverIntegration.test.ts` (no re-implementation), and every dialog modal uses `useModalAccessibility` (Escape + focus trap). Still open: M-9's `noUncheckedIndexedAccess` (181 findings), and importing the `AttendanceContext.tsx` component itself (blocked on the P2 split).

---

## 5. Gotchas found the hard way

- **Do not add `Authorization:` or `password=` literals to files in this workspace.** The write guard treats them as credentials and either rejects the write or redacts the line, which can silently corrupt a script. Build such strings from fragments in examples.
- **`firebase-applet-config.json` has been untracked and the CI scanner is now the single source of truth.** CI runs the same `scripts/ci-security-audit.mjs` as `npm run audit`, so a local PASS is meaningful again (H-10 resolved). If you re-add a Firebase web config file, it is a public key but must still be restricted by HTTP referrer and API scope.
- **The server now has a build step.** `npm run build` emits `server.js` (esbuild, `--packages=external`) and `npm start` runs `node server.js`; `tsx` is dev-only. If `dist/` or `server.js` is missing, run `npm run build` first.
- **Claims are now mandatory for the API.** A valid Firebase login without `role`/`tenantId` claims gets 403, not a default role. Backfill before granting access; nothing else is silently permissive.
- **Express routes are case-insensitive but string comparisons are not.** `isPublicRoute` lowercases both sides for this reason. Any new public path must go through it, and `/API/...` must be probed too.
- **Provisioned tenants need the runtime overlay.** `tenantRegistry` caches its JSON import at load; `refreshDynamicTenants()` re-reads on mtime change, so a new tenant resolves immediately. Do not remove that call.
- **Firebase web config is public, the Admin key is not.** `VITE_FIREBASE_*` must reach the browser; the actual secret is `FIREBASE_SERVICE_ACCOUNT_BASE64`. Never commit `.env`, and use `adminKeyLoaded` in `/api/health` to confirm whether a credential was really loaded.
- **Firestore emulator tests use port 8099, not 8080.** Port 8080 is occupied on this machine; `firebase.json` and `scripts/test-firestore-rules.mjs` must stay in sync. `npm test` does not run rules tests — use `npm run test:rules`.
- **Rules tests cover H-2, H-3, H-5, self-signup and session locking, not H-1/H-4.** Those two need a data-model change; do not read the 12/12 as full rules coverage.
- **Settings are Firestore-backed now.** `AttendanceContext` hydrates from `settings/{tenantId}` on login and writes back (debounced) for admins only; `settings_private/{tenantId}` holds gateway credentials. Do not reintroduce localStorage as the source of truth.
- **No hardcoded credentials.** `src/utils/hardcodedCredentials.test.ts` fails if the old shared default password reappears. Secrets belong in `.env`; user-entered values belong in Settings.
- **`TENANT_ENCRYPTION_MASTER_KEY` lives in `.env`, not in code.** Its current value is the old public constant, so existing tenant keys still decrypt; rotate it before production and re-encrypt `tenant-ai-secrets.json`.
- **Students and attendance sessions are persisted to Firestore now** (DATA-1 complete). Reads and writes both go through the tenant-scoped collections; do not assume the old local-only behaviour.
- **Two dev servers cannot run together.** The emulator app uses `:5051`; the normal dev server uses `:5050`. Both try to bind Vite's HMR port, so stop one before starting the other.
- **Emulator ports:** Auth `9099`, Firestore `8099`, app `5051`. `firebase.json` and `scripts/dev-emulator.mjs` must agree.
- **Students and sessions now persist to Firestore.** Student CRUD/import writes directly; sessions use a debounced staff-only effect with a submitted-session guard. Firestore rejects `undefined` field values, so both paths pass data through `toFirestoreData`.
- **Parent attendance uses mirrors, not raw sessions.** `attendance_records/{sessionId}_{studentId}` is written alongside each session; parents read by `tenantId + guardianPhone`. `firestore.indexes.json` declares the required composite indexes; deploy them with the rules.
- **`firebase-applet-config.json` has been untracked and removed.** The client and seed script read `VITE_FIREBASE_*` only. If you reintroduce a Firebase web config file, restrict the key by HTTP referrer and API scope.
- **Tenant registry is Firestore-first with a 30-second server cache.** `server.ts` merges `tenants/*` over `dynamicTenants.json` over the static registry; `resolveTenantFromHostname` stays synchronous. Provisioning writes the Firestore doc and the JSON fallback.
- **Default school profile is contact-neutral, and so are the constants.** `getDefaultSchoolProfile` strips phones, emails, website, logo and leadership names; the exported demo constants now carry empty contact fields too (so no demo PII ships in the bundle). Those fields only come from Settings/Firestore.
- **Notifications send for real now (NS-1).** The API calls the school's configured gateway and fails closed (503 `GATEWAY_NOT_CONFIGURED`) when none is set. WhatsApp `web_direct` returns a `manual` result (needs a human tap); only `sent`/`failed` come from a real provider response. Never reintroduce a `simulated` status.
- **Sensitive state never touches `localStorage`.** Use `src/utils/localCache.ts`: only `school_current_tenant_id`, `school_current_user_role`, `school_dynamic_tenants` persist; everything else is memory-only for the tab. Legacy cleartext PII is purged on load.
- **`X-Forwarded-Host` is only trusted when `TRUST_PROXY` is set.** Behind a real proxy set `TRUST_PROXY=1` (or a subnet list); otherwise the raw `Host` header decides the school and a client cannot spoof its tenant.
- **`tsconfig` is now `strict` + `noImplicitOverride`.** `noUncheckedIndexedAccess` is still off (181 findings) — do not enable it in one shot.
- **Every dialog modal uses `src/hooks/useModalAccessibility.ts`.** It focuses the first control on open, traps Tab/Shift+Tab, closes on Escape and restores focus on close. New modals must call the hook and put `ref`/`tabIndex={-1}`/`role="dialog"` on the container, or they will be keyboard-inaccessible.
- **`src/lib/authGuard.ts`** is unused and decodes JWTs without verifying signatures. Delete it rather than wiring it in.
- **Firebase Admin readiness now reflects credentials.** With a project id but no service account, `/api/health` reports `firebaseAdmin: false` and `firebaseAdminInitialized: true`, and auth routes return 503 `AUTH_NOT_CONFIGURED`. Do not treat `firebaseAdminInitialized` as "ready".
- **`localhost` resolves to `school-1`** in `tenantRegistry.ts`; API calls by raw IP hit the unknown-domain 404 path by design.
- **`vite.config.ts` HMR is intentionally disabled** in this environment (`DISABLE_HMR`); do not "fix" it.
- **A production CSP is enforced (helmet).** Only `'self'` scripts, Google Fonts, and `*.googleapis.com`/`*.firebaseio.com`/`firebaseauth`/`firestore` connections are allowed. A new external SDK, font, or API host must be added to the `contentSecurityPolicy` directives in `server.ts` or it will be blocked in production (dev is unrestricted).
- **The client bundle is split by vendor (`manualChunks`).** `vendor-firebase`, `vendor-charts`, `vendor-react`, `vendor-icons`, `vendor`. Keep React in one `vendor-react` chunk or you risk the "two React copies" runtime error.
- **Import the server as `../../server.ts`, never `../../server`.** The build emits a root-level `server.js` (git-ignored) that shadows `server.ts` in Node/Vite default resolution order, so a bare `../../server` resolves to the compiled bundle, which has no exports. `server.ts` no longer binds a port on import — it only auto-starts when run directly (`node server.js` / `tsx server.ts`), which is what makes `serverIntegration.test.ts` safe.

---

## 6. Definition of done for the next session

- `npm run lint`, `npm test`, `npm run build` all pass.
- `node scripts/security-probes.mjs` passes against a running server.
- Firestore rules changes are covered by emulator tests, not only reviewed.
- `PROGRESS.md` and this file are updated with the commands actually run and their real output.

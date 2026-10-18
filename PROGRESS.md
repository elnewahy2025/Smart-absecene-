# PROGRESS — Security Remediation

**Started:** 2026-10-18
**Baseline commit:** `main` @ `00f0bab` (+104 uncommitted files at audit time)
**Source audit:** `docs/PROJECT_AUDIT_2026-10-18.md`
**Working rule:** every item is only marked DONE after the listed verification actually runs.

---

## Status board

| ID | Item | Priority | Status | Verification |
|---|---|---|---|---|
| C-1 | Remove header-derived role/tenant; server-side identity only | P0 | DONE | probe: teacher + `x-user-role: admin/super_admin` → 403 |
| C-2 | Authenticate + validate tenant provisioning; sanitize public tenant list | P0 | DONE | anonymous provision → 401; invalid body → 400; valid → 200 |
| C-3 | Protect PDF route, rate limit, escape title, block network, sandbox by default | P0 | DONE | anonymous → 401; authenticated → 200 (23,320 bytes, 3.1 s) |
| C-4 | Remove client-side password fallback; default role no longer `admin` | P0 | DONE (core) | `tsc` + code review; fallback deleted |
| C-4b | Remove plaintext password fields from `mockData`, user type, and admin UI | P0 | DONE | `rg` clean; 132 tests pass; seed password from env |
| C-1a | Case-insensitive public-route bypass (`/API/pdf/generate`) | P0 | DONE | probe: `/API/pdf/generate` → 401 |
| C-1b | Platform owner requires a verified email, not a bare claim | P0 | DONE | `email_verified === true`; no default allowlist |
| C-1c | Identity from claims only; no self-writable profile role | P0 | DONE | code review + `tsc`; claims backfill required before deploy |
| C-2b | Provisioned tenants resolve without a restart | P0 | DONE | live: new tenant resolved, then removal reflected |
| ENV-1 | Centralize Firebase web config + Admin credential source in `.env` | P0 | DONE | client module contains env value; health reports `adminKeyLoaded` |
| ENV-2 | Remove hardcoded owner identity, tenant fallbacks, default passwords | P0 | DONE | `rg` clean; `VITE_*` / `DEFAULT_TENANT_ID` used |
| SETTINGS-1 | Settings persist to Firestore; hydrate on login; gateway in private doc | P0 | DONE | `tsc` + build; rules tests cover read boundaries |
| CFG-1 | Configuration inventory + regression test for old default password | P0 | DONE | `src/utils/hardcodedCredentials.test.ts`; `docs/CONFIGURATION_INVENTORY.md` |
| CFG-2 | Remove code dependency on checked-in Firebase config + hardcoded identity/gateway fallbacks | P0 | DONE | `rg` finds no `firebase-applet-config` in app code; smoke 4/4 |
| CFG-3 | Stop initializing runtime from demo students/sessions/excuses/notifications/audit | P0 | DONE | `src/data/initialState.ts` empty arrays; bundle 1,086.91 → 1,044.50 KB; smoke 4/4 |
| CFG-4 | Remove demo users/tenants from bootstrap; tenants from registry | P0 | DONE | bundle 1,040.70 KB; smoke 4/4 |
| CFG-5 | Firestore tenant registry with cached server loader | P0 | DONE | Firestore-only tenant resolved by host and listed publicly; rules 28/28 |
| CFG-6 | Remove final app import of `mockData`; neutral settings defaults | P0 | DONE | app imports no demo data; bundle 1,039.40 KB; smoke 4/4 |
| CFG-7 | Neutral app default school profile (no demo contacts/leadership) | P0 | DONE | `getDefaultSchoolProfile` sanitized; profiles start empty; smoke 4/4 |
| R-1 | Self-signup cannot create `registrar`/`teacher` profile | P0 | DONE | rules test: parent self-signup allowed, registrar denied |
| RULES-1 | Firestore emulator test harness | P0 | DONE | `npm run test:rules` → 16/16 |
| EMU-1 | Auth + Firestore emulator harness for end-to-end testing | P0 | DONE | `npm run smoke:emulator` → 4/4 (login, dashboard, Firestore read) |
| H-2 | Justification approval is staff-only | P0 | DONE | rules test: parent `approved` denied, `pending` allowed |
| H-3 | Audit log append is staff-only | P0 | DONE | rules test: parent denied, teacher allowed |
| H-5 | Users cannot rewrite phone/email on self-update | P0 | DONE | rules test: phone change denied, name change allowed |
| H-1 | Parent attendance scope | P0 | DONE | mirrors written; parent reads own records only; raw sessions denied; parent portal no console errors |
| H-1b | Parent justifications access | P1 | DONE | rules 26/26; parent portal shows the seeded excuse |
| H-4 | Settings read exposure | P0 | DONE | gateway moved to `settings_private`; rules: parent 403, admin allowed |
| H-6 | Notification dispatch must report `simulated`, not `delivered` | P1 | DONE (superseded by NS-1) | API: `simulated: true`, receipt `simulated/not_sent`, no receipt id; UI chip added |
| H-7 | Tenant AI encryption key no longer hardcoded | P0 | DONE | key read from `.env`; lazy derivation; tests pass |
| H-8 | Remove dead signature-blind JWT decoder | P1 | DONE | `src/lib/authGuard.ts` deleted; no code references remain; `lint`/`test`/`build` green |
| H-9 | Remove hardcoded dev bearer token default | P0 | DONE | server requires explicit `APP_AUTH_TOKEN` + `ALLOW_DEV_AUTH=true` |
| H-10 | Align local scanner and CI allowlist | P0 | DONE | CI now runs `scripts/ci-security-audit.mjs`; single source of truth; `npm run audit` pass |
| M-3 | `requireTenant` must not exempt `admin` | P1 | DONE | cross-tenant probe as admin → 403 |
| M-4 | Firebase Admin readiness must reflect credentials | P1 | DONE | `firebaseAdminReady` set only on real credential; `/api/health` reports `firebaseAdmin` + `firebaseAdminInitialized`; gated routes → 503 `AUTH_NOT_CONFIGURED` |
| M-6 | Render digest email HTML in a sandboxed iframe | P1 | DONE | `SandboxedEmailHtml` (iframe `sandbox=""`, `srcDoc`, no-referrer); used by preview + history tabs |
| M-11 | Documentation truth pass (test counts, readiness claims) | P1 | DONE | counts realigned to 27 suites / 192 tests across README + `docs/`; per-suite list rebuilt; readiness claims corrected |
| NS-1 | Remove all simulations / fake sends; real provider adapters | P0 | DONE | `messagingProviders.ts` + server dispatch; fail closed when unconfigured; 192 tests pass |
| M-12 | Repo hygiene (lockfiles, scratch files, package name) | P2 | DONE | `bun.lock` + report artifacts untracked; `package.json` renamed (`smart-school-attendance` v1.0.0); unused `motion` dep dropped |
| M-1 | Stop leaking internal error messages to clients | P2 | DONE | 7 handlers return generic `details`/`error`; real error still `console.error`-logged server-side |
| M-5 | Public endpoints exposed cost/inventory | P1 | DONE | `/api/owner/holidays/search` gated by `requirePlatformOwner`; `/api/tenants` returns a display-only projection (`no-store`), verified public-by-design in `scripts/security-probes.mjs` |
| M-2 | Transport / header hardening absent | P2 | DONE | `helmet` (CSP, HSTS, COOP `allow-popups`, no-referrer, nosniff); `X-Forwarded-Host` honoured only when `TRUST_PROXY` is set |
| M-13 | Production sign-in config is localhost-only / tenant-specific email | P2 | DONE | `firebase.json` support email neutralised; production authorized-domain steps documented in `docs/DEPLOYMENT.md` |
| M-14 | Production does not build the server (runs `tsx`, a devDependency) | P1 | DONE | `npm run build` now emits `server.js` via esbuild (`--packages=external`); `start` = `node server.js`; verified boot under plain node |
| M-7 | Sensitive data persisted in cleartext localStorage | P1 | DONE | `src/utils/localCache.ts` allowlist: students/sessions/justifications/notifications/audit/users/settings never hit disk (memory-only); legacy PII purged on load |
| M-8 | Demo data ships in the production bundle | P1 | DONE | demo student/user PII removed from `StudentManagementView` sample + `sampleImages`; tenant profile contacts and digest recipients emptied; bundle scan clean |
| M-9 | "Strict TypeScript" was not strict | P2 | DONE | `strict: true` + `noImplicitOverride: true` enabled, 0 errors; `noUncheckedIndexedAccess` deferred (181 findings) |
| M-15 | Performance and accessibility | P2 | DONE | Vite `manualChunks` vendor split (main chunk 1,086 kB → 250 kB); `role="dialog"`/`aria-modal`/`aria-label` added to 10 more modals |
| M-10 | Server/attendance access rules extracted to tested modules | P1 | DONE | `routeAuth.ts` (4 tests) + `attendanceAccess.ts` (10) + `serverIntegration.test.ts` (7) all drive production code; `server.ts` and `AttendanceContext.tsx` import them |
| T-1 | Tenant-secrets test writes to the real `tenant-ai-secrets.json` | P1 | DONE | temp path via `TENANT_AI_SECRETS_PATH`; real file hash unchanged |
| DATA-1a | Persist students to Firestore (create, update, transfer, restore, delete, import) | P0 | DONE | UI add → Firestore student count 1 → 2 |
| DATA-1b | Persist attendance sessions to Firestore | P0 | DONE | UI create → Firestore `attendance_sessions` doc (draft, class 10/أ) |
| DATA-2 | No fabricated identity/contact/medical defaults | P1 | DONE | placeholder email/phone/guardian phone/relationship/blood type replaced with the real value or empty across `AttendanceContext` + 6 components; `AddStudentModal` picker gained an "unspecified" option; bundle scan clean |

---

## Decisions taken

1. **Dev authentication is now explicit.** The shared bearer token only works when `ALLOW_DEV_AUTH=true` and `NODE_ENV !== 'production'`. Role and tenant come from `DEV_AUTH_ROLE` / `DEV_AUTH_TENANT`, never from request headers.
2. **Production identity comes from Firebase custom claims only.** There is no Firestore profile fallback: `firestore.rules` lets a user create their own profile, so trusting it would be privilege escalation. No claim → 403, never a default role. **Deployment prerequisite:** run `scripts/backfill-user-claims.mjs` before enabling the API for real users.
3. **Platform-owner routes** (provisioning, holiday search) accept either a `super_admin` claim or an email listed in `PLATFORM_OWNER_EMAILS` **and verified by Firebase** (`email_verified === true`). There is no default allowlist; the env var must be set explicitly.
4. **`/api/tenants` stays public but returns a display-only projection** (id, subdomain, names, logo, colour, active flag). It is needed by the pre-login tenant switcher; contact and configuration fields are removed.
5. **PDF sandbox is mandatory.** The `PUPPETEER_NO_SANDBOX` escape hatch was removed; container hosts must run Chromium as a non-root user with user namespaces available.
6. **Client accounts are no longer authenticated against bundled data.** Firebase Auth is the only login path; the local password fallback is deleted.
7. **Password storage is a separate follow-up (C-4b).** The fields are inert after this change but still ship in the bundle; removing them touches three admin screens and the user type, so it is tracked rather than half-done.
8. **Firebase web config moved to `.env`, but it is not a secret.** `VITE_FIREBASE_*` values must reach the browser and are public by design; they must be restricted by HTTP referrer and API scope. The real secret is the Admin service account, accepted as `FIREBASE_SERVICE_ACCOUNT_BASE64` (preferred) or `FIREBASE_SERVICE_ACCOUNT_JSON`, or via `GOOGLE_APPLICATION_CREDENTIALS`.
9. **Hosting is Render (free Docker web service).** The `Dockerfile` builds both bundles and ships system Chromium; `render.yaml` is the blueprint. Because Vite inlines `VITE_*` at build time and Render passes service env vars as Docker build args, every `VITE_*` value is declared with `ARG` in the Dockerfile. Per-tenant AI keys are stored in Firestore (`tenant_ai_secrets`) rather than the JSON file, so no persistent disk is needed on the free tier.

---

## Verification log

| Date | Command | Result |
|---|---|---|
| 2026-10-18 | `npm run lint` (baseline, before fixes) | pass, 0 errors |
| 2026-10-18 | `npx vitest run` (baseline) | pass, 20 files / 135 tests |
| 2026-10-18 | `npm run build` (baseline) | pass, main chunk 1,086.91 kB |
| 2026-10-18 | `npm run audit` (baseline) | pass (misleading; see H-10) |
| 2026-10-18 | live probes (baseline) | C-1/C-2/C-3 confirmed exploitable |
| 2026-10-18 | `npm run lint` (after fixes) | **pass**, 0 errors |
| 2026-10-18 | `npx vitest run` (after fixes) | **pass**, 20 files / 135 tests, 891 ms |
| 2026-10-18 | `npm run build` (after fixes) | **pass**, 7.70 s |
| 2026-10-18 | `node scripts/security-probes.mjs` | **pass**, 16/16 checks (includes `/API/...` case variants) |
| 2026-10-18 | live probes, low-privilege identity | provision/pdf/holiday anonymous → **401**; header escalation → **403** |
| 2026-10-18 | live probes, platform-owner identity | authenticated PDF → **200** (23,320 bytes); provision valid → **200**, count stays 1 |
| 2026-10-18 | tenant resolution after provisioning | new tenant **resolved** immediately; after file restore → **unknown_domain** |
| 2026-10-18 | independent review (审阅者) | 3 must-fix defects found (case bypass, unverified email, self-writable role) — all fixed above |
| 2026-10-18 | final `npm run lint` / `vitest` / `build` / `audit` | **pass**, 0 errors, 135 tests, 5.85 s build, audit pass |
| 2026-10-18 | env centralization | 11 Firebase values written to `.env`; client module contains the env value; `/api/health` → `adminKeyLoaded: false` (no service account) |
| 2026-10-18 | `npm run test:rules` (emulator, port 8099) | **pass**, 16/16 rules tests |
| 2026-10-18 | `npx vitest run` after credential removal | **pass**, 21 files / 132 tests |
| 2026-10-18 | `npm run build` (final) | **pass**, 5.77 s |
| 2026-10-18 | `npm run audit` after env centralization | **pass** (scanner now skips `.env`) |
| 2026-10-18 | T-1 isolation | pass; real `tenant-ai-secrets.json` hash unchanged, temp file removed |
| 2026-10-18 | `npm run smoke:emulator` | **pass**, 4/4 (admin login, dashboard, 1 seeded student, no runtime errors) |
| 2026-10-18 | UI add student against emulator | **pass**: modal submit → `persistStudent` → Firestore `students` docs 1 → 2 |
| 2026-10-18 | UI create session against emulator | **pass**: daily session → Firestore `attendance_sessions` doc (draft, 10 / أ) after sanitizing `undefined` fields |
| 2026-10-18 | `npm run test:rules` after H-1 | **pass**, 24/24 (parent raw sessions denied; own record allowed; other record denied) |
| 2026-10-18 | parent portal against emulator | **pass**, no console errors; 7 per-student mirror records; parent identity/phone loaded from Firestore |
| 2026-10-18 | `npm run test:rules` after H-1b | **pass**, 26/26 (own excuse allowed, other denied) |
| 2026-10-18 | parent excuses tab | **pass**: seeded justification visible in the parent portal |
| 2026-10-18 | config/identity fallback removal | **pass**: no `firebase-applet-config` reference in app code; `smoke:emulator` 4/4 |
| 2026-10-18 | demo array extraction | **pass**: app boots with empty initial arrays; `smoke:emulator` 4/4; main chunk 1,044.50 KB (−42.4 KB) |
| 2026-10-18 | demo users/tenants removal | **pass**: tenants from `TENANT_REGISTRY`, users from Auth/Firestore; smoke 4/4; main chunk 1,040.70 KB |
| 2026-10-18 | Firestore tenant resolution | **pass**: `firestore-demo.smartschool.com` → `resolved` from Firestore; appears in `/api/tenants`; rules 28/28 |
| 2026-10-18 | settings default extraction | **pass**: app imports no `mockData`; bundle 1,039.40 KB; smoke 4/4 |
| 2026-10-18 | neutral school profile defaults | **pass**: contacts/leadership empty until Settings/Firestore provides them; smoke 4/4 |
| 2026-10-18 | notification dispatch honesty (H-6) | **pass**: API returns `simulated: true`, `carrierStatus: not_sent`, `dispatchedCount: 0`; outbox items start `pending`/`simulated` |
| 2026-10-18 | hardcoded literal scan (`password123`, owner password) | **zero matches** in `src`, `server.ts`, `scripts` |
| 2026-10-18 | M-4 Admin readiness | **pass**: projectId-only init warns; `/api/health` exposes `firebaseAdmin`; auth/refresh/provision gated on real credential |
| 2026-10-18 | H-10 scanner/CI alignment | **pass**: CI invokes the scanner; `npm run audit` reports "All security and compliance audit checks passed" |
| 2026-10-18 | M-6 sandboxed digest HTML | **pass**: `dangerouslySetInnerHTML` removed from both digest tabs; `tsc` + `build` pass |
| 2026-10-18 | NS-1 real provider adapters | **pass**: `npm run lint`, `npm run build`, `npm run audit` pass; `vitest` 27 files / 192 tests (18 adapter tests) |
| 2026-10-18 | M-11 documentation truth pass | **pass**: no stale 65/113/117/135 test counts remain (audit docs excluded by design); `docs/TESTING.md` per-suite list rebuilt to 27 suites |
| 2026-10-18 | M-12 repo hygiene | **pass**: `bun.lock` and 13 report artifacts removed from tracking + ignored; `package.json` → `smart-school-attendance` v1.0.0; `motion` removed from deps; `npm install` clean |
| 2026-10-18 | M-1 generic API errors | **pass**: no `err?.message` reaches clients (7 sites); `lint`/`build`/`audit` green |
| 2026-10-18 | M-14 compiled server build | **pass**: `npm run build` emits `server.js` (141.5 kb); `NODE_ENV=production PORT=5099 node server.js` → `/api/health` 200 (`nodeVersion` v26.7.0, static `dist/` served) |
| 2026-10-18 | M-13 auth config neutralised | **pass**: school-specific support email removed from `firebase.json`; prod domain requirements documented |
| 2026-10-18 | M-2 transport hardening | **pass**: production response carries CSP, HSTS (`max-age=15552000`), COOP `same-origin-allow-popups`, `Referrer-Policy: no-referrer`, `X-Content-Type-Options`; `X-Forwarded-Host` ignored unless `TRUST_PROXY` set |
| 2026-10-18 | M-7 privacy-safe local cache | **pass**: 6 new tests prove sensitive keys never reach `localStorage` and legacy PII is purged; `AttendanceContext` now uses `localCache` (0 direct `localStorage` refs) |
| 2026-10-18 | M-8 demo data out of bundle | **pass**: `dist` scan shows no demo student/user PII (`1098765431`, `+966509990011`, staff emails); remaining `*.school.edu.sa` strings are the static bootstrap registry |
| 2026-10-18 | M-9 strict TypeScript | **pass**: `strict`+`noImplicitOverride` on, `tsc --noEmit` 0 errors; `noUncheckedIndexedAccess` measured at 181 findings (deferred) |
| 2026-10-18 | M-10 core-logic tests | **pass**: `routeAuth.test.ts` (4) + `attendanceAccess.test.ts` (10) test extracted production rules; `server.ts` and `AttendanceContext.tsx` import them |
| 2026-10-18 | M-15 perf | **pass**: main chunk 1,086.91 kB → `index` 250.26 kB + vendor-charts 339.6 kB + vendor-firebase 444.9 kB + vendor-react 327.4 kB + vendor 244.5 kB; no size warnings |
| 2026-10-18 | M-10 server integration | **pass**: `serverIntegration.test.ts` (7) imports the real `server.ts` and drives a live Express instance — public health/resolver/registry endpoints, 401 without bearer, 404 unknown domain, helmet headers; server auto-start guarded by a direct-run check (`node server.js` still binds: `/api/health` 200) |
| 2026-10-18 | M-15 keyboard a11y | **pass**: `useModalAccessibility` (focus-on-open, Tab/Shift+Tab trap, Escape-to-close, focus restore) wired into all 19 dialog modals; `modalA11y.test.ts` (11) covers the key/cycle logic; `tsc` + `build` green |
| 2026-10-18 | production-readiness pass: `lint` / `test` / `build` / `audit` | **pass**: 0 `tsc` errors; 27 files / 192 tests; client + `server.js` built; audit clean |
| 2026-10-18 | `npm run test:rules` (re-run) | **pass**, all rules tests pass (the logged `PERMISSION_DENIED` lines are the expected negative cases) |
| 2026-10-18 | `node scripts/security-probes.mjs` vs live dev server (`:5099`) | **pass**, 16/16 (anonymous 401s, `/API/...` variants, tenant projection fields, header escalation → 403, authenticated PDF → 200) |
| 2026-10-18 | production boot `NODE_ENV=production node server.js` | **pass**: `/api/health` 200 with HSTS + `X-Content-Type-Options`; anonymous `/api/pdf/generate` → 401 |
| 2026-10-18 | H-8 dead-file removal | **pass**: `src/lib/authGuard.ts` deleted; no code references; `lint`/`test`/`build` green |
| 2026-10-18 | fabricated-default removal (DATA-2) | **pass**: 7 files stop inventing email/phone/guardian phone/blood type/relationship; bundle no longer contains `+966500000000` or `user@school.edu.sa` |
| 2026-10-18 | deploy tooling (Render free / Docker) | **pass**: `Dockerfile` + `.dockerignore` + `render.yaml`; per-tenant AI keys persist in Firestore (`tenant_ai_secrets`) via `attachTenantSecretsStore` at boot; `rotate:secrets` / `migrate:secrets` / `golive` scripts added; `tsc`, 27 files / 192 tests, build, audit all green |
| 2026-10-18 | `TENANT_ENCRYPTION_MASTER_KEY` rotated | **pass**: `rotate-tenant-ai-secrets.mjs` dry-run decrypted 2 keys, then re-encrypted them with a new key; both tenants verified readable via `getTenantApiKey`; `.bak` kept |

---

## Next actions (in order)

1. **Deployment prerequisite:** run `scripts/backfill-user-claims.mjs` with a service account so every real user has `role` + `tenantId` claims. Without it, the API returns 403 `NO_ROLE_ASSIGNED` (by design).
2. **Remaining hardcoded data:** the demo profile constants in `tenantSettings.ts` remain as test fixtures (app uses a neutralised copy), the static tenant registry fallback. `firebase-applet-config.json` has been untracked. `mockData.ts` is test-fixture-only. Full list in `docs/CONFIGURATION_INVENTORY.md`.
3. **Tenant AI key rotation:** the hardcoded fallback is gone (key now in `.env`), but the value is the old known constant. Generate a new `TENANT_ENCRYPTION_MASTER_KEY` and re-encrypt `tenant-ai-secrets.json`.
4. **Test-coverage gap (M-10, mostly closed):** `server.ts` is now imported directly by `src/utils/serverIntegration.test.ts` (real routes, no re-implementation), and its security-critical rules live in `routeAuth.ts` (tested). `AttendanceContext.tsx` is still not imported standalone — its RBAC/guardian rules are tested via the extracted `attendanceAccess.ts`; importing the component itself is blocked on the P2 provider split.
5. **Type-strictness follow-up (M-9):** `noUncheckedIndexedAccess` is still off. Measured at **181 findings across 26 files** (top: `StudentAbsenceDrawer.tsx` 35, `StudentAbsenceInquiryView.tsx` 35, `calculationsAudit.test.ts` 25, `WeeklyAttendanceTrendCard.tsx` 12, `holidayUtils.ts` 10, `AttendanceContext.tsx` 10). Most are `ISO-date split destructuring` (`const [y,m,d] = s.split('-')`) and loop-index accesses. Enable only after a dedicated pass (enabling it is all-or-nothing: it breaks `tsc`, `lint` and the build until every site is guarded).
6. **Accessibility follow-up (M-15):** DONE — modals carry `role="dialog"`/`aria-modal`/`aria-label`, and all 19 dialog modals now use `useModalAccessibility` (focus on open, Tab/Shift+Tab trap, Escape-to-close, focus restore). Only a screen-reader content audit (labels/announcements) remains.
7. **Live provider verification (NS-1):** real sends are unverified without live gateway credentials; adapters fail closed by design.
8. **Build-time env inlining (deployment):** `dist/` bakes in whatever `.env` exists when `npm run build` runs (platform-owner email(s), Firebase project id, `VITE_USE_FIREBASE_EMULATOR`, default tenant). Build the production bundle with production values and confirm `VITE_USE_FIREBASE_EMULATOR=false`; documented in `docs/DEPLOYMENT.md` and `handoff.md`.

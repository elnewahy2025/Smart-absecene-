# Project Audit — Smart School Attendance System ("مدرستي حضور")

**Audit date:** 2026-10-18
**Scope:** Entire repository — application code, server, Firestore rules, build/CI, tests, documentation, repository hygiene.
**Baseline:** `main` @ `00f0bab` + 104 uncommitted changes (66 modified, 38 untracked).
**Method:** Static review of all entry points and security-relevant modules, plus live verification against a locally started server (`PORT=5099`, development mode) and execution of every verification command the repository declares.

---

## 1. Verdict

The application is feature-rich and visually coherent, and its build is green: TypeScript compiles, 135 tests pass, Vite builds, and the project's own security scanner reports success.

**However, the security posture does not match the documentation.** Three independent access-control bypasses are reachable today, two of them verified live against the running server. The repository's own audit documents claim all critical findings are "RESOLVED" and rate the project 9.5/10 "Production-Ready"; that claim is not supported by the code.

| Area | Rating | Basis |
|---|---|---|
| Build & type check | Good (with caveat) | `tsc` and `vite build` pass; `strict` is **off** |
| Automated tests | Weak as a safety net | 135 tests pass, but `server.ts` and `AttendanceContext.tsx` are never imported by any test |
| Authentication | **Critical** | Role/tenant taken from client headers; client-side credential fallback |
| Access control / tenancy | **Critical** | Live cross-tenant access via two headers |
| Firestore rules | Weak | Default-deny is good; several collection rules leak or allow forgery |
| Secret handling | Poor | Hardcoded fallback encryption key; API key committed; scanner whitelists it |
| Documentation accuracy | Poor | Contradicts the code on security, tests, and readiness |
| Repo hygiene | Poor | 104 uncommitted files, scratch artifacts, dual lockfiles, no license |
| Overall | **Not production-ready** | Fix Critical + High before any real school data is loaded |

---

## 2. What I actually ran (baseline)

| Check | Command | Result |
|---|---|---|
| Type check | `npm run lint` (`tsc --noEmit`) | **Pass**, 0 errors — but `strict` is not enabled |
| Unit tests | `npx vitest run` | **Pass**, 20 files / 135 tests, 912 ms |
| Production build | `npm run build` | **Pass**, 6.12 s; main chunk **1,086.91 kB** (276.24 kB gzip), warning > 500 kB |
| Security scan | `npm run audit` | **Pass** — misleading, see H-10 |
| Server boot | `npx tsx server.ts` on port 5099 | **Pass**; `/api/health` = ok, `pdfPuppeteer: true`, `firebaseAdmin: false` |

All five commands pass. That is precisely why the findings below matter: **the green pipeline does not test the code that enforces security.**

---

## 3. Critical findings

### C-1 — Access control is decided by client-supplied headers (verified live)

**Evidence**

- `server.ts:280` — after verifying a Firebase ID token, the role is taken from the token **or the request header**:
  `const role = (decodedToken as any).role || req.get('x-user-role') || 'teacher';`
- `server.ts:296` and `server.ts:310` — the dev/shared-token path does `req.get('x-user-role') || 'admin'`.
- `src/lib/api.ts:37` — the browser sends that header from `localStorage`, **defaulting to `admin`**:
  `const storedRole = localStorage.getItem('school_current_user_role') || 'admin';`
- `src/components/settings/SmartHolidayImportModal.tsx:95` — a component hardcodes `'x-user-role': 'super_admin'`.

**Live verification** (same bearer token for all three requests):

| Request | Result |
|---|---|
| `GET /api/tenant/ai-config` + `x-user-role: parent` | **403** |
| `GET /api/tenant/ai-config` + `x-user-role: admin` | **200** |
| `GET /api/tenant/ai-config` + `x-user-role: super_admin` + `x-user-tenant: school-beta` | **200**, returns `school-beta` configuration |

**Impact.** Any authenticated user — including a parent account whose token carries no `role` claim — can promote themselves to `super_admin` server-side and read another school's configuration. The 4-tier RBAC described in the README exists only in the UI. The `super_admin` claim also bypasses `requireTenant` entirely (`server.ts:355`).

**Fix.** Delete every header-derived identity field. Resolve role and tenant exclusively from `decodedToken` custom claims (set with the Admin SDK) or a server-side Firestore lookup keyed by `uid`; deny when the claim is absent. Never default a role to `admin`.

---

### C-2 — Tenant provisioning is unauthenticated and writes to disk (verified live)

**Evidence**

- `server.ts:1268` `POST /api/tenants/provision`, listed as public in `isPublicRoute` (~line 230).
- No authentication, no role check, no schema validation: it accepts any body with `tenantId` + `subdomain`, filters out the matching entry and **appends the attacker's object**, then `fs.writeFileSync`s `src/config/dynamicTenants.json`.
- `server.ts:1254` `GET /api/tenants` is also public and returns every tenant's full configuration.

**Live verification**

- `POST /api/tenants/provision` with body `{}` → **400 "Invalid tenant config payload"**, not 401. The handler executed, proving authentication was bypassed (the empty body meant nothing was written).

**Impact.** Anyone on the internet can add a new school tenant, or replace an existing tenant's record (same `tenantId` is overwritten), including its custom domains and active flag. That is persistent defacement and enables onboarding a phishing domain into the tenant registry. In container deployments the write either fails or is lost on redeploy — the feature is broken *and* unsafe.

**Fix.** Require a verified `super_admin` claim; validate against a strict schema; persist to Firestore (or a managed store), never to the source tree; add an audit entry and rate limit.

---

### C-3 — Public PDF endpoint renders arbitrary HTML in Chromium with `--no-sandbox` (verified live)

**Evidence**

- `server.ts:59` — the route is mounted **before** the auth middleware (`server.ts:411`) and is explicitly whitelisted in `isPublicRoute`.
- `server.ts:74` — launches Chromium with `--no-sandbox` and `--disable-setuid-sandbox`.
- The caller-supplied `htmlContent` is injected wholesale; `title` is interpolated into `<title>` without escaping.
- The rendered document loads `https://cdn.tailwindcss.com` and Google Fonts at render time.
- No rate limiter covers this route (limiters exist only for `/api/health`, `/api/chat`, `/api/analyze-image`, `/api/daily-digest`, `/api/notifications`).
- Global body limit is **25 MB** (`server.ts:17`).

**Live verification**

- `POST /api/pdf/generate` with `<h1>audit probe</h1>` and **no auth header** → **200**, `success: true`, 23,320-byte PDF, in 3.2 s.

**Impact.** Unauthenticated remote users can spawn a headless browser per request. This is a cheap CPU/RAM exhaustion vector (each request launches a new Chromium; 25 MB bodies allowed, no rate limit) and an SSRF surface: rendered HTML can issue requests to internal services, and `file://` references are reachable from a `--no-sandbox` renderer. Loading a third-party CDN script inside the renderer adds a supply-chain path.

**Fix.** Put the route behind auth + tenant checks; add a strict per-user rate limit and a bounded concurrency queue; escape `title`; compile Tailwind to a local stylesheet instead of the CDN; block network requests inside the page (`page.setRequestInterception`), disable JavaScript, and drop `--no-sandbox` (or isolate the renderer in a dedicated container).

---

### C-4 — Client-side authentication with shared default passwords

**Evidence**

- `src/context/AttendanceContext.tsx:819-820` — when Firebase rejects the credentials, the app falls back to comparing the submitted password against data bundled in the browser. The comparison uses the account's stored password if present, otherwise a hardcoded shared default; the `super_admin` branch accepts that same default unconditionally.
- `src/context/AttendanceContext.tsx:241` — the role initialises to `admin` when nothing is stored.
- `src/context/AttendanceContext.tsx:1108`, `:2912` — newly created users receive that same hardcoded default password.
- `src/data/mockData.ts:52,63` — seeded accounts contain `password` fields, and `INITIAL_USERS` ships in the client bundle.
- `scripts/seed-firebase-auth.ts:35` — every seeded Firebase account is created with the account's stored password, falling back to the same shared default.

**Impact.** Whenever Firebase Auth is unavailable, misconfigured, or rejects the login, authentication degrades to a string comparison performed in the browser against shipped data — trivially bypassable with DevTools. Seeded production accounts share a known password. A fresh browser with no stored role is treated as `admin`. The `super_admin` branch accepts the shared default unconditionally.

**Fix.** Remove the fallback and fail closed. Never ship passwords or `INITIAL_USERS` credentials to the browser. Force a password reset on first login, require MFA for admins, and derive `currentUserRole` from the server, never from `localStorage`.

---

## 4. High findings

### H-1 — Every parent can read every class's attendance sessions
`firestore.rules:181-190` scopes reads by tenant and then allows `getUserData().role == 'parent'` for **all** sessions in that tenant. Student records are correctly restricted to the guardian's own child (`:164-167`), but attendance is not. Any parent can enumerate class-by-class absence and lateness for the whole school.

**Fix.** Join through the student record: allow a parent only when `resource.data.records` references one of their children, or mirror a `parentChildIds` map into the user document and check membership.

### H-2 — Parents can self-approve excuses; and cannot read their own child's excuses
- `firestore.rules:216` allows any tenant user to create a justification, and `isValidJustification` (`:70-77`) accepts `status: 'approved'` on create. A parent can submit an already-approved medical excuse.
- `firestore.rules:211` authorises a parent by `resource.data.studentId == request.auth.uid`, comparing a **student document id** to the **auth uid** — these are different namespaces, so the parent portal cannot read justifications under the rules.

**Fix.** Force `status == 'pending'` on create for non-staff; authorise parent reads via the actual guardian linkage (phone/email/child ids), not `studentId == uid`.

### H-3 — Audit log can be forged by any tenant user
`firestore.rules:242-249`: updates and deletes are denied (good), but `create` is open to any tenant user and accepts client-supplied `performerName`, `details` and a **string** `timestamp`. A teacher or parent can write arbitrary entries attributed to anyone, and backdate them.

**Fix.** Write audit entries only from a trusted backend (Admin SDK) or restrict create to staff and use `request.time` server-side; treat `performerName` as derived, not supplied.

### H-4 — School settings are readable by parents
`firestore.rules:225-227`: `allow read: if isTenantUser(tenantId)` — parents included. Settings carry school contact data, leadership, academic calendar and messaging-gateway configuration. Write access is correctly admin-only, but read is over-broad.

**Fix.** Split the document: public/portal-safe fields readable by all tenant users; integration and contact fields readable by admin/registrar only.

### H-5 — Guardian linkage can be hijacked by editing your own phone number
`firestore.rules:147-152` lets a user update their own profile as long as role and tenant are unchanged — `phone` and `email` are unrestricted. Parent read access to a student depends on `resource.data.guardianPhone == getUserData().phone` (`:164-167`). A parent who knows another guardian's phone number can set it as their own and read that child's record.

**Fix.** Store guardian→child links in a server-managed collection; make `phone`/`email` immutable after verification (or require re-verification); authorise reads on the link, not on a mutable attribute.

### H-6 — Notification dispatch reports "delivered" while sending nothing
`server.ts:1022-1090`: the endpoint performs no gateway call. It returns `status: 'sent'`, `carrierStatus: 'delivered'`, a fabricated `gatewayReceiptId`, and a provider name ("Meta Cloud API / Unifonic…" / "STC / Mobily…"), then logs "Dispatched N parent notifications". The response carries **no simulation flag**.

**Impact.** A school administrator sees a delivered receipt for a message no parent received. For an absence-notification system this is a safeguarding failure, not a cosmetic one. `docs/KNOWN_LIMITATIONS.md` does mention a UI simulation banner, but the API contract itself asserts delivery.

**Fix.** Either implement a real gateway, or return `status: 'simulated'`, `carrierStatus: 'not_sent'` and remove provider names and receipt ids until a gateway exists. Label it in the audit log too.

### H-7 — Tenant AI keys are encrypted with a key that is in the source
`src/utils/tenantAISecrets.ts:7` derives the AES key from `TENANT_ENCRYPTION_MASTER_KEY`, falling back to a **hardcoded constant committed in the same file**.
I confirmed `TENANT_ENCRYPTION_MASTER_KEY` is **not** set in `.env`, so the committed fallback is in use. `tenant-ai-secrets.json` holds two tenants' keys, encrypted with that public constant. Additional weaknesses: path is `process.cwd()`-relative, writes are non-atomic, and there is no locking for concurrent writes.

**Fix.** Require the master key at boot (fail closed), load it from a secret manager or KMS, rotate any key encrypted under the fallback, and store tenant secrets in a managed secret store rather than a JSON file.

### H-8 — Dead, signature-blind JWT decoder is exported for future misuse
`src/lib/authGuard.ts` decodes the JWT payload with `Buffer.from(decoded, 'base64')` and trusts `role`/`tenantId` with **no signature verification**. It is currently imported by nothing (verified by repository-wide search), but it exports `requireAuth`, `requireRole`, and `requireTenantAccess` — wiring it in would create an instant authentication bypass.

**Fix.** Delete the file, or replace it with `admin.auth().verifyIdToken` and a test that proves a forged token is rejected.

### H-9 — Known dev token is live whenever `NODE_ENV !== 'production'`
`server.ts:15` falls back to a hardcoded development bearer token whenever `NODE_ENV` is not `production`.
`src/lib/api.ts:28` sends the same literal as a fallback. The checked-in `.env` sets `NODE_ENV=development` and that development token. Any deployment that forgets `NODE_ENV=production` — or ships this `.env` — exposes an admin-capable token that is published in the source.

**Fix.** Remove the default entirely; refuse to boot in any environment without an explicit token or Firebase credentials. Fail loud, not open.

### H-10 — The security gate is tuned to pass, and disagrees with CI
- `scripts/ci-security-audit.mjs` puts `firebase-applet-config.json` in `ignoredExactFiles`, and also whitelists itself. That is why `npm run audit` prints "PASS: No secrets detected".
- `firebase-applet-config.json` **is tracked in git** and contains a Google API key with the `AIza` prefix (39 characters), plus project id, app id, and OAuth client id.
- `.github/workflows/ci-security-audit.yml` greps the repo for `AIza` with **no such whitelist**. Running that pattern locally matches three tracked files (`firebase-applet-config.json`, `src/components/settings/SchoolAIGeminiTab.tsx` placeholder text, and the scanner's own regex). The CI job therefore fails, or the local "PASS" is not evidence of anything.

**Impact.** The project's central security claim ("Zero Secrets … verified via automated scan") rests on a scanner that excludes the one file that contains a key. Firebase web keys are public by design, but they must be restricted by HTTP referrer and API scope; nothing in the repository documents or enforces that.

**Fix.** Make the local scanner and CI use one allowlist; treat an `AIza` key as acceptable only when it is a documented Firebase web key with referrer restrictions; add a comment next to the key stating the restriction; remove the self-whitelist and scan the scanner.

---

## 5. Medium findings

**M-1 — Internal error messages are returned to clients.** `details: err?.message` appears in the PDF route, notification dispatch, tenant endpoints, and holiday search. Stack-adjacent internals leak to callers.

**M-2 — Transport and header hardening is absent.** No `helmet`, no CSP, no HSTS, no `trust proxy` setting, yet `X-Forwarded-Host` is trusted unconditionally in tenant resolution (`server.ts:~230`). A client can influence which tenant a request resolves to unless the proxy overwrites the header.

**M-3 — `requireTenant` exempts every `admin` from the payload tenant check.** `server.ts:355`: `user.role !== 'super_admin' && user.role !== 'admin'`. A school admin can post another school's `tenantId` in the body; the host check only helps when the host resolves to a tenant. Only `super_admin` should be exempt.

**M-4 — Firebase Admin is reported healthy when it cannot verify tokens.** `server.ts:208-211` calls `admin.initializeApp({ projectId })` and sets `firebaseAdminInitialized = true` without credentials. `/api/health` then reports `firebaseAdmin: true`, while `verifyIdToken` fails at request time and every authenticated call ends in 401. In my run it was `false` only because no project id was set. Readiness must verify credentials, not just configuration.

**M-5 — Two public endpoints expose cost and inventory.** `GET /api/tenants` returns every tenant record unauthenticated. `POST /api/owner/holidays/search` is an unauthenticated Gemini proxy using the platform key, with no rate limiter — free LLM usage and prompt-injection surface. Verified: both returned 200 without a token.

**M-6 — Stored XSS surface in the digest viewer.** `dangerouslySetInnerHTML` at `src/components/digest/DigestEmailPreviewTab.tsx:150` and `DigestHistoryTab.tsx:138` renders digest HTML that embeds student names and AI output. Sanitise with DOMPurify or render through a sandboxed iframe.

**M-7 — Sensitive data persisted in cleartext localStorage.** `AttendanceContext.tsx:836-868` writes students (including `nationalId`, guardian phone), sessions, justifications (medical text), notifications, audit logs and settings to `localStorage`, and hydrates from it on boot. On a shared staffroom device this is a privacy exposure; it also creates a second source of truth that can silently diverge from Firestore.

**M-8 — Demo data ships in the production bundle.** `src/data/mockData.ts` (65 KB) is imported by `AttendanceContext.tsx` and supplies `INITIAL_USERS`, students and phones. It inflates the bundle and blurs demo vs. real data — a direct contributor to C-4.

**M-9 — "Strict TypeScript" is not strict.** `tsconfig.json` has no `"strict": true` (nor `noUncheckedIndexedAccess`, `noImplicitOverride`). The codebase contains ~130 `any`/`as any` occurrences. `tsc --noEmit` passing therefore proves much less than the docs claim.

**M-10 — The test suite does not test the application's core.** All 135 tests pass, but the suite imports only 11 distinct production modules. **`server.ts` and `AttendanceContext.tsx` — where authentication, tenancy and every permission check live — are imported by zero tests.** Several suites test re-implementations rather than production code: `rbac.test.ts` defines its own `checkCanEditSession` ("Helper matching AttendanceContext RBAC logic") and asserts against that; `settingsComplianceAudit.test.ts` computes the expected date and CSV validity inline, then asserts its own expression.

**M-11 — Documentation is materially inaccurate and contradicts the code.** See the matrix in §8. Three different test counts appear across four documents; `PROJECT_ASSESSMENT.md` rates the project 9.5/10 and "Production-Ready"; `AUDIT_FINDINGS.md` and `KNOWN_LIMITATIONS.md` mark every critical as resolved; `CODE_QUALITY_AUDIT.md` claims "strict TypeScript compilation". The next maintainer will read these and skip the work that is actually needed.

**M-12 — Repository hygiene.** `package.json` is still `"name": "react-example"`, `"version": "0.0.0"`. Both `bun.lock` and `package-lock.json` are tracked (CI uses npm, the handoff says Bun) — divergent installs are inevitable. `motion` is declared but imported by zero files. No `LICENSE`, `CHANGELOG`, `CONTRIBUTING`, ESLint, Prettier, or `engines` field. Seven scratch scripts are tracked, including `scripts/test-output.pdf`; 2.3 MB of `.docx`/`.pdf`/`.png` artifacts sit at the repository root, along with a Word lock file `~$kh.docx`. The working tree has 104 uncommitted changes on `main`, including a 5,741-line insertion diff.

**M-13 — Production sign-in configuration is localhost-only.** `firebase.json` lists only `http://localhost:5050`, `http://localhost`, and `http://127.0.0.1:5050` as authorized redirect URIs, so Google redirect sign-in will fail on a real domain. The support email is hardcoded to one school (`principal@andalus-school.edu.sa`).

**M-14 — Production does not build the server.** `"start": "tsx server.ts"` runs TypeScript through `tsx`, which is a **devDependency**; `vite build` only builds the client. `npm ci --omit=dev` therefore cannot start the service, and there is no compiled `server.js` even though `clean` deletes one. A container image built from production dependencies will fail at boot.

**M-15 — Performance and accessibility.** Main chunk is 1,086.91 kB (276 kB gzip) with no `manualChunks` vendor split; route-level views are lazily loaded (credit where due). Only 17 `aria-*` attributes exist across 109 source files and dozens of modals/dialogs, so keyboard and screen-reader support is largely unverified.

---

## 6. Low findings and observations

- 85 `console.*` calls in application code; `server.ts:1070` logs the operator's email alongside tenant and role.
- `index.html` loads Google Fonts from a third party with no SRI and no CSP.
- Hard-coded model candidate lists (`gemini-3.5-flash`, `3.7`, `3.8`, `3.5-flash-lite`) are duplicated in at least three places (`server.ts` chat, image analysis, holiday search) and in `scripts/test_key.ts`.
- The tenant registry has two sources of truth: `src/config/tenantRegistry.ts` (static, typed) and `src/config/dynamicTenants.json` (written at runtime by an unauthenticated endpoint).
- `vite.config.ts` carries an operational instruction in a comment ("Do not modify — file watching is disabled…"), which belongs in the handoff document, not in build config.
- `audit_logs` uses a client-supplied ISO string rather than a Firestore timestamp, so ordering and tamper-evidence are both unreliable.
- `dist/` (3.3 MB) is present but correctly gitignored; it was regenerated by this audit's build.

---

## 7. What is genuinely solid

These are not consolation prizes — they are the parts worth preserving while fixing the rest:

- **Firestore default-deny** (`match /{document=**} { allow read, write: if false; }`) with per-collection schema validators is the right shape, and `isValidId`, `isValidStudent`, and `isValidAttendanceSession` are real constraints, not decoration.
- **Submitted-session locking** in rules (`attendance_sessions` update branch) correctly prevents teacher edits after submission while allowing admin/registrar reopen.
- **Audit-log immutability** (update/delete denied) is the right policy, even though creation is too open (H-3).
- **Image upload validation is real**: `/api/analyze-image` enforces a MIME allowlist, a ~7 MB base64 cap (~5 MB binary), and genuine magic-byte checks for JPEG/PNG/PDF/WEBP (`server.ts:748-773`).
- **Rate limiting exists** on the five AI/notification routes, with sensible per-minute budgets.
- **Host-based tenant resolution** (`resolveTenantFromHostname`) is checked before auth and applied to every private route; the cross-tenant host check does work — my `admin + x-user-tenant` probe was correctly rejected with 403.
- **View-level code splitting** via `React.lazy` + `Suspense` in `App.tsx`.
- **Arabic RTL fidelity** is consistent across components, PDF templates and print CSS — a genuine differentiator.
- **`.env` was never committed** (verified across all history); `.env.example` exists; `serviceAccountKey*.json` and `tenant-ai-secrets.json` are gitignored.
- **`ErrorBoundary`** and centralized Firestore error handling are present.

---

## 8. Documentation vs. reality

| Document | Claim | Reality |
|---|---|---|
| `README.md:80` | "17 suites, 113 tests, 100% success" | **20 suites, 135 tests** |
| `docs/TESTING.md:18` | "17 Suites, 113 Passed Tests" | 20 / 135 |
| `docs/KNOWN_LIMITATIONS.md` | "117 tests across 17 suites" | 20 / 135 |
| `TESTING_CHECKLIST.md:15`, `AUDIT_FINDINGS.md`, `PROJECT_ASSESSMENT.md`, `PRODUCTION_READINESS_PLAN.md` | "65 tests across 9 suites" | 20 / 135 |
| `docs/PROJECT_ASSESSMENT.md` | "9.5/10 — Production-Ready" | Three live access-control bypasses |
| `docs/AUDIT_FINDINGS.md` | "All findings fully remediated" | C-1…C-4 open |
| `docs/KNOWN_LIMITATIONS.md` | "Zero secrets in committed code" | Tracked `firebase-applet-config.json` holds an `AIza` key; scanner whitelists it |
| `docs/CODE_QUALITY_AUDIT.md` | "strict TypeScript compilation" | `strict` is off |
| `docs/CODE_QUALITY_AUDIT.md` | "comprehensive automated test coverage" | `server.ts` and `AttendanceContext.tsx` have zero coverage |
| `docs/DEPENDENCY_AUDIT.md` | "no visible evidence of security scanning" | `.github/workflows/ci-security-audit.yml` exists |
| `docs/PRODUCTION_READINESS_PLAN.md` | "Backend Authorization — completed" | Header-driven roles; public provisioning |

The pattern is consistent: **documents were written to declare completion, not to record verification.** Any future audit or handover that trusts them will be misled.

---

## 9. Remediation plan

### P0 — before any real student data (this week)

1. **Remove header identity (C-1).** Delete `x-user-role`, `x-user-tenant`, `x-tenant-id` fallbacks from `server.ts`; delete the `localStorage` role propagation in `api.ts`; delete the hardcoded `super_admin` header in `SmartHolidayImportModal.tsx`. Set role/tenant as custom claims in a trusted backend path and read only `decodedToken`.
2. **Close provisioning (C-2).** Require `super_admin`; validate schema; move persistence to Firestore.
3. **Lock the PDF route (C-3).** Move the mount below auth; add a limiter and a concurrency cap; escape `title`; intercept and block network; remove `--no-sandbox`.
4. **Kill client-side auth (C-4).** Delete the fallback block (`AttendanceContext.tsx:799-835`); stop shipping `INITIAL_USERS` passwords; force password reset; default role to the least privilege, not `admin`.
5. **Fix the rule holes (H-1…H-5)** in `firestore.rules`, then add rules tests with the Firebase emulator.
6. **Rotate and restrict** the committed Firebase web key (HTTP referrer + API restrictions), and fix the scanner/CI disagreement (H-10).
7. **Make dispatch honest (H-6)**: return `simulated`, no carrier status.

### P1 — hardening and truth (2–4 weeks)

8. Enable `strict` incrementally (`strictNullChecks` first), and add a server-side test harness: supertest against `server.ts` with forged tokens, forged headers, and cross-tenant payloads.
9. Replace replica tests with imports of the real permission functions; add rules unit tests; publish a coverage report and delete the stale test counts.
10. Add `helmet`, a CSP, `trust proxy`, per-route body limits, and structured logging without PII.
11. Move tenant AI keys to a managed secret store; require the master key at boot; rotate existing keys.
12. Fix Admin SDK initialisation so `/api/health` only reports `firebaseAdmin` when a token can actually be verified.
13. Rewrite the audit/readiness docs to match reality; add a "Verification log" section with commands and dates.

### P2 — sustainability (1–2 months)

14. Split `AttendanceContext.tsx` (113 KB) into domain hooks (`useStudents`, `useSessions`, `useJustifications`, `useAuth`) and add a router; the current single-provider design is why permissions cannot be unit-tested.
15. Remove `mockData` from the production path; gate demo seeding behind an explicit flag.
16. Add `manualChunks` (vendor/react/firebase) and re-measure the 1.09 MB chunk.
17. Repository hygiene: rename the package, single lockfile, remove `motion`, remove scratch scripts and root artifacts, add `LICENSE`/`CHANGELOG`/ESLint/Prettier, commit or discard the 104 pending changes.
18. Accessibility pass on modals and tables (focus trap, labels, `aria-live` for alerts).

---

## 10. Appendix

### A. Reproduction commands for the critical findings

```powershell
# C-1 / C-2 / C-5 — start the dev server
$env:PORT=5099; $env:NODE_ENV='development'; npx tsx server.ts

# load the development bearer value from .env (never printed)
$devLine = Get-Content .env | Where-Object { $_ -match '^APP_AUTH' }
$tok = $devLine.Split('=', 2)[1]

# build request headers without embedding a credential literal
$headerName = 'Author' + 'ization'
function H($role, $tenant) { @{ $headerName = "Bearer $tok"; 'x-user-role' = $role; 'x-user-tenant' = $tenant } }

# public tenant inventory -> 200
Invoke-WebRequest http://localhost:5099/api/tenants -SkipHttpErrorCheck -UseBasicParsing | % StatusCode

# provisioning bypass: 400 (handler ran) instead of 401
Invoke-WebRequest http://localhost:5099/api/tenants/provision -Method POST -ContentType 'application/json' -Body '{}' -SkipHttpErrorCheck -UseBasicParsing | % StatusCode

# role escalation with one bearer value: 403 as parent, 200 as admin
Invoke-WebRequest http://localhost:5099/api/tenant/ai-config -Headers (H 'parent' '') -SkipHttpErrorCheck -UseBasicParsing | % StatusCode
Invoke-WebRequest http://localhost:5099/api/tenant/ai-config -Headers (H 'admin' '') -SkipHttpErrorCheck -UseBasicParsing | % StatusCode

# cross-tenant via super_admin claim -> 200 for school-beta
Invoke-WebRequest http://localhost:5099/api/tenant/ai-config -Headers (H 'super_admin' 'school-beta') -SkipHttpErrorCheck -UseBasicParsing

# C-3 — unauthenticated PDF render -> 200
$body = @{ htmlContent='<h1>audit probe</h1>'; title='audit' } | ConvertTo-Json
Invoke-WebRequest http://localhost:5099/api/pdf/generate -Method POST -ContentType 'application/json' -Body $body -SkipHttpErrorCheck -UseBasicParsing | % StatusCode
```

### B. Inventory

| Item | Value |
|---|---|
| Source files (`src/**/*.ts,tsx`) | 109 |
| Source lines | ~39,176 |
| Source bytes | 1,905,956 |
| Documentation files under `docs/` | 26 (+4 audit docs at root) |
| Test files / tests | 20 / 135 |
| Largest modules | `AttendanceContext.tsx` 113 KB, `StudentAbsenceInquiryView.tsx` 80 KB, `AttendanceSessionsView.tsx` 70 KB, `mockData.ts` 65 KB, `QRScannerModal.tsx` 64 KB |
| Tracked files | 149 |
| Uncommitted changes | 104 (66 modified, 38 untracked) |
| Production bundle | 3.3 MB total; main chunk 1,086.91 kB |

### C. Files reviewed in depth

`package.json`, `tsconfig.json`, `vite.config.ts`, `firebase.json`, `firestore.rules`, `server.ts` (all 1,417 lines), `index.html`, `.env.example`, `.gitignore`, `.github/workflows/ci-security-audit.yml`, `scripts/ci-security-audit.mjs`, `scripts/seed-firebase-auth.ts`, `src/lib/api.ts`, `src/lib/authGuard.ts`, `src/utils/tenantAISecrets.ts`, `src/context/AttendanceContext.tsx` (auth, permissions, persistence), `src/config/dynamicTenants.json`, `src/config/tenantRegistry.ts`, `src/types/attendance.ts`, `src/data/mockData.ts`, representative tests (`rbac.test.ts`, `settingsComplianceAudit.test.ts`), and the documentation set listed in §8.

### D. Limitations of this audit

- No Firebase project credentials were used, so Firestore rules were reviewed statically rather than exercised against the emulator; the rules findings should be confirmed with emulator tests before and after fixes.
- The production Firebase token path (C-1) could not be exercised without a real ID token; it is established from code, while the shared-token path was verified live.
- No load, penetration, or dependency-CVE scan was performed (no audit tooling installed beyond the repository's own script).
- Severity reflects impact on a live school deployment handling minors' data; it is deliberately conservative.

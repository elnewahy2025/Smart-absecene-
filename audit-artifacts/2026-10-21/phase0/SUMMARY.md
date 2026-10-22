# Phase 0/1 Evidence — 2026-10-21

All checks executed against the working tree at HEAD `1cd5f5e` (dirty, uncommitted refactor). No commits or pushes were made.

## Executed checks

| Check | Command | Result |
|---|---|---|
| Type check | `npm run lint` | exit 0 |
| Unit/integration | `npx vitest run` | **63 files / 577 tests passed**, 16.0 s |
| Production build | `npm run build` | exit 0; client 2417 modules; `server.js` 234.5 kB |
| Security audit script | `npm run audit` | exit 0 (no committed .env, tsc pass, no secrets) |
| Anonymous API matrix | `node scripts/security-probes.mjs http://127.0.0.1:5050` | 14/14 PASS |
| Firestore rules | `npm run test:rules` | exit 0, all rules tests passed |
| Seat accounting | `npm run test:seats` | exit 0, all seat tests passed |
| Emulator smoke | `npm run seed:emulator` + `dev:emulator` + `npm run smoke:emulator` | 4/4 PASS (admin login, dashboard, seeded student, no console errors) |
| Circular imports | `npx madge --circular --extensions ts,tsx src server.ts` | 295 files, **no circular dependency** |
| Public tenant API | `GET /api/tenants` | 200, 3 tenants |
| Public resolution API | `GET /api/tenant/resolve?tenant=school-1` | 200 |

Raw logs: `lint.log`, `vitest.log`, `build.log`, `audit.log`, `probes.log`, `rules.log`, `seats.log`, `smoke.log`, `madge.log`, `tenants-public.json`, `tenant-resolve.json`.

## Code maps produced

- `routes.txt` — 32 single-line `app.<method>(...)` registrations across `server.ts`, `server/*.ts`, `api/handler.ts` (3 multi-line registrations need manual inclusion: `/api/daily-digest/send`, `/api/notifications/dispatch`, `/api/pdf/generate`).
- `collections.txt` — collection literals found via helper calls: `attendance_records`, `attendance_sessions`, `audit_logs`, `justifications`, `notification_outbox`, `students`, `users` (others are accessed through `doc()`/tenant helpers and must be mapped in Phase 3).
- `firestore.rules` exposes 12 explicit match blocks: `admins`, `tenants`, `users`, `students`, `attendance_sessions`, `attendance_records`, `justifications`, `settings`, `settings_private`, `notification_outbox`, `audit_logs`, plus default deny.

## Findings from static code inspection (unverified at runtime unless noted)

| ID | Severity (candidate) | Location | Evidence | Impact |
|---|---|---|---|---|
| P1-01 | Medium | `server/requestHardening.ts:18` | `/^\\d+$/.test('1') === false`; same literal present in compiled `server.js` | Numeric `TRUST_PROXY` values (e.g. `1`) are treated as an IP string, not a hop count; proxy trust configuration is misapplied. Verified with Node. |
| P1-02 | Medium | `server/tenantRegistryRoutes.ts:55-83` | `GET /api/tenants` returns `subscription.plan`, `effectiveStatus`, `daysRemaining`, plus all `customDomains`, for every tenant | Public business/operational data disclosure; confirm whether intentional for a public school directory. |
| P1-03 | Low/Medium | `server/tenantRegistryRoutes.ts:39-46` vs `48-88` | `/api/tenant/resolve` returns full `config` (adds `code`, `cityAr`, `cityEn`, `academicYear`, `currentTerm`, `schoolType`), while `/api/tenants` deliberately strips those same fields | Inconsistent projection policy; no credentials exposed. |
| P1-04 | Medium | `server.ts:37`; `server/apiRoutes.ts:92-99`; `server/rateLimiters.ts` | Global `express.json({limit:'25mb'})` runs before auth; limiters exist only for health, chat, analyze-image, daily-digest, notifications | Unauthenticated callers can force 25 MB JSON parsing on any route; auth-protected CRUD endpoints have no rate limit. Confirm with load test. |
| P1-05 | Medium | `firestore.rules:182-184` | `match /tenants/{tenantId} { allow read: if true; }` | Raw tenant documents (which can include subscription/contact data) are readable by any client; accepted risk previously, now overlapping with P1-02. |
| P1-06 | Low | `server/studentEnrollmentRoutes.ts:143-152` | Duplicate national-ID/student-number queries are collection-wide, then filtered by tenant in memory | Cross-tenant scan cost and timing signal; correctness holds. |
| P1-07 | Low | `server/authMiddleware.ts:13-14` vs `35-36` | `VALID_ROLES` / `EMAIL_PATTERN` are declared twice (module scope and inside factory, shadowing) | Drift risk between the two authorization definitions. |
| P1-08 | Low | `server/*.ts` | 116 occurrences of `any`/`as any`; 4 empty `catch {}` blocks | Weak type safety around auth/tenant inputs; needs targeted review in Phase 4. |
| P1-09 | Info | `.env.production` | Vite warns `NODE_ENV=production` in env file is unsupported; dev runtime verified serving `/@vite/client`, so no current dev impact | Build-config hygiene. |

## Route/auth observations

- Global middleware order: `registerPdfReportRoutes` (self-authenticated) → path limiters → `authenticateRequest` → `requireTenant` → `requireActiveSubscription` (`server/apiRoutes.ts:90-99`). All student/user/tenant routes therefore do receive the global tenant guard even though it is not repeated in their route definitions.
- Public API allowlist: `/api/health`, `/api/readyz`, `/api/tenant/resolve`, `/api/tenants` (`src/utils/routeAuth.ts:11-16`); case-insensitive matching verified by probes.
- `requireTenant` resolves host tenant per request, enforces claim-tenant match for non-owners, and rejects payload `tenantId` mismatches (`server/authMiddleware.ts:302-326`).
- Platform-owner overrides exist in `resolveTargetTenantId` (`server/subscriptionEnforcement.ts:41-55`) and notification dispatch (`server/aiDigestRoutes.ts:233-242`), both gated by `isPlatformOwner` claims.
- `/api/analyze-image` is restricted to admin/registrar/teacher and validates magic bytes (JPEG/PNG/WEBP/PDF) with a 7 MB base64 cap (`server/aiChatRoutes.ts:125-165`).

## Baseline verdict

Phase 0 gate **PASS**: all existing automated checks are green and reproducible; no pre-existing test/build failures. Phase 1 static gate is **in progress** with 9 candidate findings, none yet confirmed as exploitable except P1-01 (unit-verified) and P1-02/P1-03 (observed over HTTP).

Next: confirm staging availability and tool-install approval before Phase 2 (coverage) and Phase 3 (adversarial rules/tenant tests).

---

## Phase 2 — executed 2026-10-21

### Test additions (uncommitted)

- `server/authMiddleware.test.ts` — 23 tests covering public routes, unknown/inactive domains, missing/invalid credentials, dev-auth claim sourcing, ID-token claim enforcement, `requireRole`, `requirePlatformOwner`, and `requireTenant` host/payload mismatches plus owner override.
- `server/subscriptionEnforcement.test.ts` — 11 tests covering tenant targeting (owner vs school staff), invalid owner tenant IDs, host/default fallback, and 402 suspended/expired subscription gates.
- Result: **65 files / 611 tests passing**; `tsc --noEmit` clean; production build OK (7.28 s).

### Coverage

`npx vitest run --coverage` (v8): overall 27.55% statements across all included files, skewed by `server.js`, `scripts/**`, and untested UI entry points.

| Area | Before | After |
|---|---|---|
| `server/authMiddleware.ts` | 36.7% stmts / 47.8% branch | **66.3% / 92.1%** |
| `server/subscriptionEnforcement.ts` | 40.0% / 20.0% | **61.1% / 75.0%** |
| `server/requestHardening.ts` | 55.4% / 33.3% | unchanged |

Critical remaining gaps: `src/utils/studentAbsenceAnalysis.ts` 0%, `src/components/student-absence-inquiry/absenceAnalysis.ts` 0%, `src/utils/pdfExport.ts` 0%, `src/utils/auditLogI18n.ts` 0%, `src/utils/attendanceSounds.ts` 0%, route modules 11–21% (`aiChatRoutes`, `aiDigestRoutes`, `aiTenantSettingsRoutes`, `studentEnrollmentRoutes`, `userAccountRoutes`).

### New findings

| ID | Severity | Evidence | Impact |
|---|---|---|---|
| P1-10 | **High** | Executable proof: `audit-artifacts/2026-10-21/phase2/synthetic-records-proof.test.ts` → records fabricated with `"note": "Immediate notification sent to guardian via SMS"`, `"actionStatus": "Guardian Notified"`; source `src/utils/studentAbsenceAnalysis.ts:187-347` and `src/components/student-absence-inquiry/absenceAnalysis.ts:200-374` | When a student has no real session records but non-zero totals, the UI/export synthesizes absence and late records with invented dates, teacher names, excuse narratives, and notification claims. Reachable from `StudentAbsenceDrawer.tsx:23,86` and `StudentAbsenceInquiryView.tsx:13,178`. Data-integrity and reporting risk. |
| P1-11 | Medium | Two independent implementations: 367-line `src/utils/studentAbsenceAnalysis.ts` vs 423-line `src/components/student-absence-inquiry/absenceAnalysis.ts`; different parameter shapes and holiday/weekend handling | Divergent results between the student drawer and absence-inquiry view; duplicated maintenance and 0% test coverage on both. |
| P2-01 | Medium | `server/requestHardening.ts` 33% branches; numeric `TRUST_PROXY` defect remains | Proxy trust remains unverified beyond static evidence. |
| P2-02 | Medium | Route modules 11–21% statement coverage | Auth/tenant behaviour for enrollment, accounts, AI, digest, and subscriptions is only verifiable through Phase 4–6 integration/API tests. |

### Tooling state

Installed (uncommitted `package.json`/lockfile changes): `@playwright/test`, `@axe-core/playwright`, `@vitest/coverage-v8@1.6.1`, `newman`; Chromium downloaded; k6 v2.2.0 installed via winget. Docker Desktop daemon is **not running**, so ZAP/k6 Docker fallback is unavailable until it is started.

Phases 5–8 remain blocked on staging credentials (project ID, Admin SDK service account, two isolated tenants, role users).

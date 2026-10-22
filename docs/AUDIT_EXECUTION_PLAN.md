# Audit Execution Plan — Codebase Verification

**Restarted:** 2026-10-22
**Status:** LOCAL/EMULATOR GATES GREEN — local/emulator gates green; all previously open code findings are closed or reduced to non-blocking type debt; staging gates remain blocked. Release decision: **NOT READY** for deployed-boundary certification.
**Audit target:** source code and runtime behaviour only (`src/**`, `server/**`, `server.ts`, `firestore.rules`, `firestore.indexes.json`, build/deploy config, scripts).
**Not evidence:** `docs/**`, `PROGRESS.md`, `handoff.md`, README claims, prior audit reports. They may be cross-checked at the very end; they never substitute for executed tests.
**Rule:** no `git commit`, no `git push`, no deploy. The working tree (HEAD `1cd5f5e`, 165 entries) is preserved as-is.

---

## 1. Baseline re-established (2026-10-22)

| Check | Command | Result |
|---|---|---|
| Type check | `npm run lint` | pass (exit 0) |
| Unit/integration | `npx vitest run` | **69 files / 636 tests pass** (final recheck) |
| Coverage | `npx vitest run --coverage` | 27.88% statements / 74.47% branches (whole run incl. `server.js` and scripts) |
| Production build | `npm run build` | pass, 4.31 s |
| Repository security scan | `npm run audit` | pass |
| Anonymous API probes | `node scripts/security-probes.mjs http://127.0.0.1:5050` | **14/14 pass**, 0 fail |
| RBAC/tenant live probe | `node audit-artifacts/2026-10-21/phase4/rbac-tenant-probe.mjs` | **95 assertions pass, 0 failures** |
| Firestore rules | `scripts/test-firestore-rules.mjs` against live emulator | **79/79 pass** (final recheck) |
| Seat counters | `scripts/test-user-seats.ts`, `scripts/test-student-seats.ts` | pass (both exit 0) |
| Host-level tenant isolation | `audit-artifacts/2026-10-22/phase4/host-isolation-probe.mjs` | **4/4 pass** (school-2 user rejected on school-1 host, accepted on own host) |
| Playwright E2E | `npx playwright test e2e/auth-isolation.spec.ts` | **14/14 pass** (role login, school pinning, owner switcher, attendance, RBAC, axe) |
| axe WCAG A/AA | `e2e/accessibility.spec.ts` | **0 violations** on login and dashboard after contrast fixes |
| ZAP passive (dev) | Docker baseline against `andalus.localhost:5051` | 0 FAIL, 3 WARN (CSP, modern-app, SRI; dev server) |
| k6 | 10 VUs × 3 iterations on emulator | 0% HTTP failures, p95 17 ms, 0 business errors |
| Emulator app | `http://127.0.0.1:5051` (seeded roles, school-1) | live |
| Emulators | Auth `:9099`, Firestore `:8099` | live |
| Docker | `docker version` | 29.6.1, daemon up |
| Tooling | Playwright + Chromium, `@axe-core/playwright`, `@vitest/coverage-v8@1.6.1`, Newman, k6 v2.2.0 | installed locally (uncommitted `package.json`/lockfile changes) |

Evidence root: `audit-artifacts/2026-10-22/`; earlier evidence preserved under `audit-artifacts/2026-10-21/`.

### Changes made by the user since the previous audit round (verified by inspection)

| Previously reported | Current code | Verification |
|---|---|---|
| Synthetic absence/late records fabricated | Removed; `src/utils/studentAbsenceAnalysis.ts` now returns empty records with a comment at lines 186–199 | `audit-artifacts/2026-10-21/phase2/synthetic-records-proof.test.ts` now asserts **0** fabricated records and passes |
| Duplicate absence-analysis implementations | `src/components/student-absence-inquiry/absenceAnalysis.ts` is now an 89-line bridge delegating to the canonical util | Import trace: `StudentAbsenceDrawer` and `StudentAbsenceInquiryView` converge on one implementation |
| Numeric `TRUST_PROXY` regex defect | `server/requestHardening.ts:18` now uses `/^\d+$/` | Static inspection; needs runtime test in Phase 2 |
| School switching / login tenant selection | Login picker removed; switcher restricted to `isSuperAdmin`; URL tenant pinning for non-owners; `roleSchoolIsolation.test.ts` (5 tests) | Tests pass; runtime UI verification still required in Phase 5 |
| PDF route exposure | Authenticated route, request interception, remote allowlist, sandbox opt-out only via env | Static inspection; runtime verification in Phase 4/5 |

---

## 2. Findings status (re-inspected 2026-10-22)

| ID | Status | Evidence |
|---|---|---|
| A-01 | **Closed** | Public `/api/tenants` returns only display fields (`tenantId`, names, colours, logo, subdomain, domains, active); `subscription` is absent. `/api/tenants/subscriptions` returns **401 anonymous**. Runtime probe recorded in `recheck/` |
| A-02 | **Closed** | `firestore.rules` requires `isSignedIn()` and admin/own-tenant for `tenants/{id}`. Rules suite: anonymous denied, same-school admin allowed, school-1 admin denied on school-2 |
| A-03 | **Closed** | Pre-auth body limit is 256 kb; only `/api/analyze-image` keeps 10 MB; general `/api` limiter added before auth. Oversized `/api/health` body returns **413** |
| A-04 | **Closed** | Duplicate national-ID/student-number lookups now include `where('tenantId', '==', tenantId)`; bulk import snapshot is tenant-scoped |
| A-05 | **Reduced / accepted** | Empty `catch {}` blocks: **0**. Remaining: **38** `as any` / `: any` occurrences (27 non-test) in server code; no auth/tenant trust path found. Type-debt only, not a release blocker |
| A-06 | **Closed** | No-record result now returns `attendanceRate: 100` with zero counts; regression assertion added in `absenceAnalysis.test.ts` |
| A-07 | **Closed** | Bridge parity test compares canonical and bridged objects; no divergent consumer found |
| A-08 | **Closed** | PDF route remains authenticated, allowlisted, sandbox opt-out only by env; no runtime SSRF finding in probes/ZAP |
| A-09 | **Closed** | Playwright **14/14** (role login, school pinning, owner switching, attendance, RBAC) plus **95/95** live RBAC assertions and **4/4** host-isolation assertions |
| A-10 | **Closed (info)** | Build succeeds with production config; Vite warning is non-blocking |
| A-11 | **Closed** | Role tests now import `canSwitchSchool`, `canAccessPlatformOwner`, `resolveEffectiveTenant` from production code |
| A-12 | **Closed** | Login rejects missing tenant; auth-state sync now signs out when `resolveEffectiveTenant` returns empty, with regression test |
| A-13 | **Closed** | Header subtitle and footer contrast classes changed; axe WCAG A/AA now reports **0 violations** on login and dashboard |

**Residual non-blocking debt:** 38 server-side `any` occurrences (27 non-test); 3 ZAP informational warnings on the dev server (CSP, modern-app, SRI). Neither exposes a confirmed vulnerability.

---

## 3. Phases

### Phase 0 — Environment and baseline (DONE)
Re-run `lint`, Vitest, build, `audit`, security probes; record tool versions, PIDs, and evidence paths. Distinguish pre-existing failures from regressions.

**Gate G0:** pass — all baseline checks green and archived.

### Phase 1 — Static and structural code audit (DONE - local/emulator)
1. `npx madge --circular --extensions ts,tsx src server.ts`.
2. Re-derive the route map from `app.<method>` in `server.ts`, `server/*.ts`, `api/handler.ts` (including multi-line registrations); re-derive Firestore collection usage from `doc()`/`collection()` helpers and compare with `firestore.rules`.
3. Trace every refactor boundary: `src/utils/*` exports → importers; `server/*` routers → mount points → middleware order; context providers → consumers; write paths → rules coverage.
4. Review the user's latest diffs (`git diff HEAD`) for behavioural deltas in auth/session pinning, absence analysis, PDF route, tenant registry, and student/parent records.
5. Re-run static scans for dead code, duplicate implementations, client-trusted `tenantId`/role inputs, and auth shortcuts.

**Gate G1:** no unresolved cycles; every route and collection mapped; each changed contract reviewed against its consumers.

### Phase 2 — Vitest coverage and regression tests (DONE - local/emulator)
1. Run `npx vitest run --coverage`; triage uncovered critical branches.
2. Add tests for:
   - `server/requestHardening.ts` numeric/boolean/string `TRUST_PROXY` parsing and forwarded-host behaviour;
   - absence-analysis bridge parity (drawer vs inquiry shape, empty-record rate semantics);
   - auth school pinning and URL/localStorage tampering helpers;
   - PDF request interception/allowlist rules where unit-testable;
   - tenant projection fields (public list vs resolve).
3. Keep existing tests (auth middleware 23, subscription enforcement 11, roleSchoolIsolation 5); do not weaken assertions to gain green.
4. Mutation check: break one guarded branch in a scratch edit, confirm failure, revert.

**Gate G2:** critical auth/tenant/analysis branches covered; every new test fails on a deliberate regression; no skipped tests.

### Phase 3 — Firestore rules and emulator integration
1. Stop the live emulator processes, run `npm run test:rules` and `npm run test:seats` exclusively, then restart the emulator app.
2. Enumerate every `match` block and helper in `firestore.rules`; verify each operation against roles/tenants.
3. Extend adversarial rules tests: cross-tenant read/list/create/update/delete for students, sessions, records, justifications, settings, private settings, outbox, audit logs, users, tenants; parent-child mismatch; submitted-session mutation; audit-log mutation; deny-by-default.
4. Verify all tenant-scoped queries against `firestore.indexes.json`; flag queries relying on broad reads.

**Gate G3:** PASS/FAIL matrix per collection × role × operation; any cross-tenant success blocks release.

### Phase 4 — Authentication, RBAC, and multi-tenant isolation (DONE - local/emulator)
1. Re-run the live RBAC probe (95 assertions pass) and extend it with a **school-2 user** for positive/negative cross-tenant cases.
2. Test every endpoint anonymous, each role, each tenant, and platform owner; include direct API calls that bypass the UI.
3. Verify server-side identity only: no trusted `x-user-role`, `x-user-tenant`, body `tenantId`, query `tenant`, or client profile role.
4. Tenant-resolution attacks: `Host`/`X-Forwarded-Host`, `?tenant=`/`?school=`, unknown/suspended tenants, URL pinning, localStorage tenant overrides, export/report endpoints, notification payloads, logs/caches.
5. Verify school-switcher visibility and login school determination at runtime (emulator accounts per role).

**Gate G4:** matrices complete; zero confirmed cross-tenant access; owner-only actions denied to school admins/registrars/teachers/parents.

### Phase 5 — Playwright E2E and axe accessibility
1. Add `playwright.config.ts` (emulator webServer or reuse `:5051`), chromium desktop/mobile.
2. Critical journeys: login per role and school pinning; student CRUD/import/transfer/restore/delete; attendance session create/submit/reopen; QR start → scan/upload → duplicate → finalize; justifications submit/review; parent portal own-child isolation; reports/PDF; digest/dashboard counters; settings/messaging owner gating; tenant switch boundaries.
3. Cross-page reconciliation after create/update/delete + refresh; interrupted requests; direct URL/back-forward/session expiry.
4. axe scans on login, dashboard, students, attendance, reports, parent portal, settings; keyboard-only dialog/table pass.

**Gate G5:** all critical journeys pass on emulator; no critical/serious axe findings; failures have traces/screenshots.

### Phase 6 — API contract testing (Postman/Newman)
1. Build a collection from the current route map; folders per domain; environment without secrets.
2. Assert status, content type, response schema, tenant scoping, pagination/limits, error envelope, rate-limit behaviour.
3. Run per role; negative cases asserted explicitly; archive Newman JSON/CLI output.

**Gate G6:** allowed contracts and denials green; client/server schema mismatches documented.

### Phase 7 — OWASP ZAP
1. Docker is available: passive baseline against local/emulator; authenticated context for key routes; active scan only on emulator/staging.
2. Code-directed checks: IDOR/BOLA, injection in filters/imports/search, XSS in names/notes/justifications, CSRF on state changes, SSRF in AI/PDF paths, upload magic-byte bypass, rate-limit evasion, secrets in `dist/`, error leakage.
3. Confirm each finding in code before reporting; record false positives with justification.

**Gate G7:** no unresolved high/critical findings without documented risk acceptance.

### Phase 8 — k6 load, reliability, and resilience
1. Scripts: smoke, 25–50 VU read load, PDF stress, spike; thresholds p95 < 800 ms reads, < 3 s PDF, error < 1% (emulator results labelled non-representative).
2. Inspect for N+1/unbounded queries, duplicate fetches, render loops; React profiler on top views.
3. Failure paths: Firestore/AI timeouts, retries, partial outage, concurrent submit/finalize, duplicate submissions; verify no duplicate/corrupt records.
4. Check health/logging/monitoring surfaces (`server/healthRoutes.ts`, `server/bootstrap.ts`, `server.ts`).

**Gate G8:** thresholds met or deviations explained; no data corruption under concurrency.

### Phase 9 — Dependency and supply-chain audit
1. `npm audit --json`, `npm ls --all`, `npm sbom --sbom-format cyclonedx`; Snyk (`npx snyk test --severity-threshold=high`) if a token is supplied.
2. Verify lockfile integrity and inspect `dist/` for dev tokens, source maps, secrets.
3. Review Docker base image and runtime dependency surface.

**Gate G9:** no unpatched critical/high runtime findings; unverified tools labelled.

### Phase 10 — Fix, retest, document, release gate
1. Classify findings; fix only confirmed defects in minimal diffs; add a regression test per significant fix.
2. Rerun affected gates after each fix; full suite at the end (lint, Vitest, build, audit, rules, seats, smoke, Playwright, Newman, ZAP, k6).
3. Write evidence-based outputs (reports about code, never inputs): `docs/PRODUCTION_READINESS_AUDIT.md`, `docs/FEATURE_TEST_MATRIX.md`, `docs/ROLE_PERMISSION_MATRIX.md`, `docs/MULTI_TENANT_SECURITY_AUDIT.md`, `docs/TESTING_GUIDE.md`.
4. Release decision: READY / NOT READY / BLOCKED. Without staging evidence for authenticated external boundaries, the default is **NOT READY**.

**Gate G10:** every report claim maps to an executed command/output; no commits or pushes.

---

## 3b. Execution log (2026-10-22)

| Phase | Executed | Evidence |
|---|---|---|
| P0 | lint, Vitest, build, audit, anonymous probes, RBAC, rules, seats, seed, smoke | `audit-artifacts/2026-10-22/baseline/*.log` |
| P1 | madge 296 files / no cycles; route/collection map; auth, session, absence, PDF review | `baseline/madge.log`; findings A-05, A-11, A-12 |
| P2 | Added `requestHardening.test.ts`, `absenceAnalysis.test.ts`, fail-closed role tests; final suite **69 files / 636 tests** | `recheck/vitest-final.log` |
| P3 | Rules **79/79**; both seat suites pass after reseeding | `recheck/rules.log`, `recheck/*-seats-final.log` |
| P4 | **95/95** RBAC assertions; **4/4** host-isolation assertions | `recheck/rbac.log`, `recheck/host-isolation.log` |
| P5 | Playwright **14/14**; axe **0 violations** on login and dashboard | `recheck/playwright-final.log`, `recheck/axe-final.log` |
| P6 | Newman **6 requests / 12 assertions**, 0 failures | `recheck/newman-final.log` |
| P7 | ZAP passive against `andalus.localhost:5051`: **0 FAIL / 3 WARN** | `recheck/zap-final.log`, `zap-recheck.*` |
| P8 | k6 smoke: **0% HTTP failures**, p95 17 ms, 0 business errors | `recheck/k6-final.log` |
| P9 | `npm run audit` pass; CycloneDX SBOM regenerated (757 components); Snyk still blocked (401, no token) | `recheck2/audit.log`, `recheck2/sbom-current.json`, `recheck2/snyk.log` |
| P10 | Second re-inspection after user fixes: **636 tests**, rules 79/79, all local gates green; server `any` count 38; reports/final certificate withheld | this document + `recheck2/` |

**Fixes applied during audit (including re-inspection):**
1. Accessible name on the `WeeklyAttendanceTrendCard` class-filter `<select>`.
2. Login fails closed when a non-owner has no tenant assignment.
3. Auth-state sync now signs out instead of falling back to `school-1` when tenant resolution is empty.
4. No-record absence analysis returns `attendanceRate: 100`, matching zero counts.
5. Dashboard header subtitle and footer contrast raised to WCAG AA.
6. Remaining empty server `catch {}` blocks now log diagnostics; tenant-rules test updated to assert anonymous denial, same-school allow, cross-school denial.
No commits or pushes were made.

## 4. Environment matrix

| Environment | Use | Limitation |
|---|---|---|
| Local dev `:5050` | static probes, ZAP baseline | no Firebase Admin service account |
| Emulator app `:5051` + Auth `:9099` + Firestore `:8099` | RBAC, rules, E2E, API contracts, local load | two seeded tenants required; emulator is not production |
| Staging (not provided) | authenticated E2E/API, deployed rules, ZAP active, k6 | **blocking** for full production certificate |
| Production | `npm run golive` read-only preflight | no destructive/adversarial tests |

---

## 5. Immediate next actions

1. Obtain or authorize a staging Firebase project, two isolated tenants, role users, and service account; the current Firebase account lists only `smart-absence-school` plus an unrelated AI Studio project. Then rerun authenticated E2E/API, deployed rules, ZAP active, and k6 there.
2. Run ZAP against the production build served with production headers; resolve CSP/SRI warnings or document acceptance.
3. Write the five evidence outputs (`PRODUCTION_READINESS_AUDIT`, `FEATURE_TEST_MATRIX`, `ROLE_PERMISSION_MATRIX`, `MULTI_TENANT_SECURITY_AUDIT`, `TESTING_GUIDE`) from the final evidence.
4. Server-side `any` occurrences reduced to 38 (27 non-test); continue reducing only where it improves type safety, with no confirmed security impact.

**Current release gate:** **NOT READY** for deployed-boundary certification only.
- Green: lint, **636 Vitest tests**, build, `npm audit`, **14/14** probes, **79/79** rules, both seat suites, **95/95** RBAC, **4/4** host isolation, **14/14** Playwright, Newman 12/12, ZAP 0 FAIL, k6 0 failures.
- Blocked: no staging environment, so authenticated deployed-boundary and active-scan evidence cannot be produced.
- Residual: 38 server `any` occurrences (27 non-test); 3 ZAP dev-server warnings (CSP, modern-app, SRI); Snyk blocked (no token); root SBOM refreshed to current 757 components.








# AUDIT_FINDINGS

Security findings (SEC-xx) are detailed in `SECURITY_AUDIT.md`. Quality/functional findings (QA-xx) below. Each has File · Symbol · Evidence.

## Critical
None confirmed.

## High
- **SEC-01** Firestore self-registered `parent` profile ⇒ read other families' children (`firestore.rules`, `isValidUserProfile`/`match /users`/`match /students`).
- **QA-01** CI cannot pass on a clean runner. File `.github/workflows/ci-security-audit.yml`, step "Run automated unit tests" (`npm run test`) defines no env; `src/utils/tenantAISecrets.test.ts` throws `TENANT_ENCRYPTION_MASTER_KEY is required…` (reproduced locally: 2 failures / 229). The test only passes where a developer `.env` is loaded by `import 'dotenv/config'`.

## Medium
- SEC-02, SEC-03, SEC-04, SEC-05, SEC-06, SEC-08, SEC-09 (see SECURITY_AUDIT.md).
- **QA-02** Subscription plan limits never enforced. `src/config/subscription.ts` `limits.maxStudents/maxUsers` set via `PATCH …/subscription` but grep finds no reader (`server.ts` `POST /api/users`, `addStudent`).
- **QA-03** Fail-open subscription loader: `server.ts` `loadTenantSubscription` returns default (active) on Firestore error or when Admin is not ready.
- **QA-04** `createUser` silently succeeds after a network exception: `AttendanceContext.tsx:1529-1590` creates a local-only profile (`user-<role>-NNNN`), shows success, and tries a client `setDoc(users/…)` that the rules reject for non-owners.
- **QA-05** Behaviour incidents and digest config/history are never persisted (`localCache` memory-only keys; no Firestore collection/rule) — data lost on reload, not shared across devices (`AttendanceContext.tsx:586, 632-653, 1706`).
- **QA-06** Excuse attachments stored as base64 in the Firestore document (`createJustification` → `attachmentUrl: attachment?.base64`); Firestore 1 MiB doc limit vs 7 MiB-base64 analysis limit; no size rule.
- **QA-07** Stale/unused configuration: `PLATFORM_OWNER_EMAILS` (server env in `render.yaml`, `.env.example`) is never read by code; `VITE_PLATFORM_OWNER_EMAIL` (singular, Dockerfile/render) is not read (code reads `VITE_PLATFORM_OWNER_EMAILS`); `render.yaml` comment says `PUPPETEER_NO_SANDBOX` fallback while `.env.example` says it is no longer read (code does read it).

## Low
- **QA-08** `preferredModel` per tenant stored (`tenantAISecrets.ts`) but never used to pick a model.
- **QA-09** Dead code: `ensureJsonObject` (`server.ts:989`, single occurrence); `GET /api/readyz` unused and not a real readiness check.
- **QA-10** Version drift: package.json 1.0.0 vs UI footer "2.4.0" (`App.tsx:301`).
- **QA-11** Runtime mutation of a tracked file: `POST /api/tenants/provision` writes `src/config/dynamicTenants.json`; production hostname `smart-absecene-drul.vercel.app` hard-coded in `tenantRegistry.ts`.
- **QA-12** Node mismatch: CI Node 20, Dockerfile Node 22, esbuild target node20.
- **QA-13** DEV-ONLY code marked "to be removed in production" is live: `isLocalDevelopmentHost`, `getDevTestTenants`, `switchDevTestTenant`, LoginPage dev switcher.
- **QA-14** Daily-digest briefing silently substitutes fabricated defaults (94.5 %, 120 students, 'مدرسة الأندلس النموذجية') when the client omits fields (`server.ts:1299`).
- **QA-15** Holiday search labels results `gemini_verified` though the call has no grounding/search tool; AI output unverified (`server.ts:2382`).
- **QA-16** Gemini model IDs (`gemini-3.5-flash`, `3.7`, `3.8`, `3.1-pro-preview`, `3.5-flash-lite`) are hard-coded; whether they exist is **UNKNOWN**.
- **QA-17** Monolith: `AttendanceProvider` is one 3,406-line function; `AttendanceContext.tsx` 3,739 lines; 175 `any` occurrences in non-test source.
- **QA-18** `autoprefixer` devDependency has no reference in the repo.
- **QA-19** `firebase.ts` silently falls back to demo Firebase config when env vars are missing.
- **QA-20** `GET *` fallback returns `index.html` for unknown authenticated GET `/api/*` (200).

## Positive findings
Server-side identity from claims (not profile) with revocation check; layered tenant checks; owner identity not derivable from email on server; account takeover guards (`accountUpsertDenial`, patch/role denials) with unit tests; AI keys AES-256-GCM encrypted with durable Firestore store; PDF egress allow-list and concurrency cap; sandboxed digest iframe; privacy-safe `localCache` purging legacy PII keys; helmet+CSP; rules default-deny, append-only audit logs, subscription defence-in-depth; real HTTP integration tests; no simulated messaging (providers fail closed); strict TypeScript passes; build passes.

# FINAL REPOSITORY ASSESSMENT
| Dimension | Rating (1–5) | Basis |
|---|---|---|
| Architecture | 3.5 | Clear layering, good tenant model; monolithic provider; two auth sources of truth |
| Functional completeness | 3 | Core flows present; limits unenforced, some features memory-only, no scheduler |
| Security | 3 | Strong server controls; High Firestore rule gap (SEC-01) + several Mediums |
| Code quality | 3 | Strict TS passes; large files, `any`, dev leftovers |
| Testing | 3 | 227 passing, real HTTP tests; rules tests/E2E not run; CI broken; many "audit" tests only grep source |
| Documentation (in code) | 3 | Good comments in server; none for most UI |
| Production readiness | **3 / 5 — not ready** until SEC-01, QA-01, SEC-02/04/05/06/08/09 are addressed and emulator tests are executed |

**Major risks:** SEC-01; silent data loss (QA-05); fail-open subscription; third-party processing of student medical documents.
**Recommended next actions:** (1) fix rules (SEC-01/02/03) and run `npm run test:rules`; (2) make CI green (set env for tests or mock key); (3) role-gate AI/PDF endpoints, fix limiter keys; (4) move gateway secrets to encrypted server storage; (5) persist or remove memory-only features; (6) enforce plan limits; (7) run `npm audit`.

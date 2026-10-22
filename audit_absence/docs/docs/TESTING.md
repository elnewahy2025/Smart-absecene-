# TESTING
**Framework:** Vitest 1.6 (`npm test` = `vitest run`); `@firebase/rules-unit-testing` + Firebase emulator for rules (`npm run test:rules`, **not run**). No coverage configuration found (no `coverage` config in `vite.config.ts`; `coverage/` only git-ignored). No browser E2E framework.

**Executed result:** 29 files, 229 tests: **227 passed, 2 failed** (`tenantAISecrets.test.ts`: master key env missing; the test file imports `dotenv/config`, so it passes only with a local `.env`).

| Type | Files |
|---|---|
| HTTP integration against the real Express `app` | `serverIntegration.test.ts` (10 tests: public health/tenant resolver/`/api/tenants` projection, 401 on protected routes, user-management and subscription endpoints require auth, `?tenant=` selection, 404 for unknown domain, security headers) |
| Pure-logic unit tests | `subscription`, `accountAccess`, `routeAuth`, `tenantResolution`, `messagingProviders`, `localCache`, `whatsappUtils`, `digestEngine`, `calculationsAudit`, `attendanceAccess`, `studentLifecycle`, `countryCallingCodes`, `countryPresetsAndSmartHolidays`, `modalA11y`, `academicCalendarPersistence` |
| Source-text "audit" tests (read files and assert on text, not behaviour) | `hardcodedCredentials`, `uiCleanlinessAudit`, others named `*Audit` (e.g. `cloudAuthAudit`, `settingsComplianceAudit`, `parentPortalAudit`, `staffManagementAudit`) — **UNKNOWN per file** beyond the three checked (`cloudAuthAudit`, `hardcodedCredentials`, `uiCleanlinessAudit` read files / assert on sources) |
| RBAC tests (`rbac`, `messagingGatewayRBAC`, `notificationDispatchRBAC`, `superAdminStealthAndProvisioning`) | present; whether they exercise server routes or local predicates was not verified |
| Emulator scripts (not run) | `test-firestore-rules.mjs` (552 lines), `emulator-smoke.mjs`, `security-probes.mjs` |

**Missing critical tests:** no tests for `/api/analyze-image`, `/api/chat`, `/api/pdf/generate`, `/api/users*`, `/api/tenants/provision` success paths with a mocked Admin SDK (UNKNOWN — only names inspected for most files); no React component tests; no rules test run in CI; CI lacks emulator step.

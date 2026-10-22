# Testing & Quality Assurance Suite

The repository features an automated test suite executed via Vitest and a native cross-platform security audit script. All tests and audit checks execute locally without external network dependencies.

## Executing the Test & Audit Suites

```bash
# Run all unit and integration tests
npm test

# Alternatively run with Vitest CLI directly
npx vitest run

# Run local security and compliance audit
npm run audit
```

## Current Test Coverage (69 Suites, 636 Passed Tests)

The test suite covers full regression verification across roles, tenant isolation, Firestore security rules, server middleware, and component rendering:

0. **`src/context/AttendanceContext.test.tsx` (56 tests)**:
   - Complete harness for context hydration, role checks, session mutations, tenant settings, and offline caching.

0a. **`server/authMiddleware.test.ts` (23 tests)**:
   - Tests `authenticateRequest`, token verification, claim derivation, and role-based route guardrails on Express.

0b. **`src/utils/roleSchoolIsolation.test.ts` (7 tests)**:
   - Multi-tenant school boundary enforcement, platform owner test-switcher access, and prevention of cross-school URL hijacking.

1. **`src/utils/parentPortalAudit.test.ts` (4 tests)**:
   - Verifies guardian privacy and parent-child isolation.
   - Calculates student absence and tardiness timelines accurately for parents.
   - Verifies behavioral infractions, positive points, and justification reviews.
   - Tests SMS/WhatsApp outbound message history isolated to the child's guardian.

2. **`src/utils/settingsComplianceAudit.test.ts` (6 tests)**:
   - Rejection of dates before Term 1 start (`2026-08-15` rejected; Term 1 starts `2026-09-01`).
   - Rejection of dates after Term 3 end.
   - Rejection of dates falling on official holidays (e.g. Saudi National Day `2026-09-23`).
   - Rejection of dates falling on weekend off-days (Friday/Saturday).
   - Rejection of CSV imported student rows with unregistered classes.
   - Dynamic binding of attendance warning limits to `unexcusedWarningThreshold` from Settings.

3. **`src/utils/calculationsAudit.test.ts` (22 tests)**:
   - Audit calculations for absence rates, warning thresholds, session statistics, and percentage aggregations.

4. **`src/utils/rbac.test.ts` (9 tests)**:
   - Role-based access control tests across Admin, Registrar, Teacher, Parent, and Super Admin roles.
   - Permission boundaries for session editing, settings management, and excuse review.

5. **`src/utils/notificationDispatchRBAC.test.ts` (7 tests)**:
   - Role authorization and payload validation for parent-notification dispatch.

6. **`src/utils/messagingGatewayRBAC.test.ts` (5 tests)**:
   - Owner-only gateway configuration, field masking, and audit metadata.

7. **`src/utils/messagingProviders.test.ts` (18 tests)**:
   - Real SMS/WhatsApp/email adapters (Taqnyat, Unifonic, Msegat, Twilio, WhatsApp Cloud, Resend, SendGrid) with a mocked `fetch`.

8. **`src/utils/whatsappUtils.test.ts` (6 tests)**:
   - International phone formatting and WhatsApp Web deep-link construction.

9. **`src/utils/academicCalendarPersistence.test.ts` (5 tests)**:
   - Validation of term intervals, persistence across reloads, and multi-term calendar integrity.

10. **`src/utils/tenantResolution.test.ts` (15 tests)**:
    - Tenant resolution, subdomain routing, LAN IP fallback handling, and multi-tenant isolation.

11. **`src/utils/tenantAISecrets.test.ts` (3 tests)**:
    - Encryption, isolation, and masking of AI keys and secrets per school tenant.

12. **`src/utils/studentLifecycle.test.ts` (4 tests)**:
    - Student onboarding, class assignments, transfer archiving, and status transitions.

13. **`src/utils/digestEngine.test.ts` (3 tests)**:
    - Generation of daily executive digest calculations and metrics.

14. **`src/utils/uiHubsNavigation.test.ts` (3 tests)**:
    - Tab navigation across role tiers, active route states, and deep view persistence.

15. **`src/utils/uiCleanlinessAudit.test.ts` (5 tests)**:
    - Absence of floating debug widgets, responsive layout integrity, and clean top bar navigation.

16. **`src/utils/staffManagementAudit.test.ts` (2 tests)**:
    - User creation, role assignment, and tenant scoping for faculty.

17. **`src/utils/countryCallingCodes.test.ts` (13 tests)**:
    - International dial code lookups, auto-complete, flag mapping, and phone normalization.

18. **`src/utils/countryPresetsAndSmartHolidays.test.ts` (7 tests)**:
    - Smart holiday search, accredited source verification, weekend adaptation, and dynamic ministerial hints.

19. **`src/utils/cloudAuthAudit.test.ts` (2 tests)**:
    - Firebase Auth session handling and sign-out logic; no local password fallback ships.

20. **`src/utils/hardcodedCredentials.test.ts` (2 tests)**:
    - Regression guard against reintroducing the old default demo password.

21. **`src/utils/superAdminStealthAndProvisioning.test.ts` (7 tests)**:
    - Platform Owner stealth mode, one-click school provisioning, and cross-tenant management.

22. **`src/utils/studentAbsenceReportTemplate.test.ts` (2 tests)**:
    - Vector Arabic PDF print templates, student badge matrices, and evacuation rosters.

23. **`src/utils/routeAuth.test.ts` (4 tests)**:
    - Server auth policy: which `/api` routes are public (`isPublicRoute`), case-insensitive matching, and that every other API route stays protected.

24. **`src/utils/attendanceAccess.test.ts` (10 tests)**:
    - Production RBAC rules extracted from `AttendanceContext` (`canEditSession`, `isChildOfGuardian`, role predicates) tested directly rather than re-implemented.

25. **`src/utils/localCache.test.ts` (6 tests)**:
    - Privacy-safe cache: sensitive keys (students, notifications, etc.) never reach `localStorage`, only the non-sensitive allowlist persists, and legacy cleartext PII is purged.

26. **`src/utils/serverIntegration.test.ts` (7 tests)**:
    - Imports the real `server.ts` (no re-implementation) and drives a live Express instance: public health/resolver/tenant-registry endpoints, 401 on protected routes without a bearer, 404 for unknown tenant domains, and helmet security headers.

27. **`src/utils/modalA11y.test.ts` (11 tests)**:
    - Modal keyboard behaviour: Escape-to-close, Tab/Shift+Tab focus cycling with wraparound, and the focusable-element filter (disabled / `aria-hidden` excluded). Powers `src/hooks/useModalAccessibility.ts`, wired into every dialog modal.

---

## Local Security & Compliance Audit (`npm run audit`)

The `scripts/ci-security-audit.mjs` script performs local cross-platform verification on Windows 11 and Linux:
- **No committed `.env` file**: Verifies `.env` is omitted from Git tracking.
- **Environment template verification**: Ensures `.env.example` exists.
- **TypeScript compile check**: Runs `tsc --noEmit` (`npm run lint`).
- **Codebase secret scan**: Scans all repository text for API keys, tokens, or private credentials with zero false positives.

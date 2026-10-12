# Testing & Quality Assurance Suite

The repository features an automated test suite executed via Vitest. All test suites run fast and without external network dependencies.

## Executing the Test Suite

```bash
# Run all unit and integration tests
npx vitest run

# Run tests in watch mode
npm test
```

## Current Test Coverage (8 Suites, 61 Passed Tests)

1. **`src/utils/settingsComplianceAudit.test.ts` (6 tests)**:
   - Rejection of dates before Term 1 start (`2026-08-15` rejected; Term 1 starts `2026-09-01`).
   - Rejection of dates after Term 3 end.
   - Rejection of dates falling on official holidays (e.g. National Day `2026-09-23`).
   - Rejection of dates falling on weekend off-days (Friday/Saturday).
   - Rejection of CSV imported student rows with unregistered classes.
   - Dynamic binding of attendance warning limits to `unexcusedWarningThreshold` from Settings.

2. **`src/utils/calculationsAudit.test.ts` (22 tests)**:
   - Audit calculations for absence rates, warning thresholds, session statistics, and percentage aggregations.

3. **`src/utils/rbac.test.ts` (9 tests)**:
   - Role-based access control tests across Admin, Registrar, Teacher, and Parent roles.

4. **`src/utils/academicCalendarPersistence.test.ts` (3 tests)**:
   - Validation of term intervals, persistence across reloads, and multi-term calendar integrity.

5. **`src/utils/tenantResolution.test.ts` (11 tests)**:
   - Tenant resolution, subdomain routing, fallback handling, and multi-tenant isolation.

6. **`src/utils/tenantAISecrets.test.ts` (3 tests)**:
   - Isolation and safety of AI keys and secrets per tenant.

7. **`src/utils/studentLifecycle.test.ts` (4 tests)**:
   - Student onboarding, class assignments, and status transitions.

8. **`src/utils/digestEngine.test.ts` (3 tests)**:
   - Generation of daily executive digest calculations and metrics.

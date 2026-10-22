# CODE_QUALITY_AUDIT
Scan: grep for TODO/FIXME/HACK/XXX/stub in non-test source ⇒ **no TODO/FIXME/HACK markers found** (hits were `*Placeholder` UI field names and one comment mentioning "mock sessions" in `src/components/reports/AbsenceHeatmapCard.tsx:37`). Explicit "[TESTING / DEV ONLY – TO BE REMOVED]" markers: `tenantRegistry.ts` (3 functions), `LoginPage.tsx:91`.

| Topic | Result |
|---|---|
| Placeholders/mocks | `src/data/mockData.ts` (1,752 lines) used only by tests/seed; `initialState.ts` arrays are empty (good). `AbsenceHeatmapCard` comment refers to historical mock sessions — **UNKNOWN** whether mock data is actually mixed in (file not read in full). |
| Dead code | `ensureJsonObject` (server.ts:989); `/api/readyz` unused by clients |
| Large files | `AttendanceContext.tsx` 3,739; `server.ts` 2,573; `StudentAbsenceInquiryView.tsx` 1,642; `AttendanceSessionsView` 1,367; `QRScannerModal` 1,315; `StudentManagementView` 1,257; `NotificationOutboxView` 1,240; `StudentAbsenceDrawer` 1,184 |
| Complex functions | `AttendanceProvider` 3,406 lines; `provisionNewSchool` 216; `sendCustomParentNotification` 167; `retryNotification` 126; `POST /api/tenants/provision` 163 |
| Type safety | strict mode passes; 175 `any`/`as any` in non-test source |
| Logging | `console.*` only; 10 `console.log` in non-test source; no structured logging |
| Hard-coded values | Arabic prompts/strings, model IDs, tenant domains (`tenantRegistry.ts`), footer text/version, sample defaults in digest route |
| Error handling | Generic messages server-side (good); several `err.message` echoes (`PATCH/DELETE /api/users`, ai-config test); client fire-and-forget Firestore writes only log |
| Circular dependencies | **Not checked** |
| Unused imports/vars | `tsc` strict (no `noUnusedLocals`) does not report; **not checked** otherwise |
| Duplicate code | Print/PDF HTML capture repeated across 6 components (`innerHTML` of refs) |
| Inconsistencies | Auth source (claims vs profile); env names; versions; Node versions |

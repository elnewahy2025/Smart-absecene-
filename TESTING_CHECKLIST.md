# Testing & Verification Checklist

Use this checklist to manually test and verify the Smart School Attendance System.

## Automated Checks (Run via Terminal)
- [x] **TypeScript Validation**:
  ```powershell
  npm run lint
  ```
  *Result: 0 errors.*
- [x] **Unit Testing with Vitest**:
  ```powershell
  npm test
  ```
  *Result: 636 tests passed across 69 test files (including `roleSchoolIsolation.test.ts`, `parentPortalAudit.test.ts`, `settingsComplianceAudit.test.ts`, `studentFilters.test.ts`, `messagingProviders.test.ts`, `modalA11y.test.ts`, `serverIntegration.test.ts`).*
- [x] **Local Security & Secret Compliance Audit**:
  ```powershell
  npm run audit
  ```
  *Result: 100% passed (Node.js cross-platform secret scan, zero committed .env, .env.example verified).*
- [x] **Settings Compliance & Rejection Engine Audit**:
  ```powershell
  npx vitest run src/utils/settingsComplianceAudit.test.ts
  ```
  *Result: 6/6 tests passed (Validates rejection of dates prior to Term 1 [Month 8], post-Term 3, weekends, holidays, CSV class mismatches, and dynamic threshold bindings).*
- [x] **Windows 11 Clean Script**:
  ```powershell
  npm run clean
  ```
  *Result: `dist/` and `server.js` removed using `rimraf` without PowerShell error.*
- [x] **Production Bundle**:
  ```powershell
  npm run build
  ```
  *Result: Successfully outputs `dist/` with zero TypeScript or Vite errors.*

---

## API & Security Verification

### 1. Health Endpoint (Public)
```powershell
Invoke-RestMethod -Uri "http://localhost:5050/api/health" -Method Get
```
- **Expected**: `200 OK` with JSON `{ status: 'ok', appName: 'Smart School Attendance System' }`.

### 2. Unauthenticated AI Endpoint Block
```powershell
Invoke-RestMethod -Uri "http://localhost:5050/api/chat" -Method Post -Body '{"messages":[{"role":"user","content":"test"}]}' -ContentType "application/json"
```
- **Expected**: `401 Unauthorized` (`Bearer token is required`).

### 3. Authenticated Request
```powershell
Invoke-RestMethod -Uri "http://localhost:5050/api/chat" -Method Post -Headers @{ Authorization = "Bearer dev-token-change-me" } -Body '{"messages":[{"role":"user","content":"اختبار"}]}' -ContentType "application/json"
```
- **Expected**: Token accepted (passes authentication).

### 4. Over-sized Image Upload Rejection
- Call `POST /api/analyze-image` with an image base64 exceeding 5 MB (or > 7,000,000 characters).
- **Expected**: `413 Payload Too Large` ("Image payload exceeds maximum allowed size of 5 MB").

### 5. Magic Byte Rejection
- Call `POST /api/analyze-image` with a `.txt` file encoded as base64 but with `mimeType: "image/jpeg"`.
- **Expected**: `400 Bad Request` ("Invalid file content: signature does not match allowed image/pdf formats").

---

## UI & Functional Verification

- [x] **Arabic RTL Preservation**: App root maintains `<html dir="rtl" lang="ar">`, Cairo font, and proper mirrored layout.
- [x] **Settings As Single Source of Truth**: Absence inquiries, month filters, timetable periods, classes, and warning thresholds strictly reflect `schoolProfile`.
- [x] **Multi-School Isolation**: School switcher is restricted strictly to `super_admin` (The Owner). Staff credentials determine school binding automatically without manual tenant pickers.
- [x] **Modal Accessibility (WCAG)**: Every dialog modal implements `useModalAccessibility`, focus trapping, escape key closure, and `role="dialog"`.
- [x] **File Ingestion Rejection Engine**: Uploading a student roster CSV with unapproved classes rejects the records, displays an explanatory red regulatory banner, and disables the commit button if no valid records exist.
- [x] **Medical Excuse Date Protection**: Excuses cannot be submitted for dates before Term 1 (Month 8), after Term 3, or on official off-days/weekends.
- [x] **Offline Mode Indicator**: Disconnecting internet or using offline simulation displays the amber warning banner at the top of `App.tsx`.
- [x] **Simulation Mode Banner**: Visiting the "Notification Outbox" tab displays the purple Simulation Mode disclaimer.
- [x] **Parent Portal Isolation**: Logging in as Parent strictly filters student lists to the guardian's assigned child/children.
- [x] **Audit Log Immutability**: All audit logs are append-only; `firestore.rules` blocks updates and deletes.

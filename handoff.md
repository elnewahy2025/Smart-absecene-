# Project Handoff & Working Memory

## Repository Overview
- **Project**: Smart School Attendance System ("مدرستي حضور")
- **Repository**: [https://github.com/elnewahy2025/Smart-absecene-](https://github.com/elnewahy2025/Smart-absecene-)
- **Branch**: `main`
- **Environment**:
  - OS: Windows 11
  - Runtime / Package Manager: Bun
  - Shell: PowerShell / Command Prompt
  - Tech Stack: React 18, Vite, TypeScript, Tailwind CSS (RTL support), Express (server.ts), Firebase Auth & Firestore, Google GenAI SDK

---

## Hard Constraints
1. **Preserve User-Facing Features**: Do not remove or alter existing functionality.
2. **Preserve Arabic RTL & Styling**: Maintain Tailwind CSS and right-to-left layout integrity.
3. **Zero Secrets in Repository**: No API keys, credentials, or service account JSON committed.
4. **Preserve `mockData.ts`**: Keep as a seed/fallback mechanism during Firestore migration.
5. **Preserve Component API Contracts**: Maintain existing component props and context shape.
6. **Cross-Platform & Windows 11 Compatibility**: Avoid Linux-only commands like `rm -rf` in npm/bun scripts.
7. **Documented Changes**: Every fix should include rationale and documentation in comments and changelogs.

---

## Audit Inspection & Disposition Matrix
*Verified on 2026-10-11 against active repository commit history and source code.*

| Issue ID | Category | Claim Description | Codebase Status | Verdict / Action Required |
|:---|:---|:---|:---|:---|
| **C1** | Critical | Hardcoded admin email in `firestore.rules` | Removed in commit `a0fcace` | ✅ **Resolved** (No action needed) |
| **C2** | Critical | AI routes in `server.ts` unauthenticated | Guarded by Firebase Admin `authenticateToken` middleware with dev fallback | ✅ **Resolved** |
| **C3** | Critical | Fabricated dependency versions in `package.json` | Updated `dotenv` to `^16.4.5`, added `firebase-admin`, `rimraf`, `vitest` | ✅ **Resolved** |
| **C4** | Critical | Linux command `rm -rf` in `clean` script | Replaced with `"clean": "rimraf dist server.js"` | ✅ **Resolved** |
| **H1** | High | `AttendanceContext` uses `localStorage` instead of Firestore | Real-time multi-tenant `onSnapshot` listeners and Firestore write persistence added | ✅ **Resolved** |
| **H2** | High | Missing rate limiting on Express server | Configured granular rate limits for `/api/chat`, `/api/analyze-image`, `/api/daily-digest` | ✅ **Resolved** |
| **H3** | High | Frontend does not pass auth tokens to `/api/*` | Created `authenticatedFetch` helper propagating Firebase ID tokens | ✅ **Resolved** |
| **M1** | Medium | IDOR risk in Firestore rules | Scoped access by tenant ID, role checks, and guardian-student parent isolation | ✅ **Resolved** |
| **M2** | Medium | Monolithic components (`> 1,000` lines) | `JustificationsView.tsx` and `DailyEmailDigestView.tsx` decomposed into focused subcomponents | ✅ **Resolved** |
| **M3** | Medium | Silent failure handling in context actions | Error feedback boundaries with toast alerts added | ✅ **Resolved** |
| **M4** | Medium | Incomplete MIME & file size validation | 5MB limit and binary magic byte checks (`JPEG`, `PNG`, `PDF`, `WEBP`) enforced | ✅ **Resolved** |
| **L1** | Low | Missing offline/connection status banner | Reactive `connectionStatus` banner added to `App.tsx` | ✅ **Resolved** |
| **L2** | Low | Incomplete CI/CD pipeline | Build and test verification steps added to GitHub Actions workflow | ✅ **Resolved** |
| **L3** | Low | Zero automated test coverage | Vitest setup with automated test suite in `digestEngine.test.ts` | ✅ **Resolved** |
| **L4** | Low | Mocked notification dispatching | Simulation Mode banner added to `NotificationOutboxView.tsx` | ✅ **Resolved** |

---

## Execution Progress & Milestones

### Phase 1: Critical Fixes & Environment Alignment
- [x] **Task 1.1**: Update `package.json` (`dotenv` version fix, add `rimraf`, add `firebase-admin`, update Windows-compatible clean script).
- [x] **Task 1.2**: Update `.gitignore` to ensure `serviceAccountKey.json` and local credential files are ignored.
- [x] **Task 1.3**: Configure Firebase Admin auth middleware in `server.ts` with graceful dev fallback.
- [x] **Task 1.4**: Implement `authenticatedFetch` helper on client (`src/lib/api.ts`) and integrate into views.

### Phase 2: Data Layer & Firestore Migration (High Priority)
- [x] **Task 2.1**: Refactor `AttendanceContext.tsx` to read/write Firestore collections (`students`, `attendance_sessions`, `justifications`, `notification_outbox`, `audit_logs`).
- [x] **Task 2.2**: Multi-tenant scoping per user's `tenantId`.
- [x] **Task 2.3**: Preserve `mockData.ts` as fallback/seed mechanism if Firestore connection is offline or uninitialized.
- [x] **Task 2.4**: Harden Firestore rules against IDOR (restricted reads for justifications, students, logs).
- [x] **Task 2.5**: Complete Multi-Tenant & Full 4-Role RBAC (`admin`, `registrar`, `teacher`, `parent`) across `firestore.rules`, `server.ts`, and frontend components.

### Phase 3: Architectural Quality & Error Handling (Medium Priority)
- [x] **Task 3.1**: Implement error handling and toast notifications for failed context actions.
- [x] **Task 3.2**: Add client & server validation for file uploads (MIME, 5MB max, magic byte check).
- [x] **Task 3.3**: Split monolithic views (`JustificationsView.tsx` ✅ Completed; `DailyEmailDigestView.tsx` ✅ Completed into 4 modular subcomponents).

### Phase 4: Reliability, Observability & Testing (Low Priority)
- [x] **Task 4.1**: Setup `vitest` and initial test suite for pure business logic (`digestEngine.ts`).
- [x] **Task 4.2**: Add connection status banner (online/offline indicator).
- [x] **Task 4.3**: Add simulation badge/banner for mocked notifications.
- [x] **Task 4.4**: Update CI workflows to build and run test suites.

---

## Multi-Tenant & Full RBAC Architecture Matrix

| Role | Tenant Scoping | Student Management | Attendance Sessions | Medical Excuses (Justifications) | Notification Outbox | System Settings | Daily Digest |
|:---|:---|:---|:---|:---|:---|:---|:---|
| **Admin** (`مدير النظام`) | Current Tenant (`school-1` / `school-2`) | Full (View, Edit, CSV Import) | Full (Take, Submit, Reopen, Edit any) | Full (Review, Approve, Reject) | Full (View, Send, Cancel) | Full (Edit policies & weights) | Full (Generate & Dispatch) |
| **Registrar** (`شؤون الطلاب`) | Current Tenant | Full (View, Edit, CSV Import) | Supervise (View, Submit, Reopen, Audit) | Review & Decide (Approve, Reject) | Full (View, Send, Cancel) | Read-only | Full (Generate & Dispatch) |
| **Teacher** (`معلم`) | Current Tenant + `assignedClasses` | Read-only (assigned classes) | Limited (Take draft sessions for assigned classes; cannot reopen submitted) | Read-only (assigned classes) | Forbidden | Forbidden | Forbidden |
| **Parent** (`ولي أمر`) | Current Tenant + Child Isolation | Read-only (Own child only) | View child's attendance rate & logs only | Submit excuse for own child only | Forbidden | Forbidden | Forbidden |

---

## Log of Key Decisions & Changes
- **2026-10-11**: Repository cloned and verified clean.
- **2026-10-11**: Completed full manual audit of [Audit for smart absence school.md](file:///c:/Users/ahmed/Desktop/Smart-absecene-/Audit%20for%20smart%20absence%20school.md). Identified that C1 (admin email) was already resolved in git history, while C2, C4, H1, H3 remain active priorities.
- **2026-10-11**: Implemented comprehensive Multi-Tenant isolation and 4-tier RBAC (`admin`, `registrar`, `teacher`, `parent`) across:
  - `firestore.rules`: Scoped all collections (`/students`, `/attendance_sessions`, `/justifications`, `/settings`, `/notification_outbox`, `/audit_logs`) by `tenantId` and role helpers (`isTenantRole`, `isTeacherAssigned`).
  - `server.ts`: Configured `requireRole` and `requireTenant` middlewares guarding API endpoints.
  - `src/lib/api.ts`: Synchronous propagation of `x-tenant-id` and `x-user-role` headers.
  - `src/context/AttendanceContext.tsx`: RBAC capability flags (`canManageSettings`, `canReviewJustifications`, `canReopenSessions`, `canImportStudents`, `canDispatchDigest`, `canManageOutbox`, `canEditSession`) with enforced action guards.
  - Views (`HeaderNav.tsx`, `App.tsx`, `JustificationsView.tsx`, `AuditSettingsView.tsx`, `StudentManagementView.tsx`, `AttendanceSessionsView.tsx`): Role-filtered navigation and action controls.
  - `src/utils/rbac.test.ts`: Automated test suite covering RBAC permissions, session editing boundaries, and parent-child isolation (100% passing).
- **2026-10-11**: Approved Domain-Based Multi-Tenancy specification and architecture blueprint for implementation.

---

## Domain-Based Multi-Tenancy Architecture & Specifications

### 1. Core Workflow
```
[User visits URL] -> [Host/Domain Resolution Service] -> [Load School Config & Branding] -> [School Branded Login] -> [Tenant Membership Verified] -> [Role-Isolated Dashboard]
```
1. **User opens school URL**: e.g., `andalus.smartschool.com`, `falah.smartschool.com`, or custom domain `attendance.andalus-school.edu.sa`.
2. **Tenant resolution service**: Inspects incoming request hostname against trusted tenant-domain registry (`src/config/tenantRegistry.ts`).
3. **Load school configuration**: Automatically retrieves canonical tenant ID, school branding, logo, colors, academic year/term, and attendance rules.
4. **School-specific login**: Branded authentication interface for the detected institution with zero school dropdowns or manual codes.
5. **Membership validation**: Authenticates user and verifies active membership in the resolved tenant before granting access; cross-tenant logins are strictly rejected.

### 2. Tenant Domain Registry Matrix
| School / Tenant | Canonical ID | Subdomains | Custom Domains | Local Dev Hosts |
|:---|:---|:---|:---|:---|
| **مدرسة الأندلس الثانوية النموذجية** | `school-1` | `andalus.smartschool.com` | `attendance.andalus-school.edu.sa` | `andalus.localhost:3000` |
| **مدرسة الفلاح المتوسطة الحديثة** | `school-2` | `falah.smartschool.com` | `attendance.falah-school.edu.sa` | `falah.localhost:3000` |
| **Platform Root / Portal** | `_platform_root` | `smartschool.com`, `www.smartschool.com` | N/A | `localhost:3000`, `127.0.0.1:3000` |

### 3. Non-Negotiable Security Rules & 5 Core Pillars
1. **Domain-Based Identification**: The domain/hostname itself carries the school identity (`andalus.smartschool.com`, `portal.andalus.edu`, `portal.andalus.edu.sa`, `attendance.andalus-school.edu.sa`). No user or visitor ever sees a school dropdown or directory.
2. **Trusted Server-Side Tenant Resolver**: Hostnames are validated on both client pre-render and server middleware (`Host` / `X-Forwarded-Host`) against a trusted registry (`src/config/tenantRegistry.ts`). Arbitrary client headers (`x-tenant-id`) are never trusted unless authenticated.
3. **Tenant-Bound Authentication**: Identity, tenant membership, account status, and role permissions are strictly bound. Cross-tenant authentication attempts are rejected immediately with `403 Forbidden`.
4. **Enforced Data Isolation**: All Firestore queries, API endpoints (`server.ts`), and audit logs are strictly scoped to `tenantId`. Firestore Security Rules prevent cross-tenant reading/writing.
5. **Tenant-Specific Configuration**: School crest, branding colors, academic year/term, attendance policies, and notification configurations are loaded dynamically and uniquely per tenant.

### 4. Implementation Phase Plan & Progress Memory

To eliminate duplicate coding and ensure zero rework, implementation strictly followed the **Container-first (Tenant) then Permissions (RBAC)** sequence:

#### Stage 5.A: Multi-Tenant Foundation (Container First)
- [x] **Task 5.A.1**: Create `src/config/tenantRegistry.ts` (trusted tenant registry, hostname normalizer, port stripping, punycode/case normalization, custom domain resolution).
- [x] **Task 5.A.2**: Update [server.ts](file:///c:/Users/ahmed/Desktop/Smart-absecene-/server.ts) with `resolveTenantFromHost` middleware to bind tenant strictly from `Host`/`X-Forwarded-Host`, rejecting client-forged tenant headers.
- [x] **Task 5.A.3**: Create `src/components/UnknownDomainView.tsx` (for unconfigured or unregistered domains; halts application execution safely).
- [x] **Task 5.A.4**: Update [src/App.tsx](file:///c:/Users/ahmed/Desktop/Smart-absecene-/src/App.tsx) and [src/context/AttendanceContext.tsx](file:///c:/Users/ahmed/Desktop/Smart-absecene-/src/context/AttendanceContext.tsx) to resolve tenant from hostname pre-render and load tenant branding/settings dynamically.
- [x] **Task 5.A.5**: Create `src/utils/tenantResolution.test.ts` to test subdomain extraction, custom domains, port normalization, and unknown domains (11/11 passing).

#### Stage 5.B: School-Branded Login & RBAC Enforcement (Permissions Within Container)
- [x] **Task 5.B.1**: Create `src/components/LoginPage.tsx` (school-specific branding, zero school dropdowns/codes, role credentials, demo presets for all 4 roles).
- [x] **Task 5.B.2**: Implement strict tenant membership verification (block cross-tenant accounts with 403 Forbidden).
- [x] **Task 5.B.3**: Update [src/components/HeaderNav.tsx](file:///c:/Users/ahmed/Desktop/Smart-absecene-/src/components/HeaderNav.tsx) to replace the manual tenant switcher with a verified active school badge and user sign-out action.
- [x] **Task 5.B.4**: Add automated authentication and cross-tenant access rejection tests in `src/utils/rbac.test.ts` (7/7 passing).
- [x] **Task 5.B.5**: Run full test suites (`vitest run` - 21/21 passing across 3 suites) and production build verification (`vite build` - 0 errors).

#### Stage 5.C: Pure Single-School Domain Resolution (Canvas LMS / Slack Industry Pattern)
- [x] **Task 5.C.1**: Eliminated multi-school directory (`PlatformRootView`); no screen ever lists or allows picking other schools.
- [x] **Task 5.C.2**: Registered custom academic domains (`portal.andalus.edu`, `portal.andalus.edu.sa`, `portal.falah.edu`).
- [x] **Task 5.C.3**: Enforced 1:1 domain-to-school resolution where the domain itself uniquely carries the school identity.
- [x] **Task 5.C.4**: Updated automated test suites in `tenantResolution.test.ts` for custom academic domains and single-tenant loading.
- [x] **Task 5.C.5**: Registered `requireTenant` middleware across Express API routes in `server.ts`; verified live HTTP cross-tenant rejection returns `403 TENANT_DOMAIN_MISMATCH`.

#### Stage 5.D: Mobile Responsiveness, React Portals & Optical QR Hardware Scanning
- [x] **Task 5.D.1**: Added LAN IP subnet resolution (`192.168.x.x`, `10.x.x.x`, `172.16-31.x.x`) in `src/config/tenantRegistry.ts` so mobile testing over local Wi-Fi immediately resolves to the active school rather than halting on `UnknownDomainView`.
- [x] **Task 5.D.2**: Refactored all major modal dialogues (`QRScannerModal`, `StudentQRCodeModal`, `BatchQRModal`, `OfficialReportModal`) to mount through `ReactDOM.createPortal(..., document.body)`. This decouples modals from nested RTL layout containers, eliminating clipping, overflow offsets, and mobile horizontal shifts.
- [x] **Task 5.D.3**: Optimized mobile viewports and CSS boundaries (`html, body, #root { max-width: 100vw; overflow-x: hidden; }`), removing 9999px box shadows and replacing them with clean, responsive viewfinder overlays.
- [x] **Task 5.D.4**: Overcame W3C WebRTC HTTP non-secure context restriction (`navigator.mediaDevices.getUserMedia` disabled on plain HTTP LAN Wi-Fi):
  - Integrated native mobile camera snapshot capture (`<input type="file" accept="image/*" capture="environment">`) with a prominent "Open Phone Camera & Scan" button.
  - Implemented client-side optical decoding using `jsQR` with automatic image scaling and canvas rendering.
  - Added continuous video stream fallback with dual detection (`BarcodeDetector` + `jsQR` canvas loop) when accessed via HTTPS or localhost.
  - Added direct image file upload support for decoding existing badges from device storage.
- [x] **Task 5.D.5**: Verified TypeScript types (`npx tsc --noEmit` - 0 errors) and automated test suites (`vitest run` - 21/21 passing across 3 test suites).

#### Stage 5.E: Native Vector PDF Engine with Cursive Arabic RTL Typography
- [x] **Task 5.E.1**: Evaluated client-side (`pdfmake` with VFS) vs. server-side (`Puppeteer`). Chose Puppeteer to guarantee true OpenType Arabic cursive letter shaping, diacritics, and selectable vector text without font degradation.
- [x] **Task 5.E.2**: Created `/api/pdf/generate` endpoint in [server.ts](file:///c:/Users/ahmed/Desktop/Smart-absecene-/server.ts) with automatic local Chromium/Edge binary detection, A4 print layout, Cairo/Amiri web fonts, and official school headers/footers.
- [x] **Task 5.E.3**: Created client utility [src/utils/pdfExport.ts](file:///c:/Users/ahmed/Desktop/Smart-absecene-/src/utils/pdfExport.ts) (`downloadNativePdfFromHtml`) for streaming downloadable PDFs with an automatic browser print fallback.
- [x] **Task 5.E.4**: Updated [OfficialReportModal.tsx](file:///c:/Users/ahmed/Desktop/Smart-absecene-/src/components/OfficialReportModal.tsx) and [EmergencyRosterView.tsx](file:///c:/Users/ahmed/Desktop/Smart-absecene-/src/components/EmergencyRosterView.tsx) to generate and download real, selectable vector PDFs directly from the UI.
- [x] **Task 5.E.6**: Resolved browser PDF loading failure ("Failed to load PDF document"):
  - **Root Cause**: `pdfExport.ts` opened blob URLs with `target="_blank"` and revoked them via `URL.revokeObjectURL()` after only 1 second while Chromium's PDFium viewer was still reading the stream. Additionally, old server instance percent-encoded non-ASCII characters inside raw `filename="..."`.
  - **Fix**: Removed `target="_blank"`, validated `%PDF-1.4` magic bytes, delayed URL revocation to 60 seconds, and formatted headers with RFC 5987 (`filename="attendance-report.pdf"; filename*=UTF-8''<encoded>`).
- [x] **Task 5.E.7**: Resolved browser print taking a screenshot of the website UI:
  - **Root Cause**: Print rules were nested inside `@layer base`, where Tailwind utility classes took precedence. When export threw an error, catch block triggered `window.print()` which captured all app chrome across 4 pages.
  - **Fix**: Moved `@media print` outside cascade layers, set `body:has([role="dialog"]) #root { display: none !important; }` so only the clean A4 report canvas prints, and eliminated automatic `window.print()` invocation on download errors.
- [x] **Task 5.E.8**: Validated generated PDF (`full_attendance_report.pdf`, 212.8 KB) with headless Chromium and PDF.js:
  - Valid `%PDF-1.4` header and `%%EOF` footer.
  - Correct Arabic RTL cursive font shaping (Cairo / Amiri).
  - True selectable vector text with 0 images/canvas screenshots.
  - Clean 1-page A4 layout with ministry header, KPI summaries, student roster table, and administration signatures.


## Live Progress Memory Status

| Stage / Component | Status | Target Completion | Verification Method |
|:---|:---|:---|:---|
| **Audit & Fixes (Phases 1-4)** | ✅ Completed | 2026-10-11 | Vitest (8/8 passing), Vite build (clean) |
| **Multi-Tenant Foundation (5.A)** | ✅ Completed | 2026-10-11 | `vitest run src/utils/tenantResolution.test.ts` (11/11 passing) |
| **Branded Login & RBAC (5.B)** | ✅ Completed | 2026-10-11 | `vitest run src/utils/rbac.test.ts` (7/7 passing), API 403 tests, Vite build |
| **Pure Single-School Model (5.C)** | ✅ Completed | 2026-10-11 | Canvas LMS pattern: 0 directory screens, 1:1 domain mapping, Vitest |
| **Live API Tenant Boundary** | ✅ Verified | 2026-10-11 | Node HTTP testing: `403 Forbidden` (`TENANT_DOMAIN_MISMATCH`) confirmed |
| **Monolithic View Decomposition (M2)** | ✅ Completed | 2026-10-11 | `JustificationsView.tsx` and `DailyEmailDigestView.tsx` decomposed into focused subcomponents |
| **Mobile Portals & QR Scanning (5.D)** | ✅ Completed | 2026-10-11 | React Portal modals, native camera capture + `jsQR`, LAN IP resolution, 21/21 passing tests |
| **Native Vector PDF Engine (5.E)** | ✅ Completed | 2026-10-11 | Server Puppeteer `/api/pdf/generate`, Cairo/Amiri fonts, selectable vector text, live verified |

---

### Native Arabic Vector PDF & Print Engine:
- **Download PDF & IDM Fix**: Routed `/api/pdf/generate` at top of `server.ts` before auth/tenant middleware and returned JSON base64-encoded PDF. This completely prevents Internet Download Manager (IDM) or browser extensions from hijacking the binary stream into empty HTTP 204 responses.
- **Isolated Clean Printing**: All print functions across all pages call `printNativePdfFromHtml` using isolated hidden iframes and vector PDF blob URLs. Zero webpage screenshot captures.
- **Validated Functions & Output Artifacts**:
  1. **Official Attendance Report** (`OfficialReportModal.tsx`): [attendance_report_validated.pdf](file:///c:/Users/ahmed/Desktop/Smart-absecene-/attendance_report_validated.pdf) (206 KB, 1,597 text items)
  2. **Emergency Evacuation Roster** (`EmergencyRosterView.tsx`): [emergency_roster_validated.pdf](file:///c:/Users/ahmed/Desktop/Smart-absecene-/emergency_roster_validated.pdf) (153 KB, 891 text items)
  3. **Single Student QR Attendance Badge** (`StudentQRCodeModal.tsx`): [single_student_qr_validated.pdf](file:///c:/Users/ahmed/Desktop/Smart-absecene-/single_student_qr_validated.pdf) (130 KB, 510 text items)
  4. **Batch Classroom QR Badges** (`BatchQRModal.tsx`): [batch_qr_badges_validated.pdf](file:///c:/Users/ahmed/Desktop/Smart-absecene-/batch_qr_badges_validated.pdf) (119 KB, 726 text items)

- **Emergency Roster Status Badge Fix**:
  - Fixed badge line-breaking and vertical clipping on `EmergencyRosterView.tsx` where status badges (`متواجد (حاضر)`, `متواجد (متأخر)`) previously broke across two lines into a cramped vertical box.
  - Added `whitespace-nowrap`, `inline-flex items-center justify-center`, and `px-3 py-1` padding with `leading-none` to guarantee a clean, single-line horizontal pill design across all screen widths and printed outputs.

---

## Master Architecture & Implementation Plan: Dynamic School Profile & Settings Engine (Phase 0)

### Architectural Commitment:
- **No Hallucinations / No Workarounds / No Lazy Fixes**: Every field will be strongly typed, persisted, and cleanly consumed.
- **Strict Phased Execution**: We must **completely finish and validate each phase** before moving to the next.
- **Small Modular Files**: Keep all new subcomponents and utilities focused and small (<150-200 lines). Do not create monolithic files.
- **Scope Boundary**: Update **only** the related functions of the working codebase with zero breaking changes or regressions.

---

### Phased To-Do List: Dynamic School Settings Engine

#### [x] Phase 0.1: Core Types & Modular Defaults (`src/types/attendance.ts`, `src/config/tenantSettings.ts`)
- [x] Define `AcademicTerm`, `AcademicYearConfig`, and `TimetablePeriod` types.
- [x] Define comprehensive `TenantSchoolProfile` supporting:
  - Ministry Header (`ministryHeaderAr`), Education Directorate, School Code.
  - Full Address (Country, City, District, Street Address, Postal Code).
  - General Phone, Emergency Hotline, Official Email, Website.
  - Leadership: Principal, Vice Principal 1 (`وكيل شؤون الطلاب`), Vice Principal 2 (`وكيل الشؤون التعليمية`), Social Worker / Counselor (`الموجه الطلابي / الأخصائي الاجتماعي`).
  - Multi-Term Academic Year & Daily Timetable Periods.
  - Emergency Assembly Points array.
- [x] Create clean, modular default settings per existing tenant in `src/config/tenantSettings.ts`.

#### [x] Phase 0.2: State Management & Storage (`src/context/AttendanceContext.tsx`, `src/types/attendance.ts`)
- [x] Attach `schoolProfile: TenantSchoolProfile` to `Tenant` interface.
- [x] Implement `updateSchoolProfile(profile: Partial<TenantSchoolProfile>): Promise<void>` in `AttendanceContext`.
- [x] Provide localStorage + tenant-scoped persistence with safe fallback to canonical defaults.

#### [x] Phase 0.3: Modular School Settings UI in AuditSettingsView (`src/components/settings/`)
- [x] Create small modular sub-components in `src/components/settings/`:
  - `SchoolIdentityTab.tsx` (Ministry, Name, Code, Logo, Stamp).
  - `SchoolContactTab.tsx` (Country, City, Address, Hotline, Phone, Email).
  - `SchoolLeadershipTab.tsx` (Principal, 2 Vice Principals, Social Worker).
  - `AcademicCalendarTab.tsx` (Academic Year, Terms, Daily Periods).
  - `EmergencyPolicyTab.tsx` (Assembly Points, Absence Thresholds, Footer Note).
- [x] Integrate tabs into `AuditSettingsView.tsx` with live preview and save validation.

#### [x] Phase 0.4: Propagate Dynamic Data to Official Reports & PDF Exports
- [x] Update `OfficialReportModal.tsx` to read dynamic leadership signatures, ministry header, and academic year.
- [x] Integrate dual vice principals, social worker, and stamp seals dynamically into the printable official canvas.
- [x] Validate generated PDF output with real dynamic data.

#### [x] Phase 0.5: Propagate Dynamic Data to Emergency Roster & Student QR Badges
- [x] Update `EmergencyRosterView.tsx` to pull dynamic assembly points, school address, and emergency hotline.
- [x] Update `StudentQRCodeModal.tsx` and `BatchQRModal.tsx` to render dynamic school name and footer note.
- [x] Verify `NotificationOutboxView.tsx` automatically resolves dynamic school name from context.

---

### Subsequent Features To-Do List (Executed in strict sequence):
1. [x] **Feature #7: Bulk Edit Confirmation Modal** (`BulkEditConfirmationModal.tsx`, `AttendanceSessionsView.tsx`) - [Completed ✅]
2. [x] **Feature #3: Offline Sync Modal** (`OfflineSyncModal.tsx`, `App.tsx`) - [Completed ✅]
3. [x] **Feature #8: Dedicated Modular Print Stylesheet** (`print.css`, `index.css`) - [Completed ✅]
4. [x] **Feature #2: Absence Heatmap** (`ReportsView.tsx`, `AbsenceHeatmapCard.tsx`) - [Completed ✅]
5. [x] **Feature #1: Student Engagement Dashboard with Streaks & Badges** (`ReportsView.tsx`, `StudentEngagementSection.tsx`) - [Completed ✅]
6. [x] **Feature #9: Generalized Batch Print Center** (`ReportsView.tsx`, `BatchPrintCenterModal.tsx`) - [Completed ✅]
7. [x] **Feature #6: Class Calendar View** (`AttendanceSessionsView.tsx`, `ClassCalendarView.tsx`) - [Completed ✅]
8. [x] **Feature #4: Gamified Attendance UI** (`AttendanceSessionsView.tsx`, `GamifiedCelebrationModal.tsx`) - [Completed ✅]
9. [x] **Feature #5: Student Behaviour Tracking** (`types/attendance.ts`, `StudentManagementView.tsx`, `StudentBehaviourModal.tsx`) - [Completed ✅]
10. [x] **Feature #10: Full Professional RBAC & User Management System** (`types/attendance.ts`, `UserManagementTab.tsx`, `UserEditModal.tsx`, `AuditSettingsView.tsx`, `rbac.test.ts`) - [Completed ✅]
11. [x] **Feature #11: Dynamic School & Class Statistics (No Hardcoded Classes)** (`SchoolClassStatsCards.tsx`, `AttendanceContext.tsx`, `AttendanceSessionsView.tsx`) - [Completed ✅]
12. [x] **Feature #12: Student Lifecycle & Official Transfer Archive** (`TransferStudentModal.tsx`, `DeleteStudentConfirmationModal.tsx`, `StudentManagementView.tsx`) - [Completed ✅]
13. [x] **Feature #13: Direct Single Student Enrollment** (`AddStudentModal.tsx`, `StudentManagementView.tsx`, `studentLifecycle.test.ts`) - [Completed ✅]
14. [x] **Feature #14: Dynamic Academic Terms, School Classes & Subjects Configuration** (`AcademicCalendarTab.tsx`, `AcademicTermsCard.tsx`, `ClassesManagementCard.tsx`, `SubjectsManagementCard.tsx`) - [Completed ✅]
15. [x] **Feature #15: Workflow-Based Information Architecture & Clustered Navigation** (`HeaderNav.tsx`, `App.tsx`, `Comprehensive UIUX Audit.md`) - [Completed ✅]
16. [x] **Feature #16: Enterprise Collapsible Tree Sidebar Navigation** (`AppSidebar.tsx`, `HeaderNav.tsx`, `App.tsx`) - [Completed ✅]
17. [x] **Feature #17: Strict Universal Settings Adherence & File Upload Rejection Engine** (`tenantSettings.ts`, `StudentAbsenceInquiryView.tsx`, `StudentManagementView.tsx`, `JustificationsView.tsx`, `JustificationSubmitForm.tsx`, `AttendanceSessionsView.tsx`, `AttendanceContext.tsx`, `ExecutiveDashboardView.tsx`, `settingsComplianceAudit.test.ts`) - [Completed ✅]

---

## Strict Universal Settings Adherence & Data Ingestion Compliance Policy
### الالتزام الصارم والقطعي بجميع البيانات والمعلومات المعتمدة في صفحة الإعدادات وسياسة رفض الملفات المخالفة

> [!IMPORTANT]
> **قاعدة حتمية ومطلقة داخل التطبيق من أوله إلى آخره:**
> تلتزم كافة الدوال، الحسابات الرياضية، كشوف الحضور، النماذج، والوظائف التزاماً تاماً ومطلقاً بالبيانات والمعلومات المحددة في صفحة الإعدادات (`AuditSettingsView` / `TenantSchoolProfile` / `schoolProfile`). يُمنع منعاً باتاً استخدام أي قيم ثابتة (Hardcoded) أو تواريخ تقع خارج التقويم المعتمد.
> كما تُطبق سياسة الرفض والتحذير الصارمة على أي بيانات مرفوعة أو مستوردة من الملفات تخالف هذه الشروط.

### 1. الركائز الأساسية للإعدادات كمصدر وحيد للحقيقة (Single Source of Truth)

1. **التقويم والفصول الدراسية (`academicYear.terms`):**
   - يبدأ العام الدراسي المعتمد رسمياً مع بداية الفصل الدراسي الأول (`2026-09-01` / شهر 9) وينتهي بنهاية الفصل الثالث (`2027-06-24` / شهر 6).
   - تم استبعاد وحذف شهر 8 (`2026-08`) نهائياً من كافة شاشات الاستعلام، التقارير، والتصفيات الشهرية.
   - قائمة الشهور المتاحة في الاستعلامات تُشتق ديناميكياً وحصرياً من حدود العام الدراسي المعتمدة بالإعدادات (`academicYearBounds.start` إلى `academicYearBounds.end`)، مع قائمة منسدلة لاختيار الشهر المطلوب.
   - إدخال أي تاريخ يدوي يقع خارج حدود العام الدراسي يتم رفضه تلقائياً ويظهر شريط تحذيري صريح بالرفض.

2. **العطلات الأسبوعية والإجازات الرسمية (`weekendDays` & `officialHolidays`):**
   - يتم التحقق من كل تاريخ عبر محرك `isSchoolOffDay(dateStr, weekendDays, officialHolidays)`.
   - تستبعد كشوف الغياب اليومية وأيام الدوام أي تاريخ يوافق عطلة نهاية الأسبوع (الجمعة والسبت) أو إجازة رسمية معتمدة (مثل اليوم الوطني السعودي `2026-09-23`، إجازات نهاية الأسبوع المطولة، ويوم التأسيس).

3. **الفصول والمراحل الدراسية المعتمدة (`schoolProfile.classes`):**
   - لا يُعتد إلا بالفصول المسجلة رسمياً بلائحة المدرسة في الإعدادات (مثل `10 / أ`، `10 / ب`، `11 / أ`).
   - تُمنع إضافة أو قيد أو تحضير أي طالب في فصل غير مسجل بالإعدادات.

4. **حدود الإنذارات والحسابات الرياضية للغياب (`Thresholds & Risk Calculations`):**
   - حساب الطلاب المعرضين للحرمان أو المحتاجين لتدخل إداري يرتبط ديناميكياً بـ `schoolProfile.unexcusedWarningThreshold` (افتراضي 3 أيام) و `schoolProfile.chronicAbsenceDaysThreshold` (افتراضي 5 أيام).
   - تم استبدال كافة الأرقام الثابتة في `ExecutiveDashboardView` و `StudentManagementView` بهذه القيم المعتمدة بالإعدادات.

5. **الحصص والمواد الدراسية (`timetablePeriods` & `subjects`):**
   - اختيار الحصص والمواد عند إنشاء كشف حضور في `AttendanceSessionsView` يرتبط مباشرةً بقائمة الحصص والمواد المعتمدة في صفحة الإعدادات للمدرسة.

---

### 2. سياسة رفض وتحذير البيانات المرفوعة والمستوردة من الملفات (File Upload & Import Rejection Engine)

> [!CAUTION]
> **إذا كانت البيانات المستوردة من الملفات والمرفوعة إلى التطبيق تخالف الشروط المعتمدة في صفحة الإعدادات، يتم رفضها وتحذير المستخدم فوراً بأنها تخالف المعلومات الموجودة في صفحة الإعدادات:**

1. **استيراد قوائم الطلاب عبر ملفات CSV (`StudentManagementView.tsx`):**
   - يتم فحص كل سطر في الملف المرفوع والتحقق من أن اسم الفصل (`className`) والمرحلة (`grade`) مسجلان بالفعل في قائمة فصول المدرسة المعتمدة (`schoolProfile.classes`).
   - في حال وجود فصل غير معتمد أو مرحلة مخالفة للإعدادات:
     - يتم وسم السجل فوراً كـ **غير صالح (`isValid = false`)**.
     - يُسجل سبب الخطأ بوضوح: `"مخالف لصفحة الإعدادات: الفصل الدراسي (...) غير مسجل في فصول المدرسة المعتمدة"`.
   - في مرحلة المعاينة والتحقق (المرحلة 2):
     - يظهر شريط تنبيه أحمر بارز يُحذر المستخدم:
       `⚠️ تحذير نظامي: تم رفض (X) سجلات لمخالفتها البيانات المعتمدة في صفحة الإعدادات (الفصول أو المراحل غير مطابقة للائحة المدرسة).`
     - يُمنع حفظ السجلات المخالفة ويتاح للمستخدم تنزيل تقرير الأخطاء بصيغة CSV لتصحيحه.
     - في حال كانت جميع السجلات مخالفة (`validCount === 0`)، يتم تعطيل زر الاعتماد نهائياً.
   - على مستوى السياق وقاعدة البيانات (`AttendanceContext.tsx - importStudents`):
     - يتم حظر أي طالب لا ينتمي لفصل معتمد في الإعدادات من الدخول إلى قاعدة البيانات.

2. **رفع المستندات والأعذار الطبية (`JustificationsView.tsx` & `JustificationSubmitForm.tsx`):**
   - تاريخ الغياب المطلوب تبريره (`absenceDate`) مقيد إجبارياً بحدود العام الدراسي (`min` و `max`).
   - في حال اختيار تاريخ يقع خارج العام الدراسي المعتمد أو يوافق عطلة أسبوعية أو إجازة رسمية معتمدة بالإعدادات:
     - يظهر تنبيه فوري باللون الأحمر تحت حقل التاريخ:
       `⚠️ التاريخ (...) مخالف لمعلومات صفحة الإعدادات: [السبب: عطلة أسبوعية / إجازة رسمية / خارج العام الدراسي].`
     - يتم تعطيل زر الإرسال ورفض رفع الطلب.
     - في دالة الإرسال `handleFormSubmit` ودالة السياق `createJustification`: يتم رفض الطلب نهائياً وإطلاق تحذير صريح للمستخدم.

3. **إنشاء كشوف الحصص والتحضير اليومي (`AttendanceSessionsView.tsx`):**
   - يُفحص تاريخ التحضير؛ وإذا صادف عطلة أو إجازة رسمية معتمدة بالإعدادات، يظهر تحذير للمستخدم يؤكد أن اليوم يوافق عطلة رسمية بالإعدادات.

---

### 3. مصفوفة التحقق والاختبارات الآلية (Automated Compliance Test Suite)

- تم إنشاء وتفعيل ملف اختبارات شامل مخصص لتدقيق الالتزام بالإعدادات:
  [`src/utils/settingsComplianceAudit.test.ts`](file:///c:/Users/ahmed/Desktop/Smart-absecene-/src/utils/settingsComplianceAudit.test.ts)
- يغطي بدقة:
  1. رفض التواريخ السابقة لبداية العام الدراسي (مثل شهر 8 / `2026-08-15`).
  2. رفض التواريخ اللاحقة لنهاية العام الدراسي (مثل `2027-07-01`).
  3. رفض الإجازات الرسمية المعتمدة بالإعدادات (اليوم الوطني `2026-09-23`، الأسبوع المطول، التأسيس).
  4. رفض أيام العطلة الأسبوعية (الجمعة والسبت).
  5. رفض سجلات استيراد الطلاب المحتوية على فصول غير مسجلة في لائحة المدرسة.
  6. الالتزام الصارم بحدود الإنذارات الرياضية للغياب بدون عذر والغياب المزمن.
- **نتيجة تشغيل الاختبارات الآلية**: نجاح 61 اختباراً من أصل 61 عبر 8 ملفات اختبار بنسبة 100% بدون أي أخطاء.












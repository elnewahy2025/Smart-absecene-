# Known Limitations & Architecture Status

## Current Status Overview

> **Note (2026-10-18):** The independent audit `docs/PROJECT_AUDIT_2026-10-18.md` supersedes the historical resolution list below. It found Critical/High issues (header-derived identities, public provisioning, unauthenticated PDF, client-side auth fallback, and Firestore rule holes) that the earlier list did not cover. Live remediation status is tracked in `PROGRESS.md`.

All previously identified critical and high architectural limitations (C1–C4, H1–H3, M1–M4, L1–L4) have been systematically resolved and verified in the active codebase:

- **Backend Authorization Layer**: Fully implemented via Express middlewares (`authenticateToken`, `requireRole`, `requireTenant`) in `server.ts` alongside granular rate limiting (`express-rate-limit`).
- **Secure Multi-Tenant Data Model**: Enforced at the database level in `firestore.rules` (tenant ID scoping, parent-child privacy isolation, locked attendance sessions) and verified on incoming hostnames via `src/config/tenantRegistry.ts`.
- **Secret & Credential Management**: Zero secrets in committed code. Environment variables centralized in `.env.example`, `.env` ignored from Git, and local automated secret scanning active (`npm run audit`).
- **Automated Test Quality Gates**: Full automated test harness in Vitest (`npm test`) with **192 tests passed across 27 suites** (100% pass rate) covering RBAC, tenant routing, calculations, academic calendar persistence, settings compliance, parent portal isolation, country presets, messaging-provider adapters, route-auth policy, attendance access rules, the privacy-safe local cache, and mobile LAN testing.
- **Data Ingestion & Integrity Policy**: Strict Universal Settings Adherence engine rejects imported CSV student rosters with unapproved classes and blocks attendance/excuse actions on off-days or outside academic terms.

## Remaining Operational Boundaries & Roadmap Considerations

1. **SMS / WhatsApp Gateway**:
   - Notifications in `NotificationOutboxView.tsx` currently run in **Simulation Mode** (sandbox outbox) by default, displaying a prominent simulation banner, with hooks ready for commercial aggregators (e.g. Unifonic, Twilio).
2. **Local Offline State & Fallback**:
   - When offline or disconnected from Firebase, the application uses local seeded data and an offline synchronization modal (`OfflineSyncModal.tsx`) with real-time connectivity status banners.
3. **Puppeteer PDF Rendering Environment**:
   - Server-side Chromium requires headless browser support on host environments (Linux containers require standard Chromium OS packages).
4. **Mobile Dev Multi-Tenant Testing & Switching**:
   - [COMPLETED ✅] Local Wi-Fi / LAN IP switcher (`?school=` query param, localStorage persistence, and 1-tap testing switcher on `LoginPage` and `HeaderNav`) active for local testing with 100% automated test coverage. Ready to be disabled/removed upon final production domain deployment.


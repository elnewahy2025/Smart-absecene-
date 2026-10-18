# Project Architecture & Security Assessment

## Overall Assessment

**Rating: Not production-ready — active security remediation in progress.**

The Smart School Attendance System ("مدرستي حضور") is feature-rich and its build is green (TypeScript compiles, 192 tests pass, Vite builds). It has undergone multi-tenant scoping, defense-in-depth authorization, and full settings compliance. However, an independent audit (`docs/PROJECT_AUDIT_2026-10-18.md`) found Critical and High access-control defects — several verified live — so this document no longer claims production readiness. Per-item remediation status is tracked in `PROGRESS.md`; do not load real student data until that board is green.

## Remediated Pillars & Current Strengths

1. **Credential Hygiene**:
   - No secrets committed; the previously tracked Firebase web config has been removed, `.env` is gitignored, and `.env.example` documents the required variables.
   - Identity is resolved from verified Firebase custom claims only; there is no client-controlled role fallback.
2. **Multi-Tenant Domain Isolation & 4-Tier RBAC**:
   - Complete domain-based multi-tenancy (`src/config/tenantRegistry.ts`) with custom academic domain resolution.
   - Enforced 4-tier RBAC (`admin`, `registrar`, `teacher`, `parent`) across Firestore Security Rules, Express API middlewares (`server.ts`), and frontend context guards.
3. **Automated Test Coverage**:
   - 192 automated tests across 27 test suites in Vitest (`npm test`). The server's public-route policy (`routeAuth.ts`) and the attendance RBAC / guardian-matching rules (`attendanceAccess.ts`) are now extracted from `server.ts` and `AttendanceContext.tsx` and tested directly, and `server.ts` itself is now imported by an integration suite (`serverIntegration.test.ts`); only the `AttendanceContext.tsx` component is not imported standalone — see the audit's M-10.
4. **Strict Universal Settings Adherence Engine**:
   - Single source of truth in Settings (`TenantSchoolProfile`).
   - Dynamic academic year bounds, off-day filtering, and strict rejection of uploaded CSV student rosters containing unapproved classrooms.
5. **Native Arabic Vector PDF & Reporting Center**:
   - Server-side headless Chromium engine generating official selectable vector A4 PDFs with cursive Arabic font shaping (Cairo/Amiri) for rosters, reports, and QR badges.
6. **Parent Portal & Operational Workflows**:
   - Dedicated parent portal with privacy isolation, multi-tab audit logs, medical excuse submission, and emergency evacuation tracking.

## Continuous Maintenance Recommendations

- Keep automated test suites running via `npm test` before merges.
- Run local security audit checks via `npm run audit`.
- Maintain simulation mode indicators on mocked notification dispatchers until third-party SMS/WhatsApp gateway credentials are provided.

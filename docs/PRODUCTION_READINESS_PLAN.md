# Production Readiness Plan / TO-DO List

Status: Required roadmap to move the Smart Attendance System from a feature-rich prototype to a production-ready application.

This document consolidates all major gaps discovered in the repository and provides a concrete remediation plan. It is intentionally comprehensive and should be treated as an execution checklist for engineering, security, operations, and QA.

## Executive Summary

The current codebase already contains a substantial feature surface and a coherent user experience, but it is not production-ready as inspected. The highest-priority risks are:

- exposed configuration and secret management issues
- unauthenticated AI endpoints
- weak backend authorization and tenant isolation
- frontend-only access restrictions
- lack of test coverage
- insufficient deployment hardening and observability
- incomplete data integrity and privacy controls

Production readiness requires closing all systemic gaps before the app can be considered secure, reliable, and supportable in a real school environment.

---

## 1. Security & Secret Management

### Task 1.1: Remove secrets from source control
- [ ] Audit all committed config files and delete or rotate sensitive values.
- [ ] Remove Firebase client config from repo if it includes operational secrets or internal identifiers that should not be public.
- [ ] Ensure no API keys, project IDs, admin emails, or tokens are committed to Git history.
- [ ] Rotate any keys that were exposed before remediation.

Fix:
- Move all secrets to environment variables or a secret manager (e.g., GitHub Actions secrets, AWS Secrets Manager, Azure Key Vault, Doppler, Vault).
- Add `.env.example` only with dummy values and placeholders.
- Use strict `.gitignore` rules for local secret files.
- Review Git history and purge exposed secrets if necessary.

### Task 1.2: Restrict Firebase web config and use safe deployment patterns
- [ ] Separate public Firebase web configuration from private runtime settings.
- [ ] Avoid storing production secrets in client-side files.
- [ ] Restrict Firebase API usage using project-level security and domain allowlists.

Fix:
- Store only non-sensitive client config in the frontend.
- Keep all private credentials and administrative operations server-side.
- Use Firebase project restrictions and authorized domains.

### Task 1.3: Secure server-side environment variables
- [ ] Validate environment variables at startup.
- [ ] Fail fast if required values are missing.
- [ ] Use safe defaults only for local development.

Fix:
- Define required ENV vars: `GEMINI_API_KEY`, `PORT`, `NODE_ENV`, `APP_URL`, Firebase service config, DB credentials, session secrets.
- Validate presence and format on boot.
- Log startup warnings only in non-production environments.

### Task 1.4: Add security scanning
- [ ] Add secret scanning in CI.
- [ ] Add dependency vulnerability checks.
- [ ] Add SAST/linters for insecure patterns.

Fix:
- Use GitHub Advanced Security, TruffleHog, Gitleaks, Snyk, npm audit, or equivalent.
- Add CI gates blocking known secret exposures.

---

## 2. Authentication, Authorization & Access Control

### Task 2.1: Add server-side authentication for all API routes
- [ ] Protect all AI routes and operational APIs with authentication.
- [ ] Require valid session or token on every business action.

Fix:
- Add JWT/session middleware or Firebase Admin SDK verification on the Express backend.
- Validate tokens server-side for every request.
- Reject unauthenticated traffic before processing business logic.

### Task 2.2: Implement role-based access control (RBAC)
- [ ] Define authorizations for admin, registrar, teacher, parent.
- [ ] Enforce role checks server-side at route level.
- [ ] Deny access by default.

Fix:
- Build a permission matrix:
  - admin: all tenants, audit access, settings changes, user management
  - registrar: student roster, attendance, reports
  - teacher: attendance sessions, class-level data
  - parent: only own children and related notices
- Validate role in middleware before route logic runs.

### Task 2.3: Enforce tenant isolation
- [ ] Add tenant ID to all data records.
- [ ] Restrict read/write access by tenant membership.
- [ ] Prevent cross-tenant data leakage in queries.

Fix:
- Add `tenantId` to every relevant record and query filter.
- Enforce `tenantId` in Firestore rules and backend queries.
- Filter parent visibility to only that guardian’s child records.

### Task 2.4: Remove client-side-only authz assumptions
- [ ] Remove dependency on UI role filtering as the only security barrier.
- [ ] Ensure backend rejects unauthorized actions even if a client is modified.

Fix:
- Move all permissions checks out of React state and into server-side middleware.
- Treat UI filtering as convenience only, not enforcement.

### Task 2.5: Harden admin identity model
- [ ] Replace hardcoded admin assumptions with managed admin roles.

Fix:
- Store admin group/role in a secure database collection.
- Check role via server logic rather than a hardcoded email address or single user.

---

## 3. Database & Firestore Security

### Task 3.1: Upgrade Firestore rules
- [ ] Restrict each collection by auth + role + tenant.
- [ ] Add write rules that prevent unauthorized mutation.
- [ ] Add admin-only rules for sensitive data.

Fix:
- Use Firestore rules that require `request.auth != null` and role membership.
- Require `tenantId` to match user tenant.
- Deny writes unless the user holds the required permission.

### Task 3.2: Add data validation before writes
- [ ] Validate required fields before storing student/session/justification records.
- [ ] Prevent invalid status values or partial updates.

Fix:
- Add backend validation layer and adjust Firestore rules to reject malformed writes.
- Validate `status`, `tenantId`, record IDs, and dates in API layer.

### Task 3.3: Implement an operational audit trail with tamper resistance
- [ ] Move audit logs to a protected collection.
- [ ] Restrict modifications/deletions of audit logs.
- [ ] Add immutable entry timestamps and actor metadata.

Fix:
- Use server-side audit writes only.
- Add append-only semantics or separate immutable storage for audit records.
- Ensure logs cannot be edited by user roles.

### Task 3.4: Formalize schema and migrations
- [ ] Define a canonical schema for students, sessions, justifications, notifications, and settings.
- [ ] Add migration tooling for schema changes.

Fix:
- Introduce typed schema definitions and versioned migration scripts.
- Add validation on startup or deployment pipeline.

---

## 4. Backend API Hardening

### Task 4.1: Add API input validation
- [ ] Validate all request payloads.
- [ ] Reject empty, malformed, and oversized payloads.

Fix:
- Use Joi, Zod, Valibot, or Express validation middleware.
- Validate required strings, numeric ranges, enums, image size, and file MIME types.

### Task 4.2: Add rate limiting and abuse protection
- [ ] Limit requests per IP and per user.
- [ ] Throttle AI endpoints.

Fix:
- Add express-rate-limit or API gateway rate controls.
- Use quotas for AI calls, photo uploads, and notifications.
- Add IP-based and user-based quotas.

### Task 4.3: Add request size and upload controls
- [ ] Restrict uploaded file sizes.
- [ ] Validate accepted image types and limits.

Fix:
- Allow only expected document types, e.g., PNG/JPG/PDF.
- Enforce upload size limits and reject invalid payloads.

### Task 4.4: Add structured error handling
- [ ] Return consistent API error formats.
- [ ] Hide internal implementation details from clients.

Fix:
- Standardize error responses: code, message, requestId, traceId.
- Log detailed errors server-side but return generic errors to clients.

### Task 4.5: Add health checks and readiness checks
- [ ] Add `/healthz` and `/readyz` endpoints.
- [ ] Include dependency checks: DB reachable, AI service reachable.

Fix:
- Create readiness checks for Firebase, Gemini, and critical storage dependencies.
- Expose health in deployment orchestration.

---

## 5. AI & External Service Safety

### Task 5.1: Secure Gemini endpoints
- [ ] Require authentication for all AI requests.
- [ ] Add quota controls and user-level limits.
- [ ] Sanitize prompt content.

Fix:
- Add middleware verifying auth and role before Gemini calls.
- Validate or sanitize user-controlled strings before sending to AI models.
- Put AI usage behind controlled service wrappers.

### Task 5.2: Add prompt and output governance
- [ ] Define approved prompt templates and allowed output structures.
- [ ] Validate AI model output before using it in app logic.

Fix:
- Schema-check results before storing them in `aiAnalysis` or `geminiBriefing`.
- Reject malformed responses from the model.
- Use deterministic parsing patterns and fallback logic only when safe.

### Task 5.3: Add moderation and abuse prevention
- [ ] Prevent prompt injection from user text.
- [ ] Restrict the types of requests allowed for external AI usage.

Fix:
- Include controlled input allowlists and output validation.
- Add business policies on handling medical data.
- Keep PII handling minimal and explicit.

### Task 5.4: Secure logs and AI traces
- [ ] Remove raw sensitive content from logs.
- [ ] Add redaction for names, phone numbers, and medical documents.

Fix:
- Mask PII in logs and telemetry.
- Attach request IDs rather than raw content.

---

## 6. Data Privacy & Compliance

### Task 6.1: Minimize PII exposure
- [ ] Limit storage of personal student data to only what is required.
- [ ] Mask sensitive fields in UI and logs.

Fix:
- Keep student national IDs and guardian phone numbers in restricted storage only.
- Use redaction in logs and emails.
- Enforce strict visibility rules for parent accounts.

### Task 6.2: Implement privacy-safe notification templates
- [ ] Ensure notifications do not expose sensitive medical details.
- [ ] Use protected links instead of direct sensitive content.

Fix:
- Replace plain medical content with concise notifications and secure portal links.
- Keep medical documents in secured storage, not in SMS text.

### Task 6.3: Define retention policy
- [ ] Define how long notifications, attachments, and audit records are kept.
- [ ] Add deletion/retention flows for expired records.

Fix:
- Set retention windows for attachments, student records, and audit logs.
- Add explicit deletion policies and cleanup jobs.

### Task 6.4: Add consent / data handling documentation
- [ ] Document what data is collected and why.
- [ ] Ensure school and parent-facing privacy policies exist.

Fix:
- Add privacy policy and user consent language.
- Ensure data collection matches actual usage.

---

## 7. Application Architecture & Code Quality

### Task 7.1: Break up the large state provider
- [ ] Split `AttendanceContext` into smaller domain modules.
- [ ] Separate auth, student data, attendance logic, notifications, and AI concerns.

Fix:
- Use domain-specific hooks/services such as:
  - `AuthService`
  - `StudentService`
  - `AttendanceService`
  - `NotificationService`
  - `JustificationService`
  - `DigestService`
- Keep context only for UI state and authenticated user context where necessary.

### Task 7.2: Add a consistent service layer
- [ ] Move business logic out of components and UI state.
- [ ] Use repository/service patterns for fetch/store logic.

Fix:
- Introduce centralized application services with typed methods and validation.
- Components should call service functions, not manipulate raw state directly.

### Task 7.3: Standardize coding patterns
- [ ] Add linting and formatting rules.
- [ ] Add TypeScript strictness.

Fix:
- Enable strict mode in `tsconfig.json`.
- Add ESLint rules for React hooks, accessibility, and code quality.
- Use Prettier for formatting consistency.

### Task 7.4: Add explicit production vs prototype boundary
- [ ] Separate mock/demo data from real persistence flows.
- [ ] Add a clear feature flag system.

Fix:
- Use environment-specific configuration: local, staging, production.
- Make mock data disabled in production builds.

---

## 8. Frontend QA & UX Hardening

### Task 8.1: Improve accessibility
- [ ] Add keyboard navigation where necessary.
- [ ] Fix ARIA issues and focus management.
- [ ] Increase color contrast where needed.

Fix:
- Run accessibility scans and fix all reported issues.
- Audit all dialogs, tables, navigation, and filters for keyboard support.

### Task 8.2: Add error boundaries and UI resilience
- [ ] Add global error boundary for major app sections.
- [ ] Catch failed fetches and invalid state gracefully.

Fix:
- Wrap major routes/views in `ErrorBoundary`.
- Provide fallback UI and retry flow.

### Task 8.3: Add loading and empty states everywhere
- [ ] Improve network loading indicators and skeleton states.
- [ ] Standardize empty-state messaging.

Fix:
- Add skeleton loaders and consistent empty-state cards for all lists and tables.

### Task 8.4: Improve form validation
- [ ] Validate required fields on all forms.
- [ ] Add inline field validation messaging.

Fix:
- Validate CSV import fields, excuse forms, settings forms, and login forms.
- Avoid silent failure on invalid entries.

---

## 9. Testing Strategy

### Task 9.1: Add automated unit tests
- [ ] Add tests for utility functions and validators.
- [ ] Add tests for business rules like absence thresholds and digest calculations.

Fix:
- Use Vitest or Jest.
- Cover digest logic, attendance rule calculations, and notification template generators.

### Task 9.2: Add component tests
- [ ] Test major UI flows for admin, teacher, and parent views.

Fix:
- Use React Testing Library for interactive UI checks.
- Cover modal behavior, form actions, and role filtering.

### Task 9.3: Add API tests
- [ ] Add tests for `/api/chat`, `/api/analyze-image`, and summary endpoints.

Fix:
- Mock AI responses safely.
- Validate auth, payload checks, and error handling.

### Task 9.4: Add end-to-end tests
- [ ] Cover the core school flow: login, attendance entry, excuse submission, workflow approval.

Fix:
- Use Playwright or Cypress.
- Run against staging environment on CI.

### Task 9.5: Add CI gates
- [ ] Require tests and linting to pass before merge.

Fix:
- Add GitHub Actions workflow with unit + e2e gates.
- Require review before merge to production branches.

---

## 10. Deployment, Observability & Operations

### Task 10.1: Harden deployment pipeline
- [ ] Add separate environments: local, staging, production.
- [ ] Use environment-specific config and secrets.

Fix:
- Create staging and production deployment workflows.
- Use environment isolation for Firebase, API keys, and feature flags.

### Task 10.2: Add monitoring and alerting
- [ ] Track app errors, latency, and failed API calls.
- [ ] Alert on elevated error rates or failed AI requests.

Fix:
- Integrate Sentry, LogRocket, or equivalent.
- Add request metrics and health checks.

### Task 10.3: Add observability for core workflows
- [ ] Log attendance changes, excuse decisions, and digest generation.
- [ ] Include correlation IDs on each request.

Fix:
- Centralize logs in a structured logging pipeline.
- Support request tracing from frontend to backend to external AI.

### Task 10.4: Improve incident recovery and rollback
- [ ] Add rollback plan for new deployments.
- [ ] Keep backups of critical DB data and configuration.

Fix:
- Use versioned releases with one-click rollback.
- Back up critical records daily or after significant changes.

---

## 11. Notification & Messaging Reliability

### Task 11.1: Replace simulated dispatch with real gateway integration
- [ ] Add reliable SMS and WhatsApp integrations.
- [ ] Add delivery status tracking and retries.

Fix:
- Integrate with a real provider SDK or API.
- Persist status transitions (`queued`, `sent`, `delivered`, `failed`).
- Support retry and dead-letter handling.

### Task 11.2: Add message delivery audit
- [ ] Log each send attempt and final delivery status.
- [ ] Ensure outbox records are durable and recoverable.

Fix:
- Use transactional outbox patterns and storage-backed retry queues.
- Make message send outcomes auditable.

### Task 11.3: Add notification suppression and compliance controls
- [ ] Prevent duplicate sends and limit recurrences.

Fix:
- Add deduplication keys per notification.
- Enforce quiet hours and compliance constraints where required.

---

## 12. Reporting, Exports & Compliance

### Task 12.1: Validate export formats and compliance requirements
- [ ] Review CSV/XLS/PDF export logic.
- [ ] Ensure fields are correct and official document headers are accurate.

Fix:
- Add export validation tests.
- Confirm filenames, date formats, and encoding meet standards.

### Task 12.2: Add official document signing or secure archival path
- [ ] Decide whether exports are for internal use or legal records.

Fix:
- Use a secure archive or official document storage if required.
- Add digital signing or verification if school policy demands it.

---

## 13. Performance & Scalability

### Task 13.1: Benchmark critical flows
- [ ] Measure attendance submission, report generation, and digest generation.
- [ ] Identify slow operations and optimize them.

Fix:
- Load-test key endpoints and table views with realistic data sizes.
- Add pagination and filtering to large tables.

### Task 13.2: Add caching where appropriate
- [ ] Cache tenant settings and static reference data.

Fix:
- Cache config and policy objects in memory or a managed cache.
- Use invalidation on settings changes.

### Task 13.3: Prepare for real-scale tenant growth
- [ ] Design indexes, query patterns, and storage around expected school sizes.

Fix:
- Index by `tenantId`, `studentId`, `sessionId`, `date`, and `status`.
- Ensure queries avoid full collection scans in large datasets.

---

## 14. Documentation & Operational Readiness

### Task 14.1: Add operational runbooks
- [ ] Document deployment steps.
- [ ] Document incident responses.
- [ ] Document database backups and restore procedures.

Fix:
- Create `docs/runbooks` or operational manuals for support staff.
- Include a playbook for AI endpoint failures, database issues, and notification outages.

### Task 14.2: Add release and rollback procedures
- [ ] Document how to deploy and roll back a release.

Fix:
- Create a release checklist and rollback script workflow.

### Task 14.3: Create admin and support documentation
- [ ] Document how administrators manage school settings, reports, and access levels.

Fix:
- Add training docs and admin guides.

---

## 15. Compliance & Governance Checklist

### Task 15.1: Define governance for school data
- [ ] Clarify who owns student records and notifications.
- [ ] Define retention and access policies.

### Task 15.2: Define security governance
- [ ] Add owner for app security and infrastructure.
- [ ] Enforce change review and deployment approval gates.

### Task 15.3: Add legal/compliance review for AI and student data use
- [ ] Ensure use of AI on student data complies with school policy and local data protection requirements.

Fix:
- Review AI use with stakeholders.
- Define acceptable processing boundaries for parental information and medical documents.

---

## Immediate Priority Order

The following should be done first before broader feature work continues:

1. Secret management cleanup
2. Server-side authentication and authorization
3. Firestore rules and tenant isolation
4. API validation + rate limiting
5. AI endpoint security and output validation
6. Test coverage and CI enforcement
7. Production config and deployment hardening
8. Monitoring and backups
9. Role-based governance and policy enforcement
10. Final accessibility, QA, and release validation

---

## Acceptance Criteria for Production Readiness

The app can be considered production-ready only when all of the following are true:

- [ ] Secrets are not stored in source control.
- [ ] All backend routes are authenticated and authorized.
- [ ] Tenant isolation is enforced in DB rules and API logic.
- [ ] Firestore rules prevent unauthorized writes.
- [ ] AI endpoints are protected and quota-limited.
- [ ] Input validation and rate limiting are implemented.
- [ ] Audit logs are immutable and complete.
- [ ] Test coverage exists for critical flows.
- [ ] CI blocks broken builds and weak security patterns.
- [ ] Monitoring and fallback procedures are in place.
- [ ] Data retention and privacy policy are defined.
- [ ] Notification systems are reliable and auditable.
- [ ] Production deployment is environment-isolated and recoverable.

---

## Final Recommendation

The current repo is a strong feature prototype and product demo, but not yet a production-ready school operations platform. The remediation work above is the minimum serious roadmap needed to close the security, operational, and governance gaps before launch.

This list should be used as the engineering backlog for the productionization effort. Every item should be assigned, implemented, tested, and verified before the application is used in a live production environment.

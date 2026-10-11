# Sprint-by-Sprint Production Readiness Roadmap

Status: Recommended execution plan to move the Smart Attendance System from prototype/demo to production-ready application.

This roadmap converts the production readiness checklist into practical delivery sprints. It covers security, architecture, testing, operations, and rollout.

---

## Sprint 0 — Stabilization & Scope Freeze

Goal: Freeze scope, confirm the production target architecture, and establish execution guardrails.

### Deliverables
- [ ] Final production scope document approved by stakeholders
- [ ] Production architecture diagram approved
- [ ] Data model confirmed for tenant, role, and student records
- [ ] Security requirements signed off
- [ ] Deployment target selected (e.g. Vercel/Cloud Run/Fly.io/AWS/GCP/Azure)
- [ ] CI/CD pipeline skeleton created
- [ ] Team roles and owners assigned

### Core tasks
- Define functional MVP for production
- Define non-goals and deferred features
- Confirm auth model and RBAC matrix
- Confirm environment matrix: local, staging, production
- Confirm backup and recovery model

### Exit criteria
- Stakeholders approve the production scope
- All critical workflows are mapped to owner/team responsibilities
- No unresolved architecture ambiguity remains

---

## Sprint 1 — Security Foundation & Secret Cleanup

Goal: Eliminate the most critical exposure points before touching feature work.

### Deliverables
- [ ] No secrets in repo history or active branch
- [ ] Environment variables centralized
- [ ] Firebase config review complete
- [ ] Secret scanning integrated into CI
- [ ] Security incident response checklist created

### Core tasks
- Remove or rotate exposed keys and credentials
- Define `.env.example` and environment variable contract
- Move secrets into a secret manager
- Add Git leak detection and dependency vulnerability checks
- Review all public config and client-side exposure points

### Exit criteria
- No sensitive secrets stored in repo files
- A production secret management policy exists
- CI fails on accidental secret exposure

---

## Sprint 2 — Authentication, Authorization, and Tenant Isolation

Goal: Enforce production-grade access control on every route and data access pattern.

### Deliverables
- [ ] Authentication middleware on all protected routes
- [ ] RBAC enforcement by role
- [ ] Tenant isolation enforced in DB and API
- [ ] Parent visibility restricted to own child data only
- [ ] Admin-only operations protected end-to-end

### Core tasks
- Implement backend auth validation for Express routes
- Add RBAC middleware
- Add tenant filters to every query and update operation
- Review all Firestore rules and replace broad access rules
- Add server-side validation before any student/session write

### Exit criteria
- A user cannot perform unauthorized operations even with modified frontend state
- Parent access is limited to their own child records only
- Unauthorized requests are rejected by API and database rules

---

## Sprint 3 — Database Hardening & Data Integrity

Goal: Make the data layer safe, auditable, and production-usable.

### Deliverables
- [ ] Hardened Firestore rules or equivalent DB rules
- [ ] Schema validation layer in place
- [ ] Audit trail locked down and append-only
- [ ] Migration strategy defined
- [ ] Data retention policy defined

### Core tasks
- Add `tenantId` to every critical record
- Validate status fields and required records before saving
- Protect audit log collection from mutation by end users
- Define versioned migrations and schema checks
- Add retention strategy for logs, notifications, images, and attachments

### Exit criteria
- Data integrity rules are enforced across all modules
- Audit logs are immutable from normal application users
- Schema and retention standards are documented and implemented

---

## Sprint 4 — API Hardening, Input Validation, and Rate Limiting

Goal: Reduce the attack surface and prevent invalid or abusive requests.

### Deliverables
- [ ] Standard validation middleware across all routes
- [ ] Request size and file upload constraints
- [ ] Rate limiting enabled for API traffic
- [ ] Standard error format implemented
- [ ] Health and readiness endpoints available

### Core tasks
- Add request validation for all business routes
- Add rate limiting for AI routes, notification sending, and uploads
- Validate image type and size before processing
- Add `/healthz` and `/readyz`
- Standardize response codes and error payloads
- Add structured logging with request correlation IDs

### Exit criteria
- Invalid or malicious payloads are rejected
- AI endpoints are rate-limited and protected
- API health and uptime checks are operational

---

## Sprint 5 — AI Risk Controls & Guardrails

Goal: Make AI features secure, auditable, and safe for student data processing.

### Deliverables
- [ ] AI routes protected by auth and role checks
- [ ] User quota enforcement for AI usage
- [ ] Prompt/output validation implemented
- [ ] PII redaction in logs
- [ ] AI usage policy documented

### Core tasks
- Add service-level guardrails around Gemini usage
- Validate generated output before storing it in app state or DB
- Restrict AI usage to approved workflows only
- Add request-level auditing for AI actions
- Mask personal data in logs and telemetry

### Exit criteria
- AI endpoints require authentication and authorization
- Generated outputs are schema-validated before use
- AI activity is observable and auditable

---

## Sprint 6 — Testing & Quality Gates

Goal: Create a reliable regression safety net before launch.

### Deliverables
- [ ] Unit tests for business rules and utilities
- [ ] Component tests for main UI flows
- [ ] API tests for backend endpoints
- [ ] End-to-end tests for student flow, excuse flow, and admin flow
- [ ] CI pipeline with required green checks

### Core tasks
- Add tests for attendance calculations and digest logic
- Add component tests for admin and parent screens
- Add API tests for all protected routes
- Add Playwright/Cypress E2E for critical workflows
- Add linting and type checks to CI

### Exit criteria
- Critical business flows have automated coverage
- Pull requests cannot merge without passing checks
- High-risk features are covered by tests

---

## Sprint 7 — Notification Reliability & Operational Resilience

Goal: Ensure parent communication and message delivery are reliable and recoverable.

### Deliverables
- [ ] Real SMS/WhatsApp provider integration configured
- [ ] Retry/delivery tracking implemented
- [ ] Outbox processing durable and recoverable
- [ ] Duplicate/misfire prevention in place
- [ ] Notification failure alerts configured

### Core tasks
- Replace prototype notification flow with real provider integration
- Add a durable outbox queue or equivalent transactional pattern
- Add provider status tracking and retry logic
- Add failure monitoring and dead-letter handling
- Ensure duplicate reminders are suppressed

### Exit criteria
- Notification sending is dependable and auditable
- Retries and failed sends are manageable operationally
- Message outcomes are visible to support staff

---

## Sprint 8 — Observability, Logging, and Production Monitoring

Goal: Make the system operable in production under real traffic and incidents.

### Deliverables
- [ ] Structured logs enabled
- [ ] Error monitoring configured
- [ ] Uptime and dependency monitoring enabled
- [ ] Alerting rules configured
- [ ] Incident response runbook published

### Core tasks
- Add application monitoring and centralized logs
- Integrate error reporting (Sentry, LogRocket, or equivalent)
- Add metrics for API failures, latency, and AI usage
- Alert on critical failures such as DB outage or AI provider outage
- Create disaster playbook and support workflow

### Exit criteria
- Engineering team can diagnose failures without code inspection
- Production alerts are configured and actionable
- Support staff know how to respond to common incidents

---

## Sprint 9 — Performance, Scalability, and Hardening

Goal: Handle real use at teacher, parent, and administrator scale.

### Deliverables
- [ ] Performance bottlenecks identified and optimized
- [ ] Caching strategy documented and applied where helpful
- [ ] Large dataset query patterns reviewed
- [ ] Database indexes and query tuning in place
- [ ] Load test results recorded

### Core tasks
- Measure critical endpoints under realistic data sizes
- Optimize queries and list rendering for large tables
- Add pagination and filtering where needed
- Review Firestore indexes and query patterns
- Run a production load test on staging

### Exit criteria
- Core operations remain responsive under expected multi-user load
- No critical full-table scans remain in hot paths
- Performance is verified in staging

---

## Sprint 10 — Release Readiness, Compliance, and Production Launch

Goal: Validate that the system is ready for live operation.

### Deliverables
- [ ] Production launch checklist complete
- [ ] Security signoff complete
- [ ] Compliance/privacy review complete
- [ ] Rollback plan tested
- [ ] Go-live signoff from stakeholders

### Core tasks
- Run security and data privacy review
- Run regression test suite on staging
- Validate production environment and monitoring
- Train support/admin staff on day-2 operations
- Test rollback and recovery procedures
- Final go-live signoff

### Exit criteria
- Production launch has explicit approval and rollback plan
- Emergency procedures are ready
- All critical items from the production-readiness plan are completed

---

## Recommended Sprint Sequence Summary

1. Sprint 0 — Scope freeze and architecture approval
2. Sprint 1 — Secret cleanup and security foundation
3. Sprint 2 — Auth, RBAC, and tenant isolation
4. Sprint 3 — Database hardening and integrity
5. Sprint 4 — API validation, rate limiting, and health checks
6. Sprint 5 — AI guardrails and PII protection
7. Sprint 6 — Testing and CI gate enforcement
8. Sprint 7 — Notification reliability and delivery handling
9. Sprint 8 — Monitoring and observability
10. Sprint 9 — Optimization and load testing
11. Sprint 10 — Release readiness and production launch

---

## Recommended Execution Rules

- Each sprint has a clear owner and acceptance criteria.
- No sprint should proceed to the next if its exit criteria are not met.
- Security issues must be fixed before feature expansion.
- Production issues must be prioritized above UX polish unless there is a direct service impact.
- Every major fix should be backed by tests and code review.

---

## Final Recommendation

This roadmap should be treated as the minimum viable productionization plan. The app has strong feature depth, but it must not be launched to production without completing the security and governance work above.

The most important rule is: do not continue feature expansion beyond the current sprint until the security and authorization foundation is fully completed.

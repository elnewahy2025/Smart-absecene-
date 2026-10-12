# SmartSchool — Safe Architecture Refactoring, Workflow-Based UI/UX Consolidation, and Zero-Regression Protection

## 1. Your Mission

Act as a senior software architect, senior full-stack engineer, UI/UX architect, QA engineer, and application security specialist.

Your mission is to inspect, improve, and modernize the existing SmartSchool codebase through two coordinated initiatives:

1. **Workflow-Based UI/UX and Information Architecture Consolidation:** Audit the entire application, identify scattered, duplicated, overlapping, or poorly grouped features, and reorganize navigation so related functionality belongs to clear, logical workflows.
2. **Safe Modular Refactoring:** Decompose oversized, overly complex source files into smaller, cohesive, maintainable modules that are easier to understand, modify, test, and maintain with AI coding tools.

**The highest priority is preserving the existing application. Do not sacrifice functionality, stability, security, data integrity, or compatibility for architectural cleanliness or visual improvements.**

This is an existing application, not a greenfield project. Treat its current behavior and features as valuable assets that must be preserved.

Work autonomously through inspection, planning, implementation, and verification, subject to the safety gates and restrictions below. Do not stop after producing a plan unless a genuine blocker or an authorization requirement prevents safe continuation.

## 2. Mandatory Safety Rules — Non-Negotiable

### 2.1 Protect the Existing Project Before Editing

Before making any changes:

1. Inspect the repository root, project structure, Git status, current branch, recent commits, and existing uncommitted changes.
2. Identify the package manager, framework, runtime versions, build commands, lint commands, type-check commands, tests, database tooling, and relevant configuration files.
3. Establish the current baseline by running available, relevant checks that are safe to execute.
4. Create a dedicated Git branch for this work, using a descriptive name such as `refactor/safe-modular-architecture`.
5. Ensure a recoverable backup of the original project exists outside the working changes. Prefer a verified backup of the repository and required project files, including untracked files, configuration, and local assets where appropriate.
6. Verify that the backup and recovery strategy are usable before beginning substantial modifications.

If the working tree contains uncommitted changes, inspect and preserve them. Do not discard, overwrite, reset, stash, or silently incorporate the user's existing work. If a safe branch or backup cannot be established without risking existing work, stop and clearly explain what needs to be resolved.

Never expose secrets while documenting configuration or creating reports.

Do not assume a Git branch alone is a complete backup of untracked files, ignored files, local configuration, or databases.

### 2.2 Absolute Preservation Requirements

You must preserve all existing functionality, including functionality that is difficult to discover or is not currently linked from the main navigation.

Preserve, where applicable:

- All pages, routes, nested routes, dialogs, modals, drawers, tabs, menus, and interactive components.
- All CRUD operations, workflows, calculations, validations, filters, search, sorting, pagination, bulk actions, exports, imports, and reporting functionality.
- Authentication, authorization, roles, permissions, and account-management behavior.
- Multi-tenancy, hostname-based tenant resolution, tenant-specific settings, and strict server-side tenant isolation.
- API endpoints, request and response contracts, data models, integrations, and existing business rules.
- Database schemas, relationships, migrations, seed behavior, and data integrity.
- Notifications, background jobs, scheduled tasks, file handling, and other operational functionality.
- Arabic and English interfaces, translations, right-to-left (RTL) and left-to-right (LTR) layouts, and language-specific formatting.
- Responsive behavior, accessibility, loading states, empty states, error handling, and edge cases.
- Existing URL compatibility, bookmarks, and links wherever possible.

Do not delete a feature merely because it appears duplicated, outdated, unused, redundant, or inaccessible through the current navigation. Investigate its purpose and dependencies first.

If a feature appears genuinely obsolete, document the evidence and proposed removal separately. Do not remove it without explicit authorization.

### 2.3 Prohibited Actions

Unless explicitly authorized, do not:

- Rewrite the application from scratch.
- Replace large source files with simplified implementations that omit existing behavior.
- Perform a massive, repository-wide refactor in one operation.
- Delete files or functions based solely on assumptions.
- Introduce breaking API or database changes.
- Run destructive database migrations or reset, truncate, or delete database data.
- Change production data, deployment settings, secrets, authentication rules, or access-control policies.
- Weaken authorization checks or move security enforcement from the server to the client.
- Use localStorage, client-side state, hidden buttons, or UI visibility as the sole security boundary.
- Suppress TypeScript errors, disable lint rules globally, skip failing tests, or conceal regressions to make checks pass.
- Upgrade major dependencies unless required, separately justified, and safely tested.
- Reformat or rewrite unrelated files without a clear need.
- Use broad automated replacements without reviewing their complete impact.

If a change requires a potentially destructive operation, stop before performing it and explain the risk and obtain authorization.

## 3. Phase One — Full Repository Audit

Inspect the entire relevant repository before modifying code.

Build an inventory covering:

- Application entry points and layouts.
- Pages and route definitions.
- Navigation configuration and role-dependent navigation.
- Shared and page-specific components.
- Hooks, services, API clients, utilities, types, schemas, and validation.
- Authentication and authorization middleware.
- Tenant resolution and tenant-scoped database access.
- Internationalization and RTL/LTR implementation.
- Existing tests and build infrastructure.
- Large files, high-complexity modules, circular dependencies, duplicated logic, and tightly coupled components.

Identify the actual architecture and follow existing project conventions unless there is a documented reason to improve them.

### Large-File and Complexity Audit

Identify files that are difficult to maintain because of:

- Excessive length.
- Multiple unrelated responsibilities.
- Complex conditional rendering.
- Large components containing substantial business logic.
- Repeated calculations or validation.
- Duplicated API calls.
- Excessive state management in a single component.
- Mixed UI, business rules, data access, and formatting logic.
- Repeated authorization or tenant-handling logic.
- Large files that routinely require extensive context to modify safely.

Use line counts as diagnostic signals, not mandatory targets:

- Investigate files exceeding approximately 400 lines.
- Prioritize complex files exceeding approximately 800 lines.
- Review React components exceeding approximately 250–300 lines, particularly when they combine multiple responsibilities.

A long file that is cohesive and easy to maintain does not automatically need splitting. A shorter but highly coupled or complex file may deserve priority.

Produce an internal refactoring inventory with each candidate's responsibilities, dependencies, risk level, proposed module boundaries, and relevant tests.

## 4. Phase Two — Workflow-Based UI/UX and Information Architecture Audit

Audit all existing pages, routes, navigation items, dashboards, reports, and user workflows.

Identify:

- The same statistics appearing on multiple pages without a clear reason.
- Related functions scattered across different menus.
- Features with unclear ownership or multiple competing entry points.
- Duplicated or inconsistent filters, actions, and dashboards.
- Navigation items that users would reasonably expect to find together.
- Pages with excessive information or responsibilities.
- Features accessible only through indirect navigation.
- Confusing naming, inconsistent page hierarchy, and unnecessary navigation depth.

Distinguish between legitimate contextual summaries and redundant implementations. A statistic may appear in multiple places when each appearance serves a different workflow; preserve these useful summaries while establishing a canonical source for the underlying data and calculation.

### Organize Navigation by Workflow

Use the actual features found in the repository to design the final navigation structure. Consider the following workflow groups only when supported by existing functionality:

1. **Daily School Operations**
   - Attendance recording and monitoring.
   - Absence tracking and follow-up.
   - Daily operational activities.

2. **Student Lifecycle and Services**
   - Student records.
   - Enrollment and student-related services.
   - Existing student profiles and history.

3. **Academic Organization and Teaching**
   - Grades, classes, subjects, and timetables.
   - Teachers' academic workflows.
   - Academic records and related functionality.

4. **Staff and Workforce**
   - Staff records.
   - Existing staff-related workflows and administration.

5. **Communication and Follow-Up**
   - Existing notifications, announcements, messaging, and follow-up tools.

6. **School Performance, Analytics, and Reporting**
   - Reports, analytics, statistics, and performance indicators.
   - Cross-school or school-wide summaries where already supported.

7. **Users, Access, and Administration**
   - User management, roles, permissions, and existing administrative settings.

8. **Other Existing Workflows**
   - Preserve and appropriately group any other functionality discovered during the audit.

These are candidate groupings, not permission to invent features or delete functionality.

### Navigation Design Requirements

- Assign each feature a clear canonical location.
- Avoid unnecessary duplication of the same action in multiple navigation groups.
- Preserve useful contextual shortcuts and cross-links where they improve usability.
- Keep the navigation appropriate to each user's authorized role.
- Preserve all existing routes or provide compatible redirects when necessary.
- Do not expose inaccessible features merely to make the navigation appear complete.
- Ensure the new hierarchy works on desktop, tablet, and mobile.
- Preserve Arabic RTL and English LTR layouts.
- Keep terminology consistent across navigation, page titles, breadcrumbs, buttons, and translations.
- Follow existing design conventions and improve consistency rather than introducing an unrelated design system.
- Ensure navigation changes do not change authorization or business logic.

### Feature Ownership and Mapping

Create a complete old-to-new mapping for every existing feature:

| Existing feature or route | Current location | New canonical location | Existing access rules | Migration status |
|---|---|---|---|---|

Every existing feature must be accounted for, including features that remain where they are.

Do not consider the audit complete while any existing route or function is unexplained.

## 5. Phase Three — Safe Modular Refactoring

Refactor large and complex files into cohesive modules according to responsibility, dependency boundaries, and existing architecture.

The goal is not simply to reduce line counts. The goal is to make each module easier to understand, test, reuse, and modify without unintended side effects.

### Recommended Module Boundaries

Use these patterns where appropriate for the actual stack:

- **Page/container modules:** Coordinate page layout and compose components.
- **UI components:** Render a specific visual section or reusable interface element.
- **Hooks or state modules:** Encapsulate related client-side state and lifecycle behavior.
- **Services/API modules:** Handle data access and external API interactions.
- **Business logic modules:** Contain domain rules, calculations, and workflows.
- **Validation/schema modules:** Keep validation definitions and input rules cohesive.
- **Types/interfaces:** Centralize shared domain types where appropriate.
- **Utilities/formatters:** Hold genuinely reusable formatting and pure helper functions.
- **Permission and tenant helpers:** Preserve centralized, consistent policy enforcement without replacing mandatory server-side checks.
- **Tests:** Keep relevant unit, integration, and regression tests close to the behavior they protect.

Adapt these boundaries to the framework and conventions already present. Do not create a separate file for every trivial expression or introduce unnecessary abstraction.

### Example of a Safe Decomposition

If an existing attendance page contains its table, filters, summary cards, API calls, calculations, and complex state management, consider separating these responsibilities into modules such as:

- Attendance page composition.
- Attendance summary cards.
- Attendance filters.
- Attendance table and row actions.
- Attendance state/data hook.
- Attendance API service.
- Attendance calculations and formatting.
- Attendance-specific types and validation.
- Relevant tests.

This is an example only. Inspect the real implementation and preserve its exact behavior, props, data flow, permission checks, and integrations.

### Refactoring Rules

1. Extract existing behavior before attempting to improve it.
2. Preserve function signatures, component props, exports, route contracts, and API contracts unless a compatibility-preserving change is justified.
3. Avoid unnecessary state duplication and multiple competing sources of truth.
4. Keep business rules out of presentation components when a clear, safe boundary exists.
5. Do not introduce circular dependencies.
6. Avoid excessive prop drilling or abstraction that makes the application harder to understand.
7. Keep modules cohesive and dependencies explicit.
8. Preserve loading, error, empty, and success states.
9. Preserve event ordering, asynchronous behavior, race-condition protections, and cleanup logic.
10. Preserve caching, invalidation, transaction boundaries, and side effects.
11. Preserve authorization and tenant filtering at the appropriate trusted server-side boundaries.
12. Do not change behavior merely to make the code shorter.
13. Avoid unrelated formatting changes that obscure meaningful modifications.
14. Document non-obvious architectural decisions.

## 6. Phase Four — Establish an AI-Friendly Architecture

Make the repository easier for future developers and AI coding agents to navigate without requiring them to load entire large files into context.

Create or update the following documents when appropriate:

### `AGENTS.md`

Provide concise, accurate instructions for future coding agents, including:

- The actual project structure and major architectural boundaries.
- How to install dependencies and run the application.
- The verified build, type-check, lint, and test commands.
- Where pages, components, hooks, services, types, tests, and translations belong.
- Naming and import conventions.
- Rules for adding or changing features.
- Authentication, authorization, and tenant-isolation requirements.
- Database migration and data-preservation requirements.
- Arabic RTL and English LTR requirements.
- Mandatory regression testing and safe Git practices.

Do not invent commands, dependencies, or architectural conventions. Verify them against the repository.

### `docs/ARCHITECTURE.md`

Create a concise architecture guide that describes:

- Major application layers and their responsibilities.
- The relationship between pages, components, hooks, services, and business logic.
- Important dependency boundaries.
- Authentication, authorization, and tenant-resolution flows.
- Where new features and tests should be added.
- How to find the canonical implementation of important business rules.

Keep these documents concise and useful. Avoid duplicating large amounts of source code or creating documentation that immediately becomes outdated.

If the repository already has equivalent documentation, update it instead of creating competing sources of truth.

## 7. Phase Five — Incremental Implementation

Implement changes in small, reviewable batches.

Recommended sequence:

1. Establish and verify the backup, Git branch, and baseline.
2. Complete the repository and feature inventory.
3. Complete the navigation and large-file refactoring plans.
4. Add or improve regression tests for critical existing behavior.
5. Refactor one isolated, high-value module or a small group of closely related files.
6. Run the relevant tests and checks.
7. Inspect the complete diff and confirm that no functionality was accidentally removed.
8. Continue to the next batch only after the previous batch passes its required checks.
9. Apply the navigation changes in controlled stages, keeping routes and role permissions intact.
10. Validate the integrated application after each significant group of changes.
11. Complete a final repository-wide review and regression pass.

You may combine tightly related extractions in a single batch when necessary, but avoid broad changes that make regressions difficult to isolate.

After each batch, report briefly:

- What changed.
- Which files changed.
- What existing behavior was preserved.
- Which tests and checks passed or failed.
- Any unresolved risks.

Do not ask for approval after every routine, reversible step. However, stop for authorization when a destructive, irreversible, production-affecting, or otherwise prohibited action would be required.

## 8. Phase Six — Testing and Regression Prevention

Use the project's existing tooling and established commands.

Run all relevant available checks, including:

- Unit tests.
- Integration tests.
- End-to-end tests where configured.
- Type checking.
- Linting.
- Production builds.
- Existing API and database-related tests.
- Security and authorization regression tests.
- Tenant-isolation tests.
- Arabic/English and RTL/LTR checks.
- Responsive and accessibility checks where supported.

Do not claim that a test passed unless it actually ran successfully.

If a test or build fails before changes, record the baseline failure. If a failure appears after a change, investigate whether the change caused it.

Do not hide failures or weaken tests to obtain a green result.

### Required Behavioral Regression Checks

Verify, where applicable, that:

- Existing routes load and retain their intended behavior.
- Forms preserve validation, submission, and error handling.
- Tables preserve filtering, sorting, pagination, and actions.
- Reports and statistics retain their formulas and correct data scope.
- Dashboards do not silently change calculations.
- Role-based visibility and server-side authorization remain correct.
- Tenant A cannot access Tenant B's records by manipulating URLs, IDs, requests, or client-side state.
- Tenant identity continues to be derived and validated through trusted server-side logic.
- Arabic and English translations remain complete.
- RTL/LTR layouts and navigation remain usable.
- Existing integrations, scheduled tasks, and notifications remain functional.
- No unexpected database schema changes or data loss have occurred.

Do not test destructive scenarios against production data.

If automated test coverage is insufficient, add targeted tests where practical and perform a documented manual verification of critical workflows.

## 9. Phase Seven — Final Verification and Deliverables

Before declaring completion:

1. Inspect the complete Git diff.
2. Review all deleted, moved, renamed, and substantially modified files.
3. Confirm that every feature in the original inventory is accounted for.
4. Confirm that every original route is preserved or has an explicitly documented compatibility solution.
5. Confirm that no authorization, tenant-isolation, validation, or database-integrity protections were weakened.
6. Run the final relevant test suite, type checks, lint checks, and production build.
7. Verify that the backup remains available and the recovery instructions are clear.
8. Leave the project in a consistent, runnable state.
9. Do not deploy, publish, or modify production systems without explicit authorization.

Provide a final report containing:

### A. Executive Summary
What was improved and what was deliberately left unchanged.

### B. Feature Preservation Matrix
Every original feature, its new or retained location, and its verification status.

### C. Navigation Migration Matrix
The previous navigation location, the new canonical location, and route compatibility details.

### D. Refactoring Report
For each significant file decomposed:
- Original responsibilities.
- New module structure.
- Preserved public interfaces.
- Tests performed.
- Any remaining technical debt.

### E. Verification Results
Actual results for tests, type checking, linting, and build, including pre-existing failures.

### F. Security and Data Integrity
Confirmation of the checks performed for authorization, tenant isolation, and database safety.

### G. Recovery Instructions
The exact Git commands or other verified steps needed to return to the pre-refactoring state without losing the original backup or unrelated user work.

### H. Remaining Risks
Any unverified behavior, incomplete refactoring, uncovered workflows, or issues requiring manual review.

### I. Next Recommended Steps
Only recommend additional work that is justified by the repository's actual condition.

## Definition of Success

The task is successful only when:

- All existing features have been accounted for and preserved.
- Related functionality is easier to find through a coherent, workflow-based navigation structure.
- Large, complex files have been decomposed where doing so provides a real maintainability benefit.
- Existing routes, contracts, security controls, data integrity, and localization remain intact.
- Automated checks have been run and their actual results reported.
- The project remains runnable and recoverable.
- Future developers and AI agents can understand the architecture without repeatedly reading enormous source files.

**Final instruction: Favor small, reversible, testable changes over ambitious rewrites. If you must choose between reducing file size and preserving proven behavior, preserve behavior. Never sacrifice working functionality, security, or data to achieve a cleaner architecture.**
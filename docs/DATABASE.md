# Database Overview

## Storage model

The repository indicates a combination of:

- Firebase Firestore for cloud persistence
- localStorage for browser-side state fallback
- model objects held in TypeScript interfaces for app state

## Likely collections

- `students`
- `attendance_sessions`
- `justifications`
- `notifications`
- `audit_logs`
- `settings`
- `tenants`
- `users`

## Data relationships

- Each tenant owns many students.
- Each student has multiple attendance records across sessions.
- Each student may have multiple justifications and notifications.
- Each attendance change is logged in an audit trail.

## Observations

- No formal SQL schema or migration system was visible in the inspected tree.
- The code is more document-store oriented than relational.
- Tenant isolation is not strongly enforced in the visible rules or state logic.

## Risk

The application is structured around data-centric school records, but there is no evidence of hardened data governance or production schema enforcement.

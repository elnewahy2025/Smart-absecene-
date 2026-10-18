# Database & Data Persistence Overview

## Storage Architecture

The Smart School Attendance System employs a synchronized, multi-tenant persistence architecture:

1. **Cloud Firestore (Primary Cloud Store)**:
   - Real-time `onSnapshot` multi-tenant data synchronization.
   - Hardened `firestore.rules` enforcing document-level schema validation and tenant isolation.
2. **Local Client Cache & Offline Persistence**:
   - Resilient offline state synchronization with structured local storage caching and clear connection status banners.
3. **Audit Log Append-Only Architecture**:
   - Administrative and operational events (`audit_logs`) are append-only. Firestore rules prohibit update or delete actions on audit logs (`allow update, delete: if false`).

## Core Collections & Tenant Scoping Matrix

All database collections are strictly scoped by `tenantId` (e.g. `school-1`, `school-2`):

| Collection | Description | Access Control Policy |
| :--- | :--- | :--- |
| `/tenants` | School tenant configuration & profile | Read by verified school members; write restricted to root admin. |
| `/users` | User credentials, roles & assignments | Read own record or tenant admin; write restricted to admins. |
| `/students` | Student rosters, classes & guardians | Scoped to `tenantId`. Teachers restricted to assigned classes; parents restricted to own children. |
| `/attendance_sessions` | Daily class attendance records | Scoped to `tenantId`. Teachers take draft sessions; submitted sessions locked from modification. |
| `/justifications` | Medical excuses & hospital reports | Scoped to `tenantId`. Parents view/submit own child only; admins & registrars review and approve. |
| `/notification_outbox`| Dispatched SMS & WhatsApp messages | Scoped to `tenantId`. Admin and registrar management only. |
| `/audit_logs` | Immutable operational audit trails | Scoped to `tenantId`. Append-only; zero updates or deletions permitted. |
| `/settings` | Dynamic school profile & policies | Scoped to `tenantId`. Managed exclusively by school admin. |

## Data Governance & Integrity Rules

- **Universal Settings Compliance**: All database insertions (student enrollment, session creation, excuse logging) must strictly adhere to the active `TenantSchoolProfile` (approved classes, academic year intervals, off-day exclusions).
- **IDOR Protection**: Verified at database level in `firestore.rules` using helper functions (`isTenantUser`, `isTenantRole`, `isTeacherAssigned`, `isParentOfStudent`).

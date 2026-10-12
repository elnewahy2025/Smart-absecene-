# Multi-Tenant & Role-Based Access Control (RBAC) Architecture

## Overview

The Smart School Attendance System ("مدرستي حضور") enforces a hardened, defense-in-depth Role-Based Access Control (RBAC) and Domain-Based Multi-Tenancy model. Security boundaries are strictly enforced across three distinct layers:
1. **Database Layer**: Granular Firestore Security Rules (`firestore.rules`).
2. **Server / API Layer**: Express middlewares (`authenticateToken`, `requireRole`, `requireTenant` in `server.ts`).
3. **Frontend Application Layer**: Contextual state guards, conditional view routing, and cryptographic token propagation (`AttendanceContext.tsx`, `api.ts`).

---

## 1. Role Definition & Permissions Matrix

The platform defines 4 standard institutional roles operating within school tenant boundaries (`school-1`, `school-2`), plus a root platform administrator:

| Capability / Module | Super Admin (`مدير المنصة`) | Admin / Principal (`مدير المدرسة`) | Registrar (`وكيل شؤون الطلاب`) | Teacher (`معلم`) | Parent (`ولي أمر`) |
| :--- | :---: | :---: | :---: | :---: | :---: |
| **Tenant Scoping** | Global (All Schools) | Current School Tenant | Current School Tenant | Assigned Classes in Tenant | Own Children in Tenant Only |
| **School Profile & Identity** | Read / Write | Full Config (Name, Address, Leadership, Stamps) | Read-only | Read-only | Read-only |
| **Student Roster Management** | Full CRUD | Full CRUD & CSV Import | Full CRUD & CSV Import | Read-only (Assigned Classes) | Forbidden |
| **Student Behaviour Tracking** | Full Access | Full Access & Award Points | Full Access & Log Incidents | Log Incidents for Students | Read-only (Own Child Only) |
| **Attendance Roll-Call** | Full Access | Full Access | Supervise & Submit | Take Draft Sessions (Assigned Classes) | Forbidden |
| **Reopen Submitted Sessions** | Full Access | Yes (With Mandatory Reason) | Yes (With Mandatory Reason) | Forbidden | Forbidden |
| **Medical Excuses (Justifications)** | Full Access | Review, Approve & Reject | Review, Approve & Reject | Read-only | Submit for Own Child Only |
| **Notification Outbox & SMS** | Full Access | View, Retry & Dispatch Batch | View, Retry & Dispatch Batch | Forbidden | Forbidden |
| **Batch Print Center & Reports** | Full Access | Generate & Print All | Generate & Print All | Class-specific Reports | Parent Report Card Only |
| **Daily Morning Email Digest** | Full Access | Configure & Trigger Dispatch | Configure & Trigger Dispatch | Forbidden | Forbidden |
| **Emergency Roster & Evacuation**| Full Access | Full Access (All Points) | Full Access (All Points) | Verify Assigned Class | Forbidden |
| **User & Staff Management (RBAC)** | Full Access | Full CRUD & Teacher Class/Subject Assignments | View Only | Forbidden | Forbidden |
| **Audit Logs Inspection** | Full Access | Tenant-Scoped Audit Log | Tenant-Scoped Audit Log | Forbidden | Forbidden |

---

## 2. Enforcement Architecture Across Layers

### Layer 1: Database Security Rules (`firestore.rules`)
- **Default Deny**: Global catch-all prevents unauthenticated or open reads/writes (`allow read, write: if false`).
- **Identity & Role Verification**: Reads user role and assigned tenant from `/users/$(request.auth.uid)`.
- **Tenant Isolation**: Every document query must match `resource.data.tenantId == getUserData().tenantId`.
- **Session Locking**: Submitted attendance sessions (`status == 'submitted'`) can **only** be modified or reopened by users with `admin` or `registrar` roles. Teachers cannot modify locked sessions.
- **Parent-Child Privacy Isolation**: Parents can **only** read student records and justifications where the guardian's phone number or email matches their verified credentials.

### Layer 2: API & Server Middleware (`server.ts`)
- **`authenticateToken`**: Validates Firebase ID tokens using the Firebase Admin SDK. Attaches verified `user`, `role`, and `tenantId` to the request object.
- **`requireTenant`**: Validates incoming `Host` or `X-Forwarded-Host` against the school domain registry. Rejects cross-tenant access attempts with `403 Forbidden` (`TENANT_DOMAIN_MISMATCH`).
- **`requireRole(allowedRoles)`**: Rejects unauthorized API calls (e.g. daily digest generation or AI analysis) before reaching route handlers.

### Layer 3: Frontend Client Layer (`src/context/AttendanceContext.tsx`)
- **RBAC Capability Flags**: Exposes boolean permission flags (`canManageSettings`, `canReviewJustifications`, `canReopenSessions`, `canImportStudents`, `canDispatchDigest`, `canManageOutbox`, `canEditSession`).
- **Authenticated API Client (`src/lib/api.ts`)**: Injects `Authorization: Bearer <token>`, `x-tenant-id`, and `x-user-role` headers on every network request.
- **Parent Isolation Filter**: The context explicitly filters state so parents only receive attendance data and behavior logs matching their children:
  ```typescript
  const students = currentUserRole === 'parent'
    ? allStudents.filter((s) => s.tenantId === tenantId && parentChildIds.includes(s.id))
    : allStudents.filter((s) => s.tenantId === tenantId);
  ```

---

## 3. Automated RBAC Test Suite

The RBAC system is covered by automated unit tests in `src/utils/rbac.test.ts` (9 test cases):
1. Admin has full capabilities across all modules.
2. Registrar has student, justification, and session management capabilities but cannot alter root system settings.
3. Teacher can only edit draft sessions for assigned classes and cannot reopen locked sessions.
4. Parent has zero administrative capabilities.
5. Parent-child isolation prevents parents from viewing other students' attendance records.
6. Tenant domain matching permits authorized logins and strictly rejects cross-tenant access with 403 Forbidden.
7. User creation verifies assigned classes and subjects for teachers.
8. Self-deletion protection prevents active administrators from deleting their own account.

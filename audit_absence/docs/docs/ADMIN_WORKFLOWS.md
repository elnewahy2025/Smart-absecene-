# ADMIN_WORKFLOWS
## School administrator (`admin`)
- **Login/Dashboard:** as in USER_WORKFLOWS.
- **Settings hub (`AuditSettingsView`, admin and platform owner; hidden from registrar/teacher/parent by UI guard):** school identity, contact, leadership, grades & classes, subjects, timetable periods, academic terms/calendar, holidays & weekends (+ smart import), emergency policy, messaging gateways (SMS/WhatsApp/email credentials), Gemini key (`/api/tenant/ai-config` GET/POST/DELETE/test), audit log, **user management** (create/edit/deactivate/delete accounts via `/api/users*`; temporary password shown once in the UI message).
- **Roles/permissions:** assigned per user (`admin/registrar/teacher/parent`); class/subject assignment for teachers; role changes revoke sessions.
- **Data management:** students CRUD/import/transfer; excuse review; outbox maintenance.
- **Reports/Monitoring:** reports center, audit logs; no monitoring dashboard beyond `/api/health`.

## Platform owner (`super_admin`)
`PlatformOwnerModal` / `PlatformRootView`: list schools (`GET /api/tenants`), provision a school with principal login (`POST /api/tenants/provision`; temporary password returned), activate/deactivate, view/suspend/reactivate/renew/patch subscription (`/api/tenants/:id/subscription*`), choose school via `?tenant=`, holiday search (`/api/owner/holidays/search`). Subscription changes are audited in `audit_logs`. Platform-owner bootstrap: `scripts/grant-platform-owner.mjs` (sets claim + `admins/{uid}`).
Details of individual modal fields: UNKNOWN (not read).

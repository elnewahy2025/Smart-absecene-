# Admin Workflows

## Administrative controls

The app exposes school controls through the unified React UI with strict 4-tier RBAC (`admin`, `registrar`, `teacher`, `parent`) and multi-tenant scoping:

- switching active tenant (`school-1` / `school-2`)
- importing students in bulk via CSV with strict Settings validation
- configuring school identity, leadership, calendar, classrooms, subjects, and attendance rules
- reviewing immutable audit logs
- generating in-app reports and authentic vector-based PDF exports
- sending batch reminders and unexcused absence warnings
- managing school policies, absence thresholds, and notification templates

## Administrative actions & Settings Compliance Rules

- **Strict Student Roster Import**: Every uploaded CSV record is validated against `schoolProfile.classes`. Records with classrooms or grades not configured in Settings are categorically rejected with explicit error reasons, an in-modal regulatory warning banner, and a downloadable CSV error report.
- **Academic Calendar & Off-Day Enforcement**: The system strictly enforces academic year bounds (starting Month 9: `2026-09-01`). Medical excuses and attendance sessions outside academic terms or coinciding with official holidays/weekends are blocked and rejected with clear alerts.
- **Dynamic Risk Thresholds**: All at-risk student calculations, interventions, and warning triggers bind to `schoolProfile.unexcusedWarningThreshold` and `schoolProfile.chronicAbsenceDaysThreshold`.
- **Review and Decisioning**: Full excuse approval/rejection with AI forensic verification, audit logging, and parent notifications.
- **Submitted Session Reopening**: Reopening submitted attendance sessions requires documenting an audited administrative reason.


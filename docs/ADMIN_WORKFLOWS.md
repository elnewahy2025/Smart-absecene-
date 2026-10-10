# Admin Workflows

## Administrative controls

The app exposes school controls through the same React UI rather than a separate admin-only application. The admin features include:

- switching active tenant
- importing students in bulk via CSV
- configuring attendance rules
- reviewing audit logs
- generating in-app reports and exports
- sending batch reminders and warnings
- managing school policies and notification templates

## Administrative actions

- Review all student import results
- Approve or reject excuse submissions
- Reopen attendance sessions when needed
- Trigger official warnings to guardians
- Configure chronic absence thresholds and default channels
- Export records to Excel or CSV

## Operational risk

Admin controls are implemented in the frontend and state layer, but they are not robustly backed by server-side authorization checks. This makes the app usable as a demo but weaker as a production operations platform.

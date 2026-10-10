# Features

## Core modules

- Attendance sessions management
- Student roster import and management
- Justification / excuse review
- Parent portal
- Notification outbox and batch reminders
- Emergency roster and assembly verification
- Reports and export center
- Daily digest generation
- Audit log and settings management
- AI chat and analyzer

## Feature notes

These flows are represented in components such as:

- `src/components/AttendanceSessionsView.tsx`
- `src/components/StudentManagementView.tsx`
- `src/components/JustificationsView.tsx`
- `src/components/ParentPortalView.tsx`
- `src/components/NotificationOutboxView.tsx`
- `src/components/EmergencyRosterView.tsx`
- `src/components/ReportsView.tsx`
- `src/components/DailyEmailDigestView.tsx`
- `src/components/AuditSettingsView.tsx`
- `src/components/GeminiChatbotView.tsx`

## Observed strengths

- Arabic-first UX and RTL layout
- School-specific workflows for absences, warnings, and medical excuses
- Role- and class-based filtering in the UI
- Good coverage of policy and reporting flows

## Observed limitations

- Some flows depend on mock data or local state rather than guaranteed real backend persistence
- UI role behavior does not replace backend enforcement

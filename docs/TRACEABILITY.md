# Traceability

## Feature to code mapping

- Attendance management → `src/context/AttendanceContext.tsx`, `src/components/AttendanceSessionsView.tsx`
- Student management → `src/components/StudentManagementView.tsx`
- Parent portal → `src/components/ParentPortalView.tsx`
- Justification management → `src/components/JustificationsView.tsx`
- Reports → `src/components/ReportsView.tsx`
- Notifications → `src/components/NotificationOutboxView.tsx`
- Emergency roster → `src/components/EmergencyRosterView.tsx`
- Daily digest → `src/utils/digestEngine.ts` and `src/components/DailyEmailDigestView.tsx`
- AI assistant → `server.ts`

## Traceability observation

The product is traceable to clear UI and state logic, which is helpful for understanding and maintenance. However, some of the critical policy logic is not isolated behind secure server services.

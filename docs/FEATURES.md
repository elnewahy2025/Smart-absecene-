# Features

## Core modules

- Attendance sessions management
- Touchless QR attendance optical scanner (live video, phone camera snapshot, hardware barcode reader)
- Individual and batch student QR attendance ID card generation & print center
- Student roster import and management
- Justification / excuse review
- Parent portal
- Notification outbox and batch reminders
- Emergency roster and assembly verification
- Reports and export center (official PDF document generator)
- Daily digest generation
- Audit log and settings management
- AI chat and analyzer

## Feature notes

These flows are represented in components such as:

- `src/components/AttendanceSessionsView.tsx`
- `src/components/QRScannerModal.tsx`
- `src/components/StudentQRCodeModal.tsx`
- `src/components/BatchQRModal.tsx`
- `src/components/OfficialReportModal.tsx`
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

---

## Planned Features Roadmap (Prioritized Order)

To preserve code integrity, implementation will proceed strictly modularly—modifying **only** the designated related functions without disturbing existing working flows.

### Phase 0: Central Dynamic School Profile & Settings Engine (COMPLETED ✅)
0. **Central School Profile & Settings (`#0`)**:
   - **Target Files**: `src/types/attendance.ts`, `src/config/tenantSettings.ts`, `src/context/AttendanceContext.tsx`, `src/components/settings/*`, `src/components/AuditSettingsView.tsx`
   - **Scope**: Eliminated hardcoded metadata across the platform. Implemented dynamic settings for Ministry header, school stage, full address, general phone, emergency hotline, official email, leadership (Principal, Vice Principal of Student Affairs, Vice Principal of Academic Affairs, Social Worker / Counselor), multi-term academic year, daily timetable periods, and campus assembly points.
   - **Phase 0.1**: Types & Canonical Defaults (`src/types/attendance.ts`, `src/config/tenantSettings.ts`) - [Completed ✅]
   - **Phase 0.2**: Context State Management & Tenant Persistence (`src/context/AttendanceContext.tsx`) - [Completed ✅]
   - **Phase 0.3**: Modular Settings UI Subcomponents (<150 lines each) in `src/components/settings/` - [Completed ✅]
   - **Phase 0.4**: Propagate Dynamic Profile to Reports & Real PDF Generator (`server.ts`, `OfficialReportModal.tsx`) - [Completed ✅]
   - **Phase 0.5**: Propagate Dynamic Profile to Emergency Roster, Badges, & Outbox (`EmergencyRosterView.tsx`, `StudentQRCodeModal.tsx`, `BatchQRModal.tsx`, `NotificationOutboxView.tsx`) - [Completed ✅]

### Phase 1: High Safety & Immediate Operational UX (COMPLETED ✅)
1. **Bulk Edit Confirmation Modal (`#7`)**: [Completed ✅]
   - **Target Files**: `src/components/attendance/BulkEditConfirmationModal.tsx`, `src/components/AttendanceSessionsView.tsx`
   - **Scope**: Intercepted bulk attendance and absence marking with a clear modal showing selected student count, student names, IDs, and impact warning before mutating records.
2. **Offline Sync Modal (`#3`)**: [Completed ✅]
   - **Target Files**: `src/components/OfflineSyncModal.tsx`, `src/App.tsx`, `src/lib/firebase.ts`
   - **Scope**: Upgraded offline banner into an interactive modal showing cached records breakdown across 5 local entities with a manual connection retry and cloud sync verification engine.
3. **Modular Print Stylesheets (`#8`)**: [Completed ✅]
   - **Target Files**: `src/styles/print.css`, `src/index.css`
   - **Scope**: Standardized print layout tokens across all views and modals ensuring proper paper margins, color fidelity, table header repetition, and page break isolation.

### Phase 2: Analytics & Reporting Visualizations (COMPLETED ✅)
4. **Absence Heatmap (`#2`)**: [Completed ✅]
   - **Target Files**: `src/components/reports/AbsenceHeatmapCard.tsx`, `src/components/ReportsView.tsx`
   - **Scope**: Created an interactive absence density matrix across days of the week (Sun-Thu) and class periods (1-7), highlighting attendance patterns and skip trends with clear heat levels.
5. **'Student Engagement' Dashboard (`#1`)**: [Completed ✅]
   - **Target Files**: `src/components/reports/StudentEngagementSection.tsx`, `src/components/ReportsView.tsx`
   - **Scope**: Integrated a motivational dashboard tracking consecutive attendance streaks, positive milestone badges (Diamond, Gold, Silver, Bronze), and progress bars towards 30-day goals.
6. **Generalized Batch Print Center (`#9`)**: [Completed ✅]
   - **Target Files**: `src/components/reports/BatchPrintCenterModal.tsx`, `src/components/ReportsView.tsx`
   - **Scope**: Built a multi-document batch printing center supporting weekly attendance sheets, warning notices, and student rosters with official leadership signatures.

### Phase 3: Interactive Workflows & Schema Extensions (COMPLETED ✅)
7. **Class Calendar View (`#6`)**: [Completed ✅]
   - **Target Files**: `src/components/attendance/ClassCalendarView.tsx`, `src/components/AttendanceSessionsView.tsx`
   - **Scope**: Added a Calendar mode switch in `AttendanceSessionsView` allowing instructors to view and navigate sessions via an interactive monthly calendar grid with status badges.
8. **Gamified Attendance UI (`#4`)**: [Completed ✅]
   - **Target Files**: `src/components/attendance/GamifiedCelebrationModal.tsx`, `src/components/AttendanceSessionsView.tsx`
   - **Scope**: Integrated confetti celebrations, achievement badges, and milestone encouragement triggered on session submission with special recognition for 100% full-class roll-call.
9. **Student Behaviour Tracking (`#5`)**: [Completed ✅]
   - **Target Files**: `src/types/attendance.ts`, `src/context/AttendanceContext.tsx`, `src/components/attendance/StudentBehaviourModal.tsx`, `src/components/StudentManagementView.tsx`
   - **Scope**: Added full behavioral incident logging, tracking positive reinforcements (+) and infractions (-), points ledger, action taken, guardian notification flags, and persistent school registry integration.
10. **Full Professional RBAC & User Management (`#10`)**: [Completed ✅]
    - **Target Files**: `src/types/attendance.ts`, `src/context/AttendanceContext.tsx`, `src/components/settings/UserManagementTab.tsx`, `src/components/settings/UserEditModal.tsx`, `src/components/AuditSettingsView.tsx`
    - **Scope**: Implemented full CRUD user management system with role assignments (Admin, Registrar, Teacher, Parent), teacher class & subject assignment, user activation/deactivation, and comprehensive audit trail logging.
11. **Dynamic School & Class Statistics (`#11`)**: [Completed ✅]
    - **Target Files**: `src/types/attendance.ts`, `src/context/AttendanceContext.tsx`, `src/components/students/SchoolClassStatsCards.tsx`, `src/components/AttendanceSessionsView.tsx`
    - **Scope**: Eliminated all hardcoded class lists across the application. Dynamically derives class sections, student headcounts per class, total school enrollment, average class density, school-wide attendance rate, and assigned teachers.
12. **Student Lifecycle & Official Transfer Archive (`#12`)**: [Completed ✅]
    - **Target Files**: `src/types/attendance.ts`, `src/context/AttendanceContext.tsx`, `src/components/students/TransferStudentModal.tsx`, `src/components/students/DeleteStudentConfirmationModal.tsx`, `src/components/StudentManagementView.tsx`
    - **Scope**: Official school transfer workflow with destination school records and reasons. Automatically hides transferred students from daily attendance roll-calls while safely archiving records until permanent deletion or administrative restoration.
13. **Direct Single Student Enrollment (`#13`)**: [Completed ✅]
    - **Target Files**: `src/components/students/AddStudentModal.tsx`, `src/components/StudentManagementView.tsx`, `src/context/AttendanceContext.tsx`
    - **Scope**: Streamlined modal allowing school administrators and registrars to enroll individual new students directly with complete academic and guardian details without having to re-upload full CSV rosters.
14. **Dynamic Academic Terms, School Classes & Subjects Configuration (`#14`)**: [Completed ✅]
    - **Target Files**: `src/components/settings/AcademicCalendarTab.tsx`, `src/components/settings/AcademicTermsCard.tsx`, `src/components/settings/ClassesManagementCard.tsx`, `src/components/settings/SubjectsManagementCard.tsx`, `src/types/attendance.ts`, `src/context/AttendanceContext.tsx`
    - **Scope**: Removed all static hardcoded values across the academic calendar. Administrators can dynamically create, edit, activate, or delete academic terms/semesters (`AcademicTerm`), configure school classrooms/sections (`SchoolClassConfig`: name, grade, room, capacity), manage approved subjects (`SchoolSubjectConfig`), and customize timetable periods (`TimetablePeriod`).15. **Workflow-Based Information Architecture & Clustered Navigation (`#15`)**: [Completed ✅]
    - **Target Files**: `src/components/HeaderNav.tsx`, `src/App.tsx`, `Comprehensive UIUX Audit.md`
16. **Enterprise Collapsible Tree Sidebar Navigation (`#16`)**: [Completed ✅]
    - **Target Files**: `src/components/AppSidebar.tsx`, `src/components/HeaderNav.tsx`, `src/App.tsx`
    - **Scope**: Re-architected application navigation to an enterprise-grade, collapsible RTL Tree Sidebar with expandable workflow sections (`Daily Operations & Attendance`, `Students & Classes`, `Excuses & Comms`, `Reports & Analytics`, `Administration`). Features mini-mode toggle (64px / 256px), mobile sliding drawer, breadcrumb page header with role switcher, and 100% preservation of RBAC boundaries and tenant isolation.

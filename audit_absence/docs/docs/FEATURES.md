# FEATURES
Status key: Implemented / Partially implemented / Unknown. "Unknown" = UI internals not read in full; existence is confirmed from files/call graph only. Context actions are from `useAttendance()` usage in each component.

| Feature | Location | Status | Main components | API | Firestore | Notes |
|---|---|---|---|---|---|---|
| Tenant resolution by domain | `tenantRegistry.ts`, `App.tsx` | Implemented | `UnknownDomainView` | `/api/tenant/resolve`, `/api/tenants` | tenants | dev-only switcher still active |
| Login (email/password) | `LoginPage`, `signInWithCredentials` | Implemented | LoginPage | Firebase Auth | users | Google sign-in function exists, UI use unknown |
| Role-based shell/navigation | `App.tsx`, `AppSidebar`, `HeaderNav` | Implemented (UI guard) | | | | server authoritative |
| Executive dashboard | `ExecutiveDashboardView`, `ExecutiveMorningBriefingCard`, `WeeklyAttendanceTrendCard` | Implemented (internals Unknown) | | generate-briefing | | |
| Attendance sessions (daily/period), submit/reopen, bulk mark | `AttendanceSessionsView`, `ClassCalendarView`, `BulkEditConfirmationModal` | Implemented (internals Unknown) | context: `createNewSession`, `updateRecord`, `setAllPresentInDraft`, `quickMarkGroupAsPresent`, `submitSession`, `reopenSession` | — | attendance_sessions, attendance_records | |
| QR attendance scan / student QR cards | `QRScannerModal`, `StudentQRCodeModal`, `BatchQRModal` | Implemented (Unknown depth) | jsQR, qrcode | — | — | |
| Emergency roster | `EmergencyRosterView/Modal` | Implemented (Unknown depth) | | pdf | | policy tab in settings |
| Student management (add/import/transfer/restore/delete/inquiry) | `StudentManagementView`, `StudentAbsenceInquiryView`, `StudentAbsenceDrawer`, students/* | Implemented | `addStudent`, `importStudents`, `transferStudent`, `restoreStudent`, `deleteStudent` | — | students | delete does not cascade |
| Excuses (submit/review, AI analysis) | `JustificationsView`, justifications/* | Implemented | `createJustification`, `reviewJustification`, `updateJustificationAnalysis` | `/api/analyze-image` | justifications, attendance_*, notification_outbox | attachments base64 in doc |
| Notification outbox (SMS/WhatsApp), retry, chronic warnings | `NotificationOutboxView`, `CommunicationsView` | Implemented | `retryNotification`, `retryAllFailedNotifications`, `sendCustomParentNotification`, `sendChronicWarningNotification` | `/api/notifications/dispatch` | notification_outbox | |
| Parent portal | `ParentPortalView`, parent/* | Implemented (Unknown depth) | | — | students, attendance_records, justifications, notification_outbox (by phone) | |
| Reports & batch print / PDF | `ReportsView`, `OfficialReportModal`, `BatchPrintCenterModal`, `pdfExport.ts` | Implemented | | `/api/pdf/generate` | | |
| Absence analytics (heatmap, grade patterns, engagement) | reports/*, `GradeAbsencePatternsSection` | Implemented (heatmap may use mock sessions: Unknown) | | | | |
| Daily email digest | `DailyEmailDigestView`, digest/* | Partially implemented | `generateCurrentDigest`, `dispatchDailyDigest`, `updateDigestConfig` | generate-briefing, dispatch | none (config/history memory-only) | no scheduler |
| AI chatbot | `GeminiChatbotView` | Implemented | | `/api/chat` | | |
| Behaviour incidents | `StudentBehaviourModal`, `addBehaviourIncident` | Partially implemented | | | none | not persisted |
| Audit log & settings hub | `AuditSettingsView`, settings/* | Implemented | `updateSettings`, `updateSchoolProfile`, `updateMessagingGateway`, `addAuditLog` | `/api/users*`, ai-config | settings, settings_private, audit_logs, users | |
| User management | `UserManagementTab`, `UserEditModal` | Implemented | `createUser`, `updateUser`, `deleteUser` | `/api/users*` | users | fail-open on network error |
| School AI key (Gemini) | `SchoolAIGeminiTab` | Implemented | | ai-config | tenant_ai_secrets | preferredModel unused |
| Messaging gateways config | `SchoolMessagingGatewaysTab` | Implemented | | | settings_private | plaintext secrets |
| Academic calendar/holidays/terms/classes/subjects/timetable | settings/* | Implemented | | owner holidays search | settings | |
| Platform owner console (schools, subscriptions) | `PlatformOwnerModal`, `PlatformRootView`, `SubscriptionGate` | Implemented | `provisionNewSchool` | tenants, subscription | tenants | plan limits not enforced |
| Offline/sync center | `OfflineSyncModal` | Partially implemented / Unknown | | `/api/health` | | |
| Theme switch, RTL/AR-EN | `ThemeContext`, `ThemeSwitcherDropdown` | Implemented | | | | |
| Scheduled jobs, webhooks, payments, file storage | — | Missing | | | | not present |

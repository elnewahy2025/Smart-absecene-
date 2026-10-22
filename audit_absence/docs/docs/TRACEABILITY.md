# TRACEABILITY

Feature → UI → context action → API → Firestore → external → tests. Context-action usage per component is mechanically extracted (`useAttendance()` destructuring); "Tests" lists tests that exercise the *server/helper layer* (no component tests exist). Gap = no direct test.

| Feature | UI | Context action | API / Rules | Service/Helper | Database | External | Tests | Status |
|---|---|---|---|---|---|---|---|---|
| Login | LoginPage | signInWithCredentials | Firebase Auth | — | users | Firebase | none direct (cloudAuthAudit is text-based) | Implemented; gap tests |
| Tenant resolution | App, LoginPage | syncTenantsWithServer, refreshSubscription | GET /api/tenant/resolve, /api/tenants | tenantRegistry | tenants | — | tenantResolution.test, serverIntegration | Implemented |
| Subscription gate | SubscriptionGate | refreshSubscription | requireActiveSubscription, rules | subscription.ts | tenants | — | subscription.test, serverIntegration | Implemented; limits unenforced |
| User management | UserManagementTab, UserEditModal | createUser/updateUser/deleteUser | POST/PATCH/DELETE /api/users | accountAccess, upsertManagedAccount | users | Firebase Auth | accountAccess.test, serverIntegration (401 only) | Implemented; success paths untested |
| Attendance sessions | AttendanceSessionsView | createNewSession, updateRecord, submitSession, reopenSession | rules attendance_* | attendanceAccess | attendance_sessions, attendance_records | — | attendanceAccess.test, calculationsAudit.test | Implemented |
| Students | StudentManagementView, students/* | addStudent…deleteStudent, importStudents | rules students | — | students | — | studentLifecycle.test | Implemented |
| Excuses + AI | JustificationsView, justifications/* | createJustification, reviewJustification | POST /api/analyze-image; rules justifications | callGeminiWithFallback | justifications | Gemini | none for route | Implemented; route untested |
| Notifications | NotificationOutboxView | retryNotification, sendCustomParentNotification | POST /api/notifications/dispatch | messagingProviders | notification_outbox | SMS/WhatsApp | messagingProviders.test, notificationDispatchRBAC.test | Implemented |
| Digest | DailyEmailDigestView | generateCurrentDigest, dispatchDailyDigest | generate-briefing, dispatch | digestEngine, sendEmail | none (memory) | Gemini, email | digestEngine.test | Partial |
| PDF/reports | ReportsView, OfficialReportModal | — | POST /api/pdf/generate | pdfExport | — | Chromium | studentAbsenceReportTemplate.test | Implemented; route untested |
| Chatbot | GeminiChatbotView | — | POST /api/chat | — | — | Gemini | none | Implemented; untested |
| AI key mgmt | SchoolAIGeminiTab | — | /api/tenant/ai-config* | tenantAISecrets | tenant_ai_secrets | Gemini | tenantAISecrets.test (fails w/o env) | Implemented |
| Gateway settings | SchoolMessagingGatewaysTab | updateMessagingGateway | rules settings_private | — | settings_private | — | messagingGatewayRBAC.test | Implemented; plaintext |
| School provisioning | PlatformOwnerModal | provisionNewSchool | POST /api/tenants/provision | upsertManagedAccount | tenants, settings, users | Auth | superAdminStealthAndProvisioning.test | Implemented |
| Behaviour incidents | StudentBehaviourModal | addBehaviourIncident | — | — | none | — | none | Partial |

## Component → context actions / API / Firestore (mechanical)

| Component | LOC | Context members used | API | Direct Firestore |
|---|---|---|---|---|
| AppSidebar.tsx | 427 | currentTenant, currentUser, justifications, lang, notifications, tenantDomainConfig | — | — |
| AttendanceSessionsView.tsx | 1368 | canEditSession, canReopenSessions, classesStats, createNewSession, currentUser, isOffDay, lang, quickMarkGroupAsPresent, reopenSession, schoolProfile, sessions, setAllPresentInDraft, students, submitSession, updateRecord | — | — |
| AuditSettingsView.tsx | 841 | auditLogs, canManageSettings, classesStats, createUser, currentTenant, currentUser, deleteUser, isSuperAdmin, lang, messagingGateway, schoolProfile, settings, updateMessagingGateway, updateSchoolProfile, updateSettings, updateUser, users | — | — |
| BatchQRModal.tsx | 225 | currentTenant, lang, schoolProfile, students | — | — |
| DailyEmailDigestView.tsx | 348 | currentTenant, digestConfig, digestHistory, dispatchDailyDigest, generateCurrentDigest, justifications, lang, sessions, students, updateDigestConfig | — | — |
| EmergencyRosterView.tsx | 349 | currentTenant, lang, schoolProfile, sessions, settings, students | — | — |
| ErrorBoundary.tsx | 131 | — | — | — |
| ExecutiveDashboardView.tsx | 974 | classesStats, currentTenant, justifications, lang, notifications, schoolEnrollmentStats, schoolProfile, sessions, students | — | — |
| GeminiChatbotView.tsx | 438 | currentTenant, lang | /api/chat | — |
| GradeAbsencePatternsSection.tsx | 814 | — | — | — |
| HeaderNav.tsx | 259 | currentTenant, currentUser, isSuperAdmin, lang, setLang, tenantDomainConfig | — | — |
| JustificationsView.tsx | 483 | canReviewJustifications, createJustification, currentUser, isOffDay, justifications, lang, reviewJustification, schoolProfile, students, updateJustificationAnalysis | /api/analyze-image | — |
| LoginPage.tsx | 204 | currentTenant, signInWithCredentials, tenantDomainConfig | — | — |
| NotificationOutboxView.tsx | 1241 | classesStats, currentTenant, lang, notifications, retryAllFailedNotifications, retryNotification, schoolProfile, sendCustomParentNotification, students | — | — |
| OfficialReportModal.tsx | 363 | currentTenant, currentUser, lang, schoolProfile, sessions, students | — | — |
| OfflineSyncModal.tsx | 407 | currentUser, isSuperAdmin | — | — |
| ParentPortalView.tsx | 266 | behaviourIncidents, currentTenant, currentUser, justifications, lang, notifications, sessions, students | — | — |
| PlatformRootView.tsx | 134 | — | — | — |
| QRScannerModal.tsx | 1316 | addAuditLog, currentUser, lang, sessions, students, updateRecord | — | — |
| ReportsView.tsx | 667 | currentTenant, justifications, lang, sendAllChronicWarningNotifications, sendChronicWarningNotification, sessions, students | — | — |
| StudentAbsenceInquiryView.tsx | 1643 | behaviourIncidents, justifications, lang, schoolProfile, sendChronicWarningNotification, sessions, students | — | — |
| StudentManagementView.tsx | 1258 | addBehaviourIncident, addStudent, behaviourIncidents, canImportStudents, classesStats, currentTenant, currentUser, deleteStudent, importStudents, lang, restoreStudent, schoolEnrollmentStats, schoolProfile, students, transferStudent | — | — |
| StudentQRCodeModal.tsx | 350 | currentTenant, lang, schoolProfile | — | — |
| SubscriptionGate.tsx | 159 | — | — | — |
| ThemeSwitcherDropdown.tsx | 149 | — | — | — |
| UnknownDomainView.tsx | 60 | — | — | — |
| WeeklyAttendanceTrendCard.tsx | 587 | classesStats, currentTenant, lang, schoolProfile, sessions, settings | — | — |
| attendance/BulkEditConfirmationModal.tsx | 160 | — | — | — |
| attendance/ClassCalendarView.tsx | 199 | isOffDay | — | — |
| attendance/EmergencyRosterModal.tsx | 431 | currentTenant, lang, schoolProfile, sessions, settings, students | — | — |
| attendance/GamifiedCelebrationModal.tsx | 121 | — | — | — |
| attendance/StudentBehaviourModal.tsx | 397 | — | — | — |
| communications/CommunicationsView.tsx | 107 | currentUser, justifications, lang, notifications | — | — |
| dashboard/ExecutiveMorningBriefingCard.tsx | 304 | currentTenant, digestConfig, dispatchDailyDigest, generateCurrentDigest, justifications, lang, sessions, students | — | — |
| digest/DigestEmailPreviewTab.tsx | 167 | — | — | — |
| digest/DigestHistoryTab.tsx | 178 | — | — | — |
| digest/DigestOverviewTab.tsx | 575 | — | — | — |
| digest/DigestSchedulerSettingsTab.tsx | 308 | — | — | — |
| digest/DigestSettingsModal.tsx | 230 | digestConfig, lang, schoolProfile, updateDigestConfig | — | — |
| digest/SandboxedEmailHtml.tsx | 34 | — | — | — |
| justifications/JustificationReviewModal.tsx | 486 | — | — | — |
| justifications/JustificationSubmitForm.tsx | 527 | isOffDay, schoolProfile | — | — |
| justifications/JustificationsRosterTable.tsx | 304 | — | — | — |
| parent/ParentRecordDetailsModal.tsx | 582 | — | — | — |
| parent/ParentRecordsTable.tsx | 707 | — | — | — |
| reports/AbsenceHeatmapCard.tsx | 171 | currentTenant, lang, sessions, students | — | — |
| reports/BatchPrintCenterModal.tsx | 233 | currentTenant, lang, schoolProfile | — | — |
| reports/StudentEngagementSection.tsx | 244 | sessions | — | — |
| settings/AcademicCalendarTab.tsx | 132 | lang | — | — |
| settings/AcademicTermsCard.tsx | 349 | lang | — | — |
| settings/ClassesManagementCard.tsx | 366 | lang | — | — |
| settings/EmergencyPolicyTab.tsx | 139 | lang | — | — |
| settings/GradeLevelsCard.tsx | 361 | lang | — | — |
| settings/GradesAndClassesTab.tsx | 109 | lang | — | — |
| settings/HolidaysAndWeekendsCard.tsx | 693 | — | — | — |
| settings/SchoolAIGeminiTab.tsx | 473 | — | /api/tenant/ai-config, /api/tenant/ai-config/test | — |
| settings/SchoolContactTab.tsx | 282 | lang | — | — |
| settings/SchoolIdentityTab.tsx | 147 | lang | — | — |
| settings/SchoolLeadershipTab.tsx | 200 | lang | — | — |
| settings/SchoolMessagingGatewaysTab.tsx | 740 | lang | — | — |
| settings/SmartHolidayImportModal.tsx | 520 | lang | /api/owner/holidays/search | — |
| settings/SubjectsManagementCard.tsx | 277 | lang | — | — |
| settings/TimetablePeriodsTab.tsx | 223 | lang | — | — |
| settings/UserEditModal.tsx | 325 | schoolProfile | — | — |
| settings/UserManagementTab.tsx | 349 | — | — | — |
| students/AddStudentModal.tsx | 303 | schoolProfile | — | — |
| students/DeleteStudentConfirmationModal.tsx | 81 | — | — | — |
| students/SchoolClassStatsCards.tsx | 384 | — | — | — |
| students/StudentAbsenceDrawer.tsx | 1185 | behaviourIncidents, justifications, lang, schoolProfile, sendChronicWarningNotification, sessions | — | — |
| students/TransferStudentModal.tsx | 144 | — | — | — |
| superadmin/PlatformOwnerModal.tsx | 770 | currentTenant, lang, provisionNewSchool, refreshDynamicTenants, refreshSubscription, setTenantId, students, tenants, users | /api/tenants/ | — |

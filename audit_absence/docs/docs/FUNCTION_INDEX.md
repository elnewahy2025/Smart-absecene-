# FUNCTION_INDEX

One row per function. `Kind`: function / arrow-or-function-expression / method / API route. `R` = REVIEWED, `A` = AUTO. Line numbers refer to commit `ae5779e`.


## Server (70)

| File | Line | Name | Kind | Async | Exp | R/A | Callers |
|---|---|---|---|---|---|---|---|
| api/handler.ts | 6 | `handler` | function | y | y | R | 0 |
| server.ts | 36 | `parseTrustProxy` | function |  |  | R | 0 |
| server.ts | 94 | `getRequestHostname` | function |  |  | R | 2 |
| server.ts | 128 | `getSystemChromePath` | function |  |  | R | 2 |
| server.ts | 155 | `launchPdfBrowser` | function | y |  | R | 1 |
| server.ts | 201 | `keyGenerator` | arrow/function-expression |  |  | R | 0 |
| server.ts | 208 | `escapeHtmlText` | arrow/function-expression |  |  | R | 1 |
| server.ts | 221 | `isAllowedPdfRequest` | arrow/function-expression |  |  | R | 1 |
| server.ts | 235 | `POST /api/pdf/generate [inline middleware #1]` | API route |  |  | R | 0 |
| server.ts | 236 | `POST /api/pdf/generate [inline middleware #2]` | API route |  |  | R | 0 |
| server.ts | 238 | `POST /api/pdf/generate [handler]` | API route | y |  | R | 0 |
| server.ts | 443 | `getDynamicTenantsPath` | arrow/function-expression |  |  | R | 1 |
| server.ts | 455 | `refreshTenantDocs` | function | y |  | R | 5 |
| server.ts | 474 | `refreshDynamicTenants` | function |  |  | R | 3 |
| server.ts | 490 | `getRequestHostTenant` | arrow/function-expression |  |  | R | 1 |
| server.ts | 503 | `generateTemporaryPassword` | arrow/function-expression |  |  | R | 1 |
| server.ts | 505 | `accountOperationError` | arrow/function-expression |  |  | R | 1 |
| server.ts | 517 | `upsertManagedAccount` | arrow/function-expression | y |  | R | 2 |
| server.ts | 622 | `isPlatformOwner` | arrow/function-expression |  |  | R | 7 |
| server.ts | 624 | `resolveServerIdentity` | arrow/function-expression |  |  | R | 1 |
| server.ts | 638 | `authenticateRequest` | arrow/function-expression | y |  | R | 1 |
| server.ts | 721 | `requireRole` | arrow/function-expression |  |  | R | 0 |
| server.ts | 736 | `requirePlatformOwner` | arrow/function-expression |  |  | R | 0 |
| server.ts | 751 | `requireTenant` | arrow/function-expression |  |  | R | 1 |
| server.ts | 785 | `resolveTargetTenantId` | arrow/function-expression |  |  | R | 8 |
| server.ts | 801 | `setTenantSubscriptionCache` | function |  |  | R | 2 |
| server.ts | 805 | `loadTenantSubscription` | function | y |  | R | 6 |
| server.ts | 820 | `writeSubscriptionAudit` | function | y |  | R | 1 |
| server.ts | 846 | `stripUndefinedDeep` | function |  |  | R | 1 |
| server.ts | 860 | `persistTenantSubscription` | function | y |  | R | 4 |
| server.ts | 896 | `requireActiveSubscription` | arrow/function-expression | y |  | R | 0 |
| server.ts | 984 | `sanitizeText` | arrow/function-expression |  |  | R | 5 |
| server.ts | 989 | `ensureJsonObject` | arrow/function-expression |  |  | R | 0 |
| server.ts | 1000 | `loadMessagingGatewayConfig` | function | y |  | R | 2 |
| server.ts | 1017 | `getGenAIClientForTenant` | function |  |  | R | 2 |
| server.ts | 1048 | `callGeminiWithFallback` | function | y |  | R | 3 |
| server.ts | 1077 | `POST /api/chat [handler]` | API route | y |  | R | 0 |
| server.ts | 1182 | `POST /api/analyze-image [handler]` | API route | y |  | R | 0 |
| server.ts | 1299 | `POST /api/daily-digest/generate-briefing [handler]` | API route | y |  | R | 0 |
| server.ts | 1405 | `POST /api/daily-digest/dispatch [handler]` | API route | y |  | R | 0 |
| server.ts | 1497 | `POST /api/notifications/dispatch [handler]` | API route | y |  | R | 0 |
| server.ts | 1667 | `GET /api/tenant/ai-config [handler]` | API route |  |  | R | 0 |
| server.ts | 1683 | `POST /api/tenant/ai-config [handler]` | API route | y |  | R | 0 |
| server.ts | 1707 | `DELETE /api/tenant/ai-config [handler]` | API route |  |  | R | 0 |
| server.ts | 1725 | `POST /api/tenant/ai-config/test [handler]` | API route | y |  | R | 0 |
| server.ts | 1785 | `GET /api/health [handler]` | API route |  |  | R | 0 |
| server.ts | 1816 | `GET /api/readyz [handler]` | API route |  |  | R | 0 |
| server.ts | 1824 | `GET /api/tenant/resolve [handler]` | API route | y |  | R | 0 |
| server.ts | 1833 | `GET /api/tenants [handler]` | API route | y |  | R | 0 |
| server.ts | 1875 | `POST /api/tenants/provision [handler]` | API route | y |  | R | 0 |
| server.ts | 2042 | `resolveSubscriptionTenantId` | function |  |  | R | 5 |
| server.ts | 2051 | `subscriptionActor` | arrow/function-expression |  |  | R | 4 |
| server.ts | 2056 | `subscriptionSummary` | function |  |  | R | 5 |
| server.ts | 2078 | `GET /api/tenants/:tenantId/subscription [handler]` | API route | y |  | R | 0 |
| server.ts | 2091 | `POST /api/tenants/:tenantId/subscription/suspend [handler]` | API route | y |  | R | 0 |
| server.ts | 2114 | `POST /api/tenants/:tenantId/subscription/reactivate [handler]` | API route | y |  | R | 0 |
| server.ts | 2132 | `POST /api/tenants/:tenantId/subscription/renew [handler]` | API route | y |  | R | 0 |
| server.ts | 2163 | `PATCH /api/tenants/:tenantId/subscription [handler]` | API route | y |  | R | 0 |
| server.ts | 2208 | `POST /api/users [handler]` | API route | y |  | R | 0 |
| server.ts | 2279 | `PATCH /api/users/:uid [handler]` | API route | y |  | R | 0 |
| server.ts | 2347 | `DELETE /api/users/:uid [handler]` | API route | y |  | R | 0 |
| server.ts | 2382 | `POST /api/owner/holidays/search [handler]` | API route | y |  | R | 0 |
| server.ts | 2479 | `serveStaticBundle` | function |  |  | R | 1 |
| server.ts | 2481 | `GET * [handler]` | API route |  |  | R | 0 |
| server.ts | 2488 | `hydrateTenantSecrets` | function | y |  | R | 1 |
| server.ts | 2495 | `loadAll` | arrow/function-expression | y |  | R | 0 |
| server.ts | 2503 | `put` | arrow/function-expression | y |  | R | 0 |
| server.ts | 2506 | `remove` | arrow/function-expression | y |  | R | 0 |
| server.ts | 2516 | `prepareRuntime` | function |  |  | R | 1 |
| server.ts | 2525 | `startServer` | function | y |  | R | 0 |

## Shared src (utils/config/lib/hooks/data) (115)

| File | Line | Name | Kind | Async | Exp | R/A | Callers |
|---|---|---|---|---|---|---|---|
| src/App.tsx | 50 | `ViewLoadingFallback` | arrow/function-expression |  |  | R | 0 |
| src/App.tsx | 57 | `MainAppContent` | arrow/function-expression |  |  | R | 0 |
| src/App.tsx | 91 | `handleSignOut` | arrow/function-expression |  |  | R | 0 |
| src/App.tsx | 101 | `handleLoginSuccess` | arrow/function-expression |  |  | R | 0 |
| src/App.tsx | 310 | `App` | function |  | y | R | 0 |
| src/config/countryCodes.ts | 283 | `cleanDialCode` | function |  | y | A | 0 |
| src/config/countryCodes.ts | 293 | `findCountryByName` | function |  | y | A | 4 |
| src/config/countryCodes.ts | 312 | `normalizeAr` | arrow/function-expression |  |  | A | 1 |
| src/config/countryCodes.ts | 338 | `getCallingCodeForCountry` | function |  | y | A | 1 |
| src/config/countryPresets.ts | 685 | `getCountryPreset` | function |  | y | A | 6 |
| src/config/defaultSettings.ts | 9 | `getDefaultSchoolSettings` | function |  | y | A | 3 |
| src/config/subscription.ts | 80 | `defaultSubscription` | function |  | y | R | 3 |
| src/config/subscription.ts | 94 | `toDate` | function |  |  | R | 3 |
| src/config/subscription.ts | 101 | `normalizeSubscription` | function |  | y | R | 7 |
| src/config/subscription.ts | 168 | `computeAccessUntilMs` | function |  | y | R | 4 |
| src/config/subscription.ts | 174 | `daysBetween` | function |  |  | R | 1 |
| src/config/subscription.ts | 183 | `evaluateSubscription` | function |  | y | R | 4 |
| src/config/subscription.ts | 238 | `addMonths` | function |  |  | R | 1 |
| src/config/subscription.ts | 258 | `applyRenewal` | function |  | y | R | 1 |
| src/config/subscription.ts | 293 | `applySuspend` | function |  | y | R | 1 |
| src/config/subscription.ts | 313 | `applyReactivate` | function |  | y | R | 1 |
| src/config/tenantRegistry.ts | 89 | `setRuntimeDynamicTenants` | function |  | y | R | 1 |
| src/config/tenantRegistry.ts | 98 | `setRuntimeTenantDocs` | function |  | y | R | 1 |
| src/config/tenantRegistry.ts | 101 | `getActiveTenantRegistry` | function |  | y | R | 7 |
| src/config/tenantRegistry.ts | 160 | `findTenantByAlias` | function |  | y | R | 1 |
| src/config/tenantRegistry.ts | 210 | `extractQueryTenant` | function |  | y | R | 2 |
| src/config/tenantRegistry.ts | 232 | `normalizeHostname` | function |  | y | R | 2 |
| src/config/tenantRegistry.ts | 260 | `isLocalDevelopmentHost` | function |  | y | R | 4 |
| src/config/tenantRegistry.ts | 277 | `getDevTestTenants` | function |  | y | R | 2 |
| src/config/tenantRegistry.ts | 286 | `switchDevTestTenant` | function |  | y | R | 2 |
| src/config/tenantRegistry.ts | 325 | `resolveTenantFromHostname` | function |  | y | R | 5 |
| src/config/tenantRegistry.ts | 474 | `toTenantInterface` | function |  | y | R | 0 |
| src/config/tenantSettings.ts | 212 | `withNeutralContacts` | function |  |  | A | 1 |
| src/config/tenantSettings.ts | 242 | `getDefaultSchoolProfile` | function |  | y | A | 5 |
| src/hooks/useModalAccessibility.ts | 17 | `useModalAccessibility` | function |  | y | A | 19 |
| src/hooks/useModalAccessibility.ts | 33 | `handleKeyDown` | arrow/function-expression |  |  | A | 0 |
| src/lib/api.ts | 11 | `setApiTenantOverride` | function |  | y | R | 1 |
| src/lib/api.ts | 15 | `withTenantQuery` | function |  |  | R | 1 |
| src/lib/api.ts | 46 | `authenticatedFetch` | function | y | y | R | 19 |
| src/lib/firebase.ts | 72 | `handleFirestoreError` | function |  | y | R | 6 |
| src/lib/firebase.ts | 98 | `subscribeConnectionStatus` | function |  | y | R | 1 |
| src/lib/firebase.ts | 107 | `getConnectionStatus` | function |  | y | R | 0 |
| src/lib/firebase.ts | 111 | `testConnection` | function | y | y | R | 1 |
| src/utils/accountAccess.ts | 20 | `isPlatformOwnerClaim` | arrow/function-expression |  | y | R | 3 |
| src/utils/accountAccess.ts | 29 | `accountPatchDenial` | function |  | y | R | 1 |
| src/utils/accountAccess.ts | 48 | `accountRoleChangeDenial` | function |  | y | R | 1 |
| src/utils/accountAccess.ts | 69 | `accountUpsertDenial` | function |  | y | R | 1 |
| src/utils/attendanceAccess.ts | 16 | `canManageSettings` | function |  | y | A | 1 |
| src/utils/attendanceAccess.ts | 21 | `isElevatedOrSuperAdmin` | function |  | y | A | 1 |
| src/utils/attendanceAccess.ts | 26 | `canWriteSubmittedSessions` | function |  | y | A | 1 |
| src/utils/attendanceAccess.ts | 38 | `canEditSession` | function |  | y | A | 1 |
| src/utils/attendanceAccess.ts | 56 | `isChildOfGuardian` | function |  | y | A | 1 |
| src/utils/auditLogI18n.ts | 77 | `en` | arrow/function-expression |  |  | A | 0 |
| src/utils/auditLogI18n.ts | 92 | `translateAuditAction` | arrow/function-expression |  | y | A | 1 |
| src/utils/auditLogI18n.ts | 99 | `translateAuditEntity` | arrow/function-expression |  | y | A | 0 |
| src/utils/auditLogI18n.ts | 106 | `translateAuditRole` | arrow/function-expression |  | y | A | 1 |
| src/utils/auditLogI18n.ts | 116 | `translateAuditValue` | arrow/function-expression |  | y | A | 1 |
| src/utils/auditLogI18n.ts | 137 | `getAuditDetails` | arrow/function-expression |  | y | A | 1 |
| src/utils/auditLogI18n.ts | 146 | `getAuditSearchHaystack` | arrow/function-expression |  | y | A | 1 |
| src/utils/digestEngine.ts | 12 | `computeDailyDigestData` | function |  | y | A | 1 |
| src/utils/digestEngine.ts | 210 | `generateHtmlEmailTemplate` | function |  | y | A | 1 |
| src/utils/holidayUtils.ts | 93 | `isSchoolOffDay` | arrow/function-expression |  | y | A | 6 |
| src/utils/holidayUtils.ts | 161 | `getSchoolWeekDays` | arrow/function-expression |  | y | A | 1 |
| src/utils/holidayUtils.ts | 220 | `countActiveSchoolDays` | arrow/function-expression |  | y | A | 0 |
| src/utils/holidayUtils.ts | 245 | `getHolidayDisplayName` | arrow/function-expression |  | y | A | 2 |
| src/utils/holidayUtils.ts | 250 | `getHolidaySecondaryName` | arrow/function-expression |  | y | A | 2 |
| src/utils/holidayUtils.ts | 255 | `getHolidayTypeLabel` | arrow/function-expression |  | y | A | 2 |
| src/utils/localCache.ts | 40 | `getStorage` | function |  |  | A | 4 |
| src/utils/localCache.ts | 49 | `getItem` | method |  |  | R | 1 |
| src/utils/localCache.ts | 60 | `setItem` | method |  |  | R | 19 |
| src/utils/localCache.ts | 75 | `removeItem` | method |  |  | A | 0 |
| src/utils/localCache.ts | 93 | `purgeLegacySensitive` | method |  |  | R | 0 |
| src/utils/messagingProviders.ts | 58 | `normalizePhone` | function |  | y | R | 3 |
| src/utils/messagingProviders.ts | 65 | `result` | function |  |  | R | 10 |
| src/utils/messagingProviders.ts | 69 | `requestWithTimeout` | function | y |  | R | 7 |
| src/utils/messagingProviders.ts | 83 | `errorText` | function |  |  | R | 3 |
| src/utils/messagingProviders.ts | 88 | `sendSms` | function | y | y | R | 1 |
| src/utils/messagingProviders.ts | 120 | `sendViaTwilio` | function | y |  | R | 1 |
| src/utils/messagingProviders.ts | 161 | `sendViaUnifonic` | function | y |  | R | 1 |
| src/utils/messagingProviders.ts | 202 | `sendViaMsegat` | function | y |  | R | 1 |
| src/utils/messagingProviders.ts | 242 | `sendViaTaqnyat` | function | y |  | R | 1 |
| src/utils/messagingProviders.ts | 281 | `sendWhatsAppCloudMessage` | function | y | y | R | 1 |
| src/utils/messagingProviders.ts | 333 | `sendEmail` | function | y | y | R | 1 |
| src/utils/messagingProviders.ts | 363 | `sendViaSmtp` | function | y |  | R | 1 |
| src/utils/messagingProviders.ts | 398 | `sendViaResend` | function | y |  | R | 1 |
| src/utils/messagingProviders.ts | 430 | `sendViaSendGrid` | function | y |  | R | 1 |
| src/utils/modalA11y.ts | 18 | `isEscapeKey` | function |  | y | A | 1 |
| src/utils/modalA11y.ts | 22 | `isTabKey` | function |  | y | A | 1 |
| src/utils/modalA11y.ts | 44 | `resolveDialogKeyAction` | function |  | y | A | 1 |
| src/utils/modalA11y.ts | 58 | `nextFocusIndex` | function |  | y | A | 1 |
| src/utils/modalA11y.ts | 65 | `getFocusableElements` | function |  | y | A | 2 |
| src/utils/pdfExport.ts | 8 | `fetchNativePdfBlob` | function | y | y | R | 2 |
| src/utils/pdfExport.ts | 66 | `downloadNativePdfFromHtml` | function | y | y | A | 8 |
| src/utils/pdfExport.ts | 104 | `printNativePdfFromHtml` | function | y | y | A | 8 |
| src/utils/pdfExport.ts | 130 | `triggerPrint` | arrow/function-expression |  |  | A | 0 |
| src/utils/printTemplates/studentAbsenceReportTemplate.ts | 42 | `generateStudentAbsenceReportHtml` | function |  | y | A | 4 |
| src/utils/routeAuth.ts | 18 | `isPublicRoute` | function |  | y | R | 2 |
| src/utils/sampleImages.ts | 2 | `generateSampleMedicalNoteBase64` | function |  | y | A | 2 |
| src/utils/sampleImages.ts | 128 | `generateSampleIrregularMedicalNoteBase64` | function |  | y | A | 2 |
| src/utils/tenantAISecrets.ts | 7 | `getMasterKey` | arrow/function-expression |  |  | R | 2 |
| src/utils/tenantAISecrets.ts | 40 | `loadSecretsFromDisk` | function |  |  | R | 0 |
| src/utils/tenantAISecrets.ts | 54 | `persistSecretsToDisk` | function |  |  | R | 2 |
| src/utils/tenantAISecrets.ts | 80 | `attachTenantSecretsStore` | function | y | y | R | 1 |
| src/utils/tenantAISecrets.ts | 97 | `encryptKey` | function |  |  | R | 1 |
| src/utils/tenantAISecrets.ts | 115 | `decryptKey` | function |  |  | R | 1 |
| src/utils/tenantAISecrets.ts | 131 | `maskApiKey` | function |  | y | R | 2 |
| src/utils/tenantAISecrets.ts | 141 | `setTenantApiKey` | function |  | y | R | 1 |
| src/utils/tenantAISecrets.ts | 175 | `getTenantApiKey` | function |  | y | R | 2 |
| src/utils/tenantAISecrets.ts | 186 | `removeTenantApiKey` | function |  | y | R | 2 |
| src/utils/tenantAISecrets.ts | 204 | `getTenantAIConfig` | function |  | y | R | 2 |
| src/utils/whatsappUtils.ts | 6 | `cleanCallingCode` | function |  | y | A | 1 |
| src/utils/whatsappUtils.ts | 15 | `formatWhatsAppInternationalPhone` | function |  | y | A | 2 |
| src/utils/whatsappUtils.ts | 49 | `buildWhatsAppWebUrl` | function |  | y | A | 1 |
| src/utils/whatsappUtils.ts | 62 | `openWhatsAppDirect` | function |  | y | A | 3 |
| vite.config.ts | 18 | `manualChunks` | method |  |  | A | 0 |

## State/context (54)

| File | Line | Name | Kind | Async | Exp | R/A | Callers |
|---|---|---|---|---|---|---|---|
| src/context/AttendanceContext.tsx | 112 | `toFirestoreData` | arrow/function-expression |  |  | A | 4 |
| src/context/AttendanceContext.tsx | 114 | `buildParentSessions` | arrow/function-expression |  |  | A | 1 |
| src/context/AttendanceContext.tsx | 326 | `AttendanceProvider` | arrow/function-expression |  | y | A | 0 |
| src/context/AttendanceContext.tsx | 366 | `setTenantId` | arrow/function-expression |  |  | A | 1 |
| src/context/AttendanceContext.tsx | 373 | `setUserRole` | arrow/function-expression |  |  | A | 2 |
| src/context/AttendanceContext.tsx | 394 | `refreshSubscription` | arrow/function-expression | y |  | A | 2 |
| src/context/AttendanceContext.tsx | 413 | `refreshWhenVisible` | arrow/function-expression |  |  | A | 0 |
| src/context/AttendanceContext.tsx | 431 | `syncTenantsWithServer` | arrow/function-expression | y |  | A | 1 |
| src/context/AttendanceContext.tsx | 681 | `applyAccountTenant` | arrow/function-expression |  |  | A | 1 |
| src/context/AttendanceContext.tsx | 979 | `signInWithGoogle` | arrow/function-expression | y |  | A | 0 |
| src/context/AttendanceContext.tsx | 997 | `signOutGoogle` | arrow/function-expression | y |  | A | 0 |
| src/context/AttendanceContext.tsx | 1006 | `signInWithCredentials` | arrow/function-expression | y |  | R | 0 |
| src/context/AttendanceContext.tsx | 1152 | `isOffDay` | arrow/function-expression |  |  | A | 1 |
| src/context/AttendanceContext.tsx | 1378 | `canEditSession` | arrow/function-expression |  |  | A | 4 |
| src/context/AttendanceContext.tsx | 1388 | `isChildOfGuardian` | arrow/function-expression |  |  | A | 1 |
| src/context/AttendanceContext.tsx | 1495 | `createUser` | arrow/function-expression | y |  | R | 0 |
| src/context/AttendanceContext.tsx | 1592 | `updateUser` | arrow/function-expression | y |  | A | 0 |
| src/context/AttendanceContext.tsx | 1645 | `deleteUser` | arrow/function-expression | y |  | A | 0 |
| src/context/AttendanceContext.tsx | 1695 | `addBehaviourIncident` | arrow/function-expression |  |  | A | 0 |
| src/context/AttendanceContext.tsx | 1725 | `addAuditLog` | arrow/function-expression |  |  | A | 26 |
| src/context/AttendanceContext.tsx | 1745 | `updateRecord` | arrow/function-expression |  |  | A | 0 |
| src/context/AttendanceContext.tsx | 1797 | `setAllPresentInDraft` | arrow/function-expression |  |  | A | 0 |
| src/context/AttendanceContext.tsx | 1825 | `quickMarkGroupAsPresent` | arrow/function-expression |  |  | A | 0 |
| src/context/AttendanceContext.tsx | 1898 | `submitSession` | arrow/function-expression |  |  | A | 0 |
| src/context/AttendanceContext.tsx | 1989 | `reopenSession` | arrow/function-expression |  |  | A | 0 |
| src/context/AttendanceContext.tsx | 2032 | `createNewSession` | arrow/function-expression |  |  | A | 0 |
| src/context/AttendanceContext.tsx | 2091 | `createJustification` | arrow/function-expression | y |  | A | 0 |
| src/context/AttendanceContext.tsx | 2198 | `reviewJustification` | arrow/function-expression |  |  | A | 0 |
| src/context/AttendanceContext.tsx | 2318 | `updateJustificationAnalysis` | arrow/function-expression |  |  | A | 0 |
| src/context/AttendanceContext.tsx | 2324 | `retryNotification` | arrow/function-expression | y |  | A | 0 |
| src/context/AttendanceContext.tsx | 2451 | `retryAllFailedNotifications` | arrow/function-expression | y |  | A | 0 |
| src/context/AttendanceContext.tsx | 2535 | `sendCustomParentNotification` | arrow/function-expression |  |  | A | 0 |
| src/context/AttendanceContext.tsx | 2703 | `sendChronicWarningNotification` | arrow/function-expression |  |  | A | 1 |
| src/context/AttendanceContext.tsx | 2772 | `sendAllChronicWarningNotifications` | arrow/function-expression |  |  | A | 0 |
| src/context/AttendanceContext.tsx | 2784 | `persistStudent` | arrow/function-expression |  |  | A | 1 |
| src/context/AttendanceContext.tsx | 2791 | `persistStudentPatch` | arrow/function-expression |  |  | A | 3 |
| src/context/AttendanceContext.tsx | 2797 | `importStudents` | arrow/function-expression |  |  | A | 0 |
| src/context/AttendanceContext.tsx | 2879 | `addStudent` | arrow/function-expression |  |  | A | 0 |
| src/context/AttendanceContext.tsx | 2917 | `updateStudent` | arrow/function-expression |  |  | A | 0 |
| src/context/AttendanceContext.tsx | 2941 | `transferStudent` | arrow/function-expression |  |  | A | 0 |
| src/context/AttendanceContext.tsx | 2985 | `restoreStudent` | arrow/function-expression |  |  | A | 0 |
| src/context/AttendanceContext.tsx | 3025 | `deleteStudent` | arrow/function-expression |  |  | A | 0 |
| src/context/AttendanceContext.tsx | 3059 | `updateSettings` | arrow/function-expression |  |  | A | 0 |
| src/context/AttendanceContext.tsx | 3090 | `updateSchoolProfile` | arrow/function-expression | y |  | A | 0 |
| src/context/AttendanceContext.tsx | 3160 | `updateMessagingGateway` | arrow/function-expression |  |  | A | 0 |
| src/context/AttendanceContext.tsx | 3250 | `updateDigestConfig` | arrow/function-expression |  |  | A | 0 |
| src/context/AttendanceContext.tsx | 3267 | `generateCurrentDigest` | arrow/function-expression | y |  | A | 1 |
| src/context/AttendanceContext.tsx | 3325 | `dispatchDailyDigest` | arrow/function-expression | y |  | A | 0 |
| src/context/AttendanceContext.tsx | 3433 | `provisionNewSchool` | arrow/function-expression | y |  | A | 0 |
| src/context/AttendanceContext.tsx | 3733 | `useAttendance` | arrow/function-expression |  | y | A | 49 |
| src/context/ThemeContext.tsx | 92 | `ThemeProvider` | arrow/function-expression |  | y | A | 0 |
| src/context/ThemeContext.tsx | 106 | `setTheme` | arrow/function-expression |  |  | A | 1 |
| src/context/ThemeContext.tsx | 113 | `toggleDarkMode` | arrow/function-expression |  |  | A | 0 |
| src/context/ThemeContext.tsx | 151 | `useTheme` | arrow/function-expression |  | y | A | 1 |

## UI components (282)

| File | Line | Name | Kind | Async | Exp | R/A | Callers |
|---|---|---|---|---|---|---|---|
| src/components/AppSidebar.tsx | 52 | `AppSidebar` | arrow/function-expression |  | y | A | 0 |
| src/components/AppSidebar.tsx | 79 | `toggleSection` | arrow/function-expression |  |  | A | 1 |
| src/components/AppSidebar.tsx | 197 | `handleSelect` | arrow/function-expression |  |  | A | 1 |
| src/components/AppSidebar.tsx | 294 | `isItemActive` | arrow/function-expression |  |  | A | 1 |
| src/components/AttendanceSessionsView.tsx | 38 | `AttendanceSessionsView` | arrow/function-expression |  | y | A | 0 |
| src/components/AttendanceSessionsView.tsx | 147 | `handleStatusChange` | arrow/function-expression |  |  | A | 1 |
| src/components/AttendanceSessionsView.tsx | 161 | `handleMinutesLateChange` | arrow/function-expression |  |  | A | 1 |
| src/components/AttendanceSessionsView.tsx | 166 | `handleQuickMarkWholeClass` | arrow/function-expression |  |  | A | 0 |
| src/components/AttendanceSessionsView.tsx | 198 | `handleQuickMarkSelectedGroup` | arrow/function-expression |  |  | A | 1 |
| src/components/AttendanceSessionsView.tsx | 222 | `handleGroupMarkAsAbsent` | arrow/function-expression |  |  | A | 0 |
| src/components/AttendanceSessionsView.tsx | 229 | `handleRequestQuickMarkPresent` | arrow/function-expression |  |  | A | 0 |
| src/components/AttendanceSessionsView.tsx | 240 | `handleConfirmBulkAction` | arrow/function-expression |  |  | A | 0 |
| src/components/AttendanceSessionsView.tsx | 271 | `handleToggleSelectAll` | arrow/function-expression |  |  | A | 0 |
| src/components/AttendanceSessionsView.tsx | 282 | `handleSubmitSession` | arrow/function-expression |  |  | A | 0 |
| src/components/AttendanceSessionsView.tsx | 299 | `handleConfirmReopen` | arrow/function-expression |  |  | A | 0 |
| src/components/AttendanceSessionsView.tsx | 312 | `handleCreateSession` | arrow/function-expression |  |  | A | 0 |
| src/components/AuditSettingsView.tsx | 39 | `AuditSettingsView` | arrow/function-expression |  | y | A | 0 |
| src/components/AuditSettingsView.tsx | 88 | `handleSaveSettings` | arrow/function-expression |  |  | A | 0 |
| src/components/AuditSettingsView.tsx | 109 | `handleSaveProfile` | arrow/function-expression | y |  | A | 0 |
| src/components/BatchQRModal.tsx | 15 | `BatchQRModal` | arrow/function-expression |  | y | A | 0 |
| src/components/BatchQRModal.tsx | 31 | `generateAll` | function | y |  | A | 1 |
| src/components/BatchQRModal.tsx | 75 | `handleDownloadVectorPdf` | arrow/function-expression | y |  | A | 0 |
| src/components/BatchQRModal.tsx | 88 | `handlePrint` | arrow/function-expression |  |  | A | 0 |
| src/components/DailyEmailDigestView.tsx | 25 | `DailyEmailDigestView` | arrow/function-expression |  | y | A | 0 |
| src/components/DailyEmailDigestView.tsx | 55 | `loadDigest` | arrow/function-expression | y |  | A | 1 |
| src/components/DailyEmailDigestView.tsx | 71 | `handleSendDigestNow` | arrow/function-expression | y |  | A | 0 |
| src/components/DailyEmailDigestView.tsx | 92 | `handleCopyHtml` | arrow/function-expression |  |  | A | 0 |
| src/components/DailyEmailDigestView.tsx | 99 | `handleAddRecipient` | arrow/function-expression |  |  | A | 0 |
| src/components/DailyEmailDigestView.tsx | 112 | `handleRemoveRecipient` | arrow/function-expression |  |  | A | 0 |
| src/components/DailyEmailDigestView.tsx | 119 | `handleSaveSettings` | arrow/function-expression |  |  | A | 0 |
| src/components/EmergencyRosterView.tsx | 19 | `EmergencyRosterView` | arrow/function-expression |  | y | A | 0 |
| src/components/EmergencyRosterView.tsx | 76 | `toggleVerify` | arrow/function-expression |  |  | A | 1 |
| src/components/EmergencyRosterView.tsx | 85 | `handleExportVectorPdf` | arrow/function-expression | y |  | A | 0 |
| src/components/EmergencyRosterView.tsx | 105 | `handlePrint` | arrow/function-expression |  |  | A | 0 |
| src/components/ErrorBoundary.tsx | 17 | `constructor` | constructor |  |  | A | 0 |
| src/components/ErrorBoundary.tsx | 26 | `getDerivedStateFromError` | method |  |  | A | 0 |
| src/components/ErrorBoundary.tsx | 34 | `componentDidCatch` | method |  |  | A | 0 |
| src/components/ErrorBoundary.tsx | 39 | `handleReload` | arrow/function-expression |  |  | A | 0 |
| src/components/ErrorBoundary.tsx | 45 | `handleResetAuth` | arrow/function-expression |  |  | A | 0 |
| src/components/ErrorBoundary.tsx | 54 | `render` | method |  |  | A | 0 |
| src/components/ExecutiveDashboardView.tsx | 48 | `ExecutiveDashboardView` | arrow/function-expression |  | y | A | 0 |
| src/components/GeminiChatbotView.tsx | 26 | `formatChatTime` | arrow/function-expression |  |  | A | 3 |
| src/components/GeminiChatbotView.tsx | 29 | `buildWelcomeMessage` | arrow/function-expression |  |  | A | 1 |
| src/components/GeminiChatbotView.tsx | 44 | `buildResetMessage` | arrow/function-expression |  |  | A | 2 |
| src/components/GeminiChatbotView.tsx | 49 | `GeminiChatbotView` | arrow/function-expression |  | y | A | 0 |
| src/components/GeminiChatbotView.tsx | 72 | `scrollToBottom` | arrow/function-expression |  |  | A | 1 |
| src/components/GeminiChatbotView.tsx | 98 | `getModelPreference` | arrow/function-expression |  |  | A | 1 |
| src/components/GeminiChatbotView.tsx | 161 | `handleSendMessage` | arrow/function-expression | y |  | A | 1 |
| src/components/GeminiChatbotView.tsx | 222 | `handleCopyMessage` | arrow/function-expression |  |  | A | 1 |
| src/components/GeminiChatbotView.tsx | 228 | `handleClearChat` | arrow/function-expression |  |  | A | 0 |
| src/components/GradeAbsencePatternsSection.tsx | 66 | `GradeAbsencePatternsSection` | arrow/function-expression |  | y | A | 0 |
| src/components/GradeAbsencePatternsSection.tsx | 197 | `CustomChartTooltip` | arrow/function-expression |  |  | A | 0 |
| src/components/HeaderNav.tsx | 56 | `HeaderNav` | arrow/function-expression |  | y | A | 0 |
| src/components/HeaderNav.tsx | 80 | `getPageTitle` | arrow/function-expression |  |  | A | 1 |
| src/components/JustificationsView.tsx | 19 | `JustificationsView` | arrow/function-expression |  | y | A | 0 |
| src/components/JustificationsView.tsx | 65 | `handleFileUpload` | arrow/function-expression |  |  | A | 0 |
| src/components/JustificationsView.tsx | 103 | `handleLoadSampleMedicalNote` | arrow/function-expression |  |  | A | 0 |
| src/components/JustificationsView.tsx | 119 | `handleLoadSampleIrregularNote` | arrow/function-expression |  |  | A | 0 |
| src/components/JustificationsView.tsx | 134 | `handleAnalyzeImageWithAI` | arrow/function-expression | y |  | A | 0 |
| src/components/JustificationsView.tsx | 181 | `handleReanalyzeJustificationWithAI` | arrow/function-expression | y |  | A | 0 |
| src/components/JustificationsView.tsx | 239 | `handleFormSubmit` | arrow/function-expression | y |  | A | 0 |
| src/components/JustificationsView.tsx | 300 | `handleApprove` | arrow/function-expression |  |  | A | 0 |
| src/components/JustificationsView.tsx | 306 | `handleReject` | arrow/function-expression |  |  | A | 0 |
| src/components/LoginPage.tsx | 22 | `LoginPage` | arrow/function-expression |  | y | R | 0 |
| src/components/LoginPage.tsx | 50 | `handleAuthenticate` | arrow/function-expression | y |  | R | 1 |
| src/components/NotificationOutboxView.tsx | 32 | `NotificationOutboxView` | arrow/function-expression |  | y | A | 0 |
| src/components/NotificationOutboxView.tsx | 164 | `handleOpenBatchModal` | arrow/function-expression |  |  | A | 0 |
| src/components/NotificationOutboxView.tsx | 177 | `toggleStudentSelection` | arrow/function-expression |  |  | A | 1 |
| src/components/NotificationOutboxView.tsx | 184 | `handleToggleSelectAllBatch` | arrow/function-expression |  |  | A | 0 |
| src/components/NotificationOutboxView.tsx | 196 | `handleExecuteBatchSend` | arrow/function-expression | y |  | A | 0 |
| src/components/NotificationOutboxView.tsx | 225 | `handleSendSingleCustom` | arrow/function-expression |  |  | A | 0 |
| src/components/NotificationOutboxView.tsx | 277 | `handleRetrySingle` | arrow/function-expression | y |  | A | 1 |
| src/components/NotificationOutboxView.tsx | 284 | `handleBulkRetrySelected` | arrow/function-expression | y |  | A | 0 |
| src/components/NotificationOutboxView.tsx | 300 | `toggleSelectOutboxItem` | arrow/function-expression |  |  | A | 1 |
| src/components/NotificationOutboxView.tsx | 306 | `toggleSelectAllVisibleOutbox` | arrow/function-expression |  |  | A | 0 |
| src/components/OfficialReportModal.tsx | 26 | `OfficialReportModal` | arrow/function-expression |  | y | A | 0 |
| src/components/OfficialReportModal.tsx | 64 | `handleDownloadVectorPdf` | arrow/function-expression | y |  | A | 0 |
| src/components/OfficialReportModal.tsx | 85 | `handleBrowserPrint` | arrow/function-expression |  |  | A | 0 |
| src/components/OfflineSyncModal.tsx | 43 | `OfflineSyncModal` | arrow/function-expression |  | y | A | 0 |
| src/components/OfflineSyncModal.tsx | 58 | `checkApiHealth` | arrow/function-expression | y |  | A | 2 |
| src/components/OfflineSyncModal.tsx | 95 | `formatUptime` | arrow/function-expression |  |  | A | 1 |
| src/components/OfflineSyncModal.tsx | 104 | `getCacheStats` | arrow/function-expression |  |  | A | 1 |
| src/components/OfflineSyncModal.tsx | 136 | `handleManualRetry` | arrow/function-expression | y |  | A | 0 |
| src/components/ParentPortalView.tsx | 18 | `ParentPortalView` | arrow/function-expression |  | y | A | 0 |
| src/components/PlatformRootView.tsx | 9 | `PlatformRootView` | arrow/function-expression |  | y | A | 0 |
| src/components/QRScannerModal.tsx | 32 | `playAttendanceChime` | function |  |  | A | 1 |
| src/components/QRScannerModal.tsx | 59 | `playDuplicateWarningTone` | function |  |  | A | 1 |
| src/components/QRScannerModal.tsx | 84 | `QRScannerModal` | arrow/function-expression |  | y | A | 0 |
| src/components/QRScannerModal.tsx | 142 | `startCamera` | function | y |  | A | 1 |
| src/components/QRScannerModal.tsx | 200 | `handleRawScannedString` | arrow/function-expression |  |  | A | 2 |
| src/components/QRScannerModal.tsx | 297 | `handlePhotoCapture` | arrow/function-expression |  |  | A | 0 |
| src/components/QRScannerModal.tsx | 354 | `handleProcessScan` | arrow/function-expression |  |  | A | 3 |
| src/components/QRScannerModal.tsx | 424 | `handleManualScanSubmit` | arrow/function-expression |  |  | A | 0 |
| src/components/QRScannerModal.tsx | 447 | `handleConfirmStartQRMode` | arrow/function-expression |  |  | A | 0 |
| src/components/QRScannerModal.tsx | 489 | `handleOpenFinalizeModal` | arrow/function-expression |  |  | A | 0 |
| src/components/QRScannerModal.tsx | 502 | `handleToggleUnscannedStatus` | arrow/function-expression |  |  | A | 1 |
| src/components/QRScannerModal.tsx | 512 | `handleChangeUnscannedMinutes` | arrow/function-expression |  |  | A | 1 |
| src/components/QRScannerModal.tsx | 523 | `handleFinalizeQRSession` | arrow/function-expression |  |  | A | 0 |
| src/components/QRScannerModal.tsx | 586 | `handleSetAllPresent` | arrow/function-expression |  |  | A | 0 |
| src/components/ReportsView.tsx | 26 | `ReportsView` | arrow/function-expression |  | y | A | 0 |
| src/components/ReportsView.tsx | 85 | `handleDownloadExcelWorkbook` | arrow/function-expression |  |  | A | 0 |
| src/components/ReportsView.tsx | 195 | `handleExportCSV` | arrow/function-expression |  |  | A | 0 |
| src/components/StudentAbsenceInquiryView.tsx | 33 | `StudentAbsenceInquiryView` | arrow/function-expression |  | y | A | 0 |
| src/components/StudentAbsenceInquiryView.tsx | 305 | `getArabicDayName` | arrow/function-expression |  |  | A | 1 |
| src/components/StudentAbsenceInquiryView.tsx | 317 | `getSchoolDaysInRange` | arrow/function-expression |  |  | A | 1 |
| src/components/StudentAbsenceInquiryView.tsx | 719 | `handleSendWarning` | arrow/function-expression |  |  | A | 0 |
| src/components/StudentAbsenceInquiryView.tsx | 732 | `handleDownloadPdf` | arrow/function-expression | y |  | A | 0 |
| src/components/StudentAbsenceInquiryView.tsx | 773 | `handlePrint` | arrow/function-expression |  |  | A | 0 |
| src/components/StudentManagementView.tsx | 58 | `StudentManagementView` | arrow/function-expression |  | y | A | 0 |
| src/components/StudentManagementView.tsx | 166 | `handleDownloadTemplate` | arrow/function-expression |  |  | A | 0 |
| src/components/StudentManagementView.tsx | 190 | `handleDownloadErrorReport` | arrow/function-expression |  |  | A | 0 |
| src/components/StudentManagementView.tsx | 215 | `processUploadedFile` | arrow/function-expression |  |  | A | 2 |
| src/components/StudentManagementView.tsx | 230 | `handleFileInputChange` | arrow/function-expression |  |  | A | 0 |
| src/components/StudentManagementView.tsx | 237 | `handleDragOver` | arrow/function-expression |  |  | A | 0 |
| src/components/StudentManagementView.tsx | 242 | `handleDragLeave` | arrow/function-expression |  |  | A | 0 |
| src/components/StudentManagementView.tsx | 247 | `handleDrop` | arrow/function-expression |  |  | A | 0 |
| src/components/StudentManagementView.tsx | 257 | `parseCsvLine` | arrow/function-expression |  |  | A | 1 |
| src/components/StudentManagementView.tsx | 281 | `handleValidateInput` | arrow/function-expression |  |  | A | 0 |
| src/components/StudentManagementView.tsx | 410 | `handleCommitImport` | arrow/function-expression |  |  | A | 0 |
| src/components/StudentManagementView.tsx | 433 | `handleCloseModal` | arrow/function-expression |  |  | A | 0 |
| src/components/StudentQRCodeModal.tsx | 25 | `StudentQRCodeModal` | arrow/function-expression |  | y | A | 0 |
| src/components/StudentQRCodeModal.tsx | 56 | `generateQR` | function | y |  | A | 1 |
| src/components/StudentQRCodeModal.tsx | 106 | `handleDownloadCard` | arrow/function-expression |  |  | A | 0 |
| src/components/StudentQRCodeModal.tsx | 182 | `handleDownloadVectorPdf` | arrow/function-expression | y |  | A | 0 |
| src/components/StudentQRCodeModal.tsx | 195 | `handlePrint` | arrow/function-expression |  |  | A | 0 |
| src/components/SubscriptionGate.tsx | 14 | `SubscriptionBanner` | arrow/function-expression |  | y | A | 0 |
| src/components/SubscriptionGate.tsx | 66 | `SubscriptionSuspendedView` | arrow/function-expression |  | y | A | 0 |
| src/components/ThemeSwitcherDropdown.tsx | 15 | `ThemeSwitcherDropdown` | arrow/function-expression |  | y | A | 0 |
| src/components/ThemeSwitcherDropdown.tsx | 22 | `handleClickOutside` | arrow/function-expression |  |  | A | 0 |
| src/components/UnknownDomainView.tsx | 9 | `UnknownDomainView` | arrow/function-expression |  | y | A | 0 |
| src/components/WeeklyAttendanceTrendCard.tsx | 49 | `WeeklyAttendanceTrendCard` | arrow/function-expression |  | y | A | 0 |
| src/components/WeeklyAttendanceTrendCard.tsx | 172 | `CustomTooltip` | arrow/function-expression |  |  | A | 0 |
| src/components/attendance/BulkEditConfirmationModal.tsx | 17 | `BulkEditConfirmationModal` | arrow/function-expression |  | y | A | 0 |
| src/components/attendance/ClassCalendarView.tsx | 13 | `ClassCalendarView` | arrow/function-expression |  | y | A | 0 |
| src/components/attendance/ClassCalendarView.tsx | 40 | `handlePrevMonth` | arrow/function-expression |  |  | A | 0 |
| src/components/attendance/ClassCalendarView.tsx | 44 | `handleNextMonth` | arrow/function-expression |  |  | A | 0 |
| src/components/attendance/EmergencyRosterModal.tsx | 29 | `EmergencyRosterModal` | arrow/function-expression |  | y | A | 0 |
| src/components/attendance/EmergencyRosterModal.tsx | 95 | `toggleVerify` | arrow/function-expression |  |  | A | 1 |
| src/components/attendance/EmergencyRosterModal.tsx | 104 | `handleExportVectorPdf` | arrow/function-expression | y |  | A | 0 |
| src/components/attendance/EmergencyRosterModal.tsx | 124 | `handlePrintDirect` | arrow/function-expression |  |  | A | 0 |
| src/components/attendance/GamifiedCelebrationModal.tsx | 16 | `GamifiedCelebrationModal` | arrow/function-expression |  | y | A | 0 |
| src/components/attendance/StudentBehaviourModal.tsx | 31 | `StudentBehaviourModal` | arrow/function-expression |  | y | A | 0 |
| src/components/attendance/StudentBehaviourModal.tsx | 68 | `handleSubmit` | arrow/function-expression |  |  | A | 0 |
| src/components/communications/CommunicationsView.tsx | 19 | `CommunicationsView` | arrow/function-expression |  | y | A | 0 |
| src/components/dashboard/ExecutiveMorningBriefingCard.tsx | 24 | `ExecutiveMorningBriefingCard` | arrow/function-expression |  | y | A | 0 |
| src/components/dashboard/ExecutiveMorningBriefingCard.tsx | 47 | `loadDigest` | arrow/function-expression | y |  | A | 1 |
| src/components/dashboard/ExecutiveMorningBriefingCard.tsx | 59 | `handleSendNow` | arrow/function-expression | y |  | A | 0 |
| src/components/digest/DigestEmailPreviewTab.tsx | 24 | `DigestEmailPreviewTab` | arrow/function-expression |  | y | A | 0 |
| src/components/digest/DigestHistoryTab.tsx | 13 | `DigestHistoryTab` | arrow/function-expression |  | y | A | 0 |
| src/components/digest/DigestOverviewTab.tsx | 26 | `DigestOverviewTab` | arrow/function-expression |  | y | A | 0 |
| src/components/digest/DigestSchedulerSettingsTab.tsx | 16 | `DigestSchedulerSettingsTab` | arrow/function-expression |  | y | A | 0 |
| src/components/digest/DigestSettingsModal.tsx | 13 | `DigestSettingsModal` | arrow/function-expression |  | y | A | 0 |
| src/components/digest/DigestSettingsModal.tsx | 25 | `handleAddRecipient` | arrow/function-expression |  |  | A | 0 |
| src/components/digest/DigestSettingsModal.tsx | 38 | `handleRemoveRecipient` | arrow/function-expression |  |  | A | 1 |
| src/components/digest/DigestSettingsModal.tsx | 45 | `handleSave` | arrow/function-expression |  |  | A | 0 |
| src/components/digest/SandboxedEmailHtml.tsx | 18 | `SandboxedEmailHtml` | arrow/function-expression |  | y | R | 0 |
| src/components/justifications/JustificationReviewModal.tsx | 34 | `JustificationReviewModal` | arrow/function-expression |  | y | A | 0 |
| src/components/justifications/JustificationSubmitForm.tsx | 45 | `JustificationSubmitForm` | arrow/function-expression |  | y | A | 0 |
| src/components/justifications/JustificationsRosterTable.tsx | 28 | `JustificationsRosterTable` | arrow/function-expression |  | y | A | 0 |
| src/components/parent/ParentRecordDetailsModal.tsx | 64 | `ParentRecordDetailsModal` | arrow/function-expression |  | y | A | 0 |
| src/components/parent/ParentRecordsTable.tsx | 60 | `ParentRecordsTable` | arrow/function-expression |  | y | A | 0 |
| src/components/parent/ParentRecordsTable.tsx | 75 | `getArabicDayName` | arrow/function-expression |  |  | A | 1 |
| src/components/parent/ParentRecordsTable.tsx | 323 | `handlePrint` | arrow/function-expression |  |  | A | 0 |
| src/components/reports/AbsenceHeatmapCard.tsx | 15 | `AbsenceHeatmapCard` | arrow/function-expression |  | y | A | 0 |
| src/components/reports/AbsenceHeatmapCard.tsx | 66 | `getColorClass` | arrow/function-expression |  |  | A | 1 |
| src/components/reports/BatchPrintCenterModal.tsx | 15 | `BatchPrintCenterModal` | arrow/function-expression |  | y | A | 0 |
| src/components/reports/BatchPrintCenterModal.tsx | 40 | `handleDownloadPdf` | arrow/function-expression | y |  | A | 0 |
| src/components/reports/BatchPrintCenterModal.tsx | 55 | `handlePrint` | arrow/function-expression |  |  | A | 0 |
| src/components/reports/StudentEngagementSection.tsx | 22 | `StudentEngagementSection` | arrow/function-expression |  | y | A | 0 |
| src/components/settings/AcademicCalendarTab.tsx | 15 | `AcademicCalendarTab` | arrow/function-expression |  | y | A | 0 |
| src/components/settings/AcademicCalendarTab.tsx | 19 | `handleYearChange` | arrow/function-expression |  |  | A | 1 |
| src/components/settings/AcademicCalendarTab.tsx | 27 | `handleYearBlur` | arrow/function-expression | y |  | A | 0 |
| src/components/settings/AcademicCalendarTab.tsx | 33 | `handleTermsChange` | arrow/function-expression |  |  | A | 0 |
| src/components/settings/AcademicCalendarTab.tsx | 42 | `handleTermsAutoSave` | arrow/function-expression | y |  | A | 0 |
| src/components/settings/AcademicTermsCard.tsx | 13 | `AcademicTermsCard` | arrow/function-expression |  | y | A | 0 |
| src/components/settings/AcademicTermsCard.tsx | 28 | `triggerAutoSave` | arrow/function-expression | y |  | A | 4 |
| src/components/settings/AcademicTermsCard.tsx | 44 | `handleSetActive` | arrow/function-expression | y |  | A | 1 |
| src/components/settings/AcademicTermsCard.tsx | 63 | `startEdit` | arrow/function-expression |  |  | A | 1 |
| src/components/settings/AcademicTermsCard.tsx | 71 | `saveEdit` | arrow/function-expression | y |  | A | 1 |
| src/components/settings/AcademicTermsCard.tsx | 93 | `cancelEdit` | arrow/function-expression |  |  | A | 0 |
| src/components/settings/AcademicTermsCard.tsx | 98 | `handleDelete` | arrow/function-expression | y |  | A | 1 |
| src/components/settings/AcademicTermsCard.tsx | 118 | `handleAddTerm` | arrow/function-expression | y |  | A | 0 |
| src/components/settings/ClassesManagementCard.tsx | 14 | `ClassesManagementCard` | arrow/function-expression |  | y | A | 0 |
| src/components/settings/ClassesManagementCard.tsx | 37 | `triggerAutoSave` | arrow/function-expression | y |  | A | 3 |
| src/components/settings/ClassesManagementCard.tsx | 53 | `startEdit` | arrow/function-expression |  |  | A | 1 |
| src/components/settings/ClassesManagementCard.tsx | 61 | `saveEdit` | arrow/function-expression | y |  | A | 1 |
| src/components/settings/ClassesManagementCard.tsx | 78 | `cancelEdit` | arrow/function-expression |  |  | A | 0 |
| src/components/settings/ClassesManagementCard.tsx | 82 | `handleDelete` | arrow/function-expression | y |  | A | 1 |
| src/components/settings/ClassesManagementCard.tsx | 92 | `handleAddClass` | arrow/function-expression | y |  | A | 0 |
| src/components/settings/EmergencyPolicyTab.tsx | 12 | `EmergencyPolicyTab` | arrow/function-expression |  | y | A | 0 |
| src/components/settings/EmergencyPolicyTab.tsx | 16 | `handlePointChange` | arrow/function-expression |  |  | A | 1 |
| src/components/settings/EmergencyPolicyTab.tsx | 26 | `handleAddPoint` | arrow/function-expression |  |  | A | 0 |
| src/components/settings/EmergencyPolicyTab.tsx | 37 | `handleDeletePoint` | arrow/function-expression |  |  | A | 1 |
| src/components/settings/GradeLevelsCard.tsx | 29 | `GradeLevelsCard` | arrow/function-expression |  | y | A | 0 |
| src/components/settings/GradeLevelsCard.tsx | 47 | `triggerAutoSave` | arrow/function-expression | y |  | A | 3 |
| src/components/settings/GradeLevelsCard.tsx | 64 | `handleAddGrade` | arrow/function-expression | y |  | A | 1 |
| src/components/settings/GradeLevelsCard.tsx | 80 | `startEdit` | arrow/function-expression |  |  | A | 1 |
| src/components/settings/GradeLevelsCard.tsx | 85 | `saveEdit` | arrow/function-expression | y |  | A | 1 |
| src/components/settings/GradeLevelsCard.tsx | 102 | `cancelEdit` | arrow/function-expression |  |  | A | 1 |
| src/components/settings/GradeLevelsCard.tsx | 106 | `handleDelete` | arrow/function-expression | y |  | A | 1 |
| src/components/settings/GradesAndClassesTab.tsx | 16 | `GradesAndClassesTab` | arrow/function-expression |  | y | A | 0 |
| src/components/settings/GradesAndClassesTab.tsx | 27 | `handleGradesChange` | arrow/function-expression |  |  | A | 0 |
| src/components/settings/GradesAndClassesTab.tsx | 31 | `handleGradesAutoSave` | arrow/function-expression | y |  | A | 0 |
| src/components/settings/GradesAndClassesTab.tsx | 38 | `handleClassesChange` | arrow/function-expression |  |  | A | 0 |
| src/components/settings/GradesAndClassesTab.tsx | 42 | `handleClassesAutoSave` | arrow/function-expression | y |  | A | 0 |
| src/components/settings/GradesAndClassesTab.tsx | 49 | `handleSubjectsChange` | arrow/function-expression |  |  | A | 0 |
| src/components/settings/GradesAndClassesTab.tsx | 53 | `handleSubjectsAutoSave` | arrow/function-expression | y |  | A | 0 |
| src/components/settings/HolidaysAndWeekendsCard.tsx | 49 | `HolidaysAndWeekendsCard` | arrow/function-expression |  | y | A | 0 |
| src/components/settings/HolidaysAndWeekendsCard.tsx | 88 | `triggerAutoSave` | arrow/function-expression | y |  | A | 6 |
| src/components/settings/HolidaysAndWeekendsCard.tsx | 108 | `handleToggleWeekendDay` | arrow/function-expression | y |  | A | 1 |
| src/components/settings/HolidaysAndWeekendsCard.tsx | 134 | `applyPreset` | arrow/function-expression | y |  | A | 1 |
| src/components/settings/HolidaysAndWeekendsCard.tsx | 157 | `handleAddHoliday` | arrow/function-expression | y |  | A | 1 |
| src/components/settings/HolidaysAndWeekendsCard.tsx | 204 | `handleDeleteHoliday` | arrow/function-expression | y |  | A | 1 |
| src/components/settings/HolidaysAndWeekendsCard.tsx | 223 | `handleRestoreMOECalendar` | arrow/function-expression | y |  | A | 0 |
| src/components/settings/HolidaysAndWeekendsCard.tsx | 250 | `handleApplySmartHolidays` | arrow/function-expression | y |  | A | 0 |
| src/components/settings/HolidaysAndWeekendsCard.tsx | 280 | `getDurationDays` | arrow/function-expression |  |  | A | 1 |
| src/components/settings/SchoolAIGeminiTab.tsx | 34 | `SchoolAIGeminiTab` | arrow/function-expression |  | y | A | 0 |
| src/components/settings/SchoolAIGeminiTab.tsx | 63 | `fetchConfig` | arrow/function-expression | y |  | A | 1 |
| src/components/settings/SchoolAIGeminiTab.tsx | 86 | `handleSaveKey` | arrow/function-expression | y |  | A | 0 |
| src/components/settings/SchoolAIGeminiTab.tsx | 133 | `handleTestConnection` | arrow/function-expression | y |  | A | 0 |
| src/components/settings/SchoolAIGeminiTab.tsx | 170 | `handleDeleteKey` | arrow/function-expression | y |  | A | 0 |
| src/components/settings/SchoolContactTab.tsx | 20 | `SchoolContactTab` | arrow/function-expression |  | y | A | 0 |
| src/components/settings/SchoolContactTab.tsx | 33 | `handleCountryChange` | arrow/function-expression |  |  | A | 1 |
| src/components/settings/SchoolContactTab.tsx | 47 | `handleDialCodeChange` | arrow/function-expression |  |  | A | 1 |
| src/components/settings/SchoolContactTab.tsx | 58 | `handleAddressChange` | arrow/function-expression |  |  | A | 1 |
| src/components/settings/SchoolIdentityTab.tsx | 13 | `SchoolIdentityTab` | arrow/function-expression |  | y | A | 0 |
| src/components/settings/SchoolLeadershipTab.tsx | 12 | `SchoolLeadershipTab` | arrow/function-expression |  | y | A | 0 |
| src/components/settings/SchoolLeadershipTab.tsx | 17 | `handleLeadershipChange` | arrow/function-expression |  |  | A | 1 |
| src/components/settings/SchoolMessagingGatewaysTab.tsx | 42 | `SchoolMessagingGatewaysTab` | arrow/function-expression |  | y | A | 0 |
| src/components/settings/SchoolMessagingGatewaysTab.tsx | 71 | `handleFieldChange` | arrow/function-expression |  |  | A | 1 |
| src/components/settings/SchoolMessagingGatewaysTab.tsx | 82 | `handleSubmit` | arrow/function-expression |  |  | A | 0 |
| src/components/settings/SchoolMessagingGatewaysTab.tsx | 105 | `handleTestWhatsAppWeb` | arrow/function-expression |  |  | A | 0 |
| src/components/settings/SmartHolidayImportModal.tsx | 38 | `SmartHolidayImportModal` | arrow/function-expression |  | y | A | 0 |
| src/components/settings/SmartHolidayImportModal.tsx | 88 | `handlePerformSearch` | arrow/function-expression | y |  | A | 1 |
| src/components/settings/SmartHolidayImportModal.tsx | 148 | `handleToggleHoliday` | arrow/function-expression |  |  | A | 1 |
| src/components/settings/SmartHolidayImportModal.tsx | 156 | `handleSelectAll` | arrow/function-expression |  |  | A | 0 |
| src/components/settings/SmartHolidayImportModal.tsx | 164 | `handleApply` | arrow/function-expression | y |  | A | 0 |
| src/components/settings/SmartHolidayImportModal.tsx | 186 | `calculateDays` | arrow/function-expression |  |  | A | 1 |
| src/components/settings/SubjectsManagementCard.tsx | 13 | `SubjectsManagementCard` | arrow/function-expression |  | y | A | 0 |
| src/components/settings/SubjectsManagementCard.tsx | 28 | `triggerAutoSave` | arrow/function-expression | y |  | A | 3 |
| src/components/settings/SubjectsManagementCard.tsx | 44 | `startEdit` | arrow/function-expression |  |  | A | 1 |
| src/components/settings/SubjectsManagementCard.tsx | 51 | `saveEdit` | arrow/function-expression | y |  | A | 1 |
| src/components/settings/SubjectsManagementCard.tsx | 67 | `cancelEdit` | arrow/function-expression |  |  | A | 0 |
| src/components/settings/SubjectsManagementCard.tsx | 71 | `handleDelete` | arrow/function-expression | y |  | A | 1 |
| src/components/settings/SubjectsManagementCard.tsx | 81 | `handleAddSubject` | arrow/function-expression | y |  | A | 0 |
| src/components/settings/TimetablePeriodsTab.tsx | 13 | `TimetablePeriodsTab` | arrow/function-expression |  | y | A | 0 |
| src/components/settings/TimetablePeriodsTab.tsx | 23 | `triggerAutoSave` | arrow/function-expression | y |  | A | 4 |
| src/components/settings/TimetablePeriodsTab.tsx | 34 | `handlePeriodChange` | arrow/function-expression | y |  | A | 1 |
| src/components/settings/TimetablePeriodsTab.tsx | 44 | `handlePeriodBlur` | arrow/function-expression | y |  | A | 0 |
| src/components/settings/TimetablePeriodsTab.tsx | 48 | `handleAddPeriod` | arrow/function-expression | y |  | A | 0 |
| src/components/settings/TimetablePeriodsTab.tsx | 62 | `handleDeletePeriod` | arrow/function-expression | y |  | A | 1 |
| src/components/settings/UserEditModal.tsx | 30 | `UserEditModal` | arrow/function-expression |  | y | A | 0 |
| src/components/settings/UserEditModal.tsx | 58 | `toggleClass` | arrow/function-expression |  |  | A | 1 |
| src/components/settings/UserEditModal.tsx | 64 | `toggleSubject` | arrow/function-expression |  |  | A | 1 |
| src/components/settings/UserEditModal.tsx | 70 | `handleAddCustomSubject` | arrow/function-expression |  |  | A | 0 |
| src/components/settings/UserEditModal.tsx | 80 | `handleSubmit` | arrow/function-expression | y |  | A | 0 |
| src/components/settings/UserManagementTab.tsx | 35 | `UserManagementTab` | arrow/function-expression |  | y | A | 0 |
| src/components/settings/UserManagementTab.tsx | 82 | `handleOpenCreate` | arrow/function-expression |  |  | A | 0 |
| src/components/settings/UserManagementTab.tsx | 87 | `handleOpenEdit` | arrow/function-expression |  |  | A | 1 |
| src/components/settings/UserManagementTab.tsx | 92 | `handleDelete` | arrow/function-expression | y |  | A | 1 |
| src/components/settings/UserManagementTab.tsx | 101 | `handleSaveModal` | arrow/function-expression | y |  | A | 0 |
| src/components/students/AddStudentModal.tsx | 16 | `AddStudentModal` | arrow/function-expression |  | y | A | 0 |
| src/components/students/AddStudentModal.tsx | 54 | `handleSubmit` | arrow/function-expression |  |  | A | 0 |
| src/components/students/DeleteStudentConfirmationModal.tsx | 14 | `DeleteStudentConfirmationModal` | arrow/function-expression |  | y | A | 0 |
| src/components/students/SchoolClassStatsCards.tsx | 17 | `SchoolClassStatsCards` | arrow/function-expression |  | y | A | 0 |
| src/components/students/StudentAbsenceDrawer.tsx | 36 | `StudentAbsenceDrawer` | arrow/function-expression |  | y | A | 0 |
| src/components/students/StudentAbsenceDrawer.tsx | 65 | `handleKeyDown` | arrow/function-expression |  |  | A | 0 |
| src/components/students/StudentAbsenceDrawer.tsx | 260 | `getArabicDayName` | arrow/function-expression |  |  | A | 1 |
| src/components/students/StudentAbsenceDrawer.tsx | 272 | `getSchoolDaysInRange` | arrow/function-expression |  |  | A | 1 |
| src/components/students/StudentAbsenceDrawer.tsx | 642 | `handleSendWarning` | arrow/function-expression |  |  | A | 0 |
| src/components/students/StudentAbsenceDrawer.tsx | 654 | `handleWhatsAppContact` | arrow/function-expression |  |  | A | 0 |
| src/components/students/StudentAbsenceDrawer.tsx | 666 | `handleDownloadPdf` | arrow/function-expression | y |  | A | 0 |
| src/components/students/StudentAbsenceDrawer.tsx | 703 | `handlePrint` | arrow/function-expression |  |  | A | 0 |
| src/components/students/TransferStudentModal.tsx | 14 | `TransferStudentModal` | arrow/function-expression |  | y | A | 0 |
| src/components/students/TransferStudentModal.tsx | 30 | `handleSubmit` | arrow/function-expression |  |  | A | 0 |
| src/components/superadmin/PlatformOwnerModal.tsx | 65 | `PlatformOwnerModal` | arrow/function-expression |  | y | A | 0 |
| src/components/superadmin/PlatformOwnerModal.tsx | 136 | `handleSubdomainChange` | arrow/function-expression |  |  | A | 1 |
| src/components/superadmin/PlatformOwnerModal.tsx | 147 | `handleNameArChange` | arrow/function-expression |  |  | A | 1 |
| src/components/superadmin/PlatformOwnerModal.tsx | 154 | `handleCountryChange` | arrow/function-expression |  |  | A | 1 |
| src/components/superadmin/PlatformOwnerModal.tsx | 165 | `handleSubmitProvision` | arrow/function-expression | y |  | A | 0 |
| src/components/superadmin/PlatformOwnerModal.tsx | 216 | `handleSyncWithServer` | arrow/function-expression | y |  | A | 0 |
| src/components/superadmin/PlatformOwnerModal.tsx | 230 | `handleSubscriptionAction` | arrow/function-expression | y |  | A | 1 |

## Scripts (40)

| File | Line | Name | Kind | Async | Exp | R/A | Callers |
|---|---|---|---|---|---|---|---|
| scripts/ci-security-audit.mjs | 61 | `scanDirectory` | function |  |  | A | 0 |
| scripts/emulator-smoke.mjs | 51 | `check` | arrow/function-expression |  |  | A | 0 |
| scripts/golive-check.mjs | 34 | `check` | arrow/function-expression |  |  | A | 0 |
| scripts/golive-check.mjs | 40 | `isTrue` | arrow/function-expression |  |  | A | 0 |
| scripts/golive-check.mjs | 41 | `has` | arrow/function-expression |  |  | A | 0 |
| scripts/render-pdf-to-image.mjs | 4 | `main` | function | y |  | A | 0 |
| scripts/rotate-tenant-ai-secrets.mjs | 33 | `flag` | arrow/function-expression |  |  | A | 0 |
| scripts/rotate-tenant-ai-secrets.mjs | 35 | `generateKey` | arrow/function-expression |  |  | A | 0 |
| scripts/rotate-tenant-ai-secrets.mjs | 36 | `derive` | arrow/function-expression |  |  | A | 0 |
| scripts/rotate-tenant-ai-secrets.mjs | 62 | `decrypt` | arrow/function-expression |  |  | A | 0 |
| scripts/rotate-tenant-ai-secrets.mjs | 68 | `encrypt` | arrow/function-expression |  |  | A | 0 |
| scripts/rotate-tenant-ai-secrets.mjs | 115 | `writeEnvKey` | function |  |  | A | 0 |
| scripts/security-probes.mjs | 20 | `check` | function |  |  | A | 0 |
| scripts/security-probes.mjs | 26 | `status` | function | y |  | A | 0 |
| scripts/security-probes.mjs | 31 | `json` | function | y |  | A | 0 |
| scripts/seed-demo-roles.mjs | 101 | `removeAll` | function | y |  | A | 0 |
| scripts/seed-demo-roles.mjs | 131 | `createAll` | function | y |  | A | 0 |
| scripts/seed-demo-roles.mjs | 132 | `iso` | arrow/function-expression |  |  | A | 1 |
| scripts/seed-firebase-auth.ts | 24 | `seedFirebaseAuthUsers` | function | y |  | A | 0 |
| scripts/seed-tenant-demo.mjs | 33 | `hasFlag` | arrow/function-expression |  |  | A | 1 |
| scripts/seed-tenant-demo.mjs | 34 | `getArg` | arrow/function-expression |  |  | A | 1 |
| scripts/seed-tenant-demo.mjs | 115 | `tenantEmails` | arrow/function-expression |  |  | A | 3 |
| scripts/seed-tenant-demo.mjs | 126 | `demoStudentIds` | arrow/function-expression |  |  | A | 1 |
| scripts/seed-tenant-demo.mjs | 127 | `demoSessionId` | arrow/function-expression |  |  | A | 1 |
| scripts/seed-tenant-demo.mjs | 128 | `demoNotificationId` | arrow/function-expression |  |  | A | 1 |
| scripts/seed-tenant-demo.mjs | 129 | `demoJustificationId` | arrow/function-expression |  |  | A | 1 |
| scripts/seed-tenant-demo.mjs | 131 | `defaultSubscription` | arrow/function-expression |  |  | A | 1 |
| scripts/seed-tenant-demo.mjs | 143 | `knownTenants` | arrow/function-expression |  |  | A | 0 |
| scripts/seed-tenant-demo.mjs | 160 | `countQuery` | arrow/function-expression | y |  | A | 1 |
| scripts/seed-tenant-demo.mjs | 166 | `inspectTenants` | function | y |  | A | 0 |
| scripts/seed-tenant-demo.mjs | 203 | `removeTenants` | function | y |  | A | 0 |
| scripts/seed-tenant-demo.mjs | 240 | `seedTenant` | function | y |  | A | 0 |
| scripts/test-browser-fetch.mjs | 3 | `testBrowserFetch` | function | y |  | A | 0 |
| scripts/test-firestore-rules.mjs | 324 | `expectAllowed` | function | y |  | A | 0 |
| scripts/test-firestore-rules.mjs | 334 | `expectDenied` | function | y |  | A | 0 |
| scripts/test-firestore-rules.mjs | 526 | `setSchool2Subscription` | function | y |  | A | 0 |
| scripts/test-full-report.mjs | 3 | `testFullReport` | function | y |  | A | 0 |
| scripts/test-generate-pdf.mjs | 3 | `generate` | function | y |  | A | 0 |
| scripts/test_key.ts | 5 | `testApiKey` | function | y |  | A | 0 |
| scripts/validate-all-print-functions.mjs | 250 | `runValidation` | function | y |  | A | 0 |

## Tests (61)

| File | Line | Name | Kind | Async | Exp | R/A | Callers |
|---|---|---|---|---|---|---|---|
| src/config/subscription.test.ts | 16 | `findUndefinedPaths` | function |  |  | A | 0 |
| src/utils/attendanceAccess.test.ts | 11 | `makeSession` | function |  |  | A | 0 |
| src/utils/attendanceAccess.test.ts | 22 | `makeUser` | function |  |  | A | 0 |
| src/utils/calculationsAudit.test.ts | 12 | `calculateStudentAttendanceRate` | arrow/function-expression |  | y | A | 0 |
| src/utils/calculationsAudit.test.ts | 21 | `calculateSchoolAverageAttendance` | arrow/function-expression |  | y | A | 0 |
| src/utils/calculationsAudit.test.ts | 28 | `classifyChronicAbsenceRiskTier` | arrow/function-expression |  | y | A | 0 |
| src/utils/calculationsAudit.test.ts | 35 | `aggregateClassSummaries` | arrow/function-expression |  | y | A | 0 |
| src/utils/calculationsAudit.test.ts | 60 | `calculateConsecutiveStreak` | arrow/function-expression |  | y | A | 0 |
| src/utils/countryCallingCodes.test.ts | 14 | `getItem` | arrow/function-expression |  |  | A | 0 |
| src/utils/countryCallingCodes.test.ts | 15 | `setItem` | arrow/function-expression |  |  | A | 0 |
| src/utils/countryCallingCodes.test.ts | 18 | `removeItem` | arrow/function-expression |  |  | A | 0 |
| src/utils/countryCallingCodes.test.ts | 21 | `clear` | arrow/function-expression |  |  | A | 0 |
| src/utils/countryCallingCodes.test.ts | 24 | `key` | arrow/function-expression |  |  | A | 0 |
| src/utils/hardcodedCredentials.test.ts | 9 | `collectSourceFiles` | function |  |  | A | 0 |
| src/utils/localCache.test.ts | 12 | `makeFakeStorage` | function |  |  | A | 0 |
| src/utils/localCache.test.ts | 15 | `getItem` | arrow/function-expression |  |  | A | 0 |
| src/utils/localCache.test.ts | 16 | `setItem` | arrow/function-expression |  |  | A | 0 |
| src/utils/localCache.test.ts | 19 | `removeItem` | arrow/function-expression |  |  | A | 0 |
| src/utils/localCache.test.ts | 22 | `clear` | arrow/function-expression |  |  | A | 0 |
| src/utils/localCache.test.ts | 23 | `key` | arrow/function-expression |  |  | A | 0 |
| src/utils/localCache.test.ts | 24 | `length` | accessor |  |  | A | 0 |
| src/utils/messagingGatewayRBAC.test.ts | 16 | `authorizeGatewayConfigUpdate` | function |  | y | A | 0 |
| src/utils/messagingProviders.test.ts | 11 | `mockResponse` | function |  |  | A | 0 |
| src/utils/messagingProviders.test.ts | 22 | `json` | arrow/function-expression | y |  | A | 0 |
| src/utils/messagingProviders.test.ts | 23 | `text` | arrow/function-expression | y |  | A | 0 |
| src/utils/messagingProviders.test.ts | 24 | `get` | arrow/function-expression |  |  | A | 0 |
| src/utils/modalA11y.test.ts | 73 | `hasAttribute` | arrow/function-expression |  |  | A | 0 |
| src/utils/modalA11y.test.ts | 73 | `getAttribute` | arrow/function-expression |  |  | A | 0 |
| src/utils/modalA11y.test.ts | 74 | `hasAttribute` | arrow/function-expression |  |  | A | 0 |
| src/utils/modalA11y.test.ts | 74 | `getAttribute` | arrow/function-expression |  |  | A | 0 |
| src/utils/modalA11y.test.ts | 75 | `hasAttribute` | arrow/function-expression |  |  | A | 0 |
| src/utils/modalA11y.test.ts | 75 | `getAttribute` | arrow/function-expression |  |  | A | 0 |
| src/utils/modalA11y.test.ts | 78 | `querySelectorAll` | arrow/function-expression |  |  | A | 0 |
| src/utils/notificationDispatchRBAC.test.ts | 8 | `checkCanDispatchNotifications` | arrow/function-expression |  | y | A | 1 |
| src/utils/notificationDispatchRBAC.test.ts | 12 | `validateNotificationDispatchPayload` | arrow/function-expression |  | y | A | 0 |
| src/utils/rbac.test.ts | 5 | `checkCanEditSession` | arrow/function-expression |  | y | A | 0 |
| src/utils/rbac.test.ts | 21 | `checkIsChildOfGuardian` | arrow/function-expression |  | y | A | 0 |
| src/utils/rbac.test.ts | 147 | `validateTenantMembership` | arrow/function-expression |  |  | A | 0 |
| src/utils/rbac.test.ts | 221 | `attemptDelete` | arrow/function-expression |  |  | A | 0 |
| src/utils/serverIntegration.test.ts | 15 | `request` | function |  |  | A | 0 |
| src/utils/settingsComplianceAudit.test.ts | 61 | `checkStudentRisk` | arrow/function-expression |  |  | A | 0 |
| src/utils/superAdminStealthAndProvisioning.test.ts | 9 | `getItem` | arrow/function-expression |  |  | A | 0 |
| src/utils/superAdminStealthAndProvisioning.test.ts | 10 | `setItem` | arrow/function-expression |  |  | A | 0 |
| src/utils/superAdminStealthAndProvisioning.test.ts | 11 | `removeItem` | arrow/function-expression |  |  | A | 0 |
| src/utils/superAdminStealthAndProvisioning.test.ts | 12 | `clear` | arrow/function-expression |  |  | A | 0 |
| src/utils/superAdminStealthAndProvisioning.test.ts | 13 | `key` | arrow/function-expression |  |  | A | 0 |
| src/utils/superAdminStealthAndProvisioning.test.ts | 88 | `isSuperAdmin` | arrow/function-expression |  |  | A | 6 |
| src/utils/superAdminStealthAndProvisioning.test.ts | 89 | `canManageSettings` | arrow/function-expression |  |  | A | 0 |
| src/utils/superAdminStealthAndProvisioning.test.ts | 90 | `canReviewJustifications` | arrow/function-expression |  |  | A | 0 |
| src/utils/superAdminStealthAndProvisioning.test.ts | 91 | `canReopenSessions` | arrow/function-expression |  |  | A | 0 |
| src/utils/superAdminStealthAndProvisioning.test.ts | 92 | `canImportStudents` | arrow/function-expression |  |  | A | 0 |
| src/utils/superAdminStealthAndProvisioning.test.ts | 93 | `canDispatchDigest` | arrow/function-expression |  |  | A | 0 |
| src/utils/superAdminStealthAndProvisioning.test.ts | 94 | `canManageOutbox` | arrow/function-expression |  |  | A | 0 |
| src/utils/superAdminStealthAndProvisioning.test.ts | 137 | `attemptDelete` | arrow/function-expression |  |  | A | 0 |
| src/utils/tenantAISecrets.test.ts | 36 | `reset` | arrow/function-expression |  |  | A | 0 |
| src/utils/tenantResolution.test.ts | 192 | `getItem` | arrow/function-expression |  |  | A | 0 |
| src/utils/tenantResolution.test.ts | 193 | `setItem` | arrow/function-expression |  |  | A | 0 |
| src/utils/tenantResolution.test.ts | 194 | `removeItem` | arrow/function-expression |  |  | A | 0 |
| src/utils/uiCleanlinessAudit.test.ts | 6 | `readComponent` | arrow/function-expression |  |  | A | 0 |
| src/utils/uiHubsNavigation.test.ts | 7 | `resolveActiveHub` | arrow/function-expression |  |  | A | 0 |
| src/utils/uiHubsNavigation.test.ts | 127 | `canAccessOutbox` | arrow/function-expression |  |  | A | 0 |

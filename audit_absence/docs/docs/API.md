# API

Base: same origin. JSON. Auth = `Authorization: Bearer <Firebase ID token>` (verified with revocation check). Global chain for every non-public `/api/*` route: `authenticateRequest → requireTenant → requireActiveSubscription` (402 when school suspended/expired). Public routes (`routeAuth.ts`): `/api/health`, `/api/readyz`, `/api/tenant/resolve`, `/api/tenants`. Rate limits are **per IP** (see SEC-06) except the PDF limiter (per uid). Common errors: 401 `INVALID_CREDENTIAL`/missing bearer; 403 `NO_ROLE_ASSIGNED`, `TENANT_DOMAIN_MISMATCH`, role denial; 404 `UNKNOWN_TENANT_DOMAIN`; 402 subscription; 503 `AUTH_NOT_CONFIGURED`. Per-route function detail: `FUNCTION_DOCUMENTATION.md` (entries named `METHOD /path [handler]`).

| # | Method & route | Auth / role | Frontend caller | Firestore | External |
|---|---|---|---|---|---|
| 1 | POST `/api/pdf/generate` | any authenticated; tenant match; 10/min/uid; no subscription check | `utils/pdfExport.ts:13` | — | Chromium |
| 2 | POST `/api/chat` | admin, registrar, super_admin; 20/min/IP | `GeminiChatbotView.tsx:180` | — | Gemini |
| 3 | POST `/api/analyze-image` | **any authenticated**; 10/min/IP | `JustificationsView.tsx:146,199` | — | Gemini |
| 4 | POST `/api/daily-digest/generate-briefing` | admin, registrar; 10/min/IP | `generateCurrentDigest` (context:3283) | — | Gemini |
| 5 | POST `/api/daily-digest/dispatch` | admin, registrar | `dispatchDailyDigest` (context:3337) | R settings_private | SMTP/Resend/SendGrid |
| 6 | POST `/api/notifications/dispatch` | admin, registrar, super_admin; 60/min/IP | context:2334, 2461, 2598 | R settings_private; R/W notification_outbox | Twilio/Unifonic/Msegat/Taqnyat/WhatsApp |
| 7 | GET `/api/tenant/ai-config` | admin | `SchoolAIGeminiTab.tsx:66` | — (memory) | — |
| 8 | POST `/api/tenant/ai-config` | admin | `:102` | W tenant_ai_secrets | — |
| 9 | DELETE `/api/tenant/ai-config` | admin | `:179` | D tenant_ai_secrets | — |
| 10 | POST `/api/tenant/ai-config/test` | admin | `:139` | — | Gemini |
| 11 | GET `/api/health` | public; 60/min/IP | `OfflineSyncModal.tsx:62`, Render health check | — | — |
| 12 | GET `/api/readyz` | public | none found | — | — |
| 13 | GET `/api/tenant/resolve` | public | `App.tsx:322`, context:396 | R tenants | — |
| 14 | GET `/api/tenants` | public | `PlatformOwnerModal.tsx:116`, context:433 | R tenants | — |
| 15 | POST `/api/tenants/provision` | super_admin | `provisionNewSchool` (context:3559) | R/W tenants, W settings, W users | Auth |
| 16 | GET `/api/tenants/:tenantId/subscription` | super_admin | `PlatformOwnerModal.tsx:242` | R tenants | — |
| 17–20 | POST `…/subscription/suspend|reactivate|renew`, PATCH `…/subscription` | super_admin | `PlatformOwnerModal.tsx:242` | R/W tenants, W audit_logs | — |
| 21 | POST `/api/users` | admin, registrar (admin creation: admin/owner only) | `createUser` (context:1504) | W users | Auth |
| 22 | PATCH `/api/users/:uid` | admin, registrar (+denial rules) | `updateUser` (context:1596) | R/W users | Auth |
| 23 | DELETE `/api/users/:uid` | admin | `deleteUser` (context:1658) | D users | Auth |
| 24 | POST `/api/owner/holidays/search` | super_admin | `SmartHolidayImportModal.tsx:98` | — | Gemini |
| — | GET `*` (production) | public (non-/api) | — | — | serves `dist/index.html` |

## Request / response shapes (from handler code)
**POST /api/pdf/generate** — req `{ "htmlContent":"<div>…</div>", "title":"…", "filename":"report.pdf" }` → 200 `{ "success":true, "pdfBase64":"…", "filename":"report.pdf", "utf8Filename":"…", "size":12345 }`; 400 `{error:"htmlContent is required"}`; 503 `{code:"PDF_ENGINE_BUSY"}`; 500 `{error:"Failed to generate PDF document", details:"Internal error"}`.

**POST /api/chat** — req `{ "messages":[{"role":"user","content":"…"}], "role":"counselor|teacher_fast|policy_analyst", "modelPreference":"gemini-3.5-flash" }` → 200 `{reply, modelUsed, keySource:"tenant|system"}`; 503 `{success:false, code:"AI_UNAVAILABLE"}`; 502 `AI_ERROR`.

**POST /api/analyze-image** — req `{ imageBase64, mimeType:"image/jpeg|png|webp|application/pdf", expectedStudentName?, expectedAbsenceDate?, studentGrade?, promptCustom? }` → 200 `{ analysis:{…model JSON…}, rawText, modelUsed }`. 400 invalid MIME/magic bytes, 413 > 7 MiB base64. The JSON schema of `analysis` is defined only inside the Arabic prompt text (UNKNOWN beyond `Justification.aiAnalysis` type in `types/attendance.ts`).

**POST /api/daily-digest/generate-briefing** — req optional `{tenantName,date,overallAttendanceRate,totalStudents,anomalies[],pendingJustificationsCount,pendingIrregularCount,highRiskStudents[]}` → `{success, briefing:{headline,urgencyLevel,executiveSummary,keyPriorities[],counselorDirectives[]}, modelUsed}` (schema requested in prompt; not validated server-side).

**POST /api/daily-digest/dispatch** — req `{recipients:["a@b.c"], subject, htmlContent, scheduledTime}` → `{success, dispatchId, dispatchedAt, scheduledTime, recipientsCount, recipients, subject, status:"delivered", provider, receiptId, message}`; 503 `EMAIL_NOT_CONFIGURED`; 502 `EMAIL_DISPATCH_FAILED`.

**POST /api/notifications/dispatch** — req `{ "notifications":[{"id":"n1","recipientPhone":"9665…","messageText":"…","channel":"SMS|WhatsApp"}], "channel":"WhatsApp" }` (≤200) → `{success, gatewayConfigured:true, dispatched, failed, manual, receipts[], results:[{id,status:"sent|failed|manual",gatewayReceiptId?,gatewayProvider?,sentAt?,errorReason?}]}`; 403 cross-tenant; 503 `GATEWAY_NOT_CONFIGURED`.

**POST /api/tenant/ai-config** — `{apiKey, preferredModel?}` → `{success,message,config:{tenantId,hasCustomKey,maskedKey,updatedAt,preferredModel}}`.

**POST /api/tenants/provision** — `{tenantId,subdomain,nameAr,…,principal:{email,name,phone,password?}}` → `{success, tenant, principal:{uid,email,temporaryPassword}}`.

**Subscription** — renew `{cycle:"monthly|annual", months, periodEnd, amount, currency}`; suspend `{reason}`; PATCH `{plan,billingCycle,gracePeriodDays,autoRenew,currentPeriodEnd,amount,currency,notes,limits:{maxStudents,maxUsers}}` → `{success,tenantId,subscription,summary}`.

**Users** — POST `{name,email,role,phone,jobTitle,status,assignedClasses,assignedSubjects,tenantId}` → `{success,created,temporaryPassword,user}`; PATCH `{name,phone,jobTitle,status,assignedClasses,assignedSubjects,role}` → `{success,user}`; DELETE → `{success:true}`.

**Health** — see `GET /api/health [handler]` in FUNCTION_DOCUMENTATION for fields.

Validation, error codes and security notes per endpoint: `FUNCTION_DOCUMENTATION.md` (REVIEWED entries) and `SECURITY_AUDIT.md`.

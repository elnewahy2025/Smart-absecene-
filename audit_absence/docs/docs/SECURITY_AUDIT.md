# SECURITY_AUDIT
Static review of code/config (no penetration test). Severity: Critical/High/Medium/Low. Format: File · Symbol · Evidence.

## Findings
### SEC-01 — High — Self-created `parent` profile can read any guardian's children (Firestore)
- **File:** `firestore.rules` lines 43-50, 197-203, 221-232 · **Symbol:** `isValidUserProfile`, `match /users`, `match /students`
- **Evidence:** `users` create is allowed when `request.auth.uid == userId && incoming().role == 'parent'` and `tenantAccessAllowed(incoming().tenantId)`. `isValidUserProfile` does not require/validate `phone` or tie `email` to the auth token, and accepts any `tenantId`. `students` read for role `parent` matches `guardianPhone == getUserData().phone` (same for `attendance_records`, `justifications`, `notification_outbox`). Email/password sign-up is enabled (`firebase.json`, `emailPassword:true`) and the web API key is public.
- **Impact:** any person with a Firebase account can create a profile in any active school with a guessed guardian phone and read that guardian's students' PII (national id, medical conditions, guardian data), attendance, excuses, messages.
- **Fix:** disallow self-registration (create profiles only via Admin SDK), or require a server-issued claim in rules (`request.auth.token.role/tenantId`) instead of the profile; verify phone ownership.
### SEC-02 — Medium — `tenantId` mutable on update (cross-tenant write injection)
- **File:** `firestore.rules` 234-237, 256-260, 301-302, 328-329 · **Symbol:** `students`/`attendance_sessions`/`justifications`/`notification_outbox` update
- **Evidence:** authorization uses `resource.data.tenantId` only; `incoming().tenantId` is not required to equal it.
- **Impact:** an admin/registrar of school A can re-home a record into school B (pollution/unauthorised write into B).
- **Fix:** add `incoming().tenantId == resource.data.tenantId`.
### SEC-03 — Medium — Teacher assignment check is client-controlled; teachers read all student PII
- **File:** `firestore.rules` 144-149, 221-225 · **Symbol:** `isTeacherAssigned`, `students` read
- **Evidence:** `teacherId == request.auth.uid` is satisfied by the writer setting `teacherId`; assignedClasses check requires `classId` in data (sessions are validated by `className`). Teachers can read every student document (nationalId, medicalConditions, bloodType).
- **Fix:** validate class membership server-side/in rules; restrict fields or use a teacher-safe projection.
### SEC-04 — Medium — `/api/analyze-image` lacks role authorization
- **File:** `server.ts:1182` · **Symbol:** `POST /api/analyze-image [handler]`
- **Evidence:** no `requireRole`; any authenticated user (parent/teacher) can trigger paid Gemini calls with up to ~5 MB payloads; students' document images go to a third party.
- **Fix:** restrict to roles that need it (check intended use: parent submit flow UNKNOWN), add per-tenant quota.
### SEC-05 — Medium — PDF endpoint renders unsanitised HTML with JS enabled
- **File:** `server.ts:238` · **Symbol:** `POST /api/pdf/generate [handler]`
- **Evidence:** `${htmlContent}` interpolated into a document that loads `cdn.tailwindcss.com` script; allowed for every authenticated role; not subscription-gated; 25 MB body limit.
- **Impact:** script execution in headless Chromium (egress limited to fonts/tailwind/data:), CPU/memory abuse (mitigated by 2 concurrent renders + 10/min/uid), Vercel `--no-sandbox` always.
- **Fix:** disable JavaScript (`page.setJavaScriptEnabled(false)`) after loading styles, sanitise, role-gate, size-cap, add subscription gate.
### SEC-06 — Medium — Rate limiters keyed by IP behind proxies
- **File:** `server.ts:36-50, 946-968` · **Symbol:** `parseTrustProxy`, limiters
- **Evidence:** `TRUST_PROXY` default `false`; chat/analyze/digest/notification/health limiters use default IP key and are mounted before auth. On Render/Vercel the peer is the platform proxy (deployment topology UNKNOWN at runtime) ⇒ all users may share one bucket (self-DoS) and per-user abuse is not limited.
- **Fix:** set `TRUST_PROXY` correctly and/or key limiters by uid after auth.
### SEC-07 — Low — Audit log entries are client-authored
- **File:** `firestore.rules` 339-340 · **Evidence:** `performerName/performerId` not bound to `request.auth`; teachers may create entries. Tamper-evidence only for update/delete.
### SEC-08 — Medium — Messaging gateway credentials stored in plaintext in Firestore
- **File:** `AttendanceContext.tsx:1304-1367`, `firestore.rules:314-317` · **Symbol:** `settings_private`
- **Evidence:** SMS/WhatsApp/email API keys and SMTP password are written as plain fields and are readable by any tenant admin client (and by anyone who obtains an admin session). AI keys, by contrast, are AES-GCM encrypted.
- **Fix:** move to server-held encrypted store, return masked values to the UI.
### SEC-09 — Medium — Dispatch endpoints accept arbitrary recipients/content
- **File:** `server.ts:1405, 1497` · **Evidence:** notification phone numbers and text come from the request, not from the stored outbox item; digest accepts any ≤50 emails and arbitrary HTML. A compromised/malicious admin or registrar can send spam/phishing under the school identity and cost.
- **Fix:** dispatch by outbox id (server reads recipient/text), restrict digest recipients to staff addresses.
### SEC-10 — Low — Public tenant enumeration
- `GET /api/tenants`, `GET /api/tenant/resolve` (public) and `tenants` read `if true` expose all schools, domains, subscription status and days remaining.
### SEC-11 — Low — Public `/api/health` discloses runtime details (Node version, memory, which services/keys are configured).
### SEC-12 — Low — Tenant-controlled SMTP host/port ⇒ server-side connections to arbitrary hosts (`sendViaSmtp`, `messagingProviders.ts:363`).
### SEC-13 — Low — Crypto hygiene (`tenantAISecrets.ts`)
SHA-256 of passphrase without salt/KDF, no AAD/tenant binding, no key versioning; DB writes are fire-and-forget (success returned before persistence); masked key reveals 11 chars.
### SEC-14 — Low — Account provisioning
Managed accounts are created with `emailVerified:true` and temporary passwords returned in API responses/UI message strings; forced password change not set in code (UNKNOWN beyond code).
### SEC-15 — Low — Client-side trust of role
UI role from localStorage `school_current_user_role`, owner email list in the bundle, `school_user_authenticated` flag. Server is not affected.
### SEC-16 — Low — Prompt injection surface
User-controlled text reaches prompts (`/api/chat`, `promptCustom`, digest `severity`, holiday `country`). Outputs are returned as text/JSON to the same caller; AI decisions are advisory (`recommendedDecision`) — no automatic approval found in code reviewed. Medical document images are untrusted input to a model whose output informs staff decisions.

## Areas checked with no finding
- **XSS:** no `dangerouslySetInnerHTML`/`eval`; digest HTML rendered in empty-`sandbox` iframe (`SandboxedEmailHtml`). `innerHTML` is only *read* from print refs.
- **CSRF:** bearer-header auth (no cookies) ⇒ not applicable. **CORS:** not configured (same-origin).
- **SQL/NoSQL injection:** Firestore SDK with typed paths; route params validated (`TENANT_ID_PATTERN`) except `:uid` (used as doc id string).
- **Path traversal / unsafe uploads:** no file upload endpoint; image MIME + magic-byte validation.
- **Secrets in repo:** `.env*` ignored; `hardcodedCredentials.test.ts`, `scripts/ci-security-audit.mjs` guard; no secrets seen in files read (full secret scan of all 215 files **not** performed).
- **Open redirects/SSRF (client-supplied URLs):** none; outbound URLs fixed except SMTP host.
- **Headers:** helmet + CSP (production) and equivalent headers in `vercel.json`.
- **Dependencies:** not scanned (`npm audit` unverified).

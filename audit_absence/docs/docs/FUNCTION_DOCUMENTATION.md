# FUNCTION_DOCUMENTATION

Every named function, method, API handler and named arrow function found by TypeScript-compiler AST extraction (622 entries, 133 files). Anonymous inline callbacks (e.g. `.map(x => …)`, `useEffect(() => …)`) are not separate entries; their calls are attributed to the enclosing named function.

**Review status** (shown per entry):

- **REVIEWED** — the code was read by hand; all fields are verified statements.
- **AUTO** — fields marked "detected" come from static pattern matching of the function body and the compiler call graph (*Calls*/*Called By* are resolved by the TypeScript type checker, not by name guessing). Fields that could not be derived are written `UNKNOWN (not individually reviewed)`. **Purpose** for AUTO entries is only given when an in-code comment exists.

Reviewed entries: 142; Auto entries: 480.



# Server


## api/handler.ts

### `handler`
- **File:** `api/handler.ts:6-37`  · **Review:** REVIEWED
- **Purpose:** Vercel serverless entry: rebuilds `req.url` from the `__apipath` rewrite param, boots the shared Express app and delegates to it.
- **Parameters:** `req: any, res: any`
- **Returns:** `Promise<void>`
- **Dependencies:** none detected
- **Calls:** `prepareRuntime`, Express `app`
- **Called By:** no in-repo caller resolved (entry point, event handler, route, or referenced by value)
- **Database Interaction:** Via the app.
- **External Services:** —
- **Authentication:** Via the app.
- **Authorization:** Via the app.
- **Validation:** URL rebuild only.
- **Errors:** 500 `FUNCTION_BOOT_ERROR` with truncated error message on import/boot failure.
- **Side Effects:** Dynamic import of `../server.js` (the esbuild bundle).
- **Edge Cases:** Requires `npm run build` output `server.js` to exist.
- **Security Considerations:** Boot error message (≤300 chars) returned to client.
- **Current Limitations:** —


## server.ts

### `parseTrustProxy`
- **File:** `server.ts:36-43`  · **Review:** REVIEWED
- **Purpose:** Parses the TRUST_PROXY env string into a value for Express `trust proxy`.
- **Parameters:** `value?: string`
- **Returns:** `boolean | number | string` — `false` when unset/empty; `true`/`false` for those literals; a number for digit strings; otherwise the raw string (e.g. a subnet list).
- **Dependencies:** none detected
- **Calls:** —
- **Called By:** no in-repo caller resolved (entry point, event handler, route, or referenced by value)
- **Database Interaction:** None.
- **External Services:** None.
- **Authentication:** N/A (startup helper).
- **Authorization:** N/A.
- **Validation:** Trims input; no validation of subnet strings.
- **Errors:** None thrown.
- **Side Effects:** None (pure).
- **Edge Cases:** Unset ⇒ `false` ⇒ X-Forwarded-* ignored.
- **Security Considerations:** Default (`false`) means `req.ip` is the direct socket peer. Behind a platform load balancer that is the LB's address, which affects every IP-keyed rate limiter (see SECURITY_AUDIT SEC-06).
- **Current Limitations:** No range check on numeric hop count.

### `getRequestHostname`
- **File:** `server.ts:94-97`  · **Review:** REVIEWED
- **Purpose:** Returns the request hostname, honouring `X-Forwarded-Host` only when TRUST_PROXY is configured.
- **Parameters:** `req: express.Request`
- **Returns:** `string` (may include port).
- **Dependencies:** none detected
- **Calls:** no in-repo callees resolved
- **Called By:** `getRequestHostTenant` (server.ts:490), `GET /api/tenant/resolve [handler]` (server.ts:1824)
- **Database Interaction:** None.
- **External Services:** None.
- **Authentication:** N/A.
- **Authorization:** N/A.
- **Validation:** None.
- **Errors:** None.
- **Side Effects:** None.
- **Edge Cases:** Falls back to `req.hostname` and then `''`.
- **Security Considerations:** Host is the basis of tenant resolution; ignoring forwarded host by default prevents header spoofing.
- **Current Limitations:** —

### `getSystemChromePath`
- **File:** `server.ts:128-148`  · **Review:** REVIEWED
- **Purpose:** Finds a Chrome/Edge/Chromium executable for PDF rendering.
- **Parameters:** none
- **Returns:** `string | undefined` — first existing path from CHROME_BIN, PUPPETEER_EXECUTABLE_PATH, then hard-coded Windows/Linux paths.
- **Dependencies:** fs
- **Calls:** no in-repo callees resolved
- **Called By:** `POST /api/pdf/generate [handler]` (server.ts:238), `GET /api/health [handler]` (server.ts:1785)
- **Database Interaction:** None.
- **External Services:** Filesystem existence checks (`fs.existsSync`).
- **Authentication:** N/A.
- **Authorization:** N/A.
- **Validation:** None.
- **Errors:** None.
- **Side Effects:** Filesystem reads.
- **Edge Cases:** Returns `undefined` when nothing is found; `launchPdfBrowser` then relies on puppeteer's default resolution.
- **Security Considerations:** Environment-controlled path is executed by puppeteer; trusted operator input.
- **Current Limitations:** Called on every `/api/health` request.

### `launchPdfBrowser`
- **File:** `server.ts:155-194`  · **Review:** REVIEWED
- **Purpose:** Starts headless Chromium: `@sparticuz/chromium` + `puppeteer-core` on Vercel, otherwise `puppeteer` with optional sandbox disable.
- **Parameters:** `executablePath: string | undefined`
- **Returns:** `Promise<Browser>` (typed `any`).
- **Dependencies:** puppeteer
- **Calls:** no in-repo callees resolved
- **Called By:** `POST /api/pdf/generate [handler]` (server.ts:238)
- **Database Interaction:** None.
- **External Services:** Launches a Chromium child process.
- **Authentication:** N/A.
- **Authorization:** N/A.
- **Validation:** None.
- **Errors:** Propagates launch errors to the caller.
- **Side Effects:** Spawns a process; dynamic imports of puppeteer packages.
- **Edge Cases:** On Vercel it always passes `--no-sandbox`; elsewhere `--no-sandbox` only when PUPPETEER_NO_SANDBOX==='true'.
- **Security Considerations:** Chromium sandbox is disabled unconditionally on Vercel. render.yaml still defines PUPPETEER_NO_SANDBOX while `.env.example` says the variable is no longer read — documentation conflict (the code does read it).
- **Current Limitations:** —

### `keyGenerator`
- **File:** `server.ts:201-201`  · **Review:** REVIEWED
- **Purpose:** Rate-limit key for the PDF limiter: authenticated uid, else IP, else 'anonymous'.
- **Parameters:** `req: express.Request`
- **Returns:** `string`
- **Dependencies:** none detected
- **Calls:** no in-repo callees resolved
- **Called By:** no in-repo caller resolved (entry point, event handler, route, or referenced by value)
- **Database Interaction:** None.
- **External Services:** None.
- **Authentication:** Reads `req.user` set earlier in the PDF route chain.
- **Authorization:** N/A.
- **Validation:** None.
- **Errors:** None.
- **Side Effects:** None.
- **Edge Cases:** —
- **Security Considerations:** Only limiter keyed per-user; all others key by IP.
- **Current Limitations:** —

### `escapeHtmlText`
- **File:** `server.ts:208-217`  · **Review:** REVIEWED
- **Purpose:** HTML-escapes a string (& < > " ') or substitutes a fallback when empty/non-string.
- **Parameters:** `value: unknown, fallback: string`
- **Returns:** `string`
- **Dependencies:** none detected
- **Calls:** no in-repo callees resolved
- **Called By:** `POST /api/pdf/generate [handler]` (server.ts:238)
- **Database Interaction:** None.
- **External Services:** None.
- **Authentication:** N/A.
- **Authorization:** N/A.
- **Validation:** Type and emptiness check.
- **Errors:** None.
- **Side Effects:** None.
- **Edge Cases:** Used only for the PDF `<title>`.
- **Security Considerations:** The PDF body (`htmlContent`) is NOT escaped (by design, it is raw HTML).
- **Current Limitations:** —

### `isAllowedPdfRequest`
- **File:** `server.ts:221-225`  · **Review:** REVIEWED
- **Purpose:** Allow-list for sub-requests made by the PDF renderer page.
- **Parameters:** `url: string`
- **Returns:** `boolean` — true for `data:`, fonts.googleapis.com, fonts.gstatic.com and cdn.tailwindcss.com URLs.
- **Dependencies:** none detected
- **Calls:** no in-repo callees resolved
- **Called By:** `POST /api/pdf/generate [handler]` (server.ts:238)
- **Database Interaction:** None.
- **External Services:** None.
- **Authentication:** N/A.
- **Authorization:** N/A.
- **Validation:** Prefix match.
- **Errors:** None.
- **Side Effects:** None.
- **Edge Cases:** `data:` documents are allowed.
- **Security Considerations:** Network egress from the renderer is limited to these prefixes; everything else (incl. file://) is aborted.
- **Current Limitations:** Scripts from cdn.tailwindcss.com execute inside the renderer.

### `POST /api/pdf/generate [inline middleware #1]`
- **File:** `server.ts:235-235`  · **Review:** REVIEWED
- **Purpose:** Runs `authenticateRequest` for the PDF route (route is mounted before the global auth chain).
- **Parameters:** `req, res, next`
- **Returns:** void
- **Dependencies:** none detected
- **Calls:** `authenticateRequest`
- **Called By:** no in-repo caller resolved (entry point, event handler, route, or referenced by value)
- **Database Interaction:** None.
- **External Services:** Firebase Admin token verification (via callee).
- **Authentication:** Bearer ID token required.
- **Authorization:** None here.
- **Validation:** —
- **Errors:** See `authenticateRequest`.
- **Side Effects:** Sets `req.user`.
- **Edge Cases:** `void` call — errors inside are not awaited by Express.
- **Security Considerations:** Fine functionally; note this route does NOT pass through `requireActiveSubscription` (suspended schools can still render PDFs).
- **Current Limitations:** —

### `POST /api/pdf/generate [inline middleware #2]`
- **File:** `server.ts:236-236`  · **Review:** REVIEWED
- **Purpose:** Runs `requireTenant` for the PDF route.
- **Parameters:** `req, res, next`
- **Returns:** void
- **Dependencies:** none detected
- **Calls:** `requireTenant`
- **Called By:** no in-repo caller resolved (entry point, event handler, route, or referenced by value)
- **Database Interaction:** None.
- **External Services:** None.
- **Authentication:** Requires `req.user` from middleware #1.
- **Authorization:** Tenant/domain match only; no role check.
- **Validation:** —
- **Errors:** 403 on tenant mismatch.
- **Side Effects:** —
- **Edge Cases:** —
- **Security Considerations:** Any authenticated role (parent, teacher, …) may call the PDF engine.
- **Current Limitations:** —

### `POST /api/pdf/generate [handler]`
- **File:** `server.ts:238-378`  · **Review:** REVIEWED
- **Purpose:** Renders caller-supplied HTML to an A4 RTL PDF with headless Chromium and returns it as base64 JSON.
- **Parameters:** Body `{ htmlContent: string (required), title?: string, filename?: string }`
- **Returns:** 200 `{ success, pdfBase64, filename, utf8Filename, size }`.
- **Dependencies:** none detected
- **Calls:** `getSystemChromePath`, `launchPdfBrowser`, `escapeHtmlText`, `isAllowedPdfRequest`
- **Called By:** no in-repo caller resolved (entry point, event handler, route, or referenced by value)
- **Database Interaction:** None.
- **External Services:** Chromium; allowed outbound hosts: fonts.googleapis.com, fonts.gstatic.com, cdn.tailwindcss.com.
- **Authentication:** Bearer ID token (middleware #1).
- **Authorization:** Tenant match only (middleware #2); no role restriction; no subscription check.
- **Validation:** Only `htmlContent` truthiness. No size cap beyond the 25 MB JSON body limit. Filename sanitised to `[a-zA-Z0-9.-]`.
- **Errors:** 400 missing htmlContent; 503 `PDF_ENGINE_BUSY` when ≥2 renders active; 500 generic on failure; browser closed in catch and `finally` decrements counter.
- **Side Effects:** Spawns Chromium; increments/decrements `activePdfRenders`.
- **Edge Cases:** Footer template is hard-coded Arabic text; fonts wait capped at 3 s; 20 s navigation timeout.
- **Security Considerations:** `htmlContent` is interpolated unescaped into a page that has JavaScript enabled and loads the Tailwind CDN script. Egress is allow-listed, but renderer-side script execution on attacker-controlled HTML is possible (SEC-05). Rate limit 10/min/uid; global concurrency 2 per process.
- **Current Limitations:** Concurrency counter is per process (not shared across serverless instances).

### `getDynamicTenantsPath`
- **File:** `server.ts:443-444`  · **Review:** REVIEWED
- **Purpose:** Resolves the dynamic-tenant JSON path (env `DYNAMIC_TENANTS_PATH` or `src/config/dynamicTenants.json`).
- **Parameters:** none
- **Returns:** `string`
- **Dependencies:** none detected
- **Calls:** no in-repo callees resolved
- **Called By:** `refreshDynamicTenants` (server.ts:474)
- **Database Interaction:** None.
- **External Services:** None.
- **Authentication:** N/A.
- **Authorization:** N/A.
- **Validation:** None.
- **Errors:** None.
- **Side Effects:** None.
- **Edge Cases:** —
- **Security Considerations:** —
- **Current Limitations:** —

### `refreshTenantDocs`
- **File:** `server.ts:455-473`  · **Review:** REVIEWED
- **Purpose:** Loads all `tenants` Firestore documents into the runtime registry, cached 30 s.
- **Parameters:** `force = false`
- **Returns:** `Promise<void>`
- **Dependencies:** admin, firestore
- **Calls:** `setRuntimeTenantDocs` (tenantRegistry)
- **Called By:** `getRequestHostTenant` (server.ts:490), `persistTenantSubscription` (server.ts:860), `GET /api/tenant/resolve [handler]` (server.ts:1824), `GET /api/tenants [handler]` (server.ts:1833), `POST /api/tenants/provision [handler]` (server.ts:1875)
- **Database Interaction:** READ `tenants` (whole collection) via Admin SDK.
- **External Services:** Firestore.
- **Authentication:** N/A (server internal).
- **Authorization:** N/A.
- **Validation:** None.
- **Errors:** Caught; logs `[TENANTS] Could not load…`; keeps previous cache.
- **Side Effects:** Mutates module-level cache and registry overlay.
- **Edge Cases:** Skips if Admin not ready or a load is in flight.
- **Security Considerations:** Reads full tenant docs including `subscription`.
- **Current Limitations:** Whole-collection read every 30 s on traffic; scales with tenant count.

### `refreshDynamicTenants`
- **File:** `server.ts:474-485`  · **Review:** REVIEWED
- **Purpose:** Re-reads `dynamicTenants.json` when its mtime changes and overlays it on the registry.
- **Parameters:** none
- **Returns:** void
- **Dependencies:** fs
- **Calls:** `setRuntimeDynamicTenants`
- **Called By:** `getRequestHostTenant` (server.ts:490), `GET /api/tenant/resolve [handler]` (server.ts:1824), `POST /api/tenants/provision [handler]` (server.ts:1875)
- **Database Interaction:** None.
- **External Services:** Filesystem (`statSync`, `readFileSync`).
- **Authentication:** N/A.
- **Authorization:** N/A.
- **Validation:** Array check on parsed JSON.
- **Errors:** Swallowed; keeps last registry.
- **Side Effects:** Updates module-level mtime and registry overlay.
- **Edge Cases:** One `stat()` per request.
- **Security Considerations:** —
- **Current Limitations:** Writable-FS assumption; read-only on Vercel.

### `getRequestHostTenant`
- **File:** `server.ts:490-496`  · **Review:** REVIEWED
- **Purpose:** Resolves the tenant for a request from Host (+ `?tenant=`).
- **Parameters:** `req`
- **Returns:** `TenantResolutionResult`
- **Dependencies:** none detected
- **Calls:** `refreshDynamicTenants`, `refreshTenantDocs`, `getRequestHostname`, `resolveTenantFromHostname`
- **Called By:** `authenticateRequest` (server.ts:638)
- **Database Interaction:** Indirect: triggers `refreshTenantDocs` (READ `tenants`).
- **External Services:** —
- **Authentication:** N/A.
- **Authorization:** N/A.
- **Validation:** —
- **Errors:** —
- **Side Effects:** Triggers background registry refresh.
- **Edge Cases:** `?tenant=` is honoured on every host.
- **Security Considerations:** `requireTenant` later enforces that a non-owner's claim tenant equals the resolved tenant.
- **Current Limitations:** —

### `generateTemporaryPassword`
- **File:** `server.ts:503-503`  · **Review:** REVIEWED
- **Purpose:** Generates a temporary password `Sm!<12 base64url chars>7` from `crypto.randomBytes(9)`.
- **Parameters:** none
- **Returns:** `string`
- **Dependencies:** crypto
- **Calls:** no in-repo callees resolved
- **Called By:** `upsertManagedAccount` (server.ts:517)
- **Database Interaction:** None.
- **External Services:** None.
- **Authentication:** N/A.
- **Authorization:** N/A.
- **Validation:** —
- **Errors:** —
- **Side Effects:** —
- **Edge Cases:** —
- **Security Considerations:** Adequate entropy (72 bits); returned in API responses in clear text.
- **Current Limitations:** No forced change at first login (UNKNOWN: Firebase-side flag not set in code).

### `accountOperationError`
- **File:** `server.ts:505-506`  · **Review:** REVIEWED
- **Purpose:** Creates an `Error` carrying a `statusCode` property.
- **Parameters:** `message: string, statusCode: number`
- **Returns:** `Error & { statusCode }`
- **Dependencies:** none detected
- **Calls:** no in-repo callees resolved
- **Called By:** `upsertManagedAccount` (server.ts:517)
- **Database Interaction:** None.
- **External Services:** None.
- **Authentication:** N/A.
- **Authorization:** N/A.
- **Validation:** —
- **Errors:** —
- **Side Effects:** —
- **Edge Cases:** —
- **Security Considerations:** —
- **Current Limitations:** —

### `upsertManagedAccount`
- **File:** `server.ts:517-617`  · **Review:** REVIEWED
- **Purpose:** Creates or refreshes a tenant member: Firebase Auth user, custom claims `{role, tenantId}`, and `users/{uid}` profile.
- **Parameters:** `input: { tenantId, email, name?, role, phone?, jobTitle?, status?, assignedClasses?, assignedSubjects?, password? }`, `options: { allowExisting?, resetPassword? }`
- **Returns:** `Promise<{ uid, password, created }>` — `password` is non-empty only when created or reset.
- **Dependencies:** admin, firestore
- **Calls:** `accountUpsertDenial`; Firebase Admin `getUserByEmail`/`updateUser`/`createUser`/`setCustomUserClaims`/`revokeRefreshTokens`
- **Called By:** `POST /api/tenants/provision [handler]` (server.ts:1875), `POST /api/users [handler]` (server.ts:2208)
- **Database Interaction:** READ `users/{uid}`, `admins/{uid}`; WRITE `users/{uid}` (merge).
- **External Services:** Firebase Auth Admin.
- **Authentication:** Callers are `requireRole`/`requirePlatformOwner` routes; function itself requires Admin readiness.
- **Authorization:** Refuses existing login unless `allowExisting`, refuses platform-owner/admins-doc accounts and other-tenant profiles (via `accountUpsertDenial`).
- **Validation:** Password ≥8 chars else generated.
- **Errors:** Throws if Admin not ready; denials thrown as `accountOperationError` (403 'protected' / 409 otherwise).
- **Side Effects:** Sets `emailVerified:true`; revokes tokens on reset or role/tenant change; writes profile.
- **Edge Cases:** Existing auth user with no profile is treated as role/tenant changed.
- **Security Considerations:** Marks every managed email `emailVerified: true` without any verification. Password supplied by caller is used as-is (≥8 chars, no complexity).
- **Current Limitations:** Not transactional across Auth + Firestore.

### `isPlatformOwner`
- **File:** `server.ts:622-622`  · **Review:** REVIEWED
- **Purpose:** True when the user has role claim `super_admin`.
- **Parameters:** `user: any`
- **Returns:** `boolean`
- **Dependencies:** none detected
- **Calls:** `isPlatformOwnerClaim`
- **Called By:** `requirePlatformOwner` (server.ts:736), `requireTenant` (server.ts:751), `resolveTargetTenantId` (server.ts:785), `requireActiveSubscription` (server.ts:896), `POST /api/notifications/dispatch [handler]` (server.ts:1497), `POST /api/users [handler]` (server.ts:2208), `DELETE /api/users/:uid [handler]` (server.ts:2347)
- **Database Interaction:** None.
- **External Services:** None.
- **Authentication:** N/A.
- **Authorization:** Defines the platform-owner privilege.
- **Validation:** —
- **Errors:** —
- **Side Effects:** —
- **Edge Cases:** Email-based owner fallback intentionally removed (comment in code).
- **Security Considerations:** Single source of truth is the custom claim.
- **Current Limitations:** —

### `resolveServerIdentity`
- **File:** `server.ts:624-636`  · **Review:** REVIEWED
- **Purpose:** Extracts `{role, tenantId}` from verified token claims.
- **Parameters:** `decoded: any`
- **Returns:** `{role, tenantId} | null`
- **Dependencies:** firestore
- **Calls:** no in-repo callees resolved
- **Called By:** `authenticateRequest` (server.ts:638)
- **Database Interaction:** None.
- **External Services:** None.
- **Authentication:** Consumes a verified token.
- **Authorization:** Role must be in {admin, registrar, teacher, parent, super_admin} and tenantId non-empty.
- **Validation:** Type + allow-list check.
- **Errors:** Returns null (caller → 403 NO_ROLE_ASSIGNED).
- **Side Effects:** —
- **Edge Cases:** Firestore profile deliberately ignored.
- **Security Considerations:** Good: avoids trusting self-created profiles. Consequence: Firestore rules (which DO trust the profile) and the API use different sources of truth (SEC-01).
- **Current Limitations:** —

### `authenticateRequest`
- **File:** `server.ts:638-718`  · **Review:** REVIEWED
- **Purpose:** Express middleware: tenant-domain gate + Bearer verification (Firebase ID token with revocation check, or explicit dev token).
- **Parameters:** `req, res, next`
- **Returns:** void (calls `next()` or sends 401/403/404/503)
- **Dependencies:** admin
- **Calls:** `isPublicRoute`, `getRequestHostTenant`, `resolveServerIdentity`, `admin.auth().verifyIdToken(token, true)`
- **Called By:** `POST /api/pdf/generate [inline middleware #1]` (server.ts:235)
- **Database Interaction:** None directly.
- **External Services:** Firebase Auth Admin.
- **Authentication:** Defines authentication.
- **Authorization:** Rejects unknown/inactive tenant domains.
- **Validation:** Requires `Authorization: Bearer …`.
- **Errors:** 404 UNKNOWN_TENANT_DOMAIN; 403 INACTIVE_TENANT_DOMAIN; 401 missing/invalid; 503 AUTH_NOT_CONFIGURED; 403 NO_ROLE_ASSIGNED.
- **Side Effects:** Sets `req.hostTenant`, `req.user`.
- **Edge Cases:** Dev bypass only when `ALLOW_DEV_AUTH==='true'` AND NODE_ENV!=='production' AND token equals APP_AUTH_TOKEN.
- **Security Considerations:** Revocation checked on every request (extra Auth round-trip). Public-route list is in `routeAuth.ts`.
- **Current Limitations:** —

### `requireRole`
- **File:** `server.ts:721-734`  · **Review:** REVIEWED
- **Purpose:** Middleware factory: allow listed roles; `super_admin` always passes.
- **Parameters:** `allowedRoles: string[]`
- **Returns:** middleware
- **Dependencies:** express
- **Calls:** no in-repo callees resolved
- **Called By:** no in-repo caller resolved (entry point, event handler, route, or referenced by value)
- **Database Interaction:** None.
- **External Services:** None.
- **Authentication:** Requires `req.user`.
- **Authorization:** Role allow-list + implicit super_admin.
- **Validation:** —
- **Errors:** 401 no user; 403 role not allowed (message echoes allowed roles).
- **Side Effects:** —
- **Edge Cases:** `admin` is not implicit — must be listed.
- **Security Considerations:** Error text discloses allowed roles (low).
- **Current Limitations:** —

### `requirePlatformOwner`
- **File:** `server.ts:736-748`  · **Review:** REVIEWED
- **Purpose:** Middleware: only `super_admin` claim.
- **Parameters:** `req,res,next`
- **Returns:** void
- **Dependencies:** none detected
- **Calls:** `isPlatformOwner`
- **Called By:** no in-repo caller resolved (entry point, event handler, route, or referenced by value)
- **Database Interaction:** None.
- **External Services:** None.
- **Authentication:** Requires `req.user`.
- **Authorization:** Platform owner only.
- **Validation:** —
- **Errors:** 401; 403 PLATFORM_OWNER_REQUIRED.
- **Side Effects:** —
- **Edge Cases:** —
- **Security Considerations:** —
- **Current Limitations:** —

### `requireTenant`
- **File:** `server.ts:751-775`  · **Review:** REVIEWED
- **Purpose:** Middleware: enforces (1) user tenant == host-resolved tenant, (2) body/query `tenantId` == user tenant; platform owner exempt.
- **Parameters:** `req,res,next`
- **Returns:** void
- **Dependencies:** none detected
- **Calls:** `isPlatformOwner`
- **Called By:** `POST /api/pdf/generate [inline middleware #2]` (server.ts:236)
- **Database Interaction:** None.
- **External Services:** None.
- **Authentication:** Uses `req.user`/`req.hostTenant` when present.
- **Authorization:** Tenant isolation.
- **Validation:** Compares strings exactly (case-sensitive).
- **Errors:** 403 TENANT_DOMAIN_MISMATCH; 403 multi-tenant violation.
- **Side Effects:** —
- **Edge Cases:** Does not inspect `?tenant=` (that is handled during host resolution) nor nested tenantIds in arrays/objects; `/api/notifications/dispatch` checks per-item tenantIds itself.
- **Security Considerations:** Runs as global middleware and again as route-level middleware (redundant). If `hostTenant` is absent (public routes) only the body check applies.
- **Current Limitations:** —

### `resolveTargetTenantId`
- **File:** `server.ts:785-799`  · **Review:** REVIEWED
- **Purpose:** Chooses the tenant a handler acts on: platform owner may override via body/query `tenantId`/`tenant` (pattern-checked); others use their claim tenant.
- **Parameters:** `req, fallback = DEFAULT_TENANT_ID`
- **Returns:** `string` lower-cased.
- **Dependencies:** none detected
- **Calls:** `isPlatformOwner`
- **Called By:** `POST /api/chat [handler]` (server.ts:1077), `POST /api/analyze-image [handler]` (server.ts:1182), `POST /api/daily-digest/generate-briefing [handler]` (server.ts:1299), `POST /api/daily-digest/dispatch [handler]` (server.ts:1405), `GET /api/tenant/ai-config [handler]` (server.ts:1667), `POST /api/tenant/ai-config [handler]` (server.ts:1683), `DELETE /api/tenant/ai-config [handler]` (server.ts:1707), `POST /api/tenant/ai-config/test [handler]` (server.ts:1725)
- **Database Interaction:** None.
- **External Services:** None.
- **Authentication:** Reads `req.user`.
- **Authorization:** Tenant scoping.
- **Validation:** `TENANT_ID_PATTERN` for owner override.
- **Errors:** —
- **Side Effects:** —
- **Edge Cases:** Falls back to host tenant then DEFAULT_TENANT_ID.
- **Security Considerations:** Core of server-side tenant isolation for handlers.
- **Current Limitations:** —

### `setTenantSubscriptionCache`
- **File:** `server.ts:801-803`  · **Review:** REVIEWED
- **Purpose:** Stores a subscription in the 15 s in-memory cache.
- **Parameters:** `tenantId, sub`
- **Returns:** void
- **Dependencies:** none detected
- **Calls:** no in-repo callees resolved
- **Called By:** `loadTenantSubscription` (server.ts:805), `persistTenantSubscription` (server.ts:860)
- **Database Interaction:** None.
- **External Services:** —
- **Authentication:** N/A.
- **Authorization:** N/A.
- **Validation:** —
- **Errors:** —
- **Side Effects:** Mutates `TENANT_SUB_CACHE`.
- **Edge Cases:** —
- **Security Considerations:** —
- **Current Limitations:** Per-process cache: after suspend, other instances keep serving up to 15 s.

### `loadTenantSubscription`
- **File:** `server.ts:805-818`  · **Review:** REVIEWED
- **Purpose:** Loads the tenant subscription (cache → Firestore → default).
- **Parameters:** `tenantId: string`
- **Returns:** `Promise<TenantSubscription>`
- **Dependencies:** admin, firestore
- **Calls:** `normalizeSubscription`, `defaultSubscription`, `setTenantSubscriptionCache`
- **Called By:** `requireActiveSubscription` (server.ts:896), `GET /api/tenants/:tenantId/subscription [handler]` (server.ts:2078), `POST /api/tenants/:tenantId/subscription/suspend [handler]` (server.ts:2091), `POST /api/tenants/:tenantId/subscription/reactivate [handler]` (server.ts:2114), `POST /api/tenants/:tenantId/subscription/renew [handler]` (server.ts:2132), `PATCH /api/tenants/:tenantId/subscription [handler]` (server.ts:2163)
- **Database Interaction:** READ `tenants/{tenantId}`.
- **External Services:** Firestore.
- **Authentication:** N/A.
- **Authorization:** N/A.
- **Validation:** Normalised by `normalizeSubscription`.
- **Errors:** Caught; returns stale cache or default (fail-open).
- **Side Effects:** Updates cache.
- **Edge Cases:** Admin not ready ⇒ default (active).
- **Security Considerations:** Fail-open: Firestore errors or missing Admin grant access.
- **Current Limitations:** —

### `writeSubscriptionAudit`
- **File:** `server.ts:820-842`  · **Review:** REVIEWED
- **Purpose:** Appends an `audit_logs` entry for a subscription action.
- **Parameters:** `tenantId, actor, entry`
- **Returns:** `Promise<void>`
- **Dependencies:** admin, firestore
- **Calls:** no in-repo callees resolved
- **Called By:** `persistTenantSubscription` (server.ts:860)
- **Database Interaction:** WRITE `audit_logs/{autoId}` (Admin SDK).
- **External Services:** Firestore.
- **Authentication:** N/A.
- **Authorization:** N/A.
- **Validation:** —
- **Errors:** Caught and warned; never throws.
- **Side Effects:** —
- **Edge Cases:** Skipped when Admin not ready.
- **Security Considerations:** Audit failure does not block the change.
- **Current Limitations:** Entry lacks `performerRole` field present in the client AuditLog type.

### `stripUndefinedDeep`
- **File:** `server.ts:846-858`  · **Review:** REVIEWED
- **Purpose:** Recursively removes `undefined` keys from plain objects/arrays (Firestore rejects them).
- **Parameters:** `value: T`
- **Returns:** `T`
- **Dependencies:** none detected
- **Calls:** no in-repo callees resolved
- **Called By:** `persistTenantSubscription` (server.ts:860)
- **Database Interaction:** None.
- **External Services:** —
- **Authentication:** N/A.
- **Authorization:** N/A.
- **Validation:** —
- **Errors:** —
- **Side Effects:** —
- **Edge Cases:** Only plain objects are traversed.
- **Security Considerations:** —
- **Current Limitations:** —

### `persistTenantSubscription`
- **File:** `server.ts:860-891`  · **Review:** REVIEWED
- **Purpose:** Writes a subscription to `tenants/{id}` (seeding static tenants first), refreshes caches, audits.
- **Parameters:** `tenantId, subscription, actor, audit`
- **Returns:** `Promise<void>`
- **Dependencies:** admin, firestore
- **Calls:** `stripUndefinedDeep`, `setTenantSubscriptionCache`, `refreshTenantDocs`, `writeSubscriptionAudit`
- **Called By:** `POST /api/tenants/:tenantId/subscription/suspend [handler]` (server.ts:2091), `POST /api/tenants/:tenantId/subscription/reactivate [handler]` (server.ts:2114), `POST /api/tenants/:tenantId/subscription/renew [handler]` (server.ts:2132), `PATCH /api/tenants/:tenantId/subscription [handler]` (server.ts:2163)
- **Database Interaction:** READ + WRITE `tenants/{tenantId}` (merge); WRITE `audit_logs`.
- **External Services:** Firestore.
- **Authentication:** Callers are platform-owner routes.
- **Authorization:** —
- **Validation:** —
- **Errors:** Throws if Admin not ready.
- **Side Effects:** Resets `tenantDocsLoadedAt`.
- **Edge Cases:** Seeds from static registry if doc missing.
- **Security Considerations:** —
- **Current Limitations:** —

### `requireActiveSubscription`
- **File:** `server.ts:896-921`  · **Review:** REVIEWED
- **Purpose:** Global middleware: blocks non-owner users whose school subscription is not enabled (HTTP 402).
- **Parameters:** `req,res,next`
- **Returns:** void
- **Dependencies:** none detected
- **Calls:** `isPublicRoute`, `loadTenantSubscription`, `evaluateSubscription`
- **Called By:** no in-repo caller resolved (entry point, event handler, route, or referenced by value)
- **Database Interaction:** READ `tenants/{id}` (cached).
- **External Services:** —
- **Authentication:** Needs `req.user`.
- **Authorization:** Subscription gate; platform owner bypass.
- **Validation:** —
- **Errors:** 402 SUBSCRIPTION_SUSPENDED / SUBSCRIPTION_EXPIRED.
- **Side Effects:** —
- **Edge Cases:** No tenantId ⇒ pass.
- **Security Considerations:** Not applied to `/api/pdf/generate` (mounted earlier).
- **Current Limitations:** Plan limits (`maxStudents`, `maxUsers`) are never enforced here or elsewhere.

### `sanitizeText`
- **File:** `server.ts:984-987`  · **Review:** REVIEWED
- **Purpose:** Returns trimmed string truncated to 4000 chars, else fallback.
- **Parameters:** `value: unknown, fallback = ''`
- **Returns:** `string`
- **Dependencies:** none detected
- **Calls:** no in-repo callees resolved
- **Called By:** `POST /api/chat [handler]` (server.ts:1077), `POST /api/analyze-image [handler]` (server.ts:1182), `POST /api/daily-digest/generate-briefing [handler]` (server.ts:1299), `POST /api/daily-digest/dispatch [handler]` (server.ts:1405), `POST /api/notifications/dispatch [handler]` (server.ts:1497)
- **Database Interaction:** None.
- **External Services:** —
- **Authentication:** N/A.
- **Authorization:** N/A.
- **Validation:** Type + length.
- **Errors:** —
- **Side Effects:** —
- **Edge Cases:** Does not strip control characters or prompt-injection text.
- **Security Considerations:** Used for AI prompt inputs.
- **Current Limitations:** —

### `ensureJsonObject`
- **File:** `server.ts:989-994`  · **Review:** REVIEWED
- **Purpose:** Returns value if plain object else fallback.
- **Parameters:** `value, fallback = {}`
- **Returns:** object
- **Dependencies:** none detected
- **Calls:** no in-repo callees resolved
- **Called By:** no in-repo caller resolved (entry point, event handler, route, or referenced by value)
- **Database Interaction:** None.
- **External Services:** —
- **Authentication:** N/A.
- **Authorization:** N/A.
- **Validation:** —
- **Errors:** —
- **Side Effects:** —
- **Edge Cases:** —
- **Security Considerations:** —
- **Current Limitations:** Defined but no call site found in server.ts (dead code).

### `loadMessagingGatewayConfig`
- **File:** `server.ts:1000-1014`  · **Review:** REVIEWED
- **Purpose:** Loads the tenant's messaging gateway config.
- **Parameters:** `tenantId`
- **Returns:** `Promise<SchoolMessagingGatewayConfig | null>`
- **Dependencies:** admin, firestore
- **Calls:** no in-repo callees resolved
- **Called By:** `POST /api/daily-digest/dispatch [handler]` (server.ts:1405), `POST /api/notifications/dispatch [handler]` (server.ts:1497)
- **Database Interaction:** READ `settings_private/{tenantId}`.
- **External Services:** Firestore.
- **Authentication:** N/A.
- **Authorization:** Server reads regardless of caller role (callers are role-gated).
- **Validation:** Object check only.
- **Errors:** Caught ⇒ null (fail closed: callers answer 503).
- **Side Effects:** —
- **Edge Cases:** —
- **Security Considerations:** Gateway secrets are stored in plaintext in this document (SEC-08).
- **Current Limitations:** —

### `getGenAIClientForTenant`
- **File:** `server.ts:1017-1045`  · **Review:** REVIEWED
- **Purpose:** Selects the Gemini client: tenant key → system `GEMINI_API_KEY` → none.
- **Parameters:** `tenantId?`
- **Returns:** `{ client, keySource: 'tenant'|'system'|'none' }`
- **Dependencies:** GoogleGenAI
- **Calls:** `getTenantApiKey`
- **Called By:** `callGeminiWithFallback` (server.ts:1048), `POST /api/owner/holidays/search [handler]` (server.ts:2382)
- **Database Interaction:** None (in-memory secrets cache).
- **External Services:** Constructs `GoogleGenAI`.
- **Authentication:** N/A.
- **Authorization:** N/A.
- **Validation:** Ignores placeholder 'your-gemini-key-here'.
- **Errors:** Decrypt failures ⇒ null key ⇒ falls to system key.
- **Side Effects:** Creates a client per call.
- **Edge Cases:** Silent fallback from tenant to system key.
- **Security Considerations:** A tenant with a broken/rotated key silently consumes the platform key.
- **Current Limitations:** —

### `callGeminiWithFallback`
- **File:** `server.ts:1048-1074`  · **Review:** REVIEWED
- **Purpose:** Tries models in order until one returns text.
- **Parameters:** `modelCandidates: string[], promptPayload: any, tenantId?`
- **Returns:** `{ text, modelUsed, keySource } | null`
- **Dependencies:** none detected
- **Calls:** `getGenAIClientForTenant`
- **Called By:** `POST /api/chat [handler]` (server.ts:1077), `POST /api/analyze-image [handler]` (server.ts:1182), `POST /api/daily-digest/generate-briefing [handler]` (server.ts:1299)
- **Database Interaction:** None.
- **External Services:** Google Gemini `models.generateContent`.
- **Authentication:** N/A.
- **Authorization:** N/A.
- **Validation:** —
- **Errors:** Per-model errors logged and skipped; returns null if all fail.
- **Side Effects:** Network calls; logs.
- **Edge Cases:** Model IDs (`gemini-3.5-flash`, `3.7`, `3.8`, `3.1-pro-preview`) are taken from code — UNKNOWN whether all exist.
- **Security Considerations:** —
- **Current Limitations:** `preferredModel` stored per tenant is never consulted.

### `POST /api/chat [handler]`
- **File:** `server.ts:1077-1179`  · **Review:** REVIEWED
- **Purpose:** Multi-turn Gemini chat with a role-specific Arabic system prompt.
- **Parameters:** Body `{ messages: {role, content}[] (required, ≤20 used), role?: 'counselor'|'teacher_fast'|'policy_analyst', modelPreference?: string }`
- **Returns:** 200 `{ reply, modelUsed, keySource }`.
- **Dependencies:** none detected
- **Calls:** `sanitizeText`, `resolveTargetTenantId`, `callGeminiWithFallback`
- **Called By:** no in-repo caller resolved (entry point, event handler, route, or referenced by value)
- **Database Interaction:** None.
- **External Services:** Gemini.
- **Authentication:** Bearer token.
- **Authorization:** `requireRole(['admin','registrar','super_admin'])`; 20 req/min per IP limiter.
- **Validation:** Array check; each message trimmed ≤4000 chars; empty filtered.
- **Errors:** 400; 503 AI_UNAVAILABLE; 502 AI_ERROR.
- **Side Effects:** Consumes tenant/system AI quota.
- **Edge Cases:** Unknown `role` ⇒ generic system prompt; `modelPreference` 'gemini-3.1-flash-lite' maps to 'gemini-3.5-flash-lite'.
- **Security Considerations:** Client-supplied `role` strings are passed through `sanitizeText` and may be 'user'/'assistant' only effectively. Conversation content is user-controlled (prompt injection affects only that user's own chat).
- **Current Limitations:** No per-tenant usage cap.

### `POST /api/analyze-image [handler]`
- **File:** `server.ts:1182-1296`  · **Review:** REVIEWED
- **Purpose:** Sends an uploaded medical-excuse image/PDF to Gemini and returns structured JSON analysis.
- **Parameters:** Body `{ imageBase64 (required), mimeType?, expectedStudentName?, expectedAbsenceDate?, studentGrade?, promptCustom? }`
- **Returns:** 200 `{ analysis, rawText, modelUsed }`.
- **Dependencies:** none detected
- **Calls:** `sanitizeText`, `resolveTargetTenantId`, `callGeminiWithFallback`
- **Called By:** no in-repo caller resolved (entry point, event handler, route, or referenced by value)
- **Database Interaction:** None.
- **External Services:** Gemini (inline image data).
- **Authentication:** Bearer token.
- **Authorization:** NONE beyond authentication + tenant + subscription (no `requireRole`); 10 req/min per IP.
- **Validation:** MIME allow-list (jpeg/png/webp/pdf); data-URL prefix stripped; length 100…7 MiB base64; magic-byte check of first bytes.
- **Errors:** 400/413 validation; 503 AI_UNAVAILABLE; 500 generic.
- **Side Effects:** AI quota use.
- **Edge Cases:** If model output is not JSON, regex `{…}` is parsed with a second unguarded `JSON.parse` — can throw into the outer catch ⇒ 500.
- **Security Considerations:** Any authenticated role (incl. parent/teacher) can invoke the paid AI call (SEC-04). `promptCustom` is appended to the prompt (prompt injection of the caller's own request only). Student data sent to a third party.
- **Current Limitations:** Error text says 5 MB; limit constant is 7 MiB of base64.

### `POST /api/daily-digest/generate-briefing [handler]`
- **File:** `server.ts:1299-1402`  · **Review:** REVIEWED
- **Purpose:** Asks Gemini for a JSON executive morning briefing built from client-supplied statistics.
- **Parameters:** Body `{ tenantName?, date?, overallAttendanceRate?, totalStudents?, anomalies?[], pendingJustificationsCount?, pendingIrregularCount?, highRiskStudents?[] }` (all optional; hard-coded sample defaults e.g. 94.5, 120, 'مدرسة الأندلس النموذجية').
- **Returns:** 200 `{ success, briefing, modelUsed }`.
- **Dependencies:** none detected
- **Calls:** `sanitizeText`, `resolveTargetTenantId`, `callGeminiWithFallback`
- **Called By:** no in-repo caller resolved (entry point, event handler, route, or referenced by value)
- **Database Interaction:** None.
- **External Services:** Gemini.
- **Authentication:** Bearer.
- **Authorization:** `requireRole(['admin','registrar'])`; 10 req/min per IP.
- **Validation:** Numbers coerced with `Number()`; strings via `sanitizeText`; `severity` interpolated unsanitised.
- **Errors:** 503 AI_UNAVAILABLE; 502 AI_INVALID_RESPONSE; 503 on exception.
- **Side Effects:** AI quota.
- **Edge Cases:** Omitted fields silently use fabricated defaults (94.5%, 120 students).
- **Security Considerations:** `a.severity` is inserted into the prompt without sanitisation (prompt injection, low impact).
- **Current Limitations:** Statistics come from the client, the server does not verify them.

### `POST /api/daily-digest/dispatch [handler]`
- **File:** `server.ts:1405-1485`  · **Review:** REVIEWED
- **Purpose:** Emails the digest HTML to up to 50 recipients through the school's configured email gateway.
- **Parameters:** Body `{ recipients: string[], subject?, htmlContent (required), scheduledTime? }`
- **Returns:** 200 `{ success, dispatchId, dispatchedAt, scheduledTime, recipientsCount, recipients, subject, status:'delivered', provider, receiptId, message }`.
- **Dependencies:** none detected
- **Calls:** `resolveTargetTenantId`, `loadMessagingGatewayConfig`, `sendEmail`
- **Called By:** no in-repo caller resolved (entry point, event handler, route, or referenced by value)
- **Database Interaction:** READ `settings_private/{tenant}`.
- **External Services:** SMTP / Resend / SendGrid.
- **Authentication:** Bearer.
- **Authorization:** `requireRole(['admin','registrar'])`; 10/min/IP.
- **Validation:** Recipients: strings containing '@', max 50; body ≤200 000 chars; subject ≤4000.
- **Errors:** 400; 503 EMAIL_NOT_CONFIGURED; 502 EMAIL_DISPATCH_FAILED; 500.
- **Side Effects:** Sends real email; returns recipients list.
- **Edge Cases:** `status` is always 'delivered' on provider success.
- **Security Considerations:** Recipients are not restricted to school addresses, and HTML is arbitrary: an admin/registrar can use the school's mail identity to send arbitrary HTML to arbitrary addresses (SEC-09).
- **Current Limitations:** `dispatchId` is `Date.now()` based, not persisted.

### `POST /api/notifications/dispatch [handler]`
- **File:** `server.ts:1497-1662`  · **Review:** REVIEWED
- **Purpose:** Sends up to 200 SMS / WhatsApp Cloud messages via the school's gateway and records results on `notification_outbox`.
- **Parameters:** Body `{ notifications: {id, recipientPhone, messageText, channel?, tenantId?}[], channel?: 'SMS'|'WhatsApp', tenantId? }`
- **Returns:** 200 `{ success, gatewayConfigured, dispatched, failed, manual, receipts[], results[] }`.
- **Dependencies:** admin, firestore
- **Calls:** `loadMessagingGatewayConfig`, `sendSms`, `sendWhatsAppCloudMessage`
- **Called By:** no in-repo caller resolved (entry point, event handler, route, or referenced by value)
- **Database Interaction:** READ `settings_private/{tenant}`; READ + batch WRITE `notification_outbox/{id}` (only when stored `tenantId` matches).
- **External Services:** Twilio / Unifonic / Msegat / Taqnyat / WhatsApp Cloud API.
- **Authentication:** Bearer.
- **Authorization:** `requireRole(['admin','registrar','super_admin'])` + per-item tenant check; 60/min/IP.
- **Validation:** Tenant pattern for owner override; per-item `id`, phone and text required; items beyond 200 ignored.
- **Errors:** 400; 403 cross-tenant; 503 GATEWAY_NOT_CONFIGURED; per-item failures reported in `results`.
- **Side Effects:** Real messages sent; outbox docs updated with `retryCount+1`.
- **Edge Cases:** WhatsApp in `web_direct` mode returns status 'manual' (not sent). Results for ids missing from the outbox are still reported as 'sent'.
- **Security Considerations:** Recipient phone and text come from the request body, not from the stored outbox entry: an admin/registrar can message any number through the school's gateway (SEC-09). Items lacking `tenantId` bypass the per-item tenant check (outbox write is still tenant-checked).
- **Current Limitations:** Sequential sends with per-item Firestore reads (slow for 200 items).

### `GET /api/tenant/ai-config [handler]`
- **File:** `server.ts:1667-1680`  · **Review:** REVIEWED
- **Purpose:** Returns masked AI-key metadata for the tenant.
- **Parameters:** none
- **Returns:** 200 `{ success, config:{tenantId,hasCustomKey,maskedKey,updatedAt?,preferredModel}, systemHasFallbackKey }`
- **Dependencies:** none detected
- **Calls:** `getTenantAIConfig`, `resolveTargetTenantId`
- **Called By:** no in-repo caller resolved (entry point, event handler, route, or referenced by value)
- **Database Interaction:** None (in-memory cache).
- **External Services:** —
- **Authentication:** Bearer.
- **Authorization:** `requireRole(['admin'])` (+ implicit super_admin).
- **Validation:** —
- **Errors:** 500.
- **Side Effects:** —
- **Edge Cases:** —
- **Security Considerations:** Masked key shows first 7 and last 4 characters.
- **Current Limitations:** Registrar cannot view.

### `POST /api/tenant/ai-config [handler]`
- **File:** `server.ts:1683-1704`  · **Review:** REVIEWED
- **Purpose:** Stores the tenant Gemini key encrypted (AES-256-GCM).
- **Parameters:** Body `{ apiKey: string (≥8), preferredModel?: string }`
- **Returns:** 200 `{ success, message, config }`.
- **Dependencies:** none detected
- **Calls:** `setTenantApiKey`
- **Called By:** no in-repo caller resolved (entry point, event handler, route, or referenced by value)
- **Database Interaction:** WRITE `tenant_ai_secrets/{tenantId}` (via durable store, fire-and-forget) or local file.
- **External Services:** —
- **Authentication:** Bearer.
- **Authorization:** Admin.
- **Validation:** Length ≥ 8 only.
- **Errors:** 400 Arabic message; 500.
- **Side Effects:** Writes secrets store.
- **Edge Cases:** Success returned before the asynchronous Firestore write completes.
- **Security Considerations:** No format validation of the key; `preferredModel` is stored unvalidated (and never used).
- **Current Limitations:** Durable write errors are only logged.

### `DELETE /api/tenant/ai-config [handler]`
- **File:** `server.ts:1707-1722`  · **Review:** REVIEWED
- **Purpose:** Removes the tenant's custom key.
- **Parameters:** none
- **Returns:** 200 `{ success, message, config }`
- **Dependencies:** none detected
- **Calls:** `removeTenantApiKey`, `getTenantAIConfig`
- **Called By:** no in-repo caller resolved (entry point, event handler, route, or referenced by value)
- **Database Interaction:** DELETE `tenant_ai_secrets/{tenantId}` (fire-and-forget).
- **External Services:** —
- **Authentication:** Bearer.
- **Authorization:** Admin.
- **Validation:** —
- **Errors:** 500.
- **Side Effects:** —
- **Edge Cases:** Returns success even if no key existed.
- **Security Considerations:** —
- **Current Limitations:** —

### `POST /api/tenant/ai-config/test [handler]`
- **File:** `server.ts:1725-1783`  · **Review:** REVIEWED
- **Purpose:** Verifies a candidate/stored/system Gemini key by making a test generation.
- **Parameters:** Body `{ testKey?: string (>8 chars) }`
- **Returns:** 200 `{ success, status:'verified', activeModel, maskedKey, message }`; 400 failure.
- **Dependencies:** GoogleGenAI
- **Calls:** `getTenantApiKey`, `maskApiKey`
- **Called By:** no in-repo caller resolved (entry point, event handler, route, or referenced by value)
- **Database Interaction:** None.
- **External Services:** Gemini.
- **Authentication:** Bearer.
- **Authorization:** Admin.
- **Validation:** `testKey` length only.
- **Errors:** 400 no key / verification failed (includes provider error `details`); 500.
- **Side Effects:** Consumes quota.
- **Edge Cases:** Falls back to the tenant key, then the SYSTEM key if no `testKey`.
- **Security Considerations:** Provider error message returned to client (may leak provider detail). Not covered by a dedicated rate limiter.
- **Current Limitations:** —

### `GET /api/health [handler]`
- **File:** `server.ts:1785-1814`  · **Review:** REVIEWED
- **Purpose:** Public liveness/status report.
- **Parameters:** none
- **Returns:** 200 `{ status, appName, timestamp, uptime, nodeVersion, memoryUsageMB, services:{aiGemini,pdfPuppeteer,firebaseAdmin,firebaseAdminInitialized,adminKeyLoaded,dynamicTenantsCount} }`
- **Dependencies:** fs
- **Calls:** `getSystemChromePath`
- **Called By:** no in-repo caller resolved (entry point, event handler, route, or referenced by value)
- **Database Interaction:** None.
- **External Services:** Filesystem.
- **Authentication:** Public.
- **Authorization:** None.
- **Validation:** —
- **Errors:** —
- **Side Effects:** Reads `dynamicTenants.json` each call.
- **Edge Cases:** —
- **Security Considerations:** Unauthenticated disclosure of Node version, memory, and which secrets/services are configured (SEC-11).
- **Current Limitations:** —

### `GET /api/readyz [handler]`
- **File:** `server.ts:1816-1822`  · **Review:** REVIEWED
- **Purpose:** Readiness probe.
- **Parameters:** none
- **Returns:** 200 `{ status:'ready', timestamp, requiresAuth }`
- **Dependencies:** none detected
- **Calls:** no in-repo callees resolved
- **Called By:** no in-repo caller resolved (entry point, event handler, route, or referenced by value)
- **Database Interaction:** None.
- **External Services:** —
- **Authentication:** Public.
- **Authorization:** None.
- **Validation:** —
- **Errors:** —
- **Side Effects:** —
- **Edge Cases:** Always 'ready' (does not check dependencies).
- **Security Considerations:** —
- **Current Limitations:** Not a true readiness check.

### `GET /api/tenant/resolve [handler]`
- **File:** `server.ts:1824-1831`  · **Review:** REVIEWED
- **Purpose:** Public tenant resolution for the current host.
- **Parameters:** Query `?tenant=`
- **Returns:** `TenantResolutionResult` JSON `{status, tenantId?, config?, normalizedHostname}`
- **Dependencies:** none detected
- **Calls:** `refreshDynamicTenants`, `refreshTenantDocs`, `getRequestHostname`, `resolveTenantFromHostname`
- **Called By:** no in-repo caller resolved (entry point, event handler, route, or referenced by value)
- **Database Interaction:** READ `tenants` (cached).
- **External Services:** —
- **Authentication:** Public.
- **Authorization:** None.
- **Validation:** —
- **Errors:** —
- **Side Effects:** —
- **Edge Cases:** —
- **Security Considerations:** Returns the full tenant config (branding, domains, subscription) to anonymous callers.
- **Current Limitations:** —

### `GET /api/tenants [handler]`
- **File:** `server.ts:1833-1873`  · **Review:** REVIEWED
- **Purpose:** Public list of all schools (id, subdomain, domains, names, colour, active flag, subscription summary).
- **Parameters:** none
- **Returns:** 200 `{ success, count, tenants[] }`
- **Dependencies:** none detected
- **Calls:** `refreshTenantDocs`, `getActiveTenantRegistry`, `normalizeSubscription`, `evaluateSubscription`
- **Called By:** no in-repo caller resolved (entry point, event handler, route, or referenced by value)
- **Database Interaction:** READ `tenants`.
- **External Services:** —
- **Authentication:** Public.
- **Authorization:** None.
- **Validation:** Field-wise type/length trimming.
- **Errors:** 500.
- **Side Effects:** —
- **Edge Cases:** —
- **Security Considerations:** Anonymous enumeration of every school and its subscription status/ days remaining (SEC-10). `firestore.rules` also allows public read of `tenants`.
- **Current Limitations:** —

### `POST /api/tenants/provision [handler]`
- **File:** `server.ts:1875-2037`  · **Review:** REVIEWED
- **Purpose:** Creates/updates a school (registry JSON, Firestore `tenants`, initial `settings`) and optionally creates its principal login.
- **Parameters:** Body `{ tenantId, subdomain, nameAr (required); nameEn?, code?, cityAr?, cityEn?, academicYear?, currentTerm?, schoolType?, primaryColor?, logoText?, isActive?, customDomains?[], principal?:{email,name?,phone?,password?}, schoolProfile?, settings? }`
- **Returns:** 200 `{ success, tenant, principal?:{uid,email,temporaryPassword} }`.
- **Dependencies:** admin, firestore, fs
- **Calls:** `upsertManagedAccount`, `refreshDynamicTenants`, `refreshTenantDocs`
- **Called By:** no in-repo caller resolved (entry point, event handler, route, or referenced by value)
- **Database Interaction:** READ/WRITE `tenants/{id}`; WRITE `settings/{id}`; WRITE `users/{uid}`; Auth user.
- **External Services:** Firebase Auth; local file `dynamicTenants.json`.
- **Authentication:** Bearer.
- **Authorization:** Platform owner only.
- **Validation:** Slug/host regex; email regex; colour regex; strings truncated; `settings`/`schoolProfile` written as-is.
- **Errors:** 400; 403/409 from account denial; 502; 500.
- **Side Effects:** Writes `src/config/dynamicTenants.json` on disk (best-effort); resets principal password when principal exists.
- **Edge Cases:** Existing school keeps its subscription; `isActive` retained unless provided.
- **Security Considerations:** Principal temporary password returned in the response. `payload.settings` / `schoolProfile` are written without schema validation.
- **Current Limitations:** Mutates a tracked repo file at runtime (`dynamicTenants.json`).

### `resolveSubscriptionTenantId`
- **File:** `server.ts:2042-2049`  · **Review:** REVIEWED
- **Purpose:** Validates `:tenantId` route param.
- **Parameters:** `req, res`
- **Returns:** `string | null` (sends 400 when invalid)
- **Dependencies:** none detected
- **Calls:** no in-repo callees resolved
- **Called By:** `GET /api/tenants/:tenantId/subscription [handler]` (server.ts:2078), `POST /api/tenants/:tenantId/subscription/suspend [handler]` (server.ts:2091), `POST /api/tenants/:tenantId/subscription/reactivate [handler]` (server.ts:2114), `POST /api/tenants/:tenantId/subscription/renew [handler]` (server.ts:2132), `PATCH /api/tenants/:tenantId/subscription [handler]` (server.ts:2163)
- **Database Interaction:** None.
- **External Services:** —
- **Authentication:** N/A.
- **Authorization:** N/A.
- **Validation:** `TENANT_ID_PATTERN`.
- **Errors:** 400.
- **Side Effects:** Writes response on failure.
- **Edge Cases:** —
- **Security Considerations:** —
- **Current Limitations:** —

### `subscriptionActor`
- **File:** `server.ts:2051-2054`  · **Review:** REVIEWED
- **Purpose:** Extracts `{uid,email}` of the caller.
- **Parameters:** `req`
- **Returns:** object
- **Dependencies:** none detected
- **Calls:** no in-repo callees resolved
- **Called By:** `POST /api/tenants/:tenantId/subscription/suspend [handler]` (server.ts:2091), `POST /api/tenants/:tenantId/subscription/reactivate [handler]` (server.ts:2114), `POST /api/tenants/:tenantId/subscription/renew [handler]` (server.ts:2132), `PATCH /api/tenants/:tenantId/subscription [handler]` (server.ts:2163)
- **Database Interaction:** None.
- **External Services:** —
- **Authentication:** N/A.
- **Authorization:** N/A.
- **Validation:** —
- **Errors:** —
- **Side Effects:** —
- **Edge Cases:** —
- **Security Considerations:** —
- **Current Limitations:** —

### `subscriptionSummary`
- **File:** `server.ts:2056-2076`  · **Review:** REVIEWED
- **Purpose:** Builds the API summary object from a subscription.
- **Parameters:** `sub: TenantSubscription`
- **Returns:** object
- **Dependencies:** none detected
- **Calls:** `evaluateSubscription`
- **Called By:** `GET /api/tenants/:tenantId/subscription [handler]` (server.ts:2078), `POST /api/tenants/:tenantId/subscription/suspend [handler]` (server.ts:2091), `POST /api/tenants/:tenantId/subscription/reactivate [handler]` (server.ts:2114), `POST /api/tenants/:tenantId/subscription/renew [handler]` (server.ts:2132), `PATCH /api/tenants/:tenantId/subscription [handler]` (server.ts:2163)
- **Database Interaction:** None.
- **External Services:** —
- **Authentication:** N/A.
- **Authorization:** N/A.
- **Validation:** —
- **Errors:** —
- **Side Effects:** —
- **Edge Cases:** —
- **Security Considerations:** —
- **Current Limitations:** —

### `GET /api/tenants/:tenantId/subscription [handler]`
- **File:** `server.ts:2078-2089`  · **Review:** REVIEWED
- **Purpose:** Reads a school subscription + summary.
- **Parameters:** Path `tenantId`; body per purpose.
- **Returns:** 200 `{ success, tenantId, subscription, summary }`
- **Dependencies:** none detected
- **Calls:** `resolveSubscriptionTenantId`, `loadTenantSubscription`, `persistTenantSubscription`, `subscriptionSummary`
- **Called By:** no in-repo caller resolved (entry point, event handler, route, or referenced by value)
- **Database Interaction:** READ/WRITE `tenants/{id}`; WRITE `audit_logs`.
- **External Services:** Firestore.
- **Authentication:** Bearer.
- **Authorization:** Platform owner only.
- **Validation:** Tenant pattern; type checks per field. PATCH accepts any string for `currentPeriodEnd` (an unparsable string means 'never expires').
- **Errors:** 400 invalid tenantId; 500 with generic message.
- **Side Effects:** Cache invalidation; audit entry.
- **Edge Cases:** Changes propagate to other instances within 15 s (cache TTL).
- **Security Considerations:** Owner-only. Limits (`maxStudents`,`maxUsers`) can be set but are never enforced.
- **Current Limitations:** —

### `POST /api/tenants/:tenantId/subscription/suspend [handler]`
- **File:** `server.ts:2091-2112`  · **Review:** REVIEWED
- **Purpose:** Suspends a school (`manuallySuspended=true`, optional reason ≤300 chars).
- **Parameters:** Path `tenantId`; body per purpose.
- **Returns:** 200 `{ success, tenantId, subscription, summary }`
- **Dependencies:** none detected
- **Calls:** `resolveSubscriptionTenantId`, `loadTenantSubscription`, `persistTenantSubscription`, `subscriptionSummary`
- **Called By:** no in-repo caller resolved (entry point, event handler, route, or referenced by value)
- **Database Interaction:** READ/WRITE `tenants/{id}`; WRITE `audit_logs`.
- **External Services:** Firestore.
- **Authentication:** Bearer.
- **Authorization:** Platform owner only.
- **Validation:** Tenant pattern; type checks per field. PATCH accepts any string for `currentPeriodEnd` (an unparsable string means 'never expires').
- **Errors:** 400 invalid tenantId; 500 with generic message.
- **Side Effects:** Cache invalidation; audit entry.
- **Edge Cases:** Changes propagate to other instances within 15 s (cache TTL).
- **Security Considerations:** Owner-only. Limits (`maxStudents`,`maxUsers`) can be set but are never enforced.
- **Current Limitations:** —

### `POST /api/tenants/:tenantId/subscription/reactivate [handler]`
- **File:** `server.ts:2114-2130`  · **Review:** REVIEWED
- **Purpose:** Clears manual suspension and sets status active.
- **Parameters:** Path `tenantId`; body per purpose.
- **Returns:** 200 `{ success, tenantId, subscription, summary }`
- **Dependencies:** none detected
- **Calls:** `resolveSubscriptionTenantId`, `loadTenantSubscription`, `persistTenantSubscription`, `subscriptionSummary`
- **Called By:** no in-repo caller resolved (entry point, event handler, route, or referenced by value)
- **Database Interaction:** READ/WRITE `tenants/{id}`; WRITE `audit_logs`.
- **External Services:** Firestore.
- **Authentication:** Bearer.
- **Authorization:** Platform owner only.
- **Validation:** Tenant pattern; type checks per field. PATCH accepts any string for `currentPeriodEnd` (an unparsable string means 'never expires').
- **Errors:** 400 invalid tenantId; 500 with generic message.
- **Side Effects:** Cache invalidation; audit entry.
- **Edge Cases:** Changes propagate to other instances within 15 s (cache TTL).
- **Security Considerations:** Owner-only. Limits (`maxStudents`,`maxUsers`) can be set but are never enforced.
- **Current Limitations:** —

### `POST /api/tenants/:tenantId/subscription/renew [handler]`
- **File:** `server.ts:2132-2161`  · **Review:** REVIEWED
- **Purpose:** Extends the subscription (`cycle`, `months` ≤60, `periodEnd`, `amount`, `currency`).
- **Parameters:** Path `tenantId`; body per purpose.
- **Returns:** 200 `{ success, tenantId, subscription, summary }`
- **Dependencies:** none detected
- **Calls:** `resolveSubscriptionTenantId`, `loadTenantSubscription`, `persistTenantSubscription`, `subscriptionSummary`
- **Called By:** no in-repo caller resolved (entry point, event handler, route, or referenced by value)
- **Database Interaction:** READ/WRITE `tenants/{id}`; WRITE `audit_logs`.
- **External Services:** Firestore.
- **Authentication:** Bearer.
- **Authorization:** Platform owner only.
- **Validation:** Tenant pattern; type checks per field. PATCH accepts any string for `currentPeriodEnd` (an unparsable string means 'never expires').
- **Errors:** 400 invalid tenantId; 500 with generic message.
- **Side Effects:** Cache invalidation; audit entry.
- **Edge Cases:** Changes propagate to other instances within 15 s (cache TTL).
- **Security Considerations:** Owner-only. Limits (`maxStudents`,`maxUsers`) can be set but are never enforced.
- **Current Limitations:** —

### `PATCH /api/tenants/:tenantId/subscription [handler]`
- **File:** `server.ts:2163-2204`  · **Review:** REVIEWED
- **Purpose:** Updates plan, billing cycle, grace days (≤365), autoRenew, currentPeriodEnd, amount, currency, notes, limits.
- **Parameters:** Path `tenantId`; body per purpose.
- **Returns:** 200 `{ success, tenantId, subscription, summary }`
- **Dependencies:** none detected
- **Calls:** `resolveSubscriptionTenantId`, `loadTenantSubscription`, `persistTenantSubscription`, `subscriptionSummary`
- **Called By:** no in-repo caller resolved (entry point, event handler, route, or referenced by value)
- **Database Interaction:** READ/WRITE `tenants/{id}`; WRITE `audit_logs`.
- **External Services:** Firestore.
- **Authentication:** Bearer.
- **Authorization:** Platform owner only.
- **Validation:** Tenant pattern; type checks per field. PATCH accepts any string for `currentPeriodEnd` (an unparsable string means 'never expires').
- **Errors:** 400 invalid tenantId; 500 with generic message.
- **Side Effects:** Cache invalidation; audit entry.
- **Edge Cases:** Changes propagate to other instances within 15 s (cache TTL).
- **Security Considerations:** Owner-only. Limits (`maxStudents`,`maxUsers`) can be set but are never enforced.
- **Current Limitations:** —

### `POST /api/users [handler]`
- **File:** `server.ts:2208-2276`  · **Review:** REVIEWED
- **Purpose:** Creates a tenant member login (Auth + claims + profile).
- **Parameters:** Body `{ name, email, role in {admin,registrar,teacher,parent}, phone?, jobTitle?, status?, assignedClasses?[≤50], assignedSubjects?[≤50], password?, tenantId? (owner only) }`
- **Returns:** 200 `{ success, created, temporaryPassword, user }`.
- **Dependencies:** admin
- **Calls:** `upsertManagedAccount`
- **Called By:** no in-repo caller resolved (entry point, event handler, route, or referenced by value)
- **Database Interaction:** WRITE `users/{uid}`; Auth.
- **External Services:** Firebase Auth.
- **Authentication:** Bearer.
- **Authorization:** `requireRole(['admin','registrar'])`; only admin/platform-owner may create an admin; tenant forced to caller's unless platform owner.
- **Validation:** Email regex, tenant pattern, name required, role allow-list (super_admin rejected).
- **Errors:** 400/403/409/503/500.
- **Side Effects:** Account creation; returns temporary password in clear.
- **Edge Cases:** Existing email ⇒ 409 (allowExisting false).
- **Security Considerations:** Registrar can create teacher/parent/registrar accounts. No plan-limit check.
- **Current Limitations:** —

### `PATCH /api/users/:uid [handler]`
- **File:** `server.ts:2279-2345`  · **Review:** REVIEWED
- **Purpose:** Updates a member profile; role changes refresh claims and revoke tokens; deactivation disables the Auth user.
- **Parameters:** Path `uid`; body subset of `{ name, phone, jobTitle, status, assignedClasses, assignedSubjects, role }`
- **Returns:** 200 `{ success, user }`.
- **Dependencies:** admin, firestore
- **Calls:** `accountPatchDenial`, `accountRoleChangeDenial`
- **Called By:** no in-repo caller resolved (entry point, event handler, route, or referenced by value)
- **Database Interaction:** READ/WRITE `users/{uid}`; Auth claims.
- **External Services:** Firebase Auth.
- **Authentication:** Bearer.
- **Authorization:** admin/registrar; patch denial rules (other tenant, super_admin, registrar→admin); role change only by admin/owner; self demote/deactivate blocked.
- **Validation:** Per-field type/length.
- **Errors:** 400/403/404/500/503.
- **Side Effects:** Revokes refresh tokens on role change/deactivation.
- **Edge Cases:** Cannot change email.
- **Security Considerations:** Error response includes `err.message` (internal detail).
- **Current Limitations:** —

### `DELETE /api/users/:uid [handler]`
- **File:** `server.ts:2347-2379`  · **Review:** REVIEWED
- **Purpose:** Deletes a member profile and Auth user.
- **Parameters:** Path `uid`
- **Returns:** 200 `{ success: true }`
- **Dependencies:** admin, firestore
- **Calls:** `isPlatformOwner` (server.ts:622)
- **Called By:** no in-repo caller resolved (entry point, event handler, route, or referenced by value)
- **Database Interaction:** DELETE `users/{uid}`; Auth delete.
- **External Services:** Firebase Auth.
- **Authentication:** Bearer.
- **Authorization:** `requireRole(['admin'])`; same tenant (or owner); super_admin protected; self-delete blocked.
- **Validation:** —
- **Errors:** 400/403/404/500/503.
- **Side Effects:** Irreversible.
- **Edge Cases:** Auth delete errors swallowed.
- **Security Considerations:** Does not delete or reassign the user's other data.
- **Current Limitations:** —

### `POST /api/owner/holidays/search [handler]`
- **File:** `server.ts:2382-2476`  · **Review:** REVIEWED
- **Purpose:** Returns official school holidays for a country: Gemini-generated JSON, else a static preset.
- **Parameters:** Body `{ country?, academicYear?, tenantId? }`
- **Returns:** 200 `{ success, country, source, verifiedBy:'gemini_verified'|'official_preset', weekendDays, ministryHeaderAr, holidays[] }`
- **Dependencies:** none detected
- **Calls:** `getCountryPreset`, `getGenAIClientForTenant`
- **Called By:** no in-repo caller resolved (entry point, event handler, route, or referenced by value)
- **Database Interaction:** None.
- **External Services:** Gemini.
- **Authentication:** Bearer.
- **Authorization:** Platform owner only.
- **Validation:** None on `country`/`academicYear`.
- **Errors:** 500 generic.
- **Side Effects:** AI call.
- **Edge Cases:** Label 'gemini_verified' means only that Gemini produced JSON; there is no grounding/search tool in the call.
- **Security Considerations:** Free-text fields interpolated into the prompt.
- **Current Limitations:** AI output is not verified against any authoritative source.

### `serveStaticBundle`
- **File:** `server.ts:2479-2484`  · **Review:** REVIEWED
- **Purpose:** Serves `dist/` and falls back to `index.html` for any GET.
- **Parameters:** none
- **Returns:** void
- **Dependencies:** express
- **Calls:** no in-repo callees resolved
- **Called By:** `startServer` (server.ts:2525)
- **Database Interaction:** None.
- **External Services:** —
- **Authentication:** Public.
- **Authorization:** None.
- **Validation:** —
- **Errors:** —
- **Side Effects:** Registers middleware.
- **Edge Cases:** After auth chain, so unknown authenticated `/api/*` GETs return `index.html`.
- **Security Considerations:** —
- **Current Limitations:** —

### `GET * [handler]` (nested in `serveStaticBundle`)
- **File:** `server.ts:2481-2483`  · **Review:** REVIEWED
- **Purpose:** SPA fallback: sends `dist/index.html`.
- **Parameters:** none
- **Returns:** HTML
- **Dependencies:** none detected
- **Calls:** no in-repo callees resolved
- **Called By:** no in-repo caller resolved (entry point, event handler, route, or referenced by value)
- **Database Interaction:** None.
- **External Services:** —
- **Authentication:** Public for non-/api paths.
- **Authorization:** None.
- **Validation:** —
- **Errors:** —
- **Side Effects:** —
- **Edge Cases:** —
- **Security Considerations:** —
- **Current Limitations:** —

### `hydrateTenantSecrets`
- **File:** `server.ts:2488-2510`  · **Review:** REVIEWED
- **Purpose:** Attaches Firestore (`tenant_ai_secrets`) as the durable store for tenant AI keys.
- **Parameters:** none
- **Returns:** `Promise<void>`
- **Dependencies:** admin, firestore
- **Calls:** `attachTenantSecretsStore`
- **Called By:** `prepareRuntime` (server.ts:2516)
- **Database Interaction:** READ all `tenant_ai_secrets`; later WRITE/DELETE per tenant.
- **External Services:** Firestore.
- **Authentication:** N/A.
- **Authorization:** N/A.
- **Validation:** —
- **Errors:** Caught in `prepareRuntime`.
- **Side Effects:** Hydrates in-memory cache.
- **Edge Cases:** No-op when Admin not ready.
- **Security Considerations:** Collection is not exposed by `firestore.rules` (default deny).
- **Current Limitations:** —

### `loadAll` (nested in `hydrateTenantSecrets`)
- **File:** `server.ts:2495-2502`  · **Review:** REVIEWED
- **Purpose:** Store adapter: loads all secret documents.
- **Parameters:** none
- **Returns:** `Promise<Record<string, any>>`
- **Dependencies:** none detected
- **Calls:** no in-repo callees resolved
- **Called By:** no in-repo caller resolved (entry point, event handler, route, or referenced by value)
- **Database Interaction:** READ `tenant_ai_secrets`.
- **External Services:** Firestore.
- **Authentication:** N/A.
- **Authorization:** N/A.
- **Validation:** —
- **Errors:** Propagates.
- **Side Effects:** —
- **Edge Cases:** —
- **Security Considerations:** —
- **Current Limitations:** —

### `put` (nested in `hydrateTenantSecrets`)
- **File:** `server.ts:2503-2505`  · **Review:** REVIEWED
- **Purpose:** Store adapter: writes one encrypted payload.
- **Parameters:** `tenantId, payload`
- **Returns:** `Promise<void>`
- **Dependencies:** none detected
- **Calls:** no in-repo callees resolved
- **Called By:** no in-repo caller resolved (entry point, event handler, route, or referenced by value)
- **Database Interaction:** WRITE `tenant_ai_secrets/{tenantId}`.
- **External Services:** Firestore.
- **Authentication:** N/A.
- **Authorization:** N/A.
- **Validation:** —
- **Errors:** Propagates (caller only logs).
- **Side Effects:** —
- **Edge Cases:** —
- **Security Considerations:** —
- **Current Limitations:** —

### `remove` (nested in `hydrateTenantSecrets`)
- **File:** `server.ts:2506-2508`  · **Review:** REVIEWED
- **Purpose:** Store adapter: deletes one payload.
- **Parameters:** `tenantId`
- **Returns:** `Promise<void>`
- **Dependencies:** none detected
- **Calls:** no in-repo callees resolved
- **Called By:** no in-repo caller resolved (entry point, event handler, route, or referenced by value)
- **Database Interaction:** DELETE `tenant_ai_secrets/{tenantId}`.
- **External Services:** Firestore.
- **Authentication:** N/A.
- **Authorization:** N/A.
- **Validation:** —
- **Errors:** Propagates.
- **Side Effects:** —
- **Edge Cases:** —
- **Security Considerations:** —
- **Current Limitations:** —

### `prepareRuntime`
- **File:** `server.ts:2516-2523`  · **Review:** REVIEWED
- **Purpose:** Idempotent runtime bootstrap (secret store hydration) shared by server and Vercel handler.
- **Parameters:** none
- **Returns:** `Promise<void>` (memoised)
- **Dependencies:** none detected
- **Calls:** `hydrateTenantSecrets`
- **Called By:** `startServer` (server.ts:2525)
- **Database Interaction:** See `hydrateTenantSecrets`.
- **External Services:** —
- **Authentication:** N/A.
- **Authorization:** N/A.
- **Validation:** —
- **Errors:** Hydration errors caught and warned.
- **Side Effects:** —
- **Edge Cases:** —
- **Security Considerations:** —
- **Current Limitations:** —

### `startServer`
- **File:** `server.ts:2525-2555`  · **Review:** REVIEWED
- **Purpose:** Mounts static bundle (production) or the Vite dev middleware, bootstraps runtime, and listens on 0.0.0.0:PORT.
- **Parameters:** none
- **Returns:** `Promise<void>`
- **Dependencies:** none detected
- **Calls:** `serveStaticBundle`, `prepareRuntime`
- **Called By:** no in-repo caller resolved (entry point, event handler, route, or referenced by value)
- **Database Interaction:** —
- **External Services:** Vite (dev).
- **Authentication:** N/A.
- **Authorization:** N/A.
- **Validation:** —
- **Errors:** Top-level catch logs.
- **Side Effects:** Binds a port.
- **Edge Cases:** Only runs when executed directly.
- **Security Considerations:** Binds all interfaces.
- **Current Limitations:** Dev falls back to static bundle if Vite fails.



# Shared src (utils/config/lib/hooks/data)


## src/App.tsx

### `ViewLoadingFallback`
- **File:** `src/App.tsx:50-55`  · **Review:** REVIEWED
- **Purpose:** Spinner shown while lazy views load.
- **Parameters:** none
- **Returns:** JSX
- **Dependencies:** none detected
- **Calls:** —
- **Called By:** no in-repo caller resolved (entry point, event handler, route, or referenced by value)
- **Database Interaction:** None.
- **External Services:** None.
- **Authentication:** N/A (pure helper).
- **Authorization:** N/A.
- **Validation:** None.
- **Errors:** None thrown.
- **Side Effects:** Render only.
- **Edge Cases:** —
- **Security Considerations:** —
- **Current Limitations:** —

### `MainAppContent`
- **File:** `src/App.tsx:57-308`  · **Review:** REVIEWED
- **Purpose:** Authenticated shell: tab state, role-based tab guard, login gate, subscription gate, layout, view switching.
- **Parameters:** none
- **Returns:** JSX
- **Dependencies:** none detected
- **Calls:** `useAttendance` (src/context/AttendanceContext.tsx:3733), `subscribeConnectionStatus` (src/lib/firebase.ts:98)
- **Called By:** no in-repo caller resolved (entry point, event handler, route, or referenced by value)
- **Database Interaction:** None.
- **External Services:** None.
- **Authentication:** Client-side gate: `isAuthenticated` initialised from localStorage flag `school_user_authenticated` or a Firebase user.
- **Authorization:** UI-only tab guard: parent ⇒ portal/justifications/communications; teacher ⇒ sessions only; registrar ⇒ no settings. NOT a security boundary.
- **Validation:** None.
- **Errors:** None thrown.
- **Side Effects:** Sets `document.documentElement` lang/dir; localStorage flag; sets role `super_admin` when email is in `VITE_PLATFORM_OWNER_EMAILS` (UI only).
- **Edge Cases:** —
- **Security Considerations:** Owner UI role is derived from an email list compiled into the bundle; server uses claims only.
- **Current Limitations:** Footer shows hard-coded 'Version 2.4.0' while package.json is 1.0.0.

### `handleSignOut` (nested in `MainAppContent`)
- **File:** `src/App.tsx:91-99`  · **Review:** REVIEWED
- **Purpose:** Clears auth flag, signs out of Firebase, shows login.
- **Parameters:** none
- **Returns:** void
- **Dependencies:** none detected
- **Calls:** —
- **Called By:** no in-repo caller resolved (entry point, event handler, route, or referenced by value)
- **Database Interaction:** None.
- **External Services:** None.
- **Authentication:** N/A (pure helper).
- **Authorization:** N/A.
- **Validation:** None.
- **Errors:** None thrown.
- **Side Effects:** localStorage remove; `signOutGoogle`.
- **Edge Cases:** —
- **Security Considerations:** —
- **Current Limitations:** —

### `handleLoginSuccess` (nested in `MainAppContent`)
- **File:** `src/App.tsx:101-114`  · **Review:** REVIEWED
- **Purpose:** Stores auth flag, sets role from returned profile, selects landing tab.
- **Parameters:** `userProfile: any`
- **Returns:** void
- **Dependencies:** none detected
- **Calls:** —
- **Called By:** no in-repo caller resolved (entry point, event handler, route, or referenced by value)
- **Database Interaction:** None.
- **External Services:** None.
- **Authentication:** N/A (pure helper).
- **Authorization:** N/A.
- **Validation:** None.
- **Errors:** None thrown.
- **Side Effects:** localStorage write; state updates.
- **Edge Cases:** —
- **Security Considerations:** Role is taken from the client-side profile object.
- **Current Limitations:** —

### `App`
- **File:** `src/App.tsx:310-362`  · **Review:** REVIEWED
- **Purpose:** Root: resolves tenant from host (then `/api/tenant/resolve`), shows unknown/inactive screens, mounts providers.
- **Parameters:** none
- **Returns:** JSX
- **Dependencies:** none detected
- **Calls:** `resolveTenantFromHostname` (src/config/tenantRegistry.ts:325)
- **Called By:** no in-repo caller resolved (entry point, event handler, route, or referenced by value)
- **Database Interaction:** None.
- **External Services:** GET /api/tenant/resolve when host unknown.
- **Authentication:** N/A (pure helper).
- **Authorization:** N/A.
- **Validation:** None.
- **Errors:** None thrown.
- **Side Effects:** None (pure).
- **Edge Cases:** —
- **Security Considerations:** —
- **Current Limitations:** —


## src/config/countryCodes.ts

### `cleanDialCode`
- **File:** `src/config/countryCodes.ts:283-288`  · **Review:** AUTO
- **Purpose:** In-code comment: Clean & normalize a phone dial code (e.g., '966' -> '+966', '+ 966' -> '+966')
- **Parameters:** `val: string`
- **Returns:** `string` (declared)
- **Dependencies:** none detected
- **Calls:** no in-repo callees resolved
- **Called By:** no in-repo caller resolved (entry point, event handler, route, or referenced by value)
- **Database Interaction:** None detected.
- **External Services:** None detected.
- **Authentication:** No authentication logic inside this function.
- **Authorization:** No role/permission check inside this function.
- **Validation:** 2 guard/type/regex check(s) detected.
- **Errors:** None detected.
- **Side Effects:** None detected.
- **Edge Cases:** UNKNOWN (not individually reviewed)
- **Security Considerations:** None noted (not individually reviewed).
- **Current Limitations:** UNKNOWN (not individually reviewed)

### `findCountryByName`
- **File:** `src/config/countryCodes.ts:293-333`  · **Review:** AUTO
- **Purpose:** In-code comment: Find country info by name (supports Arabic, English, partial matching, or code)
- **Parameters:** `query: string`
- **Returns:** `CountryInfo | undefined` (declared)
- **Dependencies:** none detected
- **Calls:** `normalizeAr` (src/config/countryCodes.ts:312)
- **Called By:** `getCallingCodeForCountry` (src/config/countryCodes.ts:338), `handleCountryChange` (src/components/superadmin/PlatformOwnerModal.tsx:154), `SchoolContactTab` (src/components/settings/SchoolContactTab.tsx:20), `handleCountryChange` (src/components/settings/SchoolContactTab.tsx:33)
- **Database Interaction:** None detected.
- **External Services:** None detected.
- **Authentication:** No authentication logic inside this function.
- **Authorization:** No role/permission check inside this function.
- **Validation:** 1 guard/type/regex check(s) detected.
- **Errors:** None detected.
- **Side Effects:** None detected.
- **Edge Cases:** UNKNOWN (not individually reviewed)
- **Security Considerations:** None noted (not individually reviewed).
- **Current Limitations:** UNKNOWN (not individually reviewed)

### `normalizeAr` (nested in `findCountryByName`)
- **File:** `src/config/countryCodes.ts:312-319`  · **Review:** AUTO
- **Purpose:** In-code comment: 4. Normalized match (remove 'المملكة', 'جمهورية', 'دولة', 'ال')
- **Parameters:** `s: string`
- **Returns:** `string` (inferred)
- **Dependencies:** none detected
- **Calls:** no in-repo callees resolved
- **Called By:** `findCountryByName` (src/config/countryCodes.ts:293)
- **Database Interaction:** None detected.
- **External Services:** None detected.
- **Authentication:** No authentication logic inside this function.
- **Authorization:** No role/permission check inside this function.
- **Validation:** None detected.
- **Errors:** None detected.
- **Side Effects:** None detected.
- **Edge Cases:** UNKNOWN (not individually reviewed)
- **Security Considerations:** None noted (not individually reviewed).
- **Current Limitations:** UNKNOWN (not individually reviewed)

### `getCallingCodeForCountry`
- **File:** `src/config/countryCodes.ts:338-341`  · **Review:** AUTO
- **Purpose:** In-code comment: Get the calling code for a country, or fallback
- **Parameters:** `countryName: string`; `fallback = '+966'`
- **Returns:** `string` (declared)
- **Dependencies:** none detected
- **Calls:** `findCountryByName` (src/config/countryCodes.ts:293)
- **Called By:** `SchoolContactTab` (src/components/settings/SchoolContactTab.tsx:20)
- **Database Interaction:** None detected.
- **External Services:** None detected.
- **Authentication:** No authentication logic inside this function.
- **Authorization:** No role/permission check inside this function.
- **Validation:** None detected.
- **Errors:** None detected.
- **Side Effects:** None detected.
- **Edge Cases:** UNKNOWN (not individually reviewed)
- **Security Considerations:** None noted (not individually reviewed).
- **Current Limitations:** UNKNOWN (not individually reviewed)


## src/config/countryPresets.ts

### `getCountryPreset`
- **File:** `src/config/countryPresets.ts:685-753`  · **Review:** AUTO
- **Purpose:** In-code comment: Intelligent helper that extracts or synthesizes a country preset for any given country name or calling code.
- **Parameters:** `countryNameOrCode?: string`
- **Returns:** `CountryPreset` (declared)
- **Dependencies:** none detected
- **Calls:** no in-repo callees resolved
- **Called By:** `POST /api/owner/holidays/search [handler]` (server.ts:2382), `SchoolIdentityTab` (src/components/settings/SchoolIdentityTab.tsx:13), `SchoolContactTab` (src/components/settings/SchoolContactTab.tsx:20), `SmartHolidayImportModal` (src/components/settings/SmartHolidayImportModal.tsx:38), `handlePerformSearch` (src/components/settings/SmartHolidayImportModal.tsx:88), `HolidaysAndWeekendsCard` (src/components/settings/HolidaysAndWeekendsCard.tsx:49)
- **Database Interaction:** None detected.
- **External Services:** None detected.
- **Authentication:** No authentication logic inside this function.
- **Authorization:** No role/permission check inside this function.
- **Validation:** 1 guard/type/regex check(s) detected.
- **Errors:** None detected.
- **Side Effects:** None detected.
- **Edge Cases:** UNKNOWN (not individually reviewed)
- **Security Considerations:** None noted (not individually reviewed).
- **Current Limitations:** UNKNOWN (not individually reviewed)


## src/config/defaultSettings.ts

### `getDefaultSchoolSettings`
- **File:** `src/config/defaultSettings.ts:9-33`  · **Review:** AUTO
- **Purpose:** In-code comment: Neutral first-run settings. Real values come from the Settings page and are persisted in Firestore; these defaults only prevent an empty form before the first save. No phone numbers, sender IDs or API credentials here.
- **Parameters:** `tenantId: string`
- **Returns:** `SchoolSettings` (declared)
- **Dependencies:** none detected
- **Calls:** `getDefaultSchoolProfile` (src/config/tenantSettings.ts:242)
- **Called By:** `AttendanceProvider` (src/context/AttendanceContext.tsx:326), `updateMessagingGateway` (src/context/AttendanceContext.tsx:3160), `provisionNewSchool` (src/context/AttendanceContext.tsx:3433)
- **Database Interaction:** None detected.
- **External Services:** None detected.
- **Authentication:** No authentication logic inside this function.
- **Authorization:** No role/permission check inside this function.
- **Validation:** None detected.
- **Errors:** None detected.
- **Side Effects:** None detected.
- **Edge Cases:** UNKNOWN (not individually reviewed)
- **Security Considerations:** None noted (not individually reviewed).
- **Current Limitations:** UNKNOWN (not individually reviewed)


## src/config/subscription.ts

### `defaultSubscription`
- **File:** `src/config/subscription.ts:80-92`  · **Review:** REVIEWED
- **Purpose:** Grandfathered default: plan 'legacy', status active, no period end, grace 7 days.
- **Parameters:** none
- **Returns:** `TenantSubscription`
- **Dependencies:** none detected
- **Calls:** —
- **Called By:** `normalizeSubscription` (src/config/subscription.ts:101), `loadTenantSubscription` (server.ts:805), `POST /api/tenants/provision [handler]` (server.ts:1875)
- **Database Interaction:** None.
- **External Services:** None.
- **Authentication:** N/A (pure helper).
- **Authorization:** N/A.
- **Validation:** None.
- **Errors:** None thrown.
- **Side Effects:** None (pure).
- **Edge Cases:** Used when a school has no subscription document ⇒ unlimited access.
- **Security Considerations:** —
- **Current Limitations:** —

### `toDate`
- **File:** `src/config/subscription.ts:94-98`  · **Review:** REVIEWED
- **Purpose:** Parses ISO-like string to Date or null.
- **Parameters:** `value: unknown`
- **Returns:** `Date | null`
- **Dependencies:** none detected
- **Calls:** —
- **Called By:** `computeAccessUntilMs` (src/config/subscription.ts:168), `evaluateSubscription` (src/config/subscription.ts:183), `applyRenewal` (src/config/subscription.ts:258)
- **Database Interaction:** None.
- **External Services:** None.
- **Authentication:** N/A (pure helper).
- **Authorization:** N/A.
- **Validation:** None.
- **Errors:** None thrown.
- **Side Effects:** None (pure).
- **Edge Cases:** Invalid strings ⇒ null (treated as 'no period').
- **Security Considerations:** —
- **Current Limitations:** —

### `normalizeSubscription`
- **File:** `src/config/subscription.ts:101-162`  · **Review:** REVIEWED
- **Purpose:** Coerces arbitrary data into a valid `TenantSubscription`.
- **Parameters:** `raw: unknown`
- **Returns:** `TenantSubscription`
- **Dependencies:** none detected
- **Calls:** `defaultSubscription` (src/config/subscription.ts:80)
- **Called By:** `evaluateSubscription` (src/config/subscription.ts:183), `applyRenewal` (src/config/subscription.ts:258), `applySuspend` (src/config/subscription.ts:293), `applyReactivate` (src/config/subscription.ts:313), `loadTenantSubscription` (server.ts:805), `GET /api/tenants [handler]` (server.ts:1833), `refreshSubscription` (src/context/AttendanceContext.tsx:394)
- **Database Interaction:** None.
- **External Services:** None.
- **Authentication:** N/A (pure helper).
- **Authorization:** N/A.
- **Validation:** Status/cycle allow-lists; grace clamped 0–365; numeric limits kept as-is.
- **Errors:** None thrown.
- **Side Effects:** None (pure).
- **Edge Cases:** —
- **Security Considerations:** —
- **Current Limitations:** —

### `computeAccessUntilMs`
- **File:** `src/config/subscription.ts:168-172`  · **Review:** REVIEWED
- **Purpose:** Period end + grace in epoch ms, or 0 if no period.
- **Parameters:** `sub`
- **Returns:** `number`
- **Dependencies:** none detected
- **Calls:** `toDate` (src/config/subscription.ts:94)
- **Called By:** `applyRenewal` (src/config/subscription.ts:258), `applySuspend` (src/config/subscription.ts:293), `applyReactivate` (src/config/subscription.ts:313), `PATCH /api/tenants/:tenantId/subscription [handler]` (server.ts:2163)
- **Database Interaction:** None.
- **External Services:** None.
- **Authentication:** N/A (pure helper).
- **Authorization:** N/A.
- **Validation:** None.
- **Errors:** None thrown.
- **Side Effects:** None (pure).
- **Edge Cases:** 0 means never expires (mirrored by firestore.rules).
- **Security Considerations:** —
- **Current Limitations:** —

### `daysBetween`
- **File:** `src/config/subscription.ts:174-176`  · **Review:** REVIEWED
- **Purpose:** Ceil of day difference.
- **Parameters:** `from: Date, to: Date`
- **Returns:** `number`
- **Dependencies:** none detected
- **Calls:** —
- **Called By:** `evaluateSubscription` (src/config/subscription.ts:183)
- **Database Interaction:** None.
- **External Services:** None.
- **Authentication:** N/A (pure helper).
- **Authorization:** N/A.
- **Validation:** None.
- **Errors:** None thrown.
- **Side Effects:** None (pure).
- **Edge Cases:** —
- **Security Considerations:** —
- **Current Limitations:** —

### `evaluateSubscription`
- **File:** `src/config/subscription.ts:183-236`  · **Review:** REVIEWED
- **Purpose:** Derives effective access state at `now` (suspended > expired > no-period > clock/grace).
- **Parameters:** `raw: unknown, now = new Date()`
- **Returns:** `SubscriptionEvaluation`
- **Dependencies:** none detected
- **Calls:** `normalizeSubscription` (src/config/subscription.ts:101), `toDate` (src/config/subscription.ts:94), `daysBetween` (src/config/subscription.ts:174)
- **Called By:** `requireActiveSubscription` (server.ts:896), `GET /api/tenants [handler]` (server.ts:1833), `subscriptionSummary` (server.ts:2056), `AttendanceProvider` (src/context/AttendanceContext.tsx:326)
- **Database Interaction:** None.
- **External Services:** None.
- **Authentication:** N/A (pure helper).
- **Authorization:** N/A.
- **Validation:** None.
- **Errors:** None thrown.
- **Side Effects:** None (pure).
- **Edge Cases:** Status 'cancelled' with no period end keeps access (treated as grace).
- **Security Considerations:** —
- **Current Limitations:** Wall-clock based; lazily expires without a cron.

### `addMonths`
- **File:** `src/config/subscription.ts:238-242`  · **Review:** REVIEWED
- **Purpose:** Adds calendar months using `setMonth`.
- **Parameters:** `date, months`
- **Returns:** `Date`
- **Dependencies:** none detected
- **Calls:** —
- **Called By:** `applyRenewal` (src/config/subscription.ts:258)
- **Database Interaction:** None.
- **External Services:** None.
- **Authentication:** N/A (pure helper).
- **Authorization:** N/A.
- **Validation:** None.
- **Errors:** None thrown.
- **Side Effects:** None (pure).
- **Edge Cases:** Month-end overflow (Jan 31 + 1 month ⇒ early March).
- **Security Considerations:** —
- **Current Limitations:** —

### `applyRenewal`
- **File:** `src/config/subscription.ts:258-291`  · **Review:** REVIEWED
- **Purpose:** Extends subscription from max(now, current end) by months/cycle, or to explicit `periodEnd`.
- **Parameters:** `raw, options: RenewOptions`
- **Returns:** `TenantSubscription`
- **Dependencies:** none detected
- **Calls:** `normalizeSubscription` (src/config/subscription.ts:101), `toDate` (src/config/subscription.ts:94), `addMonths` (src/config/subscription.ts:238), `computeAccessUntilMs` (src/config/subscription.ts:168)
- **Called By:** `POST /api/tenants/:tenantId/subscription/renew [handler]` (server.ts:2132)
- **Database Interaction:** None.
- **External Services:** None.
- **Authentication:** N/A (pure helper).
- **Authorization:** N/A.
- **Validation:** None.
- **Errors:** None thrown.
- **Side Effects:** Clears suspension fields; sets `autoRenew:true`, `lastPaymentAt: now`.
- **Edge Cases:** —
- **Security Considerations:** —
- **Current Limitations:** Marks a payment received (`lastPaymentAt`) without any payment integration.

### `applySuspend`
- **File:** `src/config/subscription.ts:293-311`  · **Review:** REVIEWED
- **Purpose:** Marks manual suspension.
- **Parameters:** `raw, options`
- **Returns:** `TenantSubscription`
- **Dependencies:** none detected
- **Calls:** `normalizeSubscription` (src/config/subscription.ts:101), `computeAccessUntilMs` (src/config/subscription.ts:168)
- **Called By:** `POST /api/tenants/:tenantId/subscription/suspend [handler]` (server.ts:2091)
- **Database Interaction:** None.
- **External Services:** None.
- **Authentication:** N/A (pure helper).
- **Authorization:** N/A.
- **Validation:** None.
- **Errors:** None thrown.
- **Side Effects:** None (pure).
- **Edge Cases:** —
- **Security Considerations:** —
- **Current Limitations:** —

### `applyReactivate`
- **File:** `src/config/subscription.ts:313-331`  · **Review:** REVIEWED
- **Purpose:** Clears manual suspension and sets status active.
- **Parameters:** `raw, options`
- **Returns:** `TenantSubscription`
- **Dependencies:** none detected
- **Calls:** `normalizeSubscription` (src/config/subscription.ts:101), `computeAccessUntilMs` (src/config/subscription.ts:168)
- **Called By:** `POST /api/tenants/:tenantId/subscription/reactivate [handler]` (server.ts:2114)
- **Database Interaction:** None.
- **External Services:** None.
- **Authentication:** N/A (pure helper).
- **Authorization:** N/A.
- **Validation:** None.
- **Errors:** None thrown.
- **Side Effects:** None (pure).
- **Edge Cases:** Does not extend an expired period; school may remain expired by clock.
- **Security Considerations:** —
- **Current Limitations:** —


## src/config/tenantRegistry.ts

### `setRuntimeDynamicTenants`
- **File:** `src/config/tenantRegistry.ts:89-91`  · **Review:** REVIEWED
- **Purpose:** Sets the server-side JSON tenant overlay.
- **Parameters:** `list`
- **Returns:** void
- **Dependencies:** none detected
- **Calls:** —
- **Called By:** `refreshDynamicTenants` (server.ts:474)
- **Database Interaction:** None.
- **External Services:** None.
- **Authentication:** N/A (pure helper).
- **Authorization:** N/A.
- **Validation:** None.
- **Errors:** None thrown.
- **Side Effects:** Mutates module state.
- **Edge Cases:** —
- **Security Considerations:** —
- **Current Limitations:** —

### `setRuntimeTenantDocs`
- **File:** `src/config/tenantRegistry.ts:98-100`  · **Review:** REVIEWED
- **Purpose:** Sets the Firestore tenant-doc overlay.
- **Parameters:** `list`
- **Returns:** void
- **Dependencies:** none detected
- **Calls:** —
- **Called By:** `refreshTenantDocs` (server.ts:455)
- **Database Interaction:** None.
- **External Services:** None.
- **Authentication:** N/A (pure helper).
- **Authorization:** N/A.
- **Validation:** None.
- **Errors:** None thrown.
- **Side Effects:** Mutates module state.
- **Edge Cases:** —
- **Security Considerations:** —
- **Current Limitations:** —

### `getActiveTenantRegistry`
- **File:** `src/config/tenantRegistry.ts:101-153`  · **Review:** REVIEWED
- **Purpose:** Merges static registry ← dynamic JSON ← Firestore docs ← browser localStorage `school_dynamic_tenants` (browser only).
- **Parameters:** none
- **Returns:** `Record<string, TenantDomainConfig>`
- **Dependencies:** none detected
- **Calls:** —
- **Called By:** `getDevTestTenants` (src/config/tenantRegistry.ts:277), `switchDevTestTenant` (src/config/tenantRegistry.ts:286), `resolveTenantFromHostname` (src/config/tenantRegistry.ts:325), `persistTenantSubscription` (server.ts:860), `GET /api/tenants [handler]` (server.ts:1833), `AttendanceProvider` (src/context/AttendanceContext.tsx:326), `provisionNewSchool` (src/context/AttendanceContext.tsx:3433)
- **Database Interaction:** None.
- **External Services:** None.
- **Authentication:** N/A (pure helper).
- **Authorization:** N/A.
- **Validation:** None.
- **Errors:** None thrown.
- **Side Effects:** Reads localStorage in browsers.
- **Edge Cases:** —
- **Security Considerations:** In the browser the localStorage overlay is user-controlled (affects UI branding/resolution only).
- **Current Limitations:** —

### `findTenantByAlias`
- **File:** `src/config/tenantRegistry.ts:160-191`  · **Review:** REVIEWED
- **Purpose:** Case-insensitive lookup by id, subdomain, code, slugified English name, tolerating `school-` prefix/suffix.
- **Parameters:** `registry, rawAlias`
- **Returns:** `TenantDomainConfig | undefined`
- **Dependencies:** none detected
- **Calls:** —
- **Called By:** `resolveTenantFromHostname` (src/config/tenantRegistry.ts:325)
- **Database Interaction:** None.
- **External Services:** None.
- **Authentication:** N/A (pure helper).
- **Authorization:** N/A.
- **Validation:** None.
- **Errors:** None thrown.
- **Side Effects:** None (pure).
- **Edge Cases:** —
- **Security Considerations:** —
- **Current Limitations:** —

### `extractQueryTenant`
- **File:** `src/config/tenantRegistry.ts:210-224`  · **Review:** REVIEWED
- **Purpose:** Reads `tenant` (or `school`) from a query string.
- **Parameters:** `searchOrQuery, key`
- **Returns:** `string | null`
- **Dependencies:** none detected
- **Calls:** —
- **Called By:** `resolveTenantFromHostname` (src/config/tenantRegistry.ts:325), `AttendanceProvider` (src/context/AttendanceContext.tsx:326)
- **Database Interaction:** None.
- **External Services:** None.
- **Authentication:** N/A (pure helper).
- **Authorization:** N/A.
- **Validation:** None.
- **Errors:** None thrown.
- **Side Effects:** None (pure).
- **Edge Cases:** —
- **Security Considerations:** —
- **Current Limitations:** —

### `normalizeHostname`
- **File:** `src/config/tenantRegistry.ts:232-254`  · **Review:** REVIEWED
- **Purpose:** Lower-cases, strips port (IPv6 aware) and trailing dot.
- **Parameters:** `rawHostname`
- **Returns:** `string`
- **Dependencies:** none detected
- **Calls:** —
- **Called By:** `isLocalDevelopmentHost` (src/config/tenantRegistry.ts:260), `resolveTenantFromHostname` (src/config/tenantRegistry.ts:325)
- **Database Interaction:** None.
- **External Services:** None.
- **Authentication:** N/A (pure helper).
- **Authorization:** N/A.
- **Validation:** None.
- **Errors:** None thrown.
- **Side Effects:** None (pure).
- **Edge Cases:** —
- **Security Considerations:** —
- **Current Limitations:** —

### `isLocalDevelopmentHost`
- **File:** `src/config/tenantRegistry.ts:260-271`  · **Review:** REVIEWED
- **Purpose:** True for localhost, 127.0.0.1, 0.0.0.0, *.local and RFC1918 ranges.
- **Parameters:** `rawHostname`
- **Returns:** `boolean`
- **Dependencies:** none detected
- **Calls:** `normalizeHostname` (src/config/tenantRegistry.ts:232)
- **Called By:** `switchDevTestTenant` (src/config/tenantRegistry.ts:286), `resolveTenantFromHostname` (src/config/tenantRegistry.ts:325), `HeaderNav` (src/components/HeaderNav.tsx:56), `LoginPage` (src/components/LoginPage.tsx:22)
- **Database Interaction:** None.
- **External Services:** None.
- **Authentication:** N/A (pure helper).
- **Authorization:** N/A.
- **Validation:** None.
- **Errors:** None thrown.
- **Side Effects:** None (pure).
- **Edge Cases:** —
- **Security Considerations:** Applied to the request `Host` header on the server; any request carrying a private-range Host resolves to the dev fallback tenant (school-1) — still bound by `requireTenant` to the caller's claim tenant.
- **Current Limitations:** Marked in code as 'TESTING / DEV ONLY – TO BE REMOVED IN PRODUCTION' but active in production code path.

### `getDevTestTenants`
- **File:** `src/config/tenantRegistry.ts:277-280`  · **Review:** REVIEWED
- **Purpose:** Lists active tenants for the dev switcher.
- **Parameters:** none
- **Returns:** `TenantDomainConfig[]`
- **Dependencies:** none detected
- **Calls:** `getActiveTenantRegistry` (src/config/tenantRegistry.ts:101)
- **Called By:** `HeaderNav` (src/components/HeaderNav.tsx:56), `LoginPage` (src/components/LoginPage.tsx:22)
- **Database Interaction:** None.
- **External Services:** None.
- **Authentication:** N/A (pure helper).
- **Authorization:** N/A.
- **Validation:** None.
- **Errors:** None thrown.
- **Side Effects:** None (pure).
- **Edge Cases:** —
- **Security Considerations:** —
- **Current Limitations:** Marked DEV ONLY in code.

### `switchDevTestTenant`
- **File:** `src/config/tenantRegistry.ts:286-316`  · **Review:** REVIEWED
- **Purpose:** Switches tenant on local hosts via localStorage + `?school=` redirect.
- **Parameters:** `targetTenantId`
- **Returns:** void
- **Dependencies:** none detected
- **Calls:** `isLocalDevelopmentHost` (src/config/tenantRegistry.ts:260), `getActiveTenantRegistry` (src/config/tenantRegistry.ts:101)
- **Called By:** `HeaderNav` (src/components/HeaderNav.tsx:56), `LoginPage` (src/components/LoginPage.tsx:22)
- **Database Interaction:** None.
- **External Services:** None.
- **Authentication:** N/A (pure helper).
- **Authorization:** N/A.
- **Validation:** None.
- **Errors:** None thrown.
- **Side Effects:** localStorage writes; navigation.
- **Edge Cases:** —
- **Security Considerations:** —
- **Current Limitations:** Marked DEV ONLY in code.

### `resolveTenantFromHostname`
- **File:** `src/config/tenantRegistry.ts:325-469`  · **Review:** REVIEWED
- **Purpose:** Resolves host ⇒ tenant: `?tenant=` → local-dev fallbacks → exact custom domain → subdomain label → unknown.
- **Parameters:** `rawHostname, searchOrQuery?`
- **Returns:** `TenantResolutionResult`
- **Dependencies:** none detected
- **Calls:** `normalizeHostname` (src/config/tenantRegistry.ts:232), `getActiveTenantRegistry` (src/config/tenantRegistry.ts:101), `isLocalDevelopmentHost` (src/config/tenantRegistry.ts:260), `extractQueryTenant` (src/config/tenantRegistry.ts:210), `findTenantByAlias` (src/config/tenantRegistry.ts:160)
- **Called By:** `getRequestHostTenant` (server.ts:490), `GET /api/tenant/resolve [handler]` (server.ts:1824), `AttendanceProvider` (src/context/AttendanceContext.tsx:326), `LoginPage` (src/components/LoginPage.tsx:22), `App` (src/App.tsx:310)
- **Database Interaction:** None.
- **External Services:** None.
- **Authentication:** N/A (pure helper).
- **Authorization:** N/A.
- **Validation:** None.
- **Errors:** None thrown.
- **Side Effects:** None (pure).
- **Edge Cases:** `?tenant=` honoured on any host; subdomain match uses the first host label for any host with ≥2 labels (e.g. `andalus.evil.com` resolves to Andalus).
- **Security Considerations:** Host-label matching means any domain whose first label equals a school subdomain resolves to that school for branding/gating; data access still requires matching credentials.
- **Current Limitations:** —

### `toTenantInterface`
- **File:** `src/config/tenantRegistry.ts:474-484`  · **Review:** REVIEWED
- **Purpose:** Maps config to legacy `Tenant` shape.
- **Parameters:** `config`
- **Returns:** `Tenant`
- **Dependencies:** none detected
- **Calls:** —
- **Called By:** no in-repo caller resolved (entry point, event handler, route, or referenced by value)
- **Database Interaction:** None.
- **External Services:** None.
- **Authentication:** N/A (pure helper).
- **Authorization:** N/A.
- **Validation:** None.
- **Errors:** None thrown.
- **Side Effects:** None (pure).
- **Edge Cases:** —
- **Security Considerations:** —
- **Current Limitations:** —


## src/config/tenantSettings.ts

### `withNeutralContacts`
- **File:** `src/config/tenantSettings.ts:212-241`  · **Review:** AUTO
- **Purpose:** UNKNOWN (no in-code description; not individually reviewed)
- **Parameters:** `profile: TenantSchoolProfile`
- **Returns:** `TenantSchoolProfile` (declared)
- **Dependencies:** none detected
- **Calls:** no in-repo callees resolved
- **Called By:** `getDefaultSchoolProfile` (src/config/tenantSettings.ts:242)
- **Database Interaction:** None detected.
- **External Services:** None detected.
- **Authentication:** No authentication logic inside this function.
- **Authorization:** No role/permission check inside this function.
- **Validation:** None detected.
- **Errors:** None detected.
- **Side Effects:** None detected.
- **Edge Cases:** UNKNOWN (not individually reviewed)
- **Security Considerations:** None noted (not individually reviewed).
- **Current Limitations:** UNKNOWN (not individually reviewed)

### `getDefaultSchoolProfile`
- **File:** `src/config/tenantSettings.ts:242-254`  · **Review:** AUTO
- **Purpose:** UNKNOWN (no in-code description; not individually reviewed)
- **Parameters:** `tenantId: string`
- **Returns:** `TenantSchoolProfile` (declared)
- **Dependencies:** none detected
- **Calls:** `withNeutralContacts` (src/config/tenantSettings.ts:212)
- **Called By:** `getDefaultSchoolSettings` (src/config/defaultSettings.ts:9), `AttendanceProvider` (src/context/AttendanceContext.tsx:326), `updateSchoolProfile` (src/context/AttendanceContext.tsx:3090), `updateMessagingGateway` (src/context/AttendanceContext.tsx:3160), `provisionNewSchool` (src/context/AttendanceContext.tsx:3433)
- **Database Interaction:** None detected.
- **External Services:** None detected.
- **Authentication:** No authentication logic inside this function.
- **Authorization:** No role/permission check inside this function.
- **Validation:** None detected.
- **Errors:** None detected.
- **Side Effects:** None detected.
- **Edge Cases:** UNKNOWN (not individually reviewed)
- **Security Considerations:** None noted (not individually reviewed).
- **Current Limitations:** UNKNOWN (not individually reviewed)


## src/hooks/useModalAccessibility.ts

### `useModalAccessibility`
- **File:** `src/hooks/useModalAccessibility.ts:17-63`  · **Review:** AUTO
- **Purpose:** In-code comment: Keyboard accessibility for modal dialogs (M-15 follow-up): - focuses the first control when the dialog opens (or the container itself), - traps Tab / Shift+Tab inside the dialog, - closes on Escape, - restores focus to the previously focused element on close.
- **Parameters:** `{ isOpen, onClose, containerRef, }: UseModalAccessibilityOptions`
- **Returns:** `void` (declared)
- **Dependencies:** none detected
- **Calls:** `getFocusableElements` (src/utils/modalA11y.ts:65)
- **Called By:** `PlatformOwnerModal` (src/components/superadmin/PlatformOwnerModal.tsx:65), `OfflineSyncModal` (src/components/OfflineSyncModal.tsx:43), `DigestSettingsModal` (src/components/digest/DigestSettingsModal.tsx:13), `QRScannerModal` (src/components/QRScannerModal.tsx:84), `BulkEditConfirmationModal` (src/components/attendance/BulkEditConfirmationModal.tsx:17), `GamifiedCelebrationModal` (src/components/attendance/GamifiedCelebrationModal.tsx:16), `EmergencyRosterModal` (src/components/attendance/EmergencyRosterModal.tsx:29), `StudentQRCodeModal` (src/components/StudentQRCodeModal.tsx:25), `BatchQRModal` (src/components/BatchQRModal.tsx:15), `StudentBehaviourModal` (src/components/attendance/StudentBehaviourModal.tsx:31) … (+9)
- **Database Interaction:** None detected.
- **External Services:** None detected.
- **Authentication:** No authentication logic inside this function.
- **Authorization:** No role/permission check inside this function.
- **Validation:** 2 guard/type/regex check(s) detected.
- **Errors:** None detected.
- **Side Effects:** DOM/window access
- **Edge Cases:** UNKNOWN (not individually reviewed)
- **Security Considerations:** None noted (not individually reviewed).
- **Current Limitations:** UNKNOWN (not individually reviewed)

### `handleKeyDown` (nested in `useModalAccessibility`)
- **File:** `src/hooks/useModalAccessibility.ts:33-55`  · **Review:** AUTO
- **Purpose:** UNKNOWN (no in-code description; not individually reviewed)
- **Parameters:** `event: KeyboardEvent`
- **Returns:** `void` (inferred)
- **Dependencies:** none detected
- **Calls:** `getFocusableElements` (src/utils/modalA11y.ts:65), `resolveDialogKeyAction` (src/utils/modalA11y.ts:44), `nextFocusIndex` (src/utils/modalA11y.ts:58)
- **Called By:** no in-repo caller resolved (entry point, event handler, route, or referenced by value)
- **Database Interaction:** None detected.
- **External Services:** None detected.
- **Authentication:** No authentication logic inside this function.
- **Authorization:** No role/permission check inside this function.
- **Validation:** None detected.
- **Errors:** None detected.
- **Side Effects:** DOM/window access
- **Edge Cases:** UNKNOWN (not individually reviewed)
- **Security Considerations:** None noted (not individually reviewed).
- **Current Limitations:** UNKNOWN (not individually reviewed)


## src/lib/api.ts

### `setApiTenantOverride`
- **File:** `src/lib/api.ts:11-13`  · **Review:** REVIEWED
- **Purpose:** Sets a module-level tenant override appended as `?tenant=` to API calls.
- **Parameters:** `tenantId: string | null`
- **Returns:** void
- **Dependencies:** none detected
- **Calls:** —
- **Called By:** `AttendanceProvider` (src/context/AttendanceContext.tsx:326)
- **Database Interaction:** None.
- **External Services:** None.
- **Authentication:** N/A (pure helper).
- **Authorization:** N/A.
- **Validation:** None.
- **Errors:** None thrown.
- **Side Effects:** Mutates module state.
- **Edge Cases:** —
- **Security Considerations:** —
- **Current Limitations:** —

### `withTenantQuery`
- **File:** `src/lib/api.ts:15-37`  · **Review:** REVIEWED
- **Purpose:** Appends `tenant=<override>` to `/api/` URLs that lack it.
- **Parameters:** `input: RequestInfo | URL`
- **Returns:** `RequestInfo | URL`
- **Dependencies:** none detected
- **Calls:** —
- **Called By:** `authenticatedFetch` (src/lib/api.ts:46)
- **Database Interaction:** None.
- **External Services:** None.
- **Authentication:** N/A (pure helper).
- **Authorization:** N/A.
- **Validation:** None.
- **Errors:** None thrown.
- **Side Effects:** None (pure).
- **Edge Cases:** Request objects and URL instances are returned unchanged.
- **Security Considerations:** —
- **Current Limitations:** —

### `authenticatedFetch`
- **File:** `src/lib/api.ts:46-81`  · **Review:** REVIEWED
- **Purpose:** fetch wrapper adding the Firebase ID token (or optional `VITE_DEV_AUTH_TOKEN`) as Bearer.
- **Parameters:** `input, init?`
- **Returns:** `Promise<Response>`
- **Dependencies:** none detected
- **Calls:** `withTenantQuery` (src/lib/api.ts:15)
- **Called By:** `createUser` (src/context/AttendanceContext.tsx:1495), `updateUser` (src/context/AttendanceContext.tsx:1592), `deleteUser` (src/context/AttendanceContext.tsx:1645), `retryNotification` (src/context/AttendanceContext.tsx:2324), `retryAllFailedNotifications` (src/context/AttendanceContext.tsx:2451), `sendCustomParentNotification` (src/context/AttendanceContext.tsx:2535), `generateCurrentDigest` (src/context/AttendanceContext.tsx:3267), `dispatchDailyDigest` (src/context/AttendanceContext.tsx:3325), `provisionNewSchool` (src/context/AttendanceContext.tsx:3433), `handleSubscriptionAction` (src/components/superadmin/PlatformOwnerModal.tsx:230) … (+9)
- **Database Interaction:** None.
- **External Services:** Calls the app's own API.
- **Authentication:** Attaches credentials; does not itself enforce.
- **Authorization:** N/A.
- **Validation:** None.
- **Errors:** Credential retrieval errors caught/warned; request still sent unauthenticated.
- **Side Effects:** Network.
- **Edge Cases:** Sets JSON content type for string bodies.
- **Security Considerations:** `VITE_DEV_AUTH_TOKEN`, if set at build time, is embedded in the public bundle (documented as dev only).
- **Current Limitations:** —


## src/lib/firebase.ts

### `handleFirestoreError`
- **File:** `src/lib/firebase.ts:72-92`  · **Review:** REVIEWED
- **Purpose:** Logs and rethrows a Firestore error as JSON including current auth info.
- **Parameters:** `error, operationType, path`
- **Returns:** never (throws)
- **Dependencies:** none detected
- **Calls:** —
- **Called By:** `AttendanceProvider` (src/context/AttendanceContext.tsx:326), `addAuditLog` (src/context/AttendanceContext.tsx:1725), `createJustification` (src/context/AttendanceContext.tsx:2091), `reviewJustification` (src/context/AttendanceContext.tsx:2198), `sendCustomParentNotification` (src/context/AttendanceContext.tsx:2535), `sendChronicWarningNotification` (src/context/AttendanceContext.tsx:2703)
- **Database Interaction:** None.
- **External Services:** None.
- **Authentication:** N/A (pure helper).
- **Authorization:** N/A.
- **Validation:** None.
- **Errors:** Always throws `Error(JSON)`.
- **Side Effects:** console.error with uid/email.
- **Edge Cases:** —
- **Security Considerations:** Writes user id and email to the console and into the thrown message.
- **Current Limitations:** —

### `subscribeConnectionStatus`
- **File:** `src/lib/firebase.ts:98-105`  · **Review:** REVIEWED
- **Purpose:** Registers a connection-status listener and returns an unsubscribe fn.
- **Parameters:** `listener`
- **Returns:** `() => void`
- **Dependencies:** none detected
- **Calls:** —
- **Called By:** `MainAppContent` (src/App.tsx:57)
- **Database Interaction:** None.
- **External Services:** None.
- **Authentication:** N/A (pure helper).
- **Authorization:** N/A.
- **Validation:** None.
- **Errors:** None thrown.
- **Side Effects:** Mutates listener array; calls listener immediately.
- **Edge Cases:** —
- **Security Considerations:** —
- **Current Limitations:** —

### `getConnectionStatus`
- **File:** `src/lib/firebase.ts:107-109`  · **Review:** REVIEWED
- **Purpose:** Returns current connection status.
- **Parameters:** none
- **Returns:** `ConnectionStatus`
- **Dependencies:** none detected
- **Calls:** —
- **Called By:** no in-repo caller resolved (entry point, event handler, route, or referenced by value)
- **Database Interaction:** None.
- **External Services:** None.
- **Authentication:** N/A (pure helper).
- **Authorization:** N/A.
- **Validation:** None.
- **Errors:** None thrown.
- **Side Effects:** None (pure).
- **Edge Cases:** —
- **Security Considerations:** —
- **Current Limitations:** —

### `testConnection`
- **File:** `src/lib/firebase.ts:111-144`  · **Review:** REVIEWED
- **Purpose:** Probes Firestore by `getDocFromServer(test/connection)`; classifies online/offline.
- **Parameters:** none
- **Returns:** `Promise<boolean>`
- **Dependencies:** none detected
- **Calls:** —
- **Called By:** `handleManualRetry` (src/components/OfflineSyncModal.tsx:136)
- **Database Interaction:** READ `test/connection` (denied by rules ⇒ still counted as connected).
- **External Services:** Firestore.
- **Authentication:** N/A (pure helper).
- **Authorization:** N/A.
- **Validation:** None.
- **Errors:** None thrown.
- **Side Effects:** Updates status; notifies listeners.
- **Edge Cases:** A permission-denied error is interpreted as 'connected'.
- **Security Considerations:** —
- **Current Limitations:** Runs at module import and on `online` events.


## src/utils/accountAccess.ts

### `isPlatformOwnerClaim`
- **File:** `src/utils/accountAccess.ts:20-21`  · **Review:** REVIEWED
- **Purpose:** True when `actor.role === 'super_admin'`.
- **Parameters:** `actor: AccountActor | null | undefined`
- **Returns:** `boolean`
- **Dependencies:** none detected
- **Calls:** —
- **Called By:** `accountPatchDenial` (src/utils/accountAccess.ts:29), `accountRoleChangeDenial` (src/utils/accountAccess.ts:48), `isPlatformOwner` (server.ts:622)
- **Database Interaction:** None.
- **External Services:** None.
- **Authentication:** N/A (pure helper).
- **Authorization:** Defines platform-owner test used by server.ts and unit tests.
- **Validation:** None.
- **Errors:** None thrown.
- **Side Effects:** None (pure).
- **Edge Cases:** —
- **Security Considerations:** —
- **Current Limitations:** —

### `accountPatchDenial`
- **File:** `src/utils/accountAccess.ts:29-46`  · **Review:** REVIEWED
- **Purpose:** Decides whether `actor` may modify the `existing` profile.
- **Parameters:** `actor: AccountActor, existing: AccountProfileLike`
- **Returns:** `string | null` — denial message or null.
- **Dependencies:** admin
- **Calls:** `isPlatformOwnerClaim` (src/utils/accountAccess.ts:20)
- **Called By:** `PATCH /api/users/:uid [handler]` (server.ts:2279)
- **Database Interaction:** None.
- **External Services:** None.
- **Authentication:** N/A (pure helper).
- **Authorization:** Denies: unauthenticated actor; touching super_admin unless owner; other-tenant profile unless owner; non-admin modifying an admin.
- **Validation:** Requires `uid`, `role`, `tenantId` on actor.
- **Errors:** None thrown.
- **Side Effects:** None (pure).
- **Edge Cases:** —
- **Security Considerations:** Tested in `accountAccess.test.ts`.
- **Current Limitations:** —

### `accountRoleChangeDenial`
- **File:** `src/utils/accountAccess.ts:48-61`  · **Review:** REVIEWED
- **Purpose:** Decides whether `actor` may assign `nextRole`.
- **Parameters:** `actor, existing, nextRole: string`
- **Returns:** `string | null`
- **Dependencies:** admin
- **Calls:** `isPlatformOwnerClaim` (src/utils/accountAccess.ts:20)
- **Called By:** `PATCH /api/users/:uid [handler]` (server.ts:2279)
- **Database Interaction:** None.
- **External Services:** None.
- **Authentication:** N/A (pure helper).
- **Authorization:** Only admin or platform owner may change roles; role must be in {admin, registrar, teacher, parent}.
- **Validation:** Role allow-list.
- **Errors:** None thrown.
- **Side Effects:** None (pure).
- **Edge Cases:** No-op change ⇒ null.
- **Security Considerations:** —
- **Current Limitations:** —

### `accountUpsertDenial`
- **File:** `src/utils/accountAccess.ts:69-84`  · **Review:** REVIEWED
- **Purpose:** Guards account creation against taking over an existing global Firebase login.
- **Parameters:** `existing: ExistingAccountInfo, targetTenantId: string, allowExisting: boolean`
- **Returns:** `string | null`
- **Dependencies:** none detected
- **Calls:** —
- **Called By:** `upsertManagedAccount` (server.ts:517)
- **Database Interaction:** None.
- **External Services:** None.
- **Authentication:** N/A (pure helper).
- **Authorization:** Denies: platform owner/admins-doc accounts; profile in a different tenant; existing login without opt-in.
- **Validation:** None.
- **Errors:** None thrown.
- **Side Effects:** None (pure).
- **Edge Cases:** —
- **Security Considerations:** Message 'This email is already registered to another school.' discloses that an email exists in another tenant (to admins/registrars creating accounts).
- **Current Limitations:** —


## src/utils/attendanceAccess.ts

### `canManageSettings`
- **File:** `src/utils/attendanceAccess.ts:16-18`  · **Review:** AUTO
- **Purpose:** UNKNOWN (no in-code description; not individually reviewed)
- **Parameters:** `role: UserRole`; `isSuperAdmin: boolean`
- **Returns:** `boolean` (declared)
- **Dependencies:** admin
- **Calls:** no in-repo callees resolved
- **Called By:** `AttendanceProvider` (src/context/AttendanceContext.tsx:326)
- **Database Interaction:** None detected.
- **External Services:** None detected.
- **Authentication:** No authentication logic inside this function.
- **Authorization:** References: `isSuperAdmin`
- **Validation:** None detected.
- **Errors:** None detected.
- **Side Effects:** None detected.
- **Edge Cases:** UNKNOWN (not individually reviewed)
- **Security Considerations:** None noted (not individually reviewed).
- **Current Limitations:** UNKNOWN (not individually reviewed)

### `isElevatedOrSuperAdmin`
- **File:** `src/utils/attendanceAccess.ts:21-23`  · **Review:** AUTO
- **Purpose:** In-code comment: Elevated readers (admin, registrar) plus a platform super admin.
- **Parameters:** `role: UserRole`; `isSuperAdmin: boolean`
- **Returns:** `boolean` (declared)
- **Dependencies:** admin
- **Calls:** no in-repo callees resolved
- **Called By:** `AttendanceProvider` (src/context/AttendanceContext.tsx:326)
- **Database Interaction:** None detected.
- **External Services:** None detected.
- **Authentication:** No authentication logic inside this function.
- **Authorization:** References: `isSuperAdmin`
- **Validation:** None detected.
- **Errors:** None detected.
- **Side Effects:** None detected.
- **Edge Cases:** UNKNOWN (not individually reviewed)
- **Security Considerations:** None noted (not individually reviewed).
- **Current Limitations:** UNKNOWN (not individually reviewed)

### `canWriteSubmittedSessions`
- **File:** `src/utils/attendanceAccess.ts:26-28`  · **Review:** AUTO
- **Purpose:** In-code comment: Submitted sessions are frozen unless the writer is an elevated role.
- **Parameters:** `role: UserRole`
- **Returns:** `boolean` (declared)
- **Dependencies:** none detected
- **Calls:** no in-repo callees resolved
- **Called By:** `AttendanceProvider` (src/context/AttendanceContext.tsx:326)
- **Database Interaction:** None detected.
- **External Services:** None detected.
- **Authentication:** No authentication logic inside this function.
- **Authorization:** No role/permission check inside this function.
- **Validation:** None detected.
- **Errors:** None detected.
- **Side Effects:** None detected.
- **Edge Cases:** UNKNOWN (not individually reviewed)
- **Security Considerations:** None noted (not individually reviewed).
- **Current Limitations:** UNKNOWN (not individually reviewed)

### `canEditSession`
- **File:** `src/utils/attendanceAccess.ts:38-53`  · **Review:** AUTO
- **Purpose:** UNKNOWN (no in-code description; not individually reviewed)
- **Parameters:** `{ role, isSuperAdmin, userId, assignedClasses, session, }: CanEditSessionInput`
- **Returns:** `boolean` (declared)
- **Dependencies:** admin
- **Calls:** no in-repo callees resolved
- **Called By:** `canEditSession` (src/context/AttendanceContext.tsx:1378)
- **Database Interaction:** None detected.
- **External Services:** None detected.
- **Authentication:** No authentication logic inside this function.
- **Authorization:** References: `isSuperAdmin`
- **Validation:** None detected.
- **Errors:** None detected.
- **Side Effects:** None detected.
- **Edge Cases:** UNKNOWN (not individually reviewed)
- **Security Considerations:** None noted (not individually reviewed).
- **Current Limitations:** UNKNOWN (not individually reviewed)

### `isChildOfGuardian`
- **File:** `src/utils/attendanceAccess.ts:56-73`  · **Review:** AUTO
- **Purpose:** In-code comment: A student belongs to a parent when phone, email, or name matches.
- **Parameters:** `user: UserProfile`; `student: Student`
- **Returns:** `boolean` (declared)
- **Dependencies:** none detected
- **Calls:** no in-repo callees resolved
- **Called By:** `isChildOfGuardian` (src/context/AttendanceContext.tsx:1388)
- **Database Interaction:** None detected.
- **External Services:** None detected.
- **Authentication:** No authentication logic inside this function.
- **Authorization:** No role/permission check inside this function.
- **Validation:** None detected.
- **Errors:** None detected.
- **Side Effects:** None detected.
- **Edge Cases:** UNKNOWN (not individually reviewed)
- **Security Considerations:** None noted (not individually reviewed).
- **Current Limitations:** UNKNOWN (not individually reviewed)


## src/utils/auditLogI18n.ts

### `en`
- **File:** `src/utils/auditLogI18n.ts:77-77`  · **Review:** AUTO
- **Purpose:** UNKNOWN (no in-code description; not individually reviewed)
- **Parameters:** `m`
- **Returns:** `string` (inferred)
- **Dependencies:** none detected
- **Calls:** no in-repo callees resolved
- **Called By:** no in-repo caller resolved (entry point, event handler, route, or referenced by value)
- **Database Interaction:** None detected.
- **External Services:** None detected.
- **Authentication:** No authentication logic inside this function.
- **Authorization:** No role/permission check inside this function.
- **Validation:** None detected.
- **Errors:** None detected.
- **Side Effects:** None detected.
- **Edge Cases:** UNKNOWN (not individually reviewed)
- **Security Considerations:** None noted (not individually reviewed).
- **Current Limitations:** UNKNOWN (not individually reviewed)

### `translateAuditAction`
- **File:** `src/utils/auditLogI18n.ts:92-97`  · **Review:** AUTO
- **Purpose:** UNKNOWN (no in-code description; not individually reviewed)
- **Parameters:** `action: string`; `lang: AppLang`
- **Returns:** `string` (declared)
- **Dependencies:** none detected
- **Calls:** no in-repo callees resolved
- **Called By:** `AuditSettingsView` (src/components/AuditSettingsView.tsx:39)
- **Database Interaction:** None detected.
- **External Services:** None detected.
- **Authentication:** No authentication logic inside this function.
- **Authorization:** No role/permission check inside this function.
- **Validation:** None detected.
- **Errors:** None detected.
- **Side Effects:** None detected.
- **Edge Cases:** UNKNOWN (not individually reviewed)
- **Security Considerations:** None noted (not individually reviewed).
- **Current Limitations:** UNKNOWN (not individually reviewed)

### `translateAuditEntity`
- **File:** `src/utils/auditLogI18n.ts:99-104`  · **Review:** AUTO
- **Purpose:** UNKNOWN (no in-code description; not individually reviewed)
- **Parameters:** `entityType: string`; `lang: AppLang`
- **Returns:** `string` (declared)
- **Dependencies:** none detected
- **Calls:** no in-repo callees resolved
- **Called By:** no in-repo caller resolved (entry point, event handler, route, or referenced by value)
- **Database Interaction:** None detected.
- **External Services:** None detected.
- **Authentication:** No authentication logic inside this function.
- **Authorization:** No role/permission check inside this function.
- **Validation:** None detected.
- **Errors:** None detected.
- **Side Effects:** None detected.
- **Edge Cases:** UNKNOWN (not individually reviewed)
- **Security Considerations:** None noted (not individually reviewed).
- **Current Limitations:** UNKNOWN (not individually reviewed)

### `translateAuditRole`
- **File:** `src/utils/auditLogI18n.ts:106-109`  · **Review:** AUTO
- **Purpose:** UNKNOWN (no in-code description; not individually reviewed)
- **Parameters:** `role: string`; `lang: AppLang`
- **Returns:** `string` (declared)
- **Dependencies:** none detected
- **Calls:** no in-repo callees resolved
- **Called By:** `AuditSettingsView` (src/components/AuditSettingsView.tsx:39)
- **Database Interaction:** None detected.
- **External Services:** None detected.
- **Authentication:** No authentication logic inside this function.
- **Authorization:** No role/permission check inside this function.
- **Validation:** None detected.
- **Errors:** None detected.
- **Side Effects:** None detected.
- **Edge Cases:** UNKNOWN (not individually reviewed)
- **Security Considerations:** None noted (not individually reviewed).
- **Current Limitations:** UNKNOWN (not individually reviewed)

### `translateAuditValue`
- **File:** `src/utils/auditLogI18n.ts:116-130`  · **Review:** AUTO
- **Purpose:** In-code comment: Translates a single scalar audit value (status/role/mode/flag) for display. Returns the original value untouched when no known label exists, so dates, names, free text and identifiers flow through unchanged.
- **Parameters:** `value: string | undefined`; `lang: AppLang`
- **Returns:** `string` (declared)
- **Dependencies:** none detected
- **Calls:** no in-repo callees resolved
- **Called By:** `AuditSettingsView` (src/components/AuditSettingsView.tsx:39)
- **Database Interaction:** None detected.
- **External Services:** None detected.
- **Authentication:** No authentication logic inside this function.
- **Authorization:** No role/permission check inside this function.
- **Validation:** None detected.
- **Errors:** None detected.
- **Side Effects:** None detected.
- **Edge Cases:** UNKNOWN (not individually reviewed)
- **Security Considerations:** None noted (not individually reviewed).
- **Current Limitations:** UNKNOWN (not individually reviewed)

### `getAuditDetails`
- **File:** `src/utils/auditLogI18n.ts:137-143`  · **Review:** AUTO
- **Purpose:** In-code comment: Resolves the localized "Action Details" text for an audit entry. Prefers the stored English translation when present, otherwise keeps the original (typically Arabic) text so no entry is ever left blank.
- **Parameters:** `log: Pick<AuditLog, 'details' | 'detailsEn'>`; `lang: AppLang`
- **Returns:** `string` (declared)
- **Dependencies:** none detected
- **Calls:** no in-repo callees resolved
- **Called By:** `AuditSettingsView` (src/components/AuditSettingsView.tsx:39)
- **Database Interaction:** None detected.
- **External Services:** None detected.
- **Authentication:** No authentication logic inside this function.
- **Authorization:** No role/permission check inside this function.
- **Validation:** None detected.
- **Errors:** None detected.
- **Side Effects:** None detected.
- **Edge Cases:** UNKNOWN (not individually reviewed)
- **Security Considerations:** None noted (not individually reviewed).
- **Current Limitations:** UNKNOWN (not individually reviewed)

### `getAuditSearchHaystack`
- **File:** `src/utils/auditLogI18n.ts:146-150`  · **Review:** AUTO
- **Purpose:** In-code comment: Builds a lowercased haystack covering both languages for audit search.
- **Parameters:** `log: AuditLog`
- **Returns:** `string` (declared)
- **Dependencies:** none detected
- **Calls:** no in-repo callees resolved
- **Called By:** `AuditSettingsView` (src/components/AuditSettingsView.tsx:39)
- **Database Interaction:** None detected.
- **External Services:** None detected.
- **Authentication:** No authentication logic inside this function.
- **Authorization:** No role/permission check inside this function.
- **Validation:** None detected.
- **Errors:** None detected.
- **Side Effects:** None detected.
- **Edge Cases:** UNKNOWN (not individually reviewed)
- **Security Considerations:** None noted (not individually reviewed).
- **Current Limitations:** UNKNOWN (not individually reviewed)


## src/utils/digestEngine.ts

### `computeDailyDigestData`
- **File:** `src/utils/digestEngine.ts:12-208`  · **Review:** AUTO
- **Purpose:** UNKNOWN (no in-code description; not individually reviewed)
- **Parameters:** `params: { tenantId: string; tenantName: string; students: Student[]; sessions: AttendanceSession[]; justifications: Justification[]; config: DailyEmailDigestCon`
- **Returns:** `Omit<DailyEmailDigestItem, 'id' | 'dispatchedAt' | 'status' | 'geminiBriefing' | 'htmlContent'>` (declared)
- **Dependencies:** none detected
- **Calls:** no in-repo callees resolved
- **Called By:** `generateCurrentDigest` (src/context/AttendanceContext.tsx:3267)
- **Database Interaction:** None detected.
- **External Services:** None detected.
- **Authentication:** No authentication logic inside this function.
- **Authorization:** No role/permission check inside this function.
- **Validation:** 1 guard/type/regex check(s) detected.
- **Errors:** None detected.
- **Side Effects:** None detected.
- **Edge Cases:** UNKNOWN (not individually reviewed)
- **Security Considerations:** None noted (not individually reviewed).
- **Current Limitations:** UNKNOWN (not individually reviewed)

### `generateHtmlEmailTemplate`
- **File:** `src/utils/digestEngine.ts:210-448`  · **Review:** AUTO
- **Purpose:** UNKNOWN (no in-code description; not individually reviewed)
- **Parameters:** `digest: DailyEmailDigestItem`; `tenantName: string`
- **Returns:** `string` (declared)
- **Dependencies:** none detected
- **Calls:** no in-repo callees resolved
- **Called By:** `generateCurrentDigest` (src/context/AttendanceContext.tsx:3267)
- **Database Interaction:** None detected.
- **External Services:** None detected.
- **Authentication:** No authentication logic inside this function.
- **Authorization:** No role/permission check inside this function.
- **Validation:** None detected.
- **Errors:** None detected.
- **Side Effects:** None detected.
- **Edge Cases:** UNKNOWN (not individually reviewed)
- **Security Considerations:** None noted (not individually reviewed).
- **Current Limitations:** UNKNOWN (not individually reviewed)


## src/utils/holidayUtils.ts

### `isSchoolOffDay`
- **File:** `src/utils/holidayUtils.ts:93-141`  · **Review:** AUTO
- **Purpose:** In-code comment: Checks whether a given date is an official school off-day (either a weekly weekend or official holiday).
- **Parameters:** `dateStr: string`; `weekendDays: number[] = DEFAULT_WEEKEND_DAYS`; `officialHolidays: OfficialHoliday[] = DEFAULT_OFFICIAL_HOLIDAYS`
- **Returns:** `OffDayCheckResult` (declared)
- **Dependencies:** none detected
- **Calls:** no in-repo callees resolved
- **Called By:** `getSchoolWeekDays` (src/utils/holidayUtils.ts:161), `countActiveSchoolDays` (src/utils/holidayUtils.ts:220), `isOffDay` (src/context/AttendanceContext.tsx:1152), `WeeklyAttendanceTrendCard` (src/components/WeeklyAttendanceTrendCard.tsx:49), `getSchoolDaysInRange` (src/components/students/StudentAbsenceDrawer.tsx:272), `getSchoolDaysInRange` (src/components/StudentAbsenceInquiryView.tsx:317)
- **Database Interaction:** None detected.
- **External Services:** None detected.
- **Authentication:** No authentication logic inside this function.
- **Authorization:** No role/permission check inside this function.
- **Validation:** 1 guard/type/regex check(s) detected.
- **Errors:** None detected.
- **Side Effects:** None detected.
- **Edge Cases:** UNKNOWN (not individually reviewed)
- **Security Considerations:** None noted (not individually reviewed).
- **Current Limitations:** UNKNOWN (not individually reviewed)

### `getSchoolWeekDays`
- **File:** `src/utils/holidayUtils.ts:161-215`  · **Review:** AUTO
- **Purpose:** UNKNOWN (no in-code description; not individually reviewed)
- **Parameters:** `referenceDateInput: string | Date = new Date()`; `weekendDays: number[] = DEFAULT_WEEKEND_DAYS`; `officialHolidays: OfficialHoliday[] = DEFAULT_OFFICIAL_HOLIDAYS`
- **Returns:** `SchoolDaySlot[]` (declared)
- **Dependencies:** none detected
- **Calls:** `isSchoolOffDay` (src/utils/holidayUtils.ts:93)
- **Called By:** `WeeklyAttendanceTrendCard` (src/components/WeeklyAttendanceTrendCard.tsx:49)
- **Database Interaction:** None detected.
- **External Services:** None detected.
- **Authentication:** No authentication logic inside this function.
- **Authorization:** No role/permission check inside this function.
- **Validation:** 1 guard/type/regex check(s) detected.
- **Errors:** None detected.
- **Side Effects:** React state: `setDate`
- **Edge Cases:** UNKNOWN (not individually reviewed)
- **Security Considerations:** None noted (not individually reviewed).
- **Current Limitations:** UNKNOWN (not individually reviewed)

### `countActiveSchoolDays`
- **File:** `src/utils/holidayUtils.ts:220-243`  · **Review:** AUTO
- **Purpose:** In-code comment: Counts the active school days between two dates, excluding weekends and official holidays.
- **Parameters:** `startDateStr: string`; `endDateStr: string`; `weekendDays: number[] = DEFAULT_WEEKEND_DAYS`; `officialHolidays: OfficialHoliday[] = DEFAULT_OFFICIAL_HOLIDAYS`
- **Returns:** `number` (declared)
- **Dependencies:** none detected
- **Calls:** `isSchoolOffDay` (src/utils/holidayUtils.ts:93)
- **Called By:** no in-repo caller resolved (entry point, event handler, route, or referenced by value)
- **Database Interaction:** None detected.
- **External Services:** None detected.
- **Authentication:** No authentication logic inside this function.
- **Authorization:** No role/permission check inside this function.
- **Validation:** 1 guard/type/regex check(s) detected.
- **Errors:** None detected.
- **Side Effects:** React state: `setDate`
- **Edge Cases:** UNKNOWN (not individually reviewed)
- **Security Considerations:** None noted (not individually reviewed).
- **Current Limitations:** UNKNOWN (not individually reviewed)

### `getHolidayDisplayName`
- **File:** `src/utils/holidayUtils.ts:245-248`  · **Review:** AUTO
- **Purpose:** UNKNOWN (no in-code description; not individually reviewed)
- **Parameters:** `holiday: OfficialHoliday`; `lang: 'ar' | 'en' = 'ar'`
- **Returns:** `string` (declared)
- **Dependencies:** none detected
- **Calls:** no in-repo callees resolved
- **Called By:** `SmartHolidayImportModal` (src/components/settings/SmartHolidayImportModal.tsx:38), `HolidaysAndWeekendsCard` (src/components/settings/HolidaysAndWeekendsCard.tsx:49)
- **Database Interaction:** None detected.
- **External Services:** None detected.
- **Authentication:** No authentication logic inside this function.
- **Authorization:** No role/permission check inside this function.
- **Validation:** None detected.
- **Errors:** None detected.
- **Side Effects:** None detected.
- **Edge Cases:** UNKNOWN (not individually reviewed)
- **Security Considerations:** None noted (not individually reviewed).
- **Current Limitations:** UNKNOWN (not individually reviewed)

### `getHolidaySecondaryName`
- **File:** `src/utils/holidayUtils.ts:250-253`  · **Review:** AUTO
- **Purpose:** UNKNOWN (no in-code description; not individually reviewed)
- **Parameters:** `holiday: OfficialHoliday`; `lang: 'ar' | 'en' = 'ar'`
- **Returns:** `string | undefined` (declared)
- **Dependencies:** none detected
- **Calls:** no in-repo callees resolved
- **Called By:** `SmartHolidayImportModal` (src/components/settings/SmartHolidayImportModal.tsx:38), `HolidaysAndWeekendsCard` (src/components/settings/HolidaysAndWeekendsCard.tsx:49)
- **Database Interaction:** None detected.
- **External Services:** None detected.
- **Authentication:** No authentication logic inside this function.
- **Authorization:** No role/permission check inside this function.
- **Validation:** None detected.
- **Errors:** None detected.
- **Side Effects:** None detected.
- **Edge Cases:** UNKNOWN (not individually reviewed)
- **Security Considerations:** None noted (not individually reviewed).
- **Current Limitations:** UNKNOWN (not individually reviewed)

### `getHolidayTypeLabel`
- **File:** `src/utils/holidayUtils.ts:255-269`  · **Review:** AUTO
- **Purpose:** UNKNOWN (no in-code description; not individually reviewed)
- **Parameters:** `type: HolidayType`; `lang: 'ar' | 'en' = 'ar'`
- **Returns:** `string` (declared)
- **Dependencies:** none detected
- **Calls:** no in-repo callees resolved
- **Called By:** `SmartHolidayImportModal` (src/components/settings/SmartHolidayImportModal.tsx:38), `HolidaysAndWeekendsCard` (src/components/settings/HolidaysAndWeekendsCard.tsx:49)
- **Database Interaction:** None detected.
- **External Services:** None detected.
- **Authentication:** No authentication logic inside this function.
- **Authorization:** No role/permission check inside this function.
- **Validation:** None detected.
- **Errors:** None detected.
- **Side Effects:** None detected.
- **Edge Cases:** UNKNOWN (not individually reviewed)
- **Security Considerations:** None noted (not individually reviewed).
- **Current Limitations:** UNKNOWN (not individually reviewed)


## src/utils/localCache.ts

### `getStorage`
- **File:** `src/utils/localCache.ts:40-46`  · **Review:** AUTO
- **Purpose:** UNKNOWN (no in-code description; not individually reviewed)
- **Parameters:** none
- **Returns:** `Storage | null` (declared)
- **Dependencies:** none detected
- **Calls:** no in-repo callees resolved
- **Called By:** `getItem` (src/utils/localCache.ts:49), `setItem` (src/utils/localCache.ts:60), `removeItem` (src/utils/localCache.ts:75), `purgeLegacySensitive` (src/utils/localCache.ts:93)
- **Database Interaction:** None detected.
- **External Services:** None detected.
- **Authentication:** No authentication logic inside this function.
- **Authorization:** No role/permission check inside this function.
- **Validation:** 1 guard/type/regex check(s) detected.
- **Errors:** 1 try/catch
- **Side Effects:** local storage/cache
- **Edge Cases:** UNKNOWN (not individually reviewed)
- **Security Considerations:** None noted (not individually reviewed).
- **Current Limitations:** UNKNOWN (not individually reviewed)

### `getItem`
- **File:** `src/utils/localCache.ts:49-58`  · **Review:** REVIEWED
- **Purpose:** Reads from in-memory map, else localStorage for allow-listed keys.
- **Parameters:** `key`
- **Returns:** `string | null`
- **Dependencies:** none detected
- **Calls:** `getStorage` (src/utils/localCache.ts:40)
- **Called By:** `AttendanceProvider` (src/context/AttendanceContext.tsx:326)
- **Database Interaction:** None.
- **External Services:** None.
- **Authentication:** N/A (pure helper).
- **Authorization:** N/A.
- **Validation:** None.
- **Errors:** None thrown.
- **Side Effects:** None (pure).
- **Edge Cases:** —
- **Security Considerations:** —
- **Current Limitations:** —

### `setItem`
- **File:** `src/utils/localCache.ts:60-73`  · **Review:** REVIEWED
- **Purpose:** Stores in memory; persists to localStorage only for `school_current_tenant_id`, `school_current_user_role`, `school_dynamic_tenants`.
- **Parameters:** `key, value`
- **Returns:** void
- **Dependencies:** none detected
- **Calls:** `getStorage` (src/utils/localCache.ts:40)
- **Called By:** `AttendanceProvider` (src/context/AttendanceContext.tsx:326), `setTenantId` (src/context/AttendanceContext.tsx:366), `setUserRole` (src/context/AttendanceContext.tsx:373), `syncTenantsWithServer` (src/context/AttendanceContext.tsx:431), `createUser` (src/context/AttendanceContext.tsx:1495), `updateUser` (src/context/AttendanceContext.tsx:1592), `deleteUser` (src/context/AttendanceContext.tsx:1645), `addBehaviourIncident` (src/context/AttendanceContext.tsx:1695), `retryNotification` (src/context/AttendanceContext.tsx:2324), `retryAllFailedNotifications` (src/context/AttendanceContext.tsx:2451) … (+9)
- **Database Interaction:** None.
- **External Services:** None.
- **Authentication:** N/A (pure helper).
- **Authorization:** N/A.
- **Validation:** None.
- **Errors:** None thrown.
- **Side Effects:** None (pure).
- **Edge Cases:** —
- **Security Considerations:** All personal data keys stay memory-only (positive). The persisted `school_current_user_role` is client-editable UI state.
- **Current Limitations:** Data cached only in memory is lost on reload (e.g. behaviour incidents, digest config/history).

### `removeItem`
- **File:** `src/utils/localCache.ts:75-87`  · **Review:** AUTO
- **Purpose:** UNKNOWN (no in-code description; not individually reviewed)
- **Parameters:** `key: string`
- **Returns:** `void` (declared)
- **Dependencies:** none detected
- **Calls:** `getStorage` (src/utils/localCache.ts:40)
- **Called By:** no in-repo caller resolved (entry point, event handler, route, or referenced by value)
- **Database Interaction:** None detected.
- **External Services:** None detected.
- **Authentication:** No authentication logic inside this function.
- **Authorization:** No role/permission check inside this function.
- **Validation:** None detected.
- **Errors:** 1 try/catch
- **Side Effects:** None detected.
- **Edge Cases:** UNKNOWN (not individually reviewed)
- **Security Considerations:** None noted (not individually reviewed).
- **Current Limitations:** UNKNOWN (not individually reviewed)

### `purgeLegacySensitive`
- **File:** `src/utils/localCache.ts:93-105`  · **Review:** REVIEWED
- **Purpose:** Deletes legacy cleartext keys from localStorage at import.
- **Parameters:** none
- **Returns:** void
- **Dependencies:** none detected
- **Calls:** `getStorage` (src/utils/localCache.ts:40)
- **Called By:** no in-repo caller resolved (entry point, event handler, route, or referenced by value)
- **Database Interaction:** None.
- **External Services:** None.
- **Authentication:** N/A (pure helper).
- **Authorization:** N/A.
- **Validation:** None.
- **Errors:** None thrown.
- **Side Effects:** localStorage removals.
- **Edge Cases:** —
- **Security Considerations:** —
- **Current Limitations:** —


## src/utils/messagingProviders.ts

### `normalizePhone`
- **File:** `src/utils/messagingProviders.ts:58-63`  · **Review:** REVIEWED
- **Purpose:** Digits-only phone; strips leading 00.
- **Parameters:** `raw`
- **Returns:** `string`
- **Dependencies:** none detected
- **Calls:** —
- **Called By:** `sendSms` (src/utils/messagingProviders.ts:88), `sendViaTwilio` (src/utils/messagingProviders.ts:120), `sendWhatsAppCloudMessage` (src/utils/messagingProviders.ts:281)
- **Database Interaction:** None.
- **External Services:** None.
- **Authentication:** N/A (pure helper).
- **Authorization:** N/A.
- **Validation:** None.
- **Errors:** None thrown.
- **Side Effects:** None (pure).
- **Edge Cases:** —
- **Security Considerations:** —
- **Current Limitations:** —

### `result`
- **File:** `src/utils/messagingProviders.ts:65-67`  · **Review:** REVIEWED
- **Purpose:** Builds a failed `ProviderDispatchResult`.
- **Parameters:** `provider, partial`
- **Returns:** `ProviderDispatchResult`
- **Dependencies:** none detected
- **Calls:** —
- **Called By:** `sendSms` (src/utils/messagingProviders.ts:88), `sendViaTwilio` (src/utils/messagingProviders.ts:120), `sendViaUnifonic` (src/utils/messagingProviders.ts:161), `sendViaMsegat` (src/utils/messagingProviders.ts:202), `sendViaTaqnyat` (src/utils/messagingProviders.ts:242), `sendWhatsAppCloudMessage` (src/utils/messagingProviders.ts:281), `sendEmail` (src/utils/messagingProviders.ts:333), `sendViaSmtp` (src/utils/messagingProviders.ts:363), `sendViaResend` (src/utils/messagingProviders.ts:398), `sendViaSendGrid` (src/utils/messagingProviders.ts:430)
- **Database Interaction:** None.
- **External Services:** None.
- **Authentication:** N/A (pure helper).
- **Authorization:** N/A.
- **Validation:** None.
- **Errors:** None thrown.
- **Side Effects:** None (pure).
- **Edge Cases:** —
- **Security Considerations:** —
- **Current Limitations:** —

### `requestWithTimeout`
- **File:** `src/utils/messagingProviders.ts:69-81`  · **Review:** REVIEWED
- **Purpose:** fetch with AbortController timeout.
- **Parameters:** `url, init, timeoutMs`
- **Returns:** `Promise<Response>`
- **Dependencies:** none detected
- **Calls:** —
- **Called By:** `sendViaTwilio` (src/utils/messagingProviders.ts:120), `sendViaUnifonic` (src/utils/messagingProviders.ts:161), `sendViaMsegat` (src/utils/messagingProviders.ts:202), `sendViaTaqnyat` (src/utils/messagingProviders.ts:242), `sendWhatsAppCloudMessage` (src/utils/messagingProviders.ts:281), `sendViaResend` (src/utils/messagingProviders.ts:398), `sendViaSendGrid` (src/utils/messagingProviders.ts:430)
- **Database Interaction:** None.
- **External Services:** Outbound HTTPS.
- **Authentication:** N/A (pure helper).
- **Authorization:** N/A.
- **Validation:** None.
- **Errors:** Abort ⇒ rejects.
- **Side Effects:** None (pure).
- **Edge Cases:** —
- **Security Considerations:** —
- **Current Limitations:** —

### `errorText`
- **File:** `src/utils/messagingProviders.ts:83-86`  · **Review:** REVIEWED
- **Purpose:** Human message from an error (timeout aware).
- **Parameters:** `err`
- **Returns:** `string`
- **Dependencies:** none detected
- **Calls:** —
- **Called By:** `sendSms` (src/utils/messagingProviders.ts:88), `sendWhatsAppCloudMessage` (src/utils/messagingProviders.ts:281), `sendEmail` (src/utils/messagingProviders.ts:333)
- **Database Interaction:** None.
- **External Services:** None.
- **Authentication:** N/A (pure helper).
- **Authorization:** N/A.
- **Validation:** None.
- **Errors:** None thrown.
- **Side Effects:** None (pure).
- **Edge Cases:** —
- **Security Considerations:** —
- **Current Limitations:** —

### `sendSms`
- **File:** `src/utils/messagingProviders.ts:88-118`  · **Review:** REVIEWED
- **Purpose:** Validates and routes an SMS to Twilio/Unifonic/Msegat/Taqnyat.
- **Parameters:** `input: SmsSendInput`
- **Returns:** `Promise<ProviderDispatchResult>`
- **Dependencies:** none detected
- **Calls:** `normalizePhone` (src/utils/messagingProviders.ts:58), `result` (src/utils/messagingProviders.ts:65), `sendViaTwilio` (src/utils/messagingProviders.ts:120), `sendViaUnifonic` (src/utils/messagingProviders.ts:161), `sendViaMsegat` (src/utils/messagingProviders.ts:202), `sendViaTaqnyat` (src/utils/messagingProviders.ts:242), `errorText` (src/utils/messagingProviders.ts:83)
- **Called By:** `POST /api/notifications/dispatch [handler]` (server.ts:1497)
- **Database Interaction:** None.
- **External Services:** Provider HTTPS APIs.
- **Authentication:** N/A (pure helper).
- **Authorization:** N/A.
- **Validation:** Non-empty normalised phone and body.
- **Errors:** Never throws; failures returned `{ ok:false, error }`.
- **Side Effects:** Sends SMS.
- **Edge Cases:** —
- **Security Considerations:** —
- **Current Limitations:** —

### `sendViaTwilio`
- **File:** `src/utils/messagingProviders.ts:120-159`  · **Review:** REVIEWED
- **Purpose:** Sends one SMS via Twilio.
- **Parameters:** `input, to, timeoutMs`
- **Returns:** `Promise<ProviderDispatchResult>`
- **Dependencies:** none detected
- **Calls:** `normalizePhone` (src/utils/messagingProviders.ts:58), `result` (src/utils/messagingProviders.ts:65), `requestWithTimeout` (src/utils/messagingProviders.ts:69)
- **Called By:** `sendSms` (src/utils/messagingProviders.ts:88)
- **Database Interaction:** None.
- **External Services:** POST https://api.twilio.com/2010-04-01/Accounts/{sid}/Messages.json
- **Authentication:** N/A (pure helper).
- **Authorization:** N/A.
- **Validation:** Provider credentials required.
- **Errors:** Provider error message surfaced in result.
- **Side Effects:** Sends SMS.
- **Edge Cases:** —
- **Security Considerations:** Credentials come from the tenant gateway config.
- **Current Limitations:** —

### `sendViaUnifonic`
- **File:** `src/utils/messagingProviders.ts:161-200`  · **Review:** REVIEWED
- **Purpose:** Sends one SMS via Unifonic.
- **Parameters:** `input, to, timeoutMs`
- **Returns:** `Promise<ProviderDispatchResult>`
- **Dependencies:** none detected
- **Calls:** `result` (src/utils/messagingProviders.ts:65), `requestWithTimeout` (src/utils/messagingProviders.ts:69)
- **Called By:** `sendSms` (src/utils/messagingProviders.ts:88)
- **Database Interaction:** None.
- **External Services:** POST https://el.cloud.unifonic.com/rest/SMS/messages
- **Authentication:** N/A (pure helper).
- **Authorization:** N/A.
- **Validation:** Provider credentials required.
- **Errors:** Provider error message surfaced in result.
- **Side Effects:** Sends SMS.
- **Edge Cases:** —
- **Security Considerations:** Credentials come from the tenant gateway config.
- **Current Limitations:** —

### `sendViaMsegat`
- **File:** `src/utils/messagingProviders.ts:202-240`  · **Review:** REVIEWED
- **Purpose:** Sends one SMS via Msegat.
- **Parameters:** `input, to, timeoutMs`
- **Returns:** `Promise<ProviderDispatchResult>`
- **Dependencies:** none detected
- **Calls:** `result` (src/utils/messagingProviders.ts:65), `requestWithTimeout` (src/utils/messagingProviders.ts:69)
- **Called By:** `sendSms` (src/utils/messagingProviders.ts:88)
- **Database Interaction:** None.
- **External Services:** POST https://www.msegat.com/gw/sendsms.php
- **Authentication:** N/A (pure helper).
- **Authorization:** N/A.
- **Validation:** Provider credentials required.
- **Errors:** Provider error message surfaced in result.
- **Side Effects:** Sends SMS.
- **Edge Cases:** —
- **Security Considerations:** Credentials come from the tenant gateway config.
- **Current Limitations:** —

### `sendViaTaqnyat`
- **File:** `src/utils/messagingProviders.ts:242-279`  · **Review:** REVIEWED
- **Purpose:** Sends one SMS via Taqnyat.
- **Parameters:** `input, to, timeoutMs`
- **Returns:** `Promise<ProviderDispatchResult>`
- **Dependencies:** none detected
- **Calls:** `result` (src/utils/messagingProviders.ts:65), `requestWithTimeout` (src/utils/messagingProviders.ts:69)
- **Called By:** `sendSms` (src/utils/messagingProviders.ts:88)
- **Database Interaction:** None.
- **External Services:** POST https://api.taqnyat.sa/v1/messages
- **Authentication:** N/A (pure helper).
- **Authorization:** N/A.
- **Validation:** Provider credentials required.
- **Errors:** Provider error message surfaced in result.
- **Side Effects:** Sends SMS.
- **Edge Cases:** —
- **Security Considerations:** Credentials come from the tenant gateway config.
- **Current Limitations:** —

### `sendWhatsAppCloudMessage`
- **File:** `src/utils/messagingProviders.ts:281-331`  · **Review:** REVIEWED
- **Purpose:** Sends a WhatsApp text via Meta Graph API v21.0.
- **Parameters:** `input: WhatsAppCloudInput`
- **Returns:** `Promise<ProviderDispatchResult>`
- **Dependencies:** none detected
- **Calls:** `normalizePhone` (src/utils/messagingProviders.ts:58), `result` (src/utils/messagingProviders.ts:65), `requestWithTimeout` (src/utils/messagingProviders.ts:69), `errorText` (src/utils/messagingProviders.ts:83)
- **Called By:** `POST /api/notifications/dispatch [handler]` (server.ts:1497)
- **Database Interaction:** None.
- **External Services:** POST https://graph.facebook.com/v21.0/{phoneNumberId}/messages
- **Authentication:** N/A (pure helper).
- **Authorization:** N/A.
- **Validation:** phoneNumberId, accessToken, recipient required.
- **Errors:** None thrown.
- **Side Effects:** Sends message.
- **Edge Cases:** Text-only; no template messages (outside the 24 h window WhatsApp Business rejects free-form text).
- **Security Considerations:** —
- **Current Limitations:** —

### `sendEmail`
- **File:** `src/utils/messagingProviders.ts:333-361`  · **Review:** REVIEWED
- **Purpose:** Validates and routes email to SMTP/Resend/SendGrid.
- **Parameters:** `input: EmailSendInput`
- **Returns:** `Promise<ProviderDispatchResult>`
- **Dependencies:** none detected
- **Calls:** `result` (src/utils/messagingProviders.ts:65), `sendViaSmtp` (src/utils/messagingProviders.ts:363), `sendViaResend` (src/utils/messagingProviders.ts:398), `sendViaSendGrid` (src/utils/messagingProviders.ts:430), `errorText` (src/utils/messagingProviders.ts:83)
- **Called By:** `POST /api/daily-digest/dispatch [handler]` (server.ts:1405)
- **Database Interaction:** None.
- **External Services:** None.
- **Authentication:** N/A (pure helper).
- **Authorization:** N/A.
- **Validation:** Recipients must contain '@'; subject and html required.
- **Errors:** None thrown.
- **Side Effects:** Sends email.
- **Edge Cases:** —
- **Security Considerations:** —
- **Current Limitations:** —

### `sendViaSmtp`
- **File:** `src/utils/messagingProviders.ts:363-396`  · **Review:** REVIEWED
- **Purpose:** Sends via nodemailer using tenant SMTP settings.
- **Parameters:** `input, recipients, timeoutMs`
- **Returns:** `Promise<ProviderDispatchResult>`
- **Dependencies:** nodemailer
- **Calls:** `result` (src/utils/messagingProviders.ts:65)
- **Called By:** `sendEmail` (src/utils/messagingProviders.ts:333)
- **Database Interaction:** None.
- **External Services:** Connects to tenant-supplied SMTP host:port.
- **Authentication:** N/A (pure helper).
- **Authorization:** N/A.
- **Validation:** Host and from-address required.
- **Errors:** None thrown.
- **Side Effects:** Network connection to arbitrary host.
- **Edge Cases:** —
- **Security Considerations:** Host/port are tenant-admin supplied ⇒ outbound connections to arbitrary hosts from the server (SEC-12).
- **Current Limitations:** —

### `sendViaResend`
- **File:** `src/utils/messagingProviders.ts:398-428`  · **Review:** REVIEWED
- **Purpose:** Sends via Resend API.
- **Parameters:** `input, recipients, timeoutMs`
- **Returns:** `Promise<ProviderDispatchResult>`
- **Dependencies:** none detected
- **Calls:** `result` (src/utils/messagingProviders.ts:65), `requestWithTimeout` (src/utils/messagingProviders.ts:69)
- **Called By:** `sendEmail` (src/utils/messagingProviders.ts:333)
- **Database Interaction:** None.
- **External Services:** POST https://api.resend.com/emails
- **Authentication:** N/A (pure helper).
- **Authorization:** N/A.
- **Validation:** None.
- **Errors:** None thrown.
- **Side Effects:** None (pure).
- **Edge Cases:** —
- **Security Considerations:** —
- **Current Limitations:** —

### `sendViaSendGrid`
- **File:** `src/utils/messagingProviders.ts:430-460`  · **Review:** REVIEWED
- **Purpose:** Sends via SendGrid v3 API.
- **Parameters:** `input, recipients, timeoutMs`
- **Returns:** `Promise<ProviderDispatchResult>`
- **Dependencies:** none detected
- **Calls:** `result` (src/utils/messagingProviders.ts:65), `requestWithTimeout` (src/utils/messagingProviders.ts:69)
- **Called By:** `sendEmail` (src/utils/messagingProviders.ts:333)
- **Database Interaction:** None.
- **External Services:** POST https://api.sendgrid.com/v3/mail/send
- **Authentication:** N/A (pure helper).
- **Authorization:** N/A.
- **Validation:** None.
- **Errors:** Returns raw provider response text as the error.
- **Side Effects:** None (pure).
- **Edge Cases:** —
- **Security Considerations:** —
- **Current Limitations:** —


## src/utils/modalA11y.ts

### `isEscapeKey`
- **File:** `src/utils/modalA11y.ts:18-20`  · **Review:** AUTO
- **Purpose:** UNKNOWN (no in-code description; not individually reviewed)
- **Parameters:** `key: string`
- **Returns:** `boolean` (declared)
- **Dependencies:** none detected
- **Calls:** no in-repo callees resolved
- **Called By:** `resolveDialogKeyAction` (src/utils/modalA11y.ts:44)
- **Database Interaction:** None detected.
- **External Services:** None detected.
- **Authentication:** No authentication logic inside this function.
- **Authorization:** No role/permission check inside this function.
- **Validation:** None detected.
- **Errors:** None detected.
- **Side Effects:** None detected.
- **Edge Cases:** UNKNOWN (not individually reviewed)
- **Security Considerations:** None noted (not individually reviewed).
- **Current Limitations:** UNKNOWN (not individually reviewed)

### `isTabKey`
- **File:** `src/utils/modalA11y.ts:22-24`  · **Review:** AUTO
- **Purpose:** UNKNOWN (no in-code description; not individually reviewed)
- **Parameters:** `key: string`
- **Returns:** `boolean` (declared)
- **Dependencies:** none detected
- **Calls:** no in-repo callees resolved
- **Called By:** `resolveDialogKeyAction` (src/utils/modalA11y.ts:44)
- **Database Interaction:** None detected.
- **External Services:** None detected.
- **Authentication:** No authentication logic inside this function.
- **Authorization:** No role/permission check inside this function.
- **Validation:** None detected.
- **Errors:** None detected.
- **Side Effects:** None detected.
- **Edge Cases:** UNKNOWN (not individually reviewed)
- **Security Considerations:** None noted (not individually reviewed).
- **Current Limitations:** UNKNOWN (not individually reviewed)

### `resolveDialogKeyAction`
- **File:** `src/utils/modalA11y.ts:44-51`  · **Review:** AUTO
- **Purpose:** In-code comment: Decides what a keydown inside an open dialog should do. - Escape always closes. - Tab cycles focus, but only when there is something to focus. - Everything else is left to the element.
- **Parameters:** `event: DialogKeyEvent`; `context: DialogKeyContext`
- **Returns:** `DialogKeyAction` (declared)
- **Dependencies:** none detected
- **Calls:** `isEscapeKey` (src/utils/modalA11y.ts:18), `isTabKey` (src/utils/modalA11y.ts:22)
- **Called By:** `handleKeyDown` (src/hooks/useModalAccessibility.ts:33)
- **Database Interaction:** None detected.
- **External Services:** None detected.
- **Authentication:** No authentication logic inside this function.
- **Authorization:** No role/permission check inside this function.
- **Validation:** None detected.
- **Errors:** None detected.
- **Side Effects:** None detected.
- **Edge Cases:** UNKNOWN (not individually reviewed)
- **Security Considerations:** None noted (not individually reviewed).
- **Current Limitations:** UNKNOWN (not individually reviewed)

### `nextFocusIndex`
- **File:** `src/utils/modalA11y.ts:58-63`  · **Review:** AUTO
- **Purpose:** In-code comment: Next focusable index with wraparound. Returns -1 when there is nothing to focus. When focus is outside the list (currentIndex < 0), Tab starts at the first element and Shift+Tab starts at the last.
- **Parameters:** `currentIndex: number`; `count: number`; `shiftKey: boolean`
- **Returns:** `number` (declared)
- **Dependencies:** none detected
- **Calls:** no in-repo callees resolved
- **Called By:** `handleKeyDown` (src/hooks/useModalAccessibility.ts:33)
- **Database Interaction:** None detected.
- **External Services:** None detected.
- **Authentication:** No authentication logic inside this function.
- **Authorization:** No role/permission check inside this function.
- **Validation:** None detected.
- **Errors:** None detected.
- **Side Effects:** None detected.
- **Edge Cases:** UNKNOWN (not individually reviewed)
- **Security Considerations:** None noted (not individually reviewed).
- **Current Limitations:** UNKNOWN (not individually reviewed)

### `getFocusableElements`
- **File:** `src/utils/modalA11y.ts:65-70`  · **Review:** AUTO
- **Purpose:** UNKNOWN (no in-code description; not individually reviewed)
- **Parameters:** `root: ParentNode | null | undefined`
- **Returns:** `HTMLElement[]` (declared)
- **Dependencies:** none detected
- **Calls:** no in-repo callees resolved
- **Called By:** `useModalAccessibility` (src/hooks/useModalAccessibility.ts:17), `handleKeyDown` (src/hooks/useModalAccessibility.ts:33)
- **Database Interaction:** None detected.
- **External Services:** None detected.
- **Authentication:** No authentication logic inside this function.
- **Authorization:** No role/permission check inside this function.
- **Validation:** 2 guard/type/regex check(s) detected.
- **Errors:** None detected.
- **Side Effects:** None detected.
- **Edge Cases:** UNKNOWN (not individually reviewed)
- **Security Considerations:** None noted (not individually reviewed).
- **Current Limitations:** UNKNOWN (not individually reviewed)


## src/utils/pdfExport.ts

### `fetchNativePdfBlob`
- **File:** `src/utils/pdfExport.ts:8-61`  · **Review:** REVIEWED
- **Purpose:** POSTs HTML to `/api/pdf/generate` and returns a PDF Blob (validates `%PDF` header).
- **Parameters:** `{ htmlContent, title, filename }`
- **Returns:** `Promise<Blob>`
- **Dependencies:** none detected
- **Calls:** `authenticatedFetch` (src/lib/api.ts:46)
- **Called By:** `downloadNativePdfFromHtml` (src/utils/pdfExport.ts:66), `printNativePdfFromHtml` (src/utils/pdfExport.ts:104)
- **Database Interaction:** None.
- **External Services:** POST /api/pdf/generate
- **Authentication:** Bearer via `authenticatedFetch`.
- **Authorization:** N/A.
- **Validation:** None.
- **Errors:** Throws on non-OK, invalid payload, empty or non-PDF data.
- **Side Effects:** None (pure).
- **Edge Cases:** —
- **Security Considerations:** —
- **Current Limitations:** —

### `downloadNativePdfFromHtml`
- **File:** `src/utils/pdfExport.ts:66-98`  · **Review:** AUTO
- **Purpose:** In-code comment: Generates and downloads native vector PDF with selectable Arabic text and Cairo/Amiri fonts.
- **Parameters:** `options: { htmlContent: string; title: string; filename: string; }`
- **Returns:** `Promise<boolean>` (declared)
- **Dependencies:** none detected
- **Calls:** `fetchNativePdfBlob` (src/utils/pdfExport.ts:8)
- **Called By:** `handleExportVectorPdf` (src/components/attendance/EmergencyRosterModal.tsx:104), `handleDownloadVectorPdf` (src/components/StudentQRCodeModal.tsx:182), `handleDownloadVectorPdf` (src/components/BatchQRModal.tsx:75), `handleDownloadPdf` (src/components/students/StudentAbsenceDrawer.tsx:666), `handleDownloadVectorPdf` (src/components/OfficialReportModal.tsx:64), `handleDownloadPdf` (src/components/reports/BatchPrintCenterModal.tsx:40), `handleExportVectorPdf` (src/components/EmergencyRosterView.tsx:85), `handleDownloadPdf` (src/components/StudentAbsenceInquiryView.tsx:732)
- **Database Interaction:** None detected.
- **External Services:** None detected.
- **Authentication:** No authentication logic inside this function.
- **Authorization:** No role/permission check inside this function.
- **Validation:** None detected.
- **Errors:** 1 try/catch
- **Side Effects:** React state: `setTimeout`; console output; DOM/window access
- **Edge Cases:** UNKNOWN (not individually reviewed)
- **Security Considerations:** Uses `any` typing.
- **Current Limitations:** UNKNOWN (not individually reviewed)

### `printNativePdfFromHtml`
- **File:** `src/utils/pdfExport.ts:104-167`  · **Review:** AUTO
- **Purpose:** In-code comment: Generates a clean vector Arabic PDF on the server and opens it directly for printing in an isolated frame/window. This guarantees that printing never captures background webpage screenshots.
- **Parameters:** `options: { htmlContent: string; title: string; }`
- **Returns:** `Promise<boolean>` (declared)
- **Dependencies:** none detected
- **Calls:** `fetchNativePdfBlob` (src/utils/pdfExport.ts:8)
- **Called By:** `handlePrintDirect` (src/components/attendance/EmergencyRosterModal.tsx:124), `handlePrint` (src/components/StudentQRCodeModal.tsx:195), `handlePrint` (src/components/BatchQRModal.tsx:88), `handlePrint` (src/components/students/StudentAbsenceDrawer.tsx:703), `handleBrowserPrint` (src/components/OfficialReportModal.tsx:85), `handlePrint` (src/components/reports/BatchPrintCenterModal.tsx:55), `handlePrint` (src/components/EmergencyRosterView.tsx:105), `handlePrint` (src/components/StudentAbsenceInquiryView.tsx:773)
- **Database Interaction:** None detected.
- **External Services:** window.open
- **Authentication:** No authentication logic inside this function.
- **Authorization:** No role/permission check inside this function.
- **Validation:** 1 guard/type/regex check(s) detected.
- **Errors:** 3 try/catch
- **Side Effects:** React state: `setTimeout`; console output; DOM/window access
- **Edge Cases:** UNKNOWN (not individually reviewed)
- **Security Considerations:** Uses `any` typing.
- **Current Limitations:** UNKNOWN (not individually reviewed)

### `triggerPrint` (nested in `printNativePdfFromHtml`)
- **File:** `src/utils/pdfExport.ts:130-140`  · **Review:** AUTO
- **Purpose:** UNKNOWN (no in-code description; not individually reviewed)
- **Parameters:** none
- **Returns:** `void` (inferred)
- **Dependencies:** none detected
- **Calls:** no in-repo callees resolved
- **Called By:** no in-repo caller resolved (entry point, event handler, route, or referenced by value)
- **Database Interaction:** None detected.
- **External Services:** window.open
- **Authentication:** No authentication logic inside this function.
- **Authorization:** No role/permission check inside this function.
- **Validation:** None detected.
- **Errors:** 1 try/catch
- **Side Effects:** DOM/window access
- **Edge Cases:** UNKNOWN (not individually reviewed)
- **Security Considerations:** None noted (not individually reviewed).
- **Current Limitations:** UNKNOWN (not individually reviewed)


## src/utils/printTemplates/studentAbsenceReportTemplate.ts

### `generateStudentAbsenceReportHtml`
- **File:** `src/utils/printTemplates/studentAbsenceReportTemplate.ts:42-251`  · **Review:** AUTO
- **Purpose:** In-code comment: Pure generator function producing clean, compliant HTML for vector PDF export and isolated printing. Strictly derives all school identities, dates, and leadership designations from TenantSchoolProfile (Settings).
- **Parameters:** `params: StudentAbsenceReportParams`
- **Returns:** `string` (declared)
- **Dependencies:** none detected
- **Calls:** no in-repo callees resolved
- **Called By:** `handleDownloadPdf` (src/components/students/StudentAbsenceDrawer.tsx:666), `handlePrint` (src/components/students/StudentAbsenceDrawer.tsx:703), `handleDownloadPdf` (src/components/StudentAbsenceInquiryView.tsx:732), `handlePrint` (src/components/StudentAbsenceInquiryView.tsx:773)
- **Database Interaction:** None detected.
- **External Services:** None detected.
- **Authentication:** No authentication logic inside this function.
- **Authorization:** No role/permission check inside this function.
- **Validation:** None detected.
- **Errors:** None detected.
- **Side Effects:** None detected.
- **Edge Cases:** UNKNOWN (not individually reviewed)
- **Security Considerations:** None noted (not individually reviewed).
- **Current Limitations:** UNKNOWN (not individually reviewed)


## src/utils/routeAuth.ts

### `isPublicRoute`
- **File:** `src/utils/routeAuth.ts:18-22`  · **Review:** REVIEWED
- **Purpose:** True for non-/api paths and the four public API routes.
- **Parameters:** `route: string`
- **Returns:** `boolean`
- **Dependencies:** none detected
- **Calls:** no in-repo callees resolved
- **Called By:** `authenticateRequest` (server.ts:638), `requireActiveSubscription` (server.ts:896)
- **Database Interaction:** None.
- **External Services:** —
- **Authentication:** Defines which routes skip authentication.
- **Authorization:** —
- **Validation:** Lower-cases input.
- **Errors:** —
- **Side Effects:** —
- **Edge Cases:** `/api/health/` (trailing slash) is not in the set ⇒ requires auth; `/api` prefix check also matches `/apiX`.
- **Security Considerations:** Unit-tested (`routeAuth.test.ts`).
- **Current Limitations:** —


## src/utils/sampleImages.ts

### `generateSampleMedicalNoteBase64`
- **File:** `src/utils/sampleImages.ts:2-124`  · **Review:** AUTO
- **Purpose:** In-code comment: Helper to create a base64 image of a realistic medical certificate / excuse letter
- **Parameters:** `studentName = 'يوسف خالد المطيري'`; `hospital = 'مستشفى الملك فيصل التخصصي'`
- **Returns:** `string` (declared)
- **Dependencies:** none detected
- **Calls:** no in-repo callees resolved
- **Called By:** `handleLoadSampleMedicalNote` (src/components/JustificationsView.tsx:103), `handleReanalyzeJustificationWithAI` (src/components/JustificationsView.tsx:181)
- **Database Interaction:** None detected.
- **External Services:** None detected.
- **Authentication:** No authentication logic inside this function.
- **Authorization:** No role/permission check inside this function.
- **Validation:** 1 guard/type/regex check(s) detected.
- **Errors:** None detected.
- **Side Effects:** DOM/window access
- **Edge Cases:** UNKNOWN (not individually reviewed)
- **Security Considerations:** None noted (not individually reviewed).
- **Current Limitations:** UNKNOWN (not individually reviewed)

### `generateSampleIrregularMedicalNoteBase64`
- **File:** `src/utils/sampleImages.ts:128-254`  · **Review:** AUTO
- **Purpose:** In-code comment: (e.g. Mismatched student name, old/unmatched dates, missing or unverified stamp)
- **Parameters:** `mismatchedName = 'عبدالله بن فهد الدوسري'`; `oldDate = '2024-03-12'`
- **Returns:** `string` (declared)
- **Dependencies:** none detected
- **Calls:** no in-repo callees resolved
- **Called By:** `handleLoadSampleIrregularNote` (src/components/JustificationsView.tsx:119), `handleReanalyzeJustificationWithAI` (src/components/JustificationsView.tsx:181)
- **Database Interaction:** None detected.
- **External Services:** None detected.
- **Authentication:** No authentication logic inside this function.
- **Authorization:** No role/permission check inside this function.
- **Validation:** 1 guard/type/regex check(s) detected.
- **Errors:** None detected.
- **Side Effects:** React state: `setLineDash`; DOM/window access
- **Edge Cases:** UNKNOWN (not individually reviewed)
- **Security Considerations:** None noted (not individually reviewed).
- **Current Limitations:** UNKNOWN (not individually reviewed)


## src/utils/tenantAISecrets.ts

### `getMasterKey`
- **File:** `src/utils/tenantAISecrets.ts:7-13`  · **Review:** REVIEWED
- **Purpose:** Derives the 32-byte AES key as SHA-256(TENANT_ENCRYPTION_MASTER_KEY).
- **Parameters:** none
- **Returns:** `Buffer`
- **Dependencies:** crypto
- **Calls:** —
- **Called By:** `encryptKey` (src/utils/tenantAISecrets.ts:97), `decryptKey` (src/utils/tenantAISecrets.ts:115)
- **Database Interaction:** None.
- **External Services:** None.
- **Authentication:** N/A (pure helper).
- **Authorization:** N/A.
- **Validation:** None.
- **Errors:** Throws if env var is missing.
- **Side Effects:** Reads env.
- **Edge Cases:** —
- **Security Considerations:** Unsalted single SHA-256 of the secret — strength depends entirely on the entropy of the env value; no key versioning (rotation requires `rotate-tenant-ai-secrets.mjs`).
- **Current Limitations:** —

### `loadSecretsFromDisk`
- **File:** `src/utils/tenantAISecrets.ts:40-52`  · **Review:** REVIEWED
- **Purpose:** Loads `tenant-ai-secrets.json` (or `TENANT_AI_SECRETS_PATH`) into the in-memory cache.
- **Parameters:** none
- **Returns:** void
- **Dependencies:** fs
- **Calls:** —
- **Called By:** no in-repo caller resolved (entry point, event handler, route, or referenced by value)
- **Database Interaction:** None.
- **External Services:** Filesystem read.
- **Authentication:** N/A (pure helper).
- **Authorization:** N/A.
- **Validation:** None.
- **Errors:** Caught; cache reset to `{}`.
- **Side Effects:** Mutates module cache; runs at import time.
- **Edge Cases:** —
- **Security Considerations:** File is git-ignored.
- **Current Limitations:** —

### `persistSecretsToDisk`
- **File:** `src/utils/tenantAISecrets.ts:54-63`  · **Review:** REVIEWED
- **Purpose:** Writes cache to the secrets file with mode 0600.
- **Parameters:** none
- **Returns:** void
- **Dependencies:** fs
- **Calls:** —
- **Called By:** `setTenantApiKey` (src/utils/tenantAISecrets.ts:141), `removeTenantApiKey` (src/utils/tenantAISecrets.ts:186)
- **Database Interaction:** None.
- **External Services:** Filesystem write.
- **Authentication:** N/A (pure helper).
- **Authorization:** N/A.
- **Validation:** None.
- **Errors:** Caught and logged.
- **Side Effects:** Writes file.
- **Edge Cases:** —
- **Security Considerations:** —
- **Current Limitations:** Only used when no durable store is attached; ephemeral on Render free plan / read-only on Vercel.

### `attachTenantSecretsStore`
- **File:** `src/utils/tenantAISecrets.ts:80-89`  · **Review:** REVIEWED
- **Purpose:** Attaches a durable store and merges its contents over the local cache.
- **Parameters:** `store: TenantSecretsStore`
- **Returns:** `Promise<void>`
- **Dependencies:** none detected
- **Calls:** —
- **Called By:** `hydrateTenantSecrets` (server.ts:2488)
- **Database Interaction:** None.
- **External Services:** None.
- **Authentication:** N/A (pure helper).
- **Authorization:** N/A.
- **Validation:** None.
- **Errors:** Load errors caught and logged.
- **Side Effects:** Sets module-level `durableStore`; merges remote entries over local.
- **Edge Cases:** Remote entries override local ones with the same tenant id.
- **Security Considerations:** —
- **Current Limitations:** —

### `encryptKey`
- **File:** `src/utils/tenantAISecrets.ts:97-110`  · **Review:** REVIEWED
- **Purpose:** AES-256-GCM encrypt with random 96-bit IV.
- **Parameters:** `plainKey: string`
- **Returns:** `{ iv, tag, data }` (hex).
- **Dependencies:** crypto
- **Calls:** `getMasterKey` (src/utils/tenantAISecrets.ts:7)
- **Called By:** `setTenantApiKey` (src/utils/tenantAISecrets.ts:141)
- **Database Interaction:** None.
- **External Services:** None.
- **Authentication:** N/A (pure helper).
- **Authorization:** N/A.
- **Validation:** None.
- **Errors:** Throws if master key missing.
- **Side Effects:** None (pure).
- **Edge Cases:** —
- **Security Considerations:** Authenticated encryption; no AAD binding the ciphertext to the tenantId (a ciphertext could be moved between tenants by someone with write access to the store).
- **Current Limitations:** —

### `decryptKey`
- **File:** `src/utils/tenantAISecrets.ts:115-126`  · **Review:** REVIEWED
- **Purpose:** AES-256-GCM decrypt.
- **Parameters:** `payload: { iv, tag, data }`
- **Returns:** `string | null`
- **Dependencies:** crypto
- **Calls:** `getMasterKey` (src/utils/tenantAISecrets.ts:7)
- **Called By:** `getTenantApiKey` (src/utils/tenantAISecrets.ts:175)
- **Database Interaction:** None.
- **External Services:** None.
- **Authentication:** N/A (pure helper).
- **Authorization:** N/A.
- **Validation:** None.
- **Errors:** Caught; returns null and logs on failure (e.g. wrong master key).
- **Side Effects:** None (pure).
- **Edge Cases:** After master-key rotation without re-encryption, all tenant keys silently become unusable and fall back to the system key.
- **Security Considerations:** —
- **Current Limitations:** —

### `maskApiKey`
- **File:** `src/utils/tenantAISecrets.ts:131-136`  · **Review:** REVIEWED
- **Purpose:** Masks a key as first 7 chars + bullets + last 4.
- **Parameters:** `plainKey: string`
- **Returns:** `string`
- **Dependencies:** none detected
- **Calls:** —
- **Called By:** `setTenantApiKey` (src/utils/tenantAISecrets.ts:141), `POST /api/tenant/ai-config/test [handler]` (server.ts:1725)
- **Database Interaction:** None.
- **External Services:** None.
- **Authentication:** N/A (pure helper).
- **Authorization:** N/A.
- **Validation:** None.
- **Errors:** None thrown.
- **Side Effects:** None (pure).
- **Edge Cases:** —
- **Security Considerations:** Reveals 11 characters of the key (prefix+suffix).
- **Current Limitations:** —

### `setTenantApiKey`
- **File:** `src/utils/tenantAISecrets.ts:141-169`  · **Review:** REVIEWED
- **Purpose:** Encrypts and stores a tenant key; writes through to the durable store (async) or to disk.
- **Parameters:** `tenantId, plainKey, preferredModel?`
- **Returns:** `TenantAIConfig`
- **Dependencies:** none detected
- **Calls:** `encryptKey` (src/utils/tenantAISecrets.ts:97), `maskApiKey` (src/utils/tenantAISecrets.ts:131), `persistSecretsToDisk` (src/utils/tenantAISecrets.ts:54)
- **Called By:** `POST /api/tenant/ai-config [handler]` (server.ts:1683)
- **Database Interaction:** WRITE `tenant_ai_secrets/{tenantId}` (not awaited).
- **External Services:** None.
- **Authentication:** N/A (pure helper).
- **Authorization:** N/A.
- **Validation:** None.
- **Errors:** Throws if master key missing; store write errors only logged.
- **Side Effects:** Mutates cache; async persistence.
- **Edge Cases:** —
- **Security Considerations:** —
- **Current Limitations:** `preferredModel` stored but never read by server routes.

### `getTenantApiKey`
- **File:** `src/utils/tenantAISecrets.ts:175-181`  · **Review:** REVIEWED
- **Purpose:** Returns the decrypted key for a tenant (server use only).
- **Parameters:** `tenantId`
- **Returns:** `string | null`
- **Dependencies:** none detected
- **Calls:** `decryptKey` (src/utils/tenantAISecrets.ts:115)
- **Called By:** `getGenAIClientForTenant` (server.ts:1017), `POST /api/tenant/ai-config/test [handler]` (server.ts:1725)
- **Database Interaction:** None.
- **External Services:** None.
- **Authentication:** N/A (pure helper).
- **Authorization:** N/A.
- **Validation:** None.
- **Errors:** Decrypt failure ⇒ null.
- **Side Effects:** None (pure).
- **Edge Cases:** —
- **Security Considerations:** —
- **Current Limitations:** —

### `removeTenantApiKey`
- **File:** `src/utils/tenantAISecrets.ts:186-199`  · **Review:** REVIEWED
- **Purpose:** Deletes a tenant key from cache and store.
- **Parameters:** `tenantId`
- **Returns:** `boolean`
- **Dependencies:** none detected
- **Calls:** `persistSecretsToDisk` (src/utils/tenantAISecrets.ts:54)
- **Called By:** `DELETE /api/tenant/ai-config [handler]` (server.ts:1707), `reset` (src/utils/tenantAISecrets.test.ts:36)
- **Database Interaction:** DELETE `tenant_ai_secrets/{tenantId}` (not awaited).
- **External Services:** None.
- **Authentication:** N/A (pure helper).
- **Authorization:** N/A.
- **Validation:** None.
- **Errors:** None thrown.
- **Side Effects:** None (pure).
- **Edge Cases:** —
- **Security Considerations:** —
- **Current Limitations:** —

### `getTenantAIConfig`
- **File:** `src/utils/tenantAISecrets.ts:204-222`  · **Review:** REVIEWED
- **Purpose:** Sanitised config for UI (never the raw key).
- **Parameters:** `tenantId`
- **Returns:** `TenantAIConfig`
- **Dependencies:** none detected
- **Calls:** —
- **Called By:** `GET /api/tenant/ai-config [handler]` (server.ts:1667), `DELETE /api/tenant/ai-config [handler]` (server.ts:1707)
- **Database Interaction:** None.
- **External Services:** None.
- **Authentication:** N/A (pure helper).
- **Authorization:** N/A.
- **Validation:** None.
- **Errors:** None thrown.
- **Side Effects:** None (pure).
- **Edge Cases:** —
- **Security Considerations:** —
- **Current Limitations:** —


## src/utils/whatsappUtils.ts

### `cleanCallingCode`
- **File:** `src/utils/whatsappUtils.ts:6-9`  · **Review:** AUTO
- **Purpose:** In-code comment: WhatsApp Direct Messaging Utility Generates verified, standard wa.me links for direct zero-cost WhatsApp Web / App messaging.
- **Parameters:** `callingCode?: string`
- **Returns:** `string` (declared)
- **Dependencies:** none detected
- **Calls:** no in-repo callees resolved
- **Called By:** `formatWhatsAppInternationalPhone` (src/utils/whatsappUtils.ts:15)
- **Database Interaction:** None detected.
- **External Services:** None detected.
- **Authentication:** No authentication logic inside this function.
- **Authorization:** No role/permission check inside this function.
- **Validation:** 1 guard/type/regex check(s) detected.
- **Errors:** None detected.
- **Side Effects:** None detected.
- **Edge Cases:** UNKNOWN (not individually reviewed)
- **Security Considerations:** None noted (not individually reviewed).
- **Current Limitations:** UNKNOWN (not individually reviewed)

### `formatWhatsAppInternationalPhone`
- **File:** `src/utils/whatsappUtils.ts:15-44`  · **Review:** AUTO
- **Purpose:** In-code comment: Normalizes phone numbers to standard international format without '+' or leading zeros suitable for WhatsApp wa.me links (e.g., 966509990011).
- **Parameters:** `phone: string`; `defaultCallingCode: string = '966'`
- **Returns:** `string` (declared)
- **Dependencies:** none detected
- **Calls:** `cleanCallingCode` (src/utils/whatsappUtils.ts:6)
- **Called By:** `buildWhatsAppWebUrl` (src/utils/whatsappUtils.ts:49), `SchoolMessagingGatewaysTab` (src/components/settings/SchoolMessagingGatewaysTab.tsx:42)
- **Database Interaction:** None detected.
- **External Services:** None detected.
- **Authentication:** No authentication logic inside this function.
- **Authorization:** No role/permission check inside this function.
- **Validation:** 1 guard/type/regex check(s) detected.
- **Errors:** None detected.
- **Side Effects:** None detected.
- **Edge Cases:** UNKNOWN (not individually reviewed)
- **Security Considerations:** None noted (not individually reviewed).
- **Current Limitations:** UNKNOWN (not individually reviewed)

### `buildWhatsAppWebUrl`
- **File:** `src/utils/whatsappUtils.ts:49-57`  · **Review:** AUTO
- **Purpose:** In-code comment: Builds the standard https://wa.me/{phone}?text={encodedText} deep link.
- **Parameters:** `phone: string`; `messageText: string`; `defaultCallingCode: string = '966'`
- **Returns:** `string` (declared)
- **Dependencies:** none detected
- **Calls:** `formatWhatsAppInternationalPhone` (src/utils/whatsappUtils.ts:15)
- **Called By:** `openWhatsAppDirect` (src/utils/whatsappUtils.ts:62)
- **Database Interaction:** None detected.
- **External Services:** None detected.
- **Authentication:** No authentication logic inside this function.
- **Authorization:** No role/permission check inside this function.
- **Validation:** None detected.
- **Errors:** None detected.
- **Side Effects:** None detected.
- **Edge Cases:** UNKNOWN (not individually reviewed)
- **Security Considerations:** None noted (not individually reviewed).
- **Current Limitations:** UNKNOWN (not individually reviewed)

### `openWhatsAppDirect`
- **File:** `src/utils/whatsappUtils.ts:62-71`  · **Review:** AUTO
- **Purpose:** In-code comment: Launches WhatsApp Web or Desktop/Mobile app directly in a new window/tab.
- **Parameters:** `phone: string`; `messageText: string`; `defaultCallingCode: string = '966'`
- **Returns:** `boolean` (declared)
- **Dependencies:** none detected
- **Calls:** `buildWhatsAppWebUrl` (src/utils/whatsappUtils.ts:49)
- **Called By:** `handleWhatsAppContact` (src/components/students/StudentAbsenceDrawer.tsx:654), `NotificationOutboxView` (src/components/NotificationOutboxView.tsx:32), `handleTestWhatsAppWeb` (src/components/settings/SchoolMessagingGatewaysTab.tsx:105)
- **Database Interaction:** None detected.
- **External Services:** window.open
- **Authentication:** No authentication logic inside this function.
- **Authorization:** No role/permission check inside this function.
- **Validation:** 1 guard/type/regex check(s) detected.
- **Errors:** None detected.
- **Side Effects:** DOM/window access
- **Edge Cases:** UNKNOWN (not individually reviewed)
- **Security Considerations:** None noted (not individually reviewed).
- **Current Limitations:** UNKNOWN (not individually reviewed)


## vite.config.ts

### `manualChunks`
- **File:** `vite.config.ts:18-27`  · **Review:** AUTO
- **Purpose:** UNKNOWN (no in-code description; not individually reviewed)
- **Parameters:** `id: string`
- **Returns:** `"vendor-firebase" | "vendor-charts" | "vendor-icons" | "vendor-react" | "vendor"` (inferred)
- **Dependencies:** firebase, react
- **Calls:** no in-repo callees resolved
- **Called By:** no in-repo caller resolved (entry point, event handler, route, or referenced by value)
- **Database Interaction:** None detected.
- **External Services:** None detected.
- **Authentication:** No authentication logic inside this function.
- **Authorization:** No role/permission check inside this function.
- **Validation:** 1 guard/type/regex check(s) detected.
- **Errors:** None detected.
- **Side Effects:** None detected.
- **Edge Cases:** UNKNOWN (not individually reviewed)
- **Security Considerations:** None noted (not individually reviewed).
- **Current Limitations:** UNKNOWN (not individually reviewed)



# State/context


## src/context/AttendanceContext.tsx

### `toFirestoreData`
- **File:** `src/context/AttendanceContext.tsx:112-112`  · **Review:** AUTO
- **Purpose:** UNKNOWN (no in-code description; not individually reviewed)
- **Parameters:** `value: T`
- **Returns:** `T` (declared)
- **Dependencies:** none detected
- **Calls:** no in-repo callees resolved
- **Called By:** `AttendanceProvider` (src/context/AttendanceContext.tsx:326), `reviewJustification` (src/context/AttendanceContext.tsx:2198), `persistStudent` (src/context/AttendanceContext.tsx:2784), `persistStudentPatch` (src/context/AttendanceContext.tsx:2791)
- **Database Interaction:** None detected.
- **External Services:** None detected.
- **Authentication:** No authentication logic inside this function.
- **Authorization:** No role/permission check inside this function.
- **Validation:** None detected.
- **Errors:** None detected.
- **Side Effects:** None detected.
- **Edge Cases:** UNKNOWN (not individually reviewed)
- **Security Considerations:** None noted (not individually reviewed).
- **Current Limitations:** UNKNOWN (not individually reviewed)

### `buildParentSessions`
- **File:** `src/context/AttendanceContext.tsx:114-165`  · **Review:** AUTO
- **Purpose:** UNKNOWN (no in-code description; not individually reviewed)
- **Parameters:** `records: StudentAttendanceRecord[]`
- **Returns:** `AttendanceSession[]` (declared)
- **Dependencies:** none detected
- **Calls:** no in-repo callees resolved
- **Called By:** `AttendanceProvider` (src/context/AttendanceContext.tsx:326)
- **Database Interaction:** None detected.
- **External Services:** None detected.
- **Authentication:** No authentication logic inside this function.
- **Authorization:** No role/permission check inside this function.
- **Validation:** 1 guard/type/regex check(s) detected.
- **Errors:** None detected.
- **Side Effects:** None detected.
- **Edge Cases:** UNKNOWN (not individually reviewed)
- **Security Considerations:** None noted (not individually reviewed).
- **Current Limitations:** UNKNOWN (not individually reviewed)

### `AttendanceProvider`
- **File:** `src/context/AttendanceContext.tsx:326-3731`  · **Review:** AUTO
- **Purpose:** UNKNOWN (no in-code description; not individually reviewed)
- **Parameters:** `{ children, initialTenantId, }`
- **Returns:** `Element` (inferred)
- **Dependencies:** admin
- **Calls:** `resolveTenantFromHostname` (src/config/tenantRegistry.ts:325), `getItem` (src/utils/localCache.ts:49), `extractQueryTenant` (src/config/tenantRegistry.ts:210), `setApiTenantOverride` (src/lib/api.ts:11), `refreshSubscription` (src/context/AttendanceContext.tsx:394), `evaluateSubscription` (src/config/subscription.ts:183), `syncTenantsWithServer` (src/context/AttendanceContext.tsx:431), `setItem` (src/utils/localCache.ts:60), `setUserRole` (src/context/AttendanceContext.tsx:373), `applyAccountTenant` (src/context/AttendanceContext.tsx:681), `handleFirestoreError` (src/lib/firebase.ts:72), `getDefaultSchoolProfile` (src/config/tenantSettings.ts:242) … (+8)
- **Called By:** no in-repo caller resolved (entry point, event handler, route, or referenced by value)
- **Database Interaction:** WRITE + READ/subscribe on `students`, `attendance_sessions`, `attendance_records`, `justifications`, `notification_outbox`, `audit_logs`, `settings`, `settings_private`, `users`, `tenants`
- **External Services:** HTTP /api/daily-digest/dispatch, HTTP /api/daily-digest/generate-briefing, HTTP /api/notifications/dispatch, HTTP /api/tenant/resolve, HTTP /api/tenants, HTTP /api/tenants/provision, HTTP /api/users, HTTP /api/users/${encodeURIComponent(userId)}, Firebase Auth
- **Authentication:** Uses `firebaseUser`/token
- **Authorization:** References: `canDispatchDigest`, `canEditSession`, `canEditSessionRule`, `canImportStudents`, `canManageOutbox`, `canManageSettings`, `canManageSettingsRule`, `canReopenSessions`, `canReviewJustifications`, `canWriteSubmitted`, `canWriteSubmittedSessions`, `currentUserRole`, `isElevatedOrSuperAdmin`, `isSuperAdmin`
- **Validation:** 109 guard/type/regex check(s) detected.
- **Errors:** 24 try/catch, 6 throw, 21 .catch
- **Side Effects:** React state: `setAllAuditLogs`, `setAllBehaviourIncidents`, `setAllJustifications`, `setAllNotifications`, `setAllSessions`, `setAllStudents`, `setAllUsers`, `setApiTenantOverride` …; local storage/cache; console output; DOM/window access
- **Edge Cases:** UNKNOWN (not individually reviewed)
- **Security Considerations:** Fire-and-forget Firestore write: failures are only logged. Uses `any` typing.
- **Current Limitations:** UNKNOWN (not individually reviewed)

### `setTenantId` (nested in `AttendanceProvider`)
- **File:** `src/context/AttendanceContext.tsx:366-371`  · **Review:** AUTO
- **Purpose:** UNKNOWN (no in-code description; not individually reviewed)
- **Parameters:** `id: string`
- **Returns:** `void` (inferred)
- **Dependencies:** none detected
- **Calls:** `setItem` (src/utils/localCache.ts:60)
- **Called By:** `applyAccountTenant` (src/context/AttendanceContext.tsx:681)
- **Database Interaction:** None detected.
- **External Services:** None detected.
- **Authentication:** No authentication logic inside this function.
- **Authorization:** No role/permission check inside this function.
- **Validation:** 1 guard/type/regex check(s) detected.
- **Errors:** None detected.
- **Side Effects:** React state: `setItem`, `setTenantIdState`; local storage/cache
- **Edge Cases:** UNKNOWN (not individually reviewed)
- **Security Considerations:** None noted (not individually reviewed).
- **Current Limitations:** UNKNOWN (not individually reviewed)

### `setUserRole` (nested in `AttendanceProvider`)
- **File:** `src/context/AttendanceContext.tsx:373-378`  · **Review:** AUTO
- **Purpose:** UNKNOWN (no in-code description; not individually reviewed)
- **Parameters:** `role: UserRole`
- **Returns:** `void` (inferred)
- **Dependencies:** none detected
- **Calls:** `setItem` (src/utils/localCache.ts:60)
- **Called By:** `AttendanceProvider` (src/context/AttendanceContext.tsx:326), `signInWithCredentials` (src/context/AttendanceContext.tsx:1006)
- **Database Interaction:** None detected.
- **External Services:** None detected.
- **Authentication:** No authentication logic inside this function.
- **Authorization:** No role/permission check inside this function.
- **Validation:** 1 guard/type/regex check(s) detected.
- **Errors:** None detected.
- **Side Effects:** React state: `setCurrentUserRoleState`, `setItem`; local storage/cache
- **Edge Cases:** UNKNOWN (not individually reviewed)
- **Security Considerations:** None noted (not individually reviewed).
- **Current Limitations:** UNKNOWN (not individually reviewed)

### `refreshSubscription` (nested in `AttendanceProvider`)
- **File:** `src/context/AttendanceContext.tsx:394-407`  · **Review:** AUTO
- **Purpose:** UNKNOWN (no in-code description; not individually reviewed)
- **Parameters:** none
- **Returns:** `Promise<void>` (inferred)
- **Dependencies:** none detected
- **Calls:** `normalizeSubscription` (src/config/subscription.ts:101)
- **Called By:** `AttendanceProvider` (src/context/AttendanceContext.tsx:326), `refreshWhenVisible` (src/context/AttendanceContext.tsx:413)
- **Database Interaction:** None detected.
- **External Services:** HTTP /api/tenant/resolve
- **Authentication:** No authentication logic inside this function.
- **Authorization:** No role/permission check inside this function.
- **Validation:** 1 guard/type/regex check(s) detected.
- **Errors:** 1 try/catch
- **Side Effects:** React state: `setTenantSubscription`; console output
- **Edge Cases:** UNKNOWN (not individually reviewed)
- **Security Considerations:** Uses `any` typing.
- **Current Limitations:** UNKNOWN (not individually reviewed)

### `refreshWhenVisible` (nested in `AttendanceProvider`)
- **File:** `src/context/AttendanceContext.tsx:413-415`  · **Review:** AUTO
- **Purpose:** In-code comment: regains focus and periodically so the gate appears without a hard reload.
- **Parameters:** none
- **Returns:** `void` (inferred)
- **Dependencies:** none detected
- **Calls:** `refreshSubscription` (src/context/AttendanceContext.tsx:394)
- **Called By:** no in-repo caller resolved (entry point, event handler, route, or referenced by value)
- **Database Interaction:** None detected.
- **External Services:** None detected.
- **Authentication:** No authentication logic inside this function.
- **Authorization:** No role/permission check inside this function.
- **Validation:** None detected.
- **Errors:** None detected.
- **Side Effects:** DOM/window access
- **Edge Cases:** UNKNOWN (not individually reviewed)
- **Security Considerations:** None noted (not individually reviewed).
- **Current Limitations:** UNKNOWN (not individually reviewed)

### `syncTenantsWithServer` (nested in `AttendanceProvider`)
- **File:** `src/context/AttendanceContext.tsx:431-456`  · **Review:** AUTO
- **Purpose:** UNKNOWN (no in-code description; not individually reviewed)
- **Parameters:** none
- **Returns:** `Promise<void>` (inferred)
- **Dependencies:** none detected
- **Calls:** `setItem` (src/utils/localCache.ts:60)
- **Called By:** `AttendanceProvider` (src/context/AttendanceContext.tsx:326)
- **Database Interaction:** None detected.
- **External Services:** HTTP /api/tenants
- **Authentication:** No authentication logic inside this function.
- **Authorization:** No role/permission check inside this function.
- **Validation:** 1 guard/type/regex check(s) detected.
- **Errors:** 1 try/catch
- **Side Effects:** React state: `setDynamicTenants`, `setItem`; local storage/cache; console output
- **Edge Cases:** UNKNOWN (not individually reviewed)
- **Security Considerations:** None noted (not individually reviewed).
- **Current Limitations:** UNKNOWN (not individually reviewed)

### `applyAccountTenant` (nested in `AttendanceProvider`)
- **File:** `src/context/AttendanceContext.tsx:681-689`  · **Review:** AUTO
- **Purpose:** In-code comment: sign out or disturb the session that is already running here.
- **Parameters:** `role: UserRole`; `accountTenantId?: string`
- **Returns:** `void` (inferred)
- **Dependencies:** none detected
- **Calls:** `setTenantId` (src/context/AttendanceContext.tsx:366)
- **Called By:** `AttendanceProvider` (src/context/AttendanceContext.tsx:326)
- **Database Interaction:** None detected.
- **External Services:** None detected.
- **Authentication:** No authentication logic inside this function.
- **Authorization:** No role/permission check inside this function.
- **Validation:** None detected.
- **Errors:** None detected.
- **Side Effects:** React state: `setTenantId`
- **Edge Cases:** UNKNOWN (not individually reviewed)
- **Security Considerations:** None noted (not individually reviewed).
- **Current Limitations:** UNKNOWN (not individually reviewed)

### `signInWithGoogle` (nested in `AttendanceProvider`)
- **File:** `src/context/AttendanceContext.tsx:979-995`  · **Review:** AUTO
- **Purpose:** UNKNOWN (no in-code description; not individually reviewed)
- **Parameters:** `useRedirect = false`
- **Returns:** `Promise<UserCredential | undefined>` (declared)
- **Dependencies:** none detected
- **Calls:** no in-repo callees resolved
- **Called By:** no in-repo caller resolved (entry point, event handler, route, or referenced by value)
- **Database Interaction:** None detected.
- **External Services:** Firebase Auth
- **Authentication:** No authentication logic inside this function.
- **Authorization:** No role/permission check inside this function.
- **Validation:** None detected.
- **Errors:** 1 try/catch, 1 throw
- **Side Effects:** console output
- **Edge Cases:** UNKNOWN (not individually reviewed)
- **Security Considerations:** Uses `any` typing.
- **Current Limitations:** UNKNOWN (not individually reviewed)

### `signOutGoogle` (nested in `AttendanceProvider`)
- **File:** `src/context/AttendanceContext.tsx:997-1004`  · **Review:** AUTO
- **Purpose:** UNKNOWN (no in-code description; not individually reviewed)
- **Parameters:** none
- **Returns:** `Promise<void>` (inferred)
- **Dependencies:** none detected
- **Calls:** no in-repo callees resolved
- **Called By:** no in-repo caller resolved (entry point, event handler, route, or referenced by value)
- **Database Interaction:** None detected.
- **External Services:** None detected.
- **Authentication:** No authentication logic inside this function.
- **Authorization:** No role/permission check inside this function.
- **Validation:** None detected.
- **Errors:** 1 try/catch, 1 throw
- **Side Effects:** console output
- **Edge Cases:** UNKNOWN (not individually reviewed)
- **Security Considerations:** None noted (not individually reviewed).
- **Current Limitations:** UNKNOWN (not individually reviewed)

### `signInWithCredentials` (nested in `AttendanceProvider`)
- **File:** `src/context/AttendanceContext.tsx:1006-1057`  · **Review:** REVIEWED
- **Purpose:** Email/password sign-in via Firebase Auth, then client-side tenant/status checks.
- **Parameters:** `targetEmail, pass`
- **Returns:** `Promise<{success, user?, error?, isFirebase?}>`
- **Dependencies:** none detected
- **Calls:** `setUserRole` (src/context/AttendanceContext.tsx:373)
- **Called By:** no in-repo caller resolved (entry point, event handler, route, or referenced by value)
- **Database Interaction:** None.
- **External Services:** Firebase Auth `signInWithEmailAndPassword`.
- **Authentication:** Defines client login.
- **Authorization:** Rejects when a loaded local profile belongs to another tenant or is inactive.
- **Validation:** Trim/lower-case email.
- **Errors:** `wrong-password`/`invalid-credential` ⇒ 'password incorrect'; other errors generic.
- **Side Effects:** Sets role state.
- **Edge Cases:** If no profile is loaded yet, builds a profile using the current client-state role and tenant.
- **Security Considerations:** Tenant/inactive checks run only against locally loaded profiles; real enforcement is server claims + Firestore rules. Error text distinguishes wrong password from other failures only for the two codes above.
- **Current Limitations:** —

### `isOffDay` (nested in `AttendanceProvider`)
- **File:** `src/context/AttendanceContext.tsx:1152-1154`  · **Review:** AUTO
- **Purpose:** UNKNOWN (no in-code description; not individually reviewed)
- **Parameters:** `dateStr: string`
- **Returns:** `OffDayCheckResult` (declared)
- **Dependencies:** none detected
- **Calls:** `isSchoolOffDay` (src/utils/holidayUtils.ts:93)
- **Called By:** `createJustification` (src/context/AttendanceContext.tsx:2091)
- **Database Interaction:** None detected.
- **External Services:** None detected.
- **Authentication:** No authentication logic inside this function.
- **Authorization:** No role/permission check inside this function.
- **Validation:** None detected.
- **Errors:** None detected.
- **Side Effects:** None detected.
- **Edge Cases:** UNKNOWN (not individually reviewed)
- **Security Considerations:** None noted (not individually reviewed).
- **Current Limitations:** UNKNOWN (not individually reviewed)

### `canEditSession` (nested in `AttendanceProvider`)
- **File:** `src/context/AttendanceContext.tsx:1378-1385`  · **Review:** AUTO
- **Purpose:** UNKNOWN (no in-code description; not individually reviewed)
- **Parameters:** `sess: AttendanceSession`
- **Returns:** `boolean` (declared)
- **Dependencies:** none detected
- **Calls:** `canEditSession` (src/utils/attendanceAccess.ts:38)
- **Called By:** `updateRecord` (src/context/AttendanceContext.tsx:1745), `setAllPresentInDraft` (src/context/AttendanceContext.tsx:1797), `quickMarkGroupAsPresent` (src/context/AttendanceContext.tsx:1825), `submitSession` (src/context/AttendanceContext.tsx:1898)
- **Database Interaction:** None detected.
- **External Services:** None detected.
- **Authentication:** Uses `firebaseUser`/token
- **Authorization:** References: `canEditSessionRule`, `currentUserRole`, `isSuperAdmin`
- **Validation:** None detected.
- **Errors:** None detected.
- **Side Effects:** None detected.
- **Edge Cases:** UNKNOWN (not individually reviewed)
- **Security Considerations:** None noted (not individually reviewed).
- **Current Limitations:** UNKNOWN (not individually reviewed)

### `isChildOfGuardian` (nested in `AttendanceProvider`)
- **File:** `src/context/AttendanceContext.tsx:1388-1389`  · **Review:** AUTO
- **Purpose:** In-code comment: Helper to determine if a student record belongs to the authenticated parent
- **Parameters:** `student: Student`; `user: UserProfile`
- **Returns:** `boolean` (declared)
- **Dependencies:** none detected
- **Calls:** `isChildOfGuardian` (src/utils/attendanceAccess.ts:56)
- **Called By:** `AttendanceProvider` (src/context/AttendanceContext.tsx:326)
- **Database Interaction:** None detected.
- **External Services:** None detected.
- **Authentication:** No authentication logic inside this function.
- **Authorization:** No role/permission check inside this function.
- **Validation:** None detected.
- **Errors:** None detected.
- **Side Effects:** None detected.
- **Edge Cases:** UNKNOWN (not individually reviewed)
- **Security Considerations:** None noted (not individually reviewed).
- **Current Limitations:** UNKNOWN (not individually reviewed)

### `createUser` (nested in `AttendanceProvider`)
- **File:** `src/context/AttendanceContext.tsx:1495-1590`  · **Review:** REVIEWED
- **Purpose:** Creates a staff/parent login through `POST /api/users`, updates local state, audits.
- **Parameters:** `userData`
- **Returns:** `Promise<UserAccountResult>`
- **Dependencies:** none detected
- **Calls:** `authenticatedFetch` (src/lib/api.ts:46), `setItem` (src/utils/localCache.ts:60), `addAuditLog` (src/context/AttendanceContext.tsx:1725)
- **Called By:** no in-repo caller resolved (entry point, event handler, route, or referenced by value)
- **Database Interaction:** Fallback WRITE `users/{synthetic id}` from the client (blocked by rules for non-platform-admins).
- **External Services:** POST /api/users
- **Authentication:** N/A (pure helper).
- **Authorization:** Server enforces; UI gate `canManageUsers` UNKNOWN (not reviewed).
- **Validation:** Email must contain '@'.
- **Errors:** Non-OK server response ⇒ failure message. A thrown network error is caught and the function CONTINUES as success with a local-only profile (`user-<role>-NNNN`).
- **Side Effects:** State + localCache + audit log write.
- **Edge Cases:** Fail-open on network exceptions (no real login created, UI reports success).
- **Security Considerations:** Temporary password is embedded in the returned message string.
- **Current Limitations:** Divergence between UI list and real accounts after a network error (QA-04).

### `updateUser` (nested in `AttendanceProvider`)
- **File:** `src/context/AttendanceContext.tsx:1592-1643`  · **Review:** AUTO
- **Purpose:** UNKNOWN (no in-code description; not individually reviewed)
- **Parameters:** `userId: string`; `updates: Partial<UserProfile>`
- **Returns:** `Promise<UserAccountResult>` (declared)
- **Dependencies:** none detected
- **Calls:** `authenticatedFetch` (src/lib/api.ts:46), `setItem` (src/utils/localCache.ts:60), `addAuditLog` (src/context/AttendanceContext.tsx:1725)
- **Called By:** no in-repo caller resolved (entry point, event handler, route, or referenced by value)
- **Database Interaction:** None detected.
- **External Services:** HTTP /api/users/${encodeURIComponent(userId)}
- **Authentication:** Uses `firebaseUser`/token
- **Authorization:** References: `currentUserRole`
- **Validation:** 2 guard/type/regex check(s) detected.
- **Errors:** 1 try/catch, 1 .catch
- **Side Effects:** React state: `setAllUsers`, `setItem`; local storage/cache; console output
- **Edge Cases:** UNKNOWN (not individually reviewed)
- **Security Considerations:** None noted (not individually reviewed).
- **Current Limitations:** UNKNOWN (not individually reviewed)

### `deleteUser` (nested in `AttendanceProvider`)
- **File:** `src/context/AttendanceContext.tsx:1645-1689`  · **Review:** AUTO
- **Purpose:** UNKNOWN (no in-code description; not individually reviewed)
- **Parameters:** `userId: string`
- **Returns:** `Promise<{ success: boolean; message: string }>` (declared)
- **Dependencies:** none detected
- **Calls:** `authenticatedFetch` (src/lib/api.ts:46), `setItem` (src/utils/localCache.ts:60), `addAuditLog` (src/context/AttendanceContext.tsx:1725)
- **Called By:** no in-repo caller resolved (entry point, event handler, route, or referenced by value)
- **Database Interaction:** None detected.
- **External Services:** HTTP /api/users/${encodeURIComponent(userId)}
- **Authentication:** Uses `firebaseUser`/token
- **Authorization:** References: `currentUserRole`
- **Validation:** 3 guard/type/regex check(s) detected.
- **Errors:** 1 try/catch, 1 .catch
- **Side Effects:** React state: `setAllUsers`, `setItem`; local storage/cache; console output
- **Edge Cases:** UNKNOWN (not individually reviewed)
- **Security Considerations:** None noted (not individually reviewed).
- **Current Limitations:** UNKNOWN (not individually reviewed)

### `addBehaviourIncident` (nested in `AttendanceProvider`)
- **File:** `src/context/AttendanceContext.tsx:1695-1723`  · **Review:** AUTO
- **Purpose:** UNKNOWN (no in-code description; not individually reviewed)
- **Parameters:** `incident: Omit<StudentBehaviourIncident, 'id' | 'tenantId'>`
- **Returns:** `StudentBehaviourIncident` (declared)
- **Dependencies:** none detected
- **Calls:** `setItem` (src/utils/localCache.ts:60), `addAuditLog` (src/context/AttendanceContext.tsx:1725)
- **Called By:** no in-repo caller resolved (entry point, event handler, route, or referenced by value)
- **Database Interaction:** None detected.
- **External Services:** None detected.
- **Authentication:** Uses `firebaseUser`/token
- **Authorization:** References: `currentUserRole`
- **Validation:** 1 guard/type/regex check(s) detected.
- **Errors:** None detected.
- **Side Effects:** React state: `setAllBehaviourIncidents`, `setItem`; local storage/cache
- **Edge Cases:** UNKNOWN (not individually reviewed)
- **Security Considerations:** None noted (not individually reviewed).
- **Current Limitations:** UNKNOWN (not individually reviewed)

### `addAuditLog` (nested in `AttendanceProvider`)
- **File:** `src/context/AttendanceContext.tsx:1725-1743`  · **Review:** AUTO
- **Purpose:** UNKNOWN (no in-code description; not individually reviewed)
- **Parameters:** `entry: Omit<AuditLog, 'id' | 'tenantId' | 'timestamp'>`
- **Returns:** `void` (inferred)
- **Dependencies:** none detected
- **Calls:** `handleFirestoreError` (src/lib/firebase.ts:72)
- **Called By:** `createUser` (src/context/AttendanceContext.tsx:1495), `updateUser` (src/context/AttendanceContext.tsx:1592), `deleteUser` (src/context/AttendanceContext.tsx:1645), `addBehaviourIncident` (src/context/AttendanceContext.tsx:1695), `quickMarkGroupAsPresent` (src/context/AttendanceContext.tsx:1825), `submitSession` (src/context/AttendanceContext.tsx:1898), `reopenSession` (src/context/AttendanceContext.tsx:1989), `createNewSession` (src/context/AttendanceContext.tsx:2032), `createJustification` (src/context/AttendanceContext.tsx:2091), `reviewJustification` (src/context/AttendanceContext.tsx:2198) … (+16)
- **Database Interaction:** WRITE on `audit_logs`
- **External Services:** None detected.
- **Authentication:** Uses `firebaseUser`/token
- **Authorization:** No role/permission check inside this function.
- **Validation:** None detected.
- **Errors:** 1 .catch
- **Side Effects:** React state: `setAllAuditLogs`, `setDoc`
- **Edge Cases:** UNKNOWN (not individually reviewed)
- **Security Considerations:** None noted (not individually reviewed).
- **Current Limitations:** UNKNOWN (not individually reviewed)

### `updateRecord` (nested in `AttendanceProvider`)
- **File:** `src/context/AttendanceContext.tsx:1745-1795`  · **Review:** AUTO
- **Purpose:** UNKNOWN (no in-code description; not individually reviewed)
- **Parameters:** `sessionId: string`; `studentId: string`; `status: AttendanceStatus`; `minutesLate?: number`; `note?: string`
- **Returns:** `void` (inferred)
- **Dependencies:** none detected
- **Calls:** `canEditSession` (src/context/AttendanceContext.tsx:1378)
- **Called By:** no in-repo caller resolved (entry point, event handler, route, or referenced by value)
- **Database Interaction:** None detected.
- **External Services:** None detected.
- **Authentication:** Uses `firebaseUser`/token
- **Authorization:** References: `canEditSession`
- **Validation:** 1 guard/type/regex check(s) detected.
- **Errors:** None detected.
- **Side Effects:** React state: `setAllSessions`; console output
- **Edge Cases:** UNKNOWN (not individually reviewed)
- **Security Considerations:** None noted (not individually reviewed).
- **Current Limitations:** UNKNOWN (not individually reviewed)

### `setAllPresentInDraft` (nested in `AttendanceProvider`)
- **File:** `src/context/AttendanceContext.tsx:1797-1823`  · **Review:** AUTO
- **Purpose:** UNKNOWN (no in-code description; not individually reviewed)
- **Parameters:** `sessionId: string`
- **Returns:** `void` (inferred)
- **Dependencies:** none detected
- **Calls:** `canEditSession` (src/context/AttendanceContext.tsx:1378)
- **Called By:** no in-repo caller resolved (entry point, event handler, route, or referenced by value)
- **Database Interaction:** None detected.
- **External Services:** None detected.
- **Authentication:** Uses `firebaseUser`/token
- **Authorization:** References: `canEditSession`
- **Validation:** 1 guard/type/regex check(s) detected.
- **Errors:** None detected.
- **Side Effects:** React state: `setAllSessions`; console output
- **Edge Cases:** UNKNOWN (not individually reviewed)
- **Security Considerations:** None noted (not individually reviewed).
- **Current Limitations:** UNKNOWN (not individually reviewed)

### `quickMarkGroupAsPresent` (nested in `AttendanceProvider`)
- **File:** `src/context/AttendanceContext.tsx:1825-1896`  · **Review:** AUTO
- **Purpose:** UNKNOWN (no in-code description; not individually reviewed)
- **Parameters:** `sessionId: string`; `studentIds?: string[]`
- **Returns:** `{ updatedCount: number; message: string; }` (inferred)
- **Dependencies:** none detected
- **Calls:** `canEditSession` (src/context/AttendanceContext.tsx:1378), `addAuditLog` (src/context/AttendanceContext.tsx:1725)
- **Called By:** no in-repo caller resolved (entry point, event handler, route, or referenced by value)
- **Database Interaction:** None detected.
- **External Services:** None detected.
- **Authentication:** Uses `firebaseUser`/token
- **Authorization:** References: `canEditSession`
- **Validation:** 2 guard/type/regex check(s) detected.
- **Errors:** None detected.
- **Side Effects:** React state: `setAllSessions`
- **Edge Cases:** UNKNOWN (not individually reviewed)
- **Security Considerations:** None noted (not individually reviewed).
- **Current Limitations:** UNKNOWN (not individually reviewed)

### `submitSession` (nested in `AttendanceProvider`)
- **File:** `src/context/AttendanceContext.tsx:1898-1987`  · **Review:** AUTO
- **Purpose:** UNKNOWN (no in-code description; not individually reviewed)
- **Parameters:** `sessionId: string`
- **Returns:** `{ success: boolean; message: string; }` (inferred)
- **Dependencies:** none detected
- **Calls:** `canEditSession` (src/context/AttendanceContext.tsx:1378), `addAuditLog` (src/context/AttendanceContext.tsx:1725)
- **Called By:** no in-repo caller resolved (entry point, event handler, route, or referenced by value)
- **Database Interaction:** None detected.
- **External Services:** None detected.
- **Authentication:** Uses `firebaseUser`/token
- **Authorization:** References: `canEditSession`
- **Validation:** 2 guard/type/regex check(s) detected.
- **Errors:** None detected.
- **Side Effects:** React state: `setAllNotifications`, `setAllSessions`
- **Edge Cases:** UNKNOWN (not individually reviewed)
- **Security Considerations:** None noted (not individually reviewed).
- **Current Limitations:** UNKNOWN (not individually reviewed)

### `reopenSession` (nested in `AttendanceProvider`)
- **File:** `src/context/AttendanceContext.tsx:1989-2030`  · **Review:** AUTO
- **Purpose:** UNKNOWN (no in-code description; not individually reviewed)
- **Parameters:** `sessionId: string`; `reason: string`
- **Returns:** `{ success: boolean; message: string; }` (inferred)
- **Dependencies:** none detected
- **Calls:** `addAuditLog` (src/context/AttendanceContext.tsx:1725)
- **Called By:** no in-repo caller resolved (entry point, event handler, route, or referenced by value)
- **Database Interaction:** None detected.
- **External Services:** None detected.
- **Authentication:** Uses `firebaseUser`/token
- **Authorization:** References: `canReopenSessions`
- **Validation:** 3 guard/type/regex check(s) detected.
- **Errors:** None detected.
- **Side Effects:** React state: `setAllSessions`
- **Edge Cases:** UNKNOWN (not individually reviewed)
- **Security Considerations:** None noted (not individually reviewed).
- **Current Limitations:** UNKNOWN (not individually reviewed)

### `createNewSession` (nested in `AttendanceProvider`)
- **File:** `src/context/AttendanceContext.tsx:2032-2089`  · **Review:** AUTO
- **Purpose:** UNKNOWN (no in-code description; not individually reviewed)
- **Parameters:** `sessionType: 'daily' | 'period'`; `periodNumber: number`; `subject: string`; `className: string`; `classId: string`; `grade: string`
- **Returns:** `AttendanceSession` (declared)
- **Dependencies:** none detected
- **Calls:** `addAuditLog` (src/context/AttendanceContext.tsx:1725)
- **Called By:** no in-repo caller resolved (entry point, event handler, route, or referenced by value)
- **Database Interaction:** None detected.
- **External Services:** None detected.
- **Authentication:** Uses `firebaseUser`/token
- **Authorization:** No role/permission check inside this function.
- **Validation:** None detected.
- **Errors:** None detected.
- **Side Effects:** React state: `setAllSessions`
- **Edge Cases:** UNKNOWN (not individually reviewed)
- **Security Considerations:** None noted (not individually reviewed).
- **Current Limitations:** UNKNOWN (not individually reviewed)

### `createJustification` (nested in `AttendanceProvider`)
- **File:** `src/context/AttendanceContext.tsx:2091-2196`  · **Review:** AUTO
- **Purpose:** UNKNOWN (no in-code description; not individually reviewed)
- **Parameters:** `studentId: string`; `absenceDate: string`; `reasonType: 'medical' | 'family' | 'travel' | 'other'`; `guardianExplanation: string`; `attachment?: { name: string; mime: string; base64: string }`; `aiAnalysis?: any`
- **Returns:** `Promise<Justification>` (declared)
- **Dependencies:** none detected
- **Calls:** `isOffDay` (src/context/AttendanceContext.tsx:1152), `handleFirestoreError` (src/lib/firebase.ts:72), `addAuditLog` (src/context/AttendanceContext.tsx:1725)
- **Called By:** no in-repo caller resolved (entry point, event handler, route, or referenced by value)
- **Database Interaction:** WRITE on `attendance_sessions`, `justifications`
- **External Services:** None detected.
- **Authentication:** Uses `firebaseUser`/token
- **Authorization:** References: `currentUserRole`
- **Validation:** None detected.
- **Errors:** 3 throw, 2 .catch
- **Side Effects:** React state: `setAllJustifications`, `setAllSessions`, `setDoc`
- **Edge Cases:** UNKNOWN (not individually reviewed)
- **Security Considerations:** Uses `any` typing.
- **Current Limitations:** UNKNOWN (not individually reviewed)

### `reviewJustification` (nested in `AttendanceProvider`)
- **File:** `src/context/AttendanceContext.tsx:2198-2316`  · **Review:** AUTO
- **Purpose:** UNKNOWN (no in-code description; not individually reviewed)
- **Parameters:** `justificationId: string`; `status: 'approved' | 'rejected'`; `notes: string`
- **Returns:** `void` (inferred)
- **Dependencies:** none detected
- **Calls:** `toFirestoreData` (src/context/AttendanceContext.tsx:112), `addAuditLog` (src/context/AttendanceContext.tsx:1725), `handleFirestoreError` (src/lib/firebase.ts:72)
- **Called By:** no in-repo caller resolved (entry point, event handler, route, or referenced by value)
- **Database Interaction:** WRITE on `justifications`, `notification_outbox`
- **External Services:** None detected.
- **Authentication:** Uses `firebaseUser`/token
- **Authorization:** References: `canReviewJustifications`
- **Validation:** 2 guard/type/regex check(s) detected.
- **Errors:** 2 .catch
- **Side Effects:** React state: `setAllJustifications`, `setAllNotifications`, `setAllSessions`, `setDoc`; console output
- **Edge Cases:** UNKNOWN (not individually reviewed)
- **Security Considerations:** Fire-and-forget Firestore write: failures are only logged.
- **Current Limitations:** UNKNOWN (not individually reviewed)

### `updateJustificationAnalysis` (nested in `AttendanceProvider`)
- **File:** `src/context/AttendanceContext.tsx:2318-2322`  · **Review:** AUTO
- **Purpose:** UNKNOWN (no in-code description; not individually reviewed)
- **Parameters:** `justificationId: string`; `aiAnalysis: any`
- **Returns:** `void` (inferred)
- **Dependencies:** none detected
- **Calls:** no in-repo callees resolved
- **Called By:** no in-repo caller resolved (entry point, event handler, route, or referenced by value)
- **Database Interaction:** None detected.
- **External Services:** None detected.
- **Authentication:** No authentication logic inside this function.
- **Authorization:** No role/permission check inside this function.
- **Validation:** None detected.
- **Errors:** None detected.
- **Side Effects:** React state: `setAllJustifications`
- **Edge Cases:** UNKNOWN (not individually reviewed)
- **Security Considerations:** Uses `any` typing.
- **Current Limitations:** UNKNOWN (not individually reviewed)

### `retryNotification` (nested in `AttendanceProvider`)
- **File:** `src/context/AttendanceContext.tsx:2324-2449`  · **Review:** AUTO
- **Purpose:** UNKNOWN (no in-code description; not individually reviewed)
- **Parameters:** `id: string`
- **Returns:** `Promise<boolean>` (declared)
- **Dependencies:** none detected
- **Calls:** `authenticatedFetch` (src/lib/api.ts:46), `setItem` (src/utils/localCache.ts:60), `addAuditLog` (src/context/AttendanceContext.tsx:1725)
- **Called By:** no in-repo caller resolved (entry point, event handler, route, or referenced by value)
- **Database Interaction:** None detected.
- **External Services:** HTTP /api/notifications/dispatch
- **Authentication:** Uses `firebaseUser`/token
- **Authorization:** References: `canManageOutbox`
- **Validation:** 9 guard/type/regex check(s) detected.
- **Errors:** 1 try/catch
- **Side Effects:** React state: `setAllNotifications`, `setItem`; local storage/cache; console output
- **Edge Cases:** UNKNOWN (not individually reviewed)
- **Security Considerations:** Uses `any` typing.
- **Current Limitations:** UNKNOWN (not individually reviewed)

### `retryAllFailedNotifications` (nested in `AttendanceProvider`)
- **File:** `src/context/AttendanceContext.tsx:2451-2533`  · **Review:** AUTO
- **Purpose:** UNKNOWN (no in-code description; not individually reviewed)
- **Parameters:** none
- **Returns:** `Promise<void>` (inferred)
- **Dependencies:** none detected
- **Calls:** `authenticatedFetch` (src/lib/api.ts:46), `setItem` (src/utils/localCache.ts:60), `addAuditLog` (src/context/AttendanceContext.tsx:1725)
- **Called By:** no in-repo caller resolved (entry point, event handler, route, or referenced by value)
- **Database Interaction:** None detected.
- **External Services:** HTTP /api/notifications/dispatch
- **Authentication:** Uses `firebaseUser`/token
- **Authorization:** References: `canManageOutbox`
- **Validation:** 4 guard/type/regex check(s) detected.
- **Errors:** 1 try/catch
- **Side Effects:** React state: `setAllNotifications`, `setItem`; local storage/cache; console output
- **Edge Cases:** UNKNOWN (not individually reviewed)
- **Security Considerations:** Uses `any` typing.
- **Current Limitations:** UNKNOWN (not individually reviewed)

### `sendCustomParentNotification` (nested in `AttendanceProvider`)
- **File:** `src/context/AttendanceContext.tsx:2535-2701`  · **Review:** AUTO
- **Purpose:** UNKNOWN (no in-code description; not individually reviewed)
- **Parameters:** `params: { studentIds: string[]; messageText: string; channel: 'SMS' | 'WhatsApp'; category?: 'absence' | 'late' | 'warning' | 'broadcast' | 'excuse_approved'; a`
- **Returns:** `number` (declared)
- **Dependencies:** none detected
- **Calls:** `authenticatedFetch` (src/lib/api.ts:46), `handleFirestoreError` (src/lib/firebase.ts:72), `addAuditLog` (src/context/AttendanceContext.tsx:1725)
- **Called By:** no in-repo caller resolved (entry point, event handler, route, or referenced by value)
- **Database Interaction:** WRITE on `notification_outbox`, `settings`
- **External Services:** HTTP /api/notifications/dispatch
- **Authentication:** Uses `firebaseUser`/token
- **Authorization:** References: `canManageOutbox`
- **Validation:** 4 guard/type/regex check(s) detected.
- **Errors:** 2 .catch
- **Side Effects:** React state: `setAllNotifications`, `setDoc`; console output
- **Edge Cases:** UNKNOWN (not individually reviewed)
- **Security Considerations:** Uses `any` typing.
- **Current Limitations:** UNKNOWN (not individually reviewed)

### `sendChronicWarningNotification` (nested in `AttendanceProvider`)
- **File:** `src/context/AttendanceContext.tsx:2703-2770`  · **Review:** AUTO
- **Purpose:** UNKNOWN (no in-code description; not individually reviewed)
- **Parameters:** `studentId: string`; `warningTier: number`
- **Returns:** `boolean` (declared)
- **Dependencies:** none detected
- **Calls:** `handleFirestoreError` (src/lib/firebase.ts:72), `addAuditLog` (src/context/AttendanceContext.tsx:1725)
- **Called By:** `sendAllChronicWarningNotifications` (src/context/AttendanceContext.tsx:2772)
- **Database Interaction:** WRITE on `notification_outbox`
- **External Services:** None detected.
- **Authentication:** Uses `firebaseUser`/token
- **Authorization:** No role/permission check inside this function.
- **Validation:** 1 guard/type/regex check(s) detected.
- **Errors:** 1 .catch
- **Side Effects:** React state: `setAllNotifications`, `setDoc`
- **Edge Cases:** UNKNOWN (not individually reviewed)
- **Security Considerations:** None noted (not individually reviewed).
- **Current Limitations:** UNKNOWN (not individually reviewed)

### `sendAllChronicWarningNotifications` (nested in `AttendanceProvider`)
- **File:** `src/context/AttendanceContext.tsx:2772-2782`  · **Review:** AUTO
- **Purpose:** UNKNOWN (no in-code description; not individually reviewed)
- **Parameters:** `tierThreshold = 3`
- **Returns:** `number` (declared)
- **Dependencies:** none detected
- **Calls:** `sendChronicWarningNotification` (src/context/AttendanceContext.tsx:2703)
- **Called By:** no in-repo caller resolved (entry point, event handler, route, or referenced by value)
- **Database Interaction:** None detected.
- **External Services:** None detected.
- **Authentication:** No authentication logic inside this function.
- **Authorization:** No role/permission check inside this function.
- **Validation:** None detected.
- **Errors:** None detected.
- **Side Effects:** None detected.
- **Edge Cases:** UNKNOWN (not individually reviewed)
- **Security Considerations:** None noted (not individually reviewed).
- **Current Limitations:** UNKNOWN (not individually reviewed)

### `persistStudent` (nested in `AttendanceProvider`)
- **File:** `src/context/AttendanceContext.tsx:2784-2789`  · **Review:** AUTO
- **Purpose:** UNKNOWN (no in-code description; not individually reviewed)
- **Parameters:** `student: Student`
- **Returns:** `void` (inferred)
- **Dependencies:** none detected
- **Calls:** `toFirestoreData` (src/context/AttendanceContext.tsx:112)
- **Called By:** `addStudent` (src/context/AttendanceContext.tsx:2879)
- **Database Interaction:** WRITE on `students`
- **External Services:** None detected.
- **Authentication:** Uses `firebaseUser`/token
- **Authorization:** No role/permission check inside this function.
- **Validation:** 1 guard/type/regex check(s) detected.
- **Errors:** 1 .catch
- **Side Effects:** React state: `setDoc`; console output
- **Edge Cases:** UNKNOWN (not individually reviewed)
- **Security Considerations:** Fire-and-forget Firestore write: failures are only logged.
- **Current Limitations:** UNKNOWN (not individually reviewed)

### `persistStudentPatch` (nested in `AttendanceProvider`)
- **File:** `src/context/AttendanceContext.tsx:2791-2796`  · **Review:** AUTO
- **Purpose:** UNKNOWN (no in-code description; not individually reviewed)
- **Parameters:** `studentId: string`; `updates: Partial<Student>`
- **Returns:** `void` (inferred)
- **Dependencies:** none detected
- **Calls:** `toFirestoreData` (src/context/AttendanceContext.tsx:112)
- **Called By:** `updateStudent` (src/context/AttendanceContext.tsx:2917), `transferStudent` (src/context/AttendanceContext.tsx:2941), `restoreStudent` (src/context/AttendanceContext.tsx:2985)
- **Database Interaction:** WRITE on `students`
- **External Services:** None detected.
- **Authentication:** Uses `firebaseUser`/token
- **Authorization:** No role/permission check inside this function.
- **Validation:** 1 guard/type/regex check(s) detected.
- **Errors:** 1 .catch
- **Side Effects:** React state: `setDoc`; console output
- **Edge Cases:** UNKNOWN (not individually reviewed)
- **Security Considerations:** Fire-and-forget Firestore write: failures are only logged.
- **Current Limitations:** UNKNOWN (not individually reviewed)

### `importStudents` (nested in `AttendanceProvider`)
- **File:** `src/context/AttendanceContext.tsx:2797-2877`  · **Review:** AUTO
- **Purpose:** UNKNOWN (no in-code description; not individually reviewed)
- **Parameters:** `newStudentsList: Partial<Student>[]`
- **Returns:** `{ imported: number; duplicates: number; }` (inferred)
- **Dependencies:** none detected
- **Calls:** `addAuditLog` (src/context/AttendanceContext.tsx:1725)
- **Called By:** no in-repo caller resolved (entry point, event handler, route, or referenced by value)
- **Database Interaction:** None detected.
- **External Services:** None detected.
- **Authentication:** Uses `firebaseUser`/token
- **Authorization:** References: `canImportStudents`
- **Validation:** 2 guard/type/regex check(s) detected.
- **Errors:** None detected.
- **Side Effects:** React state: `setAllStudents`; console output
- **Edge Cases:** UNKNOWN (not individually reviewed)
- **Security Considerations:** None noted (not individually reviewed).
- **Current Limitations:** UNKNOWN (not individually reviewed)

### `addStudent` (nested in `AttendanceProvider`)
- **File:** `src/context/AttendanceContext.tsx:2879-2915`  · **Review:** AUTO
- **Purpose:** UNKNOWN (no in-code description; not individually reviewed)
- **Parameters:** `studentData: Omit<Student, 'id' | 'tenantId' | 'attendanceRate' | 'totalAbsences' | 'totalLates'>`
- **Returns:** `Student` (declared)
- **Dependencies:** none detected
- **Calls:** `setItem` (src/utils/localCache.ts:60), `persistStudent` (src/context/AttendanceContext.tsx:2784), `addAuditLog` (src/context/AttendanceContext.tsx:1725)
- **Called By:** no in-repo caller resolved (entry point, event handler, route, or referenced by value)
- **Database Interaction:** None detected.
- **External Services:** None detected.
- **Authentication:** Uses `firebaseUser`/token
- **Authorization:** References: `currentUserRole`
- **Validation:** 1 guard/type/regex check(s) detected.
- **Errors:** None detected.
- **Side Effects:** React state: `setAllStudents`, `setItem`; local storage/cache
- **Edge Cases:** UNKNOWN (not individually reviewed)
- **Security Considerations:** None noted (not individually reviewed).
- **Current Limitations:** UNKNOWN (not individually reviewed)

### `updateStudent` (nested in `AttendanceProvider`)
- **File:** `src/context/AttendanceContext.tsx:2917-2939`  · **Review:** AUTO
- **Purpose:** UNKNOWN (no in-code description; not individually reviewed)
- **Parameters:** `studentId: string`; `updates: Partial<Student>`
- **Returns:** `void` (inferred)
- **Dependencies:** none detected
- **Calls:** `persistStudentPatch` (src/context/AttendanceContext.tsx:2791), `setItem` (src/utils/localCache.ts:60), `addAuditLog` (src/context/AttendanceContext.tsx:1725)
- **Called By:** no in-repo caller resolved (entry point, event handler, route, or referenced by value)
- **Database Interaction:** None detected.
- **External Services:** None detected.
- **Authentication:** Uses `firebaseUser`/token
- **Authorization:** References: `currentUserRole`
- **Validation:** 1 guard/type/regex check(s) detected.
- **Errors:** None detected.
- **Side Effects:** React state: `setAllStudents`, `setItem`; local storage/cache
- **Edge Cases:** UNKNOWN (not individually reviewed)
- **Security Considerations:** None noted (not individually reviewed).
- **Current Limitations:** UNKNOWN (not individually reviewed)

### `transferStudent` (nested in `AttendanceProvider`)
- **File:** `src/context/AttendanceContext.tsx:2941-2983`  · **Review:** AUTO
- **Purpose:** UNKNOWN (no in-code description; not individually reviewed)
- **Parameters:** `studentId: string`; `details: { destinationSchool: string; reason?: string }`
- **Returns:** `void` (inferred)
- **Dependencies:** none detected
- **Calls:** `persistStudentPatch` (src/context/AttendanceContext.tsx:2791), `setItem` (src/utils/localCache.ts:60), `addAuditLog` (src/context/AttendanceContext.tsx:1725)
- **Called By:** no in-repo caller resolved (entry point, event handler, route, or referenced by value)
- **Database Interaction:** None detected.
- **External Services:** None detected.
- **Authentication:** Uses `firebaseUser`/token
- **Authorization:** References: `currentUserRole`
- **Validation:** 2 guard/type/regex check(s) detected.
- **Errors:** None detected.
- **Side Effects:** React state: `setAllStudents`, `setItem`; local storage/cache
- **Edge Cases:** UNKNOWN (not individually reviewed)
- **Security Considerations:** None noted (not individually reviewed).
- **Current Limitations:** UNKNOWN (not individually reviewed)

### `restoreStudent` (nested in `AttendanceProvider`)
- **File:** `src/context/AttendanceContext.tsx:2985-3023`  · **Review:** AUTO
- **Purpose:** UNKNOWN (no in-code description; not individually reviewed)
- **Parameters:** `studentId: string`
- **Returns:** `void` (inferred)
- **Dependencies:** none detected
- **Calls:** `persistStudentPatch` (src/context/AttendanceContext.tsx:2791), `setItem` (src/utils/localCache.ts:60), `addAuditLog` (src/context/AttendanceContext.tsx:1725)
- **Called By:** no in-repo caller resolved (entry point, event handler, route, or referenced by value)
- **Database Interaction:** None detected.
- **External Services:** None detected.
- **Authentication:** Uses `firebaseUser`/token
- **Authorization:** References: `currentUserRole`
- **Validation:** 2 guard/type/regex check(s) detected.
- **Errors:** None detected.
- **Side Effects:** React state: `setAllStudents`, `setItem`; local storage/cache
- **Edge Cases:** UNKNOWN (not individually reviewed)
- **Security Considerations:** None noted (not individually reviewed).
- **Current Limitations:** UNKNOWN (not individually reviewed)

### `deleteStudent` (nested in `AttendanceProvider`)
- **File:** `src/context/AttendanceContext.tsx:3025-3057`  · **Review:** AUTO
- **Purpose:** UNKNOWN (no in-code description; not individually reviewed)
- **Parameters:** `studentId: string`
- **Returns:** `{ success: boolean; message: string }` (declared)
- **Dependencies:** none detected
- **Calls:** `setItem` (src/utils/localCache.ts:60), `addAuditLog` (src/context/AttendanceContext.tsx:1725)
- **Called By:** no in-repo caller resolved (entry point, event handler, route, or referenced by value)
- **Database Interaction:** WRITE on `students`
- **External Services:** None detected.
- **Authentication:** Uses `firebaseUser`/token
- **Authorization:** References: `currentUserRole`
- **Validation:** 2 guard/type/regex check(s) detected.
- **Errors:** 1 .catch
- **Side Effects:** React state: `setAllStudents`, `setItem`; local storage/cache; console output
- **Edge Cases:** UNKNOWN (not individually reviewed)
- **Security Considerations:** Fire-and-forget Firestore write: failures are only logged.
- **Current Limitations:** UNKNOWN (not individually reviewed)

### `updateSettings` (nested in `AttendanceProvider`)
- **File:** `src/context/AttendanceContext.tsx:3059-3088`  · **Review:** AUTO
- **Purpose:** UNKNOWN (no in-code description; not individually reviewed)
- **Parameters:** `newSettings: Partial<SchoolSettings>`
- **Returns:** `void` (inferred)
- **Dependencies:** none detected
- **Calls:** `setItem` (src/utils/localCache.ts:60), `addAuditLog` (src/context/AttendanceContext.tsx:1725)
- **Called By:** no in-repo caller resolved (entry point, event handler, route, or referenced by value)
- **Database Interaction:** None detected.
- **External Services:** None detected.
- **Authentication:** Uses `firebaseUser`/token
- **Authorization:** References: `canManageSettings`
- **Validation:** 2 guard/type/regex check(s) detected.
- **Errors:** None detected.
- **Side Effects:** React state: `setItem`, `setSettingsMap`; local storage/cache; console output
- **Edge Cases:** UNKNOWN (not individually reviewed)
- **Security Considerations:** None noted (not individually reviewed).
- **Current Limitations:** UNKNOWN (not individually reviewed)

### `updateSchoolProfile` (nested in `AttendanceProvider`)
- **File:** `src/context/AttendanceContext.tsx:3090-3158`  · **Review:** AUTO
- **Purpose:** UNKNOWN (no in-code description; not individually reviewed)
- **Parameters:** `newProfile: Partial<TenantSchoolProfile>`
- **Returns:** `Promise<void>` (declared)
- **Dependencies:** none detected
- **Calls:** `getDefaultSchoolProfile` (src/config/tenantSettings.ts:242), `setItem` (src/utils/localCache.ts:60), `addAuditLog` (src/context/AttendanceContext.tsx:1725)
- **Called By:** no in-repo caller resolved (entry point, event handler, route, or referenced by value)
- **Database Interaction:** None detected.
- **External Services:** None detected.
- **Authentication:** Uses `firebaseUser`/token
- **Authorization:** References: `canManageSettings`, `isSuperAdmin`
- **Validation:** 2 guard/type/regex check(s) detected.
- **Errors:** None detected.
- **Side Effects:** React state: `setItem`, `setSchoolProfilesMap`; local storage/cache; console output
- **Edge Cases:** UNKNOWN (not individually reviewed)
- **Security Considerations:** None noted (not individually reviewed).
- **Current Limitations:** UNKNOWN (not individually reviewed)

### `updateMessagingGateway` (nested in `AttendanceProvider`)
- **File:** `src/context/AttendanceContext.tsx:3160-3248`  · **Review:** AUTO
- **Purpose:** UNKNOWN (no in-code description; not individually reviewed)
- **Parameters:** `config: Partial<SchoolMessagingGatewayConfig>`
- **Returns:** `{ success: boolean; message: string }` (declared)
- **Dependencies:** none detected
- **Calls:** `getDefaultSchoolProfile` (src/config/tenantSettings.ts:242), `setItem` (src/utils/localCache.ts:60), `getDefaultSchoolSettings` (src/config/defaultSettings.ts:9), `addAuditLog` (src/context/AttendanceContext.tsx:1725)
- **Called By:** no in-repo caller resolved (entry point, event handler, route, or referenced by value)
- **Database Interaction:** None detected.
- **External Services:** None detected.
- **Authentication:** Uses `firebaseUser`/token
- **Authorization:** References: `isSuperAdmin`
- **Validation:** 3 guard/type/regex check(s) detected.
- **Errors:** None detected.
- **Side Effects:** React state: `setItem`, `setSchoolProfilesMap`, `setSettingsMap`; local storage/cache; console output
- **Edge Cases:** UNKNOWN (not individually reviewed)
- **Security Considerations:** None noted (not individually reviewed).
- **Current Limitations:** UNKNOWN (not individually reviewed)

### `updateDigestConfig` (nested in `AttendanceProvider`)
- **File:** `src/context/AttendanceContext.tsx:3250-3265`  · **Review:** AUTO
- **Purpose:** UNKNOWN (no in-code description; not individually reviewed)
- **Parameters:** `cfg: Partial<DailyEmailDigestConfig>`
- **Returns:** `void` (inferred)
- **Dependencies:** none detected
- **Calls:** `addAuditLog` (src/context/AttendanceContext.tsx:1725)
- **Called By:** no in-repo caller resolved (entry point, event handler, route, or referenced by value)
- **Database Interaction:** None detected.
- **External Services:** None detected.
- **Authentication:** Uses `firebaseUser`/token
- **Authorization:** No role/permission check inside this function.
- **Validation:** None detected.
- **Errors:** None detected.
- **Side Effects:** React state: `setDigestConfig`
- **Edge Cases:** UNKNOWN (not individually reviewed)
- **Security Considerations:** None noted (not individually reviewed).
- **Current Limitations:** UNKNOWN (not individually reviewed)

### `generateCurrentDigest` (nested in `AttendanceProvider`)
- **File:** `src/context/AttendanceContext.tsx:3267-3323`  · **Review:** AUTO
- **Purpose:** UNKNOWN (no in-code description; not individually reviewed)
- **Parameters:** `customConfig?: Partial<DailyEmailDigestConfig>`
- **Returns:** `Promise<DailyEmailDigestItem>` (declared)
- **Dependencies:** none detected
- **Calls:** `computeDailyDigestData` (src/utils/digestEngine.ts:12), `authenticatedFetch` (src/lib/api.ts:46), `generateHtmlEmailTemplate` (src/utils/digestEngine.ts:210)
- **Called By:** `dispatchDailyDigest` (src/context/AttendanceContext.tsx:3325)
- **Database Interaction:** None detected.
- **External Services:** HTTP /api/daily-digest/generate-briefing
- **Authentication:** Uses `firebaseUser`/token
- **Authorization:** No role/permission check inside this function.
- **Validation:** None detected.
- **Errors:** 1 try/catch
- **Side Effects:** console output
- **Edge Cases:** UNKNOWN (not individually reviewed)
- **Security Considerations:** Uses `any` typing.
- **Current Limitations:** UNKNOWN (not individually reviewed)

### `dispatchDailyDigest` (nested in `AttendanceProvider`)
- **File:** `src/context/AttendanceContext.tsx:3325-3431`  · **Review:** AUTO
- **Purpose:** UNKNOWN (no in-code description; not individually reviewed)
- **Parameters:** `digestId?: string`; `targetRecipients?: string[]`
- **Returns:** `Promise<{ success: boolean; message: string; digestItem: DailyEmailDigestItem }>` (declared)
- **Dependencies:** none detected
- **Calls:** `generateCurrentDigest` (src/context/AttendanceContext.tsx:3267), `authenticatedFetch` (src/lib/api.ts:46), `addAuditLog` (src/context/AttendanceContext.tsx:1725)
- **Called By:** no in-repo caller resolved (entry point, event handler, route, or referenced by value)
- **Database Interaction:** None detected.
- **External Services:** HTTP /api/daily-digest/dispatch
- **Authentication:** Uses `firebaseUser`/token
- **Authorization:** References: `canDispatchDigest`
- **Validation:** 2 guard/type/regex check(s) detected.
- **Errors:** 1 try/catch, 1 throw
- **Side Effects:** React state: `setDigestConfig`, `setDigestHistory`; console output
- **Edge Cases:** UNKNOWN (not individually reviewed)
- **Security Considerations:** Uses `any` typing.
- **Current Limitations:** UNKNOWN (not individually reviewed)

### `provisionNewSchool` (nested in `AttendanceProvider`)
- **File:** `src/context/AttendanceContext.tsx:3433-3648`  · **Review:** AUTO
- **Purpose:** UNKNOWN (no in-code description; not individually reviewed)
- **Parameters:** `input: SchoolProvisionInput`
- **Returns:** `Promise<{
    success: boolean;
    message: string;
    tenantId: string;
    principalEmail?: string;
    temporaryPassword?: string;
  }>` (declared)
- **Dependencies:** admin
- **Calls:** `getActiveTenantRegistry` (src/config/tenantRegistry.ts:101), `setItem` (src/utils/localCache.ts:60), `getDefaultSchoolProfile` (src/config/tenantSettings.ts:242), `getDefaultSchoolSettings` (src/config/defaultSettings.ts:9), `authenticatedFetch` (src/lib/api.ts:46), `addAuditLog` (src/context/AttendanceContext.tsx:1725)
- **Called By:** no in-repo caller resolved (entry point, event handler, route, or referenced by value)
- **Database Interaction:** None detected.
- **External Services:** HTTP /api/tenants/provision
- **Authentication:** Uses `firebaseUser`/token
- **Authorization:** No role/permission check inside this function.
- **Validation:** 6 guard/type/regex check(s) detected.
- **Errors:** 2 try/catch, 1 .catch
- **Side Effects:** React state: `setAllUsers`, `setDynamicTenants`, `setItem`, `setSchoolProfilesMap`, `setSettingsMap`; local storage/cache; console output; DOM/window access
- **Edge Cases:** UNKNOWN (not individually reviewed)
- **Security Considerations:** Uses `any` typing.
- **Current Limitations:** UNKNOWN (not individually reviewed)

### `useAttendance`
- **File:** `src/context/AttendanceContext.tsx:3733-3739`  · **Review:** AUTO
- **Purpose:** UNKNOWN (no in-code description; not individually reviewed)
- **Parameters:** none
- **Returns:** `AttendanceContextType` (inferred)
- **Dependencies:** none detected
- **Calls:** no in-repo callees resolved
- **Called By:** `PlatformOwnerModal` (src/components/superadmin/PlatformOwnerModal.tsx:65), `HeaderNav` (src/components/HeaderNav.tsx:56), `AppSidebar` (src/components/AppSidebar.tsx:52), `LoginPage` (src/components/LoginPage.tsx:22), `OfflineSyncModal` (src/components/OfflineSyncModal.tsx:43), `WeeklyAttendanceTrendCard` (src/components/WeeklyAttendanceTrendCard.tsx:49), `DigestSettingsModal` (src/components/digest/DigestSettingsModal.tsx:13), `ExecutiveMorningBriefingCard` (src/components/dashboard/ExecutiveMorningBriefingCard.tsx:24), `ExecutiveDashboardView` (src/components/ExecutiveDashboardView.tsx:48), `QRScannerModal` (src/components/QRScannerModal.tsx:84) … (+39)
- **Database Interaction:** None detected.
- **External Services:** None detected.
- **Authentication:** No authentication logic inside this function.
- **Authorization:** No role/permission check inside this function.
- **Validation:** 1 guard/type/regex check(s) detected.
- **Errors:** 1 throw
- **Side Effects:** None detected.
- **Edge Cases:** UNKNOWN (not individually reviewed)
- **Security Considerations:** None noted (not individually reviewed).
- **Current Limitations:** UNKNOWN (not individually reviewed)


## src/context/ThemeContext.tsx

### `ThemeProvider`
- **File:** `src/context/ThemeContext.tsx:92-149`  · **Review:** AUTO
- **Purpose:** UNKNOWN (no in-code description; not individually reviewed)
- **Parameters:** `{ children }`
- **Returns:** `Element` (inferred)
- **Dependencies:** none detected
- **Calls:** no in-repo callees resolved
- **Called By:** no in-repo caller resolved (entry point, event handler, route, or referenced by value)
- **Database Interaction:** None detected.
- **External Services:** None detected.
- **Authentication:** No authentication logic inside this function.
- **Authorization:** No role/permission check inside this function.
- **Validation:** 2 guard/type/regex check(s) detected.
- **Errors:** None detected.
- **Side Effects:** React state: `setAttribute`, `setItem`, `setTheme`, `setThemeState`; local storage/cache; DOM/window access
- **Edge Cases:** UNKNOWN (not individually reviewed)
- **Security Considerations:** None noted (not individually reviewed).
- **Current Limitations:** UNKNOWN (not individually reviewed)

### `setTheme` (nested in `ThemeProvider`)
- **File:** `src/context/ThemeContext.tsx:106-111`  · **Review:** AUTO
- **Purpose:** UNKNOWN (no in-code description; not individually reviewed)
- **Parameters:** `newTheme: AppThemeId`
- **Returns:** `void` (inferred)
- **Dependencies:** none detected
- **Calls:** no in-repo callees resolved
- **Called By:** `toggleDarkMode` (src/context/ThemeContext.tsx:113)
- **Database Interaction:** None detected.
- **External Services:** None detected.
- **Authentication:** No authentication logic inside this function.
- **Authorization:** No role/permission check inside this function.
- **Validation:** 1 guard/type/regex check(s) detected.
- **Errors:** None detected.
- **Side Effects:** React state: `setItem`, `setThemeState`; local storage/cache
- **Edge Cases:** UNKNOWN (not individually reviewed)
- **Security Considerations:** None noted (not individually reviewed).
- **Current Limitations:** UNKNOWN (not individually reviewed)

### `toggleDarkMode` (nested in `ThemeProvider`)
- **File:** `src/context/ThemeContext.tsx:113-119`  · **Review:** AUTO
- **Purpose:** UNKNOWN (no in-code description; not individually reviewed)
- **Parameters:** none
- **Returns:** `void` (inferred)
- **Dependencies:** none detected
- **Calls:** `setTheme` (src/context/ThemeContext.tsx:106)
- **Called By:** no in-repo caller resolved (entry point, event handler, route, or referenced by value)
- **Database Interaction:** None detected.
- **External Services:** None detected.
- **Authentication:** No authentication logic inside this function.
- **Authorization:** No role/permission check inside this function.
- **Validation:** None detected.
- **Errors:** None detected.
- **Side Effects:** React state: `setTheme`
- **Edge Cases:** UNKNOWN (not individually reviewed)
- **Security Considerations:** None noted (not individually reviewed).
- **Current Limitations:** UNKNOWN (not individually reviewed)

### `useTheme`
- **File:** `src/context/ThemeContext.tsx:151-157`  · **Review:** AUTO
- **Purpose:** UNKNOWN (no in-code description; not individually reviewed)
- **Parameters:** none
- **Returns:** `ThemeContextType` (declared)
- **Dependencies:** none detected
- **Calls:** no in-repo callees resolved
- **Called By:** `ThemeSwitcherDropdown` (src/components/ThemeSwitcherDropdown.tsx:15)
- **Database Interaction:** None detected.
- **External Services:** None detected.
- **Authentication:** No authentication logic inside this function.
- **Authorization:** No role/permission check inside this function.
- **Validation:** 1 guard/type/regex check(s) detected.
- **Errors:** 1 throw
- **Side Effects:** None detected.
- **Edge Cases:** UNKNOWN (not individually reviewed)
- **Security Considerations:** None noted (not individually reviewed).
- **Current Limitations:** UNKNOWN (not individually reviewed)



# UI components


## src/components/AppSidebar.tsx

### `AppSidebar`
- **File:** `src/components/AppSidebar.tsx:52-426`  · **Review:** AUTO
- **Purpose:** UNKNOWN (no in-code description; not individually reviewed)
- **Parameters:** `{ activeTab, setActiveTab, isCollapsed, setIsCollapsed, mobileOpen, setMobileOpen, }`
- **Returns:** `Element` (inferred)
- **Dependencies:** admin
- **Calls:** `useAttendance` (src/context/AttendanceContext.tsx:3733), `handleSelect` (src/components/AppSidebar.tsx:197), `isItemActive` (src/components/AppSidebar.tsx:294), `toggleSection` (src/components/AppSidebar.tsx:79)
- **Called By:** no in-repo caller resolved (entry point, event handler, route, or referenced by value)
- **Database Interaction:** None detected.
- **External Services:** None detected.
- **Authentication:** Uses `firebaseUser`/token
- **Authorization:** No role/permission check inside this function.
- **Validation:** None detected.
- **Errors:** None detected.
- **Side Effects:** React state: `setActiveTab`, `setExpandedSections`, `setIsCollapsed`, `setMobileOpen`
- **Edge Cases:** UNKNOWN (not individually reviewed)
- **Security Considerations:** None noted (not individually reviewed).
- **Current Limitations:** UNKNOWN (not individually reviewed)

### `toggleSection` (nested in `AppSidebar`)
- **File:** `src/components/AppSidebar.tsx:79-86`  · **Review:** AUTO
- **Purpose:** UNKNOWN (no in-code description; not individually reviewed)
- **Parameters:** `sectionId: string`
- **Returns:** `void` (inferred)
- **Dependencies:** none detected
- **Calls:** no in-repo callees resolved
- **Called By:** `AppSidebar` (src/components/AppSidebar.tsx:52)
- **Database Interaction:** None detected.
- **External Services:** None detected.
- **Authentication:** No authentication logic inside this function.
- **Authorization:** No role/permission check inside this function.
- **Validation:** None detected.
- **Errors:** None detected.
- **Side Effects:** React state: `setExpandedSections`, `setIsCollapsed`
- **Edge Cases:** UNKNOWN (not individually reviewed)
- **Security Considerations:** None noted (not individually reviewed).
- **Current Limitations:** UNKNOWN (not individually reviewed)

### `handleSelect` (nested in `AppSidebar`)
- **File:** `src/components/AppSidebar.tsx:197-200`  · **Review:** AUTO
- **Purpose:** UNKNOWN (no in-code description; not individually reviewed)
- **Parameters:** `id: ActiveTab`
- **Returns:** `void` (inferred)
- **Dependencies:** none detected
- **Calls:** no in-repo callees resolved
- **Called By:** `AppSidebar` (src/components/AppSidebar.tsx:52)
- **Database Interaction:** None detected.
- **External Services:** None detected.
- **Authentication:** No authentication logic inside this function.
- **Authorization:** No role/permission check inside this function.
- **Validation:** None detected.
- **Errors:** None detected.
- **Side Effects:** React state: `setActiveTab`, `setMobileOpen`
- **Edge Cases:** UNKNOWN (not individually reviewed)
- **Security Considerations:** None noted (not individually reviewed).
- **Current Limitations:** UNKNOWN (not individually reviewed)

### `isItemActive` (nested in `AppSidebar`)
- **File:** `src/components/AppSidebar.tsx:294-301`  · **Review:** AUTO
- **Purpose:** UNKNOWN (no in-code description; not individually reviewed)
- **Parameters:** `targetId: ActiveTab`
- **Returns:** `boolean` (inferred)
- **Dependencies:** none detected
- **Calls:** no in-repo callees resolved
- **Called By:** `AppSidebar` (src/components/AppSidebar.tsx:52)
- **Database Interaction:** None detected.
- **External Services:** None detected.
- **Authentication:** No authentication logic inside this function.
- **Authorization:** No role/permission check inside this function.
- **Validation:** None detected.
- **Errors:** None detected.
- **Side Effects:** None detected.
- **Edge Cases:** UNKNOWN (not individually reviewed)
- **Security Considerations:** None noted (not individually reviewed).
- **Current Limitations:** UNKNOWN (not individually reviewed)


## src/components/AttendanceSessionsView.tsx

### `AttendanceSessionsView`
- **File:** `src/components/AttendanceSessionsView.tsx:38-1367`  · **Review:** AUTO
- **Purpose:** UNKNOWN (no in-code description; not individually reviewed)
- **Parameters:** `{ initialOpenEmergencyModal = false, }`
- **Returns:** `Element` (inferred)
- **Dependencies:** admin
- **Calls:** `useAttendance` (src/context/AttendanceContext.tsx:3733), `handleStatusChange` (src/components/AttendanceSessionsView.tsx:147), `handleMinutesLateChange` (src/components/AttendanceSessionsView.tsx:161)
- **Called By:** no in-repo caller resolved (entry point, event handler, route, or referenced by value)
- **Database Interaction:** None detected.
- **External Services:** None detected.
- **Authentication:** Uses `firebaseUser`/token
- **Authorization:** References: `canEdit`, `canEditSession`, `canReopenSessions`
- **Validation:** 10 guard/type/regex check(s) detected.
- **Errors:** None detected.
- **Side Effects:** React state: `setCelebrationStats`, `setFilterDate`, `setIsBulkConfirmOpen`, `setIsCelebrationOpen`, `setIsEmergencyModalOpen`, `setIsNewSessionModalOpen`, `setIsQuickMarkActive`, `setIsQuickMarkMenuOpen` …
- **Edge Cases:** UNKNOWN (not individually reviewed)
- **Security Considerations:** None noted (not individually reviewed).
- **Current Limitations:** UNKNOWN (not individually reviewed)

### `handleStatusChange` (nested in `AttendanceSessionsView`)
- **File:** `src/components/AttendanceSessionsView.tsx:147-159`  · **Review:** AUTO
- **Purpose:** UNKNOWN (no in-code description; not individually reviewed)
- **Parameters:** `studentId: string`; `status: AttendanceStatus`
- **Returns:** `void` (inferred)
- **Dependencies:** none detected
- **Calls:** no in-repo callees resolved
- **Called By:** `AttendanceSessionsView` (src/components/AttendanceSessionsView.tsx:38)
- **Database Interaction:** None detected.
- **External Services:** None detected.
- **Authentication:** No authentication logic inside this function.
- **Authorization:** References: `canEditSession`
- **Validation:** 1 guard/type/regex check(s) detected.
- **Errors:** None detected.
- **Side Effects:** None detected.
- **Edge Cases:** UNKNOWN (not individually reviewed)
- **Security Considerations:** None noted (not individually reviewed).
- **Current Limitations:** UNKNOWN (not individually reviewed)

### `handleMinutesLateChange` (nested in `AttendanceSessionsView`)
- **File:** `src/components/AttendanceSessionsView.tsx:161-163`  · **Review:** AUTO
- **Purpose:** UNKNOWN (no in-code description; not individually reviewed)
- **Parameters:** `studentId: string`; `minutes: number`
- **Returns:** `void` (inferred)
- **Dependencies:** none detected
- **Calls:** no in-repo callees resolved
- **Called By:** `AttendanceSessionsView` (src/components/AttendanceSessionsView.tsx:38)
- **Database Interaction:** None detected.
- **External Services:** None detected.
- **Authentication:** No authentication logic inside this function.
- **Authorization:** No role/permission check inside this function.
- **Validation:** None detected.
- **Errors:** None detected.
- **Side Effects:** None detected.
- **Edge Cases:** UNKNOWN (not individually reviewed)
- **Security Considerations:** None noted (not individually reviewed).
- **Current Limitations:** UNKNOWN (not individually reviewed)

### `handleQuickMarkWholeClass` (nested in `AttendanceSessionsView`)
- **File:** `src/components/AttendanceSessionsView.tsx:166-195`  · **Review:** AUTO
- **Purpose:** In-code comment: Quick Mark: Mark Whole Class as Present by Default
- **Parameters:** none
- **Returns:** `void` (inferred)
- **Dependencies:** admin
- **Calls:** no in-repo callees resolved
- **Called By:** no in-repo caller resolved (entry point, event handler, route, or referenced by value)
- **Database Interaction:** None detected.
- **External Services:** None detected.
- **Authentication:** Uses `firebaseUser`/token
- **Authorization:** No role/permission check inside this function.
- **Validation:** 1 guard/type/regex check(s) detected.
- **Errors:** None detected.
- **Side Effects:** React state: `setIsQuickMarkActive`, `setIsQuickMarkMenuOpen`, `setIsReopenModalOpen`, `setNotificationBanner`, `setSelectedStudentIdsForGroup`
- **Edge Cases:** UNKNOWN (not individually reviewed)
- **Security Considerations:** None noted (not individually reviewed).
- **Current Limitations:** UNKNOWN (not individually reviewed)

### `handleQuickMarkSelectedGroup` (nested in `AttendanceSessionsView`)
- **File:** `src/components/AttendanceSessionsView.tsx:198-219`  · **Review:** AUTO
- **Purpose:** In-code comment: Quick Mark: Mark Selected Group of Students as Present
- **Parameters:** none
- **Returns:** `void` (inferred)
- **Dependencies:** admin
- **Calls:** no in-repo callees resolved
- **Called By:** `handleRequestQuickMarkPresent` (src/components/AttendanceSessionsView.tsx:229)
- **Database Interaction:** None detected.
- **External Services:** None detected.
- **Authentication:** Uses `firebaseUser`/token
- **Authorization:** No role/permission check inside this function.
- **Validation:** 1 guard/type/regex check(s) detected.
- **Errors:** None detected.
- **Side Effects:** React state: `setIsQuickMarkActive`, `setIsQuickMarkMenuOpen`, `setNotificationBanner`, `setSelectedStudentIdsForGroup`
- **Edge Cases:** UNKNOWN (not individually reviewed)
- **Security Considerations:** None noted (not individually reviewed).
- **Current Limitations:** UNKNOWN (not individually reviewed)

### `handleGroupMarkAsAbsent` (nested in `AttendanceSessionsView`)
- **File:** `src/components/AttendanceSessionsView.tsx:222-226`  · **Review:** AUTO
- **Purpose:** In-code comment: Open confirmation before marking as Absent
- **Parameters:** none
- **Returns:** `void` (inferred)
- **Dependencies:** none detected
- **Calls:** no in-repo callees resolved
- **Called By:** no in-repo caller resolved (entry point, event handler, route, or referenced by value)
- **Database Interaction:** None detected.
- **External Services:** None detected.
- **Authentication:** No authentication logic inside this function.
- **Authorization:** No role/permission check inside this function.
- **Validation:** 1 guard/type/regex check(s) detected.
- **Errors:** None detected.
- **Side Effects:** React state: `setIsBulkConfirmOpen`, `setPendingBulkStatus`
- **Edge Cases:** UNKNOWN (not individually reviewed)
- **Security Considerations:** None noted (not individually reviewed).
- **Current Limitations:** UNKNOWN (not individually reviewed)

### `handleRequestQuickMarkPresent` (nested in `AttendanceSessionsView`)
- **File:** `src/components/AttendanceSessionsView.tsx:229-237`  · **Review:** AUTO
- **Purpose:** In-code comment: Open confirmation before bulk Quick Mark as Present (if more than 3 students)
- **Parameters:** none
- **Returns:** `void` (inferred)
- **Dependencies:** none detected
- **Calls:** `handleQuickMarkSelectedGroup` (src/components/AttendanceSessionsView.tsx:198)
- **Called By:** no in-repo caller resolved (entry point, event handler, route, or referenced by value)
- **Database Interaction:** None detected.
- **External Services:** None detected.
- **Authentication:** No authentication logic inside this function.
- **Authorization:** No role/permission check inside this function.
- **Validation:** 1 guard/type/regex check(s) detected.
- **Errors:** None detected.
- **Side Effects:** React state: `setIsBulkConfirmOpen`, `setPendingBulkStatus`
- **Edge Cases:** UNKNOWN (not individually reviewed)
- **Security Considerations:** None noted (not individually reviewed).
- **Current Limitations:** UNKNOWN (not individually reviewed)

### `handleConfirmBulkAction` (nested in `AttendanceSessionsView`)
- **File:** `src/components/AttendanceSessionsView.tsx:240-268`  · **Review:** AUTO
- **Purpose:** In-code comment: Execution after confirmation
- **Parameters:** none
- **Returns:** `void` (inferred)
- **Dependencies:** none detected
- **Calls:** no in-repo callees resolved
- **Called By:** no in-repo caller resolved (entry point, event handler, route, or referenced by value)
- **Database Interaction:** None detected.
- **External Services:** None detected.
- **Authentication:** No authentication logic inside this function.
- **Authorization:** No role/permission check inside this function.
- **Validation:** 1 guard/type/regex check(s) detected.
- **Errors:** None detected.
- **Side Effects:** React state: `setIsBulkConfirmOpen`, `setIsQuickMarkActive`, `setNotificationBanner`, `setSelectedStudentIdsForGroup`
- **Edge Cases:** UNKNOWN (not individually reviewed)
- **Security Considerations:** None noted (not individually reviewed).
- **Current Limitations:** UNKNOWN (not individually reviewed)

### `handleToggleSelectAll` (nested in `AttendanceSessionsView`)
- **File:** `src/components/AttendanceSessionsView.tsx:271-280`  · **Review:** AUTO
- **Purpose:** In-code comment: Toggle selection for all currently visible students
- **Parameters:** none
- **Returns:** `void` (inferred)
- **Dependencies:** none detected
- **Calls:** no in-repo callees resolved
- **Called By:** no in-repo caller resolved (entry point, event handler, route, or referenced by value)
- **Database Interaction:** None detected.
- **External Services:** None detected.
- **Authentication:** No authentication logic inside this function.
- **Authorization:** No role/permission check inside this function.
- **Validation:** None detected.
- **Errors:** None detected.
- **Side Effects:** React state: `setSelectedStudentIdsForGroup`
- **Edge Cases:** UNKNOWN (not individually reviewed)
- **Security Considerations:** None noted (not individually reviewed).
- **Current Limitations:** UNKNOWN (not individually reviewed)

### `handleSubmitSession` (nested in `AttendanceSessionsView`)
- **File:** `src/components/AttendanceSessionsView.tsx:282-297`  · **Review:** AUTO
- **Purpose:** UNKNOWN (no in-code description; not individually reviewed)
- **Parameters:** none
- **Returns:** `void` (inferred)
- **Dependencies:** none detected
- **Calls:** no in-repo callees resolved
- **Called By:** no in-repo caller resolved (entry point, event handler, route, or referenced by value)
- **Database Interaction:** None detected.
- **External Services:** None detected.
- **Authentication:** No authentication logic inside this function.
- **Authorization:** No role/permission check inside this function.
- **Validation:** 1 guard/type/regex check(s) detected.
- **Errors:** None detected.
- **Side Effects:** React state: `setCelebrationStats`, `setIsCelebrationOpen`, `setNotificationBanner`, `setTimeout`
- **Edge Cases:** UNKNOWN (not individually reviewed)
- **Security Considerations:** None noted (not individually reviewed).
- **Current Limitations:** UNKNOWN (not individually reviewed)

### `handleConfirmReopen` (nested in `AttendanceSessionsView`)
- **File:** `src/components/AttendanceSessionsView.tsx:299-310`  · **Review:** AUTO
- **Purpose:** UNKNOWN (no in-code description; not individually reviewed)
- **Parameters:** none
- **Returns:** `void` (inferred)
- **Dependencies:** none detected
- **Calls:** no in-repo callees resolved
- **Called By:** no in-repo caller resolved (entry point, event handler, route, or referenced by value)
- **Database Interaction:** None detected.
- **External Services:** None detected.
- **Authentication:** No authentication logic inside this function.
- **Authorization:** No role/permission check inside this function.
- **Validation:** 1 guard/type/regex check(s) detected.
- **Errors:** None detected.
- **Side Effects:** React state: `setIsReopenModalOpen`, `setNotificationBanner`, `setReopenReason`, `setTimeout`
- **Edge Cases:** UNKNOWN (not individually reviewed)
- **Security Considerations:** None noted (not individually reviewed).
- **Current Limitations:** UNKNOWN (not individually reviewed)

### `handleCreateSession` (nested in `AttendanceSessionsView`)
- **File:** `src/components/AttendanceSessionsView.tsx:312-339`  · **Review:** AUTO
- **Purpose:** UNKNOWN (no in-code description; not individually reviewed)
- **Parameters:** `e: React.FormEvent`
- **Returns:** `void` (inferred)
- **Dependencies:** none detected
- **Calls:** no in-repo callees resolved
- **Called By:** no in-repo caller resolved (entry point, event handler, route, or referenced by value)
- **Database Interaction:** None detected.
- **External Services:** None detected.
- **Authentication:** No authentication logic inside this function.
- **Authorization:** No role/permission check inside this function.
- **Validation:** 1 guard/type/regex check(s) detected.
- **Errors:** None detected.
- **Side Effects:** React state: `setIsNewSessionModalOpen`, `setSelectedSessionId`
- **Edge Cases:** UNKNOWN (not individually reviewed)
- **Security Considerations:** None noted (not individually reviewed).
- **Current Limitations:** UNKNOWN (not individually reviewed)


## src/components/AuditSettingsView.tsx

### `AuditSettingsView`
- **File:** `src/components/AuditSettingsView.tsx:39-840`  · **Review:** AUTO
- **Purpose:** UNKNOWN (no in-code description; not individually reviewed)
- **Parameters:** none
- **Returns:** `Element` (inferred)
- **Dependencies:** none detected
- **Calls:** `useAttendance` (src/context/AttendanceContext.tsx:3733), `getAuditSearchHaystack` (src/utils/auditLogI18n.ts:146), `translateAuditRole` (src/utils/auditLogI18n.ts:106), `translateAuditAction` (src/utils/auditLogI18n.ts:92), `getAuditDetails` (src/utils/auditLogI18n.ts:137), `translateAuditValue` (src/utils/auditLogI18n.ts:116)
- **Called By:** no in-repo caller resolved (entry point, event handler, route, or referenced by value)
- **Database Interaction:** None detected.
- **External Services:** None detected.
- **Authentication:** Uses `firebaseUser`/token
- **Authorization:** References: `canManageSettings`, `canManageUsers`, `isSuperAdmin`
- **Validation:** 2 guard/type/regex check(s) detected.
- **Errors:** None detected.
- **Side Effects:** React state: `setActiveProfileTab`, `setActiveSubTab`, `setAuditFilter`, `setFormProfile`, `setFormSettings`, `setSaveSuccessMsg`, `setSearchAudit`, `setTimeout`
- **Edge Cases:** UNKNOWN (not individually reviewed)
- **Security Considerations:** Uses `any` typing.
- **Current Limitations:** UNKNOWN (not individually reviewed)

### `handleSaveSettings` (nested in `AuditSettingsView`)
- **File:** `src/components/AuditSettingsView.tsx:88-107`  · **Review:** AUTO
- **Purpose:** UNKNOWN (no in-code description; not individually reviewed)
- **Parameters:** `e: React.FormEvent`
- **Returns:** `void` (inferred)
- **Dependencies:** none detected
- **Calls:** no in-repo callees resolved
- **Called By:** no in-repo caller resolved (entry point, event handler, route, or referenced by value)
- **Database Interaction:** None detected.
- **External Services:** None detected.
- **Authentication:** No authentication logic inside this function.
- **Authorization:** References: `canManageSettings`
- **Validation:** 1 guard/type/regex check(s) detected.
- **Errors:** None detected.
- **Side Effects:** React state: `setSaveSuccessMsg`, `setTimeout`
- **Edge Cases:** UNKNOWN (not individually reviewed)
- **Security Considerations:** None noted (not individually reviewed).
- **Current Limitations:** UNKNOWN (not individually reviewed)

### `handleSaveProfile` (nested in `AuditSettingsView`)
- **File:** `src/components/AuditSettingsView.tsx:109-129`  · **Review:** AUTO
- **Purpose:** UNKNOWN (no in-code description; not individually reviewed)
- **Parameters:** `e?: React.FormEvent | React.MouseEvent`
- **Returns:** `Promise<void>` (inferred)
- **Dependencies:** none detected
- **Calls:** no in-repo callees resolved
- **Called By:** no in-repo caller resolved (entry point, event handler, route, or referenced by value)
- **Database Interaction:** None detected.
- **External Services:** None detected.
- **Authentication:** No authentication logic inside this function.
- **Authorization:** References: `canManageSettings`
- **Validation:** 1 guard/type/regex check(s) detected.
- **Errors:** None detected.
- **Side Effects:** React state: `setSaveSuccessMsg`, `setTimeout`
- **Edge Cases:** UNKNOWN (not individually reviewed)
- **Security Considerations:** None noted (not individually reviewed).
- **Current Limitations:** UNKNOWN (not individually reviewed)


## src/components/BatchQRModal.tsx

### `BatchQRModal`
- **File:** `src/components/BatchQRModal.tsx:15-224`  · **Review:** AUTO
- **Purpose:** UNKNOWN (no in-code description; not individually reviewed)
- **Parameters:** `{ onClose, initialClass = 'all' }`
- **Returns:** `Element` (inferred)
- **Dependencies:** none detected
- **Calls:** `useAttendance` (src/context/AttendanceContext.tsx:3733), `generateAll` (src/components/BatchQRModal.tsx:31), `useModalAccessibility` (src/hooks/useModalAccessibility.ts:17)
- **Called By:** no in-repo caller resolved (entry point, event handler, route, or referenced by value)
- **Database Interaction:** None detected.
- **External Services:** None detected.
- **Authentication:** No authentication logic inside this function.
- **Authorization:** No role/permission check inside this function.
- **Validation:** 2 guard/type/regex check(s) detected.
- **Errors:** 1 try/catch
- **Side Effects:** React state: `setIsGenerating`, `setQrCodeUrls`, `setSelectedClass`; console output; DOM/window access
- **Edge Cases:** UNKNOWN (not individually reviewed)
- **Security Considerations:** Reads `innerHTML` (HTML sent to PDF/print path).
- **Current Limitations:** UNKNOWN (not individually reviewed)

### `generateAll` (nested in `BatchQRModal`)
- **File:** `src/components/BatchQRModal.tsx:31-66`  · **Review:** AUTO
- **Purpose:** UNKNOWN (no in-code description; not individually reviewed)
- **Parameters:** none
- **Returns:** `Promise<void>` (inferred)
- **Dependencies:** none detected
- **Calls:** no in-repo callees resolved
- **Called By:** `BatchQRModal` (src/components/BatchQRModal.tsx:15)
- **Database Interaction:** None detected.
- **External Services:** None detected.
- **Authentication:** No authentication logic inside this function.
- **Authorization:** No role/permission check inside this function.
- **Validation:** 1 guard/type/regex check(s) detected.
- **Errors:** 1 try/catch
- **Side Effects:** React state: `setIsGenerating`, `setQrCodeUrls`; console output
- **Edge Cases:** UNKNOWN (not individually reviewed)
- **Security Considerations:** None noted (not individually reviewed).
- **Current Limitations:** UNKNOWN (not individually reviewed)

### `handleDownloadVectorPdf` (nested in `BatchQRModal`)
- **File:** `src/components/BatchQRModal.tsx:75-86`  · **Review:** AUTO
- **Purpose:** UNKNOWN (no in-code description; not individually reviewed)
- **Parameters:** none
- **Returns:** `Promise<void>` (inferred)
- **Dependencies:** none detected
- **Calls:** `downloadNativePdfFromHtml` (src/utils/pdfExport.ts:66)
- **Called By:** no in-repo caller resolved (entry point, event handler, route, or referenced by value)
- **Database Interaction:** None detected.
- **External Services:** None detected.
- **Authentication:** No authentication logic inside this function.
- **Authorization:** No role/permission check inside this function.
- **Validation:** None detected.
- **Errors:** None detected.
- **Side Effects:** None detected.
- **Edge Cases:** UNKNOWN (not individually reviewed)
- **Security Considerations:** Reads `innerHTML` (HTML sent to PDF/print path).
- **Current Limitations:** UNKNOWN (not individually reviewed)

### `handlePrint` (nested in `BatchQRModal`)
- **File:** `src/components/BatchQRModal.tsx:88-97`  · **Review:** AUTO
- **Purpose:** UNKNOWN (no in-code description; not individually reviewed)
- **Parameters:** none
- **Returns:** `void` (inferred)
- **Dependencies:** none detected
- **Calls:** `printNativePdfFromHtml` (src/utils/pdfExport.ts:104)
- **Called By:** no in-repo caller resolved (entry point, event handler, route, or referenced by value)
- **Database Interaction:** None detected.
- **External Services:** None detected.
- **Authentication:** No authentication logic inside this function.
- **Authorization:** No role/permission check inside this function.
- **Validation:** None detected.
- **Errors:** None detected.
- **Side Effects:** None detected.
- **Edge Cases:** UNKNOWN (not individually reviewed)
- **Security Considerations:** Reads `innerHTML` (HTML sent to PDF/print path).
- **Current Limitations:** UNKNOWN (not individually reviewed)


## src/components/DailyEmailDigestView.tsx

### `DailyEmailDigestView`
- **File:** `src/components/DailyEmailDigestView.tsx:25-347`  · **Review:** AUTO
- **Purpose:** UNKNOWN (no in-code description; not individually reviewed)
- **Parameters:** `{ onNavigateToTab }`
- **Returns:** `Element` (inferred)
- **Dependencies:** none detected
- **Calls:** `useAttendance` (src/context/AttendanceContext.tsx:3733), `loadDigest` (src/components/DailyEmailDigestView.tsx:55)
- **Called By:** no in-repo caller resolved (entry point, event handler, route, or referenced by value)
- **Database Interaction:** None detected.
- **External Services:** None detected.
- **Authentication:** No authentication logic inside this function.
- **Authorization:** No role/permission check inside this function.
- **Validation:** 2 guard/type/regex check(s) detected.
- **Errors:** 2 try/catch
- **Side Effects:** React state: `setActiveSubTab`, `setConfigSuccessMsg`, `setCopiedHtml`, `setCurrentDigest`, `setDispatchErrorMsg`, `setDispatchSuccessMsg`, `setDispatching`, `setFormConfig` …; console output
- **Edge Cases:** UNKNOWN (not individually reviewed)
- **Security Considerations:** Uses `any` typing.
- **Current Limitations:** UNKNOWN (not individually reviewed)

### `loadDigest` (nested in `DailyEmailDigestView`)
- **File:** `src/components/DailyEmailDigestView.tsx:55-65`  · **Review:** AUTO
- **Purpose:** In-code comment: Load / generate current digest on mount or when tenant changes
- **Parameters:** none
- **Returns:** `Promise<void>` (inferred)
- **Dependencies:** none detected
- **Calls:** no in-repo callees resolved
- **Called By:** `DailyEmailDigestView` (src/components/DailyEmailDigestView.tsx:25)
- **Database Interaction:** None detected.
- **External Services:** None detected.
- **Authentication:** No authentication logic inside this function.
- **Authorization:** No role/permission check inside this function.
- **Validation:** None detected.
- **Errors:** 1 try/catch
- **Side Effects:** React state: `setCurrentDigest`, `setLoading`; console output
- **Edge Cases:** UNKNOWN (not individually reviewed)
- **Security Considerations:** None noted (not individually reviewed).
- **Current Limitations:** UNKNOWN (not individually reviewed)

### `handleSendDigestNow` (nested in `DailyEmailDigestView`)
- **File:** `src/components/DailyEmailDigestView.tsx:71-90`  · **Review:** AUTO
- **Purpose:** UNKNOWN (no in-code description; not individually reviewed)
- **Parameters:** none
- **Returns:** `Promise<void>` (inferred)
- **Dependencies:** none detected
- **Calls:** no in-repo callees resolved
- **Called By:** no in-repo caller resolved (entry point, event handler, route, or referenced by value)
- **Database Interaction:** None detected.
- **External Services:** None detected.
- **Authentication:** No authentication logic inside this function.
- **Authorization:** No role/permission check inside this function.
- **Validation:** None detected.
- **Errors:** 1 try/catch
- **Side Effects:** React state: `setCurrentDigest`, `setDispatchErrorMsg`, `setDispatchSuccessMsg`, `setDispatching`, `setTimeout`; console output
- **Edge Cases:** UNKNOWN (not individually reviewed)
- **Security Considerations:** Uses `any` typing.
- **Current Limitations:** UNKNOWN (not individually reviewed)

### `handleCopyHtml` (nested in `DailyEmailDigestView`)
- **File:** `src/components/DailyEmailDigestView.tsx:92-97`  · **Review:** AUTO
- **Purpose:** UNKNOWN (no in-code description; not individually reviewed)
- **Parameters:** none
- **Returns:** `void` (inferred)
- **Dependencies:** none detected
- **Calls:** no in-repo callees resolved
- **Called By:** no in-repo caller resolved (entry point, event handler, route, or referenced by value)
- **Database Interaction:** None detected.
- **External Services:** None detected.
- **Authentication:** No authentication logic inside this function.
- **Authorization:** No role/permission check inside this function.
- **Validation:** 1 guard/type/regex check(s) detected.
- **Errors:** None detected.
- **Side Effects:** React state: `setCopiedHtml`, `setTimeout`
- **Edge Cases:** UNKNOWN (not individually reviewed)
- **Security Considerations:** None noted (not individually reviewed).
- **Current Limitations:** UNKNOWN (not individually reviewed)

### `handleAddRecipient` (nested in `DailyEmailDigestView`)
- **File:** `src/components/DailyEmailDigestView.tsx:99-110`  · **Review:** AUTO
- **Purpose:** UNKNOWN (no in-code description; not individually reviewed)
- **Parameters:** `e: React.FormEvent`
- **Returns:** `void` (inferred)
- **Dependencies:** none detected
- **Calls:** no in-repo callees resolved
- **Called By:** no in-repo caller resolved (entry point, event handler, route, or referenced by value)
- **Database Interaction:** None detected.
- **External Services:** None detected.
- **Authentication:** No authentication logic inside this function.
- **Authorization:** No role/permission check inside this function.
- **Validation:** 1 guard/type/regex check(s) detected.
- **Errors:** None detected.
- **Side Effects:** React state: `setFormConfig`, `setNewRecipientEmail`
- **Edge Cases:** UNKNOWN (not individually reviewed)
- **Security Considerations:** None noted (not individually reviewed).
- **Current Limitations:** UNKNOWN (not individually reviewed)

### `handleRemoveRecipient` (nested in `DailyEmailDigestView`)
- **File:** `src/components/DailyEmailDigestView.tsx:112-117`  · **Review:** AUTO
- **Purpose:** UNKNOWN (no in-code description; not individually reviewed)
- **Parameters:** `email: string`
- **Returns:** `void` (inferred)
- **Dependencies:** none detected
- **Calls:** no in-repo callees resolved
- **Called By:** no in-repo caller resolved (entry point, event handler, route, or referenced by value)
- **Database Interaction:** None detected.
- **External Services:** None detected.
- **Authentication:** No authentication logic inside this function.
- **Authorization:** No role/permission check inside this function.
- **Validation:** None detected.
- **Errors:** None detected.
- **Side Effects:** React state: `setFormConfig`
- **Edge Cases:** UNKNOWN (not individually reviewed)
- **Security Considerations:** None noted (not individually reviewed).
- **Current Limitations:** UNKNOWN (not individually reviewed)

### `handleSaveSettings` (nested in `DailyEmailDigestView`)
- **File:** `src/components/DailyEmailDigestView.tsx:119-124`  · **Review:** AUTO
- **Purpose:** UNKNOWN (no in-code description; not individually reviewed)
- **Parameters:** `e: React.FormEvent`
- **Returns:** `void` (inferred)
- **Dependencies:** none detected
- **Calls:** no in-repo callees resolved
- **Called By:** no in-repo caller resolved (entry point, event handler, route, or referenced by value)
- **Database Interaction:** None detected.
- **External Services:** None detected.
- **Authentication:** No authentication logic inside this function.
- **Authorization:** No role/permission check inside this function.
- **Validation:** None detected.
- **Errors:** None detected.
- **Side Effects:** React state: `setConfigSuccessMsg`, `setTimeout`
- **Edge Cases:** UNKNOWN (not individually reviewed)
- **Security Considerations:** None noted (not individually reviewed).
- **Current Limitations:** UNKNOWN (not individually reviewed)


## src/components/EmergencyRosterView.tsx

### `EmergencyRosterView`
- **File:** `src/components/EmergencyRosterView.tsx:19-348`  · **Review:** AUTO
- **Purpose:** UNKNOWN (no in-code description; not individually reviewed)
- **Parameters:** none
- **Returns:** `Element` (inferred)
- **Dependencies:** none detected
- **Calls:** `useAttendance` (src/context/AttendanceContext.tsx:3733), `toggleVerify` (src/components/EmergencyRosterView.tsx:76)
- **Called By:** no in-repo caller resolved (entry point, event handler, route, or referenced by value)
- **Database Interaction:** None detected.
- **External Services:** None detected.
- **Authentication:** No authentication logic inside this function.
- **Authorization:** No role/permission check inside this function.
- **Validation:** 2 guard/type/regex check(s) detected.
- **Errors:** None detected.
- **Side Effects:** React state: `setIsExportingPdf`, `setSearchQuery`, `setSelectedAssemblyPoint`, `setSelectedClassFilter`, `setVerifiedStudentIds`; DOM/window access
- **Edge Cases:** UNKNOWN (not individually reviewed)
- **Security Considerations:** Reads `innerHTML` (HTML sent to PDF/print path).
- **Current Limitations:** UNKNOWN (not individually reviewed)

### `toggleVerify` (nested in `EmergencyRosterView`)
- **File:** `src/components/EmergencyRosterView.tsx:76-83`  · **Review:** AUTO
- **Purpose:** UNKNOWN (no in-code description; not individually reviewed)
- **Parameters:** `id: string`
- **Returns:** `void` (inferred)
- **Dependencies:** none detected
- **Calls:** no in-repo callees resolved
- **Called By:** `EmergencyRosterView` (src/components/EmergencyRosterView.tsx:19)
- **Database Interaction:** None detected.
- **External Services:** None detected.
- **Authentication:** No authentication logic inside this function.
- **Authorization:** No role/permission check inside this function.
- **Validation:** None detected.
- **Errors:** None detected.
- **Side Effects:** React state: `setVerifiedStudentIds`
- **Edge Cases:** UNKNOWN (not individually reviewed)
- **Security Considerations:** None noted (not individually reviewed).
- **Current Limitations:** UNKNOWN (not individually reviewed)

### `handleExportVectorPdf` (nested in `EmergencyRosterView`)
- **File:** `src/components/EmergencyRosterView.tsx:85-103`  · **Review:** AUTO
- **Purpose:** UNKNOWN (no in-code description; not individually reviewed)
- **Parameters:** none
- **Returns:** `Promise<void>` (inferred)
- **Dependencies:** none detected
- **Calls:** `downloadNativePdfFromHtml` (src/utils/pdfExport.ts:66)
- **Called By:** no in-repo caller resolved (entry point, event handler, route, or referenced by value)
- **Database Interaction:** None detected.
- **External Services:** None detected.
- **Authentication:** No authentication logic inside this function.
- **Authorization:** No role/permission check inside this function.
- **Validation:** 1 guard/type/regex check(s) detected.
- **Errors:** None detected.
- **Side Effects:** React state: `setIsExportingPdf`; DOM/window access
- **Edge Cases:** UNKNOWN (not individually reviewed)
- **Security Considerations:** Reads `innerHTML` (HTML sent to PDF/print path).
- **Current Limitations:** UNKNOWN (not individually reviewed)

### `handlePrint` (nested in `EmergencyRosterView`)
- **File:** `src/components/EmergencyRosterView.tsx:105-116`  · **Review:** AUTO
- **Purpose:** UNKNOWN (no in-code description; not individually reviewed)
- **Parameters:** none
- **Returns:** `void` (inferred)
- **Dependencies:** none detected
- **Calls:** `printNativePdfFromHtml` (src/utils/pdfExport.ts:104)
- **Called By:** no in-repo caller resolved (entry point, event handler, route, or referenced by value)
- **Database Interaction:** None detected.
- **External Services:** None detected.
- **Authentication:** No authentication logic inside this function.
- **Authorization:** No role/permission check inside this function.
- **Validation:** None detected.
- **Errors:** None detected.
- **Side Effects:** DOM/window access
- **Edge Cases:** UNKNOWN (not individually reviewed)
- **Security Considerations:** Reads `innerHTML` (HTML sent to PDF/print path).
- **Current Limitations:** UNKNOWN (not individually reviewed)


## src/components/ErrorBoundary.tsx

### `constructor`
- **File:** `src/components/ErrorBoundary.tsx:17-24`  · **Review:** AUTO
- **Purpose:** UNKNOWN (no in-code description; not individually reviewed)
- **Parameters:** `props: Props`
- **Returns:** `ErrorBoundary` (inferred)
- **Dependencies:** none detected
- **Calls:** no in-repo callees resolved
- **Called By:** no in-repo caller resolved (entry point, event handler, route, or referenced by value)
- **Database Interaction:** None detected.
- **External Services:** None detected.
- **Authentication:** No authentication logic inside this function.
- **Authorization:** No role/permission check inside this function.
- **Validation:** None detected.
- **Errors:** None detected.
- **Side Effects:** None detected.
- **Edge Cases:** UNKNOWN (not individually reviewed)
- **Security Considerations:** None noted (not individually reviewed).
- **Current Limitations:** UNKNOWN (not individually reviewed)

### `getDerivedStateFromError`
- **File:** `src/components/ErrorBoundary.tsx:26-32`  · **Review:** AUTO
- **Purpose:** UNKNOWN (no in-code description; not individually reviewed)
- **Parameters:** `error: Error`
- **Returns:** `State` (declared)
- **Dependencies:** none detected
- **Calls:** no in-repo callees resolved
- **Called By:** no in-repo caller resolved (entry point, event handler, route, or referenced by value)
- **Database Interaction:** None detected.
- **External Services:** None detected.
- **Authentication:** No authentication logic inside this function.
- **Authorization:** No role/permission check inside this function.
- **Validation:** None detected.
- **Errors:** None detected.
- **Side Effects:** None detected.
- **Edge Cases:** UNKNOWN (not individually reviewed)
- **Security Considerations:** None noted (not individually reviewed).
- **Current Limitations:** UNKNOWN (not individually reviewed)

### `componentDidCatch`
- **File:** `src/components/ErrorBoundary.tsx:34-37`  · **Review:** AUTO
- **Purpose:** UNKNOWN (no in-code description; not individually reviewed)
- **Parameters:** `error: Error`; `errorInfo: ErrorInfo`
- **Returns:** `void` (inferred)
- **Dependencies:** none detected
- **Calls:** no in-repo callees resolved
- **Called By:** no in-repo caller resolved (entry point, event handler, route, or referenced by value)
- **Database Interaction:** None detected.
- **External Services:** None detected.
- **Authentication:** No authentication logic inside this function.
- **Authorization:** No role/permission check inside this function.
- **Validation:** None detected.
- **Errors:** None detected.
- **Side Effects:** React state: `setState`; console output
- **Edge Cases:** UNKNOWN (not individually reviewed)
- **Security Considerations:** None noted (not individually reviewed).
- **Current Limitations:** UNKNOWN (not individually reviewed)

### `handleReload`
- **File:** `src/components/ErrorBoundary.tsx:39-43`  · **Review:** AUTO
- **Purpose:** UNKNOWN (no in-code description; not individually reviewed)
- **Parameters:** none
- **Returns:** `void` (inferred)
- **Dependencies:** none detected
- **Calls:** no in-repo callees resolved
- **Called By:** no in-repo caller resolved (entry point, event handler, route, or referenced by value)
- **Database Interaction:** None detected.
- **External Services:** None detected.
- **Authentication:** No authentication logic inside this function.
- **Authorization:** No role/permission check inside this function.
- **Validation:** 1 guard/type/regex check(s) detected.
- **Errors:** None detected.
- **Side Effects:** DOM/window access
- **Edge Cases:** UNKNOWN (not individually reviewed)
- **Security Considerations:** None noted (not individually reviewed).
- **Current Limitations:** UNKNOWN (not individually reviewed)

### `handleResetAuth`
- **File:** `src/components/ErrorBoundary.tsx:45-52`  · **Review:** AUTO
- **Purpose:** UNKNOWN (no in-code description; not individually reviewed)
- **Parameters:** none
- **Returns:** `void` (inferred)
- **Dependencies:** none detected
- **Calls:** no in-repo callees resolved
- **Called By:** no in-repo caller resolved (entry point, event handler, route, or referenced by value)
- **Database Interaction:** None detected.
- **External Services:** None detected.
- **Authentication:** No authentication logic inside this function.
- **Authorization:** No role/permission check inside this function.
- **Validation:** 2 guard/type/regex check(s) detected.
- **Errors:** None detected.
- **Side Effects:** local storage/cache; DOM/window access
- **Edge Cases:** UNKNOWN (not individually reviewed)
- **Security Considerations:** None noted (not individually reviewed).
- **Current Limitations:** UNKNOWN (not individually reviewed)

### `render`
- **File:** `src/components/ErrorBoundary.tsx:54-129`  · **Review:** AUTO
- **Purpose:** UNKNOWN (no in-code description; not individually reviewed)
- **Parameters:** none
- **Returns:** `string | number | boolean | Element | Iterable<ReactNode>` (inferred)
- **Dependencies:** none detected
- **Calls:** no in-repo callees resolved
- **Called By:** no in-repo caller resolved (entry point, event handler, route, or referenced by value)
- **Database Interaction:** None detected.
- **External Services:** None detected.
- **Authentication:** No authentication logic inside this function.
- **Authorization:** No role/permission check inside this function.
- **Validation:** 1 guard/type/regex check(s) detected.
- **Errors:** None detected.
- **Side Effects:** DOM/window access
- **Edge Cases:** UNKNOWN (not individually reviewed)
- **Security Considerations:** None noted (not individually reviewed).
- **Current Limitations:** UNKNOWN (not individually reviewed)


## src/components/ExecutiveDashboardView.tsx

### `ExecutiveDashboardView`
- **File:** `src/components/ExecutiveDashboardView.tsx:48-973`  · **Review:** AUTO
- **Purpose:** UNKNOWN (no in-code description; not individually reviewed)
- **Parameters:** `{ onNavigateTab }`
- **Returns:** `Element` (inferred)
- **Dependencies:** none detected
- **Calls:** `useAttendance` (src/context/AttendanceContext.tsx:3733)
- **Called By:** no in-repo caller resolved (entry point, event handler, route, or referenced by value)
- **Database Interaction:** None detected.
- **External Services:** None detected.
- **Authentication:** No authentication logic inside this function.
- **Authorization:** No role/permission check inside this function.
- **Validation:** 1 guard/type/regex check(s) detected.
- **Errors:** None detected.
- **Side Effects:** None detected.
- **Edge Cases:** UNKNOWN (not individually reviewed)
- **Security Considerations:** Uses `any` typing.
- **Current Limitations:** UNKNOWN (not individually reviewed)


## src/components/GeminiChatbotView.tsx

### `formatChatTime`
- **File:** `src/components/GeminiChatbotView.tsx:26-27`  · **Review:** AUTO
- **Purpose:** UNKNOWN (no in-code description; not individually reviewed)
- **Parameters:** `lang: 'ar' | 'en'`
- **Returns:** `string` (inferred)
- **Dependencies:** none detected
- **Calls:** no in-repo callees resolved
- **Called By:** `GeminiChatbotView` (src/components/GeminiChatbotView.tsx:49), `handleSendMessage` (src/components/GeminiChatbotView.tsx:161), `handleClearChat` (src/components/GeminiChatbotView.tsx:228)
- **Database Interaction:** None detected.
- **External Services:** None detected.
- **Authentication:** No authentication logic inside this function.
- **Authorization:** No role/permission check inside this function.
- **Validation:** None detected.
- **Errors:** None detected.
- **Side Effects:** None detected.
- **Edge Cases:** UNKNOWN (not individually reviewed)
- **Security Considerations:** None noted (not individually reviewed).
- **Current Limitations:** UNKNOWN (not individually reviewed)

### `buildWelcomeMessage`
- **File:** `src/components/GeminiChatbotView.tsx:29-42`  · **Review:** AUTO
- **Purpose:** UNKNOWN (no in-code description; not individually reviewed)
- **Parameters:** `lang: 'ar' | 'en'`; `tenantName: string`
- **Returns:** `string` (declared)
- **Dependencies:** none detected
- **Calls:** no in-repo callees resolved
- **Called By:** `GeminiChatbotView` (src/components/GeminiChatbotView.tsx:49)
- **Database Interaction:** None detected.
- **External Services:** None detected.
- **Authentication:** No authentication logic inside this function.
- **Authorization:** No role/permission check inside this function.
- **Validation:** None detected.
- **Errors:** None detected.
- **Side Effects:** None detected.
- **Edge Cases:** UNKNOWN (not individually reviewed)
- **Security Considerations:** None noted (not individually reviewed).
- **Current Limitations:** UNKNOWN (not individually reviewed)

### `buildResetMessage`
- **File:** `src/components/GeminiChatbotView.tsx:44-47`  · **Review:** AUTO
- **Purpose:** UNKNOWN (no in-code description; not individually reviewed)
- **Parameters:** `lang: 'ar' | 'en'`; `title: { titleAr: string; titleEn: string }`
- **Returns:** `string` (declared)
- **Dependencies:** none detected
- **Calls:** no in-repo callees resolved
- **Called By:** `GeminiChatbotView` (src/components/GeminiChatbotView.tsx:49), `handleClearChat` (src/components/GeminiChatbotView.tsx:228)
- **Database Interaction:** None detected.
- **External Services:** None detected.
- **Authentication:** No authentication logic inside this function.
- **Authorization:** No role/permission check inside this function.
- **Validation:** None detected.
- **Errors:** None detected.
- **Side Effects:** None detected.
- **Edge Cases:** UNKNOWN (not individually reviewed)
- **Security Considerations:** None noted (not individually reviewed).
- **Current Limitations:** UNKNOWN (not individually reviewed)

### `GeminiChatbotView`
- **File:** `src/components/GeminiChatbotView.tsx:49-437`  · **Review:** AUTO
- **Purpose:** UNKNOWN (no in-code description; not individually reviewed)
- **Parameters:** none
- **Returns:** `Element` (inferred)
- **Dependencies:** react
- **Calls:** `useAttendance` (src/context/AttendanceContext.tsx:3733), `buildWelcomeMessage` (src/components/GeminiChatbotView.tsx:29), `formatChatTime` (src/components/GeminiChatbotView.tsx:26), `scrollToBottom` (src/components/GeminiChatbotView.tsx:72), `buildResetMessage` (src/components/GeminiChatbotView.tsx:44), `handleSendMessage` (src/components/GeminiChatbotView.tsx:161), `handleCopyMessage` (src/components/GeminiChatbotView.tsx:222)
- **Called By:** no in-repo caller resolved (entry point, event handler, route, or referenced by value)
- **Database Interaction:** None detected.
- **External Services:** HTTP /api/chat
- **Authentication:** Uses `firebaseUser`/token
- **Authorization:** No role/permission check inside this function.
- **Validation:** 2 guard/type/regex check(s) detected.
- **Errors:** 1 try/catch, 1 throw
- **Side Effects:** React state: `setActiveRole`, `setCopiedId`, `setInputPrompt`, `setIsLoading`, `setMessages`, `setTimeout`; console output
- **Edge Cases:** UNKNOWN (not individually reviewed)
- **Security Considerations:** Uses `any` typing.
- **Current Limitations:** UNKNOWN (not individually reviewed)

### `scrollToBottom` (nested in `GeminiChatbotView`)
- **File:** `src/components/GeminiChatbotView.tsx:72-74`  · **Review:** AUTO
- **Purpose:** UNKNOWN (no in-code description; not individually reviewed)
- **Parameters:** none
- **Returns:** `void` (inferred)
- **Dependencies:** none detected
- **Calls:** no in-repo callees resolved
- **Called By:** `GeminiChatbotView` (src/components/GeminiChatbotView.tsx:49)
- **Database Interaction:** None detected.
- **External Services:** None detected.
- **Authentication:** No authentication logic inside this function.
- **Authorization:** No role/permission check inside this function.
- **Validation:** None detected.
- **Errors:** None detected.
- **Side Effects:** None detected.
- **Edge Cases:** UNKNOWN (not individually reviewed)
- **Security Considerations:** None noted (not individually reviewed).
- **Current Limitations:** UNKNOWN (not individually reviewed)

### `getModelPreference` (nested in `GeminiChatbotView`)
- **File:** `src/components/GeminiChatbotView.tsx:98-102`  · **Review:** AUTO
- **Purpose:** In-code comment: - gemini-2.5-flash for rapid SMS & classroom speed
- **Parameters:** `role: string`
- **Returns:** `"gemini-2.5-flash" | "gemini-2.5-pro"` (inferred)
- **Dependencies:** none detected
- **Calls:** no in-repo callees resolved
- **Called By:** `handleSendMessage` (src/components/GeminiChatbotView.tsx:161)
- **Database Interaction:** None detected.
- **External Services:** None detected.
- **Authentication:** No authentication logic inside this function.
- **Authorization:** No role/permission check inside this function.
- **Validation:** None detected.
- **Errors:** None detected.
- **Side Effects:** None detected.
- **Edge Cases:** UNKNOWN (not individually reviewed)
- **Security Considerations:** None noted (not individually reviewed).
- **Current Limitations:** UNKNOWN (not individually reviewed)

### `handleSendMessage` (nested in `GeminiChatbotView`)
- **File:** `src/components/GeminiChatbotView.tsx:161-220`  · **Review:** AUTO
- **Purpose:** UNKNOWN (no in-code description; not individually reviewed)
- **Parameters:** `customText?: string`
- **Returns:** `Promise<void>` (inferred)
- **Dependencies:** none detected
- **Calls:** `formatChatTime` (src/components/GeminiChatbotView.tsx:26), `getModelPreference` (src/components/GeminiChatbotView.tsx:98), `authenticatedFetch` (src/lib/api.ts:46)
- **Called By:** `GeminiChatbotView` (src/components/GeminiChatbotView.tsx:49)
- **Database Interaction:** None detected.
- **External Services:** HTTP /api/chat
- **Authentication:** Uses `firebaseUser`/token
- **Authorization:** No role/permission check inside this function.
- **Validation:** 2 guard/type/regex check(s) detected.
- **Errors:** 1 try/catch, 1 throw
- **Side Effects:** React state: `setInputPrompt`, `setIsLoading`, `setMessages`; console output
- **Edge Cases:** UNKNOWN (not individually reviewed)
- **Security Considerations:** Uses `any` typing.
- **Current Limitations:** UNKNOWN (not individually reviewed)

### `handleCopyMessage` (nested in `GeminiChatbotView`)
- **File:** `src/components/GeminiChatbotView.tsx:222-226`  · **Review:** AUTO
- **Purpose:** UNKNOWN (no in-code description; not individually reviewed)
- **Parameters:** `id: string`; `text: string`
- **Returns:** `void` (inferred)
- **Dependencies:** none detected
- **Calls:** no in-repo callees resolved
- **Called By:** `GeminiChatbotView` (src/components/GeminiChatbotView.tsx:49)
- **Database Interaction:** None detected.
- **External Services:** None detected.
- **Authentication:** No authentication logic inside this function.
- **Authorization:** No role/permission check inside this function.
- **Validation:** None detected.
- **Errors:** None detected.
- **Side Effects:** React state: `setCopiedId`, `setTimeout`
- **Edge Cases:** UNKNOWN (not individually reviewed)
- **Security Considerations:** None noted (not individually reviewed).
- **Current Limitations:** UNKNOWN (not individually reviewed)

### `handleClearChat` (nested in `GeminiChatbotView`)
- **File:** `src/components/GeminiChatbotView.tsx:228-238`  · **Review:** AUTO
- **Purpose:** UNKNOWN (no in-code description; not individually reviewed)
- **Parameters:** none
- **Returns:** `void` (inferred)
- **Dependencies:** none detected
- **Calls:** `buildResetMessage` (src/components/GeminiChatbotView.tsx:44), `formatChatTime` (src/components/GeminiChatbotView.tsx:26)
- **Called By:** no in-repo caller resolved (entry point, event handler, route, or referenced by value)
- **Database Interaction:** None detected.
- **External Services:** None detected.
- **Authentication:** No authentication logic inside this function.
- **Authorization:** No role/permission check inside this function.
- **Validation:** None detected.
- **Errors:** None detected.
- **Side Effects:** React state: `setMessages`
- **Edge Cases:** UNKNOWN (not individually reviewed)
- **Security Considerations:** None noted (not individually reviewed).
- **Current Limitations:** UNKNOWN (not individually reviewed)


## src/components/GradeAbsencePatternsSection.tsx

### `GradeAbsencePatternsSection`
- **File:** `src/components/GradeAbsencePatternsSection.tsx:66-813`  · **Review:** AUTO
- **Purpose:** UNKNOWN (no in-code description; not individually reviewed)
- **Parameters:** `{ students, justifications, lang, onFilterByGrade, }`
- **Returns:** `Element` (inferred)
- **Dependencies:** admin
- **Calls:** no in-repo callees resolved
- **Called By:** no in-repo caller resolved (entry point, event handler, route, or referenced by value)
- **Database Interaction:** None detected.
- **External Services:** None detected.
- **Authentication:** No authentication logic inside this function.
- **Authorization:** No role/permission check inside this function.
- **Validation:** 2 guard/type/regex check(s) detected.
- **Errors:** None detected.
- **Side Effects:** React state: `setMetricView`, `setSelectedGradeFocus`
- **Edge Cases:** UNKNOWN (not individually reviewed)
- **Security Considerations:** Uses `any` typing.
- **Current Limitations:** UNKNOWN (not individually reviewed)

### `CustomChartTooltip` (nested in `GradeAbsencePatternsSection`)
- **File:** `src/components/GradeAbsencePatternsSection.tsx:197-239`  · **Review:** AUTO
- **Purpose:** In-code comment: Custom Recharts Tooltip
- **Parameters:** `{ active, payload, label }: any`
- **Returns:** `Element` (inferred)
- **Dependencies:** none detected
- **Calls:** no in-repo callees resolved
- **Called By:** no in-repo caller resolved (entry point, event handler, route, or referenced by value)
- **Database Interaction:** None detected.
- **External Services:** None detected.
- **Authentication:** No authentication logic inside this function.
- **Authorization:** No role/permission check inside this function.
- **Validation:** 1 guard/type/regex check(s) detected.
- **Errors:** None detected.
- **Side Effects:** None detected.
- **Edge Cases:** UNKNOWN (not individually reviewed)
- **Security Considerations:** Uses `any` typing.
- **Current Limitations:** UNKNOWN (not individually reviewed)


## src/components/HeaderNav.tsx

### `HeaderNav`
- **File:** `src/components/HeaderNav.tsx:56-258`  · **Review:** AUTO
- **Purpose:** UNKNOWN (no in-code description; not individually reviewed)
- **Parameters:** `{ activeTab, setActiveTab, onSignOut, onToggleSidebarMobile, isSidebarCollapsed, onToggleSidebarCollapse, }`
- **Returns:** `Element` (inferred)
- **Dependencies:** admin
- **Calls:** `useAttendance` (src/context/AttendanceContext.tsx:3733), `isLocalDevelopmentHost` (src/config/tenantRegistry.ts:260), `getDevTestTenants` (src/config/tenantRegistry.ts:277), `getPageTitle` (src/components/HeaderNav.tsx:80), `switchDevTestTenant` (src/config/tenantRegistry.ts:286)
- **Called By:** no in-repo caller resolved (entry point, event handler, route, or referenced by value)
- **Database Interaction:** None detected.
- **External Services:** None detected.
- **Authentication:** Uses `firebaseUser`/token
- **Authorization:** References: `isSuperAdmin`
- **Validation:** 1 guard/type/regex check(s) detected.
- **Errors:** None detected.
- **Side Effects:** React state: `setIsPlatformModalOpen`, `setLang`; DOM/window access
- **Edge Cases:** UNKNOWN (not individually reviewed)
- **Security Considerations:** None noted (not individually reviewed).
- **Current Limitations:** UNKNOWN (not individually reviewed)

### `getPageTitle` (nested in `HeaderNav`)
- **File:** `src/components/HeaderNav.tsx:80-111`  · **Review:** AUTO
- **Purpose:** UNKNOWN (no in-code description; not individually reviewed)
- **Parameters:** `tab: ActiveTab`
- **Returns:** `{ ar: string; en: string; icon: React.ReactNode }` (declared)
- **Dependencies:** none detected
- **Calls:** no in-repo callees resolved
- **Called By:** `HeaderNav` (src/components/HeaderNav.tsx:56)
- **Database Interaction:** None detected.
- **External Services:** None detected.
- **Authentication:** No authentication logic inside this function.
- **Authorization:** No role/permission check inside this function.
- **Validation:** None detected.
- **Errors:** None detected.
- **Side Effects:** None detected.
- **Edge Cases:** UNKNOWN (not individually reviewed)
- **Security Considerations:** None noted (not individually reviewed).
- **Current Limitations:** UNKNOWN (not individually reviewed)


## src/components/JustificationsView.tsx

### `JustificationsView`
- **File:** `src/components/JustificationsView.tsx:19-482`  · **Review:** AUTO
- **Purpose:** UNKNOWN (no in-code description; not individually reviewed)
- **Parameters:** none
- **Returns:** `Element` (inferred)
- **Dependencies:** none detected
- **Calls:** `useAttendance` (src/context/AttendanceContext.tsx:3733)
- **Called By:** no in-repo caller resolved (entry point, event handler, route, or referenced by value)
- **Database Interaction:** None detected.
- **External Services:** HTTP /api/analyze-image
- **Authentication:** Uses `firebaseUser`/token
- **Authorization:** References: `canReviewJustifications`, `currentUserRole`
- **Validation:** 10 guard/type/regex check(s) detected.
- **Errors:** 3 try/catch, 2 throw
- **Side Effects:** React state: `setActiveSubTab`, `setAiAnalysisResult`, `setAnalysisError`, `setGuardianExplanation`, `setIsAnalyzing`, `setIsReanalyzing`, `setIsSubmitting`, `setReanalysisError` …; console output; DOM/window access
- **Edge Cases:** UNKNOWN (not individually reviewed)
- **Security Considerations:** Uses `any` typing.
- **Current Limitations:** UNKNOWN (not individually reviewed)

### `handleFileUpload` (nested in `JustificationsView`)
- **File:** `src/components/JustificationsView.tsx:65-100`  · **Review:** AUTO
- **Purpose:** In-code comment: Handle file input with MIME and size validation (M4)
- **Parameters:** `e: React.ChangeEvent<HTMLInputElement>`
- **Returns:** `void` (inferred)
- **Dependencies:** none detected
- **Calls:** no in-repo callees resolved
- **Called By:** no in-repo caller resolved (entry point, event handler, route, or referenced by value)
- **Database Interaction:** None detected.
- **External Services:** None detected.
- **Authentication:** No authentication logic inside this function.
- **Authorization:** No role/permission check inside this function.
- **Validation:** 2 guard/type/regex check(s) detected.
- **Errors:** None detected.
- **Side Effects:** React state: `setAiAnalysisResult`, `setAnalysisError`, `setUploadedFileName`, `setUploadedImageBase64`
- **Edge Cases:** UNKNOWN (not individually reviewed)
- **Security Considerations:** None noted (not individually reviewed).
- **Current Limitations:** UNKNOWN (not individually reviewed)

### `handleLoadSampleMedicalNote` (nested in `JustificationsView`)
- **File:** `src/components/JustificationsView.tsx:103-116`  · **Review:** AUTO
- **Purpose:** In-code comment: Insert generated legitimate sample medical note
- **Parameters:** none
- **Returns:** `void` (inferred)
- **Dependencies:** none detected
- **Calls:** `generateSampleMedicalNoteBase64` (src/utils/sampleImages.ts:2)
- **Called By:** no in-repo caller resolved (entry point, event handler, route, or referenced by value)
- **Database Interaction:** None detected.
- **External Services:** None detected.
- **Authentication:** No authentication logic inside this function.
- **Authorization:** No role/permission check inside this function.
- **Validation:** None detected.
- **Errors:** None detected.
- **Side Effects:** React state: `setAiAnalysisResult`, `setAnalysisError`, `setGuardianExplanation`, `setUploadedFileName`, `setUploadedImageBase64`
- **Edge Cases:** UNKNOWN (not individually reviewed)
- **Security Considerations:** None noted (not individually reviewed).
- **Current Limitations:** UNKNOWN (not individually reviewed)

### `handleLoadSampleIrregularNote` (nested in `JustificationsView`)
- **File:** `src/components/JustificationsView.tsx:119-131`  · **Review:** AUTO
- **Purpose:** In-code comment: Insert generated irregular sample medical note with intentional discrepancies
- **Parameters:** none
- **Returns:** `void` (inferred)
- **Dependencies:** none detected
- **Calls:** `generateSampleIrregularMedicalNoteBase64` (src/utils/sampleImages.ts:128)
- **Called By:** no in-repo caller resolved (entry point, event handler, route, or referenced by value)
- **Database Interaction:** None detected.
- **External Services:** None detected.
- **Authentication:** No authentication logic inside this function.
- **Authorization:** No role/permission check inside this function.
- **Validation:** None detected.
- **Errors:** None detected.
- **Side Effects:** React state: `setAiAnalysisResult`, `setAnalysisError`, `setGuardianExplanation`, `setUploadedFileName`, `setUploadedImageBase64`
- **Edge Cases:** UNKNOWN (not individually reviewed)
- **Security Considerations:** None noted (not individually reviewed).
- **Current Limitations:** UNKNOWN (not individually reviewed)

### `handleAnalyzeImageWithAI` (nested in `JustificationsView`)
- **File:** `src/components/JustificationsView.tsx:134-178`  · **Review:** AUTO
- **Purpose:** In-code comment: Call server-side /api/analyze-image endpoint (Gemini with irregularity checking)
- **Parameters:** none
- **Returns:** `Promise<void>` (inferred)
- **Dependencies:** none detected
- **Calls:** `authenticatedFetch` (src/lib/api.ts:46)
- **Called By:** no in-repo caller resolved (entry point, event handler, route, or referenced by value)
- **Database Interaction:** None detected.
- **External Services:** HTTP /api/analyze-image
- **Authentication:** Uses `firebaseUser`/token
- **Authorization:** No role/permission check inside this function.
- **Validation:** 3 guard/type/regex check(s) detected.
- **Errors:** 1 try/catch, 1 throw
- **Side Effects:** React state: `setAiAnalysisResult`, `setAnalysisError`, `setGuardianExplanation`, `setIsAnalyzing`; console output
- **Edge Cases:** UNKNOWN (not individually reviewed)
- **Security Considerations:** Uses `any` typing.
- **Current Limitations:** UNKNOWN (not individually reviewed)

### `handleReanalyzeJustificationWithAI` (nested in `JustificationsView`)
- **File:** `src/components/JustificationsView.tsx:181-237`  · **Review:** AUTO
- **Purpose:** In-code comment: Trigger Gemini Deep Verification on an existing justification in Review Modal
- **Parameters:** `just: Justification`
- **Returns:** `Promise<void>` (inferred)
- **Dependencies:** none detected
- **Calls:** `generateSampleIrregularMedicalNoteBase64` (src/utils/sampleImages.ts:128), `generateSampleMedicalNoteBase64` (src/utils/sampleImages.ts:2), `authenticatedFetch` (src/lib/api.ts:46)
- **Called By:** no in-repo caller resolved (entry point, event handler, route, or referenced by value)
- **Database Interaction:** None detected.
- **External Services:** HTTP /api/analyze-image
- **Authentication:** Uses `firebaseUser`/token
- **Authorization:** No role/permission check inside this function.
- **Validation:** 2 guard/type/regex check(s) detected.
- **Errors:** 1 try/catch, 1 throw
- **Side Effects:** React state: `setIsReanalyzing`, `setReanalysisError`, `setReviewerNotes`, `setSelectedJustificationForReview`; console output
- **Edge Cases:** UNKNOWN (not individually reviewed)
- **Security Considerations:** Uses `any` typing.
- **Current Limitations:** UNKNOWN (not individually reviewed)

### `handleFormSubmit` (nested in `JustificationsView`)
- **File:** `src/components/JustificationsView.tsx:239-298`  · **Review:** AUTO
- **Purpose:** UNKNOWN (no in-code description; not individually reviewed)
- **Parameters:** `e: React.FormEvent`
- **Returns:** `Promise<void>` (inferred)
- **Dependencies:** none detected
- **Calls:** no in-repo callees resolved
- **Called By:** no in-repo caller resolved (entry point, event handler, route, or referenced by value)
- **Database Interaction:** None detected.
- **External Services:** None detected.
- **Authentication:** No authentication logic inside this function.
- **Authorization:** No role/permission check inside this function.
- **Validation:** 1 guard/type/regex check(s) detected.
- **Errors:** 1 try/catch
- **Side Effects:** React state: `setActiveSubTab`, `setAiAnalysisResult`, `setGuardianExplanation`, `setIsSubmitting`, `setUploadedFileName`, `setUploadedImageBase64`; console output; DOM/window access
- **Edge Cases:** UNKNOWN (not individually reviewed)
- **Security Considerations:** Uses `any` typing.
- **Current Limitations:** UNKNOWN (not individually reviewed)

### `handleApprove` (nested in `JustificationsView`)
- **File:** `src/components/JustificationsView.tsx:300-304`  · **Review:** AUTO
- **Purpose:** UNKNOWN (no in-code description; not individually reviewed)
- **Parameters:** `justId: string`
- **Returns:** `void` (inferred)
- **Dependencies:** none detected
- **Calls:** no in-repo callees resolved
- **Called By:** no in-repo caller resolved (entry point, event handler, route, or referenced by value)
- **Database Interaction:** None detected.
- **External Services:** None detected.
- **Authentication:** No authentication logic inside this function.
- **Authorization:** No role/permission check inside this function.
- **Validation:** None detected.
- **Errors:** None detected.
- **Side Effects:** React state: `setReviewerNotes`, `setSelectedJustificationForReview`
- **Edge Cases:** UNKNOWN (not individually reviewed)
- **Security Considerations:** None noted (not individually reviewed).
- **Current Limitations:** UNKNOWN (not individually reviewed)

### `handleReject` (nested in `JustificationsView`)
- **File:** `src/components/JustificationsView.tsx:306-310`  · **Review:** AUTO
- **Purpose:** UNKNOWN (no in-code description; not individually reviewed)
- **Parameters:** `justId: string`
- **Returns:** `void` (inferred)
- **Dependencies:** none detected
- **Calls:** no in-repo callees resolved
- **Called By:** no in-repo caller resolved (entry point, event handler, route, or referenced by value)
- **Database Interaction:** None detected.
- **External Services:** None detected.
- **Authentication:** No authentication logic inside this function.
- **Authorization:** No role/permission check inside this function.
- **Validation:** None detected.
- **Errors:** None detected.
- **Side Effects:** React state: `setReviewerNotes`, `setSelectedJustificationForReview`
- **Edge Cases:** UNKNOWN (not individually reviewed)
- **Security Considerations:** None noted (not individually reviewed).
- **Current Limitations:** UNKNOWN (not individually reviewed)


## src/components/LoginPage.tsx

### `LoginPage`
- **File:** `src/components/LoginPage.tsx:22-203`  · **Review:** REVIEWED
- **Purpose:** Email/password login screen branded by host tenant; shows a dev tenant switcher on local hosts.
- **Parameters:** `{ onLoginSuccess }`
- **Returns:** JSX
- **Dependencies:** none detected
- **Calls:** `useAttendance` (src/context/AttendanceContext.tsx:3733), `isLocalDevelopmentHost` (src/config/tenantRegistry.ts:260), `getDevTestTenants` (src/config/tenantRegistry.ts:277), `resolveTenantFromHostname` (src/config/tenantRegistry.ts:325), `switchDevTestTenant` (src/config/tenantRegistry.ts:286), `handleAuthenticate` (src/components/LoginPage.tsx:50)
- **Called By:** no in-repo caller resolved (entry point, event handler, route, or referenced by value)
- **Database Interaction:** None.
- **External Services:** None.
- **Authentication:** Delegates to `signInWithCredentials`.
- **Authorization:** N/A.
- **Validation:** None.
- **Errors:** None thrown.
- **Side Effects:** None (pure).
- **Edge Cases:** —
- **Security Considerations:** —
- **Current Limitations:** —

### `handleAuthenticate` (nested in `LoginPage`)
- **File:** `src/components/LoginPage.tsx:50-65`  · **Review:** REVIEWED
- **Purpose:** Calls `signInWithCredentials`, reports error or calls `onLoginSuccess`.
- **Parameters:** `targetEmail, targetPass`
- **Returns:** `Promise<void>`
- **Dependencies:** none detected
- **Calls:** —
- **Called By:** `LoginPage` (src/components/LoginPage.tsx:22)
- **Database Interaction:** None.
- **External Services:** None.
- **Authentication:** N/A (pure helper).
- **Authorization:** N/A.
- **Validation:** None.
- **Errors:** Displays returned/caught error text.
- **Side Effects:** None (pure).
- **Edge Cases:** —
- **Security Considerations:** —
- **Current Limitations:** —


## src/components/NotificationOutboxView.tsx

### `NotificationOutboxView`
- **File:** `src/components/NotificationOutboxView.tsx:32-1240`  · **Review:** AUTO
- **Purpose:** UNKNOWN (no in-code description; not individually reviewed)
- **Parameters:** none
- **Returns:** `Element` (inferred)
- **Dependencies:** none detected
- **Calls:** `useAttendance` (src/context/AttendanceContext.tsx:3733), `toggleSelectOutboxItem` (src/components/NotificationOutboxView.tsx:300), `openWhatsAppDirect` (src/utils/whatsappUtils.ts:62), `handleRetrySingle` (src/components/NotificationOutboxView.tsx:277), `toggleStudentSelection` (src/components/NotificationOutboxView.tsx:177)
- **Called By:** no in-repo caller resolved (entry point, event handler, route, or referenced by value)
- **Database Interaction:** None detected.
- **External Services:** None detected.
- **Authentication:** No authentication logic inside this function.
- **Authorization:** No role/permission check inside this function.
- **Validation:** 3 guard/type/regex check(s) detected.
- **Errors:** 1 try/catch
- **Side Effects:** React state: `setBatchAbsenceFilter`, `setBatchChannel`, `setBatchClassFilter`, `setBatchCustomMessage`, `setBatchIsSending`, `setBatchSearchQuery`, `setBatchSelectedIds`, `setBatchSelectedTemplateIndex` …; console output
- **Edge Cases:** UNKNOWN (not individually reviewed)
- **Security Considerations:** Uses `any` typing.
- **Current Limitations:** UNKNOWN (not individually reviewed)

### `handleOpenBatchModal` (nested in `NotificationOutboxView`)
- **File:** `src/components/NotificationOutboxView.tsx:164-174`  · **Review:** AUTO
- **Purpose:** In-code comment: Open Batch Modal with preselected absent students
- **Parameters:** none
- **Returns:** `void` (inferred)
- **Dependencies:** none detected
- **Calls:** no in-repo callees resolved
- **Called By:** no in-repo caller resolved (entry point, event handler, route, or referenced by value)
- **Database Interaction:** None detected.
- **External Services:** None detected.
- **Authentication:** No authentication logic inside this function.
- **Authorization:** No role/permission check inside this function.
- **Validation:** None detected.
- **Errors:** None detected.
- **Side Effects:** React state: `setBatchAbsenceFilter`, `setBatchClassFilter`, `setBatchCustomMessage`, `setBatchSearchQuery`, `setBatchSelectedIds`, `setBatchSelectedTemplateIndex`, `setIsBatchModalOpen`
- **Edge Cases:** UNKNOWN (not individually reviewed)
- **Security Considerations:** None noted (not individually reviewed).
- **Current Limitations:** UNKNOWN (not individually reviewed)

### `toggleStudentSelection` (nested in `NotificationOutboxView`)
- **File:** `src/components/NotificationOutboxView.tsx:177-181`  · **Review:** AUTO
- **Purpose:** In-code comment: Toggle single student in batch selection
- **Parameters:** `id: string`
- **Returns:** `void` (inferred)
- **Dependencies:** none detected
- **Calls:** no in-repo callees resolved
- **Called By:** `NotificationOutboxView` (src/components/NotificationOutboxView.tsx:32)
- **Database Interaction:** None detected.
- **External Services:** None detected.
- **Authentication:** No authentication logic inside this function.
- **Authorization:** No role/permission check inside this function.
- **Validation:** None detected.
- **Errors:** None detected.
- **Side Effects:** React state: `setBatchSelectedIds`
- **Edge Cases:** UNKNOWN (not individually reviewed)
- **Security Considerations:** None noted (not individually reviewed).
- **Current Limitations:** UNKNOWN (not individually reviewed)

### `handleToggleSelectAllBatch` (nested in `NotificationOutboxView`)
- **File:** `src/components/NotificationOutboxView.tsx:184-193`  · **Review:** AUTO
- **Purpose:** In-code comment: Select all or clear in batch
- **Parameters:** none
- **Returns:** `void` (inferred)
- **Dependencies:** none detected
- **Calls:** no in-repo callees resolved
- **Called By:** no in-repo caller resolved (entry point, event handler, route, or referenced by value)
- **Database Interaction:** None detected.
- **External Services:** None detected.
- **Authentication:** No authentication logic inside this function.
- **Authorization:** No role/permission check inside this function.
- **Validation:** None detected.
- **Errors:** None detected.
- **Side Effects:** React state: `setBatchSelectedIds`
- **Edge Cases:** UNKNOWN (not individually reviewed)
- **Security Considerations:** None noted (not individually reviewed).
- **Current Limitations:** UNKNOWN (not individually reviewed)

### `handleExecuteBatchSend` (nested in `NotificationOutboxView`)
- **File:** `src/components/NotificationOutboxView.tsx:196-222`  · **Review:** AUTO
- **Purpose:** In-code comment: Execute Batch Send
- **Parameters:** none
- **Returns:** `Promise<void>` (inferred)
- **Dependencies:** none detected
- **Calls:** no in-repo callees resolved
- **Called By:** no in-repo caller resolved (entry point, event handler, route, or referenced by value)
- **Database Interaction:** None detected.
- **External Services:** None detected.
- **Authentication:** No authentication logic inside this function.
- **Authorization:** No role/permission check inside this function.
- **Validation:** None detected.
- **Errors:** 1 try/catch
- **Side Effects:** React state: `setBatchIsSending`, `setIsBatchModalOpen`, `setSentSuccessAlert`, `setTimeout`; console output
- **Edge Cases:** UNKNOWN (not individually reviewed)
- **Security Considerations:** None noted (not individually reviewed).
- **Current Limitations:** UNKNOWN (not individually reviewed)

### `handleSendSingleCustom` (nested in `NotificationOutboxView`)
- **File:** `src/components/NotificationOutboxView.tsx:225-252`  · **Review:** AUTO
- **Purpose:** In-code comment: Single Compose Send
- **Parameters:** none
- **Returns:** `void` (inferred)
- **Dependencies:** none detected
- **Calls:** no in-repo callees resolved
- **Called By:** no in-repo caller resolved (entry point, event handler, route, or referenced by value)
- **Database Interaction:** None detected.
- **External Services:** None detected.
- **Authentication:** No authentication logic inside this function.
- **Authorization:** No role/permission check inside this function.
- **Validation:** 1 guard/type/regex check(s) detected.
- **Errors:** None detected.
- **Side Effects:** React state: `setComposeMessage`, `setIsComposeOpen`, `setSentSuccessAlert`, `setTimeout`
- **Edge Cases:** UNKNOWN (not individually reviewed)
- **Security Considerations:** None noted (not individually reviewed).
- **Current Limitations:** UNKNOWN (not individually reviewed)

### `handleRetrySingle` (nested in `NotificationOutboxView`)
- **File:** `src/components/NotificationOutboxView.tsx:277-281`  · **Review:** AUTO
- **Purpose:** In-code comment: Single Retry
- **Parameters:** `id: string`
- **Returns:** `Promise<void>` (inferred)
- **Dependencies:** none detected
- **Calls:** no in-repo callees resolved
- **Called By:** `NotificationOutboxView` (src/components/NotificationOutboxView.tsx:32)
- **Database Interaction:** None detected.
- **External Services:** None detected.
- **Authentication:** No authentication logic inside this function.
- **Authorization:** No role/permission check inside this function.
- **Validation:** None detected.
- **Errors:** None detected.
- **Side Effects:** React state: `setRetryingId`
- **Edge Cases:** UNKNOWN (not individually reviewed)
- **Security Considerations:** None noted (not individually reviewed).
- **Current Limitations:** UNKNOWN (not individually reviewed)

### `handleBulkRetrySelected` (nested in `NotificationOutboxView`)
- **File:** `src/components/NotificationOutboxView.tsx:284-298`  · **Review:** AUTO
- **Purpose:** In-code comment: Bulk Retry Selected Outbox Items
- **Parameters:** none
- **Returns:** `Promise<void>` (inferred)
- **Dependencies:** none detected
- **Calls:** no in-repo callees resolved
- **Called By:** no in-repo caller resolved (entry point, event handler, route, or referenced by value)
- **Database Interaction:** None detected.
- **External Services:** None detected.
- **Authentication:** No authentication logic inside this function.
- **Authorization:** No role/permission check inside this function.
- **Validation:** None detected.
- **Errors:** None detected.
- **Side Effects:** React state: `setIsBulkRetrying`, `setSelectedOutboxIds`, `setSentSuccessAlert`, `setTimeout`
- **Edge Cases:** UNKNOWN (not individually reviewed)
- **Security Considerations:** None noted (not individually reviewed).
- **Current Limitations:** UNKNOWN (not individually reviewed)

### `toggleSelectOutboxItem` (nested in `NotificationOutboxView`)
- **File:** `src/components/NotificationOutboxView.tsx:300-304`  · **Review:** AUTO
- **Purpose:** UNKNOWN (no in-code description; not individually reviewed)
- **Parameters:** `id: string`
- **Returns:** `void` (inferred)
- **Dependencies:** none detected
- **Calls:** no in-repo callees resolved
- **Called By:** `NotificationOutboxView` (src/components/NotificationOutboxView.tsx:32)
- **Database Interaction:** None detected.
- **External Services:** None detected.
- **Authentication:** No authentication logic inside this function.
- **Authorization:** No role/permission check inside this function.
- **Validation:** None detected.
- **Errors:** None detected.
- **Side Effects:** React state: `setSelectedOutboxIds`
- **Edge Cases:** UNKNOWN (not individually reviewed)
- **Security Considerations:** None noted (not individually reviewed).
- **Current Limitations:** UNKNOWN (not individually reviewed)

### `toggleSelectAllVisibleOutbox` (nested in `NotificationOutboxView`)
- **File:** `src/components/NotificationOutboxView.tsx:306-314`  · **Review:** AUTO
- **Purpose:** UNKNOWN (no in-code description; not individually reviewed)
- **Parameters:** none
- **Returns:** `void` (inferred)
- **Dependencies:** none detected
- **Calls:** no in-repo callees resolved
- **Called By:** no in-repo caller resolved (entry point, event handler, route, or referenced by value)
- **Database Interaction:** None detected.
- **External Services:** None detected.
- **Authentication:** No authentication logic inside this function.
- **Authorization:** No role/permission check inside this function.
- **Validation:** None detected.
- **Errors:** None detected.
- **Side Effects:** React state: `setSelectedOutboxIds`
- **Edge Cases:** UNKNOWN (not individually reviewed)
- **Security Considerations:** None noted (not individually reviewed).
- **Current Limitations:** UNKNOWN (not individually reviewed)


## src/components/OfficialReportModal.tsx

### `OfficialReportModal`
- **File:** `src/components/OfficialReportModal.tsx:26-362`  · **Review:** AUTO
- **Purpose:** UNKNOWN (no in-code description; not individually reviewed)
- **Parameters:** `{ onClose, selectedClassFilter, reportType, }`
- **Returns:** `Element` (inferred)
- **Dependencies:** none detected
- **Calls:** `useAttendance` (src/context/AttendanceContext.tsx:3733), `useModalAccessibility` (src/hooks/useModalAccessibility.ts:17)
- **Called By:** no in-repo caller resolved (entry point, event handler, route, or referenced by value)
- **Database Interaction:** None detected.
- **External Services:** None detected.
- **Authentication:** Uses `firebaseUser`/token
- **Authorization:** No role/permission check inside this function.
- **Validation:** 2 guard/type/regex check(s) detected.
- **Errors:** None detected.
- **Side Effects:** React state: `setIsGeneratingPdf`; DOM/window access
- **Edge Cases:** UNKNOWN (not individually reviewed)
- **Security Considerations:** Reads `innerHTML` (HTML sent to PDF/print path).
- **Current Limitations:** UNKNOWN (not individually reviewed)

### `handleDownloadVectorPdf` (nested in `OfficialReportModal`)
- **File:** `src/components/OfficialReportModal.tsx:64-83`  · **Review:** AUTO
- **Purpose:** UNKNOWN (no in-code description; not individually reviewed)
- **Parameters:** none
- **Returns:** `Promise<void>` (inferred)
- **Dependencies:** none detected
- **Calls:** `downloadNativePdfFromHtml` (src/utils/pdfExport.ts:66)
- **Called By:** no in-repo caller resolved (entry point, event handler, route, or referenced by value)
- **Database Interaction:** None detected.
- **External Services:** None detected.
- **Authentication:** No authentication logic inside this function.
- **Authorization:** No role/permission check inside this function.
- **Validation:** 1 guard/type/regex check(s) detected.
- **Errors:** None detected.
- **Side Effects:** React state: `setIsGeneratingPdf`; DOM/window access
- **Edge Cases:** UNKNOWN (not individually reviewed)
- **Security Considerations:** Reads `innerHTML` (HTML sent to PDF/print path).
- **Current Limitations:** UNKNOWN (not individually reviewed)

### `handleBrowserPrint` (nested in `OfficialReportModal`)
- **File:** `src/components/OfficialReportModal.tsx:85-98`  · **Review:** AUTO
- **Purpose:** UNKNOWN (no in-code description; not individually reviewed)
- **Parameters:** none
- **Returns:** `void` (inferred)
- **Dependencies:** none detected
- **Calls:** `printNativePdfFromHtml` (src/utils/pdfExport.ts:104)
- **Called By:** no in-repo caller resolved (entry point, event handler, route, or referenced by value)
- **Database Interaction:** None detected.
- **External Services:** None detected.
- **Authentication:** No authentication logic inside this function.
- **Authorization:** No role/permission check inside this function.
- **Validation:** None detected.
- **Errors:** None detected.
- **Side Effects:** DOM/window access
- **Edge Cases:** UNKNOWN (not individually reviewed)
- **Security Considerations:** Reads `innerHTML` (HTML sent to PDF/print path).
- **Current Limitations:** UNKNOWN (not individually reviewed)


## src/components/OfflineSyncModal.tsx

### `OfflineSyncModal`
- **File:** `src/components/OfflineSyncModal.tsx:43-406`  · **Review:** AUTO
- **Purpose:** UNKNOWN (no in-code description; not individually reviewed)
- **Parameters:** `{ isOpen, onClose, connStatus, lang, }`
- **Returns:** `Element` (inferred)
- **Dependencies:** admin
- **Calls:** `useAttendance` (src/context/AttendanceContext.tsx:3733), `checkApiHealth` (src/components/OfflineSyncModal.tsx:58), `useModalAccessibility` (src/hooks/useModalAccessibility.ts:17), `getCacheStats` (src/components/OfflineSyncModal.tsx:104), `formatUptime` (src/components/OfflineSyncModal.tsx:95)
- **Called By:** no in-repo caller resolved (entry point, event handler, route, or referenced by value)
- **Database Interaction:** None detected.
- **External Services:** HTTP /api/health
- **Authentication:** Uses `firebaseUser`/token
- **Authorization:** References: `isSuperAdmin`
- **Validation:** 4 guard/type/regex check(s) detected.
- **Errors:** 3 try/catch
- **Side Effects:** React state: `setApiHealth`, `setIsCheckingApi`, `setIsRetrying`, `setRetryResult`; local storage/cache; DOM/window access
- **Edge Cases:** UNKNOWN (not individually reviewed)
- **Security Considerations:** None noted (not individually reviewed).
- **Current Limitations:** UNKNOWN (not individually reviewed)

### `checkApiHealth` (nested in `OfflineSyncModal`)
- **File:** `src/components/OfflineSyncModal.tsx:58-82`  · **Review:** AUTO
- **Purpose:** UNKNOWN (no in-code description; not individually reviewed)
- **Parameters:** none
- **Returns:** `Promise<void>` (inferred)
- **Dependencies:** none detected
- **Calls:** no in-repo callees resolved
- **Called By:** `OfflineSyncModal` (src/components/OfflineSyncModal.tsx:43), `handleManualRetry` (src/components/OfflineSyncModal.tsx:136)
- **Database Interaction:** None detected.
- **External Services:** HTTP /api/health
- **Authentication:** No authentication logic inside this function.
- **Authorization:** No role/permission check inside this function.
- **Validation:** None detected.
- **Errors:** 1 try/catch
- **Side Effects:** React state: `setApiHealth`, `setIsCheckingApi`
- **Edge Cases:** UNKNOWN (not individually reviewed)
- **Security Considerations:** None noted (not individually reviewed).
- **Current Limitations:** UNKNOWN (not individually reviewed)

### `formatUptime` (nested in `OfflineSyncModal`)
- **File:** `src/components/OfflineSyncModal.tsx:95-101`  · **Review:** AUTO
- **Purpose:** UNKNOWN (no in-code description; not individually reviewed)
- **Parameters:** `seconds?: number`
- **Returns:** `string` (inferred)
- **Dependencies:** none detected
- **Calls:** no in-repo callees resolved
- **Called By:** `OfflineSyncModal` (src/components/OfflineSyncModal.tsx:43)
- **Database Interaction:** None detected.
- **External Services:** None detected.
- **Authentication:** No authentication logic inside this function.
- **Authorization:** No role/permission check inside this function.
- **Validation:** 1 guard/type/regex check(s) detected.
- **Errors:** None detected.
- **Side Effects:** None detected.
- **Edge Cases:** UNKNOWN (not individually reviewed)
- **Security Considerations:** None noted (not individually reviewed).
- **Current Limitations:** UNKNOWN (not individually reviewed)

### `getCacheStats` (nested in `OfflineSyncModal`)
- **File:** `src/components/OfflineSyncModal.tsx:104-132`  · **Review:** AUTO
- **Purpose:** In-code comment: Inspect cached keys from localStorage
- **Parameters:** none
- **Returns:** `{ totalItems: number; entities: { count: number; key: string; nameAr: string; nameEn: string; }[]; }` (inferred)
- **Dependencies:** none detected
- **Calls:** no in-repo callees resolved
- **Called By:** `OfflineSyncModal` (src/components/OfflineSyncModal.tsx:43)
- **Database Interaction:** None detected.
- **External Services:** None detected.
- **Authentication:** No authentication logic inside this function.
- **Authorization:** No role/permission check inside this function.
- **Validation:** 1 guard/type/regex check(s) detected.
- **Errors:** 1 try/catch
- **Side Effects:** local storage/cache
- **Edge Cases:** UNKNOWN (not individually reviewed)
- **Security Considerations:** None noted (not individually reviewed).
- **Current Limitations:** UNKNOWN (not individually reviewed)

### `handleManualRetry` (nested in `OfflineSyncModal`)
- **File:** `src/components/OfflineSyncModal.tsx:136-163`  · **Review:** AUTO
- **Purpose:** UNKNOWN (no in-code description; not individually reviewed)
- **Parameters:** none
- **Returns:** `Promise<void>` (inferred)
- **Dependencies:** none detected
- **Calls:** `testConnection` (src/lib/firebase.ts:111), `checkApiHealth` (src/components/OfflineSyncModal.tsx:58)
- **Called By:** no in-repo caller resolved (entry point, event handler, route, or referenced by value)
- **Database Interaction:** None detected.
- **External Services:** None detected.
- **Authentication:** No authentication logic inside this function.
- **Authorization:** No role/permission check inside this function.
- **Validation:** None detected.
- **Errors:** 1 try/catch
- **Side Effects:** React state: `setIsRetrying`, `setRetryResult`
- **Edge Cases:** UNKNOWN (not individually reviewed)
- **Security Considerations:** None noted (not individually reviewed).
- **Current Limitations:** UNKNOWN (not individually reviewed)


## src/components/ParentPortalView.tsx

### `ParentPortalView`
- **File:** `src/components/ParentPortalView.tsx:18-265`  · **Review:** AUTO
- **Purpose:** UNKNOWN (no in-code description; not individually reviewed)
- **Parameters:** `{ onOpenExcuseForm }`
- **Returns:** `Element` (inferred)
- **Dependencies:** none detected
- **Calls:** `useAttendance` (src/context/AttendanceContext.tsx:3733)
- **Called By:** no in-repo caller resolved (entry point, event handler, route, or referenced by value)
- **Database Interaction:** None detected.
- **External Services:** None detected.
- **Authentication:** Uses `firebaseUser`/token
- **Authorization:** No role/permission check inside this function.
- **Validation:** 1 guard/type/regex check(s) detected.
- **Errors:** None detected.
- **Side Effects:** React state: `setSelectedStudentId`
- **Edge Cases:** UNKNOWN (not individually reviewed)
- **Security Considerations:** None noted (not individually reviewed).
- **Current Limitations:** UNKNOWN (not individually reviewed)


## src/components/PlatformRootView.tsx

### `PlatformRootView`
- **File:** `src/components/PlatformRootView.tsx:9-133`  · **Review:** AUTO
- **Purpose:** UNKNOWN (no in-code description; not individually reviewed)
- **Parameters:** `{ onSelectLocalDevTenant }`
- **Returns:** `Element` (inferred)
- **Dependencies:** none detected
- **Calls:** no in-repo callees resolved
- **Called By:** no in-repo caller resolved (entry point, event handler, route, or referenced by value)
- **Database Interaction:** None detected.
- **External Services:** None detected.
- **Authentication:** No authentication logic inside this function.
- **Authorization:** No role/permission check inside this function.
- **Validation:** 2 guard/type/regex check(s) detected.
- **Errors:** None detected.
- **Side Effects:** DOM/window access
- **Edge Cases:** UNKNOWN (not individually reviewed)
- **Security Considerations:** None noted (not individually reviewed).
- **Current Limitations:** UNKNOWN (not individually reviewed)


## src/components/QRScannerModal.tsx

### `playAttendanceChime`
- **File:** `src/components/QRScannerModal.tsx:32-56`  · **Review:** AUTO
- **Purpose:** In-code comment: Synthesize pleasant attendance chime with Web Audio API (no external asset needed)
- **Parameters:** none
- **Returns:** `void` (inferred)
- **Dependencies:** none detected
- **Calls:** no in-repo callees resolved
- **Called By:** `handleProcessScan` (src/components/QRScannerModal.tsx:354)
- **Database Interaction:** None detected.
- **External Services:** None detected.
- **Authentication:** No authentication logic inside this function.
- **Authorization:** No role/permission check inside this function.
- **Validation:** 1 guard/type/regex check(s) detected.
- **Errors:** 1 try/catch
- **Side Effects:** React state: `setValueAtTime`; console output; DOM/window access
- **Edge Cases:** UNKNOWN (not individually reviewed)
- **Security Considerations:** Uses `any` typing.
- **Current Limitations:** UNKNOWN (not individually reviewed)

### `playDuplicateWarningTone`
- **File:** `src/components/QRScannerModal.tsx:59-82`  · **Review:** AUTO
- **Purpose:** In-code comment: Synthesize distinct low alert tone for duplicate scan detection
- **Parameters:** none
- **Returns:** `void` (inferred)
- **Dependencies:** none detected
- **Calls:** no in-repo callees resolved
- **Called By:** `handleProcessScan` (src/components/QRScannerModal.tsx:354)
- **Database Interaction:** None detected.
- **External Services:** None detected.
- **Authentication:** No authentication logic inside this function.
- **Authorization:** No role/permission check inside this function.
- **Validation:** 1 guard/type/regex check(s) detected.
- **Errors:** 1 try/catch
- **Side Effects:** React state: `setValueAtTime`; console output; DOM/window access
- **Edge Cases:** UNKNOWN (not individually reviewed)
- **Security Considerations:** Uses `any` typing.
- **Current Limitations:** UNKNOWN (not individually reviewed)

### `QRScannerModal`
- **File:** `src/components/QRScannerModal.tsx:84-1314`  · **Review:** AUTO
- **Purpose:** UNKNOWN (no in-code description; not individually reviewed)
- **Parameters:** `{ onClose, targetSessionId, }`
- **Returns:** `Element` (inferred)
- **Dependencies:** admin
- **Calls:** `useAttendance` (src/context/AttendanceContext.tsx:3733), `useModalAccessibility` (src/hooks/useModalAccessibility.ts:17), `startCamera` (src/components/QRScannerModal.tsx:142), `handleRawScannedString` (src/components/QRScannerModal.tsx:200), `handleProcessScan` (src/components/QRScannerModal.tsx:354), `handleToggleUnscannedStatus` (src/components/QRScannerModal.tsx:502), `handleChangeUnscannedMinutes` (src/components/QRScannerModal.tsx:512)
- **Called By:** no in-repo caller resolved (entry point, event handler, route, or referenced by value)
- **Database Interaction:** None detected.
- **External Services:** None detected.
- **Authentication:** Uses `firebaseUser`/token
- **Authorization:** No role/permission check inside this function.
- **Validation:** 15 guard/type/regex check(s) detected.
- **Errors:** 7 try/catch, 1 throw
- **Side Effects:** React state: `setActiveSessionId`, `setCameraActive`, `setCameraError`, `setDuplicateWarning`, `setInterval`, `setIsFinalizeModalOpen`, `setIsProcessingPhoto`, `setIsStartConfirmOpen` …; console output; DOM/window access
- **Edge Cases:** UNKNOWN (not individually reviewed)
- **Security Considerations:** Uses `any` typing.
- **Current Limitations:** UNKNOWN (not individually reviewed)

### `startCamera` (nested in `QRScannerModal`)
- **File:** `src/components/QRScannerModal.tsx:142-188`  · **Review:** AUTO
- **Purpose:** UNKNOWN (no in-code description; not individually reviewed)
- **Parameters:** none
- **Returns:** `Promise<void>` (inferred)
- **Dependencies:** none detected
- **Calls:** no in-repo callees resolved
- **Called By:** `QRScannerModal` (src/components/QRScannerModal.tsx:84)
- **Database Interaction:** None detected.
- **External Services:** None detected.
- **Authentication:** No authentication logic inside this function.
- **Authorization:** No role/permission check inside this function.
- **Validation:** 1 guard/type/regex check(s) detected.
- **Errors:** 2 try/catch, 1 throw
- **Side Effects:** React state: `setCameraActive`, `setCameraError`; console output
- **Edge Cases:** UNKNOWN (not individually reviewed)
- **Security Considerations:** Uses `any` typing.
- **Current Limitations:** UNKNOWN (not individually reviewed)

### `handleRawScannedString` (nested in `QRScannerModal`)
- **File:** `src/components/QRScannerModal.tsx:200-232`  · **Review:** AUTO
- **Purpose:** UNKNOWN (no in-code description; not individually reviewed)
- **Parameters:** `raw: string`
- **Returns:** `void` (inferred)
- **Dependencies:** none detected
- **Calls:** `handleProcessScan` (src/components/QRScannerModal.tsx:354)
- **Called By:** `QRScannerModal` (src/components/QRScannerModal.tsx:84), `handlePhotoCapture` (src/components/QRScannerModal.tsx:297)
- **Database Interaction:** None detected.
- **External Services:** None detected.
- **Authentication:** No authentication logic inside this function.
- **Authorization:** No role/permission check inside this function.
- **Validation:** 1 guard/type/regex check(s) detected.
- **Errors:** 1 try/catch
- **Side Effects:** None detected.
- **Edge Cases:** UNKNOWN (not individually reviewed)
- **Security Considerations:** None noted (not individually reviewed).
- **Current Limitations:** UNKNOWN (not individually reviewed)

### `handlePhotoCapture` (nested in `QRScannerModal`)
- **File:** `src/components/QRScannerModal.tsx:297-352`  · **Review:** AUTO
- **Purpose:** In-code comment: Handle native phone camera snapshot or photo upload
- **Parameters:** `e: React.ChangeEvent<HTMLInputElement>`
- **Returns:** `void` (inferred)
- **Dependencies:** none detected
- **Calls:** `handleRawScannedString` (src/components/QRScannerModal.tsx:200)
- **Called By:** no in-repo caller resolved (entry point, event handler, route, or referenced by value)
- **Database Interaction:** None detected.
- **External Services:** None detected.
- **Authentication:** No authentication logic inside this function.
- **Authorization:** No role/permission check inside this function.
- **Validation:** 2 guard/type/regex check(s) detected.
- **Errors:** 1 try/catch
- **Side Effects:** React state: `setIsProcessingPhoto`; console output; DOM/window access
- **Edge Cases:** UNKNOWN (not individually reviewed)
- **Security Considerations:** None noted (not individually reviewed).
- **Current Limitations:** UNKNOWN (not individually reviewed)

### `handleProcessScan` (nested in `QRScannerModal`)
- **File:** `src/components/QRScannerModal.tsx:354-422`  · **Review:** AUTO
- **Purpose:** UNKNOWN (no in-code description; not individually reviewed)
- **Parameters:** `student: Student`
- **Returns:** `void` (inferred)
- **Dependencies:** admin
- **Calls:** `playDuplicateWarningTone` (src/components/QRScannerModal.tsx:59), `playAttendanceChime` (src/components/QRScannerModal.tsx:32)
- **Called By:** `QRScannerModal` (src/components/QRScannerModal.tsx:84), `handleRawScannedString` (src/components/QRScannerModal.tsx:200), `handleManualScanSubmit` (src/components/QRScannerModal.tsx:424)
- **Database Interaction:** None detected.
- **External Services:** None detected.
- **Authentication:** Uses `firebaseUser`/token
- **Authorization:** No role/permission check inside this function.
- **Validation:** 1 guard/type/regex check(s) detected.
- **Errors:** None detected.
- **Side Effects:** React state: `setDuplicateWarning`, `setLastScannedStudent`, `setRecentScans`, `setScannedTimestamps`
- **Edge Cases:** UNKNOWN (not individually reviewed)
- **Security Considerations:** None noted (not individually reviewed).
- **Current Limitations:** UNKNOWN (not individually reviewed)

### `handleManualScanSubmit` (nested in `QRScannerModal`)
- **File:** `src/components/QRScannerModal.tsx:424-442`  · **Review:** AUTO
- **Purpose:** UNKNOWN (no in-code description; not individually reviewed)
- **Parameters:** `e: React.FormEvent`
- **Returns:** `void` (inferred)
- **Dependencies:** none detected
- **Calls:** `handleProcessScan` (src/components/QRScannerModal.tsx:354)
- **Called By:** no in-repo caller resolved (entry point, event handler, route, or referenced by value)
- **Database Interaction:** None detected.
- **External Services:** None detected.
- **Authentication:** No authentication logic inside this function.
- **Authorization:** No role/permission check inside this function.
- **Validation:** 1 guard/type/regex check(s) detected.
- **Errors:** None detected.
- **Side Effects:** React state: `setManualCodeInput`
- **Edge Cases:** UNKNOWN (not individually reviewed)
- **Security Considerations:** None noted (not individually reviewed).
- **Current Limitations:** UNKNOWN (not individually reviewed)

### `handleConfirmStartQRMode` (nested in `QRScannerModal`)
- **File:** `src/components/QRScannerModal.tsx:447-486`  · **Review:** AUTO
- **Purpose:** In-code comment: Condition 1: Reset roster only after explicit teacher confirmation
- **Parameters:** none
- **Returns:** `void` (inferred)
- **Dependencies:** admin
- **Calls:** no in-repo callees resolved
- **Called By:** no in-repo caller resolved (entry point, event handler, route, or referenced by value)
- **Database Interaction:** None detected.
- **External Services:** None detected.
- **Authentication:** Uses `firebaseUser`/token
- **Authorization:** No role/permission check inside this function.
- **Validation:** 1 guard/type/regex check(s) detected.
- **Errors:** None detected.
- **Side Effects:** React state: `setDuplicateWarning`, `setIsStartConfirmOpen`, `setLastScannedStudent`, `setQrModeActive`, `setRecentScans`, `setScannedTimestamps`, `setSessionBanner`, `setTimeout`
- **Edge Cases:** UNKNOWN (not individually reviewed)
- **Security Considerations:** None noted (not individually reviewed).
- **Current Limitations:** UNKNOWN (not individually reviewed)

### `handleOpenFinalizeModal` (nested in `QRScannerModal`)
- **File:** `src/components/QRScannerModal.tsx:489-500`  · **Review:** AUTO
- **Purpose:** In-code comment: Condition 2: Open finalize review modal to inspect unscanned students and flag late arrivals
- **Parameters:** none
- **Returns:** `void` (inferred)
- **Dependencies:** none detected
- **Calls:** no in-repo callees resolved
- **Called By:** no in-repo caller resolved (entry point, event handler, route, or referenced by value)
- **Database Interaction:** None detected.
- **External Services:** None detected.
- **Authentication:** No authentication logic inside this function.
- **Authorization:** No role/permission check inside this function.
- **Validation:** 1 guard/type/regex check(s) detected.
- **Errors:** None detected.
- **Side Effects:** React state: `setIsFinalizeModalOpen`, `setUnscannedSettings`
- **Edge Cases:** UNKNOWN (not individually reviewed)
- **Security Considerations:** None noted (not individually reviewed).
- **Current Limitations:** UNKNOWN (not individually reviewed)

### `handleToggleUnscannedStatus` (nested in `QRScannerModal`)
- **File:** `src/components/QRScannerModal.tsx:502-510`  · **Review:** AUTO
- **Purpose:** UNKNOWN (no in-code description; not individually reviewed)
- **Parameters:** `studentId: string`; `status: 'absent' | 'late'`
- **Returns:** `void` (inferred)
- **Dependencies:** none detected
- **Calls:** no in-repo callees resolved
- **Called By:** `QRScannerModal` (src/components/QRScannerModal.tsx:84)
- **Database Interaction:** None detected.
- **External Services:** None detected.
- **Authentication:** No authentication logic inside this function.
- **Authorization:** No role/permission check inside this function.
- **Validation:** None detected.
- **Errors:** None detected.
- **Side Effects:** React state: `setUnscannedSettings`
- **Edge Cases:** UNKNOWN (not individually reviewed)
- **Security Considerations:** None noted (not individually reviewed).
- **Current Limitations:** UNKNOWN (not individually reviewed)

### `handleChangeUnscannedMinutes` (nested in `QRScannerModal`)
- **File:** `src/components/QRScannerModal.tsx:512-520`  · **Review:** AUTO
- **Purpose:** UNKNOWN (no in-code description; not individually reviewed)
- **Parameters:** `studentId: string`; `minutesLate: number`
- **Returns:** `void` (inferred)
- **Dependencies:** none detected
- **Calls:** no in-repo callees resolved
- **Called By:** `QRScannerModal` (src/components/QRScannerModal.tsx:84)
- **Database Interaction:** None detected.
- **External Services:** None detected.
- **Authentication:** No authentication logic inside this function.
- **Authorization:** No role/permission check inside this function.
- **Validation:** None detected.
- **Errors:** None detected.
- **Side Effects:** React state: `setUnscannedSettings`
- **Edge Cases:** UNKNOWN (not individually reviewed)
- **Security Considerations:** None noted (not individually reviewed).
- **Current Limitations:** UNKNOWN (not individually reviewed)

### `handleFinalizeQRSession` (nested in `QRScannerModal`)
- **File:** `src/components/QRScannerModal.tsx:523-583`  · **Review:** AUTO
- **Purpose:** In-code comment: Condition 2: Commit final absences and late records after teacher review
- **Parameters:** none
- **Returns:** `void` (inferred)
- **Dependencies:** admin
- **Calls:** no in-repo callees resolved
- **Called By:** no in-repo caller resolved (entry point, event handler, route, or referenced by value)
- **Database Interaction:** None detected.
- **External Services:** None detected.
- **Authentication:** Uses `firebaseUser`/token
- **Authorization:** No role/permission check inside this function.
- **Validation:** 1 guard/type/regex check(s) detected.
- **Errors:** None detected.
- **Side Effects:** React state: `setIsFinalizeModalOpen`, `setQrModeActive`, `setSessionBanner`, `setTimeout`
- **Edge Cases:** UNKNOWN (not individually reviewed)
- **Security Considerations:** None noted (not individually reviewed).
- **Current Limitations:** UNKNOWN (not individually reviewed)

### `handleSetAllPresent` (nested in `QRScannerModal`)
- **File:** `src/components/QRScannerModal.tsx:586-615`  · **Review:** AUTO
- **Purpose:** In-code comment: Manual Mode Switch: Reset all students present
- **Parameters:** none
- **Returns:** `void` (inferred)
- **Dependencies:** admin
- **Calls:** no in-repo callees resolved
- **Called By:** no in-repo caller resolved (entry point, event handler, route, or referenced by value)
- **Database Interaction:** None detected.
- **External Services:** None detected.
- **Authentication:** Uses `firebaseUser`/token
- **Authorization:** No role/permission check inside this function.
- **Validation:** 1 guard/type/regex check(s) detected.
- **Errors:** None detected.
- **Side Effects:** React state: `setDuplicateWarning`, `setQrModeActive`, `setScannedTimestamps`, `setSessionBanner`, `setTimeout`
- **Edge Cases:** UNKNOWN (not individually reviewed)
- **Security Considerations:** None noted (not individually reviewed).
- **Current Limitations:** UNKNOWN (not individually reviewed)


## src/components/ReportsView.tsx

### `ReportsView`
- **File:** `src/components/ReportsView.tsx:26-666`  · **Review:** AUTO
- **Purpose:** UNKNOWN (no in-code description; not individually reviewed)
- **Parameters:** none
- **Returns:** `Element` (inferred)
- **Dependencies:** none detected
- **Calls:** `useAttendance` (src/context/AttendanceContext.tsx:3733)
- **Called By:** no in-repo caller resolved (entry point, event handler, route, or referenced by value)
- **Database Interaction:** None detected.
- **External Services:** None detected.
- **Authentication:** No authentication logic inside this function.
- **Authorization:** No role/permission check inside this function.
- **Validation:** 1 guard/type/regex check(s) detected.
- **Errors:** None detected.
- **Side Effects:** React state: `setAttribute`, `setBatchWarningAlert`, `setDownloadSuccessMsg`, `setIsBatchPrintModalOpen`, `setIsPdfModalOpen`, `setReportType`, `setSelectedClass`, `setSentWarningIds` …; DOM/window access
- **Edge Cases:** UNKNOWN (not individually reviewed)
- **Security Considerations:** Uses `any` typing.
- **Current Limitations:** UNKNOWN (not individually reviewed)

### `handleDownloadExcelWorkbook` (nested in `ReportsView`)
- **File:** `src/components/ReportsView.tsx:85-192`  · **Review:** AUTO
- **Purpose:** In-code comment: 1. Download formatted Excel Workbook (.xls with native styling & RTL)
- **Parameters:** none
- **Returns:** `void` (inferred)
- **Dependencies:** none detected
- **Calls:** no in-repo callees resolved
- **Called By:** no in-repo caller resolved (entry point, event handler, route, or referenced by value)
- **Database Interaction:** None detected.
- **External Services:** None detected.
- **Authentication:** No authentication logic inside this function.
- **Authorization:** No role/permission check inside this function.
- **Validation:** None detected.
- **Errors:** None detected.
- **Side Effects:** React state: `setDownloadSuccessMsg`, `setTimeout`; DOM/window access
- **Edge Cases:** UNKNOWN (not individually reviewed)
- **Security Considerations:** None noted (not individually reviewed).
- **Current Limitations:** UNKNOWN (not individually reviewed)

### `handleExportCSV` (nested in `ReportsView`)
- **File:** `src/components/ReportsView.tsx:195-238`  · **Review:** AUTO
- **Purpose:** In-code comment: 2. Download standard CSV with UTF-8 BOM
- **Parameters:** none
- **Returns:** `void` (inferred)
- **Dependencies:** none detected
- **Calls:** no in-repo callees resolved
- **Called By:** no in-repo caller resolved (entry point, event handler, route, or referenced by value)
- **Database Interaction:** None detected.
- **External Services:** None detected.
- **Authentication:** No authentication logic inside this function.
- **Authorization:** No role/permission check inside this function.
- **Validation:** None detected.
- **Errors:** None detected.
- **Side Effects:** React state: `setAttribute`, `setDownloadSuccessMsg`, `setTimeout`; DOM/window access
- **Edge Cases:** UNKNOWN (not individually reviewed)
- **Security Considerations:** None noted (not individually reviewed).
- **Current Limitations:** UNKNOWN (not individually reviewed)


## src/components/StudentAbsenceInquiryView.tsx

### `StudentAbsenceInquiryView`
- **File:** `src/components/StudentAbsenceInquiryView.tsx:33-1642`  · **Review:** AUTO
- **Purpose:** UNKNOWN (no in-code description; not individually reviewed)
- **Parameters:** none
- **Returns:** `Element` (inferred)
- **Dependencies:** none detected
- **Calls:** `useAttendance` (src/context/AttendanceContext.tsx:3733), `getArabicDayName` (src/components/StudentAbsenceInquiryView.tsx:305), `getSchoolDaysInRange` (src/components/StudentAbsenceInquiryView.tsx:317)
- **Called By:** no in-repo caller resolved (entry point, event handler, route, or referenced by value)
- **Database Interaction:** None detected.
- **External Services:** None detected.
- **Authentication:** No authentication logic inside this function.
- **Authorization:** No role/permission check inside this function.
- **Validation:** 16 guard/type/regex check(s) detected.
- **Errors:** 2 try/catch
- **Side Effects:** React state: `setCustomEndDate`, `setCustomStartDate`, `setDate`, `setHorizonType`, `setIsGeneratingPdf`, `setSearchQuery`, `setSelectedClass`, `setSelectedGrade` …; console output; DOM/window access
- **Edge Cases:** UNKNOWN (not individually reviewed)
- **Security Considerations:** None noted (not individually reviewed).
- **Current Limitations:** UNKNOWN (not individually reviewed)

### `getArabicDayName` (nested in `StudentAbsenceInquiryView`)
- **File:** `src/components/StudentAbsenceInquiryView.tsx:305-314`  · **Review:** AUTO
- **Purpose:** In-code comment: Helper to reliably get Arabic day of week name
- **Parameters:** `dateStr: string`
- **Returns:** `string` (declared)
- **Dependencies:** none detected
- **Calls:** no in-repo callees resolved
- **Called By:** `StudentAbsenceInquiryView` (src/components/StudentAbsenceInquiryView.tsx:33)
- **Database Interaction:** None detected.
- **External Services:** None detected.
- **Authentication:** No authentication logic inside this function.
- **Authorization:** No role/permission check inside this function.
- **Validation:** None detected.
- **Errors:** 1 try/catch
- **Side Effects:** None detected.
- **Edge Cases:** UNKNOWN (not individually reviewed)
- **Security Considerations:** None noted (not individually reviewed).
- **Current Limitations:** UNKNOWN (not individually reviewed)

### `getSchoolDaysInRange` (nested in `StudentAbsenceInquiryView`)
- **File:** `src/components/StudentAbsenceInquiryView.tsx:317-341`  · **Review:** AUTO
- **Purpose:** In-code comment: Helper to strictly generate school days (excluding weekends & official holidays from Settings)
- **Parameters:** `startDateStr: string`; `endDateStr: string`
- **Returns:** `string[]` (declared)
- **Dependencies:** none detected
- **Calls:** `isSchoolOffDay` (src/utils/holidayUtils.ts:93)
- **Called By:** `StudentAbsenceInquiryView` (src/components/StudentAbsenceInquiryView.tsx:33)
- **Database Interaction:** None detected.
- **External Services:** None detected.
- **Authentication:** No authentication logic inside this function.
- **Authorization:** No role/permission check inside this function.
- **Validation:** 1 guard/type/regex check(s) detected.
- **Errors:** None detected.
- **Side Effects:** React state: `setDate`
- **Edge Cases:** UNKNOWN (not individually reviewed)
- **Security Considerations:** None noted (not individually reviewed).
- **Current Limitations:** UNKNOWN (not individually reviewed)

### `handleSendWarning` (nested in `StudentAbsenceInquiryView`)
- **File:** `src/components/StudentAbsenceInquiryView.tsx:719-729`  · **Review:** AUTO
- **Purpose:** In-code comment: Handle Send Warning Action
- **Parameters:** none
- **Returns:** `void` (inferred)
- **Dependencies:** none detected
- **Calls:** no in-repo callees resolved
- **Called By:** no in-repo caller resolved (entry point, event handler, route, or referenced by value)
- **Database Interaction:** None detected.
- **External Services:** None detected.
- **Authentication:** No authentication logic inside this function.
- **Authorization:** No role/permission check inside this function.
- **Validation:** 1 guard/type/regex check(s) detected.
- **Errors:** None detected.
- **Side Effects:** React state: `setTimeout`, `setToastMsg`
- **Edge Cases:** UNKNOWN (not individually reviewed)
- **Security Considerations:** None noted (not individually reviewed).
- **Current Limitations:** UNKNOWN (not individually reviewed)

### `handleDownloadPdf` (nested in `StudentAbsenceInquiryView`)
- **File:** `src/components/StudentAbsenceInquiryView.tsx:732-770`  · **Review:** AUTO
- **Purpose:** In-code comment: Handle Download Vector PDF
- **Parameters:** none
- **Returns:** `Promise<void>` (inferred)
- **Dependencies:** none detected
- **Calls:** `generateStudentAbsenceReportHtml` (src/utils/printTemplates/studentAbsenceReportTemplate.ts:42), `downloadNativePdfFromHtml` (src/utils/pdfExport.ts:66)
- **Called By:** no in-repo caller resolved (entry point, event handler, route, or referenced by value)
- **Database Interaction:** None detected.
- **External Services:** None detected.
- **Authentication:** No authentication logic inside this function.
- **Authorization:** No role/permission check inside this function.
- **Validation:** 1 guard/type/regex check(s) detected.
- **Errors:** 1 try/catch
- **Side Effects:** React state: `setIsGeneratingPdf`, `setTimeout`, `setToastMsg`; console output; DOM/window access
- **Edge Cases:** UNKNOWN (not individually reviewed)
- **Security Considerations:** None noted (not individually reviewed).
- **Current Limitations:** UNKNOWN (not individually reviewed)

### `handlePrint` (nested in `StudentAbsenceInquiryView`)
- **File:** `src/components/StudentAbsenceInquiryView.tsx:773-796`  · **Review:** AUTO
- **Purpose:** In-code comment: Handle Direct Print Action
- **Parameters:** none
- **Returns:** `void` (inferred)
- **Dependencies:** none detected
- **Calls:** `generateStudentAbsenceReportHtml` (src/utils/printTemplates/studentAbsenceReportTemplate.ts:42), `printNativePdfFromHtml` (src/utils/pdfExport.ts:104)
- **Called By:** no in-repo caller resolved (entry point, event handler, route, or referenced by value)
- **Database Interaction:** None detected.
- **External Services:** None detected.
- **Authentication:** No authentication logic inside this function.
- **Authorization:** No role/permission check inside this function.
- **Validation:** 1 guard/type/regex check(s) detected.
- **Errors:** None detected.
- **Side Effects:** DOM/window access
- **Edge Cases:** UNKNOWN (not individually reviewed)
- **Security Considerations:** None noted (not individually reviewed).
- **Current Limitations:** UNKNOWN (not individually reviewed)


## src/components/StudentManagementView.tsx

### `StudentManagementView`
- **File:** `src/components/StudentManagementView.tsx:58-1257`  · **Review:** AUTO
- **Purpose:** UNKNOWN (no in-code description; not individually reviewed)
- **Parameters:** `{ initialStudentId, }`
- **Returns:** `Element` (inferred)
- **Dependencies:** none detected
- **Calls:** `useAttendance` (src/context/AttendanceContext.tsx:3733)
- **Called By:** no in-repo caller resolved (entry point, event handler, route, or referenced by value)
- **Database Interaction:** None detected.
- **External Services:** None detected.
- **Authentication:** Uses `firebaseUser`/token
- **Authorization:** References: `canImportStudents`, `currentUserRole`
- **Validation:** 5 guard/type/regex check(s) detected.
- **Errors:** None detected.
- **Side Effects:** React state: `setImportResultSummary`, `setImportStage`, `setInterventionOnly`, `setIsAddStudentModalOpen`, `setIsBatchQRModalOpen`, `setIsDragging`, `setIsImportModalOpen`, `setIsScannerModalOpen` …; DOM/window access
- **Edge Cases:** UNKNOWN (not individually reviewed)
- **Security Considerations:** None noted (not individually reviewed).
- **Current Limitations:** UNKNOWN (not individually reviewed)

### `handleDownloadTemplate` (nested in `StudentManagementView`)
- **File:** `src/components/StudentManagementView.tsx:166-187`  · **Review:** AUTO
- **Purpose:** In-code comment: Download official CSV template with UTF-8 BOM, generated directly from Settings classes
- **Parameters:** none
- **Returns:** `void` (inferred)
- **Dependencies:** none detected
- **Calls:** no in-repo callees resolved
- **Called By:** no in-repo caller resolved (entry point, event handler, route, or referenced by value)
- **Database Interaction:** None detected.
- **External Services:** None detected.
- **Authentication:** No authentication logic inside this function.
- **Authorization:** No role/permission check inside this function.
- **Validation:** None detected.
- **Errors:** None detected.
- **Side Effects:** DOM/window access
- **Edge Cases:** UNKNOWN (not individually reviewed)
- **Security Considerations:** None noted (not individually reviewed).
- **Current Limitations:** UNKNOWN (not individually reviewed)

### `handleDownloadErrorReport` (nested in `StudentManagementView`)
- **File:** `src/components/StudentManagementView.tsx:190-212`  · **Review:** AUTO
- **Purpose:** In-code comment: Download CSV Error Report for rejected rows
- **Parameters:** none
- **Returns:** `void` (inferred)
- **Dependencies:** none detected
- **Calls:** no in-repo callees resolved
- **Called By:** no in-repo caller resolved (entry point, event handler, route, or referenced by value)
- **Database Interaction:** None detected.
- **External Services:** None detected.
- **Authentication:** No authentication logic inside this function.
- **Authorization:** No role/permission check inside this function.
- **Validation:** None detected.
- **Errors:** None detected.
- **Side Effects:** DOM/window access
- **Edge Cases:** UNKNOWN (not individually reviewed)
- **Security Considerations:** None noted (not individually reviewed).
- **Current Limitations:** UNKNOWN (not individually reviewed)

### `processUploadedFile` (nested in `StudentManagementView`)
- **File:** `src/components/StudentManagementView.tsx:215-228`  · **Review:** AUTO
- **Purpose:** In-code comment: Handle uploaded file via input or drop
- **Parameters:** `file: File`
- **Returns:** `void` (inferred)
- **Dependencies:** none detected
- **Calls:** no in-repo callees resolved
- **Called By:** `handleFileInputChange` (src/components/StudentManagementView.tsx:230), `handleDrop` (src/components/StudentManagementView.tsx:247)
- **Database Interaction:** None detected.
- **External Services:** None detected.
- **Authentication:** No authentication logic inside this function.
- **Authorization:** No role/permission check inside this function.
- **Validation:** 1 guard/type/regex check(s) detected.
- **Errors:** None detected.
- **Side Effects:** React state: `setRawCsvText`, `setUploadedFile`
- **Edge Cases:** UNKNOWN (not individually reviewed)
- **Security Considerations:** None noted (not individually reviewed).
- **Current Limitations:** UNKNOWN (not individually reviewed)

### `handleFileInputChange` (nested in `StudentManagementView`)
- **File:** `src/components/StudentManagementView.tsx:230-235`  · **Review:** AUTO
- **Purpose:** UNKNOWN (no in-code description; not individually reviewed)
- **Parameters:** `e: React.ChangeEvent<HTMLInputElement>`
- **Returns:** `void` (inferred)
- **Dependencies:** none detected
- **Calls:** `processUploadedFile` (src/components/StudentManagementView.tsx:215)
- **Called By:** no in-repo caller resolved (entry point, event handler, route, or referenced by value)
- **Database Interaction:** None detected.
- **External Services:** None detected.
- **Authentication:** No authentication logic inside this function.
- **Authorization:** No role/permission check inside this function.
- **Validation:** None detected.
- **Errors:** None detected.
- **Side Effects:** None detected.
- **Edge Cases:** UNKNOWN (not individually reviewed)
- **Security Considerations:** None noted (not individually reviewed).
- **Current Limitations:** UNKNOWN (not individually reviewed)

### `handleDragOver` (nested in `StudentManagementView`)
- **File:** `src/components/StudentManagementView.tsx:237-240`  · **Review:** AUTO
- **Purpose:** UNKNOWN (no in-code description; not individually reviewed)
- **Parameters:** `e: React.DragEvent`
- **Returns:** `void` (inferred)
- **Dependencies:** none detected
- **Calls:** no in-repo callees resolved
- **Called By:** no in-repo caller resolved (entry point, event handler, route, or referenced by value)
- **Database Interaction:** None detected.
- **External Services:** None detected.
- **Authentication:** No authentication logic inside this function.
- **Authorization:** No role/permission check inside this function.
- **Validation:** None detected.
- **Errors:** None detected.
- **Side Effects:** React state: `setIsDragging`
- **Edge Cases:** UNKNOWN (not individually reviewed)
- **Security Considerations:** None noted (not individually reviewed).
- **Current Limitations:** UNKNOWN (not individually reviewed)

### `handleDragLeave` (nested in `StudentManagementView`)
- **File:** `src/components/StudentManagementView.tsx:242-245`  · **Review:** AUTO
- **Purpose:** UNKNOWN (no in-code description; not individually reviewed)
- **Parameters:** `e: React.DragEvent`
- **Returns:** `void` (inferred)
- **Dependencies:** none detected
- **Calls:** no in-repo callees resolved
- **Called By:** no in-repo caller resolved (entry point, event handler, route, or referenced by value)
- **Database Interaction:** None detected.
- **External Services:** None detected.
- **Authentication:** No authentication logic inside this function.
- **Authorization:** No role/permission check inside this function.
- **Validation:** None detected.
- **Errors:** None detected.
- **Side Effects:** React state: `setIsDragging`
- **Edge Cases:** UNKNOWN (not individually reviewed)
- **Security Considerations:** None noted (not individually reviewed).
- **Current Limitations:** UNKNOWN (not individually reviewed)

### `handleDrop` (nested in `StudentManagementView`)
- **File:** `src/components/StudentManagementView.tsx:247-254`  · **Review:** AUTO
- **Purpose:** UNKNOWN (no in-code description; not individually reviewed)
- **Parameters:** `e: React.DragEvent`
- **Returns:** `void` (inferred)
- **Dependencies:** none detected
- **Calls:** `processUploadedFile` (src/components/StudentManagementView.tsx:215)
- **Called By:** no in-repo caller resolved (entry point, event handler, route, or referenced by value)
- **Database Interaction:** None detected.
- **External Services:** None detected.
- **Authentication:** No authentication logic inside this function.
- **Authorization:** No role/permission check inside this function.
- **Validation:** None detected.
- **Errors:** None detected.
- **Side Effects:** React state: `setIsDragging`
- **Edge Cases:** UNKNOWN (not individually reviewed)
- **Security Considerations:** None noted (not individually reviewed).
- **Current Limitations:** UNKNOWN (not individually reviewed)

### `parseCsvLine` (nested in `StudentManagementView`)
- **File:** `src/components/StudentManagementView.tsx:257-278`  · **Review:** AUTO
- **Purpose:** In-code comment: Helper to split CSV line safely handling quoted fields
- **Parameters:** `line: string`
- **Returns:** `string[]` (declared)
- **Dependencies:** none detected
- **Calls:** no in-repo callees resolved
- **Called By:** `handleValidateInput` (src/components/StudentManagementView.tsx:281)
- **Database Interaction:** None detected.
- **External Services:** None detected.
- **Authentication:** No authentication logic inside this function.
- **Authorization:** No role/permission check inside this function.
- **Validation:** None detected.
- **Errors:** None detected.
- **Side Effects:** None detected.
- **Edge Cases:** UNKNOWN (not individually reviewed)
- **Security Considerations:** None noted (not individually reviewed).
- **Current Limitations:** UNKNOWN (not individually reviewed)

### `handleValidateInput` (nested in `StudentManagementView`)
- **File:** `src/components/StudentManagementView.tsx:281-407`  · **Review:** AUTO
- **Purpose:** In-code comment: Stage 1 -> Stage 2 Validation parser
- **Parameters:** none
- **Returns:** `void` (inferred)
- **Dependencies:** none detected
- **Calls:** `parseCsvLine` (src/components/StudentManagementView.tsx:257)
- **Called By:** no in-repo caller resolved (entry point, event handler, route, or referenced by value)
- **Database Interaction:** None detected.
- **External Services:** None detected.
- **Authentication:** No authentication logic inside this function.
- **Authorization:** No role/permission check inside this function.
- **Validation:** 4 guard/type/regex check(s) detected.
- **Errors:** None detected.
- **Side Effects:** React state: `setImportStage`, `setValidatedRows`
- **Edge Cases:** UNKNOWN (not individually reviewed)
- **Security Considerations:** None noted (not individually reviewed).
- **Current Limitations:** UNKNOWN (not individually reviewed)

### `handleCommitImport` (nested in `StudentManagementView`)
- **File:** `src/components/StudentManagementView.tsx:410-431`  · **Review:** AUTO
- **Purpose:** In-code comment: Commit valid rows
- **Parameters:** none
- **Returns:** `void` (inferred)
- **Dependencies:** none detected
- **Calls:** no in-repo callees resolved
- **Called By:** no in-repo caller resolved (entry point, event handler, route, or referenced by value)
- **Database Interaction:** None detected.
- **External Services:** None detected.
- **Authentication:** No authentication logic inside this function.
- **Authorization:** No role/permission check inside this function.
- **Validation:** None detected.
- **Errors:** None detected.
- **Side Effects:** React state: `setImportResultSummary`
- **Edge Cases:** UNKNOWN (not individually reviewed)
- **Security Considerations:** None noted (not individually reviewed).
- **Current Limitations:** UNKNOWN (not individually reviewed)

### `handleCloseModal` (nested in `StudentManagementView`)
- **File:** `src/components/StudentManagementView.tsx:433-441`  · **Review:** AUTO
- **Purpose:** UNKNOWN (no in-code description; not individually reviewed)
- **Parameters:** none
- **Returns:** `void` (inferred)
- **Dependencies:** none detected
- **Calls:** no in-repo callees resolved
- **Called By:** no in-repo caller resolved (entry point, event handler, route, or referenced by value)
- **Database Interaction:** None detected.
- **External Services:** None detected.
- **Authentication:** No authentication logic inside this function.
- **Authorization:** No role/permission check inside this function.
- **Validation:** None detected.
- **Errors:** None detected.
- **Side Effects:** React state: `setImportResultSummary`, `setImportStage`, `setIsImportModalOpen`, `setPreviewFilter`, `setRawCsvText`, `setUploadedFile`, `setValidatedRows`
- **Edge Cases:** UNKNOWN (not individually reviewed)
- **Security Considerations:** None noted (not individually reviewed).
- **Current Limitations:** UNKNOWN (not individually reviewed)


## src/components/StudentQRCodeModal.tsx

### `StudentQRCodeModal`
- **File:** `src/components/StudentQRCodeModal.tsx:25-349`  · **Review:** AUTO
- **Purpose:** UNKNOWN (no in-code description; not individually reviewed)
- **Parameters:** `{ student, onClose, onScanInSession, }`
- **Returns:** `Element` (inferred)
- **Dependencies:** none detected
- **Calls:** `useAttendance` (src/context/AttendanceContext.tsx:3733), `generateQR` (src/components/StudentQRCodeModal.tsx:56), `useModalAccessibility` (src/hooks/useModalAccessibility.ts:17)
- **Called By:** no in-repo caller resolved (entry point, event handler, route, or referenced by value)
- **Database Interaction:** None detected.
- **External Services:** None detected.
- **Authentication:** No authentication logic inside this function.
- **Authorization:** No role/permission check inside this function.
- **Validation:** 2 guard/type/regex check(s) detected.
- **Errors:** 2 try/catch
- **Side Effects:** React state: `setQrDataUrl`; console output; DOM/window access
- **Edge Cases:** UNKNOWN (not individually reviewed)
- **Security Considerations:** Reads `innerHTML` (HTML sent to PDF/print path).
- **Current Limitations:** UNKNOWN (not individually reviewed)

### `generateQR` (nested in `StudentQRCodeModal`)
- **File:** `src/components/StudentQRCodeModal.tsx:56-96`  · **Review:** AUTO
- **Purpose:** UNKNOWN (no in-code description; not individually reviewed)
- **Parameters:** none
- **Returns:** `Promise<void>` (inferred)
- **Dependencies:** none detected
- **Calls:** no in-repo callees resolved
- **Called By:** `StudentQRCodeModal` (src/components/StudentQRCodeModal.tsx:25)
- **Database Interaction:** None detected.
- **External Services:** None detected.
- **Authentication:** No authentication logic inside this function.
- **Authorization:** No role/permission check inside this function.
- **Validation:** None detected.
- **Errors:** 2 try/catch
- **Side Effects:** React state: `setQrDataUrl`; console output
- **Edge Cases:** UNKNOWN (not individually reviewed)
- **Security Considerations:** None noted (not individually reviewed).
- **Current Limitations:** UNKNOWN (not individually reviewed)

### `handleDownloadCard` (nested in `StudentQRCodeModal`)
- **File:** `src/components/StudentQRCodeModal.tsx:106-180`  · **Review:** AUTO
- **Purpose:** In-code comment: Download high-resolution PNG card
- **Parameters:** none
- **Returns:** `void` (inferred)
- **Dependencies:** none detected
- **Calls:** no in-repo callees resolved
- **Called By:** no in-repo caller resolved (entry point, event handler, route, or referenced by value)
- **Database Interaction:** None detected.
- **External Services:** None detected.
- **Authentication:** No authentication logic inside this function.
- **Authorization:** No role/permission check inside this function.
- **Validation:** 1 guard/type/regex check(s) detected.
- **Errors:** None detected.
- **Side Effects:** DOM/window access
- **Edge Cases:** UNKNOWN (not individually reviewed)
- **Security Considerations:** None noted (not individually reviewed).
- **Current Limitations:** UNKNOWN (not individually reviewed)

### `handleDownloadVectorPdf` (nested in `StudentQRCodeModal`)
- **File:** `src/components/StudentQRCodeModal.tsx:182-193`  · **Review:** AUTO
- **Purpose:** UNKNOWN (no in-code description; not individually reviewed)
- **Parameters:** none
- **Returns:** `Promise<void>` (inferred)
- **Dependencies:** none detected
- **Calls:** `downloadNativePdfFromHtml` (src/utils/pdfExport.ts:66)
- **Called By:** no in-repo caller resolved (entry point, event handler, route, or referenced by value)
- **Database Interaction:** None detected.
- **External Services:** None detected.
- **Authentication:** No authentication logic inside this function.
- **Authorization:** No role/permission check inside this function.
- **Validation:** None detected.
- **Errors:** None detected.
- **Side Effects:** None detected.
- **Edge Cases:** UNKNOWN (not individually reviewed)
- **Security Considerations:** Reads `innerHTML` (HTML sent to PDF/print path).
- **Current Limitations:** UNKNOWN (not individually reviewed)

### `handlePrint` (nested in `StudentQRCodeModal`)
- **File:** `src/components/StudentQRCodeModal.tsx:195-204`  · **Review:** AUTO
- **Purpose:** UNKNOWN (no in-code description; not individually reviewed)
- **Parameters:** none
- **Returns:** `void` (inferred)
- **Dependencies:** none detected
- **Calls:** `printNativePdfFromHtml` (src/utils/pdfExport.ts:104)
- **Called By:** no in-repo caller resolved (entry point, event handler, route, or referenced by value)
- **Database Interaction:** None detected.
- **External Services:** None detected.
- **Authentication:** No authentication logic inside this function.
- **Authorization:** No role/permission check inside this function.
- **Validation:** None detected.
- **Errors:** None detected.
- **Side Effects:** None detected.
- **Edge Cases:** UNKNOWN (not individually reviewed)
- **Security Considerations:** Reads `innerHTML` (HTML sent to PDF/print path).
- **Current Limitations:** UNKNOWN (not individually reviewed)


## src/components/SubscriptionGate.tsx

### `SubscriptionBanner`
- **File:** `src/components/SubscriptionGate.tsx:14-53`  · **Review:** AUTO
- **Purpose:** In-code comment: Non-blocking renewal warning. Shown during the grace window and in the last two weeks of a paid period. Access remains allowed until the boundary passes.
- **Parameters:** `{ access, lang }`
- **Returns:** `Element` (inferred)
- **Dependencies:** none detected
- **Calls:** no in-repo callees resolved
- **Called By:** no in-repo caller resolved (entry point, event handler, route, or referenced by value)
- **Database Interaction:** None detected.
- **External Services:** None detected.
- **Authentication:** No authentication logic inside this function.
- **Authorization:** No role/permission check inside this function.
- **Validation:** 2 guard/type/regex check(s) detected.
- **Errors:** None detected.
- **Side Effects:** None detected.
- **Edge Cases:** UNKNOWN (not individually reviewed)
- **Security Considerations:** None noted (not individually reviewed).
- **Current Limitations:** UNKNOWN (not individually reviewed)

### `SubscriptionSuspendedView`
- **File:** `src/components/SubscriptionGate.tsx:66-158`  · **Review:** AUTO
- **Purpose:** In-code comment: Full-block screen for a stopped or expired school. The platform owner bypasses this gate (enforced in App root) so they can always sign in and renew.
- **Parameters:** `{ access, lang, schoolName, onSignOut, }`
- **Returns:** `Element` (inferred)
- **Dependencies:** none detected
- **Calls:** no in-repo callees resolved
- **Called By:** no in-repo caller resolved (entry point, event handler, route, or referenced by value)
- **Database Interaction:** None detected.
- **External Services:** None detected.
- **Authentication:** No authentication logic inside this function.
- **Authorization:** No role/permission check inside this function.
- **Validation:** None detected.
- **Errors:** None detected.
- **Side Effects:** None detected.
- **Edge Cases:** UNKNOWN (not individually reviewed)
- **Security Considerations:** None noted (not individually reviewed).
- **Current Limitations:** UNKNOWN (not individually reviewed)


## src/components/ThemeSwitcherDropdown.tsx

### `ThemeSwitcherDropdown`
- **File:** `src/components/ThemeSwitcherDropdown.tsx:15-148`  · **Review:** AUTO
- **Purpose:** UNKNOWN (no in-code description; not individually reviewed)
- **Parameters:** `{ lang }`
- **Returns:** `Element` (inferred)
- **Dependencies:** none detected
- **Calls:** `useTheme` (src/context/ThemeContext.tsx:151)
- **Called By:** no in-repo caller resolved (entry point, event handler, route, or referenced by value)
- **Database Interaction:** None detected.
- **External Services:** None detected.
- **Authentication:** No authentication logic inside this function.
- **Authorization:** No role/permission check inside this function.
- **Validation:** None detected.
- **Errors:** None detected.
- **Side Effects:** React state: `setIsOpen`, `setTheme`; DOM/window access
- **Edge Cases:** UNKNOWN (not individually reviewed)
- **Security Considerations:** None noted (not individually reviewed).
- **Current Limitations:** UNKNOWN (not individually reviewed)

### `handleClickOutside` (nested in `ThemeSwitcherDropdown`)
- **File:** `src/components/ThemeSwitcherDropdown.tsx:22-26`  · **Review:** AUTO
- **Purpose:** UNKNOWN (no in-code description; not individually reviewed)
- **Parameters:** `e: MouseEvent`
- **Returns:** `void` (inferred)
- **Dependencies:** none detected
- **Calls:** no in-repo callees resolved
- **Called By:** no in-repo caller resolved (entry point, event handler, route, or referenced by value)
- **Database Interaction:** None detected.
- **External Services:** None detected.
- **Authentication:** No authentication logic inside this function.
- **Authorization:** No role/permission check inside this function.
- **Validation:** None detected.
- **Errors:** None detected.
- **Side Effects:** React state: `setIsOpen`
- **Edge Cases:** UNKNOWN (not individually reviewed)
- **Security Considerations:** None noted (not individually reviewed).
- **Current Limitations:** UNKNOWN (not individually reviewed)


## src/components/UnknownDomainView.tsx

### `UnknownDomainView`
- **File:** `src/components/UnknownDomainView.tsx:9-59`  · **Review:** AUTO
- **Purpose:** UNKNOWN (no in-code description; not individually reviewed)
- **Parameters:** `{ hostname, reason = 'unknown_domain', }`
- **Returns:** `Element` (inferred)
- **Dependencies:** none detected
- **Calls:** no in-repo callees resolved
- **Called By:** no in-repo caller resolved (entry point, event handler, route, or referenced by value)
- **Database Interaction:** None detected.
- **External Services:** None detected.
- **Authentication:** No authentication logic inside this function.
- **Authorization:** No role/permission check inside this function.
- **Validation:** None detected.
- **Errors:** None detected.
- **Side Effects:** DOM/window access
- **Edge Cases:** UNKNOWN (not individually reviewed)
- **Security Considerations:** None noted (not individually reviewed).
- **Current Limitations:** UNKNOWN (not individually reviewed)


## src/components/WeeklyAttendanceTrendCard.tsx

### `WeeklyAttendanceTrendCard`
- **File:** `src/components/WeeklyAttendanceTrendCard.tsx:49-586`  · **Review:** AUTO
- **Purpose:** UNKNOWN (no in-code description; not individually reviewed)
- **Parameters:** none
- **Returns:** `Element` (inferred)
- **Dependencies:** none detected
- **Calls:** `useAttendance` (src/context/AttendanceContext.tsx:3733), `getSchoolWeekDays` (src/utils/holidayUtils.ts:161), `isSchoolOffDay` (src/utils/holidayUtils.ts:93)
- **Called By:** no in-repo caller resolved (entry point, event handler, route, or referenced by value)
- **Database Interaction:** None detected.
- **External Services:** None detected.
- **Authentication:** No authentication logic inside this function.
- **Authorization:** No role/permission check inside this function.
- **Validation:** 1 guard/type/regex check(s) detected.
- **Errors:** None detected.
- **Side Effects:** React state: `setDate`, `setSelectedClassFilter`, `setWeekOffset`
- **Edge Cases:** UNKNOWN (not individually reviewed)
- **Security Considerations:** Uses `any` typing.
- **Current Limitations:** UNKNOWN (not individually reviewed)

### `CustomTooltip` (nested in `WeeklyAttendanceTrendCard`)
- **File:** `src/components/WeeklyAttendanceTrendCard.tsx:172-274`  · **Review:** AUTO
- **Purpose:** In-code comment: Custom Tooltip handling both recorded data and upcoming/holiday statuses
- **Parameters:** `{ active, payload }: any`
- **Returns:** `Element` (inferred)
- **Dependencies:** none detected
- **Calls:** no in-repo callees resolved
- **Called By:** no in-repo caller resolved (entry point, event handler, route, or referenced by value)
- **Database Interaction:** None detected.
- **External Services:** None detected.
- **Authentication:** No authentication logic inside this function.
- **Authorization:** No role/permission check inside this function.
- **Validation:** None detected.
- **Errors:** None detected.
- **Side Effects:** None detected.
- **Edge Cases:** UNKNOWN (not individually reviewed)
- **Security Considerations:** Uses `any` typing.
- **Current Limitations:** UNKNOWN (not individually reviewed)


## src/components/attendance/BulkEditConfirmationModal.tsx

### `BulkEditConfirmationModal`
- **File:** `src/components/attendance/BulkEditConfirmationModal.tsx:17-159`  · **Review:** AUTO
- **Purpose:** UNKNOWN (no in-code description; not individually reviewed)
- **Parameters:** `{ isOpen, onClose, onConfirm, targetStatus, selectedStudents, sessionTitle, lang, }`
- **Returns:** `Element` (inferred)
- **Dependencies:** none detected
- **Calls:** `useModalAccessibility` (src/hooks/useModalAccessibility.ts:17)
- **Called By:** no in-repo caller resolved (entry point, event handler, route, or referenced by value)
- **Database Interaction:** None detected.
- **External Services:** None detected.
- **Authentication:** No authentication logic inside this function.
- **Authorization:** No role/permission check inside this function.
- **Validation:** 2 guard/type/regex check(s) detected.
- **Errors:** None detected.
- **Side Effects:** DOM/window access
- **Edge Cases:** UNKNOWN (not individually reviewed)
- **Security Considerations:** None noted (not individually reviewed).
- **Current Limitations:** UNKNOWN (not individually reviewed)


## src/components/attendance/ClassCalendarView.tsx

### `ClassCalendarView`
- **File:** `src/components/attendance/ClassCalendarView.tsx:13-198`  · **Review:** AUTO
- **Purpose:** UNKNOWN (no in-code description; not individually reviewed)
- **Parameters:** `{ sessions, selectedSessionId, onSelectSession, lang, }`
- **Returns:** `Element` (inferred)
- **Dependencies:** none detected
- **Calls:** `useAttendance` (src/context/AttendanceContext.tsx:3733)
- **Called By:** no in-repo caller resolved (entry point, event handler, route, or referenced by value)
- **Database Interaction:** None detected.
- **External Services:** None detected.
- **Authentication:** No authentication logic inside this function.
- **Authorization:** No role/permission check inside this function.
- **Validation:** 1 guard/type/regex check(s) detected.
- **Errors:** None detected.
- **Side Effects:** React state: `setCurrentDate`
- **Edge Cases:** UNKNOWN (not individually reviewed)
- **Security Considerations:** None noted (not individually reviewed).
- **Current Limitations:** UNKNOWN (not individually reviewed)

### `handlePrevMonth` (nested in `ClassCalendarView`)
- **File:** `src/components/attendance/ClassCalendarView.tsx:40-42`  · **Review:** AUTO
- **Purpose:** UNKNOWN (no in-code description; not individually reviewed)
- **Parameters:** none
- **Returns:** `void` (inferred)
- **Dependencies:** none detected
- **Calls:** no in-repo callees resolved
- **Called By:** no in-repo caller resolved (entry point, event handler, route, or referenced by value)
- **Database Interaction:** None detected.
- **External Services:** None detected.
- **Authentication:** No authentication logic inside this function.
- **Authorization:** No role/permission check inside this function.
- **Validation:** None detected.
- **Errors:** None detected.
- **Side Effects:** React state: `setCurrentDate`
- **Edge Cases:** UNKNOWN (not individually reviewed)
- **Security Considerations:** None noted (not individually reviewed).
- **Current Limitations:** UNKNOWN (not individually reviewed)

### `handleNextMonth` (nested in `ClassCalendarView`)
- **File:** `src/components/attendance/ClassCalendarView.tsx:44-46`  · **Review:** AUTO
- **Purpose:** UNKNOWN (no in-code description; not individually reviewed)
- **Parameters:** none
- **Returns:** `void` (inferred)
- **Dependencies:** none detected
- **Calls:** no in-repo callees resolved
- **Called By:** no in-repo caller resolved (entry point, event handler, route, or referenced by value)
- **Database Interaction:** None detected.
- **External Services:** None detected.
- **Authentication:** No authentication logic inside this function.
- **Authorization:** No role/permission check inside this function.
- **Validation:** None detected.
- **Errors:** None detected.
- **Side Effects:** React state: `setCurrentDate`
- **Edge Cases:** UNKNOWN (not individually reviewed)
- **Security Considerations:** None noted (not individually reviewed).
- **Current Limitations:** UNKNOWN (not individually reviewed)


## src/components/attendance/EmergencyRosterModal.tsx

### `EmergencyRosterModal`
- **File:** `src/components/attendance/EmergencyRosterModal.tsx:29-430`  · **Review:** AUTO
- **Purpose:** UNKNOWN (no in-code description; not individually reviewed)
- **Parameters:** `{ isOpen, onClose, }`
- **Returns:** `ReactPortal` (inferred)
- **Dependencies:** none detected
- **Calls:** `useAttendance` (src/context/AttendanceContext.tsx:3733), `useModalAccessibility` (src/hooks/useModalAccessibility.ts:17), `toggleVerify` (src/components/attendance/EmergencyRosterModal.tsx:95)
- **Called By:** no in-repo caller resolved (entry point, event handler, route, or referenced by value)
- **Database Interaction:** None detected.
- **External Services:** None detected.
- **Authentication:** No authentication logic inside this function.
- **Authorization:** No role/permission check inside this function.
- **Validation:** 3 guard/type/regex check(s) detected.
- **Errors:** None detected.
- **Side Effects:** React state: `setIsExportingPdf`, `setSearchQuery`, `setSelectedAssemblyPoint`, `setSelectedClassFilter`, `setVerifiedStudentIds`; DOM/window access
- **Edge Cases:** UNKNOWN (not individually reviewed)
- **Security Considerations:** Reads `innerHTML` (HTML sent to PDF/print path).
- **Current Limitations:** UNKNOWN (not individually reviewed)

### `toggleVerify` (nested in `EmergencyRosterModal`)
- **File:** `src/components/attendance/EmergencyRosterModal.tsx:95-102`  · **Review:** AUTO
- **Purpose:** UNKNOWN (no in-code description; not individually reviewed)
- **Parameters:** `id: string`
- **Returns:** `void` (inferred)
- **Dependencies:** none detected
- **Calls:** no in-repo callees resolved
- **Called By:** `EmergencyRosterModal` (src/components/attendance/EmergencyRosterModal.tsx:29)
- **Database Interaction:** None detected.
- **External Services:** None detected.
- **Authentication:** No authentication logic inside this function.
- **Authorization:** No role/permission check inside this function.
- **Validation:** None detected.
- **Errors:** None detected.
- **Side Effects:** React state: `setVerifiedStudentIds`
- **Edge Cases:** UNKNOWN (not individually reviewed)
- **Security Considerations:** None noted (not individually reviewed).
- **Current Limitations:** UNKNOWN (not individually reviewed)

### `handleExportVectorPdf` (nested in `EmergencyRosterModal`)
- **File:** `src/components/attendance/EmergencyRosterModal.tsx:104-122`  · **Review:** AUTO
- **Purpose:** UNKNOWN (no in-code description; not individually reviewed)
- **Parameters:** none
- **Returns:** `Promise<void>` (inferred)
- **Dependencies:** none detected
- **Calls:** `downloadNativePdfFromHtml` (src/utils/pdfExport.ts:66)
- **Called By:** no in-repo caller resolved (entry point, event handler, route, or referenced by value)
- **Database Interaction:** None detected.
- **External Services:** None detected.
- **Authentication:** No authentication logic inside this function.
- **Authorization:** No role/permission check inside this function.
- **Validation:** 1 guard/type/regex check(s) detected.
- **Errors:** None detected.
- **Side Effects:** React state: `setIsExportingPdf`; DOM/window access
- **Edge Cases:** UNKNOWN (not individually reviewed)
- **Security Considerations:** Reads `innerHTML` (HTML sent to PDF/print path).
- **Current Limitations:** UNKNOWN (not individually reviewed)

### `handlePrintDirect` (nested in `EmergencyRosterModal`)
- **File:** `src/components/attendance/EmergencyRosterModal.tsx:124-135`  · **Review:** AUTO
- **Purpose:** UNKNOWN (no in-code description; not individually reviewed)
- **Parameters:** none
- **Returns:** `void` (inferred)
- **Dependencies:** none detected
- **Calls:** `printNativePdfFromHtml` (src/utils/pdfExport.ts:104)
- **Called By:** no in-repo caller resolved (entry point, event handler, route, or referenced by value)
- **Database Interaction:** None detected.
- **External Services:** None detected.
- **Authentication:** No authentication logic inside this function.
- **Authorization:** No role/permission check inside this function.
- **Validation:** None detected.
- **Errors:** None detected.
- **Side Effects:** DOM/window access
- **Edge Cases:** UNKNOWN (not individually reviewed)
- **Security Considerations:** Reads `innerHTML` (HTML sent to PDF/print path).
- **Current Limitations:** UNKNOWN (not individually reviewed)


## src/components/attendance/GamifiedCelebrationModal.tsx

### `GamifiedCelebrationModal`
- **File:** `src/components/attendance/GamifiedCelebrationModal.tsx:16-120`  · **Review:** AUTO
- **Purpose:** UNKNOWN (no in-code description; not individually reviewed)
- **Parameters:** `{ isOpen, onClose, classNameTitle, attendanceRate, totalPresent, totalStudents, lang, }`
- **Returns:** `Element` (inferred)
- **Dependencies:** none detected
- **Calls:** `useModalAccessibility` (src/hooks/useModalAccessibility.ts:17)
- **Called By:** no in-repo caller resolved (entry point, event handler, route, or referenced by value)
- **Database Interaction:** None detected.
- **External Services:** None detected.
- **Authentication:** No authentication logic inside this function.
- **Authorization:** No role/permission check inside this function.
- **Validation:** 2 guard/type/regex check(s) detected.
- **Errors:** None detected.
- **Side Effects:** React state: `setActiveParticles`, `setTimeout`; DOM/window access
- **Edge Cases:** UNKNOWN (not individually reviewed)
- **Security Considerations:** None noted (not individually reviewed).
- **Current Limitations:** UNKNOWN (not individually reviewed)


## src/components/attendance/StudentBehaviourModal.tsx

### `StudentBehaviourModal`
- **File:** `src/components/attendance/StudentBehaviourModal.tsx:31-396`  · **Review:** AUTO
- **Purpose:** UNKNOWN (no in-code description; not individually reviewed)
- **Parameters:** `{ isOpen, onClose, student, incidents, onAddIncident, lang, currentUserRole, currentUserName, }`
- **Returns:** `ReactPortal` (inferred)
- **Dependencies:** none detected
- **Calls:** `useModalAccessibility` (src/hooks/useModalAccessibility.ts:17)
- **Called By:** no in-repo caller resolved (entry point, event handler, route, or referenced by value)
- **Database Interaction:** None detected.
- **External Services:** None detected.
- **Authentication:** Uses `firebaseUser`/token
- **Authorization:** No role/permission check inside this function.
- **Validation:** 2 guard/type/regex check(s) detected.
- **Errors:** None detected.
- **Side Effects:** React state: `setActionTaken`, `setActiveTab`, `setCategory`, `setDescription`, `setFilterType`, `setGuardianNotified`, `setPoints`, `setSuccessToast` …; DOM/window access
- **Edge Cases:** UNKNOWN (not individually reviewed)
- **Security Considerations:** None noted (not individually reviewed).
- **Current Limitations:** UNKNOWN (not individually reviewed)

### `handleSubmit` (nested in `StudentBehaviourModal`)
- **File:** `src/components/attendance/StudentBehaviourModal.tsx:68-97`  · **Review:** AUTO
- **Purpose:** UNKNOWN (no in-code description; not individually reviewed)
- **Parameters:** `e: React.FormEvent`
- **Returns:** `void` (inferred)
- **Dependencies:** none detected
- **Calls:** no in-repo callees resolved
- **Called By:** no in-repo caller resolved (entry point, event handler, route, or referenced by value)
- **Database Interaction:** None detected.
- **External Services:** None detected.
- **Authentication:** Uses `firebaseUser`/token
- **Authorization:** No role/permission check inside this function.
- **Validation:** 1 guard/type/regex check(s) detected.
- **Errors:** None detected.
- **Side Effects:** React state: `setActionTaken`, `setActiveTab`, `setDescription`, `setSuccessToast`, `setTimeout`, `setTitle`
- **Edge Cases:** UNKNOWN (not individually reviewed)
- **Security Considerations:** None noted (not individually reviewed).
- **Current Limitations:** UNKNOWN (not individually reviewed)


## src/components/communications/CommunicationsView.tsx

### `CommunicationsView`
- **File:** `src/components/communications/CommunicationsView.tsx:19-106`  · **Review:** AUTO
- **Purpose:** UNKNOWN (no in-code description; not individually reviewed)
- **Parameters:** `{ initialTab = 'justifications', }`
- **Returns:** `Element` (inferred)
- **Dependencies:** admin
- **Calls:** `useAttendance` (src/context/AttendanceContext.tsx:3733)
- **Called By:** no in-repo caller resolved (entry point, event handler, route, or referenced by value)
- **Database Interaction:** None detected.
- **External Services:** None detected.
- **Authentication:** Uses `firebaseUser`/token
- **Authorization:** References: `canManageOutbox`
- **Validation:** None detected.
- **Errors:** None detected.
- **Side Effects:** React state: `setActiveTab`
- **Edge Cases:** UNKNOWN (not individually reviewed)
- **Security Considerations:** None noted (not individually reviewed).
- **Current Limitations:** UNKNOWN (not individually reviewed)


## src/components/dashboard/ExecutiveMorningBriefingCard.tsx

### `ExecutiveMorningBriefingCard`
- **File:** `src/components/dashboard/ExecutiveMorningBriefingCard.tsx:24-303`  · **Review:** AUTO
- **Purpose:** UNKNOWN (no in-code description; not individually reviewed)
- **Parameters:** `{ onNavigateTab, }`
- **Returns:** `Element` (inferred)
- **Dependencies:** none detected
- **Calls:** `useAttendance` (src/context/AttendanceContext.tsx:3733), `loadDigest` (src/components/dashboard/ExecutiveMorningBriefingCard.tsx:47)
- **Called By:** no in-repo caller resolved (entry point, event handler, route, or referenced by value)
- **Database Interaction:** None detected.
- **External Services:** None detected.
- **Authentication:** No authentication logic inside this function.
- **Authorization:** No role/permission check inside this function.
- **Validation:** 1 guard/type/regex check(s) detected.
- **Errors:** 2 try/catch
- **Side Effects:** React state: `setCurrentDigest`, `setDispatching`, `setHasRequested`, `setIsSettingsOpen`, `setLoading`, `setTimeout`, `setToastMsg`; console output
- **Edge Cases:** UNKNOWN (not individually reviewed)
- **Security Considerations:** Uses `any` typing.
- **Current Limitations:** UNKNOWN (not individually reviewed)

### `loadDigest` (nested in `ExecutiveMorningBriefingCard`)
- **File:** `src/components/dashboard/ExecutiveMorningBriefingCard.tsx:47-57`  · **Review:** AUTO
- **Purpose:** UNKNOWN (no in-code description; not individually reviewed)
- **Parameters:** none
- **Returns:** `Promise<void>` (inferred)
- **Dependencies:** none detected
- **Calls:** no in-repo callees resolved
- **Called By:** `ExecutiveMorningBriefingCard` (src/components/dashboard/ExecutiveMorningBriefingCard.tsx:24)
- **Database Interaction:** None detected.
- **External Services:** None detected.
- **Authentication:** No authentication logic inside this function.
- **Authorization:** No role/permission check inside this function.
- **Validation:** None detected.
- **Errors:** 1 try/catch
- **Side Effects:** React state: `setCurrentDigest`, `setLoading`; console output
- **Edge Cases:** UNKNOWN (not individually reviewed)
- **Security Considerations:** None noted (not individually reviewed).
- **Current Limitations:** UNKNOWN (not individually reviewed)

### `handleSendNow` (nested in `ExecutiveMorningBriefingCard`)
- **File:** `src/components/dashboard/ExecutiveMorningBriefingCard.tsx:59-75`  · **Review:** AUTO
- **Purpose:** UNKNOWN (no in-code description; not individually reviewed)
- **Parameters:** none
- **Returns:** `Promise<void>` (inferred)
- **Dependencies:** none detected
- **Calls:** no in-repo callees resolved
- **Called By:** no in-repo caller resolved (entry point, event handler, route, or referenced by value)
- **Database Interaction:** None detected.
- **External Services:** None detected.
- **Authentication:** No authentication logic inside this function.
- **Authorization:** No role/permission check inside this function.
- **Validation:** None detected.
- **Errors:** 1 try/catch
- **Side Effects:** React state: `setCurrentDigest`, `setDispatching`, `setTimeout`, `setToastMsg`; console output
- **Edge Cases:** UNKNOWN (not individually reviewed)
- **Security Considerations:** Uses `any` typing.
- **Current Limitations:** UNKNOWN (not individually reviewed)


## src/components/digest/DigestEmailPreviewTab.tsx

### `DigestEmailPreviewTab`
- **File:** `src/components/digest/DigestEmailPreviewTab.tsx:24-166`  · **Review:** AUTO
- **Purpose:** UNKNOWN (no in-code description; not individually reviewed)
- **Parameters:** `{ currentDigest, digestConfig, dispatching, previewDevice, copiedHtml, onSetPreviewDevice, onCopyHtml, onSendDigestNow, lang, }`
- **Returns:** `Element` (inferred)
- **Dependencies:** none detected
- **Calls:** no in-repo callees resolved
- **Called By:** no in-repo caller resolved (entry point, event handler, route, or referenced by value)
- **Database Interaction:** None detected.
- **External Services:** None detected.
- **Authentication:** No authentication logic inside this function.
- **Authorization:** No role/permission check inside this function.
- **Validation:** None detected.
- **Errors:** None detected.
- **Side Effects:** None detected.
- **Edge Cases:** UNKNOWN (not individually reviewed)
- **Security Considerations:** None noted (not individually reviewed).
- **Current Limitations:** UNKNOWN (not individually reviewed)


## src/components/digest/DigestHistoryTab.tsx

### `DigestHistoryTab`
- **File:** `src/components/digest/DigestHistoryTab.tsx:13-177`  · **Review:** AUTO
- **Purpose:** UNKNOWN (no in-code description; not individually reviewed)
- **Parameters:** `{ digestHistory, selectedHistoryItem, onSelectHistoryItem, lang, }`
- **Returns:** `Element` (inferred)
- **Dependencies:** none detected
- **Calls:** no in-repo callees resolved
- **Called By:** no in-repo caller resolved (entry point, event handler, route, or referenced by value)
- **Database Interaction:** None detected.
- **External Services:** None detected.
- **Authentication:** No authentication logic inside this function.
- **Authorization:** No role/permission check inside this function.
- **Validation:** None detected.
- **Errors:** None detected.
- **Side Effects:** None detected.
- **Edge Cases:** UNKNOWN (not individually reviewed)
- **Security Considerations:** None noted (not individually reviewed).
- **Current Limitations:** UNKNOWN (not individually reviewed)


## src/components/digest/DigestOverviewTab.tsx

### `DigestOverviewTab`
- **File:** `src/components/digest/DigestOverviewTab.tsx:26-574`  · **Review:** AUTO
- **Purpose:** UNKNOWN (no in-code description; not individually reviewed)
- **Parameters:** `{ currentDigest, loading, currentTenant, lang, onNavigateToTab, }`
- **Returns:** `Element` (inferred)
- **Dependencies:** none detected
- **Calls:** no in-repo callees resolved
- **Called By:** no in-repo caller resolved (entry point, event handler, route, or referenced by value)
- **Database Interaction:** None detected.
- **External Services:** None detected.
- **Authentication:** No authentication logic inside this function.
- **Authorization:** No role/permission check inside this function.
- **Validation:** 1 guard/type/regex check(s) detected.
- **Errors:** None detected.
- **Side Effects:** None detected.
- **Edge Cases:** UNKNOWN (not individually reviewed)
- **Security Considerations:** None noted (not individually reviewed).
- **Current Limitations:** UNKNOWN (not individually reviewed)


## src/components/digest/DigestSchedulerSettingsTab.tsx

### `DigestSchedulerSettingsTab`
- **File:** `src/components/digest/DigestSchedulerSettingsTab.tsx:16-307`  · **Review:** AUTO
- **Purpose:** UNKNOWN (no in-code description; not individually reviewed)
- **Parameters:** `{ formConfig, newRecipientEmail, onFormConfigChange, onNewRecipientEmailChange, onAddRecipient, onRemoveRecipient, onSaveSettings, lang, }`
- **Returns:** `Element` (inferred)
- **Dependencies:** none detected
- **Calls:** no in-repo callees resolved
- **Called By:** no in-repo caller resolved (entry point, event handler, route, or referenced by value)
- **Database Interaction:** None detected.
- **External Services:** None detected.
- **Authentication:** No authentication logic inside this function.
- **Authorization:** No role/permission check inside this function.
- **Validation:** None detected.
- **Errors:** None detected.
- **Side Effects:** None detected.
- **Edge Cases:** UNKNOWN (not individually reviewed)
- **Security Considerations:** None noted (not individually reviewed).
- **Current Limitations:** UNKNOWN (not individually reviewed)


## src/components/digest/DigestSettingsModal.tsx

### `DigestSettingsModal`
- **File:** `src/components/digest/DigestSettingsModal.tsx:13-229`  · **Review:** AUTO
- **Purpose:** UNKNOWN (no in-code description; not individually reviewed)
- **Parameters:** `{ isOpen, onClose }`
- **Returns:** `ReactPortal` (inferred)
- **Dependencies:** none detected
- **Calls:** `useAttendance` (src/context/AttendanceContext.tsx:3733), `useModalAccessibility` (src/hooks/useModalAccessibility.ts:17), `handleRemoveRecipient` (src/components/digest/DigestSettingsModal.tsx:38)
- **Called By:** no in-repo caller resolved (entry point, event handler, route, or referenced by value)
- **Database Interaction:** None detected.
- **External Services:** None detected.
- **Authentication:** No authentication logic inside this function.
- **Authorization:** No role/permission check inside this function.
- **Validation:** 2 guard/type/regex check(s) detected.
- **Errors:** None detected.
- **Side Effects:** React state: `setFormConfig`, `setNewRecipientEmail`, `setSuccessMsg`, `setTimeout`; DOM/window access
- **Edge Cases:** UNKNOWN (not individually reviewed)
- **Security Considerations:** None noted (not individually reviewed).
- **Current Limitations:** UNKNOWN (not individually reviewed)

### `handleAddRecipient` (nested in `DigestSettingsModal`)
- **File:** `src/components/digest/DigestSettingsModal.tsx:25-36`  · **Review:** AUTO
- **Purpose:** UNKNOWN (no in-code description; not individually reviewed)
- **Parameters:** `e: React.FormEvent`
- **Returns:** `void` (inferred)
- **Dependencies:** none detected
- **Calls:** no in-repo callees resolved
- **Called By:** no in-repo caller resolved (entry point, event handler, route, or referenced by value)
- **Database Interaction:** None detected.
- **External Services:** None detected.
- **Authentication:** No authentication logic inside this function.
- **Authorization:** No role/permission check inside this function.
- **Validation:** 1 guard/type/regex check(s) detected.
- **Errors:** None detected.
- **Side Effects:** React state: `setFormConfig`, `setNewRecipientEmail`
- **Edge Cases:** UNKNOWN (not individually reviewed)
- **Security Considerations:** None noted (not individually reviewed).
- **Current Limitations:** UNKNOWN (not individually reviewed)

### `handleRemoveRecipient` (nested in `DigestSettingsModal`)
- **File:** `src/components/digest/DigestSettingsModal.tsx:38-43`  · **Review:** AUTO
- **Purpose:** UNKNOWN (no in-code description; not individually reviewed)
- **Parameters:** `email: string`
- **Returns:** `void` (inferred)
- **Dependencies:** none detected
- **Calls:** no in-repo callees resolved
- **Called By:** `DigestSettingsModal` (src/components/digest/DigestSettingsModal.tsx:13)
- **Database Interaction:** None detected.
- **External Services:** None detected.
- **Authentication:** No authentication logic inside this function.
- **Authorization:** No role/permission check inside this function.
- **Validation:** None detected.
- **Errors:** None detected.
- **Side Effects:** React state: `setFormConfig`
- **Edge Cases:** UNKNOWN (not individually reviewed)
- **Security Considerations:** None noted (not individually reviewed).
- **Current Limitations:** UNKNOWN (not individually reviewed)

### `handleSave` (nested in `DigestSettingsModal`)
- **File:** `src/components/digest/DigestSettingsModal.tsx:45-53`  · **Review:** AUTO
- **Purpose:** UNKNOWN (no in-code description; not individually reviewed)
- **Parameters:** `e: React.FormEvent`
- **Returns:** `void` (inferred)
- **Dependencies:** none detected
- **Calls:** no in-repo callees resolved
- **Called By:** no in-repo caller resolved (entry point, event handler, route, or referenced by value)
- **Database Interaction:** None detected.
- **External Services:** None detected.
- **Authentication:** No authentication logic inside this function.
- **Authorization:** No role/permission check inside this function.
- **Validation:** None detected.
- **Errors:** None detected.
- **Side Effects:** React state: `setSuccessMsg`, `setTimeout`
- **Edge Cases:** UNKNOWN (not individually reviewed)
- **Security Considerations:** None noted (not individually reviewed).
- **Current Limitations:** UNKNOWN (not individually reviewed)


## src/components/digest/SandboxedEmailHtml.tsx

### `SandboxedEmailHtml`
- **File:** `src/components/digest/SandboxedEmailHtml.tsx:18-33`  · **Review:** REVIEWED
- **Purpose:** Renders digest HTML in an iframe with empty `sandbox` and `srcDoc`.
- **Parameters:** `{ html, title?, className?, minHeight? }`
- **Returns:** JSX
- **Dependencies:** none detected
- **Calls:** —
- **Called By:** no in-repo caller resolved (entry point, event handler, route, or referenced by value)
- **Database Interaction:** None.
- **External Services:** None.
- **Authentication:** N/A (pure helper).
- **Authorization:** N/A.
- **Validation:** None.
- **Errors:** None thrown.
- **Side Effects:** None (pure).
- **Edge Cases:** —
- **Security Considerations:** Empty sandbox disables scripts, forms, same-origin: positive control against stored XSS.
- **Current Limitations:** —


## src/components/justifications/JustificationReviewModal.tsx

### `JustificationReviewModal`
- **File:** `src/components/justifications/JustificationReviewModal.tsx:34-485`  · **Review:** AUTO
- **Purpose:** UNKNOWN (no in-code description; not individually reviewed)
- **Parameters:** `{ justification, isParent, canReviewJustifications, currentUserRole, lang, reviewerNotes, setReviewerNotes, isReanalyzing, reanalysisError, onClose, onReanalyze`
- **Returns:** `Element` (inferred)
- **Dependencies:** none detected
- **Calls:** `useModalAccessibility` (src/hooks/useModalAccessibility.ts:17)
- **Called By:** no in-repo caller resolved (entry point, event handler, route, or referenced by value)
- **Database Interaction:** None detected.
- **External Services:** None detected.
- **Authentication:** Uses `firebaseUser`/token
- **Authorization:** References: `canReviewJustifications`, `currentUserRole`
- **Validation:** None detected.
- **Errors:** None detected.
- **Side Effects:** React state: `setReviewerNotes`
- **Edge Cases:** UNKNOWN (not individually reviewed)
- **Security Considerations:** None noted (not individually reviewed).
- **Current Limitations:** UNKNOWN (not individually reviewed)


## src/components/justifications/JustificationSubmitForm.tsx

### `JustificationSubmitForm`
- **File:** `src/components/justifications/JustificationSubmitForm.tsx:45-526`  · **Review:** AUTO
- **Purpose:** UNKNOWN (no in-code description; not individually reviewed)
- **Parameters:** `{ students, isParent, lang, selectedStudentId, setSelectedStudentId, absenceDate, setAbsenceDate, reasonType, setReasonType, guardianExplanation, setGuardianExp`
- **Returns:** `Element` (inferred)
- **Dependencies:** none detected
- **Calls:** `useAttendance` (src/context/AttendanceContext.tsx:3733)
- **Called By:** no in-repo caller resolved (entry point, event handler, route, or referenced by value)
- **Database Interaction:** None detected.
- **External Services:** None detected.
- **Authentication:** No authentication logic inside this function.
- **Authorization:** No role/permission check inside this function.
- **Validation:** 1 guard/type/regex check(s) detected.
- **Errors:** None detected.
- **Side Effects:** React state: `setAbsenceDate`, `setGuardianExplanation`, `setReasonType`, `setSelectedStudentId`
- **Edge Cases:** UNKNOWN (not individually reviewed)
- **Security Considerations:** Uses `any` typing.
- **Current Limitations:** UNKNOWN (not individually reviewed)


## src/components/justifications/JustificationsRosterTable.tsx

### `JustificationsRosterTable`
- **File:** `src/components/justifications/JustificationsRosterTable.tsx:28-303`  · **Review:** AUTO
- **Purpose:** UNKNOWN (no in-code description; not individually reviewed)
- **Parameters:** `{ justifications, isParent, lang, statusFilter, setStatusFilter, searchQuery, setSearchQuery, pendingCount, irregularCount, filteredJustifications, onInspect, }`
- **Returns:** `Element` (inferred)
- **Dependencies:** none detected
- **Calls:** no in-repo callees resolved
- **Called By:** no in-repo caller resolved (entry point, event handler, route, or referenced by value)
- **Database Interaction:** None detected.
- **External Services:** None detected.
- **Authentication:** No authentication logic inside this function.
- **Authorization:** No role/permission check inside this function.
- **Validation:** None detected.
- **Errors:** None detected.
- **Side Effects:** React state: `setSearchQuery`, `setStatusFilter`
- **Edge Cases:** UNKNOWN (not individually reviewed)
- **Security Considerations:** Uses `any` typing.
- **Current Limitations:** UNKNOWN (not individually reviewed)


## src/components/parent/ParentRecordDetailsModal.tsx

### `ParentRecordDetailsModal`
- **File:** `src/components/parent/ParentRecordDetailsModal.tsx:64-581`  · **Review:** AUTO
- **Purpose:** UNKNOWN (no in-code description; not individually reviewed)
- **Parameters:** `{ record, onClose, onOpenExcuseForm, studentId, }`
- **Returns:** `Element` (inferred)
- **Dependencies:** none detected
- **Calls:** `useModalAccessibility` (src/hooks/useModalAccessibility.ts:17)
- **Called By:** no in-repo caller resolved (entry point, event handler, route, or referenced by value)
- **Database Interaction:** None detected.
- **External Services:** None detected.
- **Authentication:** No authentication logic inside this function.
- **Authorization:** No role/permission check inside this function.
- **Validation:** 1 guard/type/regex check(s) detected.
- **Errors:** None detected.
- **Side Effects:** None detected.
- **Edge Cases:** UNKNOWN (not individually reviewed)
- **Security Considerations:** None noted (not individually reviewed).
- **Current Limitations:** UNKNOWN (not individually reviewed)


## src/components/parent/ParentRecordsTable.tsx

### `ParentRecordsTable`
- **File:** `src/components/parent/ParentRecordsTable.tsx:60-706`  · **Review:** AUTO
- **Purpose:** UNKNOWN (no in-code description; not individually reviewed)
- **Parameters:** `{ student, sessions, justifications, incidents, notifications, onOpenExcuseForm, academicYearBounds, }`
- **Returns:** `Element` (inferred)
- **Dependencies:** none detected
- **Calls:** `getArabicDayName` (src/components/parent/ParentRecordsTable.tsx:75)
- **Called By:** no in-repo caller resolved (entry point, event handler, route, or referenced by value)
- **Database Interaction:** None detected.
- **External Services:** None detected.
- **Authentication:** No authentication logic inside this function.
- **Authorization:** No role/permission check inside this function.
- **Validation:** None detected.
- **Errors:** 1 try/catch
- **Side Effects:** React state: `setActiveTab`, `setSearchQuery`, `setSelectedRecord`, `setStatusFilter`; DOM/window access
- **Edge Cases:** UNKNOWN (not individually reviewed)
- **Security Considerations:** Uses `any` typing.
- **Current Limitations:** UNKNOWN (not individually reviewed)

### `getArabicDayName` (nested in `ParentRecordsTable`)
- **File:** `src/components/parent/ParentRecordsTable.tsx:75-82`  · **Review:** AUTO
- **Purpose:** In-code comment: Helper: Arabic Day name from YYYY-MM-DD
- **Parameters:** `dateStr: string`
- **Returns:** `string` (declared)
- **Dependencies:** none detected
- **Calls:** no in-repo callees resolved
- **Called By:** `ParentRecordsTable` (src/components/parent/ParentRecordsTable.tsx:60)
- **Database Interaction:** None detected.
- **External Services:** None detected.
- **Authentication:** No authentication logic inside this function.
- **Authorization:** No role/permission check inside this function.
- **Validation:** None detected.
- **Errors:** 1 try/catch
- **Side Effects:** None detected.
- **Edge Cases:** UNKNOWN (not individually reviewed)
- **Security Considerations:** None noted (not individually reviewed).
- **Current Limitations:** UNKNOWN (not individually reviewed)

### `handlePrint` (nested in `ParentRecordsTable`)
- **File:** `src/components/parent/ParentRecordsTable.tsx:323-325`  · **Review:** AUTO
- **Purpose:** In-code comment: Print records handler
- **Parameters:** none
- **Returns:** `void` (inferred)
- **Dependencies:** none detected
- **Calls:** no in-repo callees resolved
- **Called By:** no in-repo caller resolved (entry point, event handler, route, or referenced by value)
- **Database Interaction:** None detected.
- **External Services:** None detected.
- **Authentication:** No authentication logic inside this function.
- **Authorization:** No role/permission check inside this function.
- **Validation:** None detected.
- **Errors:** None detected.
- **Side Effects:** DOM/window access
- **Edge Cases:** UNKNOWN (not individually reviewed)
- **Security Considerations:** None noted (not individually reviewed).
- **Current Limitations:** UNKNOWN (not individually reviewed)


## src/components/reports/AbsenceHeatmapCard.tsx

### `AbsenceHeatmapCard`
- **File:** `src/components/reports/AbsenceHeatmapCard.tsx:15-170`  · **Review:** AUTO
- **Purpose:** UNKNOWN (no in-code description; not individually reviewed)
- **Parameters:** none
- **Returns:** `Element` (inferred)
- **Dependencies:** none detected
- **Calls:** `useAttendance` (src/context/AttendanceContext.tsx:3733), `getColorClass` (src/components/reports/AbsenceHeatmapCard.tsx:66)
- **Called By:** no in-repo caller resolved (entry point, event handler, route, or referenced by value)
- **Database Interaction:** None detected.
- **External Services:** None detected.
- **Authentication:** No authentication logic inside this function.
- **Authorization:** No role/permission check inside this function.
- **Validation:** None detected.
- **Errors:** None detected.
- **Side Effects:** React state: `setSelectedClass`
- **Edge Cases:** UNKNOWN (not individually reviewed)
- **Security Considerations:** None noted (not individually reviewed).
- **Current Limitations:** UNKNOWN (not individually reviewed)

### `getColorClass` (nested in `AbsenceHeatmapCard`)
- **File:** `src/components/reports/AbsenceHeatmapCard.tsx:66-71`  · **Review:** AUTO
- **Purpose:** UNKNOWN (no in-code description; not individually reviewed)
- **Parameters:** `absentCount: number`
- **Returns:** `"bg-primary/10 text-primary border-primary/20 hover:bg-primary/20" | "bg-amber-100 text-amber-900 border-amber-200 hover:bg-amber-200" | "bg-orange-200 text-orange-950 border-orange-300 hover:bg-orange-300" | "bg-rose-500 text-white border-rose-600 font-bold hover:bg-rose-600"` (inferred)
- **Dependencies:** none detected
- **Calls:** no in-repo callees resolved
- **Called By:** `AbsenceHeatmapCard` (src/components/reports/AbsenceHeatmapCard.tsx:15)
- **Database Interaction:** None detected.
- **External Services:** None detected.
- **Authentication:** No authentication logic inside this function.
- **Authorization:** No role/permission check inside this function.
- **Validation:** None detected.
- **Errors:** None detected.
- **Side Effects:** None detected.
- **Edge Cases:** UNKNOWN (not individually reviewed)
- **Security Considerations:** None noted (not individually reviewed).
- **Current Limitations:** UNKNOWN (not individually reviewed)


## src/components/reports/BatchPrintCenterModal.tsx

### `BatchPrintCenterModal`
- **File:** `src/components/reports/BatchPrintCenterModal.tsx:15-232`  · **Review:** AUTO
- **Purpose:** UNKNOWN (no in-code description; not individually reviewed)
- **Parameters:** `{ isOpen, onClose, students }`
- **Returns:** `Element` (inferred)
- **Dependencies:** none detected
- **Calls:** `useAttendance` (src/context/AttendanceContext.tsx:3733), `useModalAccessibility` (src/hooks/useModalAccessibility.ts:17)
- **Called By:** no in-repo caller resolved (entry point, event handler, route, or referenced by value)
- **Database Interaction:** None detected.
- **External Services:** None detected.
- **Authentication:** No authentication logic inside this function.
- **Authorization:** No role/permission check inside this function.
- **Validation:** 4 guard/type/regex check(s) detected.
- **Errors:** None detected.
- **Side Effects:** React state: `setIsGeneratingPdf`, `setSelectedClass`, `setSelectedDocType`; DOM/window access
- **Edge Cases:** UNKNOWN (not individually reviewed)
- **Security Considerations:** Reads `innerHTML` (HTML sent to PDF/print path). Uses `any` typing.
- **Current Limitations:** UNKNOWN (not individually reviewed)

### `handleDownloadPdf` (nested in `BatchPrintCenterModal`)
- **File:** `src/components/reports/BatchPrintCenterModal.tsx:40-53`  · **Review:** AUTO
- **Purpose:** UNKNOWN (no in-code description; not individually reviewed)
- **Parameters:** none
- **Returns:** `Promise<void>` (inferred)
- **Dependencies:** none detected
- **Calls:** `downloadNativePdfFromHtml` (src/utils/pdfExport.ts:66)
- **Called By:** no in-repo caller resolved (entry point, event handler, route, or referenced by value)
- **Database Interaction:** None detected.
- **External Services:** None detected.
- **Authentication:** No authentication logic inside this function.
- **Authorization:** No role/permission check inside this function.
- **Validation:** 1 guard/type/regex check(s) detected.
- **Errors:** None detected.
- **Side Effects:** React state: `setIsGeneratingPdf`
- **Edge Cases:** UNKNOWN (not individually reviewed)
- **Security Considerations:** Reads `innerHTML` (HTML sent to PDF/print path).
- **Current Limitations:** UNKNOWN (not individually reviewed)

### `handlePrint` (nested in `BatchPrintCenterModal`)
- **File:** `src/components/reports/BatchPrintCenterModal.tsx:55-63`  · **Review:** AUTO
- **Purpose:** UNKNOWN (no in-code description; not individually reviewed)
- **Parameters:** none
- **Returns:** `void` (inferred)
- **Dependencies:** none detected
- **Calls:** `printNativePdfFromHtml` (src/utils/pdfExport.ts:104)
- **Called By:** no in-repo caller resolved (entry point, event handler, route, or referenced by value)
- **Database Interaction:** None detected.
- **External Services:** None detected.
- **Authentication:** No authentication logic inside this function.
- **Authorization:** No role/permission check inside this function.
- **Validation:** 1 guard/type/regex check(s) detected.
- **Errors:** None detected.
- **Side Effects:** None detected.
- **Edge Cases:** UNKNOWN (not individually reviewed)
- **Security Considerations:** Reads `innerHTML` (HTML sent to PDF/print path).
- **Current Limitations:** UNKNOWN (not individually reviewed)


## src/components/reports/StudentEngagementSection.tsx

### `StudentEngagementSection`
- **File:** `src/components/reports/StudentEngagementSection.tsx:22-243`  · **Review:** AUTO
- **Purpose:** UNKNOWN (no in-code description; not individually reviewed)
- **Parameters:** `{ students, lang }`
- **Returns:** `Element` (inferred)
- **Dependencies:** none detected
- **Calls:** `useAttendance` (src/context/AttendanceContext.tsx:3733)
- **Called By:** no in-repo caller resolved (entry point, event handler, route, or referenced by value)
- **Database Interaction:** None detected.
- **External Services:** None detected.
- **Authentication:** No authentication logic inside this function.
- **Authorization:** No role/permission check inside this function.
- **Validation:** None detected.
- **Errors:** None detected.
- **Side Effects:** React state: `setGradeFilter`
- **Edge Cases:** UNKNOWN (not individually reviewed)
- **Security Considerations:** None noted (not individually reviewed).
- **Current Limitations:** UNKNOWN (not individually reviewed)


## src/components/settings/AcademicCalendarTab.tsx

### `AcademicCalendarTab`
- **File:** `src/components/settings/AcademicCalendarTab.tsx:15-131`  · **Review:** AUTO
- **Purpose:** UNKNOWN (no in-code description; not individually reviewed)
- **Parameters:** `{ profile, onChange, onAutoSave, disabled }`
- **Returns:** `Element` (inferred)
- **Dependencies:** none detected
- **Calls:** `useAttendance` (src/context/AttendanceContext.tsx:3733), `handleYearChange` (src/components/settings/AcademicCalendarTab.tsx:19)
- **Called By:** no in-repo caller resolved (entry point, event handler, route, or referenced by value)
- **Database Interaction:** None detected.
- **External Services:** None detected.
- **Authentication:** No authentication logic inside this function.
- **Authorization:** No role/permission check inside this function.
- **Validation:** 2 guard/type/regex check(s) detected.
- **Errors:** None detected.
- **Side Effects:** None detected.
- **Edge Cases:** UNKNOWN (not individually reviewed)
- **Security Considerations:** None noted (not individually reviewed).
- **Current Limitations:** UNKNOWN (not individually reviewed)

### `handleYearChange` (nested in `AcademicCalendarTab`)
- **File:** `src/components/settings/AcademicCalendarTab.tsx:19-25`  · **Review:** AUTO
- **Purpose:** UNKNOWN (no in-code description; not individually reviewed)
- **Parameters:** `key: string`; `value: string`
- **Returns:** `void` (inferred)
- **Dependencies:** none detected
- **Calls:** no in-repo callees resolved
- **Called By:** `AcademicCalendarTab` (src/components/settings/AcademicCalendarTab.tsx:15)
- **Database Interaction:** None detected.
- **External Services:** None detected.
- **Authentication:** No authentication logic inside this function.
- **Authorization:** No role/permission check inside this function.
- **Validation:** None detected.
- **Errors:** None detected.
- **Side Effects:** None detected.
- **Edge Cases:** UNKNOWN (not individually reviewed)
- **Security Considerations:** None noted (not individually reviewed).
- **Current Limitations:** UNKNOWN (not individually reviewed)

### `handleYearBlur` (nested in `AcademicCalendarTab`)
- **File:** `src/components/settings/AcademicCalendarTab.tsx:27-31`  · **Review:** AUTO
- **Purpose:** UNKNOWN (no in-code description; not individually reviewed)
- **Parameters:** none
- **Returns:** `Promise<void>` (inferred)
- **Dependencies:** none detected
- **Calls:** no in-repo callees resolved
- **Called By:** no in-repo caller resolved (entry point, event handler, route, or referenced by value)
- **Database Interaction:** None detected.
- **External Services:** None detected.
- **Authentication:** No authentication logic inside this function.
- **Authorization:** No role/permission check inside this function.
- **Validation:** None detected.
- **Errors:** None detected.
- **Side Effects:** None detected.
- **Edge Cases:** UNKNOWN (not individually reviewed)
- **Security Considerations:** None noted (not individually reviewed).
- **Current Limitations:** UNKNOWN (not individually reviewed)

### `handleTermsChange` (nested in `AcademicCalendarTab`)
- **File:** `src/components/settings/AcademicCalendarTab.tsx:33-40`  · **Review:** AUTO
- **Purpose:** UNKNOWN (no in-code description; not individually reviewed)
- **Parameters:** `newTerms: typeof academicYear.terms`
- **Returns:** `void` (inferred)
- **Dependencies:** none detected
- **Calls:** no in-repo callees resolved
- **Called By:** no in-repo caller resolved (entry point, event handler, route, or referenced by value)
- **Database Interaction:** None detected.
- **External Services:** None detected.
- **Authentication:** No authentication logic inside this function.
- **Authorization:** No role/permission check inside this function.
- **Validation:** None detected.
- **Errors:** None detected.
- **Side Effects:** None detected.
- **Edge Cases:** UNKNOWN (not individually reviewed)
- **Security Considerations:** None noted (not individually reviewed).
- **Current Limitations:** UNKNOWN (not individually reviewed)

### `handleTermsAutoSave` (nested in `AcademicCalendarTab`)
- **File:** `src/components/settings/AcademicCalendarTab.tsx:42-51`  · **Review:** AUTO
- **Purpose:** UNKNOWN (no in-code description; not individually reviewed)
- **Parameters:** `newTerms: typeof academicYear.terms`
- **Returns:** `Promise<void>` (inferred)
- **Dependencies:** none detected
- **Calls:** no in-repo callees resolved
- **Called By:** no in-repo caller resolved (entry point, event handler, route, or referenced by value)
- **Database Interaction:** None detected.
- **External Services:** None detected.
- **Authentication:** No authentication logic inside this function.
- **Authorization:** No role/permission check inside this function.
- **Validation:** None detected.
- **Errors:** None detected.
- **Side Effects:** None detected.
- **Edge Cases:** UNKNOWN (not individually reviewed)
- **Security Considerations:** None noted (not individually reviewed).
- **Current Limitations:** UNKNOWN (not individually reviewed)


## src/components/settings/AcademicTermsCard.tsx

### `AcademicTermsCard`
- **File:** `src/components/settings/AcademicTermsCard.tsx:13-348`  · **Review:** AUTO
- **Purpose:** UNKNOWN (no in-code description; not individually reviewed)
- **Parameters:** `{ terms, onChange, onAutoSave, disabled }`
- **Returns:** `Element` (inferred)
- **Dependencies:** none detected
- **Calls:** `useAttendance` (src/context/AttendanceContext.tsx:3733), `handleSetActive` (src/components/settings/AcademicTermsCard.tsx:44), `saveEdit` (src/components/settings/AcademicTermsCard.tsx:71), `startEdit` (src/components/settings/AcademicTermsCard.tsx:63), `handleDelete` (src/components/settings/AcademicTermsCard.tsx:98)
- **Called By:** no in-repo caller resolved (entry point, event handler, route, or referenced by value)
- **Database Interaction:** None detected.
- **External Services:** None detected.
- **Authentication:** No authentication logic inside this function.
- **Authorization:** No role/permission check inside this function.
- **Validation:** 3 guard/type/regex check(s) detected.
- **Errors:** 1 try/catch
- **Side Effects:** React state: `setEditingId`, `setEndDateInput`, `setIsAdding`, `setIsSaving`, `setNameArInput`, `setNewEndDate`, `setNewNameAr`, `setNewStartDate` …
- **Edge Cases:** UNKNOWN (not individually reviewed)
- **Security Considerations:** None noted (not individually reviewed).
- **Current Limitations:** UNKNOWN (not individually reviewed)

### `triggerAutoSave` (nested in `AcademicTermsCard`)
- **File:** `src/components/settings/AcademicTermsCard.tsx:28-42`  · **Review:** AUTO
- **Purpose:** UNKNOWN (no in-code description; not individually reviewed)
- **Parameters:** `updatedTerms: AcademicTerm[]`; `msg?: string`
- **Returns:** `Promise<void>` (inferred)
- **Dependencies:** none detected
- **Calls:** no in-repo callees resolved
- **Called By:** `handleSetActive` (src/components/settings/AcademicTermsCard.tsx:44), `saveEdit` (src/components/settings/AcademicTermsCard.tsx:71), `handleDelete` (src/components/settings/AcademicTermsCard.tsx:98), `handleAddTerm` (src/components/settings/AcademicTermsCard.tsx:118)
- **Database Interaction:** None detected.
- **External Services:** None detected.
- **Authentication:** No authentication logic inside this function.
- **Authorization:** No role/permission check inside this function.
- **Validation:** None detected.
- **Errors:** 1 try/catch
- **Side Effects:** React state: `setIsSaving`, `setSaveFeedback`, `setTimeout`
- **Edge Cases:** UNKNOWN (not individually reviewed)
- **Security Considerations:** None noted (not individually reviewed).
- **Current Limitations:** UNKNOWN (not individually reviewed)

### `handleSetActive` (nested in `AcademicTermsCard`)
- **File:** `src/components/settings/AcademicTermsCard.tsx:44-61`  · **Review:** AUTO
- **Purpose:** UNKNOWN (no in-code description; not individually reviewed)
- **Parameters:** `termId: string`
- **Returns:** `Promise<void>` (inferred)
- **Dependencies:** none detected
- **Calls:** `triggerAutoSave` (src/components/settings/AcademicTermsCard.tsx:28)
- **Called By:** `AcademicTermsCard` (src/components/settings/AcademicTermsCard.tsx:13)
- **Database Interaction:** None detected.
- **External Services:** None detected.
- **Authentication:** No authentication logic inside this function.
- **Authorization:** No role/permission check inside this function.
- **Validation:** None detected.
- **Errors:** None detected.
- **Side Effects:** None detected.
- **Edge Cases:** UNKNOWN (not individually reviewed)
- **Security Considerations:** None noted (not individually reviewed).
- **Current Limitations:** UNKNOWN (not individually reviewed)

### `startEdit` (nested in `AcademicTermsCard`)
- **File:** `src/components/settings/AcademicTermsCard.tsx:63-69`  · **Review:** AUTO
- **Purpose:** UNKNOWN (no in-code description; not individually reviewed)
- **Parameters:** `term: AcademicTerm`; `e: React.MouseEvent`
- **Returns:** `void` (inferred)
- **Dependencies:** none detected
- **Calls:** no in-repo callees resolved
- **Called By:** `AcademicTermsCard` (src/components/settings/AcademicTermsCard.tsx:13)
- **Database Interaction:** None detected.
- **External Services:** None detected.
- **Authentication:** No authentication logic inside this function.
- **Authorization:** No role/permission check inside this function.
- **Validation:** None detected.
- **Errors:** None detected.
- **Side Effects:** React state: `setEditingId`, `setEndDateInput`, `setNameArInput`, `setStartDateInput`
- **Edge Cases:** UNKNOWN (not individually reviewed)
- **Security Considerations:** None noted (not individually reviewed).
- **Current Limitations:** UNKNOWN (not individually reviewed)

### `saveEdit` (nested in `AcademicTermsCard`)
- **File:** `src/components/settings/AcademicTermsCard.tsx:71-91`  · **Review:** AUTO
- **Purpose:** UNKNOWN (no in-code description; not individually reviewed)
- **Parameters:** `id: string`; `e?: React.MouseEvent | React.KeyboardEvent`
- **Returns:** `Promise<void>` (inferred)
- **Dependencies:** none detected
- **Calls:** `triggerAutoSave` (src/components/settings/AcademicTermsCard.tsx:28)
- **Called By:** `AcademicTermsCard` (src/components/settings/AcademicTermsCard.tsx:13)
- **Database Interaction:** None detected.
- **External Services:** None detected.
- **Authentication:** No authentication logic inside this function.
- **Authorization:** No role/permission check inside this function.
- **Validation:** 1 guard/type/regex check(s) detected.
- **Errors:** None detected.
- **Side Effects:** React state: `setEditingId`
- **Edge Cases:** UNKNOWN (not individually reviewed)
- **Security Considerations:** None noted (not individually reviewed).
- **Current Limitations:** UNKNOWN (not individually reviewed)

### `cancelEdit` (nested in `AcademicTermsCard`)
- **File:** `src/components/settings/AcademicTermsCard.tsx:93-96`  · **Review:** AUTO
- **Purpose:** UNKNOWN (no in-code description; not individually reviewed)
- **Parameters:** `e: React.MouseEvent`
- **Returns:** `void` (inferred)
- **Dependencies:** none detected
- **Calls:** no in-repo callees resolved
- **Called By:** no in-repo caller resolved (entry point, event handler, route, or referenced by value)
- **Database Interaction:** None detected.
- **External Services:** None detected.
- **Authentication:** No authentication logic inside this function.
- **Authorization:** No role/permission check inside this function.
- **Validation:** None detected.
- **Errors:** None detected.
- **Side Effects:** React state: `setEditingId`
- **Edge Cases:** UNKNOWN (not individually reviewed)
- **Security Considerations:** None noted (not individually reviewed).
- **Current Limitations:** UNKNOWN (not individually reviewed)

### `handleDelete` (nested in `AcademicTermsCard`)
- **File:** `src/components/settings/AcademicTermsCard.tsx:98-116`  · **Review:** AUTO
- **Purpose:** UNKNOWN (no in-code description; not individually reviewed)
- **Parameters:** `id: string`; `e: React.MouseEvent`
- **Returns:** `Promise<void>` (inferred)
- **Dependencies:** none detected
- **Calls:** `triggerAutoSave` (src/components/settings/AcademicTermsCard.tsx:28)
- **Called By:** `AcademicTermsCard` (src/components/settings/AcademicTermsCard.tsx:13)
- **Database Interaction:** None detected.
- **External Services:** None detected.
- **Authentication:** No authentication logic inside this function.
- **Authorization:** No role/permission check inside this function.
- **Validation:** 1 guard/type/regex check(s) detected.
- **Errors:** None detected.
- **Side Effects:** None detected.
- **Edge Cases:** UNKNOWN (not individually reviewed)
- **Security Considerations:** None noted (not individually reviewed).
- **Current Limitations:** UNKNOWN (not individually reviewed)

### `handleAddTerm` (nested in `AcademicTermsCard`)
- **File:** `src/components/settings/AcademicTermsCard.tsx:118-139`  · **Review:** AUTO
- **Purpose:** UNKNOWN (no in-code description; not individually reviewed)
- **Parameters:** none
- **Returns:** `Promise<void>` (inferred)
- **Dependencies:** none detected
- **Calls:** `triggerAutoSave` (src/components/settings/AcademicTermsCard.tsx:28)
- **Called By:** no in-repo caller resolved (entry point, event handler, route, or referenced by value)
- **Database Interaction:** None detected.
- **External Services:** None detected.
- **Authentication:** No authentication logic inside this function.
- **Authorization:** No role/permission check inside this function.
- **Validation:** 1 guard/type/regex check(s) detected.
- **Errors:** None detected.
- **Side Effects:** React state: `setIsAdding`, `setNewEndDate`, `setNewNameAr`, `setNewStartDate`
- **Edge Cases:** UNKNOWN (not individually reviewed)
- **Security Considerations:** None noted (not individually reviewed).
- **Current Limitations:** UNKNOWN (not individually reviewed)


## src/components/settings/ClassesManagementCard.tsx

### `ClassesManagementCard`
- **File:** `src/components/settings/ClassesManagementCard.tsx:14-365`  · **Review:** AUTO
- **Purpose:** UNKNOWN (no in-code description; not individually reviewed)
- **Parameters:** `{ classes, educationalGrades = [], onChange, onAutoSave, disabled, }`
- **Returns:** `Element` (inferred)
- **Dependencies:** none detected
- **Calls:** `useAttendance` (src/context/AttendanceContext.tsx:3733), `saveEdit` (src/components/settings/ClassesManagementCard.tsx:61), `startEdit` (src/components/settings/ClassesManagementCard.tsx:53), `handleDelete` (src/components/settings/ClassesManagementCard.tsx:82)
- **Called By:** no in-repo caller resolved (entry point, event handler, route, or referenced by value)
- **Database Interaction:** None detected.
- **External Services:** None detected.
- **Authentication:** No authentication logic inside this function.
- **Authorization:** No role/permission check inside this function.
- **Validation:** 2 guard/type/regex check(s) detected.
- **Errors:** 1 try/catch
- **Side Effects:** React state: `setCapacityInput`, `setEditingId`, `setFeedbackMsg`, `setGradeInput`, `setIsAdding`, `setIsSaving`, `setNameInput`, `setNewCapacity` …
- **Edge Cases:** UNKNOWN (not individually reviewed)
- **Security Considerations:** None noted (not individually reviewed).
- **Current Limitations:** UNKNOWN (not individually reviewed)

### `triggerAutoSave` (nested in `ClassesManagementCard`)
- **File:** `src/components/settings/ClassesManagementCard.tsx:37-51`  · **Review:** AUTO
- **Purpose:** UNKNOWN (no in-code description; not individually reviewed)
- **Parameters:** `updatedClasses: SchoolClassConfig[]`; `msg?: string`
- **Returns:** `Promise<void>` (inferred)
- **Dependencies:** none detected
- **Calls:** no in-repo callees resolved
- **Called By:** `saveEdit` (src/components/settings/ClassesManagementCard.tsx:61), `handleDelete` (src/components/settings/ClassesManagementCard.tsx:82), `handleAddClass` (src/components/settings/ClassesManagementCard.tsx:92)
- **Database Interaction:** None detected.
- **External Services:** None detected.
- **Authentication:** No authentication logic inside this function.
- **Authorization:** No role/permission check inside this function.
- **Validation:** None detected.
- **Errors:** 1 try/catch
- **Side Effects:** React state: `setFeedbackMsg`, `setIsSaving`, `setTimeout`
- **Edge Cases:** UNKNOWN (not individually reviewed)
- **Security Considerations:** None noted (not individually reviewed).
- **Current Limitations:** UNKNOWN (not individually reviewed)

### `startEdit` (nested in `ClassesManagementCard`)
- **File:** `src/components/settings/ClassesManagementCard.tsx:53-59`  · **Review:** AUTO
- **Purpose:** UNKNOWN (no in-code description; not individually reviewed)
- **Parameters:** `cls: SchoolClassConfig`
- **Returns:** `void` (inferred)
- **Dependencies:** none detected
- **Calls:** no in-repo callees resolved
- **Called By:** `ClassesManagementCard` (src/components/settings/ClassesManagementCard.tsx:14)
- **Database Interaction:** None detected.
- **External Services:** None detected.
- **Authentication:** No authentication logic inside this function.
- **Authorization:** No role/permission check inside this function.
- **Validation:** None detected.
- **Errors:** None detected.
- **Side Effects:** React state: `setCapacityInput`, `setEditingId`, `setGradeInput`, `setNameInput`, `setRoomInput`
- **Edge Cases:** UNKNOWN (not individually reviewed)
- **Security Considerations:** None noted (not individually reviewed).
- **Current Limitations:** UNKNOWN (not individually reviewed)

### `saveEdit` (nested in `ClassesManagementCard`)
- **File:** `src/components/settings/ClassesManagementCard.tsx:61-76`  · **Review:** AUTO
- **Purpose:** UNKNOWN (no in-code description; not individually reviewed)
- **Parameters:** `id: string`
- **Returns:** `Promise<void>` (inferred)
- **Dependencies:** none detected
- **Calls:** `triggerAutoSave` (src/components/settings/ClassesManagementCard.tsx:37)
- **Called By:** `ClassesManagementCard` (src/components/settings/ClassesManagementCard.tsx:14)
- **Database Interaction:** None detected.
- **External Services:** None detected.
- **Authentication:** No authentication logic inside this function.
- **Authorization:** No role/permission check inside this function.
- **Validation:** 1 guard/type/regex check(s) detected.
- **Errors:** None detected.
- **Side Effects:** React state: `setEditingId`
- **Edge Cases:** UNKNOWN (not individually reviewed)
- **Security Considerations:** None noted (not individually reviewed).
- **Current Limitations:** UNKNOWN (not individually reviewed)

### `cancelEdit` (nested in `ClassesManagementCard`)
- **File:** `src/components/settings/ClassesManagementCard.tsx:78-80`  · **Review:** AUTO
- **Purpose:** UNKNOWN (no in-code description; not individually reviewed)
- **Parameters:** none
- **Returns:** `void` (inferred)
- **Dependencies:** none detected
- **Calls:** no in-repo callees resolved
- **Called By:** no in-repo caller resolved (entry point, event handler, route, or referenced by value)
- **Database Interaction:** None detected.
- **External Services:** None detected.
- **Authentication:** No authentication logic inside this function.
- **Authorization:** No role/permission check inside this function.
- **Validation:** None detected.
- **Errors:** None detected.
- **Side Effects:** React state: `setEditingId`
- **Edge Cases:** UNKNOWN (not individually reviewed)
- **Security Considerations:** None noted (not individually reviewed).
- **Current Limitations:** UNKNOWN (not individually reviewed)

### `handleDelete` (nested in `ClassesManagementCard`)
- **File:** `src/components/settings/ClassesManagementCard.tsx:82-90`  · **Review:** AUTO
- **Purpose:** UNKNOWN (no in-code description; not individually reviewed)
- **Parameters:** `id: string`
- **Returns:** `Promise<void>` (inferred)
- **Dependencies:** none detected
- **Calls:** `triggerAutoSave` (src/components/settings/ClassesManagementCard.tsx:37)
- **Called By:** `ClassesManagementCard` (src/components/settings/ClassesManagementCard.tsx:14)
- **Database Interaction:** None detected.
- **External Services:** None detected.
- **Authentication:** No authentication logic inside this function.
- **Authorization:** No role/permission check inside this function.
- **Validation:** None detected.
- **Errors:** None detected.
- **Side Effects:** None detected.
- **Edge Cases:** UNKNOWN (not individually reviewed)
- **Security Considerations:** None noted (not individually reviewed).
- **Current Limitations:** UNKNOWN (not individually reviewed)

### `handleAddClass` (nested in `ClassesManagementCard`)
- **File:** `src/components/settings/ClassesManagementCard.tsx:92-106`  · **Review:** AUTO
- **Purpose:** UNKNOWN (no in-code description; not individually reviewed)
- **Parameters:** none
- **Returns:** `Promise<void>` (inferred)
- **Dependencies:** none detected
- **Calls:** `triggerAutoSave` (src/components/settings/ClassesManagementCard.tsx:37)
- **Called By:** no in-repo caller resolved (entry point, event handler, route, or referenced by value)
- **Database Interaction:** None detected.
- **External Services:** None detected.
- **Authentication:** No authentication logic inside this function.
- **Authorization:** No role/permission check inside this function.
- **Validation:** 1 guard/type/regex check(s) detected.
- **Errors:** None detected.
- **Side Effects:** React state: `setIsAdding`, `setNewName`, `setNewRoom`
- **Edge Cases:** UNKNOWN (not individually reviewed)
- **Security Considerations:** None noted (not individually reviewed).
- **Current Limitations:** UNKNOWN (not individually reviewed)


## src/components/settings/EmergencyPolicyTab.tsx

### `EmergencyPolicyTab`
- **File:** `src/components/settings/EmergencyPolicyTab.tsx:12-138`  · **Review:** AUTO
- **Purpose:** UNKNOWN (no in-code description; not individually reviewed)
- **Parameters:** `{ profile, onChange, disabled }`
- **Returns:** `Element` (inferred)
- **Dependencies:** none detected
- **Calls:** `useAttendance` (src/context/AttendanceContext.tsx:3733), `handlePointChange` (src/components/settings/EmergencyPolicyTab.tsx:16), `handleDeletePoint` (src/components/settings/EmergencyPolicyTab.tsx:37)
- **Called By:** no in-repo caller resolved (entry point, event handler, route, or referenced by value)
- **Database Interaction:** None detected.
- **External Services:** None detected.
- **Authentication:** No authentication logic inside this function.
- **Authorization:** No role/permission check inside this function.
- **Validation:** None detected.
- **Errors:** None detected.
- **Side Effects:** None detected.
- **Edge Cases:** UNKNOWN (not individually reviewed)
- **Security Considerations:** Uses `any` typing.
- **Current Limitations:** UNKNOWN (not individually reviewed)

### `handlePointChange` (nested in `EmergencyPolicyTab`)
- **File:** `src/components/settings/EmergencyPolicyTab.tsx:16-24`  · **Review:** AUTO
- **Purpose:** UNKNOWN (no in-code description; not individually reviewed)
- **Parameters:** `id: string`; `field: keyof AssemblyPointConfig`; `value: any`
- **Returns:** `void` (inferred)
- **Dependencies:** none detected
- **Calls:** no in-repo callees resolved
- **Called By:** `EmergencyPolicyTab` (src/components/settings/EmergencyPolicyTab.tsx:12)
- **Database Interaction:** None detected.
- **External Services:** None detected.
- **Authentication:** No authentication logic inside this function.
- **Authorization:** No role/permission check inside this function.
- **Validation:** None detected.
- **Errors:** None detected.
- **Side Effects:** None detected.
- **Edge Cases:** UNKNOWN (not individually reviewed)
- **Security Considerations:** Uses `any` typing.
- **Current Limitations:** UNKNOWN (not individually reviewed)

### `handleAddPoint` (nested in `EmergencyPolicyTab`)
- **File:** `src/components/settings/EmergencyPolicyTab.tsx:26-35`  · **Review:** AUTO
- **Purpose:** UNKNOWN (no in-code description; not individually reviewed)
- **Parameters:** none
- **Returns:** `void` (inferred)
- **Dependencies:** none detected
- **Calls:** no in-repo callees resolved
- **Called By:** no in-repo caller resolved (entry point, event handler, route, or referenced by value)
- **Database Interaction:** None detected.
- **External Services:** None detected.
- **Authentication:** No authentication logic inside this function.
- **Authorization:** No role/permission check inside this function.
- **Validation:** None detected.
- **Errors:** None detected.
- **Side Effects:** None detected.
- **Edge Cases:** UNKNOWN (not individually reviewed)
- **Security Considerations:** None noted (not individually reviewed).
- **Current Limitations:** UNKNOWN (not individually reviewed)

### `handleDeletePoint` (nested in `EmergencyPolicyTab`)
- **File:** `src/components/settings/EmergencyPolicyTab.tsx:37-39`  · **Review:** AUTO
- **Purpose:** UNKNOWN (no in-code description; not individually reviewed)
- **Parameters:** `id: string`
- **Returns:** `void` (inferred)
- **Dependencies:** none detected
- **Calls:** no in-repo callees resolved
- **Called By:** `EmergencyPolicyTab` (src/components/settings/EmergencyPolicyTab.tsx:12)
- **Database Interaction:** None detected.
- **External Services:** None detected.
- **Authentication:** No authentication logic inside this function.
- **Authorization:** No role/permission check inside this function.
- **Validation:** None detected.
- **Errors:** None detected.
- **Side Effects:** None detected.
- **Edge Cases:** UNKNOWN (not individually reviewed)
- **Security Considerations:** None noted (not individually reviewed).
- **Current Limitations:** UNKNOWN (not individually reviewed)


## src/components/settings/GradeLevelsCard.tsx

### `GradeLevelsCard`
- **File:** `src/components/settings/GradeLevelsCard.tsx:29-360`  · **Review:** AUTO
- **Purpose:** UNKNOWN (no in-code description; not individually reviewed)
- **Parameters:** `{ educationalGrades = [], classes = [], onChange, onAutoSave, disabled, }`
- **Returns:** `Element` (inferred)
- **Dependencies:** none detected
- **Calls:** `useAttendance` (src/context/AttendanceContext.tsx:3733), `handleAddGrade` (src/components/settings/GradeLevelsCard.tsx:64), `saveEdit` (src/components/settings/GradeLevelsCard.tsx:85), `cancelEdit` (src/components/settings/GradeLevelsCard.tsx:102), `startEdit` (src/components/settings/GradeLevelsCard.tsx:80), `handleDelete` (src/components/settings/GradeLevelsCard.tsx:106)
- **Called By:** no in-repo caller resolved (entry point, event handler, route, or referenced by value)
- **Database Interaction:** None detected.
- **External Services:** None detected.
- **Authentication:** No authentication logic inside this function.
- **Authorization:** No role/permission check inside this function.
- **Validation:** 3 guard/type/regex check(s) detected.
- **Errors:** 1 try/catch
- **Side Effects:** React state: `setEditNameInput`, `setEditingIndex`, `setErrorMsg`, `setFeedbackMsg`, `setIsAdding`, `setIsSaving`, `setNewGradeName`, `setTimeout`; DOM/window access
- **Edge Cases:** UNKNOWN (not individually reviewed)
- **Security Considerations:** None noted (not individually reviewed).
- **Current Limitations:** UNKNOWN (not individually reviewed)

### `triggerAutoSave` (nested in `GradeLevelsCard`)
- **File:** `src/components/settings/GradeLevelsCard.tsx:47-62`  · **Review:** AUTO
- **Purpose:** UNKNOWN (no in-code description; not individually reviewed)
- **Parameters:** `updatedGrades: string[]`; `msg?: string`
- **Returns:** `Promise<void>` (inferred)
- **Dependencies:** none detected
- **Calls:** no in-repo callees resolved
- **Called By:** `handleAddGrade` (src/components/settings/GradeLevelsCard.tsx:64), `saveEdit` (src/components/settings/GradeLevelsCard.tsx:85), `handleDelete` (src/components/settings/GradeLevelsCard.tsx:106)
- **Database Interaction:** None detected.
- **External Services:** None detected.
- **Authentication:** No authentication logic inside this function.
- **Authorization:** No role/permission check inside this function.
- **Validation:** None detected.
- **Errors:** 1 try/catch
- **Side Effects:** React state: `setErrorMsg`, `setFeedbackMsg`, `setIsSaving`, `setTimeout`
- **Edge Cases:** UNKNOWN (not individually reviewed)
- **Security Considerations:** None noted (not individually reviewed).
- **Current Limitations:** UNKNOWN (not individually reviewed)

### `handleAddGrade` (nested in `GradeLevelsCard`)
- **File:** `src/components/settings/GradeLevelsCard.tsx:64-78`  · **Review:** AUTO
- **Purpose:** UNKNOWN (no in-code description; not individually reviewed)
- **Parameters:** `gradeToAdd?: string`
- **Returns:** `Promise<void>` (inferred)
- **Dependencies:** none detected
- **Calls:** `triggerAutoSave` (src/components/settings/GradeLevelsCard.tsx:47)
- **Called By:** `GradeLevelsCard` (src/components/settings/GradeLevelsCard.tsx:29)
- **Database Interaction:** None detected.
- **External Services:** None detected.
- **Authentication:** No authentication logic inside this function.
- **Authorization:** No role/permission check inside this function.
- **Validation:** 1 guard/type/regex check(s) detected.
- **Errors:** None detected.
- **Side Effects:** React state: `setErrorMsg`, `setIsAdding`, `setNewGradeName`, `setTimeout`
- **Edge Cases:** UNKNOWN (not individually reviewed)
- **Security Considerations:** None noted (not individually reviewed).
- **Current Limitations:** UNKNOWN (not individually reviewed)

### `startEdit` (nested in `GradeLevelsCard`)
- **File:** `src/components/settings/GradeLevelsCard.tsx:80-83`  · **Review:** AUTO
- **Purpose:** UNKNOWN (no in-code description; not individually reviewed)
- **Parameters:** `index: number`; `currentName: string`
- **Returns:** `void` (inferred)
- **Dependencies:** none detected
- **Calls:** no in-repo callees resolved
- **Called By:** `GradeLevelsCard` (src/components/settings/GradeLevelsCard.tsx:29)
- **Database Interaction:** None detected.
- **External Services:** None detected.
- **Authentication:** No authentication logic inside this function.
- **Authorization:** No role/permission check inside this function.
- **Validation:** None detected.
- **Errors:** None detected.
- **Side Effects:** React state: `setEditNameInput`, `setEditingIndex`
- **Edge Cases:** UNKNOWN (not individually reviewed)
- **Security Considerations:** None noted (not individually reviewed).
- **Current Limitations:** UNKNOWN (not individually reviewed)

### `saveEdit` (nested in `GradeLevelsCard`)
- **File:** `src/components/settings/GradeLevelsCard.tsx:85-100`  · **Review:** AUTO
- **Purpose:** UNKNOWN (no in-code description; not individually reviewed)
- **Parameters:** `index: number`
- **Returns:** `Promise<void>` (inferred)
- **Dependencies:** none detected
- **Calls:** `triggerAutoSave` (src/components/settings/GradeLevelsCard.tsx:47)
- **Called By:** `GradeLevelsCard` (src/components/settings/GradeLevelsCard.tsx:29)
- **Database Interaction:** None detected.
- **External Services:** None detected.
- **Authentication:** No authentication logic inside this function.
- **Authorization:** No role/permission check inside this function.
- **Validation:** 1 guard/type/regex check(s) detected.
- **Errors:** None detected.
- **Side Effects:** React state: `setEditingIndex`, `setErrorMsg`, `setTimeout`
- **Edge Cases:** UNKNOWN (not individually reviewed)
- **Security Considerations:** None noted (not individually reviewed).
- **Current Limitations:** UNKNOWN (not individually reviewed)

### `cancelEdit` (nested in `GradeLevelsCard`)
- **File:** `src/components/settings/GradeLevelsCard.tsx:102-104`  · **Review:** AUTO
- **Purpose:** UNKNOWN (no in-code description; not individually reviewed)
- **Parameters:** none
- **Returns:** `void` (inferred)
- **Dependencies:** none detected
- **Calls:** no in-repo callees resolved
- **Called By:** `GradeLevelsCard` (src/components/settings/GradeLevelsCard.tsx:29)
- **Database Interaction:** None detected.
- **External Services:** None detected.
- **Authentication:** No authentication logic inside this function.
- **Authorization:** No role/permission check inside this function.
- **Validation:** None detected.
- **Errors:** None detected.
- **Side Effects:** React state: `setEditingIndex`
- **Edge Cases:** UNKNOWN (not individually reviewed)
- **Security Considerations:** None noted (not individually reviewed).
- **Current Limitations:** UNKNOWN (not individually reviewed)

### `handleDelete` (nested in `GradeLevelsCard`)
- **File:** `src/components/settings/GradeLevelsCard.tsx:106-122`  · **Review:** AUTO
- **Purpose:** UNKNOWN (no in-code description; not individually reviewed)
- **Parameters:** `gradeName: string`
- **Returns:** `Promise<void>` (inferred)
- **Dependencies:** none detected
- **Calls:** `triggerAutoSave` (src/components/settings/GradeLevelsCard.tsx:47)
- **Called By:** `GradeLevelsCard` (src/components/settings/GradeLevelsCard.tsx:29)
- **Database Interaction:** None detected.
- **External Services:** None detected.
- **Authentication:** No authentication logic inside this function.
- **Authorization:** No role/permission check inside this function.
- **Validation:** 1 guard/type/regex check(s) detected.
- **Errors:** None detected.
- **Side Effects:** DOM/window access
- **Edge Cases:** UNKNOWN (not individually reviewed)
- **Security Considerations:** None noted (not individually reviewed).
- **Current Limitations:** UNKNOWN (not individually reviewed)


## src/components/settings/GradesAndClassesTab.tsx

### `GradesAndClassesTab`
- **File:** `src/components/settings/GradesAndClassesTab.tsx:16-108`  · **Review:** AUTO
- **Purpose:** UNKNOWN (no in-code description; not individually reviewed)
- **Parameters:** `{ profile, onChange, onAutoSave, disabled, }`
- **Returns:** `Element` (inferred)
- **Dependencies:** none detected
- **Calls:** `useAttendance` (src/context/AttendanceContext.tsx:3733)
- **Called By:** no in-repo caller resolved (entry point, event handler, route, or referenced by value)
- **Database Interaction:** None detected.
- **External Services:** None detected.
- **Authentication:** No authentication logic inside this function.
- **Authorization:** No role/permission check inside this function.
- **Validation:** 4 guard/type/regex check(s) detected.
- **Errors:** None detected.
- **Side Effects:** None detected.
- **Edge Cases:** UNKNOWN (not individually reviewed)
- **Security Considerations:** None noted (not individually reviewed).
- **Current Limitations:** UNKNOWN (not individually reviewed)

### `handleGradesChange` (nested in `GradesAndClassesTab`)
- **File:** `src/components/settings/GradesAndClassesTab.tsx:27-29`  · **Review:** AUTO
- **Purpose:** UNKNOWN (no in-code description; not individually reviewed)
- **Parameters:** `newGrades: string[]`
- **Returns:** `void` (inferred)
- **Dependencies:** none detected
- **Calls:** no in-repo callees resolved
- **Called By:** no in-repo caller resolved (entry point, event handler, route, or referenced by value)
- **Database Interaction:** None detected.
- **External Services:** None detected.
- **Authentication:** No authentication logic inside this function.
- **Authorization:** No role/permission check inside this function.
- **Validation:** None detected.
- **Errors:** None detected.
- **Side Effects:** None detected.
- **Edge Cases:** UNKNOWN (not individually reviewed)
- **Security Considerations:** None noted (not individually reviewed).
- **Current Limitations:** UNKNOWN (not individually reviewed)

### `handleGradesAutoSave` (nested in `GradesAndClassesTab`)
- **File:** `src/components/settings/GradesAndClassesTab.tsx:31-36`  · **Review:** AUTO
- **Purpose:** UNKNOWN (no in-code description; not individually reviewed)
- **Parameters:** `newGrades: string[]`
- **Returns:** `Promise<void>` (inferred)
- **Dependencies:** none detected
- **Calls:** no in-repo callees resolved
- **Called By:** no in-repo caller resolved (entry point, event handler, route, or referenced by value)
- **Database Interaction:** None detected.
- **External Services:** None detected.
- **Authentication:** No authentication logic inside this function.
- **Authorization:** No role/permission check inside this function.
- **Validation:** None detected.
- **Errors:** None detected.
- **Side Effects:** None detected.
- **Edge Cases:** UNKNOWN (not individually reviewed)
- **Security Considerations:** None noted (not individually reviewed).
- **Current Limitations:** UNKNOWN (not individually reviewed)

### `handleClassesChange` (nested in `GradesAndClassesTab`)
- **File:** `src/components/settings/GradesAndClassesTab.tsx:38-40`  · **Review:** AUTO
- **Purpose:** UNKNOWN (no in-code description; not individually reviewed)
- **Parameters:** `newClasses: typeof classes`
- **Returns:** `void` (inferred)
- **Dependencies:** none detected
- **Calls:** no in-repo callees resolved
- **Called By:** no in-repo caller resolved (entry point, event handler, route, or referenced by value)
- **Database Interaction:** None detected.
- **External Services:** None detected.
- **Authentication:** No authentication logic inside this function.
- **Authorization:** No role/permission check inside this function.
- **Validation:** None detected.
- **Errors:** None detected.
- **Side Effects:** None detected.
- **Edge Cases:** UNKNOWN (not individually reviewed)
- **Security Considerations:** None noted (not individually reviewed).
- **Current Limitations:** UNKNOWN (not individually reviewed)

### `handleClassesAutoSave` (nested in `GradesAndClassesTab`)
- **File:** `src/components/settings/GradesAndClassesTab.tsx:42-47`  · **Review:** AUTO
- **Purpose:** UNKNOWN (no in-code description; not individually reviewed)
- **Parameters:** `newClasses: typeof classes`
- **Returns:** `Promise<void>` (inferred)
- **Dependencies:** none detected
- **Calls:** no in-repo callees resolved
- **Called By:** no in-repo caller resolved (entry point, event handler, route, or referenced by value)
- **Database Interaction:** None detected.
- **External Services:** None detected.
- **Authentication:** No authentication logic inside this function.
- **Authorization:** No role/permission check inside this function.
- **Validation:** None detected.
- **Errors:** None detected.
- **Side Effects:** None detected.
- **Edge Cases:** UNKNOWN (not individually reviewed)
- **Security Considerations:** None noted (not individually reviewed).
- **Current Limitations:** UNKNOWN (not individually reviewed)

### `handleSubjectsChange` (nested in `GradesAndClassesTab`)
- **File:** `src/components/settings/GradesAndClassesTab.tsx:49-51`  · **Review:** AUTO
- **Purpose:** UNKNOWN (no in-code description; not individually reviewed)
- **Parameters:** `newSubjects: typeof subjects`
- **Returns:** `void` (inferred)
- **Dependencies:** none detected
- **Calls:** no in-repo callees resolved
- **Called By:** no in-repo caller resolved (entry point, event handler, route, or referenced by value)
- **Database Interaction:** None detected.
- **External Services:** None detected.
- **Authentication:** No authentication logic inside this function.
- **Authorization:** No role/permission check inside this function.
- **Validation:** None detected.
- **Errors:** None detected.
- **Side Effects:** None detected.
- **Edge Cases:** UNKNOWN (not individually reviewed)
- **Security Considerations:** None noted (not individually reviewed).
- **Current Limitations:** UNKNOWN (not individually reviewed)

### `handleSubjectsAutoSave` (nested in `GradesAndClassesTab`)
- **File:** `src/components/settings/GradesAndClassesTab.tsx:53-58`  · **Review:** AUTO
- **Purpose:** UNKNOWN (no in-code description; not individually reviewed)
- **Parameters:** `newSubjects: typeof subjects`
- **Returns:** `Promise<void>` (inferred)
- **Dependencies:** none detected
- **Calls:** no in-repo callees resolved
- **Called By:** no in-repo caller resolved (entry point, event handler, route, or referenced by value)
- **Database Interaction:** None detected.
- **External Services:** None detected.
- **Authentication:** No authentication logic inside this function.
- **Authorization:** No role/permission check inside this function.
- **Validation:** None detected.
- **Errors:** None detected.
- **Side Effects:** None detected.
- **Edge Cases:** UNKNOWN (not individually reviewed)
- **Security Considerations:** None noted (not individually reviewed).
- **Current Limitations:** UNKNOWN (not individually reviewed)


## src/components/settings/HolidaysAndWeekendsCard.tsx

### `HolidaysAndWeekendsCard`
- **File:** `src/components/settings/HolidaysAndWeekendsCard.tsx:49-692`  · **Review:** AUTO
- **Purpose:** UNKNOWN (no in-code description; not individually reviewed)
- **Parameters:** `{ weekendDays = DEFAULT_WEEKEND_DAYS, officialHolidays = DEFAULT_OFFICIAL_HOLIDAYS, onChange, onAutoSave, disabled, country, isSuperAdmin, onUpdateMinistryHeade`
- **Returns:** `Element` (inferred)
- **Dependencies:** none detected
- **Calls:** `useAttendance` (src/context/AttendanceContext.tsx:3733), `getCountryPreset` (src/config/countryPresets.ts:685), `applyPreset` (src/components/settings/HolidaysAndWeekendsCard.tsx:134), `handleToggleWeekendDay` (src/components/settings/HolidaysAndWeekendsCard.tsx:108), `getDurationDays` (src/components/settings/HolidaysAndWeekendsCard.tsx:280), `getHolidayTypeLabel` (src/utils/holidayUtils.ts:255), `getHolidayDisplayName` (src/utils/holidayUtils.ts:245), `getHolidaySecondaryName` (src/utils/holidayUtils.ts:250), `handleDeleteHoliday` (src/components/settings/HolidaysAndWeekendsCard.tsx:204), `handleAddHoliday` (src/components/settings/HolidaysAndWeekendsCard.tsx:157)
- **Called By:** no in-repo caller resolved (entry point, event handler, route, or referenced by value)
- **Database Interaction:** None detected.
- **External Services:** None detected.
- **Authentication:** Uses `firebaseUser`/token
- **Authorization:** References: `isSuperAdmin`
- **Validation:** 2 guard/type/regex check(s) detected.
- **Errors:** 2 try/catch
- **Side Effects:** React state: `setFeedbackMsg`, `setFormError`, `setIsSaving`, `setNewHoliday`, `setShowAddModal`, `setShowOwnerSearchModal`, `setTimeout`
- **Edge Cases:** UNKNOWN (not individually reviewed)
- **Security Considerations:** Uses `any` typing.
- **Current Limitations:** UNKNOWN (not individually reviewed)

### `triggerAutoSave` (nested in `HolidaysAndWeekendsCard`)
- **File:** `src/components/settings/HolidaysAndWeekendsCard.tsx:88-105`  · **Review:** AUTO
- **Purpose:** UNKNOWN (no in-code description; not individually reviewed)
- **Parameters:** `updates: { weekendDays?: number[]; officialHolidays?: OfficialHoliday[] }`; `msg?: string`
- **Returns:** `Promise<void>` (inferred)
- **Dependencies:** none detected
- **Calls:** no in-repo callees resolved
- **Called By:** `handleToggleWeekendDay` (src/components/settings/HolidaysAndWeekendsCard.tsx:108), `applyPreset` (src/components/settings/HolidaysAndWeekendsCard.tsx:134), `handleAddHoliday` (src/components/settings/HolidaysAndWeekendsCard.tsx:157), `handleDeleteHoliday` (src/components/settings/HolidaysAndWeekendsCard.tsx:204), `handleRestoreMOECalendar` (src/components/settings/HolidaysAndWeekendsCard.tsx:223), `handleApplySmartHolidays` (src/components/settings/HolidaysAndWeekendsCard.tsx:250)
- **Database Interaction:** None detected.
- **External Services:** None detected.
- **Authentication:** No authentication logic inside this function.
- **Authorization:** No role/permission check inside this function.
- **Validation:** None detected.
- **Errors:** 1 try/catch
- **Side Effects:** React state: `setFeedbackMsg`, `setIsSaving`, `setTimeout`
- **Edge Cases:** UNKNOWN (not individually reviewed)
- **Security Considerations:** None noted (not individually reviewed).
- **Current Limitations:** UNKNOWN (not individually reviewed)

### `handleToggleWeekendDay` (nested in `HolidaysAndWeekendsCard`)
- **File:** `src/components/settings/HolidaysAndWeekendsCard.tsx:108-131`  · **Review:** AUTO
- **Purpose:** In-code comment: Toggle a weekend day
- **Parameters:** `dayIndex: number`
- **Returns:** `Promise<void>` (inferred)
- **Dependencies:** none detected
- **Calls:** `triggerAutoSave` (src/components/settings/HolidaysAndWeekendsCard.tsx:88)
- **Called By:** `HolidaysAndWeekendsCard` (src/components/settings/HolidaysAndWeekendsCard.tsx:49)
- **Database Interaction:** None detected.
- **External Services:** None detected.
- **Authentication:** No authentication logic inside this function.
- **Authorization:** No role/permission check inside this function.
- **Validation:** None detected.
- **Errors:** None detected.
- **Side Effects:** None detected.
- **Edge Cases:** UNKNOWN (not individually reviewed)
- **Security Considerations:** None noted (not individually reviewed).
- **Current Limitations:** UNKNOWN (not individually reviewed)

### `applyPreset` (nested in `HolidaysAndWeekendsCard`)
- **File:** `src/components/settings/HolidaysAndWeekendsCard.tsx:134-154`  · **Review:** AUTO
- **Purpose:** In-code comment: Presets
- **Parameters:** `preset: 'saudi' | 'intl' | 'fridayOnly'`
- **Returns:** `Promise<void>` (inferred)
- **Dependencies:** none detected
- **Calls:** `triggerAutoSave` (src/components/settings/HolidaysAndWeekendsCard.tsx:88)
- **Called By:** `HolidaysAndWeekendsCard` (src/components/settings/HolidaysAndWeekendsCard.tsx:49)
- **Database Interaction:** None detected.
- **External Services:** None detected.
- **Authentication:** No authentication logic inside this function.
- **Authorization:** No role/permission check inside this function.
- **Validation:** None detected.
- **Errors:** None detected.
- **Side Effects:** None detected.
- **Edge Cases:** UNKNOWN (not individually reviewed)
- **Security Considerations:** None noted (not individually reviewed).
- **Current Limitations:** UNKNOWN (not individually reviewed)

### `handleAddHoliday` (nested in `HolidaysAndWeekendsCard`)
- **File:** `src/components/settings/HolidaysAndWeekendsCard.tsx:157-201`  · **Review:** AUTO
- **Purpose:** In-code comment: Add new holiday
- **Parameters:** `e?: React.FormEvent`
- **Returns:** `Promise<void>` (inferred)
- **Dependencies:** none detected
- **Calls:** `triggerAutoSave` (src/components/settings/HolidaysAndWeekendsCard.tsx:88)
- **Called By:** `HolidaysAndWeekendsCard` (src/components/settings/HolidaysAndWeekendsCard.tsx:49)
- **Database Interaction:** None detected.
- **External Services:** None detected.
- **Authentication:** No authentication logic inside this function.
- **Authorization:** No role/permission check inside this function.
- **Validation:** 2 guard/type/regex check(s) detected.
- **Errors:** None detected.
- **Side Effects:** React state: `setFormError`, `setNewHoliday`, `setShowAddModal`
- **Edge Cases:** UNKNOWN (not individually reviewed)
- **Security Considerations:** None noted (not individually reviewed).
- **Current Limitations:** UNKNOWN (not individually reviewed)

### `handleDeleteHoliday` (nested in `HolidaysAndWeekendsCard`)
- **File:** `src/components/settings/HolidaysAndWeekendsCard.tsx:204-220`  · **Review:** AUTO
- **Purpose:** In-code comment: Delete holiday
- **Parameters:** `id: string`
- **Returns:** `Promise<void>` (inferred)
- **Dependencies:** none detected
- **Calls:** `triggerAutoSave` (src/components/settings/HolidaysAndWeekendsCard.tsx:88)
- **Called By:** `HolidaysAndWeekendsCard` (src/components/settings/HolidaysAndWeekendsCard.tsx:49)
- **Database Interaction:** None detected.
- **External Services:** None detected.
- **Authentication:** No authentication logic inside this function.
- **Authorization:** No role/permission check inside this function.
- **Validation:** None detected.
- **Errors:** None detected.
- **Side Effects:** None detected.
- **Edge Cases:** UNKNOWN (not individually reviewed)
- **Security Considerations:** None noted (not individually reviewed).
- **Current Limitations:** UNKNOWN (not individually reviewed)

### `handleRestoreMOECalendar` (nested in `HolidaysAndWeekendsCard`)
- **File:** `src/components/settings/HolidaysAndWeekendsCard.tsx:223-247`  · **Review:** AUTO
- **Purpose:** In-code comment: Reset to Official Calendar for Active Country
- **Parameters:** none
- **Returns:** `Promise<void>` (inferred)
- **Dependencies:** none detected
- **Calls:** `triggerAutoSave` (src/components/settings/HolidaysAndWeekendsCard.tsx:88)
- **Called By:** no in-repo caller resolved (entry point, event handler, route, or referenced by value)
- **Database Interaction:** None detected.
- **External Services:** None detected.
- **Authentication:** No authentication logic inside this function.
- **Authorization:** No role/permission check inside this function.
- **Validation:** None detected.
- **Errors:** None detected.
- **Side Effects:** None detected.
- **Edge Cases:** UNKNOWN (not individually reviewed)
- **Security Considerations:** None noted (not individually reviewed).
- **Current Limitations:** UNKNOWN (not individually reviewed)

### `handleApplySmartHolidays` (nested in `HolidaysAndWeekendsCard`)
- **File:** `src/components/settings/HolidaysAndWeekendsCard.tsx:250-277`  · **Review:** AUTO
- **Purpose:** In-code comment: Apply Smart Discovered Holidays from Owner Modal
- **Parameters:** `result: { officialHolidays: OfficialHoliday[]; weekendDays?: number[]; ministryHeaderAr?: string; }`
- **Returns:** `Promise<void>` (inferred)
- **Dependencies:** none detected
- **Calls:** `triggerAutoSave` (src/components/settings/HolidaysAndWeekendsCard.tsx:88)
- **Called By:** no in-repo caller resolved (entry point, event handler, route, or referenced by value)
- **Database Interaction:** None detected.
- **External Services:** None detected.
- **Authentication:** No authentication logic inside this function.
- **Authorization:** No role/permission check inside this function.
- **Validation:** None detected.
- **Errors:** None detected.
- **Side Effects:** None detected.
- **Edge Cases:** UNKNOWN (not individually reviewed)
- **Security Considerations:** None noted (not individually reviewed).
- **Current Limitations:** UNKNOWN (not individually reviewed)

### `getDurationDays` (nested in `HolidaysAndWeekendsCard`)
- **File:** `src/components/settings/HolidaysAndWeekendsCard.tsx:280-285`  · **Review:** AUTO
- **Purpose:** In-code comment: Calculate holiday duration in days
- **Parameters:** `start: string`; `end: string`
- **Returns:** `number` (inferred)
- **Dependencies:** none detected
- **Calls:** no in-repo callees resolved
- **Called By:** `HolidaysAndWeekendsCard` (src/components/settings/HolidaysAndWeekendsCard.tsx:49)
- **Database Interaction:** None detected.
- **External Services:** None detected.
- **Authentication:** No authentication logic inside this function.
- **Authorization:** No role/permission check inside this function.
- **Validation:** None detected.
- **Errors:** None detected.
- **Side Effects:** None detected.
- **Edge Cases:** UNKNOWN (not individually reviewed)
- **Security Considerations:** None noted (not individually reviewed).
- **Current Limitations:** UNKNOWN (not individually reviewed)


## src/components/settings/SchoolAIGeminiTab.tsx

### `SchoolAIGeminiTab`
- **File:** `src/components/settings/SchoolAIGeminiTab.tsx:34-472`  · **Review:** AUTO
- **Purpose:** UNKNOWN (no in-code description; not individually reviewed)
- **Parameters:** `{ tenantId, tenantName, canManageSettings, lang, }`
- **Returns:** `Element` (inferred)
- **Dependencies:** none detected
- **Calls:** `fetchConfig` (src/components/settings/SchoolAIGeminiTab.tsx:63)
- **Called By:** no in-repo caller resolved (entry point, event handler, route, or referenced by value)
- **Database Interaction:** None detected.
- **External Services:** HTTP /api/tenant/ai-config, HTTP /api/tenant/ai-config/test
- **Authentication:** Uses `firebaseUser`/token
- **Authorization:** References: `canManageSettings`
- **Validation:** 5 guard/type/regex check(s) detected.
- **Errors:** 4 try/catch, 1 throw
- **Side Effects:** React state: `setActionMessage`, `setConfig`, `setInputKey`, `setIsSaving`, `setIsTesting`, `setLoading`, `setPreferredModel`, `setShowKey` …; console output; DOM/window access
- **Edge Cases:** UNKNOWN (not individually reviewed)
- **Security Considerations:** Uses `any` typing.
- **Current Limitations:** UNKNOWN (not individually reviewed)

### `fetchConfig` (nested in `SchoolAIGeminiTab`)
- **File:** `src/components/settings/SchoolAIGeminiTab.tsx:63-80`  · **Review:** AUTO
- **Purpose:** In-code comment: Fetch current config on mount or tenant switch
- **Parameters:** none
- **Returns:** `Promise<void>` (inferred)
- **Dependencies:** none detected
- **Calls:** `authenticatedFetch` (src/lib/api.ts:46)
- **Called By:** `SchoolAIGeminiTab` (src/components/settings/SchoolAIGeminiTab.tsx:34)
- **Database Interaction:** None detected.
- **External Services:** HTTP /api/tenant/ai-config
- **Authentication:** Uses `firebaseUser`/token
- **Authorization:** No role/permission check inside this function.
- **Validation:** None detected.
- **Errors:** 1 try/catch
- **Side Effects:** React state: `setConfig`, `setLoading`, `setPreferredModel`, `setSystemHasFallback`; console output
- **Edge Cases:** UNKNOWN (not individually reviewed)
- **Security Considerations:** None noted (not individually reviewed).
- **Current Limitations:** UNKNOWN (not individually reviewed)

### `handleSaveKey` (nested in `SchoolAIGeminiTab`)
- **File:** `src/components/settings/SchoolAIGeminiTab.tsx:86-131`  · **Review:** AUTO
- **Purpose:** UNKNOWN (no in-code description; not individually reviewed)
- **Parameters:** `e: React.FormEvent`
- **Returns:** `Promise<void>` (inferred)
- **Dependencies:** none detected
- **Calls:** `authenticatedFetch` (src/lib/api.ts:46)
- **Called By:** no in-repo caller resolved (entry point, event handler, route, or referenced by value)
- **Database Interaction:** None detected.
- **External Services:** HTTP /api/tenant/ai-config
- **Authentication:** Uses `firebaseUser`/token
- **Authorization:** References: `canManageSettings`
- **Validation:** 3 guard/type/regex check(s) detected.
- **Errors:** 1 try/catch, 1 throw
- **Side Effects:** React state: `setActionMessage`, `setConfig`, `setInputKey`, `setIsSaving`, `setShowKey`, `setTestResult`
- **Edge Cases:** UNKNOWN (not individually reviewed)
- **Security Considerations:** Uses `any` typing.
- **Current Limitations:** UNKNOWN (not individually reviewed)

### `handleTestConnection` (nested in `SchoolAIGeminiTab`)
- **File:** `src/components/settings/SchoolAIGeminiTab.tsx:133-168`  · **Review:** AUTO
- **Purpose:** UNKNOWN (no in-code description; not individually reviewed)
- **Parameters:** none
- **Returns:** `Promise<void>` (inferred)
- **Dependencies:** none detected
- **Calls:** `authenticatedFetch` (src/lib/api.ts:46)
- **Called By:** no in-repo caller resolved (entry point, event handler, route, or referenced by value)
- **Database Interaction:** None detected.
- **External Services:** HTTP /api/tenant/ai-config/test
- **Authentication:** Uses `firebaseUser`/token
- **Authorization:** No role/permission check inside this function.
- **Validation:** None detected.
- **Errors:** 1 try/catch
- **Side Effects:** React state: `setActionMessage`, `setIsTesting`, `setTestResult`
- **Edge Cases:** UNKNOWN (not individually reviewed)
- **Security Considerations:** Uses `any` typing.
- **Current Limitations:** UNKNOWN (not individually reviewed)

### `handleDeleteKey` (nested in `SchoolAIGeminiTab`)
- **File:** `src/components/settings/SchoolAIGeminiTab.tsx:170-199`  · **Review:** AUTO
- **Purpose:** UNKNOWN (no in-code description; not individually reviewed)
- **Parameters:** none
- **Returns:** `Promise<void>` (inferred)
- **Dependencies:** none detected
- **Calls:** `authenticatedFetch` (src/lib/api.ts:46)
- **Called By:** no in-repo caller resolved (entry point, event handler, route, or referenced by value)
- **Database Interaction:** None detected.
- **External Services:** HTTP /api/tenant/ai-config
- **Authentication:** Uses `firebaseUser`/token
- **Authorization:** References: `canManageSettings`
- **Validation:** 2 guard/type/regex check(s) detected.
- **Errors:** 1 try/catch
- **Side Effects:** React state: `setActionMessage`, `setConfig`, `setIsSaving`, `setTestResult`; DOM/window access
- **Edge Cases:** UNKNOWN (not individually reviewed)
- **Security Considerations:** Uses `any` typing.
- **Current Limitations:** UNKNOWN (not individually reviewed)


## src/components/settings/SchoolContactTab.tsx

### `SchoolContactTab`
- **File:** `src/components/settings/SchoolContactTab.tsx:20-281`  · **Review:** AUTO
- **Purpose:** UNKNOWN (no in-code description; not individually reviewed)
- **Parameters:** `{ profile, onChange, disabled }`
- **Returns:** `Element` (inferred)
- **Dependencies:** none detected
- **Calls:** `useAttendance` (src/context/AttendanceContext.tsx:3733), `getCountryPreset` (src/config/countryPresets.ts:685), `getCallingCodeForCountry` (src/config/countryCodes.ts:338), `findCountryByName` (src/config/countryCodes.ts:293), `handleCountryChange` (src/components/settings/SchoolContactTab.tsx:33), `handleDialCodeChange` (src/components/settings/SchoolContactTab.tsx:47), `handleAddressChange` (src/components/settings/SchoolContactTab.tsx:58)
- **Called By:** no in-repo caller resolved (entry point, event handler, route, or referenced by value)
- **Database Interaction:** None detected.
- **External Services:** None detected.
- **Authentication:** No authentication logic inside this function.
- **Authorization:** No role/permission check inside this function.
- **Validation:** None detected.
- **Errors:** None detected.
- **Side Effects:** None detected.
- **Edge Cases:** UNKNOWN (not individually reviewed)
- **Security Considerations:** None noted (not individually reviewed).
- **Current Limitations:** UNKNOWN (not individually reviewed)

### `handleCountryChange` (nested in `SchoolContactTab`)
- **File:** `src/components/settings/SchoolContactTab.tsx:33-45`  · **Review:** AUTO
- **Purpose:** UNKNOWN (no in-code description; not individually reviewed)
- **Parameters:** `countryName: string`
- **Returns:** `void` (inferred)
- **Dependencies:** none detected
- **Calls:** `findCountryByName` (src/config/countryCodes.ts:293)
- **Called By:** `SchoolContactTab` (src/components/settings/SchoolContactTab.tsx:20)
- **Database Interaction:** None detected.
- **External Services:** None detected.
- **Authentication:** No authentication logic inside this function.
- **Authorization:** No role/permission check inside this function.
- **Validation:** None detected.
- **Errors:** None detected.
- **Side Effects:** None detected.
- **Edge Cases:** UNKNOWN (not individually reviewed)
- **Security Considerations:** None noted (not individually reviewed).
- **Current Limitations:** UNKNOWN (not individually reviewed)

### `handleDialCodeChange` (nested in `SchoolContactTab`)
- **File:** `src/components/settings/SchoolContactTab.tsx:47-56`  · **Review:** AUTO
- **Purpose:** UNKNOWN (no in-code description; not individually reviewed)
- **Parameters:** `rawCode: string`
- **Returns:** `void` (inferred)
- **Dependencies:** none detected
- **Calls:** no in-repo callees resolved
- **Called By:** `SchoolContactTab` (src/components/settings/SchoolContactTab.tsx:20)
- **Database Interaction:** None detected.
- **External Services:** None detected.
- **Authentication:** No authentication logic inside this function.
- **Authorization:** No role/permission check inside this function.
- **Validation:** None detected.
- **Errors:** None detected.
- **Side Effects:** None detected.
- **Edge Cases:** UNKNOWN (not individually reviewed)
- **Security Considerations:** None noted (not individually reviewed).
- **Current Limitations:** UNKNOWN (not individually reviewed)

### `handleAddressChange` (nested in `SchoolContactTab`)
- **File:** `src/components/settings/SchoolContactTab.tsx:58-65`  · **Review:** AUTO
- **Purpose:** UNKNOWN (no in-code description; not individually reviewed)
- **Parameters:** `key: string`; `value: string`
- **Returns:** `void` (inferred)
- **Dependencies:** none detected
- **Calls:** no in-repo callees resolved
- **Called By:** `SchoolContactTab` (src/components/settings/SchoolContactTab.tsx:20)
- **Database Interaction:** None detected.
- **External Services:** None detected.
- **Authentication:** No authentication logic inside this function.
- **Authorization:** No role/permission check inside this function.
- **Validation:** None detected.
- **Errors:** None detected.
- **Side Effects:** None detected.
- **Edge Cases:** UNKNOWN (not individually reviewed)
- **Security Considerations:** None noted (not individually reviewed).
- **Current Limitations:** UNKNOWN (not individually reviewed)


## src/components/settings/SchoolIdentityTab.tsx

### `SchoolIdentityTab`
- **File:** `src/components/settings/SchoolIdentityTab.tsx:13-146`  · **Review:** AUTO
- **Purpose:** UNKNOWN (no in-code description; not individually reviewed)
- **Parameters:** `{ profile, onChange, disabled }`
- **Returns:** `Element` (inferred)
- **Dependencies:** none detected
- **Calls:** `useAttendance` (src/context/AttendanceContext.tsx:3733), `getCountryPreset` (src/config/countryPresets.ts:685)
- **Called By:** no in-repo caller resolved (entry point, event handler, route, or referenced by value)
- **Database Interaction:** None detected.
- **External Services:** None detected.
- **Authentication:** No authentication logic inside this function.
- **Authorization:** No role/permission check inside this function.
- **Validation:** None detected.
- **Errors:** None detected.
- **Side Effects:** None detected.
- **Edge Cases:** UNKNOWN (not individually reviewed)
- **Security Considerations:** Uses `any` typing.
- **Current Limitations:** UNKNOWN (not individually reviewed)


## src/components/settings/SchoolLeadershipTab.tsx

### `SchoolLeadershipTab`
- **File:** `src/components/settings/SchoolLeadershipTab.tsx:12-199`  · **Review:** AUTO
- **Purpose:** UNKNOWN (no in-code description; not individually reviewed)
- **Parameters:** `{ profile, onChange, disabled }`
- **Returns:** `Element` (inferred)
- **Dependencies:** none detected
- **Calls:** `useAttendance` (src/context/AttendanceContext.tsx:3733), `handleLeadershipChange` (src/components/settings/SchoolLeadershipTab.tsx:17)
- **Called By:** no in-repo caller resolved (entry point, event handler, route, or referenced by value)
- **Database Interaction:** None detected.
- **External Services:** None detected.
- **Authentication:** No authentication logic inside this function.
- **Authorization:** No role/permission check inside this function.
- **Validation:** None detected.
- **Errors:** None detected.
- **Side Effects:** None detected.
- **Edge Cases:** UNKNOWN (not individually reviewed)
- **Security Considerations:** None noted (not individually reviewed).
- **Current Limitations:** UNKNOWN (not individually reviewed)

### `handleLeadershipChange` (nested in `SchoolLeadershipTab`)
- **File:** `src/components/settings/SchoolLeadershipTab.tsx:17-24`  · **Review:** AUTO
- **Purpose:** UNKNOWN (no in-code description; not individually reviewed)
- **Parameters:** `key: string`; `value: string`
- **Returns:** `void` (inferred)
- **Dependencies:** none detected
- **Calls:** no in-repo callees resolved
- **Called By:** `SchoolLeadershipTab` (src/components/settings/SchoolLeadershipTab.tsx:12)
- **Database Interaction:** None detected.
- **External Services:** None detected.
- **Authentication:** No authentication logic inside this function.
- **Authorization:** No role/permission check inside this function.
- **Validation:** None detected.
- **Errors:** None detected.
- **Side Effects:** None detected.
- **Edge Cases:** UNKNOWN (not individually reviewed)
- **Security Considerations:** None noted (not individually reviewed).
- **Current Limitations:** UNKNOWN (not individually reviewed)


## src/components/settings/SchoolMessagingGatewaysTab.tsx

### `SchoolMessagingGatewaysTab`
- **File:** `src/components/settings/SchoolMessagingGatewaysTab.tsx:42-739`  · **Review:** AUTO
- **Purpose:** UNKNOWN (no in-code description; not individually reviewed)
- **Parameters:** `{ gatewayConfig, onSave, isSuperAdmin, schoolName, defaultCallingCode = '+966', }`
- **Returns:** `Element` (inferred)
- **Dependencies:** none detected
- **Calls:** `useAttendance` (src/context/AttendanceContext.tsx:3733), `formatWhatsAppInternationalPhone` (src/utils/whatsappUtils.ts:15), `handleFieldChange` (src/components/settings/SchoolMessagingGatewaysTab.tsx:71)
- **Called By:** no in-repo caller resolved (entry point, event handler, route, or referenced by value)
- **Database Interaction:** None detected.
- **External Services:** None detected.
- **Authentication:** No authentication logic inside this function.
- **Authorization:** References: `isSuperAdmin`
- **Validation:** 2 guard/type/regex check(s) detected.
- **Errors:** None detected.
- **Side Effects:** React state: `setForm`, `setSaveStatus`, `setShowApiKey`, `setShowApiSecret`, `setShowEmailApiKey`, `setShowSmtpPass`, `setShowToken`, `setTestPhoneNumber` …
- **Edge Cases:** UNKNOWN (not individually reviewed)
- **Security Considerations:** None noted (not individually reviewed).
- **Current Limitations:** UNKNOWN (not individually reviewed)

### `handleFieldChange` (nested in `SchoolMessagingGatewaysTab`)
- **File:** `src/components/settings/SchoolMessagingGatewaysTab.tsx:71-80`  · **Review:** AUTO
- **Purpose:** UNKNOWN (no in-code description; not individually reviewed)
- **Parameters:** `field: K`; `value: SchoolMessagingGatewayConfig[K]`
- **Returns:** `void` (inferred)
- **Dependencies:** none detected
- **Calls:** no in-repo callees resolved
- **Called By:** `SchoolMessagingGatewaysTab` (src/components/settings/SchoolMessagingGatewaysTab.tsx:42)
- **Database Interaction:** None detected.
- **External Services:** None detected.
- **Authentication:** No authentication logic inside this function.
- **Authorization:** References: `isSuperAdmin`
- **Validation:** 1 guard/type/regex check(s) detected.
- **Errors:** None detected.
- **Side Effects:** React state: `setForm`
- **Edge Cases:** UNKNOWN (not individually reviewed)
- **Security Considerations:** None noted (not individually reviewed).
- **Current Limitations:** UNKNOWN (not individually reviewed)

### `handleSubmit` (nested in `SchoolMessagingGatewaysTab`)
- **File:** `src/components/settings/SchoolMessagingGatewaysTab.tsx:82-103`  · **Review:** AUTO
- **Purpose:** UNKNOWN (no in-code description; not individually reviewed)
- **Parameters:** `e: React.FormEvent`
- **Returns:** `void` (inferred)
- **Dependencies:** none detected
- **Calls:** no in-repo callees resolved
- **Called By:** no in-repo caller resolved (entry point, event handler, route, or referenced by value)
- **Database Interaction:** None detected.
- **External Services:** None detected.
- **Authentication:** No authentication logic inside this function.
- **Authorization:** References: `isSuperAdmin`
- **Validation:** 1 guard/type/regex check(s) detected.
- **Errors:** None detected.
- **Side Effects:** React state: `setSaveStatus`, `setTimeout`
- **Edge Cases:** UNKNOWN (not individually reviewed)
- **Security Considerations:** None noted (not individually reviewed).
- **Current Limitations:** UNKNOWN (not individually reviewed)

### `handleTestWhatsAppWeb` (nested in `SchoolMessagingGatewaysTab`)
- **File:** `src/components/settings/SchoolMessagingGatewaysTab.tsx:105-111`  · **Review:** AUTO
- **Purpose:** UNKNOWN (no in-code description; not individually reviewed)
- **Parameters:** none
- **Returns:** `void` (inferred)
- **Dependencies:** none detected
- **Calls:** `openWhatsAppDirect` (src/utils/whatsappUtils.ts:62)
- **Called By:** no in-repo caller resolved (entry point, event handler, route, or referenced by value)
- **Database Interaction:** None detected.
- **External Services:** None detected.
- **Authentication:** No authentication logic inside this function.
- **Authorization:** No role/permission check inside this function.
- **Validation:** None detected.
- **Errors:** None detected.
- **Side Effects:** None detected.
- **Edge Cases:** UNKNOWN (not individually reviewed)
- **Security Considerations:** None noted (not individually reviewed).
- **Current Limitations:** UNKNOWN (not individually reviewed)


## src/components/settings/SmartHolidayImportModal.tsx

### `SmartHolidayImportModal`
- **File:** `src/components/settings/SmartHolidayImportModal.tsx:38-519`  · **Review:** AUTO
- **Purpose:** UNKNOWN (no in-code description; not individually reviewed)
- **Parameters:** `{ isOpen, onClose, initialCountry = 'المملكة العربية السعودية', initialAcademicYear = '1446-1447 هـ (2026-2027 م)', onApplyHolidays, }`
- **Returns:** `Element` (inferred)
- **Dependencies:** none detected
- **Calls:** `useAttendance` (src/context/AttendanceContext.tsx:3733), `getCountryPreset` (src/config/countryPresets.ts:685), `useModalAccessibility` (src/hooks/useModalAccessibility.ts:17), `handlePerformSearch` (src/components/settings/SmartHolidayImportModal.tsx:88), `calculateDays` (src/components/settings/SmartHolidayImportModal.tsx:186), `handleToggleHoliday` (src/components/settings/SmartHolidayImportModal.tsx:148), `getHolidayDisplayName` (src/utils/holidayUtils.ts:245), `getHolidayTypeLabel` (src/utils/holidayUtils.ts:255), `getHolidaySecondaryName` (src/utils/holidayUtils.ts:250)
- **Called By:** no in-repo caller resolved (entry point, event handler, route, or referenced by value)
- **Database Interaction:** None detected.
- **External Services:** HTTP /api/owner/holidays/search
- **Authentication:** Uses `firebaseUser`/token
- **Authorization:** No role/permission check inside this function.
- **Validation:** 2 guard/type/regex check(s) detected.
- **Errors:** 2 try/catch
- **Side Effects:** React state: `setAcademicYear`, `setApplyHeader`, `setApplyWeekend`, `setCountry`, `setDiscoveredHolidays`, `setErrorMsg`, `setIsSearching`, `setIsSubmitting` …; console output
- **Edge Cases:** UNKNOWN (not individually reviewed)
- **Security Considerations:** Uses `any` typing.
- **Current Limitations:** UNKNOWN (not individually reviewed)

### `handlePerformSearch` (nested in `SmartHolidayImportModal`)
- **File:** `src/components/settings/SmartHolidayImportModal.tsx:88-146`  · **Review:** AUTO
- **Purpose:** In-code comment: Execute Search via Server Gemini Endpoint or verified preset fallback
- **Parameters:** `targetCountry: string = country`
- **Returns:** `Promise<void>` (inferred)
- **Dependencies:** none detected
- **Calls:** `authenticatedFetch` (src/lib/api.ts:46), `getCountryPreset` (src/config/countryPresets.ts:685)
- **Called By:** `SmartHolidayImportModal` (src/components/settings/SmartHolidayImportModal.tsx:38)
- **Database Interaction:** None detected.
- **External Services:** HTTP /api/owner/holidays/search
- **Authentication:** Uses `firebaseUser`/token
- **Authorization:** No role/permission check inside this function.
- **Validation:** 1 guard/type/regex check(s) detected.
- **Errors:** 1 try/catch
- **Side Effects:** React state: `setDiscoveredHolidays`, `setErrorMsg`, `setIsSearching`, `setOfficialSource`, `setRecommendedMinistryHeader`, `setRecommendedWeekendDays`, `setSearchSuccess`, `setSelectedHolidayIds` …; console output
- **Edge Cases:** UNKNOWN (not individually reviewed)
- **Security Considerations:** Uses `any` typing.
- **Current Limitations:** UNKNOWN (not individually reviewed)

### `handleToggleHoliday` (nested in `SmartHolidayImportModal`)
- **File:** `src/components/settings/SmartHolidayImportModal.tsx:148-154`  · **Review:** AUTO
- **Purpose:** UNKNOWN (no in-code description; not individually reviewed)
- **Parameters:** `id: string`
- **Returns:** `void` (inferred)
- **Dependencies:** none detected
- **Calls:** no in-repo callees resolved
- **Called By:** `SmartHolidayImportModal` (src/components/settings/SmartHolidayImportModal.tsx:38)
- **Database Interaction:** None detected.
- **External Services:** None detected.
- **Authentication:** No authentication logic inside this function.
- **Authorization:** No role/permission check inside this function.
- **Validation:** None detected.
- **Errors:** None detected.
- **Side Effects:** React state: `setSelectedHolidayIds`
- **Edge Cases:** UNKNOWN (not individually reviewed)
- **Security Considerations:** None noted (not individually reviewed).
- **Current Limitations:** UNKNOWN (not individually reviewed)

### `handleSelectAll` (nested in `SmartHolidayImportModal`)
- **File:** `src/components/settings/SmartHolidayImportModal.tsx:156-162`  · **Review:** AUTO
- **Purpose:** UNKNOWN (no in-code description; not individually reviewed)
- **Parameters:** none
- **Returns:** `void` (inferred)
- **Dependencies:** none detected
- **Calls:** no in-repo callees resolved
- **Called By:** no in-repo caller resolved (entry point, event handler, route, or referenced by value)
- **Database Interaction:** None detected.
- **External Services:** None detected.
- **Authentication:** No authentication logic inside this function.
- **Authorization:** No role/permission check inside this function.
- **Validation:** None detected.
- **Errors:** None detected.
- **Side Effects:** React state: `setSelectedHolidayIds`
- **Edge Cases:** UNKNOWN (not individually reviewed)
- **Security Considerations:** None noted (not individually reviewed).
- **Current Limitations:** UNKNOWN (not individually reviewed)

### `handleApply` (nested in `SmartHolidayImportModal`)
- **File:** `src/components/settings/SmartHolidayImportModal.tsx:164-184`  · **Review:** AUTO
- **Purpose:** UNKNOWN (no in-code description; not individually reviewed)
- **Parameters:** none
- **Returns:** `Promise<void>` (inferred)
- **Dependencies:** none detected
- **Calls:** no in-repo callees resolved
- **Called By:** no in-repo caller resolved (entry point, event handler, route, or referenced by value)
- **Database Interaction:** None detected.
- **External Services:** None detected.
- **Authentication:** No authentication logic inside this function.
- **Authorization:** No role/permission check inside this function.
- **Validation:** None detected.
- **Errors:** 1 try/catch
- **Side Effects:** React state: `setErrorMsg`, `setIsSubmitting`
- **Edge Cases:** UNKNOWN (not individually reviewed)
- **Security Considerations:** Uses `any` typing.
- **Current Limitations:** UNKNOWN (not individually reviewed)

### `calculateDays` (nested in `SmartHolidayImportModal`)
- **File:** `src/components/settings/SmartHolidayImportModal.tsx:186-191`  · **Review:** AUTO
- **Purpose:** UNKNOWN (no in-code description; not individually reviewed)
- **Parameters:** `start: string`; `end: string`
- **Returns:** `number` (inferred)
- **Dependencies:** none detected
- **Calls:** no in-repo callees resolved
- **Called By:** `SmartHolidayImportModal` (src/components/settings/SmartHolidayImportModal.tsx:38)
- **Database Interaction:** None detected.
- **External Services:** None detected.
- **Authentication:** No authentication logic inside this function.
- **Authorization:** No role/permission check inside this function.
- **Validation:** None detected.
- **Errors:** None detected.
- **Side Effects:** None detected.
- **Edge Cases:** UNKNOWN (not individually reviewed)
- **Security Considerations:** None noted (not individually reviewed).
- **Current Limitations:** UNKNOWN (not individually reviewed)


## src/components/settings/SubjectsManagementCard.tsx

### `SubjectsManagementCard`
- **File:** `src/components/settings/SubjectsManagementCard.tsx:13-276`  · **Review:** AUTO
- **Purpose:** UNKNOWN (no in-code description; not individually reviewed)
- **Parameters:** `{ subjects, onChange, onAutoSave, disabled }`
- **Returns:** `Element` (inferred)
- **Dependencies:** none detected
- **Calls:** `useAttendance` (src/context/AttendanceContext.tsx:3733), `saveEdit` (src/components/settings/SubjectsManagementCard.tsx:51), `startEdit` (src/components/settings/SubjectsManagementCard.tsx:44), `handleDelete` (src/components/settings/SubjectsManagementCard.tsx:71)
- **Called By:** no in-repo caller resolved (entry point, event handler, route, or referenced by value)
- **Database Interaction:** None detected.
- **External Services:** None detected.
- **Authentication:** No authentication logic inside this function.
- **Authorization:** No role/permission check inside this function.
- **Validation:** 2 guard/type/regex check(s) detected.
- **Errors:** 1 try/catch
- **Side Effects:** React state: `setCodeInput`, `setDeptInput`, `setEditingId`, `setFeedbackMsg`, `setIsAdding`, `setIsSaving`, `setNameInput`, `setNewCode` …
- **Edge Cases:** UNKNOWN (not individually reviewed)
- **Security Considerations:** None noted (not individually reviewed).
- **Current Limitations:** UNKNOWN (not individually reviewed)

### `triggerAutoSave` (nested in `SubjectsManagementCard`)
- **File:** `src/components/settings/SubjectsManagementCard.tsx:28-42`  · **Review:** AUTO
- **Purpose:** UNKNOWN (no in-code description; not individually reviewed)
- **Parameters:** `updatedSubjects: SchoolSubjectConfig[]`; `msg?: string`
- **Returns:** `Promise<void>` (inferred)
- **Dependencies:** none detected
- **Calls:** no in-repo callees resolved
- **Called By:** `saveEdit` (src/components/settings/SubjectsManagementCard.tsx:51), `handleDelete` (src/components/settings/SubjectsManagementCard.tsx:71), `handleAddSubject` (src/components/settings/SubjectsManagementCard.tsx:81)
- **Database Interaction:** None detected.
- **External Services:** None detected.
- **Authentication:** No authentication logic inside this function.
- **Authorization:** No role/permission check inside this function.
- **Validation:** None detected.
- **Errors:** 1 try/catch
- **Side Effects:** React state: `setFeedbackMsg`, `setIsSaving`, `setTimeout`
- **Edge Cases:** UNKNOWN (not individually reviewed)
- **Security Considerations:** None noted (not individually reviewed).
- **Current Limitations:** UNKNOWN (not individually reviewed)

### `startEdit` (nested in `SubjectsManagementCard`)
- **File:** `src/components/settings/SubjectsManagementCard.tsx:44-49`  · **Review:** AUTO
- **Purpose:** UNKNOWN (no in-code description; not individually reviewed)
- **Parameters:** `subj: SchoolSubjectConfig`
- **Returns:** `void` (inferred)
- **Dependencies:** none detected
- **Calls:** no in-repo callees resolved
- **Called By:** `SubjectsManagementCard` (src/components/settings/SubjectsManagementCard.tsx:13)
- **Database Interaction:** None detected.
- **External Services:** None detected.
- **Authentication:** No authentication logic inside this function.
- **Authorization:** No role/permission check inside this function.
- **Validation:** None detected.
- **Errors:** None detected.
- **Side Effects:** React state: `setCodeInput`, `setDeptInput`, `setEditingId`, `setNameInput`
- **Edge Cases:** UNKNOWN (not individually reviewed)
- **Security Considerations:** None noted (not individually reviewed).
- **Current Limitations:** UNKNOWN (not individually reviewed)

### `saveEdit` (nested in `SubjectsManagementCard`)
- **File:** `src/components/settings/SubjectsManagementCard.tsx:51-65`  · **Review:** AUTO
- **Purpose:** UNKNOWN (no in-code description; not individually reviewed)
- **Parameters:** `id: string`
- **Returns:** `Promise<void>` (inferred)
- **Dependencies:** none detected
- **Calls:** `triggerAutoSave` (src/components/settings/SubjectsManagementCard.tsx:28)
- **Called By:** `SubjectsManagementCard` (src/components/settings/SubjectsManagementCard.tsx:13)
- **Database Interaction:** None detected.
- **External Services:** None detected.
- **Authentication:** No authentication logic inside this function.
- **Authorization:** No role/permission check inside this function.
- **Validation:** 1 guard/type/regex check(s) detected.
- **Errors:** None detected.
- **Side Effects:** React state: `setEditingId`
- **Edge Cases:** UNKNOWN (not individually reviewed)
- **Security Considerations:** None noted (not individually reviewed).
- **Current Limitations:** UNKNOWN (not individually reviewed)

### `cancelEdit` (nested in `SubjectsManagementCard`)
- **File:** `src/components/settings/SubjectsManagementCard.tsx:67-69`  · **Review:** AUTO
- **Purpose:** UNKNOWN (no in-code description; not individually reviewed)
- **Parameters:** none
- **Returns:** `void` (inferred)
- **Dependencies:** none detected
- **Calls:** no in-repo callees resolved
- **Called By:** no in-repo caller resolved (entry point, event handler, route, or referenced by value)
- **Database Interaction:** None detected.
- **External Services:** None detected.
- **Authentication:** No authentication logic inside this function.
- **Authorization:** No role/permission check inside this function.
- **Validation:** None detected.
- **Errors:** None detected.
- **Side Effects:** React state: `setEditingId`
- **Edge Cases:** UNKNOWN (not individually reviewed)
- **Security Considerations:** None noted (not individually reviewed).
- **Current Limitations:** UNKNOWN (not individually reviewed)

### `handleDelete` (nested in `SubjectsManagementCard`)
- **File:** `src/components/settings/SubjectsManagementCard.tsx:71-79`  · **Review:** AUTO
- **Purpose:** UNKNOWN (no in-code description; not individually reviewed)
- **Parameters:** `id: string`
- **Returns:** `Promise<void>` (inferred)
- **Dependencies:** none detected
- **Calls:** `triggerAutoSave` (src/components/settings/SubjectsManagementCard.tsx:28)
- **Called By:** `SubjectsManagementCard` (src/components/settings/SubjectsManagementCard.tsx:13)
- **Database Interaction:** None detected.
- **External Services:** None detected.
- **Authentication:** No authentication logic inside this function.
- **Authorization:** No role/permission check inside this function.
- **Validation:** None detected.
- **Errors:** None detected.
- **Side Effects:** None detected.
- **Edge Cases:** UNKNOWN (not individually reviewed)
- **Security Considerations:** None noted (not individually reviewed).
- **Current Limitations:** UNKNOWN (not individually reviewed)

### `handleAddSubject` (nested in `SubjectsManagementCard`)
- **File:** `src/components/settings/SubjectsManagementCard.tsx:81-95`  · **Review:** AUTO
- **Purpose:** UNKNOWN (no in-code description; not individually reviewed)
- **Parameters:** none
- **Returns:** `Promise<void>` (inferred)
- **Dependencies:** none detected
- **Calls:** `triggerAutoSave` (src/components/settings/SubjectsManagementCard.tsx:28)
- **Called By:** no in-repo caller resolved (entry point, event handler, route, or referenced by value)
- **Database Interaction:** None detected.
- **External Services:** None detected.
- **Authentication:** No authentication logic inside this function.
- **Authorization:** No role/permission check inside this function.
- **Validation:** 1 guard/type/regex check(s) detected.
- **Errors:** None detected.
- **Side Effects:** React state: `setIsAdding`, `setNewCode`, `setNewDept`, `setNewName`
- **Edge Cases:** UNKNOWN (not individually reviewed)
- **Security Considerations:** None noted (not individually reviewed).
- **Current Limitations:** UNKNOWN (not individually reviewed)


## src/components/settings/TimetablePeriodsTab.tsx

### `TimetablePeriodsTab`
- **File:** `src/components/settings/TimetablePeriodsTab.tsx:13-222`  · **Review:** AUTO
- **Purpose:** UNKNOWN (no in-code description; not individually reviewed)
- **Parameters:** `{ profile, onChange, onAutoSave, disabled, }`
- **Returns:** `Element` (inferred)
- **Dependencies:** none detected
- **Calls:** `useAttendance` (src/context/AttendanceContext.tsx:3733), `handlePeriodChange` (src/components/settings/TimetablePeriodsTab.tsx:34), `handleDeletePeriod` (src/components/settings/TimetablePeriodsTab.tsx:62)
- **Called By:** no in-repo caller resolved (entry point, event handler, route, or referenced by value)
- **Database Interaction:** None detected.
- **External Services:** None detected.
- **Authentication:** No authentication logic inside this function.
- **Authorization:** No role/permission check inside this function.
- **Validation:** None detected.
- **Errors:** None detected.
- **Side Effects:** React state: `setFeedbackMsg`, `setTimeout`
- **Edge Cases:** UNKNOWN (not individually reviewed)
- **Security Considerations:** Uses `any` typing.
- **Current Limitations:** UNKNOWN (not individually reviewed)

### `triggerAutoSave` (nested in `TimetablePeriodsTab`)
- **File:** `src/components/settings/TimetablePeriodsTab.tsx:23-32`  · **Review:** AUTO
- **Purpose:** UNKNOWN (no in-code description; not individually reviewed)
- **Parameters:** `updatedPeriods: TimetablePeriod[]`; `msg?: string`
- **Returns:** `Promise<void>` (inferred)
- **Dependencies:** none detected
- **Calls:** no in-repo callees resolved
- **Called By:** `handlePeriodChange` (src/components/settings/TimetablePeriodsTab.tsx:34), `handlePeriodBlur` (src/components/settings/TimetablePeriodsTab.tsx:44), `handleAddPeriod` (src/components/settings/TimetablePeriodsTab.tsx:48), `handleDeletePeriod` (src/components/settings/TimetablePeriodsTab.tsx:62)
- **Database Interaction:** None detected.
- **External Services:** None detected.
- **Authentication:** No authentication logic inside this function.
- **Authorization:** No role/permission check inside this function.
- **Validation:** None detected.
- **Errors:** None detected.
- **Side Effects:** React state: `setFeedbackMsg`, `setTimeout`
- **Edge Cases:** UNKNOWN (not individually reviewed)
- **Security Considerations:** None noted (not individually reviewed).
- **Current Limitations:** UNKNOWN (not individually reviewed)

### `handlePeriodChange` (nested in `TimetablePeriodsTab`)
- **File:** `src/components/settings/TimetablePeriodsTab.tsx:34-42`  · **Review:** AUTO
- **Purpose:** UNKNOWN (no in-code description; not individually reviewed)
- **Parameters:** `id: string`; `field: keyof TimetablePeriod`; `value: any`
- **Returns:** `Promise<void>` (inferred)
- **Dependencies:** none detected
- **Calls:** `triggerAutoSave` (src/components/settings/TimetablePeriodsTab.tsx:23)
- **Called By:** `TimetablePeriodsTab` (src/components/settings/TimetablePeriodsTab.tsx:13)
- **Database Interaction:** None detected.
- **External Services:** None detected.
- **Authentication:** No authentication logic inside this function.
- **Authorization:** No role/permission check inside this function.
- **Validation:** None detected.
- **Errors:** None detected.
- **Side Effects:** None detected.
- **Edge Cases:** UNKNOWN (not individually reviewed)
- **Security Considerations:** Uses `any` typing.
- **Current Limitations:** UNKNOWN (not individually reviewed)

### `handlePeriodBlur` (nested in `TimetablePeriodsTab`)
- **File:** `src/components/settings/TimetablePeriodsTab.tsx:44-46`  · **Review:** AUTO
- **Purpose:** UNKNOWN (no in-code description; not individually reviewed)
- **Parameters:** none
- **Returns:** `Promise<void>` (inferred)
- **Dependencies:** none detected
- **Calls:** `triggerAutoSave` (src/components/settings/TimetablePeriodsTab.tsx:23)
- **Called By:** no in-repo caller resolved (entry point, event handler, route, or referenced by value)
- **Database Interaction:** None detected.
- **External Services:** None detected.
- **Authentication:** No authentication logic inside this function.
- **Authorization:** No role/permission check inside this function.
- **Validation:** None detected.
- **Errors:** None detected.
- **Side Effects:** None detected.
- **Edge Cases:** UNKNOWN (not individually reviewed)
- **Security Considerations:** None noted (not individually reviewed).
- **Current Limitations:** UNKNOWN (not individually reviewed)

### `handleAddPeriod` (nested in `TimetablePeriodsTab`)
- **File:** `src/components/settings/TimetablePeriodsTab.tsx:48-60`  · **Review:** AUTO
- **Purpose:** UNKNOWN (no in-code description; not individually reviewed)
- **Parameters:** none
- **Returns:** `Promise<void>` (inferred)
- **Dependencies:** none detected
- **Calls:** `triggerAutoSave` (src/components/settings/TimetablePeriodsTab.tsx:23)
- **Called By:** no in-repo caller resolved (entry point, event handler, route, or referenced by value)
- **Database Interaction:** None detected.
- **External Services:** None detected.
- **Authentication:** No authentication logic inside this function.
- **Authorization:** No role/permission check inside this function.
- **Validation:** None detected.
- **Errors:** None detected.
- **Side Effects:** None detected.
- **Edge Cases:** UNKNOWN (not individually reviewed)
- **Security Considerations:** None noted (not individually reviewed).
- **Current Limitations:** UNKNOWN (not individually reviewed)

### `handleDeletePeriod` (nested in `TimetablePeriodsTab`)
- **File:** `src/components/settings/TimetablePeriodsTab.tsx:62-69`  · **Review:** AUTO
- **Purpose:** UNKNOWN (no in-code description; not individually reviewed)
- **Parameters:** `id: string`
- **Returns:** `Promise<void>` (inferred)
- **Dependencies:** none detected
- **Calls:** `triggerAutoSave` (src/components/settings/TimetablePeriodsTab.tsx:23)
- **Called By:** `TimetablePeriodsTab` (src/components/settings/TimetablePeriodsTab.tsx:13)
- **Database Interaction:** None detected.
- **External Services:** None detected.
- **Authentication:** No authentication logic inside this function.
- **Authorization:** No role/permission check inside this function.
- **Validation:** None detected.
- **Errors:** None detected.
- **Side Effects:** None detected.
- **Edge Cases:** UNKNOWN (not individually reviewed)
- **Security Considerations:** None noted (not individually reviewed).
- **Current Limitations:** UNKNOWN (not individually reviewed)


## src/components/settings/UserEditModal.tsx

### `UserEditModal`
- **File:** `src/components/settings/UserEditModal.tsx:30-324`  · **Review:** AUTO
- **Purpose:** UNKNOWN (no in-code description; not individually reviewed)
- **Parameters:** `{ isOpen, onClose, user, onSave, isSaving = false, availableClasses, availableSubjects, lang, }`
- **Returns:** `ReactPortal` (inferred)
- **Dependencies:** admin
- **Calls:** `useAttendance` (src/context/AttendanceContext.tsx:3733), `useModalAccessibility` (src/hooks/useModalAccessibility.ts:17), `toggleClass` (src/components/settings/UserEditModal.tsx:58), `toggleSubject` (src/components/settings/UserEditModal.tsx:64)
- **Called By:** no in-repo caller resolved (entry point, event handler, route, or referenced by value)
- **Database Interaction:** None detected.
- **External Services:** None detected.
- **Authentication:** No authentication logic inside this function.
- **Authorization:** No role/permission check inside this function.
- **Validation:** 3 guard/type/regex check(s) detected.
- **Errors:** None detected.
- **Side Effects:** React state: `setAssignedClasses`, `setAssignedSubjects`, `setCustomSubject`, `setEmail`, `setJobTitle`, `setName`, `setPhone`, `setRole` …; DOM/window access
- **Edge Cases:** UNKNOWN (not individually reviewed)
- **Security Considerations:** None noted (not individually reviewed).
- **Current Limitations:** UNKNOWN (not individually reviewed)

### `toggleClass` (nested in `UserEditModal`)
- **File:** `src/components/settings/UserEditModal.tsx:58-62`  · **Review:** AUTO
- **Purpose:** UNKNOWN (no in-code description; not individually reviewed)
- **Parameters:** `cls: string`
- **Returns:** `void` (inferred)
- **Dependencies:** none detected
- **Calls:** no in-repo callees resolved
- **Called By:** `UserEditModal` (src/components/settings/UserEditModal.tsx:30)
- **Database Interaction:** None detected.
- **External Services:** None detected.
- **Authentication:** No authentication logic inside this function.
- **Authorization:** No role/permission check inside this function.
- **Validation:** None detected.
- **Errors:** None detected.
- **Side Effects:** React state: `setAssignedClasses`
- **Edge Cases:** UNKNOWN (not individually reviewed)
- **Security Considerations:** None noted (not individually reviewed).
- **Current Limitations:** UNKNOWN (not individually reviewed)

### `toggleSubject` (nested in `UserEditModal`)
- **File:** `src/components/settings/UserEditModal.tsx:64-68`  · **Review:** AUTO
- **Purpose:** UNKNOWN (no in-code description; not individually reviewed)
- **Parameters:** `sub: string`
- **Returns:** `void` (inferred)
- **Dependencies:** none detected
- **Calls:** no in-repo callees resolved
- **Called By:** `UserEditModal` (src/components/settings/UserEditModal.tsx:30)
- **Database Interaction:** None detected.
- **External Services:** None detected.
- **Authentication:** No authentication logic inside this function.
- **Authorization:** No role/permission check inside this function.
- **Validation:** None detected.
- **Errors:** None detected.
- **Side Effects:** React state: `setAssignedSubjects`
- **Edge Cases:** UNKNOWN (not individually reviewed)
- **Security Considerations:** None noted (not individually reviewed).
- **Current Limitations:** UNKNOWN (not individually reviewed)

### `handleAddCustomSubject` (nested in `UserEditModal`)
- **File:** `src/components/settings/UserEditModal.tsx:70-78`  · **Review:** AUTO
- **Purpose:** UNKNOWN (no in-code description; not individually reviewed)
- **Parameters:** `e: React.KeyboardEvent | React.MouseEvent`
- **Returns:** `void` (inferred)
- **Dependencies:** none detected
- **Calls:** no in-repo callees resolved
- **Called By:** no in-repo caller resolved (entry point, event handler, route, or referenced by value)
- **Database Interaction:** None detected.
- **External Services:** None detected.
- **Authentication:** No authentication logic inside this function.
- **Authorization:** No role/permission check inside this function.
- **Validation:** None detected.
- **Errors:** None detected.
- **Side Effects:** React state: `setAssignedSubjects`, `setCustomSubject`
- **Edge Cases:** UNKNOWN (not individually reviewed)
- **Security Considerations:** None noted (not individually reviewed).
- **Current Limitations:** UNKNOWN (not individually reviewed)

### `handleSubmit` (nested in `UserEditModal`)
- **File:** `src/components/settings/UserEditModal.tsx:80-98`  · **Review:** AUTO
- **Purpose:** UNKNOWN (no in-code description; not individually reviewed)
- **Parameters:** `e: React.FormEvent`
- **Returns:** `Promise<void>` (inferred)
- **Dependencies:** none detected
- **Calls:** no in-repo callees resolved
- **Called By:** no in-repo caller resolved (entry point, event handler, route, or referenced by value)
- **Database Interaction:** None detected.
- **External Services:** None detected.
- **Authentication:** No authentication logic inside this function.
- **Authorization:** No role/permission check inside this function.
- **Validation:** 2 guard/type/regex check(s) detected.
- **Errors:** None detected.
- **Side Effects:** None detected.
- **Edge Cases:** UNKNOWN (not individually reviewed)
- **Security Considerations:** None noted (not individually reviewed).
- **Current Limitations:** UNKNOWN (not individually reviewed)


## src/components/settings/UserManagementTab.tsx

### `UserManagementTab`
- **File:** `src/components/settings/UserManagementTab.tsx:35-348`  · **Review:** AUTO
- **Purpose:** UNKNOWN (no in-code description; not individually reviewed)
- **Parameters:** `{ users, onCreateUser, onUpdateUser, onDeleteUser, canManageUsers, availableClasses: propClasses, availableSubjects: propSubjects, lang, }`
- **Returns:** `Element` (inferred)
- **Dependencies:** admin
- **Calls:** `handleOpenEdit` (src/components/settings/UserManagementTab.tsx:87), `handleDelete` (src/components/settings/UserManagementTab.tsx:92)
- **Called By:** no in-repo caller resolved (entry point, event handler, route, or referenced by value)
- **Database Interaction:** None detected.
- **External Services:** None detected.
- **Authentication:** No authentication logic inside this function.
- **Authorization:** References: `canManageUsers`
- **Validation:** 2 guard/type/regex check(s) detected.
- **Errors:** 1 try/catch
- **Side Effects:** React state: `setAccountNotice`, `setEditingUser`, `setFeedbackMsg`, `setIsModalOpen`, `setIsSaving`, `setRoleFilter`, `setSearchQuery`, `setTimeout`; DOM/window access
- **Edge Cases:** UNKNOWN (not individually reviewed)
- **Security Considerations:** Uses `any` typing.
- **Current Limitations:** UNKNOWN (not individually reviewed)

### `handleOpenCreate` (nested in `UserManagementTab`)
- **File:** `src/components/settings/UserManagementTab.tsx:82-85`  · **Review:** AUTO
- **Purpose:** UNKNOWN (no in-code description; not individually reviewed)
- **Parameters:** none
- **Returns:** `void` (inferred)
- **Dependencies:** none detected
- **Calls:** no in-repo callees resolved
- **Called By:** no in-repo caller resolved (entry point, event handler, route, or referenced by value)
- **Database Interaction:** None detected.
- **External Services:** None detected.
- **Authentication:** No authentication logic inside this function.
- **Authorization:** No role/permission check inside this function.
- **Validation:** None detected.
- **Errors:** None detected.
- **Side Effects:** React state: `setEditingUser`, `setIsModalOpen`
- **Edge Cases:** UNKNOWN (not individually reviewed)
- **Security Considerations:** None noted (not individually reviewed).
- **Current Limitations:** UNKNOWN (not individually reviewed)

### `handleOpenEdit` (nested in `UserManagementTab`)
- **File:** `src/components/settings/UserManagementTab.tsx:87-90`  · **Review:** AUTO
- **Purpose:** UNKNOWN (no in-code description; not individually reviewed)
- **Parameters:** `user: UserProfile`
- **Returns:** `void` (inferred)
- **Dependencies:** none detected
- **Calls:** no in-repo callees resolved
- **Called By:** `UserManagementTab` (src/components/settings/UserManagementTab.tsx:35)
- **Database Interaction:** None detected.
- **External Services:** None detected.
- **Authentication:** No authentication logic inside this function.
- **Authorization:** No role/permission check inside this function.
- **Validation:** None detected.
- **Errors:** None detected.
- **Side Effects:** React state: `setEditingUser`, `setIsModalOpen`
- **Edge Cases:** UNKNOWN (not individually reviewed)
- **Security Considerations:** None noted (not individually reviewed).
- **Current Limitations:** UNKNOWN (not individually reviewed)

### `handleDelete` (nested in `UserManagementTab`)
- **File:** `src/components/settings/UserManagementTab.tsx:92-99`  · **Review:** AUTO
- **Purpose:** UNKNOWN (no in-code description; not individually reviewed)
- **Parameters:** `user: UserProfile`
- **Returns:** `Promise<void>` (inferred)
- **Dependencies:** none detected
- **Calls:** no in-repo callees resolved
- **Called By:** `UserManagementTab` (src/components/settings/UserManagementTab.tsx:35)
- **Database Interaction:** None detected.
- **External Services:** None detected.
- **Authentication:** No authentication logic inside this function.
- **Authorization:** No role/permission check inside this function.
- **Validation:** 1 guard/type/regex check(s) detected.
- **Errors:** None detected.
- **Side Effects:** React state: `setFeedbackMsg`, `setTimeout`; DOM/window access
- **Edge Cases:** UNKNOWN (not individually reviewed)
- **Security Considerations:** None noted (not individually reviewed).
- **Current Limitations:** UNKNOWN (not individually reviewed)

### `handleSaveModal` (nested in `UserManagementTab`)
- **File:** `src/components/settings/UserManagementTab.tsx:101-120`  · **Review:** AUTO
- **Purpose:** UNKNOWN (no in-code description; not individually reviewed)
- **Parameters:** `data: Omit<UserProfile, 'id' | 'tenantId'>`
- **Returns:** `Promise<{ success: boolean; message: any; }>` (inferred)
- **Dependencies:** none detected
- **Calls:** no in-repo callees resolved
- **Called By:** no in-repo caller resolved (entry point, event handler, route, or referenced by value)
- **Database Interaction:** None detected.
- **External Services:** None detected.
- **Authentication:** No authentication logic inside this function.
- **Authorization:** No role/permission check inside this function.
- **Validation:** 1 guard/type/regex check(s) detected.
- **Errors:** 1 try/catch
- **Side Effects:** React state: `setAccountNotice`, `setFeedbackMsg`, `setIsSaving`, `setTimeout`
- **Edge Cases:** UNKNOWN (not individually reviewed)
- **Security Considerations:** Uses `any` typing.
- **Current Limitations:** UNKNOWN (not individually reviewed)


## src/components/students/AddStudentModal.tsx

### `AddStudentModal`
- **File:** `src/components/students/AddStudentModal.tsx:16-302`  · **Review:** AUTO
- **Purpose:** UNKNOWN (no in-code description; not individually reviewed)
- **Parameters:** `{ isOpen, onClose, onAddStudent, classesStats, educationalGrades, lang, }`
- **Returns:** `Element` (inferred)
- **Dependencies:** none detected
- **Calls:** `useModalAccessibility` (src/hooks/useModalAccessibility.ts:17), `useAttendance` (src/context/AttendanceContext.tsx:3733)
- **Called By:** no in-repo caller resolved (entry point, event handler, route, or referenced by value)
- **Database Interaction:** None detected.
- **External Services:** None detected.
- **Authentication:** No authentication logic inside this function.
- **Authorization:** No role/permission check inside this function.
- **Validation:** 3 guard/type/regex check(s) detected.
- **Errors:** None detected.
- **Side Effects:** React state: `setBloodType`, `setClassName`, `setCustomClass`, `setError`, `setFullName`, `setGrade`, `setGuardianName`, `setGuardianPhone` …
- **Edge Cases:** UNKNOWN (not individually reviewed)
- **Security Considerations:** None noted (not individually reviewed).
- **Current Limitations:** UNKNOWN (not individually reviewed)

### `handleSubmit` (nested in `AddStudentModal`)
- **File:** `src/components/students/AddStudentModal.tsx:54-91`  · **Review:** AUTO
- **Purpose:** UNKNOWN (no in-code description; not individually reviewed)
- **Parameters:** `e: React.FormEvent`
- **Returns:** `void` (inferred)
- **Dependencies:** none detected
- **Calls:** no in-repo callees resolved
- **Called By:** no in-repo caller resolved (entry point, event handler, route, or referenced by value)
- **Database Interaction:** None detected.
- **External Services:** None detected.
- **Authentication:** No authentication logic inside this function.
- **Authorization:** No role/permission check inside this function.
- **Validation:** 2 guard/type/regex check(s) detected.
- **Errors:** None detected.
- **Side Effects:** React state: `setError`
- **Edge Cases:** UNKNOWN (not individually reviewed)
- **Security Considerations:** None noted (not individually reviewed).
- **Current Limitations:** UNKNOWN (not individually reviewed)


## src/components/students/DeleteStudentConfirmationModal.tsx

### `DeleteStudentConfirmationModal`
- **File:** `src/components/students/DeleteStudentConfirmationModal.tsx:14-80`  · **Review:** AUTO
- **Purpose:** UNKNOWN (no in-code description; not individually reviewed)
- **Parameters:** `{ isOpen, student, onClose, onConfirmDelete, lang, }`
- **Returns:** `Element` (inferred)
- **Dependencies:** none detected
- **Calls:** `useModalAccessibility` (src/hooks/useModalAccessibility.ts:17)
- **Called By:** no in-repo caller resolved (entry point, event handler, route, or referenced by value)
- **Database Interaction:** None detected.
- **External Services:** None detected.
- **Authentication:** No authentication logic inside this function.
- **Authorization:** No role/permission check inside this function.
- **Validation:** 1 guard/type/regex check(s) detected.
- **Errors:** None detected.
- **Side Effects:** None detected.
- **Edge Cases:** UNKNOWN (not individually reviewed)
- **Security Considerations:** None noted (not individually reviewed).
- **Current Limitations:** UNKNOWN (not individually reviewed)


## src/components/students/SchoolClassStatsCards.tsx

### `SchoolClassStatsCards`
- **File:** `src/components/students/SchoolClassStatsCards.tsx:17-383`  · **Review:** AUTO
- **Purpose:** UNKNOWN (no in-code description; not individually reviewed)
- **Parameters:** `{ enrollmentStats, classesStats, selectedClass, onSelectClass, statusFilter, onStatusFilterChange, selectedGradeFilter = 'all', onSelectGradeFilter, lang, }`
- **Returns:** `Element` (inferred)
- **Dependencies:** none detected
- **Calls:** no in-repo callees resolved
- **Called By:** no in-repo caller resolved (entry point, event handler, route, or referenced by value)
- **Database Interaction:** None detected.
- **External Services:** None detected.
- **Authentication:** No authentication logic inside this function.
- **Authorization:** No role/permission check inside this function.
- **Validation:** None detected.
- **Errors:** None detected.
- **Side Effects:** None detected.
- **Edge Cases:** UNKNOWN (not individually reviewed)
- **Security Considerations:** None noted (not individually reviewed).
- **Current Limitations:** UNKNOWN (not individually reviewed)


## src/components/students/StudentAbsenceDrawer.tsx

### `StudentAbsenceDrawer`
- **File:** `src/components/students/StudentAbsenceDrawer.tsx:36-1184`  · **Review:** AUTO
- **Purpose:** UNKNOWN (no in-code description; not individually reviewed)
- **Parameters:** `{ student, isOpen, onClose, }`
- **Returns:** `ReactPortal` (inferred)
- **Dependencies:** none detected
- **Calls:** `useAttendance` (src/context/AttendanceContext.tsx:3733), `getArabicDayName` (src/components/students/StudentAbsenceDrawer.tsx:260), `getSchoolDaysInRange` (src/components/students/StudentAbsenceDrawer.tsx:272)
- **Called By:** no in-repo caller resolved (entry point, event handler, route, or referenced by value)
- **Database Interaction:** None detected.
- **External Services:** None detected.
- **Authentication:** No authentication logic inside this function.
- **Authorization:** No role/permission check inside this function.
- **Validation:** 15 guard/type/regex check(s) detected.
- **Errors:** 2 try/catch
- **Side Effects:** React state: `setCustomEndDate`, `setCustomStartDate`, `setDate`, `setHorizonType`, `setIsGeneratingPdf`, `setSelectedMonth`, `setSelectedTermId`, `setTimeout` …; console output; DOM/window access
- **Edge Cases:** UNKNOWN (not individually reviewed)
- **Security Considerations:** None noted (not individually reviewed).
- **Current Limitations:** UNKNOWN (not individually reviewed)

### `handleKeyDown` (nested in `StudentAbsenceDrawer`)
- **File:** `src/components/students/StudentAbsenceDrawer.tsx:65-69`  · **Review:** AUTO
- **Purpose:** UNKNOWN (no in-code description; not individually reviewed)
- **Parameters:** `e: KeyboardEvent`
- **Returns:** `void` (inferred)
- **Dependencies:** none detected
- **Calls:** no in-repo callees resolved
- **Called By:** no in-repo caller resolved (entry point, event handler, route, or referenced by value)
- **Database Interaction:** None detected.
- **External Services:** None detected.
- **Authentication:** No authentication logic inside this function.
- **Authorization:** No role/permission check inside this function.
- **Validation:** None detected.
- **Errors:** None detected.
- **Side Effects:** None detected.
- **Edge Cases:** UNKNOWN (not individually reviewed)
- **Security Considerations:** None noted (not individually reviewed).
- **Current Limitations:** UNKNOWN (not individually reviewed)

### `getArabicDayName` (nested in `StudentAbsenceDrawer`)
- **File:** `src/components/students/StudentAbsenceDrawer.tsx:260-269`  · **Review:** AUTO
- **Purpose:** In-code comment: Helper for Arabic day name
- **Parameters:** `dateStr: string`
- **Returns:** `string` (declared)
- **Dependencies:** none detected
- **Calls:** no in-repo callees resolved
- **Called By:** `StudentAbsenceDrawer` (src/components/students/StudentAbsenceDrawer.tsx:36)
- **Database Interaction:** None detected.
- **External Services:** None detected.
- **Authentication:** No authentication logic inside this function.
- **Authorization:** No role/permission check inside this function.
- **Validation:** None detected.
- **Errors:** 1 try/catch
- **Side Effects:** None detected.
- **Edge Cases:** UNKNOWN (not individually reviewed)
- **Security Considerations:** None noted (not individually reviewed).
- **Current Limitations:** UNKNOWN (not individually reviewed)

### `getSchoolDaysInRange` (nested in `StudentAbsenceDrawer`)
- **File:** `src/components/students/StudentAbsenceDrawer.tsx:272-295`  · **Review:** AUTO
- **Purpose:** In-code comment: Helper to generate official school days excluding off days
- **Parameters:** `startDateStr: string`; `endDateStr: string`
- **Returns:** `string[]` (declared)
- **Dependencies:** none detected
- **Calls:** `isSchoolOffDay` (src/utils/holidayUtils.ts:93)
- **Called By:** `StudentAbsenceDrawer` (src/components/students/StudentAbsenceDrawer.tsx:36)
- **Database Interaction:** None detected.
- **External Services:** None detected.
- **Authentication:** No authentication logic inside this function.
- **Authorization:** No role/permission check inside this function.
- **Validation:** 1 guard/type/regex check(s) detected.
- **Errors:** None detected.
- **Side Effects:** React state: `setDate`
- **Edge Cases:** UNKNOWN (not individually reviewed)
- **Security Considerations:** None noted (not individually reviewed).
- **Current Limitations:** UNKNOWN (not individually reviewed)

### `handleSendWarning` (nested in `StudentAbsenceDrawer`)
- **File:** `src/components/students/StudentAbsenceDrawer.tsx:642-652`  · **Review:** AUTO
- **Purpose:** In-code comment: Actions
- **Parameters:** none
- **Returns:** `void` (inferred)
- **Dependencies:** none detected
- **Calls:** no in-repo callees resolved
- **Called By:** no in-repo caller resolved (entry point, event handler, route, or referenced by value)
- **Database Interaction:** None detected.
- **External Services:** None detected.
- **Authentication:** No authentication logic inside this function.
- **Authorization:** No role/permission check inside this function.
- **Validation:** 1 guard/type/regex check(s) detected.
- **Errors:** None detected.
- **Side Effects:** React state: `setTimeout`, `setToastMsg`
- **Edge Cases:** UNKNOWN (not individually reviewed)
- **Security Considerations:** None noted (not individually reviewed).
- **Current Limitations:** UNKNOWN (not individually reviewed)

### `handleWhatsAppContact` (nested in `StudentAbsenceDrawer`)
- **File:** `src/components/students/StudentAbsenceDrawer.tsx:654-664`  · **Review:** AUTO
- **Purpose:** UNKNOWN (no in-code description; not individually reviewed)
- **Parameters:** none
- **Returns:** `void` (inferred)
- **Dependencies:** none detected
- **Calls:** `openWhatsAppDirect` (src/utils/whatsappUtils.ts:62)
- **Called By:** no in-repo caller resolved (entry point, event handler, route, or referenced by value)
- **Database Interaction:** None detected.
- **External Services:** None detected.
- **Authentication:** No authentication logic inside this function.
- **Authorization:** No role/permission check inside this function.
- **Validation:** 1 guard/type/regex check(s) detected.
- **Errors:** None detected.
- **Side Effects:** None detected.
- **Edge Cases:** UNKNOWN (not individually reviewed)
- **Security Considerations:** None noted (not individually reviewed).
- **Current Limitations:** UNKNOWN (not individually reviewed)

### `handleDownloadPdf` (nested in `StudentAbsenceDrawer`)
- **File:** `src/components/students/StudentAbsenceDrawer.tsx:666-701`  · **Review:** AUTO
- **Purpose:** UNKNOWN (no in-code description; not individually reviewed)
- **Parameters:** none
- **Returns:** `Promise<void>` (inferred)
- **Dependencies:** none detected
- **Calls:** `generateStudentAbsenceReportHtml` (src/utils/printTemplates/studentAbsenceReportTemplate.ts:42), `downloadNativePdfFromHtml` (src/utils/pdfExport.ts:66)
- **Called By:** no in-repo caller resolved (entry point, event handler, route, or referenced by value)
- **Database Interaction:** None detected.
- **External Services:** None detected.
- **Authentication:** No authentication logic inside this function.
- **Authorization:** No role/permission check inside this function.
- **Validation:** 1 guard/type/regex check(s) detected.
- **Errors:** 1 try/catch
- **Side Effects:** React state: `setIsGeneratingPdf`, `setTimeout`, `setToastMsg`; console output; DOM/window access
- **Edge Cases:** UNKNOWN (not individually reviewed)
- **Security Considerations:** None noted (not individually reviewed).
- **Current Limitations:** UNKNOWN (not individually reviewed)

### `handlePrint` (nested in `StudentAbsenceDrawer`)
- **File:** `src/components/students/StudentAbsenceDrawer.tsx:703-726`  · **Review:** AUTO
- **Purpose:** UNKNOWN (no in-code description; not individually reviewed)
- **Parameters:** none
- **Returns:** `void` (inferred)
- **Dependencies:** none detected
- **Calls:** `generateStudentAbsenceReportHtml` (src/utils/printTemplates/studentAbsenceReportTemplate.ts:42), `printNativePdfFromHtml` (src/utils/pdfExport.ts:104)
- **Called By:** no in-repo caller resolved (entry point, event handler, route, or referenced by value)
- **Database Interaction:** None detected.
- **External Services:** None detected.
- **Authentication:** No authentication logic inside this function.
- **Authorization:** No role/permission check inside this function.
- **Validation:** 1 guard/type/regex check(s) detected.
- **Errors:** None detected.
- **Side Effects:** DOM/window access
- **Edge Cases:** UNKNOWN (not individually reviewed)
- **Security Considerations:** None noted (not individually reviewed).
- **Current Limitations:** UNKNOWN (not individually reviewed)


## src/components/students/TransferStudentModal.tsx

### `TransferStudentModal`
- **File:** `src/components/students/TransferStudentModal.tsx:14-143`  · **Review:** AUTO
- **Purpose:** UNKNOWN (no in-code description; not individually reviewed)
- **Parameters:** `{ isOpen, student, onClose, onConfirmTransfer, lang, }`
- **Returns:** `Element` (inferred)
- **Dependencies:** none detected
- **Calls:** `useModalAccessibility` (src/hooks/useModalAccessibility.ts:17)
- **Called By:** no in-repo caller resolved (entry point, event handler, route, or referenced by value)
- **Database Interaction:** None detected.
- **External Services:** None detected.
- **Authentication:** No authentication logic inside this function.
- **Authorization:** No role/permission check inside this function.
- **Validation:** 2 guard/type/regex check(s) detected.
- **Errors:** None detected.
- **Side Effects:** React state: `setDestinationSchool`, `setError`, `setReason`
- **Edge Cases:** UNKNOWN (not individually reviewed)
- **Security Considerations:** None noted (not individually reviewed).
- **Current Limitations:** UNKNOWN (not individually reviewed)

### `handleSubmit` (nested in `TransferStudentModal`)
- **File:** `src/components/students/TransferStudentModal.tsx:30-42`  · **Review:** AUTO
- **Purpose:** UNKNOWN (no in-code description; not individually reviewed)
- **Parameters:** `e: React.FormEvent`
- **Returns:** `void` (inferred)
- **Dependencies:** none detected
- **Calls:** no in-repo callees resolved
- **Called By:** no in-repo caller resolved (entry point, event handler, route, or referenced by value)
- **Database Interaction:** None detected.
- **External Services:** None detected.
- **Authentication:** No authentication logic inside this function.
- **Authorization:** No role/permission check inside this function.
- **Validation:** 1 guard/type/regex check(s) detected.
- **Errors:** None detected.
- **Side Effects:** React state: `setError`
- **Edge Cases:** UNKNOWN (not individually reviewed)
- **Security Considerations:** None noted (not individually reviewed).
- **Current Limitations:** UNKNOWN (not individually reviewed)


## src/components/superadmin/PlatformOwnerModal.tsx

### `PlatformOwnerModal`
- **File:** `src/components/superadmin/PlatformOwnerModal.tsx:65-769`  · **Review:** AUTO
- **Purpose:** UNKNOWN (no in-code description; not individually reviewed)
- **Parameters:** `{ isOpen, onClose }`
- **Returns:** `ReactPortal` (inferred)
- **Dependencies:** none detected
- **Calls:** `useAttendance` (src/context/AttendanceContext.tsx:3733), `useModalAccessibility` (src/hooks/useModalAccessibility.ts:17), `handleSubscriptionAction` (src/components/superadmin/PlatformOwnerModal.tsx:230), `handleNameArChange` (src/components/superadmin/PlatformOwnerModal.tsx:147), `handleCountryChange` (src/components/superadmin/PlatformOwnerModal.tsx:154), `handleSubdomainChange` (src/components/superadmin/PlatformOwnerModal.tsx:136)
- **Called By:** no in-repo caller resolved (entry point, event handler, route, or referenced by value)
- **Database Interaction:** None detected.
- **External Services:** HTTP /api/tenants, HTTP /api/tenants/${encodeURIComponent(tenantId)}/subscription/${action}
- **Authentication:** Uses `firebaseUser`/token
- **Authorization:** No role/permission check inside this function.
- **Validation:** 8 guard/type/regex check(s) detected.
- **Errors:** 4 try/catch, 1 throw
- **Side Effects:** React state: `setAcademicYear`, `setActiveTab`, `setBusySubscription`, `setCityAr`, `setCode`, `setCountryAr`, `setCountryCallingCode`, `setErrorMessage` …; console output; DOM/window access
- **Edge Cases:** UNKNOWN (not individually reviewed)
- **Security Considerations:** Uses `any` typing.
- **Current Limitations:** UNKNOWN (not individually reviewed)

### `handleSubdomainChange` (nested in `PlatformOwnerModal`)
- **File:** `src/components/superadmin/PlatformOwnerModal.tsx:136-145`  · **Review:** AUTO
- **Purpose:** UNKNOWN (no in-code description; not individually reviewed)
- **Parameters:** `val: string`
- **Returns:** `void` (inferred)
- **Dependencies:** none detected
- **Calls:** no in-repo callees resolved
- **Called By:** `PlatformOwnerModal` (src/components/superadmin/PlatformOwnerModal.tsx:65)
- **Database Interaction:** None detected.
- **External Services:** None detected.
- **Authentication:** No authentication logic inside this function.
- **Authorization:** No role/permission check inside this function.
- **Validation:** 2 guard/type/regex check(s) detected.
- **Errors:** None detected.
- **Side Effects:** React state: `setPrincipalEmail`, `setSchoolId`, `setSubdomain`
- **Edge Cases:** UNKNOWN (not individually reviewed)
- **Security Considerations:** None noted (not individually reviewed).
- **Current Limitations:** UNKNOWN (not individually reviewed)

### `handleNameArChange` (nested in `PlatformOwnerModal`)
- **File:** `src/components/superadmin/PlatformOwnerModal.tsx:147-152`  · **Review:** AUTO
- **Purpose:** UNKNOWN (no in-code description; not individually reviewed)
- **Parameters:** `val: string`
- **Returns:** `void` (inferred)
- **Dependencies:** none detected
- **Calls:** no in-repo callees resolved
- **Called By:** `PlatformOwnerModal` (src/components/superadmin/PlatformOwnerModal.tsx:65)
- **Database Interaction:** None detected.
- **External Services:** None detected.
- **Authentication:** No authentication logic inside this function.
- **Authorization:** No role/permission check inside this function.
- **Validation:** 1 guard/type/regex check(s) detected.
- **Errors:** None detected.
- **Side Effects:** React state: `setLogoText`, `setNameAr`
- **Edge Cases:** UNKNOWN (not individually reviewed)
- **Security Considerations:** None noted (not individually reviewed).
- **Current Limitations:** UNKNOWN (not individually reviewed)

### `handleCountryChange` (nested in `PlatformOwnerModal`)
- **File:** `src/components/superadmin/PlatformOwnerModal.tsx:154-163`  · **Review:** AUTO
- **Purpose:** UNKNOWN (no in-code description; not individually reviewed)
- **Parameters:** `val: string`
- **Returns:** `void` (inferred)
- **Dependencies:** none detected
- **Calls:** `findCountryByName` (src/config/countryCodes.ts:293)
- **Called By:** `PlatformOwnerModal` (src/components/superadmin/PlatformOwnerModal.tsx:65)
- **Database Interaction:** None detected.
- **External Services:** None detected.
- **Authentication:** No authentication logic inside this function.
- **Authorization:** No role/permission check inside this function.
- **Validation:** 1 guard/type/regex check(s) detected.
- **Errors:** None detected.
- **Side Effects:** React state: `setCountryAr`, `setCountryCallingCode`, `setPrincipalPhone`
- **Edge Cases:** UNKNOWN (not individually reviewed)
- **Security Considerations:** None noted (not individually reviewed).
- **Current Limitations:** UNKNOWN (not individually reviewed)

### `handleSubmitProvision` (nested in `PlatformOwnerModal`)
- **File:** `src/components/superadmin/PlatformOwnerModal.tsx:165-214`  · **Review:** AUTO
- **Purpose:** UNKNOWN (no in-code description; not individually reviewed)
- **Parameters:** `e: React.FormEvent`
- **Returns:** `Promise<void>` (inferred)
- **Dependencies:** none detected
- **Calls:** no in-repo callees resolved
- **Called By:** no in-repo caller resolved (entry point, event handler, route, or referenced by value)
- **Database Interaction:** None detected.
- **External Services:** None detected.
- **Authentication:** No authentication logic inside this function.
- **Authorization:** No role/permission check inside this function.
- **Validation:** None detected.
- **Errors:** 1 try/catch
- **Side Effects:** React state: `setActiveTab`, `setCode`, `setCountryAr`, `setCountryCallingCode`, `setErrorMessage`, `setLoading`, `setNameAr`, `setNameEn` …
- **Edge Cases:** UNKNOWN (not individually reviewed)
- **Security Considerations:** Uses `any` typing.
- **Current Limitations:** UNKNOWN (not individually reviewed)

### `handleSyncWithServer` (nested in `PlatformOwnerModal`)
- **File:** `src/components/superadmin/PlatformOwnerModal.tsx:216-228`  · **Review:** AUTO
- **Purpose:** UNKNOWN (no in-code description; not individually reviewed)
- **Parameters:** none
- **Returns:** `Promise<void>` (inferred)
- **Dependencies:** none detected
- **Calls:** no in-repo callees resolved
- **Called By:** no in-repo caller resolved (entry point, event handler, route, or referenced by value)
- **Database Interaction:** None detected.
- **External Services:** None detected.
- **Authentication:** No authentication logic inside this function.
- **Authorization:** No role/permission check inside this function.
- **Validation:** None detected.
- **Errors:** 1 try/catch
- **Side Effects:** React state: `setErrorMessage`, `setIsSyncing`, `setSuccessMessage`, `setTimeout`
- **Edge Cases:** UNKNOWN (not individually reviewed)
- **Security Considerations:** Uses `any` typing.
- **Current Limitations:** UNKNOWN (not individually reviewed)

### `handleSubscriptionAction` (nested in `PlatformOwnerModal`)
- **File:** `src/components/superadmin/PlatformOwnerModal.tsx:230-270`  · **Review:** AUTO
- **Purpose:** UNKNOWN (no in-code description; not individually reviewed)
- **Parameters:** `tenantId: string`; `action: 'suspend' | 'reactivate' | 'renew'`
- **Returns:** `Promise<void>` (inferred)
- **Dependencies:** none detected
- **Calls:** `authenticatedFetch` (src/lib/api.ts:46)
- **Called By:** `PlatformOwnerModal` (src/components/superadmin/PlatformOwnerModal.tsx:65)
- **Database Interaction:** None detected.
- **External Services:** HTTP /api/tenants/${encodeURIComponent(tenantId)}/subscription/${action}
- **Authentication:** Uses `firebaseUser`/token
- **Authorization:** No role/permission check inside this function.
- **Validation:** 1 guard/type/regex check(s) detected.
- **Errors:** 1 try/catch, 1 throw
- **Side Effects:** React state: `setBusySubscription`, `setErrorMessage`, `setSubscriptions`, `setSuccessMessage`, `setTimeout`
- **Edge Cases:** UNKNOWN (not individually reviewed)
- **Security Considerations:** Uses `any` typing.
- **Current Limitations:** UNKNOWN (not individually reviewed)



# Scripts


## scripts/ci-security-audit.mjs

### `scanDirectory`
- **File:** `scripts/ci-security-audit.mjs:61-100`  · **Review:** AUTO
- **Purpose:** UNKNOWN (no in-code description; not individually reviewed)
- **Parameters:** `dir`
- **Returns:** `void` (inferred)
- **Dependencies:** fs
- **Calls:** no in-repo callees resolved
- **Called By:** no in-repo caller resolved (entry point, event handler, route, or referenced by value)
- **Database Interaction:** None detected.
- **External Services:** None detected.
- **Authentication:** No authentication logic inside this function.
- **Authorization:** No role/permission check inside this function.
- **Validation:** 1 guard/type/regex check(s) detected.
- **Errors:** 1 try/catch
- **Side Effects:** None detected.
- **Edge Cases:** UNKNOWN (not individually reviewed)
- **Security Considerations:** None noted (not individually reviewed).
- **Current Limitations:** UNKNOWN (not individually reviewed)


## scripts/emulator-smoke.mjs

### `check`
- **File:** `scripts/emulator-smoke.mjs:51-54`  · **Review:** AUTO
- **Purpose:** UNKNOWN (no in-code description; not individually reviewed)
- **Parameters:** `name`; `condition`; `detail = ''`
- **Returns:** `void` (inferred)
- **Dependencies:** none detected
- **Calls:** no in-repo callees resolved
- **Called By:** no in-repo caller resolved (entry point, event handler, route, or referenced by value)
- **Database Interaction:** None detected.
- **External Services:** None detected.
- **Authentication:** No authentication logic inside this function.
- **Authorization:** No role/permission check inside this function.
- **Validation:** 1 guard/type/regex check(s) detected.
- **Errors:** None detected.
- **Side Effects:** console output
- **Edge Cases:** UNKNOWN (not individually reviewed)
- **Security Considerations:** None noted (not individually reviewed).
- **Current Limitations:** UNKNOWN (not individually reviewed)


## scripts/golive-check.mjs

### `check`
- **File:** `scripts/golive-check.mjs:34-37`  · **Review:** AUTO
- **Purpose:** UNKNOWN (no in-code description; not individually reviewed)
- **Parameters:** `label`; `ok`; `detail = ''`
- **Returns:** `void` (inferred)
- **Dependencies:** none detected
- **Calls:** no in-repo callees resolved
- **Called By:** no in-repo caller resolved (entry point, event handler, route, or referenced by value)
- **Database Interaction:** None detected.
- **External Services:** None detected.
- **Authentication:** No authentication logic inside this function.
- **Authorization:** No role/permission check inside this function.
- **Validation:** None detected.
- **Errors:** None detected.
- **Side Effects:** console output
- **Edge Cases:** UNKNOWN (not individually reviewed)
- **Security Considerations:** None noted (not individually reviewed).
- **Current Limitations:** UNKNOWN (not individually reviewed)

### `isTrue`
- **File:** `scripts/golive-check.mjs:40-40`  · **Review:** AUTO
- **Purpose:** UNKNOWN (no in-code description; not individually reviewed)
- **Parameters:** `v`
- **Returns:** `boolean` (inferred)
- **Dependencies:** none detected
- **Calls:** no in-repo callees resolved
- **Called By:** no in-repo caller resolved (entry point, event handler, route, or referenced by value)
- **Database Interaction:** None detected.
- **External Services:** None detected.
- **Authentication:** No authentication logic inside this function.
- **Authorization:** No role/permission check inside this function.
- **Validation:** None detected.
- **Errors:** None detected.
- **Side Effects:** None detected.
- **Edge Cases:** UNKNOWN (not individually reviewed)
- **Security Considerations:** None noted (not individually reviewed).
- **Current Limitations:** UNKNOWN (not individually reviewed)

### `has`
- **File:** `scripts/golive-check.mjs:41-41`  · **Review:** AUTO
- **Purpose:** UNKNOWN (no in-code description; not individually reviewed)
- **Parameters:** `v`
- **Returns:** `boolean` (inferred)
- **Dependencies:** none detected
- **Calls:** no in-repo callees resolved
- **Called By:** no in-repo caller resolved (entry point, event handler, route, or referenced by value)
- **Database Interaction:** None detected.
- **External Services:** None detected.
- **Authentication:** No authentication logic inside this function.
- **Authorization:** No role/permission check inside this function.
- **Validation:** 1 guard/type/regex check(s) detected.
- **Errors:** None detected.
- **Side Effects:** None detected.
- **Edge Cases:** UNKNOWN (not individually reviewed)
- **Security Considerations:** None noted (not individually reviewed).
- **Current Limitations:** UNKNOWN (not individually reviewed)


## scripts/render-pdf-to-image.mjs

### `main`
- **File:** `scripts/render-pdf-to-image.mjs:4-80`  · **Review:** AUTO
- **Purpose:** UNKNOWN (no in-code description; not individually reviewed)
- **Parameters:** none
- **Returns:** `Promise<void>` (inferred)
- **Dependencies:** fs, puppeteer
- **Calls:** no in-repo callees resolved
- **Called By:** no in-repo caller resolved (entry point, event handler, route, or referenced by value)
- **Database Interaction:** None detected.
- **External Services:** puppeteer
- **Authentication:** No authentication logic inside this function.
- **Authorization:** No role/permission check inside this function.
- **Validation:** None detected.
- **Errors:** 1 throw, 1 .catch
- **Side Effects:** React state: `setContent`, `setViewport`; console output; DOM/window access
- **Edge Cases:** UNKNOWN (not individually reviewed)
- **Security Considerations:** None noted (not individually reviewed).
- **Current Limitations:** UNKNOWN (not individually reviewed)


## scripts/rotate-tenant-ai-secrets.mjs

### `flag`
- **File:** `scripts/rotate-tenant-ai-secrets.mjs:33-33`  · **Review:** AUTO
- **Purpose:** UNKNOWN (no in-code description; not individually reviewed)
- **Parameters:** `name`
- **Returns:** `boolean` (inferred)
- **Dependencies:** none detected
- **Calls:** no in-repo callees resolved
- **Called By:** no in-repo caller resolved (entry point, event handler, route, or referenced by value)
- **Database Interaction:** None detected.
- **External Services:** None detected.
- **Authentication:** No authentication logic inside this function.
- **Authorization:** No role/permission check inside this function.
- **Validation:** None detected.
- **Errors:** None detected.
- **Side Effects:** None detected.
- **Edge Cases:** UNKNOWN (not individually reviewed)
- **Security Considerations:** None noted (not individually reviewed).
- **Current Limitations:** UNKNOWN (not individually reviewed)

### `generateKey`
- **File:** `scripts/rotate-tenant-ai-secrets.mjs:35-35`  · **Review:** AUTO
- **Purpose:** UNKNOWN (no in-code description; not individually reviewed)
- **Parameters:** none
- **Returns:** `string` (inferred)
- **Dependencies:** crypto
- **Calls:** no in-repo callees resolved
- **Called By:** no in-repo caller resolved (entry point, event handler, route, or referenced by value)
- **Database Interaction:** None detected.
- **External Services:** None detected.
- **Authentication:** No authentication logic inside this function.
- **Authorization:** No role/permission check inside this function.
- **Validation:** None detected.
- **Errors:** None detected.
- **Side Effects:** None detected.
- **Edge Cases:** UNKNOWN (not individually reviewed)
- **Security Considerations:** None noted (not individually reviewed).
- **Current Limitations:** UNKNOWN (not individually reviewed)

### `derive`
- **File:** `scripts/rotate-tenant-ai-secrets.mjs:36-36`  · **Review:** AUTO
- **Purpose:** UNKNOWN (no in-code description; not individually reviewed)
- **Parameters:** `s`
- **Returns:** `NonSharedBuffer` (inferred)
- **Dependencies:** crypto
- **Calls:** no in-repo callees resolved
- **Called By:** no in-repo caller resolved (entry point, event handler, route, or referenced by value)
- **Database Interaction:** None detected.
- **External Services:** None detected.
- **Authentication:** No authentication logic inside this function.
- **Authorization:** No role/permission check inside this function.
- **Validation:** None detected.
- **Errors:** None detected.
- **Side Effects:** None detected.
- **Edge Cases:** UNKNOWN (not individually reviewed)
- **Security Considerations:** None noted (not individually reviewed).
- **Current Limitations:** UNKNOWN (not individually reviewed)

### `decrypt`
- **File:** `scripts/rotate-tenant-ai-secrets.mjs:62-66`  · **Review:** AUTO
- **Purpose:** UNKNOWN (no in-code description; not individually reviewed)
- **Parameters:** `payload`; `keyMaterial`
- **Returns:** `string` (inferred)
- **Dependencies:** crypto
- **Calls:** no in-repo callees resolved
- **Called By:** no in-repo caller resolved (entry point, event handler, route, or referenced by value)
- **Database Interaction:** None detected.
- **External Services:** None detected.
- **Authentication:** No authentication logic inside this function.
- **Authorization:** No role/permission check inside this function.
- **Validation:** None detected.
- **Errors:** None detected.
- **Side Effects:** React state: `setAuthTag`
- **Edge Cases:** UNKNOWN (not individually reviewed)
- **Security Considerations:** None noted (not individually reviewed).
- **Current Limitations:** UNKNOWN (not individually reviewed)

### `encrypt`
- **File:** `scripts/rotate-tenant-ai-secrets.mjs:68-73`  · **Review:** AUTO
- **Purpose:** UNKNOWN (no in-code description; not individually reviewed)
- **Parameters:** `plain`; `keyMaterial`
- **Returns:** `{ iv: string; tag: string; data: string; }` (inferred)
- **Dependencies:** crypto
- **Calls:** no in-repo callees resolved
- **Called By:** no in-repo caller resolved (entry point, event handler, route, or referenced by value)
- **Database Interaction:** None detected.
- **External Services:** None detected.
- **Authentication:** No authentication logic inside this function.
- **Authorization:** No role/permission check inside this function.
- **Validation:** None detected.
- **Errors:** None detected.
- **Side Effects:** None detected.
- **Edge Cases:** UNKNOWN (not individually reviewed)
- **Security Considerations:** None noted (not individually reviewed).
- **Current Limitations:** UNKNOWN (not individually reviewed)

### `writeEnvKey`
- **File:** `scripts/rotate-tenant-ai-secrets.mjs:115-121`  · **Review:** AUTO
- **Purpose:** UNKNOWN (no in-code description; not individually reviewed)
- **Parameters:** `value`
- **Returns:** `void` (inferred)
- **Dependencies:** fs
- **Calls:** no in-repo callees resolved
- **Called By:** no in-repo caller resolved (entry point, event handler, route, or referenced by value)
- **Database Interaction:** None detected.
- **External Services:** None detected.
- **Authentication:** No authentication logic inside this function.
- **Authorization:** No role/permission check inside this function.
- **Validation:** 1 guard/type/regex check(s) detected.
- **Errors:** None detected.
- **Side Effects:** None detected.
- **Edge Cases:** UNKNOWN (not individually reviewed)
- **Security Considerations:** None noted (not individually reviewed).
- **Current Limitations:** UNKNOWN (not individually reviewed)


## scripts/security-probes.mjs

### `check`
- **File:** `scripts/security-probes.mjs:20-24`  · **Review:** AUTO
- **Purpose:** UNKNOWN (no in-code description; not individually reviewed)
- **Parameters:** `name`; `actual`; `expected`
- **Returns:** `void` (inferred)
- **Dependencies:** none detected
- **Calls:** no in-repo callees resolved
- **Called By:** no in-repo caller resolved (entry point, event handler, route, or referenced by value)
- **Database Interaction:** None detected.
- **External Services:** None detected.
- **Authentication:** No authentication logic inside this function.
- **Authorization:** No role/permission check inside this function.
- **Validation:** 1 guard/type/regex check(s) detected.
- **Errors:** None detected.
- **Side Effects:** console output
- **Edge Cases:** UNKNOWN (not individually reviewed)
- **Security Considerations:** None noted (not individually reviewed).
- **Current Limitations:** UNKNOWN (not individually reviewed)

### `status`
- **File:** `scripts/security-probes.mjs:26-29`  · **Review:** AUTO
- **Purpose:** UNKNOWN (no in-code description; not individually reviewed)
- **Parameters:** `path`; `options = {}`
- **Returns:** `Promise<number>` (inferred)
- **Dependencies:** none detected
- **Calls:** no in-repo callees resolved
- **Called By:** no in-repo caller resolved (entry point, event handler, route, or referenced by value)
- **Database Interaction:** None detected.
- **External Services:** HTTP ${base}${path}
- **Authentication:** No authentication logic inside this function.
- **Authorization:** No role/permission check inside this function.
- **Validation:** None detected.
- **Errors:** None detected.
- **Side Effects:** None detected.
- **Edge Cases:** UNKNOWN (not individually reviewed)
- **Security Considerations:** None noted (not individually reviewed).
- **Current Limitations:** UNKNOWN (not individually reviewed)

### `json`
- **File:** `scripts/security-probes.mjs:31-35`  · **Review:** AUTO
- **Purpose:** UNKNOWN (no in-code description; not individually reviewed)
- **Parameters:** `path`; `options = {}`
- **Returns:** `Promise<{ status: number; body: any; }>` (inferred)
- **Dependencies:** none detected
- **Calls:** no in-repo callees resolved
- **Called By:** no in-repo caller resolved (entry point, event handler, route, or referenced by value)
- **Database Interaction:** None detected.
- **External Services:** HTTP ${base}${path}
- **Authentication:** No authentication logic inside this function.
- **Authorization:** No role/permission check inside this function.
- **Validation:** None detected.
- **Errors:** 1 .catch
- **Side Effects:** None detected.
- **Edge Cases:** UNKNOWN (not individually reviewed)
- **Security Considerations:** None noted (not individually reviewed).
- **Current Limitations:** UNKNOWN (not individually reviewed)


## scripts/seed-demo-roles.mjs

### `removeAll`
- **File:** `scripts/seed-demo-roles.mjs:101-129`  · **Review:** AUTO
- **Purpose:** UNKNOWN (no in-code description; not individually reviewed)
- **Parameters:** none
- **Returns:** `Promise<void>` (inferred)
- **Dependencies:** none detected
- **Calls:** no in-repo callees resolved
- **Called By:** no in-repo caller resolved (entry point, event handler, route, or referenced by value)
- **Database Interaction:** None detected.
- **External Services:** None detected.
- **Authentication:** No authentication logic inside this function.
- **Authorization:** No role/permission check inside this function.
- **Validation:** None detected.
- **Errors:** 1 try/catch, 1 .catch
- **Side Effects:** console output
- **Edge Cases:** UNKNOWN (not individually reviewed)
- **Security Considerations:** None noted (not individually reviewed).
- **Current Limitations:** UNKNOWN (not individually reviewed)

### `createAll`
- **File:** `scripts/seed-demo-roles.mjs:131-304`  · **Review:** AUTO
- **Purpose:** UNKNOWN (no in-code description; not individually reviewed)
- **Parameters:** none
- **Returns:** `Promise<void>` (inferred)
- **Dependencies:** crypto
- **Calls:** `iso` (scripts/seed-demo-roles.mjs:132)
- **Called By:** no in-repo caller resolved (entry point, event handler, route, or referenced by value)
- **Database Interaction:** None detected.
- **External Services:** None detected.
- **Authentication:** No authentication logic inside this function.
- **Authorization:** No role/permission check inside this function.
- **Validation:** None detected.
- **Errors:** 1 try/catch, 1 .catch
- **Side Effects:** React state: `setCustomUserClaims`; console output
- **Edge Cases:** UNKNOWN (not individually reviewed)
- **Security Considerations:** None noted (not individually reviewed).
- **Current Limitations:** UNKNOWN (not individually reviewed)

### `iso` (nested in `createAll`)
- **File:** `scripts/seed-demo-roles.mjs:132-132`  · **Review:** AUTO
- **Purpose:** UNKNOWN (no in-code description; not individually reviewed)
- **Parameters:** `offsetDays = 0`
- **Returns:** `string` (inferred)
- **Dependencies:** none detected
- **Calls:** no in-repo callees resolved
- **Called By:** `createAll` (scripts/seed-demo-roles.mjs:131)
- **Database Interaction:** None detected.
- **External Services:** None detected.
- **Authentication:** No authentication logic inside this function.
- **Authorization:** No role/permission check inside this function.
- **Validation:** None detected.
- **Errors:** None detected.
- **Side Effects:** None detected.
- **Edge Cases:** UNKNOWN (not individually reviewed)
- **Security Considerations:** None noted (not individually reviewed).
- **Current Limitations:** UNKNOWN (not individually reviewed)


## scripts/seed-firebase-auth.ts

### `seedFirebaseAuthUsers`
- **File:** `scripts/seed-firebase-auth.ts:24-64`  · **Review:** AUTO
- **Purpose:** UNKNOWN (no in-code description; not individually reviewed)
- **Parameters:** none
- **Returns:** `Promise<void>` (inferred)
- **Dependencies:** firebase
- **Calls:** no in-repo callees resolved
- **Called By:** no in-repo caller resolved (entry point, event handler, route, or referenced by value)
- **Database Interaction:** None detected.
- **External Services:** None detected.
- **Authentication:** No authentication logic inside this function.
- **Authorization:** No role/permission check inside this function.
- **Validation:** 1 guard/type/regex check(s) detected.
- **Errors:** 1 try/catch, 1 throw
- **Side Effects:** console output
- **Edge Cases:** UNKNOWN (not individually reviewed)
- **Security Considerations:** Uses `any` typing.
- **Current Limitations:** UNKNOWN (not individually reviewed)


## scripts/seed-tenant-demo.mjs

### `hasFlag`
- **File:** `scripts/seed-tenant-demo.mjs:33-33`  · **Review:** AUTO
- **Purpose:** UNKNOWN (no in-code description; not individually reviewed)
- **Parameters:** `flag`
- **Returns:** `boolean` (inferred)
- **Dependencies:** none detected
- **Calls:** no in-repo callees resolved
- **Called By:** `knownTenants` (scripts/seed-tenant-demo.mjs:143)
- **Database Interaction:** None detected.
- **External Services:** None detected.
- **Authentication:** No authentication logic inside this function.
- **Authorization:** No role/permission check inside this function.
- **Validation:** None detected.
- **Errors:** None detected.
- **Side Effects:** None detected.
- **Edge Cases:** UNKNOWN (not individually reviewed)
- **Security Considerations:** None noted (not individually reviewed).
- **Current Limitations:** UNKNOWN (not individually reviewed)

### `getArg`
- **File:** `scripts/seed-tenant-demo.mjs:34-38`  · **Review:** AUTO
- **Purpose:** UNKNOWN (no in-code description; not individually reviewed)
- **Parameters:** `name`
- **Returns:** `string` (inferred)
- **Dependencies:** none detected
- **Calls:** no in-repo callees resolved
- **Called By:** `knownTenants` (scripts/seed-tenant-demo.mjs:143)
- **Database Interaction:** None detected.
- **External Services:** None detected.
- **Authentication:** No authentication logic inside this function.
- **Authorization:** No role/permission check inside this function.
- **Validation:** None detected.
- **Errors:** None detected.
- **Side Effects:** None detected.
- **Edge Cases:** UNKNOWN (not individually reviewed)
- **Security Considerations:** None noted (not individually reviewed).
- **Current Limitations:** UNKNOWN (not individually reviewed)

### `tenantEmails`
- **File:** `scripts/seed-tenant-demo.mjs:115-124`  · **Review:** AUTO
- **Purpose:** In-code comment: ---------------------------------------------------------------- helpers
- **Parameters:** `tenantId`
- **Returns:** `{ admin: string; registrar: string; teacher: string; parent: string; }` (inferred)
- **Dependencies:** admin
- **Calls:** no in-repo callees resolved
- **Called By:** `inspectTenants` (scripts/seed-tenant-demo.mjs:166), `removeTenants` (scripts/seed-tenant-demo.mjs:203), `seedTenant` (scripts/seed-tenant-demo.mjs:240)
- **Database Interaction:** None detected.
- **External Services:** None detected.
- **Authentication:** No authentication logic inside this function.
- **Authorization:** No role/permission check inside this function.
- **Validation:** None detected.
- **Errors:** None detected.
- **Side Effects:** None detected.
- **Edge Cases:** UNKNOWN (not individually reviewed)
- **Security Considerations:** None noted (not individually reviewed).
- **Current Limitations:** UNKNOWN (not individually reviewed)

### `demoStudentIds`
- **File:** `scripts/seed-tenant-demo.mjs:126-126`  · **Review:** AUTO
- **Purpose:** UNKNOWN (no in-code description; not individually reviewed)
- **Parameters:** `tenantId`
- **Returns:** `string[]` (inferred)
- **Dependencies:** none detected
- **Calls:** no in-repo callees resolved
- **Called By:** `seedTenant` (scripts/seed-tenant-demo.mjs:240)
- **Database Interaction:** None detected.
- **External Services:** None detected.
- **Authentication:** No authentication logic inside this function.
- **Authorization:** No role/permission check inside this function.
- **Validation:** None detected.
- **Errors:** None detected.
- **Side Effects:** None detected.
- **Edge Cases:** UNKNOWN (not individually reviewed)
- **Security Considerations:** None noted (not individually reviewed).
- **Current Limitations:** UNKNOWN (not individually reviewed)

### `demoSessionId`
- **File:** `scripts/seed-tenant-demo.mjs:127-127`  · **Review:** AUTO
- **Purpose:** UNKNOWN (no in-code description; not individually reviewed)
- **Parameters:** `tenantId`
- **Returns:** `string` (inferred)
- **Dependencies:** none detected
- **Calls:** no in-repo callees resolved
- **Called By:** `seedTenant` (scripts/seed-tenant-demo.mjs:240)
- **Database Interaction:** None detected.
- **External Services:** None detected.
- **Authentication:** No authentication logic inside this function.
- **Authorization:** No role/permission check inside this function.
- **Validation:** None detected.
- **Errors:** None detected.
- **Side Effects:** None detected.
- **Edge Cases:** UNKNOWN (not individually reviewed)
- **Security Considerations:** None noted (not individually reviewed).
- **Current Limitations:** UNKNOWN (not individually reviewed)

### `demoNotificationId`
- **File:** `scripts/seed-tenant-demo.mjs:128-128`  · **Review:** AUTO
- **Purpose:** UNKNOWN (no in-code description; not individually reviewed)
- **Parameters:** `tenantId`
- **Returns:** `string` (inferred)
- **Dependencies:** none detected
- **Calls:** no in-repo callees resolved
- **Called By:** `seedTenant` (scripts/seed-tenant-demo.mjs:240)
- **Database Interaction:** None detected.
- **External Services:** None detected.
- **Authentication:** No authentication logic inside this function.
- **Authorization:** No role/permission check inside this function.
- **Validation:** None detected.
- **Errors:** None detected.
- **Side Effects:** None detected.
- **Edge Cases:** UNKNOWN (not individually reviewed)
- **Security Considerations:** None noted (not individually reviewed).
- **Current Limitations:** UNKNOWN (not individually reviewed)

### `demoJustificationId`
- **File:** `scripts/seed-tenant-demo.mjs:129-129`  · **Review:** AUTO
- **Purpose:** UNKNOWN (no in-code description; not individually reviewed)
- **Parameters:** `tenantId`
- **Returns:** `string` (inferred)
- **Dependencies:** none detected
- **Calls:** no in-repo callees resolved
- **Called By:** `seedTenant` (scripts/seed-tenant-demo.mjs:240)
- **Database Interaction:** None detected.
- **External Services:** None detected.
- **Authentication:** No authentication logic inside this function.
- **Authorization:** No role/permission check inside this function.
- **Validation:** None detected.
- **Errors:** None detected.
- **Side Effects:** None detected.
- **Edge Cases:** UNKNOWN (not individually reviewed)
- **Security Considerations:** None noted (not individually reviewed).
- **Current Limitations:** UNKNOWN (not individually reviewed)

### `defaultSubscription`
- **File:** `scripts/seed-tenant-demo.mjs:131-141`  · **Review:** AUTO
- **Purpose:** UNKNOWN (no in-code description; not individually reviewed)
- **Parameters:** none
- **Returns:** `{ plan: string; status: string; billingCycle: string; currentPeriodStart: any; currentPeriodEnd: any; gracePeriodDays: number; autoRenew: boolean; manuallySuspended: boolean; limits: {}; }` (inferred)
- **Dependencies:** none detected
- **Calls:** no in-repo callees resolved
- **Called By:** `seedTenant` (scripts/seed-tenant-demo.mjs:240)
- **Database Interaction:** None detected.
- **External Services:** None detected.
- **Authentication:** No authentication logic inside this function.
- **Authorization:** No role/permission check inside this function.
- **Validation:** None detected.
- **Errors:** None detected.
- **Side Effects:** None detected.
- **Edge Cases:** UNKNOWN (not individually reviewed)
- **Security Considerations:** None noted (not individually reviewed).
- **Current Limitations:** UNKNOWN (not individually reviewed)

### `knownTenants`
- **File:** `scripts/seed-tenant-demo.mjs:143-158`  · **Review:** AUTO
- **Purpose:** UNKNOWN (no in-code description; not individually reviewed)
- **Parameters:** none
- **Returns:** `string[]` (inferred)
- **Dependencies:** none detected
- **Calls:** `getArg` (scripts/seed-tenant-demo.mjs:34), `hasFlag` (scripts/seed-tenant-demo.mjs:33)
- **Called By:** no in-repo caller resolved (entry point, event handler, route, or referenced by value)
- **Database Interaction:** None detected.
- **External Services:** None detected.
- **Authentication:** No authentication logic inside this function.
- **Authorization:** No role/permission check inside this function.
- **Validation:** None detected.
- **Errors:** None detected.
- **Side Effects:** console output
- **Edge Cases:** UNKNOWN (not individually reviewed)
- **Security Considerations:** None noted (not individually reviewed).
- **Current Limitations:** UNKNOWN (not individually reviewed)

### `countQuery`
- **File:** `scripts/seed-tenant-demo.mjs:160-163`  · **Review:** AUTO
- **Purpose:** UNKNOWN (no in-code description; not individually reviewed)
- **Parameters:** `collection`; `tenantId`
- **Returns:** `Promise<number>` (inferred)
- **Dependencies:** none detected
- **Calls:** no in-repo callees resolved
- **Called By:** `inspectTenants` (scripts/seed-tenant-demo.mjs:166)
- **Database Interaction:** None detected.
- **External Services:** None detected.
- **Authentication:** No authentication logic inside this function.
- **Authorization:** No role/permission check inside this function.
- **Validation:** None detected.
- **Errors:** None detected.
- **Side Effects:** None detected.
- **Edge Cases:** UNKNOWN (not individually reviewed)
- **Security Considerations:** None noted (not individually reviewed).
- **Current Limitations:** UNKNOWN (not individually reviewed)

### `inspectTenants`
- **File:** `scripts/seed-tenant-demo.mjs:166-200`  · **Review:** AUTO
- **Purpose:** In-code comment: ---------------------------------------------------------------- inspect
- **Parameters:** `tenantIds`
- **Returns:** `Promise<void>` (inferred)
- **Dependencies:** none detected
- **Calls:** `countQuery` (scripts/seed-tenant-demo.mjs:160), `tenantEmails` (scripts/seed-tenant-demo.mjs:115)
- **Called By:** no in-repo caller resolved (entry point, event handler, route, or referenced by value)
- **Database Interaction:** None detected.
- **External Services:** None detected.
- **Authentication:** No authentication logic inside this function.
- **Authorization:** No role/permission check inside this function.
- **Validation:** 1 guard/type/regex check(s) detected.
- **Errors:** 1 try/catch
- **Side Effects:** console output
- **Edge Cases:** UNKNOWN (not individually reviewed)
- **Security Considerations:** None noted (not individually reviewed).
- **Current Limitations:** UNKNOWN (not individually reviewed)

### `removeTenants`
- **File:** `scripts/seed-tenant-demo.mjs:203-237`  · **Review:** AUTO
- **Purpose:** In-code comment: ---------------------------------------------------------------- remove
- **Parameters:** `tenantIds`
- **Returns:** `Promise<void>` (inferred)
- **Dependencies:** none detected
- **Calls:** `tenantEmails` (scripts/seed-tenant-demo.mjs:115)
- **Called By:** no in-repo caller resolved (entry point, event handler, route, or referenced by value)
- **Database Interaction:** None detected.
- **External Services:** None detected.
- **Authentication:** No authentication logic inside this function.
- **Authorization:** No role/permission check inside this function.
- **Validation:** None detected.
- **Errors:** 1 try/catch, 2 .catch
- **Side Effects:** console output
- **Edge Cases:** UNKNOWN (not individually reviewed)
- **Security Considerations:** None noted (not individually reviewed).
- **Current Limitations:** UNKNOWN (not individually reviewed)

### `seedTenant`
- **File:** `scripts/seed-tenant-demo.mjs:240-458`  · **Review:** AUTO
- **Purpose:** In-code comment: ---------------------------------------------------------------- create
- **Parameters:** `tenantId`
- **Returns:** `Promise<{ role: string; email: any; password: string; tenantId: any; }[]>` (inferred)
- **Dependencies:** admin, crypto
- **Calls:** `demoSessionId` (scripts/seed-tenant-demo.mjs:127), `tenantEmails` (scripts/seed-tenant-demo.mjs:115), `defaultSubscription` (scripts/seed-tenant-demo.mjs:131), `demoStudentIds` (scripts/seed-tenant-demo.mjs:126), `demoJustificationId` (scripts/seed-tenant-demo.mjs:129), `demoNotificationId` (scripts/seed-tenant-demo.mjs:128)
- **Called By:** no in-repo caller resolved (entry point, event handler, route, or referenced by value)
- **Database Interaction:** None detected.
- **External Services:** None detected.
- **Authentication:** No authentication logic inside this function.
- **Authorization:** No role/permission check inside this function.
- **Validation:** 2 guard/type/regex check(s) detected.
- **Errors:** 1 try/catch, 1 .catch
- **Side Effects:** React state: `setCustomUserClaims`; console output
- **Edge Cases:** UNKNOWN (not individually reviewed)
- **Security Considerations:** None noted (not individually reviewed).
- **Current Limitations:** UNKNOWN (not individually reviewed)


## scripts/test-browser-fetch.mjs

### `testBrowserFetch`
- **File:** `scripts/test-browser-fetch.mjs:3-57`  · **Review:** AUTO
- **Purpose:** UNKNOWN (no in-code description; not individually reviewed)
- **Parameters:** none
- **Returns:** `Promise<void>` (inferred)
- **Dependencies:** puppeteer
- **Calls:** no in-repo callees resolved
- **Called By:** no in-repo caller resolved (entry point, event handler, route, or referenced by value)
- **Database Interaction:** None detected.
- **External Services:** HTTP /api/pdf/generate, puppeteer
- **Authentication:** No authentication logic inside this function.
- **Authorization:** No role/permission check inside this function.
- **Validation:** None detected.
- **Errors:** 1 try/catch
- **Side Effects:** console output
- **Edge Cases:** UNKNOWN (not individually reviewed)
- **Security Considerations:** None noted (not individually reviewed).
- **Current Limitations:** UNKNOWN (not individually reviewed)


## scripts/test-firestore-rules.mjs

### `expectAllowed`
- **File:** `scripts/test-firestore-rules.mjs:324-332`  · **Review:** AUTO
- **Purpose:** UNKNOWN (no in-code description; not individually reviewed)
- **Parameters:** `name`; `operation`
- **Returns:** `Promise<void>` (inferred)
- **Dependencies:** none detected
- **Calls:** no in-repo callees resolved
- **Called By:** no in-repo caller resolved (entry point, event handler, route, or referenced by value)
- **Database Interaction:** None detected.
- **External Services:** None detected.
- **Authentication:** No authentication logic inside this function.
- **Authorization:** No role/permission check inside this function.
- **Validation:** None detected.
- **Errors:** 1 try/catch
- **Side Effects:** console output
- **Edge Cases:** UNKNOWN (not individually reviewed)
- **Security Considerations:** None noted (not individually reviewed).
- **Current Limitations:** UNKNOWN (not individually reviewed)

### `expectDenied`
- **File:** `scripts/test-firestore-rules.mjs:334-342`  · **Review:** AUTO
- **Purpose:** UNKNOWN (no in-code description; not individually reviewed)
- **Parameters:** `name`; `operation`
- **Returns:** `Promise<void>` (inferred)
- **Dependencies:** none detected
- **Calls:** no in-repo callees resolved
- **Called By:** no in-repo caller resolved (entry point, event handler, route, or referenced by value)
- **Database Interaction:** None detected.
- **External Services:** None detected.
- **Authentication:** No authentication logic inside this function.
- **Authorization:** No role/permission check inside this function.
- **Validation:** None detected.
- **Errors:** 1 try/catch
- **Side Effects:** console output
- **Edge Cases:** UNKNOWN (not individually reviewed)
- **Security Considerations:** None noted (not individually reviewed).
- **Current Limitations:** UNKNOWN (not individually reviewed)

### `setSchool2Subscription`
- **File:** `scripts/test-firestore-rules.mjs:526-530`  · **Review:** AUTO
- **Purpose:** In-code comment: --- Subscription enforcement per school ------------------------------------
- **Parameters:** `subscription`
- **Returns:** `Promise<void>` (inferred)
- **Dependencies:** firestore
- **Calls:** no in-repo callees resolved
- **Called By:** no in-repo caller resolved (entry point, event handler, route, or referenced by value)
- **Database Interaction:** WRITE on `tenants`
- **External Services:** None detected.
- **Authentication:** No authentication logic inside this function.
- **Authorization:** No role/permission check inside this function.
- **Validation:** None detected.
- **Errors:** None detected.
- **Side Effects:** React state: `setDoc`
- **Edge Cases:** UNKNOWN (not individually reviewed)
- **Security Considerations:** None noted (not individually reviewed).
- **Current Limitations:** UNKNOWN (not individually reviewed)


## scripts/test-full-report.mjs

### `testFullReport`
- **File:** `scripts/test-full-report.mjs:3-130`  · **Review:** AUTO
- **Purpose:** UNKNOWN (no in-code description; not individually reviewed)
- **Parameters:** none
- **Returns:** `Promise<void>` (inferred)
- **Dependencies:** fs
- **Calls:** no in-repo callees resolved
- **Called By:** no in-repo caller resolved (entry point, event handler, route, or referenced by value)
- **Database Interaction:** None detected.
- **External Services:** HTTP http://127.0.0.1:3000/api/pdf/generate
- **Authentication:** No authentication logic inside this function.
- **Authorization:** No role/permission check inside this function.
- **Validation:** None detected.
- **Errors:** None detected.
- **Side Effects:** console output
- **Edge Cases:** UNKNOWN (not individually reviewed)
- **Security Considerations:** None noted (not individually reviewed).
- **Current Limitations:** UNKNOWN (not individually reviewed)


## scripts/test-generate-pdf.mjs

### `generate`
- **File:** `scripts/test-generate-pdf.mjs:3-25`  · **Review:** AUTO
- **Purpose:** UNKNOWN (no in-code description; not individually reviewed)
- **Parameters:** none
- **Returns:** `Promise<void>` (inferred)
- **Dependencies:** fs
- **Calls:** no in-repo callees resolved
- **Called By:** no in-repo caller resolved (entry point, event handler, route, or referenced by value)
- **Database Interaction:** None detected.
- **External Services:** HTTP http://127.0.0.1:3000/api/pdf/generate
- **Authentication:** No authentication logic inside this function.
- **Authorization:** No role/permission check inside this function.
- **Validation:** None detected.
- **Errors:** None detected.
- **Side Effects:** console output
- **Edge Cases:** UNKNOWN (not individually reviewed)
- **Security Considerations:** None noted (not individually reviewed).
- **Current Limitations:** UNKNOWN (not individually reviewed)


## scripts/test_key.ts

### `testApiKey`
- **File:** `scripts/test_key.ts:5-28`  · **Review:** AUTO
- **Purpose:** UNKNOWN (no in-code description; not individually reviewed)
- **Parameters:** none
- **Returns:** `Promise<void>` (inferred)
- **Dependencies:** GoogleGenAI
- **Calls:** no in-repo callees resolved
- **Called By:** no in-repo caller resolved (entry point, event handler, route, or referenced by value)
- **Database Interaction:** None detected.
- **External Services:** Gemini
- **Authentication:** No authentication logic inside this function.
- **Authorization:** No role/permission check inside this function.
- **Validation:** None detected.
- **Errors:** 1 try/catch
- **Side Effects:** console output
- **Edge Cases:** UNKNOWN (not individually reviewed)
- **Security Considerations:** Uses `any` typing.
- **Current Limitations:** UNKNOWN (not individually reviewed)


## scripts/validate-all-print-functions.mjs

### `runValidation`
- **File:** `scripts/validate-all-print-functions.mjs:250-370`  · **Review:** AUTO
- **Purpose:** UNKNOWN (no in-code description; not individually reviewed)
- **Parameters:** none
- **Returns:** `Promise<void>` (inferred)
- **Dependencies:** fs, puppeteer
- **Calls:** no in-repo callees resolved
- **Called By:** no in-repo caller resolved (entry point, event handler, route, or referenced by value)
- **Database Interaction:** None detected.
- **External Services:** puppeteer
- **Authentication:** No authentication logic inside this function.
- **Authorization:** No role/permission check inside this function.
- **Validation:** 3 guard/type/regex check(s) detected.
- **Errors:** 3 throw, 1 .catch
- **Side Effects:** React state: `setContent`, `setViewport`; console output; DOM/window access
- **Edge Cases:** UNKNOWN (not individually reviewed)
- **Security Considerations:** None noted (not individually reviewed).
- **Current Limitations:** UNKNOWN (not individually reviewed)



# Tests


## src/config/subscription.test.ts

### `findUndefinedPaths`
- **File:** `src/config/subscription.test.ts:16-27`  · **Review:** AUTO
- **Purpose:** In-code comment: Firestore rejects documents containing `undefined`, so the model must be clean.
- **Parameters:** `value: unknown`; `path = 'root'`
- **Returns:** `string[]` (declared)
- **Dependencies:** none detected
- **Calls:** no in-repo callees resolved
- **Called By:** no in-repo caller resolved (entry point, event handler, route, or referenced by value)
- **Database Interaction:** None detected.
- **External Services:** None detected.
- **Authentication:** No authentication logic inside this function.
- **Authorization:** No role/permission check inside this function.
- **Validation:** 1 guard/type/regex check(s) detected.
- **Errors:** None detected.
- **Side Effects:** None detected.
- **Edge Cases:** UNKNOWN (not individually reviewed)
- **Security Considerations:** None noted (not individually reviewed).
- **Current Limitations:** UNKNOWN (not individually reviewed)


## src/utils/attendanceAccess.test.ts

### `makeSession`
- **File:** `src/utils/attendanceAccess.test.ts:11-20`  · **Review:** AUTO
- **Purpose:** UNKNOWN (no in-code description; not individually reviewed)
- **Parameters:** `overrides: Partial<AttendanceSession> = {}`
- **Returns:** `AttendanceSession` (declared)
- **Dependencies:** none detected
- **Calls:** no in-repo callees resolved
- **Called By:** no in-repo caller resolved (entry point, event handler, route, or referenced by value)
- **Database Interaction:** None detected.
- **External Services:** None detected.
- **Authentication:** No authentication logic inside this function.
- **Authorization:** No role/permission check inside this function.
- **Validation:** None detected.
- **Errors:** None detected.
- **Side Effects:** None detected.
- **Edge Cases:** UNKNOWN (not individually reviewed)
- **Security Considerations:** None noted (not individually reviewed).
- **Current Limitations:** UNKNOWN (not individually reviewed)

### `makeUser`
- **File:** `src/utils/attendanceAccess.test.ts:22-33`  · **Review:** AUTO
- **Purpose:** UNKNOWN (no in-code description; not individually reviewed)
- **Parameters:** `overrides: Partial<UserProfile> = {}`
- **Returns:** `UserProfile` (declared)
- **Dependencies:** none detected
- **Calls:** no in-repo callees resolved
- **Called By:** no in-repo caller resolved (entry point, event handler, route, or referenced by value)
- **Database Interaction:** None detected.
- **External Services:** None detected.
- **Authentication:** No authentication logic inside this function.
- **Authorization:** No role/permission check inside this function.
- **Validation:** None detected.
- **Errors:** None detected.
- **Side Effects:** None detected.
- **Edge Cases:** UNKNOWN (not individually reviewed)
- **Security Considerations:** None noted (not individually reviewed).
- **Current Limitations:** UNKNOWN (not individually reviewed)


## src/utils/calculationsAudit.test.ts

### `calculateStudentAttendanceRate`
- **File:** `src/utils/calculationsAudit.test.ts:12-19`  · **Review:** AUTO
- **Purpose:** In-code comment: 1. Audit Calculation Helpers matching production business logic
- **Parameters:** `totalAbsences: number`; `totalPossibleDays = 20`
- **Returns:** `number` (declared)
- **Dependencies:** none detected
- **Calls:** no in-repo callees resolved
- **Called By:** no in-repo caller resolved (entry point, event handler, route, or referenced by value)
- **Database Interaction:** None detected.
- **External Services:** None detected.
- **Authentication:** No authentication logic inside this function.
- **Authorization:** No role/permission check inside this function.
- **Validation:** None detected.
- **Errors:** None detected.
- **Side Effects:** None detected.
- **Edge Cases:** UNKNOWN (not individually reviewed)
- **Security Considerations:** None noted (not individually reviewed).
- **Current Limitations:** UNKNOWN (not individually reviewed)

### `calculateSchoolAverageAttendance`
- **File:** `src/utils/calculationsAudit.test.ts:21-26`  · **Review:** AUTO
- **Purpose:** UNKNOWN (no in-code description; not individually reviewed)
- **Parameters:** `students: Student[]`
- **Returns:** `string` (declared)
- **Dependencies:** none detected
- **Calls:** no in-repo callees resolved
- **Called By:** no in-repo caller resolved (entry point, event handler, route, or referenced by value)
- **Database Interaction:** None detected.
- **External Services:** None detected.
- **Authentication:** No authentication logic inside this function.
- **Authorization:** No role/permission check inside this function.
- **Validation:** None detected.
- **Errors:** None detected.
- **Side Effects:** None detected.
- **Edge Cases:** UNKNOWN (not individually reviewed)
- **Security Considerations:** None noted (not individually reviewed).
- **Current Limitations:** UNKNOWN (not individually reviewed)

### `classifyChronicAbsenceRiskTier`
- **File:** `src/utils/calculationsAudit.test.ts:28-33`  · **Review:** AUTO
- **Purpose:** UNKNOWN (no in-code description; not individually reviewed)
- **Parameters:** `totalAbsences: number`
- **Returns:** `'normal' | 'tier1_warning' | 'tier2_high' | 'tier3_critical'` (declared)
- **Dependencies:** none detected
- **Calls:** no in-repo callees resolved
- **Called By:** no in-repo caller resolved (entry point, event handler, route, or referenced by value)
- **Database Interaction:** None detected.
- **External Services:** None detected.
- **Authentication:** No authentication logic inside this function.
- **Authorization:** No role/permission check inside this function.
- **Validation:** None detected.
- **Errors:** None detected.
- **Side Effects:** None detected.
- **Edge Cases:** UNKNOWN (not individually reviewed)
- **Security Considerations:** None noted (not individually reviewed).
- **Current Limitations:** UNKNOWN (not individually reviewed)

### `aggregateClassSummaries`
- **File:** `src/utils/calculationsAudit.test.ts:35-58`  · **Review:** AUTO
- **Purpose:** UNKNOWN (no in-code description; not individually reviewed)
- **Parameters:** `students: Student[]`
- **Returns:** `Record<string, { total: number; active: number; avgRate: number }>` (declared)
- **Dependencies:** none detected
- **Calls:** no in-repo callees resolved
- **Called By:** no in-repo caller resolved (entry point, event handler, route, or referenced by value)
- **Database Interaction:** None detected.
- **External Services:** None detected.
- **Authentication:** No authentication logic inside this function.
- **Authorization:** No role/permission check inside this function.
- **Validation:** 1 guard/type/regex check(s) detected.
- **Errors:** None detected.
- **Side Effects:** None detected.
- **Edge Cases:** UNKNOWN (not individually reviewed)
- **Security Considerations:** None noted (not individually reviewed).
- **Current Limitations:** UNKNOWN (not individually reviewed)

### `calculateConsecutiveStreak`
- **File:** `src/utils/calculationsAudit.test.ts:60-77`  · **Review:** AUTO
- **Purpose:** UNKNOWN (no in-code description; not individually reviewed)
- **Parameters:** `studentId: string`; `sessions: AttendanceSession[]`
- **Returns:** `number` (declared)
- **Dependencies:** none detected
- **Calls:** no in-repo callees resolved
- **Called By:** no in-repo caller resolved (entry point, event handler, route, or referenced by value)
- **Database Interaction:** None detected.
- **External Services:** None detected.
- **Authentication:** No authentication logic inside this function.
- **Authorization:** No role/permission check inside this function.
- **Validation:** None detected.
- **Errors:** None detected.
- **Side Effects:** None detected.
- **Edge Cases:** UNKNOWN (not individually reviewed)
- **Security Considerations:** None noted (not individually reviewed).
- **Current Limitations:** UNKNOWN (not individually reviewed)


## src/utils/countryCallingCodes.test.ts

### `getItem`
- **File:** `src/utils/countryCallingCodes.test.ts:14-14`  · **Review:** AUTO
- **Purpose:** UNKNOWN (no in-code description; not individually reviewed)
- **Parameters:** `k: string`
- **Returns:** `string` (inferred)
- **Dependencies:** none detected
- **Calls:** no in-repo callees resolved
- **Called By:** no in-repo caller resolved (entry point, event handler, route, or referenced by value)
- **Database Interaction:** None detected.
- **External Services:** None detected.
- **Authentication:** No authentication logic inside this function.
- **Authorization:** No role/permission check inside this function.
- **Validation:** None detected.
- **Errors:** None detected.
- **Side Effects:** None detected.
- **Edge Cases:** UNKNOWN (not individually reviewed)
- **Security Considerations:** None noted (not individually reviewed).
- **Current Limitations:** UNKNOWN (not individually reviewed)

### `setItem`
- **File:** `src/utils/countryCallingCodes.test.ts:15-17`  · **Review:** AUTO
- **Purpose:** UNKNOWN (no in-code description; not individually reviewed)
- **Parameters:** `k: string`; `v: string`
- **Returns:** `void` (inferred)
- **Dependencies:** none detected
- **Calls:** no in-repo callees resolved
- **Called By:** no in-repo caller resolved (entry point, event handler, route, or referenced by value)
- **Database Interaction:** None detected.
- **External Services:** None detected.
- **Authentication:** No authentication logic inside this function.
- **Authorization:** No role/permission check inside this function.
- **Validation:** None detected.
- **Errors:** None detected.
- **Side Effects:** None detected.
- **Edge Cases:** UNKNOWN (not individually reviewed)
- **Security Considerations:** None noted (not individually reviewed).
- **Current Limitations:** UNKNOWN (not individually reviewed)

### `removeItem`
- **File:** `src/utils/countryCallingCodes.test.ts:18-20`  · **Review:** AUTO
- **Purpose:** UNKNOWN (no in-code description; not individually reviewed)
- **Parameters:** `k: string`
- **Returns:** `void` (inferred)
- **Dependencies:** none detected
- **Calls:** no in-repo callees resolved
- **Called By:** no in-repo caller resolved (entry point, event handler, route, or referenced by value)
- **Database Interaction:** None detected.
- **External Services:** None detected.
- **Authentication:** No authentication logic inside this function.
- **Authorization:** No role/permission check inside this function.
- **Validation:** None detected.
- **Errors:** None detected.
- **Side Effects:** None detected.
- **Edge Cases:** UNKNOWN (not individually reviewed)
- **Security Considerations:** None noted (not individually reviewed).
- **Current Limitations:** UNKNOWN (not individually reviewed)

### `clear`
- **File:** `src/utils/countryCallingCodes.test.ts:21-23`  · **Review:** AUTO
- **Purpose:** UNKNOWN (no in-code description; not individually reviewed)
- **Parameters:** none
- **Returns:** `void` (inferred)
- **Dependencies:** none detected
- **Calls:** no in-repo callees resolved
- **Called By:** no in-repo caller resolved (entry point, event handler, route, or referenced by value)
- **Database Interaction:** None detected.
- **External Services:** None detected.
- **Authentication:** No authentication logic inside this function.
- **Authorization:** No role/permission check inside this function.
- **Validation:** None detected.
- **Errors:** None detected.
- **Side Effects:** None detected.
- **Edge Cases:** UNKNOWN (not individually reviewed)
- **Security Considerations:** None noted (not individually reviewed).
- **Current Limitations:** UNKNOWN (not individually reviewed)

### `key`
- **File:** `src/utils/countryCallingCodes.test.ts:24-24`  · **Review:** AUTO
- **Purpose:** UNKNOWN (no in-code description; not individually reviewed)
- **Parameters:** none
- **Returns:** `any` (inferred)
- **Dependencies:** none detected
- **Calls:** no in-repo callees resolved
- **Called By:** no in-repo caller resolved (entry point, event handler, route, or referenced by value)
- **Database Interaction:** None detected.
- **External Services:** None detected.
- **Authentication:** No authentication logic inside this function.
- **Authorization:** No role/permission check inside this function.
- **Validation:** None detected.
- **Errors:** None detected.
- **Side Effects:** None detected.
- **Edge Cases:** UNKNOWN (not individually reviewed)
- **Security Considerations:** None noted (not individually reviewed).
- **Current Limitations:** UNKNOWN (not individually reviewed)


## src/utils/hardcodedCredentials.test.ts

### `collectSourceFiles`
- **File:** `src/utils/hardcodedCredentials.test.ts:9-23`  · **Review:** AUTO
- **Purpose:** UNKNOWN (no in-code description; not individually reviewed)
- **Parameters:** `entry: string`
- **Returns:** `string[]` (declared)
- **Dependencies:** fs
- **Calls:** no in-repo callees resolved
- **Called By:** no in-repo caller resolved (entry point, event handler, route, or referenced by value)
- **Database Interaction:** None detected.
- **External Services:** None detected.
- **Authentication:** No authentication logic inside this function.
- **Authorization:** No role/permission check inside this function.
- **Validation:** 2 guard/type/regex check(s) detected.
- **Errors:** None detected.
- **Side Effects:** None detected.
- **Edge Cases:** UNKNOWN (not individually reviewed)
- **Security Considerations:** None noted (not individually reviewed).
- **Current Limitations:** UNKNOWN (not individually reviewed)


## src/utils/localCache.test.ts

### `makeFakeStorage`
- **File:** `src/utils/localCache.test.ts:12-30`  · **Review:** AUTO
- **Purpose:** UNKNOWN (no in-code description; not individually reviewed)
- **Parameters:** none
- **Returns:** `FakeStorage` (declared)
- **Dependencies:** none detected
- **Calls:** no in-repo callees resolved
- **Called By:** no in-repo caller resolved (entry point, event handler, route, or referenced by value)
- **Database Interaction:** None detected.
- **External Services:** None detected.
- **Authentication:** No authentication logic inside this function.
- **Authorization:** No role/permission check inside this function.
- **Validation:** None detected.
- **Errors:** None detected.
- **Side Effects:** None detected.
- **Edge Cases:** UNKNOWN (not individually reviewed)
- **Security Considerations:** None noted (not individually reviewed).
- **Current Limitations:** UNKNOWN (not individually reviewed)

### `getItem` (nested in `makeFakeStorage`)
- **File:** `src/utils/localCache.test.ts:15-15`  · **Review:** AUTO
- **Purpose:** UNKNOWN (no in-code description; not individually reviewed)
- **Parameters:** `key: string`
- **Returns:** `string` (inferred)
- **Dependencies:** none detected
- **Calls:** no in-repo callees resolved
- **Called By:** no in-repo caller resolved (entry point, event handler, route, or referenced by value)
- **Database Interaction:** None detected.
- **External Services:** None detected.
- **Authentication:** No authentication logic inside this function.
- **Authorization:** No role/permission check inside this function.
- **Validation:** None detected.
- **Errors:** None detected.
- **Side Effects:** None detected.
- **Edge Cases:** UNKNOWN (not individually reviewed)
- **Security Considerations:** None noted (not individually reviewed).
- **Current Limitations:** UNKNOWN (not individually reviewed)

### `setItem` (nested in `makeFakeStorage`)
- **File:** `src/utils/localCache.test.ts:16-18`  · **Review:** AUTO
- **Purpose:** UNKNOWN (no in-code description; not individually reviewed)
- **Parameters:** `key: string`; `value: string`
- **Returns:** `void` (inferred)
- **Dependencies:** none detected
- **Calls:** no in-repo callees resolved
- **Called By:** no in-repo caller resolved (entry point, event handler, route, or referenced by value)
- **Database Interaction:** None detected.
- **External Services:** None detected.
- **Authentication:** No authentication logic inside this function.
- **Authorization:** No role/permission check inside this function.
- **Validation:** None detected.
- **Errors:** None detected.
- **Side Effects:** None detected.
- **Edge Cases:** UNKNOWN (not individually reviewed)
- **Security Considerations:** None noted (not individually reviewed).
- **Current Limitations:** UNKNOWN (not individually reviewed)

### `removeItem` (nested in `makeFakeStorage`)
- **File:** `src/utils/localCache.test.ts:19-21`  · **Review:** AUTO
- **Purpose:** UNKNOWN (no in-code description; not individually reviewed)
- **Parameters:** `key: string`
- **Returns:** `void` (inferred)
- **Dependencies:** none detected
- **Calls:** no in-repo callees resolved
- **Called By:** no in-repo caller resolved (entry point, event handler, route, or referenced by value)
- **Database Interaction:** None detected.
- **External Services:** None detected.
- **Authentication:** No authentication logic inside this function.
- **Authorization:** No role/permission check inside this function.
- **Validation:** None detected.
- **Errors:** None detected.
- **Side Effects:** None detected.
- **Edge Cases:** UNKNOWN (not individually reviewed)
- **Security Considerations:** None noted (not individually reviewed).
- **Current Limitations:** UNKNOWN (not individually reviewed)

### `clear` (nested in `makeFakeStorage`)
- **File:** `src/utils/localCache.test.ts:22-22`  · **Review:** AUTO
- **Purpose:** UNKNOWN (no in-code description; not individually reviewed)
- **Parameters:** none
- **Returns:** `void` (inferred)
- **Dependencies:** none detected
- **Calls:** no in-repo callees resolved
- **Called By:** no in-repo caller resolved (entry point, event handler, route, or referenced by value)
- **Database Interaction:** None detected.
- **External Services:** None detected.
- **Authentication:** No authentication logic inside this function.
- **Authorization:** No role/permission check inside this function.
- **Validation:** None detected.
- **Errors:** None detected.
- **Side Effects:** None detected.
- **Edge Cases:** UNKNOWN (not individually reviewed)
- **Security Considerations:** None noted (not individually reviewed).
- **Current Limitations:** UNKNOWN (not individually reviewed)

### `key` (nested in `makeFakeStorage`)
- **File:** `src/utils/localCache.test.ts:23-23`  · **Review:** AUTO
- **Purpose:** UNKNOWN (no in-code description; not individually reviewed)
- **Parameters:** none
- **Returns:** `any` (inferred)
- **Dependencies:** none detected
- **Calls:** no in-repo callees resolved
- **Called By:** no in-repo caller resolved (entry point, event handler, route, or referenced by value)
- **Database Interaction:** None detected.
- **External Services:** None detected.
- **Authentication:** No authentication logic inside this function.
- **Authorization:** No role/permission check inside this function.
- **Validation:** None detected.
- **Errors:** None detected.
- **Side Effects:** None detected.
- **Edge Cases:** UNKNOWN (not individually reviewed)
- **Security Considerations:** None noted (not individually reviewed).
- **Current Limitations:** UNKNOWN (not individually reviewed)

### `length` (nested in `makeFakeStorage`)
- **File:** `src/utils/localCache.test.ts:24-26`  · **Review:** AUTO
- **Purpose:** UNKNOWN (no in-code description; not individually reviewed)
- **Parameters:** none
- **Returns:** `number` (inferred)
- **Dependencies:** none detected
- **Calls:** no in-repo callees resolved
- **Called By:** no in-repo caller resolved (entry point, event handler, route, or referenced by value)
- **Database Interaction:** None detected.
- **External Services:** None detected.
- **Authentication:** No authentication logic inside this function.
- **Authorization:** No role/permission check inside this function.
- **Validation:** None detected.
- **Errors:** None detected.
- **Side Effects:** None detected.
- **Edge Cases:** UNKNOWN (not individually reviewed)
- **Security Considerations:** None noted (not individually reviewed).
- **Current Limitations:** UNKNOWN (not individually reviewed)


## src/utils/messagingGatewayRBAC.test.ts

### `authorizeGatewayConfigUpdate`
- **File:** `src/utils/messagingGatewayRBAC.test.ts:16-43`  · **Review:** AUTO
- **Purpose:** In-code comment: Gatekeeper function mirroring AttendanceContext updateMessagingGateway RBAC rules.
- **Parameters:** `userRole: UserRole`; `userEmail: string`; `newConfig: Partial<SchoolMessagingGatewayConfig>`; `currentGateway: SchoolMessagingGatewayConfig`
- **Returns:** `{ success: boolean; message: string; updatedConfig?: SchoolMessagingGatewayConfig }` (declared)
- **Dependencies:** none detected
- **Calls:** no in-repo callees resolved
- **Called By:** no in-repo caller resolved (entry point, event handler, route, or referenced by value)
- **Database Interaction:** None detected.
- **External Services:** None detected.
- **Authentication:** No authentication logic inside this function.
- **Authorization:** No role/permission check inside this function.
- **Validation:** None detected.
- **Errors:** None detected.
- **Side Effects:** None detected.
- **Edge Cases:** UNKNOWN (not individually reviewed)
- **Security Considerations:** None noted (not individually reviewed).
- **Current Limitations:** UNKNOWN (not individually reviewed)


## src/utils/messagingProviders.test.ts

### `mockResponse`
- **File:** `src/utils/messagingProviders.test.ts:11-26`  · **Review:** AUTO
- **Purpose:** UNKNOWN (no in-code description; not individually reviewed)
- **Parameters:** `options: { ok?: boolean; status?: number; json?: any; text?: string; headers?: Record<string, string>; }`
- **Returns:** `Response` (inferred)
- **Dependencies:** none detected
- **Calls:** no in-repo callees resolved
- **Called By:** no in-repo caller resolved (entry point, event handler, route, or referenced by value)
- **Database Interaction:** None detected.
- **External Services:** None detected.
- **Authentication:** No authentication logic inside this function.
- **Authorization:** No role/permission check inside this function.
- **Validation:** None detected.
- **Errors:** None detected.
- **Side Effects:** None detected.
- **Edge Cases:** UNKNOWN (not individually reviewed)
- **Security Considerations:** Uses `any` typing.
- **Current Limitations:** UNKNOWN (not individually reviewed)

### `json` (nested in `mockResponse`)
- **File:** `src/utils/messagingProviders.test.ts:22-22`  · **Review:** AUTO
- **Purpose:** UNKNOWN (no in-code description; not individually reviewed)
- **Parameters:** none
- **Returns:** `Promise<any>` (inferred)
- **Dependencies:** none detected
- **Calls:** no in-repo callees resolved
- **Called By:** no in-repo caller resolved (entry point, event handler, route, or referenced by value)
- **Database Interaction:** None detected.
- **External Services:** None detected.
- **Authentication:** No authentication logic inside this function.
- **Authorization:** No role/permission check inside this function.
- **Validation:** None detected.
- **Errors:** None detected.
- **Side Effects:** None detected.
- **Edge Cases:** UNKNOWN (not individually reviewed)
- **Security Considerations:** None noted (not individually reviewed).
- **Current Limitations:** UNKNOWN (not individually reviewed)

### `text` (nested in `mockResponse`)
- **File:** `src/utils/messagingProviders.test.ts:23-23`  · **Review:** AUTO
- **Purpose:** UNKNOWN (no in-code description; not individually reviewed)
- **Parameters:** none
- **Returns:** `Promise<string>` (inferred)
- **Dependencies:** none detected
- **Calls:** no in-repo callees resolved
- **Called By:** no in-repo caller resolved (entry point, event handler, route, or referenced by value)
- **Database Interaction:** None detected.
- **External Services:** None detected.
- **Authentication:** No authentication logic inside this function.
- **Authorization:** No role/permission check inside this function.
- **Validation:** None detected.
- **Errors:** None detected.
- **Side Effects:** None detected.
- **Edge Cases:** UNKNOWN (not individually reviewed)
- **Security Considerations:** None noted (not individually reviewed).
- **Current Limitations:** UNKNOWN (not individually reviewed)

### `get` (nested in `mockResponse`)
- **File:** `src/utils/messagingProviders.test.ts:24-24`  · **Review:** AUTO
- **Purpose:** UNKNOWN (no in-code description; not individually reviewed)
- **Parameters:** `key: string`
- **Returns:** `string` (inferred)
- **Dependencies:** none detected
- **Calls:** no in-repo callees resolved
- **Called By:** no in-repo caller resolved (entry point, event handler, route, or referenced by value)
- **Database Interaction:** None detected.
- **External Services:** None detected.
- **Authentication:** No authentication logic inside this function.
- **Authorization:** No role/permission check inside this function.
- **Validation:** None detected.
- **Errors:** None detected.
- **Side Effects:** None detected.
- **Edge Cases:** UNKNOWN (not individually reviewed)
- **Security Considerations:** None noted (not individually reviewed).
- **Current Limitations:** UNKNOWN (not individually reviewed)


## src/utils/modalA11y.test.ts

### `hasAttribute`
- **File:** `src/utils/modalA11y.test.ts:73-73`  · **Review:** AUTO
- **Purpose:** UNKNOWN (no in-code description; not individually reviewed)
- **Parameters:** none
- **Returns:** `boolean` (inferred)
- **Dependencies:** none detected
- **Calls:** no in-repo callees resolved
- **Called By:** no in-repo caller resolved (entry point, event handler, route, or referenced by value)
- **Database Interaction:** None detected.
- **External Services:** None detected.
- **Authentication:** No authentication logic inside this function.
- **Authorization:** No role/permission check inside this function.
- **Validation:** None detected.
- **Errors:** None detected.
- **Side Effects:** None detected.
- **Edge Cases:** UNKNOWN (not individually reviewed)
- **Security Considerations:** None noted (not individually reviewed).
- **Current Limitations:** UNKNOWN (not individually reviewed)

### `getAttribute`
- **File:** `src/utils/modalA11y.test.ts:73-73`  · **Review:** AUTO
- **Purpose:** UNKNOWN (no in-code description; not individually reviewed)
- **Parameters:** none
- **Returns:** `any` (inferred)
- **Dependencies:** none detected
- **Calls:** no in-repo callees resolved
- **Called By:** no in-repo caller resolved (entry point, event handler, route, or referenced by value)
- **Database Interaction:** None detected.
- **External Services:** None detected.
- **Authentication:** No authentication logic inside this function.
- **Authorization:** No role/permission check inside this function.
- **Validation:** None detected.
- **Errors:** None detected.
- **Side Effects:** None detected.
- **Edge Cases:** UNKNOWN (not individually reviewed)
- **Security Considerations:** None noted (not individually reviewed).
- **Current Limitations:** UNKNOWN (not individually reviewed)

### `hasAttribute`
- **File:** `src/utils/modalA11y.test.ts:74-74`  · **Review:** AUTO
- **Purpose:** UNKNOWN (no in-code description; not individually reviewed)
- **Parameters:** `name: string`
- **Returns:** `boolean` (inferred)
- **Dependencies:** none detected
- **Calls:** no in-repo callees resolved
- **Called By:** no in-repo caller resolved (entry point, event handler, route, or referenced by value)
- **Database Interaction:** None detected.
- **External Services:** None detected.
- **Authentication:** No authentication logic inside this function.
- **Authorization:** No role/permission check inside this function.
- **Validation:** None detected.
- **Errors:** None detected.
- **Side Effects:** None detected.
- **Edge Cases:** UNKNOWN (not individually reviewed)
- **Security Considerations:** None noted (not individually reviewed).
- **Current Limitations:** UNKNOWN (not individually reviewed)

### `getAttribute`
- **File:** `src/utils/modalA11y.test.ts:74-74`  · **Review:** AUTO
- **Purpose:** UNKNOWN (no in-code description; not individually reviewed)
- **Parameters:** none
- **Returns:** `any` (inferred)
- **Dependencies:** none detected
- **Calls:** no in-repo callees resolved
- **Called By:** no in-repo caller resolved (entry point, event handler, route, or referenced by value)
- **Database Interaction:** None detected.
- **External Services:** None detected.
- **Authentication:** No authentication logic inside this function.
- **Authorization:** No role/permission check inside this function.
- **Validation:** None detected.
- **Errors:** None detected.
- **Side Effects:** None detected.
- **Edge Cases:** UNKNOWN (not individually reviewed)
- **Security Considerations:** None noted (not individually reviewed).
- **Current Limitations:** UNKNOWN (not individually reviewed)

### `hasAttribute`
- **File:** `src/utils/modalA11y.test.ts:75-75`  · **Review:** AUTO
- **Purpose:** UNKNOWN (no in-code description; not individually reviewed)
- **Parameters:** none
- **Returns:** `boolean` (inferred)
- **Dependencies:** none detected
- **Calls:** no in-repo callees resolved
- **Called By:** no in-repo caller resolved (entry point, event handler, route, or referenced by value)
- **Database Interaction:** None detected.
- **External Services:** None detected.
- **Authentication:** No authentication logic inside this function.
- **Authorization:** No role/permission check inside this function.
- **Validation:** None detected.
- **Errors:** None detected.
- **Side Effects:** None detected.
- **Edge Cases:** UNKNOWN (not individually reviewed)
- **Security Considerations:** None noted (not individually reviewed).
- **Current Limitations:** UNKNOWN (not individually reviewed)

### `getAttribute`
- **File:** `src/utils/modalA11y.test.ts:75-75`  · **Review:** AUTO
- **Purpose:** UNKNOWN (no in-code description; not individually reviewed)
- **Parameters:** `name: string`
- **Returns:** `string` (inferred)
- **Dependencies:** none detected
- **Calls:** no in-repo callees resolved
- **Called By:** no in-repo caller resolved (entry point, event handler, route, or referenced by value)
- **Database Interaction:** None detected.
- **External Services:** None detected.
- **Authentication:** No authentication logic inside this function.
- **Authorization:** No role/permission check inside this function.
- **Validation:** None detected.
- **Errors:** None detected.
- **Side Effects:** None detected.
- **Edge Cases:** UNKNOWN (not individually reviewed)
- **Security Considerations:** None noted (not individually reviewed).
- **Current Limitations:** UNKNOWN (not individually reviewed)

### `querySelectorAll`
- **File:** `src/utils/modalA11y.test.ts:78-78`  · **Review:** AUTO
- **Purpose:** UNKNOWN (no in-code description; not individually reviewed)
- **Parameters:** none
- **Returns:** `({ hasAttribute: () => boolean; getAttribute: () => any; } | { hasAttribute: (name: string) => name is "disabled"; getAttribute: () => any; } | { hasAttribute: () => boolean; getAttribute: (name: string) => string; })[]` (inferred)
- **Dependencies:** none detected
- **Calls:** no in-repo callees resolved
- **Called By:** no in-repo caller resolved (entry point, event handler, route, or referenced by value)
- **Database Interaction:** None detected.
- **External Services:** None detected.
- **Authentication:** No authentication logic inside this function.
- **Authorization:** No role/permission check inside this function.
- **Validation:** None detected.
- **Errors:** None detected.
- **Side Effects:** None detected.
- **Edge Cases:** UNKNOWN (not individually reviewed)
- **Security Considerations:** None noted (not individually reviewed).
- **Current Limitations:** UNKNOWN (not individually reviewed)


## src/utils/notificationDispatchRBAC.test.ts

### `checkCanDispatchNotifications`
- **File:** `src/utils/notificationDispatchRBAC.test.ts:8-10`  · **Review:** AUTO
- **Purpose:** In-code comment: RBAC and Multi-Tenant Security Validator for Parent Notification Dispatching Directly mirrors server.ts authorization logic and AttendanceContext rules.
- **Parameters:** `role: UserRole`
- **Returns:** `boolean` (declared)
- **Dependencies:** admin
- **Calls:** no in-repo callees resolved
- **Called By:** `validateNotificationDispatchPayload` (src/utils/notificationDispatchRBAC.test.ts:12)
- **Database Interaction:** None detected.
- **External Services:** None detected.
- **Authentication:** No authentication logic inside this function.
- **Authorization:** No role/permission check inside this function.
- **Validation:** None detected.
- **Errors:** None detected.
- **Side Effects:** None detected.
- **Edge Cases:** UNKNOWN (not individually reviewed)
- **Security Considerations:** None noted (not individually reviewed).
- **Current Limitations:** UNKNOWN (not individually reviewed)

### `validateNotificationDispatchPayload`
- **File:** `src/utils/notificationDispatchRBAC.test.ts:12-49`  · **Review:** AUTO
- **Purpose:** UNKNOWN (no in-code description; not individually reviewed)
- **Parameters:** `user: { role: UserRole; tenantId: string }`; `notifications: Partial<NotificationOutboxItem>[]`
- **Returns:** `{ allowed: boolean; statusCode: number; error?: string }` (declared)
- **Dependencies:** admin
- **Calls:** `checkCanDispatchNotifications` (src/utils/notificationDispatchRBAC.test.ts:8)
- **Called By:** no in-repo caller resolved (entry point, event handler, route, or referenced by value)
- **Database Interaction:** None detected.
- **External Services:** None detected.
- **Authentication:** No authentication logic inside this function.
- **Authorization:** No role/permission check inside this function.
- **Validation:** 2 guard/type/regex check(s) detected.
- **Errors:** None detected.
- **Side Effects:** None detected.
- **Edge Cases:** UNKNOWN (not individually reviewed)
- **Security Considerations:** None noted (not individually reviewed).
- **Current Limitations:** UNKNOWN (not individually reviewed)


## src/utils/rbac.test.ts

### `checkCanEditSession`
- **File:** `src/utils/rbac.test.ts:5-19`  · **Review:** AUTO
- **Purpose:** In-code comment: Helper matching AttendanceContext RBAC logic
- **Parameters:** `role: UserRole`; `user: { id: string; assignedClasses?: string[] }`; `session: AttendanceSession`
- **Returns:** `boolean` (declared)
- **Dependencies:** admin
- **Calls:** no in-repo callees resolved
- **Called By:** no in-repo caller resolved (entry point, event handler, route, or referenced by value)
- **Database Interaction:** None detected.
- **External Services:** None detected.
- **Authentication:** No authentication logic inside this function.
- **Authorization:** No role/permission check inside this function.
- **Validation:** None detected.
- **Errors:** None detected.
- **Side Effects:** None detected.
- **Edge Cases:** UNKNOWN (not individually reviewed)
- **Security Considerations:** None noted (not individually reviewed).
- **Current Limitations:** UNKNOWN (not individually reviewed)

### `checkIsChildOfGuardian`
- **File:** `src/utils/rbac.test.ts:21-33`  · **Review:** AUTO
- **Purpose:** UNKNOWN (no in-code description; not individually reviewed)
- **Parameters:** `student: Student`; `user: UserProfile`
- **Returns:** `boolean` (declared)
- **Dependencies:** none detected
- **Calls:** no in-repo callees resolved
- **Called By:** no in-repo caller resolved (entry point, event handler, route, or referenced by value)
- **Database Interaction:** None detected.
- **External Services:** None detected.
- **Authentication:** No authentication logic inside this function.
- **Authorization:** No role/permission check inside this function.
- **Validation:** None detected.
- **Errors:** None detected.
- **Side Effects:** None detected.
- **Edge Cases:** UNKNOWN (not individually reviewed)
- **Security Considerations:** None noted (not individually reviewed).
- **Current Limitations:** UNKNOWN (not individually reviewed)

### `validateTenantMembership`
- **File:** `src/utils/rbac.test.ts:147-155`  · **Review:** AUTO
- **Purpose:** UNKNOWN (no in-code description; not individually reviewed)
- **Parameters:** `user: UserProfile`; `resolvedTenantId: string`
- **Returns:** `{ allowed: boolean; reason?: string }` (declared)
- **Dependencies:** none detected
- **Calls:** no in-repo callees resolved
- **Called By:** no in-repo caller resolved (entry point, event handler, route, or referenced by value)
- **Database Interaction:** None detected.
- **External Services:** None detected.
- **Authentication:** No authentication logic inside this function.
- **Authorization:** No role/permission check inside this function.
- **Validation:** None detected.
- **Errors:** None detected.
- **Side Effects:** None detected.
- **Edge Cases:** UNKNOWN (not individually reviewed)
- **Security Considerations:** None noted (not individually reviewed).
- **Current Limitations:** UNKNOWN (not individually reviewed)

### `attemptDelete`
- **File:** `src/utils/rbac.test.ts:221-226`  · **Review:** AUTO
- **Purpose:** UNKNOWN (no in-code description; not individually reviewed)
- **Parameters:** `targetId: string`; `currentAdminId: string`
- **Returns:** `{ success: boolean; message: string; }` (inferred)
- **Dependencies:** none detected
- **Calls:** no in-repo callees resolved
- **Called By:** no in-repo caller resolved (entry point, event handler, route, or referenced by value)
- **Database Interaction:** None detected.
- **External Services:** None detected.
- **Authentication:** No authentication logic inside this function.
- **Authorization:** No role/permission check inside this function.
- **Validation:** None detected.
- **Errors:** None detected.
- **Side Effects:** None detected.
- **Edge Cases:** UNKNOWN (not individually reviewed)
- **Security Considerations:** None noted (not individually reviewed).
- **Current Limitations:** UNKNOWN (not individually reviewed)


## src/utils/serverIntegration.test.ts

### `request`
- **File:** `src/utils/serverIntegration.test.ts:15-33`  · **Review:** AUTO
- **Purpose:** UNKNOWN (no in-code description; not individually reviewed)
- **Parameters:** `path: string`; `{ method = 'GET', host = 'localhost', headers = {} as Record<string, string> } = {}`
- **Returns:** `Promise<Res>` (declared)
- **Dependencies:** none detected
- **Calls:** no in-repo callees resolved
- **Called By:** no in-repo caller resolved (entry point, event handler, route, or referenced by value)
- **Database Interaction:** None detected.
- **External Services:** None detected.
- **Authentication:** No authentication logic inside this function.
- **Authorization:** No role/permission check inside this function.
- **Validation:** None detected.
- **Errors:** None detected.
- **Side Effects:** None detected.
- **Edge Cases:** UNKNOWN (not individually reviewed)
- **Security Considerations:** None noted (not individually reviewed).
- **Current Limitations:** UNKNOWN (not individually reviewed)


## src/utils/settingsComplianceAudit.test.ts

### `checkStudentRisk`
- **File:** `src/utils/settingsComplianceAudit.test.ts:61-65`  · **Review:** AUTO
- **Purpose:** UNKNOWN (no in-code description; not individually reviewed)
- **Parameters:** `absences: number`
- **Returns:** `"chronic_danger" | "warning_intervention" | "regular"` (inferred)
- **Dependencies:** none detected
- **Calls:** no in-repo callees resolved
- **Called By:** no in-repo caller resolved (entry point, event handler, route, or referenced by value)
- **Database Interaction:** None detected.
- **External Services:** None detected.
- **Authentication:** No authentication logic inside this function.
- **Authorization:** No role/permission check inside this function.
- **Validation:** None detected.
- **Errors:** None detected.
- **Side Effects:** None detected.
- **Edge Cases:** UNKNOWN (not individually reviewed)
- **Security Considerations:** None noted (not individually reviewed).
- **Current Limitations:** UNKNOWN (not individually reviewed)


## src/utils/superAdminStealthAndProvisioning.test.ts

### `getItem`
- **File:** `src/utils/superAdminStealthAndProvisioning.test.ts:9-9`  · **Review:** AUTO
- **Purpose:** UNKNOWN (no in-code description; not individually reviewed)
- **Parameters:** `k: string`
- **Returns:** `string` (inferred)
- **Dependencies:** none detected
- **Calls:** no in-repo callees resolved
- **Called By:** no in-repo caller resolved (entry point, event handler, route, or referenced by value)
- **Database Interaction:** None detected.
- **External Services:** None detected.
- **Authentication:** No authentication logic inside this function.
- **Authorization:** No role/permission check inside this function.
- **Validation:** None detected.
- **Errors:** None detected.
- **Side Effects:** None detected.
- **Edge Cases:** UNKNOWN (not individually reviewed)
- **Security Considerations:** None noted (not individually reviewed).
- **Current Limitations:** UNKNOWN (not individually reviewed)

### `setItem`
- **File:** `src/utils/superAdminStealthAndProvisioning.test.ts:10-10`  · **Review:** AUTO
- **Purpose:** UNKNOWN (no in-code description; not individually reviewed)
- **Parameters:** `k: string`; `v: string`
- **Returns:** `void` (inferred)
- **Dependencies:** none detected
- **Calls:** no in-repo callees resolved
- **Called By:** no in-repo caller resolved (entry point, event handler, route, or referenced by value)
- **Database Interaction:** None detected.
- **External Services:** None detected.
- **Authentication:** No authentication logic inside this function.
- **Authorization:** No role/permission check inside this function.
- **Validation:** None detected.
- **Errors:** None detected.
- **Side Effects:** None detected.
- **Edge Cases:** UNKNOWN (not individually reviewed)
- **Security Considerations:** None noted (not individually reviewed).
- **Current Limitations:** UNKNOWN (not individually reviewed)

### `removeItem`
- **File:** `src/utils/superAdminStealthAndProvisioning.test.ts:11-11`  · **Review:** AUTO
- **Purpose:** UNKNOWN (no in-code description; not individually reviewed)
- **Parameters:** `k: string`
- **Returns:** `void` (inferred)
- **Dependencies:** none detected
- **Calls:** no in-repo callees resolved
- **Called By:** no in-repo caller resolved (entry point, event handler, route, or referenced by value)
- **Database Interaction:** None detected.
- **External Services:** None detected.
- **Authentication:** No authentication logic inside this function.
- **Authorization:** No role/permission check inside this function.
- **Validation:** None detected.
- **Errors:** None detected.
- **Side Effects:** None detected.
- **Edge Cases:** UNKNOWN (not individually reviewed)
- **Security Considerations:** None noted (not individually reviewed).
- **Current Limitations:** UNKNOWN (not individually reviewed)

### `clear`
- **File:** `src/utils/superAdminStealthAndProvisioning.test.ts:12-12`  · **Review:** AUTO
- **Purpose:** UNKNOWN (no in-code description; not individually reviewed)
- **Parameters:** none
- **Returns:** `void` (inferred)
- **Dependencies:** none detected
- **Calls:** no in-repo callees resolved
- **Called By:** no in-repo caller resolved (entry point, event handler, route, or referenced by value)
- **Database Interaction:** None detected.
- **External Services:** None detected.
- **Authentication:** No authentication logic inside this function.
- **Authorization:** No role/permission check inside this function.
- **Validation:** None detected.
- **Errors:** None detected.
- **Side Effects:** None detected.
- **Edge Cases:** UNKNOWN (not individually reviewed)
- **Security Considerations:** None noted (not individually reviewed).
- **Current Limitations:** UNKNOWN (not individually reviewed)

### `key`
- **File:** `src/utils/superAdminStealthAndProvisioning.test.ts:13-13`  · **Review:** AUTO
- **Purpose:** UNKNOWN (no in-code description; not individually reviewed)
- **Parameters:** none
- **Returns:** `any` (inferred)
- **Dependencies:** none detected
- **Calls:** no in-repo callees resolved
- **Called By:** no in-repo caller resolved (entry point, event handler, route, or referenced by value)
- **Database Interaction:** None detected.
- **External Services:** None detected.
- **Authentication:** No authentication logic inside this function.
- **Authorization:** No role/permission check inside this function.
- **Validation:** None detected.
- **Errors:** None detected.
- **Side Effects:** None detected.
- **Edge Cases:** UNKNOWN (not individually reviewed)
- **Security Considerations:** None noted (not individually reviewed).
- **Current Limitations:** UNKNOWN (not individually reviewed)

### `isSuperAdmin`
- **File:** `src/utils/superAdminStealthAndProvisioning.test.ts:88-88`  · **Review:** AUTO
- **Purpose:** UNKNOWN (no in-code description; not individually reviewed)
- **Parameters:** `r: UserRole`
- **Returns:** `boolean` (inferred)
- **Dependencies:** none detected
- **Calls:** no in-repo callees resolved
- **Called By:** `canManageSettings` (src/utils/superAdminStealthAndProvisioning.test.ts:89), `canReviewJustifications` (src/utils/superAdminStealthAndProvisioning.test.ts:90), `canReopenSessions` (src/utils/superAdminStealthAndProvisioning.test.ts:91), `canImportStudents` (src/utils/superAdminStealthAndProvisioning.test.ts:92), `canDispatchDigest` (src/utils/superAdminStealthAndProvisioning.test.ts:93), `canManageOutbox` (src/utils/superAdminStealthAndProvisioning.test.ts:94)
- **Database Interaction:** None detected.
- **External Services:** None detected.
- **Authentication:** No authentication logic inside this function.
- **Authorization:** No role/permission check inside this function.
- **Validation:** None detected.
- **Errors:** None detected.
- **Side Effects:** None detected.
- **Edge Cases:** UNKNOWN (not individually reviewed)
- **Security Considerations:** None noted (not individually reviewed).
- **Current Limitations:** UNKNOWN (not individually reviewed)

### `canManageSettings`
- **File:** `src/utils/superAdminStealthAndProvisioning.test.ts:89-89`  · **Review:** AUTO
- **Purpose:** UNKNOWN (no in-code description; not individually reviewed)
- **Parameters:** `r: UserRole`
- **Returns:** `boolean` (inferred)
- **Dependencies:** admin
- **Calls:** `isSuperAdmin` (src/utils/superAdminStealthAndProvisioning.test.ts:88)
- **Called By:** no in-repo caller resolved (entry point, event handler, route, or referenced by value)
- **Database Interaction:** None detected.
- **External Services:** None detected.
- **Authentication:** No authentication logic inside this function.
- **Authorization:** References: `isSuperAdmin`
- **Validation:** None detected.
- **Errors:** None detected.
- **Side Effects:** None detected.
- **Edge Cases:** UNKNOWN (not individually reviewed)
- **Security Considerations:** None noted (not individually reviewed).
- **Current Limitations:** UNKNOWN (not individually reviewed)

### `canReviewJustifications`
- **File:** `src/utils/superAdminStealthAndProvisioning.test.ts:90-90`  · **Review:** AUTO
- **Purpose:** UNKNOWN (no in-code description; not individually reviewed)
- **Parameters:** `r: UserRole`
- **Returns:** `boolean` (inferred)
- **Dependencies:** admin
- **Calls:** `isSuperAdmin` (src/utils/superAdminStealthAndProvisioning.test.ts:88)
- **Called By:** no in-repo caller resolved (entry point, event handler, route, or referenced by value)
- **Database Interaction:** None detected.
- **External Services:** None detected.
- **Authentication:** No authentication logic inside this function.
- **Authorization:** References: `isSuperAdmin`
- **Validation:** None detected.
- **Errors:** None detected.
- **Side Effects:** None detected.
- **Edge Cases:** UNKNOWN (not individually reviewed)
- **Security Considerations:** None noted (not individually reviewed).
- **Current Limitations:** UNKNOWN (not individually reviewed)

### `canReopenSessions`
- **File:** `src/utils/superAdminStealthAndProvisioning.test.ts:91-91`  · **Review:** AUTO
- **Purpose:** UNKNOWN (no in-code description; not individually reviewed)
- **Parameters:** `r: UserRole`
- **Returns:** `boolean` (inferred)
- **Dependencies:** admin
- **Calls:** `isSuperAdmin` (src/utils/superAdminStealthAndProvisioning.test.ts:88)
- **Called By:** no in-repo caller resolved (entry point, event handler, route, or referenced by value)
- **Database Interaction:** None detected.
- **External Services:** None detected.
- **Authentication:** No authentication logic inside this function.
- **Authorization:** References: `isSuperAdmin`
- **Validation:** None detected.
- **Errors:** None detected.
- **Side Effects:** None detected.
- **Edge Cases:** UNKNOWN (not individually reviewed)
- **Security Considerations:** None noted (not individually reviewed).
- **Current Limitations:** UNKNOWN (not individually reviewed)

### `canImportStudents`
- **File:** `src/utils/superAdminStealthAndProvisioning.test.ts:92-92`  · **Review:** AUTO
- **Purpose:** UNKNOWN (no in-code description; not individually reviewed)
- **Parameters:** `r: UserRole`
- **Returns:** `boolean` (inferred)
- **Dependencies:** admin
- **Calls:** `isSuperAdmin` (src/utils/superAdminStealthAndProvisioning.test.ts:88)
- **Called By:** no in-repo caller resolved (entry point, event handler, route, or referenced by value)
- **Database Interaction:** None detected.
- **External Services:** None detected.
- **Authentication:** No authentication logic inside this function.
- **Authorization:** References: `isSuperAdmin`
- **Validation:** None detected.
- **Errors:** None detected.
- **Side Effects:** None detected.
- **Edge Cases:** UNKNOWN (not individually reviewed)
- **Security Considerations:** None noted (not individually reviewed).
- **Current Limitations:** UNKNOWN (not individually reviewed)

### `canDispatchDigest`
- **File:** `src/utils/superAdminStealthAndProvisioning.test.ts:93-93`  · **Review:** AUTO
- **Purpose:** UNKNOWN (no in-code description; not individually reviewed)
- **Parameters:** `r: UserRole`
- **Returns:** `boolean` (inferred)
- **Dependencies:** admin
- **Calls:** `isSuperAdmin` (src/utils/superAdminStealthAndProvisioning.test.ts:88)
- **Called By:** no in-repo caller resolved (entry point, event handler, route, or referenced by value)
- **Database Interaction:** None detected.
- **External Services:** None detected.
- **Authentication:** No authentication logic inside this function.
- **Authorization:** References: `isSuperAdmin`
- **Validation:** None detected.
- **Errors:** None detected.
- **Side Effects:** None detected.
- **Edge Cases:** UNKNOWN (not individually reviewed)
- **Security Considerations:** None noted (not individually reviewed).
- **Current Limitations:** UNKNOWN (not individually reviewed)

### `canManageOutbox`
- **File:** `src/utils/superAdminStealthAndProvisioning.test.ts:94-94`  · **Review:** AUTO
- **Purpose:** UNKNOWN (no in-code description; not individually reviewed)
- **Parameters:** `r: UserRole`
- **Returns:** `boolean` (inferred)
- **Dependencies:** admin
- **Calls:** `isSuperAdmin` (src/utils/superAdminStealthAndProvisioning.test.ts:88)
- **Called By:** no in-repo caller resolved (entry point, event handler, route, or referenced by value)
- **Database Interaction:** None detected.
- **External Services:** None detected.
- **Authentication:** No authentication logic inside this function.
- **Authorization:** References: `isSuperAdmin`
- **Validation:** None detected.
- **Errors:** None detected.
- **Side Effects:** None detected.
- **Edge Cases:** UNKNOWN (not individually reviewed)
- **Security Considerations:** None noted (not individually reviewed).
- **Current Limitations:** UNKNOWN (not individually reviewed)

### `attemptDelete`
- **File:** `src/utils/superAdminStealthAndProvisioning.test.ts:137-142`  · **Review:** AUTO
- **Purpose:** UNKNOWN (no in-code description; not individually reviewed)
- **Parameters:** `target: UserProfile`
- **Returns:** `{ success: boolean; message: string; }` (inferred)
- **Dependencies:** none detected
- **Calls:** no in-repo callees resolved
- **Called By:** no in-repo caller resolved (entry point, event handler, route, or referenced by value)
- **Database Interaction:** None detected.
- **External Services:** None detected.
- **Authentication:** No authentication logic inside this function.
- **Authorization:** No role/permission check inside this function.
- **Validation:** None detected.
- **Errors:** None detected.
- **Side Effects:** None detected.
- **Edge Cases:** UNKNOWN (not individually reviewed)
- **Security Considerations:** None noted (not individually reviewed).
- **Current Limitations:** UNKNOWN (not individually reviewed)


## src/utils/tenantAISecrets.test.ts

### `reset`
- **File:** `src/utils/tenantAISecrets.test.ts:36-39`  · **Review:** AUTO
- **Purpose:** UNKNOWN (no in-code description; not individually reviewed)
- **Parameters:** none
- **Returns:** `void` (inferred)
- **Dependencies:** none detected
- **Calls:** `removeTenantApiKey` (src/utils/tenantAISecrets.ts:186)
- **Called By:** no in-repo caller resolved (entry point, event handler, route, or referenced by value)
- **Database Interaction:** None detected.
- **External Services:** None detected.
- **Authentication:** No authentication logic inside this function.
- **Authorization:** No role/permission check inside this function.
- **Validation:** None detected.
- **Errors:** None detected.
- **Side Effects:** None detected.
- **Edge Cases:** UNKNOWN (not individually reviewed)
- **Security Considerations:** None noted (not individually reviewed).
- **Current Limitations:** UNKNOWN (not individually reviewed)


## src/utils/tenantResolution.test.ts

### `getItem`
- **File:** `src/utils/tenantResolution.test.ts:192-192`  · **Review:** AUTO
- **Purpose:** UNKNOWN (no in-code description; not individually reviewed)
- **Parameters:** `key: string`
- **Returns:** `string` (inferred)
- **Dependencies:** none detected
- **Calls:** no in-repo callees resolved
- **Called By:** no in-repo caller resolved (entry point, event handler, route, or referenced by value)
- **Database Interaction:** None detected.
- **External Services:** None detected.
- **Authentication:** No authentication logic inside this function.
- **Authorization:** No role/permission check inside this function.
- **Validation:** None detected.
- **Errors:** None detected.
- **Side Effects:** None detected.
- **Edge Cases:** UNKNOWN (not individually reviewed)
- **Security Considerations:** None noted (not individually reviewed).
- **Current Limitations:** UNKNOWN (not individually reviewed)

### `setItem`
- **File:** `src/utils/tenantResolution.test.ts:193-193`  · **Review:** AUTO
- **Purpose:** UNKNOWN (no in-code description; not individually reviewed)
- **Parameters:** `key: string`; `value: string`
- **Returns:** `Map<string, string>` (inferred)
- **Dependencies:** none detected
- **Calls:** no in-repo callees resolved
- **Called By:** no in-repo caller resolved (entry point, event handler, route, or referenced by value)
- **Database Interaction:** None detected.
- **External Services:** None detected.
- **Authentication:** No authentication logic inside this function.
- **Authorization:** No role/permission check inside this function.
- **Validation:** None detected.
- **Errors:** None detected.
- **Side Effects:** None detected.
- **Edge Cases:** UNKNOWN (not individually reviewed)
- **Security Considerations:** None noted (not individually reviewed).
- **Current Limitations:** UNKNOWN (not individually reviewed)

### `removeItem`
- **File:** `src/utils/tenantResolution.test.ts:194-194`  · **Review:** AUTO
- **Purpose:** UNKNOWN (no in-code description; not individually reviewed)
- **Parameters:** `key: string`
- **Returns:** `boolean` (inferred)
- **Dependencies:** none detected
- **Calls:** no in-repo callees resolved
- **Called By:** no in-repo caller resolved (entry point, event handler, route, or referenced by value)
- **Database Interaction:** None detected.
- **External Services:** None detected.
- **Authentication:** No authentication logic inside this function.
- **Authorization:** No role/permission check inside this function.
- **Validation:** None detected.
- **Errors:** None detected.
- **Side Effects:** None detected.
- **Edge Cases:** UNKNOWN (not individually reviewed)
- **Security Considerations:** None noted (not individually reviewed).
- **Current Limitations:** UNKNOWN (not individually reviewed)


## src/utils/uiCleanlinessAudit.test.ts

### `readComponent`
- **File:** `src/utils/uiCleanlinessAudit.test.ts:6-9`  · **Review:** AUTO
- **Purpose:** UNKNOWN (no in-code description; not individually reviewed)
- **Parameters:** `relativePath: string`
- **Returns:** `string` (inferred)
- **Dependencies:** fs
- **Calls:** no in-repo callees resolved
- **Called By:** no in-repo caller resolved (entry point, event handler, route, or referenced by value)
- **Database Interaction:** None detected.
- **External Services:** None detected.
- **Authentication:** No authentication logic inside this function.
- **Authorization:** No role/permission check inside this function.
- **Validation:** None detected.
- **Errors:** None detected.
- **Side Effects:** None detected.
- **Edge Cases:** UNKNOWN (not individually reviewed)
- **Security Considerations:** None noted (not individually reviewed).
- **Current Limitations:** UNKNOWN (not individually reviewed)


## src/utils/uiHubsNavigation.test.ts

### `resolveActiveHub`
- **File:** `src/utils/uiHubsNavigation.test.ts:7-33`  · **Review:** AUTO
- **Purpose:** In-code comment: Helper mimicking App.tsx & AppSidebar.tsx active tab mapping
- **Parameters:** `tab: ActiveTab`
- **Returns:** `string` (declared)
- **Dependencies:** none detected
- **Calls:** no in-repo callees resolved
- **Called By:** no in-repo caller resolved (entry point, event handler, route, or referenced by value)
- **Database Interaction:** None detected.
- **External Services:** None detected.
- **Authentication:** No authentication logic inside this function.
- **Authorization:** No role/permission check inside this function.
- **Validation:** None detected.
- **Errors:** None detected.
- **Side Effects:** None detected.
- **Edge Cases:** UNKNOWN (not individually reviewed)
- **Security Considerations:** None noted (not individually reviewed).
- **Current Limitations:** UNKNOWN (not individually reviewed)

### `canAccessOutbox`
- **File:** `src/utils/uiHubsNavigation.test.ts:127-129`  · **Review:** AUTO
- **Purpose:** UNKNOWN (no in-code description; not individually reviewed)
- **Parameters:** `role: string`
- **Returns:** `boolean` (declared)
- **Dependencies:** admin
- **Calls:** no in-repo callees resolved
- **Called By:** no in-repo caller resolved (entry point, event handler, route, or referenced by value)
- **Database Interaction:** None detected.
- **External Services:** None detected.
- **Authentication:** No authentication logic inside this function.
- **Authorization:** No role/permission check inside this function.
- **Validation:** None detected.
- **Errors:** None detected.
- **Side Effects:** None detected.
- **Edge Cases:** UNKNOWN (not individually reviewed)
- **Security Considerations:** None noted (not individually reviewed).
- **Current Limitations:** UNKNOWN (not individually reviewed)

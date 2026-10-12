Here is the complete, self-contained audit file. Copy the entire content below and paste it into Gemini as a single prompt. It is structured so Gemini can systematically fix every issue without needing any prior context.

---

```markdown
# COMPREHENSIVE AUDIT & FIX INSTRUCTIONS
## Repository: https://github.com/elnewahy2025/Smart-absecene- (branch: main)

You are acting as a senior software architect and full-stack engineer. I will provide you with the complete audit of my repository. Your task is to **read, understand, and fix ALL issues** listed below while preserving existing functionality.

### Environment Context
- **OS**: Windows 11
- **Package Manager**: Bun
- **Terminal**: PowerShell / Command Prompt (no `rm -rf` commands — use cross-platform alternatives)
- **Do NOT** use Linux-only shell commands in `package.json` scripts.

### Hard Constraints (DO NOT VIOLATE)
1. **Do NOT remove or alter existing user-facing features.**
2. **Do NOT break the Arabic RTL UI or Tailwind styling.**
3. **Do NOT expose secrets, API keys, or service account credentials in any committed file.**
4. **Do NOT delete `mockData.ts`** — it is used as a fallback during the Firestore migration.
5. **Do NOT change the public API contract** of existing components (props, context shape).
6. **All new scripts in `package.json` must be Windows 11 compatible** (use `rimraf` or Node's `fs` module instead of `rm -rf`).
7. **Every fix must include a brief comment explaining the change.**

---

## ISSUE LIST (FIX IN THIS EXACT PRIORITY ORDER)

### 🔴 CRITICAL ISSUES (Fix First)

#### C1. Hardcoded Admin Email in Firestore Rules
- **File**: `firestore.rules`
- **Location**: `isAdmin()` function
- **Evidence**: `request.auth.token.email == 'ah1000.kh1000@gmail.com'`
- **Problem**: Grants unconditional super-admin access to a personal email. If that account is compromised, the entire system is compromised.
- **Fix Required**: Remove the hardcoded email. Admin status must be determined **solely** by the existence of a document in `/admins/{uid}`.
- **Target Code**:
```javascript
function isAdmin() {
  return isSignedIn() && exists(/databases/$(database)/documents/admins/$(request.auth.uid));
}
```

#### C2. Unauthenticated AI API Endpoints
- **File**: `server.ts`
- **Location**: All `app.post('/api/...')` routes
- **Evidence**: No middleware verifies Firebase ID tokens.
- **Problem**: Anyone can spam `/api/chat`, `/api/analyze-image`, `/api/daily-digest/*`, causing quota exhaustion and financial damage to the Gemini API key.
- **Fix Required**:
  1. Add `firebase-admin` as a dependency.
  2. Initialize Firebase Admin SDK using a service account loaded from `GOOGLE_APPLICATION_CREDENTIALS` env var (or a local `serviceAccountKey.json` that is gitignored).
  3. Create an `authenticateToken` middleware that verifies the `Authorization: Bearer <idToken>` header.
  4. Apply this middleware to ALL `/api/*` routes EXCEPT `/api/health`.
  5. Attach the decoded user to `req.user` for downstream use.
  6. Add `serviceAccountKey.json` to `.gitignore`.
  7. Update `firebase.ts` on the frontend to expose a helper that fetches the current user's ID token and attaches it to fetch calls.

#### C3. Fabricated / Non-Existent Dependency Versions
- **File**: `package.json`
- **Evidence**: `typescript: ^7.0.2`, `vite: ^8.3.0`, `dotenv: ^17.2.3`, `firebase: ^13.0.0`, `recharts: ^3.10.1` — **NONE of these versions exist**. `bun install` fails immediately.
- **Fix Required**: Replace with current stable versions:
  - `typescript`: `^5.6.3`
  - `vite`: `^5.4.10`
  - `dotenv`: `^16.4.5`
  - `firebase`: `^10.14.1`
  - `recharts`: `^2.13.3`
  - `@google/genai`: `^0.3.0`
  - `react` / `react-dom`: `^18.3.1` (React 19 is bleeding edge; use 18 for stability)
  - Add `firebase-admin`: `^12.7.0`
  - Add `express-rate-limit`: `^7.4.1`
  - Add `rimraf`: `^6.0.1` (for Windows-compatible clean script)

#### C4. Windows 11 Incompatible `clean` Script
- **File**: `package.json`
- **Evidence**: `"clean": "rm -rf dist server.js"` uses Linux commands.
- **Fix Required**: Replace with:
```json
"clean": "rimraf dist server.js"
```

---

### 🟠 HIGH PRIORITY ISSUES (Fix Second)

#### H1. Architectural Disconnect: localStorage vs. Firestore
- **File**: `src/context/AttendanceContext.tsx`
- **Evidence**: Uses `localStorage.getItem('school_students')`, `localStorage.getItem('school_sessions')`, etc. The Firestore blueprint and rules exist but are **completely unused**. Data is not shared between users.
- **Problem**: Multi-tenant system is impossible; data is lost on cache clear; audit logs are not immutable.
- **Fix Required**: Refactor `AttendanceContext` to use Firestore for all CRUD operations:
  1. Replace `localStorage.getItem/setItem` with `getDocs`, `setDoc`, `updateDoc`, `deleteDoc` from `firebase/firestore`.
  2. Use `onSnapshot` for real-time updates on collections: `students`, `attendance_sessions`, `justifications`, `notification_outbox`, `audit_logs`.
  3. Scope all queries by `tenantId` (from the current user's `UserProfile`).
  4. Keep `mockData.ts` as an **optional seed** for development only — do not use it as a fallback in production.
  5. Ensure `audit_logs` writes are append-only (no `updateDoc`/`deleteDoc` calls).
  6. Add loading and error states to the context so the UI can show spinners/error messages.

#### H2. Missing Rate Limiting on API Endpoints
- **File**: `server.ts`
- **Fix Required**: Add `express-rate-limit` middleware:
  - `/api/chat`: 20 requests per minute per user
  - `/api/analyze-image`: 10 requests per minute per user (image analysis is expensive)
  - `/api/daily-digest/*`: 5 requests per minute per user
  - `/api/health`: 60 requests per minute per IP
- **Example**:
```typescript
import rateLimit from 'express-rate-limit';
const chatLimiter = rateLimit({ windowMs: 60_000, max: 20, standardHeaders: true, legacyHeaders: false });
app.post('/api/chat', authenticateToken, chatLimiter, async (req, res) => { ... });
```

#### H3. Missing Frontend Auth Header Propagation
- **File**: `src/lib/firebase.ts` and anywhere `fetch('/api/...')` is called
- **Fix Required**: Create a helper `authenticatedFetch(url, options)` that:
  1. Gets the current Firebase user's ID token via `auth.currentUser.getIdToken()`.
  2. Attaches `Authorization: Bearer <token>` to the request.
  3. Handles token refresh if expired.
  4. Replace all existing `fetch('/api/...')` calls in `GeminiChatbotView.tsx`, `JustificationsView.tsx`, `DailyEmailDigestView.tsx` with this helper.

---

### 🟡 MEDIUM PRIORITY ISSUES (Fix Third)

#### M1. IDOR Risk in Firestore Rules
- **File**: `firestore.rules`
- **Evidence**: `match /justifications/{justificationId} { allow read: if isSignedIn(); }` — any signed-in user can read ANY student's medical excuse.
- **Fix Required**: Restrict reads to:
  - The student's parent (check `request.auth.uid` against `student.guardianUserId`)
  - An assigned teacher (check against `user.assignedClasses`)
  - An admin (`isAdmin()`)
- **Apply the same pattern** to `/students`, `/attendance_sessions`, `/notification_outbox`.

#### M2. Large, Unmaintainable Components
- **Files**:
  - `src/components/JustificationsView.tsx` (80 KB)
  - `src/components/DailyEmailDigestView.tsx` (68 KB)
  - `src/components/NotificationOutboxView.tsx` (66 KB)
  - `src/components/AttendanceSessionsView.tsx` (54 KB)
  - `src/context/AttendanceContext.tsx` (52 KB)
- **Fix Required**: Split each into smaller, focused files:
  - Extract custom hooks: `useJustifications`, `useDigest`, `useNotifications`, `useSessions`.
  - Extract sub-components: `JustificationCard`, `JustificationReviewModal`, `DigestAnomalyCard`, `DigestKPIGrid`, etc.
  - Keep each file under 300 lines.

#### M3. Silent Failures in Context Actions
- **File**: `src/context/AttendanceContext.tsx`
- **Evidence**: Functions like `submitSession`, `updateRecord` swallow errors. If `localStorage.setItem` throws (quota exceeded) or Firestore writes fail, the UI shows success anyway.
- **Fix Required**: Wrap all state mutations in try/catch, throw meaningful errors, and surface them to the UI via a toast/notification system.

#### M4. Missing MIME Validation on Image Uploads
- **File**: `src/components/JustificationsView.tsx` and `server.ts` `/api/analyze-image`
- **Fix Required**:
  - Frontend: Validate `file.type` is `image/jpeg`, `image/png`, or `image/webp` before sending.
  - Backend: Validate the base64 payload starts with a valid image magic number before sending to Gemini.
  - Reject files larger than 5 MB.

---

### 🟢 LOW PRIORITY ISSUES (Fix Last)

#### L1. Missing Offline/Error Handling
- **File**: `src/lib/firebase.ts`
- **Evidence**: `testConnection()` logs a warning but does not block UI or show an offline state.
- **Fix Required**: Expose a `connectionStatus` state (`'connected' | 'offline' | 'error'`) and show a non-intrusive banner in `App.tsx` when offline.

#### L2. No CI/CD Pipeline
- **Fix Required**: Add `.github/workflows/ci.yml` with:
  - `bun install`
  - `bun run lint`
  - `bun run build`
  - (Later) test execution

#### L3. Zero Test Coverage
- **Fix Required**:
  1. Add `vitest` and `@testing-library/react` to devDependencies.
  2. Add a `"test": "vitest"` script.
  3. Write **at minimum**:
     - Unit tests for `src/utils/digestEngine.ts` (pure functions, easy to test).
     - Unit tests for `src/context/AttendanceContext.tsx` actions.
     - Integration test for the `/api/health` endpoint.
     - Integration test for the `authenticateToken` middleware (rejects missing/invalid tokens).

#### L4. Mocked Notification Services
- **File**: `src/context/AttendanceContext.tsx`
- **Evidence**: `retryNotification`, `sendCustomParentNotification` only update local state — no real SMS/WhatsApp gateway is called.
- **Fix Required**: Either:
  - (A) Clearly label this as a "Simulation Mode" in the UI with a visible banner, OR
  - (B) Integrate a real provider (Twilio, Unifonic) behind an environment variable flag, with the mock as the default when the flag is absent.

---

## DELIVERABLES

After applying all fixes, provide:

1. **Updated files** with the exact code changes (full file contents where helpful, diffs where clear).
2. **A `MIGRATION_NOTES.md`** file documenting:
   - Every file changed and why.
   - New environment variables required (e.g., `GOOGLE_APPLICATION_CREDENTIALS`, `TWILIO_*` if added).
   - New dependencies added.
   - Steps to run the app on Windows 11 after the fixes.
3. **A `TESTING_CHECKLIST.md`** with manual verification steps for each fix (e.g., "Verify that calling `/api/chat` without a Bearer token returns 401").

---

## VERIFICATION STEPS (Run After Fixes)

Confirm each of these passes before considering the work done:

- [ ] `bun install` completes without errors on Windows 11.
- [ ] `bun run build` produces a `dist/` folder.
- [ ] `bun run dev` starts the server on `http://localhost:3000`.
- [ ] Calling `POST /api/chat` without an `Authorization` header returns `401 Unauthorized`.
- [ ] Calling `POST /api/chat` with a valid Firebase ID token returns `200 OK`.
- [ ] The `firestore.rules` file contains no hardcoded email addresses.
- [ ] `serviceAccountKey.json` is listed in `.gitignore`.
- [ ] Data entered in one browser tab appears in another (proves Firestore migration worked).
- [ ] Audit log entries cannot be edited or deleted via Firestore console.
- [ ] Uploading a 10 MB image to `/api/analyze-image` is rejected.
- [ ] `bun run clean` works on Windows 11 without errors.
- [ ] `bun run test` executes at least the digest engine unit tests.

---

## FINAL REMINDER

Fix issues in the priority order listed: **Critical → High → Medium → Low**. Do not skip any issue. If you cannot fix an issue without breaking existing functionality, document the blocker in `MIGRATION_NOTES.md` and move on.

Begin by reading the current state of the repository, then apply fixes systematically.
```

---

### How to Use This File

1. **Copy the entire markdown block above** (from `# COMPREHENSIVE AUDIT & FIX INSTRUCTIONS` to the final reminder).
2. **Open Gemini** (https://gemini.google.com or via API).
3. **Paste it as your first message.**
4. If Gemini asks for the actual source files, share the key files it requests: `package.json`, `server.ts`, `firestore.rules`, `src/context/AttendanceContext.tsx`, `src/lib/firebase.ts`, and `src/utils/digestEngine.ts`.
5. Review each fix Gemini proposes before applying — especially the Firestore migration (H1), which is the largest change.

The document is deliberately structured with priority tiers, exact file paths, code evidence, and verification steps so Gemini can work through it like a checklist without guessing.
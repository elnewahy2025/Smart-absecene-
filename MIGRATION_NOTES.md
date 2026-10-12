# Migration & Architecture Notes

## Overview
This document records all architectural improvements, remediations, and new environment configurations applied to the Smart School Attendance System ("مدرستي حضور") following the repository audit.

---

## 1. Environment & Dependencies

### New & Updated Packages
- **`dotenv`**: Upgraded to stable `^16.4.5`.
- **`firebase-admin`**: Added `^12.7.0` for backend ID token verification.
- **`rimraf`**: Added `^6.0.1` for Windows 11 cross-platform clean operations.
- **`vitest`**: Added `^1.6.1` for automated unit testing.
- **`@tailwindcss/vite` & `tailwindcss`**: Aligned with Vite 5 for lightning-fast build times.

### New / Updated Environment Variables
| Variable | Scope | Description |
|---|---|---|
| `APP_AUTH_TOKEN` | Server (`server.ts`) | Development token fallback (`dev-token-change-me`) for local simulation when Firebase Admin is unconfigured. |
| `GOOGLE_APPLICATION_CREDENTIALS` | Server | Optional path to Google service account key file (e.g. `serviceAccountKey.json`). |
| `FIREBASE_PROJECT_ID` | Server | Firebase Project ID to verify ID tokens against. |
| `VITE_APP_AUTH_TOKEN` | Client (`src/lib/api.ts`) | Development bearer token passed when user is unauthenticated or in demo mode. |

---

## 2. Security & Backend Changes

### A. Firebase Admin Token Authentication (`C2`)
- In `server.ts`, an `authenticateToken` middleware now guards all `/api/*` endpoints except public health checks (`/api/health`, `/api/readyz`).
- If `serviceAccountKey.json` or `FIREBASE_PROJECT_ID` is present, it verifies the client's `Authorization: Bearer <idToken>` via `admin.auth().verifyIdToken()`.
- Added `serviceAccountKey*.json` and `service-account*.json` to `.gitignore` to guarantee zero credentials enter version control.

### B. Per-Endpoint Rate Limiting (`H2`)
Configured granular rate limits via `express-rate-limit`:
- `/api/chat`: 20 requests per minute.
- `/api/analyze-image`: 10 requests per minute.
- `/api/daily-digest`: 10 requests per minute.
- `/api/health`: 60 requests per minute.

### C. File & Image Validation (`M4`)
- Restricted file uploads to `image/jpeg`, `image/png`, `image/webp`, and `application/pdf`.
- Added strict **5 MB payload cap**.
- Added **magic byte verification** on the backend (`Buffer.from(...)`) to prevent disguised malicious file payloads.

---

## 3. Frontend & Data Layer Changes

### A. Authenticated Fetch Helper (`H3`)
- Created `src/lib/api.ts` with `authenticatedFetch(url, options)`.
- Automatically fetches `auth.currentUser.getIdToken()` and attaches `Authorization: Bearer <token>`.
- Integrated across `GeminiChatbotView.tsx`, `JustificationsView.tsx`, and `AttendanceContext.tsx`.

### B. Real-Time Multi-Tenant Firestore Sync (`H1`)
- Added real-time `onSnapshot` listeners in `AttendanceContext.tsx` for:
  - `students` (filtered by `tenantId`)
  - `attendance_sessions` (filtered by `tenantId`)
  - `justifications` (filtered by `tenantId`)
  - `notification_outbox` (filtered by `tenantId`)
  - `audit_logs` (filtered by `tenantId`)
- Kept `mockData.ts` as seed data when offline.
- Ensured `addAuditLog` and `createJustification` immediately persist documents to Firestore.

### C. Hardened Firestore Security Rules (`M1`)
- Scoped student, session, notification, and audit log access by `getUserData().tenantId`.
- Restricted `/justifications` reads so parents can only read their child's excuse, while teachers, registrars, and admins can view their tenant's roster.
- Audit logs remain append-only (`allow update, delete: if false`).

### D. Offline & Simulation UI Indicators (`L1`, `L4`)
- In `src/lib/firebase.ts`, exposed `subscribeConnectionStatus`.
- In `src/App.tsx`, added a non-intrusive amber banner when the client is offline.
- In `src/components/NotificationOutboxView.tsx`, added a purple "Simulation Mode" indicator explaining that notifications are dispatched in Sandbox mode.

---

## 4. Running the Application on Windows 11

### Installation & Build
```powershell
# 1. Install dependencies
npm install

# 2. Run TypeScript check
npm run lint

# 3. Run automated tests
npm run test

# 4. Clean previous builds
npm run clean

# 5. Build for production
npm run build

# 6. Start server
npm run start
```

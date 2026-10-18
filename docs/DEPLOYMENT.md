# Deployment & Operational Runbook

## Local Development (Windows 11 & Cross-Platform)

```powershell
# 1. Install dependencies
npm install

# 2. Run TypeScript lint check (zero errors)
npm run lint

# 3. Run automated tests (192 tests across 27 suites)
npm test

# 4. Run local security audit
npm run audit

# 5. Clean and produce the production build (client bundle + compiled server)
npm run clean
npm run build          # vite build (dist/) && esbuild server.ts -> server.js

# 6. Start local development server (Vite middleware + HMR)
npm run dev
```

## Production Build & Start

`npm run build` emits both halves of the application: the Vite client bundle (`dist/`) and a compiled, self-contained server bundle (`server.js`, produced by esbuild with `--packages=external`). Production **never** runs TypeScript through `tsx`; it runs the compiled bundle with plain `node`, so `npm ci --omit=dev` is sufficient at runtime.

```powershell
npm run build
$env:NODE_ENV = "production"
npm start              # node server.js  (serves dist/ on $PORT, default 5050)
```

`server.js` is a build artifact and is git-ignored (`npm run clean` removes it). If `NODE_ENV` is not `production`, the server attempts the Vite dev middleware and automatically falls back to serving the static `dist/` build when Vite is unavailable.

> **Build with production environment values.** Vite inlines every `VITE_*` variable **at build time**, so `dist/` contains whatever `.env` was present when `npm run build` ran (e.g. `VITE_PLATFORM_OWNER_EMAILS`, `VITE_FIREBASE_PROJECT_ID`, `VITE_USE_FIREBASE_EMULATOR`, `VITE_DEFAULT_TENANT_ID`). Never produce the production bundle from the local development `.env`: set the production values first (a committed `.env.production` or CI environment), then confirm `VITE_USE_FIREBASE_EMULATOR=false`, the real Firebase project id, and the real platform-owner email(s) are the ones baked into `dist/`.

## Production Architecture & Environment

The application is architected with a decoupled full-stack TypeScript design:

- **Frontend**: Vite-bundled React SPA, statically servable or served via Express.
- **Backend API**: Express server (`server.ts` → `server.js`) with Firebase Admin authentication, domain-based tenant resolution middleware, and headless Chromium Puppeteer PDF generation.
- **Data Persistence**: Firebase Firestore with strict multi-tenant security rules (`firestore.rules`).

## Firebase Authentication (Production Domains)

The `auth` block in `firebase.json` targets the **Auth emulator** and therefore lists only `http://localhost:5050`, `http://localhost`, and `http://127.0.0.1:5050` as authorized redirect URIs, with a neutral placeholder support email. Google redirect sign-in **will fail on a real domain** until the operator, in the Firebase Console (Authentication → Settings → Authorized domains):

1. Adds every production host (e.g. `portal.example.sa`) to **Authorized domains**.
2. Registers the real OAuth redirect URIs and the correct support email for the project.

Never commit a school's real support email or tenant domains into `firebase.json`; per-tenant hostnames belong in the tenant registry / Firestore (`settings/{tenantId}`), not in platform config.

## Environment Variable Checklist

All private configuration is managed strictly via environment variables (see `.env.example`):

| Variable | Scope | Description |
| :--- | :--- | :--- |
| `PORT` | Server | Application port (default: 5050). |
| `NODE_ENV` | Server / Client | Environment mode (`development`, `production`); set to `production` to serve the static bundle. |
| `APP_URL` | Server | Application base URL. |
| `GEMINI_API_KEY` | Server | Google Gemini API key for AI document analysis. |
| `VITE_FIREBASE_*` | Client | Firebase client configuration keys. |
| `GOOGLE_APPLICATION_CREDENTIALS` | Server | Optional path to Firebase Admin Service Account JSON. |
| `TRUST_PROXY` | Server | Reverse-proxy trust for `X-Forwarded-*`. Unset/false = ignore (default). Set to hop count (e.g. `1`) or subnet list behind a known proxy. |
| `APP_AUTH_TOKEN` | Server | Shared dev bearer token; required only when `ALLOW_DEV_AUTH=true`. |
| `TENANT_ENCRYPTION_MASTER_KEY` | Server | Master key for encrypting per-tenant AI secrets. |

## Production Security Hardening Checklist

- [x] Zero committed secrets or API keys in source control.
- [x] Backend API endpoints guarded by `authenticateToken`, `requireRole`, and `requireTenant`.
- [x] Granular rate limits configured on AI routes (`express-rate-limit`).
- [x] Multi-tenant database rules enforcing tenant isolation and parent privacy (`firestore.rules`).
- [x] Automated test gates passing 100% (`npm test` and `npm run audit`).
- [x] API error responses return generic messages; internal `err.message` is logged server-side only.
- [x] Production runs a compiled `server.js` (no `tsx`/devDependency at runtime), so `npm ci --omit=dev` boots.
- [x] Transport/header hardening via `helmet`: CSP + HSTS (production), `X-Content-Type-Options`, `Referrer-Policy: no-referrer`, COOP `same-origin-allow-popups`.
- [x] `X-Forwarded-Host` is only trusted when `TRUST_PROXY` is configured; otherwise the real `Host` header decides the school.

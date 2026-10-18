# Go-Live Runbook (beginner-friendly)

Hosting targets: **Vercel (recommended — no card required)** or **Render (free Docker web
service, which now prompts for a card)**. Everything that can be scripted already is; the
steps that remain need **your** Google account, because they create secrets only you can make.

> Cold-start note: Render's free tier sleeps after inactivity (~30–60 s to wake). Vercel
> functions cold-start too (~1–3 s; the first PDF export is slower while Chromium unpacks).

---

## Step 0 — Vercel (recommended)

`vercel.json`, `api/[...path].ts` and serverless Chromium support are already committed, so
Vercel needs no code changes.

1. Sign up at <https://vercel.com/signup> with GitHub (Hobby needs no credit card).
2. **Add New → Project** → import `elnewahy2025/Smart-absecene-`. Vercel reads `vercel.json`:
   build `npm run build`, output `dist`, function `api/[...path].ts`.
3. Add the environment variables from `.env.production`, plus these two:
   - `PUPPETEER_SKIP_DOWNLOAD=1` — build-time only; stops Chromium downloading during install.
   - `TRUST_PROXY=1` — Vercel proxies every request.
   - Do **not** add `NODE_ENV` (it would skip devDependencies and break the build).
4. **Deploy**, then add the `*.vercel.app` domain under Firebase → Authentication → Settings →
   Authorized domains, and sign in.

> Vercel Hobby terms allow non-commercial use only; a paid school SaaS may need the Pro plan.

---


## What is already done for you

- Security remediation complete and verified (`npm run lint`, `npm test`, `npm run build`, `npm run audit`).
- Dead JWT decoder removed; no fabricated identity/medical defaults remain.
- `TENANT_ENCRYPTION_MASTER_KEY` rotated; `tenant-ai-secrets.json` re-encrypted (with a `.bak`).
- Per-school AI keys now persist in **Firestore** (`tenant_ai_secrets`), so they survive redeploys.
- Deployment files added: `Dockerfile`, `.dockerignore`, `render.yaml`, `.env.production.example`.
- Helper commands added:
  - `npm run golive` — checks a production build is safe and scans the bundle.
  - `npm run rotate:secrets` — rotate the master key again later.
  - `npm run migrate:secrets` — copy old file-based AI keys into Firestore.

---

## Step 1 — Get your Firebase service-account key (5 min)

1. Open <https://console.firebase.google.com/> → pick your project.
2. **Gear icon → Project settings → Service accounts** tab.
3. **Generate new private key → Generate key**. A `.json` file downloads. Keep it safe.
4. Turn it into one line of base64 (needed for Render):

   ```powershell
   [Convert]::ToBase64String([IO.File]::ReadAllBytes("C:\path\to\serviceAccountKey.json")) | Set-Clipboard
   ```

   The clipboard now holds the value for `FIREBASE_SERVICE_ACCOUNT_BASE64`.

## Step 2 — Create the Render service (10 min)

1. Push this repo to GitHub (if not already).
2. Go to <https://render.com/> → **Sign up / Log in with GitHub**.
3. **New + → Blueprint**, pick this repository. Render reads `render.yaml` automatically.
4. Render asks you to fill the values marked as secrets. Paste the values from your
   `.env` (open it with `notepad .env`) plus the base64 from Step 1:

   | Variable | Where it comes from |
   | --- | --- |
   | `FIREBASE_SERVICE_ACCOUNT_BASE64` | the base64 you just copied |
   | `FIREBASE_PROJECT_ID` | your `.env` |
   | `TENANT_ENCRYPTION_MASTER_KEY` | your `.env` (keep it identical — see Step 4) |
   | `GEMINI_API_KEY` | your `.env` |
   | `PLATFORM_OWNER_EMAILS` | your real owner email |
   | `DEFAULT_TENANT_ID` | your `.env` |
   | `VITE_FIREBASE_*` | the Firebase web config values from your `.env` |
   | `VITE_PLATFORM_OWNER_EMAIL(S)` | your real owner email |
   | `VITE_DEFAULT_TENANT_ID` | your `.env` |

   Tip: the `VITE_FIREBASE_*` values are the same ones already in your `.env`.
5. Click **Apply / Create**. Render builds the Docker image and deploys.

## Step 3 — Make sure the build is safe

Render runs `npm run build` for you. To check the result locally (same checks):

```powershell
# create a local copy of the same values first, then:
npm run golive -- --build
```

Every line should say `PASS` and end with `READY`.

## Step 4 — Move any existing AI keys into Firestore

If a school already had an AI key saved in the old JSON file, copy it across (once):

```powershell
node scripts/migrate-ai-secrets-to-firestore.mjs
```

The master key on Render must be the same value as in your `.env`, or the old keys will not
decrypt — if it differs, just have each school re-enter its key in the app instead.

## Step 5 — Replace the leaked AI key

The old `school-1` key was exposed publicly.

1. <https://console.cloud.google.com/apis/credentials> → **API keys**.
2. Delete/regenerate the key starting with `AQ.Ab8R…`.
3. In the app: sign in as the school admin → **Settings → AI / Communications** → paste the new key → Save.

## Step 6 — Deploy the Firestore rules & indexes (once)

```powershell
npm install -g firebase-tools
firebase login
firebase deploy --only firestore:rules,firestore:indexes
```

## Step 7 — Give users their roles

First the owner. Owner emails never get a `users` profile written by the client,
so this one needs its own script — run it **after** you have signed in once:

```powershell
node scripts/grant-platform-owner.mjs your-owner@example.com
```

Then everyone else:

```powershell
node scripts/backfill-user-claims.mjs
```

Prints `Updated N; skipped M`. Anyone skipped has no role/school — set it in
**Settings → Users**. Each existing user must **sign out and back in** once.

## Step 8 — Visit your app

Open your deployment URL (`https://smart-absecene-drul.vercel.app`), sign in as
the owner, and confirm you reach the dashboard. To use your own domain, add it to
the school's `customDomains` in `src/config/tenantRegistry.ts` **and** to
**Firebase → Authentication → Settings → Authorized domains**.

---

## Troubleshooting

| Symptom | Cause | Fix |
| --- | --- | --- |
| First load is slow | Free tier sleeps when idle | Expected; it wakes in ~30–60s |
| `403 NO_ROLE_ASSIGNED` | User has no role claim | Set role in Settings → Users, re-run Step 7, user re-logins |
| `auth/unauthorized-domain` on sign-in | Deployment host not in Firebase | Add it in **Firebase → Authentication → Settings → Authorized domains** |
| "النطاق غير مسجل في النظام" | Host missing from the school's `customDomains` | Add the host in `src/config/tenantRegistry.ts`, commit, redeploy |
| `503 AUTH_NOT_CONFIGURED` | Service account missing/wrong | Redo Step 1 and set `FIREBASE_SERVICE_ACCOUNT_BASE64` |
| `503 GATEWAY_NOT_CONFIGURED` | School has no messaging gateway | Admin → Settings → Communications |
| Blank page / emulator data | A `VITE_*` value missing at build | Re-check the `VITE_FIREBASE_*` vars in Render, then **Manual Deploy → Clear build cache & deploy** |
| PDF fails to generate | Chromium sandbox blocked by the host | Tell the developer; may need a restricted no-sandbox mode for the PDF worker |
| Build fails | A secret contained spaces (Render quirk) | Re-paste the value with no leading/trailing spaces |

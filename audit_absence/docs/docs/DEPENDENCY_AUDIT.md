# DEPENDENCY_AUDIT
Lockfile: `package-lock.json` present (`npm ci` OK, 572 packages). `npm audit` **not verified**. Reference counts below are text matches across the repo (excluding package files).

## Runtime
| Package | Version | Role | Use |
|---|---|---|---|
| react / react-dom | ^18.2 | UI | core |
| firebase | ^10.14 | client Auth/Firestore | 149 refs |
| firebase-admin | ^12.7 | server Auth/Firestore | server.ts |
| express ^4.21, helmet ^7.2, express-rate-limit ^7.4 | HTTP stack | server.ts |
| @google/genai | ^2.4 | Gemini | server.ts |
| nodemailer ^6.10 | SMTP | messagingProviders |
| puppeteer ^25.13, puppeteer-core ^25.14, @sparticuz/chromium ^153 | PDF | server.ts (both puppeteer variants present: full in Docker/dev, core on Vercel) |
| recharts ^2.15 (deprecated 2.x per install warning) | charts | UI |
| lucide-react ^0.294 | icons | UI |
| jsqr, qrcode | QR scan/generate | QR modals |
| dotenv | env | server/scripts/tests |
## Dev
vite 5, @vitejs/plugin-react, tailwindcss 4 + @tailwindcss/vite, typescript 5, tsx, esbuild 0.19 (server bundle), vitest 1.6, @firebase/rules-unit-testing, rimraf, @types/*, **autoprefixer (no reference found — unused)**.
## Observations
- Deprecated: recharts 2.x (npm warning during install). Duplicate-purpose: `puppeteer` and `puppeteer-core`.
- `puppeteer` (large, bundled-browser downloader) is skipped via `PUPPETEER_SKIP_DOWNLOAD`.
- Suspicious packages: none identified (no install scripts reviewed).

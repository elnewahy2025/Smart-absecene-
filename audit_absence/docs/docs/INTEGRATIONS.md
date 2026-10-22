# INTEGRATIONS
| Integration | Where | Credentials | Notes |
|---|---|---|---|
| Firebase Auth / Firestore (client) | `src/lib/firebase.ts`, `AttendanceContext` | public web config | emulator switch |
| Firebase Admin | `server.ts` | service account env/file | required for API auth |
| Google Gemini | `server.ts` (`@google/genai`) | tenant key (encrypted) or `GEMINI_API_KEY` | see AI_ARCHITECTURE |
| Twilio, Unifonic, Msegat, Taqnyat (SMS) | `messagingProviders.ts` | tenant `settings_private` | fixed HTTPS endpoints |
| WhatsApp Cloud API v21.0 | same | tenant token | text only; `web_direct` mode is manual wa.me (`whatsappUtils.ts`, `window.open`) |
| SMTP (nodemailer), Resend, SendGrid | same | tenant | SMTP host is tenant-supplied |
| Chromium/Puppeteer | `server.ts` | — | Google Fonts + cdn.tailwindcss.com at render time |
| Google Fonts | CSP/PDF | — | |
Webhooks inbound, background jobs, cron: **Not present in the inspected repository.** Storage buckets: **Not present** (config exists, no code usage found).

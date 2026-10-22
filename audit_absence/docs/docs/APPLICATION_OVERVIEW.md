# APPLICATION_OVERVIEW

**Name:** Smart School Attendance System (`package.json: smart-school-attendance` 1.0.0; UI footer says "Version 2.4.0 (2026)" — inconsistent). Arabic/English UI, Arabic default.

**What it does (from code):** schools take daily/period attendance, manage students, review parent excuses (with optional Gemini document analysis), send absence notifications through SMS/WhatsApp, produce reports/PDFs, an AI chatbot, a daily executive digest, and a platform-owner console that provisions schools and controls subscriptions.

**Roles** (`VALID_ROLES`, server.ts): `super_admin` (platform owner), `admin` (school principal), `registrar`, `teacher`, `parent`.

**Multi-tenancy:** one Firestore, `tenantId` on every record; schools addressed by custom domain or `<subdomain>.…` host; seeded static tenants `school-1` (andalus) and `school-2` (falah), dynamic tenant `school-majd` in `dynamicTenants.json`.

**Tech:** React 18, Vite 5, Tailwind 4, Recharts, lucide-react, jsQR + qrcode (QR attendance), Express 4, helmet, express-rate-limit, firebase / firebase-admin, @google/genai, nodemailer, puppeteer / puppeteer-core / @sparticuz/chromium.

**Source size:** ~48.8k lines TS/TSX/JS; largest: `AttendanceContext.tsx` 3,739, `server.ts` 2,573, `mockData.ts` 1,752 (tests/seed only).

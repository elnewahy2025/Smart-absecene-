# Smart School Attendance & Student Safety System ("Madrasati Hodoor")

[![TypeScript](https://img.shields.io/badge/TypeScript-5.5-blue.svg)](https://www.typescriptlang.org/)
[![React](https://img.shields.io/badge/React-18.3-61dafb.svg)](https://reactjs.org/)
[![Node.js](https://img.shields.io/badge/Node.js-20.x-green.svg)](https://nodejs.org/)
[![Express](https://img.shields.io/badge/Express-4.21-lightgrey.svg)](https://expressjs.com/)
[![Firebase](https://img.shields.io/badge/Firebase-Firestore%20%7C%20Auth-orange.svg)](https://firebase.google.com/)
[![Tests](https://img.shields.io/badge/Tests-636%20Passed-brightgreen.svg)](https://vitest.dev/)
[![Security Audit](https://img.shields.io/badge/Security%20Audit-Zero%20Secrets%20%7C%20Clean-success.svg)](#security-policy)
[![License](https://img.shields.io/badge/License-MIT-purple.svg)](LICENSE)

An enterprise-grade, multi-tenant school attendance, student safety, and compliance platform tailored for Arab and international educational institutions. Features real-time optical QR code attendance, automated medical excuse verification with AI, a comprehensive parent portal, emergency evacuation roster generation, server-rendered vector PDF reports, and strict multi-school boundary isolation.

> **Language Notice:** For the Arabic version of this documentation, please see [README.ar.md](README.ar.md).

---

## 🌟 Key Architectural Pillars

### 1. Domain-Based Multi-Tenancy & Host Isolation
- **Strict Host Binding:** Every school is completely isolated by hostname/subdomain (e.g., `andalus.smartschool.com` or custom domains).
- **Custom Branding per Tenant:** Dedicated visual identities (logos, ministry headers, official stamps, color palettes).
- **Anti-Tampering:** Sessions, database queries, and URL query strings enforce tenant isolation; cross-tenant access is rejected at both the Firestore rules and Express server boundaries.
- **Platform Owner Hub:** Only verified Platform Owners (`super_admin`) have access to multi-tenant provisioning, cross-school overview, and the test tenant switcher.

### 2. Multi-Tier Role-Based Access Control (RBAC)
Supports five segregated user roles:
- **Platform Owner (`super_admin`)**: Global system oversight, school provisioning, and messaging gateway infrastructure.
- **School Principal / Admin (`admin`)**: School settings, staff accounts, timetable schedules, holidays, and official approval workflows.
- **Registrar / Student Affairs (`registrar`)**: Student enrollment, class assignments, and attendance monitoring.
- **Teacher (`teacher`)**: Daily class attendance, touchless QR scanning, and student conduct notes.
- **Parent (`parent`)**: Real-time access strictly isolated to their own enrolled children (attendance, infractions, excuses, and outbox logs).

### 3. Touchless QR Attendance Engine & 3-Condition Guardrails
- **Continuous Camera & Barcode Scanner Support:** WebRTC real-time stream scanning, mobile camera environment capture, and physical USB/Bluetooth hardware barcode scanners.
- **Guardrail 1 (Mode Confirmation):** Strict isolation between manual attendance and QR scanning to prevent accidental roster resets.
- **Guardrail 2 (Deferred Absence & Late Minutes):** Non-scanned students remain pending until the session is finalized, allowing teachers to mark tardy arrivals with precise minutes.
- **Guardrail 3 (Anti-Duplicate Detection & Timestamping):** Prevents duplicate scans, emits auditory and visual alerts with previous scan times, and records exact entry timestamps down to the second.

### 4. Native Vector PDF Generation Engine
- **Server-Side Puppeteer Engine:** High-resolution A4 official reports generated via headless Chromium (`/api/pdf/generate`).
- **Typography & Formatting:** Native Cairo and Amiri Arabic typography with selectable, searchable vector text (zero pixelated canvas screenshots).
- **Official Templates:** Attendance summaries, student QR ID badges, and emergency evacuation rosters with QR authenticity validation.

### 5. Comprehensive Parent Portal
- **Consolidated Multi-Child Dashboard:**
  - **Attendance Timeline:** Detailed class periods, dates, subjects, absence types, and teacher notes.
  - **Behavior & Conduct:** Real-time infractions, positive reinforcement points, and teacher feedback.
  - **Medical Excuses:** Upload medical certificates with automated AI document verification and review tracking.
  - **Communications History:** Outbound SMS and WhatsApp notification history with gateway delivery receipts.

### 6. AI-Assisted Document Analysis
- Uses Google Gemini API (`@google/genai`) to analyze medical reports, sick leaves, and excuse attachments.
- Validates issue dates against the school calendar, checks for official stamps, and provides executive summaries to school administration.

---

## 🛠️ Technology Stack

| Layer | Technologies |
|---|---|
| **Frontend** | React 18, TypeScript (Strict Mode), Vite 5, Tailwind CSS (RTL-first), Lucide Icons, Recharts |
| **Backend** | Express 4, Node.js 20, TypeScript, Puppeteer (Chromium PDF Engine), Google GenAI SDK |
| **Database & Auth** | Google Cloud Firestore (Real-time listeners & Security Rules), Firebase Authentication |
| **Security & Headers** | Helmet (strict CSP, HSTS, COOP, no-referrer), Rate-Limiting, Magic Bytes Validation |
| **Testing & Quality** | Vitest 1.6, Playwright, Node.js Security Scanner (`scripts/ci-security-audit.mjs`) |

---

## 🚀 Getting Started

### Prerequisites
- **Node.js**: `v18.x` or `v20.x+` (LTS recommended)
- **npm**: `v9.x` or `v10.x+`

### Installation

1. **Clone the repository:**
   ```bash
   git clone https://github.com/your-org/smart-school-attendance.git
   cd smart-school-attendance
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Configure environment variables:**
   ```powershell
   # Windows (PowerShell):
   Copy-Item .env.example .env

   # macOS / Linux:
   cp .env.example .env
   ```
   *Edit `.env` to configure your Firebase project credentials and optional Gemini API key.*

4. **Start the development server:**
   ```bash
   npm run dev
   ```
   The application will be accessible at:  
   👉 **http://localhost:5050**

---

## 🧪 Testing & Verification Gates

The repository enforces automated quality and security gates:

```bash
# 1. TypeScript type checking (zero errors required)
npm run lint

# 2. Run the automated Vitest test suite (636 tests across 69 test files)
npm test

# 3. Security and secret audit scanner
npm run audit

# 4. Production build (Vite client + esbuild server bundle)
npm run build

# 5. Start production server
npm start
```

### Test Coverage Highlights
- **Role-Based Access Control:** `src/utils/rbac.test.ts`, `server/authMiddleware.test.ts`
- **Multi-School Isolation:** `src/utils/roleSchoolIsolation.test.ts`, `server/subscriptionEnforcement.test.ts`
- **Settings Adherence:** `src/utils/settingsComplianceAudit.test.ts`
- **Parent Portal Privacy:** `src/utils/parentPortalAudit.test.ts`
- **Messaging Gateways:** `src/utils/messagingProviders.test.ts`, `src/utils/tenantGatewaySecrets.test.ts`
- **WCAG Modal Accessibility:** `src/utils/modalA11y.test.ts`
- **Integration Engine:** `src/utils/serverIntegration.test.ts`

---

## 📁 Project Directory Layout

```text
├── docs/                           # Architecture, security, and deployment documentation
│   ├── ARCHITECTURE.md             # System architecture & boundary defense
│   ├── AUTHENTICATION_AUTHORIZATION.md # RBAC matrix and tenant isolation
│   ├── DEPLOYMENT.md               # Production deployment instructions
│   ├── FEATURES.md                 # Implemented platform features index
│   └── TESTING.md                  # Detailed test suite specifications
├── scripts/                        # Security audits, database seeders, and emulator helpers
│   ├── ci-security-audit.mjs       # Cross-platform secret and security scanner
│   ├── seed-emulator.mjs           # Local Firebase emulator seed script
│   └── test-firestore-rules.mjs    # Automated Firestore security rules tester
├── server/                         # Server-side route modules and security middleware
│   ├── authMiddleware.ts           # Token verification & claims authorization
│   ├── pdfReportRoutes.ts          # Authenticated vector PDF generation
│   └── requestHardening.ts         # Rate limiting, input validation, and headers
├── src/
│   ├── components/                 # React UI components
│   │   ├── attendance/             # Attendance sessions, rosters, QR modes
│   │   ├── dashboard/              # Executive KPI analytics & trend charts
│   │   ├── digest/                 # Daily proactive executive briefing
│   │   ├── justifications/         # Medical excuse management & AI review
│   │   ├── notifications/          # Single & batch parent dispatch modals
│   │   ├── parent/                 # Dedicated parent portal components
│   │   ├── reports/                # Statistical attendance & emergency reports
│   │   ├── settings/               # School profile, calendar, gateway, and users
│   │   └── students/               # Student roster registry & CSV ingestion
│   ├── config/                     # Domain registries and tenant profiles
│   ├── context/                    # Centralized AttendanceContext state & hooks
│   ├── types/                      # TypeScript domain models and interfaces
│   └── utils/                      # Calculations, cryptography, PDF, and test helpers
├── server.ts                       # Express application server entrypoint
├── firestore.rules                 # Cloud Firestore security rules
├── firestore.indexes.json          # Composite query index definitions
├── Dockerfile                      # Containerization for Docker deployments
└── README.md                       # Main project documentation
```

---

## 🔒 Security Policy

1. **Zero Committed Secrets:** No API keys, credentials, or service accounts are committed to Git. Scanned continuously via `npm run audit`.
2. **Session Immutability:** Once an attendance session is submitted and locked by a teacher, modifying records requires administrative unlocking with an unalterable audit log entry.
3. **Safe File Ingestion:** Strict magic byte file signature validation on image and PDF uploads (5 MB payload limit) to prevent malicious upload attacks.
4. **Header Hardening:** Express enforces `helmet` Content Security Policy, strict HSTS, and frame protection.
5. **Private Credential Isolation:** Sensitive gateway credentials and tenant AI keys are isolated in restricted collections and encrypted at rest.

---

## 📄 License
This project is licensed under the [MIT License](LICENSE).

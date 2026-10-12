# Configuration & Settings Policy

## Environment variables required

- `GEMINI_API_KEY`: API key for Google Gemini model inference (fallback architecture)
- `PORT`: Backend server port (default 3000)
- `APP_URL`: Frontend application URL
- `NODE_ENV`: Runtime environment (`development`, `production`, `test`)

## Configuration files observed

- `package.json`
- `vite.config.ts`
- `tsconfig.json`
- `.env.example`
- `firebase-applet-config.json`

## Tenant & School Settings Configuration (`tenantSettings.ts`)

Each school tenant maintains a configuration `TenantSchoolProfile` containing:
- **Academic Year Calendar**: Precise start and end dates for Term 1, Term 2, and Term 3. (Term 1 starts `2026-09-01`).
- **Official Off-Days & Holidays**: Weekend days (Friday and Saturday) and named national/school holidays.
- **Official Class Catalog**: List of approved grades and sections (e.g. `10/أ`, `10/ب`, `11/أ`, `12/أ`).
- **Timetable Periods**: Official lesson schedule periods (start/end times, period names, lesson vs break types).
- **Subject Catalog**: Approved academic disciplines and curricula.
- **Absence Warning Thresholds**: Policy thresholds (e.g. 3 unexcused days triggers formal parental warning).

## Strict Universal Settings Adherence Policy

All functions, mathematical calculations, UI dropdowns, and file ingestion pipelines throughout the application must strictly adhere to the Settings page:
1. **Zero Hardcoded Assumptions**: Months, periods, warning limits, and grade levels are dynamically derived from `schoolProfile`.
2. **File Ingestion Rejection**: Any imported file (student CSV roster, justification document, attendance sheet) containing unauthorized classes or invalid academic dates is automatically rejected and triggers a regulatory warning banner.
3. **Data Integrity Guard**: System rejects attempts to schedule attendance sessions or record excuses on weekends or holidays defined in Settings.

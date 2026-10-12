# API Overview

## Architecture & Authentication
All `/api/*` endpoints (except public health checks and vector PDF generation) are strictly guarded by:
1. `authenticateToken`: Validates Firebase ID tokens or development authorization bearer headers.
2. `requireTenant`: Enforces multi-tenant isolation and hostname-domain validation.
3. `requireRole(allowedRoles)`: Enforces role-based permissions (`admin`, `registrar`, `teacher`, `parent`).
4. Rate limiting: Granular limits on AI and digest endpoints via `express-rate-limit`.

---

## Server Endpoints

### `POST /api/pdf/generate`
- **Purpose**: Generates high-fidelity vector A4 Arabic RTL PDF documents via headless Chromium/Puppeteer.
- **Payload**:
  ```json
  {
    "htmlContent": "<!DOCTYPE html>...",
    "title": "كشف الحضور الرسمي",
    "filename": "attendance-report-10a.pdf"
  }
  ```
- **Response**: `{ "success": true, "pdfBase64": "..." }` (Base64-encoded to prevent proxy or download manager interception).

### `POST /api/chat`
- **Purpose**: AI assistant providing school attendance policy guidance and analytics advisory using Google Gemini.
- **Authorization**: Protected (`requireRole(['admin', 'registrar', 'teacher', 'parent'])`). Rate-limited (30 req / 15 min).

### `POST /api/analyze-image`
- **Purpose**: Multi-modal document integrity analysis for medical excuses, official hospital reports, and doctor signatures.
- **Authorization**: Protected (`requireRole(['admin', 'registrar', 'parent'])`). Rate-limited.
- **Validation**: Enforces 5MB max payload and magic byte MIME verification.

### `POST /api/daily-digest/generate-briefing`
- **Purpose**: Generates dynamic executive morning attendance briefings and anomaly reports for school leadership.
- **Authorization**: Protected (`requireRole(['admin', 'registrar'])`).

### `POST /api/daily-digest/dispatch`
- **Purpose**: Dispatches the daily email digest to configured administrative leadership and counselors.
- **Authorization**: Protected (`requireRole(['admin', 'registrar'])`).

### `GET /api/tenant/resolve`
- **Purpose**: Resolves canonical tenant ID, school branding, and configuration from the incoming request hostname.
- **Authorization**: Public.

### `GET /api/health`
- **Purpose**: System health and readiness check endpoint.
- **Response**: `{ "status": "ok", "service": "smart-school-attendance", "timestamp": "..." }`

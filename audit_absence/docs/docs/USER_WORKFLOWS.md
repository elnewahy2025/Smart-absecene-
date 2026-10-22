# USER_WORKFLOWS
Scope: workflows supported by code paths verified in `App.tsx`, `LoginPage`, `signInWithCredentials`, the context actions and server routes. **Field-level screen contents were not read for most views** (marked "details UNKNOWN"). Prerequisites: school domain resolves to an active tenant; school subscription enabled (else a suspended/expired screen is shown, owner exempt).

## Common: sign in
1. Open the school's domain → branded login (`LoginPage`). 2. Enter email + password. 3. App signs in with Firebase, rejects accounts whose loaded profile belongs to another school or is `inactive`. 4. Landing tab by role: parent → parent portal; teacher → attendance sessions; others → dashboard. Errors: wrong password/generic failure messages; unknown domain (404 screen); inactive tenant; subscription suspended/expired (402 screen).

## Teacher (only tab: daily attendance sheets)
Create session (class, daily/period) → mark statuses (`updateRecord`, bulk present) → submit (`submitSession`; after submit only admin/registrar can reopen per rules). Quick actions: QR scan (`QRScannerModal`, details UNKNOWN), emergency roster. Result: session stored in `attendance_sessions` and per-student records mirrored in `attendance_records` (write sites at context 1213-1222). Possible errors: Firestore permission denied (logged only); teacher assignment is checked by rules via `teacherId`/`assignedClasses`.

## Parent (portal, excuses, messages)
Sees children matched by `guardianPhone`/email (queries add `guardianPhone`); views attendance records, outbox messages; submits an excuse with explanation and optional attachment (`createJustification` → `justifications` with status `pending`; base64 attachment inside the document). Prerequisite: an account created by school staff with matching phone. Details of screens UNKNOWN.

## Registrar / Admin (operations)
Dashboard & AI morning briefing; attendance oversight (reopen sessions); student register (add/import/transfer/restore/delete); review excuses (approve/reject, AI analysis via `/api/analyze-image`; approval creates a notification to the guardian — `reviewJustification` writes an `excuse_approved` outbox item at context:2300); outbox (send/retry via `/api/notifications/dispatch`; WhatsApp `web_direct` requires manual send); chronic-absence warnings; reports/PDF; AI chatbot; daily digest. Registrar cannot open settings/audit tab (UI guard).

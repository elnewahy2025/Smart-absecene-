# User Workflows & Ingestion Policies

## Staff workflow

1. Open the dashboard and select the active tenant.
2. Review attendance sessions and mark students as present, absent, late, or excused (lesson periods and subjects dynamically derived from Settings).
3. If an attendance session date falls on a weekend or holiday defined in Settings, a regulatory warning alerts staff.
4. Review incoming justifications and medical excuses (verified against academic calendar dates).
5. Send reminders or formal warnings to guardians based on `unexcusedWarningThreshold` configured in Settings.
6. Generate a daily digest summary for school leadership.
7. Export reports for official archive or compliance use.

## Student Roster CSV Upload & Ingestion Rejection Workflow

1. Registrar or admin opens the Student Management module.
2. The user downloads an official CSV template generated dynamically from `schoolProfile.classes`.
3. The user uploads a CSV file containing student records.
4. **Settings Compliance Validation Engine**:
   - Each row is validated against `schoolProfile.classes`.
   - If an imported student belongs to a class or grade not defined in School Settings, the row is **rejected immediately**.
   - The user is presented with a red regulatory banner: *"تنبيه تنظيمي: تم استبعاد (...) سجلات لأنها تخالف الفصول المعتمدة في صفحة إعدادات المدرسة"*.
   - Rows violating settings cannot be imported, and the commit button is disabled if zero valid records exist.

## Parent & Medical Excuse Workflow

1. Parent logs in and views their registered children.
2. Parent receives automated absence alerts when absences reach thresholds defined in Settings.
3. Parent submits a medical excuse or justification:
   - Date picker is constrained strictly within the Academic Calendar bounds (`term1Start` to `term3End`).
   - If the selected date falls outside the academic year or on an official off-day/weekend, the submission is **blocked** with an explicit error alert.
4. School staff reviews the excuse and either approves, refers, or rejects it.

## Attendance Review Workflow

1. A teacher creates or updates a session for an approved class and scheduled period.
2. The student status is recorded per session.
3. The school can approve, reject, or refer a justification.
4. The attendance summary updates automatically.

## Daily Digest Workflow

1. A compliance or admin user triggers digest generation.
2. The system calculates anomalies, at-risk students (using Settings threshold), and pending justifications.
3. A Gemini-based summary may be appended.
4. The digest can be dispatched to recipients.

## Touchless QR 3-Condition Check-In Workflow

1. **Step 1: Initiation & Explicit Warning Confirmation**:
   - In manual mode, all students are present by default.
   - When the teacher clicks "بدء جلسة مسح الـ QR", the roster is NOT immediately reset.
   - A dedicated confirmation modal appears with a clear warning explaining that entering QR mode will transition unscanned students into a pending state (`⏳ بانتظار مسح الـ QR`).
   - The teacher must explicitly confirm before the scanning session starts.

2. **Step 2: Live Scanning, Duplicate Prevention & Timestamping**:
   - The teacher directs student badges to the camera or hardware barcode scanner.
   - **First Scan**: The student is immediately marked `present` with an exact time-stamp note (`حضور عبر مسح الـ QR في تمام HH:MM:SS`), a pleasant audio chime plays, and the live counter updates.
   - **Duplicate Scan**: If the same badge is scanned again, re-registration is blocked, a low-frequency warning tone plays, and an amber alert banner displays:
     `⚠️ تنبيه تكرار: الطالب (...) مسجل حضور بالفعل في تمام الساعة [الوقت]. تم منع التكرار للحفاظ على دقة السجل.`

3. **Step 3: Deferred Finalization & Late Arrival Review**:
   - Throughout the scan, all unscanned students remain safely in pending state (`pending`).
   - Final absence is **never committed automatically**.
   - When the teacher clicks "إنهاء جلسة المسح واعتماد الغياب", a review modal appears.
   - The modal displays: total class size, verified present students, and unscanned students.
   - For every unscanned student, the teacher can toggle them between `غائب (Absent)` and `متأخر (Late)` with a quick minutes selector (5, 10, 15, 20, 30, 45 min) to prevent late arrivals from being unfairly penalized.
   - Once confirmed, final records are saved to the attendance session and audit log.

## Platform Owner Provisioning & Smart Holiday Search Workflow

1. Platform Owner logs in (`owner@smartschool.platform`).
2. **Instant School Provisioning**:
   - Opens Platform Owner Hub (`PlatformOwnerModal.tsx`).
   - Enters school name, subdomain, country, and admin details.
   - The school is registered in `dynamicTenants.json` and immediately resolvable across all subdomains.
3. **Smart Holiday Search & Ministerial Presets**:
   - In Settings > Holidays & Weekends, the exclusive gold button `[بحث واستيراد ذكي (The Owner)]` is accessible.
   - Queries verified official holidays for any country and academic year via Gemini API or accredited country presets.
   - One-click import applies holidays, adapts weekend structures (Fri-Sat vs Sat-Sun), and dynamically adjusts ministerial letterheads across settings tabs.


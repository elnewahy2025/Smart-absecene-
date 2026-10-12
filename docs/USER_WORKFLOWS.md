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

# Function Documentation

## `callGeminiWithFallback`

Purpose: Execute Gemini requests with a fallback list of models.

Inputs: model list, prompt payload, optional image or structured content.

Outputs: generated response text or structured JSON-like content.

Notes: The function is central to AI features but lacks broad validation and rate limiting.

## `AttendanceProvider`

Purpose: Provide app-wide state and actions for sessions, students, notifications, settings, and justifications.

Notes: This is the central coordination point for the application. It mixes multiple responsibilities and should be decomposed in a more production-oriented architecture.

## `importStudents`

Purpose: Bulk import student rows from CSV or sample data.

Validation & Settings Policy:
- Validates student ID, national ID, phone numbers, and class name against `schoolProfile.classes`.
- If an imported row specifies a class or grade not registered in the Settings page (`schoolProfile.classes`), the row is categorically rejected with an explicit violation error (`مخالف لصفحة الإعدادات: الفصل غير مسجل`).
- Stage 2 preview alerts administrators with a regulatory red banner when violations occur and disables commitment if no valid rows exist.
- State-level filter in `AttendanceContext.importStudents` enforces that unregistered classes are dropped.

## `createJustification`

Purpose: Submit a medical excuse or absence justification with supporting documents.

Validation & Settings Policy:
- The absence date is validated against the active school profile's academic year start/end dates and individual term intervals. Dates prior to Term 1 (e.g. Month 8) or beyond Term 3 are rejected.
- The date is checked against `isSchoolOffDay`: if it falls on a weekend (Friday/Saturday) or official holiday declared in the Settings calendar, submission is strictly blocked with an explanatory error.
- UI form enforces date pickers with `min`/`max` bounds and displays instant visual warnings.

## `reviewJustification`

Purpose: Approve or reject a justification and update attendance state if needed.

Notes: Important policy logic synchronized with attendance statistics and parent notification delivery.

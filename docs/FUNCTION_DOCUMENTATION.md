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

Notes: Csv validation logic exists in the UI and state layer, but robust server-side validation is absent.

## `reviewJustification`

Purpose: Approve or reject a justification and update attendance state if needed.

Notes: Important policy logic but does not appear fully protected from unauthorized mutation in the present implementation.

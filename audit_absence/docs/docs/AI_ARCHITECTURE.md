# AI_ARCHITECTURE
All AI is server-side Gemini via `@google/genai`; the browser never holds an AI key.
**Key selection** (`getGenAIClientForTenant`): tenant key (AES-256-GCM, `tenantAISecrets.ts`, Firestore `tenant_ai_secrets` or local file) → `GEMINI_API_KEY` → none (503). Silent fallback to the platform key if a tenant key is missing/undecryptable.
**Model fallback** (`callGeminiWithFallback`): ordered candidates (e.g. `gemini-3.5-flash` → `3.5-flash-lite` → `3.7-flash` → `3.8-flash` → `3.1-pro-preview`); existence of these IDs is **UNKNOWN**. `preferredModel` stored per tenant is unused.
**Use cases:**
1. `/api/chat` — 3 Arabic role prompts (counselor, teacher_fast, policy_analyst); history ≤20 msgs × 4000 chars; temperature 0.7.
2. `/api/analyze-image` — forensic review of medical excuse (JSON response mime); result stored on `Justification.aiAnalysis` with `verificationStatus`, `overallRiskLevel`, `integrityScore`, `recommendedDecision`, `irregularities`; decisions are made by staff (`reviewJustification`), no auto-approval found in code read.
3. `/api/daily-digest/generate-briefing` — executive JSON briefing from client stats.
4. `/api/owner/holidays/search` — holiday JSON; falls back to `countryPresets.ts`.
**Security:** prompt injection surface (SEC-16); student documents sent to Google; no output schema validation; no PII minimisation; errors fail closed (503, no fake output — code states "no simulations").

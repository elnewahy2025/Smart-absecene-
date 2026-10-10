# Integrations

## External systems observed

- Google Gemini
- Firebase Authentication
- Firestore database
- QR generation logic
- notification/message workflow (WhatsApp/SMS pattern)

## Internal integration pattern

The frontend uses a context layer to orchestrate state and external service calls. Express routes provide AI operations and health checks.

## Integration notes

- Gemini is used for chat, document analysis, and executive brief summaries.
- Firebase is intended for auth and persistence.
- The local app state is also used heavily, which reduces the dependency on a truly separate backend service layer.

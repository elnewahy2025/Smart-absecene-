# API Overview

## server endpoints observed

### `POST /api/chat`

Purpose: AI chat assistant for school attendance guidance.

Request example:

```json
{
  "messages": [{ "role": "user", "content": "Help with this attendance case" }]
}
```

### `POST /api/analyze-image`

Purpose: Analyze uploaded reports or medical excuse documents using Gemini.

### `POST /api/daily-digest/generate-briefing`

Purpose: Generate morning briefing and digest summary.

### `POST /api/daily-digest/dispatch`

Purpose: Simulate dispatch of a daily digest to configured recipients.

### `GET /api/health`

Purpose: health check endpoint.

## Notes

- The AI layer is implemented in `server.ts`.
- The endpoints are not protected by authentication or authorization in the inspected code.
- Error handling is basic and there is no rate limiting or payload validation beyond simple checks.

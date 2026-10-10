# AI Architecture

## AI flow

1. Client sends request with prompt or image data.
2. Express backend receives request.
3. The server calls `callGeminiWithFallback`.
4. Gemini model returns content.
5. The result is parsed, normalized, and returned to the frontend.

## Primary uses

- chat assistant
- image-based excuse analysis
- executive digest summary generation

## Risk areas

- prompt injection via arbitrary user text
- no auth controls on endpoints
- missing rate limiting and moderation
- output validation is limited

## Recommendation

Apply prompt safety rules, route authentication, abuse protections, and structured result validation for all model outputs.

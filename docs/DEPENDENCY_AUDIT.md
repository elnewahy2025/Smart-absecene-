# Dependency Audit

## Runtime dependencies

- react, react-dom
- express
- firebase
- @google/genai
- qrcode
- recharts
- lucide-react
- dotenv

## Development dependencies

- vite
- typescript
- tsx
- tailwindcss
- eslint-related tooling (if present in package manifests)

## Observations

- The project uses a modern React + TypeScript stack and a lightweight backend.
- AI functionality depends on Gemini and cloud API access.
- Firebase is used for authentication and persistence.
- There is no visible evidence of security scanning or dependency vulnerability policy in the repo inspection.

## Recommendation

Add dependency scanning and regular audit automation, especially for frontend packages and AI-related SDKs.

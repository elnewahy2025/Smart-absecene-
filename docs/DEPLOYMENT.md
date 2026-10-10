# Deployment

## Local development

Likely commands include:

- `npm install`
- `npm run dev`
- `npm run build`
- `npm run start`

## Production assumptions

The project appears to use:

- Vite for frontend build
- Express for backend serving
- static asset serving for production builds
- environment variables for configuration

## Deployment requirements

- Node runtime
- environment variables for Gemini and app config
- Firebase configuration
- secure hosting environment for backend and static serving

## Risk

The repository is not production-hardened as-inspected, especially due to security issues and lack of test coverage. Production deployment should wait for backend authorization and secret management hardening.

# Configuration

## Environment variables likely required

- `GEMINI_API_KEY`
- `PORT`
- `APP_URL`
- `NODE_ENV`

## Configuration files observed

- `package.json`
- `vite.config.ts`
- `tsconfig.json`
- `.env.example`
- `firebase-applet-config.json`

## Configuration concerns

- Secret values appear to be stored in repo metadata or client config files.
- This should not be treated as a secure production deployment pattern.
- Environment variable usage should be formalized and validated.

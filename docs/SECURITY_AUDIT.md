# Security Audit

## Critical findings

### 1) Firebase configuration appears committed to source control

The repository contains `firebase-applet-config.json` with app metadata and public client configuration. This is not a secret in the same way as a private key, but it is still sensitive operational data and should be managed via environment variables and project settings.

### 2) AI endpoints are unauthenticated

The routes in `server.ts` such as `/api/chat`, `/api/analyze-image`, and daily digest endpoints have no visible authentication or authorization middleware.

### 3) Firestore rules are broad

The Firestore rules allow signed-in users to access major collections. This is not sufficient for tenant separation or role enforcement.

### 4) Client-side authorization is not a secure control boundary

Parent restrictions are largely implemented in the React state logic rather than server/database policy. Client-side filtering must not be relied on for security boundaries.

### 5) Hardcoded admin identity details

The project contains a hardcoded admin email in rules or logic, which is brittle and difficult to manage in production.

## Recommended remediation

- Remove commits of sensitive configuration from the repository.
- Enforce auth on all server routes.
- Add per-tenant access checks.
- Validate incoming AI payloads.
- Add rate limiting and abuse monitoring.
- Upgrade Firestore rules to role-based access controls.

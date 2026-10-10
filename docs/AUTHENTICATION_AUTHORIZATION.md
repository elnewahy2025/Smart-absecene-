# Authentication and Authorization

## Authentication mechanisms observed

- Firebase Authentication is initialized and used for login and session management.
- Google sign-in is a supported path.
- `AttendanceContext` stores the authenticated user and active role.

## Authorization model

Role-based UI behavior exists for:

- admin
- registrar
- teacher
- parent

The app filters or hides tabs and data based on the selected role.

## Important limitation

The authorization logic is largely client-side. This is not equivalent to a real authorization boundary. Production-grade systems must enforce authorization at the API and database layers.

## Recommended approach

- Require auth middleware on all API endpoints.
- Validate user role on each server route.
- Enforce tenant and child ownership at the backend.
- Use Firestore security rules to restrict collection access by user role and tenant.

# Audit Findings

## Critical

- Sensitive Firebase configuration appears to be stored in the repository.
- Endpoint-level authorization is absent in the AI routes.
- Firestore security rules are too broad for a multi-tenant school system.

## High

- Client-side role checks are not enough to protect regulated data.
- No tenant isolation at the database layer is visible.
- No rate limiting or abuse control is implemented for AI endpoints.

## Medium

- Large context file mixing responsibilities.
- LocalStorage-heavy flows reduce production certainty.
- No visible automated testing.

## Conclusion

The app has a good prototype-level feature surface, but the operational security model requires significant work before production deployment.

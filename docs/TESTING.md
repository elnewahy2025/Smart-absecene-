# Testing

No formal test suite was discovered in the inspected repository tree.

## Missing test coverage indicators

- no `__tests__` directory
- no `vitest.config` or `jest.config`
- no Playwright or Cypress configs
- no CI workflows in the inspected tree

## Impact

The app may function in a demo environment but lacks automated regression coverage, which makes production reliability and refactoring risk substantially higher.

## Recommended testing strategy

- unit tests for state helpers and filters
- component tests for UI behavior
- API tests for Gemini and server routes
- integration tests around attendance submission and notifications
- end-to-end tests for parent and admin flows

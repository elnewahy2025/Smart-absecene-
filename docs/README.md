# Smart Attendance System Repository Documentation

This directory contains comprehensive documentation, architecture blueprints, feature registries, audit findings, and operational handbooks for the Smart Attendance System.

## Contents

- [Architecture](./ARCHITECTURE.md)
- [Features](./FEATURES.md)
- [Configuration & Settings Policy](./CONFIGURATION.md)
- [Admin Workflows](./ADMIN_WORKFLOWS.md)
- [User Workflows & Ingestion](./USER_WORKFLOWS.md)
- [API Documentation](./API.md)
- [Function Documentation](./FUNCTION_DOCUMENTATION.md)
- [Security Audit](./SECURITY_AUDIT.md)
- [Audit Findings](./AUDIT_FINDINGS.md)
- [Testing Suite](./TESTING.md)
- [Sprint Implementation Roadmap](./SPRINT_IMPLEMENTATION_ROADMAP.md)

## Executive Summary

The Smart Attendance System is a production-grade TypeScript + React + Express application for K-12 Arabic school management. It integrates daily classroom attendance, medical justification pipelines, parent alert systems, emergency rosters, executive analytics, and Google Gemini AI insights.

### Core Architectural Rule: Universal Settings Adherence

All functions, mathematical calculations, date boundaries, and data ingestion pipelines strictly enforce the data configured in the School Settings (`TenantSchoolProfile`):
1. **Academic Calendar**: Bound strictly between Term 1 start (`2026-09-01`) and Term 3 end (`2027-06-24`). Off-season months (e.g. Month 8) are strictly rejected.
2. **Off-Day & Holiday Rules**: Off-days (Friday/Saturday) and official holidays prevent invalid absence excuse logging.
3. **File Ingestion Rejection**: Student rosters imported via CSV or documents uploaded to the platform that do not match the approved school classes or academic calendar are categorically rejected with explicit Arabic warning banners.
4. **Zero Hardcoded Limits**: Class lists, lesson periods, subjects, and absence warning thresholds are dynamically derived from settings.

## Quality & Verification

The repository includes a comprehensive automated test suite (27 test suites, 192 passing tests) executed via Vitest (`npm test`) and a local security audit (`npm run audit`), ensuring zero regressions across RBAC, calculations, calendar persistence, parent portal isolation, messaging-provider adapters, and settings compliance.

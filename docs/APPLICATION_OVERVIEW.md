# Application Overview

This project is a comprehensive school attendance, compliance, and discipline platform designed for Arabic-language school operations. The product is oriented around daily attendance tracking, parent notifications, excuse review, emergency rosters, executive analytics, and strict school settings compliance.

## Core Governance Principle: Universal Settings Adherence

Every feature, calculation, date filter, UI dropdown, and ingestion pipeline throughout the system operates under **Strict Universal Settings Adherence**:
- **Academic Calendar**: Bound strictly to the official academic year (`2026-09-01` to `2027-06-24` in Default Profile). No month prior to Term 1 (such as Month 8) or beyond Term 3 is accepted.
- **Off-Days & Holidays**: Weekends (Friday/Saturday) and official holidays defined in Settings are systematically recognized; excuse submissions or sessions on off-days are flagged or rejected.
- **Dynamic Curriculum & Class Catalog**: Lesson periods, subjects, grades, and classes are populated directly from `schoolProfile`.
- **File Ingestion Protection**: Uploaded student CSV rosters or excuse files containing data conflicting with Settings are rejected, with clear user warnings.
- **Policy Thresholds**: Warning calculations and at-risk metrics directly adhere to `unexcusedWarningThreshold` configured in Settings.

## Product Capabilities

- Daily session attendance tracking with real-time class and timetable period synchronization.
- Multi-criteria absence inquiry with dynamic academic month/term dropdown filters.
- Parent communication via automated notices and warning letters based on school thresholds.
- Medical excuse & justification submission workflow with automatic date and off-day validation.
- Emergency headcounts and evacuation roll-calls.
- Executive analytics dashboard and Gemini AI-powered daily digests.
- Multi-tenant school isolation with role-based access control (Admin, Registrar, Teacher, Parent).

## Intended User Roles

- **Admin / Principal**: Full school oversight, settings configuration, executive digests, and compliance management.
- **Registrar**: Student roster management, strict CSV ingestion, and enrollment tracking.
- **Teacher**: Timetable lesson attendance recording and student status reporting.
- **Parent**: Dedicated portal for monitoring children's attendance and submitting medical excuses.

## User Experience

The application is architected with a native Arabic RTL interface, high-contrast accessible visual cues, interactive charts, and instant compliance validation banners.

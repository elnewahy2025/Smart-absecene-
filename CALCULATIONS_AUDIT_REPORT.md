# Attendance Calculations Audit — Sessions & Reports

**Repository:** `Smart-absecene-`
**Commit inspected:** `1de8cca` ("Wait for role resolution before RBAC tab clamping on reload")
**Date:** 2026-11-19
**Scope:** every in-page calculation on the Sessions page and the Reports page, plus the
shared modules those pages depend on (`useSessionActions`, `useJustifications`,
`useSchoolAnalytics`, `useExecutiveDashboardAnalytics`, `gradeAbsencePatterns`, `reportExports`).
**Mode:** read-only. No source file was modified, nothing was committed.
**Supersedes:** the two earlier partial inspections (filter/count mismatches; calculation
semantics). Both were accurate; this document merges them and resolves the overlaps.

**Verification at this commit**

| Check | Result |
|---|---|
| `npx tsc --noEmit` | 0 errors |
| `npx vitest run` | 72/72 files, 651/651 tests |
| Firestore rules tests | not run here (needs emulator) |
| `npm run golive` | not run here |

---

## 0. Executive summary

Twelve confirmed defects, ordered by user impact.

| # | Defect | Severity |
|---|---|---|
| 1 | Excused KPI card counts three statuses; its drill-down shows one | **High** |
| 2 | Absent KPI card counts `absent + rejected_excuse`; drill-down shows `absent` only | **High** |
| 3 | Excuse review rewrites record statuses but leaves the stored counters stale — and persists them | **High** |
| 4 | `100` is used as the "no data" value in eight places → the 1-second 100% flash and false 100% for empty data | **High** |
| 5 | Dashboard tile labelled "actual daily attendance" shows a historical average with a synthetic headcount | **High** |
| 6 | PDF export collapses Tier 2 / Tier 3 into "all chronic"; PDF and batch print include transferred students | **High** |
| 7 | Teacher-submitted sessions never persist student `attendanceRate` / `totalAbsences` | **High** |
| 8 | `quickMarkGroupAsPresent` reads its counter before React runs the updater → banner says "0 students" | **Medium** |
| 9 | Broadcast All Warnings ignores the selected class; tier boundary is 7 in broadcast vs 8 elsewhere | **Medium** |
| 10 | `justifiedPercent` is unclamped → bar > 100% and a negative second segment | **Medium** |
| 11 | Sessions date input filters nothing; bulk selection survives session switches; bulk confirm re-checks no permission | **Medium** |
| 12 | Calendar month initialised from a UTC-parsed, unsorted `sessions[0]` | **Medium** |

Six definitions of "attendance %" coexist (§2). They are the reason numbers do not reconcile
between the dashboard, the sessions KPI cards, the celebration modal, and the reports.

---

## 1. Why 100% appears for a second on refresh

It is not rendering, not caching, and not the service worker. It is a **missing-data
contract**: nothing in the model distinguishes "no data yet" from "perfect attendance",
and `100` is the substitute for both.

### 1.1 Evidence chain

| Step | Location | Behaviour |
|---|---|---|
| Boot | `initialState.ts:18-24` | every entity array starts empty |
| Boot | `AttendanceContext.tsx:70-79` | `tenantId` starts from the hostname or the **cached** tenant, before the account claim resolves |
| Sync | `useFirestoreDataSync.ts:82-128` (students) and `:138-180` (sessions) | two independent listeners; one collection can be authoritative while the other is still empty |
| Empty roster | `useSchoolAnalytics.ts:83-90` | `avgRate = ... : 100` → **100%** |
| Missing field | `useSchoolAnalytics.ts:54,86` | `typeof s.attendanceRate === 'number' ? s.attendanceRate : 100` |
| Shared mapper | `useFirestoreDataSync.ts:110` | `attendanceRate: ... : 100` on every synced student |
| Tile guard | `ExecutiveKpiTiles.tsx:45` | hides the number only when `activeStudentsCount === 0 && !hasSubmittedData` — false as soon as *either* list has data |

Because 100 is also a legitimate result, the intermediate frame is indistinguishable from a
correct value. The duration is the time between the first authoritative snapshot and the
next one (tenant switch, second collection, or a corrected document).

The most likely production sequence for the observed dashboard frame:

1. An earlier tenant/default tenant resolves first (platform owner accounts can start on the
   cached tenant before `useAuthStateSync` applies the claim tenant) → mean rate 100.
2. The claim tenant's roster arrives → mean rate 96.
3. `sessions` for today are still not submitted → the tile stays in its fallback branch.

### 1.2 Why the screenshot says 96% next to "حاضر 2 من 2"

`useExecutiveDashboardAnalytics.ts:45-83` has two branches:

```
if (submittedTodaySessions.length > 0):
    rate = round(present / (present + absent + late) * 100)
else:
    rate        = schoolEnrollmentStats.schoolAttendanceRate      // mean of per-student rates
    presentCount = round(activeStudents.length * rate / 100)      // synthetic estimate
```

The screenshot is the **fallback** branch: 96 is the mean of the two students' stored rates,
and `present = round(2 × 0.96) = 2`. The headcount is not counted, it is derived. The tile
therefore presents a historical average as "نسبة الحضور اليومي الفعلي" with an
actual-looking headcount.

### 1.3 Fix

1. Replace every numeric default with `null` and render `—` (§7.1).
2. Expose hydration state from the sync layer and gate the KPI surfaces on it:

```ts
// useFirestoreDataSync: after both listeners have fired once
setDataReady({ students: true, sessions: true });
```

3. In the fallback branch, do not reuse the "actual" label. Either render `—` until a
   session exists, or label the value as an estimate.

---

## 2. The canonical model problem: six definitions of one number

| Surface | Formula | Late | Excused leave | Excused absence | Denominator |
|---|---|---|---|---|---|
| Dashboard tile, session branch | `present ÷ (present+absent+late)` | excluded from numerator **and** denominator | excluded | excluded | today's submitted sessions |
| Dashboard tile, fallback | mean of student `attendanceRate` | — | — | — | historical |
| Sessions KPI card | `present ÷ session.totalStudents` | no | no | no | roster size at creation |
| Celebration modal | `present ÷ records.length` | no | no | no | all records |
| Student `attendanceRate` (`useSessionActions.ts:302-303`) | `(present+late+excused_leave) ÷ totalRecords` | yes | yes | no | all submitted records |
| Reports average (`ReportsView.tsx:63-66`) | mean of per-student rates, unweighted | — | — | — | per student, equal weight |

Consequences with a class of 20 and 2 lates:

* Dashboard: **100%** (late is outside the denominator).
* Sessions KPI: **90.9%**.
* Celebration: **90.9%**.
* Student metrics and reports: **100%** (late counts as attended).

This is not a rounding issue. Until one definition is chosen and shared, the pages cannot
reconcile. Recommendation: **attended / possible**, where attended =
`present + late + excused_leave`, and possible = all submitted records, computed once in a
pure utility and consumed everywhere. Display "excused absence" as a separate metric, never
inside or outside the denominator by accident.

---

## 3. Sessions page — calculation inventory

`src/components/AttendanceSessionsView.tsx`

| Line | Function / expression | What it computes | Verdict |
|---|---|---|---|
| 50-52 | `selectedSessionId` initial state | `sessions[0]?.id` at mount | ⚠️ `sessions` is unsorted; "first" is arbitrary |
| 53-55 | `filterDate` initial state | `sessions[0]?.date` | ⚠️ same |
| 82 | `selectedSession` | `find(id) \|\| sessions[0]` | ⚠️ silently swaps session when the id disappears |
| 85-118 | `sessionStudents` | join `records` × `students`, drop `transferred`, then search + status equality | ✅ correct; `\|\| []` on line 118 is dead |
| 89-104 | placeholder student | `attendanceRate: 90`, zeros | ⚠️ invented rate can leak into any derived display |
| 110-113 | search predicate | `includes` on name / nationalId / studentNumber | ✅ |
| 120-132 | `handleStatusChange` | guard via `canEditSession` | ✅ |
| 134-141 | restore / minutes-late | delegates to `updateRecord` | ✅ |
| 163-192 | `handleQuickMarkWholeClass` | role check (`admin/registrar/super_admin`) | ⚠️ not `canEditSession`; a teacher assigned to the class is rejected |
| 195-216 | `handleQuickMarkSelectedGroup` | blocks `submitted` for non-admin | ❌ no `canEditSession` check; registrar blocked even when authorised |
| 219-223 | `handleGroupMarkAsAbsent` | opens confirmation | ✅ |
| 226-234 | `handleRequestQuickMarkPresent` | confirmation when `length > 5` | ⚠️ comment says "more than 3"; code means 6+ |
| 237-265 | `handleConfirmBulkAction` | present via quick-mark, otherwise one `updateRecord` per id | ❌ no permission re-check; O(n²) session map copies on large selections |
| 268-277 | `handleToggleSelectAll` | operates on **visible** rows only | ✅ intended, but then the header checkbox is not "select all" |
| 279-294 | `handleSubmitSession` | celebration `rate = present / records.length` | ❌ excludes `late` and `excused_leave`; includes `under_review`; returns **100** for an empty session |
| 314-343 | off-day banner | `isOffDay(filterDate)` | ✅ |
| 355-380 | date control | updates `filterDate` only | ❌ never filters `sessions` — dead control |
| 383-409 | view toggle | table / calendar | ✅ |

### 3.1 Session-level helpers

`src/context/useSessionActions.ts`

| Line | Code | Verdict |
|---|---|---|
| 48-98 | `updateRecord` | ✅ recomputes all four counters from records |
| 68 | `minutesLate` | `status === 'late' ? minutesLate ?? rec.minutesLate ?? 10 : undefined` — ✅, but every keystroke rewrites the whole session |
| 76-86 | counter definitions | `present`; `absent \| rejected_excuse`; `late`; `excused_absence \| excused_leave \| under_review` — ✅ partitions all seven statuses |
| 100-126 | `setAllPresentInDraft` | forces every record to `present` and zeroes the other counters | ✅ |
| 128-199 | `quickMarkGroupAsPresent` | counters recomputed ✅; **return value broken** ❌ — `affectedCount` is incremented inside the `setAllSessions` updater (`:133-140`) and read at `:193`, after the function has already returned. The updater runs during the next render, so the caller receives `0`. The banner at `AttendanceSessionsView.tsx:189` prints "(0 طالب)". The test at `AttendanceContext.test.tsx:734-740` asserts only the message, never the count. |
| 201-346 | `submitSession` | status, notifications for `absent`/`late`, audit log | ✅ |
| 268-323 | metric recalculation | `totalAbsences` = distinct absent dates not attended; `attendanceRate = (present+late+excused_leave)/totalRecords` | ✅ formula, ❌ persistence (below) |
| 316 | persistence gate | `['admin','registrar','super_admin'].includes(currentUser.role)` | ❌ a **teacher** submission updates the session and `attendance_records` (via `useSessionPersistence.ts:62-97`) but never writes `students/{id}`. Reports and the dashboard read those stored student fields, so they stay stale until an elevated user submits again. |
| 348-380 | `reopenSession` | status only; counters unchanged | ✅ (records unchanged) |
| 391-435 | `createNewSession` | `totalStudents = records.length`, all `present` | ✅, but `totalStudents` is never re-synced with `records` afterwards |
| 422 | `totalStudents` | frozen at creation | ⚠️ source of the transferred-student mismatch (§4.4) |

### 3.2 KPI cards

`src/components/attendance/SessionKpiStats.tsx` — percentages are
`round(count / session.totalStudents * 100)`, `0` when the denominator is 0.

| Line | Card | Counts included | Drill-down filter | Verdict |
|---|---|---|---|---|
| 59-61 | Present | `present` | `'present'` | ✅ |
| 71-87 | Absent | `absent + rejected_excuse` | `'absent'` | ❌ **`rejected_excuse` rows disappear from the table** |
| 86-92 | Late | `late` | `'late'` | ✅ |
| 111-118 | Excused | `excused_absence + excused_leave + under_review` | `'excused_absence'` | ❌ **two statuses disappear**; the roster filter bar (`SessionRosterPanel.tsx:84-102`) does not offer them either |

Additional inconsistency: an empty session displays `0%` here but `100%` in the celebration
modal (`AttendanceSessionsView.tsx:288`) — the same event, two answers.

### 3.3 Calendar

`src/components/attendance/ClassCalendarView.tsx`

| Line | Code | Verdict |
|---|---|---|
| 21-26 | month state from `new Date(sessions[0].date)` | ❌ `YYYY-MM-DD` parses as **UTC midnight**; `getMonth()/getDay()` use local time, so a negative offset can open the previous month. `sessions[0]` is also unsorted. |
| 32 | `firstDayOfMonth` | `getDay()` with a Sunday-first header — ✅ consistent |
| 49-55 | group by `s.date` | ✅ matches the `YYYY-MM-DD` write format (`useSessionActions.ts:412`) |
| 57-65 | weekend header styling | ❌ greys Fri/Sat unconditionally while day cells use `isOffDay()` from the school profile |
| 127-133 | date string construction | ✅ local Y-M-D |

---

## 4. Reports page — calculation inventory

### 4.1 `ReportsView.tsx`

| Line | Calculation | Verdict |
|---|---|---|
| 47 | `activeStudents = students.filter(s => s.enrollmentStatus !== 'transferred')` | ⚠️ counts `inactive`/`graduated` as active. The dashboard uses `!status \|\| 'active'` (`useExecutiveDashboardAnalytics.ts:40-43`) — two definitions of "active" |
| 48-50 | `classScopedStudents` by `className` | ⚠️ rosters scope by `classId` (`getAttendanceRoster`), so class totals can differ between pages |
| 53-58 | report-type filter (3+, 5-7, 8+) | ✅ matches the bylaw tiers |
| 61 | `totalStudents = activeStudents.length` | ⚠️ ignores `selectedClass` while the rest of the page is class-scoped |
| 63-66 | `averageAttendanceRate` = unweighted mean, `1dp` | ⚠️ equal weight per student regardless of days recorded; fallback `'100'` is masked by the display guard |
| 69-71 | `tier3Plus` (3-4), `tier5Plus` (5-7), `tier8Plus` (8+) | ⚠️ `tier3Plus` is **never used** — no card and no filter for 3-4 days |
| 74-86 | `classBreakdown` | ❌ iterates **all** active students (ignores `selectedClass`); `undefined` rate → `NaN` propagates through the class average; `: 100` fallback for zero totals |
| 80 | `rateSum += s.attendanceRate` | ❌ unguarded numeric |
| 88-94 | `filteredAverageRate` | ❌ `'100'` when the filter matches nobody → an empty Excel export reports "average 100%" |
| 254 | Card 1 display | ✅ guarded by `scopedCount > 0` |
| 278 | Active enrollment `%` | ❌ renders literal **100** when `students.length === 0`; numerator excludes transferred, denominator includes them |
| 309 | Tier-2 `%` | ✅ guarded; label says "5+ days" but the set is 5-7 (8+ handled next card) |
| 343 | Critical `%` | ✅ guarded |
| 408 | Class bar width | `clamp(avgRate, 10, 100)` — ⚠️ a 0% class is drawn at 10% |
| 430-460 | Chronic table | `>= 3` days, sorted desc | ✅ |
| 463-466 | `tierNumber` | `>= 8 → 3`, `>= 5 → 2`, else 1 | ⚠️ disagrees with the broadcast's `>= 7 → 3` (§5.9) |
| 536 | PDF modal delegation | Tier 2/3 → `'chronic_only'` | ❌ the PDF prints **all 3+ students** |
| 542-546 | Batch print | `students={students}` | ❌ includes transferred students |

### 4.2 Child components

| File:line | Calculation | Verdict |
|---|---|---|
| `OfficialReportModal.tsx:37-45` | filters raw `students` by class and `chronic_only` | ❌ includes transferred; ignores the selected tier |
| `:47-54` | `totalEnrolled`, `avgRate` = mean, fallback `'100'` | ⚠️ empty report prints 100% |
| `:56-57` | `warningCount` 5-7, `criticalCount` 8+ | ✅ |
| `BatchPrintCenterModal.tsx:29-33` | `warning_notice` = `>= 3` | ❌ contradicts the on-page 5+/8+ tiers; input includes transferred students |
| `BatchPrintCenterModal.tsx:201` | prints `s.attendanceRate` | ⚠️ unguarded numeric |
| `AbsenceHeatmapCard.tsx:47-66` | aggregates submitted **period** sessions by `getDay()` × period | ⚠️ all-time (no date range); Fri/Sat silently discarded by the `grid[...]` guard; `date.includes('T')` skips the local-noon normalisation → day can shift; the declared `rate` field is never computed |
| `StudentEngagementSection.tsx:40-66` | `streakDays` by unique submitted date; `points = rate×10 + streak×5 − abs×10 − late×5` | ⚠️ `late` breaks the streak although every other metric counts late as attendance; points unbounded; unguarded rate |
| `:73-93` | badge thresholds 99/95/90/85 | ⚠️ diamond requires `rate ≥ 99` **and** zero absences/lates |
| `:119-121` | streak/badge counters | ✅ |
| `:249` | streak bar `clamp(streak/25×100, 8, 100)` | ⚠️ min-8% floor |
| `GradeComparisonMatrix.tsx:49-52` | `justifiedPercent = excused / totalAbsenceDays` | ❌ **not clamped** |
| `:115` | second segment `100 − justifiedPercent` | ❌ negative width when the ratio exceeds 100% |
| `:168` | rate bar `clamp(rate, 10, 100)` | ⚠️ min 10% |
| `GradeAbsenceSummaryCards.tsx:13-97` | renders `averageAttendanceRate`, `chronicRate`, `attendanceGap`, `overallDocRate` | ✅ presentation only |
| `GradeAbsencePatternsSection.tsx:57-66` | `buildGradeAbsencePatterns` + `summarizeGradeAbsencePatterns` | ✅ delegation |

### 4.3 Utilities

`src/utils/gradeAbsencePatterns.ts`

| Line | Calculation | Verdict |
|---|---|---|
| 54-55 | `totalAbsenceDays`, `totalLates` = sums of student counters | ✅ |
| 56-61 | `avgRate` = per-grade mean; fallback 100 | ❌ `sum + s.attendanceRate` is unguarded → `NaN` grade row |
| 62 | `avgAbsencesPerStudent` | ✅ |
| 65-70 | tier counts, `chronicCount = tier2 + tier3`, `chronicRate` | ✅ (naming: "tier 2" means 5-7 here, but the ReportsView card labels "5+") |
| 72-89 | justification dedupe by `studentId::absenceDate`, approved overrides pending | ✅ |
| 92 | `unexcusedCount = max(0, totalAbsenceDays − approvedExcuses)` | ⚠️ two data sources; pending days count as unexcused here but as documented in `documentationRate` |
| 93-96 | `documentationRate = min(100, (approved+pending)/totalAbsenceDays)` | ⚠️ pending counted as "documented" by design |
| 98-103 | risk level thresholds (`<90` high, `<94` moderate) | ✅ |
| 160-169 | `attendanceGap`, `overallDocRate` (clamped) | ✅ |

`src/utils/reportExports.ts` — exports the `averageAttendanceRate` string it is handed
(`:8,76`) and prints the same 3/5/8 tier labels as the UI. The defect is upstream:
`ReportsView.tsx:88-94` supplies `'100'` for an empty filter.

### 4.4 State and persistence paths that feed the numbers

| File:line | Behaviour | Effect |
|---|---|---|
| `AttendanceContext.tsx:70-79` | tenant resolution before auth claim | roster can flip tenants after first paint |
| `useFirestoreDataSync.ts:86-128` | tenant-scoped student snapshot replaces the roster | authoritative ✅ |
| `useFirestoreDataSync.ts:110` | missing `attendanceRate` → 100 | flash / false 100% |
| `useFirestoreDataSync.ts:154-159` | remote sessions merged over local by id | remote wins ✅ |
| `useSessionPersistence.ts:43-99` | debounced 300 ms write of changed sessions and `attendance_records`; role filter at `:45`; submitted-guard at `:53` | two devices can race; later hash wins |
| `useJustifications.ts:126-146` | filing an excuse flips `present`/`absent` → `under_review`, writes the session doc | ❌ counters not recomputed before the write |
| `useJustifications.ts:206-226` | review flips → `excused_absence`/`rejected_excuse`, **no counter recompute, no write** here | see §5.3 |
| `attendanceContextSupport.ts:86-95` | rebuild from parent records: `absentCount = status === 'absent'` | ⚠️ a **third** absent definition (excludes `rejected_excuse`) |

---

## 5. Confirmed defects

### 5.1 KPI card vs drill-down — Absent (High)

`SessionKpiStats.tsx:71` sets `statusFilter = 'absent'`. The card's numerator is
`absentCount`, which counts `absent` **and** `rejected_excuse`
(`useSessionActions.ts:153-155`). The table filter is strict equality
(`AttendanceSessionsView.tsx:117`), so a rejected-excuse student is counted but not shown.

**Repro:** mark a student absent → submit → reject the excuse → the card reads "Absent 1",
the filtered table is empty.

**Fix:** add `rejected_excuse` to the filter predicate, or use a `matchesStatusFilter(record, filter)`
helper shared with `SessionRosterPanel`.

### 5.2 KPI card vs drill-down — Excused (High)

Same mechanism. The card counts `excused_absence + excused_leave + under_review`
(`useSessionActions.ts:157-162`) but filters `'excused_absence'` only
(`SessionKpiStats.tsx:123`). Neither `excused_leave` nor `under_review` is reachable from the
filter bar (`SessionRosterPanel.tsx:84-102`).

### 5.3 Excuse review leaves frozen counters — and persists them (High)

`useJustifications.ts:206-226` rewrites `sess.records` statuses and returns
`{ ...sess, records: updatedRecs }` — it never recomputes `presentCount`, `absentCount`,
`lateCount`, `excusedCount`. Compare `useSessionActions.ts:75-86`, which does.

`createJustification` (`:126-146`) has the same omission **and** writes the object with
`setDoc(..., { merge: true })` at `:138`. `reviewJustification` does not write the session at
all, but `useSessionPersistence.ts` will persist the next mutation of that doc with the same
stale counters.

Net effect: the KPI cards and every consumer of `session.absentCount` are permanently wrong
after an excuse is filed or reviewed, even though the roster shows the new status.

**Fix:** extract `recount(session)` and call it in both functions before `setAllSessions`
and before `setDoc`.

Note on the student metrics: approval does **not** change
`attendanceRate`/`totalAbsences` even if recomputed, because `excused_absence` still counts
as an absence in `useSessionActions.ts:293`. The real breakage is the session counters, not
the student rates.

### 5.4 The 100-as-missing sentinel (High)

Eight sites substitute 100 for unknown (§1.1). Symptoms:

* 1-second 100% flash on refresh (dashboard tile, and `ReportsView.tsx:278` reports card).
* A class with no students renders 100% (`useSchoolAnalytics.ts:58`).
* A student document without `attendanceRate` contributes a perfect score to every mean.
* An empty Excel export states "average 100%" (`ReportsView.tsx:88-94`).
* An empty grade row renders 100% in `gradeAbsencePatterns.ts:61`.
* Zero absences renders `justifiedPercent = 100` (`GradeComparisonMatrix.tsx:49-52`).

**Fix:** use `null` for unknown, render `—`, and clamp only at the display layer.

### 5.5 Dashboard tile semantics (High)

`ExecutiveKpiTiles.tsx:37-51` labels the fallback value "نسبة الحضور اليومي الفعلي"
(actual daily attendance) and pairs it with `presentCount`, which in the fallback branch is
`round(active × rate / 100)` (`useExecutiveDashboardAnalytics.ts:67-69`) — an estimate, not a
count. The "2 من 2" in the screenshot is synthetic.

### 5.6 Export scope (High)

* `ReportsView.tsx:536` passes `'chronic_only'` for both Tier 2 and Tier 3 → the PDF contains
  every 3+ student.
* `OfficialReportModal.tsx:32,37-45` reads raw `students` → transferred students are included
  in the PDF totals and table, disagreeing with the on-page KPIs.
* `ReportsView.tsx:542-546` passes raw `students` to `BatchPrintCenterModal` → transferred
  students are printed.
* `BatchPrintCenterModal.tsx:31` uses `>= 3` for warning notices, contradicting the 5+/8+ tiers
  shown on the page.

### 5.7 Teacher submissions do not persist student metrics (High)

`useSessionActions.ts:316` gates the `students/{id}` write on
`['admin','registrar','super_admin']`. `useSessionPersistence.ts` writes only
`attendance_sessions` and `attendance_records`. So a teacher's submitted session updates the
session documents but the stored `students.attendanceRate` / `totalAbsences` remain at their
previous values. `ReportsView`, `OfficialReportModal`, `GradeAbsencePatternsSection`,
`StudentEngagementSection` and the dashboard all read those stored fields.

### 5.8 Quick Mark reports zero (Medium)

`useSessionActions.ts:192-198` returns `updatedCount: affectedCount`, but `affectedCount` is
incremented inside the `setAllSessions` updater (`:133-140`). React invokes the updater during
the next render, after the return value is built. Callers therefore receive `0`:

* `AttendanceSessionsView.tsx:187-191` → "تم تعيين جميع طلاب الفصل (0 طالب)".
* `:206,242` compensate by using `selectedStudentIdsForGroup.length`, which is why the group
  path looks correct and the whole-class path does not.

**Fix:** count the target records before `setAllSessions`:

```ts
const affectedCount = targetIdsSet
  ? (targetSession.records ?? []).filter((r) => targetIdsSet.has(r.studentId)).length
  : (targetSession.records ?? []).length;
```

### 5.9 Warning broadcast scope and tier boundaries (Medium)

* `ReportsView.tsx:434` calls `sendAllChronicWarningNotifications(3)`; the implementation
  (`useNotificationOutbox.ts:487-497`) filters the whole tenant's `students` with no class
  predicate, although the surrounding list is `classScopedStudents`.
* `useNotificationOutbox.ts:491` uses `>= 7 → tier 3`, while `ReportsView.tsx:463-466` uses
  `>= 8 → tier 3`. A student with exactly 7 absences receives a final warning from the
  broadcast and a second warning from the row button.
* `sendChronicWarningNotification` returns `boolean`; the batch never reports failures beyond
  the count.

### 5.10 `justifiedPercent` is unclamped (Medium)

`GradeComparisonMatrix.tsx:49-52` computes `excusedCount / totalAbsenceDays` from two
different sources (approved justification days vs the stored student absence counter). When
the first exceeds the second, `justifiedPercent` > 100, the green segment exceeds the track,
and the red segment at `:115` becomes negative. `documentationRate` in
`gradeAbsencePatterns.ts:93-96` already clamps; this one does not.

### 5.11 Sessions-page interaction defects (Medium)

* `filterDate` (`:53-55`, `:355-361`) never filters `sessions` — the date control and the
  off-day banner are the only consumers.
* `selectedStudentIdsForGroup` is not cleared when `selectedSessionId` changes. The toolbar
  can then show N selected, and Quick Mark applies IDs that belong to the previous session,
  producing a no-op with a success banner.
* `handleConfirmBulkAction` (`:237-265`) performs no `canEditSession` check.
* `handleQuickMarkSelectedGroup` blocks registrars even though `canEditSession` may allow them.
* `handleToggleSelectAll` selects only filtered rows; combined with the persistent selection,
  the toolbar count is not what the user thinks it is.

### 5.12 Calendar month (Medium)

`ClassCalendarView.tsx:21-26` constructs the month from `new Date(sessions[0].date)`. `YYYY-MM-DD`
is parsed as UTC midnight and `getMonth()` applies the local offset, so negative-offset users
can open on the previous month; and `sessions[0]` is not guaranteed to be the latest session.

### 5.13 Lower-severity items

| Item | Location |
|---|---|
| Transferred students counted in the session KPI denominator but hidden from the roster | `AttendanceSessionsView.tsx:106-108` vs `SessionKpiStats.tsx:35` |
| `totalStudents` never re-synced after creation | `useSessionActions.ts:422` |
| Three definitions of "active student" | `ReportsView.tsx:47`, `useExecutiveDashboardAnalytics.ts:40-43`, `useSchoolAnalytics.ts:45` |
| Three definitions of `absentCount` | `useSessionActions.ts:153-155`, `attendanceContextSupport.ts:90`, `SessionKpiStats.tsx:71` filter |
| `NaN` propagation from unguarded `attendanceRate` | `ReportsView.tsx:65,80,91`, `gradeAbsencePatterns.ts:59`, `OfficialReportModal.tsx:51` |
| Bars clamped to a minimum width, hiding 0-10% | `ReportsView.tsx:408`, `GradeComparisonMatrix.tsx:168`, `StudentEngagementSection.tsx:249` |
| Heatmap aggregates all history; drops Fri/Sat silently; unused `rate` | `AbsenceHeatmapCard.tsx:38-69` |
| Engagement streak breaks on `late` while metrics count it as present | `StudentEngagementSection.tsx:50-56` |
| `tier3Plus` computed, never used | `ReportsView.tsx:69` |
| Excel/PDF label drift ("5+ days" vs the 5-7 set) | `ReportsView.tsx:303` vs `:70` |
| Class grouping by `className`, roster by `classId` | `ReportsView.tsx:75`, `getAttendanceRoster` |
| `selectedClass` ignored by `classBreakdown` and Card 2 | `ReportsView.tsx:74-86,278` |

---

## 6. What is correct

* Tier boundaries 3 / 5 / 8 and the `chronic` = 5+ rule are applied consistently in
  `ReportsView`, `gradeAbsencePatterns`, `OfficialReportModal` and `reportExports`
  (the only drift is the broadcast's 7-day boundary and the batch print's 3-day warning set).
* Distinct-date absence deduplication (`useSessionActions.ts:279-301`) correctly prevents
  double-counting a morning and a period session on the same day.
* Session counters are recomputed from records on every normal edit and Quick Mark
  (`useSessionActions.ts:75-95,152-171`).
* Off-day handling is correct: the sessions page warns, and `isOffDay` excludes holidays from
  absence counting.
* Class roster isolation by `classId` (`getAttendanceRoster`) prevents cross-class leakage.
* The heatmap's day × period indexing is correct apart from the timezone edge case.
* `reportExports.ts` escapes values and emits a UTF-8 BOM; CSV/HTML generation is sound.
* Role gating on `reviewJustification` and `reopenSession` is present and correct.

---

## 7. Fix plan

### 7.1 Data contract first (unblocks the flash and the false 100%)

```ts
// one shared helper, imported everywhere
export const rateOrNull = (v: unknown): number | null =>
  typeof v === 'number' && Number.isFinite(v) ? v : null;

export const meanOrNull = (values: Array<number | null>): number | null => {
  const nums = values.filter((v): v is number => v !== null);
  return nums.length ? nums.reduce((a, b) => a + b, 0) / nums.length : null;
};
```

Replace `useSchoolAnalytics.ts:54,58,86,90`, `useFirestoreDataSync.ts:110`,
`ReportsView.tsx:66,85,94,278`, `OfficialReportModal.tsx:54`,
`gradeAbsencePatterns.ts:61,96`, `GradeComparisonMatrix.tsx:52` and
`AttendanceSessionsView.tsx:288` accordingly. Render `—` for `null`.

Add `dataReady` to the sync layer and gate the dashboard tiles, reports cards, and sessions
KPI block until both listeners have fired once.

### 7.2 One attendance formula

Create `utils/attendanceMath.ts` with:

```ts
export interface AttendanceTotals { present: number; late: number; excusedLeave: number; excusedAbsence: number; rejected: number; underReview: number; total: number; }
export const summarize = (records: AttendanceRecord[]): AttendanceTotals => { /* single source of truth */ };
export const attendedRate = (t: AttendanceTotals) => t.total ? (t.present + t.late + t.excusedLeave) / t.total : null;
```

Use it in `SessionKpiStats`, `AttendanceSessionsView` (celebration), `useSessionActions`
(student metrics), `useExecutiveDashboardAnalytics` (tile) and `ReportsView` (class averages).
Decide explicitly whether an excused absence is inside the denominator; document it in the UI.

### 7.3 Targeted fixes

| # | Change | File |
|---|---|---|
| 1 | Status filter helper covering `rejected_excuse` and all excused variants | `SessionKpiStats.tsx`, `SessionRosterPanel.tsx`, `AttendanceSessionsView.tsx:117` |
| 2 | `recount(session)` called in both justification flows before persisting | `useJustifications.ts:126-146,206-226` |
| 3 | Compute `affectedCount` before `setAllSessions` | `useSessionActions.ts:128-199` |
| 4 | Persist student metrics on every role that may submit, or move the recalculation server-side | `useSessionActions.ts:316` |
| 5 | Pass the real tier filter and `activeStudents` to both print modals | `ReportsView.tsx:536,542`, `OfficialReportModal.tsx:37-45` |
| 6 | Clamp `justifiedPercent` to 0-100 | `GradeComparisonMatrix.tsx:49-52` |
| 7 | Filter `sessions` by `filterDate` (or remove the control) | `AttendanceSessionsView.tsx:53,355` |
| 8 | Clear group selection when the session changes; re-check `canEditSession` in the confirm handler | `AttendanceSessionsView.tsx:237-265` |
| 9 | Add a class predicate to the broadcast; align the tier at 8 | `useNotificationOutbox.ts:487-497` |
| 10 | Parse calendar dates at local noon and start at today | `ClassCalendarView.tsx:21-26` |
| 11 | Label the dashboard fallback as an estimate, or hide it until a session exists | `ExecutiveKpiTiles.tsx:37-51` |

---

## 8. Regression tests to add

1. **KPI/drill-down parity** — for each of the four cards, assert
   `cardCount === rowsVisibleAfterFilter` across all seven statuses.
2. **Excuse review** — file an excuse, approve it, assert `absentCount`/`excusedCount` on the
   session and the persisted document; repeat after reload with the emulator.
3. **Quick Mark** — assert `updatedCount === records.length` for whole-class and
   `=== selected.length` for a group.
4. **Empty data** — render the dashboard, reports and sessions pages with empty collections;
   assert `—` and never `100%`.
5. **Export scope** — Tier 2 PDF contains no 8+ student; no transferred student in any export.
6. **Teacher submit** — submit as `teacher`, reload, assert the student rate reflects the new
   session.
7. **Timezone** — run the calendar test with `TZ=America/New_York` and a first-of-month session.
8. **Rate archetypes** — one late, one excused leave, one excused absence, one rejected excuse:
   assert the chosen canonical formula on every surface.

---

## Appendix A — Evidence anchors

| Concern | Primary anchors |
|---|---|
| 100 defaults | `useSchoolAnalytics.ts:54,58,86,90`; `useFirestoreDataSync.ts:110`; `ReportsView.tsx:66,85,94,278`; `OfficialReportModal.tsx:54`; `gradeAbsencePatterns.ts:61,96`; `GradeComparisonMatrix.tsx:52`; `AttendanceSessionsView.tsx:288` |
| Tile fallback | `useExecutiveDashboardAnalytics.ts:45-83`; `ExecutiveKpiTiles.tsx:37-51` |
| Counter definitions | `useSessionActions.ts:76-86,152-162`; `attendanceContextSupport.ts:86-95`; `SessionKpiStats.tsx:59-145` |
| Justification flows | `useJustifications.ts:126-146,206-226` |
| Persistence | `useSessionPersistence.ts:43-102`; `useSessionActions.ts:316` |
| Exports | `ReportsView.tsx:536,542-546`; `OfficialReportModal.tsx:32-57`; `BatchPrintCenterModal.tsx:29-33` |
| Calendar | `ClassCalendarView.tsx:21-33` |
| Hydration order | `AttendanceContext.tsx:70-79`; `initialState.ts:18-24`; `useFirestoreDataSync.ts:82-180` |

## Appendix B — Method and limitations

* Static inspection of the listed files at `1de8cca`, plus `tsc` and the unit suite.
* The 100% flash was not reproduced with live credentials; the mechanism above is derived
  from the initial-state, hydration order, and default values, all of which are deterministic
  in the code. The exact snapshot ordering depends on network and tenant resolution.
* Firestore rules tests and `npm run golive` were not executed in this inspection.
* No build artefact or tracked file was modified.

---

## Appendix C — Final remediation status (post-fix verification)

The findings above have been remediated in the working tree. The final residual corrections
were:

1. **Aggregate rates stay unknown when no submitted rate exists.** `SchoolClassSummary.attendanceRate`
   and `SchoolEnrollmentStats.schoolAttendanceRate` are now `number | null`; `useSchoolAnalytics`
   returns `null` instead of `0` when no active student has a known rate.
2. **Unknown-rate classes do not contaminate rankings or grade averages.**
   `useExecutiveDashboardAnalytics` excludes them from `classesByAbsence` and
   `gradeComparisonData`, and `SchoolClassStatsCards` excludes them from the weighted grade
   average. Their students are not counted in a rate-based average.
3. **Neutral presentation of unknown values.** Dashboards, selectors and the student registry
   render `—` with neutral styling for `null` rates; a class with students but no known rate is
   labelled "No data" rather than "Empty" or "Critical".

Verification after these corrections:

* `npx tsc --noEmit` — 0 errors.
* `npx vitest run --reporter=dot` — 76 files, 686 tests passed.
* `npm run test:rules` — all Firestore rules tests passed, including teacher derived-metric
  writes restricted to `totalAbsences`, `totalLates`, `attendanceRate` and `null` values.
* `npm run build` — Vite client build and server bundle succeeded.

`AUDIT_REPORT.md` was not modified by this remediation.

# ResQ Frontend ↔ Backend Integration Audit

Audit date: 2026-07-01. Scope: every page under `src/pages/**`, every component under `src/components/**`, every store under `src/store/**`, every util under `src/utils/**`, `src/lib/wsClient.js`, and all 19 files under `src/api/**`, cross-referenced against every controller under `ResQ-Backend/src/main/java/com/ResQ/backend/controller/**`.

This document is meant for the backend team. It is split into:
1. **Critical bugs** — things that are broken *right now*, independent of any new endpoint work.
2. **New endpoints needed** — no matching backend route exists at all.
3. **Wiring debt** — the backend endpoint already exists and is correctly shaped, but no frontend page calls it (frontend-only fix, listed here so backend doesn't duplicate work).
4. **Per-area detailed findings** — page-by-page / file-by-file breakdown.
5. **Full `api/*.js` inventory** — every exported client function, its route, whether it's used, and backend status.

No code was changed as part of this audit.

---

## 1. Critical bugs (fix regardless of anything else)

These are confirmed defects — not missing features — found while tracing frontend code against real backend DTOs.

| # | Bug | Impact | Fix |
|---|---|---|---|
| 1 | `src/api/incidents.js` `transform()` reads `i.incidentNumber`, `i.latitude`/`i.longitude`, `i.address`, `i.sector`, `i.reportedAt` — none of these exist on the backend `IncidentDto`. Real fields are `incidentRef`, `locationLat`/`locationLng`, (no address field), `locationSector`, and discrete timestamps (`callTime`, `occurrenceTime`, `dispatchTime`, `arrivalTime`, `closureTime`). | **`LiveDispatchMap.jsx` filters incidents on `i.lat && i.lng` before plotting — since these are always `undefined`, no incident ever renders on the live map.** Also blanks out `incident_ref`, `address`, `call_time`, `sector` everywhere they're displayed (ActiveIncident, IncidentHistory, PendingReports). `response_time_minutes`/`resolution_time_minutes` are read but don't exist on the DTO at all — always `null`. `callerPhone` exists on the backend but is dropped by the transform entirely. | Fix the field mapping in `api/incidents.js` to match real `IncidentDto` field names; add response/resolution time either computed server-side or client-side from the real timestamp fields. |
| 2 | `LiveDispatchMap.jsx` filters `i.status !== 'resolved'` (lowercase) against the backend's uppercase enum (`"RESOLVED"`). | The resolved-incident filter never actually excludes anything. | Compare against uppercase, or normalize case before comparing. |
| 3 | `ReportingController` and `PlanningController` use `@PreAuthorize` role literal `'OPS_MANAGER'`. Every other controller and the seeded data use `'OPERATIONS_MANAGER'`. | Any Ops Manager wiring to reporting/planning endpoints will 403 in production. | Change the role string in both controllers to `'OPERATIONS_MANAGER'`. |
| 4 | `src/pages/analyst/AnalystModels.jsx`'s `handleRetrain` references `ANALYST_AI_MODELS`, a variable never imported in the file. | Throws a `ReferenceError` at runtime the moment "Retrain Now" is clicked. | Import the constant or remove the dead reference (and wire to a real retrain endpoint — see §2). |
| 5 | `src/pages/planner/PlannerSimulation.jsx` uses `PLANNER_SAVED_SCENARIOS` in its initial `useState` but never imports it. | Throws a `ReferenceError` on initial render — page crashes before its own `useEffect` can even run. | Add the missing import, or remove the dead reference since `listSimulations()` already populates real data. |
| 6 | Backend `DataQualityRecordDto` only has `{recordId, source, completeness, accuracy, checkedAt}` — no `overallScore`, `issuesFound`, or `timeliness`. But `src/api/reporting.js`'s `transformDataQuality()` and both `AnalystDashboard.jsx`/`AnalystDataQuality.jsx` compute status via `overall_score >= 0.9 ? 'OK' : ...`. | `overall_score` is always `undefined`, so **every data source always shows status `'ERROR'`** regardless of real quality. | Add `overallScore`/`issuesFound`/`timeliness` to the backend DTO (computed server-side), or change the frontend to only use `completeness`/`accuracy`. |
| 7 | `src/api/admin.js` `listAuditLogs()` transform does not forward the `userRole` field that the backend `AuditLogDto` already returns. | `AdminAudit.jsx` computes `role: r.userRole ?? r.module ?? 'DISPATCHER'` — since `userRole` is always dropped, every row shows the module name (or `'DISPATCHER'`) instead of the actual user role. | Add `user_role: l.userRole` to the transform in `api/admin.js`. |
| 8 | `src/api/users.js` `transform()` does not forward `districtName`/`agencyName`, which the backend `UserDto` already returns. | `AdminUsers.jsx` shows a raw district UUID instead of a readable name. | Add `district_name`/`agency_name` to the transform. |
| 9 | `src/pages/admin/AdminInviteUser.jsx` collects `district`/`agency_id` in the form but never includes them in the `inviteUser()` payload sent to the backend. | Every invited user is created with no district/agency assignment even though the form appears to capture it. | Include `districtId`/`agencyId` in the submitted payload (needs district-name→UUID resolution — see gap in §2). |
| 10 | `src/api/agencies.js` `transformAgency`/`transformStation` read `a.email`/`a.phone`/`s.address` — none of these exist on the real backend DTOs (`AgencyDto` only has `contactInfo`; `StationDto` has no address field but does have `districtName`/`agencyName`, which the transform ignores). `createAgency`/`updateAgency`/`createStation` also pass the raw UI body through with no field mapping at all. | Currently harmless only because **nothing in the UI calls any of the 7 functions in `agencies.js`** — but this file cannot be wired up as-is without first fixing the shape mismatch. | Fix the transform to use real field names before any page starts consuming this file. |
| 11 | `src/api/dispatches.js` `findNearestUnit()` expects `vehicleType`/`currentLat`/`currentLng`/`distanceKm` on the response, but the backend `NearestUnit` record only has `(vehicleId, plateNumber, distanceMetres, etaMinutes)`. | Same as above — currently unused anywhere, but broken if wired up as-is. | Fix the transform/consumer to use `distanceMetres` (convert to km if needed) and drop the nonexistent fields, or extend the backend record. |
| 12 | `src/api/calls.js` `transform()` reads `c.incidentTypeHint`, which doesn't exist on `CallRecordDto`. | Always `undefined` for any consumer (currently `listCalls()` itself is unused, so no visible symptom yet). | Fix field name or remove until backend adds the field. |
| 13 | `src/api/reporting.js`'s `transformResourceRequest`/`createResourceRequest` use `resourceType`/`reason`, but the real DTO/entity uses `unitType`/`justification`. | Would silently drop data if `DCResources.jsx` were wired to it as currently written (see §3). | Fix field names before wiring `DCResources.jsx`. |
| 14 | `src/api/reporting.js`'s `transformUnitPerf()` uses `perfId`/`totalDispatches`/`onTimeRate`/`computedAt`, but the real `UnitPerformanceDto` uses `recordId`/`incidentsHandled`/`aiAcceptanceRate`/`performanceScore`. | Same as above — would silently break `DCUnits.jsx` if wired as-is. | Fix field names before wiring. |
| 15 | `WebSocketPublisher.publishNotification(userId, notification)` is fully implemented and the frontend correctly subscribes to `/user/queue/notifications` (`notificationsStore.js`), but **no backend service anywhere calls `publishNotification`**. | Real-time notifications are wired end-to-end in transport but will never fire in production — no escalation/alert event ever triggers a push. | Call `wsPublisher.publishNotification(...)` from whichever service raises escalation/alert/assignment events. |
| 16 | `src/store/fieldResponderStore.js`'s local `endShift`/`startShift` actions (used by `FRShiftEnd.jsx`/`FRShiftStart.jsx`) only mutate client Zustand state — they share a name with, but never call, the real `endShift`/`startShift` in `src/api/shifts.js` (`PATCH /api/shifts/{id}/end`, `POST /api/shifts`, both fully implemented on `ShiftController`). | Field responders' "on duty"/"off duty" state is never persisted server-side — dispatchers/ops managers have no reliable way to know who's actually on shift. | Wire the store actions to call the real API functions. |
| 17 | `src/pages/analyst/AnalystReports.jsx`'s `generateReport()` (a **locally defined** function) only pushes a fake object into the in-memory `mockReports` array — it does not call the same-named `generateReport()` exported by `src/api/reporting.js`, even though `POST /api/reporting/reports` is fully implemented and shape-matches. | "Generate Report" never persists anything. | Rename the local function or call the real API export instead. |
| 18 | `src/pages/dispatcher/IncidentClosure.jsx` collects `personsInvolved`, `casualties`, `arrests`, `finalDisposition`, `closureNotes` in a form but only ever calls `updateIncidentStatus(id, 'RESOLVED')` — none of the closure detail fields are sent anywhere, despite `POST /api/incident-closures` (`createClosure` in `api/fieldReports.js`) already existing and matching field-for-field. | Every incident closure loses all of its detail data; only the status flips. | Call `createClosure()` with the collected fields in addition to the status update. |

---

## 2. New endpoints needed (no matching backend route exists)

Grouped by area. Each entry: `METHOD /path — purpose — proposed fields`.

### Admin
- `GET /api/admin/system-status` — platform component health (DB, AI engine, telephony, etc.) — fields: `name, status, color/severity`
- `GET /api/admin/integrations` (+ test-connection action) — external integration cards — fields: `id, name, status, endpoint, authType, syncFrequency, lastSyncAt, avgResponseMs, errorRatePct, fieldMappings[], errors[]`
- `GET /api/admin/metrics/overview` — dashboard KPI tiles — fields: `totalActiveUsers, activeSessionsNow, uptimePercent30d, openSecurityAlerts`
- `GET /api/admin/scheduled-jobs` (+ run-now action) — backup/cron job status — fields: `name, status, lastRunAt, nextRunAt`
- `GET /api/admin/mfa-compliance` — per-role/per-user MFA enablement — fields: `role, enabledCount, totalCount`
- `GET /api/admin/sessions` + `DELETE /api/admin/sessions/{id}` + `DELETE /api/admin/sessions` — live session list + revoke/revoke-all — fields: `sessionId, userName, role, device, ipAddress, startTime, isSelf`
- `GET/POST/DELETE /api/admin/security/ip-allowlist` — fields: `range, label`
- `GET/PUT /api/admin/security/password-policy` — fields: `minLength, failedAttemptsLockout, complexityRequired, maxAgeDays`
- `POST /api/users/bulk-import` — CSV bulk user import — request: multipart CSV; response: `importedCount, failedCount, errors[]`
- `GET/PUT /api/admin/settings/general` — fields: `mapCenterLat, mapCenterLng, responseTimeTargetMin, coverageScoreTargetPct`
- `GET /api/admin/data-retention-policies` — fields: `dataType, retentionPeriod, legalBasis, lastReview`
- `GET /api/admin/backups` + `POST /api/admin/backups/run` + `POST /api/admin/backups/{id}/restore`
- `GET/POST /api/admin/announcements` — fields: `message, priority, scheduledAt, audience`
- `GET /api/users/me` (or a documented "resolve self" pattern) — used by AdminProfile, AnalystProfile, and effectively every role's profile page which currently shows a hardcoded identity instead of the logged-in user

### Analyst / Reporting
- `GET /api/reporting/anomalies` — AI-detected anomaly feed — fields: `alertType, description, detail, createdAt, deviationSigma, severity, relatedLink`
- `GET /api/reporting/field-report-quality` — fields: `fullyCompletePct, partiallyCompletePct, notSubmittedPct, mostSkippedFields[], lowestCompletionUnits[]`
- `GET/PUT /api/reporting/data-quality/thresholds` — fields: `gpsFreshnessMin, completenessMinPct, aiAccuracyMinPct, offlineMaxMin, overrideRateMaxPct, coverageMinPct`
- `POST /api/reporting/models/{id}/retrain` — queue AI model retrain
- `GET /api/reporting/models/accuracy-trend` — 30-day dispatch accuracy series
- `GET /api/reporting/overrides/outcomes` — dispatcher override outcome analysis
- `GET /api/reporting/models/retrain-history`
- Extend `AiModel`/introduce `AiModelDto` with: `driftPct, accuracyColor, thirtyDayTrend, predictionsToday, userAcceptancePct, retrainDisabled` (currently `AnalystModels.jsx` renders these as `undefined` on every card regardless of API success)
- `GET /api/reporting/patterns/heatmap` — spatial incident density zones — fields: `zoneName, lat, lng, intensityLevel`
- `GET /api/reporting/patterns/temporal?granularity=hour|day|week|month` — fields: `bucket, count`
- `GET /api/reporting/patterns/correlation` — correlation matrix + scatter data
- `GET /api/reporting/patterns/type-evolution?months=12` — incident-type composition over time
- `GET/POST/PUT/DELETE /api/reporting/report-schedules` — confirmed missing schema/table per existing in-code developer comment
- `POST /api/reporting/reports/{id}/annotations` — confirmed missing schema per existing in-code developer comment
- `POST /api/reporting/reports/{id}/share`
- `GET /api/reporting/benchmarking/districts` — cross-district comparison table
- `GET /api/reporting/benchmarking/trend` — multi-district response-time trend
- `GET /api/reporting/benchmarking/standards` (optional, could stay static)
- Enrich `CreateReportRequest`/`PeriodicReportDto` with per-district breakdown + trend series so generated report previews reflect real data

### Planning / District Commander
- `POST /api/planning/reallocations` — entity `Reallocation` + repository already exist server-side, **only the controller is missing** — fields: `vehicleId, fromZone, toZone, approvedBy, aiRecommended, reason, status`
- `PATCH /api/reporting/reports/{id}/review` — shift-report review workflow (needs new `reviewedBy`/`reviewedAt`/status columns on `PeriodicReport` — confirmed missing via in-code developer TODO)
- `PATCH /api/vehicles/{id}/note` (or add `supervisorNote`/`noteUpdatedBy`/`noteUpdatedAt` to `Vehicle`/`UnitPerformance`) — confirmed missing via in-code developer TODO
- `GET /api/reporting/dashboard-summary` (or similar aggregate) — backs DCDashboard/PlannerDashboard hardcoded KPI tiles
- `GET /api/planning/coverage-history?weeks=` — 12-week coverage trend + hourly-coverage-by-time-of-day
- `GET /api/planning/incident-frequency?groupBy=hour|day|month` — PlannerHotspots' time-of-day charts
- `GET /api/planning/predictions/accuracy?zone=` — PlannerPrediction's factor weights + predicted-vs-actual chart
- `GET/PATCH /api/planning/recommendations` — AI/planner recommendation lifecycle tracking
- `POST /api/planning/plans/{planId}/instructions` — only `GET` exists today; no way to persist positioning instructions against a plan

### Field Responder
- `POST /api/incidents/{incidentId}/backup-requests` — entity `BackupRequest` + repository already exist server-side, **only the controller is missing** — fields: `requestingUnitId, reason, notes, createdAt`
- `POST /api/audit-logs` (or `POST /api/field-reports/flags`) — let clients log a "flag issue" event without admin privileges
- `GET/POST /api/incidents/{incidentId}/comms` (or WebSocket topic `/topic/incidents/{id}/comms`) — Unified Comms text/voice messages, currently fully client-side/ephemeral in both `ActiveIncident.jsx` (dispatcher side) and `FROnScene.jsx`/`fieldResponderStore.js` (field side)
- `POST /api/shifts/start` / confirm `endShift` wiring (endpoint exists — see §3) plus outstanding-report checks
- `GET /api/field-reports/my?status=incomplete` (or extend `listMyReports`) — real "outstanding reports" list, currently a permanently-empty mock

### Ops Manager
- `GET/PATCH /api/agency-involvements` — persist agency-notified-for-escalation state (currently `mockAgencyInvolvements`, client-only, no controller exists)
- `GET/POST /api/reallocations` (may be the same work item as the Planning reallocations endpoint above — coordinate)
- `GET /api/dispatchers?districtId=` — dispatcher roster + workload/AI-acceptance stats
- `GET /api/escalations` (or an escalation flag/queue on `Incident`) — replaces `OPS_ESCALATIONS` mock across 4 pages
- `GET /api/ai/resource-recommendations` — AI resource-reallocation suggestions

### Dispatcher
- `GET /api/incidents/{id}/units` (or embed unit count/assigned vehicles directly in `GET /api/incidents`) — IncidentHistory and PendingReports always show `—` for "Units"
- `GET /api/incidents/{id}/live-positions` (or WebSocket topic) — real per-dispatch vehicle position stream; ActiveIncident's map currently uses random jitter despite a "Live tracking" label
- `GET/POST /api/incidents/{incidentId}/comms` — same gap as Field Responder comms above; these two should be the same endpoint/topic

### Settings (cross-role)
- `GET/PATCH /api/users/{id}/duty-status` — on_duty/on_break/off_duty, currently local-only in `SettingsProfileSection.jsx` despite copy saying it should be visible to Ops Manager
- `POST /api/auth/password/otp/send`, `/verify`, `POST /api/auth/password/update` — `SettingsPasswordSection.jsx` explicitly mocks OTP validation (any 6 digits passes) and simulates password change with `setTimeout`
- `GET/PUT /api/users/{id}/notification-preferences` — every role's settings view stores toggles in local state only, lost on refresh
- `GET/PUT /api/users/{id}/preferences` — map/dispatch/audio/UI prefs, same local-only problem
- `GET /api/users/{id}/sessions` + `POST /api/users/{id}/sessions/{sessionId}/revoke` — every role's "Active Sessions" list is a hardcoded array with non-functional Revoke buttons
- `GET/PUT /api/users/{id}/mfa` — confirm enable/disable flow has a real backing endpoint (not verified in this pass)
- `GET /api/field-responders/{id}/assignment` — replaces `FR_OFFICER` mock (unit/badge/sector/shift window) in `FieldResponderSettingsView.jsx`
- `POST /api/field-responders/{id}/gps-sharing` — GPS/background-tracking consent currently only flips a client flag
- `GET /api/planners/{id}/scope` — replaces `PLANNER_DISTRICT` mock + `'—'` placeholders
- `GET /api/district-commanders/{id}/assignment` — replaces session-derived district + `'—'` placeholders
- `GET /api/shift/{userId}/summary` — shift stat tiles (escalations managed, incidents handled, time on duty) hardcoded in `SettingsShiftManagementSection.jsx`
- `GET /api/shift-reports?status=pending&scope=district` — DistrictCommanderSidebar hardcodes `pendingReports = 0`

### Districts
- `GET /api/districts/{districtId}/sectors` — `districts.js`'s `getSectors()` calls this; **no matching backend route exists** (closest analog, `GET /api/location/sector?sectorName=`, has a different contract — single sector geocode, not a list-by-district)

---

## 3. Wiring debt (endpoint already exists and matches — just needs a frontend call)

These require **no backend work**. Listed so the backend team knows not to duplicate effort, and so whoever picks up frontend cleanup has a punch list.

| Frontend location | Should call | Currently does |
|---|---|---|
| `AdminAudit.jsx` security events panel | `listSecurityEvents()` (`GET /api/admin/security-events`) | Static `ADMIN_SECURITY_EVENTS` mock |
| `AdminInviteUser.jsx` agency dropdown | `listAgencies()` — **but fix `api/agencies.js` shape mismatch first** (§1 item 10) | Static `mockAgencies` |
| `AdminUsers.jsx` row actions (Edit/Suspend/Reset/Activate) | `updateUser()`/`deleteUser()` (`PUT`/`DELETE /api/users/{id}`) | `handleAction('Action recorded')` — toast only |
| `AnalystReports.jsx` generate/publish | `generateReport()`/`submitReport()` from `api/reporting.js` | Local mock array push (see §1 item 17) |
| `AnalystLibrary.jsx` Report Library tab | `listReports()` (`GET /api/reporting/reports`) | Static `ANALYST_LIBRARY_ROWS` |
| `AnalystPatterns.jsx` | `listPatterns()` (`GET /api/reporting/patterns`) — partial data source, needs new endpoints too (§2) | Not called at all |
| `DCExecutiveReport.jsx` | `generateReport()`/`submitReport()` — fields already line up almost 1:1 | Pushes to `mockReports` only |
| `DCResources.jsx` | `listResourceRequests()`/`createResourceRequest()` — **fix `api/reporting.js` field names first** (§1 item 13) | Pushes to `mockResourceRequests` |
| `DCUnits.jsx` | `listUnitPerformance()` + `listVehicles()` — **fix `api/reporting.js` field names first** (§1 item 14) | Static `DC_UNITS` mock |
| `DCCoverage.jsx` | `listCoverageGaps()` (already correctly used by `PlannerCoverage.jsx` — just not here) | Static `DC_COVERAGE_SECTORS` |
| `PlannerReports.jsx` | `generateReport()`/`submitReport()` | Pushes to `mockReports` only |
| `PlannerDeployment.jsx` | `listInstructions(planId)` — already imported, never called | Only local `PLANNER_DEFAULT_INSTRUCTIONS` |
| `OpsManagerEscalation.jsx` / `OpsManagerMap.jsx` / `OpsManagerMultiAgency.jsx` broadcast senders | `createBroadcast()` (`POST /api/broadcasts`) | `mockBroadcasts.push(...)` |
| `OpsManagerResources.jsx` mutual-aid submit | `createMutualAidRequest()`/`updateMutualAidStatus()` | `mockMutualAidRequests.push(...)` |
| `DispatchUnitsModal.jsx` (used by OpsManagerDashboard, OpsManagerEscalation) | `createDispatch()` (`POST /api/dispatches`) + `updateVehicleStatus()` | `mockDispatches.push(...)` |
| `OpsManagerShift.jsx` shift-report submit | `generateReport()`/`submitReport()` (fix role-string bug §1 item 3 first) | `mockReports.push(...)` |
| `OpsManagerShift.jsx`, all ops-manager pages | `getMyShifts`/`listActiveShifts`/`startShift`/`endShift` (`api/shifts.js`) — entirely unused despite this being "the Shift page" | No shift clock-in/out anywhere |
| `OpsManagerMissedCallsPanel.jsx` | `listMissedCalls()` | Static `mockMissedCalls` |
| `OpsManagerDispatchers.jsx` | No matching endpoint yet — see §2 `GET /api/dispatchers` | — |
| `NewIncident.jsx` caller profile panel | `getCallerByPhone(phone)` (`GET /api/callers/by-phone`, real & matching) | Hardcoded caller record / `mockCallerProfiles` |
| `DispatchImmediate.jsx` (entire page) | `getIncident`, `findNearestUnit` (fix shape first, §1 item 11), `createDispatch` | 100% mock, **zero** `api/*.js` imports — this is the "life-critical" fast-dispatch screen and it is fully disconnected from the backend |
| `AIDispatchEngine.jsx` → `AvailableUnitsModal` | `listVehicles()` | Hardcoded 4-unit array |
| `Notifications.jsx` → `MutualAidOfferModal`, `MutualAidRequestModal.jsx`, `RequestAdditionalUnitModal.jsx` | `createMutualAidRequest()`/`updateMutualAidStatus()` | Local notification only, no persistence |
| `ShiftHandover.jsx` "Finalize & logout" | `endShift(shift.shift_id)` (`PATCH /api/shifts/{id}/end`) | `navigate('/login')` only — shift never closed server-side |
| `IncidentClosure.jsx` | `createClosure()` (`POST /api/incident-closures`) — see §1 item 18 | Only status PATCH |
| `fieldResponderStore.js` `endShift`/(missing) `startShift` | Real `api/shifts.js` functions — see §1 item 16 | Local state mutation only |
| `callChannelStore.js` | Subscribe to `/topic/calls/{sessionId}/status` (backend already publishes it via `CallController`) | Only optimistic local update — other dispatchers don't see live claim/pass state |

---

## 4. Per-area detailed findings

### 4.1 Auth (`src/pages/auth/**`)
All core flows (Login, LoginMfa, MfaSetup, Register, SetPassword) are **fully and correctly wired** — `POST /api/auth/login`, `/mfa/verify`, `/mfa/resend`, `/mfa/setup`, `/mfa/setup/confirm`, `GET /api/auth/invite-info`, `POST /api/auth/accept-invite` all match their DTOs field-for-field. `FRLogin`/`FRLoginMfa`/`FRMfaSetup`/`FRRegister` mirror the same, correctly.

Two pages are dead/orphan code with no wiring at all: `VerifyOtp.jsx` and `FRVerifyOtp.jsx` do only client-side digit validation and hardcode a `navigate()` — they're superseded by `LoginMfa.jsx`/`FRLoginMfa.jsx`, which do the real thing. Recommend removal rather than backend work.

Minor: `LoginMfa.jsx` never passes `trustDevice`/`deviceLabel` to `verifyMfa()` even though the backend supports it — "Remember this device" silently does nothing on desktop MFA. `FRRegister.jsx` doesn't call `getInviteInfo` to prefill name/role the way `Register.jsx` does — inconsistent but not broken.

### 4.2 Admin (`src/pages/admin/**`)
`AdminSecurity.jsx`'s security-events panel and `AdminUsers.jsx`'s user list are genuinely live (`listSecurityEvents`, `listUsers`). Everything else on `AdminDashboard.jsx` (system status, integration health, activity log, scheduled jobs), all of `AdminSystemSettings.jsx` (retention, backups, announcements), and all of `AdminIntegrations.jsx` is 100% mock with no backend concept at all — see §2. `AdminAudit.jsx` is wired for audit logs but has the role-field bug (§1 item 7) and an unwired security-events panel that should just reuse the existing call (§3). `AdminInviteUser.jsx` has the dropped district/agency bug (§1 item 9). `AdminProfile.jsx` shows a hardcoded identity instead of the logged-in admin.

### 4.3 Analyst (`src/pages/analyst/**`)
`AnalystDashboard.jsx`/`AnalystDataQuality.jsx` call `listDataQuality()` but the response is broken by the missing DTO fields (§1 item 6). `AnalystModels.jsx` calls `listModels()` but the mapped object never sets most of the fields the cards render (`drift_pct`, `training_data_size`, etc. — see §2's `AiModelDto` extension ask) — broken even on API success. `AnalystPatterns.jsx`, `AnalystBenchmarking.jsx` are 100% mock with no backend call at all. `AnalystReports.jsx`/`AnalystLibrary.jsx` have the mock-array-push pattern (§1 item 17, §3). Two explicit in-code developer comments confirm `report_schedules` and `report annotations` have no backing schema at all — these are genuine "not started yet" backend features, not integration bugs.

### 4.4 Dispatcher (`src/pages/dispatcher/**`)
Strongest area overall — `ActiveIncident`, `MissedCalls`, `NewIncident`, `PendingReports`, `IncidentHistory`, `ShiftHandover` are all genuinely wired with real, matching endpoints. But: `DispatchImmediate.jsx` — the fast-path "life-critical" dispatch screen — has **zero** API calls at all, entirely mock-driven end to end (§3). `IncidentClosure.jsx` drops all closure detail fields (§1 item 18). `AIDispatchEngine.jsx`'s "choose different unit" modal is hardcoded instead of calling `listVehicles()`. Live per-unit GPS tracking on the incident map is fabricated with `Math.random()` jitter — no backend stream exists for it (§2). Unified Comms (text/voice) on the incident screen has no backend at all (§2 — same gap as the Field Responder side, should likely be one shared endpoint/topic).

### 4.5 Ops Manager (`src/pages/ops-manager/**`)
Reads are decently wired on `OpsManagerDashboard.jsx` (`listVehicles`, `listIncidents`) and `OpsManagerMultiAgency.jsx` (`listBroadcasts`, `listMutualAidRequests`) — a clean "wired for read, dead for write" pattern: every write action in this whole role (broadcast send, mutual-aid submit, dispatch, reallocation, shift-report submit) pushes to a mock array instead of calling the matching, already-implemented endpoint. `OpsManagerDispatchers.jsx`, `OpsManagerEscalations.jsx`, `OpsManagerMap.jsx` have no API calls at all. Found the `'OPS_MANAGER'` vs `'OPERATIONS_MANAGER'` role-string backend bug here (§1 item 3) — blocks any future wiring of Reporting/Planning endpoints for this role. Two genuinely new backend concepts confirmed missing: agency-involvement tracking and ad-hoc unit reallocation persistence.

### 4.6 Field Responder (`src/pages/field-responder/**`)
`FRFieldReport.jsx` is correctly and fully wired to `POST /api/field-reports`. Everything else in the flow — `FRAssignment` (current assignment), `FRNavigation` (turn-by-turn), `FROnScene` (comms), `FRPerformance`, `FRShiftStart`/`FRShiftEnd` (duty status) — is either mock-only or a local-only store action with no server persistence (§1 item 16, §2). `BackupRequestModal.jsx` and `FlagIssueModal.jsx` both write only to discarded mock arrays; the backend already has a `BackupRequest` entity + repository with **no controller exposing it** — purely a missing-controller gap, not a schema gap. Field report submissions also currently reference hardcoded mock incident/officer IDs rather than the real active assignment/session — will submit wrong data in production until `FRAssignment` is wired to something real.

### 4.7 District Commander (`src/pages/district-commander/**`)
`DCExecutiveReport.jsx` and `DCResources.jsx` build objects that map almost 1:1 onto already-existing, already-implemented backend DTOs (`PeriodicReportDto`, `ResourceRequestDto`) — pure wiring debt, zero new backend work (§3), other than fixing the two `api/reporting.js` field-name bugs first (§1 items 13–14). `DCShiftReports.jsx` and `DCUnits.jsx` both contain **explicit developer TODO comments** confirming `reviewedBy`/`reviewedAt` (shift report review workflow) and `supervisorNote` (unit notes) columns don't exist in the schema yet — these are honest, pre-flagged gaps, not oversights. `DCCoverage.jsx` should just reuse `listCoverageGaps()`, already correctly used by the Planner equivalent page.

### 4.8 Planner (`src/pages/planner/**`)
`PlannerCoverage.jsx`, `PlannerHotspots.jsx`, `PlannerPrediction.jsx`, `PlannerDeployment.jsx`, `PlannerSimulation.jsx` are all genuinely wired to real, matching endpoints (`listCoverageGaps`, `getHotspots`, `getPredictions`, `listPlans`/`createPlan`, `listSimulations`/`runSimulation`) — this is the best-integrated role after Dispatcher. Gaps are additive/secondary chart data (trend history, time-of-day histograms, prediction accuracy/factor weights — §2) rather than core functionality. `PlannerReports.jsx` has the same mock-push pattern as `DCExecutiveReport.jsx` (§3). `PlannerSimulation.jsx` has the missing-import crash bug (§1 item 5).

### 4.9 Settings / Layout / Shared components
`SettingsProfileSection.jsx` is the one genuinely backend-wired settings component (`getUser`/`updateUser`). Every single per-role `*SettingsView.jsx` (Admin, Analyst, Dispatcher, District Commander, Field Responder, Ops Manager, Planner) stores notification toggles, map/audio/dispatch preferences, and a fake "Active Sessions" list purely in local component state — none of it persists or loads from a backend. `SettingsPasswordSection.jsx` explicitly simulates OTP verification (any 6-digit code passes) and password change with `setTimeout` — there is no real password-change flow at all yet. `Sidebar.jsx` (dispatcher) and `AdminSidebar.jsx` correctly fetch live badge counts; every other role's sidebar either has no badge-count wiring or (District Commander) hardcodes the count to `0`.

### 4.10 Stores, utils, WebSocket
The backend WebSocket layer is real and substantially wired: `WebSocketConfig` (STOMP over SockJS at `/ws`), and `WebSocketPublisher` implements `/topic/calls`, `/topic/calls/{sessionId}/status`, `/topic/incidents/{id}/status`, `/topic/vehicles/{id}/gps`, `/user/queue/assignments`, `/user/queue/notifications`. Of these, `publishIncomingCall`, `publishIncidentStatus`, `publishGpsUpdate`, `publishCallStatus`, and `publishAssignment` are all actually invoked by real services. `publishNotification` is defined but **never called by anything** (§1 item 15) — the one dead link in an otherwise working real-time system. `callChannelStore.js` and `notificationsStore.js` are the only two stores that consume WebSocket data, and both do so correctly when wired. `fieldResponderStore.js`'s chat/comms state and GPS-ping-until-real-vehicle-id logic are the two soft spots (mock-seeded chat, MOCK_VEHICLE_ID sentinel gating pings). `districtCommanderSession.js`/`opsManagerDistrict.js` both hardcode `'Nyarugenge'` as a fallback district when no session key is present, rather than deriving it from the authenticated user's real assignment.

---

## 5. Full `api/*.js` inventory

Legend: **MATCH** = route + shape both correct · **MISMATCH** = route exists, field names differ (see §1 for specifics) · **MISSING** = no backend route at all · **UNUSED** = correctly implemented but no frontend caller.

### admin.js
| Function | Route | Frontend caller | Status |
|---|---|---|---|
| `listAuditLogs()` | GET `/api/admin/audit-logs` | `AdminAudit.jsx` | MISMATCH (drops `userRole`, §1.7) |
| `listSecurityEvents()` | GET `/api/admin/security-events` | `AdminSidebar.jsx`, `AdminSecurity.jsx` | MATCH |

### agencies.js
| Function | Route | Frontend caller | Status |
|---|---|---|---|
| `listAgencies()` | GET `/api/agencies` | none | MISMATCH (§1.10), UNUSED |
| `getAgency(id)` | GET `/api/agencies/{id}` | none | MISMATCH, UNUSED |
| `createAgency(body)` | POST `/api/agencies` | none | MISMATCH, UNUSED |
| `updateAgency(id, body)` | PUT `/api/agencies/{id}` | none | MISMATCH, UNUSED |
| `listStations(districtId, agencyId)` | GET `/api/stations` | none | MISMATCH, UNUSED |
| `getStation(id)` | GET `/api/stations/{id}` | none | MISMATCH, UNUSED |
| `createStation(body)` | POST `/api/stations` | none | MISMATCH, UNUSED |

### auth.js
| Function | Route | Frontend caller | Status |
|---|---|---|---|
| `login` | POST `/api/auth/login` | Login, FRLogin, Register | MATCH |
| `verifyMfa` | POST `/api/auth/mfa/verify` | LoginMfa, FRLoginMfa | MATCH |
| `refreshToken` | POST `/api/auth/refresh` | none (apiClient.js duplicates this inline) | MATCH, UNUSED |
| `logoutApi` | POST `/api/auth/logout` | none | MATCH, UNUSED |
| `setupMfa` | POST `/api/auth/mfa/setup` | MfaSetup, FRMfaSetup | MATCH |
| `confirmMfaSetup` | POST `/api/auth/mfa/setup/confirm` | MfaSetup, FRMfaSetup | MATCH |
| `resendMfaCode` | POST `/api/auth/mfa/resend` | LoginMfa, FRLoginMfa | MATCH |
| `getInviteInfo` | GET `/api/auth/invite-info` | Register, FRRegister | MATCH |
| `acceptInvite` | POST `/api/auth/accept-invite` | Register, FRRegister | MATCH |

### broadcasts.js
| Function | Route | Frontend caller | Status |
|---|---|---|---|
| `listBroadcasts()` | GET `/api/broadcasts` | OpsManagerMultiAgency | MATCH |
| `createBroadcast(body)` | POST `/api/broadcasts` | none | MATCH, UNUSED (§3) |

### callers.js
| Function | Route | Frontend caller | Status |
|---|---|---|---|
| `listCallers()` | GET `/api/callers` | none | MATCH, UNUSED |
| `getCaller(id)` | GET `/api/callers/{id}` | none | MATCH, UNUSED |
| `getCallerByPhone(phone)` | GET `/api/callers/by-phone` | `callChannelStore.js` | MATCH (should also be used by NewIncident.jsx — §3) |

### calls.js
| Function | Route | Frontend caller | Status |
|---|---|---|---|
| `listCalls(status)` | GET `/api/calls` | none | MISMATCH (§1.12), UNUSED |
| `claimCall` | POST `/api/calls/{id}/claim` | `callChannelStore.js` | MATCH |
| `passCall` | POST `/api/calls/{id}/pass` | `callChannelStore.js` | MATCH |
| `missCall` | POST `/api/calls/{id}/miss` | none | MATCH, UNUSED |
| `linkIncident` | PATCH `/api/calls/{id}/link-incident` | none | MATCH, UNUSED (dispatcher never links a created incident back to the call) |

### dispatches.js
| Function | Route | Frontend caller | Status |
|---|---|---|---|
| `listDispatchesForIncident` | GET `/api/dispatches` | ActiveIncident | MATCH |
| `getDispatch` | GET `/api/dispatches/{id}` | none | MATCH, UNUSED |
| `createDispatch` | POST `/api/dispatches` | AIDispatchEngine | MATCH |
| `findNearestUnit` | GET `/api/dispatch/immediate/nearest` | none | MISMATCH (§1.11), UNUSED |

### districts.js
| Function | Route | Frontend caller | Status |
|---|---|---|---|
| `listDistricts()` | GET `/api/districts` | NewIncident | MATCH |
| `getDistrict(id)` | GET `/api/districts/{id}` | none | MATCH, UNUSED |
| `getSectors(districtId)` | GET `/api/districts/{id}/sectors` | none | MISSING (§2) |

### fieldReports.js
| Function | Route | Frontend caller | Status |
|---|---|---|---|
| `listMyReports()` | GET `/api/field-reports/my` | none | MATCH, UNUSED |
| `getReportForIncident` | GET `/api/incidents/{id}/field-report` | none | MATCH, UNUSED |
| `submitFieldReport` | POST `/api/field-reports` | `fieldResponderStore.js` | MATCH |
| `getClosureForIncident` | GET `/api/incidents/{id}/closure` | none | MATCH, UNUSED |
| `uploadAttachment` | POST `/api/field-reports/{id}/attachments` | none | MATCH, UNUSED |
| `createClosure` | POST `/api/incident-closures` | none (should be called by IncidentClosure.jsx — §1.18) | MATCH, UNUSED |

### incidents.js
| Function | Route | Frontend caller | Status |
|---|---|---|---|
| `listIncidents` | GET `/api/incidents` | ActiveIncident, IncidentClosure, IncidentHistory, OpsManagerDashboard, LiveDispatchMap, PendingReports, ShiftHandover | MISMATCH (§1.1, high severity) |
| `getIncident` | GET `/api/incidents/{id}` | ActiveIncident | MISMATCH (same) |
| `createIncident` | POST `/api/incidents` | NewIncident | Request MATCH, response reuses broken transform |
| `updateIncidentStatus` | PATCH `/api/incidents/{id}/status` | IncidentClosure | MATCH |
| `checkDuplicates` | GET `/api/incidents/duplicates` | NewIncident | Route MATCH, response reuses broken transform |
| `getAiRecommendation` | GET `/api/dispatch/ai-recommend/{id}` | AIDispatchEngine | MATCH |

### location.js
All 5 functions (`triangulateFromTelecom`, `locateViaSmsGps`, `geocodeSector`, `findLandmark`, `saveMapPin`) — MATCH their backend routes on `LocationController` exactly, but **none are called anywhere in the frontend**. Fully dead code with a fully working backend behind it. Natural fit: `components/intake/LandmarkAssistPanel.jsx`, `LiveLocationMap.jsx`.

### missedCalls.js
| Function | Route | Frontend caller | Status |
|---|---|---|---|
| `listMissedCalls` | GET `/api/missed-calls` | MissedCalls.jsx, Sidebar.jsx | MATCH |
| `markCalledBack` | PATCH `/api/missed-calls/{id}/callback` | MissedCalls.jsx | MATCH |

### mutualAid.js
| Function | Route | Frontend caller | Status |
|---|---|---|---|
| `listMutualAidRequests` | GET `/api/mutual-aid` | OpsManagerMultiAgency | MATCH |
| `createMutualAidRequest` | POST `/api/mutual-aid` | none (should be — §3) | MATCH, UNUSED |
| `updateMutualAidStatus` | PATCH `/api/mutual-aid/{id}/status` | none (should be — §3) | MATCH, UNUSED |

### notifications.js
All 4 functions (`listNotifications`, `markNotificationRead`, `markAllNotificationsRead`, `resolveHref`) — MATCH, all genuinely used via `notificationsStore.js`.

### planning.js
12 functions total. `listPlans`, `createPlan`, `listSimulations`, `runSimulation`, `listCoverageGaps`, `getPredictions`, `getHotspots` — all MATCH and genuinely used. `getPlan`, `updatePlanStatus`, `listInstructions` (imported but never called), `listEvents`, `createEvent` — all MATCH but UNUSED.

### reporting.js
11 functions. `listReports`, `listDataQuality`, `listModels` — MATCH and used (though `listDataQuality`'s consumer logic is broken, §1.6; `listModels`' consumer is broken, §2). `getReport`, `generateReport`, `submitReport`, `listUnitPerformance` (MISMATCH, §1.14), `runDataQualityCheck`, `listResourceRequests`/`createResourceRequest` (MISMATCH, §1.13), `listPatterns`, — all UNUSED. Backend also has `POST /api/reporting/unit-performance/{vehicleId}` (`computePerformance`) with **no frontend wrapper at all**.

### shifts.js
| Function | Route | Frontend caller | Status |
|---|---|---|---|
| `getMyShifts` | GET `/api/shifts/my` | ShiftHandover.jsx | MATCH |
| `listActiveShifts` | GET `/api/shifts` | none | MATCH, UNUSED |
| `startShift` | POST `/api/shifts` | none | MATCH, UNUSED |
| `endShift` | PATCH `/api/shifts/{id}/end` | none (shadowed by unrelated store action, §1.16) | MATCH, UNUSED |

### triage.js
`getTriageQuestions`, `getSeverityRules` — MATCH, used by NewIncident.jsx. `submitTriageResponses` — MATCH, UNUSED (NewIncident computes severity client-side via `severityEngine.js` instead of submitting to this endpoint).

### users.js
| Function | Route | Frontend caller | Status |
|---|---|---|---|
| `listUsers` | GET `/api/users` | AdminSidebar, AdminUsers | MATCH |
| `getUser` | GET `/api/users/{id}` | SettingsProfileSection | MATCH |
| `createUser` | POST `/api/users` | none | MATCH, UNUSED |
| `updateUser` | PUT `/api/users/{id}` | SettingsProfileSection | MATCH |
| `inviteUser` | POST `/api/users/invite` | AdminInviteUser | MATCH (payload bug, §1.9) |
| `deleteUser` | DELETE `/api/users/{id}` | none | MATCH, UNUSED |

### vehicles.js
| Function | Route | Frontend caller | Status |
|---|---|---|---|
| `listVehicles` | GET `/api/vehicles` | OpsManagerDashboard, LiveDispatchMap | MATCH |
| `getVehicle` | GET `/api/vehicles/{id}` | none | MATCH, UNUSED |
| `updateVehicleStatus` | PATCH `/api/vehicles/{id}/status` | none | MATCH, UNUSED |
| `recordGpsPing` | POST `/api/vehicles/{id}/gps` | `fieldResponderStore.js` | MATCH |

---

## 6. Bottom line

- **The auth flow, dispatcher core (minus DispatchImmediate), planner core, and field-report submission are solidly integrated.** Trust these.
- **The single highest-impact fix is §1 item 1** (`incidents.js` transform) — it silently breaks the live dispatch map and several detail views everywhere `IncidentDto` data is shown, and is a pure frontend fix, no backend change needed.
- **Ops Manager and most Settings screens are the least integrated** — a consistent "reads work, writes are fake" pattern, with most of the needed backend endpoints already existing.
- **Real new backend work is concentrated in**: admin platform-ops (system status, integrations, backups, sessions, announcements), analyst/reporting analytics (patterns, benchmarking, model telemetry, report scheduling/annotations — two of which are confirmed not-yet-designed per in-code comments), incident/field comms persistence, and a handful of missing controllers for entities that already exist (`BackupRequest`, `Reallocation`).

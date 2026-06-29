// PARTIAL INTEGRATION: listDistricts() wired to backend GET /api/districts.
// District objects embedded here are UI display data; migrate to src/api/districts.js when needed.
export const DC_CHART_MONTHS = ['Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec', 'Jan', 'Feb', 'Mar', 'Apr', 'May']

export const DC_RESPONSE_TIME_TREND = [
  { month: 'Jun', minutes: 8.2 },
  { month: 'Jul', minutes: 7.9 },
  { month: 'Aug', minutes: 8.4 },
  { month: 'Sep', minutes: 7.6 },
  { month: 'Oct', minutes: 7.3 },
  { month: 'Nov', minutes: 7.8 },
  { month: 'Dec', minutes: 8.1 },
  { month: 'Jan', minutes: 7.5 },
  { month: 'Feb', minutes: 7.2 },
  { month: 'Mar', minutes: 7.4 },
  { month: 'Apr', minutes: 7.1 },
  { month: 'May', minutes: 7.4 },
]

export const DC_INCIDENT_VOLUME_TREND = [
  { month: 'Jun', count: 268 },
  { month: 'Jul', count: 291 },
  { month: 'Aug', count: 305 },
  { month: 'Sep', count: 278 },
  { month: 'Oct', count: 312 },
  { month: 'Nov', count: 298 },
  { month: 'Dec', count: 340 },
  { month: 'Jan', count: 256 },
  { month: 'Feb', count: 272 },
  { month: 'Mar', count: 289 },
  { month: 'Apr', count: 301 },
  { month: 'May', count: 312 },
]

/**
 * Shift reports submitted by Operations Managers.
 * Schema fields (snake_case match DB columns):
 *   id, om (created_by display name), shift, submitted_at, incidents, avg_response_time,
 *   status, notes, reviewed_by (UUID — not yet in DB schema, see DCShiftReports.jsx comment),
 *   reviewed_at (same)
 * UI-only fields (no DB column — documented):
 *   metrics        — aggregated display object, derived from report data
 *   significantIncidents — incident references displayed inline
 */
export const DC_SHIFT_REPORTS = [
  {
    id: 'RPT-0041',
    om: 'Kagame R.',
    created_by: 'om-uuid-001',
    shift: '00:00–08:00',
    submitted_at: 'Today 08:12',
    incidents: 28,
    avg_response_time: '7.1m',
    status: 'PENDING REVIEW',
    notes:
      'Heavy medical load in Nyamirambo between 04:00–06:00. Biryogo coverage dipped below threshold — REC-0042 approved for OM execution.',
    reviewed_by: null,
    reviewed_at: null,
    /** @ui aggregated display — not a DB column */
    metrics: { incidents: 28, avgResponse: '7.1m', coverage: '89%', ai_acceptance_rate: '86%' },
    /** @ui incident references displayed inline — not a DB column */
    significantIncidents: [
      { id: 'INC-2412', type: 'Medical Emergency', severity: 'HIGH', outcome: 'Resolved — Nyamirambo' },
      { id: 'INC-2409', type: 'Road Traffic Accident', severity: 'MEDIUM', outcome: 'Resolved — KN 3 Ave' },
      { id: 'INC-2403', type: 'Structure Fire', severity: 'CRITICAL', outcome: 'Active handover' },
    ],
  },
  {
    id: 'RPT-0040',
    om: 'Uwimana A.',
    created_by: 'om-uuid-002',
    shift: '16:00–00:00',
    submitted_at: 'Yesterday 00:05',
    incidents: 31,
    avg_response_time: '7.6m',
    status: 'REVIEWED',
    notes: 'Evening peak managed well. Muhima sector required extra motorcycle patrol.',
    reviewed_by: null,
    reviewed_at: null,
    /** @ui */
    metrics: { incidents: 31, avgResponse: '7.6m', coverage: '90%', ai_acceptance_rate: '84%' },
    /** @ui */
    significantIncidents: [
      { id: 'INC-2407', type: 'Armed Robbery', severity: 'HIGH', outcome: 'Resolved — Biryogo' },
      { id: 'INC-2405', type: 'Public Disturbance', severity: 'MEDIUM', outcome: 'Resolved — Muhima' },
    ],
  },
  {
    id: 'RPT-0039',
    om: 'Kagame R.',
    created_by: 'om-uuid-001',
    shift: '08:00–16:00',
    submitted_at: 'Yesterday 16:08',
    incidents: 24,
    avg_response_time: '7.3m',
    status: 'REVIEWED',
    notes: 'Routine shift. Kimisagara coverage improved after P-19 redeployment.',
    reviewed_by: null,
    reviewed_at: null,
    /** @ui */
    metrics: { incidents: 24, avgResponse: '7.3m', coverage: '92%', ai_acceptance_rate: '88%' },
    /** @ui */
    significantIncidents: [
      { id: 'INC-2398', type: 'Traffic Accident', severity: 'HIGH', outcome: 'Resolved — Nyarugenge Centre' },
    ],
  },
  {
    id: 'RPT-0038',
    om: 'Nkurunziza J.',
    created_by: 'om-uuid-003',
    shift: '00:00–08:00',
    submitted_at: '2 days ago',
    incidents: 19,
    avg_response_time: '8.2m',
    status: 'FLAGGED',
    notes: 'Missed call rate elevated in Biryogo. AMB-09 response times exceeded target — flagged for DC review.',
    reviewed_by: null,
    reviewed_at: null,
    /** @ui */
    metrics: { incidents: 19, avgResponse: '8.2m', coverage: '74%', ai_acceptance_rate: '79%' },
    /** @ui */
    significantIncidents: [
      { id: 'INC-2395', type: 'Medical Emergency', severity: 'HIGH', outcome: 'Delayed — Biryogo' },
    ],
  },
  {
    id: 'RPT-0037',
    om: 'Uwimana A.',
    created_by: 'om-uuid-002',
    shift: '16:00–00:00',
    submitted_at: '2 days ago',
    incidents: 35,
    avg_response_time: '7.0m',
    status: 'REVIEWED',
    notes: 'High volume night shift. Mutual aid not required.',
    reviewed_by: null,
    reviewed_at: null,
    /** @ui */
    metrics: { incidents: 35, avgResponse: '7.0m', coverage: '91%', ai_acceptance_rate: '87%' },
    /** @ui */
    significantIncidents: [
      { id: 'INC-2392', type: 'Security/Theft', severity: 'MEDIUM', outcome: 'Resolved — Nyamirambo' },
    ],
  },
  {
    id: 'RPT-0036',
    om: 'Kagame R.',
    created_by: 'om-uuid-001',
    shift: '08:00–16:00',
    submitted_at: '3 days ago',
    incidents: 26,
    avg_response_time: '7.5m',
    status: 'REVIEWED',
    notes: 'Stable operations across Nyarugenge Centre and Muhima.',
    reviewed_by: null,
    reviewed_at: null,
    /** @ui */
    metrics: { incidents: 26, avgResponse: '7.5m', coverage: '90%', ai_acceptance_rate: '85%' },
    /** @ui */
    significantIncidents: [],
  },
  {
    id: 'RPT-0035',
    om: 'Nkurunziza J.',
    created_by: 'om-uuid-003',
    shift: '00:00–08:00',
    submitted_at: '3 days ago',
    incidents: 22,
    avg_response_time: '7.8m',
    status: 'PENDING REVIEW',
    notes: 'Pending DC acknowledgment — overnight staffing adequate.',
    reviewed_by: null,
    reviewed_at: null,
    /** @ui */
    metrics: { incidents: 22, avgResponse: '7.8m', coverage: '88%', ai_acceptance_rate: '82%' },
    /** @ui */
    significantIncidents: [],
  },
  {
    id: 'RPT-0034',
    om: 'Uwimana A.',
    created_by: 'om-uuid-002',
    shift: '16:00–00:00',
    submitted_at: '4 days ago',
    incidents: 29,
    avg_response_time: '7.2m',
    status: 'REVIEWED',
    notes: 'Weekend surge handled with standard roster.',
    reviewed_by: null,
    reviewed_at: null,
    /** @ui */
    metrics: { incidents: 29, avgResponse: '7.2m', coverage: '91%', ai_acceptance_rate: '86%' },
    /** @ui */
    significantIncidents: [],
  },
]

export const DC_DASHBOARD_REPORTS = DC_SHIFT_REPORTS.slice(0, 5)

/**
 * District units (maps to vehicles table).
 * Schema fields: id, unit_type, status, supervisor_note (not yet in DB schema — see DCUnits.jsx comment)
 * UI-only fields:
 *   score — composite performance score, derived from performance_score
 */
export const DC_UNITS = [
  { id: 'P-03',   unit_type: 'Police Van',  incidents: 124, avg_response_time: '6.8m', ai_acceptance_rate: 91, score: 94, status: 'ACTIVE',       supervisor_note: '' },
  { id: 'P-07',   unit_type: 'Police Van',  incidents: 98,  avg_response_time: '8.2m', ai_acceptance_rate: 78, score: 76, status: 'ACTIVE',       supervisor_note: '' },
  { id: 'P-12',   unit_type: 'Motorcycle',  incidents: 201, avg_response_time: '5.1m', ai_acceptance_rate: 94, score: 97, status: 'ACTIVE',       supervisor_note: '' },
  { id: 'AMB-04', unit_type: 'Ambulance',   incidents: 87,  avg_response_time: '7.9m', ai_acceptance_rate: 88, score: 82, status: 'ACTIVE',       supervisor_note: '' },
  { id: 'FTK-02', unit_type: 'Fire Unit',   incidents: 34,  avg_response_time: '9.1m', ai_acceptance_rate: 72, score: 71, status: 'ACTIVE',       supervisor_note: '' },
  { id: 'P-19',   unit_type: 'Police Van',  incidents: 112, avg_response_time: '7.3m', ai_acceptance_rate: 85, score: 88, status: 'ACTIVE',       supervisor_note: '' },
  { id: 'P-22',   unit_type: 'Motorcycle',  incidents: 178, avg_response_time: '5.8m', ai_acceptance_rate: 90, score: 91, status: 'MAINTENANCE',  supervisor_note: 'Scheduled service — Kimisagara depot' },
  { id: 'AMB-09', unit_type: 'Ambulance',   incidents: 61,  avg_response_time: '11.4m',ai_acceptance_rate: 61, score: 58, status: 'ACTIVE',       supervisor_note: '' },
]

export const DC_COVERAGE_SECTORS = [
  { name: 'Nyamirambo',       coverage: 92, lat: -1.9659, lng: 30.0444, radius: 900 },
  { name: 'Muhima',           coverage: 74, lat: -1.948,  lng: 30.055,  radius: 800 },
  { name: 'Biryogo',          coverage: 58, lat: -1.968,  lng: 30.042,  radius: 750 },
  { name: 'Nyarugenge Centre',coverage: 88, lat: -1.952,  lng: 30.0588, radius: 850 },
  { name: 'Kimisagara',       coverage: 71, lat: -1.972,  lng: 30.052,  radius: 800 },
]

export const DC_COVERAGE_RECOMMENDATIONS = [
  {
    id: 'CR-01',
    text: 'Deploy P-03 to Biryogo Standby Point A',
    impact: 'Projected coverage: 58% → 79% in Biryogo',
    source: 'Generated by Coverage Watcher · Confidence: 88%',
    zone: 'Biryogo',
    approved: false,
  },
  {
    id: 'CR-02',
    text: 'Shift AMB-04 to Muhima Junction overnight',
    impact: 'Projected coverage: 74% → 86% in Muhima',
    source: 'Generated by Coverage Watcher · Confidence: 81%',
    zone: 'Muhima',
    approved: false,
  },
  {
    id: 'CR-03',
    text: 'Add motorcycle patrol loop — Kimisagara',
    impact: 'Projected coverage: 71% → 83% in Kimisagara',
    source: 'Generated by Coverage Watcher · Confidence: 76%',
    zone: 'Kimisagara',
    approved: false,
  },
]

/**
 * Resource requests table. Maps to resource_requests schema.
 * snake_case: unit_type, quantity, submitted_at
 */
export const DC_RESOURCE_REQUESTS = [
  {
    id: 'REQ-0018',
    unit_type: 'Police Van',
    quantity: 2,
    submitted_at: 'May 10',
    status: 'APPROVED',
    detail: 'Approved May 12 · Units arrive May 18',
  },
  {
    id: 'REQ-0017',
    unit_type: 'Ambulance',
    quantity: 1,
    submitted_at: 'May 22',
    status: 'PENDING',
    detail: 'Under review at HQ — 4 days pending',
  },
  {
    id: 'REQ-0016',
    unit_type: 'Fire Unit',
    quantity: 3,
    submitted_at: 'Apr 28',
    status: 'DECLINED',
    detail: 'Declined May 2 · Reason: Budget cycle',
  },
]

export const DC_INCIDENT_TYPES = [
  { type: 'Medical Emergency',    count: 89, avgResponse: '6.2m', resolution: '97%' },
  { type: 'Road Traffic Accident',count: 74, avgResponse: '7.8m', resolution: '94%' },
  { type: 'Security/Theft',       count: 61, avgResponse: '8.4m', resolution: '91%' },
  { type: 'Domestic',             count: 48, avgResponse: '9.1m', resolution: '88%' },
  { type: 'Fire',                 count: 12, avgResponse: '10.3m',resolution: '100%' },
]

export const DC_SIGNIFICANT_EVENTS = [
  { date: 'May 18', text: 'Multi-vehicle collision on KN 4 Ave — 3 units, no fatalities.' },
  { date: 'May 12', text: 'Structure fire in Nyamirambo market area — escalated to OM command.' },
  { date: 'May 3',  text: 'Civil disturbance near Biryogo — resolved within 45 minutes.' },
]

export const DC_REPORT_ARCHIVE = [
  { period: 'Apr 2026', submitted_at: 'May 2, 2026',  status: 'SUBMITTED' },
  { period: 'Mar 2026', submitted_at: 'Apr 1, 2026',  status: 'SUBMITTED' },
  { period: 'Feb 2026', submitted_at: 'Mar 3, 2026',  status: 'SUBMITTED' },
  { period: 'Jan 2026', submitted_at: 'Feb 2, 2026',  status: 'SUBMITTED' },
  { period: 'Dec 2025', submitted_at: 'Jan 3, 2026',  status: 'SUBMITTED' },
  { period: 'Nov 2025', submitted_at: 'Dec 2, 2025',  status: 'SUBMITTED' },
]

export function getPendingShiftReportCount() {
  return DC_SHIFT_REPORTS.filter((r) => r.status === 'PENDING REVIEW').length
}

export function getReportStatusVariant(status) {
  if (status === 'PENDING REVIEW') return 'handover'
  if (status === 'FLAGGED') return 'critical'
  return 'resolved'
}

export function getPerformanceScoreStyle(score) {
  if (score >= 90) return { background: 'var(--status-low-bg)',      color: 'var(--status-low)'      }
  if (score >= 70) return { background: 'var(--status-medium-bg)',   color: 'var(--status-medium)'   }
  return              { background: 'var(--status-critical-bg)', color: 'var(--status-critical)' }
}

export function getRequestBorderColor(status) {
  if (status === 'APPROVED') return 'var(--status-low)'
  if (status === 'PENDING')  return 'var(--status-medium)'
  return 'var(--status-critical)'
}

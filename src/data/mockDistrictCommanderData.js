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

export const DC_SHIFT_REPORTS = [
  {
    id: 'RPT-0041',
    om: 'Kagame R.',
    shift: '00:00–08:00',
    submitted: 'Today 08:12',
    incidents: 28,
    avgResponse: '7.1m',
    status: 'PENDING REVIEW',
    notes:
      'Heavy medical load in Nyamirambo between 04:00–06:00. Biryogo coverage dipped below threshold — REC-0042 approved for OM execution.',
    metrics: { incidents: 28, avgResponse: '7.1m', coverage: '89%', aiRate: '86%' },
    significantIncidents: [
      { id: 'INC-2412', type: 'Medical Emergency', severity: 'HIGH', outcome: 'Resolved — Nyamirambo' },
      { id: 'INC-2409', type: 'Road Traffic Accident', severity: 'MEDIUM', outcome: 'Resolved — KN 3 Ave' },
      { id: 'INC-2403', type: 'Structure Fire', severity: 'CRITICAL', outcome: 'Active handover' },
    ],
  },
  {
    id: 'RPT-0040',
    om: 'Uwimana A.',
    shift: '16:00–00:00',
    submitted: 'Yesterday 00:05',
    incidents: 31,
    avgResponse: '7.6m',
    status: 'REVIEWED',
    notes: 'Evening peak managed well. Muhima sector required extra motorcycle patrol.',
    metrics: { incidents: 31, avgResponse: '7.6m', coverage: '90%', aiRate: '84%' },
    significantIncidents: [
      { id: 'INC-2407', type: 'Armed Robbery', severity: 'HIGH', outcome: 'Resolved — Biryogo' },
      { id: 'INC-2405', type: 'Public Disturbance', severity: 'MEDIUM', outcome: 'Resolved — Muhima' },
    ],
  },
  {
    id: 'RPT-0039',
    om: 'Kagame R.',
    shift: '08:00–16:00',
    submitted: 'Yesterday 16:08',
    incidents: 24,
    avgResponse: '7.3m',
    status: 'REVIEWED',
    notes: 'Routine shift. Kimisagara coverage improved after P-19 redeployment.',
    metrics: { incidents: 24, avgResponse: '7.3m', coverage: '92%', aiRate: '88%' },
    significantIncidents: [
      { id: 'INC-2398', type: 'Traffic Accident', severity: 'HIGH', outcome: 'Resolved — Nyarugenge Centre' },
    ],
  },
  {
    id: 'RPT-0038',
    om: 'Nkurunziza J.',
    shift: '00:00–08:00',
    submitted: '2 days ago',
    incidents: 19,
    avgResponse: '8.2m',
    status: 'FLAGGED',
    notes: 'Missed call rate elevated in Biryogo. AMB-09 response times exceeded target — flagged for DC review.',
    metrics: { incidents: 19, avgResponse: '8.2m', coverage: '74%', aiRate: '79%' },
    significantIncidents: [
      { id: 'INC-2395', type: 'Medical Emergency', severity: 'HIGH', outcome: 'Delayed — Biryogo' },
    ],
  },
  {
    id: 'RPT-0037',
    om: 'Uwimana A.',
    shift: '16:00–00:00',
    submitted: '2 days ago',
    incidents: 35,
    avgResponse: '7.0m',
    status: 'REVIEWED',
    notes: 'High volume night shift. Mutual aid not required.',
    metrics: { incidents: 35, avgResponse: '7.0m', coverage: '91%', aiRate: '87%' },
    significantIncidents: [
      { id: 'INC-2392', type: 'Security/Theft', severity: 'MEDIUM', outcome: 'Resolved — Nyamirambo' },
    ],
  },
  {
    id: 'RPT-0036',
    om: 'Kagame R.',
    shift: '08:00–16:00',
    submitted: '3 days ago',
    incidents: 26,
    avgResponse: '7.5m',
    status: 'REVIEWED',
    notes: 'Stable operations across Nyarugenge Centre and Muhima.',
    metrics: { incidents: 26, avgResponse: '7.5m', coverage: '90%', aiRate: '85%' },
    significantIncidents: [],
  },
  {
    id: 'RPT-0035',
    om: 'Nkurunziza J.',
    shift: '00:00–08:00',
    submitted: '3 days ago',
    incidents: 22,
    avgResponse: '7.8m',
    status: 'PENDING REVIEW',
    notes: 'Pending DC acknowledgment — overnight staffing adequate.',
    metrics: { incidents: 22, avgResponse: '7.8m', coverage: '88%', aiRate: '82%' },
    significantIncidents: [],
  },
  {
    id: 'RPT-0034',
    om: 'Uwimana A.',
    shift: '16:00–00:00',
    submitted: '4 days ago',
    incidents: 29,
    avgResponse: '7.2m',
    status: 'REVIEWED',
    notes: 'Weekend surge handled with standard roster.',
    metrics: { incidents: 29, avgResponse: '7.2m', coverage: '91%', aiRate: '86%' },
    significantIncidents: [],
  },
]

export const DC_DASHBOARD_REPORTS = DC_SHIFT_REPORTS.slice(0, 5)

export const DC_UNITS = [
  { id: 'P-03', type: 'Police Van', incidents: 124, avgResponse: '6.8m', aiRate: 91, score: 94, status: 'ACTIVE', note: '' },
  { id: 'P-07', type: 'Police Van', incidents: 98, avgResponse: '8.2m', aiRate: 78, score: 76, status: 'ACTIVE', note: '' },
  { id: 'P-12', type: 'Motorcycle', incidents: 201, avgResponse: '5.1m', aiRate: 94, score: 97, status: 'ACTIVE', note: '' },
  { id: 'AMB-04', type: 'Ambulance', incidents: 87, avgResponse: '7.9m', aiRate: 88, score: 82, status: 'ACTIVE', note: '' },
  { id: 'FTK-02', type: 'Fire Unit', incidents: 34, avgResponse: '9.1m', aiRate: 72, score: 71, status: 'ACTIVE', note: '' },
  { id: 'P-19', type: 'Police Van', incidents: 112, avgResponse: '7.3m', aiRate: 85, score: 88, status: 'ACTIVE', note: '' },
  { id: 'P-22', type: 'Motorcycle', incidents: 178, avgResponse: '5.8m', aiRate: 90, score: 91, status: 'MAINTENANCE', note: 'Scheduled service — Kimisagara depot' },
  { id: 'AMB-09', type: 'Ambulance', incidents: 61, avgResponse: '11.4m', aiRate: 61, score: 58, status: 'ACTIVE', note: '' },
]

export const DC_COVERAGE_SECTORS = [
  { name: 'Nyamirambo', coverage: 92, lat: -1.9659, lng: 30.0444, radius: 900 },
  { name: 'Muhima', coverage: 74, lat: -1.948, lng: 30.055, radius: 800 },
  { name: 'Biryogo', coverage: 58, lat: -1.968, lng: 30.042, radius: 750 },
  { name: 'Nyarugenge Centre', coverage: 88, lat: -1.952, lng: 30.0588, radius: 850 },
  { name: 'Kimisagara', coverage: 71, lat: -1.972, lng: 30.052, radius: 800 },
]

export const DC_COVERAGE_RECOMMENDATIONS = [
  {
    id: 'CR-01',
    text: 'Deploy P-03 to Biryogo Standby Point A',
    impact: 'Projected coverage: 58% → 79% in Biryogo',
    source: 'Generated by Coverage Watcher · Confidence: 88%',
    approved: false,
  },
  {
    id: 'CR-02',
    text: 'Shift AMB-04 to Muhima Junction overnight',
    impact: 'Projected coverage: 74% → 86% in Muhima',
    source: 'Generated by Coverage Watcher · Confidence: 81%',
    approved: false,
  },
  {
    id: 'CR-03',
    text: 'Add motorcycle patrol loop — Kimisagara',
    impact: 'Projected coverage: 71% → 83% in Kimisagara',
    source: 'Generated by Coverage Watcher · Confidence: 76%',
    approved: false,
  },
]

export const DC_RESOURCE_REQUESTS = [
  {
    id: 'REQ-0018',
    unitType: 'Police Van',
    qty: 2,
    submitted: 'May 10',
    status: 'APPROVED',
    detail: 'Approved May 12 · Units arrive May 18',
  },
  {
    id: 'REQ-0017',
    unitType: 'Ambulance',
    qty: 1,
    submitted: 'May 22',
    status: 'PENDING',
    detail: 'Under review at HQ — 4 days pending',
  },
  {
    id: 'REQ-0016',
    unitType: 'Fire Unit',
    qty: 3,
    submitted: 'Apr 28',
    status: 'DECLINED',
    detail: 'Declined May 2 · Reason: Budget cycle',
  },
]

export const DC_INCIDENT_TYPES = [
  { type: 'Medical Emergency', count: 89, avgResponse: '6.2m', resolution: '97%' },
  { type: 'Road Traffic Accident', count: 74, avgResponse: '7.8m', resolution: '94%' },
  { type: 'Security/Theft', count: 61, avgResponse: '8.4m', resolution: '91%' },
  { type: 'Domestic', count: 48, avgResponse: '9.1m', resolution: '88%' },
  { type: 'Fire', count: 12, avgResponse: '10.3m', resolution: '100%' },
]

export const DC_SIGNIFICANT_EVENTS = [
  { date: 'May 18', text: 'Multi-vehicle collision on KN 4 Ave — 3 units, no fatalities.' },
  { date: 'May 12', text: 'Structure fire in Nyamirambo market area — escalated to OM command.' },
  { date: 'May 3', text: 'Civil disturbance near Biryogo — resolved within 45 minutes.' },
]

export const DC_REPORT_ARCHIVE = [
  { period: 'Apr 2026', submitted: 'May 2, 2026', status: 'SUBMITTED' },
  { period: 'Mar 2026', submitted: 'Apr 1, 2026', status: 'SUBMITTED' },
  { period: 'Feb 2026', submitted: 'Mar 3, 2026', status: 'SUBMITTED' },
  { period: 'Jan 2026', submitted: 'Feb 2, 2026', status: 'SUBMITTED' },
  { period: 'Dec 2025', submitted: 'Jan 3, 2026', status: 'SUBMITTED' },
  { period: 'Nov 2025', submitted: 'Dec 2, 2025', status: 'SUBMITTED' },
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
  if (score >= 90) {
    return { background: 'var(--status-low-bg)', color: 'var(--status-low)' }
  }
  if (score >= 70) {
    return { background: 'var(--status-medium-bg)', color: 'var(--status-medium)' }
  }
  return { background: 'var(--status-critical-bg)', color: 'var(--status-critical)' }
}

export function getRequestBorderColor(status) {
  if (status === 'APPROVED') return 'var(--status-low)'
  if (status === 'PENDING') return 'var(--status-medium)'
  return 'var(--status-critical)'
}

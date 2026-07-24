// PARTIAL INTEGRATION: listReports(), generateReport(), listUnitPerformance(), listDataQuality(), listResourceRequests() wired via src/api/reporting.js.
/** Analyst role — mock intelligence & reporting data. */

export const ANALYST_ALERT_BADGE = 3
export const ANALYST_MODEL_ATTENTION = true

export const ANALYST_RWANDA_DISTRICTS = [
  'Bugesera', 'Burera', 'Gakenke', 'Gasabo', 'Gatsibo', 'Gicumbi', 'Huye', 'Kamonyi',
  'Karongi', 'Kayonza', 'Kicukiro', 'Kirehe', 'Muhanga', 'Musanze', 'Ngoma', 'Nyabihu',
  'Nyagatare', 'Nyamagabe', 'Nyanza', 'Nyamasheke', 'Ngororero', 'Nyaruguru', 'Nyarugenge',
  'Rubavu', 'Ruhango', 'Rulindo', 'Rusizi', 'Rutsiro', 'Rwamagana', 'Gisagara',
]

export const ANALYST_DATA_SOURCES = [
  {
    source_name: 'Incident Database',
    status: 'HEALTHY',
    completeness_pct: 99,
    last_updated_at: '30s ago',
    border: 'var(--status-low)',
  },
  {
    source_name: 'GPS Fleet Tracker',
    status: 'HEALTHY',
    completeness_pct: 97,
    last_updated_at: '45s ago',
    border: 'var(--status-low)',
  },
  {
    source_name: 'Rwanda Meteo',
    status: 'DEGRADED',
    completeness_pct: 71,
    last_updated_at: '18m ago',
    border: 'var(--status-medium)',
    warning: 'Partial outage — 3 weather stations offline',
  },
  {
    source_name: 'KCC Traffic Data',
    status: 'HEALTHY',
    completeness_pct: 94,
    last_updated_at: '2m ago',
    border: 'var(--status-low)',
  },
  {
    source_name: 'RURA Hospital',
    status: 'HEALTHY',
    completeness_pct: 100,
    last_updated_at: '5m ago',
    border: 'var(--status-low)',
  },
]

export const ANALYST_ANOMALIES = [
  {
    severity: 'HIGH',
    alert_type: 'INCIDENT SPIKE',
    created_at: '2h ago',
    description: 'Robbery incidents in Remera sector up 40% — last 3 days vs 30-day avg',
    detail: 'Gasabo District · ±3.2σ deviation',
    deviation_sigma: '±3.2σ',
    link: '/analyst/patterns',
  },
  {
    severity: 'MEDIUM',
    alert_type: 'DISPATCHER BEHAVIOR',
    created_at: '5h ago',
    description: 'Dispatcher Aline M. override rate tripled this week (18% → 54%)',
    detail: 'System-wide · ±2.8σ deviation',
    deviation_sigma: '±2.8σ',
    link: '/analyst/models',
  },
  {
    severity: 'MEDIUM',
    alert_type: 'UNIT PERFORMANCE',
    created_at: '8h ago',
    description: 'Unit P-07 avg response time increased 3.1 minutes with no assignment change',
    detail: 'Nyarugenge · ±2.4σ deviation',
    deviation_sigma: '±2.4σ',
    link: '/analyst/benchmarking',
  },
  {
    severity: 'LOW',
    alert_type: 'MODEL DRIFT',
    created_at: '14h ago',
    description: 'Dispatch model accuracy trending down — 91% → 86% over 14 days',
    detail: 'AI System · Approaching threshold',
    deviation_sigma: '±1.9σ',
    link: '/analyst/models',
  },
]

/** May 2026 calendar markers (day of month) */
export const ANALYST_CALENDAR_MARKS = {
  delivered: [5, 12, 19, 26],
  dueToday: [28],
  overdue: [7],
  dueFuture: [31],
}

export const ANALYST_HEATMAP_ZONES = [
  { name: 'Kimironko', lat: -1.939, lng: 30.122, level: 'hot' },
  { name: 'Nyamirambo', lat: -1.974, lng: 30.042, level: 'hot' },
  { name: 'Kicukiro', lat: -1.989, lng: 30.108, level: 'medium' },
  { name: 'Remera', lat: -1.958, lng: 30.104, level: 'medium' },
  { name: 'Muhima', lat: -1.944, lng: 30.058, level: 'medium' },
  { name: 'Gasabo', lat: -1.928, lng: 30.095, level: 'cool' },
  { name: 'Kanombe', lat: -1.968, lng: 30.135, level: 'cool' },
]

export function analystHeatFill(level) {
  if (level === 'hot') return 'rgba(232,53,74,0.42)'
  if (level === 'medium') return 'rgba(240,120,32,0.28)'
  return 'rgba(61,170,106,0.18)'
}

export const ANALYST_TOP_HOTSPOTS = [
  { rank: 1, zone: 'Kimironko', count: 89, trend: 'up', change: '+34%' },
  { rank: 2, zone: 'Nyamirambo', count: 74, trend: 'up', change: '+21%' },
  { rank: 3, zone: 'Kicukiro', count: 61, trend: 'flat', change: '+2%' },
  { rank: 4, zone: 'Remera', count: 58, trend: 'up', change: '+18%' },
  { rank: 5, zone: 'Muhima', count: 47, trend: 'down', change: '-8%' },
  { rank: 6, zone: 'Biryogo', count: 42, trend: 'up', change: '+12%' },
  { rank: 7, zone: 'Gisozi', count: 38, trend: 'flat', change: '-1%' },
  { rank: 8, zone: 'Kimisagara', count: 31, trend: 'down', change: '-14%' },
]

/**
 * @ui ANALYST_HOUR_DATA, ANALYST_DAY_DATA, ANALYST_WEEK_OF_MONTH, ANALYST_MONTH_DATA
 * Temporal aggregations — not DB columns, computed display values.
 */
export const ANALYST_HOUR_DATA = Array.from({ length: 24 }, (_, h) => ({
  h: String(h),
  n: [2, 3, 4, 5, 8, 12, 18, 22, 20, 14, 10, 16, 20, 18, 12, 10, 14, 18, 24, 28, 22, 16, 10, 6][h],
}))

export const ANALYST_DAY_DATA = [
  { d: 'Mon', n: 42 },
  { d: 'Tue', n: 38 },
  { d: 'Wed', n: 45 },
  { d: 'Thu', n: 41 },
  { d: 'Fri', n: 62 },
  { d: 'Sat', n: 48 },
  { d: 'Sun', n: 35 },
]

export const ANALYST_WEEK_OF_MONTH = [
  { w: 'W1', n: 88 },
  { w: 'W2', n: 94 },
  { w: 'W3', n: 102 },
  { w: 'W4', n: 91 },
]

export const ANALYST_MONTH_DATA = [
  { m: 'Jan', n: 320 }, { m: 'Feb', n: 298 }, { m: 'Mar', n: 410 }, { m: 'Apr', n: 445 },
  { m: 'May', n: 380 }, { m: 'Jun', n: 340 }, { m: 'Jul', n: 310 }, { m: 'Aug', n: 305 },
  { m: 'Sep', n: 330 }, { m: 'Oct', n: 350 }, { m: 'Nov', n: 420 }, { m: 'Dec', n: 390 },
]

/**
 * @ui ANALYST_CORRELATION_MATRIX, ANALYST_CORRELATION_VARS, ANALYST_SCATTER_DATA
 * Model feature importance / correlation display — not DB columns.
 */
export const ANALYST_CORRELATION_VARS = [
  'Rainfall', 'Day of Week', 'Time of Day', 'Market Day', 'School Holiday', 'Unit Count',
]

export const ANALYST_CORRELATION_MATRIX = [
  [1, 0.12, 0.34, 0.08, 0.05, -0.22],
  [0.12, 1, 0.18, 0.41, 0.28, 0.09],
  [0.34, 0.18, 1, 0.22, 0.11, -0.15],
  [0.08, 0.41, 0.22, 1, 0.19, 0.06],
  [0.05, 0.28, 0.11, 0.19, 1, 0.04],
  [-0.22, 0.09, -0.15, 0.06, 0.04, 1],
]

export function correlationCellColor(r) {
  if (r >= 0.7) return { bg: 'var(--accent)', color: 'var(--text-on-accent)' }
  if (r >= 0.4) return { bg: 'var(--accent-ghost)', color: 'var(--accent)' }
  if (r <= -0.7) return { bg: 'var(--status-critical)', color: 'var(--text-on-accent)' }
  if (r <= -0.4) return { bg: 'var(--status-critical-bg)', color: 'var(--status-critical)' }
  return { bg: 'var(--bg-elevated)', color: 'var(--text-secondary)' }
}

export const ANALYST_SCATTER_DATA = Array.from({ length: 24 }, (_, i) => ({
  rain: 2 + i * 3.2,
  incidents: Math.round(8 + i * 2.1 + (i % 3) * 4),
}))

export const ANALYST_AI_MODELS = [
  {
    model_id: 'dispatch',
    name: 'DISPATCH BRAIN',
    status: 'MONITORING',
    statusVariant: 'handover',
    border: 'var(--status-medium)',
    accuracy_pct: 86,
    accuracyColor: 'var(--status-medium)',
    trend: '↓ from 91%',
    training_data_size: '48,291 incidents',
    predictions_today: 847,
    acceptance: '84%',
    drift_pct: 8.2,
    driftLabel: 'Retrain soon',
    retrainDisabled: false,
  },
  {
    model_id: 'prediction',
    name: 'PREDICTION ENGINE',
    status: 'HEALTHY',
    statusVariant: 'resolved',
    border: 'var(--status-low)',
    accuracy_pct: 91,
    accuracyColor: 'var(--status-low)',
    trend: '↑ stable',
    training_data_size: '156,782 records',
    predictions_today: 1204,
    acceptance: '79%',
    drift_pct: 3.1,
    driftLabel: 'Within range',
    retrainDisabled: true,
  },
  {
    model_id: 'coverage',
    name: 'COVERAGE WATCHER',
    status: 'HEALTHY',
    statusVariant: 'resolved',
    border: 'var(--status-low)',
    accuracy_pct: 94,
    accuracyColor: 'var(--status-low)',
    trend: '→ stable',
    training_data_size: '89,440 records',
    predictions_today: 288,
    acceptance: '88%',
    drift_pct: 2.4,
    driftLabel: 'Within range',
    retrainDisabled: true,
  },
]

/**
 * @ui ma7 on ANALYST_DISPATCH_ACCURACY — 7-day moving average, derived display field.
 * @ui pct_change / change_vs_prior — computed display fields, not DB columns.
 */
export const ANALYST_DISPATCH_ACCURACY = Array.from({ length: 30 }, (_, i) => ({
  day: `D${i + 1}`,
  accuracy: Math.max(84, 91 - Math.floor(i * 0.18) - (i % 7 === 3 ? 2 : 0)),
  ma7: Math.max(85, 90 - Math.floor(i * 0.15)),
}))

export const ANALYST_OVERRIDE_ROWS = [
  { override_reason: 'Local area knowledge', count: 41, better: '78%', worse: '22%', rec: 'AI lacks hyperlocal context', highlight: false },
  { override_reason: 'Unit verbal issue', count: 28, better: '91%', worse: '9%', rec: 'System data gap', highlight: false },
  { override_reason: 'Wrong capability matched', count: 19, better: '84%', worse: '16%', rec: 'Model capability mismatch — FIX', highlight: true },
  { override_reason: 'Priority disagreement', count: 34, better: '52%', worse: '48%', rec: 'Human bias — training needed', highlight: false },
  { override_reason: 'Other', count: 12, better: '58%', worse: '42%', rec: 'Investigate individually', highlight: false },
]

export const ANALYST_RETRAIN_LOG = [
  { model: 'Dispatch Brain', date: 'May 14', data: '48K records', duration: '4.2h', change: '+3.1%', positive: true },
  { model: 'Prediction Engine', date: 'May 10', data: '156K records', duration: '8.7h', change: '+1.8%', positive: true },
  { model: 'Coverage Watcher', date: 'Apr 28', data: '89K records', duration: '3.1h', change: '+2.4%', positive: true },
  { model: 'Dispatch Brain', date: 'Apr 15', data: '45K records', duration: '3.9h', change: '+4.2%', positive: true },
  { model: 'Prediction Engine', date: 'Apr 2', data: '148K records', duration: '8.1h', change: '+0.9%', positive: true },
]

export const ANALYST_DQ_TABLE = [
  { source: 'Incident Database', completeness_pct: 99, accuracy_pct: 98, last_updated_at: '30 sec ago', gap_count_30d: 0, status: 'HEALTHY', degraded: false },
  { source: 'GPS Fleet Tracker', completeness_pct: 97, accuracy_pct: 96, last_updated_at: '45 sec', gap_count_30d: 2, status: 'HEALTHY', degraded: false },
  { source: 'Rwanda Meteo Weather', completeness_pct: 71, accuracy_pct: 88, last_updated_at: '18 min ago', gap_count_30d: 8, status: 'DEGRADED', degraded: true, detail: '3 weather stations offline: Musanze, Rubavu, Huye' },
  { source: 'KCC Traffic Data', completeness_pct: 94, accuracy_pct: 93, last_updated_at: '2 min', gap_count_30d: 1, status: 'HEALTHY', degraded: false },
  { source: 'RURA Hospital System', completeness_pct: 100, accuracy_pct: 99, last_updated_at: '5 min', gap_count_30d: 0, status: 'HEALTHY', degraded: false },
]

export const ANALYST_MISSED_FIELDS = [
  { field: 'Suspect description', skip_rate_pct: 31 },
  { field: 'Witness information', skip_rate_pct: 28 },
  { field: 'Vehicle details', skip_rate_pct: 24 },
  { field: 'Agency referral', skip_rate_pct: 19 },
  { field: 'Photo evidence', skip_rate_pct: 17 },
  { field: 'Recommended follow-up', skip_rate_pct: 12 },
]

export const ANALYST_LOW_UNITS = [
  { vehicle_id: 'AMB-09', officer_name: 'Uwimana B.', report_completion_rate: '68%', missing_fields: 'Witness info, Vehicle details' },
  { vehicle_id: 'P-22', officer_name: 'Nkurunziza K.', report_completion_rate: '71%', missing_fields: 'Suspect description' },
  { vehicle_id: 'FTK-02', officer_name: 'Rugamba A.', report_completion_rate: '76%', missing_fields: 'Photo evidence, Follow-up' },
]

export const ANALYST_BENCHMARK_ROWS = [
  { district: 'Kicukiro', incidents: 312, response: '6.8m', met: true, coverage: '94%', resolution: '97%', ai: '86%', rank: 1 },
  { district: 'Nyarugenge', incidents: 289, response: '7.1m', met: true, coverage: '91%', resolution: '95%', ai: '84%', rank: 2 },
  { district: 'Gasabo', incidents: 341, response: '7.6m', met: true, coverage: '88%', resolution: '93%', ai: '79%', rank: 3 },
  { district: 'Musanze', incidents: 198, response: '8.4m', met: false, coverage: '82%', resolution: '89%', ai: '71%', rank: 7 },
  { district: 'Rubavu', incidents: 167, response: '9.2m', met: false, coverage: '74%', resolution: '84%', ai: '68%', rank: 10 },
]

export const ANALYST_LIBRARY_ROWS = [
  { report_name: 'May Response Time Summary', report_type: 'Response Time', district: 'Kigali City', created_by: 'You', created_at: 'Today 09:14', shared_with: 'All OMs' },
  { report_name: 'District Comparison Q1 2026', report_type: 'Cross-District', district: 'All Rwanda', created_by: 'You', created_at: 'May 20', shared_with: 'HQ + DCs' },
  { report_name: 'Dispatch Model Audit — May', report_type: 'AI Performance', district: 'System', created_by: 'You', created_at: 'May 18', shared_with: 'Ops Managers' },
  { report_name: 'Kicukiro Weekly Summary W21', report_type: 'Incident Analysis', district: 'Kicukiro', created_by: 'Auto-generated', created_at: 'May 26', shared_with: 'Kicukiro DC' },
  { report_name: 'Nyarugenge Theft Pattern Q2', report_type: 'Incident Analysis', district: 'Nyarugenge', created_by: 'You', created_at: 'May 15', shared_with: 'Nyarugenge DC' },
  { report_name: 'Gasabo Coverage Deep Dive', report_type: 'Coverage Analysis', district: 'Gasabo', created_by: 'You', created_at: 'May 12', shared_with: 'Gasabo DC' },
  { report_name: 'Executive Summary April', report_type: 'Executive Summary', district: 'All Rwanda', created_by: 'You', created_at: 'May 1', shared_with: 'RNP HQ' },
  { report_name: 'Unit Performance W20', report_type: 'Unit Performance', district: 'Kigali City', created_by: 'Auto-generated', created_at: 'May 19', shared_with: 'All OMs' },
]

export const ANALYST_SCHEDULES = [
  { name: 'Weekly Kigali Response Time', type: 'Response Time', frequency: 'Every Monday 07:00', next: 'Jun 2 07:00', recipients: 'All Ops Managers', status: 'ACTIVE' },
  { name: 'Monthly District Comparison', type: 'Cross-District', frequency: '1st of month 08:00', next: 'Jun 1 08:00', recipients: 'All DCs + HQ', status: 'ACTIVE' },
  { name: 'Daily AI Model Health', type: 'AI Performance', frequency: 'Daily 06:00', next: 'Tomorrow 06:00', recipients: 'Analyst team', status: 'ACTIVE' },
  { name: 'Quarterly Executive Report', type: 'Executive Summary', frequency: 'Quarterly', next: 'Jul 1 09:00', recipients: 'RNP HQ', status: 'ACTIVE' },
  { name: 'Gasabo Incident Weekly', type: 'Incident Analysis', frequency: 'Every Friday 16:00', next: 'May 30 16:00', recipients: 'Gasabo DC', status: 'PAUSED' },
]

export const ANALYST_REPORT_METRICS = [
  { id: 'avg_rt', label: 'Average response time', default: true },
  { id: 'rt_district', label: 'Response time by district', default: true },
  { id: 'rt_trend', label: 'Response time trend (30 days)', default: true },
  { id: 'within_target', label: '% within 12-min target', default: true },
  { id: 'dispatch_acc', label: 'Dispatch accuracy rate', default: true },
  { id: 'ai_accept', label: 'AI acceptance rate', default: false },
  { id: 'override', label: 'Override rate and outcomes', default: false },
  { id: 'utilization', label: 'Unit utilization %', default: false },
  { id: 'coverage', label: 'Coverage score by zone', default: false },
  { id: 'missed', label: 'Missed call rate', default: false },
  { id: 'volume', label: 'Incident volume by type', default: false },
  { id: 'resolution', label: 'Resolution rate', default: false },
]

export const ANALYST_RESPONSE_TREND = Array.from({ length: 30 }, (_, i) => ({
  day: `D${i + 1}`,
  nyarugenge: 6.5 + Math.sin(i / 4) * 0.8,
  kicukiro: 7 + Math.cos(i / 5) * 0.6,
  gasabo: 7.8 + Math.sin(i / 3) * 0.5,
}))

export const ANALYST_DISTRICT_BREAKDOWN = [
  { district: 'Nyarugenge', avg: '7.1m', target: '88%', count: 289, vs: '-0.4m', improved: true },
  { district: 'Kicukiro', avg: '6.8m', target: '91%', count: 312, vs: '-0.2m', improved: true },
  { district: 'Gasabo', avg: '7.6m', target: '86%', count: 341, vs: '+0.3m', improved: false },
  { district: 'Nyamirambo', avg: '8.2m', target: '82%', count: 198, vs: '+0.6m', improved: false },
  { district: 'Kimironko', avg: '7.4m', target: '85%', count: 224, vs: '→', improved: null },
]

export function barFillByPct(pct) {
  if (pct >= 95) return 'var(--accent)'
  if (pct >= 80) return 'var(--status-medium)'
  return 'var(--status-critical)'
}

export function severityDotColor(severity) {
  if (severity === 'HIGH') return 'var(--status-critical)'
  if (severity === 'MEDIUM') return 'var(--status-medium)'
  return 'var(--accent)'
}

export function sourceStatusVariant(status) {
  if (status === 'HEALTHY') return 'resolved'
  if (status === 'DEGRADED') return 'handover'
  return 'critical'
}

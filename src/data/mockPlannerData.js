// TODO: backend gap — no analytics/hotspot/prediction endpoints in backend.
/**
 * Emergency Planner — mock strategic planning data (Kigali).
 *
 * NOTE: The `events` table (schema Section 3.13.12) is not surfaced in any
 * Planner screen. Adding an events planning screen is feature work, not
 * schema alignment, and is intentionally skipped here.
 */

export const PLANNER_DISTRICT = 'Kigali City'

export const PLANNER_HOTSPOT_BADGE = 3
export const PLANNER_DEPLOYMENT_BADGE = 4

export const PLANNER_PREDICTIONS = [
  {
    zone: 'Kimihurura Sector',
    type: 'High Demand',
    window: '14:00 – 18:00 today',
    confidence: 88,
    action: 'Reposition P-07 to Kimihurura by 13:30',
  },
  {
    zone: 'Nyamirambo',
    type: 'Theft Risk',
    window: '16:00 – 20:00',
    confidence: 79,
    action: 'Increase patrol M-03, M-08 by 15:30',
  },
  {
    zone: 'KN 3 Ave — Traffic Incident Risk',
    type: 'Traffic',
    window: '12:00 – 14:00',
    confidence: 84,
    action: 'Position AMB-04 at Kacyiru junction',
  },
  {
    zone: 'Biryogo',
    type: 'Coverage Gap Risk',
    window: '18:00 – 22:00',
    confidence: 71,
    action: 'P-19 repositioning recommended',
  },
  {
    zone: 'Remera',
    type: 'Public Gathering',
    window: '09:00 – 17:00',
    confidence: 92,
    action: 'Double motorcycle patrol by 08:45',
  },
]

export const PLANNER_APPROVALS = [
  {
    id: 'PLN-0041',
    plan_name: 'Friday PM Kimihurura Surge',
    status: 'PENDING',
    submitted_to: 'Kagame R. (Ops Manager)',
    ago: '2h ago',
    /** @ui derived from created_at — not a DB column */
    pending_hours: 2,
  },
  {
    id: 'PLN-0039',
    plan_name: 'Wednesday AM Coverage Fix',
    status: 'APPROVED',
    submitted_to: 'Kagame R. (Ops Manager)',
    ago: '1d ago',
  },
  {
    id: 'PLN-0038',
    plan_name: 'Overnight Nyamirambo Plan',
    status: 'REJECTED',
    submitted_to: 'Kagame R. (Ops Manager)',
    ago: '2d ago',
    rejection_reason: 'Insufficient units available',
  },
  {
    id: 'PLN-0035',
    plan_name: 'Weekend Market Day Gasabo',
    status: 'PENDING',
    submitted_to: 'Kagame R. (Ops Manager)',
    ago: '6h ago',
    /** @ui derived from created_at — not a DB column */
    pending_hours: 6,
  },
]

/**
 * Heatmap zones — UI-only aggregates derived from incidents table.
 * @ui density, topType, count — not DB columns, computed display values
 */
export const PLANNER_HEATMAP_ZONES = [
  { name: 'Kimironko', lat: -1.944, lng: 30.062, count: 47, topType: 'Theft', density: 'high' },
  { name: 'Nyamirambo', lat: -1.974, lng: 30.041, count: 38, topType: 'Theft', density: 'high' },
  { name: 'Kicukiro', lat: -1.969, lng: 30.123, count: 29, topType: 'Traffic', density: 'medium' },
  { name: 'Remera', lat: -1.959, lng: 30.104, count: 24, topType: 'Domestic', density: 'medium' },
  { name: 'Gasabo', lat: -1.928, lng: 30.104, count: 18, topType: 'Medical', density: 'low' },
  { name: 'Kanombe', lat: -1.968, lng: 30.139, count: 12, topType: 'Traffic', density: 'low' },
]

export const PLANNER_HOUR_DATA = [
  { hour: '0', n: 2 }, { hour: '1', n: 1 }, { hour: '2', n: 1 }, { hour: '3', n: 2 },
  { hour: '4', n: 3 }, { hour: '5', n: 4 }, { hour: '6', n: 8 }, { hour: '7', n: 14 },
  { hour: '8', n: 18 }, { hour: '9', n: 12 }, { hour: '10', n: 10 }, { hour: '11', n: 11 },
  { hour: '12', n: 16 }, { hour: '13', n: 14 }, { hour: '14', n: 15 }, { hour: '15', n: 12 },
  { hour: '16', n: 13 }, { hour: '17', n: 11 }, { hour: '18', n: 17 }, { hour: '19', n: 19 },
  { hour: '20', n: 18 }, { hour: '21', n: 14 }, { hour: '22', n: 10 }, { hour: '23', n: 5 },
]

export const PLANNER_DAY_DATA = [
  { day: 'Mon', n: 42 }, { day: 'Tue', n: 38 }, { day: 'Wed', n: 45 },
  { day: 'Thu', n: 41 }, { day: 'Fri', n: 58 }, { day: 'Sat', n: 48 }, { day: 'Sun', n: 35 },
]

export const PLANNER_MONTH_DATA = [
  { month: 'Jan', n: 180 }, { month: 'Feb', n: 165 }, { month: 'Mar', n: 210 },
  { month: 'Apr', n: 225 }, { month: 'May', n: 198 }, { month: 'Jun', n: 175 },
  { month: 'Jul', n: 168 }, { month: 'Aug', n: 172 }, { month: 'Sep', n: 185 },
  { month: 'Oct', n: 190 }, { month: 'Nov', n: 215 }, { month: 'Dec', n: 188 },
]

/**
 * Emerging hotspots — UI-only aggregates.
 * @ui increase, count, topType — not DB columns, computed display values
 */
export const PLANNER_EMERGING_HOTSPOTS = [
  { zone: 'Kimironko', increase: 34, count: 47, topType: 'Theft', severity: 'critical' },
  { zone: 'Biryogo', increase: 21, count: 31, topType: 'Theft', severity: 'medium' },
  { zone: 'Nyabugogo', increase: 18, count: 28, topType: 'Robbery', severity: 'medium' },
  { zone: 'Gikondo', increase: 12, count: 19, topType: 'Traffic', severity: 'accent' },
]

export const PLANNER_COVERAGE_SECTORS = [
  { name: 'Kimironko', lat: -1.944, lng: 30.062, coverage: 91 },
  { name: 'Kicukiro', lat: -1.969, lng: 30.123, coverage: 87 },
  { name: 'Nyamirambo', lat: -1.974, lng: 30.041, coverage: 74 },
  { name: 'Biryogo', lat: -1.978, lng: 30.055, coverage: 58 },
  { name: 'Remera', lat: -1.959, lng: 30.104, coverage: 83 },
  { name: 'Gisozi', lat: -1.936, lng: 30.072, coverage: 62 },
]

export const PLANNER_COVERAGE_GAPS = [
  { zone: 'Biryogo', coverage: 58, incidents: 31, unit: 'P-19', distance: '2.1km', rec: 'Deploy P-19 to Biryogo Standby A' },
  { zone: 'Gisozi', coverage: 62, incidents: 24, unit: 'M-06', distance: '1.8km', rec: 'Add motorcycle patrol' },
  { zone: 'Nyabugogo', coverage: 67, incidents: 28, unit: 'P-03', distance: '4.5km', rec: 'Reposition P-03' },
  { zone: 'Kimisagara', coverage: 71, incidents: 19, unit: 'P-12', distance: '2.9km', rec: 'Shift P-12 earlier' },
  { zone: 'Gikondo', coverage: 74, incidents: 22, unit: 'AMB-02', distance: '3.1km', rec: 'Reposition AMB-02' },
]

/**
 * @ui PLANNER_COVERAGE_TREND — display-only aggregation, not a DB column.
 */
export const PLANNER_COVERAGE_TREND = [
  { week: 'W1', overall: 91, gasabo: 89, nyarugenge: 88, kicukiro: 90 },
  { week: 'W2', overall: 90, gasabo: 88, nyarugenge: 87, kicukiro: 89 },
  { week: 'W3', overall: 90, gasabo: 87, nyarugenge: 86, kicukiro: 88 },
  { week: 'W4', overall: 89, gasabo: 86, nyarugenge: 85, kicukiro: 87 },
  { week: 'W5', overall: 89, gasabo: 85, nyarugenge: 84, kicukiro: 86 },
  { week: 'W6', overall: 88, gasabo: 84, nyarugenge: 83, kicukiro: 85 },
  { week: 'W7', overall: 88, gasabo: 83, nyarugenge: 82, kicukiro: 84 },
  { week: 'W8', overall: 88, gasabo: 82, nyarugenge: 81, kicukiro: 83 },
  { week: 'W9', overall: 87, gasabo: 81, nyarugenge: 80, kicukiro: 82 },
  { week: 'W10', overall: 87, gasabo: 80, nyarugenge: 79, kicukiro: 81 },
  { week: 'W11', overall: 88, gasabo: 81, nyarugenge: 80, kicukiro: 82 },
  { week: 'W12', overall: 88, gasabo: 82, nyarugenge: 81, kicukiro: 83 },
]

/**
 * @ui PLANNER_HOURLY_COVERAGE — display-only aggregation, not a DB column.
 */
export const PLANNER_HOURLY_COVERAGE = Array.from({ length: 24 }, (_, h) => ({
  hour: String(h),
  pct: h >= 2 && h <= 5 ? 72 + (h % 3) : h >= 18 && h <= 22 ? 78 + (h % 4) : 85 + (h % 8),
}))

/**
 * Default positioning instructions (maps to positioning_instructions table).
 * Schema fields: vehicle_id, from_location, to_location, move_time
 */
export const PLANNER_DEFAULT_INSTRUCTIONS = [
  { vehicle_id: 'P-07', from_location: 'Kicukiro Depot', to_location: 'Kimihurura Standby B', move_time: '13:30' },
  { vehicle_id: 'M-01', from_location: 'Remera Station', to_location: 'Biryogo Checkpoint', move_time: '13:00' },
]

/**
 * Deployment plans library (maps to deployment_plans table).
 * Schema fields: plan_id (id), plan_name, district, active_from, active_until, status
 */
export const PLANNER_PLANS = [
  { id: 'PLN-0041', plan_name: 'Friday PM Kimihurura Surge', district: 'Kigali', active_from: 'May 30 14:00', active_until: 'May 30 20:00', status: 'PENDING' },
  { id: 'PLN-0039', plan_name: 'Wed AM Coverage Fix', district: 'Nyarugenge', active_from: 'May 28 08:00', active_until: 'May 28 12:00', status: 'APPROVED' },
  { id: 'PLN-0038', plan_name: 'Overnight Nyamirambo Plan', district: 'Kigali', active_from: 'May 27 22:00', active_until: 'May 28 06:00', status: 'REJECTED' },
  { id: 'PLN-0035', plan_name: 'Weekend Market Gasabo', district: 'Gasabo', active_from: 'Jun 1 08:00', active_until: 'Jun 1 18:00', status: 'PENDING' },
  { id: 'PLN-0031', plan_name: 'Independence Day Plan', district: 'All Districts', active_from: 'Jul 4 00:00', active_until: 'Jul 4 23:59', status: 'DRAFT' },
]

/**
 * Response zones (maps to predictions table).
 * Schema fields: zone, lat, lng, predicted_response_time, assigned_unit_id, distance, route, confidence_pct
 */
export const PLANNER_RESPONSE_ZONES = [
  { zone: 'Kimironko', lat: -1.944, lng: 30.062, predicted_response_time: 4.2, assigned_unit_id: 'P-07', distance: '1.2km', route: 'KG 7 Ave', confidence_pct: 91 },
  { zone: 'Kicukiro', lat: -1.969, lng: 30.123, predicted_response_time: 6.8, assigned_unit_id: 'P-12', distance: '2.4km', route: 'KK 15 Ave', confidence_pct: 86 },
  { zone: 'Nyamirambo', lat: -1.974, lng: 30.041, predicted_response_time: 7.1, assigned_unit_id: 'M-03', distance: '2.8km', route: 'KN 3 Ave', confidence_pct: 84 },
  { zone: 'Biryogo', lat: -1.978, lng: 30.055, predicted_response_time: 11.4, assigned_unit_id: 'P-19', distance: '3.2km', route: 'KN 9 Ave via Muhanga', confidence_pct: 84 },
  { zone: 'Gisozi', lat: -1.936, lng: 30.072, predicted_response_time: 13.2, assigned_unit_id: 'P-19', distance: '4.1km', route: 'KG 11 Ave', confidence_pct: 78 },
  { zone: 'Remera', lat: -1.959, lng: 30.104, predicted_response_time: 5.9, assigned_unit_id: 'M-01', distance: '1.9km', route: 'KN 3 Rd', confidence_pct: 88 },
  { zone: 'Kanombe', lat: -1.968, lng: 30.139, predicted_response_time: 9.8, assigned_unit_id: 'AMB-04', distance: '3.5km', route: 'KK 3 Ave', confidence_pct: 82 },
]

/**
 * @ui PLANNER_PREDICTION_FACTORS — model factor weights, display only, not a DB column.
 */
export const PLANNER_PREDICTION_FACTORS = [
  { icon: 'route', label: 'Distance to nearest unit', impact: 40 },
  { icon: 'traffic', label: 'Current traffic', impact: 25 },
  { icon: 'clock', label: 'Time of day pattern', impact: 20 },
  { icon: 'rain', label: 'Weather conditions', impact: 10 },
  { icon: 'users', label: 'Unit availability', impact: 5 },
]

export const PLANNER_PREDICTED_VS_ACTUAL = [
  { day: 'Mon', predicted: 11.2, actual: 10.8 },
  { day: 'Tue', predicted: 10.5, actual: 11.1 },
  { day: 'Wed', predicted: 11.8, actual: 12.2 },
  { day: 'Thu', predicted: 10.9, actual: 10.4 },
  { day: 'Fri', predicted: 12.1, actual: 11.6 },
  { day: 'Sat', predicted: 11.4, actual: 11.9 },
  { day: 'Sun', predicted: 10.2, actual: 9.8 },
]

export const PLANNER_RECOMMENDATIONS = [
  { id: 'REC-041', type: 'Deployment Plan', status: 'Implemented', content: 'Reposition P-07 to Kimihurura before Friday PM surge', outcome: 'Coverage: +8% in zone', created_at: 'Submitted May 24' },
  { id: 'REC-038', type: 'Coverage Fix', status: 'Pending', content: 'Overnight motorcycle patrol in Gisozi sector', created_at: 'Submitted May 26' },
  { id: 'REC-035', type: 'Resource Request', status: 'Rejected', content: 'Additional ambulance staging at Nyabugogo', rejection_reason: 'Insufficient units', created_at: 'Submitted May 22' },
  { id: 'REC-032', type: 'Deployment Plan', status: 'Implemented', content: 'AMB-04 pre-position at Kacyiru junction', outcome: 'Response: −2.1m avg', created_at: 'Submitted May 20' },
  { id: 'REC-028', type: 'Coverage Fix', status: 'Pending', content: 'Shift P-12 start time 30 min earlier weekdays', created_at: 'Submitted May 18' },
  { id: 'REC-025', type: 'Deployment Plan', status: 'Implemented', content: 'Weekend market day Gasabo patrol increase', outcome: 'Incidents: −12%', created_at: 'Submitted May 15' },
]

/**
 * @ui PLANNER_AI_INSIGHTS — AI-generated display strings, not a DB column.
 */
export const PLANNER_AI_INSIGHTS = [
  { type: 'EMERGING TREND', icon: 'trend', text: 'Friday incident volume has increased 18% month-over-month for 6 consecutive weeks in Kicukiro.', ago: 'Detected 2h ago' },
  { type: 'COVERAGE CONCERN', icon: 'alert', text: 'Gisozi sector coverage has declined below 65% for 3 consecutive days. Deployment plan recommended.', ago: 'Detected 6h ago' },
  { type: 'MODEL UPDATE', icon: 'cpu', text: "Prediction model accuracy improved to 91% after last night's retraining on March–April incident data.", ago: 'Detected 14h ago' },
  { type: 'EMERGING TREND', icon: 'trend', text: 'Rainy season correlation with traffic incidents in Nyarugenge now at 0.81 — highest in 12 months.', ago: 'Detected 1d ago' },
]

/**
 * Saved simulation scenarios (maps to simulations table).
 * Schema fields: scenario_type, created_at, result_summary
 */
export const PLANNER_SAVED_SCENARIOS = [
  { name: 'Amahoro Stadium', scenario_type: 'Public Gathering', created_at: 'May 26', result_summary: 'Insufficient' },
  { name: 'Independence Day 2026', scenario_type: 'Public Gathering', created_at: 'May 20', result_summary: 'Sufficient' },
  { name: 'Flash Flood Nyamirambo', scenario_type: 'Flood', created_at: 'May 15', result_summary: 'Critical gaps' },
  { name: 'Kigali Marathon', scenario_type: 'Public Gathering', created_at: 'May 10', result_summary: 'Borderline' },
  { name: 'Power Outage Gasabo', scenario_type: 'Outage', created_at: 'May 5', result_summary: 'Insufficient' },
]

export const RWANDA_DISTRICTS = ['All Districts', 'Kigali', 'Nyarugenge', 'Kicukiro', 'Gasabo', 'Bugesera', 'Rwamagana']

export function confidenceBadge(conf) {
  if (conf >= 85) return { bg: 'var(--status-low-bg)', color: 'var(--status-low)' }
  if (conf >= 70) return { bg: 'var(--accent-ghost)', color: 'var(--accent)' }
  return { bg: 'var(--status-medium-bg)', color: 'var(--status-medium)' }
}

export function coverageColor(pct) {
  if (pct >= 85) return 'var(--status-low)'
  if (pct >= 65) return 'var(--status-medium)'
  return 'var(--status-critical)'
}

export function responseTimeColor(min) {
  if (min < 5) return 'var(--status-low)'
  if (min <= 8) return 'var(--accent)'
  if (min <= 12) return 'var(--status-medium)'
  return 'var(--status-critical)'
}

export function heatmapFill(density) {
  if (density === 'high') return 'rgba(232,53,74,0.4)'
  if (density === 'medium') return 'rgba(240,120,32,0.3)'
  return 'rgba(61,170,106,0.2)'
}

export function planStatusVariant(status) {
  if (status === 'APPROVED') return 'resolved'
  if (status === 'REJECTED') return 'critical'
  if (status === 'PENDING') return 'handover'
  return 'info'
}

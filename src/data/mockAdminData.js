/** Super Admin — mock system administration data. */

export const ADMIN_HEALTH_ALERTS = 1
export const ADMIN_PENDING_INVITES = 3
export const ADMIN_INTEGRATION_DOWN = true
export const ADMIN_SECURITY_ALERTS = 2

export const ADMIN_SYSTEM_STATUS = [
  { name: 'Application Server', status: 'OPERATIONAL', color: 'var(--status-low)', pulse: true },
  { name: 'Database', status: 'OPERATIONAL', color: 'var(--status-low)', pulse: true },
  { name: 'AI Engine', status: 'OPERATIONAL', color: 'var(--status-low)', pulse: true },
  { name: 'External Integrations', status: 'DEGRADED', color: 'var(--status-medium)', pulse: false },
  { name: 'Authentication', status: 'OPERATIONAL', color: 'var(--status-low)', pulse: true },
]

export const ADMIN_INTEGRATIONS_HEALTH = [
  { name: 'Incident Database', status: 'OPERATIONAL', sync: '30s ago', ms: '142ms', border: 'var(--status-low)' },
  { name: 'GPS Fleet Tracker', status: 'OPERATIONAL', sync: '45s ago', ms: '89ms', border: 'var(--status-low)' },
  {
    name: 'Rwanda Meteo Weather',
    status: 'DEGRADED',
    sync: '18m ago',
    ms: 'Timeout errors',
    border: 'var(--status-medium)',
    error: '3 stations unreachable — partial data only',
  },
  { name: 'KCC Traffic Data', status: 'OPERATIONAL', sync: '2m', ms: '201ms', border: 'var(--status-low)' },
  { name: 'RURA Hospital System', status: 'OPERATIONAL', sync: '5m', ms: '334ms', border: 'var(--status-low)' },
]

export const ADMIN_ACTIVITY_LOG = [
  { level: 'INFO', action: 'User Jean Bosco logged in', user: 'Dispatcher · Auth', time: '14:31' },
  { level: 'SUCCESS', action: 'Incident INC-2403 dispatched', user: 'Dispatcher: Bosco · Dispatch', time: '14:28' },
  { level: 'SUCCESS', action: 'AI recommendation approved', user: 'OM: Kagame R. · AI Engine', time: '14:26' },
  { level: 'WARNING', action: 'Failed login attempt (3rd)', user: 'Unknown · Auth · IP: 41.222.xxx.xxx', time: '14:24' },
  { level: 'SUCCESS', action: 'Shift report RPT-0041 submitted', user: 'OM: Uwimana A. · Reports', time: '14:18' },
  { level: 'INFO', action: 'Hotspot prediction model refreshed', user: 'System · AI Engine', time: '14:00' },
  { level: 'SUCCESS', action: 'New user invited: Mutoni A.', user: 'Super Admin · User Mgmt', time: '13:45' },
  { level: 'SUCCESS', action: 'Daily backup completed', user: 'System · Backup · 2.4GB', time: '13:00' },
  { level: 'WARNING', action: 'Rwanda Meteo API timeout', user: 'System · Integrations', time: '12:48' },
  { level: 'SUCCESS', action: 'AI model retrained: Dispatch', user: 'Analyst · AI Engine', time: '11:30' },
  { level: 'FAILED', action: 'Failed login (account locked)', user: 'Mugisha K. · Auth · IP: 197.243.xxx.xxx', time: '10:12' },
  { level: 'SUCCESS', action: 'Coverage Watcher recalculated', user: 'System · AI Engine', time: '10:00' },
  { level: 'SUCCESS', action: 'User Rugamba suspended', user: 'Super Admin · User Mgmt', time: '09:44' },
  { level: 'INFO', action: 'System startup complete', user: 'System · Core', time: '08:00' },
  { level: 'SUCCESS', action: 'Weekly backup completed', user: 'System · Backup · 18.7GB', time: '03:00' },
]

export const ADMIN_SCHEDULED_JOBS = [
  { name: 'Geocoding Engine', status: 'COMPLETED', last: 'Today 14:00', next: 'Today 15:00' },
  { name: 'Travel Time Matrix', status: 'COMPLETED', last: 'Today 13:30', next: 'Today 14:30' },
  { name: 'Incident Clustering', status: 'COMPLETED', last: 'Today 14:00', next: 'Today 15:00' },
  { name: 'Hotspot Prediction Refresh', status: 'COMPLETED', last: 'Today 14:00', next: 'Today 18:00' },
  { name: 'Daily Backup', status: 'COMPLETED', last: 'Today 13:00', next: 'Tomorrow 13:00' },
  { name: 'Audit Log Archive', status: 'SCHEDULED', last: 'May 25', next: 'Jun 1' },
]

export const ADMIN_USERS = [
  { name: 'Jean Bosco Nkurunziza', email: 'j.bosco@rnp.gov.rw', initials: 'JB', role: 'dispatcher', district: 'Nyarugenge', status: 'ACTIVE', lastLogin: 'Today 14:31', session: 'ONLINE', mfa: true },
  { name: 'Kagame R.', email: 'k.rwabukwende@rnp.gov.rw', initials: 'KR', role: 'ops_manager', district: 'Nyarugenge', status: 'ACTIVE', lastLogin: 'Today 14:26', session: 'ONLINE', mfa: true },
  { name: 'Uwimana Aline', email: 'a.uwimana@rnp.gov.rw', initials: 'UA', role: 'district_commander', district: 'Gasabo', status: 'ACTIVE', lastLogin: 'Today 09:14', session: 'OFFLINE', mfa: true },
  { name: 'Mutoni Aline', email: 'm.mutoni@rnp.gov.rw', initials: 'MA', role: 'emergency_planner', district: 'Kigali City', status: 'PENDING', lastLogin: 'Never', session: 'OFFLINE', mfa: false, tint: 'medium' },
  { name: 'Nkurunziza K.', email: 'k.nkurunziza@rnp.gov.rw', initials: 'NK', role: 'field_responder', district: 'Nyarugenge', status: 'ACTIVE', lastLogin: 'Today 08:00', session: 'ONLINE', mfa: true },
  { name: 'Rugamba Andre', email: 'r.rugamba@rnp.gov.rw', initials: 'RA', role: 'analyst', district: 'All Districts', status: 'SUSPENDED', lastLogin: 'May 24', session: 'OFFLINE', mfa: true, tint: 'critical', opacity: 0.5 },
  { name: 'Habimana J.', email: 'j.habimana@rnp.gov.rw', initials: 'HJ', role: 'field_responder', district: 'Kicukiro', status: 'ACTIVE', lastLogin: 'Today 07:45', session: 'ONLINE', mfa: false },
  { name: 'System Admin', email: 'admin@resq.rw', initials: 'SA', role: 'super_admin', district: '—', status: 'ACTIVE', lastLogin: 'Today 08:00', session: 'ONLINE', mfa: true, isSelf: true },
]

export function adminRoleBadge(role) {
  const map = {
    dispatcher: { bg: 'var(--accent-ghost)', color: 'var(--accent)', label: 'DISPATCHER' },
    field_responder: { bg: 'var(--status-info-bg)', color: 'var(--status-info)', label: 'FIELD RESPONDER' },
    ops_manager: { bg: 'var(--status-medium-bg)', color: 'var(--status-medium)', label: 'OPS MANAGER' },
    district_commander: { bg: 'rgba(83,74,183,0.15)', color: '#534AB7', label: 'DISTRICT COMMANDER' },
    emergency_planner: { bg: 'var(--status-low-bg)', color: 'var(--status-low)', label: 'EMERGENCY PLANNER' },
    analyst: { bg: 'rgba(33,150,200,0.15)', color: 'var(--status-info)', label: 'ANALYST' },
    super_admin: { bg: 'var(--status-critical-bg)', color: 'var(--status-critical)', label: 'SUPER ADMIN' },
  }
  return map[role] || { bg: 'var(--bg-elevated)', color: 'var(--text-secondary)', label: role }
}

export function logLevelColor(level) {
  if (level === 'SUCCESS') return 'var(--status-low)'
  if (level === 'FAILED') return 'var(--status-critical)'
  if (level === 'WARNING') return 'var(--status-medium)'
  return 'var(--status-info)'
}

export const ADMIN_INTEGRATION_CARDS = [
  {
    id: 'cad',
    name: 'CAD System Connection',
    status: 'OPERATIONAL',
    endpoint: 'https://cad.rnp.gov.rw/api/v2',
    auth: 'OAuth2',
    frequency: 'Every 1 min',
    lastSync: '45s',
    response: '189ms',
    errorRate: '0.01%',
    mappings: [],
  },
  {
    id: 'gps',
    name: 'GPS Fleet Tracker',
    status: 'OPERATIONAL',
    endpoint: 'https://gps.resq.rw/fleet/v3',
    auth: 'API Key',
    frequency: 'Every 30s',
    lastSync: '30s',
    response: '89ms',
    errorRate: '0.00%',
    mappings: [
      ['vehicle_id', 'unit_id'],
      ['position_lat', 'gps_latitude'],
      ['position_lng', 'gps_longitude'],
      ['speed_kmh', 'unit_speed'],
      ['heading', 'unit_bearing'],
    ],
  },
  {
    id: 'meteo',
    name: 'Rwanda Meteo Weather API',
    status: 'DEGRADED',
    endpoint: 'https://api.meteorwanda.gov.rw',
    auth: 'API Key',
    frequency: 'Every 5 min',
    lastSync: '18m ago',
    response: 'Timeout',
    errorRate: '8.4%',
    errors: [
      '[12:48:03] Timeout after 30s — station METEO-04 unreachable',
      '[11:32:17] HTTP 503 — Service temporarily unavailable',
      '[09:15:44] SSL cert warning — expires in 14 days',
    ],
    mappings: [],
  },
  {
    id: 'traffic',
    name: 'KCC Traffic Data Feed',
    status: 'OPERATIONAL',
    endpoint: 'https://traffic.kcc.gov.rw/v1',
    auth: 'Basic',
    frequency: 'Every 2 min',
    lastSync: '2m',
    response: '201ms',
    errorRate: '0.03%',
    mappings: [],
  },
  {
    id: 'hospital',
    name: 'RURA Hospital Capacity',
    status: 'OPERATIONAL',
    endpoint: 'https://hims.rura.gov.rw/api',
    auth: 'OAuth2',
    frequency: 'Every 10 min',
    lastSync: '5m',
    response: '334ms',
    errorRate: '0.00%',
    mappings: [],
  },
  {
    id: 'sms',
    name: 'SMS Gateway',
    status: 'OPERATIONAL',
    endpoint: 'https://sms.mtn.rw/api/send',
    auth: 'API Key',
    frequency: 'On-demand',
    lastSync: '14:28',
    response: '67ms',
    errorRate: '0.00%',
    mappings: [],
  },
]

export const ADMIN_AUDIT_ROWS = ADMIN_ACTIVITY_LOG.map((e, i) => ({
  ...e,
  timestamp: `2026-05-28 ${e.time}`,
  role: e.user.split('·')[0]?.trim() || 'System',
  module: e.user.split('·')[1]?.trim() || 'System',
  ip: i === 3 ? '41.222.18.44' : i === 10 ? '197.243.88.12' : '197.243.10.22',
  status: e.level === 'FAILED' ? 'FAILED' : e.level === 'WARNING' ? 'WARNING' : 'SUCCESS',
}))

export const ADMIN_SECURITY_EVENTS = [
  { type: 'FAILED LOGIN CLUSTER', desc: '3 failed attempts from 41.222.xxx.xxx', detail: 'Targeting: Dispatcher Bosco J.', time: '14:24 today' },
  { type: 'ACCOUNT LOCKED', desc: 'Mugisha K. locked after 5 failed attempts', detail: 'Kicukiro Dispatcher', time: '10:12 today' },
  { type: 'UNUSUAL LOGIN LOCATION', desc: 'Login from Musanze — user assigned to Kigali', detail: 'User: Habimana J.', time: 'May 26, 22:14' },
  { type: 'CONFIG CHANGE', desc: 'AI model threshold changed', detail: 'By: Super Admin', time: 'May 25, 11:30' },
  { type: 'MFA NOT ENABLED', desc: '2 users without MFA still active', detail: 'Habimana J. · Mutoni A.', time: 'Ongoing' },
]

export const ADMIN_MFA_ROLES = [
  { role: 'Dispatcher', enabled: 8, total: 9 },
  { role: 'Field Responder', enabled: 12, total: 12 },
  { role: 'Ops Manager', enabled: 4, total: 4 },
  { role: 'District Commander', enabled: 5, total: 5 },
  { role: 'Emergency Planner', enabled: 3, total: 4 },
  { role: 'Analyst', enabled: 2, total: 2 },
  { role: 'Super Admin', enabled: 1, total: 1 },
]

export const ADMIN_ACTIVE_SESSIONS = [
  { user: 'Jean Bosco Nkurunziza', role: 'dispatcher', device: 'Chrome · Windows', ip: '197.243.10.22', login: '14:31', activity: '14:32', self: false },
  { user: 'Kagame R.', role: 'ops_manager', device: 'Firefox · macOS', ip: '197.243.10.45', login: '14:20', activity: '14:28', self: false },
  { user: 'Nkurunziza K.', role: 'field_responder', device: 'Mobile App · Android', ip: '41.186.22.88', login: '08:00', activity: '14:15', self: false },
  { user: 'Habimana J.', role: 'field_responder', device: 'Mobile App · iOS', ip: '197.243.11.03', login: '07:45', activity: '12:30', self: false },
  { user: 'Uwimana Aline', role: 'district_commander', device: 'Chrome · Windows', ip: '197.243.10.88', login: '09:14', activity: '09:45', self: false },
  { user: 'Claudine Uwimana', role: 'emergency_planner', device: 'Chrome · Windows', ip: '197.243.10.55', login: '11:00', activity: '13:20', self: false },
  { user: 'Grace Ingabire', role: 'analyst', device: 'Edge · Windows', ip: '197.243.10.60', login: '10:30', activity: '14:00', self: false },
  { user: 'System Admin', role: 'super_admin', device: 'Chrome · Windows', ip: '197.243.10.01', login: '08:00', activity: '14:32', self: true },
]

export const ADMIN_IP_RANGES = [
  { range: '197.243.0.0/16', label: 'RNP Kigali HQ' },
  { range: '41.186.0.0/16', label: 'RNP Regional Offices' },
  { range: '10.0.0.0/8', label: 'Internal VPN' },
]

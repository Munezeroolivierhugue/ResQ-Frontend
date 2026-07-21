// PARTIAL INTEGRATION: audit logs wired via src/api/admin.js. Security events also available.
// TODO: backend gap — ADMIN_HEALTH_ALERTS, ADMIN_SYSTEM_STATUS, ADMIN_INTEGRATIONS_HEALTH have no backend equivalent.
/** Super Admin — mock system administration data. */

export const ADMIN_HEALTH_ALERTS = 1;
export const ADMIN_PENDING_INVITES = 3;
export const ADMIN_INTEGRATION_DOWN = true;
export const ADMIN_SECURITY_ALERTS = 2;

export const ADMIN_SYSTEM_STATUS = [
  {
    name: "Application Server",
    status: "OPERATIONAL",
    color: "var(--status-low)",
    pulse: true,
  },
  {
    name: "Database",
    status: "OPERATIONAL",
    color: "var(--status-low)",
    pulse: true,
  },
  {
    name: "AI Engine",
    status: "OPERATIONAL",
    color: "var(--status-low)",
    pulse: true,
  },
  {
    name: "External Integrations",
    status: "DEGRADED",
    color: "var(--status-medium)",
    pulse: false,
  },
  {
    name: "Authentication",
    status: "OPERATIONAL",
    color: "var(--status-low)",
    pulse: true,
  },
];

export const ADMIN_INTEGRATIONS_HEALTH = [
  {
    name: "Incident Database",
    status: "OPERATIONAL",
    last_sync: "30s ago",
    ms: "142ms",
    border: "var(--status-low)",
  },
  {
    name: "GPS Fleet Tracker",
    status: "OPERATIONAL",
    last_sync: "45s ago",
    ms: "89ms",
    border: "var(--status-low)",
  },
  {
    name: "Rwanda Meteo Weather",
    status: "DEGRADED",
    last_sync: "18m ago",
    ms: "Timeout errors",
    border: "var(--status-medium)",
    error: "3 stations unreachable — partial data only",
  },
  {
    name: "KCC Traffic Data",
    status: "OPERATIONAL",
    last_sync: "2m",
    ms: "201ms",
    border: "var(--status-low)",
  },
  {
    name: "RURA Hospital System",
    status: "OPERATIONAL",
    last_sync: "5m",
    ms: "334ms",
    border: "var(--status-low)",
  },
];

// level renamed to status; values: SUCCESS, ERROR (warnings/timeouts), DENIED (auth failures)
export const ADMIN_ACTIVITY_LOG = [
  {
    status: "SUCCESS",
    action: "User Jean Bosco logged in",
    user: "Dispatcher · Auth",
    time: "14:31",
  },
  {
    status: "SUCCESS",
    action: "Incident INC-2403 dispatched",
    user: "Dispatcher: Bosco · Dispatch",
    time: "14:28",
  },
  {
    status: "SUCCESS",
    action: "AI recommendation approved",
    user: "OM: Kagame R. · AI Engine",
    time: "14:26",
  },
  {
    status: "DENIED",
    action: "Failed login attempt (3rd)",
    user: "Unknown · Auth · IP: 41.222.xxx.xxx",
    time: "14:24",
  },
  {
    status: "SUCCESS",
    action: "Shift report RPT-0041 submitted",
    user: "OM: Uwimana A. · Reports",
    time: "14:18",
  },
  {
    status: "SUCCESS",
    action: "Hotspot prediction model refreshed",
    user: "System · AI Engine",
    time: "14:00",
  },
  {
    status: "SUCCESS",
    action: "New user invited: Mutoni A.",
    user: "Super Admin · User Mgmt",
    time: "13:45",
  },
  {
    status: "SUCCESS",
    action: "Daily backup completed",
    user: "System · Backup · 2.4GB",
    time: "13:00",
  },
  {
    status: "ERROR",
    action: "Rwanda Meteo API timeout",
    user: "System · Integrations",
    time: "12:48",
  },
  {
    status: "SUCCESS",
    action: "AI model retrained: Dispatch",
    user: "Analyst · AI Engine",
    time: "11:30",
  },
  {
    status: "DENIED",
    action: "Failed login (account locked)",
    user: "Mugisha K. · Auth · IP: 197.243.xxx.xxx",
    time: "10:12",
  },
  {
    status: "SUCCESS",
    action: "Coverage Watcher recalculated",
    user: "System · AI Engine",
    time: "10:00",
  },
  {
    status: "SUCCESS",
    action: "User Rugamba suspended",
    user: "Super Admin · User Mgmt",
    time: "09:44",
  },
  {
    status: "SUCCESS",
    action: "System startup complete",
    user: "System · Core",
    time: "08:00",
  },
  {
    status: "SUCCESS",
    action: "Weekly backup completed",
    user: "System · Backup · 18.7GB",
    time: "03:00",
  },
];

export const ADMIN_SCHEDULED_JOBS = [
  {
    name: "Geocoding Engine",
    status: "COMPLETED",
    last: "Today 14:00",
    next: "Today 15:00",
  },
  {
    name: "Travel Time Matrix",
    status: "COMPLETED",
    last: "Today 13:30",
    next: "Today 14:30",
  },
  {
    name: "Incident Clustering",
    status: "COMPLETED",
    last: "Today 14:00",
    next: "Today 15:00",
  },
  {
    name: "Hotspot Prediction Refresh",
    status: "COMPLETED",
    last: "Today 14:00",
    next: "Today 18:00",
  },
  {
    name: "Daily Backup",
    status: "COMPLETED",
    last: "Today 13:00",
    next: "Tomorrow 13:00",
  },
  {
    name: "Audit Log Archive",
    status: "SCHEDULED",
    last: "May 25",
    next: "Jun 1",
  },
];

// user_id added; lastLogin → last_login; mfa → mfa_enabled
export const ADMIN_USERS = [
  {
    user_id: "usr-0001-0000-0000-000000000001",
    name: "Jean Bosco Nkurunziza",
    email: "j.bosco@rnp.gov.rw",
    initials: "JB",
    role: "dispatcher",
    district: "Nyarugenge",
    status: "ACTIVE",
    last_login: "Today 14:31",
    session: "ONLINE",
    mfa_enabled: true,
  },
  {
    user_id: "usr-0002-0000-0000-000000000002",
    name: "Kagame R.",
    email: "k.rwabukwende@rnp.gov.rw",
    initials: "KR",
    role: "OPERATIONS_MANAGER",
    district: "Nyarugenge",
    status: "ACTIVE",
    last_login: "Today 14:26",
    session: "ONLINE",
    mfa_enabled: true,
  },
  {
    user_id: "usr-0003-0000-0000-000000000003",
    name: "Uwimana Aline",
    email: "a.uwimana@rnp.gov.rw",
    initials: "UA",
    role: "district_commander",
    district: "Gasabo",
    status: "ACTIVE",
    last_login: "Today 09:14",
    session: "OFFLINE",
    mfa_enabled: true,
  },
  {
    user_id: "usr-0004-0000-0000-000000000004",
    name: "Mutoni Aline",
    email: "m.mutoni@rnp.gov.rw",
    initials: "MA",
    role: "emergency_planner",
    district: "Kigali City",
    status: "PENDING",
    last_login: "Never",
    session: "OFFLINE",
    mfa_enabled: false,
    tint: "medium",
  },
  {
    user_id: "usr-0005-0000-0000-000000000005",
    name: "Nkurunziza K.",
    email: "k.nkurunziza@rnp.gov.rw",
    initials: "NK",
    role: "field_responder",
    district: "Nyarugenge",
    status: "ACTIVE",
    last_login: "Today 08:00",
    session: "ONLINE",
    mfa_enabled: true,
  },
  {
    user_id: "usr-0006-0000-0000-000000000006",
    name: "Rugamba Andre",
    email: "r.rugamba@rnp.gov.rw",
    initials: "RA",
    role: "analyst",
    district: "All Districts",
    status: "SUSPENDED",
    last_login: "May 24",
    session: "OFFLINE",
    mfa_enabled: true,
    tint: "critical",
    opacity: 0.5,
  },
  {
    user_id: "usr-0007-0000-0000-000000000007",
    name: "Habimana J.",
    email: "j.habimana@rnp.gov.rw",
    initials: "HJ",
    role: "field_responder",
    district: "Kicukiro",
    status: "ACTIVE",
    last_login: "Today 07:45",
    session: "ONLINE",
    mfa_enabled: false,
  },
  {
    user_id: "usr-0008-0000-0000-000000000008",
    name: "System Admin",
    email: "admin@resq.rw",
    initials: "SA",
    role: "super_admin",
    district: "—",
    status: "ACTIVE",
    last_login: "Today 08:00",
    session: "ONLINE",
    mfa_enabled: true,
    isSelf: true,
  },
];

export function adminRoleBadge(role) {
  const map = {
    dispatcher: {
      bg: "var(--accent-ghost)",
      color: "var(--accent)",
      label: "DISPATCHER",
    },
    field_responder: {
      bg: "var(--status-info-bg)",
      color: "var(--status-info)",
      label: "FIELD RESPONDER",
    },
    OPERATIONS_MANAGER: {
      bg: "var(--status-medium-bg)",
      color: "var(--status-medium)",
      label: "OPS MANAGER",
    },
    district_commander: {
      bg: "rgba(83,74,183,0.15)",
      color: "#534AB7",
      label: "DISTRICT COMMANDER",
    },
    emergency_planner: {
      bg: "var(--status-low-bg)",
      color: "var(--status-low)",
      label: "EMERGENCY PLANNER",
    },
    analyst: {
      bg: "rgba(33,150,200,0.15)",
      color: "var(--status-info)",
      label: "ANALYST",
    },
    super_admin: {
      bg: "var(--status-critical-bg)",
      color: "var(--status-critical)",
      label: "SUPER ADMIN",
    },
  };
  return (
    map[role] || {
      bg: "var(--bg-elevated)",
      color: "var(--text-secondary)",
      label: role,
    }
  );
}

export function logLevelColor(status) {
  if (status === "SUCCESS") return "var(--status-low)";
  if (status === "DENIED") return "var(--status-critical)";
  if (status === "ERROR") return "var(--status-medium)";
  return "var(--status-info)";
}


// ip → ip_address; added log_id + user_id; status derived from activity log's new status field
export const ADMIN_AUDIT_ROWS = ADMIN_ACTIVITY_LOG.map((e, i) => ({
  log_id: `log-${String(i + 1).padStart(4, "0")}`,
  user_id: `usr-${String((i % 8) + 1).padStart(4, "0")}`,
  timestamp: `2026-05-28 ${e.time}`,
  action: e.action,
  user: e.user,
  role: e.user.split("·")[0]?.trim() || "System",
  module: e.user.split("·")[1]?.trim() || "System",
  ip_address:
    i === 3 ? "41.222.18.44" : i === 10 ? "197.243.88.12" : "197.243.10.22",
  status: e.status,
}));

// event_type replaces type; description folds desc+detail; occurred_at replaces time
export const ADMIN_SECURITY_EVENTS = [
  {
    event_type: "FAILED LOGIN CLUSTER",
    description:
      "3 failed attempts from 41.222.xxx.xxx — targeting Dispatcher Bosco J.",
    occurred_at: "14:24 today",
  },
  {
    event_type: "ACCOUNT LOCKED",
    description:
      "Mugisha K. locked after 5 failed attempts — Kicukiro Dispatcher",
    occurred_at: "10:12 today",
  },
  {
    event_type: "UNUSUAL LOGIN LOCATION",
    description: "Login from Musanze — user Habimana J. is assigned to Kigali",
    occurred_at: "May 26, 22:14",
  },
  {
    event_type: "CONFIG CHANGE",
    description: "AI model threshold changed by Super Admin",
    occurred_at: "May 25, 11:30",
  },
  {
    event_type: "MFA NOT ENABLED",
    description: "2 active users without MFA: Habimana J. · Mutoni A.",
    occurred_at: "Ongoing",
  },
];

export const ADMIN_MFA_ROLES = [
  { role: "Dispatcher", enabled: 8, total: 9 },
  { role: "Field Responder", enabled: 12, total: 12 },
  { role: "Ops Manager", enabled: 4, total: 4 },
  { role: "District Commander", enabled: 5, total: 5 },
  { role: "Emergency Planner", enabled: 3, total: 4 },
  { role: "Analyst", enabled: 2, total: 2 },
  { role: "Super Admin", enabled: 1, total: 1 },
];

// session_id added; ip → ip_address; login → start_time; activity → last_activity
export const ADMIN_ACTIVE_SESSIONS = [
  {
    session_id: "sess-0001",
    user: "Jean Bosco Nkurunziza",
    role: "dispatcher",
    device: "Chrome · Windows",
    ip_address: "197.243.10.22",
    start_time: "14:31",
    last_activity: "14:32",
    self: false,
  },
  {
    session_id: "sess-0002",
    user: "Kagame R.",
    role: "OPERATIONS_MANAGER",
    device: "Firefox · macOS",
    ip_address: "197.243.10.45",
    start_time: "14:20",
    last_activity: "14:28",
    self: false,
  },
  {
    session_id: "sess-0003",
    user: "Nkurunziza K.",
    role: "field_responder",
    device: "Mobile App · Android",
    ip_address: "41.186.22.88",
    start_time: "08:00",
    last_activity: "14:15",
    self: false,
  },
  {
    session_id: "sess-0004",
    user: "Habimana J.",
    role: "field_responder",
    device: "Mobile App · iOS",
    ip_address: "197.243.11.03",
    start_time: "07:45",
    last_activity: "12:30",
    self: false,
  },
  {
    session_id: "sess-0005",
    user: "Uwimana Aline",
    role: "district_commander",
    device: "Chrome · Windows",
    ip_address: "197.243.10.88",
    start_time: "09:14",
    last_activity: "09:45",
    self: false,
  },
  {
    session_id: "sess-0006",
    user: "Claudine Uwimana",
    role: "emergency_planner",
    device: "Chrome · Windows",
    ip_address: "197.243.10.55",
    start_time: "11:00",
    last_activity: "13:20",
    self: false,
  },
  {
    session_id: "sess-0007",
    user: "Grace Ingabire",
    role: "analyst",
    device: "Edge · Windows",
    ip_address: "197.243.10.60",
    start_time: "10:30",
    last_activity: "14:00",
    self: false,
  },
  {
    session_id: "sess-0008",
    user: "System Admin",
    role: "super_admin",
    device: "Chrome · Windows",
    ip_address: "197.243.10.01",
    start_time: "08:00",
    last_activity: "14:32",
    self: true,
  },
];

export const ADMIN_IP_RANGES = [
  { range: "197.243.0.0/16", label: "RNP Kigali HQ" },
  { range: "41.186.0.0/16", label: "RNP Regional Offices" },
  { range: "10.0.0.0/8", label: "Internal VPN" },
];

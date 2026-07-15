import api from '../lib/apiClient'

export async function listAuditLogs(params = {}) {
  const { data } = await api.get('/api/admin/audit-logs', { params })
  return (data.data ?? data).map(l => ({
    log_id: l.logId,
    user_id: l.userId,
    user_name: l.userName,
    user_role: l.userRole,
    timestamp: l.timestamp,
    action: l.action,
    module: l.module,
    ip_address: l.ipAddress,
    status: l.status,
  }))
}

export async function getSystemSettings() {
  const { data } = await api.get('/api/admin/settings')
  return data.data ?? data
}

// The full settings set is SUPER_ADMIN-only, but any dispatcher-facing
// screen showing "response time vs target" needs to read the admin-set SLA
// target — every such screen previously hardcoded its own guess (8, 10...)
// instead of the value actually configured in Admin Settings, so changing
// the setting there never propagated anywhere.
export async function getResponseTimeTarget() {
  const { data } = await api.get('/api/settings/response-time-target')
  return (data.data ?? data).responseTimeTargetMinutes
}

export async function saveSystemSettings(payload) {
  const { data } = await api.put('/api/admin/settings', payload)
  return data.data ?? data
}

export async function listSecurityEvents() {
  const { data } = await api.get('/api/admin/security-events')
  return (data.data ?? data).map(e => ({
    event_id: e.eventId,
    event_type: e.eventType,
    source: e.source,
    ip_address: e.ipAddress,
    occurred_at: e.occurredAt,
    severity: e.severity,
    status: e.status,
  }))
}

function parseUA(ua) {
  if (!ua || ua.length < 20) return ua || 'Unknown'
  // Already short (backend already parsed it)
  if (!ua.startsWith('Mozilla')) return ua

  let browser = 'Browser'
  if (/Edg\//.test(ua))                        browser = 'Edge'
  else if (/OPR\/|Opera/.test(ua))             browser = 'Opera'
  else if (/Chrome\//.test(ua))                browser = 'Chrome'
  else if (/Firefox\//.test(ua))               browser = 'Firefox'
  else if (/Safari\//.test(ua) && !/Chrome/.test(ua)) browser = 'Safari'
  else if (/MSIE|Trident/.test(ua))            browser = 'IE'

  let os = 'Unknown OS'
  if (/Windows NT/.test(ua))                   os = 'Windows'
  else if (/Macintosh/.test(ua))               os = 'macOS'
  else if (/Android/.test(ua))                 os = 'Android'
  else if (/iPhone|iPad/.test(ua))             os = 'iOS'
  else if (/Linux/.test(ua))                   os = 'Linux'

  return `${browser} · ${os}`
}

export async function listSessions() {
  const { data } = await api.get('/api/admin/sessions')
  return (data.data ?? data).map(s => ({
    session_id: s.sessionId,
    user_id: s.userId,
    user_name: s.userName,
    user_role: s.userRole,
    device: parseUA(s.device),
    ip_address: s.ipAddress,
    start_time: s.startTime,
    last_activity: s.lastActivity,
    self: s.self,
  }))
}

export async function revokeSession(sessionId) {
  await api.delete(`/api/admin/sessions/${sessionId}`)
}

export async function revokeAllSessions() {
  await api.delete('/api/admin/sessions')
}

export async function sendMfaReminder(userId) {
  const { data } = await api.post(`/api/admin/mfa-reminder/${userId}`)
  return data.data ?? data
}

export async function sendMfaReminderAll() {
  const { data } = await api.post('/api/admin/mfa-reminder')
  return data.data ?? data
}

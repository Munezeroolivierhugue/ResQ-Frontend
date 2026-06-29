import api from '../lib/apiClient'

export async function listAuditLogs() {
  const { data } = await api.get('/api/admin/audit-logs')
  return (data.data ?? data).map(l => ({
    log_id: l.logId,
    user_id: l.userId,
    user_name: l.userName,
    timestamp: l.timestamp,
    action: l.action,
    module: l.module,
    ip_address: l.ipAddress,
    status: l.status,
  }))
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

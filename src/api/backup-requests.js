import api from '../lib/apiClient'

function transform(r) {
  return {
    backup_id: r.backupId,
    incident_id: r.incidentId,
    incident_ref: r.incidentRef,
    requesting_unit_id: r.requestingUnitId,
    plate_number: r.plateNumber,
    reason: r.reason,
    notes: r.notes,
    created_at: r.createdAt,
    status: r.status ?? 'PENDING',
  }
}

export async function listBackupRequests(incidentId) {
  const { data } = await api.get('/api/backup-requests', {
    params: incidentId ? { incidentId } : {},
  })
  return (data.data ?? data).map(transform)
}

export async function requestBackup({ incidentId, requestingUnitId, reason, notes }) {
  const { data } = await api.post('/api/backup-requests', {
    incidentId,
    requestingUnitId,
    reason,
    notes,
  })
  return transform(data.data ?? data)
}

export async function acknowledgeBackupRequest(id) {
  const { data } = await api.patch(`/api/backup-requests/${id}/acknowledge`)
  return transform(data.data ?? data)
}

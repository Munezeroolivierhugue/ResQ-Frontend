import api from '../lib/apiClient'

export async function listBackupRequests() {
  const { data } = await api.get('/api/backup-requests')
  return data.data ?? data
}

export async function requestBackup({ incidentId, requestedAgencyId, resourceType, reason, notes }) {
  const { data } = await api.post('/api/backup-requests', {
    incidentId,
    requestedAgencyId,
    resourceType,
    reason,
    notes,
  })
  return data.data ?? data
}

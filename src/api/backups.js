import api from '../lib/apiClient'

function mapBackup(b) {
  return {
    backup_id: b.backupId,
    type: b.type,
    size_mb: b.sizeMb,
    location: b.location,
    created_at: b.createdAt,
  }
}

export async function listBackups() {
  const { data } = await api.get('/api/admin/backups')
  return (data.data ?? data).map(mapBackup)
}

export async function runBackupNow(type = 'MANUAL') {
  const { data } = await api.post('/api/admin/backups', { type })
  return mapBackup(data.data ?? data)
}

export async function restoreBackup(backupId) {
  const { data } = await api.post(`/api/admin/backups/${backupId}/restore`)
  return data.data ?? data
}

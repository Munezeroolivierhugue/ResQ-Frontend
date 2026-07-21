import api from '../lib/apiClient'

function transform(a) {
  return {
    announcement_id: a.announcementId,
    message: a.message,
    severity: a.severity,
    target_type: a.targetType,
    target_roles: a.targetRoles ?? [],
    from_date: a.fromDate,
    to_date: a.toDate,
    created_by_name: a.createdByName,
    created_at: a.createdAt,
    recipient_count: a.recipientCount,
  }
}

function transformActive(a) {
  return {
    recipient_id: a.recipientId,
    announcement_id: a.announcementId,
    message: a.message,
    severity: a.severity,
    from_date: a.fromDate,
    to_date: a.toDate,
  }
}

export async function listAnnouncements() {
  const { data } = await api.get('/api/announcements')
  return (data.data ?? data).map(transform)
}

export async function listActiveAnnouncements() {
  const { data } = await api.get('/api/announcements/active')
  return (data.data ?? data).map(transformActive)
}

export async function dismissAnnouncement(recipientId) {
  await api.patch(`/api/announcements/${recipientId}/dismiss`)
}

export async function createAnnouncement(payload) {
  const { data } = await api.post('/api/announcements', {
    message: payload.message,
    severity: payload.severity,
    targetType: payload.targetType,
    targetRoles: payload.targetRoles ?? [],
    targetUserIds: payload.targetUserIds ?? [],
    fromDate: payload.fromDate,
    toDate: payload.toDate,
  })
  return transform(data.data ?? data)
}

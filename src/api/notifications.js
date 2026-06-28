import api from '../lib/apiClient'

function transform(n) {
  return {
    id: n.notificationId,
    type: n.type,
    // Backend has 'message'; frontend uses 'title' + 'desc'. Split on first ': ' if present.
    title: n.message?.split(': ')[0] ?? n.message ?? '',
    desc: n.message?.split(': ').slice(1).join(': ') ?? '',
    time: n.createdAt,
    read: n.read,
    priority: n.priority,
    // TODO: backend gap — href and details fields don't exist in backend response
    href: null,
    details: null,
  }
}

export async function listNotifications(unreadOnly = false) {
  const { data } = await api.get('/api/notifications', { params: unreadOnly ? { unreadOnly: true } : {} })
  return (data.data ?? data).map(transform)
}

export async function markNotificationRead(id) {
  const { data } = await api.patch(`/api/notifications/${id}/read`)
  return transform(data.data ?? data)
}

export async function markAllNotificationsRead() {
  await api.patch('/api/notifications/read-all')
}

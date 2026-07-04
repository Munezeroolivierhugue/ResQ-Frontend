import api from '../lib/apiClient'

function transform(b) {
  return {
    broadcast_id: b.broadcastId,
    sent_by_id: b.sentById,
    sent_by_name: b.sentByName,
    message: b.message,
    priority: b.priority,
    target_area: b.targetArea,
    sent_at: b.sentAt,
  }
}

export async function listBroadcasts() {
  const { data } = await api.get('/api/broadcasts')
  return (data.data ?? data).map(transform)
}

export async function createBroadcast(body) {
  const { data } = await api.post('/api/broadcasts', {
    message: body.message,
    priority: body.priority,
    targetArea: body.target_area,
  })
  return transform(data.data ?? data)
}

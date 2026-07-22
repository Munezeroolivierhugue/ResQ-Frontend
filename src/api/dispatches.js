import api from '../lib/apiClient'

function transform(d) {
  return {
    dispatch_id: d.dispatchId,
    incident_id: d.incidentId,
    incident_ref: d.incidentRef,
    vehicle_id: d.vehicleId,
    vehicle_plate: d.vehiclePlate,
    responder_id: d.responderId,
    responder_name: d.responderName,
    dispatched_by: d.dispatchedById,
    dispatched_by_name: d.dispatchedByName,
    ai_recommended: d.aiRecommended,
    overridden: d.overridden,
    override_reason: d.overrideReason,
    confidence: d.confidence,
    eta_minutes: d.etaMinutes,
    is_immediate: d.isImmediate,
    created_at: d.createdAt,
  }
}

export async function getMyDispatches() {
  const { data } = await api.get('/api/dispatches/my')
  return (data.data ?? data).map(transform)
}

export async function listDispatchesForIncident(incidentId) {
  const { data } = await api.get('/api/dispatches', { params: { incidentId } })
  return (data.data ?? data).map(transform)
}

export async function getDispatch(id) {
  const { data } = await api.get(`/api/dispatches/${id}`)
  return transform(data.data ?? data)
}

export async function createDispatch(body) {
  // body: { incidentId, vehicleId, responderId?, aiRecommended, overridden, overrideReason }
  const { data } = await api.post('/api/dispatches', body)
  return transform(data.data ?? data)
}

// Full persisted chat history for a dispatch, oldest first. Previously chat was
// pure live-WS-only (nothing persisted server-side), so a message sent before the
// reader subscribed — most notably the dispatcher's message sent at dispatch time,
// before the responder ever opens the assignment screen — was permanently invisible.
export async function getDispatchMessages(dispatchId) {
  const { data } = await api.get(`/api/dispatches/${dispatchId}/messages`)
  return (data.data ?? data).map((m) => ({
    message_id: m.messageId,
    dispatch_id: m.dispatchId,
    sender_id: m.senderId,
    sender_name: m.senderName,
    text: m.message,
    sent_at: m.sentAt,
  }))
}

export async function findNearestUnit(lat, lng) {
  const { data } = await api.get('/api/dispatch/immediate/nearest', { params: { lat, lng } })
  const u = data.data ?? data
  if (!u) return null
  return {
    vehicle_id: u.vehicleId,
    plate_number: u.plateNumber,
    vehicle_type: u.vehicleType,
    current_lat: u.currentLat,
    current_lng: u.currentLng,
    eta_minutes: u.etaMinutes,
    distance_km: u.distanceKm,
  }
}

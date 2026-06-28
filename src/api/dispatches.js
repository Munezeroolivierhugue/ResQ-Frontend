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

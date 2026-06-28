import api from '../lib/apiClient'

function transform(i) {
  return {
    incident_id: i.incidentId,
    incident_ref: i.incidentNumber,
    incident_type: i.incidentType,
    final_severity: i.finalSeverity,
    status: i.status,
    lat: i.latitude,
    lng: i.longitude,
    address: i.address,
    district_id: i.districtId,
    call_time: i.reportedAt,
    caller_id: i.callerId,
  }
}

function transformAiRecommend(r) {
  return {
    incident_id: r.incidentId,
    severity: r.severity,
    confidence: r.confidence,
    reasoning: r.reasoning,
    is_immediate: r.isImmediate,
    ranked_units: (r.rankedUnits ?? []).map((u) => ({
      vehicle_id: u.vehicleId,
      plate_number: u.plateNumber,
      vehicle_type: u.vehicleType,
      agency_name: u.agencyName,
      current_lat: u.currentLat,
      current_lng: u.currentLng,
      confidence: u.confidence,
      eta_minutes: u.etaMinutes,
      reasoning: u.reasoning,
    })),
  }
}

export async function listIncidents(params = {}) {
  const { data } = await api.get('/api/incidents', { params })
  return (data.data ?? data).map(transform)
}

export async function getIncident(id) {
  const { data } = await api.get(`/api/incidents/${id}`)
  return transform(data.data ?? data)
}

export async function createIncident(body) {
  // body should have: incidentType, callerId, latitude, longitude, address, districtId, initialSeverity
  const { data } = await api.post('/api/incidents', body)
  return transform(data.data ?? data)
}

export async function updateIncidentStatus(id, status) {
  const { data } = await api.patch(`/api/incidents/${id}/status`, { status })
  return transform(data.data ?? data)
}

export async function checkDuplicates(lat, lng) {
  const { data } = await api.get('/api/incidents/duplicates', { params: { lat, lng } })
  return (data.data ?? data).map(transform)
}

export async function getAiRecommendation(incidentId) {
  const { data } = await api.get(`/api/incidents/${incidentId}/ai-recommend`)
  return transformAiRecommend(data.data ?? data)
}

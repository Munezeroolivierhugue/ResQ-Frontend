import api from '../lib/apiClient'

function transform(i) {
  return {
    incident_id:             i.incidentId,
    incident_ref:            i.incidentRef ?? null,          // DTO: incidentRef
    incident_type:           i.incidentType,
    severity:                (i.finalSeverity ?? i.severity ?? 'medium').toLowerCase(),
    final_severity:          i.finalSeverity,
    status:                  i.status,
    lat:                     i.locationLat ?? null,           // DTO: locationLat (via Location entity)
    lng:                     i.locationLng ?? null,           // DTO: locationLng
    address:                 i.locationLandmark ?? null,      // DTO: locationLandmark
    district:                i.districtName ?? null,          // DTO: districtName
    sector:                  i.locationSector ?? null,        // DTO: locationSector
    district_id:             i.districtId ?? null,
    call_time:               i.callTime ?? null,              // DTO: callTime
    caller_id:               i.callerId ?? null,
    response_time_minutes:   i.responseTimeMinutes ?? null,
    resolution_time_minutes: i.resolutionTimeMinutes ?? null,
  }
}

function transformAiRecommend(r) {
  return {
    incident_id: r.incidentId,
    severity: r.severity,
    confidence: r.confidence,
    reasoning: r.reasoning,
    is_immediate: r.isImmediate,
    recommendations: (r.recommendations ?? []).map((o) => ({
      option_rank: o.optionRank,
      combined_eta_minutes: o.combinedEtaMinutes,
      confidence_score: o.confidenceScore,
      reasoning: o.reasoning,
      units: (o.units ?? []).map((u) => ({
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

/**
 * POST /api/incident-closures
 * Saves the dispatcher's structured closure report and transitions the incident to CLOSED.
 */
export async function createIncidentClosure({ incidentId, personsInvolved, casualties, arrests, finalDisposition, closureNotes, dataSource = 'dispatcher_portal' }) {
  const { data } = await api.post('/api/incident-closures', {
    incidentId,
    personsInvolved: personsInvolved != null ? parseInt(personsInvolved) || null : null,
    casualties:      parseInt(casualties) || 0,
    arrests:         parseInt(arrests) || 0,
    finalDisposition,
    closureNotes,
    dataSource,
  })
  return data.data ?? data
}

export async function checkDuplicates(lat, lng) {
  const { data } = await api.get('/api/incidents/duplicates', { params: { lat, lng } })
  return (data.data ?? data).map(transform)
}

export async function getAiRecommendation(incidentId) {
  const { data } = await api.get(`/api/dispatch/ai-recommend/${incidentId}`)
  return transformAiRecommend(data.data ?? data)
}

import api from '../lib/apiClient'

function minutesBetween(a, b) {
  if (!a || !b) return null
  const diff = (new Date(b) - new Date(a)) / 60000
  return diff > 0 ? Math.round(diff) : null
}

function transform(i) {
  return {
    incident_id:             i.incidentId,
    incident_ref:            i.incidentRef ?? null,
    incident_type:           i.incidentType,
    severity:                (i.finalSeverity ?? i.severity ?? 'medium').toLowerCase(),
    final_severity:          i.finalSeverity,
    status:                  i.status,
    lat:                     i.locationLat ?? null,
    lng:                     i.locationLng ?? null,
    address:                 i.locationLandmark ?? null,
    district:                i.districtName ?? null,
    sector:                  i.locationSector ?? null,
    district_id:             i.districtId ?? null,
    call_time:               i.callTime ?? null,
    dispatch_time:           i.dispatchTime ?? null,
    arrival_time:            i.arrivalTime ?? null,
    closure_time:            i.closureTime ?? null,
    pending_report_at:       i.pendingReportAt ?? null,
    caller_id:               i.callerId ?? null,
    // Derived from timestamps when backend doesn't pre-compute them
    response_time_minutes:   i.responseTimeMinutes ?? minutesBetween(i.callTime, i.arrivalTime ?? i.dispatchTime),
    resolution_time_minutes: i.resolutionTimeMinutes ?? minutesBetween(i.callTime, i.closureTime),
    escalated:               i.escalated ?? false,
    escalated_at:            i.escalatedAt ?? null,
    escalated_by_id:         i.escalatedById ?? null,
    escalated_by_name:       i.escalatedByName ?? null,
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

export async function escalateIncident(id) {
  const { data } = await api.post(`/api/incidents/${id}/escalate`)
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

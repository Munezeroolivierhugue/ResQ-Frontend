import api from '../lib/apiClient'

function transform(r) {
  return {
    request_id: r.requestId,
    requesting_district_id: r.requestingDistrictId,
    requesting_district_name: r.requestingDistrictName,
    source_district_id: r.sourceDistrictId,
    source_district_name: r.sourceDistrictName,
    requested_by_id: r.requestedById,
    requested_by_name: r.requestedByName,
    unit_type: r.unitType,
    quantity: r.quantity,
    duration: r.duration,
    reason: r.reason,
    status: r.status,
    vehicle_id: r.vehicleId,
    vehicle_plate_number: r.vehiclePlateNumber,
    resolution_notes: r.resolutionNotes,
    resolved_by_id: r.resolvedById,
    resolved_by_name: r.resolvedByName,
    resolved_at: r.resolvedAt,
    created_at: r.createdAt,
  }
}

function transformRecommendation(r) {
  return {
    candidates: (r.candidates ?? []).map((c) => ({
      district_id: c.districtId,
      district_name: c.districtName,
      available_units: c.availableUnits,
      total_units: c.totalUnits,
      distance_km: c.distanceKm,
      score: c.score,
      reasoning: c.reasoning,
      suggested_vehicle_id: c.suggestedVehicleId,
      suggested_vehicle_plate: c.suggestedVehiclePlate,
    })),
    reasoning: r.reasoning,
    confidence: r.confidence,
  }
}

export async function listMutualAidRequests(params = {}) {
  const { data } = await api.get('/api/mutual-aid', { params })
  return (data.data ?? data).map(transform)
}

export async function createMutualAidRequest(body) {
  const payload = {
    requestingDistrictId: body.requesting_district_id,
    sourceDistrictId: body.source_district_id,
    unitType: body.unit_type,
    quantity: body.quantity,
    duration: body.duration,
    reason: body.reason,
  }
  const { data } = await api.post('/api/mutual-aid', payload)
  return transform(data.data ?? data)
}

export async function recommendMutualAidSource(id) {
  const { data } = await api.get(`/api/mutual-aid/${id}/recommend-source`)
  return transformRecommendation(data.data ?? data)
}

export async function fulfillMutualAid(id, vehicleId) {
  const { data } = await api.post(`/api/mutual-aid/${id}/fulfill`, { vehicleId })
  return transform(data.data ?? data)
}

export async function declineMutualAid(id, reason) {
  const { data } = await api.post(`/api/mutual-aid/${id}/decline`, { reason })
  return transform(data.data ?? data)
}

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
    created_at: r.createdAt,
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

export async function updateMutualAidStatus(id, status) {
  const { data } = await api.patch(`/api/mutual-aid/${id}/status`, null, { params: { status } })
  return transform(data.data ?? data)
}

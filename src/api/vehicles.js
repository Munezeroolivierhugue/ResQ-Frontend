import api from '../lib/apiClient'

function transform(v) {
  return {
    vehicle_id: v.vehicleId,
    id: v.plateNumber,
    plate_number: v.plateNumber,
    vehicle_type: v.vehicleType ?? 'Vehicle',
    agency_id: v.agencyId,
    agency_name: v.agencyName,
    station_id: v.stationId,
    station_name: v.stationName,
    station_lat: v.stationLat,
    station_lng: v.stationLng,
    district_id: v.districtId,
    district_name: v.districtName,
    status: (v.status ?? 'offline').toLowerCase(),
    location: v.stationName ?? v.districtName ?? 'Unknown',
    assignment: v.assignment ?? null,
    capability: v.capability,
    current_lat: v.currentLat,
    current_lng: v.currentLng,
    online: v.online,
    last_sync: v.lastSync,
  }
}

export async function listVehicles(params = {}) {
  const mapped = {}
  if (params.districtId) mapped.districtId = params.districtId
  if (params.agencyId)   mapped.agencyId   = params.agencyId
  if (params.status)     mapped.status      = params.status
  const { data } = await api.get('/api/vehicles', { params: mapped })
  return (data.data ?? data).map(transform)
}

export async function getVehicle(id) {
  const { data } = await api.get(`/api/vehicles/${id}`)
  return transform(data.data ?? data)
}

export async function updateVehicleStatus(id, status, lat, lng) {
  const params = { status }
  if (lat != null) params.lat = lat
  if (lng != null) params.lng = lng
  const { data } = await api.patch(`/api/vehicles/${id}/status`, null, { params })
  return transform(data.data ?? data)
}

export async function recordGpsPing(vehicleId, lat, lng) {
  await api.post(`/api/vehicles/${vehicleId}/gps`, null, { params: { lat, lng }, suppressToast: true })
}

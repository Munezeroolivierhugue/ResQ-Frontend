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
  const { data } = await api.get('/api/vehicles', { params })
  return (data.data ?? data).map(transform)
}

export async function getVehicle(id) {
  const { data } = await api.get(`/api/vehicles/${id}`)
  return transform(data.data ?? data)
}

export async function updateVehicleStatus(id, status, lat, lng) {
  const body = { status }
  if (lat != null) body.lat = lat
  if (lng != null) body.lng = lng
  const { data } = await api.patch(`/api/vehicles/${id}/status`, body)
  return transform(data.data ?? data)
}

export async function recordGpsPing(vehicleId, lat, lng) {
  await api.post(`/api/vehicles/${vehicleId}/gps`, { lat, lng })
}

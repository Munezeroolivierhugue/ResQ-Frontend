import api from '../lib/apiClient'

function transform(s) {
  return {
    station_id: s.stationId,
    name: s.name,
    address: s.address,
    latitude: s.latitude,
    longitude: s.longitude,
    agency_id: s.agencyId,
    district_id: s.districtId,
  }
}

export async function listStations(params = {}) {
  const mapped = {}
  if (params.districtId) mapped.districtId = params.districtId
  if (params.agencyId) mapped.agencyId = params.agencyId
  const { data } = await api.get('/api/stations', { params: mapped })
  return (data.data ?? data).map(transform)
}

export async function getStation(id) {
  const { data } = await api.get(`/api/stations/${id}`)
  return transform(data.data ?? data)
}

export async function createStation(body) {
  const { data } = await api.post('/api/stations', body)
  return transform(data.data ?? data)
}

export async function updateStation(id, body) {
  const { data } = await api.put(`/api/stations/${id}`, body)
  return transform(data.data ?? data)
}

export async function deleteStation(id) {
  await api.delete(`/api/stations/${id}`)
}

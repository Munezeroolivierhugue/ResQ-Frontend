import api from '../lib/apiClient'

function transformAgency(a) {
  return {
    agency_id: a.agencyId,
    name: a.name,
    type: a.type,
    email: a.email,
    phone: a.phone,
  }
}

function transformStation(s) {
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

export async function listAgencies() {
  const { data } = await api.get('/api/agencies')
  return (data.data ?? data).map(transformAgency)
}

export async function getAgency(id) {
  const { data } = await api.get(`/api/agencies/${id}`)
  return transformAgency(data.data ?? data)
}

export async function createAgency(body) {
  const { data } = await api.post('/api/agencies', body)
  return transformAgency(data.data ?? data)
}

export async function updateAgency(id, body) {
  const { data } = await api.put(`/api/agencies/${id}`, body)
  return transformAgency(data.data ?? data)
}

export async function listStations(districtId, agencyId) {
  const params = {}
  if (districtId) params.districtId = districtId
  if (agencyId) params.agencyId = agencyId
  const { data } = await api.get('/api/stations', { params })
  return (data.data ?? data).map(transformStation)
}

export async function getStation(id) {
  const { data } = await api.get(`/api/stations/${id}`)
  return transformStation(data.data ?? data)
}

export async function createStation(body) {
  const { data } = await api.post('/api/stations', body)
  return transformStation(data.data ?? data)
}

import api from '../lib/apiClient'

function transform(r) {
  return {
    lat: r.lat ?? r.latitude,
    lng: r.lng ?? r.longitude,
    source: r.source,
    accuracy: r.accuracy,
    sector: r.sector,
    landmark: r.landmark,
    resolved_at: r.resolvedAt,
  }
}

export async function triangulateFromTelecom(phoneNumber) {
  const { data } = await api.get('/api/location/telecom', { params: { phoneNumber } })
  return transform(data.data ?? data)
}

export async function locateViaSmsGps(phoneNumber) {
  const { data } = await api.get('/api/location/sms-gps', { params: { phoneNumber } })
  return transform(data.data ?? data)
}

export async function geocodeSector(sectorName) {
  const { data } = await api.get('/api/location/sector', { params: { sectorName } })
  return transform(data.data ?? data)
}

export async function findLandmark(name) {
  const { data } = await api.get('/api/location/landmark', { params: { name } })
  return transform(data.data ?? data)
}

export async function saveMapPin(lat, lng, sector, landmark) {
  const { data } = await api.post('/api/location/map-pin', null, { params: { lat, lng, sector, landmark } })
  return data.data ?? data
}

import api from '../lib/apiClient'

// Approximate center coordinates for all 30 Rwanda districts
const DISTRICT_COORDS = {
  Nyarugenge: [-1.9536, 30.0606], Kicukiro: [-1.9955, 30.0984], Gasabo: [-1.9106, 30.1185],
  Musanze:    [-1.4994, 29.6340], Burera:   [-1.3783, 29.8341], Gakenke: [-1.6890, 29.7844],
  Rulindo:    [-1.7296, 30.0634], Gicumbi:  [-1.5732, 30.0796],
  Huye:       [-2.5956, 29.7386], Nyamagabe: [-2.4640, 29.4817], Gisagara: [-2.6176, 29.8271],
  Nyaruguru:  [-2.7385, 29.5357], Muhanga:  [-2.0800, 29.7559], Kamonyi: [-2.0004, 29.8794],
  Ruhango:    [-2.2244, 29.7738], Nyanza:   [-2.3520, 29.7513],
  Rwamagana:  [-1.9489, 30.4348], Bugesera: [-2.1683, 30.2541], Gatsibo:  [-1.5823, 30.4735],
  Kayonza:    [-1.8727, 30.6550], Kirehe:   [-2.1450, 30.6826], Ngoma:    [-2.1596, 30.4849],
  Nyagatare:  [-1.2985, 30.3290],
  Rubavu:     [-1.6820, 29.2569], Karongi:  [-2.0698, 29.3858], Ngororero: [-1.8456, 29.5590],
  Nyabihu:    [-1.5723, 29.5151], Nyamasheke: [-2.3337, 29.1314], Rusizi: [-2.4826, 28.9026],
  Rutsiro:    [-1.9287, 29.4389],
}

// Transform backend camelCase to frontend snake_case
function transform(d) {
  const coords = DISTRICT_COORDS[d.name] ?? null
  return {
    district_id: d.districtId,
    name: d.name,
    province: d.province,
    lat: d.latitude ?? coords?.[0] ?? null,
    lng: d.longitude ?? coords?.[1] ?? null,
  }
}

export async function listDistricts() {
  const { data } = await api.get('/api/districts')
  return (data.data ?? data).map(transform)
}

export async function getDistrict(id) {
  const { data } = await api.get(`/api/districts/${id}`)
  return transform(data.data ?? data)
}

export async function getSectors(districtId) {
  const { data } = await api.get(`/api/districts/${districtId}/sectors`)
  const raw = data.data ?? data
  return Array.isArray(raw) ? raw.map((s) => (typeof s === 'string' ? s : s.name ?? s.sectorName)) : []
}

import api from '../lib/apiClient'

// Transform backend camelCase to frontend snake_case
function transform(d) {
  return { district_id: d.districtId, name: d.name, province: d.province }
}

export async function listDistricts() {
  const { data } = await api.get('/api/districts')
  return (data.data ?? data).map(transform)
}

export async function getDistrict(id) {
  const { data } = await api.get(`/api/districts/${id}`)
  return transform(data.data ?? data)
}

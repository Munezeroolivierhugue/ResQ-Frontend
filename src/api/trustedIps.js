import api from '../lib/apiClient'

function mapIp(ip) {
  return {
    id: ip.id,
    ip_address: ip.ipAddress,
    label: ip.label,
    added_at: ip.addedAt,
    last_used_at: ip.lastUsedAt,
  }
}

export async function listTrustedIps() {
  const { data } = await api.get('/api/users/me/trusted-ips')
  return (data.data ?? data).map(mapIp)
}

// Pass no args to trust the request's own current IP ("Add my current IP").
export async function addTrustedIp({ ipAddress, label } = {}) {
  const { data } = await api.post('/api/users/me/trusted-ips', { ipAddress, label })
  return mapIp(data.data ?? data)
}

export async function removeTrustedIp(id) {
  await api.delete(`/api/users/me/trusted-ips/${id}`)
}

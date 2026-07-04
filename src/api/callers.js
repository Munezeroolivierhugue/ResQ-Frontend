import api from '../lib/apiClient'

function transform(c) {
  return {
    caller_id: c.callerId,
    phone_number: c.phoneNumber,
    identity: c.identity,
    previous_incidents: c.previousIncidents,
    trust_level: c.trustLevel,
    verified: c.verified,
  }
}

export async function listCallers() {
  const { data } = await api.get('/api/callers')
  return (data.data ?? data).map(transform)
}

export async function getCaller(id) {
  const { data } = await api.get(`/api/callers/${id}`)
  return transform(data.data ?? data)
}

export async function getCallerByPhone(phone) {
  const { data } = await api.get('/api/callers/by-phone', { params: { phone } })
  return transform(data.data ?? data)
}

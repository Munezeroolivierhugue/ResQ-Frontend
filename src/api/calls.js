import api from '../lib/apiClient'

function transform(c) {
  return {
    call_id: c.callId,
    session_id: c.sessionId,
    caller_phone: c.callerPhone,
    destination_number: c.destinationNumber,
    incident_type_hint: c.incidentTypeHint,
    status: c.status,
    call_time: c.callTime,
    handled_by_name: c.handledByName,
    incident_id: c.incidentId,
  }
}

export async function listCalls(status) {
  const params = status ? { status } : {}
  const { data } = await api.get('/api/calls', { params })
  return (data.data ?? data).map(transform)
}

export async function simulateCall() {
  const { data } = await api.post('/api/calls/simulate')
  return transform(data.data ?? data)
}

export async function claimCall(sessionId) {
  const { data } = await api.post(`/api/calls/${sessionId}/claim`)
  return transform(data.data ?? data)
}

export async function passCall(sessionId) {
  const { data } = await api.post(`/api/calls/${sessionId}/pass`)
  return transform(data.data ?? data)
}

export async function missCall(sessionId) {
  const { data } = await api.post(`/api/calls/${sessionId}/miss`)
  return transform(data.data ?? data)
}

export async function linkIncident(sessionId, incidentId) {
  const { data } = await api.patch(`/api/calls/${sessionId}/link-incident`, { incidentId })
  return transform(data.data ?? data)
}

export async function recordOutcome(sessionId, outcome) {
  const { data } = await api.patch(`/api/calls/${sessionId}/outcome`, { outcome })
  return transform(data.data ?? data)
}

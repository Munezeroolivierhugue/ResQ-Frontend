import api from '../lib/apiClient'

function transform(m) {
  return {
    missed_call_id: m.missedCallId,
    phone_number: m.phoneNumber,
    call_time: m.callTime,
    wait_duration: m.waitDuration,
    last_dispatcher_id: m.lastDispatcherId,
    last_dispatcher_name: m.lastDispatcherName,
    cascade_count: m.cascadeCount,
    status: (m.status ?? '').toLowerCase(),
    called_back_by_id: m.calledBackById,
    callback_time: m.callbackTime,
  }
}

export async function listMissedCalls() {
  const { data } = await api.get('/api/missed-calls')
  return (data.data ?? data).map(transform)
}

export async function markCalledBack(id) {
  const { data } = await api.patch(`/api/missed-calls/${id}/callback`)
  return transform(data.data ?? data)
}

// Places a real outbound Twilio call — only succeeds for numbers under
// Verified Caller IDs while on a trial account. Returns the new call's real
// Twilio session ID (callId, callerPhone) so the dispatcher can navigate
// straight into New Incident exactly like answering a real inbound call.
//
// Uses c.sessionId (Twilio's own CallSid), not c.callId (our internal DB
// UUID) — every live WebSocket topic (audio, status, the media stream
// itself) is keyed by the Twilio CallSid, so tracking the DB id here meant
// the frontend was subscribed to a topic nothing was ever published on,
// leaving "Live call audio" stuck on "Connecting..." forever.
export async function callBackMissedCall(id) {
  const { data } = await api.post(`/api/missed-calls/${id}/call-back`)
  const c = data.data ?? data
  return { call_id: c.sessionId, phone_number: c.callerPhone }
}

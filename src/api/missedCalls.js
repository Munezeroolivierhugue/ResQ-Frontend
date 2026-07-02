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

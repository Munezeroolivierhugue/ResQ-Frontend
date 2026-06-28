import api from '../lib/apiClient'

function transform(s) {
  return {
    shift_id: s.shiftId,
    user_id: s.userId,
    user_name: s.userName,
    district_id: s.districtId,
    district_name: s.districtName,
    shift_start: s.shiftStart,
    shift_end: s.shiftEnd,
    status: s.status,
    role_on_shift: s.roleOnShift,
  }
}

export async function getMyShifts() {
  const { data } = await api.get('/api/shifts/my')
  return (data.data ?? data).map(transform)
}

export async function listActiveShifts(districtId) {
  const { data } = await api.get('/api/shifts', { params: { districtId } })
  return (data.data ?? data).map(transform)
}

export async function startShift(body) {
  const payload = {
    userId: body.user_id,
    districtId: body.district_id,
    shiftStart: body.shift_start ?? new Date().toISOString(),
    roleOnShift: body.role_on_shift,
  }
  const { data } = await api.post('/api/shifts', payload)
  return transform(data.data ?? data)
}

export async function endShift(id) {
  const { data } = await api.patch(`/api/shifts/${id}/end`)
  return transform(data.data ?? data)
}

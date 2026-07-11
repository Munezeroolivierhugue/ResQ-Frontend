import api from '../lib/apiClient'

function transform(u) {
  return {
    user_id: u.userId,
    email: u.email,
    full_name: u.fullName,
    role: u.role,
    phone_number: u.phone ?? u.phoneNumber,
    status: u.status,
    district_id: u.districtId,
    district_name: u.districtName ?? null,
    agency_id: u.agencyId,
    agency_name: u.agencyName ?? null,
    mfa_enabled: u.mfaEnabled ?? false,
    last_login: u.lastLogin ?? null,
    created_at: u.createdAt ?? null,
  }
}

export async function listUsers() {
  const { data } = await api.get('/api/users')
  return (data.data ?? data).map(transform)
}

export async function getUser(id) {
  const { data } = await api.get(`/api/users/${id}`)
  return transform(data.data ?? data)
}

export async function createUser(body) {
  const payload = {
    email: body.email,
    fullName: body.full_name,
    role: body.role?.toUpperCase(),
    phoneNumber: body.phone_number,
    districtId: body.district_id,
    agencyId: body.agency_id,
    password: body.password,
  }
  const { data } = await api.post('/api/users', payload)
  return transform(data.data ?? data)
}

export async function updateUser(id, body) {
  const payload = {
    fullName:   body.full_name   ?? undefined,
    email:      body.email       ?? undefined,
    phone:      body.phone_number ?? undefined,
    districtId: body.district_id  ?? undefined,
    agencyId:   body.agency_id    ?? undefined,
    vehicleId:  body.vehicle_id   ?? undefined,
    status:     body.status       ?? undefined,
  }
  const { data } = await api.put(`/api/users/${id}`, payload)
  return transform(data.data ?? data)
}

export async function updateSelf(body) {
  const payload = {
    fullName: body.full_name,
    phone: body.phone_number,
  }
  const { data } = await api.put('/api/users/me', payload)
  return transform(data.data ?? data)
}

export async function inviteUser(body) {
  await api.post('/api/users/invite', {
    email: body.email,
    fullName: body.full_name ?? body.fullName,
    role: (body.role ?? 'DISPATCHER').toUpperCase(),
    phone: body.phone ?? body.phone_number ?? body.phoneNumber ?? undefined,
    districtId: body.district_id ?? body.districtId ?? undefined,
    agencyId: body.agency_id ?? body.agencyId ?? undefined,
    vehicleId: body.vehicle_id ?? body.vehicleId ?? undefined,
    shiftType: body.shift_type ?? body.shiftType ?? undefined,
  })
}

export async function deleteUser(id) {
  await api.delete(`/api/users/${id}`)
}

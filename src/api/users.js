import api from '../lib/apiClient'

function transform(u) {
  return {
    user_id: u.userId,
    email: u.email,
    full_name: u.fullName,
    role: u.role,
    phone_number: u.phoneNumber,
    status: u.status,
    district_id: u.districtId,
    agency_id: u.agencyId,
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
    fullName: body.full_name,
    phoneNumber: body.phone_number,
    districtId: body.district_id,
    agencyId: body.agency_id,
    status: body.status,
  }
  const { data } = await api.put(`/api/users/${id}`, payload)
  return transform(data.data ?? data)
}

export async function inviteUser(body) {
  // POST /api/users/invite
  // body: { email, fullName, role, phoneNumber, districtId, agencyId }
  await api.post('/api/users/invite', {
    email: body.email,
    fullName: body.full_name ?? body.fullName,
    role: (body.role ?? 'DISPATCHER').toUpperCase(),
    phoneNumber: body.phone_number ?? body.phoneNumber,
    districtId: body.district_id ?? body.districtId,
    agencyId: body.agency_id ?? body.agencyId,
  })
}

export async function deleteUser(id) {
  await api.delete(`/api/users/${id}`)
}

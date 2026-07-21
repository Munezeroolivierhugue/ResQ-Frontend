import api from '../lib/apiClient'

// Same transform() convention as ../api/users.js — DTO shape is identical
// (UserDto) since /api/dc/users returns the same UserDto the admin /api/users
// endpoint does, just pre-filtered to the caller's own district.
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
    agency_type: u.agencyType ?? null,
    mfa_enabled: u.mfaEnabled ?? false,
    last_login: u.lastLogin ?? null,
    created_at: u.createdAt ?? null,
    current_vehicle_id: u.currentVehicleId ?? null,
    current_vehicle_plate: u.currentVehiclePlate ?? null,
    current_vehicle_type: u.currentVehicleType ?? null,
    shift_type: u.shiftType ?? null,
    photo_url: u.photoUrl ?? null,
  }
}

// All users visible to the caller's own District Commander account —
// DISPATCHER, EMERGENCY_PLANNER, ANALYST, FIELD_RESPONDER, OPERATIONS_MANAGER
// in their district. District is always inferred server-side from the JWT.
export async function listDistrictUsers() {
  const { data } = await api.get('/api/dc/users')
  return (data.data ?? data).map(transform)
}

export async function listLockedDistrictUsers() {
  const { data } = await api.get('/api/dc/users/locked')
  return data.data ?? data
}

export async function unlockDistrictUser(id) {
  const { data } = await api.post(`/api/dc/users/${id}/unlock`)
  return data.data ?? data
}

// Suspend/reactivate any user visible to this DC in their own district.
// status must be 'ACTIVE' or 'SUSPENDED'.
export async function setDistrictUserStatus(id, status) {
  const { data } = await api.patch(`/api/dc/users/${id}/status`, { status })
  return transform(data.data ?? data)
}

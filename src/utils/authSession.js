import { ASSIGNED_ROLES } from '../data/mockAuthData'

export function getDemoRole() {
  return sessionStorage.getItem('resq-demo-role') || null
}

export function setDemoRole(role) {
  sessionStorage.setItem('resq-demo-role', role)
}

/** Clears every resq-* key from sessionStorage. */
export function clearSession() {
  const keys = Object.keys(sessionStorage).filter((k) => k.startsWith('resq-'))
  keys.forEach((k) => sessionStorage.removeItem(k))
}

/** Clears every resq-* key from sessionStorage. Call on logout. */
export function logout() {
  clearSession()
}

/** Write JWT session after login. user can be null to keep existing. */
export function setSession({ access_token, refresh_token, user }) {
  if (access_token) sessionStorage.setItem('resq-jwt', access_token)
  if (refresh_token) sessionStorage.setItem('resq-refresh-token', refresh_token)
  if (user) {
    if (user.userId || user.user_id) sessionStorage.setItem('resq-user-id', user.userId ?? user.user_id)
    if (user.fullName || user.full_name) sessionStorage.setItem('resq-full-name', user.fullName ?? user.full_name)
    if (user.email) sessionStorage.setItem('resq-login-email', user.email)
    if (user.role) {
      // Backend uses SCREAMING_SNAKE_CASE roles; convert to frontend snake_case
      const roleMap = {
        DISPATCHER: 'dispatcher',
        FIELD_RESPONDER: 'field_responder',
        OPERATIONS_MANAGER: 'ops_manager',
        OPS_MANAGER: 'ops_manager',
        DISTRICT_COMMANDER: 'district_commander',
        EMERGENCY_PLANNER: 'emergency_planner',
        ANALYST: 'analyst',
        SUPER_ADMIN: 'super_admin',
      }
      const mapped = roleMap[user.role] ?? user.role.toLowerCase()
      sessionStorage.setItem('resq-demo-role', mapped)
    }
    if (user.districtId || user.district_id) sessionStorage.setItem('resq-district-id', user.districtId ?? user.district_id)
    if (user.agencyId || user.agency_id) sessionStorage.setItem('resq-agency-id', user.agencyId ?? user.agency_id)
  }
}

export function getAccessToken() {
  return sessionStorage.getItem('resq-jwt') || null
}

export function getRefreshToken() {
  return sessionStorage.getItem('resq-refresh-token') || null
}

function getDefaultDisplayName(role) {
  const defaults = {
    dispatcher: 'Jean Bosco',
    super_admin: 'System Admin',
    ops_manager: 'Ops Manager',
    district_commander: 'District Commander',
    emergency_planner: 'Emergency Planner',
    field_responder: 'Field Responder',
    analyst: 'Analyst',
  }
  return defaults[role] || 'User'
}

export function getCurrentUser() {
  const role = getDemoRole()
  if (!role) return null
  return {
    user_id: sessionStorage.getItem('resq-user-id') || 'demo-user-uuid',
    full_name: sessionStorage.getItem('resq-full-name') || getDefaultDisplayName(role),
    email: sessionStorage.getItem('resq-login-email') || '',
    role,
    district_id: sessionStorage.getItem('resq-district-id') || null,
    agency_id: sessionStorage.getItem('resq-agency-id') || null,
    mfa_enabled: sessionStorage.getItem('resq-mfa-enabled') === 'true',
  }
}

export function getPortalForRole(role) {
  return ASSIGNED_ROLES.find((r) => r.value === role)?.portal || '/login'
}

export function navigatePortal(role, navigate) {
  navigate(getPortalForRole(role))
}

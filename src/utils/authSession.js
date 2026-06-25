import { ASSIGNED_ROLES } from '../data/mockAuthData'

export function getDemoRole() {
  return sessionStorage.getItem('resq-demo-role') || null
}

export function setDemoRole(role) {
  sessionStorage.setItem('resq-demo-role', role)
}

/** Clears every resq-* key from sessionStorage. Call on logout. */
export function logout() {
  const keys = Object.keys(sessionStorage).filter((k) => k.startsWith('resq-'))
  keys.forEach((k) => sessionStorage.removeItem(k))
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

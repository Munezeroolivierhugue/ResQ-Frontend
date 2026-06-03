import { ASSIGNED_ROLES } from '../data/mockAuthData'

export function getDemoRole() {
  return sessionStorage.getItem('resq-demo-role') || 'dispatcher'
}

export function setDemoRole(role) {
  sessionStorage.setItem('resq-demo-role', role)
}

export function getPortalForRole(role) {
  if (role === 'admin') return '/admin/dashboard'
  return ASSIGNED_ROLES.find((r) => r.value === role)?.portal || '/dispatcher'
}

export function navigatePortal(role, navigate) {
  navigate(getPortalForRole(role))
}

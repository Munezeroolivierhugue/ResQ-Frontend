import { Navigate, Outlet } from 'react-router-dom'

/** Restricts dispatcher-only routes (e.g. dispatch-immediate). */
export default function DispatcherRoute() {
  const role = sessionStorage.getItem('resq-demo-role') || 'dispatcher'
  if (role !== 'dispatcher') {
    return <Navigate to={role === 'admin' ? '/admin' : '/login'} replace />
  }
  return <Outlet />
}

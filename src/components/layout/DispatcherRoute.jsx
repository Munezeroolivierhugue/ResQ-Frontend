import { Navigate, Outlet } from 'react-router-dom'
import { getDemoRole } from '../../utils/authSession'

/** Restricts dispatcher-only routes (e.g. dispatch-immediate). */
export default function DispatcherRoute() {
  const role = getDemoRole()
  if (role !== 'dispatcher') {
    if (role === 'super_admin' || role === 'admin') return <Navigate to="/admin/dashboard" replace />
    if (role === 'ops_manager' || role === 'operations_manager') {
      return <Navigate to="/ops-manager/dashboard" replace />
    }
    if (role === 'district_commander') {
      return <Navigate to="/district-commander/dashboard" replace />
    }
    if (role === 'field_responder') {
      return <Navigate to="/field-responder/shift-start" replace />
    }
    if (role === 'emergency_planner') return <Navigate to="/planner/dashboard" replace />
    if (role === 'analyst') return <Navigate to="/analyst/dashboard" replace />
    return <Navigate to="/login" replace />
  }
  return <Outlet />
}

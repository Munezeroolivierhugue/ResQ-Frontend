import { Navigate, Outlet } from 'react-router-dom'
import { getDemoRole } from '../../utils/authSession'

export default function OpsManagerRoute() {
  const role = getDemoRole()
  if (role !== 'ops_manager' && role !== 'operations_manager') {
    if (role === 'admin') return <Navigate to="/admin" replace />
    if (role === 'dispatcher') return <Navigate to="/dispatcher" replace />
    return <Navigate to="/login" replace />
  }
  return <Outlet />
}

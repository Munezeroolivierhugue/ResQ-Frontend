import { Navigate, Outlet } from 'react-router-dom'
import { getDemoRole } from '../../utils/authSession'

export default function DistrictCommanderRoute() {
  const role = getDemoRole()
  if (role !== 'district_commander') {
    if (role === 'admin') return <Navigate to="/admin" replace />
    if (role === 'ops_manager' || role === 'operations_manager') {
      return <Navigate to="/ops-manager/dashboard" replace />
    }
    if (role === 'dispatcher') return <Navigate to="/dispatcher" replace />
    return <Navigate to="/login" replace />
  }
  return <Outlet />
}

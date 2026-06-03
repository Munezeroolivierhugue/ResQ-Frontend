import { Navigate, Outlet } from 'react-router-dom'
import { getDemoRole } from '../../utils/authSession'

export default function FieldResponderRoute() {
  const role = getDemoRole()
  if (role !== 'field_responder') {
    if (role === 'admin') return <Navigate to="/admin" replace />
    if (role === 'district_commander') {
      return <Navigate to="/district-commander/dashboard" replace />
    }
    if (role === 'ops_manager' || role === 'operations_manager') {
      return <Navigate to="/ops-manager/dashboard" replace />
    }
    if (role === 'dispatcher') return <Navigate to="/dispatcher" replace />
    if (role === 'emergency_planner') return <Navigate to="/planner/dashboard" replace />
    return <Navigate to="/login" replace />
  }
  return <div className="field-responder-page"><Outlet /></div>
}

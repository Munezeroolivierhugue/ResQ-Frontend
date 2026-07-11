import { Navigate, Outlet } from "react-router-dom";
import { getDemoRole } from "../../utils/authSession";

export default function OpsManagerRoute() {
  const role = getDemoRole();
  if (role !== "OPERATIONS_MANAGER" && role !== "operations_manager") {
    if (role === "super_admin")
      return <Navigate to="/admin/dashboard" replace />;
    if (role === "district_commander")
      return <Navigate to="/district-commander/dashboard" replace />;
    if (role === "field_responder")
      return <Navigate to="/field-responder/shift-start" replace />;
    if (role === "emergency_planner")
      return <Navigate to="/planner/dashboard" replace />;
    if (role === "analyst") return <Navigate to="/analyst/dashboard" replace />;
    if (role === "dispatcher") return <Navigate to="/dispatcher" replace />;
    return <Navigate to="/login" replace />;
  }
  return <Outlet />;
}

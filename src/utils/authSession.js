import { ASSIGNED_ROLES } from "../data/mockAuthData";
import { useFieldResponderStore } from "../store/fieldResponderStore";

export function getDemoRole() {
  return sessionStorage.getItem("resq-demo-role") || null;
}

export function setDemoRole(role) {
  sessionStorage.setItem("resq-demo-role", role);
}

/** Clears every resq-* key from sessionStorage. */
export function clearSession() {
  const keys = Object.keys(sessionStorage).filter((k) => k.startsWith("resq-"));
  keys.forEach((k) => sessionStorage.removeItem(k));
}

/** Clears every resq-* key from sessionStorage. Call on logout. */
export function logout() {
  clearSession();
  // fieldResponderStore persists vehicleId/incidentId/assignment flags to a
  // global (not per-user) localStorage key — without this, a different field
  // responder logging in on the same device would inherit the previous
  // user's stale assignment state.
  useFieldResponderStore.getState().resetForNewUser();
  useFieldResponderStore.persist.clearStorage();
}

/** Write JWT session after login. user can be null to keep existing. */
export function setSession({ access_token, refresh_token, user }) {
  if (access_token) sessionStorage.setItem("resq-jwt", access_token);
  if (refresh_token)
    sessionStorage.setItem("resq-refresh-token", refresh_token);
  if (user) {
    if (user.userId || user.user_id)
      sessionStorage.setItem("resq-user-id", user.userId ?? user.user_id);
    if (user.fullName || user.full_name)
      sessionStorage.setItem("resq-full-name", user.fullName ?? user.full_name);
    if (user.email) sessionStorage.setItem("resq-login-email", user.email);
    if (user.role) {
      // Backend uses SCREAMING_SNAKE_CASE roles; convert to frontend snake_case
      const roleMap = {
        DISPATCHER: "dispatcher",
        FIELD_RESPONDER: "field_responder",
        OPERATIONS_MANAGER: "OPERATIONS_MANAGER",
        OPERATIONS_MANAGER: "OPERATIONS_MANAGER",
        DISTRICT_COMMANDER: "district_commander",
        EMERGENCY_PLANNER: "emergency_planner",
        ANALYST: "analyst",
        SUPER_ADMIN: "super_admin",
      };
      const mapped = roleMap[user.role] ?? user.role.toLowerCase();
      sessionStorage.setItem("resq-demo-role", mapped);
    }
    if (user.districtId || user.district_id)
      sessionStorage.setItem(
        "resq-district-id",
        user.districtId ?? user.district_id,
      );
    if (user.districtName || user.district_name)
      sessionStorage.setItem(
        "resq-district-name",
        user.districtName ?? user.district_name,
      );
    if (user.agencyId || user.agency_id)
      sessionStorage.setItem("resq-agency-id", user.agencyId ?? user.agency_id);
    if (user.agencyName || user.agency_name)
      sessionStorage.setItem(
        "resq-agency-name",
        user.agencyName ?? user.agency_name,
      );
    if (user.agencyType || user.agency_type)
      sessionStorage.setItem(
        "resq-agency-type",
        user.agencyType ?? user.agency_type,
      );
  }
  // fieldResponderStore's localStorage-persisted vehicleId/incidentId is not
  // cleared just because a fresh sessionStorage session started here (e.g.
  // a new tab, or logging back in without ever hitting logout()) — re-check
  // ownership on every login so a different account never inherits stale
  // assignment state left over from a previous responder on this device.
  useFieldResponderStore.getState().checkSessionOwner();
}

export function getAccessToken() {
  return sessionStorage.getItem("resq-jwt") || null;
}

export function getRefreshToken() {
  return sessionStorage.getItem("resq-refresh-token") || null;
}

function getDefaultDisplayName(role) {
  const defaults = {
    dispatcher: "Jean Bosco",
    super_admin: "System Admin",
    OPERATIONS_MANAGER: "Ops Manager",
    district_commander: "District Commander",
    emergency_planner: "Emergency Planner",
    field_responder: "Field Responder",
    analyst: "Analyst",
  };
  return defaults[role] || "User";
}

export function getCurrentUser() {
  const role = getDemoRole();
  if (!role) return null;
  return {
    user_id: sessionStorage.getItem("resq-user-id") || "demo-user-uuid",
    full_name:
      sessionStorage.getItem("resq-full-name") || getDefaultDisplayName(role),
    email: sessionStorage.getItem("resq-login-email") || "",
    role,
    district_id: sessionStorage.getItem("resq-district-id") || null,
    district_name: sessionStorage.getItem("resq-district-name") || null,
    agency_id: sessionStorage.getItem("resq-agency-id") || null,
    agency_name: sessionStorage.getItem("resq-agency-name") || null,
    agency_type: sessionStorage.getItem("resq-agency-type") || null,
    mfa_enabled: sessionStorage.getItem("resq-mfa-enabled") === "true",
  };
}

// Only RNP/police field responders file incident reports and see performance
// stats — a responder on a non-police agency vehicle (e.g. an ambulance from
// a hospital EMS agency, a fire truck) gets full field-responder functionality
// otherwise (map, assignment, navigation, on-scene) but not these two.
export function canFileFieldReports() {
  const user = getCurrentUser();
  if (!user) return false;
  // No agency on record (e.g. legacy/seed accounts) defaults to allowed, so
  // this only restricts responders with a known non-police agency.
  return !user.agency_type || user.agency_type === "POLICE";
}

export function getPortalForRole(role) {
  return ASSIGNED_ROLES.find((r) => r.value === role)?.portal || "/login";
}

export function navigatePortal(role, navigate) {
  navigate(getPortalForRole(role));
}

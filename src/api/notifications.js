import api from "../lib/apiClient";
import { getCurrentUser } from "../utils/authSession";

const ROLE_HREF = {
  DISPATCHER: {
    INCIDENT: "/dispatcher/active-incident",
    DISPATCH: "/dispatcher/active-incident",
    AI_RECOMMENDATION: "/dispatcher/ai-engine",
    UNIT_OFFLINE: "/dispatcher",
    SHIFT: "/dispatcher/shift-handover",
    USER_INVITED: null,
    // Notifications don't carry a structured incidentId today (just a
    // message string), so we can't deep-link straight to this incident's
    // closure form — Pending Reports already lists every PENDING_REPORT
    // incident and its "File Report" button correctly passes the specific
    // incident to /dispatcher/incident-report via route state.
    FIELD_REPORT_SUBMITTED: "/dispatcher/pending-reports",
  },
  OPERATIONS_MANAGER: {
    INCIDENT: "/ops-manager/incidents",
    DISPATCH: "/ops-manager/incidents",
    AI_RECOMMENDATION: "/ops-manager",
    UNIT_OFFLINE: "/ops-manager",
    SHIFT: "/ops-manager/shift-reports",
    USER_INVITED: null,
    // Same limitation as FIELD_REPORT_SUBMITTED above — the notification
    // carries only a message string, no structured incidentId — so this
    // routes to the list of closed incidents rather than guessing which one.
    INCIDENT_CLOSED: "/ops-manager/closed-incidents",
    INCIDENT_ESCALATED: "/ops-manager/escalations",
    BACKUP_REQUESTED: "/ops-manager/dashboard",
  },
  ADMIN: {
    USER_INVITED: "/admin/users",
    INCIDENT: "/admin/incidents",
    DISPATCH: "/admin/incidents",
    AI_RECOMMENDATION: null,
    UNIT_OFFLINE: null,
    SHIFT: null,
  },
  SUPER_ADMIN: {
    USER_INVITED: "/admin/users",
    INCIDENT: "/admin/incidents",
    DISPATCH: "/admin/incidents",
    AI_RECOMMENDATION: null,
    UNIT_OFFLINE: null,
    SHIFT: null,
  },
  DISTRICT_COMMANDER: {
    INCIDENT: "/district-commander/incidents",
    DISPATCH: "/district-commander/incidents",
    AI_RECOMMENDATION: null,
    UNIT_OFFLINE: "/district-commander",
    SHIFT: "/district-commander/shift-reports",
    USER_INVITED: null,
  },
  ANALYST: {
    INCIDENT: "/analyst/incidents",
    DISPATCH: "/analyst/incidents",
    AI_RECOMMENDATION: "/analyst/ai-recommendations",
    UNIT_OFFLINE: null,
    SHIFT: null,
    USER_INVITED: null,
  },
  PLANNER: {
    INCIDENT: null,
    DISPATCH: null,
    AI_RECOMMENDATION: "/planner/ai",
    UNIT_OFFLINE: null,
    SHIFT: null,
    USER_INVITED: null,
  },
  FIELD_RESPONDER: {
    INCIDENT: "/field-responder/current-incident",
    DISPATCH: "/field-responder/current-incident",
    AI_RECOMMENDATION: null,
    UNIT_OFFLINE: null,
    SHIFT: "/field-responder/shift-start",
    USER_INVITED: null,
  },
};

export function resolveHref(type, referenceId) {
  const role = getCurrentUser()?.role;
  // FIELD_REPORT_SUBMITTED carries a real incidentId as referenceId — deep-link
  // straight to that row on Pending Reports (it already supports scrolling to
  // and highlighting a specific incident via route state, reused as-is).
  if (type === "FIELD_REPORT_SUBMITTED" && referenceId && role === "DISPATCHER") {
    return { pathname: "/dispatcher/pending-reports", state: { completedIncident: { incident_id: referenceId } } };
  }
  return ROLE_HREF[role]?.[type] ?? null;
}

function getHref(type, referenceId) {
  return resolveHref(type, referenceId);
}

function transform(n) {
  return {
    id: n.notificationId,
    type: n.type,
    title: n.message?.split(": ")[0] ?? n.message ?? "",
    desc: n.message?.split(": ").slice(1).join(": ") ?? "",
    time: n.createdAt,
    read: n.read,
    priority: n.priority,
    href: getHref(n.type, n.referenceId),
    referenceId: n.referenceId ?? null,
    actorName: n.actorName ?? null,
    actorPhotoUrl: n.actorPhotoUrl ?? null,
    details: null,
  };
}

export async function listNotifications(unreadOnly = false) {
  const { data } = await api.get("/api/notifications", {
    params: unreadOnly ? { unreadOnly: true } : {},
  });
  return (data.data ?? data).map(transform);
}

export async function markNotificationRead(id) {
  const { data } = await api.patch(`/api/notifications/${id}/read`);
  return transform(data.data ?? data);
}

export async function markAllNotificationsRead() {
  await api.patch("/api/notifications/read-all");
}

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

export function resolveHref(type) {
  const role = getCurrentUser()?.role;
  return ROLE_HREF[role]?.[type] ?? null;
}

function getHref(type) {
  return resolveHref(type);
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
    href: getHref(n.type),
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

import { useEffect, useState } from "react";
import { Link, useParams, useSearchParams } from "react-router-dom";
import { MapContainer, TileLayer, CircleMarker, Tooltip } from "react-leaflet";
import { Building2, Megaphone, X } from "lucide-react";
import { useThemeStore } from "../../store/themeStore";
import RwandaBoundsEnforcer from "../../components/map/RwandaBoundsEnforcer";
import {
  RWANDA_BOUNDS,
  RWANDA_MIN_ZOOM,
  RWANDA_MAX_ZOOM,
} from "../../components/map/rwandaConstants";
import StatusBadge from "../../components/dispatcher/StatusBadge";
import {
  getEscalationDetail,
  OPS_AGENCIES,
} from "../../data/mockOpsManagerData";
import { createBroadcast } from "../../api/broadcasts";
import { mockAgencyInvolvements } from "../../data/mockAgencyInvolvements";
import { mockIncidents } from "../../data/mockIncidents";
import { generateUuid } from "../../utils/formHelpers";
import { getCurrentUser } from "../../utils/authSession";
import { useNotificationsStore } from "../../store/notificationsStore";
import DispatchUnitsModal from "../../components/ops-manager/DispatchUnitsModal";
import { getIncident } from "../../api/incidents";
import { listDispatchesForIncident } from "../../api/dispatches";
import { listVehicles } from "../../api/vehicles";
import { getReportForIncident } from "../../api/fieldReports";
import { formatIncidentType } from "../../utils/incidentTypeLabels";
import { useToastStore } from "../../store/toastStore";
import "leaflet/dist/leaflet.css";

const NON_RNP_AGENCIES = OPS_AGENCIES.filter((a) => a.id !== "rnp");
const TERMINAL_STATUSES = new Set(["RESOLVED", "PENDING_REPORT", "CLOSED"]);

export default function OpsManagerEscalation() {
  const { incidentId } = useParams();
  const [searchParams] = useSearchParams();
  // "View Only" from the Dashboard/Escalation Command queue should be
  // exactly that — no command actions available. Previously "View Only" and
  // "Take Command" both linked to this same page with no distinction at all.
  const readOnly = searchParams.get("readOnly") === "1";
  const { theme } = useThemeStore();
  const addNotification = useNotificationsStore((s) => s.addNotification);
  const detail = getEscalationDetail(incidentId);

  // Real field report for this incident, if one has been submitted yet —
  // replaces a fabricated multi-event "field updates" timeline that never
  // reflected anything an actual field responder wrote.
  const [realReport, setRealReport] = useState(null);
  const [reportChecked, setReportChecked] = useState(false);
  useEffect(() => {
    getReportForIncident(incidentId)
      .then(setRealReport)
      .catch(() => setRealReport(null))
      .finally(() => setReportChecked(true));
  }, [incidentId]);

  const [realIncident, setRealIncident] = useState(null);
  useEffect(() => {
    getIncident(incidentId).then(setRealIncident).catch(() => {});
  }, [incidentId]);

  const incidentData = mockIncidents.find((i) => i.incident_ref === detail.id);
  const incidentUuid = realIncident?.incident_id || incidentData?.incident_id || detail.id;
  const incidentRef = realIncident?.incident_ref || detail.id;
  const isClosed = realIncident?.status && TERMINAL_STATUSES.has(realIncident.status);

  // Real elapsed time since the incident was actually called in — was a
  // hardcoded useState(1542) ticking up from a fake starting point on every
  // page load, regardless of how long the incident had actually been open.
  const [elapsed, setElapsed] = useState(0);
  useEffect(() => {
    const startTime = realIncident?.call_time ? new Date(realIncident.call_time).getTime() : null;
    if (!startTime || isClosed) return;
    const tick = () => setElapsed(Math.max(0, Math.floor((Date.now() - startTime) / 1000)));
    tick();
    const t = setInterval(tick, 1000);
    return () => clearInterval(t);
  }, [realIncident?.call_time, isClosed]);

  // Responding units were always the mock detail.units array regardless of
  // which real incident was open — every escalation showed the same fake
  // 2-3 units at fixed coordinates. Real dispatches for this incident,
  // enriched with each vehicle's live position/status/type, same pattern
  // ActiveIncident.jsx already uses on the dispatcher side.
  const [realUnits, setRealUnits] = useState([]);
  useEffect(() => {
    if (!incidentUuid || incidentUuid === detail.id) return; // still waiting on realIncident
    Promise.all([listDispatchesForIncident(incidentUuid), listVehicles()])
      .then(([dispatches, vehicles]) => {
        const vehicleMap = new Map(vehicles.map((v) => [v.vehicle_id, v]));
        setRealUnits(dispatches.map((d) => {
          const v = vehicleMap.get(d.vehicle_id) ?? {};
          return {
            id: d.vehicle_plate ?? v.plate_number ?? d.vehicle_id,
            type: v.vehicle_type ?? "Unit",
            status: (v.status ?? "—").toUpperCase(),
            isBackup: d.override_reason === "backup_request",
            eta_minutes: d.eta_minutes,
            lat: v.current_lat,
            lng: v.current_lng,
          };
        }));
      })
      .catch(() => {});
  }, [incidentUuid, detail.id]);
  const unitsWithPos = realUnits.filter((u) => u.lat != null && u.lng != null);

  // Broadcast state
  const [broadcastOpen, setBroadcastOpen] = useState(false);
  const [broadcastMsg, setBroadcastMsg] = useState("");
  const [broadcastPriority, setBroadcastPriority] = useState("NORMAL");

  // Dispatch modal state
  const [dispatchOpen, setDispatchOpen] = useState(false);

  // Notify agency state
  const [notifyOpen, setNotifyOpen] = useState(false);
  const [selectedAgency, setSelectedAgency] = useState(null);

  const pushToast = useToastStore((s) => s.pushToast);
  const setToast = (msg, variant = "success") => {
    if (!msg) return;
    pushToast({ variant, title: variant === "error" ? "Error" : "Escalation", message: msg });
  };

  const formatElapsed = (s) => {
    const h = Math.floor(s / 3600);
    const m = Math.floor((s % 3600) / 60);
    const sec = s % 60;
    return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}:${String(sec).padStart(2, "0")}`;
  };

  const handleBroadcast = async () => {
    if (!broadcastMsg.trim()) return;
    try {
      // Real persisted broadcast, scoped to this ops manager's own district
      // — previously only pushed into a local, in-memory mock array with a
      // notification visible on the sender's own screen only, so nothing
      // was actually delivered to anyone.
      await createBroadcast({
        message: `${incidentRef}: ${broadcastMsg}`,
        priority: broadcastPriority,
        target_area: getCurrentUser()?.district_name ?? "ALL_UNITS",
      });
    } catch {
      setToast("Could not send broadcast — check your connection and try again.", "error");
      return;
    }
    setBroadcastMsg("");
    setBroadcastPriority("NORMAL");
    setBroadcastOpen(false);
    setToast("Broadcast sent to geographic zone");
  };

  const handleNotifyAgency = () => {
    if (!selectedAgency) return;
    mockAgencyInvolvements.push({
      involvement_id: generateUuid(),
      incident_id: incidentUuid,
      agency_id: selectedAgency.agency_id,
      status: "NOTIFIED",
      activated_at: new Date().toISOString(),
    });
    addNotification({
      id: `ag-${Date.now()}`,
      type: "AGENCY_NOTIFIED",
      title: `${selectedAgency.name} Notified`,
      desc: `Agency alerted for incident ${detail.id}`,
      time: "Just now",
      read: false,
      href: "#escalation",
      target_role: null,
    });
    setNotifyOpen(false);
    setSelectedAgency(null);
    setToast(`${selectedAgency.name} notified`);
  };

  return (
    <div className="portal-page portal-split-60-40 min-h-full relative">
      <DispatchUnitsModal
        isOpen={dispatchOpen}
        incidentId={incidentUuid}
        incidentRef={incidentRef}
        // Ops Manager should only ever see/dispatch units from their own
        // district, not every district system-wide.
        districtId={getCurrentUser()?.district_id}
        onClose={() => setDispatchOpen(false)}
        onConfirm={(units) =>
          setToast(
            `${units.length} unit${units.length > 1 ? "s" : ""} dispatched to ${incidentRef}`,
          )
        }
      />

      {notifyOpen && (
        <div
          // Same Leaflet-vs-modal z-index conflict as DispatchUnitsModal —
          // this page's live map panes render above z-50, so the map bled
          // through this modal instead of being fully hidden behind it.
          className="fixed inset-0 z-[9999] flex items-center justify-center"
          style={{ background: "rgba(0,0,0,0.45)" }}
          onClick={() => setNotifyOpen(false)}
        >
          <div
            className="dispatcher-surface p-5 max-w-sm w-full mx-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold text-[14px] m-0">Notify Agency</h3>
              <button
                type="button"
                className="bg-transparent border-none cursor-pointer text-(--text-muted)"
                onClick={() => setNotifyOpen(false)}
              >
                <X size={18} />
              </button>
            </div>
            <p className="text-[12px] text-(--text-secondary) m-0 mb-3">
              Incident:{" "}
              <span className="font-mono text-(--accent)">{detail.id}</span>
            </p>
            <div className="flex flex-col gap-2">
              {NON_RNP_AGENCIES.map((a) => (
                <label
                  key={a.id}
                  className="flex items-center gap-3 cursor-pointer p-2 rounded hover:bg-(--bg-elevated)"
                >
                  <input
                    type="radio"
                    name="agency"
                    className="accent-(--accent)"
                    checked={selectedAgency?.id === a.id}
                    onChange={() => setSelectedAgency(a)}
                  />
                  <div>
                    <div className="text-[13px] font-semibold">{a.name}</div>
                    <div className="text-[11px] text-(--text-muted)">
                      {a.units} units · {a.status}
                    </div>
                  </div>
                </label>
              ))}
            </div>
            <div className="flex gap-2 mt-4">
              <button
                type="button"
                className="dispatcher-btn-primary flex-1 text-[12px]"
                onClick={handleNotifyAgency}
                disabled={!selectedAgency}
              >
                Notify Agency
              </button>
              <button
                type="button"
                className="dispatcher-btn-ghost text-[12px]"
                onClick={() => {
                  setNotifyOpen(false);
                  setSelectedAgency(null);
                }}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="flex flex-col gap-4 min-w-0">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <div className="text-(--accent) font-mono font-bold text-[14px]">
              {readOnly ? "VIEWING" : "COMMANDING"}: {incidentRef}
              {realIncident?.incident_type && ` — ${formatIncidentType(realIncident.incident_type)}`}
            </div>
            <div className="flex items-center gap-2 mt-1">
              <StatusBadge
                label={(realIncident?.severity ?? detail.reassessment.severity ?? '').toString().toUpperCase()}
                variant="critical"
              />
              <span className="text-[13px] text-(--text-secondary)">
                {realIncident?.district ?? realIncident?.address ?? detail.location}
              </span>
            </div>
            <div className="text-[2rem] font-mono font-bold text-(--accent) mt-2">
              {isClosed ? (
                <span style={{ color: "var(--status-low)" }}>CLOSED</span>
              ) : (
                formatElapsed(elapsed)
              )}
            </div>
          </div>
        </div>

        <div
          className="dispatcher-surface overflow-hidden"
          style={{ height: 280 }}
        >
          <MapContainer
            center={[realIncident?.lat ?? detail.lat, realIncident?.lng ?? detail.lng]}
            zoom={15}
            minZoom={RWANDA_MIN_ZOOM}
            maxZoom={RWANDA_MAX_ZOOM}
            maxBounds={RWANDA_BOUNDS}
            style={{ width: "100%", height: "100%" }}
          >
            <TileLayer
              url={
                theme === "dark"
                  ? "https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
                  : "https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png"
              }
            />
            <RwandaBoundsEnforcer />
            <CircleMarker
              center={[realIncident?.lat ?? detail.lat, realIncident?.lng ?? detail.lng]}
              radius={10}
              pathOptions={{
                fillColor: "var(--status-critical)",
                color: "var(--bg-surface)",
                fillOpacity: 1,
                weight: 2,
              }}
            >
              <Tooltip>{incidentRef}</Tooltip>
            </CircleMarker>
            {unitsWithPos.map((u) => (
              <CircleMarker
                key={u.id}
                center={[u.lat, u.lng]}
                radius={6}
                pathOptions={{
                  fillColor: "var(--accent)",
                  color: "var(--bg-surface)",
                  fillOpacity: 1,
                  weight: 1.5,
                }}
              >
                <Tooltip>{u.id}</Tooltip>
              </CircleMarker>
            ))}
          </MapContainer>
        </div>

        <div className="dispatcher-surface p-4">
          <div className="font-bold text-[13px] mb-3">
            Field Report{realReport?.vehicle_plate ? ` — ${realReport.vehicle_plate}` : ""}
          </div>
          {!reportChecked && (
            <p className="text-[12px] text-(--text-muted) m-0">Loading…</p>
          )}
          {reportChecked && !realReport && (
            <p className="text-[12px] text-(--text-muted) m-0">No field report submitted yet.</p>
          )}
          {realReport && (
            <div className="flex flex-col gap-2 text-[12px]">
              <div className="flex justify-between">
                <span className="text-(--text-secondary)">Scene status</span>
                <span className="font-semibold">{realReport.scene_status ?? "—"}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-(--text-secondary)">Persons involved</span>
                <span className="font-semibold">{realReport.persons_involved ?? "—"}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-(--text-secondary)">Injuries</span>
                <span className="font-semibold">{realReport.injuries ?? "—"}</span>
              </div>
              {realReport.description && (
                <p className="text-(--text-secondary) m-0 pt-2 border-t border-(--border-subtle)">
                  {realReport.description}
                </p>
              )}
              {realReport.submitted_at && (
                <span className="text-(--text-muted) text-[11px]">
                  Submitted {new Date(realReport.submitted_at).toLocaleString()}
                  {realReport.responder_name ? ` by ${realReport.responder_name}` : ""}
                </span>
              )}
            </div>
          )}
        </div>
      </div>

      <div className="flex flex-col gap-4 min-w-0">
        {readOnly ? (
          <div
            className="p-3 rounded-lg text-[12px] text-center"
            style={{ background: "var(--bg-elevated)", color: "var(--text-muted)" }}
          >
            View only — no command actions available from this screen.
          </div>
        ) : (
          <div className="flex flex-col gap-2">
            <button
              type="button"
              className="dispatcher-btn-primary w-full"
              onClick={() => setDispatchOpen(true)}
            >
              Dispatch Additional Units →
            </button>
            <button
              type="button"
              className="dispatcher-btn-ghost w-full flex items-center justify-center gap-2"
              onClick={() => setNotifyOpen(true)}
            >
              <Building2 size={16} /> Notify Agency
            </button>
            <button
              type="button"
              className="dispatcher-btn-ghost w-full flex items-center justify-center gap-2"
              onClick={() => setBroadcastOpen((v) => !v)}
            >
              <Megaphone size={16} /> Issue Geographic Broadcast
            </button>
            {broadcastOpen && (
              <div className="p-3 border border-(--border) rounded-lg flex flex-col gap-2">
                <label className="dispatcher-field">
                  <span className="field-label">Priority</span>
                  <select
                    className="dispatcher-input dispatcher-select"
                    value={broadcastPriority}
                    onChange={(e) => setBroadcastPriority(e.target.value)}
                  >
                    <option value="NORMAL">Normal</option>
                    <option value="URGENT">Urgent</option>
                    <option value="EMERGENCY">Emergency</option>
                  </select>
                </label>
                <label className="dispatcher-field">
                  <span className="field-label">Message</span>
                  <textarea
                    className="dispatcher-input dispatcher-textarea"
                    rows={3}
                    value={broadcastMsg}
                    onChange={(e) => setBroadcastMsg(e.target.value)}
                    placeholder="Broadcast message…"
                  />
                </label>
                <button
                  type="button"
                  className="dispatcher-btn-primary w-full text-[12px]"
                  onClick={handleBroadcast}
                  disabled={!broadcastMsg.trim()}
                >
                  Send Broadcast
                </button>
              </div>
            )}
          </div>
        )}

        <div className="dispatcher-surface p-4">
          <div className="font-bold text-[13px] mb-3">Responding Units</div>
          {realUnits.length === 0 ? (
            <p className="text-[12px] text-(--text-muted) m-0">No units dispatched yet.</p>
          ) : (
            realUnits.map((u) => (
              <div
                key={u.id}
                className="flex flex-wrap items-center gap-2 py-2 border-b border-(--border-subtle) text-[12px] last:border-0"
              >
                <span className="font-mono font-bold text-(--accent)">
                  {u.id}
                </span>
                {u.isBackup && (
                  <span
                    className="text-[9px] font-bold uppercase tracking-wide px-1.5 py-0.5 rounded"
                    style={{ background: "var(--status-medium-bg)", color: "var(--status-medium)" }}
                  >
                    Backup
                  </span>
                )}
                <span className="text-(--text-secondary)">· {u.type}</span>
                <StatusBadge
                  label={u.status}
                  variant={u.status === "ON_SCENE" ? "resolved" : "active"}
                />
                <span className="text-(--text-secondary)">
                  {u.eta_minutes != null ? `${u.eta_minutes} min` : "—"}
                </span>
                {u.lat != null && u.lng != null && (
                  <span className="font-mono text-(--text-muted) ml-auto text-[10px]">
                    {u.lat.toFixed(4)}, {u.lng.toFixed(4)}
                  </span>
                )}
              </div>
            ))
          )}
        </div>

        <Link
          to="/ops-manager/dashboard"
          className="text-[12px] text-(--accent) no-underline"
        >
          ← Back to Command Overview
        </Link>
      </div>
    </div>
  );
}

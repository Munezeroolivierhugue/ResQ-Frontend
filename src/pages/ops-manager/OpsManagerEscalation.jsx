import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { MapContainer, TileLayer, CircleMarker, Tooltip } from "react-leaflet";
import { Building2, Megaphone, ChevronsUp, X } from "lucide-react";
import { useThemeStore } from "../../store/themeStore";
import RwandaBoundsEnforcer from "../../components/map/RwandaBoundsEnforcer";
import {
  RWANDA_BOUNDS,
  RWANDA_MIN_ZOOM,
  RWANDA_MAX_ZOOM,
} from "../../components/map/rwandaConstants";
import StatusBadge from "../../components/dispatcher/StatusBadge";
import VerticalTimeline from "../../components/dispatcher/VerticalTimeline";
import {
  getEscalationDetail,
  OPS_AGENCIES,
} from "../../data/mockOpsManagerData";
import { mockBroadcasts } from "../../data/mockBroadcasts";
import { mockAgencyInvolvements } from "../../data/mockAgencyInvolvements";
import { mockAuditLogs } from "../../data/mockAuditLogs";
import { mockIncidents } from "../../data/mockIncidents";
import { generateUuid } from "../../utils/formHelpers";
import { getCurrentUser } from "../../utils/authSession";
import { useNotificationsStore } from "../../store/notificationsStore";
import DispatchUnitsModal from "../../components/ops-manager/DispatchUnitsModal";
import "leaflet/dist/leaflet.css";

const NON_RNP_AGENCIES = OPS_AGENCIES.filter((a) => a.id !== "rnp");

export default function OpsManagerEscalation() {
  const { incidentId } = useParams();
  const { theme } = useThemeStore();
  const addNotification = useNotificationsStore((s) => s.addNotification);
  const detail = getEscalationDetail(incidentId);
  const [elapsed, setElapsed] = useState(1542);

  const incidentData = mockIncidents.find((i) => i.incident_ref === detail.id);
  const incidentUuid = incidentData?.incident_id || detail.id;

  // Broadcast state
  const [broadcastOpen, setBroadcastOpen] = useState(false);
  const [broadcastMsg, setBroadcastMsg] = useState("");
  const [broadcastPriority, setBroadcastPriority] = useState("NORMAL");

  // Dispatch modal state
  const [dispatchOpen, setDispatchOpen] = useState(false);
  const [dispatchToast, setDispatchToast] = useState(null);

  // Notify agency state
  const [notifyOpen, setNotifyOpen] = useState(false);
  const [selectedAgency, setSelectedAgency] = useState(null);

  // Escalate to DC state
  const [dcEscalated, setDcEscalated] = useState(false);

  // Local toast
  const [toast, setToast] = useState(null);

  useEffect(() => {
    const t = setInterval(() => setElapsed((e) => e + 1), 1000);
    return () => clearInterval(t);
  }, []);

  useEffect(() => {
    if (!toast) return undefined;
    const t = setTimeout(() => setToast(null), 3500);
    return () => clearTimeout(t);
  }, [toast]);

  const formatElapsed = (s) => {
    const h = Math.floor(s / 3600);
    const m = Math.floor((s % 3600) / 60);
    const sec = s % 60;
    return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}:${String(sec).padStart(2, "0")}`;
  };

  const handleBroadcast = () => {
    if (!broadcastMsg.trim()) return;
    const cu = getCurrentUser();
    mockBroadcasts.push({
      broadcast_id: generateUuid(),
      sent_by: cu?.user_id || "demo-user-uuid",
      message: broadcastMsg,
      priority: broadcastPriority,
      target_area: "GEOGRAPHIC_ZONE",
      sent_at: new Date().toISOString(),
    });
    addNotification({
      id: `bc-${Date.now()}`,
      type: "BROADCAST",
      title: `Geographic Broadcast — ${detail.id}`,
      desc: broadcastMsg,
      time: "Just now",
      read: false,
      href: "#broadcast",
      target_role: "dispatcher",
    });
    setBroadcastMsg("");
    setBroadcastPriority("NORMAL");
    setBroadcastOpen(false);
    setToast("Broadcast sent to geographic zone");
  };

  const handleNotifyAgency = () => {
    if (!selectedAgency) return;
    const cu = getCurrentUser();
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

  const handleEscalateToBC = () => {
    if (dcEscalated) return;
    const cu = getCurrentUser();
    const ts = new Date().toISOString();
    mockAuditLogs.push({
      log_id: generateUuid(),
      user_id: cu?.user_id || "demo-user-uuid",
      timestamp: ts,
      action: `INCIDENT_ESCALATED_TO_DC: ${detail.id}`,
      module: "OPERATIONS_MANAGER",
      ip_address: null,
      status: "SUCCESS",
    });
    addNotification({
      id: `dc-${Date.now()}`,
      type: "ESCALATION_TO_DC",
      title: `Incident Escalated — ${detail.id}`,
      desc: `${detail.type} escalated to District Commander by Ops Manager`,
      time: "Just now",
      read: false,
      href: `/ops-manager/escalations/${detail.id}`,
      target_role: "district_commander",
      incident_id: incidentUuid,
    });
    setDcEscalated(true);
    setToast("Escalated to District Commander");
  };

  return (
    <div className="portal-page portal-split-60-40 min-h-full relative">
      {toast && (
        <div
          className="fixed top-20 right-6 z-50 max-w-sm px-4 py-3 rounded-lg border text-[13px] font-medium shadow-lg"
          style={{
            background: "var(--bg-surface)",
            borderColor: "var(--border)",
            color: "var(--text-primary)",
          }}
        >
          {toast}
        </div>
      )}

      <DispatchUnitsModal
        isOpen={dispatchOpen}
        incidentId={incidentUuid}
        incidentRef={detail.id}
        onClose={() => setDispatchOpen(false)}
        onConfirm={(units) =>
          setToast(
            `${units.length} unit${units.length > 1 ? "s" : ""} dispatched to ${detail.id}`,
          )
        }
      />

      {notifyOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center"
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
              COMMANDING: {detail.id}
            </div>
            <div className="flex items-center gap-2 mt-1">
              <StatusBadge
                label={detail.reassessment.severity}
                variant="critical"
              />
              <span className="text-[13px] text-(--text-secondary)">
                {detail.location}
              </span>
            </div>
            <div className="text-[2rem] font-mono font-bold text-(--accent) mt-2">
              {formatElapsed(elapsed)}
            </div>
          </div>
          <button
            type="button"
            className="dispatcher-btn-primary shrink-0 text-[11px]"
            style={{
              background: "var(--status-critical)",
              color: "var(--text-on-accent)",
            }}
            onClick={handleEscalateToBC}
            disabled={dcEscalated}
          >
            {dcEscalated ? "ESCALATED ✓" : "ESCALATE TO DISTRICT COMMANDER"}
          </button>
        </div>

        <div
          className="dispatcher-surface overflow-hidden"
          style={{ height: 280 }}
        >
          <MapContainer
            center={[detail.lat, detail.lng]}
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
              center={[detail.lat, detail.lng]}
              radius={10}
              pathOptions={{
                fillColor: "var(--status-critical)",
                color: "var(--bg-surface)",
                fillOpacity: 1,
                weight: 2,
              }}
            >
              <Tooltip>{detail.id}</Tooltip>
            </CircleMarker>
            {detail.units.map((u) => (
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
            Field Report — {detail.fieldReportUnit}
          </div>
          <VerticalTimeline
            events={detail.fieldUpdates.map((u, i) => ({
              id: u.id,
              time: u.time,
              title: u.title,
              description: u.description,
              active: i === 0,
            }))}
          />
        </div>
      </div>

      <div className="flex flex-col gap-4 min-w-0">
        <div className="dispatcher-surface p-4">
          <div className="text-[10px] font-mono text-(--text-muted) uppercase tracking-wider mb-2">
            AI REASSESSMENT — UPDATED {detail.reassessment.updated}
          </div>
          <StatusBadge
            label={detail.reassessment.severity}
            variant="critical"
          />
          <p className="text-[13px] text-(--text-secondary) mt-3 m-0">
            <strong className="text-(--text-primary)">
              Recommended additional units:
            </strong>{" "}
            {detail.reassessment.additionalUnits}
          </p>
          <p className="text-[13px] text-(--text-secondary) mt-2 m-0">
            <strong className="text-(--text-primary)">
              Predicted duration:
            </strong>{" "}
            {detail.reassessment.duration}
          </p>
          <p className="text-[13px] text-(--text-secondary) mt-2 m-0">
            <strong className="text-(--text-primary)">Key risk:</strong>{" "}
            {detail.reassessment.risk}
          </p>
        </div>

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
          <button
            type="button"
            className="w-full flex items-center justify-center gap-2 py-2.5 rounded-lg font-semibold text-[13px] border cursor-pointer"
            style={{
              border: dcEscalated
                ? "1px solid var(--status-low)"
                : "1px solid var(--status-critical)",
              color: dcEscalated
                ? "var(--status-low)"
                : "var(--status-critical)",
              background: dcEscalated
                ? "var(--status-low-bg)"
                : "var(--status-critical-bg)",
            }}
            onClick={handleEscalateToBC}
            disabled={dcEscalated}
          >
            <ChevronsUp size={16} />{" "}
            {dcEscalated
              ? "Escalated to District Commander ✓"
              : "Escalate to District Commander"}
          </button>
        </div>

        <div className="dispatcher-surface p-4">
          <div className="font-bold text-[13px] mb-3">Responding Units</div>
          {detail.units.map((u) => (
            <div
              key={u.id}
              className="flex flex-wrap items-center gap-2 py-2 border-b border-(--border-subtle) text-[12px] last:border-0"
            >
              <span className="font-mono font-bold text-(--accent)">
                {u.id}
              </span>
              <span className="text-(--text-secondary)">· {u.type}</span>
              <StatusBadge
                label={u.status}
                variant={u.status === "ON SCENE" ? "resolved" : "active"}
              />
              <span className="text-(--text-secondary)">
                {u.eta_minutes != null ? `${u.eta_minutes} min` : "On scene"}
              </span>
              <span className="font-mono text-(--text-muted) ml-auto text-[10px]">
                {u.lat.toFixed(4)}, {u.lng.toFixed(4)}
              </span>
            </div>
          ))}
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

import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  ClipboardList,
  Clock,
  AlertTriangle,
  X,
  CheckCircle,
  Radio,
  ShieldAlert,
} from "lucide-react";
import MetricCard from "../../components/dispatcher/MetricCard";
import SectionTitle from "../../components/dispatcher/SectionTitle";
import StatusBadge from "../../components/dispatcher/StatusBadge";
import { useOpsManagerStore } from "../../store/opsManagerStore";
import { useNotificationsStore } from "../../store/notificationsStore";
import OpsManagerReviewModal from "../../components/ops-manager/OpsManagerReviewModal";
import MutualAidOfferModal from "../../components/dispatcher/MutualAidOfferModal";
import OpsManagerDistrictLabel from "../../components/ops-manager/OpsManagerDistrictLabel";
import OpsManagerMissedCallsPanel from "../../components/ops-manager/OpsManagerMissedCallsPanel";
import DispatchUnitsModal from "../../components/ops-manager/DispatchUnitsModal";
import { listBackupRequests, acknowledgeBackupRequest } from "../../api/backup-requests";
import { listVehicles } from "../../api/vehicles";
import { listIncidents } from "../../api/incidents";
import { getCurrentUser } from "../../utils/authSession";
import { formatIncidentType } from "../../utils/incidentTypeLabels";
import { useToastStore } from "../../store/toastStore";

const TERMINAL_STATUSES = new Set(["RESOLVED", "PENDING_REPORT", "CLOSED"]);

function timeAgo(isoString) {
  const diffMs = Date.now() - new Date(isoString).getTime();
  const diffMin = Math.floor(diffMs / 60000);
  if (diffMin < 1) return "Just now";
  if (diffMin < 60) return `${diffMin}m ago`;
  return `${Math.floor(diffMin / 60)}h ago`;
}

function BackupRequestsPanel({ vehicles, incidents }) {
  const [requests, setRequests] = useState([]);
  const [dispatchTarget, setDispatchTarget] = useState(null);
  const pushToast = useToastStore((s) => s.pushToast);

  useEffect(() => {
    listBackupRequests()
      .then((all) => setRequests(all.filter((r) => r.status !== "ACKNOWLEDGED")))
      .catch(() => {});
  }, []);

  const showToast = (msg, variant = "success") => {
    pushToast({ variant, title: variant === "error" ? "Error" : "Backup Requests", message: msg });
  };

  const handleAcknowledge = async (backup) => {
    try {
      await acknowledgeBackupRequest(backup.backup_id);
      setRequests((prev) => prev.filter((r) => r.backup_id !== backup.backup_id));
      showToast("Backup request acknowledged");
    } catch {
      showToast("Could not acknowledge — try again", "error");
    }
  };

  const openDispatch = (backup) => {
    const reqVehicle = vehicles.find(
      (v) =>
        v.vehicle_id === backup.requesting_unit_id ||
        v.id === backup.requesting_unit_id,
    );
    const incData = incidents.find((i) => i.incident_id === backup.incident_id);
    setDispatchTarget({ backup, vehicle: reqVehicle, incData });
  };

  return (
    <div className="dispatcher-surface overflow-hidden relative">
      <DispatchUnitsModal
        isOpen={!!dispatchTarget}
        incidentId={dispatchTarget?.backup?.incident_id}
        incidentRef={
          dispatchTarget?.incData?.incident_ref ||
          dispatchTarget?.backup?.incident_id
        }
        // Ops Manager should only ever see/dispatch units from their own
        // district, not whichever district the requesting unit happens to
        // be in.
        districtId={getCurrentUser()?.district_id}
        onClose={() => setDispatchTarget(null)}
        onConfirm={(units) => {
          setDispatchTarget(null);
          showToast(
            `${units.length} unit${units.length > 1 ? "s" : ""} dispatched`,
          );
        }}
      />
      <div className="flex flex-wrap items-center justify-between gap-2 px-4 py-3 border-b border-(--border-subtle)">
        <div className="flex items-center gap-2 min-w-0">
          <ShieldAlert
            size={16}
            style={{ color: "var(--status-medium)" }}
            aria-hidden
          />
          <span className="text-[14px] font-semibold text-(--text-primary)">
            Backup Requests
          </span>
          {requests.length > 0 && (
            <span
              className="inline-flex items-center justify-center min-w-[1.25rem] h-5 px-1.5 rounded-full text-[11px] font-bold"
              style={{
                background: "var(--status-medium-bg)",
                color: "var(--status-medium)",
              }}
            >
              {requests.length}
            </span>
          )}
        </div>
        <span className="text-[11px] font-mono text-(--text-muted)">
          From field units
        </span>
      </div>
      {requests.length === 0 ? (
        <div
          className="flex flex-col items-center justify-center text-center"
          style={{ padding: "1.25rem" }}
        >
          <p className="text-[12px] text-(--text-muted) m-0">
            No pending backup requests
          </p>
        </div>
      ) : (
        <div>
          {requests.map((req) => {
            const reqVehicle = vehicles.find(
              (v) =>
                v.vehicle_id === req.requesting_unit_id ||
                v.id === req.requesting_unit_id,
            );
            const incData = incidents.find(
              (i) => i.incident_id === req.incident_id,
            );
            return (
              <div
                key={req.backup_id}
                className="flex flex-col gap-2 border-b border-(--border-subtle) last:border-0"
                style={{ padding: "0.65rem 0.85rem" }}
              >
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="font-mono text-[11px] font-bold text-(--accent)">
                    {incData?.incident_ref || req.incident_id}
                  </span>
                  <span className="text-[11px] text-(--text-muted)">
                    · {reqVehicle?.plate_number || req.requesting_unit_id}
                  </span>
                  <span className="text-[10px] font-mono text-(--text-muted) ml-auto">
                    {timeAgo(req.created_at)}
                  </span>
                </div>
                <div className="text-[12px] text-(--text-secondary)">
                  {req.reason}
                </div>
                <div className="flex gap-2 flex-wrap">
                  <button
                    type="button"
                    className="dispatcher-btn-ghost text-[11px]"
                    onClick={() => handleAcknowledge(req)}
                  >
                    Acknowledge
                  </button>
                  <button
                    type="button"
                    className="dispatcher-btn-outline text-[11px]"
                    onClick={() => openDispatch(req)}
                  >
                    Dispatch Units
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

function FleetBar({ type, available, total }) {
  const pct = Math.round((available / total) * 100);
  const low = pct < 60;
  const barColor =
    low && type === "Ambulances" ? "var(--status-medium)" : "var(--accent)";
  return (
    <div className="flex-1 min-w-[140px]">
      <div className="flex justify-between text-[12px] mb-1">
        <span className="text-(--text-secondary)">{type}</span>
        <span className="font-mono text-(--text-primary)">
          {available}/{total}
        </span>
      </div>
      <div className="h-1.5 rounded-full bg-(--bg-input) overflow-hidden">
        <div
          className="h-full rounded-full transition-all"
          style={{ width: `${pct}%`, background: barColor }}
        />
      </div>
    </div>
  );
}

export default function OpsManagerDashboard() {
  const { handoverBannerDismissed, handoverRead, dismissHandoverBanner } =
    useOpsManagerStore();
  const { items, markRead, addNotification } = useNotificationsStore();

  const [showBanner, setShowBanner] = useState(
    !handoverBannerDismissed && !handoverRead,
  );

  // Mutual Aid Modals state
  const [reviewingEscalation, setReviewingEscalation] = useState(null);
  const [reviewingOffer, setReviewingOffer] = useState(null);

  const districtId = getCurrentUser()?.district_id;

  const [vehicles, setVehicles] = useState([]);
  const [incidents, setIncidents] = useState([]);
  const [escalations, setEscalations] = useState([]);

  useEffect(() => {
    listVehicles(districtId ? { districtId } : {})
      .then(setVehicles)
      .catch(() => {});
    listIncidents(districtId ? { districtId } : {})
      .then(setIncidents)
      .catch(() => {});
    // `escalated` is a one-way flag the dispatcher sets and it's never
    // cleared once the incident is later resolved/closed — without also
    // filtering by status here, every incident that was ever escalated
    // stays in this "active" queue forever, even long after it was closed.
    listIncidents({ escalated: true, ...(districtId ? { districtId } : {}) })
      .then((all) => setEscalations(all.filter((i) => !TERMINAL_STATUSES.has(i.status))))
      .catch(() => {});
  }, [districtId]);

  useEffect(() => {
    setShowBanner(!handoverBannerDismissed && !handoverRead);
  }, [handoverBannerDismissed, handoverRead]);

  const pendingEscalations = items.filter(
    (n) => n.type === "mutual_aid_escalation" && !n.read,
  );
  const pendingBroadcasts = items.filter(
    (n) => n.type === "mutual_aid" && !n.read,
  );

  const handleBroadcast = (details) => {
    // The Ops Manager approves the escalation and broadcasts it
    if (reviewingEscalation) markRead(reviewingEscalation.id);

    addNotification({
      id: `ma-broadcast-${Date.now()}`,
      type: "mutual_aid",
      title: `MUTUAL AID: Neighboring District (${details.radius}km)`,
      desc: `Priority request for ${details.priority}`,
      time: "Just now",
      read: false,
      href: "#ops-manager",
      details: details,
    });
  };

  const handlePledge = (units) => {
    if (reviewingOffer) markRead(reviewingOffer.id);
    // Handle actual pledge logic here
  };

  // Real fleet counts from this district's vehicles, replacing the old
  // OPS_FLEET mock — grouped the same way ActiveIncident.jsx's map markers
  // categorize vehicle_type, so the counts here match what the rest of the
  // app calls "ambulance"/"police"/"fire".
  const fleetCategories = [
    { type: "Ambulances", match: (t) => t.includes("AMBULANCE") },
    { type: "Police", match: (t) => t.includes("POLICE") || t.includes("TACTICAL") },
    { type: "Fire & Rescue", match: (t) => t.includes("FIRE") || t.includes("DISASTER") },
  ];
  const fleet = fleetCategories
    .map(({ type, match }) => {
      const inCategory = vehicles.filter((v) => match((v.vehicle_type ?? "").toUpperCase()));
      return {
        type,
        total: inCategory.length,
        available: inCategory.filter((v) => v.status === "available").length,
      };
    })
    .filter((f) => f.total > 0);
  const fleetShortage = fleet.some((f) => f.available / f.total < 0.5);

  // Real average response time from this district's incidents that have
  // one recorded, replacing the hardcoded "7.2m".
  const responseTimes = incidents
    .map((i) => i.response_time_minutes)
    .filter((m) => m != null);
  const avgResponseTime = responseTimes.length
    ? (responseTimes.reduce((a, b) => a + b, 0) / responseTimes.length).toFixed(1)
    : null;

  return (
    <div className="portal-page flex flex-col gap-5">
      <div>
        <h1 className="dispatcher-page-title m-0">Command Overview</h1>
        <OpsManagerDistrictLabel />
      </div>

      {showBanner && (
        <div className="dispatcher-surface p-4 flex flex-wrap items-start gap-4 relative">
          <button
            type="button"
            className="absolute top-3 right-3 bg-transparent border-none cursor-pointer text-(--text-muted) hover:text-(--text-primary)"
            onClick={() => {
              dismissHandoverBanner();
              setShowBanner(false);
            }}
            aria-label="Dismiss"
          >
            <X size={18} />
          </button>
          <ClipboardList size={22} className="text-(--accent) shrink-0" />
          <div className="flex-1 min-w-[200px] pr-8">
            <div className="font-bold text-(--text-primary)">
              Shift Handover Summary Available
            </div>
            <p className="text-[13px] text-(--text-secondary) m-0 mt-1">
              Incoming briefing from outgoing dispatcher — read before
              operations begin
            </p>
          </div>
          <Link
            to="/ops-manager/shift"
            className="dispatcher-btn-outline no-underline text-[13px]"
          >
            Read Handover →
          </Link>
        </div>
      )}

      {/* Local Dispatcher Escalations */}
      {pendingEscalations.map((esc) => (
        <div
          key={esc.id}
          className="dispatcher-surface p-4 flex flex-wrap items-start gap-4 relative border border-(--status-critical)"
        >
          <AlertTriangle
            size={22}
            className="text-(--status-critical) shrink-0"
          />
          <div className="flex-1 min-w-[200px] pr-8">
            <div className="font-bold text-(--status-critical)">
              Mutual Aid Escalation
            </div>
            <p className="text-[13px] text-(--text-secondary) m-0 mt-1">
              {esc.title}
            </p>
          </div>
          <button
            type="button"
            className="dispatcher-btn-primary text-[13px]"
            onClick={() => setReviewingEscalation(esc)}
          >
            Review Request →
          </button>
        </div>
      ))}

      {/* External Mutual Aid Broadcasts */}
      {pendingBroadcasts.map((broadcast) => (
        <div
          key={broadcast.id}
          className="dispatcher-surface p-4 flex flex-wrap items-start gap-4 relative border border-(--status-medium)"
        >
          <Radio size={22} className="text-(--status-medium) shrink-0" />
          <div className="flex-1 min-w-[200px] pr-8">
            <div className="font-bold text-(--text-primary)">
              Incoming Mutual Aid Broadcast
            </div>
            <p className="text-[13px] text-(--text-secondary) m-0 mt-1">
              {broadcast.title}
            </p>
          </div>
          <button
            type="button"
            className="dispatcher-btn-outline text-[13px]"
            onClick={() => setReviewingOffer(broadcast)}
          >
            Offer Assistance →
          </button>
        </div>
      ))}

      <div className="portal-grid-2">
        <MetricCard
          icon={Clock}
          label="Avg Response Time"
          value={avgResponseTime != null ? `${avgResponseTime}m` : "N/A"}
        />
        <MetricCard
          icon={AlertTriangle}
          label="Active Escalations"
          value={String(escalations.length)}
          hint={escalations.length > 0 ? "Requires attention" : undefined}
          hintTone="critical"
          className={escalations.length > 0 ? "dispatcher-metric-card--alert" : undefined}
        />
      </div>

      <div className="om-dashboard-row min-h-0">
        <div className="om-dashboard-col--wide flex flex-col gap-3">
          <SectionTitle
            title="Escalation Queue"
            badge={
              <StatusBadge
                label={`${escalations.length} live`}
                variant="critical"
              />
            }
          />
          {escalations.length === 0 ? (
            <div className="dispatcher-surface p-8 text-center">
              <CheckCircle size={32} className="text-(--accent) mx-auto mb-2" />
              <p className="text-(--text-secondary) m-0">
                No active escalations
              </p>
            </div>
          ) : (
            escalations.map((esc) => (
              <div key={esc.incident_id} className="dispatcher-surface p-4">
                <div className="flex flex-wrap items-center gap-2 mb-1">
                  <span className="text-(--accent) font-bold font-mono text-[13px]">
                    {esc.incident_ref}
                  </span>
                  <StatusBadge
                    label={(esc.severity ?? "medium").toUpperCase()}
                    variant={
                      esc.severity === "critical" ? "critical" : "handover"
                    }
                  />
                </div>
                <div className="text-[14px] font-semibold text-(--text-primary)">
                  {formatIncidentType(esc.incident_type)}
                </div>
                <div className="text-[12px] text-(--text-secondary) mt-0.5">
                  {esc.district ?? esc.address ?? "Unknown location"}
                </div>
                {esc.escalated_by_name && (
                  <p className="text-[12px] text-(--text-secondary) italic m-0 mt-2">
                    Escalated by {esc.escalated_by_name}
                  </p>
                )}
                <div className="flex flex-wrap gap-2 mt-3">
                  <Link
                    to={`/ops-manager/escalations/${esc.incident_id}`}
                    className="dispatcher-btn-primary no-underline text-[12px] py-2 px-3"
                  >
                    Take Command →
                  </Link>
                  <Link
                    to={`/ops-manager/escalations/${esc.incident_id}?readOnly=1`}
                    className="dispatcher-btn-ghost no-underline text-[12px] py-2 px-3"
                  >
                    View Only
                  </Link>
                </div>
              </div>
            ))
          )}
        </div>

        <div className="om-dashboard-col--side flex flex-col gap-3">
          <OpsManagerMissedCallsPanel />
          <BackupRequestsPanel vehicles={vehicles} incidents={incidents} />
        </div>
      </div>

      <div className="dispatcher-surface p-4">
        <SectionTitle title="Fleet Status" className="mb-4" />
        {fleet.length === 0 ? (
          <p className="text-[12px] text-(--text-muted) m-0">
            No vehicles registered in your district.
          </p>
        ) : (
          <div className="flex flex-wrap gap-6">
            {fleet.map((f) => (
              <FleetBar key={f.type} {...f} />
            ))}
          </div>
        )}
        {fleetShortage && (
          <div
            className="mt-4 p-3 rounded-lg flex flex-wrap items-center gap-3 text-[13px]"
            style={{
              background: "var(--status-medium-bg)",
              border: "1px solid var(--status-medium)",
            }}
          >
            <span className="text-(--text-secondary) flex-1 min-w-[200px]">
              Resource shortage detected — consider mutual aid request
            </span>
            <Link
              to="/ops-manager/resources"
              className="dispatcher-btn-outline no-underline text-[12px]"
            >
              Request Mutual Aid →
            </Link>
          </div>
        )}
      </div>

      <OpsManagerReviewModal
        isOpen={!!reviewingEscalation}
        requestDetails={reviewingEscalation?.details}
        onClose={() => setReviewingEscalation(null)}
        onBroadcast={handleBroadcast}
      />

      <MutualAidOfferModal
        isOpen={!!reviewingOffer}
        requestDetails={reviewingOffer?.details}
        onClose={() => setReviewingOffer(null)}
        onPledge={handlePledge}
      />
    </div>
  );
}

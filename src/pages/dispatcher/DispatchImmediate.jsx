import { useEffect, useMemo, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { MapContainer, TileLayer, CircleMarker, Tooltip } from "react-leaflet";
import { Zap, MapPin, Route, Users, Check } from "lucide-react";
import { useThemeStore } from "../../store/themeStore";
import RwandaBoundsEnforcer from "../../components/map/RwandaBoundsEnforcer";
import {
  RWANDA_MIN_ZOOM,
  RWANDA_MAX_ZOOM,
  RWANDA_BOUNDS,
} from "../../components/map/rwandaConstants";
import StatusBadge from "../../components/dispatcher/StatusBadge";
import { useNotificationsStore } from "../../store/notificationsStore";
import DispatchImmediateHeader from "../../components/dispatcher/DispatchImmediateHeader";
import DispatchImmediateTypeStep from "../../components/dispatcher/DispatchImmediateTypeStep";
import DispatchImmediateLocationStep from "../../components/dispatcher/DispatchImmediateLocationStep";
import {
  mockImmediateAssessment,
  mockDispatchCallTranscript,
  detectIncidentTypeFromTranscript,
} from "../../data/mockDispatchImmediateData";
import { createIncident } from "../../api/incidents";
import { listVehicles } from "../../api/vehicles";
import { createDispatch } from "../../api/dispatches";
import { formatIncidentType } from "../../utils/incidentTypeLabels";
import "leaflet/dist/leaflet.css";

// The type grid (DispatchImmediateTypeStep) uses its own scenario ids
// ("armed-robbery", "active-shooting", ...) for fast recognition — these
// need mapping onto the backend's actual incident-type codes before an
// incident can be created.
const IMMEDIATE_TYPE_TO_BACKEND_CODE = {
  "armed-robbery": "SECURITY",
  "active-shooting": "SECURITY",
  "structure-fire": "FIRE",
  "medical-emergency": "MEDICAL",
  "traffic-accident": "RTA",
  "public-disturbance": "SECURITY",
  assault: "SECURITY",
  "other-critical": "OTHER",
};

// Map a real vehicle from the API to the shape this UI expects
function vehicleToUnit(v, incLat, incLng) {
  const lat = v.current_lat ?? -1.9441;
  const lng = v.current_lng ?? 30.0619;
  // Rough distance in km using Haversine approximation
  const dlat = (lat - (incLat ?? -1.9441)) * 111;
  const dlng =
    (lng - (incLng ?? 30.0619)) * 111 * Math.cos((lat * Math.PI) / 180);
  const distKm = Math.sqrt(dlat * dlat + dlng * dlng);
  const etaMin = Math.max(1, Math.round(distKm * 2));
  return {
    id: v.plate_number ?? v.vehicle_id,
    vehicle_id: v.vehicle_id,
    type: v.vehicle_type ?? "Vehicle",
    distance: `${distKm.toFixed(1)} km`,
    eta: `~${etaMin} min`,
    // Kept alongside the formatted `eta` string so the dispatch payload can
    // use the real number directly instead of re-parsing it back out of a
    // "~12 min" string with a digit-stripping regex.
    etaMinutesRaw: etaMin,
    status: "AVAILABLE",
    lat,
    lng,
    crew: v.agency_name ?? v.station_name ?? "Response Unit",
    route: v.station_name ? `From ${v.station_name}` : "Nearest route",
  };
}

// Map a real incident from the API to the shape this UI expects
function incidentToBase(inc) {
  return {
    id: inc.incident_ref ?? inc.incident_id,
    incident_id: inc.incident_id,
    type: formatIncidentType(inc.incident_type) ?? "Emergency",
    location:
      [inc.district, inc.sector, inc.address].filter(Boolean).join(", ") ||
      "Unknown location",
    lat: inc.lat ?? -1.9441,
    lng: inc.lng ?? 30.0619,
    reportedBy: inc.caller_id
      ? `Caller ${inc.caller_id.slice(0, 6)}`
      : "Anonymous",
    description: `${formatIncidentType(inc.incident_type) ?? "Incident"} reported in ${inc.district ?? "district"}`,
  };
}

export default function DispatchImmediate() {
  const navigate = useNavigate();
  const location = useLocation();
  const { theme } = useThemeStore();
  const addNotification = useNotificationsStore(
    (state) => state.addNotification,
  );

  // Pre-select type when navigating from LiveDispatchMap's IMMEDIATE DISPATCH
  // button — location is never known at this point, so the flow always goes
  // through select-location next, whether or not a type was pre-picked.
  const immediateTypeFromState = location.state?.immediateType;
  const [step, setStep] = useState(
    immediateTypeFromState ? "select-location" : "select-type",
  );
  const [selectedType, setSelectedType] = useState(() => {
    if (!immediateTypeFromState) return null;
    return {
      ...immediateTypeFromState,
      selectedAt: new Date().toLocaleTimeString("en-GB", {
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
      }),
    };
  });

  // Real data state — this incident is CREATED from the dispatcher's own
  // type+location pick (see handleLocationConfirm), never guessed from
  // whatever else happens to exist in the system. Previously this screen
  // grabbed the first RECEIVED-status incident (or a hardcoded mock) and
  // used ITS coordinates — a dispatcher had no way to know where the
  // "nearest units" distance/ETA numbers were even being measured from.
  const [realIncident, setRealIncident] = useState(null);
  const [creatingIncident, setCreatingIncident] = useState(false);
  const [createError, setCreateError] = useState(null);
  const [nearestUnits, setNearestUnits] = useState(null); // null = not yet loaded

  const handleLocationConfirm = async (picked) => {
    setCreatingIncident(true);
    setCreateError(null);
    try {
      const inc = await createIncident({
        incidentType: IMMEDIATE_TYPE_TO_BACKEND_CODE[selectedType?.id] ?? "OTHER",
        callerPhone: "unknown",
        districtId: picked.districtId,
        latitude: picked.lat,
        longitude: picked.lng,
        sector: picked.sector || null,
        landmark: picked.address || null,
        finalSeverity: "CRITICAL",
      });
      setRealIncident(inc);

      const vehicles = await listVehicles({ status: "AVAILABLE" }).catch(() => []);
      if (vehicles.length > 0) {
        const units = vehicles
          .map((v) => vehicleToUnit(v, inc.lat, inc.lng))
          .sort((a, b) => parseFloat(a.distance) - parseFloat(b.distance))
          .slice(0, 6);
        setNearestUnits(units);
      } else {
        setNearestUnits([]);
      }
      setStep("dispatch");
    } catch {
      setCreateError("Could not create the incident — check your connection and try again.");
    } finally {
      setCreatingIncident(false);
    }
  };

  const units = nearestUnits ?? [];
  const baseIncident = realIncident ? incidentToBase(realIncident) : null;

  const [elapsed, setElapsed] = useState(227);
  const [omNotified, setOmNotified] = useState(false);
  const [selectedUnitIds, setSelectedUnitIds] = useState([]); // multi-select
  const [dispatched, setDispatched] = useState(false);
  const [dispatchTime, setDispatchTime] = useState("");
  const [dispatchedUnits, setDispatchedUnits] = useState([]);

  const toggleUnit = (id) => {
    setSelectedUnitIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id],
    );
  };
  const toggleSelectAll = () => {
    setSelectedUnitIds((prev) => (prev.length === units.length ? [] : units.map((u) => u.id)));
  };

  const detectedTypeId = useMemo(
    () => detectIncidentTypeFromTranscript(mockDispatchCallTranscript),
    [],
  );

  const incident = useMemo(() => {
    if (!baseIncident) return null;
    if (!selectedType) return baseIncident;
    return {
      ...baseIncident,
      type: selectedType.label,
      description: selectedType.description,
    };
  }, [baseIncident, selectedType]);

  useEffect(() => {
    const t = setInterval(() => setElapsed((e) => e + 1), 1000);
    return () => clearInterval(t);
  }, []);

  useEffect(() => {
    const t = setTimeout(() => setOmNotified(true), 3000);
    return () => clearTimeout(t);
  }, []);

  const handleTypeSelect = (type) => {
    const now = new Date();
    setSelectedType({
      ...type,
      selectedAt: now.toLocaleTimeString("en-GB", {
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
      }),
    });
    setStep("select-location");
  };

  const selectedUnits = units.filter((u) => selectedUnitIds.includes(u.id));
  const selectedUnit = selectedUnits[0] ?? null;
  const unitLabel =
    selectedUnits.length > 1
      ? `${selectedUnits.length} units selected`
      : selectedUnit
        ? `${selectedUnit.id} — ${selectedUnit.type}`
        : mockImmediateAssessment.recommendedLabel;

  // Dispatches every currently-selected unit at once — a dispatcher can pick
  // one, several, or all of them (via "Select all") and send them together
  // in a single action, since the entire point of this screen is speed.
  const handleDispatch = async () => {
    if (selectedUnits.length === 0) return;
    const now = new Date();
    const timeStr = now.toLocaleTimeString("en-GB", {
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    });
    setDispatchTime(timeStr);
    setDispatchedUnits(selectedUnits);
    setDispatched(true);

    const realIncidentId = realIncident?.incident_id;
    if (realIncidentId) {
      const results = await Promise.allSettled(
        selectedUnits
          .filter((u) => u.vehicle_id)
          .map((u) =>
            createDispatch({
              incidentId: realIncidentId,
              vehicleId: u.vehicle_id,
              responderId: null,
              aiRecommended: false,
              overridden: false,
              overrideReason: null,
              confidence: null,
              immediate: true,
              etaMinutes: u.etaMinutesRaw ?? null,
            }),
          ),
      );
      const failedUnits = selectedUnits.filter((_, i) => results[i]?.status === "rejected");
      if (failedUnits.length > 0) {
        addNotification({
          id: `dispatch-imm-failed-${Date.now()}`,
          type: "immediate_dispatch_failed",
          title: `Dispatch of ${failedUnits.map((u) => u.id).join(", ")} did not save`,
          message: `The immediate dispatch shown at ${timeStr} was not recorded by the backend for these units. Re-confirm their assignment.`,
          time: now.toISOString(),
          read: false,
          target_role: "DISPATCHER",
          is_immediate: true,
          ai_recommended: false,
        });
      }
    }

    addNotification({
      id: `dispatch-imm-${Date.now()}`,
      type: "immediate_dispatch",
      title: `${selectedUnits.map((u) => u.id).join(", ")} dispatched — ${incident?.type ?? "Immediate"}`,
      message: `Immediate dispatch confirmed at ${timeStr} for ${selectedUnits.length} unit${selectedUnits.length > 1 ? "s" : ""}. Location: ${incident?.location ?? "Unknown"}.`,
      time: now.toISOString(),
      read: false,
      target_role: "OPERATIONS_MANAGER",
      is_immediate: true,
      ai_recommended: false,
    });
  };

  const mapUnits = units.map((u) => ({ id: u.id, lat: u.lat, lng: u.lng }));

  return (
    <div
      className="dispatch-immediate-page min-h-full flex flex-col"
      style={{
        background: `linear-gradient(135deg, color-mix(in srgb, var(--bg-base) 94%, var(--status-critical) 6%) 0%, var(--bg-base) 100%)`,
      }}
    >
      <DispatchImmediateHeader
        elapsed={elapsed}
        incidentId={baseIncident?.id ?? "NEW"}
        omNotified={omNotified}
      />

      {step === "select-type" && (
        <DispatchImmediateTypeStep
          detectedTypeId={detectedTypeId}
          onSelect={handleTypeSelect}
        />
      )}

      {step === "select-location" && (
        <>
          <DispatchImmediateLocationStep
            selectedType={selectedType}
            onConfirm={handleLocationConfirm}
          />
          {creatingIncident && (
            <p className="text-center text-[13px] text-(--text-muted) pb-4">Creating incident…</p>
          )}
          {createError && (
            <p className="text-center text-[13px] pb-4" style={{ color: "var(--status-critical)" }}>{createError}</p>
          )}
        </>
      )}

      {step === "dispatch" && incident && selectedType && (
        <div className="flex-1 min-h-0 flex flex-col lg:flex-row gap-4 p-4 md:p-5">
          <div className="lg:w-[55%] flex flex-col gap-4 min-w-0 min-h-0">
            <div
              className="dispatcher-surface p-4"
              style={{ borderLeft: "3px solid var(--status-critical)" }}
            >
              <div className="flex flex-wrap items-center gap-2 mb-1">
                <StatusBadge label="CRITICAL" variant="critical" />
                <span className="text-lg font-bold text-(--text-primary)">
                  {incident.type}
                </span>
              </div>
              <p
                className="text-[11px] text-(--text-muted) m-0 mb-2"
                style={{ fontFamily: "var(--font-mono)" }}
              >
                Immediate dispatch · type confirmed by dispatcher ·{" "}
                {selectedType.selectedAt}
              </p>
              <p className="flex items-center gap-1.5 text-[13px] text-(--text-secondary) m-0 mb-2">
                <MapPin size={14} className="text-(--accent) shrink-0" />
                {incident.location}
              </p>
              <p className="text-[12px] text-(--text-muted) m-0 mb-1">
                Reported by:{" "}
                <span className="text-(--text-secondary)">
                  {incident.reportedBy}
                </span>
              </p>
              <p className="text-[13px] text-(--text-secondary) m-0 leading-relaxed">
                {incident.description}
              </p>
            </div>

            <div
              className="dispatcher-surface overflow-hidden"
              style={{ height: 240 }}
            >
              <MapContainer
                center={[incident.lat, incident.lng]}
                zoom={14}
                minZoom={RWANDA_MIN_ZOOM}
                maxZoom={RWANDA_MAX_ZOOM}
                maxBounds={RWANDA_BOUNDS}
                maxBoundsViscosity={1}
                style={{
                  width: "100%",
                  height: "100%",
                  background:
                    theme === "dark" ? "var(--bg-base)" : "var(--bg-elevated)",
                }}
                zoomControl
              >
                <TileLayer
                  url={
                    theme === "dark"
                      ? "https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
                      : "https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png"
                  }
                  attribution="&copy; CARTO &copy; OSM"
                />
                <RwandaBoundsEnforcer />
                <CircleMarker
                  center={[incident.lat, incident.lng]}
                  radius={10}
                  pathOptions={{
                    color: "var(--bg-surface)",
                    fillColor: "var(--status-critical)",
                    fillOpacity: 1,
                    weight: 2,
                  }}
                >
                  <Tooltip>{incident.id}</Tooltip>
                </CircleMarker>
                {mapUnits.map((u) => (
                  <CircleMarker
                    key={u.id}
                    center={[u.lat, u.lng]}
                    radius={6}
                    pathOptions={{
                      color: "var(--bg-surface)",
                      fillColor: "var(--accent)",
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
              <div className="flex items-center justify-between mb-3">
                <div
                  className="text-[11px] font-bold uppercase tracking-wider text-(--text-muted)"
                  style={{ fontFamily: "var(--font-mono)" }}
                >
                  NEAREST AVAILABLE UNITS
                </div>
                {units.length > 0 && (
                  <button
                    type="button"
                    className="text-[11px] font-semibold text-(--accent) bg-transparent border-none cursor-pointer p-0"
                    onClick={toggleSelectAll}
                  >
                    {selectedUnitIds.length === units.length ? "Deselect all" : `Select all (${units.length})`}
                  </button>
                )}
              </div>
              {units.length === 0 ? (
                <p className="text-[12px] text-(--text-muted) m-0">No available units found near this location.</p>
              ) : (
                <div className="flex flex-col gap-2">
                  {units.map((unit) => (
                    <label
                      key={unit.id}
                      className="flex items-center gap-3 p-2.5 rounded-lg border border-(--border-subtle) cursor-pointer hover:border-(--accent) transition-colors"
                      style={{
                        background: selectedUnitIds.includes(unit.id)
                          ? "var(--accent-ghost)"
                          : "var(--bg-input)",
                      }}
                    >
                      <input
                        type="checkbox"
                        checked={selectedUnitIds.includes(unit.id)}
                        onChange={() => toggleUnit(unit.id)}
                        className="accent-(--accent)"
                      />
                      <div className="flex-1 min-w-0 text-[13px]">
                        <span
                          className="font-bold text-(--accent) mr-1"
                          style={{ fontFamily: "var(--font-mono)" }}
                        >
                          {unit.id}
                        </span>
                        <span className="text-(--text-secondary)">
                          · {unit.type} · {unit.distance} ·{" "}
                        </span>
                        <span className="font-bold text-(--text-primary)">
                          ETA {unit.eta}
                        </span>
                      </div>
                      <StatusBadge
                        label={unit.status}
                        variant={
                          unit.status === "AVAILABLE" ? "resolved" : "handover"
                        }
                      />
                    </label>
                  ))}
                </div>
              )}
            </div>
          </div>

          <div className="lg:w-[45%] flex flex-col gap-4 min-w-0">
            <div
              className="dispatcher-surface p-4"
              style={{ border: "1px solid var(--accent)" }}
            >
              <div className="flex items-center gap-2 mb-2">
                <div
                  className="text-[10px] font-bold uppercase tracking-wider text-(--status-critical)"
                  style={{ fontFamily: "var(--font-mono)" }}
                >
                  FAST DISPATCH ASSESSMENT
                </div>
                <span
                  className="text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded"
                  style={{
                    background:
                      "color-mix(in srgb, var(--status-medium) 15%, transparent)",
                    color: "var(--status-medium)",
                    fontFamily: "var(--font-display)",
                  }}
                >
                  AI BYPASSED
                </span>
              </div>
              <div className="text-xl font-bold text-(--text-primary) mb-1">
                {selectedUnits.length > 0 ? unitLabel : "No units selected"}
              </div>
              {selectedUnit && (
                <p className="text-[13px] text-(--text-secondary) m-0 mb-3">
                  {selectedUnits.length > 1
                    ? `${selectedUnits.length} units checked in the list on the left`
                    : `Nearest unit · ${selectedUnit.distance} · ETA ${selectedUnit.eta}`}
                </p>
              )}
              {selectedUnits.length <= 1 && (
                <div className="flex flex-col gap-1.5 text-[13px] text-(--text-secondary) mb-2">
                  <span className="flex items-center gap-2">
                    <Route size={14} className="text-(--accent) shrink-0" />
                    Route: {selectedUnit?.route ?? mockImmediateAssessment.route}
                  </span>
                  <span className="flex items-center gap-2">
                    <Users size={14} className="text-(--accent) shrink-0" />
                    Crew: {selectedUnit?.crew ?? mockImmediateAssessment.crew}
                  </span>
                </div>
              )}
              <p className="text-[11px] text-(--text-muted) m-0">
                Dispatcher-confirmed dispatch. Automated analysis bypassed for
                life-critical response. Check units on the left to select one,
                several, or all of them.
              </p>
            </div>

            {!dispatched ? (
              <>
                <button
                  type="button"
                  className="dispatch-immediate-dispatch-btn w-full flex items-center justify-center gap-2 border-none cursor-pointer transition-all"
                  style={{
                    height: 64,
                    background: "var(--status-critical)",
                    fontSize: 16,
                    fontWeight: 700,
                    letterSpacing: "0.1em",
                    borderRadius: 10,
                    boxShadow:
                      "0 4px 24px color-mix(in srgb, var(--status-critical) 35%, transparent)",
                    fontFamily: "var(--font-display)",
                    opacity: selectedUnits.length === 0 ? 0.5 : 1,
                    cursor: selectedUnits.length === 0 ? "not-allowed" : "pointer",
                  }}
                  onClick={handleDispatch}
                  disabled={selectedUnits.length === 0}
                >
                  <Zap size={22} />
                  {selectedUnits.length > 1
                    ? `DISPATCH ${selectedUnits.length} UNITS NOW`
                    : selectedUnit
                      ? `DISPATCH NOW — ${selectedUnit.id}`
                      : "SELECT A UNIT TO DISPATCH"}
                </button>
                <p className="text-[11px] text-(--text-muted) text-center m-0">
                  Selected unit{selectedUnits.length !== 1 ? "s" : ""} will receive
                  immediate field order{selectedUnits.length !== 1 ? "s" : ""}. Operations Manager
                  has been notified.
                </p>
              </>
            ) : (
              <div
                className="rounded-[10px] p-5"
                style={{
                  background: "var(--status-low-bg)",
                  border: "1px solid var(--status-low)",
                }}
              >
                <div className="flex items-start gap-3 mb-3">
                  <Check
                    size={24}
                    style={{ color: "var(--status-low)", flexShrink: 0 }}
                  />
                  <div>
                    <div className="font-bold text-(--text-primary) text-[15px]">
                      {dispatchedUnits.map((u) => u.id).join(", ")} Dispatched — {dispatchTime}
                    </div>
                    <p className="text-[13px] text-(--text-secondary) m-0 mt-1">
                      {dispatchedUnits.length} unit{dispatchedUnits.length !== 1 ? "s" : ""} notified · OM alerted
                    </p>
                  </div>
                </div>
                <div className="flex flex-col sm:flex-row gap-2">
                  <Link
                    to="/dispatcher/active-incident"
                    state={{ incident: realIncident }}
                    className="dispatcher-btn-primary flex-1 no-underline text-center"
                  >
                    Open Full Incident View
                  </Link>
                  <button
                    type="button"
                    className="dispatcher-btn-ghost flex-1"
                    onClick={() => navigate("/dispatcher")}
                  >
                    Return to Map
                  </button>
                </div>
              </div>
            )}

            <div className="mt-auto pt-4 border-t border-(--border-subtle) flex flex-wrap gap-4 justify-center">
              <button
                type="button"
                className="text-[12px] text-(--text-muted) bg-transparent border-none cursor-pointer hover:text-(--status-critical)"
                onClick={() => navigate("/dispatcher")}
              >
                Cancel dispatch
              </button>
              <button
                type="button"
                className="text-[12px] text-(--text-muted) bg-transparent border-none cursor-pointer hover:text-(--accent)"
                onClick={() => setStep("select-type")}
              >
                Change incident type
              </button>
              <button
                type="button"
                className="text-[12px] text-(--text-muted) bg-transparent border-none cursor-pointer hover:text-(--accent)"
                onClick={() => navigate("/dispatcher/ai-engine")}
              >
                Downgrade to standard dispatch
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

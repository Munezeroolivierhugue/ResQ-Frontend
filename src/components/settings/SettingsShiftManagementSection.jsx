import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Clock, ClipboardList, ChevronRight } from "lucide-react";
import { SettingsToggleRow } from "./SettingsToggle";
import StatusBadge from "../dispatcher/StatusBadge";

const DISPATCHER_DEFAULTS = {
  shiftStart: "08:00",
  shiftEnd: "16:00",
  handoverReminder: "30",
  handoverDraft: true,
};

const OM_DEFAULTS = {
  shiftStart: "08:00",
  shiftEnd: "16:00",
  incomingReminder: "15",
  outgoingReminder: "45",
  draftHandover: true,
  draftReport: true,
  notifyDcOnSubmit: true,
};

function ShiftStatTile({ label, value, mono }) {
  return (
    <div
      className="rounded-lg p-3 px-4"
      style={{
        background: "var(--bg-elevated)",
        borderRadius: "var(--border-radius-md, 8px)",
      }}
    >
      <div
        className="text-[10px] uppercase tracking-wider text-(--text-muted) mb-1"
        style={{ fontFamily: "var(--font-mono)" }}
      >
        {label}
      </div>
      <div
        className={`text-[16px] font-semibold text-(--text-primary)${mono ? " font-mono" : ""}`}
      >
        {value}
      </div>
    </div>
  );
}

export default function SettingsShiftManagementSection({
  variant = "dispatcher",
  onSave,
}) {
  const isOps = variant === "OPERATIONS_MANAGER";
  const [shiftStart, setShiftStart] = useState(
    isOps ? OM_DEFAULTS.shiftStart : DISPATCHER_DEFAULTS.shiftStart,
  );
  const [shiftEnd, setShiftEnd] = useState(
    isOps ? OM_DEFAULTS.shiftEnd : DISPATCHER_DEFAULTS.shiftEnd,
  );
  const [handoverReminder, setHandoverReminder] = useState(
    DISPATCHER_DEFAULTS.handoverReminder,
  );
  const [incomingReminder, setIncomingReminder] = useState(
    OM_DEFAULTS.incomingReminder,
  );
  const [outgoingReminder, setOutgoingReminder] = useState(
    OM_DEFAULTS.outgoingReminder,
  );
  const [toggles, setToggles] = useState({
    handoverDraft: DISPATCHER_DEFAULTS.handoverDraft,
    draftHandover: OM_DEFAULTS.draftHandover,
    draftReport: OM_DEFAULTS.draftReport,
    notifyDcOnSubmit: OM_DEFAULTS.notifyDcOnSubmit,
  });
  const [elapsed, setElapsed] = useState(20538);

  useEffect(() => {
    const t = setInterval(() => setElapsed((e) => e + 1), 1000);
    return () => clearInterval(t);
  }, []);

  const formatElapsed = (s) => {
    const h = Math.floor(s / 3600);
    const m = Math.floor((s % 3600) / 60);
    const sec = s % 60;
    return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}:${String(sec).padStart(2, "0")}`;
  };

  const setToggle = (key, val) => {
    setToggles((t) => ({ ...t, [key]: val }));
    onSave?.();
  };

  const handleSave = () => onSave?.();

  return (
    <div className="settings-section-card dispatcher-surface p-5 w-full">
      <div className="flex flex-wrap items-start justify-between gap-3 mb-1">
        <div>
          <h2
            className="text-base font-bold m-0"
            style={{ fontFamily: "var(--font-display)" }}
          >
            {isOps ? "Shift Management" : "Shift Settings"}
          </h2>
          <p className="text-[13px] text-(--text-secondary) m-0 mt-1">
            {isOps
              ? "Configure your operations command shift, handovers, and end-of-shift reporting."
              : "Configure your shift schedule and reminders."}
          </p>
        </div>
        {isOps && (
          <Link
            to="/ops-manager/shift"
            className="dispatcher-btn-ghost text-[12px] no-underline flex items-center gap-1"
          >
            Open Shift Performance <ChevronRight size={14} />
          </Link>
        )}
      </div>

      <div className="dispatcher-section-title mt-5 mb-3">
        <span className="dispatcher-section-accent" aria-hidden />
        <Clock size={16} className="text-(--accent)" />
        <span className="panel-title">Current Shift</span>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-6">
        {isOps ? (
          <>
            <ShiftStatTile
              label="Shift window"
              value={`${shiftStart} – ${shiftEnd} · Today`}
            />
            <ShiftStatTile
              label="Time on command"
              value={formatElapsed(elapsed)}
              mono
            />
            <ShiftStatTile label="Escalations managed" value="4" />
            <ShiftStatTile label="DC report" value="Pending submit" />
          </>
        ) : (
          <>
            <ShiftStatTile
              label="Shift"
              value={`${shiftStart} – ${shiftEnd} · Today`}
            />
            <ShiftStatTile label="Incidents handled today" value="14" />
            <ShiftStatTile
              label="Time on duty"
              value={formatElapsed(elapsed)}
              mono
            />
            <ShiftStatTile
              label="Assigned district"
              value="Nyarugenge / Kicukiro"
            />
          </>
        )}
      </div>

      <div className="dispatcher-section-title mb-3">
        <span className="dispatcher-section-accent" aria-hidden />
        <ClipboardList size={16} className="text-(--accent)" />
        <span className="panel-title">Schedule</span>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
        <label className="settings-form-field dispatcher-field">
          <span className="field-label">Shift start time</span>
          <input
            type="time"
            className="dispatcher-input dispatcher-text-input w-full"
            value={shiftStart}
            onChange={(e) => setShiftStart(e.target.value)}
          />
        </label>
        <label className="settings-form-field dispatcher-field">
          <span className="field-label">Shift end time</span>
          <input
            type="time"
            className="dispatcher-input dispatcher-text-input w-full"
            value={shiftEnd}
            onChange={(e) => setShiftEnd(e.target.value)}
          />
        </label>
      </div>

      {isOps ? (
        <>
          <label className="settings-form-field dispatcher-field mb-4 block">
            <span className="field-label">Incoming handover reminder</span>
            <select
              className="dispatcher-input dispatcher-select w-full"
              value={incomingReminder}
              onChange={(e) => {
                setIncomingReminder(e.target.value);
                onSave?.();
              }}
            >
              <option value="0">At shift start only</option>
              <option value="15">15 minutes after shift start if unread</option>
              <option value="30">30 minutes after shift start if unread</option>
            </select>
            <span className="text-[11px] text-(--text-muted) mt-1 block">
              Prompts you to read the briefing from the outgoing Operations
              Manager
            </span>
          </label>

          <label className="settings-form-field dispatcher-field mb-4 block">
            <span className="field-label">Outgoing handover preparation</span>
            <select
              className="dispatcher-input dispatcher-select w-full"
              value={outgoingReminder}
              onChange={(e) => {
                setOutgoingReminder(e.target.value);
                onSave?.();
              }}
            >
              <option value="30">30 minutes before shift end</option>
              <option value="45">45 minutes before shift end</option>
              <option value="60">60 minutes before shift end</option>
              <option value="90">90 minutes before shift end</option>
            </select>
          </label>

          <SettingsToggleRow
            label="Auto-prepare outgoing handover briefing"
            description="System drafts your handover document for the incoming Operations Manager 1 hour before shift end"
            on={toggles.draftHandover}
            onChange={(v) => setToggle("draftHandover", v)}
          />
          <SettingsToggleRow
            label="Auto-prepare shift performance report"
            description="Begins compiling metrics and incident summary for District Commander review"
            on={toggles.draftReport}
            onChange={(v) => setToggle("draftReport", v)}
          />
          <SettingsToggleRow
            label="Notify District Commander on report submit"
            description="Send alert when your end-of-shift report is submitted"
            on={toggles.notifyDcOnSubmit}
            onChange={(v) => setToggle("notifyDcOnSubmit", v)}
          />

          <div
            className="mt-4 p-3 rounded-lg flex flex-wrap items-center gap-2 text-[12px]"
            style={{
              background: "var(--accent-ghost)",
              border: "1px solid var(--border)",
            }}
          >
            <StatusBadge label="NEXT HANDOVER" variant="active" />
            <span className="text-(--text-secondary)">
              Incoming OM shift 16:00–00:00 · Outgoing briefing due by{" "}
              {shiftEnd}
            </span>
          </div>
        </>
      ) : (
        <>
          <label className="settings-form-field dispatcher-field mb-4 block">
            <span className="field-label">Handover reminder timing</span>
            <select
              className="dispatcher-input dispatcher-select w-full"
              value={handoverReminder}
              onChange={(e) => {
                setHandoverReminder(e.target.value);
                onSave?.();
              }}
            >
              <option value="15">15 minutes before shift end</option>
              <option value="30">30 minutes before shift end</option>
              <option value="45">45 minutes before shift end</option>
              <option value="60">60 minutes before shift end</option>
              <option value="0">No reminder</option>
            </select>
          </label>
          <SettingsToggleRow
            label="Auto-prepare handover draft"
            description="System begins populating your handover summary 1 hour before shift end"
            on={toggles.handoverDraft}
            onChange={(v) => setToggle("handoverDraft", v)}
          />
        </>
      )}

      <button
        type="button"
        className="dispatcher-btn-primary mt-4"
        onClick={handleSave}
      >
        Save changes
      </button>
    </div>
  );
}

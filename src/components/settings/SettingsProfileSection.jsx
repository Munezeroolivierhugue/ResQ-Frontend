import { useEffect, useState } from "react";
import { User, Clock, Calendar, Pencil, Save, Loader2 } from "lucide-react";
import SettingsToast from "./SettingsToast";
import { getCurrentUser } from "../../utils/authSession";
import { getUser, updateSelf } from "../../api/users";

const DUTY_OPTIONS = [
  { id: "on_duty", label: "On Duty" },
  { id: "on_break", label: "On Break" },
  { id: "off_duty", label: "Off Duty" },
];

const ROLE_LABELS = {
  DISPATCHER: "DISPATCHER",
  FIELD_RESPONDER: "FIELD RESPONDER",
  OPERATIONS_MANAGER: "OPS MANAGER",
  OPERATIONS_MANAGER: "OPS MANAGER",
  DISTRICT_COMMANDER: "DISTRICT COMMANDER",
  EMERGENCY_PLANNER: "EMERGENCY PLANNER",
  ANALYST: "ANALYST",
  SUPER_ADMIN: "SUPER ADMIN",
};

function getInitials(name) {
  if (!name) return "??";
  return name
    .split(" ")
    .map((n) => n[0])
    .filter(Boolean)
    .slice(0, 2)
    .join("")
    .toUpperCase();
}

const DEFAULT_SHIFT_STATS = [
  { label: "Shift", value: "—" },
  { label: "Incidents handled today", value: "—" },
  { label: "Time on duty", value: "00:00:00", mono: true },
  { label: "Assigned district", value: "—" },
];

export default function SettingsProfileSection({
  shiftStats: shiftStatsProp,
  stationAdminNote = "Assigned by administrator · contact ops manager to change",
  onUserLoaded,
}) {
  const sessionUser = getCurrentUser();
  const userId = sessionUser?.user_id;

  const [user, setUser] = useState(null);
  const [loadingUser, setLoadingUser] = useState(true);
  const [form, setForm] = useState({ name: "", email: "", phone: "" });
  const [savedForm, setSavedForm] = useState({
    name: "",
    email: "",
    phone: "",
  });
  const [isEditing, setIsEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [duty, setDuty] = useState("on_duty");
  const [toast, setToast] = useState(false);
  const [toastMsg, setToastMsg] = useState("Profile updated");
  const [elapsed, setElapsed] = useState(0);

  useEffect(() => {
    const t = setInterval(() => setElapsed((e) => e + 1), 1000);
    return () => clearInterval(t);
  }, []);

  useEffect(() => {
    if (!userId || userId === "demo-user-uuid") {
      const f = {
        name: sessionUser?.full_name || "",
        email: sessionUser?.email || "",
        phone: "",
      };
      setForm(f);
      setSavedForm(f);
      setLoadingUser(false);
      return;
    }
    getUser(userId)
      .then((u) => {
        setUser(u);
        const f = {
          name: u.full_name || "",
          email: u.email || "",
          phone: u.phone_number || "",
        };
        setForm(f);
        setSavedForm(f);
        onUserLoaded?.(u);
      })
      .catch(() => {
        const f = {
          name: sessionUser?.full_name || "",
          email: sessionUser?.email || "",
          phone: "",
        };
        setForm(f);
        setSavedForm(f);
      })
      .finally(() => setLoadingUser(false));
  }, [userId]);

  const flashToast = (msg = "Profile updated") => {
    setToastMsg(msg);
    setToast(true);
    setTimeout(() => setToast(false), 2500);
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      if (userId && userId !== "demo-user-uuid") {
        const updated = await updateSelf({
          full_name: form.name,
          phone_number: form.phone,
        });
        const f = {
          name: updated.full_name || form.name,
          email: updated.email || form.email,
          phone: updated.phone_number || form.phone,
        };
        setForm(f);
        setSavedForm(f);
      } else {
        setSavedForm({ ...form });
      }
      setIsEditing(false);
      flashToast("Profile updated");
    } catch (err) {
      const msg = err?.response?.data?.message;
      if (err?.response?.status === 403) {
        flashToast("Contact your administrator to update profile details");
      } else {
        flashToast(msg || "Failed to save changes");
      }
      setIsEditing(false);
    } finally {
      setSaving(false);
    }
  };

  const handleDiscard = () => {
    setForm({ ...savedForm });
    setIsEditing(false);
  };

  const formatDutyTime = (s) => {
    const h = Math.floor(s / 3600);
    const m = Math.floor((s % 3600) / 60);
    const sec = s % 60;
    return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}:${String(sec).padStart(2, "0")}`;
  };

  const baseShiftStats = shiftStatsProp || DEFAULT_SHIFT_STATS;
  const shiftStats = baseShiftStats.map((s) =>
    s.mono ? { ...s, value: formatDutyTime(elapsed) } : s,
  );

  const initials = getInitials(savedForm.name);
  const roleLabel =
    ROLE_LABELS[user?.role] ||
    ROLE_LABELS[sessionUser?.role?.toUpperCase()] ||
    "USER";
  const fieldClass = isEditing
    ? "dispatcher-input dispatcher-text-input w-full"
    : "settings-profile-field-display";

  return (
    <div className="settings-profile-section flex flex-col gap-4 relative">
      <div
        className="dispatcher-surface flex flex-wrap items-center gap-4 w-full"
        style={{ padding: "1.25rem 1.5rem" }}
      >
        <span
          className="w-[52px] h-[52px] rounded-full flex items-center justify-center text-[15px] font-bold shrink-0"
          style={{
            background: "var(--accent-ghost)",
            color: "var(--accent)",
            fontFamily: "var(--font-display)",
          }}
        >
          {loadingUser ? (
            <Loader2 size={20} className="animate-spin" />
          ) : (
            initials
          )}
        </span>
        <div className="flex-1 min-w-[200px]">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-[17px] font-semibold text-(--text-primary)">
              {loadingUser ? "…" : savedForm.name || "Unknown user"}
            </span>
            <span
              className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded border"
              style={{
                background: "var(--accent-ghost)",
                color: "var(--accent)",
                borderColor: "var(--accent)",
                fontFamily: "var(--font-display)",
              }}
            >
              {roleLabel}
            </span>
          </div>
          <p className="text-[13px] text-(--text-secondary) m-0 mt-1">
            {loadingUser ? "…" : savedForm.email}
          </p>
        </div>
        <div className="flex flex-col items-end gap-2 shrink-0">
          <DutyStatusPill duty={duty} />
          <button
            type="button"
            className="dispatcher-btn-ghost text-[12px] flex items-center gap-1.5 py-1.5 px-2.5"
            onClick={() => (isEditing ? handleDiscard() : setIsEditing(true))}
            disabled={loadingUser}
          >
            <Pencil size={14} />
            {isEditing ? "Cancel" : "Edit Profile"}
          </button>
        </div>
      </div>

      <div className="settings-section-card dispatcher-surface p-5 w-full">
        <div className="dispatcher-section-title">
          <span className="dispatcher-section-accent" aria-hidden />
          <User size={16} className="text-(--accent)" />
          <span className="panel-title">Personal Information</span>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-4">
          {[
            { key: "name", label: "Full Name" },
            { key: "email", label: "Email Address", readOnly: true },
            { key: "phone", label: "Phone Number" },
          ].map((f) => (
            <label key={f.key} className="dispatcher-field settings-form-field">
              <span className="field-label">{f.label}</span>
              <input
                type={f.key === "email" ? "email" : "text"}
                className={`${fieldClass}${f.readOnly ? " settings-profile-field--locked" : ""}`}
                value={form[f.key]}
                readOnly={!isEditing || f.readOnly}
                disabled={f.readOnly}
                onChange={(e) =>
                  setForm((p) => ({ ...p, [f.key]: e.target.value }))
                }
                placeholder={loadingUser ? "Loading…" : undefined}
              />
              {f.readOnly && (
                <span className="text-[11px] text-(--text-muted) italic mt-1 block">
                  Contact your administrator to change email address
                </span>
              )}
            </label>
          ))}
          <label className="dispatcher-field settings-form-field">
            <span className="field-label">Status</span>
            <input
              type="text"
              className="settings-profile-field-display settings-profile-field--locked"
              value={user?.status || "—"}
              readOnly
              disabled
            />
          </label>
        </div>
      </div>

      <div className="settings-section-card dispatcher-surface p-5 w-full">
        <div className="dispatcher-section-title">
          <span className="dispatcher-section-accent" aria-hidden />
          <Clock size={16} className="text-(--accent)" />
          <span className="panel-title">Duty Status</span>
        </div>
        <div className="flex flex-wrap items-center justify-between gap-4 mt-4">
          <div>
            <div className="text-[13px] font-medium text-(--text-primary)">
              Current Status
            </div>
            <p className="text-[12px] text-(--text-secondary) m-0 mt-0.5">
              Visible to Operations Manager and all supervisors
            </p>
          </div>
          <div
            className="settings-duty-segmented"
            role="group"
            aria-label="Duty status"
          >
            {DUTY_OPTIONS.map((opt) => (
              <button
                key={opt.id}
                type="button"
                className={`settings-duty-segment${duty === opt.id ? " settings-duty-segment--active" : ""}`}
                onClick={() => setDuty(opt.id)}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="settings-section-card dispatcher-surface p-5 w-full">
        <div className="dispatcher-section-title mb-4">
          <span className="dispatcher-section-accent" aria-hidden />
          <Calendar size={16} className="text-(--accent)" />
          <span className="panel-title">Current Shift</span>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {shiftStats.map((stat) => (
            <div
              key={stat.label}
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
                {stat.label}
              </div>
              <div
                className={`text-[16px] font-semibold text-(--text-primary)${stat.mono ? " font-mono" : ""}`}
              >
                {stat.value}
              </div>
            </div>
          ))}
        </div>
      </div>

      {isEditing && (
        <div className="settings-profile-actions sticky bottom-0 z-10 flex justify-end gap-3 py-3 border-t border-(--border-subtle) bg-(--bg-surface)">
          <button
            type="button"
            className="dispatcher-btn-ghost text-[13px]"
            onClick={handleDiscard}
            disabled={saving}
          >
            Discard Changes
          </button>
          <button
            type="button"
            className="dispatcher-btn-primary text-[13px] flex items-center gap-2"
            onClick={handleSave}
            disabled={saving}
          >
            {saving ? (
              <Loader2 size={16} className="animate-spin" />
            ) : (
              <Save size={16} />
            )}
            {saving ? "Saving…" : "Save Changes"}
          </button>
        </div>
      )}

      <SettingsToast show={toast} message={toastMsg} />
    </div>
  );
}

function DutyStatusPill({ duty }) {
  if (duty === "off_duty") {
    return (
      <span
        className="text-[11px] font-semibold px-2.5 py-1 rounded border"
        style={{
          background: "var(--bg-elevated)",
          color: "var(--text-muted)",
          borderColor: "var(--border)",
        }}
      >
        ● Off Duty
      </span>
    );
  }
  if (duty === "on_break") {
    return (
      <span
        className="text-[11px] font-semibold px-2.5 py-1 rounded border"
        style={{
          background: "var(--status-medium-bg)",
          color: "var(--status-medium)",
          borderColor: "var(--status-medium)",
        }}
      >
        ● On Break
      </span>
    );
  }
  return (
    <span
      className="text-[11px] font-semibold px-2.5 py-1 rounded border inline-flex items-center gap-1"
      style={{
        background: "var(--status-low-bg)",
        color: "var(--status-low)",
        borderColor: "var(--status-low)",
      }}
    >
      <span className="settings-duty-pulse-dot" aria-hidden />
      On Duty
    </span>
  );
}

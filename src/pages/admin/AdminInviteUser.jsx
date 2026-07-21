import { useState, useEffect, useMemo } from "react";
import { Link } from "react-router-dom";
import { inviteUser, listUsers } from "../../api/users";
import { listAgencies } from "../../api/agencies";
import { listDistricts } from "../../api/districts";
import { listVehicles } from "../../api/vehicles";
import {
  Send,
  CheckCircle,
  Users,
  User,
  Mail,
  Phone,
  Shield,
  MapPin,
  ArrowRight,
  Sparkles,
  Building2,
  Clock,
  Truck,
} from "lucide-react";
import { ASSIGNED_ROLES } from "../../data/mockAuthData";
import { mockAgencies } from "../../data/mockAgencies";
import AdminPageHeader from "../../components/admin/AdminPageHeader";

const RECENT_LIMIT = 5;

// Only these roles are district-scoped
const ROLES_REQUIRING_DISTRICT = new Set([
  "OPERATIONS_MANAGER",
  "district_commander",
  "DISTRICT_COMMANDER",
  "field_responder",
  "FIELD_RESPONDER",
]);

const SHIFT_OPTIONS = [
  { value: "MORNING",  label: "Morning Shift (07:00 – 15:00)" },
  { value: "EVENING",  label: "Evening Shift (15:00 – 23:00)" },
  { value: "NIGHT",    label: "Night Shift   (23:00 – 07:00)" },
  { value: "ROTATING", label: "Rotating / Not fixed" },
];

function roleRequiresDistrict(role) {
  return ROLES_REQUIRING_DISTRICT.has(role);
}

function roleRequiresUnit(role) {
  return role === "field_responder" || role === "FIELD_RESPONDER";
}

function getInitials(name) {
  return name
    .split(" ")
    .map((n) => n[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();
}

function getAvatarColor(name) {
  const colors = [
    "var(--accent)",
    "var(--status-critical)",
    "var(--status-medium)",
    "var(--status-low)",
    "var(--status-high)",
  ];
  let hash = 0;
  for (let i = 0; i < name.length; i++)
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  return colors[Math.abs(hash) % colors.length];
}

const FALLBACK_AGENCY_ID =
  mockAgencies.find((a) => a.is_default)?.agency_id ||
  mockAgencies[0]?.agency_id;

function RecentProvisionedPanel() {
  const [recent, setRecent] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    listUsers()
      .then((all) => setRecent(all.slice(0, RECENT_LIMIT)))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <aside className="aiu-panel">
        <div className="aiu-panel-header">
          <Users size={16} className="aiu-panel-header-icon" />
          <h2 className="aiu-panel-title">Recently Provisioned</h2>
        </div>
        <div className="aiu-empty">
          <p className="aiu-empty-sub">Loading…</p>
        </div>
      </aside>
    );
  }

  if (recent.length === 0) {
    return (
      <aside className="aiu-panel">
        <div className="aiu-panel-header">
          <Users size={16} className="aiu-panel-header-icon" />
          <h2 className="aiu-panel-title">Recently Provisioned</h2>
        </div>
        <div className="aiu-empty">
          <div className="aiu-empty-icon-wrap">
            <Users size={28} aria-hidden />
          </div>
          <p className="aiu-empty-text">No users provisioned yet.</p>
          <p className="aiu-empty-sub">
            Invited users will appear here after dispatch.
          </p>
        </div>
      </aside>
    );
  }

  return (
    <aside className="aiu-panel">
      <div className="aiu-panel-header">
        <Users size={16} className="aiu-panel-header-icon" />
        <h2 className="aiu-panel-title">Recently Provisioned</h2>
        <span className="aiu-panel-count">{recent.length}</span>
      </div>
      <div className="aiu-recent-list">
        {recent.map((u) => {
          const roleLabel =
            ASSIGNED_ROLES.find(
              (r) => r.value?.toLowerCase() === u.role?.toLowerCase(),
            )?.label || u.role;
          const isActive = u.status === "ACTIVE";
          const color = getAvatarColor(u.full_name || u.email || "");
          return (
            <div key={u.user_id} className="aiu-recent-row">
              <div
                className="aiu-avatar"
                style={{
                  background: `color-mix(in srgb, ${color} 15%, transparent)`,
                  color,
                }}
              >
                {getInitials(u.full_name || u.email || "?")}
              </div>
              <div className="aiu-recent-info">
                <p className="aiu-recent-name">{u.full_name || "—"}</p>
                <p className="aiu-recent-email">{u.email}</p>
              </div>
              <div className="aiu-recent-badges">
                <span className="aiu-role-badge">{roleLabel}</span>
                <span
                  className={`aiu-status-badge aiu-status-badge--${isActive ? "active" : "pending"}`}
                >
                  {isActive ? "Active" : "Pending"}
                </span>
              </div>
            </div>
          );
        })}
      </div>
      <Link to="/admin/users" className="aiu-view-all">
        View all provisioned users
        <ArrowRight size={13} />
      </Link>
    </aside>
  );
}

export default function AdminInviteUser() {
  const [agencies, setAgencies] = useState(mockAgencies);
  // districtObjects: [{district_id, name, province}] from API
  const [districtObjects, setDistrictObjects] = useState([]);
  // units for FR filtered by agency
  const [units, setUnits] = useState([]);
  const [unitsLoading, setUnitsLoading] = useState(false);

  const defaultAgencyId =
    agencies.find((a) => a.is_default)?.agency_id ||
    agencies[0]?.agency_id ||
    FALLBACK_AGENCY_ID;

  const [form, setForm] = useState({
    fullName: "",
    email: "",
    phone: "",
    agency_id: defaultAgencyId,
    role: "dispatcher",
    district_id: "",   // UUID from API
    shift_type: "DAY",
    vehicle_id: "",
  });
  const [sent, setSent] = useState(null);
  const [districtError, setDistrictError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [apiError, setApiError] = useState("");

  useEffect(() => {
    listAgencies()
      .then((data) => {
        if (data.length) {
          setAgencies(data);
          const defaultReal = data.find((a) => a.is_default) ?? data[0];
          if (defaultReal) setForm((f) => ({ ...f, agency_id: defaultReal.agency_id }));
        }
      })
      .catch(() => {});
    listDistricts()
      .then((data) => { if (data.length) setDistrictObjects(data); })
      .catch(() => {});
  }, []);

  // Load units whenever role is field_responder or agency changes
  useEffect(() => {
    if (!roleRequiresUnit(form.role) || !form.agency_id) {
      setUnits([]);
      return;
    }
    setUnitsLoading(true);
    listVehicles({ agencyId: form.agency_id })
      .then(setUnits)
      .catch(() => setUnits([]))
      .finally(() => setUnitsLoading(false));
  }, [form.role, form.agency_id]);

  // Only offer units actually assignable to this new Field Responder: same
  // district (if one's picked) and not already held by another responder.
  const availableUnits = useMemo(
    () => units.filter((u) =>
      (!form.district_id || !u.district_id || u.district_id === form.district_id) &&
      !u.assigned_responder_id
    ),
    [units, form.district_id]
  );

  const showDistrictField = roleRequiresDistrict(form.role);
  const showUnitField = roleRequiresUnit(form.role);

  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));

  const handleRoleChange = (role) => {
    setDistrictError("");
    setForm((f) => ({
      ...f,
      role,
      district_id: roleRequiresDistrict(role) ? f.district_id : "",
      vehicle_id: "",
      // Lock agency to RNP for non-FR roles
      agency_id: role === "field_responder"
        ? f.agency_id
        : (agencies.find((a) => a.is_default)?.agency_id || agencies[0]?.agency_id || defaultAgencyId),
    }));
  };

  // Group districts by province for the select
  const districtGroups = (() => {
    const grouped = {};
    districtObjects.forEach((d) => {
      const key = d.province || "Rwanda";
      if (!grouped[key]) grouped[key] = [];
      grouped[key].push(d);
    });
    return Object.entries(grouped).map(([province, dists]) => ({ province, dists }));
  })();

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.fullName.trim()) { setApiError("Full name is required."); return; }
    if (/<[^>]+>/.test(form.fullName)) { setApiError("Full name must not contain HTML or special characters."); return; }
    if (!form.email.trim()) { setApiError("Email is required."); return; }
    if (!form.phone.trim()) { setApiError("Phone number is required."); return; }
    if (showDistrictField && !form.district_id) {
      setDistrictError("Please assign a district for this role.");
      return;
    }

    const payload = {
      fullName:   form.fullName,
      email:      form.email,
      phone:      form.phone,
      role:       form.role.toUpperCase(),
      shiftType:  form.shift_type || "DAY",
    };
    if (form.district_id)  payload.districtId = form.district_id;
    if (form.agency_id)    payload.agencyId   = form.agency_id;
    if (form.vehicle_id)   payload.vehicleId  = form.vehicle_id;

    setSubmitting(true);
    setApiError("");
    try {
      await inviteUser(payload);
      const districtName = districtObjects.find((d) => d.district_id === form.district_id)?.name || "";
      const unitLabel = units.find((u) => u.vehicle_id === form.vehicle_id)
        ? `${units.find((u) => u.vehicle_id === form.vehicle_id).plate_number} — ${units.find((u) => u.vehicle_id === form.vehicle_id).vehicle_type}`
        : "";
      setSent({ ...payload, district: districtName, unit: unitLabel });
    } catch (err) {
      const msg =
        err?.response?.data?.message ||
        err?.response?.data?.error ||
        "Failed to send invitation. Please try again.";
      setApiError(msg);
    } finally {
      setSubmitting(false);
    }
  };

  const roleLabel =
    ASSIGNED_ROLES.find((r) => r.value === form.role)?.label || form.role;
  const shiftLabel = SHIFT_OPTIONS.find((s) => s.value === form.shift_type)?.label || form.shift_type;

  return (
    <div className="portal-page aiu-root">
      <AdminPageHeader
        title="Create User & Send Invitation"
        subtitle="Super admin provisions accounts. Users complete registration via the invitation link."
        eyebrow="Super Admin Portal"
        badge="Account Provisioning"
      />

      <div className="flex flex-col gap-6">
        <div className="w-full">
          {sent ? (
            <div className="aiu-success-card">
              <div className="aiu-success-glow" />
              <div className="aiu-success-top">
                <div className="aiu-success-icon">
                  <CheckCircle size={28} />
                </div>
                <div>
                  <div className="aiu-success-title">Invitation Email Sent!</div>
                  <p className="aiu-success-desc">
                    A secure invitation link has been emailed directly to{" "}
                    <strong>{sent.fullName}</strong>. They can use it to set
                    their password and activate their account.
                  </p>
                </div>
              </div>

              <div className="aiu-success-meta">
                <div className="aiu-success-meta-row">
                  <Mail size={13} className="aiu-success-meta-icon" />
                  <span>{sent.email}</span>
                </div>
                {sent.district && (
                  <div className="aiu-success-meta-row">
                    <MapPin size={13} className="aiu-success-meta-icon" />
                    <span>District: {sent.district}</span>
                  </div>
                )}
                {sent.unit && (
                  <div className="aiu-success-meta-row">
                    <Truck size={13} className="aiu-success-meta-icon" />
                    <span>Assigned Unit: {sent.unit}</span>
                  </div>
                )}
                <div className="aiu-success-meta-row">
                  <Clock size={13} className="aiu-success-meta-icon" />
                  <span>Shift: {shiftLabel}</span>
                </div>
                <div className="aiu-success-meta-row">
                  <Shield size={13} className="aiu-success-meta-icon" />
                  <span>{roleLabel}</span>
                </div>
              </div>

              <div className="aiu-link-section">
                <p style={{ fontSize: "12px", color: "var(--text-secondary)", margin: 0, lineHeight: 1.6 }}>
                  <Mail size={13} style={{ display: "inline", verticalAlign: "middle", marginRight: 6 }} />
                  The invitation link contains a one-time secure token generated by the server. It was sent to{" "}
                  <strong>{sent.email}</strong> and expires in <strong>48 hours</strong>.
                  If they don&apos;t see it, ask them to check their spam folder.
                </p>
              </div>

              <div className="aiu-success-actions">
                <button type="button" onClick={() => setSent(null)} className="aiu-invite-another-btn">
                  <Sparkles size={14} />
                  Invite another user
                </button>
              </div>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="aiu-form-card">
              <div className="aiu-form-card-header">
                <span className="aiu-form-card-eyebrow">New Account Provisioning</span>
                <h2 className="aiu-form-card-title">User Details</h2>
              </div>

              <div className="aiu-form-grid">
                {/* Full name */}
                <label className="aiu-field">
                  <span className="aiu-field-label">Full Name</span>
                  <div className="aiu-input-wrap">
                    <User size={15} className="aiu-input-icon" />
                    <input
                      className="aiu-input aiu-input--icon"
                      placeholder="Jean Bosco Nkurunziza"
                      value={form.fullName}
                      onChange={(e) => set("fullName", e.target.value)}
                      required
                    />
                  </div>
                </label>

                {/* Email */}
                <label className="aiu-field">
                  <span className="aiu-field-label">Professional Email</span>
                  <div className="aiu-input-wrap">
                    <Mail size={15} className="aiu-input-icon" />
                    <input
                      type="email"
                      className="aiu-input aiu-input--icon"
                      placeholder="j.bosco@rnp.gov.rw"
                      value={form.email}
                      onChange={(e) => set("email", e.target.value)}
                      required
                    />
                  </div>
                </label>

                {/* Phone */}
                <label className="aiu-field">
                  <span className="aiu-field-label">Phone Number</span>
                  <div className="aiu-input-wrap">
                    <Phone size={15} className="aiu-input-icon" />
                    <input
                      type="tel"
                      className="aiu-input aiu-input--icon"
                      placeholder="+250 788 123 456"
                      value={form.phone}
                      onChange={(e) => set("phone", e.target.value)}
                      required
                    />
                  </div>
                </label>

                {/* Shift Time */}
                <label className="aiu-field">
                  <span className="aiu-field-label">Shift Schedule</span>
                  <div className="aiu-input-wrap">
                    <Clock size={15} className="aiu-input-icon" />
                    <select
                      className="aiu-input aiu-input--icon aiu-select"
                      value={form.shift_type}
                      onChange={(e) => set("shift_type", e.target.value)}
                    >
                      {SHIFT_OPTIONS.map((s) => (
                        <option key={s.value} value={s.value}>{s.label}</option>
                      ))}
                    </select>
                  </div>
                  <p className="aiu-field-hint">Determines the user&apos;s default shift assignment.</p>
                </label>

                {/* Agency */}
                <label className="aiu-field">
                  <span className="aiu-field-label">Agency</span>
                  <div className="aiu-input-wrap">
                    <Building2 size={15} className="aiu-input-icon" />
                    <select
                      className="aiu-input aiu-input--icon aiu-select"
                      value={form.agency_id}
                      disabled={form.role !== "field_responder"}
                      onChange={(e) => set("agency_id", e.target.value)}
                    >
                      {agencies.map((a) => (
                        <option key={a.agency_id || a.id} value={a.agency_id || a.id}>
                          {a.name}
                        </option>
                      ))}
                    </select>
                  </div>
                  {form.role !== "field_responder" && (
                    <p className="aiu-field-hint">Locked to Rwanda National Police for this role.</p>
                  )}
                </label>

                {/* Role */}
                <label className="aiu-field">
                  <span className="aiu-field-label">Assigned Role</span>
                  <div className="aiu-input-wrap">
                    <Shield size={15} className="aiu-input-icon" />
                    <select
                      className="aiu-input aiu-input--icon aiu-select"
                      value={form.role}
                      onChange={(e) => handleRoleChange(e.target.value)}
                    >
                      {ASSIGNED_ROLES.filter(
                        (r) => r.value !== "admin" && r.value !== "super_admin",
                      ).map((r) => (
                        <option key={r.value} value={r.value}>{r.label}</option>
                      ))}
                    </select>
                  </div>
                  {!roleRequiresDistrict(form.role) && form.role !== "field_responder" && (
                    <p className="aiu-field-hint">This role has national-level access — no district required.</p>
                  )}
                </label>
              </div>

              {/* District field — animated reveal (not shown for analyst) */}
              <div
                className="aiu-district-reveal"
                aria-hidden={!showDistrictField}
                style={{
                  maxHeight: showDistrictField ? "200px" : 0,
                  opacity: showDistrictField ? 1 : 0,
                  paddingTop: showDistrictField ? undefined : 0,
                  paddingBottom: showDistrictField ? undefined : 0,
                  overflow: "hidden",
                  transition: "max-height 300ms ease, opacity 250ms ease, padding 250ms ease",
                }}
              >
                <label className="aiu-field">
                  <span className="aiu-field-label">Assigned District</span>
                  <div className="aiu-input-wrap">
                    <MapPin size={15} className="aiu-input-icon" />
                    <select
                      className="aiu-input aiu-input--icon aiu-select"
                      value={form.district_id}
                      onChange={(e) => { setDistrictError(""); set("district_id", e.target.value); }}
                      required={showDistrictField}
                    >
                      <option value="">Select district…</option>
                      {districtGroups.map((group) => (
                        <optgroup key={group.province} label={`── ${group.province} ──`}>
                          {group.dists.map((d) => (
                            <option key={d.district_id} value={d.district_id}>{d.name}</option>
                          ))}
                        </optgroup>
                      ))}
                    </select>
                  </div>
                  <p className="aiu-field-hint">This district will filter all data visible to this user after login.</p>
                  {districtError && <p className="aiu-field-error">{districtError}</p>}
                </label>
              </div>

              {/* Unit selector — only for field responders */}
              <div
                className="aiu-district-reveal"
                aria-hidden={!showUnitField}
                style={{
                  maxHeight: showUnitField ? "200px" : 0,
                  opacity: showUnitField ? 1 : 0,
                  paddingTop: showUnitField ? undefined : 0,
                  paddingBottom: showUnitField ? undefined : 0,
                  overflow: "hidden",
                  transition: "max-height 300ms ease, opacity 250ms ease, padding 250ms ease",
                }}
              >
                <label className="aiu-field">
                  <span className="aiu-field-label">Assigned Unit</span>
                  <div className="aiu-input-wrap">
                    <Truck size={15} className="aiu-input-icon" />
                    <select
                      className="aiu-input aiu-input--icon aiu-select"
                      value={form.vehicle_id}
                      onChange={(e) => set("vehicle_id", e.target.value)}
                      disabled={unitsLoading || availableUnits.length === 0}
                    >
                      <option value="">
                        {unitsLoading
                          ? "Loading units…"
                          : availableUnits.length === 0
                          ? "No unassigned units in this agency/district — invite without one, assign later"
                          : "Select unit… (optional)"}
                      </option>
                      {availableUnits.map((u) => (
                        <option key={u.vehicle_id} value={u.vehicle_id}>
                          {u.plate_number} — {u.vehicle_type}{u.station_name ? ` (${u.station_name})` : ""}
                        </option>
                      ))}
                    </select>
                  </div>
                  <p className="aiu-field-hint">
                    Only unassigned units in this district are listed. It's fine to leave this blank — assign a unit later under{" "}
                    <Link to="/admin/units" className="text-(--accent) no-underline hover:underline">Admin → Units</Link>.
                  </p>
                </label>
              </div>

              {apiError && (
                <p className="text-[12px] mt-2" style={{ color: "var(--status-medium)" }}>
                  {apiError}
                </p>
              )}
              <div className="aiu-form-footer">
                <button type="submit" className="aiu-submit-btn" disabled={submitting}>
                  <Send size={16} />
                  {submitting ? "Sending…" : "Send Invitation Link"}
                </button>
              </div>
            </form>
          )}
        </div>

        <div className="w-full">
          <RecentProvisionedPanel />
        </div>
      </div>
    </div>
  );
}

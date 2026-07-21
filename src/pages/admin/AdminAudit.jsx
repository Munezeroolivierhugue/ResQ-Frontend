import { useState, useMemo, useEffect } from "react";
import { Link } from "react-router-dom";
import { ShieldAlert, Search } from "lucide-react";
import StatusBadge from "../../components/dispatcher/StatusBadge";
import AdminPageHeader from "../../components/admin/AdminPageHeader";
import FilterDropdown from "../../components/admin/FilterDropdown";
import { listAuditLogs, listSecurityEvents } from "../../api/admin";

const PAGE_SIZE = 10;

const ROLE_LABELS = {
  DISPATCHER: "Dispatcher",
  FIELD_RESPONDER: "Field Responder",
  OPERATIONS_MANAGER: "Operations Manager",
  DISTRICT_COMMANDER: "District Commander",
  EMERGENCY_PLANNER: "Emergency Planner",
  ANALYST: "Analyst",
  SUPER_ADMIN: "Super Admin",
};

function auditVariant(status) {
  if (status === "SUCCESS") return "resolved";
  if (status === "DENIED") return "critical";
  return "handover";
}

function rowBg(status) {
  if (status === "DENIED") return "var(--status-critical-bg)";
  if (status === "ERROR") return "var(--status-medium-bg)";
  return undefined;
}

function parseDate(str) {
  if (!str) return null;
  const d = new Date(str);
  return isNaN(d) ? null : d;
}

export default function AdminAudit() {
  const now = new Date();
  const yr = now.getFullYear(),
    mo = now.getMonth() + 1,
    day = now.getDate();
  const defaultFrom = `${yr}-${String(mo).padStart(2, "0")}-01`;
  const defaultTo = `${yr}-${String(mo).padStart(2, "0")}-${String(day).padStart(2, "0")}`;

  const [dateFrom, setDateFrom] = useState(defaultFrom);
  const [dateTo, setDateTo] = useState(defaultTo);
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState("All");
  const [moduleFilter, setModuleFilter] = useState("All");
  const [auditRows, setAuditRows] = useState([]);
  const [auditLoading, setAuditLoading] = useState(true);
  const [auditError, setAuditError] = useState(null);
  const [page, setPage] = useState(1);

  const [securityEvents, setSecurityEvents] = useState([]);
  const [securityLoading, setSecurityLoading] = useState(true);

  useEffect(() => {
    listAuditLogs()
      .then((rows) =>
        setAuditRows(
          rows.map((r) => ({
            ...r,
            user: r.user_name,
            role: r.user_role ?? r.module ?? "—",
          })),
        ),
      )
      .catch(() => setAuditError("Failed to load audit logs"))
      .finally(() => setAuditLoading(false));
    listSecurityEvents()
      .then(setSecurityEvents)
      .catch(() => {})
      .finally(() => setSecurityLoading(false));
  }, []);

  // Derive unique roles and modules from real data
  const uniqueRoles = useMemo(() => {
    const set = new Set(auditRows.map((r) => r.role).filter(Boolean));
    return Array.from(set).sort();
  }, [auditRows]);

  const uniqueModules = useMemo(() => {
    const set = new Set(auditRows.map((r) => r.module).filter(Boolean));
    return Array.from(set).sort();
  }, [auditRows]);

  // Reactive filtering — no Apply button needed
  const filteredRows = useMemo(() => {
    const fromDate = parseDate(dateFrom);
    const toDate = dateTo ? new Date(dateTo + "T23:59:59") : null;
    const q = search.trim().toLowerCase();
    return auditRows.filter((r) => {
      if (q &&
        !(r.user ?? "").toLowerCase().includes(q) &&
        !(r.action ?? "").toLowerCase().includes(q) &&
        !(r.module ?? "").toLowerCase().includes(q)
      ) return false;
      if (roleFilter !== "All" && r.role !== roleFilter) return false;
      if (moduleFilter !== "All" && r.module !== moduleFilter) return false;
      if (fromDate || toDate) {
        const ts = parseDate(r.timestamp);
        if (ts) {
          if (fromDate && ts < fromDate) return false;
          if (toDate && ts > toDate) return false;
        }
      }
      return true;
    });
  }, [roleFilter, moduleFilter, dateFrom, dateTo, search, auditRows]);

  // Reset to page 1 whenever filters change
  useEffect(() => { Promise.resolve().then(() => setPage(1)); }, [roleFilter, moduleFilter, dateFrom, dateTo, search]);

  const totalPages = Math.max(1, Math.ceil(filteredRows.length / PAGE_SIZE));
  const displayedRows = filteredRows.slice(
    (page - 1) * PAGE_SIZE,
    page * PAGE_SIZE,
  );

  return (
    <div className="portal-page flex flex-col gap-4 min-w-[1024px]">
      <AdminPageHeader
        title="Audit Trail"
        subtitle="Complete timestamped record of every system action."
        eyebrow="Super Admin Portal"
        badge="Compliance"
      />

      <div className="flex flex-nowrap items-center gap-2">
        <div className="relative w-56 shrink-0">
          <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-(--text-muted)" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by user, action, or module…"
            className="dispatcher-input h-8 w-full rounded-full pl-8 pr-3 text-[11px]"
            style={{ borderRadius: 9999 }}
          />
        </div>
        <div className="ml-auto flex flex-nowrap items-center gap-2">
          <input
            type="date"
            style={{ width: 132, borderRadius: 9999 }}
            className="dispatcher-input h-8 rounded-full px-3 text-[11px] shrink-0"
            value={dateFrom}
            onChange={(e) => setDateFrom(e.target.value)}
          />
          <input
            type="date"
            style={{ width: 132, borderRadius: 9999 }}
            className="dispatcher-input h-8 rounded-full px-3 text-[11px] shrink-0"
            value={dateTo}
            onChange={(e) => setDateTo(e.target.value)}
          />
          <FilterDropdown
            label="All Roles"
            value={roleFilter}
            onChange={setRoleFilter}
            options={[{ value: "All", label: "All roles" }, ...uniqueRoles.map((r) => ({ value: r, label: ROLE_LABELS[r] ?? r }))]}
          />
          <FilterDropdown
            label="All Modules"
            value={moduleFilter}
            onChange={setModuleFilter}
            options={[{ value: "All", label: "All modules" }, ...uniqueModules.map((m) => ({ value: m, label: m }))]}
          />
        </div>
      </div>

      <div className="flex flex-col lg:flex-row gap-4 items-start">
        <div className="dispatcher-surface overflow-x-auto flex-1 min-w-0">
          <table className="w-full text-[12px] min-w-[800px]">
            <thead>
              <tr className="text-[12px] font-medium text-(--text-secondary) border-b border-(--border)">
                <th className="text-left p-3 font-bold">Timestamp</th>
                <th className="text-left p-3 font-bold">User</th>
                <th className="p-3 font-bold">Role</th>
                <th className="text-left p-3 font-bold">Action</th>
                <th className="p-3 font-bold">Module</th>
                <th className="p-3 font-bold">IP Address</th>
                <th className="p-3 font-bold">Status</th>
              </tr>
            </thead>
            <tbody>
              {auditLoading && (
                <tr>
                  <td colSpan={7} className="p-6 text-center text-[13px] text-(--text-muted)">
                    Loading audit logs…
                  </td>
                </tr>
              )}
              {auditError && !auditLoading && (
                <tr>
                  <td colSpan={7} className="p-6 text-center text-[13px]"
                    style={{ color: "var(--status-critical)" }}>
                    {auditError}
                  </td>
                </tr>
              )}
              {!auditLoading && !auditError && displayedRows.length === 0 && (
                <tr>
                  <td colSpan={7} className="p-6 text-center text-[13px] text-(--text-muted)">
                    No audit logs match the selected filters.
                  </td>
                </tr>
              )}
              {!auditLoading && !auditError &&
                displayedRows.map((row, i) => {
                  return (
                    <tr
                      key={i}
                      className="border-b border-(--border-subtle)"
                      style={{ background: rowBg(row.status) }}
                    >
                      <td className="p-3 font-mono font-bold text-(--accent)">{row.timestamp}</td>
                      <td className="p-3 font-medium">{row.user}</td>
                      <td className="p-3 text-center">{ROLE_LABELS[row.role] ?? row.role}</td>
                      <td className="p-3">{row.action}</td>
                      <td className="p-3">
                        <span className="font-mono text-[10px] px-1.5 py-0.5 rounded bg-(--bg-elevated)">
                          {row.module}
                        </span>
                      </td>
                      <td className="p-3 font-mono text-(--text-muted)">{row.ip_address}</td>
                      <td className="p-3">
                        <StatusBadge label={row.status} variant={auditVariant(row.status)} />
                      </td>
                    </tr>
                  );
                })}
            </tbody>
          </table>
          <div className="dispatcher-table-footer flex justify-between items-center p-3">
            <span className="text-[12px] text-(--text-muted)">
              Showing {filteredRows.length === 0 ? 0 : (page - 1) * PAGE_SIZE + 1}–
              {Math.min(page * PAGE_SIZE, filteredRows.length)} of {filteredRows.length} entries
            </span>
            <div className="flex gap-2">
              <button
                type="button"
                className="dispatcher-btn-ghost text-[11px] h-8"
                disabled={page <= 1}
                onClick={() => setPage((p) => p - 1)}
              >
                Previous
              </button>
              <span className="text-[12px] text-(--text-muted) self-center px-1">
                {page} / {totalPages}
              </span>
              <button
                type="button"
                className="dispatcher-btn-ghost text-[11px] h-8"
                disabled={page >= totalPages}
                onClick={() => setPage((p) => p + 1)}
              >
                Next
              </button>
            </div>
          </div>
        </div>

        <div className="dispatcher-surface p-4 w-full lg:w-[30%] shrink-0">
          <div className="flex items-center gap-2 mb-4">
            <ShieldAlert size={16} style={{ color: "var(--status-critical)" }} />
            <span className="font-semibold text-[13px]">Security Events</span>
            {!securityLoading && (
              <span className="ml-auto text-[10px] font-bold px-1.5 rounded"
                style={{ background: "var(--status-critical-bg)", color: "var(--status-critical)" }}>
                {securityEvents.length}
              </span>
            )}
          </div>
          {securityLoading && (
            <p className="text-[12px] text-(--text-muted)">Loading…</p>
          )}
          {!securityLoading && securityEvents.length === 0 && (
            <p className="text-[12px] text-(--text-secondary)">No security events recorded.</p>
          )}
          {!securityLoading &&
            securityEvents.map((e) => (
              <div key={e.event_id} className="py-3 border-b border-(--border-subtle) border-l-[3px] pl-3"
                style={{
                  borderLeftColor: e.severity === "CRITICAL" ? "var(--status-critical)" : "var(--status-medium)",
                }}>
                <div className="font-mono text-[10px] uppercase"
                  style={{ color: e.severity === "CRITICAL" ? "var(--status-critical)" : "var(--status-medium)" }}>
                  {e.event_type}
                </div>
                <div className="text-[12px] text-(--text-secondary) mt-0.5">{e.source} · {e.ip_address}</div>
                <div className="font-mono text-[11px] text-(--text-muted) mt-1">{e.occurred_at}</div>
              </div>
            ))}
          <Link to="/admin/security"
            className="text-[12px] font-semibold text-(--accent) mt-3 inline-block no-underline hover:underline">
            View All Security Events →
          </Link>
        </div>
      </div>
    </div>
  );
}

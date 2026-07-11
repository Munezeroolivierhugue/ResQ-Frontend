import { useState } from "react";
import { ArrowLeftRight } from "lucide-react";
import MetricCard from "../../components/dispatcher/MetricCard";
import StatusBadge from "../../components/dispatcher/StatusBadge";
import {
  OPS_DISPATCHERS,
  OPS_JEAN_BOSCO_INCIDENTS,
  getWorkloadVariant,
  getWorkloadLabel,
} from "../../data/mockOpsManagerData";
import OpsManagerDistrictLabel from "../../components/ops-manager/OpsManagerDistrictLabel";
import { getOpsManagerDistrict } from "../../utils/opsManagerDistrict";
import { mockIncidents } from "../../data/mockIncidents";
import { mockAuditLogs } from "../../data/mockAuditLogs";
import { generateUuid } from "../../utils/formHelpers";
import { getCurrentUser } from "../../utils/authSession";

function AiRateBar({ rate }) {
  const color =
    rate >= 85
      ? "var(--status-low)"
      : rate >= 60
        ? "var(--status-medium)"
        : "var(--status-critical)";
  return (
    <div className="flex items-center gap-2 min-w-[100px]">
      <div className="flex-1 h-[5px] rounded-full bg-(--bg-input) overflow-hidden">
        <div
          className="h-full"
          style={{ width: `${rate}%`, background: color }}
        />
      </div>
      <span className="text-[11px] font-mono">{rate}%</span>
    </div>
  );
}

export default function OpsManagerDispatchers() {
  const [redistributeId, setRedistributeId] = useState(null);
  const [selectedIncidents, setSelectedIncidents] = useState([]);
  const [transferTo, setTransferTo] = useState("");
  const [toast, setToast] = useState(null);

  const omDistrict = getOpsManagerDistrict();
  const dispatchers = OPS_DISPATCHERS.filter((d) => d.district === omDistrict);
  const overloaded = dispatchers.filter(
    (d) => d.workload === "overload",
  ).length;
  const avgAi = Math.round(
    dispatchers.reduce((s, d) => s + d.ai_acceptance_rate, 0) /
      dispatchers.length,
  );
  const totalIncidents = dispatchers.reduce((s, d) => s + d.incidents, 0);

  const showToast = (msg) => {
    setToast(msg);
    setTimeout(() => setToast(null), 3500);
  };

  const toggleIncident = (id) => {
    setSelectedIncidents((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id],
    );
  };

  const handleConfirmTransfer = () => {
    if (!transferTo || !selectedIncidents.length) return;
    const cu = getCurrentUser();
    const newDispatcher = dispatchers.find((d) => d.id === transferTo);
    if (!newDispatcher) return;
    const ts = new Date().toISOString();
    selectedIncidents.forEach((incRef) => {
      const incident = mockIncidents.find(
        (i) => i.incident_ref === incRef || i.id === incRef,
      );
      if (incident) incident.logged_by = newDispatcher.user_id;
      mockAuditLogs.push({
        log_id: generateUuid(),
        user_id: cu?.user_id || "demo-user-uuid",
        timestamp: ts,
        action: `INCIDENT_REASSIGNED: ${incRef} to ${newDispatcher.user_id}`,
        module: "OPERATIONS_MANAGER",
        ip_address: null,
        status: "SUCCESS",
      });
    });
    showToast(
      `Transferred ${selectedIncidents.length} incident${selectedIncidents.length > 1 ? "s" : ""} to ${newDispatcher.name}`,
    );
    setRedistributeId(null);
    setSelectedIncidents([]);
    setTransferTo("");
  };

  return (
    <div className="portal-page relative">
      {toast && (
        <div
          className="fixed top-20 right-6 z-50 max-w-sm px-4 py-3 rounded-lg border text-[13px] font-medium shadow-lg"
          style={{
            background: "var(--bg-surface)",
            borderColor: "var(--status-low)",
            color: "var(--status-low)",
          }}
        >
          {toast}
        </div>
      )}

      <h1 className="dispatcher-page-title m-0">Dispatcher Supervision</h1>
      <OpsManagerDistrictLabel />
      <p className="dispatcher-page-subtitle mt-2">
        Monitor workload, AI acceptance, and redistribute active queues.
      </p>

      <div className="portal-grid-4 my-6">
        <MetricCard
          label="Active Dispatchers"
          value={String(dispatchers.length)}
        />
        <MetricCard label="Avg AI Acceptance" value={`${avgAi}%`} />
        <MetricCard
          label="Overloaded"
          value={String(overloaded)}
          hintTone={overloaded ? "critical" : "positive"}
        />
        <MetricCard
          label="Total Active Incidents"
          value={String(totalIncidents)}
        />
      </div>

      <div className="dispatcher-surface table-scroll">
        <table className="w-full text-left text-[13px] border-collapse min-w-[800px]">
          <thead>
            <tr
              className="border-b border-(--border) text-[11px] uppercase tracking-wider text-(--text-muted)"
              style={{ fontFamily: "var(--font-display)" }}
            >
              <th className="p-3">Dispatcher</th>
              <th className="p-3">Workload</th>
              <th className="p-3">Active Incidents</th>
              <th className="p-3">Handled Today</th>
              <th className="p-3">AI Acceptance</th>
              <th className="p-3">Status</th>
              <th className="p-3">Actions</th>
            </tr>
          </thead>
          <tbody>
            {dispatchers.map((d) => (
              <tr
                key={d.id}
                className="border-b border-(--border-subtle) hover:bg-(--bg-elevated) group"
              >
                <td className="p-3">
                  <div className="flex items-center gap-2">
                    <span
                      className="w-8 h-8 rounded-full flex items-center justify-center text-[10px] font-bold"
                      style={{
                        background: "var(--accent-ghost)",
                        color: "var(--accent)",
                      }}
                    >
                      {d.initials}
                    </span>
                    <div>
                      <div className="font-semibold">{d.name}</div>
                      <div className="font-mono text-[10px] text-(--text-muted)">
                        {d.id}
                      </div>
                    </div>
                  </div>
                </td>
                <td className="p-3">
                  <StatusBadge
                    label={getWorkloadLabel(d.workload)}
                    variant={getWorkloadVariant(d.workload)}
                  />
                </td>
                <td
                  className="p-3 font-bold"
                  style={{
                    color:
                      d.incidents > 6 ? "var(--status-critical)" : undefined,
                  }}
                >
                  {d.incidents}
                </td>
                <td className="p-3">{d.incidents_handled}</td>
                <td className="p-3">
                  <AiRateBar rate={d.ai_acceptance_rate} />
                </td>
                <td className="p-3">
                  <StatusBadge
                    label={d.status}
                    variant={d.status === "ON DUTY" ? "resolved" : "info"}
                  />
                </td>
                <td className="p-3">
                  <div className="flex gap-1 opacity-70 group-hover:opacity-100">
                    <button
                      type="button"
                      className="dispatcher-btn-icon"
                      aria-label="Redistribute"
                      onClick={() => {
                        setRedistributeId(d.id);
                        setSelectedIncidents([]);
                        setTransferTo("");
                      }}
                    >
                      <ArrowLeftRight size={14} />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {redistributeId === "DSP-0042" && (
        <div className="dispatcher-surface p-4 mt-4">
          <h3 className="font-bold m-0 mb-3">
            Redistribute Jean Bosco&apos;s Queue
          </h3>
          {OPS_JEAN_BOSCO_INCIDENTS.map((inc) => (
            <label
              key={inc.id}
              className="flex items-center gap-2 text-[13px] mb-2 cursor-pointer"
            >
              <input
                type="checkbox"
                checked={selectedIncidents.includes(inc.id)}
                onChange={() => toggleIncident(inc.id)}
                className="accent-(--accent)"
              />
              {inc.id} — {inc.type}
            </label>
          ))}
          <label className="dispatcher-field mt-3 max-w-xs">
            <span className="field-label">Transfer to</span>
            <select
              className="dispatcher-input dispatcher-select"
              value={transferTo}
              onChange={(e) => setTransferTo(e.target.value)}
            >
              <option value="">Select dispatcher</option>
              {dispatchers
                .filter((d) => d.id !== "DSP-0042")
                .map((d) => (
                  <option key={d.id} value={d.id}>
                    {d.name} — {d.incidents} active
                  </option>
                ))}
            </select>
          </label>
          <div className="flex gap-2 mt-3">
            <button
              type="button"
              className="dispatcher-btn-primary text-[12px]"
              disabled={!transferTo || !selectedIncidents.length}
              onClick={handleConfirmTransfer}
            >
              Confirm Transfer
            </button>
            <button
              type="button"
              className="dispatcher-btn-ghost text-[12px]"
              onClick={() => setRedistributeId(null)}
            >
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

import { useEffect, useState } from "react";
import MetricCard from "../../components/dispatcher/MetricCard";
import StatusBadge from "../../components/dispatcher/StatusBadge";
import OpsManagerDistrictLabel from "../../components/ops-manager/OpsManagerDistrictLabel";
import { getDispatcherSupervision } from "../../api/dispatchers";

function initials(name) {
  if (!name) return "??";
  return name.split(" ").map((w) => w[0]).slice(0, 2).join("").toUpperCase();
}

function AiRateBar({ rate }) {
  if (rate == null) {
    return <span className="text-[11px] text-(--text-muted)">No dispatches yet</span>;
  }
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
  const [dispatchers, setDispatchers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    getDispatcherSupervision()
      .then(setDispatchers)
      .catch(() => setError("Could not load dispatcher data — check your connection and retry."))
      .finally(() => setLoading(false));
  }, []);

  // Workload thresholds match the "overload" flagging elsewhere in the app
  const overloaded = dispatchers.filter((d) => d.active_incidents > 6).length;
  const withAiData = dispatchers.filter((d) => d.ai_acceptance_rate != null);
  const avgAi = withAiData.length
    ? Math.round(withAiData.reduce((s, d) => s + d.ai_acceptance_rate, 0) / withAiData.length)
    : null;
  const totalIncidents = dispatchers.reduce((s, d) => s + d.active_incidents, 0);

  return (
    <div className="portal-page relative">
      <h1 className="dispatcher-page-title m-0">Dispatcher Supervision</h1>
      <OpsManagerDistrictLabel />
      <p className="dispatcher-page-subtitle mt-2">
        Monitor workload and AI acceptance across dispatchers in your district.
      </p>

      <div className="portal-grid-4 my-6">
        <MetricCard label="Active Dispatchers" value={loading ? '…' : String(dispatchers.length)} />
        <MetricCard label="Avg AI Acceptance" value={loading ? '…' : (avgAi != null ? `${avgAi}%` : 'N/A')} />
        <MetricCard
          label="Overloaded"
          value={loading ? '…' : String(overloaded)}
          hintTone={overloaded ? "critical" : "positive"}
        />
        <MetricCard label="Total Active Incidents" value={loading ? '…' : String(totalIncidents)} />
      </div>

      {error && (
        <div
          className="px-4 py-3 rounded-lg border text-[13px] mb-4"
          style={{ background: 'var(--status-critical-bg)', color: 'var(--status-critical)', borderColor: 'var(--status-critical)' }}
        >
          {error}
        </div>
      )}

      <div className="dispatcher-surface table-scroll">
        <table className="w-full text-left text-[13px] border-collapse min-w-[800px]">
          <thead>
            <tr
              className="border-b border-(--border) text-[11px] uppercase tracking-wider text-(--text-muted)"
              style={{ fontFamily: "var(--font-display)" }}
            >
              <th className="p-3">Dispatcher</th>
              <th className="p-3">Active Incidents</th>
              <th className="p-3">Handled Today</th>
              <th className="p-3">AI Acceptance</th>
              <th className="p-3">Status</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={5} className="p-6 text-center text-(--text-muted)">Loading…</td></tr>
            ) : dispatchers.length === 0 ? (
              <tr><td colSpan={5} className="p-6 text-center text-(--text-muted)">No dispatchers assigned to your district.</td></tr>
            ) : dispatchers.map((d) => (
              <tr
                key={d.user_id}
                className="border-b border-(--border-subtle) hover:bg-(--bg-elevated)"
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
                      {initials(d.name)}
                    </span>
                    <div className="font-semibold">{d.name}</div>
                  </div>
                </td>
                <td
                  className="p-3 font-bold"
                  style={{
                    color: d.active_incidents > 6 ? "var(--status-critical)" : undefined,
                  }}
                >
                  {d.active_incidents}
                </td>
                <td className="p-3">{d.incidents_handled_today}</td>
                <td className="p-3">
                  <AiRateBar rate={d.ai_acceptance_rate} />
                </td>
                <td className="p-3">
                  <StatusBadge
                    label={d.on_duty ? "ON DUTY" : "OFF DUTY"}
                    variant={d.on_duty ? "resolved" : "info"}
                  />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

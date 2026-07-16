import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Brain, MapPin } from "lucide-react";
import SectionTitle from "../../components/dispatcher/SectionTitle";
import StatusBadge from "../../components/dispatcher/StatusBadge";
import OpsManagerDistrictLabel from "../../components/ops-manager/OpsManagerDistrictLabel";
import { getCurrentUser } from "../../utils/authSession";
import { listCoverageGaps } from "../../api/planning";
import {
  listMutualAidRequests,
  createMutualAidRequest,
} from "../../api/mutualAid";

const DURATION_MINUTES = { "1h": 60, "2h": 120, "4h": 240, "Full shift": 480 };

function timeAgo(isoString) {
  const diffMin = Math.floor((Date.now() - new Date(isoString).getTime()) / 60000);
  if (diffMin < 1) return "Just now";
  if (diffMin < 60) return `${diffMin}m ago`;
  return `${Math.floor(diffMin / 60)}h ago`;
}

function statusVariant(status) {
  if (status === "APPROVED" || status === "FULFILLED") return "resolved";
  if (status === "PENDING") return "handover";
  return "critical";
}

function CoverageGapsPanel() {
  const [gaps, setGaps] = useState([]);
  const [loading, setLoading] = useState(true);
  const districtId = getCurrentUser()?.district_id;

  useEffect(() => {
    listCoverageGaps(districtId)
      .then(setGaps)
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [districtId]);

  return (
    <div className="flex flex-col gap-3">
      <p className="dispatcher-page-subtitle m-0">
        Real fleet availability by vehicle category in your district — a gap means fewer than 60% of that
        category's units are currently available.
      </p>
      {loading ? (
        <div className="dispatcher-surface p-8 text-center text-(--text-muted) text-[13px]">Loading…</div>
      ) : gaps.length === 0 ? (
        <div className="dispatcher-surface p-8 text-center text-(--text-muted) text-[13px]">
          No coverage gaps right now — every vehicle category is at or above target availability.
        </div>
      ) : (
        gaps.map((g) => (
          <div key={g.zone} className="dispatcher-surface p-4">
            <div className="flex flex-wrap items-center gap-2 mb-1">
              <Brain size={14} className="text-(--accent)" />
              <span className="font-bold text-(--text-primary)">{g.zone}</span>
              <StatusBadge label={`${g.coverage}% available`} variant={g.coverage < 30 ? "critical" : "handover"} />
            </div>
            <p className="text-[12px] text-(--text-secondary) m-0 mt-2">{g.recommendation}</p>
            <div className="mt-3">
              <Link to="/ops-manager/map" className="dispatcher-btn-outline no-underline text-[12px] inline-flex items-center gap-1.5">
                <MapPin size={13} /> View fleet on map
              </Link>
            </div>
          </div>
        ))
      )}
    </div>
  );
}

function MutualAidPanel() {
  const currentUser = getCurrentUser();
  const districtId = currentUser?.district_id;
  const [history, setHistory] = useState([]);
  const [historyLoading, setHistoryLoading] = useState(true);
  const [form, setForm] = useState({
    unitType: "Police Van",
    qty: 2,
    duration: "2h",
    notes: "",
  });
  const [submitted, setSubmitted] = useState(false);
  const [submitError, setSubmitError] = useState(null);
  const [toast, setToast] = useState(null);

  const showToast = (msg) => {
    setToast(msg);
    setTimeout(() => setToast(null), 3500);
  };

  useEffect(() => {
    if (!districtId) return;
    listMutualAidRequests({ districtId })
      .then(setHistory)
      .catch(() => {})
      .finally(() => setHistoryLoading(false));
  }, [districtId]);

  const handleSubmitMutualAid = async () => {
    if (!districtId) return;
    setSubmitError(null);
    try {
      // You state what you need — your own District Commander decides how
      // to fulfill it (including coordinating with other districts), so
      // there's no "pick a source district" step here.
      const created = await createMutualAidRequest({
        requesting_district_id: districtId,
        unit_type: form.unitType,
        quantity: form.qty,
        duration: DURATION_MINUTES[form.duration] ?? 120,
        reason: form.notes || null,
      });
      setHistory((prev) => [created, ...prev]);
      setSubmitted(true);
      showToast("Request sent to your District Commander");
    } catch (err) {
      setSubmitError(err?.response?.data?.message ?? "Could not submit request. Please retry.");
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 relative">
      {toast && (
        <div
          className="fixed top-20 right-6 z-50 max-w-sm px-4 py-3 rounded-lg border text-[13px] font-medium shadow-lg"
          style={{ background: "var(--bg-surface)", borderColor: "var(--status-low)", color: "var(--status-low)" }}
        >
          {toast}
        </div>
      )}
      <div className="dispatcher-surface p-5">
        <SectionTitle title="Request Mutual Aid" />
        <p className="text-[12px] text-(--text-muted) m-0 mt-1">
          Sent to your District Commander — they decide how to fulfill it.
        </p>
        {submitError && (
          <p className="text-[12px] mt-3 m-0" style={{ color: "var(--status-critical)" }}>{submitError}</p>
        )}
        {submitted ? (
          <div
            className="mt-4 p-4 rounded-lg flex flex-col gap-2"
            style={{ background: "var(--status-low-bg)", border: "1px solid var(--status-low)" }}
          >
            <div className="font-bold text-(--status-low)">Request submitted</div>
            <button
              type="button"
              className="dispatcher-btn-ghost text-[12px] self-start mt-2"
              onClick={() => setSubmitted(false)}
            >
              Submit another request
            </button>
          </div>
        ) : (
          <div className="flex flex-col gap-3 mt-4">
            <label className="dispatcher-field">
              <span className="field-label">Unit type needed</span>
              <select
                className="dispatcher-input dispatcher-select"
                value={form.unitType}
                onChange={(e) => setForm((f) => ({ ...f, unitType: e.target.value }))}
              >
                {["Police Van", "Motorcycle", "Ambulance", "Fire Unit"].map((t) => (
                  <option key={t}>{t}</option>
                ))}
              </select>
            </label>
            <label className="dispatcher-field">
              <span className="field-label">Quantity needed</span>
              <input
                type="number"
                min={1}
                max={10}
                className="dispatcher-input dispatcher-text-input"
                value={form.qty}
                onChange={(e) => setForm((f) => ({ ...f, qty: Number(e.target.value) }))}
              />
            </label>
            <label className="dispatcher-field">
              <span className="field-label">Duration needed</span>
              <select
                className="dispatcher-input dispatcher-select"
                value={form.duration}
                onChange={(e) => setForm((f) => ({ ...f, duration: e.target.value }))}
              >
                {["1h", "2h", "4h", "Full shift"].map((d) => (
                  <option key={d}>{d}</option>
                ))}
              </select>
            </label>
            <label className="dispatcher-field">
              <span className="field-label">Reason / notes</span>
              <textarea
                className="dispatcher-input dispatcher-textarea"
                rows={3}
                value={form.notes}
                onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))}
              />
            </label>
            <button
              type="button"
              className="dispatcher-btn-primary w-full"
              onClick={handleSubmitMutualAid}
            >
              Submit Mutual Aid Request
            </button>
          </div>
        )}
      </div>
      <div className="dispatcher-surface p-5">
        <SectionTitle title="Request History" />
        <div className="mt-4">
          {historyLoading ? (
            <p className="text-[12px] text-(--text-muted) m-0">Loading…</p>
          ) : history.length === 0 ? (
            <p className="text-[12px] text-(--text-muted) m-0">No mutual aid requests from your district yet.</p>
          ) : (
            history.map((r) => (
              <div key={r.request_id} className="py-3 border-b border-(--border-subtle) last:border-0">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-[12px] text-(--text-secondary)">
                    {r.source_district_name ?? "—"} · {r.quantity}× {r.unit_type}
                  </span>
                  <StatusBadge label={r.status} variant={statusVariant(r.status)} />
                  <span className="text-[11px] font-mono text-(--text-muted) ml-auto">
                    {timeAgo(r.created_at)}
                  </span>
                </div>
                {r.reason && (
                  <div className="text-[11px] text-(--text-secondary) mt-1">{r.reason}</div>
                )}
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}

export default function OpsManagerResources() {
  const [tab, setTab] = useState("recommendations");

  return (
    <div className="portal-page relative">
      <div className="mb-4">
        <h1 className="dispatcher-page-title m-0">Resource Reallocation</h1>
        <OpsManagerDistrictLabel />
      </div>
      <div className="flex flex-wrap gap-2 mb-6 border-b border-(--border) pb-2">
        {["recommendations", "mutual-aid"].map((t) => (
          <button
            key={t}
            type="button"
            className="text-[13px] font-semibold px-4 py-2 border-none bg-transparent cursor-pointer border-b-2 -mb-[10px] transition-colors"
            style={{
              borderColor: tab === t ? "var(--accent)" : "transparent",
              color: tab === t ? "var(--accent)" : "var(--text-muted)",
            }}
            onClick={() => setTab(t)}
          >
            {t === "recommendations" ? "AI Recommendations" : "Mutual Aid"}
          </button>
        ))}
      </div>

      {tab === "recommendations" && <CoverageGapsPanel />}
      {tab === "mutual-aid" && <MutualAidPanel />}
    </div>
  );
}

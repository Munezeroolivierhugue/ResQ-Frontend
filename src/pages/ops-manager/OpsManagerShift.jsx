import { useState, useEffect } from "react";
import { FileText, Siren, CheckCircle, AlertTriangle, Clock, ChevronsUp } from "lucide-react";
import SurfaceCard from "../../components/dispatcher/SurfaceCard";
import MetricCard from "../../components/dispatcher/MetricCard";
import SectionTitle from "../../components/dispatcher/SectionTitle";
import DataTable from "../../components/dispatcher/DataTable";
import StatusBadge from "../../components/dispatcher/StatusBadge";
import { FormTextarea } from "../../components/dispatcher/FormControls";
import OpsManagerDistrictLabel from "../../components/ops-manager/OpsManagerDistrictLabel";
import { getMyShifts, saveShiftNotes, startShift } from "../../api/shifts";
import { listIncidents } from "../../api/incidents";
import { getResponseTimeTarget } from "../../api/admin";
import { getCurrentUser } from "../../utils/authSession";
import { formatIncidentType } from "../../utils/incidentTypeLabels";
import { buildPdfHtml, openPdfWindow, sectionHtml, tableHtml } from "../../utils/pdfExport";
import { useOpsManagerStore } from "../../store/opsManagerStore";

function fmtDate(iso) {
  if (!iso) return "—";
  return new Date(iso).toLocaleString();
}

export default function OpsManagerShift() {
  const currentUser = getCurrentUser();
  const districtId = currentUser?.district_id;

  const [shift, setShift] = useState(null);
  const [incidents, setIncidents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [slaTargetMinutes, setSlaTargetMinutes] = useState(12);
  const [notes, setNotes] = useState("");
  // 'idle' | 'saving' | 'saved' | 'error'
  const [noteState, setNoteState] = useState("idle");

  const markHandoverRead = useOpsManagerStore((s) => s.markHandoverRead);

  useEffect(() => {
    getResponseTimeTarget().then(setSlaTargetMinutes).catch(() => {});
    // The Dashboard's "Shift Handover Summary Available" banner points here
    // and expects a visit to clear it — preserved even though the old fake
    // "Incoming Handover" tab (invented incidents/unit issues with nothing
    // real behind them) is gone.
    markHandoverRead();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!districtId) return;
    Promise.allSettled([getMyShifts(), listIncidents({ districtId })]).then(async ([shiftsResult, incsResult]) => {
      const shifts = shiftsResult.status === "fulfilled" ? shiftsResult.value : [];
      const incs = incsResult.status === "fulfilled" ? incsResult.value : [];
      let latest = shifts.sort((a, b) => new Date(b.shift_start) - new Date(a.shift_start))[0] ?? null;
      // Same gap this fixed on the dispatcher side: Ops Managers never had a
      // shift-start action anywhere, so this page always found zero shift
      // records and "Save notes" (the real handover-to-DC delivery) stayed
      // permanently disabled. Start one silently on first visit.
      if (!latest && currentUser?.user_id) {
        try {
          latest = await startShift({
            user_id: currentUser.user_id,
            district_id: districtId,
            role_on_shift: currentUser.role ?? "OPERATIONS_MANAGER",
          });
        } catch { /* non-fatal — page still works read-only */ }
      }
      setShift(latest);
      if (latest?.handover_notes) setNotes(latest.handover_notes);
      if (latest?.shift_start) {
        const start = new Date(latest.shift_start);
        const end = latest.shift_end ? new Date(latest.shift_end) : new Date();
        setIncidents(incs.filter((i) => { const t = new Date(i.call_time); return t >= start && t <= end; }));
      } else {
        const startOfDay = new Date();
        startOfDay.setHours(0, 0, 0, 0);
        setIncidents(incs.filter((i) => i.call_time && new Date(i.call_time) >= startOfDay));
      }
    }).finally(() => setLoading(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [districtId]);

  const resolved = incidents.filter((i) => ["RESOLVED", "CLOSED"].includes(i.status)).length;
  const critical = incidents.filter((i) => i.severity === "critical").length;
  const escalated = incidents.filter((i) => i.escalated).length;
  const avgResp = (() => {
    const ms = incidents.filter((i) => i.response_time_minutes != null);
    return ms.length ? Math.round(ms.reduce((s, i) => s + i.response_time_minutes, 0) / ms.length) : null;
  })();

  const period = shift
    ? `${fmtDate(shift.shift_start)} — ${shift.shift_end ? fmtDate(shift.shift_end) : "Ongoing"}`
    : "Current shift";
  const generatedAt = fmtDate(new Date().toISOString());

  const handleSaveNotes = async () => {
    if (!shift?.shift_id || noteState === "saving") return;
    setNoteState("saving");
    try {
      await saveShiftNotes(shift.shift_id, notes);
      setNoteState("saved");
      setTimeout(() => setNoteState("idle"), 2500);
    } catch {
      setNoteState("error");
    }
  };

  const columns = [
    { key: "incident_ref", label: "Incident ID", render: (row) => (
      <span className="font-semibold text-(--accent)" style={{ fontFamily: "var(--font-mono)" }}>{row.incident_ref}</span>
    ) },
    { key: "incident_type", label: "Type", render: (row) => (
      <span className="inline-flex items-center gap-2">
        <Siren size={14} className="text-(--accent) shrink-0" />
        {formatIncidentType(row.incident_type)}
      </span>
    ) },
    { key: "severity", label: "Severity", render: (row) => (
      <StatusBadge label={(row.severity ?? "").toUpperCase()} variant={row.severity === "critical" ? "critical" : "handover"} />
    ) },
    { key: "call_time", label: "Time", render: (row) => (
      <span style={{ fontFamily: "var(--font-mono)" }}>{row.call_time ? new Date(row.call_time).toLocaleString() : "—"}</span>
    ) },
    { key: "status", label: "Status", render: (row) => (
      <StatusBadge
        label={row.status === "CLOSED" ? "Closed" : row.status}
        variant={row.status === "CLOSED" ? "resolved" : "handover"}
      />
    ) },
  ];

  const sortedIncidents = [...incidents].sort((a, b) => new Date(b.call_time ?? 0) - new Date(a.call_time ?? 0));

  const handleGeneratePdf = () => {
    const generatedBy = currentUser?.full_name ?? currentUser?.email ?? "Operations Manager";
    const rows20 = sortedIncidents.slice(0, 20);
    const tableSection = sectionHtml(
      `Incident Log${sortedIncidents.length > 20 ? ` (first 20 of ${sortedIncidents.length})` : ""}`,
      tableHtml(
        ["Incident ID", "Type", "Severity", "Time", "Status"],
        rows20.map((r) => [
          `<span style="font-family:monospace;font-weight:700">${r.incident_ref ?? "—"}</span>`,
          formatIncidentType(r.incident_type) ?? "—",
          (r.severity ?? "—").toUpperCase(),
          r.call_time ? new Date(r.call_time).toLocaleString() : "—",
          r.status ?? "—",
        ])
      )
    );
    const notesSection = notes
      ? sectionHtml("Notes for District Commander", `<p style="font-size:12px;line-height:1.6;white-space:pre-wrap">${notes}</p>`)
      : "";

    openPdfWindow(buildPdfHtml({
      title: "Shift Performance Report",
      subtitle: `${period}. Generated on ${generatedAt}.`,
      reportType: "SHIFT REPORT",
      idPrefix: "OPS",
      metaItems: [
        { label: "Operations Manager", value: generatedBy },
        { label: "District", value: currentUser?.district_name ?? "—" },
        { label: "Period", value: period },
      ],
      kpis: [
        { label: "Total Incidents", value: incidents.length, sub: "This shift" },
        { label: "Resolved", value: resolved, sub: `${incidents.length ? Math.round((resolved / incidents.length) * 100) : 0}% of shift` },
        { label: "Critical", value: critical, sub: "High-priority incidents" },
        { label: "Escalated", value: escalated, sub: "Sent for higher supervision" },
        { label: "Avg Response", value: avgResp != null ? `${avgResp} min` : "N/A", sub: `Target: ${slaTargetMinutes} min` },
      ],
      sections: [tableSection, notesSection].filter(Boolean),
      generatedBy,
      generatedRole: "Operations Manager",
    }));
  };

  return (
    <div className="portal-page">
      <div className="flex flex-wrap items-start justify-between gap-4 mb-4">
        <div>
          <h1 className="dispatcher-page-title m-0">Shift Performance</h1>
          <OpsManagerDistrictLabel />
          <p className="dispatcher-page-subtitle m-0 mt-1">
            Real incident activity for {period}. Generated on {generatedAt}.
          </p>
        </div>
        <button type="button" className="dispatcher-btn-primary flex items-center gap-2" onClick={handleGeneratePdf}>
          <FileText size={14} />
          Generate report PDF
        </button>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-5 gap-3 mb-6">
        <MetricCard icon={Siren} label="Total Incidents" value={loading ? "…" : incidents.length} hint="This shift" hintTone="neutral" />
        <MetricCard icon={CheckCircle} label="Resolved" value={loading ? "…" : resolved} hint={`${incidents.length ? Math.round((resolved / incidents.length) * 100) : 0}% of shift`} hintTone="positive" />
        <MetricCard icon={AlertTriangle} label="Critical" value={loading ? "…" : critical} hint="High-priority incidents" hintTone={critical > 0 ? "critical" : "neutral"} />
        <MetricCard icon={ChevronsUp} label="Escalated" value={loading ? "…" : escalated} hint="Sent for higher supervision" hintTone={escalated > 0 ? "warning" : "neutral"} />
        <MetricCard icon={Clock} label="Avg Response" value={loading ? "…" : (avgResp != null ? `${avgResp}m` : "N/A")} hint={`Target: ${slaTargetMinutes} min`} hintTone={avgResp != null && avgResp <= slaTargetMinutes ? "positive" : "critical"} />
      </div>

      <SurfaceCard className="mb-5" padding="p-0 overflow-hidden">
        <div className="px-5 py-4 border-b border-(--border)">
          <SectionTitle title="Significant Incidents" className="mb-0" />
        </div>
        {loading ? (
          <div className="py-12 text-center text-[13px] text-(--text-muted)">Loading shift data…</div>
        ) : (
          <DataTable
            columns={columns}
            rows={sortedIncidents}
            footer={
              <span className="text-[12px] text-(--text-muted)">
                {incidents.length} incident{incidents.length !== 1 ? "s" : ""} this shift
              </span>
            }
          />
        )}
      </SurfaceCard>

      <SurfaceCard padding="p-5 md:p-6 flex flex-col">
        <SectionTitle title="Your notes for District Commander" className="mb-4" />
        <FormTextarea
          label="Handover notes"
          value={notes}
          onChange={setNotes}
          placeholder="What went well, challenges encountered, resource recommendations for next shift…"
          rows={5}
          className="flex-1 mb-0"
        />
        <div className="flex items-center gap-2 mt-4 pt-4 border-t border-(--border-subtle)">
          <div>
            <div className="text-[13px] font-semibold text-(--text-primary)">
              {currentUser?.full_name ?? currentUser?.email ?? "Operations Manager"}
            </div>
            {!shift && (
              <div className="text-[11px] text-(--text-muted)">No shift data</div>
            )}
          </div>
          <div className="ml-auto flex items-center gap-2 shrink-0">
            {noteState === "error" && (
              <span className="text-[11px] font-semibold" style={{ color: "var(--status-critical)" }}>
                Save failed — retry
              </span>
            )}
            <button
              type="button"
              onClick={handleSaveNotes}
              disabled={!shift || noteState === "saving"}
              className="dispatcher-btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
              title={!shift ? "No shift record to attach notes to" : undefined}
            >
              {noteState === "saving" ? "Saving…" : noteState === "saved" ? "Saved ✓" : "Save notes → District Commander"}
            </button>
          </div>
        </div>
      </SurfaceCard>
    </div>
  );
}

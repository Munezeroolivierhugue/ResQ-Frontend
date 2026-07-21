import { useState, useEffect } from 'react'
import { Download, Send, Check, Siren, Clock, CheckCircle2, Car, MapPin } from 'lucide-react'
import { buildPdfHtml, openPdfWindow, sectionHtml } from '../../utils/pdfExport'

function exportPDF({ periodLabel, periodStart, periodEnd, districtName, draftReport, assessment, recommendations, generatedBy }) {
  const fmtTime = (v) => v != null ? `${Number(v).toFixed(1)} min` : '—'
  const fmtRate = (v) => v != null ? `${Math.round(v * 100)}%` : '—'

  const sections = []
  if (assessment?.trim())
    sections.push(sectionHtml('Strategic Assessment', `<div style="font-size:12px;line-height:1.7;color:#333;white-space:pre-wrap">${assessment.replace(/</g,'&lt;').replace(/>/g,'&gt;')}</div>`))
  if (recommendations?.trim())
    sections.push(sectionHtml('Recommendations', `<div style="font-size:12px;line-height:1.7;color:#333;white-space:pre-wrap">${recommendations.replace(/</g,'&lt;').replace(/>/g,'&gt;')}</div>`))

  openPdfWindow(buildPdfHtml({
    title: 'District Executive Report',
    subtitle: `${districtName ?? 'District'} · ${periodLabel}`,
    reportType: 'EXECUTIVE REPORT',
    idPrefix: 'EXE',
    metaItems: [
      { label: 'District', value: districtName ?? '—' },
      { label: 'Period', value: `${periodStart} – ${periodEnd}` },
    ],
    kpis: [
      { label: 'Total Incidents', value: draftReport?.total_incidents ?? '—', sub: 'In period' },
      { label: 'Avg Response Time', value: fmtTime(draftReport?.avg_response_time), sub: 'Target < 8 min' },
      { label: 'Resolution Rate', value: fmtRate(draftReport?.resolution_rate), sub: 'Resolved / total' },
      { label: 'District', value: districtName ?? '—', sub: 'Assigned area' },
    ],
    sections,
    generatedBy: generatedBy ?? 'District Commander',
    generatedRole: 'District Commander',
  }))
}
import AdminStatCard from '../../components/admin/AdminStatCard'
import StatusBadge from '../../components/dispatcher/StatusBadge'
import DCPageHeader from '../../components/district-commander/DCPageHeader'
import { listReports, generateReport, submitReport } from '../../api/reporting'
import { listIncidents } from '../../api/incidents'
import { listVehicles } from '../../api/vehicles'
import { getCurrentUser } from '../../utils/authSession'
import { getDistrictCommanderDistrict } from '../../utils/districtCommanderSession'
import { useToastStore } from '../../store/toastStore'

function fmtRespTime(minutes) {
  if (minutes == null) return '—'
  return `${Number(minutes).toFixed(1)}m`
}

function fmtDate(iso) {
  if (!iso) return '—'
  return new Date(iso).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })
}

function currentMonthPeriod() {
  const now = new Date()
  const yr = now.getFullYear()
  const mo = now.getMonth() + 1
  const day = now.getDate()
  const start = `${yr}-${String(mo).padStart(2, '0')}-01`
  const end = `${yr}-${String(mo).padStart(2, '0')}-${String(day).padStart(2, '0')}`
  const label = now.toLocaleDateString('en-GB', { month: 'long', year: 'numeric' })
  return { start, end, label }
}

export default function DCExecutiveReport() {
  const districtId = getCurrentUser()?.district_id
  const districtName = getDistrictCommanderDistrict()
  const { start: periodStart, end: periodEnd, label: periodLabel } = currentMonthPeriod()

  const [tab, setTab] = useState('current')
  const [assessment, setAssessment] = useState('')
  const [recommendations, setRecommendations] = useState('')

  const [archive, setArchive] = useState([])
  const [archiveLoading, setArchiveLoading] = useState(true)

  // Draft report state from backend
  const [draftReport, setDraftReport] = useState(null)
  const [submitting, setSubmitting] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const pushToast = useToastStore((s) => s.pushToast)

  // Real incident data for the current period, used to build the incident
  // type breakdown and significant events sections below — no mock rows.
  const [periodIncidents, setPeriodIncidents] = useState([])
  const [incidentsLoading, setIncidentsLoading] = useState(true)
  const [coverageRatio, setCoverageRatio] = useState(null)

  function showToast(msg, variant = 'success') {
    pushToast({ variant, title: variant === 'error' ? 'Error' : 'Executive Report', message: msg })
  }

  useEffect(() => {
    listReports('EXECUTIVE', districtId)
      .then(setArchive)
      .catch(() => {})
      .finally(() => setArchiveLoading(false))
  }, [districtId])

  useEffect(() => {
    if (!districtId) { Promise.resolve().then(() => setIncidentsLoading(false)); return }
    listIncidents({ districtId })
      .then((all) => {
        const inPeriod = all.filter((i) => i.call_time && i.call_time >= periodStart && i.call_time <= `${periodEnd}T23:59:59`)
        setPeriodIncidents(inPeriod)
      })
      .catch(() => {})
      .finally(() => setIncidentsLoading(false))
    listVehicles({ districtId })
      .then((vehicles) => {
        if (!vehicles.length) return
        const available = vehicles.filter((v) => v.status === 'available').length
        setCoverageRatio(Math.round((available / vehicles.length) * 100))
      })
      .catch(() => {})
  }, [districtId, periodStart, periodEnd])

  const incidentTypeBreakdown = (() => {
    const byType = {}
    for (const inc of periodIncidents) {
      const key = inc.incident_type ?? 'Other'
      if (!byType[key]) byType[key] = { type: key, count: 0, totalResponse: 0, responseCount: 0, resolved: 0 }
      const bucket = byType[key]
      bucket.count += 1
      if (inc.response_time_minutes != null) {
        bucket.totalResponse += inc.response_time_minutes
        bucket.responseCount += 1
      }
      if (inc.status === 'CLOSED' || inc.status === 'RESOLVED') bucket.resolved += 1
    }
    return Object.values(byType)
      .map((b) => ({
        type: b.type,
        count: b.count,
        avgResponse: b.responseCount ? fmtRespTime(b.totalResponse / b.responseCount) : '—',
        resolution: `${Math.round((b.resolved / b.count) * 100)}%`,
      }))
      .sort((a, b) => b.count - a.count)
  })()

  const significantEvents = periodIncidents
    .filter((i) => i.severity === 'critical' || i.severity === 'high')
    .sort((a, b) => new Date(b.call_time) - new Date(a.call_time))
    .slice(0, 6)
    .map((i) => ({
      date: i.call_time ? new Date(i.call_time).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' }) : '—',
      text: `${i.incident_type ?? 'Incident'} — ${i.severity.toUpperCase()} severity${i.address ? ` at ${i.address}` : ''} (${i.status})`,
    }))

  // Live metrics computed directly from this period's real incidents, so
  // the KPI cards are accurate immediately — the analyst-facing report
  // record is only created/submitted when the DC actually submits.
  const liveMetrics = (() => {
    const total = periodIncidents.length
    const withResponse = periodIncidents.filter((i) => i.response_time_minutes != null)
    const avgResponse = withResponse.length
      ? withResponse.reduce((sum, i) => sum + i.response_time_minutes, 0) / withResponse.length
      : null
    const closed = periodIncidents.filter((i) => i.status === 'CLOSED' || i.status === 'RESOLVED').length
    const resolutionRate = total ? closed / total : null
    return { total, avgResponse, resolutionRate }
  })()

  const assessmentOk = assessment.trim().length >= 50
  const recommendationsOk = recommendations.trim().length >= 50

  const handleSubmit = async () => {
    setSubmitting(true)
    try {
      // The report record (which the analyst reads) is created from live
      // metrics at the moment of submission, so it always reflects the
      // real, current numbers rather than a stale earlier snapshot.
      const report = await generateReport({
        report_type: 'EXECUTIVE',
        district_id: districtId,
        period_start: periodStart,
        period_end: periodEnd,
      })
      setDraftReport(report)
      await submitReport(report.report_id)
      setSubmitted(true)
      showToast('Report submitted to the Analyst')
      listReports('EXECUTIVE', districtId).then(setArchive).catch(() => {})
    } catch {
      showToast('Submission failed — please try again', 'error')
    } finally {
      setSubmitting(false)
    }
  }

  const canSubmit = assessmentOk && recommendationsOk && !submitted && !submitting

  return (
    <div className="portal-page">
      <DCPageHeader title="Executive Report" subtitle="Monthly performance report submitted to the Analyst." />

      <div className="flex gap-2 mb-6 border-b border-(--border) pb-2">
        {[
          { id: 'current', label: `Current Month — ${periodLabel}` },
          { id: 'archive', label: 'Report Archive' },
        ].map((t) => (
          <button
            key={t.id}
            type="button"
            className="text-[13px] font-semibold px-4 py-2 border-none bg-transparent cursor-pointer border-b-2 -mb-[10px]"
            style={{
              borderColor: tab === t.id ? 'var(--accent)' : 'transparent',
              color: tab === t.id ? 'var(--accent)' : 'var(--text-muted)',
            }}
            onClick={() => setTab(t.id)}
          >
            {t.label}
          </button>
        ))}
      </div>

      {tab === 'current' && (
        <div className="flex flex-col gap-6">
          <div className="dispatcher-surface p-4 flex flex-wrap justify-between gap-4 items-start">
            <div>
              <div className="font-mono text-[11px] font-bold text-(--accent) uppercase tracking-wide">
                {periodLabel.toUpperCase()} EXECUTIVE REPORT
              </div>
              <div className="mt-2">
                <StatusBadge
                  label={submitted ? 'SUBMITTED' : 'IN PROGRESS'}
                  variant={submitted ? 'resolved' : 'handover'}
                />
              </div>
              <p className="text-[12px] text-(--text-muted) m-0 mt-2">Report period: {periodStart} – {periodEnd}</p>
            </div>
            <div className="flex flex-wrap gap-2">
              <button type="button" className="dispatcher-btn-ghost text-[12px] inline-flex items-center gap-1.5"
                onClick={() => {
                  const cu = getCurrentUser()
                  exportPDF({
                    periodLabel, periodStart, periodEnd,
                    districtName,
                    draftReport: draftReport ?? {
                      total_incidents: liveMetrics.total,
                      avg_response_time: liveMetrics.avgResponse,
                      resolution_rate: liveMetrics.resolutionRate,
                    },
                    assessment,
                    recommendations,
                    generatedBy: cu?.fullName || 'District Commander',
                  })
                }}>
                <Download size={14} />
                Generate PDF
              </button>
            </div>
          </div>

          {submitted && (
            <div
              className="dispatcher-surface p-4 flex items-start gap-3"
              style={{ background: 'var(--status-low-bg)', border: '1px solid var(--status-low)' }}
            >
              <Check size={24} style={{ color: 'var(--status-low)' }} className="shrink-0" />
              <div>
                <div className="font-bold text-(--status-low)">Report submitted to the Analyst</div>
                <p className="text-[12px] text-(--text-secondary) m-0 mt-1">
                  A confirmation has been logged to your report archive.
                </p>
              </div>
            </div>
          )}

          <section className="rounded-lg p-4" style={{ background: 'var(--bg-elevated)' }}>
            <p className="text-[11px] text-(--text-muted) m-0 mb-3">
              {incidentsLoading ? 'Loading live district data…' : 'Live metrics from this period’s real incidents — updates automatically, no action needed.'}
            </p>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              <AdminStatCard icon={Siren} label="Incidents" value={incidentsLoading ? '—' : String(liveMetrics.total)} />
              <AdminStatCard icon={Clock} label="Avg Response" value={incidentsLoading ? '—' : fmtRespTime(liveMetrics.avgResponse)} />
              <AdminStatCard icon={CheckCircle2} label="Resolution Rate" value={incidentsLoading || liveMetrics.resolutionRate == null ? '—' : `${Math.round(liveMetrics.resolutionRate * 100)}%`} />
              <AdminStatCard icon={Car} label="Unit Availability" value={coverageRatio != null ? `${coverageRatio}%` : '—'} />
              <AdminStatCard icon={MapPin} label="District" value={districtName ?? '—'} />
            </div>
          </section>

          <section className="dispatcher-surface p-4 table-scroll">
            <h2 className="text-[13px] font-bold m-0 mb-3">Incident Analysis</h2>
            <table className="w-full min-w-[520px] text-[12px] border-collapse">
              <thead>
                <tr className="text-[12px] font-medium text-(--text-secondary) border-b border-(--border-subtle)">
                  <th className="text-left py-2 pr-3 font-bold">Type</th>
                  <th className="text-center py-2 pr-3 font-bold">Count</th>
                  <th className="text-center py-2 pr-3 font-bold">Avg Response</th>
                  <th className="text-center py-2 font-bold">Resolution Rate</th>
                </tr>
              </thead>
              <tbody>
                {incidentsLoading && (
                  <tr><td colSpan={4} className="py-4 text-center text-(--text-muted)">Loading…</td></tr>
                )}
                {!incidentsLoading && incidentTypeBreakdown.length === 0 && (
                  <tr><td colSpan={4} className="py-4 text-center text-(--text-muted)">No incidents recorded this period.</td></tr>
                )}
                {!incidentsLoading && incidentTypeBreakdown.map((row) => (
                  <tr key={row.type} className="border-b border-(--border-subtle) last:border-0">
                    <td className="py-2 pr-3 font-medium text-[13px]">{row.type}</td>
                    <td className="py-2 pr-3 text-center">{row.count}</td>
                    <td className="py-2 pr-3 text-center">{row.avgResponse}</td>
                    <td className="py-2 text-center">{row.resolution}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </section>

          <section className="dispatcher-surface p-4">
            <h2 className="text-[13px] font-bold m-0 mb-3">Significant Events</h2>
            {incidentsLoading ? (
              <p className="text-[12px] text-(--text-muted) m-0">Loading…</p>
            ) : significantEvents.length === 0 ? (
              <p className="text-[12px] text-(--text-muted) m-0">No high or critical severity incidents this period.</p>
            ) : (
              <ul className="m-0 p-0 list-none space-y-3">
                {significantEvents.map((ev, idx) => (
                  <li key={idx} className="dispatcher-timeline-item border-l-2 border-(--accent) pl-3">
                    <div className="text-[11px] font-mono text-(--accent)">{ev.date}</div>
                    <div className="text-[12px] text-(--text-primary) mt-0.5" style={{ fontFamily: 'var(--font-body)' }}>{ev.text}</div>
                  </li>
                ))}
              </ul>
            )}
          </section>

          <section className="dispatcher-surface p-4">
            <label className="dispatcher-field ">
              <span className="field-label " style={{ fontSize: '12px', color: 'var(--text-primary)', fontFamily: 'var(--font-body)' }}>Your strategic assessment (required)</span>
              <textarea
                className="dispatcher-input dispatcher-textarea"
                style={{ minHeight: '150px' }}
                placeholder="Describe operational highlights, challenges, resource constraints, and recommendations for the analyst..."
                value={assessment}
                onChange={(e) => setAssessment(e.target.value)}
                disabled={submitted}
              />
            </label>
            <p className="text-[11px] text-(--text-muted) m-0 mt-1">{assessment.length} / 2000</p>
          </section>

          <section className="dispatcher-surface p-4">
            <label className="dispatcher-field">
              <span className="field-label" style={{ fontSize: '12px', color: 'var(--text-primary)', fontFamily: 'var(--font-body)' }}>Recommendations</span>
              <textarea
                className="dispatcher-input dispatcher-textarea"
                style={{ minHeight: '100px' }}
                placeholder="List specific resource requests, policy recommendations, or operational changes for the analyst to consider..."
                value={recommendations}
                onChange={(e) => setRecommendations(e.target.value)}
                disabled={submitted}
              />
            </label>
          </section>

          <section className="pt-4 border-t border-(--border-subtle)">
            <ul className="text-[12px] text-(--text-muted) m-0 mb-4 space-y-1 list-none p-0">
              <li>{!incidentsLoading ? '✓' : '○'} Performance data auto-populated from live district data</li>
              <li>{!incidentsLoading ? '✓' : '○'} Incident analysis {incidentsLoading ? 'loading…' : 'complete'}</li>
              <li>{assessmentOk ? '✓' : '○'} District Commander assessment (required)</li>
              <li>{recommendationsOk ? '✓' : '○'} Recommendations (required)</li>
            </ul>
            <button
              type="button"
              className="dispatcher-btn-primary inline-flex items-center gap-2"
              disabled={!canSubmit}
              onClick={handleSubmit}
            >
              {submitting ? 'Submitting…' : <><Send size={16} />Submit to Analyst</>}
            </button>
          </section>
        </div>
      )}

      {tab === 'archive' && (
        <div className="dispatcher-surface table-scroll">
          <table className="w-full min-w-[480px] text-[12px] border-collapse">
            <thead>
              <tr className="text-[12px] font-medium text-(--text-secondary) border-b border-(--border-subtle)">
                <th className="text-left py-2 px-3 font-bold">Period</th>
                <th className="text-center py-2 px-3 font-bold">Submitted</th>
                <th className="text-center py-2 px-3 font-bold">Status</th>
                <th className="text-center py-2 px-3 font-bold">Action</th>
              </tr>
            </thead>
            <tbody>
              {archiveLoading && (
                <tr><td colSpan={4} className="py-6 text-center text-[13px] text-(--text-muted)">Loading archive…</td></tr>
              )}
              {!archiveLoading && archive.length === 0 && (
                <tr><td colSpan={4} className="py-6 text-center text-[13px] text-(--text-muted)">No executive reports submitted yet.</td></tr>
              )}
              {!archiveLoading && archive.map((row) => (
                <tr key={row.report_id} className="border-b border-(--border-subtle) last:border-0">
                  <td className="py-3 px-3 font-medium text-[13px]">
                    {row.period_start ? `${row.period_start} – ${row.period_end ?? ''}` : '—'}
                  </td>
                  <td className="py-3 px-3 text-center">{fmtDate(row.submitted_at ?? row.generated_at)}</td>
                  <td className="py-3 px-3 text-center">
                    <StatusBadge label={row.status ?? 'SUBMITTED'} variant="resolved" />
                  </td>
                  <td className="py-3 px-3 text-center">
                    <button
                      type="button"
                      className="dispatcher-btn-ghost text-[11px]"
                      onClick={() => {
                        const cu = getCurrentUser()
                        exportPDF({
                          periodLabel: row.period_start ? `${row.period_start} – ${row.period_end ?? ''}` : (row.period_start ?? 'Archived Period'),
                          periodStart: row.period_start ?? '—',
                          periodEnd: row.period_end ?? '—',
                          districtName: row.district_name ?? districtName,
                          draftReport: row,
                          assessment: '',
                          recommendations: '',
                          generatedBy: row.generated_by_name ?? cu?.fullName ?? 'District Commander',
                        })
                      }}
                    >
                      View
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}

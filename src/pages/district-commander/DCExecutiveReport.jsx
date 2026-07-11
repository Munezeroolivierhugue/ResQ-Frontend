import { useState, useEffect } from 'react'
import { Download, Send, Check } from 'lucide-react'
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
import MetricCard from '../../components/dispatcher/MetricCard'
import StatusBadge from '../../components/dispatcher/StatusBadge'
import DCPageHeader from '../../components/district-commander/DCPageHeader'
import {
  DC_INCIDENT_TYPES,
  DC_SIGNIFICANT_EVENTS,
} from '../../data/mockDistrictCommanderData'
import { listReports, generateReport, submitReport } from '../../api/reporting'
import { getCurrentUser } from '../../utils/authSession'

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
  const districtId = sessionStorage.getItem('resq-district-id') || undefined
  const { start: periodStart, end: periodEnd, label: periodLabel } = currentMonthPeriod()

  const [tab, setTab] = useState('current')
  const [assessment, setAssessment] = useState('')
  const [recommendations, setRecommendations] = useState('')
  const [pdfModal, setPdfModal] = useState(null)

  const [archive, setArchive] = useState([])
  const [archiveLoading, setArchiveLoading] = useState(true)

  // Draft report state from backend
  const [draftReport, setDraftReport] = useState(null)
  const [generating, setGenerating] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [toast, setToast] = useState(null)

  function showToast(msg) {
    setToast(msg)
    setTimeout(() => setToast(null), 2500)
  }

  useEffect(() => {
    listReports('EXECUTIVE', districtId)
      .then(setArchive)
      .catch(() => {})
      .finally(() => setArchiveLoading(false))
  }, [])

  const assessmentOk = assessment.trim().length >= 50
  const recommendationsOk = recommendations.trim().length >= 50

  const handleGenerate = async () => {
    setGenerating(true)
    try {
      const report = await generateReport({
        report_type: 'EXECUTIVE',
        district_id: districtId,
        period_start: periodStart,
        period_end: periodEnd,
      })
      setDraftReport(report)
      showToast('Draft report created')
    } catch {
      showToast('Failed to generate report — please try again')
    } finally {
      setGenerating(false)
    }
  }

  const handleSubmit = async () => {
    if (!draftReport?.report_id) {
      showToast('Generate a draft first before submitting')
      return
    }
    setSubmitting(true)
    try {
      await submitReport(draftReport.report_id)
      setSubmitted(true)
      showToast('Report submitted to Headquarters')
      // Refresh archive
      listReports('EXECUTIVE', districtId).then(setArchive).catch(() => {})
    } catch {
      showToast('Submission failed — please try again')
    } finally {
      setSubmitting(false)
    }
  }

  const canSubmit = assessmentOk && recommendationsOk && !submitted && !submitting

  return (
    <div className="portal-page">
      {toast && (
        <div className="fixed bottom-5 right-5 z-[9999] dispatcher-surface px-4 py-2.5 text-[13px] font-medium shadow-lg" style={{ borderLeft: '3px solid var(--accent)' }}>
          {toast}
        </div>
      )}

      <DCPageHeader title="Executive Report" subtitle="Monthly performance report for RNP Headquarters." />

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
                  label={submitted ? 'SUBMITTED' : draftReport ? 'DRAFT' : 'NOT STARTED'}
                  variant={submitted ? 'resolved' : 'handover'}
                />
              </div>
              <p className="text-[12px] text-(--text-muted) m-0 mt-2">Report period: {periodStart} – {periodEnd}</p>
            </div>
            <div className="flex flex-wrap gap-2">
              {!draftReport && !submitted && (
                <button
                  type="button"
                  className="dispatcher-btn-ghost text-[12px] inline-flex items-center gap-1.5"
                  disabled={generating}
                  onClick={handleGenerate}
                >
                  {generating ? 'Generating…' : '⚡ Generate Draft'}
                </button>
              )}
              <button type="button" className="dispatcher-btn-ghost text-[12px] inline-flex items-center gap-1.5"
                onClick={() => {
                  const cu = getCurrentUser()
                  exportPDF({
                    periodLabel, periodStart, periodEnd,
                    districtName: sessionStorage.getItem('resq-district-name') || undefined,
                    draftReport,
                    assessment,
                    recommendations,
                    generatedBy: cu?.fullName || sessionStorage.getItem('resq-full-name') || 'District Commander',
                  })
                }}>
                <Download size={14} />
                Generate PDF
              </button>
              <button
                type="button"
                className="dispatcher-btn-primary text-[12px] inline-flex items-center gap-1.5"
                disabled={!canSubmit}
                onClick={handleSubmit}
              >
                {submitting ? 'Submitting…' : <><Send size={14} />Submit to Headquarters</>}
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
                <div className="font-bold text-(--status-low)">Report submitted to RNP Headquarters</div>
                <p className="text-[12px] text-(--text-secondary) m-0 mt-1">
                  A confirmation has been logged to your report archive.
                </p>
              </div>
            </div>
          )}

          <section className="rounded-lg p-4" style={{ background: 'var(--bg-elevated)' }}>
            <p className="text-[11px] text-(--text-muted) m-0 mb-3">
              {draftReport ? 'Auto-generated from district data — do not edit.' : 'Click "Generate Draft" to populate metrics from live data.'}
            </p>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              <MetricCard label="Incidents" value={draftReport?.total_incidents != null ? String(draftReport.total_incidents) : '—'} hintTone="warning" />
              <MetricCard label="Avg Response" value={draftReport?.avg_response_time != null ? `${Number(draftReport.avg_response_time).toFixed(1)}m` : '—'} hintTone="positive" />
              <MetricCard label="Resolution Rate" value={draftReport?.resolution_rate != null ? `${Math.round(draftReport.resolution_rate * 100)}%` : '—'} hintTone="positive" />
              <MetricCard label="Coverage" value="91%" hint="Mock data" hintTone="positive" />
              <MetricCard label="Missed Calls" value="87%" hint="Mock data" hintTone="warning" />
              <MetricCard label="District" value={draftReport?.district_name ?? '—'} hintTone="neutral" />
            </div>
          </section>

          <section className="dispatcher-surface p-4 table-scroll">
            <h2 className="text-[13px] font-bold m-0 mb-3">Incident Analysis</h2>
            <table className="w-full min-w-[520px] text-[12px] border-collapse">
              <thead>
                <tr className="text-[10px] uppercase text-(--text-muted) border-b border-(--border-subtle)">
                  <th className="text-left py-2 pr-3">Type</th>
                  <th className="text-left py-2 pr-3">Count</th>
                  <th className="text-left py-2 pr-3">Avg Response</th>
                  <th className="text-left py-2">Resolution Rate</th>
                </tr>
              </thead>
              <tbody>
                {DC_INCIDENT_TYPES.map((row) => (
                  <tr key={row.type} className="border-b border-(--border-subtle)">
                    <td className="py-2 pr-3">{row.type}</td>
                    <td className="py-2 pr-3 font-mono">{row.count}</td>
                    <td className="py-2 pr-3 font-mono">{row.avgResponse}</td>
                    <td className="py-2 font-mono">{row.resolution}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </section>

          <section className="dispatcher-surface p-4">
            <h2 className="text-[13px] font-bold m-0 mb-3">Significant Events</h2>
            <ul className="m-0 p-0 list-none space-y-3">
              {DC_SIGNIFICANT_EVENTS.map((ev) => (
                <li key={ev.date} className="dispatcher-timeline-item border-l-2 border-(--accent) pl-3">
                  <div className="text-[11px] font-mono text-(--accent)">{ev.date}</div>
                  <div className="text-[12px] text-(--text-secondary) mt-0.5">{ev.text}</div>
                </li>
              ))}
            </ul>
          </section>

          <section className="dispatcher-surface p-4">
            <label className="dispatcher-field">
              <span className="field-label">Your strategic assessment (required)</span>
              <textarea
                className="dispatcher-input dispatcher-textarea"
                style={{ minHeight: '150px' }}
                placeholder="Describe operational highlights, challenges, resource constraints, and recommendations for headquarters..."
                value={assessment}
                onChange={(e) => setAssessment(e.target.value)}
                disabled={submitted}
              />
            </label>
            <p className="text-[11px] text-(--text-muted) m-0 mt-1">{assessment.length} / 2000</p>
          </section>

          <section className="dispatcher-surface p-4">
            <label className="dispatcher-field">
              <span className="field-label">Recommendations</span>
              <textarea
                className="dispatcher-input dispatcher-textarea"
                style={{ minHeight: '100px' }}
                placeholder="List specific resource requests, policy recommendations, or operational changes you are requesting HQ to consider..."
                value={recommendations}
                onChange={(e) => setRecommendations(e.target.value)}
                disabled={submitted}
              />
            </label>
          </section>

          <section className="pt-4 border-t border-(--border-subtle)">
            <ul className="text-[12px] text-(--text-muted) m-0 mb-4 space-y-1 list-none p-0">
              <li>{draftReport ? '✓' : '○'} Performance data auto-populated (generate draft first)</li>
              <li>✓ Incident analysis complete</li>
              <li>{assessmentOk ? '✓' : '○'} District Commander assessment (required)</li>
              <li>{recommendationsOk ? '✓' : '○'} Recommendations (required)</li>
            </ul>
            <button
              type="button"
              className="dispatcher-btn-primary inline-flex items-center gap-2"
              disabled={!canSubmit}
              onClick={handleSubmit}
            >
              {submitting ? 'Submitting…' : <><Send size={16} />Submit to Headquarters</>}
            </button>
          </section>
        </div>
      )}

      {tab === 'archive' && (
        <div className="dispatcher-surface table-scroll">
          <table className="w-full min-w-[480px] text-[12px] border-collapse">
            <thead>
              <tr className="text-[10px] uppercase text-(--text-muted) border-b border-(--border-subtle)">
                <th className="text-left py-2 px-3">Period</th>
                <th className="text-left py-2 px-3">Submitted</th>
                <th className="text-left py-2 px-3">Status</th>
                <th className="text-left py-2 px-3">Action</th>
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
                <tr key={row.report_id} className="border-b border-(--border-subtle)">
                  <td className="py-3 px-3 font-semibold">
                    {row.period_start ? `${row.period_start} – ${row.period_end ?? ''}` : '—'}
                  </td>
                  <td className="py-3 px-3 text-(--text-secondary)">{fmtDate(row.submitted_at ?? row.generated_at)}</td>
                  <td className="py-3 px-3">
                    <StatusBadge label={row.status ?? 'SUBMITTED'} variant="resolved" />
                  </td>
                  <td className="py-3 px-3">
                    <button
                      type="button"
                      className="dispatcher-btn-ghost text-[11px]"
                      onClick={() => setPdfModal(row.period_start ?? row.report_id)}
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

      {pdfModal && (
        <>
          <div className="fixed inset-0 bg-black/40 z-40" onClick={() => setPdfModal(null)} aria-hidden />
          <div className="fixed inset-0 z-50 flex items-center justify-center p-6 pointer-events-none">
            <div className="dispatcher-surface p-6 max-w-lg w-full pointer-events-auto max-h-[80vh] overflow-y-auto">
              <h3 className="font-mono text-(--accent) m-0 mb-2">Executive Report — {pdfModal}</h3>
              <p className="text-[12px] text-(--text-secondary) m-0 leading-relaxed">
                Report archived and submitted to RNP Headquarters. PDF export is not yet implemented.
              </p>
              <button type="button" className="dispatcher-btn-primary mt-4 text-[12px]" onClick={() => setPdfModal(null)}>
                Close
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  )
}

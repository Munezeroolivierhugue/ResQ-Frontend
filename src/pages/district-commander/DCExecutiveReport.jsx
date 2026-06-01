import { useState } from 'react'
import { Download, Send, Check } from 'lucide-react'
import MetricCard from '../../components/dispatcher/MetricCard'
import StatusBadge from '../../components/dispatcher/StatusBadge'
import DCPageHeader from '../../components/district-commander/DCPageHeader'
import {
  DC_INCIDENT_TYPES,
  DC_SIGNIFICANT_EVENTS,
  DC_REPORT_ARCHIVE,
} from '../../data/mockDistrictCommanderData'

export default function DCExecutiveReport() {
  const [tab, setTab] = useState('current')
  const [assessment, setAssessment] = useState('')
  const [recommendations, setRecommendations] = useState('')
  const [submitted, setSubmitted] = useState(false)
  const [pdfModal, setPdfModal] = useState(null)

  const assessmentOk = assessment.trim().length >= 50
  const recommendationsOk = recommendations.trim().length >= 50
  const canSubmit = assessmentOk && recommendationsOk && !submitted

  return (
    <div className="p-6">
      <DCPageHeader
        title="Executive Report"
        subtitle="Monthly performance report for RNP Headquarters."
      />

      <div className="flex gap-2 mb-6 border-b border-(--border) pb-2">
        {[
          { id: 'current', label: 'Current Month — May 2026' },
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
                MAY 2026 EXECUTIVE REPORT
              </div>
              <div className="mt-2">
                <StatusBadge label="DRAFT — Not yet submitted" variant="handover" />
              </div>
              <p className="text-[12px] text-(--text-muted) m-0 mt-2">Report period: May 1 – May 31, 2026</p>
            </div>
            <div className="flex flex-wrap gap-2">
              <button type="button" className="dispatcher-btn-ghost text-[12px] inline-flex items-center gap-1.5">
                <Download size={14} />
                Generate PDF
              </button>
              <button
                type="button"
                className="dispatcher-btn-primary text-[12px] inline-flex items-center gap-1.5"
                disabled={!canSubmit}
                onClick={() => setSubmitted(true)}
              >
                <Send size={14} />
                Submit to Headquarters
              </button>
            </div>
          </div>

          {submitted && (
            <div
              className="dispatcher-surface p-4 flex items-start gap-3"
              style={{
                background: 'var(--status-low-bg)',
                border: '1px solid var(--status-low)',
              }}
            >
              <Check size={24} style={{ color: 'var(--status-low)' }} className="shrink-0" />
              <div>
                <div className="font-bold text-(--status-low)">Report submitted to RNP Headquarters · May 26, 2026 at 14:32</div>
                <p className="text-[12px] text-(--text-secondary) m-0 mt-1">
                  A confirmation has been logged to your report archive.
                </p>
              </div>
            </div>
          )}

          <section className="rounded-lg p-4" style={{ background: 'var(--bg-elevated)' }}>
            <p className="text-[11px] text-(--text-muted) m-0 mb-3">Auto-generated from district data — do not edit.</p>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              <MetricCard label="Incidents" value="312" hint="↑ 8%" hintTone="warning" />
              <MetricCard label="Avg Response" value="7.4m" hint="✓ target" hintTone="positive" />
              <MetricCard label="Coverage" value="91%" hint="↑ 2%" hintTone="positive" />
              <MetricCard label="Resolution" value="94%" hint="↑ 3%" hintTone="positive" />
              <MetricCard label="Missed Calls" value="87%" hint="↓ 4%" hintTone="warning" />
              <MetricCard label="Units" value="18" hint="2 maint." hintTone="neutral" />
            </div>
          </section>

          <section className="dispatcher-surface p-4 overflow-x-auto">
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
              <li>✓ Performance data auto-populated</li>
              <li>✓ Incident analysis complete</li>
              <li>{assessmentOk ? '✓' : '○'} District Commander assessment (required)</li>
              <li>{recommendationsOk ? '✓' : '○'} Recommendations (required)</li>
            </ul>
            <button
              type="button"
              className="dispatcher-btn-primary inline-flex items-center gap-2"
              disabled={!canSubmit}
              onClick={() => setSubmitted(true)}
            >
              <Send size={16} />
              Submit to Headquarters
            </button>
          </section>
        </div>
      )}

      {tab === 'archive' && (
        <div className="dispatcher-surface overflow-x-auto">
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
              {DC_REPORT_ARCHIVE.map((row) => (
                <tr key={row.period} className="border-b border-(--border-subtle)">
                  <td className="py-3 px-3 font-semibold">{row.period}</td>
                  <td className="py-3 px-3 text-(--text-secondary)">{row.submitted}</td>
                  <td className="py-3 px-3">
                    <StatusBadge label={row.status} variant="resolved" />
                  </td>
                  <td className="py-3 px-3">
                    <button
                      type="button"
                      className="dispatcher-btn-ghost text-[11px]"
                      onClick={() => setPdfModal(row.period)}
                    >
                      View PDF
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
                District: Nyarugenge · Submitted to RNP Headquarters. This demo view shows a text summary only.
                Incidents: 298 avg · Response 7.6m · Coverage 90%. Significant events and OM assessments are archived
                per ministry retention policy.
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

import { useState, useRef, useEffect } from 'react'
import { Brain, TrendingUp, AlertCircle, Cpu, X, Download } from 'lucide-react'
import { buildPdfHtml, openPdfWindow, sectionHtml } from '../../utils/pdfExport'

function currentWeekLabel() {
  const now = new Date()
  const mon = new Date(now)
  mon.setDate(now.getDate() - ((now.getDay() + 6) % 7))
  const sun = new Date(mon)
  sun.setDate(mon.getDate() + 6)
  const fmt = (d) => d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })
  return `${fmt(mon)} – ${fmt(sun)}`
}

function exportPlannerPDF({ analysis, notes, generatedBy, stats }) {
  const weekLabel = currentWeekLabel()
  const sections = []
  if (analysis?.trim())
    sections.push(sectionHtml('Written Analysis', `<div style="font-size:12px;line-height:1.7;color:#333;white-space:pre-wrap">${analysis.replace(/</g,'&lt;').replace(/>/g,'&gt;')}</div>`))
  if (notes?.trim())
    sections.push(sectionHtml('Recommendations', `<div style="font-size:12px;line-height:1.7;color:#333;white-space:pre-wrap">${notes.replace(/</g,'&lt;').replace(/>/g,'&gt;')}</div>`))
  openPdfWindow(buildPdfHtml({
    title: 'Weekly Planning Report',
    subtitle: weekLabel,
    reportType: 'PLANNING REPORT',
    idPrefix: 'PLN',
    metaItems: [
      { label: 'Period', value: weekLabel },
    ],
    kpis: [
      { label: 'Plans Submitted', value: stats?.plansSubmitted ?? 'N/A' },
      { label: 'Plans Approved', value: stats?.plansApproved ?? 'N/A' },
      { label: 'Active AI Patterns', value: stats?.hotspots ?? 'N/A' },
    ],
    sections,
    generatedBy: generatedBy ?? 'Emergency Planner',
    generatedRole: 'Emergency Planner',
  }))
}
import PlannerPageHeader from '../../components/planner/PlannerPageHeader'
import StatusBadge from '../../components/dispatcher/StatusBadge'
// NOTE: PLANNER_RECOMMENDATIONS (the Implemented/Pending/Rejected tracker) has
// no backing table/endpoint anywhere in ReportingController — there's no real
// data source to wire it to, so it stays a clearly-labeled mock pending a real
// recommendation-tracking feature on the backend (see final report).
import { PLANNER_RECOMMENDATIONS } from '../../data/mockPlannerData'
import { getCurrentUser } from '../../utils/authSession'
import { useNotificationsStore } from '../../store/notificationsStore'
import { generateReport, submitReport, listReports, listPatterns } from '../../api/reporting'
import { useToastStore } from '../../store/toastStore'

const INSIGHT_ICONS = {
  trend: TrendingUp,
  alert: AlertCircle,
  cpu: Cpu,
}

// Real pattern severities (from the ai-engine's /ai/patterns response) map to
// an insight "type" label/icon the same way the rest of this page colors things.
function insightMeta(severity) {
  const s = (severity ?? '').toLowerCase()
  if (s === 'critical' || s === 'high') return { type: 'COVERAGE CONCERN', icon: 'alert' }
  return { type: 'EMERGING TREND', icon: 'trend' }
}

function recBorder(status) {
  if (status === 'Implemented') return 'var(--status-low)'
  if (status === 'Rejected') return 'var(--status-critical)'
  return 'var(--status-medium)'
}

function recVariant(status) {
  if (status === 'Implemented') return 'resolved'
  if (status === 'Rejected') return 'critical'
  return 'handover'
}

export default function PlannerReports() {
  const [recFilter, setRecFilter] = useState('All')
  const [analysisLen, setAnalysisLen] = useState(0)
  const [saving, setSaving] = useState(false)
  const [weeklyStats, setWeeklyStats] = useState(null)
  const [aiInsights, setAiInsights] = useState([])
  const [insightsModelVersion, setInsightsModelVersion] = useState('')
  const assessmentRef = useRef(null)
  const notesRef = useRef(null)
  const addNotification = useNotificationsStore((s) => s.addNotification)
  const pushToast = useToastStore((s) => s.pushToast)

  useEffect(() => {
    const currentUser = getCurrentUser()
    const now = new Date()
    const firstOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)
    listReports('PLANNER_INSIGHT', currentUser?.district_id ?? null)
      .then((reports) => {
        const thisMonth = reports.filter((r) => r.period_start && new Date(r.period_start) >= firstOfMonth)
        const submitted = thisMonth.filter((r) => r.status !== 'DRAFT').length
        const approved = thisMonth.filter((r) => r.status === 'APPROVED' || r.status === 'PUBLISHED').length
        setWeeklyStats((s) => ({
          ...s,
          plansSubmitted: submitted,
          plansApproved: submitted ? `${approved} (${Math.round((approved / submitted) * 100)}%)` : '0',
        }))
      })
      .catch(() => {})
    listPatterns()
      .then((res) => {
        const patterns = res?.patterns ?? []
        setAiInsights(patterns)
        setInsightsModelVersion(res?.modelVersion ?? '')
        setWeeklyStats((s) => ({ ...s, hotspots: patterns.length }))
      })
      .catch(() => {})
  }, [])

  async function saveReport(isDraft) {
    if (saving) return
    setSaving(true)
    const currentUser = getCurrentUser()
    const now = new Date()
    const firstOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString()
    try {
      const created = await generateReport({
        report_type: 'PLANNER_INSIGHT',
        district_id: currentUser?.district_id ?? null,
        period_start: firstOfMonth,
        period_end: now.toISOString(),
        content: assessmentRef.current?.value || notesRef.current?.value || '',
      })
      if (!isDraft) {
        // generateReport() always creates the report as DRAFT — without this,
        // it stays invisible to everyone but its own creator (listReports()
        // filters out DRAFT reports for other users), so a "published" plan
        // never actually reached the Analyst who's supposed to review it.
        await submitReport(created.report_id)
      }
      pushToast({ variant: 'success', title: 'Saved', message: isDraft ? 'Draft saved.' : 'Report published.' })
      if (!isDraft) {
        addNotification({
          id: 'notif-' + Math.random().toString(36).slice(2, 10),
          type: 'PLANNER_REPORT_PUBLISHED',
          target_role: 'super_admin',
          title: 'Planner Report Published',
          message: 'Emergency Planner published a weekly insight report.',
          timestamp: now.toISOString(),
          read: false,
        })
      }
    } catch {
      pushToast({ variant: 'error', title: 'Save Failed', message: 'Failed to save. Please try again.' })
    } finally {
      setSaving(false)
    }
  }

  const filteredRecs =
    recFilter === 'All'
      ? PLANNER_RECOMMENDATIONS
      : PLANNER_RECOMMENDATIONS.filter((r) => r.status === recFilter)

  return (
    <div className="portal-page flex flex-col gap-4 min-w-[1024px]">
      <PlannerPageHeader
        title="Reports & Recommendations"
        subtitle="Weekly analysis, tracking, and AI-detected insights."
      />

      <div className="flex flex-col xl:flex-row gap-4">
        <div className="dispatcher-surface p-4 min-w-0 xl:flex-[45]">
          <div className="flex flex-wrap items-center gap-2 mb-2">
            <span className="text-[11px] font-mono font-bold uppercase text-(--accent)">Weekly Planning Report</span>
            <StatusBadge label="DRAFT" variant="handover" />
          </div>
          <p className="text-[12px] text-(--text-muted) m-0 mb-4">Week of {currentWeekLabel()}</p>

          <div className="rounded-lg p-4 mb-4" style={{ background: 'var(--bg-elevated)' }}>
            <div className="text-[10px] font-mono uppercase text-(--text-muted) mb-2">Auto-generated from week data</div>
            {[
              ['Plans submitted', weeklyStats?.plansSubmitted ?? '…'],
              ['Plans approved', weeklyStats?.plansApproved ?? '…'],
              ['Active AI patterns identified', weeklyStats?.hotspots ?? '…'],
            ].map(([label, val]) => (
              <div key={label} className="flex justify-between text-[12px] py-1">
                <span className="text-(--text-secondary)">{label}</span>
                <span className="font-mono font-semibold">{val}</span>
              </div>
            ))}
          </div>

          <label className="text-[13px] font-medium block mb-2">Your written analysis</label>
          <textarea
            ref={assessmentRef}
            className="dispatcher-textarea w-full min-h-[140px] text-[13px]"
            placeholder="Summarize key findings, trends observed, and strategic recommendations for this week..."
            maxLength={3000}
            onChange={(e) => setAnalysisLen(e.target.value.length)}
          />
          <div className="text-[11px] text-(--text-muted) text-right">{analysisLen} / 3000</div>

          <label className="text-[13px] font-medium block mb-2 mt-4">Recommendations for OMs and District Commanders</label>
          <textarea
            ref={notesRef}
            className="dispatcher-textarea w-full min-h-[100px] text-[13px]"
            placeholder="List actionable recommendations..."
          />

          <div className="flex flex-wrap gap-2 mt-4">
            <button type="button" className="dispatcher-btn-ghost" onClick={() => saveReport(true)} disabled={saving}>
              {saving ? 'Saving…' : 'Save Draft'}
            </button>
            <button type="button" className="dispatcher-btn-primary inline-flex items-center gap-1.5" onClick={() => saveReport(false)} disabled={saving}>
              {saving ? 'Publishing…' : 'Publish Report'}
            </button>
            <button type="button" className="dispatcher-btn-ghost inline-flex items-center gap-1.5"
              onClick={() => {
                const cu = getCurrentUser()
                exportPlannerPDF({
                  analysis: assessmentRef.current?.value || '',
                  notes: notesRef.current?.value || '',
                  generatedBy: cu?.fullName || sessionStorage.getItem('resq-full-name') || 'Emergency Planner',
                  stats: {
                    plansSubmitted: weeklyStats?.plansSubmitted ?? 'N/A',
                    plansApproved: weeklyStats?.plansApproved ?? 'N/A',
                    hotspots: weeklyStats?.hotspots ?? 'N/A',
                  },
                })
              }}>
              <Download size={14} />Export PDF
            </button>
          </div>
          <p className="text-[11px] text-(--text-muted) m-0 mt-3">
            Published reports are visible to all Operations Managers and District Commanders.
          </p>
        </div>

        <div className="dispatcher-surface p-4 min-w-0 xl:flex-[30]">
          <h3 className="text-[13px] font-semibold m-0 mb-3">Recommendations Tracker</h3>
          <div className="flex flex-wrap gap-1 mb-3">
            {['All', 'Implemented', 'Pending', 'Rejected'].map((f) => (
              <button
                key={f}
                type="button"
                className="text-[10px] font-semibold px-2 py-1 rounded-full border cursor-pointer"
                style={{
                  background: recFilter === f ? 'var(--accent-ghost)' : 'var(--bg-elevated)',
                  borderColor: recFilter === f ? 'var(--accent)' : 'var(--border)',
                  color: recFilter === f ? 'var(--accent)' : 'var(--text-secondary)',
                }}
                onClick={() => setRecFilter(f)}
              >
                {f}
              </button>
            ))}
          </div>
          {filteredRecs.map((rec) => (
            <div
              key={rec.id}
              className="rounded-lg p-3 mb-2"
              style={{
                background: 'var(--bg-elevated)',
                borderLeft: `3px solid ${recBorder(rec.status)}`,
              }}
            >
              <div className="flex justify-between gap-2 mb-1">
                <span className="font-mono text-[11px] text-(--accent)">{rec.id}</span>
                <StatusBadge label={rec.status} variant={recVariant(rec.status)} />
              </div>
              <div className="text-[12px] font-medium">{rec.type}</div>
              <div className="text-[11px] text-(--text-secondary) line-clamp-2 mt-0.5">{rec.content}</div>
              {rec.result_summary && (
                <div className="flex items-center gap-1 mt-1 text-[11px]" style={{ color: 'var(--status-low)' }}>
                  <TrendingUp size={12} />
                  {rec.result_summary}
                </div>
              )}
              {rec.rejection_reason && (
                <div className="flex items-center gap-1 mt-1 text-[11px]" style={{ color: 'var(--status-critical)' }}>
                  <X size={12} />
                  {rec.rejection_reason}
                </div>
              )}
              <div className="font-mono text-[10px] text-(--text-muted) mt-1">{rec.created_at}</div>
            </div>
          ))}
        </div>

        <div className="dispatcher-surface p-4 min-w-0 xl:flex-[25]">
          <div className="flex items-center gap-2 mb-4">
            <Brain size={16} className="text-(--accent)" />
            <h3 className="text-[13px] font-semibold m-0">AI Insights</h3>
            <span
              className="text-[10px] font-mono font-bold px-2 py-0.5 rounded ml-auto"
              style={{ background: 'var(--accent-ghost)', color: 'var(--accent)' }}
            >
              PATTERN ANALYST
            </span>
          </div>
          {aiInsights.length === 0 ? (
            <p className="text-[12px] text-(--text-muted) m-0">No patterns detected yet.</p>
          ) : (
            aiInsights.map((insight, i) => {
              const meta = insightMeta(insight.severity)
              const Icon = INSIGHT_ICONS[meta.icon] || TrendingUp
              const labelColor = meta.type.includes('COVERAGE') ? 'var(--status-critical)' : 'var(--accent)'
              return (
                <div
                  key={i}
                  className="py-3"
                  style={{ borderBottom: i < aiInsights.length - 1 ? '1px solid var(--border-subtle)' : 'none' }}
                >
                  <div className="flex items-center gap-2">
                    <Icon size={16} style={{ color: labelColor }} />
                    <span className="text-[10px] font-mono uppercase" style={{ color: labelColor }}>
                      {meta.type}
                    </span>
                  </div>
                  <p className="text-[12px] text-(--text-primary) m-0 mt-1.5 leading-relaxed">
                    {insight.pattern} — {insight.recommendation}
                    {insight.affectedZone ? ` (${insight.affectedZone})` : ''}
                  </p>
                  <div className="font-mono text-[10px] text-(--text-muted) mt-1">
                    Frequency: {insight.frequency}{insightsModelVersion ? ` · Model ${insightsModelVersion}` : ''}
                  </div>
                </div>
              )
            })
          )}
        </div>
      </div>
    </div>
  )
}

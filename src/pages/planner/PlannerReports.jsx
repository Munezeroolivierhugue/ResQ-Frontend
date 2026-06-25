import { useState, useRef } from 'react'
import { Brain, TrendingUp, AlertCircle, Cpu, X } from 'lucide-react'
import PlannerPageHeader from '../../components/planner/PlannerPageHeader'
import StatusBadge from '../../components/dispatcher/StatusBadge'
import { PLANNER_RECOMMENDATIONS, PLANNER_AI_INSIGHTS } from '../../data/mockPlannerData'
import { mockReports } from '../../data/mockReports'
import { getCurrentUser } from '../../utils/authSession'
import { useNotificationsStore } from '../../store/notificationsStore'

const WEEKLY_STATS = [
  ['Plans submitted', '7'],
  ['Plans approved', '5 (71%)'],
  ['Hotspots identified', '4'],
  ['Coverage change', '−2% (↓)'],
  ['Simulations run', '3'],
  ['Avg model accuracy', '88%'],
]

const INSIGHT_ICONS = {
  trend: TrendingUp,
  alert: AlertCircle,
  cpu: Cpu,
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
  const assessmentRef = useRef(null)
  const notesRef = useRef(null)
  const addNotification = useNotificationsStore((s) => s.addNotification)

  function saveReport(isDraft) {
    const currentUser = getCurrentUser()
    const timestamp = new Date().toISOString()
    const report = {
      report_id: Math.random().toString(36).slice(2, 10),
      report_type: 'PLANNER_INSIGHT',
      created_by: currentUser?.user_id ?? null,
      creator_role: 'emergency_planner',
      district_id: currentUser?.district_id ?? null,
      period: null,
      total_incidents: null,
      avg_response_time: null,
      coverage_score: null,
      dispatch_accuracy: null,
      escalations: null,
      content: assessmentRef.current?.value || notesRef.current?.value || '',
      status: isDraft ? 'DRAFT' : 'PUBLISHED',
      created_at: timestamp,
      submitted_at: isDraft ? null : timestamp,
    }
    mockReports.push(report)
    if (!isDraft) {
      addNotification({
        id: 'notif-' + Math.random().toString(36).slice(2, 10),
        type: 'PLANNER_REPORT_PUBLISHED',
        target_role: 'super_admin',
        title: 'Planner Report Published',
        message: 'Emergency Planner published a weekly insight report.',
        timestamp,
        read: false,
      })
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
          <p className="text-[12px] text-(--text-muted) m-0 mb-4">Week of May 26–Jun 1, 2026</p>

          <div className="rounded-lg p-4 mb-4" style={{ background: 'var(--bg-elevated)' }}>
            <div className="text-[10px] font-mono uppercase text-(--text-muted) mb-2">Auto-generated from week data</div>
            {WEEKLY_STATS.map(([label, val]) => (
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
            <button type="button" className="dispatcher-btn-ghost" onClick={() => saveReport(true)}>Save Draft</button>
            <button type="button" className="dispatcher-btn-primary inline-flex items-center gap-1.5" onClick={() => saveReport(false)}>
              Publish Report
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
          {PLANNER_AI_INSIGHTS.map((insight, i) => {
            const Icon = INSIGHT_ICONS[insight.icon] || TrendingUp
            const labelColor =
              insight.type.includes('COVERAGE') ? 'var(--status-critical)' : insight.type.includes('MODEL') ? 'var(--status-info)' : 'var(--accent)'
            return (
              <div
                key={i}
                className="py-3"
                style={{ borderBottom: i < PLANNER_AI_INSIGHTS.length - 1 ? '1px solid var(--border-subtle)' : 'none' }}
              >
                <div className="flex items-center gap-2">
                  <Icon size={16} style={{ color: labelColor }} />
                  <span className="text-[10px] font-mono uppercase" style={{ color: labelColor }}>
                    {insight.type}
                  </span>
                </div>
                <p className="text-[12px] text-(--text-primary) m-0 mt-1.5 leading-relaxed">{insight.text}</p>
                <div className="font-mono text-[10px] text-(--text-muted) mt-1">{insight.ago}</div>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}

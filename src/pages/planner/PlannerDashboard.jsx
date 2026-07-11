import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { Cpu, Clock, AlertTriangle, MapPin, Flame, Send, ChartScatter } from 'lucide-react'
import MetricCard from '../../components/dispatcher/MetricCard'
import SectionTitle from '../../components/dispatcher/SectionTitle'
import StatusBadge from '../../components/dispatcher/StatusBadge'
import PlannerPageHeader from '../../components/planner/PlannerPageHeader'
import { confidenceBadge, planStatusVariant } from '../../data/mockPlannerData'
import { listPlans, listCoverageGaps, listSimulations, getPredictions } from '../../api/planning'

export default function PlannerDashboard() {
  const dateStr = new Date().toLocaleDateString('en-GB', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  })

  const [plans, setPlans] = useState([])
  const [gaps, setGaps] = useState([])
  const [simulations, setSimulations] = useState([])
  const [predictions, setPredictions] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    Promise.allSettled([listPlans(), listCoverageGaps(), listSimulations(), getPredictions()])
      .then(([plansRes, gapsRes, simsRes, predsRes]) => {
        if (plansRes.status === 'fulfilled') setPlans(plansRes.value)
        if (gapsRes.status === 'fulfilled') setGaps(gapsRes.value)
        if (simsRes.status === 'fulfilled') setSimulations(simsRes.value)
        if (predsRes.status === 'fulfilled') setPredictions(predsRes.value.predictions ?? [])
      })
      .finally(() => setLoading(false))
  }, [])

  const pendingPlans = plans.filter((p) => p.status === 'SUBMITTED' || p.status === 'PENDING')
  const approvals = pendingPlans.map((p) => ({
    id: p.plan_id ? p.plan_id.slice(0, 8).toUpperCase() : '—',
    name: p.title ?? '(Untitled)',
    submittedTo: 'Operations Manager',
    status: p.status ?? 'SUBMITTED',
    ago: p.created_at ? new Date(p.created_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' }) : '—',
    pendingHours: p.created_at ? Math.round((Date.now() - new Date(p.created_at)) / 3600000) : 0,
    reason: null,
  }))

  const predCards = predictions.slice(0, 4).map((p) => ({
    zone: p.hotspotZone ?? 'Unknown Zone',
    type: 'Predicted Incident',
    confidence: Math.round((p.confidence ?? 0) * 100),
    window: p.windowStart && p.windowEnd
      ? `${new Date(p.windowStart).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })} – ${new Date(p.windowEnd).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })}`
      : '—',
    action: `${p.predictedCount ?? 0} incidents expected`,
  }))

  return (
    <div className="portal-page flex flex-col gap-5">
      <PlannerPageHeader title="Planning Dashboard" subtitle={`Strategic overview · ${dateStr}`} />

      <div
        className="dispatcher-surface p-4 flex flex-wrap gap-6"
        style={{ background: 'var(--accent-ghost)', border: '1px solid var(--accent)', borderRadius: 10 }}
      >
        {[
          { icon: Cpu, title: loading ? '— AI predictions active' : `${predictions.length} AI predictions active`, sub: 'For next 24 hours', iconColor: 'var(--accent)' },
          { icon: Clock, title: loading ? '— deployment plans pending' : `${pendingPlans.length} deployment plans pending`, sub: 'Awaiting OM approval', iconColor: 'var(--accent)' },
          { icon: AlertTriangle, title: loading ? '— coverage gaps flagged' : `${gaps.length} coverage gaps flagged`, sub: 'Current · needs review', iconColor: 'var(--status-medium)' },
        ].map((chip) => {
          const Icon = chip.icon
          return (
            <div key={chip.title} className="flex items-start gap-2 min-w-[180px]">
              <Icon size={16} style={{ color: chip.iconColor }} className="shrink-0 mt-0.5" />
              <div>
                <div className="text-[13px] font-semibold text-(--text-primary)">{chip.title}</div>
                <div className="text-[11px] text-(--text-muted)">{chip.sub}</div>
              </div>
            </div>
          )
        })}
      </div>

      <div className="portal-grid-4">
        <MetricCard icon={MapPin} label="Coverage Gaps" value={loading ? '—' : String(gaps.length)} hint={gaps.length > 0 ? 'Below target' : 'All zones covered'} hintTone={gaps.length > 0 ? 'warning' : 'positive'}>
          <div className="dispatcher-metric-target">Target: 0 gaps</div>
        </MetricCard>
        <MetricCard icon={Flame} label="Active Hotspot Predictions" value={loading ? '—' : String(predictions.length)} hint={predictions.length > 0 ? 'AI model active' : 'No current predictions'} hintTone="warning" />
        <MetricCard
          icon={Send}
          label="Pending Deployment Plans"
          value={loading ? '—' : String(pendingPlans.length)}
          hint="Awaiting OM approval"
          hintTone="neutral"
          className={pendingPlans.length > 0 ? 'dispatcher-metric-card--alert' : ''}
        />
        <MetricCard icon={ChartScatter} label="Saved Simulations" value={loading ? '—' : String(simulations.length)} hint="Total in system" hintTone="positive" />
      </div>

      <div className="portal-split-60-40 gap-4 min-h-0">
        <div className="flex flex-col gap-3 min-w-0">
          <SectionTitle
            title="AI Predictions — Next 24 Hours"
            badge={<span className="text-[11px] font-mono text-(--text-muted) ml-auto">Prediction Engine</span>}
          />
          {loading && (
            <div className="dispatcher-surface p-4 text-[13px] text-(--text-muted) text-center">Loading predictions…</div>
          )}
          {!loading && predCards.length === 0 && (
            <div className="dispatcher-surface p-4 text-[13px] text-(--text-muted) text-center">No active predictions from the AI engine.</div>
          )}
          {predCards.map((p, i) => {
            const cb = confidenceBadge(p.confidence)
            return (
              <div key={i} className="dispatcher-surface p-4">
                <div className="flex flex-wrap justify-between gap-2 mb-1">
                  <div>
                    <span className="font-semibold text-[13px] text-(--text-primary)">{p.zone}</span>
                    <span className="text-(--text-secondary) text-[13px]"> · {p.type}</span>
                  </div>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded" style={{ background: cb.bg, color: cb.color }}>
                    {p.confidence}%
                  </span>
                </div>
                <div className="flex items-center gap-1.5 text-[12px] text-(--text-secondary) mb-2">
                  <Clock size={12} />
                  {p.window}
                </div>
                <div className="flex flex-wrap justify-between gap-2 items-end">
                  <p
                    className="text-[12px] text-(--text-secondary) m-0 border-l-2 pl-2"
                    style={{ borderColor: 'var(--accent)' }}
                  >
                    {p.action}
                  </p>
                  <Link to="/planner/deployment" className="text-[11px] font-semibold text-(--accent) no-underline hover:underline">
                    Create Plan →
                  </Link>
                </div>
              </div>
            )
          })}
        </div>

        <div className="flex flex-col gap-3 min-w-0">
          <SectionTitle title="Pending Approvals" badge={<StatusBadge label={String(pendingPlans.length)} variant="handover" />} />
          {loading && (
            <div className="dispatcher-surface p-4 text-[13px] text-(--text-muted) text-center">Loading plans…</div>
          )}
          {!loading && approvals.length === 0 && (
            <div className="dispatcher-surface p-4 text-[13px] text-(--text-muted) text-center">No plans awaiting approval.</div>
          )}
          {approvals.map((item) => (
            <div key={item.id} className="dispatcher-surface p-4">
              <div className="flex flex-wrap justify-between gap-2 mb-1">
                <span className="font-mono text-[12px] text-(--accent) font-bold">{item.id}</span>
                <StatusBadge label={item.status} variant={planStatusVariant(item.status)} />
              </div>
              <div className="font-medium text-[13px] text-(--text-primary)">{item.name}</div>
              <div className="text-[12px] text-(--text-secondary) mt-0.5">Submitted to: {item.submittedTo}</div>
              <div className="font-mono text-[11px] text-(--text-muted) mt-1">{item.ago}</div>
              {item.pendingHours >= 4 && (
                <p className="text-[11px] m-0 mt-2" style={{ color: 'var(--status-medium)' }}>
                  ⏱ Pending {item.pendingHours}h — follow up?
                </p>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

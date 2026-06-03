import { Link } from 'react-router-dom'
import { Cpu, Clock, AlertTriangle, MapPin, Flame, Send, ChartScatter } from 'lucide-react'
import MetricCard from '../../components/dispatcher/MetricCard'
import SectionTitle from '../../components/dispatcher/SectionTitle'
import StatusBadge from '../../components/dispatcher/StatusBadge'
import PlannerPageHeader from '../../components/planner/PlannerPageHeader'
import { PLANNER_PREDICTIONS, PLANNER_APPROVALS, confidenceBadge, planStatusVariant } from '../../data/mockPlannerData'

export default function PlannerDashboard() {
  const dateStr = new Date().toLocaleDateString('en-GB', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  })

  return (
    <div className="portal-page flex flex-col gap-5">
      <PlannerPageHeader title="Planning Dashboard" subtitle={`Strategic overview · ${dateStr}`} />

      <div
        className="dispatcher-surface p-4 flex flex-wrap gap-6"
        style={{ background: 'var(--accent-ghost)', border: '1px solid var(--accent)', borderRadius: 10 }}
      >
        {[
          { icon: Cpu, title: '6 AI predictions active', sub: 'For next 24 hours', iconColor: 'var(--accent)' },
          { icon: Clock, title: '4 deployment plans pending', sub: 'Awaiting OM approval', iconColor: 'var(--accent)' },
          { icon: AlertTriangle, title: '2 coverage gaps flagged', sub: 'Overnight · needs review', iconColor: 'var(--status-medium)' },
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
        <MetricCard icon={MapPin} label="Overall Coverage Score" value="88%" hint="↓ 2% from yesterday" hintTone="warning">
          <div className="dispatcher-metric-target">Target: 90%</div>
        </MetricCard>
        <MetricCard icon={Flame} label="Active Hotspot Predictions" value="6" hint="3 emerging in last 14 days" hintTone="warning" />
        <MetricCard
          icon={Send}
          label="Pending Deployment Plans"
          value="4"
          hint="Awaiting OM approval"
          hintTone="neutral"
          className="dispatcher-metric-card--alert"
        />
        <MetricCard icon={ChartScatter} label="Saved Simulations" value="12" hint="2 run this week" hintTone="positive" />
      </div>

      <div className="portal-split-60-40 gap-4 min-h-0">
        <div className="flex flex-col gap-3 min-w-0">
          <SectionTitle
            title="AI Predictions — Next 24 Hours"
            badge={<span className="text-[11px] font-mono text-(--text-muted) ml-auto">Prediction Engine · Updated 8m ago</span>}
          />
          {PLANNER_PREDICTIONS.map((p) => {
            const cb = confidenceBadge(p.confidence)
            return (
              <div key={p.zone} className="dispatcher-surface p-4">
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
          <SectionTitle title="Pending Approvals" badge={<StatusBadge label="4" variant="handover" />} />
          {PLANNER_APPROVALS.map((item) => (
            <div key={item.id} className="dispatcher-surface p-4">
              <div className="flex flex-wrap justify-between gap-2 mb-1">
                <span className="font-mono text-[12px] text-(--accent) font-bold">{item.id}</span>
                <StatusBadge label={item.status} variant={planStatusVariant(item.status)} />
              </div>
              <div className="font-medium text-[13px] text-(--text-primary)">{item.name}</div>
              <div className="text-[12px] text-(--text-secondary) mt-0.5">Submitted to: {item.submittedTo}</div>
              <div className="font-mono text-[11px] text-(--text-muted) mt-1">{item.ago}</div>
              {item.reason && (
                <div
                  className="mt-2 p-2 rounded text-[12px] flex gap-1.5 items-start"
                  style={{ background: 'var(--status-critical-bg)', color: 'var(--status-critical)' }}
                >
                  <span aria-hidden>✕</span>
                  {item.reason}
                </div>
              )}
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

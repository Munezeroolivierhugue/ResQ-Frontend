import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  ClipboardList, Clock, MapPin, Target, AlertTriangle, X, CheckCircle,
  Brain, MessageSquare,
} from 'lucide-react'
import MetricCard from '../../components/dispatcher/MetricCard'
import SectionTitle from '../../components/dispatcher/SectionTitle'
import StatusBadge from '../../components/dispatcher/StatusBadge'
import { useOpsManagerStore } from '../../store/opsManagerStore'
import {
  OPS_ESCALATIONS,
  OPS_DASHBOARD_RECOMMENDATIONS,
  OPS_DISPATCHERS,
  OPS_FLEET,
  getWorkloadVariant,
  getWorkloadLabel,
} from '../../data/mockOpsManagerData'

function FleetBar({ type, available, total }) {
  const pct = Math.round((available / total) * 100)
  const low = pct < 60
  const barColor = low && type === 'Ambulances' ? 'var(--status-medium)' : 'var(--accent)'
  return (
    <div className="flex-1 min-w-[140px]">
      <div className="flex justify-between text-[12px] mb-1">
        <span className="text-(--text-secondary)">{type}</span>
        <span className="font-mono text-(--text-primary)">{available}/{total}</span>
      </div>
      <div className="h-1.5 rounded-full bg-(--bg-input) overflow-hidden">
        <div className="h-full rounded-full transition-all" style={{ width: `${pct}%`, background: barColor }} />
      </div>
    </div>
  )
}

export default function OpsManagerDashboard() {
  const { handoverBannerDismissed, handoverRead, dismissHandoverBanner } = useOpsManagerStore()
  const [showBanner, setShowBanner] = useState(!handoverBannerDismissed && !handoverRead)

  useEffect(() => {
    setShowBanner(!handoverBannerDismissed && !handoverRead)
  }, [handoverBannerDismissed, handoverRead])

  const fleetShortage = OPS_FLEET.some((f) => f.available / f.total < 0.5)

  return (
    <div className="p-6 flex flex-col gap-5">
      {showBanner && (
        <div className="dispatcher-surface p-4 flex flex-wrap items-start gap-4 relative">
          <button
            type="button"
            className="absolute top-3 right-3 bg-transparent border-none cursor-pointer text-(--text-muted) hover:text-(--text-primary)"
            onClick={() => { dismissHandoverBanner(); setShowBanner(false) }}
            aria-label="Dismiss"
          >
            <X size={18} />
          </button>
          <ClipboardList size={22} className="text-(--accent) shrink-0" />
          <div className="flex-1 min-w-[200px] pr-8">
            <div className="font-bold text-(--text-primary)">Shift Handover Summary Available</div>
            <p className="text-[13px] text-(--text-secondary) m-0 mt-1">
              Incoming briefing from outgoing dispatcher — read before operations begin
            </p>
          </div>
          <Link to="/ops-manager/shift" className="dispatcher-btn-outline no-underline text-[13px]">
            Read Handover →
          </Link>
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        <MetricCard icon={Clock} label="Avg Response Time" value="7.2m" hint="↓ 0.8m vs target" hintTone="positive">
          <div className="dispatcher-metric-target">Target: 8 min</div>
        </MetricCard>
        <MetricCard icon={MapPin} label="Coverage Score" value="93%" hint="↑ 3% above target" hintTone="positive">
          <div className="dispatcher-metric-target">Target: 90%</div>
        </MetricCard>
        <MetricCard icon={Target} label="Dispatch Accuracy" value="88%" hint="↓ 4% this hour" hintTone="warning" />
        <MetricCard
          icon={AlertTriangle}
          label="Active Escalations"
          value="2"
          hint="Requires attention"
          hintTone="critical"
          className="dispatcher-metric-card--alert"
        />
      </div>

      <div className="flex flex-col xl:flex-row gap-4 min-h-0">
        <div className="flex-[1.8] min-w-0 flex flex-col gap-3">
          <SectionTitle
            title="Escalation Queue"
            badge={<StatusBadge label={`${OPS_ESCALATIONS.length} live`} variant="critical" />}
          />
          {OPS_ESCALATIONS.length === 0 ? (
            <div className="dispatcher-surface p-8 text-center">
              <CheckCircle size={32} className="text-(--accent) mx-auto mb-2" />
              <p className="text-(--text-secondary) m-0">No active escalations</p>
            </div>
          ) : (
            OPS_ESCALATIONS.map((esc) => (
              <div key={esc.id} className="dispatcher-surface p-4">
                <div className="flex flex-wrap items-center gap-2 mb-1">
                  <span className="text-(--accent) font-bold font-mono text-[13px]">{esc.id}</span>
                  <StatusBadge label={esc.severity.toUpperCase()} variant={esc.severity === 'critical' ? 'critical' : 'handover'} />
                </div>
                <div className="text-[14px] font-semibold text-(--text-primary)">{esc.type}</div>
                <div className="text-[12px] text-(--text-secondary) mt-0.5">{esc.location}</div>
                <div className="text-[13px] font-mono text-(--accent) mt-1">{esc.elapsed}</div>
                <p className="text-[12px] text-(--text-secondary) italic m-0 mt-2">{esc.reason}</p>
                <div className="flex flex-wrap gap-2 mt-3">
                  <Link to={`/ops-manager/escalations/${esc.id}`} className="dispatcher-btn-primary no-underline text-[12px] py-2 px-3">
                    Take Command →
                  </Link>
                  <Link to={`/ops-manager/escalations/${esc.id}`} className="dispatcher-btn-ghost no-underline text-[12px] py-2 px-3">
                    View Only
                  </Link>
                </div>
              </div>
            ))
          )}
        </div>

        <div className="flex-[1.4] min-w-0 flex flex-col gap-3">
          <div className="flex items-center justify-between gap-2 flex-wrap">
            <SectionTitle title="AI Resource Recommendations" accent />
            <span className="text-[10px] text-(--text-muted) font-mono">15m refresh</span>
          </div>
          {OPS_DASHBOARD_RECOMMENDATIONS.map((rec) => (
            <div key={rec.id} className="dispatcher-surface p-4">
              <div className="text-[13px] font-bold text-(--text-primary)">{rec.text}</div>
              <p className="text-[12px] text-(--text-secondary) m-0 mt-1">{rec.reason}</p>
              <p className="text-[12px] text-(--accent) m-0 mt-1">{rec.impact}</p>
              <div className="h-1 rounded-full bg-(--bg-input) mt-3 overflow-hidden">
                <div className="h-full bg-(--accent)" style={{ width: `${rec.confidence}%` }} />
              </div>
              <div className="flex flex-wrap gap-2 mt-3">
                <button type="button" className="dispatcher-btn-primary text-[11px] py-1.5 px-2.5">Execute</button>
                <Link to="/ops-manager/resources" className="dispatcher-btn-ghost no-underline text-[11px] py-1.5 px-2.5">Modify</Link>
                <button type="button" className="dispatcher-btn-ghost text-[11px] py-1.5 px-2.5" style={{ color: 'var(--status-critical)' }}>Reject</button>
              </div>
            </div>
          ))}
        </div>

        <div className="flex-1 min-w-[240px] flex flex-col gap-3">
          <SectionTitle title="Active Dispatchers" />
          <div className="dispatcher-surface p-3 flex flex-col gap-2">
            {OPS_DISPATCHERS.slice(0, 3).map((d) => (
              <div key={d.id} className="flex items-center gap-2 py-2 border-b border-(--border-subtle) last:border-0">
                <span
                  className="w-9 h-9 rounded-full flex items-center justify-center text-[11px] font-bold shrink-0"
                  style={{ background: 'var(--accent-ghost)', color: 'var(--accent)' }}
                >
                  {d.initials}
                </span>
                <div className="flex-1 min-w-0">
                  <div className="text-[13px] font-semibold truncate">{d.name}</div>
                  <div className="text-[10px] text-(--text-muted)">Dispatcher</div>
                </div>
                <StatusBadge label={getWorkloadLabel(d.workload)} variant={getWorkloadVariant(d.workload)} />
                <div className="text-right shrink-0">
                  <div className="text-[11px] font-mono font-bold">{d.incidents}</div>
                  <div className="text-[10px] text-(--text-muted)">{d.aiRate}% AI</div>
                </div>
                <button type="button" className="dispatcher-btn-icon shrink-0" aria-label="Message">
                  <MessageSquare size={14} />
                </button>
              </div>
            ))}
            <Link to="/ops-manager/dispatchers" className="text-[12px] text-(--accent) font-semibold no-underline mt-1 text-center">
              View All Dispatchers →
            </Link>
          </div>
        </div>
      </div>

      <div className="dispatcher-surface p-4">
        <SectionTitle title="Fleet Status" className="mb-4" />
        <div className="flex flex-wrap gap-6">
          {OPS_FLEET.map((f) => (
            <FleetBar key={f.type} {...f} />
          ))}
        </div>
        {fleetShortage && (
          <div
            className="mt-4 p-3 rounded-lg flex flex-wrap items-center gap-3 text-[13px]"
            style={{ background: 'var(--status-medium-bg)', border: '1px solid var(--status-medium)' }}
          >
            <span className="text-(--text-secondary) flex-1 min-w-[200px]">
              Resource shortage detected — consider mutual aid request
            </span>
            <Link to="/ops-manager/resources" className="dispatcher-btn-outline no-underline text-[12px]">
              Request Mutual Aid →
            </Link>
          </div>
        )}
      </div>
    </div>
  )
}

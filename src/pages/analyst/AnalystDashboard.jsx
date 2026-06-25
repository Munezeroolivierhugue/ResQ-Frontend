import { Link } from 'react-router-dom'
import { FileBarChart, AlertCircle, Cpu, Calendar, Server, RefreshCw } from 'lucide-react'
import MetricCard from '../../components/dispatcher/MetricCard'
import SectionTitle from '../../components/dispatcher/SectionTitle'
import StatusBadge from '../../components/dispatcher/StatusBadge'
import AnalystPageHeader from '../../components/analyst/AnalystPageHeader'
import {
  ANALYST_DATA_SOURCES,
  ANALYST_ANOMALIES,
  ANALYST_CALENDAR_MARKS,
  severityDotColor,
  sourceStatusVariant,
} from '../../data/mockAnalystData'

const MAY_2026_START = new Date(2026, 4, 1)
const MAY_DAYS = 31
const MAY_FIRST_DOW = MAY_2026_START.getDay()
const MON_OFFSET = MAY_FIRST_DOW === 0 ? 6 : MAY_FIRST_DOW - 1

function dayMark(day) {
  if (ANALYST_CALENDAR_MARKS.overdue.includes(day)) return 'overdue'
  if (ANALYST_CALENDAR_MARKS.dueToday.includes(day)) return 'dueToday'
  if (ANALYST_CALENDAR_MARKS.dueFuture.includes(day)) return 'dueFuture'
  if (ANALYST_CALENDAR_MARKS.delivered.includes(day)) return 'delivered'
  return null
}

const DOT_COLORS = {
  delivered: 'var(--status-low)',
  dueToday: 'var(--status-medium)',
  overdue: 'var(--status-critical)',
  dueFuture: 'var(--status-medium)',
}

export default function AnalystDashboard() {
  const dateStr = new Date().toLocaleDateString('en-GB', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  })

  const blanks = Array.from({ length: MON_OFFSET }, (_, i) => `b-${i}`)
  const days = Array.from({ length: MAY_DAYS }, (_, i) => i + 1)

  return (
    <div className="portal-page flex flex-col gap-5 min-w-[1024px]">
      <AnalystPageHeader title="Analyst Dashboard" subtitle={`System intelligence overview · ${dateStr}`} badge="Dashboard" />

      <div className="portal-grid-4">
        <MetricCard icon={FileBarChart} label="Reports Generated (Month)" value="24" hint="↑ 3 vs last month" hintTone="positive" />
        <MetricCard
          icon={AlertCircle}
          label="Pending Data Quality Alerts"
          value="3"
          hint="2 new since yesterday"
          hintTone="warning"
          className="dispatcher-metric-card--alert"
        />
        <MetricCard
          icon={Cpu}
          label="AI Model Anomalies Flagged"
          value="1"
          hint="Dispatch model drift detected"
          hintTone="warning"
          className="dispatcher-metric-card--alert"
        />
        <MetricCard icon={Calendar} label="Reports Due This Week" value="3" hint="1 due today" hintTone="neutral" />
      </div>

      <div className="dispatcher-surface p-4">
        <div className="flex flex-wrap justify-between gap-3 items-center mb-4">
          <div className="flex items-center gap-2">
            <Server size={16} style={{ color: 'var(--accent)' }} />
            <span className="font-semibold text-[14px]">Data Source Health</span>
          </div>
          <div className="flex items-center gap-3">
            <span className="font-mono text-[11px] text-(--text-muted)">Last checked: 2 minutes ago</span>
            <button type="button" className="dispatcher-btn-ghost text-[11px] h-8 px-2 inline-flex items-center gap-1">
              <RefreshCw size={12} />
              Refresh
            </button>
          </div>
        </div>
        <div className="flex flex-wrap gap-4">
          {ANALYST_DATA_SOURCES.map((src) => (
            <div
              key={src.name}
              className="flex-1 min-w-[160px] rounded-lg p-3.5"
              style={{ background: 'var(--bg-elevated)', borderLeft: `3px solid ${src.border}` }}
            >
              <div className="flex justify-between gap-2 mb-2">
                <span className="font-semibold text-[13px]">{src.name}</span>
                <StatusBadge label={src.status} variant={sourceStatusVariant(src.status)} />
              </div>
              <div className="text-[12px] text-(--text-secondary)">Completeness: {src.completeness}%</div>
              <div className="font-mono text-[11px] text-(--text-muted) mt-0.5">Last update: {src.lastUpdate}</div>
              {src.warning && (
                <p className="text-[11px] m-0 mt-2" style={{ color: 'var(--status-medium)' }}>{src.warning}</p>
              )}
            </div>
          ))}
        </div>
      </div>

      <div className="portal-split-60-40 gap-4">
        <div className="flex flex-col gap-3 min-w-0">
          <SectionTitle
            title="Anomaly Detection Feed"
            badge={<span className="font-mono text-[10px] text-(--text-muted) ml-auto">AUTO-REFRESHED HOURLY</span>}
          />
          {ANALYST_ANOMALIES.map((a) => (
            <div key={a.type + a.description} className="dispatcher-surface p-4">
              <div className="flex flex-wrap justify-between gap-2">
                <div className="flex items-center gap-2">
                  <span
                    className="w-2 h-2 rounded-full shrink-0 animate-pulse"
                    style={{ background: severityDotColor(a.severity) }}
                  />
                  <span className="font-mono text-[10px] uppercase text-(--text-muted)">{a.type}</span>
                </div>
                <span className="font-mono text-[11px] text-(--text-muted)">{a.ago}</span>
              </div>
              <p className="font-medium text-[13px] text-(--text-primary) my-1.5 m-0">{a.description}</p>
              <p className="text-[12px] text-(--text-secondary) m-0">{a.detail}</p>
              <div className="flex flex-wrap justify-between items-center gap-2 mt-3">
                <span
                  className="text-[10px] font-mono font-bold px-2 py-0.5 rounded"
                  style={{ background: 'var(--accent-ghost)', color: 'var(--accent)' }}
                >
                  {a.sigma}
                </span>
                <Link to={a.link} className="dispatcher-btn-outline text-[11px] h-[30px] px-3 no-underline inline-flex items-center">
                  Investigate →
                </Link>
              </div>
            </div>
          ))}
        </div>

        <div className="flex flex-col gap-3 min-w-0">
          <SectionTitle title="Report Delivery Calendar" />
          <div className="dispatcher-surface p-4">
            <div className="grid grid-cols-7 gap-1 mb-2">
              {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map((d) => (
                <div key={d} className="text-center text-[10px] font-bold text-(--text-muted) py-1">{d}</div>
              ))}
              {blanks.map((k) => <div key={k} />)}
              {days.map((day) => {
                const mark = dayMark(day)
                const isToday = day === 28
                return (
                  <div
                    key={day}
                    className="aspect-square flex flex-col items-center justify-center rounded text-[12px] relative"
                    style={{
                      background: isToday ? 'var(--accent-ghost)' : 'transparent',
                      border: isToday ? '1px solid var(--accent)' : 'none',
                    }}
                  >
                    <span className="font-medium">{day}</span>
                    {mark && (
                      <span
                        className="w-1.5 h-1.5 rounded-full mt-0.5"
                        style={{ background: DOT_COLORS[mark] }}
                      />
                    )}
                  </div>
                )
              })}
            </div>
            <div className="flex flex-wrap gap-4 text-[11px] text-(--text-muted) mt-3">
              <span><span style={{ color: 'var(--status-low)' }}>●</span> Delivered</span>
              <span><span style={{ color: 'var(--status-medium)' }}>●</span> Due Today</span>
              <span><span style={{ color: 'var(--status-critical)' }}>●</span> Overdue</span>
            </div>
            <Link to="/analyst/library" className="text-[12px] font-semibold text-(--accent) mt-3 inline-block no-underline hover:underline">
              View Report Schedule →
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}

import { useState } from 'react'
import { BarChart3 } from 'lucide-react'
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ReferenceLine,
  ResponsiveContainer,
} from 'recharts'
import StatusBadge from '../../components/dispatcher/StatusBadge'
import { FR_PERFORMANCE, FR_SHIFT_HISTORY } from '../../data/mockFieldResponderData'

const STATS = [
  ['14', 'Incidents'],
  ['6.8m', 'Avg response'],
  ['94 km', 'Distance'],
  ['14', 'Reports filed'],
  ['87', 'Performance'],
  ['100%', 'GPS uptime'],
]

function WeeklyTrendChart({ data }) {
  try {
    return (
      <div style={{ width: '100%', minWidth: 0, height: 160, position: 'relative' }}>
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
            <CartesianGrid stroke="var(--border-subtle)" strokeDasharray="3 3" />
            <XAxis dataKey="day" tick={{ fontSize: 10, fill: 'var(--text-muted)' }} />
            <YAxis hide domain={[5, 10]} />
            <Tooltip contentStyle={{ background: 'var(--bg-surface)', border: '1px solid var(--border)' }} />
            <ReferenceLine y={8} stroke="var(--status-medium)" strokeDasharray="4 4" />
            <Line
              type="monotone"
              dataKey="min"
              stroke="var(--accent)"
              strokeWidth={2}
              dot={{ r: 3, fill: 'var(--accent)' }}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    )
  } catch (err) {
    console.error('WeeklyTrendChart render error:', err)
    return null
  }
}

export default function FRPerformance() {
  const [tab, setTab] = useState('today')
  const p = FR_PERFORMANCE

  return (
    <div className="fr-page fr-page--fill">
      <div className="fr-page-fill-body">
        <div className="dispatcher-surface fr-card fr-card--tight">
          <div className="fr-card-header">
            <BarChart3 size={16} className="text-(--accent)" />
            <span className="font-semibold text-[13px]">Today&apos;s Shift</span>
            <span className="text-[11px] text-(--text-muted) ml-auto">08:00 – Now</span>
          </div>
          <div className="fr-divider" />
          <div className="fr-perf-grid">
            {STATS.map(([val, label]) => (
              <div key={label} className="fr-perf-tile">
                <div className="fr-perf-value font-mono">{val}</div>
                <div className="fr-perf-label">{label}</div>
              </div>
            ))}
          </div>
          <div className="mt-4">
            <div className="text-[12px] mb-2">
              Performance Score — <strong>{p.performance}/100</strong>
            </div>
            <div className="fr-score-bar">
              <div className="fr-score-fill" style={{ width: `${p.performance}%` }} />
            </div>
          </div>
        </div>

        <div className="dispatcher-surface fr-card fr-card--tight">
          <div className="font-semibold text-[13px] mb-3">Response Time vs District Average</div>
          <div className="fr-compare-row">
            <div className="fr-compare-col">
              <div className="fr-compare-value font-mono" style={{ color: 'var(--status-low)' }}>
                {p.avgResponse}
              </div>
              <div className="fr-perf-label">YOUR AVG</div>
            </div>
            <div className="fr-compare-divider" />
            <div className="fr-compare-col">
              <div className="fr-compare-value font-mono">{p.districtAvg}</div>
              <div className="fr-perf-label">DISTRICT AVG</div>
            </div>
          </div>
          <p className="fr-compare-note">↑ 0.6m faster than district average</p>
        </div>

        <div className="dispatcher-surface fr-card fr-card--tight">
          <div className="font-semibold text-[13px] mb-2">Weekly Response Trend</div>
          <WeeklyTrendChart data={p.weeklyTrend} />
        </div>

        <div className="dispatcher-surface fr-card fr-card--tight">
          <div className="font-semibold text-[13px] mb-3">Dispatch Method — This Shift</div>
          {[
            { label: 'AI Recommended', count: p.aiDispatches, pct: 79, color: 'var(--accent)' },
            { label: 'Manual Override', count: p.manualOverride, pct: 21, color: 'var(--status-medium)' },
          ].map((row) => (
            <div key={row.label} className="fr-dispatch-bar-row">
              <div className="flex justify-between text-[13px] mb-1">
                <span>{row.label}</span>
                <span className="font-mono text-(--text-muted)">{row.count} dispatches</span>
              </div>
              <div className="fr-bar-track">
                <div className="fr-bar-fill" style={{ width: `${row.pct}%`, background: row.color }} />
                <span className="fr-bar-pct" style={{ color: row.color }}>
                  {row.pct}%
                </span>
              </div>
            </div>
          ))}
        </div>

        <div className="fr-tabs">
          {[
            { id: 'today', label: 'Today' },
            { id: 'all', label: 'All Shifts' },
          ].map((t) => (
            <button
              key={t.id}
              type="button"
              className={`fr-tab${tab === t.id ? ' fr-tab--active' : ''}`}
              onClick={() => setTab(t.id)}
            >
              {t.label}
            </button>
          ))}
        </div>

        {tab === 'today' &&
          FR_SHIFT_HISTORY.map((inc) => {
            const fast = parseFloat(inc.response) < 8
            return (
              <div key={inc.id} className="dispatcher-surface fr-history-row">
                <div className="fr-history-top">
                  <span>
                    <span className="font-mono text-(--accent) font-bold">{inc.id}</span>
                    {' · '}
                    {inc.type}{' '}
                    <StatusBadge
                      label={inc.severity}
                      variant={inc.severity === 'CRITICAL' ? 'critical' : 'handover'}
                    />
                  </span>
                  <span className="font-mono text-[11px] text-(--text-muted)">{inc.time}</span>
                </div>
                <div className="fr-history-bottom">
                  <span className="text-(--text-secondary)">{inc.location}</span>
                  <span
                    className="font-mono text-[12px]"
                    style={{ color: fast ? 'var(--status-low)' : 'var(--status-critical)' }}
                  >
                    {inc.response}
                  </span>
                </div>
              </div>
            )
          })}
      </div>
    </div>
  )
}

import { RefreshCw } from 'lucide-react'
import {
  ComposedChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
} from 'recharts'
import AnalystPageHeader from '../../components/analyst/AnalystPageHeader'
import StatusBadge from '../../components/dispatcher/StatusBadge'
import DriftGauge from '../../components/analyst/DriftGauge'
import {
  ANALYST_AI_MODELS,
  ANALYST_DISPATCH_ACCURACY,
  ANALYST_OVERRIDE_ROWS,
  ANALYST_RETRAIN_LOG,
} from '../../data/mockAnalystData'

function driftColor(pct) {
  if (pct < 5) return 'var(--status-low)'
  if (pct <= 10) return 'var(--status-medium)'
  return 'var(--status-critical)'
}

export default function AnalystModels() {
  return (
    <div className="portal-page flex flex-col gap-5 min-w-[1024px]">
      <AnalystPageHeader
        title="AI Model Performance Monitor"
        subtitle="Quality control for all RESQ AI models."
      />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {ANALYST_AI_MODELS.map((m) => (
          <div
            key={m.id}
            className="dispatcher-surface p-5 flex flex-col"
            style={{ borderTop: `3px solid ${m.border}` }}
          >
            <div className="flex justify-between gap-2 mb-3">
              <span className="font-bold text-[14px]">{m.name}</span>
              <StatusBadge label={m.status} variant={m.statusVariant} />
            </div>
            <div className="font-mono text-[28px] font-bold mb-3" style={{ color: m.accuracyColor }}>
              {m.accuracy}%
            </div>
            {[
              ['30-day trend', m.trend],
              ['Training data', m.training],
              ['Predictions today', String(m.predictions)],
              ['User acceptance', m.acceptance],
            ].map(([label, val]) => (
              <div key={label} className="flex justify-between text-[12px] py-1 border-b border-(--border-subtle)">
                <span className="text-(--text-secondary)">{label}</span>
                <span className="font-mono font-semibold">{val}</span>
              </div>
            ))}
            <button
              type="button"
              className="dispatcher-btn-ghost w-full mt-4 text-[12px] inline-flex items-center justify-center gap-1"
              disabled={m.retrainDisabled}
            >
              <RefreshCw size={14} />
              Retrain Now
            </button>
          </div>
        ))}
      </div>

      <div className="portal-split-60-40 gap-4">
        <div className="min-w-0 flex flex-col gap-4">
          <div className="dispatcher-surface p-4">
            <h3 className="text-[13px] font-semibold m-0 mb-3">Dispatch Model Accuracy — 30 Days</h3>
            <ResponsiveContainer width="100%" height={220}>
              <ComposedChart data={ANALYST_DISPATCH_ACCURACY}>
                <CartesianGrid stroke="var(--border-subtle)" />
                <XAxis dataKey="day" tick={{ fontSize: 9 }} interval={4} />
                <YAxis domain={[70, 100]} tick={{ fontSize: 10 }} unit="%" />
                <Tooltip />
                <ReferenceLine y={85} stroke="var(--status-critical)" strokeDasharray="4 4" label="Min 85%" />
                <Line type="monotone" dataKey="accuracy" stroke="var(--accent)" dot={false} strokeWidth={2} />
                <Line type="monotone" dataKey="ma7" stroke="var(--status-info)" dot={false} strokeWidth={3} />
              </ComposedChart>
            </ResponsiveContainer>
          </div>

          <div className="dispatcher-surface overflow-x-auto p-0">
            <div className="p-4 border-b border-(--border)">
              <h3 className="text-[13px] font-semibold m-0">Override Outcome Analysis</h3>
              <p className="text-[12px] text-(--text-muted) m-0 mt-1">
                When dispatchers override AI — was the human decision better?
              </p>
            </div>
            <table className="w-full text-[12px] min-w-[640px]">
              <thead>
                <tr className="text-(--text-muted) border-b border-(--border)">
                  <th className="text-left p-3">Override Reason</th>
                  <th className="p-3">Count</th>
                  <th className="p-3">Better</th>
                  <th className="p-3">Worse</th>
                  <th className="text-left p-3">Recommendation</th>
                </tr>
              </thead>
              <tbody>
                {ANALYST_OVERRIDE_ROWS.map((row) => (
                  <tr
                    key={row.reason}
                    className="border-b border-(--border-subtle)"
                    style={{
                      background: row.highlight ? 'var(--status-medium-bg)' : undefined,
                      borderLeft: row.highlight ? '3px solid var(--status-critical)' : undefined,
                    }}
                  >
                    <td className="p-3 font-medium">
                      {row.reason}
                      {row.highlight && (
                        <span
                          className="ml-2 text-[10px] font-bold px-1.5 py-0.5 rounded"
                          style={{ background: 'var(--status-critical-bg)', color: 'var(--status-critical)' }}
                        >
                          ⚠ MODEL FIX NEEDED
                        </span>
                      )}
                    </td>
                    <td className="p-3 text-center font-mono">{row.count}</td>
                    <td className="p-3 text-center" style={{ color: 'var(--status-low)' }}>{row.better}</td>
                    <td className="p-3 text-center" style={{ color: 'var(--status-critical)' }}>{row.worse}</td>
                    <td className="p-3 text-(--text-secondary)">{row.rec}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className="min-w-0 flex flex-col gap-4">
          <div className="dispatcher-surface p-4">
            <h3 className="text-[13px] font-semibold m-0">Model Drift Detection</h3>
            <p className="text-[12px] text-(--text-muted) m-0 mb-4">Drift = accuracy decline from real-world pattern changes</p>
            <div className="flex justify-around gap-4">
              {ANALYST_AI_MODELS.map((m) => (
                <div key={m.id} className="text-center">
                  <DriftGauge pct={m.drift} color={driftColor(m.drift)} />
                  <div className="text-[12px] font-semibold mt-2">{m.name}</div>
                  <div
                    className="text-[11px] font-semibold"
                    style={{ color: driftColor(m.drift) }}
                  >
                    {m.driftLabel}
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="dispatcher-surface overflow-x-auto">
            <h3 className="text-[13px] font-semibold m-0 p-4 pb-2">Retraining History</h3>
            <table className="w-full text-[12px] min-w-[400px]">
              <thead>
                <tr className="text-(--text-muted) border-b border-(--border)">
                  <th className="text-left p-3">Model</th>
                  <th className="p-3">Date</th>
                  <th className="p-3">Data</th>
                  <th className="p-3">Duration</th>
                  <th className="p-3">Change</th>
                </tr>
              </thead>
              <tbody>
                {ANALYST_RETRAIN_LOG.map((row) => (
                  <tr key={row.date + row.model} className="border-b border-(--border-subtle)">
                    <td className="p-3">{row.model}</td>
                    <td className="p-3 font-mono">{row.date}</td>
                    <td className="p-3">{row.data}</td>
                    <td className="p-3">{row.duration}</td>
                    <td
                      className="p-3 font-mono font-bold"
                      style={{ color: row.positive ? 'var(--status-low)' : 'var(--status-critical)' }}
                    >
                      {row.change}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  )
}

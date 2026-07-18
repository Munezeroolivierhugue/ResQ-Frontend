import { useState, useEffect } from 'react'
import { BarChart, Bar, XAxis, YAxis, ResponsiveContainer } from 'recharts'
import AnalystPageHeader from '../../components/analyst/AnalystPageHeader'
import StatusBadge from '../../components/dispatcher/StatusBadge'
import { barFillByPct, sourceStatusVariant } from '../../data/mockAnalystData'
import { listDataQuality, getFieldReportQuality } from '../../api/reporting'

function adaptApiDq(d) {
  const overall = ((d.completeness ?? 0) + (d.accuracy ?? 0)) / 2
  return {
    source: d.source,
    completeness_pct: Math.round(d.completeness ?? 0),
    accuracy_pct: Math.round(d.accuracy ?? 0),
    last_updated_at: d.checked_at ? new Date(d.checked_at).toLocaleString() : '—',
    status: overall >= 90 ? 'OK' : overall >= 70 ? 'DEGRADED' : 'ERROR',
    degraded: overall < 80,
  }
}

function PctBar({ value }) {
  return (
    <div className="flex items-center gap-2">
      <span className="font-mono text-[12px] w-10">{value}%</span>
      <div className="flex-1 h-1.5 rounded-full bg-(--border) overflow-hidden max-w-[80px]">
        <div className="h-full rounded-full" style={{ width: `${value}%`, background: barFillByPct(value) }} />
      </div>
    </div>
  )
}

export default function AnalystDataQuality() {
  const [dqTable, setDqTable] = useState([])
  const [dqLoading, setDqLoading] = useState(true)
  const [frq, setFrq] = useState(null)
  const [frqLoading, setFrqLoading] = useState(true)

  useEffect(() => {
    listDataQuality()
      .then((records) => {
        // Latest record per source
        const latest = Object.values(
          records.reduce((acc, r) => {
            if (!acc[r.source] || new Date(r.checked_at) > new Date(acc[r.source].checked_at)) acc[r.source] = r
            return acc
          }, {})
        )
        setDqTable(latest.map(adaptApiDq))
      })
      .catch(() => setDqTable([]))
      .finally(() => setDqLoading(false))

    getFieldReportQuality()
      .then(setFrq)
      .catch(() => setFrq(null))
      .finally(() => setFrqLoading(false))
  }, [])

  return (
    <div className="portal-page flex flex-col gap-5 min-w-[1024px]">
      <AnalystPageHeader
        title="Data Quality Dashboard"
        subtitle="Real health, completeness, and accuracy of RESQ's own data sources."
        badge="Data Quality"
      />

      <div className="dispatcher-surface overflow-x-auto">
        <table className="w-full text-[12px] min-w-[640px]">
          <thead>
            <tr className="text-(--text-muted) border-b border-(--border)">
              <th className="text-left p-3">Source</th>
              <th className="text-left p-3">Completeness</th>
              <th className="text-left p-3">Accuracy</th>
              <th className="text-left p-3">Last Checked</th>
              <th className="p-3">Status</th>
            </tr>
          </thead>
          <tbody>
            {dqLoading && (
              <tr><td colSpan={5} className="p-6 text-center text-(--text-muted)">Loading…</td></tr>
            )}
            {!dqLoading && dqTable.length === 0 && (
              <tr><td colSpan={5} className="p-6 text-center text-(--text-muted)">No data quality checks run yet — run one from the Analyst Dashboard.</td></tr>
            )}
            {dqTable.map((row) => (
              <tr
                key={row.source}
                className="border-b border-(--border-subtle) last:border-0"
                style={{ background: row.degraded ? 'var(--status-medium-bg)' : undefined }}
              >
                <td className="p-3 font-medium">{row.source}</td>
                <td className="p-3"><PctBar value={row.completeness_pct} /></td>
                <td className="p-3"><PctBar value={row.accuracy_pct} /></td>
                <td className="p-3 font-mono">{row.last_updated_at}</td>
                <td className="p-3">
                  <StatusBadge label={row.status} variant={sourceStatusVariant(row.status)} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="dispatcher-surface p-4 min-w-0">
        <h3 className="text-[13px] font-semibold m-0">Field Report Quality</h3>
        <p className="text-[12px] text-(--text-muted) m-0 mb-4">Real completeness of incident reports actually submitted by field officers</p>
        {frqLoading && <p className="text-[12px] text-(--text-muted) m-0">Loading…</p>}
        {!frqLoading && !frq && <p className="text-[12px] text-(--text-muted) m-0">No field report data available.</p>}
        {frq && (
          <>
            <div className="grid grid-cols-3 gap-3 mb-4">
              {[
                { v: `${frq.fully_complete_pct}%`, l: 'Fully complete' },
                { v: `${frq.partially_complete_pct}%`, l: 'Partially complete' },
                { v: `${frq.not_submitted_pct}%`, l: 'Not submitted' },
              ].map((s) => (
                <div key={s.l} className="rounded-lg p-3 text-center" style={{ background: 'var(--bg-elevated)' }}>
                  <div className="font-mono font-bold text-[20px]">{s.v}</div>
                  <div className="text-[11px] text-(--text-secondary)">{s.l}</div>
                </div>
              ))}
            </div>
            <h4 className="text-[12px] text-(--text-muted) m-0 mb-2">Most Commonly Skipped Fields</h4>
            {frq.missed_fields.length === 0 ? (
              <p className="text-[12px] text-(--text-muted) m-0">No submitted reports yet.</p>
            ) : (
              <ResponsiveContainer width="100%" height={180}>
                <BarChart data={frq.missed_fields} layout="vertical" margin={{ left: 120 }}>
                  <XAxis type="number" domain={[0, 100]} hide />
                  <YAxis type="category" dataKey="field" width={115} tick={{ fontSize: 10 }} />
                  <Bar dataKey="skip_rate_pct" fill="var(--status-medium)" radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
            )}
            <h4 className="text-[12px] font-semibold mt-4 mb-2">Units with Lowest Report Completion</h4>
            {frq.low_units.length === 0 ? (
              <p className="text-[12px] text-(--text-muted) m-0">No submitted reports yet.</p>
            ) : (
              <table className="w-full text-[12px]">
                <thead>
                  <tr className="text-(--text-muted)">
                    <th className="text-left py-2">Unit</th>
                    <th className="text-left py-2">Officer</th>
                    <th className="py-2">Rate</th>
                    <th className="text-left py-2">Missing</th>
                  </tr>
                </thead>
                <tbody>
                  {frq.low_units.map((u) => (
                    <tr key={u.vehicle_plate + u.officer_name} className="border-t border-(--border-subtle)">
                      <td className="py-2 font-mono">{u.vehicle_plate}</td>
                      <td className="py-2">{u.officer_name}</td>
                      <td className="py-2 text-center font-mono">{u.completion_rate_pct}%</td>
                      <td className="py-2 text-(--text-secondary)">{u.missing_fields}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </>
        )}
      </div>

      <div className="dispatcher-surface p-4">
        <h3 className="text-[13px] font-semibold m-0 mb-1">Data Lineage &amp; Alert Thresholds</h3>
        <p className="text-[12px] text-(--text-secondary) m-0">
          Not available yet. Tracing which sources feed which AI models, and configuring automatic alert thresholds,
          both require dedicated tracking that doesn't exist in the system yet — there's no real pipeline metadata
          or alert-threshold storage to back either feature honestly.
        </p>
      </div>
    </div>
  )
}

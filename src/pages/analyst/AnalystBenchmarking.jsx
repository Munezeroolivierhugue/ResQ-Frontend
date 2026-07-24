import { useState, useEffect } from 'react'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine } from 'recharts'
import AnalystPageHeader from '../../components/analyst/AnalystPageHeader'
import { getDistrictBenchmark } from '../../api/reporting'
import { getResponseTimeTarget } from '../../api/admin'
import { listIncidents } from '../../api/incidents'

const PERIODS = [{ label: '30 Days', days: 30 }, { label: 'Quarter', days: 91 }, { label: 'Year', days: 365 }]
const LINE_COLORS = ['var(--accent)', 'var(--status-info)', 'var(--status-medium)', 'var(--status-critical)', 'var(--text-muted)']

function responseColor(m, target) {
  if (m == null) return 'var(--text-muted)'
  if (m <= target) return 'var(--status-low)'
  if (m <= target * 1.3) return 'var(--status-medium)'
  return 'var(--status-critical)'
}

export default function AnalystBenchmarking() {
  const [period, setPeriod] = useState(PERIODS[1])
  const [rows, setRows] = useState([])
  const [targetMinutes, setTargetMinutes] = useState(12)
  const [trend, setTrend] = useState([])
  const [selectedDistricts, setSelectedDistricts] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    getResponseTimeTarget().then(setTargetMinutes).catch(() => {})
  }, [])

  useEffect(() => {
    Promise.resolve().then(() => setLoading(true))
    Promise.allSettled([getDistrictBenchmark(period.days), listIncidents()])
      .then(([benchRes, incidentsRes]) => {
        const benchRows = benchRes.status === 'fulfilled' ? benchRes.value : []
        setRows(benchRows)
        setSelectedDistricts((prev) => prev.length ? prev.filter((d) => benchRows.some((r) => r.district === d)) : benchRows.slice(0, 5).map((r) => r.district))

        if (incidentsRes.status === 'fulfilled') {
          const since = new Date(Date.now() - period.days * 86400000).toISOString().slice(0, 10)
          const scoped = incidentsRes.value.filter(
            (i) => i.call_time && i.call_time.slice(0, 10) >= since && i.response_time_minutes != null && i.response_time_minutes >= 0 && i.response_time_minutes <= 180
          )
          const byDayDistrict = {}
          for (const i of scoped) {
            const day = i.call_time.slice(0, 10)
            const key = day
            if (!byDayDistrict[key]) byDayDistrict[key] = { day }
            const d = i.district ?? 'Unknown'
            if (!byDayDistrict[key][d]) byDayDistrict[key][d] = { total: 0, count: 0 }
            byDayDistrict[key][d].total += i.response_time_minutes
            byDayDistrict[key][d].count += 1
          }
          const chartData = Object.values(byDayDistrict)
            .sort((a, b) => a.day.localeCompare(b.day))
            .map((row) => {
              const out = { day: new Date(row.day).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' }) }
              for (const [k, v] of Object.entries(row)) {
                if (k === 'day') continue
                out[k] = Math.round((v.total / v.count) * 10) / 10
              }
              return out
            })
          setTrend(chartData)
        }
      })
      .finally(() => setLoading(false))
  }, [period])

  return (
    <div className="portal-page flex flex-col gap-5 min-w-[1024px]">
      <AnalystPageHeader
        title="Cross-District Benchmarking"
        subtitle="Real performance comparison across districts with recorded incidents."
        badge="Benchmarking"
      />

      <div className="flex flex-wrap gap-2 items-center">
        <div className="flex gap-2">
          {PERIODS.map((p) => (
            <button
              key={p.label}
              type="button"
              className="text-[11px] font-semibold px-3 py-1.5 rounded-full border cursor-pointer"
              style={{
                background: period.label === p.label ? 'var(--accent-ghost)' : 'var(--bg-elevated)',
                borderColor: period.label === p.label ? 'var(--accent)' : 'var(--border)',
                color: period.label === p.label ? 'var(--accent)' : 'var(--text-secondary)',
              }}
              onClick={() => setPeriod(p)}
            >
              {p.label}
            </button>
          ))}
        </div>
      </div>

      <div className="dispatcher-surface overflow-x-auto">
        <div className="flex justify-between items-center p-4 border-b border-(--border)">
          <h3 className="text-[13px] font-semibold m-0">District Performance Comparison</h3>
          <span className="text-[11px] font-mono text-(--text-muted)">Target: {targetMinutes}m response</span>
        </div>
        <table className="w-full text-[12px] min-w-[760px]">
          <thead>
            <tr className="text-(--text-secondary) font-bold border-b border-(--border)">
              <th className="text-left p-3">District</th>
              <th className="p-3">Incidents</th>
              <th className="p-3">Avg Response</th>
              <th className="p-3">vs Target</th>
              <th className="p-3">Coverage</th>
              <th className="p-3">Resolution</th>
              <th className="p-3">AI Acceptance</th>
              <th className="p-3">Rank</th>
            </tr>
          </thead>
          <tbody>
            {loading && (
              <tr><td colSpan={8} className="p-6 text-center text-(--text-muted)">Loading…</td></tr>
            )}
            {!loading && rows.length === 0 && (
              <tr><td colSpan={8} className="p-6 text-center text-(--text-muted)">No incidents recorded in this period.</td></tr>
            )}
            {rows.map((row) => (
              <tr key={row.district} className="border-b border-(--border-subtle) dispatcher-table-row">
                <td className="p-3 font-medium">
                  {row.district}
                  {row.rank === 1 && <span className="ml-1" style={{ color: 'var(--accent)' }}>★</span>}
                </td>
                <td className="p-3 text-center font-mono">{row.incidents}</td>
                <td className="p-3 text-center font-mono font-semibold" style={{ color: responseColor(row.avg_response, targetMinutes) }}>
                  {row.avg_response != null ? `${row.avg_response}m` : '—'}
                </td>
                <td className="p-3 text-center">
                  <span style={{ color: row.target_met ? 'var(--status-low)' : 'var(--status-critical)' }}>
                    {row.target_met ? '✓ MET' : '✗ MISSED'}
                  </span>
                </td>
                <td className="p-3 text-center">{row.coverage_pct}%</td>
                <td className="p-3 text-center">{row.resolution_pct}%</td>
                <td className="p-3 text-center">{row.ai_acceptance_pct}%</td>
                <td className="p-3 text-center font-mono font-bold" style={{ color: row.rank <= 3 ? 'var(--accent)' : 'var(--text-secondary)' }}>
                  #{row.rank}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="dispatcher-surface p-4">
        <h3 className="text-[13px] font-semibold m-0">Response Time Trend — Real Data</h3>
        <p className="text-[12px] text-(--text-muted) m-0 mb-3">
          Daily average, real districts with recorded incidents in this period. Districts with very few incidents may appear as isolated points rather than a continuous line.
        </p>
        {trend.length === 0 ? (
          <p className="text-[12px] text-(--text-muted) m-0 py-8 text-center">No incidents with a recorded response time in this period.</p>
        ) : (
          <ResponsiveContainer width="100%" height={260}>
            <LineChart data={trend}>
              <CartesianGrid stroke="var(--border-subtle)" />
              <XAxis dataKey="day" tick={{ fontSize: 10 }} />
              <YAxis unit="m" tick={{ fontSize: 10 }} />
              <Tooltip />
              <ReferenceLine y={targetMinutes} stroke="var(--status-critical)" strokeDasharray="4 4" label="Target" />
              {selectedDistricts.map((d, i) => (
                <Line key={d} type="monotone" dataKey={d} stroke={LINE_COLORS[i % LINE_COLORS.length]} dot={{ r: 3 }} strokeWidth={2} connectNulls />
              ))}
            </LineChart>
          </ResponsiveContainer>
        )}
        <div className="flex flex-wrap gap-2 mt-3">
          {rows.map((r, i) => (
            <button
              key={r.district}
              type="button"
              className="text-[11px] font-semibold px-3 py-1 rounded-full border cursor-pointer"
              style={{
                background: selectedDistricts.includes(r.district) ? 'var(--accent-ghost)' : 'var(--bg-elevated)',
                borderColor: selectedDistricts.includes(r.district) ? LINE_COLORS[i % LINE_COLORS.length] : 'var(--border)',
                color: selectedDistricts.includes(r.district) ? LINE_COLORS[i % LINE_COLORS.length] : 'var(--text-secondary)',
              }}
              onClick={() =>
                setSelectedDistricts((s) =>
                  s.includes(r.district) ? s.filter((x) => x !== r.district) : s.length < 5 ? [...s, r.district] : s
                )
              }
            >
              {r.district}
            </button>
          ))}
        </div>
      </div>

      <div className="dispatcher-surface p-4">
        <h3 className="text-[13px] font-semibold m-0 mb-4">Benchmark Reference</h3>
        <div
          className="dispatcher-surface p-4 max-w-sm"
          style={{ borderLeft: '3px solid var(--accent)' }}
        >
          <div className="font-semibold text-[13px] mb-2">RNP National Target</div>
          <div className="text-[12px] text-(--text-secondary)">{targetMinutes}-minute average response time</div>
        </div>
      </div>
    </div>
  )
}

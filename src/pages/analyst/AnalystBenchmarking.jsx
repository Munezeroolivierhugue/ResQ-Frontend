import { useState } from 'react'
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
} from 'recharts'
import AnalystPageHeader from '../../components/analyst/AnalystPageHeader'
import { ANALYST_BENCHMARK_ROWS } from '../../data/mockAnalystData'

const TREND_DATA = [
  { m: 'Jun', kicukiro: 7.2, nyarugenge: 7.5, gasabo: 8.1, musanze: 9.5, rubavu: 10.2 },
  { m: 'Jul', kicukiro: 7.0, nyarugenge: 7.3, gasabo: 8.0, musanze: 9.3, rubavu: 10.0 },
  { m: 'Aug', kicukiro: 6.9, nyarugenge: 7.2, gasabo: 7.9, musanze: 9.1, rubavu: 9.8 },
  { m: 'Sep', kicukiro: 6.8, nyarugenge: 7.1, gasabo: 7.8, musanze: 8.9, rubavu: 9.6 },
  { m: 'Oct', kicukiro: 6.7, nyarugenge: 7.0, gasabo: 7.7, musanze: 8.7, rubavu: 9.4 },
  { m: 'Nov', kicukiro: 6.8, nyarugenge: 7.1, gasabo: 7.6, musanze: 8.5, rubavu: 9.3 },
  { m: 'Dec', kicukiro: 6.9, nyarugenge: 7.2, gasabo: 7.6, musanze: 8.4, rubavu: 9.2 },
  { m: 'Jan', kicukiro: 6.8, nyarugenge: 7.1, gasabo: 7.5, musanze: 8.3, rubavu: 9.1 },
  { m: 'Feb', kicukiro: 6.7, nyarugenge: 7.0, gasabo: 7.5, musanze: 8.2, rubavu: 9.0 },
  { m: 'Mar', kicukiro: 6.8, nyarugenge: 7.1, gasabo: 7.6, musanze: 8.4, rubavu: 9.2 },
  { m: 'Apr', kicukiro: 6.8, nyarugenge: 7.1, gasabo: 7.6, musanze: 8.4, rubavu: 9.2 },
  { m: 'May', kicukiro: 6.8, nyarugenge: 7.1, gasabo: 7.6, musanze: 8.4, rubavu: 9.2 },
]

const DISTRICT_PILLS = [
  { id: 'kicukiro', label: 'Kicukiro', color: 'var(--accent)' },
  { id: 'nyarugenge', label: 'Nyarugenge', color: 'var(--status-info)' },
  { id: 'gasabo', label: 'Gasabo', color: 'var(--status-medium)' },
  { id: 'musanze', label: 'Musanze', color: 'var(--status-critical)' },
  { id: 'rubavu', label: 'Rubavu', color: 'var(--text-muted)' },
]

function responseColor(rt) {
  const m = parseFloat(rt)
  if (m < 8) return 'var(--status-low)'
  if (m <= 10) return 'var(--status-medium)'
  return 'var(--status-critical)'
}

export default function AnalystBenchmarking() {
  const [sigOn, setSigOn] = useState(true)
  const [selected, setSelected] = useState(['kicukiro', 'nyarugenge', 'gasabo', 'musanze', 'rubavu'])

  return (
    <div className="portal-page flex flex-col gap-5 min-w-[1024px]">
      <AnalystPageHeader
        title="Cross-District Benchmarking"
        subtitle="Performance comparison across all Rwanda districts."
      />

      <div className="flex flex-wrap gap-2 items-center">
        <button type="button" className="dispatcher-btn-outline text-[12px] h-9">
          Metrics (4 selected)
        </button>
        <div className="flex gap-2">
          {['30 Days', 'Quarter', 'Year'].map((p) => (
            <button
              key={p}
              type="button"
              className="text-[11px] font-semibold px-3 py-1.5 rounded-full border cursor-pointer"
              style={{
                background: p === 'Quarter' ? 'var(--accent-ghost)' : 'var(--bg-elevated)',
                borderColor: p === 'Quarter' ? 'var(--accent)' : 'var(--border)',
                color: p === 'Quarter' ? 'var(--accent)' : 'var(--text-secondary)',
              }}
            >
              {p}
            </button>
          ))}
        </div>
        <button type="button" className="dispatcher-btn-ghost text-[12px] h-9 ml-auto">
          Select Districts
        </button>
      </div>

      <div className="dispatcher-surface overflow-x-auto">
        <div className="flex justify-between items-center p-4 border-b border-(--border)">
          <h3 className="text-[13px] font-semibold m-0">District Performance Comparison</h3>
          <button
            type="button"
            className="text-[11px] font-bold px-3 py-1 rounded-full border cursor-pointer"
            style={{
              background: sigOn ? 'var(--accent-ghost)' : 'var(--bg-elevated)',
              borderColor: sigOn ? 'var(--accent)' : 'var(--border)',
              color: sigOn ? 'var(--accent)' : 'var(--text-secondary)',
            }}
            onClick={() => setSigOn((v) => !v)}
          >
            Statistical significance: {sigOn ? 'ON' : 'OFF'}
          </button>
        </div>
        <table className="w-full text-[12px] min-w-[800px]">
          <thead>
            <tr className="text-(--text-muted) border-b border-(--border)">
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
            {ANALYST_BENCHMARK_ROWS.map((row) => (
              <tr key={row.district} className="border-b border-(--border-subtle) dispatcher-table-row">
                <td className="p-3 font-medium">
                  {row.district}
                  {row.rank === 1 && <span className="ml-1" style={{ color: 'var(--accent)' }}>★</span>}
                </td>
                <td className="p-3 text-center font-mono">{row.incidents}</td>
                <td className="p-3 text-center font-mono font-semibold" style={{ color: responseColor(row.response) }}>
                  {row.response}
                </td>
                <td className="p-3 text-center">
                  <span style={{ color: row.met ? 'var(--status-low)' : 'var(--status-critical)' }}>
                    {row.met ? '✓ MET' : '✗ MISSED'}
                  </span>
                </td>
                <td className="p-3 text-center">{row.coverage}</td>
                <td className="p-3 text-center">{row.resolution}</td>
                <td className="p-3 text-center">{row.ai}</td>
                <td
                  className="p-3 text-center font-mono font-bold"
                  style={{
                    color: row.rank <= 3 ? 'var(--accent)' : row.rank <= 7 ? 'var(--text-primary)' : 'var(--text-secondary)',
                  }}
                >
                  #{row.rank}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        <p className="text-[11px] text-(--text-muted) italic p-4 m-0">
          *Differences between #1 and #2 are within margin of error (±0.4m). Difference vs #7 is statistically significant (p &lt; 0.01).
        </p>
      </div>

      <div className="dispatcher-surface p-4">
        <h3 className="text-[13px] font-semibold m-0">Response Time Trend — All Districts</h3>
        <p className="text-[12px] text-(--text-muted) m-0 mb-3">Select up to 5 districts to compare</p>
        <ResponsiveContainer width="100%" height={260}>
          <LineChart data={TREND_DATA}>
            <CartesianGrid stroke="var(--border-subtle)" />
            <XAxis dataKey="m" />
            <YAxis domain={[5, 15]} unit="m" />
            <Tooltip />
            <ReferenceLine y={8} stroke="var(--status-critical)" strokeDasharray="4 4" label="Target" />
            {DISTRICT_PILLS.filter((d) => selected.includes(d.id)).map((d) => (
              <Line key={d.id} type="monotone" dataKey={d.id} stroke={d.color} dot={false} strokeWidth={2} />
            ))}
          </LineChart>
        </ResponsiveContainer>
        <div className="flex flex-wrap gap-2 mt-3">
          {DISTRICT_PILLS.map((d) => (
            <button
              key={d.id}
              type="button"
              className="text-[11px] font-semibold px-3 py-1 rounded-full border cursor-pointer"
              style={{
                background: selected.includes(d.id) ? 'var(--accent-ghost)' : 'var(--bg-elevated)',
                borderColor: selected.includes(d.id) ? 'var(--accent)' : 'var(--border)',
                color: selected.includes(d.id) ? 'var(--accent)' : 'var(--text-secondary)',
              }}
              onClick={() =>
                setSelected((s) =>
                  s.includes(d.id) ? s.filter((x) => x !== d.id) : s.length < 5 ? [...s, d.id] : s
                )
              }
            >
              {d.label}
            </button>
          ))}
        </div>
      </div>

      <div className="dispatcher-surface p-4">
        <h3 className="text-[13px] font-semibold m-0 mb-4">Benchmark Library</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {[
            { title: 'RNP National Target', lines: ['8-minute average response time', '90% coverage score', '85% AI acceptance rate'], source: 'RNP HQ Standards 2026' },
            { title: 'East Africa Comparable', lines: ['9.2-minute regional average', '85% coverage typical'], source: 'East Africa Urban Police Network 2025' },
            { title: 'Previous Year Rwanda', lines: ['8.9m national avg (2025)', '87% coverage (2025)'], source: 'RNP Annual Report 2025' },
          ].map((b) => (
            <div
              key={b.title}
              className="dispatcher-surface p-4"
              style={{ borderLeft: '3px solid var(--accent)' }}
            >
              <div className="font-semibold text-[13px] mb-2">{b.title}</div>
              {b.lines.map((l) => (
                <div key={l} className="text-[12px] text-(--text-secondary)">{l}</div>
              ))}
              <div className="text-[11px] text-(--text-muted) mt-2">Source: {b.source}</div>
              <button type="button" className="dispatcher-btn-ghost text-[11px] mt-3 h-8">Apply to Chart</button>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

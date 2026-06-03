import { useState } from 'react'
import {
  Play,
  BarChart3,
  LineChart,
  PieChart,
  Table2,
  Map,
  LayoutGrid,
  Download,
  Table,
  UserPlus,
  Library,
  Brain,
} from 'lucide-react'
import {
  LineChart as ReLineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
} from 'recharts'
import AnalystPageHeader from '../../components/analyst/AnalystPageHeader'
import {
  ANALYST_REPORT_METRICS,
  ANALYST_RESPONSE_TREND,
  ANALYST_DISTRICT_BREAKDOWN,
  ANALYST_RWANDA_DISTRICTS,
} from '../../data/mockAnalystData'

const CHART_TYPES = [
  { id: 'bar', icon: BarChart3, label: 'Bar' },
  { id: 'line', icon: LineChart, label: 'Line' },
  { id: 'pie', icon: PieChart, label: 'Pie' },
  { id: 'table', icon: Table2, label: 'Table' },
  { id: 'heat', icon: Map, label: 'Heat map' },
  { id: 'combined', icon: LayoutGrid, label: 'Combined' },
]

const QUICK_RANGES = ['Today', '7 Days', '30 Days', 'Quarter', 'Year', 'Custom']

export default function AnalystReports() {
  const [range, setRange] = useState('30 Days')
  const [chartType, setChartType] = useState('line')
  const [geo, setGeo] = useState('All Rwanda')
  const [metrics, setMetrics] = useState(() =>
    Object.fromEntries(ANALYST_REPORT_METRICS.map((m) => [m.id, m.default]))
  )

  const toggleMetric = (id) => setMetrics((m) => ({ ...m, [id]: !m[id] }))

  return (
    <div className="flex flex-col min-w-[1024px] -mx-0">
      <div className="portal-page pb-0">
        <AnalystPageHeader
          title="Custom Report Builder"
          subtitle="Build any report from any combination of system data."
        />
      </div>
    <div className="analyst-report-builder flex min-h-[calc(100vh-120px)]">
      <aside
        className="w-[280px] shrink-0 border-r border-(--border) bg-(--bg-surface) p-4 overflow-y-auto"
        style={{ maxHeight: 'calc(100vh - 120px)' }}
      >
        <div className="flex flex-col gap-3">
          <label className="dispatcher-field">
            <span className="text-[12px] font-medium">Report name</span>
            <input className="dispatcher-input h-10" placeholder="e.g. Weekly Kigali Response Time Summary" />
          </label>
          <label className="dispatcher-field">
            <span className="text-[12px] font-medium">Report type</span>
            <select className="dispatcher-input h-10" defaultValue="Response Time Performance">
              <option>Incident Analysis</option>
              <option>Resource Utilization</option>
              <option>Response Time Performance</option>
              <option>Coverage Analysis</option>
              <option>Unit & Officer Performance</option>
              <option>AI Model Performance</option>
              <option>Cross-District Comparison</option>
              <option>Executive Summary</option>
            </select>
          </label>
          <div className="flex gap-2">
            <input type="date" className="dispatcher-input h-10 flex-1" defaultValue="2026-05-01" />
            <input type="date" className="dispatcher-input h-10 flex-1" defaultValue="2026-05-28" />
          </div>
          <div className="flex gap-1 overflow-x-auto pb-1">
            {QUICK_RANGES.map((r) => (
              <button
                key={r}
                type="button"
                className="text-[10px] font-semibold px-2 py-1 rounded-full border shrink-0 cursor-pointer"
                style={{
                  background: range === r ? 'var(--accent-ghost)' : 'var(--bg-elevated)',
                  borderColor: range === r ? 'var(--accent)' : 'var(--border)',
                  color: range === r ? 'var(--accent)' : 'var(--text-secondary)',
                }}
                onClick={() => setRange(r)}
              >
                {r}
              </button>
            ))}
          </div>
          <label className="dispatcher-field">
            <span className="text-[12px] font-medium">Geographic scope</span>
            <select className="dispatcher-input h-10" value={geo} onChange={(e) => setGeo(e.target.value)}>
              <option>All Rwanda</option>
              <option>By Province</option>
              <option>By District</option>
              <option>Multiple Districts</option>
            </select>
          </label>
          {geo === 'By District' && (
            <div className="max-h-[150px] overflow-y-auto border border-(--border) rounded-lg p-2 space-y-1">
              {ANALYST_RWANDA_DISTRICTS.map((d) => (
                <label key={d} className="flex items-center gap-2 text-[12px] cursor-pointer">
                  <input type="checkbox" defaultChecked={['Gasabo', 'Kicukiro', 'Nyarugenge'].includes(d)} />
                  {d}
                </label>
              ))}
            </div>
          )}
          <div>
            <div className="font-semibold text-[12px] mb-2">Include Metrics</div>
            <div className="max-h-[180px] overflow-y-auto space-y-1.5">
              {ANALYST_REPORT_METRICS.map((m) => (
                <label key={m.id} className="flex items-center gap-2 text-[13px] cursor-pointer">
                  <input type="checkbox" checked={metrics[m.id]} onChange={() => toggleMetric(m.id)} />
                  {m.label}
                </label>
              ))}
            </div>
          </div>
          <div className="flex gap-2">
            <select className="dispatcher-input h-9 flex-1 text-[12px]" defaultValue="District">
              <option>District</option>
              <option>Incident Type</option>
              <option>Time Period</option>
              <option>Unit</option>
            </select>
            <select className="dispatcher-input h-9 flex-1 text-[12px]" defaultValue="Daily">
              <option>Daily</option>
              <option>Weekly</option>
              <option>Monthly</option>
            </select>
          </div>
          <div className="font-semibold text-[12px]">Chart type</div>
          <div className="grid grid-cols-3 gap-2">
            {CHART_TYPES.map((c) => {
              const Icon = c.icon
              return (
                <button
                  key={c.id}
                  type="button"
                  title={c.label}
                  className="w-10 h-10 rounded-lg border flex items-center justify-center cursor-pointer"
                  style={{
                    borderColor: chartType === c.id ? 'var(--accent)' : 'var(--border)',
                    background: chartType === c.id ? 'var(--accent-ghost)' : 'transparent',
                    color: chartType === c.id ? 'var(--accent)' : 'var(--text-secondary)',
                  }}
                  onClick={() => setChartType(c.id)}
                >
                  <Icon size={18} />
                </button>
              )
            })}
          </div>
          <label className="flex items-center gap-2 text-[12px]"><input type="checkbox" defaultChecked /> Show benchmark lines</label>
          <label className="flex items-center gap-2 text-[12px]"><input type="checkbox" defaultChecked /> Show trend lines</label>
          <label className="flex items-center gap-2 text-[12px]"><input type="checkbox" /> AI recommendation overlay</label>
          <button type="button" className="dispatcher-btn-primary w-full h-12 font-bold text-[13px] inline-flex items-center justify-center gap-2">
            <Play size={16} />
            GENERATE REPORT
          </button>
        </div>
      </aside>

      <div className="flex-1 min-w-0 overflow-y-auto p-6">
        <p className="font-mono text-[12px] uppercase tracking-wider m-0" style={{ color: 'var(--accent)' }}>
          RESPONSE TIME PERFORMANCE REPORT
        </p>
        <h2 className="text-[18px] font-bold m-0 mt-1">Kigali City — All Districts</h2>
        <p className="text-[12px] text-(--text-muted) m-0">May 1–28, 2026 · Generated 14:32</p>
        <hr className="border-(--border) my-4" />

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
          {[
            { v: '7.4m', l: 'Avg Response' },
            { v: '88%', l: 'Within Target' },
            { v: '91%', l: 'Dispatch Accuracy' },
            { v: '247', l: 'Total Incidents' },
          ].map((k) => (
            <div key={k.l} className="dispatcher-metric-card p-3">
              <div className="dispatcher-metric-value text-[22px]">{k.v}</div>
              <div className="text-[12px] text-(--text-secondary)">{k.l}</div>
            </div>
          ))}
        </div>

        <div className="dispatcher-surface p-4 mb-6">
          <h3 className="text-[13px] font-semibold m-0 mb-3">Response Time Trend — Last 30 Days</h3>
          <ResponsiveContainer width="100%" height={240}>
            <ReLineChart data={ANALYST_RESPONSE_TREND}>
              <CartesianGrid stroke="var(--border-subtle)" />
              <XAxis dataKey="day" tick={{ fontSize: 10 }} />
              <YAxis domain={[0, 15]} tick={{ fontSize: 10 }} unit="m" />
              <Tooltip />
              <ReferenceLine y={8} stroke="var(--status-critical)" strokeDasharray="4 4" label="Target" />
              <Line type="monotone" dataKey="nyarugenge" stroke="var(--accent)" dot={false} strokeWidth={2} />
              <Line type="monotone" dataKey="kicukiro" stroke="var(--status-info)" dot={false} strokeWidth={2} />
              <Line type="monotone" dataKey="gasabo" stroke="var(--status-medium)" dot={false} strokeWidth={2} />
            </ReLineChart>
          </ResponsiveContainer>
        </div>

        <div className="dispatcher-surface overflow-x-auto mb-6">
          <table className="w-full text-[12px] border-collapse min-w-[520px]">
            <thead>
              <tr className="border-b border-(--border) text-(--text-muted)">
                <th className="text-left p-3">District</th>
                <th className="text-left p-3">Avg Response</th>
                <th className="text-left p-3">Within Target</th>
                <th className="text-left p-3">Incident Count</th>
                <th className="text-left p-3">vs Last Month</th>
              </tr>
            </thead>
            <tbody>
              {ANALYST_DISTRICT_BREAKDOWN.map((row) => (
                <tr key={row.district} className="border-b border-(--border-subtle) dispatcher-table-row">
                  <td className="p-3 font-medium">{row.district}</td>
                  <td className="p-3 font-mono">{row.avg}</td>
                  <td className="p-3">{row.target}</td>
                  <td className="p-3 font-mono">{row.count}</td>
                  <td
                    className="p-3 font-mono"
                    style={{
                      color:
                        row.improved === true
                          ? 'var(--status-low)'
                          : row.improved === false
                            ? 'var(--status-critical)'
                            : 'var(--text-muted)',
                    }}
                  >
                    {row.vs}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div
          className="rounded-lg p-4 flex gap-3"
          style={{ background: 'var(--accent-ghost)', border: '1px solid var(--accent)' }}
        >
          <Brain size={20} style={{ color: 'var(--accent)' }} className="shrink-0" />
          <div>
            <div className="font-semibold text-[13px]">AI-Detected Pattern</div>
            <p className="text-[13px] text-(--text-secondary) m-0 mt-1 leading-relaxed">
              Response times in Kicukiro show a consistent 1.8-minute increase on Fridays between 16:00–20:00,
              correlating with school traffic on KN 5 Avenue.
            </p>
          </div>
        </div>
      </div>

      <aside className="w-[240px] shrink-0 border-l border-(--border) p-4 sticky top-0 self-start">
        <h3 className="font-semibold text-[13px] m-0 mb-4">Export & Share</h3>
        <button type="button" className="dispatcher-btn-primary w-full mb-2 inline-flex items-center justify-center gap-2">
          <Download size={14} />
          Export PDF
        </button>
        <button type="button" className="dispatcher-btn-ghost w-full mb-2 inline-flex items-center justify-center gap-2">
          <Table size={14} />
          Export Excel
        </button>
        <button type="button" className="dispatcher-btn-ghost w-full mb-2 inline-flex items-center justify-center gap-2">
          <UserPlus size={14} />
          Share with Commander
        </button>
        <button type="button" className="dispatcher-btn-ghost w-full mb-2 inline-flex items-center justify-center gap-2">
          <Library size={14} />
          Post to Report Library
        </button>
        <hr className="border-(--border) my-3" />
        <div className="font-semibold text-[12px] mb-2">Schedule Report</div>
        <select className="dispatcher-input h-9 w-full text-[12px] mb-2">
          <option>Weekly</option>
          <option>Daily</option>
          <option>Monthly</option>
          <option>Quarterly</option>
        </select>
        <input type="time" className="dispatcher-input h-9 w-full mb-2" defaultValue="07:00" />
        <input className="dispatcher-input h-9 w-full mb-2" placeholder="Add emails or roles..." />
        <button type="button" className="dispatcher-btn-outline w-full text-[12px]">Save Schedule</button>
      </aside>
    </div>
    </div>
  )
}

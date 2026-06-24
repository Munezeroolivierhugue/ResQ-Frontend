import { useState, useEffect } from 'react'
import {
  Play,
  BarChart3,
  LineChart,
  PieChart,
  Table2,
  Map,
  LayoutGrid,
  Download,
  X,
  FileText,
  Loader2,
  Check,
  Brain,
  Plus
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
import ExportShareModal from '../../components/analyst/ExportShareModal'
import {
  ANALYST_REPORT_METRICS,
  ANALYST_RWANDA_DISTRICTS,
  ANALYST_RESPONSE_TREND,
  ANALYST_DISTRICT_BREAKDOWN,
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
  const [geo, setGeo] = useState('By District')
  const [isExportModalOpen, setIsExportModalOpen] = useState(false)
  const [isBuildingMode, setIsBuildingMode] = useState(false)
  
  const [metrics, setMetrics] = useState(() =>
    Object.fromEntries(ANALYST_REPORT_METRICS.map((m) => [m.id, m.default]))
  )

  const [selectedDistricts, setSelectedDistricts] = useState(['Gasabo', 'Kicukiro', 'Nyarugenge'])

  const toggleMetric = (id) => setMetrics((m) => ({ ...m, [id]: !m[id] }))
  
  const toggleDistrict = (d) => {
    setSelectedDistricts(prev => 
      prev.includes(d) ? prev.filter(x => x !== d) : [...prev, d]
    )
  }

  return (
    <div className="flex flex-col min-w-[1024px] -mx-0">
      <div className="portal-page pb-0">
        <AnalystPageHeader
          title={isBuildingMode ? "Custom Report Builder" : "Response Time Performance"}
          subtitle={isBuildingMode ? "Build any report from any combination of system data." : "View the latest generated response time report."}
          action={
            isBuildingMode ? (
              <div className="flex gap-3">
                <button 
                  type="button" 
                  className="dispatcher-btn-outline h-9 px-4 text-[13px] font-bold"
                  onClick={() => setIsBuildingMode(false)}
                >
                  Cancel
                </button>
                <button 
                  type="button" 
                  className="dispatcher-btn-primary h-9 px-4 text-[13px] font-bold inline-flex items-center gap-2"
                  onClick={() => setIsExportModalOpen(true)}
                >
                  <Download size={14} />
                  Export Report
                </button>
              </div>
            ) : (
              <button 
                type="button" 
                className="dispatcher-btn-primary h-9 px-4 text-[13px] font-bold inline-flex items-center gap-2"
                onClick={() => setIsBuildingMode(true)}
              >
                <Plus size={16} />
                Make Report
              </button>
            )
          }
        />

        {!isBuildingMode ? (
          /* PREVIEW MODE (Landing Page of Report Builder) */
          <div className="flex-1 min-w-0 overflow-y-auto pt-4 pb-12">
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
              className="rounded-lg p-4 flex gap-3 mb-8"
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
        ) : (
          /* BUILDER MODE (Form Wizard) */
          <div className="max-w-5xl w-full mt-4 mb-16 mx-auto">
            <div className="dispatcher-surface p-8 rounded-xl shadow-lg border border-(--border)">
              <h2 className="text-[18px] font-bold mb-6 mt-0">Report Configuration</h2>
              
              <div className="flex flex-col gap-8">
                
                {/* Row 1: Basic Info & Dates */}
                <div className="grid grid-cols-[1fr_1fr_1.5fr] gap-6">
                  <label className="dispatcher-field">
                    <span className="text-[13px] font-semibold text-(--text-primary) mb-2 inline-block">Report Name</span>
                    <input className="dispatcher-input h-10" placeholder="e.g. Weekly Summary" />
                  </label>
                  <label className="dispatcher-field">
                    <span className="text-[13px] font-semibold text-(--text-primary) mb-2 inline-block">Report Type</span>
                    <select className="dispatcher-input h-10" defaultValue="Response Time Performance">
                      <option>Incident Analysis</option>
                      <option>Resource Utilization</option>
                      <option>Response Time Performance</option>
                      <option>Coverage Analysis</option>
                    </select>
                  </label>
                  <div>
                    <span className="text-[13px] font-semibold text-(--text-primary) mb-2 inline-block">Date Range</span>
                    <div className="flex gap-3">
                      <div className="flex gap-2 flex-1">
                        <input type="date" className="dispatcher-input h-10 flex-1 px-2" defaultValue="2026-05-01" />
                        <input type="date" className="dispatcher-input h-10 flex-1 px-2" defaultValue="2026-05-28" />
                      </div>
                    </div>
                  </div>
                </div>

                <div className="flex justify-end -mt-5">
                   <div className="flex gap-1.5 p-1 bg-(--bg-elevated) rounded-lg border border-(--border)">
                      {QUICK_RANGES.map((r) => (
                        <button
                          key={r}
                          type="button"
                          className="text-[11px] font-semibold px-3 py-1.5 rounded-md cursor-pointer transition-colors"
                          style={{
                            background: range === r ? 'var(--bg-surface)' : 'transparent',
                            color: range === r ? 'var(--accent)' : 'var(--text-secondary)',
                            boxShadow: range === r ? '0 1px 2px rgba(0,0,0,0.05)' : 'none'
                          }}
                          onClick={() => setRange(r)}
                        >
                          {r}
                        </button>
                      ))}
                    </div>
                </div>

                <hr className="border-(--border) my-0" />

                {/* Row 2: Geo Scope & Chart Types */}
                <div className="grid grid-cols-2 gap-8">
                  <div>
                    <label className="dispatcher-field mb-4">
                      <span className="text-[13px] font-semibold text-(--text-primary) mb-2 inline-block">Geographic Scope</span>
                      <select className="dispatcher-input h-10" value={geo} onChange={(e) => setGeo(e.target.value)}>
                        <option>All Rwanda</option>
                        <option>By Province</option>
                        <option>By District</option>
                        <option>Multiple Districts</option>
                      </select>
                    </label>
                    
                    {geo === 'By District' && (
                      <div className="mt-4 p-4 border border-(--border-subtle) rounded-xl bg-(--bg-elevated) max-h-[180px] overflow-y-auto">
                        <div className="flex flex-wrap gap-2">
                          {ANALYST_RWANDA_DISTRICTS.map((d) => {
                            const isSelected = selectedDistricts.includes(d)
                            return (
                              <button
                                key={d}
                                type="button"
                                onClick={() => toggleDistrict(d)}
                                className={`px-3 py-1.5 rounded-full text-[12px] font-medium border transition-all cursor-pointer ${
                                  isSelected 
                                    ? 'bg-(--accent) text-white border-(--accent)' 
                                    : 'bg-(--bg-surface) text-(--text-secondary) border-(--border-subtle) hover:border-(--text-muted)'
                                }`}
                              >
                                {d}
                              </button>
                            )
                          })}
                        </div>
                      </div>
                    )}
                  </div>

                  <div>
                    <div className="text-[13px] font-semibold text-(--text-primary) mb-2 inline-block">Chart Visualization</div>
                    <div className="grid grid-cols-3 gap-3">
                      {CHART_TYPES.map((c) => {
                        const Icon = c.icon
                        return (
                          <button
                            key={c.id}
                            type="button"
                            title={c.label}
                            className="h-16 rounded-xl border flex flex-col items-center justify-center gap-1.5 cursor-pointer transition-all"
                            style={{
                              borderColor: chartType === c.id ? 'var(--accent)' : 'var(--border)',
                              background: chartType === c.id ? 'var(--accent-ghost)' : 'var(--bg-surface)',
                              color: chartType === c.id ? 'var(--accent)' : 'var(--text-secondary)',
                            }}
                            onClick={() => setChartType(c.id)}
                          >
                            <Icon size={18} />
                            <span className="text-[11px] font-medium">{c.label}</span>
                          </button>
                        )
                      })}
                    </div>
                  </div>
                </div>

                <hr className="border-(--border) my-0" />

                {/* Row 3: Include Metrics */}
                <div>
                  <div className="text-[13px] font-semibold text-(--text-primary) mb-3 inline-block">Include Metrics</div>
                  <div className="grid grid-cols-3 gap-3">
                    {ANALYST_REPORT_METRICS.map((m) => (
                      <div 
                        key={m.id}
                        className={`p-3 rounded-xl border flex items-center gap-3 cursor-pointer transition-all ${
                          metrics[m.id] 
                            ? 'border-(--accent) bg-(--accent-ghost)' 
                            : 'border-(--border) hover:border-(--border-subtle) bg-(--bg-surface)'
                        }`}
                        onClick={() => toggleMetric(m.id)}
                      >
                        <div className={`w-4 h-4 rounded flex items-center justify-center border transition-colors ${
                          metrics[m.id] ? 'bg-(--accent) border-(--accent)' : 'border-(--border-subtle) bg-(--bg-elevated)'
                        }`}>
                          {metrics[m.id] && <Check size={12} className="text-white" />}
                        </div>
                        <span className={`text-[13px] font-medium ${metrics[m.id] ? 'text-(--accent)' : 'text-(--text-primary)'}`}>
                          {m.label}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="mt-6 pt-6 border-t border-(--border) flex justify-end gap-4">
                  <button type="button" className="dispatcher-btn-ghost h-12 px-6 font-bold text-[13px]" onClick={() => setIsBuildingMode(false)}>
                    Cancel
                  </button>
                  <button type="button" className="dispatcher-btn-primary h-12 px-8 font-bold text-[13px] inline-flex items-center justify-center gap-2">
                    <Play size={16} />
                    GENERATE REPORT
                  </button>
                </div>

              </div>
            </div>
          </div>
        )}
      </div>

      <ExportShareModal 
        isOpen={isExportModalOpen} 
        onClose={() => setIsExportModalOpen(false)} 
      />
    </div>
  )
}

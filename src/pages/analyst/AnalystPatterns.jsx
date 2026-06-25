import { useState } from 'react'
import { MapContainer, TileLayer, Circle, Popup } from 'react-leaflet'
import {
  BarChart,
  Bar,
  AreaChart,
  Area,
  ScatterChart,
  Scatter,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,

} from 'recharts'
import { Play, Download, Brain } from 'lucide-react'
import { useThemeStore } from '../../store/themeStore'
import MapInvalidateSize from '../../components/map/MapInvalidateSize'
import AnalystPageHeader from '../../components/analyst/AnalystPageHeader'
import {
  ANALYST_HEATMAP_ZONES,
  analystHeatFill,
  ANALYST_TOP_HOTSPOTS,
  ANALYST_HOUR_DATA,
  ANALYST_DAY_DATA,
  ANALYST_WEEK_OF_MONTH,
  ANALYST_MONTH_DATA,
  ANALYST_CORRELATION_VARS,
  ANALYST_CORRELATION_MATRIX,
  correlationCellColor,
  ANALYST_SCATTER_DATA,
} from '../../data/mockAnalystData'
import 'leaflet/dist/leaflet.css'

const KIGALI_CENTER = [-1.9536, 30.0606]
const TABS = ['Spatial Clustering', 'Temporal Analysis', 'Correlation Matrix', 'Type Evolution']
const PERIODS = ['7 Days', '30 Days', '6 Months', '1 Year']

const TYPE_STACK = [
  { key: 'robbery', name: 'Armed Robbery', color: 'var(--status-critical)' },
  { key: 'traffic', name: 'Traffic Accident', color: 'var(--status-high)' },
  { key: 'medical', name: 'Medical', color: 'var(--status-info)' },
  { key: 'theft', name: 'Theft', color: 'var(--status-medium)' },
  { key: 'domestic', name: 'Domestic', color: 'var(--accent)' },
  { key: 'fire', name: 'Fire', color: 'var(--status-high)' },
  { key: 'other', name: 'Other', color: 'var(--text-muted)' },
]

const EVOLUTION_DATA = [
  { m: 'Jun', robbery: 42, traffic: 88, medical: 65, theft: 120, domestic: 45, fire: 12, other: 30 },
  { m: 'Jul', robbery: 48, traffic: 82, medical: 70, theft: 115, domestic: 48, fire: 14, other: 28 },
  { m: 'Aug', robbery: 45, traffic: 90, medical: 68, theft: 118, domestic: 50, fire: 11, other: 32 },
  { m: 'Sep', robbery: 52, traffic: 85, medical: 72, theft: 125, domestic: 46, fire: 15, other: 29 },
  { m: 'Oct', robbery: 55, traffic: 80, medical: 75, theft: 130, domestic: 52, fire: 13, other: 31 },
  { m: 'Nov', robbery: 58, traffic: 92, medical: 78, theft: 128, domestic: 49, fire: 16, other: 33 },
  { m: 'Dec', robbery: 50, traffic: 88, medical: 80, theft: 122, domestic: 55, fire: 14, other: 30 },
  { m: 'Jan', robbery: 54, traffic: 86, medical: 82, theft: 135, domestic: 51, fire: 12, other: 28 },
  { m: 'Feb', robbery: 56, traffic: 84, medical: 85, theft: 132, domestic: 53, fire: 15, other: 27 },
  { m: 'Mar', robbery: 62, traffic: 95, medical: 88, theft: 140, domestic: 58, fire: 18, other: 35 },
  { m: 'Apr', robbery: 60, traffic: 90, medical: 90, theft: 138, domestic: 56, fire: 17, other: 32 },
  { m: 'May', robbery: 64, traffic: 87, medical: 92, theft: 142, domestic: 60, fire: 16, other: 34 },
]

function barColor(value, max) {
  const t = value / max
  if (t > 0.75) return 'var(--status-critical)'
  if (t > 0.5) return 'var(--status-medium)'
  return 'var(--accent)'
}

export default function AnalystPatterns() {
  const { theme } = useThemeStore()
  const [tab, setTab] = useState(TABS[0])
  const [period, setPeriod] = useState('30 Days')
  const [matrixCell, setMatrixCell] = useState({ x: 0, y: 1, r: 0.74 })
  const hourMax = Math.max(...ANALYST_HOUR_DATA.map((d) => d.n))
  const dayMax = Math.max(...ANALYST_DAY_DATA.map((d) => d.n))

  return (
    <div className="portal-page flex flex-col gap-4 min-w-[1024px]">
      <AnalystPageHeader
        title="Incident Pattern Analysis"
        subtitle="Spatial clustering, temporal patterns, and correlation analysis."
        badge="Pattern Analysis"
      />

      <div className="flex flex-col lg:flex-row gap-6 items-start">
        {/* Left Sidebar (Filters) */}
        <div className="w-full lg:w-[320px] shrink-0 bg-(--bg-surface) border border-(--border) rounded-2xl p-5 shadow-[var(--shadow-card)] flex flex-col gap-5">
          <div>
            <h3 className="text-[14px] font-bold text-(--text-primary) mb-1 uppercase tracking-wider" style={{ fontFamily: 'var(--font-display)' }}>Pattern Filters</h3>
            <p className="text-[11px] text-(--text-muted) mb-5">Refine the analysis scope and datasets</p>
            
            <div className="flex flex-col gap-4">
              <div>
                <label className="block text-[11px] font-semibold text-(--text-secondary) mb-1.5 tracking-wide">Incident Type</label>
                <select className="dispatcher-input w-full h-10 text-[12px] bg-(--bg-input)" defaultValue="All Types">
                  <option>All Types</option>
                  <option>Theft</option>
                  <option>Traffic Accident</option>
                </select>
              </div>

              <div className="flex gap-3">
                <div className="flex-1">
                  <label className="block text-[11px] font-semibold text-(--text-secondary) mb-1.5 tracking-wide">Severity</label>
                  <select className="dispatcher-input w-full h-10 text-[12px] bg-(--bg-input)" defaultValue="All">
                    <option>All</option>
                    <option>Critical</option>
                    <option>High</option>
                  </select>
                </div>
                <div className="flex-1">
                  <label className="block text-[11px] font-semibold text-(--text-secondary) mb-1.5 tracking-wide">District</label>
                  <select className="dispatcher-input w-full h-10 text-[12px] bg-(--bg-input)" defaultValue="All Districts">
                    <option>All</option>
                    <option>Kigali</option>
                    <option>Gasabo</option>
                  </select>
                </div>
              </div>

              <hr className="border-(--border-subtle) my-2" />

              <div>
                <label className="block text-[11px] font-semibold text-(--text-secondary) mb-2 tracking-wide">Time Period</label>
                <div className="flex bg-(--bg-input) p-1 rounded-xl border border-(--border-subtle)">
                  {PERIODS.map((p) => (
                    <button
                      key={p}
                      type="button"
                      className={`flex-1 text-[11px] font-semibold py-2 rounded-lg transition-all border-none cursor-pointer ${
                        period === p 
                          ? 'bg-(--bg-surface) text-(--text-primary) shadow-[0_1px_2px_rgba(0,0,0,0.05)] border border-(--border)' 
                          : 'bg-transparent text-(--text-muted) hover:text-(--text-primary)'
                      }`}
                      onClick={() => setPeriod(p)}
                    >
                      {p}
                    </button>
                  ))}
                </div>
              </div>

              <hr className="border-(--border-subtle) my-2" />

              <button type="button" className="w-full bg-(--accent) text-(--text-on-accent) h-10 rounded-xl font-semibold text-[13px] border-none cursor-pointer shadow-sm hover:opacity-90 transition-opacity">
                Apply Filters
              </button>
            </div>
          </div>
        </div>

        {/* Main Content Area */}
        <div className="flex-1 flex flex-col gap-4 min-w-0">
          <div className="flex flex-wrap gap-1 border-b border-(--border) pb-2">
            {TABS.map((t) => (
              <button
                key={t}
                type="button"
                className="text-[12px] font-semibold px-4 py-2 rounded-t cursor-pointer border-none"
                style={{
                  background: tab === t ? 'var(--accent-ghost)' : 'transparent',
                  color: tab === t ? 'var(--accent)' : 'var(--text-secondary)',
                  borderBottom: tab === t ? '2px solid var(--accent)' : '2px solid transparent',
                }}
                onClick={() => setTab(t)}
              >
                {t}
              </button>
            ))}
          </div>

      {tab === 'Spatial Clustering' && (
        <div className="flex flex-col lg:flex-row gap-4">
          <div className="dispatcher-surface p-4 lg:flex-[65] min-w-0">
            <div className="flex justify-between items-center mb-3">
              <h3 className="text-[13px] font-semibold m-0">Incident Density Heat Map</h3>
              <div className="flex gap-2">
                <button type="button" className="dispatcher-btn-ghost text-[11px] h-8 px-2 inline-flex items-center gap-1">
                  <Play size={12} />
                  Animate
                </button>
                <button type="button" className="dispatcher-btn-ghost text-[11px] h-8 px-2 inline-flex items-center gap-1">
                  <Download size={12} />
                  Export
                </button>
              </div>
            </div>
            <MapContainer center={KIGALI_CENTER} zoom={12} style={{ height: 380, width: '100%' }}>
              <TileLayer
                url={
                  theme === 'dark'
                    ? 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png'
                    : 'https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png'
                }
                attribution="&copy; CARTO"
              />
              <MapInvalidateSize />
              {ANALYST_HEATMAP_ZONES.map((z) => (
                <Circle
                  key={z.name}
                  center={[z.lat, z.lng]}
                  radius={900}
                  pathOptions={{ fillColor: analystHeatFill(z.level), fillOpacity: 1, stroke: false }}
                >
                  <Popup>{z.name}</Popup>
                </Circle>
              ))}
            </MapContainer>
            <input type="range" className="w-full mt-3" min={0} max={100} defaultValue={80} />
            <p className="text-[11px] text-(--text-muted) text-center m-0">Jan 2026 — May 2026 · Slide to animate patterns over time</p>
          </div>
          <div className="dispatcher-surface p-4 lg:flex-[35] min-w-0">
            <h3 className="text-[13px] font-semibold m-0 mb-3">Top Hotspots — Last 30 Days</h3>
            {ANALYST_TOP_HOTSPOTS.map((h) => (
              <div key={h.zone} className="flex items-center gap-2 py-2 border-b border-(--border-subtle)">
                <span className="font-mono font-bold text-[16px] w-6" style={{ color: 'var(--accent)' }}>{h.rank}</span>
                <span className="flex-1 font-medium text-[13px]">{h.zone}</span>
                <span className="font-mono text-[12px]">{h.count}</span>
                <span
                  className="text-[11px] font-semibold"
                  style={{
                    color:
                      h.trend === 'up'
                        ? 'var(--status-critical)'
                        : h.trend === 'down'
                          ? 'var(--status-low)'
                          : 'var(--text-muted)',
                  }}
                >
                  {h.trend === 'up' ? '↑' : h.trend === 'down' ? '↓' : '→'} {h.change}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {tab === 'Temporal Analysis' && (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {[
              { title: 'Incidents by Hour', data: ANALYST_HOUR_DATA, key: 'h', max: hourMax },
              { title: 'Incidents by Day of Week', data: ANALYST_DAY_DATA, key: 'd', max: dayMax, fri: true },
              { title: 'Incidents by Week of Month', data: ANALYST_WEEK_OF_MONTH, key: 'w', max: 102 },
              { title: 'Monthly Distribution', data: ANALYST_MONTH_DATA, key: 'm', max: 445 },
            ].map((chart) => (
              <div key={chart.title} className="dispatcher-surface p-4">
                <h4 className="text-[12px] text-(--text-muted) m-0 mb-2">{chart.title}</h4>
                <ResponsiveContainer width="100%" height={180}>
                  <BarChart data={chart.data}>
                    <XAxis dataKey={chart.key} tick={{ fontSize: 10 }} />
                    <YAxis hide />
                    <Bar dataKey="n" radius={[2, 2, 0, 0]}>
                      {chart.data.map((entry, i) => (
                        <Cell
                          key={i}
                          fill={
                            chart.fri && entry.d === 'Fri'
                              ? 'var(--status-critical)'
                              : barColor(entry.n, chart.max)
                          }
                        />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            ))}
          </div>
          <div
            className="rounded-lg p-4 flex gap-3"
            style={{ background: 'var(--accent-ghost)', border: '1px solid var(--accent)' }}
          >
            <Brain size={18} style={{ color: 'var(--accent)' }} />
            <div>
              <div className="font-semibold text-[13px]">Temporal Intelligence</div>
              <p className="text-[13px] text-(--text-secondary) m-0 mt-1">
                Friday 16:00–20:00 combined with rainfall produces 2.4× baseline incident volume in urban districts.
                Market days add additional 1.8× multiplier in Kimironko and Nyabugogo.
              </p>
            </div>
          </div>
        </>
      )}

      {tab === 'Correlation Matrix' && (
        <div className="flex flex-col lg:flex-row gap-4">
          <div className="dispatcher-surface p-4 lg:flex-[55] min-w-0">
            <h3 className="text-[13px] font-semibold m-0">Correlation Analysis Matrix</h3>
            <p className="text-[12px] text-(--text-muted) m-0 mb-3">Click any cell to view scatter plot and statistics</p>
            <div className="grid grid-cols-6 gap-1 mb-4">
              {ANALYST_CORRELATION_MATRIX.map((row, ri) =>
                row.map((r, ci) => {
                  const c = correlationCellColor(r)
                  return (
                    <button
                      key={`${ri}-${ci}`}
                      type="button"
                      className="w-12 h-12 rounded text-[11px] font-mono font-bold cursor-pointer border-none"
                      style={{ background: c.bg, color: c.color }}
                      onClick={() => setMatrixCell({ x: ri, y: ci, r })}
                    >
                      {r.toFixed(2)}
                    </button>
                  )
                })
              )}
            </div>
            <div className="flex flex-wrap gap-2 text-[11px] text-(--text-muted)">
              {ANALYST_CORRELATION_VARS.map((v) => (
                <span key={v}>{v}</span>
              ))}
            </div>
          </div>
          <div className="dispatcher-surface p-4 lg:flex-[45] min-w-0">
            <h3 className="text-[13px] font-semibold m-0 mb-3">
              {ANALYST_CORRELATION_VARS[matrixCell.x]} × {ANALYST_CORRELATION_VARS[matrixCell.y]}
            </h3>
            <ResponsiveContainer width="100%" height={240}>
              <ScatterChart>
                <CartesianGrid stroke="var(--border-subtle)" />
                <XAxis dataKey="rain" name="Rainfall" tick={{ fontSize: 10 }} />
                <YAxis dataKey="incidents" name="Incidents" tick={{ fontSize: 10 }} />
                <Scatter data={ANALYST_SCATTER_DATA} fill="var(--accent)" fillOpacity={0.7} />
                <Line dataKey="incidents" stroke="var(--status-critical)" strokeDasharray="4 4" />
              </ScatterChart>
            </ResponsiveContainer>
            <p className="font-mono font-bold m-0 mt-3" style={{ color: 'var(--accent)' }}>
              Pearson r: {matrixCell.r.toFixed(2)}
            </p>
            <p className="text-[12px] m-0" style={{ color: 'var(--status-low)' }}>p-value: &lt; 0.001 (statistically significant)</p>
            <p className="text-[13px] text-(--text-secondary) mt-2 leading-relaxed">
              Strong positive correlation. 1mm increase in rainfall associated with 2.3 additional traffic incidents.
            </p>
          </div>
        </div>
      )}

      {tab === 'Type Evolution' && (
        <>
          <div className="dispatcher-surface p-4">
            <h3 className="text-[13px] font-semibold m-0 mb-3">Incident Type Composition — 12 Month Evolution</h3>
            <ResponsiveContainer width="100%" height={300}>
              <AreaChart data={EVOLUTION_DATA}>
                <CartesianGrid stroke="var(--border-subtle)" />
                <XAxis dataKey="m" />
                <YAxis domain={[0, 500]} />
                <Tooltip />
                {TYPE_STACK.map((t) => (
                  <Area key={t.key} type="monotone" dataKey={t.key} stackId="1" stroke={t.color} fill={t.color} fillOpacity={0.6} />
                ))}
              </AreaChart>
            </ResponsiveContainer>
            <div className="flex flex-wrap gap-3 mt-2">
              {TYPE_STACK.map((t) => (
                <span key={t.key} className="text-[11px] flex items-center gap-1">
                  <span className="w-2 h-2 rounded-full" style={{ background: t.color }} />
                  {t.name}
                </span>
              ))}
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {[
              { label: 'Armed Robbery ↑ +18% YoY', border: 'var(--status-critical)' },
              { label: 'Traffic Incidents ↓ -8% YoY', border: 'var(--status-low)' },
              { label: 'Medical Emergencies ↑ +12% YoY', border: 'var(--status-medium)' },
            ].map((c) => (
              <div
                key={c.label}
                className="dispatcher-surface p-4 font-semibold text-[13px]"
                style={{ borderLeft: `3px solid ${c.border}` }}
              >
                {c.label}
              </div>
            ))}
          </div>
        </>
      )}
        </div>
      </div>
    </div>
  )
}

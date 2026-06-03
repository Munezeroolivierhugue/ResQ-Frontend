import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { MapContainer, TileLayer, Circle, Popup } from 'react-leaflet'
import { BarChart, Bar, XAxis, YAxis, ResponsiveContainer, Cell } from 'recharts'
import { Plus, LineChart } from 'lucide-react'
import { useThemeStore } from '../../store/themeStore'
import MapInvalidateSize from '../../components/map/MapInvalidateSize'
import PlannerPageHeader from '../../components/planner/PlannerPageHeader'
import {
  PLANNER_HEATMAP_ZONES,
  PLANNER_HOUR_DATA,
  PLANNER_DAY_DATA,
  PLANNER_MONTH_DATA,
  PLANNER_EMERGING_HOTSPOTS,
  RWANDA_DISTRICTS,
  heatmapFill,
} from '../../data/mockPlannerData'
import 'leaflet/dist/leaflet.css'

const KIGALI_CENTER = [-1.9536, 30.0606]
const PERIODS = ['7 Days', '30 Days', '6 Months', '1 Year']

function barColor(value, max) {
  const t = value / max
  if (t > 0.75) return 'var(--status-critical)'
  if (t > 0.5) return 'var(--status-medium)'
  return 'var(--accent)'
}

export default function PlannerHotspots() {
  const { theme } = useThemeStore()
  const navigate = useNavigate()
  const [period, setPeriod] = useState('30 Days')
  const [showResult, setShowResult] = useState(true)
  const hourMax = Math.max(...PLANNER_HOUR_DATA.map((d) => d.n))
  const dayMax = Math.max(...PLANNER_DAY_DATA.map((d) => d.n))
  const monthMax = Math.max(...PLANNER_MONTH_DATA.map((d) => d.n))

  return (
    <div className="portal-page flex flex-col gap-4 min-w-[1024px]">
      <PlannerPageHeader
        title="Hotspot Analysis"
        subtitle="Incident clustering patterns and emerging risk zones."
      />

      <div className="flex flex-wrap gap-2 items-center mb-2">
        <select className="dispatcher-input h-9 w-40 text-[12px]" defaultValue="All Districts">
          {RWANDA_DISTRICTS.map((d) => (
            <option key={d}>{d}</option>
          ))}
        </select>
        <select className="dispatcher-input h-9 w-[150px] text-[12px]" defaultValue="All Types">
          <option>All Types</option>
          <option>Theft</option>
          <option>Traffic Accident</option>
          <option>Medical</option>
        </select>
        <div className="flex flex-wrap gap-2 ml-auto">
          {PERIODS.map((p) => (
            <button
              key={p}
              type="button"
              className="text-[11px] font-semibold px-3 py-1.5 rounded-full border cursor-pointer"
              style={{
                background: period === p ? 'var(--accent-ghost)' : 'var(--bg-elevated)',
                borderColor: period === p ? 'var(--accent)' : 'var(--border)',
                color: period === p ? 'var(--accent)' : 'var(--text-secondary)',
              }}
              onClick={() => setPeriod(p)}
            >
              {p}
            </button>
          ))}
        </div>
      </div>

      <div className="flex flex-col lg:flex-row gap-4">
        <div className="flex flex-col gap-4 min-w-0 lg:flex-[65]">
          <div className="dispatcher-surface p-4 relative">
            <h3 className="text-[13px] font-semibold m-0 mb-3">Incident Density — Kigali</h3>
            <div
              className="absolute top-14 left-6 z-[1000] px-3 py-2 rounded-lg border border-(--border) bg-(--bg-surface) text-[10px] space-y-1"
            >
              <div><span style={{ color: 'var(--status-critical)' }}>●</span> High density</div>
              <div><span style={{ color: 'var(--status-medium)' }}>●</span> Medium</div>
              <div><span style={{ color: 'var(--status-low)' }}>●</span> Low</div>
            </div>
            <MapContainer center={KIGALI_CENTER} zoom={12} style={{ height: 320, width: '100%' }}>
              <TileLayer
                url={
                  theme === 'dark'
                    ? 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png'
                    : 'https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png'
                }
                attribution="&copy; CARTO"
              />
              <MapInvalidateSize />
              {PLANNER_HEATMAP_ZONES.map((z) => (
                <Circle
                  key={z.name}
                  center={[z.lat, z.lng]}
                  radius={900}
                  pathOptions={{ fillColor: heatmapFill(z.density), fillOpacity: 1, color: 'transparent' }}
                >
                  <Popup>
                    <strong>{z.name}</strong>
                    <br />
                    {z.count} incidents · {z.topType}
                  </Popup>
                </Circle>
              ))}
            </MapContainer>
          </div>

          <div className="dispatcher-surface p-4">
            <h3 className="text-[13px] font-semibold m-0 mb-3">When Do Incidents Happen?</h3>
            <div className="flex flex-col sm:flex-row gap-4">
              {[
                { title: 'By Hour', data: PLANNER_HOUR_DATA, key: 'hour', max: hourMax },
                { title: 'By Day', data: PLANNER_DAY_DATA, key: 'day', max: dayMax },
                { title: 'By Month', data: PLANNER_MONTH_DATA, key: 'month', max: monthMax },
              ].map((chart) => (
                <div key={chart.title} className="flex-1 min-w-0">
                  <div className="text-[12px] text-(--text-muted) mb-1">{chart.title}</div>
                  <div style={{ height: 100, width: '100%' }}>
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={chart.data} margin={{ top: 4, right: 4, left: 0, bottom: 0 }}>
                        <XAxis dataKey={chart.key} tick={{ fontSize: 8, fill: 'var(--text-muted)' }} interval="preserveStartEnd" />
                        <YAxis hide />
                        <Bar dataKey="n" radius={[2, 2, 0, 0]}>
                          {chart.data.map((entry, i) => (
                            <Cell key={i} fill={barColor(entry.n, chart.max)} />
                          ))}
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="flex flex-col gap-4 min-w-0 lg:flex-[35]">
          <div>
            <h3 className="text-[13px] font-semibold m-0">Emerging Hotspots</h3>
            <p className="text-[12px] text-(--text-secondary) m-0 mt-1">
              Zones with increased activity vs prior 14 days
            </p>
          </div>
          {PLANNER_EMERGING_HOTSPOTS.map((h) => {
            const borderColor =
              h.severity === 'critical'
                ? 'var(--status-critical)'
                : h.severity === 'medium'
                  ? 'var(--status-medium)'
                  : 'var(--accent)'
            const dotColor = borderColor
            return (
              <div
                key={h.zone}
                className="dispatcher-surface p-4"
                style={{ borderLeft: `3px solid ${borderColor}` }}
              >
                <div className="flex justify-between items-start gap-2 mb-1">
                  <div className="flex items-center gap-2">
                    <span
                      className="w-2 h-2 rounded-full shrink-0 animate-pulse"
                      style={{ background: dotColor }}
                    />
                    <span className="font-semibold text-[13px]">{h.zone}</span>
                  </div>
                  <span
                    className="text-[10px] font-bold px-2 py-0.5 rounded"
                    style={{ background: 'var(--status-critical-bg)', color: 'var(--status-critical)' }}
                  >
                    +{h.increase}%
                  </span>
                </div>
                <div className="text-[12px] text-(--text-secondary)">{h.count} incidents · last 14 days</div>
                <div className="text-[12px] font-semibold mt-1" style={{ color: 'var(--status-critical)' }}>
                  ↑ {h.increase}% vs prior 14 days
                </div>
                <div className="text-[11px] text-(--text-muted) mt-0.5">Predominantly: {h.topType}</div>
                <button
                  type="button"
                  className="dispatcher-btn-outline w-full mt-2 text-[11px] h-[34px] flex items-center justify-center gap-1"
                  onClick={() => navigate(`/planner/deployment?zone=${encodeURIComponent(h.zone)}`)}
                >
                  <Plus size={14} />
                  Prepare Response Plan →
                </button>
              </div>
            )
          })}

          <div className="dispatcher-surface p-4">
            <h3 className="text-[13px] font-semibold m-0">Correlation Analysis</h3>
            <p className="text-[12px] text-(--text-secondary) m-0 mt-1 mb-3">
              Test relationships between factors and incident rates
            </p>
            <div className="flex flex-col sm:flex-row gap-2 mb-3">
              <select className="dispatcher-input h-9 flex-1 text-[12px]" defaultValue="Rainfall">
                <option>Rainfall</option>
                <option>Market Day</option>
                <option>Public Holiday</option>
                <option>Time of Day</option>
              </select>
              <select className="dispatcher-input h-9 flex-1 text-[12px]" defaultValue="Traffic Accident">
                <option>All Types</option>
                <option>Traffic Accident</option>
                <option>Theft</option>
              </select>
            </div>
            <button
              type="button"
              className="dispatcher-btn-primary text-[12px] px-3 py-1.5 inline-flex items-center gap-1.5"
              onClick={() => setShowResult(true)}
            >
              <LineChart size={14} />
              Analyze
            </button>
            {showResult && (
              <div className="mt-4">
                <div className="text-[12px] font-semibold mb-2">Correlation: STRONG (0.74)</div>
                <div className="h-2 rounded-full bg-(--border) overflow-hidden mb-2">
                  <div className="h-full rounded-full" style={{ width: '74%', background: 'var(--accent)' }} />
                </div>
                <p className="text-[12px] text-(--text-secondary) m-0">
                  Rainfall strongly correlates with traffic incidents in Nyarugenge. Effect strongest during peak
                  hours.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

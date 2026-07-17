import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { MapContainer, TileLayer, Circle, Popup } from 'react-leaflet'
import { BarChart, Bar, XAxis, YAxis, ResponsiveContainer, Cell } from 'recharts'
import { Plus } from 'lucide-react'
import { useThemeStore } from '../../store/themeStore'
import MapInvalidateSize from '../../components/map/MapInvalidateSize'
import PlannerPageHeader from '../../components/planner/PlannerPageHeader'
import { getHotspots, getIncidentTimeDistribution } from '../../api/planning'
import { listDistricts } from '../../api/districts'
import { heatmapFill } from '../../data/mockPlannerData'
import 'leaflet/dist/leaflet.css'

const KIGALI_CENTER = [-1.9536, 30.0606]
const PERIODS = [
  { label: '7 Days', days: 7 },
  { label: '30 Days', days: 30 },
  { label: '6 Months', days: 182 },
  { label: '1 Year', days: 365 },
]
const INCIDENT_TYPES = ['All Types', 'MEDICAL', 'FIRE', 'ROAD_ACCIDENT', 'SECURITY', 'THEFT']

function barColor(value, max) {
  if (!max) return 'var(--accent)'
  const t = value / max
  if (t > 0.75) return 'var(--status-critical)'
  if (t > 0.5) return 'var(--status-medium)'
  return 'var(--accent)'
}

export default function PlannerHotspots() {
  const { theme } = useThemeStore()
  const navigate = useNavigate()
  const [period, setPeriod] = useState(PERIODS[1])
  const [districts, setDistricts] = useState([])
  const [districtId, setDistrictId] = useState('')
  const [incidentType, setIncidentType] = useState('All Types')
  const [heatmapZones, setHeatmapZones] = useState([])
  const [timeDist, setTimeDist] = useState({ by_hour: [], by_day: [], by_month: [] })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    listDistricts().then(setDistricts).catch(() => {})
  }, [])

  useEffect(() => {
    Promise.resolve().then(() => setLoading(true))
    const params = {
      days: period.days,
      districtId: districtId || undefined,
      incidentType: incidentType !== 'All Types' ? incidentType : undefined,
    }
    Promise.allSettled([getHotspots(params), getIncidentTimeDistribution(params)])
      .then(([hotspotsRes, distRes]) => {
        setHeatmapZones(hotspotsRes.status === 'fulfilled' ? hotspotsRes.value : [])
        setTimeDist(distRes.status === 'fulfilled' ? distRes.value : { by_hour: [], by_day: [], by_month: [] })
      })
      .finally(() => setLoading(false))
  }, [period, districtId, incidentType])

  // Real emerging zones: a genuine increase (increase_pct > 0) against the
  // immediately preceding window of equal length — no fabricated percentage.
  const emergingHotspots = [...heatmapZones]
    .filter((h) => h.increase_pct != null && h.increase_pct > 0)
    .sort((a, b) => b.increase_pct - a.increase_pct)
    .slice(0, 6)

  const hourMax = Math.max(0, ...timeDist.by_hour.map((d) => d.count))
  const dayMax = Math.max(0, ...timeDist.by_day.map((d) => d.count))
  const monthMax = Math.max(0, ...timeDist.by_month.map((d) => d.count))

  return (
    <div className="portal-page flex flex-col gap-4 min-w-[1024px]">
      <PlannerPageHeader
        title="Hotspot Analysis"
        subtitle="Incident clustering patterns and emerging risk zones, from real incident data."
      />

      <div className="flex flex-wrap gap-2 items-center mb-2">
        <select
          className="dispatcher-input h-9 w-40 text-[12px]"
          value={districtId}
          onChange={(e) => setDistrictId(e.target.value)}
        >
          <option value="">All Districts</option>
          {districts.map((d) => (
            <option key={d.district_id} value={d.district_id}>{d.name}</option>
          ))}
        </select>
        <select
          className="dispatcher-input h-9 w-[150px] text-[12px]"
          value={incidentType}
          onChange={(e) => setIncidentType(e.target.value)}
        >
          {INCIDENT_TYPES.map((t) => (
            <option key={t} value={t}>{t === 'All Types' ? t : t.replace(/_/g, ' ')}</option>
          ))}
        </select>
        <div className="flex flex-wrap gap-2 ml-auto">
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
              {heatmapZones.map((z, i) => (
                <Circle
                  key={`${z.name}-${i}`}
                  center={[z.lat, z.lng]}
                  radius={900}
                  pathOptions={{ fillColor: heatmapFill(z.density), fillOpacity: 1, color: 'transparent' }}
                >
                  <Popup>
                    <strong>{z.name}</strong>
                    <br />
                    {z.count} incidents · {z.top_type}
                  </Popup>
                </Circle>
              ))}
            </MapContainer>
            {!loading && heatmapZones.length === 0 && (
              <p className="text-[12px] text-(--text-muted) text-center mt-2 mb-0">
                No incidents recorded for this filter/period.
              </p>
            )}
          </div>

          <div className="dispatcher-surface p-4">
            <h3 className="text-[13px] font-semibold m-0 mb-3">When Do Incidents Happen?</h3>
            <p className="text-[11px] text-(--text-muted) m-0 mb-3">Real counts from call time, for the selected filters.</p>
            <div className="flex flex-col sm:flex-row gap-4">
              {[
                { title: 'By Hour', data: timeDist.by_hour, key: 'label', max: hourMax },
                { title: 'By Day', data: timeDist.by_day, key: 'label', max: dayMax },
                { title: 'By Month', data: timeDist.by_month, key: 'label', max: monthMax },
              ].map((chart) => (
                <div key={chart.title} className="flex-1 min-w-0">
                  <div className="text-[12px] text-(--text-muted) mb-1">{chart.title}</div>
                  <div style={{ height: 100, width: '100%' }}>
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={chart.data} margin={{ top: 4, right: 4, left: 0, bottom: 0 }}>
                        <XAxis dataKey={chart.key} tick={{ fontSize: 8, fill: 'var(--text-muted)' }} interval="preserveStartEnd" />
                        <YAxis hide />
                        <Bar dataKey="count" radius={[2, 2, 0, 0]}>
                          {chart.data.map((entry, i) => (
                            <Cell key={i} fill={barColor(entry.count, chart.max)} />
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
              Zones with a real increase vs the preceding {period.label.toLowerCase()}
            </p>
          </div>
          {!loading && emergingHotspots.length === 0 && (
            <div className="dispatcher-surface p-4 text-[12px] text-(--text-muted) text-center">
              No zone is trending up for this filter/period.
            </div>
          )}
          {emergingHotspots.map((h, i) => {
            const severity = h.density === 'high' ? 'critical' : h.density === 'medium' ? 'medium' : 'accent'
            const borderColor =
              severity === 'critical' ? 'var(--status-critical)' : severity === 'medium' ? 'var(--status-medium)' : 'var(--accent)'
            return (
              <div
                key={`${h.name}-${i}`}
                className="dispatcher-surface p-4"
                style={{ borderLeft: `3px solid ${borderColor}` }}
              >
                <div className="flex justify-between items-start gap-2 mb-1">
                  <div className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full shrink-0 animate-pulse" style={{ background: borderColor }} />
                    <span className="font-semibold text-[13px]">{h.name}</span>
                  </div>
                  <span
                    className="text-[10px] font-bold px-2 py-0.5 rounded"
                    style={{ background: 'var(--status-critical-bg)', color: 'var(--status-critical)' }}
                  >
                    +{h.increase_pct}%
                  </span>
                </div>
                <div className="text-[12px] text-(--text-secondary)">
                  {h.count} incidents · {period.label.toLowerCase()} (vs {h.previous_count} prior)
                </div>
                <div className="text-[11px] text-(--text-muted) mt-0.5">Predominantly: {h.top_type}</div>
                <button
                  type="button"
                  className="dispatcher-btn-outline w-full mt-2 text-[11px] h-[34px] flex items-center justify-center gap-1"
                  onClick={() => navigate(`/planner/deployment?zone=${encodeURIComponent(h.name)}`)}
                >
                  <Plus size={14} />
                  Prepare Response Plan →
                </button>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}

import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { MapContainer, TileLayer, Circle, Popup } from 'react-leaflet'
import { BarChart, Bar, XAxis, YAxis, ResponsiveContainer, Legend } from 'recharts'
import { Route, TrafficCone, Clock, CloudRain, Users } from 'lucide-react'
import { useThemeStore } from '../../store/themeStore'
import MapInvalidateSize from '../../components/map/MapInvalidateSize'
import PlannerPageHeader from '../../components/planner/PlannerPageHeader'
import { getPredictions } from '../../api/planning'
import {
  PLANNER_PREDICTION_FACTORS,
  PLANNER_PREDICTED_VS_ACTUAL,
  responseTimeColor,
} from '../../data/mockPlannerData'
import 'leaflet/dist/leaflet.css'

const KIGALI_CENTER = [-1.9536, 30.0606]
const UNITS = ['P-07', 'M-01', 'P-19', 'AMB-04', 'P-12']
const ZONES = ['Biryogo', 'Kimihurura', 'Gisozi', 'Remera']

const FACTOR_ICONS = {
  route: Route,
  traffic: TrafficCone,
  clock: Clock,
  rain: CloudRain,
  users: Users,
}

function responseFill(min) {
  if (min < 5) return 'rgba(61,170,106,0.35)'
  if (min <= 8) return 'rgba(155,184,38,0.35)'
  if (min <= 12) return 'rgba(240,120,32,0.35)'
  return 'rgba(232,53,74,0.35)'
}

export default function PlannerPrediction() {
  const { theme } = useThemeStore()
  const [showUnits, setShowUnits] = useState(true)
  const [showRoutes, setShowRoutes] = useState(false)
  const [calcResult, setCalcResult] = useState(false)
  const [zone, setZone] = useState('Biryogo')
  const [responseZones, setResponseZones] = useState([])

  useEffect(() => {
    getPredictions().then((data) => {
      const zones = (data.predictions ?? []).map((p, idx) => {
        const coords = [
          [-1.9708, 30.0526],
          [-1.9608, 30.0626],
          [-1.9408, 30.0726],
          [-1.9536, 30.0906],
        ]
        const coord = coords[idx % coords.length]
        return {
          zone: p.hotspotZone ?? `Zone ${idx + 1}`,
          lat: coord[0],
          lng: coord[1],
          minutes: Math.round((4.0 + p.confidence * 8.0) * 10) / 10,
          count: p.predictedCount,
          unit: 'POL-08',
          distance: '4.2km',
          route: 'KN 2 Ave',
          confidence: Math.round(p.confidence * 100)
        }
      })
      if (zones.length > 0) {
        setResponseZones(zones)
      } else {
        setResponseZones([
          { zone: 'Nyamirambo', lat: -1.9708, lng: 30.0526, minutes: 14.5, count: 28 },
          { zone: 'Kimihurura', lat: -1.9608, lng: 30.0626, minutes: 5.2, count: 12 },
          { zone: 'Gisozi', lat: -1.9408, lng: 30.0726, minutes: 8.7, count: 19 },
          { zone: 'Remera', lat: -1.9536, lng: 30.0906, minutes: 11.1, count: 22 },
        ])
      }
    }).catch(() => {
      setResponseZones([
        { zone: 'Nyamirambo', lat: -1.9708, lng: 30.0526, minutes: 14.5, count: 28 },
        { zone: 'Kimihurura', lat: -1.9608, lng: 30.0626, minutes: 5.2, count: 12 },
        { zone: 'Gisozi', lat: -1.9408, lng: 30.0726, minutes: 8.7, count: 19 },
        { zone: 'Remera', lat: -1.9536, lng: 30.0906, minutes: 11.1, count: 22 },
      ])
    })
  }, [])

  const togglePill = (active, label, onClick) => (
    <button
      type="button"
      className="text-[11px] font-semibold px-3 py-1.5 rounded-full border cursor-pointer"
      style={{
        background: active ? 'var(--accent-ghost)' : 'var(--bg-elevated)',
        borderColor: active ? 'var(--accent)' : 'var(--border)',
        color: active ? 'var(--accent)' : 'var(--text-secondary)',
      }}
      onClick={onClick}
    >
      {label}
    </button>
  )

  return (
    <div className="portal-page flex flex-col gap-4 min-w-[1024px]">
      <PlannerPageHeader
        title="Response Time Prediction"
        subtitle="Current predicted response times across all sectors."
      />

      <div className="flex flex-col lg:flex-row gap-4">
        <div className="flex flex-col gap-4 min-w-0 lg:flex-[3]">
          <div className="dispatcher-surface p-4 relative">
            <div className="flex flex-wrap justify-between gap-2 mb-3">
              <h3 className="text-[13px] font-semibold m-0">Response Time Map — Live Predictions</h3>
              <div className="flex gap-2">
                {togglePill(showUnits, 'Show Units', () => setShowUnits((v) => !v))}
                {togglePill(showRoutes, 'Show Routes', () => setShowRoutes((v) => !v))}
              </div>
            </div>
            <div
              className="absolute top-16 left-6 z-[1000] px-3 py-2 rounded-lg border border-(--border) bg-(--bg-surface) text-[10px] space-y-1"
            >
              <div><span style={{ color: 'var(--status-low)' }}>●</span> &lt; 5 min</div>
              <div><span style={{ color: 'var(--accent)' }}>●</span> 5–8 min</div>
              <div><span style={{ color: 'var(--status-medium)' }}>●</span> 8–12 min</div>
              <div><span style={{ color: 'var(--status-critical)' }}>●</span> &gt; 12 min</div>
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
              {responseZones.map((z) => (
                <Circle
                  key={z.zone}
                  center={[z.lat, z.lng]}
                  radius={800}
                  pathOptions={{ fillColor: responseFill(z.minutes), fillOpacity: 1, color: 'transparent' }}
                >
                  <Popup>
                    <strong>{z.zone}</strong>
                    <br />
                    <span style={{ color: responseTimeColor(z.minutes) }}>Predicted: {z.minutes} min</span>
                    <br />
                    Unit: {z.unit} · {z.distance} away
                    <br />
                    Route: {z.route}
                    <br />
                    Confidence: {z.confidence}%
                  </Popup>
                </Circle>
              ))}
            </MapContainer>
          </div>

          <div className="dispatcher-surface p-4">
            <h3 className="text-[13px] font-semibold m-0">Quick Positioning Test</h3>
            <p className="text-[12px] text-(--text-secondary) m-0 mt-1 mb-3">
              Test a unit reposition before creating a full plan
            </p>
            <div className="flex flex-wrap gap-2 items-end">
              <select className="dispatcher-input h-9 text-[12px] w-28">
                {UNITS.map((u) => (
                  <option key={u}>{u}</option>
                ))}
              </select>
              <span className="text-[12px] text-(--text-secondary)">moved to</span>
              <input className="dispatcher-input h-9 flex-1 min-w-[120px] text-[12px]" placeholder="Standby point" />
              <span className="text-[12px] text-(--text-secondary)">response time in</span>
              <select
                className="dispatcher-input h-9 text-[12px] w-32"
                value={zone}
                onChange={(e) => setZone(e.target.value)}
              >
                {ZONES.map((z) => (
                  <option key={z}>{z}</option>
                ))}
              </select>
              <button type="button" className="dispatcher-btn-primary text-[12px] px-3 py-2" onClick={() => setCalcResult(true)}>
                Calculate
              </button>
            </div>
            {calcResult && (
              <div
                className="mt-3 p-3 rounded-lg"
                style={{ background: 'var(--accent-ghost)', border: '1px solid var(--accent)' }}
              >
                <div className="text-lg font-bold" style={{ color: 'var(--status-low)' }}>
                  Biryogo: 11.4m → 6.8m
                </div>
                <div className="text-[12px] font-semibold" style={{ color: 'var(--status-low)' }}>
                  Improvement: −4.6 minutes
                </div>
                <Link to="/planner/deployment" className="text-[12px] font-semibold text-(--accent) mt-2 inline-block no-underline hover:underline">
                  Create deployment plan based on this →
                </Link>
              </div>
            )}
          </div>
        </div>

        <div className="flex flex-col gap-4 min-w-0 lg:flex-[2]">
          <div className="dispatcher-surface p-4">
            <h3 className="text-[13px] font-semibold m-0">Prediction Factors</h3>
            <p className="text-[12px] text-(--text-secondary) m-0 mt-1 mb-3">What is influencing current predictions</p>
            {PLANNER_PREDICTION_FACTORS.map((f) => {
              const Icon = FACTOR_ICONS[f.icon] || Route
              const barColor =
                f.impact >= 30 ? 'var(--accent)' : f.impact >= 20 ? 'var(--status-medium)' : f.impact >= 15 ? 'var(--status-info)' : 'var(--text-muted)'
              return (
                <div key={f.label} className="mb-3">
                  <div className="flex items-center gap-2 text-[13px] font-medium mb-1">
                    <Icon size={14} className="text-(--text-muted)" />
                    {f.label}
                    <span className="ml-auto text-[11px] font-mono">{f.impact}%</span>
                  </div>
                  <div className="h-1.5 rounded-full bg-(--border) overflow-hidden">
                    <div className="h-full rounded-full" style={{ width: `${f.impact}%`, background: barColor }} />
                  </div>
                </div>
              )
            })}
          </div>

          <div className="dispatcher-surface p-4">
            <h3 className="text-[13px] font-semibold m-0">Predicted vs Actual — 30 Days</h3>
            <p className="text-[12px] text-(--text-secondary) m-0 mt-1 mb-2">Select zone to compare</p>
            <select className="dispatcher-input h-9 w-full text-[12px] mb-3" defaultValue="Biryogo Sector">
              <option>Biryogo Sector</option>
              <option>Gisozi Sector</option>
              <option>Remera</option>
            </select>
            <div style={{ height: 180, width: '100%' }}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={PLANNER_PREDICTED_VS_ACTUAL} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
                  <XAxis dataKey="day" tick={{ fontSize: 10, fill: 'var(--text-muted)' }} />
                  <YAxis domain={[0, 15]} tick={{ fontSize: 9, fill: 'var(--text-muted)' }} unit="m" />
                  <Legend wrapperStyle={{ fontSize: 10 }} />
                  <Bar dataKey="predicted" fill="var(--accent)" name="Predicted" radius={[2, 2, 0, 0]} />
                  <Bar dataKey="actual" fill="var(--status-info)" name="Actual" radius={[2, 2, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
            <p className="text-[12px] font-semibold m-0 mt-2" style={{ color: 'var(--status-low)' }}>
              Model accuracy: 88% for this zone
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}

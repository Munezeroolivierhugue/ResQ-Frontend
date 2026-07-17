import { useState, useEffect } from 'react'
import { MapContainer, TileLayer, Circle, Popup } from 'react-leaflet'
import { useThemeStore } from '../../store/themeStore'
import MapInvalidateSize from '../../components/map/MapInvalidateSize'
import PlannerPageHeader from '../../components/planner/PlannerPageHeader'
import { getHotspots } from '../../api/planning'
import { listVehicles } from '../../api/vehicles'
import { haversineMeters } from '../../utils/geo'
import { responseTimeColor } from '../../data/mockPlannerData'
import 'leaflet/dist/leaflet.css'

const KIGALI_CENTER = [-1.9536, 30.0606]
const SPEED_KMH = 40 // same assumption the dispatch brain and mutual-aid ETA math already use

function responseFill(min) {
  if (min < 5) return 'rgba(61,170,106,0.35)'
  if (min <= 8) return 'rgba(155,184,38,0.35)'
  if (min <= 12) return 'rgba(240,120,32,0.35)'
  return 'rgba(232,53,74,0.35)'
}

function categoryOf(vehicleType) {
  const t = (vehicleType || '').toUpperCase()
  if (t.includes('AMBULANCE')) return 'Ambulance'
  if (t.includes('FIRE') || t.includes('DISASTER')) return 'Fire & Rescue'
  if (t.includes('POLICE') || t.includes('TACTICAL')) return 'Police'
  return 'Other'
}

function preferredCategoryFor(incidentType) {
  const t = (incidentType || '').toUpperCase()
  if (t.includes('MEDICAL') || t.includes('RTA')) return 'Ambulance'
  if (t.includes('FIRE')) return 'Fire & Rescue'
  return 'Police'
}

function etaMinutes(distanceKm) {
  return (distanceKm / SPEED_KMH) * 60
}

// Real nearest-available-unit ETA — same haversine-distance-over-assumed-speed
// math already used by the dispatch brain and mutual-aid recommendations,
// applied per real incident hotspot instead of per incident. No forecasting,
// no trained model — this is a real-time capability calculation.
function nearestUnit(zone, vehicles, preferredCategory) {
  const available = vehicles.filter((v) => v.status === 'available' && v.current_lat != null && v.current_lng != null)
  const pool = available.filter((v) => categoryOf(v.vehicle_type) === preferredCategory)
  const candidates = pool.length > 0 ? pool : available
  let best = null
  let bestDistKm = Infinity
  for (const v of candidates) {
    const distKm = haversineMeters(zone.lat, zone.lng, v.current_lat, v.current_lng) / 1000
    if (distKm < bestDistKm) { bestDistKm = distKm; best = v }
  }
  if (!best) return null
  return { vehicle: best, distanceKm: Math.round(bestDistKm * 10) / 10, minutes: Math.round(etaMinutes(bestDistKm) * 10) / 10 }
}

export default function PlannerPrediction() {
  const { theme } = useThemeStore()
  const [showUnits, setShowUnits] = useState(true)
  const [vehicles, setVehicles] = useState([])
  const [responseZones, setResponseZones] = useState([])
  const [loading, setLoading] = useState(true)

  const [testVehicleId, setTestVehicleId] = useState('')
  const [testZoneName, setTestZoneName] = useState('')
  const [testResult, setTestResult] = useState(null)

  useEffect(() => {
    Promise.allSettled([getHotspots({ days: 30 }), listVehicles()])
      .then(([hotspotsRes, vehiclesRes]) => {
        const realVehicles = vehiclesRes.status === 'fulfilled' ? vehiclesRes.value : []
        setVehicles(realVehicles)
        const hotspots = hotspotsRes.status === 'fulfilled' ? hotspotsRes.value : []
        const zones = hotspots.slice(0, 8).map((h) => {
          const preferred = preferredCategoryFor(h.top_type)
          const nearest = nearestUnit(h, realVehicles, preferred)
          return {
            zone: h.name,
            lat: h.lat,
            lng: h.lng,
            count: h.count,
            topType: h.top_type,
            nearest,
          }
        })
        setResponseZones(zones)
      })
      .finally(() => setLoading(false))
  }, [])

  const availableVehicles = vehicles.filter((v) => v.status === 'available')

  function runTest() {
    const vehicle = vehicles.find((v) => v.vehicle_id === testVehicleId)
    const zone = responseZones.find((z) => z.zone === testZoneName)
    if (!vehicle || !zone || vehicle.current_lat == null || vehicle.current_lng == null) {
      setTestResult(null)
      return
    }
    const distKm = haversineMeters(zone.lat, zone.lng, vehicle.current_lat, vehicle.current_lng) / 1000
    const minutes = etaMinutes(distKm)
    setTestResult({
      zone: zone.zone,
      vehiclePlate: vehicle.plate_number,
      distanceKm: Math.round(distKm * 10) / 10,
      minutes: Math.round(minutes * 10) / 10,
      currentBest: zone.nearest,
    })
  }

  return (
    <div className="portal-page flex flex-col gap-4 min-w-[1024px]">
      <PlannerPageHeader
        title="Response Time Map"
        subtitle="Real nearest-available-unit ETA to this district's actual incident hotspots — not a forecast."
      />

      <div className="flex flex-col lg:flex-row gap-4">
        <div className="flex flex-col gap-4 min-w-0 lg:flex-[3]">
          <div className="dispatcher-surface p-4 relative">
            <div className="flex flex-wrap justify-between gap-2 mb-3">
              <h3 className="text-[13px] font-semibold m-0">Response Time Map — Real Fleet Positions</h3>
              <button
                type="button"
                className="text-[11px] font-semibold px-3 py-1.5 rounded-full border cursor-pointer"
                style={{
                  background: showUnits ? 'var(--accent-ghost)' : 'var(--bg-elevated)',
                  borderColor: showUnits ? 'var(--accent)' : 'var(--border)',
                  color: showUnits ? 'var(--accent)' : 'var(--text-secondary)',
                }}
                onClick={() => setShowUnits((v) => !v)}
              >
                Show Units
              </button>
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
              {responseZones.filter((z) => z.nearest).map((z) => (
                <Circle
                  key={z.zone}
                  center={[z.lat, z.lng]}
                  radius={800}
                  pathOptions={{ fillColor: responseFill(z.nearest.minutes), fillOpacity: 1, color: 'transparent' }}
                >
                  <Popup>
                    <strong>{z.zone}</strong>
                    <br />
                    <span style={{ color: responseTimeColor(z.nearest.minutes) }}>Nearest unit ETA: {z.nearest.minutes} min</span>
                    <br />
                    Unit: {z.nearest.vehicle.plate_number} · {z.nearest.distanceKm}km away
                    <br />
                    Real incidents here (30d): {z.count} · mostly {z.topType}
                  </Popup>
                </Circle>
              ))}
              {showUnits && availableVehicles.filter((v) => v.current_lat != null).map((v) => (
                <Circle
                  key={v.vehicle_id}
                  center={[v.current_lat, v.current_lng]}
                  radius={120}
                  pathOptions={{ fillColor: 'var(--accent)', fillOpacity: 0.9, color: 'transparent' }}
                >
                  <Popup>
                    <strong>{v.plate_number}</strong> · {v.vehicle_type}
                  </Popup>
                </Circle>
              ))}
            </MapContainer>
            {!loading && responseZones.filter((z) => z.nearest).length === 0 && (
              <p className="text-[12px] text-(--text-muted) text-center mt-2 mb-0">No hotspots with an available unit right now.</p>
            )}
          </div>

          <div className="dispatcher-surface p-4">
            <h3 className="text-[13px] font-semibold m-0">Quick Unit Test</h3>
            <p className="text-[12px] text-(--text-secondary) m-0 mt-1 mb-3">
              Real ETA of a specific unit to a real hotspot zone, from its current position.
            </p>
            <div className="flex flex-wrap gap-2 items-end">
              <select
                className="dispatcher-input h-9 text-[12px] min-w-[160px]"
                value={testVehicleId}
                onChange={(e) => setTestVehicleId(e.target.value)}
              >
                <option value="">Select unit…</option>
                {vehicles.filter((v) => v.current_lat != null).map((v) => (
                  <option key={v.vehicle_id} value={v.vehicle_id}>{v.plate_number} · {v.vehicle_type}</option>
                ))}
              </select>
              <span className="text-[12px] text-(--text-secondary)">ETA to</span>
              <select
                className="dispatcher-input h-9 text-[12px] min-w-[140px]"
                value={testZoneName}
                onChange={(e) => setTestZoneName(e.target.value)}
              >
                <option value="">Select zone…</option>
                {responseZones.map((z) => (
                  <option key={z.zone} value={z.zone}>{z.zone}</option>
                ))}
              </select>
              <button type="button" className="dispatcher-btn-primary text-[12px] px-3 py-2" onClick={runTest} disabled={!testVehicleId || !testZoneName}>
                Calculate
              </button>
            </div>
            {testResult && (
              <div
                className="mt-3 p-3 rounded-lg"
                style={{ background: 'var(--accent-ghost)', border: '1px solid var(--accent)' }}
              >
                <div className="text-lg font-bold" style={{ color: responseTimeColor(testResult.minutes) }}>
                  {testResult.vehiclePlate} → {testResult.zone}: {testResult.minutes}m ({testResult.distanceKm}km)
                </div>
                {testResult.currentBest && (
                  <div className="text-[12px] font-semibold mt-1" style={{ color: 'var(--text-secondary)' }}>
                    Current fastest unit to this zone: {testResult.currentBest.vehicle.plate_number} at {testResult.currentBest.minutes}m
                    {testResult.minutes < testResult.currentBest.minutes ? ' — this unit would be faster.' : ' — this unit would not improve on it.'}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        <div className="flex flex-col gap-4 min-w-0 lg:flex-[2]">
          <div className="dispatcher-surface p-4">
            <h3 className="text-[13px] font-semibold m-0">Hotspot Response Summary</h3>
            <p className="text-[12px] text-(--text-secondary) m-0 mt-1 mb-3">Real 30-day incident zones, ranked by current ETA risk</p>
            {loading && <p className="text-[12px] text-(--text-muted) m-0">Loading…</p>}
            {!loading && responseZones.length === 0 && <p className="text-[12px] text-(--text-muted) m-0">No hotspot data yet.</p>}
            {[...responseZones].filter((z) => z.nearest).sort((a, b) => b.nearest.minutes - a.nearest.minutes).map((z) => (
              <div key={z.zone} className="flex items-center justify-between text-[12px] py-2 border-t border-(--border-subtle) first:border-0">
                <div>
                  <div className="font-medium">{z.zone}</div>
                  <div className="text-(--text-muted) text-[11px]">{z.count} incidents · {z.topType}</div>
                </div>
                <span className="font-mono font-semibold" style={{ color: responseTimeColor(z.nearest.minutes) }}>
                  {z.nearest.minutes}m
                </span>
              </div>
            ))}
          </div>

          <div className="dispatcher-surface p-4">
            <h3 className="text-[13px] font-semibold m-0 mb-1">Incident Volume Forecasting</h3>
            <p className="text-[12px] text-(--text-secondary) m-0">
              Not available yet. A trained forecasting model needs real historical incident data to be trustworthy —
              this district currently has too little history to train on. This section will populate once there's
              enough real data to validate predictions against real outcomes, instead of showing a fabricated result.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}

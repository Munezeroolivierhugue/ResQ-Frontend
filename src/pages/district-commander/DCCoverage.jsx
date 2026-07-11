import { useMemo, useState, useEffect } from 'react'
import { MapContainer, TileLayer, Circle, Tooltip, Marker, Popup } from 'react-leaflet'
import L from 'leaflet'
import { ArrowUp } from 'lucide-react'
import { useThemeStore } from '../../store/themeStore'
import RwandaBoundsEnforcer from '../../components/map/RwandaBoundsEnforcer'
import MapFitBounds from '../../components/map/MapFitBounds'
import { RWANDA_BOUNDS, RWANDA_MIN_ZOOM, RWANDA_MAX_ZOOM } from '../../components/map/rwandaConstants'
import DCPageHeader from '../../components/district-commander/DCPageHeader'
import { getDistrictCommanderDistrict } from '../../utils/districtCommanderSession'
import { DC_COVERAGE_SECTORS, DC_COVERAGE_RECOMMENDATIONS } from '../../data/mockDistrictCommanderData'
import { mockReallocations } from '../../data/mockReallocations'
import { getCurrentUser } from '../../utils/authSession'
import { useNotificationsStore } from '../../store/notificationsStore'
import { listVehicles } from '../../api/vehicles'
import 'leaflet/dist/leaflet.css'

const COVERAGE_MAP_CENTER = [-1.961, 30.05]
const COVERAGE_MAP_ZOOM = 15
const COVERAGE_MAP_PADDING = [40, 40]

// Simple colored circle icon for vehicle markers
function vehicleIcon(status) {
  const color = status === 'available' ? '#3DAA6A' : status === 'dispatched' ? '#F07820' : '#888'
  return L.divIcon({
    html: `<div style="width:10px;height:10px;border-radius:50%;background:${color};border:2px solid white;box-shadow:0 1px 3px rgba(0,0,0,.4)"></div>`,
    className: '',
    iconSize: [10, 10],
    iconAnchor: [5, 5],
  })
}

function coverageFill(pct) {
  if (pct >= 85) return 'rgba(61, 170, 106, 0.25)'
  if (pct >= 65) return 'rgba(240, 120, 32, 0.25)'
  return 'rgba(232, 53, 74, 0.25)'
}

function coverageStroke(pct) {
  if (pct >= 85) return 'var(--status-low)'
  if (pct >= 65) return 'var(--status-medium)'
  return 'var(--status-critical)'
}

export default function DCCoverage() {
  const { theme } = useThemeStore()
  const district = getDistrictCommanderDistrict()
  const districtId = sessionStorage.getItem('resq-district-id') || undefined
  const addNotification = useNotificationsStore((s) => s.addNotification)

  const [layers, setLayers] = useState({
    'Coverage Zones': true,
    'Unit Positions': true,
    'Sector Labels': true,
  })
  const [recs, setRecs] = useState(() => DC_COVERAGE_RECOMMENDATIONS.map((r) => ({ ...r })))

  const [vehicles, setVehicles] = useState([])
  const [vehiclesLoading, setVehiclesLoading] = useState(true)

  useEffect(() => {
    const params = districtId ? { districtId } : {}
    listVehicles(params)
      .then((vs) => setVehicles(vs.filter((v) => v.current_lat != null && v.current_lng != null)))
      .catch(() => {})
      .finally(() => setVehiclesLoading(false))
  }, [])

  const toggle = (name) => setLayers((p) => ({ ...p, [name]: !p[name] }))

  const approveRec = (rec) => {
    const currentUser = getCurrentUser()
    const timestamp = new Date().toISOString()
    mockReallocations.push({
      reallocation_id: 'real-' + Math.random().toString(36).slice(2, 10),
      vehicle_id: null,
      from_zone: null,
      to_zone: rec.zone || rec.text,
      approved_by: currentUser?.user_id ?? null,
      ai_recommended: true,
      status: 'APPROVED',
      reason: rec.text,
      created_at: timestamp,
    })
    addNotification({
      id: 'notif-' + Math.random().toString(36).slice(2, 10),
      type: 'COVERAGE_RECOMMENDATION_APPROVED',
      target_role: 'operations_manager',
      title: 'Coverage Recommendation Approved',
      message: rec.text,
      timestamp,
      read: false,
    })
    setRecs((list) => list.map((r) => (r.id === rec.id ? { ...r, approved: true } : r)))
  }

  const atRisk = DC_COVERAGE_SECTORS.filter((s) => s.coverage < 65).length
  const overall = Math.round(
    DC_COVERAGE_SECTORS.reduce((s, x) => s + x.coverage, 0) / DC_COVERAGE_SECTORS.length
  )

  const sectorPoints = useMemo(() => DC_COVERAGE_SECTORS.map((s) => [s.lat, s.lng]), [])

  return (
    <div className="portal-page flex flex-col gap-4">
      <DCPageHeader
        title="Coverage Analysis"
        eyebrow="District Commander"
        subtitle={district ? `Sector coverage map and gap recommendations for ${district} District.` : 'Sector coverage map and gap recommendations.'}
      />

      <div className="dc-coverage-layout min-h-[520px]">
        <div className="flex flex-col min-w-0">
          <div className="shrink-0 flex flex-wrap gap-2 mb-2">
            {Object.keys(layers).map((name) => (
              <button
                key={name}
                type="button"
                className="text-[11px] font-semibold px-3 py-1.5 rounded-full border cursor-pointer"
                style={{
                  fontFamily: 'var(--font-display)',
                  background: layers[name] ? 'var(--accent-ghost)' : 'var(--bg-input)',
                  borderColor: layers[name] ? 'var(--accent)' : 'var(--border)',
                  color: layers[name] ? 'var(--accent)' : 'var(--text-secondary)',
                }}
                onClick={() => toggle(name)}
              >
                {name}
              </button>
            ))}
            {vehiclesLoading && (
              <span className="text-[11px] text-(--text-muted) self-center">Loading unit positions…</span>
            )}
          </div>
          <div className="dispatcher-surface flex-1 map-panel-full relative overflow-hidden">
            <div className="absolute top-3 left-3 z-[1000] px-3 py-2 rounded-lg border border-(--border) bg-(--bg-surface) text-[10px] space-y-1">
              <div><span style={{ color: 'var(--status-low)' }}>●</span> Good (≥85%)</div>
              <div><span style={{ color: 'var(--status-medium)' }}>●</span> Moderate (65–84%)</div>
              <div><span style={{ color: 'var(--status-critical)' }}>●</span> Critical (&lt;65%)</div>
              <div className="pt-1 border-t border-(--border-subtle)">
                <span style={{ color: '#3DAA6A' }}>●</span> Available &nbsp;
                <span style={{ color: '#F07820' }}>●</span> Dispatched
              </div>
            </div>
            <MapContainer
              center={COVERAGE_MAP_CENTER}
              zoom={COVERAGE_MAP_ZOOM}
              minZoom={RWANDA_MIN_ZOOM}
              maxZoom={RWANDA_MAX_ZOOM}
              maxBounds={RWANDA_BOUNDS}
              style={{ width: '100%', height: '100%', minHeight: 440, background: 'var(--bg-base)' }}
            >
              <TileLayer
                url={
                  theme === 'dark'
                    ? 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png'
                    : 'https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png'
                }
                attribution="&copy; CARTO"
              />
              <RwandaBoundsEnforcer fitOnMount={false} />
              <MapFitBounds points={sectorPoints} padding={COVERAGE_MAP_PADDING} />
              {layers['Coverage Zones'] &&
                DC_COVERAGE_SECTORS.map((s) => (
                  <Circle
                    key={s.name}
                    center={[s.lat, s.lng]}
                    radius={s.radius}
                    pathOptions={{
                      fillColor: coverageFill(s.coverage),
                      fillOpacity: 1,
                      color: coverageStroke(s.coverage),
                      weight: 2,
                    }}
                  >
                    {layers['Sector Labels'] && (
                      <Tooltip permanent direction="center" className="!bg-transparent !border-0 !shadow-none">
                        <span className="text-[10px] font-bold" style={{ color: 'var(--text-primary)' }}>
                          {s.name} ({s.coverage}%)
                        </span>
                      </Tooltip>
                    )}
                  </Circle>
                ))}
              {layers['Unit Positions'] &&
                vehicles.map((v) => (
                  <Marker
                    key={v.vehicle_id}
                    position={[v.current_lat, v.current_lng]}
                    icon={vehicleIcon(v.status)}
                  >
                    <Popup>
                      <div className="text-[12px]">
                        <div className="font-bold">{v.plate_number}</div>
                        <div>{v.vehicle_type} · {v.agency_name ?? '—'}</div>
                        <div className="capitalize">{v.status}</div>
                      </div>
                    </Popup>
                  </Marker>
                ))}
            </MapContainer>
          </div>
        </div>

        <div className="flex flex-col gap-4 min-w-0">
          <div className="dispatcher-surface p-4">
            <h2 className="text-[13px] font-bold m-0 mb-3">Coverage Summary</h2>
            <div className="space-y-2 text-[13px]">
              <div className="flex justify-between">
                <span className="text-(--text-secondary)">Sectors at risk</span>
                <span className="font-mono font-bold">{atRisk}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-(--text-secondary)">Overall district coverage</span>
                <span className="font-mono font-bold">{overall}%</span>
              </div>
              <div className="flex justify-between">
                <span className="text-(--text-secondary)">Units with GPS position</span>
                <span className="font-mono font-bold">{vehiclesLoading ? '…' : vehicles.length}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-(--text-secondary)">Recommended unit moves</span>
                <span className="font-mono font-bold">{recs.length}</span>
              </div>
            </div>
          </div>

          <div className="flex flex-col gap-3">
            <h2 className="text-[13px] font-bold m-0">AI Coverage Recommendations</h2>
            {recs.map((rec) => (
              <div key={rec.id} className="dispatcher-surface p-4">
                <div className="text-[13px] font-bold text-(--text-primary)">{rec.text}</div>
                <p className="text-[12px] text-(--text-secondary) m-0 mt-1">{rec.impact}</p>
                <p className="text-[11px] text-(--text-muted) font-mono m-0 mt-1">{rec.source}</p>
                <div className="flex flex-wrap gap-2 mt-3">
                  <button
                    type="button"
                    className="dispatcher-btn-primary text-[11px] py-1.5 px-2.5"
                    disabled={rec.approved}
                    style={
                      rec.approved
                        ? { background: 'var(--status-low-bg)', color: 'var(--status-low)', border: '1px solid var(--status-low)', cursor: 'default' }
                        : undefined
                    }
                    onClick={() => approveRec(rec)}
                  >
                    {rec.approved ? 'Approved ✓' : 'Approve for OM'}
                  </button>
                  <button type="button" className="dispatcher-btn-ghost text-[11px] py-1.5 px-2.5 inline-flex items-center gap-1">
                    <ArrowUp size={12} />
                    Escalate to HQ
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

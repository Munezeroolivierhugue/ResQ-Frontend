import { useMemo, useState, useEffect } from 'react'
import { MapContainer, TileLayer, Marker, Popup, Circle, Tooltip } from 'react-leaflet'
import L from 'leaflet'
import { useThemeStore } from '../../store/themeStore'
import RwandaBoundsEnforcer from '../../components/map/RwandaBoundsEnforcer'
import MapFitBounds from '../../components/map/MapFitBounds'
import { RWANDA_BOUNDS, RWANDA_CENTER, RWANDA_MIN_ZOOM, RWANDA_MAX_ZOOM } from '../../components/map/rwandaConstants'
import DCPageHeader from '../../components/district-commander/DCPageHeader'
import { getDistrictCommanderDistrict } from '../../utils/districtCommanderSession'
import { getCurrentUser } from '../../utils/authSession'
import { listVehicles } from '../../api/vehicles'
import { listIncidents } from '../../api/incidents'
import { getResponseTimeTarget } from '../../api/admin'
import 'leaflet/dist/leaflet.css'

const MAP_PADDING = [40, 40]
const TARGET_AVAILABILITY = 60

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

function categoryOf(vehicleType) {
  const t = (vehicleType ?? '').toUpperCase()
  if (t.includes('AMBULANCE')) return 'Ambulance'
  if (t.includes('FIRE') || t.includes('DISASTER')) return 'Fire & Rescue'
  if (t.includes('POLICE') || t.includes('TACTICAL')) return 'Police'
  return 'Other'
}

export default function DCCoverage() {
  const { theme } = useThemeStore()
  const district = getDistrictCommanderDistrict()
  const districtId = getCurrentUser()?.district_id

  const [vehicles, setVehicles] = useState([])
  const [incidents, setIncidents] = useState([])
  const [slaTarget, setSlaTarget] = useState(12)
  const [loading, setLoading] = useState(true)

  // Real map filters — which vehicle categories and statuses to show.
  // Track only the explicitly-hidden categories/statuses rather than
  // syncing a full default-true map to the vehicle list on every load.
  const [hiddenCategories, setHiddenCategories] = useState(() => new Set())
  const [hiddenStatuses, setHiddenStatuses] = useState(() => new Set())
  const [showZones, setShowZones] = useState(true)

  useEffect(() => {
    getResponseTimeTarget().then(setSlaTarget).catch(() => {})
  }, [])

  useEffect(() => {
    if (!districtId) { Promise.resolve().then(() => setLoading(false)); return }
    Promise.all([listVehicles({ districtId }), listIncidents({ districtId })])
      .then(([v, i]) => { setVehicles(v); setIncidents(i) })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [districtId])

  // Real sector coverage — each sector's own incidents (via their real
  // location.sector value), centroid from those incidents' real
  // coordinates, and coverage % = share of that sector's incidents whose
  // real response time met the district's SLA target. Only sectors with at
  // least one positioned incident are shown, since there's no other real
  // source for where a sector actually is.
  const sectorZones = useMemo(() => {
    const bySector = incidents.reduce((acc, i) => {
      if (!i.sector) return acc
      if (!acc[i.sector]) acc[i.sector] = []
      acc[i.sector].push(i)
      return acc
    }, {})
    return Object.entries(bySector).map(([name, incs]) => {
      const withPos = incs.filter((i) => i.lat != null && i.lng != null)
      if (withPos.length === 0) return null
      const lat = withPos.reduce((s, i) => s + i.lat, 0) / withPos.length
      const lng = withPos.reduce((s, i) => s + i.lng, 0) / withPos.length
      const timed = incs.filter((i) => i.response_time_minutes != null)
      const onTime = timed.filter((i) => i.response_time_minutes <= slaTarget).length
      const pct = timed.length ? Math.round((onTime / timed.length) * 100) : null
      return { name, lat, lng, pct, count: incs.length }
    }).filter(Boolean)
  }, [incidents, slaTarget])

  const categoryNames = useMemo(
    () => Array.from(new Set(vehicles.map((v) => categoryOf(v.vehicle_type)))),
    [vehicles]
  )

  const toggleCategory = (name) => setHiddenCategories((prev) => {
    const next = new Set(prev)
    if (next.has(name)) next.delete(name); else next.add(name)
    return next
  })
  const toggleStatus = (name) => setHiddenStatuses((prev) => {
    const next = new Set(prev)
    if (next.has(name)) next.delete(name); else next.add(name)
    return next
  })

  const statusGroup = (status) => (status === 'available' ? 'available' : status === 'dispatched' ? 'dispatched' : 'other')

  const withPosition = vehicles.filter((v) => {
    if (v.current_lat == null || v.current_lng == null) return false
    if (hiddenCategories.has(categoryOf(v.vehicle_type))) return false
    if (hiddenStatuses.has(statusGroup(v.status))) return false
    return true
  })

  // Real per-category fleet availability, replacing the old hardcoded
  // "sectors" (fake names/shapes/coverage percentages with no connection
  // to this district's real geography or fleet) — same honest metric used
  // on the Ops Manager's Resource Reallocation and Command Overview pages.
  const categories = useMemo(() => {
    const byCategory = vehicles.reduce((acc, v) => {
      const cat = categoryOf(v.vehicle_type)
      if (!acc[cat]) acc[cat] = { name: cat, total: 0, available: 0 }
      acc[cat].total += 1
      if (v.status === 'available') acc[cat].available += 1
      return acc
    }, {})
    return Object.values(byCategory).map((c) => ({ ...c, pct: Math.round((c.available / c.total) * 100) }))
  }, [vehicles])

  const atRisk = categories.filter((c) => c.pct < TARGET_AVAILABILITY).length
  const overall = categories.length
    ? Math.round(categories.reduce((s, c) => s + c.pct, 0) / categories.length)
    : null

  const mapPoints = useMemo(
    () => [...withPosition.map((v) => [v.current_lat, v.current_lng]), ...sectorZones.map((z) => [z.lat, z.lng])],
    [withPosition, sectorZones]
  )

  return (
    <div className="portal-page flex flex-col gap-4">
      <DCPageHeader
        title="Coverage Analysis"
        eyebrow="District Commander"
        subtitle={district ? `Real fleet positions and availability for ${district} District.` : 'Real fleet positions and availability.'}
      />

      <div className="dc-coverage-layout min-h-[520px]">
        <div className="flex flex-col min-w-0">
          <div className="shrink-0 flex flex-wrap gap-2 mb-2">
            {categoryNames.map((name) => {
              const active = !hiddenCategories.has(name)
              return (
                <button
                  key={name}
                  type="button"
                  className="text-[11px] font-semibold px-3 py-1.5 rounded-full border cursor-pointer"
                  style={{
                    fontFamily: 'var(--font-display)',
                    background: active ? 'var(--accent-ghost)' : 'var(--bg-input)',
                    borderColor: active ? 'var(--accent)' : 'var(--border)',
                    color: active ? 'var(--accent)' : 'var(--text-secondary)',
                  }}
                  onClick={() => toggleCategory(name)}
                >
                  {name}
                </button>
              )
            })}
            <span className="w-px self-stretch bg-(--border)" />
            {[
              ['available', 'Available'],
              ['dispatched', 'Dispatched'],
              ['other', 'Other Status'],
            ].map(([key, label]) => {
              const active = !hiddenStatuses.has(key)
              return (
                <button
                  key={key}
                  type="button"
                  className="text-[11px] font-semibold px-3 py-1.5 rounded-full border cursor-pointer"
                  style={{
                    fontFamily: 'var(--font-display)',
                    background: active ? 'var(--accent-ghost)' : 'var(--bg-input)',
                    borderColor: active ? 'var(--accent)' : 'var(--border)',
                    color: active ? 'var(--accent)' : 'var(--text-secondary)',
                  }}
                  onClick={() => toggleStatus(key)}
                >
                  {label}
                </button>
              )
            })}
            <span className="w-px self-stretch bg-(--border)" />
            <button
              type="button"
              className="text-[11px] font-semibold px-3 py-1.5 rounded-full border cursor-pointer"
              style={{
                fontFamily: 'var(--font-display)',
                background: showZones ? 'var(--accent-ghost)' : 'var(--bg-input)',
                borderColor: showZones ? 'var(--accent)' : 'var(--border)',
                color: showZones ? 'var(--accent)' : 'var(--text-secondary)',
              }}
              onClick={() => setShowZones((v) => !v)}
            >
              Sector Zones
            </button>
            {loading && (
              <span className="text-[11px] text-(--text-muted) self-center">Loading unit positions…</span>
            )}
          </div>
          <div className="dispatcher-surface flex-1 map-panel-full relative overflow-hidden">
            <div className="absolute top-3 left-3 z-[1000] px-3 py-2 rounded-lg border border-(--border) bg-(--bg-surface) text-[10px] space-y-1">
              <div><span style={{ color: 'var(--status-low)' }}>●</span> On-time ≥85%</div>
              <div><span style={{ color: 'var(--status-medium)' }}>●</span> On-time 65–84%</div>
              <div><span style={{ color: 'var(--status-critical)' }}>●</span> On-time &lt;65%</div>
              <div className="pt-1 border-t border-(--border-subtle)">
                <span style={{ color: '#3DAA6A' }}>●</span> Available &nbsp;
                <span style={{ color: '#F07820' }}>●</span> Dispatched
              </div>
            </div>
            <MapContainer
              center={RWANDA_CENTER}
              zoom={13}
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
              <MapFitBounds points={mapPoints} padding={MAP_PADDING} />
              {showZones && sectorZones.map((z) => (
                <Circle
                  key={z.name}
                  center={[z.lat, z.lng]}
                  radius={Math.min(1400, 500 + z.count * 60)}
                  pathOptions={{
                    fillColor: z.pct != null ? coverageFill(z.pct) : 'rgba(136,136,136,0.15)',
                    fillOpacity: 1,
                    color: z.pct != null ? coverageStroke(z.pct) : 'var(--text-muted)',
                    weight: 2,
                  }}
                >
                  <Tooltip permanent direction="center" className="!bg-transparent !border-0 !shadow-none">
                    <span className="text-[10px] font-bold" style={{ color: 'var(--text-primary)' }}>
                      {z.name} {z.pct != null ? `(${z.pct}%)` : ''}
                    </span>
                  </Tooltip>
                </Circle>
              ))}
              {withPosition.map((v) => (
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
                <span className="text-(--text-secondary)">Sectors below {slaTarget}min SLA</span>
                <span className="font-mono font-bold">
                  {loading ? '…' : sectorZones.filter((z) => z.pct != null && z.pct < 65).length} / {sectorZones.length}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-(--text-secondary)">Categories below target</span>
                <span className="font-mono font-bold">{loading ? '…' : atRisk}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-(--text-secondary)">Overall fleet availability</span>
                <span className="font-mono font-bold">{loading ? '…' : (overall != null ? `${overall}%` : 'N/A')}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-(--text-secondary)">Units with GPS position</span>
                <span className="font-mono font-bold">{loading ? '…' : withPosition.length}</span>
              </div>
            </div>
          </div>

          <div className="dispatcher-surface p-4">
            <h2 className="text-[13px] font-bold m-0 mb-3">Fleet Availability by Category</h2>
            {loading ? (
              <p className="text-[12px] text-(--text-muted) m-0">Loading…</p>
            ) : categories.length === 0 ? (
              <p className="text-[12px] text-(--text-muted) m-0">No vehicles registered in your district.</p>
            ) : (
              <div className="flex flex-col gap-2">
                {categories.map((c) => (
                  <div key={c.name} className="flex items-center justify-between gap-2 text-[13px]">
                    <span className="text-(--text-secondary)">{c.name}</span>
                    <span
                      className="font-mono font-bold"
                      style={{ color: c.pct < TARGET_AVAILABILITY ? 'var(--status-critical)' : 'var(--status-low)' }}
                    >
                      {c.available}/{c.total} ({c.pct}%)
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

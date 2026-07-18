import { useEffect, useState } from 'react'
import { MapContainer, TileLayer, CircleMarker, Circle, Tooltip } from 'react-leaflet'
import L from 'leaflet'
import { Megaphone, CloudRain } from 'lucide-react'
import OpsManagerDistrictLabel from '../../components/ops-manager/OpsManagerDistrictLabel'
import { useThemeStore } from '../../store/themeStore'
import RwandaBoundsEnforcer from '../../components/map/RwandaBoundsEnforcer'
import MapFitBounds from '../../components/map/MapFitBounds'
import { RWANDA_CENTER, RWANDA_BOUNDS, RWANDA_MIN_ZOOM, RWANDA_MAX_ZOOM } from '../../components/map/rwandaConstants'
import { getCurrentUser } from '../../utils/authSession'
import { createBroadcast } from '../../api/broadcasts'
import { listIncidents } from '../../api/incidents'
import { listVehicles } from '../../api/vehicles'
import { getWeather } from '../../api/planning'
import { formatIncidentType } from '../../utils/incidentTypeLabels'
import 'leaflet/dist/leaflet.css'

const HAZARD_COLORS = {
  CLEAR: 'var(--text-secondary)',
  MODERATE: 'var(--status-medium)',
  HAZARDOUS: 'var(--status-critical)',
}

// Only "Incidents" and "All Units" ever actually rendered anything —
// "Coverage Rings" too, but "Traffic" and "Agency Units" were toggles that
// controlled nothing (no traffic layer or agency-only filter existed
// anywhere in this file), so flipping them did nothing. Dropped both rather
// than ship dead controls.
const LAYERS = ['All Units', 'Incidents', 'Coverage Rings']

// A RECEIVED incident is just a logged call — no units dispatched yet, so
// there's nothing for an Ops Manager to monitor "getting on scene." Per the
// real workflow, an incident only becomes something the Ops Manager tracks
// once the dispatcher has actually dispatched a unit to it. Explicit
// allowlist (not "not terminal") so any unexpected/blank status is excluded
// by default instead of silently treated as active.
const ACTIVE_STATUSES = new Set(['DISPATCHED', 'EN_ROUTE', 'ON_SCENE'])

const SEVERITY_COLORS = {
  critical: 'var(--status-critical)',
  high: 'var(--status-high)',
  medium: 'var(--status-medium)',
  low: 'var(--status-low)',
}

// Deliberately NOT reusing the severity palette (red/orange/amber/green) —
// fire units in status-critical red were visually identical to critical
// incidents, and police units in status-medium amber were identical to
// medium-severity incidents, making it impossible to tell "a unit is here"
// from "an incident is here" at a glance. Units get their own distinct hues.
const UNIT_TYPE_COLORS = {
  medical: '#2196C8', // blue
  fire: '#7C3AED',    // violet
  police: '#0E7C86',  // teal
}

function unitColorKey(vehicleType) {
  const t = (vehicleType ?? '').toUpperCase()
  if (t.includes('AMBULANCE')) return 'medical'
  if (t.includes('FIRE') || t.includes('DISASTER')) return 'fire'
  if (t.includes('POLICE') || t.includes('TACTICAL')) return 'police'
  return 'medical'
}

export default function OpsManagerMap() {
  const { theme } = useThemeStore()
  const [incidents, setIncidents] = useState([])
  const [units, setUnits] = useState([])
  const [weather, setWeather] = useState(null)
  const districtId = getCurrentUser()?.district_id
  const omDistrict = getCurrentUser()?.district_name

  useEffect(() => {
    if (!districtId) return
    listIncidents({ districtId })
      // Only incidents actually still in progress — a closed/resolved
      // incident has no business showing a live pin on an operational map.
      .then((all) => setIncidents(all.filter((i) => ACTIVE_STATUSES.has(i.status))))
      .catch(() => {})
    listVehicles({ districtId }).then(setUnits).catch(() => {})
  }, [districtId])

  useEffect(() => {
    if (!omDistrict) return
    getWeather()
      .then((all) => setWeather(all.find((w) => w.district_name === omDistrict) ?? null))
      .catch(() => setWeather(null))
  }, [omDistrict])

  const [layers, setLayers] = useState({
    'All Units': true,
    Incidents: true,
    'Coverage Rings': false,
  })
  const [broadcastOpen, setBroadcastOpen] = useState(false)
  const [broadcastMsg, setBroadcastMsg] = useState('')
  const [broadcastPriority, setBroadcastPriority] = useState('NORMAL')

  const toggleLayer = (name) => {
    setLayers((prev) => ({ ...prev, [name]: !prev[name] }))
  }

  const [broadcastSending, setBroadcastSending] = useState(false)
  const [broadcastError, setBroadcastError] = useState(null)

  const handleBroadcast = async () => {
    if (!broadcastMsg.trim()) return
    setBroadcastSending(true)
    setBroadcastError(null)
    try {
      // Real persisted broadcast, scoped to this ops manager's own district
      // by name — previously this only ever pushed into a local, in-memory
      // mock array and fired a notification visible on the sender's own
      // screen only, so nothing was actually delivered to anyone.
      await createBroadcast({
        message: broadcastMsg,
        priority: broadcastPriority,
        target_area: getCurrentUser()?.district_name ?? 'ALL_UNITS',
      })
      setBroadcastMsg('')
      setBroadcastPriority('NORMAL')
      setBroadcastOpen(false)
    } catch {
      setBroadcastError('Could not send broadcast — check your connection and try again.')
    } finally {
      setBroadcastSending(false)
    }
  }

  const unitsWithPos = units.filter((u) => u.current_lat != null && u.current_lng != null)
  const incidentsWithPos = incidents.filter((inc) => inc.lat != null && inc.lng != null)
  const standbyUnits = unitsWithPos.filter((u) => u.status === 'available')

  // Every real point this district actually has — station locations too, so
  // the view stays anchored to the district even when every vehicle is
  // sitting idle at its station with no live GPS fix yet.
  const districtPoints = [
    ...incidentsWithPos.map((i) => [i.lat, i.lng]),
    ...unitsWithPos.map((u) => [u.current_lat, u.current_lng]),
    ...units.filter((u) => u.station_lat != null && u.station_lng != null).map((u) => [u.station_lat, u.station_lng]),
  ]

  // Restrict panning/zooming to this district's own real footprint (padded
  // 40%) instead of the whole country — previously every ops manager saw
  // the same Rwanda-wide map regardless of which district they run.
  const districtBounds = districtPoints.length
    ? L.latLngBounds(districtPoints).pad(0.4)
    : null

  return (
    <div className="flex flex-col h-full min-h-[calc(100vh-56px)]">
      <div className="shrink-0 px-4 pt-4 pb-2 border-b border-(--border) bg-(--bg-surface)">
        <h1 className="dispatcher-page-title m-0">Live Operational Map</h1>
        <OpsManagerDistrictLabel />
      </div>
      <div className="shrink-0 px-4 py-3 border-b border-(--border) bg-(--bg-surface) flex flex-wrap items-center gap-3 justify-between">
        <div className="flex flex-wrap gap-2 items-center">
          <span
            className="inline-flex items-center shrink-0"
            style={{
              background: 'var(--accent-ghost)',
              border: '1px solid var(--accent)',
              color: 'var(--accent)',
              borderRadius: '6px',
              padding: '0.25rem 0.65rem',
              fontSize: '11px',
              fontWeight: 600,
            }}
          >
            📍 {omDistrict ?? 'Your'} District
          </span>
          {weather && !weather.stale && (
            <span
              className="inline-flex items-center gap-1.5 shrink-0"
              style={{
                background: 'var(--bg-input)',
                border: `1px solid ${HAZARD_COLORS[weather.hazard_level] ?? 'var(--border)'}`,
                color: HAZARD_COLORS[weather.hazard_level] ?? 'var(--text-secondary)',
                borderRadius: '6px',
                padding: '0.25rem 0.65rem',
                fontSize: '11px',
                fontWeight: 600,
              }}
              title={`Real live weather (OpenWeatherMap): ${weather.description}`}
            >
              <CloudRain size={12} />
              {weather.temperature_c != null ? `${Math.round(weather.temperature_c)}°C · ` : ''}{weather.description}
            </span>
          )}
          {LAYERS.map((name) => (
            <button
              key={name}
              type="button"
              className="text-[11px] font-semibold px-3 py-1.5 rounded-full border cursor-pointer transition-colors"
              style={{
                fontFamily: 'var(--font-display)',
                background: layers[name] ? 'var(--accent-ghost)' : 'var(--bg-input)',
                borderColor: layers[name] ? 'var(--accent)' : 'var(--border)',
                color: layers[name] ? 'var(--accent)' : 'var(--text-secondary)',
              }}
              onClick={() => toggleLayer(name)}
            >
              {name}
            </button>
          ))}
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-[11px] font-mono px-2.5 py-1 rounded bg-(--bg-input) border border-(--border) text-(--text-secondary)">
            {units.length} units
          </span>
          <span className="text-[11px] font-mono px-2.5 py-1 rounded bg-(--bg-input) border border-(--border) text-(--text-secondary)">
            {incidents.length} active incidents
          </span>
          <button
            type="button"
            className="dispatcher-btn-outline text-[12px] flex items-center gap-1.5"
            onClick={() => setBroadcastOpen((v) => !v)}
          >
            <Megaphone size={14} />
            Broadcast to Area
          </button>
        </div>
      </div>

      {weather?.hazard_level === 'HAZARDOUS' && !weather.stale && (
        <div
          className="shrink-0 px-4 py-2 text-[12px] font-semibold flex items-center gap-2"
          style={{ background: 'var(--status-critical-bg)', color: 'var(--status-critical)' }}
        >
          <CloudRain size={14} />
          Hazardous weather in {omDistrict}: {weather.description} — consider factoring this into dispatch and field-responder routing decisions.
        </div>
      )}

      {broadcastOpen && (
        <div className="shrink-0 px-4 py-3 border-b border-(--border) bg-(--bg-surface) flex flex-wrap gap-3 items-end">
          <label className="dispatcher-field min-w-[120px]">
            <span className="field-label">Priority</span>
            <select
              className="dispatcher-input dispatcher-select"
              value={broadcastPriority}
              onChange={(e) => setBroadcastPriority(e.target.value)}
            >
              <option value="NORMAL">Normal</option>
              <option value="URGENT">Urgent</option>
              <option value="EMERGENCY">Emergency</option>
            </select>
          </label>
          <label className="dispatcher-field flex-1 min-w-[200px]">
            <span className="field-label">Message</span>
            <input
              className="dispatcher-input dispatcher-text-input"
              placeholder="Broadcast message…"
              value={broadcastMsg}
              onChange={(e) => setBroadcastMsg(e.target.value)}
            />
          </label>
          {broadcastError && (
            <p className="text-[12px] m-0 w-full" style={{ color: 'var(--status-critical)' }}>{broadcastError}</p>
          )}
          <button
            type="button"
            className="dispatcher-btn-primary text-[12px] shrink-0"
            onClick={handleBroadcast}
            disabled={!broadcastMsg.trim() || broadcastSending}
          >
            {broadcastSending ? 'Sending…' : 'Send'}
          </button>
          <button
            type="button"
            className="dispatcher-btn-ghost text-[12px] shrink-0"
            onClick={() => setBroadcastOpen(false)}
          >
            Cancel
          </button>
        </div>
      )}

      <div className="flex-1 min-h-[480px] relative">
        <MapContainer
          center={RWANDA_CENTER}
          zoom={12}
          minZoom={RWANDA_MIN_ZOOM}
          maxZoom={RWANDA_MAX_ZOOM}
          maxBounds={districtBounds ?? RWANDA_BOUNDS}
          maxBoundsViscosity={1}
          style={{ width: '100%', height: '100%', background: 'var(--bg-base)' }}
        >
          <TileLayer
            url={
              theme === 'dark'
                ? 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png'
                : 'https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png'
            }
            attribution="&copy; CARTO"
          />
          <RwandaBoundsEnforcer />
          <MapFitBounds points={districtPoints} />

          {layers.Incidents && incidentsWithPos.map((inc) => {
            const sev = (inc.severity ?? inc.final_severity ?? 'medium').toLowerCase()
            const color = SEVERITY_COLORS[sev] ?? SEVERITY_COLORS.medium
            return (
              <CircleMarker
                key={inc.incident_id}
                center={[inc.lat, inc.lng]}
                radius={9}
                pathOptions={{
                  color: 'var(--bg-surface)',
                  fillColor: color,
                  fillOpacity: 0.95,
                  weight: 2,
                }}
              >
                <Tooltip>
                  <strong>{inc.incident_ref}</strong> — {formatIncidentType(inc.incident_type)}
                  <br />
                  {sev.toUpperCase()} · {inc.address ?? inc.district ?? ''}
                </Tooltip>
              </CircleMarker>
            )
          })}

          {layers['All Units'] && unitsWithPos.map((u) => {
            const colorKey = unitColorKey(u.vehicle_type)
            const color = UNIT_TYPE_COLORS[colorKey]
            const onScene = u.status === 'on_scene'
            return (
              <CircleMarker
                key={u.vehicle_id}
                center={[u.current_lat, u.current_lng]}
                radius={onScene ? 8 : 6}
                pathOptions={{
                  color: 'var(--bg-surface)',
                  fillColor: color,
                  fillOpacity: onScene ? 1 : 0.85,
                  weight: onScene ? 3 : 1.5,
                }}
              >
                <Tooltip>
                  <strong>{u.plate_number}</strong> · {u.vehicle_type}
                  <br />
                  {(u.status ?? '').toUpperCase()}
                </Tooltip>
              </CircleMarker>
            )
          })}

          {layers['Coverage Rings'] && standbyUnits.map((u) => (
            <Circle
              key={`ring-${u.vehicle_id}`}
              center={[u.current_lat, u.current_lng]}
              radius={1200}
              pathOptions={{
                color: 'var(--accent)',
                fillColor: 'var(--accent)',
                fillOpacity: 0.08,
                weight: 1,
                dashArray: '4 6',
              }}
            />
          ))}
        </MapContainer>

        <div className="absolute top-3 left-3 z-[1000] p-3 rounded-lg border border-(--border) bg-(--bg-surface) max-w-[220px] text-[11px]">
          <div className="font-bold uppercase tracking-wide text-(--text-secondary) mb-2" style={{ fontSize: '10px' }}>
            Map legend
          </div>
          <div className="font-semibold text-(--text-secondary) mb-1">Incidents</div>
          {Object.entries(SEVERITY_COLORS).map(([label, color]) => (
            <div key={label} className="flex items-center gap-2 text-(--text-secondary) mb-1">
              <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ background: color }} />
              {label.charAt(0).toUpperCase() + label.slice(1)}
            </div>
          ))}
          <div className="font-semibold text-(--text-secondary) mt-2 mb-1">Units</div>
          <div className="flex items-center gap-2 text-(--text-secondary) mb-1">
            <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ background: UNIT_TYPE_COLORS.medical }} />
            Ambulance
          </div>
          <div className="flex items-center gap-2 text-(--text-secondary) mb-1">
            <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ background: UNIT_TYPE_COLORS.fire }} />
            Fire & Rescue
          </div>
          <div className="flex items-center gap-2 text-(--text-secondary) mb-1">
            <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ background: UNIT_TYPE_COLORS.police }} />
            Police
          </div>
          <div className="flex items-center gap-2 text-(--text-secondary)">
            <span className="w-2.5 h-2.5 rounded-full shrink-0 border-2" style={{ borderColor: 'var(--text-secondary)', background: 'transparent' }} />
            Bold ring = on scene
          </div>
        </div>
      </div>
    </div>
  )
}

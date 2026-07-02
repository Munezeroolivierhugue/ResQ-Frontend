import { useMemo, useState, useRef, useEffect } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { MapContainer, TileLayer, CircleMarker, Circle, Marker, Tooltip } from 'react-leaflet'
import L from 'leaflet'
import {
  MapPin,
  AlertTriangle,
  Send,
  Ambulance,
  Truck,
  ShieldCheck,
  Radio,
  Mic,
  Play,
  Square,
  CheckCircle,
} from 'lucide-react'
import FieldLabel from '../../components/ui/FieldLabel'
import RwandaBoundsEnforcer from '../../components/map/RwandaBoundsEnforcer'
import MapFitBounds from '../../components/map/MapFitBounds'
import { RWANDA_BOUNDS, RWANDA_MIN_ZOOM, RWANDA_MAX_ZOOM } from '../../components/map/rwandaConstants'
import { useNotificationsStore } from '../../store/notificationsStore'
import { listIncidents, getIncident, updateIncidentStatus } from '../../api/incidents'
import { listDispatchesForIncident } from '../../api/dispatches'
import { listVehicles } from '../../api/vehicles'
import { requestBackup } from '../../api/backup-requests'
import 'leaflet/dist/leaflet.css'

const MAP_TILES =
  'https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png'

/** Persists the active incident_id across navigation so data survives sidebar clicks */
const ACTIVE_INCIDENT_KEY = 'resq-active-incident-id'
/** Persists the dispatched units so they survive navigation even when not in DB (mock vehicle IDs) */
const ACTIVE_UNITS_KEY = 'resq-active-units'

function saveUnitsToStorage(units) {
  if (!units || units.length === 0) return
  try { sessionStorage.setItem(ACTIVE_UNITS_KEY, JSON.stringify(units)) } catch {}
}

function loadUnitsFromStorage() {
  try { return JSON.parse(sessionStorage.getItem(ACTIVE_UNITS_KEY) ?? 'null') ?? [] } catch { return [] }
}

const UNIT_COLORS = {
  fire: 'var(--status-critical)',
  medical: 'var(--status-info)',
  police: 'var(--status-medium)',
  dispatch: 'var(--accent)',
}

const MARKER_HEX = {
  critical: '#E8354A',
  fire: '#E8354A',
  medical: '#2196C8',
  police: '#D4A017',
}

const ACTIVE_STATUSES = ['DISPATCHED', 'EN_ROUTE', 'ON_SCENE', 'active', 'pending', 'RECEIVED']

function fmtDuration(s) {
  const m = Math.floor(s / 60)
  const sec = s % 60
  return `${m}:${String(sec).padStart(2, '0')}`
}

function colorKeyFromType(vehicleType) {
  const t = (vehicleType ?? '').toUpperCase()
  if (t.includes('AMBULANCE')) return 'medical'
  if (t.includes('FIRE') || t.includes('DISASTER')) return 'fire'
  if (t.includes('POLICE') || t.includes('TACTICAL')) return 'police'
  return 'medical'
}

/**
 * Build a unit record from a navState team member (comes from dispatch recommendations).
 * Uses the real lat/lng stored in the recommendation — no random offsets.
 */
function teamMemberToUnit(u) {
  const vType = u.type ?? u.vehicle_type ?? 'Emergency Unit'
  return {
    id: u.unit ?? u.vehicle_plate ?? u.vehicle_id,
    vehicle_id: u.vehicle_id,
    vehicle_type: vType,
    role: vType,
    colorKey: colorKeyFromType(vType),
    statusLabel: 'En Route',
    status: 'enroute',
    eta: u.eta ?? (u.eta_minutes != null ? `${u.eta_minutes} min` : null),
    current_lat: u.lat ?? u.current_lat ?? null,
    current_lng: u.lng ?? u.current_lng ?? null,
    accuracy: (u.lat || u.current_lat) ? 'GPS' : '—',
  }
}

/**
 * Enrich dispatch records with live vehicle data (vehicle_type, GPS position, status).
 * Replaces the old dispatchesToUnits that used Math.random() for positions.
 */
function buildUnitsFromDispatches(dispatches, vehicles) {
  const vehicleMap = new Map(vehicles.map((v) => [v.vehicle_id, v]))
  return dispatches.map((d) => {
    const v = vehicleMap.get(d.vehicle_id) ?? {}
    const vType = v.vehicle_type ?? 'Emergency Unit'
    return {
      id: d.vehicle_plate ?? v.plate_number ?? d.vehicle_id,
      vehicle_id: d.vehicle_id,
      vehicle_type: vType,
      role: d.responder_name ?? 'Responder',
      colorKey: colorKeyFromType(vType),
      statusLabel: 'En Route',
      status: 'enroute',
      eta: d.eta_minutes != null ? `${d.eta_minutes} min` : null,
      current_lat: v.current_lat ?? null,
      current_lng: v.current_lng ?? null,
      accuracy: v.current_lat ? 'GPS' : '—',
    }
  })
}

function unitMarkerIcon(unit) {
  const hex = MARKER_HEX[unit.colorKey] || MARKER_HEX.medical
  return L.divIcon({
    html: `<div class="active-unit-marker" style="--unit-color:${hex}">
      <span class="active-unit-marker-dot"></span>
      <span class="active-unit-marker-label">${unit.id}</span>
    </div>`,
    className: '',
    iconAnchor: [28, 14],
  })
}

function UnitTypeIcon({ type, color }) {
  const p = { size: 16, strokeWidth: 1.8, color }
  if (type === 'Ambulance') return <Ambulance {...p} />
  if (type === 'Fire Truck') return <Truck {...p} />
  if (type === 'Police') return <ShieldCheck {...p} />
  return <Truck {...p} />
}

function StatusBadge({ label, color }) {
  return (
    <span
      className="text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 rounded"
      style={{
        background: `color-mix(in srgb, ${color} 18%, transparent)`,
        color,
        border: `1px solid color-mix(in srgb, ${color} 35%, transparent)`,
        fontFamily: 'var(--font-display)',
      }}
    >
      {label}
    </span>
  )
}

function elapsedDisplay(callTime) {
  if (!callTime) return '—'
  const mins = Math.floor((Date.now() - new Date(callTime).getTime()) / 60000)
  if (mins < 60) return `${mins}m`
  return `${Math.floor(mins / 60)}h ${mins % 60}m`
}

export default function ActiveIncident() {
  const navigate = useNavigate()
  const { state: navState } = useLocation()
  const [message, setMessage] = useState('')
  const [comms, setComms] = useState([])
  const [sceneComplete, setSceneComplete] = useState(false)
  const [incident, setIncident] = useState(null)
  const [units, setUnits] = useState([])
  const [, setElapsedTick] = useState(0)
  const addNotification = useNotificationsStore((state) => state.addNotification)

  const navTeam = navState?.dispatchedTeam ?? (navState?.dispatchedUnit ? [navState.dispatchedUnit] : [])

  useEffect(() => {
    // 1. Resolve incident_id: navState wins, then sessionStorage fallback
    const navIncidentId = navState?.incident_id ?? navState?.incident?.incident_id
    const storedId = sessionStorage.getItem(ACTIVE_INCIDENT_KEY)
    const incidentId = navIncidentId ?? storedId

    if (incidentId) {
      // Persist so navigation away and back still finds the incident
      sessionStorage.setItem(ACTIVE_INCIDENT_KEY, incidentId)

      // Seed UI immediately from navState if available to avoid blank flash
      if (navState?.incident) {
        setIncident({ ...navState.incident, status: 'DISPATCHED' })
      }
      if (navTeam.length > 0) {
        setUnits(navTeam.map(teamMemberToUnit).filter((u) => u.current_lat != null))
      }

      // Fetch fresh data from DB: incident + dispatches + all vehicles (for GPS/type enrichment)
      Promise.all([
        getIncident(incidentId),
        listDispatchesForIncident(incidentId),
        listVehicles(),
      ])
        .then(([inc, dispatches, vehicles]) => {
          setIncident(inc)
          if (dispatches.length > 0) {
            const enriched = buildUnitsFromDispatches(dispatches, vehicles)
            setUnits(enriched)
            saveUnitsToStorage(enriched)
          } else if (navTeam.length > 0) {
            // Dispatches not yet in DB — enrich nav team with real vehicle GPS
            const vehicleMap = new Map(vehicles.map((v) => [v.vehicle_id, v]))
            const enriched = navTeam.map((u) => {
              const vData = vehicleMap.get(u.vehicle_id) ?? {}
              return {
                ...teamMemberToUnit(u),
                current_lat: vData.current_lat ?? u.lat ?? u.current_lat ?? null,
                current_lng: vData.current_lng ?? u.lng ?? u.current_lng ?? null,
                accuracy: vData.current_lat ? 'GPS' : (u.lat ? 'Recommended' : '—'),
              }
            }).filter((u) => u.current_lat != null)
            setUnits(enriched)
            saveUnitsToStorage(enriched)
          } else {
            // No dispatches in DB and no navTeam (returning via sidebar) — use last known units
            const stored = loadUnitsFromStorage()
            if (stored.length > 0) setUnits(stored)
          }
        })
        .catch(() => {
          // If API fails, try stored units so the page isn't blank
          const stored = loadUnitsFromStorage()
          if (stored.length > 0) setUnits(stored)
        })
      return
    }

    // 2. No incident_id anywhere — fetch the latest active incident from DB
    listIncidents()
      .then((incs) => {
        const active = incs.find((i) => ACTIVE_STATUSES.includes(i.status)) ?? null
        if (!active) return
        sessionStorage.setItem(ACTIVE_INCIDENT_KEY, active.incident_id)
        setIncident(active)
        return Promise.all([
          listDispatchesForIncident(active.incident_id),
          listVehicles(),
        ]).then(([dispatches, vehicles]) => {
          if (dispatches.length > 0) {
            const enriched = buildUnitsFromDispatches(dispatches, vehicles)
            setUnits(enriched)
            saveUnitsToStorage(enriched)
          } else {
            const stored = loadUnitsFromStorage()
            if (stored.length > 0) setUnits(stored)
          }
        })
      })
      .catch(() => {})
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  // Live elapsed time — re-renders every second so the display keeps ticking
  useEffect(() => {
    const t = setInterval(() => setElapsedTick((v) => v + 1), 1000)
    return () => clearInterval(t)
  }, [])

  // 'idle' | 'sending' | 'sent' | 'error'
  const [escalation, setEscalation] = useState('idle')

  const handleEscalate = async () => {
    if (!incident?.incident_id || escalation === 'sending' || escalation === 'sent') return
    setEscalation('sending')
    try {
      await requestBackup({
        incidentId: incident.incident_id,
        reason: 'ESCALATION',
        notes: `Escalated to operations manager by dispatcher — ${incident.incident_ref ?? incident.incident_id}`,
      })
      setEscalation('sent')
      addNotification({
        id: `escalation-${Date.now()}`,
        type: 'escalation',
        title: `Escalated — ${incident.incident_ref ?? ''}`,
        message: 'Operations manager has been alerted for this incident.',
        time: new Date().toISOString(),
        read: false,
        target_role: 'dispatcher',
      })
    } catch {
      setEscalation('error')
    }
  }

  const handleSceneComplete = () => {
    setSceneComplete(true)
    // Clear all session data related to this incident and its intake form
    try {
      const stored = JSON.parse(sessionStorage.getItem('resq-active-call') ?? 'null')
      if (stored?.callId) sessionStorage.removeItem(`resq-intake-${stored.callId}`)
    } catch {}
    sessionStorage.removeItem('resq-active-call')
    sessionStorage.removeItem(ACTIVE_INCIDENT_KEY)
    sessionStorage.removeItem(ACTIVE_UNITS_KEY)
    // Mark incident as awaiting report in the DB (fire-and-forget; PendingReports is seeded via navState regardless)
    if (incident?.incident_id) {
      updateIncidentStatus(incident.incident_id, 'PENDING_REPORT').catch(() => {})
    }
    addNotification({
      id: `scene-complete-${Date.now()}`,
      type: 'scene_complete',
      title: `Scene complete — ${incident?.incident_ref ?? ''}`,
      message: `Units released. Field report required for ${incident?.incident_type ?? 'incident'}.`,
      time: new Date().toISOString(),
      read: false,
      target_role: 'dispatcher',
    })
    setTimeout(() => navigate('/dispatcher/pending-reports', {
      state: { completedIncident: incident },
    }), 1800)
  }

  // Voice recording state
  const [pttActive, setPttActive] = useState(false)
  const [pttSeconds, setPttSeconds] = useState(0)
  const pttRef = useRef(null)

  // Audio playback state
  const [playingId, setPlayingId] = useState(null)
  const [playProgress, setPlayProgress] = useState({})
  const playRef = useRef(null)

  useEffect(() => () => {
    clearInterval(pttRef.current)
    clearInterval(playRef.current)
  }, [])

  const startPtt = () => {
    setPttActive(true)
    setPttSeconds(0)
    pttRef.current = setInterval(() => setPttSeconds((s) => s + 1), 1000)
  }

  const stopPtt = () => {
    clearInterval(pttRef.current)
    setPttActive(false)
    if (pttSeconds > 0) {
      const now = new Date().toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })
      setComms((prev) => [
        ...prev,
        {
          id: `ac-new-${Date.now()}`,
          type: 'voice',
          from: 'DISPATCH',
          role: 'dispatch',
          time: now,
          durationS: pttSeconds,
          label: 'Voice message sent to field units',
          isSelf: true,
        },
      ])
    }
    setPttSeconds(0)
  }

  const togglePlay = (clip) => {
    if (playingId === clip.id) {
      clearInterval(playRef.current)
      setPlayingId(null)
      setPlayProgress((p) => ({ ...p, [clip.id]: 0 }))
      return
    }
    setPlayingId(clip.id)
    setPlayProgress((p) => ({ ...p, [clip.id]: 0 }))
    playRef.current = setInterval(() => {
      setPlayProgress((p) => {
        const next = (p[clip.id] || 0) + 0.1
        if (next >= clip.durationS) {
          clearInterval(playRef.current)
          setPlayingId(null)
          return { ...p, [clip.id]: clip.durationS }
        }
        return { ...p, [clip.id]: next }
      })
    }, 100)
  }

  const incLat = incident?.lat ?? -1.9441
  const incLng = incident?.lng ?? 30.0619

  const unitsWithPos = units.filter((u) => u.current_lat != null && u.current_lng != null)

  const mapPoints = useMemo(
    () => [
      [incLat, incLng],
      ...unitsWithPos.map((u) => [u.current_lat, u.current_lng]),
    ],
    [incLat, incLng, unitsWithPos],
  )

  const incidentCenter = [incLat, incLng]

  const mapLegend = useMemo(
    () => [
      { color: MARKER_HEX.critical, label: `${incident?.incident_ref ?? 'Incident'} · active` },
      { color: MARKER_HEX.medical, label: 'Dispatched units' },
      { color: MARKER_HEX.critical, label: 'Hot zone', ring: true },
      { color: MARKER_HEX.police, label: 'Safety line', dashed: true },
    ],
    [incident],
  )

  const handleSend = (e) => {
    e.preventDefault()
    if (!message.trim()) return
    setComms((prev) => [
      ...prev,
      {
        id: prev.length + 1,
        from: 'DISPATCH',
        role: 'dispatch',
        time: new Date().toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' }),
        text: message.trim(),
        isSelf: true,
        type: 'text',
      },
    ])
    setMessage('')
  }

  const sev = incident?.severity ?? 'medium'

  return (
    <div className="flex flex-col h-full min-h-0 bg-(--bg-base) overflow-hidden relative">
      {sceneComplete && (
        <div className="absolute inset-x-0 top-0 z-[2000] flex justify-center pt-4 pointer-events-none">
          <div
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl border text-[13px] font-semibold"
            style={{
              background: 'var(--status-low-bg)',
              color: 'var(--status-low)',
              borderColor: 'var(--status-low)',
              fontFamily: 'var(--font-display)',
            }}
          >
            <CheckCircle size={15} />
            Scene marked complete — redirecting to Pending Reports…
          </div>
        </div>
      )}
      <header className="shrink-0 px-5 md:px-6 py-4 border-b border-(--border) bg-(--bg-surface)">
        <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4">
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2 mb-2">
              <span
                className="text-[10px] font-bold uppercase tracking-[0.1em] px-2.5 py-1 rounded"
                style={{
                  background: 'var(--status-critical-bg)',
                  color: 'var(--status-critical)',
                  fontFamily: 'var(--font-display)',
                }}
              >
                {sev.charAt(0).toUpperCase() + sev.slice(1)}
              </span>
              <span className="text-[12px] font-bold text-(--accent)" style={{ fontFamily: 'var(--font-mono)' }}>
                {incident?.incident_ref ?? '—'}
              </span>
            </div>
            <h1
              className="text-xl md:text-2xl font-bold text-(--text-primary) m-0 leading-tight"
              style={{ fontFamily: 'var(--font-display)' }}
            >
              {incident?.incident_type ?? 'Active Incident'}
            </h1>
            <p className="flex items-center gap-1.5 text-[13px] text-(--text-secondary) mt-2 m-0">
              <MapPin size={14} className="text-(--accent) shrink-0" />
              {incident?.address ?? incident?.district ?? '—'}
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3 shrink-0">
            <div className="text-right px-4 py-2 rounded-lg border border-(--border) bg-(--bg-input)">
              <FieldLabel>Elapsed time</FieldLabel>
              <div
                className="text-2xl font-bold text-(--accent) tabular-nums"
                style={{ fontFamily: 'var(--font-mono)' }}
              >
                {elapsedDisplay(incident?.call_time)}
              </div>
            </div>
            <button
              type="button"
              onClick={handleEscalate}
              disabled={escalation === 'sending' || escalation === 'sent'}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg border-none cursor-pointer text-[11px] font-bold uppercase tracking-wide disabled:cursor-not-allowed"
              style={{
                background: escalation === 'sent' ? 'var(--status-low)' : 'var(--status-critical)',
                color: '#fff',
                opacity: escalation === 'sending' ? 0.6 : 1,
                fontFamily: 'var(--font-display)',
              }}
            >
              {escalation === 'sent' ? <CheckCircle size={16} /> : <AlertTriangle size={16} />}
              {escalation === 'sent' ? 'Escalated — ops manager alerted'
                : escalation === 'sending' ? 'Escalating…'
                : escalation === 'error' ? 'Escalation failed — retry'
                : 'Escalate to operations manager'}
            </button>
            <button
              type="button"
              disabled={sceneComplete}
              onClick={handleSceneComplete}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg border-none cursor-pointer text-[11px] font-bold uppercase tracking-wide disabled:opacity-50 disabled:cursor-not-allowed"
              style={{
                background: 'var(--status-medium)',
                color: '#fff',
                fontFamily: 'var(--font-display)',
              }}
            >
              <CheckCircle size={16} />
              Mark Scene Complete
            </button>
          </div>
        </div>
      </header>

      {/* Main: map | units | comms — single row, fills remaining height */}
      <div className="flex-1 min-h-0 flex flex-col lg:flex-row overflow-hidden">
        {/* Map */}
        <div className="flex-1 min-h-[280px] lg:min-h-0 relative border-b lg:border-b-0 lg:border-r border-(--border) map-natural">
          <MapContainer
            center={incidentCenter}
            zoom={15}
            minZoom={RWANDA_MIN_ZOOM}
            maxZoom={RWANDA_MAX_ZOOM}
            maxBounds={RWANDA_BOUNDS}
            maxBoundsViscosity={1.0}
            style={{ width: '100%', height: '100%', background: '#E8EAED' }}
            zoomControl
          >
            <TileLayer
              url={MAP_TILES}
              attribution='&copy; <a href="https://carto.com/">CARTO</a> &copy; <a href="https://www.openstreetmap.org/">OSM</a>'
            />
            <RwandaBoundsEnforcer />
            <MapFitBounds points={mapPoints} />

            <Circle
              center={incidentCenter}
              radius={300}
              pathOptions={{
                color: MARKER_HEX.police,
                fillColor: MARKER_HEX.police,
                fillOpacity: 0.06,
                weight: 2,
                dashArray: '6 4',
              }}
            />
            <Circle
              center={incidentCenter}
              radius={100}
              pathOptions={{
                color: MARKER_HEX.critical,
                fillColor: MARKER_HEX.critical,
                fillOpacity: 0.12,
                weight: 2,
              }}
            />

            <CircleMarker
              center={incidentCenter}
              radius={12}
              pathOptions={{
                color: '#fff',
                fillColor: MARKER_HEX.critical,
                fillOpacity: 1,
                weight: 3,
              }}
            >
              <Tooltip direction="top" offset={[0, -14]}>
                <strong>{incident?.incident_ref ?? '—'}</strong> — {incident?.incident_type ?? ''}
                <br />
                {incident?.address ?? incident?.district ?? ''}
                <br />
                <span style={{ fontFamily: 'monospace' }}>
                  {incLat.toFixed(4)}, {incLng.toFixed(4)}
                </span>
              </Tooltip>
            </CircleMarker>

            {unitsWithPos.map((unit) => (
              <CircleMarker
                key={`ring-${unit.id}`}
                center={[unit.current_lat, unit.current_lng]}
                radius={14}
                pathOptions={{
                  color: MARKER_HEX[unit.colorKey],
                  fillColor: 'transparent',
                  fillOpacity: 0,
                  weight: 2,
                  opacity: 0.45,
                }}
              />
            ))}

            {unitsWithPos.map((unit) => (
              <Marker
                key={unit.id}
                position={[unit.current_lat, unit.current_lng]}
                icon={unitMarkerIcon(unit)}
              >
                <Tooltip direction="top" offset={[0, -18]}>
                  <strong>{unit.id}</strong> — {unit.vehicle_type}
                  <br />
                  {unit.role}
                  <br />
                  <strong>{unit.statusLabel}</strong>
                  {unit.eta ? ` · ETA ${unit.eta}` : ''}
                  <br />
                  <span style={{ fontFamily: 'monospace' }}>
                    {unit.current_lat.toFixed(4)}, {unit.current_lng.toFixed(4)} ({unit.accuracy})
                  </span>
                </Tooltip>
              </Marker>
            ))}
          </MapContainer>

          <div className="absolute top-3 left-3 z-[1000] p-3 rounded-lg border border-(--border) bg-(--bg-surface) max-w-[220px]">
            <FieldLabel className="mb-2">Map legend</FieldLabel>
            {mapLegend.map((l) => (
              <div key={l.label} className="flex items-center gap-2 text-[10px] text-(--text-secondary) mb-1">
                <span
                  className="w-2.5 h-2.5 rounded-full shrink-0 border border-white"
                  style={{
                    background: l.ring ? 'transparent' : l.color,
                    borderColor: l.color,
                    borderStyle: l.dashed ? 'dashed' : 'solid',
                  }}
                />
                {l.label}
              </div>
            ))}
          </div>

          <div className="absolute top-3 right-3 z-[1000] flex items-center gap-1.5 px-2.5 py-1 rounded-md border border-(--border) bg-(--bg-surface)">
            <Radio size={12} className="text-(--accent)" />
            <span className="text-[10px] font-bold text-(--accent) uppercase tracking-wider">Live tracking</span>
          </div>
        </div>

        {/* Units */}
        <div className="w-full lg:w-[280px] xl:w-[300px] shrink-0 flex flex-col min-h-0 border-b lg:border-b-0 lg:border-r border-(--border) bg-(--bg-surface)">
          <div className="px-4 py-3 border-b border-(--border-subtle) flex items-center justify-between shrink-0">
            <span
              className="text-[10px] font-bold tracking-[0.12em] text-(--text-secondary) uppercase"
              style={{ fontFamily: 'var(--font-display)' }}
            >
              Multi-agency units
            </span>
            <span
              className="text-[10px] font-bold px-2 py-0.5 rounded bg-(--accent-ghost) text-(--accent)"
              style={{ fontFamily: 'var(--font-mono)' }}
            >
              {units.length} total
            </span>
          </div>
          <ul className="list-none m-0 p-0 overflow-y-auto flex-1 min-h-0">
            {units.length === 0 && (
              <li className="px-4 py-6 text-[12px] text-(--text-muted) text-center">
                No units dispatched yet
              </li>
            )}
            {units.map((unit) => {
              const color = UNIT_COLORS[unit.colorKey] ?? 'var(--text-secondary)'
              return (
                <li
                  key={unit.id}
                  className="px-4 py-3 border-b border-(--border-subtle) hover:bg-(--bg-elevated) transition-colors"
                >
                  <div className="flex gap-3">
                    <div
                      className="w-9 h-9 rounded-lg flex items-center justify-center shrink-0 border"
                      style={{
                        background: `color-mix(in srgb, ${color} 12%, transparent)`,
                        borderColor: `color-mix(in srgb, ${color} 30%, transparent)`,
                      }}
                    >
                      <UnitTypeIcon type={unit.vehicle_type} color={color} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-1">
                        <span className="text-[12px] font-bold text-(--accent)" style={{ fontFamily: 'var(--font-mono)' }}>
                          {unit.id}
                        </span>
                        <StatusBadge label={unit.statusLabel} color={color} />
                      </div>
                      <div className="text-[11px] text-(--text-secondary) mt-0.5">{unit.vehicle_type}</div>
                      <div className="text-[10px] text-(--text-muted) mt-1" style={{ fontFamily: 'var(--font-mono)' }}>
                        {unit.eta ? `ETA ${unit.eta}` : ''}
                        {unit.eta && unit.accuracy ? ' · ' : ''}
                        {unit.accuracy !== '—' ? unit.accuracy : ''}
                      </div>
                      {unit.current_lat != null && (
                        <div className="text-[10px] text-(--text-muted) mt-0.5" style={{ fontFamily: 'var(--font-mono)' }}>
                          {unit.current_lat.toFixed(4)}, {unit.current_lng.toFixed(4)}
                        </div>
                      )}
                    </div>
                  </div>
                </li>
              )
            })}
          </ul>
        </div>

        {/* Field comms — right column, full height */}
        <div className="w-full lg:w-[320px] xl:w-[360px] shrink-0 flex flex-col min-h-[240px] lg:min-h-0 bg-(--bg-surface) border-t lg:border-t-0 border-(--border)">

          {/* Header */}
          <div className="px-4 py-3 border-b border-(--border-subtle) flex items-center justify-between shrink-0 bg-(--bg-elevated)">
            <div className="flex items-center gap-2 text-(--text-primary)">
              <Radio size={14} className="text-(--accent)" />
              <span className="text-[12px] font-bold tracking-wide uppercase" style={{ fontFamily: 'var(--font-display)' }}>Unified Comms</span>
            </div>
            <span
              className="text-[9px] font-bold uppercase tracking-wider flex items-center gap-1"
              style={{ color: 'var(--status-low)' }}
            >
              <span className="w-1.5 h-1.5 rounded-full bg-(--status-low)" />
              {incident?.sector ?? incident?.district ?? 'Field'}
            </span>
          </div>

          <div className="flex-1 overflow-y-auto p-3 space-y-3 min-h-0 bg-(--bg-base)">
            {comms.map((msg) => {
              const isSelf = msg.isSelf
              const unitColor = msg.unitType ? UNIT_COLORS[msg.unitType] : 'var(--text-secondary)'

              return (
                <div key={msg.id} className={`flex ${isSelf ? 'justify-end' : 'justify-start'}`}>
                  {msg.type === 'text' ? (
                    <div
                      className="max-w-[85%] rounded-2xl px-3.5 py-2.5 border shadow-sm relative group"
                      style={{
                        background: isSelf ? '#a2cc29' : 'var(--bg-surface)',
                        color: isSelf ? '#111827' : 'var(--text-primary)',
                        borderColor: isSelf ? '#a2cc29' : 'var(--border-subtle)',
                        borderBottomRightRadius: isSelf ? '4px' : '16px',
                        borderBottomLeftRadius: isSelf ? '16px' : '4px',
                      }}
                    >
                      <div
                        className="text-[9px] font-bold uppercase tracking-wider mb-1"
                        style={{
                          fontFamily: 'var(--font-display)',
                          color: isSelf ? 'rgba(17,24,39,0.7)' : unitColor,
                        }}
                      >
                        {isSelf ? 'DISPATCH [YOU]' : msg.from}
                        <span className="font-normal opacity-70 ml-1.5" style={{ fontFamily: 'var(--font-mono)' }}>
                          {msg.time}
                        </span>
                      </div>
                      <p className="text-[12.5px] m-0 leading-snug font-medium" style={{ color: isSelf ? '#111827' : 'var(--text-primary)' }}>{msg.text}</p>
                    </div>
                  ) : (
                    <div
                      className="max-w-[85%] rounded-3xl px-1.5 py-1.5 border shadow-sm flex items-center gap-2 relative group"
                      style={{
                        background: isSelf ? '#a2cc29' : 'var(--bg-surface)',
                        borderColor: isSelf ? '#a2cc29' : 'var(--border-subtle)',
                        borderBottomRightRadius: isSelf ? '6px' : '24px',
                        borderBottomLeftRadius: isSelf ? '24px' : '6px',
                        minWidth: '200px',
                      }}
                    >
                      {msg.isNew && <span className="absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full bg-(--status-critical) border border-(--bg-base)" />}
                      <button
                        type="button"
                        className="w-8 h-8 rounded-full flex items-center justify-center shrink-0 border-none transition-transform active:scale-95"
                        style={{
                          background: isSelf ? 'rgba(17,24,39,0.1)' : 'var(--accent)',
                          color: isSelf ? '#111827' : '#fff',
                        }}
                        onClick={() => togglePlay(msg)}
                      >
                        {playingId === msg.id ? <Square size={12} fill="currentColor" /> : <Play size={12} fill="currentColor" className="ml-0.5" />}
                      </button>

                      <div className="flex-1 min-w-0 pr-3">
                        <div className="flex justify-between items-end mb-0.5">
                          <span
                            className="text-[9px] font-bold uppercase tracking-wider"
                            style={{
                              fontFamily: 'var(--font-display)',
                              color: isSelf ? 'rgba(17,24,39,0.7)' : unitColor,
                            }}
                          >
                            {isSelf ? 'DISPATCH [YOU]' : msg.from}
                          </span>
                          <span
                            className="text-[9px] font-bold tabular-nums"
                            style={{ color: isSelf ? 'rgba(17,24,39,0.6)' : 'var(--text-muted)' }}
                          >
                            {playingId === msg.id
                              ? fmtDuration(Math.floor(playProgress[msg.id] || 0))
                              : fmtDuration(msg.durationS)}
                          </span>
                        </div>

                        {/* Waveform visualization */}
                        <div className="h-4 flex items-end gap-[2px] w-full overflow-hidden opacity-80 mt-1">
                          {Array.from({ length: 24 }).map((_, i) => {
                            const isPlayed = playingId === msg.id && ((i / 24) * msg.durationS <= (playProgress[msg.id] || 0))
                            return (
                              <div
                                key={i}
                                className="flex-1 rounded-full bg-current transition-all duration-75"
                                style={{
                                  height: `${20 + Math.random() * 80}%`,
                                  color: isSelf
                                    ? (isPlayed ? 'rgba(17,24,39,0.85)' : 'rgba(17,24,39,0.25)')
                                    : (isPlayed ? 'var(--accent)' : 'var(--border)'),
                                }}
                              />
                            )
                          })}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )
            })}
          </div>

          <div className="p-3 bg-(--bg-elevated) border-t border-(--border-subtle) shrink-0">
            {pttActive && (
              <div className="flex items-center gap-2 mb-2 px-2">
                <span className="w-2 h-2 rounded-full bg-(--status-critical) animate-pulse" />
                <span className="text-[11px] font-bold text-(--status-critical) font-mono">
                  RECORDING {fmtDuration(pttSeconds)}
                </span>
                <span className="text-[10px] text-(--text-muted) ml-auto">Release to send</span>
              </div>
            )}

            <div className="flex gap-2 items-end">
              <form onSubmit={handleSend} className="flex-1 flex gap-2">
                <input
                  type="text"
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder="Type tactical message..."
                  className="flex-1 h-10 rounded-xl px-3 text-[13px] bg-(--bg-input) border border-(--border) text-(--text-primary) outline-none placeholder:text-(--text-muted) focus:border-(--accent) transition-colors"
                />
                {message.trim() ? (
                  <button
                    type="submit"
                    className="h-10 w-10 rounded-xl border-none flex items-center justify-center cursor-pointer shrink-0 transition-transform active:scale-95"
                    style={{ background: 'var(--accent)', color: '#000' }}
                    aria-label="Send message"
                  >
                    <Send size={16} />
                  </button>
                ) : (
                  <button
                    type="button"
                    className="h-10 w-10 rounded-xl border-none flex items-center justify-center cursor-pointer shrink-0 transition-all duration-150 active:scale-95"
                    style={{
                      background: pttActive ? 'var(--status-critical)' : 'transparent',
                      color: pttActive ? '#fff' : 'var(--accent)',
                      border: pttActive ? 'none' : '1px solid var(--border)',
                    }}
                    aria-label="Hold to talk"
                    onMouseDown={startPtt}
                    onMouseUp={stopPtt}
                    onMouseLeave={stopPtt}
                  >
                    <Mic size={18} />
                  </button>
                )}
              </form>
            </div>
          </div>
        </div>
      </div>

    </div>
  )
}

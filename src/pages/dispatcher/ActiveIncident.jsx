import { useMemo, useState, useRef, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
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
import { UNIT_COLORS } from '../../data/mockActiveIncidentData'
import { fmtDuration } from '../../data/mockAudioCommsData'
import { useNotificationsStore } from '../../store/notificationsStore'
import { listIncidents } from '../../api/incidents'
import { listDispatchesForIncident } from '../../api/dispatches'
import 'leaflet/dist/leaflet.css'

const MAP_TILES =
  'https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png'

/** Hex colors for Leaflet HTML markers (CSS vars unreliable in divIcon). */
const MARKER_HEX = {
  critical: '#E8354A',
  fire: '#E8354A',
  medical: '#2196C8',
  police: '#D4A017',
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

const ACTIVE_STATUSES = ['DISPATCHED', 'EN_ROUTE', 'ON_SCENE', 'active', 'pending', 'RECEIVED']

function elapsedDisplay(callTime) {
  if (!callTime) return '—'
  const mins = Math.floor((Date.now() - new Date(callTime).getTime()) / 60000)
  if (mins < 60) return `${mins}m`
  return `${Math.floor(mins / 60)}h ${mins % 60}m`
}

export default function ActiveIncident() {
  const navigate = useNavigate()
  const [message, setMessage] = useState('')
  const [comms, setComms] = useState([])
  const [sceneComplete, setSceneComplete] = useState(false)
  const [incident, setIncident] = useState(null)
  const [units, setUnits] = useState([])
  const addNotification = useNotificationsStore((state) => state.addNotification)

  useEffect(() => {
    listIncidents().then((incs) => {
      const active = incs.find(i => ACTIVE_STATUSES.includes(i.status)) ?? incs[0] ?? null
      setIncident(active)
      if (active) {
        listDispatchesForIncident(active.incident_id).then((dispatches) => {
          setUnits(dispatches.map((d) => ({
            id: d.vehicle_plate ?? d.vehicle_id,
            vehicle_id: d.vehicle_id,
            vehicle_type: 'Ambulance',
            role: d.responder_name ?? 'Responder',
            colorKey: 'medical',
            statusLabel: 'En Route',
            status: 'enroute',
            eta: d.eta_minutes != null ? `${d.eta_minutes}m` : null,
            current_lat: active.lat + (Math.random() - 0.5) * 0.01,
            current_lng: active.lng + (Math.random() - 0.5) * 0.01,
            accuracy: 'GPS',
            timestamp: null,
          })))
        }).catch(() => {})
      }
    }).catch(() => {})
  }, [])

  const handleSceneComplete = () => {
    setSceneComplete(true)
    addNotification({
      id: `scene-complete-${Date.now()}`,
      type: 'scene_complete',
      title: `Scene complete — ${incident?.incident_ref ?? ''}`,
      message: `Units released. Field report required for ${incident?.incident_type ?? 'incident'}.`,
      time: new Date().toISOString(),
      read: false,
      target_role: 'dispatcher',
    })
    setTimeout(() => navigate('/dispatcher/pending-reports'), 1800)
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

  const mapPoints = useMemo(
    () => [
      [incLat, incLng],
      ...units.map((u) => [u.current_lat, u.current_lng]),
    ],
    [incLat, incLng, units],
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
        type: 'text'
      },
    ])
    setMessage('')
  }

  const sev = incident?.severity ?? 'medium'
  const activeIncidentLevel = sev === 'critical' ? 4 : sev === 'high' ? 3 : sev === 'medium' ? 2 : 1

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
                Critical — level {activeIncidentLevel}
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
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg border-none cursor-pointer text-[11px] font-bold uppercase tracking-wide"
              style={{
                background: 'var(--status-critical)',
                color: '#fff',
                fontFamily: 'var(--font-display)',
              }}
            >
              <AlertTriangle size={16} />
              Escalate to operations manager
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

            {units.map((unit) => (
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

            {units.map((unit) => (
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
                  {unit.timestamp ? ` · ${unit.timestamp}` : ''}
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
            {units.map((unit) => {
              const color = UNIT_COLORS[unit.colorKey]
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
                      <div className="text-[11px] text-(--text-secondary) mt-0.5">{unit.role}</div>
                      <div className="text-[10px] text-(--text-muted) mt-1" style={{ fontFamily: 'var(--font-mono)' }}>
                        {unit.status === 'arrived' && unit.timestamp && `At scene ${unit.timestamp}`}
                        {unit.status === 'enroute' && unit.eta && `ETA ${unit.eta}`}
                        {' · '}
                        {unit.accuracy}
                      </div>
                      <div className="text-[10px] text-(--text-muted) mt-0.5" style={{ fontFamily: 'var(--font-mono)' }}>
                        {unit.current_lat.toFixed(4)}, {unit.current_lng.toFixed(4)}
                      </div>
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
                    // Text Bubble
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
                    // Voice Bubble (iMessage style)
                    <div
                      className="max-w-[85%] rounded-3xl px-1.5 py-1.5 border shadow-sm flex items-center gap-2 relative group"
                      style={{
                        background: isSelf ? '#a2cc29' : 'var(--bg-surface)',
                        borderColor: isSelf ? '#a2cc29' : 'var(--border-subtle)',
                        borderBottomRightRadius: isSelf ? '6px' : '24px',
                        borderBottomLeftRadius: isSelf ? '24px' : '6px',
                        minWidth: '200px'
                      }}
                    >
                      {msg.isNew && <span className="absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full bg-(--status-critical) border border-(--bg-base)" />}
                      <button
                        type="button"
                        className="w-8 h-8 rounded-full flex items-center justify-center shrink-0 border-none transition-transform active:scale-95"
                        style={{
                          background: isSelf ? 'rgba(17,24,39,0.1)' : 'var(--accent)',
                          color: isSelf ? '#111827' : '#fff'
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

                        {/* Fake Waveform */}
                        <div className="h-4 flex items-end gap-[2px] w-full overflow-hidden opacity-80 mt-1">
                          {Array.from({ length: 24 }).map((_, i) => {
                            const isPlayed = playingId === msg.id && ((i / 24) * msg.durationS <= (playProgress[msg.id] || 0));
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
                      border: pttActive ? 'none' : '1px solid var(--border)'
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

import { useMemo, useState } from 'react'
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
} from 'lucide-react'
import FieldLabel from '../../components/ui/FieldLabel'
import RwandaBoundsEnforcer from '../../components/map/RwandaBoundsEnforcer'
import MapFitBounds from '../../components/map/MapFitBounds'
import { RWANDA_BOUNDS, RWANDA_MIN_ZOOM, RWANDA_MAX_ZOOM } from '../../components/map/rwandaConstants'
import {
  activeIncident,
  activeIncidentUnits,
  mockFieldComms,
  UNIT_COLORS,
} from '../../data/mockActiveIncidentData'
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

export default function ActiveIncident() {
  const [message, setMessage] = useState('')
  const [comms, setComms] = useState(mockFieldComms)

  const mapPoints = useMemo(
    () => [
      [activeIncident.lat, activeIncident.lng],
      ...activeIncidentUnits.map((u) => [u.lat, u.lng]),
    ],
    [],
  )

  const incidentCenter = mapPoints[0]

  const mapLegend = useMemo(
    () => [
      { color: MARKER_HEX.critical, label: `${activeIncident.id} · incident` },
      { color: MARKER_HEX.fire, label: 'Fire units (FTK)' },
      { color: MARKER_HEX.medical, label: 'Medical (AMB)' },
      { color: MARKER_HEX.police, label: 'Police (POL)' },
      { color: MARKER_HEX.critical, label: 'Hot zone', ring: true },
      { color: MARKER_HEX.police, label: 'Safety line', dashed: true },
    ],
    [],
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
      },
    ])
    setMessage('')
  }

  return (
    <div className="flex flex-col h-full min-h-0 bg-(--bg-base) overflow-hidden">
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
                Critical — level {activeIncident.level}
              </span>
              <span className="text-[12px] font-bold text-(--accent)" style={{ fontFamily: 'var(--font-mono)' }}>
                {activeIncident.id}
              </span>
            </div>
            <h1
              className="text-xl md:text-2xl font-bold text-(--text-primary) m-0 leading-tight"
              style={{ fontFamily: 'var(--font-display)' }}
            >
              {activeIncident.title}
            </h1>
            <p className="flex items-center gap-1.5 text-[13px] text-(--text-secondary) mt-2 m-0">
              <MapPin size={14} className="text-(--accent) shrink-0" />
              {activeIncident.address}
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3 shrink-0">
            <div className="text-right px-4 py-2 rounded-lg border border-(--border) bg-(--bg-input)">
              <FieldLabel>Elapsed time</FieldLabel>
              <div
                className="text-2xl font-bold text-(--accent) tabular-nums"
                style={{ fontFamily: 'var(--font-mono)' }}
              >
                {activeIncident.elapsedDisplay}
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
              radius={activeIncident.safetyLineRadiusM}
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
              radius={activeIncident.hotZoneRadiusM}
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
                <strong>{activeIncident.id}</strong> — {activeIncident.type}
                <br />
                {activeIncident.sector}, {activeIncident.district}
                <br />
                <span style={{ fontFamily: 'monospace' }}>
                  {activeIncident.lat.toFixed(4)}, {activeIncident.lng.toFixed(4)}
                </span>
              </Tooltip>
            </CircleMarker>

            {activeIncidentUnits.map((unit) => (
              <CircleMarker
                key={`ring-${unit.id}`}
                center={[unit.lat, unit.lng]}
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

            {activeIncidentUnits.map((unit) => (
              <Marker
                key={unit.id}
                position={[unit.lat, unit.lng]}
                icon={unitMarkerIcon(unit)}
              >
                <Tooltip direction="top" offset={[0, -18]}>
                  <strong>{unit.id}</strong> — {unit.type}
                  <br />
                  {unit.role}
                  <br />
                  <strong>{unit.statusLabel}</strong>
                  {unit.eta ? ` · ETA ${unit.eta}` : ''}
                  {unit.timestamp ? ` · ${unit.timestamp}` : ''}
                  <br />
                  <span style={{ fontFamily: 'monospace' }}>
                    {unit.lat.toFixed(4)}, {unit.lng.toFixed(4)} ({unit.accuracy})
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
              {activeIncidentUnits.length} total
            </span>
          </div>
          <ul className="list-none m-0 p-0 overflow-y-auto flex-1 min-h-0">
            {activeIncidentUnits.map((unit) => {
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
                      <UnitTypeIcon type={unit.type} color={color} />
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
                        {unit.lat.toFixed(4)}, {unit.lng.toFixed(4)}
                      </div>
                    </div>
                  </div>
                </li>
              )
            })}
          </ul>
          <div className="p-3 border-t border-(--border-subtle) shrink-0">
            <button
              type="button"
              className="w-full py-2 rounded-lg border border-(--border) bg-(--bg-input) text-[10px] font-bold uppercase tracking-wider text-(--text-secondary) cursor-pointer hover:border-(--accent) hover:text-(--accent) transition-colors"
              style={{ fontFamily: 'var(--font-display)' }}
            >
              Request additional unit
            </button>
          </div>
        </div>

        {/* Field comms — right column, full height */}
        <div className="w-full lg:w-[320px] xl:w-[360px] shrink-0 flex flex-col min-h-[240px] lg:min-h-0 bg-(--bg-surface) border-t lg:border-t-0 border-(--border)">
          <div className="px-4 py-2.5 border-b border-(--border-subtle) flex items-center justify-between shrink-0">
            <span
              className="text-[10px] font-bold tracking-[0.12em] text-(--text-secondary) uppercase"
              style={{ fontFamily: 'var(--font-display)' }}
            >
              Field comms — {activeIncident.sector}
            </span>
            <span className="text-[9px] font-bold uppercase tracking-wider text-(--status-low) flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-(--status-low)" />
              Direct link active
            </span>
          </div>
          <div className="flex-1 overflow-y-auto p-3 space-y-2.5 min-h-0">
            {comms.map((msg) => {
              const isSelf = msg.isSelf
              const unitColor = msg.unitType ? UNIT_COLORS[msg.unitType] : 'var(--text-secondary)'
              return (
                <div key={msg.id} className={`flex ${isSelf ? 'justify-end' : 'justify-start'}`}>
                  <div
                    className="max-w-[90%] rounded-lg px-3 py-2 border"
                    style={{
                      background: isSelf ? 'var(--accent)' : 'var(--bg-input)',
                      color: isSelf ? 'var(--text-on-accent)' : 'var(--text-primary)',
                      borderColor: isSelf ? 'var(--accent)' : 'var(--border)',
                    }}
                  >
                    <div
                      className="text-[9px] font-bold uppercase tracking-wider mb-1 opacity-90"
                      style={{
                        fontFamily: 'var(--font-display)',
                        color: isSelf ? 'var(--text-on-accent)' : unitColor,
                      }}
                    >
                      {isSelf ? 'Dispatch [you]' : msg.from}
                      <span className="font-normal opacity-70 ml-1.5" style={{ fontFamily: 'var(--font-mono)' }}>
                        {msg.time}
                      </span>
                    </div>
                    <p className="text-[12px] m-0 leading-relaxed">{msg.text}</p>
                  </div>
                </div>
              )
            })}
          </div>
          <form onSubmit={handleSend} className="p-3 border-t border-(--border-subtle) flex gap-2 shrink-0">
            <input
              type="text"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Type tactical message to field units…"
              className="flex-1 h-10 rounded-lg px-3 text-[13px] bg-(--bg-input) border border-(--border) text-(--text-primary) outline-none placeholder:text-(--text-muted) focus:border-(--accent)"
            />
            <button
              type="submit"
              className="h-10 w-10 rounded-lg border-none flex items-center justify-center cursor-pointer shrink-0"
              style={{ background: 'var(--accent)', color: 'var(--text-on-accent)' }}
              aria-label="Send message"
            >
              <Send size={16} />
            </button>
          </form>
        </div>
      </div>
    </div>
  )
}

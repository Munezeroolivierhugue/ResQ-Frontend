/**
 * TriageLocationMap — three-way location display for NewIncident.jsx
 * Shows telecom rough circle, GPS precise marker, and manual pin simultaneously.
 */
import { useEffect, useMemo, useRef, useState } from 'react'
import { MapContainer, TileLayer, Marker, Circle, useMap } from 'react-leaflet'
import L from 'leaflet'
import { Navigation, Crosshair, MapPin } from 'lucide-react'
import RwandaBoundsEnforcer from '../map/RwandaBoundsEnforcer'
import { RWANDA_BOUNDS, RWANDA_MIN_ZOOM, RWANDA_MAX_ZOOM } from '../map/rwandaConstants'
import { IntakePanel } from '../intake/IntakeUi'
import 'leaflet/dist/leaflet.css'

const MAP_TILES = 'https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png'

/** Auto-zoom/pan to the most precise available location */
function MapAutoFit({ roughPos, precisePos, manualPos }) {
  const map = useMap()
  const prev = useRef(null)

  useEffect(() => {
    const target = precisePos || manualPos || roughPos
    if (!target) return
    const key = target.join(',')
    if (key === prev.current) return
    prev.current = key
    const zoom = precisePos ? 16 : manualPos ? 15 : 12
    map.flyTo(target, zoom, { duration: 0.8 })
  }, [map, roughPos, precisePos, manualPos])

  useEffect(() => {
    const t = setTimeout(() => map.invalidateSize(), 0)
    const cb = () => map.invalidateSize()
    window.addEventListener('resize', cb)
    return () => { clearTimeout(t); window.removeEventListener('resize', cb) }
  }, [map])

  return null
}

/** Click handler for manual pin drop */
function MapClickHandler({ onPinDrop }) {
  const map = useMap()
  useEffect(() => {
    const handler = (e) => onPinDrop(e.latlng)
    map.on('click', handler)
    return () => map.off('click', handler)
  }, [map, onPinDrop])
  return null
}

function makeIcon(color, label) {
  return L.divIcon({
    html: `<div style="
      width:28px;height:28px;display:flex;align-items:center;justify-content:center;
      background:${color};border:2px solid #fff;border-radius:50%;
      box-shadow:0 2px 8px rgba(0,0,0,0.35);
      font-size:9px;font-weight:800;color:#fff;font-family:monospace;
    ">${label}</div>`,
    className: '',
    iconAnchor: [14, 14],
  })
}

const GPS_STATES = {
  idle: null,
  sending: 'Sending...',
  waiting: 'Link sent. Waiting for caller to tap...',
  tapping: 'Link tapped. Receiving GPS...',
  received: 'Precise GPS received',
}

export default function TriageLocationMap({ caller, onLocationChange }) {
  // Memoize so the array reference stays stable between renders.
  // Without this, a new array is created every render → the location effect
  // sees roughPos "changed" → calls onLocationChange → parent re-renders → loop.
  const roughPos = useMemo(
    () => (caller ? [caller.rough_lat, caller.rough_lng] : null),
    [caller?.rough_lat, caller?.rough_lng], // eslint-disable-line react-hooks/exhaustive-deps
  )

  const [precisePos, setPrecisePos] = useState(null)
  const [manualPos, setManualPos] = useState(null)
  const [gpsState, setGpsState] = useState('idle')
  const [isPinDropMode, setIsPinDropMode] = useState(false)

  // Derived authoritative source
  const locationSource = precisePos
    ? 'GPS_PRECISE'
    : manualPos
    ? 'MANUAL_PIN'
    : roughPos
    ? 'TELECOM_ROUGH'
    : null

  // Icons (memo to avoid re-creating on every render)
  const gpsIcon = useMemo(() => makeIcon('var(--location-precise)', 'GPS'), [])
  const manualIcon = useMemo(() => makeIcon('var(--location-manual)', 'PIN'), [])

  // Notify parent when authoritative location changes
  useEffect(() => {
    const pos = precisePos || manualPos || roughPos
    if (!pos || !locationSource) return
    onLocationChange?.({ lat: pos[0], lng: pos[1], source: locationSource })
  }, [precisePos, manualPos, roughPos, locationSource, onLocationChange])

  function runGpsStateMachine() {
    setGpsState('sending')
    setTimeout(() => setGpsState('waiting'), 1500)
    setTimeout(() => setGpsState('tapping'), 4000)
    setTimeout(() => {
      // Offset rough position by a small delta to simulate precise GPS
      const precise = [
        caller.rough_lat + (Math.random() - 0.5) * 0.002,
        caller.rough_lng + (Math.random() - 0.5) * 0.002,
      ]
      setPrecisePos(precise)
      setGpsState('received')
    }, 6000)
  }

  function handlePinDrop(latlng) {
    if (!isPinDropMode) return
    setManualPos([latlng.lat, latlng.lng])
    setIsPinDropMode(false)
  }

  const canSendGps = caller?.device_type === 'smartphone' && gpsState === 'idle'
  const gpsLabel = gpsState === 'idle' ? 'Send GPS link via SMS' : GPS_STATES[gpsState]

  const sourceColors = {
    TELECOM_ROUGH: 'var(--location-rough)',
    GPS_PRECISE:   'var(--location-precise)',
    MANUAL_PIN:    'var(--location-manual)',
  }

  return (
    <IntakePanel className="flex flex-col overflow-visible">
      {/* Header */}
      <div className="px-4 py-3 border-b border-(--border-subtle) shrink-0">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <MapPin size={14} className="text-(--accent) shrink-0" />
            <span
              className="text-[10px] font-bold tracking-[0.14em] text-(--text-secondary) uppercase"
              style={{ fontFamily: 'var(--font-display)' }}
            >
              Three-way location
            </span>
          </div>
          {locationSource && (
            <span
              className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded"
              style={{
                fontFamily: 'var(--font-display)',
                background: `color-mix(in srgb, ${sourceColors[locationSource]} 15%, transparent)`,
                color: sourceColors[locationSource],
                border: `1px solid color-mix(in srgb, ${sourceColors[locationSource]} 35%, transparent)`,
              }}
            >
              Location source: {locationSource}
            </span>
          )}
        </div>
      </div>

      {/* GPS SMS button + pin drop */}
      <div className="px-4 py-2.5 border-b border-(--border-subtle) flex flex-wrap items-center gap-2">
        <button
          type="button"
          disabled={!canSendGps && gpsState === 'idle'}
          onClick={canSendGps ? runGpsStateMachine : undefined}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-[12px] font-semibold cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
          style={{
            fontFamily: 'var(--font-display)',
            borderColor: gpsState === 'received' ? 'var(--location-precise)' : 'var(--border)',
            color: gpsState === 'received' ? 'var(--location-precise)' : 'var(--text-primary)',
            background: gpsState === 'received' ? 'color-mix(in srgb, var(--location-precise) 10%, transparent)' : 'var(--bg-input)',
          }}
        >
          <Navigation size={12} />
          {gpsLabel}
        </button>

        <button
          type="button"
          onClick={() => setIsPinDropMode((v) => !v)}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-[12px] font-semibold cursor-pointer"
          style={{
            fontFamily: 'var(--font-display)',
            borderColor: isPinDropMode ? 'var(--location-manual)' : 'var(--border)',
            color: isPinDropMode ? 'var(--location-manual)' : 'var(--text-primary)',
            background: isPinDropMode ? 'color-mix(in srgb, var(--location-manual) 12%, transparent)' : 'var(--bg-input)',
          }}
        >
          <Crosshair size={12} />
          {isPinDropMode ? 'Click map to drop pin...' : 'Drop manual pin'}
        </button>

        {/* Legend */}
        <div className="ml-auto flex items-center gap-3 text-[10px] text-(--text-muted)">
          <span className="flex items-center gap-1">
            <span className="w-3 h-3 rounded-full inline-block opacity-70" style={{ background: 'var(--location-rough)' }} />
            Telecom
          </span>
          <span className="flex items-center gap-1">
            <span className="w-3 h-3 rounded-full inline-block" style={{ background: 'var(--location-precise)' }} />
            GPS
          </span>
          <span className="flex items-center gap-1">
            <span className="w-3 h-3 rounded-full inline-block" style={{ background: 'var(--location-manual)' }} />
            Manual
          </span>
        </div>
      </div>

      {/* Map */}
      <div
        className="relative map-natural"
        style={{ height: '300px', width: '100%', minHeight: '300px', cursor: isPinDropMode ? 'crosshair' : 'grab' }}
      >
        {roughPos && (
          <MapContainer
            center={roughPos}
            zoom={12}
            minZoom={RWANDA_MIN_ZOOM}
            maxZoom={RWANDA_MAX_ZOOM}
            maxBounds={RWANDA_BOUNDS}
            maxBoundsViscosity={1.0}
            style={{ height: '300px', width: '100%', background: '#E8EAED' }}
            zoomControl={false}
          >
            <TileLayer
              url={MAP_TILES}
              attribution='&copy; <a href="https://carto.com/">CARTO</a>'
            />
            <RwandaBoundsEnforcer />
            <MapAutoFit roughPos={roughPos} precisePos={precisePos} manualPos={manualPos} />
            <MapClickHandler onPinDrop={handlePinDrop} />

            {/* Telecom rough circle — always visible */}
            <Circle
              center={roughPos}
              radius={1000}
              pathOptions={{
                fillColor: 'var(--location-rough)',
                fillOpacity: 0.2,
                color: 'var(--location-rough)',
                weight: 2,
                opacity: 0.5,
              }}
            />

            {/* GPS precise marker + tight circle */}
            {precisePos && (
              <>
                <Circle
                  center={precisePos}
                  radius={15}
                  pathOptions={{
                    fillColor: 'var(--location-precise)',
                    fillOpacity: 0.25,
                    color: 'var(--location-precise)',
                    weight: 2,
                    opacity: 0.8,
                  }}
                />
                <Marker position={precisePos} icon={gpsIcon} />
              </>
            )}

            {/* Manual pin */}
            {manualPos && <Marker position={manualPos} icon={manualIcon} />}
          </MapContainer>
        )}

        {!roughPos && (
          <div className="flex items-center justify-center h-full text-(--text-muted) text-[13px]">
            No caller location available
          </div>
        )}

        {/* Coord readout */}
        {(precisePos || manualPos || roughPos) && (
          <div className="absolute bottom-3 left-3 right-3 flex justify-center pointer-events-none">
            <div
              className="px-3 py-1.5 rounded-md border border-(--border) bg-(--bg-surface) text-[11px] font-medium text-(--accent)"
              style={{ fontFamily: 'var(--font-mono)' }}
            >
              {(() => {
                const pos = precisePos || manualPos || roughPos
                return `${pos[0].toFixed(4)}, ${pos[1].toFixed(4)}`
              })()}
            </div>
          </div>
        )}
      </div>
    </IntakePanel>
  )
}

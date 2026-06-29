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
import api from '../../lib/apiClient'
import 'leaflet/dist/leaflet.css'

const MAP_TILES = 'https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png'
const RWANDA_CENTER = [-1.9441, 30.0619]

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
  waiting: 'Link sent. Waiting for caller...',
  received: 'Precise GPS received',
  error: 'SMS failed — retry?',
}

export default function TriageLocationMap({ caller, onLocationChange }) {
  const roughPos = useMemo(
    () => (caller?.rough_lat && caller?.rough_lng ? [caller.rough_lat, caller.rough_lng] : null),
    [caller?.rough_lat, caller?.rough_lng], // eslint-disable-line react-hooks/exhaustive-deps
  )

  const [precisePos, setPrecisePos] = useState(null)
  const [manualPos, setManualPos] = useState(null)
  const [gpsState, setGpsState] = useState('idle')
  const [isPinDropMode, setIsPinDropMode] = useState(false)

  const locationSource = precisePos
    ? 'GPS_PRECISE'
    : manualPos
    ? 'MANUAL_PIN'
    : roughPos
    ? 'TELECOM_ROUGH'
    : null

  const gpsIcon = useMemo(() => makeIcon('var(--location-precise)', 'GPS'), [])
  const manualIcon = useMemo(() => makeIcon('var(--location-manual)', 'PIN'), [])

  useEffect(() => {
    const pos = precisePos || manualPos || roughPos
    if (!pos || !locationSource) return
    onLocationChange?.({ lat: pos[0], lng: pos[1], source: locationSource })
  }, [precisePos, manualPos, roughPos, locationSource, onLocationChange])

  async function handleSendSms() {
    const phone = caller?.phone_number
    if (!phone) return
    setGpsState('sending')
    try {
      const { data } = await api.get('/api/location/sms-gps', { params: { phoneNumber: phone } })
      setGpsState('waiting')
      // If backend returns coordinates immediately (e.g. device already has GPS)
      const coords = data?.data ?? data
      if (coords?.lat && coords?.lng) {
        setPrecisePos([coords.lat, coords.lng])
        setGpsState('received')
      }
    } catch {
      setGpsState('error')
      setTimeout(() => setGpsState('idle'), 3000)
    }
  }

  async function handlePinDrop(latlng) {
    if (!isPinDropMode) return
    const pos = [latlng.lat, latlng.lng]
    setManualPos(pos)
    setIsPinDropMode(false)
    try {
      await api.post('/api/location/map-pin', null, { params: { lat: latlng.lat, lng: latlng.lng } })
    } catch {
      // Non-fatal — coordinates are still captured locally
    }
  }

  const hasPhone = !!caller?.phone_number
  const canSendSms = hasPhone && (gpsState === 'idle' || gpsState === 'error')
  const gpsLabel =
    gpsState === 'idle' || gpsState === 'error'
      ? hasPhone
        ? 'Send GPS link via SMS'
        : 'No phone number'
      : GPS_STATES[gpsState]

  const sourceColors = {
    TELECOM_ROUGH: 'var(--location-rough)',
    GPS_PRECISE:   'var(--location-precise)',
    MANUAL_PIN:    'var(--location-manual)',
  }

  const mapCenter = roughPos ?? RWANDA_CENTER
  const mapZoom = roughPos ? 12 : 8

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

      {/* SMS + pin controls */}
      <div className="px-4 py-2.5 border-b border-(--border-subtle) flex flex-wrap items-center gap-2">
        <button
          type="button"
          disabled={!canSendSms}
          onClick={canSendSms ? handleSendSms : undefined}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-[12px] font-semibold cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
          style={{
            fontFamily: 'var(--font-display)',
            borderColor: gpsState === 'received' ? 'var(--location-precise)' : gpsState === 'error' ? 'var(--status-critical)' : 'var(--border)',
            color: gpsState === 'received' ? 'var(--location-precise)' : gpsState === 'error' ? 'var(--status-critical)' : 'var(--text-primary)',
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

      {/* Map — always visible, defaults to Rwanda center if no caller location */}
      <div
        className="relative map-natural"
        style={{ height: '300px', width: '100%', minHeight: '300px', cursor: isPinDropMode ? 'crosshair' : 'grab' }}
      >
        <MapContainer
          center={mapCenter}
          zoom={mapZoom}
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

          {roughPos && (
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
          )}

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

          {manualPos && <Marker position={manualPos} icon={manualIcon} />}
        </MapContainer>

        {/* Coord readout */}
        {(precisePos || manualPos || roughPos) && (
          <div className="absolute bottom-3 left-3 right-3 flex justify-center pointer-events-none" style={{ zIndex: 1000 }}>
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

        {!roughPos && !precisePos && !manualPos && (
          <div
            className="absolute bottom-3 left-3 right-3 flex justify-center pointer-events-none"
            style={{ zIndex: 1000 }}
          >
            <div
              className="px-3 py-1.5 rounded-md border border-(--border) bg-(--bg-surface) text-[11px] text-(--text-muted)"
              style={{ fontFamily: 'var(--font-display)' }}
            >
              Click map to drop a pin, or send GPS link to caller
            </div>
          </div>
        )}
      </div>
    </IntakePanel>
  )
}

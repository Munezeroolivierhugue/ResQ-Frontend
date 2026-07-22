/**
 * TriageLocationMap — three-way location display for NewIncident.jsx
 * Shows telecom rough circle, GPS precise marker, and manual pin simultaneously.
 */
import { useEffect, useMemo, useRef, useState, useCallback } from 'react'
import { MapContainer, TileLayer, Marker, Circle, useMap } from 'react-leaflet'
import L from 'leaflet'
import { Crosshair, MapPin, Search, X } from 'lucide-react'
import RwandaBoundsEnforcer from '../map/RwandaBoundsEnforcer'
import { RWANDA_BOUNDS, RWANDA_MIN_ZOOM, RWANDA_MAX_ZOOM } from '../map/rwandaConstants'
import { IntakePanel } from '../intake/IntakeUi'
import api from '../../lib/apiClient'
import { subscribe } from '../../lib/wsClient'
import 'leaflet/dist/leaflet.css'

const MAP_TILES = 'https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png'
const RWANDA_CENTER = [-1.9441, 30.0619]

/** Auto-zoom/pan to the most precise available location */
function MapAutoFit({ roughPos, precisePos, manualPos, districtCenter }) {
  const map = useMap()
  const prev = useRef(null)

  useEffect(() => {
    const target = precisePos || manualPos || roughPos || districtCenter
    if (!target) return
    const key = target.join(',')
    if (key === prev.current) return
    prev.current = key
    const zoom = precisePos ? 16 : manualPos ? 15 : roughPos ? 12 : 11
    map.flyTo(target, zoom, { duration: 0.8 })
  }, [map, roughPos, precisePos, manualPos, districtCenter])

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

function makeDistrictIcon() {
  return L.divIcon({
    html: `<div style="
      width:32px;height:32px;display:flex;align-items:center;justify-content:center;
      background:#879D1F;border:2px solid #fff;border-radius:6px;
      box-shadow:0 2px 8px rgba(0,0,0,0.35);
      font-size:8px;font-weight:800;color:#fff;font-family:monospace;letter-spacing:0.04em;
    ">DIST</div>`,
    className: '',
    iconAnchor: [16, 16],
  })
}

export default function TriageLocationMap({ caller, callId, onLocationChange, onAddressFound, districtCenter }) {
  const roughPos = useMemo(
    () => (caller?.rough_lat && caller?.rough_lng ? [caller.rough_lat, caller.rough_lng] : null),
    [caller],
  )

  const [precisePos, setPrecisePos] = useState(null)
  const [manualPos, setManualPos] = useState(null)
  const [isPinDropMode, setIsPinDropMode] = useState(false)

  // ── Street search state ──────────────────────────────────────────────────────
  const [streetQuery, setStreetQuery] = useState('')
  const [streetResults, setStreetResults] = useState([])
  const [streetSearching, setStreetSearching] = useState(false)
  const [streetPinLabel, setStreetPinLabel] = useState(null)
  const geocodeTimerRef = useRef(null)

  const geocodeStreet = useCallback(async (query) => {
    const q = query?.trim()
    if (!q || q.length < 2) { setStreetResults([]); return }
    setStreetSearching(true)
    try {
      // Strategy 1: with "Kigali" city hint (best for KN/KG/KK street codes and landmarks)
      const base = 'https://nominatim.openstreetmap.org/search'
      const headers = { 'Accept-Language': 'en', 'User-Agent': 'ResQ-Emergency/1.0' }

      const [r1, r2] = await Promise.all([
        fetch(`${base}?q=${encodeURIComponent(q + ', Kigali, Rwanda')}&format=json&limit=5&countrycodes=rw&addressdetails=1`, { headers }).then(r => r.json()).catch(() => []),
        fetch(`${base}?q=${encodeURIComponent(q + ', Rwanda')}&format=json&limit=5&addressdetails=1`, { headers }).then(r => r.json()).catch(() => []),
      ])

      // Merge, deduplicate by place_id, keep unique top 6
      const seen = new Set()
      const merged = [...r1, ...r2].filter(r => {
        if (seen.has(r.place_id)) return false
        seen.add(r.place_id)
        return true
      }).slice(0, 6)

      setStreetResults(merged)
    } catch {
      setStreetResults([])
    } finally {
      setStreetSearching(false)
    }
  }, [])

  const handleStreetInput = (e) => {
    const val = e.target.value
    setStreetQuery(val)
    setStreetResults([])
    clearTimeout(geocodeTimerRef.current)
    geocodeTimerRef.current = setTimeout(() => geocodeStreet(val), 400)
  }

  const handleStreetKeyDown = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault()
      clearTimeout(geocodeTimerRef.current)
      if (streetResults.length > 0) {
        // Pick first result on Enter
        handleStreetSelect(streetResults[0])
      } else {
        // Force immediate search then pick first
        geocodeStreet(streetQuery).then(() => {})
      }
    }
    if (e.key === 'Escape') { setStreetResults([]); }
  }

  const handleStreetSelect = (result) => {
    const lat = parseFloat(result.lat)
    const lng = parseFloat(result.lon)
    const parts = result.display_name.split(',').map(s => s.trim())
    const label = parts.slice(0, 2).join(', ')
    // Extract address detail for sector/neighbourhood
    const addr = result.address ?? {}
    const sector = addr.suburb || addr.neighbourhood || addr.quarter || addr.village || addr.town || addr.city_district || ''
    setManualPos([lat, lng])
    setStreetPinLabel(label)
    setStreetQuery(label)
    setStreetResults([])
    onAddressFound?.({ label, sector, fullAddress: result.display_name })
  }

  const clearStreetSearch = () => {
    setStreetQuery('')
    setStreetResults([])
    setStreetPinLabel(null)
    clearTimeout(geocodeTimerRef.current)
    onAddressFound?.({ label: '', sector: '', fullAddress: '' })
  }

  const locationSource = precisePos
    ? 'GPS_PRECISE'
    : manualPos
    ? 'MANUAL_PIN'
    : roughPos
    ? 'TELECOM_ROUGH'
    : null

  const gpsIcon      = useMemo(() => makeIcon('var(--location-precise)', 'GPS'), [])
  const manualIcon   = useMemo(() => makeIcon('var(--location-manual)', 'PIN'), [])
  const districtIcon = useMemo(() => makeDistrictIcon(), [])

  useEffect(() => {
    const pos = precisePos || manualPos || roughPos
    if (!pos || !locationSource) return
    onLocationChange?.({ lat: pos[0], lng: pos[1], source: locationSource })
  }, [precisePos, manualPos, roughPos, locationSource, onLocationChange])

  // Real GPS the caller shared via the SMS link (see LocationWebhookController)
  // previously had nowhere to land in the UI at all — the backend broadcast
  // `location_updated` but nothing here ever subscribed to it.
  useEffect(() => {
    if (!callId) return
    const unsub = subscribe(`/topic/calls/${callId}/status`, (evt) => {
      if (evt?.type === 'location_updated' && evt.lat != null && evt.lng != null) {
        setPrecisePos([evt.lat, evt.lng])
      }
    })
    return unsub
  }, [callId])

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

      {/* Street address search */}
      <div className="px-4 py-2.5 border-b border-(--border-subtle) relative">
        <div className="relative flex items-center gap-2">
          <div className="relative flex-1">
            <Search size={13} className="absolute left-2.5 top-1/2 -translate-y-1/2 pointer-events-none" style={{ color: 'var(--text-muted)' }} />
            <input
              type="text"
              value={streetQuery}
              onChange={handleStreetInput}
              onKeyDown={handleStreetKeyDown}
              placeholder="Search street, landmark or area (e.g. KN 3 St, Kimironko market, Gasabo)"
              className="dispatcher-input w-full text-[12px] pl-7 pr-7 h-8"
              style={{ fontFamily: 'var(--font-body)' }}
              autoComplete="off"
            />
            {streetQuery && (
              <button
                type="button"
                onClick={clearStreetSearch}
                className="absolute right-2 top-1/2 -translate-y-1/2 cursor-pointer bg-transparent border-none p-0"
                style={{ color: 'var(--text-muted)' }}
              >
                <X size={12} />
              </button>
            )}
          </div>
          {streetSearching && (
            <span className="text-[11px] text-(--text-muted) shrink-0">Searching…</span>
          )}
        </div>
        {streetResults.length > 0 && (
          <div
            className="absolute left-4 right-4 top-full z-[9999] rounded-lg border border-(--border) overflow-hidden shadow-lg"
            style={{ background: 'var(--bg-surface)', marginTop: 2 }}
          >
            {streetResults.map((r) => (
              <button
                key={r.place_id}
                type="button"
                onClick={() => handleStreetSelect(r)}
                className="w-full text-left px-3 py-2 text-[12px] cursor-pointer border-b border-(--border-subtle) last:border-0 hover:bg-(--bg-elevated) transition-colors"
                style={{ background: 'transparent', color: 'var(--text-primary)', fontFamily: 'var(--font-body)' }}
              >
                <span className="font-medium">{r.display_name.split(',').slice(0, 2).join(',')}</span>
                <span className="block text-[10px] mt-0.5" style={{ color: 'var(--text-muted)' }}>
                  {r.display_name.split(',').slice(2, 4).join(',')}
                </span>
              </button>
            ))}
          </div>
        )}
        {streetPinLabel && (
          <p className="text-[11px] mt-1 m-0" style={{ color: 'var(--location-manual)' }}>
            Pinned: {streetPinLabel}
          </p>
        )}
      </div>

      {/* Pin controls — the GPS-share SMS is sent automatically the moment a
          real call comes in (see TwilioVoiceWebhookController), so there is
          no manual "send" action here anymore. */}
      <div className="px-4 py-2.5 border-b border-(--border-subtle) flex flex-wrap items-center gap-2">
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
          <MapAutoFit roughPos={roughPos} precisePos={precisePos} manualPos={manualPos} districtCenter={districtCenter} />
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

          {/* District center pin — shown when dispatcher selects a district */}
          {districtCenter && !precisePos && !manualPos && (
            <Marker position={districtCenter} icon={districtIcon} />
          )}
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

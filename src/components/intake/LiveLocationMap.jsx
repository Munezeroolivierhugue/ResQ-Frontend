import { useMemo } from 'react'
import { MapContainer, TileLayer, Marker } from 'react-leaflet'
import L from 'leaflet'
import { MapPin, Radio } from 'lucide-react'
import RwandaBoundsEnforcer from '../map/RwandaBoundsEnforcer'
import { RWANDA_BOUNDS, RWANDA_MIN_ZOOM, RWANDA_MAX_ZOOM } from '../map/rwandaConstants'
import { IntakePanel } from './IntakeUi'
import 'leaflet/dist/leaflet.css'

const MAP_TILES =
  'https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png'

function livePinIcon() {
  return L.divIcon({
    html: `<div class="map-live-pin"><span class="map-live-pin-core"></span><span class="map-live-pin-pulse"></span></div>`,
    className: 'map-live-pin-wrap',
    iconAnchor: [12, 12],
  })
}

export default function LiveLocationMap({ location }) {
  const position = [location.lat, location.lng]
  const icon = useMemo(() => livePinIcon(), [])
  const isConnected = location.state === 'connected'

  return (
    <IntakePanel className="flex flex-col flex-1 min-h-[420px] overflow-hidden">
      <div className="px-4 py-3 border-b border-(--border-subtle) shrink-0">
        <div className="flex flex-wrap items-start justify-between gap-2 mb-2">
          <div className="flex items-center gap-2">
            <MapPin size={14} className="text-(--accent) shrink-0" />
            <span
              className="text-[10px] font-bold tracking-[0.14em] text-(--text-secondary) uppercase"
              style={{ fontFamily: 'var(--font-display)' }}
            >
              Location sharing status
            </span>
          </div>
          <span
            className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-[9px] font-bold uppercase tracking-wider"
            style={{
              background: isConnected ? 'var(--status-low-bg)' : 'var(--status-medium-bg)',
              color: isConnected ? 'var(--status-low)' : 'var(--status-medium)',
              fontFamily: 'var(--font-display)',
            }}
          >
            {isConnected && (
              <span className="relative flex h-1.5 w-1.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-(--status-low) opacity-75" />
                <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-(--status-low)" />
              </span>
            )}
            {isConnected ? 'GPS connected' : 'Waiting for consent'}
          </span>
        </div>
        <p className="text-[12px] font-medium text-(--text-primary) m-0">{location.statusLabel}</p>
        <p className="text-[11px] text-(--text-muted) m-0 mt-0.5">{location.sublabel}</p>
        <div className="flex flex-wrap gap-2 mt-2.5">
          <span className="text-[10px] px-2 py-0.5 rounded border border-(--border) bg-(--bg-input) text-(--text-secondary)">
            {location.accuracy} accuracy
          </span>
          <span className="text-[10px] px-2 py-0.5 rounded border border-(--border) bg-(--bg-input) text-(--text-secondary)">
            {location.source}
          </span>
          <span className="text-[10px] px-2 py-0.5 rounded border border-(--border) bg-(--bg-input) text-(--text-muted)" style={{ fontFamily: 'var(--font-mono)' }}>
            Updated {location.lastUpdate}
          </span>
        </div>
      </div>

      <div className="relative flex-1 min-h-[360px] map-natural">
        <MapContainer
          center={position}
          zoom={14}
          minZoom={RWANDA_MIN_ZOOM}
          maxZoom={RWANDA_MAX_ZOOM}
          maxBounds={RWANDA_BOUNDS}
          maxBoundsViscosity={1.0}
          style={{ width: '100%', height: '100%', background: '#E8EAED' }}
          zoomControl={false}
        >
          <TileLayer
            url={MAP_TILES}
            attribution='&copy; <a href="https://carto.com/">CARTO</a> &copy; <a href="https://www.openstreetmap.org/">OSM</a>'
          />
          <RwandaBoundsEnforcer />
          <Marker position={position} icon={icon} />
        </MapContainer>

        <div className="absolute top-3 left-3 flex items-center gap-1.5 px-2.5 py-1 rounded-md border border-(--border) bg-(--bg-surface) text-[10px] font-bold uppercase tracking-wider text-(--status-low)">
          <Radio size={11} />
          Live
        </div>

        <div className="absolute bottom-3 left-3 right-3 flex justify-center pointer-events-none">
          <div
            className="px-3 py-1.5 rounded-md border border-(--border) bg-(--bg-surface) text-[11px] font-medium text-(--accent)"
            style={{ fontFamily: 'var(--font-mono)' }}
          >
            GPS: {location.lat.toFixed(4)}, {location.lng.toFixed(4)} · {location.sector}
          </div>
        </div>
      </div>
    </IntakePanel>
  )
}

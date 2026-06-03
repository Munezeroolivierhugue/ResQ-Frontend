import { useEffect, useMemo, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { MapContainer, TileLayer, CircleMarker, Polyline, useMap } from 'react-leaflet'
import L from 'leaflet'
import { MapPin, Navigation } from 'lucide-react'
import RwandaBoundsEnforcer from '../../components/map/RwandaBoundsEnforcer'
import { RWANDA_BOUNDS, RWANDA_MIN_ZOOM, RWANDA_MAX_ZOOM } from '../../components/map/rwandaConstants'
import FieldResponderProgressStrip from '../../components/field-responder/FieldResponderProgressStrip'
import { FR_ASSIGNMENT } from '../../data/mockFieldResponderData'
import { useFieldResponderStore } from '../../store/fieldResponderStore'
import 'leaflet/dist/leaflet.css'

const MAP_HEIGHT = '100vh'
const MAP_TILES =
  'https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png'

const ROUTE_FIT_PADDING = [120, 48]

const MARKER_HEX = {
  officer: '#2563eb',
  incident: '#e8354a',
  route: '#2563eb',
}

function buildRoutePoints(from, to) {
  const steps = 6
  return Array.from({ length: steps + 1 }, (_, i) => {
    const t = i / steps
    return [from[0] + (to[0] - from[0]) * t, from[1] + (to[1] - from[1]) * t]
  })
}

function MapReady({ points }) {
  const map = useMap()

  useEffect(() => {
    if (!points.length) return

    const sync = () => {
      map.invalidateSize()
      map.fitBounds(L.latLngBounds(points), {
        padding: ROUTE_FIT_PADDING,
        maxZoom: 16,
        animate: false,
      })
    }

    sync()
    const t1 = window.setTimeout(sync, 50)
    const t2 = window.setTimeout(sync, 300)
    window.addEventListener('resize', sync)

    return () => {
      window.clearTimeout(t1)
      window.clearTimeout(t2)
      window.removeEventListener('resize', sync)
    }
  }, [map, points])

  return null
}

export default function FRNavigation() {
  const navigate = useNavigate()
  const markOnScene = useFieldResponderStore((s) => s.markOnScene)
  const mapRef = useRef(null)
  const a = FR_ASSIGNMENT

  const officerPos = useMemo(() => [a.officerLat, a.officerLng], [a.officerLat, a.officerLng])
  const incidentPos = useMemo(() => [a.lat, a.lng], [a.lat, a.lng])
  const routePoints = useMemo(
    () => buildRoutePoints(officerPos, incidentPos),
    [officerPos, incidentPos],
  )
  const fitPoints = useMemo(
    () => [...routePoints, officerPos, incidentPos],
    [routePoints, officerPos, incidentPos],
  )

  useEffect(() => {
    const t = window.setTimeout(() => {
      if (mapRef.current?.invalidateSize) {
        mapRef.current.invalidateSize()
      }
      window.dispatchEvent(new Event('resize'))
    }, 100)
    return () => window.clearTimeout(t)
  }, [])

  const handleOnScene = () => {
    markOnScene()
    navigate('/field-responder/on-scene')
  }

  return (
    <div className="fr-app fr-nav-root field-responder-shell" style={{ height: MAP_HEIGHT, width: '100%' }}>
      <div className="fr-nav-map-layer" style={{ height: MAP_HEIGHT, width: '100%' }}>
        <MapContainer
          ref={mapRef}
          center={officerPos}
          zoom={15}
          minZoom={RWANDA_MIN_ZOOM}
          maxZoom={RWANDA_MAX_ZOOM}
          maxBounds={RWANDA_BOUNDS}
          maxBoundsViscosity={1}
          scrollWheelZoom
          zoomControl={false}
          style={{ height: MAP_HEIGHT, width: '100%' }}
        >
          <TileLayer
            url={MAP_TILES}
            attribution='&copy; <a href="https://carto.com/">CARTO</a> &copy; <a href="https://www.openstreetmap.org/">OSM</a>'
          />
          <RwandaBoundsEnforcer fitOnMount={false} />
          <MapReady points={fitPoints} />
          <CircleMarker
            center={officerPos}
            radius={9}
            pathOptions={{
              color: '#ffffff',
              fillColor: MARKER_HEX.officer,
              fillOpacity: 1,
              weight: 2,
            }}
          />
          <CircleMarker
            center={incidentPos}
            radius={11}
            pathOptions={{
              color: '#ffffff',
              fillColor: MARKER_HEX.incident,
              fillOpacity: 1,
              weight: 2,
            }}
          />
          <Polyline
            positions={routePoints}
            pathOptions={{ color: MARKER_HEX.route, weight: 5, opacity: 0.9 }}
          />
        </MapContainer>
      </div>

      <div className="fr-nav-top">
        <div className="fr-nav-incident-bar">
          <div className="fr-nav-incident-head">
            <span className="fr-nav-incident-id font-mono">{a.id}</span>
            <span className="fr-nav-severity-badge">{a.severity.toUpperCase()}</span>
          </div>
          <p className="fr-nav-incident-type">{a.type}</p>
          <p className="fr-nav-incident-location">
            <MapPin size={14} aria-hidden />
            {a.location}
          </p>
        </div>

        <div className="fr-nav-turn-card">
          <div className="fr-nav-turn-row">
            <Navigation size={16} className="fr-nav-turn-icon" aria-hidden />
            <p className="fr-nav-turn-main">{a.turnInstruction}</p>
          </div>
          <p className="fr-nav-turn-sub">{a.turnSub}</p>
          <div className="fr-nav-turn-chips">
            <span className="fr-nav-turn-chip fr-nav-turn-chip--eta font-mono">{a.etaMin} min</span>
            <span className="fr-nav-turn-chip fr-nav-turn-chip--dist font-mono">{a.distanceKm} km</span>
          </div>
        </div>
      </div>

      <div className="fr-nav-bottom">
        <div className="fr-nav-bottom-progress">
          <FieldResponderProgressStrip compact />
        </div>
        <button type="button" className="fr-on-scene-btn" onClick={handleOnScene}>
          <MapPin size={20} aria-hidden />
          I AM ON SCENE
        </button>
      </div>
    </div>
  )
}

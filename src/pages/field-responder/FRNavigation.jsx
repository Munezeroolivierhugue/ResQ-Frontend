import { useEffect, useMemo, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { MapContainer, TileLayer, CircleMarker, Polyline, useMap } from 'react-leaflet'
import L from 'leaflet'
import { MapPin, Navigation } from 'lucide-react'
import RwandaBoundsEnforcer from '../../components/map/RwandaBoundsEnforcer'
import { RWANDA_BOUNDS, RWANDA_MIN_ZOOM, RWANDA_MAX_ZOOM } from '../../components/map/rwandaConstants'
import FieldResponderProgressStrip from '../../components/field-responder/FieldResponderProgressStrip'
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

// Rwanda center as a safe fallback when no GPS available
const KIGALI_CENTER = [-1.9441, 30.0619]

export default function FRNavigation() {
  const navigate    = useNavigate()
  const markOnScene = useFieldResponderStore((s) => s.markOnScene)
  const assignment  = useFieldResponderStore((s) => s.assignment)
  const mapRef = useRef(null)

  const inc = assignment?.incident ?? null

  // Officer position — prefer browser geolocation, fallback to Kigali center
  const [officerCoords, setOfficerCoords] = useState(KIGALI_CENTER)
  useEffect(() => {
    if (!navigator.geolocation) return
    navigator.geolocation.getCurrentPosition(
      pos => setOfficerCoords([pos.coords.latitude, pos.coords.longitude]),
      () => {},
      { enableHighAccuracy: true, timeout: 5000 },
    )
  }, [])

  // Incident position — use real if available, else Kigali center as last resort
  const incidentLat = inc?.lat ?? KIGALI_CENTER[0]
  const incidentLng = inc?.lng ?? KIGALI_CENTER[1]

  const officerPos  = useMemo(() => officerCoords, [officerCoords])
  const incidentPos = useMemo(() => [incidentLat, incidentLng], [incidentLat, incidentLng])
  const routePoints = useMemo(
    () => buildRoutePoints(officerPos, incidentPos),
    [officerPos, incidentPos],
  )
  const fitPoints = useMemo(
    () => [...routePoints, officerPos, incidentPos],
    [routePoints, officerPos, incidentPos],
  )

  const distanceKm = useMemo(() => {
    const toRad = d => d * Math.PI / 180
    const [lat1, lng1] = officerPos
    const [lat2, lng2] = incidentPos
    const R = 6371
    const dLat = toRad(lat2 - lat1)
    const dLng = toRad(lng2 - lng1)
    const a = Math.sin(dLat / 2) ** 2 + Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2
    return (R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))).toFixed(1)
  }, [officerPos, incidentPos])

  const etaMinutes = assignment?.dispatch?.eta_minutes ?? Math.ceil(distanceKm / 40 * 60)

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
            <span className="fr-nav-incident-id font-mono">
              {inc?.incident_ref ?? 'INCIDENT'}
            </span>
            <span className="fr-nav-severity-badge">
              {(inc?.severity ?? 'UNKNOWN').toUpperCase()}
            </span>
          </div>
          <p className="fr-nav-incident-type">{inc?.incident_type ?? 'Active Incident'}</p>
          <p className="fr-nav-incident-location">
            <MapPin size={14} aria-hidden />
            {inc ? `${inc.district ?? ''}${inc.sector ? ' / ' + inc.sector : ''}` || inc.address || 'En route' : 'En route to incident'}
          </p>
        </div>

        <div className="fr-nav-turn-card">
          <div className="fr-nav-turn-row">
            <Navigation size={16} className="fr-nav-turn-icon" aria-hidden />
            <p className="fr-nav-turn-main">Head to incident location</p>
          </div>
          <p className="fr-nav-turn-sub">{inc ? `${inc.district ?? ''}${inc.sector ? ' · ' + inc.sector : ''}` || 'En route' : 'En route to incident'}</p>
          <div className="fr-nav-turn-chips">
            <span className="fr-nav-turn-chip fr-nav-turn-chip--eta font-mono">
              {etaMinutes} min
            </span>
            <span className="fr-nav-turn-chip fr-nav-turn-chip--dist font-mono">{distanceKm} km</span>
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

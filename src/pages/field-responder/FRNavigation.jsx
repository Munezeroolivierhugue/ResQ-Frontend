import { useEffect, useMemo, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { MapContainer, TileLayer, CircleMarker, Polyline, useMap } from 'react-leaflet'
import L from 'leaflet'
import { MapPin, Navigation, CloudRain } from 'lucide-react'
import RwandaBoundsEnforcer from '../../components/map/RwandaBoundsEnforcer'
import { RWANDA_BOUNDS, RWANDA_MIN_ZOOM, RWANDA_MAX_ZOOM } from '../../components/map/rwandaConstants'
import FieldResponderProgressStrip from '../../components/field-responder/FieldResponderProgressStrip'
import { useFieldResponderStore } from '../../store/fieldResponderStore'
import { formatIncidentType } from '../../utils/incidentTypeLabels'
import { getVehicle } from '../../api/vehicles'
import { getWeather } from '../../api/planning'
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

function buildStraightLinePoints(from, to) {
  const steps = 6
  return Array.from({ length: steps + 1 }, (_, i) => {
    const t = i / steps
    return [from[0] + (to[0] - from[0]) * t, from[1] + (to[1] - from[1]) * t]
  })
}

// Was drawing a pure straight line ("as the crow flies") between officer and
// incident regardless of actual streets — nothing like a real turn-by-turn
// route. OSRM's public demo router returns an actual road-following geometry
// plus real distance/duration; fall back to the straight line (and the
// haversine estimate) only if the request fails, so the map never goes blank.
async function fetchRoadRoute(from, to, signal) {
  const url = `https://router.project-osrm.org/route/v1/driving/${from[1]},${from[0]};${to[1]},${to[0]}?overview=full&geometries=geojson`
  const res = await fetch(url, { signal })
  if (!res.ok) throw new Error('routing service unavailable')
  const data = await res.json()
  const route = data?.routes?.[0]
  if (!route?.geometry?.coordinates?.length) throw new Error('no route found')
  return {
    points: route.geometry.coordinates.map(([lng, lat]) => [lat, lng]),
    distanceKm: route.distance / 1000,
    durationMin: route.duration / 60,
  }
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
  const vehicleId   = useFieldResponderStore((s) => s.vehicleId)
  const mapRef = useRef(null)
  const hasRealFixRef = useRef(false)

  const inc = assignment?.incident ?? null

  // Real live weather for the incident's district — same OpenWeatherMap-backed
  // endpoint Operations Manager uses, so a responder knows before arriving if
  // conditions on scene are hazardous (heavy rain/thunderstorm), not just
  // routine. Doesn't change the OSRM route itself (no hazard-avoidance
  // routing exists), just alerts the responder honestly.
  const [weather, setWeather] = useState(null)
  useEffect(() => {
    if (!inc?.district) return
    getWeather()
      .then((all) => setWeather(all.find((w) => w.district_name === inc.district) ?? null))
      .catch(() => setWeather(null))
  }, [inc?.district])

  // Officer position — prefer browser geolocation, fallback to Kigali center.
  // Was a one-shot getCurrentPosition() call, so the marker/route was frozen
  // at wherever the officer was standing when the page first mounted and
  // never reflected actual movement afterward. watchPosition keeps it live.
  const [officerCoords, setOfficerCoords] = useState(KIGALI_CENTER)
  useEffect(() => {
    if (!navigator.geolocation) return
    const watchId = navigator.geolocation.watchPosition(
      pos => { hasRealFixRef.current = true; setOfficerCoords([pos.coords.latitude, pos.coords.longitude]) },
      () => {},
      { enableHighAccuracy: true, timeout: 5000, maximumAge: 10000 },
    )
    return () => navigator.geolocation.clearWatch(watchId)
  }, [])

  // Seed the starting marker from the assigned vehicle's own known position
  // (the same current_lat/current_lng the dispatcher's map and Admin Unit
  // Management already show for this vehicle) instead of a generic
  // city-wide default. On a test/demo device, browser geolocation can
  // resolve somewhere that has nothing to do with which district the
  // vehicle actually operates in, so without this the map opened centered
  // in the wrong place until a live GPS fix happened to arrive.
  useEffect(() => {
    if (!vehicleId) return
    getVehicle(vehicleId)
      .then((v) => {
        if (hasRealFixRef.current) return // a live geolocation fix already won
        // Prefer the vehicle's station coordinates (fixed, always correct
        // for its assigned district) over current_lat/current_lng — that
        // field is live-tracked GPS and can be stale/wrong between shifts
        // (e.g. last pinged from an unrelated location before this shift
        // started), which is exactly what showed the wrong district here.
        if (v.station_lat != null && v.station_lng != null) {
          setOfficerCoords([v.station_lat, v.station_lng])
        } else if (v.current_lat != null && v.current_lng != null) {
          setOfficerCoords([v.current_lat, v.current_lng])
        }
      })
      .catch(() => {})
  }, [vehicleId])

  // Incident position — use real if available, else Kigali center as last resort
  const incidentLat = inc?.lat ?? KIGALI_CENTER[0]
  const incidentLng = inc?.lng ?? KIGALI_CENTER[1]

  const officerPos  = useMemo(() => officerCoords, [officerCoords])
  const incidentPos = useMemo(() => [incidentLat, incidentLng], [incidentLat, incidentLng])

  const straightLineKm = useMemo(() => {
    const toRad = d => d * Math.PI / 180
    const [lat1, lng1] = officerPos
    const [lat2, lng2] = incidentPos
    const R = 6371
    const dLat = toRad(lat2 - lat1)
    const dLng = toRad(lng2 - lng1)
    const a = Math.sin(dLat / 2) ** 2 + Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2
    return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
  }, [officerPos, incidentPos])

  // Road route from OSRM, refreshed whenever the officer's live position
  // moves meaningfully — falls back to the straight line above on failure.
  const [roadRoute, setRoadRoute] = useState(null)
  useEffect(() => {
    const controller = new AbortController()
    fetchRoadRoute(officerPos, incidentPos, controller.signal)
      .then(setRoadRoute)
      .catch(() => setRoadRoute(null))
    return () => controller.abort()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [Math.round(officerPos[0] * 1000), Math.round(officerPos[1] * 1000), incidentPos[0], incidentPos[1]])

  const routePoints = roadRoute?.points ?? buildStraightLinePoints(officerPos, incidentPos)
  const fitPoints = useMemo(
    () => [...routePoints, officerPos, incidentPos],
    [routePoints, officerPos, incidentPos],
  )

  const distanceKm = (roadRoute?.distanceKm ?? straightLineKm).toFixed(1)
  const etaMinutes = assignment?.dispatch?.eta_minutes
    ?? Math.ceil(roadRoute?.durationMin ?? (straightLineKm / 40 * 60))

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
        {weather?.hazard_level === 'HAZARDOUS' && !weather.stale && (
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              padding: '8px 12px',
              marginBottom: '8px',
              borderRadius: '8px',
              background: 'var(--status-critical-bg)',
              color: 'var(--status-critical)',
              fontSize: '12px',
              fontWeight: 600,
            }}
          >
            <CloudRain size={16} aria-hidden />
            Hazardous weather at destination: {weather.description} ({Math.round(weather.temperature_c)}°C) — drive with caution.
          </div>
        )}
        <div className="fr-nav-incident-bar">
          <div className="fr-nav-incident-head">
            <span className="fr-nav-incident-id font-mono">
              {inc?.incident_ref ?? 'INCIDENT'}
            </span>
            <span className="fr-nav-severity-badge">
              {(inc?.severity ?? 'UNKNOWN').toUpperCase()}
            </span>
          </div>
          <p className="fr-nav-incident-type">{formatIncidentType(inc?.incident_type) ?? 'Active Incident'}</p>
          <p className="fr-nav-incident-location">
            <MapPin size={14} aria-hidden />
            {/* The `|| inc.address` fallback here never actually ran — the
                district/sector template string is always truthy even with
                both pieces empty, so the specific street/place the
                dispatcher captured (e.g. "National Archives of Rwanda, Mini
                Ubumwe") was silently dropped and only the broad sector
                ("Kacyiru") ever showed. */}
            {inc ? (inc.address || `${inc.district ?? ''}${inc.sector ? ' / ' + inc.sector : ''}`.trim() || 'En route') : 'En route to incident'}
          </p>
        </div>

        <div className="fr-nav-turn-card">
          <div className="fr-nav-turn-row">
            <Navigation size={16} className="fr-nav-turn-icon" aria-hidden />
            <p className="fr-nav-turn-main">Head to incident location</p>
          </div>
          <p className="fr-nav-turn-sub">{inc ? `${inc.district ?? ''}${inc.sector ? ' · ' + inc.sector : ''}`.trim() || 'En route' : 'En route to incident'}</p>
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

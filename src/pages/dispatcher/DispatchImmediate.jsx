import { useEffect, useMemo, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { MapContainer, TileLayer, CircleMarker, Tooltip } from 'react-leaflet'
import {
  Zap, MapPin, Route, Users, Check, ChevronDown,
} from 'lucide-react'
import { useThemeStore } from '../../store/themeStore'
import RwandaBoundsEnforcer from '../../components/map/RwandaBoundsEnforcer'
import { RWANDA_MIN_ZOOM, RWANDA_MAX_ZOOM, RWANDA_BOUNDS } from '../../components/map/rwandaConstants'
import StatusBadge from '../../components/dispatcher/StatusBadge'
import DispatchImmediateHeader from '../../components/dispatcher/DispatchImmediateHeader'
import DispatchImmediateTypeStep from '../../components/dispatcher/DispatchImmediateTypeStep'
import {
  getImmediateIncident,
  mockNearestUnits,
  mockImmediateAssessment,
  getAvailableUnitsForMap,
  mockDispatchCallTranscript,
  detectIncidentTypeFromTranscript,
} from '../../data/mockDispatchImmediateData'
import 'leaflet/dist/leaflet.css'

export default function DispatchImmediate() {
  const { incidentId } = useParams()
  const navigate = useNavigate()
  const { theme } = useThemeStore()
  const baseIncident = useMemo(() => getImmediateIncident(incidentId), [incidentId])

  const [step, setStep] = useState('select-type')
  const [selectedType, setSelectedType] = useState(null)
  const [elapsed, setElapsed] = useState(227)
  const [omNotified, setOmNotified] = useState(false)
  const [selectedUnitId, setSelectedUnitId] = useState(mockNearestUnits[0].id)
  const [dispatched, setDispatched] = useState(false)
  const [showOverride, setShowOverride] = useState(false)
  const [dispatchTime, setDispatchTime] = useState('')

  const detectedTypeId = useMemo(
    () => detectIncidentTypeFromTranscript(mockDispatchCallTranscript),
    [],
  )

  const incident = useMemo(() => {
    if (!baseIncident) return null
    if (!selectedType) return baseIncident
    return {
      ...baseIncident,
      type: selectedType.label,
      description: selectedType.description,
    }
  }, [baseIncident, selectedType])

  useEffect(() => {
    const t = setInterval(() => setElapsed((e) => e + 1), 1000)
    return () => clearInterval(t)
  }, [])

  useEffect(() => {
    const t = setTimeout(() => setOmNotified(true), 3000)
    return () => clearTimeout(t)
  }, [])

  if (!baseIncident) {
    return (
      <div className="p-6 text-(--text-secondary)">
        Incident not found.{' '}
        <Link to="/dispatcher" className="text-(--accent)">Return to map</Link>
      </div>
    )
  }

  const handleTypeSelect = (type) => {
    const now = new Date()
    setSelectedType({
      ...type,
      selectedAt: now.toLocaleTimeString('en-GB', {
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
      }),
    })
    setStep('dispatch')
  }

  const selectedUnit =
    mockNearestUnits.find((u) => u.id === selectedUnitId) || mockNearestUnits[0]
  const unitLabel = selectedUnit.id === 'P-07'
    ? mockImmediateAssessment.recommendedLabel
    : `${selectedUnit.id} — ${selectedUnit.type}`

  const handleDispatch = () => {
    const now = new Date()
    setDispatchTime(
      now.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
    )
    setDispatched(true)
  }

  const mapUnits = getAvailableUnitsForMap()

  return (
    <div
      className="dispatch-immediate-page min-h-full flex flex-col"
      style={{
        background: `linear-gradient(135deg, color-mix(in srgb, var(--bg-base) 94%, var(--status-critical) 6%) 0%, var(--bg-base) 100%)`,
      }}
    >
      <DispatchImmediateHeader
        elapsed={elapsed}
        incidentId={baseIncident.id}
        omNotified={omNotified}
      />

      {step === 'select-type' && (
        <DispatchImmediateTypeStep
          detectedTypeId={detectedTypeId}
          onSelect={handleTypeSelect}
        />
      )}

      {step === 'dispatch' && incident && selectedType && (
        <div className="flex-1 min-h-0 flex flex-col lg:flex-row gap-4 p-4 md:p-5">
          <div className="lg:w-[55%] flex flex-col gap-4 min-w-0 min-h-0">
            <div
              className="dispatcher-surface p-4"
              style={{ borderLeft: '3px solid var(--status-critical)' }}
            >
              <div className="flex flex-wrap items-center gap-2 mb-1">
                <StatusBadge label="CRITICAL" variant="critical" />
                <span className="text-lg font-bold text-(--text-primary)">{incident.type}</span>
              </div>
              <p
                className="text-[11px] text-(--text-muted) m-0 mb-2"
                style={{ fontFamily: 'var(--font-mono)' }}
              >
                Type selected manually by dispatcher · {selectedType.selectedAt}
              </p>
              <p className="flex items-center gap-1.5 text-[13px] text-(--text-secondary) m-0 mb-2">
                <MapPin size={14} className="text-(--accent) shrink-0" />
                {incident.location}
              </p>
              <p className="text-[12px] text-(--text-muted) m-0 mb-1">
                Reported by: <span className="text-(--text-secondary)">{incident.reportedBy}</span>
              </p>
              <p className="text-[13px] text-(--text-secondary) m-0 leading-relaxed">
                {incident.description}
              </p>
            </div>

            <div className="dispatcher-surface overflow-hidden" style={{ height: 240 }}>
              <MapContainer
                center={[incident.lat, incident.lng]}
                zoom={14}
                minZoom={RWANDA_MIN_ZOOM}
                maxZoom={RWANDA_MAX_ZOOM}
                maxBounds={RWANDA_BOUNDS}
                maxBoundsViscosity={1}
                style={{
                  width: '100%',
                  height: '100%',
                  background: theme === 'dark' ? 'var(--bg-base)' : 'var(--bg-elevated)',
                }}
                zoomControl
              >
                <TileLayer
                  url={
                    theme === 'dark'
                      ? 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png'
                      : 'https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png'
                  }
                  attribution="&copy; CARTO &copy; OSM"
                />
                <RwandaBoundsEnforcer />
                <CircleMarker
                  center={[incident.lat, incident.lng]}
                  radius={10}
                  pathOptions={{
                    color: 'var(--bg-surface)',
                    fillColor: 'var(--status-critical)',
                    fillOpacity: 1,
                    weight: 2,
                  }}
                >
                  <Tooltip>{incident.id}</Tooltip>
                </CircleMarker>
                {mapUnits.map((u) => (
                  <CircleMarker
                    key={u.id}
                    center={[u.lat, u.lng]}
                    radius={6}
                    pathOptions={{
                      color: 'var(--bg-surface)',
                      fillColor: 'var(--accent)',
                      fillOpacity: 1,
                      weight: 1.5,
                    }}
                  >
                    <Tooltip>{u.id}</Tooltip>
                  </CircleMarker>
                ))}
              </MapContainer>
            </div>

            <div className="dispatcher-surface p-4">
              <div
                className="text-[11px] font-bold uppercase tracking-wider text-(--text-muted) mb-3"
                style={{ fontFamily: 'var(--font-mono)' }}
              >
                NEAREST AVAILABLE UNITS
              </div>
              <div className="flex flex-col gap-2">
                {mockNearestUnits.map((unit) => (
                  <label
                    key={unit.id}
                    className="flex items-center gap-3 p-2.5 rounded-lg border border-(--border-subtle) cursor-pointer hover:border-(--accent) transition-colors"
                    style={{
                      background:
                        selectedUnitId === unit.id ? 'var(--accent-ghost)' : 'var(--bg-input)',
                    }}
                  >
                    <input
                      type="radio"
                      name="nearest-unit"
                      checked={selectedUnitId === unit.id}
                      onChange={() => setSelectedUnitId(unit.id)}
                      className="accent-(--accent)"
                    />
                    <div className="flex-1 min-w-0 text-[13px]">
                      <span
                        className="font-bold text-(--accent) mr-1"
                        style={{ fontFamily: 'var(--font-mono)' }}
                      >
                        {unit.id}
                      </span>
                      <span className="text-(--text-secondary)">
                        · {unit.type} · {unit.distance} ·{' '}
                      </span>
                      <span className="font-bold text-(--text-primary)">ETA {unit.eta}</span>
                    </div>
                    <StatusBadge
                      label={unit.status}
                      variant={unit.status === 'AVAILABLE' ? 'resolved' : 'handover'}
                    />
                  </label>
                ))}
              </div>
            </div>
          </div>

          <div className="lg:w-[45%] flex flex-col gap-4 min-w-0">
            <div
              className="dispatcher-surface p-4"
              style={{ border: '1px solid var(--accent)' }}
            >
              <div
                className="text-[10px] font-bold uppercase tracking-wider text-(--accent) mb-2"
                style={{ fontFamily: 'var(--font-mono)' }}
              >
                AI FAST ASSESSMENT
              </div>
              <div className="text-xl font-bold text-(--text-primary) mb-1">{unitLabel}</div>
              <p className="text-[13px] text-(--text-secondary) m-0 mb-3">
                Nearest unit · {selectedUnit.distance} · ETA {selectedUnit.eta}
              </p>
              <div className="flex flex-col gap-1.5 text-[13px] text-(--text-secondary) mb-2">
                <span className="flex items-center gap-2">
                  <Route size={14} className="text-(--accent) shrink-0" />
                  Route: {mockImmediateAssessment.route}
                </span>
                <span className="flex items-center gap-2">
                  <Users size={14} className="text-(--accent) shrink-0" />
                  Crew: {mockImmediateAssessment.crew}
                </span>
              </div>
              <div
                className="text-[11px] font-bold uppercase mb-2"
                style={{ color: 'var(--status-low)', fontFamily: 'var(--font-display)' }}
              >
                {mockImmediateAssessment.confidence}
              </div>
              <p className="text-[11px] text-(--text-muted) m-0">
                AI analysis limited — life-threatening mode. Full analysis bypassed.
              </p>
            </div>

            <div>
              <button
                type="button"
                className="text-[12px] text-(--accent) bg-transparent border-none cursor-pointer flex items-center gap-1 font-semibold p-0"
                onClick={() => setShowOverride((v) => !v)}
              >
                Select different unit
                <ChevronDown size={14} className={showOverride ? 'rotate-180' : ''} />
              </button>
              {showOverride && (
                <div className="dispatcher-surface p-3 mt-2 flex flex-col gap-2">
                  {mockNearestUnits.map((unit) => (
                    <button
                      key={unit.id}
                      type="button"
                      className="text-left text-[13px] px-2 py-1.5 rounded-lg border border-(--border) bg-(--bg-input) cursor-pointer hover:border-(--accent)"
                      onClick={() => {
                        setSelectedUnitId(unit.id)
                        setShowOverride(false)
                      }}
                    >
                      {unit.id} — {unit.type} · {unit.distance}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {!dispatched ? (
              <>
                <button
                  type="button"
                  className="dispatch-immediate-dispatch-btn w-full flex items-center justify-center gap-2 border-none cursor-pointer transition-all"
                  style={{
                    height: 64,
                    background: 'var(--status-critical)',
                    fontSize: 16,
                    fontWeight: 700,
                    letterSpacing: '0.1em',
                    borderRadius: 10,
                    boxShadow: '0 4px 24px color-mix(in srgb, var(--status-critical) 35%, transparent)',
                    fontFamily: 'var(--font-display)',
                  }}
                  onClick={handleDispatch}
                >
                  <Zap size={22} />
                  DISPATCH NOW — {selectedUnit.id}
                </button>
                <p className="text-[11px] text-(--text-muted) text-center m-0">
                  Unit will receive immediate field order. Operations Manager has been notified.
                </p>
              </>
            ) : (
              <div
                className="rounded-[10px] p-5"
                style={{
                  background: 'var(--status-low-bg)',
                  border: '1px solid var(--status-low)',
                }}
              >
                <div className="flex items-start gap-3 mb-3">
                  <Check size={24} style={{ color: 'var(--status-low)', flexShrink: 0 }} />
                  <div>
                    <div className="font-bold text-(--text-primary) text-[15px]">
                      {selectedUnit.id} Dispatched — {dispatchTime}
                    </div>
                    <p className="text-[13px] text-(--text-secondary) m-0 mt-1">
                      Unit notified · ETA {selectedUnit.eta.replace('~', '')} · OM alerted
                    </p>
                  </div>
                </div>
                <div className="flex flex-col sm:flex-row gap-2">
                  <Link
                    to="/dispatcher/active-incident"
                    className="dispatcher-btn-primary flex-1 no-underline text-center"
                  >
                    Open Full Incident View
                  </Link>
                  <button
                    type="button"
                    className="dispatcher-btn-ghost flex-1"
                    onClick={() => navigate('/dispatcher')}
                  >
                    Return to Map
                  </button>
                </div>
              </div>
            )}

            <div className="mt-auto pt-4 border-t border-(--border-subtle) flex flex-wrap gap-4 justify-center">
              <button
                type="button"
                className="text-[12px] text-(--text-muted) bg-transparent border-none cursor-pointer hover:text-(--status-critical)"
                onClick={() => navigate('/dispatcher')}
              >
                Cancel dispatch
              </button>
              <button
                type="button"
                className="text-[12px] text-(--text-muted) bg-transparent border-none cursor-pointer hover:text-(--accent)"
                onClick={() => setStep('select-type')}
              >
                Change incident type
              </button>
              <button
                type="button"
                className="text-[12px] text-(--text-muted) bg-transparent border-none cursor-pointer hover:text-(--accent)"
                onClick={() => navigate('/dispatcher/ai-engine')}
              >
                Downgrade to standard dispatch
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

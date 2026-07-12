import { useState, useEffect } from 'react'
import { MapContainer, TileLayer, CircleMarker, Polyline, Tooltip } from 'react-leaflet'
import { Bot, CheckCircle, AlertTriangle, ChevronRight } from 'lucide-react'
import FieldLabel from '../../components/ui/FieldLabel'
import { useNavigate, useLocation } from 'react-router-dom'
import { useThemeStore } from '../../store/themeStore'
import RwandaBoundsEnforcer from '../../components/map/RwandaBoundsEnforcer'
import { RWANDA_BOUNDS, RWANDA_MIN_ZOOM, RWANDA_MAX_ZOOM } from '../../components/map/rwandaConstants'
import AvailableUnitsModal from '../../components/dispatcher/AvailableUnitsModal'
import { createDispatch } from '../../api/dispatches'
import { getAiRecommendation } from '../../api/incidents'

const SEV_COLOR = { critical: '#FF2D44', high: '#FF7A00', medium: '#E6A817', low: '#879D1F' }

function buildRecommendations(liveRankedUnits = []) {
  if (!liveRankedUnits || liveRankedUnits.length === 0) return []

  return liveRankedUnits.map((opt, idx) => {
    const optionRank = opt.option_rank ?? (idx + 1)
    const combinedEta = opt.combined_eta_minutes != null ? `${Math.round(opt.combined_eta_minutes)} min` : '—'
    const score = Math.round((opt.confidence_score ?? opt.confidence ?? 0.8) * 100)

    return {
      id: `opt-${optionRank}`,
      rank: optionRank,
      score,
      eta: combinedEta,
      reasoning: opt.reasoning,
      units: (opt.units ?? []).map((u) => ({
        vehicle_id: u.vehicle_id,
        unit: u.plate_number,
        type: u.vehicle_type,
        location: u.agency_name ?? 'District Station',
        eta: u.eta_minutes != null ? `${Math.round(u.eta_minutes)} min` : '—',
        score: Math.round((u.confidence ?? u.score ?? 0.8) * 100),
        lat: u.current_lat,
        lng: u.current_lng,
        reasoning: u.reasoning,
      })),
      reasons: idx === 0 ? [
        opt.reasoning ?? 'Closest available units in the district',
        'Units filtered to incident district only',
        'Ranked by distance and severity weight',
      ] : undefined,
    }
  })
}

export default function AIDispatchEngine() {
  const navigate = useNavigate()
  const { state } = useLocation()
  const { theme } = useThemeStore()
  const [dispatched, setDispatched] = useState(false)
  const [isUnitsModalOpen, setIsUnitsModalOpen] = useState(false)
  const [selectedOption, setSelectedOption] = useState(null)
  const [liveRankedUnits, setLiveRankedUnits] = useState([])
  const [aiLoading, setAiLoading] = useState(false)
  const [aiError, setAiError] = useState(null)

  // Read incident data passed from NewIncident
  const incident = state?.incident ?? {}

  const incidentType   = incident.incident_type ?? 'Emergency'
  const severity       = (incident.final_severity ?? 'LOW').toLowerCase()
  const district       = incident.district ?? 'Unknown District'
  const sector         = incident.sector ?? ''
  const streetAddress  = incident.street_address ?? ''
  const peopleCount    = incident.people_count ?? 1
  const incLat = incident.lat ?? -1.9441
  const incLng = incident.lng ?? 30.0619
  const callTime = incident.call_time ? new Date(incident.call_time).toLocaleTimeString() : new Date().toLocaleTimeString()

  // Fetch real AI recommendation from backend when we have a real incident_id
  useEffect(() => {
    if (!incident.incident_id) return
    setAiLoading(true)
    setAiError(null)
    getAiRecommendation(incident.incident_id)
      .then((rec) => {
        if (rec?.recommendations?.length) {
          setLiveRankedUnits(rec.recommendations)
        } else if (rec?.reasoning === 'AI engine unavailable') {
          // Backend reached the AI engine call but it failed (network error or a
          // response it couldn't parse) — distinct from a genuinely empty fleet.
          setAiError('AI engine unreachable. Choose a unit manually.')
        } else {
          setAiError(`No available units found in ${incident.district ?? 'this district'}.`)
        }
      })
      .catch(() => setAiError('AI engine unreachable. Choose a unit manually.'))
      .finally(() => setAiLoading(false))
  }, [incident.incident_id])

  // Build display recommendations from live backend units only — no mock fallback
  const recs = buildRecommendations(liveRankedUnits)
  const primary = recs[0]
  const alternatives = recs.slice(1)
  const activeOption = selectedOption ?? primary

  const handleDispatch = async () => {
    setDispatched(true)
    const team = activeOption?.units ?? []

    // POST dispatches using real vehicle UUIDs from backend; skip mock units (no UUID)
    if (incident.incident_id) {
      await Promise.allSettled(
        team
          .filter((u) => u.vehicle_id && /^[0-9a-f-]{36}$/i.test(u.vehicle_id)) // only real UUIDs
          .map((u) => createDispatch({
            incidentId: incident.incident_id,
            vehicleId: u.vehicle_id,
            aiRecommended: !selectedOption,
            overridden: !!selectedOption,
            confidence: (activeOption?.score ?? 80) / 100,
            etaMinutes: parseInt(String(u.eta ?? '').replace(/\D/g, '')) || null,
          }))
      )
    }

    setTimeout(() => navigate('/dispatcher/active-incident', {
      state: { incident_id: incident.incident_id, incident, dispatchedTeam: team }
    }), 1800)
  }

  return (
    <div className="ai-engine-layout h-full min-h-0">

      {/* Map */}
      <div className="relative min-h-[280px] lg:min-h-0">
        <MapContainer center={[incLat, incLng]}
          zoom={11} minZoom={RWANDA_MIN_ZOOM} maxZoom={RWANDA_MAX_ZOOM}
          maxBounds={RWANDA_BOUNDS} maxBoundsViscosity={1.0}
          style={{ width: '100%', height: '100%', background: theme === 'dark' ? '#040D1F' : '#E8EAED' }}
          zoomControl={false}>
          <TileLayer
            url={theme === 'dark'
              ? 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png'
              : 'https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png'
            }
            attribution='&copy; <a href="https://carto.com/">CARTO</a>'
          />
          <RwandaBoundsEnforcer />

          {/* Incident marker */}
          <CircleMarker center={[incLat, incLng]} radius={12}
            pathOptions={{ color: SEV_COLOR[severity] ?? '#E6A817', fillColor: SEV_COLOR[severity] ?? '#E6A817', fillOpacity: 0.9, weight: 2 }}>
            <Tooltip permanent><span className="text-[11px] font-bold">{incidentType}</span></Tooltip>
          </CircleMarker>

          {/* Paired units markers & routes */}
          {activeOption?.units?.map((u) => u.lat && (
            <CircleMarker key={u.unit} center={[u.lat, u.lng ?? 30.0619]} radius={8}
              pathOptions={{ color: '#B0D501', fillColor: '#B0D501', fillOpacity: 0.9, weight: 2 }}>
              <Tooltip permanent><span className="text-[11px] font-bold" style={{ color: '#031632' }}>{u.unit}</span></Tooltip>
            </CircleMarker>
          ))}

          {activeOption?.units?.map((u) => u.lat && (
            <Polyline key={u.unit} positions={[[u.lat, u.lng ?? 30.0619], [incLat, incLng]]} pathOptions={{ color: '#B0D501', weight: 2, dashArray: '8 6', opacity: 0.8 }} />
          ))}
        </MapContainer>

        <div className="absolute top-3 left-3 z-[1000] bg-(--bg-elevated) border border-(--border) rounded-lg px-3 py-1.5 flex items-center gap-1.5">
          <span className="text-[11px] text-(--text-muted)">Rwanda</span>
          <ChevronRight size={10} className="text-(--text-muted)" />
          <span className="text-[11px] text-(--text-primary) font-semibold">{district}</span>
          {sector && <>
            <ChevronRight size={10} className="text-(--text-muted)" />
            <span className="text-[11px] text-(--text-primary) font-semibold">{sector}</span>
          </>}
          {streetAddress && <>
            <ChevronRight size={10} className="text-(--text-muted)" />
            <span className="text-[11px] text-(--text-primary) font-semibold">{streetAddress}</span>
          </>}
        </div>
      </div>

      {/* Recommendation panel */}
      <div className="bg-(--bg-surface) flex flex-col overflow-hidden min-h-0">
        <div className="flex-1 overflow-y-auto p-5">

          {/* Incident summary */}
          <div className="bg-(--bg-elevated) border border-(--border) rounded-xl p-5 mb-4">
            <div className="flex items-center gap-2.5 mb-2">
              <span className="inline-flex items-center px-2.25 py-0.5 rounded text-[10px] font-bold uppercase tracking-[0.07em] border"
                style={{
                  background: (SEV_COLOR[severity] ?? '#E6A817') + '25',
                  color: SEV_COLOR[severity] ?? '#E6A817',
                  borderColor: (SEV_COLOR[severity] ?? '#E6A817') + '40',
                  fontFamily: 'var(--font-body)',
                }}>
                {severity.toUpperCase()}
              </span>
            </div>
            <div className="text-[15px] font-semibold mb-1">{incidentType} Incident</div>
            <div className="text-[13px] text-(--text-secondary)">
              {district}{sector ? `, ${sector}` : ''}{streetAddress ? ` — ${streetAddress}` : ''}
            </div>
            {peopleCount > 1 && (
              <div className="text-[12px] text-(--text-muted) mt-0.5">{peopleCount} people involved</div>
            )}
            <div className="text-[12px] text-(--text-muted) mt-1" style={{ fontFamily: 'var(--font-mono)' }}>Received at {callTime}</div>
          </div>

          {/* AI Recommendation — primary */}
          <div className="mb-4">
            <div className="flex items-center gap-2 mb-3">
              <Bot size={16} color="#879D1F" />
              <span className="text-[13px] font-bold">AI Recommendation</span>
              {aiLoading && <span className="text-[11px] text-(--text-muted) animate-pulse">Loading…</span>}
            </div>

            {aiLoading ? (
              <div className="bg-(--bg-elevated) border border-(--border) rounded-xl p-5 flex items-center justify-center min-h-[100px]">
                <span className="text-[13px] text-(--text-muted) animate-pulse">Fetching district units…</span>
              </div>
            ) : aiError ? (
              <div className="bg-[rgba(230,168,23,0.10)] border border-[rgba(230,168,23,0.30)] rounded-xl p-4 flex items-start gap-2">
                <AlertTriangle size={15} color="#E6A817" className="shrink-0 mt-0.5" />
                <span className="text-[13px] text-(--text-secondary)">{aiError}</span>
              </div>
            ) : activeOption ? (
            <div className="bg-[rgba(135,157,31,0.10)] border border-[rgba(176,213,1,0.25)] rounded-xl p-5">
              <div className="flex items-start justify-between mb-3">
                <div>
                  <div className="flex flex-col gap-1.5">
                    {activeOption?.units?.map((u) => (
                      <div key={u.unit} className="flex items-center gap-2">
                        <span className="text-[20px] font-bold text-[#B0D501]" style={{ fontFamily: 'var(--font-mono)' }}>{u.unit}</span>
                        <span className="text-[10px] px-1.5 py-0.5 rounded bg-(--bg-elevated) text-(--text-secondary) border border-(--border)">{u.type}</span>
                      </div>
                    ))}
                  </div>
                  <div className="text-[11px] text-(--text-secondary) mt-2">
                    {activeOption?.units?.map(u => `${u.unit} (${u.location})`).join(' + ')}
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-[32px] font-bold text-(--text-primary) leading-none" style={{ fontFamily: 'var(--font-display)' }}>{activeOption?.eta}</div>
                  <div className="text-[11px] text-(--text-muted) mt-0.5">ETA</div>
                </div>
              </div>

              <div className="mb-3">
                <div className="flex justify-between mb-1.5">
                  <span className="text-[12px] text-(--text-secondary)">Confidence Score</span>
                  <span className="text-[12px] font-bold text-[#B0D501]">{activeOption?.score}%</span>
                </div>
                <div className="h-1.5 bg-(--bg-elevated) rounded-full overflow-hidden">
                  <div className="h-full bg-[#879D1F] rounded-full transition-all duration-[600ms]" style={{ width: `${activeOption?.score}%` }} />
                </div>
              </div>

              {activeOption?.reasons && (
                <div className="flex flex-col gap-1.5 mb-2">
                  {activeOption.reasons.map((r, i) => (
                    <div key={i} className="flex items-center gap-2">
                      <CheckCircle size={13} color="#879D1F" className="shrink-0" />
                      <span className="text-[12px] text-(--text-secondary)">{r}</span>
                    </div>
                  ))}
                </div>
              )}

              {activeOption?.reasoning && (
                <div className="text-[12px] text-(--text-secondary) italic border-t border-[rgba(176,213,1,0.15)] pt-2 mt-2">
                  {activeOption.reasoning}
                </div>
              )}
            </div>
            ) : null}
          </div>

          {/* Alternatives */}
          <div className="mb-4">
            <FieldLabel className="mb-2">Alternatives</FieldLabel>
            {alternatives.map(alt => (
              <div key={alt.id} className="bg-(--bg-elevated) border border-(--border) rounded-xl px-3.5 py-3 mb-2 flex items-center gap-3">
                <div className="flex-1">
                  <div className="flex flex-wrap gap-1.5 items-center">
                    {alt.units.map(u => (
                      <span key={u.unit} className="text-[12px] font-bold text-(--text-primary) px-1.5 py-0.5 rounded bg-(--bg-surface) border border-(--border)" style={{ fontFamily: 'var(--font-mono)' }}>
                        {u.unit}
                      </span>
                    ))}
                  </div>
                  <div className="text-[11px] text-(--text-secondary) mt-1.5">
                    {alt.units.map(u => u.type).join(' + ')}
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-sm font-bold">{alt.eta}</div>
                  <div className="text-[11px] text-(--text-muted)">Score: {alt.score}%</div>
                </div>
                <button
                  onClick={() => setSelectedOption(alt)}
                  className="px-2.5 py-1 text-[11px] bg-transparent border border-(--border) text-(--text-primary) font-semibold rounded-lg cursor-pointer hover:bg-(--bg-elevated) hover:border-(--accent) transition-colors"
                  style={{ fontFamily: 'var(--font-body)' }}>
                  Select
                </button>
              </div>
            ))}
          </div>

          {/* Override notice */}
          <div className="flex items-start gap-2 px-3 py-2.5 bg-[rgba(230,168,23,0.10)] border border-[rgba(230,168,23,0.25)] rounded-lg mb-4">
            <AlertTriangle size={14} color="#E6A817" className="shrink-0 mt-px" />
            <span className="text-[12px] text-(--text-secondary)">
              AI recommendation is advisory. You retain full dispatch control.
            </span>
          </div>

          <div className="text-[11px] text-(--text-muted) text-center mb-2" style={{ fontFamily: 'var(--font-mono)' }}>
            AI decision logged at {new Date().toLocaleTimeString()}
          </div>
        </div>

        {/* Action buttons */}
        <div className="p-4 border-t border-(--border) flex flex-col gap-2">
          {dispatched ? (
            <div className="flex items-center justify-center gap-2 p-3.5 bg-[rgba(135,157,31,0.15)] rounded-[10px] border border-[rgba(176,213,1,0.3)]">
              <CheckCircle size={16} color="#879D1F" />
              <span className="text-sm font-semibold text-[#879D1F]">Dispatched! Opening active incident...</span>
            </div>
          ) : (
            <>
              {activeOption && (
                <button
                  className="w-full flex items-center justify-center py-3 px-5 bg-(--accent) text-(--text-on-accent) font-bold text-[13px] tracking-[0.04em] uppercase rounded-lg border-none cursor-pointer hover:bg-(--accent-dim) transition-colors"
                  style={{ fontFamily: 'var(--font-body)' }}
                  onClick={handleDispatch}>
                  Dispatch {activeOption.units?.map(u => u.unit).join(' + ')}
                </button>
              )}
              <button
                className="w-full flex items-center justify-center py-2.25 px-5 bg-transparent border border-(--border) text-(--text-primary) font-semibold text-[13px] rounded-lg cursor-pointer hover:bg-(--bg-elevated) hover:border-(--accent) transition-colors"
                style={{ fontFamily: 'var(--font-body)' }}
                onClick={() => setIsUnitsModalOpen(true)}>
                Choose Different Unit
              </button>
            </>
          )}
        </div>
      </div>

      <AvailableUnitsModal
        isOpen={isUnitsModalOpen}
        onClose={() => setIsUnitsModalOpen(false)}
      />
    </div>
  )
}

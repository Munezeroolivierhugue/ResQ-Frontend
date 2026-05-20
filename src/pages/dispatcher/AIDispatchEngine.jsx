import { useState } from 'react'
import { MapContainer, TileLayer, CircleMarker, Polyline, Tooltip } from 'react-leaflet'
import { Bot, CheckCircle, AlertTriangle, ChevronRight } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { useThemeStore } from '../../store/themeStore'
import RwandaBoundsEnforcer from '../../components/map/RwandaBoundsEnforcer'
import { RWANDA_BOUNDS, RWANDA_MIN_ZOOM, RWANDA_MAX_ZOOM } from '../../components/map/rwandaConstants'

const incident = {
  id: 'INC-2402', type: 'Traffic', severity: 'high',
  district: 'Kicukiro', sector: 'Niboye', time: '14:28',
  lat: -1.9706, lng: 30.0776
}

const recommendation = {
  unit: 'POL-12', type: 'Police Unit', location: 'Muhoza, Musanze',
  eta: '9 min', confidence: 94,
  reasons: [
    'Closest available unit — 2.1 km',
    'Specialized for Traffic response',
    'Unit capacity sufficient',
    'No active assignments',
  ],
  unitLat: -1.9500, unitLng: 30.0600
}

const alternatives = [
  { unit: 'POL-08', type: 'Police Unit', location: 'Gisenyi',   eta: '18 min', score: 71 },
  { unit: 'AMB-11', type: 'Ambulance',   location: 'Nyagatare', eta: '24 min', score: 58 },
]

const severityColor = { critical: '#FF2D44', high: '#FF7A00', medium: '#E6A817', low: '#879D1F' }

export default function AIDispatchEngine() {
  const navigate = useNavigate()
  const { theme } = useThemeStore()
  const [dispatched, setDispatched] = useState(false)

  const handleDispatch = () => {
    setDispatched(true)
    setTimeout(() => navigate('/dispatcher'), 2000)
  }

  const routeLine = [
    [recommendation.unitLat, recommendation.unitLng],
    [incident.lat, incident.lng]
  ]

  return (
    <div className="flex h-full">

      {/* Map — left 55% */}
      <div className="relative" style={{ flex: '0 0 55%' }}>
        <MapContainer center={[incident.lat, incident.lng]}
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
            className={theme === 'dark' ? 'map-dark-tiles' : ''}
          />
          <RwandaBoundsEnforcer />
          <CircleMarker center={[incident.lat, incident.lng]} radius={12}
            pathOptions={{ color: severityColor[incident.severity], fillColor: severityColor[incident.severity], fillOpacity: 0.9, weight: 2 }}>
            <Tooltip permanent><span className="text-[11px] font-bold">{incident.id}</span></Tooltip>
          </CircleMarker>
          <CircleMarker center={[recommendation.unitLat, recommendation.unitLng]} radius={8}
            pathOptions={{ color: '#B0D501', fillColor: '#B0D501', fillOpacity: 0.9, weight: 2 }}>
            <Tooltip permanent><span className="text-[11px] font-bold" style={{ color: '#031632' }}>{recommendation.unit}</span></Tooltip>
          </CircleMarker>
          <Polyline positions={routeLine} pathOptions={{ color: '#B0D501', weight: 2, dashArray: '8 6', opacity: 0.8 }} />
        </MapContainer>

        <div className="absolute top-3 left-3 z-[1000] bg-(--bg-elevated) border border-(--border) rounded-lg px-3 py-1.5 flex items-center gap-1.5">
          <span className="text-[11px] text-(--text-muted)">Rwanda</span>
          <ChevronRight size={10} className="text-(--text-muted)" />
          <span className="text-[11px] text-(--text-muted)">Kigali</span>
          <ChevronRight size={10} className="text-(--text-muted)" />
          <span className="text-[11px] text-(--text-primary) font-semibold">Kicukiro</span>
        </div>
      </div>

      {/* Recommendation panel — right 45% */}
      <div className="bg-(--bg-surface) border-l border-(--border) flex flex-col overflow-hidden" style={{ flex: '0 0 45%' }}>
        <div className="flex-1 overflow-y-auto p-5">

          {/* Incident summary */}
          <div className="bg-(--bg-elevated) border border-(--border) rounded-xl p-5 mb-4">
            <div className="flex items-center gap-2.5 mb-2">
              <span className="inline-flex items-center px-2.25 py-0.5 rounded text-[10px] font-bold uppercase tracking-[0.07em] border"
                style={{
                  background: severityColor[incident.severity] + '25',
                  color: severityColor[incident.severity],
                  borderColor: severityColor[incident.severity] + '40',
                  fontFamily: 'var(--font-body)',
                }}>
                {incident.severity.toUpperCase()}
              </span>
              <span className="text-[13px] font-semibold text-(--accent)" style={{ fontFamily: 'var(--font-mono)' }}>{incident.id}</span>
            </div>
            <div className="text-[15px] font-semibold mb-1">{incident.type} Incident</div>
            <div className="text-[13px] text-(--text-secondary)">{incident.district}, {incident.sector}</div>
            <div className="text-[12px] text-(--text-muted) mt-1" style={{ fontFamily: 'var(--font-mono)' }}>Received at {incident.time}</div>
          </div>

          {/* AI Recommendation */}
          <div className="mb-4">
            <div className="flex items-center gap-2 mb-3">
              <Bot size={16} color="#879D1F" />
              <span className="text-[13px] font-bold">AI Recommendation</span>
            </div>
            <div className="bg-[rgba(135,157,31,0.10)] border border-[rgba(176,213,1,0.25)] rounded-xl p-5">
              <div className="flex items-start justify-between mb-3">
                <div>
                  <div className="text-[28px] font-bold text-[#B0D501] leading-none" style={{ fontFamily: 'var(--font-mono)' }}>{recommendation.unit}</div>
                  <div className="text-[12px] text-(--text-secondary) mt-1">{recommendation.type} · {recommendation.location}</div>
                </div>
                <div className="text-right">
                  <div className="text-[32px] font-bold text-(--text-primary) leading-none" style={{ fontFamily: 'var(--font-display)' }}>{recommendation.eta}</div>
                  <div className="text-[11px] text-(--text-muted) mt-0.5">ETA</div>
                </div>
              </div>

              <div className="mb-3">
                <div className="flex justify-between mb-1.5">
                  <span className="text-[12px] text-(--text-secondary)">Confidence Score</span>
                  <span className="text-[12px] font-bold text-[#B0D501]">{recommendation.confidence}%</span>
                </div>
                <div className="h-1.5 bg-(--bg-elevated) rounded-full overflow-hidden">
                  <div className="h-full bg-[#879D1F] rounded-full transition-all duration-[600ms]" style={{ width: `${recommendation.confidence}%` }} />
                </div>
              </div>

              <div className="flex flex-col gap-1.5">
                {recommendation.reasons.map((r, i) => (
                  <div key={i} className="flex items-center gap-2">
                    <CheckCircle size={13} color="#879D1F" className="shrink-0" />
                    <span className="text-[12px] text-(--text-secondary)">{r}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Alternatives */}
          <div className="mb-4">
            <div className="text-[12px] font-bold text-(--text-muted) tracking-[0.08em] uppercase mb-2">Alternatives</div>
            {alternatives.map(alt => (
              <div key={alt.unit} className="bg-(--bg-elevated) border border-(--border) rounded-xl px-3.5 py-3 mb-2 flex items-center gap-3">
                <div className="flex-1">
                  <div className="text-[13px] font-semibold" style={{ fontFamily: 'var(--font-mono)' }}>{alt.unit}</div>
                  <div className="text-[11px] text-(--text-secondary) mt-0.5">{alt.type} · {alt.location}</div>
                </div>
                <div className="text-right">
                  <div className="text-sm font-bold">{alt.eta}</div>
                  <div className="text-[11px] text-(--text-muted)">Score: {alt.score}%</div>
                </div>
                <button className="px-2.5 py-1 text-[11px] bg-transparent border border-(--border) text-(--text-primary) font-semibold rounded-lg cursor-pointer hover:bg-(--bg-elevated) hover:border-(--accent) transition-colors" style={{ fontFamily: 'var(--font-body)' }}>
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
              <span className="text-sm font-semibold text-[#879D1F]">Dispatched! Redirecting...</span>
            </div>
          ) : (
            <>
              <button
                className="w-full flex items-center justify-center py-3 px-5 bg-(--accent) text-(--text-on-accent) font-bold text-[13px] tracking-[0.04em] uppercase rounded-lg border-none cursor-pointer hover:bg-(--accent-dim) transition-colors"
                style={{ fontFamily: 'var(--font-body)' }}
                onClick={handleDispatch}>
                Dispatch {recommendation.unit}
              </button>
              <button
                className="w-full flex items-center justify-center py-2.25 px-5 bg-transparent border border-(--border) text-(--text-primary) font-semibold text-[13px] rounded-lg cursor-pointer hover:bg-(--bg-elevated) hover:border-(--accent) transition-colors"
                style={{ fontFamily: 'var(--font-body)' }}>
                Choose Different Unit
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  )
}

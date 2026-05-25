import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { MapContainer, TileLayer, CircleMarker, Tooltip } from 'react-leaflet'
import { Building2, Megaphone, ChevronsUp } from 'lucide-react'
import { useThemeStore } from '../../store/themeStore'
import RwandaBoundsEnforcer from '../../components/map/RwandaBoundsEnforcer'
import { RWANDA_BOUNDS, RWANDA_MIN_ZOOM, RWANDA_MAX_ZOOM } from '../../components/map/rwandaConstants'
import StatusBadge from '../../components/dispatcher/StatusBadge'
import VerticalTimeline from '../../components/dispatcher/VerticalTimeline'
import { getEscalationDetail } from '../../data/mockOpsManagerData'
import 'leaflet/dist/leaflet.css'

export default function OpsManagerEscalation() {
  const { incidentId } = useParams()
  const { theme } = useThemeStore()
  const detail = getEscalationDetail(incidentId)
  const [elapsed, setElapsed] = useState(1542)

  useEffect(() => {
    const t = setInterval(() => setElapsed((e) => e + 1), 1000)
    return () => clearInterval(t)
  }, [])

  const formatElapsed = (s) => {
    const h = Math.floor(s / 3600)
    const m = Math.floor((s % 3600) / 60)
    const sec = s % 60
    return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(sec).padStart(2, '0')}`
  }

  return (
    <div className="flex flex-col lg:flex-row gap-4 p-4 md:p-5 min-h-full">
      <div className="lg:w-[55%] flex flex-col gap-4 min-w-0">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <div className="text-(--accent) font-mono font-bold text-[14px]">COMMANDING: {detail.id}</div>
            <div className="flex items-center gap-2 mt-1">
              <StatusBadge label={detail.reassessment.severity} variant="critical" />
              <span className="text-[13px] text-(--text-secondary)">{detail.location}</span>
            </div>
            <div className="text-[2rem] font-mono font-bold text-(--accent) mt-2">{formatElapsed(elapsed)}</div>
          </div>
          <button
            type="button"
            className="dispatcher-btn-primary shrink-0 text-[11px]"
            style={{ background: 'var(--status-critical)', color: 'var(--text-on-accent)' }}
          >
            ESCALATE TO DISTRICT COMMANDER
          </button>
        </div>

        <div className="dispatcher-surface overflow-hidden" style={{ height: 280 }}>
          <MapContainer
            center={[detail.lat, detail.lng]}
            zoom={15}
            minZoom={RWANDA_MIN_ZOOM}
            maxZoom={RWANDA_MAX_ZOOM}
            maxBounds={RWANDA_BOUNDS}
            style={{ width: '100%', height: '100%' }}
          >
            <TileLayer
              url={
                theme === 'dark'
                  ? 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png'
                  : 'https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png'
              }
            />
            <RwandaBoundsEnforcer />
            <CircleMarker
              center={[detail.lat, detail.lng]}
              radius={10}
              pathOptions={{ fillColor: 'var(--status-critical)', color: 'var(--bg-surface)', fillOpacity: 1, weight: 2 }}
            >
              <Tooltip>{detail.id}</Tooltip>
            </CircleMarker>
            {detail.units.map((u) => (
              <CircleMarker
                key={u.id}
                center={[u.lat, u.lng]}
                radius={6}
                pathOptions={{ fillColor: 'var(--accent)', color: 'var(--bg-surface)', fillOpacity: 1, weight: 1.5 }}
              >
                <Tooltip>{u.id}</Tooltip>
              </CircleMarker>
            ))}
          </MapContainer>
        </div>

        <div className="dispatcher-surface p-4">
          <div className="font-bold text-[13px] mb-3">Field Report — {detail.fieldReportUnit}</div>
          <VerticalTimeline
            events={detail.fieldUpdates.map((u, i) => ({
              id: u.id,
              time: u.time,
              title: u.title,
              description: u.description,
              active: i === 0,
            }))}
          />
        </div>
      </div>

      <div className="lg:w-[45%] flex flex-col gap-4 min-w-0">
        <div className="dispatcher-surface p-4">
          <div className="text-[10px] font-mono text-(--text-muted) uppercase tracking-wider mb-2">
            AI REASSESSMENT — UPDATED {detail.reassessment.updated}
          </div>
          <StatusBadge label={detail.reassessment.severity} variant="critical" />
          <p className="text-[13px] text-(--text-secondary) mt-3 m-0">
            <strong className="text-(--text-primary)">Recommended additional units:</strong>{' '}
            {detail.reassessment.additionalUnits}
          </p>
          <p className="text-[13px] text-(--text-secondary) mt-2 m-0">
            <strong className="text-(--text-primary)">Predicted duration:</strong> {detail.reassessment.duration}
          </p>
          <p className="text-[13px] text-(--text-secondary) mt-2 m-0">
            <strong className="text-(--text-primary)">Key risk:</strong> {detail.reassessment.risk}
          </p>
        </div>

        <div className="flex flex-col gap-2">
          <button type="button" className="dispatcher-btn-primary w-full">Dispatch Additional Units →</button>
          <button type="button" className="dispatcher-btn-ghost w-full flex items-center justify-center gap-2">
            <Building2 size={16} /> Notify Agency
          </button>
          <button type="button" className="dispatcher-btn-ghost w-full flex items-center justify-center gap-2">
            <Megaphone size={16} /> Issue Geographic Broadcast
          </button>
          <button
            type="button"
            className="w-full flex items-center justify-center gap-2 py-2.5 rounded-lg font-semibold text-[13px] border cursor-pointer"
            style={{
              border: '1px solid var(--status-critical)',
              color: 'var(--status-critical)',
              background: 'var(--status-critical-bg)',
            }}
          >
            <ChevronsUp size={16} /> Escalate to District Commander
          </button>
        </div>

        <div className="dispatcher-surface p-4">
          <div className="font-bold text-[13px] mb-3">Responding Units</div>
          {detail.units.map((u) => (
            <div key={u.id} className="flex flex-wrap items-center gap-2 py-2 border-b border-(--border-subtle) text-[12px] last:border-0">
              <span className="font-mono font-bold text-(--accent)">{u.id}</span>
              <span className="text-(--text-secondary)">· {u.type}</span>
              <StatusBadge label={u.status} variant={u.status === 'ON SCENE' ? 'resolved' : 'active'} />
              <span className="text-(--text-secondary)">{u.eta || 'On scene'}</span>
              <span className="font-mono text-(--text-muted) ml-auto text-[10px]">
                {u.lat.toFixed(4)}, {u.lng.toFixed(4)}
              </span>
            </div>
          ))}
        </div>

        <Link to="/ops-manager/dashboard" className="text-[12px] text-(--accent) no-underline">
          ← Back to Command Overview
        </Link>
      </div>
    </div>
  )
}

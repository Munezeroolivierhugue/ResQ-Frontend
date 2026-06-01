import { useState } from 'react'
import { MapContainer, TileLayer, CircleMarker, Tooltip } from 'react-leaflet'
import { MessageSquare, Plus } from 'lucide-react'
import { useThemeStore } from '../../store/themeStore'
import RwandaBoundsEnforcer from '../../components/map/RwandaBoundsEnforcer'
import { RWANDA_CENTER, RWANDA_BOUNDS, RWANDA_MIN_ZOOM, RWANDA_MAX_ZOOM } from '../../components/map/rwandaConstants'
import StatusBadge from '../../components/dispatcher/StatusBadge'
import { OPS_ESCALATIONS, OPS_AGENCIES, OPS_AGENCY_OPTIONS } from '../../data/mockOpsManagerData'
import OpsManagerDistrictLabel from '../../components/ops-manager/OpsManagerDistrictLabel'
import { mockUnits } from '../../data/mockData'
import 'leaflet/dist/leaflet.css'

const AGENCY_UNIT_COLORS = {
  rnp: 'var(--accent)',
  fire: 'var(--status-critical)',
  med: 'var(--status-info)',
  rib: 'var(--status-medium)',
}

export default function OpsManagerMultiAgency() {
  const { theme } = useThemeStore()
  const [incidentId, setIncidentId] = useState(OPS_ESCALATIONS[0]?.id || '')
  const [agencies] = useState(OPS_AGENCIES)
  const [showAdd, setShowAdd] = useState(false)
  const [broadcastType, setBroadcastType] = useState(null)
  const [broadcastMsg, setBroadcastMsg] = useState('')

  const mapUnits = mockUnits.slice(0, 12).map((u, i) => ({
    ...u,
    agency: ['rnp', 'fire', 'med', 'rib'][i % 4],
  }))

  return (
    <div className="portal-page flex flex-col gap-4">
      <div>
        <h1 className="dispatcher-page-title m-0">Multi-Agency Control</h1>
        <OpsManagerDistrictLabel />
      </div>
      <label className="dispatcher-field max-w-md">
        <span className="field-label">Select incident to coordinate</span>
        <select className="dispatcher-input dispatcher-select" value={incidentId} onChange={(e) => setIncidentId(e.target.value)}>
          {OPS_ESCALATIONS.map((e) => (
            <option key={e.id} value={e.id}>{e.id} — {e.type}</option>
          ))}
        </select>
      </label>

      <div className="multi-agency-layout min-h-[560px]">
        <div className="dispatcher-surface overflow-hidden relative min-h-[400px] map-panel-full">
          <MapContainer
            center={RWANDA_CENTER}
            zoom={12}
            minZoom={RWANDA_MIN_ZOOM}
            maxZoom={RWANDA_MAX_ZOOM}
            maxBounds={RWANDA_BOUNDS}
            style={{ width: '100%', height: '100%', minHeight: 400 }}
          >
            <TileLayer
              url={
                theme === 'dark'
                  ? 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png'
                  : 'https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png'
              }
            />
            <RwandaBoundsEnforcer />
            {mapUnits.map((u) => (
              <CircleMarker
                key={u.id}
                center={[u.lat, u.lng]}
                radius={6}
                pathOptions={{
                  fillColor: AGENCY_UNIT_COLORS[u.agency],
                  color: 'var(--bg-surface)',
                  fillOpacity: 1,
                  weight: 1.5,
                }}
              >
                <Tooltip>{u.id}</Tooltip>
              </CircleMarker>
            ))}
          </MapContainer>
          <div className="absolute top-3 left-3 z-[1000] p-3 rounded-lg border border-(--border) bg-(--bg-surface) text-[11px]">
            <div className="font-bold mb-2">Agency legend</div>
            {Object.entries({ Police: 'var(--accent)', Fire: 'var(--status-critical)', Medical: 'var(--status-info)', RIB: 'var(--status-medium)' }).map(([k, c]) => (
              <div key={k} className="flex items-center gap-2 mb-1">
                <span className="w-2 h-2 rounded-full" style={{ background: c }} />
                {k}
              </div>
            ))}
          </div>
        </div>

        <div className="flex flex-col gap-4 min-w-0">
          <SectionBlock title="Active Agencies">
            {agencies.map((a) => (
              <div key={a.id} className="dispatcher-surface p-3 mb-2">
                <div className="flex items-center justify-between gap-2">
                  <div>
                    <div className="font-semibold text-[13px]">{a.name}</div>
                    <div className="text-[12px] text-(--text-secondary)">{a.units} units deployed · {a.lastComm}</div>
                  </div>
                  <StatusBadge label={a.status} variant={a.status === 'ACTIVE' ? 'resolved' : 'active'} />
                </div>
                <div className="flex gap-2 mt-2">
                  <button type="button" className="dispatcher-btn-ghost text-[11px] flex items-center gap-1">
                    <MessageSquare size={12} /> Message Liaison
                  </button>
                  <button type="button" className="text-[11px] text-(--text-muted) bg-transparent border-none cursor-pointer">Remove Agency</button>
                </div>
              </div>
            ))}
            <button type="button" className="dispatcher-btn-outline w-full flex items-center justify-center gap-1" onClick={() => setShowAdd(!showAdd)}>
              <Plus size={14} /> Activate Agency
            </button>
            {showAdd && (
              <div className="dispatcher-surface p-3 mt-2 text-[12px]">
                {OPS_AGENCY_OPTIONS.map((name) => (
                  <label key={name} className="flex items-center gap-2 mb-2 cursor-pointer">
                    <input type="checkbox" className="accent-(--accent)" />
                    {name}
                  </label>
                ))}
                <button type="button" className="dispatcher-btn-primary w-full mt-2 text-[12px]">Send Coordination Request</button>
              </div>
            )}
          </SectionBlock>

          <SectionBlock title="Broadcast Controls">
            <div className="flex flex-col gap-2">
              {[
                { id: 'police', label: 'All Police Units', border: 'var(--accent)' },
                { id: 'geo', label: 'Geographic Zone', border: 'var(--accent)' },
                { id: 'sms', label: 'Public SMS Alert', border: 'var(--status-critical)' },
              ].map((b) => (
                <button
                  key={b.id}
                  type="button"
                  className="w-full py-2.5 rounded-lg font-semibold text-[12px] bg-transparent cursor-pointer border"
                  style={{ borderColor: b.border, color: b.border }}
                  onClick={() => setBroadcastType(b.id)}
                >
                  {b.label}
                </button>
              ))}
            </div>
            {broadcastType && (
              <div className="mt-3 p-3 border border-(--border) rounded-lg">
                <label className="dispatcher-field mb-2">
                  <span className="field-label">Priority</span>
                  <select className="dispatcher-input dispatcher-select">
                    <option>Normal</option>
                    <option>Urgent</option>
                    <option>Emergency</option>
                  </select>
                </label>
                <label className="dispatcher-field mb-2">
                  <span className="field-label">Message</span>
                  <textarea className="dispatcher-input dispatcher-textarea" rows={3} value={broadcastMsg} onChange={(e) => setBroadcastMsg(e.target.value)} />
                </label>
                <button type="button" className="dispatcher-btn-primary w-full text-[12px]">Send Broadcast</button>
                <p className="text-[10px] text-(--text-muted) m-0 mt-2">System will track acknowledgments</p>
              </div>
            )}
          </SectionBlock>
        </div>
      </div>
    </div>
  )
}

function SectionBlock({ title, children }) {
  return (
    <div>
      <div className="dispatcher-section-title mb-3">
        <span className="dispatcher-section-accent" aria-hidden />
        <span className="panel-title">{title}</span>
      </div>
      {children}
    </div>
  )
}

import { useState, useEffect } from 'react'
import { MapContainer, TileLayer, CircleMarker, Tooltip } from 'react-leaflet'
import { MessageSquare, Plus } from 'lucide-react'
import { useThemeStore } from '../../store/themeStore'
import RwandaBoundsEnforcer from '../../components/map/RwandaBoundsEnforcer'
import { RWANDA_CENTER, RWANDA_BOUNDS, RWANDA_MIN_ZOOM, RWANDA_MAX_ZOOM } from '../../components/map/rwandaConstants'
import StatusBadge from '../../components/dispatcher/StatusBadge'
import { OPS_ESCALATIONS, OPS_AGENCIES, OPS_AGENCY_OPTIONS } from '../../data/mockOpsManagerData'
import OpsManagerDistrictLabel from '../../components/ops-manager/OpsManagerDistrictLabel'
import { mockUnits } from '../../data/mockVehicles'
import { mockBroadcasts } from '../../data/mockBroadcasts'
import { generateUuid } from '../../utils/formHelpers'
import { getCurrentUser } from '../../utils/authSession'
import { useNotificationsStore } from '../../store/notificationsStore'
import { listBroadcasts } from '../../api/broadcasts'
import { listMutualAidRequests } from '../../api/mutualAid'
import 'leaflet/dist/leaflet.css'

const AGENCY_UNIT_COLORS = {
  rnp: 'var(--accent)',
  fire: 'var(--status-critical)',
  med: 'var(--status-info)',
  rib: 'var(--status-medium)',
}

const BROADCAST_OPTIONS = [
  { id: 'police', label: 'All Police Units', border: 'var(--accent)', target: 'ALL_UNITS', notifRole: 'all' },
  { id: 'geo', label: 'Geographic Zone', border: 'var(--accent)', target: 'GEOGRAPHIC_ZONE', notifRole: 'dispatcher' },
  { id: 'sms', label: 'Public SMS Alert', border: 'var(--status-critical)', target: 'PUBLIC_SMS', notifRole: null },
]

export default function OpsManagerMultiAgency() {
  const { theme } = useThemeStore()
  const addNotification = useNotificationsStore((s) => s.addNotification)
  const [incidentId, setIncidentId] = useState(OPS_ESCALATIONS[0]?.id || '')
  const [agencies] = useState(OPS_AGENCIES)
  const [showAdd, setShowAdd] = useState(false)
  const [broadcastType, setBroadcastType] = useState(null)
  const [broadcastMsg, setBroadcastMsg] = useState('')
  const [broadcastPriority, setBroadcastPriority] = useState('NORMAL')
  const [apiBroadcasts, setApiBroadcasts] = useState([])
  const [mutualAidRequests, setMutualAidRequests] = useState([])
  const [feedError, setFeedError] = useState(null)

  useEffect(() => {
    Promise.all([listBroadcasts(), listMutualAidRequests()])
      .then(([broadcasts, mutualAid]) => {
        if (broadcasts && broadcasts.length > 0) setApiBroadcasts(broadcasts)
        if (mutualAid && mutualAid.length > 0) setMutualAidRequests(mutualAid)
      })
      .catch(() => setFeedError('Live broadcast/mutual-aid feed unavailable — showing local data.'))
  }, [])

  const mapUnits = mockUnits.slice(0, 12).map((u, i) => ({
    ...u,
    agency: ['rnp', 'fire', 'med', 'rib'][i % 4],
  }))

  const handleSendBroadcast = () => {
    if (!broadcastMsg.trim() || !broadcastType) return
    const cu = getCurrentUser()
    const opt = BROADCAST_OPTIONS.find((b) => b.id === broadcastType)
    mockBroadcasts.push({
      broadcast_id: generateUuid(),
      sent_by: cu?.user_id || 'demo-user-uuid',
      message: broadcastMsg,
      priority: broadcastPriority,
      target_area: opt?.target || 'ALL_UNITS',
      sent_at: new Date().toISOString(),
    })
    if (opt?.notifRole !== undefined) {
      addNotification({
        id: `bc-${Date.now()}`,
        type: 'BROADCAST',
        title: `Broadcast — ${opt.label}`,
        desc: broadcastMsg,
        time: 'Just now',
        read: false,
        href: '#broadcast',
        target_role: opt.notifRole,
      })
    }
    setBroadcastMsg('')
    setBroadcastPriority('NORMAL')
    setBroadcastType(null)
  }

  return (
    <div className="portal-page flex flex-col gap-4">
      <div>
        <h1 className="dispatcher-page-title m-0">Multi-Agency Control</h1>
        <OpsManagerDistrictLabel />
      </div>

      {feedError && (
        <div className="text-[12px] px-3 py-2 rounded" style={{ background: 'var(--status-medium-bg)', color: 'var(--status-medium)' }}>
          {feedError}
        </div>
      )}

      {(apiBroadcasts.length > 0 || mutualAidRequests.length > 0) && (
        <div className="flex flex-col lg:flex-row gap-4">
          {apiBroadcasts.length > 0 && (
            <div className="dispatcher-surface p-4 flex-1 min-w-0">
              <div className="font-semibold text-[13px] mb-3">Recent Broadcasts</div>
              <div className="flex flex-col gap-2">
                {apiBroadcasts.slice(0, 5).map((b) => (
                  <div key={b.broadcast_id} className="flex items-start gap-3 border-b border-(--border-subtle) pb-2 text-[12px]">
                    <span
                      className="text-[10px] font-bold px-1.5 py-0.5 rounded shrink-0 mt-0.5"
                      style={{
                        background: b.priority === 'EMERGENCY' ? 'var(--status-critical-bg)' : b.priority === 'URGENT' ? 'var(--status-medium-bg)' : 'var(--bg-elevated)',
                        color: b.priority === 'EMERGENCY' ? 'var(--status-critical)' : b.priority === 'URGENT' ? 'var(--status-medium)' : 'var(--text-muted)',
                      }}
                    >
                      {b.priority}
                    </span>
                    <div className="flex-1 min-w-0">
                      <div className="text-(--text-primary) truncate">{b.message}</div>
                      <div className="text-(--text-muted) text-[11px]">{b.sent_by_name} · {b.target_area}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
          {mutualAidRequests.length > 0 && (
            <div className="dispatcher-surface p-4 flex-1 min-w-0">
              <div className="font-semibold text-[13px] mb-3">Mutual Aid Requests</div>
              <div className="flex flex-col gap-2">
                {mutualAidRequests.slice(0, 5).map((r) => (
                  <div key={r.request_id} className="flex items-center gap-3 border-b border-(--border-subtle) pb-2 text-[12px]">
                    <div className="flex-1 min-w-0">
                      <div className="font-medium truncate">{r.requesting_district_name} → {r.source_district_name}</div>
                      <div className="text-(--text-muted) text-[11px]">{r.unit_type} × {r.quantity} · {r.duration}</div>
                    </div>
                    <span
                      className="text-[10px] font-bold px-1.5 py-0.5 rounded shrink-0"
                      style={{
                        background: r.status === 'PENDING' ? 'var(--status-medium-bg)' : r.status === 'APPROVED' ? 'var(--accent-ghost)' : 'var(--bg-elevated)',
                        color: r.status === 'PENDING' ? 'var(--status-medium)' : r.status === 'APPROVED' ? 'var(--accent)' : 'var(--text-muted)',
                      }}
                    >
                      {r.status}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

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
                    <div className="text-[12px] text-(--text-secondary)">{a.units} units deployed · {a.last_communication_at}</div>
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
              {BROADCAST_OPTIONS.map((b) => (
                <button
                  key={b.id}
                  type="button"
                  className="w-full py-2.5 rounded-lg font-semibold text-[12px] bg-transparent cursor-pointer border"
                  style={{ borderColor: b.border, color: b.border }}
                  onClick={() => setBroadcastType(broadcastType === b.id ? null : b.id)}
                >
                  {b.label}
                </button>
              ))}
            </div>
            {broadcastType && (
              <div className="mt-3 p-3 border border-(--border) rounded-lg">
                <label className="dispatcher-field mb-2">
                  <span className="field-label">Priority</span>
                  <select
                    className="dispatcher-input dispatcher-select"
                    value={broadcastPriority}
                    onChange={(e) => setBroadcastPriority(e.target.value)}
                  >
                    <option value="NORMAL">Normal</option>
                    <option value="URGENT">Urgent</option>
                    <option value="EMERGENCY">Emergency</option>
                  </select>
                </label>
                <label className="dispatcher-field mb-2">
                  <span className="field-label">Message</span>
                  <textarea
                    className="dispatcher-input dispatcher-textarea"
                    rows={3}
                    value={broadcastMsg}
                    onChange={(e) => setBroadcastMsg(e.target.value)}
                  />
                </label>
                <button
                  type="button"
                  className="dispatcher-btn-primary w-full text-[12px]"
                  onClick={handleSendBroadcast}
                  disabled={!broadcastMsg.trim()}
                >
                  Send Broadcast
                </button>
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

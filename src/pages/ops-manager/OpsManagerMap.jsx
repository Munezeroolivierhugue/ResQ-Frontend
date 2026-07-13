import { useEffect, useState } from 'react'
import { MapContainer, TileLayer, CircleMarker, Circle, Tooltip } from 'react-leaflet'
import { Megaphone } from 'lucide-react'
import OpsManagerDistrictLabel from '../../components/ops-manager/OpsManagerDistrictLabel'
import { getOpsManagerDistrict } from '../../utils/opsManagerDistrict'
import { useThemeStore } from '../../store/themeStore'
import RwandaBoundsEnforcer from '../../components/map/RwandaBoundsEnforcer'
import { RWANDA_CENTER, RWANDA_BOUNDS, RWANDA_MIN_ZOOM, RWANDA_MAX_ZOOM } from '../../components/map/rwandaConstants'
import { mockBroadcasts } from '../../data/mockBroadcasts'
import { generateUuid } from '../../utils/formHelpers'
import { getCurrentUser } from '../../utils/authSession'
import { useNotificationsStore } from '../../store/notificationsStore'
import { listIncidents } from '../../api/incidents'
import { listVehicles } from '../../api/vehicles'
import 'leaflet/dist/leaflet.css'

const LAYERS = ['All Units', 'Incidents', 'Coverage Rings', 'Traffic', 'Agency Units']

export default function OpsManagerMap() {
  const { theme } = useThemeStore()
  const addNotification = useNotificationsStore((s) => s.addNotification)
  const [incidents, setIncidents] = useState([])
  const [units, setUnits] = useState([])

  useEffect(() => {
    const districtId = sessionStorage.getItem('resq-district-id')
    const params = districtId ? { districtId } : {}
    listIncidents(params).then(setIncidents).catch(() => {})
    listVehicles(params).then(setUnits).catch(() => {})
  }, [])

  const [layers, setLayers] = useState({
    'All Units': true,
    Incidents: true,
    'Coverage Rings': false,
    Traffic: false,
    'Agency Units': true,
  })
  const [broadcastOpen, setBroadcastOpen] = useState(false)
  const [broadcastMsg, setBroadcastMsg] = useState('')
  const [broadcastPriority, setBroadcastPriority] = useState('NORMAL')

  const toggleLayer = (name) => {
    setLayers((prev) => ({ ...prev, [name]: !prev[name] }))
  }

  const handleBroadcast = () => {
    if (!broadcastMsg.trim()) return
    const cu = getCurrentUser()
    mockBroadcasts.push({
      broadcast_id: generateUuid(),
      sent_by: cu?.user_id || 'demo-user-uuid',
      message: broadcastMsg,
      priority: broadcastPriority,
      target_area: 'GEOGRAPHIC_ZONE',
      sent_at: new Date().toISOString(),
    })
    addNotification({
      id: `bc-${Date.now()}`,
      type: 'BROADCAST',
      title: 'Area Broadcast Sent',
      desc: broadcastMsg,
      time: 'Just now',
      read: false,
      href: '#broadcast',
      target_role: 'dispatcher',
    })
    setBroadcastMsg('')
    setBroadcastPriority('NORMAL')
    setBroadcastOpen(false)
  }

  const standbyUnits = units.filter((u) => u.status === 'AVAILABLE' || u.status === 'available')

  const omDistrict = getOpsManagerDistrict()

  return (
    <div className="flex flex-col h-full min-h-[calc(100vh-56px)]">
      <div className="shrink-0 px-4 pt-4 pb-2 border-b border-(--border) bg-(--bg-surface)">
        <h1 className="dispatcher-page-title m-0">Live Operational Map</h1>
        <OpsManagerDistrictLabel />
      </div>
      <div className="shrink-0 px-4 py-3 border-b border-(--border) bg-(--bg-surface) flex flex-wrap items-center gap-3 justify-between">
        <div className="flex flex-wrap gap-2 items-center">
          <span
            className="inline-flex items-center shrink-0"
            style={{
              background: 'var(--accent-ghost)',
              border: '1px solid var(--accent)',
              color: 'var(--accent)',
              borderRadius: '6px',
              padding: '0.25rem 0.65rem',
              fontSize: '11px',
              fontWeight: 600,
            }}
          >
            📍 {omDistrict} District
          </span>
          {LAYERS.map((name) => (
            <button
              key={name}
              type="button"
              className="text-[11px] font-semibold px-3 py-1.5 rounded-full border cursor-pointer transition-colors"
              style={{
                fontFamily: 'var(--font-display)',
                background: layers[name] ? 'var(--accent-ghost)' : 'var(--bg-input)',
                borderColor: layers[name] ? 'var(--accent)' : 'var(--border)',
                color: layers[name] ? 'var(--accent)' : 'var(--text-secondary)',
              }}
              onClick={() => toggleLayer(name)}
            >
              {name}
            </button>
          ))}
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-[11px] font-mono px-2.5 py-1 rounded bg-(--bg-input) border border-(--border) text-(--text-secondary)">
            {units.length} units
          </span>
          <span className="text-[11px] font-mono px-2.5 py-1 rounded bg-(--bg-input) border border-(--border) text-(--text-secondary)">
            {incidents.length} incidents
          </span>
          <button
            type="button"
            className="dispatcher-btn-outline text-[12px] flex items-center gap-1.5"
            onClick={() => setBroadcastOpen((v) => !v)}
          >
            <Megaphone size={14} />
            Broadcast to Area
          </button>
        </div>
      </div>

      {broadcastOpen && (
        <div className="shrink-0 px-4 py-3 border-b border-(--border) bg-(--bg-surface) flex flex-wrap gap-3 items-end">
          <label className="dispatcher-field min-w-[120px]">
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
          <label className="dispatcher-field flex-1 min-w-[200px]">
            <span className="field-label">Message</span>
            <input
              className="dispatcher-input dispatcher-text-input"
              placeholder="Broadcast message…"
              value={broadcastMsg}
              onChange={(e) => setBroadcastMsg(e.target.value)}
            />
          </label>
          <button
            type="button"
            className="dispatcher-btn-primary text-[12px] shrink-0"
            onClick={handleBroadcast}
            disabled={!broadcastMsg.trim()}
          >
            Send
          </button>
          <button
            type="button"
            className="dispatcher-btn-ghost text-[12px] shrink-0"
            onClick={() => setBroadcastOpen(false)}
          >
            Cancel
          </button>
        </div>
      )}

      <div className="flex-1 min-h-[480px] relative">
        <MapContainer
          center={RWANDA_CENTER}
          zoom={12}
          minZoom={RWANDA_MIN_ZOOM}
          maxZoom={RWANDA_MAX_ZOOM}
          maxBounds={RWANDA_BOUNDS}
          maxBoundsViscosity={1}
          style={{ width: '100%', height: '100%', background: 'var(--bg-base)' }}
        >
          <TileLayer
            url={
              theme === 'dark'
                ? 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png'
                : 'https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png'
            }
            attribution="&copy; CARTO"
          />
          <RwandaBoundsEnforcer />
          {layers.Incidents && incidents.filter(inc => inc.lat != null && inc.lng != null).map((inc) => (
            <CircleMarker
              key={inc.incident_id}
              center={[inc.lat, inc.lng]}
              radius={8}
              pathOptions={{
                color: 'var(--bg-surface)',
                fillColor: (inc.severity ?? inc.final_severity ?? '').toLowerCase() === 'critical' ? 'var(--status-critical)' : 'var(--status-high)',
                fillOpacity: 0.9,
                weight: 2,
              }}
            >
              <Tooltip>{inc.incident_ref} · {inc.incident_type}</Tooltip>
            </CircleMarker>
          ))}
          {layers['All Units'] && units.filter(u => u.current_lat != null && u.current_lng != null).map((u) => (
            <CircleMarker
              key={u.vehicle_id}
              center={[u.current_lat, u.current_lng]}
              radius={6}
              pathOptions={{
                color: 'var(--bg-surface)',
                fillColor: 'var(--accent)',
                fillOpacity: 1,
                weight: 1.5,
              }}
            >
              <Tooltip>{u.plate_number} · {u.vehicle_type}</Tooltip>
            </CircleMarker>
          ))}
          {layers['Coverage Rings'] && standbyUnits.filter(u => u.current_lat != null && u.current_lng != null).map((u) => (
            <Circle
              key={`ring-${u.vehicle_id}`}
              center={[u.current_lat, u.current_lng]}
              radius={1200}
              pathOptions={{
                color: 'var(--accent)',
                fillColor: 'var(--accent)',
                fillOpacity: 0.08,
                weight: 1,
                dashArray: '4 6',
              }}
            />
          ))}
        </MapContainer>
      </div>
    </div>
  )
}

import { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { MapContainer, TileLayer, CircleMarker, Tooltip } from 'react-leaflet'
import { useThemeStore } from '../../store/themeStore'
import {
  Radio, Ambulance, Truck, ShieldCheck, Bus, Zap, X,
  ShieldAlert, AlertTriangle, Flame, Heart, Car, Users, User, Bell,
} from 'lucide-react'
import {
  getCriticalUnassignedIncident,
  IMMEDIATE_INCIDENT_TYPES,
} from '../../data/mockDispatchImmediateData'
import RwandaBoundsEnforcer from '../../components/map/RwandaBoundsEnforcer'
import MapInvalidateSize from '../../components/map/MapInvalidateSize'
import { RWANDA_CENTER, RWANDA_BOUNDS, RWANDA_MIN_ZOOM, RWANDA_MAX_ZOOM } from '../../components/map/rwandaConstants'
import { mockIncidents } from '../../data/mockIncidents'
import { mockVehicles as mockUnits } from '../../data/mockVehicles'
import 'leaflet/dist/leaflet.css'

const SEV_COLOR  = { critical: '#E8354A', high: '#F07820', medium: '#D4A017', low: '#3DAA6A' }
const UNIT_COLOR = { deployed: '#2196C8', available: '#3DAA6A', idle: '#D4A017', offline: '#5A6478' }

const TYPE_ICON_MAP = {
  shield:  ShieldAlert,
  warning: AlertTriangle,
  fire:    Flame,
  medical: Heart,
  car:     Car,
  people:  Users,
  person:  User,
  alert:   Bell,
}

function UnitTypeIcon({ type }) {
  const p = { size: 15, strokeWidth: 1.8 }
  if (type === 'Ambulance')  return <Ambulance  {...p} color="#2196C8" />
  if (type === 'Fire Truck') return <Truck      {...p} color="#E8354A" />
  if (type === 'Police')     return <ShieldCheck {...p} color="#D4A017" />
  return <Bus {...p} color="#5A6478" />
}

function KpiPill({ label, value, color }) {
  return (
    <div className="flex items-center gap-2 px-3.5 border-r border-(--border-subtle)">
      <span className="rounded text-[14px] font-bold tracking-[0.04em] px-2.25 py-px"
        style={{ background: color + '22', color, fontFamily: 'var(--font-display)' }}>
        {value}
      </span>
      <span className="text-[12px] text-(--text-secondary) whitespace-nowrap" style={{ fontFamily: 'var(--font-body)' }}>
        {label}
      </span>
    </div>
  )
}

function UnitCard({ unit, onAssign }) {
  return (
    <div className="flex items-center gap-2.25 px-3 py-2.25 border-b border-(--border-subtle) cursor-pointer hover:bg-(--bg-elevated) transition-colors">
      <div className="w-7.5 h-7.5 rounded-md bg-(--bg-elevated) flex items-center justify-center shrink-0">
        <UnitTypeIcon type={unit.vehicle_type} />
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-1.5">
          <span className="text-[12px] font-semibold text-(--accent)" style={{ fontFamily: 'var(--font-mono)' }}>{unit.id}</span>
          <span className="w-2 h-2 rounded-full inline-block shrink-0" style={{ background: UNIT_COLOR[unit.status] || '#5A6478' }} />
        </div>
        <div className="text-[11px] text-(--text-secondary) mt-px overflow-hidden text-ellipsis whitespace-nowrap">
          {unit.location}{unit.assignment ? ` · ${unit.assignment}` : ''}
        </div>
      </div>
      <button onClick={() => onAssign(unit)}
        className="text-[10px] font-bold px-2 py-[3px] rounded border-none cursor-pointer whitespace-nowrap shrink-0 tracking-[0.05em] uppercase transition-colors"
        style={{
          fontFamily: 'var(--font-body)',
          background: unit.status === 'available' ? 'var(--accent)' : 'var(--bg-elevated)',
          color: unit.status === 'available' ? 'var(--text-on-accent)' : 'var(--text-secondary)',
        }}>
        {unit.status === 'available' ? 'Assign' : unit.status === 'deployed' ? 'Reassign' : '—'}
      </button>
    </div>
  )
}

function ImmediateDispatchModal({ onClose, onSelect }) {
  return (
    <div
      className="fixed inset-0 z-[99999] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
      onClick={(e) => { if (e.target === e.currentTarget) onClose() }}
    >
      <div
        className="w-full max-w-[640px] rounded-2xl border border-(--border) overflow-hidden"
        style={{ background: 'var(--bg-surface)', boxShadow: 'var(--shadow-modal)' }}
      >
        {/* Modal header */}
        <div
          className="flex items-center justify-between px-5 py-4 border-b border-(--border)"
          style={{ background: 'color-mix(in srgb, var(--status-critical) 8%, var(--bg-surface))' }}
        >
          <div className="flex items-center gap-2.5">
            <span
              className="inline-flex items-center justify-center w-7 h-7 rounded-lg"
              style={{ background: 'var(--status-critical)', color: '#fff' }}
            >
              <Zap size={14} />
            </span>
            <div>
              <div
                className="text-[11px] font-bold uppercase tracking-[0.1em] text-(--status-critical)"
                style={{ fontFamily: 'var(--font-display)' }}
              >
                Immediate Dispatch
              </div>
              <div className="text-[12px] text-(--text-secondary)">Select the incident type to begin fast dispatch</div>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-lg flex items-center justify-center border border-(--border) bg-transparent cursor-pointer text-(--text-muted) hover:text-(--text-primary) transition-colors"
          >
            <X size={16} />
          </button>
        </div>

        {/* Type grid */}
        <div className="p-4 grid grid-cols-2 sm:grid-cols-4 gap-3">
          {IMMEDIATE_INCIDENT_TYPES.map((type) => {
            const Icon = TYPE_ICON_MAP[type.icon] || AlertTriangle
            return (
              <button
                key={type.id}
                type="button"
                onClick={() => onSelect(type)}
                className="flex flex-col items-center gap-2 p-3.5 rounded-xl border border-(--border) cursor-pointer text-center hover:border-(--status-critical) transition-all group"
                style={{ background: 'var(--bg-input)' }}
              >
                <span
                  className="w-9 h-9 rounded-xl flex items-center justify-center transition-colors group-hover:bg-(--status-critical)"
                  style={{
                    background: 'color-mix(in srgb, var(--status-critical) 12%, transparent)',
                    color: 'var(--status-critical)',
                  }}
                >
                  <Icon size={18} />
                </span>
                <span
                  className="text-[11px] font-bold text-(--text-primary) leading-tight"
                  style={{ fontFamily: 'var(--font-display)' }}
                >
                  {type.label}
                </span>
              </button>
            )
          })}
        </div>

        <div className="px-5 pb-4 text-center">
          <p className="text-[11px] text-(--text-muted) m-0">
            Selecting a type will open the fast-dispatch screen. AI analysis is bypassed for immediate dispatch.
          </p>
        </div>
      </div>
    </div>
  )
}

export default function LiveDispatchMap() {
  const { theme } = useThemeStore()
  const navigate = useNavigate()
  const [unitFilter, setUnitFilter] = useState('All')
  const [liveTime, setLiveTime] = useState(new Date())
  const [showImmediateModal, setShowImmediateModal] = useState(false)

  useEffect(() => {
    const t = setInterval(() => setLiveTime(new Date()), 30000)
    return () => clearInterval(t)
  }, [])

  const deployed      = mockUnits.filter(u => u.status === 'deployed').length
  const available     = mockUnits.filter(u => u.status === 'available').length
  const filteredUnits = (unitFilter === 'All' ? mockUnits : mockUnits.filter(u => u.status === unitFilter.toLowerCase())).slice(0, 5)
  const criticalIncident = getCriticalUnassignedIncident()

  const handleImmediateTypeSelect = (type) => {
    setShowImmediateModal(false)
    navigate('/dispatcher/dispatch-immediate/NEW', { state: { immediateType: type } })
  }

  return (
    <div className="dispatch-map-page relative">

      {/* Status bar */}
      <div className="h-[46px] bg-(--bg-surface) border-b border-(--border) flex items-center px-1.5 shrink-0">
        <KpiPill label="Units Deployed"  value={deployed}  color="#2196C8" />
        <KpiPill label="Units Available" value={available} color="#3DAA6A" />
        <KpiPill label="Avg Response"    value="7.2m"      color="var(--accent)" />
        <KpiPill label="Coverage"        value="84%"       color="var(--accent)" />
        <div className="ml-auto px-3.5 flex items-center gap-3">
          <button
            type="button"
            onClick={() => setShowImmediateModal(true)}
            className="inline-flex items-center gap-1.5 px-3 h-7 rounded-lg border-none cursor-pointer text-[11px] font-bold uppercase tracking-wider transition-opacity hover:opacity-90"
            style={{
              background: 'var(--status-critical)',
              color: '#fff',
              fontFamily: 'var(--font-display)',
              boxShadow: '0 2px 8px color-mix(in srgb, var(--status-critical) 35%, transparent)',
            }}
          >
            <Zap size={12} />
            Immediate Dispatch
          </button>
          <div className="flex items-center gap-1.5 px-2.5 py-0.75 bg-(--bg-elevated) rounded border border-(--border)">
            <Radio size={11} color="var(--accent)" />
            <span className="text-[10px] font-bold text-(--accent) tracking-[0.1em]" style={{ fontFamily: 'var(--font-display)' }}>LIVE</span>
          </div>
          <span className="text-[11px] text-(--text-muted)" style={{ fontFamily: 'var(--font-mono)' }}>
            {liveTime.toLocaleTimeString()}
          </span>
        </div>
      </div>

      {/* Main area */}
      <div className="dispatch-map-content">

        {/* Map */}
        <div className="dispatch-map-left">
          <div className="dispatch-map-container">
          <MapContainer
            center={RWANDA_CENTER}
            zoom={RWANDA_MIN_ZOOM}
            minZoom={RWANDA_MIN_ZOOM}
            maxZoom={RWANDA_MAX_ZOOM}
            maxBounds={RWANDA_BOUNDS}
            maxBoundsViscosity={1.0}
            style={{ width: '100%', height: '100%', background: theme === 'dark' ? '#040D1F' : '#E8EAED' }}
            zoomControl={false}
          >
            <MapInvalidateSize />
            <TileLayer
              url={theme === 'dark'
                ? 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png'
                : 'https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png'
              }
              attribution='&copy; <a href="https://carto.com/">CARTO</a> &copy; <a href="https://www.openstreetmap.org/">OSM</a>'
              className={theme === 'dark' ? 'map-dark-tiles' : ''}
            />
            <RwandaBoundsEnforcer />
            {mockIncidents.filter(i => i.status !== 'resolved' && i.status !== 'PENDING_REPORT').map(inc => (
              <CircleMarker key={inc.incident_id} center={[inc.lat, inc.lng]} radius={9}
                pathOptions={{ color: '#fff', fillColor: SEV_COLOR[inc.severity], fillOpacity: 1, weight: 2 }}>
                <Tooltip>
                  <strong>{inc.incident_ref}</strong> — {inc.incident_type}<br />
                  {inc.district}, {inc.sector} · {inc.elapsed}
                </Tooltip>
              </CircleMarker>
            ))}
            {mockUnits.filter(u => u.status !== 'offline').map(unit => (
              <CircleMarker key={unit.vehicle_id} center={[unit.current_lat, unit.current_lng]} radius={6}
                pathOptions={{ color: '#fff', fillColor: UNIT_COLOR[unit.status], fillOpacity: 1, weight: 1.5 }}>
                <Tooltip>
                  <strong>{unit.id}</strong> — {unit.vehicle_type}<br />
                  {unit.status} · {unit.location}
                </Tooltip>
              </CircleMarker>
            ))}
          </MapContainer>
          </div>

          {/* Legend */}
          <div className="absolute bottom-4 left-4 z-[1000] bg-white border border-[#E0E0E0] rounded-lg px-[14px] py-[10px] flex flex-col gap-[5px] shadow-[0_2px_8px_rgba(0,0,0,0.15)]">
            <div className="text-[10px] font-bold text-[#5F6368] tracking-[0.08em] mb-0.5" style={{ fontFamily: 'var(--font-display)' }}>LEGEND</div>
            {[
              { color: '#E8354A', label: 'Critical Incident' },
              { color: '#F07820', label: 'High Incident' },
              { color: '#D4A017', label: 'Medium Incident' },
              { color: '#2196C8', label: 'Unit Deployed' },
              { color: '#3DAA6A', label: 'Unit Available' },
            ].map(l => (
              <div key={l.label} className="flex items-center gap-[7px]">
                <div className="w-[10px] h-[10px] rounded-full shrink-0 border-[1.5px] border-white" style={{ background: l.color, boxShadow: '0 0 0 1px ' + l.color }} />
                <span className="text-[11px] text-[#3C4043]" style={{ fontFamily: 'var(--font-body)' }}>{l.label}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Right panel */}
        <div className="dispatch-map-right">
          <div className="flex-1 flex flex-col overflow-hidden">
            <div className="px-3 pt-[11px] pb-[7px] flex items-center justify-between shrink-0">
              <span className="text-[13px] font-bold tracking-[0.04em]" style={{ fontFamily: 'var(--font-display)' }}>ACTIVE UNITS</span>
              <span className="text-[11px] text-(--text-muted)" style={{ fontFamily: 'var(--font-mono)' }}>{mockUnits.length} total</span>
            </div>
            <div className="flex px-3 pb-2 gap-1 shrink-0">
              {['All', 'Deployed', 'Available', 'Offline'].map(tab => (
                <button key={tab} onClick={() => setUnitFilter(tab)}
                  className="text-[10px] font-bold px-2 py-[3px] rounded tracking-[0.05em] uppercase cursor-pointer transition-colors"
                  style={{
                    fontFamily: 'var(--font-body)',
                    background: unitFilter === tab ? 'var(--accent-ghost)' : 'transparent',
                    color: unitFilter === tab ? 'var(--accent)' : 'var(--text-muted)',
                    border: unitFilter === tab ? '1px solid var(--accent)' : '1px solid transparent',
                  }}>
                  {tab}
                </button>
              ))}
            </div>
            <div className="flex-1 overflow-y-auto">
              {filteredUnits.map(unit => <UnitCard key={unit.vehicle_id} unit={unit} onAssign={() => {}} />)}
            </div>
          </div>
        </div>
      </div>

      {criticalIncident && (
        <Link
          to={`/dispatcher/dispatch-immediate/${criticalIncident.incident_ref}`}
          className="dispatch-immediate-fab fixed z-50 inline-flex items-center gap-2 no-underline font-bold text-[12px] uppercase tracking-wide transition-opacity hover:opacity-90"
          style={{
            bottom: '2rem',
            right: '1.5rem',
            padding: '0.75rem 1.25rem',
            borderRadius: 8,
            background: 'var(--status-critical)',
            color: 'var(--text-on-accent)',
            boxShadow: '0 4px 20px color-mix(in srgb, var(--status-critical) 40%, transparent)',
            fontFamily: 'var(--font-display)',
          }}
        >
          <Zap size={16} />
          Dispatch Immediate
        </Link>
      )}

      {showImmediateModal && (
        <ImmediateDispatchModal
          onClose={() => setShowImmediateModal(false)}
          onSelect={handleImmediateTypeSelect}
        />
      )}
    </div>
  )
}

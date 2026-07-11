import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useCallChannelStore } from '../../store/callChannelStore'
import { MapContainer, TileLayer, CircleMarker, Tooltip } from 'react-leaflet'
import { useThemeStore } from '../../store/themeStore'
import {
  Radio, Ambulance, Truck, ShieldCheck, Bus, Zap, X, PhoneIncoming,
  ShieldAlert, AlertTriangle, Flame, Heart, Car, Users, User, Bell, MapPin,
} from 'lucide-react'
import { IMMEDIATE_INCIDENT_TYPES } from '../../data/mockDispatchImmediateData'
import RwandaBoundsEnforcer from '../../components/map/RwandaBoundsEnforcer'
import MapInvalidateSize from '../../components/map/MapInvalidateSize'
import { RWANDA_CENTER, RWANDA_BOUNDS, RWANDA_MIN_ZOOM, RWANDA_MAX_ZOOM } from '../../components/map/rwandaConstants'
import { listIncidents } from '../../api/incidents'
import { listVehicles } from '../../api/vehicles'
import { listDistricts } from '../../api/districts'
import { createDispatch } from '../../api/dispatches'
import SearchableSelect from '../../components/ui/SearchableSelect'
import 'leaflet/dist/leaflet.css'

const SEV_COLOR    = { critical: '#E8354A', high: '#F07820', medium: '#D4A017', low: '#3DAA6A' }
const STATUS_COLOR = { deployed: '#2196C8', available: '#3DAA6A', idle: '#D4A017', offline: '#5A6478' }

function vehicleTypeColor(type) {
  const t = (type ?? '').toUpperCase()
  if (t.includes('AMBULANCE'))                      return '#2196C8'
  if (t.includes('FIRE') || t.includes('DISASTER')) return '#E8354A'
  if (t.includes('TACTICAL'))                       return '#F07820'
  if (t.includes('POLICE'))                         return '#D4A017'
  return '#5A6478'
}

function vehicleTypeName(type) {
  const t = (type ?? '').toUpperCase()
  if (t.includes('AMBULANCE'))  return 'Ambulance'
  if (t.includes('FIRE'))       return 'Fire Truck'
  if (t.includes('DISASTER'))   return 'Disaster Unit'
  if (t.includes('TACTICAL'))   return 'Tactical Unit'
  if (t.includes('POLICE'))     return 'Police'
  return 'Unit'
}

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
  const t = (type ?? '').toUpperCase()
  if (t.includes('AMBULANCE'))                       return <Ambulance   {...p} color="#2196C8" />
  if (t.includes('FIRE') || t.includes('DISASTER'))  return <Truck       {...p} color="#E8354A" />
  if (t.includes('TACTICAL'))                        return <Zap         {...p} color="#9B59B6" />
  if (t.includes('POLICE'))                          return <ShieldCheck {...p} color="#D4A017" />
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
          <span className="w-2 h-2 rounded-full inline-block shrink-0" style={{ background: STATUS_COLOR[unit.status] || '#5A6478' }} />
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

function AssignUnitModal({ unit, incidents, onClose, onAssigned }) {
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')

  const openIncidents = incidents.filter(
    (i) => !['CLOSED', 'PENDING_REPORT', 'RESOLVED', 'resolved'].includes(i.status)
  )

  const assign = async (incident) => {
    if (busy) return
    setBusy(true)
    setError('')
    try {
      await createDispatch({
        incidentId: incident.incident_id,
        vehicleId: unit.vehicle_id,
        aiRecommended: false,
        overridden: false,
      })
      onAssigned(unit, incident)
    } catch (err) {
      setError(err?.response?.data?.message ?? 'Dispatch failed. Please retry.')
      setBusy(false)
    }
  }

  return (
    <div
      className="fixed inset-0 z-[99999] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
      onClick={(e) => { if (e.target === e.currentTarget) onClose() }}
    >
      <div
        className="w-full max-w-[520px] rounded-2xl border border-(--border) overflow-hidden"
        style={{ background: 'var(--bg-surface)', boxShadow: 'var(--shadow-modal)' }}
      >
        <div className="flex items-center justify-between px-5 py-4 border-b border-(--border)">
          <div>
            <div className="text-[11px] font-bold uppercase tracking-[0.1em] text-(--accent)" style={{ fontFamily: 'var(--font-display)' }}>
              Assign unit {unit.id}
            </div>
            <div className="text-[12px] text-(--text-secondary)">Select the incident this unit should respond to</div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-lg flex items-center justify-center border border-(--border) bg-transparent cursor-pointer text-(--text-muted) hover:text-(--text-primary) transition-colors"
          >
            <X size={16} />
          </button>
        </div>

        <div className="max-h-[340px] overflow-y-auto">
          {openIncidents.length === 0 ? (
            <div className="py-10 text-center text-[13px] text-(--text-muted)">
              No open incidents. Create one from “New Incident” first.
            </div>
          ) : openIncidents.map((inc) => (
            <button
              key={inc.incident_id}
              type="button"
              disabled={busy}
              onClick={() => assign(inc)}
              className="w-full flex items-center gap-3 px-5 py-3 border-b border-(--border-subtle) bg-transparent cursor-pointer text-left hover:bg-(--bg-elevated) transition-colors disabled:opacity-50"
            >
              <span
                className="w-2.5 h-2.5 rounded-full shrink-0"
                style={{ background: SEV_COLOR[inc.severity] ?? SEV_COLOR.medium }}
              />
              <span className="text-[12px] font-semibold text-(--accent) shrink-0" style={{ fontFamily: 'var(--font-mono)' }}>
                {inc.incident_ref}
              </span>
              <span className="text-[13px] text-(--text-primary) flex-1 min-w-0 overflow-hidden text-ellipsis whitespace-nowrap">
                {inc.incident_type} · {inc.district ?? inc.address ?? '—'}
              </span>
              <span className="text-[11px] text-(--text-muted) shrink-0 uppercase">{inc.status}</span>
            </button>
          ))}
        </div>

        {error && (
          <p className="text-[12px] px-5 py-2 m-0" style={{ color: 'var(--status-critical)' }}>{error}</p>
        )}
        <div className="px-5 py-3 text-[11px] text-(--text-muted) border-t border-(--border)">
          {busy ? 'Dispatching…' : 'The dispatch is recorded immediately and the unit is marked deployed.'}
        </div>
      </div>
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
  const { simulateCall } = useCallChannelStore()
  const [districtFilter, setDistrictFilter] = useState('All')
  const [allDistricts, setAllDistricts] = useState([])
  const [liveTime, setLiveTime] = useState(new Date())
  const [showImmediateModal, setShowImmediateModal] = useState(false)
  const [incidents, setIncidents] = useState([])
  const [vehicles, setVehicles] = useState([])
  const [assignUnit, setAssignUnit] = useState(null)
  const [assignToast, setAssignToast] = useState(null)

  useEffect(() => {
    const t = setInterval(() => setLiveTime(new Date()), 30000)
    return () => clearInterval(t)
  }, [])

  useEffect(() => {
    listIncidents().then(setIncidents).catch(() => {})
    listVehicles({ status: 'AVAILABLE' }).then(setVehicles).catch(() => {})
    listDistricts().then(setAllDistricts).catch(() => {})
  }, [])

  const deployed  = 0  // only available units are fetched; deployed shown in KPI but sourced elsewhere
  const available = vehicles.length

  const districtOptions = [
    { value: 'All', label: 'All Districts', icon: MapPin },
    ...allDistricts
      .sort((a, b) => a.name.localeCompare(b.name))
      .map(d => ({ value: d.district_id, label: d.name, icon: MapPin })),
  ]

  const filteredUnits = vehicles.filter(u =>
    districtFilter === 'All' || u.district_id === districtFilter
  )

  const handleImmediateTypeSelect = (type) => {
    setShowImmediateModal(false)
    navigate('/dispatcher/dispatch-immediate/NEW', { state: { immediateType: type } })
  }

  const handleUnitAssigned = (unit, incident) => {
    setAssignUnit(null)
    setAssignToast(`${unit.id} dispatched to ${incident.incident_ref}`)
    setTimeout(() => setAssignToast(null), 4000)
    // Refresh so the unit's status/positions reflect the new dispatch
    listVehicles({ status: 'AVAILABLE' }).then(setVehicles).catch(() => {})
    listIncidents().then(setIncidents).catch(() => {})
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
          <button
            type="button"
            onClick={simulateCall}
            className="inline-flex items-center gap-1.5 px-2.5 h-7 rounded-lg cursor-pointer text-[10px] font-bold uppercase tracking-wide"
            style={{
              background: 'var(--accent-ghost)',
              color: 'var(--accent)',
              border: '1px solid var(--accent)',
              fontFamily: 'var(--font-display)',
            }}
            title="Simulate an incoming call"
          >
            <PhoneIncoming size={11} />
            Simulate Call
          </button>
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
            {vehicles.filter(u => u.status !== 'offline' && u.current_lat && u.current_lng).map(unit => (
              <CircleMarker
                key={unit.vehicle_id}
                center={[unit.current_lat, unit.current_lng]}
                radius={unit.status === 'available' ? 7 : 5}
                pathOptions={{
                  color: '#fff',
                  fillColor: vehicleTypeColor(unit.vehicle_type),
                  fillOpacity: unit.status === 'available' ? 1 : 0.65,
                  weight: 1.5,
                }}
              >
                <Tooltip>
                  <strong>{unit.id}</strong> — {vehicleTypeName(unit.vehicle_type)}<br />
                  {unit.status} · {unit.location}
                </Tooltip>
              </CircleMarker>
            ))}
          </MapContainer>
          </div>

          {/* Legend — units only */}
          <div
            className="absolute bottom-4 left-4 z-[1000] rounded-lg px-[14px] py-[10px] flex flex-col gap-[4px] shadow-md"
            style={{ background: 'var(--bg-surface)', border: '1px solid var(--border)' }}
          >
            <div className="text-[10px] font-bold tracking-[0.08em] mb-0.5" style={{ color: 'var(--text-muted)', fontFamily: 'var(--font-display)' }}>UNITS</div>
            {[
              { color: '#2196C8', label: 'Ambulance' },
              { color: '#D4A017', label: 'Police' },
              { color: '#E8354A', label: 'Fire / Rescue' },
              { color: '#F07820', label: 'Tactical' },
              { color: '#5A6478', label: 'Other' },
            ].map(l => (
              <div key={l.label} className="flex items-center gap-[7px]">
                <div className="shrink-0 rounded-full border-[1.5px] border-white" style={{ width: 8, height: 8, background: l.color, boxShadow: '0 0 0 1px ' + l.color }} />
                <span className="text-[11px]" style={{ color: 'var(--text-secondary)', fontFamily: 'var(--font-body)' }}>{l.label}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Right panel */}
        <div className="dispatch-map-right">
          <div className="flex-1 flex flex-col overflow-hidden">
            <div className="px-3 pt-[11px] pb-[7px] flex items-center justify-between shrink-0">
              <span className="text-[13px] font-bold tracking-[0.04em]" style={{ fontFamily: 'var(--font-display)' }}>AVAILABLE UNITS</span>
              <span className="text-[11px] text-(--text-muted)" style={{ fontFamily: 'var(--font-mono)' }}>
                {filteredUnits.length}/{vehicles.length}
              </span>
            </div>

            {/* District filter */}
            <div className="px-3 pb-1.5 shrink-0">
              <SearchableSelect
                options={districtOptions}
                value={districtFilter}
                onChange={setDistrictFilter}
                placeholder="All Districts"
              />
            </div>

            <div className="flex-1 overflow-y-auto">
              {filteredUnits.map(unit => (
                <UnitCard
                  key={unit.vehicle_id}
                  unit={unit}
                  onAssign={(u) => {
                    if (u.status === 'available' || u.status === 'deployed') setAssignUnit(u)
                  }}
                />
              ))}
            </div>
          </div>
        </div>
      </div>


      {showImmediateModal && (
        <ImmediateDispatchModal
          onClose={() => setShowImmediateModal(false)}
          onSelect={handleImmediateTypeSelect}
        />
      )}

      {assignUnit && (
        <AssignUnitModal
          unit={assignUnit}
          incidents={incidents}
          onClose={() => setAssignUnit(null)}
          onAssigned={handleUnitAssigned}
        />
      )}

      {assignToast && (
        <div
          className="fixed bottom-6 right-6 z-[99999] px-4 py-2.5 rounded-lg text-[13px] font-semibold text-white"
          style={{ background: 'var(--status-low, #3DAA6A)', boxShadow: '0 4px 12px rgba(0,0,0,0.3)', fontFamily: 'var(--font-display)' }}
        >
          {assignToast}
        </div>
      )}
    </div>
  )
}

import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { MapContainer, TileLayer, CircleMarker, Tooltip } from 'react-leaflet'
import { useThemeStore } from '../../store/themeStore'
import { Radio, Ambulance, Truck, ShieldCheck, Bus, Zap } from 'lucide-react'
import { getCriticalUnassignedIncident } from '../../data/mockDispatchImmediateData'
import RwandaBoundsEnforcer from '../../components/map/RwandaBoundsEnforcer'
import { RWANDA_CENTER, RWANDA_BOUNDS, RWANDA_MIN_ZOOM, RWANDA_MAX_ZOOM } from '../../components/map/rwandaConstants'
import { mockIncidents, mockUnits } from '../../data/mockData'
import 'leaflet/dist/leaflet.css'

const SEV_COLOR  = { critical: '#E8354A', high: '#F07820', medium: '#D4A017', low: '#3DAA6A' }
const UNIT_COLOR = { deployed: '#2196C8', available: '#3DAA6A', idle: '#D4A017', offline: '#5A6478' }

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
        <UnitTypeIcon type={unit.type} />
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

export default function LiveDispatchMap() {
  const { theme } = useThemeStore()
  const [unitFilter, setUnitFilter] = useState('All')
  const [liveTime, setLiveTime] = useState(new Date())

  useEffect(() => {
    const t = setInterval(() => setLiveTime(new Date()), 30000)
    return () => clearInterval(t)
  }, [])

  const deployed      = mockUnits.filter(u => u.status === 'deployed').length
  const available     = mockUnits.filter(u => u.status === 'available').length
  const filteredUnits = (unitFilter === 'All' ? mockUnits : mockUnits.filter(u => u.status === unitFilter.toLowerCase())).slice(0, 5)
  const criticalIncident = getCriticalUnassignedIncident()

  return (
    <div className="flex flex-col h-full relative">

      {/* Status bar */}
      <div className="h-[46px] bg-(--bg-surface) border-b border-(--border) flex items-center px-1.5 shrink-0">
        <KpiPill label="Units Deployed"  value={deployed}  color="#2196C8" />
        <KpiPill label="Units Available" value={available} color="#3DAA6A" />
        <KpiPill label="Avg Response"    value="7.2m"      color="var(--accent)" />
        <KpiPill label="Coverage"        value="84%"       color="var(--accent)" />
        <div className="ml-auto px-3.5 flex items-center gap-2">
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
      <div className="flex flex-1 overflow-hidden">

        {/* Map */}
        <div className="flex-1 relative">
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
            <TileLayer
              url={theme === 'dark'
                ? 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png'
                : 'https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png'
              }
              attribution='&copy; <a href="https://carto.com/">CARTO</a> &copy; <a href="https://www.openstreetmap.org/">OSM</a>'
              className={theme === 'dark' ? 'map-dark-tiles' : ''}
            />
            <RwandaBoundsEnforcer />
            {mockIncidents.filter(i => i.status !== 'resolved').map(inc => (
              <CircleMarker key={inc.id} center={[inc.lat, inc.lng]} radius={9}
                pathOptions={{ color: '#fff', fillColor: SEV_COLOR[inc.severity], fillOpacity: 1, weight: 2 }}>
                <Tooltip>
                  <strong>{inc.id}</strong> — {inc.type}<br />
                  {inc.district}, {inc.sector} · {inc.elapsed}
                </Tooltip>
              </CircleMarker>
            ))}
            {mockUnits.filter(u => u.status !== 'offline').map(unit => (
              <CircleMarker key={unit.id} center={[unit.lat, unit.lng]} radius={6}
                pathOptions={{ color: '#fff', fillColor: UNIT_COLOR[unit.status], fillOpacity: 1, weight: 1.5 }}>
                <Tooltip>
                  <strong>{unit.id}</strong> — {unit.type}<br />
                  {unit.status} · {unit.location}
                </Tooltip>
              </CircleMarker>
            ))}
          </MapContainer>

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
        <div className="w-[316px] bg-(--bg-surface) border-l border-(--border) flex flex-col overflow-hidden shrink-0">
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
              {filteredUnits.map(unit => <UnitCard key={unit.id} unit={unit} onAssign={() => {}} />)}
            </div>
          </div>
        </div>
      </div>

      {criticalIncident && (
        <Link
          to={`/dispatcher/dispatch-immediate/${criticalIncident.id}`}
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
    </div>
  )
}

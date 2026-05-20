import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { MapContainer, TileLayer, Marker, useMapEvents } from 'react-leaflet'
import L from 'leaflet'
import {
  Phone,
  MapPin,
  Search,
  Brain,
  Zap,
  UserRound,
} from 'lucide-react'
import RwandaBoundsEnforcer from '../../components/map/RwandaBoundsEnforcer'
import { RWANDA_BOUNDS, RWANDA_MIN_ZOOM, RWANDA_MAX_ZOOM } from '../../components/map/rwandaConstants'
import { useThemeStore } from '../../store/themeStore'
import { mockRecentCalls } from '../../data/mockData'
import 'leaflet/dist/leaflet.css'

const INCIDENT_CATEGORIES = [
  'Medical',
  'Traffic / MVA',
  'Fire',
  'Security',
  'Disaster',
  'Infrastructure',
  'Other',
]

const PRIORITIES = [
  { id: 'critical', label: 'CRITICAL', color: 'var(--status-critical)' },
  { id: 'high', label: 'HIGH', color: 'var(--status-high)' },
  { id: 'medium', label: 'MID', color: 'var(--status-info)' },
]

function LocationPicker({ onPick }) {
  useMapEvents({
    click: (e) => onPick([e.latlng.lat, e.latlng.lng]),
  })
  return null
}

function makeSessionId() {
  const part = () => Math.random().toString(36).slice(2, 6).toUpperCase()
  return `RSE-${part()}-${part().slice(0, 2)}`
}

/** Card shell: theme-aware (surface + border; light mode picks up shadow token). */
function IntakePanel({ children, className = '' }) {
  return (
    <div
      className={`rounded-xl border border-(--border) bg-(--bg-surface) shadow-[var(--shadow-card)] ${className}`}
      style={{ fontFamily: 'var(--font-body)' }}
    >
      {children}
    </div>
  )
}

export default function NewIncident() {
  const navigate = useNavigate()
  const { theme } = useThemeStore()
  const sessionId = useMemo(() => makeSessionId(), [])

  const [callerPhone, setCallerPhone] = useState('')
  const [callerName, setCallerName] = useState('')
  const [category, setCategory] = useState('')
  const [priority, setPriority] = useState('high')
  const [summary, setSummary] = useState('')
  const [victims, setVictims] = useState(0)
  const [hazardPct, setHazardPct] = useState(0)
  const [addressQuery, setAddressQuery] = useState('')
  const [pin, setPin] = useState([-1.9441, 30.0619])

  const pinColor = theme === 'dark' ? '#D4FF1E' : '#5C6B19'

  const pinIcon = useMemo(
    () =>
      L.divIcon({
        html: `<div style="width:18px;height:18px;border-radius:50%;background:${pinColor};border:3px solid #fff;box-shadow:0 2px 10px rgba(0,0,0,0.35)"></div>`,
        className: '',
        iconAnchor: [9, 9],
      }),
    [pinColor],
  )

  const hazardLabel =
    hazardPct <= 0
      ? 'No chemical or fire hazards reported.'
      : hazardPct < 40
        ? 'Minor environmental risk noted.'
        : hazardPct < 75
          ? 'Moderate hazard — confirm with caller.'
          : 'High hazard — expedite units and HAZMAT if needed.'

  const handleLogIncident = (e) => {
    e.preventDefault()
    navigate('/dispatcher/queue')
  }

  const handleInitAi = () => navigate('/dispatcher/ai-engine')

  const victimIcons = [0, 1, 2].map((i) => {
    const active = victims > i
    return (
      <UserRound
        key={i}
        size={18}
        strokeWidth={2}
        className="shrink-0"
        style={{
          color: active ? 'var(--accent)' : 'var(--text-muted)',
          opacity: active ? 1 : 0.35,
        }}
        aria-hidden
      />
    )
  })

  return (
    <div className="min-h-full bg-(--bg-base) flex flex-col">
      {/* Page header */}
      <header className="shrink-0 px-5 md:px-6 pt-6 pb-4 border-b border-(--border)">
        <div className="max-w-[1600px] mx-auto flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <h1
              className="text-2xl md:text-[28px] font-bold text-(--text-primary) m-0 tracking-tight"
              style={{ fontFamily: 'var(--font-display)' }}
            >
              New Incident Intake
            </h1>
            <p className="text-[13px] text-(--text-secondary) mt-1.5 m-0">
              Capture caller details, location, and context before dispatch.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <span
              className="inline-flex items-center px-3 py-1.5 rounded-md border text-[10px] font-bold tracking-[0.12em] uppercase text-(--accent) bg-(--accent-ghost)"
              style={{ borderColor: 'var(--accent)', fontFamily: 'var(--font-display)' }}
            >
              Voice transcript active
            </span>
            <span
              className="inline-flex items-center px-3 py-1.5 rounded-md border border-(--border) text-[11px] font-medium text-(--text-muted)"
              style={{ fontFamily: 'var(--font-mono)' }}
            >
              ID: {sessionId}
            </span>
          </div>
        </div>
      </header>

      <form
        onSubmit={handleLogIncident}
        className="flex-1 min-h-0 max-w-[1600px] w-full mx-auto px-5 md:px-6 py-5 grid grid-cols-1 xl:grid-cols-12 gap-5 xl:gap-6"
      >
        {/* ── Left column ── */}
        <div className="xl:col-span-4 flex flex-col gap-4 min-w-0">
          {/* Caller information */}
          <IntakePanel>
            <div className="flex min-h-[120px]">
              <div className="w-1 shrink-0 bg-(--accent) rounded-l-xl" aria-hidden />
              <div className="flex-1 p-4 md:p-5">
                <div className="flex items-center gap-2 text-[10px] font-bold tracking-[0.14em] text-(--text-secondary) uppercase mb-4">
                  <Phone size={14} className="text-(--accent) shrink-0" />
                  Caller information
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label
                      htmlFor="caller-phone"
                      className="text-[10px] font-bold text-(--text-muted) uppercase tracking-wider block mb-1.5"
                    >
                      Phone number
                    </label>
                    <input
                      id="caller-phone"
                      type="tel"
                      placeholder="+250 -- -- --"
                      value={callerPhone}
                      onChange={(e) => setCallerPhone(e.target.value)}
                      className="w-full h-10 rounded-lg px-3 text-[13px] text-(--text-primary) bg-(--bg-input) border border-(--border) outline-none placeholder:text-(--text-muted) focus:border-(--accent) focus:shadow-[0_0_0_3px_var(--accent-ghost)]"
                    />
                  </div>
                  <div>
                    <label
                      htmlFor="caller-name"
                      className="text-[10px] font-bold text-(--text-muted) uppercase tracking-wider block mb-1.5"
                    >
                      Caller name
                    </label>
                    <input
                      id="caller-name"
                      type="text"
                      placeholder="Unknown / Anonymous"
                      value={callerName}
                      onChange={(e) => setCallerName(e.target.value)}
                      className="w-full h-10 rounded-lg px-3 text-[13px] text-(--text-primary) bg-(--bg-input) border border-(--border) outline-none placeholder:text-(--text-muted) focus:border-(--accent) focus:shadow-[0_0_0_3px_var(--accent-ghost)]"
                    />
                  </div>
                </div>
              </div>
            </div>
          </IntakePanel>

          {/* Class + priority */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <IntakePanel className="p-4 md:p-5">
              <div className="text-[10px] font-bold text-(--text-muted) uppercase tracking-wider mb-2">
                Incident class
              </div>
              <label htmlFor="incident-class" className="sr-only">
                Incident category
              </label>
              <select
                id="incident-class"
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full h-10 rounded-lg px-3 text-[13px] text-(--text-primary) bg-(--bg-input) border border-(--border) outline-none cursor-pointer focus:border-(--accent)"
              >
                <option value="">Select category</option>
                {INCIDENT_CATEGORIES.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </IntakePanel>

            <IntakePanel className="p-4 md:p-5">
              <div className="text-[10px] font-bold text-(--text-muted) uppercase tracking-wider mb-2">
                Priority level
              </div>
              <div className="flex gap-1.5" role="group" aria-label="Priority level">
                {PRIORITIES.map((p) => {
                  const active = priority === p.id
                  return (
                    <button
                      key={p.id}
                      type="button"
                      onClick={() => setPriority(p.id)}
                      className="flex-1 min-h-10 px-1 py-2 rounded-lg text-[9px] sm:text-[10px] font-bold tracking-wide uppercase border transition-colors"
                      style={{
                        fontFamily: 'var(--font-display)',
                        borderColor: active ? p.color : 'var(--border)',
                        color: active ? p.color : 'var(--text-muted)',
                        background: active ? `color-mix(in srgb, ${p.color} 18%, transparent)` : 'var(--bg-input)',
                        boxShadow: theme === 'dark' || !active ? 'none' : `0 0 0 1px ${p.color}`,
                      }}
                    >
                      {p.label}
                    </button>
                  )
                })}
              </div>
            </IntakePanel>
          </div>

          {/* Situation summary */}
          <IntakePanel className="p-4 md:p-5 flex flex-col flex-1 min-h-[200px]">
            <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
              <span className="text-[10px] font-bold text-(--text-muted) uppercase tracking-wider">
                Situation summary
              </span>
              <span className="text-[10px] font-bold text-(--accent) uppercase tracking-[0.12em]">
                Auto-save active
              </span>
            </div>
            <textarea
              placeholder="Start typing dispatcher notes here. Describe the situation, injuries, and environmental hazards."
              value={summary}
              onChange={(e) => setSummary(e.target.value)}
              className="flex-1 min-h-[140px] w-full rounded-lg px-3 py-2.5 text-[13px] text-(--text-primary) bg-(--bg-input) border border-(--border) outline-none resize-y placeholder:text-(--text-muted) focus:border-(--accent) focus:shadow-[0_0_0_3px_var(--accent-ghost)]"
            />
          </IntakePanel>

          {/* Victims + hazard */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <IntakePanel className="p-4 md:p-5">
              <div className="text-[10px] font-bold text-(--text-muted) uppercase tracking-wider mb-3">
                Estimated victims
              </div>
              <div className="flex items-center gap-3">
                <input
                  type="number"
                  min={0}
                  max={999}
                  value={victims}
                  onChange={(e) => setVictims(Math.max(0, Number(e.target.value) || 0))}
                  className="w-16 h-10 rounded-lg text-center text-[14px] font-bold text-(--text-primary) bg-(--bg-input) border border-(--border) outline-none focus:border-(--accent)"
                  aria-label="Estimated number of victims"
                />
                <div className="flex items-center gap-1">{victimIcons}</div>
              </div>
            </IntakePanel>

            <IntakePanel className="p-4 md:p-5">
              <div className="text-[10px] font-bold text-(--text-muted) uppercase tracking-wider mb-3">
                Hazard level
              </div>
              <label htmlFor="hazard-level" className="sr-only">
                Hazard level
              </label>
              <input
                id="hazard-level"
                type="range"
                min={0}
                max={100}
                value={hazardPct}
                onChange={(e) => setHazardPct(Number(e.target.value))}
                className="w-full h-2 rounded-full appearance-none cursor-pointer accent-(--accent) bg-(--bg-elevated)"
                style={{
                  background: `linear-gradient(to right, var(--accent) 0%, var(--accent) ${hazardPct}%, var(--bg-elevated) ${hazardPct}%, var(--bg-elevated) 100%)`,
                }}
              />
              <p className="text-[11px] text-(--text-secondary) m-0 mt-2 leading-snug">{hazardLabel}</p>
            </IntakePanel>
          </div>

          <div className="flex flex-wrap gap-2 pt-1">
            <button
              type="button"
              onClick={() => navigate('/dispatcher')}
              className="px-4 py-2.5 rounded-lg border border-(--border) bg-transparent text-(--text-primary) text-[13px] font-semibold cursor-pointer hover:bg-(--bg-elevated) transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2.5 rounded-lg border-none bg-(--accent) text-(--text-on-accent) text-[13px] font-bold tracking-wide uppercase cursor-pointer hover:bg-(--accent-dim) transition-colors"
              style={{ fontFamily: 'var(--font-display)' }}
            >
              Log incident
            </button>
          </div>
        </div>

        {/* ── Middle column ── */}
        <div className="xl:col-span-5 flex flex-col gap-4 min-w-0">
          <IntakePanel className="overflow-hidden flex flex-col">
            <div className="p-4 md:p-5 border-b border-(--border-subtle)">
              <div className="flex items-center gap-2 text-[10px] font-bold tracking-[0.14em] text-(--text-secondary) uppercase">
                <MapPin size={14} className="text-(--accent) shrink-0" />
                Incident location
              </div>
              <div className="relative mt-3">
                <Search
                  size={14}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-(--text-muted) pointer-events-none"
                />
                <input
                  type="search"
                  placeholder="Search address…"
                  value={addressQuery}
                  onChange={(e) => setAddressQuery(e.target.value)}
                  className="w-full h-10 rounded-lg pl-9 pr-3 text-[13px] text-(--text-primary) bg-(--bg-input) border border-(--border) outline-none placeholder:text-(--text-muted) focus:border-(--accent)"
                />
              </div>
            </div>
            <div className="relative h-[min(320px,42vw)] min-h-[220px] w-full bg-(--bg-elevated)">
              <MapContainer
                center={pin}
                zoom={13}
                minZoom={RWANDA_MIN_ZOOM}
                maxZoom={RWANDA_MAX_ZOOM}
                maxBounds={RWANDA_BOUNDS}
                maxBoundsViscosity={1.0}
                style={{
                  width: '100%',
                  height: '100%',
                  background: theme === 'dark' ? '#040D1F' : '#E8EAED',
                }}
                zoomControl={false}
              >
                <TileLayer
                  url={
                    theme === 'dark'
                      ? 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png'
                      : 'https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png'
                  }
                  attribution='&copy; <a href="https://carto.com/">CARTO</a> &copy; <a href="https://www.openstreetmap.org/">OSM</a>'
                  className={theme === 'dark' ? 'map-dark-tiles' : ''}
                />
                <RwandaBoundsEnforcer />
                <LocationPicker onPick={setPin} />
                <Marker position={pin} icon={pinIcon} />
              </MapContainer>
              <div
                className="absolute bottom-3 left-3 right-3 flex justify-center pointer-events-none"
              >
                <div
                  className="px-3 py-1.5 rounded-md border border-(--border) bg-(--bg-surface) backdrop-blur-sm text-[11px] font-medium text-(--accent) shadow-[var(--shadow-card)] opacity-[0.97]"
                  style={{ fontFamily: 'var(--font-mono)' }}
                >
                  GPS: {pin[0].toFixed(4)}, {pin[1].toFixed(4)}
                </div>
              </div>
            </div>
          </IntakePanel>

          <IntakePanel className="p-4 md:p-5">
            <div className="flex items-start gap-3 mb-4">
              <div
                className="w-11 h-11 rounded-xl flex items-center justify-center shrink-0 bg-(--accent-ghost) border border-(--accent)"
                style={{ color: 'var(--accent)' }}
              >
                <Brain size={22} strokeWidth={1.75} />
              </div>
              <div>
                <h2 className="text-[15px] font-bold text-(--text-primary) m-0" style={{ fontFamily: 'var(--font-display)' }}>
                  Sentinel AI analysis
                </h2>
                <p className="text-[12px] text-(--text-secondary) m-0 mt-1">
                  Pre-calculate unit response and risk factor
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={handleInitAi}
              className={`w-full flex items-center justify-center gap-2 min-h-[48px] rounded-xl border-none bg-(--accent) text-(--text-on-accent) text-[13px] font-bold tracking-[0.08em] uppercase cursor-pointer hover:bg-(--accent-dim) transition-colors${theme === 'dark' ? '' : ' shadow-[0_4px_24px_color-mix(in_srgb,var(--accent)_35%,transparent)]'}`}
              style={{ fontFamily: 'var(--font-display)' }}
            >
              <Zap size={18} strokeWidth={2.5} />
              Initialize AI analysis
            </button>
            <div className="flex flex-wrap justify-between gap-3 mt-4 pt-4 border-t border-(--border-subtle)">
              <div className="text-[11px] text-(--text-muted) uppercase tracking-wider">
                Est. response:{' '}
                <span className="text-(--text-primary) font-semibold normal-case tracking-normal" style={{ fontFamily: 'var(--font-mono)' }}>
                  4m 20s
                </span>
              </div>
              <div className="text-[11px] text-(--text-muted) uppercase tracking-wider">
                Reliability:{' '}
                <span className="text-(--text-primary) font-semibold">98%</span>
              </div>
            </div>
          </IntakePanel>
        </div>

        {/* ── Right column ── */}
        <div className="xl:col-span-3 flex flex-col min-h-0 min-w-0">
          <IntakePanel className="flex flex-col flex-1 xl:max-h-[calc(100vh-8rem)] min-h-[320px] overflow-hidden">
            <div className="px-4 py-3 md:px-5 border-b border-(--border-subtle) flex items-center gap-2 shrink-0">
              <span
                className="w-2 h-2 rounded-full shrink-0"
                style={{ background: 'var(--accent)', boxShadow: '0 0 8px var(--accent)' }}
              />
              <h2
                className="text-[11px] font-bold tracking-[0.14em] text-(--text-primary) uppercase m-0"
                style={{ fontFamily: 'var(--font-display)' }}
              >
                Recent logged calls
              </h2>
            </div>
            <ul className="overflow-y-auto flex-1 list-none m-0 p-2 md:p-3 space-y-2">
              {mockRecentCalls.map((call) => (
                <li key={call.id}>
                  <button
                    type="button"
                    className={`w-full text-left rounded-lg border transition-colors overflow-hidden flex ${
                      call.active
                        ? `border-(--accent) bg-(--accent-ghost)${theme === 'dark' ? '' : ' shadow-[0_0_0_1px_color-mix(in_srgb,var(--accent)_40%,transparent)]'}`
                        : 'border-(--border) bg-(--bg-elevated)/50 hover:bg-(--bg-elevated)'
                    }`}
                  >
                    {call.active && <span className="w-1 shrink-0 bg-(--accent)" aria-hidden />}
                    <div className="flex-1 p-3">
                      <div className="flex justify-between gap-2 items-baseline mb-1">
                        <span
                          className="text-[12px] font-bold text-(--accent)"
                          style={{ fontFamily: 'var(--font-mono)' }}
                        >
                          {call.id}
                        </span>
                        <span className="text-[10px] text-(--text-muted)" style={{ fontFamily: 'var(--font-mono)' }}>
                          {call.time}
                        </span>
                      </div>
                      <div className="text-[13px] font-semibold text-(--text-primary) leading-snug">
                        {call.title}
                      </div>
                      <p className="text-[11px] text-(--text-secondary) m-0 mt-1 line-clamp-2 leading-snug">
                        {call.summary}
                      </p>
                      {call.resolved && (
                        <span className="inline-block mt-2 text-[9px] font-bold uppercase tracking-wider text-(--status-low)">
                          Resolved
                        </span>
                      )}
                    </div>
                  </button>
                </li>
              ))}
            </ul>
            <div className="p-3 md:p-4 border-t border-(--border-subtle) shrink-0">
              <button
                type="button"
                onClick={() => navigate('/dispatcher/history')}
                className="w-full py-2.5 rounded-lg border border-(--border) bg-transparent text-(--text-primary) text-[11px] font-bold tracking-[0.12em] uppercase cursor-pointer hover:bg-(--bg-elevated) transition-colors"
                style={{ fontFamily: 'var(--font-display)' }}
              >
                View all archives
              </button>
            </div>
          </IntakePanel>
        </div>
      </form>
    </div>
  )
}

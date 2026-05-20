import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { MapContainer, TileLayer, Marker, useMapEvents } from 'react-leaflet'
import L from 'leaflet'
import { ChevronRight, Bot, MapPin, Stethoscope, Car, Flame, ShieldAlert, CloudLightning, MoreHorizontal, Phone, User, Send, X } from 'lucide-react'
import RwandaBoundsEnforcer from '../../components/map/RwandaBoundsEnforcer'
import { RWANDA_BOUNDS, RWANDA_MIN_ZOOM, RWANDA_MAX_ZOOM } from '../../components/map/rwandaConstants'

const INCIDENT_TYPES = [
  { id: 'medical',  label: 'Medical',  Icon: Stethoscope,    color: '#2196C8' },
  { id: 'traffic',  label: 'Traffic',  Icon: Car,            color: '#D4A017' },
  { id: 'fire',     label: 'Fire',     Icon: Flame,          color: '#E8354A' },
  { id: 'security', label: 'Security', Icon: ShieldAlert,    color: '#F07820' },
  { id: 'disaster', label: 'Disaster', Icon: CloudLightning, color: '#879D1F' },
  { id: 'other',    label: 'Other',    Icon: MoreHorizontal, color: '#5A6478' },
]

const SEVERITIES = [
  { id: 'low',      label: 'Low',      color: '#3DAA6A' },
  { id: 'medium',   label: 'Medium',   color: '#D4A017' },
  { id: 'high',     label: 'High',     color: '#F07820' },
  { id: 'critical', label: 'Critical', color: '#E8354A' },
]

const PROVINCES = ['Kigali City', 'Northern', 'Southern', 'Eastern', 'Western']
const DISTRICTS = {
  'Kigali City': ['Gasabo', 'Kicukiro', 'Nyarugenge'],
  'Northern':    ['Rulindo', 'Gakenke', 'Musanze', 'Burera', 'Gicumbi'],
  'Southern':    ['Nyanza', 'Gisagara', 'Nyaruguru', 'Huye', 'Nyamagabe', 'Ruhango', 'Muhanga', 'Kamonyi'],
  'Eastern':     ['Rwamagana', 'Nyagatare', 'Gatsibo', 'Kayonza', 'Kirehe', 'Ngoma', 'Bugesera'],
  'Western':     ['Karongi', 'Rutsiro', 'Rubavu', 'Nyabihu', 'Ngororero', 'Rusizi', 'Nyamasheke'],
}

function LocationPicker({ onPick }) {
  useMapEvents({ click: (e) => onPick([e.latlng.lat, e.latlng.lng]) })
  return null
}

function FieldLabel({ children }) {
  return (
    <label className="text-[11px] text-(--text-secondary) block mb-1.25 font-semibold tracking-[0.04em] uppercase">
      {children}
    </label>
  )
}

function SectionCard({ title, children }) {
  return (
    <div className="bg-(--bg-surface) border border-(--border) rounded-xl p-5 mb-4">
      <h3 className="text-[15px] font-bold mb-4 tracking-[0.06em] uppercase text-(--text-primary) m-0" style={{ fontFamily: 'var(--font-display)' }}>
        {title}
      </h3>
      {children}
    </div>
  )
}

function InputField({ className = '', ...props }) {
  return (
    <input
      className={`h-10 bg-(--bg-input) border border-(--border) rounded-lg px-3 text-[13px] text-(--text-primary) outline-none w-full focus:border-(--accent) focus:shadow-[0_0_0_3px_var(--accent-ghost)] transition-all placeholder:text-(--text-muted) ${className}`}
      style={{ fontFamily: 'var(--font-body)' }}
      {...props}
    />
  )
}

function SelectField({ className = '', ...props }) {
  return (
    <select
      className={`h-10 bg-(--bg-input) border border-(--border) rounded-lg px-3 text-[13px] text-(--text-primary) outline-none w-full focus:border-(--accent) cursor-pointer appearance-none ${className}`}
      style={{ fontFamily: 'var(--font-body)' }}
      {...props}
    />
  )
}

export default function NewIncident() {
  const navigate = useNavigate()
  const [form, setForm] = useState({
    type: '', severity: '', province: '', district: '', sector: '',
    description: '', callerPhone: '', callerName: '', flags: [],
    pin: [-1.9403, 29.8739],
  })

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }))
  const toggleFlag = (f) => setForm(s => ({
    ...s, flags: s.flags.includes(f) ? s.flags.filter(x => x !== f) : [...s.flags, f],
  }))

  const handleSubmit = (e) => {
    e.preventDefault()
    navigate('/dispatcher/ai-engine')
  }

  const pinIcon = L.divIcon({
    html: `<div style="width:14px;height:14px;border-radius:50%;background:#E8354A;border:2px solid #fff;box-shadow:0 2px 6px rgba(0,0,0,0.3)"></div>`,
    className: '', iconAnchor: [7, 7],
  })

  return (
    <div className="p-6 max-w-[720px] mx-auto">

      <div className="mb-6">
        <div className="flex items-center gap-1.5 mb-1">
          <span className="text-[12px] text-(--text-muted)">Dispatcher</span>
          <ChevronRight size={12} className="text-(--text-muted)" />
          <span className="text-[12px] text-(--text-secondary)">New Incident</span>
        </div>
        <h1 className="text-[26px] font-bold m-0 tracking-[0.04em]" style={{ fontFamily: 'var(--font-display)' }}>NEW INCIDENT</h1>
      </div>

      <form onSubmit={handleSubmit}>

        <SectionCard title="1 — Incident Classification">
          <div className="grid grid-cols-3 gap-2.5 mb-4">
            {INCIDENT_TYPES.map(({ id, label, Icon, color }) => {
              const active = form.type === id
              return (
                <button key={id} type="button" onClick={() => set('type', id)}
                  className="p-4 rounded-lg cursor-pointer text-center flex flex-col items-center gap-2 transition-all outline-none border-2"
                  style={{
                    background: active ? color + '28' : color + '12',
                    borderColor: active ? color : color + '55',
                    boxShadow: active ? `0 0 0 3px ${color}22` : 'none',
                  }}>
                  <div className="w-10 h-10 rounded-lg flex items-center justify-center transition-colors"
                    style={{ background: active ? color + '30' : color + '18' }}>
                    <Icon size={20} strokeWidth={2} color={color} />
                  </div>
                  <span className="text-[12px] font-bold tracking-[0.04em]"
                    style={{ fontFamily: 'var(--font-body)', color: active ? color : 'var(--text-primary)' }}>
                    {label}
                  </span>
                </button>
              )
            })}
          </div>
          <div className="flex gap-2">
            {SEVERITIES.map(s => (
              <button key={s.id} type="button" onClick={() => set('severity', s.id)}
                className="flex-1 py-2 rounded-md cursor-pointer font-bold text-[11px] tracking-[0.07em] uppercase transition-all border"
                style={{
                  fontFamily: 'var(--font-body)',
                  background: form.severity === s.id ? s.color + '22' : 'var(--bg-elevated)',
                  borderColor: form.severity === s.id ? s.color : 'var(--border)',
                  color: form.severity === s.id ? s.color : 'var(--text-muted)',
                }}>
                {s.label}
              </button>
            ))}
          </div>
        </SectionCard>

        <SectionCard title="2 — Location">
          <div className="grid grid-cols-3 gap-2.5 mb-3">
            <div>
              <FieldLabel>Province</FieldLabel>
              <SelectField value={form.province} onChange={e => { set('province', e.target.value); set('district', '') }}>
                <option value="">Select province</option>
                {PROVINCES.map(p => <option key={p} value={p}>{p}</option>)}
              </SelectField>
            </div>
            <div>
              <FieldLabel>District</FieldLabel>
              <SelectField value={form.district} onChange={e => set('district', e.target.value)}
                disabled={!form.province} className={!form.province ? 'opacity-50' : ''}>
                <option value="">Select district</option>
                {(DISTRICTS[form.province] || []).map(d => <option key={d} value={d}>{d}</option>)}
              </SelectField>
            </div>
            <div>
              <FieldLabel>Sector</FieldLabel>
              <InputField placeholder="Enter sector" value={form.sector} onChange={e => set('sector', e.target.value)} />
            </div>
          </div>
          <div className="mb-3">
            <label className="text-[11px] text-(--text-secondary) flex items-center gap-1.25 mb-1.5 font-semibold tracking-[0.04em] uppercase">
              <MapPin size={12} /> Click map to set pin location
            </label>
            <div className="h-60 rounded-lg overflow-hidden border border-(--border)">
              <MapContainer center={form.pin} zoom={10}
                minZoom={RWANDA_MIN_ZOOM} maxZoom={RWANDA_MAX_ZOOM}
                maxBounds={RWANDA_BOUNDS} maxBoundsViscosity={1.0}
                style={{ width: '100%', height: '100%' }} zoomControl={false}>
                <TileLayer url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png"
                  attribution='&copy; <a href="https://carto.com/">CARTO</a>' />
                <RwandaBoundsEnforcer />
                <LocationPicker onPick={(pos) => set('pin', pos)} />
                <Marker position={form.pin} icon={pinIcon} />
              </MapContainer>
            </div>
          </div>
          <InputField placeholder="Street address or landmark (optional)"
            value={form.address || ''} onChange={e => set('address', e.target.value)} />
        </SectionCard>

        <SectionCard title="3 — Description">
          <textarea
            placeholder="Caller's report — describe the incident in detail..."
            value={form.description}
            onChange={e => set('description', e.target.value)}
            className="w-full min-h-24 bg-(--bg-input) border border-(--border) rounded-lg px-3 py-2.5 text-[13px] text-(--text-primary) outline-none resize-y focus:border-(--accent) focus:shadow-[0_0_0_3px_var(--accent-ghost)] placeholder:text-(--text-muted) transition-all box-border"
            style={{ fontFamily: 'var(--font-body)' }}
          />
          <div className="flex flex-wrap gap-2 mt-3">
            {['Multiple casualties', 'Hazardous materials', 'Requires heavy unit', 'Children involved', 'Road blocked'].map(flag => (
              <label key={flag} className="flex items-center gap-1.5 cursor-pointer text-[12px] text-(--text-secondary)">
                <input type="checkbox" checked={form.flags.includes(flag)} onChange={() => toggleFlag(flag)}
                  className="w-3.5 h-3.5" style={{ accentColor: 'var(--accent)' }} />
                {flag}
              </label>
            ))}
          </div>
        </SectionCard>

        <SectionCard title="4 — Caller Information">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-[11px] text-(--text-secondary) flex items-center gap-1.25 mb-1.25 font-semibold tracking-[0.04em] uppercase">
                <Phone size={11} /> Phone Number
              </label>
              <InputField placeholder="+250 7XX XXX XXX" value={form.callerPhone} onChange={e => set('callerPhone', e.target.value)} />
            </div>
            <div>
              <label className="text-[11px] text-(--text-secondary) flex items-center gap-1.25 mb-1.25 font-semibold tracking-[0.04em] uppercase">
                <User size={11} /> Caller Name (optional)
              </label>
              <InputField placeholder="Full name" value={form.callerName} onChange={e => set('callerName', e.target.value)} />
            </div>
          </div>
        </SectionCard>

        <SectionCard title="5 — Unit Pre-Assignment (Optional)">
          <div className="flex gap-3 items-center">
            <button type="button"
              className="flex-1 flex items-center justify-center gap-1.75 h-10 bg-(--accent) text-(--text-on-accent) font-bold text-[13px] tracking-[0.04em] uppercase rounded-lg border-none cursor-pointer hover:bg-(--accent-dim) transition-colors"
              style={{ fontFamily: 'var(--font-body)' }}
              onClick={() => navigate('/dispatcher/ai-engine')}>
              <Bot size={15} /> Let AI Recommend
            </button>
            <span className="text-[12px] text-(--text-muted)">or</span>
            <SelectField className="flex-1">
              <option value="">Select unit manually</option>
              <option>AMB-11 — Available — Nyagatare</option>
              <option>FTK-05 — Available — Kacyiru</option>
              <option>POL-12 — Available — Muhoza</option>
            </SelectField>
          </div>
        </SectionCard>

        <div className="sticky bottom-0 bg-(--bg-base) border-t border-(--border) py-3.5 flex gap-2.5 justify-end">
          <button type="button"
            className="flex items-center gap-1.5 px-5 py-2.25 bg-transparent border border-(--border) text-(--text-primary) font-semibold text-[13px] rounded-lg cursor-pointer hover:bg-(--bg-elevated) hover:border-(--accent) transition-colors"
            style={{ fontFamily: 'var(--font-body)' }}
            onClick={() => navigate('/dispatcher')}>
            <X size={14} /> Cancel
          </button>
          <button type="submit"
            className="flex items-center justify-center gap-1.75 min-w-40 px-5 py-2.25 bg-(--accent) text-(--text-on-accent) font-bold text-[13px] tracking-[0.04em] uppercase rounded-lg border-none cursor-pointer hover:bg-(--accent-dim) transition-colors"
            style={{ fontFamily: 'var(--font-body)' }}>
            <Send size={14} /> Submit Incident
          </button>
        </div>
      </form>
    </div>
  )
}

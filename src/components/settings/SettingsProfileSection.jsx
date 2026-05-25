import { useEffect, useState } from 'react'
import { User, Clock, Calendar, Pencil, Save } from 'lucide-react'
import SettingsToast from './SettingsToast'

const DUTY_OPTIONS = [
  { id: 'on_duty', label: 'On Duty' },
  { id: 'on_break', label: 'On Break' },
  { id: 'off_duty', label: 'Off Duty' },
]

const DEFAULT_SHIFT_STATS = [
  { label: 'Shift', value: '08:00 – 16:00 · Today' },
  { label: 'Incidents handled today', value: '14' },
  { label: 'Time on duty', value: '05:42:18', mono: true },
  { label: 'Assigned district', value: 'Nyarugenge / Kicukiro' },
]

export default function SettingsProfileSection({
  initials = 'JB',
  roleLabel = 'DISPATCHER',
  badge = 'DSP-0042',
  shiftStats: shiftStatsProp,
  defaultForm = {
    name: 'Jean Bosco Nkurunziza',
    email: 'jb.nkurunziza@resq.rw',
    phone: '+250 788 123 456',
    station: 'Kigali Central Dispatch',
  },
  stationAdminNote = 'Assigned by administrator · contact ops manager to change',
}) {
  const [form, setForm] = useState(defaultForm)
  const [savedForm, setSavedForm] = useState(defaultForm)
  const [isEditing, setIsEditing] = useState(false)
  const [duty, setDuty] = useState('on_duty')
  const [toast, setToast] = useState(false)
  const [elapsed, setElapsed] = useState(20538)

  useEffect(() => {
    const t = setInterval(() => setElapsed((e) => e + 1), 1000)
    return () => clearInterval(t)
  }, [])

  const formatDutyTime = (s) => {
    const h = Math.floor(s / 3600)
    const m = Math.floor((s % 3600) / 60)
    const sec = s % 60
    return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(sec).padStart(2, '0')}`
  }

  const baseShiftStats = shiftStatsProp || DEFAULT_SHIFT_STATS
  const liveLabel = baseShiftStats.find((s) => s.mono)?.label || 'Time on duty'
  const shiftStats = baseShiftStats.map((s) =>
    s.label === liveLabel ? { ...s, value: formatDutyTime(elapsed) } : s,
  )

  const handleSave = () => {
    setSavedForm({ ...form })
    setIsEditing(false)
    setToast(true)
    setTimeout(() => setToast(false), 2500)
  }

  const handleDiscard = () => {
    setForm({ ...savedForm })
    setIsEditing(false)
  }

  const fieldClass = isEditing
    ? 'dispatcher-input dispatcher-text-input w-full'
    : 'settings-profile-field-display'

  return (
    <div className="settings-profile-section flex flex-col gap-4 relative">
      <div
        className="dispatcher-surface flex flex-wrap items-center gap-4 w-full"
        style={{ padding: '1.25rem 1.5rem' }}
      >
        <span
          className="w-[52px] h-[52px] rounded-full flex items-center justify-center text-[15px] font-bold shrink-0"
          style={{ background: 'var(--accent-ghost)', color: 'var(--accent)', fontFamily: 'var(--font-display)' }}
        >
          {initials}
        </span>
        <div className="flex-1 min-w-[200px]">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-[17px] font-semibold text-(--text-primary)">{savedForm.name}</span>
            <span
              className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded border"
              style={{
                background: 'var(--accent-ghost)',
                color: 'var(--accent)',
                borderColor: 'var(--accent)',
                fontFamily: 'var(--font-display)',
              }}
            >
              {roleLabel}
            </span>
            <span className="text-[13px] font-mono text-(--text-muted)">{badge}</span>
          </div>
          <p className="text-[13px] text-(--text-secondary) m-0 mt-1">
            {savedForm.station} · Kigali Central Dispatch
          </p>
        </div>
        <div className="flex flex-col items-end gap-2 shrink-0">
          <DutyStatusPill duty={duty} />
          <button
            type="button"
            className="dispatcher-btn-ghost text-[12px] flex items-center gap-1.5 py-1.5 px-2.5"
            onClick={() => (isEditing ? handleDiscard() : setIsEditing(true))}
          >
            <Pencil size={14} />
            {isEditing ? 'Cancel' : 'Edit Profile'}
          </button>
        </div>
      </div>

      <div className="settings-section-card dispatcher-surface p-5 w-full">
        <div className="dispatcher-section-title">
          <span className="dispatcher-section-accent" aria-hidden />
          <User size={16} className="text-(--accent)" />
          <span className="panel-title">Personal Information</span>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-4">
          {[
            { key: 'name', label: 'Full Name' },
            { key: 'email', label: 'Email Address' },
            { key: 'phone', label: 'Phone Number' },
            { key: 'station', label: 'Station', readOnly: true },
          ].map((f) => (
            <label key={f.key} className="dispatcher-field settings-form-field">
              <span className="field-label">{f.label}</span>
              <input
                type={f.key === 'email' ? 'email' : 'text'}
                className={`${fieldClass}${f.readOnly ? ' settings-profile-field--locked' : ''}`}
                value={form[f.key]}
                readOnly={!isEditing || f.readOnly}
                disabled={f.readOnly}
                onChange={(e) => setForm((p) => ({ ...p, [f.key]: e.target.value }))}
              />
              {f.readOnly && (
                <span className="text-[11px] text-(--text-muted) italic mt-1 block">{stationAdminNote}</span>
              )}
            </label>
          ))}
        </div>
      </div>

      <div className="settings-section-card dispatcher-surface p-5 w-full">
        <div className="dispatcher-section-title">
          <span className="dispatcher-section-accent" aria-hidden />
          <Clock size={16} className="text-(--accent)" />
          <span className="panel-title">Duty Status</span>
        </div>
        <div className="flex flex-wrap items-center justify-between gap-4 mt-4">
          <div>
            <div className="text-[13px] font-medium text-(--text-primary)">Current Status</div>
            <p className="text-[12px] text-(--text-secondary) m-0 mt-0.5">
              Visible to Operations Manager and all supervisors
            </p>
          </div>
          <div className="settings-duty-segmented" role="group" aria-label="Duty status">
            {DUTY_OPTIONS.map((opt) => (
              <button
                key={opt.id}
                type="button"
                className={`settings-duty-segment${duty === opt.id ? ' settings-duty-segment--active' : ''}`}
                onClick={() => setDuty(opt.id)}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="settings-section-card dispatcher-surface p-5 w-full">
        <div className="dispatcher-section-title mb-4">
          <span className="dispatcher-section-accent" aria-hidden />
          <Calendar size={16} className="text-(--accent)" />
          <span className="panel-title">Current Shift</span>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {shiftStats.map((stat) => (
            <div
              key={stat.label}
              className="rounded-lg p-3 px-4"
              style={{ background: 'var(--bg-elevated)', borderRadius: 'var(--border-radius-md, 8px)' }}
            >
              <div
                className="text-[10px] uppercase tracking-wider text-(--text-muted) mb-1"
                style={{ fontFamily: 'var(--font-mono)' }}
              >
                {stat.label}
              </div>
              <div
                className={`text-[16px] font-semibold text-(--text-primary)${stat.mono ? ' font-mono' : ''}`}
              >
                {stat.value}
              </div>
            </div>
          ))}
        </div>
      </div>

      {isEditing && (
        <div className="settings-profile-actions sticky bottom-0 z-10 flex justify-end gap-3 py-3 border-t border-(--border-subtle) bg-(--bg-surface)">
          <button type="button" className="dispatcher-btn-ghost text-[13px]" onClick={handleDiscard}>
            Discard Changes
          </button>
          <button type="button" className="dispatcher-btn-primary text-[13px] flex items-center gap-2" onClick={handleSave}>
            <Save size={16} />
            Save Changes
          </button>
        </div>
      )}

      <SettingsToast show={toast} message="Profile updated" />
    </div>
  )
}

function DutyStatusPill({ duty }) {
  if (duty === 'off_duty') {
    return (
      <span
        className="text-[11px] font-semibold px-2.5 py-1 rounded border"
        style={{
          background: 'var(--bg-elevated)',
          color: 'var(--text-muted)',
          borderColor: 'var(--border)',
        }}
      >
        ● Off Duty
      </span>
    )
  }
  if (duty === 'on_break') {
    return (
      <span
        className="text-[11px] font-semibold px-2.5 py-1 rounded border"
        style={{
          background: 'var(--status-medium-bg)',
          color: 'var(--status-medium)',
          borderColor: 'var(--status-medium)',
        }}
      >
        ● On Break
      </span>
    )
  }
  return (
    <span
      className="text-[11px] font-semibold px-2.5 py-1 rounded border inline-flex items-center gap-1"
      style={{
        background: 'var(--status-low-bg)',
        color: 'var(--status-low)',
        borderColor: 'var(--status-low)',
      }}
    >
      <span className="settings-duty-pulse-dot" aria-hidden />
      On Duty
    </span>
  )
}

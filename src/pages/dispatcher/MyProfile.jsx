import { useState } from 'react'
import { ChevronRight, User, Bell, Key, Save, Shield } from 'lucide-react'

export default function MyProfile() {
  const [form, setForm] = useState({
    name:    'Jean Bosco Nkurunziza',
    email:   'jb.nkurunziza@resq.rw',
    phone:   '+250 788 123 456',
    station: 'Kigali Central Dispatch',
    badge:   'DSP-0042',
  })
  const [saved, setSaved] = useState(false)
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }))
  const handleSave = () => { setSaved(true); setTimeout(() => setSaved(false), 2000) }

  return (
    <div className="p-6">

      <div className="mb-6">
        <div className="flex items-center gap-1.5 mb-1">
          <span className="text-[12px] text-(--text-muted)">Dispatcher</span>
          <ChevronRight size={12} className="text-(--text-muted)" />
          <span className="text-[12px] text-(--text-secondary)">My Profile</span>
        </div>
        <h1 className="text-[26px] font-bold m-0 tracking-[0.04em]" style={{ fontFamily: 'var(--font-display)' }}>MY PROFILE</h1>
      </div>

      {/* Avatar + role */}
      <div className="bg-(--bg-surface) border border-(--border) rounded-xl p-5 mb-4 flex items-center gap-5">
        <div className="w-17 h-17 rounded-full bg-(--accent-ghost) border-2 border-(--accent) flex items-center justify-center text-[22px] font-bold text-(--accent) shrink-0 tracking-[0.04em]" style={{ fontFamily: 'var(--font-display)' }}>
          JB
        </div>
        <div>
          <div className="text-xl font-bold tracking-[0.02em]" style={{ fontFamily: 'var(--font-display)' }}>{form.name}</div>
          <div className="flex items-center gap-2 mt-1.25">
            <span className="inline-flex items-center px-2.25 py-0.5 rounded text-[10px] font-bold uppercase tracking-[0.07em] bg-(--accent-ghost) text-(--accent) border border-(--accent)" style={{ fontFamily: 'var(--font-body)' }}>
              DISPATCHER
            </span>
            <span className="text-[12px] text-(--text-muted)" style={{ fontFamily: 'var(--font-mono)' }}>{form.badge}</span>
          </div>
          <div className="text-[12px] text-(--text-secondary) mt-1">{form.station}</div>
        </div>
        <div className="ml-auto">
          <div className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full dot-active inline-block" />
            <span className="text-[12px] font-semibold text-(--status-low)">On Duty</span>
          </div>
        </div>
      </div>

      {/* Personal Info */}
      <div className="bg-(--bg-surface) border border-(--border) rounded-xl p-5 mb-4">
        <div className="flex items-center gap-2 mb-4">
          <User size={16} color="var(--accent)" />
          <span className="text-sm font-bold tracking-[0.04em]" style={{ fontFamily: 'var(--font-display)' }}>PERSONAL INFORMATION</span>
        </div>
        <div className="grid grid-cols-2 gap-3.5">
          {[
            { label: 'Full Name',     key: 'name' },
            { label: 'Email Address', key: 'email' },
            { label: 'Phone Number',  key: 'phone' },
            { label: 'Station',       key: 'station' },
          ].map(f => (
            <div key={f.key}>
              <label className="field-label block mb-1.25">{f.label}</label>
              <input
                className="h-10 w-full bg-(--bg-input) border border-(--border) rounded-lg px-3 text-[13px] text-(--text-primary) outline-none focus:border-(--accent) focus:shadow-[0_0_0_3px_var(--accent-ghost)] transition-all"
                style={{ fontFamily: 'var(--font-body)' }}
                value={form[f.key]} onChange={e => set(f.key, e.target.value)}
              />
            </div>
          ))}
        </div>
      </div>

      {/* Notification Preferences */}
      <div className="bg-(--bg-surface) border border-(--border) rounded-xl p-5 mb-4">
        <div className="flex items-center gap-2 mb-4">
          <Bell size={16} color="var(--accent)" />
          <span className="text-sm font-bold tracking-[0.04em]" style={{ fontFamily: 'var(--font-display)' }}>NOTIFICATION PREFERENCES</span>
        </div>
        <div className="flex flex-col gap-3.5">
          {[
            { label: 'Critical incident alerts', desc: 'Immediate notification for critical severity', on: true },
            { label: 'Unit status changes',       desc: 'When assigned units change status',           on: true },
            { label: 'Shift reminders',           desc: '30 minutes before shift start',               on: false },
            { label: 'System announcements',      desc: 'Platform updates and maintenance',            on: false },
          ].map(pref => (
            <div key={pref.label} className="flex items-center justify-between">
              <div>
                <div className="text-[13px] font-semibold">{pref.label}</div>
                <div className="text-[12px] text-(--text-muted) mt-0.5">{pref.desc}</div>
              </div>
              <div className="w-10 h-5.5 rounded-full cursor-pointer shrink-0 relative transition-colors border"
                style={{
                  background: pref.on ? 'var(--accent)' : 'var(--bg-elevated)',
                  borderColor: pref.on ? 'var(--accent)' : 'var(--border)',
                }}>
                <div className="w-4 h-4 rounded-full absolute top-0.5 transition-all"
                  style={{ background: pref.on ? 'var(--text-on-accent)' : 'var(--text-muted)', left: pref.on ? 20 : 2 }} />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Security */}
      <div className="bg-(--bg-surface) border border-(--border) rounded-xl p-5 mb-6">
        <div className="flex items-center gap-2 mb-4">
          <Key size={16} color="var(--accent)" />
          <span className="text-sm font-bold tracking-[0.04em]" style={{ fontFamily: 'var(--font-display)' }}>SECURITY</span>
        </div>
        <div className="flex gap-2.5">
          <button className="flex-1 flex items-center justify-center py-2.25 px-5 bg-transparent border border-(--border) text-(--text-primary) font-semibold text-[13px] rounded-lg cursor-pointer hover:bg-(--bg-elevated) hover:border-(--accent) transition-colors" style={{ fontFamily: 'var(--font-body)' }}>
            Change Password
          </button>
          <button className="flex-1 flex items-center justify-center gap-1.75 py-2.25 px-5 bg-transparent border border-(--border) text-(--text-primary) font-semibold text-[13px] rounded-lg cursor-pointer hover:bg-(--bg-elevated) hover:border-(--accent) transition-colors" style={{ fontFamily: 'var(--font-body)' }}>
            <Shield size={14} /> Manage MFA
          </button>
        </div>
        <div className="mt-3 px-3 py-2.5 bg-(--status-low-bg) rounded-lg border border-[rgba(61,170,106,0.25)]">
          <div className="text-[12px] font-bold text-(--status-low)">✓ MFA Enabled</div>
          <div className="text-[11px] text-(--text-muted) mt-0.5">Last login: Today at 06:02 from 197.243.x.x</div>
        </div>
      </div>

      <div className="flex justify-end gap-2.5">
        <button className="px-5 py-2.25 bg-transparent border border-(--border) text-(--text-primary) font-semibold text-[13px] rounded-lg cursor-pointer hover:bg-(--bg-elevated) hover:border-(--accent) transition-colors" style={{ fontFamily: 'var(--font-body)' }}>
          Discard Changes
        </button>
        <button onClick={handleSave}
          className="flex items-center justify-center gap-1.75 min-w-35 px-5 py-2.25 bg-(--accent) text-(--text-on-accent) font-bold text-[13px] tracking-[0.04em] uppercase rounded-lg border-none cursor-pointer hover:bg-(--accent-dim) transition-colors"
          style={{ fontFamily: 'var(--font-body)' }}>
          {saved ? '✓ Saved!' : <><Save size={14} /> Save Changes</>}
        </button>
      </div>
    </div>
  )
}

import { useState } from 'react'
import { useParams } from 'react-router-dom'
import { Sun, Moon, Palette, Check, ShieldCheck, Monitor, Smartphone, UserCircle } from 'lucide-react'
import { useThemeStore } from '../../store/themeStore'
import StatusBadge from '../dispatcher/StatusBadge'
import SettingsPasswordSection from './SettingsPasswordSection'
import SettingsProfileSection from './SettingsProfileSection'
import SettingsNavLayout from './SettingsNavLayout'
import SettingsToast from './SettingsToast'

const THEME_OPTIONS = [
  { id: 'light', label: 'Light mode', description: 'High-contrast command interface optimized for daylight operations centers.', icon: Sun },
  { id: 'dark', label: 'Dark mode', description: 'Reduced glare layout for extended night shifts and low-light environments.', icon: Moon },
]

const NAV = [
  { id: 'profile', label: 'Profile', icon: UserCircle },
  { id: 'appearance', label: 'Appearance', icon: Palette },
  { id: 'security', label: 'Security', icon: ShieldCheck },
]

export default function AdminPortalSettingsView() {
  const { section: sectionParam } = useParams()
  const section = sectionParam || 'profile'
  const { theme, setTheme } = useThemeStore()
  const [toast, setToast] = useState(false)
  const [twoFa, setTwoFa] = useState(true)

  const flashToast = () => {
    setToast(true)
    setTimeout(() => setToast(false), 2500)
  }

  return (
    <SettingsNavLayout
      breadcrumbParent="Administration"
      portalLabel="Configure your administration workspace preferences. Changes apply immediately on this terminal."
      basePath="/admin/settings"
      navItems={NAV}
      toast={<SettingsToast show={toast} />}
    >
      {section === 'profile' && (
        <SettingsProfileSection
          initials="SA"
          roleLabel="SUPER ADMIN"
          badge="ADM-0001"
          defaultForm={{
            name: 'Super Admin',
            email: 'admin@resq.rw',
            phone: '+250 788 000 001',
            station: 'HQ Central Command — Kigali',
          }}
          stationAdminNote="Provisioned role and station are managed at system level"
        />
      )}

      {section === 'appearance' && (
        <div className="settings-section-card dispatcher-surface p-5 w-full">
          <div className="flex items-center gap-2 mb-1">
            <Palette size={16} color="var(--accent)" />
            <span className="text-sm font-bold tracking-[0.04em]" style={{ fontFamily: 'var(--font-display)' }}>APPEARANCE</span>
          </div>
          <p className="text-[12px] text-(--text-muted) m-0 mb-4">Select your preferred interface theme for the RESQ portal.</p>
          <div className="settings-theme-grid">
            {THEME_OPTIONS.map((opt) => {
              const Icon = opt.icon
              const active = theme === opt.id
              return (
                <button
                  key={opt.id}
                  type="button"
                  onClick={() => { setTheme(opt.id); flashToast() }}
                  className={`settings-theme-card${active ? ' settings-theme-card--active' : ''}`}
                >
                  <span className="settings-theme-card-icon"><Icon size={22} /></span>
                  <div className="settings-theme-card-body">
                    <div className="settings-theme-card-title">{opt.label}</div>
                    <p className="settings-theme-card-desc">{opt.description}</p>
                  </div>
                  {active && <span className="settings-theme-card-check"><Check size={16} /></span>}
                </button>
              )
            })}
          </div>
          <p className="settings-theme-status">Active theme: <strong>{theme.toUpperCase()}</strong> · Stored locally</p>
        </div>
      )}

      {section === 'security' && (
        <div className="settings-section-card dispatcher-surface p-5 w-full">
          <h2 className="text-base font-bold m-0 mb-1" style={{ fontFamily: 'var(--font-display)' }}>Security & Access</h2>
          <p className="text-[13px] text-(--text-secondary) m-0 mb-4">Manage your account security.</p>
          <SettingsPasswordSection onSuccess={flashToast} />

          <div className="mt-8 text-[11px] font-bold uppercase tracking-wider text-(--text-muted) mb-3" style={{ fontFamily: 'var(--font-display)' }}>Active Sessions</div>
          {[
            { icon: Monitor, title: 'Admin Workstation — Chrome', sub: 'HQ · Current session', badge: 'ACTIVE', active: true },
          ].map((s) => {
            const Icon = s.icon
            return (
              <div key={s.title} className="flex items-center gap-3 p-3 rounded-lg border border-(--border) bg-(--bg-input) mb-2">
                <Icon size={20} className="text-(--accent)" />
                <div className="flex-1 min-w-0">
                  <div className="text-[13px] font-semibold">{s.title}</div>
                  <div className="text-[12px] text-(--text-secondary)">{s.sub}</div>
                </div>
                <StatusBadge label={s.badge} variant="resolved" />
              </div>
            )
          })}

          <div className="mt-8 flex flex-wrap items-center gap-3 p-4 rounded-lg border border-(--border) bg-(--bg-input)">
            <ShieldCheck size={22} color="var(--accent)" />
            <div className="flex-1 min-w-[180px]">
              <div className="font-semibold text-[13px]">Two-factor authentication</div>
              <p className="text-[12px] text-(--text-secondary) m-0 mt-1">Mandatory for all administration accounts.</p>
            </div>
            <StatusBadge label={twoFa ? 'ENABLED' : 'NOT ENABLED'} variant={twoFa ? 'resolved' : 'critical'} />
          </div>
        </div>
      )}
    </SettingsNavLayout>
  )
}

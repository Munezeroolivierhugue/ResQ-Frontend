import { useState } from 'react'
import { Link, useParams, useNavigate } from 'react-router-dom'
import {
  Sun,
  Moon,
  Palette,
  Check,
  Bell,
  ShieldCheck,
  Monitor,
  Smartphone,
  UserCircle,
  Languages,
  MapPin,
  ChevronLeft,
} from 'lucide-react'
import { useThemeStore } from '../../store/themeStore'
import StatusBadge from '../dispatcher/StatusBadge'
import { SettingsToggleRow, SettingsGroup } from './SettingsToggle'
import SettingsPasswordSection from './SettingsPasswordSection'
import SettingsProfileSection from './SettingsProfileSection'
import SettingsToast from './SettingsToast'
import { FR_OFFICER } from '../../data/mockFieldResponderData'
import { useFieldResponderStore } from '../../store/fieldResponderStore'

const THEME_OPTIONS = [
  {
    id: 'light',
    label: 'Light mode',
    description: 'High visibility for daylight patrol and outdoor use.',
    icon: Sun,
  },
  {
    id: 'dark',
    label: 'Dark mode',
    description: 'Reduced glare for night shifts and low-light environments.',
    icon: Moon,
  },
]

export const FR_SETTINGS_NAV = [
  { id: 'profile', label: 'Profile', icon: UserCircle },
  { id: 'appearance', label: 'Appearance', icon: Palette },
  { id: 'notifications', label: 'Notifications', icon: Bell },
  { id: 'unit', label: 'Unit & GPS', icon: MapPin },
  { id: 'language', label: 'Language', icon: Languages },
  { id: 'security', label: 'Security', icon: ShieldCheck },
]

export default function FieldResponderSettingsView() {
  const { section: sectionParam } = useParams()
  const navigate = useNavigate()
  const section = sectionParam || 'profile'
  const { theme, setTheme } = useThemeStore()
  const gpsActive = useFieldResponderStore((s) => s.gpsActive)
  const setGpsActive = useFieldResponderStore((s) => s.setGpsActive)
  const [toast, setToast] = useState(false)
  const [language, setLanguage] = useState('en')
  const [mfaEnabled, setMfaEnabled] = useState(false)
  const [toggles, setToggles] = useState({
    newAssignment: true,
    dispatcherMessages: true,
    backupConfirm: true,
    routeUpdates: true,
    shiftEndReminder: true,
    badgeSystem: true,
    highPriorityOnly: false,
    vibrationAlerts: true,
  })

  const flashToast = () => {
    setToast(true)
    setTimeout(() => setToast(false), 2500)
  }

  const setToggle = (key, val) => {
    setToggles((t) => ({ ...t, [key]: val }))
    flashToast()
  }

  const sectionLabel = FR_SETTINGS_NAV.find((n) => n.id === section)?.label || 'Settings'

  return (
    <div className="fr-page fr-page--settings">
      <Link to="/field-responder/profile" className="fr-settings-back">
        <ChevronLeft size={18} />
        Back to Profile
      </Link>
      <h2 className="fr-settings-heading">{sectionLabel}</h2>
      <SettingsToast show={toast} />

      {section === 'profile' && (
        <SettingsProfileSection
          onUserLoaded={(u) => setMfaEnabled(u.mfa_enabled)}
          shiftStats={[
            { label: 'Shift window', value: FR_OFFICER.shift },
            { label: 'Unit', value: FR_OFFICER.unit },
            { label: 'Incidents today', value: '—' },
            { label: 'Assigned sector', value: '—' },
          ]}
        />
      )}

      {section === 'appearance' && (
        <div className="settings-section-card dispatcher-surface fr-card fr-card--tight">
          <div className="flex items-center gap-2 mb-1">
            <Palette size={16} color="var(--accent)" />
            <span className="text-sm font-bold tracking-[0.04em]" style={{ fontFamily: 'var(--font-display)' }}>
              APPEARANCE
            </span>
          </div>
          <p className="text-[12px] text-(--text-muted) m-0 mb-4">
            Select your preferred interface theme for the field app.
          </p>
          <div className="settings-theme-grid">
            {THEME_OPTIONS.map((opt) => {
              const Icon = opt.icon
              const active = theme === opt.id
              return (
                <button
                  key={opt.id}
                  type="button"
                  onClick={() => {
                    setTheme(opt.id)
                    flashToast()
                  }}
                  className={`settings-theme-card${active ? ' settings-theme-card--active' : ''}`}
                >
                  <span className="settings-theme-card-icon">
                    <Icon size={22} />
                  </span>
                  <div className="settings-theme-card-body">
                    <div className="settings-theme-card-title">{opt.label}</div>
                    <p className="settings-theme-card-desc">{opt.description}</p>
                  </div>
                  {active && (
                    <span className="settings-theme-card-check">
                      <Check size={16} />
                    </span>
                  )}
                </button>
              )
            })}
          </div>
          <p className="settings-theme-status">
            Active theme: <strong>{theme.toUpperCase()}</strong> · Stored locally
          </p>
        </div>
      )}

      {section === 'notifications' && (
        <div className="settings-section-card dispatcher-surface fr-card fr-card--tight">
          <h2 className="text-base font-bold m-0 mb-1" style={{ fontFamily: 'var(--font-display)' }}>
            Notification Settings
          </h2>
          <p className="text-[13px] text-(--text-secondary) m-0 mb-4">
            Alerts for assignments and dispatcher communications.
          </p>
          <SettingsGroup title="Assignments">
            <SettingsToggleRow
              label="New assignment alerts"
              description="Immediate alert when a dispatch is assigned to your unit"
              on={toggles.newAssignment}
              onChange={(v) => setToggle('newAssignment', v)}
            />
            <SettingsToggleRow
              label="High priority only"
              description="Only notify for critical and high severity incidents"
              on={toggles.highPriorityOnly}
              onChange={(v) => setToggle('highPriorityOnly', v)}
            />
            <SettingsToggleRow
              label="Route update alerts"
              description="When navigation or ETA changes during en route"
              on={toggles.routeUpdates}
              onChange={(v) => setToggle('routeUpdates', v)}
            />
          </SettingsGroup>
          <SettingsGroup title="Communications">
            <SettingsToggleRow
              label="Dispatcher messages"
              description="Incoming messages on the dispatcher channel"
              on={toggles.dispatcherMessages}
              onChange={(v) => setToggle('dispatcherMessages', v)}
            />
            <SettingsToggleRow
              label="Backup confirmation"
              description="When backup units are dispatched to your location"
              on={toggles.backupConfirm}
              onChange={(v) => setToggle('backupConfirm', v)}
            />
            <SettingsToggleRow
              label="Vibration alerts"
              description="Haptic feedback for critical notifications"
              on={toggles.vibrationAlerts}
              onChange={(v) => setToggle('vibrationAlerts', v)}
            />
          </SettingsGroup>
          <SettingsGroup title="Shift">
            <SettingsToggleRow
              label="Shift end reminder"
              description="Reminder 15 minutes before scheduled shift end"
              on={toggles.shiftEndReminder}
              onChange={(v) => setToggle('shiftEndReminder', v)}
            />
            <SettingsToggleRow
              label="System messages"
              on={toggles.badgeSystem}
              onChange={(v) => setToggle('badgeSystem', v)}
            />
          </SettingsGroup>
        </div>
      )}

      {section === 'unit' && (
        <div className="settings-section-card dispatcher-surface fr-card fr-card--tight">
          <h2 className="text-base font-bold m-0 mb-1" style={{ fontFamily: 'var(--font-display)' }}>
            Unit & GPS
          </h2>
          <p className="text-[13px] text-(--text-secondary) m-0 mb-4">
            Location sharing and unit assignment for this shift.
          </p>
          <div className="fr-settings-unit-row">
            <div>
              <div className="font-semibold text-[13px]">{FR_OFFICER.unit}</div>
              <div className="text-[12px] text-(--text-muted) font-mono">{FR_OFFICER.badge}</div>
            </div>
            <StatusBadge label="ASSIGNED" variant="resolved" />
          </div>
          <SettingsGroup title="Location">
            <SettingsToggleRow
              label="GPS location sharing"
              description="Share live position with dispatch map while on duty"
              on={gpsActive}
              onChange={(v) => {
                setGpsActive(v)
                flashToast()
              }}
            />
            <SettingsToggleRow
              label="Background tracking"
              description="Continue GPS updates when app is in background"
              on={gpsActive}
              onChange={() => flashToast()}
            />
          </SettingsGroup>
          <div className="text-[12px] text-(--text-muted) mt-3 p-3 rounded-lg bg-(--bg-input) border border-(--border)">
            Assigned sector: <strong>Kimironko</strong> · Gasabo District · Kigali
          </div>
        </div>
      )}

      {section === 'language' && (
        <div className="settings-section-card dispatcher-surface fr-card fr-card--tight">
          <h2 className="text-base font-bold m-0 mb-1" style={{ fontFamily: 'var(--font-display)' }}>
            Language
          </h2>
          <p className="text-[13px] text-(--text-secondary) m-0 mb-4">
            Select your preferred interface language.
          </p>
          <div className="settings-theme-grid">
            <button type="button" className="settings-theme-card opacity-80" disabled>
              <span className="settings-theme-card-icon text-2xl">🇷🇼</span>
              <div className="settings-theme-card-body">
                <div className="settings-theme-card-title">
                  Kinyarwanda <span className="text-[10px] text-(--text-muted)">(Coming soon)</span>
                </div>
              </div>
            </button>
            <button
              type="button"
              className={`settings-theme-card${language === 'en' ? ' settings-theme-card--active' : ''}`}
              onClick={() => {
                setLanguage('en')
                flashToast()
              }}
            >
              <span className="settings-theme-card-icon text-2xl">🇬🇧</span>
              <div className="settings-theme-card-body">
                <div className="settings-theme-card-title">English</div>
              </div>
              {language === 'en' && (
                <span className="settings-theme-card-check">
                  <Check size={16} />
                </span>
              )}
            </button>
          </div>
        </div>
      )}

      {section === 'security' && (
        <div className="settings-section-card dispatcher-surface fr-card fr-card--tight">
          <h2 className="text-base font-bold m-0 mb-1" style={{ fontFamily: 'var(--font-display)' }}>
            Security & Access
          </h2>
          <p className="text-[13px] text-(--text-secondary) m-0 mb-4">Manage your account security.</p>
          <SettingsPasswordSection onSuccess={flashToast} />

          <div
            className="mt-8 text-[11px] font-bold uppercase tracking-wider text-(--text-muted) mb-3"
            style={{ fontFamily: 'var(--font-display)' }}
          >
            Active Sessions
          </div>
          {[
            {
              icon: Smartphone,
              title: 'RESQ Field App — This device',
              sub: 'Kigali, Rwanda · Current session',
              badge: 'ACTIVE',
              active: true,
            },
            {
              icon: Monitor,
              title: 'Windows PC — Chrome',
              sub: 'Last active: 3 days ago',
              badge: 'INACTIVE',
              active: false,
            },
          ].map((s) => {
            const Icon = s.icon
            return (
              <div
                key={s.title}
                className="flex items-center gap-3 p-3 rounded-lg border border-(--border) bg-(--bg-input) mb-2"
              >
                <Icon size={20} className="text-(--accent)" />
                <div className="flex-1 min-w-0">
                  <div className="text-[13px] font-semibold">{s.title}</div>
                  <div className="text-[12px] text-(--text-secondary)">{s.sub}</div>
                </div>
                <StatusBadge label={s.badge} variant={s.active ? 'resolved' : 'info'} />
              </div>
            )
          })}

          <div className="mt-6 flex flex-wrap items-center gap-3 p-4 rounded-lg border border-(--border) bg-(--bg-input)">
            <ShieldCheck size={22} color="var(--accent)" />
            <div className="flex-1 min-w-[180px]">
              <div className="font-semibold text-[13px]">Two-factor authentication</div>
              <p className="text-[12px] text-(--text-secondary) m-0 mt-1">
                Recommended for field responder accounts.
              </p>
            </div>
            {mfaEnabled ? (
              <>
                <StatusBadge label="ENABLED" variant="resolved" />
                <button type="button" className="dispatcher-btn-ghost text-[12px]" onClick={() => navigate('/fr/mfa-setup')}>Manage 2FA</button>
              </>
            ) : (
              <>
                <StatusBadge label="NOT ENABLED" variant="critical" />
                <button type="button" className="dispatcher-btn-outline text-[12px]" onClick={() => navigate('/fr/mfa-setup')}>Enable 2FA</button>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

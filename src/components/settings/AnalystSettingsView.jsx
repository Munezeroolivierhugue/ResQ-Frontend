import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { Sun, Moon, Palette, Bell, ShieldCheck, UserCircle, Languages, Check, Monitor } from 'lucide-react'
import StatusBadge from '../dispatcher/StatusBadge'
import { useThemeStore } from '../../store/themeStore'
import SettingsNavLayout from './SettingsNavLayout'
import SettingsProfileSection from './SettingsProfileSection'
import { useToastStore } from '../../store/toastStore'
import SettingsPasswordSection from './SettingsPasswordSection'
import SettingsTrustedIpsSection from './SettingsTrustedIpsSection'
import { SettingsToggleRow, SettingsGroup } from './SettingsToggle'

const THEME_OPTIONS = [
  { id: 'light', label: 'Light mode', description: 'High-contrast interface for data analysis.', icon: Sun },
  { id: 'dark', label: 'Dark mode', description: 'Reduced glare for extended reporting sessions.', icon: Moon },
]

const NAV = [
  { id: 'profile', label: 'Profile', icon: UserCircle },
  { id: 'appearance', label: 'Appearance', icon: Palette },
  { id: 'notifications', label: 'Notifications', icon: Bell },
  { id: 'language', label: 'Language', icon: Languages },
  { id: 'security', label: 'Security', icon: ShieldCheck },
]

const ANALYST_TOGGLES_KEY = 'resq-analyst-notification-prefs'
const ANALYST_DEFAULT_TOGGLES = {
  anomalyAlerts: true,
  dataQuality: true,
  modelDrift: true,
  reportDue: true,
}
function loadAnalystToggles() {
  try {
    const raw = localStorage.getItem(ANALYST_TOGGLES_KEY)
    return raw ? { ...ANALYST_DEFAULT_TOGGLES, ...JSON.parse(raw) } : ANALYST_DEFAULT_TOGGLES
  } catch {
    return ANALYST_DEFAULT_TOGGLES
  }
}

export default function AnalystSettingsView() {
  const { section: sectionParam } = useParams()
  const section = sectionParam || 'profile'
  const navigate = useNavigate()
  const { theme, setTheme } = useThemeStore()
  const pushToast = useToastStore((s) => s.pushToast)
  const [language, setLanguage] = useState('en')
  const [mfaEnabled, setMfaEnabled] = useState(false)
  // Persisted to localStorage — was plain in-memory useState resetting to
  // default on every reload.
  const [toggles, setToggles] = useState(loadAnalystToggles)

  useEffect(() => {
    localStorage.setItem(ANALYST_TOGGLES_KEY, JSON.stringify(toggles))
  }, [toggles])

  const flashToast = () => {
    pushToast({ variant: 'success', title: 'Saved', message: 'Settings updated' })
  }

  const setToggle = (key, val) => {
    setToggles((t) => ({ ...t, [key]: val }))
    flashToast()
  }

  return (
    <SettingsNavLayout
      breadcrumbParent="Intelligence Portal"
      portalLabel="Configure your analyst workspace preferences."
      basePath="/analyst/settings"
      navItems={NAV}
    >
      {section === 'profile' && (
        <SettingsProfileSection
          onUserLoaded={(u) => setMfaEnabled(u.mfa_enabled)}
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
      {section === 'notifications' && (
        <div className="settings-section-card dispatcher-surface p-5 w-full">
          <h2 className="text-base font-bold m-0 mb-1" style={{ fontFamily: 'var(--font-display)' }}>Notification Settings</h2>
          <p className="text-[13px] text-(--text-secondary) m-0 mb-1">Control which analyst alerts reach you.</p>
          <p className="text-[11px] text-(--text-muted) italic m-0 mb-4">
            Stored locally on this device — the actual notification chime is controlled by the speaker icon next to the bell, not these toggles.
          </p>
          <SettingsGroup title="Intelligence alerts">
            <SettingsToggleRow label="Anomaly detection alerts" on={toggles.anomalyAlerts} onChange={(v) => setToggle('anomalyAlerts', v)} />
            <SettingsToggleRow label="Data quality degradation" on={toggles.dataQuality} onChange={(v) => setToggle('dataQuality', v)} />
            <SettingsToggleRow label="AI model drift warnings" on={toggles.modelDrift} onChange={(v) => setToggle('modelDrift', v)} />
            <SettingsToggleRow label="Report due reminders" on={toggles.reportDue} onChange={(v) => setToggle('reportDue', v)} />
          </SettingsGroup>
        </div>
      )}
      {section === 'language' && (
        <div className="settings-section-card dispatcher-surface p-5 w-full">
          <h2 className="text-base font-bold m-0 mb-1" style={{ fontFamily: 'var(--font-display)' }}>Language</h2>
          <p className="text-[13px] text-(--text-secondary) m-0 mb-4">Select your preferred interface language.</p>
          <div className="settings-theme-grid">
            <button type="button" className="settings-theme-card opacity-80" disabled>
              <span className="settings-theme-card-icon text-2xl">🇷🇼</span>
              <div className="settings-theme-card-body">
                <div className="settings-theme-card-title">Kinyarwanda <span className="text-[10px] text-(--text-muted)">(Coming soon)</span></div>
              </div>
            </button>
            <button type="button" className={`settings-theme-card${language === 'en' ? ' settings-theme-card--active' : ''}`} onClick={() => { setLanguage('en'); flashToast() }}>
              <span className="settings-theme-card-icon text-2xl">🇬🇧</span>
              <div className="settings-theme-card-body">
                <div className="settings-theme-card-title">English</div>
              </div>
              {language === 'en' && <span className="settings-theme-card-check"><Check size={16} /></span>}
            </button>
          </div>
        </div>
      )}
      {section === 'security' && (
        <div className="settings-section-card dispatcher-surface p-5 w-full">
          <h2 className="text-base font-bold m-0 mb-1" style={{ fontFamily: 'var(--font-display)' }}>Security & Access</h2>
          <p className="text-[13px] text-(--text-secondary) m-0 mb-4">Manage your account security.</p>
          <SettingsPasswordSection onSuccess={flashToast} />
              <SettingsTrustedIpsSection onSuccess={flashToast} />

          <div className="mt-8 text-[11px] font-bold uppercase tracking-wider text-(--text-muted) mb-3" style={{ fontFamily: 'var(--font-display)' }}>Active Sessions</div>
          {[
            { icon: Monitor, title: 'Windows PC — Chrome', sub: 'Kigali, Rwanda · Current session', badge: 'ACTIVE', active: true },
          ].map((s) => {
            const Icon = s.icon
            return (
              <div key={s.title} className="flex items-center gap-3 p-3 rounded-lg border border-(--border) bg-(--bg-input) mb-2">
                <Icon size={20} className="text-(--accent)" />
                <div className="flex-1 min-w-0">
                  <div className="text-[13px] font-semibold">{s.title}</div>
                  <div className="text-[12px] text-(--text-secondary)">{s.sub}</div>
                </div>
                <StatusBadge label={s.badge} variant={s.active ? 'resolved' : 'info'} />
              </div>
            )
          })}

          <div className="mt-8 flex flex-wrap items-center gap-3 p-4 rounded-lg border border-(--border) bg-(--bg-input)">
            <ShieldCheck size={22} color="var(--accent)" />
            <div className="flex-1 min-w-[180px]">
              <div className="font-semibold text-[13px]">Two-factor authentication</div>
              <p className="text-[12px] text-(--text-secondary) m-0 mt-1">Required for analyst terminal access.</p>
            </div>
            {mfaEnabled ? (
              <>
                <StatusBadge label="ENABLED" variant="resolved" />
                <button type="button" className="dispatcher-btn-ghost text-[12px]" onClick={() => navigate('/mfa-setup')}>Manage 2FA</button>
              </>
            ) : (
              <>
                <StatusBadge label="NOT ENABLED" variant="critical" />
                <button type="button" className="dispatcher-btn-outline text-[12px]" onClick={() => navigate('/mfa-setup')}>Enable 2FA</button>
              </>
            )}
          </div>
        </div>
      )}
    </SettingsNavLayout>
  )
}

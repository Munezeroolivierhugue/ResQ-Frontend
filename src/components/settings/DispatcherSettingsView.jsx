import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import {
  Sun, Moon, Palette, Check, Bell, Map, Send, Clock, Languages,
  Volume2, ShieldCheck, Monitor, Smartphone, Info, Play, UserCircle,
} from 'lucide-react'
import { useThemeStore } from '../../store/themeStore'
import StatusBadge from '../dispatcher/StatusBadge'
import { SettingsToggleRow, SettingsGroup } from './SettingsToggle'
import SettingsPasswordSection from './SettingsPasswordSection'
import SettingsTrustedIpsSection from './SettingsTrustedIpsSection'
import SettingsProfileSection from './SettingsProfileSection'
import SettingsNavLayout from './SettingsNavLayout'
import SettingsShiftManagementSection from './SettingsShiftManagementSection'
import { useToastStore } from '../../store/toastStore'

const THEME_OPTIONS = [
  { id: 'light', label: 'Light mode', description: 'High-contrast command interface optimized for daylight operations centers.', icon: Sun },
  { id: 'dark', label: 'Dark mode', description: 'Reduced glare layout for extended night shifts and low-light environments.', icon: Moon },
]

const NAV = [
  { id: 'profile', label: 'Profile', icon: UserCircle },
  { id: 'appearance', label: 'Appearance', icon: Palette },
  { id: 'notifications', label: 'Notifications', icon: Bell },
  { id: 'map', label: 'Map Preferences', icon: Map },
  { id: 'dispatch', label: 'Dispatch', icon: Send },
  { id: 'shift', label: 'Shift', icon: Clock },
  { id: 'language', label: 'Language', icon: Languages },
  { id: 'audio', label: 'Audio', icon: Volume2 },
  { id: 'security', label: 'Security', icon: ShieldCheck },
]

const OVERRIDE_REASONS = [
  'Local knowledge of area',
  'Unit availability conflict',
  'Traffic conditions',
  'Officer safety concern',
  'Resource type mismatch',
  'Priority re-assessment',
]

const DISPATCHER_TOGGLES_KEY = 'resq-dispatcher-notification-prefs'
const DISPATCHER_DEFAULT_TOGGLES = {
  soundCritical: true,
  soundAi: true,
  soundNew: false,
  popupCritical: true,
  popupAi: true,
  popupUnit: false,
  popupShift: true,
  badgeSystem: true,
  badgePerf: true,
  trafficOverlay: true,
  coverageRings: false,
  aiAutoOpen: true,
  dispatchFab: true,
  handoverDraft: true,
  muteAll: false,
}
function loadDispatcherToggles() {
  try {
    const raw = localStorage.getItem(DISPATCHER_TOGGLES_KEY)
    return raw ? { ...DISPATCHER_DEFAULT_TOGGLES, ...JSON.parse(raw) } : DISPATCHER_DEFAULT_TOGGLES
  } catch {
    return DISPATCHER_DEFAULT_TOGGLES
  }
}

export default function DispatcherSettingsView() {
  const { section: sectionParam } = useParams()
  const navigate = useNavigate()
  const section = sectionParam || 'profile'
  const { theme, setTheme } = useThemeStore()
  const pushToast = useToastStore((s) => s.pushToast)
  const [mfaEnabled, setMfaEnabled] = useState(false)

  // Persisted to localStorage (same fix already applied to Admin's settings
  // this session) — these were plain useState with zero persistence, so
  // every toggle silently reset back to default on reload.
  const [toggles, setToggles] = useState(loadDispatcherToggles)

  useEffect(() => {
    localStorage.setItem(DISPATCHER_TOGGLES_KEY, JSON.stringify(toggles))
  }, [toggles])

  const [mapDistrict, setMapDistrict] = useState('all')
  const [mapZoom, setMapZoom] = useState(12)
  const [unitLabels, setUnitLabels] = useState('always')
  const [language, setLanguage] = useState('en')
  const [volume, setVolume] = useState(75)
  const [toneCritical, setToneCritical] = useState('siren')
  const [toneHigh, setToneHigh] = useState('beep')
  const [toneMed, setToneMed] = useState('beep')
  const [overrideReasons, setOverrideReasons] = useState([])
  const flashToast = () => {
    pushToast({ variant: 'success', title: 'Saved', message: 'Settings updated' })
  }

  const setToggle = (key, val) => {
    setToggles((t) => ({ ...t, [key]: val }))
    flashToast()
  }

  const toggleReason = (reason) => {
    setOverrideReasons((prev) => {
      if (prev.includes(reason)) return prev.filter((r) => r !== reason)
      if (prev.length >= 3) return prev
      return [...prev, reason]
    })
    flashToast()
  }

  return (
    <SettingsNavLayout
      breadcrumbParent="Dispatcher"
      portalLabel="Configure your dispatcher workspace preferences. Changes apply immediately on this terminal."
      basePath="/dispatcher/settings"
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
              <p className="text-[13px] text-(--text-secondary) m-0 mb-1">Control how and when you are alerted.</p>
              <p className="text-[11px] text-(--text-muted) italic m-0 mb-4">
                Stored locally on this device — the actual notification chime is controlled by the speaker icon next to the bell, not these toggles.
              </p>
              <SettingsGroup title="Alert Sounds">
                <SettingsToggleRow label="Critical incidents (LEVEL 3+)" description="Play alarm sound for critical incidents" on={toggles.soundCritical} onChange={(v) => setToggle('soundCritical', v)} />
                <SettingsToggleRow label="AI recommendation ready" description="Play chime when AI dispatch recommendation is ready" on={toggles.soundAi} onChange={(v) => setToggle('soundAi', v)} />
                <SettingsToggleRow label="New incident assigned" description="Play sound when a new incident enters your queue" on={toggles.soundNew} onChange={(v) => setToggle('soundNew', v)} />
              </SettingsGroup>
              <SettingsGroup title="Popup Alerts">
                <SettingsToggleRow label="Critical escalations" description="Show popup for critical escalations" on={toggles.popupCritical} onChange={(v) => setToggle('popupCritical', v)} />
                <SettingsToggleRow label="AI recommendations" description="Show popup when AI recommendation is ready" on={toggles.popupAi} onChange={(v) => setToggle('popupAi', v)} />
                <SettingsToggleRow label="Unit status changes" description="Show popup for unit status changes" on={toggles.popupUnit} onChange={(v) => setToggle('popupUnit', v)} />
                <SettingsToggleRow label="Shift reminders" description="Show popup for shift reminders" on={toggles.popupShift} onChange={(v) => setToggle('popupShift', v)} />
              </SettingsGroup>
              <SettingsGroup title="Badge Only (no sound, no popup)">
                <SettingsToggleRow label="System messages" on={toggles.badgeSystem} onChange={(v) => setToggle('badgeSystem', v)} />
                <SettingsToggleRow label="Performance reports" on={toggles.badgePerf} onChange={(v) => setToggle('badgePerf', v)} />
              </SettingsGroup>
            </div>
          )}

          {section === 'map' && (
            <div className="settings-section-card dispatcher-surface p-5 w-full">
              <h2 className="text-base font-bold m-0 mb-1" style={{ fontFamily: 'var(--font-display)' }}>Map Preferences</h2>
              <p className="text-[13px] text-(--text-secondary) m-0 mb-4">Configure your default Live Dispatch Map view.</p>
              <label className="settings-form-field dispatcher-field mb-4 block">
                <span className="field-label">Default district on map open</span>
                <select className="dispatcher-input dispatcher-select w-full" value={mapDistrict} onChange={(e) => { setMapDistrict(e.target.value); flashToast() }}>
                  <option value="all">All Kigali</option>
                  <option value="nyarugenge">Nyarugenge</option>
                  <option value="kicukiro">Kicukiro</option>
                  <option value="gasabo">Gasabo</option>
                  <option value="nyamirambo">Nyamirambo</option>
                </select>
              </label>
              <label className="settings-form-field dispatcher-field mb-4 block">
                <span className="field-label">Default zoom level — Level {mapZoom}</span>
                <input type="range" min={10} max={16} step={1} value={mapZoom} className="w-full accent-(--accent)" onChange={(e) => { setMapZoom(Number(e.target.value)); flashToast() }} />
              </label>
              <SettingsToggleRow label="Traffic overlay on by default" on={toggles.trafficOverlay} onChange={(v) => setToggle('trafficOverlay', v)} />
              <div className="py-3 border-b border-(--border-subtle)">
                <div className="text-[13px] font-medium mb-2">Unit labels display</div>
                <label className="flex items-center gap-2 text-[13px] mb-1.5 cursor-pointer">
                  <input type="radio" name="unitLabels" checked={unitLabels === 'always'} onChange={() => { setUnitLabels('always'); flashToast() }} className="accent-(--accent)" />
                  Always show unit IDs on map
                </label>
                <label className="flex items-center gap-2 text-[13px] cursor-pointer">
                  <input type="radio" name="unitLabels" checked={unitLabels === 'hover'} onChange={() => { setUnitLabels('hover'); flashToast() }} className="accent-(--accent)" />
                  Show only on hover
                </label>
              </div>
              <SettingsToggleRow label="Show coverage rings" description="Display response radius circles around standby units" on={toggles.coverageRings} onChange={(v) => setToggle('coverageRings', v)} />
            </div>
          )}

          {section === 'dispatch' && (
            <div className="settings-section-card dispatcher-surface p-5 w-full">
              <h2 className="text-base font-bold m-0 mb-1" style={{ fontFamily: 'var(--font-display)' }}>Dispatch Preferences</h2>
              <p className="text-[13px] text-(--text-secondary) m-0 mb-4">Customize your dispatch workflow.</p>
              <SettingsToggleRow label="AI Engine auto-open on new incident" description="Automatically navigate to AI Dispatch Engine when a new incident is logged" on={toggles.aiAutoOpen} onChange={(v) => setToggle('aiAutoOpen', v)} />
              <SettingsToggleRow label="Show Dispatch Immediate floating button on map" description="Show the fast-dispatch button on the Live Map when critical incidents exist" on={toggles.dispatchFab} onChange={(v) => setToggle('dispatchFab', v)} />
              <div className="mt-4">
                <div className="text-[13px] font-medium mb-1">Default override reason (top of dropdown)</div>
                <p className="text-[12px] text-(--text-secondary) m-0 mb-2">Check up to 3 — checked items appear first in override dropdown</p>
                <div className="flex flex-col gap-2">
                  {OVERRIDE_REASONS.map((r) => (
                    <label key={r} className="flex items-center gap-2 text-[13px] cursor-pointer">
                      <input type="checkbox" checked={overrideReasons.includes(r)} onChange={() => toggleReason(r)} className="accent-(--accent)" />
                      {r}
                    </label>
                  ))}
                </div>
              </div>
            </div>
          )}

          {section === 'shift' && (
            <SettingsShiftManagementSection variant="dispatcher" onSave={flashToast} />
          )}

          {section === 'language' && (
            <div className="settings-section-card dispatcher-surface p-5 w-full">
              <h2 className="text-base font-bold m-0 mb-1" style={{ fontFamily: 'var(--font-display)' }}>Language</h2>
              <p className="text-[13px] text-(--text-secondary) m-0 mb-4">Select your preferred interface language.</p>
              <div className="settings-theme-grid">
                <button type="button" className="settings-theme-card opacity-80" disabled>
                  <span className="settings-theme-card-icon text-2xl">🇷🇼</span>
                  <div className="settings-theme-card-body">
                    <div className="settings-theme-card-title flex items-center gap-2">
                      Kinyarwanda
                      <span className="text-[10px] text-(--text-muted) border border-(--border) rounded px-1.5 py-0.5 font-normal">Coming soon</span>
                    </div>
                    <p className="settings-theme-card-desc">Indimi y&apos;igihugu</p>
                  </div>
                </button>
                <button type="button" className={`settings-theme-card${language === 'en' ? ' settings-theme-card--active' : ''}`} onClick={() => { setLanguage('en'); flashToast() }}>
                  <span className="settings-theme-card-icon text-2xl">🇬🇧</span>
                  <div className="settings-theme-card-body">
                    <div className="settings-theme-card-title">English</div>
                    <p className="settings-theme-card-desc">Default interface language</p>
                  </div>
                  {language === 'en' && <span className="settings-theme-card-check"><Check size={16} /></span>}
                </button>
              </div>
            </div>
          )}

          {section === 'audio' && (
            <div className="settings-section-card dispatcher-surface p-5 w-full">
              <h2 className="text-base font-bold m-0 mb-1" style={{ fontFamily: 'var(--font-display)' }}>Audio Settings</h2>
              <p className="text-[13px] text-(--text-secondary) m-0 mb-4">Configure alert sounds for your dispatch environment.</p>
              <label className="settings-form-field dispatcher-field mb-4 block">
                <span className="field-label">Alert Volume — {volume}%</span>
                <input type="range" min={0} max={100} step={5} value={volume} className="w-full accent-(--accent)" onChange={(e) => { setVolume(Number(e.target.value)); flashToast() }} />
              </label>
              {[
                { label: 'Alert tone for CRITICAL incidents', value: toneCritical, set: setToneCritical },
                { label: 'Alert tone for HIGH incidents', value: toneHigh, set: setToneHigh },
                { label: 'Alert tone for MEDIUM and LOW', value: toneMed, set: setToneMed },
              ].map((row) => (
                <div key={row.label} className="flex flex-wrap items-end gap-2 mb-3">
                  <label className="settings-form-field dispatcher-field flex-1 min-w-[200px]">
                    <span className="field-label">{row.label}</span>
                    <select className="dispatcher-input dispatcher-select w-full" value={row.value} onChange={(e) => { row.set(e.target.value); flashToast() }}>
                      <option value="siren">Alarm Siren</option>
                      <option value="beep">Triple Beep</option>
                      <option value="horn">Horn Blast</option>
                    </select>
                  </label>
                  <button type="button" className="dispatcher-btn-ghost text-[12px] flex items-center gap-1 mb-0.5">
                    <Play size={14} /> Test
                  </button>
                </div>
              ))}
              <SettingsToggleRow label="Mute all sounds" description="Override all audio settings. Badge notifications still appear." on={toggles.muteAll} onChange={(v) => setToggle('muteAll', v)} />
              <div className="mt-4 p-3 rounded-lg flex gap-2 text-[12px] text-(--text-secondary)" style={{ background: 'var(--accent-ghost)', border: '1px solid var(--accent)' }}>
                <Info size={16} className="text-(--accent) shrink-0" />
                In a shared operations center, use headphones and coordinate alert volume with your team.
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
              <p className="text-[13px] font-medium mb-3">Devices with active sessions</p>
              {[
                { icon: Monitor, title: 'Windows PC — Chrome', sub: 'Kigali, Rwanda · Current session', badge: 'ACTIVE', active: true },
                { icon: Smartphone, title: 'Android Mobile — RESQ App', sub: 'Last active: 2 days ago', badge: 'INACTIVE', active: false },
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
                    {!s.active && (
                      <button type="button" className="text-[12px] font-semibold bg-transparent border-none cursor-pointer" style={{ color: 'var(--status-critical)' }}>Revoke</button>
                    )}
                  </div>
                )
              })}
              <button type="button" className="dispatcher-btn-ghost mt-2" style={{ borderColor: 'var(--status-critical)', color: 'var(--status-critical)' }}>Revoke all other sessions</button>

              <div className="mt-8 flex flex-wrap items-center gap-3 p-4 rounded-lg border border-(--border) bg-(--bg-input)">
                <ShieldCheck size={22} color="var(--accent)" />
                <div className="flex-1 min-w-[180px]">
                  <div className="font-semibold text-[13px]">Two-factor authentication</div>
                  <p className="text-[12px] text-(--text-secondary) m-0 mt-1">
                    Adds a second verification step at login using an authenticator app or SMS to your registered phone number.
                  </p>
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

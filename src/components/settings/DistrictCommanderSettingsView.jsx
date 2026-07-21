import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
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
  ClipboardList,
  Lock,
  Unlock,
} from 'lucide-react'
import { useThemeStore } from '../../store/themeStore'
import StatusBadge from '../dispatcher/StatusBadge'
import { SettingsToggleRow, SettingsGroup } from './SettingsToggle'
import SettingsPasswordSection from './SettingsPasswordSection'
import SettingsTrustedIpsSection from './SettingsTrustedIpsSection'
import SettingsProfileSection from './SettingsProfileSection'
import SettingsNavLayout from './SettingsNavLayout'
import { getDistrictCommanderDistrict } from '../../utils/districtCommanderSession'
import { useToastStore } from '../../store/toastStore'
import { listLockedUsersDc, unlockUserDc } from '../../api/admin'

const THEME_OPTIONS = [
  {
    id: 'light',
    label: 'Light mode',
    description: 'High-contrast command interface optimized for daylight operations centers.',
    icon: Sun,
  },
  {
    id: 'dark',
    label: 'Dark mode',
    description: 'Reduced glare layout for extended night shifts and low-light environments.',
    icon: Moon,
  },
]

const NAV = [
  { id: 'profile', label: 'Profile', icon: UserCircle },
  { id: 'appearance', label: 'Appearance', icon: Palette },
  { id: 'notifications', label: 'Notifications', icon: Bell },
  { id: 'district', label: 'District', icon: MapPin },
  { id: 'language', label: 'Language', icon: Languages },
  { id: 'security', label: 'Security', icon: ShieldCheck },
  { id: 'locked-accounts', label: 'Locked Accounts', icon: Lock },
]

const DC_TOGGLES_KEY = 'resq-districtcommander-notification-prefs'
const DC_DEFAULT_TOGGLES = {
  shiftReportsPending: true,
  coverageCritical: true,
  hqResourceUpdates: true,
  executiveReportReminders: true,
  omFlaggedReports: true,
  unitPerformanceAlerts: false,
  badgeSystem: true,
  districtAutoOpenReports: true,
  districtMapLabels: true,
}
function loadDcToggles() {
  try {
    const raw = localStorage.getItem(DC_TOGGLES_KEY)
    return raw ? { ...DC_DEFAULT_TOGGLES, ...JSON.parse(raw) } : DC_DEFAULT_TOGGLES
  } catch {
    return DC_DEFAULT_TOGGLES
  }
}

export default function DistrictCommanderSettingsView() {
  const { section: sectionParam } = useParams()
  const section = sectionParam || 'profile'
  const district = getDistrictCommanderDistrict()
  const { theme, setTheme } = useThemeStore()
  const pushToast = useToastStore((s) => s.pushToast)
  const [language, setLanguage] = useState('en')
  const [lockedUsers, setLockedUsers] = useState([])
  const [lockedLoading, setLockedLoading] = useState(true)
  const [unlockingId, setUnlockingId] = useState(null)
  const navigate = useNavigate()
  const [mfaEnabled, setMfaEnabled] = useState(false)
  // Persisted to localStorage — was plain in-memory useState resetting to
  // default on every reload.
  const [toggles, setToggles] = useState(loadDcToggles)

  useEffect(() => {
    localStorage.setItem(DC_TOGGLES_KEY, JSON.stringify(toggles))
  }, [toggles])

  const flashToast = () => {
    pushToast({ variant: 'success', title: 'Saved', message: 'Settings updated' })
  }

  const setToggle = (key, val) => {
    setToggles((t) => ({ ...t, [key]: val }))
    flashToast()
  }

  function refreshLockedUsers() {
    setLockedLoading(true)
    listLockedUsersDc()
      .then((u) => setLockedUsers(u))
      .catch(() => {})
      .finally(() => setLockedLoading(false))
  }

  useEffect(() => {
    if (section === 'locked-accounts') Promise.resolve().then(() => refreshLockedUsers())
  }, [section])

  async function handleUnlock(userId) {
    setUnlockingId(userId)
    try {
      await unlockUserDc(userId)
      setLockedUsers((prev) => prev.filter((u) => u.user_id !== userId))
      flashToast()
    } catch {
      // no-op — user can retry
    } finally {
      setUnlockingId(null)
    }
  }

  return (
    <SettingsNavLayout
      breadcrumbParent="District Command"
      portalLabel="Configure your district command preferences. Changes apply immediately on this terminal."
      basePath="/district-commander/settings"
      navItems={NAV}
    >
      {section === 'profile' && (
        <SettingsProfileSection
          onUserLoaded={(u) => setMfaEnabled(u.mfa_enabled)}
          shiftStats={[
            { label: 'Command window', value: '—' },
            { label: 'Shift reports pending', value: '—' },
            { label: 'Time on command', value: '00:00:00', mono: true },
            { label: 'Assigned district', value: district },
          ]}
        />
      )}

      {section === 'appearance' && (
        <div className="settings-section-card dispatcher-surface p-5 w-full">
          <div className="flex items-center gap-2 mb-1">
            <Palette size={16} color="var(--accent)" />
            <span className="text-sm font-bold tracking-[0.04em]" style={{ fontFamily: 'var(--font-display)' }}>
              APPEARANCE
            </span>
          </div>
          <p className="text-[12px] text-(--text-muted) m-0 mb-4">
            Select your preferred interface theme for the RESQ portal.
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
        <div className="settings-section-card dispatcher-surface p-5 w-full">
          <h2 className="text-base font-bold m-0 mb-1" style={{ fontFamily: 'var(--font-display)' }}>
            Notification Settings
          </h2>
          <p className="text-[13px] text-(--text-secondary) m-0 mb-1">
            Alerts for district oversight and headquarters coordination.
          </p>
          <p className="text-[11px] text-(--text-muted) italic m-0 mb-4">
            Stored locally on this device — not yet wired to a notification-delivery backend, so every event above is still delivered regardless of these toggles.
          </p>
          <SettingsGroup title="Shift & Reports">
            <SettingsToggleRow
              label="Pending shift reports"
              description="When an Operations Manager submits a report awaiting your review"
              on={toggles.shiftReportsPending}
              onChange={(v) => setToggle('shiftReportsPending', v)}
            />
            <SettingsToggleRow
              label="Flagged reports"
              description="Follow-up required on reports you or HQ flagged"
              on={toggles.omFlaggedReports}
              onChange={(v) => setToggle('omFlaggedReports', v)}
            />
            <SettingsToggleRow
              label="Executive report reminders"
              description="Monthly district executive report due dates"
              on={toggles.executiveReportReminders}
              onChange={(v) => setToggle('executiveReportReminders', v)}
            />
          </SettingsGroup>
          <SettingsGroup title="Operations">
            <SettingsToggleRow
              label="Critical coverage gaps"
              description="Sector coverage drops below safe threshold"
              on={toggles.coverageCritical}
              onChange={(v) => setToggle('coverageCritical', v)}
            />
            <SettingsToggleRow
              label="HQ resource request updates"
              description="Status changes on requests to RNP Headquarters"
              on={toggles.hqResourceUpdates}
              onChange={(v) => setToggle('hqResourceUpdates', v)}
            />
            <SettingsToggleRow
              label="Unit performance alerts"
              description="Units requiring attention on performance metrics"
              on={toggles.unitPerformanceAlerts}
              onChange={(v) => setToggle('unitPerformanceAlerts', v)}
            />
            <SettingsToggleRow
              label="System messages"
              on={toggles.badgeSystem}
              onChange={(v) => setToggle('badgeSystem', v)}
            />
          </SettingsGroup>
        </div>
      )}

      {section === 'district' && (
        <div className="settings-section-card dispatcher-surface p-5 w-full">
          <div className="flex items-center gap-2 mb-1">
            <MapPin size={16} color="var(--accent)" />
            <span className="text-sm font-bold tracking-[0.04em]" style={{ fontFamily: 'var(--font-display)' }}>
              DISTRICT ASSIGNMENT
            </span>
          </div>
          <p className="text-[13px] text-(--text-secondary) m-0 mb-4">
            Your command scope is limited to the assigned district. All dashboards and reports filter to this area.
          </p>
          <div
            className="rounded-lg p-4 mb-4"
            style={{ background: 'var(--accent-ghost)', border: '1px solid var(--accent)' }}
          >
            <div className="text-[10px] uppercase tracking-wider text-(--text-muted) mb-1">Assigned district</div>
            <div className="text-[22px] font-bold text-(--accent)" style={{ fontFamily: 'var(--font-display)' }}>
              {district}
            </div>
            <p className="text-[12px] text-(--text-secondary) m-0 mt-2">
              Province: Kigali City · Demo session
            </p>
          </div>
          <div className="dispatcher-section-title mb-3">
            <span className="dispatcher-section-accent" aria-hidden />
            <ClipboardList size={16} className="text-(--accent)" />
            <span className="panel-title">District oversight defaults</span>
          </div>
          <SettingsGroup title="Review workflow">
            <SettingsToggleRow
              label="Auto-open pending shift reports"
              description="Open the oldest pending report when you visit Shift Reports"
              on={toggles.districtAutoOpenReports}
              onChange={(v) => setToggle('districtAutoOpenReports', v)}
            />
            <SettingsToggleRow
              label="Coverage map — sector labels"
              description="Show sector names on the coverage analysis map by default"
              on={toggles.districtMapLabels}
              onChange={(v) => setToggle('districtMapLabels', v)}
            />
          </SettingsGroup>
          <p className="text-[11px] text-(--text-muted) m-0 mt-4">
            Not yet implemented: review-workflow toggles above are stored only in this browser tab and are not yet
            enforced by Shift Reports or the Coverage map.
          </p>
          <p className="text-[11px] text-(--text-muted) italic m-0 mt-4">
            To change your assigned district, contact RNP Headquarters provisioning.
          </p>
        </div>
      )}

      {section === 'language' && (
        <div className="settings-section-card dispatcher-surface p-5 w-full">
          <h2 className="text-base font-bold m-0 mb-1" style={{ fontFamily: 'var(--font-display)' }}>
            Language
          </h2>
          <p className="text-[13px] text-(--text-secondary) m-0 mb-4">Select your preferred interface language.</p>
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
        <div className="settings-section-card dispatcher-surface p-5 w-full">
          <h2 className="text-base font-bold m-0 mb-1" style={{ fontFamily: 'var(--font-display)' }}>
            Security & Access
          </h2>
          <p className="text-[13px] text-(--text-secondary) m-0 mb-4">Manage your account security.</p>
          <SettingsPasswordSection onSuccess={flashToast} />
              <SettingsTrustedIpsSection onSuccess={flashToast} />

          <div
            className="mt-8 text-[11px] font-bold uppercase tracking-wider text-(--text-muted) mb-3"
            style={{ fontFamily: 'var(--font-display)' }}
          >
            Active Sessions
          </div>
          <p className="text-[11px] text-(--text-muted) m-0 mb-3">
            Not yet implemented: session tracking below is illustrative sample data, not a live list from the
            backend. There is no remote sign-out endpoint yet.
          </p>
          {[
            {
              icon: Monitor,
              title: 'Windows PC — Chrome',
              sub: 'Kigali, Rwanda · Current session',
              badge: 'ACTIVE',
              active: true,
            },
            {
              icon: Smartphone,
              title: 'Android Mobile — RESQ App',
              sub: 'Last active: 1 day ago',
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

          <div className="mt-8 flex flex-wrap items-center gap-3 p-4 rounded-lg border border-(--border) bg-(--bg-input)">
            <ShieldCheck size={22} color="var(--accent)" />
            <div className="flex-1 min-w-[180px]">
              <div className="font-semibold text-[13px]">Two-factor authentication</div>
              <p className="text-[12px] text-(--text-secondary) m-0 mt-1">
                Required for district commander terminal access.
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

      {section === 'locked-accounts' && (
        <div className="settings-section-card dispatcher-surface p-5 w-full">
          <h2 className="text-base font-bold m-0 mb-1" style={{ fontFamily: 'var(--font-display)' }}>
            Locked Accounts
          </h2>
          <p className="text-[13px] text-(--text-secondary) m-0 mb-4">
            Accounts in your district locked after a login attempt from an unrecognized IP. Unlocking
            trusts that IP so the same account won&apos;t immediately relock.
          </p>
          {lockedLoading ? (
            <div className="text-[12px] text-(--text-muted) py-4">Loading locked accounts…</div>
          ) : lockedUsers.length === 0 ? (
            <p className="text-[12px] text-center py-4" style={{ color: 'var(--status-low)' }}>
              ✓ No accounts in your district are currently locked
            </p>
          ) : (
            <div className="flex flex-col gap-2">
              {lockedUsers.map((u) => (
                <div key={u.user_id} className="flex items-center gap-3 p-3 rounded-lg border border-(--border) bg-(--bg-input)">
                  <Lock size={18} className="text-(--status-critical)" />
                  <div className="flex-1 min-w-0">
                    <div className="text-[13px] font-semibold">{u.full_name} <span className="text-(--text-muted) font-normal">({u.role})</span></div>
                    <div className="text-[12px] text-(--text-secondary)">
                      Attempted IP: <span className="font-mono">{u.attempted_ip ?? '—'}</span>
                      {u.locked_at && <> · Locked {new Date(u.locked_at).toLocaleString()}</>}
                    </div>
                  </div>
                  <button
                    type="button"
                    className="dispatcher-btn-ghost text-[11px] inline-flex items-center gap-1"
                    disabled={unlockingId === u.user_id}
                    onClick={() => handleUnlock(u.user_id)}
                  >
                    <Unlock size={12} />
                    {unlockingId === u.user_id ? 'Unlocking…' : 'Unlock'}
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </SettingsNavLayout>
  )
}

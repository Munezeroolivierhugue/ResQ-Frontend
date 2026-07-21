import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { Sun, Moon, Palette, Check, ShieldCheck, Monitor, Bell, Languages, UserCircle } from 'lucide-react'
import { useThemeStore } from '../../store/themeStore'
import StatusBadge from '../dispatcher/StatusBadge'
import SettingsPasswordSection from './SettingsPasswordSection'
import SettingsTrustedIpsSection from './SettingsTrustedIpsSection'
import SettingsProfileSection from './SettingsProfileSection'
import SettingsNavLayout from './SettingsNavLayout'
import { SettingsToggleRow, SettingsGroup } from './SettingsToggle'
import { useToastStore } from '../../store/toastStore'

const THEME_OPTIONS = [
  { id: 'light', label: 'Light mode', description: 'High-contrast command interface optimized for daylight operations centers.', icon: Sun },
  { id: 'dark', label: 'Dark mode', description: 'Reduced glare layout for extended night shifts and low-light environments.', icon: Moon },
]

const NAV = [
  { id: 'profile', label: 'Profile', icon: UserCircle },
  { id: 'appearance', label: 'Appearance', icon: Palette },
  { id: 'notifications', label: 'Notifications', icon: Bell },
  { id: 'language', label: 'Language', icon: Languages },
  { id: 'security', label: 'Security', icon: ShieldCheck },
]

const NOTIFICATION_PREFS_KEY = 'resq-admin-notification-prefs'
const DEFAULT_TOGGLES = {
  newUserInvite: true,
  inviteAccepted: true,
  systemHealthCritical: true,
  systemHealthWarning: true,
  integrationDown: true,
  integrationRestored: false,
  securityLoginAnomaly: true,
  securityMfaDisabled: true,
  auditHighRisk: true,
  auditBulkExport: false,
}

function loadStoredToggles() {
  try {
    const raw = localStorage.getItem(NOTIFICATION_PREFS_KEY)
    return raw ? { ...DEFAULT_TOGGLES, ...JSON.parse(raw) } : DEFAULT_TOGGLES
  } catch {
    return DEFAULT_TOGGLES
  }
}

export default function AdminPortalSettingsView() {
  const { section: sectionParam } = useParams()
  const section = sectionParam || 'profile'
  const { theme, setTheme } = useThemeStore()
  const pushToast = useToastStore((s) => s.pushToast)
  const navigate = useNavigate()
  const [mfaEnabled, setMfaEnabled] = useState(false)
  const [language, setLanguage] = useState('en')
  // Persisted to localStorage (same "stored locally" pattern as the theme
  // toggle above) — these were previously plain useState with no persistence
  // at all, so every toggle silently reset back to its default on reload.
  const [toggles, setToggles] = useState(loadStoredToggles)

  useEffect(() => {
    localStorage.setItem(NOTIFICATION_PREFS_KEY, JSON.stringify(toggles))
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
      breadcrumbParent="Administration"
      portalLabel="Configure your administration workspace preferences. Changes apply immediately on this terminal."
      basePath="/admin/settings"
      navItems={NAV}
    >
      {section === 'profile' && (
        <SettingsProfileSection
          onUserLoaded={(u) => setMfaEnabled(u.mfa_enabled)}
          showShift={false}
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
          <h2 className="text-base font-bold m-0 mb-1" style={{ fontFamily: 'var(--font-display)' }}>
            Notification Settings
          </h2>
          <p className="text-[13px] text-(--text-secondary) m-0 mb-1">
            Control which system events and alerts reach you as Super Admin.
          </p>
          <p className="text-[11px] text-(--text-muted) italic m-0 mb-4">
            Stored locally on this device — these preferences aren't yet enforced by the backend, so every event above is still delivered regardless of these toggles.
          </p>

          <SettingsGroup title="User Provisioning">
            <SettingsToggleRow
              label="New user invitation dispatched"
              description="When any admin sends an invitation link to a new user"
              on={toggles.newUserInvite}
              onChange={(v) => setToggle('newUserInvite', v)}
            />
            <SettingsToggleRow
              label="Invitation accepted"
              description="When an invited user completes registration and activates their account"
              on={toggles.inviteAccepted}
              onChange={(v) => setToggle('inviteAccepted', v)}
            />
          </SettingsGroup>

          <SettingsGroup title="System Health">
            <SettingsToggleRow
              label="Critical system alerts"
              description="AI model failures, database issues, or response time SLA breaches"
              on={toggles.systemHealthCritical}
              onChange={(v) => setToggle('systemHealthCritical', v)}
            />
            <SettingsToggleRow
              label="Health warnings"
              description="Coverage drops, dispatch queue overloads, and scheduled job failures"
              on={toggles.systemHealthWarning}
              onChange={(v) => setToggle('systemHealthWarning', v)}
            />
          </SettingsGroup>

          <SettingsGroup title="Integrations">
            <SettingsToggleRow
              label="Integration disconnected"
              description="When an external service (CAD, GPS, radio) goes offline"
              on={toggles.integrationDown}
              onChange={(v) => setToggle('integrationDown', v)}
            />
            <SettingsToggleRow
              label="Integration restored"
              description="When a disconnected service reconnects successfully"
              on={toggles.integrationRestored}
              onChange={(v) => setToggle('integrationRestored', v)}
            />
          </SettingsGroup>

          <SettingsGroup title="Security Events">
            <SettingsToggleRow
              label="Anomalous login detected"
              description="Login from an unrecognized device, location, or at unusual hours"
              on={toggles.securityLoginAnomaly}
              onChange={(v) => setToggle('securityLoginAnomaly', v)}
            />
            <SettingsToggleRow
              label="MFA disabled on any account"
              description="Alert when two-factor authentication is turned off for any user"
              on={toggles.securityMfaDisabled}
              onChange={(v) => setToggle('securityMfaDisabled', v)}
            />
          </SettingsGroup>

          <SettingsGroup title="Audit Trail">
            <SettingsToggleRow
              label="High-risk audit events"
              description="Role changes, account deletions, and permission escalations"
              on={toggles.auditHighRisk}
              onChange={(v) => setToggle('auditHighRisk', v)}
            />
            <SettingsToggleRow
              label="Bulk data exports"
              description="When any user exports more than 500 records at once"
              on={toggles.auditBulkExport}
              onChange={(v) => setToggle('auditBulkExport', v)}
            />
          </SettingsGroup>
        </div>
      )}

      {section === 'language' && (
        <div className="settings-section-card dispatcher-surface p-5 w-full">
          <h2 className="text-base font-bold m-0 mb-1" style={{ fontFamily: 'var(--font-display)' }}>
            Language
          </h2>
          <p className="text-[13px] text-(--text-secondary) m-0 mb-4">
            Select your preferred interface language for the RESQ portal.
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
              onClick={() => { setLanguage('en'); flashToast() }}
            >
              <span className="settings-theme-card-icon text-2xl">🇬🇧</span>
              <div className="settings-theme-card-body">
                <div className="settings-theme-card-title">English</div>
                <p className="settings-theme-card-desc">Default portal language for all RNP terminals.</p>
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

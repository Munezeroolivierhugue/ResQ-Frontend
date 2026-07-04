import { useState } from 'react'
import { useParams } from 'react-router-dom'
import { Sun, Moon, Palette, Check, Bell, ShieldCheck, UserCircle, Languages } from 'lucide-react'
import { useThemeStore } from '../../store/themeStore'
import SettingsNavLayout from './SettingsNavLayout'
import SettingsToast from './SettingsToast'
import SettingsProfileSection from './SettingsProfileSection'
import SettingsPasswordSection from './SettingsPasswordSection'
import { SettingsToggleRow, SettingsGroup } from './SettingsToggle'
import { PLANNER_DISTRICT } from '../../data/mockPlannerData'

const THEME_OPTIONS = [
  { id: 'light', label: 'Light mode', description: 'High-contrast planning interface for daylight analysis.', icon: Sun },
  { id: 'dark', label: 'Dark mode', description: 'Reduced glare for extended planning sessions.', icon: Moon },
]

const NAV = [
  { id: 'profile', label: 'Profile', icon: UserCircle },
  { id: 'appearance', label: 'Appearance', icon: Palette },
  { id: 'notifications', label: 'Notifications', icon: Bell },
  { id: 'language', label: 'Language', icon: Languages },
  { id: 'security', label: 'Security', icon: ShieldCheck },
]

export default function PlannerSettingsView() {
  const { section: sectionParam } = useParams()
  const section = sectionParam || 'profile'
  const { theme, setTheme } = useThemeStore()
  const [toast, setToast] = useState(false)
  const [language, setLanguage] = useState('en')
  const [toggles, setToggles] = useState({
    predictionAlerts: true,
    approvalUpdates: true,
    coverageGaps: true,
    modelUpdates: true,
  })

  const flashToast = () => {
    setToast(true)
    setTimeout(() => setToast(false), 2500)
  }

  const setToggle = (key, val) => {
    setToggles((t) => ({ ...t, [key]: val }))
    flashToast()
  }

  return (
    <SettingsNavLayout
      breadcrumbParent="Emergency Planning"
      portalLabel="Configure your emergency planning workspace preferences."
      basePath="/planner/settings"
      navItems={NAV}
      toast={<SettingsToast show={toast} />}
    >
      {section === 'profile' && (
        <SettingsProfileSection
          shiftStats={[
            { label: 'District scope', value: PLANNER_DISTRICT },
            { label: 'Plans this week', value: '—' },
            { label: 'Model accuracy', value: '—' },
          ]}
        />
      )}
      {section === 'appearance' && (
        <div className="settings-section-card dispatcher-surface p-5 w-full">
          <h2 className="text-base font-bold m-0 mb-4">Appearance</h2>
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
        </div>
      )}
      {section === 'notifications' && (
        <div className="settings-section-card dispatcher-surface p-5 w-full">
          <h2 className="text-base font-bold m-0 mb-4">Notifications</h2>
          <SettingsGroup title="Planning Alerts">
            <SettingsToggleRow label="AI prediction updates" on={toggles.predictionAlerts} onChange={(v) => setToggle('predictionAlerts', v)} />
            <SettingsToggleRow label="Deployment approval status" on={toggles.approvalUpdates} onChange={(v) => setToggle('approvalUpdates', v)} />
            <SettingsToggleRow label="Coverage gap warnings" on={toggles.coverageGaps} onChange={(v) => setToggle('coverageGaps', v)} />
            <SettingsToggleRow label="Model retraining notices" on={toggles.modelUpdates} onChange={(v) => setToggle('modelUpdates', v)} />
          </SettingsGroup>
        </div>
      )}
      {section === 'language' && (
        <div className="settings-section-card dispatcher-surface p-5 w-full">
          <h2 className="text-base font-bold m-0 mb-4">Language</h2>
          <button type="button" className="settings-theme-card settings-theme-card--active w-full max-w-xs">
            <span className="settings-theme-card-icon text-2xl">🇬🇧</span>
            <div className="settings-theme-card-body">
              <div className="settings-theme-card-title">English</div>
            </div>
            <span className="settings-theme-card-check"><Check size={16} /></span>
          </button>
        </div>
      )}
      {section === 'security' && (
        <div className="settings-section-card dispatcher-surface p-5 w-full">
          <h2 className="text-base font-bold m-0 mb-4">Security & Access</h2>
          <SettingsPasswordSection onSuccess={flashToast} />
        </div>
      )}
    </SettingsNavLayout>
  )
}

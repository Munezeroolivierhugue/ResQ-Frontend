import { useState } from 'react'
import { useParams } from 'react-router-dom'
import { Sun, Moon, Palette, Bell, ShieldCheck, UserCircle, Languages, Check, Monitor } from 'lucide-react'
import StatusBadge from '../dispatcher/StatusBadge'
import { useThemeStore } from '../../store/themeStore'
import SettingsNavLayout from './SettingsNavLayout'
import SettingsToast from './SettingsToast'
import SettingsProfileSection from './SettingsProfileSection'
import SettingsPasswordSection from './SettingsPasswordSection'
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

export default function AnalystSettingsView() {
  const { section: sectionParam } = useParams()
  const section = sectionParam || 'profile'
  const { theme, setTheme } = useThemeStore()
  const [toast, setToast] = useState(false)
  const [language, setLanguage] = useState('en')
  const [toggles, setToggles] = useState({
    anomalyAlerts: true,
    dataQuality: true,
    modelDrift: true,
    reportDue: true,
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
      breadcrumbParent="Intelligence Portal"
      portalLabel="Configure your analyst workspace preferences."
      basePath="/analyst/settings"
      navItems={NAV}
      toast={<SettingsToast show={toast} />}
    >
      {section === 'profile' && (
        <SettingsProfileSection
          initials="GI"
          roleLabel="ANALYST"
          badge="ANL-0024"
          defaultForm={{
            name: 'Grace Ingabire',
            email: 'g.ingabire@rnp.gov.rw',
            phone: '+250788998877',
            station: 'HQ Central Command — Kigali',
          }}
        />
      )}
      {section === 'appearance' && (
        <SettingsGroup title="Appearance">
          {THEME_OPTIONS.map((opt) => {
            const Icon = opt.icon
            return (
              <button
                key={opt.id}
                type="button"
                className={`settings-theme-card${theme === opt.id ? ' active' : ''}`}
                onClick={() => { setTheme(opt.id); flashToast() }}
              >
                <Icon size={20} />
                <div>
                  <div className="settings-theme-card-title">{opt.label}</div>
                  <div className="settings-theme-card-desc">{opt.description}</div>
                </div>
              </button>
            )
          })}
        </SettingsGroup>
      )}
      {section === 'notifications' && (
        <SettingsGroup title="Intelligence alerts">
          <SettingsToggleRow label="Anomaly detection alerts" checked={toggles.anomalyAlerts} onChange={(v) => setToggle('anomalyAlerts', v)} />
          <SettingsToggleRow label="Data quality degradation" checked={toggles.dataQuality} onChange={(v) => setToggle('dataQuality', v)} />
          <SettingsToggleRow label="AI model drift warnings" checked={toggles.modelDrift} onChange={(v) => setToggle('modelDrift', v)} />
          <SettingsToggleRow label="Report due reminders" checked={toggles.reportDue} onChange={(v) => setToggle('reportDue', v)} />
        </SettingsGroup>
      )}
      {section === 'language' && (
        <SettingsGroup title="Language">
          <select className="dispatcher-input h-10 w-full max-w-xs" value={language} onChange={(e) => { setLanguage(e.target.value); flashToast() }}>
            <option value="en">English</option>
            <option value="rw">Kinyarwanda</option>
            <option value="fr">French</option>
          </select>
        </SettingsGroup>
      )}
      {section === 'security' && <SettingsPasswordSection onSaved={flashToast} />}
    </SettingsNavLayout>
  )
}

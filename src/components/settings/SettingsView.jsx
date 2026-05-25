import { ChevronRight, Sun, Moon, Palette, Check } from 'lucide-react'
import { useThemeStore } from '../../store/themeStore'

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

export default function SettingsView({ portalLabel, breadcrumbParent }) {
  const { theme, setTheme } = useThemeStore()

  return (
    <div className="p-6">
      <div className="mb-6">
        <div className="flex items-center gap-1.5 mb-1">
          <span className="text-[12px] text-(--text-muted)">{breadcrumbParent}</span>
          <ChevronRight size={12} className="text-(--text-muted)" />
          <span className="text-[12px] text-(--text-secondary)">Settings</span>
        </div>
        <h1
          className="text-[26px] font-bold m-0 tracking-[0.04em]"
          style={{ fontFamily: 'var(--font-display)' }}
        >
          SETTINGS
        </h1>
        <p className="text-[13px] text-(--text-secondary) mt-2 m-0">
          Configure your {portalLabel.toLowerCase()} workspace preferences. Changes apply immediately
          on this terminal.
        </p>
      </div>

      <div className="bg-(--bg-surface) border border-(--border) rounded-xl p-5">
        <div className="flex items-center gap-2 mb-1">
          <Palette size={16} color="var(--accent)" />
          <span
            className="text-sm font-bold tracking-[0.04em]"
            style={{ fontFamily: 'var(--font-display)' }}
          >
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
                onClick={() => setTheme(opt.id)}
                className={`settings-theme-card${active ? ' settings-theme-card--active' : ''}`}
                aria-pressed={active}
              >
                <span className="settings-theme-card-icon">
                  <Icon size={22} />
                </span>
                <div className="settings-theme-card-body">
                  <div className="settings-theme-card-title">{opt.label}</div>
                  <p className="settings-theme-card-desc">{opt.description}</p>
                </div>
                {active && (
                  <span className="settings-theme-card-check" aria-hidden>
                    <Check size={16} />
                  </span>
                )}
              </button>
            )
          })}
        </div>

        <p className="settings-theme-status">
          Active theme: <strong>{theme.toUpperCase()}</strong> · Stored locally on this device
        </p>
      </div>
    </div>
  )
}

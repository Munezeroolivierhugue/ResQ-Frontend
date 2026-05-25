import { Link, useParams } from 'react-router-dom'
import { ChevronRight } from 'lucide-react'

export default function SettingsNavLayout({
  breadcrumbParent,
  portalLabel,
  subtitle,
  basePath,
  navItems,
  children,
  toast,
}) {
  const { section } = useParams()
  const activeSection = section || 'profile'

  return (
    <div className="settings-page p-6 w-full">
      <div className="mb-6">
        <div className="flex items-center gap-1.5 mb-1">
          <span className="text-[12px] text-(--text-muted)">{breadcrumbParent}</span>
          <ChevronRight size={12} className="text-(--text-muted)" />
          <span className="text-[12px] text-(--text-secondary)">Settings</span>
        </div>
        <h1 className="text-[26px] font-bold m-0 tracking-[0.04em]" style={{ fontFamily: 'var(--font-display)' }}>
          SETTINGS
        </h1>
        <p className="text-[13px] text-(--text-secondary) mt-2 m-0">{subtitle || portalLabel}</p>
      </div>

      <div className="settings-page-wrapper settings-layout w-full">
        <nav className="settings-left-nav settings-nav flex md:flex-col gap-0.5 overflow-x-auto md:overflow-visible pb-2 md:pb-0">
          {navItems.map((item) => {
            const Icon = item.icon
            const active = activeSection === item.id
            return (
              <Link
                key={item.id}
                to={`${basePath}/${item.id}`}
                className="flex items-center gap-2 px-3 py-2 rounded-lg no-underline whitespace-nowrap text-left text-[13px] font-medium transition-colors shrink-0"
                style={{
                  background: active ? 'var(--accent-ghost)' : 'transparent',
                  color: active ? 'var(--accent)' : 'var(--text-secondary)',
                }}
              >
                <Icon size={16} />
                {item.label}
              </Link>
            )
          })}
        </nav>

        <div className="settings-content-panel settings-section-content w-full min-w-0 flex-1">
          {children}
        </div>
      </div>

      {toast}
    </div>
  )
}

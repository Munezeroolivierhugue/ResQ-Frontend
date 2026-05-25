import { useState } from 'react'
import { Search, ChevronDown, User, LogOut, Settings, Menu } from 'lucide-react'
import { Link } from 'react-router-dom'
import NotificationsDropdown from '../dispatcher/NotificationsDropdown'

export default function Navbar({
  user = { name: 'Jean Bosco', role: 'DISPATCHER' },
  onMenuClick,
  portalLabel = 'Dispatcher Portal',
  profileHref = '/dispatcher/profile',
  settingsHref = '/dispatcher/settings',
}) {
  const [showNotif, setShowNotif] = useState(false)
  const [showUser, setShowUser] = useState(false)

  return (
    <header className="h-15 border-b border-(--border) flex items-center px-5 gap-4 sticky top-0 z-100 shrink-0 bg-surface">

      <button className="navbar-menu-btn p-1.75 rounded-md bg-transparent border-none cursor-pointer flex items-center justify-center text-(--text-secondary) hover:bg-(--bg-elevated) hover:text-(--text-primary) transition-colors" onClick={onMenuClick} aria-label="Open menu">
        <Menu size={20} />
      </button>

      <div className="navbar-portal-label shrink-0">
        <span className="text-[13px] font-bold text-(--text-primary) tracking-[0.08em] uppercase" style={{ fontFamily: 'var(--font-display)' }}>
          {portalLabel}
        </span>
      </div>

      <div className="navbar-search flex-1 flex items-center justify-center">
        <div className="relative w-90">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-(--text-muted)" />
          <input
            placeholder="Search incidents, units, districts…"
            className="w-full h-9 bg-(--bg-input) border border-(--border) rounded-full pl-[34px] pr-3 text-[13px] text-(--text-primary) outline-none focus:border-(--accent) focus:shadow-[0_0_0_3px_var(--accent-ghost)] placeholder:text-(--text-muted)"
            style={{ fontFamily: 'var(--font-body)' }}
          />
        </div>
      </div>

      <div className="flex items-center gap-0.5 ml-auto">
        <NotificationsDropdown
          open={showNotif}
          onToggle={() => { setShowNotif((v) => !v); setShowUser(false) }}
          onClose={() => setShowNotif(false)}
        />

        <div className="relative ml-1">
          <button
            onClick={() => { setShowUser((v) => !v); setShowNotif(false) }}
            className="flex items-center gap-2 px-2 py-1 bg-transparent border-none cursor-pointer rounded-lg hover:bg-(--bg-elevated) transition-colors"
          >
            <div className="w-8 h-8 rounded-full bg-(--accent-ghost) border-2 border-(--accent) flex items-center justify-center font-bold text-[13px] text-(--accent) tracking-[0.04em] shrink-0" style={{ fontFamily: 'var(--font-display)' }}>
              {user.name.split(' ').map((w) => w[0]).join('').slice(0, 2).toUpperCase()}
            </div>
            <div className="navbar-user-text text-left">
              <div className="text-[13px] font-semibold text-(--text-primary) leading-tight">{user.name}</div>
              <div className="text-[10px] text-(--accent) font-bold tracking-[0.08em]" style={{ fontFamily: 'var(--font-display)' }}>{user.role}</div>
            </div>
            <ChevronDown size={13} className="text-(--text-muted)" />
          </button>

          {showUser && (
            <div className="animate-fade-in-up absolute right-0 top-[46px] w-44 bg-(--bg-elevated) border border-(--border) rounded-[10px] z-[200] overflow-hidden shadow-[var(--shadow-dropdown)]">
              {[
                { icon: <User size={14} />, label: 'My Profile', href: profileHref },
                { icon: <Settings size={14} />, label: 'Settings', href: settingsHref },
                { icon: <LogOut size={14} />, label: 'Logout', href: '/login', danger: true },
              ].map((item) => (
                <Link key={item.label} to={item.href}
                  className="flex items-center gap-2.25 px-3.5 py-2.5 text-[13px] font-medium no-underline hover:bg-(--bg-surface) transition-colors"
                  style={{ color: item.danger ? 'var(--status-critical)' : 'var(--text-primary)' }}
                >
                  {item.icon} {item.label}
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>
    </header>
  )
}

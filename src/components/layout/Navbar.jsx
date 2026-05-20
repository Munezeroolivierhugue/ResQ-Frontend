import { useState } from 'react'
import { Sun, Moon, Bell, Search, ChevronDown, User, LogOut, Settings, AlertTriangle, Cpu, RefreshCw, Menu } from 'lucide-react'
import { useThemeStore } from '../../store/themeStore'

const notifications = [
  { id: 1, type: 'alert',  title: 'Critical Incident', desc: 'INC-2403 — Fire in Nyamirambo',   time: '2m ago',  read: false },
  { id: 2, type: 'system', title: 'Unit Offline',       desc: 'AMB-15 went offline',              time: '8m ago',  read: false },
  { id: 3, type: 'update', title: 'Shift Starting',     desc: 'Night shift begins in 30 minutes', time: '22m ago', read: true  },
]

const notifIcon  = { alert: AlertTriangle, system: Cpu, update: RefreshCw }
const notifColor = { alert: 'var(--status-critical)', system: 'var(--status-medium)', update: 'var(--status-info)' }

export default function Navbar({ user = { name: 'Jean Bosco', role: 'DISPATCHER' }, onMenuClick }) {
  const { theme, toggle } = useThemeStore()
  const [showNotif, setShowNotif] = useState(false)
  const [showUser,  setShowUser]  = useState(false)
  const unread = notifications.filter(n => !n.read).length

  return (
    <header className="h-15 border-b border-(--border) flex items-center px-5 gap-4 sticky top-0 z-100 shrink-0 bg-surface">

      <button className="navbar-menu-btn p-1.75 rounded-md bg-transparent border-none cursor-pointer flex items-center justify-center text-(--text-secondary) hover:bg-(--bg-elevated) hover:text-(--text-primary) transition-colors" onClick={onMenuClick} aria-label="Open menu">
        <Menu size={20} />
      </button>

      <div className="navbar-portal-label shrink-0">
        <span className="text-[13px] font-bold text-(--text-primary) tracking-[0.08em] uppercase" style={{ fontFamily: 'var(--font-display)' }}>
          Dispatcher Portal
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

        <button className="p-1.75 rounded-md bg-transparent border-none cursor-pointer flex items-center justify-center text-(--text-secondary) hover:bg-(--bg-elevated) hover:text-(--text-primary) transition-colors" onClick={toggle} aria-label="Toggle theme">
          {theme === 'dark' ? <Sun size={17} /> : <Moon size={17} />}
        </button>

        <div className="relative">
          <button
            className="relative p-1.75 rounded-md bg-transparent border-none cursor-pointer flex items-center justify-center text-(--text-secondary) hover:bg-(--bg-elevated) hover:text-(--text-primary) transition-colors"
            onClick={() => { setShowNotif(v => !v); setShowUser(false) }}
            aria-label="Notifications"
          >
            <Bell size={17} />
            {unread > 0 && (
              <span className="absolute top-0.75 right-0.75 w-3.75 h-3.75 rounded-full bg-(--status-critical) text-[9px] font-bold text-white flex items-center justify-center" style={{ fontFamily: 'var(--font-body)' }}>
                {unread}
              </span>
            )}
          </button>

          {showNotif && (
            <div className="animate-fade-in-up notif-dropdown absolute right-0 top-[46px] w-85 bg-(--bg-elevated) border border-(--border) rounded-xl z-[200] overflow-hidden shadow-[var(--shadow-dropdown)]">
              <div className="px-4 py-2.75 border-b border-(--border) flex justify-between items-center">
                <span className="font-bold text-[15px] tracking-[0.04em]" style={{ fontFamily: 'var(--font-display)' }}>NOTIFICATIONS</span>
                <button className="text-[11px] text-(--accent) bg-none border-none cursor-pointer font-semibold" style={{ fontFamily: 'var(--font-body)' }}>Mark all read</button>
              </div>
              <div className="max-h-75 overflow-y-auto">
                {notifications.map(n => {
                  const Icon = notifIcon[n.type]
                  return (
                    <div key={n.id}
                      className="px-4 py-2.75 border-b border-(--border-subtle) flex gap-2.75 items-start cursor-pointer hover:bg-(--bg-surface) transition-colors"
                      style={{ background: n.read ? 'transparent' : 'var(--accent-ghost)' }}
                    >
                      <Icon size={14} style={{ color: notifColor[n.type], flexShrink: 0, marginTop: 2 }} />
                      <div className="flex-1">
                        <div className="text-[13px] font-semibold">{n.title}</div>
                        <div className="text-[12px] text-(--text-secondary) mt-0.5">{n.desc}</div>
                        <div className="text-[11px] text-(--text-muted) mt-0.75" style={{ fontFamily: 'var(--font-mono)' }}>{n.time}</div>
                      </div>
                      {!n.read && <div className="w-1.75 h-1.75 rounded-full bg-(--accent) shrink-0 mt-1" />}
                    </div>
                  )
                })}
              </div>
            </div>
          )}
        </div>

        <div className="relative ml-1">
          <button
            onClick={() => { setShowUser(v => !v); setShowNotif(false) }}
            className="flex items-center gap-2 px-2 py-1 bg-transparent border-none cursor-pointer rounded-lg hover:bg-(--bg-elevated) transition-colors"
          >
            <div className="w-8 h-8 rounded-full bg-(--accent-ghost) border-2 border-(--accent) flex items-center justify-center font-bold text-[13px] text-(--accent) tracking-[0.04em] shrink-0" style={{ fontFamily: 'var(--font-display)' }}>
              {user.name.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase()}
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
                { icon: <User size={14} />,    label: 'My Profile', href: '/dispatcher/profile' },
                { icon: <Settings size={14} />, label: 'Settings',   href: '#' },
                { icon: <LogOut size={14} />,   label: 'Logout',     href: '/login', danger: true },
              ].map(item => (
                <a key={item.label} href={item.href}
                  className="flex items-center gap-2.25 px-3.5 py-2.5 text-[13px] font-medium no-underline hover:bg-(--bg-surface) transition-colors"
                  style={{ color: item.danger ? 'var(--status-critical)' : 'var(--text-primary)' }}
                >
                  {item.icon} {item.label}
                </a>
              ))}
            </div>
          )}
        </div>
      </div>
    </header>
  )
}

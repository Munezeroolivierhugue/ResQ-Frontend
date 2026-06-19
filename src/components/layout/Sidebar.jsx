import { useLocation, Link } from 'react-router-dom'
import {
  Map, Zap, Bot, Radio, ScrollText, FileCheck, ClipboardList,
  Settings, HelpCircle, LogOut, Siren, X,
} from 'lucide-react'
import SidebarToggle from './SidebarToggle'
import { useSidebarClasses } from '../../hooks/useSidebarClasses'

const NAV_ITEMS = [
  { icon: Map,           label: 'Live Dispatch Map',  href: '/dispatcher' },
  { icon: Zap,           label: 'New Incident',        href: '/dispatcher/new-incident' },
  { icon: Bot,           label: 'AI Dispatch Engine',  href: '/dispatcher/ai-engine' },
  { icon: Radio,         label: 'Active Incident',     href: '/dispatcher/active-incident' },
  { icon: ScrollText,    label: 'Incident History',    href: '/dispatcher/history' },
  { icon: FileCheck,     label: 'Incident Report',     href: '/dispatcher/incident-report' },
  { icon: ClipboardList, label: 'Shift Handover',      href: '/dispatcher/shift-handover' },
]

const BOTTOM_ITEMS = [
  { icon: Settings,   label: 'Settings', href: '/dispatcher/settings' },
  { icon: HelpCircle, label: 'Help',     href: '/dispatcher/help' },
  { icon: LogOut,     label: 'Logout',   href: '/login', danger: true },
]

function NavItem({ item, isActive, onClose }) {
  const Icon = item.icon
  return (
    <div className={`sidebar-item-wrap${isActive ? ' active' : ''}`}>
      {isActive && (
        <>
          <span className="sidebar-cutout sidebar-cutout-top" />
          <span className="sidebar-cutout sidebar-cutout-bottom" />
        </>
      )}
      <Link
        to={item.href}
        className={`sidebar-item${isActive ? ' active' : ''}`}
        title={item.label}
        onClick={onClose}
      >
        <span className="sidebar-icon"><Icon size={18} /></span>
        <span className="sidebar-label">{item.label}</span>
      </Link>
    </div>
  )
}

export default function Sidebar({ mobileOpen, onClose }) {
  const location = useLocation()
  const sidebarClasses = useSidebarClasses(mobileOpen)

  return (
    <aside className={sidebarClasses}>
      <div className="sidebar-header">
        <span className="sidebar-logo-icon"><Siren size={28} /></span>
        <div className="sidebar-brand-text">
          <span className="sidebar-brand-name">RESQ</span>
          <span className="sidebar-brand-sub">VIGILANT SENTINEL</span>
        </div>
        <SidebarToggle />
        <button className="sidebar-close-btn btn-ghost" onClick={onClose} aria-label="Close menu">
          <X size={18} />
        </button>
      </div>

      {/* Nav items */}
      <nav className="sidebar-nav">
        <div className="sidebar-section-label">Operations</div>

        {NAV_ITEMS.map(item => {
          const isActive = location.pathname === item.href ||
            (item.href !== '/dispatcher' && location.pathname.startsWith(item.href))
          return <NavItem key={item.href} item={item} isActive={isActive} onClose={onClose} />
        })}

      </nav>

      {/* Bottom pinned */}
      <div className="sidebar-bottom">
        {BOTTOM_ITEMS.map(item => {
          const Icon = item.icon
          const isLogout = item.href === '/login'
          const isActive = !isLogout && location.pathname.startsWith(item.href)
          return (
            <div key={item.label} className={`sidebar-item-wrap${isActive ? ' active' : ''}`}>
              {isActive && (
                <>
                  <span className="sidebar-cutout sidebar-cutout-top" />
                  <span className="sidebar-cutout sidebar-cutout-bottom" />
                </>
              )}
              <Link
                to={item.href}
                className={`sidebar-item${isActive ? ' active' : ''}`}
                title={item.label}
                onClick={onClose}
                style={{ color: item.danger ? 'var(--status-critical)' : undefined }}
              >
                <span className="sidebar-icon"><Icon size={18} /></span>
                <span className="sidebar-label">{item.label}</span>
              </Link>
            </div>
          )
        })}
      </div>
    </aside>
  )
}

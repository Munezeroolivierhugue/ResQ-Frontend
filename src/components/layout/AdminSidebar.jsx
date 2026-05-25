import { useLocation, Link } from 'react-router-dom'
import {
  UserPlus, Users, User, Settings, HelpCircle, LogOut, Siren, X,
} from 'lucide-react'
import SidebarToggle from './SidebarToggle'
import { useSidebarClasses } from '../../hooks/useSidebarClasses'

const NAV_ITEMS = [
  { icon: UserPlus, label: 'Invite users', href: '/admin' },
  { icon: Users, label: 'Provisioned users', href: '/admin/users' },
]

const BOTTOM_ITEMS = [
  { icon: Settings, label: 'Settings', href: '/admin/settings' },
  { icon: HelpCircle, label: 'Help', href: '#' },
  { icon: LogOut, label: 'Logout', href: '/login', danger: true },
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

export default function AdminSidebar({ mobileOpen, onClose }) {
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

      <nav className="sidebar-nav">
        <div className="sidebar-section-label">Administration</div>

        {NAV_ITEMS.map((item) => {
          const isActive =
            location.pathname === item.href ||
            (item.href !== '/admin' && location.pathname.startsWith(item.href))
          return <NavItem key={item.href} item={item} isActive={isActive} onClose={onClose} />
        })}

        <div className="sidebar-section-label" style={{ paddingTop: 14 }}>Account</div>

        <NavItem
          item={{ icon: User, label: 'Admin profile', href: '/admin/profile' }}
          isActive={location.pathname === '/admin/profile'}
          onClose={onClose}
        />
      </nav>

      <div className="sidebar-bottom">
        {BOTTOM_ITEMS.map((item) => {
          const Icon = item.icon
          const isSettings = item.href === '/admin/settings'
          const isActive = isSettings && location.pathname === '/admin/settings'
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

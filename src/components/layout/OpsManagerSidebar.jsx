import { useLocation, Link } from 'react-router-dom'
import {
  LayoutDashboard, Map, AlertTriangle, ArrowLeftRight, Building2, BarChart3,
  Settings, HelpCircle, LogOut, Siren, X, FileCheck,
} from 'lucide-react'
import SidebarToggle from './SidebarToggle'
import { useSidebarClasses } from '../../hooks/useSidebarClasses'
const COMMAND = [
  { icon: LayoutDashboard, label: 'Command Overview', href: '/ops-manager/dashboard' },
  { icon: Map, label: 'Live Operational Map', href: '/ops-manager/map' },
  { icon: AlertTriangle, label: 'Escalation Command', href: '/ops-manager/escalations' },
]

const RESOURCES = [
  { icon: ArrowLeftRight, label: 'Resource Reallocation', href: '/ops-manager/resources' },
  { icon: Building2, label: 'Multi-Agency Control', href: '/ops-manager/multi-agency' },
]

const OVERSIGHT = [
  { icon: FileCheck, label: 'Closed Incidents', href: '/ops-manager/closed-incidents' },
  { icon: BarChart3, label: 'Shift Performance', href: '/ops-manager/shift' },
]

const BOTTOM = [
  { icon: Settings, label: 'Settings', href: '/ops-manager/settings' },
  { icon: HelpCircle, label: 'Help', href: '/ops-manager/help' },
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

function NavSection({ label, items, location, onClose }) {
  return (
    <>
      <div className="sidebar-section-label">{label}</div>
      {items.map((item) => {
        const isActive = location.pathname === item.href
          || (item.href !== '/ops-manager/dashboard' && location.pathname.startsWith(item.href))
        return <NavItem key={item.href} item={item} isActive={isActive} onClose={onClose} />
      })}
    </>
  )
}

export default function OpsManagerSidebar({ mobileOpen, onClose }) {
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
        <NavSection label="Command" items={COMMAND} location={location} onClose={onClose} />
        <NavSection label="Resources" items={RESOURCES} location={location} onClose={onClose} />
        <NavSection label="Oversight" items={OVERSIGHT} location={location} onClose={onClose} />

      </nav>

      <div className="sidebar-bottom">
        {BOTTOM.map((item) => {
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

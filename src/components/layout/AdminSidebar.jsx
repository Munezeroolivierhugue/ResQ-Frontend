import { useLocation, Link } from 'react-router-dom'
import {
  LayoutDashboard,
  Users,
  Plug,
  Cpu,
  ShieldCheck,
  Lock,
  Settings,
  HelpCircle,
  LogOut,
  Siren,
  X,
} from 'lucide-react'
import SidebarToggle from './SidebarToggle'
import { useSidebarClasses } from '../../hooks/useSidebarClasses'
import {
  ADMIN_HEALTH_ALERTS,
  ADMIN_PENDING_INVITES,
  ADMIN_INTEGRATION_DOWN,
  ADMIN_SECURITY_ALERTS,
} from '../../data/mockAdminData'

const SYSTEM = [
  { icon: LayoutDashboard, label: 'Dashboard', href: '/admin/dashboard', badge: 'critical', count: ADMIN_HEALTH_ALERTS },
  { icon: Users, label: 'User Management', href: '/admin/users', badge: 'accent', count: ADMIN_PENDING_INVITES },
  {
    icon: Plug,
    label: 'Integrations',
    href: '/admin/integrations',
    badge: 'critical',
    countLabel: ADMIN_INTEGRATION_DOWN ? 'DOWN' : null,
  },
  { icon: Cpu, label: 'AI Configuration', href: '/admin/ai-config' },
]

const SECURITY = [
  { icon: ShieldCheck, label: 'Audit Trail', href: '/admin/audit' },
  { icon: Lock, label: 'Security', href: '/admin/security', badge: 'critical', count: ADMIN_SECURITY_ALERTS },
  { icon: Settings, label: 'System Settings', href: '/admin/settings/general' },
]

const ACCOUNT = [
  { icon: Settings, label: 'Settings', href: '/admin/settings/profile' },
  { icon: HelpCircle, label: 'Help', href: '/admin/help' },
  { icon: LogOut, label: 'Logout', href: '/login', danger: true },
]

function NavItem({ item, isActive, onClose }) {
  const Icon = item.icon
  const badgeStyle =
    item.badge === 'accent'
      ? { background: 'var(--accent-ghost)', color: 'var(--accent)' }
      : { background: 'var(--status-critical-bg)', color: 'var(--status-critical)' }
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
        style={{ color: item.danger ? 'var(--status-critical)' : undefined }}
      >
        <span className="sidebar-icon"><Icon size={18} /></span>
        <span className="sidebar-label">{item.label}</span>
        {item.count > 0 && (
          <span className="ml-auto text-[10px] font-bold px-1.5 py-0.5 rounded-full" style={badgeStyle}>
            {item.count}
          </span>
        )}
        {item.countLabel && (
          <span className="ml-auto text-[9px] font-bold px-1.5 py-0.5 rounded-full tracking-wide" style={badgeStyle}>
            {item.countLabel}
          </span>
        )}
      </Link>
    </div>
  )
}

function NavSection({ label, items, location, onClose }) {
  return (
    <>
      <div className="sidebar-section-label">{label}</div>
      {items.map((item) => {
        const isActive =
          location.pathname === item.href ||
          (item.href !== '/admin/dashboard' && location.pathname.startsWith(item.href))
        return <NavItem key={item.href} item={item} isActive={isActive} onClose={onClose} />
      })}
    </>
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
        <NavSection label="System" items={SYSTEM} location={location} onClose={onClose} />
        <NavSection label="Security" items={SECURITY} location={location} onClose={onClose} />
      </nav>
      <div className="sidebar-bottom">
        <div className="sidebar-section-label">Account</div>
        {ACCOUNT.map((item) => {
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

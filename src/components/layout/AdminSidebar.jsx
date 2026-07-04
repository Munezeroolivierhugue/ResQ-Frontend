import { useEffect, useState } from 'react'
import { useLocation, Link, useNavigate } from 'react-router-dom'
import {
  LayoutDashboard,
  Users,
  Plug,
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
import { logout, getRefreshToken } from '../../utils/authSession'
import { logoutApi } from '../../api/auth'
import { disconnect } from '../../lib/wsClient'
import { listUsers } from '../../api/users'
import { listSecurityEvents } from '../../api/admin'

const USER_SETTINGS_PATHS = [
  '/admin/settings/profile',
  '/admin/settings/appearance',
  '/admin/settings/notifications',
  '/admin/settings/language',
  '/admin/settings/security',
]
const SYSTEM_SETTINGS_PATHS = [
  '/admin/settings/general',
  '/admin/settings/retention',
  '/admin/settings/backup',
  '/admin/settings/announcements',
]

function isSettingsActive(item, pathname) {
  if (item.href === '/admin/settings/profile') return USER_SETTINGS_PATHS.includes(pathname)
  if (item.href === '/admin/settings/general') return SYSTEM_SETTINGS_PATHS.includes(pathname)
  return pathname === item.href || (item.href !== '/admin/dashboard' && pathname.startsWith(item.href))
}

const SYSTEM = [
  { icon: LayoutDashboard, label: 'Dashboard',      href: '/admin/dashboard' },
  { icon: Users,           label: 'User Management', href: '/admin/users',       badge: 'accent',   countKey: 'pendingInvites' },
  { icon: Plug,            label: 'Integrations',    href: '/admin/integrations' },
]

const SECURITY = [
  { icon: ShieldCheck, label: 'Audit Trail',     href: '/admin/audit' },
  { icon: Lock,        label: 'Security',        href: '/admin/security', badge: 'critical', countKey: 'securityAlerts' },
  { icon: Settings,    label: 'System Settings', href: '/admin/settings/general' },
]

const ACCOUNT = [
  { icon: Settings,   label: 'My Account', href: '/admin/settings/profile' },
  { icon: HelpCircle, label: 'Help',     href: '/admin/help' },
]

function NavItem({ item, isActive, onClose, count }) {
  const Icon = item.icon
  const badgeStyle =
    item.badge === 'accent'
      ? { background: 'var(--accent)', color: '#ffffff' }
      : { background: 'var(--status-critical)', color: '#ffffff' }
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
        {count > 0 && item.badge && (
          <span className="ml-auto text-[10px] font-bold px-1.5 py-0.5 rounded-full" style={badgeStyle}>
            {count}
          </span>
        )}
      </Link>
    </div>
  )
}

function NavSection({ label, items, location, onClose, counts }) {
  return (
    <>
      <div className="sidebar-section-label">{label}</div>
      {items.map((item) => {
        const isActive = isSettingsActive(item, location.pathname)
        const count = item.countKey ? (counts[item.countKey] ?? 0) : 0
        return <NavItem key={item.href} item={item} isActive={isActive} onClose={onClose} count={count} />
      })}
    </>
  )
}

export default function AdminSidebar({ mobileOpen, onClose }) {
  const location = useLocation()
  const navigate = useNavigate()
  const sidebarClasses = useSidebarClasses(mobileOpen)
  const [counts, setCounts] = useState({ pendingInvites: 0, securityAlerts: 0 })

  useEffect(() => {
    listUsers()
      .then((users) => setCounts((c) => ({
        ...c,
        pendingInvites: users.filter((u) => u.status === 'PENDING' || u.status === 'INVITED').length,
      })))
      .catch(() => {})
    listSecurityEvents()
      .then((events) => setCounts((c) => ({
        ...c,
        securityAlerts: events.filter((e) => e.status !== 'resolved').length,
      })))
      .catch(() => {})
  }, [])

  const handleLogout = () => {
    const refreshToken = getRefreshToken()
    logout()
    disconnect()
    navigate('/login', { replace: true })
    if (refreshToken) logoutApi(refreshToken).catch(() => {})
  }

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
        <NavSection label="System"   items={SYSTEM}   location={location} onClose={onClose} counts={counts} />
        <NavSection label="Security" items={SECURITY} location={location} onClose={onClose} counts={counts} />
      </nav>
      <div className="sidebar-bottom">
        <div className="sidebar-section-label">Account</div>
        {ACCOUNT.map((item) => {
          const Icon = item.icon
          const isActive = isSettingsActive(item, location.pathname)
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
              >
                <span className="sidebar-icon"><Icon size={18} /></span>
                <span className="sidebar-label">{item.label}</span>
              </Link>
            </div>
          )
        })}
        <div className="sidebar-item-wrap">
          <button
            type="button"
            className="sidebar-item w-full bg-transparent border-none cursor-pointer text-left"
            style={{ color: 'var(--status-critical)' }}
            onClick={handleLogout}
          >
            <span className="sidebar-icon"><LogOut size={18} /></span>
            <span className="sidebar-label">Logout</span>
          </button>
        </div>
      </div>
    </aside>
  )
}

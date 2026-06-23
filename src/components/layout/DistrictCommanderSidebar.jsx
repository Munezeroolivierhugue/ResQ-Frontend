import { useLocation, Link } from 'react-router-dom'
import {
  LayoutDashboard,
  ClipboardList,
  BarChart3,
  Map,
  Package,
  FileBarChart,
  Settings,
  HelpCircle,
  LogOut,
  Siren,
  X,
} from 'lucide-react'
import SidebarToggle from './SidebarToggle'
import { useSidebarClasses } from '../../hooks/useSidebarClasses'
import { getPendingShiftReportCount } from '../../data/mockDistrictCommanderData'

const DISTRICT = [
  { icon: LayoutDashboard, label: 'Dashboard', href: '/district-commander/dashboard' },
  { icon: ClipboardList, label: 'Shift Reports', href: '/district-commander/shift-reports', badge: true },
  { icon: BarChart3, label: 'Unit Performance', href: '/district-commander/units' },
  { icon: Map, label: 'Coverage Analysis', href: '/district-commander/coverage' },
]

const HEADQUARTERS = [
  { icon: Package, label: 'Resource Requests', href: '/district-commander/resources' },
  { icon: FileBarChart, label: 'Executive Report', href: '/district-commander/executive-report' },
]

const BOTTOM = [
  { icon: Settings, label: 'Settings', href: '/district-commander/settings/profile' },
  { icon: HelpCircle, label: 'Help', href: '/district-commander/help' },
  { icon: LogOut, label: 'Logout', href: '/login', danger: true },
]

function NavItem({ item, isActive, onClose, badgeCount }) {
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
        {badgeCount > 0 && (
          <span
            className="ml-auto text-[10px] font-bold px-1.5 py-0.5 rounded-full"
            style={{ background: 'var(--status-medium-bg)', color: 'var(--status-medium)' }}
          >
            {badgeCount}
          </span>
        )}
      </Link>
    </div>
  )
}

function NavSection({ label, items, location, onClose, pendingReports }) {
  return (
    <>
      <div className="sidebar-section-label">{label}</div>
      {items.map((item) => {
        const isActive =
          location.pathname === item.href ||
          (item.href !== '/district-commander/dashboard' && location.pathname.startsWith(item.href))
        const badgeCount = item.badge ? pendingReports : 0
        return (
          <NavItem
            key={item.href}
            item={item}
            isActive={isActive}
            onClose={onClose}
            badgeCount={badgeCount}
          />
        )
      })}
    </>
  )
}

export default function DistrictCommanderSidebar({ mobileOpen, onClose }) {
  const location = useLocation()
  const sidebarClasses = useSidebarClasses(mobileOpen)
  const pendingReports = getPendingShiftReportCount()

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
        <NavSection label="District" items={DISTRICT} location={location} onClose={onClose} pendingReports={pendingReports} />
        <NavSection label="Headquarters" items={HEADQUARTERS} location={location} onClose={onClose} pendingReports={0} />
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

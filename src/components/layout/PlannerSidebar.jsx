import { useLocation, Link } from 'react-router-dom'
import {
  LayoutDashboard,
  Flame,
  Map,
  Send,
  ChartScatter,
  Zap,
  FileBarChart,
  Settings,
  HelpCircle,
  LogOut,
  Siren,
  X,
} from 'lucide-react'
import SidebarToggle from './SidebarToggle'
import { useSidebarClasses } from '../../hooks/useSidebarClasses'
import { PLANNER_HOTSPOT_BADGE, PLANNER_DEPLOYMENT_BADGE } from '../../data/mockPlannerData'

const PLANNING = [
  { icon: LayoutDashboard, label: 'Dashboard', href: '/planner/dashboard' },
  { icon: Flame, label: 'Hotspot Analysis', href: '/planner/hotspots', badge: 'amber', count: PLANNER_HOTSPOT_BADGE },
  { icon: Map, label: 'Coverage Analysis', href: '/planner/coverage' },
  { icon: Send, label: 'Deployment Planning', href: '/planner/deployment', badge: 'accent', count: PLANNER_DEPLOYMENT_BADGE },
  { icon: ChartScatter, label: 'Simulation', href: '/planner/simulation' },
  { icon: Zap, label: 'Response Prediction', href: '/planner/prediction' },
]

const REPORTS = [
  { icon: FileBarChart, label: 'Reports & Insights', href: '/planner/reports' },
]

const ACCOUNT = [
  { icon: Settings, label: 'Settings', href: '/planner/settings/profile' },
  { icon: HelpCircle, label: 'Help', href: '#' },
  { icon: LogOut, label: 'Logout', href: '/login', danger: true },
]

function NavItem({ item, isActive, onClose }) {
  const Icon = item.icon
  const badgeStyle =
    item.badge === 'accent'
      ? { background: 'var(--accent-ghost)', color: 'var(--accent)' }
      : { background: 'var(--status-medium-bg)', color: 'var(--status-medium)' }
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
          (item.href !== '/planner/dashboard' && location.pathname.startsWith(item.href))
        return <NavItem key={item.href} item={item} isActive={isActive} onClose={onClose} />
      })}
    </>
  )
}

export default function PlannerSidebar({ mobileOpen, onClose }) {
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
        <NavSection label="Planning" items={PLANNING} location={location} onClose={onClose} />
        <NavSection label="Reports" items={REPORTS} location={location} onClose={onClose} />
      </nav>
      <div className="sidebar-bottom">
        <NavSection label="Account" items={ACCOUNT} location={location} onClose={onClose} />
      </div>
    </aside>
  )
}

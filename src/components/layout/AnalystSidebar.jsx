import { useLocation, Link } from 'react-router-dom'
import {
  LayoutDashboard,
  FileBarChart,
  ChartScatter,
  Cpu,
  Database,
  BarChart3,
  Library,
  Settings,
  HelpCircle,
  LogOut,
  Siren,
  X,
} from 'lucide-react'
import SidebarToggle from './SidebarToggle'
import { useSidebarClasses } from '../../hooks/useSidebarClasses'
import { ANALYST_ALERT_BADGE, ANALYST_MODEL_ATTENTION } from '../../data/mockAnalystData'

const INTELLIGENCE = [
  { icon: LayoutDashboard, label: 'Dashboard', href: '/analyst/dashboard', badge: 'critical', count: ANALYST_ALERT_BADGE },
  { icon: FileBarChart, label: 'Report Builder', href: '/analyst/reports' },
  { icon: ChartScatter, label: 'Pattern Analysis', href: '/analyst/patterns' },
  {
    icon: Cpu,
    label: 'AI Model Monitor',
    href: '/analyst/models',
    badge: 'critical',
    countLabel: ANALYST_MODEL_ATTENTION ? 'ATTENTION' : null,
  },
]

const DATA = [
  { icon: Database, label: 'Data Quality', href: '/analyst/data-quality' },
  { icon: BarChart3, label: 'Benchmarking', href: '/analyst/benchmarking' },
  { icon: Library, label: 'Report Library', href: '/analyst/library' },
]

const ACCOUNT = [
  { icon: Settings, label: 'Settings', href: '/analyst/settings/profile' },
  { icon: HelpCircle, label: 'Help', href: '#' },
  { icon: LogOut, label: 'Logout', href: '/login', danger: true },
]

function NavItem({ item, isActive, onClose }) {
  const Icon = item.icon
  const badgeStyle =
    item.badge === 'accent'
      ? { background: 'var(--accent-ghost)', color: 'var(--accent)' }
      : item.badge === 'critical'
        ? { background: 'var(--status-critical-bg)', color: 'var(--status-critical)' }
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
          (item.href !== '/analyst/dashboard' && location.pathname.startsWith(item.href))
        return <NavItem key={item.href} item={item} isActive={isActive} onClose={onClose} />
      })}
    </>
  )
}

export default function AnalystSidebar({ mobileOpen, onClose }) {
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
        <NavSection label="Intelligence" items={INTELLIGENCE} location={location} onClose={onClose} />
        <NavSection label="Data" items={DATA} location={location} onClose={onClose} />
      </nav>
      <div className="sidebar-bottom">
        <NavSection label="Account" items={ACCOUNT} location={location} onClose={onClose} />
      </div>
    </aside>
  )
}

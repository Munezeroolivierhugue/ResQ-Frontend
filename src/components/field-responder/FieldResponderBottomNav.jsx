import { NavLink } from 'react-router-dom'
import { Home, MapPin, BarChart3, User } from 'lucide-react'
import { useFieldResponderStore } from '../../store/fieldResponderStore'

const NAV = [
  { to: '/field-responder/shift-start', label: 'Status', icon: Home },
  { to: '/field-responder/assignment', label: 'Assignment', icon: MapPin, badge: true },
  { to: '/field-responder/performance', label: 'My Stats', icon: BarChart3 },
  { to: '/field-responder/profile', label: 'Profile', icon: User },
]

export default function FieldResponderBottomNav() {
  const hasActiveAssignment = useFieldResponderStore((s) => s.hasActiveAssignment)

  return (
    <nav className="fr-bottom-nav field-responder-bottom-nav" aria-label="Field responder navigation">
      {NAV.map(({ to, label, icon: Icon, badge }) => (
        <NavLink
          key={to}
          to={to}
          className={({ isActive }) => `fr-nav-item${isActive ? ' fr-nav-item--active' : ''}`}
        >
          <span className="fr-nav-icon-wrap">
            <Icon size={22} strokeWidth={2} />
            {badge && hasActiveAssignment && <span className="fr-nav-dot" aria-label="Active assignment" />}
          </span>
          <span>{label}</span>
        </NavLink>
      ))}
    </nav>
  )
}

import { Link } from 'react-router-dom'
import {
  UserCircle,
  Palette,
  Bell,
  MapPin,
  Languages,
  ShieldCheck,
  Moon,
  BarChart3,
  LogOut,
  ChevronRight,
  HelpCircle
} from 'lucide-react'
import { FR_SETTINGS_NAV } from '../../components/settings/FieldResponderSettingsView'
import { FR_OFFICER } from '../../data/mockFieldResponderData'
import { useFieldResponderStore } from '../../store/fieldResponderStore'

export default function FRProfile() {
  const dutyStatus = useFieldResponderStore((s) => s.dutyStatus)
  const gpsActive = useFieldResponderStore((s) => s.gpsActive)

  const statusLabel =
    dutyStatus === 'offline'
      ? 'Off Duty'
      : dutyStatus === 'on_scene'
        ? 'On Scene'
        : 'Available'

  return (
    <div className="fr-page fr-page--fill">
      <div className="fr-page-fill-body">
        <div className="dispatcher-surface fr-card">
          <div className="fr-identity-row">
            <span className="fr-avatar">{FR_OFFICER.initials}</span>
            <div className="fr-identity-info">
              <div className="fr-identity-name">{FR_OFFICER.name}</div>
              <div className="fr-identity-meta font-mono">
                {FR_OFFICER.badge} · {FR_OFFICER.unit}
              </div>
              <div className="fr-identity-shift">{FR_OFFICER.shift}</div>
            </div>
          </div>
          <div className="fr-divider" />
          <div className="fr-profile-stats">
            <div>
              <div className="fr-perf-label">Status</div>
              <div className="font-semibold text-[14px]">{statusLabel}</div>
            </div>
            <div>
              <div className="fr-perf-label">GPS</div>
              <div className="font-semibold text-[14px]">{gpsActive ? 'Active' : 'Off'}</div>
            </div>
          </div>
        </div>

        <div className="fr-profile-section-label">Settings</div>
        <div className="fr-profile-links">
          {FR_SETTINGS_NAV.map(({ id, label, icon: Icon }) => (
            <Link key={id} to={`/field-responder/settings/${id}`} className="fr-profile-link dispatcher-surface">
              <Icon size={18} className="text-(--accent)" />
              <span className="flex-1">{label}</span>
              <ChevronRight size={16} className="text-(--text-muted)" />
            </Link>
          ))}
          <Link to="/field-responder/help" className="fr-profile-link dispatcher-surface">
            <HelpCircle size={18} className="text-(--accent)" />
            <span className="flex-1">Help Center</span>
            <ChevronRight size={16} className="text-(--text-muted)" />
          </Link>
        </div>

        <div className="fr-profile-section-label">Quick Actions</div>
        <div className="fr-profile-links">
          <Link to="/field-responder/performance" className="fr-profile-link dispatcher-surface">
            <BarChart3 size={18} className="text-(--accent)" />
            <span className="flex-1">My Stats</span>
            <ChevronRight size={16} className="text-(--text-muted)" />
          </Link>
          <Link to="/field-responder/shift-end" className="fr-profile-link dispatcher-surface">
            <Moon size={18} className="text-(--accent)" />
            <span className="flex-1">End Shift</span>
            <ChevronRight size={16} className="text-(--text-muted)" />
          </Link>
        </div>
      </div>

      <div className="fr-page-fill-footer">
        <Link to="/login" className="fr-logout-link">
          <LogOut size={16} />
          Log out
        </Link>
      </div>
    </div>
  )
}

import { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { logout, getRefreshToken, getCurrentUser, canFileFieldReports } from '../../utils/authSession'
import { logoutApi } from '../../api/auth'
import { disconnect } from '../../lib/wsClient'
import {
  BarChart3,
  LogOut,
  ChevronRight,
  HelpCircle,
  Moon,
} from 'lucide-react'
import { FR_SETTINGS_NAV } from '../../components/settings/FieldResponderSettingsView'
import { useFieldResponderStore } from '../../store/fieldResponderStore'
import { getMyProfile } from '../../api/users'

function initials(name) {
  return (name || '').split(' ').map(n => n[0]).filter(Boolean).join('').slice(0, 2).toUpperCase() || '?'
}

const SHIFT_LABELS = {
  MORNING: '07:00 – 15:00',
  EVENING: '15:00 – 23:00',
  NIGHT: '23:00 – 07:00',
  ROTATING: 'Rotating',
}

export default function FRProfile() {
  const navigate = useNavigate()
  const [profile, setProfile] = useState(null)

  useEffect(() => {
    getMyProfile().then(setProfile).catch(() => {
      // fall back to session data
      const u = getCurrentUser()
      if (u) setProfile({ full_name: u.full_name, email: u.email })
    })
  }, [])

  const handleLogout = () => {
    const refreshToken = getRefreshToken()
    logout()
    disconnect()
    navigate('/login', { replace: true })
    if (refreshToken) logoutApi(refreshToken).catch(() => {})
  }
  const dutyStatus = useFieldResponderStore((s) => s.dutyStatus)
  const gpsActive = useFieldResponderStore((s) => s.gpsActive)

  const statusLabel =
    dutyStatus === 'offline'
      ? 'Off Duty'
      : dutyStatus === 'on_scene'
        ? 'On Scene'
        : 'Available'

  const displayName = profile?.full_name || '…'
  const displayUnit = profile?.current_vehicle_plate
    ? `${profile.current_vehicle_plate} · ${(profile.current_vehicle_type || '').replace(/_/g, ' ')}`
    : profile?.email || '—'
  const displayShift = profile?.shift_type
    ? `${SHIFT_LABELS[profile.shift_type] ?? profile.shift_type} · Today`
    : '—'

  return (
    <div className="fr-page fr-page--fill">
      <div className="fr-page-fill-body">
        <div className="dispatcher-surface fr-card">
          <div className="fr-identity-row">
            <span className="fr-avatar">{initials(displayName)}</span>
            <div className="fr-identity-info">
              <div className="fr-identity-name">{displayName}</div>
              <div className="fr-identity-meta font-mono">{displayUnit}</div>
              <div className="fr-identity-shift">{displayShift}</div>
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
          {canFileFieldReports() && (
            <Link to="/field-responder/performance" className="fr-profile-link dispatcher-surface">
              <BarChart3 size={18} className="text-(--accent)" />
              <span className="flex-1">My Stats</span>
              <ChevronRight size={16} className="text-(--text-muted)" />
            </Link>
          )}
          <Link to="/field-responder/shift-end" className="fr-profile-link dispatcher-surface">
            <Moon size={18} className="text-(--accent)" />
            <span className="flex-1">End Shift</span>
            <ChevronRight size={16} className="text-(--text-muted)" />
          </Link>
        </div>
      </div>

      <div className="fr-page-fill-footer">
        <button type="button" onClick={handleLogout} className="fr-logout-link">
          <LogOut size={16} />
          Log out
        </button>
      </div>
    </div>
  )
}

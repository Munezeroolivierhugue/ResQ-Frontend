import { MapPin, ClipboardList, Play, Check } from 'lucide-react'
import { FR_OFFICER, FR_BRIEFING } from '../../data/mockFieldResponderData'
import { useFieldResponderStore } from '../../store/fieldResponderStore'

export default function FRShiftStart() {
  const gpsActive = useFieldResponderStore((s) => s.gpsActive)
  const dutyStatus = useFieldResponderStore((s) => s.dutyStatus)
  const goAvailable = useFieldResponderStore((s) => s.goAvailable)
  const setGpsActive = useFieldResponderStore((s) => s.setGpsActive)

  const isOffline = dutyStatus === 'offline'
  const isAvailable = dutyStatus === 'available'
  const isOnScene = dutyStatus === 'on_scene'

  return (
    <div className="fr-page">
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
        <div className="fr-gps-row">
          <div className="flex items-center gap-2">
            <MapPin size={14} className="text-(--text-secondary)" />
            <span className="text-[13px]">Location sharing</span>
          </div>
          <button
            type="button"
            className={`fr-pill${gpsActive ? ' fr-pill--ok' : ' fr-pill--danger'}`}
            onClick={() => setGpsActive(!gpsActive)}
          >
            {gpsActive ? '● GPS ACTIVE' : '● GPS OFF'}
          </button>
        </div>
        {!gpsActive && (
          <div className="fr-gps-warning">
            <span className="text-(--status-critical)">⚠</span>
            Enable location services. Without GPS the dispatcher cannot see you on the map.
          </div>
        )}
      </div>

      <div className="dispatcher-surface fr-card">
        <div className="fr-card-header">
          <ClipboardList size={16} className="text-(--accent)" />
          <span className="font-semibold text-[13px]">Shift Briefing</span>
          <span className="text-[11px] text-(--text-muted) ml-auto">From Operations Manager</span>
        </div>
        <div className="fr-divider" />
        <p className="fr-briefing-text">{FR_BRIEFING.text}</p>
        <div className="fr-briefing-meta font-mono">
          {FR_BRIEFING.time} · {FR_BRIEFING.author}
        </div>
      </div>

      <button
        type="button"
        className={`fr-availability-btn${isOffline ? ' fr-availability-btn--go' : ''}${isAvailable ? ' fr-availability-btn--on' : ''}${isOnScene ? ' fr-availability-btn--scene' : ''}`}
        onClick={isOffline ? goAvailable : undefined}
        disabled={!isOffline}
      >
        {isOffline && (
          <>
            <Play size={24} />
            <div>
              <div>GO AVAILABLE</div>
              <div className="fr-availability-sub">Tap to begin shift · You will appear on dispatcher map</div>
            </div>
          </>
        )}
        {isAvailable && (
          <>
            <Check size={24} />
            <div>
              <div>● ON DUTY — AVAILABLE</div>
              <div className="fr-availability-sub">Visible to dispatcher · GPS tracking active</div>
            </div>
          </>
        )}
        {isOnScene && (
          <div>● ON SCENE — INC-2403</div>
        )}
      </button>

      {(isAvailable || isOnScene) && (
        <div className="fr-stat-tiles">
          <div className="fr-stat-tile">
            <div className="fr-stat-value">0</div>
            <div className="fr-stat-label">Incidents today</div>
          </div>
          <div className="fr-stat-tile">
            <div className="fr-stat-value">—</div>
            <div className="fr-stat-label">Avg response</div>
          </div>
          <div className="fr-stat-tile">
            <div className="fr-stat-value">{isOnScene ? 'On Scene' : 'Available'}</div>
            <div className="fr-stat-label">Current status</div>
          </div>
        </div>
      )}
    </div>
  )
}

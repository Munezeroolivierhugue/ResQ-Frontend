import { useEffect, useState } from 'react'
import { MapPin, ClipboardList, Play, Check, ChevronDown } from 'lucide-react'
import { FR_BRIEFING } from '../../data/mockFieldResponderData'
import { useFieldResponderStore } from '../../store/fieldResponderStore'
import { listVehicles } from '../../api/vehicles'
import { getCurrentUser } from '../../utils/authSession'

function initials(name) {
  if (!name) return '??'
  return name.split(' ').map(w => w[0]).slice(0, 2).join('').toUpperCase()
}

export default function FRShiftStart() {
  const gpsActive     = useFieldResponderStore((s) => s.gpsActive)
  const dutyStatus    = useFieldResponderStore((s) => s.dutyStatus)
  const vehicleId     = useFieldResponderStore((s) => s.vehicleId)
  const goAvailable   = useFieldResponderStore((s) => s.goAvailable)
  const setGpsActive  = useFieldResponderStore((s) => s.setGpsActive)
  const setVehicleId  = useFieldResponderStore((s) => s.setVehicleId)

  const user = getCurrentUser()
  const displayName = user?.full_name ?? user?.email ?? 'Field Responder'
  const displayInitials = initials(displayName)

  const [vehicles, setVehicles] = useState([])
  const [selectedVehicle, setSelectedVehicle] = useState(vehicleId ?? '')

  useEffect(() => {
    listVehicles().then(setVehicles).catch(() => {})
  }, [])

  const isOffline   = dutyStatus === 'offline'
  const isAvailable = dutyStatus === 'available'
  const isOnScene   = dutyStatus === 'on_scene'

  const handleGoAvailable = () => {
    if (selectedVehicle) setVehicleId(selectedVehicle)
    goAvailable()
  }

  return (
    <div className="fr-page">
      {/* Officer identity card */}
      <div className="dispatcher-surface fr-card">
        <div className="fr-identity-row">
          <span className="fr-avatar">{displayInitials}</span>
          <div className="fr-identity-info">
            <div className="fr-identity-name">{displayName}</div>
            <div className="fr-identity-meta font-mono">
              {user?.role ?? 'FIELD_RESPONDER'} · {user?.email ?? ''}
            </div>
            <div className="fr-identity-shift">
              {isOffline ? 'Off duty' : isAvailable ? 'On duty — Available' : 'On scene'}
            </div>
          </div>
        </div>
        <div className="fr-divider" />

        {/* Vehicle selector */}
        <div className="fr-gps-row">
          <div className="flex items-center gap-2">
            <ChevronDown size={14} className="text-(--text-secondary)" />
            <span className="text-[13px]">Assigned vehicle</span>
          </div>
          {vehicles.length > 0 ? (
            <select
              className="dispatcher-input dispatcher-select h-8 text-[12px] min-w-[140px]"
              value={selectedVehicle}
              onChange={e => { setSelectedVehicle(e.target.value); setVehicleId(e.target.value) }}
              disabled={!isOffline}
            >
              <option value="">Select vehicle…</option>
              {vehicles
                .filter(v => v.status !== 'offline')
                .map(v => (
                  <option key={v.vehicle_id} value={v.vehicle_id}>
                    {v.plate_number} · {v.vehicle_type}
                  </option>
                ))}
            </select>
          ) : (
            <span className="text-[11px] text-(--text-muted)">Loading vehicles…</span>
          )}
        </div>

        <div className="fr-divider" />

        {/* GPS toggle */}
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

      {/* Shift briefing */}
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

      {/* Go Available button */}
      <button
        type="button"
        className={`fr-availability-btn${isOffline ? ' fr-availability-btn--go' : ''}${isAvailable ? ' fr-availability-btn--on' : ''}${isOnScene ? ' fr-availability-btn--scene' : ''}`}
        onClick={isOffline ? handleGoAvailable : undefined}
        disabled={!isOffline || (!selectedVehicle && vehicles.length > 0)}
      >
        {isOffline && (
          <>
            <Play size={24} />
            <div>
              <div>GO AVAILABLE</div>
              <div className="fr-availability-sub">
                {!selectedVehicle && vehicles.length > 0
                  ? 'Select a vehicle first'
                  : 'Tap to begin shift · You will appear on dispatcher map'}
              </div>
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
          <div>● ON SCENE — ACTIVE INCIDENT</div>
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

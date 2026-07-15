import { useEffect, useState } from 'react'
import { MapPin, Play, Check, ChevronDown, Truck, CloudRain } from 'lucide-react'
import { useFieldResponderStore } from '../../store/fieldResponderStore'
import { listVehicles } from '../../api/vehicles'
import { getMyProfile } from '../../api/users'
import { startShift } from '../../api/shifts'
import { listMyReports } from '../../api/fieldReports'
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
  const showToast     = useFieldResponderStore((s) => s.showToast)

  const user = getCurrentUser()
  const displayName = user?.full_name ?? user?.email ?? 'Field Responder'
  const displayInitials = initials(displayName)

  const [assignedVehicle, setAssignedVehicle] = useState(null) // pre-assigned from profile
  const [vehicles, setVehicles] = useState([])
  const [selectedVehicle, setSelectedVehicle] = useState(vehicleId ?? '')
  const [startingShift, setStartingShift] = useState(false)
  const [incidentsToday, setIncidentsToday] = useState(0)

  useEffect(() => {
    // Load pre-assigned vehicle from user profile first
    getMyProfile()
      .then(profile => {
        if (profile.current_vehicle_id) {
          setAssignedVehicle({
            id: profile.current_vehicle_id,
            plate: profile.current_vehicle_plate,
            type: profile.current_vehicle_type,
          })
          setSelectedVehicle(profile.current_vehicle_id)
          setVehicleId(profile.current_vehicle_id)
        } else {
          // No pre-assigned vehicle — fall back to picker
          listVehicles().then(setVehicles).catch(() => {})
        }
      })
      .catch(() => {
        // Profile fetch failed — fall back to picker
        listVehicles().then(setVehicles).catch(() => {})
      })
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  // Real count instead of a hardcoded "0" — the responder's own field reports
  // submitted today are the closest available signal for incidents handled.
  useEffect(() => {
    listMyReports()
      .then((reports) => {
        const today = new Date().toDateString()
        const count = reports.filter((r) => r.submitted_at && new Date(r.submitted_at).toDateString() === today).length
        setIncidentsToday(count)
      })
      .catch(() => {})
  }, [])

  const isOffline   = dutyStatus === 'offline'
  const isAvailable = dutyStatus === 'available'
  const isOnScene   = dutyStatus === 'on_scene'

  const handleGoAvailable = async () => {
    const vehicle = selectedVehicle || assignedVehicle?.id
    setStartingShift(true)
    try {
      // Persist the shift server-side so User.currentVehicle gets set — this is
      // what lets a dispatcher's later createDispatch(vehicleId) resolve back to
      // this responder (see DispatchService.create()). Without this call, going
      // available only ever updated local/client state and the vehicle status,
      // so the responder never actually became reachable for assignment.
      await startShift({
        user_id:      user?.user_id,
        district_id:  user?.district_id,
        vehicle_id:   vehicle || null,
        role_on_shift: user?.role ?? 'FIELD_RESPONDER',
      })
      if (vehicle) setVehicleId(vehicle)
      goAvailable()
    } catch {
      showToast('Could not start shift — check your connection and try again.', 'critical')
    } finally {
      setStartingShift(false)
    }
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

        {/* Vehicle assignment */}
        <div className="fr-gps-row">
          <div className="flex items-center gap-2">
            <Truck size={14} className="text-(--text-secondary)" />
            <span className="text-[13px]">Assigned vehicle</span>
          </div>
          {assignedVehicle ? (
            <span className="fr-pill fr-pill--ok font-mono text-[11px]">
              {assignedVehicle.plate} · {assignedVehicle.type}
            </span>
          ) : vehicles.length > 0 ? (
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
            <span className="text-[11px] text-(--text-muted)">Loading…</span>
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
          <CloudRain size={16} className="text-(--accent)" />
          <span className="font-semibold text-[13px]">Weather Advisory</span>
        </div>
        <div className="fr-divider" />
        <p className="fr-briefing-text">
          If there are any weather changes affecting your route, you will be notified here for rerouting.
        </p>
      </div>

      {/* Go Available button */}
      <button
        type="button"
        className={`fr-availability-btn${isOffline ? ' fr-availability-btn--go' : ''}${isAvailable ? ' fr-availability-btn--on' : ''}${isOnScene ? ' fr-availability-btn--scene' : ''}`}
        onClick={isOffline ? handleGoAvailable : undefined}
        disabled={!isOffline || startingShift || (!selectedVehicle && !assignedVehicle && vehicles.length > 0)}
      >
        {isOffline && (
          <>
            <Play size={24} />
            <div>
              <div>{startingShift ? 'STARTING…' : 'GO AVAILABLE'}</div>
              <div className="fr-availability-sub">
                {startingShift
                  ? 'Starting shift…'
                  : !selectedVehicle && !assignedVehicle && vehicles.length > 0
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
            <div className="fr-stat-value">{incidentsToday}</div>
            <div className="fr-stat-label">Incidents today</div>
          </div>
        </div>
      )}
    </div>
  )
}

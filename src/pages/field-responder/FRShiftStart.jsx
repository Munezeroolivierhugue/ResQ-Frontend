import { useEffect, useState } from 'react'
import { MapPin, Play, Check, ChevronDown, Truck, Megaphone, TrendingUp, AlertTriangle, Coffee, ClipboardList } from 'lucide-react'
import { useFieldResponderStore } from '../../store/fieldResponderStore'
import { useToastStore } from '../../store/toastStore'
import { listVehicles, getVehicle } from '../../api/vehicles'
import { getMyProfile } from '../../api/users'
import { startShift } from '../../api/shifts'
import { getMyStats } from '../../api/fieldResponderStats'
import { listBroadcasts } from '../../api/broadcasts'
import { getCurrentUser } from '../../utils/authSession'

function timeAgo(isoString) {
  const diffMin = Math.floor((Date.now() - new Date(isoString).getTime()) / 60000)
  if (diffMin < 1) return 'Just now'
  if (diffMin < 60) return `${diffMin}m ago`
  return `${Math.floor(diffMin / 60)}h ago`
}

function isUrgent(priority) {
  return priority === 'URGENT' || priority === 'EMERGENCY'
}

function initials(name) {
  if (!name) return '??'
  return name.split(' ').map(w => w[0]).slice(0, 2).join('').toUpperCase()
}

export default function FRShiftStart() {
  const gpsActive     = useFieldResponderStore((s) => s.gpsActive)
  const dutyStatus    = useFieldResponderStore((s) => s.dutyStatus)
  const vehicleId     = useFieldResponderStore((s) => s.vehicleId)
  const goAvailable   = useFieldResponderStore((s) => s.goAvailable)
  const takeBreak     = useFieldResponderStore((s) => s.takeBreak)
  const endBreak      = useFieldResponderStore((s) => s.endBreak)
  const endShift      = useFieldResponderStore((s) => s.endShift)
  const setGpsActive  = useFieldResponderStore((s) => s.setGpsActive)
  const setVehicleId  = useFieldResponderStore((s) => s.setVehicleId)
  const pushToast     = useToastStore((s) => s.pushToast)

  const user = getCurrentUser()
  const displayName = user?.full_name ?? user?.email ?? 'Field Responder'
  const displayInitials = initials(displayName)

  const [assignedVehicle, setAssignedVehicle] = useState(null) // pre-assigned from profile
  const [vehicles, setVehicles] = useState([])
  const [selectedVehicle, setSelectedVehicle] = useState(vehicleId ?? '')
  const [startingShift, setStartingShift] = useState(false)
  const [incidentsToday, setIncidentsToday] = useState(0)
  const [advisories, setAdvisories] = useState([])

  useEffect(() => {
    listBroadcasts()
      .then((all) => setAdvisories(
        all.filter((b) => b.target_area === user?.district_name || b.target_area === 'ALL_UNITS').slice(0, 3)
      ))
      .catch(() => {})
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => {
    // Load the standing Admin/DC-assigned vehicle from the profile — this
    // persists across shifts (unlike current_vehicle_id, which is only set
    // while a shift is actively running and gets cleared on shift end/
    // auto-off-shift enforcement). Reading current_vehicle_id here used to
    // mean a responder's permanent unit "disappeared" back into a
    // self-service picker every time their shift ended, even though nothing
    // about their actual assignment had changed.
    getMyProfile()
      .then(profile => {
        if (profile.assigned_vehicle_id) {
          setAssignedVehicle({
            id: profile.assigned_vehicle_id,
            plate: profile.assigned_vehicle_plate,
            type: profile.assigned_vehicle_type,
          })
          setSelectedVehicle(profile.assigned_vehicle_id)
          setVehicleId(profile.assigned_vehicle_id)
        } else {
          // No standing assignment — fall back to picker
          listVehicles().then(setVehicles).catch(() => {})
        }
      })
      .catch(() => {
        // Profile fetch failed — fall back to picker
        listVehicles().then(setVehicles).catch(() => {})
      })
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  // Counts dispatches received today, not field reports filed — reports are
  // only ever filed by RNP/police units (canFileFieldReports()), so a
  // report-based count silently showed 0 for every non-police responder
  // even on days they'd actually been dispatched and handled incidents.
  // Dispatch count is the correct, agency-agnostic signal, and is the same
  // source the My Stats page already uses for this exact number.
  useEffect(() => {
    getMyStats()
      .then((stats) => setIncidentsToday(stats.incidents_today))
      .catch(() => {})
  }, [])

  const isOffline   = dutyStatus === 'offline'
  const isAvailable = dutyStatus === 'available'
  const isOnScene   = dutyStatus === 'on_scene'
  const isOnBreak   = dutyStatus === 'break'

  // Admin/DC-assigned fixed shifts (Morning/Evening/Night) auto-end
  // server-side once the window elapses (backend ShiftService.
  // enforceShiftWindows) — the vehicle's status flips to OFF_SHIFT. Without
  // this check the local UI would keep claiming "ON DUTY — AVAILABLE" long
  // after the responder actually stopped being eligible for new calls.
  useEffect(() => {
    if (!isAvailable || !vehicleId) return
    const t = setInterval(() => {
      getVehicle(vehicleId).then((v) => {
        if (v.status === 'off_shift' && useFieldResponderStore.getState().dutyStatus === 'available') {
          endShift()
          pushToast({ variant: 'info', title: 'Shift Ended', message: 'Your assigned shift window has ended — you are now off duty.' })
        }
      }).catch(() => {})
    }, 30000)
    return () => clearInterval(t)
  }, [isAvailable, vehicleId, endShift, pushToast])

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
      pushToast({ variant: 'error', title: 'Shift Start Failed', message: 'Could not start shift — check your connection and try again.' })
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
              {isOffline ? 'Off duty' : isOnBreak ? 'On break' : isAvailable ? 'On duty — Available' : 'On scene'}
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

        <div className="fr-divider" />

        {/* Incidents today */}
        <div className="fr-gps-row">
          <div className="flex items-center gap-2">
            <ClipboardList size={14} className="text-(--text-secondary)" />
            <span className="text-[13px]">Incidents today</span>
          </div>
          <span className="fr-pill fr-pill--ok fr-pill--wide font-mono text-[11px]">
            {incidentsToday}
          </span>
        </div>
      </div>

      {/* Advisories — real broadcasts from the Ops Manager, scoped to this
          responder's own district. Previously a static "Weather Advisory"
          card promised rerouting alerts that nothing ever fed — no weather
          integration existed anywhere in the app. */}
      {advisories.length === 0 ? (
        <div className="dispatcher-surface fr-card">
          <div className="fr-card-header">
            <Megaphone size={16} className="text-(--accent)" />
            <span className="font-semibold text-[13px]">Advisories</span>
          </div>
          <div className="fr-divider" />
          <p className="fr-briefing-text">No advisories from your Ops Manager right now.</p>
        </div>
      ) : (
        advisories.map((b) => {
          const urgent = isUrgent(b.priority)
          return (
            <div key={b.broadcast_id} className={`fr-advisory-card${urgent ? ' fr-advisory-card--urgent' : ' fr-advisory-card--normal'}`}>
              <span className="fr-advisory-icon">
                {urgent ? <AlertTriangle size={16} /> : <TrendingUp size={16} />}
              </span>
              <div className="fr-advisory-body">
                <div className="fr-advisory-title">{urgent ? 'Urgent advisory' : 'Ops advisory'}</div>
                <div className="fr-advisory-text">{(b.message ?? '').replace(/^INC-\d+:\s*/, '')}</div>
                <div className="fr-advisory-meta">{timeAgo(b.sent_at)}</div>
              </div>
            </div>
          )
        })
      )}

      {/* Go Available button */}
      <button
        type="button"
        className={`fr-availability-btn${isOffline ? ' fr-availability-btn--go' : ''}${isAvailable ? ' fr-availability-btn--on' : ''}${isOnBreak ? ' fr-availability-btn--on' : ''}${isOnScene ? ' fr-availability-btn--scene' : ''}`}
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
        {isOnBreak && (
          <>
            <Coffee size={24} />
            <div>
              <div>● ON BREAK</div>
              <div className="fr-availability-sub">Not eligible for new calls · GPS tracking active</div>
            </div>
          </>
        )}
        {isOnScene && (
          <div>● ON SCENE — ACTIVE INCIDENT</div>
        )}
      </button>

      {(isAvailable || isOnBreak) && (
        <button
          type="button"
          className="dispatcher-btn-outline w-full"
          style={{ margin: '0 1rem', width: 'calc(100% - 2rem)' }}
          onClick={isOnBreak ? endBreak : takeBreak}
        >
          {isOnBreak ? 'Resume Duty' : 'Take a Break'}
        </button>
      )}
    </div>
  )
}

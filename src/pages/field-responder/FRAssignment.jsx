import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Phone, Flag, Check, Loader } from 'lucide-react'
import SeverityBanner from '../../components/field-responder/SeverityBanner'
import FieldResponderProgressStrip from '../../components/field-responder/FieldResponderProgressStrip'
import FlagIssueModal from '../../components/field-responder/FlagIssueModal'
import { etaColor } from '../../data/mockFieldResponderData'
import { useFieldResponderStore } from '../../store/fieldResponderStore'

function vehicleTypeName(type) {
  const t = (type ?? '').toUpperCase()
  if (t.includes('AMBULANCE')) return 'Ambulance'
  if (t.includes('FIRE') || t.includes('DISASTER')) return 'Fire / Rescue'
  if (t.includes('POLICE')) return 'Police'
  if (t.includes('TACTICAL')) return 'Tactical'
  return 'Unit'
}

export default function FRAssignment() {
  const navigate = useNavigate()
  const assignment      = useFieldResponderStore((s) => s.assignment)
  const pollForAssignment = useFieldResponderStore((s) => s.pollForAssignment)
  const acceptAssignment  = useFieldResponderStore((s) => s.acceptAssignment)
  const vehicleId       = useFieldResponderStore((s) => s.vehicleId)
  const [flagOpen, setFlagOpen] = useState(false)
  const [polling, setPolling]   = useState(false)

  useEffect(() => {
    if (assignment) return
    let alive = true
    const run = async () => {
      setPolling(true)
      await pollForAssignment()
      if (alive) setPolling(false)
    }
    run()
    // Re-poll every 15 seconds until assignment is found
    const t = setInterval(() => { if (!useFieldResponderStore.getState().assignment) run() }, 15000)
    return () => { alive = false; clearInterval(t) }
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  const handleAccept = () => {
    acceptAssignment()
    navigate('/field-responder/navigation')
  }

  if (!vehicleId) {
    return (
      <div className="fr-page">
        <FieldResponderProgressStrip />
        <div className="dispatcher-surface fr-card flex flex-col items-center py-12 gap-4">
          <div className="text-[13px] font-semibold text-(--text-primary)">No vehicle selected</div>
          <div className="text-[11px] text-(--text-muted) text-center">
            You must select your vehicle and go available before receiving assignments.
          </div>
          <button
            type="button"
            className="dispatcher-btn-primary"
            onClick={() => navigate('/field-responder/shift-start')}
          >
            Go to Shift Start
          </button>
        </div>
      </div>
    )
  }

  if (!assignment) {
    return (
      <div className="fr-page">
        <FieldResponderProgressStrip />
        <div className="dispatcher-surface fr-card flex flex-col items-center py-12 gap-4">
          {polling ? (
            <>
              <Loader size={28} className="animate-spin" style={{ color: 'var(--accent)' }} />
              <div className="text-[13px] font-semibold text-(--text-primary)">Checking for incoming assignment…</div>
              <div className="text-[11px] text-(--text-muted)">You will see your dispatch here once the dispatcher assigns you.</div>
            </>
          ) : (
            <>
              <div className="text-[13px] font-semibold text-(--text-primary)">No active assignment</div>
              <div className="text-[11px] text-(--text-muted)">Waiting for dispatcher to assign an incident to your vehicle.</div>
            </>
          )}
        </div>
      </div>
    )
  }

  const { incident, dispatch, otherDispatches } = assignment
  const eta = dispatch.eta_minutes ?? null
  const location = incident.district ?? incident.address ?? 'Unknown location'
  const landmark = incident.sector ?? ''

  return (
    <div className="fr-page fr-page--assignment">
      <SeverityBanner
        severity={incident.severity ?? 'medium'}
        label="INCOMING ASSIGNMENT"
        title={incident.incident_type}
        location={location}
        landmark={landmark}
        incidentId={incident.incident_ref ?? incident.incident_id?.slice(0, 8).toUpperCase()}
      />

      <FieldResponderProgressStrip />

      <div className="dispatcher-surface fr-card fr-card--tight">
        <div className="fr-card-header">
          <Phone size={14} className="text-(--accent)" />
          <span className="font-semibold text-[13px]">Incident Details</span>
          {dispatch.ai_recommended && <span className="fr-ai-badge">AI dispatched</span>}
        </div>
        <div className="fr-divider" />
        {[
          ['Incident ref',      incident.incident_ref ?? '—'],
          ['Type',              incident.incident_type],
          ['Severity',          (incident.severity ?? 'medium').toUpperCase()],
          ['District / Sector', `${incident.district ?? '—'}${incident.sector ? ' / ' + incident.sector : ''}`],
          ['Call time',         incident.call_time ? new Date(incident.call_time).toLocaleString() : '—'],
          ['Dispatched by',     dispatch.dispatched_by_name ?? 'Dispatcher'],
        ].map(([label, val]) => (
          <div key={label} className="fr-info-row">
            <span className="text-(--text-secondary)">{label}</span>
            <span>{val}</span>
          </div>
        ))}
      </div>

      <div className="fr-key-numbers">
        {[
          { val: eta != null ? String(eta) : '—', unit: 'min ETA', color: eta != null ? etaColor(eta) : 'var(--text-muted)' },
          { val: dispatch.confidence != null ? `${Math.round(dispatch.confidence * 100)}%` : '—', unit: 'AI confidence', color: 'var(--text-primary)' },
          { val: 'P1', unit: 'priority', color: 'var(--status-critical)' },
        ].map((tile) => (
          <div key={tile.unit} className="dispatcher-surface fr-key-tile">
            <div className="fr-key-value font-mono" style={{ color: tile.color }}>{tile.val}</div>
            <div className="fr-key-unit">{tile.unit}</div>
          </div>
        ))}
      </div>

      {otherDispatches.length > 0 && (
        <div className="dispatcher-surface fr-card fr-card--tight">
          <div className="fr-card-header">
            <span className="font-semibold text-[13px]">Also Responding</span>
            <span className="fr-count-badge">{otherDispatches.length}</span>
          </div>
          {otherDispatches.map((d) => (
            <div key={d.dispatch_id} className="fr-unit-row font-mono">
              <span className="text-(--accent) font-bold">{d.vehicle_plate ?? d.vehicle_id?.slice(0, 8)}</span>
              <span className="text-(--text-secondary)">
                · {vehicleTypeName(d.vehicle_plate)}{d.eta_minutes != null ? ` · ETA ${d.eta_minutes}m` : ''}
              </span>
            </div>
          ))}
        </div>
      )}

      <div className="fr-action-bar">
        <button type="button" className="dispatcher-btn-ghost fr-flag-btn" onClick={() => setFlagOpen(true)}>
          <Flag size={18} />
          Flag Issue
        </button>
        <button type="button" className="dispatcher-btn-primary fr-accept-btn" onClick={handleAccept}>
          <Check size={18} />
          Accept Assignment
        </button>
      </div>

      <FlagIssueModal open={flagOpen} onClose={() => setFlagOpen(false)} />
    </div>
  )
}

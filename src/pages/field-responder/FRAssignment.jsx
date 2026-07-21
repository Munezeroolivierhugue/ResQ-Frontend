import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Phone, Flag, Check, Loader, MessageSquare } from 'lucide-react'
import SeverityBanner from '../../components/field-responder/SeverityBanner'
import FieldResponderProgressStrip from '../../components/field-responder/FieldResponderProgressStrip'
import FlagIssueModal from '../../components/field-responder/FlagIssueModal'
import { etaColor } from '../../data/mockFieldResponderData'
import { useFieldResponderStore } from '../../store/fieldResponderStore'
import { connect, subscribe, disconnect } from '../../lib/wsClient'
import { getAccessToken } from '../../utils/authSession'
import { listDispatchesForIncident } from '../../api/dispatches'
import { getIncident } from '../../api/incidents'
import { formatIncidentType } from '../../utils/incidentTypeLabels'

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
  const dispatchMessages  = useFieldResponderStore((s) => s.dispatchMessages)
  const addDispatchMessage = useFieldResponderStore((s) => s.addDispatchMessage)
  const [flagOpen, setFlagOpen] = useState(false)
  const [polling, setPolling]   = useState(false)

  // Dispatcher messages — the dispatcher can send a message to this unit any
  // time after dispatching, including before the responder taps Accept. That
  // used to be invisible here entirely (only FROnScene subscribed to the chat
  // topic, and only kept it in local state), so anything sent while the
  // responder was still deciding whether to accept was silently lost. Same
  // topic/shared store as FRNavigation.jsx and FROnScene.jsx — one persistent
  // thread across the whole assignment lifecycle.
  const dispatchId = assignment?.dispatch?.dispatch_id
  useEffect(() => {
    if (!dispatchId) return
    const token = getAccessToken()
    if (!token) return
    connect(token)
    const unsub = subscribe(`/topic/dispatches/${dispatchId}/chat`, (msg) => {
      const now = new Date()
      const time = now.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })
      addDispatchMessage({
        id: `ws-${Date.now()}-${Math.random()}`,
        type: 'text',
        from: msg.senderRole === 'FIELD_RESPONDER' ? 'officer' : 'dispatch',
        text: msg.text,
        senderName: msg.senderName,
        time: msg.timestamp ?? time,
      })
    })
    return unsub
  }, [dispatchId]) // eslint-disable-line react-hooks/exhaustive-deps

  // WebSocket: subscribe to /user/queue/assignments for instant dispatch notification
  useEffect(() => {
    if (assignment) return
    const token = getAccessToken()
    if (!token) return

    connect(token)
    const unsub = subscribe('/user/queue/assignments', async (event) => {
      // event is a DispatchAssignedEvent from the backend
      if (!event?.incidentId) return
      const store = useFieldResponderStore.getState()
      if (store.assignment) return  // already have one
      try {
        // Previously built a partial incident object by hand from the WS event
        // payload (DispatchAssignedEvent) — it never carried district/sector/
        // call_time at all, so those fields always showed blank here even
        // though the polling fallback (which calls getIncident()) had them.
        // Fetching the real incident keeps this path in sync with every field
        // the transform in api/incidents.js exposes, now and in the future.
        const [dispatches, inc] = await Promise.all([
          listDispatchesForIncident(event.incidentId),
          getIncident(event.incidentId),
        ])
        const mine = dispatches.find((d) => d.vehicle_id === store.vehicleId)
        if (!mine) return
        store.setIncidentId(event.incidentId)
        store.setAssignment({
          incident: inc,
          dispatch: mine,
          otherDispatches: dispatches.filter((d) => d.vehicle_id !== store.vehicleId),
        })
        useFieldResponderStore.setState({ hasActiveAssignment: true })
      } catch { /* silent — polling fallback will catch it */ }
    })

    return () => { unsub() }
  }, [assignment]) // eslint-disable-line react-hooks/exhaustive-deps

  // Polling fallback: runs every 15s in case WebSocket message was missed
  useEffect(() => {
    if (assignment) return
    let alive = true
    const run = async () => {
      setPolling(true)
      await pollForAssignment()
      if (alive) setPolling(false)
    }
    run()
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
  // Previously showed only the district (or address as a fallback, never
  // both) with the sector mislabeled as "landmark" — the specific street/
  // place the dispatcher actually captured (incident.address, e.g. "National
  // Archives of Rwanda, Mini Ubumwe") was silently dropped everywhere on
  // this screen, so the responder only ever saw a broad sector like
  // "Kacyiru" instead of the exact location.
  const location = `${incident.district ?? 'Unknown district'}${incident.sector ? ' / ' + incident.sector : ''}`
  const landmark = incident.address ?? ''

  return (
    <div className="fr-page fr-page--assignment">
      <SeverityBanner
        severity={incident.severity ?? 'medium'}
        label="INCOMING ASSIGNMENT"
        title={formatIncidentType(incident.incident_type)}
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
          ['Type',              formatIncidentType(incident.incident_type)],
          ['Severity',          (incident.severity ?? 'medium').toUpperCase()],
          ['District / Sector', `${incident.district ?? '—'}${incident.sector ? ' / ' + incident.sector : ''}`],
          ['Location',          incident.address ?? '—'],
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

      {dispatchMessages.length > 0 && (
        <div className="dispatcher-surface fr-card fr-card--tight">
          <div className="fr-card-header">
            <MessageSquare size={14} className="text-(--accent)" />
            <span className="font-semibold text-[13px]">Messages from dispatcher</span>
          </div>
          <div className="fr-divider" />
          <div className="flex flex-col gap-2 p-1">
            {dispatchMessages.map((m) => (
              <div key={m.id} className="fr-info-row" style={{ alignItems: 'flex-start' }}>
                <span className="text-(--text-secondary)" style={{ whiteSpace: 'nowrap' }}>
                  {m.from === 'officer' ? 'You' : (m.senderName || 'Dispatch')} · {m.time}
                </span>
                <span style={{ textAlign: 'right' }}>{m.text}</span>
              </div>
            ))}
          </div>
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

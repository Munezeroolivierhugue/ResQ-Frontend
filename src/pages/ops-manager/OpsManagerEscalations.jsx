import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { ShieldAlert } from 'lucide-react'
import SectionTitle from '../../components/dispatcher/SectionTitle'
import StatusBadge from '../../components/dispatcher/StatusBadge'
import OpsManagerDistrictLabel from '../../components/ops-manager/OpsManagerDistrictLabel'
import DispatchUnitsModal from '../../components/ops-manager/DispatchUnitsModal'
import { listIncidents } from '../../api/incidents'
import { listBackupRequests, acknowledgeBackupRequest } from '../../api/backup-requests'
import { getCurrentUser } from '../../utils/authSession'
import { formatIncidentType } from '../../utils/incidentTypeLabels'
import { useToastStore } from '../../store/toastStore'

const TERMINAL_STATUSES = new Set(['RESOLVED', 'PENDING_REPORT', 'CLOSED'])

function elapsedDisplay(callTime) {
  if (!callTime) return '—'
  const mins = Math.floor((Date.now() - new Date(callTime).getTime()) / 60000)
  if (mins < 60) return `${mins}m`
  return `${Math.floor(mins / 60)}h ${mins % 60}m`
}

function timeAgo(isoString) {
  const diffMin = Math.floor((Date.now() - new Date(isoString).getTime()) / 60000)
  if (diffMin < 1) return 'Just now'
  if (diffMin < 60) return `${diffMin}m ago`
  return `${Math.floor(diffMin / 60)}h ago`
}

export default function OpsManagerEscalations() {
  const [escalations, setEscalations] = useState([])
  const [loading, setLoading] = useState(true)

  // Escalation ("needs supervision") and a backup request ("send more
  // units") are different signals, but both land an incident in this
  // dispatcher's/ops manager's attention queue, and both need the SAME
  // "Dispatch Additional Units" action available — previously that action
  // only existed on the Dashboard's Backup Requests panel, so a backup
  // request that was never also escalated had nowhere to be acted on from
  // this page (the natural place an Ops Manager looks for "things needing
  // my attention").
  const [backupRequests, setBackupRequests] = useState([])
  const [backupLoading, setBackupLoading] = useState(true)
  const [dispatchTarget, setDispatchTarget] = useState(null)
  const pushToast = useToastStore((s) => s.pushToast)
  const districtId = getCurrentUser()?.district_id

  useEffect(() => {
    // `escalated` is a one-way flag that's never cleared once the incident
    // is later resolved/closed — without also filtering by status here,
    // every incident ever escalated stays in this queue forever.
    listIncidents({ escalated: true, ...(districtId ? { districtId } : {}) })
      .then((all) => setEscalations(all.filter((i) => !TERMINAL_STATUSES.has(i.status))))
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [districtId])

  useEffect(() => {
    Promise.all([
      listBackupRequests(),
      listIncidents(districtId ? { districtId } : {}),
    ])
      .then(([requests, districtIncidents]) => {
        const districtIncidentIds = new Set(districtIncidents.map((i) => i.incident_id))
        const byRef = new Map(districtIncidents.map((i) => [i.incident_id, i]))
        setBackupRequests(
          requests
            .filter((r) => r.status !== 'ACKNOWLEDGED' && districtIncidentIds.has(r.incident_id))
            .map((r) => ({ ...r, incident: byRef.get(r.incident_id) }))
        )
      })
      .catch(() => {})
      .finally(() => setBackupLoading(false))
  }, [districtId])

  const showToast = (msg, variant = 'success') => {
    pushToast({ variant, title: variant === 'error' ? 'Error' : 'Escalations', message: msg })
  }

  const handleAcknowledge = async (req) => {
    try {
      await acknowledgeBackupRequest(req.backup_id)
      setBackupRequests((prev) => prev.filter((r) => r.backup_id !== req.backup_id))
      showToast('Backup request acknowledged')
    } catch {
      showToast('Could not acknowledge — try again', 'error')
    }
  }

  return (
    <div className="portal-page relative">
      <DispatchUnitsModal
        isOpen={!!dispatchTarget}
        incidentId={dispatchTarget?.incident_id}
        incidentRef={dispatchTarget?.incident_ref}
        districtId={districtId}
        onClose={() => setDispatchTarget(null)}
        onConfirm={async (units) => {
          // "Dispatch Units" and "Acknowledge" were two separate actions —
          // dispatching never told the field responder who originally asked
          // for backup that it was actually happening, since only the
          // Acknowledge button called the (real, notification-sending)
          // acknowledge endpoint. Dispatching backup units IS acknowledging
          // the request, so do both together.
          const backupId = dispatchTarget?.backup_id
          setDispatchTarget(null)
          if (backupId) {
            try {
              await acknowledgeBackupRequest(backupId)
              setBackupRequests((prev) => prev.filter((r) => r.backup_id !== backupId))
            } catch {
              // Units are already dispatched at this point — surface the ack
              // failure separately rather than implying the dispatch itself failed.
              showToast('Units dispatched, but the responder could not be notified', 'error')
            }
          }
          showToast(`${units.length} unit${units.length > 1 ? 's' : ''} dispatched`)
        }}
      />

      <h1 className="dispatcher-page-title m-0">Escalation Command</h1>
      <OpsManagerDistrictLabel />
      <p className="dispatcher-page-subtitle mt-2">Active escalations and backup requests requiring operations manager attention.</p>

      <div className="mt-6 flex flex-col gap-3">
        <SectionTitle title="Active Escalations" badge={<StatusBadge label={String(escalations.length)} variant="critical" />} />
        {loading ? (
          <div className="dispatcher-surface p-4 text-[13px] text-(--text-muted)">Loading…</div>
        ) : escalations.length === 0 ? (
          <div className="dispatcher-surface p-4 text-[13px] text-(--text-muted)">
            No escalated incidents right now.
          </div>
        ) : (
          escalations.map((esc) => (
            <div key={esc.incident_id} className="dispatcher-surface p-4 flex flex-wrap items-center justify-between gap-3">
              <div>
                <span className="font-mono font-bold text-(--accent)">{esc.incident_ref}</span>
                <StatusBadge label={(esc.severity ?? 'medium').toUpperCase()} variant={esc.severity === 'critical' ? 'critical' : 'handover'} />
                <div className="text-[14px] font-semibold mt-1">{formatIncidentType(esc.incident_type)}</div>
                <div className="text-[12px] text-(--text-secondary)">
                  {esc.district ?? esc.address ?? 'Unknown location'} · {elapsedDisplay(esc.call_time)}
                  {esc.escalated_by_name && ` · Escalated by ${esc.escalated_by_name}`}
                </div>
              </div>
              <Link to={`/ops-manager/escalations/${esc.incident_id}`} className="dispatcher-btn-primary no-underline text-[12px]">
                Take Command →
              </Link>
            </div>
          ))
        )}
      </div>

      <div className="mt-6 flex flex-col gap-3">
        <SectionTitle title="Backup Requests" badge={<StatusBadge label={String(backupRequests.length)} variant="handover" />} />
        {backupLoading ? (
          <div className="dispatcher-surface p-4 text-[13px] text-(--text-muted)">Loading…</div>
        ) : backupRequests.length === 0 ? (
          <div className="dispatcher-surface p-4 text-[13px] text-(--text-muted)">
            No pending backup requests in your district.
          </div>
        ) : (
          backupRequests.map((req) => (
            <div key={req.backup_id} className="dispatcher-surface p-4 flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-start gap-2">
                <ShieldAlert size={16} className="mt-0.5 shrink-0" style={{ color: 'var(--status-medium)' }} />
                <div>
                  <span className="font-mono font-bold text-(--accent)">{req.incident_ref}</span>
                  <span className="text-[12px] text-(--text-muted) ml-2">{timeAgo(req.created_at)}</span>
                  <div className="text-[13px] mt-0.5">{req.reason}</div>
                  {req.notes && (
                    <div className="text-[12px] text-(--text-secondary) mt-0.5 italic">"{req.notes}"</div>
                  )}
                  <div className="text-[12px] text-(--text-secondary)">
                    {req.plate_number ?? 'Unit'} · {req.incident?.district ?? req.incident?.address ?? 'Unknown location'}
                  </div>
                </div>
              </div>
              <div className="flex gap-2">
                <button type="button" className="dispatcher-btn-ghost text-[12px]" onClick={() => handleAcknowledge(req)}>
                  Acknowledge
                </button>
                <button type="button" className="dispatcher-btn-primary text-[12px]" onClick={() => setDispatchTarget(req)}>
                  Dispatch Units
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  )
}

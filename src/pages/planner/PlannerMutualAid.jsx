import { useState, useEffect } from 'react'
import { Sparkles, Send, X, Truck, ListFilter } from 'lucide-react'
import PlannerPageHeader from '../../components/planner/PlannerPageHeader'
import StatusBadge from '../../components/dispatcher/StatusBadge'
import { listMutualAidRequests, recommendMutualAidSource, fulfillMutualAid, declineMutualAid } from '../../api/mutualAid'
import { listVehicles } from '../../api/vehicles'
import { useToastStore } from '../../store/toastStore'

function timeAgo(isoString) {
  const diffMin = Math.floor((Date.now() - new Date(isoString).getTime()) / 60000)
  if (diffMin < 1) return 'Just now'
  if (diffMin < 60) return `${diffMin}m ago`
  return `${Math.floor(diffMin / 60)}h ago`
}

function scoreTone(score) {
  if (score >= 0.7) return 'var(--status-low)'
  if (score >= 0.4) return 'var(--status-medium)'
  return 'var(--status-critical)'
}

// Mirrors the backend's exact matchesUnitType() comparison (underscore-
// insensitive, case-insensitive) so the manual browse list shows exactly the
// same notion of "matches this request" the AI recommendation itself uses —
// just without the AI's own ranking/candidate-selection possibly missing one.
function unitTypeMatches(vehicleType, unitType) {
  if (!vehicleType || !unitType) return false
  return vehicleType.replace(/_/g, ' ').toLowerCase() === unitType.replace(/_/g, ' ').toLowerCase()
}

function RequestCard({ request, onResolved, showToast }) {
  const [recommendation, setRecommendation] = useState(null)
  const [loadingRec, setLoadingRec] = useState(false)
  const [recError, setRecError] = useState(null)
  const [actingVehicleId, setActingVehicleId] = useState(null)
  const [declining, setDeclining] = useState(false)
  const [declineReason, setDeclineReason] = useState('')
  const [submittingDecline, setSubmittingDecline] = useState(false)
  const [browsing, setBrowsing] = useState(false)
  const [loadingBrowse, setLoadingBrowse] = useState(false)
  const [browseError, setBrowseError] = useState(null)
  const [availableUnits, setAvailableUnits] = useState([])

  // Human-decision fallback: every currently AVAILABLE vehicle system-wide
  // matching this request's unit type, regardless of what the AI recommended
  // (or failed to recommend) — so a planner can act even when the AI engine
  // is unreachable, or its ranking missed a real match.
  const handleBrowse = async () => {
    setBrowsing(true)
    setLoadingBrowse(true)
    setBrowseError(null)
    try {
      const vehicles = await listVehicles({ status: 'AVAILABLE' })
      setAvailableUnits(vehicles.filter((v) =>
        unitTypeMatches(v.vehicle_type, request.unit_type)
        && v.district_id !== request.requesting_district_id
      ))
    } catch {
      setBrowseError('Could not load available units — please retry.')
    } finally {
      setLoadingBrowse(false)
    }
  }

  const handleGetRecommendation = async () => {
    setLoadingRec(true)
    setRecError(null)
    try {
      setRecommendation(await recommendMutualAidSource(request.request_id))
    } catch {
      setRecError('Could not reach the AI engine — please retry.')
    } finally {
      setLoadingRec(false)
    }
  }

  const handleSend = async (vehicleId) => {
    setActingVehicleId(vehicleId)
    try {
      await fulfillMutualAid(request.request_id, vehicleId)
      showToast(`Unit sent for ${request.unit_type} request`)
      onResolved(request.request_id)
    } catch (err) {
      showToast(err?.response?.data?.message ?? 'Could not send unit — please retry', 'error')
    } finally {
      setActingVehicleId(null)
    }
  }

  const handleDecline = async () => {
    setSubmittingDecline(true)
    try {
      await declineMutualAid(request.request_id, declineReason || null)
      showToast('Request declined')
      onResolved(request.request_id)
    } catch {
      showToast('Could not decline request — please retry', 'error')
    } finally {
      setSubmittingDecline(false)
    }
  }

  return (
    <div className="dispatcher-surface p-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <div className="text-[14px] font-bold">
            {request.quantity}× {request.unit_type} — {request.requesting_district_name}
          </div>
          <div className="text-[12px] text-(--text-secondary) mt-1">
            Requested by {request.requested_by_name ?? 'Ops Manager'} · {timeAgo(request.created_at)}
          </div>
          {request.reason && (
            <p className="text-[12px] text-(--text-secondary) mt-2 mb-0 max-w-[60ch]">{request.reason}</p>
          )}
        </div>
        <StatusBadge label="PENDING" variant="handover" />
      </div>

      {!recommendation && !declining && !browsing && (
        <div className="flex gap-2 mt-4">
          <button
            type="button"
            className="dispatcher-btn-primary text-[12px] inline-flex items-center gap-1.5"
            disabled={loadingRec}
            onClick={handleGetRecommendation}
          >
            <Sparkles size={14} />
            {loadingRec ? 'Running AI recommendation…' : 'Get AI Recommendation'}
          </button>
          <button
            type="button"
            className="dispatcher-btn-ghost text-[12px] inline-flex items-center gap-1.5"
            disabled={loadingBrowse}
            onClick={handleBrowse}
          >
            <ListFilter size={14} />
            {loadingBrowse ? 'Loading units…' : 'Browse Units Manually'}
          </button>
          <button
            type="button"
            className="dispatcher-btn-ghost text-[12px]"
            onClick={() => setDeclining(true)}
          >
            Decline
          </button>
        </div>
      )}

      {recError && <p className="text-[12px] mt-3" style={{ color: 'var(--status-critical)' }}>{recError}</p>}

      {browsing && !declining && (
        <div className="mt-4 pt-4 border-t border-(--border-subtle)">
          <p className="text-[11px] text-(--text-muted) m-0 mb-3">
            Every currently available {request.unit_type.replace(/_/g, ' ').toLowerCase()} unit outside{' '}
            {request.requesting_district_name} — a human-decision fallback independent of the AI ranking above.
          </p>
          {browseError && <p className="text-[12px] mb-3" style={{ color: 'var(--status-critical)' }}>{browseError}</p>}
          {!loadingBrowse && availableUnits.length === 0 && !browseError && (
            <p className="text-[12px] text-(--text-secondary) m-0">No available {request.unit_type.replace(/_/g, ' ').toLowerCase()} unit found in any other district.</p>
          )}
          <div className="flex flex-col gap-2">
            {availableUnits.map((v) => (
              <div key={v.vehicle_id} className="flex flex-wrap items-center justify-between gap-3 p-3 rounded-lg" style={{ background: 'var(--bg-elevated)' }}>
                <div>
                  <div className="text-[13px] font-semibold flex items-center gap-1.5">
                    <Truck size={13} />
                    {v.plate_number} · {v.district_name}
                  </div>
                  <div className="text-[11px] text-(--text-secondary)">{v.vehicle_type.replace(/_/g, ' ')} — {v.capability ?? 'no capability listed'}</div>
                </div>
                <button
                  type="button"
                  className="dispatcher-btn-primary text-[12px] inline-flex items-center gap-1.5"
                  disabled={actingVehicleId === v.vehicle_id}
                  onClick={() => handleSend(v.vehicle_id)}
                >
                  <Send size={13} />
                  Send {v.plate_number}
                </button>
              </div>
            ))}
          </div>
          <button
            type="button"
            className="dispatcher-btn-ghost text-[12px] mt-3"
            onClick={() => setBrowsing(false)}
          >
            ← Back
          </button>
        </div>
      )}

      {recommendation && (
        <div className="mt-4 pt-4 border-t border-(--border-subtle)">
          <p className="text-[11px] text-(--text-muted) m-0 mb-3">{recommendation.reasoning}</p>
          {recommendation.candidates.length === 0 ? (
            <p className="text-[12px] text-(--text-secondary) m-0">No district currently has a spare unit of this type.</p>
          ) : (
            <div className="flex flex-col gap-2">
              {recommendation.candidates.map((c) => (
                <div key={c.district_id} className="flex flex-wrap items-center justify-between gap-3 p-3 rounded-lg" style={{ background: 'var(--bg-elevated)' }}>
                  <div className="flex items-center gap-3">
                    <span
                      className="text-[11px] font-mono font-bold px-2 py-0.5 rounded"
                      style={{ background: `color-mix(in srgb, ${scoreTone(c.score)} 15%, transparent)`, color: scoreTone(c.score) }}
                    >
                      {Math.round(c.score * 100)}%
                    </span>
                    <div>
                      <div className="text-[13px] font-semibold flex items-center gap-1.5">
                        <Truck size={13} />
                        {c.district_name}
                      </div>
                      <div className="text-[11px] text-(--text-secondary)">{c.reasoning}</div>
                    </div>
                  </div>
                  <button
                    type="button"
                    className="dispatcher-btn-primary text-[12px] inline-flex items-center gap-1.5"
                    disabled={!c.suggested_vehicle_id || actingVehicleId === c.suggested_vehicle_id}
                    onClick={() => handleSend(c.suggested_vehicle_id)}
                  >
                    <Send size={13} />
                    Send {c.suggested_vehicle_plate ?? 'unit'}
                  </button>
                </div>
              ))}
            </div>
          )}
          <button
            type="button"
            className="dispatcher-btn-ghost text-[12px] mt-3"
            onClick={() => setDeclining(true)}
          >
            No suitable unit — decline instead
          </button>
        </div>
      )}

      {declining && (
        <div className="mt-4 pt-4 border-t border-(--border-subtle)">
          <label className="dispatcher-field">
            <span className="field-label">Reason for declining (optional)</span>
            <textarea
              className="dispatcher-input dispatcher-textarea"
              rows={2}
              value={declineReason}
              onChange={(e) => setDeclineReason(e.target.value)}
            />
          </label>
          <div className="flex gap-2 mt-3">
            <button type="button" className="dispatcher-btn-ghost text-[12px]" onClick={() => setDeclining(false)}>
              <X size={13} /> Cancel
            </button>
            <button
              type="button"
              className="dispatcher-btn-primary text-[12px]"
              disabled={submittingDecline}
              onClick={handleDecline}
            >
              {submittingDecline ? 'Declining…' : 'Confirm Decline'}
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

export default function PlannerMutualAid() {
  const [requests, setRequests] = useState([])
  const [loading, setLoading] = useState(true)
  const pushToast = useToastStore((s) => s.pushToast)

  function showToast(msg, variant = 'success') {
    pushToast({ variant, title: variant === 'error' ? 'Error' : 'Mutual Aid', message: msg })
  }

  useEffect(() => {
    listMutualAidRequests({ status: 'PENDING' })
      .then(setRequests)
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  function handleResolved(requestId) {
    setRequests((prev) => prev.filter((r) => r.request_id !== requestId))
  }

  return (
    <div className="portal-page flex flex-col gap-5">
      <PlannerPageHeader
        title="Mutual Aid Requests"
        eyebrow="Emergency Planner"
        subtitle="Ops Managers request units here when their district is short. Run the AI recommendation to find a real spare unit in another district and send it — no further approval needed."
      />

      {loading ? (
        <p className="text-[13px] text-(--text-muted)">Loading…</p>
      ) : requests.length === 0 ? (
        <div className="dispatcher-surface p-8 text-center">
          <p className="text-[13px] text-(--text-muted) m-0">No pending mutual aid requests.</p>
        </div>
      ) : (
        <div className="flex flex-col gap-4">
          {requests.map((r) => (
            <RequestCard key={r.request_id} request={r} onResolved={handleResolved} showToast={showToast} />
          ))}
        </div>
      )}
    </div>
  )
}

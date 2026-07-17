import { useState, useEffect } from 'react'
import { Sparkles, Send, X, Truck } from 'lucide-react'
import PlannerPageHeader from '../../components/planner/PlannerPageHeader'
import StatusBadge from '../../components/dispatcher/StatusBadge'
import { listMutualAidRequests, recommendMutualAidSource, fulfillMutualAid, declineMutualAid } from '../../api/mutualAid'

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

function RequestCard({ request, onResolved, showToast }) {
  const [recommendation, setRecommendation] = useState(null)
  const [loadingRec, setLoadingRec] = useState(false)
  const [recError, setRecError] = useState(null)
  const [actingVehicleId, setActingVehicleId] = useState(null)
  const [declining, setDeclining] = useState(false)
  const [declineReason, setDeclineReason] = useState('')
  const [submittingDecline, setSubmittingDecline] = useState(false)

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
      showToast(err?.response?.data?.message ?? 'Could not send unit — please retry')
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
      showToast('Could not decline request — please retry')
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

      {!recommendation && !declining && (
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
            className="dispatcher-btn-ghost text-[12px]"
            onClick={() => setDeclining(true)}
          >
            Decline
          </button>
        </div>
      )}

      {recError && <p className="text-[12px] mt-3" style={{ color: 'var(--status-critical)' }}>{recError}</p>}

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
  const [toast, setToast] = useState(null)

  function showToast(msg) {
    setToast(msg)
    setTimeout(() => setToast(null), 2500)
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
      {toast && (
        <div className="fixed bottom-5 right-5 z-[9999] dispatcher-surface px-4 py-2.5 text-[13px] font-medium shadow-lg" style={{ borderLeft: '3px solid var(--accent)' }}>
          {toast}
        </div>
      )}
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

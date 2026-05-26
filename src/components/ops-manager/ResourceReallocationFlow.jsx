import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  Brain,
  TrendingUp,
  RefreshCw,
  Smartphone,
  MapPin,
  Navigation,
  CheckCircle2,
  XCircle,
  Pencil,
  History,
  Radio,
  AlertTriangle,
} from 'lucide-react'
import StatusBadge from '../dispatcher/StatusBadge'
import { mockUnits } from '../../data/mockData'
import {
  INITIAL_REALLOCATION_RECS,
  REALLOCATION_REJECTION_REASONS,
  formatAuditStamp,
  formatAuditTime,
} from '../../data/mockResourceReallocationData'
const FILTERS = ['All', 'Pending', 'Approved', 'Rejected']
const EXEC_STEPS = [
  { key: 'sent', label: 'Order sent to mobile device' },
  { key: 'ack', label: 'Officer acknowledged' },
  { key: 'enroute', label: 'En route to new standby point' },
  { key: 'arrived', label: 'Arrived at standby — GPS updated on map' },
]

function nextAuditId(log) {
  const n = log.length + 1
  return `AUD-${String(n).padStart(4, '0')}`
}

export default function ResourceReallocationFlow() {
  const [recommendations, setRecommendations] = useState(() =>
    INITIAL_REALLOCATION_RECS.map((r) => ({ ...r }))
  )
  const [filter, setFilter] = useState('Pending')
  const [expandedId, setExpandedId] = useState(null)
  const [rejectingId, setRejectingId] = useState(null)
  const [modifyDraft, setModifyDraft] = useState({})
  const [rejectDraft, setRejectDraft] = useState({ reason: '', notes: '' })
  const [auditLog, setAuditLog] = useState([])
  const [activeExecution, setActiveExecution] = useState(null)
  const [execStepIndex, setExecStepIndex] = useState(0)
  const [toast, setToast] = useState(null)

  const pending = recommendations.filter((r) => r.status === 'pending')
  const filtered = useMemo(() => {
    if (filter === 'All') return recommendations
    return recommendations.filter((r) => r.status === filter.toLowerCase())
  }, [recommendations, filter])

  useEffect(() => {
    if (!toast) return undefined
    const t = setTimeout(() => setToast(null), 4500)
    return () => clearTimeout(t)
  }, [toast])

  useEffect(() => {
    if (!activeExecution) return undefined
    if (execStepIndex >= EXEC_STEPS.length - 1) return undefined
    const t = setTimeout(() => setExecStepIndex((i) => i + 1), 1400)
    return () => clearTimeout(t)
  }, [activeExecution, execStepIndex])

  const showToast = (message, variant = 'success') => setToast({ message, variant })

  const appendAudit = (entry) => {
    setAuditLog((log) => [
      {
        id: nextAuditId(log),
        timestamp: formatAuditStamp(),
        timeShort: formatAuditTime(),
        ...entry,
      },
      ...log,
    ])
  }

  const startExecution = (rec, payload) => {
    const unitId = payload.unitId
    const destination = payload.destination
    setActiveExecution({
      recId: rec.id,
      unitId,
      destination,
      officerName: payload.officerName || rec.officerName,
      fromLat: rec.fromLat,
      fromLng: rec.fromLng,
      toLat: rec.toLat,
      toLng: rec.toLng,
      modified: payload.modified || false,
      originalUnitId: rec.suggestedUnitId,
    })
    setExecStepIndex(0)
    setRecommendations((list) =>
      list.map((r) =>
        r.id === rec.id
          ? {
              ...r,
              status: 'approved',
              approvedUnitId: unitId,
              approvedDestination: destination,
              approvedAt: formatAuditStamp(),
            }
          : r
      )
    )
    setExpandedId(null)
    setRejectingId(null)
    showToast(
      payload.modified
        ? `Modified move approved — order sent to ${unitId}`
        : `Redeployment instruction sent to ${rec.officerName}'s device`
    )
  }

  useEffect(() => {
    if (!activeExecution || execStepIndex < EXEC_STEPS.length - 1) return undefined
    const t = setTimeout(() => {
      setActiveExecution(null)
      setExecStepIndex(0)
    }, 800)
    return () => clearTimeout(t)
  }, [execStepIndex, activeExecution])

  const handleExecute = (rec) => {
    startExecution(rec, {
      unitId: rec.suggestedUnitId,
      destination: rec.destination,
      officerName: rec.officerName,
      modified: false,
    })
    appendAudit({
      recId: rec.id,
      action: 'executed',
      unitId: rec.suggestedUnitId,
      destination: rec.destination,
      detail: `Execute Move — ${rec.suggestedUnitId} to ${rec.destination}`,
      aiLearning: false,
      pendingGps: true,
    })
  }

  const handleConfirmModified = (rec) => {
    const draft = modifyDraft[rec.id] || {}
    const unitId = draft.unitId || rec.suggestedUnitId
    const destination = draft.destination || rec.destination
    const unit = mockUnits.find((u) => u.id === unitId)
    startExecution(rec, {
      unitId,
      destination,
      officerName: rec.officerName,
      modified: unitId !== rec.suggestedUnitId || destination !== rec.destination,
    })
    appendAudit({
      recId: rec.id,
      action: 'modified_approved',
      unitId,
      destination,
      detail:
        unitId !== rec.suggestedUnitId
          ? `Modified: substituted ${rec.suggestedUnitId} with ${unitId} → ${destination}`
          : `Modified destination → ${destination}`,
      aiLearning: false,
      originalUnitId: rec.suggestedUnitId,
    })
  }

  const handleReject = (rec) => {
    const reason = rejectDraft.reason
    const notes = rejectDraft.notes?.trim()
    if (!reason) {
      showToast('Select a rejection reason before submitting', 'error')
      return
    }
    setRecommendations((list) =>
      list.map((r) =>
        r.id === rec.id
          ? {
              ...r,
              status: 'rejected',
              rejectedAt: formatAuditStamp(),
              rejectReason: reason,
              rejectNotes: notes,
            }
          : r
      )
    )
    appendAudit({
      recId: rec.id,
      action: 'rejected',
      unitId: rec.suggestedUnitId,
      destination: rec.destination,
      detail: `Rejected — ${reason}${notes ? `: ${notes}` : ''}`,
      rejectReason: reason,
      rejectNotes: notes,
      aiLearning: true,
    })
    setRejectingId(null)
    setRejectDraft({ reason: '', notes: '' })
    showToast('Rejection logged — reason will feed AI model as learning signal', 'info')
  }

  const openModify = (rec) => {
    setExpandedId(rec.id)
    setRejectingId(null)
    const defaultUnit =
      rec.officerDutyHours >= 6 && mockUnits.some((u) => u.id === 'P-19') ? 'P-19' : rec.suggestedUnitId
    setModifyDraft((d) => ({
      ...d,
      [rec.id]: {
        unitId: defaultUnit,
        destination: rec.destination,
      },
    }))
  }

  const gpsProgress =
    activeExecution && execStepIndex >= 2
      ? Math.min(100, 35 + (execStepIndex - 1) * 28)
      : activeExecution && execStepIndex >= 1
        ? 18
        : 0

  return (
    <>
      {toast && (
        <div
          className="fixed top-20 right-6 z-50 max-w-sm px-4 py-3 rounded-lg border text-[13px] font-medium shadow-lg"
          style={{
            background: 'var(--bg-surface)',
            borderColor: toast.variant === 'error' ? 'var(--status-critical)' : 'var(--border)',
            color: toast.variant === 'error' ? 'var(--status-critical)' : 'var(--text-primary)',
          }}
        >
          {toast.message}
        </div>
      )}

      <div className="flex flex-wrap items-start justify-between gap-4 mb-4">
        <div>
          <p className="dispatcher-page-subtitle m-0">
            Review each AI recommendation — execute, modify and approve, or reject with reason. All decisions are audit-logged.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-[11px] font-mono text-(--text-muted)">Last updated 2m ago</span>
          <button type="button" className="dispatcher-btn-ghost text-[12px] flex items-center gap-1">
            <RefreshCw size={14} /> Force Refresh
          </button>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-2 mb-4">
        {FILTERS.map((f) => (
          <button
            key={f}
            type="button"
            className="text-[11px] font-semibold px-3 py-1.5 rounded-full border cursor-pointer"
            style={{
              background: filter === f ? 'var(--accent-ghost)' : 'var(--bg-input)',
              borderColor: filter === f ? 'var(--accent)' : 'var(--border)',
              color: filter === f ? 'var(--accent)' : 'var(--text-secondary)',
            }}
            onClick={() => setFilter(f)}
          >
            {f}
          </button>
        ))}
        <StatusBadge label={`${pending.length} pending`} variant="active" />
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        <div className="xl:col-span-2 flex flex-col gap-4">
          {filtered.length === 0 && (
            <div className="dispatcher-surface p-8 text-center text-(--text-muted) text-[13px]">
              No recommendations in this filter.
            </div>
          )}

          {filtered.map((rec) => {
            const isPending = rec.status === 'pending'
            const isExecuting = activeExecution?.recId === rec.id
            const draft = modifyDraft[rec.id] || {
              unitId: rec.suggestedUnitId,
              destination: rec.destination,
            }
            const substituteUnit = mockUnits.find((u) => u.id === draft.unitId)
            const showFatigueHint =
              rec.officerDutyHours >= 6 && draft.unitId === rec.suggestedUnitId

            return (
              <div
                key={rec.id}
                className="dispatcher-surface p-4"
                style={{
                  opacity: rec.status !== 'pending' && !isExecuting ? 0.92 : 1,
                }}
              >
                <div className="flex flex-col lg:flex-row gap-4">
                  <div className="shrink-0 flex lg:flex-col items-center gap-2">
                    <span
                      className="w-2.5 h-2.5 rounded-full"
                      style={{
                        background:
                          rec.status === 'pending'
                            ? 'var(--status-medium)'
                            : rec.status === 'approved'
                              ? 'var(--status-low)'
                              : 'var(--status-critical)',
                      }}
                    />
                    <span className="font-mono text-[11px] text-(--text-muted)">{rec.id}</span>
                    {rec.status !== 'pending' && (
                      <StatusBadge
                        label={rec.status}
                        variant={rec.status === 'approved' ? 'resolved' : 'critical'}
                      />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="font-bold text-(--text-primary)">{rec.detail}</div>
                    <p className="text-[12px] text-(--text-secondary) m-0 mt-2 flex items-start gap-1.5">
                      <Brain size={14} className="shrink-0 mt-0.5" /> {rec.demand}
                    </p>
                    <p className="text-[12px] text-(--text-secondary) m-0 mt-1 flex items-start gap-1.5">
                      <TrendingUp size={14} className="shrink-0 mt-0.5" /> {rec.coverageGain}
                    </p>
                    <div className="mt-2 text-[11px] font-mono text-(--text-muted)">
                      Suggested: {rec.suggestedUnitId} · {rec.officerName} · {rec.origin} → {rec.destination}
                    </div>
                    {rec.officerDutyHours >= 6 && isPending && (
                      <div
                        className="mt-2 flex items-start gap-2 text-[11px] px-2.5 py-2 rounded-md"
                        style={{ background: 'var(--status-medium-bg)', color: 'var(--status-medium)' }}
                      >
                        <AlertTriangle size={14} className="shrink-0 mt-0.5" />
                        {rec.suggestedUnitId} officer on duty {rec.officerDutyHours}h — consider substituting P-19 for break coverage.
                      </div>
                    )}
                    {rec.status === 'approved' && rec.approvedAt && (
                      <div className="mt-2 text-[11px] text-(--status-low)">
                        Approved {rec.approvedAt}
                        {rec.approvedUnitId && rec.approvedUnitId !== rec.suggestedUnitId && (
                          <> · Modified unit: {rec.approvedUnitId}</>
                        )}
                      </div>
                    )}
                    {rec.status === 'rejected' && (
                      <div className="mt-2 text-[11px] text-(--status-critical)">
                        Rejected {rec.rejectedAt}: {rec.rejectReason}
                        {rec.rejectNotes ? ` — ${rec.rejectNotes}` : ''}
                      </div>
                    )}
                    <div className="mt-3">
                      <div className="text-[10px] font-mono text-(--text-muted) uppercase mb-1">Model confidence</div>
                      <div className="flex items-center gap-2">
                        <div className="flex-1 h-1 rounded-full bg-(--bg-input) overflow-hidden">
                          <div className="h-full bg-(--accent)" style={{ width: `${rec.confidence}%` }} />
                        </div>
                        <span className="text-[11px] font-mono">{rec.confidence}%</span>
                      </div>
                    </div>
                  </div>
                  {isPending && (
                    <div className="flex lg:flex-col gap-2 shrink-0">
                      <button
                        type="button"
                        className="dispatcher-btn-primary text-[12px] flex items-center justify-center gap-1"
                        disabled={!!activeExecution}
                        onClick={() => handleExecute(rec)}
                      >
                        <Navigation size={14} /> Execute Move
                      </button>
                      <button
                        type="button"
                        className="dispatcher-btn-ghost text-[12px] flex items-center justify-center gap-1"
                        onClick={() => (expandedId === rec.id ? setExpandedId(null) : openModify(rec))}
                      >
                        <Pencil size={14} /> Modify
                      </button>
                      <button
                        type="button"
                        className="dispatcher-btn-ghost text-[12px] flex items-center justify-center gap-1"
                        style={{ color: 'var(--status-critical)' }}
                        onClick={() => {
                          setRejectingId(rejectingId === rec.id ? null : rec.id)
                          setExpandedId(null)
                          setRejectDraft({ reason: '', notes: '' })
                        }}
                      >
                        <XCircle size={14} /> Reject
                      </button>
                    </div>
                  )}
                </div>

                {expandedId === rec.id && isPending && (
                  <div className="mt-4 pt-4 border-t border-(--border-subtle)">
                    <p className="text-[12px] text-(--text-secondary) m-0 mb-3">
                      Adjust the AI suggestion, then approve the modified version. Changes are logged in the audit trail.
                    </p>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-w-xl">
                      <label className="dispatcher-field">
                        <span className="field-label">Substitute unit</span>
                        <select
                          className="dispatcher-input dispatcher-select"
                          value={draft.unitId}
                          onChange={(e) =>
                            setModifyDraft((d) => ({
                              ...d,
                              [rec.id]: { ...draft, unitId: e.target.value },
                            }))
                          }
                        >
                          {mockUnits.slice(0, 12).map((u) => (
                            <option key={u.id} value={u.id}>
                              {u.id} — {u.type}
                              {u.id === 'P-19' ? ' (fresh shift)' : ''}
                            </option>
                          ))}
                        </select>
                      </label>
                      <label className="dispatcher-field">
                        <span className="field-label">Destination standby</span>
                        <input
                          className="dispatcher-input dispatcher-text-input"
                          value={draft.destination}
                          onChange={(e) =>
                            setModifyDraft((d) => ({
                              ...d,
                              [rec.id]: { ...draft, destination: e.target.value },
                            }))
                          }
                        />
                      </label>
                    </div>
                    {showFatigueHint && draft.unitId === 'P-19' && (
                      <p className="text-[11px] text-(--status-low) mt-2 m-0">
                        Substituting P-19 addresses officer fatigue while maintaining coverage.
                      </p>
                    )}
                    {substituteUnit && draft.unitId !== rec.suggestedUnitId && (
                      <p className="text-[11px] text-(--text-muted) mt-2 m-0">
                        Order will route to {substituteUnit.id} ({substituteUnit.type}) instead of {rec.suggestedUnitId}.
                      </p>
                    )}
                    <div className="flex gap-2 mt-3">
                      <button
                        type="button"
                        className="dispatcher-btn-primary text-[12px]"
                        disabled={!!activeExecution}
                        onClick={() => handleConfirmModified(rec)}
                      >
                        Approve Modified &amp; Execute
                      </button>
                      <button
                        type="button"
                        className="dispatcher-btn-ghost text-[12px]"
                        onClick={() => setExpandedId(null)}
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                )}

                {rejectingId === rec.id && isPending && (
                  <div className="mt-4 pt-4 border-t border-(--border-subtle)">
                    <p className="text-[12px] text-(--text-secondary) m-0 mb-3">
                      Rejection and reason are timestamped, stored in the audit trail, and sent to the AI model as a learning signal.
                    </p>
                    <div className="grid grid-cols-1 gap-3 max-w-xl">
                      <label className="dispatcher-field">
                        <span className="field-label">Rejection reason (required)</span>
                        <select
                          className="dispatcher-input dispatcher-select"
                          value={rejectDraft.reason}
                          onChange={(e) => setRejectDraft((d) => ({ ...d, reason: e.target.value }))}
                        >
                          <option value="">Select reason…</option>
                          {REALLOCATION_REJECTION_REASONS.map((r) => (
                            <option key={r} value={r}>
                              {r}
                            </option>
                          ))}
                        </select>
                      </label>
                      <label className="dispatcher-field">
                        <span className="field-label">Additional notes</span>
                        <textarea
                          className="dispatcher-input dispatcher-textarea"
                          rows={2}
                          placeholder="e.g. P-03 officer due for break; P-19 substituted manually on next rec"
                          value={rejectDraft.notes}
                          onChange={(e) => setRejectDraft((d) => ({ ...d, notes: e.target.value }))}
                        />
                      </label>
                    </div>
                    <div className="flex gap-2 mt-3">
                      <button
                        type="button"
                        className="dispatcher-btn-ghost text-[12px]"
                        style={{ color: 'var(--status-critical)' }}
                        onClick={() => handleReject(rec)}
                      >
                        Confirm Rejection
                      </button>
                      <button
                        type="button"
                        className="dispatcher-btn-ghost text-[12px]"
                        onClick={() => setRejectingId(null)}
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                )}

                {isExecuting && activeExecution && (
                  <div className="mt-4 pt-4 border-t border-(--border-subtle)">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div
                        className="rounded-lg p-3 border"
                        style={{ background: 'var(--bg-input)', borderColor: 'var(--border-subtle)' }}
                      >
                        <div className="flex items-center gap-2 text-[11px] font-mono uppercase text-(--text-muted) mb-2">
                          <Smartphone size={14} /> Field device (simulated)
                        </div>
                        <div
                          className="rounded-md p-3 text-[12px]"
                          style={{ background: 'var(--bg-surface)', border: '1px solid var(--border)' }}
                        >
                          <div className="font-bold text-(--accent) mb-1">New positioning order</div>
                          <div className="text-(--text-primary)">
                            Unit {activeExecution.unitId} — proceed to {activeExecution.destination}
                          </div>
                          <div className="text-[10px] text-(--text-muted) mt-2 font-mono">
                            {execStepIndex >= 1 ? 'Delivered · Acknowledged' : 'Sending…'}
                          </div>
                        </div>
                        <ul className="mt-3 space-y-1.5 m-0 p-0 list-none">
                          {EXEC_STEPS.map((step, i) => (
                            <li
                              key={step.key}
                              className="flex items-center gap-2 text-[11px]"
                              style={{
                                color: i <= execStepIndex ? 'var(--status-low)' : 'var(--text-muted)',
                              }}
                            >
                              {i < execStepIndex ? (
                                <CheckCircle2 size={14} />
                              ) : i === execStepIndex ? (
                                <Radio size={14} className="animate-pulse" />
                              ) : (
                                <span className="w-3.5 h-3.5 rounded-full border border-(--border)" />
                              )}
                              {step.label}
                            </li>
                          ))}
                        </ul>
                      </div>
                      <div
                        className="rounded-lg p-3 border"
                        style={{ background: 'var(--bg-input)', borderColor: 'var(--border-subtle)' }}
                      >
                        <div className="flex items-center justify-between gap-2 mb-2">
                          <div className="flex items-center gap-2 text-[11px] font-mono uppercase text-(--text-muted)">
                            <MapPin size={14} /> Live map — GPS track
                          </div>
                          <Link to="/ops-manager/map" className="text-[11px] text-(--accent) font-semibold">
                            Open full map →
                          </Link>
                        </div>
                        <div
                          className="relative h-28 rounded-md overflow-hidden"
                          style={{ background: 'linear-gradient(135deg, #1a2332 0%, #0f1419 100%)' }}
                        >
                          <div
                            className="absolute h-0.5 bg-(--accent) opacity-60"
                            style={{
                              left: '12%',
                              top: '55%',
                              width: `${gpsProgress}%`,
                              maxWidth: '76%',
                              transition: 'width 1.2s ease',
                            }}
                          />
                          <div
                            className="absolute w-3 h-3 rounded-full border-2 border-white shadow-md transition-all duration-1000"
                            style={{
                              background: 'var(--accent)',
                              left: `${12 + gpsProgress * 0.76}%`,
                              top: '52%',
                            }}
                            title={activeExecution.unitId}
                          />
                          <span className="absolute left-2 bottom-2 text-[9px] font-mono text-white/70">
                            {rec.origin}
                          </span>
                          <span className="absolute right-2 bottom-2 text-[9px] font-mono text-white/70 text-right">
                            {activeExecution.destination}
                          </span>
                        </div>
                        <p className="text-[10px] text-(--text-muted) m-0 mt-2 font-mono">
                          {activeExecution.unitId} · {gpsProgress < 100 ? 'Position updating…' : 'Standby point reached'}
                        </p>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )
          })}
        </div>

        <div className="dispatcher-surface p-4 h-fit xl:sticky xl:top-4">
          <div className="flex items-center gap-2 mb-3">
            <History size={16} className="text-(--accent)" />
            <h2 className="text-sm font-bold m-0">Decision audit trail</h2>
          </div>
          <p className="text-[11px] text-(--text-muted) m-0 mb-4">
            Every approval, modification, and rejection is timestamped. Use for coverage-gap analysis and AI feedback review.
          </p>
          {auditLog.length === 0 ? (
            <p className="text-[12px] text-(--text-muted) m-0">No decisions recorded this session yet.</p>
          ) : (
            <ul className="m-0 p-0 list-none flex flex-col gap-3 max-h-[480px] overflow-y-auto">
              {auditLog.map((entry) => (
                <li
                  key={entry.id}
                  className="pb-3 border-b border-(--border-subtle) last:border-0 last:pb-0"
                >
                  <div className="flex flex-wrap items-center gap-1.5 mb-1">
                    <span className="font-mono text-[10px] text-(--text-muted)">{entry.id}</span>
                    <span className="font-mono text-[10px] text-(--accent)">{entry.recId}</span>
                    <StatusBadge
                      label={
                        entry.action === 'rejected'
                          ? 'REJECTED'
                          : entry.action === 'modified_approved'
                            ? 'MODIFIED'
                            : 'EXECUTED'
                      }
                      variant={
                        entry.action === 'rejected'
                          ? 'critical'
                          : entry.action === 'modified_approved'
                            ? 'handover'
                            : 'resolved'
                      }
                    />
                    {entry.aiLearning && (
                      <span className="text-[9px] px-1.5 py-0.5 rounded bg-(--accent-ghost) text-(--accent) font-semibold">
                        AI signal
                      </span>
                    )}
                  </div>
                  <div className="text-[11px] text-(--text-primary)">{entry.detail}</div>
                  <div className="text-[10px] font-mono text-(--text-muted) mt-1">{entry.timestamp}</div>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </>
  )
}

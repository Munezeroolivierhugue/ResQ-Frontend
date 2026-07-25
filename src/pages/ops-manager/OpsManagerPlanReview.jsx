import { useEffect, useMemo, useState } from 'react'
import { ClipboardList, CheckCircle2, XCircle, MapPin, Calendar, Eye, X, Truck } from 'lucide-react'
import AdminStatCard from '../../components/admin/AdminStatCard'
import OpsManagerDistrictLabel from '../../components/ops-manager/OpsManagerDistrictLabel'
import { listPlans, updatePlanStatus, listInstructions } from '../../api/planning'
import { getCurrentUser } from '../../utils/authSession'
import { useToastStore } from '../../store/toastStore'

function showToast(msg, variant = 'success') {
  useToastStore.getState().pushToast({ variant, title: variant === 'error' ? 'Error' : 'Plan Review', message: msg })
}

function formatDate(d) {
  if (!d) return '—'
  return new Date(d).toLocaleString('en-GB', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })
}

export default function OpsManagerPlanReview() {
  const [plans, setPlans] = useState([])
  const [loading, setLoading] = useState(true)
  const [actingId, setActingId] = useState(null)
  const [viewPlan, setViewPlan] = useState(null)
  const [viewInstructions, setViewInstructions] = useState([])
  const [viewLoading, setViewLoading] = useState(false)
  const districtId = getCurrentUser()?.district_id

  function openView(plan) {
    setViewPlan(plan)
    setViewLoading(true)
    listInstructions(plan.plan_id)
      .then(setViewInstructions)
      .catch(() => setViewInstructions([]))
      .finally(() => setViewLoading(false))
  }

  // SUBMITTED is the only status the Emergency Planner's submit flow ever
  // sets (PlannerDeployment.jsx calls updatePlanStatus(id, 'SUBMITTED')) —
  // that's what "awaiting review" means here.
  function refresh() {
    return listPlans(districtId || undefined, 'SUBMITTED')
      .then(setPlans)
      .catch(() => showToast('Failed to load deployment plans.', 'error'))
      .finally(() => setLoading(false))
  }

  // loading starts true (useState(true) above) so no need to set it again here.
  useEffect(() => { refresh() }, []) // eslint-disable-line react-hooks/exhaustive-deps

  const awaitingCount = plans.length
  const nearestDeadline = useMemo(() => {
    const dated = plans.filter((p) => p.active_from).sort((a, b) => new Date(a.active_from) - new Date(b.active_from))
    return dated[0]?.active_from ?? null
  }, [plans])

  async function handleDecision(planId, status) {
    setActingId(planId)
    try {
      await updatePlanStatus(planId, status)
      setPlans((prev) => prev.filter((p) => p.plan_id !== planId))
      showToast(status === 'APPROVED' ? 'Deployment plan approved.' : 'Deployment plan rejected.')
    } catch (err) {
      showToast(err?.response?.data?.message ?? 'Failed to update plan status.', 'error')
    } finally {
      setActingId(null)
    }
  }

  return (
    <div className="portal-page flex flex-col gap-5">
      <div>
        <h1 className="dispatcher-page-title m-0">Plan Review</h1>
        <OpsManagerDistrictLabel />
        <p className="dispatcher-page-subtitle mt-2">
          Deployment plans submitted by Emergency Planners for your district, awaiting approval.
        </p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-2 gap-3">
        <AdminStatCard icon={ClipboardList} label="Plans Awaiting Review" value={String(awaitingCount)} />
        <AdminStatCard icon={Calendar} label="Nearest Active-From Date" value={nearestDeadline ? formatDate(nearestDeadline) : '—'} />
      </div>

      <div className="dispatcher-surface table-scroll">
        <table className="w-full text-left border-collapse text-[12px] min-w-[860px]">
          <thead>
            <tr className="text-[12px] font-medium text-(--text-secondary) border-b border-(--border-subtle)">
              <th className="py-2 px-3 font-bold">Plan</th>
              <th className="py-2 px-3 font-bold text-center">District</th>
              <th className="py-2 px-3 font-bold text-center">Active Window</th>
              <th className="py-2 px-3 font-bold text-center">Projected Coverage</th>
              <th className="py-2 px-3 font-bold text-center">Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading && (
              <tr><td colSpan={5} className="py-6 text-center text-[13px] text-(--text-muted)">Loading plans…</td></tr>
            )}
            {!loading && plans.length === 0 && (
              <tr><td colSpan={5} className="py-6 text-center text-[13px] text-(--text-muted)">No deployment plans are currently awaiting review.</td></tr>
            )}
            {!loading && plans.map((p) => (
              <tr key={p.plan_id} className="border-b border-(--border-subtle) last:border-0 dispatcher-table-row">
                <td className="py-3 px-3">
                  <div className="font-medium text-[13px]">{p.title}</div>
                  <div className="font-mono text-[11px] text-(--text-muted)">ID: {p.plan_id?.slice(0, 8)}…</div>
                </td>
                <td className="py-3 px-3 text-center">
                  <span className="inline-flex items-center gap-1"><MapPin size={12} />{p.district_name ?? '—'}</span>
                </td>
                <td className="py-3 px-3 text-center" style={{ fontFamily: 'var(--font-mono)' }}>
                  {formatDate(p.active_from)} &rarr; {formatDate(p.active_until)}
                </td>
                <td className="py-3 px-3 text-center">{p.projected_coverage != null ? `${Math.round(p.projected_coverage)}%` : '—'}</td>
                <td className="py-3 px-3">
                  <div className="flex gap-2 justify-center">
                    <button
                      type="button"
                      className="dispatcher-btn-icon"
                      title="View plan details"
                      onClick={() => openView(p)}
                    >
                      <Eye size={16} />
                    </button>
                    <button
                      type="button"
                      className="dispatcher-btn-icon"
                      style={{ color: 'var(--status-low)' }}
                      title="Approve plan"
                      disabled={actingId === p.plan_id}
                      onClick={() => handleDecision(p.plan_id, 'APPROVED')}
                    >
                      <CheckCircle2 size={16} />
                    </button>
                    <button
                      type="button"
                      className="dispatcher-btn-icon"
                      style={{ color: 'var(--status-critical)' }}
                      title="Reject plan"
                      disabled={actingId === p.plan_id}
                      onClick={() => handleDecision(p.plan_id, 'REJECTED')}
                    >
                      <XCircle size={16} />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {viewPlan && (
        <div className="fixed inset-0 z-[10000] flex items-center justify-center p-4" role="dialog" aria-modal="true">
          <button
            type="button"
            aria-label="Close"
            onClick={() => setViewPlan(null)}
            className="absolute inset-0 border-none cursor-pointer"
            style={{ background: 'rgba(0,0,0,0.5)' }}
          />
          <div className="relative w-full max-w-lg max-h-[85vh] overflow-y-auto rounded-xl border border-(--border) bg-(--bg-surface) p-5">
            <button
              type="button"
              onClick={() => setViewPlan(null)}
              aria-label="Close"
              className="absolute top-4 right-4 border-none cursor-pointer text-(--text-secondary) hover:text-(--text-primary)"
              style={{ background: 'none' }}
            >
              <X size={18} />
            </button>
            <div className="dispatcher-eyebrow">Deployment plan</div>
            <h2 className="text-xl font-bold m-0 mt-1" style={{ fontFamily: 'var(--font-display)' }}>{viewPlan.title}</h2>
            <p className="text-[13px] text-(--text-secondary) m-0 mt-1">
              {viewPlan.district_name ?? '—'} · {formatDate(viewPlan.active_from)} &rarr; {formatDate(viewPlan.active_until)}
            </p>

            <div className="mt-4">
              <div className="text-[13px] font-bold mb-2 flex items-center gap-1.5"><Truck size={14} /> Units requested</div>
              {viewLoading ? (
                <p className="text-[12px] text-(--text-muted) m-0">Loading units…</p>
              ) : viewInstructions.length === 0 ? (
                <p className="text-[12px] text-(--text-muted) m-0">No units attached to this plan.</p>
              ) : (
                <div className="flex flex-col gap-2">
                  {viewInstructions.map((i) => (
                    <div key={i.instruction_id} className="rounded-lg p-3" style={{ background: 'var(--bg-elevated)' }}>
                      <div className="flex items-center justify-between gap-2">
                        <span className="font-mono font-bold text-[13px] text-(--accent)">{i.vehicle_plate ?? '—'}</span>
                        <span className="text-[11px] text-(--text-muted)">{i.vehicle_type ?? '—'} · from {i.vehicle_district_name ?? 'Unknown district'}</span>
                      </div>
                      <div className="text-[12px] text-(--text-secondary) mt-1">
                        {i.from_location || '—'} → {i.to_location || '—'}
                        {i.move_time && ` · at ${new Date(i.move_time).toLocaleString('en-GB', { dateStyle: 'short', timeStyle: 'short' })}`}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="flex gap-2 mt-5">
              <button
                type="button"
                className="dispatcher-btn-primary flex-1"
                disabled={actingId === viewPlan.plan_id}
                onClick={() => { handleDecision(viewPlan.plan_id, 'APPROVED'); setViewPlan(null) }}
              >
                Approve
              </button>
              <button
                type="button"
                className="dispatcher-btn-ghost flex-1"
                disabled={actingId === viewPlan.plan_id}
                onClick={() => { handleDecision(viewPlan.plan_id, 'REJECTED'); setViewPlan(null) }}
              >
                Reject
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

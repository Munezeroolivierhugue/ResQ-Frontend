import { useEffect, useMemo, useState } from 'react'
import { ClipboardList, CheckCircle2, XCircle, MapPin, Calendar } from 'lucide-react'
import AdminStatCard from '../../components/admin/AdminStatCard'
import OpsManagerDistrictLabel from '../../components/ops-manager/OpsManagerDistrictLabel'
import { listPlans, updatePlanStatus } from '../../api/planning'
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
  const districtId = getCurrentUser()?.district_id

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
    </div>
  )
}

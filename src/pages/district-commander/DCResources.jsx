import { useState, useEffect } from 'react'
import { ArrowRightLeft, ArrowUpRight, ArrowDownLeft } from 'lucide-react'
import StatusBadge from '../../components/dispatcher/StatusBadge'
import SectionTitle from '../../components/dispatcher/SectionTitle'
import DCPageHeader from '../../components/district-commander/DCPageHeader'
import { listMutualAidRequests } from '../../api/mutualAid'
import { getCurrentUser } from '../../utils/authSession'

function timeAgo(isoString) {
  const diffMin = Math.floor((Date.now() - new Date(isoString).getTime()) / 60000)
  if (diffMin < 1) return 'Just now'
  if (diffMin < 60) return `${diffMin}m ago`
  return `${Math.floor(diffMin / 60)}h ago`
}

function statusVariant(status) {
  if (!status) return 'handover'
  const s = status.toUpperCase()
  if (s === 'APPROVED' || s === 'FULFILLED') return 'resolved'
  if (s === 'PENDING') return 'handover'
  if (s === 'DECLINED') return 'info'
  if (s === 'RETURNED') return 'active'
  return 'critical'
}

export default function DCResources() {
  const districtId = getCurrentUser()?.district_id

  const [mutualAidActivity, setMutualAidActivity] = useState([])
  const [mutualAidLoading, setMutualAidLoading] = useState(true)

  useEffect(() => {
    if (!districtId) { Promise.resolve().then(() => setMutualAidLoading(false)); return }
    listMutualAidRequests()
      .then((all) => setMutualAidActivity(
        all.filter((r) =>
          (r.requesting_district_id === districtId || r.source_district_id === districtId)
          && r.status !== 'PENDING'
        ).sort((a, b) => new Date(b.resolved_at ?? b.created_at) - new Date(a.resolved_at ?? a.created_at))
      ))
      .catch(() => {})
      .finally(() => setMutualAidLoading(false))
  }, [districtId])

  return (
    <div className="portal-page">
      <DCPageHeader
        title="Resource Requests"
        subtitle="Unit reinforcement requests are handled by your district's Operations Manager — this page shows mutual aid activity for visibility only."
      />

      <div className="flex flex-col gap-6">
        <div className="dispatcher-surface p-5">
          <SectionTitle
            title="Mutual Aid Activity"
            badge={<StatusBadge label={String(mutualAidActivity.length)} variant="active" />}
          />
          <p className="text-[12px] text-(--text-secondary) m-0 mt-1 mb-3">
            Unit moves the Emergency Planner has decided that touch your district — sent to you, or sent from you to another district.
          </p>
          {mutualAidLoading ? (
            <p className="text-[12px] text-(--text-muted) m-0">Loading…</p>
          ) : mutualAidActivity.length === 0 ? (
            <p className="text-[12px] text-(--text-muted) m-0">No mutual aid activity yet.</p>
          ) : (
            mutualAidActivity.map((r) => {
              const outgoing = r.source_district_id === districtId
              const declined = r.status === 'DECLINED'
              const returned = r.status === 'RETURNED'
              return (
                <div key={r.request_id} className="flex flex-wrap items-center justify-between gap-3 py-3 border-b border-(--border-subtle) last:border-0">
                  <div className="flex items-start gap-2">
                    {declined || returned ? (
                      <ArrowRightLeft size={16} className="mt-0.5 shrink-0" style={{ color: 'var(--text-muted)' }} />
                    ) : outgoing ? (
                      <ArrowUpRight size={16} className="mt-0.5 shrink-0" style={{ color: 'var(--status-medium)' }} />
                    ) : (
                      <ArrowDownLeft size={16} className="mt-0.5 shrink-0" style={{ color: 'var(--status-low)' }} />
                    )}
                    <div>
                      <div className="text-[13px] font-semibold">
                        {declined
                          ? `${r.quantity}× ${r.unit_type} request declined — requested by ${r.requested_by_name ?? 'Ops Manager'}`
                          : returned
                            ? outgoing
                              ? `${r.vehicle_plate_number ?? r.unit_type} returned from ${r.requesting_district_name}`
                              : `${r.vehicle_plate_number ?? r.unit_type} returned to ${r.source_district_name ?? 'its home district'}`
                            : outgoing
                              ? `${r.vehicle_plate_number ?? r.unit_type} sent to ${r.requesting_district_name}`
                              : `${r.vehicle_plate_number ?? r.unit_type} received from ${r.source_district_name ?? 'another district'}`}
                      </div>
                      <div className="text-[12px] text-(--text-secondary)">
                        {declined ? (r.resolution_notes ?? 'No unit available') : (r.reason ?? 'No reason given')} · {timeAgo(r.resolved_at ?? r.created_at)}
                      </div>
                    </div>
                  </div>
                  <StatusBadge label={r.status} variant={statusVariant(r.status)} />
                </div>
              )
            })
          )}
        </div>
      </div>
    </div>
  )
}

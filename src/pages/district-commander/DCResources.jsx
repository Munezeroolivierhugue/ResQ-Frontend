import { useState, useEffect } from 'react'
import { Plus, Search, ArrowRightLeft, ArrowUpRight, ArrowDownLeft } from 'lucide-react'
import DCResourceRequestModal from '../../components/district-commander/DCResourceRequestModal'
import StatusBadge from '../../components/dispatcher/StatusBadge'
import SectionTitle from '../../components/dispatcher/SectionTitle'
import DCPageHeader from '../../components/district-commander/DCPageHeader'
import { getDistrictCommanderDistrict } from '../../utils/districtCommanderSession'
import { listResourceRequests, createResourceRequest } from '../../api/reporting'
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

function formatDate(iso) {
  if (!iso) return '—'
  return new Date(iso).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })
}

export default function DCResources() {
  const district = getDistrictCommanderDistrict()
  const districtId = getCurrentUser()?.district_id

  const [filter, setFilter] = useState('All')
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [requests, setRequests] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [submitting, setSubmitting] = useState(false)
  const [toast, setToast] = useState(null)

  // Mutual aid is now decided entirely by the Emergency Planner (AI-ranked
  // donor district, no DC approval gate) — this district's Commander is
  // just notified. This panel is a read-only activity log of moves that
  // touched this district, either as the requester or as the donor.
  const [mutualAidActivity, setMutualAidActivity] = useState([])
  const [mutualAidLoading, setMutualAidLoading] = useState(true)

  function showToast(msg) {
    setToast(msg)
    setTimeout(() => setToast(null), 2500)
  }

  function fetchRequests() {
    return listResourceRequests(districtId)
      .then(setRequests)
      .catch(() => setError('Failed to load resource requests'))
      .finally(() => setLoading(false))
  }

  useEffect(() => { fetchRequests() }, [])

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

  const history = requests.filter((r) => {
    const matchesFilter =
      filter === 'All' || (r.status ?? '').toUpperCase() === filter.toUpperCase()
    if (!matchesFilter) return false
    if (!searchQuery) return true
    const q = searchQuery.toLowerCase()
    return (
      (r.request_id ?? '').toLowerCase().includes(q) ||
      (r.resource_type ?? '').toLowerCase().includes(q) ||
      (r.reason ?? '').toLowerCase().includes(q)
    )
  })

  const handleRequestSubmit = async (data) => {
    setSubmitting(true)
    try {
      await createResourceRequest({
        district_id: districtId,
        resource_type: data.unitType,
        quantity: parseInt(data.qty, 10) || 1,
        urgency: data.urgency,
        reason: data.justification || data.urgency,
      })
      showToast('Resource request submitted successfully')
      setIsModalOpen(false)
      setLoading(true)
      setError(null)
      listResourceRequests(districtId)
        .then(setRequests)
        .catch(() => {})
        .finally(() => setLoading(false))
    } catch {
      showToast('Failed to submit request — please try again')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="portal-page">
      {toast && (
        <div className="fixed bottom-5 right-5 z-[9999] dispatcher-surface px-4 py-2.5 text-[13px] font-medium shadow-lg" style={{ borderLeft: '3px solid var(--accent)' }}>
          {toast}
        </div>
      )}

      <DCPageHeader
        title="Resource Requests"
        subtitle="Request additional units or resources from RNP Headquarters."
        action={
          <button
            className="dispatcher-btn-primary flex items-center gap-2"
            onClick={() => setIsModalOpen(true)}
          >
            <Plus size={16} />
            Resource Request
          </button>
        }
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

        <div className="dispatcher-surface p-5">
          <h2 className="text-[14px] font-bold m-0 mb-3">Request History</h2>
          <div className="flex flex-col sm:flex-row items-center gap-3 mb-4">
            <div className="relative flex-1 w-full">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-(--text-muted)" />
              <input
                type="text"
                placeholder="Search requests..."
                className="w-full h-10 bg-(--bg-surface) border border-(--border) rounded-lg pl-9 pr-3 text-[13px] text-(--text-primary) outline-none focus:border-(--accent) focus:shadow-[0_0_0_3px_var(--accent-ghost)] placeholder:text-(--text-muted) transition-all"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            <div className="flex items-center gap-3 shrink-0 w-full sm:w-auto">
              <select
                className="h-10 bg-(--bg-surface) border border-(--border) rounded-lg px-3 pr-8 text-[13px] text-(--text-primary) outline-none focus:border-(--accent) cursor-pointer appearance-none bg-no-repeat"
                style={{
                  backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' fill='none' stroke='currentColor' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpath d='m6 9 6-6H0z'/%3E%3C/svg%3E")`,
                  backgroundPosition: 'right 12px center',
                  backgroundSize: '10px',
                }}
                value={filter}
                onChange={(e) => setFilter(e.target.value)}
              >
                <option value="All">All Statuses</option>
                <option value="Pending">Pending</option>
                <option value="Approved">Approved</option>
                <option value="Declined">Declined</option>
              </select>
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-(--border) text-[11px] text-(--text-muted) uppercase tracking-wider">
                  <th className="pb-2 font-semibold">Request ID</th>
                  <th className="pb-2 font-semibold">Submitted</th>
                  <th className="pb-2 font-semibold">Resource Type</th>
                  <th className="pb-2 font-semibold">Qty</th>
                  <th className="pb-2 font-semibold">Status</th>
                  <th className="pb-2 font-semibold">Reason</th>
                </tr>
              </thead>
              <tbody>
                {loading && (
                  <tr><td colSpan={6} className="py-6 text-center text-[13px] text-(--text-muted)">Loading requests…</td></tr>
                )}
                {error && !loading && (
                  <tr><td colSpan={6} className="py-6 text-center text-[13px]" style={{ color: 'var(--status-critical)' }}>{error}</td></tr>
                )}
                {!loading && !error && history.length === 0 && (
                  <tr><td colSpan={6} className="py-6 text-center text-[13px] text-(--text-muted)">No requests found.</td></tr>
                )}
                {!loading && !error && history.map((req) => (
                  <tr key={req.request_id} className="border-b border-(--border-subtle) last:border-0 hover:bg-(--bg-elevated) transition-colors">
                    <td className="py-3 font-mono font-bold text-(--accent) text-[12px] pr-4">{req.request_id?.slice(0, 8) ?? '—'}</td>
                    <td className="py-3 text-[12px] text-(--text-secondary) pr-4 whitespace-nowrap">{formatDate(req.created_at)}</td>
                    <td className="py-3 text-[13px] text-(--text-primary) pr-4">{req.resource_type ?? '—'}</td>
                    <td className="py-3 text-[13px] text-(--text-primary) pr-4">{req.quantity ?? '—'}</td>
                    <td className="py-3 pr-4">
                      <StatusBadge label={req.status ?? 'PENDING'} variant={statusVariant(req.status)} />
                    </td>
                    <td className="py-3 text-[12px] text-(--text-secondary)">{req.reason ?? '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <DCResourceRequestModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSubmit={handleRequestSubmit}
        district={district}
        submitting={submitting}
      />
    </div>
  )
}

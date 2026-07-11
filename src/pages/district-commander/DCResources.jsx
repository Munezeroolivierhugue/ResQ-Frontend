import { useState, useEffect } from 'react'
import { Plus, Search } from 'lucide-react'
import DCResourceRequestModal from '../../components/district-commander/DCResourceRequestModal'
import StatusBadge from '../../components/dispatcher/StatusBadge'
import SectionTitle from '../../components/dispatcher/SectionTitle'
import DCPageHeader from '../../components/district-commander/DCPageHeader'
import { getDistrictCommanderDistrict } from '../../utils/districtCommanderSession'
import { listResourceRequests, createResourceRequest } from '../../api/reporting'

function statusVariant(status) {
  if (!status) return 'handover'
  const s = status.toUpperCase()
  if (s === 'APPROVED') return 'resolved'
  if (s === 'PENDING') return 'handover'
  return 'critical'
}

function formatDate(iso) {
  if (!iso) return '—'
  return new Date(iso).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })
}

export default function DCResources() {
  const district = getDistrictCommanderDistrict()
  const districtId = sessionStorage.getItem('resq-district-id') || undefined

  const [filter, setFilter] = useState('All')
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [requests, setRequests] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [submitting, setSubmitting] = useState(false)
  const [toast, setToast] = useState(null)

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

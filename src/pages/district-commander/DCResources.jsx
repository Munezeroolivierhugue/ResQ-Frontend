import { useState } from 'react'
import { Plus, Search } from 'lucide-react'
import DCResourceRequestModal from '../../components/district-commander/DCResourceRequestModal'
import StatusBadge from '../../components/dispatcher/StatusBadge'
import SectionTitle from '../../components/dispatcher/SectionTitle'
import DCPageHeader from '../../components/district-commander/DCPageHeader'
import { getDistrictCommanderDistrict } from '../../utils/districtCommanderSession'
import { DC_RESOURCE_REQUESTS, getRequestBorderColor } from '../../data/mockDistrictCommanderData'

const FILTERS = ['All', 'Pending', 'Approved', 'Declined']

function statusVariant(status) {
  if (status === 'APPROVED') return 'resolved'
  if (status === 'PENDING') return 'handover'
  return 'critical'
}

export default function DCResources() {
  const district = getDistrictCommanderDistrict()
  const [filter, setFilter] = useState('All')
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')

  const history = DC_RESOURCE_REQUESTS.filter((r) => {
    const matchesFilter = filter === 'All' || r.status === filter.toUpperCase()
    if (!matchesFilter) return false
    
    if (!searchQuery) return true
    const q = searchQuery.toLowerCase()
    return (
      r.id.toLowerCase().includes(q) ||
      r.unitType.toLowerCase().includes(q) ||
      r.detail.toLowerCase().includes(q)
    )
  })

  const handleRequestSubmit = (data) => {
    console.log('HQ resource request submitted:', data)
  }

  return (
    <div className="portal-page">
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
                  backgroundSize: '10px'
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
                  <th className="pb-2 font-semibold">Unit Type</th>
                  <th className="pb-2 font-semibold">Qty</th>
                  <th className="pb-2 font-semibold">Status</th>
                  <th className="pb-2 font-semibold">Details</th>
                </tr>
              </thead>
              <tbody>
                {history.map((req) => (
                  <tr key={req.id} className="border-b border-(--border-subtle) last:border-0 hover:bg-(--bg-elevated) transition-colors">
                    <td className="py-3 font-mono font-bold text-(--accent) text-[12px] pr-4">{req.id}</td>
                    <td className="py-3 text-[12px] text-(--text-secondary) pr-4 whitespace-nowrap">{req.submitted}</td>
                    <td className="py-3 text-[13px] text-(--text-primary) pr-4">{req.unitType}</td>
                    <td className="py-3 text-[13px] text-(--text-primary) pr-4">{req.qty}</td>
                    <td className="py-3 pr-4"><StatusBadge label={req.status} variant={statusVariant(req.status)} /></td>
                    <td className="py-3 text-[12px] text-(--text-secondary)">{req.detail}</td>
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
      />
    </div>
  )
}

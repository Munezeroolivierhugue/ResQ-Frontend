import { useState } from 'react'
import { Send, Info } from 'lucide-react'
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
  const [form, setForm] = useState({
    unitType: 'Police Van',
    qty: 2,
    urgency: 'HIGH — Coverage below safe threshold',
    justification: '',
  })
  const [submitted, setSubmitted] = useState(false)

  const history = DC_RESOURCE_REQUESTS.filter((r) => {
    if (filter === 'All') return true
    return r.status === filter.toUpperCase()
  })

  const handleSubmit = (e) => {
    e.preventDefault()
    setSubmitted(true)
    console.log('HQ resource request:', { district, ...form })
  }

  return (
    <div className="p-6">
      <DCPageHeader
        title="Resource Requests"
        subtitle="Request additional units or resources from RNP Headquarters."
      />

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div className="lg:col-span-5 dispatcher-surface p-5">
          <SectionTitle title="Submit New Request" className="mb-4" />
          <form className="flex flex-col gap-3" onSubmit={handleSubmit}>
            <label className="dispatcher-field">
              <span className="field-label">Unit Type Needed</span>
              <select
                className="dispatcher-input dispatcher-select"
                value={form.unitType}
                onChange={(e) => setForm((f) => ({ ...f, unitType: e.target.value }))}
              >
                {['Police Van', 'Motorcycle', 'Ambulance', 'Fire Unit', 'Command Vehicle', 'Other'].map((t) => (
                  <option key={t}>{t}</option>
                ))}
              </select>
            </label>
            <label className="dispatcher-field">
              <span className="field-label">Quantity</span>
              <input
                type="number"
                min={1}
                max={20}
                className="dispatcher-input dispatcher-text-input"
                placeholder="Number of units needed"
                value={form.qty}
                onChange={(e) => setForm((f) => ({ ...f, qty: Number(e.target.value) }))}
              />
            </label>
            <label className="dispatcher-field">
              <span className="field-label">Urgency Level</span>
              <select
                className="dispatcher-input dispatcher-select"
                value={form.urgency}
                onChange={(e) => setForm((f) => ({ ...f, urgency: e.target.value }))}
              >
                <option>CRITICAL — Immediate operational gap</option>
                <option>HIGH — Coverage below safe threshold</option>
                <option>MEDIUM — Capacity improvement needed</option>
                <option>LOW — Long-term planning request</option>
              </select>
            </label>
            <label className="dispatcher-field">
              <span className="field-label">Justification</span>
              <textarea
                className="dispatcher-input dispatcher-textarea"
                style={{ minHeight: '100px' }}
                placeholder="Describe the operational need. System data will be attached automatically."
                value={form.justification}
                onChange={(e) => setForm((f) => ({ ...f, justification: e.target.value }))}
              />
            </label>
            <div
              className="flex gap-2 text-[12px] rounded-lg p-3"
              style={{
                background: 'var(--accent-ghost)',
                border: '1px solid var(--accent)',
                color: 'var(--text-secondary)',
              }}
            >
              <Info size={14} className="shrink-0 text-(--accent)" />
              <span>
                The following will be automatically attached: Current coverage score (77%), Active unit count (18),
                Avg response time (7.4m), Last 30 days incident volume (312)
              </span>
            </div>
            <button type="submit" className="dispatcher-btn-primary w-full inline-flex items-center justify-center gap-2">
              <Send size={16} />
              Submit Request to Headquarters
            </button>
            {submitted && (
              <p className="text-[12px] text-(--status-low) m-0">Request queued for HQ review (demo).</p>
            )}
          </form>
        </div>

        <div className="lg:col-span-7 dispatcher-surface p-5">
          <h2 className="text-[14px] font-bold m-0 mb-3">Request History</h2>
          <div className="flex flex-wrap gap-2 mb-4">
            {FILTERS.map((f) => (
              <button
                key={f}
                type="button"
                className="text-[11px] font-semibold px-3 py-1.5 rounded-full border cursor-pointer"
                style={{
                  background: filter === f ? 'var(--accent-ghost)' : 'var(--bg-elevated)',
                  borderColor: filter === f ? 'var(--accent)' : 'var(--border)',
                  color: filter === f ? 'var(--accent)' : 'var(--text-secondary)',
                }}
                onClick={() => setFilter(f)}
              >
                {f}
              </button>
            ))}
          </div>
          <div className="flex flex-col gap-3">
            {history.map((req) => (
              <div
                key={req.id}
                className="dispatcher-surface p-4"
                style={{ borderLeft: `4px solid ${getRequestBorderColor(req.status)}` }}
              >
                <div className="flex flex-wrap items-center gap-2 mb-1">
                  <span className="font-mono font-bold text-(--accent)">{req.id}</span>
                  <StatusBadge label={req.status} variant={statusVariant(req.status)} />
                  <span className="text-[11px] text-(--text-muted) ml-auto">{req.submitted}</span>
                </div>
                <div className="text-[13px] text-(--text-primary)">
                  {req.qty}× {req.unitType}
                </div>
                <p className="text-[12px] text-(--text-secondary) m-0 mt-1">{req.detail}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

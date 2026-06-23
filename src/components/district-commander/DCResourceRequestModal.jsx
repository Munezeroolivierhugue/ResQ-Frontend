import { useState } from 'react'
import { X, Send, Info } from 'lucide-react'

export default function DCResourceRequestModal({ isOpen, onClose, onSubmit, district }) {
  const [form, setForm] = useState({
    unitType: 'Police Van',
    qty: 2,
    urgency: 'HIGH — Coverage below safe threshold',
    justification: '',
  })
  const [submitted, setSubmitted] = useState(false)

  if (!isOpen) return null

  const handleSubmit = (e) => {
    e.preventDefault()
    setSubmitted(true)
    onSubmit({ district, ...form })
    setTimeout(() => {
      setSubmitted(false)
      onClose()
    }, 1500)
  }

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="bg-(--bg-surface) border border-(--border) rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        
        {/* Header */}
        <div className="px-5 py-4 border-b border-(--border-subtle) flex items-center justify-between shrink-0 bg-(--bg-elevated)">
          <div className="flex items-center gap-3 text-(--accent)">
            <h2 className="text-[14px] font-bold uppercase tracking-wider m-0" style={{ fontFamily: 'var(--font-display)' }}>
              Submit New Request
            </h2>
          </div>
          <button
            type="button"
            className="w-8 h-8 rounded-full border-none bg-transparent hover:bg-(--bg-input) flex items-center justify-center cursor-pointer transition-colors text-(--text-muted) hover:text-(--text-primary)"
            onClick={onClose}
          >
            <X size={18} />
          </button>
        </div>

        {/* Body */}
        <div className="p-5 flex-1 overflow-y-auto">
          <form id="resource-request-form" className="flex flex-col gap-4" onSubmit={handleSubmit}>
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
            {submitted && (
              <p className="text-[12px] text-(--status-low) m-0 text-center font-bold">Request queued for HQ review (demo).</p>
            )}
          </form>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-(--border-subtle) bg-(--bg-elevated) shrink-0">
          <button
            form="resource-request-form"
            type="submit"
            className="w-full py-3 rounded-xl border-none flex items-center justify-center gap-2 cursor-pointer transition-transform active:scale-[0.98] font-bold uppercase tracking-wider text-[12px]"
            style={{ background: 'var(--accent)', color: 'black', fontFamily: 'var(--font-display)' }}
            disabled={submitted}
          >
            <Send size={16} />
            Submit Request to Headquarters
          </button>
        </div>

      </div>
    </div>
  )
}

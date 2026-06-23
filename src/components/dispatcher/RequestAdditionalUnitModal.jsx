import { useState } from 'react'
import { X, Send, Plus } from 'lucide-react'

export default function RequestAdditionalUnitModal({ isOpen, onClose, onSubmit }) {
  const [form, setForm] = useState({
    unitType: 'Ambulance',
    urgency: 'Immediate',
    reason: '',
  })

  if (!isOpen) return null

  const handleAsk = () => {
    onSubmit({
      ...form,
      timestamp: new Date().toISOString(),
    })
    onClose()
  }

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="bg-(--bg-surface) border border-(--border) rounded-2xl w-full max-w-md shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        
        {/* Header */}
        <div className="px-5 py-4 border-b border-(--border-subtle) flex items-center justify-between shrink-0 bg-(--bg-elevated)">
          <div className="flex items-center gap-3 text-(--accent)">
            <Plus size={20} />
            <h2 className="text-[14px] font-bold uppercase tracking-wider m-0" style={{ fontFamily: 'var(--font-display)' }}>
              Request Additional Unit
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
        <div className="p-5 flex-1 overflow-y-auto space-y-6">
          
          <div>
            <label className="block text-[11px] font-bold uppercase tracking-wider text-(--text-secondary) mb-2">Unit Type Needed</label>
            <select
              className="w-full h-10 px-3 rounded-lg border border-(--border) bg-(--bg-input) text-[13px] text-(--text-primary) outline-none focus:border-(--accent)"
              value={form.unitType}
              onChange={(e) => setForm(f => ({ ...f, unitType: e.target.value }))}
            >
              <option>Ambulance</option>
              <option>Fire Engine</option>
              <option>Heavy Rescue</option>
              <option>Police Unit</option>
            </select>
          </div>

          <div>
            <label className="block text-[11px] font-bold uppercase tracking-wider text-(--text-secondary) mb-2">Urgency Level</label>
            <div className="flex gap-2">
              <button
                type="button"
                className={`flex-1 py-2 rounded-lg border text-[12px] font-bold uppercase cursor-pointer transition-colors ${form.urgency === 'Standard' ? 'bg-(--accent) border-(--accent) text-black' : 'bg-transparent border-(--border) text-(--text-primary) hover:border-(--accent)'}`}
                onClick={() => setForm(f => ({ ...f, urgency: 'Standard' }))}
              >
                Standard
              </button>
              <button
                type="button"
                className={`flex-1 py-2 rounded-lg border text-[12px] font-bold uppercase cursor-pointer transition-colors ${form.urgency === 'Immediate' ? 'bg-(--status-critical) border-(--status-critical) text-white' : 'bg-transparent border-(--border) text-(--text-primary) hover:border-(--status-critical)'}`}
                onClick={() => setForm(f => ({ ...f, urgency: 'Immediate' }))}
              >
                Immediate
              </button>
            </div>
          </div>

          <div>
            <label className="block text-[11px] font-bold uppercase tracking-wider text-(--text-secondary) mb-2">Reason</label>
            <textarea
              className="w-full min-h-[80px] p-3 rounded-lg border border-(--border) bg-(--bg-input) text-[13px] text-(--text-primary) outline-none focus:border-(--accent) resize-none"
              placeholder="Why is an additional unit required?"
              value={form.reason}
              onChange={(e) => setForm(f => ({ ...f, reason: e.target.value }))}
            />
          </div>
          
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-(--border-subtle) bg-(--bg-elevated) shrink-0">
          <button
            type="button"
            className="w-full py-3 rounded-xl border-none flex items-center justify-center gap-2 cursor-pointer transition-transform active:scale-[0.98] font-bold uppercase tracking-wider text-[12px]"
            style={{ background: 'var(--accent)', color: 'black', fontFamily: 'var(--font-display)' }}
            onClick={handleAsk}
          >
            <Send size={16} />
            Submit Request
          </button>
        </div>

      </div>
    </div>
  )
}

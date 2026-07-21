import { useState } from 'react'
import { X, Radio, AlertTriangle } from 'lucide-react'

const UNIT_TYPES = [
  { value: 'AMBULANCE', label: 'Ambulance (ALS/BLS)' },
  { value: 'FIRE_TRUCK', label: 'Fire Engine' },
  { value: 'POLICE_CAR', label: 'Police Unit' },
  { value: 'DISASTER_UNIT', label: 'Heavy Rescue' },
]

// Matches the real CreateMutualAidRequest contract (api/mutualAid.js) —
// this modal previously collected a fictional multi-resource counter +
// "radius"/"priority" the backend has no field for at all, and never called
// the real API in the first place (see AvailableUnitsModal.jsx's
// handleAskMutualAid, which only fired a local notification).
export default function MutualAidRequestModal({ isOpen, onClose, onAsk, submitting, error }) {
  const [unitType, setUnitType] = useState('AMBULANCE')
  const [quantity, setQuantity] = useState(1)
  const [duration, setDuration] = useState(4)
  const [reason, setReason] = useState('')

  if (!isOpen) return null

  const handleAsk = () => {
    if (!reason.trim()) return
    onAsk({ unitType, quantity, duration, reason: reason.trim() })
  }

  return (
    <div className="fixed inset-0 z-[99999] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="bg-(--bg-surface) border border-(--border) rounded-2xl w-full max-w-md shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">

        <div className="px-5 py-4 border-b border-(--border-subtle) flex items-center justify-between shrink-0 bg-(--bg-elevated)">
          <div className="flex items-center gap-3 text-(--status-warning)">
            <AlertTriangle size={20} />
            <h2 className="text-[14px] font-bold uppercase tracking-wider m-0" style={{ fontFamily: 'var(--font-display)' }}>
              Request Mutual Aid
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

        <div className="p-5 flex-1 overflow-y-auto space-y-5">
          <div>
            <label className="block text-[11px] font-bold uppercase tracking-wider text-(--text-secondary) mb-2">Unit Type</label>
            <select
              className="dispatcher-input dispatcher-select w-full"
              value={unitType}
              onChange={(e) => setUnitType(e.target.value)}
            >
              {UNIT_TYPES.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
            </select>
          </div>

          <div className="flex gap-3">
            <div className="flex-1">
              <label className="block text-[11px] font-bold uppercase tracking-wider text-(--text-secondary) mb-2">Quantity</label>
              <input
                type="number"
                min={1}
                max={10}
                className="dispatcher-input dispatcher-text-input w-full"
                value={quantity}
                onChange={(e) => setQuantity(Math.max(1, parseInt(e.target.value, 10) || 1))}
              />
            </div>
            <div className="flex-1">
              <label className="block text-[11px] font-bold uppercase tracking-wider text-(--text-secondary) mb-2">Duration (hrs)</label>
              <input
                type="number"
                min={1}
                max={48}
                className="dispatcher-input dispatcher-text-input w-full"
                value={duration}
                onChange={(e) => setDuration(Math.max(1, parseInt(e.target.value, 10) || 1))}
              />
            </div>
          </div>

          <div>
            <label className="block text-[11px] font-bold uppercase tracking-wider text-(--text-secondary) mb-2">
              Reason <span className="text-(--status-critical)">*</span>
            </label>
            <textarea
              className="dispatcher-input dispatcher-textarea w-full"
              rows={3}
              placeholder="Why is mutual aid needed? This is what the Emergency Planner and receiving district will see."
              value={reason}
              onChange={(e) => setReason(e.target.value)}
            />
          </div>
        </div>

        <div className="p-4 border-t border-(--border-subtle) bg-(--bg-elevated) shrink-0">
          {error && (
            <p className="text-[12px] m-0 mb-3" style={{ color: 'var(--status-critical)' }}>{error}</p>
          )}
          <button
            type="button"
            className="w-full py-3 rounded-xl border-none flex items-center justify-center gap-2 cursor-pointer transition-transform active:scale-[0.98] font-bold uppercase tracking-wider text-[12px] disabled:opacity-50"
            style={{ background: 'var(--status-critical)', color: '#fff', fontFamily: 'var(--font-display)' }}
            onClick={handleAsk}
            disabled={!reason.trim() || submitting}
          >
            <Radio size={16} />
            {submitting ? 'Sending…' : 'Ask for Mutual Aid'}
          </button>
        </div>

      </div>
    </div>
  )
}

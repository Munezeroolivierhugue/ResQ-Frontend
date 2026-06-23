import { useState } from 'react'
import { X, Radio, AlertTriangle, Send } from 'lucide-react'

export default function MutualAidRequestModal({ isOpen, onClose, onAsk }) {
  const [radius, setRadius] = useState(10)
  const [resources, setResources] = useState({
    ambulance: 0,
    fireTruck: 0,
    police: 0,
    heavyRescue: 0
  })
  const [priority, setPriority] = useState('standard')

  if (!isOpen) return null

  const handleIncrement = (type) => setResources((prev) => ({ ...prev, [type]: prev[type] + 1 }))
  const handleDecrement = (type) => setResources((prev) => ({ ...prev, [type]: Math.max(0, prev[type] - 1) }))

  const handleAsk = () => {
    const payload = {
      radius,
      resources,
      priority,
      timestamp: new Date().toISOString(),
    }
    onAsk(payload)
    onClose()
  }

  const resourceLabels = {
    ambulance: 'Ambulance (ALS/BLS)',
    fireTruck: 'Fire Engine',
    police: 'Police Unit',
    heavyRescue: 'Heavy Rescue'
  }

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="bg-(--bg-surface) border border-(--border) rounded-2xl w-full max-w-md shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        
        {/* Header */}
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

        {/* Body */}
        <div className="p-5 flex-1 overflow-y-auto space-y-6">
          
          {/* Priority */}
          <div>
            <label className="block text-[11px] font-bold uppercase tracking-wider text-(--text-secondary) mb-2">Priority Level</label>
            <div className="flex gap-2">
              <button
                type="button"
                className={`flex-1 py-2 rounded-lg border text-[12px] font-bold uppercase cursor-pointer transition-colors ${priority === 'standard' ? 'bg-(--accent) border-(--accent) text-black' : 'bg-transparent border-(--border) text-(--text-primary) hover:border-(--accent)'}`}
                onClick={() => setPriority('standard')}
              >
                Standard
              </button>
              <button
                type="button"
                className={`flex-1 py-2 rounded-lg border text-[12px] font-bold uppercase cursor-pointer transition-colors ${priority === 'expedited' ? 'bg-(--status-critical) border-(--status-critical) text-white' : 'bg-transparent border-(--border) text-(--text-primary) hover:border-(--status-critical)'}`}
                onClick={() => setPriority('expedited')}
              >
                Expedited
              </button>
            </div>
          </div>

          {/* Broadcast Radius */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-[11px] font-bold uppercase tracking-wider text-(--text-secondary)">Broadcast Radius</label>
              <span className="text-[12px] font-bold text-(--accent)">{radius} km</span>
            </div>
            <input
              type="range"
              min="5"
              max="100"
              step="5"
              value={radius}
              onChange={(e) => setRadius(parseInt(e.target.value, 10))}
              className="w-full accent-(--accent) cursor-pointer"
            />
            <div className="flex justify-between text-[10px] text-(--text-muted) mt-1 font-mono">
              <span>5 km</span>
              <span>100 km</span>
            </div>
          </div>

          {/* Resources Needed */}
          <div>
            <label className="block text-[11px] font-bold uppercase tracking-wider text-(--text-secondary) mb-3">Resources Needed</label>
            <div className="space-y-2">
              {Object.keys(resources).map((key) => (
                <div key={key} className="flex items-center justify-between p-3 rounded-lg border border-(--border-subtle) bg-(--bg-input)">
                  <span className="text-[13px] font-medium text-(--text-primary)">{resourceLabels[key]}</span>
                  <div className="flex items-center gap-3">
                    <button
                      type="button"
                      className="w-7 h-7 rounded-md border border-(--border) bg-(--bg-surface) text-(--text-primary) flex items-center justify-center cursor-pointer hover:border-(--accent) hover:text-(--accent) transition-colors disabled:opacity-50"
                      onClick={() => handleDecrement(key)}
                      disabled={resources[key] === 0}
                    >
                      -
                    </button>
                    <span className="text-[14px] font-bold w-4 text-center" style={{ fontFamily: 'var(--font-mono)' }}>{resources[key]}</span>
                    <button
                      type="button"
                      className="w-7 h-7 rounded-md border border-(--border) bg-(--bg-surface) text-(--text-primary) flex items-center justify-center cursor-pointer hover:border-(--accent) hover:text-(--accent) transition-colors"
                      onClick={() => handleIncrement(key)}
                    >
                      +
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
          
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-(--border-subtle) bg-(--bg-elevated) shrink-0">
          <button
            type="button"
            className="w-full py-3 rounded-xl border-none flex items-center justify-center gap-2 cursor-pointer transition-transform active:scale-[0.98] font-bold uppercase tracking-wider text-[12px]"
            style={{ background: 'var(--status-critical)', color: '#fff', fontFamily: 'var(--font-display)' }}
            onClick={handleAsk}
          >
            <Radio size={16} />
            Ask for Mutual Aid
          </button>
        </div>

      </div>
    </div>
  )
}

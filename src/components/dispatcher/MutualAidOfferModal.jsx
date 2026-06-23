import { useState } from 'react'
import { X, ShieldCheck, Ambulance, Truck, Check } from 'lucide-react'

// Mock local units for the responding dispatcher
const MOCK_LOCAL_UNITS = [
  { id: 'AMB-B1', type: 'Ambulance', status: 'available' },
  { id: 'AMB-B2', type: 'Ambulance', status: 'available' },
  { id: 'FTK-B1', type: 'Fire Truck', status: 'available' },
  { id: 'POL-B3', type: 'Police', status: 'available' }
]

function UnitTypeIcon({ type }) {
  const p = { size: 16, strokeWidth: 1.8 }
  if (type === 'Ambulance') return <Ambulance {...p} />
  if (type === 'Fire Truck') return <Truck {...p} />
  if (type === 'Police') return <ShieldCheck {...p} />
  return <Truck {...p} />
}

export default function MutualAidOfferModal({ isOpen, requestDetails, onClose, onPledge }) {
  const [selectedUnits, setSelectedUnits] = useState([])

  if (!isOpen || !requestDetails) return null

  const toggleUnit = (unitId) => {
    setSelectedUnits(prev => 
      prev.includes(unitId) ? prev.filter(id => id !== unitId) : [...prev, unitId]
    )
  }

  const handlePledge = () => {
    onPledge(selectedUnits)
    onClose()
  }

  return (
    <div className="fixed inset-0 z-[99999] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="bg-(--bg-surface) border border-(--border) rounded-2xl w-full max-w-md shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        
        {/* Header */}
        <div className="px-5 py-4 border-b border-(--border-subtle) flex items-center justify-between shrink-0 bg-(--bg-elevated)">
          <div className="flex items-center gap-3 text-(--status-critical)">
            <ShieldCheck size={20} />
            <h2 className="text-[14px] font-bold uppercase tracking-wider m-0" style={{ fontFamily: 'var(--font-display)' }}>
              Respond to Mutual Aid
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
          
          {/* Request Info */}
          <div className="p-4 rounded-xl border border-(--status-critical) bg-[color-mix(in_srgb,var(--status-critical)_10%,transparent)]">
            <h3 className="text-[11px] font-bold uppercase tracking-wider text-(--status-critical) mb-2 m-0">Incoming Request</h3>
            <p className="text-[13px] text-(--text-primary) m-0 font-medium">
              {requestDetails.title || 'Emergency Assistance Required'}
            </p>
            <div className="mt-3 text-[12px] text-(--text-secondary) space-y-1">
              <div className="flex justify-between">
                <span>Distance:</span>
                <span className="font-bold font-mono">14.2 km</span>
              </div>
              <div className="flex justify-between">
                <span>Priority:</span>
                <span className="font-bold uppercase text-(--status-critical)">Expedited</span>
              </div>
              <div className="flex justify-between">
                <span>Requested Resources:</span>
                <span className="font-bold">2x Ambulance, 1x Fire Engine</span>
              </div>
            </div>
          </div>

          {/* Unit Selection */}
          <div>
            <label className="block text-[11px] font-bold uppercase tracking-wider text-(--text-secondary) mb-3">Available Local Units</label>
            <div className="space-y-2">
              {MOCK_LOCAL_UNITS.map((unit) => {
                const isSelected = selectedUnits.includes(unit.id)
                return (
                  <div 
                    key={unit.id}
                    className={`flex items-center justify-between p-3 rounded-lg border cursor-pointer transition-colors ${isSelected ? 'border-(--accent) bg-[color-mix(in_srgb,var(--accent)_10%,transparent)]' : 'border-(--border-subtle) bg-(--bg-input) hover:border-(--border)'}`}
                    onClick={() => toggleUnit(unit.id)}
                  >
                    <div className="flex items-center gap-3">
                      <div className={`w-8 h-8 rounded-md flex items-center justify-center ${isSelected ? 'text-(--accent)' : 'text-(--text-muted)'}`}>
                        <UnitTypeIcon type={unit.type} />
                      </div>
                      <div>
                        <div className="text-[13px] font-bold font-mono text-(--text-primary)">{unit.id}</div>
                        <div className="text-[11px] text-(--text-secondary)">{unit.type}</div>
                      </div>
                    </div>
                    <div className={`w-5 h-5 rounded-full border flex items-center justify-center ${isSelected ? 'bg-(--accent) border-(--accent) text-black' : 'border-(--border-subtle) bg-transparent'}`}>
                      {isSelected && <Check size={12} strokeWidth={3} />}
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
          
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-(--border-subtle) bg-(--bg-elevated) shrink-0 flex gap-3">
          <button
            type="button"
            className="flex-1 py-3 rounded-xl border border-(--border) bg-transparent text-(--text-primary) flex items-center justify-center cursor-pointer transition-colors hover:bg-(--bg-input) font-bold uppercase tracking-wider text-[12px]"
            style={{ fontFamily: 'var(--font-display)' }}
            onClick={onClose}
          >
            Decline
          </button>
          <button
            type="button"
            className="flex-[2] py-3 rounded-xl border-none flex items-center justify-center gap-2 cursor-pointer transition-transform active:scale-[0.98] font-bold uppercase tracking-wider text-[12px] disabled:opacity-50"
            style={{ background: 'var(--accent)', color: '#000', fontFamily: 'var(--font-display)' }}
            onClick={handlePledge}
            disabled={selectedUnits.length === 0}
          >
            <ShieldCheck size={16} />
            Pledge {selectedUnits.length} Units
          </button>
        </div>

      </div>
    </div>
  )
}

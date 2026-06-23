import { useState } from 'react'
import { X, ShieldCheck, Ambulance, Truck, AlertTriangle } from 'lucide-react'
import MutualAidRequestModal from './MutualAidRequestModal'
import RequestAdditionalUnitModal from './RequestAdditionalUnitModal'
import { useNotificationsStore } from '../../store/notificationsStore'

const allUnits = [
  { unit: 'POL-08', type: 'Police Unit', location: 'Gisenyi', eta: '18 min', score: 71, icon: ShieldCheck, color: '#D4A017' },
  { unit: 'AMB-11', type: 'Ambulance', location: 'Nyagatare', eta: '24 min', score: 58, icon: Ambulance, color: '#2196C8' },
  { unit: 'FTK-02', type: 'Fire Truck', location: 'Nyarugenge', eta: '28 min', score: 45, icon: Truck, color: '#E8354A' },
  { unit: 'POL-15', type: 'Police Unit', location: 'Kicukiro', eta: '32 min', score: 40, icon: ShieldCheck, color: '#D4A017' },
]

export default function AvailableUnitsModal({ isOpen, onClose }) {
  const [isMutualAidModalOpen, setIsMutualAidModalOpen] = useState(false)
  const [isAdditionalUnitModalOpen, setIsAdditionalUnitModalOpen] = useState(false)
  const addNotification = useNotificationsStore((state) => state.addNotification)

  if (!isOpen && !isMutualAidModalOpen && !isAdditionalUnitModalOpen) return null

  const handleAskMutualAid = (payload) => {
    if (addNotification) {
      addNotification({
        id: `ma-esc-${Date.now()}`,
        type: 'mutual_aid_escalation',
        title: `ESCALATION: Mutual Aid requested`,
        time: 'Just now',
        read: false,
        href: '#ops-manager-escalation',
        details: payload
      })
    }
  }

  const handleAskAdditionalUnit = (payload) => {
    if (addNotification) {
      addNotification({
        id: `add-unit-${Date.now()}`,
        type: 'unit_request',
        title: `REQUEST: Additional ${payload.unitType}`,
        time: 'Just now',
        read: false,
        href: '#active-incident',
        details: payload
      })
    }
  }

  return (
    <>
      {isOpen && (
        <div className="fixed inset-0 z-[99999] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-(--bg-surface) border border-(--border) rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
            <div className="px-5 py-4 border-b border-(--border-subtle) flex items-center justify-between shrink-0 bg-(--bg-elevated)">
              <h2 className="text-[14px] font-bold uppercase tracking-wider m-0" style={{ fontFamily: 'var(--font-display)' }}>
                All Available Units
              </h2>
              <button
                type="button"
                className="w-8 h-8 rounded-full border-none bg-transparent hover:bg-(--bg-input) flex items-center justify-center cursor-pointer transition-colors text-(--text-muted) hover:text-(--text-primary)"
                onClick={onClose}
              >
                <X size={18} />
              </button>
            </div>
            <div className="p-5 flex-1 overflow-y-auto">
              <div className="space-y-3 mb-6">
                {allUnits.map(alt => {
                  const Icon = alt.icon
                  return (
                    <div key={alt.unit} className="bg-(--bg-elevated) border border-(--border) rounded-xl px-3.5 py-3 flex items-center gap-3">
                      <div className="w-9 h-9 rounded-lg flex items-center justify-center shrink-0 border" style={{ background: `color-mix(in srgb, ${alt.color} 12%, transparent)`, borderColor: `color-mix(in srgb, ${alt.color} 30%, transparent)` }}>
                        <Icon size={16} strokeWidth={1.8} color={alt.color} />
                      </div>
                      <div className="flex-1">
                        <div className="text-[13px] font-semibold" style={{ fontFamily: 'var(--font-mono)' }}>{alt.unit}</div>
                        <div className="text-[11px] text-(--text-secondary) mt-0.5">{alt.type} · {alt.location}</div>
                      </div>
                      <div className="w-24 text-right">
                        <div className="text-sm font-bold">{alt.eta}</div>
                        <div className="text-[11px] text-(--text-muted)">Score: {alt.score}%</div>
                      </div>
                      <button className="px-2.5 py-1 text-[11px] bg-transparent border border-(--border) text-(--text-primary) font-semibold rounded-lg cursor-pointer hover:bg-(--bg-elevated) hover:border-(--accent) transition-colors ml-2" style={{ fontFamily: 'var(--font-body)' }}>
                        Select
                      </button>
                    </div>
                  )
                })}
              </div>
              <div className="p-4 rounded-xl border border-(--border-subtle) bg-(--bg-input) flex flex-col gap-3">
                <div className="text-[12px] font-bold text-(--text-primary) uppercase tracking-wider mb-1" style={{ fontFamily: 'var(--font-display)' }}>
                  Need more resources?
                </div>
                <div className="flex gap-3">
                  <button
                    type="button"
                    className="flex-1 py-2 rounded-lg border border-(--border) bg-(--bg-surface) text-[11px] font-bold uppercase tracking-wider text-(--text-secondary) cursor-pointer hover:border-(--accent) hover:text-(--accent) transition-colors"
                    style={{ fontFamily: 'var(--font-display)' }}
                    onClick={() => setIsAdditionalUnitModalOpen(true)}
                  >
                    Request additional unit
                  </button>
                  <button
                    type="button"
                    className="flex-1 py-2 rounded-lg border border-(--status-critical) bg-[color-mix(in_srgb,var(--status-critical)_10%,transparent)] text-[11px] font-bold uppercase tracking-wider text-(--status-critical) cursor-pointer hover:bg-(--status-critical) hover:text-white transition-colors flex justify-center items-center gap-2"
                    style={{ fontFamily: 'var(--font-display)' }}
                    onClick={() => setIsMutualAidModalOpen(true)}
                  >
                    <AlertTriangle size={14} />
                    Request Mutual Aid
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      <MutualAidRequestModal 
        isOpen={isMutualAidModalOpen} 
        onClose={() => setIsMutualAidModalOpen(false)} 
        onAsk={handleAskMutualAid}
      />

      <RequestAdditionalUnitModal
        isOpen={isAdditionalUnitModalOpen}
        onClose={() => setIsAdditionalUnitModalOpen(false)}
        onSubmit={handleAskAdditionalUnit}
      />
    </>
  )
}

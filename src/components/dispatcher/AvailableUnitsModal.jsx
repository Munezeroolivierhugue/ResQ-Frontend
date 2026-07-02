import { useState, useEffect } from 'react'
import { X, ShieldCheck, Ambulance, Truck, AlertTriangle, Zap } from 'lucide-react'
import MutualAidRequestModal from './MutualAidRequestModal'
import RequestAdditionalUnitModal from './RequestAdditionalUnitModal'
import { useNotificationsStore } from '../../store/notificationsStore'
import { listVehicles } from '../../api/vehicles'

function unitIcon(vehicleType) {
  const t = (vehicleType ?? '').toUpperCase()
  if (t.includes('AMBULANCE'))                        return { icon: Ambulance,   color: '#2196C8' }
  if (t.includes('FIRE') || t.includes('DISASTER'))  return { icon: Truck,       color: '#E8354A' }
  if (t.includes('TACTICAL'))                         return { icon: Zap,         color: '#9B59B6' }
  return                                                     { icon: ShieldCheck, color: '#D4A017' }
}

export default function AvailableUnitsModal({ isOpen, onClose }) {
  const [isMutualAidModalOpen, setIsMutualAidModalOpen] = useState(false)
  const [isAdditionalUnitModalOpen, setIsAdditionalUnitModalOpen] = useState(false)
  const [units, setUnits] = useState([])
  const addNotification = useNotificationsStore((state) => state.addNotification)

  useEffect(() => {
    if (!isOpen) return
    listVehicles({ status: 'AVAILABLE' })
      .then((data) => setUnits(data))
      .catch(() => {})
  }, [isOpen])

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
                {units.length === 0 && (
                  <div className="text-[13px] text-(--text-muted) text-center py-6">Loading available units…</div>
                )}
                {units.map((v) => {
                  const { icon: Icon, color } = unitIcon(v.vehicle_type)
                  return (
                    <div key={v.vehicle_id} className="bg-(--bg-elevated) border border-(--border) rounded-xl px-3.5 py-3 flex items-center gap-3">
                      <div className="w-9 h-9 rounded-lg flex items-center justify-center shrink-0 border" style={{ background: `color-mix(in srgb, ${color} 12%, transparent)`, borderColor: `color-mix(in srgb, ${color} 30%, transparent)` }}>
                        <Icon size={16} strokeWidth={1.8} color={color} />
                      </div>
                      <div className="flex-1">
                        <div className="text-[13px] font-semibold" style={{ fontFamily: 'var(--font-mono)' }}>{v.plate_number}</div>
                        <div className="text-[11px] text-(--text-secondary) mt-0.5">{v.vehicle_type} · {v.location}</div>
                      </div>
                      <div className="w-28 text-right">
                        <div className="text-[11px] font-bold uppercase tracking-wide" style={{ color }}>{v.status}</div>
                        <div className="text-[11px] text-(--text-muted) mt-0.5">{v.capability ?? '—'}</div>
                      </div>
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

import { useState } from 'react'
import { X } from 'lucide-react'
import { mockVehicles } from '../../data/mockVehicles'
import { mockDispatches } from '../../data/mockDispatches'
import { generateUuid } from '../../utils/formHelpers'
import { getCurrentUser } from '../../utils/authSession'

export default function DispatchUnitsModal({ isOpen, incidentId, incidentRef, districtId, onClose, onConfirm }) {
  const [selected, setSelected] = useState([])

  if (!isOpen) return null

  const available = mockVehicles.filter(
    (v) => v.status === 'available' && (districtId == null || v.district_id === districtId)
  )

  const allAvailable = available.length === 0
    ? mockVehicles.filter((v) => v.status === 'available')
    : available

  const toggle = (vehicleId) =>
    setSelected((prev) =>
      prev.includes(vehicleId) ? prev.filter((x) => x !== vehicleId) : [...prev, vehicleId]
    )

  const confirm = () => {
    if (!selected.length) return
    const cu = getCurrentUser()
    selected.forEach((vehicleId) => {
      const vehicle = mockVehicles.find((v) => v.vehicle_id === vehicleId)
      mockDispatches.push({
        dispatch_id: generateUuid(),
        incident_id: incidentId,
        vehicle_id: vehicleId,
        responder_id: null,
        dispatched_by: cu?.user_id || 'demo-user-uuid',
        ai_recommended: false,
        overridden: false,
        override_reason: null,
        confidence: null,
        eta_minutes: null,
        is_immediate: true,
        route: null,
        created_at: new Date().toISOString(),
      })
      if (vehicle) Object.assign(vehicle, { status: 'deployed', assignment: incidentId })
    })
    onConfirm?.(selected)
    setSelected([])
    onClose()
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center"
      style={{ background: 'rgba(0,0,0,0.45)' }}
      onClick={onClose}
    >
      <div
        className="dispatcher-surface p-5 max-w-sm w-full mx-4 max-h-[80vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-bold text-[14px] m-0">Dispatch Additional Units</h3>
          <button type="button" className="bg-transparent border-none cursor-pointer text-(--text-muted)" onClick={onClose}>
            <X size={18} />
          </button>
        </div>
        {incidentRef && (
          <p className="text-[12px] text-(--text-secondary) m-0 mb-3">
            Incident: <span className="font-mono text-(--accent)">{incidentRef}</span>
          </p>
        )}
        {allAvailable.length === 0 ? (
          <p className="text-[13px] text-(--text-muted) m-0">No available units at this time.</p>
        ) : (
          <div className="flex flex-col gap-1">
            {allAvailable.map((v) => (
              <label
                key={v.vehicle_id}
                className="flex items-center gap-3 cursor-pointer p-2 rounded hover:bg-(--bg-elevated)"
              >
                <input
                  type="checkbox"
                  className="accent-(--accent)"
                  checked={selected.includes(v.vehicle_id)}
                  onChange={() => toggle(v.vehicle_id)}
                />
                <div className="flex-1 min-w-0">
                  <div className="text-[13px] font-semibold">
                    {v.id} <span className="text-(--text-muted) font-normal">· {v.type}</span>
                  </div>
                  <div className="text-[11px] text-(--text-muted) truncate">{v.location} · {v.plate_number}</div>
                </div>
              </label>
            ))}
          </div>
        )}
        <div className="flex gap-2 mt-4">
          <button
            type="button"
            className="dispatcher-btn-primary flex-1 text-[12px]"
            onClick={confirm}
            disabled={!selected.length}
          >
            Dispatch {selected.length > 0 ? `${selected.length} Unit${selected.length > 1 ? 's' : ''}` : 'Units'}
          </button>
          <button
            type="button"
            className="dispatcher-btn-ghost text-[12px]"
            onClick={() => { setSelected([]); onClose() }}
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  )
}

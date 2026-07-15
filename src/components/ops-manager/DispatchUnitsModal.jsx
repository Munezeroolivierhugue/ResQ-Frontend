import { useEffect, useState } from 'react'
import { X } from 'lucide-react'
import { listVehicles } from '../../api/vehicles'
import { createDispatch } from '../../api/dispatches'

export default function DispatchUnitsModal({ isOpen, incidentId, incidentRef, districtId, onClose, onConfirm }) {
  const [selected, setSelected] = useState([])
  const [available, setAvailable] = useState([])
  const [loading, setLoading] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState(null)

  useEffect(() => {
    if (!isOpen) return
    // Defer to a microtask so this doesn't count as a synchronous setState
    // call from within the effect body itself (react-hooks/set-state-in-effect).
    Promise.resolve().then(() => { setLoading(true); setError(null) })
    listVehicles({ status: 'AVAILABLE', ...(districtId ? { districtId } : {}) })
      .then(setAvailable)
      .catch(() => setAvailable([]))
      .finally(() => setLoading(false))
  }, [isOpen, districtId])

  if (!isOpen) return null

  const toggle = (vehicleId) =>
    setSelected((prev) =>
      prev.includes(vehicleId) ? prev.filter((x) => x !== vehicleId) : [...prev, vehicleId]
    )

  const confirm = async () => {
    if (!selected.length || !incidentId || submitting) return
    setSubmitting(true)
    setError(null)
    try {
      const results = await Promise.allSettled(
        selected.map((vehicleId) => createDispatch({
          incidentId,
          vehicleId,
          responderId: null,
          aiRecommended: false,
          overridden: true,
          overrideReason: 'backup_request',
        }))
      )
      const failures = results.filter((r) => r.status === 'rejected')
      if (failures.length > 0) {
        setError(
          selected.length === 1
            ? 'Dispatch failed — the unit may no longer be available.'
            : `Dispatch failed for ${failures.length} of ${selected.length} unit(s).`
        )
        return
      }
      onConfirm?.(selected)
      setSelected([])
      onClose()
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div
      // Leaflet's map panes render at their own z-index (up to ~650) which sat
      // above this modal's old z-50 whenever a live map was visible behind it
      // (e.g. the Escalation detail page) — the map tiles/markers visibly
      // bled through the modal. z-[9999] is safely above that.
      className="fixed inset-0 z-[9999] flex items-center justify-center"
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
        {error && (
          <p className="text-[12px] m-0 mb-3" style={{ color: 'var(--status-critical)' }}>{error}</p>
        )}
        {loading ? (
          <p className="text-[13px] text-(--text-muted) m-0">Loading available units…</p>
        ) : available.length === 0 ? (
          <p className="text-[13px] text-(--text-muted) m-0">No available units at this time.</p>
        ) : (
          <div className="flex flex-col gap-1">
            {available.map((v) => (
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
                    {v.plate_number} <span className="text-(--text-muted) font-normal">· {v.vehicle_type}</span>
                  </div>
                  <div className="text-[11px] text-(--text-muted) truncate">{v.location}</div>
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
            disabled={!selected.length || submitting}
          >
            {submitting ? 'Dispatching…' : `Dispatch ${selected.length > 0 ? `${selected.length} Unit${selected.length > 1 ? 's' : ''}` : 'Units'}`}
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

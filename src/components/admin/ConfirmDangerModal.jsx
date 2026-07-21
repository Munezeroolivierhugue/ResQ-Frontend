import { useState, useEffect } from 'react'

export default function ConfirmDangerModal({ open, title, message, confirmLabel = 'Confirm', onConfirm, onCancel }) {
  // Block the confirm button for 300 ms after the modal opens.
  // Without this, mousedown on the trigger button + modal rendering under the
  // cursor means mouseup fires on the confirm button — auto-confirming the action.
  const [armed, setArmed] = useState(false)

  useEffect(() => {
    if (!open) { setArmed(false); return }
    const t = setTimeout(() => setArmed(true), 300)
    return () => clearTimeout(t)
  }, [open])

  if (!open) return null

  return (
    <div
      className="fixed inset-0 z-[10000] flex items-center justify-center p-4"
      style={{ background: 'rgba(0,0,0,0.55)' }}
      onMouseDown={(e) => e.stopPropagation()}
    >
      <div
        className="dispatcher-surface p-5 w-full max-w-md shadow-2xl"
        style={{ background: 'var(--bg-surface)', border: '1px solid var(--status-critical)' }}
      >
        <h3 className="text-[15px] font-bold m-0" style={{ color: 'var(--status-critical)' }}>{title}</h3>
        <p className="text-[13px] text-(--text-primary) mt-2 mb-4 leading-relaxed">{message}</p>
        <div className="flex gap-2 justify-end">
          <button type="button" className="dispatcher-btn-ghost text-[12px]" onClick={onCancel}>
            Cancel
          </button>
          <button
            type="button"
            className="text-[12px] font-bold px-4 py-2 rounded-lg border-none"
            style={{
              background: armed ? 'var(--status-critical)' : 'var(--border)',
              color: armed ? 'var(--text-on-accent)' : 'var(--text-muted)',
              cursor: armed ? 'pointer' : 'not-allowed',
              transition: 'background 0.15s',
            }}
            disabled={!armed}
            onClick={onConfirm}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  )
}

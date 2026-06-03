export default function ConfirmDangerModal({ open, title, message, confirmLabel = 'Confirm', onConfirm, onCancel }) {
  if (!open) return null
  return (
    <div className="fixed inset-0 z-[400] flex items-center justify-center p-4" style={{ background: 'rgba(0,0,0,0.55)' }}>
      <div
        className="dispatcher-surface p-5 w-full max-w-md"
        style={{ background: 'var(--status-critical-bg)', border: '1px solid var(--status-critical)' }}
      >
        <h3 className="text-[15px] font-bold m-0" style={{ color: 'var(--status-critical)' }}>{title}</h3>
        <p className="text-[13px] text-(--text-primary) mt-2 mb-4 leading-relaxed">{message}</p>
        <div className="flex gap-2 justify-end">
          <button type="button" className="dispatcher-btn-ghost text-[12px]" onClick={onCancel}>
            Cancel
          </button>
          <button
            type="button"
            className="text-[12px] font-bold px-4 py-2 rounded-lg border-none cursor-pointer"
            style={{ background: 'var(--status-critical)', color: 'var(--text-on-accent)' }}
            onClick={onConfirm}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  )
}

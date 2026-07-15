import { AlertTriangle } from 'lucide-react'
import BottomSheet from './BottomSheet'

// Replaces window.confirm() calls, which render as a browser-chrome alert
// box that doesn't match the app's UI at all — this renders as a themed
// card in the same style as the rest of the field-responder sheets/modals.
export default function ConfirmModal({ open, title, message, confirmLabel = 'Confirm', onConfirm, onCancel }) {
  return (
    <BottomSheet open={open} onClose={onCancel} title={title} icon={AlertTriangle}>
      <div className="fr-sheet-body">
        <p className="text-[13px] text-(--text-secondary) m-0">{message}</p>
        <div className="flex gap-2 mt-4">
          <button type="button" className="dispatcher-btn-ghost fr-btn-full" onClick={onCancel}>
            Cancel
          </button>
          <button type="button" className="dispatcher-btn-primary fr-btn-full" onClick={onConfirm}>
            {confirmLabel}
          </button>
        </div>
      </div>
    </BottomSheet>
  )
}

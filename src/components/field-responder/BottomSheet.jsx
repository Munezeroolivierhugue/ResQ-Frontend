import { X } from 'lucide-react'

export default function BottomSheet({ open, onClose, title, children, icon: Icon }) {
  if (!open) return null

  return (
    <div className="fr-sheet-root" role="presentation">
      <button type="button" className="fr-sheet-backdrop" aria-label="Close" onClick={onClose} />
      <div className="fr-sheet" role="dialog" aria-modal="true">
        <div className="fr-sheet-handle" aria-hidden />
        {title && (
          <div className="fr-sheet-header">
            {Icon && <Icon size={28} className="fr-sheet-header-icon" />}
            <h2 className="fr-sheet-title">{title}</h2>
          </div>
        )}
        {children}
      </div>
    </div>
  )
}

export function BottomSheetClose({ onClick }) {
  return (
    <button type="button" className="fr-sheet-cancel" onClick={onClick}>
      Cancel
    </button>
  )
}

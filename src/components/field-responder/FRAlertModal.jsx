import { useToastStore } from '../../store/toastStore'

const VARIANT_LABEL = {
  success: 'Success',
  error: 'Error',
  warning: 'Warning',
  info: 'Notice',
}

/**
 * Field Responder's phone-style alert — one centered modal at a time instead
 * of the desktop top-right <ToastStack /> stack. Subscribes to the same
 * shared toastStore, but only ever surfaces the oldest queued toast; the
 * rest wait their turn behind the single "OK" button instead of stacking.
 */
export default function FRAlertModal() {
  const toasts = useToastStore((s) => s.toasts)
  const dismissToast = useToastStore((s) => s.dismissToast)

  if (toasts.length === 0) return null

  const current = toasts[0]
  const label = current.title || VARIANT_LABEL[current.variant] || VARIANT_LABEL.info

  return (
    <div className="fr-alert-backdrop" role="presentation">
      <div className="fr-alert-modal" role="alertdialog" aria-modal="true" aria-labelledby="fr-alert-title">
        <div className={`fr-alert-modal__title fr-alert-modal__title--${current.variant || 'info'}`} id="fr-alert-title">
          {label}
        </div>
        {current.message && (
          <p className="fr-alert-modal__message">{current.message}</p>
        )}
        <button
          type="button"
          className="fr-alert-modal__ok"
          onClick={() => dismissToast(current.id)}
        >
          OK
        </button>
      </div>
    </div>
  )
}

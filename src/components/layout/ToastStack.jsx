import { CheckCircle2, XCircle, AlertTriangle, Info, X } from 'lucide-react'
import { useToastStore } from '../../store/toastStore'

const VARIANTS = {
  success: { color: 'var(--status-low)', bg: 'var(--status-low-bg)', Icon: CheckCircle2 },
  error:   { color: 'var(--status-critical)', bg: 'var(--status-critical-bg)', Icon: XCircle },
  warning: { color: 'var(--status-medium)', bg: 'var(--status-medium-bg)', Icon: AlertTriangle },
  info:    { color: 'var(--status-info)', bg: 'var(--status-info-bg)', Icon: Info },
}

/**
 * Generic, imperatively-pushed toast stack. Fixed top-right, matches
 * AnnouncementPopup's positioning/visual language so the two stacks merge
 * visually rather than compete. Mounted once per portal shell alongside
 * <AnnouncementPopup />.
 */
export default function ToastStack() {
  const toasts = useToastStore((s) => s.toasts)
  const dismissToast = useToastStore((s) => s.dismissToast)

  if (toasts.length === 0) return null

  // NOTE: no outer fixed-position wrapper — renders cards directly so they
  // merge into the same fixed top-right stack as <AnnouncementPopup />
  // rather than competing with it. See Navbar.jsx / FieldResponderShell.jsx.
  return (
    <>
      {toasts.map((t) => {
        const tone = VARIANTS[t.variant] ?? VARIANTS.info
        const Icon = tone.Icon
        return (
          <div
            key={t.id}
            className="relative rounded-xl shadow-2xl p-4 pl-5 flex gap-3 items-start animate-fade-in-up overflow-hidden"
            style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-subtle, rgba(0,0,0,0.08))' }}
          >
            <span
              className="absolute left-0 top-0 bottom-0 w-1 rounded-l-xl"
              style={{ background: tone.color }}
              aria-hidden="true"
            />
            <span className="w-8 h-8 rounded-full flex items-center justify-center shrink-0" style={{ background: tone.bg, color: tone.color }}>
              <Icon size={16} />
            </span>
            <div className="flex-1 min-w-0">
              {t.title && (
                <div className="text-[11px] font-bold uppercase tracking-wide" style={{ color: tone.color }}>
                  {t.title}
                </div>
              )}
              {t.message && (
                <p className="text-[13px] text-(--text-primary) mt-1 mb-0 leading-snug">{t.message}</p>
              )}
            </div>
            <button
              type="button"
              className="bg-transparent border-none cursor-pointer text-(--text-muted) hover:text-(--text-primary) shrink-0"
              onClick={() => dismissToast(t.id)}
              aria-label="Dismiss"
            >
              <X size={16} />
            </button>
          </div>
        )
      })}
    </>
  )
}

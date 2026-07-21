import { useEffect, useState } from 'react'
import { AlertTriangle, Info, ShieldAlert, X } from 'lucide-react'
import { listActiveAnnouncements, dismissAnnouncement } from '../../api/announcements'
import { connect, subscribe } from '../../lib/wsClient'

const SEVERITY = {
  WARNING:  { color: 'var(--status-medium)',   bg: 'var(--status-medium-bg)',   Icon: AlertTriangle },
  INFO:     { color: 'var(--status-info)',     bg: 'var(--status-info-bg)',     Icon: Info },
  CRITICAL: { color: 'var(--status-critical)', bg: 'var(--status-critical-bg)', Icon: ShieldAlert },
}

// Real system-wide announcements, pushed live via the same WebSocket queue
// every other notification uses (/user/queue/notifications, type ANNOUNCEMENT).
// Mounted once per portal shell (via Navbar / FieldResponderShell) so every
// role sees it. Dismissing hides it for today only — it reappears the next
// day if still inside its real from/to date range.
export default function AnnouncementPopup() {
  const [items, setItems] = useState([])

  const refresh = () => {
    listActiveAnnouncements().then(setItems).catch(() => {})
  }

  useEffect(() => {
    refresh()
    const token = sessionStorage.getItem('resq-jwt')
    connect(token)
    const unsub = subscribe('/user/queue/notifications', (payload) => {
      if (payload?.type === 'ANNOUNCEMENT') refresh()
    })
    return () => { if (typeof unsub === 'function') unsub() }
  }, [])

  if (items.length === 0) return null

  async function handleDismiss(recipientId) {
    setItems((prev) => prev.filter((a) => a.recipient_id !== recipientId))
    try {
      await dismissAnnouncement(recipientId)
    } catch {
      refresh()
    }
  }

  // NOTE: no outer fixed-position wrapper here anymore — this renders its
  // cards directly so it can sit inside the same fixed top-right stack as
  // <ToastStack />, avoiding two competing fixed containers. See Navbar.jsx /
  // FieldResponderShell.jsx for the shared wrapper.
  return (
    <>
      {items.map((a) => {
        const tone = SEVERITY[a.severity] ?? SEVERITY.INFO
        const Icon = tone.Icon
        return (
          <div
            key={a.recipient_id}
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
              <div className="text-[11px] font-bold uppercase tracking-wide" style={{ color: tone.color }}>
                {a.severity}
              </div>
              <p className="text-[13px] text-(--text-primary) mt-1 mb-0 leading-snug">{a.message}</p>
            </div>
            <button
              type="button"
              className="bg-transparent border-none cursor-pointer text-(--text-muted) hover:text-(--text-primary) shrink-0"
              onClick={() => handleDismiss(a.recipient_id)}
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

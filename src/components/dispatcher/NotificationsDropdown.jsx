import { useEffect, useRef } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import {
  Bell, AlertTriangle, Cpu, Users, Clock, Check,
} from 'lucide-react'
import { useNotificationsStore } from '../../store/notificationsStore'

const ICONS = {
  critical: AlertTriangle,
  system: Cpu,
  info: Users,
  muted: Clock,
}

function NotifIcon({ type }) {
  const Icon = ICONS[type] || ICONS.muted
  const wrap =
    type === 'critical'
      ? { bg: 'var(--status-critical-bg)', color: 'var(--status-critical)' }
      : type === 'info'
        ? { bg: 'var(--status-info-bg)', color: 'var(--status-info)' }
        : type === 'system'
          ? { bg: 'var(--accent-ghost)', color: 'var(--accent)' }
          : { bg: 'var(--bg-elevated)', color: 'var(--text-muted)' }
  return (
    <span
      className="w-8 h-8 rounded-full flex items-center justify-center shrink-0"
      style={{ background: wrap.bg, color: wrap.color }}
    >
      <Icon size={15} />
    </span>
  )
}

export default function NotificationsDropdown({ open, onClose, onToggle }) {
  const navigate = useNavigate()
  const panelRef = useRef(null)
  const { items, markAllRead, markRead } = useNotificationsStore()
  const unread = items.filter((n) => !n.read).length

  useEffect(() => {
    if (!open) return undefined
    const onDoc = (e) => {
      if (panelRef.current && !panelRef.current.contains(e.target)) onClose()
    }
    document.addEventListener('mousedown', onDoc)
    return () => document.removeEventListener('mousedown', onDoc)
  }, [open, onClose])

  return (
    <div className="relative" ref={panelRef}>
      <button
        type="button"
        className="relative p-1.75 rounded-md bg-transparent border-none cursor-pointer flex items-center justify-center text-(--text-secondary) hover:bg-(--bg-elevated) hover:text-(--text-primary) transition-colors"
        onClick={onToggle}
        aria-label="Notifications"
        aria-expanded={open}
      >
        <Bell size={17} />
        {unread > 0 && (
          <span
            className="absolute top-0.75 right-0.75 min-w-3.75 h-3.75 px-0.5 rounded-full bg-(--status-critical) text-[9px] font-bold flex items-center justify-center"
            style={{ fontFamily: 'var(--font-body)', color: 'var(--text-on-accent)' }}
          >
            {unread}
          </span>
        )}
      </button>

      {open && (
        <div
          className="notif-dropdown animate-fade-in-up absolute top-[calc(100%+8px)] right-0 w-[380px] max-h-[520px] overflow-y-auto z-[9999] bg-(--bg-surface) border border-(--border) rounded-xl shadow-[var(--shadow-dropdown)] flex flex-col"
        >
          <div className="sticky top-0 z-10 bg-(--bg-surface) px-4 py-3 border-b border-(--border-subtle) flex justify-between items-center">
            <span className="text-[14px] font-semibold text-(--text-primary)">Notifications</span>
            <button
              type="button"
              className="text-[11px] text-(--text-muted) bg-transparent border-none cursor-pointer hover:text-(--accent) font-medium"
              onClick={markAllRead}
            >
              Mark all read
            </button>
          </div>

          <div className="flex-1 overflow-y-auto">
            {items.map((n) => (
              <button
                key={n.id}
                type="button"
                className="w-full text-left border-none cursor-pointer flex gap-3 items-start px-4 py-3 transition-colors hover:bg-(--bg-elevated)"
                style={{
                  background: n.read ? 'transparent' : 'var(--accent-ghost)',
                  borderLeft: n.read ? '3px solid transparent' : '3px solid var(--accent)',
                }}
                onClick={() => {
                  markRead(n.id)
                  onClose()
                  navigate(n.href)
                }}
              >
                <NotifIcon type={n.type} />
                <div className="flex-1 min-w-0">
                  <div className="text-[13px] font-medium text-(--text-primary)">{n.title}</div>
                  <div
                    className="text-[12px] text-(--text-secondary) mt-0.5 leading-snug"
                    style={{
                      display: '-webkit-box',
                      WebkitLineClamp: 2,
                      WebkitBoxOrient: 'vertical',
                      overflow: 'hidden',
                    }}
                  >
                    {n.desc}
                  </div>
                </div>
                <div className="flex flex-col items-end gap-1.5 shrink-0">
                  <span className="text-[11px] text-(--text-muted)" style={{ fontFamily: 'var(--font-mono)' }}>
                    {n.time}
                  </span>
                  {!n.read && (
                    <span
                      className="w-1.5 h-1.5 rounded-full bg-(--accent)"
                      aria-hidden
                    />
                  )}
                </div>
              </button>
            ))}
          </div>

          <div className="sticky bottom-0 bg-(--bg-surface) border-t border-(--border-subtle) px-4 py-2.5 text-center">
            <Link
              to="/dispatcher/notifications"
              className="text-[12px] font-medium text-(--accent) no-underline hover:underline"
              onClick={onClose}
            >
              View all notifications →
            </Link>
          </div>
        </div>
      )}
    </div>
  )
}

import { useEffect } from 'react'
import { Siren, Bell } from 'lucide-react'
import { FR_OFFICER } from '../../data/mockFieldResponderData'
import { useNotificationsStore } from '../../store/notificationsStore'
import { getCurrentUser } from '../../utils/authSession'

export default function FieldResponderTopBar({ title }) {
  const fetchNotifications = useNotificationsStore((s) => s.fetchNotifications)
  const subscribeToWs = useNotificationsStore((s) => s.subscribeToWs)
  const unreadCount = useNotificationsStore((s) => s.items.filter((n) => !n.read).length)
  const cu = getCurrentUser()

  useEffect(() => {
    fetchNotifications()
    const unsub = subscribeToWs()
    return () => { if (typeof unsub === 'function') unsub() }
  }, [])

  return (
    <header className="fr-topbar field-responder-topbar">
      <div className="fr-topbar-brand">
        <Siren size={20} className="text-(--accent)" />
        <span className="fr-topbar-logo">RESQ</span>
      </div>
      <h1 className="fr-topbar-title">{title}</h1>
      <div className="fr-topbar-actions">
        <span className="fr-topbar-badge">{cu?.full_name?.split(' ')[0] ?? FR_OFFICER.badge}</span>
        <button type="button" className="fr-topbar-bell" aria-label="Notifications">
          <Bell size={20} />
          {unreadCount > 0 && <span className="fr-topbar-bell-dot" aria-hidden />}
        </button>
      </div>
    </header>
  )
}

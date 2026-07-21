import { useEffect, useState } from 'react'
import { Siren, Volume2, VolumeX } from 'lucide-react'
import { FR_OFFICER } from '../../data/mockFieldResponderData'
import { useNotificationsStore } from '../../store/notificationsStore'
import { getCurrentUser } from '../../utils/authSession'
import { isNotificationSoundMuted, setNotificationSoundMuted } from '../../utils/notificationSound'
import NotificationsDropdown from '../dispatcher/NotificationsDropdown'

export default function FieldResponderTopBar({ title }) {
  const fetchNotifications = useNotificationsStore((s) => s.fetchNotifications)
  const subscribeToWs = useNotificationsStore((s) => s.subscribeToWs)
  const cu = getCurrentUser()
  const [soundMuted, setSoundMuted] = useState(() => isNotificationSoundMuted())
  const [notifOpen, setNotifOpen] = useState(false)

  useEffect(() => {
    fetchNotifications()
    const unsub = subscribeToWs()
    return () => { if (typeof unsub === 'function') unsub() }
  }, [])

  const toggleSound = () => {
    setSoundMuted((prev) => {
      const next = !prev
      setNotificationSoundMuted(next)
      return next
    })
  }

  return (
    <header className="fr-topbar field-responder-topbar">
      <div className="fr-topbar-brand">
        <Siren size={20} className="text-(--accent)" />
        <span className="fr-topbar-logo">RESQ</span>
      </div>
      <h1 className="fr-topbar-title">{title}</h1>
      <div className="fr-topbar-actions">
        <span className="fr-topbar-badge">{cu?.full_name?.split(' ')[0] ?? FR_OFFICER.badge}</span>
        <button
          type="button"
          className="fr-topbar-bell"
          aria-label={soundMuted ? 'Unmute notification sound' : 'Mute notification sound'}
          title={soundMuted ? 'Unmute notification sound' : 'Mute notification sound'}
          onClick={toggleSound}
        >
          {soundMuted ? <VolumeX size={16} /> : <Volume2 size={16} />}
        </button>
        <NotificationsDropdown
          open={notifOpen}
          onToggle={() => setNotifOpen((v) => !v)}
          onClose={() => setNotifOpen(false)}
        />
      </div>
    </header>
  )
}

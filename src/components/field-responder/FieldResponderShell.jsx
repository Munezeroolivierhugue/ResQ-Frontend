import { useEffect } from 'react'
import { Outlet, useLocation } from 'react-router-dom'
import FieldResponderTopBar from './FieldResponderTopBar'
import FieldResponderBottomNav from './FieldResponderBottomNav'
import AnnouncementPopup from '../layout/AnnouncementPopup'
import FRAlertModal from './FRAlertModal'
import { useNotificationsStore } from '../../store/notificationsStore'

const TITLES = {
  '/field-responder/shift-start': 'Shift Status',
  '/field-responder/assignment': 'Assignment',
  '/field-responder/performance': 'My Stats',
  '/field-responder/profile': 'Profile',
  '/field-responder/report': 'Field Report',
  '/field-responder/shift-end': 'End Shift',
  '/field-responder/on-scene': 'On Scene',
}

const SETTINGS_LABELS = {
  profile: 'Profile',
  appearance: 'Appearance',
  notifications: 'Notifications',
  unit: 'Unit & GPS',
  language: 'Language',
  security: 'Security',
}

const FULLSCREEN_ROUTES = ['/field-responder/navigation']

export default function FieldResponderShell() {
  const location = useLocation()
  const path = location.pathname
  const isFullscreen = FULLSCREEN_ROUTES.some((p) => path.startsWith(p))
  const showTop = !isFullscreen
  const showBottom = !isFullscreen

  const fetchNotifications = useNotificationsStore((s) => s.fetchNotifications)
  const subscribeToWs = useNotificationsStore((s) => s.subscribeToWs)

  useEffect(() => {
    fetchNotifications()
    const unsub = subscribeToWs()
    return () => { if (typeof unsub === 'function') unsub() }
  }, [])

  const title = (() => {
    if (path.startsWith('/field-responder/settings/')) {
      const section = path.split('/').pop()
      return SETTINGS_LABELS[section] || 'Settings'
    }
    return TITLES[path] || (path.includes('on-scene') ? 'On Scene' : 'Field Responder')
  })()

  return (
    <div className="fr-app field-responder-shell">
      <div className="fixed top-4 right-4 z-[10001] flex flex-col gap-2 w-full max-w-sm">
        <AnnouncementPopup />
      </div>
      <FRAlertModal />
      {showTop && <FieldResponderTopBar title={title} />}
      <main
        className={`fr-main field-responder-content${isFullscreen ? ' fr-main--fullscreen' : ''}${!showBottom ? ' fr-main--no-nav' : ''}`}
      >
        <Outlet />
      </main>
      {showBottom && <FieldResponderBottomNav />}
    </div>
  )
}

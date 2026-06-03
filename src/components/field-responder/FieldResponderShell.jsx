import { Outlet, useLocation } from 'react-router-dom'
import FieldResponderTopBar from './FieldResponderTopBar'
import FieldResponderBottomNav from './FieldResponderBottomNav'
import { useFieldResponderStore } from '../../store/fieldResponderStore'

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
  const toast = useFieldResponderStore((s) => s.toast)
  const path = location.pathname
  const isFullscreen = FULLSCREEN_ROUTES.some((p) => path.startsWith(p))
  const showTop = !isFullscreen
  const showBottom = !isFullscreen

  const title = (() => {
    if (path.startsWith('/field-responder/settings/')) {
      const section = path.split('/').pop()
      return SETTINGS_LABELS[section] || 'Settings'
    }
    return TITLES[path] || (path.includes('on-scene') ? 'On Scene' : 'Field Responder')
  })()

  return (
    <div className="fr-app field-responder-shell">
      {showTop && <FieldResponderTopBar title={title} />}
      <main
        className={`fr-main field-responder-content${isFullscreen ? ' fr-main--fullscreen' : ''}${!showBottom ? ' fr-main--no-nav' : ''}`}
      >
        <Outlet />
      </main>
      {showBottom && <FieldResponderBottomNav />}
      {toast && (
        <div
          className={`fr-toast fr-toast--${toast.variant}`}
          role="status"
        >
          {toast.message}
        </div>
      )}
    </div>
  )
}

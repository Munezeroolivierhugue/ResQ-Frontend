import { useState } from 'react'
import { Outlet, useLocation } from 'react-router-dom'
import Navbar from './Navbar'
import Sidebar from './Sidebar'
import { getCurrentUser } from '../../utils/authSession'
import IncomingCallBanner from '../dispatcher/IncomingCallBanner'
import CallEndedToast from '../dispatcher/CallEndedToast'
import GlobalCallCard from '../dispatcher/GlobalCallCard'

export default function AppShell() {
  const [mobileOpen, setMobileOpen] = useState(false)
  const location = useLocation()
  const isLiveDispatchMap = location.pathname === '/dispatcher'
  const cu = getCurrentUser()
  const navUser = { name: cu?.full_name || 'Dispatcher', role: 'DISPATCHER' }

  return (
    <div className="flex h-screen overflow-hidden">
      {mobileOpen && <div className="sidebar-overlay" onClick={() => setMobileOpen(false)} />}
      <Sidebar mobileOpen={mobileOpen} onClose={() => setMobileOpen(false)} />
      <div className="flex flex-col flex-1 overflow-hidden min-w-0">
        <Navbar
          user={navUser}
          onMenuClick={() => setMobileOpen(v => !v)}
          portalLabel="Dispatcher Portal"
          profileHref="/dispatcher/settings/profile"
          settingsHref="/dispatcher/settings/profile"
        />
        <main
          className={
            isLiveDispatchMap
              ? 'portal-main portal-main--dispatch-map flex-1 min-h-0 bg-(--bg-base)'
              : 'portal-main flex-1 overflow-auto bg-(--bg-base)'
          }
        >
          <Outlet />
        </main>
      </div>
      <IncomingCallBanner />
      <GlobalCallCard />
      <CallEndedToast />
    </div>
  )
}

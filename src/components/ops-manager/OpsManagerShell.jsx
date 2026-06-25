import { useState } from 'react'
import { Outlet } from 'react-router-dom'
import Navbar from '../layout/Navbar'
import OpsManagerSidebar from '../layout/OpsManagerSidebar'
import { getCurrentUser } from '../../utils/authSession'

export default function OpsManagerShell() {
  const [mobileOpen, setMobileOpen] = useState(false)
  const cu = getCurrentUser()
  const navUser = { name: cu?.full_name || 'Ops Manager', role: 'OPS MANAGER' }

  return (
    <div className="flex h-screen overflow-hidden">
      {mobileOpen && <div className="sidebar-overlay" onClick={() => setMobileOpen(false)} />}
      <OpsManagerSidebar mobileOpen={mobileOpen} onClose={() => setMobileOpen(false)} />
      <div className="flex flex-col flex-1 overflow-hidden min-w-0">
        <Navbar
          user={navUser}
          onMenuClick={() => setMobileOpen((v) => !v)}
          portalLabel="Operations Command"
          profileHref="/ops-manager/settings/profile"
          settingsHref="/ops-manager/settings/profile"
        />
        <main className="portal-main flex-1 overflow-auto bg-(--bg-base)">
          <Outlet />
        </main>
      </div>
    </div>
  )
}

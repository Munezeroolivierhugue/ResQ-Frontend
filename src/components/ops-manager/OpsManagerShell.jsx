import { useState } from 'react'
import { Outlet } from 'react-router-dom'
import Navbar from '../layout/Navbar'
import OpsManagerSidebar from '../layout/OpsManagerSidebar'

const opsManagerUser = { name: 'Patrick Nshimiyimana', role: 'OPS MANAGER' }

export default function OpsManagerShell() {
  const [mobileOpen, setMobileOpen] = useState(false)

  return (
    <div className="flex h-screen overflow-hidden">
      {mobileOpen && <div className="sidebar-overlay" onClick={() => setMobileOpen(false)} />}
      <OpsManagerSidebar mobileOpen={mobileOpen} onClose={() => setMobileOpen(false)} />
      <div className="flex flex-col flex-1 overflow-hidden min-w-0">
        <Navbar
          user={opsManagerUser}
          onMenuClick={() => setMobileOpen((v) => !v)}
          portalLabel="Operations Command"
          profileHref="/ops-manager/settings/profile"
          settingsHref="/ops-manager/settings/profile"
        />
        <main className="flex-1 overflow-auto bg-(--bg-base) min-w-[1024px]">
          <Outlet />
        </main>
      </div>
    </div>
  )
}

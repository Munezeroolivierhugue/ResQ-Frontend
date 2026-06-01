import { useState } from 'react'
import { Outlet } from 'react-router-dom'
import Navbar from '../layout/Navbar'
import DistrictCommanderSidebar from '../layout/DistrictCommanderSidebar'

const dcUser = { name: 'Emmanuel Hakizimana', role: 'DIST. COMMANDER' }

export default function DistrictCommanderShell() {
  const [mobileOpen, setMobileOpen] = useState(false)

  return (
    <div className="flex h-screen overflow-hidden">
      {mobileOpen && <div className="sidebar-overlay" onClick={() => setMobileOpen(false)} />}
      <DistrictCommanderSidebar mobileOpen={mobileOpen} onClose={() => setMobileOpen(false)} />
      <div className="flex flex-col flex-1 overflow-hidden min-w-0">
        <Navbar
          user={dcUser}
          onMenuClick={() => setMobileOpen((v) => !v)}
          portalLabel="District Command"
          profileHref="/district-commander/profile"
          settingsHref="/district-commander/settings/profile"
        />
        <main className="portal-main flex-1 overflow-auto bg-(--bg-base)">
          <Outlet />
        </main>
      </div>
    </div>
  )
}

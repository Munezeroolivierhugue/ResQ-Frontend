import { useState } from 'react'
import { Outlet } from 'react-router-dom'
import Navbar from '../layout/Navbar'
import DistrictCommanderSidebar from '../layout/DistrictCommanderSidebar'
import { getCurrentUser } from '../../utils/authSession'

export default function DistrictCommanderShell() {
  const [mobileOpen, setMobileOpen] = useState(false)
  const user = getCurrentUser()

  return (
    <div className="flex h-screen overflow-hidden">
      {mobileOpen && <div className="sidebar-overlay" onClick={() => setMobileOpen(false)} />}
      <DistrictCommanderSidebar mobileOpen={mobileOpen} onClose={() => setMobileOpen(false)} />
      <div className="flex flex-col flex-1 overflow-hidden min-w-0">
        <Navbar
          user={user ? { name: user.full_name, role: 'DIST. COMMANDER' } : { name: 'District Commander', role: 'DIST. COMMANDER' }}
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

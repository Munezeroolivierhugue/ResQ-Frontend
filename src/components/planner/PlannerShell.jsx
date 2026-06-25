import { useState } from 'react'
import { Outlet } from 'react-router-dom'
import Navbar from '../layout/Navbar'
import PlannerSidebar from '../layout/PlannerSidebar'
import { getCurrentUser } from '../../utils/authSession'

export default function PlannerShell() {
  const [mobileOpen, setMobileOpen] = useState(false)
  const user = getCurrentUser()
  return (
    <div className="flex h-screen overflow-hidden">
      {mobileOpen && <div className="sidebar-overlay" onClick={() => setMobileOpen(false)} />}
      <PlannerSidebar mobileOpen={mobileOpen} onClose={() => setMobileOpen(false)} />
      <div className="flex flex-col flex-1 overflow-hidden min-w-0">
        <Navbar
          user={user ? { name: user.full_name, role: 'EMERGENCY PLANNER' } : { name: 'Emergency Planner', role: 'EMERGENCY PLANNER' }}
          onMenuClick={() => setMobileOpen((v) => !v)}
          portalLabel="Emergency Planning"
          profileHref="/planner/profile"
          settingsHref="/planner/settings/profile"
        />
        <main className="portal-main flex-1 overflow-auto bg-(--bg-base)">
          <Outlet />
        </main>
      </div>
    </div>
  )
}

import { useState } from 'react'
import { Outlet } from 'react-router-dom'
import Navbar from '../layout/Navbar'
import PlannerSidebar from '../layout/PlannerSidebar'

const plannerUser = { name: 'Claudine Uwimana', role: 'EMERGENCY PLANNER' }

export default function PlannerShell() {
  const [mobileOpen, setMobileOpen] = useState(false)
  return (
    <div className="flex h-screen overflow-hidden">
      {mobileOpen && <div className="sidebar-overlay" onClick={() => setMobileOpen(false)} />}
      <PlannerSidebar mobileOpen={mobileOpen} onClose={() => setMobileOpen(false)} />
      <div className="flex flex-col flex-1 overflow-hidden min-w-0">
        <Navbar
          user={plannerUser}
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

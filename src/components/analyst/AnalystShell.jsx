import { useState } from 'react'
import { Outlet } from 'react-router-dom'
import Navbar from '../layout/Navbar'
import AnalystSidebar from '../layout/AnalystSidebar'
import { getCurrentUser } from '../../utils/authSession'

export default function AnalystShell() {
  const [mobileOpen, setMobileOpen] = useState(false)
  const user = getCurrentUser()
  return (
    <div className="flex h-screen overflow-hidden">
      {mobileOpen && <div className="sidebar-overlay" onClick={() => setMobileOpen(false)} />}
      <AnalystSidebar mobileOpen={mobileOpen} onClose={() => setMobileOpen(false)} />
      <div className="flex flex-col flex-1 overflow-hidden min-w-0">
        <Navbar
          user={user ? { name: user.full_name, role: 'ANALYST' } : { name: 'Analyst', role: 'ANALYST' }}
          onMenuClick={() => setMobileOpen((v) => !v)}
          portalLabel="Intelligence Portal"
          profileHref="/analyst/profile"
          settingsHref="/analyst/settings/profile"
        />
        <main className="portal-main flex-1 overflow-auto bg-(--bg-base)">
          <Outlet />
        </main>
      </div>
    </div>
  )
}

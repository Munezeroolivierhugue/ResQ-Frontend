import { useState } from 'react'
import { Outlet } from 'react-router-dom'
import Navbar from '../layout/Navbar'
import AdminSidebar from '../layout/AdminSidebar'

export default function AdminShell({ user }) {
  const [mobileOpen, setMobileOpen] = useState(false)

  return (
    <div className="flex h-screen overflow-hidden">
      {mobileOpen && <div className="sidebar-overlay" onClick={() => setMobileOpen(false)} />}
      <AdminSidebar mobileOpen={mobileOpen} onClose={() => setMobileOpen(false)} />
      <div className="flex flex-col flex-1 overflow-hidden min-w-0">
        <Navbar
          user={user}
          onMenuClick={() => setMobileOpen((v) => !v)}
          portalLabel="Admin Portal"
          profileHref="/admin/profile"
          settingsHref="/admin/settings"
        />
        <main className="flex-1 overflow-auto bg-(--bg-base)">
          <Outlet />
        </main>
      </div>
    </div>
  )
}

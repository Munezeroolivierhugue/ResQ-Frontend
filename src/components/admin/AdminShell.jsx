import { useState } from 'react'
import { Outlet } from 'react-router-dom'
import Navbar from '../layout/Navbar'
import AdminSidebar from '../layout/AdminSidebar'
import { getCurrentUser } from '../../utils/authSession'

export default function AdminShell() {
  const [mobileOpen, setMobileOpen] = useState(false)
  const cu = getCurrentUser()
  const navUser = { name: cu?.full_name || 'System Admin', role: 'SUPER ADMIN' }

  return (
    <div className="flex h-screen overflow-hidden">
      {mobileOpen && <div className="sidebar-overlay" onClick={() => setMobileOpen(false)} />}
      <AdminSidebar mobileOpen={mobileOpen} onClose={() => setMobileOpen(false)} />
      <div className="flex flex-col flex-1 overflow-hidden min-w-0">
        <Navbar
          user={navUser}
          onMenuClick={() => setMobileOpen((v) => !v)}
          portalLabel="System Administration"
          profileHref="/admin/settings/profile"
          settingsHref="/admin/settings/profile"
          avatarVariant="superAdmin"
        />
        <main className="portal-main flex-1 overflow-auto bg-(--bg-base)">
          <Outlet />
        </main>
      </div>
    </div>
  )
}

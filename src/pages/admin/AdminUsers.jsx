import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { UserPlus, Users, Monitor, Mail, UserX, ShieldCheck, ShieldX, Pencil, Key, Upload, Download } from 'lucide-react'
import MetricCard from '../../components/dispatcher/MetricCard'
import StatusBadge from '../../components/dispatcher/StatusBadge'
import AdminPageHeader from '../../components/admin/AdminPageHeader'
import { ADMIN_USERS, adminRoleBadge } from '../../data/mockAdminData'
import { ADMIN_PENDING_INVITES } from '../../data/mockAdminData'

const ROLE_FILTERS = ['All Roles', 'Dispatcher', 'Field Responder', 'Ops Manager', 'District Commander', 'Emergency Planner', 'Analyst', 'Super Admin']
const STATUS_FILTERS = ['All', 'Active', 'Pending', 'Suspended']

function statusVariant(s) {
  if (s === 'ACTIVE') return 'resolved'
  if (s === 'PENDING') return 'handover'
  return 'critical'
}

function showToast(setToast, msg) {
  setToast(msg)
  setTimeout(() => setToast(null), 2500)
}

export default function AdminUsers() {
  const navigate = useNavigate()
  const [users, setUsers] = useState(() => ADMIN_USERS.map((u) => ({ ...u })))
  const [roleFilter, setRoleFilter] = useState('All Roles')
  const [statusFilter, setStatusFilter] = useState('All')
  const [toast, setToast] = useState(null)

  function handleActivate(user_id) {
    setUsers((prev) => prev.map((u) => u.user_id === user_id ? { ...u, status: 'ACTIVE' } : u))
    showToast(setToast, 'User activated')
  }

  function handleAction(msg) {
    showToast(setToast, msg)
  }

  return (
    <div className="portal-page flex flex-col gap-5 min-w-[1024px]">
      {toast && (
        <div className="fixed bottom-5 right-5 z-[9999] dispatcher-surface px-4 py-2.5 text-[13px] font-medium shadow-lg" style={{ borderLeft: '3px solid var(--accent)' }}>
          {toast}
        </div>
      )}
      <AdminPageHeader
        title="User Management"
        subtitle="All accounts, roles, and access control."
        eyebrow="Super Admin Portal"
        badge=" System Users"
        actions={
          <button type="button" className="dispatcher-btn-primary inline-flex items-center gap-2" onClick={() => navigate('/admin/users/invite')}>
            <UserPlus size={16} />
            Invite New User
          </button>
        }
      />

      <div className="portal-grid-4">
        <MetricCard icon={Users} label="Total Users" value="47" hintTone="neutral" />
        <MetricCard icon={Monitor} label="Active Sessions" value="12" hintTone="neutral" />
        <MetricCard
          icon={Mail}
          label="Pending Invitations"
          value={String(ADMIN_PENDING_INVITES)}
          className="dispatcher-metric-card--alert"
          hintTone="neutral"
        />
        <MetricCard icon={UserX} label="Suspended Accounts" value="2" hintTone="warning" className="dispatcher-metric-card--alert" />
      </div>

      <div className="flex flex-wrap gap-2 items-center">
        <input className="dispatcher-input h-10 flex-1 min-w-[200px]" placeholder="Search by name, email, or district..." />
        <div className="flex flex-wrap gap-1">
          {ROLE_FILTERS.map((r) => (
            <button
              key={r}
              type="button"
              className="text-[10px] font-semibold px-2.5 py-1 rounded-full border cursor-pointer"
              style={{
                background: roleFilter === r ? 'var(--accent-ghost)' : 'var(--bg-elevated)',
                borderColor: roleFilter === r ? 'var(--accent)' : 'var(--border)',
                color: roleFilter === r ? 'var(--accent)' : 'var(--text-secondary)',
              }}
              onClick={() => setRoleFilter(r)}
            >
              {r}
            </button>
          ))}
        </div>
        <div className="flex flex-wrap gap-1">
          {STATUS_FILTERS.map((s) => (
            <button
              key={s}
              type="button"
              className="text-[10px] font-semibold px-2.5 py-1 rounded-full border cursor-pointer"
              style={{
                background: statusFilter === s ? 'var(--accent-ghost)' : 'var(--bg-elevated)',
                borderColor: statusFilter === s ? 'var(--accent)' : 'var(--border)',
                color: statusFilter === s ? 'var(--accent)' : 'var(--text-secondary)',
              }}
              onClick={() => setStatusFilter(s)}
            >
              {s}
            </button>
          ))}
        </div>
      </div>

      <div className="dispatcher-surface overflow-x-auto">
        <table className="w-full text-[12px] min-w-[960px]">
          <thead>
            <tr className="text-(--text-muted) border-b border-(--border)">
              <th className="text-left p-3">User</th>
              <th className="text-left p-3">Role</th>
              <th className="p-3">District</th>
              <th className="p-3">Status</th>
              <th className="p-3">Last Login</th>
              <th className="p-3">Session</th>
              <th className="p-3">MFA</th>
              <th className="p-3">Actions</th>
            </tr>
          </thead>
          <tbody>
            {users.map((u) => {
              const rb = adminRoleBadge(u.role)
              return (
                <tr
                  key={u.user_id}
                  className="border-b border-(--border-subtle) dispatcher-table-row group"
                  style={{
                    background: u.tint === 'medium' ? 'var(--status-medium-bg)' : u.tint === 'critical' ? 'var(--status-critical-bg)' : undefined,
                    opacity: u.opacity ?? 1,
                  }}
                >
                  <td className="p-3">
                    <div className="flex items-center gap-2">
                      <span
                        className="w-8 h-8 rounded-full flex items-center justify-center text-[11px] font-bold shrink-0"
                        style={{ background: 'var(--accent-ghost)', color: 'var(--accent)' }}
                      >
                        {u.initials}
                      </span>
                      <div>
                        <div className="font-medium text-[13px]">{u.name}</div>
                        <div className="font-mono text-[11px] text-(--text-muted)">{u.email}</div>
                      </div>
                    </div>
                  </td>
                  <td className="p-3">
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded" style={{ background: rb.bg, color: rb.color }}>
                      {rb.label}
                    </span>
                  </td>
                  <td className="p-3 text-(--text-secondary)">{u.district}</td>
                  <td className="p-3">
                    <StatusBadge label={u.status} variant={statusVariant(u.status)} />
                  </td>
                  <td className="p-3 font-mono text-(--text-muted)">{u.last_login}</td>
                  <td className="p-3">
                    <span className="flex items-center gap-1 text-[11px]">
                      <span
                        className="w-1.5 h-1.5 rounded-full"
                        style={{ background: u.session === 'ONLINE' ? 'var(--status-low)' : 'var(--text-muted)' }}
                      />
                      {u.session}
                    </span>
                  </td>
                  <td className="p-3">
                    {u.mfa_enabled ? <ShieldCheck size={16} style={{ color: 'var(--status-low)' }} /> : <ShieldX size={16} style={{ color: 'var(--status-critical)' }} />}
                  </td>
                  <td className="p-3">
                    <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      {u.status === 'PENDING' && (
                        <button type="button" className="dispatcher-btn-ghost text-[10px] h-7 px-2" style={{ color: 'var(--status-low)' }} onClick={() => handleActivate(u.user_id)}>Activate</button>
                      )}
                      <button type="button" className="dispatcher-btn-icon" aria-label="Edit" onClick={() => handleAction('Action recorded')}><Pencil size={14} /></button>
                      <button type="button" className="dispatcher-btn-icon" aria-label="Suspend" onClick={() => handleAction('Action recorded')}><UserX size={14} /></button>
                      <button type="button" className="dispatcher-btn-icon" aria-label="Reset password" onClick={() => handleAction('Action recorded')}><Key size={14} /></button>
                    </div>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>

      <div className="dispatcher-surface p-4">
        <h3 className="text-[13px] font-semibold m-0">Bulk User Import</h3>
        <p className="text-[12px] text-(--text-muted) m-0 mb-3">Import multiple users from CSV</p>
        <div
          className="flex items-center justify-center gap-2 rounded-lg mb-3"
          style={{ height: 80, border: '2px dashed var(--border)', background: 'var(--bg-elevated)' }}
        >
          <Upload size={20} className="text-(--text-muted)" />
          <span className="text-[13px] text-(--text-muted)">Drop CSV file here or browse</span>
        </div>
        <a href="#" className="text-[12px] font-semibold text-(--accent) inline-flex items-center gap-1 no-underline hover:underline">
          <Download size={12} />
          Download CSV Template
        </a>
        <button type="button" className="dispatcher-btn-primary mt-3 block" disabled>
          Import Users
        </button>
      </div>
    </div>
  )
}

import { Link } from 'react-router-dom'
import { mockInvitedUsers } from '../../data/mockAuthData'
import { ASSIGNED_ROLES } from '../../data/mockAuthData'

const statusStyle = {
  pending: { color: 'var(--status-medium)', bg: 'var(--status-medium-bg)' },
  active: { color: 'var(--status-low)', bg: 'var(--status-low-bg)' },
}

export default function AdminUsers() {
  return (
    <div className="portal-page">
      <div className="flex items-center justify-between mb-5">
        <div>
          <h1 className="text-2xl font-bold m-0" style={{ fontFamily: 'var(--font-display)' }}>
            Provisioned users
          </h1>
          <p className="text-[13px] text-(--text-secondary) m-0 mt-1">
            Users created by super admin awaiting or completed onboarding.
          </p>
        </div>
        <Link to="/admin" className="auth-primary-btn no-underline" style={{ width: 'auto' }}>
          Invite user
        </Link>
      </div>

      <div className="rounded-xl border border-(--border) bg-(--bg-surface) table-scroll shadow-[var(--shadow-card)]">
        <table className="w-full border-collapse text-[13px] min-w-[640px]">
          <thead>
            <tr className="bg-(--bg-base) border-b border-(--border)">
              {['Name', 'Email', 'Phone', 'Role', 'Status', 'Invited'].map((h) => (
                <th key={h} className="text-left px-4 py-3 field-label">
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {mockInvitedUsers.map((u) => {
              const roleLabel = ASSIGNED_ROLES.find((r) => r.value === u.role)?.label || u.role
              const st = statusStyle[u.status] || statusStyle.pending
              return (
                <tr key={u.id} className="border-b border-(--border-subtle) hover:bg-(--bg-elevated)">
                  <td className="px-4 py-3 font-semibold">{u.fullName}</td>
                  <td className="px-4 py-3" style={{ fontFamily: 'var(--font-mono)' }}>{u.email}</td>
                  <td className="px-4 py-3 text-(--text-secondary)">{u.phone}</td>
                  <td className="px-4 py-3">{roleLabel}</td>
                  <td className="px-4 py-3">
                    <span
                      className="text-[10px] font-bold uppercase px-2 py-0.5 rounded"
                      style={{ color: st.color, background: st.bg }}
                    >
                      {u.status}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-(--text-muted)">{u.invitedAt}</td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </div>
  )
}

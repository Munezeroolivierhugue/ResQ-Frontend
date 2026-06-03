import { Link } from 'react-router-dom'
import { Download, ShieldAlert } from 'lucide-react'
import StatusBadge from '../../components/dispatcher/StatusBadge'
import AdminPageHeader from '../../components/admin/AdminPageHeader'
import { ADMIN_AUDIT_ROWS, ADMIN_SECURITY_EVENTS, adminRoleBadge } from '../../data/mockAdminData'

export default function AdminAudit() {
  return (
    <div className="portal-page flex flex-col gap-4 min-w-[1024px]">
      <AdminPageHeader
        title="Audit Trail"
        subtitle="Complete timestamped record of every system action."
        actions={
          <button type="button" className="dispatcher-btn-ghost inline-flex items-center gap-2">
            <Download size={14} />
            Export CSV
          </button>
        }
      />

      <div className="flex flex-wrap gap-2 items-end">
        <input type="date" className="dispatcher-input h-9 w-36" defaultValue="2026-05-01" />
        <input type="date" className="dispatcher-input h-9 w-36" defaultValue="2026-05-28" />
        <select className="dispatcher-input h-9 w-32 text-[12px]"><option>All users</option></select>
        <select className="dispatcher-input h-9 w-32 text-[12px]"><option>All roles</option></select>
        <select className="dispatcher-input h-9 w-36 text-[12px]"><option>All actions</option></select>
        <select className="dispatcher-input h-9 w-32 text-[12px]"><option>All modules</option></select>
        <div className="flex gap-1">
          {['All', 'Success', 'Failed', 'Warning'].map((s) => (
            <button key={s} type="button" className="text-[10px] font-semibold px-2 py-1 rounded-full border" style={{ borderColor: 'var(--border)' }}>{s}</button>
          ))}
        </div>
        <button type="button" className="dispatcher-btn-primary text-[12px] h-9 px-3">Apply Filters</button>
        <button type="button" className="text-[12px] text-(--accent) bg-transparent border-none cursor-pointer">Clear</button>
      </div>

      <div className="flex flex-col lg:flex-row gap-4">
        <div className="dispatcher-surface overflow-x-auto flex-1 min-w-0">
          <table className="w-full text-[12px] min-w-[800px]">
            <thead>
              <tr className="text-(--text-muted) border-b border-(--border)">
                <th className="text-left p-3">Timestamp</th>
                <th className="text-left p-3">User</th>
                <th className="p-3">Role</th>
                <th className="text-left p-3">Action</th>
                <th className="p-3">Module</th>
                <th className="p-3">IP</th>
                <th className="p-3">Status</th>
              </tr>
            </thead>
            <tbody>
              {ADMIN_AUDIT_ROWS.map((row, i) => {
                const rb = adminRoleBadge(row.role.toLowerCase().includes('dispatcher') ? 'dispatcher' : 'ops_manager')
                const bg =
                  row.status === 'FAILED'
                    ? 'var(--status-critical-bg)'
                    : row.status === 'WARNING'
                      ? 'var(--status-medium-bg)'
                      : undefined
                return (
                  <tr key={i} className="border-b border-(--border-subtle)" style={{ background: bg }}>
                    <td className="p-3 font-mono text-(--text-muted)">{row.timestamp}</td>
                    <td className="p-3 font-medium">{row.role}</td>
                    <td className="p-3">
                      <span className="text-[10px] font-bold px-1.5 py-0.5 rounded" style={{ background: rb.bg, color: rb.color }}>ROLE</span>
                    </td>
                    <td className="p-3">{row.action}</td>
                    <td className="p-3">
                      <span className="font-mono text-[10px] px-1.5 py-0.5 rounded bg-(--bg-elevated)">{row.module}</span>
                    </td>
                    <td className="p-3 font-mono text-(--text-muted)">{row.ip}</td>
                    <td className="p-3">
                      <StatusBadge
                        label={row.status}
                        variant={row.status === 'SUCCESS' ? 'resolved' : row.status === 'FAILED' ? 'critical' : 'handover'}
                      />
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
          <div className="dispatcher-table-footer flex justify-between items-center p-3">
            <span className="text-[12px] text-(--text-muted)">Showing 1–15 of 1,247 entries</span>
            <div className="flex gap-2">
              <button type="button" className="dispatcher-btn-ghost text-[11px] h-8" disabled>Previous</button>
              <button type="button" className="dispatcher-btn-ghost text-[11px] h-8">Next</button>
            </div>
          </div>
        </div>

        <div className="dispatcher-surface p-4 w-full lg:w-[30%] shrink-0">
          <div className="flex items-center gap-2 mb-4">
            <ShieldAlert size={16} style={{ color: 'var(--status-critical)' }} />
            <span className="font-semibold text-[13px]">Security Events</span>
            <span className="ml-auto text-[10px] font-bold px-1.5 rounded" style={{ background: 'var(--status-critical-bg)', color: 'var(--status-critical)' }}>5</span>
          </div>
          {ADMIN_SECURITY_EVENTS.map((e) => (
            <div key={e.type} className="py-3 border-b border-(--border-subtle) border-l-[3px] pl-3" style={{ borderLeftColor: 'var(--status-critical)' }}>
              <div className="font-mono text-[10px] uppercase" style={{ color: 'var(--status-critical)' }}>{e.type}</div>
              <div className="font-medium text-[13px] mt-1">{e.desc}</div>
              <div className="text-[12px] text-(--text-secondary)">{e.detail}</div>
              <div className="font-mono text-[11px] text-(--text-muted) mt-1">{e.time}</div>
            </div>
          ))}
          <Link to="/admin/security" className="text-[12px] font-semibold text-(--accent) mt-3 inline-block no-underline hover:underline">
            View All Security Events →
          </Link>
        </div>
      </div>
    </div>
  )
}

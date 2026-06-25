import { useState } from 'react'
import { Shield, Mail, Lock } from 'lucide-react'
import AdminPageHeader from '../../components/admin/AdminPageHeader'
import ConfirmDangerModal from '../../components/admin/ConfirmDangerModal'
import { ADMIN_MFA_ROLES, ADMIN_ACTIVE_SESSIONS, ADMIN_IP_RANGES, adminRoleBadge } from '../../data/mockAdminData'

export default function AdminSecurity() {
  const [sessions, setSessions] = useState(() => ADMIN_ACTIVE_SESSIONS.map((s) => ({ ...s })))
  const [revokeId, setRevokeId] = useState(null)
  const [toast, setToast] = useState(null)

  function showToast(msg) {
    setToast(msg)
    setTimeout(() => setToast(null), 2500)
  }

  function handleConfirmRevoke() {
    if (revokeId === 'all') {
      setSessions([])
      showToast('All sessions revoked')
    } else {
      setSessions((prev) => prev.filter((s) => s.session_id !== revokeId))
      showToast('Session revoked')
    }
    setRevokeId(null)
  }

  return (
    <div className="portal-page flex flex-col gap-5 min-w-[1024px]">
      {toast && (
        <div className="fixed bottom-5 right-5 z-[9999] dispatcher-surface px-4 py-2.5 text-[13px] font-medium shadow-lg" style={{ borderLeft: '3px solid var(--accent)' }}>
          {toast}
        </div>
      )}

      <AdminPageHeader title="Security Management" subtitle="MFA compliance, sessions, and security policies." eyebrow="Super Admin Portal" badge="2 Open Alerts" />

      <div className="dispatcher-surface p-4">
        <div className="flex flex-wrap justify-between gap-3 mb-4">
          <div className="flex items-center gap-2">
            <Shield size={16} style={{ color: 'var(--accent)' }} />
            <span className="font-semibold text-[14px]">MFA Compliance by Role</span>
          </div>
          <button type="button" className="dispatcher-btn-ghost text-[11px] h-8 inline-flex items-center gap-1">
            <Mail size={12} />
            Send Reminder to All Non-Compliant
          </button>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
          {ADMIN_MFA_ROLES.map((r) => {
            const pct = Math.round((r.enabled / r.total) * 100)
            const met = pct === 100
            return (
              <div key={r.role}>
                <div className="flex justify-between text-[13px] font-medium mb-1">
                  <span>{r.role}</span>
                  <span className="font-mono text-[12px]">{r.enabled}/{r.total} · {pct}%</span>
                </div>
                <div className="h-2 rounded-full bg-(--border) overflow-hidden">
                  <div className="h-full rounded-full" style={{ width: `${pct}%`, background: met ? 'var(--accent)' : 'var(--status-critical)' }} />
                </div>
                <span className="text-[10px] font-mono mt-1 inline-block" style={{ color: met ? 'var(--status-low)' : 'var(--status-critical)' }}>
                  {met ? '✓ 100% REQUIRED' : '100% REQUIRED'}
                </span>
              </div>
            )
          })}
        </div>
        <table className="w-full text-[12px]">
          <thead>
            <tr className="text-(--text-muted) border-b border-(--border)">
              <th className="text-left py-2">User</th>
              <th className="text-left py-2">Role</th>
              <th className="py-2">Last Login</th>
              <th className="py-2">MFA</th>
              <th className="py-2">Action</th>
            </tr>
          </thead>
          <tbody>
            {[
              { name: 'Jean Bosco Nkurunziza', role: 'dispatcher', login: 'Today' },
              { name: 'Habimana J.', role: 'field_responder', login: 'Today' },
            ].map((u) => (
              <tr key={u.name} className="border-b border-(--border-subtle)">
                <td className="py-2">{u.name}</td>
                <td className="py-2">{u.role}</td>
                <td className="py-2">{u.login}</td>
                <td className="py-2" style={{ color: 'var(--status-critical)' }}>NOT ENABLED</td>
                <td className="py-2">
                  <button type="button" className="dispatcher-btn-ghost text-[10px] h-7">Send Setup Reminder</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="flex flex-col lg:flex-row gap-4">
        <div className="dispatcher-surface p-4 flex-1 min-w-0">
          <div className="flex flex-wrap justify-between gap-2 mb-4">
            <span className="font-semibold text-[13px]">Active Sessions — {sessions.length} online</span>
            <button
              type="button"
              className="text-[11px] font-bold px-3 py-1 rounded border cursor-pointer"
              style={{ borderColor: 'var(--status-critical)', color: 'var(--status-critical)' }}
              onClick={() => setRevokeId('all')}
            >
              Revoke All Sessions
            </button>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-[12px] min-w-[640px]">
              <thead>
                <tr className="text-(--text-muted) border-b border-(--border)">
                  <th className="text-left p-2">User</th>
                  <th className="p-2">Role</th>
                  <th className="text-left p-2">Device</th>
                  <th className="p-2">IP Address</th>
                  <th className="p-2">Login</th>
                  <th className="p-2">Action</th>
                </tr>
              </thead>
              <tbody>
                {sessions.map((s) => {
                  const rb = adminRoleBadge(s.role)
                  return (
                    <tr key={s.session_id} className="border-b border-(--border-subtle)">
                      <td className="p-2 font-medium">{s.user}</td>
                      <td className="p-2">
                        <span className="text-[10px] font-bold px-1.5 rounded" style={{ background: rb.bg, color: rb.color }}>{rb.label}</span>
                      </td>
                      <td className="p-2 text-(--text-secondary)">{s.device}</td>
                      <td className="p-2 font-mono">{s.ip_address}</td>
                      <td className="p-2 font-mono text-(--text-muted)">{s.start_time}</td>
                      <td className="p-2">
                        {s.self ? (
                          <span className="text-[10px] font-bold text-(--accent)">This device</span>
                        ) : (
                          <button
                            type="button"
                            className="dispatcher-btn-ghost text-[10px] h-7 hover:border-(--status-critical) hover:text-(--status-critical)"
                            onClick={() => setRevokeId(s.session_id)}
                          >
                            Revoke
                          </button>
                        )}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>

        <div className="flex flex-col gap-4 lg:w-[45%] shrink-0">
          <div className="dispatcher-surface p-4">
            <h3 className="text-[13px] font-semibold m-0 mb-3">Password Policy</h3>
            {[
              ['Minimum length', 12],
              ['Failed attempts before lockout', 5],
            ].map(([label, val]) => (
              <label key={label} className="flex justify-between items-center text-[12px] mb-2">
                <span>{label}</span>
                <input type="number" className="dispatcher-input h-9 w-16" defaultValue={val} />
              </label>
            ))}
            <label className="flex items-center gap-2 text-[12px] mb-2">
              <input type="checkbox" defaultChecked />
              Complexity required (uppercase, numbers, symbols)
            </label>
            <select className="dispatcher-input h-9 w-full text-[12px] mb-2" defaultValue="90 days">
              <option>90 days maximum age</option>
            </select>
            <button type="button" className="dispatcher-btn-primary w-full text-[12px] mt-2">Save Policy</button>
          </div>

          <div className="dispatcher-surface p-4">
            <h3 className="text-[13px] font-semibold m-0">IP Allowlist</h3>
            <p className="text-[12px] text-(--text-muted) m-0 mb-2">Restrict access to these network ranges only</p>
            <label className="flex items-center gap-2 text-[12px] mb-3">
              <input type="checkbox" />
              Allowlist enforced: OFF
            </label>
            {ADMIN_IP_RANGES.map((ip) => (
              <div key={ip.range} className="flex justify-between items-center py-2 border-b border-(--border-subtle) text-[12px]">
                <span className="font-mono">{ip.range}</span>
                <span className="text-(--text-secondary)">{ip.label}</span>
                <button type="button" className="text-(--status-critical) bg-transparent border-none cursor-pointer text-[14px]">×</button>
              </div>
            ))}
            <button type="button" className="dispatcher-btn-ghost text-[11px] h-8 mt-2 w-full">+ Add IP Range</button>
          </div>

          <div className="dispatcher-surface p-4">
            <h3 className="text-[13px] font-semibold m-0 mb-3">Encryption Status</h3>
            {[
              { label: 'Data at Rest', detail: 'AES-256 Encrypted · All databases' },
              { label: 'Data in Transit', detail: 'TLS 1.3 · All API connections' },
            ].map((e) => (
              <div key={e.label} className="flex gap-2 items-start text-[12px] mb-2">
                <Lock size={14} style={{ color: 'var(--status-low)' }} />
                <div>
                  <div className="font-medium">{e.label}</div>
                  <div className="text-(--text-secondary)">{e.detail}</div>
                </div>
              </div>
            ))}
            <p className="font-mono text-[11px] text-(--text-muted) m-0">Last audit: May 1, 2026</p>
          </div>
        </div>
      </div>

      <ConfirmDangerModal
        open={revokeId !== null}
        title={revokeId === 'all' ? 'Revoke all sessions?' : 'Revoke this session?'}
        message={
          revokeId === 'all'
            ? 'This will log out ALL users immediately. Use only for security emergencies.'
            : 'The user will be logged out immediately and must sign in again.'
        }
        confirmLabel={revokeId === 'all' ? 'Revoke All' : 'Revoke Session'}
        onConfirm={handleConfirmRevoke}
        onCancel={() => setRevokeId(null)}
      />
    </div>
  )
}

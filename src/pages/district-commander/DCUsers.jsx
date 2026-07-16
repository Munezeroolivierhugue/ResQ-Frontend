import { useState, useEffect, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { UserPlus, FileText, Pencil, Send, X, Users as UsersIcon, UserCheck, Mail, UserX } from 'lucide-react'
import DCPageHeader from '../../components/district-commander/DCPageHeader'
import StatusBadge from '../../components/dispatcher/StatusBadge'
import MetricCard from '../../components/dispatcher/MetricCard'
import { listUsers, updateUser, resendInvite } from '../../api/users'
import { listVehicles } from '../../api/vehicles'
import { getCurrentUser } from '../../utils/authSession'
import { getDistrictCommanderDistrict } from '../../utils/districtCommanderSession'
import { buildPdfHtml, openPdfWindow, sectionHtml, tableHtml } from '../../utils/pdfExport'

const SHIFT_OPTIONS = [
  { value: 'MORNING',  label: 'Morning (07:00 – 15:00)' },
  { value: 'EVENING',  label: 'Evening (15:00 – 23:00)' },
  { value: 'NIGHT',    label: 'Night (23:00 – 07:00)' },
  { value: 'ROTATING', label: 'Rotating / Not fixed' },
]

const ROLE_LABELS = {
  FIELD_RESPONDER: 'Field Responder',
  OPERATIONS_MANAGER: 'Operations Manager',
}

const ROLE_FILTERS = ['All Roles', 'Field Responder', 'Operations Manager']
const STATUS_FILTERS = ['All', 'Active', 'Pending', 'Suspended']

function statusVariant(s) {
  if (s === 'ACTIVE') return 'resolved'
  if (s === 'PENDING') return 'handover'
  return 'critical'
}

function initials(name) {
  return (name || '').split(' ').map((n) => n[0]).filter(Boolean).join('').slice(0, 2).toUpperCase()
}

function showToast(setToast, msg) {
  setToast(msg)
  setTimeout(() => setToast(null), 2500)
}

function EditUserModal({ user, vehicles, onClose, onSaved }) {
  const [form, setForm] = useState({
    fullName: user.full_name ?? '',
    email: user.email ?? '',
    phone: user.phone_number ?? '',
    vehicleId: user.current_vehicle_id ?? '',
    shiftType: user.shift_type ?? '',
  })
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }))
  const isFR = user.role === 'FIELD_RESPONDER'

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!form.fullName.trim()) { setError('Full name is required.'); return }
    setSaving(true)
    setError('')
    try {
      await updateUser(user.user_id, {
        full_name: form.fullName.trim(),
        email: form.email.trim() || undefined,
        phone_number: form.phone || undefined,
        vehicle_id: isFR && form.vehicleId ? form.vehicleId : undefined,
        shift_type: form.shiftType || undefined,
      })
      onSaved({
        ...user,
        full_name: form.fullName,
        email: form.email,
        phone_number: form.phone,
        current_vehicle_id: form.vehicleId || user.current_vehicle_id,
        shift_type: form.shiftType || user.shift_type,
      })
    } catch (err) {
      setError(err?.response?.data?.message || 'Failed to save changes.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center" style={{ background: 'rgba(0,0,0,0.6)' }}>
      <div className="dispatcher-surface p-6 w-full max-w-lg rounded-xl shadow-2xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-5">
          <div>
            <h2 className="text-[16px] font-bold m-0">Edit User</h2>
            <p className="text-[12px] text-(--text-muted) mt-0.5 m-0">{ROLE_LABELS[user.role] ?? user.role}</p>
          </div>
          <button type="button" onClick={onClose} className="dispatcher-btn-icon"><X size={18} /></button>
        </div>
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <label className="dispatcher-field">
            <span className="field-label">Full Name *</span>
            <input className="dispatcher-input text-[13px] h-9" value={form.fullName}
              onChange={(e) => set('fullName', e.target.value)} required />
          </label>
          <label className="dispatcher-field">
            <span className="field-label">Email</span>
            <input className="dispatcher-input text-[13px] h-9" type="email" value={form.email}
              onChange={(e) => set('email', e.target.value)} />
          </label>
          <label className="dispatcher-field">
            <span className="field-label">Phone</span>
            <input className="dispatcher-input text-[13px] h-9" placeholder="+250 7xx xxx xxx" value={form.phone}
              onChange={(e) => set('phone', e.target.value)} />
          </label>
          <label className="dispatcher-field">
            <span className="field-label">Shift Schedule</span>
            <select className="dispatcher-input dispatcher-select text-[13px] h-9" value={form.shiftType}
              onChange={(e) => set('shiftType', e.target.value)}>
              <option value="">— No change —</option>
              {SHIFT_OPTIONS.map((s) => <option key={s.value} value={s.value}>{s.label}</option>)}
            </select>
          </label>
          {isFR && (
            <label className="dispatcher-field">
              <span className="field-label">Assigned Vehicle</span>
              <select className="dispatcher-input dispatcher-select text-[13px] h-9" value={form.vehicleId}
                onChange={(e) => set('vehicleId', e.target.value)}>
                <option value="">— No vehicle —</option>
                {vehicles.map((v) => (
                  <option key={v.vehicle_id} value={v.vehicle_id}>
                    {v.plate_number} · {v.vehicle_type?.replace(/_/g, ' ')}
                  </option>
                ))}
              </select>
            </label>
          )}
          {error && <p className="text-[12px] m-0" style={{ color: 'var(--status-critical)' }}>{error}</p>}
          <div className="flex gap-2 justify-end mt-2">
            <button type="button" className="dispatcher-btn-ghost" onClick={onClose}>Cancel</button>
            <button type="submit" className="dispatcher-btn-primary" disabled={saving}>
              {saving ? 'Saving…' : 'Save Changes'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default function DCUsers() {
  const navigate = useNavigate()
  const districtId = getCurrentUser()?.district_id
  const districtName = getDistrictCommanderDistrict()

  const [users, setUsers] = useState([])
  const [vehicles, setVehicles] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [roleFilter, setRoleFilter] = useState('All Roles')
  const [statusFilter, setStatusFilter] = useState('All')
  const [editingUser, setEditingUser] = useState(null)
  const [toast, setToast] = useState(null)
  const [actingId, setActingId] = useState(null)

  useEffect(() => {
    if (!districtId) { Promise.resolve().then(() => setLoading(false)); return }
    listUsers()
      .then((all) => setUsers(all.filter((u) =>
        u.district_id === districtId && (u.role === 'FIELD_RESPONDER' || u.role === 'OPERATIONS_MANAGER')
      )))
      .catch(() => {})
      .finally(() => setLoading(false))
    listVehicles({ districtId }).then(setVehicles).catch(() => {})
  }, [districtId])

  const displayed = useMemo(() => {
    let list = users
    if (search.trim()) {
      const q = search.trim().toLowerCase()
      list = list.filter((u) => (u.full_name || '').toLowerCase().includes(q) || (u.email || '').toLowerCase().includes(q))
    }
    if (roleFilter !== 'All Roles') {
      const role = roleFilter === 'Field Responder' ? 'FIELD_RESPONDER' : 'OPERATIONS_MANAGER'
      list = list.filter((u) => u.role === role)
    }
    if (statusFilter !== 'All') {
      list = list.filter((u) => u.status === statusFilter.toUpperCase())
    }
    return list
  }, [users, search, roleFilter, statusFilter])

  async function handleReinvite(u) {
    setActingId(u.user_id)
    try {
      await resendInvite(u.user_id)
      showToast(setToast, `Invitation resent to ${u.email}`)
    } catch (err) {
      showToast(setToast, err?.response?.data?.message ?? 'Failed to resend invitation')
    } finally {
      setActingId(null)
    }
  }

  function handleEditSaved(updated) {
    setUsers((prev) => prev.map((u) => (u.user_id === updated.user_id ? { ...u, ...updated } : u)))
    setEditingUser(null)
    showToast(setToast, 'User updated successfully')
  }

  function handleGeneratePdf() {
    const cu = getCurrentUser()
    const rows = displayed.map((u) => [
      u.full_name ?? '—',
      u.email ?? '—',
      ROLE_LABELS[u.role] ?? u.role,
      u.status ?? '—',
      u.last_login ? new Date(u.last_login).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) : '—',
    ])
    openPdfWindow(buildPdfHtml({
      title: 'District User Roster',
      subtitle: `${districtName ?? 'District'} · Field Responders & Operations Managers`,
      reportType: 'USER ROSTER',
      idPrefix: 'USR',
      metaItems: [
        { label: 'District', value: districtName ?? '—' },
        { label: 'Total Users', value: String(users.length) },
      ],
      kpis: [
        { label: 'Total Users', value: String(users.length), sub: 'In this district' },
        { label: 'Active', value: String(users.filter((u) => u.status === 'ACTIVE').length), sub: 'Accepted invitation' },
        { label: 'Pending', value: String(users.filter((u) => u.status === 'PENDING').length), sub: 'Awaiting activation' },
        { label: 'Suspended', value: String(users.filter((u) => u.status === 'SUSPENDED').length), sub: 'Access revoked' },
      ],
      sections: [sectionHtml('User Roster', tableHtml(['Name', 'Email', 'Role', 'Status', 'Last Login'], rows))],
      generatedBy: cu?.fullName || 'District Commander',
      generatedRole: 'District Commander',
    }))
  }

  return (
    <div className="portal-page flex flex-col gap-5">
      {toast && (
        <div className="fixed bottom-5 right-5 z-[9999] dispatcher-surface px-4 py-2.5 text-[13px] font-medium shadow-lg" style={{ borderLeft: '3px solid var(--accent)' }}>
          {toast}
        </div>
      )}

      <DCPageHeader
        title="Users"
        subtitle={`Field Responders and Operations Managers provisioned for ${districtName ?? 'your district'}.`}
        action={
          <div className="flex gap-2">
            <button type="button" className="dispatcher-btn-primary inline-flex items-center gap-2" onClick={handleGeneratePdf}>
              <FileText size={14} />
              Generate PDF
            </button>
            <button type="button" className="dispatcher-btn-primary inline-flex items-center gap-2" onClick={() => navigate('/district-commander/users/invite')}>
              <UserPlus size={16} />
              Invite User
            </button>
          </div>
        }
      />

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <MetricCard icon={UsersIcon} label="Total Users" value={loading ? '—' : String(users.length)} hintTone="neutral" />
        <MetricCard icon={UserCheck} label="Active" value={loading ? '—' : String(users.filter((u) => u.status === 'ACTIVE').length)} hintTone="positive" />
        <MetricCard icon={Mail} label="Pending Invitations" value={loading ? '—' : String(users.filter((u) => u.status === 'PENDING').length)} hintTone="neutral" />
        <MetricCard icon={UserX} label="Suspended" value={loading ? '—' : String(users.filter((u) => u.status === 'SUSPENDED').length)} hintTone="warning" />
      </div>

      <div className="flex flex-wrap gap-2 items-center">
        <input
          className="dispatcher-input h-10 flex-1 min-w-[200px]"
          placeholder="Search by name or email..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        <div className="flex flex-wrap gap-1">
          {ROLE_FILTERS.map((r) => (
            <button key={r} type="button" className="text-[10px] font-semibold px-2.5 py-1 rounded-full border cursor-pointer"
              style={{
                background: roleFilter === r ? 'var(--accent-ghost)' : 'var(--bg-elevated)',
                borderColor: roleFilter === r ? 'var(--accent)' : 'var(--border)',
                color: roleFilter === r ? 'var(--accent)' : 'var(--text-secondary)',
              }}
              onClick={() => setRoleFilter(r)}>
              {r}
            </button>
          ))}
        </div>
        <div className="flex flex-wrap gap-1">
          {STATUS_FILTERS.map((s) => (
            <button key={s} type="button" className="text-[10px] font-semibold px-2.5 py-1 rounded-full border cursor-pointer"
              style={{
                background: statusFilter === s ? 'var(--accent-ghost)' : 'var(--bg-elevated)',
                borderColor: statusFilter === s ? 'var(--accent)' : 'var(--border)',
                color: statusFilter === s ? 'var(--accent)' : 'var(--text-secondary)',
              }}
              onClick={() => setStatusFilter(s)}>
              {s}
            </button>
          ))}
        </div>
      </div>

      <div className="dispatcher-surface overflow-x-auto">
        <table className="w-full text-[12px] min-w-[820px]">
          <thead>
            <tr className="text-(--text-muted) border-b border-(--border)">
              <th className="text-left p-3">User</th>
              <th className="text-left p-3">Role</th>
              <th className="text-center p-3">Status</th>
              <th className="text-center p-3">Last Login</th>
              <th className="text-center p-3">Actions</th>
            </tr>
          </thead>
          <tbody>
            {displayed.length === 0 && (
              <tr>
                <td colSpan={5} className="p-6 text-center text-[13px] text-(--text-muted)">
                  {loading ? 'Loading users…' : 'No users found.'}
                </td>
              </tr>
            )}
            {displayed.map((u) => (
              <tr key={u.user_id} className="border-b border-(--border-subtle) dispatcher-table-row group"
                style={{
                  background: u.status === 'SUSPENDED' ? 'var(--status-critical-bg)' : undefined,
                  opacity: u.status === 'SUSPENDED' ? 0.85 : 1,
                }}>
                <td className="p-3">
                  <div className="flex items-center gap-2">
                    <span className="w-8 h-8 rounded-full flex items-center justify-center text-[11px] font-bold shrink-0"
                      style={{ background: 'var(--accent-ghost)', color: 'var(--accent)' }}>
                      {initials(u.full_name)}
                    </span>
                    <div>
                      <div className="font-medium text-[13px]">{u.full_name}</div>
                      <div className="font-mono text-[11px] text-(--text-muted)">{u.email}</div>
                    </div>
                  </div>
                </td>
                <td className="p-3">{ROLE_LABELS[u.role] ?? u.role}</td>
                <td className="p-3 text-center">
                  <StatusBadge label={u.status} variant={statusVariant(u.status)} />
                </td>
                <td className="p-3 text-center font-mono text-(--text-muted)">
                  {u.last_login ? new Date(u.last_login).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) : '—'}
                </td>
                <td className="p-3">
                  <div className="flex gap-1 justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                    {u.status === 'PENDING' && (
                      <button type="button" title="Resend invitation link" className="dispatcher-btn-icon"
                        disabled={actingId === u.user_id} onClick={() => handleReinvite(u)}>
                        <Send size={14} />
                      </button>
                    )}
                    <button type="button" title="Edit user details" className="dispatcher-btn-icon" onClick={() => setEditingUser(u)}>
                      <Pencil size={14} />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        <div className="dispatcher-table-footer flex justify-between items-center p-3">
          <span className="text-[12px] text-(--text-muted)">Showing {displayed.length} of {users.length} users</span>
        </div>
      </div>

      {editingUser && (
        <EditUserModal
          user={editingUser}
          vehicles={vehicles}
          onClose={() => setEditingUser(null)}
          onSaved={handleEditSaved}
        />
      )}
    </div>
  )
}

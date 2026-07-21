import { useState, useEffect, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { UserPlus, FileText, Pencil, Send, X, Users as UsersIcon, UserCheck, Mail, UserX, Search } from 'lucide-react'
import DCPageHeader from '../../components/district-commander/DCPageHeader'
import StatusBadge from '../../components/dispatcher/StatusBadge'
import AdminStatCard from '../../components/admin/AdminStatCard'
import FilterDropdown from '../../components/admin/FilterDropdown'
import ConfirmDangerModal from '../../components/admin/ConfirmDangerModal'
import { updateUser, resendInvite } from '../../api/users'
import { listDistrictUsers, setDistrictUserStatus } from '../../api/districtCommander'
import { listVehicles } from '../../api/vehicles'
import { getCurrentUser } from '../../utils/authSession'
import { getDistrictCommanderDistrict } from '../../utils/districtCommanderSession'
import { buildPdfHtml, openPdfWindow, sectionHtml, tableHtml } from '../../utils/pdfExport'
import { useToastStore } from '../../store/toastStore'

const SHIFT_OPTIONS = [
  { value: 'MORNING',  label: 'Morning (07:00 – 15:00)' },
  { value: 'EVENING',  label: 'Evening (15:00 – 23:00)' },
  { value: 'NIGHT',    label: 'Night (23:00 – 07:00)' },
  { value: 'ROTATING', label: 'Rotating / Not fixed' },
]

// All roles /api/dc/users returns for this district — matches
// DistrictCommanderController.VISIBLE_ROLES on the backend.
const ROLE_LABELS = {
  FIELD_RESPONDER: 'Field Responder',
  OPERATIONS_MANAGER: 'Operations Manager',
  DISPATCHER: 'Dispatcher',
  EMERGENCY_PLANNER: 'Emergency Planner',
  ANALYST: 'Analyst',
}

const ROLE_FILTERS = ['All Roles', 'Field Responder', 'Operations Manager', 'Dispatcher', 'Emergency Planner', 'Analyst']
const STATUS_FILTERS = ['All', 'Active', 'Pending', 'Suspended']

function statusVariant(s) {
  if (s === 'ACTIVE') return 'resolved'
  if (s === 'PENDING') return 'handover'
  return 'critical'
}

function initials(name) {
  return (name || '').split(' ').map((n) => n[0]).filter(Boolean).join('').slice(0, 2).toUpperCase()
}

function showToast(msg, variant = 'success') {
  useToastStore.getState().pushToast({ variant, title: variant === 'error' ? 'Error' : 'Users', message: msg })
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
  const [actingId, setActingId] = useState(null)
  const [statusTarget, setStatusTarget] = useState(null) // user pending suspend/reactivate confirmation

  function refreshUsers() {
    return listDistrictUsers().then(setUsers).catch(() => {})
  }

  useEffect(() => {
    if (!districtId) { Promise.resolve().then(() => setLoading(false)); return }
    refreshUsers().finally(() => setLoading(false))
    listVehicles({ districtId }).then(setVehicles).catch(() => {})
  }, [districtId])

  const displayed = useMemo(() => {
    let list = users
    if (search.trim()) {
      const q = search.trim().toLowerCase()
      list = list.filter((u) => (u.full_name || '').toLowerCase().includes(q) || (u.email || '').toLowerCase().includes(q))
    }
    if (roleFilter !== 'All Roles') {
      const role = Object.entries(ROLE_LABELS).find(([, label]) => label === roleFilter)?.[0]
      if (role) list = list.filter((u) => u.role === role)
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
      showToast(`Invitation resent to ${u.email}`)
    } catch (err) {
      showToast(err?.response?.data?.message ?? 'Failed to resend invitation', 'error')
    } finally {
      setActingId(null)
    }
  }

  async function handleConfirmStatusChange() {
    if (!statusTarget) return
    const { user_id, nextStatus } = statusTarget
    setActingId(user_id)
    try {
      await setDistrictUserStatus(user_id, nextStatus)
      setUsers((prev) => prev.map((u) => (u.user_id === user_id ? { ...u, status: nextStatus } : u)))
      showToast(nextStatus === 'SUSPENDED' ? 'User suspended' : 'User reactivated successfully')
    } catch (err) {
      showToast(err?.response?.data?.message ?? 'Failed to update user status', 'error')
    } finally {
      setActingId(null)
      setStatusTarget(null)
    }
  }

  function handleEditSaved(updated) {
    setUsers((prev) => prev.map((u) => (u.user_id === updated.user_id ? { ...u, ...updated } : u)))
    setEditingUser(null)
    showToast('User updated successfully')
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
      subtitle: `${districtName ?? 'District'} · All district roles`,
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
      <DCPageHeader
        title="Users"
        subtitle={`All district accounts provisioned for ${districtName ?? 'your district'}.`}
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
        <AdminStatCard icon={UsersIcon} label="Total Users" value={loading ? '—' : String(users.length)} />
        <AdminStatCard icon={UserCheck} label="Active" value={loading ? '—' : String(users.filter((u) => u.status === 'ACTIVE').length)} />
        <AdminStatCard icon={Mail} label="Pending Invitations" value={loading ? '—' : String(users.filter((u) => u.status === 'PENDING').length)} />
        <AdminStatCard icon={UserX} label="Suspended" value={loading ? '—' : String(users.filter((u) => u.status === 'SUSPENDED').length)} />
      </div>

      <div className="flex flex-nowrap items-center gap-2">
        <div className="relative w-56 shrink-0">
          <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-(--text-muted)" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by name or email…"
            className="dispatcher-input h-8 w-full rounded-full pl-8 pr-3 text-[11px]"
            style={{ borderRadius: 9999 }}
          />
        </div>
        <div className="ml-auto">
          <FilterDropdown
            label="All Roles"
            value={roleFilter}
            onChange={setRoleFilter}
            options={ROLE_FILTERS.map((r) => ({ value: r, label: r }))}
          />
        </div>
        <FilterDropdown
          label="All Statuses"
          value={statusFilter}
          onChange={setStatusFilter}
          options={STATUS_FILTERS.map((s) => ({ value: s, label: s === 'All' ? 'All statuses' : s }))}
        />
      </div>

      <div className="dispatcher-surface table-scroll">
        <table className="w-full min-w-[860px] text-left border-collapse text-[12px]">
          <thead>
            <tr className="text-[12px] font-medium text-(--text-secondary) border-b border-(--border-subtle)">
              <th className="py-2 px-3 font-bold">User</th>
              <th className="py-2 px-3 font-bold text-center">Role</th>
              <th className="py-2 px-3 font-bold text-center">Status</th>
              <th className="py-2 px-3 font-bold text-center">Last Login</th>
              <th className="py-2 px-3 font-bold text-center">Actions</th>
            </tr>
          </thead>
          <tbody>
            {displayed.length === 0 && (
              <tr>
                <td colSpan={5} className="py-6 text-center text-[13px] text-(--text-muted)">
                  {loading ? 'Loading users…' : 'No users found.'}
                </td>
              </tr>
            )}
            {displayed.map((u) => (
              <tr key={u.user_id} className="border-b border-(--border-subtle) last:border-0 dispatcher-table-row group"
                style={{
                  background: u.status === 'SUSPENDED' ? 'var(--status-critical-bg)' : undefined,
                  opacity: u.status === 'SUSPENDED' ? 0.85 : 1,
                }}>
                <td className="py-3 px-3">
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
                <td className="py-3 px-3 text-center">{ROLE_LABELS[u.role] ?? u.role}</td>
                <td className="py-3 px-3 text-center">
                  <StatusBadge label={u.status} variant={statusVariant(u.status)} />
                </td>
                <td className="py-3 px-3 text-center">
                  {u.last_login ? new Date(u.last_login).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) : '—'}
                </td>
                <td className="py-3 px-3">
                  <div className="flex gap-1 justify-center">
                    {u.status === 'PENDING' && (
                      <button type="button" title="Resend invitation link" className="dispatcher-btn-icon"
                        disabled={actingId === u.user_id} onClick={() => handleReinvite(u)}>
                        <Send size={14} />
                      </button>
                    )}
                    {(u.status === 'ACTIVE' || u.status === 'SUSPENDED') && (
                      <button
                        type="button"
                        title={u.status === 'ACTIVE' ? 'Suspend account' : 'Reactivate account'}
                        className="dispatcher-btn-icon"
                        disabled={actingId === u.user_id}
                        onClick={() => setStatusTarget({ user_id: u.user_id, name: u.full_name, nextStatus: u.status === 'ACTIVE' ? 'SUSPENDED' : 'ACTIVE' })}
                      >
                        {u.status === 'ACTIVE' ? <UserX size={14} /> : <UserCheck size={14} />}
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

      <ConfirmDangerModal
        open={!!statusTarget}
        title={statusTarget?.nextStatus === 'SUSPENDED' ? 'Suspend User Account' : 'Reactivate User Account'}
        message={
          statusTarget?.nextStatus === 'SUSPENDED'
            ? `Suspend ${statusTarget?.name ?? 'this user'}? They will immediately lose access until reactivated.`
            : `Reactivate ${statusTarget?.name ?? 'this user'}? They will regain access immediately.`
        }
        confirmLabel={statusTarget?.nextStatus === 'SUSPENDED' ? 'Suspend' : 'Reactivate'}
        onConfirm={handleConfirmStatusChange}
        onCancel={() => setStatusTarget(null)}
      />
    </div>
  )
}

import { useState, useEffect, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { UserPlus, Users, Monitor, Mail, UserX, ShieldCheck, ShieldX, Pencil, Send, Upload, Download, UserCheck, X } from 'lucide-react'
import MetricCard from '../../components/dispatcher/MetricCard'
import StatusBadge from '../../components/dispatcher/StatusBadge'
import AdminPageHeader from '../../components/admin/AdminPageHeader'
import { adminRoleBadge } from '../../data/mockAdminData'
import { listUsers, updateUser, resendInvite } from '../../api/users'
import { listAgencies } from '../../api/agencies'
import { listDistricts } from '../../api/districts'
import { listVehicles } from '../../api/vehicles'

const ROLE_FILTERS = ['All Roles', 'Dispatcher', 'Field Responder', 'Ops Manager', 'District Commander', 'Emergency Planner', 'Analyst', 'Super Admin']
const STATUS_FILTERS = ['All', 'Active', 'Pending', 'Suspended']
const SHIFT_OPTIONS = [
  { value: 'MORNING',  label: 'Morning (07:00 – 15:00)' },
  { value: 'EVENING',  label: 'Evening (15:00 – 23:00)' },
  { value: 'NIGHT',    label: 'Night (23:00 – 07:00)' },
  { value: 'ROTATING', label: 'Rotating / Not fixed' },
]

const ROLES_REQUIRING_DISTRICT = new Set(['OPERATIONS_MANAGER', 'DISTRICT_COMMANDER', 'FIELD_RESPONDER'])

const ROLE_MAP = {
  'Dispatcher': 'DISPATCHER',
  'Field Responder': 'FIELD_RESPONDER',
  'Ops Manager': 'OPERATIONS_MANAGER',
  'District Commander': 'DISTRICT_COMMANDER',
  'Emergency Planner': 'EMERGENCY_PLANNER',
  'Analyst': 'ANALYST',
  'Super Admin': 'SUPER_ADMIN',
}

function statusVariant(s) {
  if (s === 'ACTIVE') return 'resolved'
  if (s === 'PENDING') return 'handover'
  return 'critical'
}

function showToast(setToast, msg) {
  setToast(msg)
  setTimeout(() => setToast(null), 2500)
}

function adaptUser(u) {
  const names = (u.full_name || '').split(' ')
  return {
    ...u,
    name: u.full_name,
    initials: names.map(n => n[0]).filter(Boolean).join('').slice(0, 2).toUpperCase(),
    district: u.district_name ?? (u.district_id ? `ID: ${u.district_id.slice(0, 8)}…` : '—'),
    last_login: u.last_login ? new Date(u.last_login).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) : '—',
    tint: undefined,
    opacity: 1,
  }
}

function UserEditModal({ user, agencies, districts, vehicles, onClose, onSaved }) {
  const [form, setForm] = useState({
    fullName:   user.full_name   ?? '',
    email:      user.email       ?? '',
    phone:      user.phone_number ?? '',
    districtId: user.district_id  ?? '',
    agencyId:   user.agency_id    ?? '',
    vehicleId:  user.current_vehicle_id ?? user.vehicle_id ?? '',
    shiftType:  user.shift_type   ?? '',
  })
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }))
  const needsDistrict = ROLES_REQUIRING_DISTRICT.has(user.role)
  const isFR = user.role === 'FIELD_RESPONDER'

  // Filter vehicles by agency
  const agencyVehicles = useMemo(() =>
    vehicles.filter((v) => !form.agencyId || v.agency_id === form.agencyId),
    [vehicles, form.agencyId]
  )

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!form.fullName.trim()) { setError('Full name is required.'); return }
    setSaving(true)
    setError('')
    try {
      await updateUser(user.user_id, {
        full_name:   form.fullName.trim(),
        email:       form.email.trim() || undefined,
        phone_number: form.phone || undefined,
        district_id: needsDistrict && form.districtId ? form.districtId : undefined,
        agency_id:   form.agencyId || undefined,
        vehicle_id:  isFR && form.vehicleId ? form.vehicleId : undefined,
        shift_type:  form.shiftType || undefined,
      })
      onSaved({
        ...user,
        full_name: form.fullName,
        email: form.email,
        phone_number: form.phone,
        district_id: form.districtId || user.district_id,
        agency_id: form.agencyId || user.agency_id,
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
            <h2 className="text-[16px] font-bold">Edit User</h2>
            <p className="text-[12px] text-(--text-muted) mt-0.5">{user.role} · ID: {user.user_id?.slice(0, 8)}…</p>
          </div>
          <button type="button" onClick={onClose} className="dispatcher-btn-icon"><X size={18} /></button>
        </div>
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <label className="aiu-field">
            <span className="aiu-field-label">Full Name *</span>
            <div className="aiu-input-wrap">
              <input className="aiu-input" value={form.fullName}
                onChange={(e) => set('fullName', e.target.value)} required />
            </div>
          </label>
          <label className="aiu-field">
            <span className="aiu-field-label">Email</span>
            <div className="aiu-input-wrap">
              <input className="aiu-input" type="email" value={form.email}
                onChange={(e) => set('email', e.target.value)} />
            </div>
          </label>
          <label className="aiu-field">
            <span className="aiu-field-label">Phone</span>
            <div className="aiu-input-wrap">
              <input className="aiu-input" placeholder="+250 7xx xxx xxx" value={form.phone}
                onChange={(e) => set('phone', e.target.value)} />
            </div>
          </label>
          <label className="aiu-field">
            <span className="aiu-field-label">Agency</span>
            <div className="aiu-input-wrap">
              <select className="aiu-input aiu-select" value={form.agencyId}
                onChange={(e) => { set('agencyId', e.target.value); set('vehicleId', '') }}>
                <option value="">— No agency —</option>
                {agencies.map((a) => <option key={a.agency_id} value={a.agency_id}>{a.name}</option>)}
              </select>
            </div>
          </label>
          <label className="aiu-field">
            <span className="aiu-field-label">Shift Schedule</span>
            <div className="aiu-input-wrap">
              <select className="aiu-input aiu-select" value={form.shiftType}
                onChange={(e) => set('shiftType', e.target.value)}>
                <option value="">— No change —</option>
                {SHIFT_OPTIONS.map((s) => <option key={s.value} value={s.value}>{s.label}</option>)}
              </select>
            </div>
          </label>
          {needsDistrict && (
            <label className="aiu-field">
              <span className="aiu-field-label">District</span>
              <div className="aiu-input-wrap">
                <select className="aiu-input aiu-select" value={form.districtId}
                  onChange={(e) => set('districtId', e.target.value)}>
                  <option value="">— No district —</option>
                  {districts.map((d) => <option key={d.district_id} value={d.district_id}>{d.name}</option>)}
                </select>
              </div>
            </label>
          )}
          {isFR && (
            <label className="aiu-field">
              <span className="aiu-field-label">Assigned Vehicle</span>
              <div className="aiu-input-wrap">
                <select className="aiu-input aiu-select" value={form.vehicleId}
                  onChange={(e) => set('vehicleId', e.target.value)}>
                  <option value="">— No vehicle —</option>
                  {agencyVehicles.map((v) => (
                    <option key={v.vehicle_id} value={v.vehicle_id}>
                      {v.plate_number} · {v.vehicle_type?.replace(/_/g, ' ')}
                    </option>
                  ))}
                </select>
              </div>
            </label>
          )}
          {error && <p className="text-[12px]" style={{ color: 'var(--status-critical)' }}>{error}</p>}
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

export default function AdminUsers() {
  const navigate = useNavigate()
  const [users, setUsers] = useState([])
  const [agencies, setAgencies] = useState([])
  const [districts, setDistricts] = useState([])
  const [vehicles, setVehicles] = useState([])
  const [search, setSearch] = useState('')
  const [roleFilter, setRoleFilter] = useState('All Roles')
  const [statusFilter, setStatusFilter] = useState('All')
  const [toast, setToast] = useState(null)
  const [editingUser, setEditingUser] = useState(null)

  useEffect(() => {
    listUsers().then((data) => setUsers(data.map(adaptUser))).catch(console.error)
    listAgencies().then(setAgencies).catch(() => {})
    listDistricts().then(setDistricts).catch(() => {})
    listVehicles().then(setVehicles).catch(() => {})
  }, [])

  const displayed = useMemo(() => {
    let list = users
    if (search.trim()) {
      const q = search.trim().toLowerCase()
      list = list.filter((u) =>
        (u.name || '').toLowerCase().includes(q) ||
        (u.email || '').toLowerCase().includes(q) ||
        (u.district || '').toLowerCase().includes(q)
      )
    }
    if (roleFilter !== 'All Roles') {
      const role = ROLE_MAP[roleFilter]
      if (role) list = list.filter((u) => u.role === role)
    }
    if (statusFilter !== 'All') {
      const s = statusFilter.toUpperCase()
      list = list.filter((u) => u.status === s)
    }
    return list
  }, [users, search, roleFilter, statusFilter])

  async function handleActivate(user_id) {
    try {
      await updateUser(user_id, { status: 'ACTIVE' })
      setUsers((prev) => prev.map((u) => u.user_id === user_id ? { ...u, status: 'ACTIVE' } : u))
      showToast(setToast, 'User activated successfully')
    } catch {
      showToast(setToast, 'Failed to activate user')
    }
  }

  async function handleSuspend(user_id) {
    try {
      await updateUser(user_id, { status: 'SUSPENDED' })
      setUsers((prev) => prev.map((u) => u.user_id === user_id ? { ...u, status: 'SUSPENDED' } : u))
      showToast(setToast, 'User suspended')
    } catch {
      showToast(setToast, 'Failed to suspend user')
    }
  }

  async function handleResendInvite(u) {
    try {
      await resendInvite(u.user_id)
      showToast(setToast, `Invitation resent to ${u.email}`)
    } catch (err) {
      showToast(setToast, err?.response?.data?.message ?? 'Failed to resend invitation')
    }
  }

  function handleEditSaved(updated) {
    setUsers((prev) => prev.map((u) => u.user_id === updated.user_id ? adaptUser({ ...u, ...updated }) : u))
    setEditingUser(null)
    showToast(setToast, 'User updated successfully')
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
        <MetricCard icon={Users} label="Total Users" value={users.length ? String(users.length) : '—'} hintTone="neutral" />
        <MetricCard icon={Monitor} label="Active Accounts" value={String(users.filter(u => u.status === 'ACTIVE').length || '0')} hintTone="neutral" />
        <MetricCard
          icon={Mail}
          label="Pending Invitations"
          value={String(users.filter(u => u.status === 'PENDING').length || '0')}
          className="dispatcher-metric-card--alert"
          hintTone="neutral"
        />
        <MetricCard icon={UserX} label="Suspended Accounts" value={String(users.filter(u => u.status === 'SUSPENDED').length || '0')} hintTone="warning" className="dispatcher-metric-card--alert" />
      </div>

      <div className="flex flex-wrap gap-2 items-center">
        <input
          className="dispatcher-input h-10 flex-1 min-w-[200px]"
          placeholder="Search by name, email, or district..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
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
              <th className="text-center p-3">District</th>
              <th className="text-center p-3">Status</th>
              <th className="text-center p-3">Last Login</th>
              <th className="text-center p-3">MFA</th>
              <th className="text-center p-3">Actions</th>
            </tr>
          </thead>
          <tbody>
            {displayed.length === 0 && (
              <tr>
                <td colSpan={7} className="p-6 text-center text-[13px] text-(--text-muted)">
                  {users.length === 0 ? 'Loading users…' : 'No users match the current filter.'}
                </td>
              </tr>
            )}
            {displayed.map((u) => {
              const rb = adminRoleBadge(u.role)
              return (
                <tr
                  key={u.user_id}
                  className="border-b border-(--border-subtle) dispatcher-table-row group"
                  style={{
                    background: u.status === 'SUSPENDED' ? 'var(--status-critical-bg)' : undefined,
                    opacity: u.status === 'SUSPENDED' ? 0.85 : 1,
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
                  <td className="p-3 text-center text-(--text-secondary)">{u.district}</td>
                  <td className="p-3 text-center">
                    <StatusBadge label={u.status} variant={statusVariant(u.status)} />
                  </td>
                  <td className="p-3 text-center font-mono text-(--text-muted)">{u.last_login}</td>
                  <td className="p-3 text-center">
                    {u.mfa_enabled
                      ? <ShieldCheck size={16} className="inline" style={{ color: 'var(--status-low)' }} />
                      : <ShieldX size={16} className="inline" style={{ color: 'var(--status-critical)' }} />
                    }
                  </td>
                  <td className="p-3">
                    <div className="flex gap-1 justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                      {(u.status === 'PENDING' || u.status === 'SUSPENDED') && (
                        <button
                          type="button"
                          title="Activate account"
                          className="dispatcher-btn-icon"
                          style={{ color: 'var(--status-low)' }}
                          onClick={() => handleActivate(u.user_id)}
                        >
                          <UserCheck size={14} />
                        </button>
                      )}
                      {u.status === 'ACTIVE' && (
                        <button
                          type="button"
                          title="Suspend account"
                          className="dispatcher-btn-icon"
                          onClick={() => handleSuspend(u.user_id)}
                        >
                          <UserX size={14} />
                        </button>
                      )}
                      {u.status === 'PENDING' && (
                        <button
                          type="button"
                          title="Resend invitation link"
                          className="dispatcher-btn-icon"
                          onClick={() => handleResendInvite(u)}
                        >
                          <Send size={14} />
                        </button>
                      )}
                      <button
                        type="button"
                        title="Edit user details"
                        className="dispatcher-btn-icon"
                        onClick={() => setEditingUser(u)}
                      >
                        <Pencil size={14} />
                      </button>
                    </div>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
        <div className="dispatcher-table-footer flex justify-between items-center p-3">
          <span className="text-[12px] text-(--text-muted)">
            Showing {displayed.length} of {users.length} users
          </span>
        </div>
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

      {editingUser && (
        <UserEditModal
          user={editingUser}
          agencies={agencies}
          districts={districts}
          vehicles={vehicles}
          onClose={() => setEditingUser(null)}
          onSaved={handleEditSaved}
        />
      )}
    </div>
  )
}

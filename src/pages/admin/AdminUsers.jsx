import { useState, useEffect, useMemo, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { UserPlus, Users, Monitor, Mail, UserX, ShieldCheck, ShieldX, Pencil, Send, Upload, Download, UserCheck, X, Search } from 'lucide-react'
import StatusBadge from '../../components/dispatcher/StatusBadge'
import AdminPageHeader from '../../components/admin/AdminPageHeader'
import FilterDropdown from '../../components/admin/FilterDropdown'
import AdminPagination from '../../components/admin/AdminPagination'
import AdminStatCard from '../../components/admin/AdminStatCard'
import UserAvatar from '../../components/admin/UserAvatar'
import { listUsers, updateUser, resendInvite, inviteUser } from '../../api/users'
import { listAgencies } from '../../api/agencies'
import { listDistricts } from '../../api/districts'
import { listVehicles } from '../../api/vehicles'
import { downloadCsv, parseCsv } from '../../utils/csv'
import { useToastStore } from '../../store/toastStore'

const PAGE_SIZE = 10

const ROLE_FILTERS = ['All Roles', 'Dispatcher', 'Field Responder', 'Ops Manager', 'District Commander', 'Emergency Planner', 'Analyst', 'Super Admin']
const STATUS_FILTERS = ['All', 'Active', 'Pending', 'Suspended']
const SHIFT_OPTIONS = [
  { value: 'MORNING',  label: 'Morning (07:00 – 15:00)' },
  { value: 'EVENING',  label: 'Evening (15:00 – 23:00)' },
  { value: 'NIGHT',    label: 'Night (23:00 – 07:00)' },
  { value: 'ROTATING', label: 'Rotating / Not fixed' },
]

const ROLE_MAP = {
  'Dispatcher': 'DISPATCHER',
  'Field Responder': 'FIELD_RESPONDER',
  'Ops Manager': 'OPERATIONS_MANAGER',
  'District Commander': 'DISTRICT_COMMANDER',
  'Emergency Planner': 'EMERGENCY_PLANNER',
  'Analyst': 'ANALYST',
  'Super Admin': 'SUPER_ADMIN',
}

const ROLE_DISPLAY_LABELS = {
  DISPATCHER: 'Dispatcher',
  FIELD_RESPONDER: 'Field Responder',
  OPERATIONS_MANAGER: 'Operations Manager',
  DISTRICT_COMMANDER: 'District Commander',
  EMERGENCY_PLANNER: 'Emergency Planner',
  ANALYST: 'Analyst',
  SUPER_ADMIN: 'Super Admin',
}

// CSV import maps a human-friendly role name (matches the Download Template
// header) onto the same real role enum the rest of the app uses.
const ROLE_FROM_CSV = {
  DISPATCHER: 'DISPATCHER',
  FIELD_RESPONDER: 'FIELD_RESPONDER',
  OPERATIONS_MANAGER: 'OPERATIONS_MANAGER',
  DISTRICT_COMMANDER: 'DISTRICT_COMMANDER',
  EMERGENCY_PLANNER: 'EMERGENCY_PLANNER',
  ANALYST: 'ANALYST',
  SUPER_ADMIN: 'SUPER_ADMIN',
}

const CSV_TEMPLATE_COLUMNS = ['full_name', 'email', 'role', 'phone', 'district', 'agency']

function statusVariant(s) {
  if (s === 'ACTIVE') return 'resolved'
  if (s === 'PENDING') return 'handover'
  return 'critical'
}

function showToast(msg, variant = 'success') {
  useToastStore.getState().pushToast({ variant, title: variant === 'error' ? 'Error' : 'Users', message: msg })
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
  const isFR = user.role === 'FIELD_RESPONDER'

  // Field Responder vehicle picker only offers units that are actually
  // assignable to *this* responder: same agency, same district (a unit
  // stationed in another district isn't realistically theirs to drive),
  // and not already held by a different Field Responder. The responder's
  // own currently-assigned vehicle (if any) stays selectable so re-saving
  // without changing it doesn't silently unassign them.
  const agencyVehicles = useMemo(() =>
    vehicles.filter((v) =>
      (!form.agencyId || v.agency_id === form.agencyId) &&
      (!form.districtId || !v.district_id || v.district_id === form.districtId) &&
      (!v.assigned_responder_id || v.assigned_responder_id === user.user_id || v.vehicle_id === form.vehicleId)
    ),
    [vehicles, form.agencyId, form.districtId, form.vehicleId, user.user_id]
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
        district_id: form.districtId || undefined,
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
  const [districtFilter, setDistrictFilter] = useState('All Districts')
  const [statusFilter, setStatusFilter] = useState('All')
  const [editingUser, setEditingUser] = useState(null)
  const [page, setPage] = useState(1)

  const [importing, setImporting] = useState(false)
  const [importResult, setImportResult] = useState(null)
  const fileInputRef = useRef(null)

  function refreshUsers() {
    return listUsers().then((data) => setUsers(data.map(adaptUser))).catch(console.error)
  }

  useEffect(() => {
    refreshUsers()
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
    if (districtFilter !== 'All Districts') {
      list = list.filter((u) => u.district_name === districtFilter)
    }
    if (statusFilter !== 'All') {
      const s = statusFilter.toUpperCase()
      list = list.filter((u) => u.status === s)
    }
    return list
  }, [users, search, roleFilter, districtFilter, statusFilter])

  useEffect(() => { Promise.resolve().then(() => setPage(1)) }, [search, roleFilter, districtFilter, statusFilter])
  const totalPages = Math.max(1, Math.ceil(displayed.length / PAGE_SIZE))
  const pageUsers = displayed.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE)

  async function handleActivate(user_id) {
    try {
      await updateUser(user_id, { status: 'ACTIVE' })
      setUsers((prev) => prev.map((u) => u.user_id === user_id ? { ...u, status: 'ACTIVE' } : u))
      showToast('User activated successfully')
    } catch {
      showToast('Failed to activate user', 'error')
    }
  }

  async function handleSuspend(user_id) {
    try {
      await updateUser(user_id, { status: 'SUSPENDED' })
      setUsers((prev) => prev.map((u) => u.user_id === user_id ? { ...u, status: 'SUSPENDED' } : u))
      showToast('User suspended')
    } catch {
      showToast('Failed to suspend user', 'error')
    }
  }

  async function handleResendInvite(u) {
    try {
      await resendInvite(u.user_id)
      showToast(`Invitation resent to ${u.email}`)
    } catch (err) {
      showToast(err?.response?.data?.message ?? 'Failed to resend invitation', 'error')
    }
  }

  function handleEditSaved(updated) {
    setUsers((prev) => prev.map((u) => u.user_id === updated.user_id ? adaptUser({ ...u, ...updated }) : u))
    setEditingUser(null)
    showToast('User updated successfully')
  }

  function handleExportCsv() {
    downloadCsv('resq_users.csv', displayed, [
      { label: 'full_name', get: (u) => u.name },
      { label: 'email', get: (u) => u.email },
      { label: 'role', get: (u) => u.role },
      { label: 'phone', get: (u) => u.phone_number ?? '' },
      { label: 'district', get: (u) => u.district_name ?? '' },
      { label: 'agency', get: (u) => u.agency_name ?? '' },
      { label: 'status', get: (u) => u.status },
    ])
  }

  function handleDownloadTemplate() {
    downloadCsv('resq_users_import_template.csv', [
      { full_name: 'Jane Doe', email: 'j.doe@rnp.gov.rw', role: 'DISPATCHER', phone: '+250788000000', district: 'Nyarugenge', agency: 'Rwanda National Police' },
    ], CSV_TEMPLATE_COLUMNS.map((c) => ({ label: c, get: (r) => r[c] })))
  }

  async function handleImportFile(e) {
    const file = e.target.files?.[0]
    e.target.value = ''
    if (!file) return
    const text = await file.text()
    const rows = parseCsv(text)
    if (rows.length === 0) {
      setImportResult({ error: 'No rows found in that CSV.' })
      return
    }
    setImporting(true)
    setImportResult(null)
    let succeeded = 0
    const failures = []
    for (const row of rows) {
      const role = ROLE_FROM_CSV[(row.role ?? '').toUpperCase().trim()]
      if (!row.email || !row.full_name || !role) {
        failures.push(`${row.full_name || row.email || 'Unknown row'}: missing/invalid required field (full_name, email, role)`)
        continue
      }
      const district = districts.find((d) => d.name.toLowerCase() === (row.district ?? '').toLowerCase().trim())
      const agency = agencies.find((a) => a.name.toLowerCase() === (row.agency ?? '').toLowerCase().trim())
      try {
        await inviteUser({
          full_name: row.full_name.trim(),
          email: row.email.trim(),
          role,
          phone: row.phone?.trim() || undefined,
          district_id: district?.district_id,
          agency_id: agency?.agency_id,
        })
        succeeded++
      } catch (err) {
        failures.push(`${row.full_name}: ${err?.response?.data?.message ?? 'failed to invite'}`)
      }
    }
    setImporting(false)
    setImportResult({ succeeded, total: rows.length, failures })
    if (succeeded > 0) refreshUsers()
  }

  return (
    <div className="portal-page flex flex-col gap-5 min-w-[1024px]">
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

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <AdminStatCard icon={Users} label="Total Users" value={users.length ? String(users.length) : '—'} />
        <AdminStatCard icon={Monitor} label="Active Accounts" value={String(users.filter(u => u.status === 'ACTIVE').length || '0')} />
        <AdminStatCard icon={Mail} label="Pending Invitations" value={String(users.filter(u => u.status === 'PENDING').length || '0')} />
        <AdminStatCard icon={UserX} label="Suspended Accounts" value={String(users.filter(u => u.status === 'SUSPENDED').length || '0')} />
      </div>

      <div className="flex flex-nowrap items-center gap-2">
        <div className="relative w-56 shrink-0">
          <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-(--text-muted)" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by name, email, or district…"
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
          label="All Districts"
          value={districtFilter}
          onChange={setDistrictFilter}
          options={[{ value: 'All Districts', label: 'All Districts' }, ...districts.map((d) => ({ value: d.name, label: d.name }))]}
        />
        <FilterDropdown
          label="All Statuses"
          value={statusFilter}
          onChange={setStatusFilter}
          options={STATUS_FILTERS.map((s) => ({ value: s, label: s === 'All' ? 'All statuses' : s }))}
        />
        <button
          type="button"
          className="h-9 text-[12px] px-3 flex items-center gap-2 rounded-lg shrink-0 font-semibold"
          style={{ background: 'var(--accent)', color: 'var(--text-on-accent)', border: 'none' }}
          onClick={handleExportCsv}
        >
          <Download size={13} />
          Download CSV
        </button>
      </div>

      <div className="dispatcher-surface table-scroll">
        <table className="w-full min-w-[960px] text-left border-collapse text-[12px]">
          <thead>
            <tr className="text-[12px] font-medium text-(--text-secondary) border-b border-(--border-subtle)">
              <th className="py-2 px-3 font-bold">User</th>
              <th className="py-2 px-3 font-bold text-center">Role</th>
              <th className="py-2 px-3 font-bold text-center">District</th>
              <th className="py-2 px-3 font-bold text-center">Status</th>
              <th className="py-2 px-3 font-bold text-center">Last Login</th>
              <th className="py-2 px-3 font-bold text-center">MFA</th>
              <th className="py-2 px-3 font-bold text-center">Actions</th>
            </tr>
          </thead>
          <tbody>
            {displayed.length === 0 && (
              <tr>
                <td colSpan={7} className="py-6 text-center text-[13px] text-(--text-muted)">
                  {users.length === 0 ? 'Loading users…' : 'No users match the current filter.'}
                </td>
              </tr>
            )}
            {pageUsers.map((u) => {
              return (
                <tr
                  key={u.user_id}
                  className="border-b border-(--border-subtle) last:border-0 dispatcher-table-row group"
                  style={{
                    background: u.status === 'SUSPENDED' ? 'var(--status-critical-bg)' : undefined,
                    opacity: u.status === 'SUSPENDED' ? 0.85 : 1,
                  }}
                >
                  <td className="py-3 px-3">
                    <div className="flex items-center gap-2">
                      <UserAvatar name={u.name} size={32} />
                      <div>
                        <div className="font-medium text-[13px]">{u.name}</div>
                        <div className="font-mono text-[11px] text-(--text-muted)">{u.email}</div>
                      </div>
                    </div>
                  </td>
                  <td className="py-3 px-3 text-center">{ROLE_DISPLAY_LABELS[u.role] ?? u.role}</td>
                  <td className="py-3 px-3 text-center">{u.district}</td>
                  <td className="py-3 px-3 text-center">
                    <StatusBadge label={u.status} variant={statusVariant(u.status)} />
                  </td>
                  <td className="py-3 px-3 text-center">{u.last_login}</td>
                  <td className="py-3 px-3 text-center">
                    {u.mfa_enabled
                      ? <ShieldCheck size={16} className="inline" style={{ color: 'var(--status-low)' }} />
                      : <ShieldX size={16} className="inline" style={{ color: 'var(--status-critical)' }} />
                    }
                  </td>
                  <td className="py-3 px-3">
                    <div className="flex gap-1 justify-center">
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
      </div>

      <AdminPagination page={page} totalPages={totalPages} totalCount={displayed.length} pageSize={PAGE_SIZE} onPageChange={setPage} />

      <div className="dispatcher-surface p-4">
        <h3 className="text-[13px] font-semibold m-0">Bulk User Import</h3>
        <p className="text-[12px] text-(--text-muted) m-0 mb-3">
          Import multiple users from CSV — each row is sent through the same real invite flow as "Invite New User".
        </p>
        <input ref={fileInputRef} type="file" accept=".csv,text/csv" className="hidden" onChange={handleImportFile} />
        <button
          type="button"
          className="flex items-center justify-center gap-2 rounded-lg mb-3 w-full cursor-pointer"
          style={{ height: 80, border: '2px dashed var(--border)', background: 'var(--bg-elevated)' }}
          onClick={() => fileInputRef.current?.click()}
          disabled={importing}
        >
          <Upload size={20} className="text-(--text-muted)" />
          <span className="text-[13px] text-(--text-muted)">
            {importing ? 'Importing…' : 'Click to choose a CSV file'}
          </span>
        </button>
        <button type="button" className="text-[12px] font-semibold text-(--accent) inline-flex items-center gap-1 cursor-pointer" style={{ background: 'none', border: 'none' }} onClick={handleDownloadTemplate}>
          <Download size={12} />
          Download CSV Template
        </button>
        {importResult && (
          <div className="mt-3 text-[12px]">
            {importResult.error ? (
              <p className="m-0" style={{ color: 'var(--status-critical)' }}>{importResult.error}</p>
            ) : (
              <>
                <p className="m-0" style={{ color: importResult.succeeded === importResult.total ? 'var(--status-low)' : 'var(--status-medium)' }}>
                  Invited {importResult.succeeded} of {importResult.total} users.
                </p>
                {importResult.failures.length > 0 && (
                  <ul className="m-0 mt-1 pl-4 text-(--text-secondary)">
                    {importResult.failures.map((f, i) => <li key={i}>{f}</li>)}
                  </ul>
                )}
              </>
            )}
          </div>
        )}
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

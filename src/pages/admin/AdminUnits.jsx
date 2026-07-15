import { useState, useEffect } from 'react'
import { Plus, Search, X } from 'lucide-react'
import AdminPageHeader from '../../components/admin/AdminPageHeader'
import StatusBadge from '../../components/dispatcher/StatusBadge'
import { listVehicles } from '../../api/vehicles'
import { listAgencies } from '../../api/agencies'
import { listDistricts } from '../../api/districts'
import api from '../../lib/apiClient'

const PAGE_SIZE = 20

const STATUS_VARIANTS = {
  available:      'resolved',
  dispatched:     'handover',
  en_route:       'handover',
  on_scene:       'critical',
  out_of_service: 'critical',
}

const STATUS_LABELS = {
  available:      'Available',
  dispatched:     'Dispatched',
  en_route:       'En Route',
  on_scene:       'On Scene',
  out_of_service: 'Out of Service',
}

const VEHICLE_TYPES = [
  'PATROL_CAR', 'AMBULANCE', 'FIRE_TRUCK', 'MOTORCYCLE',
  'COMMAND_VEHICLE', 'TRANSPORT_VAN', 'WATER_TANKER', 'OTHER',
]

function UnitModal({ unit, agencies, districts, onClose, onSaved }) {
  const isEdit = !!unit
  const [form, setForm] = useState({
    plateNumber:  unit?.plate_number  ?? '',
    vehicleType:  unit?.vehicle_type  ?? 'PATROL_CAR',
    agencyId:     unit?.agency_id     ?? '',
    districtId:   unit?.district_id   ?? '',
    capability:   unit?.capability    ?? '',
    status:       (unit?.status ?? 'AVAILABLE').toUpperCase(),
  })
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }))

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!form.plateNumber.trim()) { setError('Plate number is required.'); return }
    if (!form.agencyId) { setError('Agency is required.'); return }
    setSaving(true)
    setError('')
    try {
      const payload = {
        plateNumber: form.plateNumber.trim().toUpperCase(),
        vehicleType: form.vehicleType,
        agencyId:    form.agencyId    || null,
        districtId:  form.districtId  || null,
        capability:  form.capability  || null,
        status:      form.status,
      }
      if (isEdit) {
        await api.put(`/api/vehicles/${unit.vehicle_id}`, payload)
      } else {
        await api.post('/api/vehicles', payload)
      }
      onSaved()
    } catch (err) {
      setError(err?.response?.data?.message || 'Failed to save unit.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center" style={{ background: 'rgba(0,0,0,0.5)' }}>
      <div className="dispatcher-surface p-6 w-full max-w-lg rounded-xl shadow-2xl">
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-[16px] font-bold">{isEdit ? 'Edit Unit' : 'Register New Unit'}</h2>
          <button type="button" onClick={onClose} className="dispatcher-btn-icon"><X size={18} /></button>
        </div>
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <label className="aiu-field">
            <span className="aiu-field-label">Plate Number *</span>
            <div className="aiu-input-wrap">
              <input className="aiu-input" placeholder="RAB 123A" value={form.plateNumber}
                onChange={(e) => set('plateNumber', e.target.value)} required />
            </div>
          </label>
          <label className="aiu-field">
            <span className="aiu-field-label">Vehicle Type *</span>
            <div className="aiu-input-wrap">
              <select className="aiu-input aiu-select" value={form.vehicleType}
                onChange={(e) => set('vehicleType', e.target.value)}>
                {VEHICLE_TYPES.map((t) => <option key={t} value={t}>{t.replace(/_/g, ' ')}</option>)}
              </select>
            </div>
          </label>
          <label className="aiu-field">
            <span className="aiu-field-label">Agency *</span>
            <div className="aiu-input-wrap">
              <select className="aiu-input aiu-select" value={form.agencyId}
                onChange={(e) => set('agencyId', e.target.value)} required>
                <option value="">Select agency…</option>
                {agencies.map((a) => <option key={a.agency_id || a.id} value={a.agency_id || a.id}>{a.name}</option>)}
              </select>
            </div>
          </label>
          <label className="aiu-field">
            <span className="aiu-field-label">Assign to District</span>
            <div className="aiu-input-wrap">
              <select className="aiu-input aiu-select" value={form.districtId}
                onChange={(e) => set('districtId', e.target.value)}>
                <option value="">Not assigned (HQ pool)</option>
                {districts.map((d) => <option key={d.district_id} value={d.district_id}>{d.name} District</option>)}
              </select>
            </div>
          </label>
          <label className="aiu-field">
            <span className="aiu-field-label">Capability / Specialization</span>
            <div className="aiu-input-wrap">
              <input className="aiu-input" placeholder="e.g. PATROL, FIRE_SUPPRESSION, TRAUMA"
                value={form.capability} onChange={(e) => set('capability', e.target.value)} />
            </div>
          </label>
          <label className="aiu-field">
            <span className="aiu-field-label">Status</span>
            <div className="aiu-input-wrap">
              <select className="aiu-input aiu-select" value={form.status}
                onChange={(e) => set('status', e.target.value)}>
                <option value="AVAILABLE">Available</option>
                <option value="DISPATCHED">Dispatched</option>
                <option value="EN_ROUTE">En Route</option>
                <option value="ON_SCENE">On Scene</option>
                <option value="OUT_OF_SERVICE">Out of Service</option>
              </select>
            </div>
          </label>
          {error && <p className="text-[12px]" style={{ color: 'var(--status-critical)' }}>{error}</p>}
          <div className="flex gap-2 justify-end mt-2">
            <button type="button" className="dispatcher-btn-ghost" onClick={onClose}>Cancel</button>
            <button type="submit" className="dispatcher-btn-primary" disabled={saving}>
              {saving ? 'Saving…' : isEdit ? 'Save Changes' : 'Register Unit'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default function AdminUnits() {
  const [units, setUnits] = useState([])
  const [agencies, setAgencies] = useState([])
  const [districts, setDistricts] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [search, setSearch] = useState('')
  const [agencyFilter, setAgencyFilter] = useState('')
  const [districtFilter, setDistrictFilter] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [modal, setModal] = useState(null)
  const [page, setPage] = useState(1)

  // silent=true for the background poll — this page previously only fetched
  // once on mount, so a unit's status change (e.g. dispatched) never showed
  // up without a manual page reload. silent avoids re-showing the full-page
  // "Loading units…" state on every poll tick.
  const load = (silent = false) => {
    if (!silent) setLoading(true)
    setError(null)
    // Auto-sync stale statuses silently, then reload
    api.post('/api/admin/vehicles/sync-statuses').catch(() => {})
    listVehicles()
      .then(setUnits)
      .catch(() => { if (!silent) setError('Failed to load units.') })
      .finally(() => { if (!silent) setLoading(false) })
  }

  useEffect(() => {
    load()
    listAgencies().then(setAgencies).catch(() => {})
    listDistricts().then(setDistricts).catch(() => {})
    const t = setInterval(() => load(true), 15000)
    return () => clearInterval(t)
  }, [])

  const filtered = units.filter((u) => {
    const q = search.toLowerCase()
    const matchSearch = !q ||
      u.plate_number?.toLowerCase().includes(q) ||
      u.vehicle_type?.toLowerCase().includes(q) ||
      u.agency_name?.toLowerCase().includes(q) ||
      u.district_name?.toLowerCase().includes(q) ||
      u.capability?.toLowerCase().includes(q)
    const matchAgency = !agencyFilter || u.agency_id === agencyFilter
    const matchDistrict = !districtFilter ||
      (districtFilter === '__unassigned__' ? !u.district_id : u.district_id === districtFilter)
    const matchStatus = !statusFilter || u.status === statusFilter
    return matchSearch && matchAgency && matchDistrict && matchStatus
  })

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE))
  const displayed = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE)

  return (
    <div className="portal-page flex flex-col gap-4 min-w-[1024px]">
      <AdminPageHeader
        title="Unit Management"
        subtitle="Register and manage all fleet units. Units listed here are available for assignment to Field Responders."
        eyebrow="Super Admin Portal"
        badge="Fleet Registry"
        actions={
          <button type="button" className="dispatcher-btn-primary inline-flex items-center gap-2"
            onClick={() => setModal('create')}>
            <Plus size={16} />Register New Unit
          </button>
        }
      />

      <div className="flex flex-wrap gap-3 items-center">
        <div className="relative flex-1 min-w-[200px] max-w-sm">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-(--text-muted)" />
          <input
            className="dispatcher-input pl-8 h-9 w-full text-[13px]"
            placeholder="Search plate, type, agency…"
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1) }}
          />
        </div>
        <select
          className="dispatcher-input h-9 text-[13px] min-w-[180px]"
          value={agencyFilter}
          onChange={(e) => { setAgencyFilter(e.target.value); setPage(1) }}
        >
          <option value="">All agencies</option>
          {agencies.map((a) => <option key={a.agency_id || a.id} value={a.agency_id || a.id}>{a.name}</option>)}
        </select>
        <select
          className="dispatcher-input h-9 text-[13px] min-w-[180px]"
          value={districtFilter}
          onChange={(e) => { setDistrictFilter(e.target.value); setPage(1) }}
        >
          <option value="">All districts</option>
          <option value="__unassigned__">Unassigned</option>
          {districts.map((d) => <option key={d.district_id} value={d.district_id}>{d.name}</option>)}
        </select>
        <select
          className="dispatcher-input h-9 text-[13px] min-w-[160px]"
          value={statusFilter}
          onChange={(e) => { setStatusFilter(e.target.value); setPage(1) }}
        >
          <option value="">All statuses</option>
          {Object.keys(STATUS_LABELS).map((s) => <option key={s} value={s}>{STATUS_LABELS[s]}</option>)}
        </select>
        <span className="text-[12px] text-(--text-muted) ml-auto">
          {filtered.length} unit{filtered.length !== 1 ? 's' : ''}
        </span>
      </div>

      <div className="dispatcher-surface table-scroll">
        <table className="w-full min-w-[900px] text-left border-collapse text-[12px]">
          <thead>
            <tr className="text-[10px] uppercase tracking-wide text-(--text-muted) border-b border-(--border-subtle)">
              <th className="py-2 px-3 font-semibold">Plate Number</th>
              <th className="py-2 px-3 font-semibold">Type</th>
              <th className="py-2 px-3 font-semibold">Agency</th>
              <th className="py-2 px-3 font-semibold">District</th>
              <th className="py-2 px-3 font-semibold">Capability</th>
              <th className="py-2 px-3 font-semibold">Status</th>
              <th className="py-2 px-3 font-semibold">Online</th>
              <th className="py-2 px-3 font-semibold">Action</th>
            </tr>
          </thead>
          <tbody>
            {loading && (
              <tr><td colSpan={8} className="py-8 text-center text-(--text-muted)">Loading units…</td></tr>
            )}
            {error && !loading && (
              <tr><td colSpan={8} className="py-8 text-center" style={{ color: 'var(--status-critical)' }}>{error}</td></tr>
            )}
            {!loading && !error && filtered.length === 0 && (
              <tr><td colSpan={8} className="py-8 text-center text-(--text-muted)">No units found. Register one above.</td></tr>
            )}
            {!loading && !error && displayed.map((u) => (
              <tr key={u.vehicle_id} className="border-b border-(--border-subtle) last:border-0 hover:bg-(--bg-elevated)/40">
                <td className="py-3 px-3 font-mono font-bold text-(--accent)">{u.plate_number}</td>
                <td className="py-3 px-3">{u.vehicle_type?.replace(/_/g, ' ')}</td>
                <td className="py-3 px-3 text-(--text-secondary)">{u.agency_name ?? '—'}</td>
                <td className="py-3 px-3 text-(--text-secondary)">{u.district_name ?? '—'}</td>
                <td className="py-3 px-3 text-(--text-muted)">{u.capability ?? '—'}</td>
                <td className="py-3 px-3">
                  <StatusBadge label={STATUS_LABELS[u.status] ?? u.status?.replace(/_/g, ' ')} variant={STATUS_VARIANTS[u.status] ?? 'handover'} />
                </td>
                <td className="py-3 px-3">
                  <span className={`inline-block w-2 h-2 rounded-full ${u.online ? 'bg-[var(--status-low)]' : 'bg-[var(--border)]'}`} />
                  <span className="ml-1.5 text-(--text-muted)">{u.online ? 'Online' : 'Offline'}</span>
                </td>
                <td className="py-3 px-3">
                  <button type="button" className="dispatcher-btn-ghost text-[11px]"
                    onClick={() => setModal(u)}>
                    Edit
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {totalPages > 1 && (
          <div className="dispatcher-table-footer flex justify-between items-center p-3">
            <span className="text-[12px] text-(--text-muted)">
              Showing {(page - 1) * PAGE_SIZE + 1}–{Math.min(page * PAGE_SIZE, filtered.length)} of {filtered.length}
            </span>
            <div className="flex gap-2">
              <button type="button" className="dispatcher-btn-ghost text-[11px] h-8" disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>Previous</button>
              <span className="text-[12px] text-(--text-muted) self-center px-1">{page} / {totalPages}</span>
              <button type="button" className="dispatcher-btn-ghost text-[11px] h-8" disabled={page >= totalPages} onClick={() => setPage((p) => p + 1)}>Next</button>
            </div>
          </div>
        )}
      </div>

      {modal && (
        <UnitModal
          unit={modal === 'create' ? null : modal}
          agencies={agencies}
          districts={districts}
          onClose={() => setModal(null)}
          onSaved={() => { setModal(null); load() }}
        />
      )}
    </div>
  )
}

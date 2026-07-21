import { useState, useEffect, useRef } from 'react'
import { Plus, Upload, Download, X, Search } from 'lucide-react'
import AdminPageHeader from '../../components/admin/AdminPageHeader'
import StatusBadge from '../../components/dispatcher/StatusBadge'
import FilterDropdown from '../../components/admin/FilterDropdown'
import AdminPagination from '../../components/admin/AdminPagination'
import { listVehicles } from '../../api/vehicles'
import { listAgencies } from '../../api/agencies'
import { listDistricts } from '../../api/districts'
import { listStations } from '../../api/stations'
import { downloadCsv, parseCsv } from '../../utils/csv'
import api from '../../lib/apiClient'

const PAGE_SIZE = 10

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

// Real values actually seeded/used elsewhere in the system (DataSeeder.java) —
// vehicle_type has no backend enum/constraint, so this list is the only thing
// keeping admin-registered units consistent with what dispatch matching,
// icons, and synthetic data already expect.
const VEHICLE_TYPES = ['AMBULANCE', 'FIRE_TRUCK', 'POLICE_CAR', 'TACTICAL', 'DISASTER_UNIT']

const CSV_TEMPLATE_COLUMNS = ['plate_number', 'vehicle_type', 'agency', 'district', 'capability', 'status']

function UnitModal({ unit, agencies, districts, onClose, onSaved }) {
  const isEdit = !!unit
  const [form, setForm] = useState({
    plateNumber:  unit?.plate_number  ?? '',
    vehicleType:  unit?.vehicle_type  ?? 'AMBULANCE',
    agencyId:     unit?.agency_id     ?? '',
    districtId:   unit?.district_id   ?? '',
    stationId:    unit?.station_id    ?? '',
    capability:   unit?.capability    ?? '',
    status:       (unit?.status ?? 'AVAILABLE').toUpperCase(),
  })
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [stations, setStations] = useState([])
  const [stationsLoading, setStationsLoading] = useState(false)

  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }))

  // Stations are scoped to a district + agency — that combination is what
  // determines "exactly where this unit should appear on the map" (Vehicle
  // has no other real physical-location field besides its station).
  useEffect(() => {
    if (!form.districtId && !form.agencyId) { Promise.resolve().then(() => setStations([])); return }
    Promise.resolve().then(() => setStationsLoading(true))
    listStations({ districtId: form.districtId || undefined, agencyId: form.agencyId || undefined })
      .then((list) => {
        setStations(list)
        setForm((f) => (f.stationId && !list.some((s) => s.station_id === f.stationId) ? { ...f, stationId: '' } : f))
      })
      .catch(() => setStations([]))
      .finally(() => setStationsLoading(false))
  }, [form.districtId, form.agencyId])

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
        stationId:   form.stationId   || null,
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
            <span className="aiu-field-label">Station</span>
            <div className="aiu-input-wrap">
              <select className="aiu-input aiu-select" value={form.stationId}
                onChange={(e) => set('stationId', e.target.value)}
                disabled={stationsLoading || stations.length === 0}>
                <option value="">
                  {stationsLoading ? 'Loading stations…' : stations.length === 0 ? 'No stations for this agency/district' : 'Not assigned to a station'}
                </option>
                {stations.map((s) => <option key={s.station_id} value={s.station_id}>{s.name}</option>)}
              </select>
            </div>
            <p className="aiu-field-hint">This is exactly where the unit appears on the map until it reports a live GPS position.</p>
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

  const [importing, setImporting] = useState(false)
  const [importResult, setImportResult] = useState(null)
  const fileInputRef = useRef(null)

  const load = (silent = false) => {
    if (!silent) setLoading(true)
    setError(null)
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

  function handleExportCsv() {
    downloadCsv('resq_units.csv', filtered, [
      { label: 'plate_number', get: (u) => u.plate_number },
      { label: 'vehicle_type', get: (u) => u.vehicle_type },
      { label: 'agency', get: (u) => u.agency_name ?? '' },
      { label: 'district', get: (u) => u.district_name ?? '' },
      { label: 'capability', get: (u) => u.capability ?? '' },
      { label: 'status', get: (u) => u.status },
    ])
  }

  function handleDownloadTemplate() {
    downloadCsv('resq_units_import_template.csv', [
      { plate_number: 'RAB 123A', vehicle_type: 'POLICE_CAR', agency: 'Rwanda National Police', district: 'Nyarugenge', capability: 'PATROL', status: 'AVAILABLE' },
    ], CSV_TEMPLATE_COLUMNS.map((c) => ({ label: c, get: (r) => r[c] })))
  }

  async function handleImportFile(e) {
    const file = e.target.files?.[0]
    e.target.value = ''
    if (!file) return
    const text = await file.text()
    const rows = parseCsv(text)
    if (rows.length === 0) { setImportResult({ error: 'No rows found in that CSV.' }); return }
    setImporting(true)
    setImportResult(null)
    let succeeded = 0
    const failures = []
    for (const row of rows) {
      const vehicleType = (row.vehicle_type ?? '').toUpperCase().trim()
      const agency = agencies.find((a) => a.name.toLowerCase() === (row.agency ?? '').toLowerCase().trim())
      const district = districts.find((d) => d.name.toLowerCase() === (row.district ?? '').toLowerCase().trim())
      if (!row.plate_number || !VEHICLE_TYPES.includes(vehicleType) || !agency) {
        failures.push(`${row.plate_number || 'Unknown row'}: missing/invalid required field (plate_number, vehicle_type, agency)`)
        continue
      }
      try {
        await api.post('/api/vehicles', {
          plateNumber: row.plate_number.trim().toUpperCase(),
          vehicleType,
          agencyId: agency.agency_id || agency.id,
          districtId: district?.district_id || null,
          capability: row.capability?.trim() || null,
          status: (row.status ?? 'AVAILABLE').toUpperCase(),
        })
        succeeded++
      } catch (err) {
        failures.push(`${row.plate_number}: ${err?.response?.data?.message ?? 'failed to register'}`)
      }
    }
    setImporting(false)
    setImportResult({ succeeded, total: rows.length, failures })
    if (succeeded > 0) load()
  }

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

      <div className="flex flex-nowrap items-center gap-2">
        <div className="relative w-56 shrink-0">
          <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-(--text-muted)" />
          <input
            type="text"
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1) }}
            placeholder="Search plate, type, agency…"
            className="dispatcher-input h-8 w-full rounded-full pl-8 pr-3 text-[11px]"
            style={{ borderRadius: 9999 }}
          />
        </div>
        <div className="ml-auto">
          <FilterDropdown
            label="All Agencies"
            value={agencyFilter}
            onChange={(v) => { setAgencyFilter(v); setPage(1) }}
            options={[{ value: '', label: 'All agencies' }, ...agencies.map((a) => ({ value: a.agency_id || a.id, label: a.name }))]}
          />
        </div>
        <FilterDropdown
          label="All Districts"
          value={districtFilter}
          onChange={(v) => { setDistrictFilter(v); setPage(1) }}
          options={[{ value: '', label: 'All districts' }, { value: '__unassigned__', label: 'Unassigned' }, ...districts.map((d) => ({ value: d.district_id, label: d.name }))]}
        />
        <FilterDropdown
          label="All Statuses"
          value={statusFilter}
          onChange={(v) => { setStatusFilter(v); setPage(1) }}
          options={[{ value: '', label: 'All statuses' }, ...Object.keys(STATUS_LABELS).map((s) => ({ value: s, label: STATUS_LABELS[s] }))]}
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
        <table className="w-full min-w-[900px] text-left border-collapse text-[12px]">
          <thead>
            <tr className="text-[12px] font-medium text-(--text-secondary) border-b border-(--border-subtle)">
              <th className="py-2 px-3 font-bold">Plate Number</th>
              <th className="py-2 px-3 font-bold">Type</th>
              <th className="py-2 px-3 font-bold">Agency</th>
              <th className="py-2 px-3 font-bold">District</th>
              <th className="py-2 px-3 font-bold">Capability</th>
              <th className="py-2 px-3 font-bold">Status</th>
              <th className="py-2 px-3 font-bold">Online</th>
              <th className="py-2 px-3 font-bold">Action</th>
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
              <tr key={u.vehicle_id} className="border-b border-(--border-subtle) last:border-0 dispatcher-table-row">
                <td className="py-3 px-3 font-mono font-bold text-(--accent)">{u.plate_number}</td>
                <td className="py-3 px-3">{u.vehicle_type?.replace(/_/g, ' ')}</td>
                <td className="py-3 px-3">{u.agency_name ?? '—'}</td>
                <td className="py-3 px-3">{u.district_name ?? '—'}</td>
                <td className="py-3 px-3">{u.capability ?? '—'}</td>
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
      </div>

      <AdminPagination page={page} totalPages={totalPages} totalCount={filtered.length} pageSize={PAGE_SIZE} onPageChange={setPage} />

      <div className="dispatcher-surface p-4">
        <h3 className="text-[13px] font-semibold m-0">Bulk Unit Import</h3>
        <p className="text-[12px] text-(--text-muted) m-0 mb-3">Import multiple units from CSV.</p>
        <input ref={fileInputRef} type="file" accept=".csv,text/csv" className="hidden" onChange={handleImportFile} />
        <button
          type="button"
          className="flex items-center justify-center gap-2 rounded-lg mb-3 w-full cursor-pointer"
          style={{ height: 80, border: '2px dashed var(--border)', background: 'var(--bg-elevated)' }}
          onClick={() => fileInputRef.current?.click()}
          disabled={importing}
        >
          <Upload size={20} className="text-(--text-muted)" />
          <span className="text-[13px] text-(--text-muted)">{importing ? 'Importing…' : 'Click to choose a CSV file'}</span>
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
                  Registered {importResult.succeeded} of {importResult.total} units.
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

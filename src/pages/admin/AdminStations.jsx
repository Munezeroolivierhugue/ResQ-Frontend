import { useState, useEffect, useRef } from 'react'
import { MapPin, Plus, Upload, Download, X, Search, Trash2, Pencil } from 'lucide-react'
import AdminPageHeader from '../../components/admin/AdminPageHeader'
import FilterDropdown from '../../components/admin/FilterDropdown'
import AdminPagination from '../../components/admin/AdminPagination'
import { listStations, createStation, updateStation, deleteStation } from '../../api/stations'
import { listAgencies } from '../../api/agencies'
import { listDistricts } from '../../api/districts'
import { downloadCsv, parseCsv } from '../../utils/csv'

const PAGE_SIZE = 10
const CSV_TEMPLATE_COLUMNS = ['name', 'district', 'agency', 'address', 'latitude', 'longitude']

function StationModal({ station, districts, agencies, onClose, onSaved }) {
  const isEdit = !!station
  const [form, setForm] = useState({
    name: station?.name ?? '',
    district_id: station?.district_id ?? districts[0]?.district_id ?? '',
    agency_id: station?.agency_id ?? agencies[0]?.agency_id ?? '',
    address: station?.address ?? '',
    latitude: station?.latitude ?? '',
    longitude: station?.longitude ?? '',
  })
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }))

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!form.name.trim()) { setError('Station name is required.'); return }
    if (!form.district_id) { setError('District is required.'); return }
    if (!form.agency_id) { setError('Agency is required.'); return }
    setSaving(true)
    setError('')
    try {
      const payload = {
        name: form.name.trim(),
        districtId: form.district_id,
        agencyId: form.agency_id,
        address: form.address || null,
        latitude: form.latitude === '' ? null : Number(form.latitude),
        longitude: form.longitude === '' ? null : Number(form.longitude),
      }
      if (isEdit) {
        await updateStation(station.station_id, payload)
      } else {
        await createStation(payload)
      }
      onSaved()
    } catch (err) {
      setError(err?.response?.data?.message || 'Failed to save station.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center" style={{ background: 'rgba(0,0,0,0.5)' }}>
      <div className="dispatcher-surface p-6 w-full max-w-md rounded-xl shadow-2xl">
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-[16px] font-bold">{isEdit ? 'Edit Station' : 'Add New Station'}</h2>
          <button type="button" onClick={onClose} className="dispatcher-btn-icon"><X size={18} /></button>
        </div>
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <label className="aiu-field">
            <span className="aiu-field-label">Station Name *</span>
            <div className="aiu-input-wrap">
              <input className="aiu-input" placeholder="e.g. Nyarugenge Police Station" value={form.name}
                onChange={(e) => set('name', e.target.value)} required />
            </div>
          </label>
          <label className="aiu-field">
            <span className="aiu-field-label">District *</span>
            <div className="aiu-input-wrap">
              <select className="aiu-input aiu-select" value={form.district_id} onChange={(e) => set('district_id', e.target.value)}>
                {districts.map((d) => <option key={d.district_id} value={d.district_id}>{d.name}</option>)}
              </select>
            </div>
          </label>
          <label className="aiu-field">
            <span className="aiu-field-label">Agency *</span>
            <div className="aiu-input-wrap">
              <select className="aiu-input aiu-select" value={form.agency_id} onChange={(e) => set('agency_id', e.target.value)}>
                {agencies.map((a) => <option key={a.agency_id} value={a.agency_id}>{a.name}</option>)}
              </select>
            </div>
          </label>
          <label className="aiu-field">
            <span className="aiu-field-label">Address</span>
            <div className="aiu-input-wrap">
              <input className="aiu-input" placeholder="e.g. KN 4 Ave, Kigali" value={form.address}
                onChange={(e) => set('address', e.target.value)} />
            </div>
          </label>
          <div className="flex gap-3">
            <label className="aiu-field flex-1">
              <span className="aiu-field-label">Latitude</span>
              <div className="aiu-input-wrap">
                <input className="aiu-input" type="number" step="any" placeholder="-1.9441" value={form.latitude}
                  onChange={(e) => set('latitude', e.target.value)} />
              </div>
            </label>
            <label className="aiu-field flex-1">
              <span className="aiu-field-label">Longitude</span>
              <div className="aiu-input-wrap">
                <input className="aiu-input" type="number" step="any" placeholder="30.0619" value={form.longitude}
                  onChange={(e) => set('longitude', e.target.value)} />
              </div>
            </label>
          </div>
          {error && <p className="text-[12px]" style={{ color: 'var(--status-critical)' }}>{error}</p>}
          <div className="flex gap-2 justify-end mt-2">
            <button type="button" className="dispatcher-btn-ghost" onClick={onClose}>Cancel</button>
            <button type="submit" className="dispatcher-btn-primary" disabled={saving}>
              {saving ? 'Saving…' : isEdit ? 'Save Changes' : 'Add Station'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

function DeleteStationCard({ station, onClose, onDeleted }) {
  const [deleting, setDeleting] = useState(false)
  const [error, setError] = useState('')

  async function handleDelete() {
    setDeleting(true)
    setError('')
    try {
      await deleteStation(station.station_id)
      onDeleted()
    } catch (err) {
      setError(err?.response?.data?.message || 'Could not delete station.')
      setDeleting(false)
    }
  }

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center" style={{ background: 'rgba(0,0,0,0.5)' }} onClick={onClose}>
      <div className="dispatcher-surface p-6 w-full max-w-sm rounded-xl shadow-2xl" onClick={(e) => e.stopPropagation()}>
        <h2 className="text-[15px] font-bold m-0">Delete station?</h2>
        <p className="text-[13px] text-(--text-secondary) mt-2 mb-0">
          Delete "{station.name}"? This can't be undone.
        </p>
        {error && <p className="text-[12px] mt-3 mb-0" style={{ color: 'var(--status-critical)' }}>{error}</p>}
        <div className="flex gap-2 justify-end mt-5">
          <button type="button" className="dispatcher-btn-ghost" onClick={onClose}>Cancel</button>
          <button
            type="button"
            className="dispatcher-btn-primary"
            style={{ background: 'var(--status-critical)', borderColor: 'var(--status-critical)' }}
            disabled={deleting}
            onClick={handleDelete}
          >
            {deleting ? 'Deleting…' : 'Delete'}
          </button>
        </div>
      </div>
    </div>
  )
}

export default function AdminStations() {
  const [stations, setStations] = useState([])
  const [districts, setDistricts] = useState([])
  const [agencies, setAgencies] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [search, setSearch] = useState('')
  const [districtFilter, setDistrictFilter] = useState('')
  const [agencyFilter, setAgencyFilter] = useState('')
  const [modal, setModal] = useState(null)
  const [deleteTarget, setDeleteTarget] = useState(null)
  const [page, setPage] = useState(1)

  const [importing, setImporting] = useState(false)
  const [importResult, setImportResult] = useState(null)
  const fileInputRef = useRef(null)

  const load = () => {
    setLoading(true)
    setError(null)
    listStations()
      .then(setStations)
      .catch(() => setError('Failed to load stations.'))
      .finally(() => setLoading(false))
  }

  useEffect(() => {
    load()
    listDistricts().then(setDistricts).catch(() => {})
    listAgencies().then(setAgencies).catch(() => {})
  }, [])

  const districtName = (id) => districts.find((d) => d.district_id === id)?.name
  const agencyName = (id) => agencies.find((a) => a.agency_id === id)?.name

  const filtered = stations.filter((s) => {
    const q = search.toLowerCase()
    const matchSearch = !q ||
      s.name?.toLowerCase().includes(q) ||
      s.address?.toLowerCase().includes(q) ||
      districtName(s.district_id)?.toLowerCase().includes(q)
    const matchDistrict = !districtFilter || s.district_id === districtFilter
    const matchAgency = !agencyFilter || s.agency_id === agencyFilter
    return matchSearch && matchDistrict && matchAgency
  })

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE))
  const displayed = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE)

  function handleExportCsv() {
    downloadCsv('resq_stations.csv', filtered, [
      { label: 'name', get: (s) => s.name },
      { label: 'district', get: (s) => districtName(s.district_id) ?? '' },
      { label: 'agency', get: (s) => agencyName(s.agency_id) ?? '' },
      { label: 'address', get: (s) => s.address ?? '' },
      { label: 'latitude', get: (s) => s.latitude ?? '' },
      { label: 'longitude', get: (s) => s.longitude ?? '' },
    ])
  }

  function handleDownloadTemplate() {
    downloadCsv('resq_stations_import_template.csv', [
      { name: 'Nyarugenge Police Station', district: 'Nyarugenge', agency: 'Rwanda National Police', address: 'KN 4 Ave, Kigali', latitude: '-1.9441', longitude: '30.0619' },
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
      const district = districts.find((d) => d.name?.toLowerCase() === (row.district ?? '').toLowerCase().trim())
      const agency = agencies.find((a) => a.name?.toLowerCase() === (row.agency ?? '').toLowerCase().trim())
      if (!row.name || !district || !agency) {
        failures.push(`${row.name || 'Unknown row'}: missing/invalid required field (name, district, agency)`)
        continue
      }
      try {
        await createStation({
          name: row.name.trim(),
          districtId: district.district_id,
          agencyId: agency.agency_id,
          address: row.address?.trim() || null,
          latitude: row.latitude ? Number(row.latitude) : null,
          longitude: row.longitude ? Number(row.longitude) : null,
        })
        succeeded++
      } catch (err) {
        failures.push(`${row.name}: ${err?.response?.data?.message ?? 'failed to create'}`)
      }
    }
    setImporting(false)
    setImportResult({ succeeded, total: rows.length, failures })
    if (succeeded > 0) load()
  }

  return (
    <div className="portal-page flex flex-col gap-4 min-w-[1024px]">
      <AdminPageHeader
        title="Station Management"
        subtitle="Manage physical stations that units are based out of, per agency and district."
        eyebrow="Super Admin Portal"
        badge="Stations"
        actions={
          <button type="button" className="dispatcher-btn-primary inline-flex items-center gap-2"
            onClick={() => setModal('create')}>
            <Plus size={16} />Add Station
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
            placeholder="Search by name, address, district…"
            className="dispatcher-input h-8 w-full rounded-full pl-8 pr-3 text-[11px]"
            style={{ borderRadius: 9999 }}
          />
        </div>
        <FilterDropdown
          label="All Districts"
          value={districtFilter}
          onChange={(v) => { setDistrictFilter(v); setPage(1) }}
          options={[{ value: '', label: 'All districts' }, ...districts.map((d) => ({ value: d.district_id, label: d.name }))]}
        />
        <div className="ml-auto">
          <FilterDropdown
            label="All Agencies"
            value={agencyFilter}
            onChange={(v) => { setAgencyFilter(v); setPage(1) }}
            options={[{ value: '', label: 'All agencies' }, ...agencies.map((a) => ({ value: a.agency_id, label: a.name }))]}
          />
        </div>
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
        <table className="w-full min-w-[800px] text-left border-collapse text-[12px]">
          <thead>
            <tr className="text-[12px] font-medium text-(--text-secondary) border-b border-(--border-subtle)">
              <th className="py-2 px-3 font-bold">Station</th>
              <th className="py-2 px-3 font-bold">District</th>
              <th className="py-2 px-3 font-bold">Agency</th>
              <th className="py-2 px-3 font-bold">Action</th>
            </tr>
          </thead>
          <tbody>
            {loading && (
              <tr><td colSpan={4} className="py-8 text-center text-(--text-muted)">Loading stations…</td></tr>
            )}
            {error && !loading && (
              <tr><td colSpan={4} className="py-8 text-center" style={{ color: 'var(--status-critical)' }}>{error}</td></tr>
            )}
            {!loading && !error && displayed.length === 0 && (
              <tr><td colSpan={4} className="py-8 text-center text-(--text-muted)">No stations found.</td></tr>
            )}
            {!loading && !error && displayed.map((s) => (
              <tr key={s.station_id} className="border-b border-(--border-subtle) last:border-0 dispatcher-table-row">
                <td className="py-3 px-3">
                  <div className="flex items-center gap-2">
                    <span className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0"
                      style={{ background: 'var(--accent-ghost)' }}>
                      <MapPin size={13} style={{ color: 'var(--accent)' }} />
                    </span>
                    <span className="font-medium">{s.name}</span>
                  </div>
                </td>
                <td className="py-3 px-3">{districtName(s.district_id) ?? '—'}</td>
                <td className="py-3 px-3">{agencyName(s.agency_id) ?? '—'}</td>
                <td className="py-3 px-3">
                  <div className="flex gap-2">
                    <button type="button" className="dispatcher-btn-icon" title="Edit station details"
                      onClick={() => setModal(s)}>
                      <Pencil size={14} />
                    </button>
                    <button type="button" className="dispatcher-btn-icon" style={{ color: 'var(--status-critical)' }}
                      title="Delete station" onClick={() => setDeleteTarget(s)}>
                      <Trash2 size={14} />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <AdminPagination page={page} totalPages={totalPages} totalCount={filtered.length} pageSize={PAGE_SIZE} onPageChange={setPage} />

      <div className="dispatcher-surface p-4">
        <h3 className="text-[13px] font-semibold m-0">Bulk Station Import</h3>
        <p className="text-[12px] text-(--text-muted) m-0 mb-3">Import multiple stations from CSV.</p>
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
                  Added {importResult.succeeded} of {importResult.total} stations.
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
        <StationModal
          station={modal === 'create' ? null : modal}
          districts={districts}
          agencies={agencies}
          onClose={() => setModal(null)}
          onSaved={() => { setModal(null); load() }}
        />
      )}

      {deleteTarget && (
        <DeleteStationCard
          station={deleteTarget}
          onClose={() => setDeleteTarget(null)}
          onDeleted={() => { setDeleteTarget(null); load() }}
        />
      )}
    </div>
  )
}

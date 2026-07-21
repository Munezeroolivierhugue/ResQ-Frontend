import { useState, useEffect, useRef } from 'react'
import { Building2, Plus, Upload, Download, X, Search } from 'lucide-react'
import AdminPageHeader from '../../components/admin/AdminPageHeader'
import FilterDropdown from '../../components/admin/FilterDropdown'
import AdminPagination from '../../components/admin/AdminPagination'
import { listAgencies, createAgency, updateAgency } from '../../api/agencies'
import { downloadCsv, parseCsv } from '../../utils/csv'

const AGENCY_TYPES = ['POLICE', 'FIRE', 'MEDICAL', 'CIVIL_PROTECTION', 'MILITARY', 'OTHER']
const PAGE_SIZE = 10
const CSV_TEMPLATE_COLUMNS = ['name', 'type', 'email', 'phone']

function AgencyModal({ agency, onClose, onSaved }) {
  const isEdit = !!agency
  const [form, setForm] = useState({
    name:  agency?.name  ?? '',
    type:  agency?.type  ?? 'POLICE',
    email: agency?.email ?? '',
    phone: agency?.phone ?? '',
  })
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }))

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!form.name.trim()) { setError('Agency name is required.'); return }
    setSaving(true)
    setError('')
    try {
      const payload = {
        name:  form.name.trim(),
        type:  form.type,
        email: form.email || null,
        phone: form.phone || null,
      }
      if (isEdit) {
        await updateAgency(agency.agency_id, payload)
      } else {
        await createAgency(payload)
      }
      onSaved()
    } catch (err) {
      setError(err?.response?.data?.message || 'Failed to save agency.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center" style={{ background: 'rgba(0,0,0,0.5)' }}>
      <div className="dispatcher-surface p-6 w-full max-w-md rounded-xl shadow-2xl">
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-[16px] font-bold">{isEdit ? 'Edit Agency' : 'Add New Agency'}</h2>
          <button type="button" onClick={onClose} className="dispatcher-btn-icon"><X size={18} /></button>
        </div>
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <label className="aiu-field">
            <span className="aiu-field-label">Agency Name *</span>
            <div className="aiu-input-wrap">
              <input className="aiu-input" placeholder="e.g. Rwanda National Police" value={form.name}
                onChange={(e) => set('name', e.target.value)} required />
            </div>
          </label>
          <label className="aiu-field">
            <span className="aiu-field-label">Type *</span>
            <div className="aiu-input-wrap">
              <select className="aiu-input aiu-select" value={form.type} onChange={(e) => set('type', e.target.value)}>
                {AGENCY_TYPES.map((t) => <option key={t} value={t}>{t.replace(/_/g, ' ')}</option>)}
              </select>
            </div>
          </label>
          <label className="aiu-field">
            <span className="aiu-field-label">Email</span>
            <div className="aiu-input-wrap">
              <input className="aiu-input" type="email" placeholder="contact@agency.gov.rw" value={form.email}
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
          {error && <p className="text-[12px]" style={{ color: 'var(--status-critical)' }}>{error}</p>}
          <div className="flex gap-2 justify-end mt-2">
            <button type="button" className="dispatcher-btn-ghost" onClick={onClose}>Cancel</button>
            <button type="submit" className="dispatcher-btn-primary" disabled={saving}>
              {saving ? 'Saving…' : isEdit ? 'Save Changes' : 'Add Agency'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default function AdminAgencies() {
  const [agencies, setAgencies] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [search, setSearch] = useState('')
  const [typeFilter, setTypeFilter] = useState('')
  const [modal, setModal] = useState(null)
  const [page, setPage] = useState(1)

  const [importing, setImporting] = useState(false)
  const [importResult, setImportResult] = useState(null)
  const fileInputRef = useRef(null)

  const load = () => {
    setLoading(true)
    setError(null)
    listAgencies()
      .then(setAgencies)
      .catch(() => setError('Failed to load agencies.'))
      .finally(() => setLoading(false))
  }

  useEffect(() => { load() }, [])

  const filtered = agencies.filter((a) => {
    const q = search.toLowerCase()
    const matchSearch = !q ||
      a.name?.toLowerCase().includes(q) ||
      a.type?.toLowerCase().includes(q) ||
      a.email?.toLowerCase().includes(q)
    const matchType = !typeFilter || a.type === typeFilter
    return matchSearch && matchType
  })

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE))
  const displayed = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE)

  function handleExportCsv() {
    downloadCsv('resq_agencies.csv', filtered, [
      { label: 'name', get: (a) => a.name },
      { label: 'type', get: (a) => a.type },
      { label: 'email', get: (a) => a.email ?? '' },
      { label: 'phone', get: (a) => a.phone ?? '' },
    ])
  }

  function handleDownloadTemplate() {
    downloadCsv('resq_agencies_import_template.csv', [
      { name: 'Rwanda National Police', type: 'POLICE', email: 'contact@rnp.gov.rw', phone: '+250788300300' },
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
      const type = (row.type ?? '').toUpperCase().trim()
      if (!row.name || !AGENCY_TYPES.includes(type)) {
        failures.push(`${row.name || 'Unknown row'}: missing/invalid required field (name, type)`)
        continue
      }
      try {
        await createAgency({
          name: row.name.trim(),
          type,
          email: row.email?.trim() || null,
          phone: row.phone?.trim() || null,
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
        title="Agency Management"
        subtitle="Manage all response agencies — police, fire, medical, and civil protection."
        eyebrow="Super Admin Portal"
        badge="Agencies"
        actions={
          <button type="button" className="dispatcher-btn-primary inline-flex items-center gap-2"
            onClick={() => setModal('create')}>
            <Plus size={16} />Add Agency
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
            placeholder="Search by name, type, email…"
            className="dispatcher-input h-8 w-full rounded-full pl-8 pr-3 text-[11px]"
            style={{ borderRadius: 9999 }}
          />
        </div>
        <div className="ml-auto">
          <FilterDropdown
            label="All Types"
            value={typeFilter}
            onChange={(v) => { setTypeFilter(v); setPage(1) }}
            options={[{ value: '', label: 'All types' }, ...AGENCY_TYPES.map((t) => ({ value: t, label: t.replace(/_/g, ' ') }))]}
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
        <table className="w-full min-w-[700px] text-left border-collapse text-[12px]">
          <thead>
            <tr className="text-[12px] font-medium text-(--text-secondary) border-b border-(--border-subtle)">
              <th className="py-2 px-3 font-bold">Agency</th>
              <th className="py-2 px-3 font-bold">Type</th>
              <th className="py-2 px-3 font-bold">Email</th>
              <th className="py-2 px-3 font-bold">Phone</th>
              <th className="py-2 px-3 font-bold">Action</th>
            </tr>
          </thead>
          <tbody>
            {loading && (
              <tr><td colSpan={5} className="py-8 text-center text-(--text-muted)">Loading agencies…</td></tr>
            )}
            {error && !loading && (
              <tr><td colSpan={5} className="py-8 text-center" style={{ color: 'var(--status-critical)' }}>{error}</td></tr>
            )}
            {!loading && !error && displayed.length === 0 && (
              <tr><td colSpan={5} className="py-8 text-center text-(--text-muted)">No agencies found.</td></tr>
            )}
            {!loading && !error && displayed.map((a) => (
              <tr key={a.agency_id} className="border-b border-(--border-subtle) last:border-0 dispatcher-table-row">
                <td className="py-3 px-3">
                  <div className="flex items-center gap-2">
                    <span className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0"
                      style={{ background: 'var(--accent-ghost)' }}>
                      <Building2 size={13} style={{ color: 'var(--accent)' }} />
                    </span>
                    <span className="font-medium">{a.name}</span>
                  </div>
                </td>
                <td className="py-3 px-3">{a.type?.replace(/_/g, ' ') ?? '—'}</td>
                <td className="py-3 px-3">{a.email ?? '—'}</td>
                <td className="py-3 px-3">{a.phone ?? '—'}</td>
                <td className="py-3 px-3">
                  <button type="button" className="dispatcher-btn-ghost text-[11px]"
                    onClick={() => setModal(a)}>
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
        <h3 className="text-[13px] font-semibold m-0">Bulk Agency Import</h3>
        <p className="text-[12px] text-(--text-muted) m-0 mb-3">Import multiple agencies from CSV.</p>
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
                  Added {importResult.succeeded} of {importResult.total} agencies.
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
        <AgencyModal
          agency={modal === 'create' ? null : modal}
          onClose={() => setModal(null)}
          onSaved={() => { setModal(null); load() }}
        />
      )}
    </div>
  )
}

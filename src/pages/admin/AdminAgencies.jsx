import { useState, useEffect } from 'react'
import { Building2, Plus, RefreshCw, Search, X } from 'lucide-react'
import AdminPageHeader from '../../components/admin/AdminPageHeader'
import { listAgencies, createAgency, updateAgency } from '../../api/agencies'

const AGENCY_TYPES = ['POLICE', 'FIRE', 'MEDICAL', 'CIVIL_PROTECTION', 'MILITARY', 'OTHER']
const PAGE_SIZE = 20

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
          <label className="dispatcher-field">
            <span className="field-label">Agency Name *</span>
            <input className="dispatcher-input" placeholder="e.g. Rwanda National Police" value={form.name}
              onChange={(e) => set('name', e.target.value)} required />
          </label>
          <label className="dispatcher-field">
            <span className="field-label">Type *</span>
            <select className="dispatcher-input" value={form.type} onChange={(e) => set('type', e.target.value)}>
              {AGENCY_TYPES.map((t) => <option key={t} value={t}>{t.replace(/_/g, ' ')}</option>)}
            </select>
          </label>
          <label className="dispatcher-field">
            <span className="field-label">Email</span>
            <input className="dispatcher-input" type="email" placeholder="contact@agency.gov.rw" value={form.email}
              onChange={(e) => set('email', e.target.value)} />
          </label>
          <label className="dispatcher-field">
            <span className="field-label">Phone</span>
            <input className="dispatcher-input" placeholder="+250 7xx xxx xxx" value={form.phone}
              onChange={(e) => set('phone', e.target.value)} />
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
  const [modal, setModal] = useState(null)
  const [page, setPage] = useState(1)

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
    return !q ||
      a.name?.toLowerCase().includes(q) ||
      a.type?.toLowerCase().includes(q) ||
      a.email?.toLowerCase().includes(q)
  })

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE))
  const displayed = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE)

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

      <div className="flex flex-wrap gap-3 items-center">
        <div className="relative flex-1 min-w-[200px] max-w-sm">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-(--text-muted)" />
          <input
            className="dispatcher-input pl-8 h-9 w-full text-[13px]"
            placeholder="Search by name, type, email…"
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1) }}
          />
        </div>
        <button type="button" className="dispatcher-btn-ghost h-9 inline-flex items-center gap-1.5 text-[12px]" onClick={load}>
          <RefreshCw size={13} />Refresh
        </button>
        <span className="text-[12px] text-(--text-muted) ml-auto">
          {filtered.length} agenc{filtered.length !== 1 ? 'ies' : 'y'}
        </span>
      </div>

      <div className="dispatcher-surface table-scroll">
        <table className="w-full min-w-[700px] text-left border-collapse text-[12px]">
          <thead>
            <tr className="text-[10px] uppercase tracking-wide text-(--text-muted) border-b border-(--border-subtle)">
              <th className="py-2 px-3 font-semibold">Agency</th>
              <th className="py-2 px-3 font-semibold">Type</th>
              <th className="py-2 px-3 font-semibold">Email</th>
              <th className="py-2 px-3 font-semibold">Phone</th>
              <th className="py-2 px-3 font-semibold">Action</th>
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
              <tr key={a.agency_id} className="border-b border-(--border-subtle) last:border-0 hover:bg-(--bg-elevated)/40">
                <td className="py-3 px-3">
                  <div className="flex items-center gap-2">
                    <span className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0"
                      style={{ background: 'var(--accent-ghost)' }}>
                      <Building2 size={13} style={{ color: 'var(--accent)' }} />
                    </span>
                    <span className="font-medium">{a.name}</span>
                  </div>
                </td>
                <td className="py-3 px-3">
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded"
                    style={{ background: 'var(--bg-elevated)', color: 'var(--text-secondary)' }}>
                    {a.type?.replace(/_/g, ' ') ?? '—'}
                  </span>
                </td>
                <td className="py-3 px-3 text-(--text-secondary)">{a.email ?? '—'}</td>
                <td className="py-3 px-3 font-mono text-(--text-muted)">{a.phone ?? '—'}</td>
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
        <AgencyModal
          agency={modal === 'create' ? null : modal}
          onClose={() => setModal(null)}
          onSaved={() => { setModal(null); load() }}
        />
      )}
    </div>
  )
}

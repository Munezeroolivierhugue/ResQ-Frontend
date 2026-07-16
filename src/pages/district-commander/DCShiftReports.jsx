import { useEffect, useMemo, useState } from 'react'
import { ChevronLeft, ChevronRight, X, Download, FileCheck } from 'lucide-react'
import { buildPdfHtml, openPdfWindow } from '../../utils/pdfExport'
import StatusBadge from '../../components/dispatcher/StatusBadge'
import SectionTitle from '../../components/dispatcher/SectionTitle'
import DCPageHeader from '../../components/district-commander/DCPageHeader'
import { listActiveShifts } from '../../api/shifts'
import { listIncidents } from '../../api/incidents'
import { getCurrentUser } from '../../utils/authSession'

const PAGE_SIZE = 15
const STATUS_OPTIONS = ['All', 'ACTIVE', 'COMPLETED']

function fmtDateTime(iso) {
  if (!iso) return '—'
  return new Date(iso).toLocaleString('en-GB', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })
}

// Shifts have no per-record incident stats — compute real ones by
// time-filtering this district's incidents to each shift's own window,
// the same approach the dispatcher's and Ops Manager's own shift pages use.
function shiftStats(shift, incidents) {
  if (!shift.shift_start) return { total: 0, avgResponse: null, resolutionRate: null }
  const start = new Date(shift.shift_start)
  const end = shift.shift_end ? new Date(shift.shift_end) : new Date()
  const inShift = incidents.filter((i) => {
    if (!i.call_time) return false
    const t = new Date(i.call_time)
    return t >= start && t <= end
  })
  const rt = inShift.map((i) => i.response_time_minutes).filter((v) => v != null && v > 0)
  const closed = inShift.filter((i) => i.status === 'CLOSED').length
  return {
    total: inShift.length,
    avgResponse: rt.length ? rt.reduce((a, b) => a + b, 0) / rt.length : null,
    resolutionRate: inShift.length ? closed / inShift.length : null,
  }
}

function exportShiftPDF(shift, stats) {
  const period = shift.shift_start ? `${fmtDateTime(shift.shift_start)} — ${shift.shift_end ? fmtDateTime(shift.shift_end) : 'Ongoing'}` : '—'
  openPdfWindow(buildPdfHtml({
    title: 'District Shift Report',
    subtitle: period,
    reportType: 'SHIFT REPORT',
    idPrefix: 'SHF',
    metaItems: [
      { label: 'Officer', value: shift.user_name ?? '—' },
      { label: 'Role', value: shift.role_on_shift ?? '—' },
      { label: 'Period', value: period },
      { label: 'Status', value: shift.status ?? '—' },
    ],
    kpis: [
      { label: 'Total Incidents', value: stats.total, sub: 'This shift' },
      { label: 'Avg Response Time', value: stats.avgResponse != null ? `${stats.avgResponse.toFixed(1)} min` : '—', sub: 'Target < 8 min' },
      { label: 'Resolution Rate', value: stats.resolutionRate != null ? `${Math.round(stats.resolutionRate * 100)}%` : '—' },
      { label: 'District', value: shift.district_name ?? '—' },
    ],
    sections: shift.handover_notes
      ? [`<div style="margin-top:16px"><h3 style="font-size:13px">Handover Notes</h3><p style="font-size:12px;line-height:1.6;white-space:pre-wrap">${shift.handover_notes}</p></div>`]
      : [],
    generatedBy: shift.user_name ?? 'District Commander',
    generatedRole: 'District Commander',
  }))
}

export default function DCShiftReports() {
  const districtId = getCurrentUser()?.district_id

  const [shifts, setShifts] = useState([])
  const [incidents, setIncidents] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('All')
  const [roleFilter, setRoleFilter] = useState('All')
  const [dateFrom, setDateFrom] = useState('')
  const [dateTo, setDateTo] = useState('')
  const [dateError, setDateError] = useState(null)

  // "To" must be the same day as "From" or later — never before it.
  const handleDateFromChange = (value) => {
    setDateFrom(value)
    setDateError(null)
    if (value && dateTo && dateTo < value) setDateTo(value)
  }
  const handleDateToChange = (value) => {
    if (dateFrom && value && value < dateFrom) {
      setDateError('"To" date cannot be before "From" date.')
      return
    }
    setDateError(null)
    setDateTo(value)
  }
  const [page, setPage] = useState(1)

  const [selectedId, setSelectedId] = useState(null)

  useEffect(() => {
    if (!districtId) { Promise.resolve().then(() => setLoading(false)); return }
    Promise.all([listActiveShifts(districtId), listIncidents({ districtId })])
      .then(([s, i]) => {
        setShifts(s.sort((a, b) => new Date(b.shift_start) - new Date(a.shift_start)))
        setIncidents(i)
      })
      .catch(() => setError('Failed to load shift reports'))
      .finally(() => setLoading(false))
  }, [districtId])

  const roleOptions = useMemo(() => {
    const roles = new Set(shifts.map((s) => s.role_on_shift).filter(Boolean))
    return ['All', ...Array.from(roles).sort()]
  }, [shifts])

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase()
    const from = dateFrom ? new Date(dateFrom + 'T00:00:00') : null
    const to = dateTo ? new Date(dateTo + 'T23:59:59') : null
    return shifts.filter((s) => {
      if (statusFilter !== 'All' && s.status !== statusFilter) return false
      if (roleFilter !== 'All' && s.role_on_shift !== roleFilter) return false
      if (s.shift_start) {
        const t = new Date(s.shift_start)
        if (from && t < from) return false
        if (to && t > to) return false
      }
      if (!q) return true
      return (s.user_name ?? '').toLowerCase().includes(q)
    })
  }, [shifts, statusFilter, roleFilter, dateFrom, dateTo, search])

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE))
  const pageShifts = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE)

  useEffect(() => {
    if (page > totalPages) Promise.resolve().then(() => setPage(totalPages))
  }, [page, totalPages])

  useEffect(() => { Promise.resolve().then(() => setPage(1)) }, [statusFilter, roleFilter, dateFrom, dateTo, search])

  const selected = shifts.find((s) => s.shift_id === selectedId)
  const selectedStats = selected ? shiftStats(selected, incidents) : null

  return (
    <div className="portal-page relative">
      <DCPageHeader
        title="Shift Reports"
        eyebrow="District Commander"
        subtitle="Real shift records for officers assigned to this district."
      />

      {error && (
        <div className="text-[12px] px-3 py-2 rounded mb-4" style={{ background: 'var(--status-critical-bg)', color: 'var(--status-critical)' }}>
          {error}
        </div>
      )}

      <div className="flex flex-wrap items-end gap-3 mb-4">
        <label className="dispatcher-field flex-1 min-w-[12rem] max-w-sm mb-0">
          <span className="field-label">Search</span>
          <input
            className="dispatcher-input dispatcher-text-input"
            style={{ height: '40px' }}
            placeholder="Officer name..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </label>
        <label className="dispatcher-field mb-0">
          <span className="field-label">Status</span>
          <select
            className="dispatcher-input dispatcher-select"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
          >
            {STATUS_OPTIONS.map((s) => (
              <option key={s} value={s}>{s === 'All' ? 'All statuses' : s}</option>
            ))}
          </select>
        </label>
        <label className="dispatcher-field mb-0">
          <span className="field-label">Role</span>
          <select
            className="dispatcher-input dispatcher-select"
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value)}
          >
            {roleOptions.map((r) => (
              <option key={r} value={r}>{r === 'All' ? 'All roles' : r}</option>
            ))}
          </select>
        </label>
        <label className="dispatcher-field mb-0">
          <span className="field-label">From</span>
          <input
            type="date"
            className="dispatcher-input dispatcher-text-input"
            style={{ height: '40px' }}
            value={dateFrom}
            max={dateTo || undefined}
            onChange={(e) => handleDateFromChange(e.target.value)}
          />
        </label>
        <label className="dispatcher-field mb-0">
          <span className="field-label">To</span>
          <input
            type="date"
            className="dispatcher-input dispatcher-text-input"
            style={{ height: '40px' }}
            value={dateTo}
            min={dateFrom || undefined}
            onChange={(e) => handleDateToChange(e.target.value)}
          />
        </label>
      </div>

      {dateError && (
        <p className="text-[12px] mb-4 mt-[-8px]" style={{ color: 'var(--status-critical)' }}>{dateError}</p>
      )}

      <div className="dispatcher-surface table-scroll">
        <table className="w-full min-w-[820px] text-left border-collapse text-[12px]">
          <thead>
            <tr className="text-[10px] uppercase tracking-wide text-(--text-muted) border-b border-(--border-subtle)">
              <th className="py-2 px-3 font-semibold">Officer</th>
              <th className="py-2 px-3 font-semibold">Role</th>
              <th className="py-2 px-3 font-semibold">Shift Start</th>
              <th className="py-2 px-3 font-semibold">Status</th>
              <th className="py-2 px-3 font-semibold">Action</th>
            </tr>
          </thead>
          <tbody>
            {loading && (
              <tr><td colSpan={5} className="py-6 text-center text-[13px] text-(--text-muted)">Loading shift reports…</td></tr>
            )}
            {!loading && !error && filtered.length === 0 && (
              <tr><td colSpan={5} className="py-6 text-center text-[13px] text-(--text-muted)">No shift reports found.</td></tr>
            )}
            {!loading && pageShifts.map((s) => (
              <tr
                key={s.shift_id}
                className="border-b border-(--border-subtle) last:border-0 cursor-pointer hover:bg-(--bg-elevated)/50"
                onClick={() => setSelectedId(s.shift_id)}
              >
                <td className="py-3 px-3 font-semibold text-(--text-primary)">{s.user_name ?? '—'}</td>
                <td className="py-3 px-3 text-(--text-secondary)">{s.role_on_shift ?? '—'}</td>
                <td className="py-3 px-3 font-mono text-(--text-secondary)">{fmtDateTime(s.shift_start)}</td>
                <td className="py-3 px-3">
                  <StatusBadge label={s.status ?? '—'} variant={s.status === 'ACTIVE' ? 'resolved' : 'handover'} />
                </td>
                <td className="py-3 px-3">
                  <button
                    type="button"
                    onClick={(e) => { e.stopPropagation(); setSelectedId(s.shift_id) }}
                    className="inline-flex items-center gap-1 px-1 py-1 rounded-lg cursor-pointer text-[11px] font-bold text-(--accent) transition-opacity hover:opacity-70"
                    style={{ background: 'none', border: 'none' }}
                  >
                    <FileCheck size={12} />
                    View
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {!loading && filtered.length > 0 && (
        <div className="flex items-center justify-between gap-3 mt-3 text-[12px] text-(--text-secondary)">
          <span>
            Showing {(page - 1) * PAGE_SIZE + 1}–{Math.min(page * PAGE_SIZE, filtered.length)} of {filtered.length}
          </span>
          <div className="flex items-center gap-2">
            <button
              type="button"
              className="dispatcher-btn-ghost text-[12px] flex items-center gap-1 disabled:opacity-40 disabled:cursor-not-allowed"
              disabled={page <= 1}
              onClick={() => setPage((p) => Math.max(1, p - 1))}
            >
              <ChevronLeft size={14} /> Prev
            </button>
            <span className="font-mono">{page} / {totalPages}</span>
            <button
              type="button"
              className="dispatcher-btn-ghost text-[12px] flex items-center gap-1 disabled:opacity-40 disabled:cursor-not-allowed"
              disabled={page >= totalPages}
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            >
              Next <ChevronRight size={14} />
            </button>
          </div>
        </div>
      )}

      {selected && selectedStats && (
        <div className="fixed inset-0 z-[10000] flex items-center justify-center p-4" role="dialog" aria-modal="true" aria-labelledby="dc-shift-report-title">
          <button
            type="button"
            aria-label="Close"
            onClick={() => setSelectedId(null)}
            className="absolute inset-0 border-none cursor-pointer"
            style={{ background: 'rgba(0,0,0,0.5)' }}
          />
          <div className="relative w-full max-w-2xl max-h-[85vh] overflow-y-auto rounded-xl border border-(--border) bg-(--bg-surface) p-5 md:p-6">
            <button
              type="button"
              onClick={() => setSelectedId(null)}
              aria-label="Close"
              className="absolute top-4 right-4 border-none cursor-pointer text-(--text-secondary) hover:text-(--text-primary)"
              style={{ background: 'none' }}
            >
              <X size={18} />
            </button>

            <div className="flex items-start justify-between gap-2 pr-8">
              <div className="min-w-0">
                <div id="dc-shift-report-title" className="dispatcher-eyebrow">Shift report</div>
                <h2 className="text-xl font-bold m-0 mt-1" style={{ fontFamily: 'var(--font-display)' }}>
                  {selected.user_name ?? '—'}
                </h2>
                <p className="text-[13px] text-(--text-secondary) m-0 mt-1">
                  {selected.role_on_shift ?? '—'} · {fmtDateTime(selected.shift_start)} — {selected.shift_end ? fmtDateTime(selected.shift_end) : 'Ongoing'}
                </p>
              </div>
              <button
                type="button"
                onClick={() => exportShiftPDF(selected, selectedStats)}
                className="inline-flex items-center gap-1.5 px-2 py-1.5 rounded-lg cursor-pointer text-[12px] font-bold text-(--accent) transition-opacity hover:opacity-70 shrink-0"
                style={{ background: 'none', border: 'none' }}
              >
                <Download size={14} />
                Download PDF
              </button>
            </div>

            <div className="flex flex-col gap-5 mt-4">
              <div>
                <SectionTitle title="Key metrics" className="mb-3" />
                <div className="grid grid-cols-2 gap-2">
                  {[
                    ['Total Incidents', selectedStats.total],
                    ['Avg Response', selectedStats.avgResponse != null ? `${selectedStats.avgResponse.toFixed(1)}m` : '—'],
                    ['Resolution Rate', selectedStats.resolutionRate != null ? `${Math.round(selectedStats.resolutionRate * 100)}%` : '—'],
                    ['District', selected.district_name ?? '—'],
                  ].map(([label, val]) => (
                    <div key={label} className="dispatcher-summary-stat">
                      <div className="field-label mb-0.5">{label}</div>
                      <div className="text-[14px] font-bold font-mono">{String(val)}</div>
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <SectionTitle title="Handover notes" className="mb-3" />
                <p className="text-[13px] text-(--text-secondary) m-0" style={{ whiteSpace: 'pre-wrap' }}>
                  {selected.handover_notes || 'No notes submitted for this shift yet.'}
                </p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

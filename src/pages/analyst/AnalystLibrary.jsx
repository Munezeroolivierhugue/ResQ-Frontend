import { useState, useEffect, useMemo } from 'react'
import { Search } from 'lucide-react'
import AnalystPageHeader from '../../components/analyst/AnalystPageHeader'
import StatusBadge from '../../components/dispatcher/StatusBadge'
import FilterDropdown from '../../components/admin/FilterDropdown'
import AdminPagination from '../../components/admin/AdminPagination'
import { listReports, getReport } from '../../api/reporting'
import { listDistricts } from '../../api/districts'

const PAGE_SIZE = 10

export default function AnalystLibrary() {
  const [reports, setReports] = useState([])
  const [districts, setDistricts] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [typeFilter, setTypeFilter] = useState('')
  const [districtFilter, setDistrictFilter] = useState('')
  const [preview, setPreview] = useState(null)
  const [previewLoading, setPreviewLoading] = useState(false)
  const [page, setPage] = useState(1)

  useEffect(() => {
    Promise.all([listReports(), listDistricts()])
      .then(([r, d]) => {
        setReports(r)
        setDistricts(d)
      })
      .finally(() => setLoading(false))
  }, [])

  const reportTypes = useMemo(() => [...new Set(reports.map((r) => r.report_type).filter(Boolean))], [reports])

  const filtered = reports.filter((r) => {
    if (typeFilter && r.report_type !== typeFilter) return false
    if (districtFilter && r.district_id !== districtFilter) return false
    if (search) {
      const q = search.toLowerCase()
      const hay = `${r.report_type ?? ''} ${r.district_name ?? ''} ${r.generated_by_name ?? ''}`.toLowerCase()
      if (!hay.includes(q)) return false
    }
    return true
  })

  useEffect(() => { Promise.resolve().then(() => setPage(1)) }, [search, typeFilter, districtFilter])
  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE))
  const pageReports = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE)

  function openPreview(reportId) {
    setPreviewLoading(true)
    setPreview({ report_id: reportId })
    getReport(reportId)
      .then(setPreview)
      .finally(() => setPreviewLoading(false))
  }

  return (
    <div className="portal-page flex flex-col gap-4 min-w-[1024px]">
      <AnalystPageHeader
        title="Report Library"
        subtitle="Every generated report, real data only."
        badge="Report Library"
      />

      <div className="flex flex-nowrap items-center gap-2">
        <div className="relative flex-1 min-w-[200px]">
          <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-(--text-muted)" />
          <input
            className="dispatcher-input dispatcher-text-input h-9 w-full pl-8 text-[12px]"
            placeholder="Search by type, district, author..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <FilterDropdown
          label="All types"
          value={typeFilter}
          onChange={setTypeFilter}
          options={[{ value: '', label: 'All types' }, ...reportTypes.map((t) => ({ value: t, label: t }))]}
        />
        <FilterDropdown
          label="All districts"
          value={districtFilter}
          onChange={setDistrictFilter}
          options={[{ value: '', label: 'All districts' }, ...districts.map((d) => ({ value: d.district_id, label: d.name }))]}
        />
      </div>

      <div className="dispatcher-surface overflow-x-auto">
        <table className="w-full text-[12px] min-w-[760px]">
          <thead>
            <tr className="text-(--text-secondary) font-bold border-b border-(--border)">
              <th className="text-left p-3">Report Type</th>
              <th className="text-left p-3">District</th>
              <th className="text-left p-3">Period</th>
              <th className="p-3">Author</th>
              <th className="p-3">Generated</th>
              <th className="p-3">Status</th>
              <th className="p-3">Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading && (
              <tr><td colSpan={7} className="p-6 text-center text-(--text-muted)">Loading…</td></tr>
            )}
            {!loading && filtered.length === 0 && (
              <tr><td colSpan={7} className="p-6 text-center text-(--text-muted)">No reports found.</td></tr>
            )}
            {pageReports.map((r) => (
              <tr key={r.report_id} className="border-b border-(--border-subtle) dispatcher-table-row">
                <td className="p-3 font-medium">{r.report_type}</td>
                <td className="p-3">{r.district_name ?? 'All Districts'}</td>
                <td className="p-3 font-mono">{r.period_start ?? '—'} → {r.period_end ?? '—'}</td>
                <td className="p-3 text-center">{r.generated_by_name ?? '—'}</td>
                <td className="p-3 text-center font-mono">{r.generated_at ? new Date(r.generated_at).toLocaleDateString() : '—'}</td>
                <td className="p-3 text-center">
                  <StatusBadge label={r.status} variant={r.status === 'SUBMITTED' ? 'resolved' : 'handover'} />
                </td>
                <td className="p-3 text-center">
                  <button type="button" className="dispatcher-btn-ghost text-[10px] h-7 px-2" onClick={() => openPreview(r.report_id)}>
                    Preview
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <AdminPagination page={page} totalPages={totalPages} totalCount={filtered.length} pageSize={PAGE_SIZE} onPageChange={setPage} />

      {preview && (
        <div className="fixed inset-0 z-[300] flex items-center justify-center p-4" style={{ background: 'rgba(0,0,0,0.5)' }} onClick={() => setPreview(null)}>
          <div className="dispatcher-surface p-6 w-full max-w-[640px] max-h-[80vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            {previewLoading ? (
              <p className="text-[12px] text-(--text-muted)">Loading…</p>
            ) : (
              <>
                <h3 className="text-[15px] font-bold m-0 mb-1">{preview.report_type}</h3>
                <p className="text-[12px] text-(--text-muted) m-0 mb-4">
                  {preview.district_name ?? 'All Districts'} · {preview.period_start ?? '—'} → {preview.period_end ?? '—'}
                </p>
                <div className="grid grid-cols-2 gap-3 mb-4 text-[12px]">
                  <div><span className="text-(--text-muted)">Total incidents</span><div className="font-mono font-semibold">{preview.total_incidents ?? '—'}</div></div>
                  <div><span className="text-(--text-muted)">Avg response time</span><div className="font-mono font-semibold">{preview.avg_response_time != null ? `${preview.avg_response_time.toFixed(1)}m` : '—'}</div></div>
                  <div><span className="text-(--text-muted)">Resolution rate</span><div className="font-mono font-semibold">{preview.resolution_rate != null ? `${preview.resolution_rate.toFixed(1)}%` : '—'}</div></div>
                  <div><span className="text-(--text-muted)">Status</span><div className="font-mono font-semibold">{preview.status}</div></div>
                </div>
                {preview.content && (
                  <pre className="text-[11px] whitespace-pre-wrap p-3 rounded" style={{ background: 'var(--bg-elevated)' }}>{preview.content}</pre>
                )}
              </>
            )}
            <div className="flex justify-end mt-4">
              <button type="button" className="dispatcher-btn-ghost" onClick={() => setPreview(null)}>Close</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

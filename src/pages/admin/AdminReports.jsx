import { useState, useEffect, useMemo } from 'react'
import { Search, FileCheck } from 'lucide-react'
import AdminPageHeader from '../../components/admin/AdminPageHeader'
import StatusBadge from '../../components/dispatcher/StatusBadge'
import FilterDropdown from '../../components/admin/FilterDropdown'
import AdminPagination from '../../components/admin/AdminPagination'
import { listReports, getReport } from '../../api/reporting'
import { listDistricts } from '../../api/districts'
import { buildPdfHtml, openPdfWindow, sectionHtml } from '../../utils/pdfExport'
import { useToastStore } from '../../store/toastStore'

const PAGE_SIZE = 10

// 'SYSTEM_AUDIT' -> 'System Audit', 'PLANNER_INSIGHT' -> 'Planner Insight',
// already space-separated types (e.g. "Response Time Performance") pass
// through as-is.
function prettyType(t) {
  if (!t) return 'Report'
  return t.replace(/_/g, ' ').toLowerCase().replace(/\b\w/g, (c) => c.toUpperCase())
}

function esc(s) {
  return (s ?? '').replace(/</g, '&lt;').replace(/>/g, '&gt;')
}

export default function AdminReports() {
  const [reports, setReports] = useState([])
  const [districts, setDistricts] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [typeFilter, setTypeFilter] = useState('')
  const [districtFilter, setDistrictFilter] = useState('')
  const [previewingId, setPreviewingId] = useState(null)
  const [page, setPage] = useState(1)
  const pushToast = useToastStore((s) => s.pushToast)

  useEffect(() => {
    Promise.all([listReports(), listDistricts()])
      .then(([r, d]) => {
        // Admin only reviews reports actually submitted up the chain — drafts
        // are each author's own working copy, not yet ready for oversight.
        setReports(r.filter((x) => x.status === 'SUBMITTED'))
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

  // Same official RNP report layout used across the app (DC Executive
  // Report, Planner Insight, Analyst Report Library) — one consistent
  // document format regardless of which portal generated the report.
  function openPreview(reportId) {
    setPreviewingId(reportId)
    getReport(reportId)
      .then((r) => {
        const sections = [sectionHtml('Report Content', `<div style="font-size:12px;line-height:1.7;color:#333;white-space:pre-wrap">${r.content?.trim() ? esc(r.content) : 'No narrative content submitted.'}</div>`)]

        openPdfWindow(buildPdfHtml({
          title: `${prettyType(r.report_type)} Report`,
          subtitle: `${r.district_name ?? 'All Districts'} · ${r.period_start ?? '—'} → ${r.period_end ?? '—'}`,
          reportType: r.report_type ?? 'REPORT',
          idPrefix: 'RPT',
          metaItems: [
            { label: 'District', value: r.district_name ?? 'All Districts' },
            { label: 'Status', value: r.status ?? '—' },
          ],
          kpis: [
            { label: 'Total Incidents', value: r.total_incidents ?? '—' },
            { label: 'Avg Response Time', value: r.avg_response_time != null ? `${r.avg_response_time.toFixed(1)}m` : '—' },
            { label: 'Resolution Rate', value: r.resolution_rate != null ? `${r.resolution_rate.toFixed(1)}%` : '—' },
          ],
          sections,
          generatedBy: r.generated_by_name ?? 'Unknown',
          generatedRole: r.generated_by_role ? r.generated_by_role.replace(/_/g, ' ') : '',
        }))
      })
      .catch(() => pushToast({ variant: 'error', title: 'Preview failed', message: 'Could not load this report.' }))
      .finally(() => setPreviewingId(null))
  }

  return (
    <div className="portal-page flex flex-col gap-4 min-w-[1024px]">
      <AdminPageHeader
        title="Submitted Reports"
        subtitle="Every report submitted for oversight — executive, planning, and system performance audits."
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
          options={[{ value: '', label: 'All types' }, ...reportTypes.map((t) => ({ value: t, label: prettyType(t) }))]}
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
              <th className="p-3">Submitted</th>
              <th className="p-3">Status</th>
              <th className="p-3">Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading && (
              <tr><td colSpan={7} className="p-6 text-center text-(--text-muted)">Loading…</td></tr>
            )}
            {!loading && filtered.length === 0 && (
              <tr><td colSpan={7} className="p-6 text-center text-(--text-muted)">No submitted reports yet.</td></tr>
            )}
            {pageReports.map((r) => (
              <tr key={r.report_id} className="border-b border-(--border-subtle) dispatcher-table-row">
                <td className="p-3 font-medium">{prettyType(r.report_type)}</td>
                <td className="p-3">{r.district_name ?? 'All Districts'}</td>
                <td className="p-3 font-mono">{r.period_start ?? '—'} → {r.period_end ?? '—'}</td>
                <td className="p-3 text-center">{r.generated_by_name ?? '—'}</td>
                <td className="p-3 text-center font-mono">{r.submitted_at ? new Date(r.submitted_at).toLocaleDateString() : '—'}</td>
                <td className="p-3 text-center">
                  <StatusBadge label={r.status} variant="resolved" />
                </td>
                <td className="p-3 text-center">
                  <button
                    type="button"
                    onClick={() => openPreview(r.report_id)}
                    disabled={previewingId === r.report_id}
                    className="inline-flex items-center gap-1 px-1 py-1 rounded-lg cursor-pointer text-[11px] font-bold text-(--accent) transition-opacity hover:opacity-70 disabled:opacity-50 disabled:cursor-wait"
                    style={{ background: 'none', border: 'none' }}
                  >
                    <FileCheck size={12} />
                    {previewingId === r.report_id ? 'Loading…' : 'Preview'}
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <AdminPagination page={page} totalPages={totalPages} totalCount={filtered.length} pageSize={PAGE_SIZE} onPageChange={setPage} />
    </div>
  )
}

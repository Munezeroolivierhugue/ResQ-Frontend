import { useEffect, useMemo, useState } from 'react'
import { useLocation } from 'react-router-dom'
import { X, Flag, Check, Download } from 'lucide-react'
import { buildPdfHtml, openPdfWindow } from '../../utils/pdfExport'

function exportShiftPDF(report, detail, status) {
  const period = report?.period_start ? `${report.period_start} – ${report.period_end ?? ''}` : '—'
  openPdfWindow(buildPdfHtml({
    title: 'District Shift Report',
    subtitle: period,
    reportType: 'SHIFT REPORT',
    idPrefix: 'SHF',
    metaItems: [
      { label: 'Report ID', value: report?.report_id?.slice(0, 8) ?? '—' },
      { label: 'Submitted By', value: report?.generated_by_name ?? '—' },
      { label: 'Period', value: period },
      { label: 'Status', value: String(status ?? report?.status ?? 'PENDING').toUpperCase() },
    ],
    kpis: [
      { label: 'Total Incidents', value: detail?.total_incidents ?? report?.total_incidents ?? '—' },
      { label: 'Avg Response Time', value: detail?.avg_response_time != null ? `${Number(detail.avg_response_time).toFixed(1)} min` : '—', sub: 'Target < 8 min' },
      { label: 'Resolution Rate', value: detail?.resolution_rate != null ? `${Math.round(detail.resolution_rate * 100)}%` : '—' },
      { label: 'District', value: detail?.district_name ?? report?.district_name ?? '—' },
    ],
    sections: [],
    generatedBy: report?.generated_by_name ?? 'District Commander',
    generatedRole: 'District Commander',
  }))
}
import StatusBadge from '../../components/dispatcher/StatusBadge'
import DCPageHeader from '../../components/district-commander/DCPageHeader'
import { getReportStatusVariant } from '../../data/mockDistrictCommanderData'
import { listReports, getReport } from '../../api/reporting'
import { useNotificationsStore } from '../../store/notificationsStore'

const FILTERS = ['All', 'Pending Review', 'Reviewed', 'Flagged']

function matchFilter(status, filter) {
  if (filter === 'All') return true
  const s = (status ?? '').toUpperCase()
  if (filter === 'Pending Review') return s === 'PENDING' || s === 'PENDING REVIEW'
  if (filter === 'Reviewed') return s === 'REVIEWED'
  if (filter === 'Flagged') return s === 'FLAGGED'
  return true
}

function fmtDate(iso) {
  if (!iso) return '—'
  return new Date(iso).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })
}

export default function DCShiftReports() {
  const location = useLocation()
  const addNotification = useNotificationsStore((s) => s.addNotification)
  const districtId = sessionStorage.getItem('resq-district-id') || undefined

  const [reports, setReports] = useState([])
  const [tableLoading, setTableLoading] = useState(true)
  const [tableError, setTableError] = useState(null)
  const [filter, setFilter] = useState('All')
  const [search, setSearch] = useState('')

  const [selectedId, setSelectedId] = useState(null)
  const [detail, setDetail] = useState(null)
  const [detailLoading, setDetailLoading] = useState(false)
  const [dcNote, setDcNote] = useState('')
  const [panelMessage, setPanelMessage] = useState(null)
  const [localStatuses, setLocalStatuses] = useState({})

  useEffect(() => {
    listReports('SHIFT', districtId)
      .then(setReports)
      .catch(() => setTableError('Failed to load shift reports'))
      .finally(() => setTableLoading(false))
  }, [])

  useEffect(() => {
    const id = location.state?.reportId
    if (id) openPanel(id)
  }, [location.state])

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase()
    return reports.filter((r) => {
      const status = localStatuses[r.report_id] ?? r.status
      if (!matchFilter(status, filter)) return false
      if (!q) return true
      return (
        (r.report_id ?? '').toLowerCase().includes(q) ||
        (r.generated_by_name ?? '').toLowerCase().includes(q)
      )
    })
  }, [reports, filter, search, localStatuses])

  function openPanel(id) {
    setSelectedId(id)
    setDcNote('')
    setPanelMessage(null)
    setDetail(null)
    setDetailLoading(true)
    getReport(id)
      .then(setDetail)
      .catch(() => setDetail(null))
      .finally(() => setDetailLoading(false))
  }

  function updateStatus(id, status, message) {
    setLocalStatuses((prev) => ({ ...prev, [id]: status }))
    setPanelMessage(message)
    if (status === 'FLAGGED') {
      addNotification({
        id: 'notif-' + Math.random().toString(36).slice(2, 10),
        type: 'SHIFT_REPORT_FLAGGED',
        target_role: 'operations_manager',
        title: 'Shift Report Flagged',
        message: `Report flagged by District Commander for discussion.`,
        timestamp: new Date().toISOString(),
        read: false,
      })
    }
  }

  const selected = reports.find((r) => r.report_id === selectedId)
  const selectedStatus = selectedId ? (localStatuses[selectedId] ?? selected?.status) : null

  return (
    <div className="portal-page relative">
      <DCPageHeader
        title="Shift Reports"
        eyebrow="District Commander"
        subtitle="Submitted by Operations Managers assigned to this district."
      />

      <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
        <input
          className="dispatcher-input dispatcher-text-input w-full max-w-xs sm:max-w-sm flex-1 min-w-[12rem]"
          style={{ height: '40px' }}
          placeholder="Search by report ID or submitted by..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        <div className="flex flex-wrap gap-2">
          {FILTERS.map((f) => (
            <button
              key={f}
              type="button"
              className="text-[11px] font-semibold px-3 py-1.5 rounded-full border cursor-pointer"
              style={{
                background: filter === f ? 'var(--accent-ghost)' : 'var(--bg-elevated)',
                borderColor: filter === f ? 'var(--accent)' : 'var(--border)',
                color: filter === f ? 'var(--accent)' : 'var(--text-secondary)',
              }}
              onClick={() => setFilter(f)}
            >
              {f}
            </button>
          ))}
        </div>
      </div>

      <div className="dispatcher-surface table-scroll">
        <table className="w-full min-w-[900px] text-left border-collapse text-[12px]">
          <thead>
            <tr className="text-[10px] uppercase tracking-wide text-(--text-muted) border-b border-(--border-subtle)">
              <th className="py-2 px-3 font-semibold">Report ID</th>
              <th className="py-2 px-3 font-semibold">Submitted By</th>
              <th className="py-2 px-3 font-semibold">Period</th>
              <th className="py-2 px-3 font-semibold">Generated</th>
              <th className="py-2 px-3 font-semibold">Total Incidents</th>
              <th className="py-2 px-3 font-semibold">Avg Response</th>
              <th className="py-2 px-3 font-semibold">Status</th>
              <th className="py-2 px-3 font-semibold">Action</th>
            </tr>
          </thead>
          <tbody>
            {tableLoading && (
              <tr><td colSpan={8} className="py-6 text-center text-[13px] text-(--text-muted)">Loading reports…</td></tr>
            )}
            {tableError && !tableLoading && (
              <tr><td colSpan={8} className="py-6 text-center text-[13px]" style={{ color: 'var(--status-critical)' }}>{tableError}</td></tr>
            )}
            {!tableLoading && !tableError && filtered.length === 0 && (
              <tr><td colSpan={8} className="py-6 text-center text-[13px] text-(--text-muted)">No shift reports found.</td></tr>
            )}
            {!tableLoading && !tableError && filtered.map((row) => {
              const status = localStatuses[row.report_id] ?? row.status
              return (
                <tr
                  key={row.report_id}
                  className="border-b border-(--border-subtle) last:border-0 cursor-pointer hover:bg-(--bg-elevated)/50"
                  onClick={() => openPanel(row.report_id)}
                >
                  <td className="py-3 px-3 font-mono font-bold text-(--accent)">{row.report_id?.slice(0, 8) ?? '—'}</td>
                  <td className="py-3 px-3">{row.generated_by_name ?? '—'}</td>
                  <td className="py-3 px-3 font-mono text-(--text-secondary)">
                    {row.period_start ? `${row.period_start} – ${row.period_end ?? ''}` : '—'}
                  </td>
                  <td className="py-3 px-3 text-(--text-secondary)">{fmtDate(row.generated_at)}</td>
                  <td className="py-3 px-3 font-mono">{row.total_incidents ?? '—'}</td>
                  <td className="py-3 px-3 font-mono">
                    {row.avg_response_time != null ? `${Number(row.avg_response_time).toFixed(1)}m` : '—'}
                  </td>
                  <td className="py-3 px-3">
                    <StatusBadge label={status ?? 'PENDING'} variant={getReportStatusVariant(status)} />
                  </td>
                  <td className="py-3 px-3">
                    <button
                      type="button"
                      className={status === 'PENDING' || status === 'PENDING REVIEW' ? 'dispatcher-btn-primary text-[11px]' : 'dispatcher-btn-ghost text-[11px]'}
                      onClick={(e) => { e.stopPropagation(); openPanel(row.report_id) }}
                    >
                      {status === 'PENDING' || status === 'PENDING REVIEW' ? 'Review' : 'View'}
                    </button>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>

      {selectedId && (
        <>
          <div className="dc-drawer-backdrop" onClick={() => setSelectedId(null)} aria-hidden />
          <aside className="dc-drawer" role="dialog" aria-modal="true" aria-labelledby="dc-shift-report-title">
            <div className="dc-drawer-header flex items-start justify-between gap-2 p-4">
              <div className="min-w-0 pr-2">
                <div id="dc-shift-report-title" className="font-mono text-[12px] font-bold text-(--accent)">
                  SHIFT REPORT — {selectedId?.slice(0, 8)}
                </div>
                <div className="text-[13px] font-semibold text-(--text-primary) mt-1">{selected?.generated_by_name ?? '—'}</div>
                <div className="text-[12px] text-(--text-secondary)">
                  {selected?.period_start ? `${selected.period_start} – ${selected.period_end ?? ''}` : '—'}
                </div>
                <div className="text-[11px] font-mono text-(--text-muted) mt-0.5">
                  {fmtDate(selected?.generated_at)}
                </div>
              </div>
              <div className="flex gap-2 shrink-0">
                <button type="button" className="dispatcher-btn-icon" aria-label="Export PDF"
                  onClick={() => exportShiftPDF(selected, detail, selectedStatus)}>
                  <Download size={16} />
                </button>
                <button type="button" className="dispatcher-btn-icon" onClick={() => setSelectedId(null)} aria-label="Close">
                  <X size={18} />
                </button>
              </div>
            </div>

            <div className="dc-drawer-body p-4 flex flex-col gap-5">
              {detailLoading && (
                <p className="text-[13px] text-(--text-muted)">Loading report details…</p>
              )}

              {panelMessage && (
                <div
                  className="dc-drawer-notice p-3 rounded-lg text-[12px]"
                  style={{
                    background: panelMessage.type === 'flag' ? 'var(--status-critical-bg)' : 'var(--status-low-bg)',
                    border: `1px solid ${panelMessage.type === 'flag' ? 'var(--status-critical)' : 'var(--status-low)'}`,
                    color: panelMessage.type === 'flag' ? 'var(--status-critical)' : 'var(--status-low)',
                  }}
                >
                  {panelMessage.text}
                </div>
              )}

              {!detailLoading && (
                <section>
                  <h3 className="text-[11px] font-bold uppercase tracking-wide text-(--text-muted) m-0 mb-2">Key Metrics</h3>
                  <div className="grid grid-cols-2 gap-2">
                    {[
                      ['Total Incidents', detail?.total_incidents ?? selected?.total_incidents ?? '—'],
                      ['Avg Response', detail?.avg_response_time != null ? `${Number(detail.avg_response_time).toFixed(1)}m` : '—'],
                      ['Resolution Rate', detail?.resolution_rate != null ? `${Math.round(detail.resolution_rate * 100)}%` : '—'],
                      ['District', detail?.district_name ?? selected?.district_name ?? '—'],
                    ].map(([label, val]) => (
                      <div key={label} className="dispatcher-summary-stat">
                        <div className="field-label mb-0.5">{label}</div>
                        <div className="text-[14px] font-bold font-mono">{String(val)}</div>
                      </div>
                    ))}
                  </div>
                </section>
              )}

              {selectedStatus !== 'REVIEWED' && selectedStatus !== 'FLAGGED' && (
                <section>
                  <label className="dispatcher-field">
                    <span className="field-label">Your acknowledgment note</span>
                    <textarea
                      className="dispatcher-input dispatcher-textarea"
                      rows={4}
                      placeholder="Add your review notes or flag reason here..."
                      value={dcNote}
                      onChange={(e) => setDcNote(e.target.value)}
                    />
                  </label>
                  <div className="flex flex-wrap gap-2 mt-3">
                    <button
                      type="button"
                      className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg text-[12px] font-semibold cursor-pointer border"
                      style={{
                        borderColor: 'var(--status-critical)',
                        color: 'var(--status-critical)',
                        background: 'var(--status-critical-bg)',
                      }}
                      onClick={() => {
                        if (!dcNote.trim()) return
                        updateStatus(selectedId, 'FLAGGED', { type: 'flag', text: 'Report flagged. Reason recorded for OM follow-up.' })
                      }}
                    >
                      <Flag size={14} />
                      Flag Report
                    </button>
                    <button
                      type="button"
                      className="dispatcher-btn-primary inline-flex items-center gap-1.5 text-[12px]"
                      onClick={() => updateStatus(selectedId, 'REVIEWED', { type: 'success', text: 'Report acknowledged and marked REVIEWED.' })}
                    >
                      <Check size={14} />
                      Acknowledge Report
                    </button>
                  </div>
                </section>
              )}
            </div>
          </aside>
        </>
      )}
    </div>
  )
}

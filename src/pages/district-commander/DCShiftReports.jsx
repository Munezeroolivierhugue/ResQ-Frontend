import { useEffect, useMemo, useState } from 'react'
import { useLocation } from 'react-router-dom'
import { X, Flag, Check } from 'lucide-react'
import StatusBadge from '../../components/dispatcher/StatusBadge'
import DCPageHeader from '../../components/district-commander/DCPageHeader'
import {
  DC_SHIFT_REPORTS,
  getReportStatusVariant,
} from '../../data/mockDistrictCommanderData'
import { mockAuditLogs } from '../../data/mockAuditLogs'
import { getCurrentUser } from '../../utils/authSession'
import { useNotificationsStore } from '../../store/notificationsStore'

// NOTE FOR BACKEND: reports table currently lacks reviewed_by (UUID) and reviewed_at (TIMESTAMP)
// columns per schema Section 3.13.28. These fields are written to the mock and to audit_logs.
// Backend can add the columns later; audit_logs alone is sufficient as a fallback.

const FILTERS = ['All', 'Pending Review', 'Reviewed', 'Flagged']

function matchFilter(status, filter) {
  if (filter === 'All') return true
  if (filter === 'Pending Review') return status === 'PENDING REVIEW'
  if (filter === 'Reviewed') return status === 'REVIEWED'
  if (filter === 'Flagged') return status === 'FLAGGED'
  return true
}

function generateId() {
  return 'log-' + Math.random().toString(36).slice(2, 10)
}

export default function DCShiftReports() {
  const location = useLocation()
  const addNotification = useNotificationsStore((s) => s.addNotification)
  const [reports, setReports] = useState(() => DC_SHIFT_REPORTS.map((r) => ({ ...r })))
  const [filter, setFilter] = useState('All')
  const [search, setSearch] = useState('')
  const [selectedId, setSelectedId] = useState(null)
  const [dcNote, setDcNote] = useState('')
  const [panelMessage, setPanelMessage] = useState(null)

  const selected = reports.find((r) => r.id === selectedId)

  useEffect(() => {
    const id = location.state?.reportId
    if (id) setSelectedId(id)
  }, [location.state])

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase()
    return reports.filter((r) => {
      if (!matchFilter(r.status, filter)) return false
      if (!q) return true
      return r.id.toLowerCase().includes(q) || r.om.toLowerCase().includes(q)
    })
  }, [reports, filter, search])

  const openPanel = (id) => {
    setSelectedId(id)
    setDcNote('')
    setPanelMessage(null)
  }

  const updateStatus = (id, status, message) => {
    const currentUser = getCurrentUser()
    const timestamp = new Date().toISOString()
    const action = status === 'REVIEWED' ? 'SHIFT_REPORT_REVIEWED' : 'SHIFT_REPORT_FLAGGED'

    // Persist to mock array (mirrors DB write — backend adds reviewed_by/reviewed_at columns)
    const target = DC_SHIFT_REPORTS.find((r) => r.id === id)
    if (target) {
      target.status = status
      target.reviewed_by = currentUser?.user_id ?? null
      target.reviewed_at = timestamp
    }

    // Update local UI state
    setReports((list) =>
      list.map((r) =>
        r.id === id
          ? { ...r, status, reviewed_by: currentUser?.user_id ?? null, reviewed_at: timestamp }
          : r
      )
    )
    setPanelMessage(message)

    // Write to audit log
    mockAuditLogs.push({
      log_id: generateId(),
      user_id: currentUser?.user_id ?? 'unknown',
      timestamp,
      action,
      module: 'DISTRICT_COMMANDER',
      status: 'SUCCESS',
    })

    // Fire notification to OM if flagged
    if (status === 'FLAGGED') {
      addNotification({
        id: generateId(),
        type: 'SHIFT_REPORT_FLAGGED',
        target_role: 'operations_manager',
        title: 'Shift Report Flagged',
        message: `Report ${id} has been flagged by District Commander for discussion.`,
        timestamp,
        read: false,
      })
    }
  }

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
          placeholder="Search by report ID or OM name..."
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
              <th className="py-2 px-3 font-semibold">Operations Manager</th>
              <th className="py-2 px-3 font-semibold">Shift Period</th>
              <th className="py-2 px-3 font-semibold">Submitted</th>
              <th className="py-2 px-3 font-semibold">Total Incidents</th>
              <th className="py-2 px-3 font-semibold">Avg Response</th>
              <th className="py-2 px-3 font-semibold">Status</th>
              <th className="py-2 px-3 font-semibold">Action</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((row) => (
              <tr
                key={row.id}
                className="border-b border-(--border-subtle) last:border-0 cursor-pointer hover:bg-(--bg-elevated)/50"
                onClick={() => openPanel(row.id)}
              >
                <td className="py-3 px-3 font-mono font-bold text-(--accent)">{row.id}</td>
                <td className="py-3 px-3">{row.om}</td>
                <td className="py-3 px-3 font-mono text-(--text-secondary)">{row.shift}</td>
                <td className="py-3 px-3 text-(--text-secondary)">{row.submitted_at}</td>
                <td className="py-3 px-3 font-mono">{row.incidents}</td>
                <td className="py-3 px-3 font-mono">{row.avg_response_time}</td>
                <td className="py-3 px-3">
                  <StatusBadge label={row.status} variant={getReportStatusVariant(row.status)} />
                </td>
                <td className="py-3 px-3">
                  <button
                    type="button"
                    className={row.status === 'PENDING REVIEW' ? 'dispatcher-btn-primary text-[11px]' : 'dispatcher-btn-ghost text-[11px]'}
                    onClick={(e) => {
                      e.stopPropagation()
                      openPanel(row.id)
                    }}
                  >
                    {row.status === 'PENDING REVIEW' ? 'Review' : 'View'}
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {selected && (
        <>
          <div
            className="dc-drawer-backdrop"
            onClick={() => setSelectedId(null)}
            aria-hidden
          />
          <aside
            className="dc-drawer"
            role="dialog"
            aria-modal="true"
            aria-labelledby="dc-shift-report-title"
            style={{ fontFamily: 'var(--font-body)' }}
          >
            <div className="dc-drawer-header flex items-start justify-between gap-2 p-4">
              <div className="min-w-0 pr-2">
                <div
                  id="dc-shift-report-title"
                  className="font-mono text-[12px] font-bold text-(--accent)"
                >
                  SHIFT REPORT — {selected.id}
                </div>
                <div className="text-[13px] font-semibold text-(--text-primary) mt-1">{selected.om}</div>
                <div className="text-[12px] text-(--text-secondary)">{selected.shift}</div>
                <div className="text-[11px] font-mono text-(--text-muted) mt-0.5">Submitted {selected.submitted_at}</div>
              </div>
              <button type="button" className="dispatcher-btn-icon shrink-0" onClick={() => setSelectedId(null)} aria-label="Close">
                <X size={18} />
              </button>
            </div>

            <div className="dc-drawer-body p-4 flex flex-col gap-5">
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

              <section>
                <h3 className="text-[11px] font-bold uppercase tracking-wide text-(--text-muted) m-0 mb-2">Key Metrics</h3>
                <div className="grid grid-cols-2 gap-2">
                  {[
                    ['Total Incidents', selected.metrics.incidents],
                    ['Avg Response', selected.metrics.avgResponse],
                    ['Coverage Score', selected.metrics.coverage],
                    ['AI Acceptance', selected.metrics.ai_acceptance_rate],
                  ].map(([label, val]) => (
                    <div key={label} className="dispatcher-summary-stat">
                      <div className="field-label mb-0.5">{label}</div>
                      <div className="text-[14px] font-bold font-mono">{val}</div>
                    </div>
                  ))}
                </div>
              </section>

              <section>
                <h3 className="text-[11px] font-bold uppercase tracking-wide text-(--text-muted) m-0 mb-2">Significant Incidents</h3>
                {selected.significantIncidents.length === 0 ? (
                  <p className="text-[12px] text-(--text-muted) m-0">None recorded for this shift.</p>
                ) : (
                  <table className="w-full text-[11px] border-collapse">
                    <thead>
                      <tr className="text-(--text-muted) border-b border-(--border-subtle)">
                        <th className="text-left py-1 pr-2">ID</th>
                        <th className="text-left py-1 pr-2">Type</th>
                        <th className="text-left py-1 pr-2">Severity</th>
                        <th className="text-left py-1">Outcome</th>
                      </tr>
                    </thead>
                    <tbody>
                      {selected.significantIncidents.map((inc) => (
                        <tr key={inc.id} className="border-b border-(--border-subtle)">
                          <td className="py-2 pr-2 font-mono text-(--accent)">{inc.id}</td>
                          <td className="py-2 pr-2">{inc.type}</td>
                          <td className="py-2 pr-2">{inc.severity}</td>
                          <td className="py-2">{inc.outcome}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </section>

              <section>
                <h3 className="text-[11px] font-bold uppercase tracking-wide text-(--text-muted) m-0 mb-2">Operations Manager Notes</h3>
                <blockquote className="dispatcher-quote m-0">{selected.notes}</blockquote>
              </section>

              {selected.status !== 'REVIEWED' && (
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
                        updateStatus(selected.id, 'FLAGGED', {
                          type: 'flag',
                          text: 'Report flagged. Reason recorded for OM follow-up.',
                        })
                      }}
                    >
                      <Flag size={14} />
                      Flag Report
                    </button>
                    <button
                      type="button"
                      className="dispatcher-btn-primary inline-flex items-center gap-1.5 text-[12px]"
                      onClick={() => {
                        updateStatus(selected.id, 'REVIEWED', {
                          type: 'success',
                          text: 'Report acknowledged and marked REVIEWED.',
                        })
                      }}
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

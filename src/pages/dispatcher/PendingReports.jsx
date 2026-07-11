import { useState, useEffect, useRef } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { FileCheck, Clock, ChevronRight, AlertTriangle } from 'lucide-react'
import { listIncidents } from '../../api/incidents'
import SeverityBadge from '../../components/dispatcher/SeverityBadge'

const SEV_UPPER = (s) => (s ?? '').toUpperCase()

function ElapsedChip({ callTime }) {
  if (!callTime) return null
  const mins = Math.round((Date.now() - new Date(callTime).getTime()) / 60000)
  const over60 = mins > 60
  return (
    <span
      className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded"
      style={{
        fontFamily: 'var(--font-display)',
        background: over60 ? 'var(--status-critical-bg)' : 'var(--accent-ghost)',
        color: over60 ? 'var(--status-critical)' : 'var(--accent)',
      }}
    >
      <Clock size={10} />
      {mins}m elapsed
    </span>
  )
}

export default function PendingReports() {
  const navigate = useNavigate()
  const { state: navState } = useLocation()
  const completedIncident = navState?.completedIncident ?? null

  const [tab, setTab] = useState('pending')
  const [allIncidents, setAllIncidents] = useState([])
  const [pendingIncidents, setPendingIncidents] = useState([])
  const [loading, setLoading] = useState(true)

  // Ref map so we can auto-scroll to the just-completed row
  const rowRefs = useRef({})

  useEffect(() => {
    setLoading(true)
    Promise.all([
      listIncidents({ status: 'PENDING_REPORT' }),
      listIncidents(),
    ]).then(([pending, all]) => {
      // If the DB update hasn't landed yet, inject the completed incident at the top
      if (completedIncident?.incident_id) {
        const alreadyInPending = pending.some((p) => p.incident_id === completedIncident.incident_id)
        if (!alreadyInPending) {
          pending = [{ ...completedIncident, status: 'PENDING_REPORT' }, ...pending]
        }
        const alreadyInAll = all.some((p) => p.incident_id === completedIncident.incident_id)
        if (!alreadyInAll) {
          all = [{ ...completedIncident, status: 'PENDING_REPORT' }, ...all]
        }
      }
      setPendingIncidents(pending)
      setAllIncidents(all)
    }).catch(() => {}).finally(() => setLoading(false))
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  // Auto-scroll to the highlighted row once the list renders
  useEffect(() => {
    if (!completedIncident?.incident_id) return
    const el = rowRefs.current[completedIncident.incident_id]
    if (el) el.scrollIntoView({ behavior: 'smooth', block: 'center' })
  }, [pendingIncidents, completedIncident])

  const items = tab === 'pending' ? pendingIncidents : allIncidents

  return (
    <div className="portal-page dispatcher-page">
      {/* Page header */}
      <div className="flex items-center justify-between mb-5">
        <div>
          <span className="dispatcher-eyebrow">Reports queue</span>
          <h1
            className="text-2xl font-bold m-0"
            style={{ fontFamily: 'var(--font-display)' }}
          >
            Pending Reports
          </h1>
        </div>
        {pendingIncidents.length > 0 && (
          <div
            className="inline-flex items-center gap-2 px-3 py-2 rounded-lg text-[12px] font-semibold border"
            style={{
              background: 'var(--accent-ghost)',
              color: 'var(--accent)',
              borderColor: 'color-mix(in srgb, var(--accent) 35%, transparent)',
              fontFamily: 'var(--font-display)',
            }}
          >
            <AlertTriangle size={14} />
            {pendingIncidents.length} report{pendingIncidents.length !== 1 ? 's' : ''} awaiting closure
          </div>
        )}
      </div>

      {/* Tabs */}
      <div className="flex gap-1 mb-4 p-1 rounded-lg border border-(--border) bg-(--bg-surface) w-fit">
        {[
          { key: 'pending', label: `Pending (${pendingIncidents.length})` },
          { key: 'all', label: 'All incidents' },
        ].map(({ key, label }) => (
          <button
            key={key}
            type="button"
            onClick={() => setTab(key)}
            className="px-4 py-1.5 rounded-md text-[12px] font-semibold border-none cursor-pointer transition-all"
            style={{
              fontFamily: 'var(--font-display)',
              background: tab === key ? 'var(--accent)' : 'transparent',
              color: tab === key ? '#fff' : 'var(--text-secondary)',
            }}
          >
            {label}
          </button>
        ))}
      </div>

      {/* Table */}
      <div className="bg-(--bg-surface) border border-(--border) rounded-xl overflow-hidden">
        {loading ? (
          <div className="py-16 text-center text-(--text-muted) text-[13px]">Loading…</div>
        ) : items.length === 0 ? (
          <div className="py-16 text-center text-(--text-muted) text-[13px]">
            No incidents found.
          </div>
        ) : (
          <table className="w-full border-collapse min-w-[640px]">
            <thead>
              <tr className="bg-(--bg-base)">
                {['Incident', 'Type', 'District / Sector', 'Severity', 'Call Time', 'Elapsed', 'Unit', 'Action'].map((col) => (
                  <th
                    key={col}
                    className="px-4 py-2.5 text-left field-label border-b border-(--border) whitespace-nowrap"
                  >
                    {col}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {items.map((inc) => {
                const isJustCompleted = inc.incident_id === completedIncident?.incident_id
                return (
                  <tr
                    key={inc.incident_id}
                    ref={(el) => { if (el) rowRefs.current[inc.incident_id] = el }}
                    className="border-b border-(--border-subtle) transition-colors"
                    style={{
                      background: isJustCompleted
                        ? 'color-mix(in srgb, var(--accent) 8%, transparent)'
                        : undefined,
                      outline: isJustCompleted ? '2px solid var(--accent)' : undefined,
                      outlineOffset: isJustCompleted ? '-2px' : undefined,
                    }}
                  >
                    <td className="px-4 h-12">
                      <div className="flex items-center gap-2">
                        <span
                          className="text-[12px] font-bold text-(--accent)"
                          style={{ fontFamily: 'var(--font-mono)' }}
                        >
                          {inc.incident_ref}
                        </span>
                        {isJustCompleted && (
                          <span
                            className="text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded"
                            style={{
                              background: 'var(--accent)',
                              color: '#fff',
                              fontFamily: 'var(--font-display)',
                            }}
                          >
                            Just completed
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-4 text-[13px] text-(--text-primary)">{inc.incident_type}</td>
                    <td className="px-4 text-[12px] text-(--text-secondary)">
                      {inc.district ? `${inc.district}${inc.sector ? ' / ' + inc.sector : ''}` : (inc.address ?? '—')}
                    </td>
                    <td className="px-4">
                      <SeverityBadge severity={SEV_UPPER(inc.severity)} />
                    </td>
                    <td
                      className="px-4 text-[12px] text-(--text-secondary)"
                      style={{ fontFamily: 'var(--font-mono)' }}
                    >
                      {inc.call_time ? new Date(inc.call_time).toLocaleString() : '—'}
                    </td>
                    <td className="px-4">
                      <ElapsedChip callTime={inc.call_time} />
                    </td>
                    <td
                      className="px-4 text-[12px] text-(--status-info)"
                      style={{ fontFamily: 'var(--font-mono)' }}
                    >
                      —
                    </td>
                    <td className="px-4">
                      {inc.status === 'PENDING_REPORT' ? (
                        <button
                          type="button"
                          onClick={() => navigate('/dispatcher/incident-report', { state: { incident: inc } })}
                          className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg border-none cursor-pointer text-[11px] font-bold transition-opacity hover:opacity-80"
                          style={{
                            background: 'var(--accent)',
                            color: '#fff',
                            fontFamily: 'var(--font-display)',
                          }}
                        >
                          <FileCheck size={12} />
                          File Report
                          <ChevronRight size={12} />
                        </button>
                      ) : (
                        <span className="text-[11px] text-(--text-muted)">—</span>
                      )}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        )}
      </div>

      <p className="text-[11px] text-(--text-muted) mt-3">
        Incidents in the <strong>PENDING_REPORT</strong> queue require a field closure report before the record can be archived.
      </p>
    </div>
  )
}

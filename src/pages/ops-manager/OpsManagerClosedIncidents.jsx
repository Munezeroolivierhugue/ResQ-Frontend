import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ChevronLeft, ChevronRight, FileCheck } from 'lucide-react'
import { listIncidents } from '../../api/incidents'
import SeverityBadge from '../../components/dispatcher/SeverityBadge'
import OpsManagerDistrictLabel from '../../components/ops-manager/OpsManagerDistrictLabel'
import { formatIncidentType } from '../../utils/incidentTypeLabels'
import { getCurrentUser } from '../../utils/authSession'

const PAGE_SIZE = 15

export default function OpsManagerClosedIncidents() {
  const navigate = useNavigate()
  const [incidents, setIncidents] = useState([])
  const [loading, setLoading] = useState(true)
  const [page, setPage] = useState(1)

  useEffect(() => {
    const districtId = getCurrentUser()?.district_id
    listIncidents({ status: 'CLOSED', ...(districtId ? { districtId } : {}) })
      // Newest-closed first — the API doesn't guarantee ordering, and
      // without this the first page of a freshly-paginated list was
      // whatever order the DB happened to return, not the most relevant.
      .then((all) => all.sort((a, b) => new Date(b.closure_time ?? 0) - new Date(a.closure_time ?? 0)))
      .then(setIncidents)
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  const totalPages = Math.max(1, Math.ceil(incidents.length / PAGE_SIZE))
  const pageIncidents = incidents.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE)

  // Clamp if the list shrinks (e.g. re-fetch) below the current page.
  useEffect(() => {
    if (page > totalPages) Promise.resolve().then(() => setPage(totalPages))
  }, [page, totalPages])

  return (
    <div className="portal-page">
      <h1 className="dispatcher-page-title m-0">Closed Incidents</h1>
      <OpsManagerDistrictLabel />
      <p className="dispatcher-page-subtitle mt-2">
        Every incident closed by a dispatcher in your district — open one to review the full field report and closure record.
      </p>

      <div className="dispatcher-surface table-scroll mt-5">
        <table className="w-full text-left text-[13px] border-collapse min-w-[700px]">
          <thead>
            <tr className="border-b border-(--border) text-[11px] uppercase tracking-wider text-(--text-muted)" style={{ fontFamily: 'var(--font-display)' }}>
              <th className="p-3">Incident</th>
              <th className="p-3">Type</th>
              <th className="p-3">Severity</th>
              <th className="p-3">Closed</th>
              <th className="p-3"></th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={5} className="p-6 text-center text-(--text-muted)">Loading…</td></tr>
            ) : incidents.length === 0 ? (
              <tr><td colSpan={5} className="p-6 text-center text-(--text-muted)">No closed incidents yet.</td></tr>
            ) : pageIncidents.map((inc) => (
              <tr key={inc.incident_id} className="border-b border-(--border-subtle) hover:bg-(--bg-elevated) cursor-pointer"
                onClick={() => navigate('/ops-manager/incident-closure', { state: { incident: inc } })}>
                <td className="p-3 font-mono font-semibold text-(--accent)">{inc.incident_ref}</td>
                <td className="p-3">{formatIncidentType(inc.incident_type)}</td>
                <td className="p-3"><SeverityBadge severity={inc.severity} /></td>
                <td className="p-3 text-(--text-secondary)" style={{ fontFamily: 'var(--font-mono)' }}>
                  {inc.closure_time ? new Date(inc.closure_time).toLocaleString() : '—'}
                </td>
                <td className="p-3 text-(--accent) text-[12px] font-semibold inline-flex items-center gap-1">
                  <FileCheck size={14} /> Review
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {!loading && incidents.length > 0 && (
        <div className="flex items-center justify-between gap-3 mt-3 text-[12px] text-(--text-secondary)">
          <span>
            Showing {(page - 1) * PAGE_SIZE + 1}–{Math.min(page * PAGE_SIZE, incidents.length)} of {incidents.length}
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
    </div>
  )
}

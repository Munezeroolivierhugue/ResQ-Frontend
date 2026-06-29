import { useState, useEffect } from 'react'
import { ChevronRight, ChevronLeft, Download, Search } from 'lucide-react'
import { listIncidents } from '../../api/incidents'

const severityColor = { critical: '#E8354A', high: '#F07820', medium: '#D4A017', low: '#3DAA6A' }

function KpiCard({ label, value, sub }) {
  return (
    <div className="flex-1 min-w-40 bg-(--bg-surface) border border-(--border) rounded-xl p-5">
      <div className="text-[12px] text-(--text-secondary) mb-1.5">{label}</div>
      <div className="text-[28px] font-bold leading-none" style={{ fontFamily: 'var(--font-display)' }}>{value}</div>
      {sub && <div className="text-[11px] text-(--text-muted) mt-1">{sub}</div>}
    </div>
  )
}

function fmtMinutes(m) {
  if (m == null) return 'N/A'
  return m < 60 ? `${m}m` : `${Math.floor(m / 60)}h ${m % 60}m`
}

export default function IncidentHistory() {
  const [search, setSearch] = useState('')
  const [page,   setPage]   = useState(1)
  const [incidents, setIncidents] = useState([])
  const [loading, setLoading] = useState(true)
  const perPage = 5

  useEffect(() => {
    setLoading(true)
    listIncidents({ status: 'RESOLVED' })
      .then(setIncidents)
      .catch(() => listIncidents().then(setIncidents).catch(() => {}))
      .finally(() => setLoading(false))
  }, [])

  const totalCount = incidents.length
  const avgResponseMs = incidents.filter(i => i.response_time_minutes != null)
  const avgResponse = avgResponseMs.length
    ? Math.round(avgResponseMs.reduce((s, i) => s + i.response_time_minutes, 0) / avgResponseMs.length)
    : null
  const slaCount = avgResponseMs.filter(i => i.response_time_minutes <= 10).length
  const slaPct = avgResponseMs.length ? Math.round((slaCount / avgResponseMs.length) * 100) : null

  const filtered = incidents.filter(i =>
    !search ||
    (i.incident_ref ?? '').toLowerCase().includes(search.toLowerCase()) ||
    (i.incident_type ?? '').toLowerCase().includes(search.toLowerCase()) ||
    (i.district ?? i.address ?? '').toLowerCase().includes(search.toLowerCase())
  )
  const totalPages = Math.max(1, Math.ceil(filtered.length / perPage))
  const paged      = filtered.slice((page - 1) * perPage, page * perPage)

  return (
    <div className="portal-page">

      <div className="flex items-center justify-between mb-5">
        <div>
          <span className="dispatcher-eyebrow">Incident log</span>
          <h1 className="text-2xl font-bold m-0" style={{ fontFamily: 'var(--font-display)' }}>Incident History</h1>
        </div>
        <button className="flex items-center gap-1.5 px-5 py-2.25 bg-transparent border border-(--border) text-(--text-primary) font-semibold text-[13px] rounded-lg cursor-pointer hover:bg-(--bg-elevated) hover:border-(--accent) transition-colors" style={{ fontFamily: 'var(--font-body)' }}>
          <Download size={14} /> Export CSV
        </button>
      </div>

      <div className="flex gap-3 mb-5">
        <KpiCard label="Total (Resolved)" value={loading ? '…' : totalCount} sub="Fetched from backend" />
        <KpiCard label="Avg Response Time" value={loading ? '…' : (avgResponse != null ? `${avgResponse}m` : 'N/A')} sub="Target: 10 min" />
        <KpiCard label="Within SLA" value={loading ? '…' : (slaPct != null ? `${slaPct}%` : 'N/A')} sub="≤ 10 min response" />
        <KpiCard label="Incidents Shown" value={loading ? '…' : filtered.length} sub="Filtered results" />
      </div>

      <div className="bg-(--bg-surface) border border-(--border) rounded-xl px-4 py-3 mb-4">
        <div className="flex gap-2.5 flex-wrap items-center">
          <div className="relative flex-1 min-w-50">
            <Search size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-(--text-muted)" />
            <input
              className="h-10 w-full bg-(--bg-input) border border-(--border) rounded-full pl-8 pr-3 text-[13px] text-(--text-primary) outline-none focus:border-(--accent) placeholder:text-(--text-muted)"
              placeholder="Search incidents..." value={search}
              onChange={e => { setSearch(e.target.value); setPage(1) }}
              style={{ fontFamily: 'var(--font-body)' }}
            />
          </div>
          {[
            { w: 'w-40',  opts: ['Last 30 Days', 'Last 7 Days', 'This Month', 'Custom Range'] },
            { w: 'w-32', opts: ['All Types', 'Medical', 'Fire', 'Traffic', 'Security'] },
            { w: 'w-32', opts: ['All Districts', 'Gasabo', 'Kicukiro', 'Nyarugenge'] },
          ].map(({ w, opts }) => (
            <select key={opts[0]} className={`h-10 ${w} bg-(--bg-input) border border-(--border) rounded-lg px-3 text-[13px] text-(--text-primary) outline-none appearance-none cursor-pointer`}
              style={{ fontFamily: 'var(--font-body)' }}>
              {opts.map(o => <option key={o}>{o}</option>)}
            </select>
          ))}
        </div>
      </div>

      <div className="bg-(--bg-surface) border border-(--border) rounded-xl table-scroll">
        <table className="w-full border-collapse min-w-[720px]">
          <thead>
            <tr className="bg-(--bg-base)">
              {['ID', 'Severity', 'Type', 'District / Sector', 'Reported', 'Response Time', 'Resolution Time', 'Units', 'SLA'].map(col => (
                <th key={col} className="px-3.5 py-2.5 text-left field-label border-b border-(--border) whitespace-nowrap">{col}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={9} className="px-3.5 py-12 text-center text-[13px] text-(--text-muted)">Loading…</td></tr>
            ) : paged.length === 0 ? (
              <tr><td colSpan={9} className="px-3.5 py-12 text-center text-[13px] text-(--text-muted)">No incidents found.</td></tr>
            ) : paged.map((inc, idx) => {
              const sev = inc.severity ?? 'medium'
              const c = severityColor[sev] || '#44474D'
              const respMins = inc.response_time_minutes
              const withinSla = respMins != null && respMins <= 10
              const location = inc.district
                ? `${inc.district}${inc.sector ? ' / ' + inc.sector : ''}`
                : (inc.address ?? '—')
              return (
                <tr key={inc.incident_id + idx} className="border-b border-(--border-subtle) cursor-pointer hover:bg-(--bg-elevated) transition-colors">
                  <td className="px-3.5 h-12">
                    <span className="text-[12px] font-semibold text-(--accent)" style={{ fontFamily: 'var(--font-mono)' }}>{inc.incident_ref}</span>
                  </td>
                  <td className="px-3.5">
                    <span className="inline-flex items-center px-2.25 py-0.5 rounded text-[10px] font-bold uppercase tracking-[0.07em] border"
                      style={{ background: c + '25', color: c, borderColor: c + '40', fontFamily: 'var(--font-body)' }}>
                      {sev.toUpperCase()}
                    </span>
                  </td>
                  <td className="px-3.5 text-[13px]">{inc.incident_type}</td>
                  <td className="px-3.5 text-[12px] text-(--text-secondary)">{location}</td>
                  <td className="px-3.5 text-[12px] text-(--text-secondary)" style={{ fontFamily: 'var(--font-mono)' }}>
                    {inc.call_time ? new Date(inc.call_time).toLocaleString() : '—'}
                  </td>
                  <td className="px-3.5">
                    <span className="text-[12px] font-semibold" style={{ fontFamily: 'var(--font-mono)', color: respMins != null ? (withinSla ? 'var(--status-low)' : 'var(--status-critical)') : 'var(--text-muted)' }}>
                      {fmtMinutes(respMins)}
                    </span>
                  </td>
                  <td className="px-3.5 text-[12px] text-(--text-secondary)" style={{ fontFamily: 'var(--font-mono)' }}>{fmtMinutes(inc.resolution_time_minutes)}</td>
                  <td className="px-3.5 text-[12px] text-(--status-info)" style={{ fontFamily: 'var(--font-mono)' }}>—</td>
                  <td className="px-3.5">
                    {respMins != null ? (
                      <span className="inline-flex items-center px-2.25 py-0.5 rounded text-[10px] font-bold uppercase tracking-[0.07em]"
                        style={{
                          background: withinSla ? 'var(--status-low-bg)' : 'var(--status-critical-bg)',
                          color: withinSla ? 'var(--status-low)' : 'var(--status-critical)',
                          fontFamily: 'var(--font-body)',
                        }}>
                        {withinSla ? '✓ MET' : '✗ MISSED'}
                      </span>
                    ) : (
                      <span className="text-[10px] text-(--text-muted)">N/A</span>
                    )}
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>

        <div className="flex items-center justify-between px-4 py-3 border-t border-(--border)">
          <span className="text-[12px] text-(--text-muted)">
            Showing {Math.min((page - 1) * perPage + 1, filtered.length)}–{Math.min(page * perPage, filtered.length)} of {filtered.length}
          </span>
          <div className="flex gap-1">
            <button className="p-1.75 rounded-md bg-transparent border-none cursor-pointer text-(--text-secondary) hover:bg-(--bg-elevated) transition-colors disabled:opacity-40"
              onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}>
              <ChevronLeft size={16} />
            </button>
            {Array.from({ length: totalPages }, (_, i) => i + 1).map(p => (
              <button key={p} onClick={() => setPage(p)}
                className="w-8 h-8 rounded-md border-none cursor-pointer text-[12px] font-semibold transition-colors"
                style={{ background: page === p ? 'var(--accent)' : 'transparent', color: page === p ? 'var(--text-on-accent)' : 'var(--text-secondary)' }}>
                {p}
              </button>
            ))}
            <button className="p-1.75 rounded-md bg-transparent border-none cursor-pointer text-(--text-secondary) hover:bg-(--bg-elevated) transition-colors disabled:opacity-40"
              onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages}>
              <ChevronRight size={16} />
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

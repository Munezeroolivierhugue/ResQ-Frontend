import { useState } from 'react'
import { ChevronRight, ChevronLeft, Download, Search } from 'lucide-react'
import { mockHistoryIncidents } from '../../data/mockData'

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

export default function IncidentHistory() {
  const [search, setSearch] = useState('')
  const [page,   setPage]   = useState(1)
  const perPage = 5

  const data     = [...mockHistoryIncidents, ...mockHistoryIncidents]
  const filtered = data.filter(i =>
    !search || i.id.toLowerCase().includes(search.toLowerCase()) ||
    i.type.toLowerCase().includes(search.toLowerCase()) || i.district.toLowerCase().includes(search.toLowerCase())
  )
  const totalPages = Math.ceil(filtered.length / perPage)
  const paged      = filtered.slice((page - 1) * perPage, page * perPage)

  return (
    <div className="portal-page">

      <div className="flex items-center justify-between mb-5">
        <div>
          <div className="flex items-center gap-1.5 mb-1">
            <span className="text-[12px] text-(--text-muted)">Dispatcher</span>
            <ChevronRight size={12} className="text-(--text-muted)" />
            <span className="text-[12px] text-(--text-secondary)">Incident History</span>
          </div>
          <h1 className="text-2xl font-bold m-0" style={{ fontFamily: 'var(--font-display)' }}>Incident History</h1>
        </div>
        <button className="flex items-center gap-1.5 px-5 py-2.25 bg-transparent border border-(--border) text-(--text-primary) font-semibold text-[13px] rounded-lg cursor-pointer hover:bg-(--bg-elevated) hover:border-(--accent) transition-colors" style={{ fontFamily: 'var(--font-body)' }}>
          <Download size={14} /> Export CSV
        </button>
      </div>

      <div className="flex gap-3 mb-5">
        <KpiCard label="Total This Month"    value="247"  sub="↑ 12% vs last month" />
        <KpiCard label="Avg Response Time"   value="8.4m" sub="Target: 10 min" />
        <KpiCard label="Within SLA"          value="91%"  sub="↑ 3% vs last month" />
        <KpiCard label="Avg Resolution Time" value="32m"  sub="All incident types" />
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
            {paged.map((inc, idx) => {
              const c = severityColor[inc.severity] || '#44474D'
              const withinSla = parseInt(inc.responseTime) <= parseInt(inc.target)
              return (
                <tr key={inc.id + idx} className="border-b border-(--border-subtle) cursor-pointer hover:bg-(--bg-elevated) transition-colors">
                  <td className="px-3.5 h-12">
                    <span className="text-[12px] font-semibold text-(--accent)" style={{ fontFamily: 'var(--font-mono)' }}>{inc.id}</span>
                  </td>
                  <td className="px-3.5">
                    <span className="inline-flex items-center px-2.25 py-0.5 rounded text-[10px] font-bold uppercase tracking-[0.07em] border"
                      style={{ background: c + '25', color: c, borderColor: c + '40', fontFamily: 'var(--font-body)' }}>
                      {inc.severity?.toUpperCase()}
                    </span>
                  </td>
                  <td className="px-3.5 text-[13px]">{inc.type}</td>
                  <td className="px-3.5 text-[12px] text-(--text-secondary)">{inc.district} / {inc.sector}</td>
                  <td className="px-3.5 text-[12px] text-(--text-secondary)" style={{ fontFamily: 'var(--font-mono)' }}>{inc.reported}</td>
                  <td className="px-3.5">
                    <span className="text-[12px] font-semibold" style={{ fontFamily: 'var(--font-mono)', color: withinSla ? 'var(--status-low)' : 'var(--status-critical)' }}>
                      {inc.responseTime}
                    </span>
                  </td>
                  <td className="px-3.5 text-[12px] text-(--text-secondary)" style={{ fontFamily: 'var(--font-mono)' }}>{inc.resolutionTime}</td>
                  <td className="px-3.5 text-[12px] text-(--status-info)" style={{ fontFamily: 'var(--font-mono)' }}>{inc.units?.join(', ')}</td>
                  <td className="px-3.5">
                    <span className="inline-flex items-center px-2.25 py-0.5 rounded text-[10px] font-bold uppercase tracking-[0.07em]"
                      style={{
                        background: withinSla ? 'var(--status-low-bg)' : 'var(--status-critical-bg)',
                        color: withinSla ? 'var(--status-low)' : 'var(--status-critical)',
                        fontFamily: 'var(--font-body)',
                      }}>
                      {withinSla ? '✓ MET' : '✗ MISSED'}
                    </span>
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

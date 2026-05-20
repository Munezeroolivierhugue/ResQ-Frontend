import { useState } from 'react'
import { Search, Download, Users, ChevronLeft, ChevronRight, MoreVertical, Eye, RotateCcw, ArrowUp, X } from 'lucide-react'
import { mockIncidents } from '../../data/mockData'

const severityColor = { critical: '#E8354A', high: '#F07820', medium: '#D4A017', low: '#3DAA6A' }
const statusColor   = { active: '#2196C8', pending: '#D4A017', resolved: '#3DAA6A', escalated: '#E8354A' }

function Badge({ color, children }) {
  return (
    <span className="inline-flex items-center px-2.25 py-0.5 rounded text-[10px] font-bold uppercase tracking-[0.07em] border"
      style={{ background: color + '25', color, borderColor: color + '40', fontFamily: 'var(--font-body)' }}>
      {children}
    </span>
  )
}

function KebabMenu({ onClose }) {
  return (
    <div className="absolute right-0 top-7 z-50 w-40 bg-(--bg-elevated) border border-(--border) rounded-[10px] shadow-[var(--shadow-dropdown)] overflow-hidden">
      {[
        { icon: <Eye size={13} />,       label: 'View Details' },
        { icon: <RotateCcw size={13} />, label: 'Reassign' },
        { icon: <ArrowUp size={13} />,   label: 'Escalate' },
        { icon: <X size={13} />,         label: 'Close', danger: true },
      ].map(a => (
        <button key={a.label} onClick={onClose}
          className="flex items-center gap-2 w-full px-3 py-2.25 bg-none border-none cursor-pointer text-[12px] text-left hover:bg-(--bg-surface) transition-colors"
          style={{ color: a.danger ? '#FF2D44' : 'var(--text-primary)' }}>
          {a.icon} {a.label}
        </button>
      ))}
    </div>
  )
}

export default function IncidentQueue() {
  const [statusFilter, setStatusFilter] = useState('All')
  const [search,   setSearch]   = useState('')
  const [openMenu, setOpenMenu] = useState(null)
  const [page,     setPage]     = useState(1)
  const perPage = 6

  const allData    = [...mockIncidents, ...mockIncidents.map(i => ({ ...i, id: i.id + 'B' }))]
  const filtered   = allData.filter(i => {
    const matchStatus = statusFilter === 'All' || i.status === statusFilter.toLowerCase()
    const matchSearch = !search || i.id.toLowerCase().includes(search.toLowerCase()) ||
      i.type.toLowerCase().includes(search.toLowerCase()) || i.district.toLowerCase().includes(search.toLowerCase())
    return matchStatus && matchSearch
  })
  const totalPages = Math.ceil(filtered.length / perPage)
  const paged      = filtered.slice((page - 1) * perPage, page * perPage)

  return (
    <div className="p-6">

      <div className="flex items-center justify-between mb-5">
        <div>
          <div className="flex items-center gap-1.5 mb-1">
            <span className="text-[12px] text-(--text-muted)">Dispatcher</span>
            <ChevronRight size={12} className="text-(--text-muted)" />
            <span className="text-[12px] text-(--text-secondary)">Incident Queue</span>
          </div>
          <h1 className="text-2xl font-bold m-0" style={{ fontFamily: 'var(--font-display)' }}>Incident Queue</h1>
        </div>
        <div className="flex gap-2">
          <button className="flex items-center gap-1.5 px-5 py-2.25 bg-transparent border border-(--border) text-(--text-primary) font-semibold text-[13px] rounded-lg cursor-pointer hover:bg-(--bg-elevated) hover:border-(--accent) transition-colors" style={{ fontFamily: 'var(--font-body)' }}>
            <Download size={14} /> Export CSV
          </button>
          <button className="flex items-center gap-1.5 px-5 py-2.25 bg-(--accent) text-(--text-on-accent) font-bold text-[13px] tracking-[0.04em] uppercase rounded-lg border-none cursor-pointer hover:bg-(--accent-dim) transition-colors" style={{ fontFamily: 'var(--font-body)' }}>
            <Users size={14} /> Bulk Assign
          </button>
        </div>
      </div>

      <div className="bg-(--bg-surface) border border-(--border) rounded-xl px-4 py-3 mb-4">
        <div className="flex items-center gap-3 flex-wrap">
          <div className="flex gap-1">
            {['All', 'Active', 'Pending', 'Resolved', 'Escalated'].map(tab => (
              <button key={tab} onClick={() => { setStatusFilter(tab); setPage(1) }}
                className="text-[12px] font-semibold px-3 py-1.25 rounded-lg cursor-pointer transition-colors border"
                style={{
                  background: statusFilter === tab ? 'rgba(135,157,31,0.15)' : 'transparent',
                  color: statusFilter === tab ? '#B0D501' : 'var(--text-secondary)',
                  borderColor: statusFilter === tab ? 'rgba(176,213,1,0.3)' : 'transparent',
                }}>
                {tab}
              </button>
            ))}
          </div>
          <div className="flex-1 min-w-50 relative">
            <Search size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-(--text-muted)" />
            <input
              className="h-10 w-full bg-(--bg-input) border border-(--border) rounded-full pl-8 pr-3 text-[13px] text-(--text-primary) outline-none focus:border-(--accent) placeholder:text-(--text-muted)"
              placeholder="Search by ID, type, district..."
              value={search} onChange={e => { setSearch(e.target.value); setPage(1) }}
              style={{ fontFamily: 'var(--font-body)' }}
            />
          </div>
          <select className="h-10 w-32 bg-(--bg-input) border border-(--border) rounded-lg px-3 text-[13px] text-(--text-primary) outline-none appearance-none cursor-pointer" style={{ fontFamily: 'var(--font-body)' }}>
            <option>All Severities</option>
            <option>Critical</option><option>High</option><option>Medium</option><option>Low</option>
          </select>
          <select className="h-10 w-32 bg-(--bg-input) border border-(--border) rounded-lg px-3 text-[13px] text-(--text-primary) outline-none appearance-none cursor-pointer" style={{ fontFamily: 'var(--font-body)' }}>
            <option>All Districts</option>
            <option>Gasabo</option><option>Kicukiro</option><option>Nyarugenge</option>
          </select>
        </div>
      </div>

      <div className="bg-(--bg-surface) border border-(--border) rounded-xl overflow-hidden">
        <table className="w-full border-collapse">
          <thead>
            <tr className="bg-(--bg-base)">
              {['ID', 'Severity', 'Type', 'District / Sector', 'Reported', 'Elapsed', 'Assigned Unit', 'Status', 'Actions'].map(col => (
                <th key={col} className="px-3.5 py-2.5 text-left text-[11px] font-bold text-(--text-muted) tracking-[0.08em] uppercase border-b border-(--border) whitespace-nowrap">{col}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {paged.length === 0 ? (
              <tr>
                <td colSpan={9} className="py-12 text-center">
                  <div className="text-[32px] mb-2">📋</div>
                  <div className="text-sm font-semibold text-(--text-secondary)">No incidents found</div>
                  <div className="text-[12px] text-(--text-muted) mt-1">Try adjusting your filters</div>
                </td>
              </tr>
            ) : paged.map(inc => (
              <tr key={inc.id} className="border-b border-(--border-subtle) cursor-pointer hover:bg-(--bg-elevated) transition-colors">
                <td className="px-3.5 h-12">
                  <span className="text-[12px] font-semibold text-(--accent)" style={{ fontFamily: 'var(--font-mono)' }}>{inc.id}</span>
                </td>
                <td className="px-3.5"><Badge color={severityColor[inc.severity]}>{inc.severity?.toUpperCase()}</Badge></td>
                <td className="px-3.5 text-[13px]">{inc.type}</td>
                <td className="px-3.5 text-[12px] text-(--text-secondary)">{inc.district} / {inc.sector}</td>
                <td className="px-3.5 text-[12px] text-(--text-secondary)" style={{ fontFamily: 'var(--font-mono)' }}>{inc.reported}</td>
                <td className="px-3.5 text-[12px] text-(--text-secondary)" style={{ fontFamily: 'var(--font-mono)' }}>{inc.elapsed}</td>
                <td className="px-3.5">
                  {inc.unit
                    ? <span className="text-[12px] text-(--status-info)" style={{ fontFamily: 'var(--font-mono)' }}>{inc.unit}</span>
                    : <Badge color="#E8354A">UNASSIGNED</Badge>
                  }
                </td>
                <td className="px-3.5"><Badge color={statusColor[inc.status]}>{inc.status?.toUpperCase()}</Badge></td>
                <td className="px-3.5">
                  <div className="relative inline-block">
                    <button
                      className="p-1.75 rounded-md bg-transparent border-none cursor-pointer text-(--text-secondary) hover:bg-(--bg-elevated) hover:text-(--text-primary) transition-colors"
                      onClick={e => { e.stopPropagation(); setOpenMenu(openMenu === inc.id ? null : inc.id) }}>
                      <MoreVertical size={15} />
                    </button>
                    {openMenu === inc.id && <KebabMenu onClose={() => setOpenMenu(null)} />}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        <div className="flex items-center justify-between px-4 py-3 border-t border-(--border)">
          <span className="text-[12px] text-(--text-muted)">
            Showing {Math.min((page - 1) * perPage + 1, filtered.length)}–{Math.min(page * perPage, filtered.length)} of {filtered.length} incidents
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

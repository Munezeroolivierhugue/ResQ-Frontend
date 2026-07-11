import { useState, useEffect, useCallback } from 'react'
import { Download, FileBarChart, RefreshCw } from 'lucide-react'
import AdminPageHeader from '../../components/admin/AdminPageHeader'
import { getCurrentUser } from '../../utils/authSession'
import { listUsers } from '../../api/users'
import { listIncidents } from '../../api/incidents'
import { listReports } from '../../api/reporting'

const ACCENT = '#879D1F'
const NAVY   = '#031632'

// ── helpers ──────────────────────────────────────────────────────────────────
function todayStr() {
  const n = new Date()
  const y = n.getFullYear(), m = String(n.getMonth() + 1).padStart(2, '0'), d = String(n.getDate()).padStart(2, '0')
  return `${y}-${m}-${d}`
}

function monthStartStr() {
  const n = new Date()
  return `${n.getFullYear()}-${String(n.getMonth() + 1).padStart(2, '0')}-01`
}

function inRange(isoStr, from, to) {
  if (!isoStr) return true
  const ts = new Date(isoStr).getTime()
  const fromTs = from ? new Date(from + 'T00:00:00').getTime() : null
  const toTs   = to   ? new Date(to   + 'T23:59:59').getTime() : null
  if (fromTs && ts < fromTs) return false
  if (toTs   && ts > toTs)   return false
  return true
}

const ROLE_LABELS = {
  SUPER_ADMIN: 'Super Admin', OPERATIONS_MANAGER: 'Operations Manager',
  DISTRICT_COMMANDER: 'District Commander', DISPATCHER: 'Dispatcher',
  FIELD_RESPONDER: 'Field Responder', EMERGENCY_PLANNER: 'Emergency Planner',
  ANALYST: 'Analyst',
}

const INC_TYPE_LABELS = {
  MEDICAL: 'Medical Emergency', TRAFFIC: 'Traffic Incident',
  FIRE: 'Fire Outbreak', SECURITY: 'Security / Disturbance',
  DISASTER: 'Disaster Response',
}

function groupBy(arr, key) {
  return arr.reduce((acc, item) => {
    const k = item[key] || 'OTHER'
    acc[k] = (acc[k] || 0) + 1
    return acc
  }, {})
}

function MetricCard({ label, value, color = ACCENT, sub }) {
  return (
    <div className="dispatcher-surface p-4 flex flex-col gap-1" style={{ borderLeft: `4px solid ${color}` }}>
      <div className="text-[11px] text-(--text-muted) font-semibold uppercase tracking-wide">{label}</div>
      <div className="font-mono text-[28px] font-bold leading-none" style={{ color }}>{value}</div>
      {sub && <div className="text-[11px] text-(--text-secondary)">{sub}</div>}
    </div>
  )
}

export default function AdminSystemReport() {
  const today = todayStr()
  const [dateFrom, setDateFrom] = useState(monthStartStr())
  const [dateTo,   setDateTo]   = useState(today)
  const [loading,  setLoading]  = useState(true)
  const [users,    setUsers]    = useState([])
  const [incidents, setIncidents] = useState([])
  const [reports,  setReports]  = useState([])

  const load = useCallback(() => {
    setLoading(true)
    Promise.all([listUsers(), listIncidents({}), listReports()])
      .then(([u, i, r]) => { setUsers(u); setIncidents(i); setReports(r) })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  useEffect(() => { load() }, [load])

  // ── derived data ────────────────────────────────────────────────────────────
  const rangedIncidents = incidents.filter(i => inRange(i.call_time ?? i.created_at, dateFrom, dateTo))
  const rangedReports   = reports.filter(r => inRange(r.generated_at, dateFrom, dateTo))

  const activeUsers  = users.filter(u => u.status === 'ACTIVE')
  const roleBreakdown = groupBy(users, 'role')
  const incByDistrict = groupBy(rangedIncidents, 'district')
  const incByType     = groupBy(rangedIncidents, 'incident_type')

  const avgResponseMin = (() => {
    const vals = rangedIncidents.map(i => i.response_time_minutes).filter(v => v != null && v > 0)
    if (!vals.length) return null
    return vals.reduce((a, b) => a + b, 0) / vals.length
  })()

  const avgResponse = (() => {
    if (avgResponseMin == null) return null
    if (avgResponseMin >= 60) return (avgResponseMin / 60).toFixed(1) + 'h'
    return avgResponseMin.toFixed(1) + 'm'
  })()

  const resolvedCount = rangedIncidents.filter(i => ['RESOLVED', 'CLEARED'].includes((i.status ?? '').toUpperCase())).length
  const resolutionRate = rangedIncidents.length ? Math.round(resolvedCount / rangedIncidents.length * 100) : null

  // ── PDF export ──────────────────────────────────────────────────────────────
  function exportPDF() {
    const currentUser = getCurrentUser()
    const generatorName = currentUser?.full_name || currentUser?.email || 'System Admin'
    const generatorRole = 'SUPER ADMIN'
    const reportId = 'SYS-' + Date.now().toString(36).toUpperCase() + '-' + Math.random().toString(36).slice(2, 6).toUpperCase()
    const now = new Date()
    const rnpLogoUrl = window.location.origin + '/Rwanda_National_Police.png'
    const fmtDate = (s) => s ? new Date(s).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }) : '—'
    const dateRangeLabel = `${fmtDate(dateFrom)} – ${fmtDate(dateTo)}`

    // Role table rows
    const roleRows = Object.entries(roleBreakdown).map(([role, count], i) => `
      <tr style="background:${i % 2 === 1 ? '#f8fafc' : '#fff'}">
        <td style="padding:9px 14px;font-weight:600;color:#1a202c;border-bottom:1px solid #e2e8f0">${ROLE_LABELS[role] ?? role}</td>
        <td style="padding:9px 14px;font-family:monospace;font-weight:700;color:${ACCENT};border-bottom:1px solid #e2e8f0">${count}</td>
        <td style="padding:9px 14px;color:#374151;border-bottom:1px solid #e2e8f0">${users.filter(u => u.role === role && u.status === 'ACTIVE').length} active</td>
      </tr>`).join('')

    // District table rows
    const districtRows = Object.entries(incByDistrict)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 15)
      .map(([district, count], i) => `
      <tr style="background:${i % 2 === 1 ? '#f8fafc' : '#fff'}">
        <td style="padding:9px 14px;font-weight:600;color:#1a202c;border-bottom:1px solid #e2e8f0">${district || '(Unknown)'}</td>
        <td style="padding:9px 14px;font-family:monospace;font-weight:700;color:#2196C8;border-bottom:1px solid #e2e8f0">${count}</td>
        <td style="padding:9px 14px;border-bottom:1px solid #e2e8f0">
          <div style="background:#e2e8f0;border-radius:4px;height:8px;width:100%;min-width:60px">
            <div style="background:${ACCENT};border-radius:4px;height:8px;width:${Math.round(count / (rangedIncidents.length || 1) * 100)}%"></div>
          </div>
        </td>
        <td style="padding:9px 14px;font-family:monospace;color:#374151;border-bottom:1px solid #e2e8f0">${Math.round(count / (rangedIncidents.length || 1) * 100)}%</td>
      </tr>`).join('')

    // Incident type rows
    const typeRows = Object.entries(incByType)
      .sort((a, b) => b[1] - a[1])
      .map(([type, count], i) => `
      <tr style="background:${i % 2 === 1 ? '#f8fafc' : '#fff'}">
        <td style="padding:9px 14px;font-weight:600;color:#1a202c;border-bottom:1px solid #e2e8f0">${INC_TYPE_LABELS[type] ?? type}</td>
        <td style="padding:9px 14px;font-family:monospace;font-weight:700;color:#2196C8;border-bottom:1px solid #e2e8f0">${count}</td>
        <td style="padding:9px 14px;font-family:monospace;color:#374151;border-bottom:1px solid #e2e8f0">${Math.round(count / (rangedIncidents.length || 1) * 100)}%</td>
      </tr>`).join('')

    const html = `<!DOCTYPE html>
<html lang="en"><head>
  <meta charset="UTF-8">
  <title>RNP RESQ System Report — ${reportId}</title>
  <style>
    *{box-sizing:border-box;margin:0;padding:0}
    body{font-family:'Segoe UI',Arial,sans-serif;color:#1a202c;background:#fff;font-size:13px}
    @media print{
      body{-webkit-print-color-adjust:exact;print-color-adjust:exact}
      @page{margin:8mm 10mm}
      .no-break{page-break-inside:avoid}
    }
  </style>
</head><body>

<!-- ═══ RNP HEADER ═══ -->
<div style="background:linear-gradient(135deg,${NAVY} 0%,#010c1f 100%);color:#fff;padding:22px 32px;display:flex;align-items:center;gap:20px">
  <img src="${rnpLogoUrl}" style="width:68px;height:68px;object-fit:contain;flex-shrink:0" alt="Rwanda National Police Logo" onerror="this.style.display='none'">
  <div style="flex:1">
    <div style="font-size:10px;font-weight:700;letter-spacing:0.15em;text-transform:uppercase;color:#b8c74e;margin-bottom:5px">Rwanda National Police · RESQ Emergency Response Division</div>
    <div style="font-size:22px;font-weight:800;letter-spacing:0.01em;margin-bottom:3px">SYSTEM OVERVIEW REPORT</div>
    <div style="font-size:12px;color:rgba(183,199,78,0.75)">Comprehensive system intelligence &amp; performance summary — Official Document</div>
  </div>
  <div style="background:rgba(255,255,255,0.1);border:1px solid rgba(255,255,255,0.2);border-radius:8px;padding:10px 16px;text-align:center;min-width:130px">
    <div style="font-size:9px;font-weight:700;letter-spacing:0.12em;text-transform:uppercase;color:#b8c74e;margin-bottom:4px">Document ID</div>
    <div style="font-size:11px;font-weight:700;color:#fff;font-family:monospace">${reportId}</div>
    <div style="font-size:9px;color:rgba(183,199,78,0.75);margin-top:3px">&#10003; Official Report</div>
  </div>
</div>

<!-- ═══ META BAR ═══ -->
<div style="background:#f0f4f8;border-bottom:3px solid ${ACCENT};padding:11px 32px;display:flex;align-items:center;flex-wrap:wrap;gap:0">
  <div style="font-size:11px;color:#374151;padding-right:16px;border-right:1px solid #cbd5e0;margin-right:16px"><strong style="color:${NAVY}">Period:</strong> ${dateRangeLabel}</div>
  <div style="font-size:11px;color:#374151;padding-right:16px;border-right:1px solid #cbd5e0;margin-right:16px"><strong style="color:${NAVY}">Scope:</strong> Rwanda — All Districts</div>
  <div style="font-size:11px;color:#374151;padding-right:16px;border-right:1px solid #cbd5e0;margin-right:16px"><strong style="color:${NAVY}">Generated:</strong> ${now.toLocaleString('en-GB', { dateStyle: 'long', timeStyle: 'short' })}</div>
  <div style="font-size:11px;color:#374151"><strong style="color:${NAVY}">Prepared by:</strong> ${generatorName} (${generatorRole})</div>
  <div style="margin-left:auto;background:${ACCENT};color:#fff;font-size:10px;font-weight:700;letter-spacing:0.07em;text-transform:uppercase;padding:5px 12px;border-radius:4px">SYSTEM REPORT</div>
</div>

<!-- ═══ CONTENT ═══ -->
<div style="padding:26px 32px">

  <!-- KPI Cards -->
  <div style="font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:0.1em;color:${NAVY};border-bottom:2px solid ${ACCENT};padding-bottom:6px;margin-bottom:14px" class="no-break">
    System Overview KPIs — ${dateRangeLabel}
  </div>
  <div style="display:grid;grid-template-columns:repeat(3,1fr);gap:12px;margin-bottom:26px" class="no-break">
    <div style="background:rgba(33,150,200,0.10);border-left:4px solid #2196C8;border-radius:8px;padding:14px">
      <div style="font-size:30px;font-weight:800;font-family:monospace;color:#2196C8;line-height:1;margin-bottom:5px">${rangedIncidents.length}</div>
      <div style="font-size:11px;font-weight:600;color:#1a7aa8">Total Incidents (Period)</div>
      <div style="font-size:10px;color:#2196C8;margin-top:2px">${resolvedCount} resolved</div>
    </div>
    <div style="background:rgba(61,170,106,0.12);border-left:4px solid #3DAA6A;border-radius:8px;padding:14px">
      <div style="font-size:30px;font-weight:800;font-family:monospace;color:#3DAA6A;line-height:1;margin-bottom:5px">${activeUsers.length}</div>
      <div style="font-size:11px;font-weight:600;color:#2d8050">Active Users</div>
      <div style="font-size:10px;color:#3DAA6A;margin-top:2px">${users.length} total registered</div>
    </div>
    <div style="background:rgba(135,157,31,0.12);border-left:4px solid ${ACCENT};border-radius:8px;padding:14px">
      <div style="font-size:30px;font-weight:800;font-family:monospace;color:${ACCENT};line-height:1;margin-bottom:5px">${Object.keys(incByDistrict).length}</div>
      <div style="font-size:11px;font-weight:600;color:#6a7b17">Districts Active</div>
      <div style="font-size:10px;color:${ACCENT};margin-top:2px">With incidents in period</div>
    </div>
    <div style="background:rgba(212,160,23,0.12);border-left:4px solid #D4A017;border-radius:8px;padding:14px">
      <div style="font-size:30px;font-weight:800;font-family:monospace;color:#D4A017;line-height:1;margin-bottom:5px">${rangedReports.length}</div>
      <div style="font-size:11px;font-weight:600;color:#a07c12">Reports Generated</div>
      <div style="font-size:10px;color:#D4A017;margin-top:2px">In selected period</div>
    </div>
    <div style="background:rgba(33,150,200,0.10);border-left:4px solid #2196C8;border-radius:8px;padding:14px">
      <div style="font-size:30px;font-weight:800;font-family:monospace;color:#2196C8;line-height:1;margin-bottom:5px">${avgResponse != null ? avgResponse : '—'}</div>
      <div style="font-size:11px;font-weight:600;color:#1a7aa8">Avg Response Time</div>
      <div style="font-size:10px;color:#2196C8;margin-top:2px">Target: &lt; 8 min</div>
    </div>
    <div style="background:rgba(61,170,106,0.12);border-left:4px solid #3DAA6A;border-radius:8px;padding:14px">
      <div style="font-size:30px;font-weight:800;font-family:monospace;color:#3DAA6A;line-height:1;margin-bottom:5px">${resolutionRate != null ? resolutionRate + '%' : '—'}</div>
      <div style="font-size:11px;font-weight:600;color:#2d8050">Resolution Rate</div>
      <div style="font-size:10px;color:#3DAA6A;margin-top:2px">Resolved / total incidents</div>
    </div>
  </div>

  <!-- User Breakdown -->
  <div style="font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:0.1em;color:${NAVY};border-bottom:2px solid ${ACCENT};padding-bottom:6px;margin-bottom:12px" class="no-break">
    Registered Users by Role
  </div>
  <table style="width:100%;border-collapse:collapse;margin-bottom:22px;font-size:12px" class="no-break">
    <thead>
      <tr style="background:${NAVY};color:#fff">
        <th style="padding:10px 14px;text-align:left;font-size:11px;font-weight:600">Role</th>
        <th style="padding:10px 14px;text-align:left;font-size:11px;font-weight:600">Total Users</th>
        <th style="padding:10px 14px;text-align:left;font-size:11px;font-weight:600">Active</th>
      </tr>
    </thead>
    <tbody>${roleRows || '<tr><td colspan="3" style="padding:12px;color:#6b7280;text-align:center">No user data available</td></tr>'}</tbody>
  </table>

  <!-- District Performance -->
  ${rangedIncidents.length > 0 ? `
  <div style="font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:0.1em;color:${NAVY};border-bottom:2px solid ${ACCENT};padding-bottom:6px;margin-bottom:12px" class="no-break">
    District Performance — Incident Volume
  </div>
  <table style="width:100%;border-collapse:collapse;margin-bottom:22px;font-size:12px" class="no-break">
    <thead>
      <tr style="background:${NAVY};color:#fff">
        <th style="padding:10px 14px;text-align:left;font-size:11px;font-weight:600">District</th>
        <th style="padding:10px 14px;text-align:left;font-size:11px;font-weight:600">Incidents</th>
        <th style="padding:10px 14px;text-align:left;font-size:11px;font-weight:600">Distribution</th>
        <th style="padding:10px 14px;text-align:left;font-size:11px;font-weight:600">Share</th>
      </tr>
    </thead>
    <tbody>${districtRows}</tbody>
  </table>

  <!-- Incident Type Breakdown -->
  <div style="font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:0.1em;color:${NAVY};border-bottom:2px solid ${ACCENT};padding-bottom:6px;margin-bottom:12px" class="no-break">
    Incident Type Breakdown
  </div>
  <table style="width:100%;border-collapse:collapse;margin-bottom:22px;font-size:12px" class="no-break">
    <thead>
      <tr style="background:${NAVY};color:#fff">
        <th style="padding:10px 14px;text-align:left;font-size:11px;font-weight:600">Type</th>
        <th style="padding:10px 14px;text-align:left;font-size:11px;font-weight:600">Count</th>
        <th style="padding:10px 14px;text-align:left;font-size:11px;font-weight:600">% of Total</th>
      </tr>
    </thead>
    <tbody>${typeRows}</tbody>
  </table>` : ''}

  <!-- Signature Block -->
  <div style="margin-top:40px;page-break-inside:avoid">
    <div style="font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:0.1em;color:${NAVY};border-bottom:2px solid ${ACCENT};padding-bottom:6px;margin-bottom:24px">
      Authorization &amp; Certification
    </div>
    <div style="display:grid;grid-template-columns:repeat(3,1fr);gap:32px">
      <div>
        <div style="font-size:10px;font-weight:700;text-transform:uppercase;color:#6b7280;margin-bottom:12px">Generated By</div>
        <div style="border-bottom:1px solid #1a202c;height:40px;margin-bottom:6px;position:relative">
          <div style="position:absolute;bottom:4px;left:0;font-size:12px;font-weight:600;color:#1a202c">${generatorName}</div>
        </div>
        <div style="font-size:11px;color:#374151">${generatorRole}</div>
        <div style="font-size:10px;color:#6b7280;margin-top:2px">${now.toLocaleDateString('en-GB', { dateStyle: 'long' })}</div>
      </div>
      <div>
        <div style="font-size:10px;font-weight:700;text-transform:uppercase;color:#6b7280;margin-bottom:12px">Reviewed &amp; Approved By</div>
        <div style="border-bottom:1px solid #1a202c;height:40px;margin-bottom:6px"></div>
        <div style="font-size:11px;color:#374151">Name &amp; Title</div>
        <div style="font-size:10px;color:#6b7280;margin-top:2px">Date: _______________</div>
      </div>
      <div>
        <div style="font-size:10px;font-weight:700;text-transform:uppercase;color:#6b7280;margin-bottom:12px">Official Stamp</div>
        <div style="border:2px dashed #cbd5e0;border-radius:50%;width:90px;height:90px;display:flex;align-items:center;justify-content:center;margin:0 auto">
          <div style="font-size:9px;color:#9ca3af;text-align:center;font-weight:600;text-transform:uppercase;letter-spacing:0.05em">RNP<br>OFFICIAL<br>STAMP</div>
        </div>
      </div>
    </div>
  </div>

  <!-- Footer -->
  <div style="margin-top:32px;padding-top:14px;border-top:1px solid #e2e8f0;display:flex;justify-content:space-between;align-items:center">
    <div style="font-size:10px;color:#9ca3af">
      Rwanda National Police · RESQ Emergency Response Platform · Official Document · ${reportId}
    </div>
    <div style="font-size:10px;color:#9ca3af">
      Generated ${now.toLocaleString('en-GB', { dateStyle: 'medium', timeStyle: 'short' })}
    </div>
  </div>

</div>
</body></html>`

    const win = window.open('', '_blank')
    if (!win) return
    win.document.write(html)
    win.document.close()
    win.focus()
    setTimeout(() => { win.print() }, 800)
  }

  // ── render ──────────────────────────────────────────────────────────────────
  return (
    <div className="portal-page flex flex-col gap-5 min-w-[900px]">
      <AdminPageHeader
        title="System Report"
        subtitle="Comprehensive overview of the entire RESQ platform — incidents, users, districts."
        eyebrow="Super Admin Portal"
        badge="System Intelligence"
        actions={
          <div className="flex gap-2">
            <button type="button" onClick={load} className="dispatcher-btn-ghost text-[12px] inline-flex items-center gap-1.5">
              <RefreshCw size={13} />
              Refresh
            </button>
            <button type="button" onClick={exportPDF} className="dispatcher-btn-primary text-[12px] inline-flex items-center gap-1.5">
              <Download size={13} />
              Export PDF
            </button>
          </div>
        }
      />

      {/* Filters */}
      {dateFrom && dateTo && dateFrom > dateTo && (
        <div className="text-[12px] px-4 py-2.5 rounded" style={{ background: 'rgba(239,68,68,0.1)', color: 'var(--status-critical)', border: '1px solid rgba(239,68,68,0.3)' }}>
          ⚠ "From" date is after "To" date — no results will be shown.
        </div>
      )}
      <div className="dispatcher-surface p-4 flex flex-wrap items-end gap-3">
        <div className="flex flex-col gap-1">
          <label className="text-[11px] font-semibold text-(--text-muted) uppercase tracking-wide">From</label>
          <input
            type="date"
            className="dispatcher-input h-9 w-36 text-[12px]"
            value={dateFrom}
            max={dateTo || today}
            onChange={e => setDateFrom(e.target.value)}
          />
        </div>
        <div className="flex flex-col gap-1">
          <label className="text-[11px] font-semibold text-(--text-muted) uppercase tracking-wide">To</label>
          <input
            type="date"
            className="dispatcher-input h-9 w-36 text-[12px]"
            value={dateTo}
            min={dateFrom}
            max={today}
            onChange={e => setDateTo(e.target.value)}
          />
        </div>
        {[
          { label: 'This Month', fn: () => { setDateFrom(monthStartStr()); setDateTo(today) } },
          { label: 'Last 30d',   fn: () => { const d = new Date(); d.setDate(d.getDate() - 30); const y=d.getFullYear(),m=String(d.getMonth()+1).padStart(2,'0'),day=String(d.getDate()).padStart(2,'0'); setDateFrom(`${y}-${m}-${day}`); setDateTo(today) } },
          { label: 'Last 90d',   fn: () => { const d = new Date(); d.setDate(d.getDate() - 90); const y=d.getFullYear(),m=String(d.getMonth()+1).padStart(2,'0'),day=String(d.getDate()).padStart(2,'0'); setDateFrom(`${y}-${m}-${day}`); setDateTo(today) } },
        ].map(({ label, fn }) => (
          <button key={label} type="button" onClick={fn}
            className="text-[11px] font-semibold px-3 py-1.5 rounded border transition-colors self-end"
            style={{ borderColor: 'var(--border)', color: 'var(--text-secondary)', background: 'transparent' }}>
            {label}
          </button>
        ))}
      </div>

      {/* KPI Grid */}
      {loading ? (
        <div className="text-center py-12 text-(--text-muted) text-[13px]">Loading system data…</div>
      ) : (
        <>
          <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-3">
            <MetricCard label="Total Incidents" value={rangedIncidents.length} color="#2196C8"
              sub={`${resolvedCount} resolved`} />
            <MetricCard label="Active Users" value={activeUsers.length} color="#3DAA6A"
              sub={`${users.length} total (all time)`} />
            <MetricCard label="Districts Active" value={Object.keys(incByDistrict).length} color={ACCENT}
              sub="With incidents in period" />
            <MetricCard label="Reports" value={rangedReports.length} color="#D4A017"
              sub="In period" />
            <MetricCard label="Avg Response" value={avgResponse != null ? avgResponse : '—'} color="#2196C8"
              sub="Target < 8 min" />
            <MetricCard label="Resolution Rate" value={resolutionRate != null ? resolutionRate + '%' : '—'} color="#3DAA6A"
              sub="Resolved / total" />
          </div>

          {/* Tables */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {/* Users by Role */}
            <div className="dispatcher-surface overflow-hidden">
              <div className="px-4 py-3 border-b border-(--border-subtle) flex items-center gap-2">
                <FileBarChart size={14} style={{ color: 'var(--accent)' }} />
                <span className="font-semibold text-[13px]">Users by Role</span>
              </div>
              <table className="w-full text-[12px]">
                <thead>
                  <tr className="text-(--text-muted) text-[10px] uppercase border-b border-(--border-subtle)">
                    <th className="text-left px-4 py-2">Role</th>
                    <th className="px-4 py-2 text-center">Total</th>
                    <th className="px-4 py-2 text-center">Active</th>
                  </tr>
                </thead>
                <tbody>
                  {Object.entries(roleBreakdown).map(([role, count]) => (
                    <tr key={role} className="border-b border-(--border-subtle)">
                      <td className="px-4 py-2.5 font-medium">{ROLE_LABELS[role] ?? role}</td>
                      <td className="px-4 py-2.5 font-mono font-bold text-center" style={{ color: 'var(--accent)' }}>{count}</td>
                      <td className="px-4 py-2.5 font-mono text-center text-(--text-secondary)">
                        {users.filter(u => u.role === role && u.status === 'ACTIVE').length}
                      </td>
                    </tr>
                  ))}
                  {Object.keys(roleBreakdown).length === 0 && (
                    <tr><td colSpan={3} className="px-4 py-6 text-center text-(--text-muted)">No data</td></tr>
                  )}
                </tbody>
              </table>
            </div>

            {/* Incidents by District */}
            <div className="dispatcher-surface overflow-hidden">
              <div className="px-4 py-3 border-b border-(--border-subtle) flex items-center gap-2">
                <FileBarChart size={14} style={{ color: 'var(--accent)' }} />
                <span className="font-semibold text-[13px]">Incidents by District</span>
                <span className="ml-auto text-[11px] text-(--text-muted)">{rangedIncidents.length} total</span>
              </div>
              <table className="w-full text-[12px]">
                <thead>
                  <tr className="text-(--text-muted) text-[10px] uppercase border-b border-(--border-subtle)">
                    <th className="text-left px-4 py-2">District</th>
                    <th className="px-4 py-2 text-center">Count</th>
                    <th className="px-4 py-2 text-right">Share</th>
                  </tr>
                </thead>
                <tbody>
                  {Object.entries(incByDistrict).sort((a, b) => b[1] - a[1]).slice(0, 10).map(([district, count]) => (
                    <tr key={district} className="border-b border-(--border-subtle)">
                      <td className="px-4 py-2.5 font-medium">{district || '(Unknown)'}</td>
                      <td className="px-4 py-2.5 font-mono font-bold text-center" style={{ color: '#2196C8' }}>{count}</td>
                      <td className="px-4 py-2.5 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <div className="flex-1 max-w-[60px] h-1.5 rounded-full bg-(--bg-elevated) overflow-hidden">
                            <div className="h-full rounded-full" style={{ width: `${Math.round(count / (rangedIncidents.length || 1) * 100)}%`, background: 'var(--accent)' }} />
                          </div>
                          <span className="font-mono text-(--text-secondary)">{Math.round(count / (rangedIncidents.length || 1) * 100)}%</span>
                        </div>
                      </td>
                    </tr>
                  ))}
                  {rangedIncidents.length === 0 && (
                    <tr><td colSpan={3} className="px-4 py-6 text-center text-(--text-muted)">No incidents in selected period</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Incident Type Breakdown */}
          {Object.keys(incByType).length > 0 && (
            <div className="dispatcher-surface overflow-hidden">
              <div className="px-4 py-3 border-b border-(--border-subtle) flex items-center gap-2">
                <FileBarChart size={14} style={{ color: 'var(--accent)' }} />
                <span className="font-semibold text-[13px]">Incidents by Type</span>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 xl:grid-cols-6 gap-0">
                {Object.entries(incByType).sort((a, b) => b[1] - a[1]).map(([type, count]) => (
                  <div key={type} className="p-4 border-r border-b border-(--border-subtle) flex flex-col gap-1">
                    <div className="font-mono text-[22px] font-bold" style={{ color: '#2196C8' }}>{count}</div>
                    <div className="text-[11px] font-medium text-(--text-secondary)">{INC_TYPE_LABELS[type] ?? type}</div>
                    <div className="text-[10px] text-(--text-muted)">{Math.round(count / rangedIncidents.length * 100)}%</div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  )
}

import { useState, useEffect, useCallback, useMemo, useRef } from 'react'
import { Link } from 'react-router-dom'
import {
  Download, FileBarChart, Siren, Users as UsersIcon,
  MapPin, Clock, CheckCircle2, LogIn, LogOut, AlertTriangle,
  KeyRound, UserPlus, Pencil, Activity as ActivityIcon, Search,
} from 'lucide-react'
import AdminPageHeader from '../../components/admin/AdminPageHeader'
import FilterDropdown from '../../components/admin/FilterDropdown'
import { getCurrentUser } from '../../utils/authSession'
import { listUsers } from '../../api/users'
import { listIncidents } from '../../api/incidents'
import { listAuditLogs, getResponseTimeTarget } from '../../api/admin'

// System palette only — these mirror the tokens declared in index.css
// (kept as plain hex here only where the PDF export needs a literal value
// outside the live DOM; everything on-screen below reads the CSS vars).
const ACCENT = '#879D1F'
const ACCENT_DIM = '#6B7D18'
const STATUS_LOW = '#3DAA6A'
const STATUS_MEDIUM = '#D4A017'
const NAVY   = '#031632'

// ── helpers ──────────────────────────────────────────────────────────────────
function hexToRgba(hex, alpha) {
  const n = parseInt(hex.slice(1), 16)
  return `rgba(${(n >> 16) & 255},${(n >> 8) & 255},${n & 255},${alpha})`
}

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

// Real status → color, same convention used everywhere else in the app
// (StatusBadge's variants) rather than a separate fabricated palette.
function logStatusColor(status) {
  const s = (status ?? '').toUpperCase()
  if (s === 'FAILURE' || s === 'FAILED' || s === 'ERROR') return 'var(--status-critical)'
  if (s === 'WARNING') return 'var(--status-medium)'
  return 'var(--status-low)'
}

// Audit action → icon, so each activity row reads at a glance instead of
// relying on a plain color dot.
function logActionIcon(action) {
  const a = (action ?? '').toUpperCase()
  if (a.includes('LOGIN')) return LogIn
  if (a.includes('LOGOUT')) return LogOut
  if (a.includes('TOKEN')) return KeyRound
  if (a.includes('INVITE') || a.includes('CREATE')) return UserPlus
  if (a.includes('UPDATE') || a.includes('EDIT')) return Pencil
  if (a.includes('FAIL') || a.includes('ERROR')) return AlertTriangle
  return ActivityIcon
}

function groupBy(arr, key) {
  return arr.reduce((acc, item) => {
    const k = item[key] || 'OTHER'
    acc[k] = (acc[k] || 0) + 1
    return acc
  }, {})
}

// Stat-tile card: icon in a tinted circle badge, big value, label below —
// every color reads a system token (var(--status-*) / var(--accent)),
// never a one-off hex, so the card always matches the active theme.
function MetricCard({ label, value, icon: Icon, color, bg, sub }) {
  return (
    <div className="dispatcher-surface p-4 flex flex-col gap-3">
      <div className="w-9 h-9 rounded-full flex items-center justify-center shrink-0" style={{ background: bg }}>
        <Icon size={17} style={{ color }} />
      </div>
      <div className="flex flex-col gap-0.5">
        <div className="font-mono text-[26px] font-bold leading-none text-(--text-primary)">{value}</div>
        <div className="text-[12px] font-medium text-(--text-secondary)">{label}</div>
        {sub && <div className="text-[11px] font-medium mt-0.5" style={{ color: 'var(--accent-dim)' }}>{sub}</div>}
      </div>
    </div>
  )
}

function dayKey(isoStr) {
  const d = new Date(isoStr)
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

function buildDailySeries(incidents, from, to) {
  const start = new Date(from + 'T00:00:00')
  const end   = new Date(to   + 'T00:00:00')
  const counts = {}
  for (const inc of incidents) {
    const ts = inc.call_time ?? inc.created_at
    if (!ts) continue
    counts[dayKey(ts)] = (counts[dayKey(ts)] || 0) + 1
  }
  const days = []
  // Cap at 90 points so a wide custom range still renders a legible line.
  const msPerDay = 24 * 60 * 60 * 1000
  const totalDays = Math.max(1, Math.round((end - start) / msPerDay) + 1)
  const step = totalDays > 90 ? Math.ceil(totalDays / 90) : 1
  for (let d = new Date(start); d <= end; d.setDate(d.getDate() + step)) {
    const key = dayKey(d)
    days.push({ key, date: new Date(d), count: counts[key] || 0 })
  }
  return days
}

// Single-series incident trend — thin 2px line, 10%-opacity area wash,
// hairline recessive gridlines, crosshair + tooltip that snaps to the
// nearest day. No legend needed: one series, named by the card title.
function IncidentTrendChart({ data }) {
  const svgRef = useRef(null)
  const [hoverIdx, setHoverIdx] = useState(null)
  const width = 640, height = 200
  const padL = 36, padR = 12, padT = 16, padB = 26

  const maxVal = Math.max(1, ...data.map(d => d.count))
  const niceMax = Math.ceil(maxVal / 5) * 5 || 5
  const xFor = (i) => padL + (data.length > 1 ? (i / (data.length - 1)) * (width - padL - padR) : 0)
  const yFor = (v) => height - padB - (v / niceMax) * (height - padT - padB)

  const linePath = data.map((d, i) => `${i === 0 ? 'M' : 'L'} ${xFor(i)} ${yFor(d.count)}`).join(' ')
  const areaPath = data.length
    ? `${linePath} L ${xFor(data.length - 1)} ${height - padB} L ${xFor(0)} ${height - padB} Z`
    : ''

  const yTicks = [0, 0.25, 0.5, 0.75, 1].map(f => Math.round(niceMax * f))

  function handleMove(e) {
    if (!svgRef.current || data.length === 0) return
    const rect = svgRef.current.getBoundingClientRect()
    const px = ((e.clientX - rect.left) / rect.width) * width
    let nearest = 0, best = Infinity
    data.forEach((_, i) => {
      const dist = Math.abs(xFor(i) - px)
      if (dist < best) { best = dist; nearest = i }
    })
    setHoverIdx(nearest)
  }

  const hover = hoverIdx != null ? data[hoverIdx] : null

  return (
    <div className="relative">
      <svg
        ref={svgRef}
        viewBox={`0 0 ${width} ${height}`}
        className="w-full h-auto"
        onPointerMove={handleMove}
        onPointerLeave={() => setHoverIdx(null)}
        role="img"
        aria-label="Incidents per day for the selected period"
      >
        {yTicks.map((t, i) => (
          <g key={i}>
            <line x1={padL} x2={width - padR} y1={yFor(t)} y2={yFor(t)} stroke="var(--border-subtle)" strokeWidth="1" />
            <text x={padL - 8} y={yFor(t) + 3} textAnchor="end" fontSize="9" fill="var(--text-muted)">{t}</text>
          </g>
        ))}
        {areaPath && <path d={areaPath} fill="var(--accent)" opacity="0.1" />}
        {linePath && <path d={linePath} fill="none" stroke="var(--accent)" strokeWidth="2" strokeLinejoin="round" strokeLinecap="round" />}
        {hover && (
          <>
            <line x1={xFor(hoverIdx)} x2={xFor(hoverIdx)} y1={padT} y2={height - padB} stroke="var(--border)" strokeWidth="1" />
            <circle cx={xFor(hoverIdx)} cy={yFor(hover.count)} r="4" fill="var(--accent)" stroke="var(--bg-surface)" strokeWidth="2" />
          </>
        )}
        {data.length > 1 && [0, data.length - 1].map(i => (
          <text key={i} x={xFor(i)} y={height - 8} textAnchor={i === 0 ? 'start' : 'end'} fontSize="9" fill="var(--text-muted)">
            {data[i].date.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}
          </text>
        ))}
      </svg>
      {hover && (
        <div
          className="absolute pointer-events-none px-2.5 py-1.5 rounded shadow-lg text-[11px]"
          style={{
            background: 'var(--bg-elevated)', border: '1px solid var(--border)',
            left: `${(xFor(hoverIdx) / width) * 100}%`, top: 4,
            transform: `translateX(${hoverIdx < data.length / 2 ? '4px' : 'calc(-100% - 4px)'})`,
          }}
        >
          <div className="font-semibold text-(--text-primary)">{hover.count} incident{hover.count === 1 ? '' : 's'}</div>
          <div className="text-(--text-muted)">{hover.date.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}</div>
        </div>
      )}
    </div>
  )
}

// Category composition donut — categorical color follows the entity
// (top categories by volume), never rank-recolored on filter changes.
// Suits a small, fixed set of categories (incident types); the 4 colors are
// the same tokens already used on the KPI icon badges above (accent /
// medium / low) plus the muted neutral tone, so the donut reads as part of
// the same system instead of introducing a second palette. Deliberately
// drops --status-info (blue) — it read as a jarring outlier against the
// rest of the brand-olive palette — and never uses --status-high /
// --status-critical, which are reserved for real severity/alarm meaning
// elsewhere in the app.
const CATEGORY_SLOTS = ['var(--accent)', 'var(--status-medium)', 'var(--status-low)', 'var(--location-manual)']
const CATEGORY_OTHER = 'var(--text-muted)'

function CategoryDonutChart({ entries, total }) {
  const [hoverKey, setHoverKey] = useState(null)
  const size = 168, stroke = 26, r = (size - stroke) / 2, cx = size / 2, cy = size / 2
  const circumference = 2 * Math.PI * r

  const top = entries.slice(0, 4)
  const otherCount = entries.slice(4).reduce((a, [, c]) => a + c, 0)
  const slices = [
    ...top.map(([name, count], i) => ({ name, count, color: CATEGORY_SLOTS[i] })),
    ...(otherCount > 0 ? [{ name: 'Other', count: otherCount, color: CATEGORY_OTHER }] : []),
  ]

  let offset = 0
  const arcs = slices.map((s) => {
    const frac = total > 0 ? s.count / total : 0
    const dash = frac * circumference
    const gap = 2 // 2px surface gap between adjacent donut segments
    const arc = { ...s, dashArray: `${Math.max(dash - gap, 0)} ${circumference - Math.max(dash - gap, 0)}`, dashOffset: -offset }
    offset += dash
    return arc
  })

  const hovered = slices.find(s => s.name === hoverKey)

  return (
    <div className="flex items-center gap-5 p-4">
      <div className="relative shrink-0" style={{ width: size, height: size }}>
        <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} role="img" aria-label="Incidents by type composition">
          <circle cx={cx} cy={cy} r={r} fill="none" stroke="var(--border-subtle)" strokeWidth={stroke} />
          {arcs.map((a) => (
            <circle
              key={a.name}
              cx={cx} cy={cy} r={r} fill="none"
              stroke={a.color} strokeWidth={stroke}
              strokeDasharray={a.dashArray} strokeDashoffset={a.dashOffset}
              transform={`rotate(-90 ${cx} ${cy})`}
              opacity={hoverKey && hoverKey !== a.name ? 0.4 : 1}
              onPointerEnter={() => setHoverKey(a.name)}
              onPointerLeave={() => setHoverKey(null)}
              style={{ cursor: 'pointer', transition: 'opacity 0.15s' }}
            />
          ))}
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
          <div className="font-mono text-[20px] font-bold text-(--text-primary)">{hovered ? hovered.count : total}</div>
          <div className="text-[10px] text-(--text-muted)">{hovered ? hovered.name : 'Total'}</div>
        </div>
      </div>
      <div className="flex flex-col gap-1.5 min-w-0">
        {slices.map((s) => (
          <div
            key={s.name}
            className="flex items-center gap-2 text-[12px] cursor-pointer"
            onPointerEnter={() => setHoverKey(s.name)}
            onPointerLeave={() => setHoverKey(null)}
            style={{ opacity: hoverKey && hoverKey !== s.name ? 0.5 : 1 }}
          >
            <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ background: s.color }} />
            <span className="text-(--text-secondary) truncate">{s.name}</span>
            <span className="font-mono font-semibold text-(--text-primary) ml-auto">{total > 0 ? Math.round(s.count / total * 100) : 0}%</span>
          </div>
        ))}
      </div>
    </div>
  )
}

// Ranked horizontal bar chart — the form that scales to many categories
// (e.g. up to Rwanda's 30 districts) where a donut would collapse into
// unreadable slivers. One measure, one hue throughout (the system's own
// brand accent): color follows the entity's identity as "incident count,"
// never the entity's rank, so re-sorting or filtering never repaints a bar
// a different color. Bars grow from a shared baseline, value at the tip,
// per-bar hover lifts the bar and shows an exact-value readout.
function DistrictBarChart({ entries, total }) {
  const [hoverKey, setHoverKey] = useState(null)
  const MAX_ROWS = 8
  const top = entries.slice(0, MAX_ROWS)
  const otherCount = entries.slice(MAX_ROWS).reduce((a, [, c]) => a + c, 0)
  const rows = [
    ...top,
    ...(otherCount > 0 ? [[`Other (${entries.length - MAX_ROWS} districts)`, otherCount]] : []),
  ]
  const maxCount = Math.max(1, ...rows.map(([, c]) => c))
  const hovered = rows.find(([name]) => name === hoverKey)

  return (
    <div className="p-4 flex flex-col gap-2.5">
      {rows.map(([name, count]) => {
        const pct = total > 0 ? Math.round(count / total * 100) : 0
        const widthPct = Math.max((count / maxCount) * 100, 3)
        const isHover = hoverKey === name
        return (
          <div
            key={name}
            className="flex items-center gap-2.5 cursor-pointer"
            onPointerEnter={() => setHoverKey(name)}
            onPointerLeave={() => setHoverKey(null)}
          >
            <span className="text-[11px] text-(--text-secondary) w-24 shrink-0 truncate" title={name}>{name}</span>
            <div className="flex-1 h-4 rounded-full bg-(--bg-elevated) overflow-hidden relative">
              <div
                className="h-full rounded-full transition-all"
                style={{
                  width: `${widthPct}%`,
                  background: 'var(--accent)',
                  opacity: isHover ? 1 : 0.85,
                  boxShadow: isHover ? '0 0 0 2px var(--accent-ghost)' : 'none',
                }}
              />
            </div>
            <span className="font-mono text-[12px] font-semibold text-(--text-primary) w-14 text-right shrink-0">
              {count}
            </span>
            <span className="font-mono text-[10px] text-(--text-muted) w-9 text-right shrink-0">{pct}%</span>
          </div>
        )
      })}
      {hovered && (
        <div className="text-[11px] text-(--text-muted) pt-1 border-t border-(--border-subtle)">
          <span className="font-semibold text-(--text-primary)">{hovered[0]}</span>: {hovered[1]} incident{hovered[1] === 1 ? '' : 's'} ({total > 0 ? Math.round(hovered[1] / total * 100) : 0}% of total)
        </div>
      )}
    </div>
  )
}

export default function AdminDashboard() {
  const today = todayStr()
  const [dateFrom, setDateFrom] = useState(monthStartStr())
  const [dateTo,   setDateTo]   = useState(today)
  const [activePreset, setActivePreset] = useState('This Month')
  const [activityQuery, setActivityQuery] = useState('')
  const [loading,  setLoading]  = useState(true)
  const [users,    setUsers]    = useState([])
  const [incidents, setIncidents] = useState([])
  const [activity, setActivity] = useState([])
  const [activityLoading, setActivityLoading] = useState(true)
  const [responseTarget, setResponseTarget] = useState(8)

  useEffect(() => {
    getResponseTimeTarget().then(setResponseTarget).catch(() => {})
  }, [])

  const load = useCallback(() => {
    setLoading(true)
    Promise.all([listUsers(), listIncidents({})])
      .then(([u, i]) => { setUsers(u); setIncidents(i) })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  useEffect(() => { Promise.resolve().then(load) }, [load])

  useEffect(() => {
    Promise.resolve().then(() => setActivityLoading(true))
    listAuditLogs()
      .then((logs) => setActivity(
        [...logs].sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp)).slice(0, 20)
      ))
      .catch(() => setActivity([]))
      .finally(() => setActivityLoading(false))
  }, [])

  // ── derived data ────────────────────────────────────────────────────────────
  const rangedIncidents = incidents.filter(i => inRange(i.call_time ?? i.created_at, dateFrom, dateTo))

  const visibleActivity = useMemo(() => {
    const q = activityQuery.trim().toLowerCase()
    const filtered = q
      ? activity.filter(e =>
          (e.action ?? '').toLowerCase().includes(q) ||
          (e.user_name ?? '').toLowerCase().includes(q) ||
          (ROLE_LABELS[e.user_role] ?? e.user_role ?? '').toLowerCase().includes(q)
        )
      : activity
    return filtered.slice(0, q ? 10 : 5)
  }, [activity, activityQuery])

  const activeUsers  = users.filter(u => u.status === 'ACTIVE')
  const roleBreakdown = groupBy(users, 'role')
  const incByDistrict = groupBy(rangedIncidents, 'district')
  const incByType     = groupBy(rangedIncidents, 'incident_type')

  const dailySeries = useMemo(
    () => buildDailySeries(rangedIncidents, dateFrom, dateTo),
    [rangedIncidents, dateFrom, dateTo]
  )
  const districtEntries = useMemo(
    () => Object.entries(incByDistrict)
      .map(([name, count]) => [name || '(Unknown)', count])
      .sort((a, b) => b[1] - a[1]),
    [incByDistrict]
  )
  const typeEntries = useMemo(
    () => Object.entries(incByType)
      .map(([type, count]) => [INC_TYPE_LABELS[type] ?? type, count])
      .sort((a, b) => b[1] - a[1]),
    [incByType]
  )

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

    const roleRows = Object.entries(roleBreakdown).map(([role, count], i) => `
      <tr style="background:${i % 2 === 1 ? '#f8fafc' : '#fff'}">
        <td style="padding:9px 14px;font-weight:600;color:#1a202c;border-bottom:1px solid #e2e8f0">${ROLE_LABELS[role] ?? role}</td>
        <td style="padding:9px 14px;font-family:monospace;font-weight:700;color:${ACCENT};border-bottom:1px solid #e2e8f0">${count}</td>
        <td style="padding:9px 14px;color:#374151;border-bottom:1px solid #e2e8f0">${users.filter(u => u.role === role && u.status === 'ACTIVE').length}</td>
      </tr>`).join('')

    const districtRows = Object.entries(incByDistrict)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 15)
      .map(([district, count], i) => `
      <tr style="background:${i % 2 === 1 ? '#f8fafc' : '#fff'}">
        <td style="padding:9px 14px;font-weight:600;color:#1a202c;border-bottom:1px solid #e2e8f0">${district || '(Unknown)'}</td>
        <td style="padding:9px 14px;font-family:monospace;font-weight:700;color:${ACCENT};border-bottom:1px solid #e2e8f0">${count}</td>
        <td style="padding:9px 14px;border-bottom:1px solid #e2e8f0">
          <div style="background:#e2e8f0;border-radius:4px;height:8px;width:100%;min-width:60px">
            <div style="background:${ACCENT};border-radius:4px;height:8px;width:${Math.round(count / (rangedIncidents.length || 1) * 100)}%"></div>
          </div>
        </td>
        <td style="padding:9px 14px;font-family:monospace;color:#374151;border-bottom:1px solid #e2e8f0">${Math.round(count / (rangedIncidents.length || 1) * 100)}%</td>
      </tr>`).join('')

    const typeRows = Object.entries(incByType)
      .sort((a, b) => b[1] - a[1])
      .map(([type, count], i) => `
      <tr style="background:${i % 2 === 1 ? '#f8fafc' : '#fff'}">
        <td style="padding:9px 14px;font-weight:600;color:#1a202c;border-bottom:1px solid #e2e8f0">${INC_TYPE_LABELS[type] ?? type}</td>
        <td style="padding:9px 14px;font-family:monospace;font-weight:700;color:${ACCENT};border-bottom:1px solid #e2e8f0">${count}</td>
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

<div style="background:#f0f4f8;border-bottom:3px solid ${ACCENT};padding:11px 32px;display:flex;align-items:center;flex-wrap:wrap;gap:0">
  <div style="font-size:11px;color:#374151;padding-right:16px;border-right:1px solid #cbd5e0;margin-right:16px"><strong style="color:${NAVY}">Period:</strong> ${dateRangeLabel}</div>
  <div style="font-size:11px;color:#374151;padding-right:16px;border-right:1px solid #cbd5e0;margin-right:16px"><strong style="color:${NAVY}">Scope:</strong> Rwanda — All Districts</div>
  <div style="font-size:11px;color:#374151;padding-right:16px;border-right:1px solid #cbd5e0;margin-right:16px"><strong style="color:${NAVY}">Generated:</strong> ${now.toLocaleString('en-GB', { dateStyle: 'long', timeStyle: 'short' })}</div>
  <div style="font-size:11px;color:#374151"><strong style="color:${NAVY}">Prepared by:</strong> ${generatorName} (${generatorRole})</div>
  <div style="margin-left:auto;background:${ACCENT};color:#fff;font-size:10px;font-weight:700;letter-spacing:0.07em;text-transform:uppercase;padding:5px 12px;border-radius:4px">SYSTEM REPORT</div>
</div>

<div style="padding:26px 32px">

  <div style="font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:0.1em;color:${NAVY};border-bottom:2px solid ${ACCENT};padding-bottom:6px;margin-bottom:14px" class="no-break">
    System Overview KPIs — ${dateRangeLabel}
  </div>
  <div style="display:grid;grid-template-columns:repeat(3,1fr);gap:12px;margin-bottom:26px" class="no-break">
    ${[
      { value: rangedIncidents.length, label: 'Total Incidents (Period)', sub: `${resolvedCount} resolved`, color: ACCENT },
      { value: activeUsers.length, label: 'Active Users', sub: `${users.length} total registered`, color: STATUS_LOW },
      { value: Object.keys(incByDistrict).length, label: 'Districts Active', sub: 'With incidents in period', color: STATUS_MEDIUM },
      { value: avgResponse != null ? avgResponse : '—', label: 'Avg Response Time', sub: `Target: < ${responseTarget} min`, color: ACCENT_DIM },
      { value: resolutionRate != null ? resolutionRate + '%' : '—', label: 'Resolution Rate', sub: 'Resolved / total incidents', color: STATUS_LOW },
    ].map(t => `
    <div style="background:${hexToRgba(t.color, 0.10)};border-left:4px solid ${t.color};border-radius:8px;padding:14px">
      <div style="font-size:30px;font-weight:800;font-family:monospace;color:${t.color};line-height:1;margin-bottom:5px">${t.value}</div>
      <div style="font-size:11px;font-weight:600;color:${t.color}">${t.label}</div>
      <div style="font-size:10px;color:${t.color};margin-top:2px;opacity:0.85">${t.sub}</div>
    </div>`).join('')}
  </div>

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

  const datePresets = [
    { label: 'This Month', fn: () => { setDateFrom(monthStartStr()); setDateTo(today) } },
    { label: 'Last 30d',   fn: () => { const d = new Date(); d.setDate(d.getDate() - 30); const y=d.getFullYear(),m=String(d.getMonth()+1).padStart(2,'0'),day=String(d.getDate()).padStart(2,'0'); setDateFrom(`${y}-${m}-${day}`); setDateTo(today) } },
    { label: 'Last 90d',   fn: () => { const d = new Date(); d.setDate(d.getDate() - 90); const y=d.getFullYear(),m=String(d.getMonth()+1).padStart(2,'0'),day=String(d.getDate()).padStart(2,'0'); setDateFrom(`${y}-${m}-${day}`); setDateTo(today) } },
  ]

  // ── render ──────────────────────────────────────────────────────────────────
  return (
    <div className="portal-page flex flex-col gap-5 min-w-[900px]">
      <AdminPageHeader
        title="Dashboard"
        subtitle="Comprehensive overview of the entire RESQ platform — incidents, users, districts."
        eyebrow="Super Admin Portal"
        badge="System Intelligence"
      />

      {dateFrom && dateTo && dateFrom > dateTo && (
        <div className="text-[12px] px-4 py-2.5 rounded" style={{ background: 'rgba(239,68,68,0.1)', color: 'var(--status-critical)', border: '1px solid rgba(239,68,68,0.3)' }}>
          ⚠ "From" date is after "To" date — no results will be shown.
        </div>
      )}

      {loading ? (
        <div className="text-center py-12 text-(--text-muted) text-[13px]">Loading system data…</div>
      ) : (
        <>
          <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-5 gap-3">
            <MetricCard label="Total Incidents" value={rangedIncidents.length} icon={Siren}
              color="var(--accent)" bg="var(--accent-ghost)" sub={`${resolvedCount} resolved`} />
            <MetricCard label="Active Users" value={activeUsers.length} icon={UsersIcon}
              color="var(--accent)" bg="var(--accent-ghost)" sub={`${users.length} total (all time)`} />
            <MetricCard label="Districts Active" value={Object.keys(incByDistrict).length} icon={MapPin}
              color="var(--accent)" bg="var(--accent-ghost)" sub="With incidents in period" />
            <MetricCard label="Avg Response" value={avgResponse != null ? avgResponse : '—'} icon={Clock}
              color="var(--accent)" bg="var(--accent-ghost)" sub={`Target < ${responseTarget} min`} />
            <MetricCard label="Resolution Rate" value={resolutionRate != null ? resolutionRate + '%' : '—'} icon={CheckCircle2}
              color="var(--accent)" bg="var(--accent-ghost)" sub="Resolved / total" />
          </div>

          <div className="flex flex-nowrap items-center gap-2">
            <div className="relative w-56 shrink-0">
              <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-(--text-muted)" />
              <input
                type="text"
                value={activityQuery}
                onChange={e => setActivityQuery(e.target.value)}
                placeholder="Search recent activity…"
                className="dispatcher-input h-8 w-full rounded-full pl-8 pr-3 text-[11px]"
                style={{ borderRadius: 9999 }}
              />
            </div>
            <div className="ml-auto flex flex-nowrap items-center gap-2 shrink-0">
              <input
                type="date"
                style={{ width: 132 }}
                className="dispatcher-input h-8 rounded-full px-3 text-[11px] shrink-0"
                value={dateFrom}
                max={dateTo || today}
                onChange={e => { setDateFrom(e.target.value); setActivePreset(null) }}
              />
              <input
                type="date"
                style={{ width: 132 }}
                className="dispatcher-input h-8 rounded-full px-3 text-[11px] shrink-0"
                value={dateTo}
                min={dateFrom}
                max={today}
                onChange={e => { setDateTo(e.target.value); setActivePreset(null) }}
              />
              <FilterDropdown
                label="Date range"
                value={activePreset}
                options={datePresets}
                getLabel={(o) => o.label}
                getValue={(o) => o.label}
                align="right"
                onChange={(v) => {
                  const preset = datePresets.find((d) => d.label === v)
                  preset.fn()
                  setActivePreset(v)
                }}
              />
              <button
                type="button"
                onClick={exportPDF}
                className="h-9 text-[12px] px-3 flex items-center gap-2 rounded-lg shrink-0 font-semibold"
                style={{ background: 'var(--accent)', color: 'var(--text-on-accent)', border: 'none' }}
              >
                <Download size={13} />
                Export
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">
            <div className="dispatcher-surface overflow-hidden xl:col-span-2">
              <div className="px-4 py-3 border-b border-(--border-subtle) flex items-center gap-2">
                <FileBarChart size={14} style={{ color: 'var(--accent)' }} />
                <span className="font-semibold text-[13px]">Incidents per Day</span>
                <span className="ml-auto text-[11px] text-(--text-muted)">{dateFrom} → {dateTo}</span>
              </div>
              <div className="p-4">
                {rangedIncidents.length === 0 ? (
                  <p className="text-[12px] text-(--text-muted) text-center py-8 m-0">No incidents in selected period</p>
                ) : (
                  <IncidentTrendChart data={dailySeries} />
                )}
              </div>
            </div>

            <div className="dispatcher-surface overflow-hidden flex flex-col">
              <div className="px-4 py-3 border-b border-(--border-subtle) flex items-center gap-2">
                <FileBarChart size={14} style={{ color: 'var(--accent)' }} />
                <span className="font-semibold text-[13px]">Recent System Activity</span>
                <Link to="/admin/audit" className="text-[11px] font-semibold text-(--accent) ml-auto no-underline hover:underline">
                  View Full Audit →
                </Link>
              </div>
              <div className="flex-1 overflow-y-auto">
                {activityLoading && (
                  <p className="text-[12px] text-(--text-muted) m-0 py-6 text-center">Loading recent activity…</p>
                )}
                {!activityLoading && activity.length === 0 && (
                  <p className="text-[12px] text-(--text-muted) m-0 py-6 text-center">No audit activity recorded yet.</p>
                )}
                {!activityLoading && activity.length > 0 && visibleActivity.length === 0 && (
                  <p className="text-[12px] text-(--text-muted) m-0 py-6 text-center">No activity matches "{activityQuery}".</p>
                )}
                {visibleActivity.map((e) => {
                  const Icon = logActionIcon(e.action)
                  return (
                    <div key={e.log_id} className="flex items-start gap-2.5 px-4 py-2.5 border-b border-(--border-subtle) last:border-0">
                      <Icon size={15} className="shrink-0 mt-0.5" style={{ color: logStatusColor(e.status) }} />
                      <div className="flex-1 min-w-0">
                        <div className="text-[12.5px] text-(--text-primary) font-medium truncate">{e.action}</div>
                        <div className="text-[11px] text-(--text-secondary) mt-0.5 truncate">{e.user_name ?? 'System'} · {ROLE_LABELS[e.user_role] ?? e.user_role ?? ''}</div>
                      </div>
                      <span className="font-mono text-[10px] text-(--text-muted) shrink-0 pt-0.5">
                        {e.timestamp ? new Date(e.timestamp).toLocaleString('en-GB', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' }) : '—'}
                      </span>
                    </div>
                  )
                })}
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <div className="dispatcher-surface overflow-hidden">
              <div className="px-4 py-3 border-b border-(--border-subtle) flex items-center gap-2">
                <FileBarChart size={14} style={{ color: 'var(--accent)' }} />
                <span className="font-semibold text-[13px]">Incidents by District</span>
                <span className="ml-auto text-[11px] text-(--text-muted)">{rangedIncidents.length} total</span>
              </div>
              {rangedIncidents.length > 0 ? (
                <DistrictBarChart entries={districtEntries} total={rangedIncidents.length} />
              ) : (
                <p className="text-[12px] text-(--text-muted) text-center py-8 m-0">No incidents in selected period</p>
              )}
            </div>

            {Object.keys(incByType).length > 0 && (
              <div className="dispatcher-surface overflow-hidden">
                <div className="px-4 py-3 border-b border-(--border-subtle) flex items-center gap-2">
                  <FileBarChart size={14} style={{ color: 'var(--accent)' }} />
                  <span className="font-semibold text-[13px]">Incidents by Type</span>
                </div>
                <CategoryDonutChart entries={typeEntries} total={rangedIncidents.length} />
              </div>
            )}
          </div>

          <div className="dispatcher-surface overflow-hidden">
            <div className="px-4 py-3 border-b border-(--border-subtle) flex items-center gap-2">
              <FileBarChart size={14} style={{ color: 'var(--accent)' }} />
              <span className="font-semibold text-[13px]">Users by Role</span>
            </div>
            <table className="w-full text-[12px]">
              <thead>
                <tr className="text-(--text-muted) text-[10px] uppercase border-b border-(--border-subtle)">
                  <th className="text-left px-4 py-2 w-10">#</th>
                  <th className="text-left px-4 py-2">Role</th>
                  <th className="px-4 py-2 text-center">Total</th>
                  <th className="px-4 py-2 text-center">Active</th>
                </tr>
              </thead>
              <tbody>
                {Object.entries(roleBreakdown).map(([role, count], i) => (
                  <tr key={role} className="border-b border-(--border-subtle)">
                    <td className="px-4 py-2.5 font-mono text-(--text-muted)">{i + 1}</td>
                    <td className="px-4 py-2.5 font-medium">{ROLE_LABELS[role] ?? role}</td>
                    <td className="px-4 py-2.5 font-mono font-bold text-center" style={{ color: 'var(--accent)' }}>{count}</td>
                    <td className="px-4 py-2.5 font-mono text-center text-(--text-secondary)">
                      {users.filter(u => u.role === role && u.status === 'ACTIVE').length}
                    </td>
                  </tr>
                ))}
                {Object.keys(roleBreakdown).length === 0 && (
                  <tr><td colSpan={4} className="px-4 py-6 text-center text-(--text-muted)">No data</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  )
}

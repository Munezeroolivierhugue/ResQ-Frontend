import { useState, useEffect } from 'react'
import {
  AlertCircle,
  Clock,
  MapPin,
  CheckCircle,
  ChevronsUp,
  Car,
} from 'lucide-react'
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ReferenceLine,
  ResponsiveContainer,
} from 'recharts'
import { useThemeStore } from '../../store/themeStore'
import AdminStatCard from '../../components/admin/AdminStatCard'
import SectionTitle from '../../components/dispatcher/SectionTitle'
import StatusBadge from '../../components/dispatcher/StatusBadge'
import DCPageHeader from '../../components/district-commander/DCPageHeader'
import { listIncidents } from '../../api/incidents'
import { listVehicles } from '../../api/vehicles'
import { listActiveShifts } from '../../api/shifts'
import { getCurrentUser } from '../../utils/authSession'
import { getResponseTimeTarget } from '../../api/admin'

const ACCENT = { light: '#879D1F', dark: '#9BB826' }

function currentMonthRange() {
  const now = new Date()
  return new Date(now.getFullYear(), now.getMonth(), 1)
}

// Real monthly aggregation over the last 12 months, replacing the old
// DC_RESPONSE_TIME_TREND/DC_INCIDENT_VOLUME_TREND mocks (fixed fake numbers
// for 12 hardcoded months regardless of what actually happened).
function buildMonthlyTrend(incidents) {
  const months = []
  const now = new Date()
  for (let i = 11; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1)
    months.push({ key: `${d.getFullYear()}-${d.getMonth()}`, label: d.toLocaleDateString('en-GB', { month: 'short' }) })
  }
  const byKey = new Map(months.map((m) => [m.key, { count: 0, rtSum: 0, rtCount: 0 }]))
  incidents.forEach((i) => {
    if (!i.call_time) return
    const d = new Date(i.call_time)
    const key = `${d.getFullYear()}-${d.getMonth()}`
    const bucket = byKey.get(key)
    if (!bucket) return
    bucket.count += 1
    if (i.response_time_minutes != null && i.response_time_minutes > 0) {
      bucket.rtSum += i.response_time_minutes
      bucket.rtCount += 1
    }
  })
  return months.map((m) => {
    const b = byKey.get(m.key)
    return {
      month: m.label,
      count: b.count,
      minutes: b.rtCount ? Number((b.rtSum / b.rtCount).toFixed(1)) : 0,
    }
  })
}

function coverageCategory(vehicleType) {
  const t = (vehicleType ?? '').toUpperCase()
  if (t.includes('AMBULANCE')) return 'Ambulance'
  if (t.includes('FIRE') || t.includes('DISASTER')) return 'Fire & Rescue'
  if (t.includes('POLICE') || t.includes('TACTICAL')) return 'Police'
  return 'Other'
}

export default function DCDashboard() {
  const { theme } = useThemeStore()
  const lineColor = theme === 'dark' ? ACCENT.dark : ACCENT.light

  const districtId = getCurrentUser()?.district_id

  const [loading, setLoading] = useState(true)
  const [kpis, setKpis] = useState({ incidents: '—', responseTime: '—', units: '—', coverage: '—', resolutionRate: '—', escalations: '—' })
  const [trend, setTrend] = useState([])
  const [shifts, setShifts] = useState([])
  const [error, setError] = useState(null)
  const [slaTargetMinutes, setSlaTargetMinutes] = useState(12)

  useEffect(() => {
    getResponseTimeTarget().then(setSlaTargetMinutes).catch(() => {})
  }, [])

  useEffect(() => {
    if (!districtId) { Promise.resolve().then(() => setLoading(false)); return }
    const params = { districtId }
    Promise.all([
      listIncidents(params),
      listVehicles(params),
      listActiveShifts(districtId),
    ])
      .then(([incidents, vehicles, activeShifts]) => {
        const monthStart = currentMonthRange()
        const monthIncidents = incidents.filter((i) => i.call_time && new Date(i.call_time) >= monthStart)

        const rtValues = monthIncidents
          .map((i) => i.response_time_minutes)
          .filter((v) => v != null && v > 0)
        const avgRt = rtValues.length
          ? (rtValues.reduce((a, b) => a + b, 0) / rtValues.length).toFixed(1)
          : '—'

        const activeUnits = vehicles.filter(
          (v) => v.status !== 'offline' && v.status !== 'out_of_service'
        ).length

        // Real fleet-availability ratio across vehicle categories, replacing
        // the hardcoded fake "91%" — same real metric used on the Ops
        // Manager's Resource Reallocation page.
        const byCategory = vehicles.reduce((acc, v) => {
          const cat = coverageCategory(v.vehicle_type)
          if (!acc[cat]) acc[cat] = { total: 0, available: 0 }
          acc[cat].total += 1
          if (v.status === 'available') acc[cat].available += 1
          return acc
        }, {})
        const categories = Object.values(byCategory)
        const coveragePct = categories.length
          ? Math.round(100 * categories.reduce((s, c) => s + c.available / c.total, 0) / categories.length)
          : null

        const closedThisMonth = monthIncidents.filter((i) => i.status === 'CLOSED').length
        const resolutionRate = monthIncidents.length
          ? Math.round((closedThisMonth / monthIncidents.length) * 100)
          : null

        const escalationsThisMonth = monthIncidents.filter((i) => i.escalated).length

        setKpis({
          incidents: String(monthIncidents.length),
          responseTime: avgRt === '—' ? '—' : `${avgRt}m`,
          units: String(activeUnits || vehicles.length),
          coverage: coveragePct != null ? `${coveragePct}%` : 'N/A',
          resolutionRate: resolutionRate != null ? `${resolutionRate}%` : 'N/A',
          escalations: String(escalationsThisMonth),
        })

        setTrend(buildMonthlyTrend(incidents))

        // Shifts with handover notes actually written — the previous version
        // queried a Report entity with reportType='SHIFT' that nothing in
        // the app ever creates (Ops Managers submit via Shift.handoverNotes,
        // a completely different table), so this table was always empty.
        const withNotes = activeShifts
          .filter((s) => s.handover_notes)
          .sort((a, b) => new Date(b.shift_start) - new Date(a.shift_start))
        setShifts(withNotes.slice(0, 5))
      })
      .catch(() => setError('Failed to load dashboard data'))
      .finally(() => setLoading(false))
  }, [districtId])

  return (
    <div className="portal-page flex flex-col gap-6">
      <DCPageHeader title="District Command" eyebrow="Command overview" subtitle="Performance overview" />

      {error && (
        <div className="text-[12px] px-3 py-2 rounded" style={{ background: 'var(--status-critical-bg)', color: 'var(--status-critical)' }}>
          {error}
        </div>
      )}

      <div className="portal-grid-kpi">
        <AdminStatCard icon={AlertCircle} label="Total Incidents (This Month)" value={loading ? '—' : kpis.incidents} />
        <AdminStatCard icon={Clock} label="Avg Response Time" value={loading ? '—' : kpis.responseTime} sub={`Target: ${slaTargetMinutes} min`} />
        <AdminStatCard icon={MapPin} label="Fleet Coverage" value={loading ? '—' : kpis.coverage} />
        <AdminStatCard icon={CheckCircle} label="Resolution Rate" value={loading ? '—' : kpis.resolutionRate} />
        <AdminStatCard icon={ChevronsUp} label="Escalations (This Month)" value={loading ? '—' : kpis.escalations} />
        <AdminStatCard icon={Car} label="Units Operational" value={loading ? '—' : kpis.units} />
      </div>

      <div className="portal-grid-2">
        <div className="dispatcher-surface p-4 flex-1 min-w-0">
          <h2 className="text-[13px] font-bold text-(--text-primary) m-0 mb-3">Response Time — 12 Months</h2>
          <div style={{ height: 200, width: '100%' }}>
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={trend} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
                <CartesianGrid stroke="var(--border-subtle)" strokeDasharray="3 3" />
                <XAxis dataKey="month" tick={{ fontSize: 10, fill: 'var(--text-muted)' }} />
                <YAxis domain={[0, 'auto']} tick={{ fontSize: 10, fill: 'var(--text-muted)' }} />
                <Tooltip contentStyle={{ background: 'var(--bg-surface)', border: '1px solid var(--border)' }} />
                <ReferenceLine y={12} stroke="var(--status-medium)" strokeDasharray="4 4" />
                <Line type="monotone" dataKey="minutes" stroke={lineColor} strokeWidth={2} dot={{ r: 3, fill: lineColor }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
        <div className="dispatcher-surface p-4 flex-1 min-w-0">
          <h2 className="text-[13px] font-bold text-(--text-primary) m-0 mb-3">Incident Volume — 12 Months</h2>
          <div style={{ height: 200, width: '100%' }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={trend} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
                <CartesianGrid stroke="var(--border-subtle)" strokeDasharray="3 3" />
                <XAxis dataKey="month" tick={{ fontSize: 10, fill: 'var(--text-muted)' }} />
                <YAxis domain={[0, 'auto']} tick={{ fontSize: 10, fill: 'var(--text-muted)' }} />
                <Tooltip contentStyle={{ background: 'var(--bg-surface)', border: '1px solid var(--border)' }} />
                <Bar dataKey="count" fill={lineColor} radius={[2, 2, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      <div className="dispatcher-surface p-4 table-scroll">
        <div className="flex flex-wrap items-center justify-between gap-2 mb-4">
          <SectionTitle title="Recent Shift Handovers" className="mb-0" />
        </div>
        <table className="w-full min-w-[640px] text-left border-collapse text-[12px]">
          <thead>
            <tr className="text-[12px] font-medium text-(--text-secondary) border-b border-(--border-subtle)">
              <th className="py-2 pr-3 font-bold">Officer</th>
              <th className="py-2 pr-3 font-bold text-center">Role</th>
              <th className="py-2 pr-3 font-bold text-center">Shift Start</th>
              <th className="py-2 pr-3 font-bold text-center">Status</th>
              <th className="py-2 font-bold text-center">Notes</th>
            </tr>
          </thead>
          <tbody>
            {loading && (
              <tr><td colSpan={5} className="py-6 text-center text-[13px] text-(--text-muted)">Loading…</td></tr>
            )}
            {!loading && shifts.length === 0 && (
              <tr><td colSpan={5} className="py-6 text-center text-[13px] text-(--text-muted)">No handover notes submitted yet.</td></tr>
            )}
            {!loading && shifts.map((s) => (
              <tr key={s.shift_id} className="border-b border-(--border-subtle) last:border-0">
                <td className="py-3 pr-3 font-medium text-[13px]">{s.user_name ?? '—'}</td>
                <td className="py-3 pr-3 text-center">{s.role_on_shift ?? '—'}</td>
                <td className="py-3 pr-3 text-center">
                  {s.shift_start ? new Date(s.shift_start).toLocaleString('en-GB', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' }) : '—'}
                </td>
                <td className="py-3 pr-3 text-center">
                  <StatusBadge label={s.status ?? 'ACTIVE'} variant={s.status === 'ACTIVE' ? 'resolved' : 'handover'} />
                </td>
                <td className="py-3 text-center max-w-[320px] truncate" title={s.handover_notes}>
                  {s.handover_notes}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

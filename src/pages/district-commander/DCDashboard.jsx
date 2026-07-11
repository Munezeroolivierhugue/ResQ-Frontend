import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import {
  AlertCircle,
  Clock,
  MapPin,
  CheckCircle,
  PhoneMissed,
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
import MetricCard from '../../components/dispatcher/MetricCard'
import SectionTitle from '../../components/dispatcher/SectionTitle'
import StatusBadge from '../../components/dispatcher/StatusBadge'
import DCPageHeader from '../../components/district-commander/DCPageHeader'
import {
  DC_RESPONSE_TIME_TREND,
  DC_INCIDENT_VOLUME_TREND,
  getReportStatusVariant,
} from '../../data/mockDistrictCommanderData'
import { listIncidents } from '../../api/incidents'
import { listVehicles } from '../../api/vehicles'
import { listReports } from '../../api/reporting'

const ACCENT = { light: '#879D1F', dark: '#9BB826' }

function currentMonthRange() {
  const now = new Date()
  return new Date(now.getFullYear(), now.getMonth(), 1)
}

export default function DCDashboard() {
  const { theme } = useThemeStore()
  const lineColor = theme === 'dark' ? ACCENT.dark : ACCENT.light

  const districtId = sessionStorage.getItem('resq-district-id') || undefined

  const [loading, setLoading] = useState(true)
  const [kpis, setKpis] = useState({ incidents: '—', responseTime: '—', units: '—' })
  const [reports, setReports] = useState([])
  const [error, setError] = useState(null)

  useEffect(() => {
    const params = districtId ? { districtId } : {}
    Promise.all([
      listIncidents(params),
      listVehicles(params),
      listReports('SHIFT', districtId),
    ])
      .then(([incidents, vehicles, shiftReports]) => {
        const monthStart = currentMonthRange()
        const monthIncidents = incidents.filter((i) => {
          if (!i.call_time) return false
          return new Date(i.call_time) >= monthStart
        })

        const rtValues = monthIncidents
          .map((i) => i.response_time_minutes)
          .filter((v) => v != null && v > 0)
        const avgRt = rtValues.length
          ? (rtValues.reduce((a, b) => a + b, 0) / rtValues.length).toFixed(1)
          : '—'

        const activeUnits = vehicles.filter(
          (v) => v.status !== 'offline' && v.status !== 'out_of_service'
        ).length

        setKpis({
          incidents: String(monthIncidents.length),
          responseTime: avgRt === '—' ? '—' : `${avgRt}m`,
          units: String(activeUnits || vehicles.length),
        })

        const sorted = [...shiftReports].sort((a, b) =>
          (b.generated_at ?? b.submitted_at ?? '').localeCompare(
            a.generated_at ?? a.submitted_at ?? ''
          )
        )
        setReports(sorted.slice(0, 5))
      })
      .catch(() => setError('Failed to load dashboard data'))
      .finally(() => setLoading(false))
  }, [])

  return (
    <div className="portal-page flex flex-col gap-6">
      <DCPageHeader title="District Command" eyebrow="Command overview" subtitle="Performance overview" />

      {error && (
        <div className="text-[12px] px-3 py-2 rounded" style={{ background: 'var(--status-critical-bg)', color: 'var(--status-critical)' }}>
          {error}
        </div>
      )}

      <div className="portal-grid-kpi">
        <MetricCard icon={AlertCircle} label="Total Incidents (This Month)" value={loading ? '—' : kpis.incidents} hintTone="warning" />
        <MetricCard icon={Clock} label="Avg Response Time" value={loading ? '—' : kpis.responseTime} hint="Target: 8 min" hintTone="positive" />
        <MetricCard icon={MapPin} label="Coverage Score" value="91%" hint="Mock data" hintTone="positive" />
        <MetricCard icon={CheckCircle} label="Resolution Rate" value="94%" hint="Mock data" hintTone="positive" />
        <MetricCard icon={PhoneMissed} label="Missed Calls Resolved" value="87%" hintTone="warning" />
        <MetricCard icon={Car} label="Units Operational" value={loading ? '—' : kpis.units} hintTone="neutral" />
      </div>

      <div className="portal-grid-2">
        <div className="dispatcher-surface p-4 flex-1 min-w-0">
          <h2 className="text-[13px] font-bold text-(--text-primary) m-0 mb-3">Response Time — 12 Months</h2>
          <div style={{ height: 200, width: '100%' }}>
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={DC_RESPONSE_TIME_TREND} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
                <CartesianGrid stroke="var(--border-subtle)" strokeDasharray="3 3" />
                <XAxis dataKey="month" tick={{ fontSize: 10, fill: 'var(--text-muted)' }} />
                <YAxis domain={[0, 15]} tick={{ fontSize: 10, fill: 'var(--text-muted)' }} />
                <Tooltip contentStyle={{ background: 'var(--bg-surface)', border: '1px solid var(--border)' }} />
                <ReferenceLine y={8} stroke="var(--status-medium)" strokeDasharray="4 4" />
                <Line type="monotone" dataKey="minutes" stroke={lineColor} strokeWidth={2} dot={{ r: 3, fill: lineColor }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
        <div className="dispatcher-surface p-4 flex-1 min-w-0">
          <h2 className="text-[13px] font-bold text-(--text-primary) m-0 mb-3">Incident Volume — 12 Months</h2>
          <div style={{ height: 200, width: '100%' }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={DC_INCIDENT_VOLUME_TREND} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
                <CartesianGrid stroke="var(--border-subtle)" strokeDasharray="3 3" />
                <XAxis dataKey="month" tick={{ fontSize: 10, fill: 'var(--text-muted)' }} />
                <YAxis domain={[0, 400]} tick={{ fontSize: 10, fill: 'var(--text-muted)' }} />
                <Tooltip contentStyle={{ background: 'var(--bg-surface)', border: '1px solid var(--border)' }} />
                <Bar dataKey="count" fill={lineColor} radius={[2, 2, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      <div className="dispatcher-surface p-4 table-scroll">
        <div className="flex flex-wrap items-center justify-between gap-2 mb-4">
          <SectionTitle title="Recent Shift Reports" className="mb-0" />
          <Link to="/district-commander/shift-reports" className="text-[12px] font-semibold text-(--accent) no-underline hover:underline">
            View All →
          </Link>
        </div>
        <table className="w-full min-w-[720px] text-left border-collapse text-[12px]">
          <thead>
            <tr className="text-[10px] uppercase tracking-wide text-(--text-muted) border-b border-(--border-subtle)">
              <th className="py-2 pr-3 font-semibold">Report ID</th>
              <th className="py-2 pr-3 font-semibold">Submitted By</th>
              <th className="py-2 pr-3 font-semibold">Period</th>
              <th className="py-2 pr-3 font-semibold">Submitted</th>
              <th className="py-2 pr-3 font-semibold">Incidents</th>
              <th className="py-2 pr-3 font-semibold">Status</th>
              <th className="py-2 font-semibold">Action</th>
            </tr>
          </thead>
          <tbody>
            {loading && (
              <tr><td colSpan={7} className="py-6 text-center text-[13px] text-(--text-muted)">Loading reports…</td></tr>
            )}
            {!loading && reports.length === 0 && (
              <tr><td colSpan={7} className="py-6 text-center text-[13px] text-(--text-muted)">No shift reports found.</td></tr>
            )}
            {!loading && reports.map((row) => (
              <tr key={row.report_id} className="border-b border-(--border-subtle) last:border-0">
                <td className="py-3 pr-3 font-mono font-bold text-(--accent)">{row.report_id?.slice(0, 8) ?? '—'}</td>
                <td className="py-3 pr-3 text-(--text-primary)">{row.generated_by_name ?? '—'}</td>
                <td className="py-3 pr-3 font-mono text-(--text-secondary)">
                  {row.period_start ? `${row.period_start} – ${row.period_end ?? ''}` : '—'}
                </td>
                <td className="py-3 pr-3 text-(--text-secondary)">
                  {row.generated_at ? new Date(row.generated_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }) : '—'}
                </td>
                <td className="py-3 pr-3 font-mono">{row.total_incidents ?? '—'}</td>
                <td className="py-3 pr-3">
                  <StatusBadge label={row.status ?? 'PENDING'} variant={getReportStatusVariant(row.status)} />
                </td>
                <td className="py-3">
                  <Link
                    to="/district-commander/shift-reports"
                    state={{ reportId: row.report_id }}
                    className={
                      row.status === 'PENDING'
                        ? 'dispatcher-btn-primary no-underline text-[11px] py-1.5 px-2.5 inline-flex'
                        : 'dispatcher-btn-ghost no-underline text-[11px] py-1.5 px-2.5 inline-flex'
                    }
                  >
                    {row.status === 'PENDING' ? 'Review' : 'View'}
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

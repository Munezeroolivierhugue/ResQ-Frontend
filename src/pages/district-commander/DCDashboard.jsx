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
  DC_DASHBOARD_REPORTS,
  getReportStatusVariant,
} from '../../data/mockDistrictCommanderData'

const ACCENT = { light: '#879D1F', dark: '#9BB826' }

export default function DCDashboard() {
  const { theme } = useThemeStore()
  const lineColor = theme === 'dark' ? ACCENT.dark : ACCENT.light

  return (
    <div className="portal-page flex flex-col gap-6">
      <DCPageHeader title="District Command" subtitle="Performance overview · May 2026" />

      <div className="portal-grid-kpi">
        <MetricCard icon={AlertCircle} label="Total Incidents (This Month)" value="312" hint="↑ 8% vs last month" hintTone="warning" />
        <MetricCard icon={Clock} label="Avg Response Time" value="7.4m" hint="Target: 8 min ✓" hintTone="positive" />
        <MetricCard icon={MapPin} label="Coverage Score" value="91%" hint="↑ 2% this month" hintTone="positive" />
        <MetricCard icon={CheckCircle} label="Resolution Rate" value="94%" hint="3% above district target" hintTone="positive" />
        <MetricCard icon={PhoneMissed} label="Missed Calls Resolved" value="87%" hint="↓ 4% — needs attention" hintTone="warning" />
        <MetricCard icon={Car} label="Units Assigned" value="18" hint="2 units in maintenance" hintTone="neutral" />
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
              <th className="py-2 pr-3 font-semibold">Operations Manager</th>
              <th className="py-2 pr-3 font-semibold">Shift</th>
              <th className="py-2 pr-3 font-semibold">Submitted</th>
              <th className="py-2 pr-3 font-semibold">Incidents</th>
              <th className="py-2 pr-3 font-semibold">Status</th>
              <th className="py-2 font-semibold">Action</th>
            </tr>
          </thead>
          <tbody>
            {DC_DASHBOARD_REPORTS.map((row) => (
              <tr key={row.id} className="border-b border-(--border-subtle) last:border-0">
                <td className="py-3 pr-3 font-mono font-bold text-(--accent)">{row.id}</td>
                <td className="py-3 pr-3 text-(--text-primary)">{row.om}</td>
                <td className="py-3 pr-3 font-mono text-(--text-secondary)">{row.shift}</td>
                <td className="py-3 pr-3 text-(--text-secondary)">{row.submitted}</td>
                <td className="py-3 pr-3 font-mono">{row.incidents}</td>
                <td className="py-3 pr-3">
                  <StatusBadge label={row.status} variant={getReportStatusVariant(row.status)} />
                </td>
                <td className="py-3">
                  <Link
                    to="/district-commander/shift-reports"
                    state={{ reportId: row.id }}
                    className={
                      row.status === 'PENDING REVIEW'
                        ? 'dispatcher-btn-primary no-underline text-[11px] py-1.5 px-2.5 inline-flex'
                        : 'dispatcher-btn-ghost no-underline text-[11px] py-1.5 px-2.5 inline-flex'
                    }
                  >
                    {row.status === 'PENDING REVIEW' ? 'Review' : 'View'}
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

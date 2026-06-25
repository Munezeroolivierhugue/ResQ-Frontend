import { Link } from 'react-router-dom'
import { Users, Monitor, Server, ShieldAlert, RefreshCw, Play } from 'lucide-react'
import MetricCard from '../../components/dispatcher/MetricCard'
import SectionTitle from '../../components/dispatcher/SectionTitle'
import StatusBadge from '../../components/dispatcher/StatusBadge'
import AdminPageHeader from '../../components/admin/AdminPageHeader'
import {
  ADMIN_SYSTEM_STATUS,
  ADMIN_INTEGRATIONS_HEALTH,
  ADMIN_ACTIVITY_LOG,
  ADMIN_SCHEDULED_JOBS,
  logLevelColor,
} from '../../data/mockAdminData'

function jobVariant(status) {
  if (status === 'COMPLETED') return 'resolved'
  if (status === 'FAILED') return 'critical'
  if (status === 'RUNNING') return 'handover'
  return 'neutral'
}

export default function AdminDashboard() {
  const dateStr = new Date().toLocaleDateString('en-GB', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  })
  const timeStr = new Date().toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })

  return (
    <div className="portal-page flex flex-col gap-5 min-w-[1024px]">
      <AdminPageHeader title="System Health Overview" subtitle={`RESQ platform status · ${dateStr} · ${timeStr}`} />

      <div className="dispatcher-surface p-4">
        <div className="font-mono text-[10px] uppercase text-(--text-muted) mb-3">SYSTEM STATUS</div>
        <div className="flex flex-wrap gap-4">
          {ADMIN_SYSTEM_STATUS.map((s) => (
            <div
              key={s.name}
              className="flex-1 min-w-[140px] rounded-lg p-3 text-center"
              style={{ background: 'var(--bg-elevated)', borderTop: `3px solid ${s.color}` }}
            >
              <span
                className={`inline-block w-2 h-2 rounded-full ${s.pulse ? 'animate-pulse' : ''}`}
                style={{ background: s.color }}
              />
              <div className="font-semibold text-[13px] mt-1.5">{s.name}</div>
              <div className="font-mono text-[11px] mt-0.5" style={{ color: s.color }}>{s.status}</div>
            </div>
          ))}
        </div>
      </div>

      <div className="portal-grid-4">
        <MetricCard icon={Users} label="Total Active Users" value="47" hint="Across all roles" hintTone="neutral" />
        <MetricCard icon={Monitor} label="Active Sessions Now" value="12" hint="3 dispatchers · 2 OMs · 7 others" hintTone="neutral" />
        <MetricCard icon={Server} label="System Uptime (30 days)" value="99.8%" hint="↑ above SLA target" hintTone="positive" />
        <MetricCard
          icon={ShieldAlert}
          label="Open Security Alerts"
          value="2"
          hint="1 failed login cluster"
          hintTone="warning"
          className="dispatcher-metric-card--alert"
        />
      </div>

      <div className="flex flex-col xl:flex-row gap-4">
        <div className="flex flex-col gap-3 min-w-0 xl:flex-[1.2]">
          <SectionTitle
            title="Integration Health"
            badge={
              <button type="button" className="dispatcher-btn-ghost text-[11px] h-8 px-2 ml-auto inline-flex items-center gap-1">
                <RefreshCw size={12} />
                Test All
              </button>
            }
          />
          {ADMIN_INTEGRATIONS_HEALTH.map((int) => (
            <div key={int.name} className="dispatcher-surface p-3" style={{ borderLeft: `3px solid ${int.border}` }}>
              <div className="flex justify-between gap-2 mb-1">
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full" style={{ background: int.border }} />
                  <span className="font-semibold text-[13px]">{int.name}</span>
                </div>
                <StatusBadge label={int.status} variant={int.status === 'OPERATIONAL' ? 'resolved' : 'handover'} />
              </div>
              <div className="font-mono text-[11px] text-(--text-muted)">
                Last sync: {int.last_sync} · Response: {int.ms}
              </div>
              {int.error && <p className="text-[11px] m-0 mt-1" style={{ color: 'var(--status-medium)' }}>{int.error}</p>}
              <button type="button" className="dispatcher-btn-ghost text-[11px] h-7 mt-2 w-full">Test Connection</button>
            </div>
          ))}
        </div>

        <div className="flex flex-col gap-3 min-w-0 xl:flex-[1.4]">
          <SectionTitle
            title="Recent System Activity"
            badge={
              <Link to="/admin/audit" className="text-[12px] font-semibold text-(--accent) ml-auto no-underline hover:underline">
                View Full Audit →
              </Link>
            }
          />
          <div className="dispatcher-surface p-3 max-h-[380px] overflow-y-auto">
            {ADMIN_ACTIVITY_LOG.map((e) => (
              <div key={e.time + e.action} className="flex gap-3 py-2 border-b border-(--border-subtle) last:border-0">
                <span className="w-2 h-2 rounded-full shrink-0 mt-1.5" style={{ background: logLevelColor(e.status) }} />
                <div className="flex-1 min-w-0">
                  <div className="text-[13px] text-(--text-primary)">{e.action}</div>
                  <div className="text-[11px] text-(--text-secondary) mt-0.5">{e.user}</div>
                </div>
                <span className="font-mono text-[11px] text-(--text-muted) shrink-0">{e.time}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="flex flex-col gap-3 min-w-0 xl:flex-1">
          <SectionTitle
            title="Scheduled Jobs"
            badge={
              <Link to="/admin/settings/backup" className="text-[12px] font-semibold text-(--accent) ml-auto no-underline hover:underline">
                All Jobs →
              </Link>
            }
          />
          {ADMIN_SCHEDULED_JOBS.map((job) => (
            <div key={job.name} className="dispatcher-surface p-3">
              <div className="flex justify-between gap-2 mb-1">
                <span className="font-medium text-[13px]">{job.name}</span>
                <StatusBadge label={job.status} variant={jobVariant(job.status)} />
              </div>
              <div className="font-mono text-[11px] text-(--text-secondary)">Last run: {job.last}</div>
              <div className="font-mono text-[11px] text-(--text-muted)">Next run: {job.next}</div>
              <button type="button" className="dispatcher-btn-ghost text-[11px] h-7 mt-2 w-full inline-flex items-center justify-center gap-1">
                <Play size={12} />
                Run Now
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

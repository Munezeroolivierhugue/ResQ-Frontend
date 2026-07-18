import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { FileBarChart, AlertCircle, Cpu, CalendarCheck, Server, RefreshCw } from 'lucide-react'
import MetricCard from '../../components/dispatcher/MetricCard'
import SectionTitle from '../../components/dispatcher/SectionTitle'
import StatusBadge from '../../components/dispatcher/StatusBadge'
import AnalystPageHeader from '../../components/analyst/AnalystPageHeader'
import { listDataQuality, runDataQualityCheck, listReports, listModels } from '../../api/reporting'
import { sourceStatusVariant } from '../../data/mockAnalystData'

const CHECKED_SOURCES = ['Incidents', 'Vehicles', 'Dispatches']

function statusOf(record) {
  const score = record.overall_score ?? 0
  if (score >= 90) return 'OK'
  if (score >= 70) return 'DEGRADED'
  return 'ERROR'
}

function borderOf(status) {
  if (status === 'OK') return 'var(--status-low)'
  if (status === 'DEGRADED') return 'var(--status-medium)'
  return 'var(--status-critical)'
}

function timeAgo(iso) {
  if (!iso) return '—'
  const diffMin = Math.floor((Date.now() - new Date(iso).getTime()) / 60000)
  if (diffMin < 1) return 'Just now'
  if (diffMin < 60) return `${diffMin}m ago`
  return `${Math.floor(diffMin / 60)}h ago`
}

function isThisMonth(iso) {
  if (!iso) return false
  const d = new Date(iso)
  const now = new Date()
  return d.getFullYear() === now.getFullYear() && d.getMonth() === now.getMonth()
}

function isThisWeek(iso) {
  if (!iso) return false
  return Date.now() - new Date(iso).getTime() <= 7 * 24 * 60 * 60 * 1000
}

export default function AnalystDashboard() {
  const [dataQuality, setDataQuality] = useState([])
  const [reports, setReports] = useState([])
  const [models, setModels] = useState([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)

  function loadAll() {
    return Promise.allSettled([listDataQuality(), listReports(), listModels()])
      .then(([dqRes, reportsRes, modelsRes]) => {
        setDataQuality(dqRes.status === 'fulfilled' ? dqRes.value : [])
        setReports(reportsRes.status === 'fulfilled' ? reportsRes.value : [])
        setModels(modelsRes.status === 'fulfilled' ? modelsRes.value : [])
      })
  }

  useEffect(() => {
    loadAll().finally(() => setLoading(false))
  }, [])

  async function handleRefresh() {
    setRefreshing(true)
    try {
      for (const source of CHECKED_SOURCES) {
        await runDataQualityCheck(source).catch(() => {})
      }
      await loadAll()
    } finally {
      setRefreshing(false)
    }
  }

  const dateStr = new Date().toLocaleDateString('en-GB', {
    weekday: 'long', day: 'numeric', month: 'long', year: 'numeric',
  })

  // Latest record per source — a source can have many historical checks.
  const latestBySource = Object.values(
    dataQuality.reduce((acc, r) => {
      if (!acc[r.source] || new Date(r.checked_at) > new Date(acc[r.source].checked_at)) acc[r.source] = r
      return acc
    }, {})
  )
  const dataSources = latestBySource.map((r) => {
    const status = statusOf(r)
    return {
      source_name: r.source,
      status,
      completeness_pct: Math.round(r.completeness ?? 0),
      last_updated_at: timeAgo(r.checked_at),
      border: borderOf(status),
    }
  })
  const lastChecked = latestBySource.length
    ? timeAgo(latestBySource.map((r) => r.checked_at).sort().reverse()[0])
    : 'never'

  const reportsThisMonth = reports.filter((r) => isThisMonth(r.generated_at)).length
  const reportsSubmittedThisWeek = reports.filter((r) => isThisWeek(r.submitted_at)).length
  const degradedSources = dataSources.filter((s) => s.status !== 'OK')
  const flaggedModels = models.filter((m) => m.status !== 'ACTIVE')

  // Real alerts feed — data sources below quality threshold, and any AI
  // model not in ACTIVE status. Both are real DB-backed facts; no
  // fabricated "deviation sigma" or invented anomaly text.
  const alerts = [
    ...degradedSources.map((s) => ({
      key: `dq-${s.source_name}`,
      type: 'DATA QUALITY',
      title: `${s.source_name} data quality is ${s.status.toLowerCase()}`,
      detail: `Completeness at ${s.completeness_pct}% — last checked ${s.last_updated_at}.`,
      severity: s.status === 'ERROR' ? 'critical' : 'medium',
      link: '/analyst/data-quality',
    })),
    ...flaggedModels.map((m) => ({
      key: `model-${m.modelId}`,
      type: 'AI MODEL',
      title: `${m.modelName} is ${(m.status ?? 'unknown').toLowerCase()}`,
      detail: `${m.algorithm ?? 'Unknown algorithm'} · accuracy ${m.accuracy != null ? Math.round(m.accuracy) + '%' : '—'}.`,
      severity: 'medium',
      link: '/analyst/models',
    })),
  ]

  const recentReports = [...reports]
    .sort((a, b) => new Date(b.generated_at ?? 0) - new Date(a.generated_at ?? 0))
    .slice(0, 6)

  return (
    <div className="portal-page flex flex-col gap-5 min-w-[1024px]">
      <AnalystPageHeader title="Analyst Dashboard" subtitle={`System intelligence overview · ${dateStr}`} badge="Dashboard" />

      <div className="portal-grid-4">
        <MetricCard icon={FileBarChart} label="Reports Generated (Month)" value={loading ? '—' : String(reportsThisMonth)} hint="Real reports this calendar month" hintTone="neutral" />
        <MetricCard
          icon={AlertCircle}
          label="Data Quality Alerts"
          value={loading ? '—' : String(degradedSources.length)}
          hint={degradedSources.length > 0 ? 'Source(s) below target' : 'All sources healthy'}
          hintTone={degradedSources.length > 0 ? 'warning' : 'positive'}
          className={degradedSources.length > 0 ? 'dispatcher-metric-card--alert' : ''}
        />
        <MetricCard
          icon={Cpu}
          label="AI Model Alerts"
          value={loading ? '—' : String(flaggedModels.length)}
          hint={flaggedModels.length > 0 ? 'Model(s) not active' : 'All models active'}
          hintTone={flaggedModels.length > 0 ? 'warning' : 'positive'}
          className={flaggedModels.length > 0 ? 'dispatcher-metric-card--alert' : ''}
        />
        <MetricCard icon={CalendarCheck} label="Reports Submitted (7d)" value={loading ? '—' : String(reportsSubmittedThisWeek)} hint="Real submissions this week" hintTone="neutral" />
      </div>

      <div className="dispatcher-surface p-4">
        <div className="flex flex-wrap justify-between gap-3 items-center mb-4">
          <div className="flex items-center gap-2">
            <Server size={16} style={{ color: 'var(--accent)' }} />
            <span className="font-semibold text-[14px]">Data Source Health</span>
          </div>
          <div className="flex items-center gap-3">
            <span className="font-mono text-[11px] text-(--text-muted)">Last checked: {lastChecked}</span>
            <button
              type="button"
              className="dispatcher-btn-ghost text-[11px] h-8 px-2 inline-flex items-center gap-1"
              onClick={handleRefresh}
              disabled={refreshing}
            >
              <RefreshCw size={12} className={refreshing ? 'animate-spin' : ''} />
              {refreshing ? 'Checking…' : 'Refresh'}
            </button>
          </div>
        </div>
        <div className="flex flex-wrap gap-4">
          {!loading && dataSources.length === 0 && (
            <p className="text-[12px] text-(--text-muted) m-0">No data quality checks run yet — click Refresh to run one.</p>
          )}
          {dataSources.map((src) => (
            <div
              key={src.source_name}
              className="flex-1 min-w-[160px] rounded-lg p-3.5"
              style={{ background: 'var(--bg-elevated)', borderLeft: `3px solid ${src.border}` }}
            >
              <div className="flex justify-between gap-2 mb-2">
                <span className="font-semibold text-[13px]">{src.source_name}</span>
                <StatusBadge label={src.status} variant={sourceStatusVariant(src.status)} />
              </div>
              <div className="text-[12px] text-(--text-secondary)">Completeness: {src.completeness_pct}%</div>
              <div className="font-mono text-[11px] text-(--text-muted) mt-0.5">Last update: {src.last_updated_at}</div>
            </div>
          ))}
        </div>
      </div>

      <div className="portal-split-60-40 gap-4">
        <div className="flex flex-col gap-3 min-w-0">
          <SectionTitle
            title="Alerts Feed"
            badge={<span className="font-mono text-[10px] text-(--text-muted) ml-auto">DATA QUALITY + AI MODEL STATUS</span>}
          />
          {!loading && alerts.length === 0 && (
            <div className="dispatcher-surface p-4 text-[13px] text-(--text-muted) text-center">No active alerts — data sources and AI models are healthy.</div>
          )}
          {alerts.map((a) => (
            <div key={a.key} className="dispatcher-surface p-4">
              <div className="flex flex-wrap justify-between gap-2">
                <div className="flex items-center gap-2">
                  <span
                    className="w-2 h-2 rounded-full shrink-0"
                    style={{ background: a.severity === 'critical' ? 'var(--status-critical)' : 'var(--status-medium)' }}
                  />
                  <span className="font-mono text-[10px] uppercase text-(--text-muted)">{a.type}</span>
                </div>
              </div>
              <p className="font-medium text-[13px] text-(--text-primary) my-1.5 m-0">{a.title}</p>
              <p className="text-[12px] text-(--text-secondary) m-0">{a.detail}</p>
              <div className="flex justify-end mt-3">
                <Link to={a.link} className="dispatcher-btn-outline text-[11px] h-[30px] px-3 inline-flex items-center no-underline">
                  Investigate →
                </Link>
              </div>
            </div>
          ))}
        </div>

        <div className="flex flex-col gap-3 min-w-0">
          <SectionTitle title="Recent Reports" />
          <div className="dispatcher-surface p-4">
            {loading && <p className="text-[12px] text-(--text-muted) m-0">Loading…</p>}
            {!loading && recentReports.length === 0 && (
              <p className="text-[12px] text-(--text-muted) m-0">No reports generated yet.</p>
            )}
            {recentReports.map((r) => (
              <div key={r.report_id} className="flex items-center justify-between gap-2 py-2 border-t border-(--border-subtle) first:border-0 text-[12px]">
                <div className="min-w-0">
                  <div className="font-medium truncate">{r.report_type} · {r.district_name ?? 'All Districts'}</div>
                  <div className="text-(--text-muted) text-[11px]">{timeAgo(r.generated_at)}</div>
                </div>
                <StatusBadge label={r.status ?? '—'} variant={r.status === 'SUBMITTED' ? 'resolved' : 'handover'} />
              </div>
            ))}
            <Link to="/analyst/library" className="text-[12px] font-semibold text-(--accent) mt-3 inline-block no-underline hover:underline">
              View Report Library →
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}

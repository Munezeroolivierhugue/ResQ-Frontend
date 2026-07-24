import { useEffect, useState } from 'react'
import { BarChart3, Download } from 'lucide-react'
import { getCurrentUser, canFileFieldReports } from '../../utils/authSession'
import { buildPdfHtml, openPdfWindow } from '../../utils/pdfExport'
import { getMyStats } from '../../api/fieldResponderStats'
import { getResponseTimeTarget } from '../../api/admin'

function fmtMinutes(m) {
  return m == null ? '—' : `${m.toFixed(1)}m`
}

function exportPerfPDF(s, slaTargetMinutes) {
  const cu = getCurrentUser()
  const name = cu?.full_name || sessionStorage.getItem('resq-full-name') || 'Field Responder'
  openPdfWindow(buildPdfHtml({
    title: 'Field Responder Performance Report',
    subtitle: "Today's Shift · 08:00 – Now",
    reportType: 'PERFORMANCE REPORT',
    idPrefix: 'FRP',
    metaItems: [
      { label: 'Responder', value: name },
      { label: 'Period', value: "Today's Shift · 08:00 – Now" },
    ],
    kpis: [
      { label: 'Incidents Today', value: s.incidents_today ?? '—' },
      { label: 'Avg Response Today', value: fmtMinutes(s.avg_response_minutes_today), sub: `Target ${slaTargetMinutes} min` },
      { label: 'District Avg Response', value: fmtMinutes(s.district_avg_response_minutes_today) },
      { label: 'Reports Filed Today', value: s.reports_filed_today ?? '—' },
      { label: 'Reports Filed (All Time)', value: s.reports_filed_total ?? '—' },
    ],
    sections: [],
    generatedBy: name,
    generatedRole: 'Field Responder',
  }))
}

export default function FRPerformance() {
  const [stats, setStats] = useState(null)
  const [loading, setLoading] = useState(true)
  // Was never referenced anywhere on this page — this panel judged "your
  // avg" purely against the district average, with no tie to the actual
  // admin-configured National Response Time Target used everywhere else.
  const [slaTargetMinutes, setSlaTargetMinutes] = useState(12)

  useEffect(() => {
    if (!canFileFieldReports()) {
      Promise.resolve().then(() => setLoading(false))
      return
    }
    getMyStats()
      .then(setStats)
      .catch(() => setStats(null))
      .finally(() => setLoading(false))
    getResponseTimeTarget().then(setSlaTargetMinutes).catch(() => {})
  }, [])

  const s = stats ?? {
    incidents_today: 0, reports_filed_today: 0, reports_filed_total: 0,
    avg_response_minutes_today: null, district_avg_response_minutes_today: null,
  }

  const faster = s.avg_response_minutes_today != null && s.district_avg_response_minutes_today != null
    ? s.district_avg_response_minutes_today - s.avg_response_minutes_today
    : null

  const STATS = [
    [String(s.incidents_today), 'Incidents today'],
    [fmtMinutes(s.avg_response_minutes_today), 'Avg response today'],
    [String(s.reports_filed_today), 'Reports filed today'],
    [String(s.reports_filed_total), 'Reports filed (all time)'],
  ]

  // Only RNP/police units file reports and get performance stats — other
  // agencies' responders (ambulance, fire) don't, so a direct URL visit is
  // blocked the same way the bottom-nav tab is already hidden for them.
  if (!canFileFieldReports()) {
    return (
      <div className="fr-page fr-page--fill">
        <div className="fr-page-fill-body">
          <div className="dispatcher-surface fr-card fr-card--tight text-center py-10">
            <BarChart3 size={24} className="text-(--text-muted) mx-auto mb-2" />
            <p className="text-[13px] text-(--text-secondary) m-0">
              Performance stats are only tracked for RNP units.
            </p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="fr-page fr-page--fill">
      <div className="fr-page-fill-body">
        <div className="dispatcher-surface fr-card fr-card--tight">
          <div className="fr-card-header">
            <BarChart3 size={16} className="text-(--accent)" />
            <span className="font-semibold text-[13px]">Today&apos;s Shift</span>
            <span className="text-[11px] text-(--text-muted) ml-auto">08:00 – Now</span>
            <button type="button" className="dispatcher-btn-ghost text-[11px] inline-flex items-center gap-1 px-2 py-1 ml-2"
              onClick={() => exportPerfPDF(s, slaTargetMinutes)}>
              <Download size={12} />PDF
            </button>
          </div>
          <div className="fr-divider" />
          {loading ? (
            <p className="text-[12px] text-(--text-muted) py-2">Loading your stats…</p>
          ) : (
            <div className="fr-perf-grid">
              {STATS.map(([val, label]) => (
                <div key={label} className="fr-perf-tile">
                  <div className="fr-perf-value font-mono">{val}</div>
                  <div className="fr-perf-label">{label}</div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="dispatcher-surface fr-card fr-card--tight">
          <div className="flex items-center justify-between mb-3">
            <span className="font-semibold text-[13px]">Response Time vs District Average</span>
            <span className="text-[11px] text-(--text-muted)">Target: {slaTargetMinutes} min</span>
          </div>
          <div className="fr-compare-row">
            <div className="fr-compare-col">
              <div
                className="fr-compare-value font-mono"
                style={{
                  color: s.avg_response_minutes_today == null
                    ? 'var(--text-muted)'
                    : s.avg_response_minutes_today <= slaTargetMinutes ? 'var(--status-low)' : 'var(--status-critical)',
                }}
              >
                {fmtMinutes(s.avg_response_minutes_today)}
              </div>
              <div className="fr-perf-label">YOUR AVG</div>
            </div>
            <div className="fr-compare-divider" />
            <div className="fr-compare-col">
              <div className="fr-compare-value font-mono">{fmtMinutes(s.district_avg_response_minutes_today)}</div>
              <div className="fr-perf-label">DISTRICT AVG</div>
            </div>
          </div>
          {faster != null ? (
            <p className="fr-compare-note">
              {faster >= 0
                ? `↑ ${faster.toFixed(1)}m faster than district average`
                : `↓ ${Math.abs(faster).toFixed(1)}m slower than district average`}
            </p>
          ) : (
            <p className="fr-compare-note">Not enough dispatch data yet to compare.</p>
          )}
        </div>
      </div>
    </div>
  )
}

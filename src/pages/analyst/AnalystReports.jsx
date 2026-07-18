import { useState, useRef, useEffect } from 'react'
import {
  Play,
  BarChart3,
  LineChart,
  Table2,
  Download,
  Table,
  Library,
} from 'lucide-react'
import {
  LineChart as ReLineChart,
  Line,
  BarChart as ReBarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
} from 'recharts'
import AnalystPageHeader from '../../components/analyst/AnalystPageHeader'
import SettingsToast from '../../components/settings/SettingsToast'
import { getCurrentUser } from '../../utils/authSession'
import { listReports, generateReport, submitReport } from '../../api/reporting'
import { listIncidents } from '../../api/incidents'
import { listDistricts } from '../../api/districts'
import { getResponseTimeTarget } from '../../api/admin'

const CHART_TYPES = [
  { id: 'line', icon: LineChart, label: 'Line' },
  { id: 'bar', icon: BarChart3, label: 'Bar' },
  { id: 'table', icon: Table2, label: 'Table' },
]

const QUICK_RANGES = [
  { id: 'Today', days: 0 },
  { id: '7 Days', days: 7 },
  { id: '30 Days', days: 30 },
  { id: 'Quarter', days: 91 },
  { id: 'Year', days: 365 },
]

function todayISO() {
  return new Date().toISOString().slice(0, 10)
}
function daysAgoISO(days) {
  const d = new Date()
  d.setDate(d.getDate() - days)
  return d.toISOString().slice(0, 10)
}

export default function AnalystReports() {
  const [range, setRange] = useState('30 Days')
  const [dateFrom, setDateFrom] = useState(daysAgoISO(30))
  const [dateTo, setDateTo] = useState(todayISO())
  const [reportType, setReportType] = useState('Response Time Performance')
  const [chartType, setChartType] = useState('line')
  const [districts, setDistricts] = useState([])
  const [scopeDistrictId, setScopeDistrictId] = useState('') // '' = All Rwanda
  const [targetMinutes, setTargetMinutes] = useState(8)
  const [toast, setToast] = useState('')
  const [generating, setGenerating] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [preview, setPreview] = useState(null) // real generated report + computed breakdown/trend
  const [apiReports, setApiReports] = useState([])
  const reportNameRef = useRef(null)

  useEffect(() => {
    listDistricts().then(setDistricts).catch(() => {})
    getResponseTimeTarget().then(setTargetMinutes).catch(() => {})
    refreshLibrary()
  }, [])

  function refreshLibrary() {
    listReports().then(setApiReports).catch(() => {})
  }

  function applyQuickRange(r) {
    setRange(r.id)
    setDateFrom(daysAgoISO(r.days))
    setDateTo(todayISO())
  }

  function showToast(msg) {
    setToast(msg)
    setTimeout(() => setToast(''), 3000)
  }

  async function handleGenerate() {
    setGenerating(true)
    try {
      const report = await generateReport({
        report_type: reportType,
        district_id: scopeDistrictId || null,
        period_start: dateFrom,
        period_end: dateTo,
      })

      // Real district breakdown + daily trend, computed from real incidents
      // in the selected window — the backend report only stores the
      // aggregate KPIs, so the per-district table and trend chart are built
      // here from the same real incident data.
      const incidents = await listIncidents(scopeDistrictId ? { districtId: scopeDistrictId } : {})
      const inWindow = incidents.filter((i) => i.call_time && i.call_time.slice(0, 10) >= dateFrom && i.call_time.slice(0, 10) <= dateTo)

      const byDistrict = {}
      for (const inc of inWindow) {
        const key = inc.district ?? 'Unknown'
        if (!byDistrict[key]) byDistrict[key] = { district: key, count: 0, totalResp: 0, respCount: 0 }
        byDistrict[key].count += 1
        if (inc.response_time_minutes != null) {
          byDistrict[key].totalResp += inc.response_time_minutes
          byDistrict[key].respCount += 1
        }
      }
      const districtBreakdown = Object.values(byDistrict).map((d) => ({
        district: d.district,
        avgResponse: d.respCount ? d.totalResp / d.respCount : null,
        count: d.count,
      })).sort((a, b) => b.count - a.count)

      const byDay = {}
      for (const inc of inWindow) {
        if (!inc.call_time || inc.response_time_minutes == null) continue
        const day = inc.call_time.slice(0, 10)
        if (!byDay[day]) byDay[day] = { day, total: 0, count: 0 }
        byDay[day].total += inc.response_time_minutes
        byDay[day].count += 1
      }
      const trend = Object.values(byDay)
        .sort((a, b) => a.day.localeCompare(b.day))
        .map((d) => ({ day: new Date(d.day).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' }), avg: Math.round((d.total / d.count) * 10) / 10 }))

      const withResponse = inWindow.filter((i) => i.response_time_minutes != null)
      const withinTargetPct = withResponse.length
        ? Math.round(100 * withResponse.filter((i) => i.response_time_minutes <= targetMinutes).length / withResponse.length)
        : null

      setPreview({ report, districtBreakdown, trend, withinTargetPct, incidentCount: inWindow.length })
      showToast('Report generated from real incident data.')
    } catch {
      showToast('Failed to generate report — please try again.')
    } finally {
      setGenerating(false)
    }
  }

  async function handleSubmit() {
    if (!preview?.report?.report_id) return
    setSubmitting(true)
    try {
      const submitted = await submitReport(preview.report.report_id)
      setPreview((p) => ({ ...p, report: submitted }))
      refreshLibrary()
      showToast('Report submitted to the library.')
    } catch {
      showToast('Failed to submit report — please try again.')
    } finally {
      setSubmitting(false)
    }
  }

  function exportCSV() {
    if (!preview) { showToast('Generate a report first.'); return }
    const reportName = reportNameRef.current?.value || 'Report'
    const { report, districtBreakdown, trend, withinTargetPct } = preview

    const escape = (v) => `"${String(v ?? '').replace(/"/g, '""')}"`
    const rows = [
      ['RESQ Analytics Report', reportName],
      ['Period', `${dateFrom} to ${dateTo}`],
      ['Scope', scopeDistrictId ? (districts.find((d) => d.district_id === scopeDistrictId)?.name ?? 'District') : 'All Rwanda'],
      ['Generated', new Date().toLocaleString()],
      [],
      ['SUMMARY KPIs'],
      ['Metric', 'Value'],
      ['Avg Response Time', report.avg_response_time != null ? `${report.avg_response_time.toFixed(1)}m` : '—'],
      ['Within Target', withinTargetPct != null ? `${withinTargetPct}%` : '—'],
      ['Dispatch Accuracy', report.resolution_rate != null ? `${Math.round(report.resolution_rate * 100)}%` : '—'],
      ['Total Incidents', String(report.total_incidents ?? preview.incidentCount)],
      [],
      ['DISTRICT BREAKDOWN'],
      ['District', 'Avg Response (min)', 'Incident Count'],
      ...districtBreakdown.map((r) => [r.district, r.avgResponse != null ? r.avgResponse.toFixed(1) : '—', r.count]),
      [],
      ['RESPONSE TIME TREND'],
      ['Day', 'Avg Response (min)'],
      ...trend.map((r) => [r.day, r.avg]),
    ]

    const csv = rows.map((row) => row.map(escape).join(',')).join('\n')
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${reportName.replace(/\s+/g, '_')}_${range.replace(/\s+/g, '_')}.csv`
    a.click()
    URL.revokeObjectURL(url)
    showToast('CSV exported successfully.')
  }

  function exportPDF() {
    if (!preview) { showToast('Generate a report first.'); return }
    const { report, districtBreakdown, trend, withinTargetPct } = preview
    const currentUser = getCurrentUser()
    const reportName = reportNameRef.current?.value || 'RESQ Analytics Report'
    const generatorName = currentUser?.full_name || currentUser?.email || 'RESQ Analyst'
    const generatorRole = currentUser?.role ? currentUser.role.replace(/_/g, ' ') : 'Analyst'
    const reportId = report.report_id ? report.report_id.slice(0, 8).toUpperCase() : 'RPT-DRAFT'
    const now = new Date()
    const rnpLogoUrl = window.location.origin + '/Rwanda_National_Police.png'
    const scope = scopeDistrictId ? (districts.find((d) => d.district_id === scopeDistrictId)?.name ?? 'District') : 'All Rwanda'

    const tableRows = districtBreakdown.map((r, i) => `
      <tr style="background:${i % 2 === 1 ? '#f8fafc' : '#ffffff'}">
        <td style="padding:10px 14px;font-weight:600;color:#1a202c;border-bottom:1px solid #e2e8f0">${r.district}</td>
        <td style="padding:10px 14px;font-family:monospace;color:#2563eb;border-bottom:1px solid #e2e8f0">${r.avgResponse != null ? r.avgResponse.toFixed(1) + 'm' : '—'}</td>
        <td style="padding:10px 14px;font-family:monospace;border-bottom:1px solid #e2e8f0">${r.count}</td>
      </tr>`).join('')

    const trendRows = trend.map((r) => `
      <tr>
        <td style="padding:7px 12px;border-bottom:1px solid #f1f5f9;color:#374151;font-weight:500">${r.day}</td>
        <td style="padding:7px 12px;font-family:monospace;color:#2196C8;text-align:center;border-bottom:1px solid #f1f5f9">${r.avg}m</td>
      </tr>`).join('')

    const html = `<!DOCTYPE html>
<html lang="en"><head>
  <meta charset="UTF-8">
  <title>${reportName} — RNP RESQ</title>
  <style>
    *{box-sizing:border-box;margin:0;padding:0}
    body{font-family:'Segoe UI',Arial,sans-serif;color:#1a202c;background:#fff;font-size:13px}
    @media print{body{-webkit-print-color-adjust:exact;print-color-adjust:exact}@page{margin:8mm 10mm}.no-break{page-break-inside:avoid}}
  </style>
</head><body>
<div style="background:linear-gradient(135deg,#031632 0%,#010c1f 100%);color:#fff;padding:22px 32px;display:flex;align-items:center;gap:20px">
  <img src="${rnpLogoUrl}" style="width:68px;height:68px;object-fit:contain;flex-shrink:0" alt="Rwanda National Police Logo">
  <div style="flex:1">
    <div style="font-size:10px;font-weight:700;letter-spacing:0.15em;text-transform:uppercase;color:#b8c74e;margin-bottom:5px">Rwanda National Police · Emergency Response Division</div>
    <div style="font-size:22px;font-weight:800;letter-spacing:0.01em;margin-bottom:3px">RESQ Analytics Report</div>
    <div style="font-size:12px;color:rgba(183,199,78,0.75)">Intelligence &amp; Performance Monitoring System — Official Document</div>
  </div>
  <div style="background:rgba(255,255,255,0.1);border:1px solid rgba(255,255,255,0.2);border-radius:8px;padding:10px 16px;text-align:center;min-width:130px">
    <div style="font-size:9px;font-weight:700;letter-spacing:0.12em;text-transform:uppercase;color:#b8c74e;margin-bottom:4px">Document Status</div>
    <div style="font-size:13px;font-weight:700;color:#fff">${report.status === 'SUBMITTED' ? '✓ Submitted' : 'Draft'}</div>
    <div style="font-size:9px;color:rgba(183,199,78,0.75);margin-top:3px">${reportId}</div>
  </div>
</div>
<div style="background:#f0f4f8;border-bottom:3px solid #879D1F;padding:11px 32px;display:flex;align-items:center;flex-wrap:wrap;gap:0">
  <div style="font-size:11px;color:#374151;padding-right:16px;border-right:1px solid #cbd5e0;margin-right:16px"><strong style="color:#031632">Report:</strong> ${reportName}</div>
  <div style="font-size:11px;color:#374151;padding-right:16px;border-right:1px solid #cbd5e0;margin-right:16px"><strong style="color:#031632">Period:</strong> ${dateFrom} – ${dateTo}</div>
  <div style="font-size:11px;color:#374151;padding-right:16px;border-right:1px solid #cbd5e0;margin-right:16px"><strong style="color:#031632">Scope:</strong> ${scope}</div>
  <div style="font-size:11px;color:#374151"><strong style="color:#031632">Prepared by:</strong> ${generatorName}</div>
  <div style="margin-left:auto;background:#879D1F;color:#fff;font-size:10px;font-weight:700;letter-spacing:0.07em;text-transform:uppercase;padding:5px 12px;border-radius:4px">${reportType}</div>
</div>
<div style="padding:26px 32px">
  <div style="font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:0.1em;color:#031632;border-bottom:2px solid #879D1F;padding-bottom:6px;margin-bottom:14px" class="no-break">Summary KPIs</div>
  <div style="display:grid;grid-template-columns:repeat(4,1fr);gap:12px;margin-bottom:26px" class="no-break">
    <div style="background:rgba(33,150,200,0.10);border-left:4px solid #2196C8;border-radius:8px;padding:14px">
      <div style="font-size:28px;font-weight:800;font-family:monospace;color:#2196C8;line-height:1;margin-bottom:5px">${report.avg_response_time != null ? report.avg_response_time.toFixed(1) + 'm' : '—'}</div>
      <div style="font-size:11px;font-weight:600;color:#1a7aa8">Avg Response Time</div>
      <div style="font-size:10px;color:#2196C8;margin-top:2px">Target: &lt; ${targetMinutes} min</div>
    </div>
    <div style="background:rgba(61,170,106,0.12);border-left:4px solid #3DAA6A;border-radius:8px;padding:14px">
      <div style="font-size:28px;font-weight:800;font-family:monospace;color:#3DAA6A;line-height:1;margin-bottom:5px">${withinTargetPct != null ? withinTargetPct + '%' : '—'}</div>
      <div style="font-size:11px;font-weight:600;color:#2d8050">Within Target</div>
    </div>
    <div style="background:rgba(135,157,31,0.12);border-left:4px solid #879D1F;border-radius:8px;padding:14px">
      <div style="font-size:28px;font-weight:800;font-family:monospace;color:#879D1F;line-height:1;margin-bottom:5px">${report.resolution_rate != null ? Math.round(report.resolution_rate * 100) + '%' : '—'}</div>
      <div style="font-size:11px;font-weight:600;color:#6a7b17">Dispatch Accuracy</div>
    </div>
    <div style="background:rgba(212,160,23,0.12);border-left:4px solid #D4A017;border-radius:8px;padding:14px">
      <div style="font-size:28px;font-weight:800;font-family:monospace;color:#D4A017;line-height:1;margin-bottom:5px">${report.total_incidents ?? preview.incidentCount}</div>
      <div style="font-size:11px;font-weight:600;color:#a07c12">Total Incidents</div>
      <div style="font-size:10px;color:#D4A017;margin-top:2px">${scope}</div>
    </div>
  </div>
  <div style="font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:0.1em;color:#031632;border-bottom:2px solid #879D1F;padding-bottom:6px;margin-bottom:12px" class="no-break">District Breakdown</div>
  <table style="width:100%;border-collapse:collapse;margin-bottom:22px;font-size:12px" class="no-break">
    <thead><tr style="background:#031632;color:#fff">
      <th style="padding:10px 14px;text-align:left;font-size:11px;font-weight:600">District</th>
      <th style="padding:10px 14px;text-align:left;font-size:11px;font-weight:600">Avg Response</th>
      <th style="padding:10px 14px;text-align:left;font-size:11px;font-weight:600">Incidents</th>
    </tr></thead>
    <tbody>${tableRows || '<tr><td colspan="3" style="padding:12px;text-align:center;color:#6b7280">No incidents in this period</td></tr>'}</tbody>
  </table>
  <div style="font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:0.1em;color:#031632;border-bottom:2px solid #879D1F;padding-bottom:6px;margin-bottom:12px" class="no-break">Response Time Trend</div>
  <table style="width:100%;border-collapse:collapse;margin-bottom:22px;font-size:12px" class="no-break">
    <thead><tr style="background:#031632;color:#fff">
      <th style="padding:8px 12px;text-align:left;font-size:11px;font-weight:600">Day</th>
      <th style="padding:8px 12px;text-align:center;font-size:11px;font-weight:600">Avg Response</th>
    </tr></thead>
    <tbody>${trendRows || '<tr><td colspan="2" style="padding:12px;text-align:center;color:#6b7280">No data</td></tr>'}</tbody>
  </table>
  <div style="border-top:2px solid #879D1F;padding-top:20px;margin-top:8px" class="no-break">
    <div style="font-size:10px;font-weight:700;letter-spacing:0.1em;text-transform:uppercase;color:#031632;margin-bottom:18px">Authorization &amp; Certification</div>
    <div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:24px">
      <div>
        <div style="font-size:10px;color:#6b7280;text-transform:uppercase;letter-spacing:0.06em;margin-bottom:28px">Prepared By</div>
        <div style="border-bottom:1.5px solid #374151;margin-bottom:5px"></div>
        <div style="font-size:11px;color:#031632;font-weight:600">${generatorName}</div>
        <div style="font-size:10px;color:#6b7280">${generatorRole}</div>
      </div>
      <div>
        <div style="font-size:10px;color:#6b7280;text-transform:uppercase;letter-spacing:0.06em;margin-bottom:28px">Signature</div>
        <div style="border-bottom:1.5px solid #374151;margin-bottom:5px"></div>
      </div>
      <div>
        <div style="font-size:10px;color:#6b7280;text-transform:uppercase;letter-spacing:0.06em;margin-bottom:28px">Date</div>
        <div style="border-bottom:1.5px solid #374151;margin-bottom:5px"></div>
        <div style="font-size:11px;color:#374151">${now.toLocaleDateString('en-GB', { year: 'numeric', month: 'long', day: 'numeric' })}</div>
      </div>
    </div>
  </div>
  <div style="margin-top:22px;padding-top:12px;border-top:1px solid #e2e8f0;font-size:10px;color:#9ca3af">
    RESQ Analytics System · Rwanda National Police · Report ID: ${reportId} · Generated ${now.toISOString()}
  </div>
</div>
<script>window.onload=function(){window.print();}</script>
</body></html>`

    const win = window.open('', '_blank')
    if (!win) { showToast('Allow pop-ups to export PDF.'); return }
    win.document.write(html)
    win.document.close()
    showToast('Print dialog opened — save as PDF.')
  }

  const report = preview?.report
  const districtBreakdown = preview?.districtBreakdown ?? []
  const trend = preview?.trend ?? []

  return (
    <div className="flex flex-col min-w-[1024px] -mx-0">
      {toast && <SettingsToast show={!!toast} message={toast} />}
      <div className="portal-page pb-0">
        <AnalystPageHeader
          title="Custom Report Builder"
          subtitle="Generate real reports from live incident and dispatch data."
          badge="Reports"
        />
      </div>
      <div className="analyst-report-builder flex min-h-[calc(100vh-120px)]">
        <aside
          className="w-[280px] shrink-0 border-r border-(--border) bg-(--bg-surface) p-4 overflow-y-auto"
          style={{ maxHeight: 'calc(100vh - 120px)' }}
        >
          <div className="flex flex-col gap-5">
            <label className="dispatcher-field">
              <span className="text-[12px] font-medium">Report name</span>
              <input ref={reportNameRef} className="dispatcher-input dispatcher-text-input h-10" placeholder="e.g. Weekly Kigali Response Time Summary" />
            </label>
            <label className="dispatcher-field">
              <span className="text-[12px] font-medium">Report type</span>
              <select className="dispatcher-input dispatcher-select h-10" value={reportType} onChange={(e) => setReportType(e.target.value)}>
                <option>Incident Analysis</option>
                <option>Resource Utilization</option>
                <option>Response Time Performance</option>
                <option>Coverage Analysis</option>
                <option>Unit & Officer Performance</option>
                <option>Cross-District Comparison</option>
                <option>Executive Summary</option>
              </select>
            </label>
            <div className="flex flex-col gap-2">
              <div className="flex gap-2">
                <input type="date" className="dispatcher-input dispatcher-text-input h-10 flex-1" value={dateFrom} max={dateTo} onChange={(e) => { setDateFrom(e.target.value); setRange('Custom') }} />
                <input type="date" className="dispatcher-input dispatcher-text-input h-10 flex-1" value={dateTo} min={dateFrom} onChange={(e) => { setDateTo(e.target.value); setRange('Custom') }} />
              </div>
              <div className="flex gap-1.5 overflow-x-auto pb-1">
                {QUICK_RANGES.map((r) => (
                  <button
                    key={r.id}
                    type="button"
                    className="text-[10px] font-semibold px-2 py-1 rounded-full border shrink-0 cursor-pointer"
                    style={{
                      background: range === r.id ? 'var(--accent-ghost)' : 'var(--bg-elevated)',
                      borderColor: range === r.id ? 'var(--accent)' : 'var(--border)',
                      color: range === r.id ? 'var(--accent)' : 'var(--text-secondary)',
                    }}
                    onClick={() => applyQuickRange(r)}
                  >
                    {r.id}
                  </button>
                ))}
              </div>
            </div>
            <label className="dispatcher-field">
              <span className="text-[12px] font-medium">Geographic scope</span>
              <select
                className="dispatcher-input dispatcher-select h-10"
                value={scopeDistrictId}
                onChange={(e) => setScopeDistrictId(e.target.value)}
              >
                <option value="">All Rwanda</option>
                {districts.map((d) => (
                  <option key={d.district_id} value={d.district_id}>{d.name}</option>
                ))}
              </select>
            </label>
            <div className="flex flex-col gap-2">
              <div className="font-semibold text-[12px]">Chart type</div>
              <div className="grid grid-cols-3 gap-2">
                {CHART_TYPES.map((c) => {
                  const Icon = c.icon
                  return (
                    <button
                      key={c.id}
                      type="button"
                      title={c.label}
                      className="w-10 h-10 rounded-lg border flex items-center justify-center cursor-pointer"
                      style={{
                        borderColor: chartType === c.id ? 'var(--accent)' : 'var(--border)',
                        background: chartType === c.id ? 'var(--accent-ghost)' : 'transparent',
                        color: chartType === c.id ? 'var(--accent)' : 'var(--text-secondary)',
                      }}
                      onClick={() => setChartType(c.id)}
                    >
                      <Icon size={18} />
                    </button>
                  )
                })}
              </div>
            </div>
            <button
              type="button"
              className="dispatcher-btn-primary w-full h-12 font-bold text-[13px] inline-flex items-center justify-center gap-2"
              onClick={handleGenerate}
              disabled={generating}
            >
              <Play size={16} />
              {generating ? 'GENERATING…' : 'GENERATE REPORT'}
            </button>
          </div>
        </aside>

        <div className="flex-1 min-w-0 overflow-y-auto p-6">
          {!preview ? (
            <p className="text-[13px] text-(--text-muted) text-center py-16">Configure a report and click "Generate Report" to see real data.</p>
          ) : (
            <>
              <p className="font-mono text-[12px] uppercase tracking-wider m-0" style={{ color: 'var(--accent)' }}>
                {reportType.toUpperCase()} REPORT
              </p>
              <h2 className="text-[18px] font-bold m-0 mt-1">
                {scopeDistrictId ? (districts.find((d) => d.district_id === scopeDistrictId)?.name ?? 'District') : 'All Rwanda — All Districts'}
              </h2>
              <p className="text-[12px] text-(--text-muted) m-0">
                {dateFrom} – {dateTo} · Generated {new Date().toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })}
              </p>
              <hr className="border-(--border) my-4" />

              <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
                {[
                  { v: report.avg_response_time != null ? `${report.avg_response_time.toFixed(1)}m` : '—', l: 'Avg Response' },
                  { v: preview.withinTargetPct != null ? `${preview.withinTargetPct}%` : '—', l: `Within Target (${targetMinutes}m)` },
                  { v: report.resolution_rate != null ? `${Math.round(report.resolution_rate * 100)}%` : '—', l: 'Dispatch Accuracy' },
                  { v: String(report.total_incidents ?? preview.incidentCount), l: 'Total Incidents' },
                ].map((k) => (
                  <div key={k.l} className="dispatcher-metric-card p-3">
                    <div className="dispatcher-metric-value text-[22px]">{k.v}</div>
                    <div className="text-[12px] text-(--text-secondary)">{k.l}</div>
                  </div>
                ))}
              </div>

              <div className="dispatcher-surface p-4 mb-6">
                <h3 className="text-[13px] font-semibold m-0 mb-3">Response Time Trend</h3>
                {trend.length === 0 ? (
                  <p className="text-[12px] text-(--text-muted) m-0">No incidents with a recorded response time in this period.</p>
                ) : chartType === 'table' ? (
                  <table className="w-full text-[12px] border-collapse">
                    <thead><tr className="text-(--text-muted) text-left"><th className="p-2">Day</th><th className="p-2">Avg Response</th></tr></thead>
                    <tbody>{trend.map((t) => <tr key={t.day} className="border-t border-(--border-subtle)"><td className="p-2">{t.day}</td><td className="p-2 font-mono">{t.avg}m</td></tr>)}</tbody>
                  </table>
                ) : (
                  <ResponsiveContainer width="100%" height={240}>
                    {chartType === 'bar' ? (
                      <ReBarChart data={trend}>
                        <CartesianGrid stroke="var(--border-subtle)" />
                        <XAxis dataKey="day" tick={{ fontSize: 10 }} />
                        <YAxis tick={{ fontSize: 10 }} unit="m" />
                        <Tooltip />
                        <ReferenceLine y={targetMinutes} stroke="var(--status-critical)" strokeDasharray="4 4" label="Target" />
                        <Bar dataKey="avg" fill="var(--accent)" radius={[2, 2, 0, 0]} />
                      </ReBarChart>
                    ) : (
                      <ReLineChart data={trend}>
                        <CartesianGrid stroke="var(--border-subtle)" />
                        <XAxis dataKey="day" tick={{ fontSize: 10 }} />
                        <YAxis tick={{ fontSize: 10 }} unit="m" />
                        <Tooltip />
                        <ReferenceLine y={targetMinutes} stroke="var(--status-critical)" strokeDasharray="4 4" label="Target" />
                        <Line type="monotone" dataKey="avg" stroke="var(--accent)" dot={false} strokeWidth={2} />
                      </ReLineChart>
                    )}
                  </ResponsiveContainer>
                )}
              </div>

              <div className="dispatcher-surface overflow-x-auto mb-6">
                <table className="w-full text-[12px] border-collapse min-w-[420px]">
                  <thead>
                    <tr className="border-b border-(--border) text-(--text-muted)">
                      <th className="text-left p-3">District</th>
                      <th className="text-left p-3">Avg Response</th>
                      <th className="text-left p-3">Incident Count</th>
                    </tr>
                  </thead>
                  <tbody>
                    {districtBreakdown.length === 0 && (
                      <tr><td colSpan={3} className="p-4 text-center text-(--text-muted)">No incidents in this period.</td></tr>
                    )}
                    {districtBreakdown.map((row) => (
                      <tr key={row.district} className="border-b border-(--border-subtle) dispatcher-table-row">
                        <td className="p-3 font-medium">{row.district}</td>
                        <td className="p-3 font-mono">{row.avgResponse != null ? `${row.avgResponse.toFixed(1)}m` : '—'}</td>
                        <td className="p-3 font-mono">{row.count}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </>
          )}
        </div>

        <aside className="w-[240px] shrink-0 border-l border-(--border) p-4 sticky top-0 self-start overflow-y-auto" style={{ maxHeight: 'calc(100vh - 120px)' }}>
          <h3 className="font-semibold text-[13px] m-0 mb-4">Export & Share</h3>
          <div className="flex flex-col gap-2 mb-5">
            <button type="button" className="dispatcher-btn-primary w-full inline-flex items-center justify-center gap-2" onClick={exportPDF} disabled={!preview}>
              <Download size={14} />
              Export PDF
            </button>
            <button type="button" className="dispatcher-btn-ghost w-full inline-flex items-center justify-center gap-2" onClick={exportCSV} disabled={!preview}>
              <Table size={14} />
              Export CSV / Excel
            </button>
            <button
              type="button"
              className="dispatcher-btn-ghost w-full inline-flex items-center justify-center gap-2"
              onClick={handleSubmit}
              disabled={!preview || report?.status === 'SUBMITTED' || submitting}
            >
              <Library size={14} />
              {report?.status === 'SUBMITTED' ? 'Submitted' : submitting ? 'Submitting…' : 'Submit to Report Library'}
            </button>
          </div>
          {apiReports.length > 0 && (
            <div>
              <div className="text-[10px] font-mono text-(--text-muted) mb-2">LIBRARY ({apiReports.length})</div>
              <div className="max-h-[220px] overflow-y-auto flex flex-col gap-2">
                {apiReports.slice(0, 6).map((r) => (
                  <div key={r.report_id} className="text-[10px] text-(--text-secondary) px-2.5 py-2 rounded-lg border border-(--border-subtle)" style={{ background: 'var(--bg-elevated)' }}>
                    <div className="font-medium truncate">{r.report_type}</div>
                    <div className="text-(--text-muted) mt-0.5">{r.district_name || 'All Districts'} · {r.status}</div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </aside>
      </div>
    </div>
  )
}

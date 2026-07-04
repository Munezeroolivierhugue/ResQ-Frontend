import { useState, useRef, useEffect } from 'react'
import {
  Play,
  BarChart3,
  LineChart,
  PieChart,
  Table2,
  Map,
  LayoutGrid,
  Download,
  Table,
  UserPlus,
  Library,
  Brain,
} from 'lucide-react'
import {
  LineChart as ReLineChart,
  Line,
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
import { mockReports } from '../../data/mockReports'
import { useNotificationsStore } from '../../store/notificationsStore'
import { ANALYST_LIBRARY_ROWS } from '../../data/mockAnalystData'
import { listReports } from '../../api/reporting'
import {
  ANALYST_REPORT_METRICS,
  ANALYST_RESPONSE_TREND,
  ANALYST_DISTRICT_BREAKDOWN,
  ANALYST_RWANDA_DISTRICTS,
} from '../../data/mockAnalystData'

const CHART_TYPES = [
  { id: 'bar', icon: BarChart3, label: 'Bar' },
  { id: 'line', icon: LineChart, label: 'Line' },
  { id: 'pie', icon: PieChart, label: 'Pie' },
  { id: 'table', icon: Table2, label: 'Table' },
  { id: 'heat', icon: Map, label: 'Heat map' },
  { id: 'combined', icon: LayoutGrid, label: 'Combined' },
]

const QUICK_RANGES = ['Today', '7 Days', '30 Days', 'Quarter', 'Year', 'Custom']

export default function AnalystReports() {
  const [range, setRange] = useState('30 Days')
  const [reportType, setReportType] = useState('Response Time Performance')
  const [chartType, setChartType] = useState('line')
  const [geo, setGeo] = useState('All Rwanda')
  const [metrics, setMetrics] = useState(() =>
    Object.fromEntries(ANALYST_REPORT_METRICS.map((m) => [m.id, m.default]))
  )
  const [toast, setToast] = useState('')
  const [lastReportId, setLastReportId] = useState(null)
  const [apiReports, setApiReports] = useState([])
  const reportNameRef = useRef(null)
  const addNotification = useNotificationsStore((s) => s.addNotification)

  useEffect(() => {
    listReports()
      .then((reports) => { if (reports && reports.length > 0) setApiReports(reports) })
      .catch(() => { /* API unavailable — library shows mock data only */ })
  }, [])

  const toggleMetric = (id) => setMetrics((m) => ({ ...m, [id]: !m[id] }))

  function showToast(msg) {
    setToast(msg)
    setTimeout(() => setToast(''), 3000)
  }

  function exportCSV() {
    const reportName = reportNameRef.current?.value || 'Report'
    const selectedMetrics = ANALYST_REPORT_METRICS.filter((m) => metrics[m.id]).map((m) => m.label)

    const escape = (v) => `"${String(v ?? '').replace(/"/g, '""')}"`
    const rows = [
      ['RESQ Analytics Report', reportName],
      ['Period', range],
      ['Scope', geo],
      ['Metrics', selectedMetrics.join('; ')],
      ['Generated', new Date().toLocaleString()],
      [],
      ['SUMMARY KPIs'],
      ['Metric', 'Value'],
      ['Avg Response Time', '7.4m'],
      ['Within Target', '88%'],
      ['Dispatch Accuracy', '91%'],
      ['Total Incidents', '247'],
      [],
      ['DISTRICT BREAKDOWN'],
      ['District', 'Avg Response', 'Within Target', 'Incident Count', 'vs Last Month'],
      ...ANALYST_DISTRICT_BREAKDOWN.map((r) => [r.district, r.avg, r.target, r.count, r.vs]),
      [],
      ['RESPONSE TIME TREND (LAST 30 DAYS)'],
      ['Day', 'Nyarugenge (min)', 'Kicukiro (min)', 'Gasabo (min)'],
      ...ANALYST_RESPONSE_TREND.map((r) => [r.day, r.nyarugenge.toFixed(1), r.kicukiro.toFixed(1), r.gasabo.toFixed(1)]),
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
    const currentUser = getCurrentUser()
    const reportName = reportNameRef.current?.value || 'RESQ Analytics Report'
    const selectedMetrics = ANALYST_REPORT_METRICS.filter((m) => metrics[m.id]).map((m) => m.label)
    const generatorName = currentUser?.full_name || currentUser?.email || 'RESQ Analyst'
    const generatorRole = currentUser?.role ? currentUser.role.replace(/_/g, ' ') : 'Analyst'
    const reportId = 'RPT-' + Date.now().toString(36).toUpperCase() + '-' + Math.random().toString(36).slice(2, 6).toUpperCase()
    const now = new Date()
    // RNP logo from public folder — absolute URL so the print window can load it
    const rnpLogoUrl = window.location.origin + '/Rwanda_National_Police.png'

    // Compute actual date range from selected period
    const fmtDate = (d) => d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })
    let dateRangeLabel = range
    if (range === 'Today') {
      dateRangeLabel = fmtDate(now)
    } else {
      const days = range === '7 Days' ? 7 : range === '30 Days' ? 30 : range === 'Quarter' ? 91 : range === 'Year' ? 365 : null
      if (days) {
        const from = new Date(now)
        from.setDate(from.getDate() - days)
        dateRangeLabel = `${fmtDate(from)} – ${fmtDate(now)}`
      }
    }

    const tableRows = ANALYST_DISTRICT_BREAKDOWN.map((r, i) => `
      <tr style="background:${i % 2 === 1 ? '#f8fafc' : '#ffffff'}">
        <td style="padding:10px 14px;font-weight:600;color:#1a202c;border-bottom:1px solid #e2e8f0">${r.district}</td>
        <td style="padding:10px 14px;font-family:monospace;color:#2563eb;border-bottom:1px solid #e2e8f0">${r.avg}</td>
        <td style="padding:10px 14px;border-bottom:1px solid #e2e8f0">${r.target}</td>
        <td style="padding:10px 14px;font-family:monospace;border-bottom:1px solid #e2e8f0">${r.count}</td>
        <td style="padding:10px 14px;font-family:monospace;font-weight:700;color:${r.improved === true ? '#059669' : r.improved === false ? '#dc2626' : '#6b7280'};border-bottom:1px solid #e2e8f0">${r.vs}</td>
      </tr>`).join('')

    // Compute start date for trend based on selected range
    const trendDayCount = range === 'Today' ? 0 : range === '7 Days' ? 7 : range === 'Quarter' ? 91 : range === 'Year' ? 365 : 30
    const trendStart = new Date(now)
    trendStart.setDate(trendStart.getDate() - trendDayCount)
    const fmtDay = (d) => d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })

    const trendRows = ANALYST_RESPONSE_TREND.slice(0, 10).map((r, i) => {
      const date = new Date(trendStart)
      date.setDate(date.getDate() + i)
      return `
      <tr>
        <td style="padding:7px 12px;border-bottom:1px solid #f1f5f9;color:#374151;font-weight:500">${fmtDay(date)}</td>
        <td style="padding:7px 12px;font-family:monospace;color:#2196C8;text-align:center;border-bottom:1px solid #f1f5f9">${r.nyarugenge.toFixed(1)}m</td>
        <td style="padding:7px 12px;font-family:monospace;color:#879D1F;text-align:center;border-bottom:1px solid #f1f5f9">${r.kicukiro.toFixed(1)}m</td>
        <td style="padding:7px 12px;font-family:monospace;color:#3DAA6A;text-align:center;border-bottom:1px solid #f1f5f9">${r.gasabo.toFixed(1)}m</td>
      </tr>`
    }).join('')

    // Incident-type breakdown rows for the PDF table
    const INCIDENT_ROWS = [
      { type: 'Medical Emergency',      avg: '6.8m', target: '< 8 min',  status: 'CLEARED' },
      { type: 'Road Traffic (RTA)',      avg: '7.4m', target: '< 8 min',  status: 'CLEARED' },
      { type: 'Fire Outbreak',           avg: '5.2m', target: '< 6 min',  status: 'CLEARED' },
      { type: 'Security / Disturbance',  avg: '8.6m', target: '< 8 min',  status: 'MISSED'  },
      { type: 'Medical Emergency',       avg: '7.9m', target: '< 8 min',  status: 'PENDING' },
      { type: 'Road Traffic (RTA)',       avg: '8.1m', target: '< 8 min',  status: 'MISSED'  },
      { type: 'Fire Outbreak',            avg: '5.8m', target: '< 6 min',  status: 'CLEARED' },
      { type: 'Security / Disturbance',   avg: '7.2m', target: '< 8 min',  status: 'CLEARED' },
      { type: 'Disaster Response',        avg: '11.4m', target: '< 10 min', status: 'MISSED' },
      { type: 'Medical Emergency',        avg: '6.3m', target: '< 8 min',  status: 'CLEARED' },
    ]

    const STATUS_STYLES = {
      CLEARED: { bg: 'rgba(61,170,106,0.15)',  color: '#3DAA6A', dot: '#3DAA6A' },
      PENDING: { bg: 'rgba(212,160,23,0.15)',  color: '#D4A017', dot: '#D4A017' },
      MISSED:  { bg: 'rgba(185,56,47,0.15)',   color: '#B9382F', dot: '#B9382F' },
    }

    const incidentTableRows = INCIDENT_ROWS.map((r, i) => {
      const s = STATUS_STYLES[r.status] || STATUS_STYLES.PENDING
      return `
      <tr style="background:${i % 2 === 1 ? '#f8fafc' : '#ffffff'}">
        <td style="padding:10px 14px;font-family:monospace;color:#6b7280;font-weight:600;border-bottom:1px solid #e2e8f0;text-align:center">${String(i + 1).padStart(2, '0')}</td>
        <td style="padding:10px 14px;font-weight:600;color:#1a202c;border-bottom:1px solid #e2e8f0">${r.type}</td>
        <td style="padding:10px 14px;font-family:monospace;color:#2196C8;font-weight:700;border-bottom:1px solid #e2e8f0">${r.avg}</td>
        <td style="padding:10px 14px;color:#374151;border-bottom:1px solid #e2e8f0">${r.target}</td>
        <td style="padding:10px 14px;border-bottom:1px solid #e2e8f0">
          <span style="display:inline-flex;align-items:center;gap:5px;background:${s.bg};color:${s.color};font-size:10px;font-weight:700;padding:3px 10px;border-radius:999px;letter-spacing:0.05em">
            <span style="width:6px;height:6px;border-radius:50%;background:${s.dot};display:inline-block"></span>
            ${r.status}
          </span>
        </td>
      </tr>`
    }).join('')

    const html = `<!DOCTYPE html>
<html lang="en"><head>
  <meta charset="UTF-8">
  <title>${reportName} — RNP RESQ</title>
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
<div style="background:linear-gradient(135deg,#031632 0%,#010c1f 100%);color:#fff;padding:22px 32px;display:flex;align-items:center;gap:20px">
  <img src="${rnpLogoUrl}" style="width:68px;height:68px;object-fit:contain;flex-shrink:0" alt="Rwanda National Police Logo">
  <div style="flex:1">
    <div style="font-size:10px;font-weight:700;letter-spacing:0.15em;text-transform:uppercase;color:#b8c74e;margin-bottom:5px">Rwanda National Police · Emergency Response Division</div>
    <div style="font-size:22px;font-weight:800;letter-spacing:0.01em;margin-bottom:3px">RESQ Analytics Report</div>
    <div style="font-size:12px;color:rgba(183,199,78,0.75)">Intelligence &amp; Performance Monitoring System — Official Document</div>
  </div>
  <div style="background:rgba(255,255,255,0.1);border:1px solid rgba(255,255,255,0.2);border-radius:8px;padding:10px 16px;text-align:center;min-width:130px">
    <div style="font-size:9px;font-weight:700;letter-spacing:0.12em;text-transform:uppercase;color:#b8c74e;margin-bottom:4px">Document Status</div>
    <div style="font-size:13px;font-weight:700;color:#fff">&#10003; Official Report</div>
    <div style="font-size:9px;color:rgba(183,199,78,0.75);margin-top:3px">${reportId}</div>
  </div>
</div>

<!-- ═══ META BAR ═══ -->
<div style="background:#f0f4f8;border-bottom:3px solid #879D1F;padding:11px 32px;display:flex;align-items:center;flex-wrap:wrap;gap:0">
  <div style="font-size:11px;color:#374151;padding-right:16px;border-right:1px solid #cbd5e0;margin-right:16px"><strong style="color:#031632">Report:</strong> ${reportName}</div>
  <div style="font-size:11px;color:#374151;padding-right:16px;border-right:1px solid #cbd5e0;margin-right:16px"><strong style="color:#031632">Period:</strong> ${dateRangeLabel}</div>
  <div style="font-size:11px;color:#374151;padding-right:16px;border-right:1px solid #cbd5e0;margin-right:16px"><strong style="color:#031632">Scope:</strong> ${geo}</div>
  <div style="font-size:11px;color:#374151;padding-right:16px;border-right:1px solid #cbd5e0;margin-right:16px"><strong style="color:#031632">Generated:</strong> ${now.toLocaleString('en-GB', { dateStyle: 'long', timeStyle: 'short' })}</div>
  <div style="font-size:11px;color:#374151"><strong style="color:#031632">Prepared by:</strong> ${generatorName}</div>
  <div style="margin-left:auto;background:#879D1F;color:#fff;font-size:10px;font-weight:700;letter-spacing:0.07em;text-transform:uppercase;padding:5px 12px;border-radius:4px">${reportType}</div>
</div>

<!-- ═══ CONTENT ═══ -->
<div style="padding:26px 32px">

  <!-- KPI Cards -->
  <div style="font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:0.1em;color:#031632;border-bottom:2px solid #879D1F;padding-bottom:6px;margin-bottom:14px" class="no-break">Summary KPIs — ${dateRangeLabel}</div>
  <div style="display:grid;grid-template-columns:repeat(4,1fr);gap:12px;margin-bottom:26px" class="no-break">
    <div style="background:rgba(33,150,200,0.10);border-left:4px solid #2196C8;border-radius:8px;padding:14px">
      <div style="font-size:28px;font-weight:800;font-family:monospace;color:#2196C8;line-height:1;margin-bottom:5px">7.4m</div>
      <div style="font-size:11px;font-weight:600;color:#1a7aa8">Avg Response Time</div>
      <div style="font-size:10px;color:#2196C8;margin-top:2px">Target: &lt; 8 min</div>
    </div>
    <div style="background:rgba(61,170,106,0.12);border-left:4px solid #3DAA6A;border-radius:8px;padding:14px">
      <div style="font-size:28px;font-weight:800;font-family:monospace;color:#3DAA6A;line-height:1;margin-bottom:5px">88%</div>
      <div style="font-size:11px;font-weight:600;color:#2d8050">Within Target</div>
      <div style="font-size:10px;color:#3DAA6A;margin-top:2px">Threshold: 85%</div>
    </div>
    <div style="background:rgba(135,157,31,0.12);border-left:4px solid #879D1F;border-radius:8px;padding:14px">
      <div style="font-size:28px;font-weight:800;font-family:monospace;color:#879D1F;line-height:1;margin-bottom:5px">91%</div>
      <div style="font-size:11px;font-weight:600;color:#6a7b17">Dispatch Accuracy</div>
      <div style="font-size:10px;color:#879D1F;margin-top:2px">vs 89% last period</div>
    </div>
    <div style="background:rgba(212,160,23,0.12);border-left:4px solid #D4A017;border-radius:8px;padding:14px">
      <div style="font-size:28px;font-weight:800;font-family:monospace;color:#D4A017;line-height:1;margin-bottom:5px">247</div>
      <div style="font-size:11px;font-weight:600;color:#a07c12">Total Incidents</div>
      <div style="font-size:10px;color:#D4A017;margin-top:2px">${geo}</div>
    </div>
  </div>

  <!-- Incident Breakdown -->
  <div style="font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:0.1em;color:#031632;border-bottom:2px solid #879D1F;padding-bottom:6px;margin-bottom:12px" class="no-break">Incident Performance Breakdown — ${dateRangeLabel}</div>
  <table style="width:100%;border-collapse:collapse;margin-bottom:22px;font-size:12px" class="no-break">
    <thead>
      <tr style="background:#031632;color:#fff">
        <th style="padding:10px 14px;text-align:center;font-size:11px;font-weight:600;letter-spacing:0.04em;width:48px">#</th>
        <th style="padding:10px 14px;text-align:left;font-size:11px;font-weight:600">Incident Type</th>
        <th style="padding:10px 14px;text-align:left;font-size:11px;font-weight:600">Avg Response Time</th>
        <th style="padding:10px 14px;text-align:left;font-size:11px;font-weight:600">Target</th>
        <th style="padding:10px 14px;text-align:left;font-size:11px;font-weight:600">Status</th>
      </tr>
    </thead>
    <tbody>${incidentTableRows}</tbody>
  </table>

  <!-- Response Trend (first 10 days) -->
  <div style="font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:0.1em;color:#031632;border-bottom:2px solid #879D1F;padding-bottom:6px;margin-bottom:12px" class="no-break">Response Time Trend — First 10 Days of Period</div>
  <table style="width:100%;border-collapse:collapse;margin-bottom:22px;font-size:12px" class="no-break">
    <thead>
      <tr style="background:#031632;color:#fff">
        <th style="padding:8px 12px;text-align:left;font-size:11px;font-weight:600">Day</th>
        <th style="padding:8px 12px;text-align:center;font-size:11px;font-weight:600;color:#6fcae8">Nyarugenge</th>
        <th style="padding:8px 12px;text-align:center;font-size:11px;font-weight:600;color:#c8d865">Kicukiro</th>
        <th style="padding:8px 12px;text-align:center;font-size:11px;font-weight:600;color:#7dd4a8">Gasabo</th>
      </tr>
    </thead>
    <tbody>${trendRows}</tbody>
  </table>

  <!-- SIGNATURE / AUTHORIZATION -->
  <div style="border-top:2px solid #879D1F;padding-top:20px;margin-top:8px" class="no-break">
    <div style="font-size:10px;font-weight:700;letter-spacing:0.1em;text-transform:uppercase;color:#031632;margin-bottom:18px">Authorization &amp; Certification</div>
    <div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:24px;margin-bottom:20px">
      <div>
        <div style="font-size:10px;color:#6b7280;text-transform:uppercase;letter-spacing:0.06em;margin-bottom:28px">Prepared By (Analyst Name)</div>
        <div style="border-bottom:1.5px solid #374151;margin-bottom:5px"></div>
        <div style="font-size:11px;color:#031632;font-weight:600">${generatorName}</div>
        <div style="font-size:10px;color:#6b7280">${generatorRole}</div>
      </div>
      <div>
        <div style="font-size:10px;color:#6b7280;text-transform:uppercase;letter-spacing:0.06em;margin-bottom:28px">Signature</div>
        <div style="border-bottom:1.5px solid #374151;margin-bottom:5px"></div>
        <div style="font-size:10px;color:#9ca3af;font-style:italic">Sign above</div>
      </div>
      <div>
        <div style="font-size:10px;color:#6b7280;text-transform:uppercase;letter-spacing:0.06em;margin-bottom:28px">Date Signed</div>
        <div style="border-bottom:1.5px solid #374151;margin-bottom:5px"></div>
        <div style="font-size:11px;color:#374151">${now.toLocaleDateString('en-GB', { year: 'numeric', month: 'long', day: 'numeric' })}</div>
      </div>
    </div>
    <div style="display:grid;grid-template-columns:1fr 1fr auto;gap:24px;align-items:flex-start">
      <div>
        <div style="font-size:10px;color:#6b7280;text-transform:uppercase;letter-spacing:0.06em;margin-bottom:28px">Reviewing Officer / Supervisor</div>
        <div style="border-bottom:1.5px solid #374151;margin-bottom:5px"></div>
        <div style="font-size:10px;color:#9ca3af;font-style:italic">Print name and sign</div>
      </div>
      <div>
        <div style="font-size:10px;color:#6b7280;text-transform:uppercase;letter-spacing:0.06em;margin-bottom:28px">Reviewer Signature &amp; Date</div>
        <div style="border-bottom:1.5px solid #374151;margin-bottom:5px"></div>
        <div style="font-size:10px;color:#9ca3af;font-style:italic">Sign and date above</div>
      </div>
      <div style="text-align:center;min-width:110px">
        <div style="font-size:10px;color:#6b7280;text-transform:uppercase;letter-spacing:0.06em;margin-bottom:6px">Official Stamp / Seal</div>
        <div style="border:2px dashed #cbd5e0;border-radius:8px;height:72px;display:flex;align-items:center;justify-content:center;color:#9ca3af;font-size:9px;text-transform:uppercase;letter-spacing:0.1em;font-weight:600;text-align:center;line-height:1.4">Place<br>Official<br>Stamp Here</div>
      </div>
    </div>
  </div>

  <!-- FOOTER -->
  <div style="margin-top:22px;padding-top:12px;border-top:1px solid #e2e8f0;display:flex;justify-content:space-between;align-items:center">
    <div style="font-size:10px;color:#9ca3af;line-height:1.6">
      RESQ Analytics System · Rwanda National Police · Emergency Response Division<br>
      Report ID: ${reportId} · Generated ${now.toISOString()} · Scope: ${geo}
    </div>
    <div style="background:rgba(61,170,106,0.12);border:1px solid #3DAA6A;border-radius:4px;padding:4px 10px;color:#3DAA6A;font-size:10px;font-weight:700;white-space:nowrap">
      &#10003; Valid RNP Document
    </div>
  </div>

</div>
<script>window.onload=function(){window.print();}<\/script>
</body></html>`

    const win = window.open('', '_blank')
    if (!win) { showToast('Allow pop-ups to export PDF.'); return }
    win.document.write(html)
    win.document.close()
    showToast('Print dialog opened — save as PDF.')
  }

  function generateReport() {
    const currentUser = getCurrentUser()
    const selectedMetrics = ANALYST_REPORT_METRICS.filter((m) => metrics[m.id]).map((m) => m.label)
    const reportName = reportNameRef.current?.value || 'Untitled Report'
    const timestamp = new Date().toISOString()
    const reportId = Math.random().toString(36).slice(2, 10)
    const report = {
      report_id: reportId,
      report_type: 'ANALYST_CUSTOM',
      created_by: currentUser?.user_id ?? null,
      creator_role: 'analyst',
      district_id: currentUser?.district_id ?? null,
      period: range,
      total_incidents: null,
      avg_response_time: null,
      coverage_score: null,
      dispatch_accuracy: null,
      escalations: null,
      content: reportName + ' (' + selectedMetrics.join(', ') + ')',
      status: 'GENERATED',
      created_at: timestamp,
      submitted_at: null,
    }
    mockReports.push(report)
    ANALYST_LIBRARY_ROWS.unshift({
      report_name: reportName,
      report_type: 'ANALYST_CUSTOM',
      district: geo,
      created_by: currentUser?.full_name || 'You',
      created_at: new Date().toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' }),
      shared_with: '—',
    })
    setLastReportId(reportId)
    showToast('Report generated.')
  }

  function postToLibrary() {
    if (!lastReportId) return
    const idx = mockReports.findIndex((r) => r.report_id === lastReportId)
    if (idx !== -1) mockReports[idx].status = 'PUBLISHED'
    const currentUser = getCurrentUser()
    const timestamp = new Date().toISOString()
    addNotification({
      id: 'notif-' + Math.random().toString(36).slice(2, 10),
      type: 'ANALYST_REPORT_PUBLISHED',
      target_role: 'super_admin',
      title: 'Analyst Report Published',
      message: 'Analyst posted a custom report to the Report Library.',
      timestamp,
      read: false,
    })
    showToast('Report published to library.')
  }

  return (
    <div className="flex flex-col min-w-[1024px] -mx-0">
      <div className="portal-page pb-0">
        <AnalystPageHeader
          title="Custom Report Builder"
          subtitle="Build any report from any combination of system data."
          badge="Reports"
        />
      </div>
    <div className="analyst-report-builder flex min-h-[calc(100vh-120px)]">
      <aside
        className="w-[280px] shrink-0 border-r border-(--border) bg-(--bg-surface) p-4 overflow-y-auto"
        style={{ maxHeight: 'calc(100vh - 120px)' }}
      >
        <div className="flex flex-col gap-3">
          <label className="dispatcher-field">
            <span className="text-[12px] font-medium">Report name</span>
            <input ref={reportNameRef} className="dispatcher-input h-10" placeholder="e.g. Weekly Kigali Response Time Summary" />
          </label>
          <label className="dispatcher-field">
            <span className="text-[12px] font-medium">Report type</span>
            <select className="dispatcher-input h-10" value={reportType} onChange={(e) => setReportType(e.target.value)}>
              <option>Incident Analysis</option>
              <option>Resource Utilization</option>
              <option>Response Time Performance</option>
              <option>Coverage Analysis</option>
              <option>Unit &amp; Officer Performance</option>
              <option>AI Model Performance</option>
              <option>Cross-District Comparison</option>
              <option>Executive Summary</option>
            </select>
          </label>
          <div className="flex gap-2">
            <input type="date" className="dispatcher-input h-10 flex-1" defaultValue="2026-05-01" />
            <input type="date" className="dispatcher-input h-10 flex-1" defaultValue="2026-05-28" />
          </div>
          <div className="flex gap-1 overflow-x-auto pb-1">
            {QUICK_RANGES.map((r) => (
              <button
                key={r}
                type="button"
                className="text-[10px] font-semibold px-2 py-1 rounded-full border shrink-0 cursor-pointer"
                style={{
                  background: range === r ? 'var(--accent-ghost)' : 'var(--bg-elevated)',
                  borderColor: range === r ? 'var(--accent)' : 'var(--border)',
                  color: range === r ? 'var(--accent)' : 'var(--text-secondary)',
                }}
                onClick={() => setRange(r)}
              >
                {r}
              </button>
            ))}
          </div>
          <label className="dispatcher-field">
            <span className="text-[12px] font-medium">Geographic scope</span>
            <select className="dispatcher-input h-10" value={geo} onChange={(e) => setGeo(e.target.value)}>
              <option>All Rwanda</option>
              <option>By Province</option>
              <option>By District</option>
              <option>Multiple Districts</option>
            </select>
          </label>
          {geo === 'By District' && (
            <div className="max-h-[150px] overflow-y-auto border border-(--border) rounded-lg p-2 space-y-1">
              {ANALYST_RWANDA_DISTRICTS.map((d) => (
                <label key={d} className="flex items-center gap-2 text-[12px] cursor-pointer">
                  <input type="checkbox" defaultChecked={['Gasabo', 'Kicukiro', 'Nyarugenge'].includes(d)} />
                  {d}
                </label>
              ))}
            </div>
          )}
          <div>
            <div className="font-semibold text-[12px] mb-2">Include Metrics</div>
            <div className="max-h-[180px] overflow-y-auto space-y-1.5">
              {ANALYST_REPORT_METRICS.map((m) => (
                <label key={m.id} className="flex items-center gap-2 text-[13px] cursor-pointer">
                  <input type="checkbox" checked={metrics[m.id]} onChange={() => toggleMetric(m.id)} />
                  {m.label}
                </label>
              ))}
            </div>
          </div>
          <div className="flex gap-2">
            <select className="dispatcher-input h-9 flex-1 text-[12px]" defaultValue="District">
              <option>District</option>
              <option>Incident Type</option>
              <option>Time Period</option>
              <option>Unit</option>
            </select>
            <select className="dispatcher-input h-9 flex-1 text-[12px]" defaultValue="Daily">
              <option>Daily</option>
              <option>Weekly</option>
              <option>Monthly</option>
            </select>
          </div>
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
          <label className="flex items-center gap-2 text-[12px]"><input type="checkbox" defaultChecked /> Show benchmark lines</label>
          <label className="flex items-center gap-2 text-[12px]"><input type="checkbox" defaultChecked /> Show trend lines</label>
          <label className="flex items-center gap-2 text-[12px]"><input type="checkbox" /> AI recommendation overlay</label>
          <button type="button" className="dispatcher-btn-primary w-full h-12 font-bold text-[13px] inline-flex items-center justify-center gap-2" onClick={generateReport}>
            <Play size={16} />
            GENERATE REPORT
          </button>
        </div>
      </aside>

      <div className="flex-1 min-w-0 overflow-y-auto p-6">
        <p className="font-mono text-[12px] uppercase tracking-wider m-0" style={{ color: 'var(--accent)' }}>
          RESPONSE TIME PERFORMANCE REPORT
        </p>
        <h2 className="text-[18px] font-bold m-0 mt-1">Kigali City — All Districts</h2>
        <p className="text-[12px] text-(--text-muted) m-0">May 1–28, 2026 · Generated 14:32</p>
        <hr className="border-(--border) my-4" />

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
          {[
            { v: '7.4m', l: 'Avg Response' },
            { v: '88%', l: 'Within Target' },
            { v: '91%', l: 'Dispatch Accuracy' },
            { v: '247', l: 'Total Incidents' },
          ].map((k) => (
            <div key={k.l} className="dispatcher-metric-card p-3">
              <div className="dispatcher-metric-value text-[22px]">{k.v}</div>
              <div className="text-[12px] text-(--text-secondary)">{k.l}</div>
            </div>
          ))}
        </div>

        <div className="dispatcher-surface p-4 mb-6">
          <h3 className="text-[13px] font-semibold m-0 mb-3">Response Time Trend — Last 30 Days</h3>
          <ResponsiveContainer width="100%" height={240}>
            <ReLineChart data={ANALYST_RESPONSE_TREND}>
              <CartesianGrid stroke="var(--border-subtle)" />
              <XAxis dataKey="day" tick={{ fontSize: 10 }} />
              <YAxis domain={[0, 15]} tick={{ fontSize: 10 }} unit="m" />
              <Tooltip />
              <ReferenceLine y={8} stroke="var(--status-critical)" strokeDasharray="4 4" label="Target" />
              <Line type="monotone" dataKey="nyarugenge" stroke="var(--accent)" dot={false} strokeWidth={2} />
              <Line type="monotone" dataKey="kicukiro" stroke="var(--status-info)" dot={false} strokeWidth={2} />
              <Line type="monotone" dataKey="gasabo" stroke="var(--status-medium)" dot={false} strokeWidth={2} />
            </ReLineChart>
          </ResponsiveContainer>
        </div>

        <div className="dispatcher-surface overflow-x-auto mb-6">
          <table className="w-full text-[12px] border-collapse min-w-[520px]">
            <thead>
              <tr className="border-b border-(--border) text-(--text-muted)">
                <th className="text-left p-3">District</th>
                <th className="text-left p-3">Avg Response</th>
                <th className="text-left p-3">Within Target</th>
                <th className="text-left p-3">Incident Count</th>
                <th className="text-left p-3">vs Last Month</th>
              </tr>
            </thead>
            <tbody>
              {ANALYST_DISTRICT_BREAKDOWN.map((row) => (
                <tr key={row.district} className="border-b border-(--border-subtle) dispatcher-table-row">
                  <td className="p-3 font-medium">{row.district}</td>
                  <td className="p-3 font-mono">{row.avg}</td>
                  <td className="p-3">{row.target}</td>
                  <td className="p-3 font-mono">{row.count}</td>
                  <td
                    className="p-3 font-mono"
                    style={{
                      color:
                        row.improved === true
                          ? 'var(--status-low)'
                          : row.improved === false
                            ? 'var(--status-critical)'
                            : 'var(--text-muted)',
                    }}
                  >
                    {row.vs}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div
          className="rounded-lg p-4 flex gap-3"
          style={{ background: 'var(--accent-ghost)', border: '1px solid var(--accent)' }}
        >
          <Brain size={20} style={{ color: 'var(--accent)' }} className="shrink-0" />
          <div>
            <div className="font-semibold text-[13px]">AI-Detected Pattern</div>
            <p className="text-[13px] text-(--text-secondary) m-0 mt-1 leading-relaxed">
              Response times in Kicukiro show a consistent 1.8-minute increase on Fridays between 16:00–20:00,
              correlating with school traffic on KN 5 Avenue.
            </p>
          </div>
        </div>
      </div>

      <aside className="w-[240px] shrink-0 border-l border-(--border) p-4 sticky top-0 self-start overflow-y-auto" style={{ maxHeight: 'calc(100vh - 120px)' }}>
        <h3 className="font-semibold text-[13px] m-0 mb-4">Export & Share</h3>
        <button type="button" className="dispatcher-btn-primary w-full mb-2 inline-flex items-center justify-center gap-2" onClick={exportPDF}>
          <Download size={14} />
          Export PDF
        </button>
        <button type="button" className="dispatcher-btn-ghost w-full mb-2 inline-flex items-center justify-center gap-2" onClick={exportCSV}>
          <Table size={14} />
          Export CSV / Excel
        </button>
        <button type="button" className="dispatcher-btn-ghost w-full mb-2 inline-flex items-center justify-center gap-2">
          <UserPlus size={14} />
          Share with Commander
        </button>
        <button type="button" className="dispatcher-btn-ghost w-full mb-2 inline-flex items-center justify-center gap-2" onClick={postToLibrary} disabled={!lastReportId}>
          <Library size={14} />
          Post to Report Library
        </button>
        {apiReports.length > 0 && (
          <div className="mt-1 mb-2">
            <div className="text-[10px] font-mono text-(--text-muted) mb-1">LIBRARY ({apiReports.length})</div>
            <div className="max-h-[120px] overflow-y-auto flex flex-col gap-1">
              {apiReports.slice(0, 5).map((r) => (
                <div key={r.report_id} className="text-[10px] text-(--text-secondary) px-2 py-1 rounded" style={{ background: 'var(--bg-elevated)' }}>
                  <div className="font-medium truncate">{r.report_type}</div>
                  <div className="text-(--text-muted)">{r.district_name || '—'} · {r.status}</div>
                </div>
              ))}
            </div>
          </div>
        )}
        <hr className="border-(--border) my-3" />
        <div className="font-semibold text-[12px] mb-2">Schedule Report</div>
        <select className="dispatcher-input h-9 w-full text-[12px] mb-2">
          <option>Weekly</option>
          <option>Daily</option>
          <option>Monthly</option>
          <option>Quarterly</option>
        </select>
        <input type="time" className="dispatcher-input h-9 w-full mb-2" defaultValue="07:00" />
        <input className="dispatcher-input h-9 w-full mb-2" placeholder="Add emails or roles..." />
        {/* NOTE: Report scheduling has no report_schedules table in the schema.
             Save Schedule is decorative until the table is added. */}
        <button type="button" className="dispatcher-btn-outline w-full text-[12px]">Save Schedule</button>
      </aside>
    </div>
    <SettingsToast show={!!toast} message={toast} />
    </div>
  )
}

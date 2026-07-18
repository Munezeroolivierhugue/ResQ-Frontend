import { useState, useEffect } from 'react'
import { MapContainer, TileLayer, Circle, Popup } from 'react-leaflet'
import { BarChart, Bar, XAxis, YAxis, ResponsiveContainer, Cell } from 'recharts'
import { Download } from 'lucide-react'
import { useThemeStore } from '../../store/themeStore'
import MapInvalidateSize from '../../components/map/MapInvalidateSize'
import AnalystPageHeader from '../../components/analyst/AnalystPageHeader'
import { getHotspots, getIncidentTimeDistribution } from '../../api/planning'
import { getAnomalies } from '../../api/reporting'
import { listDistricts } from '../../api/districts'
import { listIncidents } from '../../api/incidents'
import { formatIncidentType } from '../../utils/incidentTypeLabels'
import { heatmapFill } from '../../data/mockPlannerData'
import 'leaflet/dist/leaflet.css'

const KIGALI_CENTER = [-1.9536, 30.0606]
const TABS = ['Spatial Clustering', 'Temporal Analysis', 'Type Composition', 'Anomaly Detection']
const PERIODS = [{ label: '7 Days', days: 7 }, { label: '30 Days', days: 30 }, { label: '6 Months', days: 182 }, { label: '1 Year', days: 365 }]
const INCIDENT_TYPES = ['All Types', 'MEDICAL', 'FIRE', 'RTA', 'SECURITY', 'DISASTER', 'OTHER']

function barColor(value, max) {
  if (!max) return 'var(--accent)'
  const t = value / max
  if (t > 0.75) return 'var(--status-critical)'
  if (t > 0.5) return 'var(--status-medium)'
  return 'var(--accent)'
}

const TYPE_COLORS = ['var(--status-critical)', 'var(--status-high)', 'var(--status-info)', 'var(--status-medium)', 'var(--accent)', 'var(--text-muted)']

export default function AnalystPatterns() {
  const { theme } = useThemeStore()
  const [tab, setTab] = useState(TABS[0])
  const [period, setPeriod] = useState(PERIODS[1])
  const [districts, setDistricts] = useState([])
  const [districtId, setDistrictId] = useState('')
  const [incidentType, setIncidentType] = useState('All Types')
  const [loading, setLoading] = useState(true)

  const [hotspots, setHotspots] = useState([])
  const [timeDist, setTimeDist] = useState({ by_hour: [], by_day: [], by_month: [] })
  const [typeComposition, setTypeComposition] = useState([])

  const [anomalies, setAnomalies] = useState([])
  const [anomaliesMeta, setAnomaliesMeta] = useState(null)
  const [anomaliesLoading, setAnomaliesLoading] = useState(true)

  useEffect(() => {
    listDistricts().then(setDistricts).catch(() => {})
  }, [])

  useEffect(() => {
    getAnomalies()
      .then((res) => {
        setAnomalies(res.anomalies)
        setAnomaliesMeta(res)
      })
      .catch(() => {
        setAnomalies([])
        setAnomaliesMeta(null)
      })
      .finally(() => setAnomaliesLoading(false))
  }, [])

  useEffect(() => {
    Promise.resolve().then(() => setLoading(true))
    const params = {
      days: period.days,
      districtId: districtId || undefined,
      incidentType: incidentType !== 'All Types' ? incidentType : undefined,
    }
    Promise.allSettled([
      getHotspots(params),
      getIncidentTimeDistribution(params),
      listIncidents(districtId ? { districtId } : {}),
    ]).then(([hotspotsRes, distRes, incidentsRes]) => {
      setHotspots(hotspotsRes.status === 'fulfilled' ? [...hotspotsRes.value].sort((a, b) => b.count - a.count) : [])
      setTimeDist(distRes.status === 'fulfilled' ? distRes.value : { by_hour: [], by_day: [], by_month: [] })

      if (incidentsRes.status === 'fulfilled') {
        const since = new Date(Date.now() - period.days * 86400000).toISOString().slice(0, 10)
        const scoped = incidentsRes.value.filter((i) => i.call_time && i.call_time.slice(0, 10) >= since
          && (incidentType === 'All Types' || i.incident_type === incidentType))
        const counts = {}
        for (const i of scoped) {
          const key = i.incident_type ?? 'OTHER'
          counts[key] = (counts[key] ?? 0) + 1
        }
        const total = scoped.length
        setTypeComposition(
          Object.entries(counts)
            .map(([type, count]) => ({ type, count, pct: total ? Math.round((count / total) * 100) : 0 }))
            .sort((a, b) => b.count - a.count)
        )
      }
    }).finally(() => setLoading(false))
  }, [period, districtId, incidentType])

  function exportSpatialCSV() {
    const escape = (v) => `"${String(v ?? '').replace(/"/g, '""')}"`
    const rows = [
      ['RESQ — Incident Pattern Analysis Export'],
      ['Period', period.label],
      ['Generated', new Date().toLocaleString()],
      [],
      ['TOP HOTSPOTS (real, from recorded incidents)'],
      ['Zone', 'Incident Count', 'Top Type', 'Density', 'vs Prior Period'],
      ...hotspots.map((h) => [h.name, h.count, h.top_type, h.density, h.increase_pct != null ? `${h.increase_pct}%` : '—']),
      [],
      ['INCIDENTS BY HOUR OF DAY'],
      ['Hour', 'Incident Count'],
      ...timeDist.by_hour.map((d) => [d.label, d.count]),
      [],
      ['INCIDENTS BY DAY OF WEEK'],
      ['Day', 'Incident Count'],
      ...timeDist.by_day.map((d) => [d.label, d.count]),
    ]
    const csv = rows.map((row) => row.map(escape).join(',')).join('\n')
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `incident_patterns_${period.label.replace(/\s+/g, '_')}.csv`
    a.click()
    URL.revokeObjectURL(url)
  }

  const hourMax = Math.max(0, ...timeDist.by_hour.map((d) => d.count))
  const dayMax = Math.max(0, ...timeDist.by_day.map((d) => d.count))
  const monthMax = Math.max(0, ...timeDist.by_month.map((d) => d.count))
  const peakHour = [...timeDist.by_hour].sort((a, b) => b.count - a.count)[0]
  const peakDay = [...timeDist.by_day].sort((a, b) => b.count - a.count)[0]

  return (
    <div className="portal-page flex flex-col gap-4 min-w-[1024px]">
      <AnalystPageHeader
        title="Incident Pattern Analysis"
        subtitle="Real spatial clustering and temporal patterns, from recorded incidents."
        badge="Pattern Analysis"
      />

      <div className="flex flex-col lg:flex-row gap-6 items-start">
        <div className="w-full lg:w-[320px] shrink-0 bg-(--bg-surface) border border-(--border) rounded-2xl p-5 shadow-[var(--shadow-card)] flex flex-col gap-5">
          <div>
            <h3 className="text-[14px] font-bold text-(--text-primary) mb-1 uppercase tracking-wider" style={{ fontFamily: 'var(--font-display)' }}>Pattern Filters</h3>
            <p className="text-[11px] text-(--text-muted) mb-5">Refine the analysis scope and datasets</p>

            <div className="flex flex-col gap-4">
              <div>
                <label className="block text-[11px] font-semibold text-(--text-secondary) mb-1.5 tracking-wide">Incident Type</label>
                <select className="dispatcher-input dispatcher-select w-full h-10 text-[12px] bg-(--bg-input)" value={incidentType} onChange={(e) => setIncidentType(e.target.value)}>
                  {INCIDENT_TYPES.map((t) => (
                    <option key={t} value={t}>{t === 'All Types' ? t : formatIncidentType(t)}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-(--text-secondary) mb-1.5 tracking-wide">District</label>
                <select className="dispatcher-input dispatcher-select w-full h-10 text-[12px] bg-(--bg-input)" value={districtId} onChange={(e) => setDistrictId(e.target.value)}>
                  <option value="">All Districts</option>
                  {districts.map((d) => <option key={d.district_id} value={d.district_id}>{d.name}</option>)}
                </select>
              </div>

              <hr className="border-(--border-subtle) my-2" />

              <div>
                <label className="block text-[11px] font-semibold text-(--text-secondary) mb-2 tracking-wide">Time Period</label>
                <div className="flex bg-(--bg-input) p-1 rounded-xl border border-(--border-subtle)">
                  {PERIODS.map((p) => (
                    <button
                      key={p.label}
                      type="button"
                      className={`flex-1 text-[11px] font-semibold py-2 rounded-lg transition-all border-none cursor-pointer ${
                        period.label === p.label
                          ? 'bg-(--bg-surface) text-(--text-primary) shadow-[0_1px_2px_rgba(0,0,0,0.05)] border border-(--border)'
                          : 'bg-transparent text-(--text-muted) hover:text-(--text-primary)'
                      }`}
                      onClick={() => setPeriod(p)}
                    >
                      {p.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="flex-1 flex flex-col gap-4 min-w-0">
          <div className="flex flex-wrap gap-1 border-b border-(--border) pb-2">
            {TABS.map((t) => (
              <button
                key={t}
                type="button"
                className="text-[12px] font-semibold px-4 py-2 rounded-t cursor-pointer border-none"
                style={{
                  background: tab === t ? 'var(--accent-ghost)' : 'transparent',
                  color: tab === t ? 'var(--accent)' : 'var(--text-secondary)',
                  borderBottom: tab === t ? '2px solid var(--accent)' : '2px solid transparent',
                }}
                onClick={() => setTab(t)}
              >
                {t}
              </button>
            ))}
          </div>

          {tab === 'Spatial Clustering' && (
            <div className="flex flex-col lg:flex-row gap-4">
              <div className="dispatcher-surface p-4 lg:flex-[65] min-w-0">
                <div className="flex justify-between items-center mb-3">
                  <h3 className="text-[13px] font-semibold m-0">Incident Density Heat Map</h3>
                  <button type="button" className="dispatcher-btn-ghost text-[11px] h-8 px-2 inline-flex items-center gap-1" onClick={exportSpatialCSV}>
                    <Download size={12} />
                    Export CSV
                  </button>
                </div>
                <MapContainer center={KIGALI_CENTER} zoom={12} style={{ height: 380, width: '100%' }}>
                  <TileLayer
                    url={theme === 'dark' ? 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png' : 'https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png'}
                    attribution="&copy; CARTO"
                  />
                  <MapInvalidateSize />
                  {hotspots.map((z) => (
                    <Circle key={z.name} center={[z.lat, z.lng]} radius={900} pathOptions={{ fillColor: heatmapFill(z.density), fillOpacity: 1, stroke: false }}>
                      <Popup><strong>{z.name}</strong><br />{z.count} incidents · {formatIncidentType(z.top_type)}</Popup>
                    </Circle>
                  ))}
                </MapContainer>
                {!loading && hotspots.length === 0 && (
                  <p className="text-[12px] text-(--text-muted) text-center mt-2 mb-0">No incidents recorded for this filter/period.</p>
                )}
              </div>
              <div className="dispatcher-surface p-4 lg:flex-[35] min-w-0">
                <h3 className="text-[13px] font-semibold m-0 mb-3">Top Hotspots — {period.label}</h3>
                {loading && <p className="text-[12px] text-(--text-muted) m-0">Loading…</p>}
                {!loading && hotspots.length === 0 && <p className="text-[12px] text-(--text-muted) m-0">No hotspots for this filter.</p>}
                {hotspots.slice(0, 10).map((h, i) => (
                  <div key={h.name} className="flex items-center gap-2 py-2 border-b border-(--border-subtle) last:border-0">
                    <span className="font-mono font-bold text-[16px] w-6" style={{ color: 'var(--accent)' }}>{i + 1}</span>
                    <span className="flex-1 font-medium text-[13px] truncate">{h.name}</span>
                    <span className="font-mono text-[12px]">{h.count}</span>
                    {h.increase_pct != null && (
                      <span className="text-[11px] font-semibold" style={{ color: h.increase_pct > 0 ? 'var(--status-critical)' : 'var(--status-low)' }}>
                        {h.increase_pct > 0 ? '↑' : h.increase_pct < 0 ? '↓' : '→'} {Math.abs(h.increase_pct)}%
                      </span>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {tab === 'Temporal Analysis' && (
            <>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {[
                  { title: 'Incidents by Hour', data: timeDist.by_hour, max: hourMax },
                  { title: 'Incidents by Day of Week', data: timeDist.by_day, max: dayMax },
                  { title: 'Incidents by Month', data: timeDist.by_month, max: monthMax },
                ].map((chart) => (
                  <div key={chart.title} className="dispatcher-surface p-4">
                    <h4 className="text-[12px] text-(--text-muted) m-0 mb-2">{chart.title}</h4>
                    <ResponsiveContainer width="100%" height={180}>
                      <BarChart data={chart.data}>
                        <XAxis dataKey="label" tick={{ fontSize: 10 }} interval="preserveStartEnd" />
                        <YAxis hide />
                        <Bar dataKey="count" radius={[2, 2, 0, 0]}>
                          {chart.data.map((entry, i) => <Cell key={i} fill={barColor(entry.count, chart.max)} />)}
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                ))}
              </div>
              <div className="rounded-lg p-4" style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border)' }}>
                <div className="font-semibold text-[13px]">Real Observations — {period.label}</div>
                {(hourMax === 0 && dayMax === 0) ? (
                  <p className="text-[13px] text-(--text-secondary) m-0 mt-1">No incidents with a recorded time in this period.</p>
                ) : (
                  <p className="text-[13px] text-(--text-secondary) m-0 mt-1">
                    {peakHour && peakHour.count > 0 && <>Busiest hour: <strong className="text-(--text-primary)">{peakHour.label}</strong> ({peakHour.count} incidents). </>}
                    {peakDay && peakDay.count > 0 && <>Busiest day: <strong className="text-(--text-primary)">{peakDay.label}</strong> ({peakDay.count} incidents).</>}
                  </p>
                )}
              </div>
            </>
          )}

          {tab === 'Anomaly Detection' && (
            <div className="dispatcher-surface p-4">
              <div className="flex flex-wrap justify-between gap-2 items-start mb-1">
                <h3 className="text-[13px] font-semibold m-0">Real Anomaly Detection</h3>
                {anomaliesMeta?.total_analyzed > 0 && (
                  <span className="text-[11px] text-(--text-muted)">
                    {anomalies.length} of {anomaliesMeta.total_analyzed} real incidents flagged
                  </span>
                )}
              </div>
              <p className="text-[11px] text-(--text-muted) m-0 mb-3">
                A real IsolationForest model, retrained on every load from every real (non-synthetic) incident —
                flags statistically unusual response-time / time-of-day / type / district combinations.
              </p>
              {anomaliesLoading && <p className="text-[12px] text-(--text-muted) m-0">Loading…</p>}
              {!anomaliesLoading && anomaliesMeta?.message && (
                <p className="text-[12px] text-(--text-muted) m-0">{anomaliesMeta.message}</p>
              )}
              {!anomaliesLoading && !anomaliesMeta?.message && anomalies.length === 0 && (
                <p className="text-[12px] text-(--text-muted) m-0">No anomalies flagged in the current real incident data.</p>
              )}
              {anomalies.map((a) => (
                <div key={a.incident_id} className="flex items-start gap-3 py-2.5 border-t border-(--border-subtle) first:border-0">
                  <span className="font-mono text-[11px] px-2 py-1 rounded shrink-0" style={{ background: 'var(--status-critical-bg)', color: 'var(--status-critical)' }}>
                    {a.anomaly_score.toFixed(2)}
                  </span>
                  <div className="min-w-0">
                    <div className="text-[12px] font-semibold">
                      {a.incident_ref} · {formatIncidentType(a.incident_type)} · {a.district_name ?? 'Unknown district'}
                    </div>
                    <div className="text-[11px] text-(--text-secondary)">{a.reasoning}</div>
                  </div>
                </div>
              ))}
              {anomaliesMeta?.model_version && (
                <p className="text-[10px] text-(--text-muted) m-0 mt-3 font-mono truncate">{anomaliesMeta.model_version}</p>
              )}
            </div>
          )}

          {tab === 'Type Composition' && (
            <div className="dispatcher-surface p-4">
              <h3 className="text-[13px] font-semibold m-0 mb-1">Incident Type Composition — {period.label}</h3>
              <p className="text-[11px] text-(--text-muted) m-0 mb-3">Real counts from recorded incidents in this window.</p>
              {loading && <p className="text-[12px] text-(--text-muted) m-0">Loading…</p>}
              {!loading && typeComposition.length === 0 && <p className="text-[12px] text-(--text-muted) m-0">No incidents in this period.</p>}
              {typeComposition.map((t, i) => (
                <div key={t.type} className="flex items-center gap-3 py-2">
                  <span className="text-[12px] w-40 shrink-0 truncate">{formatIncidentType(t.type)}</span>
                  <div className="flex-1 h-2.5 rounded-full bg-(--bg-input) overflow-hidden">
                    <div className="h-full rounded-full" style={{ width: `${t.pct}%`, background: TYPE_COLORS[i % TYPE_COLORS.length] }} />
                  </div>
                  <span className="text-[11px] font-mono w-20 text-right text-(--text-secondary)">{t.count} ({t.pct}%)</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

import { useMemo } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { MapContainer, TileLayer, Circle, Tooltip } from 'react-leaflet'
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RTooltip,
  ReferenceLine,
  ResponsiveContainer,
  BarChart,
  Bar,
  Cell,
} from 'recharts'
import { AlertTriangle } from 'lucide-react'
import { useThemeStore } from '../../store/themeStore'
import { getCurrentUser } from '../../utils/authSession'
import { mockAuditLogs } from '../../data/mockAuditLogs'
import MapInvalidateSize from '../../components/map/MapInvalidateSize'
import PlannerPageHeader from '../../components/planner/PlannerPageHeader'
import StatusBadge from '../../components/dispatcher/StatusBadge'
import {
  PLANNER_COVERAGE_SECTORS,
  PLANNER_COVERAGE_GAPS,
  PLANNER_COVERAGE_TREND,
  PLANNER_HOURLY_COVERAGE,
  RWANDA_DISTRICTS,
  coverageColor,
} from '../../data/mockPlannerData'
import 'leaflet/dist/leaflet.css'

const KIGALI_CENTER = [-1.9536, 30.0606]

function sectorFill(pct) {
  if (pct >= 85) return 'rgba(61,170,106,0.25)'
  if (pct >= 65) return 'rgba(240,120,32,0.25)'
  return 'rgba(232,53,74,0.25)'
}

function hourBarColor(pct) {
  if (pct >= 90) return 'var(--accent)'
  if (pct >= 75) return 'var(--status-medium)'
  return 'var(--status-critical)'
}

export default function PlannerCoverage() {
  const { theme } = useThemeStore()
  const navigate = useNavigate()

  function handleCreatePlan(gap) {
    const currentUser = getCurrentUser()
    mockAuditLogs.push({
      log_id: Math.random().toString(36).slice(2, 10),
      user_id: currentUser?.user_id ?? null,
      timestamp: new Date().toISOString(),
      action: 'COVERAGE_GAP_TARGETED: ' + gap.zone,
      module: 'PLANNER',
      status: 'SUCCESS',
    })
    navigate(`/planner/deployment?zone=${encodeURIComponent(gap.zone)}`)
  }
  const gapCount = PLANNER_COVERAGE_GAPS.length

  const legend = useMemo(
    () => [
      { key: 'overall', label: 'Kigali overall', color: 'var(--accent)' },
      { key: 'gasabo', label: 'Gasabo', color: 'var(--status-info)' },
      { key: 'nyarugenge', label: 'Nyarugenge', color: 'var(--status-medium)' },
      { key: 'kicukiro', label: 'Kicukiro', color: 'var(--status-low)' },
    ],
    []
  )

  return (
    <div className="portal-page flex flex-col gap-4 min-w-[1024px]">
      <PlannerPageHeader
        title="Coverage Analysis"
        subtitle="Zone coverage vs 8-minute response target."
      />

      <div className="flex flex-col lg:flex-row gap-4">
        <div className="flex flex-col gap-4 min-w-0 lg:flex-1">
          <div className="dispatcher-surface p-4">
            <div className="flex flex-wrap justify-between gap-2 mb-3">
              <h3 className="text-[13px] font-semibold m-0">Live Coverage Map</h3>
              <select className="dispatcher-input h-9 w-40 text-[12px]">
                {RWANDA_DISTRICTS.map((d) => (
                  <option key={d}>{d}</option>
                ))}
              </select>
            </div>
            <MapContainer center={KIGALI_CENTER} zoom={12} style={{ height: 300, width: '100%' }}>
              <TileLayer
                url={
                  theme === 'dark'
                    ? 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png'
                    : 'https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png'
                }
                attribution="&copy; CARTO"
              />
              <MapInvalidateSize />
              {PLANNER_COVERAGE_SECTORS.map((s) => (
                <Circle
                  key={s.name}
                  center={[s.lat, s.lng]}
                  radius={850}
                  pathOptions={{
                    fillColor: sectorFill(s.coverage),
                    fillOpacity: 1,
                    color: coverageColor(s.coverage),
                    weight: 2,
                  }}
                >
                  <Tooltip>
                    {s.name} — {s.coverage}%
                  </Tooltip>
                </Circle>
              ))}
            </MapContainer>
          </div>

          <div className="dispatcher-surface p-4">
            <h3 className="text-[13px] font-semibold m-0 mb-3">Coverage Score — 12 Weeks</h3>
            <div style={{ height: 180, width: '100%' }}>
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={PLANNER_COVERAGE_TREND} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
                  <CartesianGrid stroke="var(--border-subtle)" strokeDasharray="3 3" />
                  <XAxis dataKey="week" tick={{ fontSize: 10, fill: 'var(--text-muted)' }} />
                  <YAxis domain={[50, 100]} tick={{ fontSize: 10, fill: 'var(--text-muted)' }} unit="%" />
                  <RTooltip contentStyle={{ background: 'var(--bg-surface)', border: '1px solid var(--border)' }} />
                  <ReferenceLine y={90} stroke="var(--status-medium)" strokeDasharray="4 4" />
                  <Line type="monotone" dataKey="overall" stroke="var(--accent)" strokeWidth={2} dot={false} />
                  <Line type="monotone" dataKey="gasabo" stroke="var(--status-info)" strokeWidth={1.5} dot={false} />
                  <Line type="monotone" dataKey="nyarugenge" stroke="var(--status-medium)" strokeWidth={1.5} dot={false} />
                  <Line type="monotone" dataKey="kicukiro" stroke="var(--status-low)" strokeWidth={1.5} dot={false} />
                </LineChart>
              </ResponsiveContainer>
            </div>
            <div className="flex flex-wrap gap-3 mt-2 text-[11px]">
              {legend.map((l) => (
                <span key={l.key} className="flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full" style={{ background: l.color }} />
                  {l.label}
                </span>
              ))}
            </div>
          </div>
        </div>

        <div className="flex flex-col gap-4 min-w-0 lg:flex-1">
          <div className="dispatcher-surface p-4 overflow-x-auto">
            <div className="flex items-center gap-2 mb-3">
              <AlertTriangle size={14} style={{ color: 'var(--status-critical)' }} />
              <h3 className="text-[13px] font-semibold m-0">Coverage Gaps — Below 90% Target</h3>
              <StatusBadge label={String(gapCount)} variant="critical" />
            </div>
            <table className="w-full text-[12px] border-collapse min-w-[480px]">
              <thead>
                <tr className="text-(--text-muted) text-left">
                  <th className="pb-2 font-medium">Zone</th>
                  <th className="pb-2 font-medium">Coverage</th>
                  <th className="pb-2 font-medium">Incidents</th>
                  <th className="pb-2 font-medium">Nearest Unit</th>
                  <th className="pb-2 font-medium">AI Recommendation</th>
                </tr>
              </thead>
              <tbody>
                {PLANNER_COVERAGE_GAPS.map((row) => (
                  <tr key={row.zone} className="border-t border-(--border-subtle)">
                    <td className="py-2 font-medium text-[13px]">{row.zone}</td>
                    <td className="py-2 font-mono font-semibold" style={{ color: coverageColor(row.coverage) }}>
                      {row.coverage}%
                    </td>
                    <td className="py-2 font-mono">{row.incidents}</td>
                    <td className="py-2 font-mono text-(--text-secondary)">
                      {row.unit} · {row.distance}
                    </td>
                    <td className="py-2">
                      <span className="text-(--text-secondary)">{row.rec}</span>
                      <button
                        type="button"
                        className="text-[11px] font-semibold text-(--accent) ml-1 bg-transparent border-0 p-0 cursor-pointer hover:underline"
                        onClick={() => handleCreatePlan(row)}
                      >
                        Create Plan →
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="dispatcher-surface p-4">
            <h3 className="text-[13px] font-semibold m-0">Coverage by Time of Day</h3>
            <p className="text-[12px] text-(--text-secondary) m-0 mt-1 mb-3">
              Identify weak periods for overnight planning
            </p>
            <div style={{ height: 140, width: '100%' }}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={PLANNER_HOURLY_COVERAGE} margin={{ top: 4, right: 4, left: 0, bottom: 0 }}>
                  <XAxis dataKey="hour" tick={{ fontSize: 8, fill: 'var(--text-muted)' }} />
                  <YAxis domain={[60, 100]} tick={{ fontSize: 9, fill: 'var(--text-muted)' }} />
                  <Bar dataKey="pct" radius={[2, 2, 0, 0]}>
                    {PLANNER_HOURLY_COVERAGE.map((entry, i) => (
                      <Cell key={i} fill={hourBarColor(entry.pct)} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
            <p className="text-[11px] font-mono text-(--text-muted) m-0 mt-2">
              02:00–05:00 consistently below target across all districts. Overnight positioning adjustment recommended.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}

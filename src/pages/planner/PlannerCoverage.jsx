import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { MapContainer, TileLayer, Circle, Tooltip } from 'react-leaflet'
import { AlertTriangle } from 'lucide-react'
import { useThemeStore } from '../../store/themeStore'
import MapInvalidateSize from '../../components/map/MapInvalidateSize'
import PlannerPageHeader from '../../components/planner/PlannerPageHeader'
import StatusBadge from '../../components/dispatcher/StatusBadge'
import { getDistrictCoverage, getCoverageGapDetails } from '../../api/planning'
import { listDistricts } from '../../api/districts'
import { getCoverageScoreTarget } from '../../api/admin'
import { coverageColor } from '../../data/mockPlannerData'
import 'leaflet/dist/leaflet.css'

const KIGALI_CENTER = [-1.9536, 30.0606]

function sectorFill(pct) {
  if (pct >= 85) return 'rgba(61,170,106,0.25)'
  if (pct >= 65) return 'rgba(240,120,32,0.25)'
  return 'rgba(232,53,74,0.25)'
}

export default function PlannerCoverage() {
  const { theme } = useThemeStore()
  const navigate = useNavigate()
  const [districts, setDistricts] = useState([])
  const [districtId, setDistrictId] = useState('')
  const [districtCoverage, setDistrictCoverage] = useState([])
  const [coverageGaps, setCoverageGaps] = useState([])
  const [loading, setLoading] = useState(true)
  const [coverageTarget, setCoverageTarget] = useState(60)

  useEffect(() => {
    listDistricts().then(setDistricts).catch(() => {})
    getDistrictCoverage().then(setDistrictCoverage).catch(() => {})
    getCoverageScoreTarget().then(setCoverageTarget).catch(() => {})
  }, [])

  useEffect(() => {
    Promise.resolve().then(() => setLoading(true))
    getCoverageGapDetails(districtId || undefined)
      .then(setCoverageGaps)
      .catch(() => setCoverageGaps([]))
      .finally(() => setLoading(false))
  }, [districtId])

  function handleCreatePlan(gap) {
    navigate(`/planner/deployment?zone=${encodeURIComponent(gap.zone + ' — ' + gap.district_name)}`)
  }

  const gapCount = coverageGaps.length
  const mapCircles = districtId ? districtCoverage.filter((d) => d.district_id === districtId) : districtCoverage

  return (
    <div className="portal-page flex flex-col gap-4 min-w-[1024px]">
      <PlannerPageHeader
        title="Coverage Analysis"
        subtitle="Real fleet availability vs target, by district."
      />

      <div className="flex flex-col lg:flex-row gap-4">
        <div className="flex flex-col gap-4 min-w-0 lg:flex-1">
          <div className="dispatcher-surface p-4">
            <div className="flex flex-wrap justify-between gap-2 mb-3">
              <h3 className="text-[13px] font-semibold m-0">Live Coverage Map</h3>
              <select
                className="dispatcher-input h-9 w-40 text-[12px]"
                value={districtId}
                onChange={(e) => setDistrictId(e.target.value)}
              >
                <option value="">All Districts</option>
                {districts.map((d) => (
                  <option key={d.district_id} value={d.district_id}>{d.name}</option>
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
              {mapCircles.map((d) => (
                <Circle
                  key={d.district_id}
                  center={[d.lat, d.lng]}
                  radius={1400}
                  pathOptions={{
                    fillColor: sectorFill(d.coverage_pct),
                    fillOpacity: 1,
                    color: coverageColor(d.coverage_pct),
                    weight: 2,
                  }}
                >
                  <Tooltip>
                    {d.district_name} — {d.coverage_pct}% ({d.available}/{d.total} units available)
                  </Tooltip>
                </Circle>
              ))}
            </MapContainer>
            {mapCircles.length === 0 && (
              <p className="text-[12px] text-(--text-muted) text-center mt-2 mb-0">No fleet data for this district.</p>
            )}
          </div>

          <div className="dispatcher-surface p-4">
            <h3 className="text-[13px] font-semibold m-0 mb-1">District Fleet Availability</h3>
            <p className="text-[11px] text-(--text-muted) m-0 mb-3">Real, current availability — available ÷ total units per district.</p>
            <div className="flex flex-col gap-2">
              {districtCoverage.map((d) => (
                <div key={d.district_id} className="flex items-center gap-3">
                  <span className="text-[12px] w-24 shrink-0 truncate">{d.district_name}</span>
                  <div className="flex-1 h-2 rounded-full bg-(--bg-input) overflow-hidden">
                    <div className="h-full rounded-full" style={{ width: `${d.coverage_pct}%`, background: coverageColor(d.coverage_pct) }} />
                  </div>
                  <span className="text-[11px] font-mono w-16 text-right" style={{ color: coverageColor(d.coverage_pct) }}>
                    {d.coverage_pct}%
                  </span>
                </div>
              ))}
              {districtCoverage.length === 0 && (
                <p className="text-[12px] text-(--text-muted) m-0">No fleet data available.</p>
              )}
            </div>
          </div>
        </div>

        <div className="flex flex-col gap-4 min-w-0 lg:flex-1">
          <div className="dispatcher-surface p-4 overflow-x-auto">
            <div className="flex items-center gap-2 mb-3">
              <AlertTriangle size={14} style={{ color: 'var(--status-critical)' }} />
              <h3 className="text-[13px] font-semibold m-0">Coverage Gaps — Below {coverageTarget}% Target</h3>
              <StatusBadge label={String(gapCount)} variant="critical" />
            </div>
            <table className="w-full text-[12px] border-collapse min-w-[520px]">
              <thead>
                <tr className="text-(--text-secondary) font-bold text-left">
                  <th className="pb-2 font-medium">Zone</th>
                  <th className="pb-2 font-medium">Coverage</th>
                  <th className="pb-2 font-medium">Incidents (30d)</th>
                  <th className="pb-2 font-medium">Nearest Spare Unit</th>
                  <th className="pb-2 font-medium">Recommendation</th>
                </tr>
              </thead>
              <tbody>
                {loading && (
                  <tr><td colSpan={5} className="py-6 text-center text-(--text-muted)">Loading…</td></tr>
                )}
                {!loading && coverageGaps.length === 0 && (
                  <tr><td colSpan={5} className="py-6 text-center text-(--text-muted)">No coverage gaps — every category is at or above target.</td></tr>
                )}
                {!loading && coverageGaps.map((row, i) => (
                  <tr key={`${row.zone}-${row.district_id}-${i}`} className="border-t border-(--border-subtle)">
                    <td className="py-2 font-medium text-[13px]">{row.zone} — {row.district_name}</td>
                    <td className="py-2 font-mono font-semibold" style={{ color: coverageColor(row.coverage) }}>
                      {row.coverage}%
                    </td>
                    <td className="py-2 font-mono">{row.district_incidents_30d}</td>
                    <td className="py-2 font-mono text-(--text-secondary)">
                      {row.nearest_unit_plate
                        ? `${row.nearest_unit_plate} · ${row.nearest_unit_distance_km}km`
                        : 'None available'}
                    </td>
                    <td className="py-2">
                      <span className="text-(--text-secondary)">{row.recommendation}</span>
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
        </div>
      </div>
    </div>
  )
}

import { useState, useEffect } from 'react'
import { AlertTriangle } from 'lucide-react'
import MetricCard from '../../components/dispatcher/MetricCard'
import DCPageHeader from '../../components/district-commander/DCPageHeader'
import { getDistrictCommanderDistrict } from '../../utils/districtCommanderSession'
import { getPerformanceScoreStyle } from '../../data/mockDistrictCommanderData'
import { listVehicles } from '../../api/vehicles'
import { computeUnitPerformance } from '../../api/reporting'
import { getCurrentUser } from '../../utils/authSession'

function currentPeriod() {
  const now = new Date()
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`
}

function fmtTime(minutes) {
  if (minutes == null) return '—'
  return `${Number(minutes).toFixed(1)}m`
}

function fmtPct(rate) {
  if (rate == null) return '—'
  return `${Math.round(rate * 100)}%`
}

function scoreFromPerf(perf) {
  if (!perf) return null
  if (perf.on_time_rate != null) return Math.round(perf.on_time_rate * 100)
  return null
}

export default function DCUnits() {
  const district = getDistrictCommanderDistrict()
  const districtId = getCurrentUser()?.district_id

  const [units, setUnits] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    if (!districtId) { Promise.resolve().then(() => setLoading(false)); return }
    const period = currentPeriod()
    listVehicles({ districtId })
      .then(async (vehicles) => {
        // Nothing in the app ever called the compute endpoint, so
        // unit_performance rows never existed — trigger a real computation
        // for each of this district's vehicles (from actual dispatch/
        // response-time/AI-acceptance history) instead of just reading an
        // always-empty cache.
        const results = await Promise.allSettled(
          vehicles.map((v) => computeUnitPerformance(v.vehicle_id, period))
        )
        setUnits(vehicles.map((v, i) => {
          const result = results[i]
          const perf = result.status === 'fulfilled' ? result.value : null
          return { ...v, perf, score: scoreFromPerf(perf) }
        }))
      })
      .catch(() => setError('Failed to load unit data'))
      .finally(() => setLoading(false))
  }, [districtId])

  const attention = units.filter((u) => u.score != null && u.score < 70)

  const avgScore = units.filter((u) => u.score != null).length
    ? Math.round(units.filter((u) => u.score != null).reduce((a, u) => a + u.score, 0) / units.filter((u) => u.score != null).length)
    : null

  return (
    <div className="portal-page flex flex-col gap-6">
      <DCPageHeader title="Unit Performance" eyebrow="District Commander" subtitle={district ? `All units assigned to ${district} District.` : 'All units in your district.'} />

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <MetricCard label="Total Units" value={loading ? '—' : String(units.length)} />
        <MetricCard label="Avg Performance Score" value={loading ? '—' : (avgScore != null ? `${avgScore}%` : '—')} />
        <MetricCard
          label="Units Needing Attention"
          value={loading ? '—' : String(attention.length)}
          hintTone={attention.length > 0 ? 'critical' : 'positive'}
          className={attention.length > 0 ? 'border border-(--status-critical)' : ''}
        />
      </div>

      <div className="dispatcher-surface table-scroll">
        <table className="w-full min-w-[960px] text-left border-collapse text-[12px]">
          <thead>
            <tr className="text-[10px] uppercase tracking-wide text-(--text-muted) border-b border-(--border-subtle)">
              <th className="py-2 px-3">Plate</th>
              <th className="py-2 px-3">Type</th>
              <th className="py-2 px-3">Agency</th>
              <th className="py-2 px-3">Incidents</th>
              <th className="py-2 px-3">Avg Response</th>
              <th className="py-2 px-3">On-Time Rate</th>
              <th className="py-2 px-3">Performance</th>
              <th className="py-2 px-3">Status</th>
            </tr>
          </thead>
          <tbody>
            {loading && (
              <tr><td colSpan={8} className="py-6 text-center text-[13px] text-(--text-muted)">Loading units…</td></tr>
            )}
            {error && !loading && (
              <tr><td colSpan={8} className="py-6 text-center text-[13px]" style={{ color: 'var(--status-critical)' }}>{error}</td></tr>
            )}
            {!loading && !error && units.length === 0 && (
              <tr><td colSpan={8} className="py-6 text-center text-[13px] text-(--text-muted)">No units found for this district.</td></tr>
            )}
            {!loading && !error && units.map((u) => {
              const scoreStyle = u.score != null ? getPerformanceScoreStyle(u.score) : {}
              return (
                <tr key={u.vehicle_id} className="border-b border-(--border-subtle)">
                  <td className="py-3 px-3 font-mono font-bold text-(--accent)">{u.plate_number}</td>
                  <td className="py-3 px-3">{u.vehicle_type}</td>
                  <td className="py-3 px-3 text-(--text-secondary)">{u.agency_name ?? '—'}</td>
                  <td className="py-3 px-3 font-mono">{u.perf?.incidents_resolved ?? '—'}</td>
                  <td className="py-3 px-3 font-mono">{fmtTime(u.perf?.avg_response_time)}</td>
                  <td className="py-3 px-3 font-mono">{fmtPct(u.perf?.on_time_rate)}</td>
                  <td className="py-3 px-3">
                    {u.score != null ? (
                      <span className="inline-flex px-2 py-0.5 rounded text-[11px] font-bold font-mono" style={scoreStyle}>
                        {u.score}%
                      </span>
                    ) : (
                      <span className="text-(--text-muted) text-[11px]">—</span>
                    )}
                  </td>
                  <td className="py-3 px-3 text-(--text-secondary) capitalize">{u.status}</td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>

      {attention.length > 0 && (
        <div className="dispatcher-surface p-4" style={{ borderLeft: '4px solid var(--status-critical)' }}>
          <div className="flex items-center gap-2 mb-3">
            <AlertTriangle size={18} style={{ color: 'var(--status-critical)' }} />
            <h2 className="text-[14px] font-bold m-0 text-(--text-primary)">Units Requiring Attention</h2>
          </div>
          <ul className="m-0 pl-4 text-[12px] text-(--text-secondary) space-y-2">
            {attention.map((u) => (
              <li key={u.vehicle_id}>
                <span className="font-mono font-bold text-(--accent)">{u.plate_number}</span> — Below performance threshold (score: {u.score}%)
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  )
}

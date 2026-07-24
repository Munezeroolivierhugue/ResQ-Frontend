import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { Play, ArrowRight, Plus, Loader2 } from 'lucide-react'
import PlannerPageHeader from '../../components/planner/PlannerPageHeader'
import SectionTitle from '../../components/dispatcher/SectionTitle'
import { listSimulations, runSimulation as apiRunSimulation } from '../../api/planning'
import { listDistricts } from '../../api/districts'
import { getCoverageScoreTarget } from '../../api/admin'

const SCENARIOS = [
  'Flash Flood — Kigali',
  'Mass Casualty Event',
  'Major Public Gathering',
  'Extended Power Outage',
  'Multi-District Traffic Crisis',
  'Custom Scenario',
]
const DURATIONS = [
  { label: '1 hour', hours: 1 },
  { label: '4 hours', hours: 4 },
  { label: '8 hours', hours: 8 },
  { label: '24 hours', hours: 24 },
  { label: '48 hours', hours: 48 },
]

function fmtTime(min) {
  return min != null ? `${min.toFixed(1)}m` : '—'
}

function ResultCard({ title, result, tone, coverageTarget }) {
  if (!result) return null
  const overTarget = result.target_response_time != null && result.projected_response_time > result.target_response_time
  return (
    <div
      className="flex-1 rounded-lg p-4"
      style={tone === 'accent' ? { background: 'var(--status-low-bg)', border: '1px solid var(--status-low)' } : { background: 'var(--bg-elevated)' }}
    >
      <div className="text-[10px] font-mono uppercase mb-3" style={tone === 'accent' ? { color: 'var(--status-low)' } : { color: 'var(--text-muted)' }}>
        {title}
      </div>
      {[
        ['Projected incidents', String(result.projected_incidents ?? '—'), null],
        [
          `Avg response time (target ${result.target_response_time ?? '—'}m)`,
          fmtTime(result.projected_response_time),
          overTarget ? 'var(--status-critical)' : 'var(--status-low)',
        ],
        ['Coverage score', `${result.projected_coverage ?? '—'}%`, result.projected_coverage < coverageTarget ? 'var(--status-critical)' : 'var(--accent)'],
        ['Units', result.units_short > 0 ? `${result.units_short} short of ${result.units_available}/${result.units_total}` : `${result.units_available}/${result.units_total} sufficient`, result.units_short > 0 ? 'var(--status-critical)' : 'var(--status-low)'],
      ].map(([label, val, color]) => (
        <div key={label} className="flex justify-between text-[12px] mb-2">
          <span className="text-(--text-secondary)">{label}</span>
          <span className="font-mono font-semibold text-[14px]" style={{ color: color || 'var(--text-primary)' }}>
            {val}
          </span>
        </div>
      ))}
      {overTarget && (
        <div className="text-[11px] mt-1 pt-2 border-t border-(--border-subtle)" style={{ color: 'var(--status-critical)' }}>
          ⚠ Exceeds the national {result.target_response_time}-minute target
        </div>
      )}
    </div>
  )
}

const SCENARIOS_PAGE_SIZE = 6

export default function PlannerSimulation() {
  const [districts, setDistricts] = useState([])
  const [districtId, setDistrictId] = useState('')
  const [disasterScenario, setDisasterScenario] = useState(SCENARIOS[2])
  const [durationHours, setDurationHours] = useState(4)
  const [multiplier, setMultiplier] = useState(3)
  const [loading, setLoading] = useState(false)
  const [currentResult, setCurrentResult] = useState(null)
  const [optimizedResult, setOptimizedResult] = useState(null)
  const [savedScenarios, setSavedScenarios] = useState([])
  const [runError, setRunError] = useState(null)
  const [scenariosPage, setScenariosPage] = useState(1)
  const [coverageTarget, setCoverageTarget] = useState(60)

  // Excludes legacy rows saved before scenario config existed — they carry
  // no disaster_scenario/focus_area and share identical fabricated-looking
  // values (12.8m / 75% on every one), so they aren't real simulation runs.
  const accurateScenarios = savedScenarios.filter((s) => s.disaster_scenario != null && s.focus_area != null)
  const totalScenarioPages = Math.max(1, Math.ceil(accurateScenarios.length / SCENARIOS_PAGE_SIZE))
  const pagedScenarios = accurateScenarios.slice(
    (scenariosPage - 1) * SCENARIOS_PAGE_SIZE,
    scenariosPage * SCENARIOS_PAGE_SIZE
  )

  useEffect(() => {
    listDistricts().then(setDistricts).catch(() => {})
    listSimulations().then(setSavedScenarios).catch(() => setSavedScenarios([]))
    getCoverageScoreTarget().then(setCoverageTarget).catch(() => {})
  }, [])

  const runBoth = async (params) => {
    setLoading(true)
    setRunError(null)
    setCurrentResult(null)
    setOptimizedResult(null)
    try {
      const [current, optimized] = await Promise.all([
        apiRunSimulation({ ...params, scenario_type: 'CURRENT_RESOURCES' }),
        apiRunSimulation({ ...params, scenario_type: 'AI_OPTIMIZED' }),
      ])
      setCurrentResult(current)
      setOptimizedResult(optimized)
      setSavedScenarios((prev) => [optimized, current, ...prev])
      setScenariosPage(1)
    } catch {
      setRunError('Could not run simulation — please retry.')
    } finally {
      setLoading(false)
    }
  }

  const runSimulation = () => runBoth({
    disaster_scenario: disasterScenario,
    multiplier: Math.round(multiplier),
    duration_hours: durationHours,
    district_id: districtId || null,
  })

  const rerun = (sim) => {
    const district = districts.find((d) => d.name === sim.focus_area)
    setDistrictId(district?.district_id ?? '')
    setDisasterScenario(sim.disaster_scenario ?? SCENARIOS[2])
    setDurationHours(sim.duration_hours ?? 4)
    setMultiplier(sim.multiplier ?? 1)
    runBoth({
      disaster_scenario: sim.disaster_scenario,
      multiplier: Math.round(sim.multiplier ?? 1),
      duration_hours: sim.duration_hours ?? 4,
      district_id: district?.district_id ?? null,
    })
  }

  return (
    <div className="portal-page flex flex-col gap-4 min-w-[1024px]">
      <PlannerPageHeader
        title="Simulation Workspace"
        subtitle="Test system performance under load, using this district's real incident and fleet data."
      />

      <div className="flex flex-col lg:flex-row gap-4 items-start">
        <div className="dispatcher-surface p-4 lg:flex-[2] min-w-0">
          <SectionTitle title="Scenario Configuration" />
          <div className="flex flex-col gap-3 mt-4">
            <label className="text-[12px] font-medium text-(--text-secondary)">
              Scenario type *
              <select
                className="dispatcher-input h-10 w-full mt-1"
                value={disasterScenario}
                onChange={(e) => setDisasterScenario(e.target.value)}
              >
                {SCENARIOS.map((s) => (
                  <option key={s}>{s}</option>
                ))}
              </select>
            </label>
            <label className="text-[12px] font-medium text-(--text-secondary)">
              Simulation duration
              <select
                className="dispatcher-input h-10 w-full mt-1"
                value={durationHours}
                onChange={(e) => setDurationHours(Number(e.target.value))}
              >
                {DURATIONS.map((d) => (
                  <option key={d.label} value={d.hours}>{d.label}</option>
                ))}
              </select>
            </label>
            <div>
              <div className="text-[12px] font-medium text-(--text-secondary)">Incident multiplier</div>
              <p className="text-[11px] text-(--text-muted) m-0 mt-0.5">
                How many times more incidents than the real 30-day baseline for this district
              </p>
              <div className="text-[20px] font-bold text-(--accent) my-2">{multiplier}×</div>
              <input
                type="range"
                min={1}
                max={10}
                step={0.5}
                value={multiplier}
                onChange={(e) => setMultiplier(Number(e.target.value))}
                className="w-full accent-(--accent)"
              />
            </div>
            <label className="text-[12px] font-medium text-(--text-secondary)">
              Focus area
              <select
                className="dispatcher-input h-10 w-full mt-1"
                value={districtId}
                onChange={(e) => setDistrictId(e.target.value)}
              >
                <option value="">All Districts</option>
                {districts.map((d) => (
                  <option key={d.district_id} value={d.district_id}>{d.name}</option>
                ))}
              </select>
            </label>
            <p className="text-[11px] text-(--text-muted) m-0">
              Every run computes both a <strong>Current Deployment</strong> result (this district's own fleet) and an{' '}
              <strong>AI Optimized</strong> result (pooling every available same-scope unit citywide) side by side.
            </p>
            {runError && (
              <div className="text-[12px] px-3 py-2 rounded" style={{ background: 'var(--status-critical-bg)', color: 'var(--status-critical)' }}>
                {runError}
              </div>
            )}
            <button
              type="button"
              className="dispatcher-btn-primary w-full h-14 text-[15px] font-bold flex items-center justify-center gap-2 mt-2"
              style={{ boxShadow: '0 4px 20px color-mix(in srgb, var(--accent) 30%, transparent)' }}
              onClick={runSimulation}
              disabled={loading}
            >
              {loading ? (
                <>
                  <Loader2 size={20} className="animate-spin" />
                  Analyzing scenario...
                </>
              ) : (
                <>
                  <Play size={20} />
                  RUN SIMULATION
                </>
              )}
            </button>
          </div>
        </div>

        <div className="flex flex-col gap-4 min-w-0 lg:flex-[3]">
          <div className="dispatcher-surface p-4">
            <div className="flex flex-wrap justify-between gap-2 mb-4">
              <h3 className="text-[13px] font-semibold m-0">Simulation Results</h3>
              {currentResult && !loading && (
                <span className="text-[11px] font-mono text-(--text-muted)">
                  {disasterScenario.toUpperCase()} · {multiplier}× baseline · {durationHours}h · {currentResult.focus_area}
                </span>
              )}
            </div>

            {loading && (
              <p className="text-[13px] text-(--text-secondary) text-center py-8">Running scenario model…</p>
            )}

            {!loading && !currentResult && (
              <p className="text-[13px] text-(--text-muted) text-center py-8">Configure a scenario and run it to see results.</p>
            )}

            {currentResult && optimizedResult && !loading && (
              <>
                <div className="text-[12px] text-(--text-secondary) mb-3 pb-3 border-b border-(--border-subtle)">
                  <strong className="text-(--text-primary)">Real baseline</strong> for {currentResult.focus_area} (last 30 days, before this scenario): avg response {fmtTime(currentResult.baseline_response_time)} against a national target of {currentResult.target_response_time}m,
                  {' '}~{(currentResult.projected_incidents / multiplier).toFixed(1)} incidents/day, {currentResult.units_available}/{currentResult.units_total} units available now.
                  The two cards below show what the model projects if incident volume rises to <strong>{multiplier}×</strong> that baseline for {durationHours}h.
                </div>
                <div className="flex flex-col md:flex-row items-stretch gap-3">
                  <ResultCard title="Current Deployment" result={currentResult} coverageTarget={coverageTarget} />
                  <div className="flex flex-col items-center justify-center px-2 shrink-0">
                    <ArrowRight size={24} className="text-(--text-muted)" />
                    <span className="text-[12px] text-(--text-muted)">vs</span>
                  </div>
                  <ResultCard title="AI Optimized" result={optimizedResult} tone="accent" coverageTarget={coverageTarget} />
                </div>

                <div
                  className="mt-3 p-3.5 rounded-lg"
                  style={{ background: 'var(--accent-ghost)', border: '1px solid var(--accent)' }}
                >
                  <p className="text-[13px] text-(--text-primary) m-0">
                    Pooling units citywide changes response time from {fmtTime(currentResult.projected_response_time)} to{' '}
                    {fmtTime(optimizedResult.projected_response_time)}, and coverage from {currentResult.projected_coverage}%
                    to {optimizedResult.projected_coverage}%, based on real fleet and incident data.
                  </p>
                  {optimizedResult.units_short > 0 && (
                    <p className="text-[12px] text-(--text-secondary) m-0 mt-1.5">
                      Even pooled citywide, {optimizedResult.units_short} more unit{optimizedResult.units_short === 1 ? '' : 's'} would be needed to meet demand.
                    </p>
                  )}
                  <div className="flex flex-wrap gap-2 mt-3">
                    <Link to="/planner/deployment" className="dispatcher-btn-primary text-[12px] inline-flex items-center gap-1 no-underline">
                      <Plus size={14} />
                      Create Deployment Plan
                    </Link>
                  </div>
                </div>
              </>
            )}
          </div>

          <div className="dispatcher-surface p-4">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-[13px] font-semibold m-0">Saved Scenarios</h3>
              {accurateScenarios.length > 0 && (
                <span className="text-[11px] text-(--text-muted)">{accurateScenarios.length} total</span>
              )}
            </div>
            {accurateScenarios.length === 0 && (
              <p className="text-[12px] text-(--text-muted) m-0">No simulations run yet.</p>
            )}
            {pagedScenarios.map((row, i) => (
              <div
                key={row.simulation_id ?? i}
                className="flex flex-wrap items-center gap-2 py-2 border-t border-(--border-subtle) text-[12px]"
              >
                <span className="font-medium flex-1 min-w-[140px]">
                  {row.disaster_scenario} · {row.multiplier}× · {row.focus_area}
                </span>
                <span className="text-(--text-secondary)">{row.scenario_type === 'AI_OPTIMIZED' ? 'AI Optimized' : 'Current'}</span>
                <span className="font-mono text-(--text-muted)">
                  {row.created_at ? new Date(row.created_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' }) : '—'}
                </span>
                <span>{row.projected_coverage != null ? `${row.projected_coverage}% coverage` : '—'}</span>
                <button
                  type="button"
                  className="dispatcher-btn-ghost text-[11px] py-1 px-2 ml-auto"
                  onClick={() => rerun(row)}
                  disabled={loading}
                >
                  Rerun
                </button>
              </div>
            ))}
            {totalScenarioPages > 1 && (
              <div className="flex justify-between items-center pt-3 mt-1 border-t border-(--border-subtle)">
                <span className="text-[11px] text-(--text-muted)">
                  Page {scenariosPage} of {totalScenarioPages}
                </span>
                <div className="flex gap-2">
                  <button
                    type="button"
                    className="dispatcher-btn-ghost text-[11px] h-7 px-2"
                    disabled={scenariosPage <= 1}
                    onClick={() => setScenariosPage((p) => p - 1)}
                  >
                    Previous
                  </button>
                  <button
                    type="button"
                    className="dispatcher-btn-ghost text-[11px] h-7 px-2"
                    disabled={scenariosPage >= totalScenarioPages}
                    onClick={() => setScenariosPage((p) => p + 1)}
                  >
                    Next
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

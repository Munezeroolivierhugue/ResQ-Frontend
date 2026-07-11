import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { Play, ArrowRight, FileDown, Plus, Loader2 } from 'lucide-react'
import PlannerPageHeader from '../../components/planner/PlannerPageHeader'
import SectionTitle from '../../components/dispatcher/SectionTitle'
import { getCurrentUser } from '../../utils/authSession'
import { listSimulations, runSimulation as apiRunSimulation } from '../../api/planning'

const SCENARIOS = [
  'Flash Flood — Kigali',
  'Mass Casualty Event',
  'Major Public Gathering',
  'Extended Power Outage',
  'Multi-District Traffic Crisis',
  'Custom Scenario',
]

export default function PlannerSimulation() {
  const [multiplier, setMultiplier] = useState(3)
  const [resourceMode, setResourceMode] = useState('current')
  const [loading, setLoading] = useState(false)
  const [showResults, setShowResults] = useState(true)
  const [savedScenarios, setSavedScenarios] = useState([])

  useEffect(() => {
    listSimulations().then((sims) => {
      setSavedScenarios(sims.map((s) => ({
        id: s.simulation_id,
        name: s.scenario_type ? `${s.scenario_type} · ${s.multiplier ?? 1}×` : '—',
        scenario_type: s.scenario_type ?? '—',
        created_at: s.ran_at
          ? new Date(s.ran_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })
          : '—',
        result_summary: s.coverage_score != null ? `${Math.round(s.coverage_score)}% coverage` : '—',
      })))
    }).catch(() => setSavedScenarios([]))
  }, [])

  const runSimulation = async () => {
    setLoading(true)
    setShowResults(false)
    try {
      const scenario_type = resourceMode === 'ai' ? 'AI_OPTIMIZED' : 'CURRENT_RESOURCES'

      const newSim = await apiRunSimulation({
        scenario_type,
        multiplier: Math.round(multiplier),
        duration_hours: 4,
        focus_area: null,
      })

      const scenarioEntry = {
        id: newSim.simulation_id ?? Math.random().toString(36).slice(2),
        name: `${newSim.scenario_type ?? scenario_type} · ${newSim.multiplier ?? multiplier}×`,
        scenario_type: newSim.scenario_type ?? scenario_type,
        created_at: new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'short' }),
        result_summary: newSim.coverage_score != null ? `${Math.round(newSim.coverage_score)}% coverage` : '—',
      }

      setSavedScenarios((prev) => [scenarioEntry, ...prev])
      setLoading(false)
      setShowResults(true)
    } catch (err) {
      console.error(err)
      setLoading(false)
    }
  }

  return (
    <div className="portal-page flex flex-col gap-4 min-w-[1024px]">
      <PlannerPageHeader
        title="Simulation Workspace"
        subtitle="Test system performance under major emergency scenarios."
      />

      <div className="flex flex-col lg:flex-row gap-4">
        <div className="dispatcher-surface p-4 lg:flex-[2] min-w-0">
          <SectionTitle title="Scenario Configuration" />
          <div className="flex flex-col gap-3 mt-4">
            <label className="text-[12px] font-medium text-(--text-secondary)">
              Scenario type *
              <select className="dispatcher-input h-10 w-full mt-1" defaultValue="Major Public Gathering">
                {SCENARIOS.map((s) => (
                  <option key={s}>{s}</option>
                ))}
              </select>
            </label>
            <label className="text-[12px] font-medium text-(--text-secondary)">
              Simulation duration
              <select className="dispatcher-input h-10 w-full mt-1" defaultValue="4 hours">
                {['1 hour', '4 hours', '8 hours', '24 hours', '48 hours'].map((d) => (
                  <option key={d}>{d}</option>
                ))}
              </select>
            </label>
            <div>
              <div className="text-[12px] font-medium text-(--text-secondary)">Incident multiplier</div>
              <p className="text-[11px] text-(--text-muted) m-0 mt-0.5">
                How many times more incidents than normal baseline
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
              <select className="dispatcher-input h-10 w-full mt-1" defaultValue="All Kigali">
                <option>All Kigali</option>
                <option>Nyarugenge</option>
                <option>Kicukiro</option>
                <option>Gasabo</option>
                <option>Specific sector</option>
              </select>
            </label>
            <div>
              <div className="text-[12px] font-medium text-(--text-secondary) mb-2">Resource scenario</div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {[
                  { id: 'current', label: 'Current deployment' },
                  { id: 'ai', label: 'AI optimized deployment' },
                ].map((opt) => (
                  <button
                    key={opt.id}
                    type="button"
                    className="p-3 rounded-lg border text-left text-[12px] cursor-pointer"
                    style={{
                      background: resourceMode === opt.id ? 'var(--accent-ghost)' : 'var(--bg-elevated)',
                      borderColor: resourceMode === opt.id ? 'var(--accent)' : 'var(--border)',
                    }}
                    onClick={() => setResourceMode(opt.id)}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>
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
              {showResults && !loading && (
                <span className="text-[11px] font-mono text-(--text-muted)">
                  AMAHORO STADIUM EVENT · {multiplier}× baseline · 4h
                </span>
              )}
            </div>

            {loading && (
              <p className="text-[13px] text-(--text-secondary) text-center py-8">Running scenario model…</p>
            )}

            {showResults && !loading && (
              <>
                <div className="flex flex-col md:flex-row items-stretch gap-3">
                  <div className="flex-1 rounded-lg p-4" style={{ background: 'var(--bg-elevated)' }}>
                    <div className="text-[10px] font-mono uppercase text-(--text-muted) mb-3">Current Deployment</div>
                    {[
                      ['Projected incidents', '247', null],
                      ['Avg response time', '11.4m', 'var(--status-critical)'],
                      ['Coverage score', '71%', 'var(--status-critical)'],
                      ['Units insufficient', '8 units short', 'var(--status-critical)'],
                    ].map(([label, val, color]) => (
                      <div key={label} className="flex justify-between text-[12px] mb-2">
                        <span className="text-(--text-secondary)">{label}</span>
                        <span className="font-mono font-semibold text-[14px]" style={{ color: color || 'var(--text-primary)' }}>
                          {val}
                        </span>
                      </div>
                    ))}
                  </div>
                  <div className="flex flex-col items-center justify-center px-2 shrink-0">
                    <ArrowRight size={24} className="text-(--text-muted)" />
                    <span className="text-[12px] text-(--text-muted)">vs</span>
                  </div>
                  <div
                    className="flex-1 rounded-lg p-4"
                    style={{ background: 'var(--status-low-bg)', border: '1px solid var(--status-low)' }}
                  >
                    <div className="text-[10px] font-mono uppercase mb-3" style={{ color: 'var(--status-low)' }}>
                      AI Optimized
                    </div>
                    {[
                      ['Projected incidents', '247', null],
                      ['Avg response time', '8.1m', 'var(--status-low)'],
                      ['Coverage score', '89%', 'var(--accent)'],
                      ['Units needed', '+4 units', 'var(--status-medium)'],
                    ].map(([label, val, color]) => (
                      <div key={label} className="flex justify-between text-[12px] mb-2">
                        <span className="text-(--text-secondary)">{label}</span>
                        <span className="font-mono font-semibold text-[14px]" style={{ color: color || 'var(--text-primary)' }}>
                          {val}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                <div
                  className="mt-3 p-3.5 rounded-lg"
                  style={{ background: 'var(--accent-ghost)', border: '1px solid var(--accent)' }}
                >
                  <p className="text-[13px] text-(--text-primary) m-0">
                    AI optimization reduces response time by 3.3 minutes and improves coverage from 71% to 89% for
                    this scenario.
                  </p>
                  <p className="text-[12px] text-(--text-secondary) m-0 mt-1.5">
                    Requires 4 additional units or redeployment from surrounding districts.
                  </p>
                  <div className="flex flex-wrap gap-2 mt-3">
                    <button type="button" className="dispatcher-btn-outline text-[12px] inline-flex items-center gap-1">
                      <FileDown size={14} />
                      Export as Resource Request
                    </button>
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
            <h3 className="text-[13px] font-semibold m-0 mb-3">Saved Scenarios</h3>
            {savedScenarios.map((row, i) => (
              <div
                key={row.id ?? i}
                className="flex flex-wrap items-center gap-2 py-2 border-t border-(--border-subtle) text-[12px]"
              >
                <span className="font-medium flex-1 min-w-[140px]">{row.name}</span>
                <span className="text-(--text-secondary)">{row.scenario_type}</span>
                <span className="font-mono text-(--text-muted)">{row.created_at}</span>
                <span>{row.result_summary}</span>
                <button type="button" className="dispatcher-btn-ghost text-[11px] py-1 px-2 ml-auto">
                  Rerun
                </button>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
